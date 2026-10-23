"use strict";

/* ================================================================
   POSTSEASON — bracket giocati turno per turno
   ================================================================ */
const DOMESTIC_ROUNDS = i18nify([
  { name: "Quarti di Finale", nameEn: "Quarterfinals", bestOf: 5 },
  { name: "Semifinale",       nameEn: "Semifinals",    bestOf: 7 },
  { name: "Finale",           nameEn: "Finals",        bestOf: 7 },
]);
/* La USA-1 gioca un turno in più: i primi tre si disputano dentro la propria conference,
   le Finali USA-1 mettono di fronte le due squadre che hanno vinto la propria conference. */
const NBA_ROUNDS = i18nify([
  { name: "Primo Turno",              nameEn: "First Round",           bestOf: 7 },
  { name: "Semifinale di Conference", nameEn: "Conference Semifinals", bestOf: 7 },
  { name: "Finale di Conference",     nameEn: "Conference Finals",     bestOf: 7 },
  { name: "Finali USA-1",             nameEn: "USA-1 Finals",          bestOf: 7 },
]);
const CONTINENTAL_ROUNDS = i18nify([
  { name: "Fase a Gironi", nameEn: "Group Stage", group: true },
  { name: "Playoff",       nameEn: "Playoffs",    bestOf: 5 },
  { name: "Final Four",    nameEn: "Final Four",  bestOf: 1 },
  { name: "Finale",        nameEn: "Final",       bestOf: 1 },
]);

const NATIONAL_BRACKET_ROUNDS = i18nify([
  { name: "Fase a Gironi", nameEn: "Group Stage",   group: true },
  { name: "Quarti",        nameEn: "Quarterfinals", bestOf: 1 },
  { name: "Semifinale",    nameEn: "Semifinals",    bestOf: 1 },
  { name: "Finale",        nameEn: "Final",         bestOf: 1 },
]);

function buildBracket(kind, competition, leagueId, teamStrength, seed, conference) {
  const rounds = kind !== "domestic" ? CONTINENTAL_ROUNDS : (leagueId === "NBA" ? NBA_ROUNDS : DOMESTIC_ROUNDS);
  return {
    kind, competition, leagueId, teamStrength, seed, conference,
    rounds, idx: 0, results: [], done: false, champion: false, eliminatedAt: null,
  };
}

/* Torneo estivo con la Nazionale come fase a sé della stagione: girone, poi gare secche,
   con la finalina per il bronzo per chi perde in semifinale (come nei tornei FIBA) */
function buildNationalBracket(nationalKind, competition) {
  return {
    kind: "national", nationalKind, competition, leagueId: player.league, teamStrength: null,
    rounds: i18nify(NATIONAL_BRACKET_ROUNDS.map(r => ({ ...r }))), idx: 0, results: [], done: false, champion: false, eliminatedAt: null,
  };
}
/* Win% di una gara della Nazionale: la sua forza è approssimata dall'overall del giocatore */
function nationalWinProb(p) {
  const strength = clamp(0.28 + (p.overall - 58) / 90, 0.12, 0.92);
  return clamp(0.32 + (strength - 0.5) * 0.85 + getDifficulty(p).playoff * 0.5, 0.12, 0.88);
}
function nationalOpponent(bracket) {
  const faced = new Set(bracket.results.map(r => r.opponent && r.opponent.name));
  // all'Europeo solo nazionali europee, al Mondiale tutte
  const field = bracket.nationalKind === "euro" ? EUROPEAN_NATIONALITIES : NATIONALITIES;
  const pool = field.filter(n => n !== player.nationality && !faced.has(n));
  const name = choice(pool.length ? pool : field.filter(n => n !== player.nationality));
  return { name, city: tr("Nazionale", "National Team"), colors: ["#6b7a90", "#c4cbd6"] };
}

/* Win% di gara di un club contro un avversario con un certo percentile di forza */
function clubGameWinProb(bracket, p, oppPct) {
  const leagueId = bracket.leagueId;
  const ourPct = teamStrengthPercentile(bracket.teamStrength, leagueId);
  // la stella fa la differenza solo se è davvero sopra la lega: +1% a gara per ogni punto oltre media+4
  // fuori per infortunio: la squadra gioca senza la sua stella
  const out = !!(p.pendingSeason && p.pendingSeason.outForPlayoffs);
  const starFactor = out ? -0.06 : clamp((p.overall - LEAGUES[leagueId].avgOverall - 4) * 0.01, -0.08, 0.14);
  // freschezza: chi arriva ai playoff con la stamina alta rende di più, chi è spremuto cala
  const freshness = out ? 0 : (p.stamina - 55) * 0.0015;
  // ai playoff nessuno è imbattibile: gli avversari sono le migliori e anche i favoriti perdono partite
  // la difficoltà sposta tutta la fascia, limiti compresi: "Normale" resta 25-70%
  const diff = getDifficulty(p).playoff;
  return clamp(0.44 + (ourPct - oppPct) * 0.3 + starFactor + freshness + diff, 0.25 + diff, 0.7 + diff);
}

/* Momenti clutch: ultimo possesso di una partita punto a punto, sotto di un punto. Ogni opzione dipende
   da un attributo diverso; il morale conta un po', la forza della squadra è già nel win% di gara. */
const CLUTCH_OPTIONS = i18nify([
  { id: "iso", icon: "🎯", label: "Tiro io", labelEn: "Take the Shot", desc: "Isolamento e tiro dalla media: tutto sulle tue mani.", descEn: "Isolation and mid-range jumper: it's all in your hands.", attrLabel: p => `${tr("Tiro", "Shooting")} ${p.attrs.shooting}`, attr: p => p.attrs.shooting },
  { id: "drive", icon: "⚡", label: "Attacco il ferro", labelEn: "Attack the Rim", desc: "Penetrazione e contatto: cerchi il canestro o i tiri liberi.", descEn: "Drive through contact: look for the bucket or free throws.", attrLabel: p => `${tr("Penetr.", "Drive")} ${Math.round((p.attrs.finishing + p.attrs.athleticism) / 2)}`, attr: p => (p.attrs.finishing + p.attrs.athleticism) / 2 },
  { id: "pass", icon: "🤝", label: "Scarico al compagno", labelEn: "Kick Out to Teammate", desc: "Attiri il raddoppio e trovi il tiratore libero nell'angolo.", descEn: "Draw the double-team and find the open shooter in the corner.", attrLabel: p => `${tr("Visione", "Vision")} ${p.attrs.playmaking}`, attr: p => p.attrs.playmaking },
]);
function clutchChance(p, winProb, option) {
  const diff = getDifficulty(p).clutch;
  const trait = clutchTraitBonus(p); // sangue freddo, testa calda, mancino
  const star = p.currentTeamRole === "star" ? 0.04 : (p.overall >= 85 ? 0.02 : 0);
  return clamp(winProb + (option.attr(p) - 78) * 0.006 + (p.morale - 60) * 0.001 + star + diff + trait, 0.18 + diff, 0.84 + diff + trait);
}
function bestClutchOption(p, winProb) {
  return CLUTCH_OPTIONS.reduce((best, o) => (clutchChance(p, winProb, o) > clutchChance(p, winProb, best) ? o : best));
}

/* Squadre tra cui pescare l'avversario del turno corrente: in USA-1 i primi tre turni restano
   dentro la propria conference, le Finali USA-1 affrontano l'altra conference; nelle altre
   leghe l'avversario arriva semplicemente dal resto del campionato. */
function opponentPool(bracket, p) {
  const pool = opponentField(bracket, p);
  const strengthOf = t => getTeamStrength(t, leagueOfTeam(t) || bracket.leagueId);
  const sorted = [...pool].sort((a, b) => strengthOf(b) - strengthOf(a));
  const top = bracket.kind === "continental" ? Math.max(2, 10 - bracket.idx * 3) : Math.max(2, 8 - bracket.idx * 2);
  return sorted.slice(0, Math.min(top, sorted.length));
}
/* Tutte le possibili avversarie del turno (prima di tenere solo le migliori) */
function opponentField(bracket, p) {
  const leagueId = bracket.leagueId;
  if (leagueId === "NBA" && bracket.kind === "domestic") {
    const isFinals = bracket.idx === bracket.rounds.length - 1;
    const wantConference = isFinals ? (bracket.conference === "Est" ? "Ovest" : "Est") : bracket.conference;
    const pool = LEAGUES.NBA.teams.filter(t => t.conference === wantConference && t.name !== p.team.name);
    if (pool.length) return pool;
  }
  if (bracket.kind === "continental") {
    // in coppa si affrontano le squadre delle altre leghe europee iscritte alla stessa competizione
    const tag = bracket.competition === "EUROPE-1" ? "EL" : "EC";
    const pool = Object.keys(LEAGUES).filter(id => LEAGUES[id].continent === "Europa")
      .flatMap(id => LEAGUES[id].teams.filter(t => t.euro === tag && t.name !== p.team.name && id !== leagueId));
    if (pool.length) return pool;
  }
  return LEAGUES[leagueId].teams.filter(t => t.name !== p.team.name);
}

/* Lega in cui gioca una squadra (per leggerne la forza con la fascia giusta) */
function leagueOfTeam(team) {
  return Object.keys(LEAGUES).find(id => LEAGUES[id].teams.some(t => t.name === team.name)) || null;
}

/* Probabilità che una gara a eliminazione (non decisiva) finisca punto a punto */
const CLOSE_GAME_CHANCE = 20;

/* Gioca le gare di una serie a partire dal punteggio dato. Con interactive si ferma prima di
   ogni gara punto a punto (sempre la decisiva, le altre con CLOSE_GAME_CHANCE) senza giocarla. */
function playSeriesGames(winProbPerGame, bestOf, interactive, us = 0, them = 0) {
  const need = Math.ceil(bestOf / 2);
  while (us < need && them < need) {
    const decisive = us === need - 1 && them === need - 1;
    if (interactive && (decisive || rollChance(CLOSE_GAME_CHANCE))) return { stopped: true, us, them, decisive };
    if (Math.random() < winProbPerGame) us++; else them++;
  }
  return { stopped: false, us, them, won: us === need };
}

/* Fase a gironi (coppa europea o Nazionale): si gioca in blocco, passa chi resta sopra la soglia */
function playGroupStage(bracket, p) {
  const round = bracket.rounds[bracket.idx];
  if (bracket.kind === "national") {
    const qualified = rollChance(nationalWinProb(p) * 100);
    const wins = qualified ? randInt(3, 5) : randInt(0, 2);
    return completeRound(bracket, { round: round.name, group: true, wins, losses: 5 - wins, won: qualified });
  }
  const games = bracket.competition === "EUROPE-1" ? 34 : 18;
  const wins = clamp(Math.round(games * clubGameWinProb(bracket, p, 0.5)) + randInt(-2, 2), 0, games);
  const mpg = (player.pendingSeason && player.pendingSeason.minutesInfo && player.pendingSeason.minutesInfo.mpg) || 26;
  const st = simulateStatline(p, { mpg }, bracket.competition === "EUROPE-1" ? "EUROLEAGUE" : "EUROCUP");
  return completeRound(bracket, {
    round: round.name, group: true, wins, losses: games - wins, won: wins / games >= 0.5,
    stats: { gp: games, pts: st.pts, reb: st.reb, ast: st.ast },
  });
}

/* Gioca il turno corrente del bracket attivo. Con interactive, se arriva una gara punto a punto
   si ferma sull'ultimo possesso (bracket.pendingClutch) e restituisce null: la scelta del
   giocatore la chiude con resolveClutch, poi la serie prosegue. */
function playPostseasonRound(bracket, p, interactive) {
  const round = bracket.rounds[bracket.idx];
  // dalla tribuna non si gioca l'ultimo possesso
  if (p.pendingSeason && p.pendingSeason.outForPlayoffs) interactive = false;
  if (round.group) return playGroupStage(bracket, p);

  let opponent, winProb;
  if (bracket.kind === "national") {
    opponent = nationalOpponent(bracket);
    winProb = nationalWinProb(p);
  } else {
    // avversario: nei turni finali si affrontano squadre progressivamente più forti
    opponent = choice(opponentPool(bracket, p));
    const oppLeague = leagueOfTeam(opponent) || bracket.leagueId;
    const oppPct = teamStrengthPercentile(getTeamStrength(opponent, oppLeague), oppLeague) + bracket.idx * 0.04;
    winProb = clubGameWinProb(bracket, p, oppPct);
  }
  const series = playSeriesGames(winProb, round.bestOf, !!interactive);
  if (series.stopped) {
    bracket.pendingClutch = { round: round.name, bestOf: round.bestOf, opponent, us: series.us, them: series.them, decisive: series.decisive, winProb, plays: [] };
    return null;
  }
  return completeRound(bracket, { round: round.name, bestOf: round.bestOf, opponent, us: series.us, them: series.them, won: series.won });
}

/* Archivia il risultato del turno e fa avanzare (o chiude) il tabellone */
function completeRound(bracket, entry) {
  bracket.results.push(entry);
  const round = bracket.rounds[bracket.idx];
  if (round.bronze) {
    // finalina: comunque vada il torneo è finito, il bronzo va a chi la vince
    bracket.done = true;
    bracket.eliminatedAt = tr("Semifinale", "Semifinals");
  } else if (!entry.won) {
    if (bracket.kind === "national" && (entry.round === "Semifinale" || entry.round === "Semifinals")) {
      bracket.rounds.push(i18nify({ name: "Finale 3° posto", nameEn: "3rd Place Game", bestOf: 1, bronze: true }));
      bracket.rounds.splice(bracket.idx + 1, bracket.rounds.length - bracket.idx - 2); // la finale non si gioca più
      bracket.idx++;
    } else {
      bracket.done = true;
      bracket.eliminatedAt = entry.round;
    }
  } else if (bracket.idx === bracket.rounds.length - 1) {
    bracket.done = true;
    bracket.champion = true;
  } else {
    bracket.idx++;
  }
  return entry;
}

/* Ultimo possesso di una gara punto a punto: l'azione scelta decide la gara, poi la serie
   continua (fermandosi di nuovo alla prossima gara punto a punto, se interactive) */
function playClutch(bracket, optionId, interactive, shotMeterResult) {
  const pc = bracket.pendingClutch;
  const option = CLUTCH_OPTIONS.find(o => o.id === optionId) || bestClutchOption(player, pc.winProb);
  let success;
  if (shotMeterResult && shotMeterResult.success != null) {
    success = shotMeterResult.success;
  } else {
    success = rollChance(clutchChance(player, pc.winProb, option) * 100);
  }
  const bigStage = pc.decisive || bracket.idx === bracket.rounds.length - 1;
  player.clutch = player.clutch || { made: 0, attempts: 0 };
  player.clutch.attempts++;
  if (success) {
    player.clutch.made++;
    player.popularity = clamp(player.popularity + (bigStage ? 6 : 2), 0, 100);
    player.morale = clamp(player.morale + (bigStage ? 5 : 2), 0, 100);
    if (shotMeterResult && shotMeterResult.timing === "perfect") {
      player.morale = clamp(player.morale + 1, 0, 100);
    }
  } else {
    player.morale = clamp(player.morale - (bigStage ? 4 : 1), 0, 100);
  }
  pc.plays.push({ game: pc.us + pc.them + 1, label: option.label, success, decisive: pc.decisive });
  const us = pc.us + (success ? 1 : 0), them = pc.them + (success ? 0 : 1);
  const next = playSeriesGames(pc.winProb, pc.bestOf, !!interactive, us, them);
  if (next.stopped) {
    Object.assign(pc, { us: next.us, them: next.them, decisive: next.decisive });
    return { pending: true, lastPlay: pc.plays[pc.plays.length - 1] };
  }
  bracket.pendingClutch = null;
  const entry = completeRound(bracket, {
    round: pc.round, bestOf: pc.bestOf, opponent: pc.opponent, us: next.us, them: next.them, won: next.won, clutchPlays: pc.plays,
  });
  entry.lastPlay = pc.plays[pc.plays.length - 1];
  return entry;
}

function currentBracket() {
  const ps = player.postseason;
  if (!ps) return null;
  return ps.brackets[ps.idx] || null;
}

/* Avanza di un turno: se il bracket corrente si chiude, passa al successivo;
   quando tutti i tabelloni sono conclusi la stagione viene finalizzata. */
/* Animazione coppa: coriandoli generati a runtime + trofeo SVG animato via CSS */
let popupQueue = [];
let popupActive = false;
/* Accoda un popup (titolo/premio); se un altro è già a schermo, parte quando viene chiuso */
function queuePopup(titles, mode) {
  if (!titles || !titles.length) return;
  popupQueue.push({ titles, mode: mode || "champion" });
  if ((mode || "champion") === "champion") playSound("title");
  if (!popupActive) advancePopupQueue();
}
function advancePopupQueue() {
  if (!popupQueue.length) { popupActive = false; return; }
  popupActive = true;
  const next = popupQueue.shift();
  showTrophyAnimation(next.titles, next.mode);
}
function showTrophyAnimation(titles, mode) {
  mode = mode || "champion";
  const isAward = mode === "award";
  const isSeason = mode === "season";
  const confetti = el("trophy-confetti");
  const colors = isAward
    ? ["#a06bff", "#3d8bfd", "#ffd447", "#35c47a"]
    : ["#ffd447", "#ff7a1a", "#3d8bfd", "#35c47a", "#a06bff", "#ef4b56"];
  confetti.innerHTML = isSeason ? "" : Array.from({ length: isAward ? 34 : 60 }, () => {
    const left = Math.random() * 100;
    const delay = Math.random() * 0.6;
    const duration = 2.2 + Math.random() * 1.6;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const rotate = Math.random() * 360;
    return `<span style="left:${left}%;background:${color};animation-delay:${delay}s;animation-duration:${duration}s;transform:rotate(${rotate}deg)"></span>`;
  }).join("");

  el("trophy-svg").style.display = (isAward || isSeason) ? "none" : "";
  el("award-medal").style.display = isAward ? "block" : "none";
  el("season-banner").style.display = isSeason ? "block" : "none";
  el("trophy-title").textContent = isAward ? tr("🏅 Premio vinto!", "🏅 Award Won!") : isSeason ? tr("🏁 Stagione Conclusa", "🏁 Season Complete") : tr("🏆 Campione!", "🏆 Champion!");
  el("trophy-subtitle").textContent = titles.join(" · ");
  el("trophy-overlay").classList.remove("hidden");
}
function hideTrophyAnimation() {
  el("trophy-overlay").classList.add("hidden");
  el("trophy-confetti").innerHTML = "";
  advancePopupQueue();
}

function answerPostseasonInterview(toneId) {
  const ps = player.postseason;
  if (!ps || !ps.interview) return;
  answerInterviewObj(ps.interview, toneId);
}
function answerPostseasonFollowUp(followId) {
  const ps = player.postseason;
  if (!ps || !ps.interview) return;
  answerInterviewFollowUpObj(ps.interview, followId);
}

function advancePostseasonRound() {
  const ps = player.postseason;
  if (!ps) return;
  ps.interview = null; // si torna in campo: l'intervista, se non risposta, cade
  const bracket = currentBracket();
  if (!bracket) { finalizeSeason(); return; }
  if (bracket.pendingClutch) return; // prima va giocato l'ultimo possesso

  const entry = playPostseasonRound(bracket, player, true);
  if (!entry) { renderGameScreen(); return; } // partita punto a punto: si attende la scelta
  afterPostseasonRound(bracket, entry);
}

function resolveClutch(optionId, onOutcome, shotMeterResult) {
  const bracket = player.postseason && currentBracket();
  if (!bracket || !bracket.pendingClutch) return;
  const result = playClutch(bracket, optionId, true, shotMeterResult);
  const play = result.lastPlay;
  toast(play.success ? tr(`🎯 ${play.label}: canestro! Gara ${play.game} vinta.`, `🎯 ${play.label}: bucket! Game ${play.game} won.`) : tr(`💔 ${play.label}: niente da fare, gara ${play.game} persa.`, `💔 ${play.label}: no good, Game ${play.game} lost.`));
  playSound(play.success ? "win" : "loss");
  if (onOutcome) {
    onOutcome(play, () => {
      if (result.pending) { renderGameScreen(); return; }
      afterPostseasonRound(bracket, result);
    });
    return;
  }
  if (result.pending) { renderGameScreen(); return; }
  afterPostseasonRound(bracket, result);
}

function phaseLabel(b) { return b.kind === "domestic" ? `${tr("Playoff", "Playoffs")} ${b.competition}` : b.competition; }
const PHASE_ICON = { domestic: "🏀", continental: "🏟️", national: "🌍" };
function championText(b) {
  return b.kind === "national" ? tr(`${b.competition}: la Nazionale ${player.nationality} è Campione!`, `${b.competition}: ${player.nationality} National Team is Champion!`) : tr(`${b.competition}: ${player.team.name} è Campione!`, `${b.competition}: ${player.team.name} is Champion!`);
}

function afterPostseasonRound(bracket, entry) {
  const ps = player.postseason;
  if (!isMinorItaLeague(bracket.leagueId) && entry.clutchPlays && entry.clutchPlays.length && !ps.interviewDone) {
    const last = entry.clutchPlays[entry.clutchPlays.length - 1];
    ps.interview = { context: last.success ? "clutchWin" : "clutchLoss", answered: null, round: entry.round };
    ps.interviewDone = true;
  }
  const vs = entry.opponent ? ` vs ${entry.opponent.name}` : "";
  const score = entry.group ? `${entry.wins}-${entry.losses}` : `${entry.us}-${entry.them}`;
  if (entry.won) toast(`✅ ${bracket.competition} — ${entry.round} ${entry.group ? tr("superata", "advanced") : tr("vinta", "won")} ${score}${vs}`);
  else toast(`❌ ${bracket.competition} — ${entry.round}: ${entry.group ? tr("eliminati", "eliminated") : tr("persa", "lost")} ${score}${vs}`);
  if (bracket.done) closePhase(bracket, true);
  else renderGameScreen();
}

/* Chiusura di una fase: festeggiamenti, poi la fase successiva o la fine della stagione */
function closePhase(bracket, render) {
  const ps = player.postseason;
  if (bracket.champion) queuePopup([championText(bracket)], "champion");
  ps.idx++;
  if (ps.idx >= ps.brackets.length) { finalizeSeason(); return; }
  toast(`${PHASE_ICON[ps.brackets[ps.idx].kind]} ${tr("Si passa a", "Moving on to")}: ${phaseLabel(ps.brackets[ps.idx])}`);
  if (render) renderGameScreen();
}

/* Gioca il resto della fase corrente senza fermarsi; le partite punto a punto in sospeso si
   giocano con l'azione più probabile */
function playOutBracket(bracket) {
  let guard = 0;
  while (!bracket.done && guard++ < 20) {
    if (bracket.pendingClutch) playClutch(bracket, bestClutchOption(player, bracket.pendingClutch.winProb).id, false);
    else playPostseasonRound(bracket, player, false);
  }
}
function simulateCurrentPhase() {
  const bracket = player.postseason && currentBracket();
  if (!bracket) return;
  playOutBracket(bracket);
  closePhase(bracket, true);
}

/* Salta tutte le fasi rimanenti e chiude la stagione */
function simulateRestOfPostseason() {
  const ps = player.postseason;
  if (!ps) return;
  const wonTitles = [];
  let guard = 0;
  while (ps.idx < ps.brackets.length && guard++ < 10) {
    const bracket = currentBracket();
    playOutBracket(bracket);
    if (bracket.champion) wonTitles.push(championText(bracket));
    ps.idx++;
  }
  finalizeSeason();
  if (wonTitles.length) queuePopup(wonTitles, "champion");
}

/* Torneo della Nazionale ricavato dalla fase giocata, nella stessa forma di simulateNationalTournament */
function nationalCompFromBracket(b) {
  const results = b.results.map(r => ({ round: r.round, won: r.won }));
  const last = results[results.length - 1];
  let medal = null;
  if (b.champion) medal = "oro";
  else if (last.round === "Finale" || last.round === "Final") medal = "argento";
  else if ((last.round === "Finale 3° posto" || last.round === "3rd Place Game") && last.won) medal = "bronzo";
  return { kind: b.nationalKind, name: b.competition, results, champion: b.champion, medal };
}

function bracketOutcomeLabel(bracket) {
  if (bracket.champion) return tr("Campione! 🏆", "Champion! 🏆");
  if (bracket.eliminatedAt === "Finale" || bracket.eliminatedAt === "Finals" || bracket.eliminatedAt === "Final" || bracket.eliminatedAt === "Finali USA-1" || bracket.eliminatedAt === "USA-1 Finals") return tr("Finale persa", "Finals Runner-up");
  if (bracket.eliminatedAt) return `${tr("Eliminati", "Eliminated")}: ${bracket.eliminatedAt}`;
  return null;
}
