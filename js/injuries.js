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

function renderInjuryModal(inj, last, relapsePct, onSelect) {
  const overlay = el("injury-overlay");
  const card = el("injury-modal-card");
  if (!overlay || !card) return;

  card.innerHTML = `
    <div class="im-header-strap">
      <span class="im-tag">Report dello Staff Medico</span>
      <span class="small-muted">${inj.block}</span>
      <button type="button" class="btn btn-ghost btn-xs" id="btn-close-injury-modal" style="margin-left:auto; padding:2px 8px;" title="Chiudi">✕</button>
    </div>
    <div class="cm-body">
      <div>
        <h3 class="im-inj-title">🩹 ${inj.label}</h3>
        <p class="im-inj-sub">Diagnosi confermata dallo staff medico dopo gli esami strumentali. ${last ? "I playoff sono alle porte: ogni giorno conta." : "La stagione regolare è ancora lunga e il fisico è sotto stress."}</p>
      </div>
      <div class="im-choices">
        <button type="button" class="im-card safe" data-inj-choice="surgery">
          <div>
            <div class="im-c-h">
              <span class="im-c-title">🏥 Operazione Chirurgica</span>
              <span class="im-c-badge green">Sicuro</span>
            </div>
            <div class="im-c-desc">Intervento immediato per risolvere alla radice. Salti il resto della stagione (playoff compresi), ma torni integro: fragilità −6 (overall −1).</div>
          </div>
          <div style="margin-top:12px; font-family:var(--font-label); font-size:12px; font-weight:700; color:var(--up); text-transform:uppercase;">
            Rientro garantito a inizio prossima annata
          </div>
        </button>

        <button type="button" class="im-card risky" data-inj-choice="conservative">
          <div>
            <div class="im-c-h">
              <span class="im-c-title">🧊 Terapia Conservativa</span>
              <span class="im-c-badge red">Rischio Ricaduta ${relapsePct}%</span>
            </div>
            <div class="im-c-desc">${last ? "Infiltrazioni e rientro per i playoff." : "Salti metà del prossimo tratto e rientri subito in campo."} Ma se ricadi: stagione finita, −3 overall e fisico indebolito.</div>
          </div>
          <div style="margin-top:12px; font-family:var(--font-label); font-size:12px; font-weight:700; color:var(--signal); text-transform:uppercase;">
            Rientro anticipato ad alto rischio
          </div>
        </button>
      </div>
    </div>`;

  const btnClose = card.querySelector("#btn-close-injury-modal");
  if (btnClose) btnClose.addEventListener("click", () => overlay.classList.add("hidden"));
  card.querySelectorAll("[data-inj-choice]").forEach(b => {
    b.addEventListener("click", () => {
      overlay.classList.add("hidden");
      onSelect(b.dataset.injChoice);
    });
  });
  overlay.classList.remove("hidden");
}

function hideInjuryModal() {
  const overlay = el("injury-overlay");
  if (overlay) overlay.classList.add("hidden");
}

function renderInjuryChoice(d, titleEl, subEl, cards) {
  const inj = player.pendingSeason.seriousInjury;
  const last = blocksLeft(player.pendingSeason) === 0;
  const relapsePct = Math.round(relapseChance(player));
  titleEl.textContent = `🩹 ${inj.label}`;
  subEl.textContent = `Un infortunio serio in ${inj.block}. Lo staff medico ti lascia la scelta: ${last ? "i playoff sono vicini." : "la stagione è ancora lunga."}`;
  cards.innerHTML =
    offCardHtml({ idx: 0, icon: "🏥", title: "Operazione", subtitle: "Stagione finita, playoff compresi",
      desc: "Salti tutto il resto della stagione, ma torni sano: fragilità −6 (overall −1).", tags: [{ text: "Nessun rischio", tone: "green" }] }) +
    offCardHtml({ idx: 1, icon: "🧊", iconTone: "var(--accent-2)", title: "Terapia conservativa", subtitle: last ? "Rientro per i playoff" : "Rientro rapido",
      desc: `${last ? "Giochi i playoff" : "Salti metà del prossimo tratto"}, ma se ricadi perdi tutta la stagione, 3 punti di overall e il fisico si indebolisce.`,
      tags: [{ text: `Ricaduta ${relapsePct}%`, tone: "red" }] });
  cards.querySelector('[data-idx="0"]').addEventListener("click", () => resolveInjuryChoice("surgery"));
  cards.querySelector('[data-idx="1"]').addEventListener("click", () => resolveInjuryChoice("conservative"));

  // Apri automaticamente la modale del report medico
  renderInjuryModal(inj, last, relapsePct, (choice) => resolveInjuryChoice(choice));
}
