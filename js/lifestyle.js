"use strict";

/* ================================================================
   LIFESTYLE — accanto agli investimenti dell'estate si possono comprare auto, case,
   viaggi, libri e altri sfizi. Prezzi fissi (in milioni), quasi tutti si comprano una
   volta sola e restano nella scheda del giocatore; alcuni hanno un effetto che dura
   (lo chef privato costa ogni anno, l'arte si rivaluta).
   ================================================================ */
const LIFESTYLE_ITEMS = i18nify([
  { id: "books", icon: "📚", title: "Biblioteca personale", titleEn: "Personal Library", price: 0.02, desc: "Biografie di campioni, tattica, romanzi: la testa si allena come le gambe.", descEn: "Biographies of champions, tactics, novels: train the mind just like the legs.",
    effects: { morale: 3, reputation: 1 } },
  { id: "trip", icon: "✈️", title: "Viaggio intorno al mondo", titleEn: "World Tour Vacation", price: 0.1, repeatable: true, desc: "Un mese lontano da tutto: torni carico e riposato. Si può rifare ogni estate.", descEn: "A month away from it all: come back recharged and rested. Can be repeated every summer.",
    effects: { morale: 8, stamina: 10 } },
  { id: "car", icon: "🚗", title: "Auto sportiva", titleEn: "Sports Car", price: 0.15, desc: "Il primo sfizio vero: i tifosi la riconoscono sotto il palazzetto.", descEn: "Your first real luxury: fans spot it right outside the arena.",
    effects: { popularity: 3, morale: 2 } },
  { id: "chef", icon: "👨‍🍳", title: "Chef privato", titleEn: "Private Chef", price: 0.2, upkeep: 0.2, desc: "Dieta su misura tutto l'anno: fragilità −3 a ogni stagione, ma costa 0.2 M l'anno.", descEn: "Tailored nutrition all year round: fragility −3 each season, costs 0.2M/yr.",
    effects: { fragility: -3 } },
  { id: "watches", icon: "⌚", title: "Collezione di orologi", titleEn: "Watch Collection", price: 0.3, desc: "Pezzi rari che finiscono su ogni rivista di moda.", descEn: "Rare timepieces featured in every fashion magazine.",
    effects: { popularity: 3 } },
  { id: "supercar", icon: "🏎️", title: "Supercar", titleEn: "Supercar", price: 0.8, desc: "Dodici cilindri e tanti flash: popolarità alle stelle.", descEn: "Twelve cylinders and flashing cameras: sky-high popularity.",
    effects: { popularity: 6, morale: 3 } },
  { id: "art", icon: "🎨", title: "Collezione d'arte", titleEn: "Art Collection", price: 1, desc: "Quadri di artisti emergenti: si rivalutano del 4% ogni anno e restano nel patrimonio.", descEn: "Paintings by emerging artists: appreciate 4% per year and stay in your net worth.",
    effects: { reputation: 1 }, investment: true },
  { id: "villa", icon: "🏡", title: "Villa con piscina", titleEn: "Luxury Villa with Pool", price: 2.5, desc: "Casa grande, palestra privata e silenzio: morale e recupero ne guadagnano.", descEn: "Spacious home, private gym, and peace: boosts morale and recovery.",
    effects: { morale: 6, stamina: 6 } },
  { id: "penthouse", icon: "🏙️", title: "Attico in centro", titleEn: "Downtown Penthouse", price: 4, desc: "Vista mozzafiato sullo skyline della metropoli e party esclusivi.", descEn: "Breathtaking skyline views and exclusive parties.",
    effects: { popularity: 5, reputation: 2, morale: 5 } },
  { id: "yacht", icon: "🛥️", title: "Yacht", titleEn: "Yacht", price: 6, desc: "Estati in mare aperto e foto su tutti i social.", descEn: "Summers on the open sea and photos across social media.",
    effects: { popularity: 8, morale: 5 } },
  { id: "private_jet", icon: "🛩️", title: "Jet privato", titleEn: "Private Jet", price: 12, desc: "Zero code nei terminal e riposo da superstar nei viaggi intercontinentali.", descEn: "Zero terminal lines and superstar rest on cross-country flights.",
    effects: { popularity: 10, stamina: 10, reputation: 3 } },
  { id: "trainer", icon: "🏋️", title: "Staff personale (Fisioterapista & Nutrizionista)", titleEn: "Personal Performance Staff (Physio & Nutritionist)", price: 0.3, upkeep: 0.15, desc: "Trattamenti quotidiani mirati: fragilità −4 e stamina +6 a stagione, costo 0.15 M l'anno.", descEn: "Daily targeted treatments: fragility −4 and stamina +6 per season, costs 0.15M/yr.",
    effects: { fragility: -4, stamina: 6 } },
]);
function getLifestyleItem(id) { return LIFESTYLE_ITEMS.find(i => i.id === id) || null; }
function ownsLifestyle(p, id) { return (p.lifestyle || []).some(o => o.id === id); }
function canBuyLifestyle(p, item) { return p.wealth >= item.price && (item.repeatable || !ownsLifestyle(p, item.id)); }

function buyLifestyle(id) {
  const item = getLifestyleItem(id);
  if (!item || !canBuyLifestyle(player, item)) return;
  player.lifestyle = player.lifestyle || [];
  player.wealth = roundMoney(player.wealth - item.price);
  const e = item.effects;
  if (e.morale) player.morale = clamp(player.morale + e.morale, 0, 100);
  if (e.popularity) player.popularity = clamp(player.popularity + e.popularity, 0, 100);
  if (e.stamina) player.stamina = clamp(player.stamina + e.stamina, 0, 100);
  if (e.fragility) player.fragility = clamp(player.fragility + e.fragility, 0, 100);
  if (e.reputation) changeReputation(player, e.reputation);
  if (item.investment) player.investments.push({ type: "art", amount: item.price, year: player.year });
  if (!item.repeatable) player.lifestyle.push({ id: item.id, year: player.year });
  else player.tripCount = (player.tripCount || 0) + 1;
  toast(`${item.icon} ${item.title}: ${tr("acquistato!", "purchased!")}`);
  checkAchievements(player);
  renderGameScreen();
}

/* Fine stagione: lo chef e lo staff personale si pagano */
function settleLifestyle(p) {
  let cost = 0;
  if (ownsLifestyle(p, "chef")) {
    const chef = getLifestyleItem("chef");
    p.wealth = roundMoney(Math.max(0, p.wealth - chef.upkeep));
    p.fragility = clamp(p.fragility + chef.effects.fragility, 0, 100);
    cost += chef.upkeep;
  }
  if (ownsLifestyle(p, "trainer")) {
    const trItem = getLifestyleItem("trainer");
    p.wealth = roundMoney(Math.max(0, p.wealth - trItem.upkeep));
    p.fragility = clamp(p.fragility + trItem.effects.fragility, 0, 100);
    cost += trItem.upkeep;
  }
  return cost;
}

function lifestyleShopHtml(p) {
  const cur = playerCurrency(p);
  const effectsText = e => Object.entries(e).map(([k, v]) => `${{ morale: tr("morale", "morale"), popularity: tr("popolarità", "popularity"), stamina: "stamina", fragility: tr("fragilità", "fragility"), reputation: tr("reputazione", "reputation") }[k]} ${v > 0 ? "+" : ""}${v}`).join(" · ");
  return `
    <div class="recap-section lifestyle-shop" style="margin-top:20px;">
      <div class="recap-h">🛍️ ${tr(`Acquisti & Proprietà · patrimonio disponibile ${fmtMoney(p.wealth, cur)}`, `Purchases & Properties · available net worth ${fmtMoney(p.wealth, cur)}`)}</div>
      <p class="small-muted" style="margin-bottom:12px">${tr("Case, auto, lusso e comfort stile New Star Soccer: acquisti che migliorano il tuo status e il benessere fuori dal campo.", "Homes, cars, luxury, and comfort: purchases that boost your status and off-court well-being.")}</p>
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
            <button class="btn ${owned ? "btn-ghost" : "btn-secondary"} btn-sm" data-buy="${item.id}" data-buy-lifestyle="${item.id}" ${can ? "" : "disabled"}>${owned ? tr("✓ Tuo", "✓ Owned") : fmtMoney(item.price, cur)}</button>
          </div>`;
        }).join("")}
      </div>
    </div>`;
}

function lifestyleOwnedText(p) {
  const items = (p.lifestyle || []).map(o => getLifestyleItem(o.id)).filter(Boolean);
  return items.length ? items.map(i => `${i.icon} ${i.title}`).join(" · ") : "";
}
