# v2 result area

This directory contains committed, sanitized v2 evaluation results only.

- `runs/<run-id>/manifest.json`: paired `codex exec --json` result authority.
- `e2e/<run-id>/manifest.json`: separately approved real `/goal` E2E authority.
- `isolation/phase1/<run-id>/manifest.json`: bounded candidate-isolation probe authority.
- `revisions/<finding>/`: diagnosis, policy change, commit linkage, clean rerun, and adopt/reject/inconclusive decision.

Raw JSONL traces, stderr, isolated auth, work copies, task/session identifiers, and local absolute paths remain under ignored `.eval-work/`. Manifests retain their SHA-256 hashes.

Current snapshot:

- six paired run manifests are `contaminated`; the paired program decision is `INCONCLUSIVE`;
- Phase 1 isolation remediation is `REJECT hypothesis family` after two hypotheses/four cells; Phase 2 is not eligible;
- E2E-01 retains one `failed` probe, one `contaminated` development observation, and one valid `revision` result;
- E2E-02/E2E-03, critical n=3, and blind review are unexecuted.

See [`summary.md`](summary.md) and [`../authority-index.md`](../authority-index.md). An absent result means unexecuted, not passing.
