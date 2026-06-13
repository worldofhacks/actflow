// Agent provisioning UI-config helper tests (pure logic, no network / no chain).
//
// Runner: Node 22 native `node --test` with TypeScript type-stripping. These
// exercise the ERC-8004 explorer/chain-label helpers and assert they NEVER embed
// a registry address (the address always comes from the API response). Type-only
// imports are erased; viem / @actflow/sdk resolve from node_modules.
//
// Run:  export PATH=/home/actlabs/.nvm/versions/node/v22.22.3/bin:$PATH
//       node --experimental-strip-types --test apps/web/test/provisioning.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { readFileSync } from 'node:fs';

const here = path.dirname(fileURLToPath(import.meta.url));
const erc8004Url = pathToFileURL(
  path.join(here, '..', 'lib', 'config', 'erc8004.ts'),
).href;
const arcUrl = pathToFileURL(path.join(here, '..', 'lib', 'config', 'arc.ts')).href;

const { erc8004ExplorerBase, erc8004AddressUrl, erc8004TxUrl, chainLabel } =
  await import(erc8004Url);
const { ARC_CHAIN_ID, ARC_EXPLORER_BASE } = await import(arcUrl);

test('erc8004ExplorerBase resolves Arc chain to the shared ArcScan base', () => {
  assert.equal(erc8004ExplorerBase(ARC_CHAIN_ID), ARC_EXPLORER_BASE);
});

test('erc8004ExplorerBase returns undefined for an unknown chain (no override)', () => {
  // No NEXT_PUBLIC_ERC8004_EXPLORER_URL set in the test env -> undefined link.
  assert.equal(erc8004ExplorerBase(999999), undefined);
});

test('erc8004AddressUrl / erc8004TxUrl build links for the Arc chain', () => {
  assert.equal(
    erc8004AddressUrl(ARC_CHAIN_ID, '0xbeef'),
    `${ARC_EXPLORER_BASE}/address/0xbeef`,
  );
  assert.equal(erc8004TxUrl(ARC_CHAIN_ID, '0xdead'), `${ARC_EXPLORER_BASE}/tx/0xdead`);
});

test('erc8004AddressUrl returns undefined for an unlinkable chain', () => {
  assert.equal(erc8004AddressUrl(999999, '0xbeef'), undefined);
});

test('chainLabel names Arc Testnet and falls back for others', () => {
  assert.match(chainLabel(ARC_CHAIN_ID), /Arc Testnet/);
  assert.equal(chainLabel(424242), 'Chain 424242');
});

test('erc8004 config embeds NO registry address used in calls (cited-only)', () => {
  // The cited registry addresses may appear ONLY inside comments as documentation
  // of the source of truth; they must never be exported / used to build links.
  const src = readFileSync(path.join(here, '..', 'lib', 'config', 'erc8004.ts'), 'utf8');
  // Strip block + line comments, then assert no 0x8004... literal remains in code.
  const codeOnly = src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  assert.ok(
    !/0x8004[0-9a-fA-F]+/.test(codeOnly),
    'registry address literal leaked into executable code',
  );
});
