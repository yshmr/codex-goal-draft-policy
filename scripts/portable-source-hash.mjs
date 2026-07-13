import fs from "node:fs";
import path from "node:path";

import { sha256, walkFiles } from "./lib.mjs";

export function canonicalLfBytes(value) {
  const text = Buffer.isBuffer(value) ? value.toString("utf8") : String(value);
  return Buffer.from(text.replace(/\r\n/g, "\n").replace(/\r/g, "\n"), "utf8");
}

export function portableTreeDigest(directory) {
  const files = walkFiles(directory).filter((file) => file !== "manifest.json");
  const records = files.map((relative) => {
    const bytes = canonicalLfBytes(fs.readFileSync(path.join(directory, relative)));
    return {
      path: relative.split(path.sep).join("/"),
      bytes: bytes.length,
      sha256: sha256(bytes)
    };
  });
  return { sha256: digestRecords(records), files: records };
}

export function portableDerivedTreeDigest(sourceTree, derivedSkillBytes) {
  const derived = canonicalLfBytes(derivedSkillBytes);
  const records = sourceTree.files.map((record) => record.path === "SKILL.md"
    ? { ...record, bytes: derived.length, sha256: sha256(derived) }
    : record);
  return { sha256: digestRecords(records), files: records };
}

function digestRecords(records) {
  const payload = records
    .map((record) => `${record.path}\0${record.bytes}\0${record.sha256}\n`)
    .join("");
  return sha256(payload);
}
