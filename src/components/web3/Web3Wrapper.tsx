import { WagmiProvider, http } from "wagmi";
import { polygon, polygonAmoy } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, getDefaultConfig, darkTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import React from "react";

const web3QueryClient = new QueryClient();

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

const config = getDefaultConfig({
    appName: "FlowAI",
    projectId,
    chains: [polygon, polygonAmoy],
    transports: {
        [polygon.id]: http(),
        [polygonAmoy.id]: http(),
    },
});

export default function Web3Wrapper({ children }: { children: React.ReactNode }) {
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
