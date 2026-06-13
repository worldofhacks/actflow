const { expect } = require("chai");
const { ethers } = require("hardhat");
const { namehash } = require("ethers");

// npx hardhat test test/agent-identity-extension.test.js --grep ""
//
// AgentIdentityExtension is a STANDALONE registry (not the marketplace).
// These tests deliberately pass ENS names / nodes / ids as runtime values:
// the contract hard-codes no ENS name, address, or chain id (ENS judge check).
// ENS nodes are computed off-chain via namehash() exactly as the ens-agents
// skill prescribes (normalize-then-namehash; ethers' namehash normalizes).

describe("AgentIdentityExtension", function () {
  let owner, agentA, agentB, outsider;
  let identity;

  // Test-only fixtures. NOT hard-coded into the contract — supplied at call time.
  const nameA = "agenta.actflow.eth";
  const nameB = "agentb.actflow.eth";
  let nodeA, nodeB;
  const erc8004IdA = 167n; // matches the ENSIP-25 doc example agent id
  const erc8004IdB = 42n;

  beforeEach(async function () {
    [owner, agentA, agentB, outsider] = await ethers.getSigners();
    nodeA = namehash(nameA);
    nodeB = namehash(nameB);

    const Factory = await ethers.getContractFactory("AgentIdentityExtension");
    identity = await Factory.deploy(owner.address);
    await identity.waitForDeployment();
  });

  it("deploys with the provided initial owner", async function () {
    expect(await identity.owner()).to.equal(owner.address);
  });

  describe("set + get (self path)", function () {
    it("lets an agent self-link and reads the record back", async function () {
      await identity
        .connect(agentA)
        .setIdentity(nodeA, erc8004IdA, nameA);

      const rec = await identity.getIdentity(agentA.address);
      expect(rec.ensNode).to.equal(nodeA);
      expect(rec.erc8004Id).to.equal(erc8004IdA);
      expect(rec.ensName).to.equal(nameA);

      // reverse mapping
      expect(await identity.getAgentByNode(nodeA)).to.equal(agentA.address);
    });

    it("returns a zero-valued record for an unknown agent", async function () {
      const rec = await identity.getIdentity(outsider.address);
      expect(rec.ensNode).to.equal(ethers.ZeroHash);
      expect(rec.erc8004Id).to.equal(0n);
      expect(rec.ensName).to.equal("");
      expect(await identity.getAgentByNode(nodeA)).to.equal(ethers.ZeroAddress);
    });

    it("lets the same agent update its own record and frees the old node", async function () {
      await identity.connect(agentA).setIdentity(nodeA, erc8004IdA, nameA);
      // move agentA to a different node
      await identity.connect(agentA).setIdentity(nodeB, erc8004IdB, nameB);

      const rec = await identity.getIdentity(agentA.address);
      expect(rec.ensNode).to.equal(nodeB);
      expect(rec.erc8004Id).to.equal(erc8004IdB);
      expect(rec.ensName).to.equal(nameB);

      // old node is freed, new node points to agentA
      expect(await identity.getAgentByNode(nodeA)).to.equal(ethers.ZeroAddress);
      expect(await identity.getAgentByNode(nodeB)).to.equal(agentA.address);

      // ...so another agent can now claim the freed node
      await identity.connect(agentB).setIdentity(nodeA, erc8004IdA, nameA);
      expect(await identity.getAgentByNode(nodeA)).to.equal(agentB.address);
    });
  });

  describe("owner path (setIdentityFor)", function () {
    it("lets the owner wire an identity on behalf of an agent", async function () {
      await identity
        .connect(owner)
        .setIdentityFor(agentA.address, nodeA, erc8004IdA, nameA);

      const rec = await identity.getIdentity(agentA.address);
      expect(rec.ensNode).to.equal(nodeA);
      expect(rec.erc8004Id).to.equal(erc8004IdA);
      expect(rec.ensName).to.equal(nameA);
      expect(await identity.getAgentByNode(nodeA)).to.equal(agentA.address);
    });

    it("reverts setIdentityFor from a non-owner", async function () {
      await expect(
        identity
          .connect(outsider)
          .setIdentityFor(agentA.address, nodeA, erc8004IdA, nameA)
      ).to.be.revertedWithCustomError(identity, "OwnableUnauthorizedAccount");
    });

    it("reverts setIdentityFor for the zero agent", async function () {
      await expect(
        identity
          .connect(owner)
          .setIdentityFor(ethers.ZeroAddress, nodeA, erc8004IdA, nameA)
      ).to.be.revertedWith("AgentIdentity: zero agent");
    });
  });

  describe("duplicate-node rejection", function () {
    it("rejects a node already claimed by a different agent (self path)", async function () {
      await identity.connect(agentA).setIdentity(nodeA, erc8004IdA, nameA);
      await expect(
        identity.connect(agentB).setIdentity(nodeA, erc8004IdB, nameA)
      ).to.be.revertedWith("AgentIdentity: node already claimed");
    });

    it("rejects a node already claimed by a different agent (owner path)", async function () {
      await identity.connect(agentA).setIdentity(nodeA, erc8004IdA, nameA);
      await expect(
        identity
          .connect(owner)
          .setIdentityFor(agentB.address, nodeA, erc8004IdB, nameA)
      ).to.be.revertedWith("AgentIdentity: node already claimed");
    });

    it("allows the SAME agent to re-set its own node (idempotent update)", async function () {
      await identity.connect(agentA).setIdentity(nodeA, erc8004IdA, nameA);
      await expect(
        identity.connect(agentA).setIdentity(nodeA, erc8004IdB, nameA)
      ).to.not.be.reverted;
      const rec = await identity.getIdentity(agentA.address);
      expect(rec.erc8004Id).to.equal(erc8004IdB);
    });

    it("does not enforce uniqueness on the zero node (unset ENS link)", async function () {
      // Two agents may both have a zero ensNode (e.g. only an ERC-8004 id, no ENS yet).
      await identity.connect(agentA).setIdentity(ethers.ZeroHash, erc8004IdA, "");
      await identity.connect(agentB).setIdentity(ethers.ZeroHash, erc8004IdB, "");

      expect((await identity.getIdentity(agentA.address)).erc8004Id).to.equal(
        erc8004IdA
      );
      expect((await identity.getIdentity(agentB.address)).erc8004Id).to.equal(
        erc8004IdB
      );
      // zero node never gets a reverse binding
      expect(await identity.getAgentByNode(ethers.ZeroHash)).to.equal(
        ethers.ZeroAddress
      );
    });
  });

  describe("event emission", function () {
    it("emits IdentitySet on the self path", async function () {
      await expect(
        identity.connect(agentA).setIdentity(nodeA, erc8004IdA, nameA)
      )
        .to.emit(identity, "IdentitySet")
        .withArgs(agentA.address, nodeA, erc8004IdA);
    });

    it("emits IdentitySet on the owner path", async function () {
      await expect(
        identity
          .connect(owner)
          .setIdentityFor(agentB.address, nodeB, erc8004IdB, nameB)
      )
        .to.emit(identity, "IdentitySet")
        .withArgs(agentB.address, nodeB, erc8004IdB);
    });
  });
});
