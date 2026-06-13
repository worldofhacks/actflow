import assert from "node:assert/strict";
import { test } from "node:test";
import type {
  IMarketplaceClient,
  MarketplaceTxResult,
} from "../interfaces/marketplace-client.js";
import { createMarketplaceTools } from "../tools/marketplace-actions.js";
import { createWalletTools } from "../tools/wallet-actions.js";
import { createSwapTools, swapExecute, swapQuote } from "../tools/swap-tools.js";
import {
  TradingApiClient,
  loadUniswapConfig,
} from "@actflow/integrations-uniswap";
import type { IWalletProvider } from "../interfaces/wallet-provider.js";
import { webResearch } from "../tools/research-tools.js";
import {
  generateImage,
  MIX_URL_SEPARATOR,
  resolveImageStyleFromTopic,
} from "../tools/image-tools.js";

// Tool.execute receives the validated input as its first parameter (Mastra
// v1). Tests call execute directly; the `any` cast keeps the tests decoupled
// from Mastra's internal generics.
async function exec(tool: unknown, input: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (tool as any).execute(input);
}

// Mastra types tool.inputSchema as StandardSchemaWithJSON, which exposes no
// zod .safeParse. Validate through the standard-schema "~standard".validate
// API instead — this exercises the exact schema Mastra validates input with
// (zod defaults included).
async function safeParse(
  schema: unknown,
  input: unknown,
): Promise<{ success: boolean; data?: Record<string, unknown> }> {
  const result = await (
    schema as {
      "~standard": { validate: (value: unknown) => unknown };
    }
  )["~standard"].validate(input);
  const r = result as { issues?: readonly unknown[]; value?: unknown };
  return r.issues === undefined
    ? { success: true, data: r.value as Record<string, unknown> }
    : { success: false };
}

test("swapQuote validates input via zod", async () => {
  assert.equal((await safeParse(swapQuote.inputSchema, {})).success, false);
  assert.equal(
    (
      await safeParse(swapQuote.inputSchema, {
        tokenIn: "USDC",
        tokenOut: "WETH",
        amountIn: "not-a-number",
      })
    ).success,
    false,
  );
  const parsed = await safeParse(swapQuote.inputSchema, {
    tokenIn: "USDC",
    tokenOut: "WETH",
    amountIn: "100.5",
  });
  assert.equal(parsed.success, true);
  // chainId is optional now (resolved at runtime from UNISWAP_SWAP_CHAIN_ID),
  // so omitting it parses and leaves it undefined.
  assert.equal(parsed.data?.chainId, undefined);
});

// A config with NO api key — exercises the keyless path without env mutation.
const KEYLESS_CONFIG = loadUniswapConfig({});

test("swapQuote returns { available:false } with no UNISWAP_API_KEY (no network)", async () => {
  // Default exported tool uses loadUniswapConfig() from the ambient env. To keep
  // this test deterministic regardless of env, drive a tool built with an
  // explicit keyless config — no fetch can possibly run.
  const { swapQuote: keylessQuote } = createSwapTools({
    config: KEYLESS_CONFIG,
  });
  const out = await exec(keylessQuote, {
    tokenIn: "USDC",
    tokenOut: "WETH",
    amountIn: "100",
  });
  assert.equal(out.available, false);
  assert.ok(/UNISWAP_API_KEY/.test(out.reason));
  // No mock data, no fabricated amounts.
  assert.equal(out.amountOut, undefined);
  assert.equal(out.mock, undefined);
});

test("swapQuote calls the real TradingApiClient (stubbed fetch, no network)", async () => {
  // Stub the global-fetch dependency at the client boundary: inject a fetchImpl
  // that returns a canned Trading API /quote response. This exercises the real
  // client request-shaping (x-api-key header, /quote path, EXACT_INPUT body)
  // with zero network access.
  const calls: { url: string; body: unknown; headers: unknown }[] = [];
  const fakeFetch = (async (url: string, init: RequestInit) => {
    calls.push({
      url,
      body: JSON.parse(String(init.body)),
      headers: init.headers,
    });
    return new Response(
      JSON.stringify({
        requestId: "req-123",
        routing: "CLASSIC",
        quote: {
          chainId: 1,
          quoteId: "quote-abc",
          output: { amount: "4200000000000000", token: "0xWETH" },
        },
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  }) as unknown as typeof fetch;

  const config = loadUniswapConfig({
    UNISWAP_API_KEY: "test-key",
    UNISWAP_SWAP_CHAIN_ID: "1",
  });
  const client = new TradingApiClient({ config, fetchImpl: fakeFetch });
  const { swapQuote: liveQuote } = createSwapTools({ config, client });

  const out = await exec(liveQuote, {
    tokenIn: "USDC",
    tokenOut: "WETH",
    amountIn: "10",
    chainId: 1,
  });

  assert.equal(out.available, true);
  assert.equal(out.requestId, "req-123");
  assert.equal(out.routing, "CLASSIC");
  assert.equal(out.amountOut, "4200000000000000");
  // 10 USDC -> 6 decimals base units.
  assert.equal(out.amountIn, "10000000");

  assert.equal(calls.length, 1);
  assert.ok(calls[0].url.endsWith("/quote"));
  const sentBody = calls[0].body as Record<string, unknown>;
  assert.equal(sentBody.type, "EXACT_INPUT");
  assert.equal(sentBody.amount, "10000000");
  assert.equal(sentBody.tokenInChainId, 1);
  assert.equal(sentBody.tokenOutChainId, 1);
  // x-api-key header is set from config (never hard-coded).
  assert.equal(
    (calls[0].headers as Record<string, string>)["x-api-key"],
    "test-key",
  );
});

test("swapExecute returns { executed:false, reason:'no funded wallet configured' } with no wallet", async () => {
  // With an api key but NO wallet provider, swapExecute must NOT broadcast and
  // must NOT invent a tx hash — it reports the missing wallet (no network).
  const config = loadUniswapConfig({
    UNISWAP_API_KEY: "test-key",
    UNISWAP_SWAP_CHAIN_ID: "1",
  });
  // A client whose fetch would throw if ever called — proves no network occurs.
  const explodeFetch = (async () => {
    throw new Error("network must not be called");
  }) as unknown as typeof fetch;
  const client = new TradingApiClient({ config, fetchImpl: explodeFetch });
  const { swapExecute: gatedExecute } = createSwapTools({ config, client });

  const out = await exec(gatedExecute, {
    tokenIn: "USDC",
    tokenOut: "WETH",
    amountIn: "10",
    chainId: 1,
    slippageBps: 50,
  });
  assert.equal(out.executed, false);
  assert.equal(out.reason, "no funded wallet configured");
  assert.equal(out.txHash, undefined);
});

test("swapExecute prepares an unsigned tx (wallet provider, stubbed fetch) without broadcasting", async () => {
  // With a wallet provider configured, swapExecute quotes + builds the swap tx
  // via the real client (stubbed fetch) and surfaces the UNSIGNED tx — it still
  // never invents a tx hash (broadcasting needs the viem WalletClient path).
  const fakeFetch = (async (url: string, init: RequestInit) => {
    const path = String(url);
    if (path.endsWith("/quote")) {
      return new Response(
        JSON.stringify({
          requestId: "q-1",
          routing: "CLASSIC",
          quote: { chainId: 1, quoteId: "quote-1" },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }
    // /swap
    void init;
    return new Response(
      JSON.stringify({
        requestId: "s-1",
        swap: {
          to: "0x1111111111111111111111111111111111111111",
          data: "0xdeadbeef",
          value: "0",
          chainId: 1,
        },
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  }) as unknown as typeof fetch;

  const config = loadUniswapConfig({
    UNISWAP_API_KEY: "test-key",
    UNISWAP_SWAP_CHAIN_ID: "1",
  });
  const client = new TradingApiClient({ config, fetchImpl: fakeFetch });
  const walletProvider: IWalletProvider = {
    async getAddress() {
      return "0x2222222222222222222222222222222222222222";
    },
    async getBalance() {
      return { symbol: "USDC", amount: "0.00" };
    },
    async pay() {
      return { txHash: "0xunused" };
    },
  };
  const { swapExecute: liveExecute } = createSwapTools({
    config,
    client,
    walletProvider,
  });

  const out = await exec(liveExecute, {
    tokenIn: "USDC",
    tokenOut: "WETH",
    amountIn: "10",
    chainId: 1,
    slippageBps: 50,
  });

  assert.equal(out.executed, false);
  assert.equal(out.txHash, undefined, "must never invent a tx hash");
  assert.equal(out.requestId, "s-1");
  assert.equal(out.unsignedTx?.to, "0x1111111111111111111111111111111111111111");
  assert.equal(out.unsignedTx?.data, "0xdeadbeef");
});

test("swapExecute rejects out-of-range slippage", async () => {
  const base = { tokenIn: "USDC", tokenOut: "WETH", amountIn: "1" };
  assert.equal(
    (await safeParse(swapExecute.inputSchema, { ...base, slippageBps: 0 }))
      .success,
    false,
  );
  assert.equal(
    (
      await safeParse(swapExecute.inputSchema, {
        ...base,
        slippageBps: 9999,
      })
    ).success,
    false,
  );
});

test("marketplace tools call through the injected IMarketplaceClient", async () => {
  const calls: string[] = [];
  const fake: IMarketplaceClient = {
    async acceptTask(taskId): Promise<MarketplaceTxResult> {
      calls.push(`accept:${taskId}`);
      return { taskId, txHash: "0xfake" };
    },
    async submitResult(taskId, resultUri): Promise<MarketplaceTxResult> {
      calls.push(`submit:${taskId}:${resultUri}`);
      return { taskId, txHash: "0xfake" };
    },
    async getTaskPrompt() {
      return "prompt";
    },
  };

  const tools = createMarketplaceTools(fake);
  assert.equal(
    (await safeParse(tools.acceptTask.inputSchema, {})).success,
    false,
    "taskId must be required",
  );

  await exec(tools.acceptTask, { taskId: "42" });
  await exec(tools.submitResult, { taskId: "42", resultUri: "ipfs://x" });
  assert.deepEqual(calls, ["accept:42", "submit:42:ipfs://x"]);
});

test("wallet pay tool enforces address/amount formats", async () => {
  const tools = createWalletTools();
  assert.equal(
    (await safeParse(tools.pay.inputSchema, { to: "bob", amount: "1" }))
      .success,
    false,
  );
  assert.equal(
    (
      await safeParse(tools.pay.inputSchema, {
        to: "0x1111111111111111111111111111111111111111",
        amount: "1.x",
      })
    ).success,
    false,
  );
  assert.equal(
    (
      await safeParse(tools.pay.inputSchema, {
        to: "0x1111111111111111111111111111111111111111",
        amount: "1.50",
      })
    ).success,
    true,
  );

  const balance = await exec(tools.getBalance, {});
  assert.equal(balance.mock, true);
  assert.equal(balance.symbol, "USDC");
});

test("webResearch is a marked stub with bounded results", async () => {
  assert.equal(
    (await safeParse(webResearch.inputSchema, { query: "" })).success,
    false,
  );
  const out = await exec(webResearch, { query: "ERC-8004", maxResults: 2 });
  assert.equal(out.mock, true);
  assert.ok(out.findings.length <= 2);
});

test("generateImage preserves the old topic-suffix routing semantics", async () => {
  assert.equal(resolveImageStyleFromTopic("img:dalle"), "dalle");
  assert.equal(resolveImageStyleFromTopic("img:ideogram"), "ideogram");
  assert.equal(resolveImageStyleFromTopic("img:mix"), "mix");
  assert.equal(resolveImageStyleFromTopic("img:img"), "gpt");

  const mixed = await exec(generateImage, { prompt: "a cat", style: "mix" });
  assert.equal(mixed.mock, true);
  assert.ok(
    mixed.url.includes(MIX_URL_SEPARATOR),
    "mix results must join urls with $act$",
  );

  assert.equal(
    (await safeParse(generateImage.inputSchema, { prompt: "x", style: "bad" }))
      .success,
    false,
  );
});
