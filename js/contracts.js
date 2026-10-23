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
  toast(tr("Hai scelto di restare ancora un anno nel tuo percorso attuale.", "You chose to stay another year on your current path."));
  player.pendingDecision = createMarketDecision(player, record);
  renderGameScreen();
}

/* Dopo la notte del Draft: contratto da rookie, offerta da free agent o mercato abituale */
function continueAfterDraft(record, result, team, pick, prev) {
  prev = prev || { team: player.team, league: player.league, coachTrust: player.coachTrust, starRapport: player.starRapport };
  record.draftResult = pick ? `${result} (${tr(`scelta n° ${pick}`, `pick #${pick}`)})` : result;
  if (team) {
    record.event = record.event || { text: tr(`Selezionato al Draft NBA: ${result} da ${team.name}!`, `Selected in the NBA Draft: ${result} by ${team.name}!`), type: "milestone" };
    toast(`🎉 Draft: ${result}${pick ? tr(`, scelta n° ${pick}`, `, pick #${pick}`) : ""} — ${team.name}`);
    // scala salariale rookie legata alla posizione al draft
    let rookieYears = 2, salaryBoost = 1;
    if (result.startsWith("Top 5")) { rookieYears = 4; salaryBoost = 1.4; }
    else if (result === "Primo Giro" || result === "First Round") { rookieYears = 3; salaryBoost = 1.1; }
    else { rookieYears = 2; salaryBoost = 0.7; }
    const cp = generateContractProposal("NBA", player, team);
    cp.years = rookieYears;
    cp.salary = cp.salary == null ? null : roundMoney(cp.salary * salaryBoost);
    const rookieOffer = {
      id: "rookie", title: tr(`🏀 Contratto Rookie — ${team.name}`, `🏀 Rookie Contract — ${team.name}`),
      desc: tr(`${team.name} (${team.city}) ti propone il tuo primo contratto da professionista.`, `${team.name} (${team.city}) offers you your first pro contract.`),
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
        desc: tr(`Non sei stato scelto al Draft, ma ${team.name} ti offre comunque un contratto da free agent per provare a ritagliarti un posto in USA-1.`, `You went undrafted, but ${team.name} offers you a free agent contract to fight for a spot in USA-1.`),
        team, targetLeague: "NBA", contractProposal: cp, attempts: { years: 0, salary: 0 },
        stash: prev,
      };
      toast(tr(`🆓 Undrafted, ma ${team.name} ti offre un contratto USA-1 da free agent!`, `🆓 Undrafted, but ${team.name} offers you a USA-1 free agent contract!`));
      player.pendingDecision = { type: "negotiate", offer: undraftedOffer, marketDecision: null, draftRecord: record };
    } else {
      toast(tr(`Draft: Undrafted. Nessun club USA-1 si è fatto avanti: continua il tuo percorso.`, `Draft: Undrafted. No USA-1 club stepped forward: continue on your path.`));
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
  const rights = offer.id === "rookie" ? tr(` ${offer.team.name} mantiene i tuoi diritti USA-1 per un anno: ti richiamerà la prossima estate.`, ` ${offer.team.name} retains your USA-1 draft rights for one year and will call you back next summer.`) : "";
  toast(withdrawn ? tr(`🚪 ${offer.team.name} ritira l'offerta: resti a ${prev.team.name}.${rights}`, `🚪 ${offer.team.name} withdraws the offer: you stay with ${prev.team.name}.${rights}`) : tr(`🏠 Hai detto no a ${offer.team.name}: resti a ${prev.team.name}.${rights}`, `🏠 You turned down ${offer.team.name}: you stay with ${prev.team.name}.${rights}`));
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
    id: "draft_rights", title: tr(`🎓 ${team.name} (diritti USA-1)`, `🎓 ${team.name} (USA-1 Rights)`),
    desc: tr(`${team.name} ti ha scelto al Draft ${rights.year} e detiene ancora i tuoi diritti: è la sua ultima occasione per portarti in USA-1. Se rifiuti, i diritti decadono.`, `${team.name} drafted you in ${rights.year} and still holds your rights: this is their last chance to bring you to USA-1. If you decline, their rights expire.`),
    team, targetLeague: "NBA", contractProposal: generateContractProposal("NBA", p, team), attempts: { years: 0, salary: 0 },
  };
  toast(tr(`📞 ${team.name} detiene ancora i tuoi diritti e ti rivuole in USA-1.`, `📞 ${team.name} still holds your draft rights and wants you in USA-1.`));
  return next.type === "market"
    ? { type: "negotiate", offer, marketDecision: next }
    : { type: "negotiate", offer, marketDecision: null, returnTo: next, rightsCall: true };
}
function declineDraftRights() {
  const d = player.pendingDecision;
  if (!d || d.type !== "negotiate" || !d.returnTo) return;
  toast(tr(`🙅 Hai detto no a ${d.offer.team.name}: i suoi diritti USA-1 decadono.`, `🙅 You turned down ${d.offer.team.name}: their USA-1 draft rights expire.`));
  player.pendingDecision = d.returnTo;
  renderGameScreen();
}

function selectOffer(offer, marketDecision) {
  if (!offer) return;
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
  if (offer.patience <= 0) { toast(tr("La dirigenza non vuole più trattare: puoi solo firmare o valutare altre offerte.", "Front office refuses further negotiation: you can only sign or explore other offers.")); return; }

  let ok;
  if (kind === "years") {
    // la durata voluta (dallo slider); senza, un anno in più come prima
    const want = clamp(Math.round(target == null ? cp.years + 1 : target), CONTRACT_YEARS_MIN, CONTRACT_YEARS_MAX);
    if (want === cp.years) return;
    if (offer.attempts.years >= 2) { toast(tr("La dirigenza non è disposta a discutere ancora sulla durata.", "Front office is not willing to discuss contract length any further.")); return; }
    offer.attempts.years++;
    ok = rollChance(yearsAskChance(player, cp, want) * 100);
    const label = `${want} ${want === 1 ? tr("anno", "year") : tr("anni", "years")}`;
    if (ok) cp.years = want;
    toast(ok ? tr(`✅ La squadra accetta: contratto di ${label}.`, `✅ The team accepts: ${label} contract.`) : tr(`❌ La squadra non vuole un contratto di ${label}.`, `❌ The team rejects a ${label} contract.`));
  } else if (kind === "salary") {
    if (cp.salary == null) { toast(tr("Questa lega non prevede un ingaggio negoziabile.", "This league does not offer a negotiable salary.")); return; }
    if (offer.attempts.salary >= 2) { toast(tr("La dirigenza non è disposta a discutere ancora sull'ingaggio.", "Front office is not willing to discuss salary any further.")); return; }
    offer.attempts.salary++;
    ok = rollChance(negotiationChance(player) * 100);
    if (ok) cp.salary = roundMoney(cp.salary * 1.15);
    toast(ok ? tr("✅ La squadra accetta di aumentare l'ingaggio!", "✅ The team agrees to increase the salary!") : tr("❌ La squadra rifiuta l'aumento di ingaggio.", "❌ The team rejects the salary increase."));
  } else if (kind === "role") {
    // più responsabilità: un gradino in più nel ruolo promesso
    if (!canAskTeamRole(cp) || offer.attempts.role) return;
    offer.attempts.role = 1;
    ok = rollChance(teamRoleAskChance(player, cp) * 100);
    if (ok) cp.teamRole = nextTeamRoleUp(cp.teamRole);
    toast(ok ? tr(`✅ Ruolo concesso: arrivi come ${getTeamRole(cp.teamRole).label}.`, `✅ Role granted: you'll join as ${getTeamRole(cp.teamRole).label}.`) : tr("❌ La società non ti promette un ruolo più importante.", "❌ The club won't promise you a bigger role."));
  } else {
    const clause = CONTRACT_CLAUSES.find(c => c.id === kind);
    if (!clause || cp.clauses[kind] || offer.attempts[kind] || !clause.available(cp, offer, player)) return;
    offer.attempts[kind] = 1;
    ok = rollChance(clauseChance(player, offer, clause) * 100);
    if (ok) cp.clauses[kind] = true;
    toast(ok ? tr(`✅ Clausola accettata: ${clause.label}.`, `✅ Clause accepted: ${clause.label}.`) : tr(`❌ La società non concede: ${clause.label}.`, `❌ The club refuses: ${clause.label}.`));
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
    toast(tr("😤 La dirigenza chiude la trattativa: resta solo da firmare alle condizioni attuali.", "😤 Front office closes talks: you can only sign on the current terms."));
    renderGameScreen();
    return;
  }
  toast(tr(`🚪 ${offer.team.name} ritira l'offerta: hai tirato troppo la corda.`, `🚪 ${offer.team.name} withdraws the offer: you pushed too far.`));
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
    if (typeof onTeamChangeRelationships === "function") {
      onTeamChangeRelationships(player);
    } else {
      player.coachTrust = 55;
      player.starRapport = 55;
      player.chemistry = clamp(randInt(55, 70), 0, 100);
    }
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
  if (typeof finalClimbUnlockPotential === "function") finalClimbUnlockPotential(player, player.league);
  if (offer.targetLeague === "NBA") player.draftRights = null;
  checkAchievements(player);
  toast(tr(`✍️ Hai firmato con ${player.team.name}: ${contractSummaryHtml(offer.contractProposal, offer.targetLeague)}`, `✍️ Signed with ${player.team.name}: ${contractSummaryHtml(offer.contractProposal, offer.targetLeague)}`));
  const inSeason = d.marketDecision && d.marketDecision.inSeasonBuyout;
  if (inSeason === "preSeason") {
    advanceSeasonContinue();
    return;
  }
  if (inSeason === "blocks" && player.pendingSeason) {
    const s = player.pendingSeason;
    const prevTeam = s.team;
    s.team = player.team;
    s.seasonLeague = player.league;
    s.teamStrength = getTeamStrength(player.team, player.league);
    if (prevTeam && prevTeam.name !== player.team.name) s.tradedFrom = prevTeam;
    const starterClause = !!(player.contract && player.contract.clauses && player.contract.clauses.starter && player.contract.yearsRemaining > 0);
    const staff = getTeamStaff(player.team, player.league);
    const mi = seasonTeamRole(player, player.league, s.teamStrength, { ...player.seasonModifiers, starter: starterClause, staffShift: staffMinutesShift(player, staff) });
    s.minutesInfo = mi;
    player.currentTeamRole = mi.teamRole;
    const played = s.blocks.reduce((t, b) => t + b.games, 0);
    const targetTotal = seasonLength(player.league);
    if (s.blocks.length === 0) {
      s.games = targetTotal;
    } else if (s.blocks.length === 1) {
      const rem = Math.max(8, Math.round(targetTotal * 0.65));
      s.games = Math.max(played + rem, Math.ceil((played + 4) / 0.65));
    } else {
      s.games = played + Math.max(4, Math.round(targetTotal * 0.30));
    }
    s.goals = buildSeasonGoals(player, player.league, s.teamStrength, mi);
    s.roleBattle = null;
    updateAdaptationForSeason(player);
    pushNews(tr(`💼 Cambio maglia via buyout: lasci ${prevTeam.name} e firmi a stagione in corso con ${player.team.name} (${LEAGUES[player.league].name}).`, `💼 Mid-season buyout move: you leave ${prevTeam.name} and sign with ${player.team.name} (${LEAGUES[player.league].name}).`));
    player.pendingDecision = nextSeasonBlockDecision();
    renderGameScreen();
    return;
  }
  advanceAfterOffseason();
}

/* Richiesta di trade al front office: una sola per stagione. Ha effetto dalla prossima stagione
   (lo storico di quella appena giocata resta alla squadra con cui è stata disputata) e un
   rifiuto lascia qualche strascico nello spogliatoio. */
function requestTrade() {
  if (!player || player.league !== "NBA" || player.pendingDecision || player.retired) return;
  if (player.scenario && player.scenario.id === "oneClubMan" && player.scenario.status === "active") {
    toast(tr("🛡️ Nello scenario La Bandiera hai giurato fedeltà alla tua squadra: niente cessioni!", "🛡️ In the One-Club Man scenario you swore loyalty to your team: no trades!"));
    return;
  }
  if (player.tradeRequestYear === player.year) { toast(tr("⚠️ Hai già chiesto una trade in questa stagione.", "⚠️ You already requested a trade this season.")); return; }
  player.tradeRequestYear = player.year;
  const successChance = clamp(0.3 + (player.overall - 70) * 0.01 + (reputationOf(player) - 50) * 0.005, 0.1, 0.8);
  changeReputation(player, -3); // chiedere la cessione non piace mai alle società
  changeCoachTrust(player, -8);
  if (Math.random() < successChance) {
    let newTeam = pickTeam("NBA");
    let tries = 0;
    while (newTeam.name === player.team.name && tries < 5) { newTeam = pickTeam("NBA"); tries++; }
    player.team = newTeam;
    if (typeof onTeamChangeRelationships === "function") {
      onTeamChangeRelationships(player);
    } else {
      player.chemistry = clamp(randInt(55, 70), 0, 100);
      player.coachTrust = 55;
      player.starRapport = 55;
    }
    toast(tr(`🔁 Trade completata! Dalla prossima stagione giocherai con i ${newTeam.name}.`, `🔁 Trade completed! Starting next season you'll play for the ${newTeam.name}.`));
  } else {
    player.chemistry = clamp(player.chemistry - randInt(4, 8), 0, 100);
    toast(tr("❌ Richiesta di trade rifiutata dal front office: lo spogliatoio non ha gradito.", "❌ Trade request rejected by the front office: the locker room wasn't happy about it."));
  }
  renderGameScreen();
}

/* ---------- buyout: uscire dal contratto in qualsiasi step della stagione o in estate ---------- */
const IN_SEASON_BUYOUT_TYPES = ["seasonBlock", "seasonFocus", "roleBattle", "nationalCup", "allStarWeekend", "tradeDeadline"];

/* Incongruenza dell'ultima stagione: ruolo promesso non rispettato o posto perso per tutto l'anno */
function contractIncongruence(p, record) {
  if (!record || !p.contract || p.contract.yearsRemaining <= 0) return null;
  if (record.promisedRole && record.teamRole && teamRoleIndex(record.teamRole) > teamRoleIndex(record.promisedRole))
    return tr(`Ti avevano promesso il ruolo di ${getTeamRole(record.promisedRole).label}, hai giocato da ${getTeamRole(record.teamRole).label}.`, `You were promised the ${getTeamRole(record.promisedRole).label} role, but played as ${getTeamRole(record.teamRole).label}.`);
  if (record.roleBattle && !record.roleBattle.won && !record.roleBattle.regainedIn)
    return tr(`Hai perso il posto a favore di ${record.roleBattle.rival.name} e non l'hai più ripreso.`, `You lost your spot to ${record.roleBattle.rival.name} and never won it back.`);
  return null;
}
/* La penale: metà dell'ingaggio che resta da pagare */
function buyoutCost(p) {
  const c = p.contract || {};
  const yrs = c.yearsRemaining > 0 ? c.yearsRemaining : 1;
  return roundMoney(Math.max(0.01, (c.salaryPerYear || 0.02) * yrs * 0.5));
}
function buyContractOut() {
  const d = player.pendingDecision;
  if (!d) return;
  const isOffseason = d.type === "offseasonStatus";
  const isInSeason = IN_SEASON_BUYOUT_TYPES.includes(d.type);
  if (!isOffseason && !isInSeason) return;
  const cost = buyoutCost(player);
  const oldTeam = player.team.name;
  if (player.wealth >= cost) {
    player.wealth = roundMoney(player.wealth - cost);
    toast(tr(`💼 Buyout pagato (${fmtMoney(cost, playerCurrency(player))}): sei libero da ${oldTeam} e torni sul mercato.`, `💼 Buyout paid (${fmtMoney(cost, playerCurrency(player))}): you are free from ${oldTeam} and back on the market.`));
  } else {
    player.wealth = 0;
    changeReputation(player, -2);
    toast(tr(`💼 Risoluzione consensuale del contratto con ${oldTeam}: rinunci agli emolumenti e torni subito sul mercato.`, `💼 Mutual contract termination with ${oldTeam}: you forfeit remaining pay and hit the market immediately.`));
  }
  if (player.contract) player.contract.yearsRemaining = 0;
  changeReputation(player, -1);
  player.chemistry = clamp(player.chemistry - 5, 0, 100);
  if (typeof onBuyoutSocial === "function") onBuyoutSocial(player, player.team);
  if (player.scenario && player.scenario.id === "oneClubMan" && player.scenario.status === "active") {
    if (typeof scenarioInterrupt === "function") scenarioInterrupt("failed");
    else player.scenario.status = "failed";
  }
  const rec = d.record || player.history[player.history.length - 1] || { year: player.year };
  const m = createMarketDecision(player, rec);
  // chi chiede il buyout per andarsene non viene rinnovato dal vecchio club
  m.renewOffer = null;
  m.offers = m.offers.filter(o => o.id !== "renew");
  m.buyout = true;
  if (isInSeason) m.inSeasonBuyout = d.type === "seasonFocus" ? "preSeason" : "blocks";
  player.pendingDecision = !player.agentChosen && player.age >= 18 ? { type: "agentChoice", next: m } : m;
  renderGameScreen();
}
function buyoutBoxHtml(p, record) {
  if (!p || p.retired || isMinorItaLeague(p.league) || (p.scenario && p.scenario.id === "oneClubMan" && p.scenario.status === "active")) return "";
  const why = contractIncongruence(p, record);
  const cost = buyoutCost(p), cur = playerCurrency(p);
  const yrs = p.contract && p.contract.yearsRemaining > 0 ? p.contract.yearsRemaining : 1;
  const canPay = p.wealth >= cost;
  if (why) {
    return `
      <div class="buyout-box">
        <div class="trb-title">${tr("⚖️ Il club non ha mantenuto la parola", "⚖️ The club broke its promise")}</div>
        <p class="small-muted">${why} ${tr(`Puoi uscire dal contratto (${yrs} ${yrs === 1 ? "anno" : "anni"} rimasti) pagando il buyout: ${fmtMoney(cost, cur)} (hai ${fmtMoney(p.wealth, cur)}).`, `You can opt out of your contract (${yrs} ${yrs === 1 ? "year" : "years"} left) by paying the buyout: ${fmtMoney(cost, cur)} (you have ${fmtMoney(p.wealth, cur)}).`)}</p>
        <div class="btn-row" style="justify-content:center"><button type="button" class="btn btn-secondary" id="btn-buyout">💼 ${canPay ? tr("Paga il buyout e vai sul mercato", "Pay buyout and enter the market") : tr("Richiedi buyout consensuale e vai sul mercato", "Request mutual buyout and enter the market")}</button></div>
      </div>`;
  }
  return `
    <div class="buyout-box">
      <div class="trb-title">${tr("💼 Vuoi cambiare squadra? Richiedi il buyout", "💼 Want to change team? Request a buyout")}</div>
      <p class="small-muted">${tr(`Puoi uscire in anticipo dal contratto con ${p.team.name} (${yrs} ${yrs === 1 ? "anno" : "anni"} rimasti) e tornare subito sul mercato${canPay ? ` pagando il buyout di ${fmtMoney(cost, cur)} (hai ${fmtMoney(p.wealth, cur)})` : " tramite risoluzione consensuale (rinunci agli emolumenti, reputazione −2)"}.`, `You can exit your contract with ${p.team.name} early (${yrs} ${yrs === 1 ? "year" : "years"} left) and enter the market right away${canPay ? ` by paying the ${fmtMoney(cost, cur)} buyout (you have ${fmtMoney(p.wealth, cur)})` : " via mutual termination (forfeit remaining pay, reputation −2)"}.`)}</p>
      <div class="btn-row" style="justify-content:center"><button type="button" class="btn btn-secondary" id="btn-buyout">💼 ${canPay ? tr(`Paga il buyout (${fmtMoney(cost, cur)}) e vai sul mercato`, `Pay buyout (${fmtMoney(cost, cur)}) and enter the market`) : tr("Richiedi buyout consensuale e vai sul mercato", "Request mutual buyout and enter the market")}</button></div>
    </div>`;
}
function inSeasonBuyoutHtml(p) {
  if (!p || p.retired || isMinorItaLeague(p.league) || (p.scenario && p.scenario.id === "oneClubMan" && p.scenario.status === "active")) return "";
  const cost = buyoutCost(p), cur = playerCurrency(p);
  const canPay = p.wealth >= cost;
  return `
    <div class="buyout-box in-season-buyout" style="margin-top:12px">
      <div class="trb-title">${tr("💼 Mercato · Richiedi il buyout in questo step", "💼 Market · Request a buyout at this step")}</div>
      <p class="small-muted">${tr(`Vuoi lasciare ${p.team.name} e cambiare squadra adesso? Puoi richiedere il buyout${canPay ? ` (${fmtMoney(cost, cur)} · patrimonio ${fmtMoney(p.wealth, cur)})` : " consensuale (rinunci agli stipendi maturati)"} per tornare subito sul mercato e firmare un nuovo contratto.`, `Want to leave ${p.team.name} and switch teams right now? You can request a ${canPay ? `buyout (${fmtMoney(cost, cur)} · net worth ${fmtMoney(p.wealth, cur)})` : "mutual buyout (forfeit accrued salary)"} to hit the market immediately and sign a new contract.`)}</p>
      <div class="btn-row" style="justify-content:center"><button type="button" class="btn btn-secondary btn-sm" id="btn-buyout">💼 ${canPay ? tr(`Richiedi buyout (${fmtMoney(cost, cur)}) e torna sul mercato`, `Request buyout (${fmtMoney(cost, cur)}) and hit the market`) : tr("Richiedi buyout consensuale e torna sul mercato", "Request mutual buyout and hit the market")}</button></div>
    </div>`;
}
