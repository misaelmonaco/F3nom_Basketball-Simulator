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
  { id: "three", label: "Gara del tiro da tre", attr: "shooting", min: 80, desc: "Cinque postazioni, venticinque palloni, un minuto. Conta solo la mano." },
  { id: "dunk", label: "Gara delle schiacciate", attr: "athleticism", min: 82, desc: "Due schiacciate a testa davanti alla giuria: servono gambe e fantasia." },
  { id: "rising", label: "Partita delle giovani promesse", attr: null, min: 0, desc: "I migliori giovani della lega in campo insieme: una vetrina per farsi notare." },
];

function allStarContestsFor(p) {
  return ALLSTAR_CONTESTS.filter(c => c.id === "rising" ? p.age <= 22 && p.yearsPro <= 3 : p.attrs[c.attr] >= c.min);
}
function allStarWinChance(p, c) {
  if (c.id === "rising") return clamp(35 + (p.overall - LEAGUES[p.league].avgOverall) * 2, 20, 70);
  return clamp(20 + (p.attrs[c.attr] - c.min) * 3, 15, 65);
}

/* Si viene invitati solo nei campionati professionistici, e non tutti gli anni */
function allStarInvite(p, s) {
  if (s.seasonLeague === "NCAA" || s.allStarDone) return null;
  const contests = allStarContestsFor(p);
  if (!contests.length || !rollChance(55)) return null;
  return contests.map(c => c.id);
}

/* La scadenza del mercato: solo in NBA. Se la tua squadra perde e tu sei forte, una
   pretendente ti vuole per la corsa al titolo; se giochi poco, una squadra in ricostruzione
   ti offre più spazio. */
function tradeDeadlineOffer(p, s) {
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

/* La prossima decisione di metà stagione, se ce n'è una (una per tipo, una sola volta) */
function midSeasonDecision() {
  const s = player.pendingSeason;
  if (!s || s.blocks.length !== MIDSEASON_AFTER_BLOCK || s.blocksOut > 0) return null;
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
    toast("Weekend di riposo: stamina +8 per la volata finale.");
  } else {
    const c = ALLSTAR_CONTESTS.find(x => x.id === contestId);
    const won = rollChance(allStarWinChance(p, c));
    p.stamina = clamp(p.stamina - 3, 0, 100);
    p.popularity = clamp(p.popularity + (won ? 8 : 3), 0, 100);
    s.allStarContest = { id: c.id, label: c.label, won };
    p.allStarContests = p.allStarContests || [];
    p.allStarContests.push({ year: p.year, id: c.id, label: c.label, won });
    const text = won ? `Weekend delle stelle: vinci la ${c.label.toLowerCase()}! Popolarità +8.` : `Weekend delle stelle: ${c.label.toLowerCase()}, buona prova ma vince un altro. Popolarità +3.`;
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
    p.chemistry = clamp(randInt(50, 62), 0, 100);
    p.coachTrust = 50;
    p.starRapport = 50;
    p.morale = clamp(p.morale + (o.kind === "contender" ? 6 : 3), 0, 100);
    const text = `Scadenza del mercato: ceduto a ${o.team.name}. Finisci la stagione con la nuova maglia (${mi.label}).`;
    toast(text);
    pushNews(text);
  } else {
    p.chemistry = clamp(p.chemistry + 4, 0, 100);
    changeCoachTrust(p, 3);
    pushNews(`Scadenza del mercato: resti a ${p.team.name}. Lo spogliatoio apprezza.`);
  }
  continueAfterMidSeason();
}

/* ---------- schermate ---------- */
function renderAllStarWeekend(d, titleEl, subEl, cards) {
  el("off-eyebrow").textContent = "METÀ STAGIONE";
  titleEl.textContent = "Il weekend delle stelle";
  subEl.textContent = `${LEAGUES[player.pendingSeason.seasonLeague].name}: sei stato invitato alle gare del weekend di metà stagione. Partecipi o ne approfitti per riposare?`;
  const list = d.contests.map(id => ALLSTAR_CONTESTS.find(c => c.id === id));
  cards.innerHTML = list.map((c, i) => offCardHtml({ idx: i, title: c.label, subtitle: `Probabilità di vincere: ${allStarWinChance(player, c)}%`, desc: c.desc,
    tags: [{ text: "Popolarità", tone: "blue" }] })).join("")
    + offCardHtml({ idx: "rest", title: "Riposare", subtitle: "Stamina +8", desc: "Niente gare: qualche giorno lontano dal parquet, per arrivare fresco alla volata finale." });
  cards.querySelectorAll(".off-card").forEach(c => c.addEventListener("click", () => resolveAllStarWeekend(c.dataset.idx === "rest" ? null : list[parseInt(c.dataset.idx)].id)));
}

function renderTradeDeadline(d, titleEl, subEl, cards) {
  const o = d.offer;
  el("off-eyebrow").textContent = "SCADENZA DEL MERCATO";
  titleEl.textContent = `${o.team.name} ti vuole subito`;
  subEl.textContent = o.kind === "contender"
    ? `${player.team.name} fatica in classifica. ${o.team.name} punta al titolo e ti vuole per la volata finale e i playoff.`
    : `A ${player.team.name} trovi poco spazio. ${o.team.name} è in ricostruzione e ti offre minuti veri da subito.`;
  const strength = Math.round(o.strength * 100);
  cards.innerHTML = offCardHtml({ idx: 0, title: `Accetta: vai a ${o.team.name}`, subtitle: `Forza della squadra ${strength} · contratto invariato`,
      desc: "Cambi maglia a stagione in corso: chimica, fiducia del coach e intesa con la stella ripartono da capo.", tags: [{ text: o.kind === "contender" ? "Corsa al titolo" : "Più minuti", tone: "gold" }] })
    + offCardHtml({ idx: 1, title: `Resta a ${player.team.name}`, subtitle: "Chimica +4 · fiducia del coach +3",
      desc: "Rifiuti la cessione e finisci la stagione con i tuoi compagni." });
  cards.querySelectorAll(".off-card").forEach(c => c.addEventListener("click", () => resolveTradeDeadline(c.dataset.idx === "0")));
}
