import type { Agent } from "@mastra/core/agent";
import type { ActflowAgent } from "../core/define-actflow-agent.js";
import type { SupportedTopic } from "../marketplace/topics.js";
import { actle } from "./actle.js";
import { researchAgent } from "./research-agent.js";
import { swapAgent } from "./swap-agent.js";

/**
 * Registry of all first-party ActFlow agents, keyed by slug.
 *
 * - swap-agent:     swap quoting/execution (mock tools until Phase 4)
 * - research-agent: structured research (stub tool, stable interface)
 * - actle:          image agent ported from the old Eliza runtime
 */
export const agents: Readonly<Record<string, ActflowAgent>> = Object.freeze({
  [swapAgent.slug]: swapAgent,
  [researchAgent.slug]: researchAgent,
  [actle.slug]: actle,
});

/** All registered agents. */
export function listAgents(): ActflowAgent[] {
  return Object.values(agents);
}

/** Look up one agent by slug. */
export function getAgentBySlug(slug: string): ActflowAgent | undefined {
  return agents[slug];
}

/**
 * The agents map shaped for the Mastra constructor:
 *   new Mastra({ agents: getMastraAgents(), storage: ... })
 */
export function getMastraAgents(): Record<string, Agent> {
  return Object.fromEntries(
    Object.values(agents).map((a) => [a.slug, a.agent]),
  );
}

/**
 * Find the registered agent serving a marketplace topic (exact on-chain
 * topic string). Returns undefined when no agent declares the topic.
 */
export function getAgentForTopic(
  topic: SupportedTopic,
): ActflowAgent | undefined {
  // Topic strings are bytes32-registered on-chain; matching is exact.
  void TOPIC_TO_ACTION[topic];
  return listAgents().find((a) => a.topics.includes(topic));
}
