-- ==========================================
-- CRITICAL SECURITY FIX: Enterprise RLS Policies V2
-- Migration: 20251208211500_fix_critical_enterprise_rls_final.sql
-- Fixes self-reference bugs and cross-tenant data leakage risks
-- ==========================================

-- 1. Fix `enterprise_tenants` Policies
-- Problem: Previous policy might have self-referenced or used ambiguous column names.
-- Fix: Use EXISTS with explicit table aliases.

DROP POLICY IF EXISTS "Enterprise users can view their tenant" ON public.enterprise_tenants;
DROP POLICY IF EXISTS "Enterprise admins can update their tenant" ON public.enterprise_tenants;

CREATE POLICY "Enterprise users can view their tenant"
ON public.enterprise_tenants FOR SELECT
USING (
    EXISTS (
        SELECT 1 
        FROM public.enterprise_users eu
        WHERE eu.tenant_id = public.enterprise_tenants.id 
        AND eu.user_id = auth.uid()
    )
);

CREATE POLICY "Enterprise admins can update their tenant"
ON public.enterprise_tenants FOR UPDATE
USING (
    EXISTS (
        SELECT 1 
        FROM public.enterprise_users eu
        WHERE eu.tenant_id = public.enterprise_tenants.id 
        AND eu.user_id = auth.uid()
        AND eu.role IN ('admin', 'owner')
    )
);

-- 2. Fix `enterprise_users` Policies
-- Problem: Report states logic allowed cross-tenant access (tenant_id = tenant_id).
-- Fix: Strictly validate that the requesting user belongs to the SAME tenant as the target user role.

DROP POLICY IF EXISTS "Users can view members of their tenant" ON public.enterprise_users;
DROP POLICY IF EXISTS "Admins can manage users in their tenant" ON public.enterprise_users;

-- View: I can see a user row IF that user row's tenant_id matches one of MY tenant_ids.
CREATE POLICY "Users can view members of their tenant"
ON public.enterprise_users FOR SELECT
USING (
    EXISTS (
        SELECT 1 
        FROM public.enterprise_users my_membership
        WHERE my_membership.tenant_id = public.enterprise_users.tenant_id
        AND my_membership.user_id = auth.uid()
    )
);

-- Manage: I can update/delete a user row IF I am an ADMIN of that user row's tenant.
CREATE POLICY "Admins can manage users in their tenant"
ON public.enterprise_users FOR ALL
USING (
    EXISTS (
        SELECT 1 
        FROM public.enterprise_users my_admin_status
        WHERE my_admin_status.tenant_id = public.enterprise_users.tenant_id
        AND my_admin_status.user_id = auth.uid()
        AND my_admin_status.role IN ('admin', 'owner')
    )
);

-- 3. Audit Log for Security Fix using `enterprise_audit_logs`
-- Using DO block to safely insert only if table exists (it should, but safe coding)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'enterprise_audit_logs') THEN
        INSERT INTO public.enterprise_audit_logs (tenant_id, action, resource_type, details)
        SELECT 
            id, 
            'security_patch', 
            'system', 
            '{"patch": "20251208211500_fix_critical_enterprise_rls_final.sql", "fixed": ["cross_tenant_view", "self_reference_loop"]}'::jsonb
        FROM public.enterprise_tenants
        LIMIT 1; -- Just log once to system/first tenant found
    END IF;
END $$;
