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
  // Larghezza zona verde: tra 14% (attr 40) e 28% (attr 99)
  const greenPct = clamp(Math.round(14 + ((attrVal - 40) / 59) * 14), 12, 30);
  const yellowPct = 20; // 10% prima e 10% dopo il verde
  
  const greenStart = 50 - greenPct / 2;
  const greenEnd = 50 + greenPct / 2;
  const yellowStart = Math.max(5, greenStart - 10);
  const yellowEnd = Math.min(95, greenEnd + 10);

  container.innerHTML = `
    <div class="sm-widget" id="shot-meter-widget" tabindex="0" role="region" aria-label="Shot Meter">
      <div class="sm-header">
        <span class="sm-badge">🏀 Minigioco Clutch</span>
        <span class="sm-action-name">${opts.optionLabel || "Tiro decisivo"}</span>
      </div>

      <div class="sm-instruction">
        Premi <strong>SPAZIO</strong> o tocca il pulsante quando il cursore è nella <strong>ZONA VERDE</strong>!
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

      <div class="sm-feedback" id="sm-feedback">In attesa del rilascio...</div>

      <div class="sm-controls">
        <button type="button" class="btn btn-primary btn-lg sm-release-btn" id="btn-sm-release">
          🎯 RILASCIA IL TIRO!
        </button>
        <button type="button" class="btn btn-ghost btn-sm sm-skip-btn" id="btn-sm-skip">
          ⚡ Salta minigioco e simula
        </button>
      </div>
    </div>
  `;

  const needle = container.querySelector("#sm-needle");
  const feedback = container.querySelector("#sm-feedback");
  const releaseBtn = container.querySelector("#btn-sm-release");
  const skipBtn = container.querySelector("#btn-sm-skip");

  let pos = 0;
  let dir = 1;
  let running = true;
  let animId = null;
  const speed = 1.6;

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
      isSuccess = true;
      feedbackText = "🟢 GREEN RELEASE! Rilascio perfetto!";
      toneClass = "sm-result--green";
    } else if (stoppedAt >= yellowStart && stoppedAt <= yellowEnd) {
      timing = "good";
      const bonusChance = clamp(Math.round((opts.baseWinProb || 50) * 1.25), 40, 88);
      isSuccess = rollChance(bonusChance);
      feedbackText = isSuccess ? "🟡 BUON RILASCIO! Tiro dentro!" : "🟡 BUON RILASCIO, ma tocca il ferro ed esce!";
      toneClass = "sm-result--yellow";
    } else {
      timing = stoppedAt < yellowStart ? "early" : "late";
      const malusChance = clamp(Math.round((opts.baseWinProb || 50) * 0.4), 10, 35);
      isSuccess = rollChance(malusChance);
      feedbackText = isSuccess ? "🔴 TIRO FORZATO... ma entra con fortuna!" : "🔴 FUORI TEMPO! Tiro fuori misura!";
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
  // Tolleranza per il "Perfect": tra 10px (attr 40) e 22px (attr 99)
  const perfectTolerance = clamp(Math.round(10 + ((attrVal - 40) / 59) * 12), 10, 24);
  const targetDiameter = 80;

  container.innerHTML = `
    <div class="sm-widget tc-widget" id="timing-circle-widget" tabindex="0" role="region" aria-label="Timing Circle">
      <div class="sm-header">
        <span class="sm-badge">💥 Minigioco Schiacciata</span>
        <span class="sm-action-name">${opts.optionLabel || "Attacco il ferro"}</span>
      </div>

      <div class="sm-instruction">
        Premi <strong>SPAZIO</strong> o tocca il pulsante quando il cerchio arancione combacia col cerchio <strong>VERDE</strong>!
      </div>

      <div class="tc-arena" id="tc-arena">
        <div class="tc-target-zone" id="tc-target" style="width: ${targetDiameter}px; height: ${targetDiameter}px;">
          <div class="tc-rim-icon">🏀</div>
        </div>
        <div class="tc-collapsing-ring" id="tc-ring" style="width: 220px; height: 220px;"></div>
      </div>

      <div class="sm-feedback" id="tc-feedback">Attendi il momento perfetto...</div>

      <div class="sm-controls">
        <button type="button" class="btn btn-primary btn-lg sm-release-btn" id="btn-tc-slam">
          💥 SCHIACCIATA / APPOGGIO AL FERRO!
        </button>
        <button type="button" class="btn btn-ghost btn-sm sm-skip-btn" id="btn-tc-skip">
          ⚡ Salta minigioco e simula
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
  // Velocità restringimento
  const shrinkSpeed = 2.4;

  function updateLoop() {
    if (!running) return;
    size -= shrinkSpeed;
    if (size <= 20) {
      size = 220; // Riavvia ciclo se non premuto
    }
    if (ring) {
      ring.style.width = `${size.toFixed(1)}px`;
      ring.style.height = `${size.toFixed(1)}px`;
    }
    animId = requestAnimationFrame(updateLoop);
  }

  animId = requestAnimationFrame(updateLoop);

  function stopAndEvaluate() {
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

    if (diff <= perfectTolerance) {
      timing = "perfect";
      isSuccess = true;
      feedbackText = "💥 BOOM! SCHIACCIATA DA HIGHLIGHTS!";
      toneClass = "sm-result--green";
      if (target) target.classList.add("tc-target--boom");
    } else if (diff <= perfectTolerance + 24) {
      timing = "good";
      const bonusChance = clamp(Math.round((opts.baseWinProb || 50) * 1.25), 45, 90);
      isSuccess = rollChance(bonusChance);
      feedbackText = isSuccess ? "🟡 BUON APPOGGIO! Canestro e fallo!" : "🟡 APPOGGIO SFIORATO, palla sputata dal ferro!";
      toneClass = "sm-result--yellow";
    } else {
      timing = size > targetDiameter ? "early" : "late";
      const malusChance = clamp(Math.round((opts.baseWinProb || 50) * 0.4), 10, 35);
      isSuccess = rollChance(malusChance);
      feedbackText = isSuccess ? "🔴 TIRO DISPERATO... ma entra con fortuna!" : "🔴 STOPPATA SUL FERRO! La difesa chiude!";
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
      stopAndEvaluate();
    }
  }

  slamBtn.addEventListener("click", stopAndEvaluate);
  if (arena) arena.addEventListener("click", stopAndEvaluate);
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
   3. COURT VISION (Scelta rapida di passaggio / Regia)
   ---------------------------------------------------------------- */
function renderCourtVisionWidget(container, opts) {
  if (!container) return null;

  const playmaking = opts.attributeValue || 70;
  const iq = opts.iqValue || 70;
  // Tempo disponibile: tra 2.6s e 3.8s in base a playmaking e QI
  const totalSeconds = clamp(2.6 + ((playmaking + iq - 100) / 98) * 1.2, 2.4, 4.0);

  // 3 possibili compagni sul parquet, uno solo è LIBERO
  const openIdx = Math.floor(Math.random() * 3);
  const targets = [
    { id: 0, name: "Angolo SX", role: "Tiratore", pos: { top: 72, left: 16 } },
    { id: 1, name: "Taglio al ferro", role: "Centro", pos: { top: 32, left: 50 } },
    { id: 2, name: "Ala DX", role: "Guardia", pos: { top: 48, left: 82 } },
  ];

  container.innerHTML = `
    <div class="sm-widget cv-widget" id="court-vision-widget" tabindex="0" role="region" aria-label="Court Vision">
      <div class="sm-header">
        <span class="sm-badge">👁️ Visione di Gioco</span>
        <span class="sm-action-name">${opts.optionLabel || "Scarico al compagno"}</span>
      </div>

      <div class="sm-instruction">
        I raddoppi stanno chiudendo! Tocca il <strong>COMPAGNO LIBERO</strong> prima dello scadere del tempo!
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
          <span class="cv-p-tag">TU</span>
          <div class="cv-ball-dribble">🏀</div>
        </div>

        <!-- Compagni e difensori -->
        ${targets.map((t, idx) => {
          const isOpen = idx === openIdx;
          return `
            <div class="cv-target-wrap ${isOpen ? 'cv-target--open' : 'cv-target--covered'}" data-cv-idx="${idx}" style="top: ${t.pos.top}%; left: ${t.pos.left}%;">
              <button type="button" class="cv-player-btn" aria-label="${t.name}">
                <span class="cv-p-num">${t.name}</span>
                <span class="cv-p-status">${isOpen ? '🟢 LIBERO!' : '🛡️ MARCATO'}</span>
              </button>
            </div>`;
        }).join("")}
      </div>

      <div class="sm-feedback" id="cv-feedback">Trova l'uomo libero sul parquet!</div>

      <div class="sm-controls">
        <div class="cv-buttons-row">
          ${targets.map((t, idx) => `
            <button type="button" class="btn btn-secondary btn-sm cv-quick-btn" data-cv-idx="${idx}">
              ${idx === openIdx ? '🟢' : '🛡️'} ${t.name}
            </button>
          `).join("")}
        </div>
        <button type="button" class="btn btn-ghost btn-sm sm-skip-btn" id="btn-cv-skip">
          ⚡ Salta minigioco e simula
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

  function timerLoop(now) {
    if (!running) return;
    const elapsed = (now - startTime) / 1000;
    const remainingPct = Math.max(0, 100 - (elapsed / totalSeconds) * 100);
    if (progressBar) progressBar.style.width = `${remainingPct.toFixed(1)}%`;

    if (remainingPct <= 0) {
      // Tempo scaduto!
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
    allTargetBtns.forEach(b => b.disabled = true);
    skipBtn.disabled = true;

    let timing = "poor";
    let isSuccess = false;
    let feedbackText = "";
    let toneClass = "";

    if (chosenIdx === openIdx) {
      // SCELTO IL COMPAGNO LIBERO!
      timing = "perfect";
      isSuccess = true;
      feedbackText = "🟢 ASSIST PERFETTO! Tiro aperto a segno!";
      toneClass = "sm-result--green";
    } else if (chosenIdx >= 0) {
      // SCELTO UN COMPAGNO MARCATO
      timing = "poor";
      const rescueChance = clamp(Math.round((opts.baseWinProb || 50) * 0.35), 10, 30);
      isSuccess = rollChance(rescueChance);
      feedbackText = isSuccess ? "🟡 PASSAGGIO DIFFICILE... ma il compagno segna lo stesso!" : "🔴 PASSAGGIO INTERCETTATO! Palla persa!";
      toneClass = isSuccess ? "sm-result--yellow" : "sm-result--red";
    } else {
      // TEMPO SCADUTO
      timing = "late";
      isSuccess = false;
      feedbackText = "🔴 TEMPO SCADUTO! Raddoppio e palla persa sulla pressione!";
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
  }

  return { stop: () => resolvePick(openIdx), cancel: cleanup };
}
