"use strict";

/* ================================================================
   TRAGUARDI — una collezione di imprese che si sbloccano da sole giocando. Ogni carriera
   ha i suoi (player.achievements: id -> anno); in più il browser ricorda chi li ha
   sbloccati per primo tra tutte le carriere giocate, e conserva un albo d'oro delle
   carriere concluse.
   ================================================================ */
const ACHIEVEMENT_CATEGORIES = [
  { id: "career", label: "Carriera" },
  { id: "awards", label: "Premi individuali" },
  { id: "team", label: "Titoli" },
  { id: "stats", label: "Statistiche" },
  { id: "life", label: "Fuori dal campo" },
  { id: "legend", label: "Leggenda" },
];

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
  { id: "debut", cat: "career", icon: "🏀", title: "Primo passo", desc: "Gioca la tua prima stagione.", check: p => p.history.length >= 1 },
  { id: "pro", cat: "career", icon: "✍️", title: "Professionista", desc: "Firma il primo contratto con un ingaggio.", check: p => !!(p.contract && p.contract.salaryPerYear) },
  { id: "prodigy", cat: "career", icon: "🌍", title: "Enfant prodige", desc: "Firma con un club professionistico straniero a 17-18 anni.", check: p => !!p.proAbroadYoung },
  { id: "drafted", cat: "career", icon: "🎓", title: "Chiamato al Draft", desc: "Vieni scelto al Draft USA-1.", check: p => p.drafted },
  { id: "top5", cat: "career", icon: "🎉", title: "Scelta alta", desc: "Vieni scelto tra i primi 5 al Draft.", check: p => anySeason(p, h => h.draftResult && h.draftResult.startsWith("Top 5")) },
  { id: "nba", cat: "career", icon: "🗽", title: "Sogno americano", desc: "Gioca una stagione in USA-1.", check: p => seasonsIn(p, "NBA") >= 1 },
  { id: "globetrotter", cat: "career", icon: "🧳", title: "Giramondo", desc: "Gioca in almeno 3 campionati diversi.", check: p => new Set(p.history.map(h => h.league)).size >= 3,
    progress: p => [new Set(p.history.map(h => h.league)).size, 3] },
  { id: "streetToNba", cat: "career", icon: "🏙️", title: "Dal playground", desc: "Arriva in USA-1 partendo dallo streetball.", check: p => p.pathId === "STREET" && seasonsIn(p, "NBA") >= 1 },
  { id: "allStarContest", cat: "career", icon: "⭐", title: "Re del weekend", desc: "Vinci una gara del weekend delle stelle.", check: p => (p.allStarContests || []).some(c => c.won) },
  { id: "duoTitle", cat: "team", icon: "🌟", title: "Coppia d'oro", desc: "Vinci un titolo con la seconda stella che hai chiesto alla dirigenza.", check: p => anySeason(p, h => h.champion && h.duoWith) },
  { id: "hometownHero", cat: "team", icon: "🏠", title: "Profeta in patria", desc: "Vinci un titolo con la squadra della tua città natale.", check: p => !!p.hometown && anySeason(p, h => h.champion && h.team.city === p.hometown) },
  { id: "fromA2", cat: "career", icon: "🪜", title: "Dalla gavetta", desc: "Dalla ITA-2 fino alla USA-1.", check: p => seasonsIn(p, "ITA_A2") >= 1 && seasonsIn(p, "NBA") >= 1 },
  { id: "loyal", cat: "career", icon: "🤝", title: "Bandiera", desc: "8 stagioni nella stessa squadra.", check: p => maxSeasonsWithOneTeam(p) >= 8, progress: p => [maxSeasonsWithOneTeam(p), 8] },
  { id: "veteran", cat: "career", icon: "🧓", title: "Veterano", desc: "Gioca 15 stagioni.", check: p => p.history.length >= 15, progress: p => [p.history.length, 15] },
  { id: "ironman", cat: "career", icon: "🦾", title: "Senza tempo", desc: "Gioca 20 stagioni.", check: p => p.history.length >= 20, progress: p => [p.history.length, 20] },
  { id: "ovr90", cat: "career", icon: "💎", title: "Élite", desc: "Raggiungi 90 di overall.", check: p => p.overall >= 90 || anySeason(p, h => h.overall >= 90) },
  { id: "ovr99", cat: "career", icon: "💯", title: "Perfezione", desc: "Raggiungi 99 di overall.", check: p => p.overall >= 99 || anySeason(p, h => h.overall >= 99) },
  // premi
  { id: "allstar", cat: "awards", icon: "🌟", title: "All-Star", desc: "Vieni convocato all'All-Star Game.", check: p => p.trophies.allstar >= 1 },
  { id: "allstar10", cat: "awards", icon: "✨", title: "All-Star perenne", desc: "10 convocazioni all'All-Star Game.", check: p => p.trophies.allstar >= 10, progress: p => [p.trophies.allstar, 10] },
  { id: "mvp", cat: "awards", icon: "⭐", title: "MVP", desc: "Vinci un titolo di MVP.", check: p => p.trophies.mvp >= 1 },
  { id: "mvp3", cat: "awards", icon: "👑", title: "Dominatore", desc: "Vinci 3 titoli di MVP.", check: p => p.trophies.mvp >= 3, progress: p => [p.trophies.mvp, 3] },
  { id: "dpoy", cat: "awards", icon: "🛡️", title: "Il Muro", desc: "Vinci il premio di Difensore dell'Anno.", check: p => p.trophies.dpoy >= 1 },
  { id: "roy", cat: "awards", icon: "🎖️", title: "Matricola d'oro", desc: "Vinci il Rookie dell'Anno USA-1.", check: p => p.trophies.roy >= 1 },
  { id: "finalsMvp", cat: "awards", icon: "🏅", title: "Uomo delle Finali", desc: "Vinci l'MVP delle Finali.", check: p => p.trophies.finalsMvp >= 1 },
  { id: "bestFive", cat: "awards", icon: "🧩", title: "Quintetto ideale", desc: "Entra nel Miglior Quintetto di una lega.", check: p => p.trophies.bestFive >= 1 },
  // titoli
  { id: "title", cat: "team", icon: "🏆", title: "Campione", desc: "Vinci un campionato.", check: p => p.trophies.rings + p.trophies.domesticTitles >= 1 },
  { id: "ring", cat: "team", icon: "💍", title: "Anello", desc: "Vinci il titolo USA-1.", check: p => p.trophies.rings >= 1 },
  { id: "rings3", cat: "team", icon: "💍", title: "Dinastia", desc: "Vinci 3 titoli USA-1.", check: p => p.trophies.rings >= 3, progress: p => [p.trophies.rings, 3] },
  { id: "threepeat", cat: "team", icon: "🔥", title: "Three-peat", desc: "Vinci 3 campionati di fila.", check: p => maxTitleStreak(p) >= 3 },
  { id: "euroleague", cat: "team", icon: "🏟️", title: "Re d'Europa", desc: "Vinci la EUROPE-1.", check: p => p.trophies.euroleague >= 1 },
  { id: "eurocup", cat: "team", icon: "🏟️", title: "Coppa in bacheca", desc: "Vinci la EUROPE-2.", check: p => (p.trophies.eurocup || 0) >= 1 },
  { id: "nationalCup", cat: "team", icon: "🏆", title: "Re di Coppe", desc: "Vinci una coppa nazionale a metà stagione.", check: p => (p.trophies.nationalCups || 0) >= 1 },
  { id: "medal", cat: "team", icon: "🥉", title: "Sul podio", desc: "Vinci una medaglia con la Nazionale.", check: p => p.trophies.medals >= 1 },
  { id: "gold", cat: "team", icon: "🥇", title: "Oro", desc: "Vinci il Mondiale o l'Europeo.", check: p => p.trophies.worldCupTitles + p.trophies.eurobasketTitles >= 1 },
  // statistiche
  { id: "ppg25", cat: "stats", icon: "🎯", title: "Bomber", desc: "Chiudi una stagione a 25 punti di media.", check: p => anySeason(p, h => h.pts >= 25) },
  { id: "ppg30", cat: "stats", icon: "🔥", title: "Macchina da punti", desc: "Chiudi una stagione a 30 punti di media.", check: p => anySeason(p, h => h.pts >= 30) },
  { id: "apg10", cat: "stats", icon: "🧠", title: "Regista", desc: "Chiudi una stagione a 10 assist di media.", check: p => anySeason(p, h => h.ast >= 10) },
  { id: "rpg12", cat: "stats", icon: "🧲", title: "Padrone dei rimbalzi", desc: "Chiudi una stagione a 12 rimbalzi di media.", check: p => anySeason(p, h => h.reb >= 12) },
  { id: "double", cat: "stats", icon: "✌️", title: "Doppia doppia", desc: "Una stagione in doppia cifra di media in due voci tra punti, rimbalzi e assist.",
    check: p => anySeason(p, h => [h.pts, h.reb, h.ast].filter(v => v >= 10).length >= 2) },
  { id: "pts10k", cat: "stats", icon: "📈", title: "10.000 punti", desc: "Segna 10.000 punti in carriera.", check: p => careerPts(p) >= 10000, progress: p => [careerPts(p), 10000] },
  { id: "pts20k", cat: "stats", icon: "🚀", title: "20.000 punti", desc: "Segna 20.000 punti in carriera.", check: p => careerPts(p) >= 20000, progress: p => [careerPts(p), 20000] },
  { id: "clutch25", cat: "stats", icon: "❄️", title: "Sangue freddo", desc: "Vinci 25 possessi decisivi ai playoff.", check: p => (p.clutch && p.clutch.made) >= 25, progress: p => [(p.clutch && p.clutch.made) || 0, 25] },
  // fuori dal campo
  { id: "rich", cat: "life", icon: "💰", title: "Milionario", desc: "Raggiungi 10 milioni di patrimonio.", check: p => p.wealth >= 10, progress: p => [round1(p.wealth), 10] },
  { id: "tycoon", cat: "life", icon: "🏦", title: "Impero", desc: "Raggiungi 100 milioni di patrimonio.", check: p => p.wealth >= 100, progress: p => [round1(p.wealth), 100] },
  { id: "icon", cat: "life", icon: "📣", title: "Icona", desc: "Arriva a 3 milioni l'anno di sponsor.", check: p => p.sponsorIncome >= 3, progress: p => [round1(p.sponsorIncome), 3] },
  { id: "respected", cat: "life", icon: "🤲", title: "Stimato da tutti", desc: "Arriva a 90 di reputazione.", check: p => reputationOf(p) >= 90 },
  { id: "charity", cat: "life", icon: "💛", title: "Cuore d'oro", desc: "Apri una fondazione benefica.", check: p => (p.charityYears || 0) >= 1 },
  { id: "sponsor", cat: "life", icon: "🤝", title: "Uomo immagine", desc: "Porta a termine un contratto di sponsorizzazione.", check: p => p.history.some(h => (h.sponsorResults || []).some(r => r.met && r.text.includes("concluso"))) },
  { id: "comeback", cat: "career", icon: "🏥", title: "Più forte di prima", desc: "Torna da un infortunio grave e gioca una stagione da All-Star.", check: p => p.history.some((h, i) => h.seriousInjury && p.history.slice(i + 1).some(n => (n.awards || []).some(a => a.startsWith("All-Star")))) },
  { id: "parent", cat: "life", icon: "👶", title: "Genitore", desc: "Diventa genitore durante la carriera.", check: p => !!(p.family && p.family.children.length) },
  { id: "collector", cat: "life", icon: "🛍️", title: "Collezionista", desc: "Possiedi 5 oggetti di lifestyle.", check: p => (p.lifestyle || []).length >= 5, progress: p => [(p.lifestyle || []).length, 5] },
  { id: "yacht", cat: "life", icon: "🛥️", title: "Lupo di mare", desc: "Compra uno yacht.", check: p => (p.lifestyle || []).some(o => o.id === "yacht") },
  { id: "abroad", cat: "life", icon: "🌍", title: "Cittadino del mondo", desc: "Ambientati del tutto in un paese straniero.", check: p => (p.adaptedCountries || []).length >= 1 },
  // leggenda
  { id: "dream", cat: "legend", icon: "🌠", title: "Sogno realizzato", desc: "Realizza il tuo sogno di carriera.", check: p => !!(p.careerGoal && p.careerGoal.status === "done") },
  { id: "farewell", cat: "legend", icon: "👋", title: "L'ultimo giro", desc: "Chiudi la carriera con un tour d'addio.", check: p => p.retired && !!p.farewellTour },
  { id: "homecoming", cat: "legend", icon: "🏠", title: "Ritorno a casa", desc: "Firma l'ultimo contratto con la squadra della tua vita.", check: p => !!p.homecoming },
  { id: "captain", cat: "legend", icon: "🎖️", title: "Capitano", desc: "Ricevi la fascia di capitano.", check: p => (p.captainCount || 0) >= 1 },
  { id: "mentor", cat: "legend", icon: "🎓", title: "Il maestro", desc: "Il giovane che hai seguito diventa una stella.", check: p => !!(p.mentee && p.mentee.star) },
  { id: "afterlife", cat: "legend", icon: "📋", title: "Seconda vita", desc: "Resta nel basket dopo il ritiro.", check: p => !!p.afterCareer },
  { id: "family", cat: "legend", icon: "👨‍👦", title: "Figlio d'arte", desc: "Gioca la carriera di un figlio o una figlia.", check: p => !!p.legacy },
  { id: "jersey", cat: "legend", icon: "👕", title: "Appesa al soffitto", desc: "Una squadra ritira la tua maglia.", check: p => p.retired && retiredJerseys().length >= 1 },
  { id: "hof", cat: "legend", icon: "🏛️", title: "Hall of Fame", desc: "Entra nella Hall of Fame.", check: p => p.retired && hallOfFameVerdict().elected },
  { id: "gradeS", cat: "legend", icon: "🐐", title: "Leggenda", desc: "Chiudi una carriera con il voto S.", check: p => p.retired && computeCareerGrade().grade === "S" },
  { id: "hardRing", cat: "legend", icon: "⚔️", title: "Contro tutti", desc: "Vinci un anello USA-1 a difficoltà Leggenda.", check: p => p.difficulty === "legend" && p.trophies.rings >= 1 },
];
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
  if (!quiet) fresh.forEach(a => pushNews(`🏅 Traguardo sbloccato: ${a.title}.`));
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
    ? `<div class="ach-summary"><div><strong>${mineCount}</strong> / ${total} in questa carriera</div><div class="small-muted">${globalCount} / ${total} sbloccati in tutte le tue carriere</div></div>`
    : `<div class="ach-summary"><div><strong>${globalCount}</strong> / ${total} traguardi sbloccati</div><div class="small-muted">Tra tutte le carriere giocate in questo browser</div></div>`;
  const bar = `<div class="ach-progress big"><div class="ach-bar" style="width:${((scope === "career" ? mineCount : globalCount) / total) * 100}%"></div></div>`;

  const cats = ACHIEVEMENT_CATEGORIES.map(cat => {
    const items = ACHIEVEMENTS.filter(a => a.cat === cat.id).map(a => {
      const here = mine[a.id] != null;
      const elsewhere = global[a.id];
      const state = here ? "unlocked" : elsewhere ? (scope === "career" ? "elsewhere" : "unlocked") : "locked";
      let meta = "";
      if (here) meta = `Sbloccato nel ${mine[a.id]}`;
      else if (elsewhere) meta = scope === "career" ? `Già riuscito a <span class="ach-who"></span>` : `<span class="ach-who"></span> · ${elsewhere.year}`;
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
    <div class="ach-cat"><div class="ach-cat-title">Albo d'oro delle carriere</div>
      ${hall.length ? `<div class="hall-list">${hall.map((h, i) => `
        <div class="hall-row" data-hall="${i}">
          <span class="hall-grade grade-${h.grade}">${h.grade}</span>
          <span class="hall-name"></span>
          <span class="small-muted">${h.from}-${h.to} · 👑 ${h.goat} · 💍 ${h.rings} · ⭐ ${h.mvp}${h.hof ? " · 🏛️" : ""}${h.generation > 1 ? ` · ${h.generation}ª generazione` : ""}</span>
        </div>`).join("")}</div>` : `<p class="small-muted">Qui compariranno le carriere concluse.</p>`}
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
