-- ============================================
-- STEEL THREAD: Multi-Tenant Video Projects
-- Paso 1: El Núcleo de Datos (The Data Core)
-- ============================================

-- 1. Add tenant_id to video_projects for multi-tenancy
ALTER TABLE public.video_projects 
ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.enterprise_tenants(id) ON DELETE SET NULL;

-- 2. Create index for tenant queries
CREATE INDEX IF NOT EXISTS idx_video_projects_tenant_id ON public.video_projects(tenant_id);

-- 3. Create composite index for efficient RLS queries
CREATE INDEX IF NOT EXISTS idx_video_projects_tenant_user ON public.video_projects(tenant_id, user_id);

-- 4. Security definer function for tenant membership check
CREATE OR REPLACE FUNCTION public.user_belongs_to_tenant(_user_id uuid, _tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.enterprise_users
    WHERE user_id = _user_id
      AND tenant_id = _tenant_id
      AND status = 'active'
  )
$$;

-- 5. Function to get user's active tenant
CREATE OR REPLACE FUNCTION public.get_user_tenant(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id
  FROM public.enterprise_users
  WHERE user_id = _user_id
    AND status = 'active'
  LIMIT 1
$$;

-- 6. Drop existing policies for video_projects to recreate with tenant awareness
DROP POLICY IF EXISTS "Users can view own projects" ON public.video_projects;
DROP POLICY IF EXISTS "Users can create own projects" ON public.video_projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.video_projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.video_projects;

-- 7. Create new Multi-Tenant RLS policies for video_projects
-- Personal projects: user owns it and no tenant
CREATE POLICY "Users can view own personal projects"
ON public.video_projects
FOR SELECT
USING (
  auth.uid() = user_id 
  AND tenant_id IS NULL
);

-- Tenant projects: user belongs to tenant
CREATE POLICY "Tenant members can view tenant projects"
ON public.video_projects
FOR SELECT
USING (
  tenant_id IS NOT NULL 
  AND public.user_belongs_to_tenant(auth.uid(), tenant_id)
);

-- Create personal projects
CREATE POLICY "Users can create personal projects"
ON public.video_projects
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
);

-- Update own personal projects
CREATE POLICY "Users can update own personal projects"
ON public.video_projects
FOR UPDATE
USING (
  auth.uid() = user_id 
  AND tenant_id IS NULL
);

-- Tenant members can update tenant projects
CREATE POLICY "Tenant members can update tenant projects"
ON public.video_projects
FOR UPDATE
USING (
  tenant_id IS NOT NULL 
  AND public.user_belongs_to_tenant(auth.uid(), tenant_id)
);

-- Delete own personal projects
CREATE POLICY "Users can delete own personal projects"
ON public.video_projects
FOR DELETE
USING (
  auth.uid() = user_id 
  AND tenant_id IS NULL
);

-- Tenant admins can delete tenant projects
CREATE POLICY "Tenant admins can delete tenant projects"
ON public.video_projects
FOR DELETE
USING (
  tenant_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.enterprise_users eu
    WHERE eu.user_id = auth.uid()
      AND eu.tenant_id = video_projects.tenant_id
      AND eu.role IN ('owner', 'admin')
      AND eu.status = 'active'
  )
);

-- 8. Create MCP agent access table for tracking agent operations
CREATE TABLE IF NOT EXISTS public.mcp_agent_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tenant_id uuid REFERENCES public.enterprise_tenants(id) ON DELETE CASCADE,
  agent_type text NOT NULL DEFAULT 'video_editor',
  session_token text UNIQUE NOT NULL,
  permissions jsonb DEFAULT '{"read": true, "write": false, "delete": false}'::jsonb,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '1 hour'),
  created_at timestamptz DEFAULT now(),
  last_activity_at timestamptz DEFAULT now()
);

-- Enable RLS on mcp_agent_sessions
ALTER TABLE public.mcp_agent_sessions ENABLE ROW LEVEL SECURITY;

-- MCP session policies
CREATE POLICY "Users can view own agent sessions"
ON public.mcp_agent_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create agent sessions"
ON public.mcp_agent_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can revoke own agent sessions"
ON public.mcp_agent_sessions
FOR DELETE
USING (auth.uid() = user_id);

-- 9. Create audit log for MCP operations
CREATE TABLE IF NOT EXISTS public.mcp_operation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.mcp_agent_sessions(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  tenant_id uuid REFERENCES public.enterprise_tenants(id) ON DELETE SET NULL,
  operation text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  input_data jsonb,
  output_data jsonb,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  execution_time_ms integer,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mcp_operation_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own operation logs
CREATE POLICY "Users can view own MCP logs"
ON public.mcp_operation_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Tenant admins can view all tenant logs
CREATE POLICY "Tenant admins can view tenant MCP logs"
ON public.mcp_operation_logs
FOR SELECT
USING (
  tenant_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.enterprise_users eu
    WHERE eu.user_id = auth.uid()
      AND eu.tenant_id = mcp_operation_logs.tenant_id
      AND eu.role IN ('owner', 'admin')
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mcp_sessions_user ON public.mcp_agent_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_mcp_sessions_token ON public.mcp_agent_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_mcp_logs_session ON public.mcp_operation_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_mcp_logs_user ON public.mcp_operation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_mcp_logs_tenant ON public.mcp_operation_logs(tenant_id);