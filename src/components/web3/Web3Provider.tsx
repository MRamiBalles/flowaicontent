import { WagmiProvider, createConfig, http } from "wagmi";
import { polygon, polygonAmoy } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, getDefaultConfig, darkTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import React from "react";

// Create a separate query client for Web3
const web3QueryClient = new QueryClient();

// Configure chains - Polygon Mainnet & Amoy Testnet
// Use a fallback project ID for development
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "demo";

let config: ReturnType<typeof getDefaultConfig>;

try {
    config = getDefaultConfig({
        appName: "FlowAI",
        projectId,
        chains: [polygon, polygonAmoy],
        transports: {
            [polygon.id]: http(),
            [polygonAmoy.id]: http(),
        },
    });
} catch (e) {
    console.error("Failed to initialize Web3 config:", e);
    // Fallback config
    config = getDefaultConfig({
        appName: "FlowAI",
        projectId: "demo",
        chains: [polygon],
        transports: {
            [polygon.id]: http(),
        },
    });
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
    // If WalletConnect projectId is not set, render children without Web3 wrapper
    if (!import.meta.env.VITE_WALLETCONNECT_PROJECT_ID) {
        return <>{children}</>;
    }

    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={web3QueryClient}>
                <RainbowKitProvider
                    theme={darkTheme({
                        accentColor: '#7c3aed',
                        accentColorForeground: 'white',
                        borderRadius: 'medium',
                    })}
                >
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
