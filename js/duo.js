"use strict";

/* ================================================================
   COPPIA DI STELLE — da Stella della squadra, d'estate, si può chiedere alla dirigenza
   di portare un altro giocatore di primo piano. Si sceglie come chiederlo (in privato,
   tramite i media o rinunciando a parte dell'ingaggio); se la società dice sì arriva una
   stella del tuo livello, che prende il posto di quella attuale: la squadra diventa più
   forte finché resta, e l'intesa con lui pesa sullo spogliatoio.
   ================================================================ */
const DUO_STRENGTH_BUMP = 0.06;   // forza di squadra in più finché la seconda stella resta
const DUO_COOLDOWN_YEARS = 2;     // dopo un no, per un paio d'anni non si richiede
const DUO_APPROACHES = [
  { id: "private", label: "Chiedilo in privato", desc: "Un colloquio con il presidente: nessun rischio, ma la società può prendersi il suo tempo.", bonus: 0 },
  { id: "media", label: "Chiedilo tramite i media", desc: "Metti pressione in conferenza stampa. Più probabile, ma coach, spogliatoio e sponsor la prendono male.", bonus: 20 },
  { id: "salary", label: "Rinuncia a parte dell'ingaggio", desc: "Ti tagli lo stipendio del 15% per il resto del contratto per fare spazio al rinforzo.", bonus: 30 },
];

function duoStaff(p) { return p.team ? getTeamStaff(p.team, p.league) : null; }
function hasRequestedDuo(p) { const s = duoStaff(p); return !!(s && s.star && s.star.requested); }

/* Solo la Stella della squadra, da professionista, sotto contratto e non già in coppia */
function canRequestDuo(p) {
  if (!p || p.retired || p.league === "NCAA" || p.currentTeamRole !== "star") return false;
  if (!p.contract || p.contract.yearsRemaining <= 0) return false;
  if (p.duoAskYear === p.year || (p.duoCooldownUntil && p.year < p.duoCooldownUntil)) return false;
  return !hasRequestedDuo(p);
}
function duoApproachAvailable(p, a) { return a.id !== "salary" || !!(p.contract && p.contract.salaryPerYear); }

/* Probabilità che la dirigenza dica sì: reputazione, soldi della lega, spazio salariale, agente */
function duoChance(p, approach) {
  const league = LEAGUES[p.league];
  const pct = teamStrengthPercentile(getTeamStrength(p.team, p.league), p.league);
  let c = 30 + (reputationOf(p) - 50) * 0.5 + approach.bonus;
  c += league.salaryMult >= 0.1 ? 5 : league.salaryMult < 0.03 ? -15 : 0;
  if (pct >= 0.85) c -= 10;          // già piena di talento: poco spazio sotto il tetto
  if (getAgent(p).contenderBias) c += 10; // il Costruttore sa come convincerli
  return clamp(Math.round(c), 5, 90);
}

function openDuoRequest() {
  const d = player.pendingDecision;
  if (!d || d.type !== "offseasonStatus" || !canRequestDuo(player)) return;
  player.pendingDecision = { type: "duoRequest", returnTo: d };
  renderGameScreen();
}
function cancelDuoRequest() {
  const d = player.pendingDecision;
  if (!d || d.type !== "duoRequest") return;
  player.pendingDecision = d.returnTo;
  renderGameScreen();
}

/* La nuova stella: del tuo livello, in un altro ruolo */
function newRequestedStar(p) {
  const nationality = nationalityOfLeague(p.league, p.league === "NBA" ? 30 : 45);
  const roles = ROLES.map(r => r.id).filter(r => r !== p.role);
  const overall = clamp(p.overall + randInt(-4, 1), LEAGUES[p.league].avgOverall + 8, 97);
  return { name: randomFullName(nationality), nationality, role: choice(roles), overall, requested: true, since: p.year + 1 };
}

function resolveDuoRequest(approachId) {
  const d = player.pendingDecision;
  if (!d || d.type !== "duoRequest") return;
  const approach = DUO_APPROACHES.find(a => a.id === approachId);
  if (!approach || !duoApproachAvailable(player, approach)) return;
  player.duoAskYear = player.year;
  const staff = duoStaff(player);
  // i costi dell'approccio si pagano comunque
  if (approach.id === "media") {
    changeCoachTrust(player, -6);
    player.chemistry = clamp(player.chemistry - 5, 0, 100);
    player.polemicCount = (player.polemicCount || 0) + 1;
  }
  const ok = rollChance(duoChance(player, approach));
  if (ok) {
    if (approach.id === "salary") player.contract.salaryPerYear = roundMoney(player.contract.salaryPerYear * 0.85);
    const star = newRequestedStar(player);
    const range = LEAGUES[player.league].strengthRange;
    const before = getTeamStrength(player.team, player.league);
    teamStrengthRegistry[player.team.name] = clamp(Math.round((before + DUO_STRENGTH_BUMP) * 100) / 100, range[0], range[1]);
    star.bump = Math.round((teamStrengthRegistry[player.team.name] - before) * 100) / 100;
    staff.star = star;
    player.starRapport = approach.id === "media" ? 45 : 60;
    player.duos = [...(player.duos || []), { name: star.name, team: player.team.name, year: player.year + 1 }];
    changeReputation(player, 1);
    toast(`🌟 ${player.team.name} firma ${star.name} (${getRoleName(star.role)}, OVR ${star.overall}): nasce una coppia di stelle.`);
  } else {
    player.duoCooldownUntil = player.year + DUO_COOLDOWN_YEARS;
    player.morale = clamp(player.morale - 3, 0, 100);
    if (approach.id === "media") { changeReputation(player, -3); player.chemistry = clamp(player.chemistry - 5, 0, 100); }
    toast(approach.id === "media" ? "❌ La società non si piega alle pressioni pubbliche: niente rinforzo, e lo spogliatoio è teso." : "❌ La dirigenza dice no: quest'anno niente seconda stella.");
  }
  player.pendingDecision = d.returnTo;
  renderGameScreen();
}

/* Quando la seconda stella lascia la squadra, la forza in più se ne va con lui */
function releaseRequestedStar(team, leagueId, star) {
  if (!star || !star.requested || !star.bump || teamStrengthRegistry[team.name] == null) return;
  const range = LEAGUES[leagueId].strengthRange;
  teamStrengthRegistry[team.name] = clamp(Math.round((teamStrengthRegistry[team.name] - star.bump) * 100) / 100, range[0], range[1]);
}
/* Fine stagione: una coppia che non si intende logora lo spogliatoio */
function duoSeasonUpdate(p) {
  if (!hasRequestedDuo(p)) return null;
  if (starRapportOf(p) < 35) {
    p.chemistry = clamp(p.chemistry - 4, 0, 100);
    const note = `⚠️ Con ${duoStaff(p).star.name} non c'è intesa: lo spogliatoio si divide tra i due.`;
    pushNews(note);
    return note;
  }
  if (starRapportOf(p) >= 75) p.chemistry = clamp(p.chemistry + 2, 0, 100);
  return null;
}

function duoButtonHtml() {
  if (!canRequestDuo(player)) return "";
  return `<div class="duo-box"><div class="trb-title">Sei la stella della squadra</div>
    <p class="small-muted">Puoi chiedere alla dirigenza un altro giocatore di primo piano, per formare una coppia di stelle.</p>
    <div class="btn-row"><button class="btn" id="btn-duo">Chiedi una seconda stella</button></div></div>`;
}

function renderDuoRequest(d, titleEl, subEl, cards, extra) {
  const staff = duoStaff(player);
  titleEl.textContent = "Una seconda stella";
  subEl.textContent = `Sei la stella di ${player.team.name}: puoi chiedere alla dirigenza un altro giocatore di primo piano. Oggi il tuo compagno più forte è ${staff.star.name} (OVR ${staff.star.overall}), che lascerebbe il posto al nuovo arrivo.`;
  cards.innerHTML = DUO_APPROACHES.map((a, i) => {
    const avail = duoApproachAvailable(player, a);
    return offCardHtml({ idx: i, title: a.label, subtitle: avail ? `Probabilità di un sì: ${duoChance(player, a)}%` : "Non disponibile senza ingaggio",
      desc: a.desc, tags: [{ text: avail ? `${duoChance(player, a)}%` : "—", tone: "blue" }] });
  }).join("");
  cards.querySelectorAll(".off-card").forEach(c => c.addEventListener("click", () => resolveDuoRequest(DUO_APPROACHES[parseInt(c.dataset.idx)].id)));
  extra.innerHTML = `<div class="btn-row"><button class="btn btn-ghost" id="btn-duo-cancel">Lascia perdere</button></div>
    <p class="small-muted">Se la dirigenza dice no, per ${DUO_COOLDOWN_YEARS} anni non potrai richiederlo.</p>`;
  el("btn-duo-cancel").addEventListener("click", cancelDuoRequest);
}
