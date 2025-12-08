-- ==========================================
-- FlowAI API Platform Schema
-- Migration: 20251208170500_api_platform.sql
-- Developer ecosystem with API keys, usage, documentation
-- ==========================================

-- ==========================================
-- Developer Accounts
-- Registered developers with API access
-- ==========================================
CREATE TABLE IF NOT EXISTS public.developer_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Developer info
    company_name text,
    website_url text,
    description text,
    logo_url text,
    
    -- Contact
    contact_email text NOT NULL,
    contact_name text,
    
    -- Verification
    is_verified boolean DEFAULT false,
    verified_at timestamptz,
    
    -- Tier
    tier text NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'pro', 'enterprise')),
    
    -- Usage limits (monthly)
    api_calls_limit integer NOT NULL DEFAULT 1000,
    storage_limit_mb integer NOT NULL DEFAULT 100,
    
    -- Billing
    stripe_customer_id text,
    stripe_subscription_id text,
    
    -- Status
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'banned')),
    
    -- Terms acceptance
    accepted_terms_at timestamptz,
    accepted_terms_version text,
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.developer_accounts IS 'Registered developers with API access';

-- ==========================================
-- API Keys
-- Authentication keys for API access
-- ==========================================
CREATE TABLE IF NOT EXISTS public.api_keys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    developer_id uuid NOT NULL REFERENCES public.developer_accounts(id) ON DELETE CASCADE,
    
    -- Key identification
    name text NOT NULL,
    description text,
    key_prefix text NOT NULL, -- First 8 chars for display: fai_xxxx
    key_hash text NOT NULL, -- SHA-256 hash
    
    -- Permissions
    scopes text[] NOT NULL DEFAULT ARRAY['read'],
    -- Options: read, write, voice, video, license, admin
    
    -- Restrictions
    allowed_origins text[], -- CORS origins
    allowed_ips text[], -- IP whitelist
    
    -- Rate limiting
    rate_limit_per_minute integer DEFAULT 60,
    rate_limit_per_hour integer DEFAULT 1000,
    rate_limit_per_day integer DEFAULT 10000,
    
    -- Usage tracking
    last_used_at timestamptz,
    last_used_ip inet,
    total_requests bigint DEFAULT 0,
    
    -- Expiration
    expires_at timestamptz,
    
    -- Status
    is_active boolean NOT NULL DEFAULT true,
    revoked_at timestamptz,
    revoked_reason text,
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.api_keys IS 'API authentication keys';
COMMENT ON COLUMN public.api_keys.key_hash IS 'SHA-256 hash of full key for verification';

-- ==========================================
-- API Usage Logs
-- Request tracking for billing and analytics
-- ==========================================
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    api_key_id uuid NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
    developer_id uuid NOT NULL REFERENCES public.developer_accounts(id) ON DELETE CASCADE,
    
    -- Request details
    endpoint text NOT NULL,
    method text NOT NULL,
    status_code integer NOT NULL,
    
    -- Performance
    response_time_ms integer,
    request_size_bytes integer,
    response_size_bytes integer,
    
    -- Context
    ip_address inet,
    user_agent text,
    
    -- Billing
    credits_consumed integer DEFAULT 0,
    
    -- Error tracking
    error_code text,
    error_message text,
    
    -- Timestamp
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.api_usage_logs IS 'API request logs for analytics and billing';

-- Partition by month for performance
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created 
ON public.api_usage_logs(created_at DESC);

-- ==========================================
-- API Endpoints Registry
-- Available API endpoints and documentation
-- ==========================================
CREATE TABLE IF NOT EXISTS public.api_endpoints (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Endpoint info
    path text NOT NULL UNIQUE,
    method text NOT NULL,
    name text NOT NULL,
    description text,
    
    -- Version
    version text NOT NULL DEFAULT 'v1',
    is_deprecated boolean DEFAULT false,
    deprecated_at timestamptz,
    sunset_at timestamptz,
    
    -- Authentication
    requires_auth boolean DEFAULT true,
    required_scopes text[] DEFAULT ARRAY['read'],
    
    -- Rate limiting
    default_rate_limit integer DEFAULT 60,
    
    -- Pricing
    credits_per_call integer DEFAULT 1,
    is_premium boolean DEFAULT false,
    
    -- Documentation
    request_schema jsonb,
    response_schema jsonb,
    example_request jsonb,
    example_response jsonb,
    
    -- Status
    is_active boolean DEFAULT true,
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.api_endpoints IS 'API endpoint registry and documentation';

-- ==========================================
-- Webhooks Configuration
-- Developer webhook endpoints
-- ==========================================
CREATE TABLE IF NOT EXISTS public.developer_webhooks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    developer_id uuid NOT NULL REFERENCES public.developer_accounts(id) ON DELETE CASCADE,
    
    -- Webhook config
    name text NOT NULL,
    url text NOT NULL,
    secret text NOT NULL, -- For signature verification
    
    -- Events
    events text[] NOT NULL DEFAULT ARRAY['*'],
    -- Options: video.created, voice.generated, license.purchased, etc.
    
    -- Headers
    custom_headers jsonb DEFAULT '{}',
    
    -- Retry config
    max_retries integer DEFAULT 3,
    retry_delay_seconds integer DEFAULT 60,
    timeout_seconds integer DEFAULT 30,
    
    -- Health
    last_triggered_at timestamptz,
    last_success_at timestamptz,
    last_failure_at timestamptz,
    failure_count integer DEFAULT 0,
    consecutive_failures integer DEFAULT 0,
    
    -- Status
    is_active boolean NOT NULL DEFAULT true,
    disabled_at timestamptz,
    disabled_reason text,
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.developer_webhooks IS 'Developer webhook endpoints';

-- ==========================================
-- Webhook Deliveries
-- Delivery attempts and status
-- ==========================================
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    webhook_id uuid NOT NULL REFERENCES public.developer_webhooks(id) ON DELETE CASCADE,
    
    -- Event details
    event_type text NOT NULL,
    event_id text NOT NULL,
    payload jsonb NOT NULL,
    
    -- Delivery attempt
    attempt_number integer NOT NULL DEFAULT 1,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'retrying')),
    
    -- Response
    response_status integer,
    response_body text,
    response_time_ms integer,
    
    -- Error
    error_message text,
    
    -- Timestamps
    scheduled_at timestamptz NOT NULL DEFAULT now(),
    delivered_at timestamptz,
    next_retry_at timestamptz
);

COMMENT ON TABLE public.webhook_deliveries IS 'Webhook delivery attempts';

-- ==========================================
-- SDK Downloads
-- Track SDK and library usage
-- ==========================================
CREATE TABLE IF NOT EXISTS public.sdk_downloads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    developer_id uuid REFERENCES public.developer_accounts(id) ON DELETE SET NULL,
    
    -- SDK info
    sdk_name text NOT NULL, -- js, python, go, etc.
    sdk_version text NOT NULL,
    
    -- Download context
    ip_address inet,
    user_agent text,
    
    -- Timestamp
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.sdk_downloads IS 'SDK download tracking';

-- ==========================================
-- Row Level Security
-- ==========================================

ALTER TABLE public.developer_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdk_downloads ENABLE ROW LEVEL SECURITY;

-- Developer Accounts: User owns their account
CREATE POLICY "Users can manage their developer account"
ON public.developer_accounts FOR ALL
USING (auth.uid() = user_id);

-- API Keys: Developer owns their keys
CREATE POLICY "Developers can manage their API keys"
ON public.api_keys FOR ALL
USING (
    developer_id IN (
        SELECT id FROM public.developer_accounts WHERE user_id = auth.uid()
    )
);

-- Usage Logs: Developer can view their logs
CREATE POLICY "Developers can view their usage logs"
ON public.api_usage_logs FOR SELECT
USING (
    developer_id IN (
        SELECT id FROM public.developer_accounts WHERE user_id = auth.uid()
    )
);

-- API Endpoints: Public read
CREATE POLICY "Anyone can view API endpoints"
ON public.api_endpoints FOR SELECT
USING (is_active = true);

-- Webhooks: Developer owns their webhooks
CREATE POLICY "Developers can manage their webhooks"
ON public.developer_webhooks FOR ALL
USING (
    developer_id IN (
        SELECT id FROM public.developer_accounts WHERE user_id = auth.uid()
    )
);

-- Webhook Deliveries: Developer can view their deliveries
CREATE POLICY "Developers can view their webhook deliveries"
ON public.webhook_deliveries FOR SELECT
USING (
    webhook_id IN (
        SELECT id FROM public.developer_webhooks 
        WHERE developer_id IN (
            SELECT id FROM public.developer_accounts WHERE user_id = auth.uid()
        )
    )
);

-- ==========================================
-- Indexes
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_developer_accounts_user 
ON public.developer_accounts(user_id);

CREATE INDEX IF NOT EXISTS idx_api_keys_developer 
ON public.api_keys(developer_id);

CREATE INDEX IF NOT EXISTS idx_api_keys_prefix 
ON public.api_keys(key_prefix);

CREATE INDEX IF NOT EXISTS idx_api_usage_developer 
ON public.api_usage_logs(developer_id);

CREATE INDEX IF NOT EXISTS idx_api_usage_key 
ON public.api_usage_logs(api_key_id);

CREATE INDEX IF NOT EXISTS idx_webhooks_developer 
ON public.developer_webhooks(developer_id);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook 
ON public.webhook_deliveries(webhook_id);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status 
ON public.webhook_deliveries(status) WHERE status IN ('pending', 'retrying');

-- ==========================================
-- Triggers
-- ==========================================

CREATE TRIGGER update_developer_accounts_updated_at
    BEFORE UPDATE ON public.developer_accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_developer_webhooks_updated_at
    BEFORE UPDATE ON public.developer_webhooks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- Helper Functions
-- ==========================================

-- Validate API key and return developer info
CREATE OR REPLACE FUNCTION public.validate_api_key(p_key_hash text)
RETURNS TABLE(
    developer_id uuid,
    api_key_id uuid,
    scopes text[],
    tier text,
    is_valid boolean,
    error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_key public.api_keys%ROWTYPE;
    v_dev public.developer_accounts%ROWTYPE;
BEGIN
    -- Find key by hash
    SELECT * INTO v_key
    FROM public.api_keys
    WHERE key_hash = p_key_hash
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT NULL::uuid, NULL::uuid, NULL::text[], NULL::text, false, 'Invalid API key';
        RETURN;
    END IF;
    
    -- Check if active
    IF NOT v_key.is_active THEN
        RETURN QUERY SELECT NULL::uuid, NULL::uuid, NULL::text[], NULL::text, false, 'API key is revoked';
        RETURN;
    END IF;
    
    -- Check expiration
    IF v_key.expires_at IS NOT NULL AND v_key.expires_at < now() THEN
        RETURN QUERY SELECT NULL::uuid, NULL::uuid, NULL::text[], NULL::text, false, 'API key has expired';
        RETURN;
    END IF;
    
    -- Get developer account
    SELECT * INTO v_dev
    FROM public.developer_accounts
    WHERE id = v_key.developer_id;
    
    IF v_dev.status != 'active' THEN
        RETURN QUERY SELECT NULL::uuid, NULL::uuid, NULL::text[], NULL::text, false, 'Developer account is suspended';
        RETURN;
    END IF;
    
    -- Update last used
    UPDATE public.api_keys
    SET last_used_at = now(), total_requests = total_requests + 1
    WHERE id = v_key.id;
    
    RETURN QUERY SELECT v_key.developer_id, v_key.id, v_key.scopes, v_dev.tier, true, NULL::text;
END;
$$;

-- Get usage summary for billing period
CREATE OR REPLACE FUNCTION public.get_usage_summary(
    p_developer_id uuid,
    p_start_date timestamptz DEFAULT date_trunc('month', now()),
    p_end_date timestamptz DEFAULT now()
)
RETURNS TABLE(
    total_requests bigint,
    successful_requests bigint,
    failed_requests bigint,
    credits_consumed bigint,
    avg_response_time numeric,
    top_endpoints jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE status_code < 400) AS successful,
            COUNT(*) FILTER (WHERE status_code >= 400) AS failed,
            COALESCE(SUM(credits_consumed), 0) AS credits,
            AVG(response_time_ms) AS avg_time
        FROM public.api_usage_logs
        WHERE developer_id = p_developer_id
          AND created_at BETWEEN p_start_date AND p_end_date
    ),
    endpoints AS (
        SELECT jsonb_agg(jsonb_build_object('endpoint', endpoint, 'count', cnt))
        FROM (
            SELECT endpoint, COUNT(*) as cnt
            FROM public.api_usage_logs
            WHERE developer_id = p_developer_id
              AND created_at BETWEEN p_start_date AND p_end_date
            GROUP BY endpoint
            ORDER BY cnt DESC
            LIMIT 5
        ) top
    )
    SELECT 
        s.total,
        s.successful,
        s.failed,
        s.credits,
        s.avg_time,
        COALESCE(e.jsonb_agg, '[]'::jsonb)
    FROM stats s, endpoints e;
END;
$$;
