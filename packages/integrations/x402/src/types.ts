/**
 * Shared types for the ActFlow x402 / EIP-3009 payment layer.
 */

/** Asset descriptor inside a 402 challenge. */
export interface ChallengeAsset {
  /** USDC ERC-20 address. */
  address: `0x${string}`;
  decimals: number;
  symbol: string;
  /** EIP-712 domain name + version of the token (for transferWithAuthorization). */
  domainName: string;
  domainVersion: string;
}

/**
 * A 402 Payment Required descriptor — the JSON body an x402 resource server
 * returns alongside HTTP 402. Mirrors the x402 "accepts" shape, specialized to
 * the EIP-3009 transferWithAuthorization scheme on an EVM chain.
 *
 * Gateway-specific fields (facilitator URL, settlement domain) are UNVERIFIED
 * for Circle and intentionally omitted; this descriptor is self-contained for
 * the documented EIP-3009 flow.
 */
export interface PaymentChallenge {
  /** Always 402. */
  status: 402;
  /** x402 scheme — EIP-3009 exact-amount authorization. */
  scheme: "eip3009-transferWithAuthorization";
  /** x402 network family. */
  network: "evm";
  /** Target chain id. */
  chainId: number;
  /** Amount in token base units (string, to avoid bigint JSON issues). */
  amount: string;
  /** Human-readable amount (decimal string) for display only. */
  amountDecimal: string;
  /** Payee address (the agent/resource being paid). */
  recipient: `0x${string}`;
  /** The asset to pay in (default Arc USDC). */
  asset: ChallengeAsset;
  /** Resource identifier the payment unlocks (URL or opaque id). */
  resource: string;
  /** Unix seconds after which the challenge/authorization is invalid. */
  validBefore: number;
  /** Unix seconds before which the authorization is invalid (default 0). */
  validAfter: number;
  /** 32-byte hex nonce, unique per challenge (replay protection). */
  nonce: `0x${string}`;
  /** Optional human description. */
  description?: string;
}

/**
 * The EIP-3009 `transferWithAuthorization` message the buyer signs. Field names
 * + order are EXACTLY the EIP-3009 struct (do not reorder — affects the hash).
 */
export interface TransferWithAuthorizationMessage {
  from: `0x${string}`;
  to: `0x${string}`;
  value: string; // base units, string-encoded uint256
  validAfter: string; // unix seconds, string-encoded uint256
  validBefore: string; // unix seconds, string-encoded uint256
  nonce: `0x${string}`; // bytes32
}

/**
 * A signed payment payload — what the buyer returns in the `X-PAYMENT` header
 * (or request body) so the resource server can verify + settle.
 */
export interface PaymentPayload {
  scheme: "eip3009-transferWithAuthorization";
  network: "evm";
  chainId: number;
  asset: `0x${string}`;
  /** The signed authorization message. */
  authorization: TransferWithAuthorizationMessage;
  /** 65-byte secp256k1 signature over the EIP-712 typed data. */
  signature: `0x${string}`;
  /** Set when produced by the mock signer — never a real signature. */
  mock?: boolean;
}

/** Result of verifying (and optionally settling) a payment. */
export interface PaymentReceipt {
  paid: boolean;
  /** On-chain settlement tx hash, when settled. */
  txHash?: string;
  /** Recovered/asserted payer address. */
  payer?: `0x${string}`;
  /** True when this receipt was produced without real funds/settlement. */
  mock?: boolean;
  /** Why verification failed (when paid=false). */
  reason?: string;
}
