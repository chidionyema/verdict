-- Performance Monitoring and Analytics System
-- Tracks Core Web Vitals, user interactions, and site performance metrics

-- Main performance metrics table
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  metric_name VARCHAR(50) NOT NULL,
  metric_value DECIMAL(10,2) NOT NULL,
  rating VARCHAR(20) CHECK (rating IN ('good', 'needs-improvement', 'poor')),
  url TEXT NOT NULL,
  user_agent TEXT,
  is_critical BOOLEAN DEFAULT false,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session-level performance aggregates
CREATE TABLE IF NOT EXISTS public.session_performance_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(100) NOT NULL UNIQUE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Core Web Vitals
  cls_score DECIMAL(6,3), -- Cumulative Layout Shift (0-1)
  fcp_score DECIMAL(8,2), -- First Contentful Paint (ms)
  fid_score DECIMAL(8,2), -- First Input Delay (ms)  
  lcp_score DECIMAL(8,2), -- Largest Contentful Paint (ms)
  ttfb_score DECIMAL(8,2), -- Time to First Byte (ms)
  
  -- Overall performance rating
  overall_rating VARCHAR(20) CHECK (overall_rating IN ('good', 'needs-improvement', 'poor')),
  
  -- Additional metrics
  page_load_time DECIMAL(8,2),
  dom_content_loaded_time DECIMAL(8,2),
  first_paint_time DECIMAL(8,2),
  
  -- Device and connection info
  device_type VARCHAR(20),
  connection_type VARCHAR(20),
  viewport_width INTEGER,
  viewport_height INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Slow operations tracking
CREATE TABLE IF NOT EXISTS public.slow_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  operation_type VARCHAR(50) NOT NULL, -- 'image_load', 'api_call', 'interaction'
  operation_identifier VARCHAR(255) NOT NULL, -- URL, endpoint, element
  duration_ms DECIMAL(8,2) NOT NULL,
  threshold_ms DECIMAL(8,2) NOT NULL,
  method VARCHAR(10), -- For API calls
  status_code INTEGER, -- For API calls
  file_size_bytes INTEGER, -- For image loads
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance alerts
CREATE TABLE IF NOT EXISTS public.performance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  metric_name VARCHAR(50),
  metric_value DECIMAL(10,2),
  threshold_value DECIMAL(10,2),
  session_id VARCHAR(100),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  url TEXT,
  message TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Page performance summary (daily aggregates)
CREATE TABLE IF NOT EXISTS public.page_performance_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  page_path TEXT NOT NULL,
  
  -- Sample size
  total_sessions INTEGER DEFAULT 0,
  total_page_loads INTEGER DEFAULT 0,
  
  -- Core Web Vitals averages
  avg_cls DECIMAL(6,3),
  avg_fcp DECIMAL(8,2),
  avg_fid DECIMAL(8,2),
  avg_lcp DECIMAL(8,2),
  avg_ttfb DECIMAL(8,2),
  
  -- Performance distribution
  good_sessions INTEGER DEFAULT 0,
  needs_improvement_sessions INTEGER DEFAULT 0,
  poor_sessions INTEGER DEFAULT 0,
  
  -- Percentiles
  p75_lcp DECIMAL(8,2),
  p95_lcp DECIMAL(8,2),
  p75_fid DECIMAL(8,2),
  p95_fid DECIMAL(8,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_page_date UNIQUE(date, page_path)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_performance_metrics_session ON public.performance_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON public.performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON public.performance_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_rating ON public.performance_metrics(rating);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_critical ON public.performance_metrics(is_critical);

CREATE INDEX IF NOT EXISTS idx_session_aggregates_session ON public.session_performance_aggregates(session_id);
CREATE INDEX IF NOT EXISTS idx_session_aggregates_rating ON public.session_performance_aggregates(overall_rating);
CREATE INDEX IF NOT EXISTS idx_session_aggregates_created ON public.session_performance_aggregates(created_at);

CREATE INDEX IF NOT EXISTS idx_slow_operations_type ON public.slow_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_slow_operations_duration ON public.slow_operations(duration_ms);
CREATE INDEX IF NOT EXISTS idx_slow_operations_session ON public.slow_operations(session_id);

CREATE INDEX IF NOT EXISTS idx_performance_alerts_type ON public.performance_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_severity ON public.performance_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_resolved ON public.performance_alerts(resolved);

CREATE INDEX IF NOT EXISTS idx_page_summary_date ON public.page_performance_summary(date);
CREATE INDEX IF NOT EXISTS idx_page_summary_path ON public.page_performance_summary(page_path);

-- Function to calculate performance score (0-100)
CREATE OR REPLACE FUNCTION calculate_performance_score(
  p_cls DECIMAL,
  p_fcp DECIMAL,
  p_fid DECIMAL,
  p_lcp DECIMAL,
  p_ttfb DECIMAL
)
RETURNS INTEGER AS $$
DECLARE
  cls_score INTEGER := 0;
  fcp_score INTEGER := 0;
  fid_score INTEGER := 0;
  lcp_score INTEGER := 0;
  ttfb_score INTEGER := 0;
BEGIN
  -- CLS scoring (25 points max)
  IF p_cls IS NOT NULL THEN
    IF p_cls <= 0.1 THEN cls_score := 25;
    ELSIF p_cls <= 0.25 THEN cls_score := 15;
    ELSE cls_score := 5;
    END IF;
  END IF;
  
  -- FCP scoring (20 points max)
  IF p_fcp IS NOT NULL THEN
    IF p_fcp <= 1800 THEN fcp_score := 20;
    ELSIF p_fcp <= 3000 THEN fcp_score := 12;
    ELSE fcp_score := 4;
    END IF;
  END IF;
  
  -- FID scoring (20 points max)
  IF p_fid IS NOT NULL THEN
    IF p_fid <= 100 THEN fid_score := 20;
    ELSIF p_fid <= 300 THEN fid_score := 12;
    ELSE fid_score := 4;
    END IF;
  END IF;
  
  -- LCP scoring (25 points max)
  IF p_lcp IS NOT NULL THEN
    IF p_lcp <= 2500 THEN lcp_score := 25;
    ELSIF p_lcp <= 4000 THEN lcp_score := 15;
    ELSE lcp_score := 5;
    END IF;
  END IF;
  
  -- TTFB scoring (10 points max)
  IF p_ttfb IS NOT NULL THEN
    IF p_ttfb <= 800 THEN ttfb_score := 10;
    ELSIF p_ttfb <= 1800 THEN ttfb_score := 6;
    ELSE ttfb_score := 2;
    END IF;
  END IF;
  
  RETURN cls_score + fcp_score + fid_score + lcp_score + ttfb_score;
END;
$$ LANGUAGE plpgsql;

-- Function to trigger performance alerts
CREATE OR REPLACE FUNCTION check_performance_thresholds()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for critical LCP issues
  IF NEW.metric_name = 'LCP' AND NEW.metric_value > 4000 THEN
    INSERT INTO public.performance_alerts (
      alert_type, severity, metric_name, metric_value, threshold_value,
      session_id, user_id, url, message
    ) VALUES (
      'critical_lcp', 'high', 'LCP', NEW.metric_value, 4000,
      NEW.session_id, NEW.user_id, NEW.url, 
      'Largest Contentful Paint exceeds 4 seconds'
    );
  END IF;
  
  -- Check for high CLS
  IF NEW.metric_name = 'CLS' AND NEW.metric_value > 0.25 THEN
    INSERT INTO public.performance_alerts (
      alert_type, severity, metric_name, metric_value, threshold_value,
      session_id, user_id, url, message
    ) VALUES (
      'high_cls', 'medium', 'CLS', NEW.metric_value, 0.25,
      NEW.session_id, NEW.user_id, NEW.url,
      'Cumulative Layout Shift exceeds poor threshold'
    );
  END IF;
  
  -- Check for slow FID
  IF NEW.metric_name = 'FID' AND NEW.metric_value > 300 THEN
    INSERT INTO public.performance_alerts (
      alert_type, severity, metric_name, metric_value, threshold_value,
      session_id, user_id, url, message
    ) VALUES (
      'slow_fid', 'medium', 'FID', NEW.metric_value, 300,
      NEW.session_id, NEW.user_id, NEW.url,
      'First Input Delay exceeds poor threshold'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for performance alerts
DROP TRIGGER IF EXISTS trigger_performance_alerts ON public.performance_metrics;
CREATE TRIGGER trigger_performance_alerts
  AFTER INSERT ON public.performance_metrics
  FOR EACH ROW
  EXECUTE FUNCTION check_performance_thresholds();

-- Function to update daily performance summary
CREATE OR REPLACE FUNCTION update_daily_performance_summary()
RETURNS VOID AS $$
DECLARE
  summary_date DATE := CURRENT_DATE - INTERVAL '1 day';
BEGIN
  INSERT INTO public.page_performance_summary (
    date, page_path, total_sessions, total_page_loads,
    avg_cls, avg_fcp, avg_fid, avg_lcp, avg_ttfb,
    good_sessions, needs_improvement_sessions, poor_sessions,
    p75_lcp, p95_lcp, p75_fid, p95_fid
  )
  SELECT 
    summary_date,
    COALESCE(SPLIT_PART(url, '?', 1), url) as page_path,
    COUNT(DISTINCT session_id) as total_sessions,
    COUNT(*) as total_page_loads,
    AVG(CASE WHEN metric_name = 'CLS' THEN metric_value END) as avg_cls,
    AVG(CASE WHEN metric_name = 'FCP' THEN metric_value END) as avg_fcp,
    AVG(CASE WHEN metric_name = 'FID' THEN metric_value END) as avg_fid,
    AVG(CASE WHEN metric_name = 'LCP' THEN metric_value END) as avg_lcp,
    AVG(CASE WHEN metric_name = 'TTFB' THEN metric_value END) as avg_ttfb,
    COUNT(DISTINCT CASE WHEN rating = 'good' THEN session_id END) as good_sessions,
    COUNT(DISTINCT CASE WHEN rating = 'needs-improvement' THEN session_id END) as needs_improvement_sessions,
    COUNT(DISTINCT CASE WHEN rating = 'poor' THEN session_id END) as poor_sessions,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY CASE WHEN metric_name = 'LCP' THEN metric_value END) as p75_lcp,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY CASE WHEN metric_name = 'LCP' THEN metric_value END) as p95_lcp,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY CASE WHEN metric_name = 'FID' THEN metric_value END) as p75_fid,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY CASE WHEN metric_name = 'FID' THEN metric_value END) as p95_fid
  FROM public.performance_metrics
  WHERE DATE(timestamp) = summary_date
    AND metric_name IN ('CLS', 'FCP', 'FID', 'LCP', 'TTFB')
  GROUP BY page_path
  ON CONFLICT (date, page_path) 
  DO UPDATE SET
    total_sessions = EXCLUDED.total_sessions,
    total_page_loads = EXCLUDED.total_page_loads,
    avg_cls = EXCLUDED.avg_cls,
    avg_fcp = EXCLUDED.avg_fcp,
    avg_fid = EXCLUDED.avg_fid,
    avg_lcp = EXCLUDED.avg_lcp,
    avg_ttfb = EXCLUDED.avg_ttfb,
    good_sessions = EXCLUDED.good_sessions,
    needs_improvement_sessions = EXCLUDED.needs_improvement_sessions,
    poor_sessions = EXCLUDED.poor_sessions,
    p75_lcp = EXCLUDED.p75_lcp,
    p95_lcp = EXCLUDED.p95_lcp,
    p75_fid = EXCLUDED.p75_fid,
    p95_fid = EXCLUDED.p95_fid;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies (performance data should be restricted)
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_performance_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slow_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_performance_summary ENABLE ROW LEVEL SECURITY;

-- Only service role can insert performance data
CREATE POLICY "Service role can manage performance data" ON public.performance_metrics
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage session aggregates" ON public.session_performance_aggregates
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage slow operations" ON public.slow_operations
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage alerts" ON public.performance_alerts
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage summaries" ON public.page_performance_summary
  FOR ALL USING (auth.role() = 'service_role');

-- Admins can view all performance data
CREATE POLICY "Admins can view performance data" ON public.performance_metrics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Grant permissions
GRANT ALL ON public.performance_metrics TO service_role;
GRANT ALL ON public.session_performance_aggregates TO service_role;
GRANT ALL ON public.slow_operations TO service_role;
GRANT ALL ON public.performance_alerts TO service_role;
GRANT ALL ON public.page_performance_summary TO service_role;

-- Comments for documentation
COMMENT ON TABLE public.performance_metrics IS 'Raw performance metrics from client-side monitoring';
COMMENT ON TABLE public.session_performance_aggregates IS 'Session-level aggregated performance data';
COMMENT ON TABLE public.slow_operations IS 'Tracking of operations that exceed performance thresholds';
COMMENT ON TABLE public.performance_alerts IS 'Automated alerts for performance issues';
COMMENT ON TABLE public.page_performance_summary IS 'Daily aggregated performance statistics per page';
COMMENT ON FUNCTION calculate_performance_score(DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL) IS 'Calculates overall performance score (0-100) based on Core Web Vitals';
COMMENT ON FUNCTION update_daily_performance_summary() IS 'Updates daily performance summaries for monitoring dashboards';