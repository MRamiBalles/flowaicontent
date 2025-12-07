import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "./useUser";

export interface Subscription {
    tier: "free" | "creator" | "pro" | "studio" | "business";
    status: "active" | "canceled" | "past_due";
    current_period_end: string;
}

export const useSubscription = () => {
    const { user } = useUser();

    const { data: subscription, isLoading, error } = useQuery({
        queryKey: ["subscription", user?.id],
        queryFn: async (): Promise<Subscription | null> => {
            if (!user) return null;

            const { data, error } = await supabase.functions.invoke("subscriptions?action=current", {
                method: "GET",
            });

            if (error) {
                console.error("Error fetching subscription:", error);
                // Fallback to free if error
                return { tier: "free", status: "active", current_period_end: new Date().toISOString() };
            }

            return data;
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

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
