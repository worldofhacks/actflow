/**
 * Arc (Circle testnet) payment config for the web app — the SINGLE source of
 * truth the hire/pay/receipt flow reads chain id, USDC token and explorer base
 * from. Everything is config-driven via @actflow/sdk (no hard-coded addresses /
 * chain ids in the UI) with a thin env override for the block explorer base so
 * deployments can point at a different scanner without a code change.
 *
 * Arc is Circle's stablecoin-native EVM L1 where USDC is the gas token; ActFlow
 * agents are paid per task in USDC on this chain via the documented x402 /
 * EIP-3009 transferWithAuthorization pattern.
 */
import {
  ARC_TESTNET_CHAIN_ID,
  ARC_TESTNET_EXPLORER_URL,
  ARC_TESTNET_USDC,
  ARC_TESTNET_USDC_ADDRESS,
  ARC_TESTNET_USDC_DECIMALS,
  arcTestnet,
} from '@actflow/sdk';

/** Arc testnet chain id (config-driven, from the SDK). */
export const ARC_CHAIN_ID = ARC_TESTNET_CHAIN_ID;

/** Canonical Arc USDC ERC-20 view (address + 6 decimals) — cited SDK constant. */
export const ARC_USDC = ARC_TESTNET_USDC;
export const ARC_USDC_ADDRESS = ARC_TESTNET_USDC_ADDRESS;
export const ARC_USDC_DECIMALS = ARC_TESTNET_USDC_DECIMALS;

/** The viem Chain object for Arc testnet (used for read-only balance reads). */
export const arcChain = arcTestnet;

/**
 * Block-explorer base URL. Defaults to the SDK's documented ArcScan testnet base
 * but can be overridden per-deployment via NEXT_PUBLIC_ARC_EXPLORER_URL.
 */
export const ARC_EXPLORER_BASE = (
  process.env.NEXT_PUBLIC_ARC_EXPLORER_URL || ARC_TESTNET_EXPLORER_URL
).replace(/\/+$/, '');

/** Build an explorer URL for a transaction hash (real settlements only). */
export function explorerTxUrl(txHash: string): string {
  return `${ARC_EXPLORER_BASE}/tx/${txHash}`;
}

/** Build an explorer URL for an address. */
export function explorerAddressUrl(address: string): string {
  return `${ARC_EXPLORER_BASE}/address/${address}`;
}

/**
 * Format a USDC base-unit amount (6 dp string) into a human display string,
 * trimming trailing zeros (e.g. "50000" -> "0.05"). Pure / no rounding loss for
 * the small testnet amounts used here.
 */
export function formatUsdc(baseUnits: string | number | bigint): string {
  let v: bigint;
  try {
    v = BigInt(baseUnits);
  } catch {
    return '0';
  }
  const negative = v < BigInt(0);
  if (negative) v = -v;
  const base = BigInt(10) ** BigInt(ARC_USDC_DECIMALS);
  const whole = v / base;
  const frac = v % base;
  const fracStr = frac.toString().padStart(ARC_USDC_DECIMALS, '0').replace(/0+$/, '');
  const out = fracStr.length > 0 ? `${whole}.${fracStr}` : `${whole}`;
  return negative ? `-${out}` : out;
}
