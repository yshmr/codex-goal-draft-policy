# R-008 non-interactive Goal transport failure

Failed probe: [`../../v2/e2e/20260713060812-e2e-01-initial/manifest.json`](../../v2/e2e/20260713060812-e2e-01-initial/manifest.json)

The `codex exec --json` probe completed as an ordinary task but recorded neither Goal activation nor a Goal terminal event. Its manifest remains `failed`; the underlying task output is not a real `/goal` E2E result.

A subsequent interactive development observation is preserved separately as [`contaminated`](../../v2/e2e/20260713061043-e2e-01-interactive/manifest.json) because it occurred before the revised capture protocol was committed.
