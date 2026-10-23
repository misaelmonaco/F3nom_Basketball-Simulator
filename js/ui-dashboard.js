"use strict";

/* Dashboard: bacheca, cronologia premi, riepilogo stagione, pannello dei tratti. */

function renderTrophyCase(targetId) {
  const t = player.trophies;
  const items = [
    { icon: "💍", count: t.rings, label: tr("Anelli USA-1", "USA-1 Rings") },
    { icon: "🥇", count: t.domesticTitles, label: tr("Titoli Nazionali", "Domestic Titles") },
    { icon: "🏆", count: t.euroleague, label: "EUROPE-1" },
    { icon: "🏆", count: t.eurocup || 0, label: "EUROPE-2" },
    { icon: "⭐", count: t.mvp, label: "MVP" },
    { icon: "🛡️", count: t.dpoy, label: "DPOY" },
    { icon: "🌟", count: t.allstar, label: "All-Star" },
    { icon: "🧩", count: t.bestFive, label: tr("Miglior Quintetto", "All-League First Team") },
    { icon: "🚀", count: t.bestYoung, label: tr("Miglior Giovane", "Best Young Player") },
    { icon: "🎖️", count: t.roy, label: "Rookie OTY" },
    { icon: "🏅", count: t.finalsMvp, label: "Finals MVP" },
    { icon: "🌎", count: t.worldCupTitles, label: tr("Mondiali Vinti", "World Cups") },
    { icon: "🌍", count: t.eurobasketTitles, label: tr("Europei Vinti", "EuroBaskets") },
    { icon: "🌍", count: t.medals, label: tr("Medaglie Naz.", "National Medals") },
  ];
  el(targetId).innerHTML = items.map(i => `
    <div class="trophy">
      <div class="t-icon">${i.icon}</div>
      <div class="t-count">${i.count}</div>
      <div class="t-label">${i.label}</div>
    </div>`).join("");
}

/* Ordine di visualizzazione delle categorie nella cronologia premi (stesso ordine del palmarès) */
const AWARD_HISTORY_ORDER = [
  "rings", "domesticTitles", "euroleague", "eurocup", "mvp", "dpoy", "allstar", "bestFive", "bestYoung", "roy",
  "finalsMvp", "worldCupTitles", "eurobasketTitles", "medals",
];
const AWARD_HISTORY_META = {
  rings: { icon: "💍", label: "Anelli USA-1", labelEn: "USA-1 Rings" },
  domesticTitles: { icon: "🥇", label: "Titoli Nazionali", labelEn: "Domestic Titles" },
  euroleague: { icon: "🏆", label: "EUROPE-1", labelEn: "EUROPE-1" },
  eurocup: { icon: "🏆", label: "EUROPE-2", labelEn: "EUROPE-2" },
  mvp: { icon: "⭐", label: "MVP", labelEn: "MVP" },
  dpoy: { icon: "🛡️", label: "DPOY", labelEn: "DPOY" },
  allstar: { icon: "🌟", label: "All-Star", labelEn: "All-Star" },
  bestFive: { icon: "🧩", label: "Miglior Quintetto", labelEn: "All-League First Team" },
  bestYoung: { icon: "🚀", label: "Miglior Giovane", labelEn: "Best Young Player" },
  roy: { icon: "🎖️", label: "Rookie OTY", labelEn: "Rookie OTY" },
  finalsMvp: { icon: "🏅", label: "Finals MVP", labelEn: "Finals MVP" },
  worldCupTitles: { icon: "🌎", label: "Mondiali Vinti", labelEn: "World Cups Won" },
  eurobasketTitles: { icon: "🌍", label: "Europei Vinti", labelEn: "EuroBaskets Won" },
  medals: { icon: "🌍", label: "Medaglie con la Nazionale", labelEn: "National Team Medals" },
};

/* Ricostruisce, categoria per categoria, ogni premio vinto in carriera con anno, squadra e lega
   (o Nazionale per i tornei internazionali), scorrendo lo storico completo delle stagioni. */
function buildAwardHistory() {
  const cats = {};
  const push = (key, year, detail) => {
    if (!cats[key]) cats[key] = [];
    cats[key].push({ year, detail });
  };
  player.history.forEach(rec => {
    const clubDetail = `${rec.team.name} (${LEAGUES[rec.league].name})`;
    (rec.awards || []).forEach(a => {
      if (a.startsWith("MVP")) push("mvp", rec.year, clubDetail);
      else if (a === "Difensore dell'Anno") push("dpoy", rec.year, clubDetail);
      else if (a.startsWith("All-Star")) push("allstar", rec.year, clubDetail);
      else if (a.startsWith("Miglior Quintetto")) push("bestFive", rec.year, clubDetail);
      else if (a.startsWith("Miglior Giovane")) push("bestYoung", rec.year, clubDetail);
      else if (a === "Rookie dell'Anno") push("roy", rec.year, clubDetail);
      else if (a === "Finals MVP") push("finalsMvp", rec.year, clubDetail);
    });
    if (rec.champion) {
      if (rec.league === "NBA") push("rings", rec.year, clubDetail);
      else push("domesticTitles", rec.year, clubDetail);
    }
    if (rec.continental && rec.continental.champion) push(rec.continental.competition === "EUROPE-1" ? "euroleague" : "eurocup", rec.year, clubDetail);
    if (rec.offseason && rec.offseason.title === "Impegno con la Nazionale" && rec.offseason.tone === "positive") {
      push("medals", rec.year, tr(`Nazionale ${player.nationality} (torneo estivo)`, `National Team ${player.nationality} (summer tournament)`));
    }
    if (rec.nationalComp) {
      const natDetail = tr(`Nazionale ${player.nationality} (${rec.nationalComp.name})`, `National Team ${player.nationality} (${rec.nationalComp.name})`);
      if (rec.nationalComp.champion) push(rec.nationalComp.kind === "world" ? "worldCupTitles" : "eurobasketTitles", rec.year, natDetail);
      if (rec.nationalComp.medal) push("medals", rec.year, `${natDetail} — ${rec.nationalComp.medal}`);
    }
  });
  return cats;
}

function renderAwardHistory(targetId) {
  const cats = buildAwardHistory();
  const catsHtml = AWARD_HISTORY_ORDER.filter(k => cats[k] && cats[k].length).map(k => {
    const meta = AWARD_HISTORY_META[k];
    const lbl = isEn() && meta.labelEn ? meta.labelEn : meta.label;
    const rows = [...cats[k]].reverse().map(it => `
      <div class="ahr-row"><span class="ahr-year">${it.year}</span><span class="ahr-detail">${it.detail}</span></div>`).join("");
    return `
      <div class="ahr-cat">
        <div class="ahr-head"><span class="ahr-icon">${meta.icon}</span><span class="ahr-label">${lbl}</span><span class="ahr-count">${cats[k].length}</span></div>
        <div class="ahr-list">${rows}</div>
      </div>`;
  }).join("");
  el(targetId).innerHTML = catsHtml || `<p class="small-muted">${tr("Nessun premio vinto finora: la cronologia si popolerà stagione dopo stagione.", "No awards won yet: your history will populate season after season.")}</p>`;
}

const DOMESTIC_STAGES = ["Stagione Regolare", "Quarti", "Semifinale", "Finale", "Campione"];
const DOMESTIC_STAGES_EN = ["Regular Season", "Quarterfinals", "Semifinals", "Finals", "Champion"];
const DOMESTIC_STAGES_NBA = ["Stagione Regolare", "Primo Turno", "Semifinale Conf.", "Finale Conf.", "Finali USA-1", "Campione"];
const DOMESTIC_STAGES_NBA_EN = ["Regular Season", "First Round", "Conf. Semis", "Conf. Finals", "USA-1 Finals", "Champion"];
const CONTINENTAL_STAGES = ["Fase a Gironi", "Playoff", "Final Four", "Finale", "Campione"];
const CONTINENTAL_STAGES_EN = ["Group Stage", "Playoffs", "Final Four", "Final", "Champion"];

function domesticStages(leagueId) {
  if (isEn()) return leagueId === "NBA" ? DOMESTIC_STAGES_NBA_EN : DOMESTIC_STAGES_EN;
  return leagueId === "NBA" ? DOMESTIC_STAGES_NBA : DOMESTIC_STAGES;
}
function continentalStages() {
  return isEn() ? CONTINENTAL_STAGES_EN : CONTINENTAL_STAGES;
}

/* Ricava lo stadio raggiunto dai turni effettivamente giocati nel tabellone */
function stageIndexFromRounds(rounds, champion, maxIdx) {
  if (champion) return maxIdx;
  if (!rounds || !rounds.length) return 0;
  const last = rounds[rounds.length - 1];
  const order = {
    "Quarti di Finale": 1, "Playoff": 1, "Primo Turno": 1,
    "Semifinale": 2, "Semifinale di Conference": 2, "Final Four": 2,
    "Finale di Conference": 3, "Finale": 3,
    "Finali USA-1": 4,
  };
  const idx = order[last.round] || 0;
  // se ha vinto l'ultimo turno giocato è avanzato allo stadio successivo
  return clamp(last.won ? idx + 1 : idx, 0, maxIdx);
}

function domesticStageIndex(rec) {
  return stageIndexFromRounds(rec.playoffRounds, rec.champion, domesticStages(rec.league).length - 1);
}
function continentalStageIndex(rec) {
  if (!rec.continental) return -1;
  return stageIndexFromRounds(rec.continental.rounds, rec.continental.champion, CONTINENTAL_STAGES.length - 1);
}

function campaignTrackerHtml(stages, reachedIdx) {
  return `<div class="campaign-tracker">` + stages.map((s, i) => {
    const state = i < reachedIdx ? "ct-done" : (i === reachedIdx ? "ct-current" : "ct-future");
    const dot = i === reachedIdx ? (reachedIdx === stages.length - 1 ? "🏆" : "●") : "";
    const connector = i < stages.length - 1 ? `<div class="ct-line ${i < reachedIdx ? "ct-line-done" : ""}"></div>` : "";
    return `<div class="ct-step ${state}"><span class="ct-dot">${dot}</span><span class="ct-label">${s}</span></div>${connector}`;
  }).join("") + `</div>`;
}

/* Le statistiche della stagione in caselle: numeri grandi, percentuali sotto */
function statTilesHtml(st) {
  const tile = (v, l) => `<div class="sg-item"><div class="sg-val">${v}</div><div class="sg-lbl">${l}</div></div>`;
  const shots = [
    `${tr("Tiro dal campo", "Field Goals")} <strong>${st.fg}%</strong>${st.fga != null ? ` <span class="small-muted">${st.fgm}/${st.fga}</span>` : ""}`,
    `${tr("Da tre", "3-Point")} <strong>${st.tp}%</strong>${st.tpa != null ? ` <span class="small-muted">${st.tpm}/${st.tpa}</span>` : ""}`,
    `${tr("Liberi", "Free Throws")} <strong>${st.ft}%</strong>${st.fta != null ? ` <span class="small-muted">${st.ftm}/${st.fta}</span>` : ""}`,
  ];
  return `
    <div class="summary-grid stat-tiles">
      ${tile(st.pts, tr("Punti", "Points"))}${tile(st.reb, tr("Rimbalzi", "Rebounds"))}${tile(st.ast, tr("Assist", "Assists"))}${tile(st.stl, tr("Rubate", "Steals"))}${tile(st.blk, tr("Stoppate", "Blocks"))}${tile(st.tov, tr("Palle perse", "Turnovers"))}
    </div>
    <div class="stat-shots">${shots.map(x => `<span>${x}</span>`).join("")}</div>`;
}

function renderSeasonSummary() {
  const body = el("season-summary-body");
  const badge = el("season-badge");

  // durante la postseason la stagione non è ancora archiviata: si mostra quella in corso
  if (player.pendingSeason) { renderLiveSeasonSummary(body, badge); return; }

  const last = player.history[player.history.length-1];
  if (!last) {
    badge.className = "badge idle";
    badge.textContent = tr("In attesa", "Waiting");
    body.innerHTML = `<p class="small-muted">${tr("Premi \"Avanza Stagione\" per iniziare la tua carriera.", "Press \"Play Season\" to begin your career.")}</p>`;
    return;
  }
  badge.className = "badge done";
  badge.textContent = `✅ ${last.age} ${tr("anni", "yo")} · ${last.year}`;
  const stateBar = `<div class="season-state-bar state-done"><span class="ssb-dot"></span> ${tr("STAGIONE CONCLUSA", "SEASON COMPLETED")} — ${last.age} ${tr("anni", "yo")} · ${last.year}</div>`;
  const awardsHtml = last.awards.length ? `<div style="margin-top:8px">${last.awards.map(a=>`<span class="badge gold">🏅 ${a}</span>`).join(" ")}</div>` : "";

  const domesticTracker = `
    <div class="campaign-block">
      <label>${LEAGUES[last.league].name} — ${last.wins}-${last.losses}</label>
      ${campaignTrackerHtml(domesticStages(last.league), domesticStageIndex(last))}
    </div>`;
  const continentalTracker = last.continental ? `
    <div class="campaign-block">
      <label>${last.continental.competition}</label>
      ${campaignTrackerHtml(continentalStages(), continentalStageIndex(last))}
    </div>` : "";
  const nationalTracker = last.nationalComp ? `
    <div class="campaign-block">
      <label>${last.nationalComp.kind === "world" ? "🌎" : "🌍"} ${last.nationalComp.name} ${last.year} — ${player.nationality}</label>
      ${campaignTrackerHtml(NATIONAL_STAGES, nationalStageIndex(last.nationalComp))}
      <p class="small-muted" style="margin-top:6px">${nationalCompOutcomeText(last.nationalComp)}</p>
    </div>` : "";

  body.innerHTML = `
    <div class="season-summary-fade">
    ${stateBar}
    <div class="row">
      <div class="field" style="flex:1"><label>${tr("Squadra / Lega", "Team / League")}</label><div>${teamLabel(last.team)} <span class="small-muted">(${last.team.city} · ${LEAGUES[last.league].name})</span></div></div>
      <div class="field" style="flex:1"><label>${tr("Ruolo Minutaggio", "Role & Minutes")}</label><div>${last.roleLabel} · ${last.mpg} MPG</div></div>
    </div>
    ${domesticTracker}
    ${continentalTracker}
    ${nationalTracker}
    ${statTilesHtml(last)}
    <div class="row" style="margin-top:14px">
      <div class="field" style="flex:1"><label>${tr("Progressione Annuale", "Annual Progression")}</label><div>${last.ovrDelta >= 0 ? "+" : ""}${last.ovrDelta} Overall → ${last.overall}</div></div>
      <div class="field" style="flex:1"><label>${tr("Punti GOAT", "GOAT Points")}</label><div>+${last.goatPoints || 0} → ${player.goatScore || 0} ${tr("totali", "total")}</div></div>
    </div>
    ${last.reputation != null ? `<div class="row">
      <div class="field" style="flex:1"><label>⭐ ${tr("Reputazione", "Reputation")}</label><div>${last.reputation} · ${reputationLabel(last.reputation)}${last.reputationNotes && last.reputationNotes.length ? ` <span class="small-muted">(${last.reputationNotes.join(", ")})</span>` : ""}</div></div>
      ${last.contractBonus ? `<div class="field" style="flex:1"><label>🎯 ${tr("Bonus contrattuali", "Contract Bonuses")}</label><div>+${fmtMoney(last.contractBonus, playerCurrency(player))}</div></div>` : ""}
    </div>` : ""}
    ${awardsHtml}
    ${seasonFocusHtml(last)}
    ${offseasonEventHtml(last)}
    </div>
  `;
}

/* Riepilogo della stagione ancora in corso (postseason non conclusa) */
function renderLiveSeasonSummary(body, badge) {
  const s = player.pendingSeason;
  const ps = player.postseason;
  badge.className = "badge live";
  badge.textContent = `${s.age} ${tr("anni", "yo")} · ${player.year}`;
  const stateBar = `<div class="season-state-bar state-live"><span class="ssb-dot"></span> ${tr("STAGIONE IN CORSO", "SEASON IN PROGRESS")} — ${s.age} ${tr("anni", "yo")} · ${player.year}</div>`;

  if (s.phase === "blocks") {
    const agg = aggregateSeasonBlocks(s.blocks);
    body.innerHTML = `
      <div class="season-summary-fade">
      ${stateBar}
      <div class="row">
        <div class="field" style="flex:1"><label>${tr("Squadra / Lega", "Team / League")}</label><div>${teamLabel(s.team)} <span class="small-muted">(${s.team.city} · ${LEAGUES[s.seasonLeague].name})</span></div></div>
        <div class="field" style="flex:1"><label>${tr("Ruolo in squadra", "Team Role")}</label><div>${teamRoleLabel(s.minutesInfo)} · ${s.minutesInfo.mpg} MPG</div></div>
      </div>
      <div class="row" style="margin-top:14px">
        <div class="field" style="flex:1"><label>${tr("Stagione Regolare", "Regular Season")}</label><div>${s.blocks.length ? tr(`${agg.wins}-${agg.losses} dopo ${s.blocks.length} ${s.blocks.length === 1 ? "tratto" : "tratti"} su ${SEASON_BLOCKS.length}`, `${agg.wins}-${agg.losses} after ${s.blocks.length} of ${SEASON_BLOCKS.length} stretches`) : tr("Non ancora iniziata", "Not started yet")}</div></div>
        <div class="field" style="flex:1"><label>${tr("Statline parziale", "Partial Statline")}</label><div>${s.blocks.length ? `${agg.stats.pts} PTS · ${agg.stats.reb} REB · ${agg.stats.ast} AST · ${agg.gp} ${tr("gare", "GP")}` : "—"}</div></div>
      </div>
      <p class="small-muted" style="margin-top:6px">${tr("La stagione è in corso: torna alla decisione dalla barra in basso.", "Season in progress: return to your pending decision from the bottom bar.")}</p>
      </div>`;
    return;
  }

  const domestic = ps && ps.brackets.find(b => b.kind === "domestic");
  const continental = ps && ps.brackets.find(b => b.kind === "continental");

  const domesticTracker = `
    <div class="campaign-block">
      <label>${LEAGUES[s.seasonLeague].name} — ${s.regular.wins}-${s.regular.losses}${s.regular.madePlayoffs ? tr(" · Qualificati ai Playoff", " · Playoff Berth") : ""}</label>
      ${campaignTrackerHtml(domesticStages(s.seasonLeague), domestic ? stageIndexFromRounds(domestic.results, domestic.champion, domesticStages(s.seasonLeague).length - 1) : 0)}
    </div>`;
  const continentalTracker = continental ? `
    <div class="campaign-block">
      <label>${continental.competition}</label>
      ${campaignTrackerHtml(continentalStages(), stageIndexFromRounds(continental.results, continental.champion, CONTINENTAL_STAGES.length - 1))}
    </div>` : "";

  body.innerHTML = `
    <div class="season-summary-fade">
    ${stateBar}
    <div class="row">
      <div class="field" style="flex:1"><label>${tr("Squadra / Lega", "Team / League")}</label><div>${teamLabel(s.team)} <span class="small-muted">(${s.team.city} · ${LEAGUES[s.seasonLeague].name})</span></div></div>
      <div class="field" style="flex:1"><label>${tr("Ruolo in squadra", "Team Role")}</label><div>${teamRoleLabel(s.minutesInfo)} · ${s.stats.mpg} MPG</div></div>
    </div>
    ${domesticTracker}
    ${continentalTracker}
    ${statTilesHtml(s.stats)}
    <p class="small-muted" style="margin-top:6px">${tr("Premi individuali, progressione e imprevisto estivo verranno assegnati a fine postseason.", "Individual awards, progression, and summer events will be awarded at the end of the postseason.")}</p>
    </div>
  `;
}

/* Riquadro "Imprevisto di Fine Stagione": evento, esito del dado e conseguenze concrete */
function offseasonEventHtml(rec) {
  const o = rec.offseason;
  if (!o) return "";
  return `
    <div class="offseason-box ${o.tone}">
      <div class="ob-head">
        <span class="ob-icon">${o.tone === "positive" ? "🌟" : o.tone === "negative" ? "⚠️" : "🌤️"}</span>
        <div>
          <div class="ob-title">${tr("Imprevisto di Fine Stagione", "Offseason Event")} — ${o.title}</div>
          <div class="ob-cat">${o.category}</div>
        </div>
      </div>
      <div class="ob-narrative">${o.narrative}</div>
      ${o.rollText ? `<div class="ob-roll">🎲 ${o.rollText}</div>` : ""}
      ${o.consequences.length ? `<ul class="ob-cons">${o.consequences.map(c => `<li>${c}</li>`).join("")}</ul>` : ""}
    </div>`;
}

/* Riquadro "Focus della Stagione": mostra la scelta fatta a inizio stagione e, se scattata,
   l'evoluzione dell'archetipo */
function seasonFocusHtml(rec) {
  const sf = rec.seasonFocus;
  if (!sf) return "";
  return `
    <div class="offseason-box neutral">
      <div class="ob-head">
        <span class="ob-icon">${sf.focus.icon}</span>
        <div>
          <div class="ob-title">${tr("Focus della Stagione", "Season Focus")} — ${sf.focus.label}</div>
          <div class="ob-cat">${sf.focus.desc}</div>
        </div>
      </div>
      ${sf.archetypeChanged ? `<div class="ob-roll">🔄 ${tr(`Il tuo stile di gioco si è evoluto: ora sei ${sf.newArchetypeName}!`, `Your playstyle evolved: you are now a ${sf.newArchetypeName}!`)}</div>` : ""}
    </div>`;
}

/* Fasi che occupano l'intera schermata Off-Season invece della card inline in Carriera */
const FULLSCREEN_OFFSEASON_TYPES = ["scenarioDone", "allStarWeekend", "nationalCup", "tradeDeadline", "duoRequest", "lifeEvent", "mentorOffer", "careerGoal", "training", "roleBattle", "injuryChoice", "sponsorOffer", "draft", "draftCombine", "market", "negotiate", "offseasonStatus", "offseasonChoice", "offseasonReveal", "nationalReveal", "seasonFocus", "agentChoice", "playerOption", "seasonBlock", "postseason", "seasonRecap", "summerSpending"];
/* Le fasi che fanno parte del ciclo contrattuale mostrano sempre lo stato "sotto contratto"/"svincolato" */
const OFFSEASON_HUB_TYPES = ["draft", "market", "negotiate", "offseasonStatus", "playerOption", "agentChoice"];

function contractStatusBannerHtml() {
  const hasActiveContract = player.contract && player.contract.yearsRemaining > 0;
  if (hasActiveContract) {
    const cur = playerCurrency(player);
    const salaryTxt = player.contract.salaryPerYear == null ? tr("Borsa di studio", "Scholarship") : `${fmtMoney(player.contract.salaryPerYear, cur)}/${tr("anno", "yr")}`;
    const yearsTxt = player.contract.yearsRemaining === 1 ? tr("1 anno rimanente", "1 year remaining") : tr(`${player.contract.yearsRemaining} anni rimanenti`, `${player.contract.yearsRemaining} years remaining`);
    const clauses = clauseLabels(player.contract.clauses).map(l => (player.contract.optionDecided && l.includes("Player option") ? `${l} ${tr("(esercitata)", "(exercised)")}` : l));
    return `<div class="contract-status-banner locked">🔒 ${tr("Sotto contratto", "Under Contract")} — ${teamLabel(player.team)} · ${yearsTxt} · ${salaryTxt}${player.contract.supermax ? " · 💎 Supermax" : ""}${clauses.length ? ` · ${clauses.join(" · ")}` : ""}</div>`;
  }
  return `<div class="contract-status-banner free">🆓 ${tr("Svincolato — nessun contratto in essere", "Free Agent — no active contract")}</div>`;
}

/* Card di una scelta nella schermata Off-Season (stile "griglia di opzioni") */
function offCardHtml({ idx, icon, iconTone, title, subtitle, desc, tags, staticCard, details }) {
  const tagsHtml = (tags || []).map(t => `<span class="off-card-tag ${t.tone||''}">${t.text}</span>`).join("");
  return `
    <div class="off-card ${staticCard ? 'static' : ''}" ${idx != null ? `data-idx="${idx}"` : ''} ${!staticCard && idx != null ? 'role="button" tabindex="0"' : ''}>
      ${icon ? `<div class="off-card-icon" style="${iconTone ? `background:${iconTone};color:var(--on-accent);` : ''}">${icon}</div>` : ""}
      <div class="off-card-title">${title}</div>
      ${subtitle ? `<div class="off-card-subtitle">${subtitle}</div>` : ""}
      ${desc ? `<div class="off-card-desc">${desc}</div>` : ""}
      ${details ? `<dl class="off-card-details">${details.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>` : ""}
      ${tagsHtml ? `<div class="off-card-tags">${tagsHtml}</div>` : ""}
    </div>`;
}

/* Riga di un tratto già giocato: record, presenze e statline */
function seasonBlockRowHtml(b) {
  const w = getWorkload(b.workload);
  const notes = [];
  if (b.injury) notes.push(`<div class="sb-note bad">${tr(`Infortunio: ${b.games - b.gp} partite saltate`, `Injury: ${b.games - b.gp} games missed`)}</div>`);
  if (b.situation) notes.push(`<div class="sb-note">${b.situation.title} — ${b.situation.text}</div>`);
  if (b.out === "full") notes.push(`<div class="sb-note bad">${tr("Fuori per infortunio per tutto il tratto", "Out injured for the entire stretch")}</div>`);
  if (b.keyGame) notes.push(`<div class="sb-note ${b.keyGame.success ? "" : "bad"}">${b.keyGame.label} vs ${b.keyGame.opponent}: ${b.keyGame.option}, ${b.keyGame.success ? tr("vinta!", "won!") : tr("persa", "lost")}</div>`);
  if (b.behind) notes.push(`<div class="sb-note bad">${tr("Partito dietro nelle gerarchie", "Started behind in the rotation")}${b.regained ? tr(": posto ripreso!", ": spot reclaimed!") : ""}</div>`);
  if (b.adapt != null) notes.push(`<div class="sb-note">${tr("Ambientamento", "Adaptation")} ${b.adapt}/100${b.adapt >= 100 ? tr(" · ti senti a casa", " · settled in") : ""}</div>`);

  return `
    <div class="sb-row">
      <div class="sb-row-main">
        <div class="sb-title-group">
          <span class="sb-name">${b.name}</span>
          <span class="sb-rec">${b.wins}-${b.losses}</span>
        </div>
        <span class="sb-line">${b.stats.pts} PTS · ${b.stats.reb} REB · ${b.stats.ast} AST · ${b.gp}/${b.games} ${tr("gare", "games")}${w && w.icon ? ` · ${w.icon}` : ""}</span>
      </div>
      ${notes.length ? `<div class="sb-notes">${notes.join("")}</div>` : ""}
    </div>`;
}

/* La situazione del tratto, in una modale "evento" */
function openSituationModal(d, situation, def) {
  if (!situation) return;
  renderEventModal({
    tone: "live",
    tag: tr("Situazione di stagione", "Season Situation"),
    meta: def ? def.name : "",
    icon: situation.icon,
    title: situation.title,
    text: situation.desc,
    options: situation.options.map(o => {
      const off = o.available && !o.available(player);
      return { id: o.id, label: o.label, desc: `${o.desc}${off && o.unavailableText ? ` <strong>${o.unavailableText}</strong>` : ""}`, disabled: off, selected: d.situationChoice === o.id };
    }),
    onSelect: id => chooseSeasonSituation(id),
  });
}

/* Tratto di stagione regolare: tratti già giocati, eventuale situazione da risolvere e scelta
   del carico di lavoro per il prossimo tratto */
function renderSeasonBlockPanel(body, d) {
  const s = player.pendingSeason;
  const def = SEASON_BLOCKS[s.blocks.length];
  const agg = aggregateSeasonBlocks(s.blocks);
  const situation = d.situation ? getSituation(d.situation) : null;
  const needsSituation = (situation && !d.situationChoice) || (d.keyGame && !d.keyGameChoice);
  const risk = blockInjuryRisk(player);
  const riskInfo = injuryRiskLabel(risk);

  const playedHtml = s.blocks.length ? `
    <div class="sb-played">${s.blocks.map(seasonBlockRowHtml).join("")}</div>
    <p class="small-muted" style="margin:6px 0 0">${tr("Record parziale", "Current record")} <strong>${agg.wins}-${agg.losses}</strong> · ${agg.stats.pts} PTS · ${agg.stats.reb} REB · ${agg.stats.ast} AST ${tr("in", "in")} ${agg.gp} ${tr("gare", "games")}</p>` : "";

  // la situazione si affronta in una modale: nel pannello resta solo l'invito (o la scelta fatta)
  const chosenSituation = situation && d.situationChoice ? situation.options.find(o => o.id === d.situationChoice) : null;
  const situationHtml = !situation ? "" : chosenSituation
    ? `
      <div class="modal-cta done">
        <div class="modal-cta__text">
          <div class="modal-cta__t">${situation.icon} ${situation.title}</div>
          <div class="modal-cta__s">${tr("Hai scelto", "You chose")}: <strong>${chosenSituation.label}</strong></div>
        </div>
        <span class="modal-cta-badge neutral">🔒 ${tr("Scelta confermata", "Choice confirmed")}</span>
      </div>`
    : modalCtaHtml({ tone: "live", title: `${situation.icon} ${situation.title}`, sub: tr("Prima del prossimo tratto c'è una situazione da gestire.", "There is a situation to handle before the next stretch."), btnId: "btn-open-situation", btnLabel: tr("Affronta la situazione", "Handle situation"), primary: true });

  const dilemmaHtml = d.moralDilemma ? (
    d.moralDilemmaResolved
      ? `
        <div class="modal-cta done">
          <div class="modal-cta__text">
            <div class="modal-cta__t">${d.moralDilemma.icon} ${d.moralDilemma.title}</div>
            <div class="modal-cta__s">${tr("Dilemma morale affrontato: scelta registrata", "Moral dilemma handled: choice recorded")}</div>
          </div>
          <span class="modal-cta-badge neutral">🔒 ${tr("Risolto", "Resolved")}</span>
        </div>`
      : modalCtaHtml({ tone: "live", title: `${d.moralDilemma.icon} ${d.moralDilemma.title}`, sub: d.moralDilemma.tag, btnId: "btn-open-dilemma", btnLabel: tr("Affronta il dilemma", "Face dilemma"), primary: true })
  ) : "";

  const workloadHtml = `
    <p style="margin:12px 0 6px"><strong>${tr("Carico di lavoro", "Workload")} — ${def.name}</strong> ${helpTip("workload")}${def.note ? ` <span class="small-muted">· ${def.note}</span>` : ""}</p>
    <p class="small-muted" style="margin-bottom:8px">Stamina <strong>${player.stamina}</strong> · ${tr("rischio infortuni", "injury risk")} <span class="badge ${riskInfo.tone}">${riskInfo.label}</span></p>
    <div class="sb-options sb-workload">
      ${WORKLOADS.map(w => `
        <button type="button" class="option-card sb-choice" data-workload="${w.id}" ${needsSituation ? "disabled" : ""}>
          <div class="oc-title">${w.icon} ${w.label}</div>
          <div class="oc-desc">${w.desc}</div>
        </button>`).join("")}
    </div>`;

  const goalsHtml = s.goals && s.goals.length ? `<div class="sb-goals"><p class="small-muted" style="margin:0 0 4px">${tr("Obiettivi della società", "Club Goals")}</p>${seasonGoalsListHtml(s.goals)}</div>` : "";
  const adaptHtml = player.adaptation ? `<div class="rb-status behind">🧳 ${tr(`Ambientamento in ${player.adaptation.country}`, `Adapting to ${player.adaptation.country}`)}: ${player.adaptation.level}/100 · ${tr("rendimento", "output")} ${Math.round((adaptationStatMult(player) - 1) * 100)}%</div>` : "";
  const outHtml = d.injuredOut ? `<div class="rb-status behind">🏥 ${tr("Sei fuori per infortunio: questo tratto la squadra lo gioca senza di te.", "You are out injured: the team plays this stretch without you.")}</div>` : "";
  const pressHtml = d.blockInterview ? `<div class="recap-section" style="margin-top:12px"><div class="recap-h">🎤 ${tr("Conferenza stampa", "Press Conference")} · ${def.name}</div>${interviewHtml(d.blockInterview, "data-block-tone", "data-block-follow")}</div>` : "";
  body.innerHTML = `
    ${goalsHtml}
    ${roleBattleStatusHtml(s.roleBattle)}
    ${adaptHtml}
    ${outHtml}
    ${playedHtml}
    ${pressHtml}
    ${situationHtml}
    ${dilemmaHtml}
    ${d.keyGame ? keyGamePanelHtml(d) : ""}
    ${workloadHtml}
    <div class="btn-row">
      <button class="btn btn-secondary" id="btn-sim-season">⏩ ${tr("Simula il resto della stagione", "Simulate rest of season")}</button>
      <button class="btn btn-ghost" id="btn-auto-routine" aria-pressed="${autoRoutineOn(player)}">${ico("bolt")} ${tr("Decido solo i momenti importanti", "Only decide key moments")}: ${autoRoutineOn(player) ? tr("sì", "on") : tr("no", "off")}</button> ${helpTip("autoRoutine")}
    </div>
    ${inSeasonBuyoutHtml(player)}
  `;
  body.querySelectorAll("[data-situation]").forEach(b => b.addEventListener("click", () => chooseSeasonSituation(b.dataset.situation)));
  body.querySelectorAll("[data-keygame]").forEach(b => b.addEventListener("click", () => chooseKeyGame(b.dataset.keygame)));
  body.querySelectorAll("[data-workload]").forEach(b => b.addEventListener("click", () => resolveSeasonBlock(b.dataset.workload)));
  body.querySelectorAll("[data-block-tone]").forEach(b => b.addEventListener("click", () => answerBlockInterview(b.dataset.blockTone)));
  body.querySelectorAll("[data-block-follow]").forEach(b => b.addEventListener("click", () => answerBlockFollowUp(b.dataset.blockFollow)));
  const openSituation = () => openSituationModal(d, situation, def);
  const openKeyGame = () => openKeyGameModal(d);
  const openDilemma = () => openMoralDilemmaModal(d.moralDilemma, () => { d.moralDilemmaResolved = true; });
  const openBlockPress = () => renderPressModal(d.blockInterview, (tone) => answerBlockInterview(tone), (follow) => answerBlockFollowUp(follow));
  if (el("btn-open-situation")) el("btn-open-situation").addEventListener("click", openSituation);
  if (el("btn-open-dilemma") && d.moralDilemma) el("btn-open-dilemma").addEventListener("click", openDilemma);
  if (el("btn-open-keygame")) el("btn-open-keygame").addEventListener("click", openKeyGame);
  const btnOpenPress = body.querySelector("#btn-open-press-modal") || body.querySelector("#btn-reopen-press-modal");
  if (btnOpenPress && d.blockInterview) btnOpenPress.addEventListener("click", openBlockPress);
  // una modale alla volta, ognuna aperta da sola una sola volta: situazione → dilemma → partita chiave → stampa
  const ui = d.modalShown || (d.modalShown = {});
  if (situation && !d.situationChoice && !ui.situation) { ui.situation = true; openSituation(); }
  else if (d.moralDilemma && !d.moralDilemmaResolved && !ui.dilemma) { ui.dilemma = true; openDilemma(); }
  else if (d.keyGame && !d.keyGameChoice && !ui.keyGame) { ui.keyGame = true; openKeyGame(); }
  else if (btnOpenPress && d.blockInterview && !d.blockInterview.answered && !d.blockInterview.dismissed) {
    d.blockInterview.dismissed = true;
    openBlockPress();
  }
  el("btn-sim-season").addEventListener("click", simulateRestOfSeason);
  el("btn-auto-routine").addEventListener("click", toggleAutoRoutine);
  if (el("btn-buyout")) el("btn-buyout").addEventListener("click", buyContractOut);
}
