module.exports = {
  // npx hardhat node --port 31226 --config scripts/nodes/31226-226.js
  networks: {
    hardhat: {
      chainId: 226,
      gasPrice: "auto",
      throwOnTransactionFailures: true,
      throwOnCallFailures: true,
      allowUnlimitedContractSize: true,
      loggingEnabled: false,
      hardfork: "cancun",
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        accountsBalance: "100000000000000000000000",
        count: 8,
      },
      mining: {
        auto: true,
        interval: 20000,
      },
      //forking: {
      //  url: 'https://ethereum-sepolia-rpc.publicnode.com',
      //},
    },
  },
};
