# v2 result summary

Recorded: 2026-07-13

## Decision snapshot

| Program area | Result | Authority |
|---|---|---|
| Pure validation | PASS: 31 cases, 8 fixtures | Local `npm test`; reproducible in pure CI |
| Paired `with_skill` / `without_skill` | INCONCLUSIVE | Six committed runs are `contaminated`; no valid paired comparison |
| Blind subjective review | UNEXECUTED | No scores claimed |
| Critical n=3 provider cases | UNEXECUTED | Condition isolation failed before full matrix |
| Real `/goal` E2E-01 | PASS on revision | [`revision` manifest](e2e/20260713062403-e2e-01-interactive-revision/manifest.json) |
| Real `/goal` E2E-02 / E2E-03 | UNEXECUTED | Contracts and fixtures only |

No statistical significance, population-level superiority, or general Codex reliability claim is supported.

## Paired evaluation outcome

Ten provider cells across six manifests were retained as contaminated while isolating candidate and ambient Skills under Codex CLI 0.143.0. The sequence exposed stale global Skill loading, candidate non-discovery under redirected homes, failure of explicit config and Git-root discovery hypotheses, and one invocation-path grader false positive. The grader regression was fixed, but no contaminated output was promoted.

The final program decision is `INCONCLUSIVE`: a clean candidate-only Skill condition was not demonstrably invoked without mutating or replacing the user's installed global Skill. The project stopped rather than manufacturing a favorable comparison. See [`R-002` through `R-007`](../revisions/README.md) and the manifests under [`runs/`](runs/).

## Goal E2E outcome

E2E-01 followed a failure-preserving sequence:

1. [`failed` non-interactive probe](e2e/20260713060812-e2e-01-initial/manifest.json): no actual Goal lifecycle evidence; not relabeled as E2E.
2. [`contaminated` development observation](e2e/20260713061043-e2e-01-interactive/manifest.json): interactive activation succeeded, but the capture method was not yet committed and the objective was not byte-identical.
3. [`revision` clean rerun](e2e/20260713062403-e2e-01-interactive-revision/manifest.json): exact approved objective activated through `/goal`; TUI showed `Goal achieved`; a fresh `node verify.mjs` exited 0; `verify.mjs` hashes before/after matched.

The valid result records Codex CLI 0.143.0, `gpt-5.4`, medium effort, repository commit, fixture and approved Goal hashes, usage, exit code, raw trace/output hashes, sanitized final output, and post-verification. The rendered terminal label is an explicit human observation because the tested session JSONL contained activation and task completion but not the rendered label.

## Local fixture command coverage

- Node fixture: `npm test` and `npm run lint` executed and passed.
- Monorepo fixture: root `npm test`, `npm run test:api`, and API workspace test executed and passed.
- Node E2E verifier: executed and passed.
- Python fixture: `python -m compileall src` passed; `python -m pytest` was unavailable because `pytest` was not installed.
- Go fixture test: not executed because the Go toolchain was unavailable.

Unavailable commands are not counted as passes. Synthetic fixtures do not establish production behavior.
