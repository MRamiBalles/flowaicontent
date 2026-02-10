import React from "react";

// Lazy-load Web3 dependencies only when WalletConnect is configured
const Web3Wrapper = React.lazy(() => import("./Web3Wrapper"));

export function Web3Provider({ children }: { children: React.ReactNode }) {
    // Skip Web3 entirely if no WalletConnect project ID is set
    if (!import.meta.env.VITE_WALLETCONNECT_PROJECT_ID) {
        return <>{children}</>;
    }

    return (
        <React.Suspense fallback={<>{children}</>}>
            <Web3Wrapper>{children}</Web3Wrapper>
        </React.Suspense>
    );
}
