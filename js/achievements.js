"use strict";

/* ================================================================
   TRAGUARDI — una collezione di imprese che si sbloccano da sole giocando. Ogni carriera
   ha i suoi (player.achievements: id -> anno); in più il browser ricorda chi li ha
   sbloccati per primo tra tutte le carriere giocate, e conserva un albo d'oro delle
   carriere concluse.
   ================================================================ */
const ACHIEVEMENT_CATEGORIES = [
  { id: "career", label: "Carriera", labelEn: "Career" },
  { id: "awards", label: "Premi individuali", labelEn: "Individual Awards" },
  { id: "team", label: "Titoli", labelEn: "Championships" },
  { id: "stats", label: "Statistiche", labelEn: "Statistics" },
  { id: "life", label: "Fuori dal campo", labelEn: "Off the Court" },
  { id: "legend", label: "Leggenda", labelEn: "Legend" },
];
if (typeof i18nify === "function") i18nify(ACHIEVEMENT_CATEGORIES);

const seasonsIn = (p, league) => p.history.filter(h => h.league === league).length;
const careerPts = p => computeCareerTotals(p.history).pts;
const maxTitleStreak = p => {
  let streak = 0, best = 0;
  p.history.forEach(h => { streak = h.champion ? streak + 1 : 0; best = Math.max(best, streak); });
  return best;
};
const anySeason = (p, fn) => p.history.some(fn);

const ACHIEVEMENTS = [
  // carriera
  { id: "debut", cat: "career", icon: "🏀", title: "Primo passo", titleEn: "First Step", desc: "Gioca la tua prima stagione.", descEn: "Play your first season.", check: p => p.history.length >= 1 },
  { id: "pro", cat: "career", icon: "✍️", title: "Professionista", titleEn: "Turned Pro", desc: "Firma il primo contratto con un ingaggio.", descEn: "Sign your first salaried pro contract.", check: p => !!(p.contract && p.contract.salaryPerYear) },
  { id: "prodigy", cat: "career", icon: "🌍", title: "Enfant prodige", titleEn: "Prodigy", desc: "Firma con un club professionistico straniero a 17-18 anni.", descEn: "Sign with a foreign pro club at age 17–18.", check: p => !!p.proAbroadYoung },
  { id: "drafted", cat: "career", icon: "🎓", title: "Chiamato al Draft", titleEn: "Drafted", desc: "Vieni scelto al Draft USA-1.", descEn: "Get selected in the USA-1 Draft.", check: p => p.drafted },
  { id: "top5", cat: "career", icon: "🎉", title: "Scelta alta", titleEn: "Top-5 Pick", desc: "Vieni scelto tra i primi 5 al Draft.", descEn: "Be selected in the Top 5 of the Draft.", check: p => anySeason(p, h => h.draftResult && h.draftResult.startsWith("Top 5")) },
  { id: "nba", cat: "career", icon: "🗽", title: "Sogno americano", titleEn: "American Dream", desc: "Gioca una stagione in USA-1.", descEn: "Play a season in USA-1.", check: p => seasonsIn(p, "NBA") >= 1 },
  { id: "globetrotter", cat: "career", icon: "🧳", title: "Giramondo", titleEn: "Globetrotter", desc: "Gioca in almeno 3 campionati diversi.", descEn: "Play in at least 3 different leagues.", check: p => new Set(p.history.map(h => h.league)).size >= 3,
    progress: p => [new Set(p.history.map(h => h.league)).size, 3] },
  { id: "streetToNba", cat: "career", icon: "🏙️", title: "Dal playground", titleEn: "From the Blacktop", desc: "Arriva in USA-1 partendo dallo streetball.", descEn: "Reach USA-1 starting from the streetball path.", check: p => p.pathId === "STREET" && seasonsIn(p, "NBA") >= 1 },
  { id: "allStarContest", cat: "career", icon: "⭐", title: "Re del weekend", titleEn: "King of the Weekend", desc: "Vinci una gara del weekend delle stelle.", descEn: "Win an All-Star Weekend event.", check: p => (p.allStarContests || []).some(c => c.won) },
  { id: "duoTitle", cat: "team", icon: "🌟", title: "Coppia d'oro", titleEn: "Golden Duo", desc: "Vinci un titolo con la seconda stella che hai chiesto alla dirigenza.", descEn: "Win a title with the co-star you requested from management.", check: p => anySeason(p, h => h.champion && h.duoWith) },
  { id: "hometownHero", cat: "team", icon: "🏠", title: "Profeta in patria", titleEn: "Hometown Hero", desc: "Vinci un titolo con la squadra della tua città natale.", descEn: "Win a championship with your hometown team.", check: p => !!p.hometown && anySeason(p, h => h.champion && h.team.city === p.hometown) },
  { id: "fromA2", cat: "career", icon: "🪜", title: "Dalla gavetta", titleEn: "Up the Ladder", desc: "Dalla ITA-2 fino alla USA-1.", descEn: "Climb from ITA-2 all the way to USA-1.", check: p => seasonsIn(p, "ITA_A2") >= 1 && seasonsIn(p, "NBA") >= 1 },
  { id: "loyal", cat: "career", icon: "🤝", title: "Bandiera", titleEn: "Franchise Icon", desc: "8 stagioni nella stessa squadra.", descEn: "Play 8 seasons with the same team.", check: p => maxSeasonsWithOneTeam(p) >= 8, progress: p => [maxSeasonsWithOneTeam(p), 8] },
  { id: "veteran", cat: "career", icon: "🧓", title: "Veterano", titleEn: "Veteran", desc: "Gioca 15 stagioni.", descEn: "Play 15 seasons.", check: p => p.history.length >= 15, progress: p => [p.history.length, 15] },
  { id: "ironman", cat: "career", icon: "🦾", title: "Senza tempo", titleEn: "Timeless", desc: "Gioca 20 stagioni.", descEn: "Play 20 seasons.", check: p => p.history.length >= 20, progress: p => [p.history.length, 20] },
  { id: "ovr90", cat: "career", icon: "💎", title: "Élite", titleEn: "Elite", desc: "Raggiungi 90 di overall.", descEn: "Reach 90 overall rating.", check: p => p.overall >= 90 || anySeason(p, h => h.overall >= 90) },
  { id: "ovr99", cat: "career", icon: "💯", title: "Perfezione", titleEn: "Perfection", desc: "Raggiungi 99 di overall.", descEn: "Reach 99 overall rating.", check: p => p.overall >= 99 || anySeason(p, h => h.overall >= 99) },
  // premi
  { id: "allstar", cat: "awards", icon: "🌟", title: "All-Star", titleEn: "All-Star", desc: "Vieni convocato all'All-Star Game.", descEn: "Earn an All-Star Game selection.", check: p => p.trophies.allstar >= 1 },
  { id: "allstar10", cat: "awards", icon: "✨", title: "All-Star perenne", titleEn: "Perennial All-Star", desc: "10 convocazioni all'All-Star Game.", descEn: "Earn 10 All-Star Game selections.", check: p => p.trophies.allstar >= 10, progress: p => [p.trophies.allstar, 10] },
  { id: "mvp", cat: "awards", icon: "⭐", title: "MVP", titleEn: "MVP", desc: "Vinci un titolo di MVP.", descEn: "Win an MVP award.", check: p => p.trophies.mvp >= 1 },
  { id: "mvp3", cat: "awards", icon: "👑", title: "Dominatore", titleEn: "Dominator", desc: "Vinci 3 titoli di MVP.", descEn: "Win 3 MVP awards.", check: p => p.trophies.mvp >= 3, progress: p => [p.trophies.mvp, 3] },
  { id: "dpoy", cat: "awards", icon: "🛡️", title: "Il Muro", titleEn: "The Wall", desc: "Vinci il premio di Difensore dell'Anno.", descEn: "Win Defensive Player of the Year.", check: p => p.trophies.dpoy >= 1 },
  { id: "roy", cat: "awards", icon: "🎖️", title: "Matricola d'oro", titleEn: "Golden Rookie", desc: "Vinci il Rookie dell'Anno USA-1.", descEn: "Win USA-1 Rookie of the Year.", check: p => p.trophies.roy >= 1 },
  { id: "finalsMvp", cat: "awards", icon: "🏅", title: "Uomo delle Finali", titleEn: "Finals Hero", desc: "Vinci l'MVP delle Finali.", descEn: "Win Finals MVP.", check: p => p.trophies.finalsMvp >= 1 },
  { id: "bestFive", cat: "awards", icon: "🧩", title: "Quintetto ideale", titleEn: "First Team", desc: "Entra nel Miglior Quintetto di una lega.", descEn: "Make a league's All-League First Team.", check: p => p.trophies.bestFive >= 1 },
  // titoli
  { id: "title", cat: "team", icon: "🏆", title: "Campione", titleEn: "Champion", desc: "Vinci un campionato.", descEn: "Win a league championship.", check: p => p.trophies.rings + p.trophies.domesticTitles >= 1 },
  { id: "ring", cat: "team", icon: "💍", title: "Anello", titleEn: "The Ring", desc: "Vinci il titolo USA-1.", descEn: "Win the USA-1 championship.", check: p => p.trophies.rings >= 1 },
  { id: "rings3", cat: "team", icon: "💍", title: "Dinastia", titleEn: "Dynasty", desc: "Vinci 3 titoli USA-1.", descEn: "Win 3 USA-1 championships.", check: p => p.trophies.rings >= 3, progress: p => [p.trophies.rings, 3] },
  { id: "threepeat", cat: "team", icon: "🔥", title: "Three-peat", titleEn: "Three-Peat", desc: "Vinci 3 campionati di fila.", descEn: "Win 3 championships in a row.", check: p => maxTitleStreak(p) >= 3 },
  { id: "euroleague", cat: "team", icon: "🏟️", title: "Re d'Europa", titleEn: "King of Europe", desc: "Vinci la EUROPE-1.", descEn: "Win the EUROPE-1 title.", check: p => p.trophies.euroleague >= 1 },
  { id: "eurocup", cat: "team", icon: "🏟️", title: "Coppa in bacheca", titleEn: "Continental Cup", desc: "Vinci la EUROPE-2.", descEn: "Win the EUROPE-2 title.", check: p => (p.trophies.eurocup || 0) >= 1 },
  { id: "nationalCup", cat: "team", icon: "🏆", title: "Re di Coppe", titleEn: "Cup King", desc: "Vinci una coppa nazionale a metà stagione.", descEn: "Win a midseason National Cup.", check: p => (p.trophies.nationalCups || 0) >= 1 },
  { id: "medal", cat: "team", icon: "🥉", title: "Sul podio", titleEn: "On the Podium", desc: "Vinci una medaglia con la Nazionale.", descEn: "Win a medal with the National Team.", check: p => p.trophies.medals >= 1 },
  { id: "gold", cat: "team", icon: "🥇", title: "Oro", titleEn: "Gold Medalist", desc: "Vinci il Mondiale o l'Europeo.", descEn: "Win the World Cup or EuroBasket.", check: p => p.trophies.worldCupTitles + p.trophies.eurobasketTitles >= 1 },
  // statistiche
  { id: "ppg25", cat: "stats", icon: "🎯", title: "Bomber", titleEn: "Bucket Getter", desc: "Chiudi una stagione a 25 punti di media.", descEn: "Average 25+ PPG in a season.", check: p => anySeason(p, h => h.pts >= 25) },
  { id: "ppg30", cat: "stats", icon: "🔥", title: "Macchina da punti", titleEn: "Scoring Machine", desc: "Chiudi una stagione a 30 punti di media.", descEn: "Average 30+ PPG in a season.", check: p => anySeason(p, h => h.pts >= 30) },
  { id: "apg10", cat: "stats", icon: "🧠", title: "Regista", titleEn: "Floor General", desc: "Chiudi una stagione a 10 assist di media.", descEn: "Average 10+ APG in a season.", check: p => anySeason(p, h => h.ast >= 10) },
  { id: "rpg12", cat: "stats", icon: "🧲", title: "Padrone dei rimbalzi", titleEn: "Board Man", desc: "Chiudi una stagione a 12 rimbalzi di media.", descEn: "Average 12+ RPG in a season.", check: p => anySeason(p, h => h.reb >= 12) },
  { id: "double", cat: "stats", icon: "✌️", title: "Doppia doppia", titleEn: "Double-Double", desc: "Una stagione in doppia cifra di media in due voci tra punti, rimbalzi e assist.", descEn: "Average double figures in two categories among points, rebounds, and assists for a season.",
    check: p => anySeason(p, h => [h.pts, h.reb, h.ast].filter(v => v >= 10).length >= 2) },
  { id: "pts10k", cat: "stats", icon: "📈", title: "10.000 punti", titleEn: "10,000 Points", desc: "Segna 10.000 punti in carriera.", descEn: "Score 10,000 career points.", check: p => careerPts(p) >= 10000, progress: p => [careerPts(p), 10000] },
  { id: "pts20k", cat: "stats", icon: "🚀", title: "20.000 punti", titleEn: "20,000 Points", desc: "Segna 20.000 punti in carriera.", descEn: "Score 20,000 career points.", check: p => careerPts(p) >= 20000, progress: p => [careerPts(p), 20000] },
  { id: "clutch25", cat: "stats", icon: "❄️", title: "Sangue freddo", titleEn: "Ice in His Veins", desc: "Vinci 25 possessi decisivi ai playoff.", descEn: "Win 25 clutch playoff possessions.", check: p => (p.clutch && p.clutch.made) >= 25, progress: p => [(p.clutch && p.clutch.made) || 0, 25] },
  // fuori dal campo
  { id: "rich", cat: "life", icon: "💰", title: "Milionario", titleEn: "Multi-Millionaire", desc: "Raggiungi 10 milioni di patrimonio.", descEn: "Reach 10 million in net worth.", check: p => p.wealth >= 10, progress: p => [round1(p.wealth), 10] },
  { id: "tycoon", cat: "life", icon: "🏦", title: "Impero", titleEn: "Mogul", desc: "Raggiungi 100 milioni di patrimonio.", descEn: "Reach 100 million in net worth.", check: p => p.wealth >= 100, progress: p => [round1(p.wealth), 100] },
  { id: "icon", cat: "life", icon: "📣", title: "Icona", titleEn: "Global Icon", desc: "Arriva a 3 milioni l'anno di sponsor.", descEn: "Reach 3 million/year in endorsement income.", check: p => p.sponsorIncome >= 3, progress: p => [round1(p.sponsorIncome), 3] },
  { id: "respected", cat: "life", icon: "🤲", title: "Stimato da tutti", titleEn: "Universally Respected", desc: "Arriva a 90 di reputazione.", descEn: "Reach 90 reputation.", check: p => reputationOf(p) >= 90 },
  { id: "charity", cat: "life", icon: "💛", title: "Cuore d'oro", titleEn: "Heart of Gold", desc: "Apri una fondazione benefica.", descEn: "Launch a charitable foundation.", check: p => (p.charityYears || 0) >= 1 },
  { id: "sponsor", cat: "life", icon: "🤝", title: "Uomo immagine", titleEn: "Brand Ambassador", desc: "Porta a termine un contratto di sponsorizzazione.", descEn: "Successfully complete a sponsorship contract.", check: p => p.history.some(h => (h.sponsorResults || []).some(r => r.met && (r.text.includes("concluso") || r.text.includes("completed")))) },
  { id: "comeback", cat: "career", icon: "🏥", title: "Più forte di prima", titleEn: "Stronger Than Ever", desc: "Torna da un infortunio grave e gioca una stagione da All-Star.", descEn: "Return from a major injury and make the All-Star Game.", check: p => p.history.some((h, i) => h.seriousInjury && p.history.slice(i + 1).some(n => (n.awards || []).some(a => a.startsWith("All-Star")))) },
  { id: "parent", cat: "life", icon: "👶", title: "Genitore", titleEn: "Parent", desc: "Diventa genitore durante la carriera.", descEn: "Become a parent during your career.", check: p => !!(p.family && p.family.children.length) },
  { id: "collector", cat: "life", icon: "🛍️", title: "Collezionista", titleEn: "Collector", desc: "Possiedi 5 oggetti di lifestyle.", descEn: "Own 5 luxury lifestyle items.", check: p => (p.lifestyle || []).length >= 5, progress: p => [(p.lifestyle || []).length, 5] },
  { id: "yacht", cat: "life", icon: "🛥️", title: "Lupo di mare", titleEn: "Sea Wolf", desc: "Compra uno yacht.", descEn: "Buy a luxury yacht.", check: p => (p.lifestyle || []).some(o => o.id === "yacht") },
  { id: "abroad", cat: "life", icon: "🌍", title: "Cittadino del mondo", titleEn: "Citizen of the World", desc: "Ambientati del tutto in un paese straniero.", descEn: "Fully adapt to living in a foreign country.", check: p => (p.adaptedCountries || []).length >= 1 },
  // leggenda
  { id: "dream", cat: "legend", icon: "🌠", title: "Sogno realizzato", titleEn: "Dream Fulfilled", desc: "Realizza il tuo sogno di carriera.", descEn: "Fulfill your career dream.", check: p => !!(p.careerGoal && p.careerGoal.status === "done") },
  { id: "farewell", cat: "legend", icon: "👋", title: "L'ultimo giro", titleEn: "One Last Ride", desc: "Chiudi la carriera con un tour d'addio.", descEn: "Retire after a farewell tour.", check: p => p.retired && !!p.farewellTour },
  { id: "homecoming", cat: "legend", icon: "🏠", title: "Ritorno a casa", titleEn: "Homecoming", desc: "Firma l'ultimo contratto con la squadra della tua vita.", descEn: "Sign a homecoming contract with your longtime club.", check: p => !!p.homecoming },
  { id: "captain", cat: "legend", icon: "🎖️", title: "Capitano", titleEn: "Team Captain", desc: "Ricevi la fascia di capitano.", descEn: "Be named team captain.", check: p => (p.captainCount || 0) >= 1 },
  { id: "mentor", cat: "legend", icon: "🎓", title: "Il maestro", titleEn: "The Mentor", desc: "Il giovane che hai seguito diventa una stella.", descEn: "A young player you mentored becomes a star.", check: p => !!(p.mentee && p.mentee.star) },
  { id: "afterlife", cat: "legend", icon: "📋", title: "Seconda vita", titleEn: "Second Act", desc: "Resta nel basket dopo il ritiro.", descEn: "Start a second career in basketball after retiring.", check: p => !!p.afterCareer },
  { id: "family", cat: "legend", icon: "👨‍👦", title: "Figlio d'arte", titleEn: "Second Generation", desc: "Gioca la carriera di un figlio o una figlia.", descEn: "Play the career of your son or daughter.", check: p => !!p.legacy },
  { id: "jersey", cat: "legend", icon: "👕", title: "Appesa al soffitto", titleEn: "In the Rafters", desc: "Una squadra ritira la tua maglia.", descEn: "Have a team retire your jersey.", check: p => p.retired && retiredJerseys().length >= 1 },
  { id: "hof", cat: "legend", icon: "🏛️", title: "Hall of Fame", titleEn: "Hall of Fame", desc: "Entra nella Hall of Fame.", descEn: "Get inducted into the Hall of Fame.", check: p => p.retired && hallOfFameVerdict().elected },
  { id: "gradeS", cat: "legend", icon: "🐐", title: "Leggenda", titleEn: "GOAT Status", desc: "Chiudi una carriera con il voto S.", descEn: "Finish a career with an S grade.", check: p => p.retired && computeCareerGrade().grade === "S" },
  { id: "hardRing", cat: "legend", icon: "⚔️", title: "Contro tutti", titleEn: "Against All Odds", desc: "Vinci un anello USA-1 a difficoltà Leggenda.", descEn: "Win a USA-1 ring on Legend difficulty.", check: p => p.difficulty === "legend" && p.trophies.rings >= 1 },
];
if (typeof i18nify === "function") i18nify(ACHIEVEMENTS);
function getAchievement(id) { return ACHIEVEMENTS.find(a => a.id === id) || null; }

/* ---------- memoria di tutte le carriere (browser) ---------- */
const GLOBAL_ACHIEVEMENTS_KEY = "chosenOne.achievements";
const HALL_KEY = "chosenOne.hall";
function loadGlobalAchievements() {
  try { return JSON.parse(localStorage.getItem(GLOBAL_ACHIEVEMENTS_KEY)) || {}; } catch (e) { return {}; }
}
function saveGlobalAchievement(id, p) {
  try {
    const all = loadGlobalAchievements();
    if (all[id]) return;
    all[id] = { name: `${p.firstName} ${p.lastName}`, year: p.year };
    localStorage.setItem(GLOBAL_ACHIEVEMENTS_KEY, JSON.stringify(all));
  } catch (e) { /* storage non disponibile */ }
}
function loadHall() {
  try { const h = JSON.parse(localStorage.getItem(HALL_KEY)); return Array.isArray(h) ? h : []; } catch (e) { return []; }
}
/* Una carriera conclusa entra nell'albo d'oro una volta sola */
function archiveCareer(p) {
  if (p.archived) return;
  p.archived = true;
  try {
    const hall = loadHall();
    const g = computeCareerGrade();
    hall.unshift({ name: `${p.firstName} ${p.lastName}`, jersey: p.jerseyNumber, nationality: p.nationality, from: p.startYear || CAREER_START_YEAR, to: p.year,
      grade: g.grade, goat: p.goatScore || 0, rings: p.trophies.rings, mvp: p.trophies.mvp, hof: hallOfFameVerdict().elected,
      difficulty: p.difficulty || "normal", generation: p.legacy ? p.legacy.generation : 1 });
    localStorage.setItem(HALL_KEY, JSON.stringify(hall.slice(0, 50)));
  } catch (e) { /* storage non disponibile */ }
}

/* Controlla tutti i traguardi non ancora sbloccati; restituisce quelli nuovi */
function checkAchievements(p, quiet) {
  p.achievements = p.achievements || {};
  const fresh = [];
  ACHIEVEMENTS.forEach(a => {
    if (p.achievements[a.id] != null) return;
    let ok = false;
    try { ok = !!a.check(p); } catch (e) { ok = false; }
    if (!ok) return;
    p.achievements[a.id] = p.year;
    saveGlobalAchievement(a.id, p);
    fresh.push(a);
  });
  if (!quiet) fresh.forEach(a => pushNews(tr(`🏅 Traguardo sbloccato: ${a.title}.`, `🏅 Achievement unlocked: ${a.title}.`)));
  return fresh;
}

/* ---------- la pagina dei traguardi ----------
   scope "career": questa carriera (con le imprese già riuscite in altre carriere);
   scope "global": tutto ciò che è stato sbloccato in questo browser, più l'albo d'oro. */
function renderAchievementsPage(targetId, scope) {
  const box = el(targetId);
  if (!box) return;
  const global = loadGlobalAchievements();
  const mine = (scope === "career" && player && player.achievements) || {};
  const total = ACHIEVEMENTS.length;
  const mineCount = Object.keys(mine).length;
  const globalCount = ACHIEVEMENTS.filter(a => global[a.id]).length;

  const head = scope === "career"
    ? `<div class="ach-summary"><div><strong>${mineCount}</strong> / ${total} ${tr("in questa carriera", "in this career")}</div><div class="small-muted">${tr(`${globalCount} / ${total} sbloccati in tutte le tue carriere`, `${globalCount} / ${total} unlocked across all your careers`)}</div></div>`
    : `<div class="ach-summary"><div><strong>${globalCount}</strong> / ${total} ${tr("traguardi sbloccati", "achievements unlocked")}</div><div class="small-muted">${tr("Tra tutte le carriere giocate in questo browser", "Across all careers played in this browser")}</div></div>`;
  const bar = `<div class="ach-progress big"><div class="ach-bar" style="width:${((scope === "career" ? mineCount : globalCount) / total) * 100}%"></div></div>`;

  const cats = ACHIEVEMENT_CATEGORIES.map(cat => {
    const items = ACHIEVEMENTS.filter(a => a.cat === cat.id).map(a => {
      const here = mine[a.id] != null;
      const elsewhere = global[a.id];
      const state = here ? "unlocked" : elsewhere ? (scope === "career" ? "elsewhere" : "unlocked") : "locked";
      let meta = "";
      if (here) meta = tr(`Sbloccato nel ${mine[a.id]}`, `Unlocked in ${mine[a.id]}`);
      else if (elsewhere) meta = scope === "career" ? tr(`Già riuscito a <span class="ach-who"></span>`, `Already unlocked by <span class="ach-who"></span>`) : `<span class="ach-who"></span> · ${elsewhere.year}`;
      const prog = scope === "career" && !here && a.progress && player ? a.progress(player) : null;
      return `
        <div class="ach-card ${state}" data-ach="${a.id}">
          <div class="ach-icon">${a.icon}</div>
          <div class="ach-body">
            <div class="ach-title">${a.title}</div>
            <div class="ach-desc">${a.desc}</div>
            ${prog ? `<div class="ach-progress"><div class="ach-bar" style="width:${clamp(prog[0] / prog[1] * 100, 0, 100)}%"></div></div>` : ""}
            ${meta ? `<div class="ach-meta">${meta}</div>` : ""}
          </div>
        </div>`;
    }).join("");
    return `<div class="ach-cat"><div class="ach-cat-title">${cat.label}</div><div class="ach-grid">${items}</div></div>`;
  }).join("");

  const hall = scope === "global" ? loadHall() : [];
  const hallHtml = scope === "global" ? `
    <div class="ach-cat"><div class="ach-cat-title">${tr("Albo d'oro delle carriere", "Career Hall of Honor")}</div>
      ${hall.length ? `<div class="hall-list">${hall.map((h, i) => `
        <div class="hall-row" data-hall="${i}">
          <span class="hall-grade grade-${h.grade}">${h.grade}</span>
          <span class="hall-name"></span>
          <span class="small-muted">${h.from}-${h.to} · 👑 ${h.goat} · 💍 ${h.rings} · ⭐ ${h.mvp}${h.hof ? " · 🏛️" : ""}${h.generation > 1 ? tr(` · ${h.generation}ª generazione`, ` · Gen ${h.generation}`) : ""}</span>
        </div>`).join("")}</div>` : `<p class="small-muted">${tr("Qui compariranno le carriere concluse.", "Completed careers will appear here.")}</p>`}
    </div>` : "";

  box.innerHTML = head + bar + cats + hallHtml;
  // i nomi arrivano dal giocatore: testo, non HTML
  box.querySelectorAll(".ach-card .ach-who").forEach(node => {
    const id = node.closest(".ach-card").dataset.ach;
    node.textContent = global[id] ? global[id].name : "";
  });
  box.querySelectorAll(".hall-row").forEach(row => {
    const h = hall[parseInt(row.dataset.hall)];
    row.querySelector(".hall-name").textContent = `#${h.jersey} ${h.name}`;
  });
}
