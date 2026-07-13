# v2 bounded evidence-program closeout

Recorded: 2026-07-13

Final status: **`CLOSED — IMPLEMENTATION RETAINED; COMPARATIVE CLAIM WITHHELD`**

This is the final documentation-only authority for the v2 evidence program. It closes the program without provider/evaluation reruns, result substitution, rescoring, or retrospective relabeling. It separates implementation readiness from empirical support; it does not adopt a candidate-versus-baseline result.

## Authority chain

Authority is read in this order:

1. The frozen evaluation method: [`v2-predeclared.json`](../../evals/contracts/v2-predeclared.json) and the Phase [`1`](../../evals/contracts/phase1-isolation.json), [`2`](../../evals/contracts/phase2-mechanical-witness.json), and [`3`](../../evals/contracts/phase3-structured-action-witness.json) contracts.
2. The six immutable paired manifests indexed in the [`authority index`](../authority-index.md): all are contaminated; their program decision remains `INCONCLUSIVE`.
3. The immutable isolation authorities: Phase 1 [`REJECT hypothesis family`](isolation/phase1/summary.md), Replacement Phase 2 [`REJECT`](isolation/phase2/summary.md), and Final Remediation Phase 3 [`REJECT`](isolation/phase3/summary.md).
4. The E2E-01 chain: [`failed`](e2e/20260713060812-e2e-01-initial/manifest.json), [`contaminated`](e2e/20260713061043-e2e-01-interactive/manifest.json), then the exact-objective [`revision`](e2e/20260713062403-e2e-01-interactive-revision/manifest.json) authority.
5. The immutable revision decisions [`R-002` through `R-014`](../revisions/README.md), especially the exact-objective gate in [`R-009`](../revisions/R-009-exact-goal-objective/decision.md) and the final rejection/prohibition in [`R-014`](../revisions/R-014-phase3-parity-path-separator/decision.md).

This closeout narrows publication claims; it does not modify, delete, supersede, or reinterpret any earlier authority.

## Proved within the retained scope

- The repository contains an installable candidate Skill, schemas, pure validators, synthetic fixtures, provider runner, safety controls, and a documented predeclared evaluation design. This is an implementation/readiness fact, not a performance comparison.
- Pure validation passes for 31 cases across 8 fixtures. That evidence supports only the validated schema, fixture-integrity, deterministic-grading, link, result/hash, and public-safety surfaces exercised by the validator.
- The Phase 3 detector's 17 pure fixtures pass. That evidence supports only the detector behavior represented by those fixtures.
- The E2E-01 revision authority supports one exact bounded objective: byte-identical activation, a human-observed achieved terminal state, fresh verifier exit 0, and an unchanged verifier. It does not generalize beyond that objective, recorded configuration, and synthetic fixture.

## Observed but not adopted

- Within the single normal Phase 3 pair, the candidate structured source read preceded a separate completed action with exact 42-byte output. Baseline absence, outer boundary, artifact/hash, public-safety, and freshness gates also passed.
- That observation is retained, but the frozen Windows-backslash versus normalized-slash inventory parity gate failed. The pair therefore remains `REJECT`; the isolation method is not `ADOPT`, and the observation is not a valid paired comparison.
- The six paired provider runs remain useful audit observations about contamination and isolation failure. They are not evidence that either condition is better.

## Not proved

- A valid candidate-versus-baseline paired comparison.
- Skill-quality superiority, improved triggering, improved draft quality, or generalization.
- Critical stochastic cases at n=3 or blind subjective review.
- E2E-02 blocker handling or E2E-03 unbiased decision behavior.
- Reliability across arbitrary prompts, models, versions, repositories, environments, or production use.

## Not authorized

- Further isolation remediation, additional hypotheses, retry, reorder, replacement, or detector/runner changes intended to repair these results.
- Paired smoke, the full 16-trigger/12-quality provider matrix, critical n=3, blind review, or any E2E provider/Goal lifecycle run under this program.
- Post-hoc path normalization, rescoring, result substitution, passing reinterpretation, or relabeling an earlier failed, contaminated, inconclusive, or rejected authority.

Any future empirical work requires new explicit user authority and a new predeclared contract. It cannot continue this closed program automatically.

## Publication boundary

Portfolio-safe claims:

- This repository demonstrates implementation of a review-before-activation Skill, a documented evaluation design, pure validation, synthetic detector tests, and safety/hash controls.
- It demonstrates a failure-preserving audit method: contaminated and rejected runs remain visible rather than being replaced by a favorable rerun.
- It records bounded E2E-01 evidence for the exact approved objective described above.
- The unsuccessful comparative program is evidence of evaluation integrity, reproducibility discipline, and an explicit claim boundary—not proof of product superiority.

Withheld/prohibited claims:

- “The Codex Skill is proved better than baseline.”
- Claims of trigger improvement, draft-quality improvement, comparative adoption, statistical significance, production reliability, or broad generalization.
- Treating unexecuted work, a contaminated run, an individual passing gate, or E2E-01 as a substitute for the missing paired comparison.

## Immutable artifact inventory

At closeout start (`ed741a0`), a local-only SHA-256 inventory covered 154 tracked files: the production Skill; evaluation contracts, schemas, and cases; all synthetic fixtures; existing runner/detector/validator code and detector tests; every published v2 paired/E2E/isolation manifest, result, and hash sidecar; and all R-002–R-014 authority files.

The sorted inventory used repository-relative paths and lowercase file SHA-256 values encoded as UTF-8 with LF separators and no final newline. Its aggregate SHA-256 is `ba3cd24ad54b74ac2ad2dcd913e80cdee2bbfd6eb82b50733137ffbe7dde4b21`. Post-closeout validation confirmed the same 154 paths and byte hashes. The detailed local inventory is intentionally not published; this aggregate records preservation without exposing host paths or private material.

The files changed by closeout are limited to this new authority and short navigation/status updates in [`README.md`](../../README.md), [`authority-index.md`](../authority-index.md), [`summary.md`](summary.md), and [`provenance-v2.md`](../../docs/provenance-v2.md). None is an earlier raw result, contract, manifest, hash sidecar, detector/runner, fixture, production Skill, or R-002–R-014 authority.

## Archive handoff

- Transition mode: `archive`
- Next phase/task/goal: `null`
- Automatic future work: prohibited
- Reopen condition: new explicit user authority plus a new contract

The evidence program ends at this boundary. Publication should point to this file as the canonical final authority.
