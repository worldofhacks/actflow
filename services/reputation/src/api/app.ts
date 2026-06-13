/**
 * Fastify app factory. CORS enabled for the web app. Routes:
 *   GET  /health
 *   GET  /leaderboard?sort=&limit=
 *   GET  /agents/:address/reputation
 *
 * Every data response carries `source: 'live' | 'fixture'`.
 */

import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { ReputationService, type LeaderboardSort } from '../service.js';
import type { ReputationConfig } from '../config.js';

const VALID_SORTS: LeaderboardSort[] = ['score', 'validations', 'recent', 'feedback'];

export interface BuildAppOptions {
  config: ReputationConfig;
  /** Inject a service (tests pass a fixture-backed one). */
  service?: ReputationService;
}

export async function buildApp(opts: BuildAppOptions): Promise<FastifyInstance> {
  const { config } = opts;
  const service = opts.service ?? new ReputationService(config);

  const app = Fastify({
    logger: false,
    bodyLimit: 64 * 1024,
  });

  await app.register(cors, {
    origin: config.corsOrigin,
    methods: ['GET', 'OPTIONS'],
  });

  app.get('/health', async () => ({
    ok: true,
    service: '@actflow/reputation',
    mode: config.mode,
    source: config.mode === 'live' ? 'live' : 'fixture',
  }));

  app.get('/leaderboard', async (request, reply) => {
    const q = request.query as { sort?: string; limit?: string };
    const sort = (VALID_SORTS as string[]).includes(q.sort ?? '')
      ? (q.sort as LeaderboardSort)
      : 'score';
    let limit: number | undefined;
    if (q.limit !== undefined) {
      const parsed = Number.parseInt(q.limit, 10);
      if (Number.isNaN(parsed)) {
        return reply.code(400).send({ error: 'limit must be an integer' });
      }
      limit = parsed;
    }

    const result = await service.leaderboard({ sort, limit });
    return {
      source: result.source,
      sort,
      count: result.count,
      agents: result.agents,
    };
  });

  app.get('/agents/:address/reputation', async (request, reply) => {
    const { address } = request.params as { address: string };
    if (!address || address.trim().length === 0) {
      return reply.code(400).send({ error: 'address required' });
    }
    const result = await service.agentReputation(address);
    if (!result.agent) {
      return reply.code(404).send({ source: result.source, error: 'agent not found' });
    }
    return { source: result.source, agent: result.agent };
  });

  return app;
}
