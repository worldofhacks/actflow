/**
 * register-erc8004 — register an ActFlow agent in the ERC-8004 IdentityRegistry.
 *
 * ERC-8004 ("Trustless Agents") IdentityRegistry is an ERC-721 where each agent
 * is one tokenId (`agentId`). Registration mints the identity NFT and emits
 * `Registered(uint256 agentId, string agentURI, address owner)`; the agentId is
 * what AgentIdentityExtension.setIdentity(ensNode, erc8004Id, ensName) records
 * on-chain to bind the ENS identity to the ERC-8004 id.
 *
 * CONFIG-DRIVEN, NO INVENTED ADDRESSES:
 *   - registry address: env ERC8004_IDENTITY_REGISTRY, else the cited known
 *     deployment for the configured chain id (KNOWN_IDENTITY_REGISTRIES below).
 *   - chain id:         env ERC8004_CHAIN_ID, default Arc Testnet 5042002
 *     (registries are deployed there per the erc8004-bigquery skill).
 * Every literal address/chain-id below is cited verbatim from
 * .claude/skills/erc8004-bigquery/SKILL.md (cross-checked against
 * .claude/skills/arc-circle/SKILL.md for the Arc Testnet deployment). Nothing is
 * invented; callers may always override via env or options.
 *
 * DRY RUN (mock-safe, no funds): when `walletClient` is null OR no registry
 * address resolves, we assemble and return the would-be {registryAddress?,
 * chainId, dryRun:true, callData, agentURI} WITHOUT any network call. The real
 * path (funded wallet + resolved registry) sends the `register(string agentURI)`
 * tx and returns {erc8004Id, txHash, dryRun:false}.
 *
 * ARCHITECTURE: this module depends only DOWN (viem + plain config); it never
 * imports @actflow/integrations-* so it introduces no dependency cycle.
 */
import {
  encodeFunctionData,
  decodeEventLog,
  getAddress,
  type Abi,
} from "viem";

/**
 * Default ERC-8004 chain id. Arc Testnet (Circle) — registries are deployed
 * there per the erc8004-bigquery skill (TESTNET_CHAIN_IDS includes 5042002) and
 * the arc-circle skill's "register your first AI agent" tutorial.
 * Source: .claude/skills/erc8004-bigquery/SKILL.md (chain ids), arc-circle SKILL.
 */
export const DEFAULT_ERC8004_CHAIN_ID = 5042002 as const;

/**
 * Known ERC-8004 IdentityRegistry deployments, keyed by chain id. CITED verbatim
 * from .claude/skills/erc8004-bigquery/SKILL.md "Addresses & Chain Config"
 * (cross-checked with arc-circle SKILL for Arc Testnet). NEVER invented — used
 * only to default the registry when ERC8004_IDENTITY_REGISTRY is not set; any
 * chain id not listed here resolves to no registry (forcing DRY RUN) unless the
 * caller supplies an explicit address.
 *
 *   1        Ethereum mainnet   "MinimalUUPSMainnet v1.0.0"
 *   11155111 Sepolia            "MinimalUUPS v0.0.1" (same addr on all testnets)
 *   84532    Base Sepolia       same testnet address
 *   5042002  Arc Testnet        same testnet address (arc-circle tutorial)
 */
export const KNOWN_IDENTITY_REGISTRIES: Readonly<
  Record<number, `0x${string}`>
> = Object.freeze({
  // Mainnets (MinimalUUPSMainnet v1.0.0): same IdentityRegistry on Ethereum,
  // Base, Arbitrum One, Optimism, Polygon, BSC, Avalanche, Linea, Scroll,
  // Mantle, Celo, Gnosis. Source: erc8004-bigquery SKILL.
  1: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
  8453: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
  // Testnets (MinimalUUPS v0.0.1): same IdentityRegistry on every listed
  // testnet including Arc Testnet 5042002. Source: erc8004-bigquery + arc-circle.
  11155111: "0x8004A818BFB912233c491871b3d84c89A494BD9e",
  84532: "0x8004A818BFB912233c491871b3d84c89A494BD9e",
  421614: "0x8004A818BFB912233c491871b3d84c89A494BD9e",
  [DEFAULT_ERC8004_CHAIN_ID]: "0x8004A818BFB912233c491871b3d84c89A494BD9e",
});

/**
 * Minimal IdentityRegistry ABI — `register(string agentURI)` overload plus the
 * `Registered` event. Function/event signatures are verbatim from the
 * erc8004-bigquery skill ("Contract functions" + "Events"). `register()` has
 * three overloads; we use `register(string agentURI)` so the agent's
 * registration JSON (A2A/MCP/ENS endpoints, x402 support) is referenced at mint.
 *
 *   Registered(uint256 agentId indexed, string agentURI, address owner indexed)
 *   topic0 = 0xca52e62c367d81bb2e328eb795f7c7ba24afb478408a26c0e201d155c449bc4a
 */
export const IDENTITY_REGISTRY_REGISTER_ABI = [
  {
    type: "function",
    name: "register",
    stateMutability: "nonpayable",
    inputs: [{ name: "agentURI", type: "string" }],
    outputs: [{ name: "agentId", type: "uint256" }],
  },
  {
    type: "event",
    name: "Registered",
    inputs: [
      { name: "agentId", type: "uint256", indexed: true },
      { name: "agentURI", type: "string", indexed: false },
      { name: "owner", type: "address", indexed: true },
    ],
  },
] as const satisfies Abi;

/**
 * topic0 of `Registered(uint256,string,address)` — verbatim from the
 * erc8004-bigquery skill (computed from the ABI, sanity-checked vs ERC-721
 * Transfer). Used to locate the event log when decoding the real-path receipt.
 */
export const ERC8004_REGISTERED_TOPIC0 =
  "0xca52e62c367d81bb2e328eb795f7c7ba24afb478408a26c0e201d155c449bc4a" as const;

/** Structural viem WalletClient surface we need (kept loose, see ENS module). */
export interface Erc8004WalletClientLike {
  account?: { address: `0x${string}` } | null;
  /** viem WalletClient.writeContract — returns a tx hash. */
  writeContract: (args: any) => Promise<`0x${string}`>;
  /**
   * Optional public-client surface for awaiting the receipt + reading the
   * emitted agentId. When absent, the real path still returns the txHash but
   * leaves erc8004Id undefined (caller can resolve it later).
   */
  waitForTransactionReceipt?: (args: {
    hash: `0x${string}`;
  }) => Promise<{ logs: Array<{ address: string; topics: string[]; data: string }> }>;
}

/** What we know about the agent to register in ERC-8004. */
export interface RegisterErc8004Input {
  /** kebab-case agent slug (for logging / agentURI defaulting). */
  slug: string;
  /** Agent wallet address — becomes the ERC-721 owner of the identity NFT. */
  address: `0x${string}`;
  /**
   * The agent registration metadata URI (`agentURI`) — points to the JSON that
   * lists A2A/MCP/ENS endpoints + x402 support. Defaults to the agent endpoint
   * if not given, else an empty string (registry allows updating later via
   * setAgentURI).
   */
  agentURI?: string;
  /** Convenience: agent endpoint, used to default `agentURI` when absent. */
  endpoint?: string;
}

export interface RegisterErc8004Options {
  /** Explicit registry address override (else env, else known deployment). */
  registryAddress?: `0x${string}`;
  /** Explicit chain id override (else env ERC8004_CHAIN_ID, else default). */
  chainId?: number;
  /** Env accessor (testable). Defaults to process.env. */
  env?: NodeJS.ProcessEnv;
  /**
   * Env var to read the registry address from. Default ERC8004_IDENTITY_REGISTRY.
   */
  registryEnv?: string;
  /** Env var to read the chain id from. Default ERC8004_CHAIN_ID. */
  chainIdEnv?: string;
}

export interface RegisterErc8004Result {
  /** ERC-8004 agent id (tokenId) — present only after a real register tx. */
  erc8004Id?: string;
  /** The IdentityRegistry address used (undefined only in registry-less dry run). */
  registryAddress?: `0x${string}`;
  /** Chain id the registration targets. */
  chainId: number;
  /** The `agentURI` passed to register(). */
  agentURI: string;
  /** ABI-encoded `register(string)` calldata — usable to submit the tx yourself. */
  callData: `0x${string}`;
  /**
   * true → no tx was sent (walletClient null/unfunded OR no registry resolved).
   * The caller still gets registryAddress?/chainId/callData for later submission.
   */
  dryRun: boolean;
  /** Register tx hash, when a real tx ran. */
  txHash?: `0x${string}`;
}

/** Resolve the target chain id: option > env > default (Arc Testnet). */
function resolveChainId(options: RegisterErc8004Options): number {
  if (options.chainId !== undefined) return options.chainId;
  const env = options.env ?? process.env;
  const raw = env[options.chainIdEnv ?? "ERC8004_CHAIN_ID"]?.trim();
  if (raw) {
    const n = Number(raw);
    if (Number.isInteger(n) && n > 0) return n;
  }
  return DEFAULT_ERC8004_CHAIN_ID;
}

/**
 * Resolve the IdentityRegistry address: explicit option > env >
 * KNOWN_IDENTITY_REGISTRIES[chainId]. Returns undefined when none resolves —
 * which forces a DRY RUN rather than inventing an address. Always checksummed.
 */
function resolveRegistryAddress(
  chainId: number,
  options: RegisterErc8004Options,
): `0x${string}` | undefined {
  const env = options.env ?? process.env;
  const raw =
    options.registryAddress?.trim() ||
    env[options.registryEnv ?? "ERC8004_IDENTITY_REGISTRY"]?.trim() ||
    KNOWN_IDENTITY_REGISTRIES[chainId];
  if (!raw) return undefined;
  // Normalize/validate — getAddress throws on a malformed address, so a bad
  // override fails loudly instead of silently producing junk calldata.
  return getAddress(raw);
}

/** Default the agentURI from the endpoint, else empty (updatable later). */
function resolveAgentURI(input: RegisterErc8004Input): string {
  if (input.agentURI !== undefined) return input.agentURI;
  if (input.endpoint) return input.endpoint;
  return "";
}

/**
 * Register (or dry-run) an agent in the ERC-8004 IdentityRegistry.
 *
 * @param input        agent registration payload.
 * @param walletClient funded viem WalletClient (owner = input.address), or null
 *                     to force a DRY RUN (no network, no funds).
 * @param options      registry/chain overrides (config-driven, no hard-coding).
 */
export async function registerErc8004(
  input: RegisterErc8004Input,
  walletClient: Erc8004WalletClientLike | null,
  options: RegisterErc8004Options = {},
): Promise<RegisterErc8004Result> {
  const chainId = resolveChainId(options);
  const registryAddress = resolveRegistryAddress(chainId, options);
  const agentURI = resolveAgentURI(input);

  // Calldata is assembled the SAME way in both paths, so a dry run returns
  // exactly what the real tx would submit.
  const callData = encodeFunctionData({
    abi: IDENTITY_REGISTRY_REGISTER_ABI,
    functionName: "register",
    args: [agentURI],
  });

  // DRY RUN: no funded wallet OR no resolved registry. Return the plan, no tx.
  if (!walletClient || !walletClient.account || !registryAddress) {
    return {
      registryAddress,
      chainId,
      agentURI,
      callData,
      dryRun: true,
    };
  }

  // LIVE: send register(agentURI). The wallet pays gas; the minted NFT is owned
  // by walletClient.account (which should equal input.address).
  const txHash = await walletClient.writeContract({
    address: registryAddress,
    abi: IDENTITY_REGISTRY_REGISTER_ABI,
    functionName: "register",
    args: [agentURI],
    account: walletClient.account,
  });

  // Best-effort: resolve the agentId from the Registered event if the client can
  // wait for the receipt. Otherwise return just the txHash (still not a dry run).
  let erc8004Id: string | undefined;
  if (walletClient.waitForTransactionReceipt) {
    const receipt = await walletClient.waitForTransactionReceipt({ hash: txHash });
    const reg = registryAddress.toLowerCase();
    for (const log of receipt.logs) {
      if (
        log.address.toLowerCase() !== reg ||
        log.topics[0]?.toLowerCase() !== ERC8004_REGISTERED_TOPIC0
      ) {
        continue;
      }
      try {
        const decoded = decodeEventLog({
          abi: IDENTITY_REGISTRY_REGISTER_ABI,
          eventName: "Registered",
          topics: log.topics as [`0x${string}`, ...`0x${string}`[]],
          data: log.data as `0x${string}`,
        });
        erc8004Id = (decoded.args as { agentId: bigint }).agentId.toString();
        break;
      } catch {
        // Not our event shape — keep scanning.
      }
    }
  }

  return {
    erc8004Id,
    registryAddress,
    chainId,
    agentURI,
    callData,
    dryRun: false,
    txHash,
  };
}
