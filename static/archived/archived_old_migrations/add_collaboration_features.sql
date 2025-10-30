-- Migration: Add missing collaboration features columns
-- Date: 2025-10-17
-- Description: Add progress, estimatedHours, commentCount to tasks; 
--              Add viewCount, replyCount, likeCount, expiryDate to threads;
--              Add title, isPublic, tags, relatedItems, createdBy to notes

-- ====================================================================
-- COLLABORATION_TASKS: Add progress tracking and comments
-- ====================================================================

ALTER TABLE collaboration_tasks 
ADD COLUMN IF NOT EXISTS progress VARCHAR(10) DEFAULT '0',
ADD COLUMN IF NOT EXISTS estimated_hours VARCHAR(10),
ADD COLUMN IF NOT EXISTS comment_count VARCHAR(10) DEFAULT '0';

COMMENT ON COLUMN collaboration_tasks.progress IS 'Progress percentage as string (0-100)';
COMMENT ON COLUMN collaboration_tasks.estimated_hours IS 'Estimated hours for completion';
COMMENT ON COLUMN collaboration_tasks.comment_count IS 'Number of comments on this task';

-- ====================================================================
-- COLLABORATION_THREADS: Add engagement metrics and expiry
-- ====================================================================

ALTER TABLE collaboration_threads 
ADD COLUMN IF NOT EXISTS view_count VARCHAR(10) DEFAULT '0',
ADD COLUMN IF NOT EXISTS reply_count VARCHAR(10) DEFAULT '0',
ADD COLUMN IF NOT EXISTS like_count VARCHAR(10) DEFAULT '0',
ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP;

COMMENT ON COLUMN collaboration_threads.view_count IS 'Number of views';
COMMENT ON COLUMN collaboration_threads.reply_count IS 'Number of replies';
COMMENT ON COLUMN collaboration_threads.like_count IS 'Number of likes';
COMMENT ON COLUMN collaboration_threads.expiry_date IS 'Expiry date for announcements';

-- ====================================================================
-- COLLABORATION_NOTES: Add title, visibility, tags and relations
-- ====================================================================

ALTER TABLE collaboration_notes 
ADD COLUMN IF NOT EXISTS title VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS related_items JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS created_by UUID;

COMMENT ON COLUMN collaboration_notes.title IS 'Optional title for the note';
COMMENT ON COLUMN collaboration_notes.is_public IS 'Public visibility flag';
COMMENT ON COLUMN collaboration_notes.tags IS 'Tags for categorization';
COMMENT ON COLUMN collaboration_notes.related_items IS 'Related tasks/threads';
COMMENT ON COLUMN collaboration_notes.created_by IS 'User who created the note';

-- ====================================================================
-- Create indexes for better performance
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_collaboration_threads_expiry_date 
ON collaboration_threads(expiry_date) 
WHERE expiry_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_collaboration_notes_created_by 
ON collaboration_notes(created_by) 
WHERE created_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_collaboration_notes_is_public 
ON collaboration_notes(is_public);

-- ====================================================================
-- Verification queries (comment out after running)
-- ====================================================================

-- Verify columns were added to tasks
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'collaboration_tasks' 
-- AND column_name IN ('progress', 'estimated_hours', 'comment_count');

-- Verify columns were added to threads
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'collaboration_threads' 
-- AND column_name IN ('view_count', 'reply_count', 'like_count', 'expiry_date');

-- Verify columns were added to notes
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'collaboration_notes' 
-- AND column_name IN ('title', 'is_public', 'tags', 'related_items', 'created_by');

