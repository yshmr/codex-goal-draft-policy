# codex-goal-draft-policy

## 60秒概要

これは、Codexの`/goal`を**有効化する前**に、人間がレビューできるcompletion contractを作成・批評するinstall可能なSkillと、そのSkillを再現可能に評価する独立repositoryです。

- 問題: 長時間タスクを「続けること」だけでGoal化すると、完了証拠、停止条件、評価の公平性、Skillの誤発火が曖昧になります。
- Codex固有の価値: explicit/implicit Skill invocation、`/goal`のthread-scoped lifecycle、draftとactivationの責任境界を直接評価します。
- 配布物: [`skill/goal-draft-policy`](skill/goal-draft-policy/) がinstall単位です。
- 評価物: 16 trigger case、12 draft-quality case、3 E2E case、8 synthetic fixture、`codex exec --json` runner、deterministic grader、schema/hash/safety validatorがあります。
- 現在の結果: pure validationは31 case・8 fixtureでPASS。paired provider比較は6 runすべてcondition contaminationのため`INCONCLUSIVE`。実 `/goal` E2E-01はfailureとcontaminated observationを保存した後、exact approved objectiveのrevision runで達成・fresh verificationを確認。E2E-02/03、blind review、critical n=3は未実行です。
- authority: 既存v1 manual resultは`KEEP v1`。v2はmanifest単位でrevision・failed・contaminatedを分離し、passing rerunで過去failureを上書きしません。
- claim境界: OpenAI公認、production保証、Codex reliability一般、統計的有意性は主張しません。

## Problem

Goal draftの品質とSkill routingは別問題です。良いdraftでもone-off requestへ誤発火すればworkflowを妨げ、正しく発火しても実在しないcommand、post-hoc threshold、preferred candidateの勝利、曖昧なblockerをcompletion contractへ入れれば、長時間実行の判定が歪みます。

このrepositoryは次を分離して扱います。

1. CodexがSkillを使うべきrequestか。
2. Skillがrepository/artifact evidenceを調べたか。
3. reviewed draftがoutcome、verification、constraints、iteration、stoppingを正直に固定したか。
4. 人間承認後の別workflowで実Goalを実行できるか。

## Codex固有の設計

OpenAIの公開資料では、Goalはdurable objectiveとlifecycleを持つthread-scoped completion contractで、Skillは`name`/`description`からexplicitまたはimplicitに選ばれます。本projectはその上に、次のlocal policyを置きます。

- explicit `$goal-draft-policy`: 必ずreviewed draftで停止。
- implicit invocation: Goal draft/review requestに限定。
- implicit除外: combined draft+execute、one-off、通常plan、`/goal`説明質問、active Goal continuation、近似語。
- evaluation: adopt/reject/inconclusiveをすべてvalid endingにできる。
- fixed target: measurableであることと、事前に固定されたthresholdがあることを分離。
- investigation: largest evidence gapからbounded next actionを選び、1回の失敗をblockerにしない。

公式事実、project method、推論、tested observationの区分は[`docs/provenance-v2.md`](docs/provenance-v2.md)にあります。

## Install / use

Codexへ次のように依頼します。

```text
$skill-installer で https://github.com/yshmr/codex-goal-draft-policy/tree/main/skill/goal-draft-policy をインストールしてください。
```

または、[`skill/goal-draft-policy`](skill/goal-draft-policy/)をCodexのuser/repository Skill locationへ配置します。`agents/openai.yaml`はUI metadataと`allow_implicit_invocation: true`を明示しています。

Explicit use:

```text
$goal-draft-policy
このmonorepoのCI整合性改善を、実行前にレビューできる /goal completion contractへしてください。
まだGoalを有効化・実行しないでください。
```

Implicit use:

```text
この比較実験を、結果を見る前に評価contractを固定したreviewed /goal draftへしてください。
承認前には実行しないでください。
```

## 入力 → reviewed draftの例

入力:

```text
$goal-draft-policy EVAL.mdのbaselineとcandidateを比較するGoalを作って。candidateを採用できるまで改善して。
```

期待されるreview:

```text
Goal mode suitability: 複数反復と固定評価contractがあるため適する。
Evidence: EVAL.md、cases.json、go.mod、go test ./...

/goal EVAL.mdで事前固定されたpopulation、baseline、candidate、scoring ruleを変更せず評価し、
go test ./... と指定reportで証拠を残す。candidateのadopt、reject、inconclusiveはいずれも
証拠が支えるvalid completionとする。各反復では最大のevidence gapへ1つのbounded actionを行う。
必要caseまたはrunnerが利用不能で代替経路が尽きた場合は、試行、blocker、解除に必要なinputを報告する。
```

Skillはこのdraftをactivateしません。人間が確認した後、別のGoal workflowで有効化します。

## Evaluation program

事前固定contractは[`evals/contracts/v2-predeclared.json`](evals/contracts/v2-predeclared.json)です。provider出力を見る前にcase、rubric、metric、baseline、model/effort、fixture、gate、valid decision endingを固定します。

- Trigger set: explicit、implicit、contextual、combined、one-off、planning、existing Goal review、説明質問、active continuation、日本語、近似誤発火を含む16件。
- Quality set: suitability、grounding、outcome、verification、constraints、iteration、stopping、scope disciplineを扱う12件。
- Fixtures: Node、Python、Go、monorepo、no-repository、および3つのE2E fixture。
- Baseline: `without_skill`。`with_skill`と同じCodex version、model、effort、prompt、fixtureでpaired comparisonします。
- Repetition: critical stochastic caseはaccess/budgetが許すときn=3。小さいrunはpartialと表示します。
- Grading: objective checksはdeterministic。主観8軸だけconditionを隠したmanual/model reviewを許します。
- Claims: descriptive deltaのみ。統計的有意性は主張しません。

詳細は[`docs/evaluation-design-v2.md`](docs/evaluation-design-v2.md)、grader実装は[`scripts/grader.mjs`](scripts/grader.mjs)、schemaは[`evals/schemas`](evals/schemas/)です。

## 現在の結果とauthority

| Authority | 状態 | 解釈 |
|---|---|---|
| v1 manual evaluation | `KEEP v1` | T06初回failure、revision、clean retest、O-01/O-02/O-03を保存。上書きしない。 |
| v2 predeclared contract | frozen | provider実行前のcase/rubric/gate authority。 |
| v2 paired provider result | `INCONCLUSIVE` | 6 run / 10 cellはすべてcondition isolation contamination。valid `with_skill` / `without_skill`比較なし。 |
| `/goal` E2E-01 exec probe | `failed` | Goal lifecycle evidenceなし。通常taskをE2Eへ再解釈しない。 |
| `/goal` E2E-01 development observation | `contaminated` | method commit前かつapproved objectiveと非同一。 |
| `/goal` E2E-01 revision | `PASS` | exact objective activation、TUI achieved、fresh verifier exit 0、verifier不変。 |
| `/goal` E2E-02 / E2E-03 | `UNEXECUTED` | blocker/decision contractとfixtureのみ。結果claimなし。 |

結果要約は[`results/v2/summary.md`](results/v2/summary.md)、完全な索引は[`results/authority-index.md`](results/authority-index.md)です。blind reviewとcritical n=3はcondition setupが有効化できなかったため未実行で、統計的主張はしません。

## Reproduce

Pure validation（provider/API不要）:

```bash
npm test
```

fixture hash更新（fixtureを意図的に変更した時だけ）:

```bash
npm run fixtures:update
npm test
git diff --exit-code
```

選択したCodex-backed paired run:

```bash
node scripts/run-evals.mjs --ids T-01,T-04,Q-01,Q-02 --max-repetitions 3 --publish
```

runnerはCodex version、model、effort、実行日時、Skill commit、fixture SHA、prompt SHA、exit code、usage、raw trace/output SHAをmanifestへ記録します。raw JSONLにはsession identifierやlocal pathが含まれ得るためcommitせず、sanitized final outputとhashだけを公開します。

実 `/goal` E2Eは、非対話probeとinteractive captureを分離します。正確な手順とhuman-observed terminal labelの制約は[`docs/e2e-protocol.md`](docs/e2e-protocol.md)にあります。

GitHub Actionsはfrontmatter、schema、ID重複、Markdown link、result/hash、fixture integrity、public safety、生成差分をpure validationします。認証・費用・stochasticityを伴うprovider/Codex-backed evalは通常pushで実行しません。

## OpenAI `define-goal`との責任差

OpenAI curated `define-goal`とlocal Skillを単純な勝敗比較にはしません。共通のcontract-quality軸は、具体的outcome、実在verification、scope、停止条件です。

責任境界が異なります。

- `define-goal`: general Goal creation/refinement workflow。確認したofficial Skill textではquality bar後のGoal creation responsibilityを持ちます。
- `goal-draft-policy`: human-review-before-activation専用。reviewed draftを返して停止し、activation、persistence、continuation、execution、completion auditを担当しません。

local Skillの独自価値は、activationしないこと、evaluation integrity、fixed-target provenance、bounded investigation、failure-preserving evaluation programです。これは`define-goal`が劣るという主張ではありません。v1 provenanceを保った詳細は[`docs/define-goal-comparison.md`](docs/define-goal-comparison.md)にあります。

## 制約

- `codex exec --json` event shape、Skill discovery、model availabilityはCodex versionに依存します。
- deterministic graderは表層的な必要条件を検査し、文章品質全体を証明しません。
- synthetic fixtureはreal repositoryの全分布を代表しません。
- provider runはstochasticかつ費用・認証を要します。
- E2Eはisolated synthetic fixtureに限定し、production systemを操作しません。
- paired v2比較はclean candidate Skill discoveryを確立できず`INCONCLUSIVE`です。critical n=3とblind subjective reviewは未実行です。
- 実測E2EはE2E-01のみです。E2E-02 blockerとE2E-03 unbiased decisionは未実証です。
- local環境ではNode/monorepo commandとPython `compileall`はPASS。`pytest`未導入とGo toolchain不在のため、該当test commandは未実行です。
- v1 manual observationは現在のautomated harnessで再解釈しません。

## Claims to Avoid

このrepositoryについて、次を主張しないでください。

- OpenAI公認・推奨・認証済み。
- Codex reliability一般の証明。
- production guaranteeまたは全repositoryでの安全保証。
- 統計的有意性やpopulation-level superiority。
- `define-goal`に対する単純な勝利。
- 未実行case、failed/contaminated run、blind review未実施軸の成功。

## Repository map

```text
skill/goal-draft-policy/       install可能なSkill source
evals/contracts/               provider実行前に固定するcontract
evals/cases/                   JSONL case set
evals/schemas/                 case/result/manifest/review schema
fixtures/                      synthetic evidence surfaces + integrity manifest
scripts/run-evals.mjs          codex exec --json paired runner
scripts/grader.mjs             deterministic grader
scripts/validate.mjs           pure validator / safety scan
results/                       immutable authority indexと実行result
docs/                          provenance、設計、E2E、review guide
.github/workflows/validate.yml pure CI only
```

MIT licensed. See [`LICENSE`](LICENSE).
