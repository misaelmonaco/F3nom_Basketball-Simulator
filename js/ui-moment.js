"use strict";

/* Schermata "momento": ogni decisione, postseason, timeline della carriera. */

const SUMMER_SPENDING_META = i18nify({
  coachTech: {
    category: "Sviluppo Tecnico", categoryEn: "Skill Development",
    chips: [
      { text: "Tiro +2", textEn: "Shooting +2", tone: "green" },
      { text: "Finalizzazione +1", textEn: "Finishing +1", tone: "green" },
      { text: "Playmaking +1", textEn: "Playmaking +1", tone: "green" },
    ],
  },
  coachPhys: {
    category: "Condizione & Fisico", categoryEn: "Conditioning & Body",
    chips: [
      { text: "Atletismo +2", textEn: "Athleticism +2", tone: "green" },
      { text: "Fragilità −6", textEn: "Fragility −6", tone: "green" },
      { text: "Stamina +8", textEn: "Stamina +8", tone: "green" },
    ],
  },
  realEstate: {
    category: "Rendita Passiva Fissa", categoryEn: "Fixed Passive Income",
    chips: [
      { text: "+5% rendita garantita ogni anno", textEn: "+5% guaranteed yield per year", tone: "gold" },
    ],
  },
  startup: {
    category: "Venture Capital", categoryEn: "Venture Capital",
    chips: [
      { text: "🎲 35% Triplica il capitale", textEn: "🎲 35% Triple your capital", tone: "blue" },
      { text: "⚠️ 65% Rischio perdita", textEn: "⚠️ 65% Risk of loss", tone: "red" },
    ],
  },
  charity: {
    category: "Filantropia & Tifosi", categoryEn: "Philanthropy & Fans",
    chips: [
      { text: "Reputazione +4", textEn: "Reputation +4", tone: "blue" },
      { text: "Popolarità +3", textEn: "Popularity +3", tone: "gold" },
      { text: "Morale +2", textEn: "Morale +2", tone: "green" },
    ],
  },
});

function renderSummerSpending(d, titleEl, subEl, cards, extra) {
  const cur = playerCurrency(player);
  titleEl.textContent = tr("Come investi l'estate?", "How will you invest your summer?");
  subEl.textContent = tr(`Patrimonio disponibile: ${fmtMoney(player.wealth, cur)}. Scegli una sola opportunità di crescita o investimento per questa estate, oppure conserva i tuoi guadagni.`, `Available net worth: ${fmtMoney(player.wealth, cur)}. Pick one growth or investment opportunity for this summer, or save your earnings.`);

  cards.className = "off-cards off-cards-3col summer-cards";

  const optionsHtml = SUMMER_SPENDING.map((o, i) => {
    const meta = SUMMER_SPENDING_META[o.id] || { category: tr("Opportunità", "Opportunity"), chips: [] };
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
        <span class="summer-card-cat">${tr("Gestione Finanziaria", "Financial Management")}</span>
        <span class="summer-card-cost free">0 ${cur} <small>(0%)</small></span>
      </div>
      <div class="off-card-title">${tr("Nessuna Spesa", "No Spending")}</div>
      <div class="off-card-desc">${tr("Tieni tutto da parte: il tuo patrimonio resta intatto e disponibile per le prossime estati o per acquisti personali.", "Keep everything saved: your net worth stays intact and available for future summers or personal purchases.")}</div>
      <div class="summer-card-chips">
        <span class="badge blue">${tr("Capitale conservato al 100%", "100% Capital Preserved")}</span>
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
  el("off-eyebrow").textContent = d.type === "seasonFocus" ? tr("PRE-STAGIONE", "PRE-SEASON") : d.type === "roleBattle" ? "TRAINING CAMP" : d.type === "seasonBlock" ? tr("STAGIONE REGOLARE", "REGULAR SEASON") : d.type === "postseason" ? "POSTSEASON" : tr("ESTATE · MERCATO E DECISIONI", "SUMMER · MARKET & DECISIONS");
  el("off-timeline").innerHTML = seasonTimelineHtml();
  el("off-status-banner").innerHTML = OFFSEASON_HUB_TYPES.includes(d.type) ? contractStatusBannerHtml() : "";

  const titleEl = el("off-title"), subEl = el("off-subtitle"), cards = el("off-cards"), extra = el("off-extra");
  cards.className = "off-cards";
  cards.innerHTML = "";
  extra.className = "off-extra";
  extra.innerHTML = "";

  if (d.type === "seasonRecap") {
    const rec = player.history[player.history.length - 1];
    el("off-eyebrow").textContent = tr("RESOCONTO", "SEASON RECAP");
    titleEl.textContent = `${rec.champion ? "🏆 " : ""}${d.retireAfter ? tr("L'ultimo giro", "The Final Lap") : tr("La tua stagione", "Your Season")} ${rec.year}`;
    subEl.textContent = d.retireAfter ? tr("L'ultima stagione del tour d'addio: ovunque applausi. Ecco com'è andata.", "The final season of your farewell tour: standing ovations everywhere. Here's how it went.") : rec.champion ? tr("Una stagione da ricordare: ecco com'è andata.", "A season to remember: here's how it went.") : tr("Ecco com'è andata, prima di pensare all'estate.", "Here's how the season went, before heading into the summer.");
    extra.className = "off-extra moment-panel";
    renderSeasonRecap(extra, d);
    return;
  }
  if (d.type === "seasonBlock") {
    const def = SEASON_BLOCKS[player.pendingSeason.blocks.length];
    titleEl.textContent = `${def.icon} ${def.name}`;
    subEl.textContent = `${teamLabelText(player.pendingSeason.team)} · ${LEAGUES[player.pendingSeason.seasonLeague].name}. ${tr("Scegli come affrontare il prossimo tratto di stagione.", "Choose how to approach the next stretch of the season.")}`;
    extra.className = "off-extra moment-panel";
    renderSeasonBlockPanel(extra, d);
    return;
  }
  if (d.type === "postseason") {
    const b = currentBracket();
    titleEl.textContent = b ? `${PHASE_ICON[b.kind]} ${phaseLabel(b)}` : "Postseason";
    subEl.textContent = b && b.kind === "national" ? tr(`Con la Nazionale ${player.nationality}: ogni partita può valere una medaglia.`, `With the ${player.nationality} National Team: every game could be worth a medal.`) : tr("Gioca un turno alla volta: nelle partite punto a punto decidi tu l'ultimo possesso.", "Play one round at a time: in close games, you decide the final possession.");
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
  if (d.type === "lifeEvent") { el("off-eyebrow").textContent = tr("VITA PRIVATA", "PRIVATE LIFE"); renderLifeEvent(d, titleEl, subEl, cards); return; }
  if (d.type === "mentorOffer") { renderMentorOffer(d, titleEl, subEl, cards); return; }
  if (d.type === "injuryChoice") { el("off-eyebrow").textContent = tr("INFERMERIA", "MEDICAL ROOM"); renderInjuryChoice(d, titleEl, subEl, cards); return; }
  if (d.type === "sponsorOffer") { renderSponsorOffer(d, titleEl, subEl, cards, extra); return; }

  if (d.type === "training") {
    titleEl.textContent = tr("Allenamento estivo", "Summer Training");
    subEl.textContent = tr("Come usi le settimane di lavoro prima del training camp? Assegna i punti agli attributi o al recupero fisico.", "How will you spend your offseason workouts before training camp? Assign points to attributes or physical recovery.");
    extra.className = "off-extra moment-panel";
    renderTrainingPanel(extra, d);
    return;
  }

  if (d.type === "scenarioDone") { renderScenarioDone(d, titleEl, subEl, cards); return; }

  if (d.type === "careerGoal") {
    el("off-eyebrow").textContent = player.history.length ? tr("UN NUOVO TRAGUARDO", "A NEW GOAL") : tr("INIZIO CARRIERA", "CAREER START");
    titleEl.textContent = tr("Qual è il tuo sogno?", "What is your dream?");
    subEl.textContent = tr(`Scegli il traguardo che darà una direzione a tutta la carriera. Se lo realizzi: reputazione +${CAREER_GOAL_REWARD.reputation}, popolarità +${CAREER_GOAL_REWARD.popularity}, +${CAREER_GOAL_REWARD.goat} punti GOAT e una spinta verso la Hall of Fame.`, `Choose the milestone that will guide your entire career. If you achieve it: reputation +${CAREER_GOAL_REWARD.reputation}, popularity +${CAREER_GOAL_REWARD.popularity}, +${CAREER_GOAL_REWARD.goat} GOAT points, and a Hall of Fame boost.`);
    cards.innerHTML = d.options.map((id, i) => {
      const g = getCareerGoal(id);
      return offCardHtml({ idx: i, icon: g.icon, title: g.label,
        subtitle: g.deadline ? tr(`Entro i ${g.deadline} anni`, `By age ${g.deadline}`) : g.endOnly ? tr("Si decide a fine carriera", "Decided at retirement") : tr("Nessuna scadenza", "No deadline") });
    }).join("");
    cards.querySelectorAll(".off-card").forEach(c => c.addEventListener("click", () => chooseCareerGoal(d.options[parseInt(c.dataset.idx)])));
    return;
  }

  if (d.type === "seasonFocus") {
    titleEl.textContent = tr("Su cosa ti concentri quest'anno?", "What is your focus this year?");
    subEl.textContent = tr("Scegli il focus del tuo lavoro per la stagione: darà una spinta agli attributi coerenti e potrebbe, con il tempo, far evolvere il tuo stile di gioco.", "Choose your training focus for the season: it will boost matching attributes and may evolve your playstyle over time.");
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
    titleEl.textContent = tr("Il Draft ti chiama", "The Draft Is Calling");
    subEl.textContent = tr(`Overall attuale: ${player.overall}. Puoi dichiararti al Draft USA-1 una sola volta in carriera: sei pronto per il grande salto?`, `Current Overall: ${player.overall}. You can declare for the USA-1 Draft only once in your career: are you ready for the big leap?`);
    cards.innerHTML =
      offCardHtml({ idx: 0, icon: "🏀", iconTone: "var(--accent-2)", title: tr("Dichiarati al Draft", "Declare for the Draft"), subtitle: tr("Un'occasione, una sola volta", "One shot, once in a career"), desc: tr("Ti metti a disposizione delle squadre USA-1. Se non vieni scelto, resta comunque una chance da free agent.", "Make yourself eligible for USA-1 teams. Even if you go undrafted, you may still get a free-agent shot.") }) +
      offCardHtml({ idx: 1, icon: "⏳", title: tr("Resta ancora un anno", "Stay Another Year"), subtitle: tr("Continua il tuo percorso", "Continue your development"), desc: tr("Rimani nella tua lega attuale per crescere ancora prima di tentare il salto.", "Remain in your current league to develop further before declaring.") });
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
    titleEl.textContent = d.change ? tr("Cambia agente", "Change Agent") : tr("Scegli il tuo agente", "Choose Your Agent");
    subEl.textContent = tr("L'agente tratta i tuoi contratti e prende una commissione sull'ingaggio: ognuno spinge la tua carriera in una direzione diversa.", "Your agent negotiates contracts and takes a commission on your salary: each one pushes your career in a different direction.");
    cards.innerHTML = AGENTS.map((a, i) => offCardHtml({
      idx: i, icon: a.icon, title: a.name, subtitle: a.commission ? tr(`Commissione ${Math.round(a.commission * 100)}%`, `${Math.round(a.commission * 100)}% Commission`) : tr("Nessuna commissione", "No commission"), desc: a.desc,
      tags: player.agent === a.id ? [{ text: tr("Agente attuale", "Current Agent"), tone: "blue" }] : [],
    })).join("");
    cards.querySelectorAll(".off-card").forEach(c => c.addEventListener("click", () => chooseAgent(AGENTS[parseInt(c.dataset.idx)].id)));
    return;
  }

  if (d.type === "playerOption") {
    titleEl.textContent = "Player option";
    subEl.textContent = tr(`Il tuo contratto con ${player.team.name} ha un'opzione a tuo favore: puoi restare per l'ultimo anno oppure uscire e tornare sul mercato.`, `Your contract with ${player.team.name} includes a Player Option: you can opt in for the final year or opt out and test free agency.`);
    cards.innerHTML =
      offCardHtml({ idx: 0, icon: "🔒", title: tr("Esercita l'opzione", "Exercise Option"), subtitle: tr("Resti un altro anno", "Stay for another year"), desc: tr(`Ultimo anno a ${fmtMoney(player.contract.salaryPerYear, playerCurrency(player))}. La società potrebbe anche proporti un'estensione.`, `Final year at ${fmtMoney(player.contract.salaryPerYear, playerCurrency(player))}. The club might also offer you an extension.`) }) +
      offCardHtml({ idx: 1, icon: "🔓", iconTone: "var(--accent-2)", title: tr("Esci dal contratto", "Opt Out of Contract"), subtitle: "Free agency", desc: tr("Ti liberi subito e valuti le offerte di tutte le squadre, rinnovo compreso.", "Become a free agent immediately and evaluate offers from every team, including re-signing.") });
    cards.querySelector('[data-idx="0"]').addEventListener("click", () => resolvePlayerOption(true));
    cards.querySelector('[data-idx="1"]').addEventListener("click", () => resolvePlayerOption(false));
    return;
  }

  if (d.type === "offseasonStatus" && d.extensionOffer) {
    const cp = d.extensionOffer.contractProposal;
    titleEl.textContent = tr("Proposta di estensione", "Contract Extension Offer");
    subEl.textContent = tr(`${player.team.name} vuole blindarti prima della scadenza. Puoi trattare il rinnovo ora oppure giocarti l'ultimo anno e andare sul mercato.`, `${player.team.name} wants to lock you up before expiration. You can negotiate an extension now or play out your final year and hit free agency.`);
    cards.innerHTML =
      offCardHtml({ idx: 0, icon: "✍️", iconTone: "var(--accent-2)", title: tr("Tratta l'estensione", "Negotiate Extension"), subtitle: `${cp.years} ${tr("anni", "years")} · ${fmtMoney(cp.salary, cp.currency)}/${tr("anno", "yr")}`, desc: tr("Si apre la trattativa: puoi chiedere durata, ingaggio e clausole.", "Open negotiations: you can discuss length, salary, and clauses.") }) +
      offCardHtml({ idx: 1, icon: "⏳", title: tr("Aspetta la scadenza", "Wait for Free Agency"), subtitle: tr("Ultimo anno di contratto", "Final contract year"), desc: tr("Nessun rinnovo per ora: a fine stagione sarai libero di scegliere.", "No extension for now: at the end of the season you'll be a free agent.") });
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
    titleEl.textContent = tr("Verso la prossima stagione", "Heading Into Next Season");
    subEl.textContent = tr("Il tuo contratto è ancora valido: la dirigenza non richiede alcuna decisione, ci si prepara direttamente alla prossima annata.", "Your contract is still active: management requires no decision right now, you're gearing up directly for next season.");
    cards.className = "off-cards off-cards-single";
    cards.innerHTML = offCardHtml({ icon: "📋", staticCard: true, title: player.team.name, subtitle: LEAGUES[player.league].name, desc: tr("Nessuna trattativa in corso: la squadra si affida a te anche per la prossima stagione.", "No active negotiations: the team counts on you for next season too.") });
    extra.innerHTML = `<div class="btn-row" style="justify-content:center;margin-top:10px"><button class="btn btn-primary btn-lg" id="btn-offseason-continue">▶️ ${tr("Continua", "Continue")}</button></div>` + duoButtonHtml() + buyoutBoxHtml(player, d.record);
    el("btn-offseason-continue").addEventListener("click", advanceAfterOffseason);
    if (el("btn-duo")) el("btn-duo").addEventListener("click", openDuoRequest);
    if (el("btn-buyout")) el("btn-buyout").addEventListener("click", buyContractOut);
    return;
  }

  if (d.type === "market") {
    titleEl.textContent = tr("Mercato Estivo", "Summer Free Agency");
    subEl.textContent = tr("Confronta le offerte: campionato, squadra e possibilità di competere per il titolo.", "Compare offers: league, team, and championship contention odds.");
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
      ? `<p class="forced-notice" style="text-align:center;margin-bottom:14px">🚪 ${tr("Rottura col club dopo i fatti dell'estate: il rinnovo non è più un'opzione, devi trovare una nuova squadra.", "Breakup with the club after this summer's events: re-signing is no longer an option, you must find a new team.")}</p>`
      : "";
    const buyoutNotice = d.buyout ? `<p class="forced-notice" style="text-align:center;margin-bottom:14px">💼 ${tr("Hai pagato il buyout: il tuo vecchio club non ti rinnova, trova una nuova squadra.", "You paid the buyout: your former club won't re-sign you, find a new team.")}</p>` : "";
    const nbaExitNotice = d.nbaExit === "buyout" ? `<p class="forced-notice" style="text-align:center;margin-bottom:14px">${tr("Una squadra USA-1 paga il buyout del tuo contratto europeo: puoi firmare in USA-1, oppure restare rinnovando con il tuo club.", "A USA-1 team is paying the buyout on your European contract: you can sign in USA-1 or stay by re-signing with your club.")}</p>` : d.nbaExit ? `<p class="forced-notice" style="text-align:center;margin-bottom:14px">✈️ ${tr("Clausola di uscita USA-1 attivata: il tuo contratto europeo non ti trattiene più.", "USA-1 out clause activated: your European contract no longer holds you back.")}</p>` : "";
    const agent = getAgent(player);
    const probesLeft = d.probesLeft == null ? 2 : d.probesLeft;
    const probeBtnText = probesLeft > 0
      ? tr(`🎯 Sonda una squadra (${probesLeft} ${probesLeft === 1 ? "tentativo rimasto" : "tentativi rimasti"})`, `🎯 Contact Target Team (${probesLeft} ${probesLeft === 1 ? "attempt left" : "attempts left"})`)
      : tr(`🎯 Colloqui mirati esauriti`, `🎯 Outreach attempts exhausted`);
    const agentHtml = `
      <div class="market-agent-bar">
        <div class="market-agent-row">
          ${player.agentChosen ? `<button class="btn btn-ghost btn-sm" id="btn-change-agent">${agent.icon} ${tr("Agente", "Agent")}: ${agent.name} · ${tr("cambia", "change")}</button>` : ""}
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
    titleEl.textContent = tr(`Trattativa con ${offer.team.name}`, `Negotiating with ${offer.team.name}`);
    subEl.textContent = `${LEAGUES[offer.targetLeague].name} · ${offer.team.city}${player.agentChosen ? ` · ${tr("agente", "agent")}: ${agent.name}` : ""}`;
    // a sinistra l'offerta e il ruolo, a destra pazienza, firma e richieste con la loro probabilità
    const closed = patience <= 0;
    // la durata si tratta con lo slider (non per i contratti da rookie né per le borse di studio)
    const yearsFixed = offer.id === "rookie" || cp.salary == null;
    const yearsOff = closed || offer.attempts.years >= 2;
    const yearsTarget = clamp(cp.years + 1 <= CONTRACT_YEARS_MAX ? cp.years + 1 : cp.years - 1, CONTRACT_YEARS_MIN, CONTRACT_YEARS_MAX);
    const cup = teamEuroCup(offer.team, offer.targetLeague);
    const role = cp.teamRole ? getTeamRole(cp.teamRole) : null;
    const terms = [
      `<span class="co-chip co-chip--solid">${cp.years} ${cp.years === 1 ? tr("anno", "year") : tr("anni", "years")}</span>`,
      `<span class="co-chip co-chip--solid co-num">${cp.salary == null ? tr("Borsa di studio", "Scholarship") : `${fmtMoney(cp.salary, cp.currency)} / ${tr("anno", "yr")}`}</span>`,
      ...(cp.supermax ? [`<span class="co-chip co-chip--gold">Supermax</span>`] : []),
      `<span class="co-chip co-chip--live">${tr("Squadra OVR", "Team OVR")} ${teamOverallFromStrength(cp.teamStrength)}</span>`,
      ...(cup ? [`<span class="co-chip ${cup.id === "EL" ? "co-chip--gold" : "co-chip--live"}">${cup.name}</span>`] : []),
      ...(role ? [`<span class="co-chip co-chip--signal">${role.label}</span>`] : []),
      ...clauseLabels(cp.clauses).map(l => `<span class="co-chip co-chip--up">${stripEmoji(l)}</span>`),
    ].join("");
    const asks = [
      askRowHtml({ id: "btn-negotiate-salary", label: tr("Aumento", "Salary Raise"), meta: cp.salary == null ? tr("Nessun ingaggio da trattare", "No salary to negotiate") : tr(`${2 - offer.attempts.salary} tentativi`, `${2 - offer.attempts.salary} attempts`), chance: negotiationChance(player), disabled: closed || cp.salary == null || offer.attempts.salary >= 2 }),
      ...(canAskTeamRole(cp) ? [askRowHtml({ id: "btn-negotiate-role", label: tr(`Più responsabilità: ${getTeamRole(nextTeamRoleUp(cp.teamRole)).label.toLowerCase()}`, `Bigger role: ${getTeamRole(nextTeamRoleUp(cp.teamRole)).label.toLowerCase()}`), meta: offer.attempts.role ? tr("Respinta", "Rejected") : tr("1 tentativo", "1 attempt"), chance: teamRoleAskChance(player, cp), disabled: closed || !!offer.attempts.role })] : []),
    ].join("");
    // le clausole ottenute restano in elenco, segnate: così si vede subito cosa hai strappato
    const clauses = CONTRACT_CLAUSES.filter(c => c.available(cp, offer, player) || cp.clauses[c.id]).map(c => cp.clauses[c.id]
      ? askRowHtml({ cls: "co-ask--clause co-ask--won", label: c.label, meta: c.desc, status: tr("Ottenuta", "Granted"), disabled: true })
      : askRowHtml({ cls: "co-ask--clause", attr: `data-clause="${c.id}"`, label: c.label, meta: offer.attempts[c.id] ? tr("Respinta: non si può richiedere di nuovo", "Rejected: cannot request again") : c.desc,
          chance: clauseChance(player, offer, c), disabled: closed || !!offer.attempts[c.id], title: c.desc })).join("");
    cards.className = "off-cards neg-layout";
    cards.innerHTML = `
      <div class="neg-col">
        ${offerCardHtml(offer, { staticCard: true, body: `<p class="off-card-desc">${offer.desc}</p><div class="co-row">${terms}</div>` })}
        ${role ? `<section class="card neg-role"><div class="card-title"><h3>${tr("Il tuo ruolo", "Your Role")}</h3></div>${teamRoleBoxHtml(cp)}</section>` : ""}
      </div>
      <section class="card neg-side">
        <div class="neg-patience">
          <div><div class="neg-k">${tr("Pazienza della dirigenza", "Front Office Patience")} ${helpTip("patience")}</div><div class="small-muted">${tr("Ogni richiesta respinta la consuma: a zero l'offerta viene ritirata.", "Every rejected request drains patience: at zero the offer is withdrawn.")}</div></div>
          ${pipsHtml(Math.max(0, patience), OFFER_PATIENCE, "signal")}
        </div>
        <button class="btn btn-primary btn-lg btn-block" id="btn-sign-contract">${tr("Firma alle condizioni proposte", "Sign on Current Terms")}</button>
        <p class="neg-k">${tr("Rilancia · probabilità che accettino", "Counteroffer · acceptance odds")}</p>
        ${yearsFixed ? "" : `<div class="neg-years">
          <div class="neg-years__head"><span class="co-ask__t">${tr("Durata", "Length")}</span><span class="neg-years__val" id="neg-years-val"></span></div>
          <input type="range" id="neg-years" min="${CONTRACT_YEARS_MIN}" max="${CONTRACT_YEARS_MAX}" step="1" value="${yearsTarget}" ${yearsOff ? "disabled" : ""} aria-label="${tr("Durata del contratto richiesta, in anni", "Requested contract length in years")}">
          <div class="neg-years__ticks" aria-hidden="true">${[1, 2, 3, 4, 5].map(n => `<span class="${n === cp.years ? "is-offer" : ""}">${n}</span>`).join("")}</div>
          <div class="co-asks">${askRowHtml({ id: "btn-negotiate-years", label: tr("Proponi la durata", "Propose length"), meta: offer.attempts.years >= 2 ? tr("Nessun tentativo rimasto", "No attempts left") : tr(`${2 - offer.attempts.years} ${2 - offer.attempts.years === 1 ? "tentativo" : "tentativi"} · la proposta è di ${cp.years} ${cp.years === 1 ? "anno" : "anni"}`, `${2 - offer.attempts.years} ${2 - offer.attempts.years === 1 ? "attempt" : "attempts"} · current offer is ${cp.years} ${cp.years === 1 ? "year" : "years"}`), chance: yearsAskChance(player, cp, yearsTarget), disabled: yearsOff || yearsTarget === cp.years })}</div>
        </div>`}
        <div class="co-asks">${asks}</div>
        ${clauses ? `<div class="neg-clauses"><p class="neg-clauses__k">${tr("Clausole del contratto", "Contract Clauses")} ${helpTip("clauses")}</p><p class="small-muted">${tr("Una richiesta per clausola: se la società dice no, consuma pazienza.", "One request per clause: if the club refuses, it drains patience.")}</p><div class="co-asks">${clauses}</div></div>` : ""}
        <div class="neg-exits">
          ${d.marketDecision ? `<button class="btn btn-ghost" id="btn-back-offers">${tr("Valuta altre offerte", "Explore Other Offers")}</button>` : ""}
          ${d.returnTo && d.rightsCall ? `<button class="btn btn-ghost" id="btn-decline-rights">${tr(`Rifiuta e resta a ${player.team.name}`, `Decline and stay with ${player.team.name}`)}</button>
            <p class="small-muted">${tr("Se rifiuti, i diritti decadono: dalla prossima estate potrai firmare con qualsiasi squadra USA-1.", "If you decline, their rights expire: starting next summer you can sign with any USA-1 team.")}</p>` : ""}
          ${d.returnTo && !d.rightsCall ? `<button class="btn btn-ghost" id="btn-back-extension">${tr("Lascia perdere l'estensione", "Pass on Extension")}</button>` : ""}
          ${offer.stash && d.draftRecord ? `<button class="btn btn-ghost" id="btn-decline-draft"></button>
            <p class="small-muted">${offer.id === "rookie" ? tr("Resti nel tuo club attuale: la squadra USA-1 mantiene i tuoi diritti per un anno e ti richiamerà la prossima estate.", "You stay with your current club: the USA-1 team retains your rights for one year and will call you back next summer.") : tr("Rinunci alla USA-1 per ora e torni al mercato abituale.", "Pass on USA-1 for now and return to the regular market.")}</p>` : ""}
        </div>
      </section>`;
    if (offer.stash && d.draftRecord) {
      el("btn-decline-draft").textContent = offer.id === "rookie" ? tr(`Rifiuta e resta a ${offer.stash.team.name}`, `Decline and stay with ${offer.stash.team.name}`) : tr("Rifiuta e continua il tuo percorso", "Decline and continue on your path");
      el("btn-decline-draft").addEventListener("click", () => declineDraftOffer(false));
    }
    el("btn-sign-contract").addEventListener("click", finalizeContract);
    if (!yearsFixed) {
      // lo slider aggiorna al volo la probabilità; il pulsante propone la durata scelta
      const slider = el("neg-years"), btn = el("btn-negotiate-years");
      const refresh = () => {
        const n = parseInt(slider.value);
        el("neg-years-val").textContent = `${n} ${n === 1 ? tr("anno", "year") : tr("anni", "years")}`;
        const ch = yearsAskChance(player, cp, n);
        const off = yearsOff || n === cp.years;
        btn.disabled = off;
        btn.setAttribute("aria-disabled", String(off));
        btn.querySelector(".co-ask__p").textContent = off || ch == null ? "—" : `${Math.round(ch * 100)}%`;
        btn.querySelector(".co-ask__odds i").style.width = `${off || ch == null ? 0 : Math.round(ch * 100)}%`;
        btn.querySelector(".co-ask__t").textContent = n === cp.years ? tr("Scegli una durata diversa", "Pick a different length") : tr(`Proponi ${n} ${n === 1 ? "anno" : "anni"}`, `Propose ${n} ${n === 1 ? "year" : "years"}`);
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
    subEl.textContent = `☀️ ${tr("Imprevisto dell'estate", "Summer Event")} — ${ev.category}. ${offseasonEventPreview(ev, player)}`;
    cards.innerHTML =
      offCardHtml({ idx: 0, icon: "🎲", iconTone: "var(--accent-2)", title: tr("Prendi il rischio", "Take the Risk"), subtitle: ev.goodLabel, desc: tr(`Possibilità di successo: ${chance}%`, `Chance of success: ${chance}%`), tags: [{ text: `📈 ${chance}%`, tone: "green" }, { text: `📉 ${100-chance}%`, tone: "red" }] }) +
      offCardHtml({ idx: 1, icon: "🛡️", title: tr("Gioca sicuro", "Play It Safe"), subtitle: tr("Nessun rischio", "No risk"), desc: tr("Nessun effetto: si evita completamente l'imprevisto.", "No effect: avoid the event completely.") });
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
    titleEl.textContent = tr("Il verdetto dell'estate", "Summer Verdict");
    subEl.textContent = rv.takeRisk ? tr("Il rischio viene corso...", "Rolling the dice...") : tr("Si gioca sul sicuro...", "Playing it safe...");
    cards.className = "off-cards off-cards-single";
    cards.innerHTML = `
      <div class="off-card static">
        <div class="reveal-wrap">
          <div class="reveal-roll" id="reveal-roll">
            <div class="reveal-dice">${rollIcon}</div>
            <p class="reveal-suspense">${tr("In corso...", "In progress...")}</p>
          </div>
          <div class="reveal-result hidden ${toneClass}" id="reveal-result">
            <div class="reveal-result-icon">${resultIcon}</div>
            <div class="reveal-result-title">${out.title}</div>
            ${out.rollText ? `<div class="reveal-rolltext">🎲 ${out.rollText}</div>` : ""}
            <p class="reveal-narrative">${out.narrative}</p>
            ${out.consequences.length ? `<ul class="reveal-consequences">${out.consequences.map(c => `<li>${c}</li>`).join("")}</ul>` : ""}
            <button class="btn btn-primary" id="btn-reveal-continue">${tr("Continua", "Continue")}</button>
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
      subEl.textContent = tr("L'estate ha fatto il suo corso.", "Summer has run its course.");
      el("btn-reveal-continue").addEventListener("click", confirmOffseasonReveal);
    }, 1300);
    return;
  }

  if (d.type === "nationalReveal") {
    const comp = d.comp;
    const flag = comp.kind === "world" ? "🌎" : "🌍";
    const medalClass = comp.champion ? "champ" : comp.medal ? "medal" : "out";
    titleEl.textContent = `${flag} ${comp.name}`;
    subEl.textContent = tr(`${player.nationality} — la tua Nazionale ha disputato il torneo estivo.`, `${player.nationality} — your National Team competed in the summer tournament.`);
    cards.className = "off-cards off-cards-single";
    cards.innerHTML = `
      <div class="off-card static">
        ${campaignTrackerHtml(NATIONAL_STAGES, nationalStageIndex(comp))}
        <div class="ps-status ${medalClass}" style="margin-top:12px">${nationalCompOutcomeText(comp)}</div>
      </div>`;
    extra.innerHTML = `<div class="btn-row" style="justify-content:center;margin-top:10px"><button class="btn btn-primary btn-lg" id="btn-national-continue">▶️ ${tr("Continua verso la Regular Season", "Continue to the Regular Season")}</button></div>`;
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
    ${ps.interview ? `<div class="recap-section"><div class="recap-h">${tr("Dopo la serie", "After the series")} · ${ps.interview.round}</div>${interviewHtml(ps.interview, "data-ps-tone", "data-ps-follow")}</div>` : ""}
    ${past}
    <div class="ps-bracket active phase-current">
      <div class="ps-bracket-title">${PHASE_ICON[active.kind]} ${phaseLabel(active)}${active.kind === "national" ? ` — ${player.nationality}` : ""}</div>
      ${active.results.map(seriesRowHtml).join("")}
      ${phaseStatusHtml(active)}
    </div>
    ${active.pendingClutch ? clutchPanelHtml(active) : ""}
    <div class="btn-row">
      ${nextRound ? `<button class="btn btn-primary" id="btn-play-round">▶️ ${tr("Gioca", "Play")} ${nextRound.group ? tr("la fase a gironi", "group stage") : nextRound.name}</button>` : ""}
      <button class="btn btn-secondary" id="btn-sim-phase">⏩ ${tr("Simula questa fase", "Simulate this phase")}</button>
      ${hasLaterPhases ? `<button class="btn btn-ghost" id="btn-sim-postseason">⏭️ ${tr("Simula tutto", "Simulate all")}</button>` : ""}
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
  return plays.map(pl => `<span title="${tr(`Gara ${pl.game} punto a punto`, `Close Game ${pl.game}`)}: ${pl.label}">${pl.success ? "🎯" : "💔"}</span>`).join("");
}
function seriesRowHtml(r) {
  if (r.group) {
    return `
      <div class="series-row ${r.won ? "won" : "lost"}">
        <span class="sr-round">${r.round}</span>
        <span class="sr-opp">${r.stats ? `${r.stats.pts} PTS · ${r.stats.reb} REB · ${r.stats.ast} AST` : tr("Girone", "Group")}</span>
        <span class="sr-score">${r.wins}-${r.losses}</span>
        <span class="sr-flag">${r.won ? "✅" : "❌"}</span>
      </div>`;
  }
  return `
    <div class="series-row ${r.won ? "won" : "lost"}">
      <span class="sr-round">${r.round}</span>
      <span class="sr-opp">${teamLabel(r.opponent)}</span>
      <span class="sr-score">${r.bestOf === 1 ? (r.won ? tr("V", "W") : tr("P", "L")) : `${r.us}-${r.them}`}</span>
      <span class="sr-flag">${clutchIconsHtml(r)} ${r.won ? "✅" : "❌"}</span>
    </div>`;
}
function phaseOutcomeText(b) {
  if (b.kind === "national") return nationalCompOutcomeText(nationalCompFromBracket(b));
  if (b.champion) return tr("🏆 Titolo vinto!", "🏆 Title won!");
  return b.eliminatedAt ? `${tr("eliminati", "eliminated")}: ${b.eliminatedAt}` : tr("conclusa", "completed");
}
function phaseStatusHtml(b) {
  if (b.done) return `<div class="ps-status ${b.champion ? "champ" : "out"}">${phaseOutcomeText(b)}</div>`;
  if (b.pendingClutch) {
    const pc = b.pendingClutch;
    return `<div class="ps-status next">${pc.round}${pc.bestOf > 1 ? ` · ${tr("serie sul", "series at")} ${pc.us}-${pc.them}` : ""}: ${tr("partita punto a punto in corso", "close game in progress")}</div>`;
  }
  const r = b.rounds[b.idx];
  const what = r.group ? (b.kind === "national" ? tr("5 partite, passano le migliori", "5 games, top teams advance") : tr(`${b.competition === "EUROPE-1" ? 34 : 18} partite, passa chi vince almeno metà delle gare`, `${b.competition === "EUROPE-1" ? 34 : 18} games, win at least half to advance`))
    : r.bestOf === 1 ? tr("gara secca", "single-elimination game") : tr(`serie al meglio di ${r.bestOf}`, `best-of-${r.bestOf} series`);
  return `<div class="ps-status next">${tr("Prossimo turno", "Next round")}: <strong>${r.name}</strong> — ${what}</div>`;
}

/* Ultimo possesso di una partita punto a punto: modale clutch autentica */
function renderClutchModal(opts) {
  const overlay = el("clutch-overlay");
  const card = el("clutch-modal-card");
  if (!overlay || !card) return;
  const best = opts.options.reduce((b, o) => (o.pct > b.pct ? o : b), opts.options[0]);
  card.innerHTML = `
    <div class="cm-head">
      <span class="cm-tag">${opts.tag || tr("Gara Punto a Punto", "Crunch Time")}</span>
      <span class="ev-head-right">
        <span class="cm-round">${opts.roundLabel}</span>
        ${opts.closable ? `<button type="button" class="cm-close" data-cm-close aria-label="${tr("Chiudi", "Close")}">✕</button>` : ""}
      </span>
    </div>
    <div class="cm-scoreboard">
      <div class="cm-team">
        <span class="cm-team-name">${opts.oppName}</span>
        <span class="cm-score">${opts.oppScore}</span>
      </div>
      <div class="cm-center-info">
        <span class="cm-timer" id="cm-display-timer">${opts.timer || "00:04.8"}</span>
        <span class="cm-period">${tr("4° Quarto · Bonus", "4th Quarter · Bonus")}</span>
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
        const gameStr = typeof game === "number" ? tr(`Gara ${game}`, `Game ${game}`) : String(game || "");
        const winSub = gameStr
          ? ((gameStr.startsWith("Gara") || gameStr.startsWith("Game")) ? tr(`${gameStr} è vinta!`, `${gameStr} is won!`) : tr(`vittoria contro ${gameStr}!`, `win against ${gameStr}!`))
          : tr("partita vinta!", "game won!");
        const lossSub = gameStr
          ? ((gameStr.startsWith("Gara") || gameStr.startsWith("Game")) ? tr(`${gameStr} persa.`, `${gameStr} lost.`) : tr(`sconfitta contro ${gameStr}.`, `loss against ${gameStr}.`))
          : tr("partita persa.", "game lost.");

        body.innerHTML = `
          <div class="cm-outcome ${success ? "won" : "lost"}">
            <span class="cm-outcome-icon">${success ? "🎯" : "💔"}</span>
            <div class="cm-outcome-title">${success ? tr("CANESTRO SULLA SIRENA!", "BUZZER BEATER!") : tr("SBATTE SUL FERRO!", "RIMS OUT!")}</div>
            <div class="cm-outcome-sub">
              ${success
                ? tr(`La giocata (${label}) buca la retina: ${winSub}`, `The play (${label}) finds the bottom of the net: ${winSub}`)
                : tr(`La difesa regge, tiro respinto: ${lossSub}`, `Defense holds firm, shot denied: ${lossSub}`)}
            </div>
            <button type="button" class="btn ${success ? "btn-primary" : "btn-secondary"} btn-lg cm-outcome-btn" id="btn-clutch-next">${tr("Continua ➔", "Continue ➔")}</button>
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
  const movesTxt = `${ticks} ${ticks === 1 ? tr("mossa", "move") : tr("mosse", "moves")}`;
  const caller = player.agentChosen ? tr(`Il tuo agente, ${getAgent(player).name}`, `Your agent, ${getAgent(player).name}`) : tr("Il tuo agente", "Your agent");
  const rows = offerDetailsRows(o).map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
  renderEventModal({
    tone: "signal",
    tag: tr("Chiamata in arrivo · Offerta lampo", "Incoming Call · Flash Offer"),
    meta: tr(`Scade tra ${movesTxt}`, `Expires in ${movesTxt}`),
    heroHtml: `
      <div class="ev-team-band" style="${teamVars(o.team)}">
        <span class="ev-team-mono">${(o.team.name[0] || "?").toUpperCase()}</span>
        <div class="ev-team-info">
          <span class="ev-team-name">${o.team.name}</span>
          <span class="ev-team-sub">${o.team.city} · ${LEAGUES[o.targetLeague].name}</span>
        </div>
        <span class="ev-ring" aria-hidden="true">📞</span>
      </div>`,
    text: tr(`${caller} ti chiama: <strong>${o.team.name}</strong> ha appena messo sul tavolo un'offerta più ricca di tutte le altre. Vogliono una risposta adesso: se cambi campionato o apri un'altra trattativa, tra <strong>${movesTxt}</strong> prendono un altro giocatore.`, `${caller} calls you: <strong>${o.team.name}</strong> just put an offer on the table richer than any other. They want an answer now: if you switch leagues or open another negotiation, in <strong>${movesTxt}</strong> they'll sign someone else.`),
    bodyHtml: `<dl class="off-card-details ev-details">${rows}</dl>`,
    options: [
      { id: "open", icon: "✍️", label: tr("Apri subito la trattativa", "Open negotiations now"), desc: tr("Pazienza minima: puoi chiedere poco prima che chiudano il discorso.", "Minimal patience: you can ask very little before they walk away."), primary: true },
      { id: "later", icon: "🗂️", label: tr("Prima guardo le altre offerte", "Check other offers first"), desc: tr("L'offerta resta in cima alla lista, ma il tempo scorre.", "The offer stays at the top of the list, but the clock is ticking.") },
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
          <span class="cm-tag">🎯 ${tr("Esito Colloquio", "Outreach Outcome")}</span>
          <span class="ev-head-right">
            <button type="button" class="cm-close" data-ev-close aria-label="${tr("Chiudi", "Close")}">✕</button>
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
          <h3 class="ev-title">${isSuccess ? tr("🎉 Proposta Ufficiale Ricevuta!", "🎉 Official Offer Received!") : tr("❌ Colloquio Negativo", "❌ Outreach Declined")}</h3>
          <p class="cm-narrative">
            ${isSuccess
              ? tr(`I dirigenti di <strong>${t.name}</strong> hanno accolto la richiesta: la trattativa è aperta e l'offerta contrattuale è ora sul tuo tavolo!`, `<strong>${t.name}</strong>'s management welcomed the outreach: talks are open and their contract offer is now on your table!`)
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
              <span class="co-chip co-chip--solid">${outcomeData.offer.contractProposal.years} ${outcomeData.offer.contractProposal.years === 1 ? tr("anno", "year") : tr("anni", "years")}</span>
              <span class="co-chip co-chip--solid co-num">${outcomeData.offer.contractProposal.salary == null ? tr("Borsa di studio", "Scholarship") : `${fmtMoney(outcomeData.offer.contractProposal.salary, outcomeData.offer.contractProposal.currency)} / ${tr("anno", "yr")}`}</span>
              <span class="co-chip co-chip--live">${tr("OVR Squadra", "Team OVR")} ${teamOverallFromStrength(outcomeData.offer.contractProposal.teamStrength)}</span>
            </div>` : ""}
          <div class="cm-choices" style="margin-top:16px;">
            ${isSuccess ? `
              <button type="button" class="btn btn-primary btn-lg btn-block" id="btn-probe-go-offer">
                📋 ${tr(`Vai all'offerta di ${t.name}`, `View ${t.name} Offer`)}
              </button>` : `
              ${(d.probesLeft > 0) ? `
                <button type="button" class="btn btn-primary btn-block" id="btn-probe-retry">
                  🎯 ${tr(`Sonda un'altra squadra (${d.probesLeft} ${d.probesLeft === 1 ? "tentativo rimasto" : "tentativi rimasti"})`, `Contact another team (${d.probesLeft} ${d.probesLeft === 1 ? "attempt left" : "attempts left"})`)}
                </button>` : ""}
              <button type="button" class="btn btn-ghost btn-block" id="btn-probe-back-market">
                ↩️ ${tr("Torna alle offerte di mercato", "Back to market offers")}
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
    let buttonLabel = tr(`📞 Chiedi all'agente di contattare ${selectedTeam ? selectedTeam.name : "il club"}`, `📞 Ask agent to contact ${selectedTeam ? selectedTeam.name : "the club"}`);
    if (player.agent === "none") buttonLabel = tr(`📞 Contatta direttamente ${selectedTeam ? selectedTeam.name : "il club"}`, `📞 Contact ${selectedTeam ? selectedTeam.name : "the club"} directly`);

    if (alreadyOffered) {
      buttonDisabled = true;
      buttonLabel = tr("⚠️ Hai già un'offerta da questa squadra sul tavolo", "⚠️ You already have an offer from this team on the table");
    } else if (alreadyProbed) {
      buttonDisabled = true;
      buttonLabel = tr("❌ Questa squadra ha già rifiutato la richiesta quest'estate", "❌ This team already turned down your outreach this summer");
    } else if (isCurrentTeam) {
      buttonDisabled = true;
      buttonLabel = tr("ℹ️ È la tua squadra attuale: valuta il rinnovo sul mercato", "ℹ️ This is your current team: check the re-sign offer on the market");
    }

    let agentBadge = "";
    if (agent.id === "builder") agentBadge = `<span class="co-chip co-chip--gold">🏗️ ${tr("Specialità Contender (+35%)", "Contender Specialty (+35%)")}</span>`;
    else if (agent.id === "brand") agentBadge = `<span class="co-chip co-chip--gold">📣 ${tr("Specialità Grandi Metropoli (+35%)", "Big Metropolis Specialty (+35%)")}</span>`;
    else if (agent.id === "shark") agentBadge = `<span class="co-chip co-chip--gold">🦈 ${tr("Specialità Squalo (+15% e +20% ingaggio)", "Shark Specialty (+15% & +20% salary)")}</span>`;
    else agentBadge = `<span class="co-chip co-chip--warn">🧑 ${tr("Senza Agente (-20% malus)", "No Agent (-20% penalty)")}</span>`;

    let oddsTone = "green";
    let oddsLabel = tr("Molto Alta", "Very High");
    if (info) {
      if (info.chance >= 75) { oddsTone = "green"; oddsLabel = tr("Molto Alta", "Very High"); }
      else if (info.chance >= 50) { oddsTone = "gold"; oddsLabel = tr("Concreta", "Solid"); }
      else if (info.chance >= 30) { oddsTone = "signal"; oddsLabel = tr("Difficile", "Unlikely"); }
      else { oddsTone = "red"; oddsLabel = tr("Quasi Impossibile", "Long Shot"); }
    }

    const tInfo = selectedTeam ? titleChanceInfo(getTeamStrength(selectedTeam, curLeague), curLeague) : null;

    card.className = "clutch-modal-card event-modal-card ev-tone-live";
    card.innerHTML = `
      <div class="cm-head">
        <span class="cm-tag">🎯 ${tr("Destinazione Desiderata", "Target Destination")}</span>
        <span class="ev-head-right">
          <span class="cm-round">${probes} ${probes === 1 ? tr("tentativo rimasto", "attempt left") : tr("tentativi rimasti", "attempts left")}</span>
          <button type="button" class="cm-close" data-ev-close aria-label="${tr("Chiudi", "Close")}">✕</button>
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
            <label for="probe-sel-league" class="probe-label">${tr("Campionato:", "League:")}</label>
            <select id="probe-sel-league" class="probe-select">
              ${leagues.map(l => `<option value="${l}" ${l === curLeague ? "selected" : ""}>${LEAGUES[l].name} (${LEAGUES[l].country || LEAGUES[l].continent})</option>`).join("")}
            </select>
          </div>
          <div class="probe-field">
            <label for="probe-sel-team" class="probe-label">${tr("Squadra desiderata:", "Target Team:")}</label>
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
                <span class="probe-ovr-lbl">${tr("OVR SQUADRA", "TEAM OVR")}</span>
              </div>
            </div>

            <div class="probe-preview-chips">
              <span class="co-chip co-chip--solid">${tInfo ? `${tInfo.stars} ${tInfo.label}` : ""}</span>
              ${info.isMetro ? `<span class="co-chip co-chip--live">🏙️ ${tr("Grande Metropoli", "Big Metropolis")}</span>` : ""}
              ${info.isHometown ? `<span class="co-chip co-chip--signal">🏠 ${tr("Città Natale (+15%)", "Hometown (+15%)")}</span>` : ""}
              ${info.isContender && agent.id === "builder" ? `<span class="co-chip co-chip--gold">🏗️ ${tr("Bonus Contender (+35%)", "Contender Bonus (+35%)")}</span>` : ""}
              ${info.isMetro && agent.id === "brand" ? `<span class="co-chip co-chip--gold">📣 ${tr("Bonus Metropoli (+35%)", "Metropolis Bonus (+35%)")}</span>` : ""}
              ${agent.id === "shark" ? `<span class="co-chip co-chip--gold">🦈 ${tr("Bonus Squalo (+15%)", "Shark Bonus (+15%)")}</span>` : ""}
              ${agent.id === "none" ? `<span class="co-chip co-chip--warn">🧑 ${tr("Malus Fai-da-te (-20%)", "Self-Rep Penalty (-20%)")}</span>` : ""}
            </div>

            <div class="probe-odds-box">
              <div class="probe-odds-header">
                <span class="probe-odds-title">${tr("Probabilità che accettino il colloquio:", "Chance they accept the meeting:")}</span>
                <span class="probe-odds-percent probe-tone-${oddsTone}">${info.chance}% · ${oddsLabel}</span>
              </div>
              <div class="probe-odds-bar">
                <div class="probe-odds-fill probe-fill-${oddsTone}" style="width: ${info.chance}%;"></div>
              </div>
              <div class="probe-odds-meta small-muted">
                ${tr("Tuo OVR:", "Your OVR:")} <strong>${player.overall}</strong> vs ${tr("Squadra:", "Team:")} <strong>${info.teamOvr}</strong> · ${tr("Reputazione:", "Reputation:")} <strong>${reputationOf(player)}/100</strong>
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
  const game = pc.bestOf === 1 ? tr("Gara secca", "Single-elimination game") : `${tr("Gara", "Game")} ${pc.us + pc.them + 1}${pc.decisive ? tr(" (decisiva)", " (decisive)") : ""}`;
  return `
    <div class="ps-bracket active phase-current" style="border:1px solid var(--signal); background:var(--signal-soft); padding:16px; margin:14px 0; text-align:center;">
      <div style="font-family:var(--font-display); font-size:22px; font-weight:800; color:var(--signal); text-transform:uppercase; margin-bottom:6px;">
        🔥 ${tr("Gara punto a punto in corso!", "Close game in progress!")}
      </div>
      <p class="small-muted" style="margin-bottom:12px;">${bracket.competition} · ${pc.round} · ${game} ${tr("contro", "vs")} ${teamLabel(pc.opponent)}: ${tr("ultimi secondi sul cronometro.", "final seconds on the clock.")}</p>
      <button type="button" class="btn btn-primary" id="btn-open-clutch-modal" style="margin:0 auto;">
        🏀 ${tr("Gioca l'ultimo possesso", "Play the final possession")}
      </button>
    </div>`;
}

function wireClutchPanel(body, bracket) {
  const btn = body.querySelector("#btn-open-clutch-modal");
  const pc = bracket.pendingClutch;
  const openModal = () => {
    const oppScore = 102;
    const myScore = 101;
    const isNational = bracket.kind === "national";
    const myName = isNational ? (player.nationality || tr("Nazionale", "National Team")) : player.team.name;
    const game = pc.bestOf === 1 ? tr("Gara secca", "Single-elimination game") : `${tr("Gara", "Game")} ${pc.us + pc.them + 1}${pc.decisive ? tr(" (decisiva)", " (decisive)") : ""}`;
    const roundLabel = `${bracket.competition} · ${pc.round} · ${game}`;
    const options = CLUTCH_OPTIONS.map(o => ({
      id: o.id,
      icon: o.icon,
      label: o.label,
      desc: o.desc,
      attrText: o.attrLabel ? o.attrLabel(player) : "",
      pct: Math.round(clutchChance(player, pc.winProb, o) * 100),
    }));
    const narrativeOpp = pc.opponent.name;
    const narrative = isNational
      ? tr(
          `Con la Nazionale contro ${narrativeOpp}: rimessa disegnata dal coach con pochissimi secondi alla sirena. Siete <strong>sotto di 1 punto</strong> e la palla è nelle tue mani. Cosa fai?`,
          `With the National Team against ${narrativeOpp}: out-of-bounds play drawn up by the coach with seconds left on the clock. You are <strong>down by 1 point</strong> and the ball is in your hands. What do you do?`
        )
      : tr(
          `Contro ${pc.opponent.name}: rimessa disegnata dal coach con pochissimi secondi alla sirena. Siete <strong>sotto di 1 punto</strong> e la palla è nelle tue mani. Cosa fai?`,
          `Against ${pc.opponent.name}: out-of-bounds play drawn up by the coach with seconds left on the clock. You are <strong>down by 1 point</strong> and the ball is in your hands. What do you do?`
        );
    renderClutchModal({
      roundLabel,
      oppName: pc.opponent.name,
      oppScore,
      myName,
      myScore,
      timer: "00:04.8",
      narrative,
      options,
      onSelectOutcome: (optionId, showOutcome) => {
        const option = CLUTCH_OPTIONS.find(o => o.id === optionId);
        const optLabel = option ? option.label : tr("Azione clutch", "Clutch play");
        const baseChance = Math.round(clutchChance(player, pc.winProb, option) * 100);
        const mainBody = document.querySelector("#cm-main-body");

        const executePlay = (meterRes) => {
          resolveClutch(optionId, (play, done) => {
            showOutcome({
              success: play.success,
              label: `${play.label} ${meterRes && meterRes.timing === "perfect" ? tr("🟢 (Perfetto!)", "🟢 (Perfect!)") : ""}`,
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
    <p style="margin-bottom:4px"><strong>☀️ ${tr("Imprevisto dell'estate", "Summer Event")} — ${ev.category}</strong></p>
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
      <button class="btn btn-primary" id="btn-risk-take">🎲 ${tr("Prendi il rischio", "Take the risk")}</button>
      <button class="btn btn-secondary" id="btn-risk-safe">🛡️ ${tr("Gioca sicuro", "Play it safe")}</button>
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
  const suspenseText = rv.takeRisk ? tr("Il rischio viene corso...", "Rolling the dice...") : tr("Si gioca sul sicuro...", "Playing it safe...");

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
        <button class="btn btn-primary" id="btn-reveal-continue">${tr("Continua", "Continue")}</button>
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
    <p class="small-muted" style="margin-bottom:10px">${tr("La tua Nazionale ha disputato il torneo estivo. Ecco il cammino:", "Your National Team competed in the summer tournament. Here is the run:")}</p>
    ${campaignTrackerHtml(NATIONAL_STAGES, nationalStageIndex(comp))}
    <div class="ps-status ${medalClass}" style="margin-top:12px">${nationalCompOutcomeText(comp)}</div>
    <div class="btn-row" style="margin-top:14px">
      <button class="btn btn-primary" id="btn-national-continue">▶️ ${tr("Continua verso la Regular Season", "Continue to the Regular Season")}</button>
    </div>
  `;
  el("btn-national-continue").addEventListener("click", confirmNationalReveal);
}

function awardsAndNoteText(rec) {
  const parts = [];
  if (rec.draftResult) parts.push(`Draft: ${rec.draftResult}`);
  if (rec.champion) parts.push(tr("🏆 Titolo", "🏆 Champion"));
  if (rec.continental) parts.push(`${rec.continental.competition}: ${rec.continental.result}`);
  if (rec.nationalComp) parts.push(`${rec.nationalComp.kind === "world" ? "🌎" : "🌍"} ${rec.nationalComp.name}: ${nationalCompOutcomeText(rec.nationalComp)}`);
  if (rec.injury) parts.push(rec.injury.text);
  if (rec.tradedFrom) parts.push(tr(`Ceduto a stagione in corso da ${rec.tradedFrom}`, `Traded midseason from ${rec.tradedFrom}`));
  if (rec.allStarContest) parts.push(`${rec.allStarContest.label}: ${rec.allStarContest.won ? tr("vinta", "won") : tr("partecipazione", "participant")}`);
  if (rec.seasonFocus && rec.seasonFocus.archetypeChanged) parts.push(`🔄 ${tr("Evoluzione:", "Evolution:")} ${rec.seasonFocus.newArchetypeName}`);
  if (rec.awards && rec.awards.length) parts.push(rec.awards.join(", "));
  if (rec.event) parts.push(rec.event.text);
  if (rec.offseason) {
    const icon = rec.offseason.tone === "positive" ? "🌟" : rec.offseason.tone === "negative" ? "⚠️" : "🌤️";
    parts.push(`${icon} ${tr("Estate:", "Summer:")} ${rec.offseason.title}`);
  }
  return parts.join(" · ") || "-";
}

/* La carriera come timeline: un anno per scheda, con i badge principali; i dettagli si aprono al click */
function careerYearBadges(rec) {
  const badges = [];
  if (rec.champion) badges.push(`<span class="yb gold">${tr("🏆 Titolo", "🏆 Champion")}</span>`);
  if (rec.continental && rec.continental.champion) badges.push(`<span class="yb gold">🏆 ${rec.continental.competition}</span>`);
  if (rec.nationalComp && rec.nationalComp.medal) badges.push(`<span class="yb gold">🥇 ${rec.nationalComp.name}</span>`);
  if (rec.awards && rec.awards.length) badges.push(`<span class="yb">🏅 ${rec.awards.length} ${rec.awards.length === 1 ? tr("premio", "award") : tr("premi", "awards")}</span>`);
  if (rec.draftResult) badges.push(`<span class="yb blue">🎓 Draft</span>`);
  if (rec.injury) badges.push(`<span class="yb red">${tr("🩹 Infortuni", "🩹 Injury")}</span>`);
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
            <span class="yc-team">${teamLabel(rec.team)} <span class="small-muted">${LEAGUES[rec.league].name} · ${rec.age} ${tr("anni", "yo")}</span></span>
            <span class="yc-line">${rec.pts} PTS · ${rec.reb} REB · ${rec.ast} AST · ${rec.wins}-${rec.losses}</span>
            <span class="yc-badges">${careerYearBadges(rec)}</span>
          </span>
        </summary>
        ${details.length ? `<ul class="yc-details">${details.map(x => `<li>${x}</li>`).join("")}</ul>` : `<p class="small-muted yc-details">${tr("Una stagione tranquilla.", "A quiet season.")}</p>`}
      </details>`;
  });
  list.innerHTML = items.join("") || `<p class="small-muted">${tr("La tua carriera apparirà qui, stagione dopo stagione.", "Your career timeline will appear here, season after season.")}</p>`;
}

function renderHistoryTable(tbodyId) {
  const tbody = el(tbodyId);
  const cell = (label, value, cls) => `<td data-label="${label}"${cls ? ` class="${cls}"` : ""}>${value}</td>`;
  tbody.innerHTML = player.history.map(rec => `
    <tr>
      ${cell(tr("Età", "Age"), rec.age)}
      ${cell(tr("Anno", "Year"), rec.year)}
      ${cell(tr("Squadra", "Team"), `${teamLabel(rec.team)}<div class="small-muted">${rec.team.city}</div>`)}
      ${cell(tr("Lega", "League"), LEAGUES[rec.league].name)}
      ${cell("GP", rec.gp != null ? `${rec.gp}/${rec.games}` : "-")}
      ${cell("PTS", rec.pts)}
      ${cell("REB", rec.reb)}
      ${cell("AST", rec.ast)}
      ${cell("TOV", rec.tov ?? "-")}
      ${cell("FG%", `${rec.fg ?? "-"}%`)}
      ${cell("3P%", `${rec.tp ?? "-"}%`)}
      ${cell("OVR", rec.overall)}
      ${cell(tr("Note", "Notes"), awardsAndNoteText(rec), rec.champion || (rec.awards && rec.awards.length) ? "trophy-cell" : "")}
    </tr>
  `).join("");
}
