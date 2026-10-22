"use strict";

/* ================================================================
   PATRIMONIO — ogni estate (con almeno 0.5 M da parte) si può investire una parte dei
   guadagni in preparatori, investimenti o beneficenza. I costi sono proporzionali al
   patrimonio, così la scelta pesa tanto per chi guadagna poco quanto per le superstar.
   ================================================================ */
const SUMMER_SPENDING_MIN_WEALTH = 0.5;
const SUMMER_SPENDING = i18nify([
  { id: "coachTech", icon: "🎯", title: "Preparatore tecnico", titleEn: "Skills Coach", share: 0.05, min: 0.2,
    desc: "Un'estate con uno shooting coach privato: tiro, finalizzazione e regia migliorano.",
    descEn: "A summer with a private shooting coach: shooting, finishing, and playmaking improve.",
    apply(p) { p.attrs.shooting = clamp(p.attrs.shooting + 2, 30, 99); p.attrs.finishing = clamp(p.attrs.finishing + 1, 30, 99); p.attrs.playmaking = clamp(p.attrs.playmaking + 1, 30, 99); return tr("Tiro +2 · Finalizzazione +1 · Playmaking +1", "Shooting +2 · Finishing +1 · Playmaking +1"); } },
  { id: "coachPhys", icon: "💪", title: "Preparatore atletico", titleEn: "Athletic Trainer", share: 0.05, min: 0.2,
    desc: "Programma personalizzato e fisioterapia: più esplosività e un corpo che regge meglio.",
    descEn: "Custom conditioning and physical therapy: more explosiveness and a more durable body.",
    apply(p) { p.attrs.athleticism = clamp(p.attrs.athleticism + 2, 30, 99); p.fragility = clamp(p.fragility - 6, 0, 100); p.stamina = clamp(p.stamina + 8, 0, 100); return tr("Atletismo +2 · Fragilità −6 · Stamina +8", "Athleticism +2 · Fragility −6 · Stamina +8"); } },
  { id: "realEstate", icon: "🏠", title: "Investimento immobiliare", titleEn: "Real Estate Investment", share: 0.25, min: 0.1,
    desc: "Compri appartamenti da affittare: rendono il 5% ogni anno, senza sorprese.",
    descEn: "Buy rental properties: they yield a steady 5% every year, with no surprises.",
    apply(p, cost) { p.investments.push({ type: "realEstate", amount: cost, year: p.year }); return tr(`${fmtMoney(cost, playerCurrency(p))} investiti: rendono il 5% l'anno`, `${fmtMoney(cost, playerCurrency(p))} invested: yields 5% per year`); } },
  { id: "startup", icon: "🚀", title: "Startup di un amico", titleEn: "Friend's Startup", share: 0.15, min: 0.1,
    desc: "Un'idea brillante e tanto rischio: nel 35% dei casi triplichi, altrimenti perdi quasi tutto. Si saprà a fine stagione.",
    descEn: "A bold idea with high risk: 35% chance to triple your money, otherwise you lose almost everything. Results at season's end.",
    apply(p, cost) { p.investments.push({ type: "startup", amount: cost, year: p.year }); return tr(`${fmtMoney(cost, playerCurrency(p))} puntati sulla startup: esito a fine stagione`, `${fmtMoney(cost, playerCurrency(p))} backed into startup: outcome at season's end`); } },
  { id: "charity", icon: "🤲", title: "Fondazione benefica", titleEn: "Charitable Foundation", share: 0.08, min: 0.3,
    desc: "Apri una fondazione nella tua città: la lega e i tifosi apprezzano.",
    descEn: "Launch a foundation in your hometown: the league and fans respect the gesture.",
    apply(p) { changeReputation(p, 4); p.popularity = clamp(p.popularity + 3, 0, 100); p.morale = clamp(p.morale + 2, 0, 100); p.charityYears = (p.charityYears || 0) + 1; return tr("Reputazione +4 · Popolarità +3 · Morale +2", "Reputation +4 · Popularity +3 · Morale +2"); } },
]);
function summerSpendingCost(p, option) { return roundMoney(Math.max(option.min, p.wealth * option.share)); }

function resolveSummerSpending(optionId) {
  const d = player.pendingDecision;
  if (!d || d.type !== "summerSpending") return;
  const option = SUMMER_SPENDING.find(o => o.id === optionId);
  if (option) {
    const cost = summerSpendingCost(player, option);
    if (cost > player.wealth) { toast(tr("Non hai abbastanza patrimonio per questa scelta.", "You don't have enough net worth for this option.")); return; }
    player.investments = player.investments || [];
    player.wealth = roundMoney(player.wealth - cost);
    const result = option.apply(player, cost);
    toast(`${option.icon} ${option.title}: ${result}.`);
  }
  player.pendingDecision = d.next;
  renderGameScreen();
}

/* Fine stagione: rendite degli immobili ed esito delle startup */
function settleInvestments(p) {
  const notes = [];
  let income = 0;
  p.investments = (p.investments || []).filter(inv => {
    if (inv.type === "realEstate") { income += inv.amount * 0.05; return true; }
    if (inv.type === "art") { inv.amount = roundMoney(inv.amount * 1.04); return true; } // l'arte si rivaluta
    if (inv.type === "startup" && inv.year < p.year) {
      const won = rollChance(35);
      const back = roundMoney(inv.amount * (won ? 3 : 0.2));
      income += back;
      notes.push(won ? tr(`🚀 La startup è esplosa: ${fmtMoney(inv.amount, playerCurrency(p))} diventano ${fmtMoney(back, playerCurrency(p))}!`, `🚀 The startup took off: ${fmtMoney(inv.amount, playerCurrency(p))} turned into ${fmtMoney(back, playerCurrency(p))}!`) : tr(`🚀 La startup è fallita: recuperi solo ${fmtMoney(back, playerCurrency(p))}.`, `🚀 The startup failed: you only recover ${fmtMoney(back, playerCurrency(p))}.`));
      return false;
    }
    return true;
  });
  income = roundMoney(income);
  if (income) p.wealth = roundMoney(p.wealth + income);
  notes.forEach(n => pushNews(n));
  return { income, notes };
}
function realEstateTotal(p) { return roundMoney((p.investments || []).filter(i => i.type === "realEstate").reduce((t, i) => t + i.amount, 0)); }
