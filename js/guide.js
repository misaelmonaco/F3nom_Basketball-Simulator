"use strict";

/* ================================================================
   GUIDA DEL PRIMO ALLENATORE — i primi minuti di gioco:
   - la prima volta che compare ogni tipo di decisione, in cima alla schermata
     "momento", il tuo primo allenatore spiega in tre righe cos'è, cosa conta e
     cosa fare se hai dubbi. Non sceglie per te e non blocca niente;
   - alla prima apertura della dashboard, un giro in quattro tappe;
   - il glossario con tutte le spiegazioni delle "?".
   Cosa è già stato visto vale per tutte le carriere (è salvato nel browser).
   ================================================================ */
const GUIDE_KEY = "chosenOne.guide";

const GUIDE_TEXTS = {
  careerGoal: ["Prima di cominciare scegli il tuo sogno: il traguardo che darà una direzione a tutta la carriera.",
    "Non cambia come giochi, ma se lo realizzi ti porta reputazione, popolarità e punti GOAT.",
    "Alle prime armi? Prendine uno con la scadenza lontana."],
  seasonFocus: ["Ogni tanto, prima della stagione, puoi scegliere su cosa lavorare.",
    "Il focus alza gli attributi collegati e, con il tempo, può cambiare il tuo stile di gioco.",
    "Scegli quello che rinforza il tuo archetipo."],
  roleBattle: ["La società ha preso un concorrente nel tuo ruolo: al training camp ci si gioca il posto.",
    "Chi perde parte dalla panchina, finché non se lo riprende sul campo.",
    "Se sei più forte di lui, accetta la sfida a viso aperto."],
  seasonBlock: ["La stagione regolare è divisa in tre tratti: per ognuno scegli il carico di lavoro.",
    "Più carico vuol dire più minuti e statistiche, ma la stamina cala e il rischio di infortuni sale.",
    "Sopra 70 di stamina puoi spingere, sotto 45 conviene rallentare. Se preferisci, attiva \"Decido solo i momenti importanti\" e i tratti tranquilli li gestisco io."],
  keyGame: ["Partita chiave: l'ultimo possesso lo decidi tu.",
    "Ogni azione ha la sua percentuale di riuscita, calcolata sui tuoi attributi e sulla difesa.",
    "Nel dubbio, scegli l'azione con la percentuale più alta."],
  situation: ["Durante il tratto succede qualcosa fuori dal copione.",
    "Prima scegli come reagire, poi il carico di lavoro.",
    "La risposta più prudente di solito non fa danni."],
  injuryChoice: ["Ti sei fatto male sul serio.",
    "L'operazione ti tiene fuori più a lungo ma riduce le ricadute; la terapia conservativa ti rimette prima in campo, con qualche rischio in più.",
    "Da giovane conviene curarsi bene: la carriera è lunga."],
  postseason: ["I playoff: si gioca un turno alla volta.",
    "Nelle partite punto a punto l'ultimo possesso lo scegli tu.",
    "Qui conta quello che hai costruito: stamina alta e fiducia del coach fanno la differenza."],
  allStarWeekend: ["Il weekend delle stelle: ti hanno invitato alle gare di metà stagione.",
    "Vincere porta popolarità; riposare ti dà stamina per la volata finale.",
    "Se la stamina è bassa, riposa. Altrimenti divertiti."],
  tradeDeadline: ["La scadenza del mercato: un'altra squadra ti vuole subito.",
    "Cambi maglia a stagione in corso: chimica, fiducia del coach e intesa con la stella ripartono da capo.",
    "Una pretendente al titolo vale quasi sempre il salto."],
  seasonRecap: ["Il resoconto: com'è andata la stagione.",
    "Puoi rispondere ai giornalisti: il tono cambia popolarità e rapporto con lo spogliatoio.",
    "Una risposta equilibrata non sbaglia mai."],
  offseasonChoice: ["Un imprevisto d'estate: puoi rischiare o lasciar perdere.",
    "La percentuale è la probabilità che vada bene: se va male, qualcosa lo perdi.",
    "Sopra il 60% di solito conviene provarci."],
  training: ["L'allenamento estivo: hai dei punti da assegnare.",
    "Vanno agli attributi o al recupero fisico. Più sei giovane, più rendono.",
    "Rinforza i punti forti del tuo archetipo; se la stamina è bassa, metti qualcosa nel recupero."],
  summerSpending: ["Come usi i soldi quest'estate.",
    "Alcune spese aiutano fisico o morale; gli investimenti possono rendere o andare male.",
    "All'inizio non spendere: il patrimonio ti servirà."],
  sponsorOffer: ["Uno sponsor ti vuole.",
    "Paga ogni anno, ma solo se rispetti la condizione del contratto.",
    "Scegli la condizione che sei sicuro di rispettare."],
  agentChoice: ["A 18 anni scegli chi ti rappresenta.",
    "L'agente trattiene una percentuale, ma porta offerte migliori, più sponsor o più pazienza nelle trattative.",
    "Se pensi di cambiare spesso squadra, prendine uno forte nelle trattative."],
  market: ["Il mercato: ogni estate le squadre ti fanno le loro offerte.",
    "Guarda il ruolo che ti offrono: da Stella giochi tanto, da Comprimario cresci meno. In alto cambi campionato o guardi le squadre delle coppe europee.",
    "Per ora prendi la squadra dove avrai più minuti."],
  negotiate: ["La trattativa: puoi chiedere più anni, più soldi, un ruolo migliore o delle clausole.",
    "Ogni richiesta ha una probabilità. Se ti dicono no la pazienza della dirigenza cala, e a zero l'offerta salta.",
    "Chiedi una cosa sola, quella con la percentuale più alta, poi firma."],
  draftCombine: ["Il Draft NBA: le squadre scelgono i giovani migliori.",
    "Al combine e al provino fai vedere cosa sai fare: più salgono le quotazioni, più alta è la chiamata.",
    "Punta sul tuo pezzo forte."],
  draft: ["Una squadra NBA ti ha scelto al Draft.",
    "Puoi firmare subito o restare nel tuo club: i diritti restano a loro per un anno.",
    "Se in NBA partiresti in fondo alle rotazioni, un anno in più dove giochi tanto non è tempo perso."],
  offseasonStatus: ["Il punto prima della nuova stagione: contratto, squadra e ruolo.",
    "Qui puoi rinnovare, uscire dal contratto se non hanno mantenuto le promesse o, da Stella, chiedere un altro campione.",
    "Se è tutto a posto, vai avanti."],
  playerOption: ["Il tuo contratto ha un'opzione: decidi tu se restare un altro anno.",
    "Se la eserciti, resti alle stesse condizioni; se la rifiuti, vai sul mercato.",
    "Se stai crescendo tanto, il mercato di solito paga di più."],
  lifeEvent: ["Fuori dal campo succedono cose importanti anche a te.",
    "Le scelte di vita privata pesano su morale e patrimonio.",
    "Qui non c'è una risposta giusta: scegli quello che senti."],
  mentorOffer: ["Un ragazzo più giovane vorrebbe crescere seguendo te.",
    "Fargli da mentore ti toglie un po' di minuti, ma porta reputazione e chimica.",
    "Da veterano conviene quasi sempre dire sì."],
  duoRequest: ["Da Stella puoi chiedere alla dirigenza un altro campione.",
    "Se dicono sì la squadra diventa più forte; se dicono no, per due anni non puoi richiederlo.",
    "Più sei importante per il club, più è facile che ti ascoltino."],
};

const TOUR_STEPS = [
  { target: "#g-head-stats", text: "Qui in alto trovi il tuo livello (OVR), fin dove puoi arrivare (POT) e il punteggio di carriera (GOAT)." },
  { target: "#ov-hero", text: "La Panoramica ti dice come stai andando adesso. I numeri verdi e rossi mostrano cosa è cambiato dall'inizio della stagione." },
  { target: "#game-tabs", text: "Le altre schede sono da consultare: carriera, statistiche, trofei. Le scelte arrivano da sole, a tutto schermo." },
  { target: "#action-bar", text: "Qui c'è sempre il prossimo passo: è l'unico pulsante che devi premere. In \"Altro\" trovi il glossario, la guida e le impostazioni." },
];

/* ---------- memoria della guida (nel browser, per tutte le carriere) ---------- */
function guideState() {
  try { const s = JSON.parse(localStorage.getItem(GUIDE_KEY)); if (s && typeof s === "object") return { on: s.on !== false, seen: s.seen || {} }; } catch (e) { /* niente memoria: si riparte */ }
  return { on: true, seen: {} };
}
function saveGuideState(s) { try { localStorage.setItem(GUIDE_KEY, JSON.stringify(s)); } catch (e) { /* memoria non disponibile */ } }
function guideOn() { return guideState().on; }
function markGuideSeen(key) { const s = guideState(); s.seen[key] = true; saveGuideState(s); }
function setGuideOn(on) { const s = guideState(); s.on = on; saveGuideState(s); }
function resetGuide() { saveGuideState({ on: true, seen: {} }); }

function toggleGuide() {
  setGuideOn(!guideOn());
  toast(guideOn() ? "Guida attiva: il tuo primo allenatore ti spiegherà le decisioni nuove." : "Guida spenta. La riaccendi dal menu Altro.");
  if (player) renderGameScreen();
}
function restartGuide() {
  resetGuide();
  toast("La guida ripartirà da capo, dalla prossima decisione.");
  if (player) renderGameScreen();
}

/* Quale spiegazione serve per questa decisione (una partita chiave è diversa da un tratto qualunque) */
function guideKeyFor(d) {
  if (!d) return null;
  if (d.type === "seasonBlock") return d.keyGame ? "keyGame" : d.situation ? "situation" : "seasonBlock";
  if (d.type === "offseasonReveal" || d.type === "nationalReveal") return null;
  return GUIDE_TEXTS[d.type] ? d.type : null;
}

/* La scheda del primo allenatore, in cima alla schermata "momento" */
function renderGuideCard(d) {
  const box = el("off-guide");
  if (!box) return;
  const key = guideKeyFor(d);
  const st = guideState();
  if (!key || !st.on || st.seen[key]) { box.innerHTML = ""; return; }
  const [what, matters, hint] = GUIDE_TEXTS[key];
  box.innerHTML = `
    <aside class="guide-card" aria-label="Il consiglio del tuo primo allenatore">
      <div class="guide-card__who"><span class="guide-card__mono" aria-hidden="true">PA</span>Il tuo primo allenatore</div>
      <dl class="guide-card__lines">
        <div><dt>Cos'è</dt><dd>${what}</dd></div>
        <div><dt>Cosa conta</dt><dd>${matters}</dd></div>
        <div><dt>Se hai dubbi</dt><dd>${hint}</dd></div>
      </dl>
      <div class="guide-card__actions">
        <button type="button" class="btn btn-secondary btn-sm" id="guide-ok">Ho capito</button>
        <button type="button" class="btn btn-ghost btn-sm" id="guide-glossary">Glossario</button>
        <button type="button" class="btn btn-ghost btn-sm" id="guide-off">Non mostrare più la guida</button>
      </div>
    </aside>`;
  // basta vederla una volta: anche decidendo subito, non torna
  markGuideSeen(key);
  el("guide-ok").addEventListener("click", () => { box.innerHTML = ""; });
  el("guide-glossary").addEventListener("click", openGlossary);
  el("guide-off").addEventListener("click", () => { setGuideOn(false); box.innerHTML = ""; toast("Guida spenta. La riaccendi dal menu Altro."); });
}

/* ---------- giro della dashboard, alla prima apertura ---------- */
let tourStep = -1;
function maybeStartDashboardTour() {
  if (typeof document.createElement !== "function" || tourStep >= 0) return;
  const st = guideState();
  if (!st.on || st.seen.dashboardTour) return;
  const panel = document.querySelector('[data-tab-panel="panoramica"]');
  if (!panel || !panel.classList.contains("active") || el("screen-game").classList.contains("hidden")) return;
  markGuideSeen("dashboardTour");
  tourStep = 0;
  // si parte quando la pagina ha finito di muoversi (cambi di schermata, messaggi)
  setTimeout(showTourStep, 600);
}
function endTour() {
  tourStep = -1;
  document.querySelectorAll(".guide-spot").forEach(x => x.classList.remove("guide-spot"));
  const b = document.getElementById("guide-tour");
  if (b) b.remove();
}
function showTourStep() {
  document.querySelectorAll(".guide-spot").forEach(x => x.classList.remove("guide-spot"));
  const step = TOUR_STEPS[tourStep];
  const target = step && document.querySelector(step.target);
  if (!target) { endTour(); return; }
  target.classList.add("guide-spot");
  target.scrollIntoView({ block: "center" });
  let bubble = document.getElementById("guide-tour");
  if (!bubble) {
    bubble = document.createElement("div");
    bubble.id = "guide-tour";
    bubble.className = "guide-tour";
    bubble.setAttribute("role", "dialog");
    bubble.setAttribute("aria-label", "Giro della dashboard");
    document.body.appendChild(bubble);
  }
  const last = tourStep === TOUR_STEPS.length - 1;
  bubble.innerHTML = `
    <div class="guide-card__who"><span class="guide-card__mono" aria-hidden="true">PA</span>Il tuo primo allenatore · ${tourStep + 1}/${TOUR_STEPS.length}</div>
    <p class="guide-tour__text"></p>
    <div class="guide-card__actions">
      <button type="button" class="btn btn-primary btn-sm" id="tour-next">${last ? "Ho capito" : "Avanti"}</button>
      ${last ? "" : `<button type="button" class="btn btn-ghost btn-sm" id="tour-skip">Salta il giro</button>`}
    </div>`;
  bubble.querySelector(".guide-tour__text").textContent = step.text;
  document.getElementById("tour-next").addEventListener("click", () => { tourStep++; if (tourStep >= TOUR_STEPS.length) endTour(); else showTourStep(); });
  const skip = document.getElementById("tour-skip");
  if (skip) skip.addEventListener("click", endTour);
  // la nuvoletta sotto l'elemento, o sopra se non c'è spazio (in coordinate della pagina)
  const r = target.getBoundingClientRect();
  const h = bubble.offsetHeight, w = bubble.offsetWidth;
  const below = r.bottom + 12 + h < window.innerHeight;
  bubble.style.top = `${Math.max(8, (below ? r.bottom + 12 : r.top - h - 12) + window.scrollY)}px`;
  bubble.style.left = `${clamp(r.left + window.scrollX, 8, document.documentElement.clientWidth - w - 8)}px`;
}

/* ---------- glossario: tutte le spiegazioni delle "?" ---------- */
function openGlossary() {
  const entries = Object.entries(HELP_TEXTS).map(([k, text]) => [HELP_LABELS[k] || k, text]).sort((a, b) => a[0].localeCompare(b[0], "it"));
  openInfoDialog("Glossario", `<dl class="glossary">${entries.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>`);
}
