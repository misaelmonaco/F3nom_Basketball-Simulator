/* Simulatore di bilanciamento: gioca N carriere complete senza interfaccia e stampa le
   distribuzioni principali (voti, picco di overall, premi, leghe frequentate...).
   Carica script.js così com'è in un contesto isolato con un DOM finto, quindi misura
   esattamente le formule del gioco.

   Uso:  node tools/balance.js [carriere=500] [seme]
         node tools/balance.js 500 42 --json    (output JSON, per confronti automatici)
         node tools/balance.js 500 42 --seasons (aggiunge l'impatto stagionale per lega/OVR)
         node tools/balance.js 500 42 --safe    (stagione regolare sempre con carico normale e scelte prudenti)
         node tools/balance.js 500 42 --workload=push   (carico fisso: push, normal, rest; oppure smart)
         node tools/balance.js 500 42 --agent=shark     (agente fisso: none, shark, builder, brand) */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const args = process.argv.slice(2);
const flags = new Set(args.filter(a => a.startsWith("--")));
const [careersArg, seedArg] = args.filter(a => !a.startsWith("--"));
const CAREERS = parseInt(careersArg || "500", 10);
const SEED = seedArg != null ? parseInt(seedArg, 10) : null;

/* ---------- DOM finto: quanto basta perché il rendering non si rompa ---------- */
function fakeElement() {
  return {
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    style: {}, dataset: {}, value: "", textContent: "", innerHTML: "", checked: false,
    addEventListener() {}, appendChild() {}, remove() {}, setAttribute() {}, click() {},
    querySelector() { return fakeElement(); }, querySelectorAll() { return []; },
    getBoundingClientRect() { return { top: 0, left: 0, width: 0, height: 0 }; },
  };
}
const storage = {};
const context = {
  console,
  document: {
    getElementById: () => fakeElement(),
    createElement: () => fakeElement(),
    querySelector: () => fakeElement(),
    querySelectorAll: () => [],
    addEventListener() {},
  },
  localStorage: {
    getItem: k => (k in storage ? storage[k] : null),
    setItem: (k, v) => { storage[k] = String(v); },
    removeItem: k => { delete storage[k]; },
  },
  setTimeout: () => 0, clearTimeout() {},
  confirm: () => true, alert() {},
};
vm.createContext(context);

if (SEED != null) {
  // mulberry32: generatore piccolo e deterministico, sostituisce Math.random nel contesto del gioco
  vm.runInContext(`(() => {
    let a = ${SEED} >>> 0;
    Math.random = function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  })();`, context);
}

const gameSource = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");
vm.runInContext(gameSource, context, { filename: "script.js" });
// saveCareer serializza tutta la carriera a ogni render: inutile qui e rallenta molto
vm.runInContext("saveCareer = function () {};", context);

/* ---------- driver: crea una carriera e risolve ogni decisione con scelte casuali ---------- */
const driver = `
const BALANCE_SAFE = ${flags.has("--safe")};
const BALANCE_AGENT = ${JSON.stringify(((args.find(a => a.startsWith("--agent=")) || "").split("=")[1]) || null)};
const BALANCE_WORKLOAD = ${JSON.stringify(((args.find(a => a.startsWith("--workload=")) || "").split("=")[1]) || null)};
function balanceNewCareer() {
  const role = choice(ROLES).id;
  const archetype = choice(ARCHETYPES_BY_ROLE[role]);
  const path = choice(PATHS);
  const nationality = path.id === "USA_HS" ? "USA" : choice(EUROPEAN_NATIONALITIES);
  const r = BODY_RANGES[role];
  const leagueId = path.id === "USA_HS" ? "NCAA" : pickHomeEuroLeague(nationality);
  resetTeamStrengths();
  player = newPlayerState({
    firstName: "Sim", lastName: "Player", nationality, role, archetypeId: archetype.id,
    height: randInt(r.hMin, r.hMax), weight: randInt(r.wMin, r.wMax), path, leagueId,
    team: pickTeam(leagueId), jerseyNumber: randInt(0, 99),
  });
  return { path: path.id };
}
function balanceStep() {
  popupQueue = []; popupActive = false;
  const d = player.pendingDecision;
  if (!d) { advanceSeason(); return; }
  switch (d.type) {
    case "seasonFocus": resolveSeasonFocus(choice(SEASON_FOCUS_OPTIONS).id); break;
    case "seasonBlock": {
      if (BALANCE_SAFE) { simulateRestOfSeason(); break; }
      const situation = d.situation ? getSituation(d.situation) : null;
      let workload = BALANCE_WORKLOAD || choice(d.options);
      if (BALANCE_WORKLOAD === "smart") {
        // strategia "ragionata": spingi quando sei fresco, gestisci quando sei stanco o a rischio
        const risk = blockInjuryRisk(player);
        workload = player.stamina < 45 || risk >= 11 ? "rest" : player.stamina > 70 && risk < 5 ? "push" : "normal";
      }
      resolveSeasonBlock(workload, situation ? choice(situation.options).id : null);
      break; }
    case "postseason": simulateRestOfPostseason(); break;
    case "offseasonChoice": resolveOffseasonChoice(Math.random() < 0.5); break;
    case "offseasonReveal": confirmOffseasonReveal(); break;
    case "draft": resolveDraftDecision(true); break;
    case "market": selectOffer(choice(d.offers), d); break;
    case "negotiate": finalizeContract(); break;
    case "offseasonStatus": d.extensionOffer && Math.random() < 0.5 ? negotiateExtension() : advanceAfterOffseason(); break;
    case "agentChoice": chooseAgent(BALANCE_AGENT || choice(AGENTS).id); break;
    case "playerOption": resolvePlayerOption(Math.random() < 0.5); break;
    case "nationalReveal": confirmNationalReveal(); break;
    case "seasonRecap": if (Math.random() < 0.7) answerRecapInterview(choice(INTERVIEW_TONES).id); closeSeasonRecap(); break;
    default: throw new Error("decisione non gestita: " + d.type);
  }
}
function balancePlayCareer() {
  const info = balanceNewCareer();
  let guard = 0;
  while (!player.retired && guard++ < 1000) balanceStep();
  const hof = hallOfFameVerdict();
  return { info, player, grade: computeCareerGrade(), hof: { elected: hof.elected, firstBallot: hof.pct >= 75 }, jerseys: retiredJerseys().length };
}
`;
vm.runInContext(driver, context);

/* ---------- raccolta dati ---------- */
const pct = (arr, p) => {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(p * s.length))];
};
const mean = arr => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;

const grades = {};
const peak = { all: [], USA_HS: [], EU_YOUTH: [] };
const seasons = [], goat = [], retireAge = [];
const legacy = { hof: 0, firstBallot: 0, jerseys: [] };
const economy = { wealth: [], reputation: [] };
const trophyKeys = ["rings", "domesticTitles", "euroleague", "eurocup", "mvp", "dpoy", "allstar", "bestFive", "bestYoung", "roy", "finalsMvp", "medals"];
const trophies = Object.fromEntries(trophyKeys.map(k => [k, []]));
const leagueSeasons = {};
const seasonRows = [];

for (let i = 0; i < CAREERS; i++) {
  const { info, player, grade, hof, jerseys } = vm.runInContext("balancePlayCareer()", context);
  legacy.hof += hof.elected ? 1 : 0; legacy.firstBallot += hof.firstBallot ? 1 : 0; legacy.jerseys.push(jerseys);
  grades[grade.grade] = (grades[grade.grade] || 0) + 1;
  const pk = Math.max(player.overall, ...player.history.map(h => h.overall));
  peak.all.push(pk); peak[info.path].push(pk);
  seasons.push(player.history.length);
  goat.push(player.goatScore || 0);
  retireAge.push(player.age);
  economy.wealth.push(player.wealth || 0);
  economy.reputation.push(player.reputation == null ? 50 : player.reputation);
  trophyKeys.forEach(k => trophies[k].push(player.trophies[k] || 0));
  player.history.forEach(h => {
    leagueSeasons[h.league] = (leagueSeasons[h.league] || 0) + 1;
    if (flags.has("--seasons")) seasonRows.push({ league: h.league, overall: h.overall - (h.ovrDelta || 0), age: h.age, pts: h.pts, reb: h.reb, ast: h.ast, stl: h.stl, blk: h.blk, tov: h.tov, mpg: h.mpg, awards: h.awards || [] });
  });
}

const totalSeasons = Object.values(leagueSeasons).reduce((a, b) => a + b, 0);
const report = {
  careers: CAREERS, seed: SEED,
  grades: Object.fromEntries(["S", "A", "B", "C", "D", "F"].map(g => [g, round(((grades[g] || 0) / CAREERS) * 100) + "%"])),
  peakOverall: {
    all: { p10: pct(peak.all, 0.1), p50: pct(peak.all, 0.5), p90: pct(peak.all, 0.9), max: Math.max(...peak.all) },
    USA_HS: { p50: pct(peak.USA_HS, 0.5), p90: pct(peak.USA_HS, 0.9) },
    EU_YOUTH: { p50: pct(peak.EU_YOUTH, 0.5), p90: pct(peak.EU_YOUTH, 0.9) },
  },
  seasonsPlayed: { p50: pct(seasons, 0.5), mean: round(mean(seasons)) },
  retireAge: { p50: pct(retireAge, 0.5) },
  goatScore: { p10: pct(goat, 0.1), p50: pct(goat, 0.5), p90: pct(goat, 0.9) },
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
  show("Patrimonio e reputazione", report.economy);
  show("Trofei per carriera", report.trophiesPerCareer);
  show("Stagioni per lega", report.leagueShare);
  if (report.seasonImpact) show("Impatto stagionale per lega e fascia di OVR", report.seasonImpact);
}
