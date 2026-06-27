#!/usr/bin/env bash
# Provision the LOCAL on-chain demo state: start a hardhat node (if needed),
# deploy ACTMarketplaceEVM + mock USDC, register the demo agents on-chain,
# seed the marketplace, and run one full task lifecycle. Re-run this after the
# local chain is restarted (the in-memory chain loses state). The app tier
# (api/web/reputation/mongo) is managed separately by pm2 (ecosystem.config.js)
# and degrades gracefully to zeroed balances when the chain is absent.
#
# Usage:  bash scripts/provision-local-demo.sh
set -euo pipefail
export PATH=/home/actlabs/.nvm/versions/node/v22.22.3/bin:$PATH
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
RPC=http://127.0.0.1:8546

echo "==> 1/5 ensure hardhat node on 8546"
if ! curl -s --max-time 3 -X POST "$RPC" -H 'content-type: application/json' \
     -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' >/dev/null 2>&1; then
  echo "    starting hardhat node…"
  (cd packages/contracts && nohup npx hardhat node --port 8546 > /tmp/hh-node.log 2>&1 & disown)
  sleep 8
fi

echo "==> 2/5 deploy marketplace + mock USDC"
cd packages/contracts
OUT=$(LOCALHOST_RPC_URL=$RPC npx hardhat run --network localhost scripts/deploy.js 2>&1)
echo "$OUT" | grep -E "deployed"
MARKET=$(echo "$OUT" | grep "ACTMarketplaceEVM deployed" | grep -oE "0x[a-fA-F0-9]{40}")
RV=$(echo "$OUT" | grep "RevenueToken" | grep -oE "0x[a-fA-F0-9]{40}")
cd "$ROOT"

echo "==> 3/5 write addresses into .env"
python3 - "$MARKET" "$RV" <<'PY'
import re, sys
market, rv = sys.argv[1], sys.argv[2]
p=".env"; s=open(p).read()
s=re.sub(r'^ACT_MARKET_ADDRESS=.*$', f'ACT_MARKET_ADDRESS={market}', s, flags=re.M)
s=re.sub(r'^REVENUE_TOKEN_ADDRESS=.*$', f'REVENUE_TOKEN_ADDRESS={rv}', s, flags=re.M)
open(p,'w').write(s)
print(f"    ACT_MARKET_ADDRESS={market}")
PY

echo "==> 4/5 register demo agents on-chain"
(cd packages/contracts && ACT_MARKET_ADDRESS=$MARKET LOCALHOST_RPC_URL=$RPC \
   npx hardhat run --network localhost scripts/register-demo-agents.js 2>&1 | tail -5)

echo "==> 5/5 seed marketplace directory + run one task lifecycle"
set -a; . "$ROOT/.env"; set +a
pnpm --filter @actflow/seed seed:demo 2>&1 | tail -1 || true
(cd packages/contracts && ACT_MARKET_ADDRESS=$MARKET REVENUE_TOKEN_ADDRESS=$RV LOCALHOST_RPC_URL=$RPC \
   npx hardhat run --network localhost scripts/demo-task-lifecycle.js 2>&1 | tail -3) || true

echo "==> done. Restart the API so it picks up the new ACT_MARKET_ADDRESS:  pm2 restart actflow-api"
