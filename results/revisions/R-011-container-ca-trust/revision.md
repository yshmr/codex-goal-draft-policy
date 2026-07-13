# R-011 runner revision

Install the Debian `ca-certificates` package in the derived runtime image before installing the already-pinned Codex package. The base image digest, Codex version, model, effort, prompt, fixture, sandbox, witness, mount boundary, condition order, and maximum-trial contract remain unchanged.

H1 is not retried. After this runner change is committed, only predeclared H2 may run, once per condition. A repeated infrastructure failure closes Phase 1 as `INCONCLUSIVE`.
