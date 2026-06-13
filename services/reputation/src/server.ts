/**
 * Server entrypoint. Boots the Fastify app on REPUTATION_PORT (default 3402)
 * using AUTO-mode config (live BigQuery iff GCP creds present, else fixtures).
 */

import { loadConfig } from './config.js';
import { buildApp } from './api/app.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const app = await buildApp({ config });
  await app.listen({ port: config.port, host: config.host });
  // eslint-disable-next-line no-console
  console.log(
    `[@actflow/reputation] listening on http://${config.host}:${config.port} ` +
      `(mode=${config.mode}, source=${config.mode === 'live' ? 'live' : 'fixture'})`
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[@actflow/reputation] failed to start:', err);
  process.exit(1);
});
