import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "./useUser";

export interface Subscription {
    tier: "free" | "creator" | "pro" | "studio" | "business";
    status: "active" | "canceled" | "past_due";
    current_period_end: string;
}

/**
 * useSubscription - Fetch and manage user subscription state
 * 
 * Features:
 * - React Query caching (5 min stale time)
 * - Automatic fallback to free tier on error
 * - Tier hierarchy checking via canAccess()
 * 
 * Tier Hierarchy (ascending):
 * free < creator < pro < studio < business
 * 
 * @returns Subscription data, loading state, and access checker
 */
export const useSubscription = () => {
    const { user } = useUser();

    const { data: subscription, isLoading, error } = useQuery({
        queryKey: ["subscription", user?.id],
        queryFn: async (): Promise<Subscription | null> => {
            if (!user) return null;

            // Call subscriptions Edge Function to get current plan
            const { data, error } = await supabase.functions.invoke("subscriptions?action=current", {
                method: "GET",
            });

            if (error) {
                console.error("Error fetching subscription:", error);
                // Fallback: Default to free tier if API fails
                return { tier: "free", status: "active", current_period_end: new Date().toISOString() };
            }

            return data;
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });

    /**
     * Check if user's tier meets minimum requirement
     * 
     * Example:
     * - User has "pro" tier
     * - canAccess("creator") = true (pro >= creator)
     * - canAccess("business") = false (pro < business)
     * 
     * @param requiredTier - Minimum tier needed
     * @returns True if user meets or exceeds requirement
     */
    const canAccess = (requiredTier: string) => {
        if (!subscription) return false;
        const tiers = ["free", "creator", "pro", "studio", "business"];
        const userTierIndex = tiers.indexOf(subscription.tier);
        const requiredTierIndex = tiers.indexOf(requiredTier);
        return userTierIndex >= requiredTierIndex;
    };

    return {
        subscription,
        isLoading,
        error,
        canAccess
    };
};
