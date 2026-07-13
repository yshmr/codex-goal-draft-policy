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

No current entry means no committed v2 provider-backed result exists.

## E2E authority

E2E results, when executed, live separately under `results/v2/e2e/`. A normal task execution without actual Goal lifecycle evidence is not a `/goal` E2E result.

## Revision rule

Initial failures and contaminated runs remain visible. A passing revision links back to diagnosis and the earlier authority; it never overwrites the earlier files or changes their labels retrospectively.
