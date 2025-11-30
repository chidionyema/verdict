-- Update terminology from Judge/Verdict to Reviewer/Feedback

-- Update profiles table
ALTER TABLE profiles 
RENAME COLUMN is_judge TO is_reviewer;

-- Update verdict_requests table
ALTER TABLE verdict_requests
RENAME TO feedback_requests;

ALTER TABLE feedback_requests
RENAME COLUMN target_verdict_count TO target_feedback_count;

ALTER TABLE feedback_requests  
RENAME COLUMN received_verdict_count TO received_feedback_count;

-- Update verdict_responses table
ALTER TABLE verdict_responses
RENAME TO feedback_responses;

ALTER TABLE feedback_responses
RENAME COLUMN judge_id TO reviewer_id;

ALTER TABLE feedback_responses
RENAME COLUMN judge_earning TO reviewer_earning;

-- Update any views or functions that reference these tables
-- Note: You'll need to update any existing views, functions, and triggers 
-- that reference the old column/table names