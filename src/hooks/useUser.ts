import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * useUser - Simplified user and admin state hook
 * 
 * Similar to useAuth but includes admin role checking.
 * Use this when you need both user data AND admin status.
 * Use useAuth when you only need authentication state.
 * 
 * Admin Role:
 * - Checked via user_roles table
 * - RLS ensures users can only see own roles
 * - Admin users get access to /admin-dashboard route
 * 
 * @returns User data, admin status, and loading state
 */
export const useUser = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session on mount
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setUser(session.user);
                checkAdmin(session.user.id);
            }
            setLoading(false);
        });

        // Listen for auth state changes (login/logout)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                setUser(session.user);
                checkAdmin(session.user.id);
            } else {
                setUser(null);
                setIsAdmin(false);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    /**
     * Check if user has admin role
     * 
     * Queries user_roles table with RLS enabled.
     * Silent fail if error (defaults to non-admin).
     */
    const checkAdmin = async (userId: string) => {
        try {
            const { data } = await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", userId)
                .eq("role", "admin")
                .maybeSingle();

            setIsAdmin(!!data);
        } catch (error) {
            console.error("Error checking admin role:", error);
            // Fail closed: default to non-admin on error
        }
    };

    return { user, isAdmin, loading };
};
