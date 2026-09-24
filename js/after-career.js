"use strict";

/* ================================================================
   DOPO IL RITIRO — un epilogo: allenatore, dirigente o opinionista in TV. Si sceglie
   una volta dalla schermata finale; qualche stagione viene simulata in blocco e il
   racconto entra nell'eredità della carriera.
   ================================================================ */
const AFTER_CAREER_ROLES = [
  { id: "coach", icon: "📋", label: "Allenatore", desc: "Dalla panchina, nella squadra che ti conosce meglio: tattica, spogliatoio e pressione del risultato." },
  { id: "executive", icon: "💼", label: "Dirigente", desc: "General manager: costruisci la squadra, scegli al Draft, tratti con gli agenti." },
  { id: "media", icon: "🎙️", label: "Opinionista TV", desc: "Commenti le partite in prima serata: popolarità assicurata, zero stress." },
];

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
    out.lines.push(`${out.seasons} stagioni da opinionista in prima serata.`);
    out.lines.push(out.awards ? "Premiato come miglior commentatore sportivo dell'anno." : "Le sue analisi diventano un appuntamento fisso per i tifosi.");
    return out;
  }
  out.seasons = roleId === "coach" ? randInt(3, 9) : randInt(4, 10);
  const titleChance = clamp(4 + score / 45 + (rep - 50) / 8, 3, 22);
  for (let i = 0; i < out.seasons; i++) {
    if (rollChance(titleChance)) out.titles++;
    if (rollChance(roleId === "coach" ? 12 : 10)) out.awards++;
  }
  const who = roleId === "coach" ? "in panchina" : "da general manager";
  out.lines.push(`${out.seasons} stagioni ${who} a ${home.team.name} (${LEAGUES[home.league].name}).`);
  out.lines.push(out.titles ? `${out.titles} ${out.titles === 1 ? "titolo vinto" : "titoli vinti"}.` : "Nessun titolo, ma una squadra sempre competitiva.");
  if (out.awards) out.lines.push(`${out.awards} volte ${roleId === "coach" ? "Allenatore" : "Dirigente"} dell'Anno.`);
  return out;
}

function chooseAfterCareer(roleId) {
  if (!player || !player.retired || player.afterCareer || !AFTER_CAREER_ROLES.some(r => r.id === roleId)) return;
  player.afterCareer = simulateAfterCareer(player, roleId);
  checkAchievements(player);
  renderAfterCareer("final-after-career");
  saveCareer();
}

function renderAfterCareer(targetId) {
  const box = el(targetId);
  if (!box) return;
  const ac = player.afterCareer;
  if (!ac) {
    box.innerHTML = `
      <p class="small-muted" style="margin-bottom:10px">Appese le scarpe al chiodo, cosa fai della tua vita nel basket? Una scelta sola.</p>
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
