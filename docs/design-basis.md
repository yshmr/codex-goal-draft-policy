# Design Basis

## Purpose

この文書は、`goal-draft-policy` v1 がなぜ現在の policy shape になっているのかを説明する design provenance document です。

この文書の目的は次です。

- Skill が現在の policy shape を持つ理由を説明する。
- OpenAI official design input と project-specific extension を分離する。
- future revision のために provenance を保存する。
- project decision を後から OpenAI guidance として提示しないようにする。
- `skill/goal-draft-policy/SKILL.md` を normative source of truth として維持する。

この文書自体は normative Skill policy ではありません。normative source of truth は引き続き次です。

`skill/goal-draft-policy/SKILL.md`

この文書を、OpenAI がこの Skill policy 全体を endorse している根拠として使わないでください。OpenAI source は、その source が支えている特定の principle に対する design input としてのみ記録します。Project-specific extension と behavioral revision は明示的にそう分類します。

## Design input categories

### A. OpenAI Codex Goal guidance

OpenAI が公開している Codex Goal guidance は、Goal を「thread-scoped で evidence-based completion を持つ completion contract」として扱う基本形を支えています。現在の Skill は、Goal mode suitability を判断し、ready-to-paste の `/goal` objective を draft するときに、この Goal contract の構造を採用しています。

| Design principle | Skill policy area | Official basis |
|---|---|---|
| 1 つの durable objective | `Suitability Check`, `Draft Requirements`, `Self-Review Before Presenting` | `Follow a goal` は、Goal を 1 回の prompt より大きく open-ended backlog より小さい work に使い、Codex が何を achieve し、何を変えず、どう validate し、いつ stop するかを定義すると説明しています。 |
| 1 回の prompt より大きく、open-ended backlog より小さい | `Suitability Check` | `Follow a goal` の Goal suitability guidance に基づきます。 |
| Clear / verifiable completion | `Suitability Check`, `Verification Grounding`, `Stopping Conditions` | Codex prompting documentation は、Goal text が starting prompt と completion criteria の両方として働き、specific outcome、measurable target、test criteria を含む Goal が望ましいと説明しています。 |
| Outcome、verification surface、constraints、boundaries、iteration policy、blocked stop condition | `Draft Requirements`, `Iteration Policy`, `Stopping Conditions` | `Using Goals in Codex` は、強い Goal を outcome、verification surface、constraints、boundaries、iteration policy、blocked stop condition を持つ compact contract として説明しています。 |
| Evidence-based completion | `Evidence First`, `Verification Grounding`, `Self-Review Before Presenting` | `Using Goals in Codex` は、Goal completion は relevant files、tests、logs、benchmark output、generated artifacts などの concrete evidence に照らして確認されるべきだと説明しています。 |
| Goal draft before activation / human review | `Scope`, `Draft Requirements`, output shape | `Using Goals in Codex` は、task は明確だが Goal が未整理な場合、Codex に draft Goal を作らせ、activation 前に success condition、verification surface、constraints、blocked stop condition を review / tighten する workflow を説明しています。 |
| Prompting benefits from verification and focused scope | `Verification Grounding`, `Iteration Policy` | Codex prompting documentation は、Codex が work を verify できると output quality が上がり、complex work は smaller focused steps に分けると test / review しやすくなると説明しています。 |

この Skill は、これらの document が `goal-draft-policy` そのものを specification として定義しているとは主張しません。この project は、generic Goal completion-contract structure を grounding するためにのみ使っています。

### B. Public Codex continuation / completion-audit behavior

公開されている `openai/codex` Goal continuation template は、この Skill の policy specification ではありません。この project は、その public Codex continuation / completion-audit behavior から Goal drafting に適用可能な principle を抽象化しました。

抽象化した principle は次です。

- actual current worktree と external state は conversation memory より authoritative。
- authoritative evidence を inspect してから completion や next action を判断する。
- completion は verified されるまで unproven として扱う。
- explicit requirement、artifact、command、test、gate、deliverable に対応する evidence を確認する。
- weak、indirect、uncertain、missing evidence は completion proof として不十分。
- verification scope は claim scope を cover する必要がある。
- obvious remaining issue が見つからないことは completion proof ではない。
- success を existing work や easier subset に合わせて redefine しない。
- blocked は ordinary uncertainty、difficulty、one failed attempt ではなく real impasse を表す。

これらの principle は、Skill の次の部分に反映されています。

- `Evidence First` は、actual repository state と最も近い available source を優先します。
- `Verification Grounding` は、concrete test、command、artifact、runtime check、review output を要求し、invented verification surface を避けます。
- `Stopping Conditions` は generic ではなく task-specific です。
- premature blocker prevention は、bounded next action が残っている限り ordinary uncertainty を blocker として扱いません。

### C. Project-specific policy extensions

以下は project-specific extension です。OpenAI official policy としては記録しません。

#### Evaluation / decision integrity

General Goal definition は、work に verifiable completion condition があるかを問います。この project の evaluation-integrity extension は、それに加えて、その completion condition が desired conclusion を先に決めずに到達可能かを問います。

この Skill は evaluation、comparison、technical decision Goal に対して追加の guard を持ちます。

- candidate adoption、victory、improvement を hidden success condition にしない。
- Goal success と candidate success を分離する。
- candidate / binary comparison では、evidence が支える場合、adopt、reject、inconclusive のいずれも valid completion とする。
- broader decision task では、adopt / reject / inconclusive frame を強制するのではなく、actual task から valid decision space を導出する。
- metrics、baseline、gates、benchmark、evaluation contract、comparison population を opportunistically redefine しない。
- candidate output を見た後に scoring axis や success criteria を追加して candidate を有利にしない。
- current evaluation contract の不足が見つかった場合、それを finding、limitation、future redesign input として扱う。
- current experiment の途中で evaluation contract を quietly repair して desired result を作らない。

この extension は、blind / fixed-contract evaluation practice を preserve するという project requirement と、この Skill の intended use cases から追加した project-specific extension です。OpenAI official policy として記録しているものではありません。

#### Fixed-target optimization integrity

この Skill では、measurable surface が存在することと fixed target が存在することを分けて扱います。

- task が explicit optimization task か確認する。
- target が optimization loop の前に固定されているか確認する。
- target が documented requirement、benchmark contract、acceptance criterion に provenance を持つか確認する。
- pre-fixed target がない場合、`quality >= X`、`latency <= Y`、`token reduction >= Z` のような threshold を Goal drafting の都合で invent しない。
- fixed target 不在は risk、ambiguity、または blocker になり得る。

これは project-specific extension です。OpenAI Goal guidance は measurable target と verification surface を支えますが、この stricter fixed-target provenance rule は post-hoc threshold invention を防ぐための local policy です。

#### Bounded technical investigation

この Skill は、investigation の outcome を uncertainty reduction として扱うことを許容します。現在の concrete investigation loop はこの project が整理した policy shape です。

- 可能な場合は one bounded falsifiable investigation question にする。
- largest unresolved evidence gap を特定する。
- smallest defensible next action を選ぶ。
- nearest relevant verification / inspection surface を使う。
- action 後に evidence state を update する。
- evidence に基づいて continue / pivot / stop を判断する。
- wrong first hypothesis を blocker にしない。
- one failed command / one failed verification を premature blocker にしない。
- bounded next action が残る限り investigation continuation を許容する。
- complete root-cause understanding のような open-ended stopping condition を避ける。

この loop は OpenAI Goal guidance と public blocked-audit principle の影響を受けていますが、現在の具体的な investigation framing は project-specific synthesis です。

### D. Behavioral-evaluation-driven revision

Manual behavioral evaluation により、Skill の scope boundary が変更されました。重要な case は T06 です。

#### Initial design assumption

初期 design では、`goal-draft-policy` は combined draft-and-execute request に対しても implicit trigger し、same-turn human-review boundary を維持する Skill として扱っていました。意図した behavior は、Goal を draft または review し、activation の前で停止することでした。

#### Observed T06 failure

T06 initial run では次が観測されました。

- user は `$goal-draft-policy` を explicit invoke していなかった。
- Skill が implicitly triggered された。
- active `SKILL.md` が loaded された。
- repository evidence が inspected された。
- Goal が designed された。
- Goal が activated された。
- implementation / verification execution が開始された。

#### Finding

Skill を mandatory same-turn Goal governance gate として扱う design assumption は不適切でした。Human-reviewable Goal を draft する Skill は、user が reviewed draft のために explicit invoke した場合を除き、Goal activation、persistence、continuation、execution、completion auditing を govern する責任を負うべきではありません。

#### Policy decision

現在の v1 は、次の scope shape を採用しています。

- human-review-before-activation workflow に scope を限定する。
- combined draft-and-execute request は implicit invocation 対象外とする。
- explicit `$goal-draft-policy` invocation は reviewed draft で停止する。
- Goal activation / persistence / continuation / execution / completion auditing は Skill scope 外とする。

この revision は OpenAI official requirement のコピーではありません。Observed behavioral failure と Skill / Goal workflow responsibility separation に基づく project decision です。

T06 retest は scope revision 後に PASS し、`results/v1-evaluation.md` は initial failure、finding、policy revision、retest history を保存しています。

## Current policy-shape summary

現在の v1 policy shape は、次の層で構成されています。

```text
OpenAI Goal guidance
  -> completion-contract structure

Public Codex continuation / completion-audit behavior
  -> evidence / verification / blocker discipline

Project-specific extensions
  -> evaluation integrity / fixed-target provenance / bounded investigation

Behavioral evaluation findings
  -> human-review-before-activation scope / implicit-explicit invocation boundary

Current goal-draft-policy v1
```

これらの layer により、`goal-draft-policy` v1 は Goal draft / review Skill であり、Goal runtime controller や mandatory governance gate ではない、という current shape になっています。

## Design inputs / Sources

- `Using Goals in Codex`
  - Owner / publisher: OpenAI
  - URL: https://developers.openai.com/cookbook/examples/codex/using_goals_in_codex
  - Used aspect: Goal completion-contract framing、outcome / verification surface / constraints / boundaries / iteration policy / blocked stop condition、evidence-based completion、draft-before-activation workflow。

- `Follow a goal`
  - Owner / publisher: OpenAI
  - URL: https://developers.openai.com/codex/use-cases/follow-goals
  - Used aspect: Goal suitability、work larger than one prompt but smaller than an open-ended backlog、validation progress、stop condition。

- `Prompting`
  - Owner / publisher: OpenAI
  - URL: https://developers.openai.com/codex/prompting
  - Used aspect: verification-friendly prompting、specific outcome / measurable target / test criteria、focused task decomposition、Goal text as completion criteria。

- `continuation.md`
  - Owner / publisher: OpenAI, `openai/codex` public repository
  - URL: https://github.com/openai/codex/blob/main/codex-rs/ext/goal/templates/goals/continuation.md
  - Used aspect: public Goal continuation / completion-audit behavior から抽象化した evidence-first principle、verification-scope discipline、strict blocked handling。

- `Testing Agent Skills Systematically with Evals`
  - Owner / publisher: OpenAI
  - URL: https://developers.openai.com/blog/eval-skills
  - Used aspect: Skill evaluation approach、explicit / implicit trigger cases、negative controls、small targeted prompt sets、checkable definition of success、rubric-based grading、observed failure からの regression coverage。

- `Agent Skills`
  - Owner / publisher: OpenAI
  - URL: https://developers.openai.com/codex/skills
  - Used aspect: Skill structure、reusable workflow framing、progressive disclosure、`SKILL.md` name / description as trigger signals。

- `results/v1-evaluation.md`
  - Owner / publisher: this project
  - URL: local repository file
  - Used aspect: T06 initial failure、finding、policy revision、T06 retest PASS、decision `KEEP v1`、O-01 / O-02 / O-03 minor observation status。

OpenAI curated `define-goal` Skill は original v1 design input ではありません。`define-goal` との関係は retrospective comparison として `docs/define-goal-comparison.md` に記録しています。
