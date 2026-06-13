import assert from "node:assert/strict";
import { test } from "node:test";
import type {
  IMarketplaceClient,
  MarketplaceTxResult,
} from "../interfaces/marketplace-client.js";
import { createMarketplaceTools } from "../tools/marketplace-actions.js";
import { createWalletTools } from "../tools/wallet-actions.js";
import { swapExecute, swapQuote } from "../tools/swap-tools.js";
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

test("swapQuote validates input via zod", () => {
  assert.equal(swapQuote.inputSchema!.safeParse({}).success, false);
  assert.equal(
    swapQuote
      .inputSchema!.safeParse({
        tokenIn: "USDC",
        tokenOut: "WETH",
        amountIn: "not-a-number",
      })
      .success,
    false,
  );
  const parsed = swapQuote.inputSchema!.safeParse({
    tokenIn: "USDC",
    tokenOut: "WETH",
    amountIn: "100.5",
  });
  assert.equal(parsed.success, true);
  // default chainId applied by the schema
  assert.equal((parsed as { data: { chainId: number } }).data.chainId, 1);
});

test("swapQuote / swapExecute return clearly-marked mock data", async () => {
  const quote = await exec(swapQuote, {
    tokenIn: "USDC",
    tokenOut: "WETH",
    amountIn: "100",
    chainId: 1,
  });
  assert.equal(quote.mock, true);
  assert.equal(quote.amountOut, "100");

  const result = await exec(swapExecute, {
    quoteId: quote.quoteId,
    slippageBps: 50,
  });
  assert.equal(result.mock, true);
  assert.equal(result.status, "mocked");
});

test("swapExecute rejects out-of-range slippage", () => {
  assert.equal(
    swapExecute.inputSchema!.safeParse({ quoteId: "q", slippageBps: 0 })
      .success,
    false,
  );
  assert.equal(
    swapExecute.inputSchema!.safeParse({ quoteId: "q", slippageBps: 9999 })
      .success,
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
    tools.acceptTask.inputSchema!.safeParse({}).success,
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
    tools.pay.inputSchema!.safeParse({ to: "bob", amount: "1" }).success,
    false,
  );
  assert.equal(
    tools.pay.inputSchema!.safeParse({
      to: "0x1111111111111111111111111111111111111111",
      amount: "1.x",
    }).success,
    false,
  );
  assert.equal(
    tools.pay.inputSchema!.safeParse({
      to: "0x1111111111111111111111111111111111111111",
      amount: "1.50",
    }).success,
    true,
  );

  const balance = await exec(tools.getBalance, {});
  assert.equal(balance.mock, true);
  assert.equal(balance.symbol, "USDC");
});

test("webResearch is a marked stub with bounded results", async () => {
  assert.equal(webResearch.inputSchema!.safeParse({ query: "" }).success, false);
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
    generateImage.inputSchema!.safeParse({ prompt: "x", style: "bad" })
      .success,
    false,
  );
});
