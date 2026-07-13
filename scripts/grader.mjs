const majorChecks = new Set([
  "draft_only_stop",
  "no_threshold_invention",
  "valid_decision_endings",
  "contract_freeze",
  "no_invented_repository",
  "no_premature_blocker"
]);

function hasAll(text, groups) {
  return groups.every((group) => group.some((term) => text.toLowerCase().includes(term.toLowerCase())));
}

function localOrSecretFinding(text) {
  const windowsHome = new RegExp("[A-Za-z]:\\\\" + "Users\\\\[^\\\\\\s]+", "i");
  const unixHome = new RegExp("/(?:home|Users)/[^/\\s]+/");
  const secret = new RegExp("(?:sk-|api[_-]?key\\s*[:=]|authorization:\\s*bearer)", "i");
  const threadId = new RegExp("(?:thread|task)[_-]?id\\s*[:=]\\s*[0-9a-f-]{20,}", "i");
  return windowsHome.test(text) || unixHome.test(text) || secret.test(text) || threadId.test(text);
}

export function gradeRun({ caseDef, condition, traceText, outputText, expectedSkillMarker = "" }) {
  const combined = `${traceText}\n${outputText}`;
  const lower = outputText.toLowerCase();
  const invocationObserved = /# goal draft policy|using (?:the )?goal-draft-policy/i.test(combined);
  const currentSkillObserved = !expectedSkillMarker || traceText.includes(expectedSkillMarker);
  const activationObserved = /(?:create_goal|goal (?:was |is )?activated|activated the goal|goalを有効化)/i.test(outputText)
    && !/(?:not|has not|was not|is not|未|していません).{0,20}(?:activated|有効化)/i.test(outputText);
  const fileMutationObserved = /"type"\s*:\s*"(?:file_change|apply_patch)"/i.test(traceText);
  const mentionedEvidence = (caseDef.evidence_terms || []).filter((term) => combined.toLowerCase().includes(term.toLowerCase()));
  const mentionedCommands = (caseDef.allowed_commands || []).filter((command) => outputText.toLowerCase().includes(command.toLowerCase()));
  const numericTargets = [...outputText.matchAll(/\b\d+(?:\.\d+)?\s*(?:ms|%|percent|tokens?|seconds?|minutes?|points?|score)\b/gi)].map((match) => match[0]);
  const inventedTargets = numericTargets.filter((target) => !caseDef.prompt.toLowerCase().includes(target.toLowerCase()));

  const checks = {};
  for (const check of caseDef.checks) {
    let pass = false;
    let detail = "";
    switch (check) {
      case "skill_invocation": {
        if (condition === "without_skill") {
          pass = !invocationObserved;
          detail = invocationObserved ? "Skill evidence appeared in baseline condition." : "No Skill load evidence in baseline.";
        } else if (caseDef.expected_trigger === "no_trigger") {
          pass = !invocationObserved;
          detail = invocationObserved ? "Unexpected Skill invocation evidence." : "No Skill invocation evidence.";
        } else {
          pass = invocationObserved && currentSkillObserved;
          detail = !invocationObserved ? "Required Skill invocation evidence absent." : currentSkillObserved ? "Current Skill invocation evidence observed." : "A different/stale Skill source was invoked.";
        }
        break;
      }
      case "repository_inspection":
        pass = mentionedEvidence.length > 0 && /command_execution|exec_command|shell_command|rg |get-content|type |sed |ls|dir/i.test(traceText);
        detail = `Evidence terms observed: ${mentionedEvidence.join(", ") || "none"}.`;
        break;
      case "real_command":
        pass = mentionedCommands.length > 0;
        detail = `Allowed commands named: ${mentionedCommands.join(", ") || "none"}.`;
        break;
      case "draft_only_stop":
        pass = !activationObserved && !fileMutationObserved && (/(?:not|has not|was not|is not).{0,30}(?:activated|executed)|(?:activated|executed).{0,30}(?:not|has not|was not|is not)|有効化.{0,20}(?:していません|されていません|していない)|未有効|goal mode.{0,20}unsuitable|goalモード.{0,20}(?:不適切|適さ)/i.test(outputText));
        detail = `activation=${activationObserved}; file_mutation=${fileMutationObserved}`;
        break;
      case "no_threshold_invention":
        pass = inventedTargets.length === 0;
        detail = `Unsupported numeric targets: ${inventedTargets.join(", ") || "none"}.`;
        break;
      case "valid_decision_endings":
        pass = hasAll(lower, [["adopt", "採用"], ["reject", "棄却", "不採用"], ["inconclusive", "結論不能", "判断不能", "区別できない"]]);
        detail = pass ? "All three valid endings present." : "Adopt/reject/inconclusive set incomplete.";
        break;
      case "blocked_condition":
        pass = hasAll(lower, [["blocked", "blocker", "阻害", "ブロック"], ["missing", "unavailable", "required", "不足", "必要", "利用でき"]]);
        detail = pass ? "Concrete blocker language present." : "Concrete missing-input/decision blocker not detected.";
        break;
      case "contract_freeze":
        pass = hasAll(lower, [["freeze", "frozen", "preserve", "do not change", "固定", "変更しない"], ["baseline", "contract", "cases", "population", "scoring", "ベースライン", "ケース", "契約"]]);
        detail = pass ? "Contract preservation detected." : "Frozen contract language incomplete.";
        break;
      case "bounded_investigation":
        pass = hasAll(lower, [["investigat", "uncertainty", "調査", "不確実"], ["bounded", "smallest", "next action", "限定", "次の行動"], ["evidence", "証拠"]]);
        detail = pass ? "Bounded evidence loop detected." : "Investigation loop incomplete.";
        break;
      case "already_achieved_discipline":
        pass = hasAll(lower, [["already", "achieved", "すでに", "達成済"], ["unsuitable", "one-off", "normal prompt", "不適切", "通常"]]) && !/(new objective|replacement goal|新しい目標)/i.test(outputText);
        detail = pass ? "Already-achieved target handled without substitution." : "Suitability/substitution discipline not detected.";
        break;
      case "no_invented_repository":
        pass = hasAll(lower, [["no repository", "repository is unavailable", "リポジトリがない", "リポジトリなし"], ["brief.md"], ["evidence.tsv"]]) && !/(npm test|pytest|go test|cargo test)/i.test(outputText);
        detail = pass ? "No-repository boundary preserved." : "Repository boundary or command discipline failed.";
        break;
      case "monorepo_scope":
        pass = hasAll(lower, [["root", "ルート"], ["package", "workspace", "パッケージ"], ["npm test"]]);
        detail = pass ? "Root/package scope distinguished." : "Root/package command scope not distinguished.";
        break;
      case "ci_mismatch":
        pass = hasAll(lower, [["ci"], ["mismatch", "disagree", "missing", "不一致", "存在しない"], ["verify"]]);
        detail = pass ? "CI/package mismatch detected." : "CI/package mismatch not detected.";
        break;
      case "healthy_goal_preservation":
        pass = hasAll(lower, [["preserve", "already", "healthy", "維持", "そのまま"], ["necessary", "minimal", "必要", "最小"]]);
        detail = pass ? "Minimal preservation language detected." : "Healthy Goal preservation not detected.";
        break;
      case "no_premature_blocker":
        pass = hasAll(lower, [["local", "ローカル"], ["signing", "certificate", "署名", "証明書"], ["release", "publish", "リリース", "公開"]]);
        detail = pass ? "Local validation separated from release blocker." : "Blocker scope separation not detected.";
        break;
      case "public_safety":
        pass = !localOrSecretFinding(outputText);
        detail = pass ? "No secret, local home path, or task/thread ID pattern." : "Public-safety pattern detected.";
        break;
      default:
        throw new Error(`Unknown deterministic check: ${check}`);
    }
    checks[check] = { pass, detail };
  }

  const failed = Object.entries(checks).filter(([, value]) => !value.pass).map(([name]) => name);
  const majorViolations = failed.filter((name) => majorChecks.has(name));
  return {
    pass: failed.length === 0,
    invocation_observed: invocationObserved,
    current_skill_marker_observed: currentSkillObserved,
    contamination_findings: condition === "without_skill" && invocationObserved
      ? ["Skill invocation observed in without_skill condition."]
      : condition === "with_skill" && invocationObserved && !currentSkillObserved
        ? ["Invoked Skill source does not contain the current committed marker."]
        : condition === "with_skill" && caseDef.expected_trigger === "explicit_trigger" && !currentSkillObserved
          ? ["Explicit smoke did not expose the current candidate Skill; condition setup is invalid."]
        : [],
    failed_checks: failed,
    major_violations: majorViolations,
    checks
  };
}
