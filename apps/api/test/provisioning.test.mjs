// Agent identity provisioning tests (ENS + ERC-8004 + on-chain binding) — GAP 2.
//
// Runner: Node 22 native `node --test`. Tests run against the COMPILED dist/ and the REAL
// @actflow/agents package, but ONLY the labeled DRY-RUN path (null wallet client, no env, no
// admin signer). There are NO live ENS/ERC-8004/Arc calls and NO funds/creds required — the
// Mongo layer (AgentRepository) and AgentMetadataService are duck-typed mocks, and the
// IdentityBindingService is driven via a mock-safe ProvisioningConfig (canBindOnChain=false).
//
// Run:  pnpm --filter api build && node --test apps/api/test/provisioning.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const distProv = path.join(here, '..', 'dist', 'agents', 'provisioning');

const { ProvisioningService } = require(path.join(distProv, 'provisioning.service.js'));
const { IdentityBindingService } = require(path.join(distProv, 'identity-binding.service.js'));

const AGENT = '0x' + 'c'.repeat(40);

/** In-memory AgentRepository: seeds one agent; records updates. */
function fakeAgentRepo(agent) {
  const store = { ...agent };
  return {
    store,
    async findByAgentId(agentId) {
      return agentId === store.agentId ? store : null;
    },
    async findById(id) {
      if (id === store._id) return store;
      throw new Error(`not found: ${id}`);
    },
    async update(id, update) {
      Object.assign(store, update);
      return store;
    },
  };
}

/** Metadata service stub: returns a name used to derive the ENS slug. */
function fakeMetadata(name) {
  return {
    async getMetadataByAgentId() {
      return { name };
    },
  };
}

/** Mock-safe ProvisioningConfig: never binds on-chain (no signer/contract/rpc). */
function dryRunConfig() {
  return {
    identityExtensionAddress: undefined,
    adminPrivateKey: undefined,
    rpcUrl: undefined,
    forceDryRun: true,
    canBindOnChain: false,
  };
}

function newService({ agent, name } = {}) {
  const repo = fakeAgentRepo(
    agent ?? { _id: 'mongo-agent-1', agentId: AGENT },
  );
  const config = dryRunConfig();
  const binding = new IdentityBindingService(config);
  const svc = new ProvisioningService(repo, fakeMetadata(name ?? 'Research Bot'), binding, config);
  return { svc, repo };
}

test('provision (dry-run, no funds/creds) returns an identity preview in the cited Arc Testnet registry', async () => {
  const { svc, repo } = newService();

  const res = await svc.provision({ agentId: AGENT, endpoint: 'https://x.test/a2a', x402: true });

  assert.equal(res.agentAddress.toLowerCase(), AGENT.toLowerCase());
  // ERC-8004 registry/chain are config-driven inside @actflow/agents (cited defaults).
  assert.equal(res.chainId, 5042002, 'Arc Testnet chain id (DEFAULT_ERC8004_CHAIN_ID)');
  assert.equal(
    res.registryAddress,
    '0x8004A818BFB912233c491871b3d84c89A494BD9e',
    'cited ERC-8004 IdentityRegistry (testnet/Arc) — never invented',
  );

  // Dry-run preview: nothing bound on-chain, status reflects that.
  assert.equal(res.provisionDryRun, true, 'no ENS mint / ERC-8004 register tx');
  assert.equal(res.identityStatus, 'dry-run');
  assert.equal(res.bindingTxHash, undefined, 'no on-chain binding tx');
  assert.ok(res.note, 'carries a note explaining the preview');

  // The setIdentity args are assembled (erc8004Id "" with no real mint).
  assert.ok(typeof res.identityExtensionCall.ensNode === 'string');
  assert.equal(res.identityExtensionCall.ensName, res.ensName);

  // Identity persisted on the agent record.
  assert.equal(repo.store.ensName, res.ensName);
  assert.equal(repo.store.ensNode, res.ensNode);
  assert.equal(repo.store.identityStatus, 'dry-run');
});

test('provision derives the ENS slug from the agent metadata name (kebab-cased)', async () => {
  const { svc } = newService({ name: 'My Cool Agent!!' });
  const res = await svc.provision({ agentId: AGENT });
  // With no ENS_PARENT_NAME the ensName is the bare slug; assert it was slugified.
  assert.ok(res.ensName.startsWith('my-cool-agent'), `slugified: ${res.ensName}`);
});

test('provision honors an explicit slug override', async () => {
  const { svc } = newService();
  const res = await svc.provision({ agentId: AGENT, slug: 'custom-slug' });
  assert.ok(res.ensName.startsWith('custom-slug'), `used override: ${res.ensName}`);
});

test('provision rejects an unknown agent and a blank agentId', async () => {
  const { svc } = newService();
  await assert.rejects(() => svc.provision({ agentId: '0x' + '9'.repeat(40) }));
  await assert.rejects(() => svc.provision({ agentId: '' }));
});

test('IdentityBindingService.bind is mock-safe: returns dry-run with no signer configured', async () => {
  const binding = new IdentityBindingService(dryRunConfig());
  const out = await binding.bind({
    agent: AGENT,
    ensNode: '0x' + '0'.repeat(64),
    erc8004Id: '7',
    ensName: 'demo.eth',
  });
  assert.equal(out.status, 'dry-run');
  assert.equal(out.txHash, undefined);
  assert.ok(out.reason);
});
