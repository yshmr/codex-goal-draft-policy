import fs from "node:fs";
import path from "node:path";
import { allCases, readJson, repoRoot, resolveCodexInvocation, sha256, stableJson, treeDigest, walkFiles } from "./lib.mjs";

const updateFixtures = process.argv.includes("--update-fixtures");
const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };
const relative = (file) => path.relative(repoRoot, file).split(path.sep).join("/");

function validateSkill() {
  const file = path.join(repoRoot, "skill", "goal-draft-policy", "SKILL.md");
  const text = fs.readFileSync(file, "utf8");
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  check(Boolean(match), "SKILL.md: missing YAML frontmatter");
  if (match) {
    check(/^name:\s*goal-draft-policy\s*$/m.test(match[1]), "SKILL.md: invalid or missing name");
    check(/^description:\s*\S.+$/m.test(match[1]), "SKILL.md: invalid or missing description");
  }
  const metadata = fs.readFileSync(path.join(repoRoot, "skill", "goal-draft-policy", "agents", "openai.yaml"), "utf8");
  check(/allow_implicit_invocation:\s*true/.test(metadata), "agents/openai.yaml: implicit invocation policy must be explicit");
  check(/display_name:\s*".+"/.test(metadata), "agents/openai.yaml: display_name missing");
}

const knownChecks = new Set([
  "skill_invocation", "repository_inspection", "real_command", "draft_only_stop", "public_safety",
  "valid_decision_endings", "no_threshold_invention", "blocked_condition", "contract_freeze",
  "bounded_investigation", "already_achieved_discipline", "no_invented_repository", "monorepo_scope",
  "ci_mismatch", "healthy_goal_preservation", "no_premature_blocker"
]);

function validateCases() {
  const cases = allCases();
  const ids = new Set();
  for (const item of cases) {
    check(/^(T|Q|E2E)-\d{2}$/.test(item.id || ""), `${item.id || "<missing>"}: invalid case ID`);
    check(!ids.has(item.id), `${item.id}: duplicate case ID`);
    ids.add(item.id);
    check(["trigger", "quality", "e2e"].includes(item.suite), `${item.id}: invalid suite`);
    check(typeof item.prompt === "string" && item.prompt.length >= 10, `${item.id}: prompt too short`);
    check(["trigger", "no_trigger", "explicit_trigger", "not_applicable"].includes(item.expected_trigger), `${item.id}: invalid expected_trigger`);
    check(Number.isInteger(item.repetitions) && item.repetitions >= 1 && item.repetitions <= 3, `${item.id}: repetitions outside 1..3`);
    check(Array.isArray(item.checks) && item.checks.length > 0, `${item.id}: checks missing`);
    for (const name of item.checks || []) check(knownChecks.has(name), `${item.id}: unknown check ${name}`);
    check(fs.existsSync(path.join(repoRoot, "fixtures", item.fixture)), `${item.id}: fixture ${item.fixture} missing`);
  }
  const triggerCount = cases.filter((item) => item.suite === "trigger").length;
  check(triggerCount >= 10 && triggerCount <= 20, `trigger set must contain 10..20 cases; found ${triggerCount}`);
  check(cases.filter((item) => item.suite === "quality").length >= 10, "quality set must contain at least 10 cases");
  for (const required of ["Q-01", "Q-02", "Q-03", "Q-04", "Q-05", "Q-06", "Q-07", "Q-08", "Q-09"]) {
    check(ids.has(required), `required quality coverage case missing: ${required}`);
  }
  return cases;
}

function fixtureManifestValue(cases) {
  const names = [...new Set(cases.map((item) => item.fixture))].sort();
  return {
    schema_version: "1.0",
    algorithm: "sha256(path\\0bytes\\0file_sha256\\n)",
    fixtures: names.map((name) => ({ name, ...treeDigest(path.join(repoRoot, "fixtures", name)) }))
  };
}

function validateFixtures(cases) {
  const file = path.join(repoRoot, "fixtures", "manifest.json");
  const expected = stableJson(fixtureManifestValue(cases));
  if (updateFixtures) fs.writeFileSync(file, expected);
  check(fs.existsSync(file), "fixtures/manifest.json missing; run npm run fixtures:update");
  if (fs.existsSync(file)) check(fs.readFileSync(file, "utf8") === expected, "fixtures/manifest.json is stale; run npm run fixtures:update");
}

function validateSchemasAndContract() {
  for (const file of walkFiles(path.join(repoRoot, "evals", "schemas"))) {
    try { readJson(path.join(repoRoot, "evals", "schemas", file)); }
    catch (error) { errors.push(`${file}: invalid schema JSON: ${error.message}`); }
  }
  const contract = readJson(path.join(repoRoot, "evals", "contracts", "v2-predeclared.json"));
  check(contract.authority === "predeclared-before-provider-execution", "v2 contract authority is not predeclared");
  check(contract.conditions?.join(",") === "with_skill,without_skill", "v2 contract must define paired conditions");
  check(contract.controlled_variables?.model && contract.controlled_variables?.effort, "v2 contract model/effort missing");
  check(contract.valid_program_decisions?.join(",") === "adopt,reject,inconclusive", "v2 valid program decisions changed");
}

function validateMarkdownLinks() {
  const files = walkFiles(repoRoot, { exclude: [".git", ".eval-work", "node_modules"] }).filter((file) => file.endsWith(".md"));
  for (const file of files) {
    const absolute = path.join(repoRoot, file);
    const text = fs.readFileSync(absolute, "utf8");
    for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      let target = match[1].trim().replace(/^<|>$/g, "").split("#")[0];
      if (!target || /^(?:https?:|mailto:)/i.test(target)) continue;
      target = decodeURIComponent(target);
      const resolved = path.resolve(path.dirname(absolute), target);
      check(fs.existsSync(resolved), `${file}: broken Markdown link ${match[1]}`);
    }
  }
}

function validatePublicSafety() {
  const windowsHome = new RegExp("[A-Za-z]:\\\\" + "Users\\\\[^\\\\\\s]+", "i");
  const unixHome = new RegExp("/(?:home|Users)/[^/\\s]+/");
  const secret = new RegExp("(?:sk-[A-Za-z0-9_-]{12,}|api[_-]?key\\s*[:=]\\s*[^<\\s]+|authorization:\\s*bearer)", "i");
  const privateId = new RegExp("(?:source_)?(?:thread|task)[_-]?id\\s*[:=]\\s*[0-9a-f-]{20,}", "i");
  const files = walkFiles(repoRoot, { exclude: [".git", ".eval-work", "node_modules"] });
  for (const file of files) {
    const absolute = path.join(repoRoot, file);
    const bytes = fs.readFileSync(absolute);
    if (bytes.includes(0)) continue;
    const text = bytes.toString("utf8");
    check(!windowsHome.test(text), `${file}: local Windows home path detected`);
    check(!unixHome.test(text), `${file}: local Unix/macOS home path detected`);
    check(!secret.test(text), `${file}: possible credential detected`);
    check(!privateId.test(text), `${file}: task/thread identifier detected`);
  }
}

function validatePublishedResults() {
  const runs = path.join(repoRoot, "results", "v2", "runs");
  if (fs.existsSync(runs)) {
    for (const file of walkFiles(runs).filter((name) => name.endsWith("manifest.json"))) {
      const manifestFile = path.join(runs, file);
      const manifest = readJson(manifestFile);
      check(manifest.schema_version === "2.0", `${file}: manifest schema version`);
      check(/^[a-f0-9]{40}$/.test(manifest.skill_commit || ""), `${file}: invalid skill commit`);
      check(/^[a-f0-9]{64}$/.test(manifest.contract_sha256 || ""), `${file}: invalid contract hash`);
      for (const entry of manifest.results || []) {
        const resultFile = path.join(repoRoot, entry.result_path);
        check(fs.existsSync(resultFile), `${file}: missing result ${entry.result_path}`);
        if (!fs.existsSync(resultFile)) continue;
        const bytes = fs.readFileSync(resultFile);
        check(sha256(bytes) === entry.result_sha256, `${file}: result hash mismatch ${entry.result_path}`);
        const result = JSON.parse(bytes.toString("utf8"));
        check(result.schema_version === "2.0", `${entry.result_path}: result schema version`);
        check(sha256(result.final_output) === result.output_sha256, `${entry.result_path}: final output hash mismatch`);
        check(result.case_id === entry.case_id && result.condition === entry.condition && result.repetition === entry.repetition, `${entry.result_path}: manifest identity mismatch`);
        check(/^[a-f0-9]{64}$/.test(result.raw_trace_sha256 || ""), `${entry.result_path}: raw trace hash invalid`);
      }
    }
  }

  const e2e = path.join(repoRoot, "results", "v2", "e2e");
  if (!fs.existsSync(e2e)) return;
  for (const file of walkFiles(e2e).filter((name) => name.endsWith("manifest.json"))) {
    const manifest = readJson(path.join(e2e, file));
    check(manifest.schema_version === "2.0-e2e-manifest", `${file}: E2E manifest schema version`);
    const resultFile = path.join(repoRoot, manifest.result_path || "");
    check(fs.existsSync(resultFile), `${file}: missing E2E result ${manifest.result_path}`);
    if (!fs.existsSync(resultFile)) continue;
    const bytes = fs.readFileSync(resultFile);
    check(sha256(bytes) === manifest.result_sha256, `${file}: E2E result hash mismatch`);
    const result = JSON.parse(bytes.toString("utf8"));
    check(result.schema_version === "2.0-e2e", `${manifest.result_path}: E2E result schema version`);
    check(/^[a-f0-9]{64}$/.test(result.approved_goal_sha256 || ""), `${manifest.result_path}: approved Goal hash invalid`);
  }
}

validateSkill();
const cases = validateCases();
validateFixtures(cases);
validateSchemasAndContract();
validateMarkdownLinks();
validatePublicSafety();
validatePublishedResults();
const launcher = resolveCodexInvocation();
if (process.platform === "win32" && launcher.strategy === "node-entrypoint") {
  check(fs.existsSync(launcher.command) && fs.existsSync(launcher.prefix[0]), "Windows Codex node entrypoint resolution failed");
}

if (errors.length) {
  console.error(`Pure validation failed (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Pure validation passed: ${cases.length} cases, ${new Set(cases.map((item) => item.fixture)).size} fixtures.`);
