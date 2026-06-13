import { Agent } from "@mastra/core/agent";
import { resolveModel } from "../config/model.js";
import type { IMarketplaceClient } from "../interfaces/marketplace-client.js";
import type { IWalletProvider } from "../interfaces/wallet-provider.js";
import type { SupportedTopic } from "../marketplace/topics.js";
import { createMarketplaceTools } from "../tools/marketplace-actions.js";
import { createWalletTools } from "../tools/wallet-actions.js";

type AgentConstructorConfig = ConstructorParameters<typeof Agent>[0];
export type ActflowToolsMap = NonNullable<AgentConstructorConfig["tools"]>;

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

/**
 * Wallet configuration for an agent. References env var NAMES — never key
 * material. The Phase 4 wallet provider resolves these at runtime.
 */
export interface WalletConfig {
  /** EVM chain id the agent operates on. */
  chainId?: number;
  /** Public address (safe to store; never a private key). */
  address?: string;
  /** Name of the env var holding the signing key (e.g. "AGENT_PRIVATE_KEY"). */
  privateKeyEnv?: string;
  /** Name of the env var holding the RPC URL (e.g. "RPC_URL"). */
  rpcUrlEnv?: string;
}

export interface ActflowAgentConfig {
  /** Stable kebab-case identifier; doubles as the Mastra Agent id. */
  slug: string;
  /** Display name. */
  name: string;
  /** System instructions (persona + behavior). */
  instructions: string;
  /** Optional short description for registries/UIs. */
  description?: string;
  /** Model router string; defaults via resolveModel(). */
  model?: string;
  /** Agent-specific tools, merged over the standard toolset. */
  tools?: ActflowToolsMap;
  /** Marketplace topics this agent serves (on-chain registered strings). */
  topics?: SupportedTopic[];
  /** Wallet configuration (env var names only — no secrets). */
  walletConfig?: WalletConfig;
  /** Optional Mastra memory instance (host app provides storage). */
  memory?: AgentConstructorConfig["memory"];
  /** Override the marketplace client behind the standard tools. */
  marketplaceClient?: IMarketplaceClient;
  /** Override the wallet provider behind the standard tools. */
  walletProvider?: IWalletProvider;
  /** Set false to skip the standard marketplace/wallet toolset. */
  includeStandardTools?: boolean;
}

export interface ActflowAgent {
  slug: string;
  name: string;
  description?: string;
  /** Resolved model router string actually passed to the Agent. */
  model: string;
  /** The underlying Mastra Agent (id === slug). */
  agent: Agent;
  /** Resolved tool map (standard toolset + agent-specific tools). */
  tools: ActflowToolsMap;
  topics: SupportedTopic[];
  walletConfig?: WalletConfig;
}

/**
 * defineActflowAgent() — wraps a Mastra Agent with ActFlow metadata
 * ({slug, instructions, model, tools, walletConfig, topics}) and attaches
 * the standard toolset (marketplaceActions + walletActions) by default.
 *
 * MCP tools from @actflow/mcp are attached dynamically at call time:
 *   agent.generate(prompt, { toolsets: await getActflowMcpToolsets() })
 * so that defining agents never spawns/connects the MCP server.
 *
 * Construction never needs an API key — Mastra's model router reads the
 * provider key at call time. Guard live calls with hasModelProviderKey().
 */
export function defineActflowAgent(config: ActflowAgentConfig): ActflowAgent {
  if (!SLUG_PATTERN.test(config.slug)) {
    throw new Error(
      `Invalid agent slug "${config.slug}" — must be kebab-case ([a-z0-9-], starting alphanumeric).`,
    );
  }
  if (!config.instructions.trim()) {
    throw new Error(`Agent "${config.slug}" requires non-empty instructions.`);
  }

  const model = resolveModel(config.model);

  const standardTools: ActflowToolsMap =
    config.includeStandardTools === false
      ? {}
      : {
          ...createMarketplaceTools(config.marketplaceClient),
          ...createWalletTools(config.walletProvider),
        };

  const tools: ActflowToolsMap = {
    ...standardTools,
    ...(config.tools ?? {}),
  };

  const agent = new Agent({
    id: config.slug,
    name: config.name,
    instructions: config.instructions,
    model,
    tools,
    ...(config.memory ? { memory: config.memory } : {}),
  });

  return {
    slug: config.slug,
    name: config.name,
    description: config.description,
    model,
    agent,
    tools,
    topics: config.topics ?? [],
    walletConfig: config.walletConfig,
  };
}
