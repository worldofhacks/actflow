# SALVAGE: actflow-contracts

Salvage audit for import into the monorepo as `packages/contracts` (`@act-1-the-prophecy/contract`).
Working-tree files only; config rebuilt from scratch; source git history not imported.

## Stack

- Solidity `^0.8.20`, OpenZeppelin upgradeable `^5.2` (proxy via `@openzeppelin/hardhat-upgrades`), solady, Hardhat `^2.22` + hardhat-toolbox (ethers v6)
- TypeScript SDK in `src/` (viem 1.x types, ABIs, event signatures), built with `tsc` (`build:types`), exported via `package.json` `exports`
- Tests: mocha/chai `test/test.js` (983 lines, 21 `it()` blocks) + 14 E2E workflow scripts under `scripts/workflow-test/` run against local Hardhat nodes (`scripts/nodes/`)

## What works

- **`contracts/ActMarketplaceEVM.sol`** (`ACTMarketplaceEVM`, 1203 lines) — the keeper. Client/agent/validator task marketplace with escrow balances + time locks, validator staking, disputes, and native-payment overpay refunds. Known pre-port fixes: remove `hardhat/console.sol` import (L15), replace `__Ownable_init(tx.origin)` (L67), re-enable `ReentrancyGuardUpgradeable` (L8/L69) and put `nonReentrant` on `stakeValidator` / `createTasks` / `validateTask` / `withdraw` (refund path makes it load-bearing).
- **`contracts/ACTLib.sol`** — shared structs/enums; clean.
- **`contracts/mocks/`** (5 files) — `AgentNFT.sol` + `RevenueToken.sol` are compile-time imports of the EVM contract, not just fixtures.
- **`src/` TS SDK** — `marketplaceAbi` matches the EVM contract (has `stakeValidator`/`validateTask`/`disputeTask`); `EVENT_SIGNATURES`, `market.types.ts`, `IACTMarketRPC` are what web/agent-api will consume.
- **`test/test.js`** — good coverage, but its fixture deploys the dropped `ACTMarketplace` + `ACTStory`; must be retargeted (see initializer below).
- **`scripts/deploy_bsc.js` / `verify_bsc.js`** — deploy `ACTMarketplaceEVM`; parameterize the hard-coded WBNB RevenueToken at `deploy_bsc.js:36`.
- **`bcConfig.example.json`** — per-chain `{rpcUrl, rvToken, marketplace}` config shape (addresses + ABIs only).

### Retargeting tests: ACTMarketplaceEVM initializer (upgradeable proxy, no constructor)

```solidity
function initialize(
    address payable _revenueToken,
    uint8 _serviceFee,
    uint32 _serviceDelay,
    uint32 _validationDelay,
    uint32 _validatorStakeDuration,
    uint128 _validatorStakeAmount
) public initializer
```

`test/test.js:108-123` currently passes 7 args to `ACTMarketplace` (`actStory` address first) and transfers
ActStory ownership — drop the `_actStory` arg and the ownership transfer, switch the factory to
`"ACTMarketplaceEVM"`. Remove the leftover `debugger;` (L727) and stray `console.log`s.

## Dead or coupled to dead infra

- `contracts/ActStory.sol`, `contracts/ActMarketplace.sol` — Story Protocol-era contracts, superseded by the EVM contract. (Optional manual port: `ActMarketplace.sol`'s cross-role duplicate-registration guards never reached the EVM contract.)
- `@story-protocol/protocol-core` / `protocol-periphery` (unpinned github deps) — only the dropped contracts import them.
- `scripts/deploy_story.js`, `scripts/verify_story.js`, `.openzeppelin/unknown-1315.json` — Story-1315 deployment; keep the proxy manifest as a private ops reference only if that proxy will ever be upgraded.
- `scripts/workflow-test/base.js` / `base2.js` deploy the dropped contracts and every other workflow script imports them — salvage only after rewiring the base fixtures to `ACTMarketplaceEVM`.
- `src/constants.ts` Story module addresses (re-exported by `src/index.ts`) — trim with the Story drop.
- `hardhat.config.js` — not carried over; config rebuilt from scratch (env-based keys via `.env`, see `.env.example`).
- `weekly-summary.sh` — repo reporting one-off.
- `package.json` gap (affects port): `@openzeppelin/contracts-upgradeable` is used but undeclared (transitive only) — declare it explicitly.

## Verdicts

| Module | Verdict | Reason |
|---|---|---|
| `contracts/ActMarketplaceEVM.sol` | PORT | Core marketplace; apply the 4 known fixes + `nonReentrant` |
| `contracts/ACTLib.sol` | PORT | Clean shared library |
| `contracts/mocks/` (all 5) | PORT | Compile-time deps of the EVM contract |
| `test/test.js` | PORT | Keep all 21 tests; retarget fixture to `ACTMarketplaceEVM` (6-arg init) |
| `src/` TS SDK | PORT | ABI/types match the kept contract; trim Story constants |
| `scripts/deploy_bsc.js`, `verify_bsc.js` | PORT | Parameterize WBNB address (L36) |
| `scripts/nodes/` | PORT | Standalone local-node configs (public default mnemonic only) |
| `bcConfig.example.json` | PORT | Config shape consumed by SDK users; addresses/ABIs only |
| `package.json`/lockfile, `tsconfig.json`, `.nvmrc`, `.env.example`, `.gitignore` | PORT | Edit deps: add `@openzeppelin/contracts-upgradeable`, drop `@story-protocol/*` |
| `scripts/workflow-test/` | REWRITE | All flows depend on `base.js`/`base2.js`, which deploy dropped contracts |
| `hardhat.config.js` | REWRITE | Rebuilt from scratch, env-based; not copied |
| `contracts/ActStory.sol` | DROP | Story Protocol path abandoned |
| `contracts/ActMarketplace.sol` | DROP | Superseded; optionally hand-port its cross-role registration guards |
| `@story-protocol/*` deps | DROP | Only dropped contracts use them |
| `scripts/deploy_story.js`, `verify_story.js`, `.openzeppelin/` | DROP | Story-1315 ops; manifest kept privately for future proxy upgrades |
| `bcConfig.json`, `deployments.json` | DROP | Environment-specific ops data; keep privately, ship only the `.example` |
| `weekly-summary.sh` | DROP | One-off reporting script |
