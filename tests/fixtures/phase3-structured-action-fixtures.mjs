export const marker = "PHASE3_STRUCTURED_ACTION_WITNESS_91C6E2AF";
export const baseSkillText = "---\nname: synthetic-candidate\n---\nSYNTHETIC_BASE\n";
export const derivedSkillText = `${baseSkillText}SYNTHETIC_PHASE3_INSTRUCTION ${marker}\n`;
export const derivedSkillPath = "DERIVED_SKILL.md";

function sourceEvent({ id = "source-event", command = "reader DERIVED_SKILL.md" } = {}) {
  return {
    type: "item.completed",
    item: {
      id,
      type: "command_execution",
      command,
      aggregated_output: `BEGIN\n${derivedSkillText}END\n`,
      exit_code: 0,
      status: "completed"
    }
  };
}

function actionEvent({
  id = "action-event",
  command = "shell-wrapper-a --opaque-action",
  output = `${marker}\n`,
  exitCode = 0,
  status = "completed",
  outputField = "aggregated_output"
} = {}) {
  return {
    type: "item.completed",
    item: {
      id,
      type: "command_execution",
      command,
      [outputField]: output,
      exit_code: exitCode,
      status
    }
  };
}

function finalEvent(text = "Synthetic final response without witness text.") {
  return { type: "item.completed", item: { id: "final-event", type: "agent_message", text } };
}

export const candidateCases = [
  {
    name: "pass_posix_wrapper",
    expected: true,
    events: [sourceEvent(), actionEvent({ command: "sh -lc opaque-wrapper-a" }), finalEvent()]
  },
  {
    name: "pass_alternate_wrapper_and_stdout_field",
    expected: true,
    events: [sourceEvent({ command: "alternate-reader DERIVED_SKILL.md" }), actionEvent({ command: "alternate-shell /opaque wrapper-b", outputField: "stdout" }), finalEvent()]
  },
  {
    name: "fail_marker_only_in_source_read",
    expected: false,
    events: [sourceEvent(), finalEvent()]
  },
  {
    name: "fail_marker_only_in_final_prose",
    expected: false,
    events: [finalEvent(`Synthetic final ${marker}`)]
  },
  {
    name: "fail_action_before_source",
    expected: false,
    events: [actionEvent(), sourceEvent(), finalEvent()]
  },
  {
    name: "fail_action_exit_nonzero",
    expected: false,
    events: [sourceEvent(), actionEvent({ exitCode: 7 }), finalEvent()]
  },
  {
    name: "fail_action_incomplete",
    expected: false,
    events: [sourceEvent(), actionEvent({ status: "in_progress" }), finalEvent()]
  },
  {
    name: "fail_action_additional_bytes",
    expected: false,
    events: [sourceEvent(), actionEvent({ output: `${marker}\nEXTRA` }), finalEvent()]
  },
  {
    name: "fail_source_read_absent",
    expected: false,
    events: [actionEvent(), finalEvent()]
  }
];

export const baselineCases = [
  {
    name: "pass_clean_baseline",
    expected: true,
    inventory: [],
    events: [finalEvent()]
  },
  {
    name: "fail_baseline_marker_in_final",
    expected: false,
    inventory: [],
    events: [finalEvent(`Synthetic final ${marker}`)]
  },
  {
    name: "fail_baseline_qualifying_action",
    expected: false,
    inventory: [],
    events: [actionEvent(), finalEvent()]
  },
  {
    name: "fail_baseline_ambient_skill_read",
    expected: false,
    inventory: [],
    events: [{
      type: "item.completed",
      item: {
        id: "ambient-read-event",
        type: "command_execution",
        command: "reader AMBIENT_SKILL.md",
        aggregated_output: baseSkillText,
        exit_code: 0,
        status: "completed"
      }
    }, finalEvent()]
  },
  {
    name: "fail_baseline_inventory",
    expected: false,
    inventory: ["SYNTHETIC_SKILL_ENTRY"],
    events: [finalEvent()]
  }
];
