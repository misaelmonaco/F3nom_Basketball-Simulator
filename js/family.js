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
    pushNews(tr("💞 Una persona speciale entra nella tua vita.", "💞 Someone special enters your life."));
  } else if (d.kind === "wedding" && choiceId !== "wait") {
    const big = choiceId === "big";
    const cost = weddingCost(player, big);
    player.wealth = roundMoney(Math.max(0, player.wealth - cost));
    f.married = player.year;
    player.morale = clamp(player.morale + 8, 0, 100);
    if (big) player.popularity = clamp(player.popularity + 5, 0, 100);
    pushNews(big
      ? tr("💍 Matrimonio da copertina: la festa finisce su tutte le riviste.", "💍 Star-studded wedding: the celebration makes every magazine cover.")
      : tr("💍 Vi sposate con una cerimonia intima, lontano dai riflettori.", "💍 You get married in an intimate ceremony, away from the spotlight."));
  } else if (d.kind === "child") {
    const name = d.names.includes(choiceId) ? choiceId : d.names[0];
    f.children.push({ name, year: player.year });
    player.morale = clamp(player.morale + 8, 0, 100);
    pushNews(tr(`👶 È nato ${name}: benvenuto in famiglia!`, `👶 ${name} is born: welcome to the family!`));
  }
  player.pendingDecision = d.next;
  renderGameScreen();
}

function renderLifeEvent(d, titleEl, subEl, cards) {
  const cur = playerCurrency(player);
  if (d.kind === "meet") {
    titleEl.textContent = tr("Una persona speciale", "Someone Special");
    subEl.textContent = tr("A una cena di beneficenza conosci qualcuno con cui parli per ore, e di basket quasi per niente.", "At a charity dinner you meet someone you talk with for hours, barely mentioning basketball at all.");
    cards.innerHTML =
      offCardHtml({ idx: 0, icon: "💞", iconTone: "var(--accent-2)", title: tr("Vivi la storia", "Start Dating"), subtitle: tr("Morale +5", "Morale +5"), desc: tr("La vita non è solo palestra e trasferte.", "Life isn't just gym sessions and road trips.") }) +
      offCardHtml({ idx: 1, icon: "🏀", title: tr("Resta concentrato", "Stay Focused"), subtitle: tr("Nessun effetto", "No effect"), desc: tr("Adesso conta solo la carriera.", "Right now, only your career matters.") });
    cards.querySelector('[data-idx="0"]').addEventListener("click", () => resolveLifeEvent("yes"));
    cards.querySelector('[data-idx="1"]').addEventListener("click", () => resolveLifeEvent("no"));
    return;
  }
  if (d.kind === "wedding") {
    titleEl.textContent = tr("È il momento giusto?", "Is It the Right Time?");
    subEl.textContent = tr("State insieme da un po' e l'estate è lunga: potrebbe essere l'occasione per sposarvi.", "You've been together for a while and the summer is long: it could be the right moment to get married.");
    cards.innerHTML =
      offCardHtml({ idx: 0, icon: "🎉", iconTone: "var(--accent-2)", title: tr("Grande festa", "Grand Celebration"), subtitle: tr(`Costo ${fmtMoney(weddingCost(player, true), cur)}`, `Cost ${fmtMoney(weddingCost(player, true), cur)}`), desc: tr("Morale +8, popolarità +5: ne parleranno tutti.", "Morale +8, popularity +5: everyone will be talking about it.") }) +
      offCardHtml({ idx: 1, icon: "💍", title: tr("Cerimonia intima", "Intimate Ceremony"), subtitle: tr(`Costo ${fmtMoney(weddingCost(player, false), cur)}`, `Cost ${fmtMoney(weddingCost(player, false), cur)}`), desc: tr("Morale +8, pochi invitati e niente fotografi.", "Morale +8, close friends only and no photographers.") }) +
      offCardHtml({ idx: 2, icon: "⏳", title: tr("Non ancora", "Not Yet"), subtitle: tr("Nessun effetto", "No effect"), desc: tr("Ne riparlerete più avanti.", "You'll talk about it again later.") });
    ["big", "small", "wait"].forEach((id, i) => cards.querySelector(`[data-idx="${i}"]`).addEventListener("click", () => resolveLifeEvent(id)));
    return;
  }
  titleEl.textContent = tr("Diventi genitore!", "You Become a Parent!");
  subEl.textContent = tr("La famiglia si allarga. Come lo chiamerete? Un giorno potresti giocare la sua carriera.", "The family is growing. What will you name the baby? One day you might play their career.");
  cards.innerHTML = d.names.map((n, i) => offCardHtml({ idx: i, icon: "👶", title: n, subtitle: tr("Morale +8", "Morale +8") })).join("");
  cards.querySelectorAll(".off-card").forEach(c => c.addEventListener("click", () => resolveLifeEvent(d.names[parseInt(c.dataset.idx)])));
}

function familyText(p) {
  const f = p.family;
  if (!f || (!f.partner && !f.children.length)) return "";
  const parts = [f.married ? tr(`Sposato dal ${f.married}`, `Married since ${f.married}`) : f.partner ? tr("Fidanzato", "In a relationship") : ""];
  if (f.children.length) parts.push(tr(`${f.children.length} ${f.children.length === 1 ? "figlio" : "figli"}: ${f.children.map(c => c.name).join(", ")}`, `${f.children.length} ${f.children.length === 1 ? "child" : "children"}: ${f.children.map(c => c.name).join(", ")}`));
  return parts.filter(Boolean).join(" · ");
}
