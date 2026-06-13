const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

// npx hardhat test test/deploy-script.test.js --grep ""
//
// Proves scripts/deploy.js is CORRECT without any live RPC, funds, or creds.
//
// The real Arc testnet deploy needs faucet USDC (not available here), so instead
// we exercise the SAME exported deploy logic (resolveRevenueToken +
// deployMarketplace) against the LOCAL hardhat network using a MOCK USDC token,
// and assert the ACTMarketplaceEVM proxy is initialized with the configured
// revenue/escrow token. This is the local mirror of the live arcTestnet path:
//   - MOCK mode (here): mock USDC standing in for Arc's native USDC ERC-20.
//   - REAL mode (live): same code, REVENUE_TOKEN_ADDRESS / Arc default 0x36..00.
//
// The deploy module's revenue-token resolution is config-driven; here we assert
// both the Arc-USDC default selection (pure logic) and an end-to-end proxy
// deploy with a mock token.

const deploy = require("../scripts/deploy.js");

describe("deploy script (local mirror of arcTestnet deploy)", function () {
  let deployer;

  beforeEach(async function () {
    [deployer] = await ethers.getSigners();
  });

  describe("resolveRevenueToken (config-driven, no hard-coded WBNB)", function () {
    it("prefers the REVENUE_TOKEN_ADDRESS env override on any chain", async function () {
      const override = "0x1111111111111111111111111111111111111111";
      const resolved = await deploy.resolveRevenueToken({
        chainId: 5042002,
        chainConfig: { rvToken: { address: "0x2222222222222222222222222222222222222222" } },
        envOverride: override,
        deployMockToken: async () => {
          throw new Error("mock should not be deployed when override is set");
        },
      });
      expect(resolved.address).to.equal(override);
      expect(resolved.source).to.equal("env");
      expect(resolved.deployed).to.equal(false);
    });

    it("falls back to bcConfig rvToken.address when no env override", async function () {
      const configured = "0x3333333333333333333333333333333333333333";
      const resolved = await deploy.resolveRevenueToken({
        chainId: 11155111,
        chainConfig: { rvToken: { address: configured } },
        envOverride: undefined,
      });
      expect(resolved.address).to.equal(configured);
      expect(resolved.source).to.equal("bcConfig");
    });

    it("defaults arcTestnet (5042002) to the cited Arc native USDC ERC-20", async function () {
      const resolved = await deploy.resolveRevenueToken({
        chainId: deploy.ARC_TESTNET_CHAIN_ID,
        chainConfig: {},
        envOverride: undefined,
      });
      // Cited well-known constant from docs.arc.io contract-addresses (6 decimals).
      expect(resolved.address.toLowerCase()).to.equal(
        deploy.ARC_TESTNET_USDC_ADDRESS.toLowerCase()
      );
      expect(resolved.address.toLowerCase()).to.equal(
        "0x3600000000000000000000000000000000000000"
      );
      expect(resolved.source).to.equal("chainDefault");
      expect(resolved.deployed).to.equal(false);
    });

    it("deploys the bundled mock only for chains with no default/override/config", async function () {
      let mockDeployed = false;
      const resolved = await deploy.resolveRevenueToken({
        chainId: 31337,
        chainConfig: {},
        envOverride: undefined,
        deployMockToken: async () => {
          mockDeployed = true;
          return deploy.deployMockRevenueToken();
        },
      });
      expect(mockDeployed).to.equal(true);
      expect(resolved.source).to.equal("mock");
      expect(resolved.deployed).to.equal(true);
      expect(ethers.isAddress(resolved.address)).to.equal(true);
    });
  });

  describe("deployMarketplace (proxy initialized with configured revenue token)", function () {
    it("deploys the ACTMarketplaceEVM proxy wired to a MOCK USDC revenue token", async function () {
      // MOCK USDC standing in for Arc's native USDC ERC-20 — lets the full
      // proxy deploy run with zero funds/creds on the local hardhat network.
      const mockUsdc = await deploy.deployMockRevenueToken();
      expect(ethers.isAddress(mockUsdc.target)).to.equal(true);

      const params = { ...deploy.DEFAULT_PARAMS };

      const marketplace = await deploy.deployMarketplace({
        revenueToken: mockUsdc.target,
        params,
      });

      // It's a real upgradeable proxy.
      expect(ethers.isAddress(marketplace.target)).to.equal(true);
      const implAddr = await upgrades.erc1967.getImplementationAddress(
        marketplace.target
      );
      expect(ethers.isAddress(implAddr)).to.equal(true);
      expect(implAddr).to.not.equal(ethers.ZeroAddress);

      // *** The whole point: initialize() bound the marketplace to the
      // configured revenue/escrow token (here the mock USDC). ***
      expect(await marketplace.REVENUE_TOKEN()).to.equal(mockUsdc.target);

      // And the other initializer args landed too.
      expect(await marketplace.serviceFee()).to.equal(params.serviceFee);
      expect(await marketplace.serviceDelay()).to.equal(params.serviceDelay);
      expect(await marketplace.validationDelay()).to.equal(
        params.validationDelay
      );
      expect(await marketplace.feeBasis()).to.equal(1000);
      expect(await marketplace.owner()).to.equal(deployer.address);
    });

    it("end-to-end resolve -> deploy uses the resolved address as REVENUE_TOKEN", async function () {
      // Resolve via the mock path (chain 31337), then deploy with what we got.
      const resolved = await deploy.resolveRevenueToken({
        chainId: 31337,
        chainConfig: {},
        envOverride: undefined,
        deployMockToken: deploy.deployMockRevenueToken,
      });
      const marketplace = await deploy.deployMarketplace({
        revenueToken: resolved.address,
        params: { ...deploy.DEFAULT_PARAMS },
      });
      expect(await marketplace.REVENUE_TOKEN()).to.equal(resolved.address);
    });
  });
});
