# R-007 diagnosis and revision

Path presence or directory listing is not Skill invocation evidence. Valid trace evidence requires the Skill body heading/content or an explicit agent declaration that it is using the Skill.

Revision:

- remove bare `goal-draft-policy/.../SKILL.md` path matching from invocation detection;
- retain full Skill heading and explicit usage declaration matching;
- add a pure synthetic regression where a path listing must not count as invocation;
- retain the explicit-candidate marker contamination gate.
