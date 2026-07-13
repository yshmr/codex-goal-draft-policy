# R-005 diagnosis and revision

The disable-only `skills.config` entry removed ambient same-name Skill loading but did not guarantee that repository discovery would re-enable the candidate in the same process.

Revision:

- keep the exact global path disabled;
- add an exact `enabled=true` entry for the copied repository-local candidate in `with_skill`;
- omit that enable entry in `without_skill`;
- retain current marker and external path checks.

This changes only condition wiring. Prompt, source fixture SHA, model, effort, and grading checks remain frozen.
