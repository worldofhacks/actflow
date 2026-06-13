/**
 * Chain + asset configuration for ActFlow x402 USDC micropayments on Arc.
 *
 * RULES:
 *  - ZERO hard-coded secrets. No keys here; signing is delegated to a wallet.
 *  - Chain id, RPC, and the USDC ERC-20 address are config-driven. The
 *    well-known Arc testnet USDC address is allowed as a CITED default constant
 *    (.claude/skills/arc-circle/SKILL.md "Addresses & Chain Config"); every
 *    value is env-overridable.
 *
 * The x402 layer here uses the DOCUMENTED EIP-3009 `transferWithAuthorization`
 * pattern (buyer signs a USDC payment authorization, verified offchain, settled
 * onchain). Circle Gateway-specific endpoints are UNVERIFIED (Circle x402 docs
 * 404'd) — see the gateway notes in index/README.
 */

export const ENV = {
  rpcUrl: "ARC_TESTNET_RPC_URL",
  chainId: "ARC_CHAIN_ID",
  usdcAddress: "ARC_USDC_ADDRESS",
  /** Force mock settlement even if a wallet + RPC are present. */
  forceMock: "X402_FORCE_MOCK",
} as const;

/** Arc Testnet defaults — VERIFIED LIVE per the task brief + arc-circle SKILL. */
export const ARC_TESTNET_DEFAULTS = {
  chainId: 5042002,
  rpcUrl: "https://rpc.testnet.arc.network",
  /** Cited well-known constant — arc-circle SKILL "Addresses & Chain Config". */
  usdcAddress: "0x3600000000000000000000000000000000000000" as const,
  /** ERC-20 interface decimals (6); native gas accounting is 18 on Arc. */
  usdcDecimals: 6,
  /** USDC ERC-20 EIP-712 domain name on most deployments (UNVERIFIED for Arc). */
  usdcDomainName: "USD Coin",
  /** EIP-712 domain version (UNVERIFIED for Arc — Circle USDC is typically "2"). */
  usdcDomainVersion: "2",
  explorer: "https://testnet.arcscan.app",
} as const;

export interface AssetConfig {
  /** USDC ERC-20 address on the target chain. */
  address: `0x${string}`;
  /** ERC-20 decimals. */
  decimals: number;
  /** EIP-712 domain name (token contract name). */
  domainName: string;
  /** EIP-712 domain version. */
  domainVersion: string;
  /** Symbol, for descriptors. */
  symbol: string;
}

export interface X402ChainConfig {
  chainId: number;
  rpcUrl: string;
  /** Default asset = Arc USDC. */
  asset: AssetConfig;
  explorer: string;
}

function isAddress(v: string): v is `0x${string}` {
  return /^0x[0-9a-fA-F]{40}$/.test(v);
}

/** Resolve chain + default USDC asset from env (Arc testnet defaults). */
export function resolveX402Config(
  env: NodeJS.ProcessEnv = process.env,
): X402ChainConfig {
  const rpcUrl = env[ENV.rpcUrl]?.trim() || ARC_TESTNET_DEFAULTS.rpcUrl;

  const chainIdRaw = env[ENV.chainId]?.trim();
  let chainId: number = ARC_TESTNET_DEFAULTS.chainId;
  if (chainIdRaw) {
    const parsed = Number(chainIdRaw);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new Error(`${ENV.chainId}="${chainIdRaw}" is not a positive integer.`);
    }
    chainId = parsed;
  }

  const usdcRaw = env[ENV.usdcAddress]?.trim();
  let usdcAddress: `0x${string}` = ARC_TESTNET_DEFAULTS.usdcAddress;
  if (usdcRaw) {
    if (!isAddress(usdcRaw)) {
      throw new Error(`${ENV.usdcAddress}="${usdcRaw}" is not a 20-byte 0x address.`);
    }
    usdcAddress = usdcRaw;
  }

  return {
    chainId,
    rpcUrl,
    explorer: ARC_TESTNET_DEFAULTS.explorer,
    asset: {
      address: usdcAddress,
      decimals: ARC_TESTNET_DEFAULTS.usdcDecimals,
      domainName: ARC_TESTNET_DEFAULTS.usdcDomainName,
      domainVersion: ARC_TESTNET_DEFAULTS.usdcDomainVersion,
      symbol: "USDC",
    },
  };
}
