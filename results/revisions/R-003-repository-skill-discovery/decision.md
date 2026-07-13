# R-003 decision

Status: `ADOPT` repository-local discovery, but do not adopt the run as a paired evaluation.

- Evidence: run `20260713055411-revision` read the current candidate marker from the copied fixture's `.agents/skills` path.
- Integrity boundary: the same with-Skill cell first read the stale Skill from the real profile, so the run is `contaminated` and invalid for comparison.
- Follow-up: R-004 disables the real-profile Skill and adds direct external-load detection.
