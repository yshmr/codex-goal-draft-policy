# R-009 diagnosis and revision

The operator retyped a semantically equivalent objective instead of copying the approved body byte-for-byte. Approval is bound to the exact `GOAL.md` SHA, so punctuation loss invalidates the activation provenance even though the fixture verifier later passed.

Revision:

- document that exact entry includes Markdown punctuation;
- make the capture error distinguish missing activation from objective mismatch;
- report expected and observed objective SHA-256 values without publishing local trace content.

The capture rejection is the desired integrity behavior. A clean rerun must use a fresh fixture and exact objective after this revision commit.
