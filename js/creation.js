"use strict";

/* ================================================================
   SCREEN 1 — CREATION LOGIC
   ================================================================ */
let selRole = null, selArchetypeId = null, selPath = null;
let selDifficulty = "normal";
let customMode = false; // modalità personalizzata: squadra libera + overall/potenziale a scelta
let pendingCreation = null; // dati raccolti nella creazione, in attesa di squadra/maglia

function renderArchetypeGrid(role) {
  const archGrid = el("grid-archetype");
  const hint = el("archetype-hint");
  if (!role) {
    archGrid.innerHTML = "";
    hint.classList.remove("hidden");
    return;
  }
  hint.classList.add("hidden");
  archGrid.innerHTML = ARCHETYPES_BY_ROLE[role].map(a => `
    <div class="archetype-row" data-arch="${a.id}" role="button" tabindex="0">
      <div class="ar-icon">${a.icon}</div>
      <div>
        <div class="ar-name">${a.name}</div>
        <div class="ar-desc">${a.desc}</div>
      </div>
    </div>`).join("");
  archGrid.querySelectorAll(".archetype-row").forEach(c => c.addEventListener("click", () => {
    selArchetypeId = c.dataset.arch;
    archGrid.querySelectorAll(".archetype-row").forEach(x => x.classList.remove("selected"));
    c.classList.add("selected");
  }));
}

function updateBodySliders(role) {
  const r = BODY_RANGES[role];
  const hInput = el("inp-height"), wInput = el("inp-weight");
  hInput.min = r.hMin; hInput.max = r.hMax; hInput.value = Math.round((r.hMin + r.hMax) / 2);
  wInput.min = r.wMin; wInput.max = r.wMax; wInput.value = Math.round((r.wMin + r.wMax) / 2);
  el("height-value").textContent = `${hInput.value} cm`;
  el("weight-value").textContent = `${wInput.value} kg`;
  el("body-hint").textContent = "Altezza e peso influenzano l'overall iniziale e gli attributi fisici.";
}

function initCreationScreen() {
  const natSel = el("inp-nationality");
  natSel.innerHTML = NATIONALITIES.map(n => `<option value="${n}">${n}</option>`).join("");

  const roleGrid = el("court-positions");
  roleGrid.innerHTML = ROLES.map(r => {
    const pos = ROLE_COURT_POS[r.id];
    return `<g class="court-pos" data-role="${r.id}" role="button" tabindex="0" aria-label="${r.name}" transform="translate(${pos.x},${pos.y})">
      <circle class="court-pos-circle" r="27"></circle>
      <text class="court-pos-label" text-anchor="middle" dy="6">${r.id}</text>
    </g>`;
  }).join("");
  roleGrid.querySelectorAll(".court-pos").forEach(c => c.addEventListener("click", () => {
    selRole = c.dataset.role;
    selArchetypeId = null;
    roleGrid.querySelectorAll(".court-pos").forEach(x => x.classList.remove("selected"));
    c.classList.add("selected");
    renderArchetypeGrid(selRole);
    updateBodySliders(selRole);
  }));

  renderArchetypeGrid(null);

  el("inp-height").addEventListener("input", () => { el("height-value").textContent = `${el("inp-height").value} cm`; });
  el("inp-weight").addEventListener("input", () => { el("weight-value").textContent = `${el("inp-weight").value} kg`; });

  const pathGrid = el("grid-path");
  pathGrid.innerHTML = PATHS.map(p => `
    <div class="choice-card" data-path="${p.id}" role="button" tabindex="0">
      <div class="cc-icon">${p.icon}</div>
      <div class="cc-title">${p.name}</div>
      <div class="cc-desc">${p.desc}</div>
    </div>`).join("");
  pathGrid.querySelectorAll(".choice-card").forEach(c => c.addEventListener("click", () => {
    selPath = PATHS.find(p => p.id === c.dataset.path);
    pathGrid.querySelectorAll(".choice-card").forEach(x => x.classList.remove("selected"));
    c.classList.add("selected");
  }));

  renderDifficultyGrid();

  el("btn-random-name").addEventListener("click", () => {
    // nome tipico della nazionalità scelta
    const n = randomNameFor(el("inp-nationality").value);
    el("inp-firstname").value = n.first;
    if (!pendingLegacy) el("inp-lastname").value = n.last;
  });

  el("inp-custom-mode").addEventListener("change", () => { customMode = el("inp-custom-mode").checked; });
  el("inp-custom-overall").addEventListener("input", () => {
    const ov = parseInt(el("inp-custom-overall").value);
    el("custom-overall-value").textContent = ov;
    const potInput = el("inp-custom-potential");
    potInput.min = ov;
    if (parseInt(potInput.value) < ov) { potInput.value = ov; el("custom-potential-value").textContent = ov; }
  });
  el("inp-custom-potential").addEventListener("input", () => {
    el("custom-potential-value").textContent = el("inp-custom-potential").value;
  });

  el("btn-wizard-next").addEventListener("click", wizardNext);
  el("btn-wizard-back").addEventListener("click", wizardBack);
  // ogni scelta o modifica aggiorna l'anteprima del giocatore
  ["click", "input", "change"].forEach(evt => el("screen-create").addEventListener(evt, () => renderWizardPreview()));
  el("btn-onboarding-back").addEventListener("click", () => {
    wizardStep = 4;
    renderWizard();
    el("screen-onboarding").classList.add("hidden");
    el("screen-create").classList.remove("hidden");
  });
  el("btn-confirm-onboarding").addEventListener("click", onConfirmOnboarding);
  el("inp-jersey-custom").addEventListener("input", () => {
    const v = parseInt(el("inp-jersey-custom").value);
    if (!isNaN(v)) {
      pendingCreation.jerseyNumber = clamp(v, 0, 99);
      el("jersey-quick-grid").querySelectorAll(".jersey-pick").forEach(x => x.classList.remove("selected"));
    }
  });
}

function renderDifficultyGrid() {
  const grid = el("grid-difficulty");
  grid.innerHTML = DIFFICULTIES.map(d => `
    <div class="choice-card ${d.id === selDifficulty ? "selected" : ""}" data-difficulty="${d.id}" role="button" tabindex="0">
      <div class="cc-icon">${d.icon}</div>
      <div class="cc-title">${d.label}</div>
      <div class="cc-desc">${d.desc}</div>
    </div>`).join("");
  grid.querySelectorAll(".choice-card").forEach(c => c.addEventListener("click", () => {
    selDifficulty = c.dataset.difficulty;
    grid.querySelectorAll(".choice-card").forEach(x => x.classList.toggle("selected", x === c));
  }));
}

/* ---------- creazione a passi: identità, ruolo, fisico, percorso, squadra ---------- */
const WIZARD_STEPS = ["Identità", "Ruolo", "Fisico", "Percorso", "Squadra"];
let wizardStep = 1;

function wizardStepsHtml(active) {
  return WIZARD_STEPS.map((label, i) => {
    const n = i + 1;
    const state = n < active ? "done" : n === active ? "current" : "future";
    return `<li class="ws-step ${state}" ${n < active && n <= 4 ? `data-goto="${n}" role="button" tabindex="0"` : ""} ${state === "current" ? 'aria-current="step"' : ""}>
      <span class="ws-num">${n < active ? "✓" : n}</span><span class="ws-label">${label}</span></li>`;
  }).join("");
}
function renderWizard() {
  // dinastia: il cognome è quello di famiglia
  const banner = el("legacy-banner");
  banner.innerHTML = pendingLegacy ? legacyBannerHtml(pendingLegacy) : "";
  if (pendingLegacy) fillLegacyBanner(banner, pendingLegacy);
  el("inp-lastname").readOnly = !!pendingLegacy;
  el("wizard-steps").innerHTML = wizardStepsHtml(wizardStep);
  el("wizard-steps").querySelectorAll("[data-goto]").forEach(li => li.addEventListener("click", () => { wizardStep = parseInt(li.dataset.goto); renderWizard(); }));
  document.querySelectorAll("#screen-create .wizard-step").forEach(sec => sec.classList.toggle("hidden", parseInt(sec.dataset.step) !== wizardStep));
  el("create-intro").classList.toggle("hidden", wizardStep !== 1);
  el("btn-wizard-back").classList.toggle("invisible", wizardStep === 1);
  el("btn-wizard-next").textContent = wizardStep === 4 ? "Scegli la squadra →" : "Avanti →";
  el("wizard-error").textContent = "";
  renderWizardPreview();
}
function wizardError(step) {
  if (step === 2 && !selRole) return "Scegli una posizione sul campo.";
  if (step === 2 && !selArchetypeId) return "Scegli un archetipo per il tuo ruolo.";
  if (step === 4 && !selPath) return "Scegli il percorso di partenza.";
  return null;
}
function wizardNext() {
  const err = wizardError(wizardStep);
  if (err) { el("wizard-error").textContent = err; return; }
  if (wizardStep < 4) { wizardStep++; renderWizard(); window.scrollTo(0, 0); return; }
  onStartCareer();
}
function wizardBack() {
  if (wizardStep > 1) { wizardStep--; renderWizard(); window.scrollTo(0, 0); }
}
/* Anteprima del giocatore: si riempie man mano che si sceglie */
function renderWizardPreview() {
  const box = el("wizard-preview");
  if (!box) return;
  const first = el("inp-firstname").value.trim(), last = el("inp-lastname").value.trim();
  const arch = selRole && selArchetypeId ? getArchetype(selRole, selArchetypeId) : null;
  const rows = [
    ["Nazionalità", el("inp-nationality").value],
    ["Difficoltà", (DIFFICULTIES.find(d => d.id === selDifficulty) || DIFFICULTIES[1]).label],
    ["Ruolo", selRole ? getRoleName(selRole) : "—"],
    ["Archetipo", arch ? `${arch.icon} ${arch.name}` : "—"],
    ["Fisico", selRole ? `${el("inp-height").value} cm · ${el("inp-weight").value} kg` : "—"],
    ["Percorso", selPath ? `${selPath.icon} ${selPath.name}` : "—"],
    ["Età", "16 anni"],
  ];
  box.innerHTML = `
    <div class="wp-head">
      <div class="avatar">${((first[0] || "?") + (last[0] || "")).toUpperCase()}</div>
      <div><div class="wp-name"></div><div class="small-muted">${customMode ? "Modalità personalizzata" : "Overall e potenziale alla creazione"}</div></div>
    </div>
    <dl class="profile-list">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>`;
  box.querySelector(".wp-name").textContent = first || last ? `${first} ${last}`.trim() : "Il tuo giocatore";
}

function pickThreeTeams(leagueId) {
  const pool = [...LEAGUES[leagueId].teams];
  const picks = [];
  for (let i = 0; i < 3 && pool.length; i++) {
    const idx = randInt(0, pool.length - 1);
    picks.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return picks;
}

function onStartCareer() {
  const nationality = el("inp-nationality").value;
  const fallback = randomNameFor(nationality);
  const firstName = el("inp-firstname").value.trim() || fallback.first;
  const lastName = pendingLegacy ? pendingLegacy.lastName : el("inp-lastname").value.trim() || fallback.last;

  if (!selRole) { toast("⚠️ Seleziona un ruolo"); return; }
  if (!selArchetypeId) { toast("⚠️ Seleziona un archetipo"); return; }
  if (!selPath) { toast("⚠️ Seleziona un percorso di partenza"); return; }

  const height = parseInt(el("inp-height").value);
  const weight = parseInt(el("inp-weight").value);
  const leagueId = selPath.id === "USA_HS" ? "NCAA" : pickHomeEuroLeague(nationality);
  const teamOptions = customMode ? [...LEAGUES[leagueId].teams] : pickThreeTeams(leagueId);

  pendingCreation = {
    firstName, lastName, nationality, role: selRole, archetypeId: selArchetypeId,
    height, weight, path: selPath, leagueId, teamOptions,
    selectedTeamIdx: null, jerseyNumber: null, difficulty: selDifficulty,
  };

  el("screen-create").classList.add("hidden");
  el("screen-onboarding").classList.remove("hidden");
  renderOnboardingScreen();
}

function renderOnboardingScreen() {
  el("wizard-steps-onboarding").innerHTML = wizardStepsHtml(5);
  el("wizard-steps-onboarding").querySelectorAll("[data-goto]").forEach(li => li.addEventListener("click", () => {
    wizardStep = parseInt(li.dataset.goto);
    el("screen-onboarding").classList.add("hidden");
    el("screen-create").classList.remove("hidden");
    renderWizard();
  }));
  el("onboarding-league-label").textContent = `Lega di partenza: ${LEAGUES[pendingCreation.leagueId].name}`;

  const ratingsCard = el("card-custom-ratings");
  ratingsCard.classList.toggle("hidden", !customMode);
  if (customMode) {
    el("inp-custom-overall").value = 60;
    el("custom-overall-value").textContent = 60;
    el("inp-custom-potential").min = 60;
    el("inp-custom-potential").value = 85;
    el("custom-potential-value").textContent = 85;
  }

  const grid = el("grid-team-choice");
  grid.classList.toggle("scrollable", pendingCreation.teamOptions.length > 6);
  grid.innerHTML = pendingCreation.teamOptions.map((t, i) => `
    <div class="option-card team-pick-card" data-idx="${i}" role="button" tabindex="0">
      <div class="tp-dot" style="background:${t.colors[0]};border:2px solid ${t.colors[1]}"></div>
      <div><div class="tp-name">${t.name}</div><div class="tp-city">${t.city}</div></div>
    </div>`).join("");
  grid.querySelectorAll(".option-card").forEach(c => c.addEventListener("click", () => {
    pendingCreation.selectedTeamIdx = parseInt(c.dataset.idx);
    grid.querySelectorAll(".option-card").forEach(x => x.classList.remove("selected-team"));
    c.classList.add("selected-team");
  }));

  const commonNumbers = [0,1,2,3,4,5,6,7,8,9,10,11,13,15,20,21,23,24,30,32,33,34,35,42,50,55,99];
  const jGrid = el("jersey-quick-grid");
  jGrid.innerHTML = commonNumbers.map(n => `<div class="jersey-pick" data-num="${n}" role="button" tabindex="0" aria-label="Numero ${n}">${n}</div>`).join("");
  jGrid.querySelectorAll(".jersey-pick").forEach(c => c.addEventListener("click", () => {
    pendingCreation.jerseyNumber = parseInt(c.dataset.num);
    jGrid.querySelectorAll(".jersey-pick").forEach(x => x.classList.remove("selected"));
    c.classList.add("selected");
    el("inp-jersey-custom").value = c.dataset.num;
  }));
  el("inp-jersey-custom").value = "";
  // la dinastia propone il numero di maglia del genitore
  if (pendingLegacy) {
    pendingCreation.jerseyNumber = pendingLegacy.jersey;
    el("inp-jersey-custom").value = pendingLegacy.jersey;
    const pick = jGrid.querySelector(`[data-num="${pendingLegacy.jersey}"]`);
    if (pick) pick.classList.add("selected");
  }
}

function onConfirmOnboarding() {
  if (pendingCreation.selectedTeamIdx === null) { toast("⚠️ Seleziona una squadra"); return; }
  const team = pendingCreation.teamOptions[pendingCreation.selectedTeamIdx];
  const jerseyNumber = pendingCreation.jerseyNumber !== null ? pendingCreation.jerseyNumber : randInt(0, 99);

  const customOverall = customMode ? parseInt(el("inp-custom-overall").value) : null;
  const customPotential = customMode ? parseInt(el("inp-custom-potential").value) : null;

  resetTeamStrengths();
  activeSlot = targetNewCareerSlot();
  newCareerSlot = null;
  player = newPlayerState({
    firstName: pendingCreation.firstName, lastName: pendingCreation.lastName, nationality: pendingCreation.nationality,
    role: pendingCreation.role, archetypeId: pendingCreation.archetypeId,
    height: pendingCreation.height, weight: pendingCreation.weight,
    path: pendingCreation.path, leagueId: pendingCreation.leagueId, team, jerseyNumber,
    customOverall, customPotential, difficulty: pendingCreation.difficulty, legacy: pendingLegacy,
  });
  pendingLegacy = null;

  el("screen-onboarding").classList.add("hidden");
  el("screen-game").classList.remove("hidden");
  switchGameTab("carriera");
  renderGameScreen();
}
