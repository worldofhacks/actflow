/**
 * register-ens-identity — give an ActFlow agent an ENS subname identity.
 *
 * Wires @actflow/integrations-ens into agent creation:
 *   1. mint `<slug>.<parentName>` via the Name Wrapper (mintSubname)
 *   2. write ENSIP-25/26 + common text records (setAgentRecords)
 *   3. return { ensName, ensNode } so the caller can record the binding
 *      on-chain via AgentIdentityExtension.setIdentity(ensNode, erc8004Id, ensName)
 *
 * NO hard-coded ENS names / addresses / chain IDs — everything comes from
 * @actflow/integrations-ens config (ENS_PARENT_NAME, ENS_CHAIN, RPC env vars)
 * via loadEnsConfig(). The agent's wallet/RPC is INJECTED by the caller: this
 * module never reads key material.
 *
 * DRY RUN: when `walletClient` is null OR no parent name is configured, we
 * assemble and return the name / node / records WITHOUT any network call. This
 * keeps the function unit-testable and safe to run with no funds — the on-chain
 * mint + setText only happen when a funded wallet AND a parent name are present.
 */
import {
  loadEnsConfig,
  mintSubname,
  setAgentRecords,
  subnameNodeFromParentName,
  subnameString,
  encodeAgentRecords,
  type AgentProfile,
  type AgentRegistration,
  type EnsConfig,
} from "@actflow/integrations-ens";

// Structural WalletClient type — we only need the viem-shaped account/write
// surface, so we avoid a hard type import (keeps the agents package decoupled
// from a specific viem version and lets callers inject any compatible client).
export interface EnsWalletClientLike {
  account?: { address: `0x${string}` } | null;
  // viem WalletClient.writeContract — kept loose on purpose.
  writeContract: (args: any) => Promise<`0x${string}`>;
}

/**
 * What agent creation knows about a new agent. Mirrors the onboarding payload:
 * {slug, address, endpoint, topics, pricing, x402, erc8004Id?}.
 */
export interface RegisterEnsIdentityInput {
  /** kebab-case agent slug → becomes the subname label. */
  slug: string;
  /** Agent's wallet address — becomes the subname owner + addr record target. */
  address: `0x${string}`;
  /**
   * Primary agent endpoint URL. Published as the ENSIP-26 agent-endpoint for
   * the configured protocol (default "a2a"; override via `endpointProtocol`).
   */
  endpoint?: string;
  /** Capabilities / topics the agent serves (UNVERIFIED custom key). */
  topics?: string[];
  /** Free-form pricing descriptor (UNVERIFIED custom key). */
  pricing?: string;
  /** Whether the agent accepts x402 USDC payments (UNVERIFIED custom key). */
  x402?: boolean;
  /**
   * ERC-8004 registry agent id. When present (and an ERC-7930 registry address
   * is configured), an ENSIP-25 agent-registration[...] attestation is written.
   * Also returned to the caller for AgentIdentityExtension.setIdentity.
   */
  erc8004Id?: string | number;
  /** Free-form agent-context (ENSIP-26). Defaults from slug + endpoint. */
  context?: string;
  /** ENSIP-26 endpoint protocol for `endpoint` (mcp|a2a|web). Default "a2a". */
  endpointProtocol?: string;
}

export interface RegisterEnsIdentityResult {
  /** Full ENS name `<slug>.<parentName>` (normalized). */
  ensName: string;
  /** namehash(ensName) — the bytes32 node for AgentIdentityExtension.setIdentity. */
  ensNode: `0x${string}`;
  /** ERC-8004 id echoed back (string) for the on-chain setIdentity call. */
  erc8004Id?: string;
  /** The assembled profile that was (or would be) written as text records. */
  profile: AgentProfile;
  /** The exact [key, value] text-record pairs (post-encode). */
  records: Array<[string, string]>;
  /**
   * true → no network call was made (walletClient null OR no parent name). The
   * caller still gets a usable ensName/ensNode for off-chain display/testing.
   */
  dryRun: boolean;
  /** Mint tx hash, when an on-chain mint ran. */
  mintTxHash?: `0x${string}`;
  /** Per-record setText results, when records were written on-chain. */
  written?: Array<{ key: string; value: string; txHash: `0x${string}` }>;
}

export interface RegisterEnsIdentityOptions {
  /** Override the ENS config (else loaded from env via loadEnsConfig). */
  config?: EnsConfig;
  /**
   * ERC-7930 interoperable address of the ERC-8004 registry, for the ENSIP-25
   * agent-registration key. NEVER hard-coded — supplied by the caller or read
   * from env (see `registryEnv`). When absent, no registration record is
   * written even if erc8004Id is given.
   */
  registry?: string;
  /** Env var to read the ERC-7930 registry address from. Default ENS_AGENT_REGISTRY. */
  registryEnv?: string;
  /** Env accessor (testable). Defaults to process.env. */
  env?: NodeJS.ProcessEnv;
}

/** Build the AgentProfile (text records) from the onboarding input. No I/O. */
function buildProfile(
  input: RegisterEnsIdentityInput,
  registry: string | undefined,
): AgentProfile {
  const protocol = input.endpointProtocol?.trim() || "a2a";

  const profile: AgentProfile = {
    context:
      input.context?.trim() ||
      `ActFlow agent "${input.slug}".` +
        (input.endpoint ? ` Endpoint (${protocol}): ${input.endpoint}.` : ""),
  };

  if (input.endpoint) {
    profile.endpoints = { [protocol]: input.endpoint };
  }
  if (input.topics && input.topics.length > 0) {
    profile.capabilities = input.topics;
  }
  if (input.x402 !== undefined) {
    profile.x402 = input.x402;
  }
  if (input.pricing !== undefined && input.pricing !== "") {
    profile.pricing = input.pricing;
  }

  // ENSIP-25 attestation only when BOTH an erc8004 id and a registry (ERC-7930
  // interoperable address) are available — never invent the registry address.
  if (input.erc8004Id !== undefined && registry) {
    const registration: AgentRegistration = {
      registry,
      agentId: String(input.erc8004Id),
      value: "1", // ENSIP-25: any non-empty string; "1" is the recommended value.
    };
    profile.registration = registration;
  }

  return profile;
}

/**
 * Register (or dry-run) an agent's ENS identity.
 *
 * @param input        onboarding payload for the new agent.
 * @param walletClient funded viem WalletClient that owns the WRAPPED parent
 *                     name, or null to force a DRY RUN (no network, no funds).
 * @param options      config / registry overrides (no hard-coded values).
 */
export async function registerEnsIdentity(
  input: RegisterEnsIdentityInput,
  walletClient: EnsWalletClientLike | null,
  options: RegisterEnsIdentityOptions = {},
): Promise<RegisterEnsIdentityResult> {
  const env = options.env ?? process.env;
  const config = options.config ?? loadEnsConfig(env);

  // Registry for the ENSIP-25 key: explicit option > env (no hard-coded value).
  const registryEnvVar = options.registryEnv ?? "ENS_AGENT_REGISTRY";
  const registry =
    options.registry?.trim() || env[registryEnvVar]?.trim() || undefined;

  const profile = buildProfile(input, registry);
  // encodeAgentRecords applies the (env-overridable) custom-key config, so the
  // returned `records` are EXACTLY what would be written on-chain.
  const records = encodeAgentRecords(profile);

  const erc8004Id =
    input.erc8004Id !== undefined ? String(input.erc8004Id) : undefined;

  // DRY RUN: no funded wallet OR no parent name configured. Assemble + return
  // the identity WITHOUT touching the network.
  if (!walletClient || !walletClient.account || !config.parentName) {
    const ensName = config.parentName
      ? subnameString(config.parentName, input.slug)
      : input.slug; // no parent configured → label-only placeholder name.
    const ensNode = config.parentName
      ? subnameNodeFromParentName(config.parentName, input.slug)
      : ("0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`);

    return { ensName, ensNode, erc8004Id, profile, records, dryRun: true };
  }

  // LIVE: mint the subname, then write the records. The wallet must own the
  // wrapped parent. mintSubname/setAgentRecords expect a viem WalletClient; the
  // injected client is structurally compatible.
  const parentName = config.parentName;
  const mint = await mintSubname(
    walletClient as any,
    {
      parentName,
      label: input.slug,
      ownerAddress: input.address,
    },
    config,
  );

  const setResult = await setAgentRecords(
    walletClient as any,
    {
      name: mint.name,
      records: profile,
    },
    config,
  );

  return {
    ensName: mint.name,
    ensNode: mint.node,
    erc8004Id,
    profile,
    records,
    dryRun: false,
    mintTxHash: mint.txHash,
    written: setResult.written,
  };
}
