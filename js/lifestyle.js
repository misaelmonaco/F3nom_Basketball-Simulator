"use strict";

/* ================================================================
   LIFESTYLE — accanto agli investimenti dell'estate si possono comprare auto, case,
   viaggi, libri e altri sfizi. Prezzi fissi (in milioni), quasi tutti si comprano una
   volta sola e restano nella scheda del giocatore; alcuni hanno un effetto che dura
   (lo chef privato costa ogni anno, l'arte si rivaluta).
   ================================================================ */
const LIFESTYLE_ITEMS = [
  { id: "books", icon: "📚", title: "Biblioteca personale", price: 0.02, desc: "Biografie di campioni, tattica, romanzi: la testa si allena come le gambe.",
    effects: { morale: 3, reputation: 1 } },
  { id: "trip", icon: "✈️", title: "Viaggio intorno al mondo", price: 0.1, repeatable: true, desc: "Un mese lontano da tutto: torni carico e riposato. Si può rifare ogni estate.",
    effects: { morale: 8, stamina: 10 } },
  { id: "car", icon: "🚗", title: "Auto sportiva", price: 0.15, desc: "Il primo sfizio vero: i tifosi la riconoscono sotto il palazzetto.",
    effects: { popularity: 3, morale: 2 } },
  { id: "chef", icon: "👨‍🍳", title: "Chef privato", price: 0.2, upkeep: 0.2, desc: "Dieta su misura tutto l'anno: fragilità −3 a ogni stagione, ma costa 0.2 M l'anno.",
    effects: { fragility: -3 } },
  { id: "watches", icon: "⌚", title: "Collezione di orologi", price: 0.3, desc: "Pezzi rari che finiscono su ogni rivista di moda.",
    effects: { popularity: 3 } },
  { id: "supercar", icon: "🏎️", title: "Supercar", price: 0.8, desc: "Dodici cilindri e tanti flash: popolarità alle stelle.",
    effects: { popularity: 6, morale: 3 } },
  { id: "art", icon: "🎨", title: "Collezione d'arte", price: 1, desc: "Quadri di artisti emergenti: si rivalutano del 4% ogni anno e restano nel patrimonio.",
    effects: { reputation: 1 }, investment: true },
  { id: "villa", icon: "🏡", title: "Villa con piscina", price: 2.5, desc: "Casa grande, palestra privata e silenzio: morale e recupero ne guadagnano.",
    effects: { morale: 6, stamina: 6 } },
  { id: "yacht", icon: "🛥️", title: "Yacht", price: 6, desc: "Estati in mare aperto e foto su tutti i social.",
    effects: { popularity: 8, morale: 5 } },
];
function getLifestyleItem(id) { return LIFESTYLE_ITEMS.find(i => i.id === id) || null; }
function ownsLifestyle(p, id) { return (p.lifestyle || []).some(o => o.id === id); }
function canBuyLifestyle(p, item) { return p.wealth >= item.price && (item.repeatable || !ownsLifestyle(p, item.id)); }

function buyLifestyle(id) {
  const d = player.pendingDecision;
  const item = getLifestyleItem(id);
  if (!d || d.type !== "summerSpending" || !item || !canBuyLifestyle(player, item)) return;
  player.lifestyle = player.lifestyle || [];
  player.wealth = round1(player.wealth - item.price);
  const e = item.effects;
  if (e.morale) player.morale = clamp(player.morale + e.morale, 0, 100);
  if (e.popularity) player.popularity = clamp(player.popularity + e.popularity, 0, 100);
  if (e.stamina) player.stamina = clamp(player.stamina + e.stamina, 0, 100);
  if (e.fragility) player.fragility = clamp(player.fragility + e.fragility, 0, 100);
  if (e.reputation) changeReputation(player, e.reputation);
  if (item.investment) player.investments.push({ type: "art", amount: item.price, year: player.year });
  if (!item.repeatable) player.lifestyle.push({ id: item.id, year: player.year });
  else player.tripCount = (player.tripCount || 0) + 1;
  toast(`${item.icon} ${item.title}: fatto!`);
  checkAchievements(player);
  renderGameScreen();
}

/* Fine stagione: lo chef si paga, e la sua dieta si sente */
function settleLifestyle(p) {
  if (!ownsLifestyle(p, "chef")) return 0;
  const chef = getLifestyleItem("chef");
  p.wealth = round1(Math.max(0, p.wealth - chef.upkeep));
  p.fragility = clamp(p.fragility + chef.effects.fragility, 0, 100);
  return chef.upkeep;
}

function lifestyleShopHtml(p) {
  const cur = playerCurrency(p);
  const effectsText = e => Object.entries(e).map(([k, v]) => `${{ morale: "morale", popularity: "popolarità", stamina: "stamina", fragility: "fragilità", reputation: "reputazione" }[k]} ${v > 0 ? "+" : ""}${v}`).join(" · ");
  return `
    <div class="recap-section lifestyle-shop">
      <div class="recap-h">Lifestyle · patrimonio ${fmtMoney(p.wealth, cur)}</div>
      <p class="small-muted" style="margin-bottom:8px">Puoi comprare quanto vuoi, finché hai soldi: non conta come la scelta d'investimento dell'estate.</p>
      <div class="ls-grid">
        ${LIFESTYLE_ITEMS.map(item => {
          const owned = !item.repeatable && ownsLifestyle(p, item.id);
          const can = canBuyLifestyle(p, item);
          return `
          <div class="ls-item ${owned ? "owned" : ""}">
            <div class="ls-icon">${item.icon}</div>
            <div class="ls-body">
              <div class="ls-title">${item.title}</div>
              <div class="ls-desc">${item.desc}</div>
              <div class="ls-fx">${effectsText(item.effects)}</div>
            </div>
            <button class="btn ${owned ? "btn-ghost" : "btn-secondary"} btn-sm" data-buy="${item.id}" ${can ? "" : "disabled"}>${owned ? "Tuo" : fmtMoney(item.price, cur)}</button>
          </div>`;
        }).join("")}
      </div>
    </div>`;
}

function lifestyleOwnedText(p) {
  const items = (p.lifestyle || []).map(o => getLifestyleItem(o.id)).filter(Boolean);
  return items.length ? items.map(i => `${i.icon} ${i.title}`).join(" · ") : "";
}
