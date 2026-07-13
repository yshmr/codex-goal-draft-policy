# R-008 diagnosis and protocol revision

Tested observation for Codex CLI 0.143.0: the non-interactive `exec` surface used by the probe did not expose the interactive `/goal` lifecycle. The agent therefore ran as an ordinary task and could not supply activation evidence.

Protocol revision:

- keep `run-goal-e2e.mjs` as a failure-preserving non-interactive probe;
- activate the exact approved objective through `/goal` in an interactive TUI and isolated fixture;
- add `capture-interactive-e2e.mjs` to verify the exact active Goal event, task completion, raw hashes, clean committed method revision, and fresh post-verification;
- require an explicit human observation for the rendered terminal label because that label was not present in the tested session JSONL;
- never promote the earlier failed or pre-commit development observations.

This is a project method derived from tested behavior, not an official guarantee about all Codex versions or interfaces.
