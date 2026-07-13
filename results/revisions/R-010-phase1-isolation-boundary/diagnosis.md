# R-010 diagnosis

The previous revisions changed redirected home variables, repository placement, exact config entries, and Git-root state while remaining inside the same host user boundary. Observed Codex 0.143.0 continued to expose the real user Skill unless its exact path was disabled, after which the same-name repository candidate was not demonstrably invoked.

Current official documentation confirms repository discovery from CWD through repository root, user discovery under the user home, distinct explicit/implicit activation, and JSONL event output. The new revision therefore isolates the filesystem/user boundary itself instead of tuning another same-boundary parameter.
