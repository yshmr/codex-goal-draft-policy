# Phase 1 candidate Skill isolation remediation

## Scope and inherited authority

This is a bounded evaluation task, not a Goal draft or Goal execution. It preserves R-002 through R-007 exactly as recorded and does not run the full paired matrix, E2E-02/03, critical n=3, or blind review.

The machine-readable authority is [`../evals/contracts/phase1-isolation.json`](../evals/contracts/phase1-isolation.json). It is committed before any Phase 1 provider cell. The exact prompt, fixture, model, effort, sandbox, Codex version, witness, condition order, hypotheses, and maximum trials are frozen there.

## Official surface verified before freeze

The current official Codex Skill documentation states that repository Skills are scanned from `.agents/skills` from CWD through repository root, that explicit `$skill` invocation and implicit description matching are distinct, and that `agents/openai.yaml` can disable only implicit invocation. The current CLI reference states that `codex exec --json` emits newline-delimited JSON events and that `--ignore-user-config` leaves authentication in `CODEX_HOME` while ignoring its config.

Sources:

- [Build skills](https://developers.openai.com/codex/skills)
- [CLI reference](https://developers.openai.com/codex/cli/reference)

## Hypothesis family

H1 moves the evaluation across a process/filesystem boundary: a pinned Linux container receives only the synthetic repository and a per-cell `CODEX_HOME`. The host user profile, `~/.agents/skills`, and global config are not mounted. The candidate cell receives the committed Skill at the documented repository location with one fixed HTML-comment witness; baseline receives no `.agents/skills` tree.

H2 is allowed only after reading a clean H1 failure. It keeps the same container boundary but launches from a nested CWD to test the documented repository-root ancestor scan. No parameter retry or output replacement is allowed.

## Gates

Candidate invocation is not inferred from prose style. It requires an exact repository `SKILL.md` read in a JSONL command event plus the predeclared non-semantic marker in the structured trace. Baseline requires an empty Skill inventory, no matching source read, no marker, and the same allowlisted mounts without a host profile. Parity covers prompt, source fixture, Codex version, model, effort, sandbox, image, auth bytes, and container arguments; only candidate injection may differ.

`ADOPT` requires all four completion gates in a fresh post-contract-commit pair. A normal pair that misses a gate is `REJECT`; infrastructure/auth/provider/event failure is `INCONCLUSIVE`.
