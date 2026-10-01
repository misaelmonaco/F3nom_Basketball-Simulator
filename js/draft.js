"use strict";

/* ================================================================
   DRAFT — combine, provino privato e notte del Draft. La quotazione (roll) parte
   dall'overall; combine e provino la spostano, e un provino riuscito può "prenotare"
   la chiamata della squadra scelta se la quotazione arriva vicino alla sua posizione.
   ================================================================ */
const DRAFT_SLOTS = [
  { id: "top", label: "Scelta alta (1-5)", result: "Top 5 assoluto! 🎉", threshold: 93, picks: [1, 5] },
  { id: "mid", label: "Metà primo giro", result: "Primo Giro", threshold: 88, picks: [8, 18] },
  { id: "late", label: "Fine primo giro", result: "Primo Giro", threshold: 84, picks: [19, 30] },
  { id: "second", label: "Secondo giro", result: "Secondo Giro", threshold: 77, picks: [31, 58] },
];
const COMBINE_SHOWCASES = [
  { id: "athletic", icon: "⚡", label: "Test atletici", desc: "Salto da fermo, sprint e agilità: conta l'atletismo.", score: p => p.attrs.athleticism },
  { id: "shooting", icon: "🎯", label: "Sessione di tiro", desc: "Tiri piazzati e dal palleggio davanti agli scout: conta il tiro.", score: p => p.attrs.shooting },
  { id: "interview", icon: "🗣️", label: "Colloqui con le squadre", desc: "Faccia a faccia con i general manager: contano reputazione e morale.", score: p => (reputationOf(p) + p.morale) / 2 + 12 },
];

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
  if (score >= 82) { bonus = 4; text = "Prestazione da urlo: la tua quotazione vola."; }
  else if (score >= 72) { bonus = 2; text = "Buona impressione: gli scout prendono appunti."; }
  else if (score >= 62) { bonus = 0; text = "Nella norma: niente di memorabile."; }
  else { bonus = -3; text = "Giornata storta: qualche squadra si raffredda."; }
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
    player.coachTrust = 55; player.starRapport = 55;
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
    titleEl.textContent = "Il Draft Combine";
    subEl.textContent = `Overall ${player.overall}. Tutti gli scout USA-1 sono in tribuna: cosa vuoi mostrare?`;
    cards.innerHTML = COMBINE_SHOWCASES.map((c, i) => offCardHtml({ idx: i, icon: c.icon, title: c.label, desc: c.desc })).join("");
    cards.querySelectorAll(".off-card").forEach(c => c.addEventListener("click", () => chooseCombineShowcase(COMBINE_SHOWCASES[parseInt(c.dataset.idx)].id)));
    return;
  }
  if (d.stage === "workout") {
    titleEl.textContent = "Provino privato";
    subEl.textContent = `${d.combine.label}: ${d.combine.text} Scegli una squadra con cui allenarti: se il provino va bene e la tua quotazione si avvicina alla sua posizione, sarà lei a chiamarti.`;
    cards.innerHTML = d.workouts.map((w, i) => {
      const slot = DRAFT_SLOTS.find(s => s.id === w.slotId);
      const chance = clamp(55 + (player.overall - slot.threshold) * 4 + d.bonus * 3, 10, 90);
      return offCardHtml({ idx: i, icon: (w.team.name[0] || "?").toUpperCase(), iconTone: w.team.colors[0], title: w.team.name, subtitle: slot.label,
        desc: `Probabilità di un buon provino: ${Math.round(chance)}%`, tags: [{ text: slot.label, tone: slot.id === "top" ? "gold" : "blue" }] });
    }).join("");
    cards.querySelectorAll(".off-card").forEach(c => c.addEventListener("click", () => chooseDraftWorkout(parseInt(c.dataset.idx))));
    extra.innerHTML = `<div class="btn-row" style="justify-content:center"><button class="btn btn-ghost" id="btn-skip-workout">Nessun provino: aspetto la notte del Draft</button></div>`;
    el("btn-skip-workout").addEventListener("click", skipDraftWorkout);
    return;
  }
  const n = d.night;
  const slot = n.slotId ? DRAFT_SLOTS.find(s => s.id === n.slotId) : null;
  titleEl.textContent = "La notte del Draft";
  const w = d.workout;
  subEl.textContent = !w ? "Hai aspettato la chiamata senza provini."
    : !w.ok ? `Il provino con ${w.team.name} non ha convinto.`
    : n.fromWorkout ? `Il provino con ${w.team.name} ha convinto: hanno tenuto fede alla parola.`
    : n.team && DRAFT_SLOTS.findIndex(s => s.id === n.slotId) < DRAFT_SLOTS.findIndex(s => s.id === w.slotId)
      ? `Il provino con ${w.team.name} era andato bene, ma la tua quotazione è salita così tanto che qualcuno ti ha preso prima.`
      : `Il provino con ${w.team.name} era andato bene, ma la tua quotazione non è arrivata fino alla loro scelta.`;
  cards.className = "off-cards off-cards-single";
  cards.innerHTML = offCardHtml({
    icon: n.team ? "🏀" : "📵", iconTone: n.team ? n.team.colors[0] : null, staticCard: true,
    title: n.team ? `Scelta n° ${n.pick}: ${n.team.name}` : "Nessuna squadra ti ha scelto",
    subtitle: slot ? slot.label : "Undrafted",
    desc: n.team ? `Con la ${n.pick}ª scelta, i ${n.team.name} chiamano il tuo nome.` : "Resta la strada del free agent o un altro anno nel tuo percorso.",
  });
  extra.innerHTML = `<div class="btn-row" style="justify-content:center"><button class="btn btn-primary btn-lg" id="btn-draft-continue">▶️ Continua</button></div>`;
  el("btn-draft-continue").addEventListener("click", finishDraftNight);
}
