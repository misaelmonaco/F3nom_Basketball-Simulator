"use strict";

/* ================================================================
   OBIETTIVI — ogni stagione la società fissa un obiettivo di squadra e uno personale;
   a inizio carriera si sceglie un "sogno", un traguardo di lungo periodo che dà una
   direzione a tutte le stagioni. Lo stato salva solo id e bersagli, le regole stanno qui.
   ================================================================ */
const SEASON_GOAL_TYPES = {
  final: { icon: "🏆", label: t => t === "NBA" ? tr("Arrivare almeno in finale di Conference", "Reach at least the Conference Finals") : tr("Arrivare almeno in finale", "Reach at least the Finals"), check: rec => domesticStageIndex(rec) >= 3 },
  deepRun: { icon: "📈", label: () => tr("Superare il primo turno dei playoff", "Advance past the first playoff round"), check: rec => domesticStageIndex(rec) >= 2 },
  playoffs: { icon: "🎟️", label: () => tr("Qualificarsi ai playoff", "Qualify for the playoffs"), check: rec => !!rec.playoffRounds },
  winning: { icon: "⚖️", label: t => tr(`Vincere almeno il ${t}% delle partite`, `Win at least ${t}% of games`), check: (rec, t) => rec.wins / Math.max(1, rec.wins + rec.losses) * 100 >= t },
  points: { icon: "🎯", label: t => tr(`Almeno ${t} punti a partita`, `Score at least ${t} PPG`), check: (rec, t) => rec.pts >= t },
  presence: { icon: "🩺", label: t => tr(`Giocare almeno il ${t}% delle partite`, `Play at least ${t}% of games`), check: (rec, t) => rec.gp / Math.max(1, rec.games) * 100 >= t },
  allstar: { icon: "🌟", label: () => tr("Essere convocato all'All-Star Game", "Be selected to the All-Star Game"), check: rec => (rec.awards || []).some(a => a.startsWith("All-Star")) },
  bestFive: { icon: "🧩", label: () => tr("Entrare nel Miglior Quintetto", "Make the All-League First Team"), check: rec => (rec.awards || []).some(a => a.startsWith("Miglior Quintetto") || a.startsWith("All-League")) },
};
/* Punti a partita attesi in USA-1 per fascia di minutaggio: nelle altre leghe si scala col ritmo */
const EXPECTED_PTS_BY_ROLE = { "Panchina": 4, "6° Uomo": 8, "Titolare": 15, "Franchigia": 22 };

function seasonGoalLabel(g) { return SEASON_GOAL_TYPES[g.type].label(g.target); }
function seasonGoalIcon(g) { return SEASON_GOAL_TYPES[g.type].icon; }

/* Gli obiettivi della società, fissati a inizio stagione in base alla forza della squadra e al ruolo */
function buildSeasonGoals(p, leagueId, teamStrength, minutesInfo) {
  const pct = teamStrengthPercentile(teamStrength, leagueId);
  // chi parte dalla panchina non paga il mancato obiettivo di squadra con la fiducia del coach
  const core = minutesInfo.label === "Titolare" || minutesInfo.label === "Franchigia";
  const goals = [];
  if (pct >= 0.85) goals.push({ kind: "team", type: "final", target: leagueId, core });
  else if (pct >= 0.6) goals.push({ kind: "team", type: "deepRun" });
  else if (pct >= 0.3) goals.push({ kind: "team", type: "playoffs" });
  else goals.push({ kind: "team", type: "winning", target: 35 });

  const margin = p.overall - LEAGUES[leagueId].avgOverall;
  if (leagueId !== "NCAA" && margin >= 16 && rollChance(50)) goals.push({ kind: "personal", type: "bestFive" });
  else if (leagueId !== "NCAA" && margin >= 13 && rollChance(50)) goals.push({ kind: "personal", type: "allstar" });
  else if (p.fragility >= 40 && rollChance(60)) goals.push({ kind: "personal", type: "presence", target: 80 });
  else {
    const base = EXPECTED_PTS_BY_ROLE[minutesInfo.label] || 10;
    goals.push({ kind: "personal", type: "points", target: Math.max(3, Math.round(base * leaguePaceFactor(leagueId) * (1.2 + clamp(margin, -10, 20) * 0.012) * pointsScaleNow(p.overall))) });
  }
  return goals;
}

/* Fine stagione: obiettivi raggiunti o mancati, con le conseguenze su fiducia, morale e stima */
function evaluateSeasonGoals(p, rec, goals) {
  return (goals || []).map(g => {
    const met = !!SEASON_GOAL_TYPES[g.type].check(rec, g.target);
    const notes = [];
    if (g.kind === "team") {
      if (met) { changeCoachTrust(p, 5); changeReputation(p, 1); notes.push(tr("fiducia del coach +5", "coach trust +5"), tr("reputazione +1", "reputation +1")); }
      else if (g.type === "final" && g.core) { changeCoachTrust(p, -4); notes.push(tr("fiducia del coach −4", "coach trust −4")); }
      else if (p.currentTeamRole === "star") { p.morale = clamp(p.morale - 3, 0, 100); changeReputation(p, -1); notes.push(tr("da stella la colpa è tua: morale −3", "as the star, the blame falls on you: morale −3"), tr("reputazione −1", "reputation −1")); }
    } else if (met) {
      p.morale = clamp(p.morale + 5, 0, 100); p.popularity = clamp(p.popularity + 3, 0, 100);
      notes.push(tr("morale +5", "morale +5"), tr("popolarità +3", "popularity +3"));
    } else {
      p.morale = clamp(p.morale - 3, 0, 100);
      notes.push(tr("morale −3", "morale −3"));
    }
    return { ...g, label: seasonGoalLabel(g), met, notes };
  });
}

function seasonGoalsListHtml(goals, results) {
  if (!goals || !goals.length) return "";
  const list = results || goals;
  return `<ul class="goal-list">${list.map(g => {
    const state = g.met == null ? "open" : g.met ? "met" : "missed";
    const mark = state === "open" ? "○" : state === "met" ? "✓" : "✗";
    return `<li class="goal-item ${state}"><span class="goal-mark">${mark}</span><span class="goal-icon">${seasonGoalIcon(g)}</span>
      <span class="goal-text">${seasonGoalLabel(g)} <span class="small-muted">· ${g.kind === "team" ? tr("di squadra", "team") : tr("personale", "personal")}</span>
      ${g.notes && g.notes.length ? `<span class="goal-notes">${g.notes.join(", ")}</span>` : ""}</span></li>`;
  }).join("")}</ul>`;
}

/* ---------- il sogno di carriera ---------- */
function maxSeasonsWithOneTeam(p) {
  const byTeam = {};
  p.history.forEach(h => { byTeam[h.team.name] = (byTeam[h.team.name] || 0) + 1; });
  return Math.max(0, ...Object.values(byTeam));
}
const CAREER_GOALS = [
  { id: "ringBy27", icon: "💍", label: "Un anello USA-1 entro i 27 anni", labelEn: "A USA-1 ring by age 27", deadline: 27,
    check: p => p.history.some(h => h.champion && h.league === "NBA" && h.age <= 27) },
  { id: "mvp", icon: "⭐", label: "Vincere un titolo di MVP", labelEn: "Win an MVP award", check: p => p.trophies.mvp > 0 },
  { id: "euroKing", icon: "🏆", label: "Vincere la EUROPE-1", labelEn: "Win the EUROPE-1 title", check: p => p.trophies.euroleague > 0 },
  { id: "national", icon: "🥇", label: "Un oro con la Nazionale", labelEn: "Win Gold with the National Team", check: p => p.trophies.worldCupTitles + p.trophies.eurobasketTitles > 0 },
  { id: "loyal", icon: "🤝", label: "Bandiera: 8 stagioni nella stessa squadra", labelEn: "Franchise Icon: 8 seasons with the same team", check: p => maxSeasonsWithOneTeam(p) >= 8,
    progress: p => [maxSeasonsWithOneTeam(p), 8] },
  { id: "allstar5", icon: "🌟", label: "5 convocazioni all'All-Star Game", labelEn: "5 All-Star Game selections", check: p => p.trophies.allstar >= 5, progress: p => [p.trophies.allstar, 5] },
  { id: "titles2", icon: "🏅", label: "2 titoli di campionato", labelEn: "2 League Championships", check: p => p.trophies.rings + p.trophies.domesticTitles >= 2,
    progress: p => [p.trophies.rings + p.trophies.domesticTitles, 2] },
  { id: "points15k", icon: "🎯", label: "11.000 punti in carriera", labelEn: "11,000 career points", check: p => computeCareerTotals(p.history).pts >= 11000,
    progress: p => [computeCareerTotals(p.history).pts, 11000] },
  { id: "jersey", icon: "👕", label: "Una maglia ritirata", labelEn: "Have your jersey retired", endOnly: true, check: () => retiredJerseys().length > 0 },
  { id: "hof", icon: "🏛️", label: "Entrare nella Hall of Fame", labelEn: "Inducted into the Hall of Fame", endOnly: true, check: () => hallOfFameVerdict().elected },
];
if (typeof i18nify === "function") i18nify(CAREER_GOALS);
const CAREER_GOAL_REWARD = { reputation: 4, popularity: 8, morale: 10, goat: 40 };
function getCareerGoal(id) { return CAREER_GOALS.find(g => g.id === id) || null; }

/* Tre sogni tra cui scegliere (quelli con una scadenza solo se si è ancora in tempo) */
function careerGoalOptions(p) {
  const pool = CAREER_GOALS.filter(g => !g.deadline || p.age < g.deadline - 2).map(g => g.id);
  const out = [];
  while (out.length < 3 && pool.length) out.push(pool.splice(randInt(0, pool.length - 1), 1)[0]);
  return out;
}
function chooseCareerGoal(id) {
  const d = player.pendingDecision;
  if (!d || d.type !== "careerGoal" || !getCareerGoal(id)) return;
  player.careerGoal = { id, status: "active", since: player.year };
  pushNews(tr(`${getCareerGoal(id).icon} Il tuo sogno: ${getCareerGoal(id).label}.`, `${getCareerGoal(id).icon} Your career dream: ${getCareerGoal(id).label}.`));
  player.pendingDecision = null;
  advanceSeason();
}

/* Dopo ogni stagione (e al ritiro): il sogno si avvera, scade o resta aperto */
function evaluateCareerGoal(p, rec) {
  const cg = p.careerGoal;
  if (!cg || cg.status !== "active") return null;
  const goal = getCareerGoal(cg.id);
  if (!goal) return null;
  if ((!goal.endOnly || p.retired) && goal.check(p)) {
    cg.status = "done"; cg.year = p.year;
    const r = CAREER_GOAL_REWARD;
    changeReputation(p, r.reputation);
    p.popularity = clamp(p.popularity + r.popularity, 0, 100);
    p.morale = clamp(p.morale + r.morale, 0, 100);
    if (rec) { rec.goatPoints = (rec.goatPoints || 0) + r.goat; p.goatScore = (p.goatScore || 0) + r.goat; rec.careerGoalDone = cg.id; }
    toast(tr(`${goal.icon} Sogno realizzato: ${goal.label}!`, `${goal.icon} Dream achieved: ${goal.label}!`));
    return "done";
  }
  if ((goal.deadline && p.age >= goal.deadline) || p.retired) {
    cg.status = "failed"; cg.year = p.year;
    if (!p.retired) { p.morale = clamp(p.morale - 6, 0, 100); pushNews(tr(`${goal.icon} Il sogno "${goal.label}" è sfumato.`, `${goal.icon} Your dream "${goal.label}" has slipped away.`)); }
    return "failed";
  }
  return null;
}

function careerGoalCardHtml(p) {
  if (p.scenario) return scenarioCardHtml(p); // negli scenari l'obiettivo prende il posto del sogno
  const cg = p.careerGoal;
  if (!cg) return `<p class="small-muted">${tr("Sceglierai il tuo sogno di carriera all'inizio della prima stagione.", "You will choose your career dream at the start of your first season.")}</p>`;
  const goal = getCareerGoal(cg.id);
  if (!goal) return "";
  const status = cg.status === "done" ? `<span class="badge green">${tr(`Realizzato nel ${cg.year}`, `Achieved in ${cg.year}`)}</span>`
    : cg.status === "failed" ? `<span class="badge red">${tr("Sfumato", "Missed")}</span>`
    : `<span class="badge blue">${tr("In corso", "In progress")}</span>`;
  const prog = cg.status === "active" && goal.progress ? goal.progress(p) : null;
  const loc = isEn() ? "en-US" : "it-IT";
  return `
    <div class="dream-card ${cg.status}">
      <div class="dream-icon">${goal.icon}</div>
      <div class="dream-body">
        <div class="dream-title">${goal.label} ${status}</div>
        <div class="small-muted">${goal.deadline ? tr(`Entro i ${goal.deadline} anni · `, `By age ${goal.deadline} · `) : ""}${goal.endOnly ? tr("Si decide a fine carriera · ", "Decided at retirement · ") : ""}${tr(`Se lo realizzi: reputazione +${CAREER_GOAL_REWARD.reputation}, popolarità +${CAREER_GOAL_REWARD.popularity}, +${CAREER_GOAL_REWARD.goat} punti GOAT e una spinta verso la Hall of Fame.`, `If achieved: reputation +${CAREER_GOAL_REWARD.reputation}, popularity +${CAREER_GOAL_REWARD.popularity}, +${CAREER_GOAL_REWARD.goat} GOAT points, and a Hall of Fame boost.`)}</div>
        ${prog ? `<div class="ach-progress"><div class="ach-bar" style="width:${clamp(prog[0] / prog[1] * 100, 0, 100)}%"></div></div><div class="small-muted">${prog[0].toLocaleString(loc)} / ${prog[1].toLocaleString(loc)}</div>` : ""}
      </div>
    </div>`;
}
