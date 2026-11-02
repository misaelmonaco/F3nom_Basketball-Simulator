"use strict";

/* ================================================================
   SUPERSTAR FORCE TRADE — con un overall di 85+, il giocatore
   può forzare la mano alla dirigenza tramite il proprio agente
   e chiedere il trasferimento immediato in una contender o squadra specifica.
   ================================================================ */

function canForceTrade(p) {
  if (!p || p.retired || p.league === "NCAA") return false;
  if (p.scenario && p.scenario.id === "oneClubMan" && p.scenario.status === "active") return false;
  if (p.farewellTour === p.year) return false;
  return p.overall >= 85;
}

/* Squadre pretendenti (contender) nel campionato del giocatore */
function getContenderTeams(leagueId, excludeTeamName) {
  if (!LEAGUES[leagueId]) return [];
  const teams = LEAGUES[leagueId].teams.filter(t => !excludeTeamName || t.name !== excludeTeamName);
  return teams
    .map(t => ({ team: t, leagueId, strength: getTeamStrength(t, leagueId) }))
    .sort((a, b) => b.strength - a.strength);
}

/* Calcolo probabilità che l'agente riesca a forzare l'accordo con la squadra desiderata */
function forceTradeChance(p, targetTeam, targetLeague) {
  const base = 70 + (p.overall - 85) * 4;
  const agent = (typeof getAgent === "function") ? getAgent(p) : { id: "none" };
  const str = getTeamStrength(targetTeam, targetLeague);
  const isContender = str >= 0.55;
  const isMetro = (typeof isBigMetropolis === "function") ? isBigMetropolis(targetTeam) : false;

  let agentBonus = 0;
  if (agent.id === "shark") agentBonus += 15; // Lo squalo usa pressioni mediatiche
  if (agent.id === "builder" && isContender) agentBonus += 14;
  if (agent.id === "brand" && isMetro) agentBonus += 12;
  if (agent.id === "none") agentBonus -= 20;

  const rep = (typeof reputationOf === "function") ? reputationOf(p) : (p.reputation || 50);
  const repBonus = Math.round((rep - 50) * 0.25);

  return clamp(base + agentBonus + repBonus, 45, 96);
}

/* Esecuzione dello scambio forzato con ripercussioni realistiche su morale, reputazione e spogliatoio */
function executeForcedTrade(targetTeam, targetLeague, onDone) {
  const p = player, s = p.pendingSeason;
  const oldTeam = p.team;
  p.team = targetTeam;
  p.league = targetLeague;

  if (s) {
    s.team = targetTeam;
    s.seasonLeague = targetLeague;
    s.teamStrength = getTeamStrength(targetTeam, targetLeague);
    s.tradedFrom = oldTeam;
    const staff = (typeof getTeamStaff === "function") ? getTeamStaff(targetTeam, targetLeague) : null;
    const shift = (typeof staffMinutesShift === "function" && staff) ? staffMinutesShift(p, staff) : 0;
    const mi = (typeof seasonTeamRole === "function") ? seasonTeamRole(p, targetLeague, s.teamStrength, { staffShift: shift }) : { teamRole: "star", mpg: 34 };
    s.minutesInfo = mi;
    p.currentTeamRole = "star";
  }

  if (p.contract) {
    p.contract.team = targetTeam.name;
  }

  // Perdita fascia di capitano della vecchia squadra
  if (typeof isCaptain === "function" && isCaptain(p)) {
    p.captain = null;
  }

  // Nuova squadra: accoglienza da superstar
  p.chemistry = 62;
  p.coachTrust = 68;
  if (p.starRapport != null) p.starRapport = 65;

  // Effetti superstar leverage: vai dove volevi (+morale, +popolarità, -reputazione puristi)
  p.morale = clamp(p.morale + 8, 0, 100);
  p.popularity = clamp(p.popularity + 6, 0, 100);
  if (typeof changeReputation === "function") changeReputation(p, -4);

  const headline = tr(
    `🚨 SCAMBIO FORZATO: ${p.firstName} ${p.lastName} ottiene la cessione a ${targetTeam.name}!`,
    `🚨 TRADE DEMAND GRANTED: ${p.firstName} ${p.lastName} forces trade to ${targetTeam.name}!`
  );
  toast(headline);
  if (typeof pushNews === "function") pushNews(headline);

  if (typeof pushSocialPost === "function") {
    pushSocialPost({
      author: tr("Insider Mercato", "Hoops Insider"),
      handle: "@WojInsider",
      badge: "verified",
      text: tr(
        `🚨 UFFICIALE: La superstar ${p.firstName} ${p.lastName} (OVR ${p.overall}) ha forzato la mano: accordo chiuso, vola a ${targetTeam.name}! A ${oldTeam.name} bruciano le maglie fuori dal palasport 🔥🏀`,
        `🚨 OFFICIAL: Superstar ${p.firstName} ${p.lastName} (OVR ${p.overall}) forced his way out: trade finalized to ${targetTeam.name}! Fans in ${oldTeam.name} burning jerseys outside the arena 🔥🏀`
      ),
      comments: [
        { author: "Hardwood Critic", handle: "@HardwoodCritic", text: tr("Mossa senza scrupoli ma devastante. Ora sono i favoriti assoluti.", "Ruthless move but devastating. They are now instant title favorites.") },
        { author: "Curva Parquet", handle: "@CurvaParquet", text: tr("La lealtà nel basket di oggi non esiste più... che delusione.", "Loyalty in today's game is dead... heartbreaking for the home fans.") },
      ]
    });
  }

  if (onDone) onDone();
}

function forceTradeButtonHtml() {
  if (!canForceTrade(player)) return "";
  return `
    <div class="force-trade-box">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
        <div>
          <div style="font-weight:800;color:var(--gold-text);font-size:1.02rem">⭐ ${tr("Superstar Leverage (OVR", "Superstar Leverage (OVR")} ${player.overall})</div>
          <p class="small-muted" style="margin:3px 0 0 0">${tr("Istruisci l'agente a forzare la cessione immediata in una contender o squadra a tua scelta.", "Direct your agent to force an immediate blockbuster trade to a contender or team of your choice.")}</p>
        </div>
        <button type="button" class="btn btn-gold" id="btn-force-trade">⭐ ${tr("Forza la Trade", "Force Trade")}</button>
      </div>
    </div>`;
}

/* Modale interattiva per selezionare la destinazione dello scambio forzato */
function openForceTradeModal(onComplete) {
  const overlay = el("event-modal-overlay");
  const card = el("event-modal-card");
  if (!overlay || !card) return;

  const p = player;
  const curLeague = p.league;
  const contenders = getContenderTeams(curLeague, p.team.name);
  let selectedTeam = contenders[0] ? contenders[0].team : LEAGUES[curLeague].teams.find(t => t.name !== p.team.name);
  let selectedLeague = curLeague;

  const renderContent = (view = "select", result = null) => {
    if (view === "outcome") {
      card.innerHTML = `
        <div class="cm-head">
          <span class="cm-tag">${tr("Esito Trattativa Forzata", "Trade Demand Outcome")}</span>
          <span class="ev-head-right">
            <button type="button" class="cm-close" data-ev-close aria-label="${tr("Chiudi", "Close")}">✕</button>
          </span>
        </div>
        <div class="cm-body" style="text-align:center;padding:24px 16px">
          <div style="font-size:3rem;margin-bottom:8px">${result.success ? "🤝🔥" : "🔒❌"}</div>
          <h3 class="ev-title">${result.success ? tr("SCAMBIO COMPLETATO!", "TRADE FINALIZED!") : tr("TRATTATIVA BLOCCATA", "FRONT OFFICE RESISTANCE")}</h3>
          <p class="cm-narrative" style="text-align:center;max-width:440px;margin:0 auto 16px auto">${result.text}</p>
          <button type="button" class="btn btn-primary btn-lg" id="btn-force-trade-done">${tr("Continua ➔", "Continue ➔")}</button>
        </div>`;
      card.querySelector("[data-ev-close]").addEventListener("click", () => {
        overlay.classList.add("hidden");
        if (result.success && onComplete) onComplete();
        else renderGameScreen();
      });
      card.querySelector("#btn-force-trade-done").addEventListener("click", () => {
        overlay.classList.add("hidden");
        if (result.success && onComplete) onComplete();
        else renderGameScreen();
      });
      return;
    }

    const chance = forceTradeChance(p, selectedTeam, selectedLeague);
    const agent = (typeof getAgent === "function") ? getAgent(p) : { name: "Agente", icon: "💼" };
    const str = getTeamStrength(selectedTeam, selectedLeague);
    const teamOvr = Math.round(55 + str * 38);

    card.innerHTML = `
      <div class="cm-head">
        <span class="cm-tag" style="color:var(--gold-text)">⭐ ${tr("Superstar Leverage · Richiesta di Cessione", "Superstar Leverage · Trade Demand")}</span>
        <span class="ev-head-right">
          <span class="cm-round">${agent.icon} ${agent.name}</span>
          <button type="button" class="cm-close" data-ev-close aria-label="${tr("Chiudi", "Close")}">✕</button>
        </span>
      </div>
      <div class="cm-body">
        <h3 class="ev-title" style="margin-bottom:6px">🔥 ${tr("Forza la trade in una Contender", "Force a Trade to a Contender")}</h3>
        <p class="cm-narrative" style="margin-bottom:12px">
          ${tr(
            `Con <strong>${p.overall} di Overall</strong> hai il coltello dalla parte del manico. Il tuo agente comunica alla dirigenza di ${p.team.name} che non intendi più restare e individua la franchigia ideale per vincere subito.`,
            `With an <strong>${p.overall} Overall</strong> you have total superstar leverage. Your agent informs ${p.team.name} that your time is up and lines up a blockbuster deal with your chosen contender.`
          )}
        </p>

        <div style="background:var(--surface-2);border:1px solid var(--line);border-radius:var(--radius-sm);padding:12px 14px;margin-bottom:14px">
          <label style="font-weight:700;font-size:0.85rem;color:var(--ink-2);text-transform:uppercase">${tr("Seleziona la franchigia di destinazione:", "Select Target Destination:")}</label>
          <div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap">
            <select id="sel-force-league" class="input" style="flex:1;min-width:130px">
              ${Object.keys(LEAGUES).filter(l => l !== "NCAA" && !LEAGUES[l].minorIta).map(l => `
                <option value="${l}" ${l === selectedLeague ? "selected" : ""}>${LEAGUES[l].name}</option>
              `).join("")}
            </select>
            <select id="sel-force-team" class="input" style="flex:2;min-width:180px">
              ${LEAGUES[selectedLeague].teams.filter(t => t.name !== p.team.name).map(t => {
                const sVal = getTeamStrength(t, selectedLeague);
                const tag = sVal >= 0.58 ? "🏆 Contender" : "";
                return `<option value="${t.name}" ${t.name === selectedTeam.name ? "selected" : ""}>${t.name} (${t.city}) ${tag}</option>`;
              }).join("")}
            </select>
          </div>
        </div>

        <div class="probe-preview-card" style="margin-bottom:14px">
          <div class="probe-preview-head">
            <div class="probe-preview-team">
              <span class="probe-preview-badge" style="background:${selectedTeam.colors ? selectedTeam.colors[0] : 'var(--accent)'}">${(selectedTeam.name[0] || "?").toUpperCase()}</span>
              <div>
                <h4 class="probe-preview-name">${selectedTeam.name}</h4>
                <span class="probe-preview-sub">${selectedTeam.city} · ${LEAGUES[selectedLeague].name}</span>
              </div>
            </div>
            <div class="probe-preview-ovr">
              <span class="probe-ovr-num">${teamOvr}</span>
              <span class="probe-ovr-lbl">${tr("OVR SQUADRA", "TEAM OVR")}</span>
            </div>
          </div>
          <div class="probe-odds-box" style="margin-top:10px">
            <div class="probe-odds-header">
              <span class="probe-odds-title">${tr("Gradimento e fattibilità scambio:", "Trade agreement likelihood:")}</span>
              <span class="probe-odds-percent probe-tone-gold">${chance}% · ${tr("ALTISSIMA", "VERY HIGH")}</span>
            </div>
            <div class="probe-odds-bar">
              <div class="probe-odds-fill probe-fill-gold" style="width:${chance}%"></div>
            </div>
            <div class="probe-odds-meta small-muted" style="margin-top:6px">
              ${tr("Status all'arrivo: <strong>Stella Indiscussa</strong> · Più popolarità (+6) · Critiche puristi (-4 rep)", "Status upon arrival: <strong>Undisputed Superstar</strong> · Popularity (+6) · Purist backlash (-4 rep)")}
            </div>
          </div>
        </div>

        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button type="button" class="btn btn-ghost" data-ev-close>${tr("Ripensaci", "Never mind")}</button>
          <button type="button" class="btn btn-gold btn-lg" id="btn-force-submit">
            🔥 ${tr("Forza la Trade a", "Force Trade to")} ${selectedTeam.name}
          </button>
        </div>
      </div>`;

    card.querySelectorAll("[data-ev-close]").forEach(b => b.addEventListener("click", () => {
      overlay.classList.add("hidden");
    }));

    const leagueSel = card.querySelector("#sel-force-league");
    if (leagueSel) {
      leagueSel.addEventListener("change", e => {
        selectedLeague = e.target.value;
        const availTeams = LEAGUES[selectedLeague].teams.filter(t => t.name !== p.team.name);
        selectedTeam = availTeams[0] || LEAGUES[selectedLeague].teams[0];
        renderContent("select");
      });
    }

    const teamSel = card.querySelector("#sel-force-team");
    if (teamSel) {
      teamSel.addEventListener("change", e => {
        const found = LEAGUES[selectedLeague].teams.find(t => t.name === e.target.value);
        if (found) selectedTeam = found;
        renderContent("select");
      });
    }

    const submitBtn = card.querySelector("#btn-force-submit");
    if (submitBtn) {
      submitBtn.addEventListener("click", () => {
        const success = rollChance(chance);
        if (success) {
          executeForcedTrade(selectedTeam, selectedLeague, () => {
            renderContent("outcome", {
              success: true,
              text: tr(
                `L'agente ha fatto leva sul tuo status da superstar: accordo chiuso con ${selectedTeam.name}! I tifosi di ${p.team.name} non te la perdoneranno mai, ma sei sbarcato nella tua nuova franchigia con tutti i favori del pronostico.`,
                `Your agent leveraged your superstar status to force the blockbuster deal to ${selectedTeam.name}! Former fans will never forgive you, but you land with an instant championship contender.`
              )
            });
          });
        } else {
          p.chemistry = clamp(p.chemistry - 6, 0, 100);
          renderContent("outcome", {
            success: false,
            text: tr(
              `La dirigenza di ${p.team.name} ha alzato le barricate rifiutando le contropartite di ${selectedTeam.name}. Sei costretto a restare per ora, ma lo spogliatoio è una polveriera (-6 chimica).`,
              `Front office pushed back and rejected ${selectedTeam.name}'s package. You're held to your deal for now, but the locker room is a powder keg (-6 chemistry).`
            )
          });
        }
      });
    }
  };

  renderContent("select");
  overlay.classList.remove("hidden");
}

