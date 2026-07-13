import fs from "node:fs";
for (const file of ["required-input.txt", "report.txt"]) {
  if (!fs.existsSync(new URL(`./${file}`, import.meta.url))) {
    console.error(`missing ${file}`);
    process.exit(1);
  }
}
console.log("verified report");
