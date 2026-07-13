import fs from "node:fs";
const state = JSON.parse(fs.readFileSync(new URL("./state.json", import.meta.url), "utf8"));
if (state.ready !== true) {
  console.error("state is not ready");
  process.exit(1);
}
console.log("verified ready");
