import fs from "node:fs";
import path from "node:path";
import { repoRoot, readJson, sha256, stableJson, walkFiles } from "./lib.mjs";

const manifestArg = process.argv[2];
if (!manifestArg) throw new Error("Usage: node scripts/build-blind-review.mjs results/v2/runs/<run>/manifest.json");
const manifestFile = path.resolve(repoRoot, manifestArg);
const manifest = readJson(manifestFile);
const entries = manifest.results
  .filter((entry) => entry.case_id.startsWith("Q-"))
  .map((entry) => ({ entry, result: readJson(path.join(repoRoot, entry.result_path)) }))
  .sort((a, b) => sha256(`${manifest.run_id}:${a.entry.case_id}:${a.entry.condition}:${a.entry.repetition}`).localeCompare(sha256(`${manifest.run_id}:${b.entry.case_id}:${b.entry.condition}:${b.entry.repetition}`)));

const pack = entries.map(({ entry, result }, index) => ({
  blind_id: `B-${String(index + 1).padStart(3, "0")}`,
  case_id: entry.case_id,
  repetition: entry.repetition,
  output: result.final_output,
  rubric: "evals/rubric.md",
  review_status: "pending"
}));
const mapping = entries.map(({ entry }, index) => ({ blind_id: pack[index].blind_id, condition: entry.condition, result_path: entry.result_path }));
const work = path.join(repoRoot, ".eval-work", "blind-review", manifest.run_id);
fs.mkdirSync(work, { recursive: true });
fs.writeFileSync(path.join(work, "pack.jsonl"), pack.map((item) => JSON.stringify(item)).join("\n") + "\n");
fs.writeFileSync(path.join(work, "mapping.json"), stableJson(mapping));
console.log(`Blind pack: ${path.relative(repoRoot, path.join(work, "pack.jsonl"))}`);
console.log("Keep mapping.json hidden until reviews are frozen.");
