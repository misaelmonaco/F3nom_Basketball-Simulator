"use strict";

/* ================================================================
   SPONSOR CON CONDIZIONI — d'estate, se sei abbastanza popolare, arrivano proposte di
   sponsorizzazione pluriennali. Ognuna paga solo se rispetti la sua condizione: se una
   stagione la manchi, il marchio straccia il contratto. Si aggiungono agli sponsor "di
   base" (sponsorIncome), che seguono la popolarità da soli.
   ================================================================ */
const SPONSOR_BRANDS = ["Vortex Sportswear", "Nova Energy Drink", "Apex Motors", "Skyline Airlines", "Pulse Headphones", "Titan Watches", "Aurora Telecom", "Stride Sneakers", "Blaze Gaming", "Orion Bank"];

/* ================================================================
   SIGNATURE SHOE & SPONSOR TECNICI — Raggiunta la fama da superstar,
   i colossi mondiali propongono una linea di sneaker con il nome del giocatore.
   ================================================================ */
const SIGNATURE_SHOE_BRANDS = [
  {
    id: "swoosh",
    name: "Swoosh Athletic",
    icon: "⚡",
    defaultPrefix: "Air",
    royaltyRate: 14,
    vibe: "Tecnologia d'élite & Campagne globali",
    vibeEn: "Elite Tech & Global Campaigns",
    desc: "Il marchio di riferimento globale nel basket. Firma immediata con forte spinta di popolarità e visibilità.",
    descEn: "The premier global basketball powerhouse. Massive worldwide media visibility and elite status.",
    specialtyTag: "+5 Popolarità",
    specialtyTagEn: "+5 Popularity",
    bonusMult: 1.15,
    signingBonus: p => roundMoney((p.popularity || 40) * 0.018 + (p.league === "NBA" ? 0.9 : 0.25)),
  },
  {
    id: "jumpman",
    name: "Jumpman Heritage",
    icon: "👑",
    defaultPrefix: "Jumpman",
    royaltyRate: 13,
    vibe: "L'eredità della grandezza & Status leggendario",
    vibeEn: "Legacy of Greatness & Legendary Status",
    desc: "Il brand per antonomasia del volo e delle finali leggendarie. Aura inimitabile e rispetto generazionale.",
    descEn: "The undisputed brand of flight and championship lore. Iconic prestige and generational respect.",
    specialtyTag: "+6 Pop · +3 Rep",
    specialtyTagEn: "+6 Pop · +3 Rep",
    bonusMult: 1.10,
    signingBonus: p => roundMoney((p.popularity || 40) * 0.020 + (p.league === "NBA" ? 1.1 : 0.3)),
  },
  {
    id: "stripes",
    name: "Three Stripes",
    icon: "👟",
    defaultPrefix: "Traxion",
    royaltyRate: 15,
    vibe: "Design europeo, controllo & street culture",
    vibeEn: "Euro Design, Court Control & Street Culture",
    desc: "Massima reattività nei cambi di passo e grande influenza culturale urbana. Ottime percentuali sulle vendite.",
    descEn: "Elite lateral grip and street culture resonance. Strong royalties percentage across European and global markets.",
    specialtyTag: "+4 Pop · 15% Royalties",
    specialtyTagEn: "+4 Pop · 15% Royalties",
    bonusMult: 1.20,
    signingBonus: p => roundMoney((p.popularity || 40) * 0.016 + (p.league === "NBA" ? 0.85 : 0.22)),
  },
  {
    id: "wildcat",
    name: "WildCat Hoops",
    icon: "🐆",
    defaultPrefix: "Nitro",
    royaltyRate: 16,
    vibe: "Brand ribelle, esplosività & colorway audaci",
    vibeEn: "Rebel Brand, Explosiveness & Bold Colorways",
    desc: "Pioniere della nuova generazione di atleti spettacolari: colorway appariscenti e schiacciate ad alta quota.",
    descEn: "Frontrunner of the next generation of dynamic high-flyers: high energy, bold designs and flashy dunks.",
    specialtyTag: "+4 Pop · +4 Morale",
    specialtyTagEn: "+4 Pop · +4 Morale",
    bonusMult: 1.25,
    signingBonus: p => roundMoney((p.popularity || 40) * 0.017 + (p.league === "NBA" ? 0.95 : 0.24)),
  },
  {
    id: "dragon",
    name: "Dragon Peak",
    icon: "🐉",
    defaultPrefix: "Silk",
    royaltyRate: 18,
    vibe: "Mega-contratto garantito & mercato asiatico",
    vibeEn: "Guaranteed Megadeal & Asian Market Boom",
    desc: "Il colosso emergente dell'Oriente offre il bonus alla firma più ricco e le percentuali royalties più alte di tutte.",
    descEn: "The Eastern giant offering the highest guaranteed signing bonus and highest sales royalty cut in the game.",
    specialtyTag: "Bonus Record · 18% Royalties",
    specialtyTagEn: "Record Bonus · 18% Royalties",
    bonusMult: 1.35,
    signingBonus: p => roundMoney((p.popularity || 40) * 0.028 + (p.league === "NBA" ? 1.6 : 0.45)),
  },
];

const SIGNATURE_SHOE_CUTS = [
  {
    id: "low",
    icon: "⚡",
    name: "Low-Cut (Basso)",
    nameEn: "Low-Cut",
    desc: "Massima leggerezza, cambi di direzione brucianti e ritmo: +1 Tiro, +1 Atletismo.",
    descEn: "Ultra-lightweight, lightning changes of direction and tempo: +1 Shooting, +1 Athleticism.",
    attrs: { shooting: 1, athleticism: 1 },
  },
  {
    id: "mid",
    icon: "⚖️",
    name: "Mid-Top (Medio)",
    nameEn: "Mid-Top",
    desc: "Equilibrio perfetto tra supporto caviglia e reattività: +1 Playmaking, +1 Difesa.",
    descEn: "Ideal balance of ankle support and fluid court control: +1 Playmaking, +1 Defense.",
    attrs: { playmaking: 1, defense: 1 },
  },
  {
    id: "high",
    icon: "🛡️",
    name: "High-Top (Alto)",
    nameEn: "High-Top",
    desc: "Massima stabilità sotto canestro e protezione dagli infortuni: +1 Rimbalzo, −3 Fragilità.",
    descEn: "Maximum post stability and superior ankle injury shield: +1 Rebounding, −3 Fragility.",
    attrs: { rebounding: 1 },
    fragility: -3,
  },
];

const SIGNATURE_SHOE_COLORWAYS = [
  { id: "team", icon: "🏀", name: "Colori di Squadra", nameEn: "Team Franchise Colorway" },
  { id: "blackout", icon: "🖤", name: "Stealth Triple Black", nameEn: "Stealth Triple Black" },
  { id: "chicago", icon: "🔴", name: "Red & White Heritage", nameEn: "Red & White Heritage" },
  { id: "gold", icon: "🏆", name: "Championship Gold", nameEn: "Championship Gold" },
  { id: "neon", icon: "🟢", name: "Cyber Neon Glow", nameEn: "Cyber Neon Glow" },
];
const SPONSOR_CONDITIONS = {
  allstar: { label: () => tr("Essere convocato all'All-Star Game", "Make the All-Star Game"), mult: 1.6, check: rec => (rec.awards || []).some(a => a.startsWith("All-Star")) },
  playoffs: { label: () => tr("Qualificarsi ai playoff", "Qualify for the playoffs"), mult: 1.1, check: rec => !!rec.playoffRounds },
  points: { label: t => tr(`Almeno ${t} punti a partita`, `At least ${t} points per game`), mult: 1.3, check: (rec, t) => rec.pts >= t },
  healthy: { label: () => tr("Giocare almeno l'80% delle partite", "Play at least 80% of games"), mult: 1, check: rec => rec.gp / Math.max(1, rec.games) >= 0.8 },
  clean: { label: () => tr("Nessuna uscita polemica con i media", "No controversial media outbursts"), mult: 1, check: (rec, t, p, sp) => (p.polemicCount || 0) === sp.polemicMark },
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
    toast(tr(`🤝 Firmato con ${offer.brand}: ${fmtMoney(offer.amount, playerCurrency(player))}/anno per ${offer.years} anni.`, `🤝 Signed with ${offer.brand}: ${fmtMoney(offer.amount, playerCurrency(player))}/yr for ${offer.years} years.`));
  }
  player.pendingDecision = d.next;
  renderGameScreen();
}

function canSignSignatureShoe(p) {
  if (!p || p.signatureShoe) return false;
  if (isMinorItaLeague(p.league) || p.league === "NCAA" || p.league === "HIGH_SCHOOL") return false;
  const hasStarTrophy = p.trophies && ((p.trophies.allStar || 0) > 0 || (p.trophies.mvps || 0) > 0 || (p.trophies.titles || 0) > 0);
  return (p.overall >= 82 || p.popularity >= 45 || hasStarTrophy);
}

function maybeSignatureShoeDecision(p, rec, next) {
  if (!canSignSignatureShoe(p)) return next;
  // 80% di probabilità di offerta per sessione estiva quando idoneo
  if (!rollChance(80)) return next;
  return { type: "signatureShoeOffer", next };
}

function calculateSneakerRoyalties(p, rec) {
  if (!p || !p.signatureShoe) return 0;
  const shoe = p.signatureShoe;
  const brand = SIGNATURE_SHOE_BRANDS.find(b => b.id === shoe.brandId) || SIGNATURE_SHOE_BRANDS[0];
  const leagueMult = p.league === "NBA" ? 1.5 : (p.team && p.team.euro === "EL" ? 1.0 : 0.65);
  const popFactor = Math.pow(clamp(p.popularity || 40, 10, 100) / 100, 1.4);
  const ppgBonus = (rec && rec.pts) ? Math.max(0, rec.pts - 15) * 0.04 : 0;
  const allStarBonus = (rec && rec.awards && rec.awards.some(a => a.includes("All-Star"))) ? 0.35 : 0;
  const mvpBonus = (rec && rec.awards && rec.awards.some(a => a.includes("MVP"))) ? 0.6 : 0;
  const titleBonus = (rec && rec.titlesWon) ? 0.5 : 0;

  const baseSales = (0.45 + ppgBonus + allStarBonus + mvpBonus + titleBonus) * popFactor * leagueMult;
  const royalties = baseSales * (brand.bonusMult || 1.15) * (brand.royaltyRate / 10);
  return roundMoney(clamp(royalties, 0.2, 5.0));
}

function signSignatureShoe(brandId, cutId, colorwayId, customName) {
  if (!player) return;
  const brand = SIGNATURE_SHOE_BRANDS.find(b => b.id === brandId) || SIGNATURE_SHOE_BRANDS[0];
  const cut = SIGNATURE_SHOE_CUTS.find(c => c.id === cutId) || SIGNATURE_SHOE_CUTS[0];
  const colorway = SIGNATURE_SHOE_COLORWAYS.find(w => w.id === colorwayId) || SIGNATURE_SHOE_COLORWAYS[0];

  const bonus = brand.signingBonus(player);
  const defName = `${brand.defaultPrefix} ${player.lastName || "Pro"} 1`;
  const shoeName = (customName && customName.trim()) ? customName.trim() : defName;

  player.signatureShoe = {
    brandId: brand.id,
    brandName: brand.name,
    brandIcon: brand.icon,
    cutId: cut.id,
    cutName: isEn() ? cut.nameEn : cut.name,
    colorwayId: colorway.id,
    colorwayName: isEn() ? colorway.nameEn : colorway.name,
    modelName: shoeName,
    yearCreated: player.year,
    totalEarnings: bonus,
  };

  // Bonus alla firma immediato
  player.wealth = roundMoney((player.wealth || 0) + bonus);

  // Bonus attributi dal taglio della scarpa
  if (cut.attrs) {
    player.attrs = player.attrs || {};
    Object.keys(cut.attrs).forEach(k => {
      player.attrs[k] = clamp((player.attrs[k] || 50) + cut.attrs[k], 30, 99);
    });
  }
  if (cut.fragility) {
    player.fragility = clamp((player.fragility || 30) + cut.fragility, 0, 100);
  }

  // Bonus specifici del brand
  if (brand.id === "swoosh") player.popularity = clamp((player.popularity || 50) + 5, 0, 100);
  if (brand.id === "jumpman") {
    player.popularity = clamp((player.popularity || 50) + 6, 0, 100);
    if (typeof changeReputation === "function") changeReputation(player, 3);
  }
  if (brand.id === "stripes") player.popularity = clamp((player.popularity || 50) + 4, 0, 100);
  if (brand.id === "wildcat") {
    player.popularity = clamp((player.popularity || 50) + 4, 0, 100);
    player.morale = clamp((player.morale || 50) + 4, 0, 100);
  }
  if (brand.id === "dragon") player.popularity = clamp((player.popularity || 50) + 3, 0, 100);

  const cur = playerCurrency(player);
  pushNews(tr(
    `👟 UFFICIALE: ${player.firstName} ${player.lastName} firma con ${brand.name}! Annunciata la prima signature shoe "${shoeName}" (+${fmtMoney(bonus, cur)} bonus alla firma).`,
    `👟 OFFICIAL: ${player.firstName} ${player.lastName} signs with ${brand.name}! Unveiling his first signature sneaker "${shoeName}" (+${fmtMoney(bonus, cur)} signing bonus).`
  ));

  if (typeof createSocialPost === "function") {
    createSocialPost(player, {
      kind: "media",
      when: isEn() ? `Sneaker Drop · Season ${player.year}` : `Lancio Scarpa · Stagione ${player.year}`,
      author: "Sneaker Drop Worldwide",
      handle: "@SneakerDropNews",
      badge: "👟 Sneaker News",
      verified: true,
      avatar: "👟",
      viral: true,
      text: isEn()
        ? `🚨 FIRST LOOK: ${brand.name} officially unveils ${player.firstName} ${player.lastName}'s debut signature sneaker — the "${shoeName}" (${isEn() ? cut.nameEn : cut.name}, ${isEn() ? colorway.nameEn : colorway.name})! Instant classic or heat? 🔥👟`
        : `🚨 PRIMO SGUARDO: ${brand.name} presenta ufficialmente la prima signature sneaker di ${player.firstName} ${player.lastName} — la "${shoeName}" (${cut.name}, ${colorway.name})! Subito cult o capolavoro da collezione? 🔥👟`,
      comments: [
        { author: "Curva Parquet", handle: "@CurvaParquet", text: isEn() ? "Take all my money right now!! Ordering day one 🔥👟" : "Prendete tutti i miei soldi subito!! Già in fila al negozio 🔥👟" },
        { author: "Hardwood Critic", handle: "@HardwoodCritic", text: isEn() ? "Sleek silhouette. Let's see if the on-court performance matches the hype." : "Design pulito e aggressivo. Ora vediamo se le prestazioni sul parquet saranno all'altezza dell'hype." },
      ],
    });
  }

  toast(tr(
    `👟 Signature Shoe "${shoeName}" creata con ${brand.name}! (+${fmtMoney(bonus, cur)})`,
    `👟 Signature Shoe "${shoeName}" created with ${brand.name}! (+${fmtMoney(bonus, cur)})`
  ));

  const d = player.pendingDecision;
  player.pendingDecision = d && d.next ? d.next : null;
  renderGameScreen();
}

function declineSignatureShoe() {
  if (!player) return;
  const d = player.pendingDecision;
  toast(tr("Accordo signature shoe rinviato alla prossima estate.", "Signature shoe deal postponed to next summer."));
  player.pendingDecision = d && d.next ? d.next : null;
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
      results.push({ brand: sp.brand, met: false, text: tr(`${sp.brand} straccia il contratto: "${sponsorConditionLabel(sp)}" non rispettato.`, `${sp.brand} terminates the deal: "${sponsorConditionLabel(sp)}" not met.`) });
      return false;
    }
    const pay = roundMoney(sp.amount * getAgent(p).sponsor);
    income += pay;
    sp.years--;
    results.push({ brand: sp.brand, met: true, text: `${sp.brand}: +${fmtMoney(pay, playerCurrency(p))}${sp.years ? "" : tr(" (contratto concluso)", " (deal completed)")}` });
    return sp.years > 0;
  });

  // Royalties annuali Signature Shoe
  if (p.signatureShoe) {
    const shoe = p.signatureShoe;
    const royalties = calculateSneakerRoyalties(p, rec);
    if (royalties > 0) {
      income += royalties;
      shoe.totalEarnings = roundMoney((shoe.totalEarnings || 0) + royalties);
      results.push({
        brand: shoe.brandName,
        met: true,
        text: tr(
          `👟 Royalties Signature Shoe "${shoe.modelName}" (${shoe.brandName}): +${fmtMoney(royalties, playerCurrency(p))}`,
          `👟 Signature Shoe Royalties "${shoe.modelName}" (${shoe.brandName}): +${fmtMoney(royalties, playerCurrency(p))}`
        ),
      });
    }
  }

  income = roundMoney(income);
  if (income) p.wealth = roundMoney(p.wealth + income);
  results.filter(r => !r.met).forEach(r => pushNews(`💔 ${r.text}`));
  return { income, results };
}

function renderSignatureShoeOffer(d, titleEl, subEl, cards, extra) {
  const cur = playerCurrency(player);
  titleEl.textContent = tr("👟 La tua prima Signature Shoe", "👟 Your First Signature Shoe");
  subEl.textContent = tr(
    `Hai raggiunto lo status di superstar (${player.overall} OVR · ${player.popularity} Popolarità). I colossi mondiali dello sportswear vogliono creare una linea di scarpe con il tuo nome e la tua firma! Scegli il marchio per personalizzare la tua scarpa.`,
    `You've reached superstar status (${player.overall} OVR · ${player.popularity} Popularity). Global sportswear giants want to launch a signature shoe line carrying your name! Choose a brand to customize your sneaker.`
  );
  cards.innerHTML = SIGNATURE_SHOE_BRANDS.map((b, i) => offCardHtml({
    idx: i,
    icon: b.icon,
    title: b.name,
    subtitle: `${isEn() ? b.vibeEn : b.vibe}`,
    desc: `${isEn() ? b.descEn : b.desc} ${tr("Bonus firma", "Signing bonus")}: +${fmtMoney(b.signingBonus(player), cur)}.`,
    tags: [
      { text: `${b.royaltyRate}% ${tr("royalties vendite", "sales royalties")}`, tone: "gold" },
      { text: isEn() ? b.specialtyTagEn : b.specialtyTag, tone: "blue" },
    ],
  })).join("");

  cards.querySelectorAll(".off-card").forEach(c => {
    c.addEventListener("click", () => openSignatureShoeCustomizer(SIGNATURE_SHOE_BRANDS[parseInt(c.dataset.idx)]));
  });

  extra.innerHTML = `
    <div class="btn-row" style="justify-content:center">
      <button class="btn btn-secondary" id="btn-open-shoe-builder">👟 ${tr("Personalizza e firma ora", "Customize and sign now")}</button>
      <button class="btn btn-ghost" id="btn-decline-shoe">${tr("Rifiuta per ora", "Decline for now")}</button>
    </div>`;

  const builderBtn = el("btn-open-shoe-builder");
  if (builderBtn) builderBtn.addEventListener("click", () => openSignatureShoeCustomizer(SIGNATURE_SHOE_BRANDS[0]));
  const declineBtn = el("btn-decline-shoe");
  if (declineBtn) declineBtn.addEventListener("click", () => declineSignatureShoe());

  if (!d.modalShown) {
    d.modalShown = true;
    openSignatureShoeCustomizer(SIGNATURE_SHOE_BRANDS[0]);
  }
}

function openSignatureShoeCustomizer(initialBrand) {
  if (!player) return;
  let curBrand = initialBrand || SIGNATURE_SHOE_BRANDS[0];
  let curCut = SIGNATURE_SHOE_CUTS[0];
  let curColorway = SIGNATURE_SHOE_COLORWAYS[0];

  function renderCustomizer() {
    const cur = playerCurrency(player);
    const bonus = curBrand.signingBonus(player);
    const defName = `${curBrand.defaultPrefix} ${player.lastName || "Pro"} 1`;

    renderEventModal({
      tone: "gold",
      tag: tr("Sneaker Studio · Creazione Signature Shoe", "Sneaker Studio · Signature Shoe Creation"),
      meta: `${player.popularity} ${tr("Popolarità", "Popularity")}`,
      icon: "👟",
      title: tr("Disegna la tua Signature Shoe", "Design Your Signature Shoe"),
      text: tr(
        `Seleziona il <strong>marchio sponsor</strong>, il <strong>taglio</strong> con i relativi bonus di gioco, e il <strong>nome del modello</strong> che verrà venduto nei negozi di tutto il mondo.`,
        `Select your <strong>sponsor brand</strong>, your <strong>shoe cut</strong> with its gameplay stat buffs, and the <strong>model name</strong> that will hit store shelves worldwide.`
      ),
      heroHtml: `
        <div class="card" style="margin:12px 16px 0;background:linear-gradient(135deg, rgba(255,212,71,0.12), rgba(255,90,31,0.06));border:1px solid var(--gold);padding:14px;">
          <div class="flex-between" style="flex-wrap:wrap;gap:8px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:2.2rem">${curBrand.icon}</span>
              <div>
                <div style="font-family:var(--font-display);font-size:1.2rem;font-weight:900;color:var(--ink-1)">${curBrand.name}</div>
                <div class="small-muted">${curCut.icon} ${isEn() ? curCut.nameEn : curCut.name} · ${curColorway.icon} ${isEn() ? curColorway.nameEn : curColorway.name}</div>
              </div>
            </div>
            <div style="text-align:right">
              <span class="badge gold">+${fmtMoney(bonus, cur)} ${tr("alla firma", "signing bonus")}</span>
              <div class="small-muted" style="margin-top:2px">${curBrand.royaltyRate}% ${tr("royalties annuali", "annual royalties")}</div>
            </div>
          </div>
        </div>`,
      bodyHtml: `
        <div style="padding:10px 0;display:grid;gap:14px;">
          <div>
            <label class="probe-label">${tr("1. Scegli il Marchio Sponsor", "1. Choose Sponsor Brand")}</label>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:6px;margin-top:6px;">
              ${SIGNATURE_SHOE_BRANDS.map(b => `
                <button type="button" class="btn ${b.id === curBrand.id ? 'btn-primary' : 'btn-ghost'}" data-sel-brand="${b.id}" style="padding:8px 10px;font-size:0.85rem;display:flex;align-items:center;gap:6px;justify-content:center;">
                  <span>${b.icon}</span> <span>${b.name}</span>
                </button>`).join("")}
            </div>
          </div>

          <div>
            <label class="probe-label">${tr("2. Scegli il Taglio (Bonus Attributi & Gioco)", "2. Choose Shoe Cut (Gameplay Stat Buffs)")}</label>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px;margin-top:6px;">
              ${SIGNATURE_SHOE_CUTS.map(c => `
                <button type="button" class="option-card ${c.id === curCut.id ? 'selected' : ''}" data-sel-cut="${c.id}" style="padding:10px;cursor:pointer;border:${c.id === curCut.id ? '2px solid var(--signal)' : '1px solid var(--line)'};text-align:left;">
                  <div style="font-weight:800;font-size:0.95rem">${c.icon} ${isEn() ? c.nameEn : c.name}</div>
                  <div class="small-muted" style="font-size:0.8rem;margin-top:3px">${isEn() ? c.descEn : c.desc}</div>
                </button>`).join("")}
            </div>
          </div>

          <div>
            <label class="probe-label">${tr("3. Colorway di Lancio", "3. Launch Colorway")}</label>
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;">
              ${SIGNATURE_SHOE_COLORWAYS.map(w => `
                <button type="button" class="league-pill ${w.id === curColorway.id ? 'active' : ''}" data-sel-col="${w.id}">
                  ${w.icon} ${isEn() ? w.nameEn : w.name}
                </button>`).join("")}
            </div>
          </div>

          <div>
            <label class="probe-label">${tr("4. Nome del Modello", "4. Shoe Model Name")}</label>
            <input type="text" id="sig-shoe-name-input" class="probe-select" value="${defName}" maxlength="32" style="margin-top:4px;">
          </div>
        </div>`,
      options: [
        { id: "confirm", icon: "✍️", label: tr("Firma e Lancia la Scarpa sul Mercato!", "Sign and Launch Shoe to Market!"), primary: true, badge: `+${fmtMoney(bonus, cur)}`, badgeTone: "gold" },
        { id: "decline", icon: "🚫", label: tr("Rifiuta per questa estate", "Decline for this summer") },
      ],
      onSelect: id => {
        if (id === "confirm") {
          const inp = el("sig-shoe-name-input");
          const custom = inp && inp.value && inp.value.trim() ? inp.value.trim() : defName;
          signSignatureShoe(curBrand.id, curCut.id, curColorway.id, custom);
        } else {
          declineSignatureShoe();
        }
      },
    });

    const card = el("event-modal-card");
    if (card) {
      card.querySelectorAll("[data-sel-brand]").forEach(btn => {
        btn.addEventListener("click", () => {
          curBrand = SIGNATURE_SHOE_BRANDS.find(b => b.id === btn.dataset.selBrand) || curBrand;
          renderCustomizer();
        });
      });
      card.querySelectorAll("[data-sel-cut]").forEach(btn => {
        btn.addEventListener("click", () => {
          curCut = SIGNATURE_SHOE_CUTS.find(c => c.id === btn.dataset.selCut) || curCut;
          renderCustomizer();
        });
      });
      card.querySelectorAll("[data-sel-col]").forEach(btn => {
        btn.addEventListener("click", () => {
          curColorway = SIGNATURE_SHOE_COLORWAYS.find(w => w.id === btn.dataset.selCol) || curColorway;
          renderCustomizer();
        });
      });
    }
  }

  renderCustomizer();
}

function renderSponsorOffer(d, titleEl, subEl, cards, extra) {
  const cur = playerCurrency(player);
  titleEl.textContent = tr("Proposte di sponsorizzazione", "Sponsorship Offers");
  subEl.textContent = tr(`La tua popolarità (${player.popularity}) attira i marchi. Ogni accordo paga ogni anno solo se rispetti la sua condizione: se la manchi, il contratto salta. Puoi averne al massimo ${SPONSOR_MAX_ACTIVE}.`, `Your popularity (${player.popularity}) attracts brands. Each deal pays annually only if you meet its condition: miss it and the deal is void. You can have at most ${SPONSOR_MAX_ACTIVE}.`);
  cards.innerHTML = d.offers.map((o, i) => offCardHtml({
    idx: i, icon: "🤝", title: o.brand, subtitle: `${fmtMoney(o.amount, cur)}/${tr("anno", "yr")} · ${o.years} ${tr("anni", "years")}`,
    desc: `${tr("Condizione", "Condition")}: ${sponsorConditionLabel(o)}.`, tags: [{ text: `+${fmtMoney(o.amount * o.years, cur)} ${tr("in tutto", "total")}`, tone: "gold" }],
  })).join("");
  cards.querySelectorAll(".off-card").forEach(c => c.addEventListener("click", () => chooseSponsor(parseInt(c.dataset.idx))));
  extra.innerHTML = `<div class="btn-row" style="justify-content:center"><button class="btn btn-secondary" id="btn-sponsor-modal">🤝 ${tr("Rivedi le proposte", "Review offers")}</button><button class="btn btn-ghost" id="btn-no-sponsor">${tr("Nessun accordo per ora", "No deal for now")}</button></div>`;
  el("btn-no-sponsor").addEventListener("click", () => chooseSponsor(-1));
  el("btn-sponsor-modal").addEventListener("click", () => openSponsorModal(d));
  // le proposte arrivano come una cartellina dell'ufficio marketing, una sola volta
  if (!d.modalShown) { d.modalShown = true; openSponsorModal(d); }
}

function openSponsorModal(d) {
  const cur = playerCurrency(player);
  const best = d.offers.reduce((b, o, i) => (o.amount * o.years > d.offers[b].amount * d.offers[b].years ? i : b), 0);
  renderEventModal({
    tone: "gold",
    tag: tr("Ufficio marketing · Proposte di sponsor", "Marketing Dept · Sponsorship Offers"),
    meta: `${tr("Popolarità", "Popularity")} ${player.popularity}`,
    icon: "🤝",
    title: tr("I marchi ti cercano", "Brands Are Calling"),
    text: tr(`Ogni accordo paga ogni anno <strong>solo se rispetti la sua condizione</strong>: se la manchi, il marchio straccia il contratto. Puoi averne al massimo ${SPONSOR_MAX_ACTIVE} attivi${(player.sponsors || []).length ? ` (ora ne hai ${player.sponsors.length})` : ""}.`, `Each deal pays annually <strong>only if you meet its condition</strong>: miss it and the brand tears up the contract. You can have at most ${SPONSOR_MAX_ACTIVE} active deals${(player.sponsors || []).length ? ` (you currently have ${player.sponsors.length})` : ""}.`),
    options: d.offers.map((o, i) => ({
      id: String(i), icon: "✒️", label: o.brand,
      desc: `${tr("Condizione", "Condition")}: ${sponsorConditionLabel(o)} · ${o.years} ${tr("anni", "years")}, +${fmtMoney(o.amount * o.years, cur)} ${tr("in tutto", "total")}`,
      badge: `${fmtMoney(o.amount, cur)}/${tr("anno", "yr")}`, badgeTone: "gold", primary: i === best,
    })).concat([{ id: "none", icon: "🚫", label: tr("Nessun accordo per ora", "No deal for now"), desc: tr("Aspetti offerte migliori la prossima estate.", "Wait for better offers next summer.") }]),
    onSelect: id => chooseSponsor(id === "none" ? -1 : parseInt(id)),
  });
}
