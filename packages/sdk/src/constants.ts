// Chain / deployment configuration helpers for the ActFlow marketplace.
//
// The SDK is config-driven: no production contract addresses are hardcoded
// here. Consumers supply per-chain deployments (e.g. loaded from the
// bcConfig.json written by @actflow/contracts scripts/deploy.js, or from
// their own environment) and the helpers below give them a typed shape.

export interface ActFlowContractRef {
  /** Deployed contract address (proxy address for the marketplace). */
  address: string;
  /** Block number the contract was deployed at (useful for log scans). */
  startBlock?: number;
}

export interface ActFlowChainConfig {
  chainId: number;
  rpcUrl: string;
  /** ACTMarketplaceEVM proxy. */
  marketplace: ActFlowContractRef;
  /** Wrapped-native revenue token (WIP/WETH9-style, `deposit()` payable). */
  revenueToken: ActFlowContractRef;
}

export type ActFlowChainConfigMap = Record<number, ActFlowChainConfig>;

/** Identity helper that gives object literals the right type. */
export function defineActFlowChainConfig(
  config: ActFlowChainConfig
): ActFlowChainConfig {
  return config;
}

export function getActFlowChainConfig(
  configs: ActFlowChainConfigMap,
  chainId: number
): ActFlowChainConfig {
  const config = configs[chainId];
  if (!config) {
    throw new Error(`No ActFlow chain config for chainId ${chainId}`);
  }
  return config;
}
