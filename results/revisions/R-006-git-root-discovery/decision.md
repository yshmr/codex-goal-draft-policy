# R-006 decision

Status: `REJECT` the Git-root discovery hypothesis for clean candidate invocation in this environment; provider comparison is `INCONCLUSIVE`.

- Evidence: run `20260713060519-revision` initialized a Git repository and exposed `.agents/skills`, but Codex did not read the candidate `SKILL.md`; it only found a reference file during normal repository inspection.
- Ambient real-profile Skill remained disabled and was not loaded.
- Decision: do not mutate or replace the user's installed global Skill merely to force a passing comparison. The paired provider comparison remains unexecuted/inconclusive under current clean-isolation constraints.
