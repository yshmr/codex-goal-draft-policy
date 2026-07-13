# Final Remediation Phase 3 structured action witness result

Recorded: 2026-07-13

Decision: `REJECT`. The one predeclared pair ran candidate then baseline once each; both cells exited 0 with normal structured events. The candidate detector passed: one completed/exit-0 derived Skill source read at ordinal 6 preceded one distinct completed/exit-0 action at ordinal 9 whose output was exactly the fixed 42 UTF-8 bytes and expected SHA-256. The action command field was not examined. Baseline absence, mount-free outer boundary, artifact/hash, public-safety, and post-contract/post-detector freshness also passed.

Pair parity failed because the committed runner compared the Windows-local inventory strings containing backslash separators against the normalized source-tree records containing slash separators. The candidate derived tree/file hashes and baseline empty inventory were correct, but the frozen `only_declared_skill_directory_delta` boolean is false. Both cells were normal, so the predeclared decision is `REJECT`, not `INCONCLUSIVE`. No post-hoc normalization, rescoring, or retry is permitted.

Authority:

- Contract: [`../../../../evals/contracts/phase3-structured-action-witness.json`](../../../../evals/contracts/phase3-structured-action-witness.json)
- Detector: [`../../../../scripts/phase3-structured-action-detector.mjs`](../../../../scripts/phase3-structured-action-detector.mjs)
- Pure fixtures/tests: [`../../../../tests/phase3-structured-action-detector.test.mjs`](../../../../tests/phase3-structured-action-detector.test.mjs)
- Immutable manifest: [`20260713073139-h1-structured-source-then-action/manifest.json`](20260713073139-h1-structured-source-then-action/manifest.json)
- Revision: [`R-014`](../../../revisions/R-014-phase3-parity-path-separator/)

## Handoff

Phase 3 was the final isolation remediation. `ADOPT witness method` was not reached, so valid paired smoke is ineligible and no entry contract is created. Further isolation hypotheses, retries, replacements, detector changes, or remediations are prohibited. The next authorized decision is bounded evidence-program closeout selection using the preserved `REJECT`/`INCONCLUSIVE` authorities; it is not another provider experiment.
