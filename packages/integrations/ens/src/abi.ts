/**
 * ABIs — signatures copied VERBATIM from the ens-agents SKILL, which took them
 * from the official ENS docs (https://docs.ens.domains/wrapper/contracts,
 * /resolvers/interacting). Do not edit signatures without re-checking the docs.
 */
import { parseAbi } from "viem";

/** Name Wrapper — subname minting (SKILL: /wrapper/contracts). */
export const nameWrapperAbi = parseAbi([
  "function setSubnodeRecord(bytes32 parentNode, string label, address owner, address resolver, uint64 ttl, uint32 fuses, uint64 expiry) returns (bytes32)",
  "function setSubnodeOwner(bytes32 parentNode, string label, address owner, uint32 fuses, uint64 expiry) returns (bytes32)",
  "function ownerOf(uint256 id) view returns (address)",
]);

/** Public Resolver — text records (SKILL: /resolvers/interacting + ENSIP-5). */
export const resolverAbi = parseAbi([
  "function setText(bytes32 node, string key, string value)",
  "function text(bytes32 node, string key) view returns (string)",
  "function addr(bytes32 node) view returns (address)",
  // EIP-165 — SKILL: check supportsInterface before writing.
  "function supportsInterface(bytes4 interfaceID) view returns (bool)",
]);

/** ENS Registry — resolver lookup for a node (for READS, per SKILL gotcha). */
export const registryAbi = parseAbi([
  "function resolver(bytes32 node) view returns (address)",
  "function owner(bytes32 node) view returns (address)",
]);
