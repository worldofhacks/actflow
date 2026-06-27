// Demonstrates the full ON-CHAIN task escrow lifecycle of ACTMarketplaceEVM
// end-to-end against a live (already-deployed) marketplace, narrating the escrow
// movement at every stage. Mirrors the authoritative call shapes in test/test.js.
//
// Stages: CREATE -> ASSIGN -> SUBMIT -> VALIDATE -> WITHDRAW
//
// Run (against the live local hardhat node):
//   ACT_MARKET_ADDRESS=0x5FC8d32690cc91D4c39d9d3abcBD16989F875707 \
//   REVENUE_TOKEN_ADDRESS=0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9 \
//   LOCALHOST_RPC_URL=http://127.0.0.1:8546 \
//   npx hardhat run --network localhost scripts/demo-task-lifecycle.js
//
// Notes:
// - Uses the standard hardhat default funded accounts: idx4 = client,
//   idx1 = the registered "swap" agent, idx5 = validator.
// - Creates a FRESH task on the existing deployment each run (taskId space is
//   safe), so it is rerunnable without redeploying.
// - The contract is NEVER modified. All amounts are in wei of the RevenueToken
//   (the escrow asset, a WETH-style wrapper minted 1:1 from ETH via deposit()).

const { ethers } = require("hardhat");
const { MaxUint256, parseEther, encodeBytes32String } = require("ethers");
const helpers = require("@nomicfoundation/hardhat-network-helpers");

const ACT_MARKET_ADDRESS = process.env.ACT_MARKET_ADDRESS;
const REVENUE_TOKEN_ADDRESS = process.env.REVENUE_TOKEN_ADDRESS;

// Mirrors deploy params: feeBasis 1000, serviceFee 100 (=> 10%),
// serviceDelay 100s, validationDelay 50s.
const FEE_BASIS = 1000n;

// Task economics (wei of RevenueToken). reward divisible by 10 keeps the 10%
// fee an exact integer.
const TOPIC = "swap";
const REWARD = 50000n;
const VALIDATION_REWARD = 5000n;
const SUBMISSION_DURATION = 1000; // window for the agent to accept the invite
const EXECUTION_DURATION = 3600; // window for the agent to submit a result

const TASK_STATE = [
  "PENDING", "INVITED", "ASSIGNED", "COMPLETED", "DELETED", "SUBMITTED",
  "VALIDATED", "DECLINED_BY_OWNER", "DECLINED_BY_VALIDATOR",
  "DISPUTED_BY_OWNER", "DISPUTED_BY_AGENT", "RESOLVED",
];

function hr(title) {
  console.log("\n" + "=".repeat(72));
  console.log(title);
  console.log("=".repeat(72));
}

async function main() {
  if (!ACT_MARKET_ADDRESS) throw new Error("ACT_MARKET_ADDRESS env required");
  if (!REVENUE_TOKEN_ADDRESS) throw new Error("REVENUE_TOKEN_ADDRESS env required");

  const net = await ethers.provider.getNetwork();
  const signers = await ethers.getSigners();
  const client = signers[4];
  const agent = signers[1];
  const validator = signers[5];

  const market = await ethers.getContractAt("ACTMarketplaceEVM", ACT_MARKET_ADDRESS);
  const rv = await ethers.getContractAt("RevenueToken", REVENUE_TOKEN_ADDRESS);

  const serviceFee = await market.serviceFee();
  const serviceDelay = Number(await market.serviceDelay());
  const validationDelay = Number(await market.validationDelay());
  const topicHash = encodeBytes32String(TOPIC);

  // Reporting helpers -------------------------------------------------------
  const escrow = async (label, who) => {
    const bal = await market.balances(who.address); // internal marketplace credit
    const locked = await market.lockedBalance(who.address); // currently escrow-locked
    const rvBal = await rv.balanceOf(who.address); // free RevenueToken in wallet
    console.log(
      `   ${label.padEnd(10)} balances=${bal} locked(escrow)=${locked} rvWallet=${rvBal}`
    );
    return { bal, locked, rvBal };
  };
  const taskState = async (taskId) => {
    const t = await market.getTask(taskId);
    return { t, name: TASK_STATE[Number(t.state)] };
  };

  hr("ACTMarketplaceEVM — FULL ON-CHAIN TASK ESCROW LIFECYCLE");
  console.log(`network chainId : ${net.chainId}`);
  console.log(`marketplace     : ${ACT_MARKET_ADDRESS}`);
  console.log(`revenue token   : ${REVENUE_TOKEN_ADDRESS}`);
  console.log(`client  (idx4)  : ${client.address}`);
  console.log(`agent   (idx1)  : ${agent.address}  topic="${TOPIC}"`);
  console.log(`validator(idx5) : ${validator.address}`);
  console.log(
    `params          : serviceFee=${serviceFee}/${FEE_BASIS} (${(Number(serviceFee) / Number(FEE_BASIS)) * 100}%), ` +
      `serviceDelay=${serviceDelay}s, validationDelay=${validationDelay}s`
  );
  console.log(`economics       : reward=${REWARD}  validationReward=${VALIDATION_REWARD}  (wei of RevenueToken)`);

  // Sanity: agent must be registered for the topic so it can be invited/assigned.
  const agentRec = await market.agents(agent.address);
  if (agentRec.id === ethers.ZeroAddress) {
    throw new Error(`agent ${agent.address} is not registered — run register-demo-agents.js first`);
  }
  const agentTopic = await market.agentTopics(agent.address, topicHash);
  if (!agentTopic.enabled) {
    throw new Error(`agent ${agent.address} does not have topic "${TOPIC}" enabled`);
  }
  if (!(await market.validTopics(topicHash))) {
    throw new Error(`topic "${TOPIC}" is not whitelisted (validTopics)`);
  }

  // ======================================================================
  // STAGE 1 — CREATE
  // Client funds escrow (ETH -> RevenueToken), approves the marketplace, and
  // creates one INVITED task addressed to the registered agent. reward +
  // validationReward are locked into the client's escrow.
  // ======================================================================
  hr("STAGE 1 — CREATE  (client deposits, approves, createTasks)");
  console.log(" BEFORE:");
  await escrow("client", client);

  // Deposit ETH -> RevenueToken (1:1) and approve the marketplace to pull escrow.
  await (await rv.connect(client).deposit({ value: parseEther("1") })).wait();
  await (await rv.connect(client).approve(ACT_MARKET_ADDRESS, MaxUint256)).wait();
  console.log(" funded 1 ETH -> RevenueToken and approved marketplace (MaxUint256)");

  const idBefore = await market.idCounter();
  await (
    await market.connect(client).createTasks([
      {
        state: 1, // INVITED — agent self-assigns via assignTaskByAgent (test.js pattern)
        reward: REWARD,
        submissionDuration: SUBMISSION_DURATION,
        executionDuration: EXECUTION_DURATION,
        topic: topicHash,
        payload: "demo: swap 100 USDC -> ETH",
        agents: [agent.address],
        agentSignature: "0x",
        agentSignatureExpire: 0,
        validationReward: VALIDATION_REWARD,
      },
    ])
  ).wait();

  const taskId = idBefore + 1n; // createTasks increments idCounter per task
  const { name: s1name } = await taskState(taskId);
  const lockedForTask = await market.lockedBalanceByTask(client.address, taskId);
  console.log(`\n >> created taskId = ${taskId}  state = ${s1name}`);
  console.log(` >> client escrow LOCKED for this task = ${lockedForTask} (= reward ${REWARD} + validationReward ${VALIDATION_REWARD})`);
  console.log(" AFTER:");
  await escrow("client", client);
  if (lockedForTask !== REWARD + VALIDATION_REWARD) {
    throw new Error(`STAGE 1 FAIL: locked escrow ${lockedForTask} != ${REWARD + VALIDATION_REWARD}`);
  }

  // ======================================================================
  // STAGE 2 — ASSIGN
  // The invited agent accepts the task: assignTaskByAgent(taskId, reward, execDur).
  // (reward arg is deprecated/ignored on-chain; execDuration must match the task.)
  // ======================================================================
  hr("STAGE 2 — ASSIGN  (agent.assignTaskByAgent)");
  await (
    await market.connect(agent).assignTaskByAgent(taskId, REWARD, EXECUTION_DURATION)
  ).wait();
  const { t: t2, name: s2name } = await taskState(taskId);
  console.log(` >> task state = ${s2name}   assignedAgent = ${t2.assignedAgent}`);
  if (s2name !== "ASSIGNED") throw new Error(`STAGE 2 FAIL: state is ${s2name}, expected ASSIGNED`);
  if (t2.assignedAgent.toLowerCase() !== agent.address.toLowerCase()) {
    throw new Error("STAGE 2 FAIL: assignedAgent mismatch");
  }

  // ======================================================================
  // STAGE 3 — SUBMIT
  // The agent submits the result. On submit, the reward moves out of the
  // client's escrow and into the agent's internal marketplace balance (locked
  // until validation / serviceDelay).
  // ======================================================================
  hr("STAGE 3 — SUBMIT  (agent.submitTask)");
  console.log(" BEFORE:");
  await escrow("agent", agent);
  const agentBalBefore = await market.balances(agent.address);

  await (await market.connect(agent).submitTask(taskId, "ipfs://demo-result")).wait();

  const agentBalAfter = await market.balances(agent.address);
  const { name: s3name } = await taskState(taskId);
  console.log(`\n >> task state = ${s3name}`);
  console.log(` >> agent internal marketplace balance: ${agentBalBefore} -> ${agentBalAfter} (delta = ${agentBalAfter - agentBalBefore})`);
  console.log(" AFTER:");
  await escrow("agent", agent);
  await escrow("client", client);
  if (agentBalAfter - agentBalBefore !== REWARD) {
    throw new Error(`STAGE 3 FAIL: agent balance delta ${agentBalAfter - agentBalBefore} != reward ${REWARD}`);
  }

  // ======================================================================
  // STAGE 4 — VALIDATE
  // A staked validator approves the submission. We advance time past
  // validationDelay (but stay within serviceDelay) so validation is open.
  // ======================================================================
  hr("STAGE 4 — VALIDATE  (validator stake + validateTask)");

  // Validator funds + approves RevenueToken so the marketplace can pull the
  // stake (and the per-task guarantee) on demand.
  await (await rv.connect(validator).deposit({ value: parseEther("1") })).wait();
  await (await rv.connect(validator).approve(ACT_MARKET_ADDRESS, MaxUint256)).wait();

  // Stake (skip if a prior run left this validator already staked).
  const vrec = await market.validators(validator.address);
  const nowTs = (await ethers.provider.getBlock("latest")).timestamp;
  if (Number(vrec.expireAtTs) > nowTs) {
    console.log(` validator already staked (expireAtTs=${vrec.expireAtTs}) — skipping stake`);
  } else {
    await (await market.connect(validator).stakeValidator("Demo validator metadata")).wait();
    console.log(" validator staked");
  }
  console.log(" validator escrow after stake:");
  await escrow("validator", validator);

  // Move time forward past validationDelay so validation is permitted, while
  // staying under serviceDelay so the validation window is still open.
  const bump = validationDelay + 10;
  await helpers.time.increase(bump);
  console.log(` advanced time by ${bump}s (past validationDelay=${validationDelay}s, under serviceDelay=${serviceDelay}s)`);

  await (await market.connect(validator).validateTask(taskId, true, "approved")).wait();
  const { t: t4, name: s4name } = await taskState(taskId);
  console.log(` >> task state = ${s4name}   validator = ${t4.validator}`);
  if (s4name !== "VALIDATED") throw new Error(`STAGE 4 FAIL: state is ${s4name}, expected VALIDATED`);

  // ======================================================================
  // STAGE 5 — WITHDRAW
  // Validation released the agent's reward lock, so the agent withdraws the
  // reward. On withdraw the 10% service fee is taken; the agent's RevenueToken
  // wallet balance increases by reward - fee.
  // ======================================================================
  hr("STAGE 5 — WITHDRAW  (agent.withdraw)");
  const fee = (REWARD * serviceFee) / FEE_BASIS; // matches _withdraw: amount*serviceFee/feeBasis
  const expectedNet = REWARD - fee;

  const rvBefore = await rv.balanceOf(agent.address);
  console.log(" BEFORE:");
  await escrow("agent", agent);

  await (await market.connect(agent).withdraw(REWARD)).wait();

  const rvAfter = await rv.balanceOf(agent.address);
  const gained = rvAfter - rvBefore;
  console.log("\n AFTER:");
  await escrow("agent", agent);
  console.log(`\n >> RevenueToken wallet: ${rvBefore} -> ${rvAfter}  (gained ${gained})`);
  console.log(` >> reward=${REWARD}  serviceFee=${fee} (10%)  expected net=${expectedNet}`);
  if (gained !== expectedNet) {
    throw new Error(`STAGE 5 FAIL: agent gained ${gained} != reward-fee ${expectedNet}`);
  }

  hr("RESULT");
  console.log(`taskId ${taskId}: CREATE -> ASSIGN -> SUBMIT -> VALIDATE -> WITHDRAW`);
  console.log(`reward=${REWARD}  fee=${fee}  netToAgent=${gained}  finalState=${s4name}`);
  console.log("\n✅ FULL LIFECYCLE OK");
}

main().catch((e) => {
  console.error("\n❌ LIFECYCLE FAILED:", e.reason || e.shortMessage || e.message || e);
  process.exit(1);
});
