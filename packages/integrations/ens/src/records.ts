/**
 * Agent text-record encoding / decoding — the pure, unit-testable core.
 *
 * Maps an {@link AgentProfile} <-> ENS text-record key/value pairs and back.
 *
 * SPEC PROVENANCE (from the ens-agents SKILL — follow EXACTLY):
 *  - ENSIP-26 (https://docs.ens.domains/ensip/26/): keys `agent-context` and
 *    `agent-endpoint[<protocol>]` (protocols: mcp, a2a, web). VERIFIED in skill.
 *  - ENSIP-25 (https://docs.ens.domains/ensip/25/): key
 *    `agent-registration[<registry>][<agentId>]`, value any non-empty string
 *    (use "1"). <registry> is an ERC-7930 interoperable address, NOT the bare
 *    20-byte address. VERIFIED in skill.
 *  - Common ENSIP-5 keys `description`, `url`, `avatar` (https://docs.ens.domains/web/records).
 *    VERIFIED in skill.
 *
 * UNVERIFIED (NOT defined by ENSIP-25/26 or any fetched ENS doc): there is no
 * standard ENS text-record key for an agent's capabilities/topics, an x402
 * support flag, or pricing. The skill does not provide these keys. So we DO NOT
 * invent spec keys — we expose them as CONFIGURABLE constants (overridable via
 * env) using ENS's documented collision-avoiding custom-key convention
 * ("use collision-avoiding prefixes", /web/records). Defaults below are marked
 * UNVERIFIED and carry a TODO; an operator can override before relying on them.
 */

/** ENSIP-26 endpoint protocols named in the skill. */
export type AgentEndpointProtocol = "mcp" | "a2a" | "web";
export const AGENT_ENDPOINT_PROTOCOLS: readonly AgentEndpointProtocol[] = [
  "mcp",
  "a2a",
  "web",
];

/**
 * VERIFIED record keys (from the skill / ENS docs). Fixed by spec — do NOT
 * make these env-configurable, the spec pins them.
 */
export const VERIFIED_KEYS = {
  /** ENSIP-26 — free-form agent description / interaction context. */
  agentContext: "agent-context",
  /** ENSIP-5 common keys (https://docs.ens.domains/web/records). */
  description: "description",
  url: "url",
  avatar: "avatar",
} as const;

/** ENSIP-26 endpoint key for a protocol: `agent-endpoint[<protocol>]`. */
export function agentEndpointKey(protocol: string): string {
  return `agent-endpoint[${protocol}]`;
}

/**
 * ENSIP-25 registration key: `agent-registration[<registry>][<agentId>]`.
 * @param registry ERC-7930 interoperable address (hex, 0x). NOT the bare addr.
 * @param agentId  registry-defined id; MUST NOT contain `[` or `]`.
 */
export function agentRegistrationKey(registry: string, agentId: string): string {
  if (agentId.includes("[") || agentId.includes("]")) {
    throw new Error(
      `ENSIP-25 agentId must not contain '[' or ']' — got "${agentId}".`,
    );
  }
  return `agent-registration[${registry}][${agentId}]`;
}

/** Parse an ENSIP-25 registration key back into { registry, agentId }. */
export function parseAgentRegistrationKey(
  key: string,
): { registry: string; agentId: string } | null {
  const m = /^agent-registration\[([^\]]+)\]\[([^\]]+)\]$/.exec(key);
  if (!m) return null;
  return { registry: m[1], agentId: m[2] };
}

/**
 * UNVERIFIED custom keys — NOT in any ENS spec. Defaults follow ENS's
 * collision-avoiding custom-key guidance. Override the strings via env when the
 * real keys are decided.
 *
 * TODO(ens-spec): no ENSIP defines agent capabilities / x402 / pricing text
 * records. Confirm the canonical keys (or a JSON payload inside `agent-context`)
 * before treating these as interoperable. They are config-driven on purpose.
 */
export interface UnverifiedKeyConfig {
  /** comma-or-JSON list of capabilities/topics the agent serves. */
  capabilities: string;
  /** boolean-ish flag: agent accepts x402 (USDC) payments. */
  x402: string;
  /** free-form pricing descriptor. */
  pricing: string;
}

export const DEFAULT_UNVERIFIED_KEYS: UnverifiedKeyConfig = {
  // collision-avoiding prefix `actflow.` per /web/records custom-key guidance.
  capabilities: "actflow.capabilities", // UNVERIFIED — no ENSIP key
  x402: "actflow.x402", // UNVERIFIED — no ENSIP key
  pricing: "actflow.pricing", // UNVERIFIED — no ENSIP key
};

/** Resolve the UNVERIFIED custom keys, allowing env overrides. */
export function resolveUnverifiedKeys(
  env: NodeJS.ProcessEnv = process.env,
): UnverifiedKeyConfig {
  return {
    capabilities: env.ENS_KEY_CAPABILITIES?.trim() || DEFAULT_UNVERIFIED_KEYS.capabilities,
    x402: env.ENS_KEY_X402?.trim() || DEFAULT_UNVERIFIED_KEYS.x402,
    pricing: env.ENS_KEY_PRICING?.trim() || DEFAULT_UNVERIFIED_KEYS.pricing,
  };
}

/** ENSIP-25 attestation binding the name to an ERC-8004 registry entry. */
export interface AgentRegistration {
  /** ERC-7930 interoperable address of the registry (NOT bare 20-byte addr). */
  registry: string;
  /** registry-defined agent id (ERC-8004 id). */
  agentId: string;
  /** value written — any non-empty string passes; defaults to "1". */
  value?: string;
}

/** Typed agent profile — the marketplace's view of an agent's ENS identity. */
export interface AgentProfile {
  /** ENSIP-26 agent-context (free-form description / interaction info). */
  context?: string;
  /** ENSIP-5 `description`. */
  description?: string;
  /** ENSIP-5 `url` (human web page). */
  url?: string;
  /** ENSIP-5 `avatar`. */
  avatar?: string;
  /** ENSIP-26 agent-endpoint[<protocol>] map (mcp/a2a/web/…). */
  endpoints?: Partial<Record<string, string>>;
  /** ENSIP-25 registration attestation. */
  registration?: AgentRegistration;
  /** UNVERIFIED — capabilities/topics list. */
  capabilities?: string[];
  /** UNVERIFIED — accepts x402 USDC payments. */
  x402?: boolean;
  /** UNVERIFIED — pricing descriptor. */
  pricing?: string;
}

export interface EncodeOptions {
  /** Override the UNVERIFIED custom keys (else read from env/defaults). */
  unverifiedKeys?: UnverifiedKeyConfig;
}

/**
 * Encode an AgentProfile to ordered [key, value] text-record pairs.
 * Pure function — no I/O. Only includes keys that are present.
 */
export function encodeAgentRecords(
  profile: AgentProfile,
  options: EncodeOptions = {},
): Array<[string, string]> {
  const keys = options.unverifiedKeys ?? resolveUnverifiedKeys();
  const out: Array<[string, string]> = [];

  if (profile.context !== undefined)
    out.push([VERIFIED_KEYS.agentContext, profile.context]);
  if (profile.description !== undefined)
    out.push([VERIFIED_KEYS.description, profile.description]);
  if (profile.url !== undefined) out.push([VERIFIED_KEYS.url, profile.url]);
  if (profile.avatar !== undefined)
    out.push([VERIFIED_KEYS.avatar, profile.avatar]);

  if (profile.endpoints) {
    for (const protocol of Object.keys(profile.endpoints).sort()) {
      const value = profile.endpoints[protocol];
      if (value !== undefined)
        out.push([agentEndpointKey(protocol), value]);
    }
  }

  if (profile.registration) {
    const { registry, agentId, value } = profile.registration;
    out.push([
      agentRegistrationKey(registry, agentId),
      value && value.length > 0 ? value : "1", // ENSIP-25: any non-empty; use "1"
    ]);
  }

  // UNVERIFIED custom keys
  if (profile.capabilities !== undefined)
    out.push([keys.capabilities, profile.capabilities.join(",")]);
  if (profile.x402 !== undefined)
    out.push([keys.x402, profile.x402 ? "true" : "false"]);
  if (profile.pricing !== undefined)
    out.push([keys.pricing, profile.pricing]);

  return out;
}

/**
 * Decode ordered/keyed text-record pairs back into an AgentProfile.
 * Inverse of {@link encodeAgentRecords}. Pure function.
 * Empty-string values are treated as "record not set" and skipped (ENS `text`
 * returns "" for unset keys).
 */
export function decodeAgentRecords(
  records: Iterable<[string, string]>,
  options: EncodeOptions = {},
): AgentProfile {
  const keys = options.unverifiedKeys ?? resolveUnverifiedKeys();
  const profile: AgentProfile = {};

  for (const [key, rawValue] of records) {
    if (rawValue === "" || rawValue === undefined) continue;
    const value = rawValue;

    switch (key) {
      case VERIFIED_KEYS.agentContext:
        profile.context = value;
        continue;
      case VERIFIED_KEYS.description:
        profile.description = value;
        continue;
      case VERIFIED_KEYS.url:
        profile.url = value;
        continue;
      case VERIFIED_KEYS.avatar:
        profile.avatar = value;
        continue;
    }

    if (key === keys.capabilities) {
      profile.capabilities = value
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      continue;
    }
    if (key === keys.x402) {
      profile.x402 = value.trim().toLowerCase() === "true";
      continue;
    }
    if (key === keys.pricing) {
      profile.pricing = value;
      continue;
    }

    const endpointMatch = /^agent-endpoint\[([^\]]+)\]$/.exec(key);
    if (endpointMatch) {
      profile.endpoints ??= {};
      profile.endpoints[endpointMatch[1]] = value;
      continue;
    }

    const reg = parseAgentRegistrationKey(key);
    if (reg) {
      profile.registration = {
        registry: reg.registry,
        agentId: reg.agentId,
        value,
      };
      continue;
    }
    // unknown key — ignore (forward-compatible).
  }

  return profile;
}

/**
 * The full set of record keys for a profile — used by resolveAgent to know
 * which `text()` reads to issue. (ENS has no "list all keys" call, so a reader
 * must enumerate keys it cares about.)
 */
export function recordKeysForProfile(
  profile: AgentProfile,
  options: EncodeOptions = {},
): string[] {
  return encodeAgentRecords(profile, options).map(([k]) => k);
}
