import fs from "node:fs";
const cases = JSON.parse(fs.readFileSync(new URL("./cases.json", import.meta.url), "utf8"));
const baseline = cases.reduce((sum, item) => sum + item.baseline, 0);
const candidate = cases.reduce((sum, item) => sum + item.candidate, 0);
const decision = candidate > baseline ? "adopt" : candidate < baseline ? "reject" : "inconclusive";
console.log(JSON.stringify({baseline, candidate, decision}));
