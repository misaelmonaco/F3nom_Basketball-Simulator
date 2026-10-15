"use strict";

/* ================================================================
   SALA DEI TROFEI — la bacheca disegnata: coppe per i titoli di squadra, medaglie per la
   Nazionale, targhe per i premi individuali, su mensole a fascia; a fine carriera anche le
   maglie ritirate appese al soffitto. Ogni pezzo porta il numero di volte che l'hai vinto.
   ================================================================ */
/* Oro per i titoli e i premi più importanti, argento per gli altri: i colori vengono dai token
   del tema (identità broadcast), così la sala segue anche il tema Day */
const TROPHY_ROOM_ITEMS = [
  { key: "rings", kind: "cup", tone: "gold", label: "Anelli USA-1" },
  { key: "domesticTitles", kind: "cup", tone: "gold", label: "Titoli nazionali" },
  { key: "nationalCups", kind: "cup", tone: "silver", label: "Coppe nazionali" },
  { key: "euroleague", kind: "cup", tone: "gold", label: "EUROPE-1" },
  { key: "eurocup", kind: "cup", tone: "silver", label: "EUROPE-2" },
  { key: "mvp", kind: "plaque", tone: "gold", label: "MVP" },
  { key: "finalsMvp", kind: "plaque", tone: "gold", label: "Finals MVP" },
  { key: "dpoy", kind: "plaque", tone: "silver", label: "Difensore dell'Anno" },
  { key: "bestFive", kind: "plaque", tone: "silver", label: "Miglior Quintetto" },
  { key: "allstar", kind: "star", tone: "gold", label: "All-Star" },
  { key: "roy", kind: "plaque", tone: "silver", label: "Rookie dell'Anno" },
  { key: "bestYoung", kind: "plaque", tone: "silver", label: "Miglior Giovane" },
  { key: "worldCupTitles", kind: "medal", tone: "gold", label: "Mondiali" },
  { key: "eurobasketTitles", kind: "medal", tone: "gold", label: "Europei" },
  { key: "medals", kind: "medal", tone: "silver", label: "Medaglie" },
];
const TROPHY_TONES = { gold: "var(--gold)", silver: "var(--ink-3)" };
const sty = (prop, v) => `style="${prop}:${v}"`;

/* La base inclinata (la fascia del design system) su cui poggia ogni pezzo */
function trophyPlinth(y) {
  return `<path d="M-20 ${y} H26 L22 ${y + 10} H-24 Z" ${sty("fill", "var(--surface-3)")}/>`;
}
function trophyShape(kind, tone, x, y) {
  const c = TROPHY_TONES[tone] || TROPHY_TONES.gold;
  if (kind === "cup") return `
    <g transform="translate(${x},${y})">
      ${trophyPlinth(40)}
      <rect x="-5" y="26" width="10" height="14" ${sty("fill", c)}/>
      <path d="M-18 -6 H18 V6 C18 18 10 25 0 26 C-10 25 -18 18 -18 6 Z" ${sty("fill", c)}/>
      <path d="M-18 -2 C-28 -2 -28 14 -16 16 M18 -2 C28 -2 28 14 16 16" fill="none" stroke-width="3" ${sty("stroke", c)}/>
    </g>`;
  if (kind === "medal") return `
    <g transform="translate(${x},${y})">
      <path d="M-10 -8 L-4 14 H4 L10 -8 Z" ${sty("fill", "var(--live)")}/>
      <circle cx="0" cy="26" r="15" ${sty("fill", c)}/>
      <circle cx="0" cy="26" r="9" fill="none" stroke-width="2" ${sty("stroke", "var(--surface-2)")}/>
    </g>`;
  if (kind === "star") return `
    <g transform="translate(${x},${y})">
      ${trophyPlinth(40)}
      <path d="M0 -8 L7 8 L24 9 L11 20 L15 36 L0 27 L-15 36 L-11 20 L-24 9 L-7 8 Z" ${sty("fill", c)}/>
    </g>`;
  // targa: un pannello inclinato con la stella del premio
  return `
    <g transform="translate(${x},${y})">
      <path d="M-10 -6 H22 L10 50 H-22 Z" ${sty("fill", "var(--surface-3)")}/>
      <path d="M-8 -6 H22 L20.5 1 H-9.5 Z" ${sty("fill", c)}/>
      <path d="M0 12 L3 19 L10 19 L4 24 L6 31 L0 27 L-6 31 L-4 24 L-10 19 L-3 19 Z" ${sty("fill", c)}/>
    </g>`;
}

function renderTrophyRoom(targetId, withJerseys) {
  const box = el(targetId);
  if (!box) return;
  const t = player.trophies;
  const items = TROPHY_ROOM_ITEMS.filter(i => (t[i.key] || 0) > 0);
  const jerseys = withJerseys ? retiredJerseys() : [];
  if (!items.length && !jerseys.length) {
    box.innerHTML = `<p class="small-muted">La sala dei trofei è ancora vuota: le mensole aspettano il primo trofeo.</p>`;
    return;
  }
  const perShelf = 5, W = 600, slot = W / perShelf, shelfH = 110;
  const top = jerseys.length ? 110 : 20;
  const shelves = Math.max(1, Math.ceil(items.length / perShelf));
  const H = top + shelves * shelfH + 10;
  const jerseyArt = jerseys.slice(0, 4).map((j, i) => {
    const x = W / 2 + (i - (Math.min(jerseys.length, 4) - 1) / 2) * 110;
    return `<g transform="translate(${x},14)">
      <line x1="0" y1="-14" x2="0" y2="0" ${sty("stroke", "var(--line-strong)")} />
      <path d="M-28 6 L-14 0 C-8 6 8 6 14 0 L28 6 L22 22 L16 20 L16 78 L-16 78 L-16 20 L-22 22 Z" fill="${j.team.colors[0]}" stroke="${j.team.colors[1]}" stroke-width="2"/>
      <text x="0" y="52" text-anchor="middle" font-size="26" font-weight="900" fill="${j.team.colors[1]}" ${sty("font-family", "var(--font-display)")}>${player.jerseyNumber}</text>
    </g>`;
  }).join("");
  const art = items.map((it, i) => {
    const shelf = Math.floor(i / perShelf), col = i % perShelf;
    const x = slot / 2 + col * slot, y = top + shelf * shelfH + 14;
    const n = t[it.key];
    // il contatore è una fascia inclinata signal con il numero in display
    return `<g><title>${it.label}: ${n}</title>${trophyShape(it.kind, it.tone, x, y)}
      ${n > 1 ? `<g transform="translate(${x + 26},${y - 6})"><path d="M-11 -10 H15 L11 10 H-15 Z" ${sty("fill", "var(--signal)")}/><text y="6" text-anchor="middle" font-size="16" font-weight="900" style="fill:var(--on-signal);font-family:var(--font-display)">${n}</text></g>` : ""}
      <text x="${x}" y="${y + 70}" text-anchor="middle" font-size="11" font-weight="600" letter-spacing="1" style="fill:var(--ink-2);font-family:var(--font-label);text-transform:uppercase">${it.label}</text></g>`;
  }).join("");
  const shelvesArt = Array.from({ length: shelves }, (_, s) => {
    const y = top + s * shelfH + 64;
    return `<rect x="0" y="${y}" width="${W}" height="3" ${sty("fill", "var(--line-strong)")}/>`;
  }).join("");
  box.innerHTML = `
    <svg class="trophy-room" viewBox="0 0 ${W} ${H}" role="img" aria-label="Sala dei trofei: ${items.map(i => `${i.label} ${t[i.key]}`).join(", ")}">
      <rect width="${W}" height="${H}" rx="4" ${sty("fill", "var(--surface-2)")}/>
      ${jerseyArt}${shelvesArt}${art}
    </svg>`;
}
