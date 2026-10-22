"use strict";

/* ================================================================
   ALLENAMENTO ESTIVO A PUNTI — ogni estate si distribuiscono alcuni punti tra gli attributi.
   Più un attributo è alto, più costa migliorarlo (rendimenti decrescenti); in alternativa
   i punti vanno nel recupero fisico. I punti dipendono da età, morale e allenatore.
   ================================================================ */
const ATTR_LABELS = i18nify({
  shooting: "Tiro", shootingEn: "Shooting",
  finishing: "Finalizzazione", finishingEn: "Finishing",
  playmaking: "Playmaking", playmakingEn: "Playmaking",
  rebounding: "Rimbalzi", reboundingEn: "Rebounding",
  defense: "Difesa", defenseEn: "Defense",
  athleticism: "Atletismo", athleticismEn: "Athleticism",
  iq: "QI Cestistico", iqEn: "Basketball IQ",
});
const TRAINING_RECOVERY = { stamina: 6, fragility: -2, max: 3 };

function trainingPoints(p) {
  let pts = p.age <= 25 ? 4 : p.age <= 29 ? 3 : 2;
  const staff = p.team ? getTeamStaff(p.team, p.league) : null;
  if (staff && (staff.coach.style === "demanding" || (staff.coach.style === "youth" && p.age <= 23))) pts++;
  if (p.morale >= 75) pts++;
  else if (p.morale < 35) pts--;
  if (hasTrait(p, "worker")) pts++;
  return Math.max(1, pts);
}
/* Costo del prossimo punto su un attributo che (con quanto già assegnato) vale value */
function attrPointCost(value) { return value < 70 ? 1 : value < 80 ? 2 : value < 90 ? 3 : 4; }

function trainingSpent(d) {
  return Object.entries(d.alloc).reduce((t, [k, n]) => {
    if (k === "recovery") return t + n;
    let cost = 0;
    for (let i = 0; i < n; i++) cost += attrPointCost(player.attrs[k] + i);
    return t + cost;
  }, 0);
}
function trainingNextCost(d, key) {
  if (key === "recovery") return d.alloc.recovery >= TRAINING_RECOVERY.max ? null : 1;
  const value = player.attrs[key] + d.alloc[key];
  return value >= 99 ? null : attrPointCost(value);
}

function startTraining(next) {
  const alloc = { recovery: 0 };
  Object.keys(player.attrs).forEach(k => { alloc[k] = 0; });
  return { type: "training", points: trainingPoints(player), alloc, next };
}
function changeTraining(key, delta) {
  const d = player.pendingDecision;
  if (!d || d.type !== "training" || !(key in d.alloc)) return;
  if (delta > 0) {
    const cost = trainingNextCost(d, key);
    if (cost == null || trainingSpent(d) + cost > d.points) return;
    d.alloc[key]++;
  } else if (d.alloc[key] > 0) d.alloc[key]--;
  renderGameScreen();
}
/* Distribuzione automatica: i punti vanno agli attributi dell'archetipo, prima quelli più economici */
function autoTraining() {
  const d = player.pendingDecision;
  if (!d || d.type !== "training") return;
  Object.keys(d.alloc).forEach(k => { d.alloc[k] = 0; });
  const arch = getArchetype(player.role, player.archetypeId);
  const keys = arch ? Object.keys(arch.bumps) : Object.keys(player.attrs);
  let guard = 0;
  while (guard++ < 50) {
    const left = d.points - trainingSpent(d);
    const options = keys.map(k => ({ k, cost: trainingNextCost(d, k) })).filter(o => o.cost != null && o.cost <= left)
      .sort((a, b) => a.cost - b.cost || (player.attrs[a.k] + d.alloc[a.k]) - (player.attrs[b.k] + d.alloc[b.k]));
    if (options.length) { d.alloc[options[0].k]++; continue; }
    if (left > 0 && trainingNextCost(d, "recovery") != null) { d.alloc.recovery++; continue; }
    break;
  }
  renderGameScreen();
}
function confirmTraining() {
  const d = player.pendingDecision;
  if (!d || d.type !== "training") return;
  const parts = [];
  Object.entries(d.alloc).forEach(([k, n]) => {
    if (!n) return;
    if (k === "recovery") {
      player.stamina = clamp(player.stamina + TRAINING_RECOVERY.stamina * n, 0, 100);
      player.fragility = clamp(player.fragility + TRAINING_RECOVERY.fragility * n, 0, 100);
      parts.push(tr(`recupero ×${n}`, `recovery ×${n}`));
    } else {
      player.attrs[k] = clamp(player.attrs[k] + n, 30, 99);
      parts.push(`${ATTR_LABELS[k]} +${n}`);
    }
  });
  if (parts.length) toast(tr(`🏋️ Allenamento estivo: ${parts.join(" · ")}.`, `🏋️ Summer training: ${parts.join(" · ")}.`));
  player.pendingDecision = d.next;
  renderGameScreen();
}

function renderTrainingPanel(body, d) {
  const left = d.points - trainingSpent(d);
  const row = (key, label, value, extra) => {
    const cost = trainingNextCost(d, key);
    const canAdd = cost != null && cost <= left;
    return `
      <div class="tr-row">
        <div class="tr-label">${label}</div>
        <div class="tr-value">${value}${d.alloc[key] ? ` <span class="tr-plus">+${key === "recovery" ? "" : d.alloc[key]}</span>` : ""}</div>
        <div class="tr-cost small-muted">${cost == null ? tr("al massimo", "maxed out") : `${cost} ${cost === 1 ? tr("punto", "pt") : tr("punti", "pts")}`}${extra ? ` · ${extra}` : ""}</div>
        <div class="tr-btns">
          <button class="btn btn-ghost btn-sm" data-train="${key}" data-delta="-1" ${d.alloc[key] ? "" : "disabled"} aria-label="${tr(`Togli un punto a ${label}`, `Remove point from ${label}`)}">−</button>
          <button class="btn btn-secondary btn-sm" data-train="${key}" data-delta="1" ${canAdd ? "" : "disabled"} aria-label="${tr(`Aggiungi un punto a ${label}`, `Add point to ${label}`)}">+</button>
        </div>
      </div>`;
  };
  body.innerHTML = `
    <p class="tr-points">${tr("Punti da assegnare", "Points to assign")}: <strong>${left}</strong> ${tr("su", "of")} ${d.points}</p>
    <p class="small-muted" style="margin-bottom:10px">${tr("Più un attributo è alto, più costa migliorarlo: 1 punto sotto 70, 2 fino a 79, 3 fino a 89, 4 oltre. I punti dipendono da età, morale e allenatore; quelli non usati vanno persi.", "The higher an attribute, the more it costs to upgrade: 1 pt under 70, 2 up to 79, 3 up to 89, 4 above. Points depend on age, morale, and coach; unused points are lost.")}</p>
    <div class="tr-list">
      ${Object.keys(player.attrs).map(k => row(k, ATTR_LABELS[k], player.attrs[k] + d.alloc[k])).join("")}
      ${row("recovery", tr("Recupero fisico", "Physical recovery"), d.alloc.recovery ? `×${d.alloc.recovery}` : "—", `stamina +${TRAINING_RECOVERY.stamina}, ${tr("fragilità", "fragility")} ${TRAINING_RECOVERY.fragility}`)}
    </div>
    <div class="btn-row" style="justify-content:center;margin-top:14px">
      <button class="btn btn-ghost" id="btn-train-auto">${tr("Distribuzione automatica", "Auto-distribute")}</button>
      <button class="btn btn-primary btn-lg" id="btn-train-confirm">✅ ${left > 0 ? tr(`Conferma (${left} ${left === 1 ? "punto" : "punti"} non usati)`, `Confirm (${left} unused ${left === 1 ? "pt" : "pts"})`) : tr("Conferma", "Confirm")}</button>
    </div>`;
  body.querySelectorAll("[data-train]").forEach(b => b.addEventListener("click", () => changeTraining(b.dataset.train, parseInt(b.dataset.delta))));
  el("btn-train-auto").addEventListener("click", autoTraining);
  el("btn-train-confirm").addEventListener("click", confirmTraining);
}
