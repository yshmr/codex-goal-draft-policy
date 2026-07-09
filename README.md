# goal-draft-policy

## About

Codex Skill `goal-draft-policy` の source of truth、評価契約、manual behavioral evaluation result、設計根拠を管理するリポジトリです。

このリポジトリは、Codex Skill `goal-draft-policy` の開発、評価、バージョン管理を行う場所です。

この Skill は、長時間・複数ターン・反復的・証拠駆動の作業に対して、人間が確認してから使える Codex `/goal` completion contract を作成またはレビューします。スコープは human-review-before-activation です。つまり、Goal draft を準備または批評し、activation や execution の前で停止します。

## Skill と Goal workflow の境界

`goal-draft-policy` は、人間が確認できる Goal completion contract を作成・レビューするための policy です。この Skill の境界は reviewed draft までです。Goal activation、persistence、continuation、execution、completion auditing は、この Skill の外側にある別の workflow decision です。この Skill を必須の Goal governance gate として説明しないでください。

## このリポジトリの役割

このリポジトリは、以下の source of truth です。

- `goal-draft-policy` Skill source
- trigger / scope routing の evaluation contract
- Goal draft quality rubric
- representative repository による manual behavioral evaluation observation
- versioned failure mode と tendency
- policy revision と regression baseline

ここは、外部プロジェクトの evaluation を再実行したり、provider-backed evaluation run を管理したり、representative repository copy を保存したり、behavioral evaluation execution environment を維持したりする場所ではありません。評価実行は representative repository、scratch repository、または isolated worktree で行い、このリポジトリには結果の observation だけを保存します。

## Skill source とインストール

repository 側の source of truth は次です。

`skill/goal-draft-policy/SKILL.md`

通常の install には `skill-installer` を使ってください。Codex に次のように依頼します。

```text
$skill-installer で https://github.com/yshmr/codex-goal-draft-policy/tree/main/skill/goal-draft-policy をインストールしてください。
```

install 後は Codex を restart して、新しい Skill を読み込ませてください。

## リポジトリ構成

```text
codex-goal-draft-policy/
├── README.md
├── docs/
│   ├── design-basis.md
│   └── define-goal-comparison.md
├── skill/
│   └── goal-draft-policy/
│       └── SKILL.md
├── evals/
│   ├── test-cases.md
│   └── rubric.md
├── results/
│   └── v1-evaluation.md
├── scripts/
│   └── sync-skill.ps1
└── CHANGELOG.md
```

## 評価方針

このリポジトリの評価は manual behavioral evaluation であり、統計的に有意な model performance claim ではありません。Trigger routing と draft quality scoring は別々の評価対象です。

- trigger case は、Skill を invoke すべきかどうかを確認します。
- quality case は、Skill が invoke された後の reviewed draft の品質を採点します。

v1 の代表評価では主に `ai_development_support_workbench` repository を使いました。context contamination を減らすため、可能な範囲で case は別 thread または isolated worktree で実行しました。

## 現在の v1 結果

Decision: `KEEP v1`

v1 evaluation は、positive trigger case、explicit invocation precedence、scope revision 後の combined draft-and-execute exclusion、negative control、選択した draft quality case を pass しました。scope revision 後に major quality violation は観測されていません。

regression monitoring 用に、既知の minor observation を追跡しています。

- O-01: optimization-specific stopping leakage
- O-02: broad reframe scope
- O-03: already-achieved fixed target substitution

これらは observation であり、v1 の defect と主張しているものではありません。

## 今後の回帰評価

Skill policy を変更する前に、必要に応じて evaluation contract を更新してください。意味のある Skill change の後は、少なくとも次を再実行してください。

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

実利用で見つかった failure mode は、policy change の前または同時に regression case として追加してください。評価した context、expected behavior、result、confidence、decision impact が理解できる十分な detail を `results/` に記録します。

このリポジトリは、この Skill policy に対する OpenAI endorsement を主張しません。また、Codex reliability の一般的な証明として提示しないでください。

## 設計根拠

この policy shape は、OpenAI Codex Goal guidance と公開されている Codex Goal continuation / completion-audit behavior の一部を土台にしています。Public continuation behavior は evidence / verification / blocker discipline に影響し、evaluation integrity、fixed-target provenance、bounded investigation は project-specific extension として追加しています。T06 behavioral failure により、combined draft-and-execute request の invocation / workflow boundary が変更されました。

詳細な design provenance は `docs/design-basis.md` に記録しています。

## OpenAI `define-goal` との関係

`goal-draft-policy` v1 は、OpenAI curated `define-goal` を original design input として扱っていません。v1 の設計根拠は `docs/design-basis.md` に記録した sources と manual behavioral evaluation に基づきます。

Retrospective comparison では、general Goal-definition principles にいくつかの convergence が見られました。一方で、この Skill は reviewed-draft workflow boundary と、evaluation integrity、fixed-target provenance、bounded technical investigation の project-specific policy を維持しています。

詳細は `docs/define-goal-comparison.md` に記録しています。
