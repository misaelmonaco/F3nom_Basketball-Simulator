"use strict";

/* ================================================================
   "DECIDO SOLO I MOMENTI IMPORTANTI" — un'opzione della carriera: le decisioni di
   routine si risolvono da sole con una scelta sensata, e al giocatore restano
   partite chiave, playoff, mercato, Draft, imprevisti e vita privata.
   ================================================================ */
function autoRoutineOn(p) { return !!(p && p.autoRoutine); }

function toggleAutoRoutine() {
  if (!player) return;
  player.autoRoutine = !player.autoRoutine;
  toast(player.autoRoutine
    ? tr("Decidi solo i momenti importanti: tratti di stagione tranquilli, resoconti, allenamento estivo e spese andranno avanti da soli.", "Key moments only: quiet season stretches, recaps, summer training, and spending will advance automatically.")
    : tr("Di nuovo tutte le decisioni in mano tua.", "All decisions are back in your hands."));
  renderGameScreen();
}

/* Routine: niente in gioco oltre alla gestione ordinaria */
function isRoutineDecision(p, d) {
  if (!d) return false;
  switch (d.type) {
    case "seasonBlock": return !d.isFinalRecap && !d.keyGame && !d.situation;
    case "seasonRecap": case "training": case "summerSpending": case "seasonFocus": return true;
    case "offseasonStatus":
      return !d.extensionOffer && !contractIncongruence(p, d.record) && !(typeof canRequestDuo === "function" && canRequestDuo(p));
    default: return false;
  }
}

/* Il carico di lavoro "ragionato": spingi quando sei fresco, gestisci quando sei stanco o a rischio */
function sensibleWorkload(p) {
  const risk = blockInjuryRisk(p);
  return p.stamina < 45 || risk >= 11 ? "rest" : p.stamina > 70 && risk < 5 ? "push" : "normal";
}
/* Il focus che non cambia il tuo stile di gioco */
function sensibleSeasonFocus(p) {
  const map = FOCUS_ARCHETYPE_MAP[p.role] || {};
  const keep = SEASON_FOCUS_OPTIONS.find(o => map[o.id] === p.archetypeId);
  return (keep || SEASON_FOCUS_OPTIONS[0]).id;
}

function resolveRoutineDecision(p, d) {
  switch (d.type) {
    case "seasonBlock":
      if (d.isFinalRecap) {
        if (typeof proceedFromSeasonBlocks === "function") proceedFromSeasonBlocks();
      } else {
        resolveSeasonBlock(sensibleWorkload(p), null);
      }
      break;
    case "seasonRecap": closeSeasonRecap(); break;
    case "training": autoTraining(); confirmTraining(); break;
    case "summerSpending": resolveSummerSpending(null); break;
    case "seasonFocus": resolveSeasonFocus(sensibleSeasonFocus(p)); break;
    case "offseasonStatus": advanceAfterOffseason(); break;
  }
}

/* Chiamata dopo ogni disegno della pagina: se la decisione in sospeso è di routine, la si
   risolve al giro successivo (così la pagina fa in tempo a disegnarsi e non si annidano chiamate) */
let autoRoutineTimer = null;
function scheduleAutoRoutine() {
  if (!autoRoutineOn(player) || autoRoutineTimer || player.retired) return;
  const d = player.pendingDecision;
  if (!isRoutineDecision(player, d)) return;
  autoRoutineTimer = setTimeout(() => {
    autoRoutineTimer = null;
    if (autoRoutineOn(player) && player.pendingDecision === d && isRoutineDecision(player, d)) resolveRoutineDecision(player, d);
  }, 250);
}
