"use strict";

/* ================================================================
   MARKET / DRAFT LOGIC
   ================================================================ */
function checkDraftEligibility(p) {
  return p.age >= 19 && p.age <= 23 && !p.drafted && !p.inNBA && !p.draftDeclared && p.overall >= 74;
}

/* ================================================================
   SISTEMA ECONOMICO — proposte contrattuali delle squadre
   ================================================================ */
function currencyForLeague(leagueId) {
  if (leagueId === "NCAA") return null; // borsa di studio, nessun ingaggio
  if (leagueId === "NBA" || leagueId === "GLEAGUE") return "$";
  return "€";
}

function computeSalary(leagueId, overall, teamStrength) {
  const mult = LEAGUES[leagueId].salaryMult;
  if (mult == null) return null; // es. NCAA: nessun ingaggio, solo borsa di studio
  const base = clamp(overall - 55, 0, 45);
  // le squadre di vertice hanno meno spazio sotto il tetto salariale: pagano meno di quelle in ricostruzione
  const pct = teamStrengthPercentile(teamStrength, leagueId);
  return round1(Math.max(base * mult * (1.3 - pct * 0.5), LEAGUES[leagueId].salaryFloor));
}

function proposeContractYears(age, overall) {
  if (age <= 19) return randInt(1, 2);
  if (overall >= 85) return randInt(3, 4);
  if (overall >= 75) return randInt(2, 4);
  if (age >= 32) return 1;
  return randInt(1, 3);
}

/* Il "valore" di una squadra (teamStrength, 0..1) è competitivo all'interno della propria lega,
   ma le fasce (strengthRange) variano da lega a lega: una big di Serie A2 non regge il confronto
   assoluto con una big di LBA, pur potendo essere la favorita nel proprio campionato. */
function titleChanceInfo(ts, leagueId) {
  const range = (LEAGUES[leagueId] && LEAGUES[leagueId].strengthRange) || [0.3, 0.95];
  const pct = clamp((ts - range[0]) / (range[1] - range[0]), 0, 1);
  if (pct >= 0.75) return { label: "Favorita al titolo", stars: "⭐⭐⭐⭐" };
  if (pct >= 0.5) return { label: "Contender", stars: "⭐⭐⭐" };
  if (pct >= 0.25) return { label: "Squadra da playoff", stars: "⭐⭐" };
  return { label: "Outsider / ricostruzione", stars: "⭐" };
}

/* ================================================================
   FORZA DELLE SQUADRE — persistente per nome squadra, coerente con la fascia della lega.
   Usata per generare proposte contrattuali, calcolare l'esito delle stagioni e gestire
   promozioni/retrocessioni (Serie A2 <-> LBA).
   ================================================================ */
const teamStrengthRegistry = {};

function getTeamStrength(team, leagueId) {
  const range = LEAGUES[leagueId].strengthRange;
  if (!(team.name in teamStrengthRegistry)) {
    teamStrengthRegistry[team.name] = randFloat(range[0], range[1], 2);
  } else {
    // sempre dentro la fascia della lega in cui la squadra gioca adesso
    teamStrengthRegistry[team.name] = clamp(teamStrengthRegistry[team.name], range[0], range[1]);
  }
  return teamStrengthRegistry[team.name];
}

/* Leggera variazione stagionale della forza di tutte le squadre già conosciute: applicata una
   sola volta a inizio stagione, così il valore resta stabile per tutte le letture dello stesso
   anno (simulazione, classifica, offerte) invece di cambiare a ogni chiamata. */
function driftTeamStrengths() {
  Object.keys(teamStrengthRegistry).forEach(name => {
    teamStrengthRegistry[name] = Math.round((teamStrengthRegistry[name] + randFloat(-0.04, 0.04, 2)) * 100) / 100;
  });
}
function resetTeamStrengths() {
  Object.keys(teamStrengthRegistry).forEach(name => { delete teamStrengthRegistry[name]; });
  if (typeof resetTeamStaff === "function") resetTeamStaff(); // anche allenatori e stelle ripartono da zero
}

function promoteTeam(team, fromLeague, toLeague) {
  const current = getTeamStrength(team, fromLeague);
  const range = LEAGUES[toLeague].strengthRange;
  const recalculated = Math.round(current * randFloat(0.86, 0.95, 3) * 100) / 100;
  teamStrengthRegistry[team.name] = clamp(recalculated, range[0], range[1]);
}

function relegateTeam(team, fromLeague, toLeague) {
  const current = getTeamStrength(team, fromLeague);
  const range = LEAGUES[toLeague].strengthRange;
  const recalculated = Math.round(current * randFloat(1.05, 1.15, 3) * 100) / 100;
  teamStrengthRegistry[team.name] = clamp(recalculated, range[0], range[1]);
}

function generateContractProposal(leagueId, p, team) {
  const teamStrength = getTeamStrength(team, leagueId);
  const years = proposeContractYears(p.age, p.overall);
  const base = computeSalary(leagueId, p.overall, teamStrength);
  const salary = base == null ? null : round1(Math.max(LEAGUES[leagueId].salaryFloor, base * getAgent(p).salary * reputationSalaryFactor(p)));
  const currency = currencyForLeague(leagueId);
  return veteranContract(p, { years, salary, teamStrength, currency, clauses: {} });
}

/* ================================================================
   AGENTE, REPUTAZIONE E CLAUSOLE CONTRATTUALI
   ================================================================ */
/* L'agente si sceglie a 18 anni (alla prima decisione di mercato) e si può cambiare da svincolati.
   La commissione si prende una parte dell'ingaggio; in cambio ognuno spinge in una direzione. */
const AGENTS = [
  { id: "none", icon: "🧑", name: "Fai da te", commission: 0,
    desc: "Nessuna commissione, ma tratti da solo con le società: le tue richieste hanno meno forza.",
    negotiation: -0.1, salary: 1, sponsor: 1, clauses: 0, contenderBias: false, repPerSeason: 0, popularity: 0, newSponsors: 0 },
  { id: "shark", icon: "🦈", name: "Lo Squalo", commission: 0.10,
    desc: "Spreme ogni euro: offerte più ricche e trattative più efficaci, ma le società lo temono e la tua reputazione ne risente.",
    negotiation: 0.15, salary: 1.35, sponsor: 1, clauses: 0, contenderBias: false, repPerSeason: -1, popularity: 0, newSponsors: 0 },
  { id: "builder", icon: "🏗️", name: "Il Costruttore", commission: 0.05,
    desc: "Pensa alla carriera: ti porta offerte dalle squadre che puntano al titolo, ottiene più facilmente le clausole e ti fa stimare dalle società. In cambio si accontenta di ingaggi più bassi.",
    negotiation: 0.05, salary: 0.92, sponsor: 1, clauses: 0.12, contenderBias: true, repPerSeason: 1, popularity: 0, newSponsors: 0 },
  { id: "brand", icon: "📣", name: "Il Brand Manager", commission: 0.08,
    desc: "Costruisce il tuo marchio: ogni stagione porta nuovi sponsor (tanto più ricchi quanto sei popolare) e fa crescere la popolarità più in fretta.",
    negotiation: 0, salary: 1, sponsor: 1.3, clauses: 0, contenderBias: false, repPerSeason: 0, popularity: 3, newSponsors: 0.22 },
];
function getAgent(p) { return AGENTS.find(a => a.id === (p.agent || "none")) || AGENTS[0]; }

/* Reputazione nella lega (0-100): quanto le società ti considerano affidabile e decisivo.
   È diversa dalla popolarità (media e tifosi) e pesa su offerte, trattative, trade e Hall of Fame. */
function reputationOf(p) { return p.reputation == null ? 50 : p.reputation; }
function changeReputation(p, delta, reason, notes) {
  if (!delta) return;
  p.reputation = clamp(Math.round(reputationOf(p) + delta), 0, 100);
  if (notes && reason) notes.push(`${delta > 0 ? "+" : ""}${delta} ${reason}`);
}
function reputationSalaryFactor(p) { return 1 + (reputationOf(p) - 50) * 0.003; }
function reputationLabel(r) {
  if (r >= 80) return "Icona della lega";
  if (r >= 65) return "Molto stimato";
  if (r >= 45) return "Affidabile";
  if (r >= 30) return "Discusso";
  return "Problematico";
}

/* Reputazione di fine stagione: premi, titoli, estate, agente e un lento ritorno verso la media */
function seasonReputationUpdate(p, awards, teamResult, offseason) {
  const notes = [];
  if (awards.some(a => a.startsWith("MVP"))) changeReputation(p, 5, "MVP", notes);
  if (awards.includes("Finals MVP")) changeReputation(p, 3, "Finals MVP", notes);
  if (awards.some(a => a.startsWith("Miglior Quintetto"))) changeReputation(p, 2, "Miglior Quintetto", notes);
  if (awards.includes("Difensore dell'Anno")) changeReputation(p, 2, "Difensore dell'Anno", notes);
  if (awards.some(a => a.startsWith("All-Star"))) changeReputation(p, 1, "All-Star", notes);
  if (teamResult.champion) changeReputation(p, 3, "titolo", notes);
  if (offseason && offseason.tone === "negative") changeReputation(p, -2, "estate turbolenta", notes);
  else if (offseason && offseason.tone === "positive") changeReputation(p, 1, "estate positiva", notes);
  const agent = getAgent(p);
  if (agent.repPerSeason) changeReputation(p, agent.repPerSeason, agent.name, notes);
  changeReputation(p, Math.round((50 - reputationOf(p)) * 0.06));
  return notes;
}

/* Probabilità che la società accetti una richiesta in trattativa: peso del giocatore (overall),
   agente e reputazione. extra corregge per il tipo di richiesta. */
function negotiationChance(p, extra) {
  const leverage = clamp((p.overall - 65) / 40, 0.05, 0.9);
  return clamp(0.3 + leverage * 0.5 + getAgent(p).negotiation + (reputationOf(p) - 50) * 0.004 + getDifficulty(p).negotiation + (extra || 0), 0.05, 0.95);
}

/* Clausole contrattuali: ognuna si chiede una volta per offerta; available dice se ha senso
   per quell'offerta, difficulty quanto è più dura da ottenere rispetto a una richiesta normale. */
const CONTRACT_CLAUSES = [
  { id: "playerOption", icon: "🔓", label: "Player option",
    desc: "Prima dell'ultimo anno scegli se restare o tornare sul mercato.",
    available: cp => cp.years >= 2, difficulty: () => 0.1 },
  { id: "bonus", icon: "🎯", label: "Bonus a obiettivi",
    desc: "+20% dell'ingaggio per ogni All-Star, titolo o MVP della stagione.",
    available: cp => cp.salary != null, difficulty: () => 0.05 },
  { id: "nbaExit", icon: "✈️", label: "Clausola di uscita NBA",
    desc: "Se arriva un'offerta NBA puoi liberarti anche a contratto in corso.",
    available: (cp, offer) => LEAGUES[offer.targetLeague].continent === "Europa", difficulty: () => 0.15 },
  { id: "starter", icon: "⭐", label: "Ruolo da titolare garantito",
    desc: "Parti titolare in ogni stagione del contratto, qualunque cosa succeda.",
    available: () => true, difficulty: (p, offer) => 0.08 + clamp((LEAGUES[offer.targetLeague].avgOverall - p.overall) * 0.03, 0, 0.45) },
];
function clauseChance(p, offer, clause) {
  return clamp(negotiationChance(p, getAgent(p).clauses) - clause.difficulty(p, offer), 0.05, 0.9);
}
function clauseLabels(clauses) {
  return CONTRACT_CLAUSES.filter(c => clauses && clauses[c.id]).map(c => `${c.icon} ${c.label}`);
}
/* Quante richieste respinte la dirigenza sopporta prima di ritirare l'offerta */
const OFFER_PATIENCE = 3;

/* Condizione per l'offerta NBA a un giocatore che non è ancora in NBA (usata anche dalla clausola di uscita) */
function nbaFreeAgentEligible(p) { return !p.inNBA && p.age <= 23 && p.overall >= 76; }

/* Estrae la squadra di un'offerta: il Costruttore porta più spesso le squadre di vertice */
function pickOfferTeam(p, leagueId) {
  if (getAgent(p).contenderBias && rollChance(45)) {
    const sorted = [...LEAGUES[leagueId].teams].sort((a, b) => getTeamStrength(b, leagueId) - getTeamStrength(a, leagueId));
    return choice(sorted.slice(0, Math.max(3, Math.ceil(sorted.length / 3))));
  }
  return pickTeam(leagueId);
}

/* Estensione anticipata: all'inizio dell'ultimo anno di contratto, se il giocatore rende */
function buildExtensionOffer(p, record) {
  const c = p.contract;
  if (!c || c.yearsRemaining !== 1 || c.salaryPerYear == null || c.extensionOffered) return null;
  const performing = (record && record.awards && record.awards.length > 0) || p.overall >= LEAGUES[p.league].avgOverall + 4;
  if (!performing) return null;
  c.extensionOffered = true;
  const offer = buildRenewOffer(p);
  offer.id = "extension";
  offer.title = `✍️ ${p.team.name} (Estensione)`;
  offer.desc = `${p.team.name} vuole blindarti prima della scadenza: rinnovo anticipato a condizioni migliori.`;
  offer.contractProposal.salary = offer.contractProposal.salary == null ? null : round1(offer.contractProposal.salary * 1.05);
  offer.contractProposal.years = Math.max(2, offer.contractProposal.years);
  return offer;
}

function chooseAgent(agentId) {
  const d = player.pendingDecision;
  if (!d || d.type !== "agentChoice") return;
  const previous = player.agent;
  player.agent = agentId;
  player.agentChosen = true;
  if (previous && previous !== agentId) toast(`🤝 Nuovo agente: ${getAgent(player).name}.`);
  player.pendingDecision = d.next;
  renderGameScreen();
}
function openAgentChoice() {
  const d = player.pendingDecision;
  if (!d || d.type !== "market") return;
  player.pendingDecision = { type: "agentChoice", next: d, change: true };
  renderGameScreen();
}

function resolvePlayerOption(stay) {
  const d = player.pendingDecision;
  if (!d || d.type !== "playerOption") return;
  const c = player.contract;
  c.optionDecided = true;
  if (stay) {
    toast("🔒 Opzione esercitata: resti un altro anno.");
    player.pendingDecision = { type: "offseasonStatus", record: d.record, extensionOffer: buildExtensionOffer(player, d.record) };
  } else {
    toast("🔓 Esci dal contratto: si va sul mercato.");
    c.yearsRemaining = 0;
    player.pendingDecision = createMarketDecision(player, d.record);
  }
  renderGameScreen();
}

function negotiateExtension() {
  const d = player.pendingDecision;
  if (!d || d.type !== "offseasonStatus" || !d.extensionOffer) return;
  const offer = d.extensionOffer;
  if (!offer.attempts) offer.attempts = { years: 0, salary: 0 };
  player.pendingDecision = { type: "negotiate", offer, marketDecision: null, returnTo: { ...d, extensionOffer: null } };
  renderGameScreen();
}

function contractSummaryHtml(cp, leagueId) {
  const t = titleChanceInfo(cp.teamStrength, leagueId);
  const salaryText = cp.salary == null ? "Borsa di studio (nessun ingaggio)" : `${cp.salary} M${cp.currency}/anno`;
  return `${cp.years} ${cp.years===1?"anno":"anni"} · ${salaryText} · ${t.stars} ${t.label}`;
}

function teamOverallFromStrength(ts) {
  return clamp(Math.round(60 + ts * 39), 60, 99);
}

function offerLineText(o) {
  const cp = o.contractProposal;
  const salaryText = cp.salary == null ? "Borsa di studio" : `${cp.salary} M${cp.currency}`;
  const teamOvr = teamOverallFromStrength(cp.teamStrength);
  return `${o.team.name} (${cp.years} ${cp.years===1?'anno':'anni'} - ${salaryText}) - OVR Squadra ${teamOvr} (${LEAGUES[o.targetLeague].name})`;
}

function pickFillerLeague(p) {
  return p.inNBA ? "NBA" : p.league;
}

const LEAGUE_FLAG = { NBA:"USA", NCAA:"USA", GLEAGUE:"USA", ITA_LBA:"ITA", ITA_A2:"ITA", ESP_ACB:"ESP", FRA_ELITE:"FRA", TUR_BSL:"TUR" };

/* Leghe/nazioni tra cui il giocatore può scegliere per valutare offerte a fine stagione.
   Un percorso High School -> College (NCAA) può scegliere di trasferirsi in Europa. */
function leagueSelectorOptions(p) {
  const euro = ["ITA_LBA", "ITA_A2", "ESP_ACB", "FRA_ELITE", "TUR_BSL"];
  if (p.inNBA) return ["NBA", ...euro];
  if (p.league === "NCAA") return ["NCAA", "GLEAGUE", ...euro];
  if (p.league === "GLEAGUE") return ["GLEAGUE", ...euro];
  return euro;
}

/* Occasioni contrattuali speciali legate al contesto narrativo del giocatore (draft, bridge NBA/Europa, promozioni) */
function buildSpecialOffers(p) {
  const specialOffers = [];

  if (nbaFreeAgentEligible(p)) {
    const team = pickTeam("NBA");
    specialOffers.push({
      id: "sign_nba_fa",
      title: `🏀 ${team.name}`,
      desc: `Un club NBA ti offre un contratto.`,
      team, targetLeague: "NBA",
      contractProposal: generateContractProposal("NBA", p, team)
    });
  }

  if (p.inNBA && (determineMinutesRole(p.overall, LEAGUES["NBA"].avgOverall).label === "Panchina" || p.overall < 74)) {
    const targetLeague = choice(EU_TOP_LEAGUES);
    const team = pickTeam(targetLeague);
    specialOffers.push({
      id: "return_europe",
      title: `🏟️ ${team.name}`,
      desc: `${LEAGUES[targetLeague].name} ti offre un ruolo da titolare.`,
      team, targetLeague,
      contractProposal: generateContractProposal(targetLeague, p, team)
    });
  }

  if (p.league === "ITA_A2" && p.overall >= 74 && p.age >= 18) {
    const team = pickTeam("ITA_LBA");
    specialOffers.push({
      id: "promo_lba",
      title: `📈 ${team.name}`,
      desc: `Salto di qualità nel massimo campionato italiano.`,
      team, targetLeague: "ITA_LBA",
      contractProposal: generateContractProposal("ITA_LBA", p, team)
    });
  }

  // la squadra della tua vita può richiamarti per l'ultimo ballo
  const home = homecomingOffer(p);
  if (home) specialOffers.unshift(home);

  return specialOffers;
}

/* Genera fino a 3 offerte esterne per la lega scelta: prima eventuali occasioni speciali già
   valide in quella lega, poi si completa con squadre rivali estratte dalla lega stessa. */
function buildExternalOffersForLeague(p, leagueId, specialOffers) {
  const usedNames = new Set([p.team.name]);
  const externalOffers = [];

  specialOffers.forEach(o => {
    if (externalOffers.length < 4 && !usedNames.has(o.team.name)) {
      externalOffers.push(o);
      usedNames.add(o.team.name);
    }
  });

  // la reputazione decide quante società si fanno avanti
  const rep = reputationOf(p);
  // la reputazione decide quante società si fanno avanti; dai 34 anni ce n'è una in meno
  const maxOffers = Math.max(1, (rep >= 70 ? 4 : rep <= 30 ? 2 : 3) - (p.age >= 34 ? 1 : 0));
  let guard = 0;
  while (externalOffers.length < maxOffers && guard < 25) {
    guard++;
    const team = pickOfferTeam(p, leagueId);
    if (usedNames.has(team.name)) continue;
    usedNames.add(team.name);
    externalOffers.push({
      id: "rival_" + externalOffers.length + "_" + leagueId,
      title: `🤝 ${team.name}`,
      desc: `${team.name} (${team.city}) ti offre un posto in squadra per la prossima stagione.`,
      team, targetLeague: leagueId,
      contractProposal: generateContractProposal(leagueId, p, team)
    });
  }
  return externalOffers;
}

/* Applica il trasferimento previsto da un'offerta firmata. È guidata solo dai dati dell'offerta
   (squadra e lega di destinazione) e non da closure, così le offerte in sospeso restano valide
   anche dopo un salvataggio/caricamento della carriera. Il rinnovo lascia tutto com'è. */
function applyOffer(p, offer) {
  if (offer.id === "renew" || offer.id === "extension") return;
  p.league = offer.targetLeague;
  p.inNBA = offer.targetLeague === "NBA";
  p.team = offer.team;
}

function buildRenewOffer(p) {
  const cp = generateContractProposal(p.league, p, p.team);
  const recent = p.history.slice(-2).flatMap(h => h.awards || []);
  if (p.league === "NBA" && cp.salary != null && recent.some(a => a.startsWith("MVP") || a.startsWith("Miglior Quintetto"))) {
    cp.salary = round1(cp.salary * 1.35);
    cp.supermax = true;
  }
  return {
    id: "renew",
    title: `✍️ ${p.team.name} (Rinnovo)`,
    desc: `Resta a ${p.team.name} (${p.team.city}) per un'altra stagione.`,
    team: p.team, targetLeague: p.league,
    contractProposal: cp,
  };
}

/* Costruisce la decisione di mercato completa: occasioni speciali + selettore di lega + rinnovo.
   Se un imprevisto estivo ha portato a una rottura col club, il rinnovo non è disponibile. */
function createMarketDecision(p, record) {
  const specialOffers = buildSpecialOffers(p);
  const forced = p.seasonModifiers && p.seasonModifiers.forcedTransfer;
  const renewOffer = forced ? null : buildRenewOffer(p);
  const selectedLeague = pickFillerLeague(p);
  const externals = buildExternalOffersForLeague(p, selectedLeague, specialOffers);
  const offers = renewOffer ? externals.concat([renewOffer]) : externals;
  return { type: "market", specialOffers, renewOffer, selectedLeague, offers, record, forcedTransfer: !!forced };
}
