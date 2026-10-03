import fs from "node:fs";
import path from "node:path";

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!full.endsWith(".ts")) continue;
    const original = fs.readFileSync(full, "utf8");
    const updated = original.replace(
      /from\s+(['"])(\.[^'"]+?)\.js\1/g,
      "from $1$2$1",
    );
    if (updated !== original) {
      fs.writeFileSync(full, updated);
      console.log("updated", full);
    }
  }
}

walk("src/ai");
