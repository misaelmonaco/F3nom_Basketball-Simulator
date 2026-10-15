"use strict";

/* ================================================================
   RETIREMENT / FINAL SCREEN
   ================================================================ */
function computeCareerGrade() {
  const t = player.trophies;
  const trophyScore = t.rings*25 + t.domesticTitles*12 + t.euroleague*18 + (t.eurocup || 0)*8 + t.mvp*20 + t.dpoy*10 + t.finalsMvp*15 + t.allstar*4
    + t.bestFive*5 + t.bestYoung*3 + t.roy*5 + t.medals*8 + t.worldCupTitles*10 + t.eurobasketTitles*6;
  // i punti a partita sulla scala di prima (vedi legacyStatScale): il voto resta confrontabile
  const gpOf = h => h.gp != null ? h.gp : h.wins + h.losses;
  const gpAll = player.history.reduce((t, h) => t + gpOf(h), 0);
  const avgPts = gpAll ? player.history.reduce((t, h) => t + legacySeasonPts(h) * gpOf(h), 0) / gpAll : 0;
  const peakOvr = Math.max(...player.history.map(h=>h.overall), player.overall);

  // la difficoltà pesa sul voto: a Leggenda la stessa carriera vale di più che a Facile
  const score = (trophyScore + avgPts * 2 + peakOvr * 1.5) * (getDifficulty(player).gradeMult || 1);

  let grade, verdict;
  // soglie tarate a Normale con il giocatore attento: S ≈ 1 carriera su 9, A ≈ 1 su 5
  if (score >= 415) { grade = "S"; verdict = "Leggenda — Hall of Fame"; }
  else if (score >= 285) { grade = "A"; verdict = "Superstar riconosciuta a livello globale"; }
  else if (score >= 130) { grade = "B"; verdict = "Ottimo giocatore, protagonista per anni"; }
  else if (score >= 80) { grade = "C"; verdict = "Onesto mestierante, carriera solida"; }
  else if (score >= 40) { grade = "D"; verdict = "Comprimario, carriera altalenante"; }
  else { grade = "F"; verdict = "Busto del Draft — potenziale inespresso"; }
  return { grade, verdict, score: Math.round(score) };
}

/* ---------- eredità: Hall of Fame e maglie ritirate ----------
   Tutto è ricavato dalla carriera (niente dadi), così il verdetto resta lo stesso a ogni visita. */
function hallOfFameVerdict() {
  const { score } = computeCareerGrade();
  // il sogno realizzato e un tour d'addio portano qualche voto in più
  const dream = player.careerGoal && player.careerGoal.status === "done" && player.careerGoal.id !== "hof" ? 5 : 0;
  const farewell = player.farewellTour ? 3 : 0;
  // il punteggio è riportato alla scala delle carriere più brevi di prima (vedi le soglie del voto)
  const pct = clamp(Math.round((score * 0.81 - 105) / 2.9 + (reputationOf(player) - 50) / 5 + dream + farewell), 0, 99);
  if (pct >= 75) return { pct, elected: true, text: `🏛️ Eletto nella Hall of Fame al primo anno di eleggibilità, con il ${pct}% dei voti.` };
  if (pct >= 50) {
    const wait = Math.ceil((75 - pct) / 6) + 1;
    return { pct, elected: true, text: `🏛️ Eletto nella Hall of Fame al ${wait}° anno di eleggibilità (${pct}% dei voti al primo tentativo).` };
  }
  return { pct, elected: false, text: `Non eletto nella Hall of Fame: ${pct}% dei voti, ne serviva il 75%.` };
}

/* Squadre che ritirano la maglia: tante stagioni da protagonista, o titoli vinti da leader */
function retiredJerseys() {
  const byTeam = {};
  player.history.forEach(h => {
    const t = byTeam[h.team.name] = byTeam[h.team.name] || { team: h.team, seasons: 0, titles: 0, pts: 0, lpts: 0, gp: 0 };
    const gp = h.gp != null ? h.gp : h.wins + h.losses;
    t.seasons++; t.gp += gp; t.pts += h.pts * gp; t.lpts += legacySeasonPts(h) * gp;
    if (h.champion) t.titles++;
    if (h.continental && h.continental.champion) t.titles++;
    if (h.nationalCup && h.nationalCup.champion) t.titles++;
  });
  return Object.values(byTeam)
    .map(t => ({ ...t, ppg: t.gp ? round1(t.pts / t.gp) : 0, lppg: t.gp ? t.lpts / t.gp : 0 }))
    // le soglie sono sulla scala di prima (vedi legacySeasonPts): da protagonista, non da comprimario
    .filter(t => (t.seasons >= 5 && t.lppg >= 19) || (t.seasons >= 4 && t.titles >= 1 && t.lppg >= 15) || (t.seasons >= 3 && t.titles >= 2 && t.lppg >= 14))
    .sort((a, b) => b.seasons - a.seasons);
}

function renderLegacyCard(targetId) {
  const hof = hallOfFameVerdict();
  const jerseys = retiredJerseys();
  el(targetId).innerHTML = `
    <div class="legacy-hof ${hof.elected ? "in" : "out"}">
      <div class="legacy-meter"><div class="legacy-fill" style="width:${hof.pct}%"></div><div class="legacy-mark" title="Soglia del 75%"></div></div>
      <p>${hof.text}</p>
    </div>
    <div class="legacy-jerseys">
      ${jerseys.length ? jerseys.map(j => `
        <div class="jersey-banner" style="--c1:${j.team.colors[0]};--c2:${j.team.colors[1]}">
          <div class="jb-num">${player.jerseyNumber}</div>
          <div class="jb-plate">
            <div class="jb-team">${j.team.name}</div>
            <div class="jb-meta">${j.seasons} stagioni · ${j.ppg} PPG${j.titles ? ` · ${j.titles} ${j.titles === 1 ? "titolo" : "titoli"}` : ""}</div>
          </div>
        </div>`).join("")
      : `<p class="small-muted">Nessuna squadra ritira la tua maglia: servono almeno 5 stagioni da protagonista nello stesso club (circa 15 punti di media), oppure titoli vinti da leader.</p>`}
    </div>
    ${player.farewellTour ? `<p class="legacy-note">👋 Ritirato nel ${player.farewellTour} al termine di un tour d'addio tra gli applausi.</p>` : ""}
    ${player.homecoming ? `<p class="legacy-note">🏠 Ha chiuso la carriera tornando a ${player.homecoming.team}.</p>` : ""}
    ${dynastyHtml(player)}`;
  fillDynastyNames(el(targetId), player);
}

function retirePlayer() {
  if (!player || player.retired) return;
  player.retired = true;
  player.pendingDecision = null;
  renderFinalScreen();
}

function renderFinalScreen() {
  el("screen-game").classList.add("hidden");
  el("screen-offseason").classList.add("hidden");
  el("screen-final").classList.remove("hidden");

  // a fine carriera si chiudono il sogno e i traguardi che si decidono al ritiro
  evaluateCareerGoal(player, null);
  scenarioCheckpoint(player, "retire");
  checkAchievements(player);
  archiveCareer(player);

  const { grade, verdict } = computeCareerGrade();
  const archetype = getArchetype(player.role, player.archetypeId);
  el("final-name").textContent = `#${player.jerseyNumber} ${player.firstName} ${player.lastName}`;
  el("final-years").textContent = `${getRoleName(player.role)} (${archetype ? archetype.name : ""}) · ${player.nationality} · ${player.height}cm / ${player.weight}kg · Carriera dai ${player.startAge || 16} ai ${player.age} anni (${player.startYear || CAREER_START_YEAR}-${player.year} · ${player.careerTotals.seasons} stagioni)`;
  el("final-grade").textContent = grade;
  el("final-grade-ring").style.borderColor = grade === "S" ? "var(--gold)" : grade === "F" ? "var(--red)" : "var(--accent)";
  el("final-grade-ring").style.boxShadow = `0 0 40px ${grade === "S" ? "rgba(255,212,71,.4)" : "var(--accent-glow)"}`;
  el("final-verdict").textContent = verdict;

  const totals = computeCareerTotals(player.history);
  const stats = [
    { v: totals.avg.pts.toFixed(1), l: "PPG carriera" },
    { v: totals.avg.reb.toFixed(1), l: "RPG carriera" },
    { v: totals.avg.ast.toFixed(1), l: "APG carriera" },
    { v: totals.avg.stl.toFixed(1), l: "SPG carriera" },
    { v: totals.avg.blk.toFixed(1), l: "BPG carriera" },
    { v: totals.avg.tov.toFixed(1), l: "TOV carriera" },
    { v: Math.max(player.overall, ...player.history.map(h=>h.overall), 0), l: "Peak Overall" },
    { v: player.goatScore || 0, l: "👑 Punteggio GOAT" },
    { v: player.careerTotals.seasons, l: "Stagioni Giocate" },
    { v: fmtMoney(player.wealth, playerCurrency(player)), l: "Patrimonio Finale" },
    { v: player.popularity, l: "Popolarità" },
  ];
  el("final-stats-grid").innerHTML = stats.map(x => `
    <div class="sg-item"><div class="sg-val">${x.v}</div><div class="sg-lbl">${x.l}</div></div>
  `).join("");

  renderTrophyCase("final-trophy-grid");
  renderAwardHistory("final-award-history");
  renderHistoryTable("final-history-tbody");
  renderCareerTotals("final-career-totals");
  renderCareerRecords("final-career-records");
  renderCareerChart("final-career-chart");
  renderLegacyCard("final-legacy");
  renderAfterCareer("final-after-career");
  renderBiography("final-biography");
  renderTrophyRoom("final-trophy-room", true);
  el("final-career-goal").innerHTML = player.careerGoal && !player.scenario ? careerGoalCardHtml(player) : "";
  renderFinalScenario();
  renderAchievementsPage("final-achievements", "career");
  saveCareer();
}
