import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { allCases, readJson, repoRoot, resolveCodexInvocation, sha256, stableJson, treeDigest } from "./lib.mjs";

function parseArgs(argv) {
  const options = {
    id: "",
    approvalSha: "",
    sessionJsonl: "",
    workdir: "",
    terminalObservation: "",
    processExitCode: null,
    publish: false,
    authority: "revision"
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--id") options.id = argv[++index];
    else if (argument === "--approval-sha") options.approvalSha = argv[++index];
    else if (argument === "--session-jsonl") options.sessionJsonl = argv[++index];
    else if (argument === "--workdir") options.workdir = argv[++index];
    else if (argument === "--terminal-observation") options.terminalObservation = argv[++index];
    else if (argument === "--process-exit-code") options.processExitCode = Number(argv[++index]);
    else if (argument === "--publish") options.publish = true;
    else if (argument === "--authority") options.authority = argv[++index];
    else throw new Error(`Unknown argument: ${argument}`);
  }
  if (!/^E2E-\d{2}$/.test(options.id)) throw new Error("--id E2E-NN is required.");
  if (!/^[a-f0-9]{64}$/.test(options.approvalSha)) throw new Error("--approval-sha must be the reviewed GOAL.md SHA-256.");
  if (!fs.existsSync(options.sessionJsonl)) throw new Error("--session-jsonl must name the local Codex session JSONL.");
  if (!fs.existsSync(options.workdir)) throw new Error("--workdir must name the isolated executed fixture.");
  if (!["achieved", "blocked"].includes(options.terminalObservation)) throw new Error("--terminal-observation must be achieved or blocked.");
  if (!Number.isInteger(options.processExitCode)) throw new Error("--process-exit-code is required.");
  return options;
}

function runVerification(command, cwd, sanitize) {
  const [executable, ...args] = command.split(" ");
  try {
    const stdout = execFileSync(executable, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return { command, exit_code: 0, stdout: sanitize(stdout), stderr: "" };
  } catch (error) {
    return {
      command,
      exit_code: error.status ?? 1,
      stdout: sanitize(error.stdout?.toString() || ""),
      stderr: sanitize(error.stderr?.toString() || "")
    };
  }
}

const options = parseArgs(process.argv.slice(2));
const caseDef = allCases().find((item) => item.id === options.id && item.suite === "e2e");
if (!caseDef) throw new Error(`Unknown E2E case: ${options.id}`);
const fixtureSource = path.join(repoRoot, "fixtures", caseDef.fixture);
const goalText = fs.readFileSync(path.join(fixtureSource, "GOAL.md"), "utf8");
if (sha256(goalText) !== options.approvalSha) throw new Error("Approval SHA does not match the checked-in Goal.");
const approvedObjective = goalText.trim().replace(/^#.*\r?\n+/, "").trim();

const git = process.platform === "win32" ? "git.exe" : "git";
if (execFileSync(git, ["status", "--porcelain"], { cwd: repoRoot, encoding: "utf8" }).trim()) {
  throw new Error("Interactive E2E capture requires a clean committed worktree before publishing.");
}
const skillCommit = execFileSync(git, ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).trim();
const codex = resolveCodexInvocation();
const codexVersion = execFileSync(codex.command, [...codex.prefix, "--version"], { encoding: "utf8" }).trim();
const contract = readJson(path.join(repoRoot, "evals", "contracts", "v2-predeclared.json"));

const rawTrace = fs.readFileSync(options.sessionJsonl, "utf8");
const events = rawTrace.split(/\r?\n/).filter(Boolean).map((line, index) => {
  try { return JSON.parse(line); }
  catch (error) { throw new Error(`Invalid session JSONL line ${index + 1}: ${error.message}`); }
});
const activeGoal = events.find((event) =>
  event.type === "event_msg" &&
  event.payload?.type === "thread_goal_updated" &&
  event.payload?.goal?.status === "active"
);
if (!activeGoal) throw new Error("No active Goal event found in the session trace.");
if (activeGoal.payload.goal.objective !== approvedObjective) {
  throw new Error(`Activated Goal objective mismatch: expected sha256=${sha256(approvedObjective)}, observed sha256=${sha256(activeGoal.payload.goal.objective)}.`);
}
const activation = activeGoal;
const completion = [...events].reverse().find((event) => event.type === "event_msg" && event.payload?.type === "task_complete");
if (!completion?.payload?.last_agent_message) throw new Error("No task-complete final output found in the session trace.");
const rawOutput = completion.payload.last_agent_message;
const localPaths = [repoRoot, options.workdir, path.dirname(options.sessionJsonl), os.homedir()]
  .filter(Boolean)
  .sort((left, right) => right.length - left.length);
const sanitize = (text) => localPaths.reduce((value, local) =>
  value.split(local).join("<LOCAL_PATH>").split(local.replaceAll("\\", "/")).join("<LOCAL_PATH>"), text);
const verification = runVerification(caseDef.allowed_commands[0], options.workdir, sanitize);
if (options.terminalObservation === "achieved" && verification.exit_code !== 0) {
  throw new Error("An achieved observation requires a fresh passing verifier.");
}
const tokenEvent = [...events].reverse().find((event) => event.type === "event_msg" && event.payload?.type === "token_count");
const usage = tokenEvent?.payload?.info?.total_token_usage || {};
const verifyName = caseDef.allowed_commands[0].split(" ").at(-1);
const fixtureVerifier = path.join(fixtureSource, verifyName);
const executedVerifier = path.join(options.workdir, verifyName);
verification.verify_sha256_before = fs.existsSync(fixtureVerifier) ? sha256(fs.readFileSync(fixtureVerifier)) : null;
verification.verify_sha256_after = fs.existsSync(executedVerifier) ? sha256(fs.readFileSync(executedVerifier)) : null;
verification.terminal_observation = options.terminalObservation;
verification.terminal_observation_provenance = "Human-observed Codex TUI terminal label; the session JSONL records activation and task completion but not the rendered terminal label.";
verification.activation_event = "thread_goal_updated(active) with byte-identical approved objective";

const executedAt = new Date(activation.timestamp);
const runId = `${executedAt.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14).toLowerCase()}-${options.id.toLowerCase()}-interactive-${options.authority}`;
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
  approved_goal_sha256: options.approvalSha,
  activation_observed: true,
  terminal_goal_state_observed: true,
  exit_code: options.processExitCode,
  usage,
  raw_trace_sha256: sha256(rawTrace),
  raw_output_sha256: sha256(rawOutput),
  final_output: sanitize(rawOutput),
  post_verification: verification
};
const resultBytes = stableJson(result);
const localOutput = path.join(repoRoot, ".eval-work", "e2e-capture", runId);
fs.mkdirSync(localOutput, { recursive: true });
fs.writeFileSync(path.join(localOutput, "result.json"), resultBytes);
if (options.publish) {
  const publishRoot = path.join(repoRoot, "results", "v2", "e2e", runId);
  fs.mkdirSync(publishRoot, { recursive: true });
  fs.writeFileSync(path.join(publishRoot, "result.json"), resultBytes);
  fs.writeFileSync(path.join(publishRoot, "manifest.json"), stableJson({
    schema_version: "2.0-e2e-manifest",
    run_id: runId,
    authority: options.authority,
    result_path: path.relative(repoRoot, path.join(publishRoot, "result.json")).split(path.sep).join("/"),
    result_sha256: sha256(resultBytes),
    note: "Interactive /goal activation is trace-backed; the rendered terminal label is explicitly human-observed. Raw session and unsanitized output remain local-only."
  }));
}
console.log(`Captured ${caseDef.id}: activation=true terminal=${options.terminalObservation} verify_exit=${verification.exit_code}`);
