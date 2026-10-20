"use strict";

/* ================================================================
   SHOT METER — Minigioco interattivo di tempismo per il tiro clutch.
   Usabile nelle partite chiave, tiri liberi e gare speciali.
   ================================================================ */

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

  // HTML del widget
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
        <!-- Zone colorate -->
        <div class="sm-zone sm-zone--red-left" style="left:0; width:${yellowStart}%;"></div>
        <div class="sm-zone sm-zone--yellow-left" style="left:${yellowStart}%; width:${greenStart - yellowStart}%;"></div>
        <div class="sm-zone sm-zone--green" style="left:${greenStart}%; width:${greenPct}%;">
          <span class="sm-green-target">PERFECT</span>
        </div>
        <div class="sm-zone sm-zone--yellow-right" style="left:${greenEnd}%; width:${yellowEnd - greenEnd}%;"></div>
        <div class="sm-zone sm-zone--red-right" style="left:${yellowEnd}%; width:${100 - yellowEnd}%;"></div>

        <!-- Cursore mobile -->
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
  // Velocità: un ciclo andata e ritorno dura circa 1.1 - 1.3 secondi
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
    if (needle) {
      needle.style.left = `${pos.toFixed(1)}%`;
    }
    animId = requestAnimationFrame(updateLoop);
  }

  animId = requestAnimationFrame(updateLoop);

  function stopAndEvaluate() {
    if (!running) return;
    running = false;
    if (animId) cancelAnimationFrame(animId);
    releaseBtn.disabled = true;
    skipBtn.disabled = true;

    // Calcolo esito in base alla posizione
    const stoppedAt = pos;
    let timing = "poor";
    let isSuccess = false;
    let feedbackText = "";
    let toneClass = "";

    if (stoppedAt >= greenStart && stoppedAt <= greenEnd) {
      // PERFETTO (Verde)
      timing = "perfect";
      isSuccess = true;
      feedbackText = "🟢 GREEN RELEASE! Rilascio perfetto!";
      toneClass = "sm-result--green";
    } else if (stoppedAt >= yellowStart && stoppedAt <= yellowEnd) {
      // BUONO (Giallo)
      timing = "good";
      // Probabilità aumentata del 25% rispetto al baseWinProb
      const bonusChance = clamp(Math.round((opts.baseWinProb || 50) * 1.25), 40, 88);
      isSuccess = rollChance(bonusChance);
      feedbackText = isSuccess ? "🟡 BUON RILASCIO! Tiro dentro!" : "🟡 BUON RILASCIO, ma tocca il ferro ed esce!";
      toneClass = "sm-result--yellow";
    } else {
      // FUORI TEMPO (Rosso)
      timing = stoppedAt < yellowStart ? "early" : "late";
      // Chance ridotta
      const malusChance = clamp(Math.round((opts.baseWinProb || 50) * 0.4), 10, 35);
      isSuccess = rollChance(malusChance);
      feedbackText = isSuccess ? "🔴 TIRO FORZATO... ma entra con fortuna!" : "🔴 FUORI TEMPO! Tiro fuori misura!";
      toneClass = "sm-result--red";
    }

    if (feedback) {
      feedback.textContent = feedbackText;
      feedback.className = `sm-feedback ${toneClass}`;
    }

    // Effetto visivo al cursore
    if (needle) {
      needle.classList.add("sm-needle--locked");
    }

    // Callback dopo brevissima suspense (600ms)
    setTimeout(() => {
      cleanup();
      if (opts.onRelease) {
        opts.onRelease({
          timing,
          stoppedAt,
          success: isSuccess,
          feedbackText,
        });
      }
    }, 650);
  }

  function handleSkip() {
    if (!running) return;
    running = false;
    if (animId) cancelAnimationFrame(animId);
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

