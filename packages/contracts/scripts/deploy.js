const { ethers, upgrades, network } = require("hardhat");
const {
  promises: { readFile, writeFile },
} = require("fs");
const path = require("path");

// npx hardhat run --network hardhat scripts/deploy.js
// npx hardhat run --network localhost scripts/deploy.js
// npx hardhat run --network sepolia scripts/deploy.js
// npx hardhat run --network arcTestnet scripts/deploy.js
//
// Per-chain settings (revenue/escrow token address, marketplace params) are read
// from bcConfig.json keyed by chainId — see bcConfig.example.json. Deployment
// results are written back to bcConfig.json.
//
// The marketplace's REVENUE/escrow token is fully config-driven (the WBNB
// hard-code that previously lived here is gone). Resolution order is:
//   1. REVENUE_TOKEN_ADDRESS env override (any chain)
//   2. bcConfig.json -> [chainId].rvToken.address
//   3. a per-chain well-known default (e.g. Arc testnet native USDC ERC-20)
//   4. fallback: deploy the bundled RevenueToken mock (local/test chains only)
//
// This module ALSO exports `resolveRevenueToken` + `deployMarketplace` so the
// exact deploy logic can be unit-tested against the local hardhat network with a
// mock USDC, without any funds, creds, or live RPC. See
// test/deploy-script.test.js.

const fileName = "bcConfig.json";
const filePath = path.join(__dirname, "../", fileName);

const DEFAULT_PARAMS = {
  serviceFee: 100, // 10% (feeBasis = 1000)
  serviceDelay: 100, // seconds
  validationDelay: 50, // seconds
  validatorStakeDuration: 10000, // seconds
  validatorStakeAmount: "10000", // wei of revenue token
};

// Per-chain well-known revenue/escrow token defaults (cited public constants,
// NOT secrets). For Arc testnet (chainId 5042002) the marketplace settles in
// the native USDC ERC-20 interface at 0x3600...0000 (6 decimals).
// Source: https://docs.arc.io/arc/references/contract-addresses
const ARC_TESTNET_CHAIN_ID = 5042002;
const ARC_TESTNET_USDC_ADDRESS =
  "0x3600000000000000000000000000000000000000";

const CHAIN_REVENUE_TOKEN_DEFAULTS = {
  [ARC_TESTNET_CHAIN_ID]: ARC_TESTNET_USDC_ADDRESS,
};

/**
 * Resolve the revenue/escrow token address for a deployment, config-driven.
 *
 * @param {object} args
 * @param {number} args.chainId            target chain id
 * @param {object} [args.chainConfig]      bcConfig entry for the chain
 * @param {string} [args.envOverride]      REVENUE_TOKEN_ADDRESS env value
 * @param {object} [args.deployMockToken]  async () => contract — deploys the
 *                                         bundled mock; only invoked when no
 *                                         address is resolvable.
 * @returns {Promise<{address: string, source: string, deployed: boolean}>}
 */
async function resolveRevenueToken({
  chainId,
  chainConfig = {},
  envOverride,
  deployMockToken,
}) {
  if (envOverride && envOverride.length > 0) {
    return { address: envOverride, source: "env", deployed: false };
  }
  if (chainConfig.rvToken && chainConfig.rvToken.address) {
    return {
      address: chainConfig.rvToken.address,
      source: "bcConfig",
      deployed: false,
    };
  }
  const chainDefault = CHAIN_REVENUE_TOKEN_DEFAULTS[chainId];
  if (chainDefault) {
    return { address: chainDefault, source: "chainDefault", deployed: false };
  }
  if (typeof deployMockToken === "function") {
    const token = await deployMockToken();
    return { address: token.target, source: "mock", deployed: true };
  }
  throw new Error(
    `No revenue token resolvable for chainId ${chainId} and no mock deployer provided`
  );
}

/**
 * Deploy the ACTMarketplaceEVM upgradeable proxy with the given revenue token
 * and params. Returns the marketplace contract instance. Pure deploy logic,
 * usable from both the CLI script and tests.
 *
 * @param {object} args
 * @param {string} args.revenueToken  revenue/escrow token address (initialize arg #1)
 * @param {object} args.params        merged marketplace params
 * @returns {Promise<object>} deployed marketplace contract
 */
async function deployMarketplace({ revenueToken, params }) {
  const ACTMarketplace = await ethers.getContractFactory("ACTMarketplaceEVM");
  const marketplace = await upgrades.deployProxy(ACTMarketplace, [
    revenueToken,
    params.serviceFee,
    params.serviceDelay,
    params.validationDelay,
    params.validatorStakeDuration,
    params.validatorStakeAmount,
  ]);
  await marketplace.waitForDeployment();
  return marketplace;
}

/** Deploy the bundled RevenueToken mock (local/test chains only). */
async function deployMockRevenueToken() {
  const RevenueToken = await ethers.getContractFactory("RevenueToken");
  const rvToken = await RevenueToken.deploy();
  await rvToken.waitForDeployment();
  return rvToken;
}

async function main() {
  const [deployer] = await ethers.getSigners();

  let bcConfig = {};
  try {
    bcConfig = JSON.parse(await readFile(filePath, "utf-8"));
  } catch (error) {
    console.log(`No ${fileName} found, starting from an empty config`);
  }

  const chainId = Number(await network.provider.send("eth_chainId"));
  const startBlock = await ethers.provider.getBlockNumber();

  if (!bcConfig[chainId]) bcConfig[chainId] = {};
  const chainConfig = bcConfig[chainId];

  console.log("Deploying to chainId", chainId, "as", deployer.address);

  chainConfig.chain = {
    rpcUrl: network.config.url || network.config.forking?.url,
  };

  const resolved = await resolveRevenueToken({
    chainId,
    chainConfig,
    envOverride: process.env.REVENUE_TOKEN_ADDRESS,
    deployMockToken: deployMockRevenueToken,
  });

  if (resolved.deployed) {
    console.log("RevenueToken (mock) deployed:", resolved.address);
  } else {
    console.log(
      `Using revenue token from ${resolved.source}:`,
      resolved.address
    );
  }

  // Record the resolved revenue token. Attach ABI only when we control the
  // instance (mock); for external tokens we just store the address + source.
  if (resolved.deployed) {
    const rvToken = await ethers.getContractAt(
      "RevenueToken",
      resolved.address
    );
    chainConfig.rvToken = {
      address: rvToken.target,
      abi: rvToken.interface.format(),
      abijson: rvToken.interface.formatJson(),
      startBlock,
    };
  } else {
    chainConfig.rvToken = {
      address: resolved.address,
      source: resolved.source,
      startBlock,
    };
  }

  const params = { ...DEFAULT_PARAMS, ...(chainConfig.params || {}) };

  const marketplace = await deployMarketplace({
    revenueToken: resolved.address,
    params,
  });

  chainConfig.params = params;
  chainConfig.marketplace = {
    address: marketplace.target,
    abi: marketplace.interface.format(),
    abijson: marketplace.interface.formatJson(),
    startBlock,
  };
  console.log("ACTMarketplaceEVM deployed:", marketplace.target);

  await writeFile(filePath, JSON.stringify(bcConfig, null, 4));
  console.log(`Wrote ${fileName}`);
}

module.exports = {
  main,
  resolveRevenueToken,
  deployMarketplace,
  deployMockRevenueToken,
  DEFAULT_PARAMS,
  CHAIN_REVENUE_TOKEN_DEFAULTS,
  ARC_TESTNET_CHAIN_ID,
  ARC_TESTNET_USDC_ADDRESS,
};

// Only run as a CLI when invoked directly (not when require()'d by a test).
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
