"use strict";

/* ================================================================
   INFORTUNI GRAVI — una parte degli infortuni è seria: subito dopo il tratto si sceglie
   tra operazione (stagione finita, playoff compresi, ma si torna sani) e terapia
   conservativa (si rientra presto, col rischio di una ricaduta che costa cara).
   ================================================================ */
const SERIOUS_INJURIES = ["Rottura del legamento crociato", "Lesione al tendine d'Achille", "Frattura da stress al piede", "Lussazione della spalla"];
const SERIOUS_INJURIES_EN_MAP = {
  "Rottura del legamento crociato": "Torn ACL",
  "Lesione al tendine d'Achille": "Achilles Tendon Tear",
  "Frattura da stress al piede": "Foot Stress Fracture",
  "Lussazione della spalla": "Dislocated Shoulder",
};
function seriousInjuryLabel(lbl) {
  return (isEn() && SERIOUS_INJURIES_EN_MAP[lbl]) ? SERIOUS_INJURIES_EN_MAP[lbl] : lbl;
}
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
    toast(tr(`🏥 Operazione riuscita: stagione finita, ma tornerai al meglio.`, `🏥 Surgery successful: season over, but you will come back stronger.`));
  } else {
    inj.relapse = rollChance(relapseChance(player));
    if (inj.relapse) {
      s.blocksOut = blocksLeft(s);
      s.outForPlayoffs = true;
      player.overall = clamp(player.overall - 3, 40, 99);
      progressAttributes(player, -3);
      player.fragility = clamp(player.fragility + 10, 0, 100);
      player.morale = clamp(player.morale - 6, 0, 100);
      toast(tr(`💥 Ricaduta: il rientro affrettato ti costa il resto della stagione.`, `💥 Relapse: rushing back costs you the rest of the season.`));
    } else {
      s.partialOut = blocksLeft(s) ? 0.5 : 0; // si salta metà del prossimo tratto
      toast(tr(`✅ La terapia funziona: rientri in fretta.`, `✅ Therapy works: you return to the court quickly.`));
    }
  }
  const lbl = seriousInjuryLabel(inj.label);
  pushNews(tr(
    `🩹 ${lbl}: ${choiceId === "surgery" ? "operazione" : inj.relapse ? "terapia conservativa, poi la ricaduta" : "terapia conservativa, rientro rapido"}.`,
    `🩹 ${lbl}: ${choiceId === "surgery" ? "surgery" : inj.relapse ? "conservative therapy, followed by a relapse" : "conservative therapy, quick return"}.`
  ));
  if (s.blocks.length >= SEASON_BLOCKS.length) { closeRegularSeason(); return; }
  player.pendingDecision = nextSeasonBlockDecision();
  renderGameScreen();
}

function renderInjuryModal(inj, last, relapsePct, onSelect) {
  const overlay = el("injury-overlay");
  const card = el("injury-modal-card");
  if (!overlay || !card) return;
  const lbl = seriousInjuryLabel(inj.label);

  card.innerHTML = `
    <div class="im-header-strap">
      <span class="im-tag">${tr("Report dello Staff Medico", "Medical Staff Report")}</span>
      <span class="small-muted">${inj.block}</span>
      <button type="button" class="btn btn-ghost btn-xs" id="btn-close-injury-modal" style="margin-left:auto; padding:2px 8px;" title="${tr("Chiudi", "Close")}">✕</button>
    </div>
    <div class="cm-body">
      <div>
        <h3 class="im-inj-title">🩹 ${lbl}</h3>
        <p class="im-inj-sub">${tr("Diagnosi confermata dallo staff medico dopo gli esami strumentali.", "Diagnosis confirmed by the medical staff after imaging.")} ${last ? tr("I playoff sono alle porte: ogni giorno conta.", "The playoffs are right around the corner: every day counts.") : tr("La stagione regolare è ancora lunga e il fisico è sotto stress.", "The regular season is still long and your body is under stress.")}</p>
      </div>
      <div class="im-choices">
        <button type="button" class="im-card safe" data-inj-choice="surgery">
          <div>
            <div class="im-c-h">
              <span class="im-c-title">🏥 ${tr("Operazione Chirurgica", "Surgical Operation")}</span>
              <span class="im-c-badge green">${tr("Sicuro", "Safe")}</span>
            </div>
            <div class="im-c-desc">${tr("Intervento immediato per risolvere alla radice. Salti il resto della stagione (playoff compresi), ma torni integro: fragilità −6 (overall −1).", "Immediate surgery to fix the root issue. Miss the rest of the season (including playoffs), but return fully healed: fragility −6 (overall −1).")}</div>
          </div>
          <div style="margin-top:12px; font-family:var(--font-label); font-size:12px; font-weight:700; color:var(--up); text-transform:uppercase;">
            ${tr("Rientro garantito a inizio prossima annata", "Guaranteed return at the start of next season")}
          </div>
        </button>

        <button type="button" class="im-card risky" data-inj-choice="conservative">
          <div>
            <div class="im-c-h">
              <span class="im-c-title">🧊 ${tr("Terapia Conservativa", "Conservative Therapy")}</span>
              <span class="im-c-badge red">${tr(`Rischio Ricaduta ${relapsePct}%`, `Relapse Risk ${relapsePct}%`)}</span>
            </div>
            <div class="im-c-desc">${last ? tr("Infiltrazioni e rientro per i playoff.", "Injections and rehab to return for the playoffs.") : tr("Salti metà del prossimo tratto e rientri subito in campo.", "Miss half of the next stretch and return to action right away.")} ${tr("Ma se ricadi: stagione finita, −3 overall e fisico indebolito.", "But if you relapse: season over, −3 overall, and weakened body.")}</div>
          </div>
          <div style="margin-top:12px; font-family:var(--font-label); font-size:12px; font-weight:700; color:var(--signal); text-transform:uppercase;">
            ${tr("Rientro anticipato ad alto rischio", "High-risk early return")}
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
  const lbl = seriousInjuryLabel(inj.label);
  titleEl.textContent = `🩹 ${lbl}`;
  subEl.textContent = tr(
    `Un infortunio serio in ${inj.block}. Lo staff medico ti lascia la scelta: ${last ? "i playoff sono vicini." : "la stagione è ancora lunga."}`,
    `A serious injury during ${inj.block}. The medical staff leaves the choice to you: ${last ? "the playoffs are near." : "the season is still long."}`
  );
  cards.innerHTML =
    offCardHtml({ idx: 0, icon: "🏥", title: tr("Operazione", "Surgery"), subtitle: tr("Stagione finita, playoff compresi", "Season over, playoffs included"),
      desc: tr("Salti tutto il resto della stagione, ma torni sano: fragilità −6 (overall −1).", "Miss the rest of the season, but return healthy: fragility −6 (overall −1)."), tags: [{ text: tr("Nessun rischio", "No risk"), tone: "green" }] }) +
    offCardHtml({ idx: 1, icon: "🧊", iconTone: "var(--accent-2)", title: tr("Terapia conservativa", "Conservative Therapy"), subtitle: last ? tr("Rientro per i playoff", "Return for playoffs") : tr("Rientro rapido", "Quick return"),
      desc: tr(
        `${last ? "Giochi i playoff" : "Salti metà del prossimo tratto"}, ma se ricadi perdi tutta la stagione, 3 punti di overall e il fisico si indebolisce.`,
        `${last ? "Play in the playoffs" : "Miss half of the next stretch"}, but if you relapse you lose the entire season, 3 overall points, and weaken your body.`
      ),
      tags: [{ text: tr(`Ricaduta ${relapsePct}%`, `Relapse ${relapsePct}%`), tone: "red" }] });
  cards.querySelector('[data-idx="0"]').addEventListener("click", () => resolveInjuryChoice("surgery"));
  cards.querySelector('[data-idx="1"]').addEventListener("click", () => resolveInjuryChoice("conservative"));

  // Apri automaticamente la modale del report medico
  renderInjuryModal(inj, last, relapsePct, (choice) => resolveInjuryChoice(choice));
}
