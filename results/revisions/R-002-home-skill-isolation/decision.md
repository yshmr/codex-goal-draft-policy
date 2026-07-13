# R-002 decision

Status: pending clean rerun after isolation revision commit.

- Adopt the harness revision only if the with-Skill trace loads the isolated current Skill and the baseline has no Skill invocation evidence.
- Reject if real-profile Skill access recurs.
- Inconclusive if authentication or Codex startup fails under the isolated profile.
