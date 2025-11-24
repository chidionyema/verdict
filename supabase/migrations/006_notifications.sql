-- Notification System
-- Adds real-time notifications for users and judges

-- 1. NOTIFICATIONS TABLE
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Target user
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Notification details
  type text NOT NULL CHECK (type IN (
    'verdict_received',      -- New verdict on your request
    'request_completed',     -- All verdicts received
    'new_judge_request',     -- New request available for judging
    'credit_purchase',       -- Credits purchased successfully
    'moderation_action',     -- Content moderated
    'welcome',               -- Welcome message
    'system_announcement',   -- System-wide announcements
    'judge_qualified'        -- Judge qualification approved
  )),
  
  title text NOT NULL,
  message text NOT NULL,
  
  -- Related content (optional)
  related_type text CHECK (related_type IN ('verdict_request', 'verdict_response', 'transaction')),
  related_id uuid,
  
  -- Action button (optional)
  action_label text,
  action_url text,
  
  -- Status
  is_read boolean DEFAULT false NOT NULL,
  read_at timestamptz,
  
  -- Priority
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

-- 2. Add notification preferences to profiles
ALTER TABLE public.profiles 
ADD COLUMN notification_preferences jsonb DEFAULT '{
  "verdict_received": {"email": true, "push": true},
  "request_completed": {"email": true, "push": true},
  "new_judge_request": {"email": false, "push": true},
  "credit_purchase": {"email": true, "push": false},
  "moderation_action": {"email": true, "push": true},
  "system_announcement": {"email": true, "push": true}
}'::jsonb;

-- 3. INDEXES for performance
CREATE INDEX notifications_user_id_created_idx ON public.notifications(user_id, created_at DESC);
CREATE INDEX notifications_unread_idx ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX notifications_type_idx ON public.notifications(type, created_at DESC);

-- 4. RLS Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Only system/admins can create notifications (will be done via service role)
CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (false); -- Will use service role for inserts

-- 5. Functions for notification management

-- Function to create a notification
CREATE OR REPLACE FUNCTION public.create_notification(
  target_user_id uuid,
  notification_type text,
  notification_title text,
  notification_message text,
  related_type text DEFAULT NULL,
  related_id uuid DEFAULT NULL,
  action_label text DEFAULT NULL,
  action_url text DEFAULT NULL,
  notification_priority text DEFAULT 'normal'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges
AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    related_type,
    related_id,
    action_label,
    action_url,
    priority
  ) VALUES (
    target_user_id,
    notification_type,
    notification_title,
    notification_message,
    related_type,
    related_id,
    action_label,
    action_url,
    notification_priority
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(notification_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.notifications 
  SET 
    is_read = true,
    read_at = now(),
    updated_at = now()
  WHERE 
    id = notification_id 
    AND user_id = auth.uid()
    AND is_read = false;
    
  RETURN FOUND;
END;
$$;

-- Function to mark all notifications as read for user
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(target_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.notifications 
  SET 
    is_read = true,
    read_at = now(),
    updated_at = now()
  WHERE 
    user_id = target_user_id
    AND user_id = auth.uid()  -- Security check
    AND is_read = false;
    
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(target_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::integer
  FROM public.notifications
  WHERE user_id = target_user_id
    AND user_id = auth.uid()  -- Security check
    AND is_read = false;
$$;

-- 6. Triggers to create automatic notifications

-- Trigger when a verdict is submitted
CREATE OR REPLACE FUNCTION public.notify_verdict_received()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_record record;
BEGIN
  -- Get the request details
  SELECT * INTO request_record
  FROM public.verdict_requests
  WHERE id = NEW.request_id;
  
  -- Notify the request owner
  PERFORM public.create_notification(
    request_record.user_id,
    'verdict_received',
    'New verdict received!',
    format('A judge has submitted their verdict for your %s request.', request_record.category),
    'verdict_response',
    NEW.id,
    'View Verdict',
    format('/requests/%s', request_record.id),
    'normal'
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER verdict_received_notification
  AFTER INSERT ON public.verdict_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_verdict_received();

-- Trigger when request is completed (all verdicts received)
CREATE OR REPLACE FUNCTION public.notify_request_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if request is now completed
  IF NEW.received_verdict_count >= NEW.target_verdict_count AND 
     (OLD.received_verdict_count IS NULL OR OLD.received_verdict_count < NEW.target_verdict_count) THEN
    
    PERFORM public.create_notification(
      NEW.user_id,
      'request_completed',
      'All verdicts received!',
      format('Your %s request has received all %s verdicts. Check out what the judges said!', 
        NEW.category, NEW.target_verdict_count),
      'verdict_request',
      NEW.id,
      'View Results',
      format('/requests/%s', NEW.id),
      'high'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER request_completed_notification
  AFTER UPDATE ON public.verdict_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_request_completed();

-- Trigger for credit purchases
CREATE OR REPLACE FUNCTION public.notify_credit_purchase()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only notify on completed purchases
  IF NEW.status = 'completed' AND NEW.type = 'purchase' AND 
     (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    PERFORM public.create_notification(
      NEW.user_id,
      'credit_purchase',
      'Credits added to your account',
      format('%s credits have been added to your account.', NEW.credits_delta),
      'transaction',
      NEW.id,
      'View Account',
      '/account',
      'normal'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER credit_purchase_notification
  AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_credit_purchase();

-- 7. Function to notify judges of new requests
CREATE OR REPLACE FUNCTION public.notify_judges_new_request(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_record record;
  judge_record record;
BEGIN
  -- Get request details
  SELECT * INTO request_record
  FROM public.verdict_requests
  WHERE id = request_id;
  
  -- Notify all qualified judges
  FOR judge_record IN 
    SELECT id FROM public.profiles 
    WHERE can_judge = true 
      AND is_suspended = false
      AND (suspended_until IS NULL OR suspended_until < now())
  LOOP
    PERFORM public.create_notification(
      judge_record.id,
      'new_judge_request',
      'New request needs your judgment',
      format('A new %s request is waiting for judges. Be one of the first to respond!', 
        request_record.category),
      'verdict_request',
      request_record.id,
      'Judge Now',
      '/judge',
      'normal'
    );
  END LOOP;
END;
$$;

-- 8. Welcome notification function
CREATE OR REPLACE FUNCTION public.create_welcome_notification(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.create_notification(
    user_id,
    'welcome',
    'Welcome to Verdict! 🎉',
    'Get honest feedback on photos, profiles, and writing. You have 3 free credits to start.',
    NULL,
    NULL,
    'Get Your First Verdict',
    '/start',
    'high'
  );
END;
$$;