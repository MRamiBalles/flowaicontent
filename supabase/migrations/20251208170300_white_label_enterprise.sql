-- ==========================================
-- White-Label Enterprise Platform Schema
-- Migration: 20251208170300_white_label_enterprise.sql
-- Multi-tenancy with SSO and custom branding
-- ==========================================

-- ==========================================
-- Enterprise Tenants Table
-- Main table for white-label instances
-- ==========================================
CREATE TABLE IF NOT EXISTS public.enterprise_tenants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Tenant identification
    slug text UNIQUE NOT NULL, -- subdomain: acme.flowai.studio
    name text NOT NULL,
    legal_name text NOT NULL,
    
    -- Branding
    logo_url text,
    logo_dark_url text,
    favicon_url text,
    primary_color text DEFAULT '#6366f1',
    secondary_color text DEFAULT '#8b5cf6',
    font_family text DEFAULT 'Inter',
    
    -- Custom domain
    custom_domain text UNIQUE,
    domain_verified boolean DEFAULT false,
    domain_ssl_status text DEFAULT 'pending',
    
    -- Contact info
    support_email text NOT NULL,
    billing_email text NOT NULL,
    
    -- SSO Configuration
    sso_enabled boolean DEFAULT false,
    sso_provider text CHECK (sso_provider IN ('saml', 'oidc', 'azure_ad', 'okta', 'google_workspace')),
    sso_metadata_url text,
    sso_entity_id text,
    sso_certificate text, -- Encrypted
    sso_login_url text,
    sso_logout_url text,
    
    -- Features & Limits
    features jsonb NOT NULL DEFAULT '{
        "voice_cloning": true,
        "video_editor": true,
        "licensing": true,
        "nft_marketplace": false,
        "api_access": true,
        "custom_models": false
    }'::jsonb,
    
    user_limit integer NOT NULL DEFAULT 100,
    storage_limit_gb integer NOT NULL DEFAULT 500,
    monthly_render_minutes integer NOT NULL DEFAULT 1000,
    
    -- Billing
    billing_plan text NOT NULL DEFAULT 'enterprise' CHECK (billing_plan IN ('enterprise', 'enterprise_plus', 'custom')),
    contract_start_date date NOT NULL,
    contract_end_date date NOT NULL,
    monthly_fee_cents integer NOT NULL,
    stripe_customer_id text,
    stripe_subscription_id text,
    
    -- Status
    status text NOT NULL DEFAULT 'provisioning' CHECK (status IN ('provisioning', 'active', 'suspended', 'cancelled')),
    
    -- Metadata
    metadata jsonb DEFAULT '{}',
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.enterprise_tenants IS 'White-label enterprise instances with custom branding and SSO';
COMMENT ON COLUMN public.enterprise_tenants.slug IS 'Subdomain for tenant: {slug}.flowai.studio';
COMMENT ON COLUMN public.enterprise_tenants.sso_certificate IS 'SSO signing certificate (encrypted at rest)';

-- ==========================================
-- Enterprise Users Table
-- Maps users to tenants with roles
-- ==========================================
CREATE TABLE IF NOT EXISTS public.enterprise_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    tenant_id uuid NOT NULL REFERENCES public.enterprise_tenants(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- User details (cached from auth)
    email text NOT NULL,
    full_name text,
    avatar_url text,
    
    -- Role within tenant
    role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'manager', 'member', 'viewer')),
    
    -- SSO identifier
    sso_id text, -- External ID from SSO provider
    sso_groups text[], -- Groups from SSO provider
    
    -- Department/Team
    department text,
    team text,
    job_title text,
    
    -- Permissions (can override defaults)
    custom_permissions jsonb DEFAULT '{}',
    
    -- Activity
    last_login_at timestamptz,
    last_active_at timestamptz,
    login_count integer DEFAULT 0,
    
    -- Status
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'deactivated')),
    invited_by uuid,
    invited_at timestamptz,
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    
    UNIQUE(tenant_id, user_id),
    UNIQUE(tenant_id, email)
);

COMMENT ON TABLE public.enterprise_users IS 'Enterprise tenant user memberships with roles';

-- ==========================================
-- Enterprise Invitations
-- Pending invitations to enterprise tenants
-- ==========================================
CREATE TABLE IF NOT EXISTS public.enterprise_invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    tenant_id uuid NOT NULL REFERENCES public.enterprise_tenants(id) ON DELETE CASCADE,
    
    -- Invitation details
    email text NOT NULL,
    role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member', 'viewer')),
    department text,
    team text,
    
    -- Invitation token
    token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    
    -- Sender
    invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message text,
    
    -- Status
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    
    -- Timestamps
    expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
    accepted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    
    UNIQUE(tenant_id, email)
);

COMMENT ON TABLE public.enterprise_invitations IS 'Pending invitations to join enterprise tenants';

-- ==========================================
-- Enterprise Audit Logs
-- Comprehensive audit trail for compliance
-- ==========================================
CREATE TABLE IF NOT EXISTS public.enterprise_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    tenant_id uuid NOT NULL REFERENCES public.enterprise_tenants(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Event details
    action text NOT NULL, -- e.g., 'user.invite', 'project.delete', 'settings.update'
    resource_type text NOT NULL, -- e.g., 'user', 'project', 'settings'
    resource_id text,
    
    -- Context
    details jsonb DEFAULT '{}',
    ip_address inet,
    user_agent text,
    session_id text,
    
    -- Result
    success boolean NOT NULL DEFAULT true,
    error_message text,
    
    -- Timestamp
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.enterprise_audit_logs IS 'Audit trail for enterprise compliance (SOC2, GDPR)';

-- ==========================================
-- Enterprise API Keys
-- API access for integrations
-- ==========================================
CREATE TABLE IF NOT EXISTS public.enterprise_api_keys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    tenant_id uuid NOT NULL REFERENCES public.enterprise_tenants(id) ON DELETE CASCADE,
    created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Key details
    name text NOT NULL,
    description text,
    key_prefix text NOT NULL, -- First 8 chars for identification
    key_hash text NOT NULL, -- bcrypt hash of full key
    
    -- Permissions
    scopes text[] NOT NULL DEFAULT ARRAY['read'],
    -- Options: read, write, admin, voice, video, license
    
    -- Rate limits
    rate_limit_per_minute integer DEFAULT 60,
    rate_limit_per_day integer DEFAULT 10000,
    
    -- Usage tracking
    last_used_at timestamptz,
    request_count bigint DEFAULT 0,
    
    -- Expiration
    expires_at timestamptz,
    
    -- Status
    is_active boolean NOT NULL DEFAULT true,
    revoked_at timestamptz,
    revoked_by uuid,
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.enterprise_api_keys IS 'API keys for enterprise integrations';

-- ==========================================
-- Enterprise Webhooks
-- Webhook configurations for events
-- ==========================================
CREATE TABLE IF NOT EXISTS public.enterprise_webhooks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    tenant_id uuid NOT NULL REFERENCES public.enterprise_tenants(id) ON DELETE CASCADE,
    created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Webhook details
    name text NOT NULL,
    url text NOT NULL,
    secret text NOT NULL, -- For signature verification
    
    -- Events to subscribe to
    events text[] NOT NULL DEFAULT ARRAY['*'],
    -- Options: video.created, video.rendered, license.purchased, user.joined, etc.
    
    -- Headers
    custom_headers jsonb DEFAULT '{}',
    
    -- Retry configuration
    retry_count integer DEFAULT 3,
    retry_delay_seconds integer DEFAULT 60,
    
    -- Health
    last_triggered_at timestamptz,
    last_success_at timestamptz,
    last_error text,
    failure_count integer DEFAULT 0,
    
    -- Status
    is_active boolean NOT NULL DEFAULT true,
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.enterprise_webhooks IS 'Webhook endpoints for enterprise event notifications';

-- ==========================================
-- Row Level Security
-- ==========================================

ALTER TABLE public.enterprise_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_webhooks ENABLE ROW LEVEL SECURITY;

-- Enterprise Tenants: Only tenant admins can view/manage
CREATE POLICY "Tenant admins can view their tenant"
ON public.enterprise_tenants FOR SELECT
USING (
    id IN (
        SELECT tenant_id FROM public.enterprise_users
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

CREATE POLICY "Tenant owners can update their tenant"
ON public.enterprise_tenants FOR UPDATE
USING (
    id IN (
        SELECT tenant_id FROM public.enterprise_users
        WHERE user_id = auth.uid() AND role = 'owner'
    )
);

-- Enterprise Users: Admins can manage, members can view
CREATE POLICY "Tenant members can view users"
ON public.enterprise_users FOR SELECT
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.enterprise_users
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Tenant admins can manage users"
ON public.enterprise_users FOR ALL
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.enterprise_users
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

-- Enterprise Invitations
CREATE POLICY "Admins can manage invitations"
ON public.enterprise_invitations FOR ALL
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.enterprise_users
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
);

-- Audit Logs: Admins read-only
CREATE POLICY "Admins can view audit logs"
ON public.enterprise_audit_logs FOR SELECT
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.enterprise_users
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

-- API Keys: Admins only
CREATE POLICY "Admins can manage API keys"
ON public.enterprise_api_keys FOR ALL
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.enterprise_users
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

-- Webhooks: Admins only
CREATE POLICY "Admins can manage webhooks"
ON public.enterprise_webhooks FOR ALL
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.enterprise_users
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

-- ==========================================
-- Indexes
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_enterprise_tenants_slug 
ON public.enterprise_tenants(slug);

CREATE INDEX IF NOT EXISTS idx_enterprise_tenants_domain 
ON public.enterprise_tenants(custom_domain) WHERE custom_domain IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_enterprise_tenants_status 
ON public.enterprise_tenants(status);

CREATE INDEX IF NOT EXISTS idx_enterprise_users_tenant 
ON public.enterprise_users(tenant_id);

CREATE INDEX IF NOT EXISTS idx_enterprise_users_user 
ON public.enterprise_users(user_id);

CREATE INDEX IF NOT EXISTS idx_enterprise_users_email 
ON public.enterprise_users(tenant_id, email);

CREATE INDEX IF NOT EXISTS idx_enterprise_invitations_token 
ON public.enterprise_invitations(token);

CREATE INDEX IF NOT EXISTS idx_enterprise_invitations_email 
ON public.enterprise_invitations(tenant_id, email);

CREATE INDEX IF NOT EXISTS idx_enterprise_audit_logs_tenant 
ON public.enterprise_audit_logs(tenant_id);

CREATE INDEX IF NOT EXISTS idx_enterprise_audit_logs_user 
ON public.enterprise_audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_enterprise_audit_logs_created 
ON public.enterprise_audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_enterprise_api_keys_tenant 
ON public.enterprise_api_keys(tenant_id);

-- ==========================================
-- Triggers
-- ==========================================

CREATE TRIGGER update_enterprise_tenants_updated_at
    BEFORE UPDATE ON public.enterprise_tenants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_enterprise_webhooks_updated_at
    BEFORE UPDATE ON public.enterprise_webhooks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- Helper Functions
-- ==========================================

-- Get tenant by slug or custom domain
CREATE OR REPLACE FUNCTION public.get_tenant_by_host(p_host text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tenant_id uuid;
BEGIN
    -- Try custom domain first
    SELECT id INTO v_tenant_id
    FROM public.enterprise_tenants
    WHERE custom_domain = p_host
      AND domain_verified = true
      AND status = 'active'
    LIMIT 1;
    
    IF FOUND THEN
        RETURN v_tenant_id;
    END IF;
    
    -- Extract slug from subdomain
    IF p_host LIKE '%.flowai.studio' THEN
        SELECT id INTO v_tenant_id
        FROM public.enterprise_tenants
        WHERE slug = split_part(p_host, '.', 1)
          AND status = 'active'
        LIMIT 1;
    END IF;
    
    RETURN v_tenant_id;
END;
$$;

-- Check if user has permission in tenant
CREATE OR REPLACE FUNCTION public.tenant_has_permission(
    p_tenant_id uuid,
    p_permission text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_role text;
    v_has_permission boolean := false;
BEGIN
    -- Get user's role in tenant
    SELECT role INTO v_user_role
    FROM public.enterprise_users
    WHERE tenant_id = p_tenant_id
      AND user_id = auth.uid()
      AND status = 'active';
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Check permissions based on role
    CASE v_user_role
        WHEN 'owner' THEN v_has_permission := true;
        WHEN 'admin' THEN v_has_permission := p_permission != 'tenant.delete';
        WHEN 'manager' THEN v_has_permission := p_permission IN ('user.view', 'user.invite', 'project.manage', 'content.manage');
        WHEN 'member' THEN v_has_permission := p_permission IN ('project.view', 'project.create', 'content.view', 'content.create');
        WHEN 'viewer' THEN v_has_permission := p_permission IN ('project.view', 'content.view');
    END CASE;
    
    RETURN v_has_permission;
END;
$$;

-- Log audit event
CREATE OR REPLACE FUNCTION public.log_enterprise_audit(
    p_tenant_id uuid,
    p_action text,
    p_resource_type text,
    p_resource_id text DEFAULT NULL,
    p_details jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_log_id uuid;
BEGIN
    INSERT INTO public.enterprise_audit_logs (
        tenant_id,
        user_id,
        action,
        resource_type,
        resource_id,
        details
    ) VALUES (
        p_tenant_id,
        auth.uid(),
        p_action,
        p_resource_type,
        p_resource_id,
        p_details
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$;

-- Accept invitation
CREATE OR REPLACE FUNCTION public.accept_enterprise_invitation(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invitation public.enterprise_invitations%ROWTYPE;
    v_user_email text;
    v_result jsonb;
BEGIN
    -- Get current user's email
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = auth.uid();
    
    -- Get invitation
    SELECT * INTO v_invitation
    FROM public.enterprise_invitations
    WHERE token = p_token
      AND status = 'pending'
      AND expires_at > now();
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
    END IF;
    
    -- Verify email matches
    IF v_invitation.email != v_user_email THEN
        RETURN jsonb_build_object('success', false, 'error', 'This invitation was sent to a different email address');
    END IF;
    
    -- Create enterprise user
    INSERT INTO public.enterprise_users (
        tenant_id,
        user_id,
        email,
        role,
        department,
        team,
        invited_by,
        invited_at
    ) VALUES (
        v_invitation.tenant_id,
        auth.uid(),
        v_user_email,
        v_invitation.role,
        v_invitation.department,
        v_invitation.team,
        v_invitation.invited_by,
        v_invitation.created_at
    );
    
    -- Update invitation status
    UPDATE public.enterprise_invitations
    SET status = 'accepted', accepted_at = now()
    WHERE id = v_invitation.id;
    
    -- Log audit event
    PERFORM public.log_enterprise_audit(
        v_invitation.tenant_id,
        'user.joined',
        'user',
        auth.uid()::text,
        jsonb_build_object('role', v_invitation.role, 'via', 'invitation')
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'tenant_id', v_invitation.tenant_id,
        'role', v_invitation.role
    );
END;
$$;
