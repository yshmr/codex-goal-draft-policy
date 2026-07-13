# Failure-driven revisions

Historical v1 T06 failure remains in [`../v1-evaluation.md`](../v1-evaluation.md); it is not duplicated or rewritten here.

For v2, create one directory per new finding containing:

1. `initial.md` linking the immutable initial manifest/cell;
2. `diagnosis.md` separating output failure, grader failure, fixture defect, and contamination;
3. the case/contract revision commit SHA;
4. the Skill/policy revision commit SHA when applicable;
5. `decision.md` linking the clean rerun and recording adopt, reject, or inconclusive.

Do not replace the initial artifact with a passing rerun.
