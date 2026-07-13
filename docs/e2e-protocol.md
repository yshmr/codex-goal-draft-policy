# Real `/goal` E2E protocol

## Responsibility boundary

The Skill workflow and Goal workflow are separate.

1. Run the draft case with `goal-draft-policy` in read-only mode.
2. Confirm the output stops at a reviewed, inactive draft.
3. A human reviews the exact Goal text and explicitly approves activation for an isolated synthetic fixture.
4. A separate Goal workflow activates the approved contract. It does not invoke the draft Skill as a runtime controller.
5. Preserve raw trace locally, publish sanitized evidence and hashes, then remove/pause any lingering Goal state.

The E2E runner must require an explicit approval string and exact case ID. Absence of that approval makes the case unexecuted, not failed.

The executable interface uses the SHA-256 of the exact reviewed `GOAL.md` as the approval token:

```bash
node scripts/run-goal-e2e.mjs --id E2E-01 --approval-sha <reviewed-goal-sha256> --publish
```

## Cases considered

### E2E-01 achievable

Fixture: `fixtures/e2e_achievable`.

The Goal may change only `state.json` and must pass `node verify.mjs`. This is executable in an isolated workspace and can support achieved/verified completion.

### E2E-02 concrete blocker

Fixture: `fixtures/e2e_blocked`.

`required-input.txt` is intentionally absent and must not be fabricated. The valid ending is a blocker naming that file and the exact input needed after confirming no allowed source exists.

### E2E-03 unbiased decision

Fixture: `fixtures/e2e_decision`.

`node score.mjs` evaluates a frozen population. Adopt, reject, or inconclusive is valid; the checked-in fixture currently yields inconclusive. Changing `cases.json` or `score.mjs` after seeing the output contaminates the run.

## Evidence required for an executed case

- Codex version, model, effort, execution date, Skill/fixture commit and fixture SHA;
- exact approved Goal SHA;
- separate draft and activation timestamps or workflow records;
- actual Goal activation evidence from the trace;
- command output and completion/blocker evidence;
- exit code and usage;
- raw trace/output SHA with raw material local-only;
- sanitized public result passing safety scan.

If `codex exec` cannot expose actual Goal lifecycle/tool evidence, a normal agent execution is not relabeled as `/goal` E2E. The case remains unexecuted for `/goal` even if the underlying fixture task succeeds.
