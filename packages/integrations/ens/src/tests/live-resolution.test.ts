import assert from "node:assert/strict";
import { test } from "node:test";
import { loadEnsConfig } from "../config.js";
import { resolveAgent, reverseResolve } from "../client.js";

/**
 * LIVE (network, NO key): proves forward + reverse resolution works against a
 * real RPC using a well-known name (vitalik.eth). Uses MAINNET_RPC_URL if set,
 * else viem's public mainnet fallback. Skips gracefully if the network is
 * unreachable (offline CI) so it never fails the build for lack of connectivity.
 */

const VITALIK = "vitalik.eth";
// well-known address for vitalik.eth (public). Forward+reverse should agree.
const VITALIK_ADDR = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" as const;

const config = loadEnsConfig({
  ENS_CHAIN: "mainnet",
  MAINNET_RPC_URL: process.env.MAINNET_RPC_URL ?? "",
});

async function networkUp(): Promise<boolean> {
  try {
    const r = await resolveAgent(VITALIK, config);
    return r.address !== null;
  } catch {
    return false;
  }
}

test("LIVE forward-resolve vitalik.eth -> address", async (t) => {
  if (!(await networkUp())) {
    t.skip("network/RPC unavailable — skipping live resolution");
    return;
  }
  const resolved = await resolveAgent(VITALIK, config);
  assert.equal(resolved.name, VITALIK);
  assert.ok(resolved.address, "expected an address");
  assert.equal(resolved.address!.toLowerCase(), VITALIK_ADDR.toLowerCase());
});

test("LIVE reverse-resolve vitalik address -> name (forward-verified)", async (t) => {
  if (!(await networkUp())) {
    t.skip("network/RPC unavailable — skipping live reverse resolution");
    return;
  }
  const { name, verified } = await reverseResolve(VITALIK_ADDR, config);
  assert.equal(name, VITALIK);
  assert.equal(verified, true, "reverse resolution must forward-verify (SKILL)");
});
