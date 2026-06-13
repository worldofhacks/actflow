/**
 * @actflow/integrations-ens — ENS identity for ActFlow agents.
 *
 * viem-based: subname minting (Name Wrapper), ENSIP-25 registry attestation +
 * ENSIP-26 agent text records, forward/reverse resolution. NO hard-coded ENS
 * names, contract addresses, or chain IDs — everything comes from env/config.
 */

// config
export {
  loadEnsConfig,
  requireParentName,
  addressOverrideEnv,
  ENV,
  type EnsConfig,
  type EnsNetwork,
  type EnsAddresses,
} from "./config.js";

// name processing
export {
  ROOT_NODE,
  normalizeName,
  nameToNode,
  labelToHash,
  subnameNode,
  subnameNodeFromParentName,
  subnameString,
  dnsEncodeName,
} from "./namehash.js";

// pure record encode/decode (unit-testable core)
export {
  encodeAgentRecords,
  decodeAgentRecords,
  recordKeysForProfile,
  agentEndpointKey,
  agentRegistrationKey,
  parseAgentRegistrationKey,
  resolveUnverifiedKeys,
  AGENT_ENDPOINT_PROTOCOLS,
  VERIFIED_KEYS,
  DEFAULT_UNVERIFIED_KEYS,
  type AgentProfile,
  type AgentRegistration,
  type AgentEndpointProtocol,
  type UnverifiedKeyConfig,
  type EncodeOptions,
} from "./records.js";

// on-chain operations
export {
  createEnsPublicClient,
  mintSubname,
  setAgentRecords,
  resolveAgent,
  readAgentText,
  reverseResolve,
  type MintSubnameParams,
  type MintSubnameResult,
  type SetAgentRecordsParams,
  type SetAgentRecordsResult,
  type ResolvedAgent,
  type ResolveAgentOptions,
  type ReverseResolveResult,
} from "./client.js";

// ABIs (verbatim from the skill / ENS docs)
export { nameWrapperAbi, resolverAbi, registryAbi } from "./abi.js";
