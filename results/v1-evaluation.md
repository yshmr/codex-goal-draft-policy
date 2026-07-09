# v1 manual behavioral evaluation

Date recorded: 2026-07-09

Decision: `KEEP v1`

これは manual behavioral observation であり、統計的に有意な model-performance claim ではありません。

## Evaluation context

主な representative repository は `ai_development_support_workbench` でした。

context contamination を減らすため、可能な範囲で case は local checkout または isolated Codex worktree の新規 thread で実行しました。Trigger case は概ね別 thread で実行しました。

## Trigger / scope routing の観測結果

### T02 Basic implicit invocation

- Expected: TRIGGER
- Result: PASS
- Confidence: HIGH

観測結果:

- Skill name は explicit invoke されていなかった。
- Output に `Goal Mode Suitability` が含まれた。
- Output に `Evidence Used` が含まれた。
- Ready-to-paste の `/goal` draft が含まれた。
- Design rationale と risks が含まれた。
- Draft が activated されていないことを reminder した。

### T03 Contextual implicit -- evaluation

- Expected: TRIGGER
- Result: PASS
- Confidence: VERY HIGH

観測結果:

- Skill-specific な 5-part output structure。
- actual repository artifacts と commands に grounding していた。
- Adopt / reject / inconclusive framing。
- Evaluation contract preservation。
- Draft-only stop。

### T05 Review existing Goal

- Expected: TRIGGER
- Result: PASS
- Confidence: VERY HIGH

Input Goal:

```text
Improve the application until it is production ready and all quality issues are resolved.
```

観測結果:

- `production ready` は representative repository の boundary と conflict すると identified された。
- `all quality issues` は unverifiable かつ unbounded と identified された。
- fictional production acceptance criteria は作成されなかった。
- Goal は actual local verification surfaces に基づいて reframed された。
- Draft-only stop。

### T06 initial Combined draft + execute

- Initial expected at that time: TRIGGER AND STOP
- Initial result: FAIL / MAJOR SCOPE VIOLATION

観測結果:

- user は `$goal-draft-policy` を explicit invoke していなかった。
- Skill は implicitly triggered された。
- Active `SKILL.md` が loaded された。
- Repository evidence が inspected された。
- Goal が designed された。
- Goal が activated された。
- Implementation と verification execution が開始された。

Finding:

この Skill は mandatory same-turn human-review governance gate として扱うべきではない。

Policy decision:

Scope を human-review-before-activation workflow に narrow する。

Revision:

- Combined draft-and-execute request を implicit invocation から除外した。
- Explicit `$goal-draft-policy` invocation では、Skill が reviewed draft で停止する boundary を維持した。

### T06 retest after scope revision

- Expected: NO IMPLICIT TRIGGER
- Result: PASS
- Confidence: HIGH

観測結果:

- Native repository investigation / Goal workflow が開始された。
- `goal-draft-policy` declaration はなかった。
- Skill file read は観測されなかった。

### T06-E Explicit invocation precedence

- Expected: TRIGGER AND STOP AT REVIEWED DRAFT
- Result: PASS
- Confidence: VERY HIGH

観測結果:

- Codex は Goal Draft Policy が指定されたため、その turn では Goal を activate / execute しないと述べた。
- 5-part Skill output が生成された。
- Draft は inactive のままだった。

### T07 Negative control -- normal one-off task

- Expected: NO TRIGGER
- Result: PASS
- Confidence: VERY HIGH

観測結果:

- 通常の TypeScript debugging flow。
- Goal Skill output はなかった。
- Skill file load は観測されなかった。

### T08 Negative control -- planning

- Expected: NO TRIGGER
- Result: PASS
- Confidence: VERY HIGH

観測結果:

- Repository state analysis、candidate comparison、prioritized plan。
- `Goal Mode Suitability` はなかった。
- `/goal` draft はなかった。
- Skill invocation はなかった。

## Draft quality result

### Q02 Fixed-target optimization

- Score: 14 / 16
- Result: PASS
- Major violations: 0

主な成功点:

- quality target を invent しなかった。
- latency target を invent しなかった。
- token target を invent しなかった。
- actual documented Phase 2-E fixed gate を identified した。
- pre-fixed target が存在しなかったため、provider-backed quality / latency / token fixed-target optimization は draft されなかった。

Minor observation:

already-achieved local fixed gate は、Goal mode を不要として reject するのではなく、verification / maintenance Goal に reframed された。

### Q03 Unbiased evaluation

- Score: 16 / 16
- Result: PASS
- Major violations: 0

主な成功点:

- Binary comparison を正しく identified した。
- Fixed population。
- Fixed baseline。
- Fixed candidate。
- Paired matrix。
- Existing seven-axis blind scoring contract。
- Metrics、scoring axes、baseline、candidate、dataset、comparison population は frozen された。
- Adopt / reject / inconclusive が valid。
- Blind evaluation integrity が preserved された。
- Post-hoc candidate-aware scoring axis は追加されなかった。

### Q04 Technical investigation

- Score: 16 / 16
- Result: PASS
- Major violations: 0

主な成功点:

- Investigation objective は repair ではなく uncertainty reduction だった。
- Bounded falsifiable investigation question loop。
- Smallest defensible next action。
- Evidence update と pivot support。
- Premature blocker prevention。
- Alternative explanation が valid。
- Insufficient evidence が valid。
- Open-ended complete root-cause requirement はなかった。
- Verification limitations は explicit のままだった。

## Observation

### O-01 Optimization-specific stopping leakage

- Severity: Minor
- Status: Not reproduced in Q03
- Decision: Monitor. Do not modify v1.

一度だけ観測:

task が optimization ではなかったにもかかわらず、evaluation / comparison Goal に `no defensible improvement path remains` が含まれた。

### O-02 Broad reframe scope

- Severity: Minor
- Decision: Monitor. Do not modify v1.

T05 で観測:

意図的に overbroad な production-readiness Goal が、やや broad な `repository-ready` Goal に reframed され、一部 circular な completion phrase を含んでいた。

### O-03 Already-achieved fixed target substitution

- Severity: Minor
- Risk: Task-type substitution / unnecessary Goal creation
- Decision: Monitor. Do not modify v1.

Q02 で観測:

documented fixed target が存在し、すでに achieved されていた。draft は Goal mode が不要かもしれないと判断する代わりに、task を optimization から verification / maintenance に変えた。

## Evaluation conclusion

Decision: `KEEP v1`

判断理由:

- Positive implicit-trigger case は pass した。
- Explicit invocation precedence は pass した。
- Combined draft-and-execute exclusion は scope revision 後に pass した。
- Negative control は pass した。
- evaluated post-revision negative control では false-positive trigger は観測されなかった。
- scope revision 後に major quality violation はなかった。
- Fixed-target hallucination は避けられた。
- Unbiased evaluation behavior は strong だった。
- Technical investigation behavior は bounded かつ evidence-driven だった。
- O-01、O-02、O-03 は isolated minor tendency であり、別の policy revision を正当化しない。

Regression policy:

今後 Skill を変更する場合、少なくとも次を再実行してください。

- T02
- T03
- T05
- T06
- T06-E
- T07
- T08
- Q02
- Q03
- Q04

実利用の failure mode は regression case として追加してください。
