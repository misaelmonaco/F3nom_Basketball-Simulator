"use strict";

/* ================================================================
   SFIDA PER IL POSTO — a volte la società ingaggia un giocatore nel tuo ruolo. Al training
   camp ci si gioca il posto (scegliendo come), e chi lo perde parte con meno minuti; tratto
   dopo tratto si può riprenderselo, soprattutto spingendo in allenamento e in partita.
   ================================================================ */
const ROLE_BATTLE_APPROACHES = [
  { id: "work", icon: "🏋️", label: "Allenamenti extra", labelEn: "Extra Workouts", desc: "Resti in palestra dopo ogni seduta: ti dà un vantaggio netto, ma arrivi alla stagione con meno energie.", descEn: "Stay in the gym after every practice: gives you a clear edge, but you start the season with less stamina.",
    bonus: () => 6, apply(p) { p.stamina = clamp(p.stamina - 8, 0, 100); } },
  { id: "team", icon: "🤝", label: "Gioca per la squadra", labelEn: "Play for the Team", desc: "Fai vedere al coach che rendi migliori i compagni: conta la chimica con lo spogliatoio.", descEn: "Show the coach you make your teammates better: locker room chemistry matters here.",
    bonus: p => (p.chemistry - 50) / 4, apply(p) { p.chemistry = clamp(p.chemistry + 3, 0, 100); } },
  { id: "coach", icon: "🗣️", label: "Parla con l'allenatore", labelEn: "Talk to the Coach", desc: "Chiedi chiarezza sul tuo ruolo: se si fida di te è fatta, altrimenti rischi di irritarlo.", descEn: "Ask for clarity on your role: if he trusts you, the job is yours; otherwise you risk annoying him.",
    bonus: p => (coachTrustOf(p) - 50) / 3, apply() {} },
];
if (typeof i18nify === "function") i18nify(ROLE_BATTLE_APPROACHES);
const ROLE_BATTLE_MINUTES = 6; // minuti a partita in meno per chi perde il posto

/* All'inizio della stagione: arriva un concorrente? Mai per chi è già la franchigia o ha il posto garantito */
function maybeRoleBattle(p, s, starterClause) {
  if (p.age < 19 || starterClause || s.minutesInfo.label === "Franchigia") return null;
  const pct = teamStrengthPercentile(s.teamStrength, s.seasonLeague);
  if (!rollChance(18 + (pct >= 0.6 ? 10 : 0))) return null;
  const nationality = nationalityOfLeague(s.seasonLeague, 40);
  return { rival: { name: randomFullName(nationality), overall: clamp(p.overall + randInt(-2, 4), 45, 99) }, status: "pending", approach: null, regainedIn: null };
}

function roleBattleScore(p, battle, approach) {
  return (p.overall - battle.rival.overall) * 4 + approach.bonus(p) + (coachTrustOf(p) - 55) / 5 + randInt(-10, 10);
}

function resolveRoleBattle(approachId) {
  const d = player.pendingDecision, s = player.pendingSeason;
  if (!d || d.type !== "roleBattle" || !s || !s.roleBattle) return;
  const approach = ROLE_BATTLE_APPROACHES.find(a => a.id === approachId) || ROLE_BATTLE_APPROACHES[0];
  const battle = s.roleBattle;
  approach.apply(player);
  const won = roleBattleScore(player, battle, approach) >= 0;
  battle.approach = approach.id;
  battle.status = won ? "ahead" : "behind";
  if (approach.id === "coach") changeCoachTrust(player, won ? 3 : -4);
  if (won) {
    player.morale = clamp(player.morale + 3, 0, 100);
    toast(tr(`💪 Il posto resta tuo: ${battle.rival.name} parte dalla panchina.`, `💪 The spot remains yours: ${battle.rival.name} comes off the bench.`));
  } else {
    player.morale = clamp(player.morale - 4, 0, 100);
    toast(tr(`😤 ${battle.rival.name} ti ha superato nelle gerarchie: parti con meno minuti.`, `😤 ${battle.rival.name} passed you on the depth chart: you start with fewer minutes.`));
  }
  player.pendingDecision = nextSeasonBlockDecision();
  renderGameScreen();
}

/* Dopo un tratto giocato da "rincorsa": si può riprendere il posto */
function roleBattleAfterBlock(p, battle, block) {
  if (!battle || battle.status !== "behind") return null;
  const chance = clamp(30 + (p.overall - battle.rival.overall) * 5 + (block.workload === "push" ? 12 : 0) + (block.stats.pts >= 8 ? 5 : 0), 5, 85);
  if (!rollChance(chance)) return false;
  battle.status = "ahead";
  battle.regainedIn = block.name;
  pushNews(tr(`💪 ${block.name}: ti sei ripreso il posto da titolare, ${battle.rival.name} torna in panchina.`, `💪 ${block.name}: you reclaimed your starting spot, ${battle.rival.name} moves back to the bench.`));
  return true;
}

function roleBattleStatusHtml(battle) {
  if (!battle || battle.status === "pending") return "";
  const text = battle.status === "ahead"
    ? tr(`Il posto è tuo${battle.regainedIn ? ` (ripreso in ${battle.regainedIn})` : ""}: ${battle.rival.name} (OVR ${battle.rival.overall}) parte dietro.`, `The spot is yours${battle.regainedIn ? ` (reclaimed in ${battle.regainedIn})` : ""}: ${battle.rival.name} (OVR ${battle.rival.overall}) is behind you.`)
    : tr(`${battle.rival.name} (OVR ${battle.rival.overall}) ti ha superato: giochi ${ROLE_BATTLE_MINUTES} minuti in meno finché non ti riprendi il posto. Il carico alto aiuta.`, `${battle.rival.name} (OVR ${battle.rival.overall}) is ahead of you: you play ${ROLE_BATTLE_MINUTES} fewer minutes until you win the spot back. High intensity helps.`);
  return `<div class="rb-status ${battle.status}">⚔️ ${text}</div>`;
}

function renderRoleBattle(d, titleEl, subEl, cards) {
  const b = player.pendingSeason.roleBattle;
  titleEl.textContent = tr("Sfida per il posto", "Position Battle");
  subEl.textContent = tr(
    `La società ha preso ${b.rival.name} (OVR ${b.rival.overall}, tu ${player.overall}), che gioca nel tuo ruolo. Al training camp ci si gioca il posto da titolare: come lo affronti?`,
    `The club signed ${b.rival.name} (OVR ${b.rival.overall}, you are ${player.overall}) at your position. Training camp will decide the starting spot: how do you approach it?`
  );
  cards.innerHTML = ROLE_BATTLE_APPROACHES.map((a, i) => offCardHtml({ idx: i, icon: a.icon, title: a.label, desc: a.desc })).join("");
  cards.querySelectorAll(".off-card").forEach(c => c.addEventListener("click", () => resolveRoleBattle(ROLE_BATTLE_APPROACHES[parseInt(c.dataset.idx)].id)));
}
