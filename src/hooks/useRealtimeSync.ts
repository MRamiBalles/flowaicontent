import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface SyncEvent {
    id: string;
    user_id: string;
    event_type: string;
    payload: Record<string, unknown>;
    status: string;
    created_at: string;
}

interface UseRealtimeSyncOptions {
    userId: string | undefined;
    onEvent?: (event: SyncEvent) => void;
}

interface UseRealtimeSyncReturn {
    events: SyncEvent[];
    isConnected: boolean;
    error: Error | null;
    clearEvents: () => void;
}

/**
 * Hook for realtime sync event subscriptions
 * Replaces polling with WebSocket push notifications
 * 
 * @example
 * const { events, isConnected } = useRealtimeSync({
 *   userId: user?.id,
 *   onEvent: (event) => toast.info(`New: ${event.event_type}`)
 * });
 */
export function useRealtimeSync({
    userId,
    onEvent
}: UseRealtimeSyncOptions): UseRealtimeSyncReturn {
    const [events, setEvents] = useState<SyncEvent[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const clearEvents = useCallback(() => setEvents([]), []);

    useEffect(() => {
        if (!userId) {
            setIsConnected(false);
            return;
        }

        let channel: RealtimeChannel | null = null;

        const setupSubscription = async () => {
            try {
                // Subscribe to INSERT events on mobile_sync_events for this user
                channel = supabase
                    .channel(`sync_events_${userId}`)
                    .on(
                        'postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'mobile_sync_events',
                            filter: `user_id=eq.${userId}`
                        },
                        (payload) => {
                            const newEvent = payload.new as SyncEvent;
                            setEvents(prev => [newEvent, ...prev]);
                            onEvent?.(newEvent);
                        }
                    )
                    .subscribe((status) => {
                        setIsConnected(status === 'SUBSCRIBED');
                        if (status === 'CHANNEL_ERROR') {
                            setError(new Error('Realtime subscription failed'));
                        }
                    });

            } catch (err) {
                setError(err instanceof Error ? err : new Error('Unknown error'));
            }
        };

        setupSubscription();

        // Cleanup on unmount
        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [userId, onEvent]);

    return { events, isConnected, error, clearEvents };
}

/**
 * Hook for realtime device status updates
 */
export function useRealtimeDevices(userId: string | undefined) {
    const [devices, setDevices] = useState<any[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel(`devices_${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'mobile_devices',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setDevices(prev => [...prev, payload.new]);
                    } else if (payload.eventType === 'UPDATE') {
                        setDevices(prev =>
                            prev.map(d => d.id === payload.new.id ? payload.new : d)
                        );
                    } else if (payload.eventType === 'DELETE') {
                        setDevices(prev =>
                            prev.filter(d => d.id !== payload.old.id)
                        );
                    }
                }
            )
            .subscribe((status) => {
                setIsConnected(status === 'SUBSCRIBED');
            });

        // Initial load
        supabase
            .from('mobile_devices')
            .select('*')
            .eq('user_id', userId)
            .order('last_active_at', { ascending: false })
            .then(({ data }) => {
                if (data) setDevices(data);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);

    return { devices, isConnected };
}
