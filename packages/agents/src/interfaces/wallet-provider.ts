/**
 * IWalletProvider now lives in @actflow/sdk (a dependency-free leaf package) so
 * the wallet integration packages can implement it without a dependency cycle
 * through @actflow/agents. This module re-exports it to keep every existing
 * `../interfaces/wallet-provider.js` import inside this package working.
 */
export {
  MockWalletProvider,
  type IWalletProvider,
  type PaymentRequest,
  type PaymentResult,
  type WalletBalance,
} from "@actflow/sdk";
