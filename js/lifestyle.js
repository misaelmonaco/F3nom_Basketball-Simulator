"use strict";

/* ================================================================
   LIFESTYLE — accanto agli investimenti dell'estate si possono comprare auto, case,
   gioielli, viaggi, libri e altri sfizi con prezzi incrementali (dall'auto utilitaria
   fino all'hypercar, al jet privato e all'isola ai Caraibi).
   Quasi tutti si comprano una volta sola e restano nella scheda del giocatore; alcuni
   hanno un effetto che dura (lo chef e lo staff privato costano ogni anno, i beni da
   collezione si rivalutano del 4% annuo nel patrimonio).
   ================================================================ */
const LIFESTYLE_CATEGORIES = i18nify([
  { id: "all", icon: "🛍️", label: "Tutti", labelEn: "All" },
  { id: "cars", icon: "🏎️", label: "Garage & Jet", labelEn: "Garage & Jets" },
  { id: "homes", icon: "🏡", label: "Case & Ville", labelEn: "Homes & Estates" },
  { id: "jewelry", icon: "💎", label: "Gioielli & Stile", labelEn: "Jewelry & Style" },
  { id: "wellness", icon: "🌟", label: "Benessere & Lusso", labelEn: "Wellness & Luxury" },
]);

let currentLifestyleCat = "all";
function setLifestyleCategory(catId) {
  currentLifestyleCat = catId || "all";
  renderGameScreen();
}

const LIFESTYLE_ITEMS = i18nify([
  /* ---------------- FASCIA 1: INIZIO CARRIERA (8k – 90k) ---------------- */
  { id: "city_car", cat: "cars", icon: "🚙", title: "Auto utilitaria usata", titleEn: "Used Hatchback", price: 0.008,
    desc: "Qualche graffio sul paraurti ma non ti lascia mai a piedi: perfetta per andare agli allenamenti senza chiedere passaggi.",
    descEn: "A few bumper scratches, but reliable: gets you to practice without asking teammates for rides.",
    effects: { morale: 2 } },
  { id: "sneakers_vault", cat: "jewelry", icon: "👟", title: "Collezione di Sneakers Rare & Custom", titleEn: "Rare & Custom Sneaker Vault", price: 0.012,
    desc: "Edizioni numerate e scarpe dipinte a mano coi tuoi colori: stile unico appena scendi dal pullman.",
    descEn: "Numbered editions and hand-painted customs in your team colors: unmatched tunnel style.",
    effects: { popularity: 2, morale: 2 } },
  { id: "books", cat: "wellness", icon: "📚", title: "Biblioteca personale", titleEn: "Personal Library", price: 0.02,
    desc: "Biografie di campioni, tattica, romanzi: la testa si allena come le gambe.",
    descEn: "Biographies of champions, tactics, novels: train the mind just like the legs.",
    effects: { morale: 3, reputation: 1 } },
  { id: "sedan", cat: "cars", icon: "🚘", title: "Berlina sportiva compatta", titleEn: "Compact Sport Sedan", price: 0.035,
    desc: "Il primo acquisto vero col contratto da professionista: sedili in pelle e impianto audio al massimo.",
    descEn: "Your first real purchase after signing a pro contract: leather seats and booming sound system.",
    effects: { morale: 3, popularity: 1 } },
  { id: "tailor_wardrobe", cat: "jewelry", icon: "🕴️", title: "Guardaroba sartoriale d'alta moda", titleEn: "Bespoke Designer Wardrobe", price: 0.045,
    desc: "Abiti su misura per ogni trasferta: il tunnel pre-partita diventa la tua passerella personale.",
    descEn: "Custom-tailored suits for every road trip: the pre-game tunnel becomes your personal runway.",
    effects: { popularity: 3, reputation: 1 } },
  { id: "studio_apt", cat: "homes", icon: "🏢", title: "Monolocale vicino al palazzetto", titleEn: "Studio Apt Near the Arena", price: 0.06,
    desc: "Addio coinquilini: cinque minuti a piedi dalla palestra e silenzio assoluto per riposare dopo le gare.",
    descEn: "Goodbye roommates: five minutes on foot from the arena and total quiet to rest after games.",
    effects: { stamina: 3, morale: 2 } },
  { id: "home_cryo", cat: "wellness", icon: "🧊", title: "Criosauna e camera iperbarica domestica", titleEn: "Home Cryo & Hyperbaric Chamber", price: 0.075,
    desc: "Recupero muscolare scientifico direttamente in salotto dopo ogni partita tirata.",
    descEn: "Scientific muscle recovery right in your living room after every grueling game.",
    effects: { fragility: -3, stamina: 5 } },
  { id: "gold_chain", cat: "jewelry", icon: "📿", title: "Catena d'oro e pendente coi diamanti", titleEn: "Diamond Cuban Link Chain", price: 0.085,
    desc: "Il tuo numero di maglia tempestato di diamanti VVS: brilla sotto i riflettori in ogni conferenza stampa.",
    descEn: "Your jersey number iced out in VVS diamonds: shines under the lights at every press conference.",
    effects: { popularity: 3, morale: 2 } },
  { id: "suv_lux", cat: "cars", icon: "🚙", title: "SUV di lusso full-optional", titleEn: "Full-Size Luxury SUV", price: 0.09,
    desc: "Vetri oscurati, spazio per le gambe da lungo e sedili massaggianti dopo le trasferte.",
    descEn: "Tinted windows, seven-footer legroom, and massage seats for the drive home after road games.",
    effects: { morale: 3, popularity: 2, stamina: 2 } },

  /* ---------------- FASCIA 2: PROFESSIONISTA AFFERMATO (100k – 850k) ---------------- */
  { id: "trip", cat: "wellness", icon: "✈️", title: "Viaggio intorno al mondo", titleEn: "World Tour Vacation", price: 0.1, repeatable: true,
    desc: "Un mese lontano da tutto: torni carico e riposato. Si può rifare ogni estate.",
    descEn: "A month away from it all: come back recharged and rested. Can be repeated every summer.",
    effects: { morale: 8, stamina: 10 } },
  { id: "car", cat: "cars", icon: "🚗", title: "Auto sportiva coupé", titleEn: "Sports Car Coupé", price: 0.15,
    desc: "Il primo sfizio vero: il rombo del motore si sente fin dentro il parcheggio del palazzetto.",
    descEn: "Your first real luxury ride: fans hear the exhaust note echoing outside the arena.",
    effects: { popularity: 3, morale: 2 } },
  { id: "chef", cat: "wellness", icon: "👨‍🍳", title: "Chef privato", titleEn: "Private Chef", price: 0.2, upkeep: 0.2,
    desc: "Dieta su misura tutto l'anno: fragilità −3 a ogni stagione, ma costa 0.2 M l'anno.",
    descEn: "Tailored nutrition all year round: fragility −3 each season, costs 0.2M/yr.",
    effects: { fragility: -3 } },
  { id: "loft", cat: "homes", icon: "🏠", title: "Loft di design in centro", titleEn: "Designer Downtown Loft", price: 0.28,
    desc: "Spazi aperti, vetrate industriali, sala cinema privata e terrazza nel cuore della città.",
    descEn: "Open floor plan, industrial glass, private screening room, and terrace in the heart of the city.",
    effects: { morale: 4, popularity: 2 } },
  { id: "watches", cat: "jewelry", icon: "⌚", title: "Collezione di orologi svizzeri", titleEn: "Swiss Watch Collection", price: 0.3,
    desc: "Cronografi rari in metalli preziosi che finiscono su ogni rivista di moda.",
    descEn: "Rare precious-metal timepieces featured in every fashion magazine.",
    effects: { popularity: 3, reputation: 1 } },
  { id: "trainer", cat: "wellness", icon: "🏋️", title: "Staff personale (Fisioterapista & Nutrizionista)", titleEn: "Personal Performance Staff (Physio & Nutritionist)", price: 0.3, upkeep: 0.15,
    desc: "Trattamenti quotidiani mirati: fragilità −4 e stamina +6 a stagione, costo 0.15 M l'anno.",
    descEn: "Daily targeted treatments: fragility −4 and stamina +6 per season, costs 0.15M/yr.",
    effects: { fragility: -4, stamina: 6 } },
  { id: "vintage_car", cat: "cars", icon: "🏎️", title: "Gran Turismo d'epoca anni '60", titleEn: "Classic '60s Grand Tourer", price: 0.45,
    desc: "Un gioiello da concorso d'eleganza: si rivaluta del 4% ogni anno e resta nel patrimonio.",
    descEn: "A concours d'elegance icon: appreciates 4% per year and stays in your net worth.",
    effects: { reputation: 2, popularity: 3 }, investment: true },
  { id: "diamond_set", cat: "jewelry", icon: "💍", title: "Alta gioielleria & anelli su misura", titleEn: "High Jewelry Set & Custom Rings", price: 0.65,
    desc: "Bracciali in platino, orecchini di diamanti puri e anelli celebrativi realizzati dal tuo gioielliere di fiducia.",
    descEn: "Platinum bracelets, flawless diamond studs, and custom statement rings crafted by your personal jeweler.",
    effects: { popularity: 5, morale: 4 } },
  { id: "lake_house", cat: "homes", icon: "🏔️", title: "Chalet vista lago con spa", titleEn: "Lakefront Chalet & Spa", price: 0.75,
    desc: "Pontile privato, sauna finlandese e aria pulita: il rifugio perfetto per staccare la spina.",
    descEn: "Private dock, Finnish sauna, and crisp mountain air: the ultimate sanctuary to unplug.",
    effects: { morale: 5, stamina: 5, fragility: -2 } },
  { id: "supercar", cat: "cars", icon: "🏎️", title: "Supercar V12", titleEn: "V12 Supercar", price: 0.8,
    desc: "Dodici cilindri aspirati, porte ad ali di gabbiano e tanti flash: popolarità alle stelle.",
    descEn: "Naturally aspirated twelve cylinders, scissor doors, and flashing cameras: sky-high popularity.",
    effects: { popularity: 6, morale: 3 } },

  /* ---------------- FASCIA 3: STELLA & MILIONARIO (1 M – 6 M) ---------------- */
  { id: "art", cat: "wellness", icon: "🎨", title: "Collezione d'arte contemporanea", titleEn: "Contemporary Art Collection", price: 1,
    desc: "Tele di maestri e artisti emergenti: si rivalutano del 4% ogni anno e restano nel patrimonio.",
    descEn: "Works by masters and emerging artists: appreciate 4% per year and stay in your net worth.",
    effects: { reputation: 2 }, investment: true },
  { id: "tourbillon", cat: "jewelry", icon: "🕰️", title: "Orologio Tourbillon pezzo unico", titleEn: "One-of-One Tourbillon Masterpiece", price: 1.6,
    desc: "Complicazione meccanica realizzata in un solo esemplare al mondo: status assoluto e rivalutazione del 4% annuo.",
    descEn: "Bespoke horological masterpiece made as a 1-of-1 piece: ultimate status and 4% annual appreciation.",
    effects: { popularity: 6, reputation: 3 }, investment: true },
  { id: "villa", cat: "homes", icon: "🏡", title: "Villa con piscina e campetto privato", titleEn: "Luxury Villa with Pool & Court", price: 2.5,
    desc: "Parco privato, piscina a sfioro e metà campo regolamentare: morale e recupero ne guadagnano.",
    descEn: "Gated grounds, infinity pool, and private half-court: boosts morale and recovery.",
    effects: { morale: 6, stamina: 6 } },
  { id: "hypercar", cat: "cars", icon: "🚀", title: "Hypercar in serie limitata", titleEn: "Limited-Edition Hypercar", price: 3.2,
    desc: " oltre 1.200 cavalli in fibra di carbonio, prodotta in soli 20 esemplari al mondo: un'astronave su strada.",
    descEn: "Over 1,200 hp in exposed carbon fiber, one of just 20 built worldwide: a spaceship on wheels.",
    effects: { popularity: 9, morale: 6, reputation: 2 } },
  { id: "winery", cat: "wellness", icon: "🍷", title: "Tenuta vinicola di pregio", titleEn: "Boutique Vineyard & Winery", price: 3.8,
    desc: "Vigneti storici e cantina d'autore con la tua etichetta: prestigio internazionale e +4% annuo sul capitale.",
    descEn: "Historic vineyards and a signature cellar producing your own label: prestige and +4% annual appreciation.",
    effects: { reputation: 3, popularity: 4, morale: 4 }, investment: true },
  { id: "penthouse", cat: "homes", icon: "🏙️", title: "Attico panoramico in metropoli", titleEn: "Downtown Mega-Penthouse", price: 4,
    desc: "Triplo livello sospeso sullo skyline, ascensore privato e terrazza per party esclusivi.",
    descEn: "Triplex suspended over the skyline with private elevator and rooftop for exclusive parties.",
    effects: { popularity: 5, reputation: 2, morale: 5 } },
  { id: "yacht", cat: "cars", icon: "🛥️", title: "Superyacht 40 metri", titleEn: "130ft Superyacht", price: 6,
    desc: "Equipaggio dedicato, jacuzzi sul ponte ed estati in mare aperto su tutti i social.",
    descEn: "Full crew, sundeck jacuzzi, and summers on the open sea splashed across social media.",
    effects: { popularity: 8, morale: 5 } },

  /* ---------------- FASCIA 4: ICONA GLOBALE & LEGGENDA (9.5 M – 25 M) ---------------- */
  { id: "beverly_estate", cat: "homes", icon: "🏰", title: "Tenuta presidenziale con palestra Pro", titleEn: "Presidential Compound & Pro Gym", price: 9.5,
    desc: "Complesso blindato con campo regolamentare indoor col tuo logo a centrocampo, sala pesi NBA e spa.",
    descEn: "Gated compound featuring a full-size indoor court with your logo at center court, pro weight room, and spa.",
    effects: { stamina: 8, fragility: -4, popularity: 7, reputation: 3 } },
  { id: "private_jet", cat: "cars", icon: "🛩️", title: "Jet privato intercontinentale", titleEn: "Intercontinental Private Jet", price: 12,
    desc: "Zero code nei terminal, camera da letto in quota e riposo da superstar nei viaggi intercontinentali.",
    descEn: "Zero terminal lines, airborne bedroom, and superstar rest on cross-country flights.",
    effects: { popularity: 10, stamina: 10, reputation: 3 } },
  { id: "private_island", cat: "homes", icon: "🏝️", title: "Isola privata ai Caraibi", titleEn: "Private Caribbean Island", price: 25,
    desc: "Spiagge di sabbia bianca, porto per lo yacht e pista d'atterraggio privata: l'apice assoluto dell'impero F3NOM.",
    descEn: "White-sand beaches, deep-water yacht dock, and private airstrip: the absolute pinnacle of the F3NOM empire.",
    effects: { morale: 10, popularity: 12, stamina: 8, reputation: 5 } },
]);

function getLifestyleItem(id) { return LIFESTYLE_ITEMS.find(i => i.id === id) || null; }
function ownsLifestyle(p, id) { return (p.lifestyle || []).some(o => o.id === id); }
function canBuyLifestyle(p, item) { return p.wealth >= item.price && (item.repeatable || !ownsLifestyle(p, item.id)); }
function lifestyleCollectionValue(p) {
  return roundMoney((p.lifestyle || []).reduce((sum, o) => {
    const it = getLifestyleItem(o.id);
    return sum + (it ? it.price : 0);
  }, 0));
}

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
  if (typeof onLifestyleSocial === "function") onLifestyleSocial(player, item);
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
  const nonRepeatableTotal = LIFESTYLE_ITEMS.filter(i => !i.repeatable).length;
  const ownedCount = (p.lifestyle || []).length;
  const colValue = lifestyleCollectionValue(p);
  const visibleItems = LIFESTYLE_ITEMS
    .filter(item => currentLifestyleCat === "all" || item.cat === currentLifestyleCat)
    .slice()
    .sort((a, b) => a.price - b.price);

  return `
    <div class="recap-section lifestyle-shop" style="margin-top:20px;">
      <div class="flex-between" style="flex-wrap:wrap;gap:8px;margin-bottom:6px;">
        <div class="recap-h" style="margin:0;">🛍️ ${tr(`Acquisti & Proprietà · patrimonio disponibile ${fmtMoney(p.wealth, cur)}`, `Purchases & Properties · available net worth ${fmtMoney(p.wealth, cur)}`)}</div>
        <div class="co-row">
          <span class="badge">${tr(`Posseduti: ${ownedCount}/${nonRepeatableTotal}`, `Owned: ${ownedCount}/${nonRepeatableTotal}`)}</span>
          ${colValue > 0 ? `<span class="badge gold">💎 ${tr(`Valore beni: ${fmtMoney(colValue, cur)}`, `Collection value: ${fmtMoney(colValue, cur)}`)}</span>` : ""}
        </div>
      </div>
      <p class="small-muted" style="margin-bottom:10px">${tr("Dal primo contratto in provincia fino ai contratti max NBA: auto, gioielli, ville e investimenti di prestigio ordinati per prezzo crescente.", "From your first rookie paycheck to NBA max contracts: cars, jewelry, estates, and prestige assets ordered by incremental price.")}</p>
      <div class="social-filters" style="margin-bottom:12px;">
        ${LIFESTYLE_CATEGORIES.map(c => {
          const count = c.id === "all" ? LIFESTYLE_ITEMS.length : LIFESTYLE_ITEMS.filter(i => i.cat === c.id).length;
          return `<button type="button" class="league-pill ${currentLifestyleCat === c.id ? "active" : ""}" data-lifestyle-cat="${c.id}">${c.icon} ${c.label} (${count})</button>`;
        }).join("")}
      </div>
      <div class="ls-grid">
        ${visibleItems.map(item => {
          const owned = !item.repeatable && ownsLifestyle(p, item.id);
          const can = canBuyLifestyle(p, item);
          const metaBadge = item.investment
            ? `<span class="badge blue" style="font-size:10px;padding:1px 6px;">📈 +4%/${tr("anno", "yr")}</span>`
            : item.upkeep
              ? `<span class="badge" style="font-size:10px;padding:1px 6px;">🔄 ${fmtMoney(item.upkeep, cur)}/${tr("anno", "yr")}</span>`
              : item.repeatable
                ? `<span class="badge" style="font-size:10px;padding:1px 6px;">♻️ ${tr("ripetibile", "repeatable")}</span>`
                : "";
          return `
          <div class="ls-item ${owned ? "owned" : ""}">
            <div class="ls-icon">${item.icon}</div>
            <div class="ls-body">
              <div class="ls-title" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;"><span>${item.title}</span>${metaBadge}</div>
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
