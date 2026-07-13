# R-002 diagnosis and revision

Root cause: `CODEX_HOME` isolates Codex configuration/auth state, but user Skills are discovered from `$HOME/.agents/skills`. The initial runner changed `CODEX_HOME` only and copied the candidate Skill into the wrong user-scope location.

Revision:

- create a separate isolated profile per cell;
- set both `HOME` and `USERPROFILE` for the Codex child process;
- install the candidate only at `<isolated-profile>/.agents/skills/goal-draft-policy` for `with_skill`;
- install no local candidate for `without_skill`;
- require a distinctive marker from the current committed Skill in a triggered with-Skill trace;
- automatically classify a run as contaminated if a baseline invokes a Skill or a triggered with-Skill cell lacks the current marker;
- apply the same profile isolation to the E2E runner.

The prompt, fixture, model, effort, and predeclared scoring gates remain unchanged.
