"use strict";

/* ================================================================
   SUONI — piccoli effetti sintetizzati al volo (Web Audio, nessun file), spenti di
   default e attivabili dalla barra in alto. La scelta resta nel browser.
   ================================================================ */
const SOUND_KEY = "chosenOne.sound";
let audioCtx = null;

function soundEnabled() {
  try { return localStorage.getItem(SOUND_KEY) === "on"; } catch (e) { return false; }
}
function toggleSound() {
  try { localStorage.setItem(SOUND_KEY, soundEnabled() ? "off" : "on"); } catch (e) { /* storage non disponibile */ }
  updateSoundButtons();
  if (soundEnabled()) playSound("win");
}
function updateSoundButtons() {
  document.querySelectorAll("[data-sound-toggle]").forEach(b => {
    b.textContent = soundEnabled() ? "🔊" : "🔇";
    b.setAttribute("aria-label", soundEnabled() ? "Disattiva i suoni" : "Attiva i suoni");
    b.setAttribute("aria-pressed", String(soundEnabled()));
  });
}

/* Sequenze di note: [frequenza Hz, inizio s, durata s] */
const SOUND_PATTERNS = {
  win: [[523, 0, 0.12], [784, 0.1, 0.18]],
  loss: [[392, 0, 0.16], [262, 0.14, 0.26]],
  recap: [[440, 0, 0.1], [554, 0.09, 0.1], [659, 0.18, 0.2]],
  title: [[523, 0, 0.14], [659, 0.12, 0.14], [784, 0.24, 0.14], [1047, 0.36, 0.4]],
};
function playSound(kind) {
  if (!soundEnabled() || typeof window === "undefined") return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const pattern = SOUND_PATTERNS[kind];
  if (!Ctx || !pattern) return;
  try {
    audioCtx = audioCtx || new Ctx();
    const now = audioCtx.currentTime;
    pattern.forEach(([freq, start, dur]) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.15, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.05);
    });
  } catch (e) { /* audio non disponibile: si gioca in silenzio */ }
}
