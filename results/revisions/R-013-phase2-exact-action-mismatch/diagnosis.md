# R-013 diagnosis

Disabling the inner sandbox only inside the mount-free outer container repaired the Phase 1 shell-read failure: both cells read `PROBE.md`, and the candidate also read its derived `SKILL.md`.

The candidate later emitted the exact marker from a shell-wrapped `printf`, but the structured command field escaped the format string at the wrapper layer. It therefore did not contain the contract's exact command substring, and the frozen detector correctly recorded zero exact-action events. The marker was also exposed earlier by the candidate source read, so marker presence alone cannot be promoted to the required action witness. No post-hoc normalization, retry, or replacement is allowed.
