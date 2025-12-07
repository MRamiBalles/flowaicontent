import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useUser } from "@/hooks/useUser";
import { Loader2 } from "lucide-react";

export const RequireOnboarding = () => {
    const { user, loading } = useUser();
    const location = useLocation();
    const [checking, setChecking] = useState(true);
    const [completed, setCompleted] = useState(false);

    useEffect(() => {
        const checkOnboarding = () => {
            // Check local storage
            const local = localStorage.getItem("flowai_onboarding_completed");

            // In a real production app, checking a user profile column (e.g. profiles.onboarding_completed) 
            // is more robust than localStorage. For now, localStorage is sufficient for the MVP.

            setCompleted(local === "true");
            setChecking(false);
        };

        checkOnboarding();
    }, []);

    if (loading || checking) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // If not authenticated, let the individual pages handle redirect or redirect to auth here
    if (!user) {
        return <Navigate to="/auth" replace state={{ from: location }} />;
    }

    // If not completed and trying to go to a protected route (not onboarding), redirect to onboarding
    if (!completed && location.pathname !== "/onboarding") {
        return <Navigate to="/onboarding" replace />;
    }

    return <Outlet />;
};
