import assert from "node:assert/strict";
import { test } from "node:test";
import { getAddress } from "viem";
import { nameToNode, subnameString } from "@actflow/integrations-ens";
import {
  provisionAgent,
  type ProvisionAgentInput,
} from "../identity/provision-agent.js";
import {
  DEFAULT_ERC8004_CHAIN_ID,
  KNOWN_IDENTITY_REGISTRIES,
} from "../identity/register-erc8004.js";

/**
 * UNIT: full agent identity provisioning (ERC-8004 + ENS + setIdentity args).
 * Fully dry-run/mock-safe — walletClient=null forces both sub-steps to dry run,
 * so there is NO network at all. Hermetic env (not process.env).
 */

const PARENT = "actflow.eth";
function env(extra: Record<string, string> = {}): NodeJS.ProcessEnv {
  return { ENS_PARENT_NAME: PARENT, ENS_CHAIN: "mainnet", ...extra };
}

const input: ProvisionAgentInput = {
  slug: "swap-agent",
  address: "0x2222222222222222222222222222222222222222",
  endpoint: "https://agents.example/swap-agent/a2a",
  topics: ["swap"] as any,
  x402: true,
};

test("dry run: ensNode == namehash(<slug>.<parent>) and ensName is the subname", async () => {
  const r = await provisionAgent(input, { walletClient: null, env: env() });

  assert.equal(r.dryRun, true);
  assert.equal(r.ensName, subnameString(PARENT, input.slug));
  assert.equal(r.ensName, "swap-agent.actflow.eth");
  // ensNode must equal the independently computed namehash.
  assert.equal(r.ensNode, nameToNode(`${input.slug}.${PARENT}`));
  assert.match(r.ensNode, /^0x[0-9a-f]{64}$/);
});

test("dry run: ERC-8004 step assembles register calldata against the default Arc registry, no tx", async () => {
  const r = await provisionAgent(input, { walletClient: null, env: env() });

  assert.equal(r.erc8004.dryRun, true);
  assert.equal(r.erc8004.txHash, undefined);
  assert.equal(r.erc8004.chainId, DEFAULT_ERC8004_CHAIN_ID);
  assert.equal(
    r.erc8004.registryAddress,
    getAddress(KNOWN_IDENTITY_REGISTRIES[DEFAULT_ERC8004_CHAIN_ID]),
  );
  assert.match(r.erc8004.callData, /^0x[0-9a-f]+$/);
  assert.equal(r.erc8004.agentURI, input.endpoint);
});

test("dry run: identityExtensionCall mirrors {ensNode, erc8004Id, ensName}", async () => {
  const r = await provisionAgent(input, { walletClient: null, env: env() });

  assert.equal(r.identityExtensionCall.ensNode, r.ensNode);
  assert.equal(r.identityExtensionCall.ensName, r.ensName);
  // No real ERC-8004 id was minted (dry run) → empty string sentinel, never a
  // fabricated id. The result-level erc8004Id is also undefined.
  assert.equal(r.identityExtensionCall.erc8004Id, "");
  assert.equal(r.erc8004Id, undefined);
});

test("dry run: overall dryRun is true if EITHER sub-step is dry run", async () => {
  // ERC-8004 has a funded wallet but no registry for an unknown chain → it dry
  // runs; ENS is also dry (no wallet). Either dry-run must flip overall to true.
  // The wallet's writeContract must NEVER be called in this dry-run config.
  const erc8004Wallet = {
    account: { address: input.address as `0x${string}` },
    writeContract: async () => {
      throw new Error("no tx expected (ERC-8004 dry run)");
    },
  };
  const r = await provisionAgent(input, {
    ensWalletClient: null,
    erc8004WalletClient: erc8004Wallet as any,
    env: env({ ERC8004_CHAIN_ID: "999999" }), // no known registry → dry run
  });
  assert.equal(r.erc8004.dryRun, true);
  assert.equal(r.dryRun, true);
});

test("dry run: ERC-8004 id flows into the ENS ENSIP-25 attestation when both id and ENS registry exist", async () => {
  // Supply a real erc8004 id via the ERC-8004 step (we fake it by short-circuit:
  // the ENS attestation only writes when erc8004Id AND an ERC-7930 registry are
  // present). Here we force a real-ish ERC-8004 id by giving a wallet + registry
  // and a receipt that yields the id, while ENS stays dry (no wallet for ENS).
  const erc8004Wallet = {
    account: { address: input.address as `0x${string}` },
    writeContract: async () =>
      "0xfeed000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
    waitForTransactionReceipt: async () => ({
      logs: [
        {
          address: getAddress(
            KNOWN_IDENTITY_REGISTRIES[DEFAULT_ERC8004_CHAIN_ID],
          ),
          topics: [
            "0xca52e62c367d81bb2e328eb795f7c7ba24afb478408a26c0e201d155c449bc4a",
            "0x" + (42n).toString(16).padStart(64, "0"),
            "0x" + input.address.slice(2).toLowerCase().padStart(64, "0"),
          ],
          // agentURI ("") encoded: offset(0x20) + length(0)
          data:
            "0x0000000000000000000000000000000000000000000000000000000000000020" +
            "0000000000000000000000000000000000000000000000000000000000000000",
        },
      ],
    }),
  };

  const ensRegistry =
    "0x000100000101148004a169fb4a3325136eb29fa0ceb6d2e539a432"; // ERC-7930, cited

  const r = await provisionAgent(input, {
    ensWalletClient: null, // ENS stays dry
    erc8004WalletClient: erc8004Wallet as any,
    env: env(),
    ens: { registry: ensRegistry },
  });

  // Real ERC-8004 id minted by the ERC-8004 step.
  assert.equal(r.erc8004.dryRun, false);
  assert.equal(r.erc8004Id, "42");
  assert.equal(r.identityExtensionCall.erc8004Id, "42");

  // The id flowed into the ENS step's ENSIP-25 registration record.
  const key = `agent-registration[${ensRegistry}][42]`;
  const records = new Map(r.records);
  assert.equal(records.get(key), "1");

  // Overall still dry run because the ENS step did not transact.
  assert.equal(r.ens.dryRun, true);
  assert.equal(r.dryRun, true);
});

test("dry run forced when no parent name configured (no network)", async () => {
  const r = await provisionAgent(input, {
    walletClient: null,
    env: { ENS_CHAIN: "mainnet" }, // no ENS_PARENT_NAME
  });
  assert.equal(r.dryRun, true);
  assert.equal(r.ensName, input.slug); // label-only placeholder
  assert.equal(
    r.ensNode,
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  );
});
