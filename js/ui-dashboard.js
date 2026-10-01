"use strict";

/* Dashboard: bacheca, cronologia premi, riepilogo stagione, pannello dei tratti. */

function renderTrophyCase(targetId) {
  const t = player.trophies;
  const items = [
    { icon: "💍", count: t.rings, label: "Anelli USA-1" },
    { icon: "🥇", count: t.domesticTitles, label: "Titoli Nazionali" },
    { icon: "🏆", count: t.euroleague, label: "EUROPE-1" },
    { icon: "🏆", count: t.eurocup || 0, label: "EUROPE-2" },
    { icon: "⭐", count: t.mvp, label: "MVP" },
    { icon: "🛡️", count: t.dpoy, label: "DPOY" },
    { icon: "🌟", count: t.allstar, label: "All-Star" },
    { icon: "🧩", count: t.bestFive, label: "Miglior Quintetto" },
    { icon: "🚀", count: t.bestYoung, label: "Miglior Giovane" },
    { icon: "🎖️", count: t.roy, label: "Rookie OTY" },
    { icon: "🏅", count: t.finalsMvp, label: "Finals MVP" },
    { icon: "🌎", count: t.worldCupTitles, label: "Mondiali Vinti" },
    { icon: "🌍", count: t.eurobasketTitles, label: "Europei Vinti" },
    { icon: "🌍", count: t.medals, label: "Medaglie Naz." },
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
  rings: { icon: "💍", label: "Anelli USA-1" },
  domesticTitles: { icon: "🥇", label: "Titoli Nazionali" },
  euroleague: { icon: "🏆", label: "EUROPE-1" },
  eurocup: { icon: "🏆", label: "EUROPE-2" },
  mvp: { icon: "⭐", label: "MVP" },
  dpoy: { icon: "🛡️", label: "DPOY" },
  allstar: { icon: "🌟", label: "All-Star" },
  bestFive: { icon: "🧩", label: "Miglior Quintetto" },
  bestYoung: { icon: "🚀", label: "Miglior Giovane" },
  roy: { icon: "🎖️", label: "Rookie OTY" },
  finalsMvp: { icon: "🏅", label: "Finals MVP" },
  worldCupTitles: { icon: "🌎", label: "Mondiali Vinti" },
  eurobasketTitles: { icon: "🌍", label: "Europei Vinti" },
  medals: { icon: "🌍", label: "Medaglie con la Nazionale" },
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
      push("medals", rec.year, `Nazionale ${player.nationality} (torneo estivo)`);
    }
    if (rec.nationalComp) {
      const natDetail = `Nazionale ${player.nationality} (${rec.nationalComp.name})`;
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
    const rows = [...cats[k]].reverse().map(it => `
      <div class="ahr-row"><span class="ahr-year">${it.year}</span><span class="ahr-detail">${it.detail}</span></div>`).join("");
    return `
      <div class="ahr-cat">
        <div class="ahr-head"><span class="ahr-icon">${meta.icon}</span><span class="ahr-label">${meta.label}</span><span class="ahr-count">${cats[k].length}</span></div>
        <div class="ahr-list">${rows}</div>
      </div>`;
  }).join("");
  el(targetId).innerHTML = catsHtml || `<p class="small-muted">Nessun premio vinto finora: la cronologia si popolerà stagione dopo stagione.</p>`;
}

const DOMESTIC_STAGES = ["Stagione Regolare", "Quarti", "Semifinale", "Finale", "Campione"];
const DOMESTIC_STAGES_NBA = ["Stagione Regolare", "Primo Turno", "Semifinale Conf.", "Finale Conf.", "Finali USA-1", "Campione"];
const CONTINENTAL_STAGES = ["Fase a Gironi", "Playoff", "Final Four", "Finale", "Campione"];

function domesticStages(leagueId) { return leagueId === "NBA" ? DOMESTIC_STAGES_NBA : DOMESTIC_STAGES; }

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
    `Tiro dal campo <strong>${st.fg}%</strong>${st.fga != null ? ` <span class="small-muted">${st.fgm}/${st.fga}</span>` : ""}`,
    `Da tre <strong>${st.tp}%</strong>${st.tpa != null ? ` <span class="small-muted">${st.tpm}/${st.tpa}</span>` : ""}`,
    `Liberi <strong>${st.ft}%</strong>${st.fta != null ? ` <span class="small-muted">${st.ftm}/${st.fta}</span>` : ""}`,
  ];
  return `
    <div class="summary-grid stat-tiles">
      ${tile(st.pts, "Punti")}${tile(st.reb, "Rimbalzi")}${tile(st.ast, "Assist")}${tile(st.stl, "Rubate")}${tile(st.blk, "Stoppate")}${tile(st.tov, "Palle perse")}
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
    badge.textContent = "In attesa";
    body.innerHTML = `<p class="small-muted">Premi "Avanza Stagione" per iniziare la tua carriera.</p>`;
    return;
  }
  badge.className = "badge done";
  badge.textContent = `✅ ${last.age} anni · ${last.year}`;
  const stateBar = `<div class="season-state-bar state-done"><span class="ssb-dot"></span> STAGIONE CONCLUSA — ${last.age} anni · ${last.year}</div>`;
  const awardsHtml = last.awards.length ? `<div style="margin-top:8px">${last.awards.map(a=>`<span class="badge gold">🏅 ${a}</span>`).join(" ")}</div>` : "";

  const domesticTracker = `
    <div class="campaign-block">
      <label>${LEAGUES[last.league].name} — ${last.wins}-${last.losses}</label>
      ${campaignTrackerHtml(domesticStages(last.league), domesticStageIndex(last))}
    </div>`;
  const continentalTracker = last.continental ? `
    <div class="campaign-block">
      <label>${last.continental.competition}</label>
      ${campaignTrackerHtml(CONTINENTAL_STAGES, continentalStageIndex(last))}
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
      <div class="field" style="flex:1"><label>Squadra / Lega</label><div>${teamLabel(last.team)} <span class="small-muted">(${last.team.city} · ${LEAGUES[last.league].name})</span></div></div>
      <div class="field" style="flex:1"><label>Ruolo Minutaggio</label><div>${last.roleLabel} · ${last.mpg} MPG</div></div>
    </div>
    ${domesticTracker}
    ${continentalTracker}
    ${nationalTracker}
    ${statTilesHtml(last)}
    <div class="row" style="margin-top:14px">
      <div class="field" style="flex:1"><label>Progressione Annuale</label><div>${last.ovrDelta >= 0 ? "+" : ""}${last.ovrDelta} Overall → ${last.overall}</div></div>
      <div class="field" style="flex:1"><label>Punti GOAT</label><div>+${last.goatPoints || 0} → ${player.goatScore || 0} totali</div></div>
    </div>
    ${last.reputation != null ? `<div class="row">
      <div class="field" style="flex:1"><label>⭐ Reputazione</label><div>${last.reputation} · ${reputationLabel(last.reputation)}${last.reputationNotes && last.reputationNotes.length ? ` <span class="small-muted">(${last.reputationNotes.join(", ")})</span>` : ""}</div></div>
      ${last.contractBonus ? `<div class="field" style="flex:1"><label>🎯 Bonus contrattuali</label><div>+${fmtMoney(last.contractBonus, playerCurrency(player))}</div></div>` : ""}
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
  badge.textContent = `${s.age} anni · ${player.year}`;
  const stateBar = `<div class="season-state-bar state-live"><span class="ssb-dot"></span> STAGIONE IN CORSO — ${s.age} anni · ${player.year}</div>`;

  if (s.phase === "blocks") {
    const agg = aggregateSeasonBlocks(s.blocks);
    body.innerHTML = `
      <div class="season-summary-fade">
      ${stateBar}
      <div class="row">
        <div class="field" style="flex:1"><label>Squadra / Lega</label><div>${teamLabel(s.team)} <span class="small-muted">(${s.team.city} · ${LEAGUES[s.seasonLeague].name})</span></div></div>
        <div class="field" style="flex:1"><label>Ruolo in squadra</label><div>${teamRoleLabel(s.minutesInfo)} · ${s.minutesInfo.mpg} MPG</div></div>
      </div>
      <div class="row" style="margin-top:14px">
        <div class="field" style="flex:1"><label>Stagione Regolare</label><div>${s.blocks.length ? `${agg.wins}-${agg.losses} dopo ${s.blocks.length} ${s.blocks.length === 1 ? "tratto" : "tratti"} su ${SEASON_BLOCKS.length}` : "Non ancora iniziata"}</div></div>
        <div class="field" style="flex:1"><label>Statline parziale</label><div>${s.blocks.length ? `${agg.stats.pts} PTS · ${agg.stats.reb} REB · ${agg.stats.ast} AST · ${agg.gp} gare` : "—"}</div></div>
      </div>
      <p class="small-muted" style="margin-top:6px">La stagione è in corso: torna alla decisione dalla barra in basso.</p>
      </div>`;
    return;
  }

  const domestic = ps && ps.brackets.find(b => b.kind === "domestic");
  const continental = ps && ps.brackets.find(b => b.kind === "continental");

  const domesticTracker = `
    <div class="campaign-block">
      <label>${LEAGUES[s.seasonLeague].name} — ${s.regular.wins}-${s.regular.losses}${s.regular.madePlayoffs ? " · Qualificati ai Playoff" : ""}</label>
      ${campaignTrackerHtml(domesticStages(s.seasonLeague), domestic ? stageIndexFromRounds(domestic.results, domestic.champion, domesticStages(s.seasonLeague).length - 1) : 0)}
    </div>`;
  const continentalTracker = continental ? `
    <div class="campaign-block">
      <label>${continental.competition}</label>
      ${campaignTrackerHtml(CONTINENTAL_STAGES, stageIndexFromRounds(continental.results, continental.champion, CONTINENTAL_STAGES.length - 1))}
    </div>` : "";

  body.innerHTML = `
    <div class="season-summary-fade">
    ${stateBar}
    <div class="row">
      <div class="field" style="flex:1"><label>Squadra / Lega</label><div>${teamLabel(s.team)} <span class="small-muted">(${s.team.city} · ${LEAGUES[s.seasonLeague].name})</span></div></div>
      <div class="field" style="flex:1"><label>Ruolo in squadra</label><div>${teamRoleLabel(s.minutesInfo)} · ${s.stats.mpg} MPG</div></div>
    </div>
    ${domesticTracker}
    ${continentalTracker}
    ${statTilesHtml(s.stats)}
    <p class="small-muted" style="margin-top:6px">Premi individuali, progressione e imprevisto estivo verranno assegnati a fine postseason.</p>
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
          <div class="ob-title">Imprevisto di Fine Stagione — ${o.title}</div>
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
          <div class="ob-title">Focus della Stagione — ${sf.focus.label}</div>
          <div class="ob-cat">${sf.focus.desc}</div>
        </div>
      </div>
      ${sf.archetypeChanged ? `<div class="ob-roll">🔄 Il tuo stile di gioco si è evoluto: ora sei ${sf.newArchetypeName}!</div>` : ""}
    </div>`;
}

/* Fasi che occupano l'intera schermata Off-Season invece della card inline in Carriera */
const FULLSCREEN_OFFSEASON_TYPES = ["allStarWeekend", "tradeDeadline", "duoRequest", "lifeEvent", "mentorOffer", "careerGoal", "training", "roleBattle", "injuryChoice", "sponsorOffer", "draft", "draftCombine", "market", "negotiate", "offseasonStatus", "offseasonChoice", "offseasonReveal", "nationalReveal", "seasonFocus", "agentChoice", "playerOption", "seasonBlock", "postseason", "seasonRecap", "summerSpending"];
/* Le fasi che fanno parte del ciclo contrattuale mostrano sempre lo stato "sotto contratto"/"svincolato" */
const OFFSEASON_HUB_TYPES = ["draft", "market", "negotiate", "offseasonStatus", "playerOption", "agentChoice"];

function contractStatusBannerHtml() {
  const hasActiveContract = player.contract && player.contract.yearsRemaining > 0;
  if (hasActiveContract) {
    const cur = playerCurrency(player);
    const salaryTxt = player.contract.salaryPerYear == null ? "Borsa di studio" : `${fmtMoney(player.contract.salaryPerYear, cur)}/anno`;
    const yearsTxt = player.contract.yearsRemaining === 1 ? "1 anno rimanente" : `${player.contract.yearsRemaining} anni rimanenti`;
    const clauses = clauseLabels(player.contract.clauses).map(l => (player.contract.optionDecided && l.includes("Player option") ? `${l} (esercitata)` : l));
    return `<div class="contract-status-banner locked">🔒 Sotto contratto — ${teamLabel(player.team)} · ${yearsTxt} · ${salaryTxt}${player.contract.supermax ? " · 💎 Supermax" : ""}${clauses.length ? ` · ${clauses.join(" · ")}` : ""}</div>`;
  }
  return `<div class="contract-status-banner free">🆓 Svincolato — nessun contratto in essere</div>`;
}

/* Card di una scelta nella schermata Off-Season (stile "griglia di opzioni") */
function offCardHtml({ idx, icon, iconTone, title, subtitle, desc, tags, staticCard, details }) {
  const tagsHtml = (tags || []).map(t => `<span class="off-card-tag ${t.tone||''}">${t.text}</span>`).join("");
  return `
    <div class="off-card ${staticCard ? 'static' : ''}" ${idx != null ? `data-idx="${idx}"` : ''} ${!staticCard && idx != null ? 'role="button" tabindex="0"' : ''}>
      <div class="off-card-icon" style="${iconTone ? `background:${iconTone};color:var(--on-accent);` : ''}">${icon}</div>
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
  return `
    <div class="sb-row">
      <span class="sb-name">${b.icon} ${b.name}</span>
      <span class="sb-rec">${b.wins}-${b.losses}</span>
      <span class="sb-line">${b.stats.pts} PTS · ${b.stats.reb} REB · ${b.stats.ast} AST <span class="small-muted">· ${b.gp}/${b.games} gare · ${w.icon}</span></span>
      ${b.injury ? `<span class="sb-note bad">🩹 Infortunio: ${b.games - b.gp} partite saltate</span>` : ""}
      ${b.situation ? `<span class="sb-note">${b.situation.icon} ${b.situation.title} — ${b.situation.text}</span>` : ""}
      ${b.out === "full" ? `<span class="sb-note bad">🏥 Fuori per infortunio per tutto il tratto</span>` : ""}
      ${b.keyGame ? `<span class="sb-note ${b.keyGame.success ? "" : "bad"}">${KEY_GAME_KINDS[b.keyGame.kind].icon} ${b.keyGame.label} vs ${b.keyGame.opponent}: ${b.keyGame.option}, ${b.keyGame.success ? "vinta!" : "persa"}</span>` : ""}
      ${b.behind ? `<span class="sb-note bad">⚔️ Partito dietro nelle gerarchie${b.regained ? ": posto ripreso!" : ""}</span>` : ""}
      ${b.adapt != null ? `<span class="sb-note">🧳 Ambientamento ${b.adapt}/100${b.adapt >= 100 ? " · ti senti a casa" : ""}</span>` : ""}
    </div>`;
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
    <p class="small-muted" style="margin:6px 0 0">Record parziale <strong>${agg.wins}-${agg.losses}</strong> · ${agg.stats.pts} PTS · ${agg.stats.reb} REB · ${agg.stats.ast} AST in ${agg.gp} gare</p>` : "";

  const situationHtml = situation ? `
    <div class="sb-situation">
      <p style="margin-bottom:4px"><strong>${situation.icon} ${situation.title}</strong></p>
      <p class="risk-narrative" style="margin:0 0 10px">${situation.desc}</p>
      <div class="sb-options">
        ${situation.options.map(o => {
          const off = o.available && !o.available(player);
          return `
          <button type="button" class="option-card sb-choice ${d.situationChoice === o.id ? "selected-team" : ""}" data-situation="${o.id}" ${off ? "disabled" : ""}>
            <div class="oc-title">${o.label}</div>
            <div class="oc-desc">${o.desc}${off && o.unavailableText ? ` <strong>${o.unavailableText}</strong>` : ""}</div>
          </button>`;
        }).join("")}
      </div>
    </div>` : "";

  const workloadHtml = `
    <p style="margin:12px 0 6px"><strong>Carico di lavoro — ${def.name}</strong> ${helpTip("workload")}${def.note ? ` <span class="small-muted">· ${def.note}</span>` : ""}</p>
    <p class="small-muted" style="margin-bottom:8px">Stamina <strong>${player.stamina}</strong> · rischio infortuni <span class="badge ${riskInfo.tone}">${riskInfo.label}</span></p>
    <div class="sb-options sb-workload">
      ${WORKLOADS.map(w => `
        <button type="button" class="option-card sb-choice" data-workload="${w.id}" ${needsSituation ? "disabled" : ""}>
          <div class="oc-title">${w.icon} ${w.label}</div>
          <div class="oc-desc">${w.desc}</div>
        </button>`).join("")}
    </div>`;

  const goalsHtml = s.goals && s.goals.length ? `<div class="sb-goals"><p class="small-muted" style="margin:0 0 4px">Obiettivi della società</p>${seasonGoalsListHtml(s.goals)}</div>` : "";
  const adaptHtml = player.adaptation ? `<div class="rb-status behind">🧳 Ambientamento in ${player.adaptation.country}: ${player.adaptation.level}/100 · rendimento ${Math.round((adaptationStatMult(player) - 1) * 100)}%</div>` : "";
  const outHtml = d.injuredOut ? `<div class="rb-status behind">🏥 Sei fuori per infortunio: questo tratto la squadra lo gioca senza di te.</div>` : "";
  body.innerHTML = `
    ${goalsHtml}
    ${roleBattleStatusHtml(s.roleBattle)}
    ${adaptHtml}
    ${outHtml}
    ${playedHtml}
    ${situationHtml}
    ${d.keyGame ? keyGamePanelHtml(d) : ""}
    ${workloadHtml}
    <div class="btn-row">
      <button class="btn btn-secondary" id="btn-sim-season">⏩ Simula il resto della stagione</button>
      <button class="btn btn-ghost" id="btn-auto-routine" aria-pressed="${autoRoutineOn(player)}">${ico("bolt")} Decido solo i momenti importanti: ${autoRoutineOn(player) ? "sì" : "no"}</button> ${helpTip("autoRoutine")}
    </div>
  `;
  body.querySelectorAll("[data-situation]").forEach(b => b.addEventListener("click", () => chooseSeasonSituation(b.dataset.situation)));
  body.querySelectorAll("[data-keygame]").forEach(b => b.addEventListener("click", () => chooseKeyGame(b.dataset.keygame)));
  body.querySelectorAll("[data-workload]").forEach(b => b.addEventListener("click", () => resolveSeasonBlock(b.dataset.workload)));
  el("btn-sim-season").addEventListener("click", simulateRestOfSeason);
  el("btn-auto-routine").addEventListener("click", toggleAutoRoutine);
}
