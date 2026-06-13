import assert from "node:assert/strict";
import { test } from "node:test";
import { isAddress } from "viem";
import { main } from "../bin/provision-wallet.js";

/**
 * UNIT: CLI entry. Runs in-process in MOCK mode (the ambient env has no Privy
 * creds, and we force mock to be robust). Captures stdout; asserts it prints a
 * valid address and is labeled mock. NO live Privy calls.
 */

async function runCli(argv: string[], env: Record<string, string> = {}) {
  const prevWrite = process.stdout.write.bind(process.stdout);
  const prevForce = process.env.PRIVY_FORCE_MOCK;
  // Strip any ambient Privy creds for determinism; force mock.
  const prevAppId = process.env.PRIVY_APP_ID;
  const prevSecret = process.env.PRIVY_APP_SECRET;
  delete process.env.PRIVY_APP_ID;
  delete process.env.PRIVY_APP_SECRET;
  process.env.PRIVY_FORCE_MOCK = "1";
  for (const [k, v] of Object.entries(env)) process.env[k] = v;

  let out = "";
  (process.stdout as unknown as { write: (s: string) => boolean }).write = (
    s: string,
  ) => {
    out += s;
    return true;
  };
  try {
    const code = await main(argv);
    return { code, out };
  } finally {
    (process.stdout as unknown as { write: typeof prevWrite }).write = prevWrite;
    if (prevForce === undefined) delete process.env.PRIVY_FORCE_MOCK;
    else process.env.PRIVY_FORCE_MOCK = prevForce;
    if (prevAppId !== undefined) process.env.PRIVY_APP_ID = prevAppId;
    if (prevSecret !== undefined) process.env.PRIVY_APP_SECRET = prevSecret;
  }
}

test("--help prints usage and exits 0", async () => {
  const { code, out } = await runCli(["--help"]);
  assert.equal(code, 0);
  assert.match(out, /actflow-privy-wallet/);
});

test("prints a valid mock address in text mode", async () => {
  const { code, out } = await runCli(["--label", "cli-agent"]);
  assert.equal(code, 0);
  assert.match(out, /mode:\s+mock/);
  assert.match(out, /mock:true/);
  const m = out.match(/address:\s+(0x[0-9a-fA-F]{40})/);
  assert.ok(m, "address line present");
  assert.ok(isAddress(m![1]));
});

test("--json emits a mock-tagged JSON descriptor", async () => {
  const { code, out } = await runCli(["--json", "--label", "cli-agent"]);
  assert.equal(code, 0);
  const parsed = JSON.parse(out);
  assert.equal(parsed.mode, "mock");
  assert.equal(parsed.mock, true);
  assert.equal(parsed.label, "cli-agent");
  assert.equal(parsed.chainId, 5042002);
  assert.ok(isAddress(parsed.address));
});
