"use strict";

/* ================================================================
   DINASTIA — a fine carriera si può giocare quella di un figlio o di una figlia: stesso
   cognome e nazionalità, qualche anno dopo il ritiro del genitore. Il cognome pesa: più
   talento di partenza e più attenzione dei media, in proporzione a quanto ha vinto chi è
   venuto prima.
   ================================================================ */
const LEGACY_POTENTIAL_FLOOR = { S: 88, A: 84, B: 80, C: 77, D: 75, F: 74 };
const LEGACY_POPULARITY = { S: 25, A: 18, B: 10, C: 5, D: 3, F: 0 };
let pendingLegacy = null; // dinastia da continuare nella prossima carriera creata

/* Riassunto del genitore (il giocatore appena ritirato) da passare alla nuova carriera */
function legacySummary(p) {
  const prev = p.legacy || { generation: 1, parents: [] };
  const grade = computeCareerGrade().grade;
  return {
    generation: prev.generation + 1,
    lastName: p.lastName, nationality: p.nationality, jersey: p.jerseyNumber,
    startYear: p.year + randInt(8, 12),
    childName: p.family && p.family.children.length ? p.family.children[0].name : null,
    parents: [...prev.parents, {
      name: `${p.firstName} ${p.lastName}`, jersey: p.jerseyNumber, grade, goat: p.goatScore || 0,
      rings: p.trophies.rings, mvp: p.trophies.mvp, hof: hallOfFameVerdict().elected,
      from: p.startYear || CAREER_START_YEAR, to: p.year,
    }],
  };
}
function legacyParent(legacy) { return legacy && legacy.parents[legacy.parents.length - 1]; }

/* Il cognome pesa: potenziale minimo e popolarità di partenza secondo il voto del genitore */
function applyLegacyBonuses(p, legacy, customRatings, roll) {
  const parent = legacyParent(legacy);
  if (!parent) return;
  if (!customRatings) p.potential = clamp(Math.max(p.potential, LEGACY_POTENTIAL_FLOOR[parent.grade] + (roll ? roll.legacy : randInt(0, 4))), p.overall, 99);
  p.popularity = clamp(p.popularity + (LEGACY_POPULARITY[parent.grade] || 0), 0, 100);
  p.reputation = clamp(reputationOf(p) + 2, 0, 100);
}

function legacyBannerHtml(legacy) {
  const parent = legacyParent(legacy);
  if (!parent) return "";
  return `
    <div class="legacy-banner">
      <div class="lb-title">👨‍👦 Dinastia ${legacy.lastName} · ${legacy.generation}ª generazione</div>
      <div class="small-muted">Figlio o figlia di <span class="lb-parent"></span> (voto ${parent.grade}, ${parent.rings} anelli, ${parent.mvp} MVP${parent.hof ? ", Hall of Fame" : ""}). Il cognome è fissato, il resto lo scegli tu: si parte nel ${legacy.startYear}.</div>
    </div>`;
}
function fillLegacyBanner(box, legacy) {
  const node = box.querySelector(".lb-parent");
  if (node) node.textContent = legacyParent(legacy).name;
}

/* Dinastia nella schermata finale: chi è venuto prima */
function dynastyHtml(p) {
  if (!p.legacy || !p.legacy.parents.length) return "";
  return `
    <div class="dynasty">
      <div class="recap-h">La dinastia ${p.lastName}</div>
      ${p.legacy.parents.map((g, i) => `
        <div class="hall-row"><span class="hall-grade grade-${g.grade}">${g.grade}</span>
          <span class="hall-name" data-dyn="${i}"></span>
          <span class="small-muted">${i + 1}ª generazione · ${g.from}-${g.to} · 👑 ${g.goat} · 💍 ${g.rings} · ⭐ ${g.mvp}${g.hof ? " · 🏛️" : ""}</span></div>`).join("")}
    </div>`;
}
function fillDynastyNames(box, p) {
  box.querySelectorAll("[data-dyn]").forEach(node => {
    const g = p.legacy.parents[parseInt(node.dataset.dyn)];
    node.textContent = `#${g.jersey} ${g.name}`;
  });
}

/* Dalla schermata finale: si torna alla creazione con cognome e nazionalità della famiglia */
function startLegacyCareer() {
  if (!player || !player.retired) return;
  const legacy = legacySummary(player);
  const slot = activeSlot;
  resetToCreation();
  pendingLegacy = legacy;
  newCareerSlot = slot; // la nuova generazione prende il posto del genitore (che resta nell'albo d'oro)
  el("inp-lastname").value = legacy.lastName;
  if (legacy.childName) el("inp-firstname").value = legacy.childName; // il primo figlio nato in carriera
  el("inp-nationality").value = legacy.nationality;
  renderWizard();
  renderSavedCareerCard();
}
