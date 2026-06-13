/**
 * Configuration for the ActFlow Unlink private-payout wrapper.
 *
 * RULES (same as the sibling integrations packages):
 *  - ZERO hard-coded secrets. The API key and mnemonic come from the environment
 *    only — never defaulted, never logged.
 *  - Chain id and token address are config-driven. The default chain is Arc
 *    Testnet (5042002) — the Unlink SDK exposes an `arc-testnet` environment, so
 *    ActFlow's own Arc chain is the natural default. The default token is the
 *    cited Arc testnet USDC ERC-20 from @actflow/sdk (a dependency-free leaf;
 *    this package MUST NOT depend on @actflow/agents).
 *  - Unlink contract addresses are NOT documented; the SDK resolves them from the
 *    selected `environment`, so we never hard-code one here.
 */
import {
  ARC_TESTNET_CHAIN_ID,
  ARC_TESTNET_USDC,
} from "@actflow/sdk";

/** Env var names — single source of truth so callers / docs stay in sync. */
export const ENV = {
  /** Unlink backend API key (secret — env only, never defaulted). Enables live. */
  apiKey: "UNLINK_API_KEY",
  /** BIP-39 mnemonic for the agent's Unlink account (secret — env only). Enables live. */
  mnemonic: "UNLINK_MNEMONIC",
  /** Target chain id; mapped to an Unlink `environment`. Default Arc Testnet. */
  chainId: "UNLINK_CHAIN_ID",
  /** ERC-20 token address to shield. Default Arc USDC (from @actflow/sdk). */
  token: "UNLINK_TOKEN",
  /** Optional account derivation index for account.fromMnemonic. */
  accountIndex: "UNLINK_ACCOUNT_INDEX",
  /** Force mock mode even if creds happen to be present (tests / CI). */
  forceMock: "UNLINK_FORCE_MOCK",
} as const;

/**
 * Unlink `environment` names keyed by chain id, per the unlink-privacy SKILL
 * (supported-chains.md) and the SDK's exported `ENVIRONMENTS`. These are public
 * network constants, not secrets. Used to map a numeric UNLINK_CHAIN_ID onto the
 * SDK's `environment` string. Arc Testnet (5042002) is the ActFlow default.
 */
export const CHAIN_ID_TO_ENVIRONMENT: Readonly<Record<number, string>> = {
  5042002: "arc-testnet", // Arc Testnet — USDC as native gas (ActFlow default)
  84532: "base-sepolia", // Base Sepolia
  11155111: "ethereum-sepolia", // Ethereum Sepolia
  10143: "monad-testnet", // Monad Testnet
};

/** Default chain id: Arc Testnet (matches ActFlow's @actflow/sdk Arc config). */
export const DEFAULT_CHAIN_ID = ARC_TESTNET_CHAIN_ID; // 5042002

/** Default token: the cited Arc testnet USDC ERC-20 address (6 decimals). */
export const DEFAULT_TOKEN = ARC_TESTNET_USDC.address;

export interface UnlinkChainConfig {
  /** Numeric chain id (e.g. 5042002). */
  chainId: number;
  /** Unlink SDK `environment` string the chain id maps to (e.g. "arc-testnet"). */
  environment: string;
  /** ERC-20 token address to shield (0x…). */
  token: `0x${string}`;
}

export interface UnlinkCreds {
  /** Unlink backend API key (admin client). */
  apiKey: string;
  /** BIP-39 mnemonic for the custodial agent account. */
  mnemonic: string;
  /** Optional derivation index for account.fromMnemonic. */
  accountIndex?: number;
}

export interface UnlinkConfig {
  chain: UnlinkChainConfig;
  /** Present only when BOTH apiKey and mnemonic are set and mock is not forced. */
  creds?: UnlinkCreds;
  /** Resolved live/mock decision. */
  mode: "live" | "mock";
}

function isAddress(v: string): v is `0x${string}` {
  return /^0x[0-9a-fA-F]{40}$/.test(v);
}

function truthyFlag(v: string | undefined): boolean {
  if (!v) return false;
  const t = v.trim().toLowerCase();
  return t === "1" || t === "true" || t === "yes" || t === "on";
}

/**
 * Resolve the chain config (chain id -> Unlink environment + token), defaulting
 * to Arc Testnet. Throws on a malformed chain id, an unsupported chain id (no
 * known Unlink environment), or a malformed token address — fail loud rather
 * than silently mis-routing a payout.
 */
export function resolveChainConfig(
  env: NodeJS.ProcessEnv = process.env,
): UnlinkChainConfig {
  const chainIdRaw = env[ENV.chainId]?.trim();
  let chainId: number = DEFAULT_CHAIN_ID;
  if (chainIdRaw) {
    const parsed = Number(chainIdRaw);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new Error(`${ENV.chainId}="${chainIdRaw}" is not a positive integer.`);
    }
    chainId = parsed;
  }

  const environment = CHAIN_ID_TO_ENVIRONMENT[chainId];
  if (!environment) {
    const supported = Object.keys(CHAIN_ID_TO_ENVIRONMENT).join(", ");
    throw new Error(
      `${ENV.chainId}="${chainId}" has no known Unlink environment. Supported chain ids: ${supported}.`,
    );
  }

  const tokenRaw = env[ENV.token]?.trim();
  let token: `0x${string}` = DEFAULT_TOKEN;
  if (tokenRaw) {
    if (!isAddress(tokenRaw)) {
      throw new Error(`${ENV.token}="${tokenRaw}" is not a 20-byte 0x address.`);
    }
    token = tokenRaw;
  }

  return { chainId, environment, token };
}

/**
 * Resolve the full Unlink config: chain + creds + live/mock decision.
 *
 * Mode is `live` ONLY when UNLINK_API_KEY and UNLINK_MNEMONIC are both present
 * and UNLINK_FORCE_MOCK is not set. Otherwise `mock`. (Whether the optional
 * @unlink-xyz/sdk actually loads is decided later, at client construction — if
 * it can't load, the client falls back to mock even when creds are present.)
 * Secrets are never logged.
 */
export function resolveUnlinkConfig(
  env: NodeJS.ProcessEnv = process.env,
): UnlinkConfig {
  const chain = resolveChainConfig(env);
  const apiKey = env[ENV.apiKey]?.trim();
  const mnemonic = env[ENV.mnemonic]?.trim();
  const forced = truthyFlag(env[ENV.forceMock]);

  const accountIndexRaw = env[ENV.accountIndex]?.trim();
  let accountIndex: number | undefined;
  if (accountIndexRaw) {
    const parsed = Number(accountIndexRaw);
    if (!Number.isInteger(parsed) || parsed < 0) {
      throw new Error(
        `${ENV.accountIndex}="${accountIndexRaw}" is not a non-negative integer.`,
      );
    }
    accountIndex = parsed;
  }

  if (!forced && apiKey && mnemonic) {
    return {
      chain,
      creds: { apiKey, mnemonic, accountIndex },
      mode: "live",
    };
  }
  return { chain, mode: "mock" };
}
