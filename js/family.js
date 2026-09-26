"use strict";

/* ================================================================
   VITA PRIVATA — pochi momenti leggeri, d'estate: una persona speciale, il matrimonio,
   i figli. Effetti piccoli su morale, popolarità e ambientamento; il primo figlio è
   quello di cui si potrà giocare la carriera nella dinastia.
   ================================================================ */
function familyOf(p) { return p.family || (p.family = { partner: false, since: null, married: null, children: [] }); }

/* Estate: l'eventuale momento di vita privata (al massimo uno) */
function maybeLifeEvent(p, next) {
  if (p.age < 20) return next;
  const f = familyOf(p);
  if (!f.partner && rollChance(14)) return { type: "lifeEvent", kind: "meet", next };
  if (f.partner && !f.married && p.year - f.since >= 1 && rollChance(30)) return { type: "lifeEvent", kind: "wedding", next };
  if (f.married && f.children.length < 3 && rollChance(22)) {
    const names = [];
    let guard = 0;
    while (names.length < 3 && guard++ < 20) { const n = randomNameFor(p.nationality).first; if (!names.includes(n)) names.push(n); }
    return { type: "lifeEvent", kind: "child", names, next };
  }
  return next;
}

function weddingCost(p, big) { return roundMoney(Math.max(big ? 0.1 : 0.02, p.wealth * (big ? 0.05 : 0.01))); }

function resolveLifeEvent(choiceId) {
  const d = player.pendingDecision;
  if (!d || d.type !== "lifeEvent") return;
  const f = familyOf(player);
  if (d.kind === "meet" && choiceId === "yes") {
    f.partner = true; f.since = player.year;
    player.morale = clamp(player.morale + 5, 0, 100);
    pushNews("💞 Una persona speciale entra nella tua vita.");
  } else if (d.kind === "wedding" && choiceId !== "wait") {
    const big = choiceId === "big";
    const cost = weddingCost(player, big);
    player.wealth = roundMoney(Math.max(0, player.wealth - cost));
    f.married = player.year;
    player.morale = clamp(player.morale + 8, 0, 100);
    if (big) player.popularity = clamp(player.popularity + 5, 0, 100);
    pushNews(big ? "💍 Matrimonio da copertina: la festa finisce su tutte le riviste." : "💍 Vi sposate con una cerimonia intima, lontano dai riflettori.");
  } else if (d.kind === "child") {
    const name = d.names.includes(choiceId) ? choiceId : d.names[0];
    f.children.push({ name, year: player.year });
    player.morale = clamp(player.morale + 8, 0, 100);
    pushNews(`👶 È nato ${name}: benvenuto in famiglia!`);
  }
  player.pendingDecision = d.next;
  renderGameScreen();
}

function renderLifeEvent(d, titleEl, subEl, cards) {
  const cur = playerCurrency(player);
  if (d.kind === "meet") {
    titleEl.textContent = "Una persona speciale";
    subEl.textContent = "A una cena di beneficenza conosci qualcuno con cui parli per ore, e di basket quasi per niente.";
    cards.innerHTML =
      offCardHtml({ idx: 0, icon: "💞", iconTone: "var(--accent-2)", title: "Vivi la storia", subtitle: "Morale +5", desc: "La vita non è solo palestra e trasferte." }) +
      offCardHtml({ idx: 1, icon: "🏀", title: "Resta concentrato", subtitle: "Nessun effetto", desc: "Adesso conta solo la carriera." });
    cards.querySelector('[data-idx="0"]').addEventListener("click", () => resolveLifeEvent("yes"));
    cards.querySelector('[data-idx="1"]').addEventListener("click", () => resolveLifeEvent("no"));
    return;
  }
  if (d.kind === "wedding") {
    titleEl.textContent = "È il momento giusto?";
    subEl.textContent = "State insieme da un po' e l'estate è lunga: potrebbe essere l'occasione per sposarvi.";
    cards.innerHTML =
      offCardHtml({ idx: 0, icon: "🎉", iconTone: "var(--accent-2)", title: "Grande festa", subtitle: `Costo ${fmtMoney(weddingCost(player, true), cur)}`, desc: "Morale +8, popolarità +5: ne parleranno tutti." }) +
      offCardHtml({ idx: 1, icon: "💍", title: "Cerimonia intima", subtitle: `Costo ${fmtMoney(weddingCost(player, false), cur)}`, desc: "Morale +8, pochi invitati e niente fotografi." }) +
      offCardHtml({ idx: 2, icon: "⏳", title: "Non ancora", subtitle: "Nessun effetto", desc: "Ne riparlerete più avanti." });
    ["big", "small", "wait"].forEach((id, i) => cards.querySelector(`[data-idx="${i}"]`).addEventListener("click", () => resolveLifeEvent(id)));
    return;
  }
  titleEl.textContent = "Diventi genitore!";
  subEl.textContent = "La famiglia si allarga. Come lo chiamerete? Un giorno potresti giocare la sua carriera.";
  cards.innerHTML = d.names.map((n, i) => offCardHtml({ idx: i, icon: "👶", title: n, subtitle: "Morale +8" })).join("");
  cards.querySelectorAll(".off-card").forEach(c => c.addEventListener("click", () => resolveLifeEvent(d.names[parseInt(c.dataset.idx)])));
}

function familyText(p) {
  const f = p.family;
  if (!f || (!f.partner && !f.children.length)) return "";
  const parts = [f.married ? `Sposato dal ${f.married}` : f.partner ? "Fidanzato" : ""];
  if (f.children.length) parts.push(`${f.children.length} ${f.children.length === 1 ? "figlio" : "figli"}: ${f.children.map(c => c.name).join(", ")}`);
  return parts.filter(Boolean).join(" · ");
}
