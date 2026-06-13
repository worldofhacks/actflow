import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  decodeFeedbackValue,
  recencyWeight,
  deriveX402,
  buildSparkline,
  computeBreakdown,
  compositeScore,
  rankAgents,
} from '../scoring/scoring.js';
import type {
  ActivityRow,
  FeedbackRow,
  RevokedFeedbackRow,
  ValidationRow,
} from '../types.js';

const DAY = 86_400_000;
const NOW = Date.parse('2026-06-13T00:00:00Z');

function fb(partial: Partial<FeedbackRow>): FeedbackRow {
  return {
    agent_id: 1,
    client_address: '0xclient',
    feedback_index: 0,
    value_hex: '0x',
    value_raw: 50,
    value_decimals: 1,
    block_timestamp: '2026-06-13T00:00:00Z',
    transaction_hash: '0xtx',
    ...partial,
  };
}

test('decodeFeedbackValue divides by 10**decimals', () => {
  assert.equal(decodeFeedbackValue({ value_raw: 50, value_decimals: 1 }), 5);
  assert.equal(decodeFeedbackValue({ value_raw: 45, value_decimals: 1 }), 4.5);
  assert.equal(decodeFeedbackValue({ value_raw: 7, value_decimals: 0 }), 7);
  assert.equal(decodeFeedbackValue({ value_raw: 1234, value_decimals: 2 }), 12.34);
});

test('recencyWeight: ~1 today, 0.5 at half-life, decays further', () => {
  const halfLife = 30;
  assert.ok(Math.abs(recencyWeight(NOW, NOW, halfLife) - 1) < 1e-9);
  const halfLifeAgo = NOW - 30 * DAY;
  assert.ok(Math.abs(recencyWeight(halfLifeAgo, NOW, halfLife) - 0.5) < 1e-9);
  const twoHalfLives = NOW - 60 * DAY;
  assert.ok(Math.abs(recencyWeight(twoHalfLives, NOW, halfLife) - 0.25) < 1e-9);
});

test('recencyWeight: future timestamp clamps age to 0 (weight 1)', () => {
  const future = NOW + 10 * DAY;
  assert.equal(recencyWeight(future, NOW, 30), 1);
});

test('recencyWeight: non-positive half-life returns 1 (no weighting)', () => {
  assert.equal(recencyWeight(NOW - 100 * DAY, NOW, 0), 1);
});

test('deriveX402 detects x402 in agent_uri (case-insensitive) and metadata', () => {
  assert.equal(deriveX402({ agent_uri: 'https://a/reg.json#x402' }), true);
  assert.equal(deriveX402({ agent_uri: 'https://a/reg.json?p=X402' }), true);
  assert.equal(deriveX402({ agent_uri: 'https://a/reg.json' }), false);
  assert.equal(deriveX402(undefined), false);
  assert.equal(deriveX402({ agent_uri: null }, ['supports:x402']), true);
});

test('buildSparkline places counts in oldest->newest day slots', () => {
  const activity: ActivityRow[] = [
    { agent_id: 1, day: '2026-06-13', feedback_count: 2 }, // today -> last slot
    { agent_id: 1, day: '2026-06-12', feedback_count: 1 }, // yesterday
    { agent_id: 2, day: '2026-06-13', feedback_count: 9 }, // other agent ignored
  ];
  const spark = buildSparkline(activity, 1, NOW, 3);
  assert.deepEqual(spark, [0, 1, 2]);
});

test('buildSparkline: days outside the window are dropped', () => {
  const activity: ActivityRow[] = [
    { agent_id: 1, day: '2026-01-01', feedback_count: 5 }, // far past, out of 3-day window
    { agent_id: 1, day: '2026-06-13', feedback_count: 1 },
  ];
  assert.deepEqual(buildSparkline(activity, 1, NOW, 3), [0, 0, 1]);
});

test('buildSparkline: zero buckets returns empty array', () => {
  assert.deepEqual(buildSparkline([], 1, NOW, 0), []);
});

test('computeBreakdown: no feedback yields zeros and null lastFeedback', () => {
  const b = computeBreakdown({
    feedback: [],
    revokedFeedback: [],
    validations: [],
    nowMs: NOW,
    halfLifeDays: 30,
  });
  assert.equal(b.feedbackCount, 0);
  assert.equal(b.averageValue, 0);
  assert.equal(b.recencyWeightedValue, 0);
  assert.equal(b.daysSinceLastFeedback, null);
});

test('computeBreakdown: revoked feedback is excluded and counted', () => {
  const feedback: FeedbackRow[] = [
    fb({ feedback_index: 0, value_raw: 50, client_address: '0xA' }),
    fb({ feedback_index: 1, value_raw: 10, client_address: '0xB' }),
  ];
  const revoked: RevokedFeedbackRow[] = [
    {
      agent_id: 1,
      client_address: '0xB',
      feedback_index: 1,
      block_timestamp: '2026-06-13T00:00:00Z',
      transaction_hash: '0xr',
    },
  ];
  const b = computeBreakdown({
    feedback,
    revokedFeedback: revoked,
    validations: [],
    nowMs: NOW,
    halfLifeDays: 30,
  });
  assert.equal(b.feedbackCount, 1);
  assert.equal(b.revokedCount, 1);
  assert.equal(b.averageValue, 5); // only the 5.0 entry remains
});

test('computeBreakdown: revoked match is case-insensitive on client address', () => {
  const feedback: FeedbackRow[] = [fb({ feedback_index: 0, client_address: '0xABC' })];
  const revoked: RevokedFeedbackRow[] = [
    {
      agent_id: 1,
      client_address: '0xabc',
      feedback_index: 0,
      block_timestamp: '2026-06-13T00:00:00Z',
      transaction_hash: '0xr',
    },
  ];
  const b = computeBreakdown({
    feedback,
    revokedFeedback: revoked,
    validations: [],
    nowMs: NOW,
    halfLifeDays: 30,
  });
  assert.equal(b.feedbackCount, 0);
  assert.equal(b.revokedCount, 1);
});

test('computeBreakdown: recency weighting favors newer feedback', () => {
  const feedback: FeedbackRow[] = [
    fb({ feedback_index: 0, value_raw: 50, block_timestamp: '2026-06-13T00:00:00Z' }), // new, 5.0
    fb({
      feedback_index: 1,
      client_address: '0xOld',
      value_raw: 10,
      block_timestamp: new Date(NOW - 90 * DAY).toISOString(),
    }), // old, 1.0
  ];
  const b = computeBreakdown({
    feedback,
    revokedFeedback: [],
    validations: [],
    nowMs: NOW,
    halfLifeDays: 30,
  });
  assert.equal(b.averageValue, 3); // (5 + 1)/2
  // recency-weighted mean should be much closer to the recent 5.0
  assert.ok(b.recencyWeightedValue > 4.5, `got ${b.recencyWeightedValue}`);
});

test('computeBreakdown: validation average over 0-100 responses', () => {
  const validations: ValidationRow[] = [
    {
      agent_id: 1,
      validator_address: '0xv1',
      request_hash: '0xh1',
      response: 90,
      block_timestamp: '2026-06-12T00:00:00Z',
      transaction_hash: '0xt1',
    },
    {
      agent_id: 1,
      validator_address: '0xv2',
      request_hash: '0xh2',
      response: 70,
      block_timestamp: '2026-06-11T00:00:00Z',
      transaction_hash: '0xt2',
    },
  ];
  const b = computeBreakdown({
    feedback: [],
    revokedFeedback: [],
    validations,
    nowMs: NOW,
    halfLifeDays: 30,
  });
  assert.equal(b.validationCount, 2);
  assert.equal(b.averageValidationConfidence, 80);
});

test('compositeScore: empty agent scores 0; perfect agent near 100', () => {
  const empty = computeBreakdown({
    feedback: [],
    revokedFeedback: [],
    validations: [],
    nowMs: NOW,
    halfLifeDays: 30,
  });
  assert.equal(compositeScore(empty), 0);

  const feedback: FeedbackRow[] = Array.from({ length: 12 }, (_, i) =>
    fb({ feedback_index: i, client_address: `0x${i}`, value_raw: 50 })
  );
  const validations: ValidationRow[] = [
    {
      agent_id: 1,
      validator_address: '0xv',
      request_hash: '0xh',
      response: 100,
      block_timestamp: '2026-06-13T00:00:00Z',
      transaction_hash: '0xt',
    },
  ];
  const perfect = computeBreakdown({
    feedback,
    revokedFeedback: [],
    validations,
    nowMs: NOW,
    halfLifeDays: 30,
  });
  const score = compositeScore(perfect);
  assert.ok(score > 99, `expected near 100, got ${score}`);
  assert.ok(score <= 100);
});

test('compositeScore is bounded 0..100', () => {
  const feedback: FeedbackRow[] = [fb({ value_raw: 500, value_decimals: 0 })]; // absurd value
  const b = computeBreakdown({
    feedback,
    revokedFeedback: [],
    validations: [],
    nowMs: NOW,
    halfLifeDays: 30,
  });
  const score = compositeScore(b);
  assert.ok(score >= 0 && score <= 100);
});

test('rankAgents: sorts by score desc, tiebreak erc8004Id asc', () => {
  const ranked = rankAgents({
    registrations: [
      { agent_id: 1, owner_address: '0xa1', agent_uri: 'x402', block_timestamp: '2026-02-01T00:00:00Z', transaction_hash: '0x1' },
      { agent_id: 2, owner_address: '0xa2', agent_uri: null, block_timestamp: '2026-02-01T00:00:00Z', transaction_hash: '0x2' },
    ],
    feedback: [
      fb({ agent_id: 1, value_raw: 50 }),
      fb({ agent_id: 2, value_raw: 10 }),
    ],
    revokedFeedback: [],
    validations: [],
    activity: [],
    source: 'fixture',
    nowMs: NOW,
    halfLifeDays: 30,
    sparklineBuckets: 7,
  });
  assert.equal(ranked.length, 2);
  assert.equal(ranked[0].erc8004Id, 1);
  assert.ok(ranked[0].score >= ranked[1].score);
  assert.equal(ranked[0].x402, true);
  assert.equal(ranked[1].x402, false);
  assert.equal(ranked[0].sparkline.length, 7);
});

test('rankAgents: includes agents that only have validations (no feedback)', () => {
  const ranked = rankAgents({
    registrations: [],
    feedback: [],
    revokedFeedback: [],
    validations: [
      {
        agent_id: 9,
        validator_address: '0xv',
        request_hash: '0xh',
        response: 80,
        block_timestamp: '2026-06-12T00:00:00Z',
        transaction_hash: '0xt',
      },
    ],
    activity: [],
    source: 'fixture',
    nowMs: NOW,
    halfLifeDays: 30,
    sparklineBuckets: 7,
  });
  assert.equal(ranked.length, 1);
  assert.equal(ranked[0].erc8004Id, 9);
  assert.equal(ranked[0].validations, 1);
});
