import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ACTION_TO_TOPICS,
  isSupportedTopic,
  SUPPORTED_TOPICS,
  TOPIC_TO_ACTION,
} from "../marketplace/topics.js";

/**
 * Guard test: topic strings are bytes32-registered ON-CHAIN. Any rename or
 * reorder silently breaks task assignment — this test pins the exact values
 * carried over from the original Eliza runtime.
 */
test("SUPPORTED_TOPICS matches the on-chain registered strings exactly", () => {
  assert.deepEqual(
    [...SUPPORTED_TOPICS],
    [
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
    ],
  );
});

test("TOPIC_TO_ACTION maps every topic to the original action family", () => {
  assert.equal(TOPIC_TO_ACTION["x:tweet"], "ACT_SOCIAL_POST_TWEET");
  assert.equal(TOPIC_TO_ACTION["x:mix_img"], "ACT_SOCIAL_POST_TWEET");
  assert.equal(TOPIC_TO_ACTION["img:dalle"], "ACT_GENERATE_IMAGE");
  assert.equal(TOPIC_TO_ACTION["img:mix"], "ACT_GENERATE_IMAGE");
  assert.equal(TOPIC_TO_ACTION["video:video"], "ACT_GENERATE_VIDEO");
  assert.equal(TOPIC_TO_ACTION["blog:basic"], "ACT_GENERATE_BLOG");
  assert.equal(TOPIC_TO_ACTION["blog:bitcino_news"], "ACT_GENERATE_BLOG");
  // every topic has a mapping
  for (const topic of SUPPORTED_TOPICS) {
    assert.ok(TOPIC_TO_ACTION[topic], `no action for ${topic}`);
  }
});

test("ACTION_TO_TOPICS is the exact reverse of TOPIC_TO_ACTION", () => {
  assert.deepEqual(ACTION_TO_TOPICS.ACT_GENERATE_IMAGE, [
    "img:img",
    "img:ideogram",
    "img:dalle",
    "img:mix",
  ]);
  assert.equal(ACTION_TO_TOPICS.ACT_SOCIAL_POST_TWEET.length, 10);
  assert.deepEqual(ACTION_TO_TOPICS.ACT_GENERATE_VIDEO, ["video:video"]);
  assert.equal(ACTION_TO_TOPICS.ACT_GENERATE_BLOG.length, 4);
});

test("isSupportedTopic narrows correctly", () => {
  assert.equal(isSupportedTopic("img:dalle"), true);
  assert.equal(isSupportedTopic("img:DALLE"), false);
  assert.equal(isSupportedTopic("not-a-topic"), false);
});
