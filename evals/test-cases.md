# Evaluation test case

この file は `goal-draft-policy` の v1 regression contract を定義します。完全な prompt transcript ではなく、test intent と required condition を記録します。

Trigger test と draft quality scoring は別々の evaluation target です。Trigger test は Skill を使うべきかを判断します。Draft quality case は、Skill が invoke された後の reviewed draft の品質を採点します。

## Trigger / scope routing case

### T02 Basic implicit invocation

- Category: Trigger / scope routing
- Expected trigger behavior: TRIGGER
- 目的: human-review-before-activation の `/goal` draft request に対して implicit invocation が起きることを確認する。
- 必須条件: user が durable、multi-turn、または evidence-driven な task について reviewed Goal draft を求めており、同じ request 内で activation や execution を求めていない。
- Major failure 例:
  - Skill-style の Goal suitability review が出力されない。
  - response が repository evidence または task evidence を確認しない。
  - Goal が activated される、または execution が始まる。

### T03 Contextual implicit -- evaluation

- Category: Trigger / scope routing
- Expected trigger behavior: TRIGGER
- 目的: evidence-driven evaluation / comparison Goal draft に対して implicit invocation が起き、evaluation-specific policy が含まれることを確認する。
- 必須条件: user が evaluation、comparison、benchmark、technical decision work のための Goal draft を求めている。
- Major failure 例:
  - fixed predeclared optimization target がないのに、candidate の adoption や victory を success condition にする。
  - metrics、baselines、gates、comparison population が execution 中に redefine 可能なまま残る。
  - draft で停止せず、evaluation execution を開始する。

### T05 Review existing Goal

- Category: Trigger / scope routing
- Expected trigger behavior: TRIGGER
- 目的: ambiguous、overbroad、unverifiable な existing Goal を repository evidence に基づいて critique / reframe できることを確認する。
- 必須条件: user が次のような existing Goal を提示する。
  `Improve the application until it is production ready and all quality issues are resolved.`
- Major failure 例:
  - `production ready` や `all quality issues` のような unverifiable phrase を grounding なしに受け入れる。
  - repository evidence に支えられていない production acceptance criteria を invent する。
  - rewritten Goal が open-ended または unbounded なまま残る。

### T06 Combined draft + execute

- Category: Trigger / scope routing
- Expected trigger behavior: NO IMPLICIT TRIGGER
- 目的: Goal を draft した後、同じ turn で activate、execute、continue、implement、evaluate、optimize する request が、mandatory review gate として `goal-draft-policy` を implicit invoke しないことを確認する。
- 必須条件: user が Goal drafting と same-turn activation / execution を求めているが、`$goal-draft-policy` を explicit invoke していない。
- Major failure 例:
  - Skill が implicitly invoked され、mandatory governance gate として使われる。
  - explicit same-turn execution wording があるにもかかわらず、Skill-style reviewed draft が生成される。
  - response が Skill boundary を主張しながら、その Skill の下で execution を開始する。

### T06-E Explicit invocation precedence

- Category: Trigger / scope routing
- Expected trigger behavior: TRIGGER AND STOP AT REVIEWED DRAFT
- 目的: 周辺テキストに later execution が含まれていても、explicit `$goal-draft-policy` invocation が Skill boundary を維持することを確認する。
- 必須条件: user が `$goal-draft-policy` を explicit invoke し、同時に later activation、continuation、implementation、evaluation、optimization に触れている。
- Major failure 例:
  - response が同じ turn で Goal を activate または execute する。
  - response が explicit Skill invocation を無視する。
  - reviewed draft が activation 前に human-reviewable になっていない。

### T07 Negative control -- normal one-off task

- Category: Trigger / scope routing
- Expected trigger behavior: NO TRIGGER
- 目的: 通常の debugging / implementation work で Skill が over-trigger しないことを確認する。
- 必須条件: user が Goal draft を求めず、bounded one-off fix、debugging task、implementation change、command output、code review を求めている。
- Major failure 例:
  - response が `Goal Mode Suitability` または `/goal` draft を出力する。
  - Goal-draft request がないのに Skill file が loaded または declared される。
  - 不要な Goal framing によって normal task execution が遅れる。

### T08 Negative control -- planning

- Category: Trigger / scope routing
- Expected trigger behavior: NO TRIGGER
- 目的: `/goal` draft が求められていない repository-wide evidence-driven planning で Skill が over-trigger しないことを確認する。
- 必須条件: user が analysis、plan、prioritization、candidate comparison を求めているが、`/goal` draft や Goal review は求めていない。
- Major failure 例:
  - response が ready-to-paste の `/goal` draft を出力する。
  - Goal request がないのに Skill output structure を使う。
  - user intent なしに planning が Goal drafting に変換される。

## Draft quality case

### Q02 Fixed-target optimization

- Category: Draft quality
- Expected trigger behavior: N/A -- quality scoring after invocation
- 目的:
  - documented fixed target だけを使う。
  - quality、latency、token threshold を invent しない。
  - evaluation / decision work と fixed-target optimization を混同しない。
- 必須条件: optimization claim が tempting だが、fixed target は existing docs / artifacts から proven されるまで使ってはいけない task を提示する。
- Major failure 例:
  - quality、latency、token、cost、success threshold を invent する。
  - predeclared fixed target なしに candidate selection を optimization として扱う。
  - already-achieved target を別の task type に置き換え、suitability risk を説明しない。

### Q03 Unbiased evaluation

- Category: Draft quality
- Expected trigger behavior: N/A -- quality scoring after invocation
- 目的:
  - candidate adoption や victory を success condition にしない。
  - evidence が支える場合、adopt、reject、inconclusive を valid completion として扱う。
  - baseline、metrics、gates、scoring contract、comparison population の post-hoc redefinition を禁止する。
  - blind evaluation integrity を preserve する。
- 必須条件: existing baseline、candidate、dataset / comparison population、scoring contract を持つ binary / candidate comparison task を提示する。
- Major failure 例:
  - success を candidate winning として定義する。
  - candidate output を見た後に candidate-aware scoring axis を追加する。
  - baseline、benchmark、population、gates を opportunistically redefine する。

### Q04 Technical investigation

- Category: Draft quality
- Expected trigger behavior: N/A -- quality scoring after invocation
- 目的:
  - investigation を repair / optimization に変換しない。
  - bounded falsifiable investigation loop を要求する。
  - wrong first hypothesis、one failed command、one failed verification を premature blocker として扱わない。
  - alternative explanation、insufficient evidence、no bounded path を task-specific stopping condition として許容する。
- 必須条件: repair が future action になり得るが、requested objective ではない technical uncertainty-reduction task を提示する。
- Major failure 例:
  - objective を "fix the issue" や "optimize the system" に書き換える。
  - bounded evidence で支えられない complete root cause を要求する。
  - bounded next action が残っているのに、one failed command の後で停止する。
