# v2 provenance: fact, method, inference, observation

Recorded: 2026-07-13

This document prevents official product facts from being blended with this repository's methods or observations. Historical v1 provenance remains in [`design-basis.md`](design-basis.md).

## Official OpenAI facts

The following claims are taken from current public OpenAI material reviewed on the recorded date.

1. A Codex Goal is a scoped, user-controlled, thread-scoped completion contract with outcome, verification, constraints/boundaries, iteration policy, and a blocked stop condition. It has lifecycle controls and evidence-based completion. Source: [Using Goals in Codex](https://developers.openai.com/cookbook/examples/codex/using_goals_in_codex).
2. `/goal` is suited to work larger than one normal prompt and smaller than an open-ended backlog, with a clear success condition and validation loop. Source: [Follow a goal](https://developers.openai.com/codex/use-cases/follow-goals).
3. Codex Skills use progressive disclosure. Codex initially receives a Skill's name, description, and path, then loads `SKILL.md` when selected. Skills can be invoked explicitly or implicitly; implicit selection is matched from the description. Source: [Build skills](https://developers.openai.com/codex/skills).
4. A Skill directory requires `SKILL.md` and may include scripts, references, assets, and `agents/openai.yaml`. The metadata file can set `policy.allow_implicit_invocation`; its documented default is true. Source: [Build skills](https://developers.openai.com/codex/skills).
5. OpenAI's Skill-eval article recommends explicit and implicit invocation cases, narrowly targeted eval prompts, checkable definitions of success, rubric-based grading, and repository cleanliness/runtime checks where appropriate. Source: [Testing Agent Skills Systematically with Evals](https://developers.openai.com/blog/eval-skills).

These facts do not say that this local policy is endorsed, complete, or more reliable than another Skill.

## Project methods

The following are choices made by this repository, not OpenAI requirements.

- Human-review-before-activation is the local Skill's workflow boundary.
- Combined draft-and-execute requests are excluded from implicit invocation after the historical T06 failure.
- Evaluation comparisons freeze baseline, candidate, population, metrics, and gates before execution.
- Adopt, reject, and inconclusive are valid binary-comparison endings when supported by evidence.
- A measurable surface is not enough to invent a numeric target; target provenance must predate the loop.
- `with_skill` and `without_skill` are paired under the same Codex version, model, effort, prompt, and fixture.
- Raw traces remain local-only because they may expose local paths or task/session identifiers; committed results contain sanitized output and raw hashes.
- Pure validation runs on push; provider-backed runs are manual.

## Inferences

These are reasoned interpretations, not direct statements from official sources.

- Because implicit Skill matching relies on the description, trigger exclusions belong in frontmatter as well as the body.
- Because Goal execution persists against a completion contract, post-hoc metric changes are more damaging than ordinary prompt ambiguity.
- Because draft responsibility and activation responsibility can be separated, an independent reviewed-draft Skill can add value without competing with a Goal-creation Skill on activation behavior.
- Because JSONL traces may contain environment identifiers, hashes plus sanitized public outputs are a safer public reproducibility boundary than committing raw traces.

## Tested observations

### Historical v1 authority

[`results/v1-evaluation.md`](../results/v1-evaluation.md) records manual observations made before this v2 program:

- T06 initially failed with a major scope violation: implicit Skill invocation was followed by Goal activation and execution.
- The policy was narrowed, then T06 retest passed.
- T06-E explicit invocation stopped at reviewed draft.
- O-01, O-02, and O-03 were monitored minor tendencies, not adopted defects.

This repository does not reconstruct missing raw v1 traces or reinterpret those observations through the v2 grader.

### v2 observations

Only a committed manifest in `results/v2/runs/` is a v2 provider-backed observation. The predeclared contract, runner, and fixtures are methods, not results. An absent manifest means unexecuted, not passed.

## Source route note

The OpenAI Codex manual helper was attempted on 2026-07-13 but rejected the fetched response because the required content hash header was absent. Official page-specific sources above were then checked through the official OpenAI web route. This is a documentation lookup observation, not a product reliability claim.
