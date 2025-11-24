-- Search & Discovery System
-- Adds full-text search, filtering, and content discovery features

-- 1. Add search-related columns to existing tables
ALTER TABLE public.verdict_requests 
ADD COLUMN search_vector tsvector,
ADD COLUMN is_public boolean DEFAULT false,
ADD COLUMN featured boolean DEFAULT false,
ADD COLUMN view_count integer DEFAULT 0,
ADD COLUMN last_viewed_at timestamptz;

ALTER TABLE public.verdict_responses
ADD COLUMN search_vector tsvector;

-- 2. Create saved searches table
CREATE TABLE public.saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  search_name text NOT NULL,
  search_query text NOT NULL,
  search_filters jsonb DEFAULT '{}',
  
  -- Notification settings
  notify_new_results boolean DEFAULT false,
  last_notification_sent timestamptz,
  
  UNIQUE(user_id, search_name)
);

-- 3. Create search analytics table
CREATE TABLE public.search_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  search_query text NOT NULL,
  search_filters jsonb DEFAULT '{}',
  results_count integer DEFAULT 0,
  clicked_result_ids uuid[],
  
  -- Request metadata
  ip_address inet,
  user_agent text,
  session_id text
);

-- 4. Create popular searches view
CREATE TABLE public.popular_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  search_query text NOT NULL UNIQUE,
  search_count integer DEFAULT 1,
  last_searched_at timestamptz DEFAULT now(),
  
  -- Categorization
  category text,
  is_trending boolean DEFAULT false
);

-- 5. Create content categories and tags
CREATE TABLE public.content_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  category text CHECK (category IN ('general', 'appearance', 'writing', 'decision', 'profile')),
  usage_count integer DEFAULT 0,
  is_featured boolean DEFAULT false
);

-- 6. Create request-tag relationships
CREATE TABLE public.verdict_request_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  
  request_id uuid NOT NULL REFERENCES public.verdict_requests(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.content_tags(id) ON DELETE CASCADE,
  
  UNIQUE(request_id, tag_id)
);

-- 7. Create trending content tracking
CREATE TABLE public.trending_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  content_type text NOT NULL CHECK (content_type IN ('request', 'tag', 'search_query')),
  content_id uuid,
  content_text text,
  
  -- Trending metrics
  score decimal(10,4) DEFAULT 0.0,
  views_24h integer DEFAULT 0,
  views_7d integer DEFAULT 0,
  engagement_rate decimal(5,4) DEFAULT 0.0,
  
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  
  UNIQUE(content_type, content_id, period_start)
);

-- 8. INDEXES for search performance
-- Full-text search indexes
CREATE INDEX verdict_requests_search_vector_idx ON public.verdict_requests USING gin(search_vector);
CREATE INDEX verdict_responses_search_vector_idx ON public.verdict_responses USING gin(search_vector);

-- Category and filtering indexes
CREATE INDEX verdict_requests_category_status_idx ON public.verdict_requests(category, status);
CREATE INDEX verdict_requests_public_featured_idx ON public.verdict_requests(is_public, featured) WHERE is_public = true;
CREATE INDEX verdict_requests_created_views_idx ON public.verdict_requests(created_at DESC, view_count DESC);

-- Search analytics indexes
CREATE INDEX search_analytics_query_idx ON public.search_analytics(search_query);
CREATE INDEX search_analytics_created_idx ON public.search_analytics(created_at);
CREATE INDEX search_analytics_user_idx ON public.search_analytics(user_id, created_at DESC);

-- Tags and relationships
CREATE INDEX content_tags_category_usage_idx ON public.content_tags(category, usage_count DESC);
CREATE INDEX verdict_request_tags_request_idx ON public.verdict_request_tags(request_id);
CREATE INDEX verdict_request_tags_tag_idx ON public.verdict_request_tags(tag_id);

-- Trending content
CREATE INDEX trending_content_score_period_idx ON public.trending_content(content_type, score DESC, period_start);

-- 9. RLS Policies

-- Saved searches - users can only see their own
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own saved searches" ON public.saved_searches
  FOR ALL USING (auth.uid() = user_id);

-- Search analytics - users can view their own, admins can view all
ALTER TABLE public.search_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own search history" ON public.search_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all search analytics" ON public.search_analytics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Content tags - public read access
ALTER TABLE public.content_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view content tags" ON public.content_tags
  FOR SELECT USING (true);

-- Request tags - public read for public requests
ALTER TABLE public.verdict_request_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view tags for public requests" ON public.verdict_request_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.verdict_requests 
      WHERE id = request_id AND is_public = true
    )
  );

-- Trending content - public read access
ALTER TABLE public.trending_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view trending content" ON public.trending_content
  FOR SELECT USING (true);

-- 10. Functions for search and discovery

-- Function to update search vectors
CREATE OR REPLACE FUNCTION public.update_search_vectors()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update request search vectors
  UPDATE public.verdict_requests
  SET search_vector = to_tsvector('english', 
    COALESCE(category, '') || ' ' ||
    COALESCE(subcategory, '') || ' ' ||
    COALESCE(context, '') || ' ' ||
    COALESCE(text_content, '')
  );
  
  -- Update response search vectors
  UPDATE public.verdict_responses
  SET search_vector = to_tsvector('english', 
    COALESCE(feedback, '') || ' ' ||
    COALESCE(tone, '')
  );
END;
$$;

-- Function to search requests with filters
CREATE OR REPLACE FUNCTION public.search_requests(
  search_query text DEFAULT '',
  filter_category text DEFAULT NULL,
  filter_status text DEFAULT NULL,
  filter_min_rating decimal DEFAULT NULL,
  filter_tags text[] DEFAULT NULL,
  sort_by text DEFAULT 'relevance',
  limit_count integer DEFAULT 20,
  offset_count integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  category text,
  subcategory text,
  context text,
  media_type text,
  media_url text,
  text_content text,
  status text,
  created_at timestamptz,
  view_count integer,
  featured boolean,
  average_rating decimal,
  response_count integer,
  search_rank real
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  base_query text;
  where_conditions text[] := '{}';
  order_clause text;
BEGIN
  -- Build where conditions
  where_conditions := where_conditions || ARRAY['vr.is_public = true'];
  where_conditions := where_conditions || ARRAY['vr.moderation_status = ''approved'''];
  
  IF search_query != '' THEN
    where_conditions := where_conditions || ARRAY[
      'vr.search_vector @@ plainto_tsquery(''english'', ''' || search_query || ''')'
    ];
  END IF;
  
  IF filter_category IS NOT NULL THEN
    where_conditions := where_conditions || ARRAY['vr.category = ''' || filter_category || ''''];
  END IF;
  
  IF filter_status IS NOT NULL THEN
    where_conditions := where_conditions || ARRAY['vr.status = ''' || filter_status || ''''];
  END IF;
  
  -- Build order clause
  CASE sort_by
    WHEN 'newest' THEN order_clause := 'vr.created_at DESC';
    WHEN 'oldest' THEN order_clause := 'vr.created_at ASC';
    WHEN 'most_viewed' THEN order_clause := 'vr.view_count DESC, vr.created_at DESC';
    WHEN 'highest_rated' THEN order_clause := 'average_rating DESC NULLS LAST, vr.created_at DESC';
    WHEN 'most_responses' THEN order_clause := 'response_count DESC, vr.created_at DESC';
    ELSE order_clause := CASE 
      WHEN search_query != '' THEN 'ts_rank(vr.search_vector, plainto_tsquery(''english'', ''' || search_query || ''')) DESC'
      ELSE 'vr.created_at DESC'
    END;
  END CASE;
  
  -- Execute search
  RETURN QUERY EXECUTE '
    SELECT 
      vr.id,
      vr.category,
      vr.subcategory,
      vr.context,
      vr.media_type,
      vr.media_url,
      vr.text_content,
      vr.status,
      vr.created_at,
      vr.view_count,
      vr.featured,
      COALESCE(AVG(vresp.rating), 0) as average_rating,
      COUNT(vresp.id)::integer as response_count,
      ' || CASE WHEN search_query != '' THEN 
        'ts_rank(vr.search_vector, plainto_tsquery(''english'', ''' || search_query || '''))::real'
      ELSE '0::real' END || ' as search_rank
    FROM public.verdict_requests vr
    LEFT JOIN public.verdict_responses vresp ON vr.id = vresp.request_id
    WHERE ' || array_to_string(where_conditions, ' AND ') || '
    GROUP BY vr.id, vr.category, vr.subcategory, vr.context, vr.media_type, 
             vr.media_url, vr.text_content, vr.status, vr.created_at, 
             vr.view_count, vr.featured, vr.search_vector
    ORDER BY ' || order_clause || '
    LIMIT ' || limit_count || '
    OFFSET ' || offset_count;
END;
$$;

-- Function to track search analytics
CREATE OR REPLACE FUNCTION public.track_search(
  user_id uuid DEFAULT NULL,
  search_query text DEFAULT '',
  search_filters jsonb DEFAULT '{}',
  results_count integer DEFAULT 0,
  request_ip inet DEFAULT NULL,
  request_user_agent text DEFAULT NULL,
  session_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert search analytics
  INSERT INTO public.search_analytics (
    user_id,
    search_query,
    search_filters,
    results_count,
    ip_address,
    user_agent,
    session_id
  ) VALUES (
    user_id,
    search_query,
    search_filters,
    results_count,
    request_ip,
    request_user_agent,
    session_id
  );
  
  -- Update or insert popular search
  INSERT INTO public.popular_searches (search_query, search_count, last_searched_at)
  VALUES (search_query, 1, now())
  ON CONFLICT (search_query)
  DO UPDATE SET 
    search_count = popular_searches.search_count + 1,
    last_searched_at = now();
END;
$$;

-- Function to get trending content
CREATE OR REPLACE FUNCTION public.get_trending_content(
  content_type text DEFAULT 'request',
  period_hours integer DEFAULT 24,
  limit_count integer DEFAULT 10
)
RETURNS TABLE (
  content_id uuid,
  content_text text,
  score decimal,
  views integer
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    tc.content_id,
    tc.content_text,
    tc.score,
    tc.views_24h as views
  FROM public.trending_content tc
  WHERE 
    tc.content_type = get_trending_content.content_type
    AND tc.period_start >= now() - (period_hours || ' hours')::interval
  ORDER BY tc.score DESC
  LIMIT limit_count;
$$;

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_view_count(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.verdict_requests
  SET 
    view_count = view_count + 1,
    last_viewed_at = now()
  WHERE id = request_id;
END;
$$;

-- 11. Triggers for automatic updates

-- Trigger to update search vectors on insert/update
CREATE OR REPLACE FUNCTION public.update_request_search_vector()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    COALESCE(NEW.category, '') || ' ' ||
    COALESCE(NEW.subcategory, '') || ' ' ||
    COALESCE(NEW.context, '') || ' ' ||
    COALESCE(NEW.text_content, '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_request_search_vector_trigger
  BEFORE INSERT OR UPDATE ON public.verdict_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_request_search_vector();

CREATE OR REPLACE FUNCTION public.update_response_search_vector()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    COALESCE(NEW.feedback, '') || ' ' ||
    COALESCE(NEW.tone, '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_response_search_vector_trigger
  BEFORE INSERT OR UPDATE ON public.verdict_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_response_search_vector();

-- Trigger to update tag usage counts
CREATE OR REPLACE FUNCTION public.update_tag_usage_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.content_tags
    SET usage_count = usage_count + 1
    WHERE id = NEW.tag_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.content_tags
    SET usage_count = GREATEST(0, usage_count - 1)
    WHERE id = OLD.tag_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER update_tag_usage_trigger
  AFTER INSERT OR DELETE ON public.verdict_request_tags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tag_usage_count();

-- 12. Initialize popular tags
INSERT INTO public.content_tags (name, slug, description, category, is_featured) VALUES
('professional', 'professional', 'Professional appearance and attire', 'appearance', true),
('casual', 'casual', 'Casual everyday looks', 'appearance', true),
('dating', 'dating', 'Dating profiles and photos', 'profile', true),
('linkedin', 'linkedin', 'LinkedIn profiles and professional networking', 'profile', true),
('resume', 'resume', 'Resume and CV content', 'writing', true),
('interview', 'interview', 'Job interview preparation', 'general', true),
('outfit', 'outfit', 'Outfit coordination and styling', 'appearance', true),
('headshot', 'headshot', 'Professional headshots and portraits', 'appearance', true),
('email', 'email', 'Email writing and communication', 'writing', true),
('cover-letter', 'cover-letter', 'Cover letter content and structure', 'writing', true),
('social-media', 'social-media', 'Social media content and profiles', 'general', true),
('business-casual', 'business-casual', 'Business casual attire', 'appearance', true);

-- 13. Function to initialize search vectors for existing data
SELECT public.update_search_vectors();