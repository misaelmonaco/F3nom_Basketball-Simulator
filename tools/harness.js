/* Banco di prova condiviso da simulatore (balance.js) e test (test.js): carica i moduli del
   gioco, nell'ordine di index.html, in un contesto isolato con un DOM finto, e aggiunge un
   "driver" che gioca carriere complete risolvendo ogni decisione da solo. */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");

/* I moduli, nello stesso ordine in cui li carica la pagina */
function moduleList() {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  return [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
}

/* ---------- DOM finto: quanto basta perché il rendering non si rompa ---------- */
function fakeElement() {
  return {
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    style: {}, dataset: {}, value: "", textContent: "", innerHTML: "", checked: false,
    addEventListener() {}, appendChild() {}, remove() {}, setAttribute() {}, click() {},
    querySelector() { return fakeElement(); }, querySelectorAll() { return []; },
    getBoundingClientRect() { return { top: 0, left: 0, width: 0, height: 0 }; },
    getContext() { return null; },
  };
}

/* mulberry32: generatore piccolo e deterministico, sostituisce Math.random nel contesto del gioco */
function seededRandomSource(seed) {
  return `(() => {
    let a = ${seed} >>> 0;
    Math.random = function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  })();`;
}

/* ---------- driver: crea una carriera e risolve ogni decisione ---------- */
function driverSource(opts) {
  return `
const BALANCE_SAFE = ${!!opts.safe};
const BALANCE_MANUAL = ${!!opts.manual};
const BALANCE_AGENT = ${JSON.stringify(opts.agent || null)};
const BALANCE_WORKLOAD = ${JSON.stringify(opts.workload || null)};
const BALANCE_DIFFICULTY = ${JSON.stringify(opts.difficulty || null)};
function balanceNewCareer(legacyFrom) {
  const role = choice(ROLES).id;
  const archetype = choice(ARCHETYPES_BY_ROLE[role]);
  const path = choice(PATHS);
  const nationality = legacyFrom ? legacyFrom.nationality : path.id === "USA_HS" ? "USA" : choice(EUROPEAN_NATIONALITIES);
  const r = BODY_RANGES[role];
  const leagueId = path.id === "USA_HS" ? "NCAA" : pickHomeEuroLeague(nationality);
  resetTeamStrengths();
  player = newPlayerState({
    firstName: "Sim", lastName: legacyFrom ? legacyFrom.lastName : "Player", nationality, role, archetypeId: archetype.id,
    height: randInt(r.hMin, r.hMax), weight: randInt(r.wMin, r.wMax), path, leagueId,
    team: pickTeam(leagueId), jerseyNumber: randInt(0, 99),
    difficulty: BALANCE_DIFFICULTY || (typeof DIFFICULTIES !== "undefined" ? "normal" : undefined),
    legacy: legacyFrom && typeof legacySummary === "function" ? legacySummary(legacyFrom) : null,
  });
  return { path: path.id };
}
function balanceStep() {
  popupQueue = []; popupActive = false;
  const d = player.pendingDecision;
  if (!d) {
    if (typeof canAnnounceFarewell === "function" && canAnnounceFarewell(player) && Math.random() < 0.15) announceFarewell();
    advanceSeason();
    return;
  }
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
      if (d.keyGame && !d.keyGameChoice) chooseKeyGame(BALANCE_MANUAL ? bestClutchOption(player, keyGameWinProb(player, player.pendingSeason, d.keyGame)).id : choice(CLUTCH_OPTIONS).id);
      resolveSeasonBlock(workload, situation ? choice(situation.options).id : null);
      break; }
    case "postseason": {
      if (!BALANCE_MANUAL) { simulateRestOfPostseason(); break; }
      // giocatore attento: turno per turno, e l'azione più probabile in ogni partita punto a punto
      if (player.postseason.interview && !player.postseason.interview.answered) answerPostseasonInterview("confident");
      const b = currentBracket();
      if (b && b.pendingClutch) resolveClutch(bestClutchOption(player, b.pendingClutch.winProb).id);
      else advancePostseasonRound();
      break; }
    case "offseasonChoice": resolveOffseasonChoice(Math.random() < 0.5); break;
    case "offseasonReveal": confirmOffseasonReveal(); break;
    case "draft": resolveDraftDecision(true); break;
    case "draftCombine":
      if (d.stage === "combine") chooseCombineShowcase(choice(COMBINE_SHOWCASES).id);
      else if (d.stage === "workout") Math.random() < 0.2 ? skipDraftWorkout() : chooseDraftWorkout(randInt(0, d.workouts.length - 1));
      else finishDraftNight();
      break;
    case "market":
      // ogni tanto si guarda un altro campionato (così si passa anche da quelli meno battuti)
      if (!BALANCE_MANUAL && Math.random() < 0.12) switchOfferLeague(choice(leagueSelectorOptions(player)));
      // il giocatore attento sceglie sempre la squadra più forte
      if (BALANCE_MANUAL) selectOffer([...d.offers].sort((x, y) => y.contractProposal.teamStrength - x.contractProposal.teamStrength)[0], d);
      else selectOffer(choice(d.offers), d);
      break;
    case "negotiate": finalizeContract(); break;
    case "offseasonStatus": d.extensionOffer && Math.random() < 0.5 ? negotiateExtension() : advanceAfterOffseason(); break;
    case "agentChoice": chooseAgent(BALANCE_AGENT || choice(AGENTS).id); break;
    case "playerOption": resolvePlayerOption(Math.random() < 0.5); break;
    case "nationalReveal": confirmNationalReveal(); break;
    case "summerSpending": resolveSummerSpending(Math.random() < 0.25 ? null : choice(SUMMER_SPENDING).id); break;
    case "seasonRecap": if (Math.random() < 0.7) answerRecapInterview(choice(INTERVIEW_TONES).id); closeSeasonRecap(); break;
    case "training": autoTraining(); confirmTraining(); break;
    case "careerGoal": chooseCareerGoal(choice(d.options)); break;
    case "roleBattle": resolveRoleBattle(choice(ROLE_BATTLE_APPROACHES).id); break;
    case "injuryChoice": resolveInjuryChoice(Math.random() < 0.5 ? "surgery" : "conservative"); break;
    case "sponsorOffer": chooseSponsor(Math.random() < 0.8 ? randInt(0, d.offers.length - 1) : -1); break;
    default: throw new Error("decisione non gestita: " + d.type);
  }
}
function balancePlayCareer(legacyFrom) {
  const info = balanceNewCareer(legacyFrom);
  let guard = 0;
  while (!player.retired && guard++ < 1500) balanceStep();
  if (!player.retired) throw new Error("carriera senza fine: " + (player.pendingDecision && player.pendingDecision.type));
  const hof = hallOfFameVerdict();
  return { info, player, grade: computeCareerGrade(), hof: { elected: hof.elected, firstBallot: hof.pct >= 75 }, jerseys: retiredJerseys().length };
}
`;
}

/* Crea un gioco isolato. opts: seed, safe, manual, agent, workload, difficulty, nostaff */
function createGame(opts = {}) {
  const storage = {};
  const context = {
    console,
    document: {
      getElementById: () => fakeElement(),
      createElement: () => fakeElement(),
      querySelector: () => fakeElement(),
      querySelectorAll: () => [],
      addEventListener() {},
      body: fakeElement(),
    },
    window: { scrollTo() {}, scrollX: 0, scrollY: 0 },
    localStorage: {
      getItem: k => (k in storage ? storage[k] : null),
      setItem: (k, v) => { storage[k] = String(v); },
      removeItem: k => { delete storage[k]; },
    },
    setTimeout: () => 0, clearTimeout() {},
    confirm: () => true, alert() {},
  };
  vm.createContext(context);
  if (opts.seed != null) vm.runInContext(seededRandomSource(opts.seed), context);
  moduleList().forEach(src => {
    vm.runInContext(fs.readFileSync(path.join(ROOT, src), "utf8"), context, { filename: src });
  });
  // saveCareer serializza tutta la carriera a ogni render: inutile qui e rallenta molto
  if (!opts.keepSave) vm.runInContext("saveCareer = function () {};", context);
  // nostaff: spegne gli effetti di allenatore e stella, per misurarne il peso
  if (opts.nostaff) vm.runInContext(`
    staffStatMultipliers = () => ({ pts: 1, reb: 1, ast: 1, stl: 1, blk: 1, tov: 1 });
    staffMinutesShift = () => 0;
    staffGrowthFactor = () => 1;
  `, context);
  vm.runInContext(driverSource(opts), context);
  return {
    context,
    storage,
    run: code => vm.runInContext(code, context),
  };
}

module.exports = { createGame, moduleList, ROOT };
