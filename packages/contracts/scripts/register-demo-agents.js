// Registers a few demo agents ON-CHAIN against a deployed ACTMarketplaceEVM so
// the backend indexer ingests RegisterAgent events and aggregate() reads return
// real data. Local/demo only — uses the node's default funded signers.
//   ACT_MARKET_ADDRESS=0x... LOCALHOST_RPC_URL=http://127.0.0.1:8546 \
//     npx hardhat run --network localhost scripts/register-demo-agents.js
const { ethers } = require("hardhat");

const MARKET = process.env.ACT_MARKET_ADDRESS;

const DEMO_AGENTS = [
  { name: "Vector Swap Agent", topic: "swap", fee: "50000" },
  { name: "Helix Research Agent", topic: "research", fee: "20000" },
  { name: "Nova Translation Agent", topic: "translation", fee: "30000" },
];

async function main() {
  if (!MARKET) throw new Error("ACT_MARKET_ADDRESS env required");
  const signers = await ethers.getSigners();
  const market = await ethers.getContractAt("ACTMarketplaceEVM", MARKET);
  console.log(`Registering ${DEMO_AGENTS.length} demo agents on ${MARKET}`);

  // Whitelist the demo topics first (owner-only); registerAgent reverts on
  // "Invalid topic" otherwise.
  const owner = signers[0];
  const topicHashes = DEMO_AGENTS.map((a) => ethers.encodeBytes32String(a.topic));
  const toAdd = [];
  for (const h of topicHashes) {
    if (!(await market.validTopics(h))) toAdd.push(h);
  }
  if (toAdd.length) {
    const tx = await market.connect(owner).setValidTopics(toAdd, true);
    await tx.wait();
    console.log(`  whitelisted ${toAdd.length} topic(s)`);
  }

  for (let i = 0; i < DEMO_AGENTS.length; i++) {
    const a = DEMO_AGENTS[i];
    const signer = signers[i + 1]; // account[0] is the deployer/owner
    const topicHash = ethers.encodeBytes32String(a.topic); // bytes32 keccak(topic)
    const metadata = JSON.stringify({ name: a.name, demo: true });
    const topicConfig = {
      enabled: true,
      fee: a.fee,
      executionDuration: 3600,
      metadata: JSON.stringify({ price: a.fee }),
      autoAssign: true,
    };
    const existing = await market.agents(signer.address);
    if (existing.id !== ethers.ZeroAddress) {
      console.log(`  - ${a.name} (${signer.address}) already registered, skipping`);
      continue;
    }
    const tx = await market
      .connect(signer)
      .registerAgent(metadata, [topicHash], [topicConfig]);
    const rcpt = await tx.wait();
    console.log(`  + ${a.name} -> ${signer.address} (tx ${rcpt.hash})`);
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
