/**
 * Chain + Privy configuration for the ActFlow Privy wallet provider.
 *
 * RULES:
 *  - ZERO hard-coded secrets. App id / app secret / authorization key come from
 *    the environment only (never defaulted, never logged).
 *  - Chain id, RPC, and the USDC ERC-20 address are config-driven. The well-known
 *    Arc testnet USDC address is allowed as a *cited* default constant (see
 *    .claude/skills/arc-circle/SKILL.md "Addresses & Chain Config"), but every
 *    value is overridable from the environment.
 *  - Arc native gas token IS USDC. The ERC-20 *interface* at the address below
 *    uses 6 decimals; native gas accounting uses 18 (skill "Dual-decimal USDC").
 */

/** Env var names — single source of truth so callers / docs stay in sync. */
export const ENV = {
  // Privy credentials (secrets — env only, never defaulted).
  appId: "PRIVY_APP_ID",
  appSecret: "PRIVY_APP_SECRET",
  authorizationKey: "PRIVY_AUTHORIZATION_KEY",
  // Optional: reuse an already-provisioned server wallet instead of creating one.
  walletId: "PRIVY_WALLET_ID",
  // Chain config (Arc testnet defaults, all overridable).
  rpcUrl: "ARC_TESTNET_RPC_URL",
  chainId: "ARC_CHAIN_ID",
  usdcAddress: "ARC_USDC_ADDRESS",
  // Force mock mode even if creds happen to be present (tests / CI).
  forceMock: "PRIVY_FORCE_MOCK",
} as const;

/**
 * Arc Testnet defaults. VERIFIED LIVE per the task brief + arc-circle SKILL:
 *  - chainId 5042002, RPC https://rpc.testnet.arc.network
 *  - USDC ERC-20 interface at 0x3600000000000000000000000000000000000000 (6 dp)
 * These are deployment constants (not secrets) and each is env-overridable.
 */
export const ARC_TESTNET_DEFAULTS = {
  chainId: 5042002,
  rpcUrl: "https://rpc.testnet.arc.network",
  /** Cited well-known constant — arc-circle SKILL "Addresses & Chain Config". */
  usdcAddress: "0x3600000000000000000000000000000000000000" as const,
  /** ERC-20 interface decimals on Arc (native-level is 18; ERC-20 view is 6). */
  usdcDecimals: 6,
  explorer: "https://testnet.arcscan.app",
} as const;

export interface ChainConfig {
  chainId: number;
  rpcUrl: string;
  usdcAddress: `0x${string}`;
  usdcDecimals: number;
  /** CAIP-2 string for Privy's `caip2` field, derived from chainId. */
  caip2: string;
  explorer: string;
}

export interface PrivyCreds {
  appId: string;
  appSecret: string;
  /** base64 PKCS8 P-256 key (no PEM headers) — optional; required for some apps. */
  authorizationKey?: string;
}

export interface PrivyProviderConfig {
  chain: ChainConfig;
  /** Present only when BOTH appId and appSecret are set and mock is not forced. */
  creds?: PrivyCreds;
  /** Resolved live/mock decision. */
  mode: "live" | "mock";
  /** Optional pre-provisioned wallet id to reuse. */
  walletId?: string;
}

function isAddress(v: string): v is `0x${string}` {
  return /^0x[0-9a-fA-F]{40}$/.test(v);
}

/** Resolve chain config from env, defaulting to Arc testnet. */
export function resolveChainConfig(
  env: NodeJS.ProcessEnv = process.env,
): ChainConfig {
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
    usdcAddress,
    usdcDecimals: ARC_TESTNET_DEFAULTS.usdcDecimals,
    caip2: `eip155:${chainId}`,
    explorer: ARC_TESTNET_DEFAULTS.explorer,
  };
}

function truthyFlag(v: string | undefined): boolean {
  if (!v) return false;
  const t = v.trim().toLowerCase();
  return t === "1" || t === "true" || t === "yes" || t === "on";
}

/**
 * Resolve the full provider config: chain + creds + live/mock decision.
 *
 * Mode is `live` ONLY when PRIVY_APP_ID and PRIVY_APP_SECRET are both present
 * and PRIVY_FORCE_MOCK is not set. Otherwise `mock`. Secrets are never logged.
 */
export function resolvePrivyConfig(
  env: NodeJS.ProcessEnv = process.env,
): PrivyProviderConfig {
  const chain = resolveChainConfig(env);
  const appId = env[ENV.appId]?.trim();
  const appSecret = env[ENV.appSecret]?.trim();
  const authorizationKey = env[ENV.authorizationKey]?.trim() || undefined;
  const walletId = env[ENV.walletId]?.trim() || undefined;
  const forced = truthyFlag(env[ENV.forceMock]);

  if (!forced && appId && appSecret) {
    return {
      chain,
      creds: { appId, appSecret, authorizationKey },
      mode: "live",
      walletId,
    };
  }
  return { chain, mode: "mock", walletId };
}
