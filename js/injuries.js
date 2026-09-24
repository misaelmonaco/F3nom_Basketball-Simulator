"use strict";

/* ================================================================
   INFORTUNI GRAVI — una parte degli infortuni è seria: subito dopo il tratto si sceglie
   tra operazione (stagione finita, playoff compresi, ma si torna sani) e terapia
   conservativa (si rientra presto, col rischio di una ricaduta che costa cara).
   ================================================================ */
const SERIOUS_INJURIES = ["Rottura del legamento crociato", "Lesione al tendine d'Achille", "Frattura da stress al piede", "Lussazione della spalla"];
const RELAPSE_BASE = 30;

/* Probabilità (%) che un infortunio sia grave: età e fragilità la fanno salire */
function seriousInjuryChance(p) {
  return clamp(30 + p.fragility * 0.4 + Math.max(0, p.age - 28) * 2.5, 20, 65);
}
function relapseChance(p) { return clamp(RELAPSE_BASE + p.fragility * 0.3, 20, 60); }

/* Tratti ancora da giocare dopo quello appena chiuso */
function blocksLeft(s) { return SEASON_BLOCKS.length - s.blocks.length; }

function resolveInjuryChoice(choiceId) {
  const d = player.pendingDecision, s = player.pendingSeason;
  if (!d || d.type !== "injuryChoice" || !s) return;
  const inj = s.seriousInjury;
  inj.choice = choiceId;
  if (choiceId === "surgery") {
    // stagione finita: si salta tutto il resto, playoff compresi, ma il fisico si rimette a posto
    s.blocksOut = blocksLeft(s);
    s.outForPlayoffs = true;
    player.overall = clamp(player.overall - 1, 40, 99);
    player.fragility = clamp(player.fragility - 6, 0, 100);
    toast(`🏥 Operazione riuscita: stagione finita, ma tornerai al meglio.`);
  } else {
    inj.relapse = rollChance(relapseChance(player));
    if (inj.relapse) {
      s.blocksOut = blocksLeft(s);
      s.outForPlayoffs = true;
      player.overall = clamp(player.overall - 3, 40, 99);
      progressAttributes(player, -3);
      player.fragility = clamp(player.fragility + 10, 0, 100);
      player.morale = clamp(player.morale - 6, 0, 100);
      toast(`💥 Ricaduta: il rientro affrettato ti costa il resto della stagione.`);
    } else {
      s.partialOut = blocksLeft(s) ? 0.5 : 0; // si salta metà del prossimo tratto
      toast(`✅ La terapia funziona: rientri in fretta.`);
    }
  }
  pushNews(`🩹 ${inj.label}: ${choiceId === "surgery" ? "operazione" : inj.relapse ? "terapia conservativa, poi la ricaduta" : "terapia conservativa, rientro rapido"}.`);
  if (s.blocks.length >= SEASON_BLOCKS.length) { closeRegularSeason(); return; }
  player.pendingDecision = nextSeasonBlockDecision();
  renderGameScreen();
}

function renderInjuryChoice(d, titleEl, subEl, cards) {
  const inj = player.pendingSeason.seriousInjury;
  const last = blocksLeft(player.pendingSeason) === 0;
  titleEl.textContent = `🩹 ${inj.label}`;
  subEl.textContent = `Un infortunio serio in ${inj.block}. Lo staff medico ti lascia la scelta: ${last ? "i playoff sono vicini." : "la stagione è ancora lunga."}`;
  cards.innerHTML =
    offCardHtml({ idx: 0, icon: "🏥", title: "Operazione", subtitle: "Stagione finita, playoff compresi",
      desc: "Salti tutto il resto della stagione, ma torni sano: fragilità −6 (overall −1).", tags: [{ text: "Nessun rischio", tone: "green" }] }) +
    offCardHtml({ idx: 1, icon: "🧊", iconTone: "var(--accent-2)", title: "Terapia conservativa", subtitle: last ? "Rientro per i playoff" : "Rientro rapido",
      desc: `${last ? "Giochi i playoff" : "Salti metà del prossimo tratto"}, ma se ricadi perdi tutta la stagione, 3 punti di overall e il fisico si indebolisce.`,
      tags: [{ text: `Ricaduta ${Math.round(relapseChance(player))}%`, tone: "red" }] });
  cards.querySelector('[data-idx="0"]').addEventListener("click", () => resolveInjuryChoice("surgery"));
  cards.querySelector('[data-idx="1"]').addEventListener("click", () => resolveInjuryChoice("conservative"));
}
