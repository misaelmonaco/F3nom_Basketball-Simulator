/* Le statistiche delle stagioni USA-1 per fascia di overall: medie, il 95° percentile e il
   massimo di punti, rimbalzi e assist. Serve a controllare che i numeri restino credibili.
   Uso: node tools/statlines.js [CARRIERE] [SEED] [--manual] [--difficulty=normal] */
"use strict";
const { createGame } = require("./harness");

const args = process.argv.slice(2);
const nums = args.filter(a => !a.startsWith("--")).map(Number);
const N = nums[0] || 150, SEED = nums[1] || 42;
const diff = (args.find(a => a.startsWith("--difficulty=")) || "=normal").split("=")[1];
const game = createGame({ seed: SEED, manual: args.includes("--manual"), difficulty: diff });
const rows = game.run(`(() => {
  const out = [];
  for (let i = 0; i < ${N}; i++) {
    const r = balancePlayCareer(null);
    r.player.history.forEach(h => out.push({ league: h.league, ovr: h.overall, pts: h.pts, reb: h.reb, ast: h.ast, stl: h.stl, blk: h.blk, role: r.player.role, mpg: h.mpg }));
  }
  return JSON.stringify(out);
})()`);
const all = JSON.parse(rows);
const seasons = all.filter(s => s.league === "NBA");
const pct = (arr, q) => { const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };
const avg = arr => arr.reduce((t, x) => t + x, 0) / arr.length;
const bins = [[70, 79], [80, 84], [85, 89], [90, 94], [95, 99]];
console.log(`${seasons.length} stagioni USA-1 (${diff})`);
console.log("OVR      n    PTS media/p95/max    REB media/p95/max    AST media/p95/max");
for (const [lo, hi] of bins) {
  const b = seasons.filter(s => s.ovr >= lo && s.ovr <= hi);
  if (!b.length) continue;
  const col = k => `${avg(b.map(s => s[k])).toFixed(1).padStart(5)} ${pct(b.map(s => s[k]), 0.95).toFixed(1).padStart(5)} ${Math.max(...b.map(s => s[k])).toFixed(1).padStart(5)}`;
  console.log(`${lo}-${hi}  ${String(b.length).padStart(5)}  ${col("pts")}    ${col("reb")}    ${col("ast")}`);
}
// le stagioni "impossibili": 35+ punti con 10+ rimbalzi e 10+ assist
const wild = seasons.filter(s => s.pts >= 35 && s.reb >= 10 && s.ast >= 10).length;
console.log("\nUSA-1, 90+ per ruolo (media PTS/REB/AST/STL/BLK)");
["PG", "SG", "SF", "PF", "C"].forEach(r => { const b = seasons.filter(s => s.ovr >= 90 && s.role === r); if (b.length) console.log(`${r.padEnd(3)} ${String(b.length).padStart(4)}  ${["pts", "reb", "ast", "stl", "blk"].map(k => avg(b.map(s => s[k])).toFixed(1)).join(" / ")}`); });
console.log("\nEuropa (SPA-1, ITA-1, FRA-1, TUR-1, GRE-1, ADRIATIC-1), 85+ di overall");
const eu = all.filter(s => ["ESP_ACB", "ITA_LBA", "FRA_ELITE", "TUR_BSL", "GRE_GBL", "ABA"].includes(s.league) && s.ovr >= 85);
if (eu.length) console.log(`${eu.length} stagioni · PTS ${avg(eu.map(s => s.pts)).toFixed(1)} (p95 ${pct(eu.map(s => s.pts), 0.95)}) · REB ${avg(eu.map(s => s.reb)).toFixed(1)} · AST ${avg(eu.map(s => s.ast)).toFixed(1)}`);
console.log(`stagioni da 35+ punti, 10+ rimbalzi e 10+ assist: ${wild} su ${seasons.length}`);
