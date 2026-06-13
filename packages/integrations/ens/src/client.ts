/**
 * On-chain ENS operations for ActFlow agents (viem).
 *
 * Reads use viem's ENS actions (getEnsAddress/getEnsName/getEnsResolver/
 * getEnsText) which look up each name's ACTUAL resolver via the registry /
 * Universal Resolver — honoring the SKILL gotcha "Don't hardcode the Public
 * Resolver for reads". Writes (mint / setText) use the configured Name Wrapper
 * + Public Resolver, which is fine for records we set ourselves.
 *
 * Wallet keys are NEVER read here — write functions accept a WalletClient param
 * (the caller supplies a funded account, e.g. the Privy server wallet).
 */
import {
  createPublicClient,
  http,
  type PublicClient,
  type WalletClient,
  type Hex,
  type Address,
} from "viem";
import { normalize } from "viem/ens";
import { loadEnsConfig, requireParentName, type EnsConfig } from "./config.js";
import { nameToNode, subnameNodeFromParentName, subnameString } from "./namehash.js";
import { nameWrapperAbi, resolverAbi } from "./abi.js";
import {
  encodeAgentRecords,
  decodeAgentRecords,
  type AgentProfile,
  type EncodeOptions,
} from "./records.js";

/** A public client bound to the configured chain + RPC. */
export function createEnsPublicClient(
  config: EnsConfig = loadEnsConfig(),
  opts: { requestTimeoutMs?: number } = {},
): PublicClient {
  return createPublicClient({
    chain: config.chain,
    transport: http(config.rpcUrl, {
      // Bound network time so reads fail fast / skip gracefully when an RPC is
      // slow or unreachable instead of hanging the caller (and CI).
      timeout: opts.requestTimeoutMs ?? 10_000,
      retryCount: 0,
    }),
  });
}

// ---------------------------------------------------------------------------
// Minting
// ---------------------------------------------------------------------------

export interface MintSubnameParams {
  /** Parent NAME (e.g. actflow.eth). Must already be WRAPPED + owned by wallet. */
  parentName: string;
  /** Label only (e.g. "agent1"); hashed internally by the wrapper. */
  label: string;
  /** Owner of the new subname (the agent's Privy wallet address). */
  ownerAddress: Address;
  /** Resolver to set on the subname; defaults to configured Public Resolver. */
  resolver?: Address;
  /** TTL (seconds). Default 0. */
  ttl?: bigint;
  /**
   * Expiry (uint64). SKILL: expiry=0 behavior on subnames is UNVERIFIED — test
   * on Sepolia; far-future expiry is reportedly capped to the parent's expiry.
   * Default 0 (TODO: confirm; pass a far-future value if resolution fails).
   */
  expiry?: bigint;
}

export interface MintSubnameResult {
  txHash: Hex;
  node: Hex;
  name: string;
}

/**
 * Mint `<label>.<parentName>` via NameWrapper.setSubnodeRecord.
 *
 * SKILL guidance: fuses = 0 for the hackathon (no trustless subnames needed);
 * setSubnodeRecord sets owner + resolver in one tx. The caller must own/operate
 * the WRAPPED parent. Waits for the receipt before returning.
 */
export async function mintSubname(
  wallet: WalletClient,
  params: MintSubnameParams,
  config: EnsConfig = loadEnsConfig(),
): Promise<MintSubnameResult> {
  const account = wallet.account;
  if (!account) {
    throw new Error("WalletClient has no account — pass a funded account.");
  }
  const parentName = normalize(params.parentName);
  const label = normalize(params.label);
  const parentNode = nameToNode(parentName);
  const node = subnameNodeFromParentName(parentName, label);
  const resolver = params.resolver ?? config.addresses.publicResolver;

  // fuses = 0 per SKILL ("mint with fuses = 0 unless you need trustless subnames").
  const FUSES = 0;

  const publicClient = createEnsPublicClient(config);
  const txHash = await wallet.writeContract({
    account,
    chain: config.chain,
    address: config.addresses.nameWrapper,
    abi: nameWrapperAbi,
    functionName: "setSubnodeRecord",
    args: [
      parentNode,
      label,
      params.ownerAddress,
      resolver,
      params.ttl ?? 0n,
      FUSES,
      params.expiry ?? 0n,
    ],
  });
  await publicClient.waitForTransactionReceipt({ hash: txHash });

  return { txHash, node, name: subnameString(parentName, label) };
}

// ---------------------------------------------------------------------------
// Writing agent records
// ---------------------------------------------------------------------------

export interface SetAgentRecordsParams {
  /** Full agent name (e.g. agent1.actflow.eth). */
  name: string;
  /** Records to write (encoded via encodeAgentRecords). */
  records: AgentProfile;
  /** Resolver to write to; defaults to configured Public Resolver. */
  resolver?: Address;
  /** Override UNVERIFIED custom keys. */
  encodeOptions?: EncodeOptions;
}

export interface SetAgentRecordsResult {
  node: Hex;
  name: string;
  written: Array<{ key: string; value: string; txHash: Hex }>;
}

/**
 * Write ENSIP-25/26 + common text records for an agent name. Only the name's
 * Manager can setText (SKILL) — for wrapped subnames that's the NameWrapper
 * owner, so `wallet`'s account must be that owner. Writes each record in its
 * own tx and waits for each receipt.
 */
export async function setAgentRecords(
  wallet: WalletClient,
  params: SetAgentRecordsParams,
  config: EnsConfig = loadEnsConfig(),
): Promise<SetAgentRecordsResult> {
  const account = wallet.account;
  if (!account) {
    throw new Error("WalletClient has no account — pass a funded account.");
  }
  const name = normalize(params.name);
  const node = nameToNode(name);
  const resolver = params.resolver ?? config.addresses.publicResolver;
  const pairs = encodeAgentRecords(params.records, params.encodeOptions);

  const publicClient = createEnsPublicClient(config);
  const written: SetAgentRecordsResult["written"] = [];
  for (const [key, value] of pairs) {
    const txHash = await wallet.writeContract({
      account,
      chain: config.chain,
      address: resolver,
      abi: resolverAbi,
      functionName: "setText",
      args: [node, key, value],
    });
    await publicClient.waitForTransactionReceipt({ hash: txHash });
    written.push({ key, value, txHash });
  }
  return { node, name, written };
}

// ---------------------------------------------------------------------------
// Resolution (reads)
// ---------------------------------------------------------------------------

/** A resolved agent identity. */
export interface ResolvedAgent {
  name: string;
  node: Hex;
  /** Forward-resolved address (addr record), if any. */
  address: Address | null;
  /** Decoded agent profile from text records. */
  profile: AgentProfile;
}

/** Which text keys resolveAgent reads (verified + UNVERIFIED custom keys). */
function keysToRead(options: EncodeOptions | undefined): string[] {
  // Enumerate the full set this library understands. ENS has no list-keys call,
  // so we probe a fixed set; unknown/empty come back as "".
  const probe: AgentProfile = {
    context: "",
    description: "",
    url: "",
    avatar: "",
    endpoints: { mcp: "", a2a: "", web: "" },
    capabilities: [],
    x402: false,
    pricing: "",
  };
  // encode gives the real key strings (incl. env-overridden custom keys);
  // registration keys are dynamic so they are handled separately by callers.
  return encodeAgentRecords(probe, options).map(([k]) => k);
}

export interface ResolveAgentOptions extends EncodeOptions {
  /** Extra text keys to read (e.g. a known ENSIP-25 registration key). */
  extraKeys?: string[];
}

/**
 * Forward-resolve an agent name: addr + all known agent text records.
 * Uses viem ENS actions, which find the name's actual resolver (not hard-coded).
 */
export async function resolveAgent(
  name: string,
  config: EnsConfig = loadEnsConfig(),
  options: ResolveAgentOptions = {},
): Promise<ResolvedAgent> {
  const normalized = normalize(name);
  const node = nameToNode(normalized);
  const publicClient = createEnsPublicClient(config);

  const address = await publicClient.getEnsAddress({ name: normalized }).catch(() => null);

  const keys = [...keysToRead(options), ...(options.extraKeys ?? [])];
  const pairs: Array<[string, string]> = [];
  for (const key of keys) {
    const value = await publicClient
      .getEnsText({ name: normalized, key })
      .catch(() => null);
    if (value) pairs.push([key, value]);
  }

  return {
    name: normalized,
    node,
    address: (address as Address) ?? null,
    profile: decodeAgentRecords(pairs, options),
  };
}

/** Read a single text record using the name's actual resolver. */
export async function readAgentText(
  name: string,
  key: string,
  config: EnsConfig = loadEnsConfig(),
): Promise<string | null> {
  const publicClient = createEnsPublicClient(config);
  const value = await publicClient
    .getEnsText({ name: normalize(name), key })
    .catch(() => null);
  return value ?? null;
}

export interface ReverseResolveResult {
  /** Primary name for the address, or null. */
  name: string | null;
  /**
   * Whether the primary name forward-resolves back to the address. SKILL:
   * "Reverse resolution must be verified" — never trust an unverified name.
   */
  verified: boolean;
}

/**
 * Reverse-resolve an address to its primary ENS name, then forward-verify it
 * resolves back to the same address (SKILL anti-spoofing requirement).
 */
export async function reverseResolve(
  address: Address,
  config: EnsConfig = loadEnsConfig(),
): Promise<ReverseResolveResult> {
  const publicClient = createEnsPublicClient(config);
  const name = await publicClient.getEnsName({ address }).catch(() => null);
  if (!name) return { name: null, verified: false };

  const forward = await publicClient
    .getEnsAddress({ name: normalize(name) })
    .catch(() => null);
  const verified =
    !!forward && forward.toLowerCase() === address.toLowerCase();
  return { name, verified };
}
