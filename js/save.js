"use strict";

/* ================================================================
   SALVATAGGIO — la carriera viene salvata nel browser (localStorage) a ogni
   aggiornamento della schermata, insieme al registro della forza delle squadre.
   Tutto lo stato è dato puro: l'unica eccezione sono gli imprevisti estivi in
   sospeso, che contengono funzioni e vengono ricostruiti dal titolo al caricamento.
   ================================================================ */
const LEGACY_SAVE_KEY = "chosenOne.career"; // l'unico salvataggio delle versioni precedenti
const SAVE_SLOTS = [1, 2, 3];
const SAVE_VERSION = 12;
function saveKeyFor(slot) { return `${LEGACY_SAVE_KEY}.${slot}`; }
let activeSlot = 1; // slot della carriera in corso (o di quella che si sta creando)
/* Migrazioni dei salvataggi: SAVE_MIGRATIONS[n] aggiorna sul posto un salvataggio dalla versione n
   alla n+1. Quando si aggiungono o cambiano campi dello stato si alza SAVE_VERSION e si aggiunge
   qui il passo corrispondente, così le carriere salvate con le versioni precedenti restano giocabili. */
const SAVE_MIGRATIONS = {
  // v2: stagione a tratti e partite giocate. Le stagioni già archiviate ricevono gp/games
  // stimati dall'infortunio registrato; una stagione in corso salvata con il vecchio motore
  // (già simulata per intero) prosegue con i playoff come prima.
  1(data) {
    const p = data.player;
    p.history.forEach(h => {
      const games = h.wins + h.losses;
      h.games = games;
      h.gp = Math.round(games * (1 - ((h.injury && h.injury.missedPct) || 0)));
    });
    p.careerTotals.gp = p.history.reduce((t, h) => t + h.gp, 0);
    if (p.pendingSeason && p.pendingSeason.stats && p.pendingSeason.stats.gp == null) {
      const games = p.pendingSeason.regular.wins + p.pendingSeason.regular.losses;
      p.pendingSeason.stats.games = games;
      p.pendingSeason.stats.gp = games;
    }
  },
  // v3: EuroCup contata a parte (prima le vittorie di EuroCup non comparivano in bacheca)
  2(data) {
    const p = data.player;
    const wins = comp => p.history.filter(h => h.continental && h.continental.champion && h.continental.competition === comp).length;
    p.trophies.euroleague = wins("EuroLeague");
    p.trophies.eurocup = wins("EuroCup");
  },
  // v4: momenti clutch nei playoff
  3(data) {
    data.player.clutch = data.player.clutch || { made: 0, attempts: 0 };
  },
  // v5: rivale (funzione poi rimossa, vedi v6)
  4(data) {
    if (data.player.rival === undefined) data.player.rival = null;
  },
  // v6: via il rivale; arrivano reputazione (stimata dai trofei), agente e clausole contrattuali
  5(data) {
    const p = data.player;
    delete p.rival;
    p.history.forEach(h => { delete h.rivalNotes; });
    const t = p.trophies;
    p.reputation = clamp(50 + Math.min(30, t.mvp * 5 + (t.bestFive || 0) * 2 + (t.allstar || 0) + (t.rings + t.domesticTitles) * 3), 0, 100);
    p.agent = null;
    p.agentChosen = false;
    if (p.contract) p.contract.clauses = p.contract.clauses || {};
  },
  // v7: allenatore e compagni (lo staff delle squadre si genera al primo uso)
  6(data) {
    data.player.coachTrust = 55;
    data.player.starRapport = 55;
    data.teamStaffRegistry = data.teamStaffRegistry || {};
  },
  // v8: investimenti estivi
  7(data) {
    data.player.investments = data.player.investments || [];
  },
  // v9: difficoltà (le carriere già iniziate restano a "Normale"), sogno di carriera (lo si
  // sceglie alla prossima stagione) e traguardi (ricalcolati al caricamento, vedi resumeCareer)
  8(data) {
    const p = data.player;
    if (!p.difficulty) p.difficulty = "normal";
    if (p.careerGoal === undefined) p.careerGoal = p.retired ? { id: null, status: "none" } : null;
  },
  // v10: sponsor con condizioni (e il conteggio delle uscite polemiche che li fa saltare)
  9(data) {
    const p = data.player;
    p.sponsors = p.sponsors || [];
    p.polemicCount = p.polemicCount || 0;
  },
  // v11: vita privata, allievo, fascia da capitano e lifestyle
  10(data) {
    const p = data.player;
    p.family = p.family || { partner: false, since: null, married: null, children: [] };
    p.lifestyle = p.lifestyle || [];
    if (p.mentee === undefined) p.mentee = null;
    if (p.captain === undefined) p.captain = null;
  },
  // v12: identità (mano, corporatura, carattere, aspetto, città natale) e diritti del Draft
  11(data) {
    const p = data.player;
    if (!p.hand) p.hand = "right";
    if (!p.bodyType) p.bodyType = "balanced";
    p.traits = p.traits || [];
    if (p.look === undefined) p.look = null; // le carriere già iniziate tengono le iniziali
    if (p.hometown === undefined) p.hometown = null;
    if (p.draftRights === undefined) p.draftRights = null;
  },
};

function migrateSave(data) {
  if (typeof data.version !== "number" || data.version > SAVE_VERSION) return null; // salvataggio di una versione più recente
  while (data.version < SAVE_VERSION) {
    const step = SAVE_MIGRATIONS[data.version];
    if (!step) return null;
    step(data);
    data.version++;
  }
  return data;
}

function saveCareer() {
  if (!player) return;
  try {
    const data = { version: SAVE_VERSION, savedAt: Date.now(), player, teamStrengthRegistry, teamStaffRegistry };
    localStorage.setItem(saveKeyFor(activeSlot), JSON.stringify(data));
  } catch (e) {
    // storage pieno o non disponibile (es. navigazione privata): si continua senza salvare
  }
}

/* Il vecchio salvataggio unico finisce nel primo slot libero al primo avvio */
function migrateLegacySaveSlot() {
  try {
    const raw = localStorage.getItem(LEGACY_SAVE_KEY);
    if (!raw) return;
    const free = SAVE_SLOTS.find(slot => !localStorage.getItem(saveKeyFor(slot)));
    if (!free) return; // tutti occupati: lo si lascia dov'è
    localStorage.setItem(saveKeyFor(free), raw);
    localStorage.removeItem(LEGACY_SAVE_KEY);
  } catch (e) { /* storage non disponibile */ }
}

function loadSavedCareer(slot) {
  try {
    const raw = localStorage.getItem(saveKeyFor(slot == null ? activeSlot : slot));
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !data.player) return null;
    return migrateSave(data);
  } catch (e) {
    return null;
  }
}

function clearSavedCareer(slot) {
  try { localStorage.removeItem(saveKeyFor(slot == null ? activeSlot : slot)); } catch (e) { /* nulla da cancellare */ }
}

/* Slot in cui salvare una nuova carriera: il primo libero, altrimenti una carriera conclusa,
   altrimenti quella salvata meno di recente (verrà sovrascritta, e lo si dice) */
let newCareerSlot = null; // scelto a mano dall'utente, o null per la scelta automatica
function defaultNewCareerSlot() {
  const saves = SAVE_SLOTS.map(slot => ({ slot, data: loadSavedCareer(slot) }));
  const free = saves.find(s => !s.data);
  if (free) return free.slot;
  const retired = saves.find(s => s.data.player.retired);
  if (retired) return retired.slot;
  return [...saves].sort((a, b) => (a.data.savedAt || 0) - (b.data.savedAt || 0))[0].slot;
}
function targetNewCareerSlot() { return newCareerSlot || defaultNewCareerSlot(); }

function findOffseasonEvent(saved) {
  return (saved && OFFSEASON_EVENTS.find(e => e.title === saved.title)) || null;
}

function resumeCareer(data) {
  player = data.player;
  uiPeek = false;
  resetTeamStrengths();
  Object.assign(teamStrengthRegistry, data.teamStrengthRegistry || {});
  Object.assign(teamStaffRegistry, data.teamStaffRegistry || {});

  // l'imprevisto a rischio in attesa di scelta va ricollegato alla sua definizione (con le funzioni)
  if (player.pendingOffseasonEvent) {
    const ev = findOffseasonEvent(player.pendingOffseasonEvent);
    player.pendingOffseasonEvent = ev;
    if (player.pendingDecision && player.pendingDecision.type === "offseasonChoice") player.pendingDecision.event = ev;
    if (!ev && player.pendingFinalizeCtx) {
      // imprevisto non più esistente (salvataggio di una versione precedente): lo si chiude senza effetti
      player.pendingOffseasonEvent = { title: "Imprevisto estivo", category: "" };
      el("screen-create").classList.add("hidden");
      el("screen-game").classList.remove("hidden");
      resolveOffseasonChoice(false);
      return;
    }
  }

  // traguardi di una carriera iniziata prima che esistessero: si sbloccano in silenzio
  if (!player.achievements) { player.achievements = {}; checkAchievements(player, true); }

  el("screen-create").classList.add("hidden");
  el("screen-onboarding").classList.add("hidden");
  if (player.retired) { renderFinalScreen(); return; }
  el("screen-game").classList.remove("hidden");
  switchGameTab("carriera");
  renderGameScreen();
}

/* ---------- esporta / importa: il salvataggio come file JSON ---------- */
/* Scarica un salvataggio come file .json */
function downloadSave(data) {
  const p = data.player;
  const slug = `${p.firstName}-${p.lastName}`.toLowerCase().normalize("NFD").replace(/[^a-z0-9-]+/g, "");
  const url = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `chosen-one-${slug || "carriera"}-${p.year}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("💾 Carriera esportata.");
}
function exportCareer() {
  if (!player) return;
  saveCareer();
  downloadSave({ version: SAVE_VERSION, savedAt: Date.now(), player, teamStrengthRegistry, teamStaffRegistry });
}

/* Un file importato può arrivare da chiunque e parti dello stato finiscono in innerHTML:
   i testi del gioco non contengono mai < o >, quindi li si rimuove da ogni stringa. */
function sanitizeImported(value) {
  if (typeof value === "string") return value.replace(/[<>]/g, "");
  if (Array.isArray(value)) return value.map(sanitizeImported);
  if (value && typeof value === "object") {
    const out = {};
    Object.keys(value).forEach(k => { out[k] = sanitizeImported(value[k]); });
    return out;
  }
  return value;
}

function isPlausibleSave(data) {
  const p = data && data.player;
  return !!(p && Array.isArray(p.history) && p.team && typeof p.team.name === "string"
    && LEAGUES[p.league] && p.trophies && p.attrs && typeof p.overall === "number");
}

function importCareerFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    let data = null;
    try { data = migrateSave(sanitizeImported(JSON.parse(reader.result))); } catch (e) { data = null; }
    if (!data || !isPlausibleSave(data)) { toast("❌ File non valido: non è un salvataggio di Chosen One (o è di una versione più recente)."); return; }
    activeSlot = targetNewCareerSlot();
    newCareerSlot = null;
    try { localStorage.setItem(saveKeyFor(activeSlot), JSON.stringify(data)); } catch (e) { /* si gioca comunque, senza salvataggio */ }
    toast(`📂 Carriera di ${data.player.firstName} ${data.player.lastName} importata.`);
    resumeCareer(data);
  };
  reader.onerror = () => toast("❌ Impossibile leggere il file.");
  reader.readAsText(file);
}

/* Gli slot di salvataggio nella schermata iniziale: continua, esporta, elimina, oppure scegli
   dove salvare la prossima carriera */
function renderSavedCareerCard() {
  const box = el("save-slots");
  const target = targetNewCareerSlot();
  const saves = SAVE_SLOTS.map(slot => ({ slot, data: loadSavedCareer(slot) }));
  box.innerHTML = saves.map(({ slot, data }) => {
    const isTarget = slot === target;
    if (!data) {
      return `
        <div class="slot-card empty ${isTarget ? "target" : ""}" data-slot="${slot}">
          <div class="slot-num">${slot}</div>
          <div class="slot-body"><div class="slot-name">Slot libero</div>
            <div class="small-muted">${isTarget ? "La nuova carriera verrà salvata qui" : "Disponibile per una nuova carriera"}</div></div>
          ${isTarget ? `<span class="co-chip co-chip--signal">In uso</span>` : `<button class="btn btn-ghost btn-sm" data-slot-target="${slot}">Usa questo</button>`}
        </div>`;
    }
    const p = data.player;
    const status = p.retired ? "Carriera conclusa" : `${p.age} anni · ${p.year} · ${p.team.name} (${LEAGUES[p.league].name})`;
    return `
      <div class="slot-card ${isTarget ? "target" : ""}" data-slot="${slot}">
        <div class="slot-num">${slot}</div>
        <div class="slot-body">
          <div class="slot-name"></div>
          <div class="small-muted">${status} · OVR ${p.overall} · GOAT ${p.goatScore || 0} · ${p.history.length} stagioni · ${getDifficulty(p).label}</div>
          ${isTarget ? `<div class="slot-warn">⚠️ La nuova carriera sovrascriverà questo slot: esportalo prima se vuoi tenerlo.</div>` : ""}
        </div>
        <div class="btn-row slot-actions">
          <button class="btn btn-ghost btn-sm" data-slot-delete="${slot}" aria-label="Elimina lo slot ${slot}" title="Elimina"><svg class="ico" aria-hidden="true"><use href="#i-trash"></use></svg></button>
          <button class="btn btn-ghost btn-sm" data-slot-export="${slot}" aria-label="Esporta lo slot ${slot}" title="Esporta"><svg class="ico" aria-hidden="true"><use href="#i-download"></use></svg></button>
          ${isTarget ? "" : `<button class="btn btn-ghost btn-sm" data-slot-target="${slot}" title="Salva qui la prossima nuova carriera">Sovrascrivi</button>`}
          <button class="btn btn-primary btn-sm" data-slot-resume="${slot}">${p.retired ? "Rivedi" : "Continua"}</button>
        </div>
      </div>`;
  }).join("");
  // i nomi li ha scritti l'utente: testo, non HTML
  saves.forEach(({ slot, data }) => {
    const node = box.querySelector(`[data-slot="${slot}"] .slot-name`);
    if (data && node) node.textContent = `#${data.player.jerseyNumber} ${data.player.firstName} ${data.player.lastName}`;
  });
  box.querySelectorAll("[data-slot-resume]").forEach(b => b.addEventListener("click", () => {
    const slot = parseInt(b.dataset.slotResume);
    const data = loadSavedCareer(slot);
    if (data) { activeSlot = slot; resumeCareer(data); }
  }));
  box.querySelectorAll("[data-slot-export]").forEach(b => b.addEventListener("click", () => {
    const data = loadSavedCareer(parseInt(b.dataset.slotExport));
    if (data) downloadSave(data);
  }));
  box.querySelectorAll("[data-slot-delete]").forEach(b => b.addEventListener("click", () => {
    if (!confirm(`Eliminare definitivamente la carriera nello slot ${b.dataset.slotDelete}?`)) return;
    clearSavedCareer(parseInt(b.dataset.slotDelete));
    renderSavedCareerCard();
  }));
  box.querySelectorAll("[data-slot-target]").forEach(b => b.addEventListener("click", () => {
    newCareerSlot = parseInt(b.dataset.slotTarget);
    renderSavedCareerCard();
  }));
}
