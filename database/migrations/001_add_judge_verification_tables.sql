-- Migration: Add judge verification and admin notification tables
-- Run this against your Supabase database

-- Judge verifications table
CREATE TABLE IF NOT EXISTS public.judge_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    linkedin_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ NULL,
    reviewed_by UUID NULL REFERENCES profiles(id) ON DELETE SET NULL,
    verification_type TEXT NOT NULL DEFAULT 'linkedin',
    notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_verification UNIQUE (user_id, verification_type)
);

-- Admin notifications table
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ NULL
);

-- Add RLS policies
ALTER TABLE public.judge_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Judges can read their own verifications
CREATE POLICY "Users can read own verifications"
ON public.judge_verifications
FOR SELECT
USING (user_id = auth.uid());

-- Judges can create their own verifications
CREATE POLICY "Users can create own verifications"
ON public.judge_verifications
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Admins can read all notifications (assumes is_admin field exists)
CREATE POLICY "Admins can read notifications"
ON public.admin_notifications
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND is_admin = TRUE
    )
);

-- Admins can update notifications (mark as read)
CREATE POLICY "Admins can update notifications"
ON public.admin_notifications
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND is_admin = TRUE
    )
);

-- Anyone authenticated can create admin notifications (for system notifications)
CREATE POLICY "System can create notifications"
ON public.admin_notifications
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_judge_verifications_user_id ON public.judge_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_judge_verifications_status ON public.judge_verifications(status);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON public.admin_notifications(read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON public.admin_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_priority ON public.admin_notifications(priority);