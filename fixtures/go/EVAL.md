# Frozen parser evaluation contract

- Population: the three cases in `cases.json`; do not add or remove cases during the run.
- Baseline: `parseBaseline`.
- Candidate: `parseCandidate`.
- Verification: `go test ./...` and, for descriptive timing only, `go test ./internal/parser -bench .`.
- Decision endings: adopt, reject, or inconclusive are all valid when supported by the frozen evidence.
- Constraints: public APIs and the scoring contract must not change during the evaluation.
