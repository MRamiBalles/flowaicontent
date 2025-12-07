import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const useUser = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setUser(session.user);
                checkAdmin(session.user.id);
            }
            setLoading(false);
        });

        // Listen for auth changes
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
        }
    };

    return { user, isAdmin, loading };
};
