# Result authority index

## Historical v1

- Authority: [`v1-evaluation.md`](v1-evaluation.md)
- Recorded: 2026-07-09
- Decision: `KEEP v1`
- Scope: manual behavioral evaluation in representative external repositories/worktrees.
- Immutable findings: T06 initial major failure; T06 policy revision; T06 clean retest PASS; T06-E PASS; O-01/O-02/O-03 monitor-only observations.
- Limitation: raw trace, manifest, fixture SHA, and automated grader were not recorded. v2 does not reconstruct them.

## v2 predeclared authority

- Contract: [`../evals/contracts/v2-predeclared.json`](../evals/contracts/v2-predeclared.json)
- Case sets: `evals/cases/*.jsonl`
- Fixture integrity: `fixtures/manifest.json`
- Status: frozen before provider-backed execution.
- Interpretation: method authority only; not a performance result.

## v2 run authorities

Each run must live in `results/v2/runs/<run-id>/manifest.json`. The manifest's `authority` is one of:

- `initial`: first clean run against a frozen commit;
- `revision`: clean rerun after a diagnosed policy/grader revision and new commit;
- `superseded`: valid historical method/result replaced for future decisions, never deleted;
- `failed`: execution or provider failure prevented a valid observation;
- `contaminated`: prompt, fixture, condition isolation, raw handling, or contract freeze was violated;
- `inconclusive`: valid evidence exists but does not support adopt/reject.

Current paired authorities are all contaminated; none supports a with/without comparison:

- [`20260713054519-revision`](v2/runs/20260713054519-revision/manifest.json): stale ambient Skill loaded in the candidate condition.
- [`20260713055020-revision`](v2/runs/20260713055020-revision/manifest.json): redirected-home candidate not discovered.
- [`20260713055411-revision`](v2/runs/20260713055411-revision/manifest.json): repository candidate found only after ambient Skill loading.
- [`20260713055858-revision`](v2/runs/20260713055858-revision/manifest.json): ambient Skill disabled, but candidate absent.
- [`20260713060246-revision`](v2/runs/20260713060246-revision/manifest.json): explicit candidate enable did not establish invocation.
- [`20260713060519-revision`](v2/runs/20260713060519-revision/manifest.json): Git-root discovery hypothesis failed; invocation path false positive diagnosed separately.

Program decision: `INCONCLUSIVE`. Ten contaminated cells are preserved, and no critical n=3 matrix or blind subjective review was run.

## Phase 1 isolation remediation authority

The bounded follow-up is separate from the full paired matrix and preserves all earlier run labels.

- Predeclared design/contract: [`../evals/contracts/phase1-isolation.json`](../evals/contracts/phase1-isolation.json)
- H1 [`20260713065021-h1-container-cwd-repository-skill`](v2/isolation/phase1/20260713065021-h1-container-cwd-repository-skill/manifest.json): `INCONCLUSIVE`; candidate and baseline exited before model output because the container lacked native root CAs.
- H2 [`20260713065345-h2-container-repo-root-ancestor-scan`](v2/isolation/phase1/20260713065345-h2-container-repo-root-ancestor-scan/manifest.json): `REJECT`; baseline absence, parity, and hash validation passed, but candidate mechanical witness failed.
- Final summary: [`v2/isolation/phase1/summary.md`](v2/isolation/phase1/summary.md)
- Revision chain: [`R-010`](revisions/R-010-phase1-isolation-boundary/), [`R-011`](revisions/R-011-container-ca-trust/), [`R-012`](revisions/R-012-candidate-witness-unavailable/)

Phase 1 decision: `REJECT hypothesis family` after two hypotheses/four cells. No passing comparison was created, and Phase 2 paired smoke is not eligible to start.

## E2E authority

E2E results live separately under `results/v2/e2e/`:

- [`20260713060812-e2e-01-initial`](v2/e2e/20260713060812-e2e-01-initial/manifest.json): `failed`; no actual Goal activation.
- [`20260713061043-e2e-01-interactive`](v2/e2e/20260713061043-e2e-01-interactive/manifest.json): `contaminated`; pre-revision method and non-identical objective.
- [`20260713062403-e2e-01-interactive-revision`](v2/e2e/20260713062403-e2e-01-interactive-revision/manifest.json): valid `revision`; exact activation, achieved observation, fresh verifier pass.

E2E-02 and E2E-03 are unexecuted. A normal task execution without actual Goal lifecycle evidence is not a `/goal` E2E result.

## Revision rule

Initial failures and contaminated runs remain visible. A passing revision links back to diagnosis and the earlier authority; it never overwrites the earlier files or changes their labels retrospectively.
