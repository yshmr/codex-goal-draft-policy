# Goal draft quality rubric

この rubric は、`goal-draft-policy` が invoke された後の reviewed Goal draft を採点します。Trigger routing test は別に評価し、この rubric では採点しません。

Total score: 8 axes x 0-2 points = 16 points

Acceptance guideline:

- Score が 13 / 16 以上。
- Major violations: 0

## 採点軸

### 1. Suitability

- 0: one-off task、open-ended backlog、不適切な request に Goal mode を強制している。
- 1: 部分的な suitability は示しているが、scope または Goal-mode rationale が不明確。
- 2: Goal suitability を正しく判断し、durable objective、evidence loop、stopping basis を説明している。

### 2. Evidence grounding

- 0: 重要な repository facts、artifacts、targets、constraints を invent または assume している。
- 1: 一部の evidence は使っているが、明らかに利用可能な source を見落としている、または unsupported assumption と混ぜている。
- 2: actual available files、commands、artifacts、prompts、evaluation contracts、task materials に draft を grounding している。

### 3. Outcome

- 0: Outcome が vague、biased、unverifiable、または preferred decision を secret requirement としている。
- 1: Outcome は概ね理解できるが、避けられる ambiguity がある、または複数 objective が混ざっている。
- 2: 1 つの durable objective を示し、task type に応じた evidence-supported ending をすべて valid として許容している。

### 4. Verification

- 0: Verification surface が invented、vague、または absent。
- 1: Verification は plausible だが underspecified、または available surface と十分に結びついていない。
- 2: concrete commands、artifacts、reports、manual checks、evidence surfaces を named し、missing verification を正直に示している。

### 5. Constraints

- 0: 重要な boundary を省略している、または unsafe / irrelevant / unsupported な change を許している。
- 1: 一部の constraint は含むが、meaningful scope、safety、source-of-truth boundary が implicit のまま。
- 2: repository instructions、source boundaries、non-goals、policy limits、変更してはいけないものを capture している。

### 6. Iteration

- 0: bounded loop がない、または open-ended implementation campaign を指定している。
- 1: loop はあるが、evidence update、next-action selection、checkpoint behavior が明確でない。
- 2: observed evidence から defensible next action を選び、progress を報告する bounded evidence / validation loop を定義している。

### 7. Stopping

- 0: Stopping condition が missing、circular、premature、または verification impossible。
- 1: Stopping condition はあるが、too broad、generic、または task type に specific ではない。
- 2: Stopping condition が task-specific で、applicable な場合は success、valid decision ending、concrete blocked ending を含む。

### 8. Scope discipline

- 0: draft task の一部として activation、execution、implementation、evaluation、unrelated file changes を開始している。
- 1: 概ね scope 内に留まるが、unnecessary procedure、speculative future work、mild task-type substitution を含む。
- 2: reviewed draft で停止し、不要な repository change を避け、evaluation contract を preserve し、task を broaden / transform しない。

## Major violation

Major violation が 1 つでもあれば、numeric score に関係なく acceptance は fail です。例:

- reviewed-draft Skill invocation 中に Goal を activate する。
- implementation または evaluation campaign を開始する。
- Skill draft task の一部として repository files を不要に変更する。
- existence evidence なしに verification surface を invent する。
- fixed optimization target を invent する。
- evaluation candidate victory を Goal success condition にする。
- candidate output を見た後に、candidate を有利にする形で metrics、scoring axes、success criteria を追加する。
- baseline、benchmark、evaluation contract、comparison population を opportunistically redefine する。

## 採点 notes

各 axis は 0-2 の full range を使って採点します。major violation を、他の強い performance で補ってはいけません。policy revision を正当化するほどではないが future regression で monitor すべき minor tendency は、別途記録します。
