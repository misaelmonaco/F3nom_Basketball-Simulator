"use strict";

/* ================================================================
   PARTITE CHIAVE IN STAGIONE REGOLARE — ogni tanto un tratto contiene una sfida speciale
   (contro la tua ex squadra, un derby o la capolista) che si decide all'ultimo possesso,
   con la stessa scelta dei playoff. Vale una vittoria in più o in meno, e un po' di gloria.
   ================================================================ */
const KEY_GAME_CHANCE = 30;
const KEY_GAME_KINDS = {
  exTeam: { icon: "🔙", label: "Contro la tua ex squadra", note: "Il pubblico di casa tua ti fischia dal primo minuto.", popularity: 4, morale: 4, win: 0 },
  derby: { icon: "🏙️", label: "Il derby", note: "La città è divisa a metà, i biglietti sono finiti da settimane.", popularity: 5, morale: 3, win: 0 },
  top: { icon: "⛰️", label: "Contro la capolista", note: "La squadra più forte del campionato, in diretta nazionale.", popularity: 4, morale: 3, win: -0.06 },
};

/* L'eventuale partita chiave del prossimo tratto */
function pickKeyGame(p, s) {
  if (!rollChance(KEY_GAME_CHANCE)) return null;
  const teams = LEAGUES[s.seasonLeague].teams.filter(t => t.name !== s.team.name);
  if (!teams.length) return null;
  const exTeams = teams.filter(t => p.history.some(h => h.team.name === t.name));
  const derby = teams.filter(t => t.city === s.team.city);
  let kind, opponent;
  if (exTeams.length && rollChance(50)) { kind = "exTeam"; opponent = choice(exTeams); }
  else if (derby.length && rollChance(60)) { kind = "derby"; opponent = choice(derby); }
  else {
    kind = "top";
    opponent = [...teams].sort((a, b) => getTeamStrength(b, s.seasonLeague) - getTeamStrength(a, s.seasonLeague))[0];
  }
  return { kind, opponent };
}

function keyGameWinProb(p, s, kg) {
  return clamp(regularSeasonWinPct(p.overall, s.teamStrength, s.seasonLeague) + KEY_GAME_KINDS[kg.kind].win + getDifficulty(p).win, 0.15, 0.85);
}

function chooseKeyGame(optionId) {
  const d = player.pendingDecision;
  if (!d || d.type !== "seasonBlock" || !d.keyGame) return;
  d.keyGameChoice = optionId;
  renderGameScreen();
}

/* Durante il tratto: l'ultimo possesso decide la partita chiave (se il giocatore è in campo) */
function playKeyGame(p, s, kg, optionId) {
  const winProb = keyGameWinProb(p, s, kg);
  const option = CLUTCH_OPTIONS.find(o => o.id === optionId) || bestClutchOption(p, winProb);
  const success = rollChance(clutchChance(p, winProb, option) * 100);
  const k = KEY_GAME_KINDS[kg.kind];
  if (success) {
    p.popularity = clamp(p.popularity + k.popularity, 0, 100);
    p.morale = clamp(p.morale + k.morale, 0, 100);
  } else {
    p.morale = clamp(p.morale - 2, 0, 100);
  }
  if (typeof playSound === "function") playSound(success ? "win" : "loss");
  return { kind: kg.kind, label: k.label, opponent: kg.opponent.name, option: option.label, success };
}

function keyGamePanelHtml(d) {
  const kg = d.keyGame;
  const k = KEY_GAME_KINDS[kg.kind];
  const winProb = keyGameWinProb(player, player.pendingSeason, kg);
  return `
    <div class="clutch-box">
      <div class="clutch-head">${k.icon} Partita chiave · ${k.label} ${helpTip("keyGame")}</div>
      <p class="risk-narrative" style="margin:4px 0 12px">Contro ${teamLabel(kg.opponent)}. ${k.note} Ultimi secondi, siete sotto di un punto e la palla è tua. Cosa fai?</p>
      <div class="sb-options">
        ${CLUTCH_OPTIONS.map(o => `
          <button type="button" class="option-card sb-choice ${d.keyGameChoice === o.id ? "selected-team" : ""}" data-keygame="${o.id}">
            <div class="oc-title">${o.icon} ${o.label} <span class="badge">${Math.round(clutchChance(player, winProb, o) * 100)}%</span></div>
            <div class="oc-desc">${o.desc}</div>
          </button>`).join("")}
      </div>
    </div>`;
}
