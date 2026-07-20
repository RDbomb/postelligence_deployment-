const fs = require("fs");
const path = require("path");

function replaceInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    let updated = content;
    
    // Replace case-sensitive occurrences
    updated = updated.replace(/PostSync/g, "Postelligence");
    updated = updated.replace(/postsync/g, "postelligence");
    updated = updated.replace(/POSTSYNC/g, "POSTELLIGENCE");

    if (content !== updated) {
      fs.writeFileSync(filePath, updated, "utf8");
      console.log(`Updated project name in: ${filePath}`);
    }
  } catch (err) {
    console.error(`Failed to process file ${filePath}:`, err);
  }
}

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === "node_modules" || file === ".git" || file === ".next" || file === "rename_project.js") continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else {
      const ext = path.extname(file).toLowerCase();
      if ([".ts", ".tsx", ".js", ".json", ".sql", ".md", ".css", ".html"].includes(ext)) {
        replaceInFile(fullPath);
      }
    }
  }
}

console.log("Starting project rename from PostSync -> Postelligence...");
processDir(".");
console.log("Project rename completed successfully!");
