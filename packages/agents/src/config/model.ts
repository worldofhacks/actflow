/**
 * Model configuration for ActFlow agents.
 *
 * Mastra's model router takes a `provider/model-name` string. The provider API
 * key is read from the environment AT CALL TIME (not at Agent construction),
 * so the package builds and unit-tests without any key — see the Mastra skill:
 * "the provider API key env var must be set or calls fail at runtime, not at
 * construction".
 *
 * Live LLM calls anywhere in this package MUST be guarded with
 * `hasModelProviderKey()` (or `assertModelProviderKey()` for a hard failure).
 */

/** Default model — Claude Opus 4.8 via the Anthropic provider. */
export const DEFAULT_MODEL = "anthropic/claude-opus-4-8";

/** Env var holding the Anthropic API key (read by Mastra's model router). */
export const MODEL_PROVIDER_KEY_ENV = "ANTHROPIC_API_KEY";

/** Optional env override for the default model string. */
export const MODEL_OVERRIDE_ENV = "ACTFLOW_AGENT_MODEL";

/**
 * Resolve the model string for an agent:
 * explicit per-agent override > ACTFLOW_AGENT_MODEL env > DEFAULT_MODEL.
 */
export function resolveModel(override?: string): string {
  return override ?? process.env[MODEL_OVERRIDE_ENV] ?? DEFAULT_MODEL;
}

/** True when a model-provider key is present and live LLM calls may be made. */
export function hasModelProviderKey(): boolean {
  return Boolean(process.env[MODEL_PROVIDER_KEY_ENV]);
}

/** Throw a descriptive error when live LLM calls are attempted without a key. */
export function assertModelProviderKey(): void {
  if (!hasModelProviderKey()) {
    throw new Error(
      `Missing ${MODEL_PROVIDER_KEY_ENV}. Live agent calls are disabled — ` +
        "set the provider key in the environment (see .env.example) before " +
        "calling agent.generate()/stream().",
    );
  }
}
