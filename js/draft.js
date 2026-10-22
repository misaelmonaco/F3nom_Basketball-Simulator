"use strict";

/* ================================================================
   DRAFT — combine, provino privato e notte del Draft. La quotazione (roll) parte
   dall'overall; combine e provino la spostano, e un provino riuscito può "prenotare"
   la chiamata della squadra scelta se la quotazione arriva vicino alla sua posizione.
   ================================================================ */
const DRAFT_SLOTS = i18nify([
  { id: "top", label: "Scelta alta (1-5)", labelEn: "Lottery Top Pick (1-5)", result: "Top 5 assoluto! 🎉", resultEn: "Top 5 Pick! 🎉", threshold: 93, picks: [1, 5] },
  { id: "mid", label: "Metà primo giro", labelEn: "Mid First Round", result: "Primo Giro", resultEn: "First Round", threshold: 88, picks: [8, 18] },
  { id: "late", label: "Fine primo giro", labelEn: "Late First Round", result: "Primo Giro", resultEn: "First Round", threshold: 84, picks: [19, 30] },
  { id: "second", label: "Secondo giro", labelEn: "Second Round", result: "Secondo Giro", resultEn: "Second Round", threshold: 77, picks: [31, 58] },
]);
const COMBINE_SHOWCASES = i18nify([
  { id: "athletic", icon: "⚡", label: "Test atletici", labelEn: "Athletic Testing", desc: "Salto da fermo, sprint e agilità: conta l'atletismo.", descEn: "Vertical leap, sprint, and agility drills: Athleticism is key.", score: p => p.attrs.athleticism },
  { id: "shooting", icon: "🎯", label: "Sessione di tiro", labelEn: "Shooting Drills", desc: "Tiri piazzati e dal palleggio davanti agli scout: conta il tiro.", descEn: "Spot-up and off-the-dribble shooting in front of scouts: Shooting is key.", score: p => p.attrs.shooting },
  { id: "interview", icon: "🗣️", label: "Colloqui con le squadre", labelEn: "Team Interviews", desc: "Faccia a faccia con i general manager: contano reputazione e morale.", descEn: "Face-to-face meetings with general managers: reputation and morale matter.", score: p => (reputationOf(p) + p.morale) / 2 + 12 },
]);

function startDraftCombine(record) {
  const slots = DRAFT_SLOTS.map(slot => ({ slotId: slot.id, team: pickTeam("NBA") }));
  // quattro squadre diverse
  const seen = new Set();
  slots.forEach(s => { let guard = 0; while (seen.has(s.team.name) && guard++ < 10) s.team = pickTeam("NBA"); seen.add(s.team.name); });
  player.pendingDecision = { type: "draftCombine", stage: "combine", record, bonus: 0, combine: null, workouts: slots, workout: null };
  renderGameScreen();
}

function chooseCombineShowcase(id) {
  const d = player.pendingDecision;
  if (!d || d.type !== "draftCombine" || d.stage !== "combine") return;
  const sc = COMBINE_SHOWCASES.find(x => x.id === id);
  const score = sc.score(player) + randInt(-8, 8);
  let bonus, text;
  if (score >= 82) { bonus = 4; text = tr("Prestazione da urlo: la tua quotazione vola.", "Show-stopping performance: your draft stock skyrockets."); }
  else if (score >= 72) { bonus = 2; text = tr("Buona impressione: gli scout prendono appunti.", "Good impression: scouts are taking notes."); }
  else if (score >= 62) { bonus = 0; text = tr("Nella norma: niente di memorabile.", "Average showing: nothing memorable."); }
  else { bonus = -3; text = tr("Giornata storta: qualche squadra si raffredda.", "Off day: a few teams cool on you."); }
  d.bonus += bonus;
  d.combine = { id, label: sc.label, bonus, text };
  d.stage = "workout";
  renderGameScreen();
}

function chooseDraftWorkout(idx) {
  const d = player.pendingDecision;
  if (!d || d.type !== "draftCombine" || d.stage !== "workout") return;
  const w = d.workouts[idx];
  const slot = DRAFT_SLOTS.find(s => s.id === w.slotId);
  // più la squadra sceglie in alto, più il provino è severo
  const chance = clamp(55 + (player.overall - slot.threshold) * 4 + d.bonus * 3, 10, 90);
  const ok = w ? rollChance(chance) : false;
  d.workout = { idx, team: w.team, slotId: w.slotId, ok, chance };
  if (ok) player.morale = clamp(player.morale + 3, 0, 100);
  runDraftNight(d);
}
function skipDraftWorkout() {
  const d = player.pendingDecision;
  if (!d || d.type !== "draftCombine" || d.stage !== "workout") return;
  d.workout = null;
  runDraftNight(d);
}

/* Notte del Draft: quotazione finale, eventuale chiamata "prenotata" dal provino */
function runDraftNight(d) {
  const roll = player.overall + randInt(-7, 5) + d.bonus;
  let slot = [...DRAFT_SLOTS].find(s => roll >= s.threshold) || null;
  let team = slot ? pickTeam("NBA") : null;
  const w = d.workout;
  if (w && w.ok) {
    const promised = DRAFT_SLOTS.find(s => s.id === w.slotId);
    if (roll >= promised.threshold - 2 && (!slot || DRAFT_SLOTS.indexOf(slot) >= DRAFT_SLOTS.indexOf(promised))) {
      slot = promised;
      team = w.team;
    }
  }
  player.draftDeclared = true;
  const pick = slot ? randInt(slot.picks[0], slot.picks[1]) : null;
  d.stage = "night";
  d.night = { roll, slotId: slot ? slot.id : null, team, pick, fromWorkout: !!(w && w.ok && team && team.name === w.team.name),
    // dove si giocava prima: rifiutando il contratto da rookie si resta lì
    prev: { team: player.team, league: player.league, coachTrust: player.coachTrust, starRapport: player.starRapport } };
  if (team) {
    player.drafted = true; player.draftedYear = player.age; player.inNBA = true; player.league = "NBA"; player.team = team;
    if (typeof onTeamChangeRelationships === "function") onTeamChangeRelationships(player);
    else { player.coachTrust = 55; player.starRapport = 55; }
  } else {
    player.undraftedYears++;
  }
  renderGameScreen();
}

function finishDraftNight() {
  const d = player.pendingDecision;
  if (!d || d.type !== "draftCombine" || d.stage !== "night") return;
  const slot = d.night.slotId ? DRAFT_SLOTS.find(s => s.id === d.night.slotId) : null;
  continueAfterDraft(d.record, slot ? slot.result : "Undrafted", d.night.team, d.night.pick, d.night.prev);
}

function renderDraftCombine(d, titleEl, subEl, cards, extra) {
  if (d.stage === "combine") {
    titleEl.textContent = tr("Il Draft Combine", "The Draft Combine");
    subEl.textContent = tr(`Overall ${player.overall}. Tutti gli scout USA-1 sono in tribuna: cosa vuoi mostrare?`, `Overall ${player.overall}. Every USA-1 scout is in the stands: what do you want to showcase?`);
    cards.innerHTML = COMBINE_SHOWCASES.map((c, i) => offCardHtml({ idx: i, icon: c.icon, title: c.label, desc: c.desc })).join("");
    cards.querySelectorAll(".off-card").forEach(c => c.addEventListener("click", () => chooseCombineShowcase(COMBINE_SHOWCASES[parseInt(c.dataset.idx)].id)));
    return;
  }
  if (d.stage === "workout") {
    titleEl.textContent = tr("Provino privato", "Private Workout");
    subEl.textContent = tr(`${d.combine.label}: ${d.combine.text} Scegli una squadra con cui allenarti: se il provino va bene e la tua quotazione si avvicina alla sua posizione, sarà lei a chiamarti.`, `${d.combine.label}: ${d.combine.text} Pick a team to work out for: if it goes well and your stock lands near their pick, they'll call your name.`);
    cards.innerHTML = d.workouts.map((w, i) => {
      const slot = DRAFT_SLOTS.find(s => s.id === w.slotId);
      const chance = clamp(55 + (player.overall - slot.threshold) * 4 + d.bonus * 3, 10, 90);
      return offCardHtml({ idx: i, icon: (w.team.name[0] || "?").toUpperCase(), iconTone: w.team.colors[0], title: w.team.name, subtitle: slot.label,
        desc: tr(`Probabilità di un buon provino: ${Math.round(chance)}%`, `Chance of a strong workout: ${Math.round(chance)}%`), tags: [{ text: slot.label, tone: slot.id === "top" ? "gold" : "blue" }] });
    }).join("");
    cards.querySelectorAll(".off-card").forEach(c => c.addEventListener("click", () => chooseDraftWorkout(parseInt(c.dataset.idx))));
    extra.innerHTML = `<div class="btn-row" style="justify-content:center"><button class="btn btn-ghost" id="btn-skip-workout">${tr("Nessun provino: aspetto la notte del Draft", "Skip workout: wait for Draft Night")}</button></div>`;
    el("btn-skip-workout").addEventListener("click", skipDraftWorkout);
    return;
  }
  const n = d.night;
  const slot = n.slotId ? DRAFT_SLOTS.find(s => s.id === n.slotId) : null;
  titleEl.textContent = tr("La notte del Draft", "Draft Night");
  const w = d.workout;
  subEl.textContent = !w ? tr("Hai aspettato la chiamata senza provini.", "You waited for your name to be called without private workouts.")
    : !w.ok ? tr(`Il provino con ${w.team.name} non ha convinto.`, `Your workout with ${w.team.name} didn't convince them.`)
    : n.fromWorkout ? tr(`Il provino con ${w.team.name} ha convinto: hanno tenuto fede alla parola.`, `Your workout with ${w.team.name} won them over: they kept their word.`)
    : n.team && DRAFT_SLOTS.findIndex(s => s.id === n.slotId) < DRAFT_SLOTS.findIndex(s => s.id === w.slotId)
      ? tr(`Il provino con ${w.team.name} era andato bene, ma la tua quotazione è salita così tanto che qualcuno ti ha preso prima.`, `Your workout with ${w.team.name} went well, but your stock rose so high that another team drafted you earlier.`)
      : tr(`Il provino con ${w.team.name} era andato bene, ma la tua quotazione non è arrivata fino alla loro scelta.`, `Your workout with ${w.team.name} went well, but your draft stock didn't reach their range.`);
  cards.className = "off-cards off-cards-single";
  cards.innerHTML = offCardHtml({
    icon: n.team ? "🏀" : "📵", iconTone: n.team ? n.team.colors[0] : null, staticCard: true,
    title: n.team ? tr(`Scelta n° ${n.pick}: ${n.team.name}`, `Pick #${n.pick}: ${n.team.name}`) : tr("Nessuna squadra ti ha scelto", "No team drafted you"),
    subtitle: slot ? slot.label : "Undrafted",
    desc: n.team ? tr(`Con la ${n.pick}ª scelta, i ${n.team.name} chiamano il tuo nome.`, `With pick #${n.pick}, the ${n.team.name} call your name.`) : tr("Resta la strada del free agent o un altro anno nel tuo percorso.", "You can still pursue free agency or stay another year on your current path."),
  });
  extra.innerHTML = `<div class="btn-row" style="justify-content:center"><button class="btn btn-primary btn-lg" id="btn-draft-continue">▶️ ${tr("Continua", "Continue")}</button></div>`;
  el("btn-draft-continue").addEventListener("click", finishDraftNight);
}
