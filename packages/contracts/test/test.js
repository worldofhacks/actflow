const {
  utils,
  toUtf8Bytes,
  hexlify,
  parseEther,
  MaxUint256,
  toUtf8String,
  keccak256,
  AbiCoder,
  getBytes,
  encodeBytes32String,
  decodeBytes32String,
} = require("ethers");
const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const abiCoder = new AbiCoder();

// npx hardhat test test/test.js --grep ""
let deployer,
  devWallet,
  signer,
  user1,
  user2,
  user3,
  user4,
  user5,
  agent1,
  agent2,
  agent3,
  agent4,
  validator;

describe("ACTMarketplaceEVM", async function () {
  before(async function () {
    [
      deployer,
      devWallet,
      signer,
      user1,
      user2,
      user3,
      user4,
      user5,
      agent1,
      agent2,
      agent3,
      agent4,
      validator,
      validator2,
    ] = await ethers.getSigners();

    const MockIPGraph = await ethers.getContractFactory("MockIPGraph");

    const mockIPGraph = await MockIPGraph.deploy();

    const deployedBytecode = await ethers.provider.getCode(mockIPGraph.target);

    await network.provider.send("hardhat_setCode", [
      "0x0000000000000000000000000000000000000101",
      deployedBytecode,
    ]);
  });

  beforeEach(async function () {
    this.feeBasis = 1000;
    this.serviceFee = 100; // 10%
    this.serviceDelay = 100; // seconds
    this.validationDelay = 50; // seconds
    this.validatorStakeDuration = 10000; // seconds
    this.validatorStakeAmount = 10000; // amount

    const RevenueToken = await ethers.getContractFactory("RevenueToken");
    this.rvToken = await RevenueToken.deploy();
    await this.rvToken.waitForDeployment();

    const ACTMarketplace = await ethers.getContractFactory("ACTMarketplaceEVM");
    this.marketplace = await upgrades.deployProxy(
      ACTMarketplace,
      [
        this.rvToken.target,
        this.serviceFee,
        this.serviceDelay,
        this.validationDelay,
        this.validatorStakeDuration,
        this.validatorStakeAmount,
      ] // Pass initialization arguments
    );

    await this.marketplace.waitForDeployment();

    // ACTMarketplaceEVM only accepts whitelisted topics (validTopics) for
    // agent registration and task creation, so enable the topics the suite uses.
    await this.marketplace.setValidTopics(
      [
        encodeBytes32String("image"),
        encodeBytes32String("video"),
        encodeBytes32String("post"),
      ],
      true // state
    );

    await this.rvToken.connect(user1).deposit({ value: parseEther("100") });
    await this.rvToken
      .connect(user1)
      .approve(this.marketplace.target, MaxUint256);

    await this.rvToken.connect(validator).deposit({ value: parseEther("100") });
    await this.rvToken
      .connect(validator)
      .approve(this.marketplace.target, MaxUint256);

    await this.rvToken
      .connect(validator2)
      .deposit({ value: parseEther("100") });
    await this.rvToken
      .connect(validator2)
      .approve(this.marketplace.target, MaxUint256);
  });

  describe("Common flow", function () {
    beforeEach(async function () {});
    // npx hardhat test test/test.js --grep "client can close pending task if not assigned"
    it("client can close pending task if not assigned", async function () {
      const reward = 1000;
      const validationReward = 100;
      await expect(
        this.marketplace.connect(user1).createTasks([
          {
            state: 0, // TaskState
            reward,
            submissionDuration: 100,
            executionDuration: 100,
            topic: encodeBytes32String("image"),
            payload: "payload",
            agents: [],
            agentSignature: "0x",
            agentSignatureExpire: 0,
            validationReward,
          },
        ])
      ).to.not.be.reverted;
      await expect(this.marketplace.connect(user1).deleteTasks([1], true)).to
        .not.be.reverted;
    });
    // npx hardhat test test/test.js --grep "client can close invited task if not assigned"
    it("client can close invited task if not assigned", async function () {
      await expect(
        this.marketplace.connect(agent1).registerAgent(
          "agent metadata",
          [encodeBytes32String("image")],
          [
            {
              enabled: true,
              fee: 1000,
              executionDuration: 100,
              metadata: "agent topic metadata",
              autoAssign: true,
            },
          ]
        )
      ).to.not.be.reverted;
      const reward = 1000;
      const validationReward = 100;
      await expect(
        this.marketplace.connect(user1).createTasks([
          {
            state: 1, // INVITED
            reward,
            submissionDuration: 100,
            executionDuration: 100,
            topic: encodeBytes32String("image"),
            payload: "payload",
            agents: [agent1.address],
            agentSignature: "0x",
            agentSignatureExpire: 0,
            validationReward,
          },
        ])
      ).to.not.be.reverted;
      await expect(this.marketplace.connect(user1).deleteTasks([1], true)).to
        .not.be.reverted;
    });

    // npx hardhat test test/test.js --grep "client can withdraw funds from assigned task if agent not submitted in time"
    it("client can withdraw funds from assigned task if agent not submitted in time", async function () {
      await expect(
        this.marketplace.connect(agent1).registerAgent(
          "agent metadata",
          [encodeBytes32String("image")],
          [
            {
              enabled: true,
              fee: 1000,
              executionDuration: 100,
              metadata: "agent topic metadata",
              autoAssign: true,
            },
          ]
        )
      ).to.not.be.reverted;
      const reward = 1000;
      const validationReward = 100;
      await expect(
        this.marketplace.connect(user1).createTasks([
          {
            state: 2, // ASSIGNED
            reward,
            submissionDuration: 100,
            executionDuration: 100,
            topic: encodeBytes32String("image"),
            payload: "payload",
            agents: [agent1.address],
            agentSignature: "0x",
            agentSignatureExpire: 0,
            validationReward,
          },
        ])
      ).to.not.be.reverted;

      const lockedBalance1 = await this.marketplace.lockedBalance(
        user1.address
      );
      expect(lockedBalance1).to.equal(reward + validationReward);

      await helpers.time.increase(100);

      const lockedBalance2 = await this.marketplace.lockedBalance(
        user1.address
      );
      expect(lockedBalance2).to.equal(0);

      const finalBalance = await this.marketplace.balances(user1.address);
      expect(finalBalance).to.equal(reward + validationReward);
    });

    // npx hardhat test test/test.js --grep "agent can set topics and client can autoassign"
    it("agent can set topics and client can autoassign", async function () {
      await expect(
        this.marketplace.connect(agent1).registerAgent(
          "agent metadata",
          [encodeBytes32String("image")],
          [
            {
              enabled: true,
              fee: 1000,
              executionDuration: 100,
              metadata: "agent image topic metadata",
              autoAssign: true,
            },
          ]
        )
      ).to.not.be.reverted;
      await expect(
        this.marketplace.connect(agent1).setAgentTopics(
          [encodeBytes32String("video"), encodeBytes32String("post")],
          [
            {
              enabled: true,
              fee: 1000,
              executionDuration: 100,
              metadata: "agent video topic metadata",
              autoAssign: true,
            },
            {
              enabled: true,
              fee: 1000,
              executionDuration: 100,
              metadata: "agent post topic metadata",
              autoAssign: true,
            },
          ]
        )
      ).to.not.be.reverted;

      await expect(
        this.marketplace.connect(agent1).setAgentTopics(
          [encodeBytes32String("video")],
          [
            {
              enabled: false,
              fee: 1000,
              executionDuration: 100,
              metadata: "video topic metadata",
              autoAssign: true,
            },
          ]
        )
      ).to.not.be.reverted;

      const agentData = await this.marketplace
        .connect(agent1)
        .getAgent(agent1.address);
      //console.log('agentData', agentData);
      expect(
        agentData.agent.topics.map((t) => {
          return decodeBytes32String(t);
        })
      ).to.include("post");
      expect(
        agentData.agent.topics.map((t) => decodeBytes32String(t))
      ).to.not.include("video");

      const reward = 1000;
      const validationReward = 100;
      await expect(
        this.marketplace.connect(user1).createTasks([
          {
            state: 2, // ASSIGNED
            reward,
            submissionDuration: 100,
            executionDuration: 100,
            topic: encodeBytes32String("image"),
            payload: "payload",
            agents: [agent1.address],
            agentSignature: "0x",
            agentSignatureExpire: 0,
            validationReward,
          },
        ])
      ).to.not.be.reverted;

      await expect(this.marketplace.connect(agent1).submitTask(1, "result")).to
        .not.be.reverted;
    });

    // npx hardhat test test/test.js --grep "funds should be unlocked when pending task expired"
    it("funds should be unlocked when pending task expired", async function () {
      const reward = 1000;
      const validationReward = 100;
      await expect(
        this.marketplace.connect(user1).createTasks([
          {
            state: 0,
            reward,
            submissionDuration: 100,
            executionDuration: 100,
            topic: encodeBytes32String("post"),
            payload: "payload",
            agents: [],
            agentSignature: "0x",
            agentSignatureExpire: 0,
            validationReward,
          },
        ])
      ).to.not.be.reverted;

      const lockedBalance1 = await this.marketplace.lockedBalance(
        user1.address
      );
      expect(lockedBalance1).to.equal(reward + validationReward);

      await helpers.time.increase(reward);

      await expect(this.marketplace.connect(agent1).submitTask(1, "result1")).to
        .be.reverted;

      const lockedBalance2 = await this.marketplace.lockedBalance(
        user1.address
      );
      expect(lockedBalance2).to.equal(0);

      const finalBalance = await this.marketplace.balances(user1.address);
      expect(finalBalance).to.equal(reward + validationReward);
    });

    // npx hardhat test test/test.js --grep "client cant assign agent with wrong topic"
    it("client cant assign agent with wrong topic", async function () {
      const reward = 1000;
      const validationReward = 100;
      await expect(
        this.marketplace.connect(agent1).registerAgent(
          "agent metadata",
          [encodeBytes32String("image")],
          [
            {
              enabled: true,
              fee: 1000,
              executionDuration: 100,
              metadata: "agent topic metadata",
              autoAssign: true,
            },
          ]
        )
      ).to.not.be.reverted;
      await expect(
        this.marketplace.connect(user1).createTasks([
          {
            state: 2,
            reward,
            submissionDuration: 100,
            executionDuration: 100,
            topic: encodeBytes32String("wrong"),
            payload: "payload",
            agents: [agent1.address],
            agentSignature: "0x",
            agentSignatureExpire: 0,
            validationReward: 0,
          },
        ])
      ).to.be.reverted;
    });

    // npx hardhat test test/test.js --grep "client can assign agent by signature"
    it("client can assign agent by signature", async function () {
      const reward = 1000;
      const executionDuration = 100;
      const validationReward = 100;
      await expect(
        this.marketplace.connect(agent1).registerAgent(
          "agent metadata",
          [encodeBytes32String("image")],
          [
            {
              enabled: true,
              fee: reward,
              executionDuration: 100,
              metadata: "agent topic metadata",
              autoAssign: false,
            },
          ]
        )
      ).to.not.be.reverted;

      const agentSignatureExpire = (await helpers.time.latest()) + 1;
      const messageHash = keccak256(
        abiCoder.encode(
          ["uint128", "string", "uint32", "uint32"],
          [reward, "payload", executionDuration, agentSignatureExpire]
        )
      );
      const agentSignature = await agent1.signMessage(getBytes(messageHash));

      await expect(
        this.marketplace.connect(user1).createTasks([
          {
            state: 2,
            reward,
            submissionDuration: 100,
            executionDuration: 100,
            topic: encodeBytes32String("image"),
            payload: "payload",
            agents: [agent1.address],
            agentSignature,
            agentSignatureExpire,
            validationReward,
          },
        ])
      ).to.not.be.reverted;

      await expect(this.marketplace.connect(agent1).submitTask(1, "result2")).to
        .not.be.reverted;

      const bal2 = await this.marketplace.balances(agent1.address);
      expect(bal2).to.equal(reward);

      await helpers.time.increase(100);

      await expect(this.marketplace.connect(agent1).withdraw(bal2)).to.not.be
        .reverted;

      const finalBalance = await this.rvToken.balanceOf(agent1.address);

      expect(finalBalance).to.be.equal(
        bal2 - BigInt((reward * this.serviceFee) / this.feeBasis)
      );
    });

    // npx hardhat test test/test.js --grep "agent can accept invite to task"
    it("agent can accept invite to task", async function () {
      await expect(
        this.marketplace.connect(agent1).registerAgent(
          "metadata2",
          [encodeBytes32String("image")],
          [
            {
              enabled: true,
              fee: 1000,
              executionDuration: 100,
              metadata: "topic metadata",
              autoAssign: true,
            },
          ]
        )
      ).to.not.be.reverted;

      const reward = 5000;
      const validationReward = 100;
      await expect(
        this.marketplace.connect(user1).createTasks([
          {
            state: 1,
            reward,
            submissionDuration: 100,
            executionDuration: 100,
            topic: encodeBytes32String("image"),
            payload: "payload",
            agents: [agent1.address],
            agentSignature: "0x",
            agentSignatureExpire: 0,
            validationReward,
          },
        ])
      ).to.not.be.reverted;

      await expect(
        this.marketplace.connect(agent1).assignTaskByAgent(1, reward, 100)
      ).to.not.be.reverted;

      await expect(this.marketplace.connect(agent1).submitTask(1, "result2")).to
        .not.be.reverted;

      const bal3 = await this.marketplace.balances(agent1.address);
      expect(bal3).to.equal(reward);

      await helpers.time.increase(100);

      await expect(this.marketplace.connect(agent1).withdraw(bal3)).to.not.be
        .reverted;

      const finalBalance = await this.rvToken.balanceOf(agent1.address);

      expect(finalBalance).to.be.equal(
        bal3 - BigInt((reward * this.serviceFee) / this.feeBasis)
      );
    });

    // npx hardhat test test/test.js --grep "client can assign agent by agreement to pending task"
    it("client can assign agent by agreement to pending task", async function () {
      await expect(
        this.marketplace.connect(agent1).registerAgent(
          "metadata2",
          [encodeBytes32String("image")],
          [
            {
              enabled: true,
              fee: 1000,
              executionDuration: 100,
              metadata: "topic metadata",
              autoAssign: true,
            },
          ]
        )
      ).to.not.be.reverted;

      const reward = 5000;
      const validationReward = 100;
      await expect(
        this.marketplace.connect(user1).createTasks([
          {
            state: 0,
            reward,
            submissionDuration: 100,
            executionDuration: 100,
            topic: encodeBytes32String("image"),
            payload: "payload",
            agents: [],
            agentSignature: "0x",
            agentSignatureExpire: 0,
            validationReward,
          },
        ])
      ).to.not.be.reverted;

      const messageHash = keccak256(
        abiCoder.encode(
          ["uint128", "string", "uint32", "uint32"],
          [reward + 100, "payload", 100, (await helpers.time.latest()) + 100]
        )
      );
      const agentSignature = await agent1.signMessage(getBytes(messageHash));

      await expect(
        this.marketplace
          .connect(user1)
          .assignTaskByClient(
            1,
            agent1.address,
            reward + 100,
            100,
            agentSignature,
            (await helpers.time.latest()) + 100,
            0
          )
      ).to.not.be.reverted;

      await expect(this.marketplace.connect(agent1).submitTask(1, "result2")).to
        .not.be.reverted;

      const bal3 = await this.marketplace.balances(agent1.address);

      expect(bal3).to.equal(reward + 100);
    });

    // npx hardhat test test/test.js --grep "client can approve earlier"
    it("client can approve earlier", async function () {
      await expect(
        this.marketplace.connect(agent1).registerAgent(
          "metadata2",
          [encodeBytes32String("image")],
          [
            {
              enabled: true,
              fee: 1000,
              executionDuration: 100,
              metadata: "topic metadata",
              autoAssign: true,
            },
          ]
        )
      ).to.not.be.reverted;

      const reward = 1000;
      const validationReward = 100;
      await expect(
        this.marketplace.connect(user1).createTasks([
          {
            state: 2,
            reward,
            submissionDuration: 100,
            executionDuration: 100,
            topic: encodeBytes32String("image"),
            payload: "payload",
            agents: [agent1.address],
            agentSignature: "0x",
            agentSignatureExpire: 0,
            validationReward,
          },
        ])
      ).to.not.be.reverted;

      await expect(this.marketplace.connect(agent1).submitTask(1, "result")).to
        .not.be.reverted;

      await expect(this.marketplace.connect(agent1).withdraw(reward)).to.be
        .reverted;

      await expect(
        this.marketplace.connect(user1).validateTask(1, true, "all good")
      ).to.not.be.reverted;

      await expect(this.marketplace.connect(agent1).withdraw(reward)).to.not.be
        .reverted;
    });
  });

  // npx hardhat test test/test.js --grep "Validation"
  describe("Validation", function () {
    beforeEach(async function () {
      await expect(
        this.marketplace.connect(agent1).registerAgent(
          "agent1 metadata",
          [encodeBytes32String("image")],
          [
            {
              enabled: true,
              fee: 1000,
              executionDuration: 100,
              metadata: "agent1 topic metadata",
              autoAssign: true,
            },
          ]
        )
      ).to.not.be.reverted;
      await expect(
        this.marketplace
          .connect(validator)
          .stakeValidator("Validator metadata2")
      ).to.not.be.reverted;
    });

    // npx hardhat test test/test.js --grep "validator can stake and withdraw all funds when expire"
    it("validator can stake and withdraw all funds when expire", async function () {
      await expect(
        this.marketplace
          .connect(validator)
          .stakeValidator("Validator metadata2")
      ).to.be.reverted;
      await helpers.time.increase(this.validatorStakeDuration);
      await expect(
        this.marketplace
          .connect(validator)
          .stakeValidator("Validator metadata2")
      ).to.not.be.reverted;
      await helpers.time.increase(this.validatorStakeDuration);
      await expect(this.marketplace.connect(validator).withdraw(0)).to.not.be
        .reverted;
    });

    // npx hardhat test test/test.js --grep "validator base test"
    it("validator base test", async function () {
      await this.marketplace
        .connect(validator2)
        .stakeValidator("Validator metadata2");

      const validators = await this.marketplace
        .connect(validator2)
        .validators(validator2.address);
      expect(validators.id).to.equal(validator2.address);
      await expect(
        this.marketplace
          .connect(validator)
          .stakeValidator("Validator metadata2")
      ).to.be.reverted;
      await helpers.time.increase(this.validatorStakeDuration);
      await expect(
        this.marketplace
          .connect(validator)
          .stakeValidator("Validator metadata2")
      ).to.not.be.reverted;
      await helpers.time.increase(this.validatorStakeDuration);
      await expect(this.marketplace.connect(validator).withdraw(0)).to.not.be
        .reverted;
    });

    // npx hardhat test test/test.js --grep "validator can validate task complete automatically"
    it("validator can validate task complete automatically", async function () {
      const reward = 1000;
      const validationReward = 100;
      await expect(
        this.marketplace.connect(user1).createTasks([
          {
            state: 2, // ASSIGNED
            reward,
            submissionDuration: 100,
            executionDuration: 100,
            topic: encodeBytes32String("image"),
            payload: "payload",
            agents: [agent1.address],
            agentSignature: "0x",
            agentSignatureExpire: 0,
            validationReward,
          },
        ])
      ).to.not.be.reverted;
      await expect(
        this.marketplace.connect(agent1).submitTask(2, "submit result")
      ).to.not.be.reverted;
      await helpers.time.increase(this.validationDelay);
      await expect(
        this.marketplace
          .connect(validator)
          .validateTask(2, true, "validation result")
      ).to.not.be.reverted;
      expect(await this.marketplace.balances(agent1.address)).to.equal(reward);
      await helpers.time.increase(this.serviceDelay);
      const aggregate = await this.marketplace.aggregate(validator.address);
      expect(aggregate.balance).to.be.equal(
        BigInt(this.validatorStakeAmount) +
          BigInt(reward) +
          BigInt(validationReward)
      );
    });

    // npx hardhat test test/test.js --grep "user can dispute validated task with resolve to validator"
    it("user can dispute validated task with resolve to validator", async function () {
      const reward = 1000;
      const validationReward = 100;
      await expect(
        this.marketplace.connect(user1).createTasks([
          {
            state: 2, // ASSIGNED
            reward,
            submissionDuration: 100,
            executionDuration: 100,
            topic: encodeBytes32String("image"),
            payload: "payload",
            agents: [agent1.address],
            agentSignature: "0x",
            agentSignatureExpire: 0,
            validationReward,
          },
        ])
      ).to.not.be.reverted;
      await expect(
        this.marketplace.connect(agent1).submitTask(2, "submit result")
      ).to.not.be.reverted;
      await helpers.time.increase(this.validationDelay);
      await expect(
        this.marketplace
          .connect(validator)
          .validateTask(2, true, "validation result")
      ).to.not.be.reverted;
      await expect(
        this.marketplace.connect(user1).disputeTask(2, "dispute reasone")
      ).to.not.be.reverted;

      await expect(
        this.marketplace
          .connect(deployer)
          .resolveTask(2, 0, 0, 1100, "resolve result")
      ).to.not.be.reverted;
    });

    // npx hardhat test test/test.js --grep "user can dispute validated task with resolve to client"
    it("user can dispute validated task with resolve to client", async function () {
      const reward = 1000;
      const validationReward = 100;
      await expect(
        this.marketplace.connect(user1).createTasks([
          {
            state: 2, // ASSIGNED
            reward,
            submissionDuration: 100,
            executionDuration: 100,
            topic: encodeBytes32String("image"),
            payload: "payload",
            agents: [agent1.address],
            agentSignature: "0x",
            agentSignatureExpire: 0,
            validationReward,
          },
        ])
      ).to.not.be.reverted;
      await expect(
        this.marketplace.connect(agent1).submitTask(2, "submit result")
      ).to.not.be.reverted;
      await helpers.time.increase(this.validationDelay);
      await expect(
        this.marketplace
          .connect(validator)
          .validateTask(2, true, "validation result")
      ).to.not.be.reverted;
      await expect(
        this.marketplace.connect(user1).disputeTask(2, "dispute reasone")
      ).to.not.be.reverted;

      await expect(
        this.marketplace
          .connect(deployer)
          .resolveTask(2, 1100, 0, 0, "resolve result")
      ).to.not.be.reverted;
    });

    // npx hardhat test test/test.js --grep "agent can dispute declined task with resolve to agent"
    it("agent can dispute declined task with resolve to agent", async function () {
      const reward = 1000;
      const validationReward = 100;
      await expect(
        this.marketplace.connect(user1).createTasks([
          {
            state: 2, // ASSIGNED
            reward,
            submissionDuration: 100,
            executionDuration: 100,
            topic: encodeBytes32String("image"),
            payload: "payload",
            agents: [agent1.address],
            agentSignature: "0x",
            agentSignatureExpire: 0,
            validationReward,
          },
        ])
      ).to.not.be.reverted;
      await expect(
        this.marketplace.connect(agent1).submitTask(2, "submit result")
      ).to.not.be.reverted;
      await helpers.time.increase(this.validationDelay);
      await expect(
        this.marketplace
          .connect(validator)
          .validateTask(2, false, "validation result")
      ).to.not.be.reverted;
      await expect(
        this.marketplace.connect(agent1).disputeTask(2, "dispute reasone")
      ).to.not.be.reverted;

      await expect(
        this.marketplace
          .connect(deployer)
          .resolveTask(2, 100, 1000, 0, "resolve result")
      ).to.not.be.reverted;
    });

    // npx hardhat test test/test.js --grep "user can decline task without validation and agent can dispute with resolve to agent"
    it("user can decline task without validation and agent can dispute with resolve to agent", async function () {
      const reward = 1000;
      const validationReward = 0;
      await expect(
        this.marketplace.connect(user1).createTasks([
          {
            state: 2, // ASSIGNED
            reward,
            submissionDuration: 100,
            executionDuration: 100,
            topic: encodeBytes32String("image"),
            payload: "payload",
            agents: [agent1.address],
            agentSignature: "0x",
            agentSignatureExpire: 0,
            validationReward,
          },
        ])
      ).to.not.be.reverted;
      await expect(
        this.marketplace.connect(agent1).submitTask(2, "submit result")
      ).to.not.be.reverted;
      await helpers.time.increase(this.validationDelay);
      await expect(
        this.marketplace
          .connect(user1)
          .validateTask(2, false, "validation result")
      ).to.not.be.reverted;
      await expect(
        this.marketplace.connect(agent1).disputeTask(2, "dispute reasone")
      ).to.not.be.reverted;

      await expect(
        this.marketplace
          .connect(deployer)
          .resolveTask(2, 0, 1000, 0, "resolve result")
      ).to.not.be.reverted;
    });

    // npx hardhat test test/test.js --grep "user can decline not validated task and agent can dispute with resolve to agent"
    it("user can decline not validated task and agent can dispute with resolve to agent", async function () {
      const reward = 1000;
      const validationReward = 100;
      await expect(
        this.marketplace.connect(user1).createTasks([
          {
            state: 2, // ASSIGNED
            reward,
            submissionDuration: 100,
            executionDuration: 100,
            topic: encodeBytes32String("image"),
            payload: "payload",
            agents: [agent1.address],
            agentSignature: "0x",
            agentSignatureExpire: 0,
            validationReward,
          },
        ])
      ).to.not.be.reverted;
      await expect(
        this.marketplace.connect(agent1).submitTask(2, "submit result")
      ).to.not.be.reverted;
      await helpers.time.increase(this.validationDelay);
      await expect(
        this.marketplace
          .connect(user1)
          .validateTask(2, false, "validation result")
      ).to.not.be.reverted;
      await expect(
        this.marketplace.connect(agent1).disputeTask(2, "dispute reasone")
      ).to.not.be.reverted;

      await expect(
        this.marketplace
          .connect(deployer)
          .resolveTask(2, 0, 1000, 0, "resolve result")
      ).to.not.be.reverted;
    });
  });
});
