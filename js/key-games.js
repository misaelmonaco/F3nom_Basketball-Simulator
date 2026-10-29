"use strict";

/* ================================================================
   PARTITE CHIAVE IN STAGIONE REGOLARE — ogni tanto un tratto contiene una sfida speciale
   (contro la tua ex squadra, un derby o la capolista) che si decide all'ultimo possesso,
   con la stessa scelta dei playoff. Vale una vittoria in più o in meno, e un po' di gloria.
   ================================================================ */
const KEY_GAME_CHANCE = 30;
const KEY_GAME_KINDS = i18nify({
  exTeam: { icon: "🔙", label: "Contro la tua ex squadra", labelEn: "Against Your Former Team", note: "Il pubblico di casa tua ti fischia dal primo minuto.", noteEn: "Your former home crowd boos you from the opening tip.", popularity: 4, morale: 4, win: 0 },
  derby: { icon: "🏙️", label: "Il derby", labelEn: "City Derby", note: "La città è divisa a metà, i biglietti sono finiti da settimane.", noteEn: "The city is split in half, tickets have been sold out for weeks.", popularity: 5, morale: 3, win: 0 },
  top: { icon: "⛰️", label: "Contro la capolista", labelEn: "Against the League Leader", note: "La squadra più forte del campionato, in diretta nazionale.", noteEn: "The best team in the league, live on national TV.", popularity: 4, morale: 3, win: -0.06 },
});

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

function chooseKeyGame(optionId, shotMeterResult) {
  const d = player.pendingDecision;
  if (!d || d.type !== "seasonBlock" || !d.keyGame) return;
  if (d.keyGameChoice && d.keyGameResult) return;
  d.keyGameChoice = optionId;
  if (!d.keyGameResult) {
    d.keyGameResult = playKeyGame(player, player.pendingSeason, d.keyGame, optionId, shotMeterResult);
  }
  renderGameScreen();
}

/* Durante il tratto o subito all'azione: l'ultimo possesso decide la partita chiave */
function playKeyGame(p, s, kg, optionId, shotMeterResult) {
  const winProb = keyGameWinProb(p, s, kg);
  const option = CLUTCH_OPTIONS.find(o => o.id === optionId) || bestClutchOption(p, winProb);
  const baseChance = Math.round(clutchChance(p, winProb, option) * 100);
  let success;
  if (shotMeterResult && shotMeterResult.success != null) {
    success = shotMeterResult.success;
  } else {
    success = rollChance(baseChance);
  }
  const k = KEY_GAME_KINDS[kg.kind];
  if (success) {
    p.popularity = clamp(p.popularity + k.popularity, 0, 100);
    p.morale = clamp(p.morale + k.morale, 0, 100);
    if (shotMeterResult && shotMeterResult.timing === "perfect") {
      p.morale = clamp(p.morale + 1, 0, 100);
    }
  } else {
    p.morale = clamp(p.morale - 2, 0, 100);
  }
  if (typeof playSound === "function") playSound(success ? "win" : "loss");
  const isThree = option.id === "three";
  const myScore = success ? (isThree ? 90 : 89) : 87;
  return {
    kind: kg.kind,
    label: k.label,
    opponent: kg.opponent.name,
    option: option.label,
    optionId: option.id,
    success,
    myScore,
    oppScore: 88,
    shotMeter: shotMeterResult || null,
  };
}

/* Nel pannello del tratto: invito compatto o risultato definitivo (senza poter cambiare scelta) */
function keyGamePanelHtml(d) {
  const kg = d.keyGame;
  const k = KEY_GAME_KINDS[kg.kind];
  if (d.keyGameResult) {
    const res = d.keyGameResult;
    const isWon = res.success;
    const greenBadge = res.shotMeter && res.shotMeter.timing === "perfect" ? ` <span class="badge" style="background:#059669;color:#fff;font-size:0.75rem">🟢 ${tr("Perfetto", "Perfect")}</span>` : "";
    return `
      <div class="modal-cta ${isWon ? "done" : "down"}">
        <div class="modal-cta__text">
          <div class="modal-cta__t">${k.icon} ${tr("Partita chiave", "Key Game")} · ${k.label}${greenBadge}</div>
          <div class="modal-cta__s">
            ${isWon
              ? tr(`🎉 <strong>Vittoria ${res.myScore}-${res.oppScore}</strong> sulla sirena contro ${teamLabel(kg.opponent)}! Giocata decisiva: <em>${res.option}</em>.`, `🎉 <strong>Won ${res.myScore}-${res.oppScore}</strong> at the buzzer against ${teamLabel(kg.opponent)}! Winning play: <em>${res.option}</em>.`)
              : tr(`💔 <strong>Sconfitta ${res.myScore}-${res.oppScore}</strong> contro ${teamLabel(kg.opponent)}. Tentativo fallito: <em>${res.option}</em>.`, `💔 <strong>Lost ${res.myScore}-${res.oppScore}</strong> against ${teamLabel(kg.opponent)}. Missed attempt: <em>${res.option}</em>.`)}
          </div>
        </div>
        <span class="modal-cta-badge ${isWon ? "up" : "down"}">${isWon ? tr("✓ Vinta", "✓ Won") : tr("✗ Persa", "✗ Lost")}</span>
      </div>`;
  }
  return modalCtaHtml({
    tone: "signal", title: `${k.icon} ${tr("Partita chiave", "Key Game")} · ${k.label} ${helpTip("keyGame")}`,
    sub: `${tr("Contro", "Vs")} ${teamLabel(kg.opponent)}. ${k.note}`,
    btnId: "btn-open-keygame", btnLabel: tr("🏀 Gioca l'ultimo possesso", "🏀 Play the final possession"), primary: true,
  });
}

/* La modale clutch della partita chiave: gioca il possesso con il minigioco Shot Meter e mostra l'esito finale */
function openKeyGameModal(d) {
  const kg = d.keyGame;
  if (!kg || d.keyGameResult) return;
  const k = KEY_GAME_KINDS[kg.kind];
  const winProb = keyGameWinProb(player, player.pendingSeason, kg);
  renderClutchModal({
    tag: tr("Partita chiave", "Key Game"),
    roundLabel: `${k.icon} ${k.label}`,
    oppName: kg.opponent.name,
    oppScore: 88,
    myName: player.pendingSeason.team.name,
    myScore: 87,
    timer: "00:05.2",
    narrative: tr(`${k.note} Ultimi secondi contro ${kg.opponent.name}: siete <strong>sotto di 1 punto</strong> e la palla è tua. Scegli la giocata e rilascia il tiro con il giusto tempismo!`, `${k.note} Final seconds against ${kg.opponent.name}: you are <strong>down by 1 point</strong> and the ball is in your hands. Pick your play and time it right!`),
    options: CLUTCH_OPTIONS.map(o => ({
      id: o.id, icon: o.icon, label: o.label, desc: o.desc,
      attrText: o.attrLabel ? o.attrLabel(player) : "",
      pct: Math.round(clutchChance(player, winProb, o) * 100),
    })),
    closable: true,
    onSelectOutcome: (optionId, showOutcome) => {
      const option = CLUTCH_OPTIONS.find(o => o.id === optionId);
      const optLabel = option ? option.label : tr("Azione clutch", "Clutch play");
      const baseChance = Math.round(clutchChance(player, winProb, option) * 100);
      const mainBody = document.querySelector("#cm-main-body");

      const handleOutcome = (meterRes) => {
        chooseKeyGame(optionId, meterRes);
        const res = d.keyGameResult;
        showOutcome({
          success: res.success,
          label: `${res.option} ${meterRes && meterRes.timing === "perfect" ? tr("🟢 (Perfetto!)", "🟢 (Perfect!)") : ""}`,
          game: kg.opponent.name,
          newScore: res.myScore,
          onDone: () => renderGameScreen(),
        });
      };

      const handleSkip = () => {
        chooseKeyGame(optionId, null);
        const res = d.keyGameResult;
        showOutcome({
          success: res.success,
          label: res.option,
          game: kg.opponent.name,
          newScore: res.myScore,
          onDone: () => renderGameScreen(),
        });
      };

      if (mainBody) {
        if (optionId === "drive" && typeof renderTimingCircleWidget === "function") {
          const attrVal = Math.round((player.attrs.finishing + player.attrs.athleticism) / 2);
          renderTimingCircleWidget(mainBody, {
            optionLabel: optLabel,
            attributeValue: attrVal,
            baseWinProb: baseChance,
            onRelease: handleOutcome,
            onSkip: handleSkip,
          });
          return;
        }
        if (optionId === "pass" && typeof renderCourtVisionWidget === "function") {
          renderCourtVisionWidget(mainBody, {
            optionLabel: optLabel,
            attributeValue: player.attrs.playmaking,
            iqValue: Math.round((player.attrs.playmaking + player.attrs.defense) / 2),
            baseWinProb: baseChance,
            onRelease: handleOutcome,
            onSkip: handleSkip,
          });
          return;
        }
        if (typeof renderShotMeterWidget === "function") {
          renderShotMeterWidget(mainBody, {
            optionLabel: optLabel,
            attributeValue: player.attrs.shooting,
            baseWinProb: baseChance,
            onRelease: handleOutcome,
            onSkip: handleSkip,
          });
          return;
        }
      }

      handleSkip();
    },
    onSelect: id => chooseKeyGame(id),
  });
}
