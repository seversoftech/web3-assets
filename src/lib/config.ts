import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, bsc, arbitrum, optimism, base, avalanche, linea, zkSync, polygonZkEvm, fantom } from 'wagmi/chains';

export const config = getDefaultConfig({
    appName: 'Web3 Asset Dashboard',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
    chains: [mainnet, polygon, bsc, arbitrum, optimism, base, avalanche, linea, zkSync, polygonZkEvm, fantom],
    ssr: true, // If your dApp uses server side rendering (SSR)
});
