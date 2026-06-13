// Export event types
export * from "./types/events";
export * from "./types/params";

export { marketplaceAbi } from "./types/abi/marketplaceAbi";
export { wipAbi } from "./types/abi/wipAbi";

export type {
  Address,
  BlockNumber,
  MarketLibAgentInfo,
  MarketLibAgentStatistics,
  MarketLibAgentTotals,
  MarketLibMarketTotals,
  MarketLibTask,
  MarketLibTaskMetrics,
  MarketLibTaskResult,
  MarketLibAgentTopic,
  MarketLibFullAgent,
  Timestamp,
  TokenAmount,
  TokenId,
} from "./types/market.types";

// Export event signatures
export { EVENT_SIGNATURES } from "./types/EVENT_SIGNATURES";
export { TaskState } from "./types/market.types";
export * from "./types/interfaces/IACTMarketRPC";

// Export chain config helpers (config-driven: no hardcoded addresses)
export {
  defineActFlowChainConfig,
  getActFlowChainConfig,
} from "./constants";
export type {
  ActFlowChainConfig,
  ActFlowChainConfigMap,
  ActFlowContractRef,
} from "./constants";

// Export viem chain configs (Arc testnet etc.). Config-driven: only well-known
// public network constants + the cited Arc USDC address are inlined.
export * from "./chains";
