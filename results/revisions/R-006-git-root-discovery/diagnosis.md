# R-006 diagnosis and bounded final revision

An exact `skills.config enabled=true` entry did not register the repository candidate. The copied fixture was not a Git repository, while repository Skill discovery is documented in relation to working directories and repository roots.

Bounded revision:

- initialize a temporary Git repository in every copied workdir before Codex starts;
- inject the candidate only after/source-copy integrity has been recorded;
- retain ambient disable, exact candidate enable, marker, and external-load gates;
- do not modify the checked-in fixture.

If explicit discovery still fails, provider comparison is reported inconclusive in this environment rather than expanding into global Skill replacement or user-profile mutation.
