import assert from "node:assert/strict";
import { test } from "node:test";
import { loadEnsConfig, requireParentName, addressOverrideEnv } from "../config.js";

/**
 * UNIT: config resolution. Proves chain id comes from viem/chains (never a
 * literal), addresses are env-overridable, and parent name is env-only.
 */

test("defaults to sepolia with public RPC fallback when nothing is set", () => {
  const cfg = loadEnsConfig({});
  assert.equal(cfg.network, "sepolia");
  assert.equal(cfg.chain.id, 11155111); // from viem/chains, not hard-coded here
  assert.equal(cfg.usingPublicRpcFallback, true);
  assert.ok(cfg.rpcUrl.startsWith("http"));
  assert.equal(cfg.parentName, undefined);
});

test("ENS_CHAIN=mainnet resolves mainnet chain id from viem/chains", () => {
  const cfg = loadEnsConfig({ ENS_CHAIN: "mainnet" });
  assert.equal(cfg.network, "mainnet");
  assert.equal(cfg.chain.id, 1);
});

test("RPC env override wins over public fallback", () => {
  const cfg = loadEnsConfig({
    ENS_CHAIN: "mainnet",
    MAINNET_RPC_URL: "https://my-mainnet.example/rpc",
  });
  assert.equal(cfg.rpcUrl, "https://my-mainnet.example/rpc");
  assert.equal(cfg.usingPublicRpcFallback, false);
});

test("SEPOLIA_RPC_URL override is used on sepolia", () => {
  const cfg = loadEnsConfig({
    ENS_CHAIN: "sepolia",
    SEPOLIA_RPC_URL: "https://my-sepolia.example/rpc",
  });
  assert.equal(cfg.rpcUrl, "https://my-sepolia.example/rpc");
  assert.equal(cfg.usingPublicRpcFallback, false);
});

test("invalid ENS_CHAIN throws", () => {
  assert.throws(() => loadEnsConfig({ ENS_CHAIN: "polygon" }));
});

test("parent name comes from ENS_PARENT_NAME only", () => {
  const cfg = loadEnsConfig({ ENS_PARENT_NAME: "actflow.eth" });
  assert.equal(cfg.parentName, "actflow.eth");
  assert.equal(requireParentName(cfg), "actflow.eth");
});

test("requireParentName throws when unset", () => {
  assert.throws(() => requireParentName(loadEnsConfig({})));
});

test("address overrides are honored and validated", () => {
  const env = addressOverrideEnv("nameWrapper", "sepolia");
  assert.equal(env, "ENS_NAME_WRAPPER_SEPOLIA");
  const cfg = loadEnsConfig({
    [env]: "0x1111111111111111111111111111111111111111",
  });
  assert.equal(
    cfg.addresses.nameWrapper,
    "0x1111111111111111111111111111111111111111",
  );
});

test("malformed address override throws", () => {
  assert.throws(() =>
    loadEnsConfig({
      [addressOverrideEnv("publicResolver", "sepolia")]: "0xnotanaddress",
    }),
  );
});

test("default addresses are present for both networks", () => {
  const sep = loadEnsConfig({ ENS_CHAIN: "sepolia" }).addresses;
  const main = loadEnsConfig({ ENS_CHAIN: "mainnet" }).addresses;
  for (const a of [sep, main]) {
    for (const v of Object.values(a)) {
      assert.match(v, /^0x[0-9a-fA-F]{40}$/);
    }
  }
});
