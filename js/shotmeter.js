"use strict";

/* ================================================================
   MINIGIOCHI INTERATTIVI CLUTCH:
   1. SHOT METER — Tiro in sospensione e triple (timing orizzontale)
   2. TIMING CIRCLE — Schiacciate e penetrazioni (cerchio convergente)
   3. COURT VISION — Scarichi e passaggi (scelta rapida su mini-lavagna)
   ================================================================ */

/* ----------------------------------------------------------------
   1. SHOT METER (Tiro da fuori / Isolamento)
   ---------------------------------------------------------------- */
function renderShotMeterWidget(container, opts) {
  if (!container) return null;

  const attrVal = opts.attributeValue || 70;
  const baseWinProb = opts.baseWinProb || 45;

  // Larghezza zona verde: calibrata su scaglioni (80-95 -> 16-19%, 95-99 -> 20-23%)
  let greenPct;
  if (attrVal >= 95) {
    greenPct = Math.round(20 + ((attrVal - 95) / 4) * 3);
  } else if (attrVal >= 80) {
    greenPct = Math.round(16 + ((attrVal - 80) / 15) * 3);
  } else if (attrVal >= 60) {
    greenPct = Math.round(11 + ((attrVal - 60) / 20) * 5);
  } else {
    greenPct = clamp(Math.round(8 + ((attrVal - 40) / 20) * 3), 7, 11);
  }
  const yellowPct = clamp(Math.round(11 + ((attrVal - 40) / 59) * 5), 10, 16);
  
  const greenStart = 50 - greenPct / 2;
  const greenEnd = 50 + greenPct / 2;
  const yellowStart = Math.max(4, greenStart - yellowPct);
  const yellowEnd = Math.min(96, greenEnd + yellowPct);

  container.innerHTML = `
    <div class="sm-widget" id="shot-meter-widget" tabindex="0" role="region" aria-label="Shot Meter">
      <div class="sm-header">
        <span class="sm-badge">🏀 ${tr("Minigioco Clutch", "Clutch Minigame")}</span>
        <span class="sm-action-name">${opts.optionLabel || tr("Tiro decisivo", "Clutch Shot")}</span>
      </div>

      <div class="sm-instruction">
        ${tr("Premi <strong>SPAZIO</strong> o tocca il pulsante quando il cursore è nella <strong>ZONA VERDE</strong>!", "Press <strong>SPACE</strong> or tap the button when the needle is in the <strong>GREEN ZONE</strong>!")}
      </div>

      <div class="sm-meter-track" id="sm-track">
        <div class="sm-zone sm-zone--red-left" style="left:0; width:${yellowStart}%;"></div>
        <div class="sm-zone sm-zone--yellow-left" style="left:${yellowStart}%; width:${greenStart - yellowStart}%;"></div>
        <div class="sm-zone sm-zone--green" style="left:${greenStart}%; width:${greenPct}%;">
          <span class="sm-green-target">PERFECT</span>
        </div>
        <div class="sm-zone sm-zone--yellow-right" style="left:${greenEnd}%; width:${yellowEnd - greenEnd}%;"></div>
        <div class="sm-zone sm-zone--red-right" style="left:${yellowEnd}%; width:${100 - yellowEnd}%;"></div>

        <div class="sm-needle" id="sm-needle" style="left: 0%;">
          <div class="sm-needle-head">🏀</div>
          <div class="sm-needle-line"></div>
        </div>
      </div>

      <div class="sm-feedback" id="sm-feedback">${tr("In attesa del rilascio...", "Waiting for release...")}</div>

      <div class="sm-controls">
        <button type="button" class="btn btn-primary btn-lg sm-release-btn" id="btn-sm-release">
          🎯 ${tr("RILASCIA IL TIRO!", "RELEASE SHOT!")}
        </button>
        <button type="button" class="btn btn-ghost btn-sm sm-skip-btn" id="btn-sm-skip">
          ⚡ ${tr("Salta minigioco e simula", "Skip minigame & simulate")}
        </button>
      </div>
    </div>
  `;

  const needle = container.querySelector("#sm-needle");
  const feedback = container.querySelector("#sm-feedback");
  const releaseBtn = container.querySelector("#btn-sm-release");
  const skipBtn = container.querySelector("#btn-sm-skip");

  // Posizione e direzione iniziale casuali per evitare schemi meccanici
  let pos = Math.random() < 0.5 ? 2 : 98;
  let dir = pos < 50 ? 1 : -1;
  let running = true;
  let animId = null;
  // Velocità dinamica dello slider: tiratori d'élite e campioni con sangue freddo hanno mano ferma
  let speed = 2.35 - ((clamp(attrVal, 50, 99) - 50) / 49) * 0.6; // da 2.35 a 1.75
  if (typeof player !== "undefined" && player) {
    if (typeof hasTrait === "function" && hasTrait(player, "coldBlooded")) speed -= 0.2;
    if (player.morale < 40) speed += 0.15;
  }
  speed = clamp(speed, 1.5, 2.5);

  function updateLoop() {
    if (!running) return;
    pos += dir * speed;
    if (pos >= 100) {
      pos = 100;
      dir = -1;
    } else if (pos <= 0) {
      pos = 0;
      dir = 1;
    }
    if (needle) needle.style.left = `${pos.toFixed(1)}%`;
    animId = requestAnimationFrame(updateLoop);
  }

  animId = requestAnimationFrame(updateLoop);

  function stopAndEvaluate() {
    if (!running) return;
    running = false;
    if (animId) cancelAnimationFrame(animId);
    releaseBtn.disabled = true;
    skipBtn.disabled = true;

    const stoppedAt = pos;
    let timing = "poor";
    let isSuccess = false;
    let feedbackText = "";
    let toneClass = "";

    if (stoppedAt >= greenStart && stoppedAt <= greenEnd) {
      timing = "perfect";
      // GREEN RELEASE stile NBA 2K: 91% - 96% a bersaglio
      const perfectChance = clamp(Math.round(92 + ((attrVal - 60) * 0.1)), 90, 96);
      isSuccess = rollChance(perfectChance);
      feedbackText = isSuccess
        ? tr("🟢 GREEN RELEASE! Tiro perfetto a bersaglio!", "🟢 GREEN RELEASE! Splashes cleanly through!")
        : tr("🟢 RILASCIO PERFETTO, ma la palla beffarda scheggia il ferro ed esce!", "🟢 GREEN RELEASE, but it agonisingly rims out!");
      toneClass = isSuccess ? "sm-result--green" : "sm-result--yellow";
    } else if (stoppedAt >= yellowStart && stoppedAt <= yellowEnd) {
      timing = "good";
      // Buon rilascio: solido 50% - 72% per un buon tiro
      const goodChance = clamp(Math.round(baseWinProb + 18 + ((attrVal - 60) * 0.15)), 48, 72);
      isSuccess = rollChance(goodChance);
      feedbackText = isSuccess
        ? tr("🟡 BUON RILASCIO! Tiro dentro!", "🟡 GOOD RELEASE! Shot goes in!")
        : tr("🟡 BUON RILASCIO, ma tocca il ferro ed esce!", "🟡 GOOD RELEASE, but it rims out!");
      toneClass = isSuccess ? "sm-result--yellow" : "sm-result--red";
    } else {
      timing = stoppedAt < yellowStart ? "early" : "late";
      const poorChance = clamp(Math.round(baseWinProb * 0.35), 8, 20);
      isSuccess = rollChance(poorChance);
      feedbackText = isSuccess
        ? tr("🔴 TIRO FORZATO... ma entra con fortuna!", "🔴 FORCED SHOT... but it banks in!")
        : tr("🔴 FUORI TEMPO! Tiro fuori misura!", "🔴 BAD TIMING! Way off the mark!");
      toneClass = "sm-result--red";
    }

    if (feedback) {
      feedback.textContent = feedbackText;
      feedback.className = `sm-feedback ${toneClass}`;
    }
    if (needle) needle.classList.add("sm-needle--locked");

    setTimeout(() => {
      cleanup();
      if (opts.onRelease) {
        opts.onRelease({ timing, stoppedAt, success: isSuccess, feedbackText });
      }
    }, 650);
  }

  function handleSkip() {
    if (!running) return;
    cleanup();
    if (opts.onSkip) opts.onSkip();
  }

  function onKeyDown(e) {
    if (e.code === "Space" || e.code === "Enter") {
      e.preventDefault();
      stopAndEvaluate();
    }
  }

  releaseBtn.addEventListener("click", stopAndEvaluate);
  skipBtn.addEventListener("click", handleSkip);
  window.addEventListener("keydown", onKeyDown);

  function cleanup() {
    running = false;
    if (animId) cancelAnimationFrame(animId);
    window.removeEventListener("keydown", onKeyDown);
  }

  return { stop: stopAndEvaluate, cancel: cleanup };
}

/* ----------------------------------------------------------------
   2. TIMING CIRCLE (Schiacciate / Attacco al ferro)
   ---------------------------------------------------------------- */
function renderTimingCircleWidget(container, opts) {
  if (!container) return null;

  const attrVal = opts.attributeValue || 70;
  const baseWinProb = opts.baseWinProb || 45;
  // Tolleranza per il "Perfect": proporzionata agli scaglioni di penetrazione/atletismo
  let perfectTolerance;
  if (attrVal >= 95) {
    perfectTolerance = Math.round(18 + ((attrVal - 95) / 4) * 3);
  } else if (attrVal >= 80) {
    perfectTolerance = Math.round(14 + ((attrVal - 80) / 15) * 3);
  } else if (attrVal >= 60) {
    perfectTolerance = Math.round(10 + ((attrVal - 60) / 20) * 4);
  } else {
    perfectTolerance = clamp(Math.round(7 + ((attrVal - 40) / 20) * 3), 6, 10);
  }
  const targetDiameter = 80;

  container.innerHTML = `
    <div class="sm-widget tc-widget" id="timing-circle-widget" tabindex="0" role="region" aria-label="Timing Circle">
      <div class="sm-header">
        <span class="sm-badge">💥 ${tr("Minigioco Schiacciata", "Rim Attack Minigame")}</span>
        <span class="sm-action-name">${opts.optionLabel || tr("Attacco il ferro", "Attack the Rim")}</span>
      </div>

      <div class="sm-instruction">
        ${tr("Premi <strong>SPAZIO</strong> o tocca il pulsante quando il cerchio arancione combacia col cerchio <strong>VERDE</strong>!", "Press <strong>SPACE</strong> or tap the button when the orange ring aligns with the <strong>GREEN</strong> ring!")}
      </div>

      <div class="tc-arena" id="tc-arena">
        <div class="tc-target-zone" id="tc-target" style="width: ${targetDiameter}px; height: ${targetDiameter}px;">
          <div class="tc-rim-icon">🏀</div>
        </div>
        <div class="tc-collapsing-ring" id="tc-ring" style="width: 220px; height: 220px;"></div>
      </div>

      <div class="sm-feedback" id="tc-feedback">${tr("Attendi il momento perfetto...", "Wait for the sweet spot...")}</div>

      <div class="sm-controls">
        <button type="button" class="btn btn-primary btn-lg sm-release-btn" id="btn-tc-slam">
          💥 ${tr("SCHIACCIATA / APPOGGIO AL FERRO!", "SLAM DUNK / FINISH AT THE RIM!")}
        </button>
        <button type="button" class="btn btn-ghost btn-sm sm-skip-btn" id="btn-tc-skip">
          ⚡ ${tr("Salta minigioco e simula", "Skip minigame & simulate")}
        </button>
      </div>
    </div>
  `;

  const ring = container.querySelector("#tc-ring");
  const target = container.querySelector("#tc-target");
  const feedback = container.querySelector("#tc-feedback");
  const slamBtn = container.querySelector("#btn-tc-slam");
  const skipBtn = container.querySelector("#btn-tc-skip");
  const arena = container.querySelector("#tc-arena");

  let size = 220;
  let running = true;
  let animId = null;
  let collapses = 0;
  const maxCollapses = 2; // massimo 2 passaggi prima che scada l'azione
  // Velocità dinamica del cerchio convergente: finalizzatori esperti hanno più controllo
  let shrinkSpeed = 3.2 - ((clamp(attrVal, 50, 99) - 50) / 49) * 0.8; // da 3.2 a 2.4
  if (typeof player !== "undefined" && player) {
    if (typeof hasTrait === "function" && hasTrait(player, "coldBlooded")) shrinkSpeed -= 0.25;
    if (player.morale < 40) shrinkSpeed += 0.2;
  }
  shrinkSpeed = clamp(shrinkSpeed, 2.1, 3.4);

  function updateLoop() {
    if (!running) return;
    size -= shrinkSpeed;
    if (size <= 24) {
      collapses++;
      if (collapses >= maxCollapses) {
        // Tempo scaduto sull'ultimo possesso!
        stopAndEvaluate(true);
        return;
      }
      size = 220;
    }
    if (ring) {
      ring.style.width = `${size.toFixed(1)}px`;
      ring.style.height = `${size.toFixed(1)}px`;
    }
    animId = requestAnimationFrame(updateLoop);
  }

  animId = requestAnimationFrame(updateLoop);

  function stopAndEvaluate(expired = false) {
    if (!running) return;
    running = false;
    if (animId) cancelAnimationFrame(animId);
    slamBtn.disabled = true;
    skipBtn.disabled = true;

    const diff = Math.abs(size - targetDiameter);
    let timing = "poor";
    let isSuccess = false;
    let feedbackText = "";
    let toneClass = "";

    if (expired) {
      timing = "late";
      isSuccess = false;
      feedbackText = tr("🔴 SIRENA DEI 24 SECONDI! Tempo esaurito per andare al ferro!", "🔴 SHOT CLOCK BUZZER! Out of time to attack the rim!");
      toneClass = "sm-result--red";
    } else if (diff <= perfectTolerance) {
      timing = "perfect";
      // GREEN RELEASE stile NBA 2K: 91% - 96% a bersaglio
      const perfectChance = clamp(Math.round(92 + ((attrVal - 60) * 0.1)), 90, 96);
      isSuccess = rollChance(perfectChance);
      feedbackText = isSuccess
        ? tr("💥 BOOM! SCHIACCIATA DA HIGHLIGHTS!", "💥 BOOM! HIGHLIGHT-REEL SLAM!")
        : tr("💥 SCHIACCIATA VIOLENTA SUL FERRO! La palla rimbalza altissima ed esce!", "💥 FEROCIOUS SLAM OFF THE RIM! Ball bounces high and out!");
      toneClass = isSuccess ? "sm-result--green" : "sm-result--yellow";
      if (target && isSuccess) target.classList.add("tc-target--boom");
    } else if (diff <= perfectTolerance + 20) {
      timing = "good";
      // Buon appoggio: 50% - 72%
      const goodChance = clamp(Math.round(baseWinProb + 18 + ((attrVal - 60) * 0.15)), 48, 72);
      isSuccess = rollChance(goodChance);
      feedbackText = isSuccess
        ? tr("🟡 BUON APPOGGIO! Canestro e fallo!", "🟡 NICE FINISH! And-one bucket!")
        : tr("🟡 APPOGGIO SFIORATO, palla sputata dal ferro!", "🟡 CLOSE LAYUP, but the rim spits it out!");
      toneClass = isSuccess ? "sm-result--yellow" : "sm-result--red";
    } else {
      timing = size > targetDiameter ? "early" : "late";
      const poorChance = clamp(Math.round(baseWinProb * 0.35), 8, 20);
      isSuccess = rollChance(poorChance);
      feedbackText = isSuccess
        ? tr("🔴 TIRO DISPERATO... ma entra con fortuna!", "🔴 CIRCUS SHOT... and it somehow drops!")
        : tr("🔴 STOPPATA SUL FERRO! La difesa chiude la strada!", "🔴 BLOCKED AT THE RIM! Defense shuts the door!");
      toneClass = "sm-result--red";
    }

    if (feedback) {
      feedback.textContent = feedbackText;
      feedback.className = `sm-feedback ${toneClass}`;
    }
    if (ring) ring.classList.add("tc-ring--locked");

    setTimeout(() => {
      cleanup();
      if (opts.onRelease) {
        opts.onRelease({ timing, diff, success: isSuccess, feedbackText });
      }
    }, 700);
  }

  function handleSkip() {
    if (!running) return;
    cleanup();
    if (opts.onSkip) opts.onSkip();
  }

  function onKeyDown(e) {
    if (e.code === "Space" || e.code === "Enter") {
      e.preventDefault();
      stopAndEvaluate(false);
    }
  }

  slamBtn.addEventListener("click", () => stopAndEvaluate(false));
  if (arena) arena.addEventListener("click", () => stopAndEvaluate(false));
  skipBtn.addEventListener("click", handleSkip);
  window.addEventListener("keydown", onKeyDown);

  function cleanup() {
    running = false;
    if (animId) cancelAnimationFrame(animId);
    window.removeEventListener("keydown", onKeyDown);
  }

  return { stop: () => stopAndEvaluate(false), cancel: cleanup };
}

/* ----------------------------------------------------------------
   3. COURT VISION (Scelta rapida di passaggio / Regia)
   ---------------------------------------------------------------- */
function renderCourtVisionWidget(container, opts) {
  if (!container) return null;

  const playmaking = opts.attributeValue || 70;
  const iq = opts.iqValue || 70;
  const baseWinProb = opts.baseWinProb || 45;

  // Tempo disponibile totale: tra 2.2s e 3.0s in base a playmaking e QI
  const totalSeconds = clamp(2.2 + ((playmaking + iq - 100) / 98) * 0.8, 2.0, 3.2);

  // 3 possibili compagni sul parquet
  const targets = [
    { id: 0, name: tr("Angolo SX", "Left Corner"), role: tr("Tiratore", "Shooter"), pos: { top: 72, left: 16 } },
    { id: 1, name: tr("Taglio al ferro", "Rim Cut"), role: tr("Centro", "Center"), pos: { top: 32, left: 50 } },
    { id: 2, name: tr("Ala DX", "Right Wing"), role: tr("Guardia", "Guard"), pos: { top: 48, left: 82 } },
  ];

  let openIdx = Math.floor(Math.random() * 3);

  container.innerHTML = `
    <div class="sm-widget cv-widget" id="court-vision-widget" tabindex="0" role="region" aria-label="Court Vision">
      <div class="sm-header">
        <span class="sm-badge">👁️ ${tr("Visione di Gioco", "Court Vision")}</span>
        <span class="sm-action-name">${opts.optionLabel || tr("Scarico al compagno", "Kick Out to Teammate")}</span>
      </div>

      <div class="sm-instruction">
        ${tr("La difesa ruota! Guarda il campo e tocca il <strong>COMPAGNO LIBERO</strong> prima dello scadere del tempo!", "Defense is rotating! Read the floor and tap the <strong>OPEN TEAMMATE</strong> before time expires!")}
      </div>

      <div class="cv-timer-bar">
        <div class="cv-timer-progress" id="cv-progress" style="width: 100%;"></div>
      </div>

      <div class="cv-court" id="cv-court">
        <!-- Linee del campo stilizzate -->
        <div class="cv-court-lines">
          <div class="cv-hoop"></div>
          <div class="cv-key"></div>
          <div class="cv-3pt"></div>
        </div>

        <!-- Portatore palla (Tu) -->
        <div class="cv-player cv-player--me" style="top: 76%; left: 50%;">
          <span class="cv-p-icon">⭐</span>
          <span class="cv-p-tag">${tr("TU", "YOU")}</span>
          <div class="cv-ball-dribble">🏀</div>
        </div>

        <!-- Compagni e difensori -->
        ${targets.map((t, idx) => {
          const isOpen = idx === openIdx;
          return `
            <div class="cv-target-wrap ${isOpen ? 'cv-target--open' : 'cv-target--covered'}" id="cv-wrap-${idx}" data-cv-idx="${idx}" style="top: ${t.pos.top}%; left: ${t.pos.left}%;">
              <button type="button" class="cv-player-btn" aria-label="${t.name}">
                <span class="cv-p-num">${t.name}</span>
                <span class="cv-p-status" id="cv-status-${idx}">${isOpen ? tr('🟢 LIBERO!', '🟢 OPEN!') : tr('🛡️ MARCATO', '🛡️ COVERED')}</span>
              </button>
            </div>`;
        }).join("")}
      </div>

      <div class="sm-feedback" id="cv-feedback">${tr("Leggi la difesa: chi si è smarcato?", "Read the defense: who is open?")}</div>

      <div class="sm-controls">
        <div class="cv-buttons-row">
          ${targets.map((t, idx) => `
            <button type="button" class="btn btn-secondary btn-sm cv-quick-btn" data-cv-idx="${idx}">
              🏀 ${t.name} (${t.role})
            </button>
          `).join("")}
        </div>
        <button type="button" class="btn btn-ghost btn-sm sm-skip-btn" id="btn-cv-skip">
          ⚡ ${tr("Salta minigioco e simula", "Skip minigame & simulate")}
        </button>
      </div>
    </div>
  `;

  const progressBar = container.querySelector("#cv-progress");
  const feedback = container.querySelector("#cv-feedback");
  const skipBtn = container.querySelector("#btn-cv-skip");
  const allTargetBtns = container.querySelectorAll("[data-cv-idx]");

  let running = true;
  let startTime = performance.now();
  let animId = null;
  let rotationTimer = null;

  // Intervallo di rotazione difensiva dinamica (tra 700ms e 900ms)
  const rotationMs = clamp(Math.round(720 + (iq - 50) * 2.5), 680, 920);

  function rotateDefense() {
    if (!running) return;
    openIdx = (openIdx + (Math.random() < 0.5 ? 1 : 2)) % 3;
    targets.forEach((_, idx) => {
      const wrap = container.querySelector(`#cv-wrap-${idx}`);
      const st = container.querySelector(`#cv-status-${idx}`);
      const isOpen = idx === openIdx;
      if (wrap) {
        wrap.className = `cv-target-wrap ${isOpen ? 'cv-target--open' : 'cv-target--covered'}`;
      }
      if (st) {
        st.textContent = isOpen ? tr('🟢 LIBERO!', '🟢 OPEN!') : tr('🛡️ MARCATO', '🛡️ COVERED');
      }
    });
    rotationTimer = setTimeout(rotateDefense, rotationMs);
  }

  rotationTimer = setTimeout(rotateDefense, rotationMs);

  function timerLoop(now) {
    if (!running) return;
    const elapsed = (now - startTime) / 1000;
    const remainingPct = Math.max(0, 100 - (elapsed / totalSeconds) * 100);
    if (progressBar) progressBar.style.width = `${remainingPct.toFixed(1)}%`;

    if (remainingPct <= 0) {
      resolvePick(-1);
      return;
    }
    animId = requestAnimationFrame(timerLoop);
  }

  animId = requestAnimationFrame(timerLoop);

  function resolvePick(chosenIdx) {
    if (!running) return;
    running = false;
    if (animId) cancelAnimationFrame(animId);
    if (rotationTimer) clearTimeout(rotationTimer);
    allTargetBtns.forEach(b => b.disabled = true);
    skipBtn.disabled = true;

    let timing = "poor";
    let isSuccess = false;
    let feedbackText = "";
    let toneClass = "";

    if (chosenIdx === openIdx) {
      // SCELTO IL COMPAGNO LIBERO!
      timing = "perfect";
      // GREEN RELEASE stile NBA 2K: 91% - 96% a bersaglio
      const perfectChance = clamp(Math.round(92 + ((playmaking + iq - 120) * 0.1)), 90, 96);
      isSuccess = rollChance(perfectChance);
      feedbackText = isSuccess
        ? tr("🟢 ASSIST PERFETTO! Tiro aperto a segno!", "🟢 DIME! Wide-open shot splashed!")
        : tr("🟢 SCARICO PERFETTO, ma il tiro aperto della vittoria scheggia il ferro!", "🟢 PERFECT DIME, but the open game-winning jumper rims out!");
      toneClass = isSuccess ? "sm-result--green" : "sm-result--yellow";
    } else if (chosenIdx >= 0) {
      // SCELTO UN COMPAGNO MARCATO
      timing = "poor";
      const rescueChance = clamp(Math.round(baseWinProb * 0.35), 8, 22);
      isSuccess = rollChance(rescueChance);
      feedbackText = isSuccess
        ? tr("🟡 PASSAGGIO DIFFICILE... ma il compagno segna lo stesso!", "🟡 TOUGH PASS... but your teammate hits the contested shot!")
        : tr("🔴 PASSAGGIO INTERCETTATO! Palla persa!", "🔴 PASS INTERCEPTED! Turnover!");
      toneClass = isSuccess ? "sm-result--yellow" : "sm-result--red";
    } else {
      // TEMPO SCADUTO
      timing = "late";
      isSuccess = false;
      feedbackText = tr("🔴 TEMPO SCADUTO! Raddoppio e palla persa sulla pressione!", "🔴 SHOT CLOCK VIOLATION! Trapped by the double-team!");
      toneClass = "sm-result--red";
    }

    if (feedback) {
      feedback.textContent = feedbackText;
      feedback.className = `sm-feedback ${toneClass}`;
    }

    setTimeout(() => {
      cleanup();
      if (opts.onRelease) {
        opts.onRelease({ timing, chosenIdx, success: isSuccess, feedbackText });
      }
    }, 700);
  }

  function handleSkip() {
    if (!running) return;
    cleanup();
    if (opts.onSkip) opts.onSkip();
  }

  allTargetBtns.forEach(el => {
    el.addEventListener("click", () => {
      const idx = parseInt(el.dataset.cvIdx, 10);
      resolvePick(idx);
    });
  });
  skipBtn.addEventListener("click", handleSkip);

  function cleanup() {
    running = false;
    if (animId) cancelAnimationFrame(animId);
    if (rotationTimer) clearTimeout(rotationTimer);
  }

  return { stop: () => resolvePick(openIdx), cancel: cleanup };
}
