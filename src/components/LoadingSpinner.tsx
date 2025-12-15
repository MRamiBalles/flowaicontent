import { Loader2 } from "lucide-react";

/**
 * LoadingSpinner Component
 * 
 * Full-screen loading state with animated spinner.
 * 
 * Used for:
 * - Initial app load
 * - Route transitions
 * - Async data fetching
 * - Authentication checks
 * 
 * Features:
 * - Centered spinner
 * - Primary color theme
 * - Full viewport height
 * - Accessible loading text
 */
export const LoadingSpinner = () => {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground">Loading...</p>
            </div>
        </div>
    );
};
