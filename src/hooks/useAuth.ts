import { useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * useAuth - Authentication state management hook
 * 
 * Manages Supabase authentication state across the application.
 * 
 * Pattern:
 * 1. Set up auth listener FIRST (to catch any auth changes)
 * 2. Then fetch initial session (to get current state)
 * 
 * This order prevents race conditions where auth state changes
 * between mounting and fetching the session.
 * 
 * State exposed:
 * - user: Current authenticated user object (null if logged out)
 * - session: Full session data including tokens
 * - loading: True until initial auth check completes
 * 
 * @returns {Object} Authentication state
 */
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    // This catches any auth changes that happen during initialization
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    // This gets the current auth state if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Cleanup: Unsubscribe from auth changes when component unmounts
    return () => subscription.unsubscribe();
  }, []);

  return { user, session, loading };
};