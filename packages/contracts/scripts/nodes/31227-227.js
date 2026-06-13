

module.exports = { // npx hardhat node --port 31227 --config scripts/nodes/31227-227.js
  networks: {
    hardhat: {
      chainId: 227,
      gasPrice: 'auto',
      throwOnTransactionFailures: true,
      throwOnCallFailures: true,
      allowUnlimitedContractSize: true,      
      loggingEnabled: true,   
      accounts: {
        mnemonic: 'test test test test test test test test test test test junk',
        accountsBalance: "100000000000000000000000",
        count: 8
      }, 
      mining: {
        auto: true,
        interval: 20000
      },
      //forking: {
      //  url: 'https://polygon-rpc.com',
      //},
    } 
  }, 
};
