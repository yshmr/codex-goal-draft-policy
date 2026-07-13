# v2 predeclared evaluation design

## Authority and freeze point

The machine-readable authority is [`../evals/contracts/v2-predeclared.json`](../evals/contracts/v2-predeclared.json). It must be committed before a provider-backed run. A run records that file's SHA and the Skill commit. Editing either requires a new commit and a new run authority.

## Questions

1. Does Codex invoke the Skill on explicit, implicit, contextual, Japanese, and existing-Goal review requests?
2. Does it avoid implicit invocation for combined execution, one-off work, planning, explanation questions, active Goal continuation, and near false positives?
3. Does the Skill inspect the supplied evidence and name real commands/artifacts?
4. Does the reviewed draft avoid activation, invented thresholds, biased decision endings, premature blockers, and scope substitution?
5. Does the Skill improve those checks compared with a no-Skill baseline under controlled settings?

## Design

- Conditions: `with_skill` and `without_skill`.
- Fixed controls: Codex version within a manifest; model `gpt-5.4`; effort `medium`; byte-identical prompt and fixture; read-only sandbox; ignored user config; ephemeral session.
- Fixture isolation: the runner copies a content-addressed fixture to local uncommitted work space for each cell.
- Skill isolation: the runner creates a temporary `CODEX_HOME`. Only `with_skill` receives this repository's Skill. Authentication is copied locally when available and is never committed.
- Repetitions: case-declared n, up to 3. Critical cases request n=3 when budget/access permit. Partial execution is labeled partial in reviewer interpretation.
- Order: case, condition, and repetition order is explicit in the manifest. This design does not claim order randomization.

## Case coverage

The trigger set has 16 cases in [`../evals/cases/trigger.jsonl`](../evals/cases/trigger.jsonl). The quality set has 12 cases in [`../evals/cases/quality.jsonl`](../evals/cases/quality.jsonl), including:

- fixed-target absence;
- unbiased comparison;
- bounded technical investigation;
- already-achieved target;
- no-repository evidence;
- monorepo command scope;
- CI/package mismatch;
- unavailable measurement;
- healthy Goal over-repair prevention;
- Node migration, Python release blocker, and Go API/population constraints.

Three E2E contracts in [`../evals/cases/e2e.jsonl`](../evals/cases/e2e.jsonl) cover achievable completion, concrete blocker, and unbiased decision.

## Deterministic grading

[`../scripts/grader.mjs`](../scripts/grader.mjs) checks:

- Skill load evidence consistent with expected routing;
- repository/artifact inspection;
- commands present in fixture metadata;
- draft-only stop and absence of mutation/activation evidence;
- unsupported numeric thresholds;
- adopt/reject/inconclusive endings;
- contract freeze language;
- concrete blocked conditions and no premature release blocker;
- no-repository and monorepo boundaries;
- public secrets, local home paths, and task/thread identifier patterns.

These are necessary checks, not semantic completeness proofs. Regex failure is an evaluation finding; it can indicate either output failure or grader insufficiency. Diagnose before revising policy.

## Subjective review

The existing 8-axis rubric remains the subjective quality contract: suitability, evidence grounding, outcome, verification, constraints, iteration, stopping, and scope discipline. `scripts/build-blind-review.mjs` hides condition labels and creates a mapping that remains under `.eval-work/` until reviews are frozen.

Subjective review is optional but must be reported as unexecuted when absent. It must not be replaced by an unblinded retrospective score.

## Gates and decisions

Predeclared gates are in the JSON contract. They include with-Skill routing accuracy, zero critical routing failures, zero deterministic major violations, deterministic quality pass rate, blind score if performed, and zero safety findings.

Program decisions are:

- `adopt`: the revision meets the applicable gates and no integrity issue invalidates the comparison;
- `reject`: the revision cleanly fails an applicable critical gate or introduces a regression;
- `inconclusive`: access, contamination, grader ambiguity, incomplete critical repetitions, or missing blind review prevents the intended claim.

No statistical significance is tested or claimed.

## Failure-driven revision contract

1. Commit the predeclared contract and Skill.
2. Run and publish the initial manifest without editing it.
3. If a failure appears, record diagnosis under `results/revisions/<finding>/`.
4. Add/adjust the regression case before or with policy revision.
5. Commit the revision.
6. Run a clean new manifest with `authority: revision`.
7. Record `adopt`, `reject`, or `inconclusive` without replacing the initial failure.

Passing reruns never overwrite failed, contaminated, or superseded authority.
