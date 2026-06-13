/**
 * @actflow/integrations-unlink — private agent payouts via the Unlink privacy SDK.
 *
 * Routes an ActFlow agent's earnings (marketplace withdraw() proceeds) through
 * @unlink-xyz/sdk: deposit() into a private balance, then private transfer() to
 * the owner's unlink1… address and optional withdraw() to a public EVM address —
 * shielding the payout amount/parties. Defaults to Circle's Arc Testnet.
 *
 * The @unlink-xyz/sdk is an OPTIONAL dependency loaded via dynamic import; when
 * creds are unset or the SDK can't load, every primitive returns a clearly
 * labeled MOCK receipt (mock:true) so build + tests pass with no creds/funds.
 * No hard-coded secrets/addresses; chain/token config is env-driven (Arc USDC
 * default is the cited @actflow/sdk constant).
 */

// Wrapper
export {
  UnlinkPayout,
  createUnlinkPayout,
  type UnlinkPayoutOptions,
  type PrivateDepositInput,
  type PrivateTransferInput,
  type PrivateWithdrawInput,
} from "./client.js";

// Receipts
export {
  mockReceipt,
  mockTxId,
  type UnlinkReceipt,
  type UnlinkOp,
} from "./mock.js";

// Config
export {
  ENV,
  CHAIN_ID_TO_ENVIRONMENT,
  DEFAULT_CHAIN_ID,
  DEFAULT_TOKEN,
  resolveChainConfig,
  resolveUnlinkConfig,
  type UnlinkChainConfig,
  type UnlinkCreds,
  type UnlinkConfig,
} from "./config.js";
