/**
 * RegistryRepository — the AUTO-mode data access seam.
 *
 *  - fixture mode (default, no GCP creds): returns committed JSON fixtures,
 *    source:'fixture'.
 *  - live mode (GOOGLE_APPLICATION_CREDENTIALS + GCP_PROJECT_ID present):
 *    runs the REAL concern queries via BigQueryClient and normalizes rows
 *    into the same RegistryDataset shape, source:'live'.
 *
 * The live and fixture paths return the identical shape, so scoring/API code
 * never branches on the source.
 */

import { BigQueryClient } from './client.js';
import {
  activityOverTimeQuery,
  feedbackQuery,
  registrationsQuery,
  revokedFeedbackQuery,
  validationsQuery,
} from './queries.js';
import { loadFixtureDataset } from '../fixtures/index.js';
import type { ReputationConfig } from '../config.js';
import type {
  ActivityRow,
  FeedbackRow,
  RegistrationRow,
  RegistryDataset,
  RevokedFeedbackRow,
  ValidationRow,
} from '../types.js';

/** Normalize BigQuery's TIMESTAMP/DATE objects (which may be {value} wrappers). */
function ts(v: unknown): string {
  if (v && typeof v === 'object' && 'value' in (v as Record<string, unknown>)) {
    return String((v as { value: unknown }).value);
  }
  return String(v);
}

function num(v: unknown): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'bigint') return Number(v);
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function str(v: unknown): string {
  return v === null || v === undefined ? '' : String(v);
}

export interface RegistryRepository {
  load(): Promise<RegistryDataset>;
}

/** Fixture-backed repository. */
export class FixtureRepository implements RegistryRepository {
  async load(): Promise<RegistryDataset> {
    return loadFixtureDataset();
  }
}

/** BigQuery-backed repository. */
export class LiveRepository implements RegistryRepository {
  constructor(private readonly client: BigQueryClient) {}

  async load(): Promise<RegistryDataset> {
    const [regRows, fbRows, revRows, valRows, actRows] = await Promise.all([
      this.client.run<Record<string, unknown>>(registrationsQuery()),
      this.client.run<Record<string, unknown>>(feedbackQuery()),
      this.client.run<Record<string, unknown>>(revokedFeedbackQuery()),
      this.client.run<Record<string, unknown>>(validationsQuery()),
      this.client.run<Record<string, unknown>>(activityOverTimeQuery()),
    ]);

    const registrations: RegistrationRow[] = regRows.map((r) => ({
      agent_id: num(r.agent_id),
      owner_address: str(r.owner_address),
      // agentURI is ABI-encoded inside `data`; decode client-side (e.g. viem).
      // Until decoded we surface null rather than the raw encoded blob.
      agent_uri: null,
      block_timestamp: ts(r.block_timestamp),
      transaction_hash: str(r.transaction_hash),
    }));

    const feedback: FeedbackRow[] = fbRows.map((r) => ({
      agent_id: num(r.agent_id),
      client_address: str(r.client_address),
      feedback_index: num(r.feedback_index),
      value_hex: str(r.value_hex),
      value_raw: num(r.value_raw),
      value_decimals: num(r.value_decimals),
      block_timestamp: ts(r.block_timestamp),
      transaction_hash: str(r.transaction_hash),
    }));

    const revokedFeedback: RevokedFeedbackRow[] = revRows.map((r) => ({
      agent_id: num(r.agent_id),
      client_address: str(r.client_address),
      feedback_index: num(r.feedback_index),
      block_timestamp: ts(r.block_timestamp),
      transaction_hash: str(r.transaction_hash),
    }));

    const validations: ValidationRow[] = valRows.map((r) => ({
      agent_id: num(r.agent_id),
      validator_address: str(r.validator_address),
      request_hash: str(r.request_hash),
      response: num(r.response),
      block_timestamp: ts(r.block_timestamp),
      transaction_hash: str(r.transaction_hash),
    }));

    const activity: ActivityRow[] = actRows.map((r) => ({
      agent_id: num(r.agent_id),
      day: ts(r.day),
      feedback_count: num(r.feedback_count),
    }));

    return {
      registrations,
      feedback,
      revokedFeedback,
      validations,
      activity,
      source: 'live',
    };
  }
}

/** AUTO selection per resolved config mode. */
export function createRepository(config: ReputationConfig): RegistryRepository {
  if (config.mode === 'live' && config.gcpProjectId) {
    const client = new BigQueryClient({
      projectId: config.gcpProjectId,
      cacheTtlMs: config.cacheTtlMs,
    });
    return new LiveRepository(client);
  }
  return new FixtureRepository();
}
