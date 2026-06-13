/**
 * Shared types for the hire / pay / receipt flow.
 *
 * These mirror the apps/api `/payments/*` controller contract EXACTLY. The web
 * client forwards the PaymentChallenge returned by /payments/hire back into
 * /payments/settle unchanged, so the shapes must stay byte-compatible.
 *
 * MOCK SAFETY: every settlement result and receipt carries a `mock` flag that is
 * propagated all the way to the UI. The UI MUST NOT present a mock payment as a
 * real on-chain payment (no fake tx hash / explorer link for mock receipts).
 */

/** Asset descriptor inside a 402 challenge (USDC on Arc). */
export interface ChallengeAsset {
  address: `0x${string}`;
  decimals: number;
  symbol: string;
  /** EIP-712 domain name + version of the token (for transferWithAuthorization). */
  domainName: string;
  domainVersion: string;
}

/** The 402 PaymentRequired descriptor returned by POST /payments/hire. */
export interface PaymentChallenge {
  status: 402;
  scheme: 'eip3009-transferWithAuthorization';
  network: 'evm';
  chainId: number;
  /** Amount in token base units (string). */
  amount: string;
  /** Human-readable decimal amount (display only). */
  amountDecimal: string;
  recipient: `0x${string}`;
  asset: ChallengeAsset;
  resource: string;
  validAfter: number;
  validBefore: number;
  nonce: `0x${string}`;
  description?: string;
}

/** The EIP-3009 transferWithAuthorization message the buyer signs. */
export interface TransferWithAuthorizationMessage {
  from: `0x${string}`;
  to: `0x${string}`;
  value: string;
  validAfter: string;
  validBefore: string;
  nonce: `0x${string}`;
}

/** Signed payment payload posted to /payments/settle. */
export interface PaymentPayload {
  scheme: 'eip3009-transferWithAuthorization';
  network: 'evm';
  chainId: number;
  asset: `0x${string}`;
  authorization: TransferWithAuthorizationMessage;
  signature: `0x${string}`;
  /** Set by the mock signer — never a real signature. */
  mock?: boolean;
}

/** ReceiptView returned by the API (single source for receipt rendering). */
export interface ReceiptView {
  id: string;
  method: 'x402' | 'world-trial';
  /** Payer address, or the World nullifier for world-trial receipts. */
  payer: string;
  agent: string;
  amount: string;
  amountDecimal?: string;
  asset?: string;
  chainId: number;
  txHash?: string;
  /** True => no real funds moved; UI must label it as a demo/mock payment. */
  mock: boolean;
  explorerUrl?: string;
  resource?: string;
  taskId?: string;
  userId?: string;
  createdAt: string;
}

/** POST /payments/settle endpoint reference inside a hire 402 response. */
export interface SettleRef {
  endpoint: string;
  method: string;
}

/** HTTP 402 response from POST /payments/hire — payment required. */
export interface HirePaymentRequiredResponse {
  status: 402;
  challenge: PaymentChallenge;
  settle: SettleRef;
}

/** HTTP 200 response from POST /payments/hire — free World-trial unlock. */
export interface HireWorldTrialResponse {
  status: 200;
  method: 'world-trial';
  unlocked: true;
  freeTrialsRemaining: number;
  receipt: ReceiptView;
}

/** Discriminated union of the two /payments/hire outcomes. */
export type HireResponse = HirePaymentRequiredResponse | HireWorldTrialResponse;

/** Request body for POST /payments/hire. */
export interface HireRequest {
  agentAddress?: string;
  resource: string;
  topic?: string;
  price?: string;
  description?: string;
  worldNullifier?: string;
  worldAction?: string;
}

/** Request body for POST /payments/settle. */
export interface SettleRequest {
  challenge: PaymentChallenge;
  payload: PaymentPayload;
  resource?: string;
}

/** HTTP 200 response from POST /payments/settle. */
export interface SettleResponse {
  paid: boolean;
  unlocked: boolean;
  mock: boolean;
  txHash?: string;
  explorerUrl?: string;
  /** Present only when paid=true. */
  receipt?: ReceiptView;
  /** Present only when paid=false. */
  reason?: string;
}

/** Type guard: did /payments/hire return a 402 payment-required descriptor? */
export function isPaymentRequired(r: HireResponse): r is HirePaymentRequiredResponse {
  return r.status === 402;
}
