/**
 * Canonical marketplace topic strings.
 *
 * CRITICAL: these strings are hashed to bytes32 and registered ON-CHAIN for
 * agent topic assignment (the contract stores e.g. keccak/bytes32 of
 * "img:dalle"). They are carried over verbatim from the original Eliza
 * runtime (marketplace-plugin/src/types/ITopicHandler.ts). Renaming ANY of
 * them silently breaks task assignment — do not "clean up" these values.
 *
 * Note: the `blog:bitcino*` topics remain registered on-chain; only the
 * Bitcino publish endpoints are replaced by the ActFlow backend in the new
 * runtime.
 */
export const SUPPORTED_TOPICS = [
  "x:tweet",
  "x:news",
  "x:news_img",
  "x:news_video",
  "x:thread",
  "x:thread_img",
  "x:thread_video",
  "x:img",
  "x:video",
  "x:mix_img",
  "img:img",
  "img:ideogram",
  "img:dalle",
  "img:mix",
  "video:video",
  "blog:basic",
  "blog:news",
  "blog:bitcino",
  "blog:bitcino_news",
] as const;

export type SupportedTopic = (typeof SUPPORTED_TOPICS)[number];

/** Logical action families an agent can implement. */
export const MARKETPLACE_ACTIONS = [
  "ACT_SOCIAL_POST_TWEET",
  "ACT_GENERATE_IMAGE",
  "ACT_GENERATE_VIDEO",
  "ACT_GENERATE_BLOG",
] as const;

export type MarketplaceAction = (typeof MARKETPLACE_ACTIONS)[number];

/**
 * Topic -> action map (must match the on-chain topic registration semantics
 * from the old runtime exactly).
 */
export const TOPIC_TO_ACTION: Record<SupportedTopic, MarketplaceAction> = {
  "x:tweet": "ACT_SOCIAL_POST_TWEET",
  "x:news": "ACT_SOCIAL_POST_TWEET",
  "x:news_img": "ACT_SOCIAL_POST_TWEET",
  "x:news_video": "ACT_SOCIAL_POST_TWEET",
  "x:thread": "ACT_SOCIAL_POST_TWEET",
  "x:thread_img": "ACT_SOCIAL_POST_TWEET",
  "x:thread_video": "ACT_SOCIAL_POST_TWEET",
  "x:img": "ACT_SOCIAL_POST_TWEET",
  "x:video": "ACT_SOCIAL_POST_TWEET",
  "x:mix_img": "ACT_SOCIAL_POST_TWEET",
  "img:img": "ACT_GENERATE_IMAGE",
  "img:ideogram": "ACT_GENERATE_IMAGE",
  "img:dalle": "ACT_GENERATE_IMAGE",
  "img:mix": "ACT_GENERATE_IMAGE",
  "video:video": "ACT_GENERATE_VIDEO",
  "blog:basic": "ACT_GENERATE_BLOG",
  "blog:news": "ACT_GENERATE_BLOG",
  "blog:bitcino": "ACT_GENERATE_BLOG",
  "blog:bitcino_news": "ACT_GENERATE_BLOG",
};

/** Reverse map: action family -> topics it serves. */
export const ACTION_TO_TOPICS: Record<MarketplaceAction, SupportedTopic[]> =
  SUPPORTED_TOPICS.reduce(
    (acc, topic) => {
      acc[TOPIC_TO_ACTION[topic]].push(topic);
      return acc;
    },
    {
      ACT_SOCIAL_POST_TWEET: [],
      ACT_GENERATE_IMAGE: [],
      ACT_GENERATE_VIDEO: [],
      ACT_GENERATE_BLOG: [],
    } as Record<MarketplaceAction, SupportedTopic[]>,
  );

export function isSupportedTopic(value: string): value is SupportedTopic {
  return (SUPPORTED_TOPICS as readonly string[]).includes(value);
}
