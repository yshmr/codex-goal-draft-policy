# Retrospective Comparison with OpenAI define-goal

Current source rechecked: 2026-07-13. The official Skill still checks active Goal state and calls `create_goal` after its quality bar when appropriate. This recheck updates source currency only; it does not alter v1 design provenance or turn this document into a competitive ranking.

## Historical status

`define-goal` は `goal-draft-policy` v1 の original design input ではありません。この文書は、v1 の design provenance を保ったうえで OpenAI curated `define-goal` との関係を整理する retrospective comparison です。

Similarity がある場合も、documented provenance が derivation を示さない限り、independent convergence として扱います。

この文書では、`goal-draft-policy` v1 が `define-goal` に based on、derived from、extended されたとは記録しません。

## Official Skill verification

確認した official Skill は次です。

- Repository: `openai/skills`
- Path: `skills/.curated/define-goal/SKILL.md`
- Skill name: `define-goal`
- Owner / publisher: OpenAI
- Canonical URL: https://github.com/openai/skills/blob/main/skills/.curated/define-goal/SKILL.md

Reviewed Skill text によると、`define-goal` は、work 開始前に concrete / measurable goal を定義すること、fuzzy intention を quantitative outcome に変えること、goal creation / refinement のみに scope を限定することを目的としています。Workflow は、goal definition が必要か確認し、concrete terms で likely goal を restate し、domain が support する場合は quantitative にし、weak goal を repair し、active goal state を確認し、quality bar を満たした後で `create_goal` を呼ぶ、という流れです。

## Shared / convergent principles

Official `define-goal` と local `goal-draft-policy` v1 の双方に evidence がある範囲で、次の principles は shared または convergent と見なせます。

- Goal definition / suitability check: ordinary implementation work に Goal creation を強制しない。
- Concrete outcome: done のときに何が true になるかを明確にする。
- Verification evidence: completion を証明する tests、commands、evals、acceptance criteria、artifacts、manual review criteria などを明記する。
- Bounded scope: in scope / out of scope、affected files、allowed commands、target environments、blast radius などを必要に応じて明確にする。
- Stopping condition: agent が grind し続けるのではなく、user に聞くべき条件や stop condition を持つ。
- Weak / vague goal repair: `make progress`、`improve things` のような activity goal を verifiable outcome に sharpen する。
- Quantifiable or otherwise honest verification: domain が support する場合は quantitative target を使い、そうでない場合は honest binary validator や review criteria を使う。

これらの similarity は、documented provenance が derivation を示していないため、independent convergence として扱います。

## Key workflow difference

`goal-draft-policy` v1 は human-review-before-activation workflow に限定されています。Reviewed draft で停止し、Goal activation、persistence、continuation、execution、completion auditing は Skill scope 外です。Explicit `$goal-draft-policy` invocation があっても、この Skill は Goal を activate しません。

Official `define-goal` は goal creation / refinement Skill です。Reviewed Skill text では、quality bar を満たした objective について active goal state を確認し、条件が合えば `create_goal` を呼ぶ workflow が含まれています。これは `goal-draft-policy` v1 の reviewed-draft boundary とは異なる workflow boundary です。

この違いは competitive ranking ではありません。両者は Goal definition に関わりますが、workflow responsibility が違います。

## Project-specific differences

`goal-draft-policy` v1 には、evaluation-heavy / comparison-heavy / evidence-driven use cases のために project-specific policy が追加されています。

- Evaluation outcome-bias guard: candidate adoption / victory / improvement を hidden success condition にしない。
- Goal success vs candidate success distinction: Goal の完了と candidate の成功を分離する。
- Candidate comparison endings: adopt / reject / inconclusive を valid completion として許容する。
- Post-hoc scoring-axis / success-criterion guard: candidate output を見た後に candidate を有利にする scoring axis や success criteria を追加しない。
- Comparison population freeze: comparison population を opportunistically redefine しない。
- Baseline / benchmark / evaluation-contract guard: baseline、benchmark、evaluation contract を途中で quietly repair して desired result を作らない。
- Fixed-target provenance requirement: measurable surface と fixed target を分け、pre-fixed target の provenance を要求する。
- Bounded technical investigation loop: uncertainty reduction、largest evidence gap、smallest defensible next action、continue / pivot / stop を明示する。
- Premature blocker prevention: wrong first hypothesis、one failed command、one failed verification を blocker にしない。
- Explicit / implicit invocation boundary: T06 failure 後、combined draft-and-execute request は implicit invocation 対象外とし、explicit invocation は reviewed draft で停止する。

Reviewed `define-goal` Skill text には、Goal definition、quantification、weak goal repair、active goal state check、`create_goal` workflow の dedicated guidance があります。一方で、上記の evaluation-integrity / fixed-target provenance / bounded investigation / T06 invocation-boundary の exact project-specific rules は reviewed Skill text では dedicated rule として identified していません。

これは `define-goal` がその状況を扱えないという主張ではありません。Observation scope は、reviewed official Skill text に dedicated rule が見つかったかどうかに限定します。

## Comparison table

| Area | OpenAI `define-goal` | `goal-draft-policy` v1 |
|---|---|---|
| Goal suitability | Goal definition が必要か確認し、ordinary implementation work には Goal creation を強制しない。 | Goal mode が durable objective、validation / evidence loop、verifiable stopping condition を持つか確認する。 |
| Concrete outcome | Done のときに true になる specific outcome を要求する。 | Outcome を durable objective として書き、task type に応じた valid ending を許容する。 |
| Verification evidence | Tests、checks、CI jobs、evals、commands、acceptance criteria、manual review criteria などを Goal に含める。 | Actual available surfaces に grounded した command、artifact、report、manual check、runtime behavior を明記し、invented surface を避ける。 |
| Scope / boundaries | In scope / out of scope、affected artifacts、allowed commands、target environment、blast radius などを扱う。 | Sources、boundaries、non-goals、constraints、変更してはいけないものを明記する。 |
| Stopping | user に聞くべき stop condition を含める。 | task-specific stopping と defensible blocked condition を含める。 |
| Goal creation / draft boundary | Quality bar を満たしたら active goal state を確認し、条件が合えば `create_goal` を呼ぶ workflow を含む。 | Human-review-before-activation に限定し、reviewed draft で停止する。Goal activation は scope 外。 |
| Evaluation outcome bias | Reviewed Skill text に dedicated rule は identified していない。 | Candidate adoption / victory / improvement を hidden success condition にしない dedicated rule がある。 |
| Candidate comparison endings | Reviewed Skill text に adopt / reject / inconclusive framing の dedicated rule は identified していない。 | Adopt / reject / inconclusive を evidence-supported valid completion として扱う。 |
| Post-hoc metric changes | Reviewed Skill text に post-hoc scoring-axis guard の dedicated rule は identified していない。 | Metrics、scoring axes、success criteria、evaluation contract の opportunistic redefinition を禁止する。 |
| Comparison population | Reviewed Skill text に comparison population freeze の dedicated rule は identified していない。 | Comparison population を freeze し、途中で都合よく変えない。 |
| Fixed-target provenance | Quantitative target を domain が support する場合に使う guidance がある。 | Measurable surface と pre-fixed target を分け、documented provenance のない threshold invention を禁止する。 |
| Technical investigation | Research では decision、sources / systems in scope、evidence standard を定義する heuristic がある。 | Bounded falsifiable question、largest evidence gap、smallest defensible next action、continue / pivot / stop の investigation loop を持つ。 |
| Blocker handling | Stop and ask condition を扱う。 | Public completion-audit behavior から抽象化した strict blocked handling と premature blocker prevention を持つ。 |
| Behavioral evaluation record | Official Skill text 自体にはこの project の manual behavioral evaluation record はない。 | `results/v1-evaluation.md` に T06 failure、scope revision、retest PASS、O-01 / O-02 / O-03 を記録している。 |

## Interpretation

`define-goal` は general-purpose Goal-definition Skill です。`goal-draft-policy` v1 は、より narrow な reviewed-draft workflow boundary を持ちます。

Local Skill の distinct project-specific value は、単に Goal を定義できることではありません。特に、reviewed-draft workflow separation と、evaluation-heavy / comparison-heavy / evidence-driven use cases における evaluation integrity、fixed-target provenance、bounded technical investigation に焦点があります。

Similarity は copying を証明しません。この comparison では、documented provenance が derivation を示さない限り、similarity を independent convergence として扱います。

## Sources

- `define-goal`
  - Owner / publisher: OpenAI
  - Repository: `openai/skills`
  - Reviewed path: `skills/.curated/define-goal/SKILL.md`
  - Canonical URL: https://github.com/openai/skills/blob/main/skills/.curated/define-goal/SKILL.md
  - Used aspect: official curated Skill name、description / stated purpose、workflow、goal quality bar、quantification heuristics、scope of goal creation / refinement。

- `skill/goal-draft-policy/SKILL.md`
  - Owner / publisher: this project
  - Repository: `yshmr/codex-goal-draft-policy`
  - Reviewed path: `skill/goal-draft-policy/SKILL.md`
  - Used aspect: local v1 policy shape、reviewed-draft boundary、project-specific evaluation-integrity / fixed-target / investigation policies。

- `results/v1-evaluation.md`
  - Owner / publisher: this project
  - Repository: `yshmr/codex-goal-draft-policy`
  - Reviewed path: `results/v1-evaluation.md`
  - Used aspect: v1 provenance、T06 failure and revision、decision `KEEP v1`。
