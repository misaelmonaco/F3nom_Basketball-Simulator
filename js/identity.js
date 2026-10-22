"use strict";

/* ================================================================
   IDENTITÀ — ciò che rende unico il giocatore oltre a ruolo e archetipo: mano dominante,
   corporatura, tratti di carattere, città natale e aspetto (un avatar SVG disegnato qui).
   In fondo la scheda degli scout mostrata prima di iniziare la carriera.
   ================================================================ */
const HANDS = i18nify([
  { id: "right", icon: "🤚", label: "Destro", labelEn: "Right-Handed", desc: "La mano di quasi tutti: nessun effetto particolare.", descEn: "Standard shooting hand: no special modifiers." },
  { id: "left", icon: "✋", label: "Mancino", labelEn: "Left-Handed", desc: "Gli avversari sono meno abituati a difenderti: +2 finalizzazione, +1 tiro e un filo di freddezza in più nei finali.", descEn: "Defenders are less used to your angles: +2 finishing, +1 shooting, and a slight edge in clutch moments." },
]);
const HAND_BUMPS = { right: {}, left: { finishing: 2, shooting: 1 } };

const BODY_TYPES = i18nify([
  { id: "balanced", icon: "⚖️", label: "Equilibrato", labelEn: "Balanced", desc: "Nessun punto debole, nessun eccesso.", descEn: "Well-proportioned build: no weaknesses, no extremes.", bumps: {}, drain: 1, injury: 1 },
  { id: "explosive", icon: "💥", label: "Esplosivo", labelEn: "Explosive", desc: "Fibre veloci: +5 atletismo e +2 finalizzazione, ma ti stanchi prima e rischi di più gli infortuni.", descEn: "Fast-twitch fibers: +5 athleticism and +2 finishing, but faster stamina drain and higher injury risk.", bumps: { athleticism: 5, finishing: 2 }, drain: 1.15, injury: 1.15 },
  { id: "durable", icon: "🪨", label: "Resistente", labelEn: "Durable", desc: "Un motore diesel: consumi meno stamina e ti fai male meno spesso, con 2 punti di atletismo in meno.", descEn: "Built like a tank: lower stamina drain and fewer injuries, at the cost of −2 athleticism.", bumps: { athleticism: -2 }, drain: 0.8, injury: 0.8 },
  { id: "lanky", icon: "📏", label: "Longilineo", labelEn: "Wiry & Long", desc: "Braccia lunghe: +3 difesa e +2 rimbalzi, ma nei contatti soffri (−2 finalizzazione).", descEn: "Huge wingspan: +3 defense and +2 rebounding, but struggles through contact (−2 finishing).", bumps: { defense: 3, rebounding: 2, finishing: -2 }, drain: 1, injury: 1.05 },
]);
function getBodyType(p) { return BODY_TYPES.find(b => b.id === (p && p.bodyType)) || BODY_TYPES[0]; }

/* Tratti di carattere: se ne scelgono fino a due, alcuni si escludono a vicenda */
const MAX_TRAITS = 2;
const TRAITS = i18nify([
  { id: "leader", icon: "🎖️", label: "Leader nato", labelEn: "Natural Leader", desc: "La fascia di capitano arriva prima e più spesso; lo spogliatoio ti segue (+2 chimica a stagione).", descEn: "Earn team captaincy earlier and more often; the locker room rallies behind you (+2 chemistry per season)." },
  { id: "worker", icon: "🏋️", label: "Stakanovista", labelEn: "Gym Rat", desc: "Un punto in più in ogni allenamento estivo.", descEn: "Earn +1 extra skill point in every summer workout." },
  { id: "showman", icon: "🎤", label: "Showman", labelEn: "Showman", desc: "+3 popolarità a stagione e sponsor più ricchi del 15%.", descEn: "+3 popularity per season and 15% richer endorsement deals.", excludes: ["humble"] },
  { id: "ice", icon: "🧊", label: "Sangue freddo", labelEn: "Ice in His Veins", desc: "Nei possessi decisivi dei playoff la mano non trema: +4% di riuscita.", descEn: "Unfazed under playoff pressure: +4% success rate on clutch possessions." },
  { id: "hothead", icon: "🌋", label: "Testa calda", labelEn: "Hothead", desc: "Nei finali ti esalti (+3% clutch), ma spogliatoio e coach ti sopportano meno (−3 chimica e −2 fiducia a stagione).", descEn: "Thrives in crunch time (+3% clutch), but clashes with teammates and coaches (−3 chemistry and −2 coach trust per season).", excludes: ["humble"] },
  { id: "humble", icon: "🙏", label: "Umile", labelEn: "Humble", desc: "Il coach si fida di te (+3 fiducia a stagione), ma i riflettori ti cercano meno (−1 popolarità a stagione).", descEn: "Coaches love your attitude (+3 trust per season), though you attract less media hype (−1 popularity per season).", excludes: ["hothead", "showman"] },
  { id: "loyal", icon: "🤝", label: "Bandiera", labelEn: "Franchise Loyalist", desc: "I rinnovi con la tua squadra pagano il 10% in più e ogni stagione nello stesso club rafforza il legame.", descEn: "Contract extensions with your current club pay +10% more, and staying long-term builds chemistry and reputation.", excludes: ["mercenary"] },
  { id: "mercenary", icon: "💰", label: "Mercenario", labelEn: "Mercenary", desc: "Ogni contratto vale l'8% in più, ma i compagni lo sanno (−2 chimica a stagione).", descEn: "Every contract pays +8% more, but teammates know it's business first (−2 chemistry per season).", excludes: ["loyal"] },
  { id: "precocious", icon: "⏩", label: "Talento precoce", labelEn: "Early Bloomer", desc: "Parti 3 punti più avanti, ma con un tetto più basso (−4 potenziale).", descEn: "Start +3 overall higher right away, but with a lower ceiling (−4 potential).", excludes: ["latebloomer"] },
  { id: "latebloomer", icon: "🌱", label: "Esplosione tardiva", labelEn: "Late Bloomer", desc: "Parti 3 punti più indietro, ma il tuo tetto è più alto (+5 potenziale).", descEn: "Start −3 overall lower, but with a higher ceiling (+5 potential).", excludes: ["precocious"] },
  { id: "globetrotter", icon: "🧭", label: "Giramondo", labelEn: "Globetrotter", desc: "Ti ambienti in fretta in ogni paese nuovo.", descEn: "Adapt twice as fast when moving to a new country." },
]);
function getTrait(id) { return TRAITS.find(t => t.id === id) || null; }
function hasTrait(p, id) { return !!(p && p.traits && p.traits.includes(id)); }
function traitsCompatible(ids, id) {
  const t = getTrait(id);
  return !ids.some(x => x === id || (t.excludes || []).includes(x) || (getTrait(x).excludes || []).includes(id));
}
function sanitizeTraits(ids) {
  const out = [];
  (ids || []).forEach(id => { if (getTrait(id) && out.length < MAX_TRAITS && traitsCompatible(out, id)) out.push(id); });
  return out;
}
function traitsText(p) { return (p.traits || []).map(id => { const t = getTrait(id); return t ? `${t.icon} ${t.label}` : ""; }).filter(Boolean).join(" · "); }

/* Punti spostati tra gli attributi alla creazione: ±4 per attributo, senza crearne di nuovi */
const ATTR_SHIFT_MAX = 4;
function sanitizeAttrShift(shift) {
  const out = {};
  let sum = 0;
  ATTR_KEYS.forEach(k => { out[k] = clamp(Math.round((shift && shift[k]) || 0), -ATTR_SHIFT_MAX, ATTR_SHIFT_MAX); sum += out[k]; });
  if (sum > 0) ATTR_KEYS.forEach(k => { out[k] = 0; }); // budget sforato: si ignora lo spostamento
  return out;
}

/* ---------- effetti in gioco ---------- */
function clutchTraitBonus(p) { return (hasTrait(p, "ice") ? 0.04 : 0) + (hasTrait(p, "hothead") ? 0.03 : 0) + (p.hand === "left" ? 0.01 : 0); }
function traitSalaryMult(p) { return hasTrait(p, "mercenary") ? 1.08 : 1; }
function secondaryRoleOf(p) { const a = getArchetype(p.role, p.archetypeId); return (a && a.hybrid) || null; }

/* Fine stagione: carattere e città natale lasciano il segno su spogliatoio, coach e popolarità */
function identitySeasonUpdate(p) {
  const notes = [];
  const chem = d => { p.chemistry = clamp(p.chemistry + d, 0, 100); };
  const pop = d => { p.popularity = clamp(p.popularity + d, 0, 100); };
  if (hasTrait(p, "leader")) chem(2);
  if (hasTrait(p, "showman")) pop(3);
  if (hasTrait(p, "hothead")) { chem(-3); changeCoachTrust(p, -2); }
  if (hasTrait(p, "humble")) { changeCoachTrust(p, 3); pop(-1); }
  if (hasTrait(p, "mercenary")) chem(-2);
  if (hasTrait(p, "loyal") && consecutiveSeasonsWithTeam(p) >= 3) { chem(2); changeReputation(p, 1); }
  if (isHomeTeam(p, p.team)) {
    pop(3); chem(2); p.morale = clamp(p.morale + 2, 0, 100);
    if (consecutiveSeasonsWithTeam(p) === 1) notes.push(`🏠 Giocare a ${p.hometown}, a casa tua, ha un altro sapore: tutta la città tifa per te.`);
  }
  notes.forEach(n => pushNews(n));
  return notes[0] || null;
}

/* ---------- città natale ---------- */
function leaguesOfNation(nationality) {
  return Object.keys(LEAGUES).filter(id => !LEAGUES[id].minorIta && (LEAGUES[id].country === nationality || (LEAGUES[id].homeNations || []).includes(nationality)));
}
function hometownCities(nationality) {
  const cities = new Set();
  leaguesOfNation(nationality).forEach(id => LEAGUES[id].teams.forEach(t => cities.add(t.city)));
  return [...cities].sort((a, b) => a.localeCompare(b, "it"));
}
function isHomeTeam(p, team) { return !!(p && p.hometown && team && team.city === p.hometown); }

/* D'estate la squadra della tua città può farsi avanti, se sei al suo livello */
function hometownOffer(p) {
  if (!p.hometown || isHomeTeam(p, p.team) || p.age < 19 || !rollChance(22)) return null;
  const candidates = [];
  Object.keys(LEAGUES).forEach(id => {
    if (id === "NCAA" || LEAGUES[id].minorIta || p.overall < LEAGUES[id].avgOverall - 5) return;
    LEAGUES[id].teams.filter(t => t.city === p.hometown).forEach(team => candidates.push({ team, league: id }));
  });
  if (!candidates.length) return null;
  const best = candidates.sort((a, b) => LEAGUES[b.league].avgOverall - LEAGUES[a.league].avgOverall)[0];
  return {
    id: "hometown", title: `🏠 ${best.team.name} (la tua città)`,
    desc: `${best.team.name} vuole riportarti a ${p.hometown}, dove sei cresciuto: tifosi, famiglia e amici ti aspettano.`,
    team: best.team, targetLeague: best.league, contractProposal: generateContractProposal(best.league, p, best.team),
  };
}
function onHometownSigned(p) {
  p.popularity = clamp(p.popularity + 5, 0, 100);
  p.morale = clamp(p.morale + 6, 0, 100);
  pushNews(`🏠 ${p.firstName} ${p.lastName} torna a giocare nella sua ${p.hometown}.`);
}

/* ---------- aspetto: avatar SVG ---------- */
const SKIN_TONES = ["#f3d4b5", "#e2b187", "#c98e5e", "#a0673d", "#744a2b", "#4b2e1c"];
const HAIR_COLORS = ["#1c1512", "#4a2f1d", "#8a5a2b", "#d9b56b", "#a63d1f", "#c9c9c9"];
const HAIR_STYLES = i18nify([
  { id: "buzz", label: "Rasati", labelEn: "Buzz Cut" }, { id: "short", label: "Corti", labelEn: "Short" }, { id: "curly", label: "Ricci", labelEn: "Curly" }, { id: "afro", label: "Afro", labelEn: "Afro" },
  { id: "braids", label: "Treccine", labelEn: "Braids" }, { id: "mohawk", label: "Cresta", labelEn: "Mohawk" }, { id: "long", label: "Lunghi", labelEn: "Long" }, { id: "bald", label: "Pelato", labelEn: "Bald" },
]);
const BEARDS = i18nify([{ id: "none", label: "Nessuna", labelEn: "Clean" }, { id: "stubble", label: "Accennata", labelEn: "Stubble" }, { id: "goatee", label: "Pizzetto", labelEn: "Goatee" }, { id: "full", label: "Piena", labelEn: "Full Beard" }]);
function defaultLook() { return { skin: 2, hair: "short", hairColor: 0, beard: "none", headband: false }; }
function randomLook() {
  return { skin: randInt(0, SKIN_TONES.length - 1), hair: choice(HAIR_STYLES).id, hairColor: randInt(0, 4), beard: choice(BEARDS).id, headband: rollChance(25) };
}
function sanitizeLook(look) {
  const l = { ...defaultLook(), ...(look || {}) };
  l.skin = clamp(parseInt(l.skin) || 0, 0, SKIN_TONES.length - 1);
  l.hairColor = clamp(parseInt(l.hairColor) || 0, 0, HAIR_COLORS.length - 1);
  if (!HAIR_STYLES.some(h => h.id === l.hair)) l.hair = "short";
  if (!BEARDS.some(b => b.id === l.beard)) l.beard = "none";
  l.headband = !!l.headband;
  return l;
}

let avatarSeq = 0;
/* La canotta della squadra in cui giochi, con il tuo numero: corpo nel colore principale, collo e
   giromanica nel secondario. Se i due colori sono troppo simili il numero passa a nero o bianco. */
function colorLuminance(hex) {
  const h = String(hex || "#000000").replace("#", "");
  const [r, g, b] = [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function colorContrast(a, b) { const x = colorLuminance(a), y = colorLuminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
function jerseySvg(team, number) {
  const c1 = (team && team.colors && team.colors[0]) || "#ff5a1f", c2 = (team && team.colors && team.colors[1]) || "#10151d";
  const ink = colorContrast(c1, c2) >= 2.2 ? c2 : colorLuminance(c1) > 0.5 ? "#10151d" : "#ffffff";
  const trim = colorContrast(c1, c2) >= 1.4 ? c2 : ink;
  const n = number == null ? "" : parseInt(number);
  return `<svg class="jersey-svg" viewBox="0 0 64 68" role="img" aria-label="Maglia di ${team ? team.name : "squadra"}${n !== "" ? `, numero ${n}` : ""}">
    <path d="M17 3 H25 Q26.5 13 32 13 Q37.5 13 39 3 H47 V12 Q50 21 58 23 V64 Q32 67 6 64 V23 Q14 21 17 12 Z" fill="${c1}" stroke="rgba(0,0,0,.35)" stroke-width="1"/>
    <path d="M25 3 Q26.5 13 32 13 Q37.5 13 39 3" fill="none" stroke="${trim}" stroke-width="2.6"/>
    <path d="M17 12 Q14 21 6 23 M47 12 Q50 21 58 23" fill="none" stroke="${trim}" stroke-width="2.6" stroke-linecap="round"/>
    <text x="32" y="50" text-anchor="middle" font-family="Big Shoulders Display, Impact, sans-serif" font-weight="900" font-size="26" fill="${ink}">${n}</text>
  </svg>`;
}

function avatarSvg(look, colors, jersey) {
  const l = sanitizeLook(look);
  const skin = SKIN_TONES[l.skin], hair = HAIR_COLORS[l.hairColor];
  const c1 = (colors && colors[0]) || "#ff7a1a", c2 = (colors && colors[1]) || "#10151d";
  const id = `av${++avatarSeq}`;
  const behind = {
    afro: `<ellipse cx="32" cy="20" rx="18" ry="14" fill="${hair}"/>`,
    long: `<path d="M18 30 C16 9 48 9 46 30 L47 45 L40 45 L41 29 L23 29 L24 45 L17 45 Z" fill="${hair}"/>`,
  }[l.hair] || "";
  const front = {
    buzz: `<path d="M21 26 C21 13 43 13 43 26 C40 19 24 19 21 26 Z" fill="${hair}" opacity=".8"/>`,
    short: `<path d="M20 27 C17 9 47 9 44 27 C43 22 41 20 39 19 C34 21 27 21 23 21 C21.5 23 20.5 25 20 27 Z" fill="${hair}"/>`,
    curly: `<g fill="${hair}">${[21, 25, 29, 33, 37, 41].map((x, i) => `<circle cx="${x + 1}" cy="${18 - (i > 0 && i < 5 ? 2 : 0)}" r="4.5"/>`).join("")}<path d="M20 25 C20 16 44 16 44 25 C40 20 24 20 20 25 Z"/></g>`,
    afro: `<path d="M21 25 C22 14 42 14 43 25 C38 19 26 19 21 25 Z" fill="${hair}"/>`,
    braids: `<path d="M20 26 C19 12 45 12 44 26 C41 19 23 19 20 26 Z" fill="${hair}"/><g stroke="${skin}" stroke-width=".8" opacity=".55"><path d="M26 15 L24 23"/><path d="M30 14 L29 21"/><path d="M34 14 L35 21"/><path d="M38 15 L40 23"/></g>`,
    mohawk: `<path d="M21 26 C21 14 43 14 43 26 C40 20 24 20 21 26 Z" fill="${hair}" opacity=".3"/><path d="M29 8 C31 6 33 6 35 8 L36 21 L28 21 Z" fill="${hair}"/>`,
    long: `<path d="M20 27 C18 11 46 11 44 27 C40 18 34 17 31 20 C28 17 23 19 20 27 Z" fill="${hair}"/>`,
    bald: `<ellipse cx="28" cy="19" rx="4" ry="2" fill="#fff" opacity=".18"/>`,
  }[l.hair] || "";
  const beard = {
    stubble: `<path d="M21 30 C22 43 27 43 32 43 C37 43 42 43 43 30 C41 39 37 41 32 41 C27 41 23 39 21 30 Z" fill="${hair}" opacity=".35"/>`,
    goatee: `<path d="M28.5 34.5 Q32 33 35.5 34.5 Q35 36 32 35.6 Q29 36 28.5 34.5 Z M29.5 37.5 Q32 43 34.5 37.5 Q32 39 29.5 37.5 Z" fill="${hair}"/>`,
    full: `<path d="M21 29 C21 44 27 45 32 45 C37 45 43 44 43 29 C41 36 38 34 32 34.5 C26 34 23 36 21 29 Z" fill="${hair}"/>`,
  }[l.beard] || "";
  const band = l.headband ? `<rect x="20.5" y="20" width="23" height="3.6" rx="1.2" fill="${c2 === "#FFFFFF" || c2 === "#ffffff" ? c1 : "#f2f4f7"}"/>` : "";
  const num = jersey != null ? `<text x="32" y="61" text-anchor="middle" font-size="8" font-weight="900" font-family="Segoe UI, Arial, sans-serif" fill="${c2}">${parseInt(jersey)}</text>` : "";
  return `<svg class="avatar-svg" viewBox="0 0 64 64" role="img" aria-label="Avatar del giocatore">
    <defs><clipPath id="${id}"><circle cx="32" cy="32" r="32"/></clipPath></defs>
    <g clip-path="url(#${id})">
      <rect width="64" height="64" fill="#1b2330"/>
      ${behind}
      <rect x="27" y="37" width="10" height="11" fill="${skin}"/>
      <path d="M6 66 C8 51 19 46 32 46 C45 46 56 51 58 66 Z" fill="${c1}"/>
      <path d="M26 46.5 L32 53 L38 46.5" fill="none" stroke="${c2}" stroke-width="2"/>
      ${num}
      <circle cx="20.8" cy="29.5" r="2.6" fill="${skin}"/><circle cx="43.2" cy="29.5" r="2.6" fill="${skin}"/>
      <ellipse cx="32" cy="28.5" rx="11" ry="13" fill="${skin}"/>
      ${front}${band}${beard}
      <circle cx="27.8" cy="28.5" r="1.3" fill="#1a1a1a"/><circle cx="36.2" cy="28.5" r="1.3" fill="#1a1a1a"/>
      <path d="M25.6 25.4 L30 24.8 M34 24.8 L38.4 25.4" stroke="${hair}" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M29.2 36 Q32 38 34.8 36" fill="none" stroke="#5a3526" stroke-width="1.1" stroke-linecap="round"/>
    </g>
  </svg>`;
}
/* Riempie un cerchio .avatar: l'avatar disegnato se c'è un aspetto, altrimenti le iniziali */
function fillAvatar(node, p, team) {
  if (!node) return;
  if (p.look) {
    node.classList.add("has-look");
    node.innerHTML = avatarSvg(p.look, (team || p.team || {}).colors, p.jerseyNumber);
  } else {
    node.classList.remove("has-look");
    node.textContent = (p.firstName[0] || "") + (p.lastName[0] || "");
  }
}

/* ---------- scheda degli scout ---------- */
const SCOUT_COMPARISONS = {
  shooting: ["un cecchino capace di aprire qualsiasi difesa", "una mano educata che va solo rifinita"],
  finishing: ["un attaccante del ferro che vive a contatto", "uno che segna quando conta, vicino a canestro"],
  playmaking: ["un regista che vede le linee di passaggio prima degli altri", "un passatore naturale, ancora da disciplinare"],
  rebounding: ["un lottatore che vive sotto i tabelloni", "uno che si prende ogni pallone vagante"],
  defense: ["un difensore da cui non si passa", "un marcatore tenace, ancora grezzo"],
  athleticism: ["un atleta fuori scala per la sua età", "un fisico esplosivo ancora tutto da incanalare"],
};
const SCOUT_COMPARISONS_EN = {
  shooting: ["a deadeye shooter capable of stretching any defense", "a natural shooting touch that just needs polish"],
  finishing: ["a fearless rim attacker who thrives through contact", "a reliable inside finisher when it counts"],
  playmaking: ["a floor general who sees passing lanes before anyone else", "a natural playmaker who still needs discipline"],
  rebounding: ["a relentless warrior on the glass", "a hustle rebounder who tracks down every loose ball"],
  defense: ["a lockdown defender nobody wants to face", "a tenacious stopper, still raw around the edges"],
  athleticism: ["a freak athlete for his age", "an explosive frame waiting to be harnessed"],
};
function scoutingGrade(overall, potential) {
  const s = potential * 0.7 + overall * 0.3;
  if (s >= 86) return { grade: "A+", label: tr("Talento generazionale", "Generational Talent") };
  if (s >= 82) return { grade: "A", label: tr("Futuro protagonista", "Future Franchise Star") };
  if (s >= 78) return { grade: "B+", label: tr("Prospetto di alto livello", "High-Level Prospect") };
  if (s >= 74) return { grade: "B", label: tr("Buon prospetto", "Solid Prospect") };
  if (s >= 70) return { grade: "C+", label: tr("Da seguire", "Sleeper Prospect") };
  return { grade: "C", label: tr("Scommessa", "Long-Shot Project") };
}
/* p è il giocatore così come partirebbe; roll.scoutErr sposta la stima del potenziale */
function scoutingReportHtml(p, roll) {
  const est = clamp(p.potential + ((roll && roll.scoutErr) || 0), p.overall, 99);
  const lo = clamp(est - 3, p.overall, 99), hi = clamp(est + 3, p.overall, 99);
  const g = scoutingGrade(p.overall, est);
  const sorted = ATTR_KEYS.map(k => [k, p.attrs[k]]).sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, 2), low = sorted[sorted.length - 1];
  const cmpTable = isEn() ? SCOUT_COMPARISONS_EN : SCOUT_COMPARISONS;
  const cmp = cmpTable[top[0][0]][g.grade.startsWith("A") ? 0 : 1];
  const arch = getArchetype(p.role, p.archetypeId);
  const aLbl = k => (typeof attrShortLabel === "function" ? attrShortLabel(k) : ATTR_LABELS[k]).toLowerCase();
  const extras = [
    `${(HANDS.find(h => h.id === p.hand) || HANDS[0]).label}`,
    `${getBodyType(p).label.toLowerCase()}`,
    ...(p.traits || []).map(id => getTrait(id).label.toLowerCase()),
  ];
  return `
    <div class="scout-report">
      <div class="scout-grade grade-${g.grade[0]}">${g.grade}</div>
      <div class="scout-body">
        <div class="scout-title">${g.label}</div>
        <div class="small-muted">${getRoleName(p.role)}${arch ? ` · ${arch.name}` : ""} · ${p.height} cm · ${extras.join(", ")}</div>
        <div class="scout-nums">
          <span><strong>${p.overall}</strong> overall</span>
          <span><strong>${lo === hi ? lo : `${lo}-${hi}`}</strong> ${tr("potenziale stimato", "estimated potential")}</span>
        </div>
        <ul class="scout-notes">
          <li>✅ ${tr("Punti di forza:", "Strengths:")} ${top.map(([k, v]) => `${aLbl(k)} (${v})`).join(", ")}</li>
          <li>⚠️ ${tr("Da migliorare:", "Needs work:")} ${aLbl(low[0])} (${low[1]})</li>
          <li>🔎 ${tr("Il paragone degli scout:", "Scout comparison:")} ${cmp}.</li>
        </ul>
      </div>
    </div>`;
}
