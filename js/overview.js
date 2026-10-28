"use strict";

/* ================================================================
   PANORAMICA — la prima scheda della dashboard: come stai andando adesso,
   in un colpo d'occhio. Solo consultazione: le decisioni restano nella
   schermata "momento".
   ================================================================ */

/* Fotografia del giocatore all'inizio di ogni stagione: le frecce della Panoramica
   mostrano quanto è cambiato da allora (stagione ed estate comprese). */
function takeYearSnapshot(p) {
  p.yearSnapshot = {
    overall: p.overall, potential: p.potential, attrs: { ...p.attrs },
    morale: p.morale, chemistry: p.chemistry, popularity: p.popularity,
    stamina: p.stamina, fragility: p.fragility, reputation: reputationOf(p),
  };
}

/* Variazione rispetto alla fotografia: verde se migliora, rosso se peggiora
   (per la fragilità vale il contrario) */
function deltaChip(now, key, invert) {
  const snap = player.yearSnapshot;
  if (!snap) return "";
  const before = key.startsWith("attrs.") ? snap.attrs[key.slice(6)] : snap[key];
  if (before == null) return "";
  const d = Math.round(now - before);
  if (!d) return `<span class="delta none" aria-hidden="true"></span>`; // tiene allineate le righe
  const good = invert ? d < 0 : d > 0;
  return `<span class="delta ${good ? "up" : "down"}" title="${tr("Rispetto all'inizio della stagione", "Compared to the start of the season")}">${d > 0 ? "+" : "−"}${Math.abs(d)}</span>`;
}

/* Avvisi: solo quello che richiede attenzione adesso */
function overviewAlerts(p) {
  const a = [];
  if (p.stamina < 40) a.push({ tone: "down", title: tr("Stamina bassa", "Low Stamina"), text: tr("Rendi meno e rischi di più: nei prossimi tratti di stagione valuta un carico ridotto.", "You perform worse and risk injury: consider a lighter workload in upcoming season stretches.") });
  if (p.fragility >= 60) a.push({ tone: "down", title: tr("Fisico fragile", "High Fragility"), text: tr("Il rischio di infortuni è alto: riposo e preparatore atletico lo fanno scendere.", "Injury risk is high: rest and a personal trainer will help lower it.") });
  if (p.morale < 35) a.push({ tone: "down", title: tr("Morale basso", "Low Morale"), text: tr("Frena la crescita: vittorie e buone scelte d'estate lo fanno risalire.", "Slows development: winning games and smart summer choices will bring it back up.") });
  if (coachTrustOf(p) < 25) a.push({ tone: "down", title: tr("L'allenatore si fida poco", "Low Coach Trust"), text: tr("Sotto 25 di fiducia perdi minuti: giocare bene la fa risalire.", "Below 25 trust you lose playing time: strong performances will earn it back.") });
  const c = p.contract;
  if (c && c.yearsRemaining === 1 && p.league !== "NCAA") a.push({ tone: "signal", title: tr("Contratto all'ultimo anno", "Contract Year"), text: tr("La prossima estate si tratta: il rendimento di questa stagione pesa sulle offerte.", "Free agency awaits next summer: your performance this season will drive offers.") });
  if (p.adaptation && p.adaptation.level < 60) a.push({ tone: "live", title: tr("Ancora da ambientarti", "Still Adapting"), text: tr("Finché l'ambientamento non arriva a 100 rendi un po' meno e la lontananza pesa sul morale.", "Until adaptation reaches 100 you play slightly below par and homesickness weighs on morale.") });
  const cg = p.careerGoal, goal = cg && cg.status === "active" ? getCareerGoal(cg.id) : null;
  if (goal && goal.deadline && goal.deadline - p.age <= 2 && goal.deadline > p.age) {
    const left = goal.deadline - p.age;
    a.push({ tone: "signal", title: tr("Il sogno stringe i tempi", "Dream Deadline Approaching"), text: `"${goal.label}": ${left === 1 ? tr("ti resta una stagione", "1 season left") : tr(`ti restano ${left} stagioni`, `${left} seasons left`)}.` });
  }
  if (p.draftRights && !p.inNBA) a.push({ tone: "live", title: tr("Diritti USA-1", "USA-1 Draft Rights"), text: tr(`${p.draftRights.team.name} ti richiamerà la prossima estate.`, `${p.draftRights.team.name} will call you back next summer.`) });
  return a;
}

/* I numeri della stagione in corso, o dell'ultima giocata */
function overviewSeasonNumbers(p) {
  const s = p.pendingSeason;
  if (s && s.phase === "blocks") {
    if (!s.blocks.length) return null;
    const agg = aggregateSeasonBlocks(s.blocks);
    return { label: `${tr("Stagione", "Season")} ${p.year} · ${tr("in corso", "in progress")}`, pts: agg.stats.pts, reb: agg.stats.reb, ast: agg.stats.ast, record: `${agg.wins}-${agg.losses}` };
  }
  if (s && s.stats) return { label: `${tr("Stagione", "Season")} ${p.year} · postseason`, pts: s.stats.pts, reb: s.stats.reb, ast: s.stats.ast, record: `${s.regular.wins}-${s.regular.losses}` };
  const last = p.history[p.history.length - 1];
  if (!last) return null;
  return { label: `${tr("Stagione", "Season")} ${last.year}`, pts: last.pts, reb: last.reb, ast: last.ast, record: `${last.wins}-${last.losses}` };
}

function overviewHeroHtml(p) {
  const s = p.pendingSeason, last = p.history[p.history.length - 1];
  const c = p.contract;
  const role = s && s.minutesInfo ? `${teamRoleLabel(s.minutesInfo)} · ${s.minutesInfo.mpg} MPG` : last ? `${last.roleLabel} · ${last.mpg} MPG` : tr("Da scoprire in stagione", "TBD in season");
  const contract = c && c.yearsRemaining > 0
    ? `${c.yearsRemaining === 1 ? tr("Ultimo anno", "Final year") : `${c.yearsRemaining} ${tr("anni", "yrs")}`}${c.salaryPerYear != null ? ` · ${fmtMoney(c.salaryPerYear, c.currency)}/${tr("anno", "yr")}` : tr(" · borsa di studio", " · scholarship")}`
    : tr("Svincolato", "Free Agent");
  const room = Math.max(0, p.potential - p.overall);
  const nums = overviewSeasonNumbers(p);
  return `
    <div class="ov-hero">
      <div class="ov-level">
        <div class="ov-ovr"><span class="ov-ovr__val">${p.overall}</span><span class="ov-ovr__lbl">Overall ${deltaChip(p.overall, "overall")}</span></div>
        <div class="ov-room">
          <div class="ov-room__bar"><span style="width:${clamp(p.overall / Math.max(p.potential, 1) * 100, 0, 100)}%"></span></div>
          <div class="small-muted">${room ? tr(`Puoi crescere ancora di ${room} fino a ${p.potential} di potenziale`, `Room to grow +${room} up to ${p.potential} potential`) : tr("Sei al massimo del tuo potenziale", "You have reached your full potential")}</div>
        </div>
      </div>
      <dl class="ov-facts">
        <div><dt>${tr("Squadra", "Team")}</dt><dd>${teamLabel(p.team)} <span class="small-muted">${LEAGUES[p.league].name}</span></dd></div>
        <div><dt>${tr("Ruolo", "Role")}</dt><dd>${role}</dd></div>
        <div><dt>${tr("Contratto", "Contract")}</dt><dd>${contract}</dd></div>
        ${p.signatureShoe ? `<div><dt>${tr("Signature Shoe", "Signature Shoe")}</dt><dd>👟 ${p.signatureShoe.modelName} <span class="small-muted">(${p.signatureShoe.brandName} · ${p.signatureShoe.cutName})</span></dd></div>` : ""}
      </dl>
      <div class="ov-numbers">
        <div class="ov-numbers__k">${nums ? nums.label : tr("La prima stagione ti aspetta", "Your first season awaits")}</div>
        ${nums ? `<div class="summary-grid ov-tiles">
          <div class="sg-item"><div class="sg-val">${nums.pts}</div><div class="sg-lbl">${tr("Punti", "Points")}</div></div>
          <div class="sg-item"><div class="sg-val">${nums.reb}</div><div class="sg-lbl">${tr("Rimbalzi", "Rebounds")}</div></div>
          <div class="sg-item"><div class="sg-val">${nums.ast}</div><div class="sg-lbl">${tr("Assist", "Assists")}</div></div>
          <div class="sg-item"><div class="sg-val">${nums.record}</div><div class="sg-lbl">${tr("Squadra V-S", "Team W-L")}</div></div>
        </div>` : `<p class="small-muted">${tr("Le tue statistiche appariranno qui dopo i primi tratti di stagione.", "Your stats will appear here after the opening stretches of the season.")}</p>`}
      </div>
    </div>`;
}

/* Stato in tre blocchi con un semaforo: testa, corpo, immagine */
function overviewStateHtml(p) {
  const groups = [
    { label: tr("Testa", "Mindset"), items: [
      { label: tr("Morale", "Morale"), help: "morale", key: "morale", v: p.morale },
      { label: tr("Chimica", "Chemistry"), help: "chemistry", key: "chemistry", v: p.chemistry },
      ...(p.adaptation ? [{ label: tr("Ambientamento", "Adaptation"), help: "adaptation", key: "adaptation", v: p.adaptation.level }] : []),
    ] },
    { label: tr("Corpo", "Body"), items: [
      { label: "Stamina", help: "stamina", key: "stamina", v: p.stamina },
      { label: tr("Fragilità", "Fragility"), help: "fragility", key: "fragility", v: p.fragility, invert: true },
    ] },
    { label: tr("Immagine", "Image"), items: [
      { label: tr("Popolarità", "Popularity"), help: "popularity", key: "popularity", v: p.popularity },
      { label: tr("Reputazione", "Reputation"), help: "reputation", key: "reputation", v: reputationOf(p) },
    ] },
  ];
  return `<div class="ov-state">${groups.map(g => {
    const score = g.items.reduce((t, x) => t + (x.invert ? 100 - x.v : x.v), 0) / g.items.length;
    const light = score >= 65 ? { cls: "up", text: tr("Bene", "Good") } : score >= 40 ? { cls: "warn", text: tr("Da tenere d'occhio", "Watch") } : { cls: "down", text: tr("Critico", "Critical") };
    return `
      <div class="ov-group">
        <div class="ov-group__head"><span class="ov-group__name">${g.label}</span><span class="ov-light ${light.cls}"><span class="ov-light__dot"></span>${light.text}</span></div>
        ${g.items.map(x => `
          <div class="attr-row">
            <div class="al">${x.label} ${helpTip(x.help)}</div>
            <div class="abar-wrap"><div class="abar" style="width:${x.v}%;background:${x.invert ? "var(--down)" : "var(--live)"}"></div></div>
            <div class="av">${x.v}</div>${deltaChip(x.v, x.key, x.invert)}
          </div>`).join("")}
      </div>`;
  }).join("")}</div>`;
}

function overviewTeamHtml(p) {
  const s = p.pendingSeason, last = p.history[p.history.length - 1];
  const rank = s && s.regular && s.regular.rank ? `${s.regular.rank}° / ${s.regular.totalTeams}` : last && last.rank ? `${last.rank}° / ${last.totalTeams}` : "—";
  return `
    <div class="summary-grid ov-tiles">
      <div class="sg-item"><div class="sg-val">${coachTrustOf(p)}</div><div class="sg-lbl">${tr("Fiducia del coach", "Coach Trust")} ${helpTip("coachTrust")}</div></div>
      <div class="sg-item"><div class="sg-val">${starRapportOf(p)}</div><div class="sg-lbl">${tr("Intesa con la stella", "Star Rapport")} ${helpTip("starRapport")}</div></div>
      <div class="sg-item"><div class="sg-val">${rank}</div><div class="sg-lbl">${tr("Classifica", "Standings")}</div></div>
    </div>
    <button type="button" class="btn btn-ghost ov-more" data-ov-tab="carriera">${tr("Squadra e classifica", "Team & Standings")} ${ico("play")}</button>`;
}

function overviewNewsHtml(p) {
  const items = (p.news || []).slice(0, 3);
  if (!items.length) return `<p class="small-muted">${tr("Le notizie della tua carriera appariranno qui.", "Your career news will appear here.")}</p>`;
  return `<ul class="news-list">${items.map(n => { const m = newsMarker(n.text); return `<li><span class="news-when">${n.year}</span><span class="news-mark ${m.cls}" aria-hidden="true">${m.mark}</span><span class="news-text"></span></li>`; }).join("")}</ul>
    <button type="button" class="btn btn-ghost ov-more" data-ov-tab="carriera">${tr("Tutte le notizie", "All News")} ${ico("play")}</button>`;
}

function renderOverview() {
  const p = player;
  el("ov-hero").innerHTML = overviewHeroHtml(p);
  const alerts = overviewAlerts(p);
  el("ov-alerts-card").classList.toggle("hidden", !alerts.length);
  el("ov-alerts").innerHTML = alerts.map(a => `
    <div class="ov-alert ${a.tone}"><div class="ov-alert__t">${a.title}</div><div class="ov-alert__d">${a.text}</div></div>`).join("");
  if (el("ov-goals")) el("ov-goals").innerHTML = `${careerGoalCardHtml(p)}<div class="ov-season-goals">${seasonGoalsCardHtml(p)}</div>`;
  if (el("career-goal-card")) el("career-goal-card").innerHTML = careerGoalCardHtml(p);
  if (el("season-goals-card")) el("season-goals-card").innerHTML = seasonGoalsCardHtml(p);
  el("ov-state").innerHTML = overviewStateHtml(p);
  el("ov-team").innerHTML = overviewTeamHtml(p);
  const news = el("ov-news");
  news.innerHTML = overviewNewsHtml(p);
  const items = (p.news || []).slice(0, 3);
  news.querySelectorAll(".news-text").forEach((node, i) => { node.textContent = stripEmoji(items[i].text); });
  document.querySelectorAll("#screen-game [data-ov-tab]").forEach(b => b.addEventListener("click", () => {
    switchGameTab(b.dataset.ovTab);
    if (typeof window !== "undefined" && window.scrollTo) window.scrollTo(0, 0);
  }));
}
