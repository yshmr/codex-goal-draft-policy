import test from "node:test";
import assert from "node:assert/strict";
import { value } from "../src/value.js";

test("fixture value", () => assert.equal(value, 42));
