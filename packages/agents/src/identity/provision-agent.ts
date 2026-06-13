/**
 * provision-agent — full identity provisioning for a new ActFlow agent.
 *
 * Orchestrates the three identity steps a new agent needs:
 *   1. registerEnsIdentity  — mint `<slug>.<parent>` subname + write ENSIP-25/26
 *      text records, returning {ensName, ensNode} (the bytes32 node).
 *   2. registerErc8004      — register the agent in the ERC-8004 IdentityRegistry
 *      (mints the identity NFT), returning {erc8004Id?, registryAddress, ...}.
 *   3. identityExtensionCall — assemble the exact args the caller writes to
 *      AgentIdentityExtension.setIdentity(ensNode, erc8004Id, ensName) on-chain
 *      to bind the ENS node <-> ERC-8004 id <-> name.
 *
 * The ERC-8004 id feeds back into the ENS step: the ENSIP-25 agent-registration
 * attestation references the erc8004Id, so we register on ERC-8004 FIRST, then
 * pass the resulting id into the ENS registration (when available).
 *
 * FULLY DRY-RUN / MOCK-SAFE (no funds, no creds): both sub-steps degrade to dry
 * run when their wallet/registry/parent-name prerequisites are absent. The
 * overall result is `dryRun:true` if EITHER sub-step was a dry run, so the
 * returned identityExtensionCall is never presented as an executed binding.
 *
 * ARCHITECTURE: depends only on this package's two identity modules (which in
 * turn depend DOWN on @actflow/integrations-ens + viem). No agents<->integrations
 * cycle is introduced.
 */
import {
  registerEnsIdentity,
  type EnsWalletClientLike,
  type RegisterEnsIdentityInput,
  type RegisterEnsIdentityOptions,
  type RegisterEnsIdentityResult,
} from "./register-ens-identity.js";
import {
  registerErc8004,
  type Erc8004WalletClientLike,
  type RegisterErc8004Options,
  type RegisterErc8004Result,
} from "./register-erc8004.js";

/**
 * Onboarding payload for a new agent. Superset of the ENS input plus the bits
 * the ERC-8004 step needs. `erc8004Id` is intentionally omitted: provisionAgent
 * MINTS it (or dry-runs it), then feeds it back into the ENS attestation.
 */
export interface ProvisionAgentInput
  extends Omit<RegisterEnsIdentityInput, "erc8004Id"> {
  /**
   * The ERC-8004 `agentURI` (registration JSON URL). Defaults to `endpoint`.
   * Updatable on-chain later via setAgentURI.
   */
  agentURI?: string;
}

export interface ProvisionAgentOptions {
  /**
   * Wallet client used for BOTH steps. May be null to force a full dry run.
   * Structurally must satisfy both the ENS and ERC-8004 client surfaces; a real
   * viem WalletClient does. Split via `ensWalletClient` / `erc8004WalletClient`
   * if you need different signers per step.
   */
  walletClient?: (EnsWalletClientLike & Erc8004WalletClientLike) | null;
  /** Override the ENS-step wallet client (else `walletClient`). */
  ensWalletClient?: EnsWalletClientLike | null;
  /** Override the ERC-8004-step wallet client (else `walletClient`). */
  erc8004WalletClient?: Erc8004WalletClientLike | null;
  /** ENS-step options (config/registry/env). */
  ens?: RegisterEnsIdentityOptions;
  /** ERC-8004-step options (registryAddress/chainId/env). */
  erc8004?: RegisterErc8004Options;
  /** Env accessor passed to both steps when their own opts omit one. */
  env?: NodeJS.ProcessEnv;
}

/** The exact args for AgentIdentityExtension.setIdentity(ensNode, erc8004Id, ensName). */
export interface IdentityExtensionCall {
  /** namehash(ensName) — bytes32 node. */
  ensNode: `0x${string}`;
  /**
   * ERC-8004 agent id as a decimal string. "" when no id is known yet (dry run
   * with no on-chain mint) — the caller must NOT submit setIdentity until a real
   * id exists.
   */
  erc8004Id: string;
  /** Full ENS name `<slug>.<parent>`. */
  ensName: string;
}

export interface ProvisionAgentResult {
  /** Full ENS name `<slug>.<parent>`. */
  ensName: string;
  /** namehash(ensName) — bytes32 node for setIdentity. */
  ensNode: `0x${string}`;
  /** ERC-8004 id (decimal string) when known; undefined in registry-less/dry runs. */
  erc8004Id?: string;
  /** The [key,value] ENS text-record pairs (as written / would-be written). */
  records: Array<[string, string]>;
  /** Ready-to-submit args for AgentIdentityExtension.setIdentity. */
  identityExtensionCall: IdentityExtensionCall;
  /**
   * true when EITHER sub-step was a dry run (no real tx). The binding described
   * by identityExtensionCall has therefore NOT been recorded on-chain.
   */
  dryRun: boolean;
  /** Full ENS sub-step result (mint/setText hashes when live). */
  ens: RegisterEnsIdentityResult;
  /** Full ERC-8004 sub-step result (txHash/registry when live). */
  erc8004: RegisterErc8004Result;
}

/**
 * Provision a complete identity for a new agent: ERC-8004 registration + ENS
 * subname/records, returning everything needed to write the on-chain binding.
 * Dry-run/mock-safe end-to-end.
 */
export async function provisionAgent(
  input: ProvisionAgentInput,
  options: ProvisionAgentOptions = {},
): Promise<ProvisionAgentResult> {
  const env = options.env ?? process.env;

  const ensWallet =
    options.ensWalletClient !== undefined
      ? options.ensWalletClient
      : options.walletClient ?? null;
  const erc8004Wallet =
    options.erc8004WalletClient !== undefined
      ? options.erc8004WalletClient
      : options.walletClient ?? null;

  // 1) ERC-8004 first so its agentId can flow into the ENS attestation.
  const erc8004 = await registerErc8004(
    {
      slug: input.slug,
      address: input.address,
      agentURI: input.agentURI,
      endpoint: input.endpoint,
    },
    erc8004Wallet,
    { env, ...options.erc8004 },
  );

  // 2) ENS subname + records. Pass the (possibly dry-run) erc8004Id through so
  //    the ENSIP-25 registration record is written when an id + registry exist.
  const ens = await registerEnsIdentity(
    { ...input, erc8004Id: erc8004.erc8004Id },
    ensWallet,
    { env, ...options.ens },
  );

  // 3) Assemble the setIdentity args. erc8004Id "" when no real id exists yet.
  const erc8004Id = erc8004.erc8004Id ?? ens.erc8004Id;
  const identityExtensionCall: IdentityExtensionCall = {
    ensNode: ens.ensNode,
    erc8004Id: erc8004Id ?? "",
    ensName: ens.ensName,
  };

  // Overall dry run if EITHER step did not transact.
  const dryRun = ens.dryRun || erc8004.dryRun;

  return {
    ensName: ens.ensName,
    ensNode: ens.ensNode,
    erc8004Id,
    records: ens.records,
    identityExtensionCall,
    dryRun,
    ens,
    erc8004,
  };
}
