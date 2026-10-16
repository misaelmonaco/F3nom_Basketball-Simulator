"use strict";

/* ================================================================
   SCENARI — carriere con un punto di partenza fissato e un obiettivo preciso al posto del
   sogno. Si sbloccano in sequenza: completato uno, si apre il successivo. Se l'obiettivo
   sfuma la carriera finisce e lo scenario si può riprovare; se si realizza si sceglie se
   chiudere lì o continuare fino al ritiro. I progressi restano nel browser, per tutte le
   carriere (come i traguardi).
   ================================================================ */
const SCENARIO_STORAGE_KEY = "chosenOne.scenarios";
const EU_EL_LEAGUES = ["ITA_LBA", "ESP_ACB", "FRA_ELITE", "TUR_BSL", "GRE_GBL", "ABA"];

let selScenario = null;   // scenario scelto nella creazione (id), null = carriera libera
let scenarioSetup = null; // estrazioni dello scenario fatte una volta sola (livello, palmarès del padre)

function scenarioSeasons(p) { return p.history.length; }
function seasonsLeftText(p, total) {
  const left = Math.max(0, total - scenarioSeasons(p));
  return left === 1 ? "Ti resta 1 stagione" : `Ti restano ${left} stagioni`;
}
/* Il livello della lega nella sua piramide: 0 è la massima serie, ogni promozione un gradino */
function leagueTier(id) { let t = 0; for (let l = id; LEAGUES[l].promotesTo; l = LEAGUES[l].promotesTo) t++; return t; }
function topLeagueOf(id) { let l = id; while (LEAGUES[l].promotesTo) l = LEAGUES[l].promotesTo; return l; }

/* Ritorno a casa: la squadra della città natale nella categoria più alta (college e USA-2 esclusi,
   da lì non si sale in USA-1) */
function homecomingTeam(city) {
  let best = null;
  Object.keys(LEAGUES).forEach(id => {
    if (id === "NCAA" || id === "GLEAGUE") return;
    LEAGUES[id].teams.forEach(t => {
      if (t.city !== city) return;
      if (!best || leagueTier(id) < best.tier) best = { team: t, leagueId: id, tier: leagueTier(id) };
    });
  });
  return best;
}
function homecomingCities(nationality) { return hometownCities(nationality).filter(c => homecomingTeam(c)); }

function nbaTitleWon(p) { return p.history.some(h => h.league === "NBA" && h.champion); }
function heirCounts(p) { return { rings: p.trophies.rings, mvp: p.trophies.mvp, allstar: p.trophies.allstar }; }
function heirBeaten(p) {
  const f = p.scenario.father, mine = heirCounts(p);
  return ["rings", "mvp", "allstar"].filter(k => mine[k] > f[k]).length;
}
function globetrotterLeagues(p) { return [...new Set(p.history.map(h => h.league).filter(l => l !== "NCAA"))]; }
function globetrotterTitle(p) { return p.history.some(h => h.champion || (h.continental && h.continental.champion)); }

/* evaluate(p, fase): "done", "failed" o null. Le fasi: "recap" (dopo il resoconto della
   stagione), "start" (prima della stagione nuova, dopo il mercato) e "retire" (al ritiro). */
const SCENARIOS = [
  { id: "redemption", icon: "pulse", title: "Il riscatto", age: 28, fixedStart: true,
    story: "Avevi un posto in USA-1, poi un grave infortunio al ginocchio ti ha rimandato in Europa. Il ginocchio ha retto, la fame anche: è ora di tornare.",
    startText: "28 anni, in una squadra di EUROPE-1, reduce da un grave infortunio",
    goal: "Firma un contratto in USA-1 entro 4 stagioni",
    failText: "Dopo la quarta stagione non sei ancora in USA-1",
    roll: () => ({ ovr: randInt(80, 82), pot: 86 }),
    start: () => {
      const pool = EU_EL_LEAGUES.flatMap(id => LEAGUES[id].teams.filter(t => t.euro === "EL").map(t => ({ t, id })));
      const picks = [];
      while (picks.length < 3 && pool.length) picks.push(pool.splice(randInt(0, pool.length - 1), 1)[0]);
      return { leagueOf: Object.fromEntries(picks.map(x => [x.t.name, x.id])), teams: picks.map(x => x.t) };
    },
    apply(p) {
      Object.assign(p, { drafted: true, draftDeclared: true, formerNBA: true, yearsPro: 9 });
      p.fragility = 35; p.morale = clamp(p.morale - 5, 0, 100);
      p.reputation = 52; p.popularity = 40;
      return { years: 1, clauses: { nbaExit: true } };
    },
    evaluate(p, phase) {
      if (p.league === "NBA") return "done";
      if (phase === "retire" || (phase === "start" && scenarioSeasons(p) >= 4)) return "failed";
      return null;
    },
    progress: p => `${seasonsLeftText(p, 4)} per firmare in USA-1. La USA-1 guarda chi gioca EUROPE-1 da 81 di overall in su.` },

  { id: "heir", icon: "crown", title: "Figlio d'arte", age: 16, fixedStart: false,
    story: "Tuo padre è una leggenda: la sua maglia è appesa al soffitto e il suo cognome è anche il tuo. Tutti si aspettano che tu sia come lui. Tu vuoi essere di più.",
    startText: "16 anni, con il percorso che scegli tu e il cognome più pesante del basket",
    goal: "Supera il palmarès di tuo padre in almeno 2 voci su 3: anelli USA-1, MVP, convocazioni all'All-Star Game",
    failText: "Ti ritiri senza averlo superato",
    roll: () => ({ father: { rings: 1, mvp: randInt(0, 1), allstar: randInt(3, 6), jersey: randInt(0, 99), goat: randInt(800, 1100) } }),
    apply() { return null; },
    evaluate(p, phase) {
      if (heirBeaten(p) >= 2) return "done";
      return phase === "retire" ? "failed" : null;
    },
    progress: p => {
      const f = p.scenario.father, m = heirCounts(p);
      return `Anelli ${m.rings}/${f.rings + 1} · MVP ${m.mvp}/${f.mvp + 1} · All-Star ${m.allstar}/${f.allstar + 1}: ne bastano 2 su 3.`;
    } },

  { id: "lastCall", icon: "clipboard", title: "Ultima chiamata", age: 23, fixedStart: true,
    story: "La notte del Draft il tuo nome non è mai uscito. Ti resta un contratto in USA-2 e poco tempo per convincere qualcuno che si sono sbagliati tutti.",
    startText: "23 anni, non scelto al Draft, in una squadra di USA-2",
    goal: "Firma un contratto in USA-1 entro 2 stagioni",
    failText: "Dopo la seconda stagione sei ancora fuori dalla USA-1",
    roll: () => ({ ovr: randInt(75, 77), pot: randInt(84, 87) }),
    start: () => {
      const pool = [...LEAGUES.GLEAGUE.teams], picks = [];
      while (picks.length < 3) picks.push(pool.splice(randInt(0, pool.length - 1), 1)[0]);
      return { leagueId: "GLEAGUE", teams: picks };
    },
    apply(p) {
      Object.assign(p, { drafted: false, draftDeclared: true, undraftedYears: 1, yearsPro: 1 });
      p.morale = clamp(p.morale - 5, 0, 100);
      return { years: 1 };
    },
    evaluate(p, phase) {
      if (p.league === "NBA") return "done";
      if (phase === "retire" || (phase === "start" && scenarioSeasons(p) >= 2)) return "failed";
      return null;
    },
    progress: p => `${seasonsLeftText(p, 2)} per firmare in USA-1. Dalla USA-2 bastano 77 di overall per farsi notare.` },

  { id: "homecoming", icon: "stadium", title: "Ritorno a casa", age: 30, fixedStart: true, needsHometown: true,
    story: "Hai girato il mondo, ora torni dove hai iniziato. La squadra della tua città ti offre un contratto lungo e una promessa da mantenere.",
    startText: "30 anni, nella squadra della tua città natale (quella della categoria più alta, se ce n'è più di una)",
    goal: "Porta la squadra della tua città nella massima serie e vinci il titolo, entro 5 stagioni",
    failText: "Dopo la quinta stagione il titolo non è arrivato",
    roll: () => ({ ovrBonus: randInt(8, 10) }),
    start: pc => {
      const home = homecomingTeam(pc.hometown);
      return { leagueId: home.leagueId, teams: [home.team] };
    },
    ratings(p, setup, leagueId) {
      const ovr = clamp(LEAGUES[topLeagueOf(leagueId)].avgOverall + setup.ovrBonus, 60, 90);
      return { ovr, pot: ovr };
    },
    apply(p) {
      Object.assign(p, { drafted: true, draftDeclared: true, yearsPro: 12 });
      p.reputation = 62; p.popularity = 50;
      return { years: 5 };
    },
    evaluate(p, phase) {
      const team = p.scenario.homeTeam;
      if (p.history.some(h => h.team.name === team && h.champion && !LEAGUES[h.league].promotesTo)) return "done";
      if (phase === "retire" || (phase === "recap" && scenarioSeasons(p) >= 5)) return "failed";
      return null;
    },
    progress: p => {
      const s = p.scenario, inTop = p.team.name === s.homeTeam && !LEAGUES[p.league].promotesTo;
      return `${seasonsLeftText(p, 5)}. ${p.team.name === s.homeTeam ? (inTop ? `${s.homeTeam} è in ${LEAGUES[p.league].name}: manca il titolo.` : `${s.homeTeam} gioca in ${LEAGUES[p.league].name}: prima va portata su.`) : `Per riuscirci devi giocare con ${s.homeTeam}.`}`;
    } },

  { id: "rawTalent", icon: "trend", title: "Il talento grezzo", age: 17, fixedStart: false,
    story: "Sai fare poco, ma quel poco lo fai come nessuno. Gli scout dicono che il tuo potenziale è il più alto della generazione. Gli scout sbagliano spesso.",
    startText: "17 anni, overall basso e potenziale altissimo, con il percorso che scegli tu",
    goal: "Arriva a 90 di overall entro i 28 anni",
    failText: "Finisci la stagione dei 28 anni sotto 90",
    roll: () => ({ ovr: randInt(57, 60), pot: randInt(98, 99) }),
    apply() { return null; },
    evaluate(p, phase) {
      if (p.overall >= 90) return "done";
      if (phase === "retire" || (phase === "recap" && p.age >= 28)) return "failed";
      return null;
    },
    progress: p => `Overall ${p.overall}/90 · ${Math.max(0, 28 - p.age)} ${28 - p.age === 1 ? "anno" : "anni"} al limite dei 28.` },

  { id: "globetrotter", icon: "globe", title: "Giramondo", age: 19, fixedStart: false,
    story: "Una valigia sempre pronta e un passaporto pieno di timbri. Vuoi vedere tutto, e vincere almeno una volta da qualche parte.",
    startText: "19 anni, con il percorso che scegli tu",
    goal: "Gioca in 5 campionati diversi (il college non conta) e vinci almeno un titolo, entro 8 stagioni",
    failText: "Dopo l'ottava stagione ti manca ancora qualcosa",
    roll: () => ({ ovrBonus: randInt(-4, -2) }),
    ratings(p, setup) { return { ovr: clamp(p.overall + setup.ovrBonus, 50, 76), pot: p.potential }; },
    apply() { return null; },
    evaluate(p, phase) {
      if (globetrotterLeagues(p).length >= 5 && globetrotterTitle(p)) return "done";
      if (phase === "retire" || (phase === "recap" && scenarioSeasons(p) >= 8)) return "failed";
      return null;
    },
    progress: p => `Campionati ${Math.min(5, globetrotterLeagues(p).length)}/5 · titolo ${globetrotterTitle(p) ? "vinto" : "da vincere"} · ${seasonsLeftText(p, 8)}.` },

  { id: "lastDance", icon: "trophy", title: "L'ultimo ballo", age: 34, fixedStart: true,
    story: "Hai vinto tutto, tranne quello che conta di più. Il fisico ti concede ancora due stagioni, una squadra da titolo ti vuole. È l'ultima occasione.",
    startText: "34 anni, veterano in una delle squadre più forti della USA-1",
    goal: "Vinci l'anello USA-1 nelle ultime 2 stagioni della carriera",
    failText: "Dopo la seconda stagione l'anello non è arrivato: ti ritiri",
    roll: () => ({ ovr: randInt(87, 89) }),
    start: () => {
      const strong = [...LEAGUES.NBA.teams].sort((a, b) => getTeamStrength(b, "NBA") - getTeamStrength(a, "NBA")).slice(0, 6);
      const picks = [];
      while (picks.length < 3) picks.push(strong.splice(randInt(0, strong.length - 1), 1)[0]);
      return { leagueId: "NBA", teams: picks };
    },
    ratings(p, setup) { return { ovr: setup.ovr, pot: setup.ovr }; },
    apply(p) {
      Object.assign(p, { drafted: true, draftDeclared: true, inNBA: true, formerNBA: true, yearsPro: 16, agentChosen: false });
      p.reputation = 75; p.popularity = 65;
      return { years: 2 };
    },
    evaluate(p, phase) {
      if (nbaTitleWon(p)) return "done";
      if (phase === "retire" || (phase === "recap" && scenarioSeasons(p) >= 2)) return "failed";
      return null;
    },
    progress: p => `${seasonsLeftText(p, 2)} per vincere l'anello.` },
];
function getScenario(id) { return SCENARIOS.find(s => s.id === id) || null; }
function scenarioIndex(id) { return SCENARIOS.findIndex(s => s.id === id); }

/* ---------- progressi, salvati nel browser ---------- */
function scenarioProgress() {
  try {
    const v = JSON.parse(localStorage.getItem(SCENARIO_STORAGE_KEY));
    return v && v.done ? v : { done: {} };
  } catch (e) { return { done: {} }; }
}
function markScenarioCompleted(id) {
  const v = scenarioProgress();
  if (v.done[id]) return;
  v.done[id] = new Date().toISOString().slice(0, 10);
  try { localStorage.setItem(SCENARIO_STORAGE_KEY, JSON.stringify(v)); } catch (e) { /* senza storage resta solo in questa partita */ }
}
function scenarioCompleted(id) { return !!scenarioProgress().done[id]; }
function scenarioUnlocked(id) {
  const i = scenarioIndex(id);
  return i === 0 || (i > 0 && scenarioCompleted(SCENARIOS[i - 1].id));
}
function completedScenarioCount() { return SCENARIOS.filter(s => scenarioCompleted(s.id)).length; }
function nextScenarioId(id) { const n = SCENARIOS[scenarioIndex(id) + 1]; return n ? n.id : null; }

/* ---------- creazione del giocatore dello scenario ---------- */
/* L'inizio dello scenario: lega e squadre tra cui scegliere (quelle libere seguono il percorso) */
function scenarioStart(id, pc) {
  const def = getScenario(id);
  return def && def.start ? def.start(pc) : null;
}
/* Il palmarès del padre, come una generazione della dinastia (vedi legacy.js) */
function heirLegacy(setup, nationality, lastName, fatherFirst) {
  const f = setup.father;
  return {
    generation: 2, lastName, nationality, jersey: f.jersey, startYear: CAREER_START_YEAR, childName: null,
    parents: [{ name: `${fatherFirst} ${lastName}`, jersey: f.jersey, grade: "S", goat: f.goat, rings: f.rings, mvp: f.mvp, allstar: f.allstar,
      hof: true, from: CAREER_START_YEAR - 30, to: CAREER_START_YEAR - 14 }],
  };
}
/* Applica lo scenario a un giocatore appena creato: età, livello, situazione e contratto */
function applyScenario(p, id, setup, leagueId) {
  const def = getScenario(id);
  p.age = def.age;
  p.startAge = def.age;
  const r = def.ratings ? def.ratings(p, setup, leagueId) : { ovr: setup.ovr != null ? setup.ovr : p.overall, pot: setup.pot != null ? setup.pot : p.potential };
  const shift = r.ovr - p.overall;
  ATTR_KEYS.forEach(k => { p.attrs[k] = clamp(p.attrs[k] + shift, 30, 99); });
  p.overall = r.ovr;
  p.potential = clamp(Math.max(r.pot, p.legacy ? p.potential : 0), r.ovr, 99);
  const contract = def.apply(p, setup);
  p.careerGoal = { id: null, status: "none" }; // l'obiettivo dello scenario prende il posto del sogno
  p.scenario = { id, status: "active", startYear: p.year, startAge: def.age };
  if (id === "heir") p.scenario.father = { ...setup.father, name: p.legacy ? legacyParent(p.legacy).name : "" };
  if (id === "homecoming") { p.scenario.homeTeam = p.team.name; homecomingInvest(p, leagueId); }
  if (contract) {
    const cp = generateContractProposal(p.league, p, p.team);
    p.contract = {
      yearsRemaining: contract.years, yearsTotal: contract.years, salaryPerYear: cp.salary, currency: cp.currency,
      teamStrength: cp.teamStrength, clauses: { ...(contract.clauses || {}) }, supermax: false, teamRole: null,
    };
  }
  return p;
}

/* Ritorno a casa: la città investe sul tuo ritorno e dopo ogni promozione rinforza la squadra */
function homecomingInvest(p, leagueId) {
  const s = p.scenario;
  if (!s || s.id !== "homecoming" || s.status !== "active" || p.team.name !== s.homeTeam) return false;
  const r = LEAGUES[leagueId].strengthRange;
  const floor = Math.round((r[0] + (r[1] - r[0]) * 0.65) * 100) / 100;
  teamStrengthRegistry[p.team.name] = Math.max(getTeamStrength(p.team, leagueId), floor);
  return true;
}

/* ---------- durante la carriera ---------- */
function scenarioCheckpoint(p, phase) {
  const s = p && p.scenario;
  if (!s || s.status !== "active") return null;
  const r = getScenario(s.id).evaluate(p, phase);
  if (!r) return null;
  s.status = r; s.year = p.year; s.seasons = scenarioSeasons(p);
  if (r === "done") { markScenarioCompleted(s.id); checkAchievements(p); }
  return r;
}
/* Dopo il resoconto e prima di ogni stagione: true se lo scenario si è preso la scena */
function scenarioInterrupt(phase, next) {
  const r = scenarioCheckpoint(player, phase);
  if (r === "failed") {
    toast(`Scenario fallito: ${getScenario(player.scenario.id).title}.`);
    player.retired = true;
    player.pendingDecision = null;
    renderFinalScreen();
    return true;
  }
  if (r === "done") {
    player.pendingDecision = { type: "scenarioDone", phase, next: next || null };
    renderGameScreen();
    return true;
  }
  return false;
}
function resolveScenarioDone(keepPlaying) {
  const d = player.pendingDecision;
  if (!d || d.type !== "scenarioDone") return;
  if (!keepPlaying) { player.scenario.ended = true; retirePlayer(); return; }
  player.scenario.continued = true;
  pushNews(`Scenario completato: ${getScenario(player.scenario.id).title}. La carriera continua.`);
  player.pendingDecision = d.next;
  if (d.phase === "start") advanceSeason();
  else renderGameScreen();
}
/* USA-2 → USA-1: nell'Ultima chiamata le squadre guardano anche chi non è un fenomeno */
function scenarioNbaBar(p) {
  return p.scenario && p.scenario.id === "lastCall" && p.scenario.status === "active" && p.league === "GLEAGUE" ? 77 : null;
}

/* ---------- interfaccia ---------- */
function scenarioStatusBadge(s) {
  return s.status === "done" ? `<span class="badge green">Completato${s.continued ? ", carriera in corso" : ""}</span>`
    : s.status === "failed" ? `<span class="badge red">Fallito</span>` : `<span class="badge blue">In corso</span>`;
}
/* La card dell'obiettivo nella Panoramica e nella scheda carriera, al posto del sogno */
function scenarioCardHtml(p) {
  const s = p.scenario, def = getScenario(s.id);
  return `
    <div class="dream-card scenario-card ${s.status}">
      <div class="dream-icon">${ico(def.icon)}</div>
      <div class="dream-body">
        <div class="dream-title">Scenario: ${def.title} ${scenarioStatusBadge(s)}</div>
        <div class="small-muted">${def.goal}.</div>
        ${s.status === "active" ? `<div class="scn-progress">${def.progress(p)}</div>` : ""}
        ${s.father ? fatherPalmaresHtml(s.father) : ""}
      </div>
    </div>`;
}
function fatherPalmaresHtml(f) {
  return `<div class="scn-father">
    <div class="scn-father__h">Il palmarès di tuo padre${f.name ? ` <span class="scn-father__name"></span>` : ""}</div>
    <div class="scn-father__grid">
      <div><strong>${f.rings}</strong><span>${f.rings === 1 ? "anello" : "anelli"} USA-1</span></div>
      <div><strong>${f.mvp}</strong><span>MVP</span></div>
      <div><strong>${f.allstar}</strong><span>All-Star</span></div>
    </div>
    <div class="small-muted">Per superarlo: almeno ${f.rings + 1} anelli, ${f.mvp + 1} MVP o ${f.allstar + 1} All-Star, in 2 voci su 3.</div>
  </div>`;
}
function fillFatherName(box, f) {
  box.querySelectorAll(".scn-father__name").forEach(n => { n.textContent = `(${f.name})`; });
}

/* Schermata degli scenari, dalla home */
function openScenariosScreen() {
  renderScenariosScreen();
  el("screen-create").classList.add("hidden");
  el("screen-scenarios").classList.remove("hidden");
  window.scrollTo(0, 0);
}
function closeScenariosScreen() {
  el("screen-scenarios").classList.add("hidden");
  el("screen-create").classList.remove("hidden");
}
function renderScenariosScreen() {
  el("scenarios-count").textContent = `${completedScenarioCount()}/${SCENARIOS.length} completati`;
  el("scenarios-list").innerHTML = SCENARIOS.map((s, i) => {
    const open = scenarioUnlocked(s.id), done = scenarioCompleted(s.id);
    const prev = SCENARIOS[i - 1];
    return `
      <article class="scn-item ${open ? "" : "locked"} ${done ? "done" : ""}">
        <div class="scn-num">${i + 1}</div>
        <div class="scn-icon">${ico(open ? s.icon : "lock")}</div>
        <div class="scn-body">
          <div class="scn-title">${s.title} ${done ? `<span class="badge green">${ico("check")} Completato</span>` : open ? "" : `<span class="badge idle">Bloccato</span>`}</div>
          ${open ? `<p class="scn-story">${s.story}</p>
          <dl class="scn-facts">
            <div><dt>Partenza</dt><dd>${s.startText}</dd></div>
            <div><dt>Obiettivo</dt><dd>${s.goal}</dd></div>
            <div><dt>Si fallisce se</dt><dd>${s.failText}</dd></div>
          </dl>` : `<p class="scn-story small-muted">Completa <strong>${prev.title}</strong> per sbloccarlo.</p>`}
        </div>
        ${open ? `<button type="button" class="btn ${done ? "btn-secondary" : "btn-primary"} scn-play" data-scenario="${s.id}">${done ? "Gioca di nuovo" : "Gioca"}</button>` : ""}
      </article>`;
  }).join("");
  el("scenarios-list").querySelectorAll("[data-scenario]").forEach(b => b.addEventListener("click", () => {
    selectScenario(b.dataset.scenario);
    closeScenariosScreen();
    window.scrollTo(0, 0);
  }));
}

/* Sceglie lo scenario per la carriera che si sta creando (null: carriera libera) */
function selectScenario(id) {
  if (id && !scenarioUnlocked(id)) return;
  selScenario = id || null;
  scenarioSetup = id ? getScenario(id).roll() : null;
  pendingLegacy = null;
  if (selScenario) {
    customMode = false;
    el("inp-custom-mode").checked = false;
    if (getScenario(id).fixedStart) selPath = null;
    createWizardOpen = true;
  }
  hometownNationality = null; // le città possibili cambiano con lo scenario
  wizardStep = 1;
  renderWizard();
}
function renderScenarioBanner() {
  const box = el("scenario-banner");
  const def = selScenario && getScenario(selScenario);
  el("card-custom-mode").classList.toggle("hidden", !!def);
  el("btn-open-scenarios-count").textContent = `${completedScenarioCount()}/${SCENARIOS.length}`;
  // la presentazione in alto racconta lo scenario al posto dei "sedici anni" della carriera libera
  const strap = document.querySelector("#screen-create .co-strap");
  if (strap) {
    strap.querySelector(".co-strap__tag").textContent = def ? `Scenario · ${def.title}` : "Nuova carriera";
    strap.querySelector(".co-strap__sub").textContent = def ? def.story : "Sedici anni, un pallone e una città alle spalle. Sei passi per decidere chi sarà.";
  }
  if (!def) { box.innerHTML = ""; return; }
  box.innerHTML = `
    <div class="scenario-banner">
      <div class="scenario-banner__head">
        <span class="scenario-banner__icon">${ico(def.icon)}</span>
        <div><div class="scenario-banner__tag">Scenario ${scenarioIndex(def.id) + 1} di ${SCENARIOS.length}</div><div class="scenario-banner__title">${def.title}</div></div>
        <button type="button" class="btn btn-ghost btn-sm" id="btn-leave-scenario">Torna alla carriera libera</button>
      </div>
      <dl class="scn-facts">
        <div><dt>Partenza</dt><dd>${def.startText}</dd></div>
        <div><dt>Obiettivo</dt><dd>${def.goal}</dd></div>
        <div><dt>Si fallisce se</dt><dd>${def.failText}</dd></div>
      </dl>
      ${def.id === "heir" ? fatherPalmaresHtml(scenarioSetup.father) : ""}
      ${def.needsHometown ? `<p class="small-muted">Scegli nazionalità e città natale: la squadra la decide la città.</p>` : ""}
    </div>`;
  el("btn-leave-scenario").addEventListener("click", () => selectScenario(null));
}

/* Il momento dell'obiettivo raggiunto: chiudere qui o continuare la carriera */
function renderScenarioDone(d, titleEl, subEl, cards) {
  const def = getScenario(player.scenario.id);
  const next = nextScenarioId(def.id);
  el("off-eyebrow").textContent = "SCENARIO COMPLETATO";
  titleEl.textContent = `${def.title}: obiettivo raggiunto`;
  subEl.textContent = `${def.goal}: fatto.${next ? ` Hai sbloccato «${getScenario(next).title}».` : " Hai completato tutti gli scenari."} Vuoi continuare la carriera o terminare lo scenario?`;
  cards.innerHTML =
    offCardHtml({ idx: 0, icon: ico("play"), iconTone: "var(--accent-2)", title: "Continua la carriera", subtitle: "Fino al ritiro, senza più scadenze", desc: "Lo scenario resta completato: da qui in avanti è una carriera come le altre." }) +
    offCardHtml({ idx: 1, icon: ico("flag"), title: "Termina lo scenario", subtitle: "La carriera si chiude qui", desc: "Vai alla schermata finale con il voto e il riepilogo." });
  cards.querySelector('[data-idx="0"]').addEventListener("click", () => resolveScenarioDone(true));
  cards.querySelector('[data-idx="1"]').addEventListener("click", () => resolveScenarioDone(false));
}

/* Schermata finale: com'è andato lo scenario, con "Riprova" e il prossimo sbloccato */
function renderFinalScenario() {
  const box = el("final-scenario");
  const s = player.scenario;
  if (!s) { box.innerHTML = ""; box.classList.add("hidden"); return; }
  const def = getScenario(s.id), next = nextScenarioId(s.id);
  box.classList.remove("hidden");
  box.innerHTML = `
    <div class="final-scenario ${s.status}">
      <div class="final-scenario__tag">${s.status === "done" ? "Scenario completato" : "Scenario fallito"}</div>
      <div class="final-scenario__title">${ico(def.icon)} ${def.title}</div>
      <p>${s.status === "done" ? `${def.goal}: obiettivo raggiunto${s.year ? ` nel ${s.year}` : ""}.` : `${def.failText}. L'obiettivo era: ${def.goal.charAt(0).toLowerCase() + def.goal.slice(1)}.`}</p>
      ${s.father ? fatherPalmaresHtml(s.father) : ""}
      <div class="btn-row">
        <button type="button" class="btn ${s.status === "done" ? "btn-secondary" : "btn-primary"}" id="btn-retry-scenario">Riprova lo scenario</button>
        ${s.status === "done" && next ? `<button type="button" class="btn btn-primary" id="btn-next-scenario">Prossimo scenario: ${getScenario(next).title}</button>` : ""}
      </div>
    </div>`;
  if (s.father) fillFatherName(box, s.father);
  el("btn-retry-scenario").addEventListener("click", () => startScenarioFromFinal(s.id));
  if (el("btn-next-scenario")) el("btn-next-scenario").addEventListener("click", () => startScenarioFromFinal(next));
}
function startScenarioFromFinal(id) {
  resetToCreation();
  selectScenario(id);
  renderSavedCareerCard();
  window.scrollTo(0, 0);
}
