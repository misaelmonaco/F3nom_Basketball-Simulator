"use strict";

/* ================================================================
   STATE
   ================================================================ */
let player = null; // main career object

function computeBodyModifiers(role, height, weight) {
  const r = BODY_RANGES[role];
  const hFactor = clamp((height - r.hMin) / (r.hMax - r.hMin), 0, 1) * 2 - 1; // -1..1
  const wFactor = clamp((weight - r.wMin) / (r.wMax - r.wMin), 0, 1) * 2 - 1; // -1..1
  const sizeFactor = (hFactor + wFactor) / 2; // -1 (agile/leggero) .. +1 (fisico/pesante)
  const proportion = 1 - Math.abs(hFactor - wFactor) / 2; // quanto altezza e peso sono coerenti tra loro
  return {
    attrBumps: {
      rebounding: Math.round(sizeFactor * 6),
      defense: Math.round(sizeFactor * 4),
      finishing: Math.round(sizeFactor * 3),
      athleticism: Math.round(-sizeFactor * 5 + (proportion - 0.5) * 4),
      playmaking: Math.round(-sizeFactor * 3),
      shooting: Math.round(-sizeFactor * 2),
    },
    overallBonus: Math.round((proportion - 0.5) * 4),
  };
}

function newPlayerState({ firstName, lastName, nationality, role, archetypeId, height, weight, path, leagueId, team, jerseyNumber, customOverall, customPotential, difficulty, legacy }) {
  const body = computeBodyModifiers(role, height, weight);
  let overall, potential;
  if (customOverall != null && !isNaN(customOverall)) {
    // modalità personalizzata: si parte dai valori scelti liberamente, senza il tetto della generazione casuale
    overall = clamp(customOverall, 40, 99);
    potential = clamp((customPotential != null && !isNaN(customPotential)) ? customPotential : overall, overall, 99);
  } else {
    overall = randInt(58, 65);
    potential = randInt(72, 99);
    overall = clamp(overall + body.overallBonus, 55, 70);
  }
  // una nuova generazione della dinastia comincia qualche anno dopo il ritiro del genitore
  const startYear = legacy && legacy.startYear ? legacy.startYear : CAREER_START_YEAR;
  const p = {
    firstName, lastName, nationality, role, archetypeId, pathId: path.id,
    height, weight, jerseyNumber,
    age: 16, year: startYear, startYear,
    legacy: legacy || null, // dinastia: generazione e genitori (vedi legacy.js)
    difficulty: DIFFICULTIES.some(d => d.id === difficulty) ? difficulty : "normal",
    overall, potential,
    attrs: generateInitialAttrs(role, archetypeId, overall, body),
    league: leagueId,
    team,
    contract: { yearsRemaining: 0, yearsTotal: 0, clauses: {} },
    reputation: 50,     // 0-100, stima delle società (vedi reputationOf)
    coachTrust: 55,     // 0-100, fiducia dell'allenatore (vedi changeCoachTrust)
    starRapport: 55,    // 0-100, intesa con la stella della squadra
    agent: null,        // id in AGENTS, scelto a 18 anni alla prima decisione di mercato
    agentChosen: false,
    retired: false,
    inNBA: false,
    clutch: { made: 0, attempts: 0 }, // ultimi possessi delle gare decisive di playoff giocati e vinti
    news: [], // notizie della carriera (anche i messaggi mostrati come toast)
    tradeRequestYear: null, // anno dell'ultima richiesta di trade (massimo una a stagione)
    draftEligible: false,
    draftDeclared: false, // ci si può dichiarare al draft una sola volta in carriera
    drafted: false,
    draftedYear: null,
    undraftedYears: 0,
    history: [], // per-season records
    trophies: { rings: 0, domesticTitles: 0, euroleague: 0, eurocup: 0, mvp: 0, dpoy: 0, roy: 0, allstar: 0, bestFive: 0, bestYoung: 0, medals: 0, finalsMvp: 0, worldCupTitles: 0, eurobasketTitles: 0 },
    goatScore: 0, // punteggio cumulativo: somma dei punti GOAT guadagnati stagione per stagione
    injuryStatus: null,
    pendingDecision: null, // {type, options}
    yearsPro: 0,
    careerTotals: { seasons: 0, gp: 0, pts:0, reb:0, ast:0, stl:0, blk:0, tov:0 },
    // stato extra-campo influenzato dagli imprevisti estivi
    morale: 70,        // 0-100, incide su rendimento e crescita
    chemistry: 70,     // 0-100, rapporto con spogliatoio e società
    popularity: 25,    // 0-100, visibilità mediatica e valore sponsor
    stamina: 100,      // 0-100, si consuma col minutaggio e con l'età, si ricarica in estate
    fragility: 0,      // 0-100, sale con gli infortuni subiti: aumenta il rischio dei futuri
    wealth: 0,         // patrimonio accumulato (M, valuta della lega in cui ha firmato)
    sponsorIncome: 0,  // entrate annue da sponsor
    investments: [],   // immobili e startup comprati d'estate (vedi SUMMER_SPENDING)
    // effetti temporanei applicati alla stagione successiva dagli imprevisti
    seasonModifiers: { benched: false, minutesPenalty: 0, forcedTransfer: false },
    offseasonEvents: [], // storico degli imprevisti estivi
    pendingSeason: null, // dati della stagione in corso, in attesa della chiusura dei playoff
    postseason: null,    // tabelloni playoff/europei giocati turno per turno
    pendingOffseasonEvent: null, // imprevisto estivo a rischio in attesa della scelta del giocatore
    pendingFinalizeCtx: null,    // stato della chiusura stagione, sospeso durante la scelta
    pendingOffseasonReveal: null, // esito già calcolato, in attesa di essere rivelato con l'animazione
    pendingNationalComp: null, // torneo con la Nazionale già simulato, mostrato dopo l'Off-Season
    pendingSeasonFocusResult: null, // esito del focus stagionale scelto, in attesa di essere archiviato nel record
    careerGoal: null,  // sogno di carriera {id, status: active|done|failed, since, year} (vedi goals.js)
    achievements: {},  // traguardi sbloccati: id -> anno (vedi achievements.js)
  };
  if (legacy) applyLegacyBonuses(p, legacy, customOverall != null && !isNaN(customOverall));
  return p;
}

function getDifficulty(p) { return DIFFICULTIES.find(d => d.id === (p && p.difficulty)) || DIFFICULTIES[1]; }

function getArchetype(role, archetypeId) {
  return ARCHETYPES_BY_ROLE[role].find(a => a.id === archetypeId);
}

function generateInitialAttrs(role, archetypeId, overall, body) {
  // base spread around overall, tuned by ruolo/archetipo/fisico
  const base = () => clamp(overall + randInt(-6, 6), 30, 99);
  let a = { shooting: base(), finishing: base(), playmaking: base(), rebounding: base(), defense: base(), athleticism: base() };
  const bump = (k, v) => a[k] = clamp(a[k] + v, 30, 99);

  const archetype = getArchetype(role, archetypeId);
  if (archetype) {
    Object.entries(archetype.bumps).forEach(([k, v]) => bump(k, v));
  }
  if (body) {
    Object.entries(body.attrBumps).forEach(([k, v]) => bump(k, v));
  }
  return a;
}

/* ================================================================
   UTILS
   ================================================================ */
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min, max, dec=1) { return parseFloat((Math.random() * (max - min) + min).toFixed(dec)); }
function choice(arr) { return arr[randInt(0, arr.length - 1)]; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function weightedChoice(pairs) { // [[item, weight], ...]
  const total = pairs.reduce((s,p)=>s+p[1],0);
  let r = Math.random() * total;
  for (const [item, w] of pairs) { if (r < w) return item; r -= w; }
  return pairs[pairs.length-1][0];
}

function toast(msg) {
  if (typeof pushNews === "function") pushNews(msg);
  const wrap = document.getElementById("toast-wrap");
  // un solo toast alla volta: il nuovo sostituisce il precedente, lo storico resta nelle notizie
  wrap.innerHTML = "";
  const t = document.createElement("div");
  t.className = "toast";
  t.setAttribute("role", "status");
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

function el(id) { return document.getElementById(id); }
