-- ==========================================
-- 2026 Advanced RLS & CDC Migration
-- Migration: 20260105000000_advanced_rls_cdc.sql
-- Goal: Enforce strict tenant isolation and enable real-time vector sync
-- ==========================================

-- 1. Configuration for Tenant Context
-- This function allows setting the current tenant in a session via:
-- SET app.current_tenant = 'uuid-here';
-- This is more secure than application-level filtering.

-- 2. Update existing policies to use app.current_tenant
-- We will apply this to critical tables identified (enterprise_users, storage, etc.)

DO $$ 
BEGIN
    -- Enable RLS on all public tables if not already enabled
    -- Execute this for safety
    ALTER TABLE IF EXISTS public.enterprise_tenants ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.enterprise_users ENABLE ROW LEVEL SECURITY;
END $$;

-- Policies for Enterprise Tenants
DROP POLICY IF EXISTS "Advanced Tenant Isolation Policy" ON public.enterprise_tenants;
CREATE POLICY "Advanced Tenant Isolation Policy"
ON public.enterprise_tenants FOR ALL
USING (
    id::text = current_setting('app.current_tenant', true)
);

-- Policies for Enterprise Users
DROP POLICY IF EXISTS "Advanced User Isolation Policy" ON public.enterprise_users;
CREATE POLICY "Advanced User Isolation Policy"
ON public.enterprise_users FOR ALL
USING (
    tenant_id::text = current_setting('app.current_tenant', true)
);

-- 3. Setup CDC (Change Data Capture) for RAG
-- We use a publication to allow external tools (like Airbyte or custom workers)
-- to stream changes into the vector database.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'vector_sync_publication') THEN
        CREATE PUBLICATION vector_sync_publication FOR ALL TABLES;
    END IF;
END $$;

-- 4. Function to ensure updated_at is always refreshed (for CDC detection)
CREATE OR REPLACE FUNCTION public.handle_cdc_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Helper function for backend to inject tenant
CREATE OR REPLACE FUNCTION auth.set_tenant_context(p_tenant_id uuid)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_tenant', p_tenant_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION auth.set_tenant_context IS 'Sets the app.current_tenant configuration for RLS enforcement';
