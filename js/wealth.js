"use strict";

/* ================================================================
   PATRIMONIO — ogni estate (con almeno 0.5 M da parte) si può investire una parte dei
   guadagni in preparatori, investimenti o beneficenza. I costi sono proporzionali al
   patrimonio, così la scelta pesa tanto per chi guadagna poco quanto per le superstar.
   ================================================================ */
const SUMMER_SPENDING_MIN_WEALTH = 0.5;
const SUMMER_SPENDING = [
  { id: "coachTech", icon: "🎯", title: "Preparatore tecnico", share: 0.05, min: 0.2,
    desc: "Un'estate con uno shooting coach privato: tiro, finalizzazione e regia migliorano.",
    apply(p) { p.attrs.shooting = clamp(p.attrs.shooting + 2, 30, 99); p.attrs.finishing = clamp(p.attrs.finishing + 1, 30, 99); p.attrs.playmaking = clamp(p.attrs.playmaking + 1, 30, 99); return "Tiro +2 · Finalizzazione +1 · Playmaking +1"; } },
  { id: "coachPhys", icon: "💪", title: "Preparatore atletico", share: 0.05, min: 0.2,
    desc: "Programma personalizzato e fisioterapia: più esplosività e un corpo che regge meglio.",
    apply(p) { p.attrs.athleticism = clamp(p.attrs.athleticism + 2, 30, 99); p.fragility = clamp(p.fragility - 6, 0, 100); p.stamina = clamp(p.stamina + 8, 0, 100); return "Atletismo +2 · Fragilità −6 · Stamina +8"; } },
  { id: "realEstate", icon: "🏠", title: "Investimento immobiliare", share: 0.25, min: 0.1,
    desc: "Compri appartamenti da affittare: rendono il 5% ogni anno, senza sorprese.",
    apply(p, cost) { p.investments.push({ type: "realEstate", amount: cost, year: p.year }); return `${fmtMoney(cost, playerCurrency(p))} investiti: rendono il 5% l'anno`; } },
  { id: "startup", icon: "🚀", title: "Startup di un amico", share: 0.15, min: 0.1,
    desc: "Un'idea brillante e tanto rischio: nel 35% dei casi triplichi, altrimenti perdi quasi tutto. Si saprà a fine stagione.",
    apply(p, cost) { p.investments.push({ type: "startup", amount: cost, year: p.year }); return `${fmtMoney(cost, playerCurrency(p))} puntati sulla startup: esito a fine stagione`; } },
  { id: "charity", icon: "🤲", title: "Fondazione benefica", share: 0.08, min: 0.3,
    desc: "Apri una fondazione nella tua città: la lega e i tifosi apprezzano.",
    apply(p) { changeReputation(p, 4); p.popularity = clamp(p.popularity + 3, 0, 100); p.morale = clamp(p.morale + 2, 0, 100); p.charityYears = (p.charityYears || 0) + 1; return "Reputazione +4 · Popolarità +3 · Morale +2"; } },
];
function summerSpendingCost(p, option) { return round1(Math.max(option.min, p.wealth * option.share)); }

function resolveSummerSpending(optionId) {
  const d = player.pendingDecision;
  if (!d || d.type !== "summerSpending") return;
  const option = SUMMER_SPENDING.find(o => o.id === optionId);
  if (option) {
    const cost = summerSpendingCost(player, option);
    if (cost > player.wealth) { toast("Non hai abbastanza patrimonio per questa scelta."); return; }
    player.investments = player.investments || [];
    player.wealth = round1(player.wealth - cost);
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
    if (inv.type === "startup" && inv.year < p.year) {
      const won = rollChance(35);
      const back = round1(inv.amount * (won ? 3 : 0.2));
      income += back;
      notes.push(won ? `🚀 La startup è esplosa: ${fmtMoney(inv.amount, playerCurrency(p))} diventano ${fmtMoney(back, playerCurrency(p))}!` : `🚀 La startup è fallita: recuperi solo ${fmtMoney(back, playerCurrency(p))}.`);
      return false;
    }
    return true;
  });
  income = round1(income);
  if (income) p.wealth = round1(p.wealth + income);
  notes.forEach(n => pushNews(n));
  return { income, notes };
}
function realEstateTotal(p) { return round1((p.investments || []).filter(i => i.type === "realEstate").reduce((t, i) => t + i.amount, 0)); }
