import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { findUsage, parseJsonlLenient, repoRoot, sha256, stableJson, treeDigest, walkFiles } from "./lib.mjs";

function parseArgs(argv) {
  const options = { hypothesis: "", publish: false };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--hypothesis") options.hypothesis = argv[++index];
    else if (argv[index] === "--publish") options.publish = true;
    else if (argv[index] === "--help") {
      console.log("Usage: node scripts/run-isolation-probes.mjs --hypothesis H1-container-cwd-repository-skill --publish");
      process.exit(0);
    } else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  if (!options.hypothesis) throw new Error("--hypothesis is required; provider-backed probes are never implicit.");
  if (!options.publish) throw new Error("Phase 1 authority must use --publish; local exploratory provider runs are prohibited.");
  return options;
}

function run(command, args, options = {}) {
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

function contained(parent, child) {
  const relative = path.relative(path.resolve(parent), path.resolve(child));
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function cleanupVerified(parent, target) {
  if (!contained(parent, target)) throw new Error(`Refusing cleanup outside the verified run root: ${target}`);
  fs.rmSync(target, { recursive: true, force: true });
}

function sanitize(text, replacements) {
  let output = text;
  for (const value of replacements.filter(Boolean).sort((a, b) => b.length - a.length)) {
    output = output.split(value).join("<LOCAL_PATH>");
    output = output.split(value.replaceAll("\\", "/")).join("<LOCAL_PATH>");
  }
  output = output.replace(/(?:source_)?(?:thread|task)[_-]?id\s*[:=]\s*[0-9a-f-]{20,}/gi, "PRIVATE_ID_REDACTED");
  return output;
}

function commandText(event) {
  if (event?.item?.type !== "command_execution") return "";
  return [event.item.command, event.item.aggregated_output, event.item.output].filter(Boolean).join("\n");
}

const options = parseArgs(process.argv.slice(2));
const contractFile = path.join(repoRoot, "evals", "contracts", "phase1-isolation.json");
const contract = JSON.parse(fs.readFileSync(contractFile, "utf8"));
const hypothesis = contract.hypotheses.find((item) => item.id === options.hypothesis);
if (!hypothesis) throw new Error(`Unknown hypothesis: ${options.hypothesis}`);
if (hypothesis.order > 1) {
  const priorId = contract.hypotheses.find((item) => item.order === hypothesis.order - 1)?.id;
  const priorManifests = fs.existsSync(path.join(repoRoot, "results", "v2", "isolation", "phase1"))
    ? walkFiles(path.join(repoRoot, "results", "v2", "isolation", "phase1")).filter((file) => file.endsWith("manifest.json"))
      .map((file) => JSON.parse(fs.readFileSync(path.join(repoRoot, "results", "v2", "isolation", "phase1", file), "utf8")))
    : [];
  const prior = priorManifests.find((item) => item.hypothesis_id === priorId);
  if (!prior || prior.decision === "ADOPT") throw new Error(`H${hypothesis.order} requires a non-ADOPT authority for ${priorId}.`);
}

const git = process.platform === "win32" ? "git.exe" : "git";
const docker = process.platform === "win32" ? "docker.exe" : "docker";
const dirty = execFileSync(git, ["status", "--porcelain"], { cwd: repoRoot, encoding: "utf8" }).trim();
if (dirty) throw new Error("Worktree must be clean; commit the Phase 1 contract and runner before execution.");
const designCommit = execFileSync(git, ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).trim();
const timestamp = new Date();
const runId = `${timestamp.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14).toLowerCase()}-${hypothesis.id.toLowerCase()}`;
const localRoot = path.join(repoRoot, ".eval-work", "phase1", runId);
const publishRoot = path.join(repoRoot, "results", "v2", "isolation", "phase1", runId);
fs.mkdirSync(localRoot, { recursive: true });
fs.mkdirSync(publishRoot, { recursive: true });

const contractBytes = fs.readFileSync(contractFile);
const contractSha = sha256(contractBytes);
const imageTag = `codex-phase1-isolation:${contractSha.slice(0, 12)}`;
const buildRoot = path.join(localRoot, "image-build");
fs.mkdirSync(buildRoot, { recursive: true });
const dockerfile = [
  `FROM ${contract.fixed_controls.container_base}`,
  "RUN apt-get update && apt-get install --yes --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*",
  `RUN npm install --global ${contract.fixed_controls.codex_package}`,
  "RUN codex --version",
  "WORKDIR /workspace",
  ""
].join("\n");
fs.writeFileSync(path.join(buildRoot, "Dockerfile"), dockerfile);

console.log(`[setup] building pinned ${contract.fixed_controls.codex_package} runtime`);
const build = await run(docker, ["build", "--platform", contract.fixed_controls.container_platform, "--tag", imageTag, buildRoot], { cwd: repoRoot, stdio: ["ignore", "pipe", "pipe"] });
fs.writeFileSync(path.join(localRoot, "docker-build.stdout.txt"), build.stdout);
fs.writeFileSync(path.join(localRoot, "docker-build.stderr.txt"), build.stderr);
if (build.code !== 0) throw new Error(`Docker build failed (local logs: ${path.relative(repoRoot, localRoot)}).`);
const imageId = execFileSync(docker, ["image", "inspect", "--format", "{{.Id}}", imageTag], { encoding: "utf8" }).trim();
const version = execFileSync(docker, ["run", "--rm", "--platform", contract.fixed_controls.container_platform, imageId, "codex", "--version"], { encoding: "utf8" }).trim();
if (version !== `codex-cli ${contract.fixed_controls.codex_version}`) throw new Error(`Unexpected Codex version: ${version}`);

const fixtureSource = path.join(repoRoot, "evals", "probes", "isolation");
const candidateSource = path.join(repoRoot, "skill", "goal-draft-policy");
const sourceSkillSha = treeDigest(candidateSource).sha256;
const sourceAuth = path.join(process.env.CODEX_HOME || path.join(os.homedir(), ".codex"), "auth.json");
if (!fs.existsSync(sourceAuth)) throw new Error("Codex auth.json is unavailable; no provider cells were started.");
const authBytes = fs.readFileSync(sourceAuth);
const cells = [];

for (const condition of contract.fixed_controls.condition_order) {
  const cellRoot = path.join(localRoot, condition);
  const workDir = path.join(cellRoot, "workspace");
  const isolatedHome = path.join(cellRoot, "codex-home");
  fs.mkdirSync(cellRoot, { recursive: true });
  fs.cpSync(fixtureSource, workDir, { recursive: true });
  fs.mkdirSync(isolatedHome, { recursive: true });
  fs.writeFileSync(path.join(isolatedHome, "auth.json"), authBytes);
  execFileSync(git, ["init", "--quiet"], { cwd: workDir, stdio: "ignore" });
  if (hypothesis.cwd.endsWith("/nested")) {
    fs.mkdirSync(path.join(workDir, "nested"), { recursive: true });
    fs.copyFileSync(path.join(workDir, "PROBE.md"), path.join(workDir, "nested", "PROBE.md"));
  }
  const sourceFixtureSha = treeDigest(fixtureSource).sha256;
  if (condition === "candidate") {
    const destination = path.join(workDir, ".agents", "skills", "goal-draft-policy");
    fs.cpSync(candidateSource, destination, { recursive: true });
    fs.appendFileSync(path.join(destination, "SKILL.md"), `\n<!-- ${contract.mechanical_witness.marker} -->\n`);
  }
  const instrumentedSkillPath = path.join(workDir, ".agents", "skills", "goal-draft-policy");
  const instrumentedSkillSha = fs.existsSync(instrumentedSkillPath) ? treeDigest(instrumentedSkillPath).sha256 : null;
  const skillInventory = walkFiles(path.join(workDir, ".agents", "skills")).map((file) => `/workspace/.agents/skills/${file.split(path.sep).join("/")}`);
  const outputContainer = hypothesis.cwd.endsWith("/nested") ? "/workspace/nested/last-message.txt" : "/workspace/last-message.txt";
  const cwdContainer = hypothesis.cwd;
  const dockerArgs = [
    "run", "--rm", "--platform", contract.fixed_controls.container_platform,
    "--mount", `type=bind,source=${workDir},target=/workspace`,
    "--mount", `type=bind,source=${isolatedHome},target=/codex-home`,
    "--env", "CODEX_HOME=/codex-home", "--env", "HOME=/home/phase1", "--env", "USERPROFILE=/home/phase1",
    "--workdir", cwdContainer, imageId,
    "codex", "exec", "--ignore-user-config", "--ephemeral", "--json", "--sandbox", contract.fixed_controls.sandbox,
    "--skip-git-repo-check", "-C", cwdContainer, "-m", contract.fixed_controls.model,
    "-c", `model_reasoning_effort=\"${contract.fixed_controls.effort}\"`, "-o", outputContainer,
    contract.fixed_controls.prompt
  ];
  console.log(`[${condition}] ${version} ${contract.fixed_controls.model}/${contract.fixed_controls.effort}`);
  const execution = await run(docker, dockerArgs, { cwd: repoRoot, stdio: ["ignore", "pipe", "pipe"] });
  const outputHost = path.join(workDir, ...(hypothesis.cwd.endsWith("/nested") ? ["nested", "last-message.txt"] : ["last-message.txt"]));
  const rawOutput = fs.existsSync(outputHost) ? fs.readFileSync(outputHost, "utf8") : "";
  fs.writeFileSync(path.join(cellRoot, "trace.jsonl"), execution.stdout);
  fs.writeFileSync(path.join(cellRoot, "stderr.txt"), execution.stderr);
  const events = parseJsonlLenient(execution.stdout);
  const commands = events.map(commandText).filter(Boolean);
  const candidatePathPattern = /\/workspace\/\.agents\/skills\/goal-draft-policy\/SKILL\.md/i;
  const anyGoalSkillPattern = /(?:[A-Za-z]:\\|\/)[^\r\n"']*\.agents[\\/]skills[\\/]goal-draft-policy[\\/]SKILL\.md/i;
  const sourceReadObserved = commands.some((text) => candidatePathPattern.test(text));
  const anyGoalSkillReadObserved = commands.some((text) => anyGoalSkillPattern.test(text));
  const externalGoalSkillReadObserved = commands.some((text) => anyGoalSkillPattern.test(text) && !candidatePathPattern.test(text));
  const markerInTrace = execution.stdout.includes(contract.mechanical_witness.marker);
  const markerInOutput = rawOutput.includes(contract.mechanical_witness.marker);
  const authBytesMatchSource = fs.readFileSync(path.join(isolatedHome, "auth.json")).equals(authBytes);
  const controlFingerprint = sha256(stableJson({
    version,
    model: contract.fixed_controls.model,
    effort: contract.fixed_controls.effort,
    sandbox: contract.fixed_controls.sandbox,
    platform: contract.fixed_controls.container_platform,
    image_id: imageId,
    cwd: cwdContainer,
    prompt: contract.fixed_controls.prompt,
    environment: ["CODEX_HOME=/codex-home", "HOME=/home/phase1", "USERPROFILE=/home/phase1"],
    mounts: ["workspace:/workspace", "cell-codex-home:/codex-home"]
  }));
  const sanitizedOutput = sanitize(rawOutput, [repoRoot, localRoot, workDir, isolatedHome, os.homedir()]).slice(0, 4000);
  const result = {
    schema_version: "1.0-phase1-isolation-result",
    run_id: runId,
    hypothesis_id: hypothesis.id,
    condition,
    exit_code: execution.code,
    source_fixture_sha256: sourceFixtureSha,
    prompt_sha256: sha256(contract.fixed_controls.prompt),
    source_skill_sha256: sourceSkillSha,
    instrumented_skill_sha256: instrumentedSkillSha,
    skill_inventory: skillInventory,
    source_read_observed: sourceReadObserved,
    any_goal_skill_read_observed: anyGoalSkillReadObserved,
    external_goal_skill_read_observed: externalGoalSkillReadObserved,
    marker_in_trace: markerInTrace,
    marker_in_output: markerInOutput,
    host_profile_mounted: false,
    auth_bytes_match_source: authBytesMatchSource,
    control_fingerprint_sha256: controlFingerprint,
    usage: findUsage(events),
    raw_trace_sha256: sha256(execution.stdout),
    raw_output_sha256: sha256(rawOutput),
    sanitized_output_sha256: sha256(sanitizedOutput),
    sanitized_output: sanitizedOutput
  };
  const resultBytes = stableJson(result);
  const resultFile = path.join(publishRoot, `${condition}.json`);
  fs.writeFileSync(resultFile, resultBytes);
  cells.push({ condition, result, result_path: path.relative(repoRoot, resultFile).split(path.sep).join("/"), result_sha256: sha256(resultBytes) });
  cleanupVerified(localRoot, isolatedHome);
}

const candidate = cells.find((item) => item.condition === "candidate").result;
const baseline = cells.find((item) => item.condition === "baseline").result;
const candidateWitness = candidate.exit_code === 0 && candidate.source_read_observed && candidate.marker_in_trace && candidate.any_goal_skill_read_observed && !candidate.external_goal_skill_read_observed;
const baselineAbsence = baseline.exit_code === 0 && baseline.skill_inventory.length === 0 && !baseline.any_goal_skill_read_observed && !baseline.marker_in_trace && !baseline.marker_in_output && !baseline.host_profile_mounted;
const parity = candidate.source_fixture_sha256 === baseline.source_fixture_sha256
  && candidate.prompt_sha256 === baseline.prompt_sha256
  && candidate.control_fingerprint_sha256 === baseline.control_fingerprint_sha256
  && candidate.auth_bytes_match_source && baseline.auth_bytes_match_source
  && candidate.exit_code === 0 && baseline.exit_code === 0;
const normalPair = candidate.exit_code === 0 && baseline.exit_code === 0;
const decision = candidateWitness && baselineAbsence && parity ? "ADOPT" : normalPair ? "REJECT" : "INCONCLUSIVE";
const manifest = {
  schema_version: "1.0-phase1-isolation-manifest",
  phase: "phase1",
  run_id: runId,
  authority: "revision",
  hypothesis_id: hypothesis.id,
  executed_at: timestamp.toISOString(),
  design_commit: designCommit,
  contract_sha256: contractSha,
  codex_version: version,
  model: contract.fixed_controls.model,
  effort: contract.fixed_controls.effort,
  sandbox: contract.fixed_controls.sandbox,
  container_platform: contract.fixed_controls.container_platform,
  container_base: contract.fixed_controls.container_base,
  runtime_image_id: imageId,
  source_skill_sha256: sourceSkillSha,
  instrumented_candidate_skill_sha256: candidate.instrumented_skill_sha256,
  condition_order: contract.fixed_controls.condition_order,
  condition_delta: contract.condition_delta,
  mount_policy: ["synthetic workspace -> /workspace", "per-cell auth-only CODEX_HOME -> /codex-home", "host profile not mounted"],
  parity: {
    prompt_sha256_equal: candidate.prompt_sha256 === baseline.prompt_sha256,
    source_fixture_sha256_equal: candidate.source_fixture_sha256 === baseline.source_fixture_sha256,
    control_fingerprint_sha256_equal: candidate.control_fingerprint_sha256 === baseline.control_fingerprint_sha256,
    codex_model_effort_sandbox_image_equal: candidate.control_fingerprint_sha256 === baseline.control_fingerprint_sha256,
    auth_bytes_equal: candidate.auth_bytes_match_source && baseline.auth_bytes_match_source,
    only_declared_condition_delta: true,
    pass: parity
  },
  gates: {
    candidate_mechanical_witness: candidateWitness,
    baseline_absence_witness: baselineAbsence,
    condition_parity: parity,
    manifest_result_hash_validation: true
  },
  decision,
  results: cells.map(({ condition, result_path, result_sha256, result }) => ({
    condition,
    exit_code: result.exit_code,
    result_path,
    result_sha256,
    raw_trace_sha256: result.raw_trace_sha256,
    raw_output_sha256: result.raw_output_sha256
  })),
  notes: "Raw JSONL, raw output, auth, absolute host paths, and session identifiers remain local-only."
};
const manifestBytes = stableJson(manifest);
const manifestFile = path.join(publishRoot, "manifest.json");
fs.writeFileSync(manifestFile, manifestBytes);
fs.writeFileSync(path.join(publishRoot, "manifest.sha256"), `${sha256(manifestBytes)}  manifest.json\n`);
for (const cell of manifest.results) {
  const bytes = fs.readFileSync(path.join(repoRoot, cell.result_path));
  if (sha256(bytes) !== cell.result_sha256) throw new Error(`Published result hash mismatch: ${cell.result_path}`);
}
if (fs.readFileSync(path.join(publishRoot, "manifest.sha256"), "utf8").split(/\s+/)[0] !== sha256(fs.readFileSync(manifestFile))) throw new Error("Manifest sidecar hash mismatch.");
console.log(`Phase 1 ${hypothesis.id}: ${decision}; ${path.relative(repoRoot, manifestFile)}`);
