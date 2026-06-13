/**
 * ESM/CJS interop loader for the @actflow/agents package (identity provisioning).
 *
 * NestJS compiles this API to CommonJS (apps/api/tsconfig.json: module=commonjs).
 * `@actflow/agents` is an ESM-only package ("type":"module", exports only the `import`
 * condition), so a normal `import`/`require` from CommonJS fails at runtime
 * ("require() of ES Module ..."). We therefore load it with a genuine dynamic `import()`.
 *
 * TypeScript with module=commonjs would normally DOWNLEVEL `import()` to `require()`, which
 * re-breaks ESM loading. To keep a real, un-transpiled dynamic import we wrap it in
 * `new Function(...)` — the same CJS->ESM interop trick used by ./payments x402.loader.ts.
 *
 * NO hard-coded secrets / addresses. provisionAgent reads its OWN env (ENS_PARENT_NAME,
 * ENS_CHAIN, ERC8004_IDENTITY_REGISTRY, ERC8004_CHAIN_ID, ...) and defaults the ERC-8004
 * IdentityRegistry from the CITED KNOWN_IDENTITY_REGISTRIES map in the package (sourced from
 * the erc8004-bigquery skill). With no env + a null wallet client it returns a labeled
 * dry-run preview — no funds/creds required.
 */

// Preserve a real dynamic import that survives commonjs downleveling.
const dynamicImport: (specifier: string) => Promise<any> = new Function(
  'specifier',
  'return import(specifier)',
) as any;

/** namehash(ensName) — bytes32 node; uint256 erc8004Id (decimal string); human ensName. */
export interface IdentityExtensionCall {
  ensNode: `0x${string}`;
  /** ERC-8004 id as a decimal string; "" when no real id exists yet (dry run). */
  erc8004Id: string;
  ensName: string;
}

/** Result of the ERC-8004 sub-step (registry/chain/calldata; txHash when live). */
export interface RegisterErc8004Result {
  erc8004Id?: string;
  registryAddress?: `0x${string}`;
  chainId: number;
  agentURI: string;
  callData: `0x${string}`;
  dryRun: boolean;
  txHash?: `0x${string}`;
}

/** Result of the ENS sub-step (name/node/records; tx hashes when live). */
export interface RegisterEnsIdentityResult {
  ensName: string;
  ensNode: `0x${string}`;
  erc8004Id?: string;
  records: Array<[string, string]>;
  dryRun: boolean;
  mintTxHash?: `0x${string}`;
  written?: Array<{ key: string; value: string; txHash: `0x${string}` }>;
}

/** Onboarding payload for provisionAgent (ENS input minus erc8004Id, plus agentURI?). */
export interface ProvisionAgentInput {
  slug: string;
  address: `0x${string}`;
  endpoint?: string;
  topics?: string[];
  pricing?: string;
  x402?: boolean;
  agentURI?: string;
  context?: string;
  endpointProtocol?: string;
}

export interface ProvisionAgentOptions {
  walletClient?: unknown | null;
  ensWalletClient?: unknown | null;
  erc8004WalletClient?: unknown | null;
  ens?: unknown;
  erc8004?: unknown;
  env?: NodeJS.ProcessEnv;
}

export interface ProvisionAgentResult {
  ensName: string;
  ensNode: `0x${string}`;
  erc8004Id?: string;
  records: Array<[string, string]>;
  identityExtensionCall: IdentityExtensionCall;
  /** true when EITHER sub-step was a dry run — the binding is NOT recorded on-chain. */
  dryRun: boolean;
  ens: RegisterEnsIdentityResult;
  erc8004: RegisterErc8004Result;
}

/** The subset of @actflow/agents the provisioning module consumes. */
export interface ActflowAgentsModule {
  provisionAgent(
    input: ProvisionAgentInput,
    options?: ProvisionAgentOptions,
  ): Promise<ProvisionAgentResult>;
  /** Default ERC-8004 chain id (Arc Testnet 5042002) — cited in the package. */
  DEFAULT_ERC8004_CHAIN_ID: number;
  /** chainId -> IdentityRegistry address (all cited from the erc8004-bigquery skill). */
  KNOWN_IDENTITY_REGISTRIES: Readonly<Record<number, `0x${string}`>>;
}

let agentsPromise: Promise<ActflowAgentsModule> | undefined;

/** Lazily import the ESM @actflow/agents package once (cached). */
export function loadAgents(): Promise<ActflowAgentsModule> {
  if (!agentsPromise) {
    agentsPromise = dynamicImport('@actflow/agents') as Promise<ActflowAgentsModule>;
  }
  return agentsPromise;
}
