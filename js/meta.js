"use strict";

/* ================================================================
   VERSIONE, NOVITÀ E PARERI — il piè di pagina comune a tutte le schermate:
   chi ha fatto il gioco, la versione (con le novità) e il pulsante per
   mandare un parere durante il beta test.
   ================================================================ */
const GAME_VERSION = "0.13.0";
const GAME_CHANNEL = "beta";
/* Il modulo del beta test (Google Moduli, Tally...): finché è vuoto, "Invia un parere"
   prepara solo il resoconto da copiare */
const FEEDBACK_URL = "";

const CHANGELOG = [
  { version: "0.13.0", date: "2026-10-20", items: [
    "Trilogia di Minigiochi Clutch: ogni scelta decisiva ha ora la sua meccanica di gioco dedicata, influenzata dai tuoi attributi reali e con opzione di simulazione rapida:",
    "• Shot Meter (Tiro io): barra oscillante con Green Release per i tiri in sospensione e dall'arco",
    "• Timing Circle (Attacco il ferro): cerchio dinamico convergente per schiacciare o appoggiare a canestro con il tempismo perfetto",
    "• Court Vision (Scarico al compagno): mini-lavagna tattica 2D sul parquet dove individuare e servire il compagno smarcato prima del raddoppio",
    "Minigiochi attivi sia nelle Partite Chiave di stagione regolare che nei finali punto a punto dei Playoff",
    "Investimenti estivi ottimizzati: schermata \"Come investi l'estate?\" riorganizzata su griglia 3x2 con costi percentuali e badge espliciti; rimossa la duplicazione dello shop Lifestyle",
    "Fix modale clutch Playoff: risolto un blocco nell'ultimo possesso della postseason che impediva di visualizzare l'esito della gara e avanzare nella serie",
  ] },
  { version: "0.12.0", date: "2026-10-20", items: [
    "Modulo Lifestyle: gestione completa delle relazioni con Allenatore, Spogliatoio, Tifosi e Stampa con indicatori dinamici",
    "Vita sentimentale: fidanzata/partner con eventi dedicati, uscite, regali e gestione della vita privata da single o in coppia",
    "Dilemmi morali: 13 nuove situazioni etiche e personali (stile New Star Soccer) che influenzano chimica, fiducia e popolarità",
    "Lifestyle Shop sempre accessibile: acquisti di veicoli, immobili, staff personale (preparatore, chef) ed extra di lusso disponibili in ogni momento dell'anno",
    "Reset coerente delle relazioni al cambio squadra: arrivando in una nuova squadra coach, spogliatoio e tifosi si riallineano realisticamente al tuo status",
    "Risoluzione clutch immediata: esito drammatico e punteggio finale in tempo reale sulla sirena per le partite chiave, con scelte definitive e non modificabili",
    "Riepilogo stagione rinnovato: selettore a schede per alternare Copertina Rivista e Scheda Statistiche senza duplicazioni",
    "Dashboard e navigazione rifinite: \"Il tuo sogno\" e \"Obiettivi della stagione\" spostati in Panoramica; \"Traguardi\" accessibile dal menu Altro",
  ] },
  { version: "0.11.0", date: "2026-10-16", items: [
    "Nuovo Menu Principale con lavagna tattica da arena sullo sfondo, riepilogo compatto delle carriere salvate e avvio rapido di Scenari o Nuova Carriera",
    "Social Media (\"CourtX\"): gestisci il profilo social del tuo giocatore, pubblica post, rispondi a tifosi, giornalisti e hater e monitora il consenso del pubblico",
    "Conferenze stampa interattive: rispondi alle domande dei cronisti durante la stagione e nei momenti chiave, influenzando spogliatoio, tifosi e fama",
    "Buyout sempre disponibile: possibilità di esercitare l'uscita dal contratto in qualsiasi fase della stagione",
    "Animazione della coppa estesa anche alla vittoria delle Coppe Nazionali",
  ] },
  { version: "0.10.0", date: "2026-10-01", items: [
    "Scenari: sette carriere con partenza fissata e un obiettivo preciso, da sbloccare una dopo l'altra",
    "Se l'obiettivo sfuma la carriera finisce e puoi riprovare; se lo raggiungi scegli se continuare o chiudere lì",
    "Statistiche più realistiche: un fuoriclasse in USA-1 segna sui 25-30 punti, niente più stagioni da 40 punti, 12 rimbalzi e 12 assist",
    "Il ritratto di Coach Mike T si vede sempre, anche con la rete lenta o una versione vecchia in memoria",
  ] },
  { version: "0.9.0", date: "2026-09-30", items: [
    "Nuovo nome e nuovo logo: F3NOM bball",
    "Difficoltà ribilanciate e voto finale che tiene conto del livello scelto",
    "Campionati, squadre e coppe con nomi di fantasia; ITA-3 su due gironi",
    "La canotta della tua squadra, con il numero, in cima alla pagina",
    "Weekend delle stelle a metà stagione: gara del tiro da tre, delle schiacciate e partita delle giovani promesse",
    "Scadenza del mercato NBA: una squadra può volerti subito, a stagione in corso",
    "20 nuovi imprevisti estivi, alcuni con un seguito l'estate dopo",
    "Opzione \"Decido solo i momenti importanti\": la routine va avanti da sola",
    "Coach Mike T, il tuo primo allenatore: un consiglio alla prima volta di ogni decisione, il giro della dashboard e il glossario",
    "Piè di pagina con versione, novità, \"Invia un parere\" e Ko-fi",
  ] },
  { version: "0.8.0", date: "2026-09-27", items: [
    "Nuova scheda Panoramica nella dashboard, con avvisi e variazioni",
    "\"Sorprendimi\": un giocatore creato a caso in un clic",
    "Menu \"Altro\" nella barra d'azione, dashboard più comoda su telefono",
  ] },
  { version: "0.7.0", date: "2026-09-26", items: [
    "Coppia di stelle: da Stella puoi chiedere un altro campione",
    "Offerta lampo sul mercato",
    "Carriere più lunghe: il calo arriva a 32-33 anni, più tardi per Stelle e Leggende",
    "Stipendi realistici nelle serie minori",
  ] },
  { version: "0.6.0", date: "2026-09-25", items: [
    "Nuova identità grafica, con tema scuro e chiaro",
    "Creazione del giocatore rinnovata: archetipi, fisico, carattere, percorsi",
    "Mercato a schede con campionati per nazione e coppe europee",
  ] },
];

/* Ultimo errore JavaScript, da allegare al parere */
let lastRuntimeError = null;
if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
  window.addEventListener("error", e => { lastRuntimeError = `${e.message} (${(e.filename || "").split("/").pop()}:${e.lineno})`; });
  window.addEventListener("unhandledrejection", e => { lastRuntimeError = String(e.reason); });
}

/* ---------- finestra informativa riutilizzabile ---------- */
function openInfoDialog(title, bodyHtml) {
  const box = el("info-dialog");
  el("info-dialog-title").textContent = title;
  el("info-dialog-body").innerHTML = bodyHtml;
  box.classList.remove("hidden");
  el("info-dialog-close").focus();
}
function closeInfoDialog() { el("info-dialog").classList.add("hidden"); }

function openChangelog() {
  openInfoDialog(`Novità · versione ${GAME_VERSION} ${GAME_CHANNEL}`, CHANGELOG.map(c => `
    <section class="cl-entry">
      <div class="cl-head"><span class="cl-version">${c.version}</span><span class="small-muted">${new Date(c.date).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}</span></div>
      <ul class="cl-list">${c.items.map(x => `<li>${x}</li>`).join("")}</ul>
    </section>`).join(""));
}

/* Il resoconto per chi raccoglie i pareri: versione, browser, schermo e, se c'è, la carriera */
function feedbackReport() {
  const lines = [
    `Versione: ${GAME_VERSION} ${GAME_CHANNEL}`,
    `Data: ${new Date().toLocaleString("it-IT")}`,
    `Browser: ${navigator.userAgent}`,
    `Schermo: ${window.innerWidth}×${window.innerHeight}`,
    `Tema: ${typeof themePreference === "function" ? themePreference() : "?"}`,
  ];
  if (player) lines.push(`Carriera: ${player.age} anni, ${LEAGUES[player.league].name}, ${player.history.length} stagioni, overall ${player.overall}, difficoltà ${getDifficulty(player).label}`);
  if (player && player.pendingDecision) lines.push(`Schermata: ${player.pendingDecision.type}`);
  if (lastRuntimeError) lines.push(`Ultimo errore: ${lastRuntimeError}`);
  return lines.join("\n");
}
function openFeedback() {
  const report = feedbackReport();
  openInfoDialog("Invia un parere", `
    <p>Grazie per provare il gioco! ${FEEDBACK_URL ? "Il modulo si apre in una nuova scheda: incolla queste righe nell'ultima domanda, ci aiutano a capire cosa è successo." : "Copia queste righe e mandale insieme al tuo parere: ci aiutano a capire cosa è successo."}</p>
    <textarea class="fb-report" id="fb-report" readonly rows="7"></textarea>
    <div class="btn-row">
      <button type="button" class="btn btn-secondary" id="fb-copy">Copia il resoconto</button>
      ${FEEDBACK_URL ? `<button type="button" class="btn btn-primary" id="fb-open">Apri il modulo</button>` : ""}
    </div>
    <p class="small-muted">Se il gioco si è bloccato, allega anche il file della carriera: Altro → Esporta la carriera.</p>`);
  el("fb-report").value = report;
  el("fb-copy").addEventListener("click", () => {
    const done = () => toast("Resoconto copiato.");
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(report).then(done, () => { el("fb-report").select(); document.execCommand("copy"); done(); });
    else { el("fb-report").select(); document.execCommand("copy"); done(); }
  });
  if (FEEDBACK_URL) el("fb-open").addEventListener("click", () => window.open(FEEDBACK_URL, "_blank", "noopener"));
}

function initSiteFooter() {
  el("footer-version").textContent = `v${GAME_VERSION} ${GAME_CHANNEL}`;
  el("footer-changelog").addEventListener("click", openChangelog);
  el("footer-feedback").addEventListener("click", openFeedback);
  el("info-dialog-close").addEventListener("click", closeInfoDialog);
  el("info-dialog").addEventListener("click", evt => { if (evt.target === el("info-dialog")) closeInfoDialog(); });
  document.addEventListener("keydown", evt => { if (evt.key === "Escape") closeInfoDialog(); });
}
