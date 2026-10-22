"use strict";

/* ================================================================
   IDENTITÀ BROADCAST — le parti dell'interfaccia che il design system
   chiede di disegnare in modo diverso da prima:
   - niente emoji nell'interfaccia: i testi del gioco le hanno ancora (notizie,
     storico, salvataggi), qui vengono tolte mentre la pagina si disegna;
   - le notizie usano i marcatori ● + − · (NewsFeed);
   - le stelle diventano pip dorati, le offerte hanno la fascia nei colori del club
     (OfferCard) e le richieste in trattativa la barra di probabilità (AskRow).
   ================================================================ */
const EMOJI_RE = /(?:\p{Extended_Pictographic}|\p{Regional_Indicator}|[\u{1F3FB}-\u{1F3FF}]|️|‍|⃣)+/gu;
const EMOJI_TEST = /\p{Extended_Pictographic}|\p{Regional_Indicator}/u;

function stripEmoji(text) {
  if (!text || !EMOJI_TEST.test(text)) return text;
  return text.replace(EMOJI_RE, "").replace(/[ \t]{2,}/g, " ").replace(/^[ \t]+/, "");
}
/* Toglie le emoji dai nodi di testo sotto root (non dagli avatar SVG né dai campi di testo) */
function stripUiEmoji(root) {
  if (!root || typeof document.createTreeWalker !== "function") return;
  if (root.nodeType === 3) { if (EMOJI_TEST.test(root.nodeValue)) root.nodeValue = stripEmoji(root.nodeValue); return; }
  if (root.nodeType !== 1 || root.closest && root.closest("svg, script, style, textarea, [data-keep-emoji]")) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: n => (n.parentElement && n.parentElement.closest("svg, script, style, textarea, [data-keep-emoji]")) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
  });
  const nodes = [];
  while (walker.nextNode()) if (EMOJI_TEST.test(walker.currentNode.nodeValue)) nodes.push(walker.currentNode);
  nodes.forEach(n => { n.nodeValue = stripEmoji(n.nodeValue); });
  // il titolo al passaggio del mouse può restare: è un aiuto, non interfaccia visibile
}
/* Osserva la pagina: ogni pezzo aggiunto o cambiato viene ripulito */
function initBroadcastUi() {
  if (typeof MutationObserver !== "function" || !document.body) return;
  stripUiEmoji(document.body);
  const obs = new MutationObserver(list => {
    list.forEach(m => {
      if (m.type === "characterData") stripUiEmoji(m.target);
      else m.addedNodes.forEach(n => stripUiEmoji(n));
    });
  });
  obs.observe(document.body, { childList: true, subtree: true, characterData: true });
}

/* ---------- NewsFeed: il marcatore al posto dell'emoji iniziale ---------- */
const NEWS_MARKERS = [
  { cls: "m-down", mark: "−", re: /^(?:❌|🚪|📉|🩹|🏥|💔|😤|⚠️|💸|🙅|⛔|😞|🥶|🤕)/u },
  { cls: "m-up", mark: "+", re: /^(?:📈|✅|💰|🏠|🌟|🎓|🏅|🥇|🥈|🥉|🏆|💍|⭐|🎖️|🤝|🎉|💎|📣|🌠|💪|🔥)/u },
  { cls: "m-signal", mark: "●", re: /^(?:✍️|🏀|🔁|🆓|✈️|📞|📋|💼|🎯|👋)/u },
];
function newsMarker(text) {
  const t = (text || "").trim();
  const m = NEWS_MARKERS.find(x => x.re.test(t));
  return m || { cls: "m-faint", mark: "·" };
}

/* ---------- pip ---------- */
function pipsHtml(n, max, tone) {
  let out = "";
  for (let i = 0; i < max; i++) out += `<i class="co-pip ${i < n ? "co-pip--on" : ""}"></i>`;
  return `<span class="co-pips ${tone === "signal" ? "co-pips--signal" : ""}" role="img" aria-label="${tr(`${n} su ${max}`, `${n} of ${max}`)}">${out}</span>`;
}
/* Forza della squadra in pip: da titleChanceInfo (1-4 stelle) */
function teamStrengthPips(ts, leagueId) {
  const t = titleChanceInfo(ts, leagueId);
  return { n: (t.stars.match(/⭐/gu) || []).length, label: t.label };
}

/* ---------- OfferCard ---------- */
/* Colore dell'iniziale sulla fascia: bianco o quasi-nero, quello che si legge sul colore del club */
function teamInk(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return "#ffffff";
  const v = parseInt(m[1], 16), r = (v >> 16) & 255, g = (v >> 8) & 255, b = v & 255;
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum > 0.55 ? "#0a0c0f" : "#ffffff";
}
function teamVars(team) {
  const c = (team && team.colors) || ["#262b34", "#f4f2ed"];
  return `--team:${c[0]};--team-2:${c[1]};--team-ink:${teamInk(c[0])}`;
}
/* Un'offerta del mercato. o: l'offerta; opts: idx (cliccabile), primary (la più forte), staticCard, body (html al posto della scheda) */
function offerCardHtml(o, opts) {
  opts = opts || {};
  const cp = o.contractProposal;
  const pip = teamStrengthPips(cp.teamStrength, o.targetLeague);
  const current = o.id === "renew" || o.id === "extension";
  const clickable = opts.idx != null && !opts.staticCard;
  return `
    <article class="off-card co-offer ${current ? "co-offer--current" : ""} ${o.flash ? "co-offer--flash" : ""} ${o.probed ? "co-offer--probed" : ""} ${opts.staticCard ? "static" : ""}" style="${teamVars(o.team)}"
      ${opts.idx != null ? `data-idx="${opts.idx}"` : ""} ${clickable ? 'role="button" tabindex="0"' : ""}>
      ${o.flash ? `<div class="co-offer__flash">${tr("Offerta lampo", "Flash Offer")}${opts.flashTicks != null ? tr(` · scade tra ${opts.flashTicks} ${opts.flashTicks === 1 ? "mossa" : "mosse"}`, ` · expires in ${opts.flashTicks} ${opts.flashTicks === 1 ? "move" : "moves"}`) : tr(" · vuole una risposta subito", " · wants an immediate answer")}</div>` : ""}
      ${o.probed ? `<div class="co-offer__probed-tag">🎯 ${tr(`Trattativa richiesta ${typeof player !== "undefined" && player && player.agent === "none" ? "di persona" : "dall'agente"}`, `Talks requested ${typeof player !== "undefined" && player && player.agent === "none" ? "in person" : "by your agent"}`)}</div>` : ""}
      <div class="co-offer__band" aria-hidden="true"><span class="co-offer__mono">${(o.team.name[0] || "?").toUpperCase()}</span></div>
      <div class="co-offer__body">
        <div><h3 class="off-card-title">${o.team.name}</h3>
          <div class="off-card-subtitle">${o.team.city} · ${LEAGUES[o.targetLeague].name}${current ? ` · <span class="co-signal">${o.id === "renew" ? tr("Rinnovo", "Re-sign") : tr("Estensione", "Extension")}</span>` : ""}</div></div>
        ${opts.body != null ? opts.body : `<dl class="off-card-details">${offerDetailsRows(o).map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>`}
        <div class="co-offer__foot">
          <span class="co-row">${pipsHtml(pip.n, 4)}<span class="co-offer__rating ${pip.n >= 4 ? "is-fav" : ""}">${pip.label}</span></span>
          ${clickable ? `<span class="btn btn-sm ${opts.primary ? "btn-primary" : ""}">${tr("Tratta", "Negotiate")}</span>` : ""}
        </div>
      </div>
    </article>`;
}

/* ---------- AskRow: una richiesta in trattativa con la sua probabilità ---------- */
function askRowHtml({ id, attr, label, meta, chance, disabled, title, cls, status }) {
  const pct = chance == null || disabled ? null : Math.round(chance * 100);
  return `<button type="button" class="co-ask ${cls || ""}" ${attr || ""} ${disabled ? 'aria-disabled="true" disabled' : ""} ${id ? `id="${id}"` : ""} ${title ? `title="${title}"` : ""}>
    <span><span class="co-ask__t">${label}</span>${meta ? `<span class="co-ask__m">${meta}</span>` : ""}</span>
    <span class="co-ask__odds" aria-hidden="true"><i style="width:${pct || 0}%"></i></span>
    <span class="co-ask__p">${status ? `<span class="co-ask__status">${status}</span>` : pct == null ? "—" : `${pct}%`}</span>
  </button>`;
}
