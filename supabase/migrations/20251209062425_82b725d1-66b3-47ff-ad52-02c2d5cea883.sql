-- =============================================
-- Fix Enterprise RLS Policies - Cross-Tenant Data Leakage Bug
-- =============================================

-- Drop all broken enterprise policies
DROP POLICY IF EXISTS "Admins can manage enterprise keys" ON public.enterprise_api_keys;
DROP POLICY IF EXISTS "Admins can view enterprise keys" ON public.enterprise_api_keys;
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.enterprise_audit_logs;
DROP POLICY IF EXISTS "Tenant members can view tenant" ON public.enterprise_tenants;
DROP POLICY IF EXISTS "Tenant owners can update tenant" ON public.enterprise_tenants;
DROP POLICY IF EXISTS "Admins can manage users" ON public.enterprise_users;
DROP POLICY IF EXISTS "Tenant members can view colleagues" ON public.enterprise_users;

-- =============================================
-- Fixed enterprise_users policies (must be first - others depend on it)
-- =============================================
CREATE POLICY "enterprise_users_select_colleagues"
    ON public.enterprise_users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.enterprise_users AS my_membership
            WHERE my_membership.user_id = auth.uid()
            AND my_membership.tenant_id = enterprise_users.tenant_id
            AND my_membership.status = 'active'
        )
    );

CREATE POLICY "enterprise_users_admin_manage"
    ON public.enterprise_users FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.enterprise_users AS my_membership
            WHERE my_membership.user_id = auth.uid()
            AND my_membership.tenant_id = enterprise_users.tenant_id
            AND my_membership.role IN ('owner', 'admin')
        )
    );

-- =============================================
-- Fixed enterprise_tenants policies
-- =============================================
CREATE POLICY "enterprise_tenants_member_view"
    ON public.enterprise_tenants FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.enterprise_users AS eu
            WHERE eu.user_id = auth.uid()
            AND eu.tenant_id = enterprise_tenants.id
            AND eu.status = 'active'
        )
    );

CREATE POLICY "enterprise_tenants_owner_update"
    ON public.enterprise_tenants FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.enterprise_users AS eu
            WHERE eu.user_id = auth.uid()
            AND eu.tenant_id = enterprise_tenants.id
            AND eu.role = 'owner'
        )
    );

-- =============================================
-- Fixed enterprise_api_keys policies
-- =============================================
CREATE POLICY "enterprise_api_keys_admin_view"
    ON public.enterprise_api_keys FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.enterprise_users AS eu
            WHERE eu.user_id = auth.uid()
            AND eu.tenant_id = enterprise_api_keys.tenant_id
            AND eu.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "enterprise_api_keys_admin_manage"
    ON public.enterprise_api_keys FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.enterprise_users AS eu
            WHERE eu.user_id = auth.uid()
            AND eu.tenant_id = enterprise_api_keys.tenant_id
            AND eu.role IN ('owner', 'admin')
        )
    );

-- =============================================
-- Fixed enterprise_audit_logs policies
-- =============================================
CREATE POLICY "enterprise_audit_logs_admin_view"
    ON public.enterprise_audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.enterprise_users AS eu
            WHERE eu.user_id = auth.uid()
            AND eu.tenant_id = enterprise_audit_logs.tenant_id
            AND eu.role IN ('owner', 'admin')
        )
    );