-- Migration: Add expert routing capabilities to verdict requests
-- This enables Pro tier expert-only routing and improves request assignment

-- Add routing fields to verdict_requests table
ALTER TABLE verdict_requests ADD COLUMN IF NOT EXISTS expert_only BOOLEAN DEFAULT FALSE;
ALTER TABLE verdict_requests ADD COLUMN IF NOT EXISTS routing_strategy TEXT CHECK (routing_strategy IN ('expert_only', 'mixed', 'community'));
ALTER TABLE verdict_requests ADD COLUMN IF NOT EXISTS routed_at TIMESTAMPTZ;
ALTER TABLE verdict_requests ADD COLUMN IF NOT EXISTS expert_pool_size INTEGER;
ALTER TABLE verdict_requests ADD COLUMN IF NOT EXISTS priority_score DECIMAL(4,2) DEFAULT 1.0;

-- Add activity tracking to user_credits for expert availability
ALTER TABLE user_credits ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT NOW();

-- Create expert_queue_preferences table for personalized routing
CREATE TABLE expert_queue_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    preferred_categories TEXT[] DEFAULT ARRAY['career', 'business', 'lifestyle', 'appearance']::TEXT[],
    availability_window JSONB DEFAULT '{"days": ["monday", "tuesday", "wednesday", "thursday", "friday"], "hours": {"start": 9, "end": 17}}'::JSONB,
    max_daily_reviews INTEGER DEFAULT 10,
    min_reputation_threshold DECIMAL(3,2) DEFAULT 5.0,
    auto_accept_expert_requests BOOLEAN DEFAULT TRUE,
    notification_preferences JSONB DEFAULT '{"email": true, "in_app": true, "urgent_only": false}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create request_assignments table to track expert assignments
CREATE TABLE request_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES verdict_requests(id) ON DELETE CASCADE,
    assigned_to UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assignment_type TEXT NOT NULL CHECK (assignment_type IN ('auto', 'manual', 'priority')),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    assignment_score DECIMAL(4,2), -- How well this expert matches the request
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'completed')),
    
    -- Prevent duplicate assignments
    UNIQUE(request_id, assigned_to)
);

-- Add indexes for performance
CREATE INDEX idx_verdict_requests_routing ON verdict_requests(routing_strategy, request_tier);
CREATE INDEX idx_verdict_requests_expert_only ON verdict_requests(expert_only) WHERE expert_only = true;
CREATE INDEX idx_verdict_requests_routed_at ON verdict_requests(routed_at);
CREATE INDEX idx_user_credits_last_active ON user_credits(last_active);
CREATE INDEX idx_expert_queue_preferences_user ON expert_queue_preferences(user_id);
CREATE INDEX idx_request_assignments_request ON request_assignments(request_id);
CREATE INDEX idx_request_assignments_assigned_to ON request_assignments(assigned_to, status);
CREATE INDEX idx_request_assignments_expires_at ON request_assignments(expires_at) WHERE status = 'pending';

-- Create function to auto-route new requests
CREATE OR REPLACE FUNCTION auto_route_request()
RETURNS TRIGGER AS $$
BEGIN
    -- Set expert_only for Pro tier requests
    IF NEW.request_tier = 'pro' THEN
        NEW.expert_only = TRUE;
        NEW.routing_strategy = 'expert_only';
    ELSIF NEW.request_tier = 'standard' THEN
        NEW.routing_strategy = 'mixed';
    ELSE
        NEW.routing_strategy = 'community';
    END IF;
    
    -- Set initial priority score based on tier
    NEW.priority_score = CASE 
        WHEN NEW.request_tier = 'pro' THEN 3.0
        WHEN NEW.request_tier = 'standard' THEN 2.0
        ELSE 1.0
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to auto-route new requests
CREATE TRIGGER trigger_auto_route_request
    BEFORE INSERT ON verdict_requests
    FOR EACH ROW EXECUTE FUNCTION auto_route_request();

-- Create function to assign experts to requests
CREATE OR REPLACE FUNCTION assign_experts_to_request(
    p_request_id UUID,
    p_max_assignments INTEGER DEFAULT 3
) RETURNS INTEGER AS $$
DECLARE
    request_record RECORD;
    expert_record RECORD;
    assignment_count INTEGER := 0;
    max_experts INTEGER;
BEGIN
    -- Get request details
    SELECT * INTO request_record 
    FROM verdict_requests 
    WHERE id = p_request_id AND status IN ('open', 'in_progress');
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Determine max experts based on tier
    max_experts = LEAST(p_max_assignments, request_record.target_verdict_count);
    
    -- Get suitable experts based on routing strategy
    FOR expert_record IN
        SELECT DISTINCT uc.user_id, uc.reputation_score, ev.industry, ev.job_title
        FROM user_credits uc
        INNER JOIN profiles p ON uc.user_id = p.id
        LEFT JOIN expert_verifications ev ON uc.user_id = ev.user_id 
            AND ev.verification_status = 'verified'
        LEFT JOIN request_assignments ra ON ra.assigned_to = uc.user_id 
            AND ra.request_id = p_request_id
        WHERE p.is_judge = true
            AND uc.reviewer_status = 'active'
            AND uc.user_id != request_record.user_id -- Not request owner
            AND ra.id IS NULL -- Not already assigned
            AND (
                -- Expert-only routing
                (request_record.routing_strategy = 'expert_only' AND ev.id IS NOT NULL AND uc.reputation_score >= 8.0)
                OR
                -- Mixed routing (experts + high-reputation community)
                (request_record.routing_strategy = 'mixed' AND uc.reputation_score >= 6.5)
                OR
                -- Community routing
                (request_record.routing_strategy = 'community' AND uc.reputation_score >= 5.0)
            )
        ORDER BY 
            -- Prioritize experts for expert_only and mixed
            CASE WHEN ev.id IS NOT NULL THEN 1 ELSE 2 END,
            uc.reputation_score DESC,
            uc.last_active DESC NULLS LAST
        LIMIT max_experts
    LOOP
        -- Create assignment
        INSERT INTO request_assignments (
            request_id,
            assigned_to,
            assignment_type,
            assignment_score
        ) VALUES (
            p_request_id,
            expert_record.user_id,
            'auto',
            expert_record.reputation_score
        );
        
        assignment_count := assignment_count + 1;
        
        EXIT WHEN assignment_count >= max_experts;
    END LOOP;
    
    -- Update request routing timestamp
    UPDATE verdict_requests 
    SET 
        routed_at = NOW(),
        expert_pool_size = assignment_count
    WHERE id = p_request_id;
    
    RETURN assignment_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up expired assignments
CREATE OR REPLACE FUNCTION cleanup_expired_assignments()
RETURNS INTEGER AS $$
DECLARE
    cleanup_count INTEGER;
BEGIN
    -- Mark expired assignments as expired
    UPDATE request_assignments 
    SET status = 'expired' 
    WHERE status = 'pending' 
        AND expires_at < NOW();
    
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    
    -- Could also reassign to other experts here if needed
    
    RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql;

-- RLS policies for new tables
ALTER TABLE expert_queue_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_assignments ENABLE ROW LEVEL SECURITY;

-- Expert queue preferences policies
CREATE POLICY "Users can manage own queue preferences" ON expert_queue_preferences
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Request assignments policies
CREATE POLICY "Users can view assignments for their requests" ON request_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM verdict_requests vr 
            WHERE vr.id = request_id AND vr.user_id = auth.uid()
        )
    );

CREATE POLICY "Experts can view their assignments" ON request_assignments
    FOR SELECT USING (auth.uid() = assigned_to);

CREATE POLICY "Experts can update their assignment status" ON request_assignments
    FOR UPDATE USING (auth.uid() = assigned_to);

-- Create view for expert dashboard
CREATE OR REPLACE VIEW expert_dashboard AS
SELECT 
    p.id as user_id,
    p.display_name,
    ev.job_title,
    ev.company,
    ev.industry,
    uc.reputation_score,
    uc.total_reviews,
    uc.reviewer_status,
    uc.last_active,
    
    -- Assignment stats
    (SELECT COUNT(*) FROM request_assignments ra 
     WHERE ra.assigned_to = p.id AND ra.status = 'pending') as pending_assignments,
    
    (SELECT COUNT(*) FROM request_assignments ra 
     WHERE ra.assigned_to = p.id 
     AND ra.assigned_at >= NOW() - INTERVAL '7 days') as recent_assignments,
    
    -- Performance metrics
    (SELECT AVG(rr.rating) FROM reviewer_ratings rr
     JOIN verdict_responses vr ON rr.response_id = vr.id
     WHERE vr.judge_id = p.id 
     AND rr.created_at >= NOW() - INTERVAL '30 days') as recent_rating,
     
    eqp.preferred_categories,
    eqp.max_daily_reviews,
    eqp.availability_window

FROM profiles p
INNER JOIN expert_verifications ev ON p.id = ev.user_id AND ev.verification_status = 'verified'
INNER JOIN user_credits uc ON p.id = uc.user_id
LEFT JOIN expert_queue_preferences eqp ON p.id = eqp.user_id
WHERE p.is_judge = true;

-- Grant access to view
GRANT SELECT ON expert_dashboard TO authenticated;