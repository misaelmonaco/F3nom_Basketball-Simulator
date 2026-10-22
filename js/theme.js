"use strict";

/* ================================================================
   TEMA — scuro (l'identità di sempre), chiaro o automatico (segue il sistema). I colori
   stanno tutti nelle variabili CSS di :root; il tema chiaro le ridefinisce sotto
   [data-theme="light"]. La scelta si ricorda nel browser e viene applicata già nell'<head>
   di index.html, prima che la pagina compaia, per evitare il lampo di colore sbagliato.
   ================================================================ */
const THEME_KEY = "chosenOne.theme";
const THEMES = [
  { id: "dark", label: "Arena (scuro)", labelEn: "Arena (Dark)", icon: "i-moon" },
  { id: "light", label: "Day (chiaro)", labelEn: "Day (Light)", icon: "i-sun" },
  { id: "auto", label: "Automatico", labelEn: "Auto", icon: "i-contrast" },
];

function themeLabel(t) {
  return (typeof isEn === "function" && isEn() && t.labelEn) ? t.labelEn : t.label;
}

function themePreference() {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return THEMES.some(t => t.id === v) ? v : "dark";
  } catch (e) { return "dark"; }
}
function systemPrefersLight() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: light)").matches;
}
function resolvedTheme(pref) { return pref === "auto" ? (systemPrefersLight() ? "light" : "dark") : pref; }

function applyTheme() {
  const root = document.documentElement;
  if (root && root.dataset) root.dataset.theme = resolvedTheme(themePreference());
  updateThemeButtons();
}
function cycleTheme() {
  const i = THEMES.findIndex(t => t.id === themePreference());
  const next = THEMES[(i + 1) % THEMES.length];
  try { localStorage.setItem(THEME_KEY, next.id); } catch (e) { /* storage non disponibile */ }
  applyTheme();
  const lbl = themeLabel(next);
  toast(tr(
    `🎨 Tema: ${lbl}${next.id === "auto" ? " (segue il sistema)" : ""}`,
    `🎨 Theme: ${lbl}${next.id === "auto" ? " (follows system)" : ""}`
  ));
}
/* I pulsanti [data-theme-toggle] mostrano il tema attuale; con data-theme-toggle="label" anche il nome */
function updateThemeButtons() {
  if (typeof document.querySelectorAll !== "function") return;
  const t = THEMES.find(x => x.id === themePreference());
  const lbl = themeLabel(t);
  document.querySelectorAll("[data-theme-toggle]").forEach(b => {
    b.innerHTML = `<svg class="ico" aria-hidden="true"><use href="#${t.icon}"></use></svg>${b.dataset.themeToggle === "label" ? tr(` Tema: ${lbl}`, ` Theme: ${lbl}`) : ""}`;
    b.setAttribute("aria-label", tr(`Tema: ${lbl}. Cambia tema`, `Theme: ${lbl}. Switch theme`));
    b.title = tr(`Tema: ${lbl} (clic per cambiare)`, `Theme: ${lbl} (click to switch)`);
  });
}
/* In modalità automatica si segue il sistema anche mentre il gioco è aperto */
function watchSystemTheme() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
  const mq = window.matchMedia("(prefers-color-scheme: light)");
  const onChange = () => { if (themePreference() === "auto") applyTheme(); };
  if (mq.addEventListener) mq.addEventListener("change", onChange);
  else if (mq.addListener) mq.addListener(onChange);
}
