-- ==========================================
-- FlowAI Mobile App & Device Management
-- Migration: 20251208170900_mobile_app.sql
-- Device tracking, push notifications, and sync
-- ==========================================

-- ==========================================
-- Mobile Devices
-- Registered user devices
-- ==========================================
CREATE TABLE IF NOT EXISTS public.mobile_devices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Device Info
    device_name text NOT NULL, -- e.g. "Manu's iPhone"
    device_type text NOT NULL CHECK (device_type IN ('ios', 'android', 'web')),
    device_model text,
    os_version text,
    app_version text,
    
    -- Push Notifications
    fcm_token text, -- Firebase Cloud Messaging token
    apns_token text, -- Apple Push Notification Service
    
    -- Status
    is_active boolean DEFAULT true,
    last_active_at timestamptz DEFAULT now(),
    
    -- Sync Settings
    sync_notifications boolean DEFAULT true,
    sync_chat boolean DEFAULT true,
    background_refresh boolean DEFAULT true,
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    
    UNIQUE(user_id, fcm_token)
);

COMMENT ON TABLE public.mobile_devices IS 'User mobile devices for push notifications and sync';

-- ==========================================
-- Mobile Sync Events
-- Queue for syncing data to devices
-- ==========================================
CREATE TABLE IF NOT EXISTS public.mobile_sync_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id uuid REFERENCES public.mobile_devices(id) ON DELETE CASCADE, -- Null for all devices
    
    -- Event Data
    event_type text NOT NULL, -- 'notification', 'chat_message', 'data_update'
    payload jsonb NOT NULL,
    priority text DEFAULT 'normal' CHECK (priority IN ('high', 'normal', 'low')),
    
    -- Status
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'delivered', 'failed')),
    attempts integer DEFAULT 0,
    next_retry_at timestamptz DEFAULT now(),
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    processed_at timestamptz
);

COMMENT ON TABLE public.mobile_sync_events IS 'Sync queue for mobile devices';

-- ==========================================
-- Mobile App Config
-- Remote configuration for the app
-- ==========================================
CREATE TABLE IF NOT EXISTS public.mobile_app_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Version Control
    min_supported_version text NOT NULL DEFAULT '1.0.0',
    current_latest_version text NOT NULL DEFAULT '1.0.0',
    force_update boolean DEFAULT false,
    
    -- Feature Flags
    features jsonb DEFAULT '{
        "voice_studio": true, 
        "streaming": true, 
        "ar_mode": false
    }',
    
    -- Maintenance
    is_maintenance_mode boolean DEFAULT false,
    maintenance_message text,
    
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.mobile_app_config IS 'Remote configuration for mobile apps';

-- Initialize default config
INSERT INTO public.mobile_app_config (min_supported_version, current_latest_version)
SELECT '1.0.0', '1.0.0'
WHERE NOT EXISTS (SELECT 1 FROM public.mobile_app_config);

-- ==========================================
-- RLS Policies
-- ==========================================

ALTER TABLE public.mobile_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_sync_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_app_config ENABLE ROW LEVEL SECURITY;

-- Devices: Users manage their own
CREATE POLICY "Users manage own devices"
ON public.mobile_devices
FOR ALL
USING (auth.uid() = user_id);

-- Sync Events: Users view own
CREATE POLICY "Users view own sync events"
ON public.mobile_sync_events
FOR SELECT
USING (auth.uid() = user_id);

-- App Config: Public read
CREATE POLICY "Public read config"
ON public.mobile_app_config
FOR SELECT
USING (true);

-- ==========================================
-- Indexes
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_mobile_devices_user 
ON public.mobile_devices(user_id);

CREATE INDEX IF NOT EXISTS idx_mobile_sync_user 
ON public.mobile_sync_events(user_id);

CREATE INDEX IF NOT EXISTS idx_mobile_sync_status 
ON public.mobile_sync_events(status);

-- ==========================================
-- Triggers
-- ==========================================

CREATE TRIGGER update_mobile_devices_updated_at
    BEFORE UPDATE ON public.mobile_devices
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
