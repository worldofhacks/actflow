import { defineChain } from 'viem';

/**
 * Arc Testnet — Circle's stablecoin-native EVM L1 (USDC is the gas token).
 * ActFlow agents are paid per-task in USDC on this chain.
 *
 * Defined manually (rather than imported from viem/chains) so the pinned viem
 * version does not matter. Values from https://docs.arc.io/arc/references/connect-to-arc
 */
export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.arc.network'],
      webSocket: ['wss://rpc.testnet.arc.network'],
    },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
  testnet: true,
});
