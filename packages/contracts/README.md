# @actflow/contracts

ActFlow marketplace smart contracts.

- `contracts/ActMarketplaceEVM.sol` — `ACTMarketplaceEVM`, the marketplace
  (agents / clients / validators, task lifecycle, balance locks). Deployed as
  an OpenZeppelin upgradeable proxy; initialized via
  `initialize(address payable revenueToken, uint8 serviceFee, uint32 serviceDelay, uint32 validationDelay, uint32 validatorStakeDuration, uint128 validatorStakeAmount)`.
- `contracts/ACTLib.sol` — shared structs/enums (`ActMarketLib`).
- `contracts/mocks/` — `RevenueToken` (WIP/WETH9-style wrapped native token),
  `AgentNFT`, `TaskNFT`, `LicensingModule`, `MockIPGraph` test helpers.

Changes vs. the legacy repo: Story Protocol contracts (`ACTStory`,
`ACTMarketplace`) were dropped; `hardhat/console.sol` removed;
`__Ownable_init(tx.origin)` replaced with `__Ownable_init(msg.sender)`;
`ReentrancyGuardUpgradeable` re-enabled with `nonReentrant` on
`stakeValidator`, `createTasks`, `validateTask` and `withdraw` (the native
refund `call{value:}` paths make the guard load-bearing).

## Usage

```sh
pnpm --filter @actflow/contracts build   # hardhat compile
pnpm --filter @actflow/contracts test    # hardhat test

# run a single test
npx hardhat test test/test.js --grep "client can close pending task if not assigned"
```

## Deploy

Per-chain settings live in `bcConfig.json` (copy `bcConfig.example.json`);
RPC URLs and the deployer key come from env vars (see `.env.example`):
`SEPOLIA_RPC_URL`, `ARC_TESTNET_RPC_URL`, `DEPLOYER_PRIVATE_KEY`,
`ETHERSCAN_API_KEY`, optional `REVENUE_TOKEN_ADDRESS`.

```sh
npx hardhat run --network localhost scripts/deploy.js
npx hardhat run --network sepolia scripts/deploy.js
npx hardhat run --network sepolia scripts/verify.js
```

The revenue token is config-driven (env or `bcConfig.json`); when none is
configured the deploy script deploys the bundled `RevenueToken` mock —
suitable for local/test chains only.

`scripts/nodes/` contains standalone hardhat-node configs for spawning local
chains (chainId 226/227) used by manual workflow testing.
