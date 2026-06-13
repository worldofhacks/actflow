/**
 * Deterministic, in-memory MOCK wallet for the Privy provider.
 *
 * Used when Privy creds are absent (or PRIVY_FORCE_MOCK is set) so agents and
 * tests work with NO Privy account and NO funds. Everything it returns is
 * tagged `mock: true` and addresses/hashes are derived deterministically from a
 * label seed — they are NOT real on-chain accounts and hold no value.
 *
 * The "private key" here is derived from a public label via keccak; it controls
 * nothing and is never used to sign a real transaction. It exists only so a
 * deterministic, well-formed EVM address can be produced for local wiring.
 */
import { keccak256, toHex, toBytes } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const MOCK_SEED_DOMAIN = "actflow:mock-privy-wallet:v1:";

/** Derive a deterministic, non-secret pseudo private key from a public label. */
function deriveMockPrivateKey(label: string): `0x${string}` {
  // keccak256 of a fixed domain + label -> 32 bytes -> valid secp256k1 scalar
  // (overwhelmingly within range). This is intentionally derivable from public
  // input: it is a MOCK, it must not be treated as a secret or used live.
  return keccak256(toBytes(MOCK_SEED_DOMAIN + label));
}

export interface MockWalletHandle {
  /** Deterministic 0x address for the label. */
  address: `0x${string}`;
  /** The label the wallet was derived from (e.g. agent id). */
  label: string;
  /** Always true. */
  mock: true;
}

/** Create (deterministically) a mock wallet handle for a label. */
export function createMockWallet(label = "default"): MockWalletHandle {
  const pk = deriveMockPrivateKey(label);
  const account = privateKeyToAccount(pk);
  return { address: account.address, label, mock: true };
}

/**
 * Deterministic fake tx hash for a mock payment, derived from the payment
 * parameters so identical payments are reproducible in tests. Clearly a mock.
 */
export function mockTxHash(
  from: string,
  to: string,
  amount: string,
  token: string,
  nonce: number,
): `0x${string}` {
  return keccak256(
    toHex(`mock-tx:${from}:${to}:${amount}:${token}:${nonce}`),
  );
}
