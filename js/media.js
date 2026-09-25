"use strict";

/* ================================================================
   MEDIA E INTERVISTE — dopo le partite chiave e a fine stagione una domanda dei
   giornalisti; il tono della risposta muove popolarità, reputazione, chimica e morale.
   ================================================================ */
const INTERVIEW_TONES = [
  { id: "humble", icon: "🤝", label: "Umile", effects: { chemistry: 4, reputation: 1, popularity: 1 }, note: "Il gruppo apprezza." },
  { id: "confident", icon: "😎", label: "Sicuro di sé", effects: { popularity: 4, morale: 3, coachTrust: 2 }, note: "I tifosi adorano la tua sicurezza." },
  { id: "polemic", icon: "🔥", label: "Polemico", effects: { popularity: 7, chemistry: -6, reputation: -2, coachTrust: -4 }, note: "Fai notizia, ma nello spogliatoio c'è chi storce il naso." },
];
/* Domande per contesto: la risposta è la stessa idea detta con tre toni diversi */
const INTERVIEW_CONTEXTS = {
  champion: { q: "Siete campioni! A chi dedichi questo titolo?",
    a: { humble: "A tutta la squadra: senza i miei compagni non sarei niente.", confident: "Lo avevo detto a inizio anno: questa squadra era destinata a vincere.", polemic: "A chi non credeva in noi. E sono tanti." } },
  mvp: { q: "Sei l'MVP della lega: che effetto fa?",
    a: { humble: "Un premio individuale che appartiene a tutto lo spogliatoio.", confident: "Me lo sono meritato ogni singola sera.", polemic: "Era ora: l'anno scorso me l'hanno rubato." } },
  finalLost: { q: "Una finale persa: cosa è mancato?",
    a: { humble: "Loro sono stati più bravi. Torneremo più forti.", confident: "Ci siamo arrivati una volta, ci arriveremo di nuovo e la vinceremo.", polemic: "Diciamo che certe decisioni arbitrali hanno pesato." } },
  missedPlayoffs: { q: "Niente playoff quest'anno: di chi è la colpa?",
    a: { humble: "Anche mia: devo fare di più per questa squadra.", confident: "Ho dato tutto. Il prossimo anno sarà diverso.", polemic: "Io ho fatto la mia parte. Chiedete agli altri." } },
  injury: { q: "Una stagione condizionata dagli infortuni: come stai?",
    a: { humble: "Ringrazio lo staff medico, lavoro ogni giorno per tornare.", confident: "Tornerò più forte di prima, è una promessa.", polemic: "Mi hanno fatto giocare quando non dovevo." } },
  contractYear: { q: "Ultimo anno di contratto: resterai?",
    a: { humble: "Qui sto bene, vedremo con calma con la società.", confident: "Ascolterò tutte le offerte: me lo sono guadagnato.", polemic: "Dipende da quanto la società mi vuole davvero." } },
  bigSeason: { q: "Numeri da stella quest'anno: sei al livello dei migliori?",
    a: { humble: "Devo ancora migliorare tanto.", confident: "Sì. E non ho ancora finito.", polemic: "Lo ero già, qualcuno se n'è accorto solo ora." } },
  default: { q: "Come giudichi la tua stagione?",
    a: { humble: "Una stagione di crescita, grazie ai compagni e al coach.", confident: "Buona, ma punto molto più in alto.", polemic: "Poteva andare meglio, e non per colpa mia." } },
  clutchWin: { q: "L'ultimo tiro della serie era tuo: cosa ti è passato per la testa?",
    a: { humble: "I compagni mi hanno messo nelle condizioni giuste.", confident: "Volevo quel pallone. Lo voglio sempre.", polemic: "Chi dubitava di me adesso ha la risposta." } },
  farewell: { q: "Era la tua ultima partita: cosa ti porti via da questa carriera?",
    a: { humble: "I compagni, i tifosi e ogni allenatore che mi ha insegnato qualcosa. Grazie.", confident: "La certezza di aver lasciato il segno. Chi viene dopo dovrà fare i conti con me.", polemic: "Qualche conto in sospeso con chi non ha mai creduto in me. Ma stasera no." } },
  clutchLoss: { q: "La serie si è decisa sull'ultimo possesso, finito male: come la vivi?",
    a: { humble: "Mi prendo la responsabilità, lavorerò per quei momenti.", confident: "Rifarei la stessa scelta mille volte.", polemic: "Su quel possesso c'era un fallo evidente." } },
};

function seasonInterviewContext(rec, p) {
  if (rec.champion) return "champion";
  if ((rec.awards || []).some(a => a.startsWith("MVP"))) return "mvp";
  if (rec.playoffResult === "Finale persa") return "finalLost";
  if (rec.injury && rec.gp != null && rec.games && rec.gp / rec.games < 0.7) return "injury";
  if (!rec.playoffRounds && rec.league !== "NCAA") return "missedPlayoffs";
  if (p.contract && p.contract.yearsRemaining === 1 && p.contract.salaryPerYear != null) return "contractYear";
  if (rec.pts >= 20) return "bigSeason";
  return "default";
}

/* Applica gli effetti del tono scelto; restituisce il testo del risultato */
function applyInterviewTone(toneId) {
  const tone = INTERVIEW_TONES.find(t => t.id === toneId);
  if (!tone) return null;
  const e = tone.effects;
  if (toneId === "polemic") player.polemicCount = (player.polemicCount || 0) + 1; // pesa sugli sponsor
  if (e.chemistry) player.chemistry = clamp(player.chemistry + e.chemistry, 0, 100);
  if (e.popularity) player.popularity = clamp(player.popularity + e.popularity, 0, 100);
  if (e.morale) player.morale = clamp(player.morale + e.morale, 0, 100);
  if (e.reputation) changeReputation(player, e.reputation);
  if (e.coachTrust && typeof changeCoachTrust === "function") changeCoachTrust(player, e.coachTrust);
  const parts = [];
  if (e.popularity) parts.push(`popolarità ${e.popularity > 0 ? "+" : ""}${e.popularity}`);
  if (e.chemistry) parts.push(`chimica ${e.chemistry > 0 ? "+" : ""}${e.chemistry}`);
  if (e.morale) parts.push(`morale ${e.morale > 0 ? "+" : ""}${e.morale}`);
  if (e.reputation) parts.push(`reputazione ${e.reputation > 0 ? "+" : ""}${e.reputation}`);
  if (e.coachTrust) parts.push(`fiducia del coach ${e.coachTrust > 0 ? "+" : ""}${e.coachTrust}`);
  return `${tone.note} (${parts.join(", ")})`;
}

function interviewHtml(iv, dataAttr) {
  const ctx = INTERVIEW_CONTEXTS[iv.context] || INTERVIEW_CONTEXTS.default;
  if (iv.answered) {
    const tone = INTERVIEW_TONES.find(t => t.id === iv.answered);
    return `
      <div class="interview-box done">
        <div class="iv-q">🎤 “${ctx.q}”</div>
        <div class="iv-a">${tone ? `${tone.icon} “${ctx.a[tone.id]}”` : "🤐 Nessun commento."}</div>
        ${iv.result ? `<div class="iv-result">${iv.result}</div>` : ""}
      </div>`;
  }
  return `
    <div class="interview-box">
      <div class="iv-q">🎤 “${ctx.q}”</div>
      <div class="sb-options">
        ${INTERVIEW_TONES.map(t => `
          <button type="button" class="option-card sb-choice" ${dataAttr}="${t.id}">
            <div class="oc-title">${t.icon} ${t.label}</div>
            <div class="oc-desc">“${ctx.a[t.id]}”</div>
          </button>`).join("")}
      </div>
      <button type="button" class="btn btn-ghost btn-sm iv-skip" ${dataAttr}="none">🤐 Nessun commento</button>
    </div>`;
}

/* ================================================================
   RESOCONTO DI FINE STAGIONE — una schermata sola con tutto quello che è successo,
   al posto della catena di popup. Da qui si prosegue verso draft, mercato o pre-stagione.
   ================================================================ */
function answerRecapInterview(toneId) {
  const d = player.pendingDecision;
  if (!d || d.type !== "seasonRecap" || !d.interview || d.interview.answered) return;
  d.interview.answered = toneId;
  d.interview.result = toneId === "none" ? null : applyInterviewTone(toneId);
  renderGameScreen();
}
function closeSeasonRecap() {
  const d = player.pendingDecision;
  if (!d || d.type !== "seasonRecap") return;
  if (d.retireAfter) {
    // fine del tour d'addio: la lega saluta chi si è ritirato da protagonista
    changeReputation(player, 3);
    retirePlayer();
    return;
  }
  player.pendingDecision = d.next;
  renderGameScreen();
}

function recapTile(value, label, tone) {
  return `<div class="sg-item ${tone || ""}"><div class="sg-val">${value}</div><div class="sg-lbl">${label}</div></div>`;
}

let lastRecapSound = null; // il suono del resoconto parte una volta sola per stagione
function renderSeasonRecap(extra, d) {
  const rec = player.history[player.history.length - 1];
  if (lastRecapSound !== rec.year) { lastRecapSound = rec.year; playSound(rec.champion ? "title" : "recap"); }
  const cur = playerCurrency(player);
  const phases = [];
  phases.push(`🏀 ${LEAGUES[rec.league].name}: ${rec.wins}-${rec.losses}${rec.rank ? `, ${rec.rank}° su ${rec.totalTeams}` : ""} · ${rec.playoffResult || (rec.playoffRounds ? "playoff" : "niente playoff")}`);
  if (rec.continental) phases.push(`🏟️ ${rec.continental.competition}: ${rec.continental.result || "eliminati ai gironi"}`);
  if (rec.nationalComp) phases.push(`🌍 ${rec.nationalComp.name}: ${nationalCompOutcomeText(rec.nationalComp)}`);
  const offs = rec.offseason ? `${rec.offseason.tone === "positive" ? "🌟" : rec.offseason.tone === "negative" ? "⚠️" : "🌤️"} ${rec.offseason.title}` : null;

  extra.innerHTML = `
    <div class="recap-stage">
      <div class="recap-ovr ${rec.champion ? "champ" : ""}">
        <div class="recap-ovr__stripes" aria-hidden="true"></div>
        <span class="recap-ovr__k">${rec.champion ? "Campioni · overall a fine stagione" : "Overall a fine stagione"}</span>
        <span class="recap-ovr__num co-num">${rec.overall}</span>
        <span class="recap-ovr__d">${rec.ovrDelta > 0 ? "▲ +" : rec.ovrDelta < 0 ? "▼ −" : "= "}${Math.abs(rec.ovrDelta || 0)}</span>
      </div>
      <section class="card recap-box">
        <div class="recap-box__head">
          <span class="recap-team"><span class="co-dot" style="--team:${rec.team.colors ? rec.team.colors[0] : "var(--signal)"}"></span><span class="recap-team__name">${rec.team.name}</span></span>
          <span class="co-row"><span class="co-chip">${LEAGUES[rec.league].name}</span>${rec.teamRole ? `<span class="co-chip">${getTeamRole(rec.teamRole).label}</span>` : rec.roleLabel ? `<span class="co-chip">${rec.roleLabel}</span>` : ""}${rec.gp != null ? `<span class="co-chip">${rec.gp}/${rec.games} partite</span>` : ""}<span class="co-chip">${rec.age} anni</span></span>
        </div>
        <div class="summary-grid recap-tiles">
          ${recapTile(rec.pts, "Punti a partita")}${recapTile(rec.reb, "Rimbalzi")}${recapTile(rec.ast, "Assist")}
          ${recapTile(`${rec.fg}%`, "Dal campo")}
          ${recapTile(`${rec.ovrDelta > 0 ? "+" : rec.ovrDelta < 0 ? "−" : ""}${Math.abs(rec.ovrDelta || 0)}`, `Overall → ${rec.overall}`, rec.ovrDelta > 0 ? "up" : rec.ovrDelta < 0 ? "down" : "")}
          ${recapTile(`+${rec.goatPoints || 0}`, "Punti GOAT", "gold")}
        </div>
      </section>
    </div>
    <div class="recap-section"><div class="recap-h">Il cammino</div>${phases.map(x => `<div class="recap-row">${x}</div>`).join("")}</div>
    ${rec.goals && rec.goals.length ? `<div class="recap-section"><div class="recap-h">Obiettivi della società</div>${seasonGoalsListHtml(rec.goals, rec.goals)}</div>` : ""}
    ${rec.careerGoalDone ? `<div class="recap-section"><div class="recap-h">Il tuo sogno</div><div class="recap-row">🌠 ${getCareerGoal(rec.careerGoalDone).icon} ${getCareerGoal(rec.careerGoalDone).label}: realizzato! (+${CAREER_GOAL_REWARD.goat} punti GOAT)</div></div>` : ""}
    ${rec.newAchievements && rec.newAchievements.length ? `<div class="recap-section"><div class="recap-h">Traguardi sbloccati</div><div class="recap-badges">${rec.newAchievements.map(id => getAchievement(id)).filter(Boolean).map(a => `<span class="badge blue">${a.icon} ${a.title}</span>`).join("")}</div></div>` : ""}
    ${rec.awards && rec.awards.length ? `<div class="recap-section"><div class="recap-h">Premi</div><div class="recap-badges">${rec.awards.map(a => `<span class="badge gold">🏅 ${a}</span>`).join("")}</div></div>` : ""}
    <div class="recap-section"><div class="recap-h">Fuori dal campo</div>
      <div class="recap-row">💰 Guadagni: +${fmtMoney(rec.seasonEarnings || 0, cur)}${rec.contractBonus ? ` (di cui bonus ${fmtMoney(rec.contractBonus, cur)})` : ""}${rec.investmentIncome ? ` · rendite +${fmtMoney(rec.investmentIncome, cur)}` : ""} · patrimonio ${fmtMoney(player.wealth, cur)}</div>
      ${(rec.investmentNotes || []).map(n => `<div class="recap-row">${n}</div>`).join("")}
      ${rec.reputation != null ? `<div class="recap-row">⭐ Reputazione ${rec.reputation} · ${reputationLabel(rec.reputation)}${rec.reputationNotes && rec.reputationNotes.length ? ` <span class="small-muted">(${rec.reputationNotes.join(", ")})</span>` : ""}</div>` : ""}
      ${rec.coachTrust != null ? `<div class="recap-row">🧑‍🏫 Fiducia del coach: ${rec.coachTrust}</div>` : ""}
      ${(rec.staffNotes || []).map(n => `<div class="recap-row">${n}</div>`).join("")}
      ${rec.injury ? `<div class="recap-row">${rec.injury.text}</div>` : ""}
      ${rec.seriousInjury ? `<div class="recap-row">🏥 ${rec.seriousInjury.label}: ${rec.seriousInjury.choice === "surgery" ? "operazione" : rec.seriousInjury.relapse ? "terapia conservativa e ricaduta" : "terapia conservativa, rientro riuscito"}</div>` : ""}
      ${(rec.keyGames || []).map(k => `<div class="recap-row">${KEY_GAME_KINDS[k.kind].icon} ${k.label} contro ${k.opponent}: ${k.success ? "vinta all'ultimo possesso" : "persa all'ultimo possesso"}</div>`).join("")}
      ${(rec.leadershipNotes || []).map(n => `<div class="recap-row">${n}</div>`).join("")}
      ${rec.lifestyleUpkeep ? `<div class="recap-row">👨‍🍳 Chef privato: −${fmtMoney(rec.lifestyleUpkeep, cur)}, fragilità −3</div>` : ""}
      ${(rec.sponsorResults || []).map(r => `<div class="recap-row">${r.met ? "🤝" : "💔"} ${r.text}</div>`).join("")}
      ${rec.roleBattle ? `<div class="recap-row">⚔️ Sfida per il posto con ${rec.roleBattle.rival.name}: ${rec.roleBattle.won ? (rec.roleBattle.regainedIn ? `posto ripreso in ${rec.roleBattle.regainedIn}` : "vinta al training camp") : "persa, stagione da rincalzo"}</div>` : ""}
      ${rec.adaptation ? `<div class="recap-row">🧳 Ambientamento in ${rec.adaptation.country}: ${rec.adaptation.level}/100</div>` : ""}
      ${offs ? `<div class="recap-row">☀️ Estate: ${offs}</div>` : ""}
    </div>
    ${d.interview ? `<div class="recap-section"><div class="recap-h">Conferenza stampa</div>${interviewHtml(d.interview, "data-recap-tone")}</div>` : ""}
    <div class="btn-row" style="justify-content:center">
      <button class="btn btn-primary btn-lg" id="btn-recap-continue">${d.retireAfter ? "Chiudi la carriera" : "Continua verso l'estate"}${d.interview && !d.interview.answered ? " senza rispondere" : ""}</button>
    </div>`;
  extra.querySelectorAll("[data-recap-tone]").forEach(b => b.addEventListener("click", () => answerRecapInterview(b.dataset.recapTone)));
  el("btn-recap-continue").addEventListener("click", closeSeasonRecap);
}
