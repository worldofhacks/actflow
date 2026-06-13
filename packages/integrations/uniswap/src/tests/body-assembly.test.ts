import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildQuoteBody,
  buildCheckApprovalBody,
  buildSwapBody,
} from "../client.js";
import type { QuoteResponse } from "../types.js";

/**
 * UNIT: request-body assembly matches the SKILL field names EXACTLY.
 * These never touch the network — they assert the exact keys the API expects
 * (renaming any of these silently breaks the integration).
 */

test("/quote body has exactly the SKILL required fields + only set optionals", () => {
  const body = buildQuoteBody({
    type: "EXACT_INPUT",
    amount: "10000000", // 10 USDC, 6 decimals (SKILL gotcha: base-units string)
    tokenIn: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    tokenOut: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    swapper: "0x1234567890123456789012345678901234567890",
    chainId: 1,
    slippageTolerance: 0.5,
    routingPreference: "BEST_PRICE",
  });

  // SKILL required fields, exact names:
  assert.equal(body.type, "EXACT_INPUT");
  assert.equal(body.amount, "10000000");
  assert.equal(typeof body.amount, "string");
  assert.equal(body.tokenInChainId, 1);
  assert.equal(body.tokenOutChainId, 1);
  assert.equal(body.tokenIn, "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
  assert.equal(body.tokenOut, "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");
  assert.equal(body.swapper, "0x1234567890123456789012345678901234567890");
  // set optionals:
  assert.equal(body.slippageTolerance, 0.5);
  assert.equal(body.routingPreference, "BEST_PRICE");

  // exact key set — no stray/renamed keys
  assert.deepEqual(
    Object.keys(body).sort(),
    [
      "amount",
      "routingPreference",
      "slippageTolerance",
      "swapper",
      "tokenIn",
      "tokenInChainId",
      "tokenOut",
      "tokenOutChainId",
      "type",
    ].sort(),
  );
});

test("/quote body supports cross-chain tokenInChainId/tokenOutChainId overrides", () => {
  const body = buildQuoteBody({
    type: "EXACT_INPUT",
    amount: "1",
    tokenIn: "0xaaaa000000000000000000000000000000000000",
    tokenOut: "0xbbbb000000000000000000000000000000000000",
    swapper: "0xcccc000000000000000000000000000000000000",
    chainId: 1,
    tokenInChainId: 8453,
    tokenOutChainId: 1,
  });
  assert.equal(body.tokenInChainId, 8453);
  assert.equal(body.tokenOutChainId, 1);
});

test("/quote body omits optionals that were not provided", () => {
  const body = buildQuoteBody({
    type: "EXACT_INPUT",
    amount: "1",
    tokenIn: "0xaaaa000000000000000000000000000000000000",
    tokenOut: "0xbbbb000000000000000000000000000000000000",
    swapper: "0xcccc000000000000000000000000000000000000",
    chainId: 1,
  });
  assert.equal("slippageTolerance" in body, false);
  assert.equal("routingPreference" in body, false);
  assert.equal("permitAmount" in body, false);
});

test("/check_approval body has exactly the SKILL required fields", () => {
  const body = buildCheckApprovalBody({
    walletAddress: "0x1234567890123456789012345678901234567890",
    token: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    amount: "10000000",
    chainId: 1,
  });
  // SKILL required: chainId, walletAddress, token, amount — exact names
  assert.equal(body.chainId, 1);
  assert.equal(body.walletAddress, "0x1234567890123456789012345678901234567890");
  assert.equal(body.token, "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
  assert.equal(body.amount, "10000000");
  assert.equal(typeof body.amount, "string");
  assert.deepEqual(
    Object.keys(body).sort(),
    ["amount", "chainId", "token", "walletAddress"].sort(),
  );
});

test("/check_approval body includes tokenOut/tokenOutChainId when provided", () => {
  const body = buildCheckApprovalBody({
    walletAddress: "0x1234567890123456789012345678901234567890",
    token: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    amount: "10000000",
    chainId: 1,
    tokenOut: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    tokenOutChainId: 1,
  });
  assert.equal(body.tokenOut, "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");
  assert.equal(body.tokenOutChainId, 1);
});

test("/swap body echoes the quote object and forwards permitData + signature", () => {
  const quoteResponse: QuoteResponse = {
    requestId: "req-1",
    routing: "CLASSIC",
    quote: { chainId: 1, quoteId: "q-1" },
    permitData: {
      domain: { name: "Permit2", chainId: 1, verifyingContract: "0x00" },
      types: {
        PermitSingle: [{ name: "details", type: "PermitDetails" }],
        PermitDetails: [{ name: "token", type: "address" }],
      },
      values: { details: { token: "0x00" }, spender: "0x00", sigDeadline: "1" },
    },
  };
  const body = buildSwapBody(quoteResponse, {
    signature: ("0x" + "ab".repeat(65)) as `0x${string}`,
  });
  // SKILL POST /swap required: `quote` (echo full quote object from /quote)
  assert.deepEqual(body.quote, quoteResponse.quote);
  assert.equal(body.quote.quoteId, "q-1");
  assert.ok(body.permitData, "permitData should default from the quote");
  assert.equal(body.permitData!.domain.name, "Permit2");
  assert.ok(body.signature?.startsWith("0x"));
});

test("/swap body omits permitData/signature when the quote has none", () => {
  const quoteResponse: QuoteResponse = {
    requestId: "req-2",
    routing: "CLASSIC",
    quote: { chainId: 1 },
    permitData: null,
  };
  const body = buildSwapBody(quoteResponse);
  assert.equal("permitData" in body, false);
  assert.equal("signature" in body, false);
  assert.deepEqual(Object.keys(body), ["quote"]);
});
