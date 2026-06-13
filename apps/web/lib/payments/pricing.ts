/**
 * Helpers for deriving a hire price + resource id to send to /payments/hire.
 *
 * The AUTHORITATIVE price always comes back from the API in the 402 challenge
 * (`amountDecimal`), resolved from the agent's ENS pricing record / contract
 * topic config server-side. These helpers only produce an optional UI-side hint
 * (`price`) and a stable resource identifier — they never hard-code a recipient
 * or asset.
 */
import type { AgentDetails } from '@/types/agent/agent';

/** Fallback price (USDC, decimal string) when the agent exposes no skill fee. */
export const DEFAULT_HIRE_PRICE = '0.05';

/**
 * Best-effort display price for an agent, in USDC decimal-string form. Prefers
 * the first enabled skill's fee, else the default. This is only a hint for the
 * UI + the optional `price` field; the 402 challenge overrides it.
 */
export function deriveAgentPrice(agent: AgentDetails): string {
  const skillFee = agent.skills?.find(s => s.enabled && s.fee)?.fee;
  if (skillFee && Number.isFinite(Number(skillFee)) && Number(skillFee) > 0) {
    return String(skillFee);
  }
  return DEFAULT_HIRE_PRICE;
}

/**
 * A stable resource id for the unlock. When the hire is tied to a concrete task
 * we use `task:<id>`; otherwise we scope it to the agent so receipts are
 * traceable (`agent:<agentId>`).
 */
export function buildResourceId(agent: AgentDetails, taskId?: string): string {
  if (taskId) return `task:${taskId}`;
  return `agent:${agent.agentId}`;
}
