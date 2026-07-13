import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  canonicalLfBytes,
  portableDerivedTreeDigest,
  portableTreeDigest
} from "../scripts/portable-source-hash.mjs";

test("canonical LF bytes are invariant across LF, CRLF, and CR", () => {
  const expected = Buffer.from("one\ntwo\n", "utf8");
  assert.deepEqual(canonicalLfBytes("one\ntwo\n"), expected);
  assert.deepEqual(canonicalLfBytes("one\r\ntwo\r\n"), expected);
  assert.deepEqual(canonicalLfBytes("one\rtwo\r"), expected);
});

test("portable tree and derived hashes ignore checkout line endings", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "portable-source-hash-"));
  try {
    fs.mkdirSync(path.join(root, "agents"));
    fs.writeFileSync(path.join(root, "SKILL.md"), "alpha\nbeta\n");
    fs.writeFileSync(path.join(root, "agents", "openai.yaml"), "enabled: true\n");
    const lfTree = portableTreeDigest(root);
    const lfDerived = portableDerivedTreeDigest(lfTree, "alpha\nbeta\nprobe\n");

    fs.writeFileSync(path.join(root, "SKILL.md"), "alpha\r\nbeta\r\n");
    fs.writeFileSync(path.join(root, "agents", "openai.yaml"), "enabled: true\r\n");
    const crlfTree = portableTreeDigest(root);
    const crlfDerived = portableDerivedTreeDigest(crlfTree, "alpha\r\nbeta\r\nprobe\r\n");

    assert.deepEqual(crlfTree, lfTree);
    assert.deepEqual(crlfDerived, lfDerived);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
