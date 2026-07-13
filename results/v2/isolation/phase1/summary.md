# Phase 1 isolation result

Recorded: 2026-07-13

## Decision

`REJECT hypothesis family`. Phase 1 did not establish an adoptable candidate-only isolation method, so Phase 2 paired smoke is not eligible to start.

## Trials

| Hypothesis | Cells | Result | Evidence |
|---|---:|---|---|
| H1 container CWD repository Skill | 1 candidate + 1 baseline | `INCONCLUSIVE` | Both exited 1 before model output because the slim image lacked native root CAs. |
| H2 container repo-root ancestor scan | 1 candidate + 1 baseline | `REJECT` | Both exited 0; baseline absence, parity, and hash gates passed; candidate mechanical witness failed. |

Total: 2 hypotheses, 4 cells, 1 repetition per cell, no retry/reorder/replacement.

## Evidence

- Predeclared authority: [`../../../../evals/contracts/phase1-isolation.json`](../../../../evals/contracts/phase1-isolation.json)
- H1 immutable manifest: [`20260713065021-h1-container-cwd-repository-skill/manifest.json`](20260713065021-h1-container-cwd-repository-skill/manifest.json)
- H2 immutable manifest: [`20260713065345-h2-container-repo-root-ancestor-scan/manifest.json`](20260713065345-h2-container-repo-root-ancestor-scan/manifest.json)
- Failure/diagnosis/revision chain: [`R-010`](../../../revisions/R-010-phase1-isolation-boundary/), [`R-011`](../../../revisions/R-011-container-ca-trust/), [`R-012`](../../../revisions/R-012-candidate-witness-unavailable/)

H2's candidate prose was candidate-specific, but the contract prohibited output-style inference. JSONL showed neither an exact candidate `SKILL.md` command read nor the fixed non-semantic marker. The baseline had no `.agents/skills` inventory, no candidate/ambient source read, no marker, and no host-profile mount. Prompt, fixture, CLI 0.143.0, model `gpt-5.4`, medium effort, read-only sandbox, runtime image, auth bytes, and container controls matched within the pair.

## Handoff

No Phase 2 entry conditions are provided because Phase 1 was not adopted. Full 16-trigger/12-quality paired evaluation, n=3, blind review, E2E-02/03, and all Goal E2E work remained unexecuted.

Any future isolation remediation must start under a new predeclared authority and address the inability to produce a falsifiable source-read/marker witness under the fixed sandbox. It must not reinterpret H2's prose as invocation evidence or alter R-002 through R-012.
