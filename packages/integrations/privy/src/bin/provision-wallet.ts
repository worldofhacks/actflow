#!/usr/bin/env node
/**
 * actflow-privy-wallet — Privy Agent Wallet CLI.
 *
 * Provisions (creates or fetches) an agent's Privy server wallet and prints its
 * address. In LIVE mode (PRIVY_APP_ID + PRIVY_APP_SECRET present) it hits Privy;
 * in MOCK mode it derives a deterministic in-memory address tagged mock:true so
 * the CLI works with no Privy account or funds.
 *
 * Usage:
 *   actflow-privy-wallet [--label <agent-label>] [--json]
 *
 * No secrets are printed. Output is the wallet address (and id in live mode).
 */
import { createPrivyWalletProvider } from "../provider.js";
import { resolvePrivyConfig } from "../config.js";

interface Args {
  label?: string;
  json: boolean;
  help: boolean;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { json: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--label") out.label = argv[++i];
    else if (a === "--json") out.json = true;
    else if (a === "-h" || a === "--help") out.help = true;
  }
  return out;
}

const HELP = `actflow-privy-wallet — provision an ActFlow agent Privy server wallet.

Usage:
  actflow-privy-wallet [--label <agent-label>] [--json]

Modes:
  live  PRIVY_APP_ID + PRIVY_APP_SECRET set  -> creates/fetches a Privy wallet
  mock  creds absent / PRIVY_FORCE_MOCK=1    -> deterministic in-memory address (mock:true)

Env: PRIVY_APP_ID, PRIVY_APP_SECRET, PRIVY_AUTHORIZATION_KEY (optional),
     PRIVY_WALLET_ID (optional, reuse), ARC_TESTNET_RPC_URL, ARC_CHAIN_ID,
     ARC_USDC_ADDRESS, PRIVY_FORCE_MOCK.
`;

export async function main(argv = process.argv.slice(2)): Promise<number> {
  const args = parseArgs(argv);
  if (args.help) {
    process.stdout.write(HELP);
    return 0;
  }

  const cfg = resolvePrivyConfig();
  const provider = createPrivyWalletProvider({ label: args.label });

  try {
    const address = await provider.getAddress();
    const result = {
      mode: cfg.mode,
      label: args.label ?? "actflow-agent",
      address,
      chainId: cfg.chain.chainId,
      ...(cfg.mode === "mock" ? { mock: true as const } : {}),
    };
    if (args.json) {
      process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    } else {
      process.stdout.write(
        `mode:    ${result.mode}${result.mode === "mock" ? " (mock:true — not a real on-chain wallet)" : ""}\n` +
          `label:   ${result.label}\n` +
          `address: ${result.address}\n` +
          `chainId: ${result.chainId}\n`,
      );
    }
    return 0;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`actflow-privy-wallet: ${msg}\n`);
    return 1;
  }
}

// Run only when invoked directly (not when imported by a test).
const invokedDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === `file://${process.argv[1]}`;
if (invokedDirectly) {
  main().then((code) => process.exit(code));
}
