import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import type { SupportedTopic } from "../marketplace/topics.js";

/**
 * Image generation tool — CLEARLY-MARKED MOCK that preserves the routing
 * semantics of the old act-image-generation plugin:
 *
 *   topic suffix contains "dalle"    -> DALL-E 3        (OpenAI images API)
 *   topic suffix contains "ideogram" -> Ideogram V_2    (api.ideogram.ai)
 *   topic suffix contains "mix"      -> all backends, urls joined by "$act$"
 *   otherwise                        -> gpt-image-1     (OpenAI images API)
 *
 * The live implementation (later phase) ports imageHelpers.ts nearly
 * verbatim, reading OPENAI_API_KEY / IDEOGRAM_API_KEY from env and replacing
 * the Bitcino upload endpoint with the ActFlow backend. The `$act$` separator
 * for mixed results is load-bearing downstream — keep it.
 */

export const IMAGE_STYLES = ["gpt", "dalle", "ideogram", "mix"] as const;
export type ImageStyle = (typeof IMAGE_STYLES)[number];

/** Map a marketplace topic (e.g. "img:dalle") to an image backend style. */
export function resolveImageStyleFromTopic(topic: SupportedTopic): ImageStyle {
  const suffix = topic.split(":")[1] ?? "";
  if (suffix.includes("dalle")) return "dalle";
  if (suffix.includes("ideogram")) return "ideogram";
  if (suffix.includes("mix")) return "mix";
  return "gpt";
}

export const MIX_URL_SEPARATOR = "$act$";

export const generateImage = createTool({
  id: "generate-image",
  description:
    "Generate an image from a prompt. Style selects the backend: gpt (gpt-image-1, default), dalle (DALL-E 3), ideogram (Ideogram V2), or mix (all backends combined).",
  inputSchema: z.object({
    prompt: z.string().min(1).describe("Detailed image generation prompt"),
    style: z
      .enum(IMAGE_STYLES)
      .default("gpt")
      .describe("Image backend to use (derived from the task topic suffix)"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    url: z.string(),
    prompt: z.string(),
    style: z.enum(IMAGE_STYLES),
    timestamp: z.string(),
    mock: z.boolean(),
  }),
  execute: async ({ prompt, style }) => {
    // MOCK: no image API keys wired in this phase. The mix style still
    // demonstrates the "$act$"-joined multi-url contract.
    const url =
      style === "mix"
        ? ["https://example.com/mock-dalle.png", "https://example.com/mock-ideogram.png", "https://example.com/mock-gpt.png"].join(
            MIX_URL_SEPARATOR,
          )
        : `https://example.com/mock-${style}.png`;
    return {
      success: true,
      url,
      prompt,
      style,
      timestamp: new Date().toISOString(),
      mock: true,
    };
  },
});

export function createImageTools() {
  return { generateImage };
}
