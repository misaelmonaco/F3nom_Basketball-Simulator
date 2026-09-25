"use strict";

/* ================================================================
   STATE
   ================================================================ */
let player = null; // main career object
const ATTR_KEYS = ["shooting", "finishing", "playmaking", "rebounding", "defense", "athleticism"];

/* Tutta la casualità della creazione in un colpo solo: così la scheda degli scout mostrata
   prima di iniziare è esattamente il giocatore che partirà (e tornare indietro non la rimescola) */
function makeCreationRoll() {
  const noise = {};
  ATTR_KEYS.forEach(k => { noise[k] = randInt(-6, 6); });
  return { ovr: randInt(58, 65), pot: randInt(72, 99), noise, variance: randInt(-3, 3), legacy: randInt(0, 4), scoutErr: randInt(-3, 3) };
}

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

function newPlayerState({ firstName, lastName, nationality, role, archetypeId, height, weight, path, leagueId, team, jerseyNumber, customOverall, customPotential, difficulty, legacy,
  hand, bodyType, traits, look, hometown, attrShift, roll }) {
  roll = roll || makeCreationRoll();
  traits = sanitizeTraits(traits);
  const body = computeBodyModifiers(role, height, weight);
  const pathMods = (getPath(path.id).mods) || {};
  let overall, potential;
  if (customOverall != null && !isNaN(customOverall)) {
    // modalità personalizzata: si parte dai valori scelti liberamente, senza il tetto della generazione casuale
    overall = clamp(customOverall, 40, 99);
    potential = clamp((customPotential != null && !isNaN(customPotential)) ? customPotential : overall, overall, 99);
  } else {
    // percorso e carattere spostano il punto di partenza e il tetto
    const traitOvr = traits.includes("precocious") ? 3 : traits.includes("latebloomer") ? -3 : 0;
    const traitPot = traits.includes("precocious") ? -4 : traits.includes("latebloomer") ? 5 : 0;
    const variance = pathMods.variance ? clamp(roll.variance, -pathMods.variance, pathMods.variance) : 0;
    overall = clamp(roll.ovr + body.overallBonus + (pathMods.overall || 0) + variance + traitOvr, 50, 72);
    potential = clamp(roll.pot + (pathMods.potential || 0) + traitPot, Math.max(overall, 65), 99);
  }
  hand = hand === "left" ? "left" : "right";
  bodyType = BODY_TYPES.some(b => b.id === bodyType) ? bodyType : "balanced";
  // una nuova generazione della dinastia comincia qualche anno dopo il ritiro del genitore
  const startYear = legacy && legacy.startYear ? legacy.startYear : CAREER_START_YEAR;
  const p = {
    firstName, lastName, nationality, role, archetypeId, pathId: path.id,
    height, weight, jerseyNumber,
    age: 16, year: startYear, startYear,
    legacy: legacy || null, // dinastia: generazione e genitori (vedi legacy.js)
    difficulty: DIFFICULTIES.some(d => d.id === difficulty) ? difficulty : "normal",
    overall, potential,
    attrs: generateInitialAttrs(role, archetypeId, overall, body, { noise: roll.noise, bumps: [HAND_BUMPS[hand], getBodyType({ bodyType }).bumps, sanitizeAttrShift(attrShift)] }),
    hand, bodyType, traits,    // mano dominante, corporatura e carattere (vedi identity.js)
    look: sanitizeLook(look),  // aspetto dell'avatar
    hometown: hometown || null, // città natale: la squadra di casa ti corteggia
    draftRights: null,         // chiamato al Draft ma rimasto nel club: i diritti NBA restano a quella squadra
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
    morale: clamp(70 + (pathMods.morale || 0), 0, 100), // 0-100, incide su rendimento e crescita
    chemistry: 70,     // 0-100, rapporto con spogliatoio e società
    popularity: clamp(25 + (pathMods.popularity || 0), 0, 100), // 0-100, visibilità mediatica e valore sponsor
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
    sponsors: [],      // sponsor con condizioni (vedi sponsors.js)
    family: { partner: false, since: null, married: null, children: [] }, // vita privata (vedi family.js)
    lifestyle: [],     // acquisti di lifestyle (vedi lifestyle.js)
    mentee: null,      // il giovane seguito da veterano (vedi leadership.js)
    captain: null,     // fascia di capitano {team, since}
    polemicCount: 0,   // uscite polemiche con i media: fanno saltare gli sponsor "puliti"
  };
  if (legacy) applyLegacyBonuses(p, legacy, customOverall != null && !isNaN(customOverall), roll);
  return p;
}

function getDifficulty(p) { return DIFFICULTIES.find(d => d.id === (p && p.difficulty)) || DIFFICULTIES[1]; }

function getArchetype(role, archetypeId) {
  return ARCHETYPES_BY_ROLE[role].find(a => a.id === archetypeId);
}

function generateInitialAttrs(role, archetypeId, overall, body, extra) {
  // base spread around overall, tuned by ruolo/archetipo/fisico (extra: rumore già estratto e bonus aggiuntivi)
  const noise = extra && extra.noise;
  const a = {};
  ATTR_KEYS.forEach(k => { a[k] = clamp(overall + (noise ? noise[k] : randInt(-6, 6)), 30, 99); });
  const bump = (k, v) => a[k] = clamp(a[k] + v, 30, 99);

  const archetype = getArchetype(role, archetypeId);
  if (archetype) {
    Object.entries(archetype.bumps).forEach(([k, v]) => bump(k, v));
  }
  if (body) {
    Object.entries(body.attrBumps).forEach(([k, v]) => bump(k, v));
  }
  ((extra && extra.bumps) || []).forEach(b => Object.entries(b || {}).forEach(([k, v]) => { if (k in a) bump(k, v); }));
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
