"use strict";

/* ================================================================
   INTERFACCIA — intestazione, linea del tempo della stagione, barra d'azione,
   scheda giocatore e notizie. Tutte le decisioni vivono nella schermata "momento"
   (#screen-offseason); la dashboard è di sola consultazione.
   ================================================================ */
let uiPeek = false; // l'utente sta guardando la dashboard mentre una decisione è in sospeso
let lastMomentKey = null; // ultimo "momento" mostrato: quando cambia si torna in cima alla pagina

/* Etichetta breve della decisione in sospeso, per il pulsante "Torna a" */
/* Icona SVG dello sprite in index.html (stile a tratto, colore del testo) */
function ico(name) { return `<svg class="ico" aria-hidden="true"><use href="#i-${name}"></use></svg>`; }

function decisionLabel(d) {
  const labels = {
    seasonFocus: "focus della stagione", seasonBlock: "stagione regolare", postseason: "postseason",
    offseasonChoice: "imprevisto estivo", offseasonReveal: "imprevisto estivo", draft: "Draft NBA", draftCombine: "Draft NBA",
    market: "mercato", negotiate: "trattativa", offseasonStatus: "pre-stagione", nationalReveal: "Nazionale",
    agentChoice: "scelta dell'agente", playerOption: "player option", seasonRecap: "resoconto della stagione", summerSpending: "investimenti dell'estate",
    careerGoal: "sogno di carriera", training: "allenamento estivo", roleBattle: "sfida per il posto",
  };
  if (d.type === "postseason") { const b = currentBracket(); if (b) return phaseLabel(b); }
  return labels[d.type] || "decisione";
}

/* Le tappe della stagione, con lo stato di ciascuna: done, current, future o skipped */
function seasonTimeline() {
  const d = player.pendingDecision, s = player.pendingSeason, ps = player.postseason;
  // il sogno di carriera si sceglie prima che la stagione cominci, come se fosse ancora da giocare
  const preSeason = !!d && d.type === "careerGoal";
  const inSeason = !!d && ["seasonFocus", "roleBattle", "seasonBlock", "postseason"].includes(d.type);
  const inSummer = !!d && !inSeason && !preSeason;
  const upcoming = !d || preSeason;
  const last = player.history[player.history.length - 1];
  const rec = inSummer ? last : null;
  const year = upcoming ? player.year + 1 : player.year;
  const team = s ? s.team : player.team;
  const league = s ? s.seasonLeague : player.league;

  const steps = SEASON_BLOCKS.map((b, i) => ({ key: b.id, num: i + 1, label: b.name.replace(" Stagione", "") }));
  steps.push({ key: "domestic", icon: "ball", label: "Playoff" });
  const hasCup = rec ? !!rec.continental : ps ? ps.brackets.some(b => b.kind === "continental") : !!(team.euro && LEAGUES[league].continent === "Europa");
  const cupBracket = ps && ps.brackets.find(b => b.kind === "continental");
  const cupName = rec ? (rec.continental && rec.continental.competition) : cupBracket ? cupBracket.competition : team.euro === "EL" ? "EuroLeague" : "EuroCup";
  if (hasCup) steps.push({ key: "continental", icon: "stadium", label: cupName });
  const tournament = isWorldCupYear(year) ? "Mondiale" : (isEurobasketYear(year) && EUROPEAN_NATIONALITIES.includes(player.nationality)) ? "EuroBasket" : null;
  const hasNational = rec ? !!rec.nationalComp : ps ? ps.brackets.some(b => b.kind === "national") : !!(tournament && nationalTeamEligible(player));
  if (hasNational) steps.push({ key: "national", icon: "pennant", label: tournament || "Nazionale" });
  steps.push({ key: "summer", icon: "sun", label: "Estate" });

  let cur = -1;
  if (d && (d.type === "seasonFocus" || d.type === "roleBattle" || preSeason)) cur = 0;
  else if (d && d.type === "seasonBlock") cur = s.blocks.length;
  else if (d && d.type === "postseason") { const b = currentBracket(); cur = steps.findIndex(x => x.key === (b ? b.kind : "domestic")); }
  else if (inSummer) cur = steps.length - 1;

  // fasi a cui non si è partecipato (playoff mancati, coppa senza Nazionale...)
  const skipped = key => {
    if (key !== "domestic") return false;
    if (rec) return !rec.playoffRounds;
    if (ps) return !ps.brackets.some(b => b.kind === "domestic");
    return false;
  };
  steps.forEach((x, i) => { x.status = i < cur ? (skipped(x.key) ? "skipped" : "done") : i === cur ? "current" : "future"; });
  return { year, steps, upcoming };
}

function seasonTimelineHtml() {
  const t = seasonTimeline();
  return `
    <div class="tl-head"><span class="tl-year">Stagione ${t.year}</span>${t.upcoming ? `<span class="tl-note">pronta a iniziare</span>` : ""}</div>
    <ol class="tl-steps">${t.steps.map(x => `
      <li class="tl-step ${x.status}" ${x.status === "current" ? 'aria-current="step"' : ""}>
        <span class="tl-dot">${x.status === "done" ? "✓" : x.status === "skipped" ? "–" : x.num || ico(x.icon)}</span>
        <span class="tl-label">${x.label}</span>
      </li>`).join("")}
    </ol>`;
}

/* Intestazione compatta: chi sei, dove giochi, i tre numeri che contano */
function renderHeader() {
  el("g-avatar").textContent = (player.firstName[0] || "") + (player.lastName[0] || "");
  el("g-name").textContent = `${player.firstName} ${player.lastName}`;
  el("g-meta").innerHTML = `${teamLabel(player.team)} · ${LEAGUES[player.league].name} · ${player.age} anni`;
  el("g-head-stats").innerHTML = `
    <div class="hs-item hs-ovr" style="background:${overallColor(player.overall)}"><span class="hs-val">${player.overall}</span><span class="hs-lbl">OVR ${helpTip("overall")}</span></div>
    <div class="hs-item"><span class="hs-val">${player.potential}</span><span class="hs-lbl">POT ${helpTip("potential")}</span></div>
    <div class="hs-item"><span class="hs-val">${player.goatScore || 0}</span><span class="hs-lbl">GOAT ${helpTip("goat")}</span></div>`;
}

/* Aiuto contestuale: una "?" accanto alle voci meno ovvie apre una breve spiegazione */
const HELP_TEXTS = {
  overall: "Il tuo livello attuale (40-99). Decide minuti, statistiche e interesse delle squadre.",
  potential: "Il tetto che puoi raggiungere crescendo. Prestazioni scarse da giovane possono abbassarlo.",
  goat: "Punteggio di carriera: somma di rendimento (pesato sul livello della lega), successi di squadra, premi e Nazionale.",
  morale: "Il tuo umore: accelera o frena la crescita. Sale con vittorie e buone scelte, scende con estati turbolente.",
  chemistry: "Il rapporto con lo spogliatoio. Pesa su alcuni eventi e si ricostruisce col tempo e con le vittorie.",
  popularity: "Quanto ti conoscono media e tifosi: porta sponsor e voti per l'All-Star.",
  stamina: "Le energie: cala giocando (soprattutto con carico alto), si ricarica d'estate. Bassa = più infortuni e meno rendimento.",
  fragility: "Quanto il tuo corpo è a rischio: sale con infortuni e carichi alti, scende col riposo e il preparatore atletico.",
  reputation: "La stima delle società (diversa dalla popolarità): pesa su offerte, ingaggi, trattative, trade e Hall of Fame.",
  coachTrust: "Quanto l'allenatore si fida di te: oltre 80 guadagni minuti, sotto 25 li perdi.",
  starRapport: "L'intesa con la stella della squadra: alta aiuta a vincere, bassa rovina la chimica.",
  patience: "Ogni richiesta respinta consuma la pazienza della dirigenza: a zero l'offerta viene ritirata.",
  adaptation: "Quanto ti sei ambientato nel nuovo paese: finché non arriva a 100 rendi un po' meno e la lontananza pesa sul morale.",
};
function helpTip(key) {
  return `<button type="button" class="help-tip" data-help="${key}" aria-label="Cos'è?" aria-expanded="false">?</button>`;
}
function initHelpTips() {
  const pop = document.createElement("div");
  pop.className = "help-pop hidden";
  pop.setAttribute("role", "tooltip");
  document.body.appendChild(pop);
  let current = null;
  const close = () => { pop.classList.add("hidden"); if (current) current.setAttribute("aria-expanded", "false"); current = null; };
  document.addEventListener("click", evt => {
    const btn = evt.target instanceof Element ? evt.target.closest(".help-tip") : null;
    if (!btn) { if (!(evt.target instanceof Element && evt.target.closest(".help-pop"))) close(); return; }
    evt.stopPropagation();
    if (current === btn) { close(); return; }
    close();
    current = btn;
    pop.textContent = HELP_TEXTS[btn.dataset.help] || "";
    pop.classList.remove("hidden");
    btn.setAttribute("aria-expanded", "true");
    const r = btn.getBoundingClientRect();
    const left = clamp(r.left + window.scrollX - 110, 8, window.scrollX + document.documentElement.clientWidth - 248);
    pop.style.left = `${left}px`;
    pop.style.top = `${r.bottom + window.scrollY + 8}px`;
  }, true);
  document.addEventListener("keydown", evt => { if (evt.key === "Escape") close(); });
}

/* Barra d'azione fissa: sempre e solo il prossimo passo */
function renderActionBar() {
  const bar = el("action-bar");
  const d = player.pendingDecision;
  if (d) {
    bar.innerHTML = `<button class="btn btn-primary btn-lg ab-main" id="ab-back">${ico("back")} Torna a: ${decisionLabel(d)}</button>`;
    el("ab-back").addEventListener("click", () => { uiPeek = false; renderGameScreen(); });
    return;
  }
  const canTrade = player.league === "NBA" && player.tradeRequestYear !== player.year;
  bar.innerHTML = `
    <button class="btn btn-primary btn-lg ab-main" id="ab-advance">${ico("play")} Gioca la stagione ${player.year + 1}${player.farewellTour === player.year + 1 ? " · l'ultima" : ""}</button>
    <div class="ab-secondary">
      ${player.league === "NBA" ? `<button class="btn btn-ghost" id="ab-trade" ${canTrade ? "" : "disabled"}>${ico("swap")} Chiedi la cessione</button>` : ""}
      <button class="btn btn-ghost" id="ab-export">${ico("download")} Esporta</button>
      ${canAnnounceFarewell(player) ? `<button class="btn btn-ghost" id="ab-farewell">👋 Annuncia l'ultima stagione</button>` : ""}
      <button class="btn btn-ghost" id="ab-retire">${ico("flag")} Ritirati</button>
    </div>`;
  el("ab-advance").addEventListener("click", advanceSeason);
  if (player.league === "NBA") el("ab-trade").addEventListener("click", requestTrade);
  el("ab-export").addEventListener("click", exportCareer);
  el("ab-retire").addEventListener("click", onRetireClick);
  if (canAnnounceFarewell(player)) el("ab-farewell").addEventListener("click", onFarewellClick);
}

function onRetireClick() {
  if (!player || player.history.length === 0) { toast("Gioca almeno una stagione prima di ritirarti."); return; }
  if (confirm("Sei sicuro di voler concludere la carriera ora?")) retirePlayer();
}

/* Scheda giocatore nel Profilo: i dettagli tolti dall'intestazione */
function renderProfileCard() {
  const arch = getArchetype(player.role, player.archetypeId);
  const c = player.contract;
  const contract = c && c.yearsRemaining > 0
    ? `${c.yearsRemaining}/${c.yearsTotal} anni${c.salaryPerYear != null ? ` · ${c.salaryPerYear} M${c.currency}/anno` : " · borsa di studio"}${c.supermax ? " · 💎 Supermax" : ""}`
    : "Svincolato";
  const clauses = c ? clauseLabels(c.clauses) : [];
  const agent = getAgent(player);
  const rows = [
    ["Ruolo", `${getRoleName(player.role)}${arch ? ` · ${arch.name}` : ""}`],
    ["Maglia", `#${player.jerseyNumber}`],
    ["Nazionalità", player.nationality],
    ["Fisico", `${player.height} cm · ${player.weight} kg`],
    ["Squadra", `${teamLabel(player.team)} <span class="small-muted">(${LEAGUES[player.league].name})</span>`],
    ["Contratto", contract],
    ...(clauses.length ? [["Clausole", clauses.join(" · ")]] : []),
    ["Agente", player.agentChosen ? `${agent.icon} ${agent.name}` : "Da scegliere a 18 anni"],
    ["Difficoltà", `${getDifficulty(player).icon} ${getDifficulty(player).label}`],
  ];
  el("profile-card").innerHTML = `<dl class="profile-list">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>`;
}

/* Scheda Traguardi: sogno, obiettivi della stagione in corso (o dell'ultima) e collezione */
function renderGoalsTab() {
  el("career-goal-card").innerHTML = careerGoalCardHtml(player);
  const s = player.pendingSeason;
  const last = player.history[player.history.length - 1];
  el("season-goals-card").innerHTML = s && s.goals
    ? `<p class="small-muted" style="margin-bottom:8px">Stagione ${player.year} in corso: la società si aspetta</p>${seasonGoalsListHtml(s.goals)}`
    : last && last.goals ? `<p class="small-muted" style="margin-bottom:8px">Stagione ${last.year}</p>${seasonGoalsListHtml(last.goals, last.goals)}`
    : `<p class="small-muted">La società fisserà gli obiettivi all'inizio di ogni stagione.</p>`;
  renderAchievementsPage("achievements-career", "career");
}

/* Notizie: ogni messaggio del gioco, anche quelli passati in fretta come toast */
function pushNews(text) {
  if (!player) return;
  player.news = player.news || [];
  player.news.unshift({ year: player.year, age: player.age, text });
  if (player.news.length > 60) player.news.length = 60;
}
function renderNewsFeed() {
  const items = (player.news || []).slice(0, 25);
  el("news-feed").innerHTML = items.length
    ? `<ul class="news-list">${items.map(n => `<li><span class="news-when">${n.year}</span><span class="news-text"></span></li>`).join("")}</ul>`
    : `<p class="small-muted">Le notizie della tua carriera appariranno qui.</p>`;
  el("news-feed").querySelectorAll(".news-text").forEach((node, i) => { node.textContent = items[i].text; });
}

function renderGameScreen() {
  renderHeader();
  el("g-timeline").innerHTML = seasonTimelineHtml();
  renderProfileCard();
  renderAttrs();
  renderOffCourt();
  renderTrophyCase("trophy-grid");
  renderAwardHistory("award-history");
  renderSeasonSummary();
  renderStandings();
  renderTeamCard();
  renderNewsFeed();
  renderLog();
  renderHistoryTable("history-tbody");
  renderCareerTotals("career-totals");
  renderCareerRecords("career-records");
  renderCareerChart("career-chart");
  renderGoalsTab();
  renderActionBar();

  // ogni decisione si prende nella schermata "momento"; dalla dashboard ci si torna con la barra d'azione
  const d = player.pendingDecision;
  if (!d) uiPeek = false;
  const showMoment = !!d && FULLSCREEN_OFFSEASON_TYPES.includes(d.type) && !uiPeek;
  el("screen-offseason").classList.toggle("hidden", !showMoment);
  el("screen-game").classList.toggle("hidden", showMoment);
  if (showMoment) renderOffseasonScreen();
  const momentKey = showMoment ? `${d.type}:${d.blockIdx == null ? "" : d.blockIdx}:${d.stage || ""}` : null;
  if (momentKey !== lastMomentKey) {
    if (momentKey && typeof window !== "undefined" && window.scrollTo) window.scrollTo(0, 0);
    lastMomentKey = momentKey;
  }
  saveCareer();
}

function renderAttrs() {
  const labels = { shooting: "Tiro", finishing: "Finalizz.", playmaking: "Playmaking", rebounding: "Rimbalzi", defense: "Difesa", athleticism: "Atletismo" };
  const list = el("attr-list");
  list.innerHTML = Object.entries(player.attrs).map(([k,v]) => `
    <div class="attr-row">
      <div class="al">${labels[k]}</div>
      <div class="abar-wrap"><div class="abar" style="width:${v}%"></div></div>
      <div class="av">${v}</div>
    </div>
  `).join("");
}

/* Barre di stato extra-campo, influenzate dagli imprevisti estivi */
function renderOffCourt() {
  const cur = playerCurrency(player);
  const meters = [
    { label: "Morale", help: "morale", value: player.morale, color: "linear-gradient(90deg,#ef4b56,#35c47a)" },
    { label: "Chimica", help: "chemistry", value: player.chemistry, color: "linear-gradient(90deg,#ef4b56,#3d8bfd)" },
    { label: "Popolarità", help: "popularity", value: player.popularity, color: "linear-gradient(90deg,#3d8bfd,#a06bff)" },
    { label: "Stamina", help: "stamina", value: player.stamina, color: "linear-gradient(90deg,#ffb020,#35c47a)" },
    { label: "Fragilità", help: "fragility", value: player.fragility, color: "linear-gradient(90deg,#35c47a,#ef4b56)" },
    { label: "Reputazione", help: "reputation", value: reputationOf(player), color: "linear-gradient(90deg,#ef4b56,#ffd447)" },
    ...(player.adaptation ? [{ label: "Ambientamento", help: "adaptation", value: player.adaptation.level, color: "linear-gradient(90deg,#ffb020,#3d8bfd)" }] : []),
  ];
  el("offcourt-list").innerHTML = meters.map(m => `
    <div class="attr-row">
      <div class="al">${m.label} ${m.help ? helpTip(m.help) : ""}</div>
      <div class="abar-wrap"><div class="abar" style="width:${m.value}%;background:${m.color}"></div></div>
      <div class="av">${m.value}</div>
    </div>
  `).join("") + `
    <div class="attr-row" style="margin-top:4px">
      <div class="al">Patrimonio</div>
      <div style="flex:1;font-weight:800;color:var(--gold);font-size:.85rem">${fmtMoney(player.wealth, cur)}</div>
    </div>
    ${realEstateTotal(player) ? `<div class="attr-row">
      <div class="al">Immobili</div>
      <div style="flex:1;font-weight:700;color:var(--text-1);font-size:.82rem">${fmtMoney(realEstateTotal(player), cur)} · +5%/anno</div>
    </div>` : ""}
    ${(player.investments || []).some(i => i.type === "startup") ? `<div class="attr-row">
      <div class="al">Startup</div>
      <div style="flex:1;font-weight:700;color:var(--text-1);font-size:.82rem">esito a fine stagione</div>
    </div>` : ""}
    <div class="attr-row">
      <div class="al">Stima</div>
      <div style="flex:1;font-weight:700;color:var(--text-1);font-size:.82rem">${reputationLabel(reputationOf(player))}</div>
    </div>
    <div class="attr-row">
      <div class="al">Agente</div>
      <div style="flex:1;font-weight:700;color:var(--text-1);font-size:.82rem">${player.agentChosen ? `${getAgent(player).icon} ${getAgent(player).name}${getAgent(player).commission ? ` · ${Math.round(getAgent(player).commission * 100)}%` : ""}` : "Da scegliere a 18 anni"}</div>
    </div>
    <div class="attr-row">
      <div class="al">Sponsor</div>
      <div style="flex:1;font-weight:700;color:var(--text-1);font-size:.82rem">${fmtMoney(player.sponsorIncome, cur)}/anno</div>
    </div>`;
}
