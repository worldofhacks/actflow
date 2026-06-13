import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  registrationsQuery,
  feedbackQuery,
  revokedFeedbackQuery,
  validationsQuery,
  activityOverTimeQuery,
  allQueries,
} from '../bigquery/queries.js';
import {
  BQ,
  MAINNET_REGISTRIES_LC,
  MAINNET_LAUNCH_TIMESTAMP,
  TOPIC0,
} from '../bigquery/registry.js';
import { loadFixtureDataset } from '../fixtures/index.js';

/**
 * These tests pin the SQL to the EXACT values published in the erc8004-bigquery
 * skill. If anyone edits a topic0/address/table/column away from the skill,
 * these fail. Values below are copied straight from the skill text.
 */

const SKILL = {
  logsTable: 'bigquery-public-data.crypto_ethereum.logs',
  launch: '2026-01-29',
  reputation: '0x8004baa17c55a88189ae136b182e5fda19de9b63', // lowercased mainnet
  identity: '0x8004a169fb4a3325136eb29fa0ceb6d2e539a432',
  validation: '0x8004cc8439f36fd5f9f049d9ff86523df6daab58',
  topic: {
    Registered: '0xca52e62c367d81bb2e328eb795f7c7ba24afb478408a26c0e201d155c449bc4a',
    NewFeedback: '0x6a4a61743519c9d648a14e6493f47dbe3ff1aa29e7785c96c8326a205e58febc',
    FeedbackRevoked: '0x25156fd3288212246d8b008d5921fde376c71ed14ac2e072a506eb06fde6d09d',
    ValidationResponse: '0xafddf629e874ccc3963b6a888c477bd464a6c8525024fc88759ea3b2326349ae',
  },
} as const;

test('registry constants equal the skill values verbatim', () => {
  assert.equal(BQ.logsTable, SKILL.logsTable);
  assert.equal(BQ.location, 'US'); // skill: "pass location: 'US'"
  assert.equal(MAINNET_LAUNCH_TIMESTAMP, SKILL.launch);
  assert.equal(MAINNET_REGISTRIES_LC.reputation, SKILL.reputation);
  assert.equal(MAINNET_REGISTRIES_LC.identity, SKILL.identity);
  assert.equal(MAINNET_REGISTRIES_LC.validation, SKILL.validation);
  assert.equal(TOPIC0.Registered, SKILL.topic.Registered);
  assert.equal(TOPIC0.NewFeedback, SKILL.topic.NewFeedback);
  assert.equal(TOPIC0.FeedbackRevoked, SKILL.topic.FeedbackRevoked);
  assert.equal(TOPIC0.ValidationResponse, SKILL.topic.ValidationResponse);
});

test('every query targets the skill logs table and adds the launch bound', () => {
  for (const q of allQueries()) {
    assert.ok(
      q.sql.includes(`\`${SKILL.logsTable}\``),
      `${q.name} must FROM the skill logs table`
    );
    assert.ok(
      q.sql.includes(`TIMESTAMP('${SKILL.launch}')`),
      `${q.name} must include the launch-date partition bound`
    );
    assert.ok(
      q.sql.includes('block_timestamp >='),
      `${q.name} must bound block_timestamp`
    );
    // topic0 must be parameterized, never inlined
    assert.ok(
      q.sql.includes('topics[OFFSET(0)] = @topic0'),
      `${q.name} must filter topic0 via @topic0 bind param`
    );
    assert.ok(
      q.sql.includes('address = @registry'),
      `${q.name} must filter address via @registry bind param`
    );
    assert.ok(
      q.sql.includes('@limit'),
      `${q.name} must use a @limit bind param`
    );
  }
});

test('registrations query binds the Identity registry + Registered topic0', () => {
  const q = registrationsQuery();
  assert.equal(q.params.registry, SKILL.identity);
  assert.equal(q.params.topic0, SKILL.topic.Registered);
  // indexed decode columns from the skill
  assert.ok(q.sql.includes('SAFE_CAST(topics[OFFSET(1)] AS INT64)'));
  assert.ok(q.sql.includes("CONCAT('0x', SUBSTR(topics[OFFSET(2)], 27))"));
  assert.ok(q.sql.includes('ARRAY_LENGTH(topics) >= 3'));
});

test('feedback query binds Reputation registry + NewFeedback topic0 with exact data offsets', () => {
  const q = feedbackQuery();
  assert.equal(q.params.registry, SKILL.reputation);
  assert.equal(q.params.topic0, SKILL.topic.NewFeedback);
  // data-word offsets verbatim from the skill Minimal Working Example/Gotchas
  assert.ok(q.sql.includes('SUBSTR(data, 3, 64)'), 'feedback_index = data word0');
  assert.ok(q.sql.includes('SUBSTR(data, 67, 64)'), 'value = data word1');
  assert.ok(q.sql.includes('SUBSTR(data, 131, 64)'), 'value_decimals = data word2');
  // indexed client address decode
  assert.ok(q.sql.includes("CONCAT('0x', SUBSTR(topics[OFFSET(2)], 27))"));
});

test('revoked-feedback query binds Reputation registry + FeedbackRevoked topic0 (index from topics[3])', () => {
  const q = revokedFeedbackQuery();
  assert.equal(q.params.registry, SKILL.reputation);
  assert.equal(q.params.topic0, SKILL.topic.FeedbackRevoked);
  assert.ok(q.sql.includes('ARRAY_LENGTH(topics) >= 4'));
  assert.ok(q.sql.includes('SAFE_CAST(topics[OFFSET(3)] AS INT64)'));
});

test('validations query binds Validation registry + ValidationResponse topic0', () => {
  const q = validationsQuery();
  assert.equal(q.params.registry, SKILL.validation);
  assert.equal(q.params.topic0, SKILL.topic.ValidationResponse);
  assert.ok(q.sql.includes('ARRAY_LENGTH(topics) >= 4'));
  // agentId is topics[2] for ValidationResponse (validator is topics[1])
  assert.ok(q.sql.includes('SAFE_CAST(topics[OFFSET(2)] AS INT64)'));
});

test('activity query buckets NewFeedback by day for the Reputation registry', () => {
  const q = activityOverTimeQuery();
  assert.equal(q.params.registry, SKILL.reputation);
  assert.equal(q.params.topic0, SKILL.topic.NewFeedback);
  assert.ok(q.sql.includes('DATE(block_timestamp)'));
  assert.ok(q.sql.includes('GROUP BY agent_id, day'));
});

test('SQL output columns match the fixture row shape (live<->fixture parity)', () => {
  // The fixtures must carry exactly the columns the queries SELECT, so the
  // same downstream code consumes both. Spot-check each concern's key columns.
  const ds = loadFixtureDataset();

  const reg = ds.registrations[0];
  for (const col of ['agent_id', 'owner_address', 'block_timestamp', 'transaction_hash']) {
    assert.ok(col in reg, `registration fixture missing ${col}`);
  }

  const f = ds.feedback[0];
  for (const col of [
    'agent_id',
    'client_address',
    'feedback_index',
    'value_hex',
    'value_raw',
    'value_decimals',
    'block_timestamp',
    'transaction_hash',
  ]) {
    assert.ok(col in f, `feedback fixture missing ${col}`);
  }

  const v = ds.validations[0];
  for (const col of ['agent_id', 'validator_address', 'request_hash', 'response']) {
    assert.ok(col in v, `validation fixture missing ${col}`);
  }

  const a = ds.activity[0];
  for (const col of ['agent_id', 'day', 'feedback_count']) {
    assert.ok(col in a, `activity fixture missing ${col}`);
  }
});

test('fixtures expose at least one x402-capable agent', () => {
  const ds = loadFixtureDataset();
  const x402 = ds.registrations.filter(
    (r) => typeof r.agent_uri === 'string' && r.agent_uri.toLowerCase().includes('x402')
  );
  assert.ok(x402.length >= 1, 'expected at least one x402-capable registration fixture');
});
