import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { allCases, findUsage, parseJsonlLenient, readJson, repoRoot, resolveCodexInvocation, sha256, stableJson, treeDigest } from "./lib.mjs";

function args(argv) {
  const out = { id: "", approvalSha: "", publish: false, authority: "initial" };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--id") out.id = argv[++i];
    else if (argv[i] === "--approval-sha") out.approvalSha = argv[++i];
    else if (argv[i] === "--publish") out.publish = true;
    else if (argv[i] === "--authority") out.authority = argv[++i];
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  if (!/^E2E-\d{2}$/.test(out.id)) throw new Error("--id E2E-NN is required.");
  if (!/^[a-f0-9]{64}$/.test(out.approvalSha)) throw new Error("--approval-sha must be the exact reviewed GOAL.md SHA-256.");
  return out;
}

function run(command, commandArgs, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, { ...options, windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code: code ?? -1, stdout, stderr }));
  });
}

const options = args(process.argv.slice(2));
const caseDef = allCases().find((item) => item.id === options.id && item.suite === "e2e");
if (!caseDef) throw new Error(`Unknown E2E case: ${options.id}`);
const fixtureSource = path.join(repoRoot, "fixtures", caseDef.fixture);
const goalFile = path.join(fixtureSource, "GOAL.md");
const goalText = fs.readFileSync(goalFile, "utf8");
const goalSha = sha256(goalText);
if (goalSha !== options.approvalSha) throw new Error("Approval SHA does not match the exact checked-in GOAL.md. Review the changed Goal before activation.");

const git = process.platform === "win32" ? "git.exe" : "git";
const codex = resolveCodexInvocation();
if (execFileSync(git, ["status", "--porcelain"], { cwd: repoRoot, encoding: "utf8" }).trim()) throw new Error("E2E requires a clean committed worktree.");
const skillCommit = execFileSync(git, ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).trim();
const codexVersion = execFileSync(codex.command, [...codex.prefix, "--version"], { encoding: "utf8" }).trim();
const contract = readJson(path.join(repoRoot, "evals", "contracts", "v2-predeclared.json"));
const executedAt = new Date();
const runId = `${executedAt.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14).toLowerCase()}-${options.id.toLowerCase()}-${options.authority}`;
const localRoot = path.join(repoRoot, ".eval-work", "e2e", runId);
const workDir = path.join(localRoot, "fixture");
const isolatedHome = path.join(localRoot, "codex-home");
fs.mkdirSync(localRoot, { recursive: true });
fs.cpSync(fixtureSource, workDir, { recursive: true });
fs.mkdirSync(isolatedHome, { recursive: true });
const sourceHome = process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
if (fs.existsSync(path.join(sourceHome, "auth.json"))) fs.copyFileSync(path.join(sourceHome, "auth.json"), path.join(isolatedHome, "auth.json"));

const outputFile = path.join(localRoot, "last-message.txt");
const prompt = `This is a separate, explicitly approved synthetic Goal execution workflow. The reviewed Goal is in GOAL.md and its approved SHA-256 is ${goalSha}. Read it, call the Goal creation capability with that exact objective, then execute only inside this isolated fixture until the Goal is verified or reaches its honest task-specific blocker. Do not invoke any Goal-drafting Skill. Report actual command evidence and terminal Goal status.`;
const commandArgs = [
  "exec", "--ignore-user-config", "--ephemeral", "--json", "--enable", "goals", "--sandbox", "workspace-write", "--skip-git-repo-check",
  "-C", workDir, "-m", contract.controlled_variables.model,
  "-c", `model_reasoning_effort=\"${contract.controlled_variables.effort}\"`,
  "-o", outputFile, prompt
];
const execution = await run(codex.command, [...codex.prefix, ...commandArgs], { cwd: workDir, env: { ...process.env, CODEX_HOME: isolatedHome }, stdio: ["ignore", "pipe", "pipe"] });
const rawTrace = execution.stdout;
const rawOutput = fs.existsSync(outputFile) ? fs.readFileSync(outputFile, "utf8") : "";
fs.writeFileSync(path.join(localRoot, "trace.jsonl"), rawTrace);
fs.writeFileSync(path.join(localRoot, "stderr.txt"), execution.stderr);
const sanitize = (text) => [repoRoot, workDir, isolatedHome, sourceHome, os.homedir()].filter(Boolean).sort((a, b) => b.length - a.length).reduce((value, local) => value.split(local).join("<LOCAL_PATH>").split(local.replaceAll("\\", "/")).join("<LOCAL_PATH>"), text);
const finalOutput = sanitize(rawOutput);
const verificationCommand = caseDef.allowed_commands[0];
let postVerification = { command: verificationCommand, exit_code: null, stdout: "", stderr: "" };
try {
  const pieces = verificationCommand.split(" ");
  const checked = execFileSync(pieces[0], pieces.slice(1), { cwd: workDir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  postVerification = { ...postVerification, exit_code: 0, stdout: sanitize(checked), stderr: "" };
} catch (error) {
  postVerification = { ...postVerification, exit_code: error.status ?? 1, stdout: sanitize(error.stdout?.toString() || ""), stderr: sanitize(error.stderr?.toString() || "") };
}
const activationObserved = /create_goal|goal\.created|"name"\s*:\s*"create_goal"/i.test(rawTrace);
const terminalObserved = /update_goal|goal\.(?:completed|blocked)|"status"\s*:\s*"(?:complete|blocked)"/i.test(rawTrace);
const result = {
  schema_version: "2.0-e2e",
  run_id: runId,
  case_id: caseDef.id,
  executed_at: executedAt.toISOString(),
  codex_version: codexVersion,
  model: contract.controlled_variables.model,
  effort: contract.controlled_variables.effort,
  skill_commit: skillCommit,
  fixture_sha256: treeDigest(fixtureSource).sha256,
  approved_goal_sha256: goalSha,
  activation_observed: activationObserved,
  terminal_goal_state_observed: terminalObserved,
  exit_code: execution.code,
  usage: findUsage(parseJsonlLenient(rawTrace)),
  raw_trace_sha256: sha256(rawTrace),
  raw_output_sha256: sha256(rawOutput),
  final_output: finalOutput,
  post_verification: postVerification
};
const resultBytes = stableJson(result);
fs.writeFileSync(path.join(localRoot, "public-result.json"), resultBytes);
if (options.publish) {
  const publishRoot = path.join(repoRoot, "results", "v2", "e2e", runId);
  fs.mkdirSync(publishRoot, { recursive: true });
  fs.writeFileSync(path.join(publishRoot, "result.json"), resultBytes);
  fs.writeFileSync(path.join(publishRoot, "manifest.json"), stableJson({
    schema_version: "2.0-e2e-manifest",
    run_id: runId,
    authority: activationObserved ? options.authority : "failed",
    result_path: path.relative(repoRoot, path.join(publishRoot, "result.json")).split(path.sep).join("/"),
    result_sha256: sha256(resultBytes),
    note: activationObserved ? "Actual Goal creation evidence observed in local raw trace." : "No Goal creation evidence observed; do not interpret as a real /goal E2E."
  }));
}
console.log(`E2E ${caseDef.id}: activation=${activationObserved} terminal=${terminalObserved} verify_exit=${postVerification.exit_code}`);
