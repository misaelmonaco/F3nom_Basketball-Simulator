"use strict";

/* Schermata "momento": ogni decisione, postseason, timeline della carriera. */

/* Schermata Off-Season a tutto schermo: draft, mercato, trattativa, imprevisti estivi e
   torneo con la Nazionale condividono qui la stessa cornice (mini header giocatore, eyebrow
   "PRE-STAGIONE", titolo/sottotitolo contestuali e una griglia di card cliccabili). */
function renderOffseasonScreen() {
  const d = player.pendingDecision;
  fillAvatar(el("off-avatar"), player);
  el("off-pname").textContent = `${player.firstName} ${player.lastName}`;
  el("off-pmeta").textContent = `${getRoleName(player.role)} · ${player.nationality}`;
  el("off-ovr-val").textContent = player.overall;
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

  if (d.type === "roleBattle") { renderRoleBattle(d, titleEl, subEl, cards); return; }
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
    return;
  }

  if (d.type === "draft") {
    titleEl.textContent = "Il Draft ti chiama";
    subEl.textContent = `Overall attuale: ${player.overall}. Puoi dichiararti al Draft NBA una sola volta in carriera: sei pronto per il grande salto?`;
    cards.innerHTML =
      offCardHtml({ idx: 0, icon: "🏀", iconTone: "var(--accent-2)", title: "Dichiarati al Draft", subtitle: "Un'occasione, una sola volta", desc: "Ti metti a disposizione delle squadre NBA. Se non vieni scelto, resta comunque una chance da free agent." }) +
      offCardHtml({ idx: 1, icon: "⏳", title: "Resta ancora un anno", subtitle: "Continua il tuo percorso", desc: "Rimani nella tua lega attuale per crescere ancora prima di tentare il salto." });
    cards.querySelector('[data-idx="0"]').addEventListener("click", () => resolveDraftDecision(true));
    cards.querySelector('[data-idx="1"]').addEventListener("click", () => resolveDraftDecision(false));
    return;
  }

  if (d.type === "draftCombine") { renderDraftCombine(d, titleEl, subEl, cards, extra); return; }

  if (d.type === "summerSpending") {
    const cur = playerCurrency(player);
    titleEl.textContent = "Come investi l'estate?";
    subEl.textContent = `Patrimonio disponibile: ${fmtMoney(player.wealth, cur)}. Puoi fare una sola scelta per estate, oppure tenerti i soldi.`;
    cards.innerHTML = SUMMER_SPENDING.map((o, i) => offCardHtml({
      idx: i, icon: o.icon, title: o.title, subtitle: `Costo ${fmtMoney(summerSpendingCost(player, o), cur)}`, desc: o.desc,
    })).join("") + offCardHtml({ idx: SUMMER_SPENDING.length, icon: "🏦", title: "Nessuna spesa", subtitle: "Tieni tutto da parte", desc: "Il patrimonio resta intatto per le prossime estati." });
    cards.querySelectorAll(".off-card").forEach(c => c.addEventListener("click", () => {
      const o = SUMMER_SPENDING[parseInt(c.dataset.idx)];
      resolveSummerSpending(o ? o.id : null);
    }));
    // gli acquisti di lifestyle non chiudono l'estate: se ne possono fare quanti se ne vuole
    extra.innerHTML = lifestyleShopHtml(player);
    extra.querySelectorAll("[data-buy]").forEach(b => b.addEventListener("click", () => buyLifestyle(b.dataset.buy)));
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
  if (d.type === "allStarWeekend") { renderAllStarWeekend(d, titleEl, subEl, cards); return; }
  if (d.type === "tradeDeadline") { renderTradeDeadline(d, titleEl, subEl, cards); return; }

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
    const nbaExitNotice = d.nbaExit === "buyout" ? `<p class="forced-notice" style="text-align:center;margin-bottom:14px">Una squadra NBA paga il buyout del tuo contratto europeo: puoi firmare in NBA, oppure restare rinnovando con il tuo club.</p>` : d.nbaExit ? `<p class="forced-notice" style="text-align:center;margin-bottom:14px">✈️ Clausola di uscita NBA attivata: il tuo contratto europeo non ti trattiene più.</p>` : "";
    const agent = getAgent(player);
    const agentHtml = player.agentChosen ? `<div class="btn-row" style="justify-content:center;margin:0 0 14px"><button class="btn btn-ghost" id="btn-change-agent">${agent.icon} Agente: ${agent.name} · cambia</button></div>` : "";
    // sotto il selettore: chi gioca in Europa nel campionato selezionato
    extra.innerHTML = leagueSelectorHtml + leagueEuroTeamsHtml(d.selectedLeague) + forcedNotice + buyoutNotice + nbaExitNotice + agentHtml;
    if (player.agentChosen) el("btn-change-agent").addEventListener("click", openAgentChoice);
    // la CTA signal va sull'offerta lampo, se c'è, altrimenti su quella della squadra più forte
    const strongest = d.flash ? -1 : d.offers.reduce((best, o, i) => (o.contractProposal.teamStrength > d.offers[best].contractProposal.teamStrength ? i : best), 0);
    cards.className = "off-cards offer-grid";
    cards.innerHTML = (d.flash ? offerCardHtml(d.flash, { idx: "flash", primary: true, flashTicks: d.flashTicks }) : "")
      + d.offers.map((o, i) => offerCardHtml(o, { idx: i, primary: i === strongest })).join("");
    cards.querySelectorAll(".off-card").forEach(c => {
      c.addEventListener("click", () => selectOffer(c.dataset.idx === "flash" ? d.flash : d.offers[parseInt(c.dataset.idx)], d));
    });
    extra.querySelectorAll(".league-pill").forEach(b => b.addEventListener("click", () => switchOfferLeague(b.dataset.league)));
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
            <p class="small-muted">Se rifiuti, i diritti decadono: dalla prossima estate potrai firmare con qualsiasi squadra NBA.</p>` : ""}
          ${d.returnTo && !d.rightsCall ? `<button class="btn btn-ghost" id="btn-back-extension">Lascia perdere l'estensione</button>` : ""}
          ${offer.stash && d.draftRecord ? `<button class="btn btn-ghost" id="btn-decline-draft"></button>
            <p class="small-muted">${offer.id === "rookie" ? "Resti nel tuo club attuale: la squadra NBA mantiene i tuoi diritti per un anno e ti richiamerà la prossima estate." : "Rinunci all'NBA per ora e torni al mercato abituale."}</p>` : ""}
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
    ${ps.interview ? `<div class="recap-section"><div class="recap-h">Dopo la serie · ${ps.interview.round}</div>${interviewHtml(ps.interview, "data-ps-tone")}</div>` : ""}
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
  if (active.pendingClutch) wireClutchPanel(body);
  body.querySelectorAll("[data-ps-tone]").forEach(b => b.addEventListener("click", () => answerPostseasonInterview(b.dataset.psTone)));
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
  const what = r.group ? (b.kind === "national" ? "5 partite, passano le migliori" : `${b.competition === "EuroLeague" ? 34 : 18} partite, passa chi vince almeno metà delle gare`)
    : r.bestOf === 1 ? "gara secca" : `serie al meglio di ${r.bestOf}`;
  return `<div class="ps-status next">Prossimo turno: <strong>${r.name}</strong> — ${what}</div>`;
}

/* Ultimo possesso di una partita punto a punto: contesto e tre azioni con la probabilità stimata */
function clutchPanelHtml(bracket) {
  const pc = bracket.pendingClutch;
  const game = pc.bestOf === 1 ? "Gara secca" : `Gara ${pc.us + pc.them + 1}${pc.decisive ? " (decisiva)" : ""}`;
  const context = pc.bestOf === 1 ? `Contro ${teamLabel(pc.opponent)}. ` : `Serie sul ${pc.us}-${pc.them} contro ${teamLabel(pc.opponent)}. `;
  return `
    <div class="clutch-box">
      <div class="clutch-head">🔥 ${bracket.competition} · ${pc.round} · ${game}</div>
      <p class="risk-narrative" style="margin:4px 0 12px">${context}Partita punto a punto: ultimi secondi, siete sotto di un punto e la palla è nelle tue mani. Cosa fai?</p>
      <div class="sb-options">
        ${CLUTCH_OPTIONS.map(o => `
          <button type="button" class="option-card sb-choice" data-clutch="${o.id}">
            <div class="oc-title">${o.icon} ${o.label} <span class="badge">${Math.round(clutchChance(player, pc.winProb, o) * 100)}%</span></div>
            <div class="oc-desc">${o.desc}</div>
          </button>`).join("")}
      </div>
    </div>`;
}
function wireClutchPanel(body) {
  body.querySelectorAll("[data-clutch]").forEach(b => b.addEventListener("click", () => resolveClutch(b.dataset.clutch)));
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
