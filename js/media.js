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

function interviewHtml(iv, dataAttr, followAttr) {
  const ctx = INTERVIEW_CONTEXTS[iv.context] || INTERVIEW_CONTEXTS.default;
  const fAttr = followAttr || `${dataAttr}-follow`;
  const outlet = interviewOutlet(iv);

  if (iv.answered) {
    const tone = INTERVIEW_TONES.find(t => t.id === iv.answered);
    const quote = tone ? (ctx.a[tone.id] || ctx.a.confident) : null;
    const reaction = tone ? PRESS_REACTIONS[tone.id] : null;
    const followQ = ctx.followQ || "Un'ultima battuta per chiudere la conferenza stampa?";

    // Se ha risposto con un tono (non "none") e non ha ancora risposto all'incalzo, mostra la 2ª domanda interattiva!
    if (tone && !iv.followUpAnswered) {
      return `
        <div class="interview-box interactive-followup">
          <div class="iv-meta"><span class="badge blue">${outlet}</span> <span class="small-muted">· Domanda 1 di 2 completata</span></div>
          <div class="iv-q">🎤 “${ctx.q}”</div>
          <div class="iv-a">${tone.icon} <strong>${tone.label}:</strong> “${quote}”</div>
          ${reaction ? `<div class="iv-reaction small-muted" style="margin:6px 0">${reaction}</div>` : ""}
          ${iv.result ? `<div class="iv-result">${iv.result}</div>` : ""}
          <div class="iv-followup-block" style="margin-top:12px;padding-top:10px;border-top:1px solid var(--line, var(--border))">
            <div class="iv-q">🎙️ <strong>Incalzo dalla sala stampa:</strong> “${followQ}”</div>
            <div class="sb-options" style="margin-top:8px">
              ${INTERVIEW_FOLLOWUP_OPTIONS.map(o => `
                <button type="button" class="option-card sb-choice" ${fAttr}="${o.id}">
                  <div class="oc-title">${o.icon} ${o.label}</div>
                  <div class="oc-desc">“${o.quote}”</div>
                </button>`).join("")}
            </div>
            <button type="button" class="btn btn-ghost btn-sm iv-skip" ${fAttr}="none">👋 Saluta e lascia il podio</button>
          </div>
        </div>`;
    }

    const followOpt = iv.followUpAnswered && iv.followUpAnswered !== "none"
      ? INTERVIEW_FOLLOWUP_OPTIONS.find(o => o.id === iv.followUpAnswered)
      : null;

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
    <div class="interview-box">
      <div class="iv-meta" style="margin-bottom:6px"><span class="badge blue">${outlet}</span> <span class="small-muted">· Scegli il tono della tua risposta</span></div>
      <div class="iv-q">🎤 “${ctx.q}”</div>
      <div class="sb-options">
        ${INTERVIEW_TONES.map(t => `
          <button type="button" class="option-card sb-choice" ${dataAttr}="${t.id}">
            <div class="oc-title">${t.icon} ${t.label} ${t.tag ? `<span class="badge">${t.tag}</span>` : ""}</div>
            <div class="oc-desc">“${ctx.a[t.id] || ctx.a.confident}”</div>
          </button>`).join("")}
      </div>
      <button type="button" class="btn btn-ghost btn-sm iv-skip" ${dataAttr}="none">🤐 Nessun commento</button>
    </div>`;
}

function answerInterviewObj(iv, toneId) {
  if (!iv || iv.answered) return;
  iv.answered = toneId;
  iv.result = toneId === "none" ? null : applyInterviewTone(toneId);
  if (toneId === "none") iv.followUpAnswered = "none";
  renderGameScreen();
}

function answerInterviewFollowUpObj(iv, followId) {
  if (!iv || !iv.answered || iv.followUpAnswered) return;
  iv.followUpAnswered = followId;
  iv.followUpResult = followId === "none" ? null : applyInterviewFollowUp(followId);
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

  extra.innerHTML = `
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
  extra.querySelectorAll("[data-recap-tone]").forEach(b => b.addEventListener("click", () => answerRecapInterview(b.dataset.recapTone)));
  extra.querySelectorAll("[data-recap-follow]").forEach(b => b.addEventListener("click", () => answerRecapFollowUp(b.dataset.recapFollow)));
  el("btn-recap-continue").addEventListener("click", closeSeasonRecap);
}
