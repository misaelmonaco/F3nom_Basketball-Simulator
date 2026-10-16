"use strict";

/* ================================================================
   SCREEN 1 — CREATION LOGIC
   ================================================================ */
let selRole = null, selArchetypeId = null, selPath = null;
let selDifficulty = "normal";
let selHand = "right", selBodyType = "balanced", selTraits = [], selLook = defaultLook(), selAttrShift = {};
let creationRoll = null; // casualità della creazione, estratta una volta sola (vedi makeCreationRoll)
let customMode = false; // modalità personalizzata: squadra libera + overall/potenziale a scelta
let pendingCreation = null; // dati raccolti nella creazione, in attesa di squadra/maglia

const ATTR_SHORT = { shooting: "Tiro", finishing: "Finalizz.", playmaking: "Regia", rebounding: "Rimbalzi", defense: "Difesa", athleticism: "Atletismo" };
const ATTR_TENDENCY = { shooting: "Punti dal perimetro", finishing: "Punti al ferro", playmaking: "Tanti assist", rebounding: "Tanti rimbalzi", defense: "Recuperi e stoppate", athleticism: "Contropiede e schiacciate" };
const CREATION_BASE_OVR = 62; // livello indicativo con cui si mostrano gli attributi prima degli scout

/* Attributi indicativi con le scelte fatte finora (senza la casualità degli scout) */
function projectedAttrs(role, archetypeId) {
  const zero = {};
  ATTR_KEYS.forEach(k => { zero[k] = 0; });
  const body = computeBodyModifiers(role, parseInt(el("inp-height").value), parseInt(el("inp-weight").value));
  return generateInitialAttrs(role, archetypeId, CREATION_BASE_OVR, body, { noise: zero, bumps: [HAND_BUMPS[selHand], getBodyType({ bodyType: selBodyType }).bumps, sanitizeAttrShift(selAttrShift)] });
}
function attrBarsHtml(attrs, compare) {
  return ATTR_KEYS.map(k => {
    const d = compare ? attrs[k] - compare[k] : 0;
    return `<div class="attr-row"><span class="al">${ATTR_LABELS[k]}</span><div class="abar-wrap"><div class="abar" style="width:${attrs[k]}%"></div></div>
      <span class="av">${attrs[k]}</span>${compare ? `<span class="ap-delta ${d > 0 ? "up" : d < 0 ? "down" : ""}">${d > 0 ? "+" : ""}${d || ""}</span>` : ""}</div>`;
  }).join("");
}

function renderArchetypeGrid(role) {
  const archGrid = el("grid-archetype");
  const hint = el("archetype-hint");
  if (!role) {
    archGrid.innerHTML = "";
    hint.classList.remove("hidden");
    renderArchetypePreview();
    return;
  }
  hint.classList.add("hidden");
  archGrid.innerHTML = ARCHETYPES_BY_ROLE[role].map(a => `
    <div class="archetype-row ${a.id === selArchetypeId ? "selected" : ""}" data-arch="${a.id}" role="button" tabindex="0">
      <div class="ar-icon">${a.icon}</div>
      <div>
        <div class="ar-name">${a.name}${a.hybrid ? ` <span class="badge blue">${role}/${a.hybrid}</span>` : ""}</div>
        <div class="ar-desc">${a.desc}</div>
        <div class="ar-bumps">${Object.entries(a.bumps).map(([k, v]) => `<span>+${v} ${ATTR_SHORT[k]}</span>`).join("")}</div>
      </div>
    </div>`).join("");
  archGrid.querySelectorAll(".archetype-row").forEach(c => c.addEventListener("click", () => {
    selArchetypeId = c.dataset.arch;
    archGrid.querySelectorAll(".archetype-row").forEach(x => x.classList.remove("selected"));
    c.classList.add("selected");
    renderArchetypePreview();
  }));
  renderArchetypePreview();
}

/* Anteprima dell'archetipo: attributi di partenza indicativi e che tipo di statline aspettarsi */
function renderArchetypePreview() {
  const box = el("archetype-preview");
  const arch = selRole && selArchetypeId ? getArchetype(selRole, selArchetypeId) : null;
  if (!arch) { box.innerHTML = `<p class="small-muted">Scegli un archetipo per vedere gli attributi di partenza e il tuo stile di gioco.</p>`; return; }
  const attrs = projectedAttrs(selRole, arch.id);
  const top = ATTR_KEYS.slice().sort((a, b) => attrs[b] - attrs[a]).slice(0, 2);
  const tags = top.map(k => ATTR_TENDENCY[k]);
  if (arch.threeRate >= 0.45) tags.push(`Tanti tiri da tre (${Math.round(arch.threeRate * 100)}%)`);
  else if (arch.threeRate <= 0.1) tags.push("Quasi solo vicino a canestro");
  else tags.push(`Tiri da tre: ${Math.round(arch.threeRate * 100)}%`);
  if (arch.hybrid) tags.push(`Gioca anche da ${getRoleName(arch.hybrid)}`);
  box.innerHTML = `
    <div class="ap-title">${arch.icon} ${arch.name}</div>
    <div class="ap-tags">${tags.map(t => `<span class="badge">${t}</span>`).join("")}</div>
    <div class="ap-attrs">${attrBarsHtml(attrs)}</div>
    <p class="small-muted">Valori indicativi: il talento vero lo scoprono gli scout alla fine della creazione.</p>`;
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

/* Griglia di choice-card a selezione singola */
function renderChoiceGrid(id, items, selected, onPick) {
  const grid = el(id);
  grid.innerHTML = items.map(x => `
    <div class="choice-card ${x.id === selected ? "selected" : ""}" data-id="${x.id}" role="button" tabindex="0">
      <div class="cc-icon">${x.icon}</div>
      <div class="cc-title">${x.label}</div>
      <div class="cc-desc">${x.desc}</div>
    </div>`).join("");
  grid.querySelectorAll(".choice-card").forEach(c => c.addEventListener("click", () => {
    onPick(c.dataset.id);
    grid.querySelectorAll(".choice-card").forEach(x => x.classList.toggle("selected", x === c));
  }));
}

/* ---------- aspetto ---------- */
function renderLookEditor() {
  const box = el("look-editor");
  const l = selLook;
  const swatches = (key, colors) => colors.map((c, i) => `<button type="button" class="look-swatch ${l[key] === i ? "selected" : ""}" data-look="${key}" data-val="${i}" style="background:${c}" aria-label="Colore ${i + 1}"></button>`).join("");
  const chips = (key, list) => list.map(x => `<button type="button" class="look-chip ${l[key] === x.id ? "selected" : ""}" data-look="${key}" data-val="${x.id}">${x.label}</button>`).join("");
  box.innerHTML = `
    <div class="look-avatar">${avatarSvg(l, null, null)}</div>
    <div class="look-fields">
      <div class="look-row"><span class="look-lbl">Carnagione</span><div class="look-opts">${swatches("skin", SKIN_TONES)}</div></div>
      <div class="look-row"><span class="look-lbl">Capelli</span><div class="look-opts">${chips("hair", HAIR_STYLES)}</div></div>
      <div class="look-row"><span class="look-lbl">Colore</span><div class="look-opts">${swatches("hairColor", HAIR_COLORS)}</div></div>
      <div class="look-row"><span class="look-lbl">Barba</span><div class="look-opts">${chips("beard", BEARDS)}</div></div>
      <div class="look-row"><span class="look-lbl">Fascia</span><div class="look-opts">
        <button type="button" class="look-chip ${l.headband ? "selected" : ""}" data-look="headband" data-val="1">Sì</button>
        <button type="button" class="look-chip ${!l.headband ? "selected" : ""}" data-look="headband" data-val="0">No</button></div></div>
      <button type="button" class="btn btn-ghost btn-sm" id="btn-random-look">🎲 Aspetto casuale</button>
    </div>`;
  box.querySelectorAll("[data-look]").forEach(b => b.addEventListener("click", () => {
    const key = b.dataset.look, v = b.dataset.val;
    selLook = sanitizeLook({ ...selLook, [key]: key === "headband" ? v === "1" : key === "skin" || key === "hairColor" ? parseInt(v) : v });
    renderLookEditor();
  }));
  el("btn-random-look").addEventListener("click", () => { selLook = randomLook(); renderLookEditor(); });
}

/* ---------- città natale: le città della nazione scelta che hanno una squadra in gioco ---------- */
let hometownNationality = null;
function updateHometownOptions() {
  const isFinalClimb = selScenario === "finalClimb";
  if (isFinalClimb) {
    el("inp-nationality").value = "Italia";
    el("inp-nationality").disabled = true;
  } else {
    el("inp-nationality").disabled = false;
  }
  const nat = el("inp-nationality").value;
  // nel Ritorno a casa la città natale è obbligatoria e decide la squadra
  const homecoming = selScenario === "homecoming";
  const key = `${nat}|${homecoming}|${isFinalClimb}`;
  if (key === hometownNationality) return;
  hometownNationality = key;
  const cities = homecoming ? homecomingCities(nat) : hometownCities(nat);
  const sel = el("inp-hometown");
  const prev = sel.value;
  sel.innerHTML = ((homecoming || isFinalClimb) ? "" : `<option value="">— Nessuna in particolare —</option>`) + cities.map(c => `<option value="${c}">${c}</option>`).join("");
  if (cities.includes(prev)) sel.value = prev;
  sel.disabled = !cities.length;
  if (isFinalClimb) {
    el("hometown-hint").textContent = sel.value ? `Partirai in DR2 con la società locale di ${sel.value}.` : "Scegli la tua città natale italiana per creare la squadra locale.";
    return;
  }
  if (homecoming) {
    const home = cities.length && sel.value ? homecomingTeam(sel.value) : null;
    el("hometown-hint").textContent = home ? `Giocherai con ${home.team.name} (${LEAGUES[home.leagueId].name}).` : "Nessuna città di questa nazione ha una squadra da cui ripartire: scegli un'altra nazionalità.";
    return;
  }
  el("hometown-hint").textContent = cities.length
    ? "Se la tua città ha una squadra, ti corteggerà: giocarci dà popolarità, morale e chimica in più."
    : "Nessuna squadra della tua nazione è in gioco: niente città natale.";
}

/* ---------- talento: carattere e allenamento giovanile ---------- */
function renderTraitsGrid() {
  const grid = el("grid-traits");
  grid.innerHTML = TRAITS.map(t => {
    const on = selTraits.includes(t.id);
    const blocked = !on && (selTraits.length >= MAX_TRAITS || !traitsCompatible(selTraits, t.id));
    return `<div class="choice-card trait-card ${on ? "selected" : ""} ${blocked ? "blocked" : ""}" data-trait="${t.id}" role="button" tabindex="0" aria-pressed="${on}">
      <div class="cc-icon">${t.icon}</div><div class="cc-title">${t.label}</div><div class="cc-desc">${t.desc}</div></div>`;
  }).join("");
  el("traits-count").textContent = `${selTraits.length}/${MAX_TRAITS}`;
  grid.querySelectorAll("[data-trait]").forEach(c => c.addEventListener("click", () => {
    const id = c.dataset.trait;
    if (selTraits.includes(id)) selTraits = selTraits.filter(x => x !== id);
    else if (selTraits.length < MAX_TRAITS && traitsCompatible(selTraits, id)) selTraits = [...selTraits, id];
    else { el("wizard-error").textContent = selTraits.length >= MAX_TRAITS ? `Puoi scegliere al massimo ${MAX_TRAITS} tratti.` : "Questo tratto non si sposa con quelli che hai già scelto."; return; }
    el("wizard-error").textContent = "";
    renderTraitsGrid();
  }));
}
function attrShiftFree() { return -ATTR_KEYS.reduce((t, k) => t + (selAttrShift[k] || 0), 0); }
function renderAttrShift() {
  const box = el("attr-shift");
  if (!selRole || !selArchetypeId) { box.innerHTML = `<p class="small-muted">Scegli prima ruolo e archetipo.</p>`; return; }
  const attrs = projectedAttrs(selRole, selArchetypeId);
  const free = attrShiftFree();
  box.innerHTML = `
    <p class="tr-points">Punti liberi: <strong>${free}</strong> <span class="small-muted">· togli da un attributo per darli a un altro (massimo ±${ATTR_SHIFT_MAX} ciascuno)</span></p>
    <div class="shift-list">${ATTR_KEYS.map(k => {
      const v = selAttrShift[k] || 0;
      return `<div class="shift-row">
        <span class="al">${ATTR_LABELS[k]}</span>
        <button type="button" class="btn btn-ghost btn-sm" data-shift="${k}" data-dir="-1" ${v <= -ATTR_SHIFT_MAX ? "disabled" : ""} aria-label="Togli un punto a ${ATTR_LABELS[k]}">−</button>
        <span class="shift-val ${v > 0 ? "up" : v < 0 ? "down" : ""}">${v > 0 ? "+" : ""}${v}</span>
        <button type="button" class="btn btn-ghost btn-sm" data-shift="${k}" data-dir="1" ${v >= ATTR_SHIFT_MAX || free <= 0 ? "disabled" : ""} aria-label="Aggiungi un punto a ${ATTR_LABELS[k]}">+</button>
        <div class="abar-wrap"><div class="abar" style="width:${attrs[k]}%"></div></div><span class="av">${attrs[k]}</span>
      </div>`;
    }).join("")}</div>
    <div class="btn-row"><button type="button" class="btn btn-ghost btn-sm" id="btn-reset-shift">↺ Azzera</button></div>`;
  box.querySelectorAll("[data-shift]").forEach(b => b.addEventListener("click", () => {
    const k = b.dataset.shift, dir = parseInt(b.dataset.dir);
    selAttrShift = sanitizeAttrShift({ ...selAttrShift, [k]: (selAttrShift[k] || 0) + dir });
    renderAttrShift();
  }));
  el("btn-reset-shift").addEventListener("click", () => { selAttrShift = {}; renderAttrShift(); });
}

function initCreationScreen() {
  const natSel = el("inp-nationality");
  natSel.innerHTML = NATIONALITIES.map(n => `<option value="${n}">${n}</option>`).join("");
  natSel.addEventListener("change", updateHometownOptions);
  el("inp-hometown").addEventListener("change", () => { if (selScenario === "homecoming") { hometownNationality = null; updateHometownOptions(); } });
  updateHometownOptions();

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
    updateBodySliders(selRole);
    renderArchetypeGrid(selRole);
  }));

  renderArchetypeGrid(null);

  el("inp-height").addEventListener("input", () => { el("height-value").textContent = `${el("inp-height").value} cm`; });
  el("inp-weight").addEventListener("input", () => { el("weight-value").textContent = `${el("inp-weight").value} kg`; });
  renderIdentityGrids();

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
    renderScoutingCard();
  });
  el("inp-custom-potential").addEventListener("input", () => {
    el("custom-potential-value").textContent = el("inp-custom-potential").value;
    renderScoutingCard();
  });

  el("btn-wizard-next").addEventListener("click", wizardNext);
  el("btn-wizard-random").addEventListener("click", randomizeCreation);
  el("btn-wizard-back").addEventListener("click", wizardBack);
  if (el("btn-start-new-career")) el("btn-start-new-career").addEventListener("click", openCreationWizard);
  if (el("btn-back-to-home")) el("btn-back-to-home").addEventListener("click", closeCreationWizard);
  // ogni scelta o modifica aggiorna l'anteprima del giocatore
  ["click", "input", "change"].forEach(evt => el("screen-create").addEventListener(evt, () => renderWizardPreview()));
  // anche gli attributi indicativi seguono il fisico
  ["inp-height", "inp-weight"].forEach(id => el(id).addEventListener("input", renderArchetypePreview));
  el("btn-onboarding-back").addEventListener("click", () => {
    createWizardOpen = true;
    wizardStep = WIZARD_STEPS.length - 1;
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

/* Mano, corporatura, carattere, allenamento giovanile e aspetto (anche dopo un reset) */
function renderIdentityGrids() {
  renderChoiceGrid("grid-hand", HANDS, selHand, id => { selHand = id; renderArchetypePreview(); });
  renderChoiceGrid("grid-bodytype", BODY_TYPES, selBodyType, id => { selBodyType = id; renderArchetypePreview(); });
  renderTraitsGrid();
  renderLookEditor();
}
function resetCreationIdentity() {
  selHand = "right"; selBodyType = "balanced"; selTraits = []; selLook = defaultLook(); selAttrShift = {};
  creationRoll = null;
  hometownNationality = null;
  updateHometownOptions();
  renderIdentityGrids();
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

/* Sorprendimi: estrae ogni scelta della creazione (tranne la difficoltà) e porta all'ultimo
   passo prima della squadra; dai passi già fatti si può tornare a ritoccare qualcosa. */
function randomizeCreation() {
  // identità: nazionalità, nome (il cognome di famiglia resta), città natale
  const natSel = el("inp-nationality");
  natSel.value = choice(selScenario === "homecoming" ? NATIONALITIES.filter(n => homecomingCities(n).length) : NATIONALITIES);
  updateHometownOptions();
  const n = randomNameFor(natSel.value);
  el("inp-firstname").value = n.first;
  if (!pendingLegacy) el("inp-lastname").value = n.last;
  const towns = hometownCities(natSel.value);
  if (selScenario === "finalClimb") {
    natSel.value = "Italia";
    el("inp-hometown").value = choice(hometownCities("Italia"));
    hometownNationality = null;
    updateHometownOptions();
  } else if (selScenario === "homecoming") { el("inp-hometown").value = choice(homecomingCities(natSel.value)); hometownNationality = null; updateHometownOptions(); }
  else el("inp-hometown").value = towns.length && Math.random() < 0.6 ? choice(towns) : "";
  selLook = randomLook();

  // ruolo e archetipo
  selRole = choice(ROLES).id;
  selArchetypeId = choice(ARCHETYPES_BY_ROLE[selRole]).id;
  el("court-positions").querySelectorAll(".court-pos").forEach(x => x.classList.toggle("selected", x.dataset.role === selRole));
  renderArchetypeGrid(selRole);

  // fisico
  updateBodySliders(selRole);
  const r = BODY_RANGES[selRole];
  el("inp-height").value = randInt(r.hMin, r.hMax);
  el("inp-weight").value = randInt(r.wMin, r.wMax);
  el("height-value").textContent = `${el("inp-height").value} cm`;
  el("weight-value").textContent = `${el("inp-weight").value} kg`;
  selHand = Math.random() < 0.15 ? "left" : "right";
  selBodyType = choice(BODY_TYPES).id;

  // talento: da zero al massimo dei tratti compatibili, e qualche punto spostato
  selTraits = [];
  const traitCount = randInt(0, MAX_TRAITS);
  for (let tries = 0; selTraits.length < traitCount && tries < 20; tries++) {
    const id = choice(TRAITS).id;
    if (traitsCompatible(selTraits, id)) selTraits.push(id);
  }
  selAttrShift = {};
  for (let i = 0, moves = randInt(0, 4); i < moves; i++) {
    const from = choice(ATTR_KEYS), to = choice(ATTR_KEYS.filter(k => k !== from));
    const next = sanitizeAttrShift({ ...selAttrShift, [from]: (selAttrShift[from] || 0) - 1, [to]: (selAttrShift[to] || 0) + 1 });
    if (Math.abs(next[from]) <= ATTR_SHIFT_MAX && Math.abs(next[to]) <= ATTR_SHIFT_MAX) selAttrShift = next;
  }
  creationRoll = null;
  renderIdentityGrids();
  renderArchetypePreview();

  // percorso
  selPath = scenarioFixedStart() ? null : choice(PATHS);
  el("grid-path").querySelectorAll(".choice-card").forEach(x => x.classList.toggle("selected", !!selPath && x.dataset.path === selPath.id));

  createWizardOpen = true;
  wizardStep = WIZARD_LAST_STEP;
  renderWizard();
  toast("Giocatore creato a caso: controlla il riepilogo, cambia quello che vuoi e scegli la squadra.");
}

/* ---------- creazione a passi: identità, ruolo, fisico, talento, percorso, squadra ---------- */
const WIZARD_STEPS = ["Identità", "Ruolo", "Fisico", "Talento", "Percorso", "Squadra"];
const WIZARD_LAST_STEP = WIZARD_STEPS.length - 1; // l'ultimo passo (la squadra) ha una schermata a parte
let wizardStep = 1;
let createWizardOpen = false;

function openCreationWizard() {
  createWizardOpen = true;
  wizardStep = 1;
  renderWizard();
  if (typeof window !== "undefined" && window.scrollTo) window.scrollTo(0, 0);
}

function closeCreationWizard() {
  createWizardOpen = false;
  wizardStep = 1;
  renderWizard();
  if (typeof window !== "undefined" && window.scrollTo) window.scrollTo(0, 0);
}

function wizardStepsHtml(active) {
  return WIZARD_STEPS.map((label, i) => {
    const n = i + 1;
    const state = n < active ? "done" : n === active ? "current" : "future";
    return `<li class="ws-step ${state}" ${n < active && n <= WIZARD_LAST_STEP ? `data-goto="${n}" role="button" tabindex="0"` : ""} ${state === "current" ? 'aria-current="step"' : ""}>
      <span class="ws-num">${n < active ? "✓" : n}</span><span class="ws-label">${label}</span></li>`;
  }).join("");
}
function renderWizard() {
  // dinastia: il cognome è quello di famiglia
  const banner = el("legacy-banner");
  banner.innerHTML = pendingLegacy ? legacyBannerHtml(pendingLegacy) : "";
  if (pendingLegacy) fillLegacyBanner(banner, pendingLegacy);
  el("inp-lastname").readOnly = !!pendingLegacy;
  renderScenarioBanner();
  const fixed = scenarioFixedStart();
  el("grid-path").classList.toggle("hidden", fixed);
  el("path-fixed-note").classList.toggle("hidden", !fixed);
  if (fixed) el("path-fixed-note").textContent = `Il punto di partenza lo decide lo scenario: ${getScenario(selScenario).startText}.`;
  updateHometownOptions();
  el("wizard-steps").innerHTML = wizardStepsHtml(wizardStep);
  el("wizard-steps").querySelectorAll("[data-goto]").forEach(li => li.addEventListener("click", () => { wizardStep = parseInt(li.dataset.goto); renderWizard(); }));
  document.querySelectorAll("#screen-create .wizard-step").forEach(sec => sec.classList.toggle("hidden", parseInt(sec.dataset.step) !== wizardStep));
  el("create-intro").classList.toggle("hidden", createWizardOpen);
  if (el("create-wizard-wrap")) el("create-wizard-wrap").classList.toggle("hidden", !createWizardOpen);
  el("btn-wizard-back").classList.toggle("invisible", wizardStep === 1);
  el("btn-wizard-next").textContent = wizardStep === WIZARD_LAST_STEP ? "Scegli la squadra →" : "Avanti →";
  el("wizard-error").textContent = "";
  if (wizardStep === 4) renderAttrShift();
  renderWizardPreview();
}
/* Scenario con la partenza fissata: niente scelta del percorso */
function scenarioFixedStart() { return !!(selScenario && getScenario(selScenario).fixedStart); }
function wizardError(step) {
  if (step === 1 && selScenario === "homecoming" && !el("inp-hometown").value) return "Nel Ritorno a casa serve una città natale con una squadra: scegli un'altra nazionalità.";
  if (step === 1 && selScenario === "finalClimb" && !el("inp-hometown").value) return "Nella Scalata finale seleziona la tua città natale.";
  if (step === 2 && !selRole) return "Scegli una posizione sul campo.";
  if (step === 2 && !selArchetypeId) return "Scegli un archetipo per il tuo ruolo.";
  if (step === 5 && !selPath && !scenarioFixedStart()) return "Scegli il percorso di partenza.";
  return null;
}
function wizardNext() {
  createWizardOpen = true;
  const err = wizardError(wizardStep);
  if (err) { el("wizard-error").textContent = err; return; }
  if (wizardStep < WIZARD_LAST_STEP) { wizardStep++; renderWizard(); window.scrollTo(0, 0); return; }
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
  const town = el("inp-hometown").value;
  const rows = [
    ["Nazionalità", `${el("inp-nationality").value}${town ? ` · ${town}` : ""}`],
    ["Difficoltà", (DIFFICULTIES.find(d => d.id === selDifficulty) || DIFFICULTIES[1]).label],
    ["Ruolo", selRole ? `${getRoleName(selRole)}${arch && arch.hybrid ? ` / ${arch.hybrid}` : ""}` : "—"],
    ["Archetipo", arch ? `${arch.icon} ${arch.name}` : "—"],
    ["Fisico", selRole ? `${el("inp-height").value} cm · ${el("inp-weight").value} kg` : "—"],
    ["Corpo", `${getBodyType({ bodyType: selBodyType }).label} · ${selHand === "left" ? "mancino" : "destro"}`],
    ["Carattere", selTraits.length ? selTraits.map(id => `${getTrait(id).icon} ${getTrait(id).label}`).join("<br>") : "—"],
    ["Percorso", scenarioFixedStart() ? "Fissato dallo scenario" : selPath ? `${selPath.icon} ${selPath.name}` : "—"],
    ["Età", `${selScenario ? getScenario(selScenario).age : 16} anni`],
    ...(selScenario ? [["Scenario", getScenario(selScenario).title]] : []),
  ];
  box.innerHTML = `
    <div class="wp-head">
      <div class="avatar has-look">${avatarSvg(selLook, null, null)}</div>
      <div><div class="wp-name"></div><div class="small-muted">${customMode ? "Modalità personalizzata" : "Overall e potenziale alla creazione"}</div></div>
    </div>
    <dl class="profile-list">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>`;
  box.querySelector(".wp-name").textContent = first || last ? `${first} ${last}`.trim() : "Il tuo giocatore";
}

/* Tre squadre a caso nella lega di partenza; quella della città natale, se c'è, è sempre tra queste */
function pickThreeTeams(leagueId, hometown) {
  const pool = [...LEAGUES[leagueId].teams];
  const picks = [];
  const homeIdx = hometown ? pool.findIndex(t => t.city === hometown) : -1;
  if (homeIdx >= 0) picks.push(pool.splice(homeIdx, 1)[0]);
  while (picks.length < 3 && pool.length) {
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
  if (!selPath && !scenarioFixedStart()) { toast("⚠️ Seleziona un percorso di partenza"); return; }
  if (selScenario === "homecoming" && !el("inp-hometown").value) { toast("Scegli la città natale"); return; }
  if (selScenario === "finalClimb" && !el("inp-hometown").value) { toast("Scegli la città natale"); return; }

  const height = parseInt(el("inp-height").value);
  const weight = parseInt(el("inp-weight").value);
  const hometown = el("inp-hometown").value || null;
  // le squadre forti dell'Ultimo ballo si misurano sulla classifica della nuova carriera
  if (selScenario) resetTeamStrengths();
  const start = selScenario ? scenarioStart(selScenario, { nationality, hometown }) : null;
  const path = selPath || getPath("USA_HS");
  const leagueId = start ? start.leagueId || null : path.start(nationality);
  const teamOptions = start ? start.teams : customMode ? [...LEAGUES[leagueId].teams] : pickThreeTeams(leagueId, hometown);
  if (!creationRoll) creationRoll = makeCreationRoll();
  // il padre del Figlio d'arte prende il tuo cognome
  const fatherFirst = selScenario === "heir" ? randomNameFor(nationality).first : null;

  pendingCreation = {
    firstName, lastName, nationality, role: selRole, archetypeId: selArchetypeId,
    height, weight, path, leagueId, teamOptions, leagueOf: start ? start.leagueOf || null : null,
    scenario: selScenario, scenarioSetup, fatherFirst,
    selectedTeamIdx: null, jerseyNumber: null, difficulty: selDifficulty,
    hand: selHand, bodyType: selBodyType, traits: [...selTraits], look: { ...selLook }, hometown, attrShift: { ...selAttrShift },
  };

  el("screen-create").classList.add("hidden");
  el("screen-onboarding").classList.remove("hidden");
  renderOnboardingScreen();
}

/* Argomenti per newPlayerState a partire dalla creazione in corso */
function creationLeagueOf(team) {
  const pc = pendingCreation;
  return pc.leagueOf ? pc.leagueOf[team.name] : pc.leagueId;
}
function creationPlayerArgs(team, jerseyNumber) {
  const pc = pendingCreation;
  return {
    firstName: pc.firstName, lastName: pc.lastName, nationality: pc.nationality,
    role: pc.role, archetypeId: pc.archetypeId, height: pc.height, weight: pc.weight,
    path: pc.path, leagueId: creationLeagueOf(team), team, jerseyNumber,
    customOverall: customMode ? parseInt(el("inp-custom-overall").value) : null,
    customPotential: customMode ? parseInt(el("inp-custom-potential").value) : null,
    difficulty: pc.difficulty,
    legacy: pc.scenario === "heir" ? heirLegacy(pc.scenarioSetup, pc.nationality, pc.lastName, pc.fatherFirst) : pendingLegacy,
    hand: pc.hand, bodyType: pc.bodyType, traits: pc.traits, look: pc.look, hometown: pc.hometown, attrShift: pc.attrShift, roll: creationRoll,
  };
}
/* Il giocatore che partirà: la creazione e, se c'è, lo scenario */
function buildCreationPlayer(team, jerseyNumber) {
  const pc = pendingCreation;
  const p = newPlayerState(creationPlayerArgs(team, jerseyNumber));
  return pc.scenario ? applyScenario(p, pc.scenario, pc.scenarioSetup, creationLeagueOf(team)) : p;
}
/* Scheda degli scout: esattamente il giocatore che partirà */
function renderScoutingCard() {
  if (!pendingCreation) return;
  const preview = buildCreationPlayer(pendingCreation.teamOptions[0], 0);
  el("scouting-report").innerHTML = scoutingReportHtml(preview, customMode ? null : creationRoll);
}

function renderOnboardingScreen() {
  el("wizard-steps-onboarding").innerHTML = wizardStepsHtml(WIZARD_STEPS.length);
  el("wizard-steps-onboarding").querySelectorAll("[data-goto]").forEach(li => li.addEventListener("click", () => {
    wizardStep = parseInt(li.dataset.goto);
    el("screen-onboarding").classList.add("hidden");
    el("screen-create").classList.remove("hidden");
    renderWizard();
  }));
  const leagues = [...new Set(pendingCreation.teamOptions.map(t => LEAGUES[creationLeagueOf(t)].name))];
  el("onboarding-league-label").textContent = pendingCreation.teamOptions.length === 1 && pendingCreation.scenario
    ? `La squadra della tua città: ${LEAGUES[pendingCreation.leagueId].name}`
    : `Lega di partenza: ${leagues.join(", ")}`;

  const ratingsCard = el("card-custom-ratings");
  ratingsCard.classList.toggle("hidden", !customMode);
  if (customMode) {
    el("inp-custom-overall").value = 60;
    el("custom-overall-value").textContent = 60;
    el("inp-custom-potential").min = 60;
    el("inp-custom-potential").value = 85;
    el("custom-potential-value").textContent = 85;
  }
  renderScoutingCard();

  const grid = el("grid-team-choice");
  grid.classList.toggle("scrollable", pendingCreation.teamOptions.length > 6);
  grid.innerHTML = pendingCreation.teamOptions.map((t, i) => `
    <div class="option-card team-pick-card" data-idx="${i}" role="button" tabindex="0">
      <div class="tp-dot" style="background:${t.colors[0]};border:2px solid ${t.colors[1]}"></div>
      <div><div class="tp-name">${t.name}</div><div class="tp-city">${t.city}${pendingCreation.leagueOf ? ` · ${LEAGUES[creationLeagueOf(t)].name}` : ""}${t.city === pendingCreation.hometown ? " · 🏠 la tua città" : ""}</div></div>
    </div>`).join("");
  grid.querySelectorAll(".option-card").forEach(c => c.addEventListener("click", () => {
    pendingCreation.selectedTeamIdx = parseInt(c.dataset.idx);
    grid.querySelectorAll(".option-card").forEach(x => x.classList.remove("selected-team"));
    c.classList.add("selected-team");
  }));
  // una sola squadra possibile (Ritorno a casa): è già scelta
  if (pendingCreation.teamOptions.length === 1) {
    pendingCreation.selectedTeamIdx = 0;
    grid.querySelector(".option-card").classList.add("selected-team");
  }

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

  if (!pendingCreation.scenario) resetTeamStrengths(); // negli scenari l'ha già fatto onStartCareer
  activeSlot = targetNewCareerSlot();
  newCareerSlot = null;
  player = buildCreationPlayer(team, jerseyNumber);
  pendingLegacy = null;
  creationRoll = null;
  selScenario = null; scenarioSetup = null;

  el("screen-onboarding").classList.add("hidden");
  el("screen-game").classList.remove("hidden");
  switchGameTab("panoramica");
  renderGameScreen();
}
