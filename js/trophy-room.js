"use strict";

/* ================================================================
   SALA DEI TROFEI — la bacheca disegnata: coppe per i titoli di squadra, medaglie per la
   Nazionale, targhe per i premi individuali, su mensole di legno; a fine carriera anche le
   maglie ritirate appese al soffitto. Ogni pezzo porta il numero di volte che l'hai vinto.
   ================================================================ */
const TROPHY_ROOM_ITEMS = [
  { key: "rings", kind: "cup", color: "#ffd447", label: "Anelli NBA" },
  { key: "domesticTitles", kind: "cup", color: "#e8c35a", label: "Titoli nazionali" },
  { key: "euroleague", kind: "cup", color: "#c9d6e3", label: "EuroLeague" },
  { key: "eurocup", kind: "cup", color: "#b7c2cc", label: "EuroCup" },
  { key: "mvp", kind: "plaque", color: "#ffd447", label: "MVP" },
  { key: "finalsMvp", kind: "plaque", color: "#ff9f43", label: "Finals MVP" },
  { key: "dpoy", kind: "plaque", color: "#3d8bfd", label: "Difensore dell'Anno" },
  { key: "bestFive", kind: "plaque", color: "#a06bff", label: "Miglior Quintetto" },
  { key: "allstar", kind: "star", color: "#ffd447", label: "All-Star" },
  { key: "roy", kind: "plaque", color: "#35c47a", label: "Rookie dell'Anno" },
  { key: "bestYoung", kind: "plaque", color: "#7de3ab", label: "Miglior Giovane" },
  { key: "worldCupTitles", kind: "medal", color: "#ffd447", label: "Mondiali" },
  { key: "eurobasketTitles", kind: "medal", color: "#ffd447", label: "Europei" },
  { key: "medals", kind: "medal", color: "#c0c0c0", label: "Medaglie" },
];

function trophyShape(kind, color, x, y) {
  if (kind === "cup") return `
    <g transform="translate(${x},${y})">
      <rect x="-16" y="40" width="32" height="8" rx="2" fill="#6b4a1e"/>
      <rect x="-5" y="26" width="10" height="15" fill="${color}"/>
      <path d="M-18 -6 H18 V6 C18 18 10 25 0 26 C-10 25 -18 18 -18 6 Z" fill="${color}" stroke="rgba(0,0,0,.25)"/>
      <path d="M-18 -2 C-28 -2 -28 14 -16 16 M18 -2 C28 -2 28 14 16 16" fill="none" stroke="${color}" stroke-width="3"/>
      <ellipse cx="-8" cy="4" rx="3" ry="7" fill="#fff" opacity=".35"/>
    </g>`;
  if (kind === "medal") return `
    <g transform="translate(${x},${y})">
      <path d="M-10 -8 L-4 14 H4 L10 -8 Z" fill="#3d8bfd"/>
      <circle cx="0" cy="26" r="15" fill="${color}" stroke="rgba(0,0,0,.25)"/>
      <circle cx="0" cy="26" r="9" fill="none" stroke="rgba(0,0,0,.2)" stroke-width="2"/>
    </g>`;
  if (kind === "star") return `
    <g transform="translate(${x},${y + 12})">
      <rect x="-14" y="28" width="28" height="8" rx="2" fill="#6b4a1e"/>
      <path d="M0 -14 L7 2 L24 3 L11 14 L15 30 L0 21 L-15 30 L-11 14 L-24 3 L-7 2 Z" fill="${color}" stroke="rgba(0,0,0,.25)"/>
    </g>`;
  return `
    <g transform="translate(${x},${y})">
      <rect x="-18" y="-6" width="36" height="46" rx="4" fill="#5a3d17"/>
      <rect x="-13" y="0" width="26" height="34" rx="2" fill="${color}"/>
      <path d="M0 6 L3 13 L10 13 L4 18 L6 25 L0 21 L-6 25 L-4 18 L-10 13 L-3 13 Z" fill="rgba(0,0,0,.3)"/>
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
      <line x1="0" y1="-14" x2="0" y2="0" stroke="#555" />
      <path d="M-28 6 L-14 0 C-8 6 8 6 14 0 L28 6 L22 22 L16 20 L16 78 L-16 78 L-16 20 L-22 22 Z" fill="${j.team.colors[0]}" stroke="${j.team.colors[1]}" stroke-width="2"/>
      <text x="0" y="52" text-anchor="middle" font-size="24" font-weight="900" fill="${j.team.colors[1]}">${player.jerseyNumber}</text>
    </g>`;
  }).join("");
  const art = items.map((it, i) => {
    const shelf = Math.floor(i / perShelf), col = i % perShelf;
    const x = slot / 2 + col * slot, y = top + shelf * shelfH + 14;
    const n = t[it.key];
    return `<g><title>${it.label}: ${n}</title>${trophyShape(it.kind, it.color, x, y)}
      ${n > 1 ? `<g transform="translate(${x + 22},${y - 4})"><circle r="11" fill="#ff7a1a"/><text y="4" text-anchor="middle" font-size="12" font-weight="800" fill="#1a0e00">${n}</text></g>` : ""}
      <text x="${x}" y="${y + 70}" text-anchor="middle" font-size="11" style="fill:var(--text-1)">${it.label}</text></g>`;
  }).join("");
  const shelvesArt = Array.from({ length: shelves }, (_, s) => {
    const y = top + s * shelfH + 64;
    return `<rect x="8" y="${y}" width="${W - 16}" height="9" rx="2" fill="#7a5426"/><rect x="8" y="${y + 9}" width="${W - 16}" height="4" fill="#4a3216"/>`;
  }).join("");
  box.innerHTML = `
    <svg class="trophy-room" viewBox="0 0 ${W} ${H}" role="img" aria-label="Sala dei trofei: ${items.map(i => `${i.label} ${t[i.key]}`).join(", ")}">
      <defs><linearGradient id="roomWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--bg-3)"/><stop offset="1" style="stop-color:var(--bg-1)"/></linearGradient></defs>
      <rect width="${W}" height="${H}" rx="12" fill="url(#roomWall)"/>
      ${jerseyArt}${shelvesArt}${art}
    </svg>`;
}
