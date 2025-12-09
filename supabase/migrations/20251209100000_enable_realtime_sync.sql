-- ==========================================
-- Enable Supabase Realtime for Mobile Sync
-- Migration: 20251209100000_enable_realtime_sync.sql
-- Cost optimization: push-based sync instead of polling
-- ==========================================

-- Enable Realtime on mobile_sync_events table
-- This allows clients to subscribe to INSERT/UPDATE/DELETE events
ALTER PUBLICATION supabase_realtime ADD TABLE mobile_sync_events;

-- Also enable for mobile_devices to track device status changes
ALTER PUBLICATION supabase_realtime ADD TABLE mobile_devices;

-- Add index for faster realtime filtering by user
CREATE INDEX IF NOT EXISTS idx_mobile_sync_events_realtime 
ON public.mobile_sync_events(user_id, created_at DESC);

COMMENT ON TABLE public.mobile_sync_events IS 
'Sync queue for mobile devices. Realtime-enabled for push notifications.';
