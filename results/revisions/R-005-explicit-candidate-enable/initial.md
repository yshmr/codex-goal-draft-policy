# R-005 disable-only condition setup failure

Run: [`../../v2/runs/20260713055858-revision/manifest.json`](../../v2/runs/20260713055858-revision/manifest.json)

The config override prevented the real-profile Skill from loading, but the explicit T-01 with-Skill cell did not expose the repository-local candidate. The runner automatically classified the run `contaminated`.

The without-Skill output also failed its draft-only check. That observation is retained in the cell, but no paired comparison is made because the candidate condition was invalid.
