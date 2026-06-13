/**
 * Name processing helpers (ENSIP-15 normalize + ENSIP-1 namehash).
 *
 * Per the ens-agents SKILL "Name processing" + "Gotchas": ALWAYS normalize
 * (ENSIP-15) before namehash() — otherwise confusable/zero-width names hash to
 * different nodes. We delegate hashing to viem so the algorithm matches ENS.
 */
import { namehash, normalize, labelhash, packetToBytes } from "viem/ens";
import { toHex, keccak256, encodePacked, type Hex } from "viem";

/** Root node — all-zero bytes32 (SKILL: "Root node = 0x000...0"). */
export const ROOT_NODE =
  "0x0000000000000000000000000000000000000000000000000000000000000000" as const;

/** Normalize a name with ENSIP-15 (must run before any hashing). */
export function normalizeName(name: string): string {
  return normalize(name);
}

/** Namehash of a full name (normalizes first). */
export function nameToNode(name: string): Hex {
  return namehash(normalize(name));
}

/** keccak-256 labelhash of a single label (normalizes the label first). */
export function labelToHash(label: string): Hex {
  return labelhash(normalize(label));
}

/**
 * Compute the child node for `<label>.<parent>` from the PARENT node + label,
 * exactly as the Name Wrapper / registry do on-chain:
 *   node = keccak256(parentNode . keccak256(label))
 * This is the canonical subname derivation used when minting a subname under a
 * parent whose node we already have.
 */
export function subnameNode(parentNode: Hex, label: string): Hex {
  const labelHash = labelhash(normalize(label));
  return keccak256(
    encodePacked(["bytes32", "bytes32"], [parentNode, labelHash]),
  );
}

/** Convenience: node of `<label>.<parentName>` from the parent NAME. */
export function subnameNodeFromParentName(
  parentName: string,
  label: string,
): Hex {
  return subnameNode(nameToNode(parentName), label);
}

/** Full normalized subname string `<label>.<parent>`. */
export function subnameString(parentName: string, label: string): string {
  return `${normalize(label)}.${normalize(parentName)}`;
}

/** DNS wire-format encoding of a name (hex), per SKILL packetToBytes example. */
export function dnsEncodeName(name: string): Hex {
  return toHex(packetToBytes(normalize(name)));
}
