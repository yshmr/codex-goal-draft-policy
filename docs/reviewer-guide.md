# Reviewer guide

## Five-minute path

1. Read the 60-second summary and claims boundary in [`../README.md`](../README.md).
2. Inspect [`../results/v2/summary.md`](../results/v2/summary.md) and [`../results/authority-index.md`](../results/authority-index.md); do not treat contract files as results.
3. Review the Skill frontmatter and scope exclusions in [`../skill/goal-draft-policy/SKILL.md`](../skill/goal-draft-policy/SKILL.md).
4. Confirm the predeclared gates in [`../evals/contracts/v2-predeclared.json`](../evals/contracts/v2-predeclared.json).
5. Run `npm test` and check committed manifests, if any, under `results/v2/runs/`.

## Questions to ask

- Was the run committed under the Skill commit recorded in the manifest?
- Are paired conditions identical in prompt SHA and fixture SHA?
- Are critical n=3 cases complete, or is the result labeled partial?
- Did any raw output get sanitized after grading in a way that changes the checked behavior?
- Are deterministic failures diagnosed as output problems versus grader problems?
- Was subjective review blinded before condition labels were revealed?
- Are initial failures, contaminated runs, and passing revisions all retained?
- Does an E2E result contain actual Goal lifecycle evidence, not merely an ordinary Codex task?

## Running checks

```bash
npm test
```

This checks frontmatter, metadata, JSON/JSONL shape, duplicate IDs, Markdown links, fixture integrity, result/hash integrity, and public safety. GitHub Actions also fails on generated diffs.

Provider-backed runs are manual. Before executing one, verify a clean worktree and the intended commit. Do not run them merely to make a README badge green.

## Interpretation

- `PASS` from the deterministic grader means the predefined observable checks passed.
- A rubric score measures reviewed-draft quality for the sampled output, not all possible prompts.
- `without_skill` is a descriptive baseline, not an inferior product claim.
- `inconclusive` is a valid program decision when integrity or evidence is insufficient.
