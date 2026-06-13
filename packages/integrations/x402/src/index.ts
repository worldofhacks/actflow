/**
 * @actflow/integrations-x402 — x402-style USDC micropayments for ActFlow agents
 * on Circle's Arc, using the DOCUMENTED EIP-3009 transferWithAuthorization
 * pattern (buyer signs a USDC payment authorization, verified offchain, settled
 * onchain).
 *
 *   build402Challenge({amount, asset?, recipient, chainId?, resource})
 *     -> a 402 PaymentRequired descriptor (HTTP 402 body shape)
 *   signPaymentAuthorization(walletProvider, challenge)
 *     -> an EIP-3009 transferWithAuthorization signature/payload
 *   verifyPayment(challenge, payload)
 *     -> validates (recipient/amount/asset/deadline) -> {paid, txHash?, mock?}
 *
 * MOCK mode produces clearly-labeled receipts (mock:true) without funds; REAL
 * mode settles on Arc when a funded settler + RPC are present.
 *
 * NO hard-coded secrets. Chain/USDC config is env-driven; Arc testnet USDC is a
 * CITED constant. Circle Gateway-specific endpoints/facilitator are UNVERIFIED
 * (Circle x402 docs 404'd) and intentionally not depended on.
 */

// Challenge construction
export {
  build402Challenge,
  type Build402ChallengeParams,
} from "./challenge.js";

// Signing (EIP-3009 authorization)
export {
  signPaymentAuthorization,
  challengeToMessage,
  type PaymentSigner,
  type TypedDataSigner,
  type SignOptions,
} from "./sign.js";

// Verification + settlement
export {
  verifyPayment,
  type PaymentSettler,
  type VerifyOptions,
} from "./verify.js";

// EIP-3009 primitives (typed-data assembly)
export {
  EIP3009_TYPES,
  EIP3009_PRIMARY_TYPE,
  buildDomain,
  buildTypedData,
  authorizationDigest,
  TRANSFER_WITH_AUTHORIZATION_ABI,
} from "./eip3009.js";

// Config
export {
  ENV,
  ARC_TESTNET_DEFAULTS,
  resolveX402Config,
  type AssetConfig,
  type X402ChainConfig,
} from "./config.js";

// Types
export type {
  ChallengeAsset,
  PaymentChallenge,
  TransferWithAuthorizationMessage,
  PaymentPayload,
  PaymentReceipt,
} from "./types.js";
