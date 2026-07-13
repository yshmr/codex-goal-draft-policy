# R-004 diagnosis and revision

HOME/USERPROFILE redirection did not change the Windows known user Skill directory used by this Codex build. Repository-local injection added the candidate but did not remove the real-profile same-name Skill.

Revision:

- discover the real-profile Skill path at runtime without committing it;
- pass the same `skills.config` disable entry to both conditions;
- keep repository-local candidate injection only for `with_skill`;
- parse command events and fail/classify contamination whenever the real-profile Skill path is read;
- apply the same disable entry to real `/goal` E2E execution.

The runtime path is local-only and is not written to public artifacts.
