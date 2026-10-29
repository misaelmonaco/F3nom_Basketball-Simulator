"use strict";

/* ================================================================
   METÀ STAGIONE — dopo il secondo tratto, prima della volata finale:
   - il weekend delle stelle: l'invito a una gara (tiro da tre, schiacciate,
     partita delle giovani promesse) o il riposo;
   - la scadenza del mercato NBA: un'altra squadra ti vuole subito, a
     stagione in corso. Si accetta o si resta.
   ================================================================ */
const MIDSEASON_AFTER_BLOCK = 2; // le decisioni arrivano dopo "Metà"

const ALLSTAR_CONTESTS = [
  { id: "three", icon: "🎯", label: "Gara del tiro da tre", labelEn: "Three-Point Contest", attr: "shooting", min: 80, desc: "Cinque postazioni, venticinque palloni, un minuto. Conta solo la mano.", descEn: "Five racks, twenty-five balls, one minute on the clock. Only pure shooting touch matters." },
  { id: "dunk", icon: "⚡", label: "Gara delle schiacciate", labelEn: "Slam Dunk Contest", attr: "athleticism", min: 82, desc: "Due schiacciate a testa davanti alla giuria: servono gambe e fantasia.", descEn: "Two dunks each in front of the judges: takes bounce and creativity." },
  { id: "rising", icon: "🌟", label: "Partita delle giovani promesse", labelEn: "Rising Stars Challenge", attr: null, min: 0, desc: "I migliori giovani della lega in campo insieme: una vetrina per farsi notare.", descEn: "The league's best young prospects share the court: a prime showcase to make a name for yourself." },
];
if (typeof i18nify === "function") i18nify(ALLSTAR_CONTESTS);

function allStarContestsFor(p) {
  return ALLSTAR_CONTESTS.filter(c => c.id === "rising" ? p.age <= 22 && p.yearsPro <= 3 : p.attrs[c.attr] >= c.min);
}
function allStarWinChance(p, c) {
  if (c.id === "rising") return clamp(35 + (p.overall - LEAGUES[p.league].avgOverall) * 2, 20, 70);
  return clamp(20 + (p.attrs[c.attr] - c.min) * 3, 15, 65);
}

/* Si viene invitati solo nei campionati professionistici, e non tutti gli anni */
function allStarInvite(p, s) {
  if (s.seasonLeague === "NCAA" || isMinorItaLeague(s.seasonLeague) || s.allStarDone) return null;
  const contests = allStarContestsFor(p);
  if (!contests.length || !rollChance(55)) return null;
  return contests.map(c => c.id);
}

/* La scadenza del mercato: solo in USA-1. Se la tua squadra perde e tu sei forte, una
   pretendente ti vuole per la corsa al titolo; se giochi poco, una squadra in ricostruzione
   ti offre più spazio. */
function tradeDeadlineOffer(p, s) {
  if (p && p.scenario && p.scenario.id === "oneClubMan" && p.scenario.status === "active") return null;
  if (s.seasonLeague !== "NBA" || s.deadlineDone || p.farewellTour === p.year) return null;
  const agg = aggregateSeasonBlocks(s.blocks);
  const winPct = agg.wins / Math.max(1, agg.wins + agg.losses);
  const bench = teamRoleIndex(s.minutesInfo.teamRole) >= teamRoleIndex("role"); // comprimario o giovane
  const teams = LEAGUES.NBA.teams.filter(t => t.name !== p.team.name).map(t => ({ t, str: getTeamStrength(t, "NBA") }));
  if (winPct < 0.45 && p.overall >= 80 && rollChance(35)) {
    // una pretendente, ma non per forza la più forte della lega
    const pool = teams.sort((a, b) => b.str - a.str).slice(2, 9);
    const pick = choice(pool);
    return { kind: "contender", team: pick.t, strength: pick.str };
  }
  if (bench && p.overall >= 70 && rollChance(25)) {
    const pool = teams.sort((a, b) => a.str - b.str).slice(0, 8);
    const pick = choice(pool);
    return { kind: "minutes", team: pick.t, strength: pick.str };
  }
  return null;
}

/* Nomi delle coppe nazionali di ciascun campionato */
const LEAGUE_CUP_NAMES = {
  NBA: "Coppa USA-1",
  GLEAGUE: "Showcase Cup",
  ITA_LBA: "Coppa Italia",
  ITA_A2: "Coppa Italia A2",
  ITA_B: "Coppa Italia Serie B",
  ITA_B2: "Coppa Italia Serie B",
  ESP_ACB: "Copa del Rey",
  ESP_FEB: "Copa Princesa",
  FRA_ELITE: "Leaders Cup",
  FRA_PROB: "Leaders Cup Pro B",
  TUR_BSL: "Coppa di Turchia",
  TUR_TBL: "Coppa Federale TBL",
  GRE_GBL: "Coppa di Grecia",
  GRE_A2: "Coppa Elite Grecia",
  ABA: "Coppa ABA",
  NBL: "NBL Cup",
  CBA: "Coppa CBA",
};
const LEAGUE_CUP_NAMES_EN = {
  NBA: "USA-1 Cup",
  GLEAGUE: "Showcase Cup",
  ITA_LBA: "Italian Cup",
  ITA_A2: "Italian A2 Cup",
  ITA_B: "Italian Serie B Cup",
  ITA_B2: "Italian Serie B Cup",
  ESP_ACB: "Copa del Rey",
  ESP_FEB: "Copa Princesa",
  FRA_ELITE: "Leaders Cup",
  FRA_PROB: "Leaders Cup Pro B",
  TUR_BSL: "Turkish Cup",
  TUR_TBL: "TBL Federation Cup",
  GRE_GBL: "Greek Cup",
  GRE_A2: "Greek Elite Cup",
  ABA: "ABA Cup",
  NBL: "NBL Cup",
  CBA: "CBA Cup",
};
function leagueCupName(leagueId) {
  if (isEn()) return LEAGUE_CUP_NAMES_EN[leagueId] || (LEAGUES[leagueId] ? `${LEAGUES[leagueId].name} Cup` : "National Cup");
  return LEAGUE_CUP_NAMES[leagueId] || (LEAGUES[leagueId] ? `Coppa ${LEAGUES[leagueId].name}` : "Coppa Nazionale");
}

/* Configura la Final Eight di metà stagione tra le prime 8 squadre */
function setupNationalCup(p, s) {
  if (s.seasonLeague === "NCAA" || isMinorItaLeague(s.seasonLeague)) return null;
  const cupName = leagueCupName(s.seasonLeague);
  const agg = aggregateSeasonBlocks(s.blocks);
  const standings = simulateLeagueStandings(s.seasonLeague, p.team, agg.wins, agg.losses);

  let qualified = false;
  let rank = 0;
  let qualTeams = [];

  if (standings.conferences) {
    const playerConf = p.team.conference || "Est";
    const myConfTable = playerConf === "Est" ? standings.east : standings.west;
    const oppConfTable = playerConf === "Est" ? standings.west : standings.east;
    const playerRow = myConfTable.find(r => r.isPlayer);
    rank = playerRow ? playerRow.rank : 99;
    qualified = rank <= 4;
    qualTeams = myConfTable.slice(0, 4).map(r => r.team).concat(oppConfTable.slice(0, 4).map(r => r.team));
  } else {
    const playerRow = standings.table.find(r => r.isPlayer);
    rank = playerRow ? playerRow.rank : 99;
    qualified = rank <= 8;
    qualTeams = standings.table.slice(0, 8).map(r => r.team);
  }

  if (!qualified) {
    s.nationalCup = { qualified: false, name: cupName, rank, year: p.year, champion: false };
    pushNews(tr(`${cupName}: ${p.team.name} chiude ${rank}° a metà stagione e resta fuori dalla Final Eight.`, `${cupName}: ${p.team.name} sits #${rank} at midseason and misses the Final Eight.`));
    return null;
  }

  const pool = qualTeams.filter(t => t.name !== p.team.name);
  const rounds = [
    { name: "Quarti di Finale", nameEn: "Quarterfinals", bestOf: 1 },
    { name: "Semifinale", nameEn: "Semifinal", bestOf: 1 },
    { name: "Finale", nameEn: "Final", bestOf: 1 },
  ];
  if (typeof i18nify === "function") i18nify(rounds);
  const cup = {
    name: cupName,
    competition: cupName,
    leagueId: s.seasonLeague,
    qualifiedRank: rank,
    qualTeams,
    pool,
    rounds,
    idx: 0,
    results: [],
    done: false,
    champion: false,
    eliminatedAt: null,
    pendingClutch: null,
  };
  s.nationalCup = cup;
  return cup;
}

function advanceNationalCupRound(interactive = true) {
  const d = player.pendingDecision;
  if (!d || d.type !== "nationalCup" || !d.cup) return null;
  const cup = d.cup, p = player, s = p.pendingSeason;
  if (cup.done || cup.pendingClutch) return null;

  const round = cup.rounds[cup.idx];
  const oppPool = cup.pool.length ? cup.pool : LEAGUES[cup.leagueId].teams.filter(t => t.name !== p.team.name);
  const sorted = [...oppPool].sort((a, b) => getTeamStrength(b, cup.leagueId) - getTeamStrength(a, cup.leagueId));
  const candidates = cup.idx === 2 ? sorted.slice(0, 2) : cup.idx === 1 ? sorted.slice(0, Math.min(4, sorted.length)) : sorted;
  const opponent = choice(candidates);
  const oppIdx = cup.pool.findIndex(t => t.name === opponent.name);
  if (oppIdx >= 0) cup.pool.splice(oppIdx, 1);

  const oppPct = teamStrengthPercentile(getTeamStrength(opponent, cup.leagueId), cup.leagueId);
  const winProb = clubGameWinProb({ leagueId: cup.leagueId, teamStrength: s.teamStrength }, p, oppPct);

  if (interactive && !s.outForPlayoffs && rollChance(CLOSE_GAME_CHANCE)) {
    cup.pendingClutch = { round: round.name, opponent, winProb };
    return null;
  }

  const won = Math.random() < winProb;
  return completeCupRound(cup, round, opponent, won);
}

function completeCupRound(cup, round, opponent, won, clutch = null) {
  const p = player;
  cup.results.push({ round: round.name, opponent, won, bestOf: round.bestOf || 1, clutch });
  if (won) {
    if (cup.idx === cup.rounds.length - 1) {
      cup.done = true;
      cup.champion = true;
      p.trophies.nationalCups = (p.trophies.nationalCups || 0) + 1;
      p.morale = clamp(p.morale + 10, 0, 100);
      p.popularity = clamp(p.popularity + 6, 0, 100);
      p.chemistry = clamp(p.chemistry + 6, 0, 100);
      p.reputation = clamp(p.reputation + 2, 0, 100);
      toast(tr(`🏆 ${p.team.name} vince la ${cup.name}!`, `🏆 ${p.team.name} wins the ${cup.name}!`));
      pushNews(tr(`🏆 Trionfo in ${cup.name}: ${p.team.name} vince la Final Eight e alza la coppa!`, `🏆 Triumph in the ${cup.name}: ${p.team.name} wins the Final Eight and lifts the trophy!`));
      if (typeof queuePopup === "function") queuePopup([tr(`${cup.name}: ${p.team.name} è Campione!`, `${cup.name}: ${p.team.name} Champions!`)], "champion");
    } else {
      cup.idx++;
      toast(tr(`Vittoria in ${round.name}: ${p.team.name} vola in ${cup.rounds[cup.idx].name}!`, `Victory in ${round.name}: ${p.team.name} advances to the ${cup.rounds[cup.idx].name}!`));
    }
  } else {
    cup.done = true;
    cup.champion = false;
    cup.eliminatedAt = round.name;
    p.morale = clamp(p.morale - 3, 0, 100);
    toast(tr(`Eliminati in ${round.name.toLowerCase()} di ${cup.name}.`, `Eliminated in the ${round.name.toLowerCase()} of the ${cup.name}.`));
    pushNews(tr(`${cup.name}: ${p.team.name} eliminata in ${round.name.toLowerCase()} contro ${opponent.name}.`, `${cup.name}: ${p.team.name} eliminated in the ${round.name.toLowerCase()} against ${opponent.name}.`));
  }
  return { round: round.name, opponent, won };
}

function resolveCupClutch(optionId, shotMeterResult = null) {
  const d = player.pendingDecision;
  if (!d || d.type !== "nationalCup" || !d.cup || !d.cup.pendingClutch) return { won: false };
  const cup = d.cup, p = player;
  const pc = cup.pendingClutch;
  const option = CLUTCH_OPTIONS.find(o => o.id === optionId) || bestClutchOption(p, pc.winProb);
  let success;
  if (shotMeterResult && shotMeterResult.success != null) {
    success = shotMeterResult.success;
  } else {
    const prob = clutchChance(p, pc.winProb, option);
    success = Math.random() < prob;
  }
  p.clutch = p.clutch || { made: 0, attempts: 0 };
  p.clutch.attempts++;
  if (success) p.clutch.made++;
  cup.pendingClutch = null;
  const round = cup.rounds[cup.idx];
  return completeCupRound(cup, round, pc.opponent, success, { label: option.label, success });
}

function simulateNationalCup() {
  const d = player.pendingDecision;
  if (!d || d.type !== "nationalCup" || !d.cup) return;
  const cup = d.cup, p = player;
  if (cup.pendingClutch) {
    const pc = cup.pendingClutch;
    cup.pendingClutch = null;
    const option = bestClutchOption(p, pc.winProb);
    const prob = clutchChance(p, pc.winProb, option);
    const success = Math.random() < prob;
    const round = cup.rounds[cup.idx];
    completeCupRound(cup, round, pc.opponent, success, { label: option.label, success });
  }
  while (!cup.done) {
    advanceNationalCupRound(false);
  }
}

function finishNationalCup() {
  continueAfterMidSeason();
}

/* La prossima decisione di metà stagione, se ce n'è una (una per tipo, una sola volta) */
function midSeasonDecision() {
  const s = player.pendingSeason;
  if (!s || s.blocks.length !== MIDSEASON_AFTER_BLOCK || s.blocksOut > 0) return null;
  if (!s.cupDone) {
    s.cupDone = true;
    const cup = setupNationalCup(player, s);
    if (cup) return { type: "nationalCup", cup };
  }
  if (!s.allStarDone) {
    s.allStarDone = true;
    const contests = allStarInvite(player, s);
    if (contests) return { type: "allStarWeekend", contests };
  }
  if (!s.deadlineDone) {
    s.deadlineDone = true;
    const offer = tradeDeadlineOffer(player, s);
    if (offer) return { type: "tradeDeadline", offer };
  }
  return null;
}
function continueAfterMidSeason() {
  player.pendingDecision = midSeasonDecision() || nextSeasonBlockDecision();
  renderGameScreen();
}

function resolveAllStarWeekend(contestId) {
  const d = player.pendingDecision;
  if (!d || d.type !== "allStarWeekend") return;
  const p = player, s = p.pendingSeason;
  if (!contestId) {
    p.stamina = clamp(p.stamina + 8, 0, 100);
    toast(tr("Weekend di riposo: stamina +8 per la volata finale.", "Rest weekend: stamina +8 for the final stretch."));
  } else {
    const c = ALLSTAR_CONTESTS.find(x => x.id === contestId);
    const won = rollChance(allStarWinChance(p, c));
    p.stamina = clamp(p.stamina - 3, 0, 100);
    p.popularity = clamp(p.popularity + (won ? 8 : 3), 0, 100);
    s.allStarContest = { id: c.id, label: c.label, won };
    p.allStarContests = p.allStarContests || [];
    p.allStarContests.push({ year: p.year, id: c.id, label: c.label, won });
    const text = won
      ? tr(`Weekend delle stelle: vinci la ${c.label.toLowerCase()}! Popolarità +8.`, `All-Star Weekend: you win the ${c.label}! Popularity +8.`)
      : tr(`Weekend delle stelle: ${c.label.toLowerCase()}, buona prova ma vince un altro. Popolarità +3.`, `All-Star Weekend: solid showing in the ${c.label}, but someone else takes the crown. Popularity +3.`);
    toast(text);
    pushNews(text);
  }
  continueAfterMidSeason();
}

function resolveTradeDeadline(accept) {
  const d = player.pendingDecision;
  if (!d || d.type !== "tradeDeadline") return;
  const p = player, s = p.pendingSeason, o = d.offer;
  if (accept) {
    const from = p.team;
    p.team = o.team;
    s.team = o.team;
    s.teamStrength = getTeamStrength(o.team, s.seasonLeague);
    s.tradedFrom = from;
    const staff = getTeamStaff(o.team, s.seasonLeague);
    const mi = seasonTeamRole(p, s.seasonLeague, s.teamStrength, { staffShift: staffMinutesShift(p, staff) });
    s.minutesInfo = mi;
    p.currentTeamRole = mi.teamRole;
    if (typeof onTeamChangeRelationships === "function") {
      onTeamChangeRelationships(p);
    } else {
      p.chemistry = clamp(randInt(50, 62), 0, 100);
      p.coachTrust = 50;
      p.starRapport = 50;
    }
    p.morale = clamp(p.morale + (o.kind === "contender" ? 6 : 3), 0, 100);
    const text = tr(
      `Scadenza del mercato: ceduto a ${o.team.name}. Finisci la stagione con la nuova maglia (${teamRoleLabel(mi)}).`,
      `Trade Deadline: traded to ${o.team.name}. You finish the season in your new jersey (${teamRoleLabel(mi)}).`
    );
    toast(text);
    pushNews(text);
  } else {
    p.chemistry = clamp(p.chemistry + 4, 0, 100);
    changeCoachTrust(p, 3);
    pushNews(tr(`Scadenza del mercato: resti a ${p.team.name}. Lo spogliatoio apprezza.`, `Trade Deadline: you stay with ${p.team.name}. The locker room appreciates your loyalty.`));
  }
  continueAfterMidSeason();
}

/* ---------- schermate ---------- */
function renderAllStarWeekend(d, titleEl, subEl, cards) {
  el("off-eyebrow").textContent = tr("METÀ STAGIONE", "MIDSEASON");
  titleEl.textContent = tr("Il weekend delle stelle", "All-Star Weekend");
  subEl.textContent = tr(
    `${LEAGUES[player.pendingSeason.seasonLeague].name}: sei stato invitato alle gare del weekend di metà stagione. Partecipi o ne approfitti per riposare?`,
    `${LEAGUES[player.pendingSeason.seasonLeague].name}: you've been invited to the midseason All-Star events. Do you compete or take the weekend off to rest?`
  );
  const list = d.contests.map(id => ALLSTAR_CONTESTS.find(c => c.id === id));
  cards.innerHTML = list.map((c, i) => offCardHtml({ idx: i, icon: c.icon, title: c.label, subtitle: tr(`Probabilità di vincere: ${allStarWinChance(player, c)}%`, `Win probability: ${allStarWinChance(player, c)}%`), desc: c.desc,
    tags: [{ text: tr("Popolarità", "Popularity"), tone: "blue" }] })).join("")
    + offCardHtml({ idx: "rest", icon: "🛋️", title: tr("Riposare", "Rest"), subtitle: "Stamina +8", desc: tr("Niente gare: qualche giorno lontano dal parquet, per arrivare fresco alla volata finale.", "Skip the events: a few days away from the court to stay fresh for the final stretch.") });
  cards.querySelectorAll(".off-card").forEach(c => c.addEventListener("click", () => resolveAllStarWeekend(c.dataset.idx === "rest" ? null : list[parseInt(c.dataset.idx)].id)));
}

function renderTradeDeadline(d, titleEl, subEl, cards) {
  const o = d.offer;
  el("off-eyebrow").textContent = tr("SCADENZA DEL MERCATO", "TRADE DEADLINE");
  titleEl.textContent = tr(`${o.team.name} ti vuole subito`, `${o.team.name} Wants You Now`);
  subEl.textContent = o.kind === "contender"
    ? tr(`${player.team.name} fatica in classifica. ${o.team.name} punta al titolo e ti vuole per la volata finale e i playoff.`, `${player.team.name} is struggling in the standings. ${o.team.name} is a title contender and wants you for the final push and playoffs.`)
    : tr(`A ${player.team.name} trovi poco spazio. ${o.team.name} è in ricostruzione e ti offre minuti veri da subito.`, `Minutes are scarce at ${player.team.name}. Rebuilding ${o.team.name} offers you real playing time right away.`);
  const strength = Math.round(o.strength * 100);
  cards.innerHTML = offCardHtml({ idx: 0, icon: "✈️", title: tr(`Accetta: vai a ${o.team.name}`, `Accept: Join ${o.team.name}`), subtitle: tr(`Forza della squadra ${strength} · contratto invariato`, `Team strength ${strength} · contract unchanged`),
      desc: tr("Cambi maglia a stagione in corso: chimica, fiducia del coach e intesa con la stella ripartono da capo.", "Switch jerseys midseason: chemistry, coach trust, and star rapport reset."), tags: [{ text: o.kind === "contender" ? tr("Corsa al titolo", "Title Push") : tr("Più minuti", "More Minutes"), tone: "gold" }] })
    + offCardHtml({ idx: 1, icon: "🏠", title: tr(`Resta a ${player.team.name}`, `Stay at ${player.team.name}`), subtitle: tr("Chimica +4 · fiducia del coach +3", "Chemistry +4 · coach trust +3"),
      desc: tr("Rifiuti la cessione e finisci la stagione con i tuoi compagni.", "Turn down the trade and finish the season with your teammates.") });
  cards.querySelectorAll(".off-card").forEach(c => c.addEventListener("click", () => resolveTradeDeadline(c.dataset.idx === "0")));
}

function cupStatusHtml(cup) {
  if (cup.done) {
    return `<div class="ps-status ${cup.champion ? "champ" : "out"}">${cup.champion ? tr("🏆 Trofeo vinto! Campioni di Coppa!", "🏆 Trophy won! Cup Champions!") : tr(`Eliminati in ${cup.eliminatedAt || "torneo"}`, `Eliminated in ${cup.eliminatedAt || "tournament"}`)}</div>`;
  }
  if (cup.pendingClutch) {
    const pc = cup.pendingClutch;
    return `<div class="ps-status next">${pc.round}: ${tr(`partita punto a punto in corso contro ${teamLabel(pc.opponent)}`, `close game underway vs ${teamLabel(pc.opponent)}`)}</div>`;
  }
  const r = cup.rounds[cup.idx];
  return `<div class="ps-status next">${tr(`Prossimo turno: <strong>${r.name}</strong> — gara secca ad eliminazione diretta`, `Next round: <strong>${r.name}</strong> — single-game knockout`)}</div>`;
}

function cupClutchPanelHtml(cup) {
  const pc = cup.pendingClutch;
  return `
    <div class="ps-bracket active phase-current" style="border:1px solid var(--signal); background:var(--signal-soft); padding:16px; margin:14px 0; text-align:center;">
      <div style="font-family:var(--font-display); font-size:22px; font-weight:800; color:var(--signal); text-transform:uppercase; margin-bottom:6px;">
        🔥 ${tr("Gara punto a punto in corso!", "Close Game Underway!")}
      </div>
      <p class="small-muted" style="margin-bottom:12px;">${cup.name} · ${pc.round} ${tr("contro", "vs")} ${teamLabel(pc.opponent)}: ${tr("ultimi secondi sul cronometro.", "final seconds on the clock.")}</p>
      <button type="button" class="btn btn-primary" id="btn-open-cup-clutch-modal" style="margin:0 auto;">
        🏀 ${tr("Gioca l'ultimo possesso", "Play Final Possession")}
      </button>
    </div>`;
}

function renderNationalCup(d, titleEl, subEl, cards, extra) {
  const cup = d.cup, p = player;
  el("off-eyebrow").textContent = tr("METÀ STAGIONE · FINAL EIGHT", "MIDSEASON · FINAL EIGHT");
  titleEl.textContent = `🏆 ${cup.name}`;
  subEl.textContent = tr(
    `${LEAGUES[cup.leagueId].name}: le migliori 8 squadre a metà stagione si affrontano in gare secche a eliminazione diretta. Ti sei qualificato come ${cup.qualifiedRank}°!`,
    `${LEAGUES[cup.leagueId].name}: the top 8 teams at midseason face off in a single-elimination knockout bracket. You qualified as the #${cup.qualifiedRank} seed!`
  );

  cards.className = "off-cards off-cards-single";
  cards.innerHTML = offCardHtml({
    icon: "🏆",
    staticCard: true,
    title: `Final Eight · ${cup.name}`,
    subtitle: tr(`Qualificato con il ${cup.qualifiedRank}° posto a metà stagione`, `Qualified at #${cup.qualifiedRank} at midseason`),
    desc: tr(`Squadre qualificate: ${cup.qualTeams.map(t => t.name === p.team.name ? `<strong>${t.name}</strong>` : t.name).join(", ")}.`, `Qualified teams: ${cup.qualTeams.map(t => t.name === p.team.name ? `<strong>${t.name}</strong>` : t.name).join(", ")}.`),
  });

  extra.className = "off-extra moment-panel";
  extra.innerHTML = `
    <div class="ps-bracket active phase-current">
      <div class="ps-bracket-title">🏆 ${cup.name} · ${tr("Tabellone ad eliminazione diretta", "Knockout Bracket")}</div>
      ${cup.results.map(seriesRowHtml).join("")}
      ${cupStatusHtml(cup)}
    </div>
    ${cup.pendingClutch ? cupClutchPanelHtml(cup) : ""}
    <div class="btn-row" style="justify-content:center;margin-top:12px">
      ${!cup.done && !cup.pendingClutch ? `
        <button class="btn btn-primary" id="btn-cup-play">▶️ ${tr("Gioca", "Play")} ${cup.rounds[cup.idx].name}</button>
        <button class="btn btn-secondary" id="btn-cup-sim">⏩ ${tr("Simula la coppa", "Simulate Cup")}</button>
      ` : ""}
      ${cup.done ? `
        <button class="btn btn-primary btn-lg" id="btn-cup-continue">▶️ ${tr("Continua la stagione", "Continue Season")}</button>
      ` : ""}
    </div>
    ${inSeasonBuyoutHtml(p)}
  `;

  if (el("btn-buyout")) el("btn-buyout").addEventListener("click", buyContractOut);
  if (el("btn-cup-play")) {
    el("btn-cup-play").addEventListener("click", () => {
      advanceNationalCupRound();
      renderGameScreen();
    });
  }
  if (el("btn-cup-sim")) {
    el("btn-cup-sim").addEventListener("click", () => {
      simulateNationalCup();
      renderGameScreen();
    });
  }
  if (el("btn-cup-continue")) {
    el("btn-cup-continue").addEventListener("click", () => {
      finishNationalCup();
    });
  }
  if (cup.pendingClutch) {
    const btn = extra.querySelector("#btn-open-cup-clutch-modal");
    const pc = cup.pendingClutch;
    const openModal = () => {
      const oppScore = 98;
      const myScore = 97;
      const roundLabel = `${cup.name} · ${pc.round} (${tr("Gara secca", "Single Elimination")})`;
      const options = CLUTCH_OPTIONS.map(o => ({
        id: o.id,
        icon: o.icon,
        label: o.label,
        desc: o.desc,
        attrText: o.attrLabel ? o.attrLabel(player) : "",
        pct: Math.round(clutchChance(player, pc.winProb, o) * 100),
      }));
      if (typeof renderClutchModal === "function") {
        renderClutchModal({
          roundLabel,
          oppName: pc.opponent.name,
          oppScore,
          myName: player.team.name,
          myScore,
          timer: "00:04.2",
          narrative: tr(
            `Finale di Coppa contro ${pc.opponent.name}: rimessa d'attacco negli ultimi secondi, siete <strong>sotto di 1 punto</strong> e la palla è tua. Come decidi la partita?`,
            `Cup game vs ${pc.opponent.name}: offensive inbound in the final seconds, you are <strong>down by 1 point</strong> and the ball is in your hands. How do you decide the game?`
          ),
          options,
          onSelectOutcome: (optionId, showOutcome) => {
            const option = CLUTCH_OPTIONS.find(o => o.id === optionId);
            const optLabel = option ? option.label : tr("Azione clutch", "Clutch play");
            const baseChance = Math.round(clutchChance(player, pc.winProb, option) * 100);
            const mainBody = document.querySelector("#cm-main-body");

            const executePlay = (meterRes) => {
              const res = resolveCupClutch(optionId, meterRes);
              showOutcome({
                success: res.won,
                label: `${option.label} ${meterRes && meterRes.timing === "perfect" ? tr("🟢 (Perfetto!)", "🟢 (Perfect!)") : ""}`,
                game: pc.opponent.name,
                newScore: res.won ? 99 : 97,
                onDone: () => renderGameScreen(),
              });
            };

            const executeSkip = () => {
              const res = resolveCupClutch(optionId, null);
              showOutcome({
                success: res.won,
                label: option.label,
                game: pc.opponent.name,
                newScore: res.won ? 99 : 97,
                onDone: () => renderGameScreen(),
              });
            };

            if (mainBody) {
              if (optionId === "drive" && typeof renderTimingCircleWidget === "function") {
                const attrVal = Math.round((player.attrs.finishing + player.attrs.athleticism) / 2);
                renderTimingCircleWidget(mainBody, {
                  optionLabel: optLabel,
                  attributeValue: attrVal,
                  baseWinProb: baseChance,
                  onRelease: executePlay,
                  onSkip: executeSkip,
                });
                return;
              }
              if (optionId === "pass" && typeof renderCourtVisionWidget === "function") {
                renderCourtVisionWidget(mainBody, {
                  optionLabel: optLabel,
                  attributeValue: player.attrs.playmaking,
                  iqValue: Math.round((player.attrs.playmaking + player.attrs.defense) / 2),
                  baseWinProb: baseChance,
                  onRelease: executePlay,
                  onSkip: executeSkip,
                });
                return;
              }
              if (typeof renderShotMeterWidget === "function") {
                renderShotMeterWidget(mainBody, {
                  optionLabel: optLabel,
                  attributeValue: player.attrs.shooting,
                  baseWinProb: baseChance,
                  onRelease: executePlay,
                  onSkip: executeSkip,
                });
                return;
              }
            }
            executeSkip();
          },
          onSelect: (optionId) => {
            resolveCupClutch(optionId);
            renderGameScreen();
          },
        });
      }
    };
    if (btn) btn.addEventListener("click", openModal);
    openModal();
  }
}

