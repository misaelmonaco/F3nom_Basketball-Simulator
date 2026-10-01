/* Quanto riescono gli scenari: per ognuno gioca N carriere e conta obiettivi raggiunti e falliti.
   Uso: node tools/scenarios.js [N] [SEED] [--manual] [--difficulty=normal] [--only=id] */
"use strict";
const { createGame } = require("./harness");

const args = process.argv.slice(2);
const flag = name => { const a = args.find(x => x.startsWith(`--${name}=`)); return a ? a.split("=")[1] : null; };
const nums = args.filter(a => !a.startsWith("--")).map(Number);
const N = nums[0] || 200, SEED = nums[1] || 42;
const manual = args.includes("--manual");
const difficulty = flag("difficulty") || "normal";

const game = createGame({ seed: SEED, manual, difficulty, scenarioContinue: false });
const ids = flag("only") ? [flag("only")] : game.run("SCENARIOS.map(s => s.id)");
for (const id of ids) {
  const r = game.run(`(() => {
    let done = 0, failed = 0, seasons = 0, doneSeasons = 0;
    for (let i = 0; i < ${N}; i++) {
      const out = balancePlayCareer(null, ${JSON.stringify(id)});
      const s = out.player.scenario;
      if (s.status === "done") { done++; doneSeasons += s.seasons; } else failed++;
      seasons += out.player.history.length;
    }
    return { done, failed, seasons: seasons / ${N}, doneSeasons: done ? doneSeasons / done : 0 };
  })()`);
  console.log(`${id.padEnd(13)} riusciti ${(r.done / N * 100).toFixed(1).padStart(5)}%  ·  stagioni giocate ${r.seasons.toFixed(1)}  ·  riuscito dopo ${r.doneSeasons.toFixed(1)} stagioni`);
}
