// Internal port of the vendored `@act-1-the-prophecy/contract` prebuilt dist
// (types, event signatures and the ACT marketplace ABI). The vendored dist itself was
// deliberately NOT copied into the monorepo.
//
// TODO(contracts-parity): replace this directory with the monorepo `@actflow/contracts`
// (packages/contracts, ACTMarketplaceEVM) workspace package once it exports an ABI +
// event signatures, and diff EVENT_SIGNATURES/marketplaceAbi first — a mismatched
// signature makes the indexer silently drop events.
export * from './market.types';
export * from './events';
export * from './params';
export * from './IACTMarketRPC';
export { EVENT_SIGNATURES } from './EVENT_SIGNATURES';
export { marketplaceAbi } from './abi/marketplaceAbi';
