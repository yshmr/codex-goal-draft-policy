# Failure-driven revisions

Historical v1 T06 failure remains in [`../v1-evaluation.md`](../v1-evaluation.md); it is not duplicated or rewritten here.

For v2, create one directory per new finding containing:

1. `initial.md` linking the immutable initial manifest/cell;
2. `diagnosis.md` separating output failure, grader failure, fixture defect, and contamination;
3. the case/contract revision commit SHA;
4. the Skill/policy revision commit SHA when applicable;
5. `decision.md` linking the clean rerun and recording adopt, reject, or inconclusive.

Do not replace the initial artifact with a passing rerun.

Current v2 histories:

- `R-001` through `R-007`: launcher and paired-condition isolation/grader findings.
- [`R-008-interactive-goal-transport`](R-008-interactive-goal-transport/): failed non-interactive Goal probe, committed interactive capture revision, and clean-rerun decision.
- [`R-009-exact-goal-objective`](R-009-exact-goal-objective/): rejected punctuation-loss activation and exact-objective rerun policy.
- [`R-010-phase1-isolation-boundary`](R-010-phase1-isolation-boundary/): inherited paired-isolation failure, boundary diagnosis, and predeclared container revision.
- [`R-011-container-ca-trust`](R-011-container-ca-trust/): immutable H1 infrastructure failure, root-CA diagnosis, and bounded H2 runner prerequisite revision.
- [`R-012-candidate-witness-unavailable`](R-012-candidate-witness-unavailable/): normal H2 pair, unavailable candidate mechanical witness, and maximum-trial rejection.
- [`R-013-phase2-exact-action-mismatch`](R-013-phase2-exact-action-mismatch/): normal Replacement Phase 2 pair, shell-wrapper exact-action mismatch, and no-retry witness-method rejection.
