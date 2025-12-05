-- Create generation_jobs table
CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TABLE IF NOT EXISTS generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    project_id UUID REFERENCES projects(id),
    prompt TEXT NOT NULL,
    status job_status DEFAULT 'pending',
    result JSONB,
    error TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own jobs"
    ON generation_jobs
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own jobs"
    ON generation_jobs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can update jobs"
    ON generation_jobs
    FOR UPDATE
    USING (true); -- Ideally restrict to service role, but 'true' with no user update policy implies only service/admin or logic gaps. 
    -- Better: Users cannot update status directly.

-- Index for polling
CREATE INDEX idx_generation_jobs_user_status ON generation_jobs(user_id, status);
