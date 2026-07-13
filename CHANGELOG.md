# 変更履歴

## v2 evaluation program -- 2026-07-13

- v1 manual authority、T06 failure/revision、O-01/O-02/O-03を不変のhistorical recordとして保存しました。
- MIT LICENSEとinstall可能なSkill distribution metadataを追加しました。
- Skill descriptionのimplicit invocation exclusionと、no-repository、already-achieved、monorepo/CI mismatch、fixed-target provenance、healthy Goal preservation policyを強化しました。
- provider実行前に固定するv2 evaluation contractを追加しました。
- 16 trigger、12 quality、3 E2E caseと8 synthetic fixtureを追加しました。
- `codex exec --json` paired runner、real `/goal` E2E runner、deterministic grader、blind review pack generatorを追加しました。
- JSON/JSONL schema、fixture/result hash、public-safety、Markdown link、frontmatter、ID uniquenessを検査するpure validatorを追加しました。
- 通常pushでprovider evalを実行しないpure GitHub Actions workflowを追加しました。
- official fact、project method、inference、tested observationを分離したprovenanceとreviewer guideを追加しました。
- v2 provider/E2E resultはmanifestが存在する実行だけをauthorityとし、未実行をpassとして扱わない方針を追加しました。

## v1 -- 2026-07-09

- この repository を `goal-draft-policy` の source-of-truth および evaluation home として初期化しました。
- 初期の evidence-first Goal draft policy を記録しました。
- Goal suitability、verification、constraints、iteration、stopping design を記録しました。
- evaluation / decision における outcome-bias guard を記録しました。
- fixed-target optimization exception を記録しました。
- premature blocker prevention を記録しました。
- human-review-before-activation scope を記録しました。
- T06 failure を受けて、combined draft-and-execute implicit exclusion を追加しました。
- explicit invocation precedence を記録しました。
- 完了した manual behavioral evaluation を記録しました。
- v1 design provenance を記録しました。
- OpenAI Goal guidance / public continuation-audit input と project-specific extension を分離しました。
- T06-driven scope revision の provenance を記録しました。
- OpenAI curated `define-goal` との retrospective comparison を追加しました。
- `define-goal` は original v1 design input ではなく、retrospective comparison として扱うことを明記しました。
- README の install 導線を `skill-installer` への依頼文に整理しました。
- Decision: `KEEP v1`
