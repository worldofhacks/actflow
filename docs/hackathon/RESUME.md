# Resume here

Snapshot for picking the work back up. Last verified: commit `5bb37c4` (in sync with `origin/main`).

## Live review instance (running now)
| Service | URL | Managed by |
|---|---|---|
| Web app | http://145.223.97.221:3410 | pm2 `actflow-web` |
| API | http://145.223.97.221:3401 | pm2 `actflow-api` |
| Reputation / leaderboard | http://145.223.97.221:3402 | pm2 `actflow-reputation` |
| MongoDB | 127.0.0.1:27018 | standalone (`mongod`, dbpath `/tmp/actflow-mongo`) |
| Local chain | 127.0.0.1:8546 | standalone (`hardhat node`) |

Marketplace deployed locally; **8 demo agents** in the directory; full task
lifecycle (create→assign→submit→validate→withdraw) proven. Wallet sign-in +
complete-profile work end-to-end (SIWE nonce flow). Connect **MetaMask** to test
(WalletConnect QR modal needs a Reown project id — still pending).

## State: everything buildable is done
- All phases (Step 1 + 2–6) + deliverables + gap-closure shipped & tagged.
- `pnpm build` 14/14 · ~331 tests / 25 suites · `pnpm hackathon:e2e` 5/5 · CI green.
- Live demo runs in labeled mock/fixture mode where credentials are absent.

## If the box rebooted overnight (bring it back)
pm2 process list is saved (`pm2 save` done), but **auto-start on boot needs**
`pm2 startup` (sudo — run once, see below). The in-memory chain + mongod are
standalone, so after a reboot:
```bash
export PATH=/home/actlabs/.nvm/versions/node/v22.22.3/bin:$PATH
# 1. mongod (if down)
mongod --dbpath /tmp/actflow-mongo --port 27018 --bind_ip 127.0.0.1 --fork \
  --logpath /tmp/actflow-mongo/mongod.log
# 2. app tier
/home/actlabs/.nvm/versions/node/v22.22.0/bin/pm2 resurrect
# 3. local chain + on-chain demo state (deploy + agents + seed + one lifecycle)
bash scripts/provision-local-demo.sh
/home/actlabs/.nvm/versions/node/v22.22.0/bin/pm2 restart actflow-api
```
Even without the chain, the API degrades gracefully (zeroed balances) so the
directory still renders.

To make pm2 auto-start on boot (one-time, needs sudo):
`pm2 startup` then run the command it prints.

## Pending — needs the user (drop-in → I execute)
- `NEXT_PUBLIC_RAINBOW_KIT_PROJECT_ID` (free at cloud.reown.com) → WalletConnect modal
- GCP service-account JSON at `.gcp-sa.json` + `GCP_PROJECT_ID` → live BigQuery
- `ENS_PARENT_NAME` + Sepolia-funded `DEPLOYER_PRIVATE_KEY` → real ENS subname mint
- Arc faucet USDC to that key → real Arc deploy + on-chain x402 payment
- `PRIVY_APP_ID` (secret present) → live Privy wallet · `ANTHROPIC_API_KEY` → live agent chat

## Pending — security (only the user can do)
Rotate the 2 EVM keys + Infura key leaked in `actflow-contracts` git history;
revoke `alohamonius`/`obichuk` org write access; scrub the remote repo.
Checklist: `/home/actlabs/security-incident-2026-06-13/INCIDENT.md`.
