/**
 * BigQueryClient — thin wrapper over @google-cloud/bigquery that runs the
 * parameterized concern queries with named bind parameters, in the US
 * multi-region (skill requirement), through an in-memory TTL cache.
 *
 * @google-cloud/bigquery is imported DYNAMICALLY so the service (and its
 * tests) load with zero GCP dependency in fixture mode. The package is only
 * required when a live query actually runs.
 */

import { TtlCache } from './cache.js';
import { BQ } from './registry.js';
import type { NamedQuery, QueryParams } from './queries.js';

export interface BigQueryClientOptions {
  projectId: string;
  cacheTtlMs: number;
  /** Override the BigQuery factory (used in tests to avoid real GCP). */
  bigQueryFactory?: (opts: { projectId: string }) => BigQueryLike;
}

/** Structural subset of @google-cloud/bigquery we depend on. */
export interface BigQueryLike {
  query(options: {
    query: string;
    location?: string;
    params?: QueryParams;
  }): Promise<[unknown[], ...unknown[]]>;
}

export class BigQueryClient {
  private readonly cache: TtlCache<unknown[]>;
  private clientPromise: Promise<BigQueryLike> | null = null;

  constructor(private readonly opts: BigQueryClientOptions) {
    this.cache = new TtlCache<unknown[]>(opts.cacheTtlMs);
  }

  private async getClient(): Promise<BigQueryLike> {
    if (this.opts.bigQueryFactory) {
      return this.opts.bigQueryFactory({ projectId: this.opts.projectId });
    }
    if (!this.clientPromise) {
      this.clientPromise = (async () => {
        // Dynamic import: only pulled in for live queries (ADC auth via env).
        const mod = await import('@google-cloud/bigquery');
        const BigQuery = (mod as { BigQuery: new (o: { projectId: string }) => BigQueryLike })
          .BigQuery;
        return new BigQuery({ projectId: this.opts.projectId });
      })();
    }
    return this.clientPromise;
  }

  /** Run one named concern query (cached by name+params). */
  async run<Row = unknown>(q: NamedQuery): Promise<Row[]> {
    const key = `${q.name}:${JSON.stringify(q.params)}`;
    const rows = await this.cache.wrap(key, async () => {
      const client = await this.getClient();
      const [result] = await client.query({
        query: q.sql,
        location: BQ.location,
        params: q.params,
      });
      return result;
    });
    return rows as Row[];
  }

  clearCache(): void {
    this.cache.clear();
  }
}
