import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ROOT_NODE,
  nameToNode,
  normalizeName,
  subnameNode,
  subnameNodeFromParentName,
  subnameString,
} from "../namehash.js";

/**
 * UNIT: namehash vectors. The 'eth' and 'foo.eth' nodes are the canonical
 * ENSIP-1 test vectors; if these change, name resolution is silently broken.
 */

test("ROOT_NODE is all-zero bytes32", () => {
  assert.equal(
    ROOT_NODE,
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  );
});

test("namehash of known names matches ENSIP-1 vectors", () => {
  // canonical ENSIP-1 vectors
  assert.equal(
    nameToNode("eth"),
    "0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae",
  );
  assert.equal(
    nameToNode("foo.eth"),
    "0xde9b09fd7c5f901e23a3f19fecc54828e9c848539801e86591bd9801b019f84f",
  );
  // vitalik.eth — used by the live resolution test below
  assert.equal(
    nameToNode("vitalik.eth"),
    "0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
  );
});

test("normalize is applied before hashing (ENSIP-15)", () => {
  assert.equal(normalizeName("VITALIK.ETH"), "vitalik.eth");
  // unnormalized input still hashes to the normalized node
  assert.equal(nameToNode("FOO.ETH"), nameToNode("foo.eth"));
});

test("subnameNode equals full-name namehash (on-chain derivation)", () => {
  // node('foo.eth') derived from node('eth') + label 'foo'
  const fromParent = subnameNode(nameToNode("eth"), "foo");
  assert.equal(fromParent, nameToNode("foo.eth"));
});

test("subnameNodeFromParentName matches direct namehash", () => {
  assert.equal(
    subnameNodeFromParentName("eth", "foo"),
    nameToNode("foo.eth"),
  );
  // arbitrary parent + label
  assert.equal(
    subnameNodeFromParentName("actflow.eth", "agent1"),
    nameToNode("agent1.actflow.eth"),
  );
});

test("subnameString builds the normalized full name", () => {
  assert.equal(subnameString("Actflow.ETH", "Agent1"), "agent1.actflow.eth");
});
