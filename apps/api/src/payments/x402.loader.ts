/**
 * ESM/CJS interop loader for the x402 + SDK packages.
 *
 * NestJS compiles this API to CommonJS (see apps/api/tsconfig.json: module=commonjs).
 * `@actflow/integrations-x402` is an ESM-only package ("type":"module", exports only the
 * `import` condition), so a normal `import`/`require` from CommonJS fails at runtime
 * ("require() of ES Module ..."). We therefore load it with a genuine dynamic `import()`.
 *
 * TypeScript with module=commonjs would normally DOWNLEVEL `import()` to `require()`, which
 * re-breaks ESM loading. To keep a real, un-transpiled dynamic import we wrap it in
 * `new Function(...)` — the same CJS->ESM interop trick already used elsewhere in the repo
 * (see commit 0aa6bdd web tailwindcss-motion CJS interop). `@actflow/sdk` is CommonJS, so a
 * plain `require()` is correct there.
 *
 * NO hard-coded secrets. All chain/asset/USDC config comes from @actflow/sdk + the x402
 * package's env-driven resolver.
 */

// Preserve a real dynamic import that survives commonjs downleveling.
const dynamicImport: (specifier: string) => Promise<any> = new Function(
  'specifier',
  'return import(specifier)',
) as any;

/** Subset of the x402 package surface the payments module consumes. */
export interface X402Module {
  build402Challenge(params: {
    amount: string;
    recipient: `0x${string}`;
    resource: string;
    asset?: any;
    chainId?: number;
    ttlSeconds?: number;
    amountInBaseUnits?: boolean;
    description?: string;
    now?: number;
    nonce?: `0x${string}`;
    env?: NodeJS.ProcessEnv;
  }): X402PaymentChallenge;

  verifyPayment(
    challenge: X402PaymentChallenge,
    payload: X402PaymentPayload,
    options?: {
      now?: number;
      settler?: unknown;
      waitForReceipt?: (hash: `0x${string}`) => Promise<unknown>;
      env?: NodeJS.ProcessEnv;
      forceMock?: boolean;
    },
  ): Promise<X402PaymentReceipt>;

  resolveX402Config(env?: NodeJS.ProcessEnv): {
    chainId: number;
    rpcUrl: string;
    explorer: string;
    asset: {
      address: `0x${string}`;
      decimals: number;
      domainName: string;
      domainVersion: string;
      symbol: string;
    };
  };
}

/** The 402 challenge descriptor returned by build402Challenge. */
export interface X402PaymentChallenge {
  status: 402;
  scheme: 'eip3009-transferWithAuthorization';
  network: 'evm';
  chainId: number;
  amount: string;
  amountDecimal: string;
  recipient: `0x${string}`;
  asset: {
    address: `0x${string}`;
    decimals: number;
    symbol: string;
    domainName: string;
    domainVersion: string;
  };
  resource: string;
  validBefore: number;
  validAfter: number;
  nonce: `0x${string}`;
  description?: string;
}

/** A signed payment payload the client returns to settle a challenge. */
export interface X402PaymentPayload {
  scheme: 'eip3009-transferWithAuthorization';
  network: 'evm';
  chainId: number;
  asset: `0x${string}`;
  authorization: {
    from: `0x${string}`;
    to: `0x${string}`;
    value: string;
    validAfter: string;
    validBefore: string;
    nonce: `0x${string}`;
  };
  signature: `0x${string}`;
  mock?: boolean;
}

/** Result of verifyPayment. */
export interface X402PaymentReceipt {
  paid: boolean;
  txHash?: string;
  payer?: `0x${string}`;
  mock?: boolean;
  reason?: string;
}

/** The slice of @actflow/sdk we read (Arc testnet chain + USDC token). */
export interface ActflowSdk {
  arcTestnet: { id: number; name: string };
  ARC_TESTNET_USDC: { address: `0x${string}`; decimals: number; symbol: 'USDC' };
  ARC_TESTNET_CHAIN_ID: number;
  ARC_TESTNET_EXPLORER_URL: string;
}

let x402Promise: Promise<X402Module> | undefined;
let sdkCache: ActflowSdk | undefined;

/** Lazily import the ESM x402 package once (cached). */
export function loadX402(): Promise<X402Module> {
  if (!x402Promise) {
    x402Promise = dynamicImport('@actflow/integrations-x402') as Promise<X402Module>;
  }
  return x402Promise;
}

/** Load the CommonJS @actflow/sdk (Arc chain + USDC config). Cached. */
export function loadSdk(): ActflowSdk {
  if (!sdkCache) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    sdkCache = require('@actflow/sdk') as ActflowSdk;
  }
  return sdkCache;
}
