'use client';
import '@rainbow-me/rainbowkit/styles.css';
import { SessionProvider } from 'next-auth/react';

import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { arcTestnet } from '../lib/config/chains';

const config = getDefaultConfig({
  appName: 'ActFlow',
  projectId: process.env.NEXT_PUBLIC_RAINBOW_KIT_PROJECT_ID!,
  // Arc Testnet is the payment chain (per-task USDC payouts);
  // mainnet is kept for ENS name/avatar resolution.
  chains: [arcTestnet, mainnet],
  ssr: true, // If your dApp uses server side rendering (SSR)
});

export function Providers({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const queryClient = new QueryClient();

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <SessionProvider>{children}</SessionProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
