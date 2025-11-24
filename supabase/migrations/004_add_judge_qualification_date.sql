-- Add judge qualification tracking to profiles table
ALTER TABLE public.profiles 
ADD COLUMN judge_qualification_date timestamptz;