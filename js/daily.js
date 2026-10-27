"use strict";

/* ================================================================
   F3NOM DAILY — MODALITÀ SFIDA DEL GIORNO
   Una stagione lampo al giorno con uno scenario tematico unico,
   seed deterministico basato sulla data, tracciamento dello streak 🔥,
   valutazione delle performance (Grado S/A/B/C/F) e card condivisibile.
   ================================================================ */

const DAILY_STORAGE_KEY = "f3nom.daily.data";
const DAILY_SESSION_KEY = "f3nom.daily.session";

/* Hash deterministico per convertire una data "YYYY-MM-DD" in un intero a 32 bit */
function dailyDateToSeed(dateStr) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < dateStr.length; i++) {
    hash ^= dateStr.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/* Generatore pseudocasuale deterministico Mulberry32 per la Daily */
function createDailyRng(seed) {
  let a = seed >>> 0;
  function next() {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  return {
    random: next,
    randInt(min, max) { return Math.floor(next() * (max - min + 1)) + min; },
    choice(arr) { return arr && arr.length ? arr[Math.floor(next() * arr.length)] : null; },
  };
}

/* Data locale corrente nel formato YYYY-MM-DD */
function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/* Formattazione data amichevole (es. "27 Ottobre 2026") */
function formatDailyDateFriendly(dateStr) {
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const monthsIt = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
    const monthsEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const months = typeof isEn === "function" && isEn() ? monthsEn : monthsIt;
    return `${d} ${months[m - 1]} ${y}`;
  } catch (e) {
    return dateStr;
  }
}

/* Stato persistente della modalità Daily (Streak, record, storico) */
function getDailyData() {
  try {
    const raw = localStorage.getItem(DAILY_STORAGE_KEY);
    if (!raw) return { streak: 0, bestStreak: 0, lastDate: null, history: {} };
    const parsed = JSON.parse(raw);
    return {
      streak: Number(parsed.streak) || 0,
      bestStreak: Number(parsed.bestStreak) || 0,
      lastDate: parsed.lastDate || null,
      history: parsed.history || {},
    };
  } catch (e) {
    return { streak: 0, bestStreak: 0, lastDate: null, history: {} };
  }
}

function saveDailyData(data) {
  try {
    localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {}
}

/* Registra la vittoria o la chiusura della sfida Daily di oggi e aggiorna lo streak */
function recordDailyResult(result) {
  const data = getDailyData();
  const today = result.dateStr || getTodayDateString();
  const prevDate = data.lastDate;

  // Calcolo streak: se l'ultimo completamento è ieri, streak++; altrimenti riparte da 1 (se vinto)
  let isConsecutive = false;
  if (prevDate) {
    const prev = new Date(prevDate);
    const curr = new Date(today);
    const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) isConsecutive = true;
  }

  const alreadyCompletedToday = !!(data.history && data.history[today] && data.history[today].completed);

  if (!alreadyCompletedToday) {
    if (result.won) {
      data.streak = isConsecutive ? data.streak + 1 : 1;
    } else {
      data.streak = 0; // fallito l'obiettivo del giorno
    }
    data.bestStreak = Math.max(data.bestStreak, data.streak);
    data.lastDate = today;
  }

  data.history = data.history || {};
  data.history[today] = {
    date: today,
    archetypeId: result.archetypeId,
    title: result.title,
    won: !!result.won,
    grade: result.grade,
    score: result.score,
    completed: true,
  };

  saveDailyData(data);
  return data;
}

/* ================================================================
   ARCHETIPI GIORNALIERI (Daily Archetypes)
   ================================================================ */
const DAILY_ARCHETYPES = [
  {
    id: "aclReturn",
    badge: "🚑",
    title: "Rientro dal Crociato",
    titleEn: "ACL Comeback",
    tagline: "Stagione saltata, 8 mesi di riabilitazione: rientri per l'ultimo tratto e i Playoff.",
    taglineEn: "Missed the season after 8 months of rehab: you return for the final push and playoffs.",
    league: "NBA",
    startAge: 27,
    ovrRange: [88, 92],
    condition: { fragility: 70, stamina: 54, morale: 80, chemistry: 60 },
    role: "SF",
    goal: "Conquista il Titolo USA-1 nei Playoff da protagonista.",
    goalEn: "Win the USA-1 Championship in the playoffs as a franchise leader.",
    checkGoal: (p, rec) => !!(rec && rec.champion),
    story: "La rottura del legamento crociato ha rischiato di cancellare i tuoi sogni di gloria. Dopo mesi di lavoro solitario in palestra, i medici ti danno il via libera: la squadra ti aspetta per il grande ballo dei Playoff. Riuscirai a reggere il ritmo e vincere l'anello?",
    storyEn: "A torn ACL nearly derailed your championship window. After months of grueling rehab, team doctors finally cleared you: your teammates need you for the playoff run. Can you lead them all the way to the ring?",
    setup(p, rng) {
      p.currentTeamRole = "star";
      p.reputation = 85;
      p.popularity = 82;
      p.fragility = 70;
      p.stamina = 54;
      p.morale = 80;
      p.chemistry = 62;
    }
  },
  {
    id: "midseasonSave",
    badge: "🛡️",
    title: "Missione Salvezza",
    titleEn: "Relegation Dogfight",
    tagline: "Arrivi a metà stagione con la squadra al penultimo posto: servono vittorie disperate.",
    taglineEn: "Signed midseason with the club in the relegation zone: desperate wins needed.",
    league: "ITA_LBA",
    startAge: 24,
    ovrRange: [78, 83],
    condition: { fragility: 40, stamina: 75, morale: 45, chemistry: 40 },
    role: "PG",
    goal: "Evita la retrocessione chiudendo almeno al 14° posto o centrate un miracoloso playoff.",
    goalEn: "Avoid relegation by finishing 14th or higher, or reach the playoffs.",
    checkGoal: (p, rec) => !!(rec && (!rec.relegated && (rec.rank == null || rec.rank <= 14))),
    story: "La dirigenza ti ingaggia per un salvataggio d'emergenza. Lo spogliatoio è spaccato e la classifica piange. Sei la guida designata: ogni possesso vale la permanenza nella massima serie.",
    storyEn: "Management brought you in on an emergency rescue mission. The locker room is split and the standings are grim. You are the floor general: every single possession counts toward survival.",
    setup(p, rng) {
      p.currentTeamRole = "starter";
      p.reputation = 68;
      p.popularity = 50;
      p.morale = 50;
      p.chemistry = 40;
    }
  },
  {
    id: "marchMadness",
    badge: "🎓",
    title: "March Madness",
    titleEn: "March Madness",
    tagline: "Ultimo anno al College: dentro o fuori a ogni turno nel torneo NCAA.",
    taglineEn: "Senior year in College: single-elimination madness every round.",
    league: "NCAA",
    startAge: 21,
    ovrRange: [75, 80],
    condition: { fragility: 30, stamina: 85, morale: 90, chemistry: 80 },
    role: "SG",
    goal: "Raggiungi almeno la Finale del Torneo Universitario (o vinci il Titolo NCAA).",
    goalEn: "Reach at least the National Championship Game (or win the NCAA Title).",
    checkGoal: (p, rec) => !!(rec && (rec.champion || (rec.playoffResult && (rec.playoffResult.includes("Finale") || rec.playoffResult.includes("Final"))))),
    story: "È il mese di Marzo. La nazione intera ha gli occhi puntati sul tabellone a 64 squadre. Un solo passo falso e la tua carriera collegiale è finita per sempre; sei vittorie e sarai immortale.",
    storyEn: "It's March. The entire nation is watching the 64-team bracket. One bad game and your college career is over; six straight wins and you become a collegiate legend.",
    setup(p, rng) {
      p.currentTeamRole = "star";
      p.reputation = 72;
      p.popularity = 65;
      p.morale = 85;
      p.chemistry = 80;
    }
  },
  {
    id: "euroUnderdog",
    badge: "💥",
    title: "Cenerentola d'Europa",
    titleEn: "European Cinderella",
    tagline: "Matricola senza budget nella Liga spagnola: smentite i pronostici e andate ai Playoff.",
    taglineEn: "Underdog club in the Spanish League: defy the odds and reach the Playoffs.",
    league: "ESP_ACB",
    startAge: 22,
    ovrRange: [76, 81],
    condition: { fragility: 35, stamina: 80, morale: 70, chemistry: 75 },
    role: "PF",
    goal: "Qualificatevi ai Playoff (chiudete tra le prime 8 squadre del campionato).",
    goalEn: "Qualify for the Playoffs (finish in the top 8 of the standings).",
    checkGoal: (p, rec) => !!(rec && (rec.playoffRounds || (rec.rank && rec.rank <= 8))),
    story: "I media spagnoli vi davano per retrocessi già ad agosto. Con grinta, difesa feroce e il tuo talento sotto canestro, state ribaltando ogni pronostico. Serve la spallata decisiva per entrare nelle prime 8.",
    storyEn: "Spanish media had your club marked for last place in August. With relentless grit, defense, and your inside scoring, you're stunning the league. You need one final push for top-8.",
    setup(p, rng) {
      p.currentTeamRole = "starter";
      p.reputation = 65;
      p.popularity = 55;
      p.morale = 75;
      p.chemistry = 78;
    }
  },
  {
    id: "allInContender",
    badge: "👑",
    title: "Tutto o Niente",
    titleEn: "All-In Contender",
    tagline: "Superteam costruito per vincere subito. Pressioni massime: o anello o disastro.",
    taglineEn: "Superteam assembled to win it all now. Championship or bust.",
    league: "NBA",
    startAge: 28,
    ovrRange: [91, 95],
    condition: { fragility: 50, stamina: 78, morale: 75, chemistry: 65 },
    role: "C",
    goal: "Conquista il Titolo USA-1 e chiudi la stagione da Campione.",
    goalEn: "Win the USA-1 Championship and finish the year holding the trophy.",
    checkGoal: (p, rec) => !!(rec && rec.champion),
    story: "La dirigenza ha ipotecato il futuro della franchigia scambiando tutte le scelte per formare questo roster. Tutta la stampa aspetta solo un tuo passo falso. Devi portare l'anello a casa.",
    storyEn: "The front office traded away the next decade of draft picks to build this roster. The critics are waiting for you to fail. Bring the championship home.",
    setup(p, rng) {
      p.currentTeamRole = "star";
      p.reputation = 92;
      p.popularity = 90;
      p.morale = 80;
      p.chemistry = 70;
    }
  }
];

if (typeof i18nify === "function") i18nify(DAILY_ARCHETYPES);

/* Genera la sfida Daily per una specifica data (deterministica al 100%) */
function buildDailyChallenge(dateStr = getTodayDateString()) {
  const seed = dailyDateToSeed(dateStr);
  const rng = createDailyRng(seed);

  // Selezione deterministica dell'archetipo
  const archetypeIdx = Math.abs(seed) % DAILY_ARCHETYPES.length;
  const arch = DAILY_ARCHETYPES[archetypeIdx];

  // Campionato e squadra
  const leagueId = arch.league;
  const leagueData = LEAGUES[leagueId];
  let teamPool = [...(leagueData ? leagueData.teams : [])];
  if (arch.id === "midseasonSave") {
    // Sceglie una squadra nelle posizioni basse
    teamPool = teamPool.slice(Math.max(0, teamPool.length - 5));
  } else if (arch.id === "allInContender" || arch.id === "aclReturn") {
    // Sceglie una squadra forte
    teamPool = teamPool.slice(0, Math.min(6, teamPool.length));
  }
  const team = rng.choice(teamPool) || teamPool[0];

  // Nazionalità e nome coerenti
  const nationality = leagueId === "NBA" || leagueId === "NCAA" ? (rng.random() < 0.75 ? "USA" : "Canada") : (leagueData.country || "Italia");
  const nameObj = typeof randomNameFor === "function" ? randomNameFor(nationality) : { first: "Alex", last: "Rivera" };

  // Ruolo e attributi
  const role = arch.role || "SG";
  const archetypeList = ARCHETYPES_BY_ROLE[role] || [];
  const archetypeObj = rng.choice(archetypeList) || archetypeList[0];

  const ovr = rng.randInt(arch.ovrRange[0], arch.ovrRange[1]);
  const pot = Math.max(ovr, rng.randInt(ovr, Math.min(99, ovr + 6)));
  const jerseyNumber = rng.randInt(0, 35);

  return {
    dateStr,
    seed,
    archetypeId: arch.id,
    badge: arch.badge,
    title: arch.title,
    titleEn: arch.titleEn,
    tagline: arch.tagline,
    taglineEn: arch.taglineEn,
    story: arch.story,
    storyEn: arch.storyEn,
    goal: arch.goal,
    goalEn: arch.goalEn,
    leagueId,
    team,
    role,
    archetypeObj,
    nationality,
    firstName: nameObj.first,
    lastName: nameObj.last,
    jerseyNumber,
    age: arch.startAge || 24,
    overall: ovr,
    potential: pot,
    condition: arch.condition,
    checkGoal: arch.checkGoal,
    setupHook: arch.setup,
  };
}

/* ================================================================
   CALCOLO PUNTEGGIO & GRADO DELLA SFIDA DAILY
   ================================================================ */
function evaluateDailyPerformance(p) {
  if (!p || !p.dailyMeta) return { score: 0, grade: "F", won: false };
  const meta = p.dailyMeta;
  const arch = DAILY_ARCHETYPES.find(a => a.id === meta.archetypeId);
  const rec = p.history[p.history.length - 1];

  let score = 0;
  const won = arch && typeof arch.checkGoal === "function" ? arch.checkGoal(p, rec) : !!(rec && rec.champion);

  // Base per obiettivo primario
  if (won) score += 500;
  else score += 150;

  if (rec) {
    // Rendimento vittorie di squadra
    const winPct = rec.games ? (rec.wins / rec.games) : 0.5;
    score += Math.round(winPct * 180);

    // Titolo o playoff
    if (rec.champion) score += 150;
    else if (rec.playoffRounds) score += 70;

    // Statistiche individuali
    score += Math.min(100, Math.round(rec.pts * 2.8));
    score += Math.min(50, Math.round((rec.reb + rec.ast) * 3));

    // Riconoscimenti
    if (rec.mvp) score += 100;
    if (rec.allLeague) score += 40;
    if (rec.finalsMvp) score += 80;
  }

  // Momenti clutch (minigiochi vinti)
  if (p.clutch && p.clutch.attempts > 0) {
    const clutchSuccess = p.clutch.made / p.clutch.attempts;
    score += Math.round(clutchSuccess * 60);
  }

  score = clamp(score, 0, 1000);

  let grade = "F";
  if (score >= 850) grade = "S";
  else if (score >= 700) grade = "A";
  else if (score >= 550) grade = "B";
  else if (score >= 400) grade = "C";

  return { score, grade, won, dateStr: meta.dateStr, archetypeId: meta.archetypeId, title: meta.title };
}

/* ================================================================
   AVVIO DELLA SFIDA DAILY
   ================================================================ */
function startDailyCareer(challenge = buildDailyChallenge()) {
  const pArgs = {
    firstName: challenge.firstName,
    lastName: challenge.lastName,
    nationality: challenge.nationality,
    role: challenge.role,
    archetypeId: challenge.archetypeObj ? challenge.archetypeObj.id : "balanced",
    height: 196,
    weight: 95,
    path: getPath("USA_HS"),
    leagueId: challenge.leagueId,
    team: challenge.team,
    jerseyNumber: challenge.jerseyNumber,
    customOverall: challenge.overall,
    customPotential: challenge.potential,
    difficulty: "normal",
  };

  resetTeamStrengths();
  player = newPlayerState(pArgs);
  player.age = challenge.age;
  player.startAge = challenge.age;
  player.isDaily = true;
  player.dailyMeta = {
    dateStr: challenge.dateStr,
    archetypeId: challenge.archetypeId,
    title: challenge.title,
    goal: challenge.goal,
  };

  // Applicazione condizioni e modificatori specifici dello scenario
  if (challenge.condition) {
    if (challenge.condition.fragility != null) player.fragility = challenge.condition.fragility;
    if (challenge.condition.stamina != null) player.stamina = challenge.condition.stamina;
    if (challenge.condition.morale != null) player.morale = challenge.condition.morale;
    if (challenge.condition.chemistry != null) player.chemistry = challenge.condition.chemistry;
  }

  if (typeof challenge.setupHook === "function") {
    challenge.setupHook(player, createDailyRng(challenge.seed));
  }

  // Salvataggio dedicato della sessione Daily (non tocca gli slot normali)
  try {
    localStorage.setItem(DAILY_SESSION_KEY, JSON.stringify({ player, dateStr: challenge.dateStr }));
  } catch (e) {}

  // Navigazione e avvio del gioco
  el("screen-create").classList.add("hidden");
  if (el("screen-daily")) el("screen-daily").classList.add("hidden");
  el("screen-game").classList.remove("hidden");
  switchGameTab("panoramica");
  renderGameScreen();

  toast(tr(`🏀 F3nom Daily avviata: ${challenge.title}!`, `🏀 F3nom Daily started: ${challenge.title}!`));
}

/* ================================================================
   INTERFACCIA E CONDIVISIONE RISULTATO
   ================================================================ */

/* Genera il testo emoji condivisibile stile Wordle */
function getDailyShareText(result) {
  const dateFormatted = formatDailyDateFriendly(result.dateStr || getTodayDateString());
  const outcomeEmoji = result.won ? "🏆" : "💔";
  const streakInfo = getDailyData();
  const streakText = streakInfo.streak > 1 ? `🔥 Streak: ${streakInfo.streak} giorni consecutivi` : (result.won ? "🔥 Streak avviato!" : "");

  return `🏀 F3NOM DAILY · ${dateFormatted}
${outcomeEmoji} ${result.title}
⭐ Grado: ${result.grade} (Punteggio: ${result.score}/1000)
${result.won ? "✅ Obiettivo completato con successo!" : "❌ Obiettivo mancato"}
${streakText}

Gioca gratis su F3nom Basketball Simulator!`;
}

function copyDailyResultToClipboard(result) {
  const text = getDailyShareText(result);
  if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      toast(tr("📋 Risultato copiato negli appunti!", "📋 Result copied to clipboard!"));
    }).catch(() => {
      prompt(tr("Copia il tuo risultato:", "Copy your result:"), text);
    });
  } else {
    prompt(tr("Copia il tuo risultato:", "Copy your result:"), text);
  }
}

/* Schermata/Card Daily in Home */
function renderDailyHomeBlock() {
  const block = el("home-daily-block");
  if (!block) return;
  const challenge = buildDailyChallenge();
  const data = getDailyData();
  const today = getTodayDateString();
  const alreadyPlayed = !!(data.history && data.history[today]);

  const streakEl = el("home-daily-streak");
  if (streakEl) {
    streakEl.textContent = `🔥 Streak: ${data.streak} ${tr("giorni", "days")}`;
  }

  const titleEl = el("home-daily-title");
  if (titleEl) {
    titleEl.textContent = `${challenge.badge} ${challenge.title}`;
  }

  const subEl = el("home-daily-sub");
  if (subEl) {
    subEl.textContent = challenge.tagline;
  }

  const btn = el("btn-open-daily");
  if (btn) {
    btn.innerHTML = alreadyPlayed
      ? `✅ ${tr("Giocata oggi (Riprova)", "Played today (Retry)")}`
      : `🏀 ${tr("Gioca la Sfida di Oggi", "Play Today's Challenge")}`;
  }
}

/* Mostra la schermata dettagliata del Dossier Daily */
function openDailyDossierScreen() {
  const challenge = buildDailyChallenge();
  const data = getDailyData();
  const screen = el("screen-daily");
  if (!screen) {
    // Se la schermata non è ancora nel DOM, avvia direttamente
    startDailyCareer(challenge);
    return;
  }

  el("daily-badge").textContent = challenge.badge;
  el("daily-title").textContent = challenge.title;
  el("daily-date").textContent = formatDailyDateFriendly(challenge.dateStr);
  el("daily-streak-badge").textContent = `🔥 Streak: ${data.streak}`;
  el("daily-story").textContent = challenge.story;
  el("daily-goal").textContent = challenge.goal;

  el("daily-player-name").textContent = `${challenge.firstName} ${challenge.lastName} (#${challenge.jerseyNumber})`;
  el("daily-player-team").textContent = `${challenge.team.name} · ${LEAGUES[challenge.leagueId].name}`;
  el("daily-player-info").textContent = `${getRoleName(challenge.role)} · ${challenge.age} ${tr("anni", "yo")} · OVR ${challenge.overall}`;

  el("screen-create").classList.add("hidden");
  screen.classList.remove("hidden");
  window.scrollTo(0, 0);
}

function closeDailyDossierScreen() {
  const screen = el("screen-daily");
  if (screen) screen.classList.add("hidden");
  el("screen-create").classList.remove("hidden");
  window.scrollTo(0, 0);
}

