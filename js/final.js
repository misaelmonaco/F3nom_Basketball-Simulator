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
  if (score >= 415) { grade = "S"; verdict = tr("Leggenda — Hall of Fame", "Legend — Hall of Fame"); }
  else if (score >= 285) { grade = "A"; verdict = tr("Superstar riconosciuta a livello globale", "Globally recognized Superstar"); }
  else if (score >= 130) { grade = "B"; verdict = tr("Ottimo giocatore, protagonista per anni", "All-Star caliber, key protagonist for years"); }
  else if (score >= 80) { grade = "C"; verdict = tr("Onesto mestierante, carriera solida", "Solid journeyman, respectable career"); }
  else if (score >= 40) { grade = "D"; verdict = tr("Comprimario, carriera altalenante", "Role player, up-and-down career"); }
  else { grade = "F"; verdict = tr("Busto del Draft — potenziale inespresso", "Draft Bust — unfulfilled potential"); }
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
  if (pct >= 75) return { pct, elected: true, text: tr(`🏛️ Eletto nella Hall of Fame al primo anno di eleggibilità, con il ${pct}% dei voti.`, `🏛️ First-ballot Hall of Fame inductee with ${pct}% of the vote.`) };
  if (pct >= 50) {
    const wait = Math.ceil((75 - pct) / 6) + 1;
    return { pct, elected: true, text: tr(`🏛️ Eletto nella Hall of Fame al ${wait}° anno di eleggibilità (${pct}% dei voti al primo tentativo).`, `🏛️ Inducted into the Hall of Fame in year ${wait} of eligibility (${pct}% on first ballot).`) };
  }
  return { pct, elected: false, text: tr(`Non eletto nella Hall of Fame: ${pct}% dei voti, ne serviva il 75%.`, `Not inducted into the Hall of Fame: received ${pct}% of the vote (75% required).`) };
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
      <div class="legacy-meter"><div class="legacy-fill" style="width:${hof.pct}%"></div><div class="legacy-mark" title="${tr("Soglia del 75%", "75% Threshold")}"></div></div>
      <p>${hof.text}</p>
    </div>
    <div class="legacy-jerseys">
      ${jerseys.length ? jerseys.map(j => `
        <div class="jersey-banner" style="--c1:${j.team.colors[0]};--c2:${j.team.colors[1]}">
          <div class="jb-num">${player.jerseyNumber}</div>
          <div class="jb-plate">
            <div class="jb-team">${j.team.name}</div>
            <div class="jb-meta">${j.seasons} ${tr("stagioni", "seasons")} · ${j.ppg} PPG${j.titles ? ` · ${j.titles} ${j.titles === 1 ? tr("titolo", "title") : tr("titoli", "titles")}` : ""}</div>
          </div>
        </div>`).join("")
      : `<p class="small-muted">${tr("Nessuna squadra ritira la tua maglia: servono almeno 5 stagioni da protagonista nello stesso club (circa 15 punti di media), oppure titoli vinti da leader.", "No franchise retired your jersey: requires at least 5 starring seasons with the same club, or multiple championships won as a leader.")}</p>`}
    </div>
    ${player.farewellTour ? `<p class="legacy-note">👋 ${tr(`Ritirato nel ${player.farewellTour} al termine di un tour d'addio tra gli applausi.`, `Retired in ${player.farewellTour} after a celebrated farewell tour.`)}</p>` : ""}
    ${player.homecoming ? `<p class="legacy-note">🏠 ${tr(`Ha chiuso la carriera tornando a ${player.homecoming.team}.`, `Closed out his career by returning home to ${player.homecoming.team}.`)}</p>` : ""}
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
  el("final-years").textContent = `${getRoleName(player.role)} (${archetype ? archetype.name : ""}) · ${player.nationality} · ${player.height}cm / ${player.weight}kg · ${tr(`Carriera dai ${player.startAge || 16} ai ${player.age} anni (${player.startYear || CAREER_START_YEAR}-${player.year} · ${player.careerTotals.seasons} stagioni)`, `Career from age ${player.startAge || 16} to ${player.age} (${player.startYear || CAREER_START_YEAR}-${player.year} · ${player.careerTotals.seasons} seasons)`)}`;
  el("final-grade").textContent = grade;
  el("final-grade-ring").style.borderColor = grade === "S" ? "var(--gold)" : grade === "F" ? "var(--red)" : "var(--accent)";
  el("final-grade-ring").style.boxShadow = `0 0 40px ${grade === "S" ? "rgba(255,212,71,.4)" : "var(--accent-glow)"}`;
  el("final-verdict").textContent = verdict;

  const totals = computeCareerTotals(player.history);
  const stats = [
    { v: totals.avg.pts.toFixed(1), l: tr("PPG carriera", "Career PPG") },
    { v: totals.avg.reb.toFixed(1), l: tr("RPG carriera", "Career RPG") },
    { v: totals.avg.ast.toFixed(1), l: tr("APG carriera", "Career APG") },
    { v: totals.avg.stl.toFixed(1), l: tr("SPG carriera", "Career SPG") },
    { v: totals.avg.blk.toFixed(1), l: tr("BPG carriera", "Career BPG") },
    { v: totals.avg.tov.toFixed(1), l: tr("TOV carriera", "Career TOV") },
    { v: Math.max(player.overall, ...player.history.map(h=>h.overall), 0), l: "Peak Overall" },
    { v: player.goatScore || 0, l: tr("👑 Punteggio GOAT", "👑 GOAT Score") },
    { v: player.careerTotals.seasons, l: tr("Stagioni Giocate", "Seasons Played") },
    { v: fmtMoney(player.wealth, playerCurrency(player)), l: tr("Patrimonio Finale", "Final Net Worth") },
    { v: player.popularity, l: tr("Popolarità", "Popularity") },
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
  renderFinalDaily();
  if (player && player.isDaily && el("btn-legacy-career")) {
    el("btn-legacy-career").classList.add("hidden");
  } else if (el("btn-legacy-career")) {
    el("btn-legacy-career").classList.remove("hidden");
  }
  renderAchievementsPage("final-achievements", "career");
  saveCareer();
}

function renderFinalDaily() {
  const box = el("final-daily");
  if (!box) return;
  if (!player || !player.isDaily) {
    box.classList.add("hidden");
    box.innerHTML = "";
    return;
  }
  const res = typeof evaluateDailyPerformance === "function" ? evaluateDailyPerformance(player) : { won: false, grade: "C", score: 500 };
  const dailyData = typeof getDailyData === "function" ? getDailyData() : { streak: 1 };
  box.classList.remove("hidden");
  box.innerHTML = `
    <div class="card daily-final-card">
      <div class="flex-between">
        <div>
          <span class="daily-badge">🔥</span>
          <strong style="font-size:24px; text-transform:uppercase; font-family:var(--font-display);">${player.dailyMeta ? player.dailyMeta.title : "F3nom Daily"}</strong>
        </div>
        <div class="daily-streak-pill">🔥 Streak: ${dailyData.streak} ${tr("giorni", "days")}</div>
      </div>
      <div style="font-size:18px; margin:12px 0 6px; font-weight:700; color:${res.won ? "var(--green)" : "var(--red)"}">
        ${res.won ? tr("🏆 OBIETTIVO GIORNALIERO COMPLETATO!", "🏆 DAILY GOAL COMPLETED!") : tr("❌ OBIETTIVO GIORNALIERO MANCATO", "❌ DAILY GOAL MISSED")}
      </div>
      <p class="small-muted" style="margin-bottom:14px">${player.dailyMeta ? player.dailyMeta.goal : ""}</p>
      <div class="summary-grid" style="grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); margin-bottom:16px;">
        <div class="sg-item"><div class="sg-val">${res.grade}</div><div class="sg-lbl">${tr("Grado Daily", "Daily Grade")}</div></div>
        <div class="sg-item"><div class="sg-val">${res.score}/1000</div><div class="sg-lbl">${tr("Punteggio", "Score")}</div></div>
        <div class="sg-item"><div class="sg-val">${dailyData.streak}</div><div class="sg-lbl">${tr("Striscia Attiva", "Active Streak")}</div></div>
      </div>
      <div class="btn-row">
        <button type="button" class="btn btn-primary" id="btn-share-daily-result">📋 ${tr("Condividi Risultato", "Share Result")}</button>
      </div>
    </div>
  `;
  const shareBtn = box.querySelector("#btn-share-daily-result");
  if (shareBtn && typeof copyDailyResultToClipboard === "function") {
    shareBtn.addEventListener("click", () => copyDailyResultToClipboard(res));
  }
}
