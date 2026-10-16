"use strict";

/* ================================================================
   SPONSOR CON CONDIZIONI — d'estate, se sei abbastanza popolare, arrivano proposte di
   sponsorizzazione pluriennali. Ognuna paga solo se rispetti la sua condizione: se una
   stagione la manchi, il marchio straccia il contratto. Si aggiungono agli sponsor "di
   base" (sponsorIncome), che seguono la popolarità da soli.
   ================================================================ */
const SPONSOR_BRANDS = ["Vortex Sportswear", "Nova Energy Drink", "Apex Motors", "Skyline Airlines", "Pulse Headphones", "Titan Watches", "Aurora Telecom", "Stride Sneakers", "Blaze Gaming", "Orion Bank"];
const SPONSOR_CONDITIONS = {
  allstar: { label: () => "Essere convocato all'All-Star Game", mult: 1.6, check: rec => (rec.awards || []).some(a => a.startsWith("All-Star")) },
  playoffs: { label: () => "Qualificarsi ai playoff", mult: 1.1, check: rec => !!rec.playoffRounds },
  points: { label: t => `Almeno ${t} punti a partita`, mult: 1.3, check: (rec, t) => rec.pts >= t },
  healthy: { label: () => "Giocare almeno l'80% delle partite", mult: 1, check: rec => rec.gp / Math.max(1, rec.games) >= 0.8 },
  clean: { label: () => "Nessuna uscita polemica con i media", mult: 1, check: (rec, t, p, sp) => (p.polemicCount || 0) === sp.polemicMark },
};
const SPONSOR_MAX_ACTIVE = 2;

function sponsorAmount(p, mult) {
  const salary = (p.contract && p.contract.salaryPerYear) || 0.3;
  return roundMoney(clamp((p.popularity / 100) * (0.2 + salary * 0.2) * mult * (hasTrait(p, "showman") ? 1.15 : 1), 0.05, 6));
}

/* A fine stagione: 3 proposte, se si è abbastanza popolari e c'è posto per un altro marchio */
function maybeSponsorDecision(p, rec, next) {
  p.sponsors = p.sponsors || [];
  if (isMinorItaLeague(p.league) || p.age < 18 || p.popularity < 35 || p.sponsors.length >= SPONSOR_MAX_ACTIVE || !rollChance(45)) return next;
  const used = new Set(p.sponsors.map(s => s.brand));
  const brands = SPONSOR_BRANDS.filter(b => !used.has(b));
  const types = Object.keys(SPONSOR_CONDITIONS).filter(t => t !== "allstar" || p.overall >= LEAGUES[p.league].avgOverall + 8);
  const offers = [];
  while (offers.length < 3 && brands.length && types.length) {
    const brand = brands.splice(randInt(0, brands.length - 1), 1)[0];
    const condition = types.splice(randInt(0, types.length - 1), 1)[0];
    const target = condition === "points" ? Math.max(5, Math.round(rec.pts)) : null;
    offers.push({ brand, condition, target, years: randInt(2, 3), amount: sponsorAmount(p, SPONSOR_CONDITIONS[condition].mult) });
  }
  return offers.length ? { type: "sponsorOffer", offers, next } : next;
}
function sponsorConditionLabel(sp) { return SPONSOR_CONDITIONS[sp.condition].label(sp.target); }

function chooseSponsor(idx) {
  const d = player.pendingDecision;
  if (!d || d.type !== "sponsorOffer") return;
  const offer = d.offers[idx];
  if (offer) {
    player.sponsors = player.sponsors || [];
    player.sponsors.push({ ...offer, polemicMark: player.polemicCount || 0, since: player.year });
    toast(`🤝 Firmato con ${offer.brand}: ${fmtMoney(offer.amount, playerCurrency(player))}/anno per ${offer.years} anni.`);
  }
  player.pendingDecision = d.next;
  renderGameScreen();
}

/* Fine stagione: chi ha rispettato la condizione incassa, gli altri contratti saltano */
function settleSponsors(p, rec) {
  const results = [];
  let income = 0;
  p.sponsors = (p.sponsors || []).filter(sp => {
    const met = SPONSOR_CONDITIONS[sp.condition].check(rec, sp.target, p, sp);
    sp.polemicMark = p.polemicCount || 0;
    if (!met) {
      p.popularity = clamp(p.popularity - 2, 0, 100);
      results.push({ brand: sp.brand, met: false, text: `${sp.brand} straccia il contratto: "${sponsorConditionLabel(sp)}" non rispettato.` });
      return false;
    }
    const pay = roundMoney(sp.amount * getAgent(p).sponsor);
    income += pay;
    sp.years--;
    results.push({ brand: sp.brand, met: true, text: `${sp.brand}: +${fmtMoney(pay, playerCurrency(p))}${sp.years ? "" : " (contratto concluso)"}` });
    return sp.years > 0;
  });
  income = roundMoney(income);
  if (income) p.wealth = roundMoney(p.wealth + income);
  results.filter(r => !r.met).forEach(r => pushNews(`💔 ${r.text}`));
  return { income, results };
}

function renderSponsorOffer(d, titleEl, subEl, cards, extra) {
  const cur = playerCurrency(player);
  titleEl.textContent = "Proposte di sponsorizzazione";
  subEl.textContent = `La tua popolarità (${player.popularity}) attira i marchi. Ogni accordo paga ogni anno solo se rispetti la sua condizione: se la manchi, il contratto salta. Puoi averne al massimo ${SPONSOR_MAX_ACTIVE}.`;
  cards.innerHTML = d.offers.map((o, i) => offCardHtml({
    idx: i, icon: "🤝", title: o.brand, subtitle: `${fmtMoney(o.amount, cur)}/anno · ${o.years} anni`,
    desc: `Condizione: ${sponsorConditionLabel(o)}.`, tags: [{ text: `+${fmtMoney(o.amount * o.years, cur)} in tutto`, tone: "gold" }],
  })).join("");
  cards.querySelectorAll(".off-card").forEach(c => c.addEventListener("click", () => chooseSponsor(parseInt(c.dataset.idx))));
  extra.innerHTML = `<div class="btn-row" style="justify-content:center"><button class="btn btn-ghost" id="btn-no-sponsor">Nessun accordo per ora</button></div>`;
  el("btn-no-sponsor").addEventListener("click", () => chooseSponsor(-1));
}
