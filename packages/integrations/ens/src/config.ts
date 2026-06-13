/**
 * ENS chain + contract configuration for ActFlow.
 *
 * RULES (enforced by ENS judges):
 *  - ZERO hard-coded ENS *names* in source — the parent name comes from
 *    `ENS_PARENT_NAME` only.
 *  - ZERO hard-coded chain IDs — chain id is read from viem/chains, never a
 *    literal. (The skill notes Sepolia's chain id is UNVERIFIED in ENS docs,
 *    so we MUST take it from `viem/chains` instead of hard-coding.)
 *  - Contract addresses default to the values the ens-agents SKILL distilled
 *    from https://docs.ens.domains/learn/deployments, but every one is
 *    overridable from the environment so nothing is locked to a guess.
 */
import { mainnet, sepolia } from "viem/chains";
import type { Chain } from "viem";

/** Networks ActFlow supports for ENS. */
export type EnsNetwork = "mainnet" | "sepolia";

/** Env var names — single source of truth so callers / docs stay in sync. */
export const ENV = {
  parentName: "ENS_PARENT_NAME",
  chain: "ENS_CHAIN",
  mainnetRpc: "MAINNET_RPC_URL",
  sepoliaRpc: "SEPOLIA_RPC_URL",
  // Optional per-contract overrides (see addressOverrideEnv()).
  // e.g. ENS_NAME_WRAPPER_MAINNET, ENS_PUBLIC_RESOLVER_SEPOLIA, ...
} as const;

/**
 * Contract addresses per network.
 *
 * Source of the DEFAULTS: ens-agents SKILL "Addresses & Chain Config" table,
 * distilled+verified from https://docs.ens.domains/learn/deployments. These are
 * deployment constants (not ENS *names*), so they are allowed as documented
 * defaults — but each is overridable via env (addressOverrideEnv) so the
 * package is never pinned to a value the operator can't change.
 */
const DEFAULT_ADDRESSES: Record<EnsNetwork, EnsAddresses> = {
  mainnet: {
    ensRegistry: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
    nameWrapper: "0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401",
    publicResolver: "0xF29100983E058B709F3D539b0c765937B804AC15",
    universalResolver: "0xeEeEEEeE14D718C2B47D9923Deab1335E144EeEe",
    reverseRegistrar: "0xa58E81fe9b61B5c3fE2AFD33CF304c454AbFc7Cb",
  },
  sepolia: {
    ensRegistry: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
    nameWrapper: "0x0635513f179D50A207757E05759CbD106d7dFcE8",
    publicResolver: "0xE99638b40E4Fff0129D56f03b55b6bbC4BBE49b5",
    universalResolver: "0xeEeEEEeE14D718C2B47D9923Deab1335E144EeEe",
    reverseRegistrar: "0xA0a1AbcDAe1a2a4A2EF8e9113Ff0e02DD81DC0C6",
  },
};

export interface EnsAddresses {
  ensRegistry: `0x${string}`;
  nameWrapper: `0x${string}`;
  publicResolver: `0x${string}`;
  universalResolver: `0x${string}`;
  reverseRegistrar: `0x${string}`;
}

export interface EnsConfig {
  /** Resolved network. */
  network: EnsNetwork;
  /** viem chain object — `chain.id` is the ONLY source of the chain id. */
  chain: Chain;
  /** RPC URL: env override > viem public RPC fallback. */
  rpcUrl: string;
  /** True when the RPC URL came from viem's public fallback (rate-limited). */
  usingPublicRpcFallback: boolean;
  /** Parent name (e.g. `actflow.eth`) — from ENS_PARENT_NAME, never hard-coded. */
  parentName: string | undefined;
  /** Resolved contract addresses for this network. */
  addresses: EnsAddresses;
}

const VIEM_CHAINS: Record<EnsNetwork, Chain> = { mainnet, sepolia };

/** Build the env var name for a per-contract address override. */
export function addressOverrideEnv(
  contract: keyof EnsAddresses,
  network: EnsNetwork,
): string {
  const map: Record<keyof EnsAddresses, string> = {
    ensRegistry: "ENS_REGISTRY",
    nameWrapper: "ENS_NAME_WRAPPER",
    publicResolver: "ENS_PUBLIC_RESOLVER",
    universalResolver: "ENS_UNIVERSAL_RESOLVER",
    reverseRegistrar: "ENS_REVERSE_REGISTRAR",
  };
  return `${map[contract]}_${network.toUpperCase()}`;
}

function resolveNetwork(env: NodeJS.ProcessEnv): EnsNetwork {
  const raw = (env[ENV.chain] ?? "sepolia").trim().toLowerCase();
  if (raw === "mainnet" || raw === "sepolia") return raw;
  throw new Error(
    `Invalid ${ENV.chain}="${raw}". Expected "mainnet" or "sepolia".`,
  );
}

function resolveRpc(
  network: EnsNetwork,
  chain: Chain,
  env: NodeJS.ProcessEnv,
): { rpcUrl: string; usingPublicRpcFallback: boolean } {
  const envVar = network === "mainnet" ? ENV.mainnetRpc : ENV.sepoliaRpc;
  const override = env[envVar]?.trim();
  if (override) return { rpcUrl: override, usingPublicRpcFallback: false };
  // viem ships a default public RPC per chain — use it as a graceful fallback
  // (good enough for reads; mints should set a real RPC).
  const fallback = chain.rpcUrls.default.http[0];
  if (!fallback) {
    throw new Error(
      `No RPC URL for ${network}: set ${envVar} (no viem public fallback available).`,
    );
  }
  return { rpcUrl: fallback, usingPublicRpcFallback: true };
}

function resolveAddresses(
  network: EnsNetwork,
  env: NodeJS.ProcessEnv,
): EnsAddresses {
  const defaults = DEFAULT_ADDRESSES[network];
  const out = { ...defaults };
  for (const key of Object.keys(defaults) as (keyof EnsAddresses)[]) {
    const override = env[addressOverrideEnv(key, network)]?.trim();
    if (override) {
      if (!/^0x[0-9a-fA-F]{40}$/.test(override)) {
        throw new Error(
          `${addressOverrideEnv(key, network)}="${override}" is not a 20-byte 0x address.`,
        );
      }
      out[key] = override as `0x${string}`;
    }
  }
  return out;
}

/**
 * Load the ENS config from the environment (or an explicit env object for
 * testing). Throws on invalid ENS_CHAIN or malformed address overrides;
 * a missing ENS_PARENT_NAME is allowed here (resolution still works) but
 * mintSubname/setAgentRecords will require it.
 */
export function loadEnsConfig(env: NodeJS.ProcessEnv = process.env): EnsConfig {
  const network = resolveNetwork(env);
  const chain = VIEM_CHAINS[network];
  const { rpcUrl, usingPublicRpcFallback } = resolveRpc(network, chain, env);
  const parentName = env[ENV.parentName]?.trim() || undefined;
  return {
    network,
    chain,
    rpcUrl,
    usingPublicRpcFallback,
    parentName,
    addresses: resolveAddresses(network, env),
  };
}

/** Like loadEnsConfig but throws if ENS_PARENT_NAME is missing (write ops). */
export function requireParentName(config: EnsConfig): string {
  if (!config.parentName) {
    throw new Error(
      `${ENV.parentName} is not set — required to mint subnames / write agent records.`,
    );
  }
  return config.parentName;
}
