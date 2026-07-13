# R-003 explicit smoke without candidate discovery

Run: [`../../v2/runs/20260713055020-revision/manifest.json`](../../v2/runs/20260713055020-revision/manifest.json)

The isolated profile prevented the stale global Skill from loading. However, the T-01 `with_skill` cell did not invoke any Skill and lacked the current marker even though the runner copied the candidate beneath the redirected profile.

Because T-01 is an explicit invocation smoke, candidate absence makes the condition setup invalid. The run is preserved as `contaminated`, not treated as a Skill under-trigger result.
