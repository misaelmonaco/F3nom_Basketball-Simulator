"use strict";

/* ================================================================
   GUIDA DI COACH MIKE T — il primo allenatore, in basso a destra con la nuvoletta del fumetto:
   - la prima volta che compare ogni tipo di decisione spiega in tre righe cos'è,
     cosa conta e cosa fare se hai dubbi, evidenziando il riquadro di cui parla.
     Non sceglie per te e non blocca niente;
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
  draft: ["Una squadra USA-1 ti ha scelto al Draft.",
    "Puoi firmare subito o restare nel tuo club: i diritti restano a loro per un anno.",
    "Se in USA-1 partiresti in fondo alle rotazioni, un anno in più dove giochi tanto non è tempo perso."],
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
  toast(guideOn() ? "Guida attiva: Coach Mike T ti spiegherà le decisioni nuove." : "Guida spenta. La riaccendi dal menu Altro.");
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

/* ---------- Coach Mike T: in basso a destra, con la nuvoletta del fumetto ---------- */
const COACH_NAME = "Coach Mike T";
/* Il ritratto del coach dentro la pagina (copia di assets/coach-mike-t.svg): nessun file da
   scaricare, così non resta mai il riquadro vuoto per una cache vecchia o una rete lenta */
const COACH_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><defs><clipPath id="cm-frame"><rect width="120" height="120"/></clipPath><linearGradient id="cm-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2330"/><stop offset="1" stop-color="#0f141c"/></linearGradient><clipPath id="cm-head"><ellipse cx="60" cy="47" rx="25" ry="29"/></clipPath><pattern id="cm-buzz" width="1.6" height="1.6" patternUnits="userSpaceOnUse"><circle cx=".8" cy=".8" r=".42" fill="#050506"/></pattern><linearGradient id="cm-knit" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1d4ed8"/><stop offset=".5" stop-color="#2563eb"/><stop offset="1" stop-color="#1d4ed8"/></linearGradient></defs><g clip-path="url(#cm-frame)"><rect width="120" height="120" fill="url(#cm-bg)"/><path d="M78 0 H120 V120 H52 Z" fill="#ff5a1f" opacity=".14"/><path d="M10 124 C12 98 32 88 60 88 C88 88 108 98 110 124 Z" fill="url(#cm-knit)"/><g stroke="#1e40af" stroke-width="1.2" opacity=".55"><path d="M30 102 L30 124"/><path d="M40 96 L40 124"/><path d="M50 93 L50 124"/><path d="M70 93 L70 124"/><path d="M80 96 L80 124"/><path d="M90 102 L90 124"/></g><path d="M42 72 Q60 64 78 72 L80 92 Q60 100 40 92 Z" fill="#2563eb"/><path d="M41 81 Q60 74 79 81" fill="none" stroke="#1e40af" stroke-width="1.8"/><g stroke="#1e40af" stroke-width="1" opacity=".6"><path d="M47 80 L46.5 94"/><path d="M53 78.5 L53 96"/><path d="M60 78 V97"/><path d="M67 78.5 L67 96"/><path d="M73 80 L73.5 94"/></g><rect x="50" y="62" width="20" height="14" rx="4" fill="#d19c76"/><ellipse cx="34.5" cy="50" rx="4.5" ry="6" fill="#d19c76"/><ellipse cx="85.5" cy="50" rx="4.5" ry="6" fill="#d19c76"/><ellipse cx="34.8" cy="50" rx="2" ry="3.2" fill="#b8815c"/><ellipse cx="85.2" cy="50" rx="2" ry="3.2" fill="#b8815c"/><ellipse cx="60" cy="47" rx="25" ry="29" fill="#deac86"/><g clip-path="url(#cm-head)"><path d="M30 40 C33 30 38 27 44 28 C50 26 55 30 60 29 C65 30 70 26 76 28 C82 27 87 30 90 40 L90 10 L30 10 Z" fill="#0b0b0d" opacity=".72"/><path d="M30 40 C33 30 38 27 44 28 C50 26 55 30 60 29 C65 30 70 26 76 28 C82 27 87 30 90 40 L90 10 L30 10 Z" fill="url(#cm-buzz)" opacity=".8"/></g><path d="M44 41 Q50 37.5 55 40" fill="none" stroke="#121214" stroke-width="2.6" stroke-linecap="round"/><path d="M65 40 Q70 37.5 76 41" fill="none" stroke="#121214" stroke-width="2.6" stroke-linecap="round"/><ellipse cx="50" cy="47" rx="3.4" ry="2.6" fill="#fff"/><ellipse cx="70" cy="47" rx="3.4" ry="2.6" fill="#fff"/><circle cx="50.4" cy="47.2" r="1.9" fill="#3b2418"/><circle cx="70.4" cy="47.2" r="1.9" fill="#3b2418"/><circle cx="51" cy="46.5" r=".6" fill="#fff"/><circle cx="71" cy="46.5" r=".6" fill="#fff"/><path d="M45.5 51.5 Q50 53.5 54.5 51.5" fill="none" stroke="#bf8a65" stroke-width="1"/><path d="M65.5 51.5 Q70 53.5 74.5 51.5" fill="none" stroke="#bf8a65" stroke-width="1"/><path d="M58.5 49 Q57 54 56.5 56.5" fill="none" stroke="#bf8a65" stroke-width="1.2" stroke-linecap="round"/><path d="M55.5 57.5 Q57.5 59.5 60 58.6 Q62.5 59.5 64.5 57.5" fill="none" stroke="#9c6a4a" stroke-width="1.4" stroke-linecap="round"/><path d="M49.5 63 Q51 64.5 51 64" fill="none" stroke="#5a3526" stroke-width="1.2" stroke-linecap="round"/><path d="M70.5 63 Q69 64.5 69 64" fill="none" stroke="#5a3526" stroke-width="1.2" stroke-linecap="round"/><path d="M51 64 Q60 70.5 69 64" fill="none" stroke="#3a2219" stroke-width="2" stroke-linecap="round"/></g></svg>`;
let coachKey = null; // cosa sta spiegando adesso (una decisione o una tappa del giro)

function coachBox() {
  let box = document.getElementById("coach");
  if (box && box.classList) return box;
  box = document.createElement("div");
  box.id = "coach";
  box.className = "coach hidden";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-label", COACH_NAME);
  box.innerHTML = `
    <div class="coach__bubble">
      <div class="coach__name"></div>
      <div class="coach__body"></div>
      <div class="coach__actions"></div>
    </div>
    <div class="coach__img" role="img" aria-label="${COACH_NAME}">${COACH_SVG}</div>`;
  document.body.appendChild(box);
  return box;
}
/* Il coach parla: testo, pulsanti e (se c'è) il riquadro della pagina da evidenziare */
function showCoach(key, title, bodyHtml, actions, spot) {
  if (typeof HTMLElement === "undefined") return; // fuori dal browser (simulatore e test) il coach tace
  const box = coachBox();
  coachKey = key;
  box.querySelector(".coach__name").textContent = title;
  box.querySelector(".coach__body").innerHTML = bodyHtml;
  box.querySelector(".coach__actions").innerHTML = actions.map(a => `<button type="button" class="btn ${a.primary ? "btn-primary" : "btn-ghost"} btn-sm" id="${a.id}">${a.label}</button>`).join("");
  actions.forEach(a => document.getElementById(a.id).addEventListener("click", a.onClick));
  // sopra la barra d'azione della dashboard, così non la copre
  const bar = document.getElementById("action-bar");
  const onDashboard = !el("screen-game").classList.contains("hidden");
  box.style.setProperty("--coach-bottom", `${onDashboard && bar ? bar.offsetHeight + 28 : 16}px`);
  box.classList.remove("hidden");
  document.body.classList.add("coach-open"); // spazio in fondo alla pagina: il riquadro può salire sopra la nuvoletta
  setGuideSpot(spot);
}
function hideCoach() {
  coachKey = null;
  const box = document.getElementById("coach");
  if (box && box.classList) box.classList.add("hidden");
  if (document.body && document.body.classList) document.body.classList.remove("coach-open");
  setGuideSpot(null);
}
function setGuideSpot(target) {
  document.querySelectorAll(".guide-spot").forEach(x => x.classList.remove("guide-spot"));
  if (!target) return;
  target.classList.add("guide-spot");
  // il riquadro in alto, così la nuvoletta in basso non lo copre (dopo che la schermata nuova è
  // tornata in cima da sola, vedi renderGameScreen)
  setTimeout(() => {
    if (!target.classList.contains("guide-spot")) return;
    window.scrollTo(0, Math.max(0, target.getBoundingClientRect().top + window.scrollY - 24));
  }, 30);
}

/* Il riquadro della schermata di cui parla il coach */
const GUIDE_SPOTS = {
  keyGame: ".clutch-box", situation: "#off-extra .sb-situation", seasonBlock: "#off-extra .sb-workload",
  negotiate: "#off-cards .neg-side", market: "#off-cards", postseason: "#off-extra",
};
function guideSpotFor(key) {
  const sel = GUIDE_SPOTS[key];
  const target = sel && document.querySelector(sel);
  if (target) return target;
  const cards = el("off-cards");
  return cards && cards.children && cards.children.length ? cards : el("off-extra");
}

/* La prima volta di ogni decisione, Coach Mike T spiega cos'è, cosa conta e cosa fare nel dubbio */
function renderGuideCard(d) {
  if (tourStep >= 0) return; // il giro della dashboard ha la precedenza
  const key = guideKeyFor(d);
  const st = guideState();
  if (key && key === coachKey) { setGuideSpot(guideSpotFor(key)); return; } // stessa decisione ridisegnata: resta
  if (!key || !st.on || st.seen[key]) { hideCoach(); return; }
  const [what, matters, hint] = GUIDE_TEXTS[key];
  markGuideSeen(key); // basta vederla una volta: anche decidendo subito, non torna
  showCoach(key, COACH_NAME, `
    <dl class="coach__lines">
      <div><dt>Cos'è</dt><dd>${what}</dd></div>
      <div><dt>Cosa conta</dt><dd>${matters}</dd></div>
      <div><dt>Se hai dubbi</dt><dd>${hint}</dd></div>
    </dl>`, [
    { id: "guide-ok", label: "Ho capito", primary: true, onClick: hideCoach },
    { id: "guide-glossary", label: "Glossario", onClick: openGlossary },
    { id: "guide-off", label: "Non mostrare più la guida", onClick: () => { setGuideOn(false); hideCoach(); toast("Guida spenta. La riaccendi dal menu Altro."); } },
  ], guideSpotFor(key));
}

/* ---------- giro della dashboard, alla prima apertura ---------- */
let tourStep = -1;
function maybeStartDashboardTour() {
  if (typeof HTMLElement === "undefined" || tourStep >= 0) return;
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
  hideCoach();
}
function showTourStep() {
  const step = TOUR_STEPS[tourStep];
  const target = step && document.querySelector(step.target);
  if (!target || el("screen-game").classList.contains("hidden")) { endTour(); return; }
  const last = tourStep === TOUR_STEPS.length - 1;
  showCoach(`tour${tourStep}`, `${COACH_NAME} · ${tourStep + 1}/${TOUR_STEPS.length}`, `<p class="coach__text"></p>`, [
    { id: "tour-next", label: last ? "Ho capito" : "Avanti", primary: true, onClick: () => { tourStep++; if (tourStep >= TOUR_STEPS.length) endTour(); else showTourStep(); } },
    ...(last ? [] : [{ id: "tour-skip", label: "Salta il giro", onClick: endTour }]),
  ], target);
  document.querySelector("#coach .coach__text").textContent = step.text;
}

/* ---------- glossario: tutte le spiegazioni delle "?" ---------- */
function openGlossary() {
  const entries = Object.entries(HELP_TEXTS).map(([k, text]) => [HELP_LABELS[k] || k, text]).sort((a, b) => a[0].localeCompare(b[0], "it"));
  openInfoDialog("Glossario", `<dl class="glossary">${entries.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>`);
}
