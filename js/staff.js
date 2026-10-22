"use strict";

/* ================================================================
   ALLENATORE E COMPAGNI — ogni squadra ha un coach con uno stile di gioco e una stella.
   Persistenti per nome squadra (come la forza), salvati con la carriera.
   ================================================================ */
const COACH_STYLES = [
  { id: "defense", icon: "🛡️", name: "Difensivo", nameEn: "Defensive", desc: "Chiede intensità dietro: più rubate e stoppate, meno punti.", descEn: "Demands intensity on the defensive end: more steals and blocks, fewer points.",
    stats: { pts: 0.95, stl: 1.12, blk: 1.12 } },
  { id: "pace", icon: "💨", name: "Run & Gun", nameEn: "Run & Gun", desc: "Ritmo altissimo: più volume in tutte le statistiche, ma più palle perse.", descEn: "Blistering pace: higher volume across all stats, but more turnovers.",
    stats: { pts: 1.05, reb: 1.03, ast: 1.05, tov: 1.15 } },
  { id: "inside", icon: "🏔️", name: "Gioco interno", nameEn: "Inside-Out", desc: "Tutto passa dai lunghi: ali grandi e centri producono di più, le guardie distribuiscono.", descEn: "Offense runs through the post: power forwards and centers produce more, guards distribute.",
    stats: {} },
  { id: "youth", icon: "🌱", name: "Sviluppo giovani", nameEn: "Youth Development", desc: "Punta sui ragazzi: fino a 23 anni più minuti e crescita più rapida, i veterani giocano meno.", descEn: "Trusts young talent: extra minutes and faster growth up to age 23, veterans play less.",
    stats: {} },
  { id: "demanding", icon: "🎖️", name: "Sergente di ferro", nameEn: "Hard-Nosed", desc: "Esigentissimo: si cresce di più con lui, ma la sua fiducia sale e scende il doppio.", descEn: "Relentless and demanding: boosts player development, but his trust swings twice as fast.",
    stats: {} },
];
function getCoachStyle(id) { return COACH_STYLES.find(c => c.id === id) || COACH_STYLES[0]; }
function coachStyleName(style) { return isEn() && style.nameEn ? style.nameEn : style.name; }
function coachStyleDesc(style) { return isEn() && style.descEn ? style.descEn : style.desc; }

const teamStaffRegistry = {};
function resetTeamStaff() { Object.keys(teamStaffRegistry).forEach(k => { delete teamStaffRegistry[k]; }); }

/* Gli allenatori sono quasi sempre del paese della lega, le stelle arrivano più spesso dall'estero */
function newCoach(leagueId) {
  return { name: randomFullName(nationalityOfLeague(leagueId, 20)), style: choice(COACH_STYLES).id, seasons: 0 };
}
/* La stella della squadra: più forte quanto più la squadra è in alto nella sua lega */
function newStar(team, leagueId) {
  const pct = teamStrengthPercentile(getTeamStrength(team, leagueId), leagueId);
  const overall = clamp(Math.round(LEAGUES[leagueId].avgOverall + 2 + pct * 12 + randInt(-3, 3)), 55, 97);
  const nationality = nationalityOfLeague(leagueId, leagueId === "NBA" ? 30 : 45);
  return { name: randomFullName(nationality), nationality, role: choice(ROLES).id, overall };
}
function getTeamStaff(team, leagueId) {
  if (!teamStaffRegistry[team.name]) teamStaffRegistry[team.name] = { coach: newCoach(leagueId), star: newStar(team, leagueId) };
  return teamStaffRegistry[team.name];
}

/* Gerarchia con la stella: chi è la prima opzione in attacco */
function teamHierarchy(p, star) {
  if (!star) return { id: "first", label: tr("Prima opzione", "First Option"), stats: { pts: 1.03 } };
  if (p.overall > star.overall + 2) return { id: "first", label: tr("Prima opzione", "First Option"), stats: { pts: 1.03 } };
  if (p.overall >= star.overall - 3) return { id: "duo", label: tr("Coppia di stelle", "Star Duo"), stats: {} };
  return { id: "second", label: tr("Seconda opzione", "Second Option"), stats: { pts: 0.95, ast: 1.05 } };
}

/* Moltiplicatori di statistica per la stagione: stile del coach e gerarchia in squadra */
function staffStatMultipliers(p, staff) {
  const mult = { pts: 1, reb: 1, ast: 1, stl: 1, blk: 1, tov: 1 };
  const apply = m => Object.entries(m || {}).forEach(([k, v]) => { mult[k] *= v; });
  const style = getCoachStyle(staff.coach.style);
  apply(style.stats);
  if (style.id === "inside") apply(p.role === "PF" || p.role === "C" ? { pts: 1.1, reb: 1.08 } : { pts: 0.94, ast: 1.05 });
  apply(teamHierarchy(p, staff.star).stats);
  return mult;
}

/* Fiducia del coach (0-100): minuti in più se alta, in meno se bassa */
function coachTrustOf(p) { return p.coachTrust == null ? 55 : p.coachTrust; }
function changeCoachTrust(p, delta) {
  const staff = p.team && getTeamStaff(p.team, p.league);
  const factor = staff && staff.coach.style === "demanding" ? 2 : 1;
  p.coachTrust = clamp(Math.round(coachTrustOf(p) + delta * factor), 0, 100);
}
function starRapportOf(p) { return p.starRapport == null ? 55 : p.starRapport; }

/* Correzione del minutaggio da staff: fiducia del coach e stile "sviluppo giovani" */
function staffMinutesShift(p, staff) {
  let shift = 0;
  const trust = coachTrustOf(p);
  if (trust >= 80) shift += 1;
  else if (trust <= 25) shift -= 1;
  if (staff.coach.style === "youth") shift += p.age <= 23 ? 1 : p.age >= 30 ? -1 : 0;
  return shift;
}
/* Moltiplicatore di crescita: il sergente fa crescere tutti, lo sviluppo giovani i ragazzi */
function staffGrowthFactor(p) {
  if (!p.team) return 1;
  const staff = getTeamStaff(p.team, p.league);
  if (staff.coach.style === "demanding") return 1.06;
  if (staff.coach.style === "youth") return p.age <= 23 ? 1.1 : 0.95;
  return 1;
}

/* Fine stagione: fiducia e intesa si aggiornano, il coach può saltare, la stella andarsene */
function staffSeasonUpdate(p, team, leagueId, performanceScore, winPct) {
  const staff = getTeamStaff(team, leagueId);
  const notes = [];
  const style = staff.coach.style;
  let trust = performanceScore >= 0.6 ? 3 : performanceScore < 0.3 ? -3 : 0;
  if (style === "defense" && p.attrs.defense >= 75) trust += 3;
  if (style === "youth" && p.age <= 23) trust += 3;
  if (style === "inside" && (p.role === "PF" || p.role === "C")) trust += 2;
  if (style === "pace" && p.attrs.athleticism >= 75) trust += 2;
  changeCoachTrust(p, trust);
  // la fiducia non è per sempre: senza conferme torna lentamente verso il neutro
  p.coachTrust = clamp(Math.round(coachTrustOf(p) + (55 - coachTrustOf(p)) * 0.15), 0, 100);
  // l'intesa con la stella tende lentamente verso la media, e si guasta se la squadra perde
  p.starRapport = clamp(Math.round(starRapportOf(p) + (55 - starRapportOf(p)) * 0.1 + (winPct < 0.4 ? -3 : 0)), 0, 100);
  if (starRapportOf(p) <= 30) p.chemistry = clamp(p.chemistry - 3, 0, 100);

  staff.coach.seasons++;
  if (rollChance(winPct < 0.4 ? 35 : 8)) {
    const old = staff.coach.name;
    staff.coach = newCoach(leagueId);
    p.coachTrust = 55;
    notes.push(tr(`🔄 ${team.name} cambia allenatore: via ${old}, arriva ${staff.coach.name} (${coachStyleName(getCoachStyle(staff.coach.style))}).`, `🔄 ${team.name} changes head coach: ${old} is out, ${staff.coach.name} (${coachStyleName(getCoachStyle(staff.coach.style))}) takes over.`));
  }
  const outgrown = p.overall > staff.star.overall + 5;
  // la seconda stella voluta da te resta almeno un paio di stagioni
  const requestedStay = staff.star.requested && p.year - staff.star.since < 2;
  if (rollChance(requestedStay ? 3 : outgrown ? 20 : 8)) {
    const old = staff.star.name;
    releaseRequestedStar(team, leagueId, staff.star);
    staff.star = newStar(team, leagueId);
    p.starRapport = 55;
    notes.push(outgrown
      ? tr(`⭐ ${old} lascia ${team.name}: ora la squadra è tua.`, `⭐ ${old} leaves ${team.name}: this is your team now.`)
      : tr(`⭐ ${old} lascia ${team.name}; il nuovo leader è ${staff.star.name}.`, `⭐ ${old} leaves ${team.name}; the new team leader is ${staff.star.name}.`));
  }
  notes.forEach(n => pushNews(n));
  return notes;
}

function renderTeamCard() {
  const box = el("team-card");
  const staff = getTeamStaff(player.team, player.league);
  const style = getCoachStyle(staff.coach.style);
  const hier = teamHierarchy(player, staff.star);
  const trust = coachTrustOf(player), rapport = starRapportOf(player);
  const meter = (v, color) => `<div class="abar-wrap"><div class="abar" style="width:${v}%;background:${color}"></div></div>`;
  box.innerHTML = `
    <div class="staff-row">
      <div class="staff-icon co-num"></div>
      <div class="staff-body">
        <div class="staff-title"><span class="staff-name"></span> <span class="badge">${coachStyleName(style)}</span></div>
        <div class="small-muted">${coachStyleDesc(style)}</div>
        <div class="attr-row"><div class="al">${tr("Fiducia", "Trust")} ${helpTip("coachTrust")}</div>${meter(trust, "var(--live)")}<div class="av">${trust}</div></div>
      </div>
    </div>
    <div class="staff-row">
      <div class="staff-icon co-num"></div>
      <div class="staff-body">
        <div class="staff-title"><span class="star-name"></span> <span class="badge">${getRoleName(staff.star.role)} · OVR ${staff.star.overall}</span>${staff.star.requested ? ` <span class="badge gold">${tr("Coppia di stelle", "Star Duo")}</span>` : ""}</div>
        <div class="small-muted">${tr("In attacco sei:", "Offensive role:")} <strong>${hier.label}</strong></div>
        <div class="attr-row"><div class="al">${tr("Intesa", "Rapport")} ${helpTip("starRapport")}</div>${meter(rapport, "var(--live)")}<div class="av">${rapport}</div></div>
      </div>
    </div>`;
  box.querySelector(".staff-name").textContent = `Coach ${staff.coach.name}`;
  box.querySelector(".star-name").textContent = staff.star.name;
  // le iniziali al posto delle icone (identità broadcast: niente emoji)
  const initials = n => n.split(/\s+/).map(w => w[0] || "").join("").slice(0, 2).toUpperCase();
  const icons = box.querySelectorAll(".staff-icon");
  if (icons.length === 2) {
    icons[0].textContent = initials(staff.coach.name);
    icons[1].textContent = initials(staff.star.name);
  }
}
