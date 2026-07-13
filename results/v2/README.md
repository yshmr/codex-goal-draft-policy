# v2 result area

This directory contains committed, sanitized v2 evaluation results only.

- `runs/<run-id>/manifest.json`: paired `codex exec --json` result authority.
- `e2e/<run-id>/manifest.json`: separately approved real `/goal` E2E authority.
- `revisions/<finding>/`: diagnosis, policy change, commit linkage, clean rerun, and adopt/reject/inconclusive decision.

Raw JSONL traces, stderr, isolated auth, work copies, task/session identifiers, and local absolute paths remain under ignored `.eval-work/`. Manifests retain their SHA-256 hashes.

An empty result area means unexecuted, not passing.
