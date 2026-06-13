const { run, ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

// npx hardhat run --network sepolia scripts/verify.js

const filePath = path.join(__dirname, "../bcConfig.json");

async function main() {
  const bcConfig = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const chainId = Number(await network.provider.send("eth_chainId"));
  const config = bcConfig[chainId];

  console.log(chainId, config?.marketplace?.address);

  if (!config) {
    throw new Error(`No config found for chainId ${chainId}`);
  }

  console.log("Verifying ACTMarketplaceEVM (proxy implementation)...");
  const implAddress = await getImplementationAddress(
    config.marketplace.address
  );
  await run("verify:verify", {
    address: implAddress,
    constructorArguments: [],
    contract: "contracts/ActMarketplaceEVM.sol:ACTMarketplaceEVM",
  });

  console.log("ACTMarketplaceEVM verified");
}

// Get implementation address of upgradeable proxy
async function getImplementationAddress(proxyAddress) {
  const implStorageSlot =
    "0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBC"; // EIP-1967
  const implHex = await ethers.provider.getStorage(
    proxyAddress,
    implStorageSlot
  );
  return ethers.getAddress("0x" + implHex.slice(26));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
