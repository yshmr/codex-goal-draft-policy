# R-002 contaminated paired smoke

Run: [`../../v2/runs/20260713054519-revision/manifest.json`](../../v2/runs/20260713054519-revision/manifest.json)

The T-01 paired smoke completed and its deterministic surface checks passed, but raw trace audit showed that the `with_skill` cell read the pre-existing Skill under the real user profile. That Skill text did not match the committed Skill at the manifest's `skill_commit`.

The manifest is therefore classified `contaminated`. Its outputs and hashes remain preserved, but it is invalid for with/without comparison or policy adoption.
