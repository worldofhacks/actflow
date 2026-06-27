/**
 * pm2 process manager config for the ActFlow review/demo stack.
 *
 * Manages the durable app tier: mongod, the API, the reputation service, and
 * the web app. The local hardhat chain + on-chain deployment is intentionally
 * NOT managed here — a pm2 restart would wipe the in-memory chain (and the
 * deployed marketplace + registered agents). Run it separately (see
 * scripts/provision-local-demo.sh) and the API degrades gracefully to zeroed
 * balances if the chain is absent.
 *
 * Secrets are read from the gitignored root .env at load time — none are
 * committed in this file.
 *
 *   pm2 start ecosystem.config.js && pm2 save
 *   pm2 status | pm2 logs <name>
 */
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PUBLIC_HOST = process.env.PUBLIC_HOST || "145.223.97.221";

function loadEnv(file) {
  const env = {};
  try {
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) env[m[1]] = m[2];
    }
  } catch {
    /* no .env — apps fall back to their own defaults */
  }
  return env;
}

const E = loadEnv(path.join(ROOT, ".env"));

// Note: mongod (:27018) and the local hardhat chain (:8546) run as standalone
// processes, NOT under pm2 — mongod for data stability, the chain because a
// restart would wipe its in-memory state. See scripts/provision-local-demo.sh.
module.exports = {
  apps: [
    {
      name: "actflow-api",
      cwd: path.join(ROOT, "apps/api"),
      script: "dist/main.js",
      env: { ...E, NODE_ENV: "production" },
      autorestart: true,
    },
    {
      name: "actflow-reputation",
      cwd: path.join(ROOT, "services/reputation"),
      script: "dist/server.js",
      env: { ...E, REPUTATION_PORT: E.REPUTATION_PORT || "3402" },
      autorestart: true,
    },
    {
      name: "actflow-web",
      cwd: path.join(ROOT, "apps/web"),
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3410 -H 0.0.0.0",
      env: {
        ...E,
        NEXTAUTH_SECRET: E.NEXTAUTH_SECRET,
        NEXTAUTH_URL: `http://${PUBLIC_HOST}:3410`,
      },
      autorestart: true,
    },
  ],
};
