-- ==========================================
-- Security Fix: Enterprise Tenants RLS
-- Migration: 20251208170750_fix_enterprise_rls.sql
-- Fixes critical logic error in enterprise_tenants policy
-- ==========================================

-- Drop the broken policies
DROP POLICY IF EXISTS "Enterprise users can view their tenant" ON public.enterprise_tenants;
DROP POLICY IF EXISTS "Enterprise users can view their tenant" ON public.enterprise_users; -- Just in case

-- Re-create the correct policy for enterprise_tenants
-- Old (Broken): 
-- USING (id IN (SELECT tenant_id FROM enterprise_users WHERE user_id = auth.uid()))
-- AND checking enterprise_users.tenant_id = enterprise_users.id (Self-reference bug mentioned in report)

-- Correct Policy:
-- Users can view the tenant record IF they are a member of that tenant
CREATE POLICY "Enterprise users can view their tenant"
ON public.enterprise_tenants FOR SELECT
USING (
    id IN (
        SELECT tenant_id 
        FROM public.enterprise_users 
        WHERE user_id = auth.uid()
    )
);

-- Ensure enterprise_users policy is also correct
-- Users can view members of their own tenant
DROP POLICY IF EXISTS "Users can view members of their tenant" ON public.enterprise_users;

CREATE POLICY "Users can view members of their tenant"
ON public.enterprise_users FOR SELECT
USING (
    tenant_id IN (
        SELECT tenant_id 
        FROM public.enterprise_users 
        WHERE user_id = auth.uid()
    )
);

-- Log the security fix
INSERT INTO public.enterprise_audit_logs (
    tenant_id,
    action,
    resource_type,
    details
) 
SELECT 
    tenant_id,
    'security_fix',
    'system',
    '{"fix": "enterprise_tenants_rls_policy", "severity": "critical"}'::jsonb
FROM public.enterprise_tenants 
LIMIT 1; -- Just log once effectively if any tenant exists, or ignore logic for system log
