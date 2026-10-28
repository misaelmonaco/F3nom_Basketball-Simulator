"use strict";

/* ================================================================
   RELAZIONI & DILEMMI MORALI (STILE NEW STAR SOCCER)
   Gestisce le 5 relazioni fondamentali del giocatore:
   1. Coach (coachTrust)
   2. Compagni / Spogliatoio (chemistry)
   3. Tifosi & Piazza (fansRapport)
   4. Stampa & Media (mediaRapport)
   5. Partner / Vita sentimentale (se presente)
   Include le azioni per migliorare i rapporti e i dilemmi morali.
   ================================================================ */

const PARTNER_OCCUPATIONS = [
  "Studentessa universitaria", "Fotografa freelance", "Atleta professionista",
  "Architetta d'interni", "Giornalista sportiva", "Musicista indie",
  "Stilista di moda", "Biologa marina", "Avvocata d'affari", "Influencer & Creator"
];
const PARTNER_OCCUPATIONS_EN = {
  "Studentessa universitaria": "University Student",
  "Fotografa freelance": "Freelance Photographer",
  "Atleta professionista": "Professional Athlete",
  "Architetta d'interni": "Interior Architect",
  "Giornalista sportiva": "Sports Journalist",
  "Musicista indie": "Indie Musician",
  "Stilista di moda": "Fashion Designer",
  "Biologa marina": "Marine Biologist",
  "Avvocata d'affari": "Corporate Lawyer",
  "Influencer & Creator": "Influencer & Creator"
};
function partnerJobLabel(job) {
  return isEn() && PARTNER_OCCUPATIONS_EN[job] ? PARTNER_OCCUPATIONS_EN[job] : job;
}

function ensureRelationships(p) {
  p = p || player;
  if (!p) return;
  if (p.coachTrust == null) p.coachTrust = 55;
  if (p.chemistry == null) p.chemistry = 70;
  if (p.fansRapport == null) p.fansRapport = clamp(p.popularity + 10, 30, 80);
  if (p.mediaRapport == null) p.mediaRapport = clamp(p.reputation || 50, 25, 75);

  p.family = p.family || { partner: false, since: null, married: null, children: [] };
  if (p.family.partner && !p.family.partnerName) {
    const localNat = (p.team && typeof nationalityOfLeague === "function" && nationalityOfLeague(p.league)) || p.nationality || "Italia";
    const nat = rollChance(50) ? (p.nationality || "Italia") : localNat;
    p.family.partnerName = typeof randomFemaleName === "function" ? randomFemaleName(nat) : randomNameFor(nat).first;
    p.family.partnerJob = choice(PARTNER_OCCUPATIONS);
    p.family.harmony = 75;
  }
}

/* Restituisce lo stato descrittivo e il colore della barra */
function rapportStatus(value) {
  const v = Math.round(value);
  if (v >= 80) return { label: tr("Eccellente", "Excellent"), tone: "up", color: "var(--up)" };
  if (v >= 60) return { label: tr("Buono", "Good"), tone: "good", color: "#3d8bfd" };
  if (v >= 40) return { label: tr("Discreto", "Fair"), tone: "mid", color: "var(--gold-text)" };
  if (v >= 25) return { label: tr("Teso", "Tense"), tone: "bad", color: "var(--signal)" };
  return { label: tr("In rottura", "Fractured"), tone: "down", color: "var(--down)" };
}

/* Modifica un parametro di relazione con feedback e clamp */
function changeRelationship(p, key, delta, reason) {
  p = p || player;
  if (!p) return;
  ensureRelationships(p);
  const oldVal = p[key] != null ? p[key] : (p.family && p.family[key]);
  if (key === "harmony" && p.family) {
    p.family.harmony = clamp((p.family.harmony || 70) + delta, 0, 100);
  } else if (p[key] != null) {
    p[key] = clamp(p[key] + delta, 0, 100);
  }
  if (reason) {
    const sign = delta > 0 ? "+" : "";
    pushNews(`${delta >= 0 ? "📈" : "📉"} ${reason} (${sign}${delta})`);
  }
}

/* Reset delle relazioni locali quando si cambia squadra (Coach, Compagni e Tifosi) */
function onTeamChangeRelationships(p) {
  p = p || player;
  if (!p) return;
  ensureRelationships(p);
  // Nuovo allenatore: fiducia da guadagnare (base 55)
  p.coachTrust = 55;
  p.starRapport = 55;
  // Nuovo spogliatoio: chimica riparte da una base neutra
  p.chemistry = clamp(randInt(55, 68), 30, 85);
  // Nuova piazza & tifosi: accoglienza calorosa proporzionata al tuo calibro (popolarità), ma devi conquistare il palazzetto
  p.fansRapport = clamp(Math.round((p.popularity || 30) * 0.5 + 30), 30, 75);
}

/* ================================================================
   RENDERING DELLA SCHEDA "RELAZIONI"
   ================================================================ */
function renderRelationshipsTab() {
  const panel = document.querySelector('[data-tab-panel="lifestyle"]') || document.querySelector('[data-tab-panel="relazioni"]');
  if (!panel || !player) return;
  ensureRelationships(player);
  const p = player;
  const fam = p.family;
  const cur = playerCurrency(p);

  const teamName = p.team ? p.team.name : tr("Squadra", "Team");
  const partnerBlock = fam.partner ? `
    <div class="card rel-partner-card">
      <div class="rel-partner-head">
        <div class="rel-avatar-ring">💍</div>
        <div>
          <div class="rel-partner-name">${fam.partnerName}</div>
          <div class="small-muted">${partnerJobLabel(fam.partnerJob)} · ${fam.married ? tr(`Sposati dal ${fam.married}`, `Married since ${fam.married}`) : tr(`Insieme dal ${fam.since}`, `Together since ${fam.since}`)}</div>
        </div>
        <div class="rel-harmony-badge" style="color:${rapportStatus(fam.harmony).color};">
          ${Math.round(fam.harmony)}%
          <small>${rapportStatus(fam.harmony).label}</small>
        </div>
      </div>
      <div class="rel-bar-wrap">
        <div class="rel-bar-fill" style="width:${Math.round(fam.harmony)}%; background:${rapportStatus(fam.harmony).color};"></div>
      </div>
      <p class="small-muted" style="margin:8px 0 12px; font-size:13px;">
        ${fam.harmony >= 75 ? tr("💞 La vostra complicità è fortissima: ti dà serenità e stabilità mentale prima di ogni gara.", "💞 Your bond is rock-solid: it gives you peace of mind and mental stability before every game.")
          : fam.harmony >= 45 ? tr("🌤️ La vita di coppia scorre tranquilla, tra le trasferte e gli impegni quotidiani.", "🌤️ Couple life flows smoothly between road trips and daily routines.")
          : tr("⚠️ Aria di crisi: le continue trasferte e la pressione dei media stanno creando forti tensioni.", "⚠️ Trouble in paradise: constant road trips and media pressure are creating heavy tension.")}
      </p>
      <div class="rel-actions-row">
        <button type="button" class="btn btn-secondary btn-sm" id="btn-rel-partner-gift">🎁 ${tr("Sorpresa romantica", "Romantic surprise")} (${fmtMoney(Math.max(0.01, p.wealth * 0.02), cur)})</button>
        <button type="button" class="btn btn-ghost btn-sm" id="btn-rel-partner-dinner">🍷 ${tr("Cena intima a due (-5 stamina)", "Intimate dinner for two (-5 stamina)")}</button>
        <button type="button" class="btn btn-ghost btn-sm" id="btn-rel-partner-vacay">🌴 ${tr("Weekend relax romantico", "Romantic getaway")} (${fmtMoney(Math.max(0.015, p.wealth * 0.015), cur)})</button>
        ${!fam.married && (fam.harmony || 0) >= 75 ? `<button type="button" class="btn btn-primary btn-sm" id="btn-rel-partner-propose" style="background:var(--gold); color:#000;">💍 ${tr("Proposta di matrimonio!", "Propose marriage!")}</button>` : ""}
        <button type="button" class="btn btn-ghost btn-sm" id="btn-rel-breakup" style="color:var(--down); border-color:rgba(255,84,104,0.35);">💔 ${fam.married ? tr("Chiedi il divorzio", "File for divorce") : tr("Chiudi la relazione", "Break up")}</button>
      </div>
    </div>` : `
    <div class="card rel-single-card">
      <div style="font-size:32px; margin-bottom:6px;">🗽</div>
      <h3 style="font-family:var(--font-display); font-size:22px; margin-bottom:4px; text-transform:uppercase;">${tr("Vita da Single", "Single Life")}</h3>
      <p class="small-muted" style="max-width:440px; margin:0 auto 14px; font-size:13.5px;">
        ${tr("Sei completamente concentrato sulla palla a spicchi e sulle tue passioni, ma le serate in città possono riservare sorprese.", "You're 100% focused on basketball and your passions, though nights out in the city might hold surprises.")}
      </p>
      <div class="rel-actions-row" style="justify-content:center;">
        <button type="button" class="btn btn-secondary btn-sm" id="btn-rel-go-out">🍸 ${tr("Serata in città con gli amici", "Night out in the city with friends")} (${fmtMoney(Math.max(0.005, p.wealth * 0.01), cur)})</button>
        <button type="button" class="btn btn-ghost btn-sm" id="btn-rel-vip-dating">📲 ${tr("App di Dating VIP per atleti", "VIP Dating App for athletes")}</button>
      </div>
    </div>`;

  const relationships = [
    {
      id: "coach",
      title: tr("Allenatore", "Head Coach"),
      sub: tr(`Staff tecnico di ${teamName}`, `${teamName} Coaching Staff`),
      icon: "🧑‍🏫",
      val: p.coachTrust,
      desc: p.coachTrust >= 75 ? tr("Piena fiducia: puoi gestire i possessi con massima libertà tattica.", "Full trust: you have green light to run possessions with tactical freedom.")
        : p.coachTrust >= 50 ? tr("Rapporto professionale solido: rispetta il piano partita.", "Solid professional relationship: stick to the game plan.")
        : tr("Fiducia ai minimi termini: al primo errore rischi la panchina.", "Trust at rock bottom: one mistake and you risk getting benched."),
      actions: [
        { id: "btn-rel-coach-video", icon: "📹", label: tr("Seduta video tattica (-5 stamina)", "Film session (-5 stamina)"), primary: true },
        { id: "btn-rel-coach-talk", icon: "💬", label: tr("Chiedi più minuti e tiri", "Ask for more minutes & shots") },
        { id: "btn-rel-coach-loyalty", icon: "🤝", label: tr("Dichiara fedeltà al piano gara", "Pledge loyalty to game plan") }
      ]
    },
    {
      id: "teammates",
      title: tr("Spogliatoio & Compagni", "Locker Room & Teammates"),
      sub: tr("Chimica del gruppo squadra", "Team group chemistry"),
      icon: "🤝",
      val: p.chemistry,
      desc: p.chemistry >= 75 ? tr("Fratelli di parquet: nei possessi caldi si fidano ciecamente di te.", "Brothers on the hardwood: in crunch time they trust you blindly.")
        : p.chemistry >= 50 ? tr("Buona convivenza tra professionisti.", "Good camaraderie among professionals.")
        : tr("Spogliatoio freddo: ti cercano poco sul perimetro e mancano gli aiuti.", "Cold locker room: they rarely look for you on the perimeter and help defense lags."),
      actions: [
        { id: "btn-rel-team-dinner", icon: "🍕", label: tr(`Cena di squadra (${fmtMoney(Math.max(0.01, p.wealth * 0.02), cur)})`, `Team dinner (${fmtMoney(Math.max(0.01, p.wealth * 0.02), cur)})`), primary: true },
        { id: "btn-rel-team-speech", icon: "👑", label: tr("Discorso da leader nel gruppo", "Leader locker room speech") },
        { id: "btn-rel-team-rookie", icon: "🎒", label: tr("Fai da mentore al Rookie (-3 stamina)", "Mentor the Rookie (-3 stamina)") },
        { id: "btn-rel-team-gifts", icon: "🎁", label: tr(`Regalo di lusso a tutti (${fmtMoney(Math.max(0.02, p.wealth * 0.03), cur)})`, `Luxury gifts for team (${fmtMoney(Math.max(0.02, p.wealth * 0.03), cur)})`) }
      ]
    },
    {
      id: "fans",
      title: tr("Tifosi & Piazza", "Fans & City"),
      sub: tr(`La curva e i sostenitori di ${teamName}`, `${teamName} supporters & home crowd`),
      icon: "📢",
      val: p.fansRapport,
      desc: p.fansRapport >= 75 ? tr("Idolo indiscusso: il palazzetto esplode a ogni tua giocata.", "Undisputed fan favorite: the arena erupts on every play you make.")
        : p.fansRapport >= 50 ? tr("Sostegno caloroso da parte del pubblico.", "Warm support from the home crowd.")
        : tr("Mormorii e fischi al primo tiro sbagliato.", "Murmurs and boos after your first missed shot."),
      actions: [
        { id: "btn-rel-fans-meet", icon: "✍️", label: tr("Meet & Greet autografi (-4 stamina)", "Autograph Meet & Greet (-4 stamina)"), primary: true },
        { id: "btn-rel-fans-social", icon: "📱", label: tr("Live Q&A con i fan sui social", "Live Q&A on social media") },
        { id: "btn-rel-fans-court", icon: "🏗️", label: tr(`Riqualifica campetto pubblico (${fmtMoney(Math.max(0.02, p.wealth * 0.025), cur)})`, `Renovate public playground (${fmtMoney(Math.max(0.02, p.wealth * 0.025), cur)})`) }
      ]
    },
    {
      id: "media",
      title: tr("Stampa & Media", "Press & Media"),
      sub: tr("Giornalisti, TV e opinionisti sportivi", "Reporters, TV networks & sports analysts"),
      icon: "🎙️",
      val: p.mediaRapport,
      desc: p.mediaRapport >= 75 ? tr("Pupillo della critica: elogi unanimi e prime pagine benevole.", "Media darling: unanimous praise and favorable headlines.")
        : p.mediaRapport >= 50 ? tr("Trattamento equilibrato dei cronisti.", "Fair coverage from beat writers.")
        : tr("Bersaglio delle polemiche: critiche aspre a ogni passo falso.", "Target of controversy: harsh criticism after every misstep."),
      actions: [
        { id: "btn-rel-media-interview", icon: "🎙️", label: tr("Intervista esclusiva / Podcast", "Exclusive interview / Podcast"), primary: true },
        { id: "btn-rel-media-bold", icon: "💣", label: tr("Dichiarazione ambiziosa pre-gara", "Bold pre-game statement") },
        { id: "btn-rel-media-leak", icon: "🤫", label: tr("Soffiata all'insider di mercato", "Leak to trade insider") }
      ]
    },
  ];

  panel.innerHTML = `
    <div class="rel-container">
      <div class="rel-hero-strap">
        <div>
          <h2 class="rel-hero-title">${tr("Lifestyle & Vita Fuori dal Campo", "Lifestyle & Off-Court Life")}</h2>
          <p class="small-muted" style="margin:2px 0 0;">${tr("Relazioni, vita privata e i tuoi acquisti personali · patrimonio disponibile", "Relationships, private life, and personal purchases · available net worth")} <strong>${fmtMoney(p.wealth, cur)}</strong>.</p>
        </div>
      </div>

      <div class="rel-grid">
        ${relationships.map(r => {
          const st = rapportStatus(r.val);
          return `
            <div class="card rel-card">
              <div class="rel-card-head">
                <span class="rel-card-icon">${r.icon}</span>
                <div class="rel-card-meta">
                  <div class="rel-card-title">${r.title}</div>
                  <div class="small-muted">${r.sub}</div>
                </div>
                <div class="rel-card-badge" style="color:${st.color};">
                  ${Math.round(r.val)}%
                  <small>${st.label}</small>
                </div>
              </div>
              <div class="rel-bar-wrap">
                <div class="rel-bar-fill" style="width:${Math.round(r.val)}%; background:${st.color};"></div>
              </div>
              <p class="rel-card-desc">${r.desc}</p>
              <div class="rel-card-foot">
                ${r.actions.map(a => `
                  <button type="button" class="btn ${a.primary ? "btn-secondary" : "btn-ghost"} btn-sm rel-act-btn" id="${a.id}">
                    ${a.icon} ${a.label}
                  </button>
                `).join("")}
              </div>
            </div>`;
        }).join("")}
      </div>

      <div style="margin-top:20px;">
        <h3 style="font-family:var(--font-display); font-size:22px; text-transform:uppercase; margin-bottom:8px; color:var(--ink);">
          ${tr("Vita Privata & Sentimenti", "Private Life & Romance")}
        </h3>
        ${partnerBlock}
      </div>

      <div style="margin-top:24px;">
        ${typeof lifestyleShopHtml === "function" ? lifestyleShopHtml(p) : ""}
      </div>
    </div>`;

  // Listener per le azioni
  const addAct = (id, fn) => {
    const b = panel.querySelector(`#${id}`);
    if (b) b.addEventListener("click", fn);
  };

  // --- AZIONI COACH ---
  addAct("btn-rel-coach-video", () => {
    if (p.stamina < 5) { toast(tr("⚠️ Troppo stanco per una sessione extra di video.", "⚠️ Too tired for an extra film session.")); return; }
    p.stamina = Math.max(0, p.stamina - 5);
    p.coachTrust = clamp(p.coachTrust + 6, 0, 100);
    p.morale = clamp(p.morale + 2, 0, 100);
    toast(tr("🧑‍🏫 Un'ora a rivedere i filmati col coach: ha apprezzato la tua dedizione (+6 fiducia).", "🧑‍🏫 Spent an hour breaking down film with the coach: he appreciated your dedication (+6 trust)."));
    renderGameScreen();
  });

  addAct("btn-rel-coach-talk", () => {
    if (p.overall >= 74 || p.morale >= 65) {
      p.coachTrust = clamp(p.coachTrust + 8, 0, 100);
      p.morale = clamp(p.morale + 6, 0, 100);
      toast(tr("💬 Il coach apprezza la tua ambizione: «Vedo la fame nei tuoi occhi, ti darò più responsabilità nei momenti caldi!» (+8 fiducia, +6 morale).", "💬 The coach appreciates your ambition: «I see the hunger in your eyes, I'll give you more crunch-time possessions!» (+8 trust, +6 morale)."));
    } else {
      p.coachTrust = Math.max(0, p.coachTrust - 4);
      p.morale = Math.max(0, p.morale - 3);
      toast(tr("💬 Il coach ti frena: «I minuti si guadagnano con la difesa e il sudore, non a parole» (-4 fiducia).", "💬 The coach checks you: «Minutes are earned through defense and sweat, not words» (-4 trust)."));
    }
    renderGameScreen();
  });

  addAct("btn-rel-coach-loyalty", () => {
    p.coachTrust = clamp(p.coachTrust + 7, 0, 100);
    p.chemistry = clamp(p.chemistry + 3, 0, 100);
    toast(tr("🤝 Dichiari piena fedeltà al piano partita: il coach ti stringe la mano stimando la tua professionalità (+7 fiducia).", "🤝 You pledge full loyalty to the game plan: the coach shakes your hand praising your professionalism (+7 trust)."));
    renderGameScreen();
  });

  // --- AZIONI COMPAGNI ---
  addAct("btn-rel-team-dinner", () => {
    const cost = roundMoney(Math.max(0.01, p.wealth * 0.02));
    if (p.wealth < cost && p.wealth > 0) { toast(tr("⚠️ Fondi insufficienti per offrire la cena alla squadra.", "⚠️ Insufficient funds to treat the team to dinner.")); return; }
    p.wealth = roundMoney(Math.max(0, p.wealth - cost));
    p.chemistry = clamp(p.chemistry + 8, 0, 100);
    p.coachTrust = clamp(p.coachTrust + 2, 0, 100);
    p.morale = clamp(p.morale + 4, 0, 100);
    toast(tr("🍕 Cena e brindisi offerti a tutta la squadra: lo spogliatoio è più unito che mai (+8 intesa).", "🍕 Dinner and drinks on you for the whole team: the locker room is closer than ever (+8 chemistry)."));
    renderGameScreen();
  });

  addAct("btn-rel-team-speech", () => {
    if ((p.overall || 70) >= 76 || (p.year || 1) >= 4) {
      p.chemistry = clamp(p.chemistry + 10, 0, 100);
      p.morale = clamp(p.morale + 6, 0, 100);
      toast(tr("👑 Discorso da vero condottiero a centro spogliatoio: tutti battono le mani carichi a molla (+10 chimica, +6 morale).", "👑 Captain's speech in the center of the locker room: everyone claps fired up (+10 chemistry, +6 morale)."));
    } else {
      p.chemistry = clamp(p.chemistry + 4, 0, 100);
      p.morale = clamp(p.morale + 2, 0, 100);
      toast(tr("👑 I veterani sorridono con affetto: apprezzano la grinta e il coraggio del giovane talento (+4 chimica).", "👑 The veterans smile warmly: they appreciate the young talent's grit and guts (+4 chemistry)."));
    }
    renderGameScreen();
  });

  addAct("btn-rel-team-rookie", () => {
    if (p.stamina < 3) { toast(tr("⚠️ Troppo affaticato per la sessione extra col rookie.", "⚠️ Too exhausted for extra drills with the rookie.")); return; }
    p.stamina = Math.max(0, p.stamina - 3);
    p.chemistry = clamp(p.chemistry + 8, 0, 100);
    p.coachTrust = clamp(p.coachTrust + 6, 0, 100);
    toast(tr("🎒 Mezz'ora extra di tiri e consigli con la matricola della squadra: ti guarda come un fratello maggiore (+8 chimica, +6 coach).", "🎒 Half hour of extra shooting and advice with the rookie: he looks up to you like a big brother (+8 chemistry, +6 coach)."));
    renderGameScreen();
  });

  addAct("btn-rel-team-gifts", () => {
    const cost = roundMoney(Math.max(0.02, p.wealth * 0.03));
    if (p.wealth < cost && p.wealth > 0) { toast(tr("⚠️ Fondi insufficienti per i regali personalizzati.", "⚠️ Insufficient funds for customized luxury gifts.")); return; }
    p.wealth = roundMoney(Math.max(0, p.wealth - cost));
    p.chemistry = clamp(p.chemistry + 14, 0, 100);
    p.popularity = clamp(p.popularity + 6, 0, 100);
    toast(tr("🎁 Orologi ed esclusive cuffie hi-tech personalizzate regalate a tutti i compagni: tripudio sui social e spogliatoio ai tuoi piedi (+14 intesa, +6 popolarità).", "🎁 Customized luxury headphones & watches gifted to the whole squad: social media uproar and total locker room love (+14 chemistry, +6 pop)."));
    renderGameScreen();
  });

  // --- AZIONI TIFOSI ---
  addAct("btn-rel-fans-meet", () => {
    if (p.stamina < 4) { toast(tr("⚠️ Sei troppo affaticato per l'evento coi tifosi.", "⚠️ You're too exhausted for the fan event.")); return; }
    p.stamina = Math.max(0, p.stamina - 4);
    p.fansRapport = clamp(p.fansRapport + 8, 0, 100);
    p.popularity = clamp(p.popularity + 2, 0, 100);
    toast(tr("✍️ Centinaia di bambini e selfie al fan store: la città ti ama sempre di più (+8 gradimento).", "✍️ Hundreds of kids and selfies at the team store: the city loves you more and more (+8 fan support)."));
    renderGameScreen();
  });

  addAct("btn-rel-fans-social", () => {
    p.fansRapport = clamp(p.fansRapport + 6, 0, 100);
    p.popularity = clamp(p.popularity + 5, 0, 100);
    p.morale = clamp(p.morale + 3, 0, 100);
    toast(tr("📱 Diretta Q&A su Instagram/TikTok con i tifosi: battute, simpatia e migliaia di commenti entusiasti (+6 tifosi, +5 popolarità).", "📱 Live Q&A on Instagram/TikTok with fans: banter, laughs, and thousands of hype comments (+6 fans, +5 pop)."));
    renderGameScreen();
  });

  addAct("btn-rel-fans-court", () => {
    const cost = roundMoney(Math.max(0.02, p.wealth * 0.025));
    if (p.wealth < cost && p.wealth > 0) { toast(tr("⚠️ Fondi insufficienti per finanziare la riqualificazione del campetto.", "⚠️ Insufficient funds to fund court renovation.")); return; }
    p.wealth = roundMoney(Math.max(0, p.wealth - cost));
    p.fansRapport = clamp(p.fansRapport + 16, 0, 100);
    p.popularity = clamp(p.popularity + 10, 0, 100);
    p.morale = clamp(p.morale + 8, 0, 100);
    pushNews(tr(`🏗️ Cuore d'oro: ${p.firstName} ${p.lastName} finanzia la ristrutturazione completa di due campetti pubblici in città!`, `🏗️ Heart of gold: ${p.firstName} ${p.lastName} finances the full renovation of two public basketball courts in the city!`));
    toast(tr("🏗️ Inaugurato il nuovo playground cittadino coi tuoi colori: la città ti proclama eroe civico (+16 tifosi, +10 popolarità).", "🏗️ New city playground opened in your team colors: the city hails you as a civic hero (+16 fans, +10 pop)."));
    renderGameScreen();
  });

  // --- AZIONI MEDIA ---
  addAct("btn-rel-media-interview", () => {
    p.mediaRapport = clamp(p.mediaRapport + 7, 0, 100);
    p.popularity = clamp(p.popularity + 2, 0, 100);
    toast(tr("🎙️ Una lunga chiacchierata informale in podcast: i giornalisti apprezzano la tua disponibilità (+7 stampa).", "🎙️ A long, candid podcast chat: reporters appreciate your openness (+7 press)."));
    renderGameScreen();
  });

  addAct("btn-rel-media-bold", () => {
    p.mediaRapport = clamp(p.mediaRapport + 10, 0, 100);
    p.popularity = clamp(p.popularity + 8, 0, 100);
    changeRelationship(p, "coachTrust", -2);
    pushNews(tr(`🔥 Dichiarazione d'acciaio: «Siamo i migliori e vogliamo vincere tutto», parola di ${p.lastName}!`, `🔥 Iron statement: «We are the best and we want it all», says ${p.lastName}!`));
    toast(tr("💣 Dichiarazione coraggiosa ai microfoni: finisci su tutti i titoli di apertura dei TG sportivi (+10 stampa, +8 popolarità).", "💣 Bold statement into the mics: you lead every sports news broadcast (+10 press, +8 pop)."));
    renderGameScreen();
  });

  addAct("btn-rel-media-leak", () => {
    p.mediaRapport = clamp(p.mediaRapport + 9, 0, 100);
    changeRelationship(p, "coachTrust", -6);
    pushNews(tr(`🤫 Voci di corridoio: «Fonti vicine a ${p.lastName} chiedono rinforzi di peso alla dirigenza prima della deadline!»`, `🤫 Rumor mill: «Sources close to ${p.lastName} urge the front office to bring in reinforcements before the deadline!»`));
    toast(tr("🤫 Messaggio anonimo all'insider di mercato: articolo bomba in prima pagina (+9 stampa, pressione sulla dirigenza).", "🤫 Anonymous tip to the trade insider: breaking news bomb on front page (+9 press, pressure on front office)."));
    renderGameScreen();
  });

  if (fam.partner) {
    addAct("btn-rel-partner-gift", () => {
      const cost = roundMoney(Math.max(0.01, p.wealth * 0.02));
      p.wealth = roundMoney(Math.max(0, p.wealth - cost));
      fam.harmony = clamp((fam.harmony || 70) + 12, 0, 100);
      p.morale = clamp(p.morale + 6, 0, 100);
      toast(tr(`🎁 Sorpresa speciale per ${fam.partnerName}: occhi lucidi e grande felicità (+12 armonia, +6 morale).`, `🎁 Special surprise for ${fam.partnerName}: happy tears and pure joy (+12 harmony, +6 morale).`));
      renderGameScreen();
    });

    addAct("btn-rel-partner-dinner", () => {
      if (p.stamina < 5) { toast(tr("⚠️ Troppo sfinito per uscire a cena stasera.", "⚠️ Too exhausted to go out for dinner tonight.")); return; }
      p.stamina = Math.max(0, p.stamina - 5);
      fam.harmony = clamp((fam.harmony || 70) + 8, 0, 100);
      p.morale = clamp(p.morale + 4, 0, 100);
      toast(tr(`🍷 Cena a lume di candela con ${fam.partnerName}: staccare dal basket vi ha fatto benissimo (+8 armonia).`, `🍷 Candlelight dinner with ${fam.partnerName}: unplugging from basketball did wonders for you two (+8 harmony).`));
      renderGameScreen();
    });

    addAct("btn-rel-partner-vacay", () => {
      const cost = roundMoney(Math.max(0.015, p.wealth * 0.015));
      if (p.wealth < cost && p.wealth > 0) { toast(tr("⚠️ Fondi insufficienti per il weekend romantico.", "⚠️ Insufficient funds for romantic getaway.")); return; }
      p.wealth = roundMoney(Math.max(0, p.wealth - cost));
      fam.harmony = clamp((fam.harmony || 70) + 15, 0, 100);
      p.morale = clamp(p.morale + 10, 0, 100);
      p.stamina = 100;
      toast(tr(`🌴 Tre giorni di relax totale con ${fam.partnerName} in un resort esclusivo: armonia alle stelle e batterie ricaricate al 100%! (+15 armonia, stamina 100%).`, `🌴 Three days of pure bliss with ${fam.partnerName} at a private resort: harmony through the roof and batteries 100% recharged! (+15 harmony, 100% stamina).`));
      renderGameScreen();
    });

    addAct("btn-rel-partner-propose", () => {
      const ringCost = roundMoney(Math.max(0.03, p.wealth * 0.04));
      if (p.wealth < ringCost && p.wealth > 0) { toast(tr("⚠️ Serve un anello all'altezza del momento! Fondi insufficienti.", "⚠️ You need a ring worthy of the moment! Insufficient funds.")); return; }
      p.wealth = roundMoney(Math.max(0, p.wealth - ringCost));
      fam.married = p.year;
      fam.harmony = 100;
      p.morale = clamp(p.morale + 20, 0, 100);
      p.popularity = clamp(p.popularity + 8, 0, 100);
      pushNews(tr(`💍 FIORI D'ARANCIO: Proposta da favola! ${p.firstName} ${p.lastName} e ${fam.partnerName} si sposano!`, `💍 WEDDING BELLS: Fairy tale proposal! ${p.firstName} ${p.lastName} and ${fam.partnerName} are getting married!`));
      toast(tr(`💍 HA DETTO SÌ! Tu e ${fam.partnerName} vi sposerete! Momento magico e indimenticabile (+20 morale, armonia 100%).`, `💍 SHE SAID YES! You and ${fam.partnerName} are tying the knot! Unforgettable magical moment (+20 morale, 100% harmony).`));
      renderGameScreen();
    });

    addAct("btn-rel-breakup", () => {
      const isMarried = !!fam.married;
      const exName = fam.partnerName;
      const confirmMsg = isMarried
        ? tr(
            `Sei sicuro di voler chiedere il divorzio da ${exName}? La separazione legale comporterà una divisione dei beni.`,
            `Are you sure you want to file for divorce from ${exName}? The legal settlement will divide personal assets.`
          )
        : tr(
            `Sei sicuro di voler chiudere la relazione con ${exName}?`,
            `Are you sure you want to break up with ${exName}?`
          );
      if (!confirm(confirmMsg)) return;

      const wasCrisis = (fam.harmony || 70) < 45;
      fam.partner = false;
      fam.since = null;
      fam.married = null;
      fam.partnerName = null;
      fam.partnerJob = null;
      fam.harmony = null;

      if (isMarried) {
        const divorceCost = roundMoney(Math.max(0.05, p.wealth * 0.15));
        p.wealth = roundMoney(Math.max(0, p.wealth - divorceCost));
        p.morale = clamp(p.morale - 12, 0, 100);
        pushNews(tr(
          `💔 Divorzio milionario: tu e ${exName} vi siete separati legalmente (costo accordo: ${fmtMoney(divorceCost, cur)}).`,
          `💔 High-profile divorce: you and ${exName} legally separated (settlement: ${fmtMoney(divorceCost, cur)}).`
        ));
        toast(tr(`💔 Hai finalizzato la separazione da ${exName}. Torni single.`, `💔 You finalized your divorce from ${exName}. You are single again.`));
      } else if (wasCrisis) {
        p.morale = clamp(p.morale + 4, 0, 100);
        pushNews(tr(
          `💔 Rottura inevitabile: dopo mesi di incomprensioni, tu e ${exName} avete deciso di prendere strade separate.`,
          `💔 Inevitable breakup: after months of friction, you and ${exName} decided to part ways.`
        ));
        toast(tr(`💔 Ti sei lasciato con ${exName}. Torni single (+4 morale).`, `💔 You broke up with ${exName}. You are single again (+4 morale).`));
      } else {
        p.morale = clamp(p.morale - 8, 0, 100);
        pushNews(tr(
          `💔 Rottura sentimentale: è finita la storia tra te e ${exName}.`,
          `💔 Breakup: the romance between you and ${exName} has come to an end.`
        ));
        toast(tr(`💔 Hai chiuso la relazione con ${exName}. Torni single (-8 morale).`, `💔 You broke up with ${exName}. You are single again (-8 morale).`));
      }

      if (typeof createSocialPost === "function") {
        createSocialPost(p, {
          kind: "media",
          when: isEn() ? `Season ${p.year}` : `Stagione ${p.year}`,
          author: "Courtside Gossip",
          handle: "@CourtsideGossip",
          badge: "📸 Gossip",
          verified: true,
          avatar: "📸",
          text: isEn()
            ? `💔 IT'S OVER: Star player ${p.firstName} ${p.lastName} and ${exName} have officially called it quits. Sources say ${p.lastName} is back on the market! 👀`
            : `💔 È FINITA: La stella ${p.firstName} ${p.lastName} e ${exName} si sono detti addio. Secondo fonti vicine alla coppia, ${p.lastName} torna ufficialmente single! 👀`,
        });
      }

      renderGameScreen();
    });
  } else {
    addAct("btn-rel-go-out", () => {
      const cost = roundMoney(Math.max(0.005, p.wealth * 0.01));
      p.wealth = roundMoney(Math.max(0, p.wealth - cost));
      if (rollChance(40)) {
        fam.partner = true;
        fam.since = p.year;
        const localNat = (p.team && typeof nationalityOfLeague === "function" && nationalityOfLeague(p.league)) || p.nationality || "Italia";
        const partnerNat = rollChance(50) ? (p.nationality || "Italia") : localNat;
        fam.partnerName = typeof randomFemaleName === "function" ? randomFemaleName(partnerNat) : randomNameFor(partnerNat).first;
        fam.partnerJob = choice(PARTNER_OCCUPATIONS);
        fam.harmony = 80;
        p.morale = clamp(p.morale + 10, 0, 100);
        pushNews(tr(`💞 Incontro magico: a una serata conosci ${fam.partnerName} (${fam.partnerJob}) ed è subito colpo di fulmine!`, `💞 Magical encounter: on a night out you meet ${fam.partnerName} (${partnerJobLabel(fam.partnerJob)}) and sparks fly right away!`));
        toast(tr(`💞 Hai conosciuto ${fam.partnerName}! È iniziata una storia speciale.`, `💞 You met ${fam.partnerName}! A special romance has begun.`));
      } else {
        p.morale = clamp(p.morale + 4, 0, 100);
        p.fansRapport = clamp(p.fansRapport + 2, 0, 100);
        toast(tr("🍸 Bella serata spensierata in centro con amici: un po' di svago ti rimette in sesto (+4 morale).", "🍸 Carefree night out downtown with friends: a little downtime recharges your batteries (+4 morale)."));
      }
      renderGameScreen();
    });

    addAct("btn-rel-vip-dating", () => {
      const appCost = roundMoney(Math.max(0.002, p.wealth * 0.005));
      p.wealth = roundMoney(Math.max(0, p.wealth - appCost));
      if (rollChance(60)) {
        fam.partner = true;
        fam.since = p.year;
        const localNat = (p.team && typeof nationalityOfLeague === "function" && nationalityOfLeague(p.league)) || p.nationality || "Italia";
        const partnerNat = rollChance(50) ? (p.nationality || "Italia") : localNat;
        fam.partnerName = typeof randomFemaleName === "function" ? randomFemaleName(partnerNat) : randomNameFor(partnerNat).first;
        fam.partnerJob = choice(["Influencer & Creator", "Modella internazionale", "Attrice emergente", "Stilista di moda", "DJ & Producer"]);
        fam.harmony = 85;
        p.morale = clamp(p.morale + 12, 0, 100);
        pushNews(tr(`📲 MATCH PERFETTO: Sull'app VIP scatta l'intesa con ${fam.partnerName} (${fam.partnerJob})! Iniziate a frequentarvi ufficialmente.`, `📲 PERFECT MATCH: On the VIP dating app you hit it off with ${fam.partnerName} (${partnerJobLabel(fam.partnerJob)})! You start officially dating.`));
        toast(tr(`📲 È nata una nuova coppia! Tu e ${fam.partnerName} state insieme (+12 morale).`, `📲 A new power couple is born! You and ${fam.partnerName} are dating (+12 morale).`));
      } else {
        p.morale = clamp(p.morale + 2, 0, 100);
        toast(tr("📲 Scorri vari profili celebri e scambi qualche messaggio brillante: bella botta di autostima (+2 morale).", "📲 Swiped through famous profiles and had a fun chat: nice confidence boost (+2 morale)."));
      }
      renderGameScreen();
    });
  }

  // Listener acquisti e categorie Lifestyle
  panel.querySelectorAll("[data-lifestyle-cat]").forEach(b => {
    b.addEventListener("click", () => {
      if (typeof setLifestyleCategory === "function") {
        setLifestyleCategory(b.dataset.lifestyleCat);
      }
    });
  });
  panel.querySelectorAll("[data-buy-lifestyle]").forEach(b => {
    b.addEventListener("click", () => {
      if (typeof buyLifestyle === "function") {
        buyLifestyle(b.dataset.buyLifestyle);
      }
    });
  });
}

function renderLifestyleTab() {
  renderRelationshipsTab();
}

/* ================================================================
   DILEMMI MORALI & SCELTE DI VITA (IN MODALE EVENTO)
   ================================================================ */
const MORAL_DILEMMAS = [
  {
    id: "night_out",
    title: "La Notte Brava del Compagno",
    icon: "🍸",
    tag: "Dilemma di Spogliatoio",
    text: "Il tuo compagno di squadra e secondo miglior marcatore fa le 5 del mattino in discoteca prima di una partita importante. Il coach nota la sua lentezza e ti chiama a colloquio: «Sai qualcosa di dove fosse ieri sera?»",
    options: [
      {
        id: "cover", icon: "🤫", label: "Coprilo inventando una scusa",
        desc: "«Aveva una leggera influenza intestinale, coach». Lo proteggi davanti a tutti.",
        badge: "Compagni +10 · Coach −8", badgeTone: "good",
        apply: p => {
          changeRelationship(p, "chemistry", 10);
          changeRelationship(p, "coachTrust", -8);
          p.morale = clamp(p.morale + 2, 0, 100);
        }
      },
      {
        id: "snitch", icon: "🗣️", label: "Dici la verità all'allenatore",
        desc: "«Coach, la squadra viene prima di tutto: ha fatto tardi nei locali».",
        badge: "Coach +10 · Compagni −14", badgeTone: "bad",
        apply: p => {
          changeRelationship(p, "coachTrust", 10);
          changeRelationship(p, "chemistry", -14);
          p.morale = clamp(p.morale - 4, 0, 100);
        }
      },
      {
        id: "direct", icon: "👊", label: "Resti vago, ma affronti il compagno",
        desc: "Non fai la spia col coach, ma nello spogliatoio gli urli in faccia che deve dare l'anima in campo.",
        badge: "Leadership +1 · Chimica +4", badgeTone: "gold",
        apply: p => {
          changeRelationship(p, "chemistry", 4);
          changeRelationship(p, "coachTrust", 2);
          p.morale = clamp(p.morale + 3, 0, 100);
        }
      }
    ]
  },
  {
    id: "partner_anniversary",
    title: "Cena di Squadra vs Anniversario",
    icon: "💍",
    tag: "Dilemma Personale",
    text: "È la sera dell'anniversario con la tua compagna, ma la squadra ha indetto una cena obbligatoria per rinsaldare il gruppo dopo un periodo turbolento.",
    options: [
      {
        id: "team", icon: "🍕", label: "Scegli la cena di squadra",
        desc: "Spieghi alla partner che il tuo dovere professionale viene prima, rimandando a data da destinarsi.",
        badge: "Compagni +10 · Partner −15", badgeTone: "good",
        apply: p => {
          changeRelationship(p, "chemistry", 10);
          changeRelationship(p, "harmony", -15);
        }
      },
      {
        id: "partner", icon: "🥂", label: "Fuga romantica con la partner",
        desc: "Salti la cena di squadra per dedicarti interamente a lei a lume di candela.",
        badge: "Partner +16 · Coach −6 · Compagni −6", badgeTone: "gold",
        apply: p => {
          changeRelationship(p, "harmony", 16);
          changeRelationship(p, "chemistry", -6);
          changeRelationship(p, "coachTrust", -6);
          p.morale = clamp(p.morale + 5, 0, 100);
        }
      },
      {
        id: "invite", icon: "🤝", label: "Porti la partner alla cena di gruppo",
        desc: "Paghi il conto per tutti e la presenti con orgoglio ai compagni.",
        badge: "Compagni +5 · Partner +6 · Spesa", badgeTone: "good",
        apply: p => {
          p.wealth = roundMoney(Math.max(0, p.wealth - Math.max(0.01, p.wealth * 0.02)));
          changeRelationship(p, "chemistry", 5);
          changeRelationship(p, "harmony", 6);
        }
      }
    ]
  },
  {
    id: "heckler",
    title: "Il Provocatore al Ristorante",
    icon: "📱",
    tag: "Dilemma Pubblico",
    text: "Sei a cena e un tifoso rivale ti riprende con lo smartphone prendendoti in giro pesantemente per l'ultimo tiro sbagliato e cercando la rissa per fare visualizzazioni sui social.",
    options: [
      {
        id: "class", icon: "✍️", label: "Sorridi, gli offri il dessert e firmi un autografo",
        desc: "Disinneschi la provocazione con classe totale: il video diventa virale come esempio di fair play.",
        badge: "Tifosi +12 · Media +10 · Popolarità +4", badgeTone: "up",
        apply: p => {
          changeRelationship(p, "fansRapport", 12);
          changeRelationship(p, "mediaRapport", 10);
          p.popularity = clamp(p.popularity + 4, 0, 100);
        }
      },
      {
        id: "anger", icon: "🤬", label: "Ti alzi e gli intimi di cancellare il video",
        desc: "Vola qualche spintone: il video finisce sui tabloid di gossip scandalistico.",
        badge: "Media −12 · Coach −8 · Popolarità trash", badgeTone: "bad",
        apply: p => {
          changeRelationship(p, "mediaRapport", -12);
          changeRelationship(p, "coachTrust", -8);
          p.popularity = clamp(p.popularity + 5, 0, 100);
          p.morale = clamp(p.morale - 5, 0, 100);
        }
      },
      {
        id: "ignore", icon: "🚪", label: "Chiedi il conto e te ne vai in silenzio",
        desc: "Eviti qualsiasi guaio, ma la provocazione ti lascia l'amaro in bocca.",
        badge: "Nessun danno pubblico · Morale −3", badgeTone: "",
        apply: p => {
          p.morale = clamp(p.morale - 3, 0, 100);
        }
      }
    ]
  },
  {
    id: "referee_fury",
    title: "La Furia con la Terna Arbitrale",
    icon: "⚖️",
    tag: "Dilemma Mediatico",
    text: "Un fischio assurdo e palesemente errato sulla sirena costa la vittoria alla tua squadra. Nella sala interviste i giornalisti ti mettono il microfono sotto il naso per avere il titolo scandalistico.",
    options: [
      {
        id: "attack", icon: "💥", label: "«È una vergogna, arbitraggio scandaloso!»",
        desc: "Ti sfoghi senza freni. I tifosi ti acclamano come tribuno, ma la Lega ti multa immediatamente.",
        badge: "Tifosi +14 · Multa 10k · Media +viral", badgeTone: "gold",
        apply: p => {
          changeRelationship(p, "fansRapport", 14);
          p.wealth = roundMoney(Math.max(0, p.wealth - 0.01));
          p.polemicCount = (p.polemicCount || 0) + 1;
        }
      },
      {
        id: "calm", icon: "🧘", label: "«Gli arbitri sbagliano come noi: nessun alibi»",
        desc: "Risposta da veterano navigato: il coach e la società apprezzano la maturità.",
        badge: "Coach +10 · Media +6 · Tifosi borbottano", badgeTone: "good",
        apply: p => {
          changeRelationship(p, "coachTrust", 10);
          changeRelationship(p, "mediaRapport", 6);
          changeRelationship(p, "fansRapport", -4);
        }
      }
    ]
  },
  {
    id: "veteran_farewell",
    title: "L'Ultimo Ballo del Veterano",
    icon: "👴",
    tag: "Dilemma di Spogliatoio",
    text: "Un veterano amatissimo nello spogliatoio ma ormai fuori dalle rotazioni ti prende da parte: «È la mia ultima stagione, vorrei solo giocare due minuti per salutare il pubblico stasera. Puoi parlarne al coach per me?»",
    options: [
      {
        id: "help", icon: "🤝", label: "Vai dal coach e spendi la tua parola",
        desc: "Chiedi al coach di concedergli quei minuti anche a costo di sacrificare il tuo minutaggio.",
        badge: "Compagni +14 · Morale +5", badgeTone: "up",
        apply: p => {
          changeRelationship(p, "chemistry", 14);
          p.morale = clamp(p.morale + 5, 0, 100);
        }
      },
      {
        id: "refuse", icon: "🤐", label: "«Non posso intromettermi nelle scelte del coach»",
        desc: "Rispetti le gerarchie tecniche, ma nello spogliatoio cala il gelo.",
        badge: "Compagni −10 · Coach +4", badgeTone: "bad",
        apply: p => {
          changeRelationship(p, "chemistry", -10);
          changeRelationship(p, "coachTrust", 4);
        }
      }
    ]
  },
  {
    id: "shady_bet",
    title: "La Soffiata Proibita",
    icon: "🎲",
    tag: "Dilemma Etico",
    text: "Un amico d'infanzia ti contatta con insistenza prima del big match: «So che il nostro centro titolare si è fatto male in rifinitura ma non è ancora ufficiale. Se me lo confermi ci metto sopra una puntata pesante e dividiamo il bottino».",
    options: [
      {
        id: "denounce", icon: "🛡️", label: "«Vergognati, non parlarmi mai più di scommesse»",
        desc: "Blocchi il contatto e segnali immediatamente l'accaduto al responsabile dell'integrità della squadra.",
        badge: "Coach +10 · Integrità assoluta · Morale −2", badgeTone: "good",
        apply: p => {
          changeRelationship(p, "coachTrust", 10);
          changeRelationship(p, "mediaRapport", 6);
          p.morale = clamp(p.morale - 2, 0, 100);
        }
      },
      {
        id: "refuse_quiet", icon: "🤐", label: "Rifiuti seccamente in privato senza fare la spia",
        desc: "«Cancella il messaggio e scordatelo. Per me finisce qui». Eviti guai ma chiudi la conversazione.",
        badge: "Nessun impatto pubblico", badgeTone: "",
        apply: p => {
          p.morale = clamp(p.morale + 1, 0, 100);
        }
      },
      {
        id: "leak", icon: "💸", label: "«Ti dico solo che ho mal di schiena pure io... 😉»",
        desc: "Passi un indizio sottobanco. Il leak viene intercettato da un'inchiesta giornalistica sportiva.",
        badge: "Media −16 · Coach −15 · Reputazione a picco", badgeTone: "bad",
        apply: p => {
          changeRelationship(p, "coachTrust", -15);
          changeRelationship(p, "mediaRapport", -16);
          p.reputation = clamp((p.reputation || 50) - 15, 0, 100);
          p.morale = clamp(p.morale - 8, 0, 100);
        }
      }
    ]
  },
  {
    id: "charity_fatigue",
    title: "La Visita al Reparto Pediatrico",
    icon: "🧸",
    tag: "Dilemma Sociale",
    text: "Rientri alle 4 del mattino da un doppio overtime massacrante. Alle 10:00 c'è la visita benefica della squadra all'ospedale pediatrico: i bambini ricoverati aspettano di vederti con ansia, ma sei sfinito.",
    options: [
      {
        id: "go_and_donate", icon: "🎁", label: "Stringi i denti, vai all'ospedale e porti doni",
        desc: "Compri giocattoli per l'intero reparto e firmi magliette fino all'ultimo bambino.",
        badge: "Tifosi +16 · Morale +10 · Stamina −6 · Donazione", badgeTone: "up",
        apply: p => {
          p.stamina = Math.max(0, p.stamina - 6);
          p.wealth = roundMoney(Math.max(0, p.wealth - Math.max(0.01, p.wealth * 0.015)));
          changeRelationship(p, "fansRapport", 16);
          changeRelationship(p, "mediaRapport", 8);
          p.morale = clamp(p.morale + 10, 0, 100);
        }
      },
      {
        id: "video_message", icon: "📱", label: "Videomessaggio commosso e bonifico a distanza",
        desc: "Invii un video personalizzato ai bambini e una cospicua donazione, concedendoti qualche ora di riposo.",
        badge: "Tifosi +6 · Spesa · Riposo preservato", badgeTone: "good",
        apply: p => {
          p.wealth = roundMoney(Math.max(0, p.wealth - Math.max(0.005, p.wealth * 0.01)));
          changeRelationship(p, "fansRapport", 6);
        }
      },
      {
        id: "skip_sleep", icon: "😴", label: "Salti l'evento per recuperare il sonno",
        desc: "«Il mio corpo ha bisogno di dormire per rendere in campo». I media locali notano la tua assenza.",
        badge: "Stamina +8 · Tifosi −8 · Media critici −6", badgeTone: "bad",
        apply: p => {
          p.stamina = clamp(p.stamina + 8, 0, 100);
          changeRelationship(p, "fansRapport", -8);
          changeRelationship(p, "mediaRapport", -6);
        }
      }
    ]
  },
  {
    id: "junk_food_deal",
    title: "Lo Sponsor Alimentare Discusso",
    icon: "🥤",
    tag: "Dilemma Commerciale",
    text: "Un colosso delle bevande energetiche iper-zuccherate ti offre una sponsorizzazione ricchissima per una campagna rivolta ai giovanissimi. Il nutrizionista e il preparatore atletico si oppongono: «Sei un modello per tanti ragazzi, non bere quel veleno».",
    options: [
      {
        id: "accept_cash", icon: "💰", label: "«Business is business»: accetti l'assegno faraonico",
        desc: "Incassi una cifra straordinaria, ma le associazioni di genitori e i media sollevano polemiche.",
        badge: "Guadagni ++ · Coach −6 · Critiche", badgeTone: "gold",
        apply: p => {
          p.wealth = roundMoney(p.wealth + Math.max(0.04, p.wealth * 0.05));
          changeRelationship(p, "coachTrust", -6);
          changeRelationship(p, "mediaRapport", -4);
        }
      },
      {
        id: "reject_healthy", icon: "🥗", label: "Rifiuti la proposta a favore della salute dei giovani",
        desc: "Dichiari: «Promuovo solo corretta alimentazione per i ragazzi». Elogio unanime di medici e tifosi.",
        badge: "Tifosi +14 · Media +10 · Coach +8", badgeTone: "up",
        apply: p => {
          changeRelationship(p, "fansRapport", 14);
          changeRelationship(p, "mediaRapport", 10);
          changeRelationship(p, "coachTrust", 8);
        }
      },
      {
        id: "playground_clause", icon: "🏀", label: "Accetti solo se finanziano playground gratuiti",
        desc: "Condizioni l'accordo alla riqualificazione di campetti pubblici nei quartieri popolari della città.",
        badge: "Popolarità +8 · Tifosi +12 · Guadagni +", badgeTone: "good",
        apply: p => {
          p.wealth = roundMoney(p.wealth + Math.max(0.015, p.wealth * 0.02));
          changeRelationship(p, "fansRapport", 12);
          p.popularity = clamp(p.popularity + 8, 0, 100);
        }
      }
    ]
  },
  {
    id: "rookie_bullying",
    title: "Il Battesimo del Rookie",
    icon: "🎒",
    tag: "Dilemma di Spogliatoio",
    text: "I veterani della squadra stanno esagerando con la matricola: dopo avergli riempito l'auto di popcorn, lo costringono a trasportare borsoni sotto il diluvio. Il ragazzo è sull'orlo di una crisi di nervi.",
    options: [
      {
        id: "defend_rookie", icon: "🛡️", label: "Intervieni con fermezza e difendi la matricola",
        desc: "«Basta con queste pagliacciate, siamo professionisti». Lo prendi sotto la tua ala protettrice.",
        badge: "Chimica +8 · Coach +6 · Rispetto reciproco", badgeTone: "up",
        apply: p => {
          changeRelationship(p, "chemistry", 8);
          changeRelationship(p, "coachTrust", 6);
          p.morale = clamp(p.morale + 4, 0, 100);
        }
      },
      {
        id: "join_veterans", icon: "😈", label: "Ti unisci allo scherzo: «È il rito di passaggio!»",
        desc: "I veterani ridono di gusto con te, ma il rookie si sente isolato e demotivato.",
        badge: "Veterani affiatati +4 · Rookie spento", badgeTone: "bad",
        apply: p => {
          changeRelationship(p, "chemistry", 4);
          p.morale = clamp(p.morale - 2, 0, 100);
        }
      },
      {
        id: "ignore", icon: "🎧", label: "Metti le cuffie e ti isoli concentrato sulla gara",
        desc: "Non prendi posizione e resti nella tua bolla senza farti distrarre dalle dinamiche interne.",
        badge: "Nessun impatto", badgeTone: "",
        apply: () => {}
      }
    ]
  },
  {
    id: "rival_rumor",
    title: "Le Sirene dei Rivali Storici",
    icon: "🔥",
    tag: "Dilemma di Mercato",
    text: "Circolano voci insistenti: la squadra storicamente più odiata dalla tua tifoseria ti vorrebbe a tutti i costi per la prossima estate. I giornalisti in conferenza chiedono una presa di posizione secca.",
    options: [
      {
        id: "pledge_loyalty", icon: "❤️", label: "«Mai con loro: il mio cuore appartiene a questi colori»",
        desc: "Dichiarazione d'amore eterno: i tifosi impazziscono di gioia e la curva intona cori per te.",
        badge: "Tifosi +18 · Coach +6 · Popolarità +6", badgeTone: "up",
        apply: p => {
          changeRelationship(p, "fansRapport", 18);
          changeRelationship(p, "coachTrust", 6);
          p.popularity = clamp(p.popularity + 6, 0, 100);
        }
      },
      {
        id: "open_doors", icon: "💼", label: "«Nel basket moderno si valuta qualsiasi offerta»",
        desc: "Risposta glaciale da professionista: i tifosi mugugnano furiosi, la stampa ci ricama per settimane.",
        badge: "Tifosi −14 · Media scatenati +10", badgeTone: "bad",
        apply: p => {
          changeRelationship(p, "fansRapport", -14);
          changeRelationship(p, "mediaRapport", 10);
        }
      },
      {
        id: "no_comment", icon: "🤐", label: "«Penso solo al campo, al resto pensa il mio agente»",
        desc: "Risposta standard da protocollo: getti acqua sul fuoco senza scontentare nessuno.",
        badge: "Coach +4 · Equilibrio", badgeTone: "good",
        apply: p => {
          changeRelationship(p, "coachTrust", 4);
        }
      }
    ]
  },
  {
    id: "partner_career_gala",
    title: "La Serata di Gala della Compagna",
    icon: "💃",
    tag: "Dilemma Personale",
    requiresPartner: true,
    text: "La tua partner ha ricevuto una prestigiosa onorificenza per il suo lavoro e terrà il discorso principale al galà annuale. Nello stesso orario il coach ha fissato una sessione video tattica facoltativa prima del decollo.",
    options: [
      {
        id: "attend_gala", icon: "🥂", label: "Indossi lo smoking e sei al suo fianco in prima fila",
        desc: "Lei è raggiante di gioia per il tuo sostegno, anche se il coach nota la tua sedia vuota al video.",
        badge: "Partner +20 · Morale +8 · Coach −4", badgeTone: "up",
        apply: p => {
          changeRelationship(p, "harmony", 20);
          changeRelationship(p, "coachTrust", -4);
          p.morale = clamp(p.morale + 8, 0, 100);
        }
      },
      {
        id: "stay_tactics", icon: "📹", label: "Resti al video: il basket viene prima di tutto",
        desc: "Rispetti ogni impegno societario al 100%, ma al rientro a casa l'atmosfera è glaciale.",
        badge: "Coach +6 · Partner −16", badgeTone: "bad",
        apply: p => {
          changeRelationship(p, "coachTrust", 6);
          changeRelationship(p, "harmony", -16);
          p.morale = clamp(p.morale - 4, 0, 100);
        }
      },
      {
        id: "surprise_appearance", icon: "💐", label: "Fai un salto rapido con un mazzo di rose e poi corri al video",
        desc: "Fai una sorpresa emozionante, bacio sul palco e corsa contro il tempo per arrivare in orario alla sala video.",
        badge: "Partner +10 · Spesa · Coach compiacente +2", badgeTone: "good",
        apply: p => {
          changeRelationship(p, "harmony", 10);
          changeRelationship(p, "coachTrust", 2);
          p.wealth = roundMoney(Math.max(0, p.wealth - 0.005));
        }
      }
    ]
  },
  {
    id: "risky_injection",
    title: "L'Infiltrazione alla Caviglia",
    icon: "💉",
    tag: "Dilemma Fisico",
    text: "Alla vigilia di una partita chiave per la classifica, la tua caviglia è infiammata. Lo staff medico ti propone un'infiltrazione locale: «Non sentirai nulla per due ore, ma forzare sull'articolazione anestetizzata potrebbe logorarla nel tempo».",
    options: [
      {
        id: "take_injection", icon: "⚔️", label: "«Fatemi la puntura, non mollo i compagni sul parquet»",
        desc: "Stringi i denti e giochi con foga. Il coach e i compagni ti eleggono a condottiero.",
        badge: "Compagni +14 · Coach +12 · Fragilità +6 · Morale +4", badgeTone: "up",
        apply: p => {
          changeRelationship(p, "chemistry", 14);
          changeRelationship(p, "coachTrust", 12);
          p.fragility = clamp(p.fragility + 6, 0, 100);
          p.morale = clamp(p.morale + 4, 0, 100);
        }
      },
      {
        id: "sit_out", icon: "🛋️", label: "«Non rischio il tendine per una gara di regular season»",
        desc: "Decidi di curarti senza forzare. Il coach rispetta la scelta, ma i compagni avrebbero voluto il tuo aiuto.",
        badge: "Salute preservata · Compagni −6 · Coach −4", badgeTone: "bad",
        apply: p => {
          changeRelationship(p, "chemistry", -6);
          changeRelationship(p, "coachTrust", -4);
          p.fragility = clamp(p.fragility - 2, 0, 100);
        }
      },
      {
        id: "minutes_restriction", icon: "⏱️", label: "«Entro solo 10 minuti di emergenza senza puntura»",
        desc: "Ti metti a disposizione partendo dalla panchina con un minutaggio contingentato.",
        badge: "Coach +6 · Compagni +6 · Senza danni", badgeTone: "good",
        apply: p => {
          changeRelationship(p, "coachTrust", 6);
          changeRelationship(p, "chemistry", 6);
        }
      }
    ]
  },
  {
    id: "single_nightclub",
    title: "Il Flirt da Copertina",
    icon: "📸",
    tag: "Dilemma Gossip",
    requiresSingle: true,
    text: "Sei single e a un party esclusivo dopo una grande vittoria vieni immortalato a bordo piscina con una celebrità dello spettacolo. La mattina dopo le foto finiscono su tutti i siti di cronaca rosa con titoli allusivi.",
    options: [
      {
        id: "embrace_spotlight", icon: "😎", label: "Condividi il post e scherzi con ironia",
        desc: "Cavalchi il buzz mediatico: centinaia di migliaia di visualizzazioni e fan in visibilio.",
        badge: "Popolarità +8 · Media +10 · Coach −4", badgeTone: "gold",
        apply: p => {
          p.popularity = clamp(p.popularity + 8, 0, 100);
          changeRelationship(p, "mediaRapport", 10);
          changeRelationship(p, "coachTrust", -4);
        }
      },
      {
        id: "deny_firmly", icon: "🏀", label: "«Ero lì solo per festeggiare, penso solo al basket»",
        desc: "Smentisci ogni distrazione: il coach elogia il tuo rigore professionale.",
        badge: "Coach +8 · Tifosi +6 · Media placati", badgeTone: "good",
        apply: p => {
          changeRelationship(p, "coachTrust", 8);
          changeRelationship(p, "fansRapport", 6);
        }
      },
      {
        id: "invite_privately", icon: "💌", label: "Le scrivi in privato e organizzate un'uscita riservata",
        desc: "Nasce un'intesa inaspettata lontana dai riflettori.",
        badge: "Possibile storia d'amore · Morale +8", badgeTone: "up",
        apply: p => {
          p.morale = clamp(p.morale + 8, 0, 100);
          if (rollChance(50)) {
            p.family.partner = true;
            p.family.since = p.year;
            const localNat = (p.team && typeof nationalityOfLeague === "function" && nationalityOfLeague(p.league)) || p.nationality || "Italia";
            const partnerNat = rollChance(50) ? (p.nationality || "Italia") : localNat;
            p.family.partnerName = typeof randomFemaleName === "function" ? randomFemaleName(partnerNat) : randomNameFor(partnerNat).first;
            p.family.partnerJob = choice(PARTNER_OCCUPATIONS);
            p.family.harmony = 82;
            pushNews(`💞 Da quel flirt è nato un amore sincero: tu e ${p.family.partnerName} fate coppia fissa!`);
          }
        }
      }
    ]
  }
];

/* Verifica se far scattare un dilemma morale durante un blocco di stagione (circa 25% di chance) */
function maybeTriggerMoralDilemma(p) {
  p = p || player;
  if (!p || !rollChance(25)) return null;
  ensureRelationships(p);
  const allPool = typeof getAllDilemmas === "function" ? getAllDilemmas() : MORAL_DILEMMAS;
  p.seenDilemmas = p.seenDilemmas || [];
  
  // Preferisci dilemmi non ancora visti nella carriera recente
  let pool = allPool.filter(d => !p.seenDilemmas.includes(d.id));
  if (!pool.length) {
    p.seenDilemmas = [];
    pool = allPool;
  }
  
  const eligible = pool.filter(d => {
    if (d.requiresPartner && (!p.family || !p.family.partner)) return false;
    if (d.id === "partner_anniversary" && (!p.family || !p.family.partner)) return false;
    if (d.requiresSingle && p.family && p.family.partner) return false;
    return true;
  });
  if (!eligible.length) return null;
  const picked = choice(eligible);
  p.seenDilemmas.push(picked.id);
  return picked;
}

/* Mostra il dilemma morale in una modale evento */
function openMoralDilemmaModal(dilemma, onResolved) {
  if (!dilemma) return;
  renderEventModal({
    tone: "live",
    tag: dilemma.tag || tr("Dilemma Morale", "Moral Dilemma"),
    meta: tr("Scelta Fuori dal Campo", "Off-Court Choice"),
    icon: dilemma.icon,
    title: dilemma.title,
    text: dilemma.text,
    options: dilemma.options.map(o => ({
      id: o.id,
      icon: o.icon,
      label: o.label,
      desc: o.desc,
      badge: o.badge,
      badgeTone: o.badgeTone
    })),
    onSelect: choiceId => {
      const opt = dilemma.options.find(o => o.id === choiceId);
      if (opt && opt.apply) opt.apply(player);
      if (onResolved) onResolved();
      renderGameScreen();
    }
  });
}
