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

function ensureRelationships(p) {
  p = p || player;
  if (!p) return;
  if (p.coachTrust == null) p.coachTrust = 55;
  if (p.chemistry == null) p.chemistry = 70;
  if (p.fansRapport == null) p.fansRapport = clamp(p.popularity + 10, 30, 80);
  if (p.mediaRapport == null) p.mediaRapport = clamp(p.reputation || 50, 25, 75);

  p.family = p.family || { partner: false, since: null, married: null, children: [] };
  if (p.family.partner && !p.family.partnerName) {
    const nat = p.nationality || "Italia";
    p.family.partnerName = randomNameFor(nat).first;
    p.family.partnerJob = choice(PARTNER_OCCUPATIONS);
    p.family.harmony = 75;
  }
}

/* Restituisce lo stato descrittivo e il colore della barra */
function rapportStatus(value) {
  const v = Math.round(value);
  if (v >= 80) return { label: "Eccellente", tone: "up", color: "var(--up)" };
  if (v >= 60) return { label: "Buono", tone: "good", color: "#3d8bfd" };
  if (v >= 40) return { label: "Discreto", tone: "mid", color: "var(--gold-text)" };
  if (v >= 25) return { label: "Teso", tone: "bad", color: "var(--signal)" };
  return { label: "In rottura", tone: "down", color: "var(--down)" };
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

  const teamName = p.team ? p.team.name : "Squadra";
  const partnerBlock = fam.partner ? `
    <div class="card rel-partner-card">
      <div class="rel-partner-head">
        <div class="rel-avatar-ring">💍</div>
        <div>
          <div class="rel-partner-name">${fam.partnerName}</div>
          <div class="small-muted">${fam.partnerJob} · ${fam.married ? `Sposati dal ${fam.married}` : `Insieme dal ${fam.since}`}</div>
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
        ${fam.harmony >= 75 ? "💞 La vostra complicità è fortissima: ti dà serenità e stabilità mentale prima di ogni gara."
          : fam.harmony >= 45 ? "🌤️ La vita di coppia scorre tranquilla, tra le trasferte e gli impegni quotidiani."
          : "⚠️ Aria di crisi: le continue trasferte e la pressione dei media stanno creando forti tensioni."}
      </p>
      <div class="rel-actions-row">
        <button type="button" class="btn btn-secondary btn-sm" id="btn-rel-partner-gift">🎁 Sorpresa romantica (${fmtMoney(Math.max(0.01, p.wealth * 0.02), cur)})</button>
        <button type="button" class="btn btn-ghost btn-sm" id="btn-rel-partner-dinner">🍷 Cena intima a due (-5 stamina)</button>
      </div>
    </div>` : `
    <div class="card rel-single-card">
      <div style="font-size:32px; margin-bottom:6px;">🗽</div>
      <h3 style="font-family:var(--font-display); font-size:22px; margin-bottom:4px; text-transform:uppercase;">Vita da Single</h3>
      <p class="small-muted" style="max-width:440px; margin:0 auto 14px; font-size:13.5px;">
        Sei completamente concentrato sulla palla a spicchi e sulle tue passioni, ma le serate in città possono riservare sorprese.
      </p>
      <button type="button" class="btn btn-secondary btn-sm" id="btn-rel-go-out">🍸 Serata in città con gli amici (${fmtMoney(Math.max(0.005, p.wealth * 0.01), cur)})</button>
    </div>`;

  const relationships = [
    {
      id: "coach",
      title: "Allenatore",
      sub: `Staff tecnico di ${teamName}`,
      icon: "🧑‍🏫",
      val: p.coachTrust,
      desc: p.coachTrust >= 75 ? "Piena fiducia: puoi gestire i possessi con massima libertà tattica."
        : p.coachTrust >= 50 ? "Rapporto professionale solido: rispetta il piano partita."
        : "Fiducia ai minimi termini: al primo errore rischi la panchina.",
      actionLabel: "📹 Sessione extra video con il Coach (-5 stamina)",
      actionId: "btn-rel-coach-video",
    },
    {
      id: "teammates",
      title: "Spogliatoio & Compagni",
      sub: "Chimica del gruppo squadra",
      icon: "🤝",
      val: p.chemistry,
      desc: p.chemistry >= 75 ? "Fratelli di parquet: nei possessi caldi si fidano ciecamente di te."
        : p.chemistry >= 50 ? "Buona convivenza tra professionisti."
        : "Spogliatoio freddo: ti cercano poco sul perimetro e mancano gli aiuti.",
      actionLabel: `🍕 Cena offerta alla squadra (${fmtMoney(Math.max(0.01, p.wealth * 0.02), cur)})`,
      actionId: "btn-rel-team-dinner",
    },
    {
      id: "fans",
      title: "Tifosi & Piazza",
      sub: `La curva e i sostenitori di ${teamName}`,
      icon: "📢",
      val: p.fansRapport,
      desc: p.fansRapport >= 75 ? "Idolo indiscusso: il palazzetto esplode a ogni tua giocata."
        : p.fansRapport >= 50 ? "Sostegno caloroso da parte del pubblico."
        : "Mormorii e fischi al primo tiro sbagliato.",
      actionLabel: "✍️ Pomeriggio firma autografi & Meet con i Tifosi (-4 stamina)",
      actionId: "btn-rel-fans-meet",
    },
    {
      id: "media",
      title: "Stampa & Media",
      sub: "Giornalisti, TV e opinionisti sportivi",
      icon: "🎙️",
      val: p.mediaRapport,
      desc: p.mediaRapport >= 75 ? "Pupillo della critica: elogi unanimi e prime pagine benevole."
        : p.mediaRapport >= 50 ? "Trattamento equilibrato dei cronisti."
        : "Bersaglio delle polemiche: critiche aspre a ogni passo falso.",
      actionLabel: "🎙️ Concedi intervista esclusiva / Podcast (nessun costo)",
      actionId: "btn-rel-media-interview",
    },
  ];

  panel.innerHTML = `
    <div class="rel-container">
      <div class="rel-hero-strap">
        <div>
          <h2 class="rel-hero-title">Lifestyle & Vita Fuori dal Campo</h2>
          <p class="small-muted" style="margin:2px 0 0;">Relazioni, vita privata e i tuoi acquisti personali · patrimonio disponibile <strong>${fmtMoney(p.wealth, cur)}</strong>.</p>
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
                <button type="button" class="btn btn-secondary btn-sm rel-act-btn" id="${r.actionId}">
                  ${r.actionLabel}
                </button>
              </div>
            </div>`;
        }).join("")}
      </div>

      <div style="margin-top:20px;">
        <h3 style="font-family:var(--font-display); font-size:22px; text-transform:uppercase; margin-bottom:8px; color:var(--ink);">
          Vita Privata & Sentimenti
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

  addAct("btn-rel-coach-video", () => {
    if (p.stamina < 5) { toast("⚠️ Troppo stanco per una sessione extra di video."); return; }
    p.stamina = Math.max(0, p.stamina - 5);
    p.coachTrust = clamp(p.coachTrust + 6, 0, 100);
    p.morale = clamp(p.morale + 2, 0, 100);
    toast("🧑‍🏫 Un'ora a rivedere i filmati col coach: ha apprezzato la tua dedizione (+6 fiducia).");
    renderGameScreen();
  });

  addAct("btn-rel-team-dinner", () => {
    const cost = roundMoney(Math.max(0.01, p.wealth * 0.02));
    if (p.wealth < cost && p.wealth > 0) { toast("⚠️ Fondi insufficienti per offrire la cena alla squadra."); return; }
    p.wealth = roundMoney(Math.max(0, p.wealth - cost));
    p.chemistry = clamp(p.chemistry + 8, 0, 100);
    p.coachTrust = clamp(p.coachTrust + 2, 0, 100);
    p.morale = clamp(p.morale + 4, 0, 100);
    toast("🍕 Cena e brindisi offerti a tutta la squadra: lo spogliatoio è più unito che mai (+8 intesa).");
    renderGameScreen();
  });

  addAct("btn-rel-fans-meet", () => {
    if (p.stamina < 4) { toast("⚠️ Sei troppo affaticato per l'evento coi tifosi."); return; }
    p.stamina = Math.max(0, p.stamina - 4);
    p.fansRapport = clamp(p.fansRapport + 8, 0, 100);
    p.popularity = clamp(p.popularity + 2, 0, 100);
    toast("✍️ Centinaia di bambini e selfie al fan store: la città ti ama sempre di più (+8 gradimento).");
    renderGameScreen();
  });

  addAct("btn-rel-media-interview", () => {
    p.mediaRapport = clamp(p.mediaRapport + 7, 0, 100);
    p.popularity = clamp(p.popularity + 2, 0, 100);
    toast("🎙️ Una lunga chiacchierata informale in podcast: i giornalisti apprezzano la tua disponibilità (+7 stampa).");
    renderGameScreen();
  });

  if (fam.partner) {
    addAct("btn-rel-partner-gift", () => {
      const cost = roundMoney(Math.max(0.01, p.wealth * 0.02));
      p.wealth = roundMoney(Math.max(0, p.wealth - cost));
      fam.harmony = clamp((fam.harmony || 70) + 12, 0, 100);
      p.morale = clamp(p.morale + 6, 0, 100);
      toast(`🎁 Sorpresa speciale per ${fam.partnerName}: occhi lucidi e grande felicità (+12 armonia, +6 morale).`);
      renderGameScreen();
    });

    addAct("btn-rel-partner-dinner", () => {
      if (p.stamina < 5) { toast("⚠️ Troppo sfinito per uscire a cena stasera."); return; }
      p.stamina = Math.max(0, p.stamina - 5);
      fam.harmony = clamp((fam.harmony || 70) + 8, 0, 100);
      p.morale = clamp(p.morale + 4, 0, 100);
      toast(`🍷 Cena a lume di candela con ${fam.partnerName}: staccare dal basket vi ha fatto benissimo (+8 armonia).`);
      renderGameScreen();
    });
  } else {
    addAct("btn-rel-go-out", () => {
      const cost = roundMoney(Math.max(0.005, p.wealth * 0.01));
      p.wealth = roundMoney(Math.max(0, p.wealth - cost));
      if (rollChance(40)) {
        fam.partner = true;
        fam.since = p.year;
        fam.partnerName = randomNameFor(p.nationality || "Italia").first;
        fam.partnerJob = choice(PARTNER_OCCUPATIONS);
        fam.harmony = 80;
        p.morale = clamp(p.morale + 10, 0, 100);
        pushNews(`💞 Incontro magico: a una serata conosci ${fam.partnerName} (${fam.partnerJob}) ed è subito colpo di fulmine!`);
        toast(`💞 Hai conosciuto ${fam.partnerName}! È iniziata una storia speciale.`);
      } else {
        p.morale = clamp(p.morale + 4, 0, 100);
        p.fansRapport = clamp(p.fansRapport + 2, 0, 100);
        toast("🍸 Bella serata spensierata in centro con amici: un po' di svago ti rimette in sesto (+4 morale).");
      }
      renderGameScreen();
    });
  }

  // Listener acquisti Lifestyle
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
            p.family.partnerName = randomNameFor(p.nationality || "Italia").first;
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
  const eligible = MORAL_DILEMMAS.filter(d => {
    if (d.requiresPartner && (!p.family || !p.family.partner)) return false;
    if (d.id === "partner_anniversary" && (!p.family || !p.family.partner)) return false;
    if (d.requiresSingle && p.family && p.family.partner) return false;
    return true;
  });
  if (!eligible.length) return null;
  return choice(eligible);
}

/* Mostra il dilemma morale in una modale evento */
function openMoralDilemmaModal(dilemma, onResolved) {
  if (!dilemma) return;
  renderEventModal({
    tone: "live",
    tag: dilemma.tag || "Dilemma Morale",
    meta: "Scelta Fuori dal Campo",
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
