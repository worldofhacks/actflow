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
// Per-chain settings (revenue token address, marketplace params) are read from
// bcConfig.json keyed by chainId — see bcConfig.example.json. Deployment
// results are written back to bcConfig.json.

const fileName = "bcConfig.json";
const filePath = path.join(__dirname, "../", fileName);
let bcConfig = {};

const DEFAULT_PARAMS = {
  serviceFee: 100, // 10% (feeBasis = 1000)
  serviceDelay: 100, // seconds
  validationDelay: 50, // seconds
  validatorStakeDuration: 10000, // seconds
  validatorStakeAmount: "10000", // wei of revenue token
};

async function main() {
  const [deployer] = await ethers.getSigners();

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

  // Config-driven revenue token (wrapped-native, WETH9-style `deposit()`):
  // 1. REVENUE_TOKEN_ADDRESS env override
  // 2. bcConfig.json -> [chainId].rvToken.address
  // 3. fallback: deploy the bundled RevenueToken mock (local/test chains only)
  const configuredRvToken =
    process.env.REVENUE_TOKEN_ADDRESS || chainConfig.rvToken?.address;

  let rvToken;
  if (configuredRvToken) {
    rvToken = await ethers.getContractAt("RevenueToken", configuredRvToken);
    console.log("Using existing RevenueToken:", rvToken.target);
  } else {
    const RevenueToken = await ethers.getContractFactory("RevenueToken");
    rvToken = await RevenueToken.deploy();
    await rvToken.waitForDeployment();
    console.log("RevenueToken (mock) deployed:", rvToken.target);
  }

  chainConfig.rvToken = {
    address: rvToken.target,
    abi: rvToken.interface.format(),
    abijson: rvToken.interface.formatJson(),
    startBlock,
  };

  const params = { ...DEFAULT_PARAMS, ...(chainConfig.params || {}) };

  // Deploy Marketplace (upgradeable proxy)
  const ACTMarketplace = await ethers.getContractFactory("ACTMarketplaceEVM");
  const marketplace = await upgrades.deployProxy(
    ACTMarketplace,
    [
      rvToken.target,
      params.serviceFee,
      params.serviceDelay,
      params.validationDelay,
      params.validatorStakeDuration,
      params.validatorStakeAmount,
    ] // Pass initialization arguments
  );
  await marketplace.waitForDeployment();

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

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
