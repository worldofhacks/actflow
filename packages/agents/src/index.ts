/**
 * @actflow/agents — ActFlow agent runtime on Mastra.
 *
 * - defineActflowAgent(): factory wrapping a Mastra Agent with
 *   {slug, instructions, model, tools, walletConfig, topics}
 * - First-party agents: swap-agent, research-agent, actle (ported from the
 *   original Eliza runtime)
 * - Standard toolset interfaces (marketplace/wallet) + lazy MCP client to
 *   @actflow/mcp
 * - Task-lifecycle workflow re-implementing the old marketplace task loop
 */

// Core factory
export {
  defineActflowAgent,
  type ActflowAgent,
  type ActflowAgentConfig,
  type ActflowToolsMap,
  type WalletConfig,
} from "./core/define-actflow-agent.js";

// Model config
export {
  DEFAULT_MODEL,
  MODEL_OVERRIDE_ENV,
  MODEL_PROVIDER_KEY_ENV,
  assertModelProviderKey,
  hasModelProviderKey,
  resolveModel,
} from "./config/model.js";

// Agents + registry
export { actle } from "./agents/actle.js";
export { researchAgent } from "./agents/research-agent.js";
export { swapAgent } from "./agents/swap-agent.js";
export {
  agents,
  getAgentBySlug,
  getAgentForTopic,
  getMastraAgents,
  listAgents,
} from "./agents/registry.js";

// Marketplace topics + state machines
export {
  ACTION_TO_TOPICS,
  MARKETPLACE_ACTIONS,
  SUPPORTED_TOPICS,
  TOPIC_TO_ACTION,
  isSupportedTopic,
  type MarketplaceAction,
  type SupportedTopic,
} from "./marketplace/topics.js";
export {
  TaskProcessingStatus,
  TaskState,
} from "./marketplace/task-state.js";

// Task-lifecycle workflow
export {
  createTaskLifecycleWorkflow,
  mockProcessTask,
  taskLifecycleWorkflow,
  type ProcessTaskFn,
  type ProcessTaskInput,
  type ProcessTaskResult,
  type TaskLifecycleDeps,
} from "./marketplace/task-lifecycle.workflow.js";

// Interfaces + mocks
export {
  MockMarketplaceClient,
  type IMarketplaceClient,
  type MarketplaceTask,
  type MarketplaceTxResult,
} from "./interfaces/marketplace-client.js";
export {
  MockWalletProvider,
  type IWalletProvider,
  type PaymentRequest,
  type PaymentResult,
  type WalletBalance,
} from "./interfaces/wallet-provider.js";
export {
  InMemoryCheckpointStore,
  type ICheckpointStore,
} from "./interfaces/checkpoint-store.js";

// Tools
export { createMarketplaceTools } from "./tools/marketplace-actions.js";
export { createWalletTools } from "./tools/wallet-actions.js";
export { createSwapTools, swapExecute, swapQuote } from "./tools/swap-tools.js";
export { createResearchTools, webResearch } from "./tools/research-tools.js";
export {
  IMAGE_STYLES,
  MIX_URL_SEPARATOR,
  createImageTools,
  generateImage,
  resolveImageStyleFromTopic,
  type ImageStyle,
} from "./tools/image-tools.js";

// MCP client (lazy)
export {
  disconnectActflowMcp,
  getActflowMcpClient,
  getActflowMcpTools,
  getActflowMcpToolsets,
} from "./mcp/client.js";

// Private payouts — route agent earnings (marketplace withdraw() proceeds)
// through @actflow/integrations-unlink (deposit -> private transfer -> optional
// withdraw). OPTIONAL + mock-safe (labeled mock receipts when no Unlink creds).
export {
  withdrawEarningsPrivately,
  type WithdrawEarningsPrivatelyInput,
  type WithdrawEarningsPrivatelyResult,
  type WithdrawEarningsPrivatelyOptions,
} from "./payouts/withdraw-earnings-privately.js";

// ENS identity for agent creation (mint subname + write records + ensNode for
// AgentIdentityExtension.setIdentity). DRY-RUN safe with no wallet/parent name.
export {
  registerEnsIdentity,
  type EnsWalletClientLike,
  type RegisterEnsIdentityInput,
  type RegisterEnsIdentityOptions,
  type RegisterEnsIdentityResult,
} from "./identity/register-ens-identity.js";

// ERC-8004 IdentityRegistry registration (mint agent identity NFT). Config-driven
// registry/chain (env ERC8004_IDENTITY_REGISTRY + ERC8004_CHAIN_ID, default Arc
// Testnet 5042002). DRY-RUN safe: returns calldata WITHOUT a tx when no wallet/
// registry. Addresses cited from the erc8004-bigquery skill — never invented.
export {
  registerErc8004,
  DEFAULT_ERC8004_CHAIN_ID,
  KNOWN_IDENTITY_REGISTRIES,
  IDENTITY_REGISTRY_REGISTER_ABI,
  ERC8004_REGISTERED_TOPIC0,
  type Erc8004WalletClientLike,
  type RegisterErc8004Input,
  type RegisterErc8004Options,
  type RegisterErc8004Result,
} from "./identity/register-erc8004.js";

// Full agent identity provisioning: registerErc8004 + registerEnsIdentity +
// the AgentIdentityExtension.setIdentity(ensNode, erc8004Id, ensName) args.
// Fully dry-run/mock-safe (no funds/creds required).
export {
  provisionAgent,
  type ProvisionAgentInput,
  type ProvisionAgentOptions,
  type ProvisionAgentResult,
  type IdentityExtensionCall,
} from "./identity/provision-agent.js";
