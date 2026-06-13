/**
 * Minimal in-memory TTL cache. No external deps. Used to avoid re-billing the
 * same BigQuery query within a short window (the skill notes BigQuery is
 * minutes-to-hours stale anyway, so a TTL cache is safe).
 */

interface Entry<V> {
  value: V;
  expiresAt: number; // epoch ms
}

export class TtlCache<V> {
  private readonly store = new Map<string, Entry<V>>();

  constructor(private readonly ttlMs: number) {}

  get(key: string): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: V): void {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  /** Get-or-compute with caching of the resolved promise's value. */
  async wrap(key: string, fn: () => Promise<V>): Promise<V> {
    const hit = this.get(key);
    if (hit !== undefined) return hit;
    const value = await fn();
    this.set(key, value);
    return value;
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}
