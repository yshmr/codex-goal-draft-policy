---
name: goal-draft-policy
description: Draft or review a human-reviewable Codex /goal completion contract for long-running, multi-turn, iterative, or evidence-driven work before activation. Use for explicit or implicit requests to prepare, critique, or refine a Goal draft. Do not implicitly invoke for combined draft-and-execute requests, ordinary plans or one-off work, /goal explanation questions, or continuation of an active Goal. This skill always stops at the reviewed draft.
---

# Goal Draft Policy

## Scope

Use this skill to draft or review a Codex `/goal` completion contract for long-running, multi-turn, iterative, or evidence-driven work when the user wants human review before activation.

This skill applies to human-review-before-activation workflows: drafting a `/goal` objective, critiquing an existing Goal objective, refining a Goal completion contract, judging Goal mode suitability, or preparing a Goal in a human-reviewable state before the user decides whether to activate it.

Do not implicitly invoke this skill for a combined draft-and-execute request where the same user request explicitly asks to create a Goal and then activate it, execute it, continue through it, or begin implementation, evaluation, or optimization after drafting. Do not treat this skill as a mandatory review gate for those requests.

When the user explicitly invokes `$goal-draft-policy`, this skill applies even if the surrounding request mentions later execution. In that case, stop after presenting the reviewed draft. This skill does not activate, persist, or begin executing a Goal.

Do not use this skill merely because a request contains the word "goal", asks for a plan, describes long work, asks how `/goal` works, or continues work under an already active Goal. Those are adjacent workflows, not Goal-draft requests.

Treat the goal as a completion contract, not a long implementation procedure.

## Evidence First

Before drafting, inspect the actual available state enough to ground the contract. When a repository exists, prioritize the actual repository state. Otherwise, ground the draft in the task specification, source materials, research inputs, and available evidence surfaces. Prefer the closest available sources:

- Applicable `AGENTS.md` files and local agent instructions.
- Plans, specifications, issues, design notes, task descriptions, research protocols, or source materials.
- Evaluation artifacts, fixtures, benchmark data, dashboards, prior results, or comparison reports.
- Existing tests, validation commands, CI workflows, eval scripts, and documented runtime checks.
- Relevant implementation and documentation that define boundaries, expected behavior, or known risks.

Use `rg`/`rg --files` first when searching repository or filesystem material. Record only the evidence that materially shaped the goal draft.

When no repository exists, inspect the supplied brief, artifacts, datasets, or other evidence surfaces. Do not invent repository conventions or commands. State that repository-grounded validation is unavailable.

## Suitability Check

Decide whether Goal mode is appropriate before producing a draft. A good Goal candidate has:

- One durable objective.
- More scope than one normal prompt.
- Less scope than an open-ended backlog.
- A validation loop or evidence-gathering loop.
- A verifiable stopping condition.

If these are not true, do not force a `/goal` draft. Explain why Goal mode is unsuitable and suggest a better next step, such as a normal prompt, a plan, a smaller investigation, or a clarified objective.

An already-achieved target is not automatically a durable Goal. Verify that status and recommend a normal validation or reporting task unless a distinct, still-unfinished durable outcome is grounded in the request. Do not substitute a new objective merely to preserve Goal suitability.

## Draft Requirements

When Goal mode is suitable, make the draft ready to paste into `/goal`. Clearly specify:

- Outcome: the durable objective and the state that should exist when finished.
- Sources and boundaries: the sources of truth, files, docs, artifacts, workflows, source materials, and explicit non-goals.
- Verification surfaces: concrete commands, tests, eval scripts, artifacts, runtime behavior, or review outputs that can verify completion.
- Constraints: repository instructions, safety limits, product or policy constraints, compatibility requirements, and what must not be changed.
- Iteration policy and checkpoints: how the agent should choose bounded next actions and report progress from evidence.
- Stopping condition: the applicable success, decision, no-improvement, or blocked endings for this specific Goal.

Keep the goal concise. Reference existing `PLAN.md`, specifications, issue text, evaluation docs, or workflows as sources of truth instead of copying their full procedure into the goal.

## Verification Grounding

Ground verification in actual available surfaces. Use concrete names and commands when available:

- Test commands such as `npm test`, `pytest path/to/test.py`, `cargo test`, or project-specific scripts.
- Evaluation commands, benchmark scripts, fixtures, expected output artifacts, or comparison notebooks.
- Runtime checks, manual QA surfaces, generated reports, logs, screenshots, or documented acceptance artifacts.

Avoid vague verification such as "tests pass", "quality is good", or "evaluation succeeds" without naming the tests, quality criteria, or evaluation artifact.

If no reliable verification surface exists, say so in the draft and make that a risk, boundary, or blocker instead of inventing one.

In monorepos, distinguish root commands from package-local commands. When package metadata and CI disagree, name the mismatch as evidence to resolve; do not present either command as authoritative without qualification.

## Evaluation And Decision Goals

For evaluation, experiment, comparison, and technical decision goals, avoid outcome bias. Do not make a particular candidate's adoption, rejection, or improvement the hidden success condition unless the user explicitly requested an optimization task with a fixed target metric.

For candidate evaluations or binary comparisons, allow any evidence-supported conclusion to satisfy the goal:

- Adopt.
- Reject.
- Inconclusive, or current evaluation cannot distinguish.

For broader technical decisions, derive the valid decision space from the actual task and evidence instead of forcing an adopt/reject/inconclusive framing.

Do not let goal execution redefine metrics, baselines, gates, benchmarks, or the evaluation contract merely to make completion easier. If the evidence shows the contract must change, treat that as an important finding or blocker requiring human guidance.

A measurable surface does not establish a target. Use a numeric threshold only when the prompt or a named pre-existing artifact fixes it before the evaluation or optimization loop. Preserve its provenance in the draft. If measurement is impossible or unreliable, use an honest qualitative review or decision ending when the task supports one; otherwise identify the missing measurement as a limitation or blocker.

## Iteration Policy

Prefer the repository's existing workflow when it exists. Otherwise, encode an iteration loop like:

1. Inspect current evidence.
2. Identify the largest remaining gap.
3. Choose one bounded next action.
4. Execute or investigate that action.
5. Rerun the relevant verification.
6. Update progress from actual evidence.
7. Select the next bounded action.

Checkpoints should ask for concise evidence updates, not exhaustive journals. They should make it clear when to stop, pivot, or ask for human guidance.

## Stopping Conditions

Choose only the endings that apply to the specific Goal. Do not force every draft to include every stopping condition. Possible endings include:

- Objective achieved and verified against the named surfaces.
- Evidence-supported decision reached for an evaluation or comparison.
- No defensible improvement path remains under the stated constraints, for iterative optimization, experiment, or investigation goals.
- Further progress requires product, policy, evaluation-design, or human guidance.

For migration or bounded implementation goals, verified success and a concrete blocker may be sufficient. Include a defensible blocked stop condition. A blocked condition should name the missing decision, unavailable artifact, failing evaluation design, inaccessible dependency, ambiguous requirement, or repeated verification barrier that prevents responsible continuation.

Do not treat ordinary uncertainty, one failed attempt, or one failed verification as a blocked condition when a defensible bounded next action remains within the Goal's constraints and boundaries.

## Self-Review Before Presenting

Before showing the draft, review it against this checklist:

- It has one durable objective.
- Done is verifiable.
- Actual evidence sources are named.
- A validation or evidence loop exists.
- Constraints and boundaries are clear.
- For evaluation, comparison, and decision goals, it does not steer toward a desired conclusion unless the user explicitly requested optimization against a fixed target defined before the loop.
- Goal execution cannot conveniently redefine metrics, gates, baselines, benchmarks, or the evaluation contract.
- It includes a blocked stop condition.

Revise the draft if any item fails.

When reviewing an already healthy Goal, preserve its sound outcome and boundaries. Make only evidence-supported repairs; do not expand or rewrite it for stylistic completeness.

## Output Format

Present the result in this order:

1. Goal mode suitability.
2. Evidence used to draft the Goal.
3. Ready-to-paste `/goal` draft.
4. Short design rationale.
5. Remaining risks or unresolved ambiguities.

End by reminding the user that the draft has not been activated.

Use `references/review-checklist.md` for the final compact audit when it is available.
