// ActFlow marketplace contracts — Hardhat config.
// Written from scratch for the actflow monorepo; all network settings are
// driven by environment variables (see .env.example). Never commit secrets.
require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");

const accounts = process.env.DEPLOYER_PRIVATE_KEY
  ? [process.env.DEPLOYER_PRIVATE_KEY]
  : [];

module.exports = {
  defaultNetwork: "hardhat",
  solidity: {
    // Single compiler satisfies every pragma in contracts/ (^0.8.20, ^0.8.23, 0.8.26).
    version: "0.8.26",
    settings: {
      optimizer: { enabled: true, runs: 5 },
      evmVersion: "cancun",
      viaIR: true,
    },
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      throwOnTransactionFailures: true,
      throwOnCallFailures: true,
    },
    localhost: {
      url: process.env.LOCALHOST_RPC_URL || "http://127.0.0.1:8545",
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      chainId: 11155111,
      accounts,
    },
    arcTestnet: {
      url: process.env.ARC_TESTNET_RPC_URL || "",
      accounts,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },
};
