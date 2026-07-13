import { sha256 } from "./lib.mjs";

function utf8(value) {
  return Buffer.from(value, "utf8");
}

function completedCommand(event) {
  return event?.type === "item.completed"
    && event?.item?.type === "command_execution"
    && event.item.status === "completed"
    && event.item.exit_code === 0;
}

function normalizedPathText(value) {
  return typeof value === "string" ? value.replaceAll("\\", "/") : "";
}

function outputObservation(item) {
  const hasStdout = typeof item?.stdout === "string";
  const hasAggregated = typeof item?.aggregated_output === "string";
  if (!hasStdout && !hasAggregated) return { valid: false, bytes: Buffer.alloc(0) };
  if (hasStdout && hasAggregated && item.stdout !== item.aggregated_output) {
    return { valid: false, bytes: Buffer.alloc(0) };
  }
  const text = hasStdout ? item.stdout : item.aggregated_output;
  return { valid: true, bytes: utf8(text) };
}

function indexedCompletedCommands(events) {
  return events.flatMap((event, ordinal) => completedCommand(event) ? [{ event, ordinal }] : []);
}

function sourceReads(events, { derivedSkillPath, derivedSkillText }) {
  const pathToken = normalizedPathText(derivedSkillPath);
  const derivedBytes = utf8(derivedSkillText);
  return indexedCompletedCommands(events).filter(({ event }) => {
    const output = outputObservation(event.item);
    return Boolean(pathToken)
      && normalizedPathText(event.item.command).includes(pathToken)
      && output.valid
      && output.bytes.includes(derivedBytes);
  });
}

function qualifyingActions(events, expectedOutput) {
  const expectedBytes = utf8(expectedOutput);
  return indexedCompletedCommands(events).filter(({ event }) => {
    const output = outputObservation(event.item);
    return output.valid && output.bytes.equals(expectedBytes);
  });
}

function finalMessage(events) {
  const messages = events.filter((event) => event?.type === "item.completed" && event?.item?.type === "agent_message");
  return typeof messages.at(-1)?.item?.text === "string" ? messages.at(-1).item.text : "";
}

function ambientReads(events, baseSkillText) {
  const baseBytes = utf8(baseSkillText);
  return indexedCompletedCommands(events).filter(({ event }) => {
    const output = outputObservation(event.item);
    return normalizedPathText(event.item.command).includes("SKILL.md")
      && output.valid
      && output.bytes.includes(baseBytes);
  });
}

function eventEvidence(record) {
  if (!record) return null;
  return {
    completed_event_ordinal: record.ordinal,
    event_type: record.event.type,
    item_type: record.event.item.type,
    status: record.event.item.status,
    exit_code: record.event.item.exit_code
  };
}

export function detectCandidateStructuredAction({ events, derivedSkillPath, derivedSkillText, marker }) {
  const expectedOutput = `${marker}\n`;
  const sources = sourceReads(events, { derivedSkillPath, derivedSkillText });
  const actions = qualifyingActions(events, expectedOutput);
  const action = actions.length === 1 ? actions[0] : null;
  const source = action ? sources.find((item) => item.ordinal < action.ordinal) : null;
  const sourceId = source?.event?.item?.id;
  const actionId = action?.event?.item?.id;
  const identitiesPresent = typeof sourceId === "string" && sourceId.length > 0
    && typeof actionId === "string" && actionId.length > 0;
  const distinctIdentity = identitiesPresent && sourceId !== actionId;
  const sourceBeforeAction = Boolean(source && action && source.ordinal < action.ordinal);
  const pass = actions.length === 1 && Boolean(source) && distinctIdentity && sourceBeforeAction;
  return {
    pass,
    source_read_count: sources.length,
    qualifying_action_count: actions.length,
    source: eventEvidence(source),
    action: action ? {
      ...eventEvidence(action),
      output_utf8_bytes: utf8(expectedOutput).length,
      output_sha256: sha256(expectedOutput),
      exact_output_match: true,
      command_field_examined: false
    } : null,
    distinct_event_identity: distinctIdentity,
    source_before_action: sourceBeforeAction,
    marker_in_final_output: finalMessage(events).includes(marker),
    failure_reasons: [
      ...(sources.length === 0 ? ["source_read_absent"] : []),
      ...(actions.length !== 1 ? ["qualifying_action_count_not_one"] : []),
      ...(actions.length === 1 && !source ? ["no_source_before_action"] : []),
      ...(source && action && !identitiesPresent ? ["event_identity_absent"] : []),
      ...(source && action && identitiesPresent && !distinctIdentity ? ["event_identity_not_distinct"] : [])
    ]
  };
}

export function detectBaselineAbsence({ events, inventory = [], derivedSkillPath, derivedSkillText, baseSkillText, marker }) {
  const sources = sourceReads(events, { derivedSkillPath, derivedSkillText });
  const actions = qualifyingActions(events, `${marker}\n`);
  const ambient = ambientReads(events, baseSkillText);
  const markerInFinalOutput = finalMessage(events).includes(marker);
  const pass = inventory.length === 0
    && sources.length === 0
    && actions.length === 0
    && !markerInFinalOutput
    && ambient.length === 0;
  return {
    pass,
    skill_inventory_empty: inventory.length === 0,
    source_read_count: sources.length,
    qualifying_action_count: actions.length,
    marker_in_final_output: markerInFinalOutput,
    ambient_skill_read_count: ambient.length,
    command_field_used_for_action: false
  };
}

export function detectStructuredActionPair({ candidate, baseline, derivedSkillPath, derivedSkillText, baseSkillText, marker }) {
  return {
    candidate: detectCandidateStructuredAction({
      events: candidate.events,
      derivedSkillPath,
      derivedSkillText,
      marker
    }),
    baseline: detectBaselineAbsence({
      events: baseline.events,
      inventory: baseline.inventory,
      derivedSkillPath,
      derivedSkillText,
      baseSkillText,
      marker
    })
  };
}
