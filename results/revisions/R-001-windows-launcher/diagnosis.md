# R-001 diagnosis and revision

The Windows npm installation exposes Codex through PowerShell/CMD launcher scripts whose implementation calls the package's JavaScript entrypoint with `node.exe`. Direct `execFileSync("codex.cmd")` is not portable under the observed Node 24 process and failed with `EINVAL`.

Revision:

- resolve the installed `@openai/codex/bin/codex.js` beside the active Node executable on Windows;
- spawn `node.exe` with that entrypoint and an argument array;
- retain PATH launcher behavior on other platforms;
- use the same resolver in paired and E2E runners;
- add a pure local resolver integrity check when the Windows entrypoint is present.

This avoids shell command construction and does not change prompt, fixture, model, effort, or grading contract.
