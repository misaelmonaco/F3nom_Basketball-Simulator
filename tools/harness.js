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
const BALANCE_SCENARIO_CONTINUE = ${opts.scenarioContinue == null ? true : !!opts.scenarioContinue};
function balanceNewCareer(legacyFrom, scenarioId) {
  const scen = scenarioId && typeof getScenario === "function" ? getScenario(scenarioId) : null;
  const role = choice(ROLES).id;
  const archetype = choice(ARCHETYPES_BY_ROLE[role]);
  const path = choice(PATHS);
  const usa = ["USA_HS", "PREP_SCHOOL", "GLEAGUE_PATH"].includes(path.id);
  let nationality = legacyFrom ? legacyFrom.nationality : usa ? "USA" : path.id === "EU_YOUTH" ? choice(EUROPEAN_NATIONALITIES) : choice(NATIONALITIES);
  if (scen && scen.needsHometown) nationality = choice(NATIONALITIES.filter(n => homecomingCities(n).length));
  const r = BODY_RANGES[role];
  let leagueId = path.start ? path.start(nationality) : path.id === "USA_HS" ? "NCAA" : pickHomeEuroLeague(nationality);
  const identity = typeof TRAITS === "undefined" ? {} : {
    hand: Math.random() < 0.15 ? "left" : "right", bodyType: choice(BODY_TYPES).id, look: randomLook(),
    traits: sanitizeTraits([choice(TRAITS).id, choice(TRAITS).id]), hometown: Math.random() < 0.5 ? (choice(hometownCities(nationality)) || null) : null,
  };
  if (scen && scen.needsHometown) identity.hometown = choice(homecomingCities(nationality));
  resetTeamStrengths();
  // scenario: squadre e lega le decide lo scenario (il giocatore attento prende la più forte)
  const setup = scen ? scen.roll() : null;
  const start = scen ? scenarioStart(scen.id, { nationality, hometown: identity.hometown }) : null;
  let team = null;
  if (start) {
    const lg = t => start.leagueOf ? start.leagueOf[t.name] : start.leagueId;
    team = BALANCE_MANUAL ? [...start.teams].sort((a, b) => getTeamStrength(b, lg(b)) - getTeamStrength(a, lg(a)))[0] : choice(start.teams);
    leagueId = lg(team);
  }
  player = newPlayerState({
    firstName: "Sim", lastName: legacyFrom ? legacyFrom.lastName : "Player", nationality, role, archetypeId: archetype.id,
    height: randInt(r.hMin, r.hMax), weight: randInt(r.wMin, r.wMax), path, leagueId,
    team: team || pickTeam(leagueId), jerseyNumber: randInt(0, 99),
    difficulty: BALANCE_DIFFICULTY || (typeof DIFFICULTIES !== "undefined" ? "normal" : undefined),
    legacy: scen && scen.id === "heir" ? heirLegacy(setup, nationality, "Player", "Sim") : legacyFrom && typeof legacySummary === "function" ? legacySummary(legacyFrom) : null,
    ...identity,
  });
  if (scen) applyScenario(player, scen.id, setup, leagueId);
  return { path: path.id, scenario: scenarioId || null };
}
/* Il giocatore attento di uno scenario sceglie l'offerta che serve all'obiettivo */
function balanceScenarioOffer(d) {
  const s = player.scenario;
  if (!BALANCE_MANUAL || !s || s.status !== "active") return null;
  const all = allMarketOffers(player, d).concat(d.renewOffer ? [d.renewOffer] : []);
  const lg = o => o.targetLeague || player.league;
  const strongest = list => [...list].sort((x, y) => y.contractProposal.teamStrength - x.contractProposal.teamStrength)[0] || null;
  const short = o => o;
  if (s.id === "redemption" || s.id === "lastCall") {
    return short(strongest(all.filter(o => lg(o) === "NBA")) || strongest(all.filter(o => o.team.euro === "EL")) || strongest(all));
  }
  if (s.id === "globetrotter") {
    const played = new Set(globetrotterLeagues(player));
    const fresh = all.filter(o => lg(o) !== "NCAA" && !played.has(lg(o)));
    return short(played.size >= 5 ? strongest(all) : strongest(fresh) || strongest(all));
  }
  if (s.id === "homecoming") return all.find(o => o.team.name === s.homeTeam) || null;
  if (s.id === "lastDance") return strongest(all.filter(o => lg(o) === "NBA"));
  return null;
}
/* Negli scenari a scadenza conviene firmare per un anno solo: si resta liberi */
function balanceWantsShort() {
  const s = player.scenario;
  return BALANCE_MANUAL && !!s && s.status === "active" && ["redemption", "lastCall", "globetrotter"].includes(s.id);
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
      if (!BALANCE_MANUAL && Math.random() < 0.12) switchOfferLeague(choice(groupedLeagueOptions(player, d).flatMap(g => g.leagues)));
      { const so = balanceScenarioOffer(d); if (so) { selectOffer(so, d); break; } }
      if (d.flash && Math.random() < 0.3) { selectOffer(d.flash, d); break; }
      // il giocatore attento sceglie sempre la squadra più forte
      if (BALANCE_MANUAL) selectOffer([...d.offers].sort((x, y) => y.contractProposal.teamStrength - x.contractProposal.teamStrength)[0], d);
      else selectOffer(choice(d.offers), d);
      break;
    case "negotiate":
      if (balanceWantsShort() && d.offer.contractProposal.years > 1 && (d.offer.attempts.years || 0) < 2 && (d.offer.patience == null || d.offer.patience > 0)) { negotiateContract("years", 1); break; }
      if (d.offer.stash && d.draftRecord && Math.random() < 0.1) declineDraftOffer(false);
      else if (d.rightsCall && Math.random() < 0.3) declineDraftRights();
      else if (!BALANCE_MANUAL && canAskTeamRole(d.offer.contractProposal) && d.offer.attempts && !d.offer.attempts.role && Math.random() < 0.3) negotiateContract("role");
      else finalizeContract();
      break;
    case "nationalCup":
      if (d.cup && d.cup.pendingClutch) resolveCupClutch(bestClutchOption(player, d.cup.pendingClutch.winProb).id);
      else if (d.cup && !d.cup.done) {
        if (BALANCE_MANUAL) advanceNationalCupRound();
        else simulateNationalCup();
      }
      if (d.cup && d.cup.done) finishNationalCup();
      break;
    case "allStarWeekend": resolveAllStarWeekend(Math.random() < 0.2 ? null : choice(d.contests)); break;
    // il giocatore attento va dalla pretendente, gli altri a volte
    case "tradeDeadline": resolveTradeDeadline(BALANCE_MANUAL ? d.offer.kind === "contender" : Math.random() < 0.5); break;
    case "duoRequest": resolveDuoRequest(choice(DUO_APPROACHES.filter(a => duoApproachAvailable(player, a))).id); break;
    case "offseasonStatus":
      if (typeof canRequestDuo === "function" && canRequestDuo(player) && Math.random() < 0.35) { openDuoRequest(); break; }
      if (contractIncongruence(player, d.record) && player.wealth >= buyoutCost(player) && Math.random() < 0.4) buyContractOut();
      else if (d.extensionOffer && Math.random() < 0.5) negotiateExtension();
      else advanceAfterOffseason();
      break;
    case "agentChoice": chooseAgent(BALANCE_AGENT || choice(AGENTS).id); break;
    case "playerOption": resolvePlayerOption(Math.random() < 0.5); break;
    case "nationalReveal": confirmNationalReveal(); break;
    case "summerSpending":
      if (Math.random() < 0.3) { const item = choice(LIFESTYLE_ITEMS); if (canBuyLifestyle(player, item)) buyLifestyle(item.id); }
      resolveSummerSpending(Math.random() < 0.25 ? null : choice(SUMMER_SPENDING).id); break;
    case "seasonRecap": if (Math.random() < 0.7) answerRecapInterview(choice(INTERVIEW_TONES).id); closeSeasonRecap(); break;
    case "training": autoTraining(); confirmTraining(); break;
    case "careerGoal": chooseCareerGoal(choice(d.options)); break;
    case "scenarioDone": resolveScenarioDone(BALANCE_SCENARIO_CONTINUE); break;
    case "roleBattle": resolveRoleBattle(choice(ROLE_BATTLE_APPROACHES).id); break;
    case "lifeEvent": resolveLifeEvent(d.kind === "child" ? choice(d.names) : choice(d.kind === "meet" ? ["yes", "no"] : ["big", "small", "wait"])); break;
    case "mentorOffer": resolveMentorOffer(Math.random() < 0.5); break;
    case "injuryChoice": resolveInjuryChoice(Math.random() < 0.5 ? "surgery" : "conservative"); break;
    case "sponsorOffer": chooseSponsor(Math.random() < 0.8 ? randInt(0, d.offers.length - 1) : -1); break;
    default: throw new Error("decisione non gestita: " + d.type);
  }
}
function balancePlayCareer(legacyFrom, scenarioId) {
  const info = balanceNewCareer(legacyFrom, scenarioId);
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
