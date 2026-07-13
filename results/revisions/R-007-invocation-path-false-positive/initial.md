# R-007 deterministic invocation false positive

Run: [`../../v2/runs/20260713060519-revision/manifest.json`](../../v2/runs/20260713060519-revision/manifest.json)

The grader reported `invocation_observed=true` because a command listed `.agents/skills/goal-draft-policy`, even though no `SKILL.md` content was read and the current marker was absent.

The run was already contaminated by explicit candidate absence, so no performance decision changes. The grader observation still requires its own revision history.
