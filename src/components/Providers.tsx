'use client';

import * as React from 'react';
import {
    RainbowKitProvider,
    darkTheme,
    lightTheme
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";

import { config } from '@/lib/config';
import { SolanaProvider } from './SolanaProvider';
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
                    <RainbowKitWrapper>
                        <SolanaProvider>
                            {children}
                        </SolanaProvider>
                    </RainbowKitWrapper>
                </NextThemesProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}

function RainbowKitWrapper({ children }: { children: React.ReactNode }) {
    const { theme } = useTheme();

    return (
        <RainbowKitProvider
            theme={theme === 'dark' ? darkTheme() : lightTheme({
                accentColor: '#1a1b1f', // Dark charcoal accent for light mode
                accentColorForeground: 'white',
                borderRadius: 'medium',
            })}
        >
            {children}
        </RainbowKitProvider>
    );
}
