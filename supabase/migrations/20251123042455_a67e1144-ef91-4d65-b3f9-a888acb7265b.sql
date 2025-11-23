-- Create table to track content generation attempts for rate limiting
CREATE TABLE IF NOT EXISTS public.generation_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.generation_attempts ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own attempts
CREATE POLICY "Users can view own generation attempts"
ON public.generation_attempts
FOR SELECT
USING (auth.uid() = user_id);

-- Create policy for users to insert their own attempts
CREATE POLICY "Users can insert own generation attempts"
ON public.generation_attempts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for efficient rate limiting queries
CREATE INDEX idx_generation_attempts_user_time 
ON public.generation_attempts(user_id, created_at DESC);

-- Add comment
COMMENT ON TABLE public.generation_attempts IS 'Tracks content generation attempts for rate limiting (10 per hour per user)';
