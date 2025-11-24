-- Help Center and Support System
-- Adds comprehensive help articles and support ticket functionality

-- 1. Help Articles Table
CREATE TABLE public.help_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Content
  title text NOT NULL,
  content text NOT NULL,
  excerpt text,
  
  -- Organization
  category text NOT NULL,
  tags text[] DEFAULT '{}',
  
  -- Publishing
  is_published boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  
  -- Analytics
  view_count integer DEFAULT 0,
  helpful_count integer DEFAULT 0,
  
  -- Author
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- SEO
  slug text UNIQUE,
  meta_description text,
  
  -- Ordering
  sort_order integer DEFAULT 0
);

-- 2. Help Article Feedback Table
CREATE TABLE public.help_article_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  
  article_id uuid NOT NULL REFERENCES public.help_articles(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  feedback_type text NOT NULL CHECK (feedback_type IN ('helpful', 'not_helpful', 'report')),
  comment text,
  
  -- Prevent duplicate feedback from same user
  UNIQUE(article_id, user_id, feedback_type)
);

-- 3. Support Tickets Table
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- User
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Ticket details
  subject text NOT NULL,
  description text NOT NULL,
  
  -- Classification
  category text NOT NULL CHECK (category IN ('technical', 'billing', 'account', 'content', 'other')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Status
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_for_user', 'waiting_for_admin', 'resolved', 'closed')),
  
  -- Assignee (admin/support staff)
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Response tracking
  last_response_at timestamptz,
  response_count integer DEFAULT 0,
  
  -- Resolution
  resolved_at timestamptz,
  resolution_note text,
  
  -- Attachments
  attachments jsonb DEFAULT '[]',
  
  -- Internal notes (admin only)
  internal_notes text,
  
  -- Customer satisfaction
  satisfaction_rating integer CHECK (satisfaction_rating BETWEEN 1 AND 5),
  satisfaction_feedback text
);

-- 4. Support Ticket Replies Table
CREATE TABLE public.support_ticket_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Reply content
  message text NOT NULL,
  attachments jsonb DEFAULT '[]',
  
  -- Reply type
  is_from_admin boolean DEFAULT false,
  is_internal boolean DEFAULT false, -- Internal admin notes
  
  -- Status changes
  status_changed_to text,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'
);

-- 5. FAQ Categories Table (for better organization)
CREATE TABLE public.faq_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  
  name text NOT NULL UNIQUE,
  description text,
  icon text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true
);

-- 6. INDEXES for performance

-- Help articles
CREATE INDEX help_articles_category_idx ON public.help_articles(category);
CREATE INDEX help_articles_published_idx ON public.help_articles(is_published, is_featured);
CREATE INDEX help_articles_views_idx ON public.help_articles(view_count DESC);
CREATE INDEX help_articles_helpful_idx ON public.help_articles(helpful_count DESC);
CREATE INDEX help_articles_slug_idx ON public.help_articles(slug);
CREATE INDEX help_articles_author_idx ON public.help_articles(author_id);

-- Support tickets
CREATE INDEX support_tickets_user_idx ON public.support_tickets(user_id, created_at DESC);
CREATE INDEX support_tickets_status_idx ON public.support_tickets(status, priority, created_at DESC);
CREATE INDEX support_tickets_category_idx ON public.support_tickets(category);
CREATE INDEX support_tickets_assigned_idx ON public.support_tickets(assigned_to);

-- Ticket replies
CREATE INDEX ticket_replies_ticket_idx ON public.support_ticket_replies(ticket_id, created_at ASC);
CREATE INDEX ticket_replies_user_idx ON public.support_ticket_replies(user_id);

-- Article feedback
CREATE INDEX article_feedback_article_idx ON public.help_article_feedback(article_id);
CREATE INDEX article_feedback_user_idx ON public.help_article_feedback(user_id);

-- 7. RLS Policies

-- Help articles - public read, admin write
ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published articles" ON public.help_articles
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage all articles" ON public.help_articles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Article feedback - users can provide feedback
ALTER TABLE public.help_article_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all feedback" ON public.help_article_feedback
  FOR SELECT USING (true);

CREATE POLICY "Users can create feedback" ON public.help_article_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all feedback" ON public.help_article_feedback
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Support tickets - users see their own, admins see all
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tickets" ON public.support_tickets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tickets" ON public.support_tickets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all tickets" ON public.support_tickets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Ticket replies - users can see replies to their tickets, admins see all
ALTER TABLE public.support_ticket_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view replies to their tickets" ON public.support_ticket_replies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets st
      WHERE st.id = ticket_id AND st.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can reply to their tickets" ON public.support_ticket_replies
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (
      SELECT 1 FROM public.support_tickets st
      WHERE st.id = ticket_id AND st.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all replies" ON public.support_ticket_replies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- FAQ categories - public read, admin write
ALTER TABLE public.faq_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active categories" ON public.faq_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all categories" ON public.faq_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 8. Functions for help system

-- Function to increment helpful count
CREATE OR REPLACE FUNCTION public.increment_article_helpful_count(article_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.help_articles
  SET helpful_count = helpful_count + 1
  WHERE id = article_id;
END;
$$;

-- Function to update ticket status and response count
CREATE OR REPLACE FUNCTION public.update_ticket_on_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update ticket response count and last response time
  UPDATE public.support_tickets
  SET 
    response_count = response_count + 1,
    last_response_at = NEW.created_at,
    updated_at = NEW.created_at,
    status = CASE 
      WHEN NEW.is_from_admin THEN 'waiting_for_user'
      ELSE 'waiting_for_admin'
    END
  WHERE id = NEW.ticket_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger for ticket replies
CREATE TRIGGER update_ticket_on_reply_trigger
  AFTER INSERT ON public.support_ticket_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ticket_on_reply();

-- Function to generate article slug
CREATE OR REPLACE FUNCTION public.generate_article_slug(article_title text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 1;
BEGIN
  -- Create base slug from title
  base_slug := lower(regexp_replace(trim(article_title), '[^a-zA-Z0-9\s]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(base_slug, '-');
  
  final_slug := base_slug;
  
  -- Check for uniqueness and increment if needed
  WHILE EXISTS (SELECT 1 FROM public.help_articles WHERE slug = final_slug) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- 9. Triggers

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_help_articles_updated_at
  BEFORE UPDATE ON public.help_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ticket_replies_updated_at
  BEFORE UPDATE ON public.support_ticket_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-generate slug for articles
CREATE OR REPLACE FUNCTION public.set_article_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.generate_article_slug(NEW.title);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_article_slug_trigger
  BEFORE INSERT OR UPDATE ON public.help_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_article_slug();

-- 10. Initial help content

-- Insert initial FAQ categories
INSERT INTO public.faq_categories (name, description, icon, sort_order) VALUES
('Getting Started', 'Learn the basics of using Verdict', '🚀', 1),
('Account & Profile', 'Manage your account settings and profile', '👤', 2),
('Creating Requests', 'How to submit and manage verdict requests', '📝', 3),
('Judging', 'Everything about being a judge on Verdict', '⚖️', 4),
('Billing & Payments', 'Credits, subscriptions, and payment information', '💳', 5),
('Safety & Guidelines', 'Community rules and safety features', '🛡️', 6),
('Technical Support', 'Troubleshooting and technical issues', '🔧', 7),
('Policies', 'Terms of service, privacy, and platform policies', '📋', 8);

-- Insert sample help articles
INSERT INTO public.help_articles (title, content, category, tags, is_published, is_featured, sort_order) VALUES
(
  'Getting Started with Verdict',
  '<h2>Welcome to Verdict!</h2><p>Verdict is a platform where you can get honest feedback on photos, profiles, writing, and decisions from real people. Here''s how to get started:</p><h3>1. Create Your Account</h3><p>Sign up with your email or Google account to get started. You''ll receive 3 free credits to try the platform.</p><h3>2. Submit Your First Request</h3><p>Click "Get Verdict" and upload what you want feedback on. Provide context about what kind of feedback you''re looking for.</p><h3>3. Get Expert Feedback</h3><p>Our community of judges will review your submission and provide detailed, honest feedback within 24 hours.</p>',
  'getting-started',
  ARRAY['onboarding', 'basics', 'tutorial'],
  true,
  true,
  1
),
(
  'How to Create a Great Verdict Request',
  '<h2>Tips for Getting Quality Feedback</h2><p>To get the most helpful feedback, follow these guidelines:</p><h3>Be Specific</h3><p>Clearly explain what kind of feedback you''re looking for. Are you wanting to improve your dating profile? Get feedback on a professional headshot? The more context you provide, the better feedback you''ll receive.</p><h3>Use High-Quality Images</h3><p>Make sure your photos are clear, well-lit, and show what you want feedback on. Blurry or dark images make it hard for judges to provide useful feedback.</p><h3>Ask Specific Questions</h3><p>Instead of just asking "What do you think?", try questions like "Does this photo work for a professional profile?" or "What should I change about my dating profile?"</p>',
  'requests',
  ARRAY['tips', 'quality', 'feedback'],
  true,
  true,
  2
),
(
  'Becoming a Judge on Verdict',
  '<h2>Start Earning by Helping Others</h2><p>Judges on Verdict earn money by providing thoughtful feedback to users. Here''s how to get started:</p><h3>Apply to Become a Judge</h3><p>Click "Become a Judge" and complete the application process. We''ll review your application and get back to you within 24 hours.</p><h3>Provide Quality Feedback</h3><p>Write detailed, constructive feedback that helps users improve. Higher-rated feedback earns more money.</p><h3>Earn and Withdraw</h3><p>You earn money for each verdict you provide. Once you have $10 or more, you can request a payout to your bank account.</p>',
  'judging',
  ARRAY['earning', 'judge', 'application'],
  true,
  true,
  3
),
(
  'Understanding Credits and Pricing',
  '<h2>How Credits Work</h2><p>Verdict uses a credit system for requests:</p><h3>Credit Packages</h3><ul><li>10 credits: $9.99</li><li>25 credits: $19.99 (20% savings)</li><li>50 credits: $34.99 (30% savings)</li><li>100 credits: $59.99 (40% savings)</li></ul><h3>Subscription Plans</h3><p>Save money with monthly subscriptions that include credits and premium features.</p><h3>Free Credits</h3><p>New users get 3 free credits to try the platform. You can also earn credits by referring friends.</p>',
  'billing',
  ARRAY['credits', 'pricing', 'subscription'],
  true,
  false,
  4
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.help_articles TO anon, authenticated;
GRANT SELECT ON public.faq_categories TO anon, authenticated;
GRANT ALL ON public.help_article_feedback TO authenticated;
GRANT ALL ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_ticket_replies TO authenticated;