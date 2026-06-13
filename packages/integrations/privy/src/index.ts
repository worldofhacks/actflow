/**
 * @actflow/integrations-privy — Privy server-wallet provider for ActFlow agents.
 *
 * Implements the agents' IWalletProvider (getAddress/getBalance/pay) backed by
 * Privy server wallets on Arc, with a deterministic, clearly-labeled MOCK mode
 * that activates when Privy creds are absent so build + tests pass with no funds
 * or account. No hard-coded secrets; chain/USDC config is env-driven (Arc
 * testnet defaults are cited skill constants).
 */

// Provider
export {
  PrivyWalletProvider,
  createPrivyWalletProvider,
  type PrivyWalletProviderOptions,
} from "./provider.js";

// Config
export {
  ENV,
  ARC_TESTNET_DEFAULTS,
  resolveChainConfig,
  resolvePrivyConfig,
  type ChainConfig,
  type PrivyCreds,
  type PrivyProviderConfig,
} from "./config.js";

// Mock wallet primitives (deterministic, non-secret)
export {
  createMockWallet,
  mockTxHash,
  type MockWalletHandle,
} from "./mock-wallet.js";

// Re-export the wallet interface types this provider implements, so consumers
// can type against them without a direct @actflow/sdk import.
export type {
  IWalletProvider,
  WalletBalance,
  PaymentRequest,
  PaymentResult,
} from "@actflow/sdk";
