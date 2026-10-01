"use strict";

/* ================================================================
   SALVATAGGIO — la carriera viene salvata nel browser (localStorage) a ogni
   aggiornamento della schermata, insieme al registro della forza delle squadre.
   Tutto lo stato è dato puro: l'unica eccezione sono gli imprevisti estivi in
   sospeso, che contengono funzioni e vengono ricostruiti dal titolo al caricamento.
   ================================================================ */
const LEGACY_SAVE_KEY = "chosenOne.career"; // l'unico salvataggio delle versioni precedenti
const SAVE_SLOTS = [1, 2, 3];
const SAVE_VERSION = 13;
function saveKeyFor(slot) { return `${LEGACY_SAVE_KEY}.${slot}`; }
let activeSlot = 1; // slot della carriera in corso (o di quella che si sta creando)
/* Migrazioni dei salvataggi: SAVE_MIGRATIONS[n] aggiorna sul posto un salvataggio dalla versione n
   alla n+1. Quando si aggiungono o cambiano campi dello stato si alza SAVE_VERSION e si aggiunge
   qui il passo corrispondente, così le carriere salvate con le versioni precedenti restano giocabili. */
/* v13: i nomi di fantasia di squadre e campionati. Nei salvataggi i vecchi nomi diventano i nuovi
   (anche dentro notizie e storico); le squadre di Serie B finite nel secondo girone passano a ITA_B2. */
const LEGACY_TEAM_NAMES = {
  "EuroLeague": "EUROPE-1", "EuroCup": "EUROPE-2", "EuroBasket": "Europeo", "Next Stars": "Oceania Next",
  "Atlanta Hawks": "Georgia Aviators", "Boston Celtics": "Boston Shamrocks", "Brooklyn Nets": "Empire State Hoops",
  "Charlotte Hornets": "Charlotte Swarm", "Chicago Bulls": "Illinois Horns", "Cleveland Cavaliers": "Clev Knights",
  "Dallas Mavericks": "Texas Stallions", "Denver Nuggets": "Denver Miners", "Detroit Pistons": "Motor City Engines",
  "Golden State Warriors": "GS Fighters", "Houston Rockets": "Houston Astronauts", "Indiana Pacers": "Indianapolis Racers",
  "LA Clippers": "LA Sailors", "Los Angeles Lakers": "LA Stars", "Memphis Grizzlies": "Tennessee Bears",
  "Miami Heat": "South Beach Flames", "Milwaukee Bucks": "Milwaukee Antlers", "Minnesota Timberwolves": "Minnie Snowdogs",
  "New Orleans Pelicans": "NOLA Birds", "New York Knicks": "Manhattan Towers", "Oklahoma City Thunder": "OK Storm",
  "Orlando Magic": "Florida Illusionists", "Philadelphia 76ers": "Philly Patriots", "Phoenix Suns": "Arizona Desert Rays",
  "Portland Trail Blazers": "Portland Pioneers", "Sacramento Kings": "SAC Royals", "San Antonio Spurs": "San Antonio Silver",
  "Toronto Raptors": "Toronto Dinos", "Utah Jazz": "Salt Lake Melody", "Washington Wizards": "D.C. Sorcerers",
  "Duke Blue Devils": "Duke Royals", "Kentucky Wildcats": "Kentucky Pumas", "Kansas Jayhawks": "Kansas Falcons",
  "UCLA Bruins": "UCLA Kodiaks", "Gonzaga Bulldogs": "Gonzaga Terriers", "Michigan Wolverines": "Michigan Badgers",
  "Villanova Wildcats": "Villanova Leopards", "Arizona Wildcats": "Arizona Coyotes", "North Carolina Tar Heels": "North Carolina Navigators",
  "Indiana Hoosiers": "Indiana Farmers", "Louisville Cardinals": "Louisville Robins", "Syracuse Orange": "Syracuse Citrus",
  "UConn Huskies": "UConn Malamutes", "Michigan State Spartans": "Michigan State Gladiators", "Florida Gators": "Florida Crocs",
  "Houston Cougars": "Houston Lynxes", "Purdue Boilermakers": "Purdue Engineers", "Baylor Bears": "Baylor Grizzlies",
  "Auburn Tigers": "Auburn Jaguars", "Tennessee Volunteers": "Tennessee Rangers", "Rip City Remix": "Rip City Mashups",
  "Long Island Nets": "Long Island Hoops", "Motor City Cruise": "Motor City Voyage", "Delaware Blue Coats": "Delaware Red Jackets",
  "Sioux Falls Skyforce": "Sioux Falls Airpower", "Milano BiancoRosso": "Milano Rossi", "Bologna BiancoNero": "V nera Bologna",
  "Tortona BiancoNero": "Tortona D", "Cantù BiancoBlu": "Cantù basket", "Udine BiancoNero": "Udine bk",
  "Trento BiancoNero": "Trento Eagles", "Scafati GialloBlu": "Pallacanestro Scafati", "Roma GialloRosso": "M Roma",
  "Roma BiancoBlu": "Roma Basket", "Napoli Azzurro": "Napoli bk", "Varese BiancoRosso": "Varese basket",
  "Reggio Emilia BiancoRosso": "Reggio Basket", "Trieste BiancoRosso": "Trieste V", "Verona GialloBlu": "Verona Scudi",
  "Venezia OroGranata": "Venezia Lions", "Treviso BiancoCeleste": "Treviso UB", "Bologna BiancoBlu": "Forte Bologna",
  "Brindisi BiancoAzzurro": "Stella Brindisi", "Caserta BiancoNero": "Caserta bk", "Cento BiancoRosso": "Cento basket",
  "Cividale GialloBlu": "Friuli basket", "Cremona OroAmaranto": "Cremona Juve", "Forlì BiancoRosso": "Forlì F",
  "Livorno BiancoAmaranto": "Livorno bk", "Mestre BiancoRosso": "M Mestre", "Milano BiancoBlu": "Wildcat Milano",
  "Montecatini Terme RossoBlu": "Montecatini bk", "Pesaro BiancoRosso": "Pesaro basket", "Pistoia BiancoRosso": "Pistoia P",
  "Rieti AmarantoCeleste": "Rieti bk", "Rimini BiancoRosso": "Rimini basket", "Ruvo di Puglia BiancoAzzurro": "Puglia bk",
  "Torino GialloBlu": "Torino T", "Avellino BiancoVerde": "Basket Avellino", "Vigevano GialloBlu": "Vigevano bk",
  "Agrigento BiancoAzzurro": "Agrigento bk", "Casale Monferrato RossoBlu": "Desio bk", "Imola BiancoRosso": "AC Imola",
  "Legnano GialloBlu": "Legnano bk", "Omegna RossoNero": "Fulgor Omegna", "Piacenza BiancoRosso": "Piacenza A",
  "Chiusi BiancoArancio": "Chiusi basket", "Fabriano BiancoBlu": "Fabriano bk", "Faenza BiancoRosso": "Faenza bk",
  "Lucca BiancoRosso": "Lucca bk", "Salerno GranataBianco": "Napoli Est bk", "Jesi BiancoAzzurro": "L Pesaro",
  "Ravenna GialloRosso": "Ravenna basket", "Roseto BiancoBlu": "Roseto bk", "Firenze BiancoViola": "MS Siena",
  "San Severo GialloNero": "San Severo bk", "Real Madrid": "Madrid Royal", "Valencia Basket": "Taronja Valencia",
  "Lenovo Tenerife": "Canarias Tenerife", "Unicaja Málaga": "Costa del Sol Málaga", "FC Barcelona": "Catalunya Blaugrana",
  "Joventut Badalona": "Badalona Verdinegros", "Gran Canaria": "Las Palmas Amarillos", "Baskonia": "Vitoria Gasteiz",
  "UCAM Murcia": "Murcia Universitaria", "Baxi Manresa": "Bages Manresa", "MoraBanc Andorra": "Pyrenees Andorra",
  "Casademont Zaragoza": "Aragon Zaragoza", "Breogán": "Lugo Celeste", "Girona": "Girona Vermell",
  "Hiopos Lleida": "Lleida Terra", "Bilbao Basket": "Bizkaia Bilbao", "San Pablo Burgos": "Burgos Castilla",
  "Real Betis Baloncesto": "Sevilla Verdiblancos", "Nanterre 92": "Hauts-de-Seine 92", "Paris Basketball": "Paris Capitale",
  "Saint-Quentin BB": "Aisne Picardie", "SIG Strasbourg": "Alsace Strasbourg", "SLUC Nancy": "Lorraine Nancy",
  "AS Monaco": "Monte Carlo Roca", "Le Mans Sarthe Basket": "Sarthe Le Mans", "Cholet Basket": "Maine-et-Loire Cholet",
  "JL Bourg": "Ain Bourg", "JDA Dijon": "Bourgogne Dijon", "LDLC ASVEL": "Villeurbanne Lyon",
  "Limoges CSP": "Haute-Vienne Limoges", "Élan Chalon": "Saône Chalon", "Chorale Roanne": "Loire Roanne",
  "Fos Provence Basket": "Provence Sur Mer", "Boulazac Basket Dordogne": "Périgord Boulazac", "Anadolu Efes": "Istanbul Blues",
  "Bahçeşehir Koleji": "Bosphorus College", "Beşiktaş GAIN": "Istanbul Eagles", "Bursaspor": "Bursa Crocodiles",
  "Fenerbahçe Beko": "Istanbul Canaries", "Galatasaray MCT": "Istanbul Lions", "Manisa Basket": "Aegean Manisa",
  "Karşıyaka": "Izmir KSK", "Mersin MSK": "Mediterranean Mersin", "Büyükçekmece Basketbol": "Marmara Büyükçekmece",
  "Petkim Spor": "Aliaga Spor", "Esenler Erokspor": "Istanbul Erok", "Tofaş": "Bursa Auto",
  "Trabzonspor": "Black Sea Trabzon", "Türk Telekom": "Ankara Telecom", "Merkezefendi Belediyesi": "Denizli Merkezefendi",
  "Olympiacos": "Piraeus Reds", "Panathinaikos": "Athens Greens", "AEK Atene": "Athens Yellows",
  "PAOK": "Thessaloniki Blacks", "Aris": "Thessaloniki Gods", "Peristeri": "West Athens Peristeri",
  "Promitheas Patrasso": "Patras Flames", "Kolossos Rodi": "Rhodes Colossus", "Lavrio": "Attica Lavrio",
  "Maroussi": "North Athens Maroussi", "Karditsa": "Thessaly Karditsa", "Panionios": "Nea Smyrni Panthers",
  "Partizan": "Belgrade Black-Whites", "Crvena zvezda": "Belgrade Red Stars", "Dubai Basketball": "Emirates Dubai",
  "Cedevita Olimpija": "Ljubljana Dragons", "Budućnost": "Podgorica Blues", "Cibona": "Zagreb Wolves",
  "Igokea": "Aleksandrovac", "Mega Basket": "Belgrade Pink", "FMP": "Zeleznik Panthers",
  "Split": "Dalmatia Split", "Zadar": "Dalmatia Zadar", "Borac Čačak": "Morava Cacak",
  "Krka": "Novo Mesto", "SC Derby": "Podgorica Students", "Sydney Kings": "Sydney Monarchs",
  "Melbourne United": "Melbourne Alliance", "Perth Wildcats": "Perth Felines", "Brisbane Bullets": "Brisbane Projectiles",
  "Adelaide 36ers": "Adelaide Pioneers", "Illawarra Hawks": "Illawarra Falcons", "Tasmania JackJumpers": "Tasmania Hoppers",
  "New Zealand Breakers": "Auckland Surfers", "Cairns Taipans": "Cairns Serpents", "South East Melbourne Phoenix": "SE Melbourne Firebirds",
  "Guangdong Southern Tigers": "Canton Tigers", "Liaoning Flying Leopards": "Shenyang Leopards", "Zhejiang Lions": "Hangzhou Lions",
  "Beijing Ducks": "Capital Waterfowl", "Shanghai Sharks": "Shanghai Predators", "Shenzhen Leopards": "Shenzhen Panthers",
  "Xinjiang Flying Tigers": "Urumqi Tigers", "Shandong Heroes": "Jinan Heroes", "Beijing Royal Fighters": "Capital Warriors",
  "Guangzhou Loong Lions": "Canton Dragons", "Qingdao Eagles": "Qingdao Birds", "Nanjing Monkey Kings": "Nanjing Primates",
  "Fujian Sturgeons": "Fujian Fishes", "Tianjin Pioneers": "Tianjin Trailblazers", "Finali NBA": "Finali USA-1",
};
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
  12(data) {
    const olds = Object.keys(LEGACY_TEAM_NAMES).sort((x, y) => y.length - x.length);
    const fix = str => {
      if (LEGACY_TEAM_NAMES[str]) return LEGACY_TEAM_NAMES[str];
      let out = str;
      for (const o of olds) if (out.includes(o)) out = out.split(o).join(LEGACY_TEAM_NAMES[o]);
      return out;
    };
    const walk = v => {
      if (typeof v === "string") return fix(v);
      if (Array.isArray(v)) return v.map(walk);
      if (v && typeof v === "object") { const o = {}; Object.keys(v).forEach(k => { o[fix(k)] = walk(v[k]); }); return o; }
      return v;
    };
    ["player", "teamStrengthRegistry", "teamStaffRegistry"].forEach(k => { if (data[k]) data[k] = walk(data[k]); });
    // Serie B divisa in due gironi: chi gioca in una squadra del secondo passa a ITA_B2
    const inB2 = team => team && LEAGUES.ITA_B2.teams.some(t => t.name === team.name);
    const p = data.player;
    if (p.league === "ITA_B" && inB2(p.team)) p.league = "ITA_B2";
    if (p.pendingSeason && p.pendingSeason.seasonLeague === "ITA_B" && inB2(p.pendingSeason.team)) p.pendingSeason.seasonLeague = "ITA_B2";
    (p.history || []).forEach(h => { if (h.league === "ITA_B" && inB2(h.team)) h.league = "ITA_B2"; });
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
  switchGameTab("panoramica");
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
    if (!data || !isPlausibleSave(data)) { toast("❌ File non valido: non è un salvataggio di F3NOM (o è di una versione più recente)."); return; }
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
