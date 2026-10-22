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
    seasonFocus: tr("focus della stagione", "season focus"),
    seasonBlock: tr("stagione regolare", "regular season"),
    postseason: "postseason",
    offseasonChoice: tr("imprevisto estivo", "summer event"),
    offseasonReveal: tr("imprevisto estivo", "summer event"),
    draft: "Draft USA-1",
    draftCombine: "Draft USA-1",
    market: tr("mercato", "free agency"),
    negotiate: tr("trattativa", "contract negotiation"),
    offseasonStatus: tr("pre-stagione", "offseason"),
    nationalReveal: tr("Nazionale", "National Team"),
    agentChoice: tr("scelta dell'agente", "agent selection"),
    playerOption: "player option",
    seasonRecap: tr("resoconto della stagione", "season recap"),
    summerSpending: tr("investimenti dell'estate", "summer investments"),
    careerGoal: tr("sogno di carriera", "career dream"),
    allStarWeekend: tr("weekend delle stelle", "All-Star Weekend"),
    nationalCup: tr("coppa nazionale", "National Cup"),
    tradeDeadline: tr("scadenza del mercato", "trade deadline"),
    training: tr("allenamento estivo", "summer training"),
    roleBattle: tr("sfida per il posto", "role battle"),
    injuryChoice: tr("infortunio", "injury"),
    sponsorOffer: "sponsor",
    lifeEvent: tr("vita privata", "personal life"),
    mentorOffer: tr("un giovane da seguire", "mentoring a rookie"),
    scenarioDone: tr("scenario completato", "scenario completed"),
  };
  if (d.type === "postseason") { const b = currentBracket(); if (b) return phaseLabel(b); }
  return labels[d.type] || tr("decisione", "decision");
}

/* Le tappe della stagione, con lo stato di ciascuna: done, current, future o skipped */
function seasonTimeline() {
  const d = player.pendingDecision, s = player.pendingSeason, ps = player.postseason;
  // il sogno di carriera si sceglie prima che la stagione cominci, come se fosse ancora da giocare
  const preSeason = !!d && (d.type === "careerGoal" || (d.type === "scenarioDone" && d.phase === "start"));
  const inSeason = !!d && ["seasonFocus", "roleBattle", "seasonBlock", "injuryChoice", "postseason", "allStarWeekend", "nationalCup", "tradeDeadline"].includes(d.type);
  const inSummer = !!d && !inSeason && !preSeason;
  const upcoming = !d || preSeason;
  const last = player.history[player.history.length - 1];
  const rec = inSummer ? last : null;
  const year = upcoming ? player.year + 1 : player.year;
  const team = s ? s.team : player.team;
  const league = s ? s.seasonLeague : player.league;

  const blockLabelsEn = { early: "Opening", mid: "Midseason", late: "Final Stretch" };
  const steps = SEASON_BLOCKS.map((b, i) => ({
    key: b.id,
    num: i + 1,
    label: isEn() ? (blockLabelsEn[b.id] || b.name) : b.name.replace(" Stagione", "")
  }));
  steps.push({ key: "domestic", icon: "ball", label: tr("Playoff", "Playoffs") });
  const hasCup = rec ? !!rec.continental : ps ? ps.brackets.some(b => b.kind === "continental") : !!(team.euro && LEAGUES[league].continent === "Europa");
  const cupBracket = ps && ps.brackets.find(b => b.kind === "continental");
  const cupName = rec ? (rec.continental && rec.continental.competition) : cupBracket ? cupBracket.competition : team.euro === "EL" ? "EUROPE-1" : "EUROPE-2";
  if (hasCup) steps.push({ key: "continental", icon: "stadium", label: cupName });
  const tournament = isWorldCupYear(year) ? tr("Mondiale", "World Cup") : (isEurobasketYear(year) && EUROPEAN_NATIONALITIES.includes(player.nationality)) ? tr("Europeo", "EuroBasket") : null;
  const hasNational = rec ? !!rec.nationalComp : ps ? ps.brackets.some(b => b.kind === "national") : !!(tournament && nationalTeamEligible(player));
  if (hasNational) steps.push({ key: "national", icon: "pennant", label: tournament || tr("Nazionale", "National Team") });
  steps.push({ key: "summer", icon: "sun", label: tr("Estate", "Summer") });

  let cur = -1;
  if (d && (d.type === "seasonFocus" || d.type === "roleBattle" || preSeason)) cur = 0;
  else if (d && ["seasonBlock", "allStarWeekend", "nationalCup", "tradeDeadline"].includes(d.type)) cur = s.blocks.length;
  else if (d && d.type === "injuryChoice") cur = Math.max(0, s.blocks.length - 1);
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
    <div class="tl-head"><span class="tl-year">${tr("Stagione", "Season")} ${t.year}</span>${t.upcoming ? `<span class="tl-note">${tr("pronta a iniziare", "ready to start")}</span>` : ""}</div>
    <ol class="tl-steps">${t.steps.map(x => `
      <li class="tl-step ${x.status}" ${x.status === "current" ? 'aria-current="step"' : ""}>
        <span class="tl-dot">${x.status === "done" ? "✓" : x.status === "skipped" ? "–" : x.num || ico(x.icon)}</span>
        <span class="tl-label">${x.label}</span>
      </li>`).join("")}
    </ol>`;
}

/* Intestazione compatta: chi sei, dove giochi, i tre numeri che contano */
function renderHeader() {
  fillAvatar(el("g-avatar"), player);
  el("g-name").textContent = `${player.firstName} ${player.lastName}`;
  el("g-meta").innerHTML = `${teamLabel(player.team)} · ${LEAGUES[player.league].name} · ${player.age} ${tr("anni", "yo")}`;
  el("g-jersey").innerHTML = jerseySvg(player.team, player.jerseyNumber);
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
  teamRole: "Il ruolo che la squadra ti promette (da Stella a Giovane): decide i minuti. In trattativa puoi chiedere un gradino in più.",
  workload: "Quanto spingi nel tratto di stagione: carico alto dà più minuti e statistiche ma consuma stamina e alza il rischio di infortuni; carico ridotto fa il contrario.",
  keyGame: "Una partita decisa all'ultimo possesso: scegli tu l'azione. La percentuale dipende dai tuoi attributi e dalla difesa avversaria.",
  clauses: "Condizioni extra del contratto (per esempio il posto da titolare garantito o l'uscita anticipata). Ognuna si chiede a parte e, se rifiutata, consuma pazienza.",
  buyout: "Se il club non mantiene le promesse sul ruolo, puoi uscire dal contratto pagando una penale: metà dell'ingaggio che resta.",
  draftRights: "Dopo il Draft, se resti nel tuo club, la squadra USA-1 che ti ha scelto conserva i diritti per un anno e ti richiama l'estate dopo.",
  flashOffer: "Un club più forte si fa avanti all'ultimo momento e paga di più, ma scade dopo due mosse sul mercato e in trattativa ha pazienza minima.",
  cups: "Le coppe europee (EUROPE-1 ed EUROPE-2): chi gioca in una squadra iscritta, oltre al campionato, disputa anche la coppa.",
  duo: "Da Stella puoi chiedere alla dirigenza un altro campione: la squadra diventa più forte. Se ti dicono no, per due anni non puoi riprovarci.",
  autoRoutine: "Con questa opzione le decisioni di routine (tratti di stagione tranquilli, resoconti, allenamento e spese d'estate) vanno avanti da sole con una scelta sensata.",
};
const HELP_TEXTS_EN = {
  overall: "Your current rating (40-99). Determines playing time, stats, and team interest.",
  potential: "Your ceiling as you develop. Poor performances at a young age can lower it.",
  goat: "Career legacy score: sum of performance (weighted by league tier), team titles, awards, and National Team honors.",
  morale: "Your mindset: speeds up or slows down development. Rises with wins and good choices, drops after turbulent summers.",
  chemistry: "Your bond with the locker room. Affects events and rebuilds over time and through winning.",
  popularity: "How well media and fans know you: drives endorsement deals and All-Star votes.",
  stamina: "Your energy: drops as you play (especially on heavy workload) and recharges in summer. Low stamina = higher injury risk and lower efficiency.",
  fragility: "Your body's injury risk: increases with injuries and heavy workloads, decreases with rest and a personal trainer.",
  reputation: "Front office respect (distinct from popularity): affects offers, salaries, negotiations, trades, and Hall of Fame odds.",
  coachTrust: "How much the head coach trusts you: above 80 you earn extra minutes, below 25 you lose them.",
  starRapport: "Your chemistry with the team's franchise star: high rapport helps win games, low rapport hurts locker room chemistry.",
  patience: "Every rejected demand drains front office patience: if it hits zero, the offer is pulled from the table.",
  adaptation: "How settled you are in a new country: until it reaches 100 you play slightly below par and homesickness weighs on morale.",
  teamRole: "The role promised by the club (from Franchise Star to Prospect): sets your minutes. In negotiations you can push for one tier higher.",
  workload: "How hard you push during a season stretch: heavy load boosts minutes and stats but drains stamina and raises injury risk; light load does the opposite.",
  keyGame: "A game decided on the final possession: you call the play. Success odds depend on your attributes and the opponent's defense.",
  clauses: "Extra contract clauses (such as guaranteed starter spot or player option). Each is requested separately and drains patience if rejected.",
  buyout: "If the club breaks its role promise, you can buy out your contract by paying a penalty equal to half of your remaining salary.",
  draftRights: "After the Draft, if you stay overseas, the USA-1 team that drafted you retains your rights for a year and calls you back next summer.",
  flashOffer: "A stronger club steps in at the last minute with more money, but the offer expires after two market moves and has minimal negotiation patience.",
  cups: "European cups (EUROPE-1 and EUROPE-2): teams qualified play both their domestic league and the continental cup.",
  duo: "As a Franchise Star you can ask management to sign another star: the roster gets stronger. If declined, you must wait two years to ask again.",
  autoRoutine: "When enabled, routine decisions (quiet season stretches, recaps, summer workouts, and spending) advance automatically with sensible choices.",
};
/* Il nome di ogni voce nel glossario */
const HELP_LABELS = {
  overall: "Overall", potential: "Potenziale", goat: "Punteggio GOAT", morale: "Morale", chemistry: "Chimica", popularity: "Popolarità",
  stamina: "Stamina", fragility: "Fragilità", reputation: "Reputazione", coachTrust: "Fiducia del coach", starRapport: "Intesa con la stella",
  patience: "Pazienza della dirigenza", adaptation: "Ambientamento", teamRole: "Ruolo in squadra", workload: "Carico di lavoro",
  keyGame: "Partita chiave", clauses: "Clausole", buyout: "Buyout", draftRights: "Diritti del Draft", flashOffer: "Offerta lampo",
  cups: "Coppe europee", duo: "Coppia di stelle", autoRoutine: "Decido solo i momenti importanti",
};
const HELP_LABELS_EN = {
  overall: "Overall", potential: "Potential", goat: "GOAT Score", morale: "Morale", chemistry: "Chemistry", popularity: "Popularity",
  stamina: "Stamina", fragility: "Fragility", reputation: "Reputation", coachTrust: "Coach Trust", starRapport: "Star Rapport",
  patience: "Front Office Patience", adaptation: "Adaptation", teamRole: "Team Role", workload: "Workload",
  keyGame: "Clutch Game", clauses: "Clauses", buyout: "Buyout", draftRights: "Draft Rights", flashOffer: "Flash Offer",
  cups: "European Cups", duo: "Star Duo", autoRoutine: "Only decide key moments",
};
function helpTextFor(key) {
  return (isEn() ? HELP_TEXTS_EN[key] : HELP_TEXTS[key]) || HELP_TEXTS[key] || "";
}
function helpLabelFor(key) {
  return (isEn() ? HELP_LABELS_EN[key] : HELP_LABELS[key]) || HELP_LABELS[key] || key;
}
function helpTip(key) {
  return `<button type="button" class="help-tip" data-help="${key}" aria-label="${tr("Cos'è?", "What is this?")}" aria-expanded="false">?</button>`;
}
function initHelpTips() {
  const pop = document.createElement("div");
  pop.className = "help-pop hidden";
  pop.setAttribute("role", "tooltip");
  document.body.appendChild(pop);
  let current = null;
  let hoverOpen = false; // aperta dal passaggio del mouse: il clic la "fissa" invece di chiuderla
  const close = () => { pop.classList.add("hidden"); if (current) current.setAttribute("aria-expanded", "false"); current = null; hoverOpen = false; };
  document.addEventListener("click", evt => {
    const btn = evt.target instanceof Element ? evt.target.closest(".help-tip") : null;
    if (!btn) { if (!(evt.target instanceof Element && evt.target.closest(".help-pop"))) close(); return; }
    evt.stopPropagation();
    if (current === btn) { if (hoverOpen) { hoverOpen = false; return; } close(); return; }
    close();
    current = btn;
    pop.textContent = helpTextFor(btn.dataset.help);
    pop.classList.remove("hidden");
    btn.setAttribute("aria-expanded", "true");
    const r = btn.getBoundingClientRect();
    const left = clamp(r.left + window.scrollX - 110, 8, window.scrollX + document.documentElement.clientWidth - 248);
    pop.style.left = `${left}px`;
    pop.style.top = `${r.bottom + window.scrollY + 8}px`;
  }, true);
  document.addEventListener("keydown", evt => { if (evt.key === "Escape") close(); });
  // col mouse la spiegazione si apre anche solo passandoci sopra
  if (window.matchMedia && window.matchMedia("(hover: hover)").matches) {
    document.addEventListener("mouseover", evt => {
      const btn = evt.target instanceof Element ? evt.target.closest(".help-tip") : null;
      if (!btn || current === btn) return;
      btn.click(); hoverOpen = true;
    });
    document.addEventListener("mouseout", evt => {
      const btn = evt.target instanceof Element ? evt.target.closest(".help-tip") : null;
      if (btn && hoverOpen && current === btn && !(evt.relatedTarget instanceof Element && evt.relatedTarget.closest(".help-pop"))) { close(); hoverOpen = false; }
    });
  }
  // le "?" lampeggiano finché non se ne apre una per la prima volta
  try { if (!localStorage.getItem("chosenOne.helpSeen")) document.body.classList.add("help-new"); } catch (e) { /* niente memoria */ }
  document.addEventListener("click", evt => {
    if (evt.target instanceof Element && evt.target.closest(".help-tip") && document.body.classList.contains("help-new")) {
      document.body.classList.remove("help-new");
      try { localStorage.setItem("chosenOne.helpSeen", "1"); } catch (e) { /* niente memoria */ }
    }
  });
}

/* Barra d'azione fissa: sempre e solo il prossimo passo */
function renderActionBar() {
  const bar = el("action-bar");
  const d = player.pendingDecision;
  if (d) {
    bar.innerHTML = `<button class="btn btn-primary btn-lg ab-main" id="ab-back">${ico("back")} ${tr("Torna a:", "Back to:")} ${decisionLabel(d)}</button>`;
    el("ab-back").addEventListener("click", () => { uiPeek = false; renderGameScreen(); });
    return;
  }
  const canTrade = player.league === "NBA" && player.tradeRequestYear !== player.year;
  const yn = v => v ? tr("sì", "yes") : "no";
  // in vista solo il prossimo passo (e le mosse di carriera); il resto sta nel menu "Altro"
  bar.innerHTML = `
    <button class="btn btn-primary btn-lg ab-main" id="ab-advance">${ico("play")} ${tr("Gioca la stagione", "Play Season")} ${player.year + 1}${player.farewellTour === player.year + 1 ? tr(" · l'ultima", " · Farewell Tour") : ""}</button>
    <div class="ab-secondary">
      ${player.league === "NBA" ? `<button class="btn btn-ghost" id="ab-trade" ${canTrade ? "" : "disabled"}>${ico("swap")} ${tr("Chiedi la cessione", "Request Trade")}</button>` : ""}
      ${canAnnounceFarewell(player) ? `<button class="btn btn-ghost" id="ab-farewell">${tr("Annuncia l'ultima stagione", "Announce Farewell Season")}</button>` : ""}
      <div class="ab-more">
        <button class="btn btn-ghost" id="ab-more-btn" aria-haspopup="true" aria-expanded="false">${ico("more")} ${tr("Altro", "More")}</button>
        <div class="ab-menu hidden" id="ab-menu" role="menu">
          <button class="btn btn-ghost" id="ab-achievements" role="menuitem">${ico("crown")} ${tr("Traguardi", "Achievements")}</button>
          <button class="btn btn-ghost" id="ab-glossary" role="menuitem">${ico("list")} ${tr("Glossario", "Glossary")}</button>
          <button class="btn btn-ghost" id="ab-guide" role="menuitemcheckbox" aria-checked="${guideOn()}">${ico("users")} ${tr("Guida di Coach Mike T:", "Coach Mike T Guide:")} ${yn(guideOn())}</button>
          <button class="btn btn-ghost" id="ab-guide-reset" role="menuitem">${ico("history")} ${tr("Rivedi la guida da capo", "Restart Coach Guide")}</button>
          <button class="btn btn-ghost" id="ab-auto" role="menuitemcheckbox" aria-checked="${autoRoutineOn(player)}">${ico("bolt")} ${tr("Decido solo i momenti importanti:", "Only decide key moments:")} ${yn(autoRoutineOn(player))}</button>
          <button class="btn btn-ghost" id="ab-export" role="menuitem">${ico("download")} ${tr("Esporta la carriera", "Export Career")}</button>
          <button class="btn btn-ghost" data-lang-toggle="label" role="menuitem"></button>
          <button class="btn btn-ghost" data-sound-toggle="label" aria-pressed="false" aria-label="${tr("Attiva i suoni", "Unmute sound")}" role="menuitem"></button>
          <button class="btn btn-ghost" data-theme-toggle="label" aria-label="${tr("Cambia tema", "Switch theme")}" role="menuitem"></button>
          <button class="btn btn-ghost ab-danger" id="ab-retire" role="menuitem">${ico("flag")} ${tr("Ritirati", "Retire")}</button>
        </div>
      </div>
    </div>`;
  el("ab-advance").addEventListener("click", advanceSeason);
  if (player.league === "NBA") el("ab-trade").addEventListener("click", requestTrade);
  el("ab-export").addEventListener("click", exportCareer);
  el("ab-auto").addEventListener("click", toggleAutoRoutine);
  el("ab-glossary").addEventListener("click", openGlossary);
  el("ab-guide").addEventListener("click", toggleGuide);
  el("ab-guide-reset").addEventListener("click", restartGuide);
  el("ab-retire").addEventListener("click", onRetireClick);
  const menu = el("ab-menu"), moreBtn = el("ab-more-btn");
  const setMenu = open => { menu.classList.toggle("hidden", !open); moreBtn.setAttribute("aria-expanded", String(open)); };
  moreBtn.addEventListener("click", evt => { evt.stopPropagation(); setMenu(menu.classList.contains("hidden")); });
  const abAch = el("ab-achievements");
  if (abAch) {
    abAch.addEventListener("click", () => {
      setMenu(false);
      switchGameTab("traguardi");
      if (typeof window !== "undefined" && window.scrollTo) window.scrollTo(0, 0);
    });
  }
  if (!renderActionBar.closerBound && typeof document.addEventListener === "function") {
    renderActionBar.closerBound = true;
    // un clic fuori dal menu (o Esc) lo chiude
    document.addEventListener("click", evt => {
      const m = document.getElementById("ab-menu");
      if (m && !m.classList.contains("hidden") && !(evt.target instanceof Element && evt.target.closest(".ab-more"))) {
        m.classList.add("hidden");
        const b = document.getElementById("ab-more-btn"); if (b) b.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", evt => { if (evt.key === "Escape") { const m = document.getElementById("ab-menu"); if (m) m.classList.add("hidden"); } });
  }
  if (typeof updateLangButtons === "function") updateLangButtons();
  updateSoundButtons();
  updateThemeButtons();
  if (canAnnounceFarewell(player)) el("ab-farewell").addEventListener("click", onFarewellClick);
}

function onRetireClick() {
  if (!player || player.history.length === 0) { toast(tr("Gioca almeno una stagione prima di ritirarti.", "Play at least one season before retiring.")); return; }
  if (confirm(tr("Sei sicuro di voler concludere la carriera ora?", "Are you sure you want to retire and end your career now?"))) retirePlayer();
}

/* Scheda giocatore nel Profilo: i dettagli tolti dall'intestazione */
function renderProfileCard() {
  const arch = getArchetype(player.role, player.archetypeId);
  const c = player.contract;
  const contract = c && c.yearsRemaining > 0
    ? `${c.yearsRemaining}/${c.yearsTotal} ${tr("anni", "yrs")}${c.salaryPerYear != null ? ` · ${fmtMoney(c.salaryPerYear, c.currency)}/${tr("anno", "yr")}` : tr(" · borsa di studio", " · scholarship")}${c.supermax ? " · 💎 Supermax" : ""}${c.teamRole ? ` · ${getTeamRole(c.teamRole).icon} ${getTeamRole(c.teamRole).label}` : ""}`
    : tr("Svincolato", "Free Agent");
  const clauses = c ? clauseLabels(c.clauses) : [];
  const agent = getAgent(player);
  const second = secondaryRoleOf(player);
  const rows = [
    [tr("Ruolo", "Position"), `${getRoleName(player.role)}${arch ? ` · ${arch.name}` : ""}${second ? ` <span class="small-muted">(${tr("anche", "also")} ${second})</span>` : ""}`],
    [tr("Maglia", "Jersey"), `#${player.jerseyNumber}`],
    [tr("Nazionalità", "Nationality"), `${player.nationality}${player.hometown ? ` · 🏠 ${player.hometown}` : ""}`],
    [tr("Fisico", "Frame"), `${player.height} cm · ${player.weight} kg · ${getBodyType(player).label} · ${player.hand === "left" ? tr("mancino", "left-handed") : tr("destro", "right-handed")}`],
    ...((player.traits || []).length ? [[tr("Carattere", "Personality"), traitsText(player)]] : []),
    ...(player.draftRights && !player.inNBA ? [[tr("Diritti USA-1", "USA-1 Rights"), `🎓 ${player.draftRights.team.name} (Draft ${player.draftRights.year}, ${tr("ti richiamerà la prossima estate", "will call you back next summer")})`]] : []),
    [tr("Squadra", "Team"), `${teamLabel(player.team)} <span class="small-muted">(${LEAGUES[player.league].name})</span>`],
    [tr("Contratto", "Contract"), contract],
    ...(clauses.length ? [[tr("Clausole", "Clauses"), clauses.join(" · ")]] : []),
    [tr("Agente", "Agent"), player.agentChosen ? `${agent.icon} ${agent.name}${agent.commission ? ` · ${tr("commissione", "commission")} ${Math.round(agent.commission * 100)}%` : ""}` : tr("Da scegliere a 18 anni", "To be chosen at age 18")],
    [tr("Difficoltà", "Difficulty"), `${getDifficulty(player).icon} ${getDifficulty(player).label}`],
    ...(isCaptain(player) ? [[tr("Fascia", "Captaincy"), `🎖️ ${tr(`Capitano di ${player.captain.team} dal ${player.captain.since}`, `Captain of ${player.captain.team} since ${player.captain.since}`)}`]] : []),
    ...(player.mentee ? [[tr("Allievo", "Mentee"), `🎓 ${player.mentee.name} · OVR ${player.mentee.overall}${player.mentee.active ? "" : tr(" (percorso concluso)", " (mentorship completed)")}`]] : []),
    ...(familyText(player) ? [[tr("Famiglia", "Family"), familyText(player)]] : []),
    ...(lifestyleOwnedText(player) ? [["Lifestyle", lifestyleOwnedText(player)]] : []),
    ...((player.sponsors || []).length ? [["Sponsor", player.sponsors.map(sp => `${sp.brand} (${fmtMoney(sp.amount, playerCurrency(player))}/${tr("anno", "yr")}, ${sp.years} ${sp.years === 1 ? tr("anno", "yr") : tr("anni", "yrs")} · ${sponsorConditionLabel(sp)})`).join("<br>")]] : []),
  ];
  el("profile-card").innerHTML = `<dl class="profile-list">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>`;
}

/* Scheda Traguardi: sogno, obiettivi della stagione in corso (o dell'ultima) e collezione */
function seasonGoalsCardHtml(p) {
  const s = p.pendingSeason;
  const last = p.history[p.history.length - 1];
  return s && s.goals
    ? `<p class="small-muted" style="margin-bottom:8px">${tr(`Stagione ${p.year} in corso: la società si aspetta`, `Season ${p.year} in progress: front office expectations`)}</p>${seasonGoalsListHtml(s.goals)}`
    : last && last.goals ? `<p class="small-muted" style="margin-bottom:8px">${tr("Stagione", "Season")} ${last.year}</p>${seasonGoalsListHtml(last.goals, last.goals)}`
    : `<p class="small-muted">${tr("La società fisserà gli obiettivi all'inizio di ogni stagione.", "The front office will set expectations at the start of each season.")}</p>`;
}
function renderGoalsTab() {
  if (el("career-goal-card")) el("career-goal-card").innerHTML = careerGoalCardHtml(player);
  if (el("season-goals-card")) el("season-goals-card").innerHTML = seasonGoalsCardHtml(player);
  if (el("achievements-career")) renderAchievementsPage("achievements-career", "career");
  const btnBack = el("btn-traguardi-back");
  if (btnBack) btnBack.onclick = () => { switchGameTab("panoramica"); if (typeof window !== "undefined" && window.scrollTo) window.scrollTo(0, 0); };
}

/* Notizie: ogni messaggio del gioco, anche quelli passati in fretta come toast */
function pushNews(text) {
  if (!player) return;
  player.news = player.news || [];
  player.news.unshift({ year: player.year, age: player.age, text });
  if (player.news.length > 60) player.news.length = 60;
  if (typeof onNewsSocial === "function") onNewsSocial(text);
}
function renderNewsFeed() {
  const items = (player.news || []).slice(0, 25);
  el("news-feed").innerHTML = items.length
    ? `<ul class="news-list">${items.map(n => { const m = newsMarker(n.text); return `<li><span class="news-when">${n.year}</span><span class="news-mark ${m.cls}" aria-hidden="true">${m.mark}</span><span class="news-text"></span></li>`; }).join("")}</ul>`
    : `<p class="small-muted">${tr("Le notizie della tua carriera appariranno qui.", "Your career news will appear here.")}</p>`;
  el("news-feed").querySelectorAll(".news-text").forEach((node, i) => { node.textContent = stripEmoji(items[i].text); });
}

function renderGameScreen() {
  renderHeader();
  el("g-timeline").innerHTML = seasonTimelineHtml();
  renderOverview();
  renderProfileCard();
  renderAttrs();
  renderOffCourt();
  renderTrophyCase("trophy-grid");
  renderTrophyRoom("trophy-room", false);
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
  if (typeof renderSocialTab === "function") renderSocialTab();
  if (typeof renderLifestyleTab === "function") renderLifestyleTab();
  else if (typeof renderRelationshipsTab === "function") renderRelationshipsTab();
  renderActionBar();

  // ogni decisione si prende nella schermata "momento"; dalla dashboard ci si torna con la barra d'azione
  const d = player.pendingDecision;
  if (!d) uiPeek = false;
  const showMoment = !!d && FULLSCREEN_OFFSEASON_TYPES.includes(d.type) && !uiPeek;
  el("screen-offseason").classList.toggle("hidden", !showMoment);
  el("screen-game").classList.toggle("hidden", showMoment);
  // fuori dalla schermata del momento le modali di decisione non hanno senso
  if (!showMoment && typeof hideDecisionModals === "function") hideDecisionModals();
  if (showMoment) {
    renderOffseasonScreen();
    renderGuideCard(d); // Coach Mike T, la prima volta di ogni decisione (vedi guide.js)
  }
  const momentKey = showMoment ? `${d.type}:${d.blockIdx == null ? "" : d.blockIdx}:${d.stage || ""}` : null;
  if (momentKey !== lastMomentKey) {
    if (momentKey && typeof window !== "undefined" && window.scrollTo) window.scrollTo(0, 0);
    lastMomentKey = momentKey;
  }
  saveCareer();
  scheduleAutoRoutine(); // "decido solo i momenti importanti" (vedi autoplay.js)
  // fuori dalle decisioni il coach parla solo nel giro della dashboard, la prima volta (vedi guide.js)
  if (!showMoment) { if (tourStep < 0) hideCoach(); maybeStartDashboardTour(); }
}

function renderAttrs() {
  const labels = {
    shooting: tr("Tiro", "Shooting"),
    finishing: tr("Finalizz.", "Finishing"),
    playmaking: "Playmaking",
    rebounding: tr("Rimbalzi", "Rebounding"),
    defense: tr("Difesa", "Defense"),
    athleticism: tr("Atletismo", "Athleticism")
  };
  const list = el("attr-list");
  list.innerHTML = Object.entries(player.attrs).map(([k,v]) => `
    <div class="attr-row">
      <div class="al">${labels[k]}</div>
      <div class="abar-wrap"><div class="abar" style="width:${v}%"></div></div>
      <div class="av">${v}</div>${deltaChip(v, `attrs.${k}`)}
    </div>
  `).join("");
}

/* Patrimonio e sponsor (le barre di stato stanno nella Panoramica) */
function renderOffCourt() {
  const cur = playerCurrency(player);
  const sponsorTotal = roundMoney((player.sponsorIncome || 0) + (player.sponsors || []).reduce((t, sp) => t + sp.amount, 0));
  const row = (k, v, cls) => `<div class="attr-row"><div class="al">${k}</div><div class="ov-money ${cls || ""}">${v}</div></div>`;
  el("offcourt-list").innerHTML = [
    row(tr("Patrimonio", "Net Worth"), fmtMoney(player.wealth, cur), "gold"),
    realEstateTotal(player) ? row(tr("Immobili", "Real Estate"), `${fmtMoney(realEstateTotal(player), cur)} · +5%/${tr("anno", "yr")}`) : "",
    (player.investments || []).some(i => i.type === "startup") ? row("Startup", tr("esito a fine stagione", "outcome at season's end")) : "",
    row("Sponsor", `${fmtMoney(sponsorTotal, cur)}/${tr("anno", "yr")}`),
    row(tr("Stima", "Reputation"), reputationLabel(reputationOf(player))),
  ].join("");
}
