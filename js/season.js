"use strict";

/* ================================================================
   STAGIONE REGOLARE A TRATTI — la stagione si gioca in 3 tratti. Prima di ognuno si sceglie
   il carico di lavoro e, a volte, si affronta una situazione con due opzioni. Statistiche,
   stamina, infortuni e vittorie vengono simulati tratto per tratto e poi aggregati: il resto
   della stagione (classifica, playoff, premi) parte dal risultato aggregato.
   ================================================================ */
const SEASON_BLOCKS = [
  { id: "early", name: "Inizio Stagione", icon: "🍂", share: 0.35 },
  { id: "mid", name: "Metà Stagione", icon: "⭐", share: 0.35, note: "Pausa per l'All-Star Game" },
  { id: "late", name: "Volata Finale", icon: "🏁", share: 0.30 },
];

/* Carico di lavoro scelto per un tratto: minuti in campo, consumo di stamina, rischio di
   infortunio, piccolo effetto sul rendimento della squadra (quando si è in campo) e usura
   del fisico (wear: punti di fragilità, che restano anche nelle stagioni successive) */
const WORKLOADS = [
  { id: "push", icon: "🔥", label: "Carico alto", desc: "Più minuti e responsabilità: più statistiche, ma il fisico si usura, la stamina cala e il rischio infortuni sale.", mpg: 3, drain: 1.6, injury: 1.6, win: 0.01, wear: 2 },
  { id: "normal", icon: "⚖️", label: "Carico normale", desc: "Segui le rotazioni del coach, senza strappi.", mpg: 0, drain: 1, injury: 1, win: 0, wear: 0 },
  { id: "rest", icon: "🧊", label: "Carico ridotto", desc: "Meno minuti, ma stamina preservata per i playoff, rischio infortuni più basso e fisico che recupera.", mpg: -3, drain: 0.6, injury: 0.6, win: -0.015, wear: -1 },
];
function getWorkload(id) { return WORKLOADS.find(w => w.id === id) || WORKLOADS[1]; }

/* Situazioni che possono capitare prima di un tratto. Lo stato salva solo id e opzione scelta;
   gli effetti stanno qui (apply), così i salvataggi restano dati puri. apply può modificare i
   parametri del tratto (b) e il giocatore, e restituisce una breve nota per il riepilogo.
   L'ultima opzione di ogni situazione è quella prudente, usata da "Simula il resto". */
const SEASON_SITUATIONS = [
  {
    id: "knee", icon: "🦵", title: "Fastidio al ginocchio",
    desc: "Da qualche giorno il ginocchio fa male dopo ogni allenamento. Lo staff medico lascia a te la scelta.",
    options: [
      { id: "play", label: "Gioca sul dolore", desc: "Non salti partite, ma il rischio di infortunio in questo tratto sale parecchio." },
      { id: "rest", label: "Fermati qualche partita", desc: "Salti circa un quarto delle partite del tratto, ma recuperi energie." },
    ],
    apply(p, optionId, b) {
      if (optionId === "play") { b.injuryMult *= 1.8; p.fragility = clamp(p.fragility + 2, 0, 100); return "Hai stretto i denti giocando sul dolore."; }
      b.missedFrac += 0.25; p.stamina = clamp(p.stamina + 8, 0, 100); return "Ti sei fermato qualche partita per recuperare.";
    },
  },
  {
    id: "slump", icon: "📉", title: "Striscia negativa",
    desc: "La squadra ha perso diverse partite di fila e nello spogliatoio c'è tensione.",
    options: [
      { id: "speak", label: "Parla alla squadra", desc: "Metti la faccia davanti a tutti: può ricompattare il gruppo, o ritorcersi contro." },
      { id: "quiet", label: "Lascia fare al coach", desc: "Nessun rischio: la situazione si risolve da sé, più lentamente." },
    ],
    apply(p, optionId, b) {
      if (optionId === "quiet") return "Hai lasciato che fosse il coach a gestire il momento.";
      if (rollChance(55 + (p.popularity - 50) * 0.3)) {
        p.chemistry = clamp(p.chemistry + 8, 0, 100); p.morale = clamp(p.morale + 5, 0, 100); b.winBonus += 0.05;
        return "Il tuo discorso ha ricompattato lo spogliatoio: la squadra ha reagito.";
      }
      p.chemistry = clamp(p.chemistry - 7, 0, 100); b.winBonus -= 0.02;
      return "Il discorso non è piaciuto a tutti: nello spogliatoio restano attriti.";
    },
  },
  {
    id: "spotlight", icon: "📺", title: "Partite in diretta nazionale",
    desc: "Nelle prossime settimane la tua squadra è sempre in prima serata: tutti gli occhi sono puntati su di te.",
    options: [
      { id: "star", label: "Prenditi la scena", desc: "Più tiri e più punti, qualche pallone perso in più. La popolarità sale." },
      { id: "team", label: "Gioca per la squadra", desc: "Più assist e più chimica con i compagni." },
    ],
    apply(p, optionId, b) {
      if (optionId === "star") { b.statMult.pts *= 1.1; b.statMult.tov *= 1.15; p.popularity = clamp(p.popularity + 6, 0, 100); return "Ti sei preso la scena in prima serata."; }
      b.statMult.ast *= 1.12; p.chemistry = clamp(p.chemistry + 4, 0, 100); return "Hai messo i compagni al centro della scena.";
    },
  },
];
SEASON_SITUATIONS.push({
  id: "starFriction", icon: "⭐", title: "Frizioni con la stella",
  desc: "In allenamento volano parole grosse con il leader della squadra: la tensione si sente in campo.",
  options: [
    { id: "talk", label: "Chiarisci a quattr'occhi", desc: "Un confronto diretto: può nascere un'intesa vera, o rompersi del tutto." },
    { id: "let", label: "Lascia correre", desc: "Nessun rischio, ma la freddezza resta." },
  ],
  apply(p, optionId, b) {
    if (optionId === "let") { p.starRapport = clamp(starRapportOf(p) - 5, 0, 100); return "Hai lasciato correre: tra voi resta freddezza."; }
    if (rollChance(50 + (reputationOf(p) - 50) * 0.5)) {
      p.starRapport = clamp(starRapportOf(p) + 15, 0, 100); b.winBonus += 0.02;
      return "Il chiarimento ha funzionato: ora in campo vi cercate.";
    }
    p.starRapport = clamp(starRapportOf(p) - 10, 0, 100); p.chemistry = clamp(p.chemistry - 4, 0, 100);
    return "Il confronto è degenerato: lo spogliatoio si è diviso.";
  },
});
function getSituation(id) { return SEASON_SITUATIONS.find(x => x.id === id) || null; }
function safeSituationOption(situation) { return situation.options[situation.options.length - 1].id; }

/* Rischio d'infortunio (%) per un intero tratto a carico normale: stamina bassa, età e fragilità */
function blockInjuryRisk(p) {
  const seasonRisk = clamp((100 - p.stamina) * 0.35 + Math.max(0, p.age - 32) * 1.5 + p.fragility * 0.3, 2, 55);
  return seasonRisk * 0.36 * getDifficulty(p).injury * getBodyType(p).injury;
}
function injuryRiskLabel(pct) {
  if (pct < 5) return { label: "Basso", tone: "green" };
  if (pct < 11) return { label: "Medio", tone: "gold" };
  return { label: "Alto", tone: "red" };
}

/* Somma i tratti già giocati in una statline stagionale pesata sulle partite giocate */
function aggregateSeasonBlocks(blocks) {
  const gp = blocks.reduce((t, b) => t + b.gp, 0);
  const games = blocks.reduce((t, b) => t + b.games, 0);
  const wins = blocks.reduce((t, b) => t + b.wins, 0);
  const losses = blocks.reduce((t, b) => t + b.losses, 0);
  const avg = k => (gp > 0 ? round1(blocks.reduce((t, b) => t + b.stats[k] * b.gp, 0) / gp) : 0);
  const stats = { gp, games };
  ["mpg", "pts", "reb", "ast", "stl", "blk", "tov", "fga", "fgm", "tpa", "tpm", "fta", "ftm"].forEach(k => { stats[k] = avg(k); });
  stats.fg = round1(stats.fga > 0 ? (stats.fgm / stats.fga) * 100 : 0);
  stats.tp = round1(stats.tpa > 0 ? (stats.tpm / stats.tpa) * 100 : 0);
  stats.ft = round1(stats.fta > 0 ? (stats.ftm / stats.fta) * 100 : 0);
  return { stats, wins, losses, gp, games };
}

/* Prepara la decisione per il prossimo tratto, con una situazione ogni tanto */
function nextSeasonBlockDecision() {
  const s = player.pendingSeason;
  let situation = null;
  // fuori per infortunio: il tratto si gioca senza di te, niente situazioni né partite chiave
  if (s.blocksOut > 0) return { type: "seasonBlock", blockIdx: s.blocks.length, options: WORKLOADS.map(w => w.id), situation: null, situationChoice: null, keyGame: null, injuredOut: true };
  // il primo tratto in un paese nuovo porta sempre con sé la nostalgia di casa
  if (player.adaptation && !player.adaptation.asked) { player.adaptation.asked = true; situation = "homesick"; }
  else if (isCaptain(player) && rollChance(15)) situation = "lockerRoom";
  else if (rollChance(35)) situation = choice(SEASON_SITUATIONS.filter(x => !x.conditional)).id;
  return { type: "seasonBlock", blockIdx: s.blocks.length, options: WORKLOADS.map(w => w.id), situation, situationChoice: null, keyGame: pickKeyGame(player, s), keyGameChoice: null };
}

function advanceSeasonContinue() {
  const seasonFocusResult = player.pendingSeasonFocusResult || null;
  player.pendingSeasonFocusResult = null;

  driftTeamStrengths();
  updateAdaptationForSeason(player);
  const seasonLeague = player.league;
  const teamStrength = getTeamStrength(player.team, seasonLeague);
  // il minutaggio risente degli imprevisti della scorsa estate (panchina forzata / promozione)
  const starterClause = !!(player.contract && player.contract.clauses && player.contract.clauses.starter && player.contract.yearsRemaining > 0);
  const staff = getTeamStaff(player.team, seasonLeague);
  // il ruolo in squadra (promesso dal contratto o naturale) decide i minuti
  const minutesInfo = seasonTeamRole(player, seasonLeague, teamStrength, { ...player.seasonModifiers, starter: starterClause, staffShift: staffMinutesShift(player, staff) });
  player.currentTeamRole = minutesInfo.teamRole;
  if (minutesInfo.note) pushNews(minutesInfo.note);

  player.pendingSeason = {
    phase: "blocks", seasonLeague, teamStrength, minutesInfo, games: seasonLength(seasonLeague), blocks: [],
    seasonFocus: seasonFocusResult, team: player.team, age: player.age,
    goals: buildSeasonGoals(player, seasonLeague, teamStrength, minutesInfo),
  };
  // a volte la società prende un concorrente nel tuo ruolo: prima dei tratti ci si gioca il posto
  player.pendingSeason.roleBattle = maybeRoleBattle(player, player.pendingSeason, starterClause);
  player.pendingDecision = player.pendingSeason.roleBattle ? { type: "roleBattle" } : nextSeasonBlockDecision();
  renderGameScreen();
}

/* La situazione del tratto (se c'è) va risolta prima di scegliere il carico di lavoro */
function chooseSeasonSituation(optionId) {
  const d = player.pendingDecision;
  if (!d || d.type !== "seasonBlock" || !d.situation) return;
  d.situationChoice = optionId;
  renderGameScreen();
}

/* Gioca il prossimo tratto; restituisce true se con questo si è chiusa la stagione regolare */
function playSeasonBlock(workloadId, situationOptionId) {
  const s = player.pendingSeason;
  const d = player.pendingDecision;
  const def = SEASON_BLOCKS[s.blocks.length];
  const workload = getWorkload(workloadId);

  // le partite del tratto: l'ultimo prende il resto, così la somma torna sempre al totale
  const isLast = s.blocks.length === SEASON_BLOCKS.length - 1;
  const played = s.blocks.reduce((t, b) => t + b.games, 0);
  const games = isLast ? s.games - played : Math.round(s.games * def.share);

  const b = { injuryMult: workload.injury, missedFrac: 0, winBonus: workload.win, statMult: { pts: 1, ast: 1, tov: 1 } };
  // dopo un infortunio grave: tratti saltati per intero, o metà tratto dopo la terapia conservativa
  let out = null;
  if (s.blocksOut > 0) { b.missedFrac = 1; s.blocksOut--; out = "full"; }
  else if (s.partialOut) { b.missedFrac += s.partialOut; s.partialOut = 0; out = "partial"; }
  let situationNote = null;
  const situation = d && d.situation ? getSituation(d.situation) : null;
  if (situation) {
    const optionId = situationOptionId || safeSituationOption(situation);
    const option = situation.options.find(o => o.id === optionId);
    situationNote = { id: situation.id, title: situation.title, icon: situation.icon, optionLabel: option ? option.label : "", text: situation.apply(player, optionId, b) };
  }

  // chi ha perso la sfida per il posto gioca meno finché non se lo riprende
  const battle = s.roleBattle;
  // gli ibridi soffrono meno la concorrenza (il coach li sposta nell'altro ruolo) e dalla panchina trovano qualche minuto in più
  const hybrid = !!secondaryRoleOf(player);
  const battleMalus = battle && battle.status === "behind" ? ROLE_BATTLE_MINUTES - (hybrid ? 2 : 0) : 0;
  const mentorMalus = menteeActive(player) ? MENTOR_MINUTES : 0; // minuti lasciati all'allievo
  const hybridBonus = hybrid && s.minutesInfo.mpg < 28 ? 1.5 : 0;
  const mpg = clamp(s.minutesInfo.mpg + workload.mpg + hybridBonus - battleMalus - mentorMalus, 6, 40);
  const stats = simulateStatline(player, { mpg }, s.seasonLeague);
  Object.entries(b.statMult).forEach(([k, m]) => { stats[k] = round1(stats[k] * m); });
  const staffMult = staffStatMultipliers(player, getTeamStaff(s.team, s.seasonLeague));
  Object.entries(staffMult).forEach(([k, m]) => { stats[k] = round1(stats[k] * m); });
  // lontano da casa si rende un po' meno finché non ci si ambienta
  const adaptMult = adaptationStatMult(player);
  if (adaptMult < 1) ["pts", "reb", "ast", "stl", "blk"].forEach(k => { stats[k] = round1(stats[k] * adaptMult); });
  changeCoachTrust(player, workload.id === "push" ? 2 : workload.id === "rest" ? -2 : 0);

  // infortunio nel tratto: si saltano partite, le medie a partita restano quelle reali
  let injury = null;
  if (out !== "full" && rollChance(blockInjuryRisk(player) * b.injuryMult)) {
    // una parte degli infortuni è grave: si decide subito dopo il tratto come curarsi (vedi injuries.js)
    const serious = !s.seriousInjury && rollChance(seriousInjuryChance(player));
    const frac = serious ? 0.6 : randFloat(0.3, 0.9, 2);
    b.missedFrac += frac;
    player.fragility = clamp(player.fragility + (serious ? 8 : randInt(3, 8)), 0, 100);
    injury = { missedFrac: frac, serious };
  }
  const missed = clamp(b.missedFrac, 0, out === "full" ? 1 : 0.95);
  const gp = out === "full" ? 0 : Math.max(games > 0 ? 1 : 0, Math.round(games * (1 - missed)));

  player.fragility = clamp(player.fragility + workload.wear, 0, 100);
  const drain = staminaDrain(player, mpg) * def.share * workload.drain * (gp / Math.max(1, games)) + (injury ? randInt(5, 15) : 0);
  player.stamina = clamp(Math.round(player.stamina - drain), 0, 100);

  // vittorie: con il giocatore in campo conta il suo overall, senza di lui un sostituto qualunque
  const rapport = starRapportOf(player);
  const rapportBonus = rapport >= 70 ? 0.02 : rapport <= 30 ? -0.02 : 0;
  const diffWin = getDifficulty(player).win;
  const withPct = clamp(regularSeasonWinPct(player.overall, s.teamStrength, s.seasonLeague) + b.winBonus + rapportBonus + diffWin, 0.05, 0.92);
  const withoutPct = clamp(regularSeasonWinPct(60, s.teamStrength, s.seasonLeague) + diffWin, 0.05, 0.92);
  let wins = clamp(Math.round(gp * withPct + (games - gp) * withoutPct), 0, games);
  // partita chiave: l'ultimo possesso vale una vittoria in più o in meno
  let keyGame = null;
  if (d && d.keyGame && gp > 0) {
    keyGame = playKeyGame(player, s, d.keyGame, d.keyGameChoice);
    wins = clamp(wins + (keyGame.success ? 1 : -1), 0, games);
  }

  const block = { id: def.id, name: def.name, icon: def.icon, games, gp, wins, losses: games - wins, stats, workload: workload.id, injury, situation: situationNote, behind: battleMalus > 0, keyGame, out };
  s.blocks.push(block);
  if (injury && !injury.serious) toast(`🩹 Infortunio in ${def.name}: salti ${games - gp} partite su ${games}.`);
  block.adapt = progressAdaptation(player);
  block.regained = roleBattleAfterBlock(player, battle, block);

  if (injury && injury.serious) {
    s.seriousInjury = { label: choice(SERIOUS_INJURIES), block: def.name, choice: null, relapse: false };
    player.pendingDecision = { type: "injuryChoice" };
    return false;
  }

  if (s.blocks.length < SEASON_BLOCKS.length) {
    // a metà stagione: weekend delle stelle e scadenza del mercato (vedi midseason.js)
    player.pendingDecision = midSeasonDecision() || nextSeasonBlockDecision();
    return false;
  }
  closeRegularSeason();
  return true;
}

function resolveSeasonBlock(workloadId, situationOptionId) {
  const d = player.pendingDecision;
  if (!d || d.type !== "seasonBlock") return;
  const optionId = situationOptionId || d.situationChoice;
  if (d.situation && !optionId) { toast("⚠️ Prima scegli come affrontare la situazione."); return; }
  if (d.keyGame && !d.keyGameChoice) { toast("⚠️ Prima scegli come giocare l'ultimo possesso della partita chiave."); return; }
  if (!playSeasonBlock(workloadId, optionId)) renderGameScreen();
}

/* Chiude i tratti rimanenti con carico normale e l'opzione prudente in ogni situazione */
function simulateRestOfSeason() {
  let guard = 0;
  while (player.pendingDecision && player.pendingDecision.type === "seasonBlock" && guard++ < SEASON_BLOCKS.length) {
    const d = player.pendingDecision;
    const situation = d.situation ? getSituation(d.situation) : null;
    const optionId = d.situationChoice || (situation ? safeSituationOption(situation) : null);
    // la partita chiave, se non scelta, si gioca con l'azione più probabile (vedi playKeyGame)
    if (playSeasonBlock("normal", optionId)) return;
  }
  renderGameScreen();
}

/* Fine della stagione regolare: aggregazione dei tratti, classifica e tabelloni della postseason.
   Da qui in poi pendingSeason ha la stessa forma di sempre (stats, regular, standings...). */
function closeRegularSeason() {
  const s = player.pendingSeason;
  const { seasonLeague, teamStrength, minutesInfo, seasonFocus } = s;
  const agg = aggregateSeasonBlocks(s.blocks);
  const stats = agg.stats;
  const gpShare = agg.games ? agg.gp / agg.games : 1;

  const injuryInfo = s.blocks.some(b => b.injury) ? {
    text: `🩹 Stagione condizionata dagli infortuni: ${agg.games - agg.gp} partite saltate su ${agg.games}.`,
    missedPct: round1(1 - gpShare),
  } : null;

  const regular = { wins: agg.wins, losses: agg.losses, winPct: agg.games ? agg.wins / agg.games : 0, playoffResult: null, champion: false };
  // il rendimento conta anche la presenza: saltare metà stagione frena la crescita
  const performanceScore = clamp((stats.pts/25 + stats.ast/8 + stats.reb/10)/2.2, 0, 1) * (0.5 + 0.5 * gpShare);
  const event = generateRandomEvent(player);

  // classifica completa della lega: da qui derivano playoff, seed e zone promozione/retrocessione.
  // In NBA la classifica è divisa in Conference Est/Ovest, come nella realtà.
  const standings = simulateLeagueStandings(seasonLeague, player.team, regular.wins, regular.losses);
  const playerRow = findPlayerStandingsRow(standings);
  const conference = seasonLeague === "NBA" ? player.team.conference : null;
  const confTable = playerConferenceTable(standings, conference);
  const playoffCutoff = Math.min(8, confTable.length);
  regular.conference = conference;
  regular.rank = playerRow.rank;
  regular.totalTeams = confTable.length;
  regular.playoffCutoff = playoffCutoff;
  regular.madePlayoffs = regular.rank <= playoffCutoff;
  regular.relegationZone = !!LEAGUES[seasonLeague].relegatesTo && regular.rank > confTable.length - 2;
  regular.promotionZone = !!LEAGUES[seasonLeague].promotesTo && regular.rank <= playoffCutoff;

  // dati della stagione in corso, congelati fino alla chiusura della postseason
  player.pendingSeason = {
    seasonLeague, teamStrength, minutesInfo: { label: minutesInfo.label, mpg: stats.mpg, teamRole: minutesInfo.teamRole || null, promised: minutesInfo.promised || null }, stats, regular, performanceScore, event, standings, injuryInfo,
    seasonFocus, team: s.team, age: s.age, blocks: s.blocks, nationalPlanned: true, goals: s.goals, roleBattle: s.roleBattle || null,
    seriousInjury: s.seriousInjury || null, outForPlayoffs: !!s.outForPlayoffs,
    tradedFrom: s.tradedFrom || null, allStarContest: s.allStarContest || null,
  };

  // si costruiscono i tabelloni da giocare: campionato (se qualificati) ed Europa (se iscritti)
  const brackets = [];
  if (regular.madePlayoffs) {
    brackets.push(buildBracket("domestic", LEAGUES[seasonLeague].name, seasonLeague, teamStrength, regular.rank, conference));
  }
  if (player.team.euro && LEAGUES[seasonLeague].continent === "Europa") {
    const comp = player.team.euro === "EL" ? "EuroLeague" : "EuroCup";
    brackets.push(buildBracket("continental", comp, seasonLeague, teamStrength, regular.rank));
  }
  // Mondiale/Europei: ogni 4 anni ciascuno, sfalsati di 2 anni, mai nella stessa estate
  // chi è fuori per infortunio non risponde alla convocazione
  if (nationalTeamEligible(player) && !s.outForPlayoffs) {
    if (isWorldCupYear(player.year)) brackets.push(buildNationalBracket("world", "Mondiale FIBA"));
    else if (isEurobasketYear(player.year) && EUROPEAN_NATIONALITIES.includes(player.nationality)) brackets.push(buildNationalBracket("euro", "EuroBasket"));
  }

  if (brackets.length) {
    player.postseason = { brackets, idx: 0 };
    player.pendingDecision = { type: "postseason" };
    renderGameScreen();
    return;
  }

  player.pendingDecision = null;
  finalizeSeason();
}

/* Chiude la stagione: trofei, imprevisto estivo (interattivo), progressione, storico, mercato.
   Se estrae un imprevisto "a rischio" si ferma qui e attende la scelta del giocatore
   (vedi resolveOffseasonChoice); altrimenti prosegue subito con finalizeSeasonContinue. */
function finalizeSeason() {
  const s = player.pendingSeason;
  if (!s) return;
  const { seasonLeague, minutesInfo, stats, regular, performanceScore, event, standings, injuryInfo, seasonFocus } = s;

  const ps = player.postseason;
  const domestic = ps && ps.brackets.find(b => b.kind === "domestic");
  const continentalBracket = ps && ps.brackets.find(b => b.kind === "continental");
  const nationalBracket = ps && ps.brackets.find(b => b.kind === "national");

  const teamResult = {
    wins: regular.wins, losses: regular.losses,
    madePlayoffs: regular.madePlayoffs,
    playoffResult: domestic ? bracketOutcomeLabel(domestic) : null,
    champion: !!(domestic && domestic.champion),
  };

  let continental = null;
  if (continentalBracket) {
    continental = {
      competition: continentalBracket.competition,
      result: bracketOutcomeLabel(continentalBracket),
      champion: continentalBracket.champion,
      rounds: continentalBracket.results,
    };
    if (continentalBracket.champion) {
      if (continentalBracket.competition === "EuroLeague") player.trophies.euroleague++;
      else player.trophies.eurocup++;
    }
  }

  // i premi individuali dipendono anche dal cammino della squadra
  const awards = rollAwards(player, stats, teamResult, {
    leagueId: seasonLeague, rank: regular.rank, totalTeams: regular.totalTeams, minutesLabel: minutesInfo.label,
    gpShare: stats.games ? stats.gp / stats.games : 1,
  });

  // incassi della stagione (ingaggio + sponsor) prima degli imprevisti estivi
  const agent = getAgent(player);
  const seasonEarnings = roundMoney(((player.contract && player.contract.salaryPerYear) || 0) * (1 - agent.commission) + player.sponsorIncome * agent.sponsor);
  player.wealth = roundMoney(player.wealth + seasonEarnings);
  const investments = settleInvestments(player);

  // OFFSEASON: si azzerano gli effetti della scorsa estate, poi si estrae il nuovo imprevisto
  player.seasonModifiers = { benched: false, minutesPenalty: 0, forcedTransfer: false };
  driftOffCourtMeters(player, teamResult, performanceScore);

  const ctx = {
    seasonLeague, minutesInfo, stats, regular, performanceScore, event, standings, teamResult, continental, awards,
    seasonEarnings, playoffRounds: domestic ? domestic.results : null, injuryInfo, seasonFocus,
    nationalHandled: !!s.nationalPlanned, nationalComp: nationalBracket ? nationalCompFromBracket(nationalBracket) : null,
    investments, goals: s.goals || null, roleBattle: s.roleBattle || null, seriousInjury: s.seriousInjury || null,
  };
  const ev = pickOffseasonEvent(player);

  if (ev && ev.chance != null) {
    // imprevisto a rischio: si sospende la chiusura stagione in attesa della scelta del giocatore
    player.pendingOffseasonEvent = ev;
    player.pendingFinalizeCtx = ctx;
    player.pendingDecision = { type: "offseasonChoice", event: ev };
    renderGameScreen();
    return;
  }

  const offseason = ev ? resolveDeterministicEvent(ev, player) : null;
  finalizeSeasonContinue(offseason, ctx);
}

/* Risoluzione della scelta di rischio sull'imprevisto estivo: l'esito viene calcolato subito,
   ma mostrato solo dopo una breve animazione di rivelazione (vedi renderOffseasonRevealPanel) —
   la chiusura vera e propria della stagione riprende solo quando il giocatore preme "Continua". */
function resolveOffseasonChoice(takeRisk) {
  const ev = player.pendingOffseasonEvent;
  const ctx = player.pendingFinalizeCtx;
  if (!ev || !ctx) return;
  const offseason = takeRisk ? takeOffseasonRisk(ev, player) : declineOffseasonRisk(ev, player);
  player.pendingOffseasonEvent = null;
  player.pendingFinalizeCtx = null;
  player.pendingOffseasonReveal = { offseason, ctx, takeRisk };
  player.pendingDecision = { type: "offseasonReveal" };
  renderGameScreen();
}

/* Chiamata dal pulsante "Continua" del reveal: solo qui la stagione viene davvero chiusa */
function confirmOffseasonReveal() {
  const rv = player.pendingOffseasonReveal;
  if (!rv) return;
  player.pendingOffseasonReveal = null;
  player.pendingDecision = null;
  finalizeSeasonContinue(rv.offseason, rv.ctx);
}

function finalizeSeasonContinue(offseason, ctx) {
  const { seasonLeague, minutesInfo, stats, regular, performanceScore, event, standings, teamResult, continental, awards, seasonEarnings, playoffRounds, injuryInfo, seasonFocus } = ctx;

  // progressione annuale, dopo che l'imprevisto estivo ha già inciso su overall e attributi
  const ovrDelta = progressOverall(player, performanceScore);

  awards.forEach(a => {
    if (a.startsWith("MVP")) player.trophies.mvp++;
    else if (a === "Difensore dell'Anno") player.trophies.dpoy++;
    else if (a.startsWith("All-Star")) player.trophies.allstar++;
    else if (a.startsWith("Miglior Quintetto")) player.trophies.bestFive++;
    else if (a.startsWith("Miglior Giovane")) player.trophies.bestYoung++;
    else if (a === "Rookie dell'Anno") player.trophies.roy++;
    else if (a === "Finals MVP") player.trophies.finalsMvp++;
  });
  // bonus a obiettivi previsti dal contratto
  let contractBonus = 0;
  if (player.contract && player.contract.clauses && player.contract.clauses.bonus && player.contract.salaryPerYear) {
    const goals = awards.filter(a => a.startsWith("All-Star") || a.startsWith("MVP")).length + (teamResult.champion ? 1 : 0);
    contractBonus = roundMoney(player.contract.salaryPerYear * 0.2 * goals * (1 - getAgent(player).commission));
    player.wealth = roundMoney(player.wealth + contractBonus);
  }
  const reputationNotes = seasonReputationUpdate(player, awards, teamResult, offseason);
  const staffNotes = staffSeasonUpdate(player, player.team, seasonLeague, performanceScore, teamResult.wins / Math.max(1, teamResult.wins + teamResult.losses));

  if (teamResult.champion && teamStrengthRegistry[player.team.name] != null) {
    teamStrengthRegistry[player.team.name] = Math.round((teamStrengthRegistry[player.team.name] - 0.04) * 100) / 100;
    pushNews(`💸 Dopo il titolo ${player.team.name} perde qualche pezzo per il tetto salariale.`);
  }
  if (teamResult.champion) {
    if (player.league === "NBA") player.trophies.rings++;
    else if (LEAGUES[player.league].continent !== "USA") player.trophies.domesticTitles++;
  }

  // Mondiale/Europei: con le fasi separate il torneo è già stato giocato (ctx.nationalComp);
  // le stagioni iniziate con una versione precedente lo simulano qui come una volta
  let nationalComp = null;
  if (ctx.nationalHandled) {
    nationalComp = ctx.nationalComp;
    if (nationalComp && nationalComp.medal) {
      player.trophies.medals++;
      if (nationalComp.champion) {
        if (nationalComp.kind === "world") player.trophies.worldCupTitles++;
        else player.trophies.eurobasketTitles++;
      }
    }
  } else if (nationalTeamEligible(player)) {
    if (isWorldCupYear(player.year)) {
      nationalComp = { kind: "world", name: "Mondiale FIBA", ...simulateNationalTournament(player) };
    } else if (isEurobasketYear(player.year) && EUROPEAN_NATIONALITIES.includes(player.nationality)) {
      nationalComp = { kind: "euro", name: "EuroBasket", ...simulateNationalTournament(player) };
    }
    if (nationalComp) {
      if (nationalComp.champion) {
        player.trophies.medals++;
        if (nationalComp.kind === "world") player.trophies.worldCupTitles++;
        else player.trophies.eurobasketTitles++;
      } else if (nationalComp.medal) {
        player.trophies.medals++;
      }
    }
  }

  const record = {
    age: player.age, year: player.year, team: player.team, league: seasonLeague,
    pts: stats.pts, reb: stats.reb, ast: stats.ast, stl: stats.stl, blk: stats.blk, tov: stats.tov,
    fg: stats.fg, tp: stats.tp, ft: stats.ft, mpg: stats.mpg,
    gp: stats.gp != null ? stats.gp : teamResult.wins + teamResult.losses, games: stats.games != null ? stats.games : teamResult.wins + teamResult.losses,
    fga: stats.fga, fgm: stats.fgm, tpa: stats.tpa, tpm: stats.tpm, fta: stats.fta, ftm: stats.ftm,
    overall: player.overall, ovrDelta,
    wins: teamResult.wins, losses: teamResult.losses,
    playoffResult: teamResult.playoffResult, champion: teamResult.champion,
    playoffRounds,
    continental,
    awards, event, injury: injuryInfo, seasonFocus, roleLabel: minutesInfo.label,
    teamRole: minutesInfo.teamRole || null, promisedRole: minutesInfo.promised || null,
    offseason, seasonEarnings: roundMoney(seasonEarnings + contractBonus), contractBonus, nationalComp,
    reputation: player.reputation, reputationNotes, staffNotes, coachTrust: player.coachTrust,
    investmentIncome: ctx.investments ? ctx.investments.income : 0, investmentNotes: ctx.investments ? ctx.investments.notes : [],
    rank: regular.rank, totalTeams: regular.totalTeams, playoffCutoff: regular.playoffCutoff,
    relegationZone: regular.relegationZone, promotionZone: regular.promotionZone, conference: regular.conference,
    standings,
    roleBattle: ctx.roleBattle ? { rival: ctx.roleBattle.rival, won: ctx.roleBattle.status === "ahead", regainedIn: ctx.roleBattle.regainedIn } : null,
    adaptation: player.adaptation ? { country: player.adaptation.country, level: player.adaptation.level } : null,
    seriousInjury: ctx.seriousInjury || null,
    keyGames: (player.pendingSeason && player.pendingSeason.blocks ? player.pendingSeason.blocks : []).map(b => b.keyGame).filter(Boolean),
    duoWith: hasRequestedDuo(player) ? duoStaff(player).star.name : null, // la seconda stella voluta da te
    tradedFrom: player.pendingSeason && player.pendingSeason.tradedFrom ? player.pendingSeason.tradedFrom.name : null,
    allStarContest: player.pendingSeason ? player.pendingSeason.allStarContest || null : null,
  };
  // sponsor con condizioni: chi le ha rispettate paga, gli altri stracciano il contratto
  const sponsorSettle = settleSponsors(player, record);
  record.sponsorResults = sponsorSettle.results;
  record.seasonEarnings = roundMoney(record.seasonEarnings + sponsorSettle.income);
  // punteggio GOAT della stagione, cumulato nel totale di carriera
  record.goatPoints = computeSeasonGoatScore(record);
  player.goatScore = (player.goatScore || 0) + record.goatPoints;
  player.history.push(record);
  player.careerTotals.seasons++;
  player.careerTotals.gp = (player.careerTotals.gp || 0) + record.gp;
  player.careerTotals.pts += stats.pts;
  player.careerTotals.reb += stats.reb;
  player.careerTotals.ast += stats.ast;
  player.careerTotals.stl += stats.stl;
  player.careerTotals.blk += stats.blk;
  player.careerTotals.tov += stats.tov;

  // obiettivi della società, sogno di carriera e traguardi sbloccati in questa stagione
  record.goals = evaluateSeasonGoals(player, record, ctx.goals);
  evaluateCareerGoal(player, record);
  record.reputation = player.reputation;
  record.coachTrust = player.coachTrust;
  // leadership (allievo e fascia da capitano) e spese fisse del lifestyle
  record.leadershipNotes = [menteeSeasonUpdate(player), updateCaptaincy(player), identitySeasonUpdate(player), teamRoleSeasonUpdate(player), duoSeasonUpdate(player)].filter(Boolean);
  record.lifestyleUpkeep = settleLifestyle(player);
  record.newAchievements = checkAchievements(player).map(a => a.id);

  // promozione/retrocessione Serie A2 <-> LBA, decise dalla classifica reale: la promozione
  // arriva vincendo il titolo di A2, la retrocessione se si chiude tra le ultime due di LBA.
  // Le squadre di EuroLeague/EuroCup, come nella realtà, hanno blasone e bilancio che le
  // mettono quasi al riparo dalla retrocessione anche quando finiscono in fondo alla classifica.
  let relegationChance = 100;
  if (player.team.euro === "EL") relegationChance = 15;
  else if (player.team.euro === "EC") relegationChance = 50;

  const upLeague = LEAGUES[seasonLeague].promotesTo, downLeague = LEAGUES[seasonLeague].relegatesTo;
  if (upLeague && teamResult.champion) {
    promoteTeam(player.team, seasonLeague, upLeague);
    player.league = upLeague;
    record.event = { text: `🎉 ${player.team.name} vince la ${LEAGUES[seasonLeague].name} ed è promossa in ${LEAGUES[upLeague].name}!`, type: "milestone" };
    toast(`🎉 ${player.team.name} è stata promossa in ${LEAGUES[upLeague].name}!`);
  } else if (downLeague && regular.relegationZone && rollChance(relegationChance)) {
    relegateTeam(player.team, seasonLeague, downLeague);
    player.league = downLeague;
    record.event = { text: `😔 ${player.team.name} retrocede in ${LEAGUES[downLeague].name} dopo aver chiuso ${regular.rank}° su ${regular.totalTeams}.`, type: "injury" };
    toast(`😔 ${player.team.name} è retrocessa in ${LEAGUES[downLeague].name}.`);
  }

  player.pendingSeason = null;
  player.postseason = null;

  // il torneo con la Nazionale (se giocato quest'estate) non viene rivelato subito: si mostra
  // come schermata dedicata subito dopo l'Off-Season, prima dell'inizio della prossima regular season
  player.pendingNationalComp = ctx.nationalHandled ? null : nationalComp;

  // scadenza contratto: se ancora attivo, si prosegue comunque con una schermata di stato
  let contractExpired = true;
  const c = player.contract;
  if (c && c.yearsRemaining > 0) {
    c.yearsRemaining--;
    contractExpired = c.yearsRemaining <= 0;
  }
  // la NBA si interessa a te? si decide una volta per estate, e vale per tutto il mercato
  player.nbaInterest = !player.inNBA && rollChance(nbaOfferChance(player)) ? player.year : null;
  // se arriva la chiamata ci si libera anche a contratto in corso: con la clausola di uscita
  // sempre, senza clausola solo se la squadra NBA paga il buyout (per i giocatori da 82 in su)
  let nbaExit = false;
  if (!contractExpired && player.nbaInterest === player.year && !player.draftRights) {
    const clause = !!(c.clauses && c.clauses.nbaExit);
    if (clause || (player.overall >= 82 && rollChance(50))) {
      c.yearsRemaining = 0;
      contractExpired = true;
      nbaExit = clause ? "clause" : "buyout";
      toast(clause ? "✈️ Clausola di uscita NBA attivata: sei libero di trattare con la NBA!" : "✈️ Una squadra NBA è pronta a pagare il tuo buyout: puoi trattare con la NBA!");
    }
  }

  // Off-Season: si mostra sempre, che il contratto sia scaduto o ancora in corso
  let next;
  if (checkDraftEligibility(player)) {
    next = { type: "draft", record };
  } else if (contractExpired) {
    next = createMarketDecision(player, record);
    next.nbaExit = nbaExit;
  } else if (c.clauses && c.clauses.playerOption && c.yearsRemaining === 1 && !c.optionDecided) {
    next = { type: "playerOption", record };
  } else {
    next = { type: "offseasonStatus", record, extensionOffer: buildExtensionOffer(player, record) };
  }
  // un anno dopo il rookie rifiutato, la squadra che ti ha scelto al Draft torna a chiamare
  if (player.draftRights && !player.inNBA && player.year > player.draftRights.year && next.type !== "draft") next = draftRightsDecision(player, next);
  // ultima stagione del tour d'addio: dopo il resoconto ci si ritira, niente mercato
  if (isFarewellSeason(player)) {
    player.pendingDecision = { type: "seasonRecap", next: null, retireAfter: true, interview: { context: "farewell", answered: null } };
    renderGameScreen();
    return;
  }
  // a 18 anni, alla prima decisione di mercato, si sceglie l'agente
  const afterAgent = (!player.agentChosen && player.age >= 18 && next.type !== "draft") ? { type: "agentChoice", next } : next;
  const afterSpending = player.wealth >= SUMMER_SPENDING_MIN_WEALTH ? { type: "summerSpending", next: afterAgent } : afterAgent;
  // dopo il resoconto: l'allenamento estivo a punti, poi spese, agente e mercato
  // l'estate: allenamento, sponsor, vita privata, un giovane da far crescere, spese e mercato
  const afterRecap = startTraining(maybeSponsorDecision(player, record, maybeLifeEvent(player, maybeMentorOffer(player, afterSpending))));
  // prima di tutto il resoconto della stagione, con la conferenza stampa
  player.pendingDecision = { type: "seasonRecap", next: afterRecap, interview: { context: seasonInterviewContext(record, player), answered: null } };

  renderGameScreen();
}

/* Chiamata al termine dell'Off-Season (contratto firmato, oppure "Continua" se il contratto
   era già in corso): se quest'estate si è giocato un torneo con la Nazionale lo si rivela ora,
   altrimenti si è pronti per la prossima regular season. */
function advanceAfterOffseason() {
  if (player.pendingNationalComp) {
    player.pendingDecision = { type: "nationalReveal", comp: player.pendingNationalComp };
    player.pendingNationalComp = null;
  } else {
    player.pendingDecision = null;
  }
  renderGameScreen();
}
function confirmNationalReveal() {
  player.pendingDecision = null;
  renderGameScreen();
}
