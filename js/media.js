"use strict";

/* ================================================================
   MEDIA E INTERVISTE — dopo le partite chiave e a fine stagione una domanda dei
   giornalisti; il tono della risposta muove popolarità, reputazione, chimica e morale.
   ================================================================ */
const INTERVIEW_TONES = [
  { id: "humble", icon: "🤝", label: "Umile", tag: "Spogliatoio", effects: { chemistry: 4, reputation: 1, popularity: 1 }, note: "Il gruppo apprezza la tua umiltà." },
  { id: "confident", icon: "😎", label: "Sicuro di sé", tag: "Carisma", effects: { popularity: 4, morale: 3, coachTrust: 2 }, note: "I tifosi adorano la tua sicurezza." },
  { id: "leader", icon: "🫡", label: "Uomo squadra", tag: "Leadership", effects: { coachTrust: 4, chemistry: 3, starRapport: 3, reputation: 2 }, note: "Parole da leader vero: coach e compagni ti seguono." },
  { id: "ambitious", icon: "🎯", label: "Affamato", tag: "Mentalità", effects: { morale: 4, coachTrust: 2, reputation: 1, chemistry: -1 }, note: "Mostri una fame insaziabile: non ti accontenti mai." },
  { id: "ironic", icon: "😏", label: "Showman", tag: "Media & Social", effects: { popularity: 6, morale: 3, starRapport: 1, coachTrust: -1 }, note: "Battuta virale sui social: i media impazziscono." },
  { id: "polemic", icon: "🔥", label: "Polemico", tag: "Scintille", effects: { popularity: 7, chemistry: -6, reputation: -2, coachTrust: -4 }, note: "Fai notizia, ma nello spogliatoio c'è chi storce il naso." },
];

const PRESS_OUTLETS = [
  "🎙️ Gazzetta del Parquet · Sala Stampa",
  "🎙️ Hoops Insider · Microfono Aperto",
  "🎙️ EuroBasket Daily · Zona Mista",
  "🎙️ Prime Time Sport · Diretta TV",
];

const PRESS_REACTIONS = {
  humble: "👏 Applausi composti in sala stampa: lo spogliatoio apprezza il profilo basso.",
  confident: "📸 Flash dei fotografi: la tua sicurezza conquista subito i titoli di apertura.",
  leader: "🫡 Il coach annuisce dal fondo della sala: parole da vero capitano.",
  ambitious: "🔥 Sguardi seri tra i cronisti: la tua fame di vittorie alza la pressione su tutti.",
  ironic: "😂 Risate in sala stampa: la clip della tua battuta è già virale sui social.",
  polemic: "⚡ Mormorio in sala stampa! I giornalisti scrivono a raffica: domani sarà su tutte le prime pagine.",
};

/* Domande per contesto: ogni contesto offre 6 risposte distinte + una domanda di incalzo (followUp) */
const INTERVIEW_CONTEXTS = {
  champion: {
    q: "Siete campioni! A chi dedichi questo titolo?",
    a: {
      humble: "A tutta la squadra: senza i miei compagni non sarei niente.",
      confident: "Lo avevo detto a inizio anno: questa squadra era destinata a vincere.",
      leader: "Al coach, allo staff e a chi lavora nell'ombra ogni giorno per noi.",
      ambitious: "Bellissimo, ma da domani penso già al prossimo: voglio aprire un ciclo.",
      ironic: "Chiedetelo a chi aveva già prenotato le nostre vacanze due settimane fa!",
      polemic: "A chi non credeva in noi e ci dava per spacciati. E sono tanti.",
    },
    followQ: "Adesso siete la squadra da battere: come si resta al vertice?",
  },
  mvp: {
    q: "Sei l'MVP della lega: che effetto fa guardare tutti dall'alto?",
    a: {
      humble: "Un premio individuale che appartiene a tutto lo spogliatoio.",
      confident: "Me lo sono meritato ogni singola sera sul parquet.",
      leader: "I miei compagni mi passano la palla nei momenti giusti: metà trofeo è loro.",
      ambitious: "È solo un punto di partenza: voglio che il mio nome resti nella storia.",
      ironic: "Devo fare spazio sulla mensola di casa, inizia a diventare stretta!",
      polemic: "Era ora: l'anno scorso me l'avevano scippato sotto gli occhi di tutti.",
    },
    followQ: "Qual è l'aspetto del tuo gioco su cui senti di fare più la differenza?",
  },
  finalLost: {
    q: "Una finale persa brucia sempre: cosa è mancato sul più bello?",
    a: {
      humble: "Loro sono stati più bravi nei dettagli. Torneremo più forti.",
      confident: "Ci siamo arrivati una volta, ci arriveremo di nuovo e la vinceremo.",
      leader: "Nessuno abbassi la testa nello spogliatoio: sono fiero di ogni mio compagno.",
      ambitious: "Non dormo da stanotte: userò questa rabbia in ogni allenamento estivo.",
      ironic: "Ci è mancato giusto qualche canestro in più... ma il biglietto per l'anno prossimo è già prenotato.",
      polemic: "Diciamo che certe decisioni arbitrali nei momenti chiave hanno pesato parecchio.",
    },
    followQ: "Cosa dirai ai compagni prima di rompere le righe?",
  },
  missedPlayoffs: {
    q: "Niente playoff quest'anno: di chi è la responsabilità?",
    a: {
      humble: "Anche mia: devo dare molto di più per questa maglia.",
      confident: "Ho dato tutto. Il prossimo anno la musica cambierà, ve lo garantisco.",
      leader: "Si vince e si perde insieme: proteggo il gruppo e ripartiamo da qui.",
      ambitious: "Non accetto stagioni così: pretendo un salto di qualità da me e da tutto l'ambiente.",
      ironic: "Almeno quest'estate avremo più tempo per lavorare sul tiro in palestra!",
      polemic: "Io la mia parte l'ho fatta fino in fondo. Chiedete a qualcun altro.",
    },
    followQ: "Cosa serve per riportare entusiasmo nell'ambiente?",
  },
  injury: {
    q: "Una stagione condizionata dagli infortuni: come stai fisicamente e mentalmente?",
    a: {
      humble: "Ringrazio lo staff medico, lavoro in silenzio ogni giorno per tornare al 100%.",
      confident: "Tornerò più forte ed esplosivo di prima, è una promessa.",
      leader: "Anche dalla panchina ho cercato di dare una mano ai compagni in ogni partita.",
      ambitious: "Stare fuori mi ha dato una fame incredibile: non vedo l'ora di dominare.",
      ironic: "I medici ormai mi vedono più della mia famiglia, ma il peggio è passato!",
      polemic: "Mi hanno forzato a giocare quando non dovevo: la gestione poteva essere migliore.",
    },
    followQ: "Come cambierà la tua gestione atletica nei prossimi mesi?",
  },
  contractYear: {
    q: "Contratto in bilico e tante voci di mercato: quale sarà il tuo futuro?",
    a: {
      humble: "Qui sto bene, parleremo con calma insieme alla società al momento giusto.",
      confident: "Ascolterò tutte le offerte: sul campo mi sono guadagnato il massimo.",
      leader: "La mia testa è solo sullo spogliatoio e sulle partite che abbiamo davanti.",
      ambitious: "Voglio giocare dove si punta davvero a vincere titoli importanti.",
      ironic: "Il telefono del mio agente bolle, spero abbia un buon caricabatterie!",
      polemic: "Dipende tutto da quanto questa società dimostrerà di volermi davvero.",
    },
    followQ: "Quanto conta il progetto tecnico rispetto all'offerta economica?",
  },
  bigSeason: {
    q: "Numeri da capogiro quest'anno: ti senti ormai nell'élite del campionato?",
    a: {
      humble: "Devo ancora migliorare tanto, guardo solo a vincere le partite.",
      confident: "Sì, i numeri parlano chiaro. E non ho ancora mostrato tutto.",
      leader: "Se segno tanto è perché il sistema del coach e i blocchi dei compagni funzionano.",
      ambitious: "Non guardo le statistiche personali: voglio trasformare i punti in trofei.",
      ironic: "Diciamo che il canestro ultimamente mi sembra largo come una piscina!",
      polemic: "Lo ero già da tempo, qualcuno in tribuna stampa se n'è accorto solo adesso.",
    },
    followQ: "Le difese avversarie ormai raddoppiano sempre su di te: come rispondi?",
  },
  nationalCupWin: {
    q: "Avete alzato la Coppa Nazionale a metà stagione! Quanto vale questo trofeo?",
    a: {
      humble: "È il premio per i sacrifici di tutto il gruppo da inizio anno.",
      confident: "Avevamo fame di alzare un trofeo e abbiamo dominato la Final Eight.",
      leader: "Vincere dà fiducia a tutto lo spogliatoio per la seconda metà di stagione.",
      ambitious: "È solo l'antipasto: adesso vogliamo prenderci anche il campionato.",
      ironic: "La coppa pesa parecchio, ma faremo volentieri lo sforzo di alzarne un'altra!",
      polemic: "Dicevano che non eravamo pronti per le partite secche: eccovi la risposta.",
    },
    followQ: "Questa vittoria cambia le gerarchie per la corsa ai playoff?",
  },
  hotStreak: {
    q: "La squadra vola in classifica e il palazzetto è una bolgia: qual è il vostro segreto?",
    a: {
      humble: "Lavoriamo a testa bassa in palestra, non abbiamo ancora fatto nulla.",
      confident: "Quando giochiamo al nostro ritmo non ce n'è per nessuno.",
      leader: "C'è un'alchimia speciale: ognuno fa un passo in più per il compagno.",
      ambitious: "Bene così, ma guai a rilassarsi: la stagione si decide più avanti.",
      ironic: "Se ve lo dicessi adesso, gli allenatori avversari prenderebbero appunti!",
      polemic: "Strano, fino a un mese fa leggevamo solo critiche sul nostro conto.",
    },
    followQ: "Come si mantiene alta la concentrazione nello spogliatoio?",
  },
  slumpBlock: {
    q: "Momento delicato e diverse sconfitte nell'ultimo periodo: cosa non sta funzionando?",
    a: {
      humble: "Dobbiamo farci tutti un esame di coscienza, a partire da me.",
      confident: "È solo un passaggio a vuoto: conosco il mio valore e ne usciremo presto.",
      leader: "Niente processi pubblici: ci chiudiamo in palestra con il coach e ne usciamo insieme.",
      ambitious: "Serve più cattiveria agonistica su ogni pallone vagante, da subito.",
      ironic: "La tempesta passa sempre, basta non dimenticare l'ombrello e continuare a tirare!",
      polemic: "In campo serve che tutti corrano in difesa, non solo i soliti noti.",
    },
    followQ: "Il prossimo step della stagione sarà già decisivo: che reazione prometti?",
  },
  newTeam: {
    q: "Nuova maglia e nuova avventura: come procede il tuo inserimento in squadra?",
    a: {
      humble: "Mi sono messo subito a disposizione del coach e dei nuovi compagni.",
      confident: "Sono qui per spostare gli equilibri e portare questa squadra in alto.",
      leader: "Lo spogliatoio mi ha accolto benissimo, parliamo già la stessa lingua in campo.",
      ambitious: "Ho scelto questo club perché ha ambizioni grandi quanto le mie.",
      ironic: "Sto ancora imparando le strade della città, ma la via del canestro la conosco già!",
      polemic: "Aria nuova finalmente: qui c'è chi capisce davvero come valorizzarmi.",
    },
    followQ: "Qual è la prima cosa che ti ha chiesto l'allenatore?",
  },
  keyGameWin: {
    q: "Partita chiave decisa all'ultimo respiro: cosa si prova a essere l'uomo della provvidenza?",
    a: {
      humble: "È andata bene, ma la vittoria nasce dalla difesa di tutta la squadra.",
      confident: "Nei finali punto a punto voglio sempre il pallone tra le mani.",
      leader: "Lo schema disegnato dal coach nel timeout è stato perfetto.",
      ambitious: "Sono le partite per cui vivo: più sale la pressione, più mi esalto.",
      ironic: "Volevo tenere i tifosi col fiato sospeso fino alla sirena per lo spettacolo!",
      polemic: "Il pubblico avversario mi ha fischiato per quaranta minuti: adesso è tutto molto silenzioso.",
    },
    followQ: "Quanto pesa una vittoria così sul morale della squadra?",
  },
  keyGameLoss: {
    q: "La partita più attesa è sfumata proprio sull'ultimo possesso: quanto brucia?",
    a: {
      humble: "Colpa mia, dovevo gestire meglio l'ultima lettura. Chiedo scusa ai tifosi.",
      confident: "Fa parte del gioco: la prossima volta quel tiro entrerà, statene certi.",
      leader: "Abbiamo lottato fino all'ultimo secondo: testa alta, il gruppo è vivo.",
      ambitious: "Brucia tantissimo, ma ci servirà da lezione per quando conterà il doppio.",
      ironic: "Il ferro stasera aveva deciso di fare i capricci, ci rifaremo al ritorno!",
      polemic: "Sull'ultima azione il contatto era solare, ma nessuno ha avuto il coraggio di fischiare.",
    },
    followQ: "Come si trasforma questa delusione in energia per le prossime gare?",
  },
  seasonStart: {
    q: "Si alza il sipario sulla stagione: quali sono le tue sensazioni al via?",
    a: {
      humble: "Abbiamo lavorato sodo in preparazione, pensiamo una partita alla volta.",
      confident: "Mi sento nella miglior forma della mia vita: sarà una grande annata.",
      leader: "Il gruppo è unito e segue il coach: abbiamo costruito una bella identità.",
      ambitious: "L'obiettivo è arrivare fino in fondo in ogni competizione.",
      ironic: "Finalmente si gioca sul serio, ero stufo di correre senza il cronometro!",
      polemic: "I pronostici ci mettono dietro? Meglio, conserveremo i ritagli di giornale.",
    },
    followQ: "Quale sarà la chiave tattica di questo primo tratto di campionato?",
  },
  midSeasonCheck: {
    q: "Siamo nel vivo della stagione: che bilancio tracci fin qui?",
    a: {
      humble: "Stiamo crescendo passo dopo passo, ma il cammino è ancora lungo.",
      confident: "I miei numeri e il nostro gioco dimostrano che possiamo battere chiunque.",
      leader: "La forza di questa squadra è il collettivo: chiunque entra dà il suo contributo.",
      ambitious: "Non basta quello che abbiamo fatto finora: adesso bisogna cambiare marcia.",
      ironic: "Fin qui voto sette e mezzo, ma il bello dello spettacolo arriva adesso!",
      polemic: "Qualcuno aspettava un nostro crollo, invece siamo ancora qui a giocarcela.",
    },
    followQ: "Su cosa dovrete insistere nelle prossime settimane?",
  },
  default: {
    q: "Come giudichi la tua stagione?",
    a: {
      humble: "Una stagione di crescita, grazie ai compagni e al coach.",
      confident: "Buona, ma punto molto più in alto.",
      leader: "Abbiamo costruito basi solide nello spogliatoio per il futuro.",
      ambitious: "Voglio alzare il livello: la prossima stagione dovrà essere quella della svolta.",
      ironic: "Ci siamo divertiti parecchio, ma l'anno prossimo voglio i fuochi d'artificio!",
      polemic: "Poteva andare molto meglio, e di sicuro non è dipeso da me.",
    },
    followQ: "Qual è il messaggio che lasci alla piazza e all'ambiente?",
  },
  clutchWin: {
    q: "L'ultimo tiro della serie era tuo: cosa ti è passato per la testa?",
    a: {
      humble: "I compagni mi hanno messo nelle condizioni perfette per segnare.",
      confident: "Volevo quel pallone. Lo voglio sempre quando scotta.",
      leader: "Sapevo che tutta la panchina credeva in me: quel canestro è di tutti noi.",
      ambitious: "Ho pensato solo a mandarla dentro per portarci al turno successivo.",
      ironic: "Ho chiuso gli occhi, ho sentito il 'ciuff' della retina e ho preparato l'esultanza!",
      polemic: "Chi dubitava della mia freddezza nei playoff adesso ha avuto la risposta.",
    },
    followQ: "Questa giocata cambia l'inerzia di tutta la vostra postseason?",
  },
  farewell: {
    q: "Era la tua ultima partita: cosa ti porti via da questa carriera?",
    a: {
      humble: "I compagni, i tifosi e ogni allenatore che mi ha insegnato qualcosa. Grazie.",
      confident: "La certezza di aver lasciato il segno. Chi viene dopo dovrà fare i conti con me.",
      leader: "L'orgoglio di aver sempre onorato lo spogliatoio e i giovani che ho visto crescere.",
      ambitious: "Ogni singolo trofeo e ogni battaglia vinta senza mai risparmiarmi.",
      ironic: "Le mie ginocchia ringraziano, ma il parquet mi mancherà da morire!",
      polemic: "Qualche conto in sospeso con chi non ha mai creduto in me. Ma stasera no.",
    },
    followQ: "Un'ultima parola per i ragazzi che sognano di seguire le tue orme?",
  },
  clutchLoss: {
    q: "La serie si è decisa sull'ultimo possesso, finito male: come la vivi?",
    a: {
      humble: "Mi prendo tutta la responsabilità, lavorerò per quei momenti.",
      confident: "Rifarei la stessa identica scelta altre mille volte.",
      leader: "Nessun rimpianto: siamo arrivati fin lì lottando da squadra vera.",
      ambitious: "Questa ferita mi farà allenare il doppio per tutta l'estate.",
      ironic: "Due centimetri più a destra e saremmo qui a stappare lo spumante: è il basket.",
      polemic: "Su quel possesso c'era un fallo evidente che tutti hanno visto tranne gli arbitri.",
    },
    followQ: "Da dove si riparte dopo un epilogo così amaro?",
  },
};

/* Seconda domanda interattiva (incalzo del giornalista): 4 scelte mirate */
const INTERVIEW_FOLLOWUP_OPTIONS = [
  {
    id: "coach", icon: "📋", label: "Merito del coach",
    quote: "Il piano partita dello staff tecnico è la nostra bussola: seguiamo il coach ad occhi chiusi.",
    effects: { coachTrust: 3, reputation: 1 },
    note: "Il coach apprezza il sostegno pubblico",
  },
  {
    id: "teammates", icon: "🤜🤛", label: "Esalta i compagni",
    quote: "Con compagni così e l'intesa che abbiamo con i leader del gruppo tutto diventa più semplice.",
    effects: { chemistry: 3, starRapport: 3 },
    note: "Spogliatoio e stella ringraziano",
  },
  {
    id: "fans", icon: "🏟️", label: "Carica i tifosi",
    quote: "Il nostro pubblico merita il massimo: riempite il palazzetto, vi faremo divertire!",
    effects: { popularity: 4, morale: 2 },
    note: "I tifosi ti portano in trionfo",
  },
  {
    id: "rivals", icon: "⚡", label: "Sfida gli avversari",
    quote: "Chi pensa di metterci i piedi in testa farà bene a ripensarci: non temiamo nessuno.",
    effects: { morale: 4, popularity: 2, reputation: -1 },
    note: "Dichiarazione battagliera che infiamma la vigilia",
  },
];

function seasonInterviewContext(rec, p) {
  if (rec.champion) return "champion";
  if ((rec.awards || []).some(a => a.startsWith("MVP"))) return "mvp";
  if (rec.playoffResult === "Finale persa") return "finalLost";
  if (rec.nationalCup && rec.nationalCup.champion) return "nationalCupWin";
  if (rec.injury && rec.gp != null && rec.games && rec.gp / rec.games < 0.7) return "injury";
  if (!rec.playoffRounds && rec.league !== "NCAA") return "missedPlayoffs";
  if (p.contract && p.contract.yearsRemaining === 1 && p.contract.salaryPerYear != null) return "contractYear";
  if (rec.pts >= 17) return "bigSeason";
  return "default";
}

function blockInterviewContext(p, s) {
  if (!s) return "seasonStart";
  if (s.blocks.length === 0) {
    if (s.tradedFrom) return "newTeam";
    if (p.contract && p.contract.yearsRemaining === 1 && p.contract.salaryPerYear != null) return "contractYear";
    return "seasonStart";
  }
  const last = s.blocks[s.blocks.length - 1];
  if (s.tradedFrom && s.blocks.length >= 1 && !s.tradedInterviewDone) {
    s.tradedInterviewDone = true;
    return "newTeam";
  }
  if (s.nationalCup && s.nationalCup.champion && s.blocks.length === 2) return "nationalCupWin";
  if (last.keyGame) return last.keyGame.success ? "keyGameWin" : "keyGameLoss";
  if (last.wins >= last.losses + 2) return "hotStreak";
  if (last.losses >= last.wins + 2) return "slumpBlock";
  return "midSeasonCheck";
}

function applyInterviewEffects(effects, note, isPolemic) {
  const e = effects || {};
  if (isPolemic) player.polemicCount = (player.polemicCount || 0) + 1;
  if (e.chemistry) player.chemistry = clamp(player.chemistry + e.chemistry, 0, 100);
  if (e.popularity) player.popularity = clamp(player.popularity + e.popularity, 0, 100);
  if (e.morale) player.morale = clamp(player.morale + e.morale, 0, 100);
  if (e.reputation) changeReputation(player, e.reputation);
  if (e.coachTrust && typeof changeCoachTrust === "function") changeCoachTrust(player, e.coachTrust);
  if (e.starRapport && typeof starRapportOf === "function") player.starRapport = clamp(starRapportOf(player) + e.starRapport, 0, 100);
  const parts = [];
  if (e.popularity) parts.push(`popolarità ${e.popularity > 0 ? "+" : ""}${e.popularity}`);
  if (e.chemistry) parts.push(`chimica ${e.chemistry > 0 ? "+" : ""}${e.chemistry}`);
  if (e.morale) parts.push(`morale ${e.morale > 0 ? "+" : ""}${e.morale}`);
  if (e.reputation) parts.push(`reputazione ${e.reputation > 0 ? "+" : ""}${e.reputation}`);
  if (e.coachTrust) parts.push(`fiducia del coach ${e.coachTrust > 0 ? "+" : ""}${e.coachTrust}`);
  if (e.starRapport) parts.push(`intesa stella ${e.starRapport > 0 ? "+" : ""}${e.starRapport}`);
  return `${note} (${parts.join(", ")})`;
}

/* Applica gli effetti del tono scelto; restituisce il testo del risultato */
function applyInterviewTone(toneId) {
  const tone = INTERVIEW_TONES.find(t => t.id === toneId);
  if (!tone) return null;
  return applyInterviewEffects(tone.effects, tone.note, toneId === "polemic");
}

function applyInterviewFollowUp(followId) {
  const opt = INTERVIEW_FOLLOWUP_OPTIONS.find(o => o.id === followId);
  if (!opt) return null;
  const res = applyInterviewEffects(opt.effects, opt.note, false);
  pushNews(`🎤 Sala stampa (${player.team.name}): “${opt.quote}”`);
  return res;
}

function interviewOutlet(iv) {
  if (!iv.outlet) {
    const idx = Math.abs((iv.context || "default").length + (player ? player.year || 0 : 0)) % PRESS_OUTLETS.length;
    iv.outlet = PRESS_OUTLETS[idx];
  }
  return iv.outlet;
}

function triggerCameraFlash(card) {
  if (!card) return;
  const f = document.createElement("div");
  f.className = "camera-flash-overlay";
  f.setAttribute("aria-hidden", "true");
  card.appendChild(f);
  setTimeout(() => f.remove(), 450);
}

function renderPressModal(iv, onSelectTone, onSelectFollow) {
  const overlay = el("press-overlay");
  const card = el("press-modal-card");
  if (!overlay || !card) return;
  const ctx = INTERVIEW_CONTEXTS[iv.context] || INTERVIEW_CONTEXTS.default;
  const outlet = interviewOutlet(iv);

  if (iv.answered && !iv.followUpAnswered) {
    const tone = INTERVIEW_TONES.find(t => t.id === iv.answered);
    const quote = tone ? (ctx.a[tone.id] || ctx.a.confident) : null;
    const reaction = tone ? PRESS_REACTIONS[tone.id] : null;
    const followQ = ctx.followQ || "Un'ultima battuta per chiudere la conferenza stampa?";

    card.innerHTML = `
      <div class="pm-outlet-strap">
        <span>🎙️ ${outlet}</span>
        <span class="small-muted">Incalzo dalla sala stampa</span>
        <button type="button" class="btn btn-ghost btn-xs" id="btn-close-press-modal" style="margin-left:auto; padding:2px 8px;" title="Chiudi">✕</button>
      </div>
      <div class="cm-body">
        <div class="pm-question-box">
          <div class="pm-q-label">La tua risposta precedente</div>
          <div style="font-size:15px; color:var(--ink-2); font-style:italic; margin-bottom:8px;">“${quote}”</div>
          ${reaction ? `<div style="font-size:13px; color:var(--signal);">${reaction}</div>` : ""}
        </div>
        <div class="pm-question-box" style="border-left-color:var(--signal); background:rgba(255,90,31,0.06);">
          <div class="pm-q-label" style="color:var(--signal);">Seconda domanda</div>
          <div class="pm-q-text">“${followQ}”</div>
        </div>
        <div class="pm-tones-grid">
          ${INTERVIEW_FOLLOWUP_OPTIONS.map(o => `
            <button type="button" class="pm-tone-btn" data-pm-follow="${o.id}">
              <div class="pm-t-head">
                <span class="pm-t-title">${o.icon} ${o.label}</span>
              </div>
              <div class="pm-t-quote">“${o.quote}”</div>
            </button>`).join("")}
        </div>
        <div class="btn-row" style="margin-top:10px; justify-content:flex-end;">
          <button type="button" class="btn btn-ghost btn-sm" data-pm-follow="none">👋 Saluta e lascia il podio</button>
        </div>
      </div>`;
    const btnCloseFollow = card.querySelector("#btn-close-press-modal");
    if (btnCloseFollow) btnCloseFollow.addEventListener("click", () => overlay.classList.add("hidden"));
    card.querySelectorAll("[data-pm-follow]").forEach(b => {
      b.addEventListener("click", () => {
        if (b.dataset.pmFollow !== "none") triggerCameraFlash(card);
        overlay.classList.add("hidden");
        onSelectFollow(b.dataset.pmFollow);
      });
    });
    overlay.classList.remove("hidden");
    return;
  }

  card.innerHTML = `
    <div class="pm-outlet-strap">
      <span>🎙️ ${outlet}</span>
      <span class="small-muted">Conferenza Stampa Ufficiale</span>
      <button type="button" class="btn btn-ghost btn-xs" id="btn-close-press-modal" style="margin-left:auto; padding:2px 8px;" title="Chiudi">✕</button>
    </div>
    <div class="cm-body">
      <div class="pm-question-box">
        <div class="pm-q-label">Domanda dei giornalisti</div>
        <div class="pm-q-text">“${ctx.q}”</div>
      </div>
      <div class="pm-tones-grid">
        ${INTERVIEW_TONES.map(t => `
          <button type="button" class="pm-tone-btn" data-pm-tone="${t.id}">
            <div class="pm-t-head">
              <span class="pm-t-title">${t.icon} ${t.label}</span>
              <span class="pm-t-tag">${t.tag}</span>
            </div>
            <div class="pm-t-quote">“${ctx.a[t.id] || ctx.a.confident}”</div>
          </button>`).join("")}
      </div>
      <div class="btn-row" style="margin-top:10px; justify-content:flex-end;">
        <button type="button" class="btn btn-ghost btn-sm" data-pm-tone="none">🤐 Nessun commento</button>
      </div>
    </div>`;

  const btnCloseInit = card.querySelector("#btn-close-press-modal");
  if (btnCloseInit) btnCloseInit.addEventListener("click", () => overlay.classList.add("hidden"));
  card.querySelectorAll("[data-pm-tone]").forEach(b => {
    b.addEventListener("click", () => {
      const toneId = b.dataset.pmTone;
      if (toneId !== "none") triggerCameraFlash(card);
      onSelectTone(toneId);
      if (toneId === "none" || iv.followUpAnswered) {
        overlay.classList.add("hidden");
      } else {
        renderPressModal(iv, onSelectTone, onSelectFollow);
      }
    });
  });
  overlay.classList.remove("hidden");
}

function hidePressModal() {
  const overlay = el("press-overlay");
  if (overlay) overlay.classList.add("hidden");
}

function interviewHtml(iv, dataAttr, followAttr) {
  const ctx = INTERVIEW_CONTEXTS[iv.context] || INTERVIEW_CONTEXTS.default;
  const outlet = interviewOutlet(iv);

  if (iv.answered) {
    const tone = INTERVIEW_TONES.find(t => t.id === iv.answered);
    const quote = tone ? (ctx.a[tone.id] || ctx.a.confident) : null;
    const reaction = tone ? PRESS_REACTIONS[tone.id] : null;
    const followQ = ctx.followQ || "Un'ultima battuta per chiudere la conferenza stampa?";
    const followOpt = iv.followUpAnswered && iv.followUpAnswered !== "none"
      ? INTERVIEW_FOLLOWUP_OPTIONS.find(o => o.id === iv.followUpAnswered)
      : null;

    if (tone && !iv.followUpAnswered) {
      return `
        <div class="ps-bracket active phase-current" style="border:1px solid var(--live); background:rgba(41,196,255,0.05); padding:16px; margin:14px 0; text-align:center;">
          <div style="font-family:var(--font-display); font-size:20px; font-weight:800; color:var(--live); text-transform:uppercase; margin-bottom:4px;">
            🎙️ ${outlet} · Incalzo in corso
          </div>
          <p class="small-muted" style="margin-bottom:12px;">“${followQ}”</p>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-reopen-press-modal" style="margin:0 auto;">
            Rispondi all'incalzo dei giornalisti
          </button>
        </div>`;
    }

    return `
      <div class="interview-box done">
        <div class="iv-meta"><span class="badge">${outlet}</span> <span class="small-muted">· Conferenza conclusa</span></div>
        <div class="iv-q">🎤 “${ctx.q}”</div>
        <div class="iv-a">${tone ? `${tone.icon} “${quote}”` : "🤐 Nessun commento."}</div>
        ${iv.result ? `<div class="iv-result">${iv.result}</div>` : ""}
        ${followOpt ? `
          <div style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--line, var(--border))">
            <div class="iv-q">🎙️ “${followQ}”</div>
            <div class="iv-a">${followOpt.icon} “${followOpt.quote}”</div>
            ${iv.followUpResult ? `<div class="iv-result">${iv.followUpResult}</div>` : ""}
          </div>` : ""}
      </div>`;
  }

  return `
    <div class="ps-bracket active phase-current" style="border:1px solid var(--live); background:rgba(41,196,255,0.05); padding:16px; margin:14px 0; text-align:center;">
      <div style="font-family:var(--font-display); font-size:20px; font-weight:800; color:var(--live); text-transform:uppercase; margin-bottom:4px;">
        🎙️ ${outlet} · Sala Stampa
      </div>
      <p class="small-muted" style="margin-bottom:12px;">I microfoni sono accesi per te. Domanda: “${ctx.q}”</p>
      <button type="button" class="btn btn-primary" id="btn-open-press-modal" style="margin:0 auto;">
        🎤 Rispondi alla conferenza stampa
      </button>
    </div>`;
}

function answerInterviewObj(iv, toneId) {
  if (!iv || iv.answered) return;
  iv.answered = toneId;
  iv.result = toneId === "none" ? null : applyInterviewTone(toneId);
  if (toneId === "none") iv.followUpAnswered = "none";
  if (toneId !== "none" && typeof onInterviewSocial === "function") onInterviewSocial(iv, toneId);
  renderGameScreen();
}

function answerInterviewFollowUpObj(iv, followId) {
  if (!iv || !iv.answered || iv.followUpAnswered) return;
  iv.followUpAnswered = followId;
  iv.followUpResult = followId === "none" ? null : applyInterviewFollowUp(followId);
  if (followId !== "none" && typeof onInterviewFollowUpSocial === "function") onInterviewFollowUpSocial(iv, followId);
  renderGameScreen();
}

/* ================================================================
   RESOCONTO DI FINE STAGIONE — una schermata sola con tutto quello che è successo,
   al posto della catena di popup. Da qui si prosegue verso draft, mercato o pre-stagione.
   ================================================================ */
function answerRecapInterview(toneId) {
  const d = player.pendingDecision;
  if (!d || d.type !== "seasonRecap" || !d.interview) return;
  answerInterviewObj(d.interview, toneId);
}
function answerRecapFollowUp(followId) {
  const d = player.pendingDecision;
  if (!d || d.type !== "seasonRecap" || !d.interview) return;
  answerInterviewFollowUpObj(d.interview, followId);
}
function answerBlockInterview(toneId) {
  const d = player.pendingDecision;
  if (!d || d.type !== "seasonBlock" || !d.blockInterview) return;
  answerInterviewObj(d.blockInterview, toneId);
}
function answerBlockFollowUp(followId) {
  const d = player.pendingDecision;
  if (!d || d.type !== "seasonBlock" || !d.blockInterview) return;
  answerInterviewFollowUpObj(d.blockInterview, followId);
}
function closeSeasonRecap() {
  const d = player.pendingDecision;
  if (!d || d.type !== "seasonRecap") return;
  if (d.retireAfter) {
    // fine del tour d'addio: la lega saluta chi si è ritirato da protagonista
    changeReputation(player, 3);
    retirePlayer();
    return;
  }
  // scenario: dopo il resoconto si scopre se l'obiettivo è raggiunto o sfumato
  if (scenarioInterrupt("recap", d.next)) return;
  player.pendingDecision = d.next;
  renderGameScreen();
}

function recapTile(value, label, tone) {
  return `<div class="sg-item ${tone || ""}"><div class="sg-val">${value}</div><div class="sg-lbl">${label}</div></div>`;
}

let lastRecapSound = null; // il suono del resoconto parte una volta sola per stagione
function renderSeasonRecap(extra, d) {
  const rec = player.history[player.history.length - 1];
  if (lastRecapSound !== rec.year) { lastRecapSound = rec.year; playSound(rec.champion ? "title" : "recap"); }
  const cur = playerCurrency(player);
  const phases = [];
  phases.push(`🏀 ${LEAGUES[rec.league].name}: ${rec.wins}-${rec.losses}${rec.rank ? `, ${rec.rank}° su ${rec.totalTeams}` : ""} · ${rec.playoffResult || (rec.playoffRounds ? "playoff" : "niente playoff")}`);
  if (rec.nationalCup && rec.nationalCup.qualified !== false) phases.push(`🏆 ${rec.nationalCup.name}: ${rec.nationalCup.champion ? "Campioni!" : `eliminati in ${rec.nationalCup.eliminatedAt ? rec.nationalCup.eliminatedAt.toLowerCase() : "quarti"}`}`);
  if (rec.continental) phases.push(`🏟️ ${rec.continental.competition}: ${rec.continental.result || "eliminati ai gironi"}`);
  if (rec.nationalComp) phases.push(`🌍 ${rec.nationalComp.name}: ${nationalCompOutcomeText(rec.nationalComp)}`);
  const offs = rec.offseason ? `${rec.offseason.tone === "positive" ? "🌟" : rec.offseason.tone === "negative" ? "⚠️" : "🌤️"} ${rec.offseason.title}` : null;
  const coverHtml = typeof seasonCoverHtml === "function" ? `
    <div class="recap-cover-wrap">
      ${seasonCoverHtml(rec, player)}
      <div class="recap-cover-actions">
        <button type="button" class="btn btn-secondary btn-sm" id="btn-share-cover">📸 Scarica Copertina Rivista</button>
      </div>
    </div>` : "";

  extra.innerHTML = `
    <div class="recap-switcher-wrap">
      <div class="recap-switcher" role="tablist">
        <button type="button" class="recap-tab-btn active" data-recap-tab="cover">📸 Copertina Rivista</button>
        <button type="button" class="recap-tab-btn" data-recap-tab="stats">📊 Scheda Statistiche</button>
      </div>
    </div>

    <div class="recap-view-cover">
      ${coverHtml}
    </div>

    <div class="recap-view-stats hidden">
      <div class="recap-stage">
        <div class="recap-ovr ${rec.champion ? "champ" : ""}">
          <div class="recap-ovr__stripes" aria-hidden="true"></div>
          <span class="recap-ovr__k">${rec.champion ? "Campioni · overall a fine stagione" : "Overall a fine stagione"}</span>
          <span class="recap-ovr__num co-num">${rec.overall}</span>
          <span class="recap-ovr__d">${rec.ovrDelta > 0 ? "▲ +" : rec.ovrDelta < 0 ? "▼ −" : "= "}${Math.abs(rec.ovrDelta || 0)}</span>
        </div>
        <section class="card recap-box">
          <div class="recap-box__head">
            <span class="recap-team"><span class="co-dot" style="--team:${rec.team.colors ? rec.team.colors[0] : "var(--signal)"}"></span><span class="recap-team__name">${rec.team.name}</span></span>
            <span class="co-row"><span class="co-chip">${LEAGUES[rec.league].name}</span>${rec.teamRole ? `<span class="co-chip">${getTeamRole(rec.teamRole).label}</span>` : rec.roleLabel ? `<span class="co-chip">${rec.roleLabel}</span>` : ""}${rec.gp != null ? `<span class="co-chip">${rec.gp}/${rec.games} partite</span>` : ""}<span class="co-chip">${rec.age} anni</span></span>
          </div>
          <div class="summary-grid recap-tiles">
            ${recapTile(rec.pts, "Punti a partita")}${recapTile(rec.reb, "Rimbalzi")}${recapTile(rec.ast, "Assist")}
            ${recapTile(`${rec.fg}%`, "Dal campo")}
            ${recapTile(`${rec.ovrDelta > 0 ? "+" : rec.ovrDelta < 0 ? "−" : ""}${Math.abs(rec.ovrDelta || 0)}`, `Overall → ${rec.overall}`, rec.ovrDelta > 0 ? "up" : rec.ovrDelta < 0 ? "down" : "")}
            ${recapTile(`+${rec.goatPoints || 0}`, "Punti GOAT", "gold")}
          </div>
        </section>
      </div>
    </div>
    <div class="recap-section"><div class="recap-h">Il cammino</div>${phases.map(x => `<div class="recap-row">${x}</div>`).join("")}</div>
    ${rec.goals && rec.goals.length ? `<div class="recap-section"><div class="recap-h">Obiettivi della società</div>${seasonGoalsListHtml(rec.goals, rec.goals)}</div>` : ""}
    ${rec.careerGoalDone ? `<div class="recap-section"><div class="recap-h">Il tuo sogno</div><div class="recap-row">🌠 ${getCareerGoal(rec.careerGoalDone).icon} ${getCareerGoal(rec.careerGoalDone).label}: realizzato! (+${CAREER_GOAL_REWARD.goat} punti GOAT)</div></div>` : ""}
    ${rec.newAchievements && rec.newAchievements.length ? `<div class="recap-section"><div class="recap-h">Traguardi sbloccati</div><div class="recap-badges">${rec.newAchievements.map(id => getAchievement(id)).filter(Boolean).map(a => `<span class="badge blue">${a.icon} ${a.title}</span>`).join("")}</div></div>` : ""}
    ${rec.awards && rec.awards.length ? `<div class="recap-section"><div class="recap-h">Premi</div><div class="recap-badges">${rec.awards.map(a => `<span class="badge gold">🏅 ${a}</span>`).join("")}</div></div>` : ""}
    <div class="recap-section"><div class="recap-h">Fuori dal campo</div>
      <div class="recap-row">💰 Guadagni: +${fmtMoney(rec.seasonEarnings || 0, cur)}${rec.contractBonus ? ` (di cui bonus ${fmtMoney(rec.contractBonus, cur)})` : ""}${rec.investmentIncome ? ` · rendite +${fmtMoney(rec.investmentIncome, cur)}` : ""} · patrimonio ${fmtMoney(player.wealth, cur)}</div>
      ${(rec.investmentNotes || []).map(n => `<div class="recap-row">${n}</div>`).join("")}
      ${rec.reputation != null ? `<div class="recap-row">⭐ Reputazione ${rec.reputation} · ${reputationLabel(rec.reputation)}${rec.reputationNotes && rec.reputationNotes.length ? ` <span class="small-muted">(${rec.reputationNotes.join(", ")})</span>` : ""}</div>` : ""}
      ${rec.coachTrust != null ? `<div class="recap-row">🧑‍🏫 Fiducia del coach: ${rec.coachTrust}</div>` : ""}
      ${(rec.staffNotes || []).map(n => `<div class="recap-row">${n}</div>`).join("")}
      ${rec.injury ? `<div class="recap-row">${rec.injury.text}</div>` : ""}
      ${rec.seriousInjury ? `<div class="recap-row">🏥 ${rec.seriousInjury.label}: ${rec.seriousInjury.choice === "surgery" ? "operazione" : rec.seriousInjury.relapse ? "terapia conservativa e ricaduta" : "terapia conservativa, rientro riuscito"}</div>` : ""}
      ${(rec.keyGames || []).map(k => `<div class="recap-row">${KEY_GAME_KINDS[k.kind].icon} ${k.label} contro ${k.opponent}: ${k.success ? "vinta all'ultimo possesso" : "persa all'ultimo possesso"}</div>`).join("")}
      ${(rec.leadershipNotes || []).map(n => `<div class="recap-row">${n}</div>`).join("")}
      ${rec.lifestyleUpkeep ? `<div class="recap-row">👨‍🍳 Chef privato: −${fmtMoney(rec.lifestyleUpkeep, cur)}, fragilità −3</div>` : ""}
      ${(rec.sponsorResults || []).map(r => `<div class="recap-row">${r.met ? "🤝" : "💔"} ${r.text}</div>`).join("")}
      ${rec.roleBattle ? `<div class="recap-row">⚔️ Sfida per il posto con ${rec.roleBattle.rival.name}: ${rec.roleBattle.won ? (rec.roleBattle.regainedIn ? `posto ripreso in ${rec.roleBattle.regainedIn}` : "vinta al training camp") : "persa, stagione da rincalzo"}</div>` : ""}
      ${rec.adaptation ? `<div class="recap-row">🧳 Ambientamento in ${rec.adaptation.country}: ${rec.adaptation.level}/100</div>` : ""}
      ${offs ? `<div class="recap-row">☀️ Estate: ${offs}</div>` : ""}
    </div>
    ${d.interview ? `<div class="recap-section"><div class="recap-h">Conferenza stampa</div>${interviewHtml(d.interview, "data-recap-tone", "data-recap-follow")}</div>` : ""}
    <div class="btn-row" style="justify-content:center">
      <button class="btn btn-primary btn-lg" id="btn-recap-continue">${d.retireAfter ? "Chiudi la carriera" : "Continua verso l'estate"}${d.interview && !d.interview.answered ? " senza rispondere" : ""}</button>
    </div>`;
  const viewCover = extra.querySelector(".recap-view-cover");
  const viewStats = extra.querySelector(".recap-view-stats");
  extra.querySelectorAll(".recap-tab-btn").forEach(b => {
    b.addEventListener("click", () => {
      extra.querySelectorAll(".recap-tab-btn").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      const tab = b.dataset.recapTab;
      if (tab === "cover") {
        if (viewCover) viewCover.classList.remove("hidden");
        if (viewStats) viewStats.classList.add("hidden");
      } else {
        if (viewCover) viewCover.classList.add("hidden");
        if (viewStats) viewStats.classList.remove("hidden");
      }
    });
  });

  const btnShare = extra.querySelector("#btn-share-cover");
  if (btnShare) btnShare.addEventListener("click", () => shareSeasonCoverImage(rec));
  extra.querySelectorAll("[data-recap-tone]").forEach(b => b.addEventListener("click", () => answerRecapInterview(b.dataset.recapTone)));
  extra.querySelectorAll("[data-recap-follow]").forEach(b => b.addEventListener("click", () => answerRecapFollowUp(b.dataset.recapFollow)));
  const btnOpenPress = extra.querySelector("#btn-open-press-modal") || extra.querySelector("#btn-reopen-press-modal");
  if (btnOpenPress && d.interview) {
    const openPress = () => renderPressModal(d.interview, (tone) => answerRecapInterview(tone), (follow) => answerRecapFollowUp(follow));
    btnOpenPress.addEventListener("click", openPress);
    if (!d.interview.answered) openPress();
  }
  el("btn-recap-continue").addEventListener("click", () => {
    hidePressModal();
    closeSeasonRecap();
  });
}

/* ================================================================
   SOCIAL MEDIA ("COURTX") — Feed interattivo, post del giocatore,
   reazioni di giornalisti, tifosi, compagni e hater.
   Nota: usa un generatore deterministico locale (socialHash) per non
   consumare numeri casuali di Math.random() nei test di bilanciamento.
   ================================================================ */
function socialHash(str) {
  const s = String(str || "");
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}
function socialPick(arr, seed) {
  if (!arr || !arr.length) return null;
  return arr[socialHash(seed) % arr.length];
}

const SOCIAL_ACCOUNTS = {
  media: [
    { name: "Hoops Central", handle: "@HoopsCentral", badge: "📰 Media", verified: true, avatar: "📰" },
    { name: "EuroBasket Insider", handle: "@EuroHoopsIn", badge: "📰 Insider", verified: true, avatar: "🏀" },
    { name: "La Gazzetta del Parquet", handle: "@GazzettaParquet", badge: "📰 Stampa", verified: true, avatar: "🗞️" },
    { name: "CourtSide Report", handle: "@CourtSideRep", badge: "🎙️ TV", verified: true, avatar: "🎙️" },
    { name: "Overtime Basket", handle: "@OvertimeBBall", badge: "📊 Analisi", verified: true, avatar: "📊" },
  ],
  fan: [
    { name: "Sesto Uomo", handle: "@SestoUomo_Official", badge: "📣 Tifoso", verified: false, avatar: "📣" },
    { name: "Curva Parquet", handle: "@CurvaParquet", badge: "🥁 Ultras", verified: false, avatar: "🔥" },
    { name: "Hoops Lover 99", handle: "@HoopsLover99", badge: "🏀 Fan", verified: false, avatar: "🙌" },
    { name: "Basket Mania", handle: "@BasketMania_IT", badge: "📣 Fan Page", verified: false, avatar: "💛" },
    { name: "Febbre a 90° Basket", handle: "@FebbreBasket", badge: "📣 Tifoso", verified: false, avatar: "🏟️" },
  ],
  critic: [
    { name: "Hardwood Critic", handle: "@HardwoodCritic", badge: "🧐 Critico", verified: false, avatar: "🧐" },
    { name: "Brick Watcher", handle: "@BrickWatcher_", badge: "🧌 Hater", verified: false, avatar: "🧱" },
    { name: "Coach da Divano", handle: "@ArmchairCoach", badge: "📋 Opinionista", verified: false, avatar: "🛋️" },
    { name: "Advanced Stats Nerd", handle: "@TrueShootingPct", badge: "📉 Analista", verified: false, avatar: "🤓" },
  ],
  teammate: [
    { name: "Capitano Spogliatoio", handle: "@TheCaptain_Real", badge: "🤝 Compagno", verified: true, avatar: "🫡" },
    { name: "Fratello di Parquet", handle: "@BackcourtBro", badge: "🏀 Compagno", verified: true, avatar: "🤜" },
  ],
};

/* Azioni di pubblicazione del giocatore (1 per step stagionale) */
const SOCIAL_POST_ACTIONS = [
  {
    id: "grind",
    icon: "🏋️",
    label: "Grind in palestra",
    sub: "Coach +3 · Rep +2 · Follower +",
    desc: "Mostra la sessione extra di tiro a luci spente nel palazzetto.",
    effects: { coachTrust: 3, reputation: 2, followerPct: 0.03 },
    buildText: p => `Luci spente al palazzetto di ${p.team.city}, ma il lavoro non finisce mai. Testa bassa e altri 500 tiri a segno per ${p.team.name}. 💪🏀 #Grind #NoDaysOff #F3NOM`,
    comments: p => [
      { author: "Preparatore Atletico", handle: "@CoachStaff", text: "Sempre il primo ad arrivare e l'ultimo ad andare via. Mentalità da vincente! 👏🔥" },
      { author: `Tifosi ${p.team.name}`, handle: `@Ultras_${p.team.name.replace(/[^a-zA-Z]/g, "").slice(0, 10)}`, text: "Ecco perché ti amiamo! Sudore e maglia! ❤️💪" },
    ],
  },
  {
    id: "team",
    icon: "🤝",
    label: "Spogliatoio & Squadra",
    sub: "Chimica +4 · Stella +3 · Morale +2",
    desc: "Pubblica una foto di gruppo coi compagni per blindare lo spogliatoio.",
    effects: { chemistry: 4, starRapport: 3, morale: 2, followerPct: 0.035 },
    buildText: p => `Questo gruppo ha qualcosa di speciale. In battaglia insieme fino all'ultimo secondo con i miei fratelli di ${p.team.name}! 🤜🤛🔥 #Famiglia #OneTeam`,
    comments: p => [
      { author: "Leader Spogliatoio", handle: "@StarTeammate", text: "Fino alla fine fratello! Quest'anno ci prendiamo tutto 🐐🔥" },
      { author: "Sesto Uomo", handle: "@SestoUomo", text: "Spogliatoio unito = vittorie assicurate! Grandi ragazzi 🙌" },
    ],
  },
  {
    id: "fans",
    icon: "📣",
    label: "Dedica ai Tifosi",
    sub: "Popolarità +4 · Morale +3 · Follower ++",
    desc: "Ringrazia il pubblico e carica l'ambiente in vista delle prossime gare.",
    effects: { popularity: 4, morale: 3, followerPct: 0.055 },
    buildText: p => `L'energia di ${p.team.city} quando entriamo sul parquet non ha eguali. Giochiamo ogni possesso per voi: riempiamo il palazzetto! ❤️🏟️ #${p.team.name.replace(/\s+/g, "")}`,
    comments: p => [
      { author: `Curva ${p.team.city}`, handle: `@Curva_${p.team.city.replace(/[^a-zA-Z]/g, "").slice(0, 10)}`, text: "Sabato saremo una bolgia! Tu mettici i canestri, noi la voce! 🔥📣" },
      { author: "Hoops Central", handle: "@HoopsCentral", text: `Amore totale tra ${p.firstName} ${p.lastName} e la piazza di ${p.team.city}. ✨` },
    ],
  },
  {
    id: "flex",
    icon: "💎",
    label: "Lifestyle & Sponsor",
    sub: "Incasso $$ · Popolarità +3 · Follower ++ · Coach −1",
    desc: "Post patinato con sponsor e stile di vita fuori dal campo: monetizza i tuoi follower.",
    effects: { popularity: 3, coachTrust: -1, followerPct: 0.065, sponsorPayout: true },
    buildText: p => {
      const owned = (p.lifestyle || []);
      const luxItem = owned.length && typeof LIFESTYLE_ITEMS !== "undefined"
        ? LIFESTYLE_ITEMS.find(x => x.id === owned[owned.length - 1])
        : null;
      const luxText = luxItem ? `Giornata di relax con il mio ${luxItem.name.toLowerCase()} ${luxItem.icon}. ` : "Stile dentro e fuori dal parquet. ";
      return `${luxText}Grazie ai partner che credono nel viaggio. ✨💎 #Ad #Lifestyle #F3NOM #Blessed`;
    },
    comments: p => [
      { author: "Sneaker & Drip", handle: "@HoopsDrip", text: "Drip clamoroso fuori dal campo 🥶💎 10/10!" },
      { author: "Coach da Divano", handle: "@ArmchairCoach", text: "Tutto bello, ma speriamo che pensi anche alla difesa domani sera... 👀" },
    ],
  },
  {
    id: "cryptic",
    icon: "🌶️",
    label: "Post Criptico / Provocazione",
    sub: "Boom Virale +++ · Pop +5 · Morale +3 · Coach −3 · Rep −2",
    desc: "Lancia un messaggio enigmatico che fa impazzire tifosi e giornalisti di mercato.",
    effects: { popularity: 5, morale: 3, coachTrust: -3, reputation: -2, followerPct: 0.11 },
    buildText: () => `⏳👀 Certi silenzi fanno più rumore di mille parole. Presto parlerà solo il parquet... chi sa, sa. 🤫🔥 #StayTuned`,
    comments: p => [
      { author: "EuroBasket Insider", handle: "@EuroHoopsIn", text: `👀 Messaggio in codice di ${p.lastName}? Le rivali monitorano la situazione...` },
      { author: "Brick Watcher", handle: "@BrickWatcher_", text: "Meno enigmi sui social e più triple a bersaglio, grazie! 🍿😂" },
    ],
  },
];

/* Opzioni di risposta del giocatore ai post di giornalisti, tifosi e critici */
const SOCIAL_REPLY_OPTIONS = [
  {
    id: "classy",
    icon: "👏",
    label: "Con classe",
    tag: "Rep +1 · Chimica +1",
    effects: { reputation: 1, chemistry: 1, followerPct: 0.015 },
    buildReply: p => `Apprezzo il supporto e le osservazioni: pensiamo solo a lavorare ogni giorno per ${p.team.name}. 🙏🏀`,
  },
  {
    id: "hype",
    icon: "🔥",
    label: "Gasati",
    tag: "Morale +2 · Pop +1",
    effects: { morale: 2, popularity: 1, followerPct: 0.025 },
    buildReply: () => `E non avete ancora visto niente! Il meglio deve ancora venire 🔥🚀`,
  },
  {
    id: "clapback",
    icon: "🍿",
    label: "Zittisci (Ratio)",
    tag: "Pop +4 · Morale +3 · Rep ±",
    effects: { popularity: 4, morale: 3, followerPct: 0.05 },
    buildReply: p => `Continuate pure a parlare dal divano, io rispondo coi numeri sul parquet (${p.overall} OVR). Ci vediamo al palazzetto! 🤫📈`,
  },
  {
    id: "team",
    icon: "🤝",
    label: "Merito al gruppo",
    tag: "Chimica +2 · Coach +1",
    effects: { chemistry: 2, coachTrust: 1, followerPct: 0.015 },
    buildReply: p => `Merito dei miei compagni e dello staff tecnico: senza di loro non sarei nulla. 🤜🤛`,
  },
];

function playerSocialHandle(p) {
  const fn = (p.firstName || "Player").replace(/[^a-zA-Z0-9]/g, "");
  const ln = (p.lastName || "Hoops").replace(/[^a-zA-Z0-9]/g, "");
  const num = p.jerseyNumber != null ? p.jerseyNumber : 23;
  return `@${fn}${ln}_${num}`;
}

function socialFollowersCount(p) {
  if (!p) return 0;
  ensureSocialState(p);
  if (isMinorItaLeague(p.league)) {
    const popBonus = Math.round((p.popularity || 15) * 2.5);
    const ovrBonus = Math.max(0, (p.overall || 42) - 40) * 8;
    const base = 80 + popBonus + ovrBonus;
    return Math.max(50, Math.min(2500, base + Math.round(p.social.bonusFollowers || 0)));
  }
  const tierScale = p.league === "NBA"
    ? 650000
    : ["ESP_ACB", "TUR_BSL", "ITA_LBA", "FRA_ELITE", "GRE_GBL", "ABA", "CBA", "NBL", "GLEAGUE"].includes(p.league)
      ? (p.team && p.team.euro === "EL" ? 180000 : 95000)
      : 18000;
  const popFactor = Math.pow(clamp(p.popularity || 20, 5, 100) / 100, 1.55);
  const ovrBonus = Math.max(0, (p.overall || 60) - 55) * (p.league === "NBA" ? 42000 : 5500);
  const t = p.trophies || {};
  const trophyBonus = (t.titles || 0) * 320000 + (t.mvps || 0) * 480000 + (t.nationalCups || 0) * 55000 + (t.allStar || 0) * 110000;
  const base = Math.round(1200 + tierScale * popFactor + ovrBonus + trophyBonus);
  return Math.max(500, base + Math.round(p.social.bonusFollowers || 0));
}

function fmtFollowers(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(n >= 10000000 ? 1 : 2).replace(/\.0$/, "")}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, "")}K`;
  return String(n);
}

function isPlayerSocialVerified(p) {
  return socialFollowersCount(p) >= 45000 || (p.popularity || 0) >= 55 || p.league === "NBA";
}

function socialSentiment(p) {
  const pop = p.popularity || 50;
  const rep = typeof reputationOf === "function" ? reputationOf(p) : (p.reputation || 50);
  const trust = typeof coachTrustOf === "function" ? coachTrustOf(p) : (p.coachTrust || 50);
  if (pop >= 72 && rep >= 62) return { icon: "🔥", label: "Idolo della Curva", tone: "gold", desc: "I tifosi stravedono per te e i media esaltano ogni tua giocata." };
  if (pop >= 68 && rep < 46) return { icon: "⚡", label: "Superstar Divisiva", tone: "blue", desc: "Fai discutere tantissimo: metà pubblico ti adora, l'altra metà ti attacca." };
  if (rep >= 70 && trust >= 65) return { icon: "🫡", label: "Professionista Esemplare", tone: "green", desc: "Addetti ai lavori, coach e compagni ti portano come modello." };
  if ((p.morale || 50) < 40 || rep < 38) return { icon: "🌧️", label: "Nel Mirino della Critica", tone: "red", desc: "Pressione alta sui social: serve una risposta sul campo." };
  return { icon: "📈", label: "Sotto i Riflettori", tone: "blue", desc: "Il tuo nome circola sempre di più tra appassionati e addetti ai lavori." };
}

function socialSponsorPayout(p) {
  if (!p || p.league === "NCAA") return 0.005;
  const followers = socialFollowersCount(p);
  const raw = Math.max(0.01, Math.min(0.45, (followers / 1000000) * 0.12));
  return Math.round(raw * 100) / 100;
}

function socialCurrentStepKey(p) {
  if (!p) return "none";
  const d = p.pendingDecision;
  const blk = p.pendingSeason && p.pendingSeason.blocks ? p.pendingSeason.blocks.length : 0;
  const psIdx = p.postseason ? `${p.postseason.idx}:${(currentBracket() && currentBracket().idx) || 0}` : "";
  return `${p.year}:${d ? d.type : "idle"}:${blk}:${psIdx}`;
}

function canPostOnSocial(p) {
  if (!p) return false;
  ensureSocialState(p);
  return p.social.lastPostStepKey !== socialCurrentStepKey(p);
}

function ensureSocialState(p) {
  if (!p) return null;
  if (!p.social) {
    p.social = {
      bonusFollowers: 0,
      seq: 1,
      lastPostStepKey: null,
      unread: 0,
      filter: "all",
      posts: [],
    };
  }
  if (!Array.isArray(p.social.posts)) p.social.posts = [];
  if (p.social.seq == null) p.social.seq = p.social.posts.length + 1;
  if (!p.social.filter) p.social.filter = "all";
  if (!p.social.seeded && p.social.posts.length === 0 && p.team && p.league) {
    p.social.seeded = true;
    seedInitialSocialPosts(p);
  }
  return p.social;
}

function createSocialPost(p, opts) {
  ensureSocialState(p);
  const seq = p.social.seq++;
  const seed = `${p.year}:${seq}:${opts.text || ""}`;
  const fCount = Math.max(500, socialFollowersCount(p));
  const baseLikes = Math.max(12, Math.round((fCount * (opts.viral ? 0.085 : 0.032)) * (0.75 + (socialHash(seed) % 50) / 100)));
  const baseReposts = Math.max(2, Math.round(baseLikes * (0.14 + (socialHash(seed + "rt") % 12) / 100)));
  const post = {
    id: `sp_${p.year}_${seq}`,
    year: p.year,
    when: opts.when || `Stagione ${p.year}`,
    kind: opts.kind || "media", // "player" | "media" | "fan" | "critic" | "teammate"
    author: opts.author,
    handle: opts.handle,
    badge: opts.badge || "",
    verified: !!opts.verified,
    avatar: opts.avatar || "🏀",
    text: opts.text,
    tag: opts.tag || null,
    likes: baseLikes,
    reposts: baseReposts,
    liked: false,
    replied: null,
    replyText: null,
    replyEffect: null,
    comments: opts.comments || [],
  };
  p.social.posts.unshift(post);
  if (p.social.posts.length > 35) p.social.posts.length = 35;
  if (opts.kind !== "player") {
    p.social.unread = clamp((p.social.unread || 0) + 1, 0, 99);
  }
  return post;
}

function seedInitialSocialPosts(p) {
  const lgName = LEAGUES[p.league] ? LEAGUES[p.league].name : p.league;
  if (p.scenario && p.scenario.id === "mrIrrelevant") {
    createSocialPost(p, {
      kind: "critic",
      when: `Post-Draft ${p.year}`,
      author: "Draft Insider USA",
      handle: "@DraftInsiderUSA",
      badge: "📊 Mock Draft",
      verified: true,
      avatar: "🎙️",
      text: `Con la 60ª e ultima chiamata i ${p.team.name} scelgono ${p.firstName} ${p.lastName}. Classica chiamata per riempire il tabellone: riuscirà a superare il training camp prima di essere tagliato? 🤔`,
    });
    createSocialPost(p, {
      kind: "fan",
      when: `Training Camp ${p.year}`,
      author: `Ultras ${p.team.name}`,
      handle: `@Tifosi_${p.team.name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10)}`,
      badge: "📣 Tifosi",
      verified: false,
      avatar: "🏀",
      text: `Benvenuto ${p.firstName}! La maglia #${p.jerseyNumber != null ? p.jerseyNumber : 23} dovrai sudarla dal primo minuto. Testa bassa e zittisci tutti! 💪🔥`,
    });
    p.social.unread = 2;
    return;
  }
  if (p.scenario && p.scenario.id === "oneClubMan") {
    createSocialPost(p, {
      kind: "fan",
      when: `Inizio ${p.year}`,
      author: `Fedelissimi ${p.team.name}`,
      handle: `@Cuore_${p.team.name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10)}`,
      badge: "🛡️ Fedelissimi",
      verified: false,
      avatar: "⭐",
      text: `Oggi inizia la storia di ${p.firstName} ${p.lastName} con la nostra maglia. Vogliamo giocatori che amino questi colori: diventa la nostra bandiera! 🛡️❤️`,
    });
    createSocialPost(p, {
      kind: "media",
      when: `Pre-stagione ${p.year}`,
      author: "Tribuna Quotidiana",
      handle: "@TribunaQuotidiana",
      badge: "📰 Stampa",
      verified: true,
      avatar: "📰",
      text: `Il giovane ${p.firstName} ${p.lastName} sposa il progetto di ${p.team.name}: "Voglio fare la storia qui". Promessa romantica in un basket sempre più frenetico. 🏀`,
    });
    p.social.unread = 2;
    return;
  }
  if (isMinorItaLeague(p.league)) {
    createSocialPost(p, {
      kind: "fan",
      when: `Inizio ${p.year}`,
      author: `Amici del Campetto ${p.team.city}`,
      handle: `@Campetto_${p.team.city.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10)}`,
      badge: "🍻 Bar dello Sport",
      verified: false,
      avatar: "🏀",
      text: `Stasera tutti in palestra a fare il tifo per ${p.firstName} e la ${p.team.name} in ${lgName}! Se ne metti 20 birra pagata in piazza! 🍺🔥`,
    });
    createSocialPost(p, {
      kind: "fan",
      when: `Pre-stagione ${p.year}`,
      author: "Basket di Provincia",
      handle: "@MinorsBasketIT",
      badge: "🏀 Minors",
      verified: false,
      avatar: "📣",
      text: `Al via la stagione di ${lgName}! Tra palestre fredde, fischi casalinghi e tanta passione vera: in bocca al lupo a ${p.firstName} ${p.lastName} e a tutta la ${p.team.name}! 💪`,
    });
    p.social.unread = 2;
    return;
  }
  const mediaAcc = socialPick(SOCIAL_ACCOUNTS.media, `${p.firstName}:init1`);
  const fanAcc = socialPick(SOCIAL_ACCOUNTS.fan, `${p.lastName}:init2`);
  createSocialPost(p, {
    kind: "fan",
    when: `Inizio ${p.year}`,
    author: `Curva ${p.team.name}`,
    handle: `@Tifosi_${p.team.name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12)}`,
    badge: "📣 Tifosi",
    verified: false,
    avatar: fanAcc.avatar,
    text: `Curiosi di vedere cosa combinerà ${p.firstName} ${p.lastName} (#${p.jerseyNumber != null ? p.jerseyNumber : 23}) con la maglia di ${p.team.name} in ${lgName}! Facci sognare! 🔥🏀`,
  });
  createSocialPost(p, {
    kind: "media",
    when: `Pre-stagione ${p.year}`,
    author: mediaAcc.name,
    handle: mediaAcc.handle,
    badge: mediaAcc.badge,
    verified: true,
    avatar: mediaAcc.avatar,
    text: `👀 Occhi puntati su ${p.firstName} ${p.lastName} (${p.age} anni, OVR ${p.overall}): inizia l'avventura con ${p.team.name} in ${lgName}. Fin dove potrà arrivare?`,
  });
  p.social.unread = 2;
}

/* Hook automatici sugli eventi della carriera */
function onSeasonBlockSocial(p, block) {
  if (!p || !block) return;
  ensureSocialState(p);
  const seed = `${p.year}:${block.id}:${block.wins}:${block.losses}`;
  const st = block.stats || { pts: 0, reb: 0, ast: 0 };
  const mediaAcc = socialPick(SOCIAL_ACCOUNTS.media, seed + ":m");

  if (block.keyGame) {
    const kg = block.keyGame;
    const fanAcc = socialPick(SOCIAL_ACCOUNTS.fan, seed + ":kg");
    createSocialPost(p, {
      kind: kg.success ? "fan" : "critic",
      when: `${block.name} · ${p.year}`,
      author: kg.success ? `Ultras ${p.team.name}` : "Hardwood Critic",
      handle: kg.success ? `@Curva_${p.team.name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10)}` : "@HardwoodCritic",
      badge: kg.success ? "📣 Tifosi" : "🧐 Critico",
      verified: false,
      avatar: kg.success ? "🎯" : "💔",
      viral: true,
      text: kg.success
        ? `🚨 CLUTCH! ${p.firstName} ${p.lastName} la decide all'ultimo respiro contro ${kg.opponent} (${kg.label})! Ghiaccio nelle vene! 🥶🎯`
        : `Ultimo possesso contro ${kg.opponent} sprecato da ${p.lastName}... Nei momenti che contano serve ben altra freddezza. 😬📉`,
      comments: [
        { author: fanAcc.name, handle: fanAcc.handle, text: kg.success ? "Statua subito fuori dal palazzetto!! 🔥" : "Fa male perderla così all'ultimo secondo." },
      ],
    });
  }

  if (st.pts >= 20 || block.wins > block.losses) {
    createSocialPost(p, {
      kind: "media",
      when: `${block.name} · ${p.year}`,
      author: mediaAcc.name,
      handle: mediaAcc.handle,
      badge: mediaAcc.badge,
      verified: true,
      avatar: mediaAcc.avatar,
      text: `📊 Numeri solidi per ${p.firstName} ${p.lastName} in "${block.name}" con ${p.team.name}: ${st.pts} PTS, ${st.reb} REB, ${st.ast} AST di media (record tratto: ${block.wins}-${block.losses}). 🔥`,
    });
  } else {
    const criticAcc = socialPick(SOCIAL_ACCOUNTS.critic, seed + ":c");
    createSocialPost(p, {
      kind: "critic",
      when: `${block.name} · ${p.year}`,
      author: criticAcc.name,
      handle: criticAcc.handle,
      badge: criticAcc.badge,
      verified: false,
      avatar: criticAcc.avatar,
      text: `Momento complicato per ${p.team.name} (${block.wins}-${block.losses} in ${block.name}). Da ${p.lastName} (${st.pts} PTS di media) i tifosi si aspettano una scossa immediata. 👀📉`,
    });
  }
}

function onInterviewSocial(iv, toneId) {
  if (!player || !iv) return;
  ensureSocialState(player);
  const ctx = INTERVIEW_CONTEXTS[iv.context] || INTERVIEW_CONTEXTS.default;
  const tone = INTERVIEW_TONES.find(t => t.id === toneId);
  if (!tone) return;
  const quote = ctx.a[tone.id] || ctx.a.confident;
  const outlet = interviewOutlet(iv);
  const isSpicy = toneId === "polemic" || toneId === "ironic" || toneId === "confident";
  if (isSpicy) {
    player.social.bonusFollowers = (player.social.bonusFollowers || 0) + Math.max(150, Math.round(socialFollowersCount(player) * 0.02));
  }
  createSocialPost(player, {
    kind: isSpicy ? "critic" : "media",
    when: `Sala Stampa · ${player.year}`,
    author: outlet,
    handle: `@${outlet.replace(/[^a-zA-Z0-9]/g, "")}`,
    badge: "🎙️ Conferenza",
    verified: true,
    avatar: "🎤",
    viral: isSpicy,
    text: `🎙️ ${player.firstName} ${player.lastName} in conferenza stampa (${tone.label}): “${quote}” — Siete d'accordo con le sue parole? 👇`,
    comments: [
      isSpicy
        ? { author: "Sesto Uomo", handle: "@SestoUomo_Official", text: "Personalità da vendere, finalmente qualcuno che non dice frasi fatte! 🔥🍿" }
        : { author: "Curva Parquet", handle: "@CurvaParquet", text: "Risposta da vero leader, testa alla prossima partita! 👏" },
    ],
  });
}

function onInterviewFollowUpSocial(iv, followId) {
  if (!player || !iv) return;
  ensureSocialState(player);
  const opt = INTERVIEW_FOLLOWUP_OPTIONS.find(o => o.id === followId);
  if (!opt) return;
  const fanAcc = socialPick(SOCIAL_ACCOUNTS.fan, `${player.year}:${followId}`);
  createSocialPost(player, {
    kind: followId === "rivals" ? "critic" : "fan",
    when: `Post-Conferenza · ${player.year}`,
    author: fanAcc.name,
    handle: fanAcc.handle,
    badge: fanAcc.badge,
    verified: false,
    avatar: opt.icon,
    text: `Le ultime parole di ${player.lastName} prima di lasciare il podio: “${opt.quote}” ${followId === "rivals" ? "🔥 Sfida lanciata agli avversari!" : "🙌"}`,
  });
}

function onBuyoutSocial(p, oldTeam) {
  if (!p || !oldTeam) return;
  ensureSocialState(p);
  createSocialPost(p, {
    kind: "critic",
    when: `Mercato · ${p.year}`,
    author: `Curva ${oldTeam.name}`,
    handle: `@Ultras_${oldTeam.name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10)}`,
    badge: "😡 Ex Tifosi",
    verified: false,
    avatar: "🐍",
    viral: true,
    text: `🚪 ${p.firstName} ${p.lastName} ha rescisso il contratto con ${oldTeam.name} tramite buyout per andare sul mercato! Non ci si comporta così con chi ti ha sempre sostenuto! 😤💔`,
    comments: [
      { author: "Hoops Central", handle: "@HoopsCentral", text: `🚨 CLAMOROSO: ${p.lastName} è ufficialmente sul mercato! Asta aperta tra i club.` },
    ],
  });
}

function onNewsSocial(text) {
  if (!player || !text) return;
  ensureSocialState(player);
  // Filtra le notizie più importanti per non duplicare quelle già coperte da conferenza/buyout
  if (text.startsWith("🎤")) return;
  const isTrophy = /🏆|Campione|Trionfo|MVP|All-Star|Weekend delle stelle|Scadenza del mercato|Firma|Nuovo contratto/i.test(text);
  if (!isTrophy && (player.social.posts.length > 4 && socialHash(text) % 3 !== 0)) return;
  const mediaAcc = socialPick(SOCIAL_ACCOUNTS.media, text);
  createSocialPost(player, {
    kind: "media",
    when: `Notizia · ${player.year}`,
    author: mediaAcc.name,
    handle: mediaAcc.handle,
    badge: "🚨 Breaking",
    verified: true,
    avatar: "🚨",
    viral: /🏆|MVP|Campione/i.test(text),
    text: text,
  });
}

/* Azioni interattive dell'utente nella tab Social */
function publishPlayerSocialPost(actionId) {
  if (!player) return;
  ensureSocialState(player);
  if (!canPostOnSocial(player)) {
    toast("⏳ Hai già pubblicato un post in questo step della stagione!");
    return;
  }
  const act = SOCIAL_POST_ACTIONS.find(a => a.id === actionId);
  if (!act) return;

  pApplySocialAction(player, act);
  player.social.lastPostStepKey = socialCurrentStepKey(player);

  const post = createSocialPost(player, {
    kind: "player",
    when: `Adesso · ${player.year}`,
    author: `${player.firstName} ${player.lastName}`,
    handle: playerSocialHandle(player),
    badge: "🏀 Giocatore",
    verified: isPlayerSocialVerified(player),
    avatar: "⭐",
    viral: actionId === "cryptic" || actionId === "flex",
    text: act.buildText(player),
    tag: act.label,
    comments: act.comments ? act.comments(player) : [],
  });
  post.liked = true;
  renderGameScreen();
}

function pApplySocialAction(p, act) {
  const e = act.effects || {};
  const fBefore = socialFollowersCount(p);
  const gainedFollowers = Math.max(40, Math.round(fBefore * (e.followerPct || 0.02)));
  p.social.bonusFollowers = (p.social.bonusFollowers || 0) + gainedFollowers;

  if (e.popularity) p.popularity = clamp((p.popularity || 50) + e.popularity, 0, 100);
  if (e.morale) p.morale = clamp((p.morale || 50) + e.morale, 0, 100);
  if (e.chemistry) p.chemistry = clamp((p.chemistry || 50) + e.chemistry, 0, 100);
  if (e.reputation && typeof changeReputation === "function") changeReputation(p, e.reputation);
  if (e.coachTrust && typeof changeCoachTrust === "function") changeCoachTrust(p, e.coachTrust);
  if (e.starRapport && typeof starRapportOf === "function") p.starRapport = clamp(starRapportOf(p) + e.starRapport, 0, 100);

  let moneyNote = "";
  if (e.sponsorPayout) {
    const payout = socialSponsorPayout(p);
    p.wealth = roundMoney((p.wealth || 0) + payout);
    moneyNote = ` · +${fmtMoney(payout, playerCurrency(p))}`;
  }
  toast(`📱 Post pubblicato su CourtX! (+${fmtFollowers(gainedFollowers)} follower${moneyNote})`);
}

function toggleSocialLike(postId) {
  if (!player || !player.social) return;
  const post = player.social.posts.find(x => x.id === postId);
  if (!post) return;
  if (!post.liked) {
    post.liked = true;
    post.likes = (post.likes || 0) + 1;
    if (!post.likeRewarded) {
      post.likeRewarded = true;
      player.morale = clamp((player.morale || 50) + 1, 0, 100);
    }
  } else {
    post.liked = false;
    post.likes = Math.max(0, (post.likes || 1) - 1);
  }
  renderSocialTab();
}

function replyToSocialPost(postId, replyId) {
  if (!player || !player.social) return;
  const post = player.social.posts.find(x => x.id === postId);
  if (!post || post.replied) return;
  const opt = SOCIAL_REPLY_OPTIONS.find(o => o.id === replyId);
  if (!opt) return;

  const e = opt.effects || {};
  const fBefore = socialFollowersCount(player);
  const gained = Math.max(25, Math.round(fBefore * (e.followerPct || 0.015)));
  player.social.bonusFollowers = (player.social.bonusFollowers || 0) + gained;

  if (e.popularity) player.popularity = clamp((player.popularity || 50) + e.popularity, 0, 100);
  if (e.morale) player.morale = clamp((player.morale || 50) + e.morale, 0, 100);
  if (e.chemistry) player.chemistry = clamp((player.chemistry || 50) + e.chemistry, 0, 100);
  if (e.reputation && typeof changeReputation === "function") changeReputation(player, e.reputation);
  if (e.coachTrust && typeof changeCoachTrust === "function") changeCoachTrust(player, e.coachTrust);

  let effectSummary = `${opt.tag} · +${fmtFollowers(gained)} follower`;
  if (replyId === "clapback") {
    const avgOvr = (LEAGUES[player.league] && LEAGUES[player.league].avgOverall) || 70;
    if (player.overall >= avgOvr) {
      changeReputation(player, 1);
      effectSummary = `🔥 RATIO RIUSCITO! Pop +4 · Morale +3 · Rep +1 · +${fmtFollowers(gained)} follower`;
    } else {
      changeReputation(player, -2);
      effectSummary = `⚠️ Polemica social: Pop +4 · Rep −2 · +${fmtFollowers(gained)} follower`;
    }
  }

  post.replied = replyId;
  post.replyText = opt.buildReply(player);
  post.replyEffect = effectSummary;
  post.liked = true;
  post.likes = (post.likes || 0) + Math.max(5, Math.round(gained * 0.25));

  toast(`💬 Risposta inviata a ${post.handle}! (${effectSummary})`);
  renderGameScreen();
}

function setSocialFilter(filterId) {
  if (!player) return;
  ensureSocialState(player);
  player.social.filter = filterId;
  renderSocialTab();
}

function renderSocialTab() {
  const container = el("social-screen-body");
  if (!container || !player) return;
  ensureSocialState(player);

  const badgeEl = el("social-unread-badge");
  if (badgeEl) {
    const unread = player.social.unread || 0;
    badgeEl.textContent = unread > 9 ? "9+" : String(unread);
    badgeEl.classList.toggle("hidden", unread <= 0);
  }

  const followers = socialFollowersCount(player);
  const handle = playerSocialHandle(player);
  const verified = isPlayerSocialVerified(player);
  const sent = socialSentiment(player);
  const canPost = canPostOnSocial(player);
  const curFilter = player.social.filter || "all";
  const roleObj = typeof ROLES !== "undefined" ? ROLES.find(r => r.id === player.role) : null;
  const bioRole = roleObj ? roleObj.name : player.role;
  const lgName = LEAGUES[player.league] ? LEAGUES[player.league].name : player.league;

  const allPosts = player.social.posts || [];
  const filteredPosts = allPosts.filter(post => {
    if (curFilter === "mine") return post.kind === "player" || !!post.replied;
    if (curFilter === "media") return post.kind === "media" || post.kind === "critic";
    if (curFilter === "fans") return post.kind === "fan" || post.kind === "teammate";
    return true;
  });

  container.innerHTML = `
    <div class="social-layout">
      <!-- COLONNA SINISTRA: PROFILO COURTX + CREA POST -->
      <div class="social-sidebar">
        <div class="card social-profile-card">
          <div class="sp-banner" style="--team-a:${(player.team && player.team.colors && player.team.colors[0]) || "#ff5a1f"};--team-b:${(player.team && player.team.colors && player.team.colors[1]) || "#1a2234"}">
            <span class="sp-network-tag">📱 COURTX</span>
          </div>
          <div class="sp-head">
            <div class="sp-avatar">${player.firstName ? player.firstName[0] : "P"}${player.lastName ? player.lastName[0] : "1"}</div>
            <div class="sp-identity">
              <div class="sp-name">
                ${player.firstName} ${player.lastName}
                ${verified ? `<span class="sp-verified" title="Account Verificato CourtX">✔️</span>` : ""}
              </div>
              <div class="sp-handle">${handle}</div>
            </div>
          </div>
          <p class="sp-bio">
            🏀 ${bioRole} @ <strong>${player.team.name}</strong> (${lgName})
            ${player.trophies && player.trophies.titles ? ` · 🏆 ${player.trophies.titles}x Campione` : ""}
            ${player.trophies && player.trophies.nationalCups ? ` · 🏆 ${player.trophies.nationalCups}x Coppa` : ""}
            · #${player.jerseyNumber != null ? player.jerseyNumber : 23} · #F3NOM
          </p>
          <div class="sp-stats">
            <div class="sp-stat">
              <span class="sp-stat-val">${fmtFollowers(followers)}</span>
              <span class="sp-stat-lbl">Follower</span>
            </div>
            <div class="sp-stat">
              <span class="sp-stat-val">${player.popularity || 0}/100</span>
              <span class="sp-stat-lbl">Popolarità</span>
            </div>
            <div class="sp-stat">
              <span class="sp-stat-val">${allPosts.filter(x => x.kind === "player" || x.replied).length}</span>
              <span class="sp-stat-lbl">Interazioni</span>
            </div>
          </div>
          <div class="sp-sentiment">
            <div class="sp-sent-top">
              <span class="small-muted">Umore della piazza</span>
              <span class="badge ${sent.tone}">${sent.icon} ${sent.label}</span>
            </div>
            <p class="small-muted" style="margin:4px 0 0;font-size:0.82rem">${sent.desc}</p>
          </div>
        </div>

        <div class="card social-compose-card">
          <div class="card-title">
            <h3>✍️ Pubblica un Post</h3>
            <span class="badge ${canPost ? "blue" : ""}">${canPost ? "1 disponibile" : "Già pubblicato"}</span>
          </div>
          <p class="small-muted" style="margin-bottom:10px">
            ${canPost
              ? "Scegli cosa condividere con i tuoi follower in questo step della stagione:"
              : "Hai già pubblicato un post in questo turno. Avanza nella stagione per pubblicarne un altro!"}
          </p>
          <div class="social-compose-list">
            ${SOCIAL_POST_ACTIONS.map(a => {
              const extraSub = a.id === "flex" ? `Incasso +${fmtMoney(socialSponsorPayout(player), playerCurrency(player))} · Pop +3 · Coach −1` : a.sub;
              const tagsHtml = extraSub.split(" · ").map(t => `<span class="badge">${t}</span>`).join("");
              return `
                <button type="button" class="option-card social-action-btn" data-social-post="${a.id}" ${canPost ? "" : "disabled"}>
                  <div class="sa-title">${a.icon} ${a.label}</div>
                  <div class="sa-desc">${a.desc}</div>
                  <div class="sa-tags">${tagsHtml}</div>
                </button>`;
            }).join("")}
          </div>
        </div>
      </div>

      <!-- COLONNA DESTRA: FEED CRONOLOGICO E RISPOSTE -->
      <div class="social-feed-col">
        <div class="card">
          <div class="flex-between" style="flex-wrap:wrap;gap:8px;margin-bottom:12px">
            <h3 style="margin:0">🔥 Feed CourtX in tempo reale</h3>
            <div class="social-filters">
              <button type="button" class="league-pill ${curFilter === "all" ? "active" : ""}" data-social-filter="all">Tutti (${allPosts.length})</button>
              <button type="button" class="league-pill ${curFilter === "media" ? "active" : ""}" data-social-filter="media">📰 Media & Critici</button>
              <button type="button" class="league-pill ${curFilter === "fans" ? "active" : ""}" data-social-filter="fans">📣 Tifosi & Squadra</button>
              <button type="button" class="league-pill ${curFilter === "mine" ? "active" : ""}" data-social-filter="mine">⭐ I tuoi post</button>
            </div>
          </div>

          <div class="social-feed-list">
            ${filteredPosts.length ? filteredPosts.map(post => socialPostCardHtml(post, player)).join("") : `<p class="small-muted" style="text-align:center;padding:24px 0">Nessun post in questa categoria.</p>`}
          </div>
        </div>
      </div>
    </div>
  `;

  container.querySelectorAll("[data-social-post]").forEach(btn => {
    btn.addEventListener("click", () => publishPlayerSocialPost(btn.dataset.socialPost));
  });
  container.querySelectorAll("[data-social-filter]").forEach(btn => {
    btn.addEventListener("click", () => setSocialFilter(btn.dataset.socialFilter));
  });
  container.querySelectorAll("[data-social-like]").forEach(btn => {
    btn.addEventListener("click", () => toggleSocialLike(btn.dataset.socialLike));
  });
  container.querySelectorAll("[data-social-reply]").forEach(btn => {
    btn.addEventListener("click", () => {
      const [postId, replyId] = btn.dataset.socialReply.split(":");
      replyToSocialPost(postId, replyId);
    });
  });
}

function socialPostCardHtml(post, p) {
  const isPlayer = post.kind === "player";
  const isCritic = post.kind === "critic";
  const canReply = !isPlayer && !post.replied;
  return `
    <article class="social-post ${isPlayer ? "is-player" : ""} ${isCritic ? "is-critic" : ""}">
      <div class="spost-top">
        <div class="spost-avatar">${post.avatar || "🏀"}</div>
        <div class="spost-meta">
          <div class="spost-author-row">
            <strong class="spost-author">${post.author}</strong>
            ${post.verified ? `<span class="sp-verified" title="Verificato">✔️</span>` : ""}
            <span class="spost-handle">${post.handle}</span>
            ${post.badge ? `<span class="badge ${isCritic ? "red" : isPlayer ? "gold" : ""}">${post.badge}</span>` : ""}
          </div>
          <div class="spost-when">${post.when || `Stagione ${post.year}`}</div>
        </div>
      </div>

      <p class="spost-body">${post.text}</p>

      <div class="spost-actions">
        <button type="button" class="spost-act-btn ${post.liked ? "liked" : ""}" data-social-like="${post.id}">
          ${post.liked ? "❤️" : "🤍"} <span>${fmtFollowers(post.likes || 0)}</span>
        </button>
        <span class="spost-stat">🔁 ${fmtFollowers(post.reposts || 0)}</span>
        <span class="spost-stat">💬 ${(post.comments ? post.comments.length : 0) + (post.replied ? 1 : 0)}</span>
      </div>

      ${(post.comments && post.comments.length) ? `
        <div class="spost-comments">
          ${post.comments.map(c => `
            <div class="spost-comment">
              <strong>${c.author}</strong> <span class="spost-handle">${c.handle}</span>: ${c.text}
            </div>`).join("")}
        </div>` : ""}

      ${post.replied ? `
        <div class="spost-player-reply">
          <div class="spost-reply-head">
            <strong>↪️ ${p.firstName} ${p.lastName}</strong> <span class="spost-handle">${playerSocialHandle(p)}</span>
          </div>
          <div class="spost-reply-text">“${post.replyText}”</div>
          ${post.replyEffect ? `<div class="iv-result" style="margin-top:4px">${post.replyEffect}</div>` : ""}
        </div>` : ""}

      ${canReply ? `
        <div class="spost-reply-bar">
          <span class="small-muted" style="font-size:0.78rem">Rispondi:</span>
          ${SOCIAL_REPLY_OPTIONS.map(o => `
            <button type="button" class="btn btn-ghost btn-sm spost-reply-chip" data-social-reply="${post.id}:${o.id}" title="${o.tag}">
              ${o.icon} ${o.label}
            </button>`).join("")}
        </div>` : ""}
    </article>
  `;
}

