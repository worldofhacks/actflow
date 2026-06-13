import assert from "node:assert/strict";
import { test } from "node:test";
import {
  decodeFunctionData,
  encodeFunctionData,
  getAddress,
} from "viem";
import {
  registerErc8004,
  DEFAULT_ERC8004_CHAIN_ID,
  KNOWN_IDENTITY_REGISTRIES,
  IDENTITY_REGISTRY_REGISTER_ABI,
  ERC8004_REGISTERED_TOPIC0,
} from "../identity/register-erc8004.js";

/**
 * UNIT: ERC-8004 IdentityRegistry registration. NO network — walletClient=null
 * (and/or no registry) forces the dry-run path, which assembles register(string)
 * calldata against the CONFIGURED registry and returns the plan with no tx.
 * Registry addresses/chain-id are cited from the erc8004-bigquery skill.
 */

const AGENT = {
  slug: "swap-agent",
  address: "0x1111111111111111111111111111111111111111" as `0x${string}`,
  endpoint: "https://agents.example/swap-agent/a2a",
};

test("dry run (walletClient=null): no tx, builds calldata for the default Arc registry", async () => {
  const r = await registerErc8004(AGENT, null, { env: {} });

  assert.equal(r.dryRun, true);
  assert.equal(r.txHash, undefined);
  assert.equal(r.erc8004Id, undefined);

  // Default chain = Arc Testnet 5042002 (skill); registry = known Arc deployment.
  assert.equal(r.chainId, DEFAULT_ERC8004_CHAIN_ID);
  assert.equal(
    r.registryAddress,
    getAddress(KNOWN_IDENTITY_REGISTRIES[DEFAULT_ERC8004_CHAIN_ID]),
  );

  // Calldata is exactly register(string agentURI) with our agentURI.
  const expected = encodeFunctionData({
    abi: IDENTITY_REGISTRY_REGISTER_ABI,
    functionName: "register",
    args: [AGENT.endpoint],
  });
  assert.equal(r.callData, expected);

  // And it decodes back to the same call.
  const decoded = decodeFunctionData({
    abi: IDENTITY_REGISTRY_REGISTER_ABI,
    data: r.callData,
  });
  assert.equal(decoded.functionName, "register");
  assert.deepEqual(decoded.args, [AGENT.endpoint]);
  assert.equal(r.agentURI, AGENT.endpoint);
});

test("agentURI defaults to endpoint, else empty string", async () => {
  const withUri = await registerErc8004(
    { ...AGENT, agentURI: "ipfs://abc" },
    null,
    { env: {} },
  );
  assert.equal(withUri.agentURI, "ipfs://abc");

  const noEndpoint = await registerErc8004(
    { slug: "x", address: AGENT.address },
    null,
    { env: {} },
  );
  assert.equal(noEndpoint.agentURI, "");
});

test("env ERC8004_CHAIN_ID + ERC8004_IDENTITY_REGISTRY drive the target (config-driven)", async () => {
  const registry = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"; // mainnet, cited
  const r = await registerErc8004(AGENT, null, {
    env: {
      ERC8004_CHAIN_ID: "1",
      ERC8004_IDENTITY_REGISTRY: registry,
    },
  });
  assert.equal(r.chainId, 1);
  assert.equal(r.registryAddress, getAddress(registry));
  assert.equal(r.dryRun, true); // still dry run: no wallet client
});

test("explicit options override env and known-deployment defaults", async () => {
  const override = "0x00000000000000000000000000000000000000aB";
  const r = await registerErc8004(AGENT, null, {
    env: { ERC8004_CHAIN_ID: "1", ERC8004_IDENTITY_REGISTRY: "0xdead000000000000000000000000000000000000" },
    chainId: 84532,
    registryAddress: override as `0x${string}`,
  });
  assert.equal(r.chainId, 84532);
  assert.equal(r.registryAddress, getAddress(override));
});

test("unknown chain id with no override resolves to no registry -> dry run with undefined registry", async () => {
  const r = await registerErc8004(AGENT, null, {
    env: { ERC8004_CHAIN_ID: "999999" },
  });
  assert.equal(r.chainId, 999999);
  assert.equal(r.registryAddress, undefined);
  assert.equal(r.dryRun, true);
  // Calldata is still assembled (caller can submit once a registry is known).
  assert.match(r.callData, /^0x[0-9a-f]+$/);
});

test("dry run forced even with a wallet client when no registry resolves", async () => {
  const walletClient = {
    account: { address: AGENT.address },
    writeContract: async () => {
      throw new Error("must not transact in dry run");
    },
  };
  const r = await registerErc8004(AGENT, walletClient, {
    env: { ERC8004_CHAIN_ID: "999999" }, // no known registry, no override
  });
  assert.equal(r.dryRun, true);
  assert.equal(r.txHash, undefined);
});

test("live path: sends register tx and decodes agentId from Registered event", async () => {
  let sent: any = null;
  const txHash =
    "0xaaaabbbbccccddddeeeeffff00001111222233334444555566667777888899990" as `0x${string}`;
  const registry = getAddress(
    KNOWN_IDENTITY_REGISTRIES[DEFAULT_ERC8004_CHAIN_ID],
  );

  // agentId = 167; emitted in the Registered event topic1 (indexed uint256).
  const agentId = 167n;
  const agentIdTopic = ("0x" + agentId.toString(16).padStart(64, "0")) as `0x${string}`;
  const ownerTopic = ("0x" + AGENT.address.slice(2).toLowerCase().padStart(64, "0")) as `0x${string}`;
  // Non-indexed `agentURI` lives in data — encode it the way viem would.
  const data = encodeAbiStringArg(AGENT.endpoint);

  const walletClient = {
    account: { address: AGENT.address },
    writeContract: async (args: any) => {
      sent = args;
      return txHash;
    },
    waitForTransactionReceipt: async ({ hash }: { hash: `0x${string}` }) => {
      assert.equal(hash, txHash);
      return {
        logs: [
          // An unrelated log first, to prove filtering by address + topic0.
          { address: "0x9999999999999999999999999999999999999999", topics: ["0xdeadbeef"], data: "0x" },
          {
            address: registry,
            topics: [ERC8004_REGISTERED_TOPIC0, agentIdTopic, ownerTopic],
            data,
          },
        ],
      };
    },
  };

  const r = await registerErc8004(AGENT, walletClient, { env: {} });
  assert.equal(r.dryRun, false);
  assert.equal(r.txHash, txHash);
  assert.equal(r.erc8004Id, "167");
  assert.equal(r.registryAddress, registry);
  // The write targeted the configured registry + register function.
  assert.equal(getAddress(sent.address), registry);
  assert.equal(sent.functionName, "register");
  assert.deepEqual(sent.args, [AGENT.endpoint]);
});

test("live path without receipt support: returns txHash, erc8004Id undefined (not a dry run)", async () => {
  const txHash =
    "0x1234123412341234123412341234123412341234123412341234123412341234" as `0x${string}`;
  const walletClient = {
    account: { address: AGENT.address },
    writeContract: async () => txHash,
    // no waitForTransactionReceipt
  };
  const r = await registerErc8004(AGENT, walletClient, { env: {} });
  assert.equal(r.dryRun, false);
  assert.equal(r.txHash, txHash);
  assert.equal(r.erc8004Id, undefined);
});

/** Encode a single dynamic `string` as the data section of the Registered event. */
function encodeAbiStringArg(s: string): `0x${string}` {
  // Use viem to encode `register(string)` calldata, then strip the 4-byte
  // selector to get the same ABI-encoded (offset + length + bytes) layout the
  // event's non-indexed `string agentURI` uses.
  const cd = encodeFunctionData({
    abi: IDENTITY_REGISTRY_REGISTER_ABI,
    functionName: "register",
    args: [s],
  });
  return ("0x" + cd.slice(10)) as `0x${string}`;
}
