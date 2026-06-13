/**
 * Fixture loader. Reads the committed sample JSON files from disk (relative to
 * this module) and returns them in the SAME RegistryDataset shape the live
 * BigQuery path produces. Everything is tagged source:'fixture'.
 *
 * Files live next to the compiled module at runtime (copied into dist by the
 * build step) and next to the source during tests; we resolve relative to the
 * source location first and fall back to the dist sibling.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type {
  ActivityRow,
  FeedbackRow,
  RegistrationRow,
  RegistryDataset,
  RevokedFeedbackRow,
  ValidationRow,
} from '../types.js';

const HERE = dirname(fileURLToPath(import.meta.url));

interface FixtureFile<T> {
  rows: T[];
}

function loadRows<T>(file: string): T[] {
  const path = join(HERE, file);
  const raw = readFileSync(path, 'utf8');
  const parsed = JSON.parse(raw) as FixtureFile<T>;
  if (!parsed || !Array.isArray(parsed.rows)) {
    throw new Error(`Fixture ${file} missing "rows" array`);
  }
  return parsed.rows;
}

/** Load all fixtures as a RegistryDataset (source:'fixture'). */
export function loadFixtureDataset(): RegistryDataset {
  return {
    registrations: loadRows<RegistrationRow>('registrations.json'),
    feedback: loadRows<FeedbackRow>('feedback.json'),
    revokedFeedback: loadRows<RevokedFeedbackRow>('revoked-feedback.json'),
    validations: loadRows<ValidationRow>('validations.json'),
    activity: loadRows<ActivityRow>('activity.json'),
    source: 'fixture',
  };
}
