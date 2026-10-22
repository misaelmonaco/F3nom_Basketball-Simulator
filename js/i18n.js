"use strict";

/* ================================================================
   INTERNAZIONALIZZAZIONE (i18n) — Italiano ("it") e Inglese ("en").
   Funziona senza server (anche aprendo index.html via file://) e in Node (test).
   ================================================================ */
const LANG_KEY = "chosenOne.lang";
const SUPPORTED_LANGS = ["it", "en"];

function currentLang() {
  try {
    const v = localStorage.getItem(LANG_KEY);
    return SUPPORTED_LANGS.includes(v) ? v : "it";
  } catch (e) {
    return "it";
  }
}

function isEn() {
  return currentLang() === "en";
}

/* Helper rapido inline per stringhe bilingui: tr("Testo IT", "Text EN") */
function tr(itText, enText) {
  return isEn() ? enText : itText;
}

/* Trasforma ogni oggetto (o array/mappa di oggetti) che contiene coppie <prop> + <prop>En
   in modo che <prop> restituisca automaticamente <prop>En quando la lingua è "en" e <prop>It altrimenti. */
function i18nify(target) {
  if (!target || typeof target !== "object") return target;
  if (Array.isArray(target)) {
    target.forEach(i18nify);
    return target;
  }
  const keys = Object.keys(target);
  keys.forEach(k => {
    if (k.endsWith("En") && k.length > 2) {
      const base = k.slice(0, -2);
      if (base in target) {
        const itKey = `${base}It`;
        if (!(itKey in target)) target[itKey] = target[base];
        Object.defineProperty(target, base, {
          enumerable: true,
          configurable: true,
          get() { return isEn() && this[k] != null ? this[k] : this[itKey]; },
          set(v) { this[itKey] = v; },
        });
      }
    } else if (target[k] && typeof target[k] === "object") {
      i18nify(target[k]);
    }
  });
  return target;
}

/* Dizionario chiave -> { it, en } per l'interfaccia statica di index.html e le etichette condivise */
const I18N_DICT = {
  // Home & Hub
  "home.subtitle": {
    it: "Sedici anni, un pallone e una città alle spalle. Sei passi per decidere chi sarà.",
    en: "Sixteen years old, a ball, and a city behind you. Six steps to decide who you will become."
  },
  "home.achievements_btn": { it: "Traguardi e albo d'oro", en: "Achievements & Hall of Records" },
  "home.your_careers": { it: "Le tue carriere", en: "Your Careers" },
  "home.import_file": { it: "Importa da file", en: "Import from file" },
  "home.play_scenario": { it: "Gioca<br>Scenario", en: "Play<br>Scenario" },
  "home.scenarios": { it: "Scenari", en: "Scenarios" },
  "home.new_career_1": { it: "Nuova", en: "New" },
  "home.new_career_2": { it: "Carriera", en: "Career" },

  // Creazione Wizard
  "wizard.strap_tag": { it: "Nuova carriera", en: "New Career" },
  "wizard.strap_title": { it: "Crea il tuo prescelto", en: "Create Your Chosen One" },
  "wizard.strap_sub": {
    it: "Sedici anni, un pallone e una città alle spalle. Sei passi per decidere chi sarà.",
    en: "Sixteen years old, a ball, and a city behind you. Six steps to decide who you will become."
  },
  "wizard.main_menu": { it: "Menu Principale", en: "Main Menu" },
  "wizard.identity_title": { it: "Identità Giocatore", en: "Player Identity" },
  "wizard.first_name": { it: "Nome", en: "First Name" },
  "wizard.first_name_ph": { it: "es. Marco", en: "e.g. Marcus" },
  "wizard.last_name": { it: "Cognome", en: "Last Name" },
  "wizard.last_name_ph": { it: "es. Rossi", en: "e.g. Carter" },
  "wizard.random_name": { it: "🎲 Genera nome casuale", en: "🎲 Generate Random Name" },
  "wizard.look_title": { it: "Aspetto", en: "Appearance" },
  "wizard.custom_mode_title": { it: "Modalità Personalizzata", en: "Custom Mode" },
  "wizard.custom_mode_desc": {
    it: "Scegli liberamente squadra, overall e potenziale di partenza (invece della generazione casuale)",
    en: "Freely choose starting team, overall, and potential (instead of random scouting)"
  },
  "wizard.nat_title": { it: "Nazionalità e città natale", en: "Nationality & Hometown" },
  "wizard.nat_label": { it: "Nazionalità", en: "Nationality" },
  "wizard.hometown_label": { it: "Città natale", en: "Hometown" },
  "wizard.difficulty_title": { it: "Difficoltà", en: "Difficulty" },
  "wizard.position_title": { it: "Posizione", en: "Position" },
  "wizard.archetype_title": { it: "Archetipo", en: "Archetype" },
  "wizard.archetype_hint": {
    it: "Seleziona prima una posizione per vedere gli archetipi disponibili.",
    en: "Select a position on the court first to view available archetypes."
  },
  "wizard.physical_title": { it: "Fisico", en: "Frame & Measurements" },
  "wizard.height_label": { it: "Altezza", en: "Height" },
  "wizard.weight_label": { it: "Peso", en: "Weight" },
  "wizard.body_hint": {
    it: "Altezza e peso influenzano l'overall iniziale e gli attributi fisici. Seleziona un ruolo per impostare il range.",
    en: "Height and weight affect your starting overall and physical attributes. Select a position to set the range."
  },
  "wizard.hand_title": { it: "Mano dominante", en: "Dominant Hand" },
  "wizard.bodytype_title": { it: "Corporatura", en: "Body Type" },
  "wizard.traits_title": { it: "Carattere", en: "Personality Traits" },
  "wizard.traits_hint": {
    it: "Fino a due tratti, facoltativi: cambiano come ti vedono spogliatoio, coach, media e società.",
    en: "Up to two optional traits: they shape how locker room, coaches, media, and front offices see you."
  },
  "wizard.youth_training_title": { it: "Allenamento giovanile", en: "Youth Training" },
  "wizard.youth_training_hint": {
    it: "Su cosa hai lavorato da ragazzo? Sposta qualche punto tra gli attributi: lo scouting partirà da qui.",
    en: "What did you work on growing up? Shift a few points between attributes: your scouting report starts here."
  },
  "wizard.path_title": { it: "Percorso di Partenza", en: "Starting Path" },
  "wizard.back": { it: "← Indietro", en: "← Back" },
  "wizard.surprise_me": { it: "Sorprendimi", en: "Surprise Me" },
  "wizard.surprise_me_title": {
    it: "Estrae a caso tutte le scelte della creazione (la difficoltà resta quella scelta)",
    en: "Randomizes all creation choices (keeps your selected difficulty)"
  },
  "wizard.next": { it: "Avanti →", en: "Next →" },

  // Traguardi & Scenari
  "ach.tag": { it: "Traguardi e albo d'oro", en: "Achievements & Hall of Records" },
  "ach.title": { it: "Traguardi", en: "Achievements" },
  "scen.tag": { it: "Scenari", en: "Scenarios" },
  "scen.unlock_all": { it: "🔓 Sblocca tutti", en: "🔓 Unlock All" },
  "scen.unlock_all_title": {
    it: "Sblocca tutti gli scenari per provarli subito",
    en: "Unlock all scenarios to play them right away"
  },
  "scen.desc": {
    it: "Carriere con un punto di partenza fissato e un obiettivo preciso. Si sbloccano uno dopo l'altro: se fallisci, la carriera finisce e puoi riprovare.",
    en: "Careers with a fixed starting point and a specific goal. Unlock them one after another: if you fail, the career ends and you can retry."
  },

  // Onboarding
  "onb.tag": { it: "Ultimi dettagli", en: "Final Details" },
  "onb.scouting_title": { it: "Il rapporto degli scout", en: "Scouting Report" },
  "onb.custom_ratings_title": { it: "Overall & Potenziale di partenza", en: "Starting Overall & Potential" },
  "onb.custom_ratings_desc": {
    it: "Modalità personalizzata attiva: imposta liberamente il punto di partenza del tuo giocatore.",
    en: "Custom mode active: freely set your player's starting ratings."
  },
  "onb.potential": { it: "Potenziale", en: "Potential" },
  "onb.choose_team": { it: "Scegli la tua Squadra", en: "Choose Your Team" },
  "onb.jersey_number": { it: "Numero di Maglia", en: "Jersey Number" },
  "onb.custom_number": { it: "Numero personalizzato (0-99)", en: "Custom number (0-99)" },
  "onb.start_career": { it: "Inizia Carriera 🚀", en: "Start Career 🚀" },

  // Schede Dashboard (Tabs)
  "tab.panoramica": { it: "Panoramica", en: "Overview" },
  "tab.carriera": { it: "Carriera", en: "Career" },
  "tab.statistiche": { it: "Statistiche", en: "Stats" },
  "tab.trofei": { it: "Trofei", en: "Trophies" },
  "tab.social": { it: "Social", en: "Social" },
  "tab.lifestyle": { it: "Lifestyle", en: "Lifestyle" },
  "tab.profilo": { it: "Scheda", en: "Profile" },

  // Cards Dashboard
  "card.watch_out": { it: "Da tenere d'occhio", en: "Watch Out" },
  "card.career_dream": { it: "Il tuo sogno", en: "Your Dream" },
  "card.season_goals": { it: "Obiettivi della stagione", en: "Season Goals" },
  "card.attributes": { it: "Attributi", en: "Attributes" },
  "card.how_you_feel": { it: "Come stai", en: "Condition & Mindset" },
  "card.the_team": { it: "La squadra", en: "The Team" },
  "card.latest_news": { it: "Ultime notizie", en: "Latest News" },
  "card.player_sheet": { it: "Scheda Giocatore", en: "Player Profile" },
  "card.wealth_sponsors": { it: "Patrimonio e sponsor", en: "Net Worth & Sponsors" },
  "card.season_summary": { it: "Riepilogo Stagione", en: "Season Summary" },
  "card.season_summary_empty": {
    it: "Premi \"Avanza Stagione\" per iniziare la tua carriera.",
    en: "Press \"Play Season\" to begin your career."
  },
  "card.news": { it: "Notizie", en: "News Feed" },
  "card.standings": { it: "Classifica", en: "Standings" },
  "card.career_trend": { it: "Andamento Carriera", en: "Career Progression" },
  "card.career_totals": { it: "Totali e medie di carriera", en: "Career Totals & Averages" },
  "card.career_records": { it: "Record Personali", en: "Career Highs" },
  "card.season_history": { it: "Storico Stagioni", en: "Season History" },
  "card.season_by_season": { it: "Stagione per stagione", en: "Season by Season" },
  "tbl.age": { it: "Età", en: "Age" },
  "tbl.year": { it: "Anno", en: "Year" },
  "tbl.team": { it: "Squadra", en: "Team" },
  "tbl.league": { it: "Lega", en: "League" },
  "tbl.gp_title": { it: "Partite giocate / in calendario", en: "Games played / scheduled" },
  "tbl.notes": { it: "Note", en: "Notes" },
  "card.trophy_room": { it: "Sala dei trofei", en: "Trophy Room" },
  "card.palmares": { it: "Palmarès", en: "Honors & Titles" },
  "card.award_history": { it: "Cronologia Premi", en: "Award History" },
  "card.career_achievements": { it: "Traguardi della carriera", en: "Career Achievements" },
  "card.back_to_overview": { it: "← Torna a Panoramica", en: "← Back to Overview" },

  // Offseason Topbar
  "off.peek_dashboard": { it: "Dashboard", en: "Dashboard" },
  "off.peek_title": {
    it: "Guarda statistiche, classifica e profilo, poi torna qui",
    en: "View stats, standings, and profile, then return here"
  },
  "off.eyebrow_default": { it: "PRE-STAGIONE", en: "OFFSEASON" },

  // Fine Carriera
  "final.completed": { it: "CARRIERA CONCLUSA", en: "CAREER COMPLETED" },
  "final.career_averages": { it: "Statistiche di Carriera (Medie)", en: "Career Statistics (Averages)" },
  "final.career_totals": { it: "Totali di Carriera", en: "Career Totals" },
  "final.legacy": { it: "Eredità", en: "Legacy" },
  "final.biography": { it: "Biografia", en: "Biography" },
  "final.after_retirement": { it: "Dopo il ritiro", en: "After Retirement" },
  "final.achievements": { it: "Traguardi", en: "Achievements" },
  "final.final_palmares": { it: "Palmarès Finale", en: "Final Honors" },
  "final.full_history": { it: "Storico Completo", en: "Full Career History" },
  "final.share": { it: "📸 Condividi la carriera", en: "📸 Share Career" },
  "final.legacy_continue": { it: "👨‍👦 Continua la dinastia", en: "👨‍👦 Continue Dynasty" },
  "final.new_career": { it: "🔄 Nuova Carriera", en: "🔄 New Career" },

  // Footer & Overlays
  "footer.kofi": { it: "Offrimi un caffè su Ko-fi", en: "Buy me a coffee on Ko-fi" },
  "footer.whatsnew": { it: "Novità", en: "What's New" },
  "footer.feedback": { it: "Invia un parere", en: "Send Feedback" },
  "trophy.continue": { it: "Continua", en: "Continue" },
  "dialog.close": { it: "Chiudi", en: "Close" },
};

function t(key, params) {
  const lang = currentLang();
  const entry = I18N_DICT[key];
  let str = entry ? (entry[lang] != null ? entry[lang] : entry.it) : key;
  if (params && typeof str === "string") {
    Object.keys(params).forEach(k => {
      str = str.split(`{${k}}`).join(params[k]);
    });
  }
  return str;
}

/* Imposta il testo di un nodo preservando un eventuale <svg> iniziale */
function setNodeTranslatedText(node, text, useHtml) {
  if (!node) return;
  if (useHtml) {
    const svg = node.querySelector && node.querySelector("svg.ico");
    if (svg) {
      node.innerHTML = svg.outerHTML + " " + text;
    } else {
      node.innerHTML = text;
    }
    return;
  }
  const svg = node.querySelector && node.querySelector("svg.ico");
  const badge = node.querySelector && node.querySelector(".badge");
  if (svg && badge) {
    node.innerHTML = `${svg.outerHTML} ${text} ${badge.outerHTML}`;
  } else if (svg) {
    node.innerHTML = `${svg.outerHTML} ${text}`;
  } else {
    node.textContent = text;
  }
}

/* Traduce tutti gli elementi statici con attributi data-i18n* in index.html */
function applyStaticI18n() {
  if (typeof document === "undefined" || typeof document.querySelectorAll !== "function") return;
  if (document.documentElement) {
    document.documentElement.lang = currentLang();
  }
  document.querySelectorAll("[data-i18n]").forEach(node => {
    const key = node.dataset.i18n;
    if (key && I18N_DICT[key]) {
      setNodeTranslatedText(node, t(key), false);
    }
  });
  document.querySelectorAll("[data-i18n-html]").forEach(node => {
    const key = node.dataset.i18nHtml;
    if (key && I18N_DICT[key]) {
      setNodeTranslatedText(node, t(key), true);
    }
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(node => {
    const key = node.dataset.i18nPlaceholder;
    if (key && I18N_DICT[key]) node.placeholder = t(key);
  });
  document.querySelectorAll("[data-i18n-title]").forEach(node => {
    const key = node.dataset.i18nTitle;
    if (key && I18N_DICT[key]) node.title = t(key);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach(node => {
    const key = node.dataset.i18nAria;
    if (key && I18N_DICT[key]) node.setAttribute("aria-label", t(key));
  });
}

/* Aggiorna i pulsanti [data-lang-toggle] */
function updateLangButtons() {
  if (typeof document === "undefined" || typeof document.querySelectorAll !== "function") return;
  const en = isEn();
  const code = en ? "EN" : "IT";
  const full = en ? "Language: English" : "Lingua: Italiano";
  const tip = en ? "Switch language to Italian (IT)" : "Passa alla lingua inglese (EN)";
  document.querySelectorAll("[data-lang-toggle]").forEach(b => {
    const mode = b.dataset.langToggle;
    b.innerHTML = `<svg class="ico" aria-hidden="true"><use href="#i-globe"></use></svg> ${mode === "label" ? full : code}`;
    b.setAttribute("aria-label", tip);
    b.title = tip;
    if (!b._langBound && typeof b.addEventListener === "function") {
      b._langBound = true;
      b.addEventListener("click", evt => {
        evt.stopPropagation();
        toggleLanguage();
      });
    }
  });
}

/* Applica la lingua corrente a tutta l'interfaccia statica e dinamica */
function applyLanguage() {
  applyStaticI18n();
  updateLangButtons();
  if (typeof updateThemeButtons === "function") updateThemeButtons();
  if (typeof updateSoundButtons === "function") updateSoundButtons();
  if (typeof renderSavedCareerCard === "function" && typeof el === "function" && el("save-slots")) {
    renderSavedCareerCard();
  }
  if (typeof renderDifficultyGrid === "function" && typeof el === "function" && el("grid-difficulty")) {
    renderDifficultyGrid();
  }
  if (typeof renderIdentityGrids === "function" && typeof el === "function" && el("look-editor")) {
    renderIdentityGrids();
  }
  if (typeof renderArchetypeGrid === "function" && typeof selRole !== "undefined" && typeof el === "function" && el("grid-archetype")) {
    renderArchetypeGrid(selRole);
  }
  if (typeof renderWizard === "function" && typeof el === "function" && el("wizard-steps")) {
    renderWizard();
  }
  if (typeof pendingCreation !== "undefined" && pendingCreation && typeof renderOnboardingScreen === "function" && typeof el === "function" && el("screen-onboarding") && !el("screen-onboarding").classList.contains("hidden")) {
    renderOnboardingScreen();
  }
  if (typeof player !== "undefined" && player) {
    if (player.retired && typeof renderFinalScreen === "function") {
      renderFinalScreen();
    } else if (typeof renderGameScreen === "function") {
      renderGameScreen();
    }
  }
}

function setLanguage(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* storage non disponibile */ }
  applyLanguage();
  if (typeof toast === "function") {
    toast(lang === "en" ? "Language set to English" : "Lingua impostata su Italiano");
  }
}

function toggleLanguage() {
  setLanguage(isEn() ? "it" : "en");
}
