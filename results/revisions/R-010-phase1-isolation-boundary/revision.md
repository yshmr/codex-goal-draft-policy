# R-010 predeclared revision

Before provider execution, Phase 1 freezes H1 as a pinned Linux container with an empty HOME, per-cell `CODEX_HOME`, allowlisted mounts only, and repository-local candidate injection. H2 is a bounded ancestor-scan fallback only after H1 evidence is read.

The exact probe, marker, gates, metadata, order, and two-hypothesis/four-cell maximum are authority in [`../../../evals/contracts/phase1-isolation.json`](../../../evals/contracts/phase1-isolation.json). Raw traces and auth remain local-only.
