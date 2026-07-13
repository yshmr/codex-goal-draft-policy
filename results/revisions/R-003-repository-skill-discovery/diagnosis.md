# R-003 diagnosis and revision

Observed Codex 0.143.0 on Windows did not discover a user Skill from the child process's redirected HOME/USERPROFILE location. Official Skill documentation also defines repository-local discovery from `.agents/skills` in the working directory and its ancestors.

Revision:

- keep HOME/USERPROFILE isolation to suppress real-profile Skills;
- inject the candidate into the copied fixture's `.agents/skills/goal-draft-policy` directory for `with_skill` only;
- keep the source fixture SHA based on the pre-injection fixture tree;
- treat the injected Skill as the experimental condition, not fixture content;
- classify an explicit with-Skill smoke without the current marker as contamination automatically.

The baseline receives the identical source fixture without candidate injection.
