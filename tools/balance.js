/* Simulatore di bilanciamento: gioca N carriere complete senza interfaccia e stampa le
   distribuzioni principali (voti, picco di overall, premi, leghe frequentate...).
   Carica i moduli del gioco così come sono (vedi harness.js), quindi misura esattamente
   le formule del gioco.

   Uso:  node tools/balance.js [carriere=500] [seme]
         node tools/balance.js 500 42 --json    (output JSON, per confronti automatici)
         node tools/balance.js 500 42 --seasons (aggiunge l'impatto stagionale per lega/OVR)
         node tools/balance.js 500 42 --safe    (stagione regolare sempre con carico normale e scelte prudenti)
         node tools/balance.js 500 42 --workload=push   (carico fisso: push, normal, rest; oppure smart)
         node tools/balance.js 500 42 --agent=shark     (agente fisso: none, shark, builder, brand)
         node tools/balance.js 500 42 --nostaff         (senza gli effetti di allenatore e stella)
         node tools/balance.js 500 42 --manual          (giocatore attento: squadra più forte e ultimo possesso migliore)
         node tools/balance.js 500 42 --difficulty=hard (livello di difficoltà: easy, normal, hard, legend) */
"use strict";
const { createGame } = require("./harness");

const args = process.argv.slice(2);
const flags = new Set(args.filter(a => a.startsWith("--")));
const [careersArg, seedArg] = args.filter(a => !a.startsWith("--"));
const CAREERS = parseInt(careersArg || "500", 10);
const SEED = seedArg != null ? parseInt(seedArg, 10) : null;
const flagValue = name => ((args.find(a => a.startsWith(`--${name}=`)) || "").split("=")[1]) || null;

const game = createGame({
  seed: SEED, safe: flags.has("--safe"), manual: flags.has("--manual"), nostaff: flags.has("--nostaff"),
  agent: flagValue("agent"), workload: flagValue("workload"), difficulty: flagValue("difficulty"),
});

/* ---------- raccolta dati ---------- */
const pct = (arr, p) => {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(p * s.length))];
};
const mean = arr => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;

const grades = {};
const gradeScores = [];
const peak = { all: [], USA_HS: [], EU_YOUTH: [] };
const seasons = [], goat = [], retireAge = [];
const legacy = { hof: 0, firstBallot: 0, jerseys: [] };
const economy = { wealth: [], reputation: [] };
const trophyKeys = ["rings", "domesticTitles", "euroleague", "eurocup", "mvp", "dpoy", "allstar", "bestFive", "bestYoung", "roy", "finalsMvp", "medals"];
const trophies = Object.fromEntries(trophyKeys.map(k => [k, []]));
const leagueSeasons = {};
const titles = { nbaByOvr: {}, rings2: 0, rings4: 0, maxStreak: [] };
const seasonRows = [];

for (let i = 0; i < CAREERS; i++) {
  const { info, player, grade, hof, jerseys } = game.run("balancePlayCareer()");
  legacy.hof += hof.elected ? 1 : 0; legacy.firstBallot += hof.firstBallot ? 1 : 0; legacy.jerseys.push(jerseys);
  grades[grade.grade] = (grades[grade.grade] || 0) + 1;
  gradeScores.push(grade.score);
  const pk = Math.max(player.overall, ...player.history.map(h => h.overall));
  peak.all.push(pk); peak[info.path].push(pk);
  seasons.push(player.history.length);
  goat.push(player.goatScore || 0);
  retireAge.push(player.age);
  economy.wealth.push(player.wealth || 0);
  economy.reputation.push(player.reputation == null ? 50 : player.reputation);
  trophyKeys.forEach(k => trophies[k].push(player.trophies[k] || 0));
  if (player.trophies.rings >= 2) titles.rings2++;
  if (player.trophies.rings >= 4) titles.rings4++;
  let streak = 0, best = 0;
  player.history.forEach(h => { streak = h.champion ? streak + 1 : 0; best = Math.max(best, streak); });
  titles.maxStreak.push(best);
  player.history.forEach(h => {
    if (h.league === "NBA") {
      const start = h.overall - (h.ovrDelta || 0);
      const key = start >= 90 ? "90+" : start >= 85 ? "85-89" : start >= 80 ? "80-84" : "<80";
      const o = titles.nbaByOvr[key] = titles.nbaByOvr[key] || { seasons: 0, titles: 0 };
      o.seasons++; if (h.champion) o.titles++;
    }
    leagueSeasons[h.league] = (leagueSeasons[h.league] || 0) + 1;
    if (flags.has("--seasons")) seasonRows.push({ league: h.league, overall: h.overall - (h.ovrDelta || 0), age: h.age, pts: h.pts, reb: h.reb, ast: h.ast, stl: h.stl, blk: h.blk, tov: h.tov, mpg: h.mpg, awards: h.awards || [] });
  });
}

const totalSeasons = Object.values(leagueSeasons).reduce((a, b) => a + b, 0);
const report = {
  careers: CAREERS, seed: SEED,
  gradeScore: { p50: pct(gradeScores, 0.5), p78: pct(gradeScores, 0.78), p80: pct(gradeScores, 0.8), p87: pct(gradeScores, 0.87), p88: pct(gradeScores, 0.88) },
  grades: Object.fromEntries(["S", "A", "B", "C", "D", "F"].map(g => [g, round(((grades[g] || 0) / CAREERS) * 100) + "%"])),
  peakOverall: {
    all: { p10: pct(peak.all, 0.1), p50: pct(peak.all, 0.5), p90: pct(peak.all, 0.9), max: Math.max(...peak.all) },
    USA_HS: { p50: pct(peak.USA_HS, 0.5), p90: pct(peak.USA_HS, 0.9) },
    EU_YOUTH: { p50: pct(peak.EU_YOUTH, 0.5), p90: pct(peak.EU_YOUTH, 0.9) },
  },
  seasonsPlayed: { p50: pct(seasons, 0.5), mean: round(mean(seasons)) },
  retireAge: { p50: pct(retireAge, 0.5) },
  goatScore: { p10: pct(goat, 0.1), p50: pct(goat, 0.5), p90: pct(goat, 0.9) },
  titles: {
    nbaTitleRateByOvr: Object.fromEntries(Object.entries(titles.nbaByOvr).sort().map(([k, v]) => [k, `${round((v.titles / v.seasons) * 100)}% su ${v.seasons}`])),
    careersWith2Rings: round((titles.rings2 / CAREERS) * 100) + "%",
    careersWith4Rings: round((titles.rings4 / CAREERS) * 100) + "%",
    streak3plus: round((titles.maxStreak.filter(x => x >= 3).length / CAREERS) * 100) + "%",
  },
  economy: {
    wealthP50: round(pct(economy.wealth, 0.5)), wealthP90: round(pct(economy.wealth, 0.9)),
    reputationP10: pct(economy.reputation, 0.1), reputationP50: pct(economy.reputation, 0.5), reputationP90: pct(economy.reputation, 0.9),
  },
  legacy: {
    hallOfFame: round((legacy.hof / CAREERS) * 100) + "%",
    firstBallot: round((legacy.firstBallot / CAREERS) * 100) + "%",
    withRetiredJersey: round((legacy.jerseys.filter(j => j > 0).length / CAREERS) * 100) + "%",
  },
  trophiesPerCareer: Object.fromEntries(trophyKeys.map(k => [k, { mean: round(mean(trophies[k]), 2), careersWithOne: round((trophies[k].filter(v => v > 0).length / CAREERS) * 100) + "%" }])),
  leagueShare: Object.fromEntries(Object.entries(leagueSeasons).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, round((v / totalSeasons) * 100) + "%"])),
};

if (flags.has("--seasons")) {
  // impatto stagionale per lega e fascia di overall, per calibrare le soglie dei premi
  const impact = r => r.pts + 1.2 * r.reb + 1.5 * r.ast + 2 * r.stl + 2 * r.blk - r.tov;
  const byLeague = {};
  seasonRows.forEach(r => {
    const bucket = Math.floor(r.overall / 5) * 5;
    const key = `${r.league} ${bucket}-${bucket + 4}`;
    (byLeague[key] = byLeague[key] || []).push(impact(r));
  });
  report.seasonImpact = Object.fromEntries(Object.entries(byLeague).filter(([, v]) => v.length >= 20).sort()
    .map(([k, v]) => [k, { n: v.length, p50: round(pct(v, 0.5)), p90: round(pct(v, 0.9)) }]));
}

if (flags.has("--json")) console.log(JSON.stringify(report, null, 2));
else {
  const show = (title, obj) => { console.log(`\n${title}`); console.table(obj); };
  console.log(`Carriere simulate: ${CAREERS}${SEED != null ? ` · seme ${SEED}` : ""}`);
  show("Voti finali", report.grades);
  show("Picco di overall", report.peakOverall);
  console.log(`\nStagioni giocate: mediana ${report.seasonsPlayed.p50} · età di ritiro mediana ${report.retireAge.p50}`);
  show("Punteggio GOAT", report.goatScore);
  show("Eredità", report.legacy);
  show("Titoli", report.titles.nbaTitleRateByOvr);
  console.log(`Carriere con 2+ anelli: ${report.titles.careersWith2Rings} · con 4+: ${report.titles.careersWith4Rings} · con 3+ titoli di fila: ${report.titles.streak3plus}`);
  show("Patrimonio e reputazione", report.economy);
  show("Trofei per carriera", report.trophiesPerCareer);
  show("Stagioni per lega", report.leagueShare);
  if (report.seasonImpact) show("Impatto stagionale per lega e fascia di OVR", report.seasonImpact);
}
