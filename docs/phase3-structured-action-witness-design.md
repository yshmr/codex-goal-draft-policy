# Final Remediation Phase 3: structured action witness

Recorded: 2026-07-13

This is the last isolation-witness remediation phase. It evaluates one fresh candidate/baseline pair, in that order, once per cell. It neither re-scores Replacement Phase 2 nor starts paired smoke. The machine-readable authority is [`../evals/contracts/phase3-structured-action-witness.json`](../evals/contracts/phase3-structured-action-witness.json), committed before detector implementation and provider execution.

## Frozen observation model

The detector consumes ordered Codex JSONL events. A source-read observation is a completed, exit-0 `command_execution` whose target-path token identifies the derived candidate `SKILL.md` and whose aggregated output contains the full exact derived file bytes. Path separators are normalized only for this target check; the surrounding command, shell, quoting, and wrapper are not compared.

A qualifying action is a different, later `item.completed` / `command_execution` item with status `completed`, exit code `0`, and stdout/aggregated output exactly equal to the fixed marker plus one LF byte. The action classifier never reads the command field. It accepts no prefix, suffix, diagnostic text, second newline, or alternate newline. Event order is wire order, and distinct identity is equality of the opaque item IDs without publishing those IDs.

Source-read output may contain the marker because the test-only instruction is part of the derived file; that does not qualify. Marker text in final prose, inventory, self-report, candidate-like prose, or a command field does not qualify. The candidate gate requires exactly one qualifying action after at least one qualifying source read. The baseline gate requires an empty Skill inventory, no source read, no qualifying action, no marker in final output, and no ambient `SKILL.md` read. Ambient-read detection uses only a normalized `SKILL.md` path token plus output containing the exact committed base Skill bytes; it is not an action witness.

Published evidence contains only ordinals, event types, completion/exit facts, distinct-identity and ordering booleans, exact-output byte length/hash, counts, raw trace/output hashes, and sanitized final output. Raw commands, item/session/thread identifiers, raw paths, traces, stderr, auth bytes/hashes, and host paths remain local-only.

## Pure fixture freeze

Before provider execution, synthetic tests must pass for:

- PASS with different shell-wrapper strings when a separate completed/exit-0 action after the source read outputs exactly marker+LF;
- FAIL when the marker occurs only in source-read output;
- FAIL when it occurs only in final prose;
- FAIL when the action precedes the source read;
- FAIL for nonzero or incomplete action execution;
- FAIL for any additional action-output byte;
- FAIL without a source read;
- FAIL when the baseline has a marker, qualifying action, or ambient read.

Fixtures contain no local path, session identifier, credential, or secret. Provider execution is prohibited until the contract and then the implementation/tests are separate commits, every pure test passes, and the worktree is clean.

## Runtime and decision boundary

The mount-free Phase 2 outer Docker boundary is reused with the fixed image, Codex CLI 0.143.0, `gpt-5.4`, medium effort, prompt, fixture, bridge network, resource limits, per-cell auth copy, and candidate-then-baseline order. The inner sandbox is disabled only inside that container. The production candidate is unchanged; the candidate test copy receives exactly the one append frozen in the contract, while baseline has no `.agents/skills` directory.

`ADOPT witness method` requires candidate structured source-read-to-action PASS plus baseline absence, outer boundary, pair parity, freshness, artifact/hash, and public-safety PASS. It adopts only this isolation-witness method. A normal pair with any false gate is `REJECT`; infrastructure that prevents a normal paired observation is `INCONCLUSIVE`. No outcome permits a retry, reorder, detector revision, replacement, or additional isolation hypothesis.

Only `ADOPT witness method` creates entry to a later valid paired smoke, bounded there to at most two pairs/four cells, one repetition per cell, no retry, with its own predeclared contract. Phase 3 does not start it. `REJECT` or `INCONCLUSIVE` permanently closes isolation remediation and hands the bounded evidence program to closeout selection.
