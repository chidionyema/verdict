-- Integration configurations table
CREATE TABLE IF NOT EXISTS public.integration_configs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_type text NOT NULL CHECK (integration_type IN ('email', 'slack', 'analytics', 'ai_moderation', 'push_notifications')),
  config jsonb NOT NULL,
  notification_types text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  UNIQUE(integration_type)
);

-- Webhook endpoints table
CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  url text NOT NULL,
  events text[] NOT NULL DEFAULT '{}',
  secret text NOT NULL,
  is_active boolean DEFAULT true,
  last_triggered_at timestamp with time zone,
  failure_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Content moderation logs
CREATE TABLE IF NOT EXISTS public.content_moderation_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type text NOT NULL CHECK (content_type IN ('request', 'response', 'comment')),
  content_id text NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  moderation_result jsonb NOT NULL,
  action_taken text NOT NULL DEFAULT 'none' CHECK (action_taken IN ('none', 'flagged', 'blocked', 'flagged_for_review')),
  provider text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Notification logs
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  provider text,
  sent_at timestamp with time zone,
  delivered_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- User device tokens for push notifications
CREATE TABLE IF NOT EXISTS public.user_device_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  token text NOT NULL,
  device_type text CHECK (device_type IN ('ios', 'android', 'web')),
  device_info jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(user_id, token)
);

-- Webhook delivery logs
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id uuid REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  status_code integer,
  response_body text,
  attempt_count integer DEFAULT 1,
  delivered_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_integration_configs_type_active ON public.integration_configs(integration_type, is_active);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_active ON public.webhook_endpoints(is_active, created_at);
CREATE INDEX IF NOT EXISTS idx_content_moderation_logs_type_created ON public.content_moderation_logs(content_type, created_at);
CREATE INDEX IF NOT EXISTS idx_content_moderation_logs_user_created ON public.content_moderation_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_created ON public.notification_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type_status ON public.notification_logs(notification_type, status);
CREATE INDEX IF NOT EXISTS idx_user_device_tokens_user_active ON public.user_device_tokens(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_created ON public.webhook_deliveries(webhook_id, created_at);

-- Enable RLS
ALTER TABLE public.integration_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Integration configs - admin only
CREATE POLICY "Admin can manage integration configs" ON public.integration_configs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Webhook endpoints - admin only
CREATE POLICY "Admin can manage webhook endpoints" ON public.webhook_endpoints
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Content moderation logs - admin only
CREATE POLICY "Admin can view moderation logs" ON public.content_moderation_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Notification logs - users can see their own
CREATE POLICY "Users can view their notification logs" ON public.notification_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admin can view all notification logs" ON public.notification_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- User device tokens - users can manage their own
CREATE POLICY "Users can manage their device tokens" ON public.user_device_tokens
  FOR ALL USING (user_id = auth.uid());

-- Webhook deliveries - admin only
CREATE POLICY "Admin can view webhook deliveries" ON public.webhook_deliveries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_integration_configs_updated_at
  BEFORE UPDATE ON public.integration_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhook_endpoints_updated_at
  BEFORE UPDATE ON public.webhook_endpoints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_device_tokens_updated_at
  BEFORE UPDATE ON public.user_device_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();