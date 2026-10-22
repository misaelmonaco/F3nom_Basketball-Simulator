"use strict";

/* ================================================================
   DOPO IL RITIRO — un epilogo: allenatore, dirigente o opinionista in TV. Si sceglie
   una volta dalla schermata finale; qualche stagione viene simulata in blocco e il
   racconto entra nell'eredità della carriera.
   ================================================================ */
const AFTER_CAREER_ROLES = [
  { id: "coach", icon: "📋", label: "Allenatore", labelEn: "Head Coach", desc: "Dalla panchina, nella squadra che ti conosce meglio: tattica, spogliatoio e pressione del risultato.", descEn: "From the sidelines of the club that knows you best: tactics, locker room management, and pressure to win." },
  { id: "executive", icon: "💼", label: "Dirigente", labelEn: "Front Office Executive", desc: "General manager: costruisci la squadra, scegli al Draft, tratti con gli agenti.", descEn: "General manager: build the roster, make Draft picks, and negotiate with agents." },
  { id: "media", icon: "🎙️", label: "Opinionista TV", labelEn: "TV Analyst", desc: "Commenti le partite in prima serata: popolarità assicurata, zero stress.", descEn: "Call prime-time games on television: guaranteed popularity and zero stress." },
];
if (typeof i18nify === "function") i18nify(AFTER_CAREER_ROLES);

/* La squadra della vita: quella con più stagioni in carriera */
function careerHomeTeam(p) {
  const byTeam = {};
  p.history.forEach(h => { (byTeam[h.team.name] = byTeam[h.team.name] || { team: h.team, league: h.league, seasons: 0 }).seasons++; });
  return Object.values(byTeam).sort((a, b) => b.seasons - a.seasons)[0] || { team: p.team, league: p.league, seasons: 0 };
}

function simulateAfterCareer(p, roleId) {
  const home = careerHomeTeam(p);
  const score = computeCareerGrade().score;
  const rep = reputationOf(p);
  const out = { role: roleId, team: home.team.name, league: home.league, seasons: 0, titles: 0, awards: 0, lines: [] };
  if (roleId === "media") {
    out.seasons = randInt(6, 15);
    out.awards = rollChance(clamp(p.popularity * 0.6, 10, 70)) ? 1 : 0;
    out.lines.push(tr(`${out.seasons} stagioni da opinionista in prima serata.`, `${out.seasons} seasons as a prime-time TV analyst.`));
    out.lines.push(out.awards ? tr("Premiato come miglior commentatore sportivo dell'anno.", "Won Sports Broadcaster of the Year.") : tr("Le sue analisi diventano un appuntamento fisso per i tifosi.", "His breakdowns become a fan-favorite staple on broadcast nights."));
    return out;
  }
  out.seasons = roleId === "coach" ? randInt(3, 9) : randInt(4, 10);
  const titleChance = clamp(4 + score / 45 + (rep - 50) / 8, 3, 22);
  for (let i = 0; i < out.seasons; i++) {
    if (rollChance(titleChance)) out.titles++;
    if (rollChance(roleId === "coach" ? 12 : 10)) out.awards++;
  }
  const who = roleId === "coach" ? tr("in panchina", "as head coach") : tr("da general manager", "as general manager");
  out.lines.push(tr(`${out.seasons} stagioni ${who} a ${home.team.name} (${LEAGUES[home.league].name}).`, `${out.seasons} seasons ${who} for ${home.team.name} (${LEAGUES[home.league].name}).`));
  out.lines.push(out.titles ? tr(`${out.titles} ${out.titles === 1 ? "titolo vinto" : "titoli vinti"}.`, `${out.titles} ${out.titles === 1 ? "championship won" : "championships won"}.`) : tr("Nessun titolo, ma una squadra sempre competitiva.", "No titles, but fielded a consistently competitive team."));
  if (out.awards) out.lines.push(tr(`${out.awards} volte ${roleId === "coach" ? "Allenatore" : "Dirigente"} dell'Anno.`, `${out.awards}× ${roleId === "coach" ? "Coach" : "Executive"} of the Year.`));
  return out;
}

function chooseAfterCareer(roleId) {
  if (!player || !player.retired || player.afterCareer || !AFTER_CAREER_ROLES.some(r => r.id === roleId)) return;
  player.afterCareer = simulateAfterCareer(player, roleId);
  checkAchievements(player);
  renderAfterCareer("final-after-career");
  renderBiography("final-biography");
  saveCareer();
}

function renderAfterCareer(targetId) {
  const box = el(targetId);
  if (!box) return;
  const ac = player.afterCareer;
  if (!ac) {
    box.innerHTML = `
      <p class="small-muted" style="margin-bottom:10px">${tr("Appese le scarpe al chiodo, cosa fai della tua vita nel basket? Una scelta sola.", "Now that you've hung up your sneakers, what's your next chapter in basketball? Choose one path.")}</p>
      <div class="sb-options">${AFTER_CAREER_ROLES.map(r => `
        <button type="button" class="option-card sb-choice" data-after="${r.id}">
          <div class="oc-title">${r.icon} ${r.label}</div>
          <div class="oc-desc">${r.desc}</div>
        </button>`).join("")}</div>`;
    box.querySelectorAll("[data-after]").forEach(b => b.addEventListener("click", () => chooseAfterCareer(b.dataset.after)));
    return;
  }
  const role = AFTER_CAREER_ROLES.find(r => r.id === ac.role);
  box.innerHTML = `
    <div class="dream-card done">
      <div class="dream-icon">${role.icon}</div>
      <div class="dream-body">
        <div class="dream-title">${role.label}${ac.titles ? ` <span class="badge gold">🏆 ${ac.titles}</span>` : ""}</div>
        ${ac.lines.map(l => `<div class="small-muted">${l}</div>`).join("")}
      </div>
    </div>`;
}
