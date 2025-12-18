-- Migration: Add comparison_requests table for A/B decision comparison feature
-- This enables structured side-by-side decision comparisons with context

-- Create comparison_requests table
CREATE TABLE comparison_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Decision question and categorization
    question TEXT NOT NULL CHECK (length(trim(question)) >= 10),
    category TEXT NOT NULL CHECK (category IN ('career', 'lifestyle', 'business', 'appearance', 'general')),
    
    -- Option A details
    option_a_title TEXT NOT NULL CHECK (length(trim(option_a_title)) > 0),
    option_a_description TEXT NOT NULL,
    option_a_image_url TEXT,
    
    -- Option B details
    option_b_title TEXT NOT NULL CHECK (length(trim(option_b_title)) > 0),
    option_b_description TEXT NOT NULL,
    option_b_image_url TEXT,
    
    -- Decision context (stored as JSONB for flexibility)
    decision_context JSONB NOT NULL,
    
    -- Pricing and routing
    request_tier TEXT NOT NULL DEFAULT 'standard' 
        CHECK (request_tier IN ('community', 'standard', 'pro')),
    target_verdict_count INTEGER NOT NULL DEFAULT 3 CHECK (target_verdict_count BETWEEN 1 AND 10),
    
    -- Status and visibility
    status TEXT NOT NULL DEFAULT 'open' 
        CHECK (status IN ('open', 'in_review', 'completed', 'expired', 'cancelled')),
    visibility TEXT NOT NULL DEFAULT 'private' 
        CHECK (visibility IN ('public', 'private')),
    
    -- Tracking
    received_verdict_count INTEGER NOT NULL DEFAULT 0,
    winner_option TEXT CHECK (winner_option IN ('A', 'B', 'tie') OR winner_option IS NULL),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    
    -- Constraints
    CONSTRAINT valid_verdict_count CHECK (received_verdict_count <= target_verdict_count),
    CONSTRAINT valid_decision_context CHECK (
        decision_context ? 'timeframe' AND 
        decision_context ? 'importance' AND 
        decision_context ? 'goals' AND
        jsonb_typeof(decision_context->'goals') = 'array'
    )
);

-- Create comparison_verdicts table for individual responses
CREATE TABLE comparison_verdicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comparison_id UUID NOT NULL REFERENCES comparison_requests(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Verdict details
    preferred_option TEXT NOT NULL CHECK (preferred_option IN ('A', 'B', 'tie')),
    reasoning TEXT NOT NULL CHECK (length(trim(reasoning)) >= 20),
    confidence_score INTEGER CHECK (confidence_score BETWEEN 1 AND 5),
    
    -- Option-specific feedback
    option_a_feedback TEXT,
    option_b_feedback TEXT,
    
    -- Decision matrix scores (for pro tier)
    decision_scores JSONB, -- { "criteria": { "option_a": score, "option_b": score } }
    
    -- Reviewer context
    reviewer_expertise TEXT, -- e.g., "HR Manager", "Career Coach", etc.
    is_verified_expert BOOLEAN DEFAULT FALSE,
    
    -- Quality metrics
    helpfulness_score DECIMAL(3,2),
    was_helpful_vote_count INTEGER DEFAULT 0,
    was_not_helpful_vote_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one verdict per reviewer per comparison
    UNIQUE(comparison_id, reviewer_id)
);

-- Create indexes for performance
CREATE INDEX idx_comparison_requests_user_id ON comparison_requests(user_id);
CREATE INDEX idx_comparison_requests_status ON comparison_requests(status);
CREATE INDEX idx_comparison_requests_category ON comparison_requests(category);
CREATE INDEX idx_comparison_requests_tier ON comparison_requests(request_tier);
CREATE INDEX idx_comparison_requests_created_at ON comparison_requests(created_at);

CREATE INDEX idx_comparison_verdicts_comparison_id ON comparison_verdicts(comparison_id);
CREATE INDEX idx_comparison_verdicts_reviewer_id ON comparison_verdicts(reviewer_id);
CREATE INDEX idx_comparison_verdicts_created_at ON comparison_verdicts(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_comparison_requests_updated_at 
    BEFORE UPDATE ON comparison_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comparison_verdicts_updated_at 
    BEFORE UPDATE ON comparison_verdicts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for comparison images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('comparison-images', 'comparison-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies
ALTER TABLE comparison_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparison_verdicts ENABLE ROW LEVEL SECURITY;

-- Comparison requests policies
CREATE POLICY "Users can view their own comparison requests"
    ON comparison_requests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create comparison requests"
    ON comparison_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comparison requests"
    ON comparison_requests FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Reviewers can view open public comparison requests"
    ON comparison_requests FOR SELECT
    USING (
        status = 'open' AND 
        visibility = 'public' AND 
        auth.uid() IS NOT NULL AND
        auth.uid() != user_id -- Reviewers can't review their own requests
    );

-- Comparison verdicts policies
CREATE POLICY "Users can view verdicts for their comparison requests"
    ON comparison_verdicts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM comparison_requests cr 
            WHERE cr.id = comparison_id AND cr.user_id = auth.uid()
        )
    );

CREATE POLICY "Reviewers can view their own verdicts"
    ON comparison_verdicts FOR SELECT
    USING (auth.uid() = reviewer_id);

CREATE POLICY "Reviewers can create verdicts"
    ON comparison_verdicts FOR INSERT
    WITH CHECK (
        auth.uid() = reviewer_id AND
        EXISTS (
            SELECT 1 FROM comparison_requests cr 
            WHERE cr.id = comparison_id 
            AND cr.status = 'open' 
            AND cr.user_id != auth.uid() -- Can't review own requests
            AND cr.received_verdict_count < cr.target_verdict_count
        )
    );

CREATE POLICY "Reviewers can update their own verdicts"
    ON comparison_verdicts FOR UPDATE
    USING (auth.uid() = reviewer_id);

-- Storage policies for comparison images
CREATE POLICY "Anyone can view comparison images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'comparison-images');

CREATE POLICY "Authenticated users can upload comparison images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'comparison-images' AND
        auth.role() = 'authenticated'
    );

-- Function to update received_verdict_count when verdicts are added
CREATE OR REPLACE FUNCTION update_comparison_verdict_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE comparison_requests
        SET received_verdict_count = received_verdict_count + 1,
            updated_at = NOW()
        WHERE id = NEW.comparison_id;
        
        -- Check if we've reached the target count
        UPDATE comparison_requests
        SET status = 'completed',
            completed_at = NOW()
        WHERE id = NEW.comparison_id 
        AND received_verdict_count >= target_verdict_count
        AND status = 'open';
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE comparison_requests
        SET received_verdict_count = received_verdict_count - 1,
            updated_at = NOW()
        WHERE id = OLD.comparison_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comparison_verdict_count
    AFTER INSERT OR DELETE ON comparison_verdicts
    FOR EACH ROW EXECUTE FUNCTION update_comparison_verdict_count();

-- Function to calculate winner when comparison is completed
CREATE OR REPLACE FUNCTION calculate_comparison_winner()
RETURNS TRIGGER AS $$
DECLARE
    option_a_votes INTEGER;
    option_b_votes INTEGER;
    tie_votes INTEGER;
    winner TEXT;
BEGIN
    -- Only calculate winner when status changes to completed
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Count votes for each option
        SELECT 
            COUNT(*) FILTER (WHERE preferred_option = 'A'),
            COUNT(*) FILTER (WHERE preferred_option = 'B'),
            COUNT(*) FILTER (WHERE preferred_option = 'tie')
        INTO option_a_votes, option_b_votes, tie_votes
        FROM comparison_verdicts
        WHERE comparison_id = NEW.id;
        
        -- Determine winner
        IF option_a_votes > option_b_votes AND option_a_votes > tie_votes THEN
            winner := 'A';
        ELSIF option_b_votes > option_a_votes AND option_b_votes > tie_votes THEN
            winner := 'B';
        ELSE
            winner := 'tie';
        END IF;
        
        -- Update the comparison request with the winner
        UPDATE comparison_requests
        SET winner_option = winner
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_comparison_winner
    AFTER UPDATE ON comparison_requests
    FOR EACH ROW EXECUTE FUNCTION calculate_comparison_winner();