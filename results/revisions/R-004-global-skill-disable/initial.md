# R-004 dual Skill load contamination

Run: [`../../v2/runs/20260713055411-revision/manifest.json`](../../v2/runs/20260713055411-revision/manifest.json)

The with-Skill cell loaded two same-name Skills: the stale real-profile Skill and the current repository-local candidate. The grader's current-marker check passed because the candidate was eventually read, but condition isolation was not valid.

The manifest is classified `contaminated`. Its surface PASS is not an evaluation result.
