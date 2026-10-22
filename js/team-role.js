"use strict";

/* ================================================================
   RUOLO IN SQUADRA — ogni offerta dice con che ruolo arrivi (dalla Stella al Giovane) e
   quali responsabilità ti porti dietro. Il ruolo decide i minuti; in trattativa si può
   chiedere un gradino in più. Nel corso del contratto il coach mantiene la promessa, ma se
   il tuo livello si allontana di molto da quel ruolo ti promuove o ti ridimensiona.
   ================================================================ */
const TEAM_ROLES = i18nify([
  { id: "star", icon: "🌟", label: "Stella", labelEn: "Franchise Star", minutesLabel: "Franchigia", mpg: [34, 38],
    resp: ["Primo violino: l'attacco passa da te", "I tiri decisivi nei finali", "Il volto della squadra con media e sponsor", "Se la squadra delude, la colpa è tua"],
    respEn: ["First option: the offense runs through you", "Clutch shots down the stretch", "Face of the franchise with media & sponsors", "If the team falls short, the blame is on you"] },
  { id: "key", icon: "🔑", label: "Giocatore Importante", labelEn: "Key Player", minutesLabel: "Titolare", mpg: [31, 35],
    resp: ["Seconda opzione offensiva", "In campo nei minuti che contano", "Esempio per i compagni"],
    respEn: ["Second offensive option", "On the floor in crunch time", "Leader by example for teammates"] },
  { id: "starter", icon: "🏀", label: "Titolare", labelEn: "Starter", minutesLabel: "Titolare", mpg: [27, 32],
    resp: ["In quintetto ogni sera", "Un compito preciso nel sistema del coach"],
    respEn: ["In the starting five every night", "A clear role in the coach's system"] },
  { id: "sixth", icon: "🔥", label: "Sesto uomo", labelEn: "Sixth Man", minutesLabel: "6° Uomo", mpg: [20, 27],
    resp: ["Il primo cambio: energia e punti dalla panchina", "Pronto a partire titolare quando serve"],
    respEn: ["First sub off the bench: instant energy and scoring", "Ready to step into the starting lineup when needed"] },
  { id: "role", icon: "🧩", label: "Comprimario", labelEn: "Role Player", minutesLabel: "Panchina", mpg: [12, 19],
    resp: ["Pochi minuti, compiti specifici: difesa, blocchi, tiri piazzati"],
    respEn: ["Limited minutes, specific duties: defense, screens, spot-up shots"] },
  { id: "young", icon: "🌱", label: "Giovane", labelEn: "Prospect", minutesLabel: "Panchina", mpg: [8, 16],
    resp: ["Crescere in allenamento con i grandi (crescita più rapida)", "Minuti da guadagnarsi"],
    respEn: ["Develop in practice alongside veterans (faster growth)", "Minutes must be earned"] },
]);
function teamRoleIndex(id) { const i = TEAM_ROLES.findIndex(r => r.id === id); return i < 0 ? 3 : i; }
function getTeamRole(id) { return TEAM_ROLES[teamRoleIndex(id)]; }

/* Il ruolo "naturale": quanto sei sopra la media della lega, un po' più su nelle squadre
   deboli (che hanno bisogno di te) e un po' più giù in quelle di vertice */
function naturalTeamRoleIndex(p, leagueId, teamStrength) {
  const pct = teamStrength != null ? teamStrengthPercentile(teamStrength, leagueId) : 0.5;
  const diff = p.overall - LEAGUES[leagueId].avgOverall + (pct < 0.3 ? 2 : pct >= 0.75 ? -2 : 0);
  let idx = diff >= 14 ? 0 : diff >= 9 ? 1 : diff >= 4 ? 2 : diff >= -6 ? 3 : 4;
  if (idx === 4 && p.age <= 20) idx = 5; // i ragazzi in fondo alle rotazioni sono "giovani" da far crescere
  return idx;
}
function naturalTeamRole(p, leagueId, teamStrength) { return TEAM_ROLES[naturalTeamRoleIndex(p, leagueId, teamStrength)].id; }

/* Minuti della stagione: ruolo promesso dal contratto (o naturale), aggiustato dal coach
   se il livello è lontano, poi dagli imprevisti estivi, dallo staff e dalle clausole */
function seasonTeamRole(p, leagueId, teamStrength, mods) {
  mods = mods || {};
  const natural = naturalTeamRoleIndex(p, leagueId, teamStrength);
  const promised = p.contract && p.contract.yearsRemaining > 0 && p.contract.teamRole ? p.contract.teamRole : null;
  let idx = promised ? teamRoleIndex(promised) : natural;
  let note = null;
  if (promised && natural - idx >= 2) { idx++; note = tr(`📉 Il coach ti toglie responsabilità: non sei ancora al livello di ${getTeamRole(promised).label.toLowerCase()}.`, `📉 The coach scales back your responsibilities: you're not quite at ${getTeamRole(promised).label.toLowerCase()} level yet.`); }
  else if (promised && idx - natural >= 2) { idx--; note = tr(`📈 Sei cresciuto oltre il tuo ruolo: il coach ti dà più responsabilità.`, `📈 You've outgrown your role: the coach gives you more responsibility.`); }
  if (mods.benched) idx++;
  if (mods.minutesPenalty) idx += mods.minutesPenalty; // negativo = promozione nelle rotazioni
  if (mods.staffShift) idx -= mods.staffShift;
  idx = clamp(idx, 0, TEAM_ROLES.length - 1);
  if (idx === 5 && p.age > 21) idx = 4;
  if (idx === 4 && p.age <= 20 && !promised) idx = 5;
  if (mods.starter) idx = Math.min(idx, 2); // clausola: titolare garantito
  const r = TEAM_ROLES[idx];
  return { label: r.minutesLabel, mpg: randFloat(r.mpg[0], r.mpg[1]), teamRole: r.id, promised, note };
}
function teamRoleLabel(minutesInfo) {
  if (!minutesInfo || !minutesInfo.teamRole) return minutesInfo ? minutesInfo.label : "—";
  const r = getTeamRole(minutesInfo.teamRole);
  return `${r.icon} ${r.label}`;
}

/* Il Giovane cresce più in fretta; la Stella ha più riflettori (e più pressione, vedi goals.js) */
function teamRoleGrowthFactor(p) { return p.currentTeamRole === "young" ? 1.12 : 1; }
function teamRoleSeasonUpdate(p) {
  if (p.currentTeamRole === "star") p.popularity = clamp(p.popularity + 2, 0, 100);
  return null;
}

/* ---------- trattativa: chiedere più responsabilità ---------- */
function teamRoleAskChance(p, cp) {
  const idx = teamRoleIndex(cp.teamRole);
  return clamp(negotiationChance(p) - 0.12 - (idx <= 1 ? 0.1 : 0), 0.05, 0.85);
}
function canAskTeamRole(cp) { return !!cp.teamRole && teamRoleIndex(cp.teamRole) > 0; }
function nextTeamRoleUp(id) {
  const idx = teamRoleIndex(id);
  return TEAM_ROLES[idx === 5 ? 3 : Math.max(0, idx - 1)].id; // dal Giovane si passa a Sesto uomo
}

function teamRoleBoxHtml(cp) {
  if (!cp.teamRole) return "";
  const r = getTeamRole(cp.teamRole);
  return `
    <div class="team-role-box">
      <div class="trb-head"><span class="trb-n">${r.minutesLabel === "Franchigia" ? "1" : r.id === "key" ? "2" : r.id === "starter" ? "5" : r.id === "sixth" ? "6" : r.id === "role" ? "9" : "12"}</span><div><div class="trb-title">${tr(`Arrivi come ${r.label.toLowerCase()}`, `Joining as ${r.label.toLowerCase()}`)}</div>
        <div class="small-muted">${r.resp.length} ${tr("responsabilità", r.resp.length === 1 ? "responsibility" : "responsibilities")} · ${r.mpg[0]}-${r.mpg[1]} ${tr("minuti a partita", "minutes per game")}</div></div></div>
      <ul class="trb-list">${r.resp.map(x => `<li>${x}</li>`).join("")}</ul>
    </div>`;
}
