import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  type IWalletProvider,
  MockWalletProvider,
} from "../interfaces/wallet-provider.js";

const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/;
const DECIMAL_AMOUNT = /^\d+(\.\d+)?$/;

/**
 * Standard wallet tools (getBalance / pay).
 *
 * Typed stubs over IWalletProvider — the default provider is the
 * clearly-marked MockWalletProvider (no keys, no signing) until Phase 4
 * wires a live wallet backend.
 */
export function createWalletTools(
  provider: IWalletProvider = new MockWalletProvider(),
) {
  const getBalance = createTool({
    id: "get-balance",
    description:
      "Get this agent's wallet balance for a token (defaults to USDC).",
    inputSchema: z.object({
      token: z
        .string()
        .min(1)
        .optional()
        .describe("Token symbol, e.g. USDC or ETH (default USDC)"),
    }),
    outputSchema: z.object({
      symbol: z.string(),
      amount: z.string(),
      mock: z.boolean().optional(),
    }),
    execute: async ({ token }) => {
      return provider.getBalance(token);
    },
  });

  const pay = createTool({
    id: "pay",
    description:
      "Send a payment from this agent's wallet to an address. Use only when payment was explicitly agreed.",
    inputSchema: z.object({
      to: z
        .string()
        .regex(EVM_ADDRESS, "must be a 0x-prefixed EVM address")
        .describe("Recipient EVM address"),
      amount: z
        .string()
        .regex(DECIMAL_AMOUNT, "must be a decimal string, e.g. \"1.50\"")
        .describe("Decimal amount to send"),
      token: z
        .string()
        .min(1)
        .optional()
        .describe("Token symbol (default USDC)"),
    }),
    outputSchema: z.object({
      txHash: z.string(),
      mock: z.boolean().optional(),
    }),
    execute: async ({ to, amount, token }) => {
      return provider.pay({ to, amount, token });
    },
  });

  return { getBalance, pay };
}
