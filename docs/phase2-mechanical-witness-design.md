# Replacement Phase 2 mechanical witness remediation

Recorded: 2026-07-13

This bounded phase tests one replacement hypothesis in exactly two cells: candidate, then baseline, once each. The machine-readable authority is [`../evals/contracts/phase2-mechanical-witness.json`](../evals/contracts/phase2-mechanical-witness.json). It is committed before the runner and before either provider cell.

The ephemeral outer Docker container is the sole isolation boundary. Each stopped container receives a synthetic workspace and an auth-only per-run copy through `docker cp`; it receives no host mount, Docker socket, host profile, checkout, or arbitrary host directory. A preflight inspection must prove the empty mount set and fixed runtime controls before Codex starts. Only inside that boundary may Codex use `--dangerously-bypass-approvals-and-sandbox` to avoid the Phase 1 bubblewrap failure.

The candidate gets a byte-derived test copy of the committed Skill. Its only delta is the exact non-semantic `printf` probe instruction frozen in the contract. The baseline has no `.agents/skills` directory. The shared prompt does not name the Skill or marker, so activation is implicit; explicit invocation is prohibited.

`ADOPT` means only that the witness/isolation method worked. It requires the candidate command event and exact marker, baseline absence, boundary and pair parity, fresh post-contract execution, hashes, and public-safety validation. A normal pair without every witness gate is `REJECT`; infrastructure that prevents normal structured observation is `INCONCLUSIVE`. Either outcome stops this phase without retry or paired smoke.
