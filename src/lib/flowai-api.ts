/**
 * FlowAI API Client - Extended with Auth
 * Adds authentication and FlowAI business logic endpoints
 */

import { supabase } from '@/integrations/supabase/client'

import { API_URL as BASE_API_URL } from '@/lib/api';

// Re-use centralized API URL configuration
const API_URL = BASE_API_URL.replace('/api/v1', '/v1');

interface ApiCallOptions extends RequestInit {
    skipAuth?: boolean
}

/**
 * Make authenticated API call
 */
export async function apiCall<T = any>(
    endpoint: string,
    options: ApiCallOptions = {}
): Promise<T> {
    const { skipAuth, ...fetchOptions } = options

    // Get Supabase session token
    if (!skipAuth) {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            throw new Error('Not authenticated')
        }

        fetchOptions.headers = {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
        }
    }

    const response = await fetch(`${API_URL}${endpoint}`, fetchOptions)

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
        throw new Error(error.detail || `API error: ${response.status}`)
    }

    return response.json()
}

/**
 * FlowAI API methods
 */
export const flowAPI = {
    // Subscriptions
    upgradeToTier: (tier: string) =>
        apiCall('/subscriptions/upgrade', {
            method: 'POST',
            body: JSON.stringify({ tier })
        }),

    // Tokens
    purchaseTokens: (amount: number) =>
        apiCall('/tokens/purchase', {
            method: 'POST',
            body: JSON.stringify({ amount })
        }),

    getTokenBalance: () => apiCall('/tokens/balance'),

    // Referrals
    getMyReferralCode: () => apiCall('/referrals/my-code'),

    inviteFriends: (emails: string[]) =>
        apiCall('/referrals/invite', {
            method: 'POST',
            body: JSON.stringify({ emails })
        }),

    getReferralStats: () => apiCall('/referrals/stats'),

    // Super Clips
    boostClip: (clipId: string, tier: string) =>
        apiCall('/super-clips/boost', {
            method: 'POST',
            body: JSON.stringify({ clip_id: clipId, tier })
        }),

    getTrendingClips: (limit = 50) =>
        apiCall(`/super-clips/trending?limit=${limit}`),

    // Season Pass
    getCurrentSeasonPass: () => apiCall('/season-pass/current'),

    upgradeToPremiumPass: () =>
        apiCall('/season-pass/upgrade-premium', { method: 'POST' }),

    // Achievements
    getMyAchievements: () => apiCall('/achievements/my-achievements'),

    getLeaderboard: (category = 'all', period = 'all_time') =>
        apiCall(`/achievements/leaderboard?category=${category}&period=${period}`),

    // Developer API
    createAPIKey: (name: string, tier: string) =>
        apiCall('/api/v1/keys', {
            method: 'POST',
            body: JSON.stringify({ name, tier })
        }),

    getAPIUsage: () => apiCall('/api/v1/usage'),

    // Export
    exportForSocial: (videoId: string, platforms: string[]) =>
        apiCall('/export/social', {
            method: 'POST',
            body: JSON.stringify({
                video_id: videoId,
                platforms,
                add_captions: true,
                add_watermark: true
            })
        }),

    // Bounties
    getActiveBounties: (limit = 50) =>
        apiCall(`/bounties/active?limit=${limit}`),

    submitBountyEntry: (bountyId: string, videoId: string, description?: string) =>
        apiCall('/bounties/submit-entry', {
            method: 'POST',
            body: JSON.stringify({ bounty_id: bountyId, video_id: videoId, description })
        }),
}
