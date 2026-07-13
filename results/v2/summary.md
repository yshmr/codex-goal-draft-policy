# v2 result summary

Recorded: 2026-07-13

## Decision snapshot

| Program area | Result | Authority |
|---|---|---|
| Pure validation | PASS: 31 cases, 8 fixtures | Local `npm test`; reproducible in pure CI |
| Paired `with_skill` / `without_skill` | INCONCLUSIVE | Six committed runs are `contaminated`; no valid paired comparison |
| Phase 1 isolation remediation | REJECT hypothesis family | Two hypotheses / four cells; candidate mechanical witness not established |
| Replacement Phase 2 mechanical witness | REJECT | One hypothesis / two normal cells; exact-action witness gate failed |
| Final Remediation Phase 3 structured action witness | REJECT | One pair / two normal cells; structured action passed, frozen inventory parity failed |
| Blind subjective review | UNEXECUTED | No scores claimed |
| Critical n=3 provider cases | UNEXECUTED | Condition isolation failed before full matrix |
| Real `/goal` E2E-01 | PASS on revision | [`revision` manifest](e2e/20260713062403-e2e-01-interactive-revision/manifest.json) |
| Real `/goal` E2E-02 / E2E-03 | UNEXECUTED | Contracts and fixtures only |

No statistical significance, population-level superiority, or general Codex reliability claim is supported.

## Phase 1 isolation remediation

The predeclared bounded follow-up ran two hypotheses with one candidate and one baseline cell each. H1 is `INCONCLUSIVE` because both cells stopped before model output when the slim container lacked root CAs. After preserving that failure and committing the CA prerequisite revision, H2 completed both cells under Codex CLI 0.143.0, `gpt-5.4`, medium effort, and a read-only sandbox.

H2 passed baseline absence, condition parity, and published manifest/result/hash validation. It failed candidate mechanical witness: JSONL had no exact repository `SKILL.md` read and no fixed marker. Candidate-specific prose was not promoted because output style was predeclared as insufficient. The family is `REJECT`, the maximum two hypotheses/four cells was reached, and Phase 2 is not eligible. See [`isolation/phase1/summary.md`](isolation/phase1/summary.md).

## Replacement Phase 2 mechanical witness remediation

One fresh post-contract candidate/baseline pair ran under an ephemeral outer Docker container with zero host mounts and the inner Codex sandbox disabled. Both cells exited 0 with normal JSONL. Baseline absence, outer-boundary, parity, artifact/hash, public-safety, and freshness gates passed.

The candidate read the derived Skill and later produced the fixed marker, but the shell wrapper escaped the command format string, so the structured command field did not contain the predeclared exact command substring. Because marker presence also occurred in the source-read output, it was not promoted by itself. The frozen candidate witness gate is false, the decision is `REJECT`, and no retry, normalization change, replacement, or paired smoke was run. See [`isolation/phase2/summary.md`](isolation/phase2/summary.md).

## Final Remediation Phase 3 structured action witness

The representation-independent detector was committed after its contract and before provider execution. All 17 synthetic detector tests passed, including two positive wrapper variants and the predeclared source-only, final-only, wrong-order, nonzero, incomplete, extra-byte, missing-source, and contaminated-baseline negatives.

One fresh candidate/baseline pair then ran in fixed order under the same mount-free outer boundary. Both cells were normal/exit 0. Candidate source ordinal 6 preceded a distinct action ordinal 9 that was completed/exit 0 and emitted exactly the fixed 42-byte marker+LF output with the expected hash; the action command field was not examined. Baseline absence, boundary, artifact/hash, public safety, and freshness passed.

Pair parity failed because the committed runner compared Windows backslash inventory strings with slash-normalized source records. Although the candidate file/tree hashes and baseline empty inventory were correct, the frozen parity gate is false. The normal pair is therefore `REJECT`; it is not normalized, rescored, or retried. Isolation remediation is closed, valid paired smoke remains ineligible, and only bounded evidence-program closeout selection remains. See [`isolation/phase3/summary.md`](isolation/phase3/summary.md).

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
