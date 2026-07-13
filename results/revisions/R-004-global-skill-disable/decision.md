# R-004 decision

Status: `REJECT` disable-only config as a complete paired-condition solution.

- Evidence: run `20260713055858-revision` showed no external Skill load, so the real-profile disable worked.
- Failure: explicit with-Skill T-01 also failed to expose the repository candidate. The same-name disable entry was insufficient by itself.
- Follow-up: R-005 adds an explicit enable entry for the candidate's exact repository-local path.
