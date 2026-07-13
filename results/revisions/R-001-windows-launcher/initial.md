# R-001 initial harness failure

Date: 2026-07-13

Command intent: execute paired T-01 smoke with `codex exec --json` after the v2 predeclared commit.

Observed result: the runner stopped before starting Codex. Node 24 on Windows returned `spawnSync codex.cmd EINVAL` while obtaining `codex --version`.

Authority: harness execution failure, not a model/Skill evaluation result. No result manifest or provider output was created, so T-01 remains unexecuted at this authority.

Immutable boundary: this failure is retained even if the portability fix reruns successfully.
