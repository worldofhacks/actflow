/**
 * Shared types for the agent identity provisioning flow.
 *
 * These mirror the apps/api `POST /agents/provision` controller contract EXACTLY
 * (ProvisionResultView in apps/api/src/agents/provisioning/provisioning.service.ts).
 * The wizard forwards the agent identifier and reads the returned identity
 * preview/result back unchanged, so the shapes must stay byte-compatible.
 *
 * DRY-RUN / MOCK SAFETY: every result carries `identityStatus` ('dry-run' |
 * 'bound') and `provisionDryRun`. The UI MUST NEVER present a dry-run / preview
 * as a real on-chain mint — no fake registry tx hash or explorer link unless the
 * API reports a real binding (identityStatus === 'bound' + bindingTxHash).
 *
 * RULES (ERC-8004 / ENS): the web app NEVER invents registry addresses or chain
 * ids. `registryAddress` + `chainId` come verbatim from the API response, which
 * resolves them from @actflow/agents' cited KNOWN_IDENTITY_REGISTRIES map
 * (erc8004-bigquery skill). We surface whatever the API returns.
 */

/** Request body for POST /agents/provision (ProvisionAgentRequestDto). */
export interface ProvisionAgentRequest {
  /** Existing agent identifier: wallet address (0x...) OR mongo id. Required. */
  agentId: string;
  /** Optional explicit ENS subname label (kebab); defaults from metadata name. */
  slug?: string;
  /** Optional agent endpoint URL (ENSIP-26 + ERC-8004 agentURI default). */
  endpoint?: string;
  /** Optional ERC-8004 registration metadata URI; defaults to endpoint. */
  agentURI?: string;
  /** Whether the agent accepts x402 USDC payments (written as an ENS record). */
  x402?: boolean;
}

/**
 * Identity binding status returned by the API:
 *  - 'dry-run' : preview only (no funds/creds) — NOT recorded on-chain.
 *  - 'bound'   : AgentIdentityExtension.setIdentity executed on-chain.
 */
export type IdentityStatus = 'dry-run' | 'bound';

/** The exact AgentIdentityExtension.setIdentity args echoed by the API. */
export interface IdentityExtensionCall {
  ensNode: string;
  erc8004Id: string;
  ensName: string;
}

/** ProvisionResultView — the full provisioning result returned by the API. */
export interface ProvisionResult {
  /** Mongo id of the agent record updated. */
  id: string;
  /** Agent wallet address (ERC-8004 NFT owner / identity subject). */
  agentAddress: string;
  /** Full ENS name `<slug>.<parent>` (or bare slug when ENS_PARENT_NAME unset). */
  ensName: string;
  /** namehash(ensName) — bytes32 node bound via AgentIdentityExtension. */
  ensNode: string;
  /** ERC-8004 IdentityRegistry agent id (decimal string) when known. */
  erc8004Id?: string;
  /**
   * ERC-8004 IdentityRegistry address used — cited from @actflow/agents'
   * KNOWN_IDENTITY_REGISTRIES (erc8004-bigquery skill), NEVER invented here.
   */
  registryAddress?: string;
  /** ERC-8004 chain id targeted (e.g. Arc Testnet 5042002). */
  chainId: number;
  /** The ENS text records written (or would-be written in dry run). */
  records: Array<[string, string]>;
  /** The exact AgentIdentityExtension.setIdentity args. */
  identityExtensionCall: IdentityExtensionCall;
  /** Identity binding status ('dry-run' preview vs on-chain 'bound'). */
  identityStatus: IdentityStatus;
  /** Binding tx hash, only when the on-chain binding executed. */
  bindingTxHash?: string;
  /** true when provisionAgent itself was a dry run (no ENS mint / register tx). */
  provisionDryRun: boolean;
  /** Human note about why a dry run / preview was returned (when applicable). */
  note?: string;
}
