-- ==========================================
-- CRITICAL SECURITY FIX: Enterprise RLS Policies
-- Migration: 20251208215100_fix_enterprise_rls_v2.sql
-- Fixes cross-tenant data leakage in all enterprise tables
-- ==========================================

-- ========================================
-- 1. FIX enterprise_tenants TABLE
-- Bug: `tenant_id = enterprise_users.id` (comparing tenant_id to user uuid!)
-- ========================================

DROP POLICY IF EXISTS "Enterprise admins can view own tenant" ON public.enterprise_tenants;
DROP POLICY IF EXISTS "Members can view own tenant" ON public.enterprise_tenants;
DROP POLICY IF EXISTS "Owners can update own tenant" ON public.enterprise_tenants;

-- SELECT: Members of tenant can view their tenant
CREATE POLICY "enterprise_tenants_select"
ON public.enterprise_tenants FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.enterprise_users eu
        WHERE eu.tenant_id = enterprise_tenants.id
        AND eu.auth_user_id = auth.uid()
    )
);

-- UPDATE: Only owners/admins can update their tenant
CREATE POLICY "enterprise_tenants_update"
ON public.enterprise_tenants FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.enterprise_users eu
        WHERE eu.tenant_id = enterprise_tenants.id
        AND eu.auth_user_id = auth.uid()
        AND eu.enterprise_role IN ('owner', 'admin')
    )
);

-- ========================================
-- 2. FIX enterprise_users TABLE
-- Bug: `eu.tenant_id = eu.tenant_id` (always TRUE!)
-- ========================================

DROP POLICY IF EXISTS "Admins can manage own tenant users" ON public.enterprise_users;
DROP POLICY IF EXISTS "Members can view own tenant users" ON public.enterprise_users;
DROP POLICY IF EXISTS "Enterprise members can view colleagues" ON public.enterprise_users;

-- SELECT: Users can only see users in their own tenant
CREATE POLICY "enterprise_users_select"
ON public.enterprise_users FOR SELECT
USING (
    -- User is in the same tenant
    tenant_id IN (
        SELECT eu.tenant_id FROM public.enterprise_users eu
        WHERE eu.auth_user_id = auth.uid()
    )
);

-- INSERT: Only admins/owners can add users to their tenant
CREATE POLICY "enterprise_users_insert"
ON public.enterprise_users FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.enterprise_users eu
        WHERE eu.tenant_id = enterprise_users.tenant_id
        AND eu.auth_user_id = auth.uid()
        AND eu.enterprise_role IN ('owner', 'admin')
    )
);

-- UPDATE: Only admins/owners can modify users in their tenant
CREATE POLICY "enterprise_users_update"
ON public.enterprise_users FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.enterprise_users eu
        WHERE eu.tenant_id = enterprise_users.tenant_id
        AND eu.auth_user_id = auth.uid()
        AND eu.enterprise_role IN ('owner', 'admin')
    )
);

-- DELETE: Only owners can remove users from their tenant
CREATE POLICY "enterprise_users_delete"
ON public.enterprise_users FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.enterprise_users eu
        WHERE eu.tenant_id = enterprise_users.tenant_id
        AND eu.auth_user_id = auth.uid()
        AND eu.enterprise_role = 'owner'
    )
);

-- ========================================
-- 3. FIX enterprise_api_keys TABLE
-- Bug: `eu.tenant_id = eu.tenant_id` (always TRUE!)
-- ========================================

DROP POLICY IF EXISTS "Admins can manage api keys" ON public.enterprise_api_keys;
DROP POLICY IF EXISTS "Admins can view api keys" ON public.enterprise_api_keys;

-- SELECT: Admins can only view keys from their own tenant
CREATE POLICY "enterprise_api_keys_select"
ON public.enterprise_api_keys FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.enterprise_users eu
        WHERE eu.tenant_id = enterprise_api_keys.tenant_id
        AND eu.auth_user_id = auth.uid()
        AND eu.enterprise_role IN ('owner', 'admin')
    )
);

-- ALL (insert/update/delete): Admins manage keys in their tenant
CREATE POLICY "enterprise_api_keys_manage"
ON public.enterprise_api_keys FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.enterprise_users eu
        WHERE eu.tenant_id = enterprise_api_keys.tenant_id
        AND eu.auth_user_id = auth.uid()
        AND eu.enterprise_role IN ('owner', 'admin')
    )
);

-- ========================================
-- 4. FIX enterprise_audit_logs TABLE
-- Bug: `eu.tenant_id = eu.tenant_id` (always TRUE!)
-- ========================================

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.enterprise_audit_logs;

-- SELECT: Admins can only view logs from their own tenant
CREATE POLICY "enterprise_audit_logs_select"
ON public.enterprise_audit_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.enterprise_users eu
        WHERE eu.tenant_id = enterprise_audit_logs.tenant_id
        AND eu.auth_user_id = auth.uid()
        AND eu.enterprise_role IN ('owner', 'admin')
    )
);

-- ========================================
-- AUDIT LOG: Record this security fix
-- ========================================

INSERT INTO public.admin_audit_logs (action, admin_id, target_user_id, details)
SELECT 
    'security_fix_enterprise_rls_v2',
    (SELECT id FROM auth.users LIMIT 1),
    (SELECT id FROM auth.users LIMIT 1),
    jsonb_build_object(
        'migration', '20251208215100_fix_enterprise_rls_v2.sql',
        'fixed_tables', ARRAY['enterprise_tenants', 'enterprise_users', 'enterprise_api_keys', 'enterprise_audit_logs'],
        'fixed_policies', 7,
        'vulnerability', 'cross_tenant_data_leakage',
        'severity', 'CRITICAL',
        'timestamp', now()
    )
WHERE EXISTS (SELECT 1 FROM auth.users LIMIT 1);

-- ========================================
-- VERIFICATION COMMENT
-- After running this migration, verify policies with:
-- SELECT tablename, policyname, qual FROM pg_policies 
-- WHERE tablename LIKE 'enterprise%';
-- ========================================
