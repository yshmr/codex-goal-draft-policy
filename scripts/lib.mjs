import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function readJsonl(file) {
  return fs.readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`${path.relative(repoRoot, file)}:${index + 1}: ${error.message}`);
      }
    });
}

export function walkFiles(directory, { exclude = [] } = {}) {
  const output = [];
  if (!fs.existsSync(directory)) return output;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    const relative = path.relative(directory, absolute).split(path.sep).join("/");
    if (exclude.some((value) => relative === value || relative.startsWith(`${value}/`))) continue;
    if (entry.isDirectory()) output.push(...walkFiles(absolute).map((file) => path.join(entry.name, file)));
    else if (entry.isFile()) output.push(entry.name);
  }
  return output.sort((a, b) => a.localeCompare(b));
}

export function treeDigest(directory) {
  const files = walkFiles(directory).filter((file) => file !== "manifest.json");
  const records = files.map((relative) => {
    const bytes = fs.readFileSync(path.join(directory, relative));
    return { path: relative.split(path.sep).join("/"), bytes: bytes.length, sha256: sha256(bytes) };
  });
  const payload = records.map((record) => `${record.path}\0${record.bytes}\0${record.sha256}\n`).join("");
  return { sha256: sha256(payload), files: records };
}

export function allCases() {
  const directory = path.join(repoRoot, "evals", "cases");
  return ["trigger.jsonl", "quality.jsonl", "e2e.jsonl"].flatMap((name) => readJsonl(path.join(directory, name)));
}

export function findUsage(events) {
  let usage = {};
  const visit = (value) => {
    if (!value || typeof value !== "object") return;
    if (value.usage && typeof value.usage === "object") usage = value.usage;
    for (const child of Object.values(value)) visit(child);
  };
  for (const event of events) visit(event);
  return usage;
}

export function parseJsonlLenient(text) {
  return text.split(/\r?\n/).filter(Boolean).flatMap((line) => {
    try { return [JSON.parse(line)]; } catch { return []; }
  });
}
