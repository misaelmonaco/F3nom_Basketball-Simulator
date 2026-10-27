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
    id: "madSpring",
    badge: "🎓",
    title: "Mad Spring",
    titleEn: "Mad Spring",
    tagline: "Ultimo anno al College: dentro o fuori a ogni turno nel torneo universitario.",
    taglineEn: "Senior year in College: single-elimination madness every round.",
    league: "NCAA",
    startAge: 21,
    ovrRange: [75, 80],
    condition: { fragility: 30, stamina: 85, morale: 90, chemistry: 80 },
    role: "SG",
    goal: "Raggiungi almeno la Finale del Torneo Universitario (o vinci il Titolo).",
    goalEn: "Reach at least the National Championship Game (or win the Title).",
    checkGoal: (p, rec) => !!(rec && (rec.champion || (rec.playoffResult && (rec.playoffResult.includes("Finale") || rec.playoffResult.includes("Final"))))),
    story: "È primavera, il momento più caldo del basket collegiale. La nazione intera ha gli occhi puntati sul tabellone a 64 squadre. Un solo passo falso e la tua carriera universitaria è finita per sempre; sei vittorie e sarai immortale.",
    storyEn: "Spring is here, the peak of collegiate basketball. The entire nation is watching the 64-team bracket. One bad game and your college career is over; six straight wins and you become a collegiate legend.",
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
  },
  {
    id: "oceaniaNext",
    badge: "🦘",
    title: "Next Star d'Oceania",
    titleEn: "Oceania Next Star",
    tagline: "Un anno da professionista Down Under prima del grande salto in USA-1.",
    taglineEn: "One year pro Down Under before the big leap to USA-1.",
    league: "NBL",
    startAge: 19,
    ovrRange: [74, 78],
    condition: { fragility: 25, stamina: 82, morale: 85, chemistry: 75 },
    role: "PG",
    goal: "Conquista il Titolo dell'Oceania (NBL) o raggiungi la Finale da leader.",
    goalEn: "Win the NBL Championship or reach the Finals as a leader.",
    checkGoal: (p, rec) => !!(rec && (rec.champion || (rec.playoffResult && (rec.playoffResult.includes("Finale") || rec.playoffResult.includes("Final"))))),
    story: "Hai scelto la rotta alternativa: anziché il college, sei volato in Australia con il programma Next Stars per misurarti subito coi giganti della NBL. Gli scout americani riempiono le tribune: un anno da fenomeno qui ti spalancherà le porte del Draft.",
    storyEn: "You chose the alternative path: instead of college, you flew Down Under with the Next Stars program to battle grown men in the NBL. American scouts pack the stands: a dominant year here punches your ticket to the Draft.",
    nationality: rng => rng.random() < 0.6 ? "Australia" : "USA",
    setup(p, rng) {
      p.currentTeamRole = "starter";
      p.reputation = 68;
      p.popularity = 70;
      p.morale = 85;
      p.chemistry = 75;
    }
  },
  {
    id: "cbaScoringMachine",
    badge: "🐉",
    title: "Re dei Canestri in Cina",
    titleEn: "China Scoring Machine",
    tagline: "Import superstar nella CBA: ti chiedono 35 punti a sera e leadership totale.",
    taglineEn: "Import superstar in CBA: you're expected to drop 35 a night and carry the franchise.",
    league: "CBA",
    startAge: 27,
    ovrRange: [83, 88],
    condition: { fragility: 40, stamina: 88, morale: 80, chemistry: 70 },
    role: "SG",
    goal: "Vinci il Titolo cinese (CBA) o chiudi la stagione da MVP/Capocannoniere.",
    goalEn: "Win the CBA Championship or take home the MVP/Scoring title.",
    checkGoal: (p, rec) => !!(rec && (rec.champion || (rec.awards && (rec.awards.includes("MVP") || rec.awards.includes("Capocannoniere"))))),
    story: "Sei sbarcato nella ricca Chinese Basketball Association con lo status di star assoluta. Le arene sono piene per te, i difensori raddoppiano a metà campo e la dirigenza vuole il titolo subito. Palla in mano e fai canestro.",
    storyEn: "You landed in the CBA with full superstar treatment. Arenas are sold out, defenses double you at halfcourt, and ownership demands a championship ring right now. Ball in hand, light up the scoreboard.",
    nationality: rng => rng.random() < 0.7 ? "USA" : "Cina",
    setup(p, rng) {
      p.currentTeamRole = "star";
      p.reputation = 82;
      p.popularity = 85;
      p.morale = 80;
      p.chemistry = 72;
    }
  },
  {
    id: "balkanInferno",
    badge: "🔥",
    title: "Inferno di Belgrado",
    titleEn: "Balkan Derby Inferno",
    tagline: "Il derby più caldo e ostile del mondo: pressione totale per vincere la Lega Adriatica.",
    taglineEn: "The most heated rivalry on earth: pure hostile pressure to conquer the Adriatic League.",
    league: "ABA",
    startAge: 23,
    ovrRange: [78, 83],
    condition: { fragility: 35, stamina: 85, morale: 80, chemistry: 80 },
    role: "PG",
    goal: "Conquista la Lega Adriatica (ABA) portando a casa il Titolo.",
    goalEn: "Conquer the Adriatic League (ABA) and hoist the championship trophy.",
    checkGoal: (p, rec) => !!(rec && rec.champion),
    story: "Fumogeni, cori assordanti e tifosi a venti centimetri dal parquet: nella Lega Adriatica ogni rimbalzo è una battaglia campale. Non c'è spazio per la paura: devi guidare la tua squadra attraverso l'inferno fino al trofeo.",
    storyEn: "Flares, deafening chants, and hostile fans inches from the hardwood: in the Adriatic League, every loose ball is a war. There is no room for hesitation: guide your squad through the fire to championship glory.",
    nationality: rng => rng.random() < 0.6 ? "Serbia" : (rng.random() < 0.5 ? "Croazia" : "Slovenia"),
    setup(p, rng) {
      p.currentTeamRole = "starter";
      p.reputation = 74;
      p.popularity = 75;
      p.morale = 85;
      p.chemistry = 80;
    }
  },
  {
    id: "gleagueCallup",
    badge: "📋",
    title: "Fame da G-League",
    titleEn: "G-League Grind",
    tagline: "In USA-2 si gioca col coltello tra i denti: domina il campionato per la chiamata tra i grandi.",
    taglineEn: "Scrapping in USA-2: dominate the league to prove you belong on the biggest stage.",
    league: "GLEAGUE",
    startAge: 22,
    ovrRange: [75, 79],
    condition: { fragility: 30, stamina: 90, morale: 75, chemistry: 70 },
    role: "SF",
    goal: "Vinci il Titolo di USA-2 oppure chiudi la stagione da MVP del campionato.",
    goalEn: "Win the USA-2 Title or win the league MVP award.",
    checkGoal: (p, rec) => !!(rec && (rec.champion || (rec.awards && rec.awards.includes("MVP")))),
    story: "Viaggi estenuanti in autobus, hotel economici e compagni che lottano per lo stesso sogno: una chiamata al piano di sopra. Qui non si molla un millimetro. Chiudi la stagione da padrone assoluto per dimostrare che vali i grandi palcoscenici.",
    storyEn: "Long bus rides, budget motels, and teammates clawing for the same elusive call-up. There are no easy buckets here. Dominate every contest and prove you belong with the elite.",
    nationality: rng => rng.random() < 0.85 ? "USA" : "Canada",
    setup(p, rng) {
      p.currentTeamRole = "star";
      p.reputation = 68;
      p.popularity = 60;
      p.morale = 75;
      p.chemistry = 70;
    }
  },
  {
    id: "frenchPhenom",
    badge: "⚡",
    title: "I Talenti di Francia",
    titleEn: "French Phenom",
    tagline: "Nel campionato più atletico e veloce d'Europa: guida la squadra ai Playoff.",
    taglineEn: "In Europe's most explosive, athletic league: power your team to the Playoffs.",
    league: "FRA_ELITE",
    startAge: 20,
    ovrRange: [75, 80],
    condition: { fragility: 30, stamina: 84, morale: 80, chemistry: 75 },
    role: "C",
    goal: "Raggiungi i Playoff francesi e supera almeno il primo turno.",
    goalEn: "Qualify for the French playoffs and win at least one round.",
    checkGoal: (p, rec) => !!(rec && (rec.champion || (rec.playoffRounds && rec.playoffRounds >= 2) || (rec.playoffResult && (rec.playoffResult.includes("Semifinal") || rec.playoffResult.includes("Finale") || rec.playoffResult.includes("Final"))))),
    story: "Il basket francese è una fucina inesauribile di ali e centri verticali che finiscono subito al Draft. Sei al centro dell'area: intimida gli avversari, vola a rimbalzo e porta il club fino in fondo.",
    storyEn: "French basketball is a relentless breeding ground of vertical giants and future top draft picks. You anchor the paint: protect the rim, catch lobs in transition, and carry your club deep into the postseason.",
    nationality: rng => rng.random() < 0.8 ? "Francia" : "USA",
    setup(p, rng) {
      p.currentTeamRole = "starter";
      p.reputation = 70;
      p.popularity = 68;
      p.morale = 80;
      p.chemistry = 76;
    }
  },
  {
    id: "greekOdyssey",
    badge: "🏛️",
    title: "Derby dell'Ellade",
    titleEn: "Greek Odyssey",
    tagline: "Atene o Salonicco: difese feroci, calore incontenibile e la caccia al titolo greco.",
    taglineEn: "Athens or Thessaloniki: physical half-court wars and the chase for Greek glory.",
    league: "GRE_GBL",
    startAge: 25,
    ovrRange: [79, 84],
    condition: { fragility: 35, stamina: 82, morale: 80, chemistry: 75 },
    role: "PF",
    goal: "Raggiungi la Finale del Campionato Greco o vinci il Titolo.",
    goalEn: "Reach the Greek League Finals or win the Championship.",
    checkGoal: (p, rec) => !!(rec && (rec.champion || (rec.playoffResult && (rec.playoffResult.includes("Finale") || rec.playoffResult.includes("Final"))))),
    story: "Il basket greco è un culto: difese a metà campo che ti tolgono il respiro, parquet infuocati e rivalità secolari. Serve carattere d'acciaio per resistere alla pressione e trascinare i tuoi compagni fino alla serie scudetto.",
    storyEn: "Greek basketball is near religion: suffocating half-court defense, hostile arenas, and historic rivalries. You need nerves of steel to withstand the storm and drag your team to the Finals.",
    nationality: rng => rng.random() < 0.75 ? "Grecia" : "Serbia",
    setup(p, rng) {
      p.currentTeamRole = "starter";
      p.reputation = 76;
      p.popularity = 72;
      p.morale = 80;
      p.chemistry = 78;
    }
  },
  {
    id: "italianPromotion",
    badge: "🇮🇹",
    title: "Scalata dalla Serie A2",
    titleEn: "Serie A2 Promotion Quest",
    tagline: "Campionato duro e piazze passionali: c'è un solo posto per salire nella massima serie.",
    taglineEn: "Gritty gyms and passionate towns: only one team claims the coveted promotion ticket.",
    league: "ITA_A2",
    startAge: 21,
    ovrRange: [71, 76],
    condition: { fragility: 25, stamina: 85, morale: 80, chemistry: 80 },
    role: "PG",
    goal: "Conquista la promozione in Serie A1 vincendo il Titolo di A2.",
    goalEn: "Earn promotion to Serie A1 by winning the A2 Championship.",
    checkGoal: (p, rec) => !!(rec && (rec.champion || rec.promoted)),
    story: "PalaSport caldi e partite che si decidono a 60 punti. La Serie A2 non fa sconti a nessuno. Sei il giovane regista su cui la piazza ha scommesso tutto: guida l'attacco e regala alla città la notte più bella della sua storia.",
    storyEn: "Packed historic gyms and bruising battles. Serie A2 gives zero freebies. You're the young floor general carrying a town's promotion dreams: orchestrate the offense and deliver the greatest night in club history.",
    nationality: rng => rng.random() < 0.85 ? "Italia" : "USA",
    setup(p, rng) {
      p.currentTeamRole = "starter";
      p.reputation = 64;
      p.popularity = 60;
      p.morale = 85;
      p.chemistry = 80;
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
  } else if (arch.id === "balkanInferno") {
    const belgradeTeams = teamPool.filter(t => t.city && t.city.includes("Belgrado"));
    if (belgradeTeams.length) teamPool = belgradeTeams;
  }
  const team = rng.choice(teamPool) || teamPool[0];

  // Nazionalità e nome coerenti
  let nationality;
  if (arch.nationality) {
    nationality = typeof arch.nationality === "function" ? arch.nationality(rng) : arch.nationality;
  } else if (leagueId === "NBA" || leagueId === "NCAA" || leagueId === "GLEAGUE") {
    nationality = rng.random() < 0.75 ? "USA" : "Canada";
  } else {
    nationality = (leagueData && leagueData.country) ? leagueData.country : "Italia";
  }

  // Nome deterministico dal generatore seed
  let firstName = "Alex", lastName = "Rivera";
  const pool = (typeof NAMES_BY_NATIONALITY !== "undefined" && NAMES_BY_NATIONALITY[nationality]) || (typeof NAMES_BY_NATIONALITY !== "undefined" && NAMES_BY_NATIONALITY["USA"]);
  if (pool && pool.first && pool.last) {
    firstName = rng.choice(pool.first);
    lastName = rng.choice(pool.last);
  } else if (typeof randomNameFor === "function") {
    const fallback = randomNameFor(nationality);
    firstName = fallback.first;
    lastName = fallback.last;
  }

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
    firstName,
    lastName,
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

