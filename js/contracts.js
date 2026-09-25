"use strict";

/* Ritiro, Draft, trattative, firma del contratto e richieste di trade. */

function forceRetireFlow() {
  player.retired = true;
  player.pendingDecision = null;
  renderFinalScreen();
}

function resolveDraftDecision(declare) {
  const record = player.pendingDecision.record;
  if (declare) {
    // ci si dichiara al draft una sola volta in carriera: prima il combine e il provino privato
    startDraftCombine(record);
    return;
  }
  toast("Hai scelto di restare ancora un anno nel tuo percorso attuale.");
  player.pendingDecision = createMarketDecision(player, record);
  renderGameScreen();
}

/* Dopo la notte del Draft: contratto da rookie, offerta da free agent o mercato abituale */
function continueAfterDraft(record, result, team, pick) {
  record.draftResult = pick ? `${result} (scelta n° ${pick})` : result;
  if (team) {
    record.event = record.event || { text: `Selezionato al Draft NBA: ${result} da ${team.name}!`, type: "milestone" };
    toast(`🎉 Draft: ${result}${pick ? `, scelta n° ${pick}` : ""} — ${team.name}`);
    // scala salariale rookie legata alla posizione al draft
    let rookieYears = 2, salaryBoost = 1;
    if (result.startsWith("Top 5")) { rookieYears = 4; salaryBoost = 1.4; }
    else if (result === "Primo Giro") { rookieYears = 3; salaryBoost = 1.1; }
    else { rookieYears = 2; salaryBoost = 0.7; }
    const cp = generateContractProposal("NBA", player, team);
    cp.years = rookieYears;
    cp.salary = cp.salary == null ? null : round1(cp.salary * salaryBoost);
    const rookieOffer = {
      id: "rookie", title: `🏀 Contratto Rookie — ${team.name}`,
      desc: `${team.name} (${team.city}) ti propone il tuo primo contratto da professionista.`,
      team, targetLeague: "NBA", contractProposal: cp, attempts: { years: 0, salary: 0 },
    };
    player.pendingDecision = { type: "negotiate", offer: rookieOffer, marketDecision: null };
  } else {
    // Undrafted: resta comunque una possibilità concreta di firmare in NBA da free agent.
    // Se la possibilità non si concretizza non si mostra alcuna finestra NBA vuota: si passa
    // direttamente al normale mercato nella lega di provenienza.
    const nbaChance = clamp((player.overall - 60) * 3, 5, 65);
    if (rollChance(nbaChance)) {
      const team = pickTeam("NBA");
      const cp = generateContractProposal("NBA", player, team);
      cp.years = 1;
      cp.salary = cp.salary == null ? null : round1(cp.salary * 0.55);
      const undraftedOffer = {
        id: "undrafted_nba",
        title: `🆓 ${team.name} (Free Agent NBA)`,
        desc: `Non sei stato scelto al Draft, ma ${team.name} ti offre comunque un contratto da free agent per provare a ritagliarti un posto in NBA.`,
        team, targetLeague: "NBA", contractProposal: cp, attempts: { years: 0, salary: 0 },
      };
      toast(`🆓 Undrafted, ma ${team.name} ti offre un contratto NBA da free agent!`);
      player.pendingDecision = { type: "negotiate", offer: undraftedOffer, marketDecision: null };
    } else {
      toast(`Draft: Undrafted. Nessun club NBA si è fatto avanti: continua il tuo percorso.`);
      player.pendingDecision = createMarketDecision(player, record);
    }
  }  renderGameScreen();
}

function selectOffer(offer, marketDecision) {
  if (!offer.attempts) offer.attempts = { years: 0, salary: 0 };
  player.pendingDecision = { type: "negotiate", offer, marketDecision };
  renderGameScreen();
}

function backToOffers() {
  const { offer, marketDecision } = player.pendingDecision;
  // dopo un caricamento l'offerta in trattativa è una copia distinta da quella nella lista:
  // la si rimette al suo posto, così condizioni e tentativi già spesi non vanno persi
  const sync = o => (o && o.id === offer.id ? offer : o);
  marketDecision.offers = marketDecision.offers.map(sync);
  marketDecision.specialOffers = marketDecision.specialOffers.map(sync);
  marketDecision.renewOffer = sync(marketDecision.renewOffer);
  player.pendingDecision = marketDecision;
  renderGameScreen();
}

function switchOfferLeague(leagueId) {
  const d = player.pendingDecision;
  d.selectedLeague = leagueId;
  const externals = buildExternalOffersForLeague(player, leagueId, d.specialOffers);
  d.offers = d.renewOffer ? externals.concat([d.renewOffer]) : externals;
  renderGameScreen();
}

function negotiateContract(kind) {
  const d = player.pendingDecision;
  const offer = d.offer;
  const cp = offer.contractProposal;
  cp.clauses = cp.clauses || {};
  if (offer.patience == null) offer.patience = OFFER_PATIENCE;
  if (offer.patience <= 0) { toast("La dirigenza non vuole più trattare: puoi solo firmare o valutare altre offerte."); return; }

  let ok;
  if (kind === "years") {
    if (offer.attempts.years >= 2) { toast("La dirigenza non è disposta a discutere ancora sulla durata."); return; }
    offer.attempts.years++;
    ok = rollChance(negotiationChance(player) * 100);
    if (ok) cp.years = clamp(cp.years + 1, 1, 5);
    toast(ok ? "✅ La squadra accetta di allungare il contratto!" : "❌ La squadra rifiuta di allungare il contratto.");
  } else if (kind === "salary") {
    if (cp.salary == null) { toast("Questa lega non prevede un ingaggio negoziabile."); return; }
    if (offer.attempts.salary >= 2) { toast("La dirigenza non è disposta a discutere ancora sull'ingaggio."); return; }
    offer.attempts.salary++;
    ok = rollChance(negotiationChance(player) * 100);
    if (ok) cp.salary = round1(cp.salary * 1.15);
    toast(ok ? "✅ La squadra accetta di aumentare l'ingaggio!" : "❌ La squadra rifiuta l'aumento di ingaggio.");
  } else {
    const clause = CONTRACT_CLAUSES.find(c => c.id === kind);
    if (!clause || cp.clauses[kind] || offer.attempts[kind] || !clause.available(cp, offer, player)) return;
    offer.attempts[kind] = 1;
    ok = rollChance(clauseChance(player, offer, clause) * 100);
    if (ok) cp.clauses[kind] = true;
    toast(ok ? `✅ Clausola accettata: ${clause.label}.` : `❌ La società non concede: ${clause.label}.`);
  }

  if (!ok) {
    offer.patience--;
    changeReputation(player, -1);
    if (offer.patience <= 0) { withdrawOffer(d); return; }
  }
  renderGameScreen();
}

/* Pazienza esaurita: l'offerta viene ritirata (quelle del Draft restano, ma senza altre concessioni) */
function withdrawOffer(d) {
  const offer = d.offer;
  if (offer.id === "rookie" || offer.id === "undrafted_nba") {
    toast("😤 La dirigenza chiude la trattativa: resta solo da firmare alle condizioni attuali.");
    renderGameScreen();
    return;
  }
  toast(`🚪 ${offer.team.name} ritira l'offerta: hai tirato troppo la corda.`);
  if (d.returnTo) { player.pendingDecision = d.returnTo; renderGameScreen(); return; }
  const m = d.marketDecision;
  const keep = o => o && o.id !== offer.id;
  m.offers = m.offers.filter(keep);
  m.specialOffers = m.specialOffers.filter(keep);
  if (m.renewOffer && m.renewOffer.id === offer.id) m.renewOffer = null;
  if (!m.offers.length) m.offers = buildExternalOffersForLeague(player, m.selectedLeague, m.specialOffers);
  player.pendingDecision = m;
  renderGameScreen();
}

function finalizeContract() {
  const d = player.pendingDecision;
  const offer = d.offer;
  const previousTeamName = player.team.name;
  applyOffer(player, offer);
  // cambiare aria azzera i vecchi attriti: nuovo spogliatoio, chimica che riparte da una base neutra
  if (previousTeamName !== player.team.name) {
    player.coachTrust = 55;
    player.starRapport = 55;
    player.chemistry = clamp(randInt(55, 70), 0, 100);
    player.morale = clamp(player.morale + 8, 0, 100);
  }
  player.contract = {
    yearsRemaining: offer.contractProposal.years,
    yearsTotal: offer.contractProposal.years,
    salaryPerYear: offer.contractProposal.salary,
    currency: offer.contractProposal.currency,
    teamStrength: offer.contractProposal.teamStrength,
    clauses: { ...(offer.contractProposal.clauses || {}) },
    supermax: !!offer.contractProposal.supermax,
  };
  // restare fedeli al club è apprezzato da tutta la lega
  if (offer.id === "renew" || offer.id === "extension") changeReputation(player, 2);
  if (offer.id === "homecoming") onHomecomingSigned(player);
  if (offer.id === "pro_abroad") player.proAbroadYoung = true;
  checkAchievements(player);
  toast(`✍️ Hai firmato con ${player.team.name}: ${contractSummaryHtml(offer.contractProposal, offer.targetLeague)}`);
  advanceAfterOffseason();
}

/* Richiesta di trade al front office: una sola per stagione. Ha effetto dalla prossima stagione
   (lo storico di quella appena giocata resta alla squadra con cui è stata disputata) e un
   rifiuto lascia qualche strascico nello spogliatoio. */
function requestTrade() {
  if (!player || player.league !== "NBA" || player.pendingDecision || player.retired) return;
  if (player.tradeRequestYear === player.year) { toast("⚠️ Hai già chiesto una trade in questa stagione."); return; }
  player.tradeRequestYear = player.year;
  const successChance = clamp(0.3 + (player.overall - 70) * 0.01 + (reputationOf(player) - 50) * 0.005, 0.1, 0.8);
  changeReputation(player, -3); // chiedere la cessione non piace mai alle società
  changeCoachTrust(player, -8);
  if (Math.random() < successChance) {
    let newTeam = pickTeam("NBA");
    let tries = 0;
    while (newTeam.name === player.team.name && tries < 5) { newTeam = pickTeam("NBA"); tries++; }
    player.team = newTeam;
    player.chemistry = clamp(randInt(55, 70), 0, 100);
    player.coachTrust = 55;
    player.starRapport = 55;
    toast(`🔁 Trade completata! Dalla prossima stagione giocherai con i ${newTeam.name}.`);
  } else {
    player.chemistry = clamp(player.chemistry - randInt(4, 8), 0, 100);
    toast("❌ Richiesta di trade rifiutata dal front office: lo spogliatoio non ha gradito.");
  }
  renderGameScreen();
}
