import assert from "node:assert/strict";
import { test } from "node:test";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { loadEnsConfig } from "../config.js";
import { mintSubname, setAgentRecords, resolveAgent } from "../client.js";

/**
 * GATED integration test: mints a real subname on Sepolia and writes/reads
 * agent records. Runs ONLY when SEPOLIA_RPC_URL + DEPLOYER_PRIVATE_KEY +
 * ENS_PARENT_NAME are all present (and the parent is a WRAPPED name owned by the
 * key). Otherwise it skips with a clear message — CI must pass WITHOUT funds.
 *
 * SKILL: keys are never read by the library; the test builds the WalletClient
 * and passes it in. expiry/fuses follow SKILL guidance (fuses=0; expiry probed).
 */

const RPC = process.env.SEPOLIA_RPC_URL?.trim();
const KEY = process.env.DEPLOYER_PRIVATE_KEY?.trim();
const PARENT = process.env.ENS_PARENT_NAME?.trim();
const enabled = Boolean(RPC && KEY && PARENT);

// Optional knobs for the gated run.
const LABEL = process.env.ENS_TEST_LABEL?.trim() || `agent-${Date.now()}`;
const EXPIRY = process.env.ENS_TEST_EXPIRY
  ? BigInt(process.env.ENS_TEST_EXPIRY)
  : 0n; // SKILL: expiry=0 UNVERIFIED — set ENS_TEST_EXPIRY to a far-future uint64 if resolution fails.

test("GATED Sepolia mint + records round-trip", async (t) => {
  if (!enabled) {
    t.skip(
      "Sepolia mint disabled — set SEPOLIA_RPC_URL, DEPLOYER_PRIVATE_KEY and " +
        "ENS_PARENT_NAME (wrapped, owned by the key) to run. CI passes without funds.",
    );
    return;
  }

  const config = loadEnsConfig({
    ENS_CHAIN: "sepolia",
    SEPOLIA_RPC_URL: RPC!,
    ENS_PARENT_NAME: PARENT!,
  });
  const account = privateKeyToAccount(KEY as `0x${string}`);
  const wallet = createWalletClient({
    account,
    chain: config.chain,
    transport: http(config.rpcUrl),
  });

  // 1) mint <LABEL>.<PARENT> to ourselves
  const minted = await mintSubname(
    wallet,
    {
      parentName: PARENT!,
      label: LABEL,
      ownerAddress: account.address,
      expiry: EXPIRY,
    },
    config,
  );
  assert.ok(minted.txHash);
  assert.equal(minted.name, `${LABEL}.${PARENT}`);

  // 2) write ENSIP-26 + ENSIP-25 records
  await setAgentRecords(
    wallet,
    {
      name: minted.name,
      records: {
        context: "ActFlow gated-test agent.",
        endpoints: { a2a: "https://agents.actflow.example/test/a2a" },
        capabilities: ["test"],
        x402: true,
      },
    },
    config,
  );

  // 3) read back
  const resolved = await resolveAgent(minted.name, config);
  assert.equal(resolved.profile.context, "ActFlow gated-test agent.");
  assert.equal(
    resolved.profile.endpoints?.a2a,
    "https://agents.actflow.example/test/a2a",
  );
  assert.deepEqual(resolved.profile.capabilities, ["test"]);
  assert.equal(resolved.profile.x402, true);
});
