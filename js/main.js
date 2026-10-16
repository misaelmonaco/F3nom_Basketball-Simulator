"use strict";

/* ================================================================
   EVENT WIRING
   ================================================================ */
function switchGameTab(tab) {
  document.querySelectorAll("#game-tabs .tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.toggle("active", p.dataset.tabPanel === tab));
  if (tab === "social" && typeof player !== "undefined" && player && player.social) {
    player.social.unread = 0;
    if (typeof renderSocialTab === "function") renderSocialTab();
  }
}

/* Tastiera: le card cliccabili che non sono <button> (role="button") si attivano anche con
   Invio e Spazio, come un pulsante vero. */
document.addEventListener("keydown", evt => {
  if (evt.key !== "Enter" && evt.key !== " ") return;
  const target = evt.target;
  if (!(target instanceof Element) || target.getAttribute("role") !== "button" || target.tagName === "BUTTON") return;
  evt.preventDefault();
  target.dispatchEvent(new MouseEvent("click", { bubbles: true }));
});

document.addEventListener("DOMContentLoaded", () => {
  initHelpTips();
  initSiteFooter(); // versione, novità, pareri (vedi meta.js)
  initCreationScreen();
  renderWizard();
  migrateLegacySaveSlot();
  renderSavedCareerCard();
  el("inp-import-save").addEventListener("change", evt => {
    importCareerFile(evt.target.files[0]);
    evt.target.value = "";
  });
  document.querySelectorAll("#game-tabs .tab-btn").forEach(b => b.addEventListener("click", () => switchGameTab(b.dataset.tab)));
  // interruttore dei suoni (in più punti della pagina)
  document.addEventListener("click", evt => {
    if (evt.target instanceof Element && evt.target.closest("[data-sound-toggle]")) toggleSound();
    if (evt.target instanceof Element && evt.target.closest("[data-theme-toggle]")) cycleTheme();
  });
  updateSoundButtons();
  applyTheme();
  watchSystemTheme();
  initBroadcastUi(); // niente emoji nell'interfaccia (vedi js/broadcast.js)
  el("btn-open-achievements").addEventListener("click", () => {
    renderAchievementsPage("achievements-global", "global");
    el("screen-create").classList.add("hidden");
    el("screen-achievements").classList.remove("hidden");
    window.scrollTo(0, 0);
  });
  el("btn-open-scenarios").addEventListener("click", openScenariosScreen);
  el("btn-close-scenarios").addEventListener("click", closeScenariosScreen);
  el("btn-close-achievements").addEventListener("click", () => {
    el("screen-achievements").classList.add("hidden");
    el("screen-create").classList.remove("hidden");
  });
  el("btn-peek-dashboard").addEventListener("click", () => { uiPeek = true; renderGameScreen(); window.scrollTo(0, 0); });
  el("btn-trophy-close").addEventListener("click", hideTrophyAnimation);
  el("trophy-overlay").addEventListener("click", (e) => { if (e.target.id === "trophy-overlay") hideTrophyAnimation(); });
  el("btn-new-career").addEventListener("click", () => {
    resetToCreation();
    renderWizard();
    renderSavedCareerCard();
  });
  el("btn-legacy-career").addEventListener("click", startLegacyCareer);
  el("btn-share-career").addEventListener("click", shareCareerImage);
});

/* Torna alla creazione di una nuova carriera, con la procedura azzerata. La carriera
   conclusa resta nel suo slot (si può rivedere o eliminare dalla schermata iniziale). */
function resetToCreation() {
  player = null;
  newCareerSlot = null;
  pendingLegacy = null;
  resetTeamStrengths();
  pendingCreation = null;
  standingsViewConference = null;
  selRole = null; selArchetypeId = null; selPath = null;
  selScenario = null; scenarioSetup = null;
  customMode = false; el("inp-custom-mode").checked = false; el("card-custom-ratings").classList.add("hidden");
  document.querySelectorAll(".choice-card.selected, .court-pos.selected").forEach(c=>c.classList.remove("selected"));
  el("inp-firstname").value = ""; el("inp-lastname").value = "";
  renderArchetypeGrid(null);
  resetCreationIdentity();
  selDifficulty = "normal"; renderDifficultyGrid();
  popupQueue = []; popupActive = false;
  if (el("clutch-overlay")) el("clutch-overlay").classList.add("hidden");
  if (el("press-overlay")) el("press-overlay").classList.add("hidden");
  if (el("injury-overlay")) el("injury-overlay").classList.add("hidden");
  el("trophy-overlay").classList.add("hidden");
  el("trophy-confetti").innerHTML = "";
  el("screen-onboarding").classList.add("hidden");
  el("screen-final").classList.add("hidden");
  el("screen-scenarios").classList.add("hidden");
  el("screen-offseason").classList.add("hidden");
  el("screen-create").classList.remove("hidden");
  createWizardOpen = false;
  wizardStep = 1;
}
