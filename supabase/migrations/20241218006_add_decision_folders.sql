-- Decision Folders System
-- Allows users to organize their requests into folders for better decision tracking

-- Create decision folders table
CREATE TABLE decision_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(trim(name)) >= 1 AND length(trim(name)) <= 100),
  description TEXT CHECK (description IS NULL OR length(description) <= 500),
  color VARCHAR(7) DEFAULT '#6366f1' CHECK (color ~ '^#[0-9a-fA-F]{6}$'),
  icon VARCHAR(50) DEFAULT 'folder' CHECK (length(icon) <= 50),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add folder reference to verdict_requests
ALTER TABLE verdict_requests 
ADD COLUMN folder_id UUID REFERENCES decision_folders(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX idx_decision_folders_user_id ON decision_folders(user_id);
CREATE INDEX idx_decision_folders_sort_order ON decision_folders(user_id, sort_order);
CREATE INDEX idx_verdict_requests_folder_id ON verdict_requests(folder_id);
CREATE INDEX idx_verdict_requests_user_folder ON verdict_requests(user_id, folder_id);

-- Create unique constraint to prevent duplicate folder names per user
CREATE UNIQUE INDEX idx_decision_folders_user_name ON decision_folders(user_id, LOWER(TRIM(name)));

-- Add updated_at trigger for decision_folders
CREATE OR REPLACE FUNCTION update_decision_folders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_decision_folders_updated_at
  BEFORE UPDATE ON decision_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_decision_folders_updated_at();

-- Row Level Security policies
ALTER TABLE decision_folders ENABLE ROW LEVEL SECURITY;

-- Users can only see their own folders
CREATE POLICY "Users can view their own folders" 
  ON decision_folders FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can insert their own folders
CREATE POLICY "Users can create their own folders" 
  ON decision_folders FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own folders
CREATE POLICY "Users can update their own folders" 
  ON decision_folders FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can delete their own folders
CREATE POLICY "Users can delete their own folders" 
  ON decision_folders FOR DELETE 
  USING (auth.uid() = user_id);

-- Create default folders for existing users
INSERT INTO decision_folders (user_id, name, description, color, icon, sort_order)
SELECT DISTINCT 
  u.id,
  'General Decisions',
  'Your main decision tracking folder',
  '#6366f1',
  'folder',
  0
FROM auth.users u
WHERE u.id IN (SELECT DISTINCT user_id FROM verdict_requests)
ON CONFLICT DO NOTHING;

-- Add folder management functions
CREATE OR REPLACE FUNCTION get_user_folder_stats(user_uuid UUID)
RETURNS TABLE (
  folder_id UUID,
  folder_name TEXT,
  request_count BIGINT,
  completed_count BIGINT,
  avg_rating NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id as folder_id,
    f.name as folder_name,
    COUNT(vr.id) as request_count,
    COUNT(CASE WHEN vr.status = 'completed' THEN 1 END) as completed_count,
    AVG(v.rating) as avg_rating
  FROM decision_folders f
  LEFT JOIN verdict_requests vr ON f.id = vr.folder_id
  LEFT JOIN verdicts v ON vr.id = v.request_id
  WHERE f.user_id = user_uuid
  GROUP BY f.id, f.name, f.sort_order
  ORDER BY f.sort_order, f.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to move requests to folder
CREATE OR REPLACE FUNCTION move_requests_to_folder(
  request_ids UUID[],
  target_folder_id UUID,
  user_uuid UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  folder_owner UUID;
BEGIN
  -- Check if folder belongs to user
  SELECT user_id INTO folder_owner 
  FROM decision_folders 
  WHERE id = target_folder_id;
  
  IF folder_owner != user_uuid THEN
    RAISE EXCEPTION 'Folder does not belong to user';
  END IF;
  
  -- Update requests
  UPDATE verdict_requests 
  SET 
    folder_id = target_folder_id,
    updated_at = now()
  WHERE id = ANY(request_ids) 
    AND user_id = user_uuid;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create default folders for new users
CREATE OR REPLACE FUNCTION create_default_folders_for_user(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO decision_folders (user_id, name, description, color, icon, sort_order)
  VALUES 
    (user_uuid, 'General Decisions', 'Your main decision tracking folder', '#6366f1', 'folder', 0),
    (user_uuid, 'Career Moves', 'Job changes, promotions, and career decisions', '#10b981', 'briefcase', 1),
    (user_uuid, 'Personal Life', 'Relationships, lifestyle, and personal choices', '#f59e0b', 'heart', 2)
  ON CONFLICT (user_id, LOWER(TRIM(name))) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default folders for new users
CREATE OR REPLACE FUNCTION trigger_create_default_folders()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_default_folders_for_user(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on auth.users (if we have access)
-- This will be handled in the application layer instead due to auth schema restrictions

COMMENT ON TABLE decision_folders IS 'User-created folders for organizing verdict requests by topic or category';
COMMENT ON COLUMN decision_folders.color IS 'Hex color code for folder display (e.g., #6366f1)';
COMMENT ON COLUMN decision_folders.icon IS 'Icon identifier for folder display';
COMMENT ON COLUMN decision_folders.sort_order IS 'User-defined sort order for folder display';