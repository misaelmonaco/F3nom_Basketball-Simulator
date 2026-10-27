"use strict";
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { findBrowser, ROOT } = require("./browser");

const edge = findBrowser();
if (!edge) {
  console.error("No browser found");
  process.exit(1);
}

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width: 100%; height: 100%; background: #0a0c0f; display: flex; align-items: center; justify-content: center; }
svg { width: 84%; height: 84%; }
</style>
</head>
<body>
${fs.readFileSync(path.join(ROOT, "assets", "f3nom-mark.svg"), "utf8")}
</body>
</html>`;

const tmpHtml = path.join(ROOT, "assets", "temp-icon.html");
fs.writeFileSync(tmpHtml, html, "utf8");

const sizes = [192, 512];
for (const s of sizes) {
  const outPng = path.join(ROOT, "assets", `icon-${s}.png`);
  spawnSync(edge, [
    "--headless",
    "--disable-gpu",
    `--window-size=${s},${s}`,
    `--screenshot=${outPng}`,
    tmpHtml
  ]);
  console.log(`Generated ${outPng} (${s}x${s})`);
}

fs.unlinkSync(tmpHtml);
console.log("Icons ready!");

