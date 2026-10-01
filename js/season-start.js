"use strict";

/* ================================================================
   SEASON ADVANCE — stagione regolare, poi eventuale postseason interattiva
   ================================================================ */
function advanceSeason() {
  if (player.retired) return;
  if (player.pendingDecision) { toast("⚠️ Devi prima risolvere la decisione in sospeso."); return; }
  // scenario: obiettivo raggiunto o scadenza passata, prima che la stagione cominci
  if (scenarioInterrupt("start")) return;
  if (!player.careerGoal && player.age < 36) {
    player.pendingDecision = { type: "careerGoal", options: careerGoalOptions(player) };
    renderGameScreen();
    return;
  }

  takeYearSnapshot(player); // per le frecce della Panoramica
  player.age++;
  player.year++;
  if (player.league !== "NCAA" || player.age > 18) player.yearsPro++;

  // ritiro forzato; la stagione del tour d'addio annunciato si gioca comunque (tranne a 40 anni)
  if (player.age >= 40 || (player.age >= 32 && player.overall < 60 && player.farewellTour !== player.year)) {
    forceRetireFlow();
    return;
  }

  // ogni tanto, prima della simulazione, si può scegliere su cosa concentrare la stagione:
  // la scelta stessa non è mai casuale (la fa il giocatore), ma la sua disponibilità sì
  if (player.age >= 17 && rollChance(28)) {
    player.pendingDecision = { type: "seasonFocus" };
    renderGameScreen();
    return;
  }

  advanceSeasonContinue();
}

/* Applica (se scelto) il focus stagionale — spinta agli attributi coerenti e possibile
   evoluzione dell'archetipo verso lo stile scelto — poi prosegue con la simulazione vera
   e propria della stagione, esattamente come se il focus non fosse mai stato proposto. */
function resolveSeasonFocus(focusId) {
  const opt = SEASON_FOCUS_OPTIONS.find(o => o.id === focusId);
  player.pendingDecision = null;
  if (!opt) { advanceSeasonContinue(); return; }

  const result = { focus: opt, archetypeChanged: false, newArchetypeName: null };
  opt.attrs.forEach(k => { player.attrs[k] = clamp(player.attrs[k] + randInt(1, 3), 30, 99); });

  // possibilità (non garantita) che il lavoro mirato faccia evolvere l'archetipo verso lo stile scelto
  const targetId = (FOCUS_ARCHETYPE_MAP[player.role] || {})[focusId];
  if (targetId && targetId !== player.archetypeId && rollChance(30)) {
    player.archetypeId = targetId;
    result.archetypeChanged = true;
    const arch = getArchetype(player.role, targetId);
    result.newArchetypeName = arch ? arch.name : null;
    toast(`🔄 Il tuo stile di gioco si evolve: ora sei ${result.newArchetypeName}!`);
  }

  player.pendingSeasonFocusResult = result;
  advanceSeasonContinue();
}
