-- Consensus Analysis System for Pro Tier
-- Stores LLM-generated synthesis of expert verdicts

CREATE TABLE consensus_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES verdict_requests(id) ON DELETE CASCADE,
  
  -- Core synthesis content
  synthesis TEXT NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
  agreement_level TEXT CHECK (agreement_level IN ('high', 'medium', 'low')),
  
  -- Structured analysis data
  key_themes JSONB NOT NULL DEFAULT '[]'::jsonb,
  conflicts JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  expert_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Analysis metadata
  expert_count INTEGER NOT NULL,
  analysis_version TEXT DEFAULT 'v1.0',
  llm_model TEXT DEFAULT 'gpt-4',
  analysis_tokens INTEGER,
  
  -- Timing and status
  status TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_request_consensus UNIQUE (request_id)
);

-- Indexes for efficient querying
CREATE INDEX idx_consensus_analysis_request ON consensus_analysis(request_id);
CREATE INDEX idx_consensus_analysis_status ON consensus_analysis(status);
CREATE INDEX idx_consensus_analysis_confidence ON consensus_analysis(confidence_score);
CREATE INDEX idx_consensus_analysis_agreement ON consensus_analysis(agreement_level);

-- RLS policies
ALTER TABLE consensus_analysis ENABLE ROW LEVEL SECURITY;

-- Users can view consensus analysis for their own requests
CREATE POLICY "Users can view own consensus analysis" ON consensus_analysis
  FOR SELECT USING (
    request_id IN (
      SELECT id FROM verdict_requests WHERE user_id = auth.uid()
    )
  );

-- Admin/system can manage all consensus analysis
CREATE POLICY "System can manage consensus analysis" ON consensus_analysis
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Service role can create/update consensus analysis
CREATE POLICY "Service can manage consensus analysis" ON consensus_analysis
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to trigger consensus analysis when Pro tier request is completed
CREATE OR REPLACE FUNCTION trigger_consensus_analysis()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger for Pro tier requests that just completed
  IF NEW.status = 'completed' AND 
     NEW.request_tier = 'pro' AND 
     NEW.received_verdict_count >= 2 AND
     OLD.status != 'completed' THEN
    
    -- Insert pending consensus analysis
    INSERT INTO consensus_analysis (
      request_id, 
      expert_count,
      status
    ) VALUES (
      NEW.id, 
      NEW.received_verdict_count,
      'pending'
    ) ON CONFLICT (request_id) DO NOTHING;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on verdict_requests
DROP TRIGGER IF EXISTS verdict_completion_consensus_trigger ON verdict_requests;
CREATE TRIGGER verdict_completion_consensus_trigger
  AFTER UPDATE ON verdict_requests
  FOR EACH ROW
  EXECUTE FUNCTION trigger_consensus_analysis();

-- Function to get consensus analysis with request context
CREATE OR REPLACE FUNCTION get_consensus_with_context(p_request_id UUID)
RETURNS TABLE (
  consensus_id UUID,
  synthesis TEXT,
  confidence_score DECIMAL,
  agreement_level TEXT,
  key_themes JSONB,
  conflicts JSONB,
  recommendations JSONB,
  expert_breakdown JSONB,
  request_context TEXT,
  request_category TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ca.id,
    ca.synthesis,
    ca.confidence_score,
    ca.agreement_level,
    ca.key_themes,
    ca.conflicts,
    ca.recommendations,
    ca.expert_breakdown,
    vr.context,
    vr.category::TEXT
  FROM consensus_analysis ca
  JOIN verdict_requests vr ON vr.id = ca.request_id
  WHERE ca.request_id = p_request_id
    AND ca.status = 'completed';
END;
$$ LANGUAGE plpgsql;