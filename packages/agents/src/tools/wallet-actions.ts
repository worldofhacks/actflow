import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  type IWalletProvider,
  MockWalletProvider,
} from "../interfaces/wallet-provider.js";
// Runtime-only value import. `signPaymentAuthorization` is referenced solely
// inside the payX402 execute body, so x402's *types* never leak into this
// package's emitted .d.ts — which is what keeps @actflow/integrations-x402 able
// to build against @actflow/agents without pulling its own declarations back in
// (the packages have a workspace dependency in both directions). See the local
// X402Challenge/X402Payload structural types below, used for the tool schemas.
import { signPaymentAuthorization } from "@actflow/integrations-x402";

const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/;
const DECIMAL_AMOUNT = /^\d+(\.\d+)?$/;

/**
 * Minimal STRUCTURAL mirror of the x402 PaymentChallenge — only what the tool
 * schema needs. Defined locally (not imported from @actflow/integrations-x402)
 * so x402's named types never appear in this package's public declarations,
 * avoiding a declaration-level dependency cycle. signPaymentAuthorization
 * accepts the full challenge at runtime; this is structurally compatible.
 */
interface X402Challenge {
  scheme: string;
  [key: string]: unknown;
}

/** Structural mirror of the x402 signed PaymentPayload (carried through as-is). */
interface X402Payload {
  scheme: string;
  signature: string;
  /** Always true for mock payloads — never a real, settled payment. */
  mock?: boolean;
  [key: string]: unknown;
}

/**
 * Wallet tools (getBalance / pay / payX402) over an injected IWalletProvider.
 *
 * The default provider is the clearly-marked MockWalletProvider (no keys, no
 * signing). Pass a real provider — e.g. PrivyWalletProvider from
 * `@actflow/integrations-privy` — to make the tools call a live wallet:
 *
 *   import { createPrivyWalletProvider } from "@actflow/integrations-privy";
 *   const tools = createWalletTools(createPrivyWalletProvider());
 *
 * PrivyWalletProvider implements IWalletProvider structurally; when Privy creds
 * are absent it runs in its own labeled MOCK mode (mock:true on every result),
 * so build + tests pass with no funds or creds. We NEVER fabricate a balance or
 * tx hash here: every value comes straight from the provider, and the provider's
 * `mock` flag is carried through unchanged to the tool output / UI.
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
      address: z.string().optional(),
      mock: z.boolean().optional(),
    }),
    execute: async ({ token }) => {
      const [balance, address] = await Promise.all([
        provider.getBalance(token),
        provider.getAddress().catch(() => undefined),
      ]);
      // Carry the provider's mock flag through verbatim — never invented here.
      return { ...balance, address };
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
      // Delegate straight to the injected provider. In mock mode the result is
      // tagged mock:true by the provider and surfaced unchanged.
      return provider.pay({ to, amount, token });
    },
  });

  /**
   * Pay an x402 challenge: sign the EIP-3009 transferWithAuthorization for a 402
   * descriptor with this agent's wallet and return the signed payload (the
   * `X-PAYMENT` body the resource server verifies + settles). The wallet
   * provider acts as the payment signer; with a non-signing wallet (e.g. the
   * mock provider, or Privy in mock mode) a clearly-labeled mock payload is
   * returned (mock:true) — never presented as a settled payment.
   *
   * NOTE: this signs an off-chain authorization only — it never settles on-chain
   * itself, and never invents a tx hash.
   */
  const payX402 = createTool({
    id: "pay-x402",
    description:
      "Pay an x402 (HTTP 402) payment challenge from this agent's wallet by signing the EIP-3009 USDC authorization. Returns the signed X-PAYMENT payload for the resource server to verify and settle. Use only when payment for a resource was explicitly agreed.",
    inputSchema: z.object({
      challenge: z
        .custom<X402Challenge>(
          (v) =>
            !!v &&
            typeof v === "object" &&
            (v as X402Challenge).scheme ===
              "eip3009-transferWithAuthorization",
          "must be a 402 challenge from build402Challenge()",
        )
        .describe("The 402 PaymentRequired descriptor to pay"),
    }),
    outputSchema: z.object({
      paid: z.boolean(),
      mock: z.boolean().optional(),
      reason: z.string().optional(),
      // The signed EIP-3009 payload (X-PAYMENT body). Passed straight through.
      payload: z.custom<X402Payload>().optional(),
    }),
    execute: async ({ challenge }) => {
      try {
        // The wallet provider is the signer. signPaymentAuthorization detects a
        // typed-data signer (live) vs. a plain IWalletProvider (mock) and tags
        // mock payloads mock:true. No funds move here — this only signs.
        // The challenge is structurally the x402 PaymentChallenge; cast at the
        // call boundary (the runtime function validates the scheme itself).
        const payload = (await signPaymentAuthorization(
          provider,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          challenge as any,
        )) as unknown as X402Payload;
        return {
          paid: true,
          mock: payload.mock === true ? true : undefined,
          payload,
        };
      } catch (err) {
        return {
          paid: false,
          reason: err instanceof Error ? err.message : String(err),
        };
      }
    },
  });

  return { getBalance, pay, payX402 };
}
