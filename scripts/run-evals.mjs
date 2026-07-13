import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, execFileSync } from "node:child_process";
import { allCases, findUsage, parseJsonlLenient, readJson, repoRoot, resolveCodexInvocation, sha256, stableJson, treeDigest } from "./lib.mjs";
import { gradeRun } from "./grader.mjs";

function parseArgs(argv) {
  const options = { ids: [], conditions: ["with_skill", "without_skill"], maxRepetitions: 3, publish: false, authority: "initial", allowDirty: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--ids") options.ids = argv[++index].split(",").filter(Boolean);
    else if (arg === "--conditions") options.conditions = argv[++index].split(",").filter(Boolean);
    else if (arg === "--max-repetitions") options.maxRepetitions = Number(argv[++index]);
    else if (arg === "--publish") options.publish = true;
    else if (arg === "--authority") options.authority = argv[++index];
    else if (arg === "--allow-dirty") options.allowDirty = true;
    else if (arg === "--help") {
      console.log("Usage: node scripts/run-evals.mjs --ids T-01,Q-01 [--conditions with_skill,without_skill] [--max-repetitions 3] [--publish] [--authority initial]");
      process.exit(0);
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!options.ids.length) throw new Error("--ids is required; provider-backed runs are never implicit.");
  if (!options.conditions.every((value) => ["with_skill", "without_skill"].includes(value))) throw new Error("Invalid condition.");
  if (!Number.isInteger(options.maxRepetitions) || options.maxRepetitions < 1 || options.maxRepetitions > 3) throw new Error("--max-repetitions must be 1..3.");
  if (!["initial", "revision", "superseded", "failed", "contaminated", "inconclusive"].includes(options.authority)) throw new Error("Invalid authority.");
  return options;
}

function runProcess(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { ...options, windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code: code ?? -1, stdout, stderr }));
  });
}

function sanitize(text, replacements) {
  let output = text;
  for (const value of replacements.filter(Boolean).sort((a, b) => b.length - a.length)) {
    output = output.split(value).join("<LOCAL_PATH>");
    output = output.split(value.replaceAll("\\", "/")).join("<LOCAL_PATH>");
  }
  return output;
}

function copyAuth(sourceHome, targetHome) {
  fs.mkdirSync(targetHome, { recursive: true });
  for (const name of ["auth.json"]) {
    const source = path.join(sourceHome, name);
    if (fs.existsSync(source)) fs.copyFileSync(source, path.join(targetHome, name));
  }
}

const options = parseArgs(process.argv.slice(2));
const contractFile = path.join(repoRoot, "evals", "contracts", "v2-predeclared.json");
const contract = readJson(contractFile);
const casesById = new Map(allCases().map((item) => [item.id, item]));
const selected = options.ids.map((id) => {
  const item = casesById.get(id);
  if (!item) throw new Error(`Unknown case ID: ${id}`);
  if (item.suite === "e2e") throw new Error(`${id} is an E2E execution case; use the documented separate /goal workflow.`);
  return item;
});

const git = process.platform === "win32" ? "git.exe" : "git";
const codex = resolveCodexInvocation();
const dirty = execFileSync(git, ["status", "--porcelain"], { cwd: repoRoot, encoding: "utf8" }).trim();
if (dirty && !options.allowDirty) throw new Error("Worktree must be clean before a provider-backed run. Commit the frozen contract and Skill first.");
const skillCommit = execFileSync(git, ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).trim();
const codexVersion = execFileSync(codex.command, [...codex.prefix, "--version"], { encoding: "utf8" }).trim();
const sourceCodexHome = process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
const timestamp = new Date();
const runId = timestamp.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14).toLowerCase() + `-${options.authority}`;
const localRoot = path.join(repoRoot, ".eval-work", runId);
const publishRoot = path.join(repoRoot, "results", "v2", "runs", runId);
fs.mkdirSync(localRoot, { recursive: true });
if (options.publish) fs.mkdirSync(publishRoot, { recursive: true });

const manifest = {
  schema_version: "2.0",
  run_id: runId,
  authority: options.authority,
  executed_at: timestamp.toISOString(),
  codex_version: codexVersion,
  model: contract.controlled_variables.model,
  effort: contract.controlled_variables.effort,
  skill_commit: skillCommit,
  contract_sha256: sha256(fs.readFileSync(contractFile)),
  notes: options.publish ? "Sanitized final outputs are committed; raw JSONL traces and raw outputs remain local-only, with hashes recorded." : "Local-only uncommitted run.",
  results: []
};

for (const caseDef of selected) {
  for (const condition of options.conditions) {
    const repetitions = Math.min(caseDef.repetitions, options.maxRepetitions);
    for (let repetition = 1; repetition <= repetitions; repetition += 1) {
      const cellName = `${caseDef.id.toLowerCase()}-${condition}-${repetition}`;
      const cellRoot = path.join(localRoot, cellName);
      const workDir = path.join(cellRoot, "fixture");
      const isolatedHome = path.join(cellRoot, "codex-home");
      const isolatedProfile = path.join(cellRoot, "profile");
      fs.mkdirSync(cellRoot, { recursive: true });
      fs.cpSync(path.join(repoRoot, "fixtures", caseDef.fixture), workDir, { recursive: true });
      copyAuth(sourceCodexHome, isolatedHome);
      if (condition === "with_skill") {
        fs.cpSync(path.join(repoRoot, "skill", "goal-draft-policy"), path.join(workDir, ".agents", "skills", "goal-draft-policy"), { recursive: true });
      }
      const outputFile = path.join(cellRoot, "last-message.txt");
      const args = [
        "exec", "--ignore-user-config", "--ephemeral", "--json", "--sandbox", "read-only", "--skip-git-repo-check",
        "-C", workDir, "-m", contract.controlled_variables.model,
        "-c", `model_reasoning_effort=\"${contract.controlled_variables.effort}\"`,
        "-o", outputFile, caseDef.prompt
      ];
      console.log(`[${cellName}] ${codexVersion} ${contract.controlled_variables.model}/${contract.controlled_variables.effort}`);
      const execution = await runProcess(codex.command, [...codex.prefix, ...args], { cwd: workDir, env: { ...process.env, CODEX_HOME: isolatedHome, HOME: isolatedProfile, USERPROFILE: isolatedProfile }, stdio: ["ignore", "pipe", "pipe"] });
      const rawTrace = execution.stdout;
      const rawOutput = fs.existsSync(outputFile) ? fs.readFileSync(outputFile, "utf8") : "";
      fs.writeFileSync(path.join(cellRoot, "trace.jsonl"), rawTrace);
      fs.writeFileSync(path.join(cellRoot, "stderr.txt"), execution.stderr);
      const finalOutput = sanitize(rawOutput, [repoRoot, workDir, isolatedHome, isolatedProfile, sourceCodexHome, os.homedir()]);
      const events = parseJsonlLenient(rawTrace);
      const grade = gradeRun({ caseDef, condition, traceText: rawTrace, outputText: finalOutput, expectedSkillMarker: "An already-achieved target is not automatically a durable Goal." });
      const result = {
        schema_version: "2.0",
        run_id: runId,
        case_id: caseDef.id,
        condition,
        repetition,
        exit_code: execution.code,
        output_sha256: sha256(finalOutput),
        raw_trace_sha256: sha256(rawTrace),
        raw_output_sha256: sha256(rawOutput),
        usage: findUsage(events),
        grade,
        final_output: finalOutput
      };
      const resultBytes = stableJson(result);
      fs.writeFileSync(path.join(cellRoot, "public-result.json"), resultBytes);
      let resultPath = path.relative(repoRoot, path.join(cellRoot, "public-result.json")).split(path.sep).join("/");
      if (options.publish) {
        const published = path.join(publishRoot, `${cellName}.json`);
        fs.writeFileSync(published, resultBytes);
        resultPath = path.relative(repoRoot, published).split(path.sep).join("/");
      }
      manifest.results.push({
        case_id: caseDef.id,
        condition,
        repetition,
        fixture_sha256: treeDigest(path.join(repoRoot, "fixtures", caseDef.fixture)).sha256,
        prompt_sha256: sha256(caseDef.prompt),
        exit_code: execution.code,
        usage: result.usage,
        result_path: resultPath,
        result_sha256: sha256(resultBytes),
        raw_trace_sha256: result.raw_trace_sha256,
        raw_output_sha256: result.raw_output_sha256
      });
    }
  }
}

if (manifest.results.some((entry) => {
  const result = JSON.parse(fs.readFileSync(path.join(repoRoot, entry.result_path), "utf8"));
  return result.grade.contamination_findings?.length > 0;
}) && ["initial", "revision"].includes(manifest.authority)) {
  manifest.authority = "contaminated";
  manifest.notes += " Condition isolation contamination was detected by the grader; do not use this run for comparison claims.";
}

const manifestBytes = stableJson(manifest);
fs.writeFileSync(path.join(localRoot, "manifest.json"), manifestBytes);
if (options.publish) fs.writeFileSync(path.join(publishRoot, "manifest.json"), manifestBytes);
console.log(`Run complete: ${manifest.results.length} cells; manifest ${options.publish ? path.relative(repoRoot, path.join(publishRoot, "manifest.json")) : path.relative(repoRoot, path.join(localRoot, "manifest.json"))}`);
