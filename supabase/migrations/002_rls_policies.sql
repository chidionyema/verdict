-- ============================================
-- VERDICT MVP - Row Level Security Policies
-- ============================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.verdict_requests enable row level security;
alter table public.verdict_responses enable row level security;
alter table public.transactions enable row level security;
alter table public.judge_sessions enable row level security;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Users can view their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Judges can view basic info of other users (for display)
create policy "Authenticated users can view judge profiles"
  on public.profiles for select
  using (auth.role() = 'authenticated' and is_judge = true);

-- ============================================
-- VERDICT REQUESTS POLICIES
-- ============================================

-- Users can view their own requests
create policy "Users can view own requests"
  on public.verdict_requests for select
  using (auth.uid() = user_id and deleted_at is null);

-- Users can create requests
create policy "Users can create requests"
  on public.verdict_requests for insert
  with check (auth.uid() = user_id);

-- Users can update their own requests (flag, cancel)
create policy "Users can update own requests"
  on public.verdict_requests for update
  using (auth.uid() = user_id);

-- Judges can view open requests (not their own)
create policy "Judges can view open requests"
  on public.verdict_requests for select
  using (
    auth.uid() != user_id
    and status = 'open'
    and deleted_at is null
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and is_judge = true
    )
  );

-- Admins can view all requests
create policy "Admins can view all requests"
  on public.verdict_requests for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- ============================================
-- VERDICT RESPONSES POLICIES
-- ============================================

-- Request owners can view responses to their requests
create policy "Request owners can view responses"
  on public.verdict_responses for select
  using (
    exists (
      select 1 from public.verdict_requests
      where id = request_id and user_id = auth.uid()
    )
  );

-- Judges can view their own responses
create policy "Judges can view own responses"
  on public.verdict_responses for select
  using (auth.uid() = judge_id);

-- Judges can create responses
create policy "Judges can create responses"
  on public.verdict_responses for insert
  with check (
    auth.uid() = judge_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and is_judge = true
    )
    and exists (
      select 1 from public.verdict_requests
      where id = request_id
        and user_id != auth.uid()
        and status = 'open'
    )
  );

-- Admins can view all responses
create policy "Admins can view all responses"
  on public.verdict_responses for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- ============================================
-- TRANSACTIONS POLICIES
-- ============================================

-- Users can view their own transactions
create policy "Users can view own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

-- System creates transactions (via service role)
-- No insert policy for regular users

-- ============================================
-- JUDGE SESSIONS POLICIES
-- ============================================

-- Judges can view their own sessions
create policy "Judges can view own sessions"
  on public.judge_sessions for select
  using (auth.uid() = judge_id);

-- Judges can create/update their sessions
create policy "Judges can manage own sessions"
  on public.judge_sessions for insert
  with check (auth.uid() = judge_id);

create policy "Judges can update own sessions"
  on public.judge_sessions for update
  using (auth.uid() = judge_id);

-- ============================================
-- STORAGE POLICIES (for Supabase Storage)
-- ============================================
-- Run these in Supabase dashboard under Storage > Policies

-- Create bucket: requests (public read, authenticated write)
-- Policy: Authenticated users can upload to requests bucket
-- Policy: Anyone can read from requests bucket
