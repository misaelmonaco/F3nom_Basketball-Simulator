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
function continueAfterDraft(record, result, team, pick, prev) {
  prev = prev || { team: player.team, league: player.league, coachTrust: player.coachTrust, starRapport: player.starRapport };
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
    cp.salary = cp.salary == null ? null : roundMoney(cp.salary * salaryBoost);
    const rookieOffer = {
      id: "rookie", title: `🏀 Contratto Rookie — ${team.name}`,
      desc: `${team.name} (${team.city}) ti propone il tuo primo contratto da professionista.`,
      team, targetLeague: "NBA", contractProposal: cp, attempts: { years: 0, salary: 0 },
      stash: prev, pick,
    };
    player.pendingDecision = { type: "negotiate", offer: rookieOffer, marketDecision: null, draftRecord: record };
  } else {
    // Undrafted: resta comunque una possibilità concreta di firmare in USA-1 da free agent.
    // Se la possibilità non si concretizza non si mostra alcuna finestra USA-1 vuota: si passa
    // direttamente al normale mercato nella lega di provenienza.
    const nbaChance = clamp((player.overall - 60) * 3, 5, 65);
    if (rollChance(nbaChance)) {
      const team = pickTeam("NBA");
      const cp = generateContractProposal("NBA", player, team);
      cp.years = 1;
      cp.salary = cp.salary == null ? null : roundMoney(cp.salary * 0.55);
      const undraftedOffer = {
        id: "undrafted_nba",
        title: `🆓 ${team.name} (Free Agent USA-1)`,
        desc: `Non sei stato scelto al Draft, ma ${team.name} ti offre comunque un contratto da free agent per provare a ritagliarti un posto in USA-1.`,
        team, targetLeague: "NBA", contractProposal: cp, attempts: { years: 0, salary: 0 },
        stash: prev,
      };
      toast(`🆓 Undrafted, ma ${team.name} ti offre un contratto USA-1 da free agent!`);
      player.pendingDecision = { type: "negotiate", offer: undraftedOffer, marketDecision: null, draftRecord: record };
    } else {
      toast(`Draft: Undrafted. Nessun club USA-1 si è fatto avanti: continua il tuo percorso.`);
      player.pendingDecision = createMarketDecision(player, record);
    }
  }
  renderGameScreen();
}

/* Dopo il Draft si può dire di no e restare dove si giocava (la squadra USA-1 tiene i diritti);
   lo stesso succede se la dirigenza perde la pazienza e ritira l'offerta */
function declineDraftOffer(withdrawn) {
  const d = player.pendingDecision;
  if (!d || d.type !== "negotiate" || !d.offer.stash) return;
  const offer = d.offer, prev = offer.stash;
  if (offer.id === "rookie") {
    player.inNBA = false;
    player.league = prev.league;
    player.team = prev.team;
    player.coachTrust = prev.coachTrust;
    player.starRapport = prev.starRapport;
    player.draftRights = { team: offer.team, year: player.year, pick: offer.pick || null };
  }
  const rights = offer.id === "rookie" ? ` ${offer.team.name} mantiene i tuoi diritti USA-1 per un anno: ti richiamerà la prossima estate.` : "";
  toast(withdrawn ? `🚪 ${offer.team.name} ritira l'offerta: resti a ${prev.team.name}.${rights}` : `🏠 Hai detto no a ${offer.team.name}: resti a ${prev.team.name}.${rights}`);
  if (withdrawn) changeReputation(player, -2);
  const record = d.draftRecord;
  const c = player.contract;
  let next = c && c.yearsRemaining > 0
    ? { type: "offseasonStatus", record, extensionOffer: buildExtensionOffer(player, record) }
    : createMarketDecision(player, record);
  if (!player.agentChosen && player.age >= 18) next = { type: "agentChoice", next };
  player.pendingDecision = next;
  renderGameScreen();
}

/* L'estate dopo aver rifiutato il rookie: la squadra che detiene i diritti torna alla carica,
   a contratto scaduto o in corso. È l'ultima chiamata: se dici ancora no, i diritti decadono
   e dalla stagione seguente puoi firmare con chiunque in USA-1. */
function draftRightsDecision(p, next) {
  const rights = p.draftRights;
  const team = rights.team;
  p.draftRights = null;
  const offer = {
    id: "draft_rights", title: `🎓 ${team.name} (diritti USA-1)`,
    desc: `${team.name} ti ha scelto al Draft ${rights.year} e detiene ancora i tuoi diritti: è la sua ultima occasione per portarti in USA-1. Se rifiuti, i diritti decadono.`,
    team, targetLeague: "NBA", contractProposal: generateContractProposal("NBA", p, team), attempts: { years: 0, salary: 0 },
  };
  toast(`📞 ${team.name} detiene ancora i tuoi diritti e ti rivuole in USA-1.`);
  return next.type === "market"
    ? { type: "negotiate", offer, marketDecision: next }
    : { type: "negotiate", offer, marketDecision: null, returnTo: next, rightsCall: true };
}
function declineDraftRights() {
  const d = player.pendingDecision;
  if (!d || d.type !== "negotiate" || !d.returnTo) return;
  toast(`🙅 Hai detto no a ${d.offer.team.name}: i suoi diritti USA-1 decadono.`);
  player.pendingDecision = d.returnTo;
  renderGameScreen();
}

function selectOffer(offer, marketDecision) {
  if (!offer.attempts) offer.attempts = { years: 0, salary: 0 };
  if (!offer.flash) tickFlashOffer(marketDecision); // guardare altre offerte fa scadere quella lampo
  player.pendingDecision = { type: "negotiate", offer, marketDecision };
  renderGameScreen();
}

function backToOffers() {
  const { offer, marketDecision } = player.pendingDecision;
  // dopo un caricamento l'offerta in trattativa è una copia distinta da quella nella lista:
  // la si rimette al suo posto, così condizioni e tentativi già spesi non vanno persi
  const sync = o => (o && o.id === offer.id ? offer : o);
  marketDecision.offers = marketDecision.offers.map(sync);
  if (marketDecision.offersByLeague) Object.keys(marketDecision.offersByLeague).forEach(k => { marketDecision.offersByLeague[k] = marketDecision.offersByLeague[k].map(sync); });
  marketDecision.specialOffers = marketDecision.specialOffers.map(sync);
  marketDecision.renewOffer = sync(marketDecision.renewOffer);
  marketDecision.flash = sync(marketDecision.flash);
  player.pendingDecision = marketDecision;
  renderGameScreen();
}

function switchOfferLeague(leagueId) {
  const d = player.pendingDecision;
  if (d.selectedLeague !== leagueId) tickFlashOffer(d);
  d.selectedLeague = leagueId;
  // le offerte restano quelle generate all'apertura del mercato; le coppe raccolgono le squadre che le giocano
  const externals = isCupSelector(leagueId) ? cupOffers(player, d, leagueId) : leagueOffers(player, d, leagueId);
  d.offers = d.renewOffer ? externals.concat([d.renewOffer]) : externals;
  renderGameScreen();
}

function negotiateContract(kind, target) {
  const d = player.pendingDecision;
  const offer = d.offer;
  const cp = offer.contractProposal;
  cp.clauses = cp.clauses || {};
  if (offer.patience == null) offer.patience = OFFER_PATIENCE;
  if (offer.patience <= 0) { toast("La dirigenza non vuole più trattare: puoi solo firmare o valutare altre offerte."); return; }

  let ok;
  if (kind === "years") {
    // la durata voluta (dallo slider); senza, un anno in più come prima
    const want = clamp(Math.round(target == null ? cp.years + 1 : target), CONTRACT_YEARS_MIN, CONTRACT_YEARS_MAX);
    if (want === cp.years) return;
    if (offer.attempts.years >= 2) { toast("La dirigenza non è disposta a discutere ancora sulla durata."); return; }
    offer.attempts.years++;
    ok = rollChance(yearsAskChance(player, cp, want) * 100);
    const label = `${want} ${want === 1 ? "anno" : "anni"}`;
    if (ok) cp.years = want;
    toast(ok ? `✅ La squadra accetta: contratto di ${label}.` : `❌ La squadra non vuole un contratto di ${label}.`);
  } else if (kind === "salary") {
    if (cp.salary == null) { toast("Questa lega non prevede un ingaggio negoziabile."); return; }
    if (offer.attempts.salary >= 2) { toast("La dirigenza non è disposta a discutere ancora sull'ingaggio."); return; }
    offer.attempts.salary++;
    ok = rollChance(negotiationChance(player) * 100);
    if (ok) cp.salary = roundMoney(cp.salary * 1.15);
    toast(ok ? "✅ La squadra accetta di aumentare l'ingaggio!" : "❌ La squadra rifiuta l'aumento di ingaggio.");
  } else if (kind === "role") {
    // più responsabilità: un gradino in più nel ruolo promesso
    if (!canAskTeamRole(cp) || offer.attempts.role) return;
    offer.attempts.role = 1;
    ok = rollChance(teamRoleAskChance(player, cp) * 100);
    if (ok) cp.teamRole = nextTeamRoleUp(cp.teamRole);
    toast(ok ? `✅ Ruolo concesso: arrivi come ${getTeamRole(cp.teamRole).label}.` : "❌ La società non ti promette un ruolo più importante.");
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

/* Pazienza esaurita: l'offerta viene ritirata del tutto (anche quella del Draft: si resta nel club) */
function withdrawOffer(d) {
  const offer = d.offer;
  if (offer.stash && d.draftRecord) { declineDraftOffer(true); return; }
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
  if (m.flash && m.flash.id === offer.id) m.flash = null;
  if (m.offersByLeague) Object.keys(m.offersByLeague).forEach(k => { m.offersByLeague[k] = m.offersByLeague[k].filter(keep); });
  if (!m.offers.length && isCupSelector(m.selectedLeague)) m.selectedLeague = pickFillerLeague(player);
  if (!m.offers.length) {
    // campionato rimasto senza offerte: se ne fa avanti qualcun altro
    if (m.offersByLeague) delete m.offersByLeague[m.selectedLeague];
    m.offers = m.offersByLeague ? leagueOffers(player, m, m.selectedLeague).slice() : buildExternalOffersForLeague(player, m.selectedLeague, m.specialOffers);
    if (m.renewOffer) m.offers.push(m.renewOffer);
  }
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
    teamRole: offer.contractProposal.teamRole || null, // il ruolo promesso (vedi team-role.js)
  };
  // restare fedeli al club è apprezzato da tutta la lega
  if (offer.id === "renew" || offer.id === "extension") changeReputation(player, 2);
  if (offer.id === "homecoming") onHomecomingSigned(player);
  if (offer.id === "pro_abroad") player.proAbroadYoung = true;
  if (offer.id === "hometown") onHometownSigned(player);
  if (offer.targetLeague === "NBA") player.draftRights = null;
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

/* ---------- buyout: uscire dal contratto quando il club non mantiene le promesse ---------- */
/* Incongruenza dell'ultima stagione: ruolo promesso non rispettato o posto perso per tutto l'anno */
function contractIncongruence(p, record) {
  if (!record || !p.contract || p.contract.yearsRemaining <= 0) return null;
  if (record.promisedRole && record.teamRole && teamRoleIndex(record.teamRole) > teamRoleIndex(record.promisedRole))
    return `Ti avevano promesso il ruolo di ${getTeamRole(record.promisedRole).label}, hai giocato da ${getTeamRole(record.teamRole).label}.`;
  if (record.roleBattle && !record.roleBattle.won && !record.roleBattle.regainedIn)
    return `Hai perso il posto a favore di ${record.roleBattle.rival.name} e non l'hai più ripreso.`;
  return null;
}
/* La penale: metà dell'ingaggio che resta da pagare */
function buyoutCost(p) {
  const c = p.contract;
  return roundMoney(Math.max(0.01, (c.salaryPerYear || 0.02) * c.yearsRemaining * 0.5));
}
function buyContractOut() {
  const d = player.pendingDecision;
  if (!d || d.type !== "offseasonStatus" || !contractIncongruence(player, d.record)) return;
  const cost = buyoutCost(player);
  if (player.wealth < cost) { toast("💸 Non hai abbastanza soldi per pagare il buyout."); return; }
  player.wealth = roundMoney(player.wealth - cost);
  const oldTeam = player.team.name;
  player.contract.yearsRemaining = 0;
  changeReputation(player, -1);
  player.chemistry = clamp(player.chemistry - 5, 0, 100);
  toast(`💼 Buyout pagato (${fmtMoney(cost, playerCurrency(player))}): sei libero da ${oldTeam}.`);
  const m = createMarketDecision(player, d.record);
  // chi paga per andarsene non viene rinnovato
  m.renewOffer = null;
  m.offers = m.offers.filter(o => o.id !== "renew");
  m.buyout = true;
  player.pendingDecision = !player.agentChosen && player.age >= 18 ? { type: "agentChoice", next: m } : m;
  renderGameScreen();
}
function buyoutBoxHtml(p, record) {
  const why = contractIncongruence(p, record);
  if (!why) return "";
  const cost = buyoutCost(p), cur = playerCurrency(p);
  return `
    <div class="buyout-box">
      <div class="trb-title">⚖️ Il club non ha mantenuto la parola</div>
      <p class="small-muted">${why} Puoi uscire dal contratto (${p.contract.yearsRemaining} ${p.contract.yearsRemaining === 1 ? "anno" : "anni"} rimasti) pagando il buyout: ${fmtMoney(cost, cur)} (hai ${fmtMoney(p.wealth, cur)}).</p>
      <div class="btn-row" style="justify-content:center"><button class="btn btn-secondary" id="btn-buyout" ${p.wealth < cost ? "disabled" : ""}>💼 Paga il buyout e vai sul mercato</button></div>
    </div>`;
}
