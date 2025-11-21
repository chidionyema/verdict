-- ============================================
-- VERDICT MVP - Database Schema
-- ============================================

-- 1. PROFILES TABLE
-- Extends Supabase auth.users with app-specific data
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  display_name text,
  email text,
  is_judge boolean default false not null,
  is_admin boolean default false not null,
  country text,
  age_range text check (age_range in ('18-24', '25-34', '35-44', '45+')),
  gender text check (gender in ('male', 'female', 'nonbinary', 'prefer_not_say')),
  avatar_url text,
  credits int default 3 not null check (credits >= 0)
);

create index profiles_is_judge_idx on public.profiles(is_judge) where is_judge = true;
create index profiles_is_admin_idx on public.profiles(is_admin) where is_admin = true;

-- 2. VERDICT REQUESTS TABLE
-- Stores seeker requests for feedback
create table public.verdict_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'in_progress', 'closed', 'cancelled')),
  category text not null check (category in ('appearance', 'profile', 'writing', 'decision')),
  subcategory text,
  media_type text not null check (media_type in ('photo', 'text')),
  media_url text,
  text_content text,
  context text not null check (char_length(context) >= 20 and char_length(context) <= 500),
  target_verdict_count int not null default 10 check (target_verdict_count > 0),
  received_verdict_count int not null default 0 check (received_verdict_count >= 0),
  is_flagged boolean default false not null,
  flagged_reason text,
  deleted_at timestamptz
);

create index verdict_requests_user_idx on public.verdict_requests(user_id);
create index verdict_requests_status_idx on public.verdict_requests(status) where status = 'open';
create index verdict_requests_created_idx on public.verdict_requests(created_at desc);

-- 3. VERDICT RESPONSES TABLE
-- Stores judge verdicts
create table public.verdict_responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null,
  request_id uuid not null references public.verdict_requests(id) on delete cascade,
  judge_id uuid not null references public.profiles(id) on delete set null,
  rating int check (rating >= 1 and rating <= 10),
  feedback text not null check (char_length(feedback) >= 50 and char_length(feedback) <= 500),
  tone text not null check (tone in ('honest', 'constructive', 'encouraging')),
  is_flagged boolean default false not null,
  flagged_reason text
);

create index verdict_responses_request_idx on public.verdict_responses(request_id);
create index verdict_responses_judge_idx on public.verdict_responses(judge_id);
create unique index verdict_responses_unique_judge_request on public.verdict_responses(request_id, judge_id);

-- 4. TRANSACTIONS TABLE
-- Tracks credit purchases
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  type text not null check (type in ('purchase', 'adjustment', 'refund')),
  credits_delta int not null,
  amount_cents int not null check (amount_cents >= 0),
  currency text not null default 'usd',
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed'))
);

create index transactions_user_idx on public.transactions(user_id);
create index transactions_status_idx on public.transactions(status);
create index transactions_stripe_session_idx on public.transactions(stripe_session_id) where stripe_session_id is not null;

-- 5. JUDGE SESSIONS TABLE (optional tracking)
create table public.judge_sessions (
  id uuid primary key default gen_random_uuid(),
  judge_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz default now() not null,
  ended_at timestamptz
);

create index judge_sessions_judge_idx on public.judge_sessions(judge_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger verdict_requests_updated_at
  before update on public.verdict_requests
  for each row execute function public.handle_updated_at();

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-close request when target reached
create or replace function public.check_request_completion()
returns trigger as $$
begin
  update public.verdict_requests
  set status = 'closed'
  where id = new.request_id
    and received_verdict_count >= target_verdict_count
    and status = 'open';
  return new;
end;
$$ language plpgsql;

create trigger verdict_response_completion_check
  after insert on public.verdict_responses
  for each row execute function public.check_request_completion();
