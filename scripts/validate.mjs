import fs from "node:fs";
import path from "node:path";
import { allCases, readJson, repoRoot, resolveCodexInvocation, sha256, stableJson, treeDigest, walkFiles } from "./lib.mjs";
import { gradeRun } from "./grader.mjs";
import { canonicalLfBytes, portableDerivedTreeDigest, portableTreeDigest } from "./portable-source-hash.mjs";

const updateFixtures = process.argv.includes("--update-fixtures");
const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };
const relative = (file) => path.relative(repoRoot, file).split(path.sep).join("/");

function validateAgainstSchema(value, schema, label) {
  const deepEqual = (left, right) => JSON.stringify(left) === JSON.stringify(right);
  if (Object.hasOwn(schema, "const")) check(deepEqual(value, schema.const), `${label}: schema const mismatch`);
  if (schema.enum) check(schema.enum.some((item) => deepEqual(value, item)), `${label}: value outside schema enum`);
  if (schema.type) {
    const matches = schema.type === "array" ? Array.isArray(value)
      : schema.type === "object" ? value !== null && typeof value === "object" && !Array.isArray(value)
        : schema.type === "integer" ? Number.isInteger(value)
          : typeof value === schema.type;
    check(matches, `${label}: expected schema type ${schema.type}`);
    if (!matches) return;
  }
  if (typeof value === "string") {
    if (schema.minLength !== undefined) check(value.length >= schema.minLength, `${label}: shorter than minLength`);
    if (schema.pattern) check(new RegExp(schema.pattern).test(value), `${label}: pattern mismatch`);
    if (schema.format === "date-time") check(!Number.isNaN(Date.parse(value)), `${label}: invalid date-time`);
  }
  if (typeof value === "number") {
    if (schema.minimum !== undefined) check(value >= schema.minimum, `${label}: below minimum`);
    if (schema.maximum !== undefined) check(value <= schema.maximum, `${label}: above maximum`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined) check(value.length >= schema.minItems, `${label}: fewer than minItems`);
    if (schema.uniqueItems) check(new Set(value.map((item) => JSON.stringify(item))).size === value.length, `${label}: duplicate array item`);
    if (schema.items) value.forEach((item, index) => validateAgainstSchema(item, schema.items, `${label}[${index}]`));
  }
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    for (const name of schema.required || []) check(Object.hasOwn(value, name), `${label}: missing required property ${name}`);
    const properties = schema.properties || {};
    for (const [name, child] of Object.entries(value)) {
      if (properties[name]) validateAgainstSchema(child, properties[name], `${label}.${name}`);
      else if (schema.additionalProperties === false) check(false, `${label}: unexpected property ${name}`);
      else if (schema.additionalProperties && typeof schema.additionalProperties === "object") validateAgainstSchema(child, schema.additionalProperties, `${label}.${name}`);
    }
  }
}

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
  const caseSchema = readJson(path.join(repoRoot, "evals", "schemas", "case.schema.json"));
  const ids = new Set();
  for (const item of cases) {
    validateAgainstSchema(item, caseSchema, `case ${item.id || "<missing>"}`);
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

  const isolation = readJson(path.join(repoRoot, "evals", "contracts", "phase1-isolation.json"));
  check(isolation.authority === "predeclared-before-phase1-provider-execution", "Phase 1 contract authority is not predeclared");
  check(isolation.fixed_controls?.codex_version === "0.143.0", "Phase 1 Codex version changed");
  check(isolation.fixed_controls?.model && isolation.fixed_controls?.effort && isolation.fixed_controls?.prompt, "Phase 1 controls are incomplete");
  check(isolation.maximum_trials?.hypotheses <= 4, "Phase 1 exceeds four hypotheses");
  check(isolation.maximum_trials?.cells_per_hypothesis === 2 && isolation.maximum_trials?.repetitions_per_cell === 1, "Phase 1 cell/repetition bound changed");
  check(isolation.maximum_trials?.retry === false && isolation.maximum_trials?.reorder === false && isolation.maximum_trials?.replacement === false, "Phase 1 immutable trial policy changed");
  check(isolation.hypotheses?.length === isolation.maximum_trials?.hypotheses, "Phase 1 hypothesis count mismatch");
  check(isolation.mechanical_witness?.marker && isolation.mechanical_witness?.not_sufficient?.includes("final-output style"), "Phase 1 mechanical witness is incomplete");
}

function validatePhase1Isolation() {
  const root = path.join(repoRoot, "results", "v2", "isolation", "phase1");
  if (!fs.existsSync(root)) return;
  for (const file of walkFiles(root).filter((name) => name.endsWith("manifest.json"))) {
    const manifestFile = path.join(root, file);
    const manifestBytes = fs.readFileSync(manifestFile);
    const manifest = JSON.parse(manifestBytes.toString("utf8"));
    const sidecar = path.join(path.dirname(manifestFile), "manifest.sha256");
    check(fs.existsSync(sidecar), `${relative(manifestFile)}: manifest SHA sidecar missing`);
    if (fs.existsSync(sidecar)) check(fs.readFileSync(sidecar, "utf8").split(/\s+/)[0] === sha256(manifestBytes), `${relative(manifestFile)}: manifest SHA mismatch`);
    check(manifest.schema_version === "1.0-phase1-isolation-manifest", `${relative(manifestFile)}: Phase 1 manifest schema version`);
    check(["ADOPT", "REJECT", "INCONCLUSIVE"].includes(manifest.decision), `${relative(manifestFile)}: invalid Phase 1 decision`);
    check(manifest.results?.map((item) => item.condition).join(",") === "candidate,baseline", `${relative(manifestFile)}: Phase 1 condition order changed`);
    check(!walkFiles(path.dirname(manifestFile)).some((name) => /(?:trace\.jsonl|auth\.json|stderr\.txt|last-message\.txt)$/i.test(name)), `${relative(manifestFile)}: local-only artifact was published`);
    for (const entry of manifest.results || []) {
      const resultFile = path.join(repoRoot, entry.result_path || "");
      check(fs.existsSync(resultFile), `${relative(manifestFile)}: missing Phase 1 result ${entry.result_path}`);
      if (!fs.existsSync(resultFile)) continue;
      const bytes = fs.readFileSync(resultFile);
      check(sha256(bytes) === entry.result_sha256, `${entry.result_path}: Phase 1 result hash mismatch`);
      const result = JSON.parse(bytes.toString("utf8"));
      check(result.schema_version === "1.0-phase1-isolation-result", `${entry.result_path}: Phase 1 result schema version`);
      check(result.run_id === manifest.run_id && result.hypothesis_id === manifest.hypothesis_id && result.condition === entry.condition, `${entry.result_path}: Phase 1 identity mismatch`);
      check(/^[a-f0-9]{64}$/.test(result.raw_trace_sha256 || "") && /^[a-f0-9]{64}$/.test(result.raw_output_sha256 || ""), `${entry.result_path}: raw hash missing`);
      if (entry.condition === "candidate") check(/^[a-f0-9]{64}$/.test(result.instrumented_skill_sha256 || ""), `${entry.result_path}: instrumented candidate hash missing`);
      else check(result.instrumented_skill_sha256 === null, `${entry.result_path}: baseline unexpectedly records a candidate hash`);
      check(sha256(result.sanitized_output || "") === result.sanitized_output_sha256, `${entry.result_path}: sanitized output hash mismatch`);
      check(result.host_profile_mounted === false, `${entry.result_path}: host profile mount recorded`);
    }
    const expectedAdopt = Object.values(manifest.gates || {}).every(Boolean);
    check((manifest.decision === "ADOPT") === expectedAdopt, `${relative(manifestFile)}: Phase 1 decision/gate mismatch`);
  }
}

function validatePhase2MechanicalWitness() {
  const contractFile = path.join(repoRoot, "evals", "contracts", "phase2-mechanical-witness.json");
  const contract = readJson(contractFile);
  check(contract.authority === "predeclared-before-phase2-provider-execution", "Phase 2 contract authority is not predeclared");
  check(contract.fixed_controls?.codex_version === "0.143.0", "Phase 2 Codex version changed");
  check(contract.fixed_controls?.condition_order?.join(",") === "candidate,baseline", "Phase 2 condition order changed");
  check(contract.maximum_trials?.hypotheses === 1 && contract.maximum_trials?.total_cells === 2, "Phase 2 exceeds one hypothesis/two cells");
  check(contract.maximum_trials?.repetitions_per_cell === 1, "Phase 2 repetition bound changed");
  for (const key of ["retry", "reorder", "parameter_tuning", "additional_hypothesis", "replacement"]) {
    check(contract.maximum_trials?.[key] === false, `Phase 2 ${key} prohibition changed`);
  }
  check(contract.fixed_controls?.container_runtime?.mounts?.length === 0, "Phase 2 contract permits a mount");
  check(contract.fixed_controls?.runtime_image_id === "sha256:480f80aca635842cc14e032a63cd9ce0bbfebf2751dfa7e470d6840706efa813", "Phase 2 runtime image changed");
  check(contract.invocation_policy?.mode === "implicit only", "Phase 2 invocation mode changed");
  check(!contract.fixed_controls?.prompt?.includes("goal-draft-policy") && !contract.fixed_controls?.prompt?.includes(contract.invocation_policy?.marker), "Phase 2 baseline prompt leaks the candidate or marker");

  const root = path.join(repoRoot, "results", "v2", "isolation", "phase2");
  if (!fs.existsSync(root)) return;
  const manifests = walkFiles(root).filter((name) => name.endsWith("manifest.json"));
  check(manifests.length <= 1, "Phase 2 published more than one hypothesis manifest");
  for (const file of manifests) {
    const manifestFile = path.join(root, file);
    const manifestBytes = fs.readFileSync(manifestFile);
    const manifest = JSON.parse(manifestBytes.toString("utf8"));
    const manifestSidecar = manifestFile.replace(/\.json$/, ".sha256");
    check(fs.existsSync(manifestSidecar), `${relative(manifestFile)}: Phase 2 manifest sidecar missing`);
    if (fs.existsSync(manifestSidecar)) check(fs.readFileSync(manifestSidecar, "utf8").split(/\s+/)[0] === sha256(manifestBytes), `${relative(manifestFile)}: Phase 2 manifest hash mismatch`);
    check(manifest.schema_version === "1.0-phase2-mechanical-witness-manifest", `${relative(manifestFile)}: Phase 2 manifest schema version`);
    check(["ADOPT witness method", "REJECT", "INCONCLUSIVE"].includes(manifest.decision), `${relative(manifestFile)}: invalid Phase 2 decision`);
    check(manifest.results?.map((item) => item.condition).join(",") === "candidate,baseline", `${relative(manifestFile)}: Phase 2 result order changed`);
    check(manifest.results?.length === 2 && manifest.results.every((item) => item.repetition === 1), `${relative(manifestFile)}: Phase 2 cell/repetition bound changed`);
    check(manifest.contract_commit !== manifest.execution_commit, `${relative(manifestFile)}: Phase 2 pair is not post-contract`);
    check(manifest.outer_boundary?.mounts?.length === 0 && manifest.outer_boundary?.docker_socket_mounted === false, `${relative(manifestFile)}: Phase 2 outer boundary invalid`);
    check(!walkFiles(path.dirname(manifestFile)).some((name) => /(?:trace\.jsonl|stderr\.txt|auth\.json|last-message\.txt)$/i.test(name)), `${relative(manifestFile)}: local-only artifact was published`);
    for (const entry of manifest.results || []) {
      const resultFile = path.join(repoRoot, entry.result_path || "");
      const sidecar = path.join(repoRoot, entry.result_sidecar_path || "");
      check(fs.existsSync(resultFile), `${relative(manifestFile)}: missing Phase 2 result ${entry.result_path}`);
      check(fs.existsSync(sidecar), `${relative(manifestFile)}: missing Phase 2 result sidecar ${entry.result_sidecar_path}`);
      if (!fs.existsSync(resultFile)) continue;
      const bytes = fs.readFileSync(resultFile);
      check(sha256(bytes) === entry.result_sha256, `${entry.result_path}: Phase 2 result hash mismatch`);
      if (fs.existsSync(sidecar)) check(fs.readFileSync(sidecar, "utf8").split(/\s+/)[0] === entry.result_sha256, `${entry.result_sidecar_path}: Phase 2 sidecar hash mismatch`);
      const result = JSON.parse(bytes.toString("utf8"));
      check(result.schema_version === "1.0-phase2-mechanical-witness-result", `${entry.result_path}: Phase 2 result schema version`);
      check(result.run_id === manifest.run_id && result.hypothesis_id === manifest.hypothesis_id && result.condition === entry.condition, `${entry.result_path}: Phase 2 identity mismatch`);
      check(sha256(result.sanitized_output || "") === result.sanitized_output_sha256, `${entry.result_path}: Phase 2 sanitized output hash mismatch`);
      check(/^[a-f0-9]{64}$/.test(result.raw_trace_sha256 || "") && /^[a-f0-9]{64}$/.test(result.raw_output_sha256 || ""), `${entry.result_path}: Phase 2 raw hash missing`);
      if (entry.condition === "baseline") {
        check(result.skill_inventory?.length === 0, `${entry.result_path}: baseline Skill inventory is not empty`);
        check(!result.marker_in_trace && !result.marker_in_final_output, `${entry.result_path}: baseline marker contamination`);
        check(!result.candidate_source_or_action_in_trace && !result.candidate_source_or_action_in_final_output && !result.ambient_skill_read_observed, `${entry.result_path}: baseline candidate/ambient contamination`);
      }
    }
    const allGates = Object.values(manifest.gates || {}).every(Boolean);
    check((manifest.decision === "ADOPT witness method") === allGates, `${relative(manifestFile)}: Phase 2 ADOPT/gate mismatch`);
    if (manifest.decision === "REJECT") check(manifest.normal_pair === true && !allGates, `${relative(manifestFile)}: Phase 2 REJECT gate mismatch`);
    if (manifest.decision === "INCONCLUSIVE") check(manifest.normal_pair === false, `${relative(manifestFile)}: Phase 2 INCONCLUSIVE gate mismatch`);
  }
}

function validatePortableCandidateSource() {
  const fingerprint = readJson(path.join(repoRoot, "evals", "authority", "portable-source-fingerprint.json"));
  const phase2 = readJson(path.join(repoRoot, "evals", "contracts", "phase2-mechanical-witness.json"));
  const phase3 = readJson(path.join(repoRoot, "evals", "contracts", "phase3-structured-action-witness.json"));
  const rawHashFields = [
    "source_tree_sha256",
    "base_skill_file_sha256",
    "derived_skill_file_sha256",
    "derived_tree_sha256"
  ];

  check(fingerprint.schema_version === "1.0-portable-source-fingerprint", "portable source fingerprint schema changed");
  check(fingerprint.authority === "ci-portability-only-does-not-relabel-historical-results", "portable source fingerprint authority changed");
  for (const [label, contract] of [["phase2", phase2], ["phase3", phase3]]) {
    for (const field of rawHashFields) {
      check(
        fingerprint.historical_contract_raw_hashes?.[label]?.[field] === contract.candidate_test_copy?.[field],
        `${label}: historical raw candidate hash authority changed`
      );
    }
  }

  const source = path.join(repoRoot, "skill", "goal-draft-policy");
  const sourceTree = portableTreeDigest(source);
  const baseSkill = canonicalLfBytes(fs.readFileSync(path.join(source, "SKILL.md")));
  const expected = fingerprint.canonical_lf_hashes || {};
  check(sourceTree.sha256 === expected.source_tree_sha256, "portable source candidate tree hash changed");
  check(sha256(baseSkill) === expected.base_skill_file_sha256, "portable base SKILL.md hash changed");

  for (const [label, contract] of [["phase2", phase2], ["phase3", phase3]]) {
    const derivedSkill = Buffer.concat([baseSkill, Buffer.from(contract.candidate_test_copy.exact_append_utf8)]);
    const derivedTree = portableDerivedTreeDigest(sourceTree, derivedSkill);
    check(sha256(derivedSkill) === expected[`${label}_derived_skill_file_sha256`], `${label}: portable derived SKILL.md hash mismatch`);
    check(derivedTree.sha256 === expected[`${label}_derived_tree_sha256`], `${label}: portable derived candidate tree hash mismatch`);
  }
}

function validatePhase3StructuredActionWitness() {
  const contractFile = path.join(repoRoot, "evals", "contracts", "phase3-structured-action-witness.json");
  const contract = readJson(contractFile);
  check(contract.authority === "predeclared-before-phase3-detector-and-provider-execution", "Phase 3 contract authority is not predeclared");
  check(contract.phase_position?.last_isolation_remediation === true, "Phase 3 is not frozen as the final isolation remediation");
  check(contract.fixed_controls?.codex_version === "0.143.0", "Phase 3 Codex version changed");
  check(contract.fixed_controls?.condition_order?.join(",") === "candidate,baseline", "Phase 3 condition order changed");
  check(contract.maximum_trials?.pairs === 1 && contract.maximum_trials?.total_cells === 2, "Phase 3 exceeds one pair/two cells");
  check(contract.maximum_trials?.repetitions_per_cell === 1, "Phase 3 repetition bound changed");
  for (const key of ["retry", "reorder", "parameter_tuning", "additional_hypothesis", "replacement", "post_hoc_detector_change"]) {
    check(contract.maximum_trials?.[key] === false, `Phase 3 ${key} prohibition changed`);
  }
  check(contract.fixed_controls?.container_runtime?.mounts?.length === 0 && contract.fixed_controls?.container_runtime?.binds?.length === 0, "Phase 3 contract permits host filesystem exposure");
  check(contract.fixed_controls?.runtime_image_id === "sha256:480f80aca635842cc14e032a63cd9ce0bbfebf2751dfa7e470d6840706efa813", "Phase 3 runtime image changed");
  check(!contract.fixed_controls?.prompt?.includes("goal-draft-policy") && !contract.fixed_controls?.prompt?.includes(contract.detector?.action?.marker), "Phase 3 baseline prompt leaks the candidate or marker");
  check(contract.detector?.action?.command_field_examined === false, "Phase 3 action detector started examining command text");
  check(contract.detector?.action?.exact_output === `${contract.detector?.action?.marker}\n`, "Phase 3 exact action output changed");
  check(Buffer.byteLength(contract.detector.action.exact_output) === contract.detector.action.expected_utf8_bytes, "Phase 3 action byte length mismatch");
  check(sha256(contract.detector.action.exact_output) === contract.detector.action.expected_output_sha256, "Phase 3 action output hash mismatch");

  const root = path.join(repoRoot, "results", "v2", "isolation", "phase3");
  if (!fs.existsSync(root)) return;
  const manifests = walkFiles(root).filter((name) => name.endsWith("manifest.json"));
  check(manifests.length <= 1, "Phase 3 published more than one manifest");
  for (const file of manifests) {
    const manifestFile = path.join(root, file);
    const manifestBytes = fs.readFileSync(manifestFile);
    const manifest = JSON.parse(manifestBytes.toString("utf8"));
    const manifestSidecar = manifestFile.replace(/\.json$/, ".sha256");
    check(fs.existsSync(manifestSidecar), `${relative(manifestFile)}: Phase 3 manifest sidecar missing`);
    if (fs.existsSync(manifestSidecar)) check(fs.readFileSync(manifestSidecar, "utf8").split(/\s+/)[0] === sha256(manifestBytes), `${relative(manifestFile)}: Phase 3 manifest hash mismatch`);
    check(manifest.schema_version === "1.0-phase3-structured-action-witness-manifest", `${relative(manifestFile)}: Phase 3 manifest schema version`);
    check(["ADOPT witness method", "REJECT", "INCONCLUSIVE"].includes(manifest.decision), `${relative(manifestFile)}: invalid Phase 3 decision`);
    check(manifest.results?.map((item) => item.condition).join(",") === "candidate,baseline", `${relative(manifestFile)}: Phase 3 result order changed`);
    check(manifest.results?.length === 2 && manifest.results.every((item) => item.repetition === 1), `${relative(manifestFile)}: Phase 3 cell/repetition bound changed`);
    check(manifest.contract_commit !== manifest.execution_commit && manifest.detector_commit !== manifest.execution_commit, `${relative(manifestFile)}: Phase 3 pair is not post-contract/post-detector`);
    check(manifest.outer_boundary?.mounts?.length === 0 && manifest.outer_boundary?.binds?.length === 0 && manifest.outer_boundary?.docker_socket_mounted === false, `${relative(manifestFile)}: Phase 3 outer boundary invalid`);
    check(!walkFiles(path.dirname(manifestFile)).some((name) => /(?:trace\.jsonl|stderr\.txt|auth\.json|last-message\.txt)$/i.test(name)), `${relative(manifestFile)}: local-only artifact was published`);
    for (const entry of manifest.results || []) {
      const resultFile = path.join(repoRoot, entry.result_path || "");
      const sidecar = path.join(repoRoot, entry.result_sidecar_path || "");
      check(fs.existsSync(resultFile), `${relative(manifestFile)}: missing Phase 3 result ${entry.result_path}`);
      check(fs.existsSync(sidecar), `${relative(manifestFile)}: missing Phase 3 result sidecar ${entry.result_sidecar_path}`);
      if (!fs.existsSync(resultFile)) continue;
      const bytes = fs.readFileSync(resultFile);
      check(sha256(bytes) === entry.result_sha256, `${entry.result_path}: Phase 3 result hash mismatch`);
      if (fs.existsSync(sidecar)) check(fs.readFileSync(sidecar, "utf8").split(/\s+/)[0] === entry.result_sha256, `${entry.result_sidecar_path}: Phase 3 sidecar hash mismatch`);
      const result = JSON.parse(bytes.toString("utf8"));
      check(result.schema_version === "1.0-phase3-structured-action-witness-result", `${entry.result_path}: Phase 3 result schema version`);
      check(result.run_id === manifest.run_id && result.hypothesis_id === manifest.hypothesis_id && result.condition === entry.condition, `${entry.result_path}: Phase 3 identity mismatch`);
      check(sha256(result.sanitized_output || "") === result.sanitized_output_sha256, `${entry.result_path}: Phase 3 sanitized output hash mismatch`);
      check(/^[a-f0-9]{64}$/.test(result.raw_trace_sha256 || "") && /^[a-f0-9]{64}$/.test(result.raw_output_sha256 || ""), `${entry.result_path}: Phase 3 raw hash missing`);
      const serialized = stableJson(result);
      check(!/(?:raw_command|item_id|session_id|thread_id|task_id|source_thread_id)/i.test(serialized), `${entry.result_path}: Phase 3 published a private identifier/command field`);
      if (entry.condition === "candidate") check(result.candidate_detection?.pass === manifest.gates?.candidate_structured_action_witness, `${entry.result_path}: candidate detector/gate mismatch`);
      if (entry.condition === "baseline") check(result.baseline_detection?.pass === manifest.gates?.baseline_absence_witness, `${entry.result_path}: baseline detector/gate mismatch`);
    }
    const allGates = Object.values(manifest.gates || {}).every(Boolean);
    check((manifest.decision === "ADOPT witness method") === allGates, `${relative(manifestFile)}: Phase 3 ADOPT/gate mismatch`);
    if (manifest.decision === "REJECT") check(manifest.normal_pair === true && !allGates, `${relative(manifestFile)}: Phase 3 REJECT gate mismatch`);
    if (manifest.decision === "INCONCLUSIVE") check(manifest.normal_pair === false, `${relative(manifestFile)}: Phase 3 INCONCLUSIVE gate mismatch`);
  }
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
  const manifestSchema = readJson(path.join(repoRoot, "evals", "schemas", "manifest.schema.json"));
  const resultSchema = readJson(path.join(repoRoot, "evals", "schemas", "result.schema.json"));
  const runs = path.join(repoRoot, "results", "v2", "runs");
  if (fs.existsSync(runs)) {
    for (const file of walkFiles(runs).filter((name) => name.endsWith("manifest.json"))) {
      const manifestFile = path.join(runs, file);
      const manifest = readJson(manifestFile);
      validateAgainstSchema(manifest, manifestSchema, relative(manifestFile));
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
        validateAgainstSchema(result, resultSchema, entry.result_path);
        check(result.schema_version === "2.0", `${entry.result_path}: result schema version`);
        check(sha256(result.final_output) === result.output_sha256, `${entry.result_path}: final output hash mismatch`);
        check(result.case_id === entry.case_id && result.condition === entry.condition && result.repetition === entry.repetition, `${entry.result_path}: manifest identity mismatch`);
        check(/^[a-f0-9]{64}$/.test(result.raw_trace_sha256 || ""), `${entry.result_path}: raw trace hash invalid`);
      }
    }
  }

  const e2e = path.join(repoRoot, "results", "v2", "e2e");
  if (!fs.existsSync(e2e)) return;
  const e2eManifestSchema = readJson(path.join(repoRoot, "evals", "schemas", "e2e-manifest.schema.json"));
  const e2eResultSchema = readJson(path.join(repoRoot, "evals", "schemas", "e2e-result.schema.json"));
  for (const file of walkFiles(e2e).filter((name) => name.endsWith("manifest.json"))) {
    const manifest = readJson(path.join(e2e, file));
    validateAgainstSchema(manifest, e2eManifestSchema, `results/v2/e2e/${file}`);
    check(manifest.schema_version === "2.0-e2e-manifest", `${file}: E2E manifest schema version`);
    const resultFile = path.join(repoRoot, manifest.result_path || "");
    check(fs.existsSync(resultFile), `${file}: missing E2E result ${manifest.result_path}`);
    if (!fs.existsSync(resultFile)) continue;
    const bytes = fs.readFileSync(resultFile);
    check(sha256(bytes) === manifest.result_sha256, `${file}: E2E result hash mismatch`);
    const result = JSON.parse(bytes.toString("utf8"));
    validateAgainstSchema(result, e2eResultSchema, manifest.result_path);
    check(result.schema_version === "2.0-e2e", `${manifest.result_path}: E2E result schema version`);
    check(/^[a-f0-9]{64}$/.test(result.approved_goal_sha256 || ""), `${manifest.result_path}: approved Goal hash invalid`);
  }
}

function validateManualReviews() {
  const directory = path.join(repoRoot, "results", "v2", "manual-reviews");
  if (!fs.existsSync(directory)) return;
  const schema = readJson(path.join(repoRoot, "evals", "schemas", "manual-review.schema.json"));
  for (const file of walkFiles(directory).filter((name) => name.endsWith(".json"))) {
    validateAgainstSchema(readJson(path.join(directory, file)), schema, `results/v2/manual-reviews/${file}`);
  }
}

function validateGraderRegressions() {
  const pathListingOnly = gradeRun({
    caseDef: { expected_trigger: "explicit_trigger", checks: ["skill_invocation"], prompt: "$goal-draft-policy draft", allowed_commands: [], evidence_terms: [] },
    condition: "with_skill",
    traceText: '{"type":"command_execution","command":"Get-ChildItem .agents/skills/goal-draft-policy/SKILL.md"}',
    outputText: "A draft response without a Skill declaration.",
    expectedSkillMarker: "CURRENT-SKILL-MARKER"
  });
  check(pathListingOnly.invocation_observed === false, "grader regression: a Skill path listing must not count as invocation");
  check(pathListingOnly.contamination_findings.length === 1, "grader regression: explicit candidate absence must be condition contamination");
}

validateSkill();
const cases = validateCases();
validateFixtures(cases);
validateSchemasAndContract();
validateMarkdownLinks();
validatePublicSafety();
validatePublishedResults();
validatePhase1Isolation();
validatePortableCandidateSource();
validatePhase2MechanicalWitness();
validatePhase3StructuredActionWitness();
validateManualReviews();
validateGraderRegressions();
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
