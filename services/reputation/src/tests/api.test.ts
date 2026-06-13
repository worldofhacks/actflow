import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../api/app.js';
import { loadConfig } from '../config.js';
import { ReputationService } from '../service.js';
import { FixtureRepository } from '../bigquery/repository.js';

/**
 * API contract tests. Forces fixture mode (no GOOGLE_APPLICATION_CREDENTIALS /
 * GCP_PROJECT_ID) and uses Fastify's in-process inject() — NO live GCP, NO
 * open port. Asserts the documented leaderboard + agent-detail shapes.
 */

function fixtureApp() {
  // Build config from an env that guarantees fixture mode.
  const config = loadConfig({
    REPUTATION_PORT: '3402',
    GOOGLE_APPLICATION_CREDENTIALS: '',
    GCP_PROJECT_ID: '',
  } as NodeJS.ProcessEnv);
  assert.equal(config.mode, 'fixture');
  const service = new ReputationService(config, new FixtureRepository());
  return buildApp({ config, service });
}

test('GET /health reports fixture mode + source', async () => {
  const app = await fixtureApp();
  const res = await app.inject({ method: 'GET', url: '/health' });
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.equal(body.ok, true);
  assert.equal(body.mode, 'fixture');
  assert.equal(body.source, 'fixture');
  await app.close();
});

test('GET /leaderboard returns the documented shape from fixtures', async () => {
  const app = await fixtureApp();
  const res = await app.inject({ method: 'GET', url: '/leaderboard' });
  assert.equal(res.statusCode, 200);
  const body = res.json();

  assert.equal(body.source, 'fixture');
  assert.equal(body.sort, 'score');
  assert.equal(typeof body.count, 'number');
  assert.ok(Array.isArray(body.agents));
  assert.ok(body.agents.length > 0, 'fixtures should yield ranked agents');

  const a = body.agents[0];
  // documented per-agent shape
  assert.equal(typeof a.address, 'string');
  assert.equal(typeof a.erc8004Id, 'number');
  assert.equal(typeof a.score, 'number');
  assert.equal(typeof a.validations, 'number');
  assert.equal(typeof a.x402, 'boolean');
  assert.ok(Array.isArray(a.sparkline));
  assert.equal(a.source, 'fixture');

  // breakdown shape
  for (const key of [
    'feedbackCount',
    'revokedCount',
    'averageValue',
    'recencyWeightedValue',
    'validationCount',
    'averageValidationConfidence',
  ]) {
    assert.ok(key in a.breakdown, `breakdown missing ${key}`);
  }

  // sorted by score desc
  for (let i = 1; i < body.agents.length; i++) {
    assert.ok(body.agents[i - 1].score >= body.agents[i].score, 'agents must be score-desc');
  }

  // at least one x402-capable agent surfaces from fixtures
  assert.ok(body.agents.some((x: { x402: boolean }) => x.x402 === true));
  await app.close();
});

test('GET /leaderboard?limit= caps the result count', async () => {
  const app = await fixtureApp();
  const res = await app.inject({ method: 'GET', url: '/leaderboard?limit=2' });
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.ok(body.agents.length <= 2);
  await app.close();
});

test('GET /leaderboard?sort=validations sorts by validation count', async () => {
  const app = await fixtureApp();
  const res = await app.inject({ method: 'GET', url: '/leaderboard?sort=validations' });
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.equal(body.sort, 'validations');
  for (let i = 1; i < body.agents.length; i++) {
    assert.ok(body.agents[i - 1].validations >= body.agents[i].validations);
  }
  await app.close();
});

test('GET /leaderboard?limit=abc returns 400', async () => {
  const app = await fixtureApp();
  const res = await app.inject({ method: 'GET', url: '/leaderboard?limit=abc' });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test('GET /agents/:address/reputation returns one agent (by address)', async () => {
  const app = await fixtureApp();
  // get an address from the leaderboard first
  const lb = (await app.inject({ method: 'GET', url: '/leaderboard' })).json();
  const target = lb.agents[0].address;

  const res = await app.inject({
    method: 'GET',
    url: `/agents/${target}/reputation`,
  });
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.equal(body.source, 'fixture');
  assert.equal(body.agent.address.toLowerCase(), target.toLowerCase());
  assert.equal(typeof body.agent.score, 'number');
  assert.ok(Array.isArray(body.agent.sparkline));
  await app.close();
});

test('GET /agents/:address/reputation resolves by erc8004Id too', async () => {
  const app = await fixtureApp();
  const lb = (await app.inject({ method: 'GET', url: '/leaderboard' })).json();
  const id = lb.agents[0].erc8004Id;
  const res = await app.inject({ method: 'GET', url: `/agents/${id}/reputation` });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json().agent.erc8004Id, id);
  await app.close();
});

test('GET /agents/:address/reputation 404 for unknown agent', async () => {
  const app = await fixtureApp();
  const res = await app.inject({
    method: 'GET',
    url: '/agents/0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef/reputation',
  });
  assert.equal(res.statusCode, 404);
  assert.equal(res.json().source, 'fixture');
  await app.close();
});

test('CORS header present for web app', async () => {
  const app = await fixtureApp();
  const res = await app.inject({
    method: 'GET',
    url: '/leaderboard',
    headers: { origin: 'http://localhost:3400' },
  });
  assert.ok(res.headers['access-control-allow-origin']);
  await app.close();
});
