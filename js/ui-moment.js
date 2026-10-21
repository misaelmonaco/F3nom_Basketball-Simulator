"use strict";

/* Schermata "momento": ogni decisione, postseason, timeline della carriera. */

const SUMMER_SPENDING_META = {
  coachTech: {
    category: "Sviluppo Tecnico",
    chips: [
      { text: "Tiro +2", tone: "green" },
      { text: "Finalizzazione +1", tone: "green" },
      { text: "Playmaking +1", tone: "green" },
    ],
  },
  coachPhys: {
    category: "Condizione & Fisico",
    chips: [
      { text: "Atletismo +2", tone: "green" },
      { text: "Fragilità −6", tone: "green" },
      { text: "Stamina +8", tone: "green" },
    ],
  },
  realEstate: {
    category: "Rendita Passiva Fissa",
    chips: [
      { text: "+5% rendita garantita ogni anno", tone: "gold" },
    ],
  },
  startup: {
    category: "Venture Capital",
    chips: [
      { text: "🎲 35% Triplica il capitale", tone: "blue" },
      { text: "⚠️ 65% Rischio perdita", tone: "red" },
    ],
  },
  charity: {
    category: "Filantropia & Tifosi",
    chips: [
      { text: "Reputazione +4", tone: "blue" },
      { text: "Popolarità +3", tone: "gold" },
      { text: "Morale +2", tone: "green" },
    ],
  },
};

function renderSummerSpending(d, titleEl, subEl, cards, extra) {
  const cur = playerCurrency(player);
  titleEl.textContent = "Come investi l'estate?";
  subEl.textContent = `Patrimonio disponibile: ${fmtMoney(player.wealth, cur)}. Scegli una sola opportunità di crescita o investimento per questa estate, oppure conserva i tuoi guadagni.`;

  cards.className = "off-cards off-cards-3col summer-cards";

  const optionsHtml = SUMMER_SPENDING.map((o, i) => {
    const meta = SUMMER_SPENDING_META[o.id] || { category: "Opportunità", chips: [] };
    const cost = summerSpendingCost(player, o);
    const costPercent = Math.round((cost / Math.max(0.1, player.wealth)) * 100);
    const chipsHtml = meta.chips.map(c => `<span class="badge ${c.tone}">${c.text}</span>`).join("");
    return `
      <div class="off-card summer-card" data-idx="${i}" role="button" tabindex="0">
        <div class="summer-card-head">
          <span class="summer-card-cat">${meta.category}</span>
          <span class="summer-card-cost">${fmtMoney(cost, cur)} <small>(${costPercent}%)</small></span>
        </div>
        <div class="off-card-title">${o.title}</div>
        <div class="off-card-desc">${o.desc}</div>
        <div class="summer-card-chips">${chipsHtml}</div>
      </div>`;
  }).join("");

  const noneIdx = SUMMER_SPENDING.length;
  const noneHtml = `
    <div class="off-card summer-card summer-card--save" data-idx="${noneIdx}" role="button" tabindex="0">
      <div class="summer-card-head">
        <span class="summer-card-cat">Gestione Finanziaria</span>
        <span class="summer-card-cost free">0 ${cur} <small>(0%)</small></span>
      </div>
      <div class="off-card-title">Nessuna Spesa</div>
      <div class="off-card-desc">Tieni tutto da parte: il tuo patrimonio resta intatto e disponibile per le prossime estati o per acquisti personali.</div>
      <div class="summer-card-chips">
        <span class="badge blue">Capitale conservato al 100%</span>
      </div>
    </div>`;

  cards.innerHTML = optionsHtml + noneHtml;

  cards.querySelectorAll(".off-card").forEach(c => c.addEventListener("click", () => {
    const idx = parseInt(c.dataset.idx, 10);
    const o = SUMMER_SPENDING[idx];
    resolveSummerSpending(o ? o.id : null);
  }));

  extra.className = "off-extra";
  extra.innerHTML = "";
}

/* Schermata Off-Season a tutto schermo: draft, mercato, trattativa, imprevisti estivi e
   torneo con la Nazionale condividono qui la stessa cornice (mini header giocatore, eyebrow
   "PRE-STAGIONE", titolo/sottotitolo contestuali e una griglia di card cliccabili). */
function renderOffseasonScreen() {
  const d = player.pendingDecision;
  fillAvatar(el("off-avatar"), player);
  el("off-pname").textContent = `${player.firstName} ${player.lastName}`;
  el("off-pmeta").textContent = `${getRoleName(player.role)} · ${player.nationality}`;
  el("off-ovr-val").textContent = player.overall;
  el("off-jersey").innerHTML = jerseySvg(player.team, player.jerseyNumber);
  el("off-eyebrow").textContent = d.type === "seasonFocus" ? "PRE-STAGIONE" : d.type === "roleBattle" ? "TRAINING CAMP" : d.type === "seasonBlock" ? "STAGIONE REGOLARE" : d.type === "postseason" ? "POSTSEASON" : "ESTATE · MERCATO E DECISIONI";
  el("off-timeline").innerHTML = seasonTimelineHtml();
  el("off-status-banner").innerHTML = OFFSEASON_HUB_TYPES.includes(d.type) ? contractStatusBannerHtml() : "";

  const titleEl = el("off-title"), subEl = el("off-subtitle"), cards = el("off-cards"), extra = el("off-extra");
  cards.className = "off-cards";
  cards.innerHTML = "";
  extra.className = "off-extra";
  extra.innerHTML = "";

  if (d.type === "seasonRecap") {
    const rec = player.history[player.history.length - 1];
    el("off-eyebrow").textContent = "RESOCONTO";
    titleEl.textContent = `${rec.champion ? "🏆 " : ""}${d.retireAfter ? "L'ultimo giro" : "La tua stagione"} ${rec.year}`;
    subEl.textContent = d.retireAfter ? "L'ultima stagione del tour d'addio: ovunque applausi. Ecco com'è andata." : rec.champion ? "Una stagione da ricordare: ecco com'è andata." : "Ecco com'è andata, prima di pensare all'estate.";
    extra.className = "off-extra moment-panel";
    renderSeasonRecap(extra, d);
    return;
  }
  if (d.type === "seasonBlock") {
    const def = SEASON_BLOCKS[player.pendingSeason.blocks.length];
    titleEl.textContent = `${def.icon} ${def.name}`;
    subEl.textContent = `${teamLabelText(player.pendingSeason.team)} · ${LEAGUES[player.pendingSeason.seasonLeague].name}. Scegli come affrontare il prossimo tratto di stagione.`;
    extra.className = "off-extra moment-panel";
    renderSeasonBlockPanel(extra, d);
    return;
  }
  if (d.type === "postseason") {
    const b = currentBracket();
    titleEl.textContent = b ? `${PHASE_ICON[b.kind]} ${phaseLabel(b)}` : "Postseason";
    subEl.textContent = b && b.kind === "national" ? `Con la Nazionale ${player.nationality}: ogni partita può valere una medaglia.` : "Gioca un turno alla volta: nelle partite punto a punto decidi tu l'ultimo possesso.";
    extra.className = "off-extra moment-panel";
    renderPostseasonPanel(extra);
    return;
  }

  if (d.type === "roleBattle") {
    renderRoleBattle(d, titleEl, subEl, cards);
    extra.innerHTML += inSeasonBuyoutHtml(player);
    if (el("btn-buyout")) el("btn-buyout").addEventListener("click", buyContractOut);
    return;
  }
  if (d.type === "lifeEvent") { el("off-eyebrow").textContent = "VITA PRIVATA"; renderLifeEvent(d, titleEl, subEl, cards); return; }
  if (d.type === "mentorOffer") { renderMentorOffer(d, titleEl, subEl, cards); return; }
  if (d.type === "injuryChoice") { el("off-eyebrow").textContent = "INFERMERIA"; renderInjuryChoice(d, titleEl, subEl, cards); return; }
  if (d.type === "sponsorOffer") { renderSponsorOffer(d, titleEl, subEl, cards, extra); return; }

  if (d.type === "training") {
    titleEl.textContent = "Allenamento estivo";
    subEl.textContent = "Come usi le settimane di lavoro prima del training camp? Assegna i punti agli attributi o al recupero fisico.";
    extra.className = "off-extra moment-panel";
    renderTrainingPanel(extra, d);
    return;
  }

  if (d.type === "scenarioDone") { renderScenarioDone(d, titleEl, subEl, cards); return; }

  if (d.type === "careerGoal") {
    el("off-eyebrow").textContent = player.history.length ? "UN NUOVO TRAGUARDO" : "INIZIO CARRIERA";
    titleEl.textContent = "Qual è il tuo sogno?";
    subEl.textContent = `Scegli il traguardo che darà una direzione a tutta la carriera. Se lo realizzi: reputazione +${CAREER_GOAL_REWARD.reputation}, popolarità +${CAREER_GOAL_REWARD.popularity}, +${CAREER_GOAL_REWARD.goat} punti GOAT e una spinta verso la Hall of Fame.`;
    cards.innerHTML = d.options.map((id, i) => {
      const g = getCareerGoal(id);
      return offCardHtml({ idx: i, icon: g.icon, title: g.label,
        subtitle: g.deadline ? `Entro i ${g.deadline} anni` : g.endOnly ? "Si decide a fine carriera" : "Nessuna scadenza" });
    }).join("");
    cards.querySelectorAll(".off-card").forEach(c => c.addEventListener("click", () => chooseCareerGoal(d.options[parseInt(c.dataset.idx)])));
    return;
  }

  if (d.type === "seasonFocus") {
    titleEl.textContent = "Su cosa ti concentri quest'anno?";
    subEl.textContent = "Scegli il focus del tuo lavoro per la stagione: darà una spinta agli attributi coerenti e potrebbe, con il tempo, far evolvere il tuo stile di gioco.";
    cards.innerHTML = SEASON_FOCUS_OPTIONS.map((o, i) => offCardHtml({
      idx: i, icon: o.icon, title: o.label, desc: o.desc,
    })).join("");
    cards.querySelectorAll(".off-card").forEach(c => {
      c.addEventListener("click", () => resolveSeasonFocus(SEASON_FOCUS_OPTIONS[parseInt(c.dataset.idx)].id));
    });
    extra.innerHTML = inSeasonBuyoutHtml(player);
    if (el("btn-buyout")) el("btn-buyout").addEventListener("click", buyContractOut);
    return;
  }

  if (d.type === "draft") {
    titleEl.textContent = "Il Draft ti chiama";
    subEl.textContent = `Overall attuale: ${player.overall}. Puoi dichiararti al Draft USA-1 una sola volta in carriera: sei pronto per il grande salto?`;
    cards.innerHTML =
      offCardHtml({ idx: 0, icon: "🏀", iconTone: "var(--accent-2)", title: "Dichiarati al Draft", subtitle: "Un'occasione, una sola volta", desc: "Ti metti a disposizione delle squadre USA-1. Se non vieni scelto, resta comunque una chance da free agent." }) +
      offCardHtml({ idx: 1, icon: "⏳", title: "Resta ancora un anno", subtitle: "Continua il tuo percorso", desc: "Rimani nella tua lega attuale per crescere ancora prima di tentare il salto." });
    cards.querySelector('[data-idx="0"]').addEventListener("click", () => resolveDraftDecision(true));
    cards.querySelector('[data-idx="1"]').addEventListener("click", () => resolveDraftDecision(false));
    return;
  }

  if (d.type === "draftCombine") { renderDraftCombine(d, titleEl, subEl, cards, extra); return; }

  if (d.type === "summerSpending") {
    renderSummerSpending(d, titleEl, subEl, cards, extra);
    return;
  }

  if (d.type === "agentChoice") {
    titleEl.textContent = d.change ? "Cambia agente" : "Scegli il tuo agente";
    subEl.textContent = "L'agente tratta i tuoi contratti e prende una commissione sull'ingaggio: ognuno spinge la tua carriera in una direzione diversa.";
    cards.innerHTML = AGENTS.map((a, i) => offCardHtml({
      idx: i, icon: a.icon, title: a.name, subtitle: a.commission ? `Commissione ${Math.round(a.commission * 100)}%` : "Nessuna commissione", desc: a.desc,
      tags: player.agent === a.id ? [{ text: "Agente attuale", tone: "blue" }] : [],
    })).join("");
    cards.querySelectorAll(".off-card").forEach(c => c.addEventListener("click", () => chooseAgent(AGENTS[parseInt(c.dataset.idx)].id)));
    return;
  }

  if (d.type === "playerOption") {
    titleEl.textContent = "Player option";
    subEl.textContent = `Il tuo contratto con ${player.team.name} ha un'opzione a tuo favore: puoi restare per l'ultimo anno oppure uscire e tornare sul mercato.`;
    cards.innerHTML =
      offCardHtml({ idx: 0, icon: "🔒", title: "Esercita l'opzione", subtitle: "Resti un altro anno", desc: `Ultimo anno a ${fmtMoney(player.contract.salaryPerYear, playerCurrency(player))}. La società potrebbe anche proporti un'estensione.` }) +
      offCardHtml({ idx: 1, icon: "🔓", iconTone: "var(--accent-2)", title: "Esci dal contratto", subtitle: "Free agency", desc: "Ti liberi subito e valuti le offerte di tutte le squadre, rinnovo compreso." });
    cards.querySelector('[data-idx="0"]').addEventListener("click", () => resolvePlayerOption(true));
    cards.querySelector('[data-idx="1"]').addEventListener("click", () => resolvePlayerOption(false));
    return;
  }

  if (d.type === "offseasonStatus" && d.extensionOffer) {
    const cp = d.extensionOffer.contractProposal;
    titleEl.textContent = "Proposta di estensione";
    subEl.textContent = `${player.team.name} vuole blindarti prima della scadenza. Puoi trattare il rinnovo ora oppure giocarti l'ultimo anno e andare sul mercato.`;
    cards.innerHTML =
      offCardHtml({ idx: 0, icon: "✍️", iconTone: "var(--accent-2)", title: "Tratta l'estensione", subtitle: `${cp.years} anni · ${fmtMoney(cp.salary, cp.currency)}/anno`, desc: "Si apre la trattativa: puoi chiedere durata, ingaggio e clausole." }) +
      offCardHtml({ idx: 1, icon: "⏳", title: "Aspetta la scadenza", subtitle: "Ultimo anno di contratto", desc: "Nessun rinnovo per ora: a fine stagione sarai libero di scegliere." });
    cards.querySelector('[data-idx="0"]').addEventListener("click", negotiateExtension);
    cards.querySelector('[data-idx="1"]').addEventListener("click", advanceAfterOffseason);
    extra.innerHTML = duoButtonHtml() + buyoutBoxHtml(player, d.record);
    if (el("btn-duo")) el("btn-duo").addEventListener("click", openDuoRequest);
    if (el("btn-buyout")) el("btn-buyout").addEventListener("click", buyContractOut);
    return;
  }

  if (d.type === "duoRequest") { renderDuoRequest(d, titleEl, subEl, cards, extra); return; }
  if (d.type === "nationalCup") { renderNationalCup(d, titleEl, subEl, cards, extra); return; }
  if (d.type === "allStarWeekend") {
    renderAllStarWeekend(d, titleEl, subEl, cards);
    extra.innerHTML = inSeasonBuyoutHtml(player);
    if (el("btn-buyout")) el("btn-buyout").addEventListener("click", buyContractOut);
    return;
  }
  if (d.type === "tradeDeadline") {
    renderTradeDeadline(d, titleEl, subEl, cards);
    extra.innerHTML = inSeasonBuyoutHtml(player);
    if (el("btn-buyout")) el("btn-buyout").addEventListener("click", buyContractOut);
    return;
  }

  if (d.type === "offseasonStatus") {
    titleEl.textContent = "Verso la prossima stagione";
    subEl.textContent = "Il tuo contratto è ancora valido: la dirigenza non richiede alcuna decisione, ci si prepara direttamente alla prossima annata.";
    cards.className = "off-cards off-cards-single";
    cards.innerHTML = offCardHtml({ icon: "📋", staticCard: true, title: player.team.name, subtitle: LEAGUES[player.league].name, desc: "Nessuna trattativa in corso: la squadra si affida a te anche per la prossima stagione." });
    extra.innerHTML = `<div class="btn-row" style="justify-content:center;margin-top:10px"><button class="btn btn-primary btn-lg" id="btn-offseason-continue">▶️ Continua</button></div>` + duoButtonHtml() + buyoutBoxHtml(player, d.record);
    el("btn-offseason-continue").addEventListener("click", advanceAfterOffseason);
    if (el("btn-duo")) el("btn-duo").addEventListener("click", openDuoRequest);
    if (el("btn-buyout")) el("btn-buyout").addEventListener("click", buyContractOut);
    return;
  }

  if (d.type === "market") {
    titleEl.textContent = "Mercato Estivo";
    subEl.textContent = "Confronta le offerte: campionato, squadra e possibilità di competere per il titolo.";
    // campionati raggruppati per nazione, più le coppe europee quando qualcuna ti cerca
    const groups = groupedLeagueOptions(player, d);
    const pill = id => isCupSelector(id)
      ? `<button class="league-pill cup-pill ${id === d.selectedLeague ? "active" : ""}" data-league="${id}">${CUP_SELECTORS[id].icon} ${CUP_SELECTORS[id].name} <span class="lp-count">${cupOffers(player, d, id).length}</span></button>`
      : `<button class="league-pill ${id === d.selectedLeague ? "active" : ""}" data-league="${id}">${LEAGUES[id].name}</button>`;
    const leagueSelectorHtml = groups.reduce((n, g) => n + g.leagues.length, 0) > 1 ? `
      <div class="league-groups">
        ${groups.map(g => `<div class="lg-row ${g.cup ? "lg-cup" : ""}"><span class="lg-label">${g.label}</span><div class="lg-pills">${g.leagues.map(pill).join("")}</div></div>`).join("")}
      </div>` : "";
    const forcedNotice = d.forcedTransfer
      ? `<p class="forced-notice" style="text-align:center;margin-bottom:14px">🚪 Rottura col club dopo i fatti dell'estate: il rinnovo non è più un'opzione, devi trovare una nuova squadra.</p>`
      : "";
    const buyoutNotice = d.buyout ? `<p class="forced-notice" style="text-align:center;margin-bottom:14px">💼 Hai pagato il buyout: il tuo vecchio club non ti rinnova, trova una nuova squadra.</p>` : "";
    const nbaExitNotice = d.nbaExit === "buyout" ? `<p class="forced-notice" style="text-align:center;margin-bottom:14px">Una squadra USA-1 paga il buyout del tuo contratto europeo: puoi firmare in USA-1, oppure restare rinnovando con il tuo club.</p>` : d.nbaExit ? `<p class="forced-notice" style="text-align:center;margin-bottom:14px">✈️ Clausola di uscita USA-1 attivata: il tuo contratto europeo non ti trattiene più.</p>` : "";
    const agent = getAgent(player);
    const probesLeft = d.probesLeft == null ? 2 : d.probesLeft;
    const probeBtnText = probesLeft > 0
      ? `🎯 Sonda una squadra (${probesLeft} ${probesLeft === 1 ? "tentativo rimasto" : "tentativi rimasti"})`
      : `🎯 Colloqui mirati esauriti`;
    const agentHtml = `
      <div class="market-agent-bar">
        <div class="market-agent-row">
          ${player.agentChosen ? `<button class="btn btn-ghost btn-sm" id="btn-change-agent">${agent.icon} Agente: ${agent.name} · cambia</button>` : ""}
          <button class="btn btn-secondary btn-sm" id="btn-probe-team" ${probesLeft <= 0 ? "disabled" : ""}>
            ${probeBtnText}
          </button>
        </div>
      </div>`;
    // sotto il selettore: chi gioca in Europa nel campionato selezionato
    extra.innerHTML = leagueSelectorHtml + leagueEuroTeamsHtml(d.selectedLeague) + forcedNotice + buyoutNotice + nbaExitNotice + agentHtml;
    if (player.agentChosen && el("btn-change-agent")) el("btn-change-agent").addEventListener("click", openAgentChoice);
    if (el("btn-probe-team")) el("btn-probe-team").addEventListener("click", () => openTargetTeamModal(d));
    // la CTA signal va sull'offerta lampo, se c'è, altrimenti su quella della squadra più forte
    const strongest = d.flash ? -1 : d.offers.reduce((best, o, i) => (o.contractProposal.teamStrength > d.offers[best].contractProposal.teamStrength ? i : best), 0);
    cards.className = "off-cards offer-grid";
    cards.innerHTML = (d.flash ? offerCardHtml(d.flash, { idx: "flash", primary: true, flashTicks: d.flashTicks }) : "")
      + d.offers.map((o, i) => offerCardHtml(o, { idx: i, primary: i === strongest })).join("");
    cards.querySelectorAll(".off-card").forEach(c => {
      c.addEventListener("click", () => selectOffer(c.dataset.idx === "flash" ? d.flash : d.offers[parseInt(c.dataset.idx)], d));
    });
    extra.querySelectorAll(".league-pill").forEach(b => b.addEventListener("click", () => switchOfferLeague(b.dataset.league)));
    // l'offerta lampo arriva come una telefonata dell'agente, una sola volta
    if (d.flash && !d.flash.announced) {
      d.flash.announced = true;
      openFlashOfferModal(d);
    }
    return;
  }

  if (d.type === "negotiate") {
    const offer = d.offer;
    const cp = offer.contractProposal;
    cp.clauses = cp.clauses || {};
    const patience = offer.patience == null ? OFFER_PATIENCE : offer.patience;
    const agent = getAgent(player);
    titleEl.textContent = `Trattativa con ${offer.team.name}`;
    subEl.textContent = `${LEAGUES[offer.targetLeague].name} · ${offer.team.city}${player.agentChosen ? ` · agente: ${agent.name}` : ""}`;
    // a sinistra l'offerta e il ruolo, a destra pazienza, firma e richieste con la loro probabilità
    const closed = patience <= 0;
    // la durata si tratta con lo slider (non per i contratti da rookie né per le borse di studio)
    const yearsFixed = offer.id === "rookie" || cp.salary == null;
    const yearsOff = closed || offer.attempts.years >= 2;
    const yearsTarget = clamp(cp.years + 1 <= CONTRACT_YEARS_MAX ? cp.years + 1 : cp.years - 1, CONTRACT_YEARS_MIN, CONTRACT_YEARS_MAX);
    const cup = teamEuroCup(offer.team, offer.targetLeague);
    const role = cp.teamRole ? getTeamRole(cp.teamRole) : null;
    const terms = [
      `<span class="co-chip co-chip--solid">${cp.years} ${cp.years === 1 ? "anno" : "anni"}</span>`,
      `<span class="co-chip co-chip--solid co-num">${cp.salary == null ? "Borsa di studio" : `${fmtMoney(cp.salary, cp.currency)} / anno`}</span>`,
      ...(cp.supermax ? [`<span class="co-chip co-chip--gold">Supermax</span>`] : []),
      `<span class="co-chip co-chip--live">Squadra OVR ${teamOverallFromStrength(cp.teamStrength)}</span>`,
      ...(cup ? [`<span class="co-chip ${cup.id === "EL" ? "co-chip--gold" : "co-chip--live"}">${cup.name}</span>`] : []),
      ...(role ? [`<span class="co-chip co-chip--signal">${role.label}</span>`] : []),
      ...clauseLabels(cp.clauses).map(l => `<span class="co-chip co-chip--up">${stripEmoji(l)}</span>`),
    ].join("");
    const asks = [
      askRowHtml({ id: "btn-negotiate-salary", label: "Aumento", meta: cp.salary == null ? "Nessun ingaggio da trattare" : `${2 - offer.attempts.salary} tentativi`, chance: negotiationChance(player), disabled: closed || cp.salary == null || offer.attempts.salary >= 2 }),
      ...(canAskTeamRole(cp) ? [askRowHtml({ id: "btn-negotiate-role", label: `Più responsabilità: ${getTeamRole(nextTeamRoleUp(cp.teamRole)).label.toLowerCase()}`, meta: offer.attempts.role ? "Respinta" : "1 tentativo", chance: teamRoleAskChance(player, cp), disabled: closed || !!offer.attempts.role })] : []),
    ].join("");
    // le clausole ottenute restano in elenco, segnate: così si vede subito cosa hai strappato
    const clauses = CONTRACT_CLAUSES.filter(c => c.available(cp, offer, player) || cp.clauses[c.id]).map(c => cp.clauses[c.id]
      ? askRowHtml({ cls: "co-ask--clause co-ask--won", label: c.label, meta: c.desc, status: "Ottenuta", disabled: true })
      : askRowHtml({ cls: "co-ask--clause", attr: `data-clause="${c.id}"`, label: c.label, meta: offer.attempts[c.id] ? "Respinta: non si può richiedere di nuovo" : c.desc,
          chance: clauseChance(player, offer, c), disabled: closed || !!offer.attempts[c.id], title: c.desc })).join("");
    cards.className = "off-cards neg-layout";
    cards.innerHTML = `
      <div class="neg-col">
        ${offerCardHtml(offer, { staticCard: true, body: `<p class="off-card-desc">${offer.desc}</p><div class="co-row">${terms}</div>` })}
        ${role ? `<section class="card neg-role"><div class="card-title"><h3>Il tuo ruolo</h3></div>${teamRoleBoxHtml(cp)}</section>` : ""}
      </div>
      <section class="card neg-side">
        <div class="neg-patience">
          <div><div class="neg-k">Pazienza della dirigenza ${helpTip("patience")}</div><div class="small-muted">Ogni richiesta respinta la consuma: a zero l'offerta viene ritirata.</div></div>
          ${pipsHtml(Math.max(0, patience), OFFER_PATIENCE, "signal")}
        </div>
        <button class="btn btn-primary btn-lg btn-block" id="btn-sign-contract">Firma alle condizioni proposte</button>
        <p class="neg-k">Rilancia · probabilità che accettino</p>
        ${yearsFixed ? "" : `<div class="neg-years">
          <div class="neg-years__head"><span class="co-ask__t">Durata</span><span class="neg-years__val" id="neg-years-val"></span></div>
          <input type="range" id="neg-years" min="${CONTRACT_YEARS_MIN}" max="${CONTRACT_YEARS_MAX}" step="1" value="${yearsTarget}" ${yearsOff ? "disabled" : ""} aria-label="Durata del contratto richiesta, in anni">
          <div class="neg-years__ticks" aria-hidden="true">${[1, 2, 3, 4, 5].map(n => `<span class="${n === cp.years ? "is-offer" : ""}">${n}</span>`).join("")}</div>
          <div class="co-asks">${askRowHtml({ id: "btn-negotiate-years", label: "Proponi la durata", meta: offer.attempts.years >= 2 ? "Nessun tentativo rimasto" : `${2 - offer.attempts.years} ${2 - offer.attempts.years === 1 ? "tentativo" : "tentativi"} · la proposta è di ${cp.years} ${cp.years === 1 ? "anno" : "anni"}`, chance: yearsAskChance(player, cp, yearsTarget), disabled: yearsOff || yearsTarget === cp.years })}</div>
        </div>`}
        <div class="co-asks">${asks}</div>
        ${clauses ? `<div class="neg-clauses"><p class="neg-clauses__k">Clausole del contratto ${helpTip("clauses")}</p><p class="small-muted">Una richiesta per clausola: se la società dice no, consuma pazienza.</p><div class="co-asks">${clauses}</div></div>` : ""}
        <div class="neg-exits">
          ${d.marketDecision ? `<button class="btn btn-ghost" id="btn-back-offers">Valuta altre offerte</button>` : ""}
          ${d.returnTo && d.rightsCall ? `<button class="btn btn-ghost" id="btn-decline-rights">Rifiuta e resta a ${player.team.name}</button>
            <p class="small-muted">Se rifiuti, i diritti decadono: dalla prossima estate potrai firmare con qualsiasi squadra USA-1.</p>` : ""}
          ${d.returnTo && !d.rightsCall ? `<button class="btn btn-ghost" id="btn-back-extension">Lascia perdere l'estensione</button>` : ""}
          ${offer.stash && d.draftRecord ? `<button class="btn btn-ghost" id="btn-decline-draft"></button>
            <p class="small-muted">${offer.id === "rookie" ? "Resti nel tuo club attuale: la squadra USA-1 mantiene i tuoi diritti per un anno e ti richiamerà la prossima estate." : "Rinunci alla USA-1 per ora e torni al mercato abituale."}</p>` : ""}
        </div>
      </section>`;
    if (offer.stash && d.draftRecord) {
      el("btn-decline-draft").textContent = offer.id === "rookie" ? `Rifiuta e resta a ${offer.stash.team.name}` : "Rifiuta e continua il tuo percorso";
      el("btn-decline-draft").addEventListener("click", () => declineDraftOffer(false));
    }
    el("btn-sign-contract").addEventListener("click", finalizeContract);
    if (!yearsFixed) {
      // lo slider aggiorna al volo la probabilità; il pulsante propone la durata scelta
      const slider = el("neg-years"), btn = el("btn-negotiate-years");
      const refresh = () => {
        const n = parseInt(slider.value);
        el("neg-years-val").textContent = `${n} ${n === 1 ? "anno" : "anni"}`;
        const ch = yearsAskChance(player, cp, n);
        const off = yearsOff || n === cp.years;
        btn.disabled = off;
        btn.setAttribute("aria-disabled", String(off));
        btn.querySelector(".co-ask__p").textContent = off || ch == null ? "—" : `${Math.round(ch * 100)}%`;
        btn.querySelector(".co-ask__odds i").style.width = `${off || ch == null ? 0 : Math.round(ch * 100)}%`;
        btn.querySelector(".co-ask__t").textContent = n === cp.years ? "Scegli una durata diversa" : `Proponi ${n} ${n === 1 ? "anno" : "anni"}`;
      };
      slider.addEventListener("input", refresh);
      refresh();
      btn.addEventListener("click", () => negotiateContract("years", parseInt(slider.value)));
    }
    el("btn-negotiate-salary").addEventListener("click", () => negotiateContract("salary"));
    if (el("btn-negotiate-role")) el("btn-negotiate-role").addEventListener("click", () => negotiateContract("role"));
    // le righe delle clausole stanno nel riquadro della trattativa (cards), non più sotto
    cards.querySelectorAll("[data-clause]").forEach(b => b.addEventListener("click", () => negotiateContract(b.dataset.clause)));
    if (d.marketDecision) el("btn-back-offers").addEventListener("click", backToOffers);
    if (d.returnTo && d.rightsCall) el("btn-decline-rights").addEventListener("click", declineDraftRights);
    else if (d.returnTo) el("btn-back-extension").addEventListener("click", () => { player.pendingDecision = d.returnTo; advanceAfterOffseason(); });
    return;
  }

  if (d.type === "offseasonChoice") {
    const ev = d.event;
    const chance = Math.round(offseasonEventChance(ev, player));
    titleEl.textContent = ev.title;
    subEl.textContent = `☀️ Imprevisto dell'estate — ${ev.category}. ${offseasonEventPreview(ev, player)}`;
    cards.innerHTML =
      offCardHtml({ idx: 0, icon: "🎲", iconTone: "var(--accent-2)", title: "Prendi il rischio", subtitle: ev.goodLabel, desc: `Possibilità di successo: ${chance}%`, tags: [{ text: `📈 ${chance}%`, tone: "green" }, { text: `📉 ${100-chance}%`, tone: "red" }] }) +
      offCardHtml({ idx: 1, icon: "🛡️", title: "Gioca sicuro", subtitle: "Nessun rischio", desc: "Nessun effetto: si evita completamente l'imprevisto." });
    cards.querySelector('[data-idx="0"]').addEventListener("click", () => resolveOffseasonChoice(true));
    cards.querySelector('[data-idx="1"]').addEventListener("click", () => resolveOffseasonChoice(false));
    return;
  }

  if (d.type === "offseasonReveal") {
    const rv = player.pendingOffseasonReveal;
    if (!rv) return;
    const out = rv.offseason;
    const toneClass = out.tone === "positive" ? "good" : out.tone === "negative" ? "bad" : "neutral";
    const resultIcon = !rv.takeRisk ? "🛡️" : out.tone === "positive" ? "✅" : out.tone === "negative" ? "❌" : "➖";
    const rollIcon = rv.takeRisk ? "🎲" : "🛡️";
    titleEl.textContent = "Il verdetto dell'estate";
    subEl.textContent = rv.takeRisk ? "Il rischio viene corso..." : "Si gioca sul sicuro...";
    cards.className = "off-cards off-cards-single";
    cards.innerHTML = `
      <div class="off-card static">
        <div class="reveal-wrap">
          <div class="reveal-roll" id="reveal-roll">
            <div class="reveal-dice">${rollIcon}</div>
            <p class="reveal-suspense">In corso...</p>
          </div>
          <div class="reveal-result hidden ${toneClass}" id="reveal-result">
            <div class="reveal-result-icon">${resultIcon}</div>
            <div class="reveal-result-title">${out.title}</div>
            ${out.rollText ? `<div class="reveal-rolltext">🎲 ${out.rollText}</div>` : ""}
            <p class="reveal-narrative">${out.narrative}</p>
            ${out.consequences.length ? `<ul class="reveal-consequences">${out.consequences.map(c => `<li>${c}</li>`).join("")}</ul>` : ""}
            <button class="btn btn-primary" id="btn-reveal-continue">Continua</button>
          </div>
        </div>
      </div>`;
    setTimeout(() => {
      if (!player || !player.pendingOffseasonReveal) return;
      const roll = document.getElementById("reveal-roll");
      const result = document.getElementById("reveal-result");
      if (!roll || !result) return;
      roll.classList.add("hidden");
      result.classList.remove("hidden");
      subEl.textContent = "L'estate ha fatto il suo corso.";
      el("btn-reveal-continue").addEventListener("click", confirmOffseasonReveal);
    }, 1300);
    return;
  }

  if (d.type === "nationalReveal") {
    const comp = d.comp;
    const flag = comp.kind === "world" ? "🌎" : "🌍";
    const medalClass = comp.champion ? "champ" : comp.medal ? "medal" : "out";
    titleEl.textContent = `${flag} ${comp.name}`;
    subEl.textContent = `${player.nationality} — la tua Nazionale ha disputato il torneo estivo.`;
    cards.className = "off-cards off-cards-single";
    cards.innerHTML = `
      <div class="off-card static">
        ${campaignTrackerHtml(NATIONAL_STAGES, nationalStageIndex(comp))}
        <div class="ps-status ${medalClass}" style="margin-top:12px">${nationalCompOutcomeText(comp)}</div>
      </div>`;
    extra.innerHTML = `<div class="btn-row" style="justify-content:center;margin-top:10px"><button class="btn btn-primary btn-lg" id="btn-national-continue">▶️ Continua verso la Regular Season</button></div>`;
    el("btn-national-continue").addEventListener("click", confirmNationalReveal);
    return;
  }
}

/* Pannello playoff: mostra i tabelloni, le serie già giocate e il turno da disputare */
function renderPostseasonPanel(body) {
  const ps = player.postseason;
  if (!ps) { body.innerHTML = ""; return; }
  const active = currentBracket();

  const past = ps.brackets.slice(0, ps.idx).map(b => `
    <div class="phase-summary">${PHASE_ICON[b.kind]} <strong>${phaseLabel(b)}</strong> — ${phaseOutcomeText(b)}</div>`).join("");

  if (!active) { body.innerHTML = past; return; }
  const nextRound = !active.done && !active.pendingClutch ? active.rounds[active.idx] : null;
  const hasLaterPhases = ps.idx < ps.brackets.length - 1;

  body.innerHTML = `
    ${ps.interview ? `<div class="recap-section"><div class="recap-h">Dopo la serie · ${ps.interview.round}</div>${interviewHtml(ps.interview, "data-ps-tone", "data-ps-follow")}</div>` : ""}
    ${past}
    <div class="ps-bracket active phase-current">
      <div class="ps-bracket-title">${PHASE_ICON[active.kind]} ${phaseLabel(active)}${active.kind === "national" ? ` — ${player.nationality}` : ""}</div>
      ${active.results.map(seriesRowHtml).join("")}
      ${phaseStatusHtml(active)}
    </div>
    ${active.pendingClutch ? clutchPanelHtml(active) : ""}
    <div class="btn-row">
      ${nextRound ? `<button class="btn btn-primary" id="btn-play-round">▶️ Gioca ${nextRound.group ? "la fase a gironi" : nextRound.name}</button>` : ""}
      <button class="btn btn-secondary" id="btn-sim-phase">⏩ Simula questa fase</button>
      ${hasLaterPhases ? `<button class="btn btn-ghost" id="btn-sim-postseason">⏭️ Simula tutto</button>` : ""}
    </div>
  `;
  if (nextRound) el("btn-play-round").addEventListener("click", advancePostseasonRound);
  el("btn-sim-phase").addEventListener("click", simulateCurrentPhase);
  if (hasLaterPhases) el("btn-sim-postseason").addEventListener("click", simulateRestOfPostseason);
  if (active.pendingClutch) wireClutchPanel(body, active);
  body.querySelectorAll("[data-ps-tone]").forEach(b => b.addEventListener("click", () => answerPostseasonInterview(b.dataset.psTone)));
  body.querySelectorAll("[data-ps-follow]").forEach(b => b.addEventListener("click", () => answerPostseasonFollowUp(b.dataset.psFollow)));
  const btnOpenPsPress = body.querySelector("#btn-open-press-modal") || body.querySelector("#btn-reopen-press-modal");
  if (btnOpenPsPress && ps.interview) {
    const openPsPress = () => renderPressModal(ps.interview, (tone) => answerPostseasonInterview(tone), (follow) => answerPostseasonFollowUp(follow));
    btnOpenPsPress.addEventListener("click", openPsPress);
    if (!ps.interview.answered) openPsPress();
  }
}

function clutchIconsHtml(r) {
  const plays = r.clutchPlays || (r.clutch ? [{ label: r.clutch.label, success: r.clutch.success, game: r.us + r.them }] : []);
  return plays.map(pl => `<span title="Gara ${pl.game} punto a punto: ${pl.label}">${pl.success ? "🎯" : "💔"}</span>`).join("");
}
function seriesRowHtml(r) {
  if (r.group) {
    return `
      <div class="series-row ${r.won ? "won" : "lost"}">
        <span class="sr-round">${r.round}</span>
        <span class="sr-opp">${r.stats ? `${r.stats.pts} PTS · ${r.stats.reb} REB · ${r.stats.ast} AST` : "Girone"}</span>
        <span class="sr-score">${r.wins}-${r.losses}</span>
        <span class="sr-flag">${r.won ? "✅" : "❌"}</span>
      </div>`;
  }
  return `
    <div class="series-row ${r.won ? "won" : "lost"}">
      <span class="sr-round">${r.round}</span>
      <span class="sr-opp">${teamLabel(r.opponent)}</span>
      <span class="sr-score">${r.bestOf === 1 ? (r.won ? "V" : "P") : `${r.us}-${r.them}`}</span>
      <span class="sr-flag">${clutchIconsHtml(r)} ${r.won ? "✅" : "❌"}</span>
    </div>`;
}
function phaseOutcomeText(b) {
  if (b.kind === "national") return nationalCompOutcomeText(nationalCompFromBracket(b));
  if (b.champion) return "🏆 Titolo vinto!";
  return b.eliminatedAt ? `eliminati: ${b.eliminatedAt}` : "conclusa";
}
function phaseStatusHtml(b) {
  if (b.done) return `<div class="ps-status ${b.champion ? "champ" : "out"}">${phaseOutcomeText(b)}</div>`;
  if (b.pendingClutch) {
    const pc = b.pendingClutch;
    return `<div class="ps-status next">${pc.round}${pc.bestOf > 1 ? ` · serie sul ${pc.us}-${pc.them}` : ""}: partita punto a punto in corso</div>`;
  }
  const r = b.rounds[b.idx];
  const what = r.group ? (b.kind === "national" ? "5 partite, passano le migliori" : `${b.competition === "EUROPE-1" ? 34 : 18} partite, passa chi vince almeno metà delle gare`)
    : r.bestOf === 1 ? "gara secca" : `serie al meglio di ${r.bestOf}`;
  return `<div class="ps-status next">Prossimo turno: <strong>${r.name}</strong> — ${what}</div>`;
}

/* Ultimo possesso di una partita punto a punto: modale clutch autentica */
function renderClutchModal(opts) {
  const overlay = el("clutch-overlay");
  const card = el("clutch-modal-card");
  if (!overlay || !card) return;
  const best = opts.options.reduce((b, o) => (o.pct > b.pct ? o : b), opts.options[0]);
  card.innerHTML = `
    <div class="cm-head">
      <span class="cm-tag">${opts.tag || "Gara Punto a Punto"}</span>
      <span class="ev-head-right">
        <span class="cm-round">${opts.roundLabel}</span>
        ${opts.closable ? `<button type="button" class="cm-close" data-cm-close aria-label="Chiudi">✕</button>` : ""}
      </span>
    </div>
    <div class="cm-scoreboard">
      <div class="cm-team">
        <span class="cm-team-name">${opts.oppName}</span>
        <span class="cm-score">${opts.oppScore}</span>
      </div>
      <div class="cm-center-info">
        <span class="cm-timer" id="cm-display-timer">${opts.timer || "00:04.8"}</span>
        <span class="cm-period">4° Quarto · Bonus</span>
      </div>
      <div class="cm-team">
        <span class="cm-team-name">${opts.myName}</span>
        <span class="cm-score" id="cm-display-myscore">${opts.myScore}</span>
      </div>
    </div>
    <div class="cm-body" id="cm-main-body">
      <p class="cm-narrative">${opts.narrative}</p>
      <div class="cm-choices">
        ${opts.options.map(o => `
          <button type="button" class="cm-choice ${o.id === best.id ? "recommended" : ""}" data-choice-id="${o.id}">
            <div class="cm-c-left">
              <span class="cm-c-icon">${o.icon}</span>
              <div class="cm-c-text">
                <span class="cm-c-title">${o.label}</span>
                <span class="cm-c-desc">${o.desc}</span>
              </div>
            </div>
            <div class="cm-c-right">
              <span class="cm-c-attr">${o.attrText}</span>
              <span class="cm-c-pct">${o.pct}%</span>
            </div>
          </button>`).join("")}
      </div>
    </div>`;

  const showOutcome = ({ success, label, game, newScore, onDone }) => {
    try {
      const timer = card.querySelector("#cm-display-timer");
      const scoreEl = card.querySelector("#cm-display-myscore");
      const body = card.querySelector("#cm-main-body");
      if (timer) {
        timer.textContent = "00:00.0";
        timer.classList.add("buzzer-zero");
      }
      if (success && scoreEl && newScore != null) {
        scoreEl.textContent = newScore;
        scoreEl.classList.add("score-updated");
      }
      if (body) {
        const gameStr = typeof game === "number" ? `Gara ${game}` : String(game || "");
        const winSub = gameStr
          ? (gameStr.startsWith("Gara") ? `${gameStr} è vinta!` : `vittoria contro ${gameStr}!`)
          : "partita vinta!";
        const lossSub = gameStr
          ? (gameStr.startsWith("Gara") ? `${gameStr} persa.` : `sconfitta contro ${gameStr}.`)
          : "partita persa.";

        body.innerHTML = `
          <div class="cm-outcome ${success ? "won" : "lost"}">
            <span class="cm-outcome-icon">${success ? "🎯" : "💔"}</span>
            <div class="cm-outcome-title">${success ? "CANESTRO SULLA SIRENA!" : "SBATTE SUL FERRO!"}</div>
            <div class="cm-outcome-sub">
              ${success
                ? `La giocata (${label}) buca la retina: ${winSub}`
                : `La difesa regge, tiro respinto: ${lossSub}`}
            </div>
            <button type="button" class="btn ${success ? "btn-primary" : "btn-secondary"} btn-lg cm-outcome-btn" id="btn-clutch-next">Continua ➔</button>
          </div>`;
        let advanced = false;
        const doAdvance = () => {
          if (advanced) return;
          advanced = true;
          overlay.classList.add("hidden");
          if (onDone) onDone();
        };
        const nextBtn = body.querySelector("#btn-clutch-next");
        if (nextBtn) nextBtn.addEventListener("click", doAdvance);
        setTimeout(doAdvance, 3200);
      } else {
        overlay.classList.add("hidden");
        if (onDone) onDone();
      }
    } catch (err) {
      console.error("Errore in showOutcome:", err);
      overlay.classList.add("hidden");
      if (onDone) onDone();
    }
  };

  card.querySelectorAll("[data-choice-id]").forEach(b => {
    b.addEventListener("click", () => {
      if (opts.onSelectOutcome) {
        opts.onSelectOutcome(b.dataset.choiceId, showOutcome);
      } else {
        overlay.classList.add("hidden");
        opts.onSelect(b.dataset.choiceId);
      }
    });
  });
  const closeBtn = card.querySelector("[data-cm-close]");
  if (closeBtn) closeBtn.addEventListener("click", () => overlay.classList.add("hidden"));
  overlay.classList.remove("hidden");
}

function hideClutchModal() {
  const overlay = el("clutch-overlay");
  if (overlay) overlay.classList.add("hidden");
}

/* Modale "evento" generica: situazioni di spogliatoio, offerta lampo, sponsor...
   opts: tone (signal|live|gold|up), tag, meta, icon, title, text, heroHtml, bodyHtml, footHtml,
   options [{ id, icon, label, desc, badge, badgeTone, disabled, primary, selected }], onSelect(id), closable */
function renderEventModal(opts) {
  const overlay = el("event-overlay");
  const card = el("event-modal-card");
  if (!overlay || !card) return;
  card.className = `clutch-modal-card event-modal-card ev-tone-${opts.tone || "signal"}`;
  card.innerHTML = `
    <div class="cm-head">
      <span class="cm-tag">${opts.tag || "Evento"}</span>
      <span class="ev-head-right">
        ${opts.meta ? `<span class="cm-round">${opts.meta}</span>` : ""}
        ${opts.closable !== false ? `<button type="button" class="cm-close" data-ev-close aria-label="Chiudi">✕</button>` : ""}
      </span>
    </div>
    ${opts.heroHtml || ""}
    <div class="cm-body">
      ${opts.title ? `<h3 class="ev-title" id="event-modal-title">${opts.icon ? `${opts.icon} ` : ""}${opts.title}</h3>` : ""}
      ${opts.text ? `<p class="cm-narrative">${opts.text}</p>` : ""}
      ${opts.bodyHtml || ""}
      <div class="cm-choices">
        ${opts.options.map(o => `
          <button type="button" class="cm-choice ${o.primary ? "recommended" : ""} ${o.selected ? "is-selected" : ""}" data-ev-choice="${o.id}" ${o.disabled ? "disabled" : ""}>
            <div class="cm-c-left">
              ${o.icon ? `<span class="cm-c-icon">${o.icon}</span>` : ""}
              <div class="cm-c-text">
                <span class="cm-c-title">${o.label}</span>
                ${o.desc ? `<span class="cm-c-desc">${o.desc}</span>` : ""}
              </div>
            </div>
            ${o.badge ? `<div class="cm-c-right"><span class="ev-badge ${o.badgeTone || ""}">${o.badge}</span></div>` : ""}
          </button>`).join("")}
      </div>
      ${opts.footHtml || ""}
    </div>`;
  card.querySelectorAll("[data-ev-choice]").forEach(b => {
    b.addEventListener("click", () => {
      overlay.classList.add("hidden");
      opts.onSelect(b.dataset.evChoice);
    });
  });
  const closeBtn = card.querySelector("[data-ev-close]");
  if (closeBtn) closeBtn.addEventListener("click", () => {
    overlay.classList.add("hidden");
    if (opts.onClose) opts.onClose();
  });
  overlay.classList.remove("hidden");
}

function hideEventModal() {
  const overlay = el("event-overlay");
  if (overlay) overlay.classList.add("hidden");
}

/* Offerta lampo: la telefonata dell'agente, con i numeri del contratto e il tempo che scorre */
function openFlashOfferModal(d) {
  const o = d.flash;
  if (!o) return;
  const ticks = d.flashTicks == null ? FLASH_OFFER_TICKS : d.flashTicks;
  const movesTxt = `${ticks} ${ticks === 1 ? "mossa" : "mosse"}`;
  const caller = player.agentChosen ? `Il tuo agente, ${getAgent(player).name}` : "Il tuo agente";
  const rows = offerDetailsRows(o).map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
  renderEventModal({
    tone: "signal",
    tag: "Chiamata in arrivo · Offerta lampo",
    meta: `Scade tra ${movesTxt}`,
    heroHtml: `
      <div class="ev-team-band" style="${teamVars(o.team)}">
        <span class="ev-team-mono">${(o.team.name[0] || "?").toUpperCase()}</span>
        <div class="ev-team-info">
          <span class="ev-team-name">${o.team.name}</span>
          <span class="ev-team-sub">${o.team.city} · ${LEAGUES[o.targetLeague].name}</span>
        </div>
        <span class="ev-ring" aria-hidden="true">📞</span>
      </div>`,
    text: `${caller} ti chiama: <strong>${o.team.name}</strong> ha appena messo sul tavolo un'offerta più ricca di tutte le altre. Vogliono una risposta adesso: se cambi campionato o apri un'altra trattativa, tra <strong>${movesTxt}</strong> prendono un altro giocatore.`,
    bodyHtml: `<dl class="off-card-details ev-details">${rows}</dl>`,
    options: [
      { id: "open", icon: "✍️", label: "Apri subito la trattativa", desc: "Pazienza minima: puoi chiedere poco prima che chiudano il discorso.", primary: true },
      { id: "later", icon: "🗂️", label: "Prima guardo le altre offerte", desc: "L'offerta resta in cima alla lista, ma il tempo scorre." },
    ],
    onSelect: id => { if (id === "open" && d.flash) selectOffer(d.flash, d); },
  });
}

/* Modale interattiva: chiedi all'agente di sondare una squadra specifica */
function openTargetTeamModal(d) {
  const overlay = el("event-overlay");
  const card = el("event-modal-card");
  if (!overlay || !card) return;

  const agent = getAgent(player);
  const leagues = targetTeamLeagues(player, d);
  let curLeague = leagues.includes(d.selectedLeague) ? d.selectedLeague : leagues[0];

  const getTeams = lid => (LEAGUES[lid] && LEAGUES[lid].teams) || [];
  let curTeamName = getTeams(curLeague)[0] ? getTeams(curLeague)[0].name : "";

  function renderModalContent(step, outcomeData) {
    if (step === "outcome") {
      const isSuccess = outcomeData.success;
      const t = outcomeData.team;
      const quote = agentTargetTeamQuote(agent, isSuccess ? "success" : "failure", outcomeData);

      card.className = `clutch-modal-card event-modal-card ev-tone-${isSuccess ? "live" : "signal"}`;
      card.innerHTML = `
        <div class="cm-head">
          <span class="cm-tag">🎯 Esito Colloquio</span>
          <span class="ev-head-right">
            <button type="button" class="cm-close" data-ev-close aria-label="Chiudi">✕</button>
          </span>
        </div>
        <div class="ev-team-band" style="${teamVars(t)}">
          <span class="ev-team-mono">${(t.name[0] || "?").toUpperCase()}</span>
          <div class="ev-team-info">
            <span class="ev-team-name">${t.name}</span>
            <span class="ev-team-sub">${t.city} · ${LEAGUES[outcomeData.leagueId].name}</span>
          </div>
          <span class="ev-ring" aria-hidden="true">${isSuccess ? "🤝" : "📞"}</span>
        </div>
        <div class="cm-body probe-modal-body">
          <h3 class="ev-title">${isSuccess ? "🎉 Proposta Ufficiale Ricevuta!" : "❌ Colloquio Negativo"}</h3>
          <p class="cm-narrative">
            ${isSuccess
              ? `I dirigenti di <strong>${t.name}</strong> hanno accolto la richiesta: la trattativa è aperta e l'offerta contrattuale è ora sul tuo tavolo!`
              : outcomeData.reason}
          </p>
          <div class="probe-agent-quote">
            <span class="probe-quote-icon">${agent.icon}</span>
            <div class="probe-quote-text">
              <strong>${agent.name}:</strong> <em>"${quote}"</em>
            </div>
          </div>
          ${isSuccess && outcomeData.offer ? `
            <div class="probe-offer-summary">
              <span class="co-chip co-chip--solid">${outcomeData.offer.contractProposal.years} ${outcomeData.offer.contractProposal.years === 1 ? "anno" : "anni"}</span>
              <span class="co-chip co-chip--solid co-num">${outcomeData.offer.contractProposal.salary == null ? "Borsa di studio" : `${fmtMoney(outcomeData.offer.contractProposal.salary, outcomeData.offer.contractProposal.currency)} / anno`}</span>
              <span class="co-chip co-chip--live">OVR Squadra ${teamOverallFromStrength(outcomeData.offer.contractProposal.teamStrength)}</span>
            </div>` : ""}
          <div class="cm-choices" style="margin-top:16px;">
            ${isSuccess ? `
              <button type="button" class="btn btn-primary btn-lg btn-block" id="btn-probe-go-offer">
                📋 Vai all'offerta di ${t.name}
              </button>` : `
              ${(d.probesLeft > 0) ? `
                <button type="button" class="btn btn-primary btn-block" id="btn-probe-retry">
                  🎯 Sonda un'altra squadra (${d.probesLeft} ${d.probesLeft === 1 ? "tentativo rimasto" : "tentativi rimasti"})
                </button>` : ""}
              <button type="button" class="btn btn-ghost btn-block" id="btn-probe-back-market">
                ↩️ Torna alle offerte di mercato
              </button>`}
          </div>
        </div>`;

      const closeBtn = card.querySelector("[data-ev-close]");
      if (closeBtn) closeBtn.addEventListener("click", () => {
        overlay.classList.add("hidden");
        renderGameScreen();
      });

      if (isSuccess) {
        const goBtn = el("btn-probe-go-offer");
        if (goBtn) goBtn.addEventListener("click", () => {
          overlay.classList.add("hidden");
          renderGameScreen();
        });
      } else {
        const retryBtn = el("btn-probe-retry");
        if (retryBtn) retryBtn.addEventListener("click", () => {
          renderModalContent("form");
        });
        const backBtn = el("btn-probe-back-market");
        if (backBtn) backBtn.addEventListener("click", () => {
          overlay.classList.add("hidden");
          renderGameScreen();
        });
      }
      return;
    }

    // SCHERMATA FORM
    const probes = d.probesLeft == null ? 2 : d.probesLeft;
    const teams = getTeams(curLeague);
    let selectedTeam = teams.find(t => t.name === curTeamName) || teams[0];
    if (selectedTeam) curTeamName = selectedTeam.name;

    const info = selectedTeam ? probeTeamInterestChance(player, selectedTeam, curLeague) : null;
    const alreadyProbed = (d.probedTeams || []).some(x => x.teamName === (selectedTeam && selectedTeam.name));
    const alreadyOffered = (d.offers || []).some(o => o.team && o.team.name === (selectedTeam && selectedTeam.name));
    const isCurrentTeam = player.team && selectedTeam && player.team.name === selectedTeam.name;

    let buttonDisabled = false;
    let buttonLabel = `📞 Chiedi all'agente di contattare ${selectedTeam ? selectedTeam.name : "il club"}`;
    if (player.agent === "none") buttonLabel = `📞 Contatta direttamente ${selectedTeam ? selectedTeam.name : "il club"}`;

    if (alreadyOffered) {
      buttonDisabled = true;
      buttonLabel = "⚠️ Hai già un'offerta da questa squadra sul tavolo";
    } else if (alreadyProbed) {
      buttonDisabled = true;
      buttonLabel = "❌ Questa squadra ha già rifiutato la richiesta quest'estate";
    } else if (isCurrentTeam) {
      buttonDisabled = true;
      buttonLabel = "ℹ️ È la tua squadra attuale: valuta il rinnovo sul mercato";
    }

    let agentBadge = "";
    if (agent.id === "builder") agentBadge = `<span class="co-chip co-chip--gold">🏗️ Specialità Contender (+35%)</span>`;
    else if (agent.id === "brand") agentBadge = `<span class="co-chip co-chip--gold">📣 Specialità Grandi Metropoli (+35%)</span>`;
    else if (agent.id === "shark") agentBadge = `<span class="co-chip co-chip--gold">🦈 Specialità Squalo (+15% e +20% ingaggio)</span>`;
    else agentBadge = `<span class="co-chip co-chip--warn">🧑 Senza Agente (-20% malus)</span>`;

    let oddsTone = "green";
    let oddsLabel = "Molto Alta";
    if (info) {
      if (info.chance >= 75) { oddsTone = "green"; oddsLabel = "Molto Alta"; }
      else if (info.chance >= 50) { oddsTone = "gold"; oddsLabel = "Concreta"; }
      else if (info.chance >= 30) { oddsTone = "signal"; oddsLabel = "Difficile"; }
      else { oddsTone = "red"; oddsLabel = "Quasi Impossibile"; }
    }

    const tInfo = selectedTeam ? titleChanceInfo(getTeamStrength(selectedTeam, curLeague), curLeague) : null;

    card.className = "clutch-modal-card event-modal-card ev-tone-live";
    card.innerHTML = `
      <div class="cm-head">
        <span class="cm-tag">🎯 Destinazione Desiderata</span>
        <span class="ev-head-right">
          <span class="cm-round">${probes} ${probes === 1 ? "tentativo rimasto" : "tentativi rimasti"}</span>
          <button type="button" class="cm-close" data-ev-close aria-label="Chiudi">✕</button>
        </span>
      </div>
      <div class="cm-body probe-modal-body">
        <div class="probe-agent-banner">
          <div class="probe-agent-head">
            <span class="probe-agent-avatar">${agent.icon}</span>
            <div class="probe-agent-titles">
              <span class="probe-agent-name">${agent.name}</span>
              ${agentBadge}
            </div>
          </div>
          <p class="probe-agent-quote-text">"${agentTargetTeamQuote(agent, "intro")}"</p>
        </div>

        <div class="probe-selectors-grid">
          <div class="probe-field">
            <label for="probe-sel-league" class="probe-label">Campionato:</label>
            <select id="probe-sel-league" class="probe-select">
              ${leagues.map(l => `<option value="${l}" ${l === curLeague ? "selected" : ""}>${LEAGUES[l].name} (${LEAGUES[l].country || LEAGUES[l].continent})</option>`).join("")}
            </select>
          </div>
          <div class="probe-field">
            <label for="probe-sel-team" class="probe-label">Squadra desiderata:</label>
            <select id="probe-sel-team" class="probe-select">
              ${teams.map(t => `<option value="${t.name}" ${t.name === curTeamName ? "selected" : ""}>${t.name} (${t.city})</option>`).join("")}
            </select>
          </div>
        </div>

        ${selectedTeam && info ? `
          <div class="probe-preview-card" style="${teamVars(selectedTeam)}">
            <div class="probe-preview-head">
              <div class="probe-preview-team">
                <span class="probe-preview-badge">${(selectedTeam.name[0] || "?").toUpperCase()}</span>
                <div>
                  <h4 class="probe-preview-name">${selectedTeam.name}</h4>
                  <span class="probe-preview-sub">${selectedTeam.city} · ${LEAGUES[curLeague].name}</span>
                </div>
              </div>
              <div class="probe-preview-ovr">
                <span class="probe-ovr-num">${info.teamOvr}</span>
                <span class="probe-ovr-lbl">OVR SQUADRA</span>
              </div>
            </div>

            <div class="probe-preview-chips">
              <span class="co-chip co-chip--solid">${tInfo ? `${tInfo.stars} ${tInfo.label}` : ""}</span>
              ${info.isMetro ? `<span class="co-chip co-chip--live">🏙️ Grande Metropoli</span>` : ""}
              ${info.isHometown ? `<span class="co-chip co-chip--signal">🏠 Città Natale (+15%)</span>` : ""}
              ${info.isContender && agent.id === "builder" ? `<span class="co-chip co-chip--gold">🏗️ Bonus Contender (+35%)</span>` : ""}
              ${info.isMetro && agent.id === "brand" ? `<span class="co-chip co-chip--gold">📣 Bonus Metropoli (+35%)</span>` : ""}
              ${agent.id === "shark" ? `<span class="co-chip co-chip--gold">🦈 Bonus Squalo (+15%)</span>` : ""}
              ${agent.id === "none" ? `<span class="co-chip co-chip--warn">🧑 Malus Fai-da-te (-20%)</span>` : ""}
            </div>

            <div class="probe-odds-box">
              <div class="probe-odds-header">
                <span class="probe-odds-title">Probabilità che accettino il colloquio:</span>
                <span class="probe-odds-percent probe-tone-${oddsTone}">${info.chance}% · ${oddsLabel}</span>
              </div>
              <div class="probe-odds-bar">
                <div class="probe-odds-fill probe-fill-${oddsTone}" style="width: ${info.chance}%;"></div>
              </div>
              <div class="probe-odds-meta small-muted">
                Tuo OVR: <strong>${player.overall}</strong> vs Squadra: <strong>${info.teamOvr}</strong> · Reputazione: <strong>${reputationOf(player)}/100</strong>
              </div>
            </div>
          </div>` : ""}

        <div class="probe-actions" style="margin-top: 14px;">
          <button type="button" class="btn btn-primary btn-lg btn-block" id="btn-probe-submit" ${buttonDisabled ? "disabled" : ""}>
            ${buttonLabel}
          </button>
        </div>
      </div>`;

    const closeBtn = card.querySelector("[data-ev-close]");
    if (closeBtn) closeBtn.addEventListener("click", () => {
      overlay.classList.add("hidden");
    });

    const selLeague = el("probe-sel-league");
    if (selLeague) {
      selLeague.addEventListener("change", e => {
        curLeague = e.target.value;
        const newTeams = getTeams(curLeague);
        curTeamName = newTeams[0] ? newTeams[0].name : "";
        renderModalContent("form");
      });
    }

    const selTeam = el("probe-sel-team");
    if (selTeam) {
      selTeam.addEventListener("change", e => {
        curTeamName = e.target.value;
        renderModalContent("form");
      });
    }

    const submitBtn = el("btn-probe-submit");
    if (submitBtn && !buttonDisabled) {
      submitBtn.addEventListener("click", () => {
        if (!selectedTeam) return;
        const result = contactTargetTeam(player, d, selectedTeam, curLeague);
        renderModalContent("outcome", result);
      });
    }
  }

  renderModalContent("form");
  overlay.classList.remove("hidden");
}

/* Chiude tutte le modali di decisione (quando si lascia la schermata del momento) */
function hideDecisionModals() {
  ["clutch-overlay", "press-overlay", "injury-overlay", "event-overlay"].forEach(id => {
    const o = el(id);
    if (o) o.classList.add("hidden");
  });
}

/* Invito compatto nel pannello che apre (o riapre) una modale */
function modalCtaHtml({ tone, title, sub, btnId, btnLabel, primary, done }) {
  return `
    <div class="modal-cta ${tone || ""} ${done ? "done" : ""}">
      <div class="modal-cta__text">
        <div class="modal-cta__t">${title}</div>
        ${sub ? `<div class="modal-cta__s">${sub}</div>` : ""}
      </div>
      <button type="button" class="btn ${primary ? "btn-primary" : "btn-secondary"} btn-sm" id="${btnId}">${btnLabel}</button>
    </div>`;
}

function clutchPanelHtml(bracket) {
  const pc = bracket.pendingClutch;
  const game = pc.bestOf === 1 ? "Gara secca" : `Gara ${pc.us + pc.them + 1}${pc.decisive ? " (decisiva)" : ""}`;
  return `
    <div class="ps-bracket active phase-current" style="border:1px solid var(--signal); background:var(--signal-soft); padding:16px; margin:14px 0; text-align:center;">
      <div style="font-family:var(--font-display); font-size:22px; font-weight:800; color:var(--signal); text-transform:uppercase; margin-bottom:6px;">
        🔥 Gara punto a punto in corso!
      </div>
      <p class="small-muted" style="margin-bottom:12px;">${bracket.competition} · ${pc.round} · ${game} contro ${teamLabel(pc.opponent)}: ultimi secondi sul cronometro.</p>
      <button type="button" class="btn btn-primary" id="btn-open-clutch-modal" style="margin:0 auto;">
        🏀 Gioca l'ultimo possesso
      </button>
    </div>`;
}

function wireClutchPanel(body, bracket) {
  const btn = body.querySelector("#btn-open-clutch-modal");
  const pc = bracket.pendingClutch;
  const openModal = () => {
    const oppScore = 102;
    const myScore = 101;
    const game = pc.bestOf === 1 ? "Gara secca" : `Gara ${pc.us + pc.them + 1}${pc.decisive ? " (decisiva)" : ""}`;
    const roundLabel = `${bracket.competition} · ${pc.round} · ${game}`;
    const options = CLUTCH_OPTIONS.map(o => ({
      id: o.id,
      icon: o.icon,
      label: o.label,
      desc: o.desc,
      attrText: o.attrLabel ? o.attrLabel(player) : "",
      pct: Math.round(clutchChance(player, pc.winProb, o) * 100),
    }));
    renderClutchModal({
      roundLabel,
      oppName: pc.opponent.name,
      oppScore,
      myName: player.team.name,
      myScore,
      timer: "00:04.8",
      narrative: `Contro ${pc.opponent.name}: rimessa disegnata dal coach con pochissimi secondi alla sirena. Siete <strong>sotto di 1 punto</strong> e la palla è nelle tue mani. Cosa fai?`,
      options,
      onSelectOutcome: (optionId, showOutcome) => {
        const option = CLUTCH_OPTIONS.find(o => o.id === optionId);
        const optLabel = option ? option.label : "Azione clutch";
        const baseChance = Math.round(clutchChance(player, pc.winProb, option) * 100);
        const mainBody = document.querySelector("#cm-main-body");

        const executePlay = (meterRes) => {
          resolveClutch(optionId, (play, done) => {
            showOutcome({
              success: play.success,
              label: `${play.label} ${meterRes && meterRes.timing === "perfect" ? "🟢 (Perfetto!)" : ""}`,
              game: play.game,
              newScore: play.success ? 103 : 101,
              onDone: done,
            });
          }, meterRes);
        };

        const executeSkip = () => {
          resolveClutch(optionId, (play, done) => {
            showOutcome({
              success: play.success,
              label: play.label,
              game: play.game,
              newScore: play.success ? 103 : 101,
              onDone: done,
            });
          });
        };

        if (mainBody) {
          if (optionId === "drive" && typeof renderTimingCircleWidget === "function") {
            const attrVal = Math.round((player.attrs.finishing + player.attrs.athleticism) / 2);
            renderTimingCircleWidget(mainBody, {
              optionLabel: optLabel,
              attributeValue: attrVal,
              baseWinProb: baseChance,
              onRelease: executePlay,
              onSkip: executeSkip,
            });
            return;
          }
          if (optionId === "pass" && typeof renderCourtVisionWidget === "function") {
            renderCourtVisionWidget(mainBody, {
              optionLabel: optLabel,
              attributeValue: player.attrs.playmaking,
              iqValue: player.attrs.iq,
              baseWinProb: baseChance,
              onRelease: executePlay,
              onSkip: executeSkip,
            });
            return;
          }
          if (typeof renderShotMeterWidget === "function") {
            renderShotMeterWidget(mainBody, {
              optionLabel: optLabel,
              attributeValue: player.attrs.shooting,
              baseWinProb: baseChance,
              onRelease: executePlay,
              onSkip: executeSkip,
            });
            return;
          }
        }

        executeSkip();
      },
      onSelect: (optionId) => resolveClutch(optionId),
    });
  };
  if (btn) btn.addEventListener("click", openModal);
  // Apertura automatica immediata per dare il massimo dinamismo
  openModal();
}

/* Pannello imprevisto estivo a rischio: mostra le due percentuali d'esito prima di scegliere
   se rischiare o restare sul sicuro (nessun effetto). */
function renderOffseasonChoicePanel(body, ev) {
  const chance = Math.round(offseasonEventChance(ev, player));
  const preview = offseasonEventPreview(ev, player);
  body.innerHTML = `
    <p style="margin-bottom:4px"><strong>☀️ Imprevisto dell'estate — ${ev.category}</strong></p>
    <p class="risk-narrative"><strong>${ev.title}</strong>. ${preview}</p>
    <div class="risk-options">
      <div class="risk-opt good">
        <span class="ro-icon">📈</span>
        <span class="ro-label">${ev.goodLabel}</span>
        <span class="ro-pct">${chance}%</span>
      </div>
      <div class="risk-opt bad">
        <span class="ro-icon">📉</span>
        <span class="ro-label">${ev.badLabel}</span>
        <span class="ro-pct">${100 - chance}%</span>
      </div>
    </div>
    <div class="btn-row">
      <button class="btn btn-primary" id="btn-risk-take">🎲 Prendi il rischio</button>
      <button class="btn btn-secondary" id="btn-risk-safe">🛡️ Gioca sicuro</button>
    </div>
  `;
  el("btn-risk-take").addEventListener("click", () => resolveOffseasonChoice(true));
  el("btn-risk-safe").addEventListener("click", () => resolveOffseasonChoice(false));
}

/* Animazione di rivelazione dell'imprevisto: prima una breve sospensione (dado che trema per
   il rischio, scudo che pulsa per la scelta sicura), poi l'esito reale viene svelato con un
   pop-in colorato in base al tono (positivo/negativo/neutro) e un pulsante per proseguire. */
function renderOffseasonRevealPanel(body) {
  const rv = player.pendingOffseasonReveal;
  if (!rv) return;
  const out = rv.offseason;
  const toneClass = out.tone === "positive" ? "good" : out.tone === "negative" ? "bad" : "neutral";
  const resultIcon = !rv.takeRisk ? "🛡️" : out.tone === "positive" ? "✅" : out.tone === "negative" ? "❌" : "➖";
  const rollIcon = rv.takeRisk ? "🎲" : "🛡️";
  const suspenseText = rv.takeRisk ? "Il rischio viene corso..." : "Si gioca sul sicuro...";

  body.innerHTML = `
    <div class="reveal-wrap">
      <div class="reveal-roll" id="reveal-roll">
        <div class="reveal-dice">${rollIcon}</div>
        <p class="reveal-suspense">${suspenseText}</p>
      </div>
      <div class="reveal-result hidden ${toneClass}" id="reveal-result">
        <div class="reveal-result-icon">${resultIcon}</div>
        <div class="reveal-result-title">${out.title}</div>
        ${out.rollText ? `<div class="reveal-rolltext">🎲 ${out.rollText}</div>` : ""}
        <p class="reveal-narrative">${out.narrative}</p>
        ${out.consequences.length ? `<ul class="reveal-consequences">${out.consequences.map(c => `<li>${c}</li>`).join("")}</ul>` : ""}
        <button class="btn btn-primary" id="btn-reveal-continue">Continua</button>
      </div>
    </div>
  `;

  setTimeout(() => {
    // se nel frattempo il pannello è stato smontato (es. nuova carriera) non si tocca nulla
    if (!player || !player.pendingOffseasonReveal) return;
    const roll = document.getElementById("reveal-roll");
    const result = document.getElementById("reveal-result");
    if (!roll || !result) return;
    roll.classList.add("hidden");
    result.classList.remove("hidden");
    el("btn-reveal-continue").addEventListener("click", confirmOffseasonReveal);
  }, 1300);
}

/* Pannello del torneo con la Nazionale: mostrato subito dopo l'Off-Season, prima che inizi
   la prossima regular season. Il torneo è già stato simulato per intero a fine stagione:
   qui se ne rivela semplicemente il cammino con lo stesso stile dei tracker di campionato. */
function renderNationalRevealPanel(body, comp) {
  const flag = comp.kind === "world" ? "🌎" : "🌍";
  const medalClass = comp.champion ? "champ" : comp.medal ? "medal" : "out";
  body.innerHTML = `
    <p style="margin-bottom:4px"><strong>${flag} ${comp.name} — ${player.nationality}</strong></p>
    <p class="small-muted" style="margin-bottom:10px">La tua Nazionale ha disputato il torneo estivo. Ecco il cammino:</p>
    ${campaignTrackerHtml(NATIONAL_STAGES, nationalStageIndex(comp))}
    <div class="ps-status ${medalClass}" style="margin-top:12px">${nationalCompOutcomeText(comp)}</div>
    <div class="btn-row" style="margin-top:14px">
      <button class="btn btn-primary" id="btn-national-continue">▶️ Continua verso la Regular Season</button>
    </div>
  `;
  el("btn-national-continue").addEventListener("click", confirmNationalReveal);
}

function awardsAndNoteText(rec) {
  const parts = [];
  if (rec.draftResult) parts.push(`Draft: ${rec.draftResult}`);
  if (rec.champion) parts.push("🏆 Titolo");
  if (rec.continental) parts.push(`${rec.continental.competition}: ${rec.continental.result}`);
  if (rec.nationalComp) parts.push(`${rec.nationalComp.kind === "world" ? "🌎" : "🌍"} ${rec.nationalComp.name}: ${nationalCompOutcomeText(rec.nationalComp)}`);
  if (rec.injury) parts.push(rec.injury.text);
  if (rec.tradedFrom) parts.push(`Ceduto a stagione in corso da ${rec.tradedFrom}`);
  if (rec.allStarContest) parts.push(`${rec.allStarContest.label}: ${rec.allStarContest.won ? "vinta" : "partecipazione"}`);
  if (rec.seasonFocus && rec.seasonFocus.archetypeChanged) parts.push(`🔄 Evoluzione: ${rec.seasonFocus.newArchetypeName}`);
  if (rec.awards && rec.awards.length) parts.push(rec.awards.join(", "));
  if (rec.event) parts.push(rec.event.text);
  if (rec.offseason) {
    const icon = rec.offseason.tone === "positive" ? "🌟" : rec.offseason.tone === "negative" ? "⚠️" : "🌤️";
    parts.push(`${icon} Estate: ${rec.offseason.title}`);
  }
  return parts.join(" · ") || "-";
}

/* La carriera come timeline: un anno per scheda, con i badge principali; i dettagli si aprono al click */
function careerYearBadges(rec) {
  const badges = [];
  if (rec.champion) badges.push(`<span class="yb gold">🏆 Titolo</span>`);
  if (rec.continental && rec.continental.champion) badges.push(`<span class="yb gold">🏆 ${rec.continental.competition}</span>`);
  if (rec.nationalComp && rec.nationalComp.medal) badges.push(`<span class="yb gold">🥇 ${rec.nationalComp.name}</span>`);
  if (rec.awards && rec.awards.length) badges.push(`<span class="yb">🏅 ${rec.awards.length} ${rec.awards.length === 1 ? "premio" : "premi"}</span>`);
  if (rec.draftResult) badges.push(`<span class="yb blue">🎓 Draft</span>`);
  if (rec.injury) badges.push(`<span class="yb red">🩹 Infortuni</span>`);
  return badges.join("");
}
function renderLog() {
  const list = el("log-list");
  const items = [...player.history].reverse().map((rec, i) => {
    const details = awardsAndNoteText(rec).split(" · ").filter(x => x && x !== "-");
    return `
      <details class="year-card ${rec.champion ? "champ" : ""}" ${i === 0 ? "open" : ""}>
        <summary>
          <span class="yc-year">${rec.year}</span>
          <span class="yc-main">
            <span class="yc-team">${teamLabel(rec.team)} <span class="small-muted">${LEAGUES[rec.league].name} · ${rec.age} anni</span></span>
            <span class="yc-line">${rec.pts} PTS · ${rec.reb} REB · ${rec.ast} AST · ${rec.wins}-${rec.losses}</span>
            <span class="yc-badges">${careerYearBadges(rec)}</span>
          </span>
        </summary>
        ${details.length ? `<ul class="yc-details">${details.map(x => `<li>${x}</li>`).join("")}</ul>` : `<p class="small-muted yc-details">Una stagione tranquilla.</p>`}
      </details>`;
  });
  list.innerHTML = items.join("") || `<p class="small-muted">La tua carriera apparirà qui, stagione dopo stagione.</p>`;
}

function renderHistoryTable(tbodyId) {
  const tbody = el(tbodyId);
  const cell = (label, value, cls) => `<td data-label="${label}"${cls ? ` class="${cls}"` : ""}>${value}</td>`;
  tbody.innerHTML = player.history.map(rec => `
    <tr>
      ${cell("Età", rec.age)}
      ${cell("Anno", rec.year)}
      ${cell("Squadra", `${teamLabel(rec.team)}<div class="small-muted">${rec.team.city}</div>`)}
      ${cell("Lega", LEAGUES[rec.league].name)}
      ${cell("GP", rec.gp != null ? `${rec.gp}/${rec.games}` : "-")}
      ${cell("PTS", rec.pts)}
      ${cell("REB", rec.reb)}
      ${cell("AST", rec.ast)}
      ${cell("TOV", rec.tov ?? "-")}
      ${cell("FG%", `${rec.fg ?? "-"}%`)}
      ${cell("3P%", `${rec.tp ?? "-"}%`)}
      ${cell("OVR", rec.overall)}
      ${cell("Note", awardsAndNoteText(rec), rec.champion || (rec.awards && rec.awards.length) ? "trophy-cell" : "")}
    </tr>
  `).join("");
}
