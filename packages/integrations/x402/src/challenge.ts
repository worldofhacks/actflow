/**
 * build402Challenge — construct an HTTP 402 Payment Required descriptor for an
 * ActFlow resource priced in USDC on Arc, using the EIP-3009
 * transferWithAuthorization scheme.
 */
import { parseUnits } from "viem";
import { resolveX402Config, type AssetConfig } from "./config.js";
import type { ChallengeAsset, PaymentChallenge } from "./types.js";

export interface Build402ChallengeParams {
  /** Decimal amount string (e.g. "0.05") OR base units when `amountInBaseUnits`. */
  amount: string;
  /** Payee address. */
  recipient: `0x${string}`;
  /** Resource id / URL the payment unlocks. */
  resource: string;
  /** Default = Arc USDC from config. Override to price in another asset. */
  asset?: ChallengeAsset;
  /** Default = Arc testnet (5042002) from config. */
  chainId?: number;
  /** Seconds the challenge stays valid from `now` (default 600 = 10 min). */
  ttlSeconds?: number;
  /** Treat `amount` as base units instead of a decimal string. */
  amountInBaseUnits?: boolean;
  /** Optional human description. */
  description?: string;
  // --- deterministic injection points (tests) ---
  /** Override "now" (unix seconds). */
  now?: number;
  /** Provide the 32-byte nonce instead of generating one. */
  nonce?: `0x${string}`;
  /** Env override for config resolution. */
  env?: NodeJS.ProcessEnv;
}

function isAddress(v: string): v is `0x${string}` {
  return /^0x[0-9a-fA-F]{40}$/.test(v);
}

function assetFromConfig(a: AssetConfig): ChallengeAsset {
  return {
    address: a.address,
    decimals: a.decimals,
    symbol: a.symbol,
    domainName: a.domainName,
    domainVersion: a.domainVersion,
  };
}

/** Generate a random 32-byte hex nonce (replay protection). */
function randomNonce(): `0x${string}` {
  const bytes = new Uint8Array(32);
  // Node 22 has global Web Crypto.
  crypto.getRandomValues(bytes);
  let hex = "0x";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return hex as `0x${string}`;
}

/**
 * Build a 402 PaymentRequired descriptor. Default asset is Arc USDC and default
 * chain is Arc testnet, both from config (env-overridable). The returned object
 * is the JSON body a resource server sends with an HTTP 402.
 */
export function build402Challenge(
  params: Build402ChallengeParams,
): PaymentChallenge {
  if (!isAddress(params.recipient)) {
    throw new Error(`recipient "${params.recipient}" is not a 20-byte 0x address.`);
  }
  if (!params.resource || !params.resource.trim()) {
    throw new Error("resource is required.");
  }

  const cfg = resolveX402Config(params.env);
  const asset = params.asset ?? assetFromConfig(cfg.asset);
  const chainId = params.chainId ?? cfg.chainId;

  if (params.chainId !== undefined) {
    if (!Number.isInteger(params.chainId) || params.chainId <= 0) {
      throw new Error(`chainId ${params.chainId} is not a positive integer.`);
    }
  }

  // Resolve base-unit amount.
  let amountBase: bigint;
  let amountDecimal: string;
  if (params.amountInBaseUnits) {
    amountBase = BigInt(params.amount);
    amountDecimal = formatBaseUnits(amountBase, asset.decimals);
  } else {
    amountBase = parseUnits(params.amount, asset.decimals);
    amountDecimal = params.amount;
  }
  if (amountBase <= 0n) {
    throw new Error("amount must be positive.");
  }

  const now = params.now ?? Math.floor(Date.now() / 1000);
  const ttl = params.ttlSeconds ?? 600;
  if (!Number.isInteger(ttl) || ttl <= 0) {
    throw new Error("ttlSeconds must be a positive integer.");
  }

  return {
    status: 402,
    scheme: "eip3009-transferWithAuthorization",
    network: "evm",
    chainId,
    amount: amountBase.toString(),
    amountDecimal,
    recipient: params.recipient,
    asset,
    resource: params.resource,
    validAfter: 0,
    validBefore: now + ttl,
    nonce: params.nonce ?? randomNonce(),
    ...(params.description ? { description: params.description } : {}),
  };
}

/** Minimal base-units -> decimal string (avoids importing formatUnits twice). */
function formatBaseUnits(value: bigint, decimals: number): string {
  const neg = value < 0n;
  const v = neg ? -value : value;
  const s = v.toString().padStart(decimals + 1, "0");
  const whole = s.slice(0, s.length - decimals);
  const frac = s.slice(s.length - decimals).replace(/0+$/, "");
  return (neg ? "-" : "") + (frac ? `${whole}.${frac}` : whole);
}
