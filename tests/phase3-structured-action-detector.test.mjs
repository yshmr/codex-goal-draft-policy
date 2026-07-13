import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  detectBaselineAbsence,
  detectCandidateStructuredAction
} from "../scripts/phase3-structured-action-detector.mjs";
import {
  baseSkillText,
  baselineCases,
  candidateCases,
  derivedSkillPath,
  derivedSkillText,
  marker
} from "./fixtures/phase3-structured-action-fixtures.mjs";

for (const fixture of candidateCases) {
  test(`candidate fixture: ${fixture.name}`, () => {
    const result = detectCandidateStructuredAction({
      events: fixture.events,
      derivedSkillPath,
      derivedSkillText,
      marker
    });
    assert.equal(result.pass, fixture.expected);
    assert.equal(result.action?.command_field_examined ?? false, false);
  });
}

for (const fixture of baselineCases) {
  test(`baseline fixture: ${fixture.name}`, () => {
    const result = detectBaselineAbsence({
      events: fixture.events,
      inventory: fixture.inventory,
      derivedSkillPath,
      derivedSkillText,
      baseSkillText,
      marker
    });
    assert.equal(result.pass, fixture.expected);
    assert.equal(result.command_field_used_for_action, false);
  });
}

test("action witness is invariant across the two shell-wrapper representations", () => {
  const passFixtures = candidateCases.filter((fixture) => fixture.expected);
  assert.equal(passFixtures.length, 2);
  const results = passFixtures.map((fixture) => detectCandidateStructuredAction({
    events: fixture.events,
    derivedSkillPath,
    derivedSkillText,
    marker
  }));
  assert.notEqual(passFixtures[0].events[1].item.command, passFixtures[1].events[1].item.command);
  assert.deepEqual(
    results.map(({ pass, source_read_count, qualifying_action_count, distinct_event_identity, source_before_action }) => ({
      pass, source_read_count, qualifying_action_count, distinct_event_identity, source_before_action
    })),
    [
      { pass: true, source_read_count: 1, qualifying_action_count: 1, distinct_event_identity: true, source_before_action: true },
      { pass: true, source_read_count: 1, qualifying_action_count: 1, distinct_event_identity: true, source_before_action: true }
    ]
  );
});

test("fixture corpus contains every predeclared positive and negative class", () => {
  const names = [...candidateCases, ...baselineCases].map((fixture) => fixture.name);
  for (const required of [
    "pass_posix_wrapper",
    "pass_alternate_wrapper_and_stdout_field",
    "fail_marker_only_in_source_read",
    "fail_marker_only_in_final_prose",
    "fail_action_before_source",
    "fail_action_exit_nonzero",
    "fail_action_incomplete",
    "fail_action_additional_bytes",
    "fail_source_read_absent",
    "fail_baseline_marker_in_final",
    "fail_baseline_qualifying_action",
    "fail_baseline_ambient_skill_read"
  ]) assert.ok(names.includes(required), `missing fixture ${required}`);
});

test("fixtures contain no host-local paths, session IDs, or credential-shaped values", () => {
  const text = fs.readFileSync(new URL("./fixtures/phase3-structured-action-fixtures.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(text, /[A-Za-z]:\\Users\\|\/(?:home|Users)\/[^/\s]+\//);
  assert.doesNotMatch(text, /(?:source_)?(?:thread|task|session)[_-]?id\s*[:=]/i);
  assert.doesNotMatch(text, /sk-[A-Za-z0-9_-]{12,}|authorization:\s*bearer/i);
});
