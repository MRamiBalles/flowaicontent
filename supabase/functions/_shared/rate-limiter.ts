import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Rate Limiter Configuration
 */
export interface RateLimitConfig {
    limit: number;      // Max requests
    window: number;     // Window in seconds
    identifier: string; // Unique identifier (e.g., user_id or ip)
    action: string;     // Action name (e.g., 'create_post')
}

/**
 * Checks if a request exceeds the rate limit.
 * Uses the `check_rate_limit` RPC function in Postgres.
 * 
 * @param supabase - Supabase Client (Service Role preferred for reliability, but works with Auth too if RPC allows)
 * @param config - Rate limit configuration
 * @returns true if allowed, false if limited
 */
export async function checkRateLimit(
    supabase: SupabaseClient,
    config: RateLimitConfig
): Promise<boolean> {
    const key = `ratelimit:${config.identifier}:${config.action}`;

    const { data, error } = await supabase.rpc('check_rate_limit', {
        p_key: key,
        p_limit: config.limit,
        p_window_seconds: config.window
    });

    if (error) {
        console.error("Rate limit check failed:", error);
        // Fail open (allow request) if monitoring fails, or fail closed? 
        // Failing open is safer for UX in case of DB glitches.
        return true;
    }

    return data as boolean;
}
