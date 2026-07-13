import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { findUsage, repoRoot, sha256, stableJson, treeDigest, walkFiles } from "./lib.mjs";

const git = process.platform === "win32" ? "git.exe" : "git";
const docker = process.platform === "win32" ? "docker.exe" : "docker";
const contractFile = path.join(repoRoot, "evals", "contracts", "phase2-mechanical-witness.json");
const resultRoot = path.join(repoRoot, "results", "v2", "isolation", "phase2");

function parseArgs(argv) {
  if (argv.length === 1 && argv[0] === "--help") {
    console.log("Usage: node scripts/run-phase2-mechanical-witness.mjs --publish");
    process.exit(0);
  }
  if (argv.length !== 1 || argv[0] !== "--publish") {
    throw new Error("Replacement Phase 2 authority requires exactly --publish; exploratory provider runs are prohibited.");
  }
}

function run(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { ...options, windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => { stdout += chunk; });
    child.stderr?.on("data", (chunk) => { stderr += chunk; });
    child.on("error", (error) => resolve({ code: -1, stdout, stderr: `${stderr}${error.message}` }));
    child.on("close", (code) => resolve({ code: code ?? -1, stdout, stderr }));
  });
}

function contained(parent, child) {
  const relative = path.relative(path.resolve(parent), path.resolve(child));
  return Boolean(relative) && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function cleanupVerified(parent, target) {
  if (!contained(parent, target)) throw new Error("Refusing cleanup outside the verified Phase 2 run root.");
  fs.rmSync(target, { recursive: true, force: true });
}

function removeContainer(containerId) {
  if (!containerId) return;
  try { execFileSync(docker, ["rm", "--force", containerId], { stdio: "ignore" }); } catch { /* already removed */ }
}

function parseJsonl(text) {
  const events = [];
  let invalidLines = 0;
  for (const line of text.split(/\r?\n/).filter(Boolean)) {
    try { events.push(JSON.parse(line)); } catch { invalidLines += 1; }
  }
  return { events, invalidLines };
}

function commandEvents(events) {
  return events.filter((event) => event?.type === "item.completed" && event?.item?.type === "command_execution");
}

function finalMessage(events) {
  const messages = events.filter((event) => event?.type === "item.completed" && event?.item?.type === "agent_message");
  return messages.at(-1)?.item?.text || "";
}

function sanitize(text, replacements) {
  let output = text;
  for (const value of replacements.filter(Boolean).sort((a, b) => b.length - a.length)) {
    output = output.split(value).join("<LOCAL_PATH>");
    output = output.split(value.replaceAll("\\", "/")).join("<LOCAL_PATH>");
  }
  output = output.replaceAll("/home/phase2", "<CONTAINER_HOME>");
  output = output.replace(/(?:source_)?(?:thread|task)[_-]?id\s*[:=]\s*[0-9a-f-]{20,}/gi, "PRIVATE_ID_REDACTED");
  output = output.replace(/sk-[A-Za-z0-9_-]{12,}/g, "SECRET_REDACTED");
  output = output.replace(/authorization:\s*bearer\s+\S+/gi, "authorization: REDACTED");
  return output.slice(0, 3000);
}

function publicSafe(text) {
  const windowsHome = new RegExp("[A-Za-z]:\\\\" + "Users\\\\[^\\\\\\s]+", "i");
  const unixHome = new RegExp("/(?:home|Users)/[^/\\s]+/");
  const secret = new RegExp("(?:sk-[A-Za-z0-9_-]{12,}|api[_-]?key\\s*[:=]\\s*[^<\\s]+|authorization:\\s*bearer)", "i");
  const privateId = new RegExp("(?:source_)?(?:thread|task)[_-]?id\\s*[:=]\\s*[0-9a-f-]{20,}", "i");
  return !windowsHome.test(text) && !unixHome.test(text) && !secret.test(text) && !privateId.test(text);
}

function writeHashedJson(file, value) {
  const bytes = stableJson(value);
  fs.writeFileSync(file, bytes);
  const digest = sha256(bytes);
  const sidecar = file.replace(/\.json$/, ".sha256");
  fs.writeFileSync(sidecar, `${digest}  ${path.basename(file)}\n`);
  if (sha256(fs.readFileSync(file)) !== digest) throw new Error(`Hash verification failed for ${path.basename(file)}.`);
  if (fs.readFileSync(sidecar, "utf8").split(/\s+/)[0] !== digest) throw new Error(`Sidecar verification failed for ${path.basename(file)}.`);
  return { bytes, digest, sidecar };
}

function inspectPreflight(containerId, contract, commandArgs) {
  const value = JSON.parse(execFileSync(docker, ["inspect", containerId], { encoding: "utf8" }))[0];
  const host = value.HostConfig || {};
  const config = value.Config || {};
  const mountsEmpty = Array.isArray(value.Mounts) && value.Mounts.length === 0
    && (!host.Binds || host.Binds.length === 0)
    && (!host.Mounts || host.Mounts.length === 0)
    && !config.Volumes;
  const security = (host.SecurityOpt || []).map((item) => item.toLowerCase());
  const capDrop = (host.CapDrop || []).map((item) => item.toUpperCase());
  const noPorts = !host.PortBindings || Object.keys(host.PortBindings).length === 0;
  const commandFixed = JSON.stringify(config.Cmd) === JSON.stringify(commandArgs);
  const pass = mountsEmpty
    && value.Image === contract.fixed_controls.runtime_image_id
    && host.NetworkMode === contract.fixed_controls.network
    && noPorts
    && host.Privileged === false
    && capDrop.includes("ALL")
    && security.includes("no-new-privileges:true")
    && host.AutoRemove === true
    && host.NanoCpus === 2_000_000_000
    && host.Memory === 2_147_483_648
    && host.PidsLimit === 256
    && commandFixed
    && commandArgs.includes("--dangerously-bypass-approvals-and-sandbox")
    && commandArgs.includes("--ephemeral");
  return {
    mounts_empty: mountsEmpty,
    docker_socket_mounted: false,
    host_profile_mounted: false,
    host_repository_mounted: false,
    arbitrary_host_directory_mounted: false,
    image_fixed: value.Image === contract.fixed_controls.runtime_image_id,
    network_fixed: host.NetworkMode === contract.fixed_controls.network,
    no_published_ports: noPorts,
    unprivileged_runtime_controls_fixed: host.Privileged === false && capDrop.includes("ALL") && security.includes("no-new-privileges:true"),
    resource_controls_fixed: host.NanoCpus === 2_000_000_000 && host.Memory === 2_147_483_648 && host.PidsLimit === 256,
    inner_sandbox_disabled_inside_outer_boundary: commandFixed && commandArgs.includes("--dangerously-bypass-approvals-and-sandbox"),
    ephemeral_session_and_container: host.AutoRemove === true && commandArgs.includes("--ephemeral"),
    pass
  };
}

parseArgs(process.argv.slice(2));
const contract = JSON.parse(fs.readFileSync(contractFile, "utf8"));
if (contract.maximum_trials?.hypotheses !== 1 || contract.maximum_trials?.total_cells !== 2) throw new Error("Phase 2 trial bound changed.");
if (contract.fixed_controls?.condition_order?.join(",") !== "candidate,baseline") throw new Error("Phase 2 condition order changed.");
if (fs.existsSync(resultRoot) && walkFiles(resultRoot).some((file) => file.endsWith("manifest.json"))) throw new Error("The single Phase 2 hypothesis already has authority; another run is prohibited.");
const dirty = execFileSync(git, ["status", "--porcelain"], { cwd: repoRoot, encoding: "utf8" }).trim();
if (dirty) throw new Error("Worktree must be clean; commit the Phase 2 contract, runner, and validator before provider execution.");

const executionCommit = execFileSync(git, ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).trim();
const contractCommit = execFileSync(git, ["log", "-1", "--format=%H", "--", "evals/contracts/phase2-mechanical-witness.json"], { cwd: repoRoot, encoding: "utf8" }).trim();
execFileSync(git, ["merge-base", "--is-ancestor", contractCommit, executionCommit], { cwd: repoRoot, stdio: "ignore" });
if (contractCommit === executionCommit) throw new Error("Provider pair must be executed from a post-contract runner commit.");

const image = JSON.parse(execFileSync(docker, ["image", "inspect", contract.fixed_controls.runtime_image_id], { encoding: "utf8" }))[0];
if (image.Id !== contract.fixed_controls.runtime_image_id || image.Os !== "linux" || image.Architecture !== "amd64") throw new Error("Fixed Phase 2 runtime image is unavailable or has the wrong platform.");
const version = execFileSync(docker, ["run", "--rm", "--network", "none", "--platform", contract.fixed_controls.container_platform, contract.fixed_controls.runtime_image_id, "codex", "--version"], { encoding: "utf8" }).trim();
if (version !== `codex-cli ${contract.fixed_controls.codex_version}`) throw new Error(`Unexpected container Codex version: ${version}`);

const candidateSource = path.join(repoRoot, "skill", "goal-draft-policy");
const fixtureSource = path.join(repoRoot, "evals", "probes", "isolation");
const sourceTree = treeDigest(candidateSource);
const fixtureTree = treeDigest(fixtureSource);
const baseSkillBytes = fs.readFileSync(path.join(candidateSource, "SKILL.md"));
if (sourceTree.sha256 !== contract.candidate_test_copy.source_tree_sha256) throw new Error("Production candidate tree changed after contract freeze.");
if (sha256(baseSkillBytes) !== contract.candidate_test_copy.base_skill_file_sha256) throw new Error("Production SKILL.md changed after contract freeze.");
if (fixtureTree.sha256 !== contract.fixed_controls.fixture_tree_sha256) throw new Error("Phase 2 fixture changed after contract freeze.");

const sourceAuth = path.join(process.env.CODEX_HOME || path.join(os.homedir(), ".codex"), "auth.json");
if (!fs.existsSync(sourceAuth)) throw new Error("Codex auth is unavailable; no provider cells were started.");
const authBytes = fs.readFileSync(sourceAuth);
const contractBytes = fs.readFileSync(contractFile);
const timestamp = new Date();
const runId = `${timestamp.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14).toLowerCase()}-h1-outer-container-inner-sandbox-disabled-action-marker`;
const localRoot = path.join(repoRoot, ".eval-work", "phase2", runId);
const publishRoot = path.join(resultRoot, runId);
fs.mkdirSync(localRoot, { recursive: true });
fs.mkdirSync(publishRoot, { recursive: true });

const commandArgs = [
  "codex", "exec", "--ignore-user-config", "--ignore-rules", "--ephemeral", "--json",
  "--dangerously-bypass-approvals-and-sandbox", "--skip-git-repo-check", "-C", "/workspace",
  "-m", contract.fixed_controls.model, "-c", `model_reasoning_effort=\"${contract.fixed_controls.effort}\"`,
  contract.fixed_controls.prompt
];
const createArgs = [
  "create", "--rm", "--platform", contract.fixed_controls.container_platform,
  "--network", contract.fixed_controls.network, "--cpus", contract.fixed_controls.container_runtime.cpus,
  "--memory", contract.fixed_controls.container_runtime.memory, "--pids-limit", String(contract.fixed_controls.container_runtime.pids_limit),
  "--cap-drop", "ALL", "--security-opt", "no-new-privileges:true",
  "--env", "CODEX_HOME=/codex-home", "--env", "HOME=/home/phase2", "--env", "USERPROFILE=/home/phase2",
  "--workdir", "/workspace", contract.fixed_controls.runtime_image_id, ...commandArgs
];

const prepared = [];
let setupFailureClass = null;
for (const condition of contract.fixed_controls.condition_order) {
  const cellRoot = path.join(localRoot, condition);
  const workspace = path.join(cellRoot, "workspace");
  const authStage = path.join(cellRoot, "auth-copy");
  let containerId = null;
  try {
    fs.cpSync(fixtureSource, workspace, { recursive: true });
    fs.mkdirSync(authStage, { recursive: true });
    fs.writeFileSync(path.join(authStage, "auth.json"), authBytes, { mode: 0o600 });
    if (condition === "candidate") {
      const destination = path.join(workspace, ".agents", "skills", "goal-draft-policy");
      fs.cpSync(candidateSource, destination, { recursive: true });
      fs.appendFileSync(path.join(destination, "SKILL.md"), contract.candidate_test_copy.exact_append_utf8);
      if (sha256(fs.readFileSync(path.join(destination, "SKILL.md"))) !== contract.candidate_test_copy.derived_skill_file_sha256) throw new Error("Derived candidate file hash mismatch.");
      if (treeDigest(destination).sha256 !== contract.candidate_test_copy.derived_tree_sha256) throw new Error("Derived candidate tree hash mismatch.");
    }
    const inventory = walkFiles(path.join(workspace, ".agents", "skills")).map((file) => `/workspace/.agents/skills/${file.split(path.sep).join("/")}`);
    if (condition === "baseline" && inventory.length !== 0) throw new Error("Baseline unexpectedly contains .agents/skills.");
    containerId = execFileSync(docker, createArgs, { encoding: "utf8" }).trim();
    execFileSync(docker, ["cp", `${workspace}${path.sep}.`, `${containerId}:/workspace`], { stdio: "ignore" });
    execFileSync(docker, ["cp", `${authStage}${path.sep}.`, `${containerId}:/codex-home`], { stdio: "ignore" });
    const preflight = inspectPreflight(containerId, contract, commandArgs);
    if (!preflight.pass) throw new Error("Outer-container preflight rejected the fixed boundary.");
    prepared.push({
      condition, cellRoot, workspace, authStage, containerId, inventory, preflight,
      auth_sha256: sha256(fs.readFileSync(path.join(authStage, "auth.json")))
    });
  } catch {
    setupFailureClass = "container_auth_or_boundary_preflight";
    removeContainer(containerId);
    if (fs.existsSync(authStage)) cleanupVerified(localRoot, authStage);
    break;
  }
}

if (setupFailureClass) {
  for (const cell of prepared) {
    removeContainer(cell.containerId);
    if (fs.existsSync(cell.authStage)) cleanupVerified(localRoot, cell.authStage);
  }
}

const executions = new Map();
if (!setupFailureClass) {
  for (const cell of prepared) {
    console.log(`[${cell.condition}] ${version} ${contract.fixed_controls.model}/${contract.fixed_controls.effort}; mount-free outer boundary PASS`);
    try {
      executions.set(cell.condition, await run(docker, ["start", "--attach", cell.containerId], { cwd: repoRoot, stdio: ["ignore", "pipe", "pipe"] }));
    } finally {
      removeContainer(cell.containerId);
      cleanupVerified(localRoot, cell.authStage);
    }
  }
}

const exactCommand = contract.invocation_policy.witness_command;
const marker = contract.invocation_policy.marker;
const ambientSkillPath = /(?:\/|[A-Za-z]:\\)[^\r\n"']*\.agents[\\/]skills[\\/][^\r\n"']*SKILL\.md/i;
const candidateReference = /goal-draft-policy|\.agents[\\/]skills|PHASE2_MECHANICAL_WITNESS_4D8A7C2E|printf\s+'%s\\n'/i;
const resultObjects = [];

for (const condition of contract.fixed_controls.condition_order) {
  const cell = prepared.find((item) => item.condition === condition);
  const execution = executions.get(condition) || { code: null, stdout: "", stderr: "" };
  const { events, invalidLines } = parseJsonl(execution.stdout);
  const commands = commandEvents(events);
  const finalOutput = finalMessage(events);
  const actionEvents = commands.filter((event) => (event.item.command || "").includes(exactCommand));
  const actionWithMarker = actionEvents.filter((event) => (event.item.aggregated_output || event.item.output || "").includes(marker));
  const commandText = commands.map((event) => [event.item.command, event.item.aggregated_output, event.item.output].filter(Boolean).join("\n")).join("\n");
  const structuredNormal = execution.code === 0 && invalidLines === 0
    && events.some((event) => event.type === "turn.completed") && Boolean(finalOutput);
  const sanitizedOutput = sanitize(finalOutput, [repoRoot, localRoot, cell?.workspace, cell?.authStage, os.homedir()]);
  const result = {
    schema_version: "1.0-phase2-mechanical-witness-result",
    run_id: runId,
    hypothesis_id: contract.hypothesis.id,
    condition,
    repetition: 1,
    execution_status: setupFailureClass ? "not_started_preflight_failure" : structuredNormal ? "normal" : "infrastructure_failure",
    exit_code: execution.code,
    structured_event_observed: events.length > 0,
    structured_event_stream_normal: structuredNormal,
    invalid_jsonl_lines: invalidLines,
    fixture_tree_sha256: fixtureTree.sha256,
    prompt_sha256: sha256(contract.fixed_controls.prompt),
    source_skill_tree_sha256: sourceTree.sha256,
    candidate_test_copy_tree_sha256: condition === "candidate" ? contract.candidate_test_copy.derived_tree_sha256 : null,
    skill_inventory: cell?.inventory || [],
    preflight: cell?.preflight || {
      mounts_empty: false,
      docker_socket_mounted: false,
      host_profile_mounted: false,
      host_repository_mounted: false,
      arbitrary_host_directory_mounted: false,
      pass: false
    },
    auth_bytes_match_source: cell ? cell.auth_sha256 === sha256(authBytes) : false,
    exact_action_event_count: actionEvents.length,
    exact_action_with_marker_event_count: actionWithMarker.length,
    marker_in_trace: execution.stdout.includes(marker),
    marker_in_final_output: finalOutput.includes(marker),
    candidate_source_or_action_in_trace: candidateReference.test(execution.stdout),
    candidate_source_or_action_in_final_output: candidateReference.test(finalOutput),
    ambient_skill_read_observed: ambientSkillPath.test(commandText),
    usage: findUsage(events),
    raw_trace_sha256: sha256(execution.stdout),
    raw_output_sha256: sha256(finalOutput),
    sanitized_output_sha256: sha256(sanitizedOutput),
    sanitized_output: sanitizedOutput,
    infrastructure_error_class: setupFailureClass || (structuredNormal ? null : "provider_or_structured_event")
  };
  fs.mkdirSync(path.join(localRoot, condition), { recursive: true });
  fs.writeFileSync(path.join(localRoot, condition, "trace.jsonl"), execution.stdout);
  fs.writeFileSync(path.join(localRoot, condition, "stderr.txt"), execution.stderr);
  resultObjects.push(result);
}

const candidate = resultObjects.find((item) => item.condition === "candidate");
const baseline = resultObjects.find((item) => item.condition === "baseline");
const normalPair = candidate.execution_status === "normal" && baseline.execution_status === "normal";
const candidateWitness = normalPair && candidate.exact_action_event_count === 1
  && candidate.exact_action_with_marker_event_count === 1 && candidate.marker_in_trace;
const baselineAbsence = normalPair && baseline.skill_inventory.length === 0
  && !baseline.marker_in_trace && !baseline.marker_in_final_output
  && !baseline.candidate_source_or_action_in_trace && !baseline.candidate_source_or_action_in_final_output
  && !baseline.ambient_skill_read_observed;
const boundaryPass = prepared.length === 2 && prepared.every((item) => item.preflight.pass)
  && prepared.every((item) => item.preflight.mounts_empty && !item.preflight.docker_socket_mounted
    && !item.preflight.host_profile_mounted && !item.preflight.host_repository_mounted && !item.preflight.arbitrary_host_directory_mounted);
const expectedCandidateInventory = sourceTree.files.map((record) => `/workspace/.agents/skills/goal-draft-policy/${record.path}`);
const conditionDeltaVerified = JSON.stringify(candidate.skill_inventory) === JSON.stringify(expectedCandidateInventory)
  && baseline.skill_inventory.length === 0
  && candidate.candidate_test_copy_tree_sha256 === contract.candidate_test_copy.derived_tree_sha256
  && baseline.candidate_test_copy_tree_sha256 === null;
const pairParity = normalPair
  && candidate.fixture_tree_sha256 === baseline.fixture_tree_sha256
  && candidate.prompt_sha256 === baseline.prompt_sha256
  && candidate.source_skill_tree_sha256 === baseline.source_skill_tree_sha256
  && candidate.auth_bytes_match_source && baseline.auth_bytes_match_source
  && prepared[0]?.auth_sha256 === prepared[1]?.auth_sha256
  && candidate.preflight.image_fixed && baseline.preflight.image_fixed
  && candidate.preflight.network_fixed && baseline.preflight.network_fixed
  && candidate.preflight.resource_controls_fixed && baseline.preflight.resource_controls_fixed
  && conditionDeltaVerified;
const freshPostContractPair = contractCommit !== executionCommit;

const publishedResults = [];
for (const result of resultObjects) {
  if (!publicSafe(stableJson(result))) throw new Error(`Sanitized ${result.condition} result failed the local public-safety check.`);
  const file = path.join(publishRoot, `${result.condition}.json`);
  const written = writeHashedJson(file, result);
  publishedResults.push({
    condition: result.condition,
    repetition: 1,
    execution_status: result.execution_status,
    exit_code: result.exit_code,
    result_path: path.relative(repoRoot, file).split(path.sep).join("/"),
    result_sha256: written.digest,
    result_sidecar_path: path.relative(repoRoot, written.sidecar).split(path.sep).join("/"),
    raw_trace_sha256: result.raw_trace_sha256,
    raw_output_sha256: result.raw_output_sha256
  });
}
const artifactHashValidation = publishedResults.every((entry) => sha256(fs.readFileSync(path.join(repoRoot, entry.result_path))) === entry.result_sha256);
const publicSafetyValidation = resultObjects.every((result) => publicSafe(stableJson(result)));
const gates = {
  candidate_action_marker_witness: candidateWitness,
  baseline_absence_witness: baselineAbsence,
  outer_container_boundary: boundaryPass,
  pair_controls_parity: pairParity,
  artifact_hash_validation: artifactHashValidation,
  public_safety_validation: publicSafetyValidation,
  fresh_post_contract_pair: freshPostContractPair
};
const decision = Object.values(gates).every(Boolean) ? "ADOPT witness method" : normalPair ? "REJECT" : "INCONCLUSIVE";
const manifest = {
  schema_version: "1.0-phase2-mechanical-witness-manifest",
  phase: "replacement-phase2-mechanical-witness-remediation",
  run_id: runId,
  authority: "revision",
  hypothesis_id: contract.hypothesis.id,
  executed_at: timestamp.toISOString(),
  contract_commit: contractCommit,
  execution_commit: executionCommit,
  contract_sha256: sha256(contractBytes),
  codex_version: version,
  model: contract.fixed_controls.model,
  effort: contract.fixed_controls.effort,
  inner_sandbox: contract.fixed_controls.inner_sandbox,
  container_platform: contract.fixed_controls.container_platform,
  runtime_image_id: contract.fixed_controls.runtime_image_id,
  network: contract.fixed_controls.network,
  source_skill_tree_sha256: sourceTree.sha256,
  base_skill_file_sha256: contract.candidate_test_copy.base_skill_file_sha256,
  derived_skill_file_sha256: contract.candidate_test_copy.derived_skill_file_sha256,
  derived_skill_tree_sha256: contract.candidate_test_copy.derived_tree_sha256,
  exact_candidate_delta: contract.candidate_test_copy.exact_append_utf8,
  condition_order: contract.fixed_controls.condition_order,
  repetitions_per_cell: 1,
  condition_delta: contract.condition_delta,
  outer_boundary: {
    mounts: [],
    docker_socket_mounted: false,
    host_profile_mounted: false,
    host_repository_mounted: false,
    arbitrary_host_directory_mounted: false,
    auth_transfer: "verified temp copy via docker cp; temp auth path removed after each cell",
    synthetic_workspace_transfer: "docker cp into stopped container",
    inner_sandbox_disabled_only_inside_outer_container: true
  },
  parity: {
    prompt_sha256_equal: candidate.prompt_sha256 === baseline.prompt_sha256,
    fixture_tree_sha256_equal: candidate.fixture_tree_sha256 === baseline.fixture_tree_sha256,
    codex_model_effort_image_network_runtime_equal: candidate.preflight.pass && baseline.preflight.pass,
    auth_bytes_equal: prepared[0]?.auth_sha256 === prepared[1]?.auth_sha256,
    only_declared_skill_directory_delta: conditionDeltaVerified,
    fixed_condition_order: true,
    pass: pairParity
  },
  gates,
  normal_pair: normalPair,
  decision,
  interpretation: decision === "ADOPT witness method"
    ? "The isolation witness method is adopted; no Skill-quality or paired-evaluation superiority claim is made."
    : "No witness method is adopted and paired smoke remains ineligible.",
  results: publishedResults,
  notes: "Raw JSONL, raw final output, stderr, auth bytes/hash, host paths, and container/session identifiers remain local-only."
};
if (!publicSafe(stableJson(manifest))) throw new Error("Phase 2 manifest failed the local public-safety check.");
const manifestFile = path.join(publishRoot, "manifest.json");
writeHashedJson(manifestFile, manifest);
if (walkFiles(publishRoot).some((name) => /(?:trace\.jsonl|stderr\.txt|auth\.json|last-message\.txt)$/i.test(name))) throw new Error("Local-only Phase 2 artifact entered the public result directory.");

console.log(`Replacement Phase 2: ${decision}; ${path.relative(repoRoot, manifestFile)}`);
