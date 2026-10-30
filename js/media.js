"use strict";

/* ================================================================
   MEDIA E INTERVISTE — dopo le partite chiave e a fine stagione una domanda dei
   giornalisti; il tono della risposta muove popolarità, reputazione, chimica e morale.
   ================================================================ */
const INTERVIEW_TONES = [
  { id: "humble", icon: "🤝", label: "Umile", labelEn: "Humble", tag: "Spogliatoio", tagEn: "Locker Room", effects: { chemistry: 4, reputation: 1, popularity: 1 }, note: "Il gruppo apprezza la tua umiltà.", noteEn: "The locker room appreciates your humility." },
  { id: "confident", icon: "😎", label: "Sicuro di sé", labelEn: "Confident", tag: "Carisma", tagEn: "Charisma", effects: { popularity: 4, morale: 3, coachTrust: 2 }, note: "I tifosi adorano la tua sicurezza.", noteEn: "Fans love your confidence." },
  { id: "leader", icon: "🫡", label: "Uomo squadra", labelEn: "Team Leader", tag: "Leadership", tagEn: "Leadership", effects: { coachTrust: 4, chemistry: 3, starRapport: 3, reputation: 2 }, note: "Parole da leader vero: coach e compagni ti seguono.", noteEn: "True leader's words: coach and teammates follow you." },
  { id: "ambitious", icon: "🎯", label: "Affamato", labelEn: "Hungry", tag: "Mentalità", tagEn: "Mindset", effects: { morale: 4, coachTrust: 2, reputation: 1, chemistry: -1 }, note: "Mostri una fame insaziabile: non ti accontenti mai.", noteEn: "You show an insatiable hunger: never satisfied." },
  { id: "ironic", icon: "😏", label: "Showman", labelEn: "Showman", tag: "Media & Social", tagEn: "Media & Social", effects: { popularity: 6, morale: 3, starRapport: 1, coachTrust: -1 }, note: "Battuta virale sui social: i media impazziscono.", noteEn: "Viral joke on social media: the press goes wild." },
  { id: "polemic", icon: "🔥", label: "Polemico", labelEn: "Controversial", tag: "Scintille", tagEn: "Sparks", effects: { popularity: 7, chemistry: -6, reputation: -2, coachTrust: -4 }, note: "Fai notizia, ma nello spogliatoio c'è chi storce il naso.", noteEn: "You make headlines, but some in the locker room aren't happy." },
];
if (typeof i18nify === "function") i18nify(INTERVIEW_TONES);

const PRESS_JOURNALISTS = [
  {
    id: "spicy",
    name: "Mike 'Hot Take' Sullivan",
    nameEn: "Mike 'Hot Take' Sullivan",
    outlet: "Prime Time Sports TV",
    outletEn: "Prime Time Sports TV",
    tag: "🌶️ Cronista d'Assalto",
    tagEn: "🌶️ Hard-Hitting Pundit",
    avatar: "🌶️",
  },
  {
    id: "tactical",
    name: "Marco Tattica",
    nameEn: "Marcus Vance",
    outlet: "Gazzetta del Parquet",
    outletEn: "Hardwood Analytics",
    tag: "🧐 Analista Tattico",
    tagEn: "🧐 Tactical Analyst",
    avatar: "🧐",
  },
  {
    id: "local",
    name: "Elena Curva",
    nameEn: "Dave Miller",
    outlet: "Radio Cuore & Tifo",
    outletEn: "City Radio & Fan Beat",
    tag: "🏟️ Voce dei Tifosi",
    tagEn: "🏟️ Club Beat Writer",
    avatar: "🏟️",
  },
  {
    id: "global",
    name: "Pierre Laurent",
    nameEn: "Pierre Laurent",
    outlet: "EuroBasket Daily",
    outletEn: "Global Hoops Insider",
    tag: "🌍 Inviato Internazionale",
    tagEn: "🌍 Global Insider",
    avatar: "🌍",
  },
  {
    id: "courtside",
    name: "Sofia Bordocampo",
    nameEn: "Sophia Courtside",
    outlet: "Slam Live Network",
    outletEn: "Slam Live Network",
    tag: "🎤 Inviata dal Parquet",
    tagEn: "🎤 Courtside Reporter",
    avatar: "🎤",
  },
  {
    id: "veteran",
    name: "Bruno 'Il Professore' Santi",
    nameEn: "Arthur 'The Dean' Sterling",
    outlet: "Corriere del Basket Storico",
    outletEn: "Hardwood Chronicles",
    tag: "📜 Decano del Basket",
    tagEn: "📜 Hall of Fame Writer",
    avatar: "📜",
  },
  {
    id: "creator",
    name: "Zack 'The Clip' Reynolds",
    nameEn: "Zack 'The Clip' Reynolds",
    outlet: "HoopCulture Podcast & Viral",
    outletEn: "HoopCulture Podcast & Viral",
    tag: "📱 Creator & Podcaster",
    tagEn: "📱 Digital Creator & Podcaster",
    avatar: "📱",
  },
  {
    id: "insider",
    name: "Chloe Bennett",
    nameEn: "Chloe Bennett",
    outlet: "The Locker Room Scoop",
    outletEn: "The Locker Room Scoop",
    tag: "🕵️‍♀️ Insider di Spogliatoio",
    tagEn: "🕵️‍♀️ Locker Room Insider",
    avatar: "🕵️‍♀️",
  },
];

function getInterviewJournalist(iv) {
  if (!iv) return PRESS_JOURNALISTS[0];
  const ctxKey = iv.context || "default";

  let match = null;
  if (ctxKey === "trashTalkingViral" || ctxKey === "lifestyleGossip") {
    match = PRESS_JOURNALISTS.find(j => j.id === "creator");
  } else if (ctxKey === "lockerRoomDramaRumors" || ctxKey === "tradeDeadlineEve" || ctxKey === "tradeRumorsPressure") {
    match = PRESS_JOURNALISTS.find(j => j.id === "insider");
  } else if (ctxKey === "lockdownDefenseMasterclass" || ctxKey === "defenseWinUgly") {
    match = PRESS_JOURNALISTS.find(j => j.id === "tactical");
  } else if (ctxKey === "fanProtestTension" || ctxKey === "hometownHomecoming") {
    match = PRESS_JOURNALISTS.find(j => j.id === "local");
  } else if (ctxKey === "refBuzzerControversy" || ctxKey === "blowoutLossApology" || ctxKey === "allStarSnub") {
    match = PRESS_JOURNALISTS.find(j => j.id === "spicy");
  } else if (ctxKey === "buzzerBeaterHero" || ctxKey === "overtimeHeartbreak2OT" || ctxKey === "keyGameWin" || ctxKey === "keyGameLoss") {
    match = PRESS_JOURNALISTS.find(j => j.id === "courtside");
  } else if (ctxKey === "farewell" || ctxKey === "contractExtensionCelebration" || ctxKey === "historicTripleDouble" || ctxKey === "champion" || ctxKey === "mvp") {
    match = PRESS_JOURNALISTS.find(j => j.id === "veteran");
  }

  if (!match) {
    const seed = ctxKey + ":" + (player ? player.year || 0 : 0);
    const hash = socialHash(seed);
    match = PRESS_JOURNALISTS[hash % PRESS_JOURNALISTS.length];
  }

  const j = match || PRESS_JOURNALISTS[0];
  return {
    id: j.id,
    name: isEn() ? j.nameEn : j.name,
    outlet: isEn() ? j.outletEn : j.outlet,
    tag: isEn() ? j.tagEn : j.tag,
    avatar: j.avatar,
  };
}

const PRESS_OUTLETS = [
  "🎙️ Gazzetta del Parquet · Sala Stampa",
  "🎙️ Hoops Insider · Microfono Aperto",
  "🎙️ EuroBasket Daily · Zona Mista",
  "🎙️ Prime Time Sport · Diretta TV",
];
const PRESS_OUTLETS_EN = [
  "🎙️ Hardwood Gazette · Press Room",
  "🎙️ Hoops Insider · Open Mic",
  "🎙️ EuroBasket Daily · Mixed Zone",
  "🎙️ Prime Time Sports · Live TV",
];

const PRESS_REACTIONS = {
  humble: "👏 Applausi composti in sala stampa: lo spogliatoio apprezza il profilo basso.",
  confident: "📸 Flash dei fotografi: la tua sicurezza conquista subito i titoli di apertura.",
  leader: "🫡 Il coach annuisce dal fondo della sala: parole da vero capitano.",
  ambitious: "🔥 Sguardi seri tra i cronisti: la tua fame di vittorie alza la pressione su tutti.",
  ironic: "😂 Risate in sala stampa: la clip della tua battuta è già virale sui social.",
  polemic: "⚡ Mormorio in sala stampa! I giornalisti scrivono a raffica: domani sarà su tutte le prime pagine.",
};
const PRESS_REACTIONS_EN = {
  humble: "👏 Polite applause in the press room: the locker room appreciates the low profile.",
  confident: "📸 Camera flashes everywhere: your confidence immediately grabs the top headlines.",
  leader: "🫡 The coach nods from the back of the room: words of a true captain.",
  ambitious: "🔥 Serious looks among reporters: your hunger for wins raises the bar for everyone.",
  ironic: "😂 Laughter in the press room: the clip of your joke is already viral on social media.",
  polemic: "⚡ Murmurs in the press room! Reporters type furiously: tomorrow it'll be on every front page.",
};
function pressReactionText(toneId) {
  return (isEn() ? PRESS_REACTIONS_EN : PRESS_REACTIONS)[toneId];
}

/* Domande per contesto: ogni contesto offre 6 risposte distinte + una domanda di incalzo (followUp) */
const INTERVIEW_CONTEXTS = {
  champion: {
    q: "Siete campioni! A chi dedichi questo titolo?",
    qEn: "You are champions! Who do you dedicate this title to?",
    a: {
      humble: "A tutta la squadra: senza i miei compagni non sarei niente.",
      confident: "Lo avevo detto a inizio anno: questa squadra era destinata a vincere.",
      leader: "Al coach, allo staff e a chi lavora nell'ombra ogni giorno per noi.",
      ambitious: "Bellissimo, ma da domani penso già al prossimo: voglio aprire un ciclo.",
      ironic: "Chiedetelo a chi aveva già prenotato le nostre vacanze due settimane fa!",
      polemic: "A chi non credeva in noi e ci dava per spacciati. E sono tanti.",
    },
    aEn: {
      humble: "To the whole team: without my teammates I wouldn't be anything.",
      confident: "I said it at the start of the year: this team was destined to win.",
      leader: "To the coach, the staff, and everyone working behind the scenes every day for us.",
      ambitious: "Amazing feeling, but tomorrow I'm already thinking about the next one: I want a dynasty.",
      ironic: "Ask the people who booked our vacation two weeks ago!",
      polemic: "To everyone who doubted us and wrote us off. And there were plenty.",
    },
    followQ: "Adesso siete la squadra da battere: come si resta al vertice?",
    followQEn: "Now you're the team to beat: how do you stay on top?",
  },
  mvp: {
    q: "Sei l'MVP della lega: che effetto fa guardare tutti dall'alto?",
    qEn: "You're the league MVP: how does it feel to look down from the top?",
    a: {
      humble: "Un premio individuale che appartiene a tutto lo spogliatoio.",
      confident: "Me lo sono meritato ogni singola sera sul parquet.",
      leader: "I miei compagni mi passano la palla nei momenti giusti: metà trofeo è loro.",
      ambitious: "È solo un punto di partenza: voglio che il mio nome resti nella storia.",
      ironic: "Devo fare spazio sulla mensola di casa, inizia a diventare stretta!",
      polemic: "Era ora: l'anno scorso me l'avevano scippato sotto gli occhi di tutti.",
    },
    aEn: {
      humble: "An individual award that belongs to the entire locker room.",
      confident: "I earned it every single night on the hardwood.",
      leader: "My teammates find me in the right spots: half of this trophy is theirs.",
      ambitious: "It's just a starting point: I want my name remembered in history.",
      ironic: "I need to clear some space on my shelf at home, it's getting crowded!",
      polemic: "About time: last year they robbed me of it in plain sight.",
    },
    followQ: "Qual è l'aspetto del tuo gioco su cui senti di fare più la differenza?",
    followQEn: "Which aspect of your game do you feel makes the biggest difference?",
  },
  finalLost: {
    q: "Una finale persa brucia sempre: cosa è mancato sul più bello?",
    qEn: "Losing a final always stings: what was missing when it mattered most?",
    a: {
      humble: "Loro sono stati più bravi nei dettagli. Torneremo più forti.",
      confident: "Ci siamo arrivati una volta, ci arriveremo di nuovo e la vinceremo.",
      leader: "Nessuno abbassi la testa nello spogliatoio: sono fiero di ogni mio compagno.",
      ambitious: "Non dormo da stanotte: userò questa rabbia in ogni allenamento estivo.",
      ironic: "Ci è mancato giusto qualche canestro in più... ma il biglietto per l'anno prossimo è già prenotato.",
      polemic: "Diciamo che certe decisioni arbitrali nei momenti chiave hanno pesato parecchio.",
    },
    aEn: {
      humble: "They executed better in the details. We'll come back stronger.",
      confident: "We got here once, we'll get here again and win it.",
      leader: "Nobody in the locker room should hang their head: I'm proud of every single teammate.",
      ambitious: "I won't sleep tonight: I'll channel this anger into every summer workout.",
      ironic: "Just a couple more buckets... but our ticket back for next year is already booked.",
      polemic: "Let's just say certain officiating calls in key moments weighed heavily.",
    },
    followQ: "Cosa dirai ai compagni prima di rompere le righe?",
    followQEn: "What will you tell your teammates before breaking camp?",
  },
  missedPlayoffs: {
    q: "Niente playoff quest'anno: di chi è la responsabilità?",
    qEn: "No playoffs this year: who takes responsibility?",
    a: {
      humble: "Anche mia: devo dare molto di più per questa maglia.",
      confident: "Ho dato tutto. Il prossimo anno la musica cambierà, ve lo garantisco.",
      leader: "Si vince e si perde insieme: proteggo il gruppo e ripartiamo da qui.",
      ambitious: "Non accetto stagioni così: pretendo un salto di qualità da me e da tutto l'ambiente.",
      ironic: "Almeno quest'estate avremo più tempo per lavorare sul tiro in palestra!",
      polemic: "Io la mia parte l'ho fatta fino in fondo. Chiedete a qualcun altro.",
    },
    aEn: {
      humble: "Mine included: I have to give much more for this jersey.",
      confident: "I gave everything. Next year the tune will change, I guarantee it.",
      leader: "We win and lose together: I protect the group and we rebuild from here.",
      ambitious: "I don't accept seasons like this: I demand a step up from myself and the whole organization.",
      ironic: "At least this summer we'll have more time to work on our jumper in the gym!",
      polemic: "I did my job from start to finish. Go ask someone else.",
    },
    followQ: "Cosa serve per riportare entusiasmo nell'ambiente?",
    followQEn: "What will it take to bring excitement back to the fanbase?",
  },
  injury: {
    q: "Una stagione condizionata dagli infortuni: come stai fisicamente e mentalmente?",
    qEn: "A season derailed by injuries: how are you feeling physically and mentally?",
    a: {
      humble: "Ringrazio lo staff medico, lavoro in silenzio ogni giorno per tornare al 100%.",
      confident: "Tornerò più forte ed esplosivo di prima, è una promessa.",
      leader: "Anche dalla panchina ho cercato di dare una mano ai compagni in ogni partita.",
      ambitious: "Stare fuori mi ha dato una fame incredibile: non vedo l'ora di dominare.",
      ironic: "I medici ormai mi vedono più della mia famiglia, ma il peggio è passato!",
      polemic: "Mi hanno forzato a giocare quando non dovevo: la gestione poteva essere migliore.",
    },
    aEn: {
      humble: "I thank the medical staff, I'm working quietly every day to get back to 100%.",
      confident: "I'll come back stronger and more explosive than before, that's a promise.",
      leader: "Even from the bench I tried to help my teammates in every single game.",
      ambitious: "Sitting out gave me an unbelievable hunger: I can't wait to dominate.",
      ironic: "The doctors see me more than my family now, but the worst is behind me!",
      polemic: "They rushed me back when I shouldn't have played: it could have been handled much better.",
    },
    followQ: "Come cambierà la tua gestione atletica nei prossimi mesi?",
    followQEn: "How will your physical management change over the coming months?",
  },
  contractYear: {
    q: "Contratto in bilico e tante voci di mercato: quale sarà il tuo futuro?",
    qEn: "Contract up in the air and plenty of trade rumors: what does your future hold?",
    a: {
      humble: "Qui sto bene, parleremo con calma insieme alla società al momento giusto.",
      confident: "Ascolterò tutte le offerte: sul campo mi sono guadagnato il massimo.",
      leader: "La mia testa è solo sullo spogliatoio e sulle partite che abbiamo davanti.",
      ambitious: "Voglio giocare dove si punta davvero a vincere titoli importanti.",
      ironic: "Il telefono del mio agente bolle, spero abbia un buon caricabatterie!",
      polemic: "Dipende tutto da quanto questa società dimostrerà di volermi davvero.",
    },
    aEn: {
      humble: "I'm happy here, we'll sit down calmly with the front office at the right time.",
      confident: "I'll listen to all offers: I earned top value on the court.",
      leader: "My head is only on the locker room and the games ahead of us.",
      ambitious: "I want to play where they genuinely compete for major titles.",
      ironic: "My agent's phone is on fire, I hope he has a good charger!",
      polemic: "It all depends on how much this organization proves they truly want me.",
    },
    followQ: "Quanto conta il progetto tecnico rispetto all'offerta economica?",
    followQEn: "How much does the sporting project matter compared to the financial offer?",
  },
  bigSeason: {
    q: "Numeri da capogiro quest'anno: ti senti ormai nell'élite del campionato?",
    qEn: "Eye-popping numbers this year: do you feel part of the league's elite now?",
    a: {
      humble: "Devo ancora migliorare tanto, guardo solo a vincere le partite.",
      confident: "Sì, i numeri parlano chiaro. E non ho ancora mostrato tutto.",
      leader: "Se segno tanto è perché il sistema del coach e i blocchi dei compagni funzionano.",
      ambitious: "Non guardo le statistiche personali: voglio trasformare i punti in trofei.",
      ironic: "Diciamo che il canestro ultimamente mi sembra largo come una piscina!",
      polemic: "Lo ero già da tempo, qualcuno in tribuna stampa se n'è accorto solo adesso.",
    },
    aEn: {
      humble: "I still have a lot to improve, I only care about winning games.",
      confident: "Yes, the numbers speak for themselves. And I haven't shown everything yet.",
      leader: "If I score a lot, it's because the coach's system and my teammates' screens work.",
      ambitious: "I don't look at personal stats: I want to turn points into trophies.",
      ironic: "Let's just say the rim looks as wide as a swimming pool lately!",
      polemic: "I've been elite for a while, some people on press row just noticed now.",
    },
    followQ: "Le difese avversarie ormai raddoppiano sempre su di te: come rispondi?",
    followQEn: "Opposing defenses double-team you every night now: how do you respond?",
  },
  nationalCupWin: {
    q: "Avete alzato la Coppa Nazionale a metà stagione! Quanto vale questo trofeo?",
    qEn: "You lifted the National Cup mid-season! How much does this trophy mean?",
    a: {
      humble: "È il premio per i sacrifici di tutto il gruppo da inizio anno.",
      confident: "Avevamo fame di alzare un trofeo e abbiamo dominato la Final Eight.",
      leader: "Vincere dà fiducia a tutto lo spogliatoio per la seconda metà di stagione.",
      ambitious: "È solo l'antipasto: adesso vogliamo prenderci anche il campionato.",
      ironic: "La coppa pesa parecchio, ma faremo volentieri lo sforzo di alzarne un'altra!",
      polemic: "Dicevano che non eravamo pronti per le partite secche: eccovi la risposta.",
    },
    aEn: {
      humble: "It's the reward for the whole group's sacrifices since day one.",
      confident: "We were hungry to lift a trophy and we dominated the Final Eight.",
      leader: "Winning gives the whole locker room confidence for the second half of the season.",
      ambitious: "It's just the appetizer: now we want to take the league title too.",
      ironic: "The cup is pretty heavy, but we'll gladly make the effort to lift another one!",
      polemic: "They said we weren't ready for single-elimination games: here's your answer.",
    },
    followQ: "Questa vittoria cambia le gerarchie per la corsa ai playoff?",
    followQEn: "Does this win change the hierarchy for the playoff race?",
  },
  hotStreak: {
    q: "La squadra vola in classifica e il palazzetto è una bolgia: qual è il vostro segreto?",
    qEn: "The team is flying up the standings and the arena is electric: what's your secret?",
    a: {
      humble: "Lavoriamo a testa bassa in palestra, non abbiamo ancora fatto nulla.",
      confident: "Quando giochiamo al nostro ritmo non ce n'è per nessuno.",
      leader: "C'è un'alchimia speciale: ognuno fa un passo in più per il compagno.",
      ambitious: "Bene così, ma guai a rilassarsi: la stagione si decide più avanti.",
      ironic: "Se ve lo dicessi adesso, gli allenatori avversari prenderebbero appunti!",
      polemic: "Strano, fino a un mese fa leggevamo solo critiche sul nostro conto.",
    },
    aEn: {
      humble: "We keep our heads down in the gym, we haven't accomplished anything yet.",
      confident: "When we play at our pace, nobody can stop us.",
      leader: "There's special chemistry here: everyone takes an extra step for their teammate.",
      ambitious: "Good so far, but we can't relax: the season is decided later on.",
      ironic: "If I told you now, opposing coaches would be taking notes!",
      polemic: "Funny, up until a month ago all we read were criticisms about us.",
    },
    followQ: "Come si mantiene alta la concentrazione nello spogliatoio?",
    followQEn: "How do you keep focus high in the locker room?",
  },
  slumpBlock: {
    q: "Momento delicato e diverse sconfitte nell'ultimo periodo: cosa non sta funzionando?",
    qEn: "A rough patch and several losses lately: what isn't working?",
    a: {
      humble: "Dobbiamo farci tutti un esame di coscienza, a partire da me.",
      confident: "È solo un passaggio a vuoto: conosco il mio valore e ne usciremo presto.",
      leader: "Niente processi pubblici: ci chiudiamo in palestra con il coach e ne usciamo insieme.",
      ambitious: "Serve più cattiveria agonistica su ogni pallone vagante, da subito.",
      ironic: "La tempesta passa sempre, basta non dimenticare l'ombrello e continuare a tirare!",
      polemic: "In campo serve che tutti corrano in difesa, non solo i soliti noti.",
    },
    aEn: {
      humble: "We all need to look in the mirror, starting with me.",
      confident: "It's just a bump in the road: I know my worth and we'll bounce back soon.",
      leader: "No public finger-pointing: we lock ourselves in the gym with the coach and get out of this together.",
      ambitious: "We need more grit on every loose ball, starting right now.",
      ironic: "Every storm passes, just don't forget your umbrella and keep shooting!",
      polemic: "Everyone needs to run back on defense out there, not just the usual few.",
    },
    followQ: "Il prossimo step della stagione sarà già decisivo: che reazione prometti?",
    followQEn: "The next stretch of the season will be crucial: what reaction do you promise?",
  },
  newTeam: {
    q: "Nuova maglia e nuova avventura: come procede il tuo inserimento in squadra?",
    qEn: "New jersey and new adventure: how is your adjustment to the team going?",
    a: {
      humble: "Mi sono messo subito a disposizione del coach e dei nuovi compagni.",
      confident: "Sono qui per spostare gli equilibri e portare questa squadra in alto.",
      leader: "Lo spogliatoio mi ha accolto benissimo, parliamo già la stessa lingua in campo.",
      ambitious: "Ho scelto questo club perché ha ambizioni grandi quanto le mie.",
      ironic: "Sto ancora imparando le strade della città, ma la via del canestro la conosco già!",
      polemic: "Aria nuova finalmente: qui c'è chi capisce davvero come valorizzarmi.",
    },
    aEn: {
      humble: "I immediately put myself at the disposal of the coach and my new teammates.",
      confident: "I'm here to shift the balance and take this team to the top.",
      leader: "The locker room welcomed me warmly, we already speak the same language on the court.",
      ambitious: "I chose this club because its ambitions are as big as mine.",
      ironic: "I'm still learning the city streets, but I already know the way to the hoop!",
      polemic: "Fresh air at last: people here actually understand how to use my talent.",
    },
    followQ: "Qual è la prima cosa che ti ha chiesto l'allenatore?",
    followQEn: "What was the first thing the head coach asked of you?",
  },
  keyGameWin: {
    q: "Partita chiave decisa all'ultimo respiro: cosa si prova a essere l'uomo della provvidenza?",
    qEn: "Key game decided at the buzzer: how does it feel to be the clutch hero?",
    a: {
      humble: "È andata bene, ma la vittoria nasce dalla difesa di tutta la squadra.",
      confident: "Nei finali punto a punto voglio sempre il pallone tra le mani.",
      leader: "Lo schema disegnato dal coach nel timeout è stato perfetto.",
      ambitious: "Sono le partite per cui vivo: più sale la pressione, più mi esalto.",
      ironic: "Volevo tenere i tifosi col fiato sospeso fino alla sirena per lo spettacolo!",
      polemic: "Il pubblico avversario mi ha fischiato per quaranta minuti: adesso è tutto molto silenzioso.",
    },
    aEn: {
      humble: "It went well, but the win started with the whole team's defense.",
      confident: "In close finishes I always want the ball in my hands.",
      leader: "The play drawn up by the coach in the timeout was perfection.",
      ambitious: "These are the games I live for: the higher the pressure, the better I play.",
      ironic: "I just wanted to keep the fans on the edge of their seats until the buzzer for the show!",
      polemic: "The opposing crowd booed me for forty minutes: it's awfully quiet in here now.",
    },
    followQ: "Quanto pesa una vittoria così sul morale della squadra?",
    followQEn: "How much does a win like this boost team morale?",
  },
  keyGameLoss: {
    q: "La partita più attesa è sfumata proprio sull'ultimo possesso: quanto brucia?",
    qEn: "The most anticipated game slipped away on the final possession: how much does it burn?",
    a: {
      humble: "Colpa mia, dovevo gestire meglio l'ultima lettura. Chiedo scusa ai tifosi.",
      confident: "Fa parte del gioco: la prossima volta quel tiro entrerà, statene certi.",
      leader: "Abbiamo lottato fino all'ultimo secondo: testa alta, il gruppo è vivo.",
      ambitious: "Brucia tantissimo, ma ci servirà da lezione per quando conterà il doppio.",
      ironic: "Il ferro stasera aveva deciso di fare i capricci, ci rifaremo al ritorno!",
      polemic: "Sull'ultima azione il contatto era solare, ma nessuno ha avuto il coraggio di fischiare.",
    },
    aEn: {
      humble: "My fault, I should have read the final play better. I apologize to the fans.",
      confident: "It's part of the game: next time that shot goes in, mark my words.",
      leader: "We fought until the last second: heads up, this group is alive.",
      ambitious: "It burns like crazy, but it'll serve as a lesson when it counts double.",
      ironic: "The rim decided to act up tonight, we'll get them back in the rematch!",
      polemic: "There was blatant contact on the last play, but nobody had the guts to blow the whistle.",
    },
    followQ: "Come si trasforma questa delusione in energia per le prossime gare?",
    followQEn: "How do you turn this disappointment into fuel for the next games?",
  },
  seasonStart: {
    q: "Si alza il sipario sulla stagione: quali sono le tue sensazioni al via?",
    qEn: "The curtain rises on the season: what are your feelings at tip-off?",
    a: {
      humble: "Abbiamo lavorato sodo in preparazione, pensiamo una partita alla volta.",
      confident: "Mi sento nella miglior forma della mia vita: sarà una grande annata.",
      leader: "Il gruppo è unito e segue il coach: abbiamo costruito una bella identità.",
      ambitious: "L'obiettivo è arrivare fino in fondo in ogni competizione.",
      ironic: "Finalmente si gioca sul serio, ero stufo di correre senza il cronometro!",
      polemic: "I pronostici ci mettono dietro? Meglio, conserveremo i ritagli di giornale.",
    },
    aEn: {
      humble: "We worked hard in camp, we're taking it one game at a time.",
      confident: "I'm in the best shape of my life: it's going to be a huge year.",
      leader: "The group is united and follows the coach: we've built a strong identity.",
      ambitious: "The goal is to go all the way in every competition.",
      ironic: "Finally real games start, I was tired of running without the scoreboard on!",
      polemic: "Predictions have us near the bottom? Good, we'll keep the receipts.",
    },
    followQ: "Quale sarà la chiave tattica di questo primo tratto di campionato?",
    followQEn: "What will be the tactical key in this opening stretch of the season?",
  },
  midSeasonCheck: {
    q: "Siamo nel vivo della stagione: che bilancio tracci fin qui?",
    qEn: "We're in the thick of the season: how do you assess things so far?",
    a: {
      humble: "Stiamo crescendo passo dopo passo, ma il cammino è ancora lungo.",
      confident: "I miei numeri e il nostro gioco dimostrano che possiamo battere chiunque.",
      leader: "La forza di questa squadra è il collettivo: chiunque entra dà il suo contributo.",
      ambitious: "Non basta quello che abbiamo fatto finora: adesso bisogna cambiare marcia.",
      ironic: "Fin qui voto sette e mezzo, ma il bello dello spettacolo arriva adesso!",
      polemic: "Qualcuno aspettava un nostro crollo, invece siamo ancora qui a giocarcela.",
    },
    aEn: {
      humble: "We're growing step by step, but the road ahead is still long.",
      confident: "My numbers and our play show we can beat anybody.",
      leader: "This team's strength is the collective: whoever steps on the court contributes.",
      ambitious: "What we've done so far isn't enough: now we have to shift gears.",
      ironic: "Seven and a half out of ten so far, but the best part of the show starts now!",
      polemic: "Some people were waiting for us to collapse, yet we're still right here competing.",
    },
    followQ: "Su cosa dovrete insistere nelle prossime settimane?",
    followQEn: "What will you need to emphasize over the coming weeks?",
  },
  default: {
    q: "Come giudichi la tua stagione?",
    qEn: "How do you rate your season?",
    a: {
      humble: "Una stagione di crescita, grazie ai compagni e al coach.",
      confident: "Buona, ma punto molto più in alto.",
      leader: "Abbiamo costruito basi solide nello spogliatoio per il futuro.",
      ambitious: "Voglio alzare il livello: la prossima stagione dovrà essere quella della svolta.",
      ironic: "Ci siamo divertiti parecchio, ma l'anno prossimo voglio i fuochi d'artificio!",
      polemic: "Poteva andare molto meglio, e di sicuro non è dipeso da me.",
    },
    aEn: {
      humble: "A season of growth, thanks to my teammates and the coach.",
      confident: "Good, but I'm aiming much higher.",
      leader: "We built a solid foundation in the locker room for the future.",
      ambitious: "I want to raise the bar: next season has to be the turning point.",
      ironic: "We had a lot of fun, but next year I want fireworks!",
      polemic: "It could have gone much better, and it certainly wasn't my fault.",
    },
    followQ: "Qual è il messaggio che lasci alla piazza e all'ambiente?",
    followQEn: "What message do you leave to the city and the fans?",
  },
  clutchWin: {
    q: "L'ultimo tiro della serie era tuo: cosa ti è passato per la testa?",
    qEn: "The final shot of the series was yours: what went through your mind?",
    a: {
      humble: "I compagni mi hanno messo nelle condizioni perfette per segnare.",
      confident: "Volevo quel pallone. Lo voglio sempre quando scotta.",
      leader: "Sapevo che tutta la panchina credeva in me: quel canestro è di tutti noi.",
      ambitious: "Ho pensato solo a mandarla dentro per portarci al turno successivo.",
      ironic: "Ho chiuso gli occhi, ho sentito il 'ciuff' della retina e ho preparato l'esultanza!",
      polemic: "Chi dubitava della mia freddezza nei playoff adesso ha avuto la risposta.",
    },
    aEn: {
      humble: "My teammates put me in the perfect position to score.",
      confident: "I wanted that ball. I always want it when the game is on the line.",
      leader: "I knew the whole bench believed in me: that bucket belongs to all of us.",
      ambitious: "I only thought about knocking it down to send us to the next round.",
      ironic: "I closed my eyes, heard the swish of the net, and got my celebration ready!",
      polemic: "Anyone who doubted my clutch gene in the playoffs just got their answer.",
    },
    followQ: "Questa giocata cambia l'inerzia di tutta la vostra postseason?",
    followQEn: "Does this play shift the momentum of your entire postseason?",
  },
  farewell: {
    q: "Era la tua ultima partita: cosa ti porti via da questa carriera?",
    qEn: "That was your final game: what do you take away from this career?",
    a: {
      humble: "I compagni, i tifosi e ogni allenatore che mi ha insegnato qualcosa. Grazie.",
      confident: "La certezza di aver lasciato il segno. Chi viene dopo dovrà fare i conti con me.",
      leader: "L'orgoglio di aver sempre onorato lo spogliatoio e i giovani che ho visto crescere.",
      ambitious: "Ogni singolo trofeo e ogni battaglia vinta senza mai risparmiarmi.",
      ironic: "Le mie ginocchia ringraziano, ma il parquet mi mancherà da morire!",
      polemic: "Qualche conto in sospeso con chi non ha mai creduto in me. Ma stasera no.",
    },
    aEn: {
      humble: "My teammates, the fans, and every coach who taught me something. Thank you.",
      confident: "The certainty that I left my mark. Whoever comes next will be measured against me.",
      leader: "The pride of always honoring the locker room and the young players I watched grow.",
      ambitious: "Every single trophy and every battle won without ever holding back.",
      ironic: "My knees say thank you, but I'm going to miss the hardwood like crazy!",
      polemic: "A few scores left to settle with those who never believed in me. But not tonight.",
    },
    followQ: "Un'ultima parola per i ragazzi che sognano di seguire le tue orme?",
    followQEn: "One last word for the kids dreaming of following in your footsteps?",
  },
  clutchLoss: {
    q: "La serie si è decisa sull'ultimo possesso, finito male: come la vivi?",
    qEn: "The series was decided on the final possession, and it went wrong: how are you taking it?",
    a: {
      humble: "Mi prendo tutta la responsabilità, lavorerò per quei momenti.",
      confident: "Rifarei la stessa identica scelta altre mille volte.",
      leader: "Nessun rimpianto: siamo arrivati fin lì lottando da squadra vera.",
      ambitious: "Questa ferita mi farà allenare il doppio per tutta l'estate.",
      ironic: "Due centimetri più a destra e saremmo qui a stappare lo spumante: è il basket.",
      polemic: "Su quel possesso c'era un fallo evidente che tutti hanno visto tranne gli arbitri.",
    },
    aEn: {
      humble: "I take full responsibility, I'll work even harder for those moments.",
      confident: "I'd make the exact same decision a thousand times over.",
      leader: "No regrets: we got that far fighting like a true team.",
      ambitious: "This scar will make me train twice as hard all summer long.",
      ironic: "Two inches to the right and we'd be popping champagne right now: that's basketball.",
      polemic: "There was a blatant foul on that possession that everyone saw except the refs.",
    },
    followQ: "Da dove si riparte dopo un epilogo così amaro?",
    followQEn: "Where do you start over after such a bitter ending?",
  },
  refBuzzerControversy: {
    q: "Sull'ultimo possesso il contatto su di te era evidente, ma gli arbitri non hanno fischiato. C'è rabbia per come è finita?",
    qEn: "On the final possession the contact on you was obvious, but the refs swallowed their whistles. Are you angry about how it ended?",
    a: {
      humble: "Gli arbitri fanno un lavoro difficile, dovevamo chiudere la partita prima dei secondi finali.",
      confident: "Tutti nell'arena hanno visto quel fallo, ma la prossima volta non lascerò la decisione a un fischietto.",
      leader: "Proteggo la squadra: abbiamo lottato su ogni centimetro, usciamo dal campo a testa altissima.",
      ambitious: "Questa sconfitta mi toglierà il sonno stanotte: ci vendicheremo al ritorno, promesso.",
      ironic: "Forse i direttori di gara avevano dimenticato gli occhiali negli spogliatoi stasera!",
      polemic: "È uno scandalo inaccettabile sotto gli occhi di tutti: certi arbitraggi falsano il campionato!",
    },
    aEn: {
      humble: "The refs have a tough job, we should have closed out the game before the final seconds.",
      confident: "Everyone in the arena saw that foul, but next time I won't leave the decision in a referee's whistle.",
      leader: "I stand by my squad: we fought for every inch, we walk off the court with our heads held high.",
      ambitious: "This loss will keep me awake tonight: we will get our revenge in the rematch, guaranteed.",
      ironic: "Maybe the officiating crew forgot their glasses in the locker room tonight!",
      polemic: "It is an unacceptable disgrace in plain sight: officiating like this compromises the league!",
    },
    followQ: "Le tue parole avranno eco: non temi una stangata disciplinare dalla lega?",
    followQEn: "Your words will make headlines: are you not worried about league fines?",
  },
  careerHighMonster: {
    q: "Prestazione mostruosa con canestri da ogni posizione e numeri da capogiro: ti senti ormai immarcabile?",
    qEn: "Monster offensive explosion with buckets from everywhere and video-game stats: do you feel unguardable right now?",
    a: {
      humble: "Quando la palla entra è merito dei blocchi duri e della circolazione di tutta la squadra.",
      confident: "Quando entro in questa 'zona' mentale so che nessuno al mondo può fermarmi.",
      leader: "I record personali contano zero se non portano i due punti e serenità allo spogliatoio.",
      ambitious: "Bello, ma voglio giocare così anche a giugno nelle Finals quando la palla peserà il triplo.",
      ironic: "Oggi il ferro mi sembrava una piscina olimpionica: tiravo a occhi chiusi ed entrava!",
      polemic: "E pensare che fino a ieri certi presunti esperti dicevano che ero solo un tiratore di striscia.",
    },
    aEn: {
      humble: "When shots go in, it's credit to everyone's hard screens and great ball movement.",
      confident: "When I enter this mental 'zone', I know nobody in the world can stop me.",
      leader: "Personal records mean zero if they don't bring the win and positive vibes to the locker room.",
      ambitious: "Great night, but I want to play like this in June in the Finals when the ball weighs triple.",
      ironic: "Tonight the rim looked like an Olympic swimming pool: I was shooting blindfolded!",
      polemic: "And to think that until yesterday some so-called experts called me just a streaky scorer.",
    },
    followQ: "Le difese avversarie adesso prepareranno trappole speciali per te: come ti adatterai?",
    followQEn: "Opposing defenses will now prepare specialized traps for you: how will you adapt?",
  },
  benchedMinutes: {
    q: "Nei minuti decisivi dell'ultimo quarto sei rimasto a lungo seduto in panchina. Come hai vissuto la scelta del coach?",
    qEn: "In the decisive minutes of the 4th quarter you spent long stretches on the bench. How did you take the coach's decision?",
    a: {
      humble: "Il coach vede cose che dal campo non si notano, le sue scelte tattiche vanno sempre rispettate.",
      confident: "Io sono pronto a decidere le partite. Nei finali punto a punto la palla deve essere nelle mie mani.",
      leader: "Chi era in campo ha dato tutto. Dalla panchina ho incitato i compagni ad ogni singolo possesso.",
      ambitious: "Lavorerò il doppio in allenamento: voglio togliere al coach ogni dubbio sul mio impiego.",
      ironic: "La sedia della panchina era fin troppo comoda, ma preferisco di gran lunga sudare sul parquet!",
      polemic: "Non sono venuto qui per guardare gli altri giocare i possessi che contano. Chiedete spiegazioni al coach.",
    },
    aEn: {
      humble: "The coach sees things from the sideline you can't see on the court, his calls must always be respected.",
      confident: "I am built to decide games. In crunch time the ball needs to be in my hands.",
      leader: "Whoever was on the court gave everything. From the bench I cheered on my teammates on every single possession.",
      ambitious: "I will work twice as hard in practice: I want to eliminate any doubt about my playing time.",
      ironic: "The bench seat was a bit too comfortable, but I much prefer sweating on the hardwood!",
      polemic: "I didn't come here to watch others play the possessions that matter. Go ask the head coach for explanations.",
    },
    followQ: "Ci sarà un confronto chiarificatore con lo staff tecnico prima del prossimo allenamento?",
    followQEn: "Will there be a clear-the-air meeting with the coaching staff before the next practice?",
  },
  rivalryTension: {
    q: "Clima infuocato contro i vostri storici rivali: tra fischi assordanti e colpi proibiti, che partita è stata?",
    qEn: "Heated atmosphere against your historic rivals: between deafening boos and hard fouls, what kind of game was it?",
    a: {
      humble: "Il rispetto per gli avversari viene prima di tutto, è stata una battaglia maschia ma leale.",
      confident: "Più ci fischiano e più mi carico: zittire il loro palazzetto è la sensazione più bella.",
      leader: "Questa vittoria è per la nostra città e per i nostri tifosi che sentono questa rivalità nel sangue.",
      ambitious: "Abbiamo vinto la battaglia, ma la guerra per il campionato è ancora lunghissima.",
      ironic: "Ringrazio il loro pubblico per il calore: mi sentivo a casa con tutti quei fischi d'affetto!",
      polemic: "Loro pensano più a picchiare e provocare che a giocare a basket. Hanno avuto la lezione che meritavano.",
    },
    aEn: {
      humble: "Respect for opponents comes first, it was a physical but fair battle.",
      confident: "The more they boo me, the more I get fired up: silencing their arena is the best feeling.",
      leader: "This win is for our city and our fans who feel this rivalry in their veins.",
      ambitious: "We won the battle, but the war for the championship is still very long.",
      ironic: "I thank their crowd for the warm welcome: I felt right at home with all those loving boos!",
      polemic: "They care more about throwing elbows and trash-talking than playing basketball. They got the lesson they deserved.",
    },
    followQ: "Al ritorno la tensione sarà alle stelle: cosa prometti alla tua curva?",
    followQEn: "The rematch will have sky-high tension: what do you promise your fanbase?",
  },
  tradeRumorsPressure: {
    q: "Le voci di mercato si fanno insistenti: diverse big sono pronte a ponti d'oro per averti. Che messaggio mandi alla società e ai tifosi?",
    qEn: "Trade rumors are intensifying: several contenders are ready to move heaven and earth for you. What is your message to the front office and fans?",
    a: {
      humble: "Sono sotto contratto qui, penso solo a dare il 100% per questi colori ogni giorno.",
      confident: "È normale che le migliori franchigie mi cerchino: so cosa valgo sul mercato.",
      leader: "Ho un patto con i miei compagni: finiremo questa missione insieme senza distrazioni.",
      ambitious: "Il mio obiettivo è vincere titoli: valuterò dove ci saranno i presupposti migliori per trionfare.",
      ironic: "Dite al mio agente di staccare il telefono almeno durante l'ora di cena!",
      polemic: "La società conosce benissimo le mie richieste. Se non vogliono accontentarmi, ne trarrò le conseguenze.",
    },
    aEn: {
      humble: "I'm under contract here, I only focus on giving 100% for these colors every day.",
      confident: "It's natural that top franchises are calling: I know what I'm worth on the market.",
      leader: "I have a pact with my teammates: we will finish this mission together without distractions.",
      ambitious: "My goal is winning championships: I will evaluate wherever the best title chances are.",
      ironic: "Tell my agent to turn off his phone at least during dinner time!",
      polemic: "The front office knows my demands very well. If they don't want to meet them, I will act accordingly.",
    },
    followQ: "Pensi che queste voci stiano condizionando la concentrazione dello spogliatoio?",
    followQEn: "Do you think these rumors are affecting the locker room's concentration?",
  },
  lifestyleGossip: {
    q: "Tra acquisti extralusso, riflettori e paparazzi la tua vita privata finisce costantemente sui tabloid. Il basket è ancora la priorità assoluta?",
    qEn: "Between luxury purchases, celebrity spotlight, and tabloids, your private life is constantly in the headlines. Is basketball still your top priority?",
    a: {
      humble: "I successi materiali non cambiano chi sono: la mattina alle 7 sono sempre in palestra a tirare.",
      confident: "Ho lavorato tutta la vita per permettermi questo stile di vita. Sul parquet parlo con i canestri.",
      leader: "La mia vita privata resta privata. Nello spogliatoio sono il primo ad arrivare e l'ultimo ad andare via.",
      ambitious: "Le auto e le ville non mi distraggono: la mia vera ossessione è alzare trofei.",
      ironic: "Se segnassi meno vi capirei, ma finché la retina brucia... godiamoci anche il bel garage!",
      polemic: "I soldi che guadagno sono miei e ci faccio quello che voglio. Giudicatemi per quello che faccio in campo, non fuori.",
    },
    aEn: {
      humble: "Material success doesn't change who I am: at 7 AM I'm always in the gym getting shots up.",
      confident: "I worked my whole life to afford this lifestyle. On the court, my game speaks for itself.",
      leader: "My private life stays private. In the locker room I am first to arrive and last to leave.",
      ambitious: "Cars and mansions don't distract me: my true obsession is lifting trophies.",
      ironic: "If my scoring dropped I'd understand, but as long as the net is burning... let's enjoy the nice garage too!",
      polemic: "The money I earn is mine and I do whatever I want with it. Judge me for what I do on the floor, not off it.",
    },
    followQ: "La visibilità fuori dal campo aiuta il tuo brand o attira solo invidia e pressione?",
    followQEn: "Does off-court stardom help your brand or just attract jealousy and added pressure?",
  },
  allStarSnub: {
    q: "I roster dell'All-Star Game sono ufficiali e il tuo nome non compare tra i convocati: ti senti snobbato?",
    qEn: "The All-Star Game rosters were announced and your name isn't on the list: do you feel snubbed?",
    a: {
      humble: "Ci sono tanti campioni che lo meritavano quest'anno. Devo lavorare ancora di più in palestra.",
      confident: "Tutti sul parquet sanno che merito quel posto. I numeri parlano, ma userò questa pausa per ricaricarmi.",
      leader: "La mia stella brilla se la squadra vince: le sfilate di metà stagione mi interessano zero.",
      ambitious: "Prendo nota di ogni singolo voto mancato: al rientro dalla pausa playoff pagheranno tutti.",
      ironic: "Risparmio l'aereo per il weekend delle stelle: meglio una bella dormita sul divano!",
      polemic: "È una farsa basata sulla popolarità social e sulla politica commerciale, non sul merito sul campo.",
    },
    aEn: {
      humble: "There are so many great players who deserved it. I just need to get back in the gym and work harder.",
      confident: "Everyone on the court knows I belong there. The stats don't lie, but I'll use the rest to recharge.",
      leader: "My star shines when we win: mid-season showcases mean nothing to me compared to championships.",
      ambitious: "I'm keeping receipts on every single vote missed: after the break, the whole league will pay.",
      ironic: "Saves me an airplane ticket: a weekend on my couch with movies sounds much better anyway!",
      polemic: "It's a popularity contest driven by social media hype and politics, not real basketball merit.",
    },
    followQ: "Questa esclusione accenderà una motivazione extra per la seconda metà di stagione?",
    followQEn: "Will this snub fuel extra motivation for the second half of the season?",
  },
  blowoutLossApology: {
    q: "Una sconfitta disastrosa con oltre 30 punti di scarto davanti al vostro pubblico: cosa è successo stasera?",
    qEn: "A disastrous blowout loss by more than 30 points in front of your home fans: what happened tonight?",
    a: {
      humble: "Chiediamo scusa a tutti i tifosi presenti nell'arena: prestazione inaccettabile di cui mi assumo la colpa.",
      confident: "È una serata storta su ottantadue partite. Chi pensa che questo sia il nostro vero livello si sbaglia di grosso.",
      leader: "Nessun alibi: ci chiudiamo nello spogliatoio, ci guardiamo negli occhi e ne usciamo da squadra vera.",
      ambitious: "Una vergogna che non voglio più rivivere. Domani mattina alle sei si torna in palestra a spaccare tutto.",
      ironic: "Stasera non avremmo fatto canestro neanche tirando in una vasca da bagno! Cancelliamo tutto in fretta.",
      polemic: "Qualcuno stasera è sceso in campo senza cuore né grinta. Chi non ha voglia di lottare resti a casa.",
    },
    aEn: {
      humble: "We apologize to every fan in the building: an unacceptable performance and I take full blame for it.",
      confident: "It's one off night across an 82-game marathon. Anyone who thinks this defines us is dead wrong.",
      leader: "Zero excuses: we lock the locker room doors, look each other in the eye, and rebuild from here.",
      ambitious: "An embarrassment I never want to experience again. Tomorrow at 6 AM we're in the gym grinding.",
      ironic: "Tonight we couldn't throw a rock into the ocean! Let's flush the tape and move on immediately.",
      polemic: "Some guys stepped onto the floor with zero heart or effort. If you don't want to fight, stay home.",
    },
    followQ: "Cosa dirai ai compagni nel primo allenamento per evitare un contraccolpo psicologico?",
    followQEn: "What will you tell your teammates in practice tomorrow to avoid a downward spiral?",
  },
  lockdownDefenseMasterclass: {
    q: "Stasera hai annullato completamente il miglior marcatore avversario a suon di stoppate e recuperi: è questa la tua partita perfetta?",
    qEn: "Tonight you completely locked down their leading scorer with clutch blocks and steals: was this your defensive masterclass?",
    a: {
      humble: "La difesa è una questione di squadra: i raddoppi e la comunicazione dei compagni mi hanno reso la vita facile.",
      confident: "Gli avevo detto nel riscaldamento che stasera non avrebbe visto il ferro. Promessa mantenuta.",
      leader: "L'attacco vende i biglietti ma la difesa vince i titoli: sacrificherei dieci punti a serata per vincere così.",
      ambitious: "Voglio il rispetto di tutta la lega: nessuno deve sentirsi a proprio agio quando ha me davanti.",
      ironic: "Gli ho messo le manette dal primo possesso... forse dovevo lasciargli almeno le chiavi!",
      polemic: "I media parlano solo di chi segna da metà campo, ma la vera pallacanestro si gioca nella nostra metà campo.",
    },
    aEn: {
      humble: "Defense is all about teamwork: my teammates' help rotations and communication made my job simple.",
      confident: "I told him during warmups he wasn't going to see the rim tonight. Promise kept.",
      leader: "Offense sells tickets, but defense wins championships: I'd sacrifice 10 points a night to win like this.",
      ambitious: "I want the whole league's respect: nobody should feel comfortable with me guarding them.",
      ironic: "I put handcuffs on him from the opening tip... maybe I should have given him the keys at the end!",
      polemic: "The media only hypes logo threes, but real basketball is won on our defensive end of the floor.",
    },
    followQ: "Credi che questa prestazione ti metta in prima fila per il premio di Difensore dell'Anno?",
    followQEn: "Do you believe this performance puts you on the shortlist for Defensive Player of the Year?",
  },
  trashTalkingViral: {
    q: "I microfoni a bordocampo hanno catturato un caldissimo scambio di battute e provocazioni con la panchina avversaria: cosa vi siete detti?",
    qEn: "Courtside microphones picked up an intense exchange of trash-talking between you and the opposing bench: what was said?",
    a: {
      humble: "È solo adrenalina agonistica: in campo si lotta duro, ma a fine partita ci siamo stretti la mano con stima.",
      confident: "Gli ho solo ricordato di guardare il tabellone dei punti e chi comanda su questo parquet.",
      leader: "Stavano mancando di rispetto a uno dei nostri rookie: da veterano ho fatto capire che siamo intoccabili.",
      ambitious: "Questo è basket ad alto livello, non il doposcuola: l'agonismo fa parte del sangue dei campioni.",
      ironic: "Se trasmetteste tutto quello che diciamo senza bip, il vostro canale chiuderebbe per censure entro mezz'ora!",
      polemic: "Parlano tanto dalla comodità della panchina con gli asciugamani al collo, ma sul parquet spariscono.",
    },
    aEn: {
      humble: "Just pure game adrenaline: we battle hard between the lines, but shaken hands with mutual respect after.",
      confident: "I just gently reminded them to check the scoreboard and see who runs this building.",
      leader: "They were disrespecting one of our young rookies: as a leader I made sure they knew our team is untouchable.",
      ambitious: "This is professional hoops at the highest level, not a picnic: fierce competition is in our DNA.",
      ironic: "If you broadcast everything we say without bleeping it, your TV network would get pulled off the air!",
      polemic: "They talk a big game sitting comfortably on the bench wrapped in towels, but they vanish on the court.",
    },
    followQ: "Non temi che queste scintille possano accendere animi troppo caldi nella gara di ritorno?",
    followQEn: "Aren't you concerned this bad blood will spill over into the rematch?",
  },
  loadManagementDebate: {
    q: "Il tuo riposo programmato nella partita di cartello in diretta nazionale ha scatenato la delusione di fan e opinionisti: come rispondi?",
    qEn: "Your scheduled rest night in tonight's prime-time national TV broadcast sparked outrage among fans and pundits: how do you respond?",
    a: {
      humble: "Dispiace tantissimo per i tifosi: seguo le tabelle dei preparatori atletici per essere al top sul lungo periodo.",
      confident: "La gente paga per vedermi volare e dominare al 100%, non per vedermi trascinarmi a mezzo servizio per 15 minuti.",
      leader: "L'obiettivo prioritario del club è arrivare sani e freschi ad aprile: la gestione fisica è una scelta comune.",
      ambitious: "Fosse per me giocherei 48 minuti ogni singola sera: stare seduto in borghese mi fa ribollire il sangue.",
      ironic: "Ho tifato con l'asciugamano come un ultrà in curva! Ma tranquilli, al prossimo match ci saranno i fuochi d'artificio.",
      polemic: "Gli opinionisti seduti sulle comode poltrone televisive non sanno cosa significhi logorare ginocchia e caviglie ogni 48 ore.",
    },
    aEn: {
      humble: "I truly feel for the fans: I follow our sports science staff's regimen so I can peak when it matters most.",
      confident: "People pay to see me dominate at 100%, not limping through 15 minutes at half-speed.",
      leader: "Our franchise priority is being healthy and locked in come playoff time: load management is a team decision.",
      ambitious: "If it were up to me I'd play 48 minutes every night: sitting in street clothes makes my blood boil.",
      ironic: "I waved the bench towel like a die-hard ultras fan! But don't worry, next game will feature pure fireworks.",
      polemic: "Talking heads sitting comfortably in TV studio chairs have no clue what 82 games do to knees and ankles.",
    },
    followQ: "Pensi che la lega debba regolamentare diversamente il calendario per tutelare i tifosi paganti?",
    followQEn: "Do you think the league needs to revamp the schedule to protect paying fans in the arena?",
  },
  historicTripleDouble: {
    q: "Hai messo a referto una tripla doppia mostruosa riscrivendo i libri dei record della franchigia: che notte è stata?",
    qEn: "You dropped an unreal triple-double tonight, etching your name into franchise record books: what kind of night was this?",
    a: {
      humble: "I numeri personali fanno piacere, ma la cosa più bella è che tutti i compagni sono stati coinvolti nel gioco.",
      confident: "Quando leggo il gioco così posso fare qualsiasi cosa su un campo di pallacanestro: controllo totale.",
      leader: "Gli assist sono possibili solo se chi riceve manda la palla nella retina: questo record appartiene a tutto lo spogliatoio.",
      ambitious: "Bello entrare negli annali, ma i record individuali si dimenticano: ciò che voglio davvero è l'anello di campione.",
      ironic: "Stasera vedevo i passaggi al rallentatore, sembrava di giocare a una console con i trucchi attivati!",
      polemic: "Fino a ieri qualcuno scriveva che pensavo solo a tirare e che non sapevo passare la palla. Spero abbiano visto bene.",
    },
    aEn: {
      humble: "Individual numbers are nice, but what matters most is that every teammate touched the ball and got involved.",
      confident: "When I see the game at this speed, there's nothing I can't do on a basketball court: total mastery.",
      leader: "Assists only exist if my guys knock down the shots: this record belongs to every player in that locker room.",
      ambitious: "Nice milestone, but regular-season statlines fade: the only thing that truly lasts is championship rings.",
      ironic: "Tonight the game felt in slow-motion, like playing a video game with cheat codes enabled!",
      polemic: "Yesterday pundits claimed I was a selfish ball-hog who couldn't pass. I hope they were taking notes tonight.",
    },
    followQ: "In quale momento della partita hai capito che stavi compiendo qualcosa di memorabile?",
    followQEn: "At what point in the game did you realize you were on the verge of history?",
  },
  overtimeHeartbreak2OT: {
    q: "Cinquanta minuti di maratona agonistica decisi soltanto all'ultimo possesso del secondo overtime: quanto brucia uscire sconfitti?",
    qEn: "A 50-minute marathon battle decided on the final shot of double overtime: how much does it sting to walk away empty-handed?",
    a: {
      humble: "Abbiamo lasciato sul parquet ogni goccia di sudore. Complimenti agli avversari per aver trovato la zampata finale.",
      confident: "Brucia da morire, ma abbiamo dimostrato a tutta la lega che possiamo competere ad armi pari contro chiunque.",
      leader: "Ho visto compagni lottare coi crampi pur di non uscire dal campo: sono immensamente fiero di questo gruppo.",
      ambitious: "Non chiuderò occhio stanotte. Questa rabbia ci darà la carica per distruggere chiunque nel prossimo turno.",
      ironic: "Chi era al palazzetto stasera si è divertito come a un concerto rock! Purtroppo il finale non è stato il nostro.",
      polemic: "Nei due supplementari il metro arbitrale è cambiato completamente: certe fischiate a senso unico hanno deciso la gara.",
    },
    aEn: {
      humble: "We left every single ounce of energy out there. Credit to our opponents for hitting that last dagger.",
      confident: "It stings deeply, but we proved to the entire league that we can go toe-to-toe with anyone for 50 minutes.",
      leader: "I saw teammates playing through painful cramps refusing to sit down: I'm immensely proud of our brotherhood.",
      ambitious: "I won't sleep a wink tonight. This burning pain will fuel us to dominate our next opponent.",
      ironic: "Anyone in the stands tonight got their money's worth like a rock concert! Sadly the final encore wasn't ours.",
      polemic: "In double overtime the whistle shifted completely: one-sided foul calls handed the game away.",
    },
    followQ: "Come recupererete le energie fisiche e mentali in vista del back-to-back tra quarantott'ore?",
    followQEn: "How will you physically and mentally recharge ahead of the back-to-back in 48 hours?",
  },
  coachDisagreement: {
    q: "Le telecamere hanno indugiato su un confronto accesissimo tra te e il coach durante un timeout nel finale: cosa è successo?",
    qEn: "Broadcast cameras zoomed in on a heated argument between you and the head coach during a late timeout: what sparked that?",
    a: {
      humble: "È solo passione per la vittoria: il coach ha sempre l'ultima parola ed io eseguo i suoi ordini con rispetto.",
      confident: "Sono il faro della squadra sul parquet: nei finali punto a punto pretendo di far sentire la mia voce tattica.",
      leader: "Ci confrontiamo a viso aperto proprio perché ci vogliamo bene e abbiamo lo stesso identico obiettivo.",
      ambitious: "Entrambi odiamo perdere con tutte le nostre forze: le discussioni animate nascono solo da una fame feroce.",
      ironic: "Stavamo solo discutendo su dove andare a cena dopo la partita! Nessun dramma, ci siamo già chiariti.",
      polemic: "Se vedo schemi che non funzionano e letture sbagliate io lo dico in faccia: non sono qui per fare la comparsa.",
    },
    aEn: {
      humble: "Just pure competitive fire: the coach has final say and I execute his gameplan with complete respect.",
      confident: "I'm the franchise cornerstone on the floor: in crunch time my basketball instincts must be heard.",
      leader: "We challenge each other directly because we care and share the exact same championship standard.",
      ambitious: "Both of us despise losing with every fiber of our being: intense debates stem from unyielding hunger.",
      ironic: "We were just debating where to get dinner after the buzzer! Zero drama, we already hugged it out.",
      polemic: "When I see plays failing and wrong assignments, I speak my mind: I didn't come here to be a passive bystander.",
    },
    followQ: "La dirigenza o lo spogliatoio hanno dovuto mediare dopo il fischio finale?",
    followQEn: "Did front office or team captains have to intervene after the final horn?",
  },
  rookieMentorshipPraise: {
    q: "La matricola della squadra ha giocato una partita spettacolare e nei corridoi ti ha indicato come sua guida: che impatto ha avuto su di te?",
    qEn: "The team's young rookie had a breakout performance and credited your mentorship in the hallway: how does that make you feel?",
    a: {
      humble: "Ha un talento cristallino: io provo solo a spiegargli qualche trucco del mestiere per evitargli gli errori che feci io.",
      confident: "Si allena con me ogni giorno in estate: marcare me in allenamento rende le difese avversarie un gioco da ragazzi.",
      leader: "I veterani hanno il dovere sacro di proteggere e valorizzare i giovani: il futuro della franchigia è nelle sue mani.",
      ambitious: "Ha fatto una bella partita, ma non deve montarsi la testa: nella lega si riparte da zero ogni singola sera.",
      ironic: "Gli ho insegnato tutto io sui crossover... ma sul gusto musicale ha ancora tanta strada da fare!",
      polemic: "I rookie di oggi spesso pensano solo ai video social: lui lavora sul serio e i risultati si vedono.",
    },
    aEn: {
      humble: "He has raw, unbelievable talent: I just try to share tricks of the trade so he doesn't repeat the mistakes I made.",
      confident: "He works out with me daily: having to guard me in practice makes facing opposing teams feel easy.",
      leader: "Veterans have a sacred duty to lift up young talent: this franchise's future rests on his shoulders.",
      ambitious: "Great night for him, but no resting on laurels: in this league you have to prove yourself from scratch every night.",
      ironic: "I taught him everything he knows on crossovers... but his locker room music playlist still needs serious help!",
      polemic: "Too many young guys enter the league focused on TikTok clips: he actually puts in the hard work and it shows.",
    },
    followQ: "Credi che questo giovane talento possa già essere determinante nella post-season?",
    followQEn: "Do you believe this young prodigy can already be an X-factor in the postseason?",
  },
  sixthManSparkPlug: {
    q: "Uscendo dalla panchina hai spaccato in due il match con una raffica di canestri ed energia pura: ti senti il sesto uomo ideale?",
    qEn: "Coming off the bench you blew the game wide open with a scoring burst and relentless energy: are you the ultimate sixth man?",
    a: {
      humble: "Quintetto o panchina fa lo stesso: entro in campo con l'unico pensiero di aiutare i compagni a vincere.",
      confident: "So di valere il quintetto base di qualsiasi franchigia, ma quando entro contro la second unit non c'è partita.",
      leader: "Non conta chi gioca la palla a due: conta chi è sul parquet con la palla in mano negli ultimi due minuti.",
      ambitious: "Entro con il fuoco negli occhi per dimostrare a tutti che merito più spazio e responsabilità decisive.",
      ironic: "La panchina era fredda, ho dovuto segnare 15 punti veloci per scaldare i muscoli!",
      polemic: "Accetto il ruolo per disciplina di squadra, ma tutti nello stadio sanno che dovrei partire titolare fisso.",
    },
    aEn: {
      humble: "Starting five or second unit makes no difference: I step onto the court solely to help my brothers win.",
      confident: "I'm a starter on any roster in this league, but when I match up against bench units, it's lights out.",
      leader: "It doesn't matter who is out there for tip-off: it matters who is on the hardwood with the ball in clutch time.",
      ambitious: "I check in with fire in my eyes to prove to everyone that I deserve heavy minutes and primary options.",
      ironic: "The bench was freezing cold, so I had to drop 15 quick points just to warm up my shooting arm!",
      polemic: "I accept the assignment for team discipline, but everyone in this arena knows I should be starting.",
    },
    followQ: "Punti a conquistare il trofeo di Sesto Uomo dell'Anno a fine stagione?",
    followQEn: "Is winning Sixth Man of the Year an explicit goal of yours this season?",
  },
  hometownHomecoming: {
    q: "Giocare stasera nella tua città natale davanti a genitori, vecchi compagni di campetto e primi coach: che sapore ha avuto?",
    qEn: "Playing tonight back in your hometown in front of family, playground friends, and childhood coaches: what was that feeling like?",
    a: {
      humble: "Un'emozione indescrivibile: non dimentico da dove sono partito e ringrazio chi mi ha sostenuto da bambino.",
      confident: "Volevo regalare uno show leggendario alla mia gente e dimostrare che il ragazzo del quartiere ce l'ha fatta.",
      leader: "I miei compagni sapevano quanto ci tenessi e mi hanno supportato ad ogni singolo possesso: vittoria speciale.",
      ambitious: "Bello salutare gli amici d'infanzia prima della palla a due, ma appena si alza la palla non guardo in faccia nessuno.",
      ironic: "Ho speso metà del mio stipendio per comprare biglietti per cugini e zii: stasera il palazzetto era casa mia!",
      polemic: "In questa città c'era anche chi diceva che non sarei mai diventato nessuno: spero abbiano guardato il tabellone.",
    },
    aEn: {
      humble: "An overwhelming feeling: I never forget my roots and thank everyone who believed in me when I was just a kid.",
      confident: "I wanted to put on an unforgettable show for my hometown and prove that the kid from down the block made it.",
      leader: "My teammates knew how much tonight meant to me and lifted me up on every play: a deeply special victory.",
      ambitious: "Great to hug childhood friends before tip-off, but once that ball goes up, I show zero mercy to anyone.",
      ironic: "I spent half my game check buying tickets for aunts, uncles, and cousins: half the arena was my family reunion!",
      polemic: "There were people in this city who said I'd never amount to anything: I hope they enjoyed their view of the scoreboard.",
    },
    followQ: "Sogni un giorno di chiudere la carriera indossando la maglia di questa franchigia?",
    followQEn: "Do you dream of one day wearing this hometown jersey before you hang up your sneakers?",
  },
  fansStandingOvationAway: {
    q: "Al momento della tua uscita dal parquet tutto il pubblico rivale si è alzato in piedi per una standing ovation da brividi: come l'hai vissuta?",
    qEn: "As you checked out of the game, the opposing arena rose in unison for a spine-tingling standing ovation: how did you take that in?",
    a: {
      humble: "Un gesto di sportività pura che mi ha toccato il cuore. Il rispetto per il gioco va oltre ogni colore sociale.",
      confident: "Quando esprimi la pallacanestro a questo livello celestiale, anche i tifosi rivali non possono che applaudire.",
      leader: "Hanno applaudito il basket corale e spettacolare della nostra squadra: condivido questo tributo con tutti i compagni.",
      ambitious: "Un momento che ricorderò, ma la standing ovation che desidero davvero è quella con la coppa in mano a giugno.",
      ironic: "Li ho ringraziati con un inchino: prometto che tornerò a farvi divertire anche la prossima stagione!",
      polemic: "Fa riflettere: il pubblico avversario riconosce il mio talento più di certi giornalisti della nostra stessa città.",
    },
    aEn: {
      humble: "A gesture of pure sportsmanship that touched my soul. True love for basketball transcends team rivalries.",
      confident: "When you play the game at this supreme level, even your bitterest rivals have no choice but to stand and clap.",
      leader: "They appreciated the beautiful team basketball we played: I share every bit of this ovation with my teammates.",
      ambitious: "A moment I'll treasure, but the only standing ovation I crave is holding the championship trophy in June.",
      ironic: "I gave them a respectful bow on the way out: promise I'll put on another great show when we return next year!",
      polemic: "It speaks volumes: opposing fans appreciate my greatness more than certain beat writers back in our home city.",
    },
    followQ: "Cosa si prova a trasformare un'arena ostile in un coro di rispetto unanime?",
    followQEn: "What does it feel like to transform a hostile enemy building into unanimous reverence?",
  },
  lockerRoomDramaRumors: {
    q: "Voci insistenti parlano di una frattura interna nello spogliatoio tra senatori e gruppo giovani: c'è davvero tensione nel gruppo?",
    qEn: "Persistent leaks suggest a toxic divide in the locker room between veterans and young players: is there real tension inside?",
    a: {
      humble: "Tutte le famiglie attraversano momenti complessi: ci vogliamo bene e supereremo ogni ostacolo dialogando.",
      confident: "Chiacchiere inventate da chi vuole destabilizzarci perché teme la nostra forza quando siamo uniti.",
      leader: "Quello che succede nello spogliatoio resta sacro nello spogliatoio: siamo una squadra unita e nessuno ci dividerà.",
      ambitious: "Se alziamo la voce in allenamento è solo perché pretendiamo la perfezione: chi si accontenta non vince nulla.",
      ironic: "L'unica frattura è su chi sceglie la musica sullo stereo prima della partita, vi assicuro che siamo sereni!",
      polemic: "C'è qualcuno che parla troppo con i giornalisti invece di sudare in difesa. I conti li faremo a porte chiuse.",
    },
    aEn: {
      humble: "Every family goes through tough stretches: we respect each other and we'll work through any issue through dialogue.",
      confident: "Made-up gossip from outside critics terrified of what we can do when we click on all cylinders.",
      leader: "What happens in that locker room stays behind closed doors: we are a tight brotherhood and nobody will break us.",
      ambitious: "If voices get raised in practice it's because we demand championship excellence: mediocrity has no place here.",
      ironic: "The only real dispute is who gets aux cord duty on the locker room speaker, I promise you we're totally fine!",
      polemic: "Someone is leaking stories to reporters instead of sliding their feet on defense. We'll handle that internally.",
    },
    followQ: "La leadership del capitano è abbastanza solida per mantenere tutti sulla stessa rotta?",
    followQEn: "Is captain leadership strong enough to keep everyone pulling in the same direction?",
  },
  shootingSlumpBreakthrough: {
    q: "Arrivavi da settimane col tiro congelato e tante critiche: stasera sei tornato a incendiare la retina con percentuali stellari. Ti senti liberato?",
    qEn: "You were enduring a brutal cold streak and heavy scrutiny: tonight you set the net on fire with elite shooting. Do you feel unburdened?",
    a: {
      humble: "Non ho mai smesso di credere nel lavoro quotidiano e nei consigli di tiro dello staff. Grazie per la pazienza.",
      confident: "I grandi tiratori continuano a tirare: sapevo che era solo questione di tempo prima che tornasse a piovere.",
      leader: "I compagni hanno continuato a passarmi la palla dandomi fiducia anche sui ferri: questo risveglio è tutto merito loro.",
      ambitious: "Una grande serata al tiro, ma ora pretendo continuità e letalità in ogni singolo match da qui ai playoff.",
      ironic: "Ho dovuto mettere le mani nel forno prima di allacciarmi le scarpe stasera: il ferro è tornato amico!",
      polemic: "Dov'erano finiti tutti i 'maestri' che dicevano che avevo perso il tiro e che ero finito? Spariti tutti stasera.",
    },
    aEn: {
      humble: "I never lost faith in my daily shooting routines and the coaching staff's feedback. I appreciate their patience.",
      confident: "Shooters shoot: I knew it was only a matter of time before the floodgates opened again.",
      leader: "My teammates kept feeding me and shouting encouragement through every miss: this resurgence belongs to them.",
      ambitious: "A fantastic shooting night, but now I demand cold-blooded consistency every single night through the playoffs.",
      ironic: "I warmed up my shooting wrist in a pizza oven before lace-up tonight: the rim looked huge again!",
      polemic: "Where did all the experts go who said my jump shot was broken and washed? Very quiet in the media room tonight.",
    },
    followQ: "Hai apportato qualche modifica meccanica al tuo rilascio nelle ultime sessioni di tiro?",
    followQEn: "Did you tweak your release mechanics or footwork during recent shooting sessions?",
  },
  tradeDeadlineEve: {
    q: "Mancano pochissime ore alla Trade Deadline e le voci di un tuo possibile scambio scuotono l'ambiente: come si vive questa vigilia?",
    qEn: "With hours remaining before the Trade Deadline, blockbuster trade rumors are swirling around your name: how are you dealing with the noise?",
    a: {
      humble: "Sono un professionista: finché indosso questa canotta darò il 100% per questi colori e questi meravigliosi tifosi.",
      confident: "Ovunque giocherò sposterò gli equilibri. Il mio valore tecnico ed economico è chiaro a tutta la lega.",
      leader: "Ho fatto un patto coi compagni: fino alla sirena saremo fratelli di campo senza farci distrarre dalle trattative.",
      ambitious: "Voglio lottare per vincere titoli: spero che la dirigenza prenda decisioni coerenti con questa ambizione.",
      ironic: "Ho le valigie aperte... ma solo per la prossima trasferta di campionato, tranquilli!",
      polemic: "La società gioca con il futuro delle persone tramite i leak ai giornalisti: vorrei più rispetto e trasparenza.",
    },
    aEn: {
      humble: "I'm a consummate pro: as long as I wear this uniform I give 100% for this city and these amazing fans.",
      confident: "Wherever I lace them up, I shift the balance of power. My market value is undeniable across the league.",
      leader: "I made a pact with my brothers: we stay locked in on basketball together and ignore the front office rumors.",
      ambitious: "I want to contend for championships: I expect management's moves to reflect that level of ambition.",
      ironic: "My suitcases are packed... but only for our upcoming road trip, don't panic!",
      polemic: "The front office plays games with athletes' lives through media leaks: a little direct honesty wouldn't hurt.",
    },
    followQ: "Hai già parlato direttamente con il General Manager in queste ultime ore frenetiche?",
    followQEn: "Have you spoken directly with the General Manager in these frantic final hours?",
  },
  buzzerBeaterHero: {
    q: "Tiro della vittoria scoccato all'ultimo decimo di secondo: solo retina sulla sirena ed esplosione dell'arena. Descrivici quel momento magico!",
    qEn: "Game-winner released with tenths of a second on the clock: pure net at the buzzer and absolute pandemonium in the arena. Take us through it!",
    a: {
      humble: "Ho visto uno spiraglio, mi sono fidato della mia meccanica ed è andata bene. Felice per il calore dei nostri tifosi.",
      confident: "Voglio quel tiro ogni singola volta: vivo per questi momenti in cui la palla scotta e tutti trattengono il fiato.",
      leader: "Lo schema disegnato dal coach e il blocco cieco del mio compagno sono stati capolavori: il merito è loro.",
      ambitious: "Un canestro da sogno, ma la partita dovevamo chiuderla prima senza arrivare col cuore in gola.",
      ironic: "Ho fatto il gesto della buonanotte alla panchina rivale... era ora di mandare tutti a dormire!",
      polemic: "E pensare che fino all'altro ieri c'era chi metteva in dubbio la mia freddezza nei finali di gara.",
    },
    aEn: {
      humble: "I saw an opening, trusted my mechanics, and it went in. Thrilled for our home crowd and teammates.",
      confident: "I want that shot every single time: I live for moments where the arena holds its breath and heroes are made.",
      leader: "The out-of-bounds play drawn up by coach and the bone-crushing screen set by my teammate created the magic.",
      ambitious: "Unbelievable feeling, but we shouldn't have let the game come down to a desperate final prayer.",
      ironic: "I gave their bench the 'night night' celebration... time to tuck everyone in and turn off the arena lights!",
      polemic: "And to think critics on TV were questioning my clutch gene just two days ago. Hope you were watching.",
    },
    followQ: "Cosa ti è passato per la testa nell'istante in cui la palla ha lasciato le tue dita?",
    followQEn: "What flashed through your mind the exact split-second the ball left your fingertips?",
  },
  defenseWinUgly: {
    q: "Una battaglia nel fango a punteggio bassissimo, contatti durissimi e percentuali gelide, ma vittoria portata a casa: vi piace vincere così?",
    qEn: "A low-scoring slugfest in the mud, bone-crushing fouls, and frigid shooting, yet you scrapped out the win: do you embrace winning ugly?",
    a: {
      humble: "Non è stato uno spettacolo entusiasmante per gli occhi, ma abbiamo saputo soffrire insieme nei minuti decisivi.",
      confident: "Possiamo vincere segnando 130 punti o fermandovi a 75: ci adattiamo a qualsiasi stile e vinciamo noi.",
      leader: "Stasera contavano solo i tuffi sui palloni vaganti, i lividi e il sudore: questa vittoria tempra il carattere del gruppo.",
      ambitious: "A giugno nelle Finals le partite sono tutte così: chi non sa vincere nel fango non alzerà mai nessun trofeo.",
      ironic: "Partita dedicata ai carpentieri e ai costruttori di mattoni! Ma due punti sono due punti, ce li prendiamo tutti.",
      polemic: "Gli avversari hanno solo picchiato e innervosito la gara: alla fine la giustizia del parquet ha trionfato.",
    },
    aEn: {
      humble: "It wasn't pretty for aesthetic basketball purists, but we showed true resilience when the chips were down.",
      confident: "We can outgun teams dropping 130 or drag you into deep water and hold you to 75: we win on any terms.",
      leader: "Tonight was about diving on hardwood, bruises, and grit: wins like this forge championship character.",
      ambitious: "Come June in the Finals every game is a grind: teams that can't win in the mud never hoist trophies.",
      ironic: "A special shout-out to masonry workers and bricklayers tonight! Two points in the standings are two points.",
      polemic: "Opponents tried to turn a basketball game into an MMA bout: in the end basketball justice prevailed.",
    },
    followQ: "Questa durezza mentale può diventare l'identità definitiva della squadra?",
    followQEn: "Can this brand of physical, suffocating toughness become your permanent playoff identity?",
  },
  contractExtensionCelebration: {
    q: "È arrivata la firma ufficiale sul faraonico rinnovo di contratto a lungo termine: cosa provi a legare il tuo futuro a questa città?",
    qEn: "Your massive multi-year contract extension is officially inked: how does it feel committing your prime years to this city?",
    a: {
      humble: "Ringrazio dal profondo la proprietà e i tifosi per questa fiducia straordinaria: darò anima e corpo per questi colori.",
      confident: "Hanno blindato il loro leader: ripagherò ogni singolo centesimo portando stendardi e trofei sul soffitto dell'arena.",
      leader: "Questa città e questi compagni sono la mia famiglia: non ho mai avuto dubbi sul voler continuare questo viaggio insieme.",
      ambitious: "I contratti garantiti non mi faranno rilassare di un millimetro: la mia unica ossessione è vincere il titolo.",
      ironic: "Stasera offro io la cena a tutto lo spogliatoio... ma per favore non ordinate il caviale!",
      polemic: "Dicevano che me ne sarei andato al primo treno: eccomi qui, pronto a zittire chi sperava in un mio addio.",
    },
    aEn: {
      humble: "I thank ownership and our incredible fanbase from the bottom of my heart: I'll give everything to this jersey.",
      confident: "They locked down their franchise cornerstone: I will repay every dime by hanging banners from the rafters.",
      leader: "This city and locker room are my family: I never doubted for a second that I wanted to finish this journey here.",
      ambitious: "A guaranteed paycheck won't soften my hunger: my sole obsession remains lifting the championship trophy.",
      ironic: "Dinner is on me for the entire locker room tonight... but please keep the caviar orders to a minimum!",
      polemic: "Pundits claimed I was forcing my way out on the first flight: here I am, proving the doubters wrong once again.",
    },
    followQ: "Questo accordo fa di te il volto indiscusso della franchigia: pronto a sostenere questa pressione?",
    followQEn: "This deal cements you as the undisputed face of the franchise: are you ready for the weight that carries?",
  },
  playoffEliminationHeartbreak: {
    q: "La vostra corsa nei playoff si infrange qui dopo una serie estenuante: cosa resta di questa stagione?",
    qEn: "Your playoff run comes to a crushing end after a grueling series: what does this elimination leave behind?",
    a: {
      humble: "Complimenti ai nostri avversari: sono stati più lucidi nei possessi chiave. Ci servirà da dura lezione per maturare.",
      confident: "Siamo andati a tanto così dall'obiettivo: la nostra finestra per vincere è spalancata e torneremo più forti.",
      leader: "Sono fiero di ogni compagno che ha sputato sangue in campo: nessuno abbassi la testa nello spogliatoio.",
      ambitious: "Non riesco a trovare aspetti positivi: per me uscire prima del traguardo è un fallimento totale che mi terrà sveglio tutta l'estate.",
      ironic: "Le vacanze iniziano prima del previsto... ma passerò l'estate in palestra, niente spiaggia per me!",
      polemic: "Per competere contro corazzate del genere servono rotazioni più lunghe e investimenti sul roster: la dirigenza lo sa.",
    },
    aEn: {
      humble: "Credit to our opponents: they executed with sharper poise in crunch time. We must use this pain to mature.",
      confident: "We were inches away from breaking through: our championship window is wide open and we will be back.",
      leader: "I'm immensely proud of every teammate who gave their heart: nobody hangs their head in our locker room.",
      ambitious: "I can't sugarcoat this: falling short of the title is a failure that will haunt my summer workouts.",
      ironic: "Vacation starts earlier than we wanted... but you'll find me locked in the gym, not laying on a beach!",
      polemic: "To beat elite championship juggernauts you need deeper rosters and real investment: front office knows what is needed.",
    },
    followQ: "Cosa dirai alla dirigenza nei colloqui di fine stagione sul futuro della squadra?",
    followQEn: "What will you tell the front office in exit interviews about the team's future direction?",
  },
  fanProtestTension: {
    q: "Fischi assordanti e cori di contestazione del pubblico di casa all'uscita dal parquet: come rispondi alla furia della piazza?",
    qEn: "Deafening boos and hostile chants from your home crowd as you walked off the court: how do you respond to fan outrage?",
    a: {
      humble: "I tifosi pagano il biglietto e hanno tutto il diritto di pretendere molto di più da noi: chiediamo solo scusa.",
      confident: "I fischi fanno parte del gioco: quando torneremo a macinare vittorie saliranno tutti sul nostro carro.",
      leader: "I tifosi sono delusi e lo capiamo, ma chiedo di fischiare me e i leader: lasciate tranquilli i ragazzi più giovani.",
      ambitious: "I fischi devono bruciare nell'anima di tutti noi e diventare benzina pura negli allenamenti.",
      ironic: "Ci hanno fatto una bella serenata stasera! Ma trasformeremo questi fischi in applausi scroscianti, abbiate fede.",
      polemic: "Troppo comodo applaudire solo quando si vince: i veri tifosi stanno al fianco della squadra anche quando c'è da soffrire.",
    },
    aEn: {
      humble: "Fans pay hard-earned money and have every right to demand far better basketball from us: we apologize.",
      confident: "Boos come with the territory: when we rattle off five straight wins they'll all be jumping back on the bandwagon.",
      leader: "Fans are hurting and we get it, but direct the frustration at me: shield our young players from the hostility.",
      ambitious: "Those boos need to burn deep inside every player in that room and fuel every drop of sweat in practice.",
      ironic: "Quite the serenade from our home crowd tonight! Have faith, we will turn those boos into roaring cheers soon.",
      polemic: "It's easy to wave flags when you're blowing teams out: real fans stick by the team through the trenches too.",
    },
    followQ: "Come pensate di riconquistare la fiducia dell'ambiente nella prossima gara casalinga?",
    followQEn: "How do you plan to win back the arena's trust in the next home stand?",
  },
};
function ivQuestion(ctx) { return (isEn() && ctx.qEn) ? ctx.qEn : ctx.q; }
function ivAnswers(ctx) { return (isEn() && ctx.aEn) ? ctx.aEn : ctx.a; }
function ivFollowQ(ctx, toneId) {
  if (toneId === "polemic") {
    return isEn()
      ? "Scorching words that will shake the league: are you not afraid of fines or a locker room revolt?"
      : "Parole di fuoco che scuoteranno la lega: non temi una stangata disciplinare o la rivolta dello spogliatoio?";
  }
  if (toneId === "ironic") {
    return isEn()
      ? "The room is laughing, but when crunch time hits the pressure multiplies: how do you stay locked in?"
      : "La sala stampa scoppia a ridere, ma quando si torna sul parquet la pressione raddoppia: come rispondi?";
  }
  if (toneId === "leader") {
    return isEn()
      ? "True captain leadership on display: how do you keep your teammates focused through the outside noise?"
      : "Parole da vero capitano: come riesci a tenere tutti concentrati isolando il gruppo dalle critiche esterne?";
  }
  if (toneId === "humble") {
    return isEn()
      ? "Exemplary humility for a star: what daily routine keeps your feet firmly on the ground?"
      : "Un'umiltà esemplare per un protagonista del tuo livello: qual è la routine che ti tiene coi piedi per terra?";
  }
  if (toneId === "confident") {
    return isEn()
      ? "Supreme confidence: do you expect opponents to double-team you aggressively next time out?"
      : "Grande sicurezza nei tuoi mezzi: ti aspetti che gli avversari raddoppino la marcatura su di te da qui in avanti?";
  }
  if (toneId === "ambitious") {
    return isEn()
      ? "Incredible hunger for greatness: what is the single biggest milestone left to check off?"
      : "Una fame insaziabile di vittorie: qual è il traguardo che più di ogni altro desideri raggiungere?";
  }
  if (isEn()) return ctx.followQEn || "One last comment to wrap up the press conference?";
  return ctx.followQ || "Un'ultima battuta per chiudere la conferenza stampa?";
}

function generateNewspaperHeadline(toneId, iv, p) {
  const isEnglish = isEn();
  const lastName = (p && p.lastName) || "STAR";
  const ctxKey = (iv && iv.context) || "default";

  if (toneId === "polemic") {
    if (ctxKey === "allStarSnub") {
      return isEnglish
        ? `🔥 “COMMERCIAL FARCE!” — ${lastName} RIPS ALL-STAR VOTING IN SCATHING TIRADE!`
        : `🔥 “FARSA COMMERCIALE!” — ${lastName} ATTACCA I VOTANTI DELL'ALL-STAR GAME!`;
    }
    if (ctxKey === "blowoutLossApology") {
      return isEnglish
        ? `💥 “NO HEART, NO EFFORT!” — ${lastName} CALLS OUT SQUAD AFTER 30-POINT HUMILIATION!`
        : `💥 “SENZA CUORE NÉ GRINTA!” — ${lastName} FURIOSO CONTRO LO SPOGLIATOIO DOPO IL -30!`;
    }
    if (ctxKey === "coachDisagreement" || ctxKey === "benchedMinutes") {
      return isEnglish
        ? `⚡ LOCKER ROOM CRISIS: ${lastName} CLASHES WITH HEAD COACH OVER BENCH DISPUTE!`
        : `⚡ SPOGLIATOIO IN FIAMME: ${lastName} SCONTRO TOTALE COL COACH PER LA PANCHINA!`;
    }
    if (ctxKey === "fanProtestTension") {
      return isEnglish
        ? `🔥 “REAL FANS DON'T BOO!” — ${lastName} CALLS OUT HOME FANS AFTER POST-GAME CHANTS!`
        : `🔥 “FACILE TIFARE SOLO QUANDO SI VINCE!” — ${lastName} REPLICA AI FISCHI DELLA CURVA!`;
    }
    if (ctxKey === "buzzerBeaterHero") {
      return isEnglish
        ? `🎯 “WHERE ARE THE CRITICS NOW?” — ${lastName} GLOATS AFTER UNBELIEVABLE GAME WINNER!`
        : `🎯 “DOVE SONO I DETRATTORI ORA?” — ${lastName} SBEFFEGGIA I CRITICI DOPO IL BUZZER BEATER!`;
    }
    if (ctxKey === "refBuzzerControversy" || ctxKey === "clutchLoss" || ctxKey === "overtimeHeartbreak2OT") {
      return isEnglish
        ? `🔥 “DISGRACEFUL OFFICIATING!” — ${lastName} EXPLODES AT REFS AFTER HEARTBREAKING LOSS!`
        : `🔥 “ARBITRAGGIO SCANDALOSO!” — ${lastName} FURIOSO CONTRO I FISCHIETTI DOPO LA SIRENA!`;
    }
    if (ctxKey === "tradeRumorsPressure" || ctxKey === "tradeDeadlineEve") {
      return isEnglish
        ? `💣 TRADE BOMBSHELL: ${lastName} DEMANDS AMBITION OR PREPARES HIS SUMMER EXIT!`
        : `💣 BOMBA DI MERCATO: ${lastName} METTE LA SOCIETÀ ALLE STRETTE: “O VINCERE O ME NE VADO!”`;
    }
    return isEnglish
      ? `💥 ${lastName} DROPS BOMBSHELL IN PRESS ROOM: “CERTAIN PEOPLE NEED TO WAKE UP!”`
      : `💥 ${lastName} A RUOTA LIBERA IN SALA STAMPA: “NON CI STO, QUALCUNO DEVE SVEGLIARSI!”`;
  }
  if (toneId === "ironic") {
    if (ctxKey === "buzzerBeaterHero") {
      return isEnglish
        ? `😂 “NIGHT NIGHT!”: ${lastName} GOES VIRAL WITH COLD CELEBRATION AFTER GAME WINNER!`
        : `😂 “GESTO DELLA BUONANOTTE!”: ${lastName} VIRALE CON L'ESULTANZA DOPO IL TIRO DELLA VITTORIA!`;
    }
    return isEnglish
      ? `😂 ${lastName} HAS PRESS ROOM IN STITCHES: VIRAL JOKE BREAKS THE INTERNET!`
      : `😂 SHOW DI ${lastName} IN CONFERENZA: LA BATTUTA FA IL GIRO DEL WEB TRA RISATE E MEME!`;
  }
  if (toneId === "leader") {
    return isEnglish
      ? `🫡 TRUE CAPTAIN'S CODE: ${lastName} SHIELDS HIS TEAMMATES AND RALLIES THE CLUB.`
      : `🫡 LEZIONE DI LEADERSHIP: ${lastName} CI METTE LA FACCIA E CARICA TUTTO LO SPOGLIATOIO.`;
  }
  if (toneId === "humble") {
    return isEnglish
      ? `🤝 PURE CLASS: ${lastName} DEFLECTS INDIVIDUAL ACCLAIM AND CREDITS TEAM GRIT.`
      : `🤝 SIGNORE DEL PARQUET: ${lastName} DEDICA OGNI RECORD AL SUDORE DEI COMPAGNI.`;
  }
  if (toneId === "confident") {
    if (ctxKey === "buzzerBeaterHero") {
      return isEnglish
        ? `👑 ICE IN THE VEINS! ${lastName} SENDS THE ARENA INTO HYSTERIA WITH CLUTCH MAGIC.`
        : `👑 GHIACCIO NELLE VENE! ${lastName} FA IMPAZZIRE IL PALAZZETTO CON UN CANESTRO DA CINEMA.`;
    }
    if (ctxKey === "lockdownDefenseMasterclass") {
      return isEnglish
        ? `🔒 DEFENSIVE LOCKDOWN! ${lastName} PUTS ON AN ABSOLUTE CLINIC ON OPPONENTS.`
        : `🔒 MASTERCLASS DIFENSIVA! ${lastName} ANNULLA LA STELLA AVVERSARIA E SIGILLA LA GARA.`;
    }
    if (ctxKey === "historicTripleDouble") {
      return isEnglish
        ? `📊 HISTORIC TRIPLE-DOUBLE! ${lastName} REWRITES THE RECORD BOOKS WITH VIDEO-GAME STATS.`
        : `📊 TRIPLA DOPPIA DA LEGGENDA! ${lastName} RISCRIVE I LIBRI DEI RECORD DELLA FRANCHIGIA.`;
    }
    return isEnglish
      ? `👑 “I'M BUILT FOR THIS”: ${lastName} SENDS CHILLING WARNING TO ALL CONTENDERS.`
      : `👑 “SONO FATTO PER QUESTI PALCOSCENICI”: ${lastName} LANCIA IL GUANTO DI SFIDA.`;
  }
  if (toneId === "ambitious") {
    return isEnglish
      ? `🎯 RELENTLESS PREDATOR: ${lastName} REFUSES TO RELAX — “WE WANT THE TITLE!”`
      : `🎯 FAME DA CAMPIONE: ${lastName} NON SI ACCONTENTA — “VOGLIO ENTRARE NELLA STORIA!”`;
  }
  return isEnglish
    ? `🤐 ${lastName} LEAVES PRESS ROOM IN ICY SILENCE: NO COMMENT.`
    : `🤐 ${lastName} LASCIA LA SALA STAMPA IN UN SILENZIO GELIDO: NESSUN COMMENTO.`;
}

/* Seconda domanda interattiva (incalzo del giornalista): 4 scelte mirate */
const INTERVIEW_FOLLOWUP_OPTIONS = [
  {
    id: "coach", icon: "📋", label: "Merito del coach", labelEn: "Credit the coach",
    quote: "Il piano partita dello staff tecnico è la nostra bussola: seguiamo il coach ad occhi chiusi.",
    quoteEn: "The coaching staff's game plan is our compass: we follow the coach blindly.",
    effects: { coachTrust: 3, reputation: 1 },
    note: "Il coach apprezza il sostegno pubblico", noteEn: "The coach appreciates the public support",
  },
  {
    id: "teammates", icon: "🤜🤛", label: "Esalta i compagni", labelEn: "Praise teammates",
    quote: "Con compagni così e l'intesa che abbiamo con i leader del gruppo tutto diventa più semplice.",
    quoteEn: "With teammates like these and the bond we have with our leaders, everything gets easier.",
    effects: { chemistry: 3, starRapport: 3 },
    note: "Spogliatoio e stella ringraziano", noteEn: "Locker room and star player appreciate it",
  },
  {
    id: "fans", icon: "🏟️", label: "Carica i tifosi", labelEn: "Fire up the fans",
    quote: "Il nostro pubblico merita il massimo: riempite il palazzetto, vi faremo divertire!",
    quoteEn: "Our fans deserve the best: pack the arena, we'll put on a show!",
    effects: { popularity: 4, morale: 2 },
    note: "I tifosi ti portano in trionfo", noteEn: "The fans celebrate you",
  },
  {
    id: "rivals", icon: "⚡", label: "Sfida gli avversari", labelEn: "Challenge rivals",
    quote: "Chi pensa di metterci i piedi in testa farà bene a ripensarci: non temiamo nessuno.",
    quoteEn: "Anyone who thinks they can push us around better think twice: we fear nobody.",
    effects: { morale: 4, popularity: 2, reputation: -1 },
    note: "Dichiarazione battagliera che infiamma la vigilia", noteEn: "Fiery statement that heats up the buildup",
  },
];
if (typeof i18nify === "function") i18nify(INTERVIEW_FOLLOWUP_OPTIONS);

function seasonInterviewContext(rec, p) {
  if (rec.champion) return "champion";
  if ((rec.awards || []).some(a => a.startsWith("MVP"))) return "mvp";
  if (rec.playoffResult === "Finale persa" || rec.playoffResult === "Lost in Finals") return "finalLost";
  if (rec.nationalCup && rec.nationalCup.champion) return "nationalCupWin";
  if (rec.injury && rec.gp != null && rec.games && rec.gp / rec.games < 0.7) return "injury";
  if (rec.playoffResult && (rec.playoffResult.includes("Eliminat") || rec.playoffResult.includes("Semifin") || rec.playoffResult.includes("Quart") || rec.playoffResult.includes("Turno"))) return "playoffEliminationHeartbreak";
  if (!rec.playoffRounds && rec.league !== "NCAA") return "missedPlayoffs";
  if (p.contract && p.contract.yearsRemaining === 1 && p.contract.salaryPerYear != null) return "contractYear";
  if (rec.pts >= 22) return "careerHighMonster";
  if (rec.pts >= 17) return "bigSeason";
  return "default";
}

function blockInterviewContext(p, s) {
  if (!s) return "seasonStart";
  p.seenInterviewContexts = p.seenInterviewContexts || [];

  if (s.blocks.length === 0) {
    if (s.tradedFrom) return "newTeam";
    if (p.contract && p.contract.yearsRemaining === 1 && p.contract.salaryPerYear != null) return "contractYear";
    return "seasonStart";
  }

  const last = s.blocks[s.blocks.length - 1];
  const bIdx = s.blocks.length;

  if (s.tradedFrom && bIdx >= 1 && !s.tradedInterviewDone) {
    s.tradedInterviewDone = true;
    return "newTeam";
  }
  if (s.nationalCup && s.nationalCup.champion && bIdx === 2) return "nationalCupWin";

  const candidates = [];

  // Key Game played in this block
  if (last.keyGame) {
    const kg = last.keyGame;
    if (kg.success) {
      if (kg.shotMeter && (kg.shotMeter.timing === "perfect" || kg.shotMeter.timing === "good")) {
        candidates.push({ ctx: "buzzerBeaterHero", weight: 80 });
      }
      if (kg.kind === "derby") candidates.push({ ctx: "rivalryTension", weight: 70 });
      if (kg.kind === "exTeam") candidates.push({ ctx: "hometownHomecoming", weight: 65 });
      if (kg.kind === "top") candidates.push({ ctx: "fansStandingOvationAway", weight: 60 });
      candidates.push({ ctx: "keyGameWin", weight: 50 });
    } else {
      candidates.push({ ctx: "refBuzzerControversy", weight: 55 });
      candidates.push({ ctx: "overtimeHeartbreak2OT", weight: 50 });
      if (kg.kind === "derby") candidates.push({ ctx: "rivalryTension", weight: 60 });
      candidates.push({ ctx: "keyGameLoss", weight: 45 });
    }
  }

  // Stats performance in this block
  const stats = last.stats || {};
  if (stats.pts >= 25) {
    candidates.push({ ctx: "careerHighMonster", weight: 70 });
  }
  if ((stats.pts >= 18 && stats.ast >= 7) || (stats.pts >= 18 && stats.reb >= 9)) {
    candidates.push({ ctx: "historicTripleDouble", weight: 65 });
  }
  if ((stats.stl || 0) + (stats.blk || 0) >= 3) {
    candidates.push({ ctx: "lockdownDefenseMasterclass", weight: 60 });
  }
  if (stats.fg >= 52 && stats.pts >= 18) {
    candidates.push({ ctx: "shootingSlumpBreakthrough", weight: 55 });
  }

  // Workload / Bench / Role
  if (last.workload === "rest") {
    candidates.push({ ctx: "loadManagementDebate", weight: 65 });
  }
  if (p.currentTeamRole === "bench" || (p.coachTrust && p.coachTrust < 45)) {
    if (stats.pts >= 14) {
      candidates.push({ ctx: "sixthManSparkPlug", weight: 60 });
    } else {
      candidates.push({ ctx: "benchedMinutes", weight: 55 });
    }
  }

  // Coach Trust / Chemistry / Gossip
  if (p.coachTrust && p.coachTrust < 40) {
    candidates.push({ ctx: "coachDisagreement", weight: 60 });
  }
  if (p.chemistry && p.chemistry < 50) {
    candidates.push({ ctx: "lockerRoomDramaRumors", weight: 55 });
  }
  if (p.lifestyle && p.lifestyle.length >= 2 && p.wealth >= 0.2) {
    candidates.push({ ctx: "lifestyleGossip", weight: 45 });
  }

  // Mid-season windows (Blocks 2 and 3)
  if (bIdx === 2 || bIdx === 3) {
    // All-Star snub check
    if ((p.overall >= 80 || stats.pts >= 19) && (!p.awards || !p.awards.some(a => a.includes("All-Star")))) {
      candidates.push({ ctx: "allStarSnub", weight: 55 });
    }
    // Trade deadline eve / rumors
    if (p.contract && p.contract.yearsRemaining === 1) {
      candidates.push({ ctx: "tradeDeadlineEve", weight: 60 });
      candidates.push({ ctx: "tradeRumorsPressure", weight: 55 });
    }
  }

  // Blowout losses & fan protest vs regular slump
  if (last.losses >= last.wins + 3 || last.losses >= 4) {
    candidates.push({ ctx: "blowoutLossApology", weight: 65 });
    candidates.push({ ctx: "fanProtestTension", weight: 55 });
    candidates.push({ ctx: "slumpBlock", weight: 50 });
  } else if (last.losses >= last.wins + 2) {
    candidates.push({ ctx: "slumpBlock", weight: 50 });
  }

  // Winning streaks
  if (last.wins >= last.losses + 2) {
    candidates.push({ ctx: "hotStreak", weight: 50 });
    candidates.push({ ctx: "defenseWinUgly", weight: 45 });
  }

  // Mentorship
  if (typeof menteeActive === "function" && menteeActive(p)) {
    candidates.push({ ctx: "rookieMentorshipPraise", weight: 50 });
  }

  // Trash talking viral
  if (rollChance(25)) {
    candidates.push({ ctx: "trashTalkingViral", weight: 40 });
  }

  // Anti-repetition: avoid candidates shown recently
  const recentSeen = (p.seenInterviewContexts || []).slice(-4);
  const freshCandidates = candidates.filter(c => !recentSeen.includes(c.ctx));
  const pool = freshCandidates.length > 0 ? freshCandidates : candidates;

  let selectedCtx;
  if (pool.length > 0) {
    const totalWeight = pool.reduce((acc, c) => acc + c.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const c of pool) {
      rand -= c.weight;
      if (rand <= 0) {
        selectedCtx = c.ctx;
        break;
      }
    }
    if (!selectedCtx) selectedCtx = pool[0].ctx;
  } else {
    selectedCtx = "midSeasonCheck";
  }

  p.seenInterviewContexts.push(selectedCtx);
  if (p.seenInterviewContexts.length > 15) p.seenInterviewContexts.shift();

  return selectedCtx;
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
  if (e.popularity) parts.push(`${isEn() ? "popularity" : "popolarità"} ${e.popularity > 0 ? "+" : ""}${e.popularity}`);
  if (e.chemistry) parts.push(`${isEn() ? "chemistry" : "chimica"} ${e.chemistry > 0 ? "+" : ""}${e.chemistry}`);
  if (e.morale) parts.push(`morale ${e.morale > 0 ? "+" : ""}${e.morale}`);
  if (e.reputation) parts.push(`${isEn() ? "reputation" : "reputazione"} ${e.reputation > 0 ? "+" : ""}${e.reputation}`);
  if (e.coachTrust) parts.push(`${isEn() ? "coach trust" : "fiducia del coach"} ${e.coachTrust > 0 ? "+" : ""}${e.coachTrust}`);
  if (e.starRapport) parts.push(`${isEn() ? "star rapport" : "intesa stella"} ${e.starRapport > 0 ? "+" : ""}${e.starRapport}`);
  return `${note} (${parts.join(", ")})`;
}

/* Applica gli effetti del tono scelto; include conseguenze reali come multe o boost virali */
function applyInterviewTone(toneId, iv) {
  const tone = INTERVIEW_TONES.find(t => t.id === toneId);
  if (!tone) return null;
  const p = player;
  const ctxKey = iv ? iv.context : "default";

  let specialNote = "";
  if (toneId === "polemic") {
    // Multa pecuniaria ufficiale se si attacca l'arbitraggio o la lega
    if (ctxKey === "refBuzzerControversy" || ctxKey === "clutchLoss" || ctxKey === "overtimeHeartbreak2OT") {
      const fine = Math.max(0.015, roundMoney(p.wealth * 0.035));
      p.wealth = roundMoney(Math.max(0, p.wealth - fine));
      p.reputation = clamp(p.reputation - 2, 0, 100);
      if (iv) iv.fine = fine;
      specialNote = ` · ${isEn() ? `⚖️ League fine: -${fmtMoney(fine, playerCurrency(p))}` : `⚖️ Multa della lega: -${fmtMoney(fine, playerCurrency(p))}`}`;
      toast(isEn()
        ? `⚖️ OFFICIAL LEAGUE FINE: ${fmtMoney(fine, playerCurrency(p))} for criticizing game officials.`
        : `⚖️ MULTA UFFICIALE DELLA LEGA: ${fmtMoney(fine, playerCurrency(p))} per dichiarazioni lesive sulla terna arbitrale.`);
      pushNews(isEn()
        ? `⚖️ Disciplinary office: ${p.lastName} fined ${fmtMoney(fine, playerCurrency(p))} for post-game ref comments.`
        : `⚖️ Giudice sportivo: ${p.lastName} sanzionato con ${fmtMoney(fine, playerCurrency(p))} di multa per le accuse agli arbitri.`);
    } else if (ctxKey === "allStarSnub") {
      const fine = Math.max(0.01, roundMoney(p.wealth * 0.02));
      p.wealth = roundMoney(Math.max(0, p.wealth - fine));
      p.popularity = clamp(p.popularity + 6, 0, 100);
      specialNote = ` · ${isEn() ? "🔥 Fans love the rebellion, league displeased" : "🔥 Tifosi in estasi per la ribellione"}`;
    } else if (ctxKey === "benchedMinutes" || ctxKey === "coachDisagreement") {
      if (typeof changeCoachTrust === "function") changeCoachTrust(p, -5);
      p.chemistry = clamp(p.chemistry - 4, 0, 100);
      specialNote = ` · ${isEn() ? "❄️ Frosty bench dispute" : "❄️ Tensione totale con il coach"}`;
    } else if (ctxKey === "blowoutLossApology") {
      p.chemistry = clamp(p.chemistry - 5, 0, 100);
      p.morale = clamp(p.morale - 3, 0, 100);
      specialNote = ` · ${isEn() ? "⚡ Teammates resent call-out" : "⚡ Compagni furiosi per le critiche"}`;
    } else if (ctxKey === "fanProtestTension") {
      p.popularity = clamp(p.popularity - 5, 0, 100);
      specialNote = ` · ${isEn() ? "🏟️ Fanbase boos amplify" : "🏟️ Frattura totale con la curva"}`;
    }
  } else if (toneId === "ironic") {
    // Boom virale sui social
    const viral = Math.max(600, Math.round(socialFollowersCount(p) * 0.035));
    if (p.social) p.social.bonusFollowers = (p.social.bonusFollowers || 0) + viral;
    p.popularity = clamp(p.popularity + 3, 0, 100);
    if (iv) iv.viralFollowers = viral;
    specialNote = ` · ${isEn() ? `🔥 +${fmtFollowers(viral)} viral followers` : `🔥 +${fmtFollowers(viral)} follower virali`}`;
  } else if (toneId === "leader") {
    p.chemistry = clamp(p.chemistry + 3, 0, 100);
    if (typeof changeCoachTrust === "function") changeCoachTrust(p, 2);
    specialNote = ` · ${isEn() ? "🫡 Locker room rallied" : "🫡 Spogliatoio compatto"}`;
  }

  const baseNote = applyInterviewEffects(tone.effects, tone.note, toneId === "polemic");
  return `${baseNote}${specialNote}`;
}

function applyInterviewFollowUp(followId) {
  const opt = INTERVIEW_FOLLOWUP_OPTIONS.find(o => o.id === followId);
  if (!opt) return null;
  const res = applyInterviewEffects(opt.effects, opt.note, false);
  pushNews(isEn()
    ? `🎤 Press room (${player.team.name}): “${opt.quote}”`
    : `🎤 Sala stampa (${player.team.name}): “${opt.quote}”`);
  return res;
}

function interviewOutlet(iv) {
  if (typeof getInterviewJournalist === "function") {
    const j = getInterviewJournalist(iv);
    iv.outlet = `${j.avatar} ${j.outlet}`;
    return iv.outlet;
  }
  const list = isEn() ? PRESS_OUTLETS_EN : PRESS_OUTLETS;
  const idx = Math.abs((iv.context || "default").length + (player ? player.year || 0 : 0)) % list.length;
  iv.outlet = list[idx];
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
  const journalist = typeof getInterviewJournalist === "function" ? getInterviewJournalist(iv) : { name: "Reporter", outlet: interviewOutlet(iv), tag: "🎙️ Sala Stampa", avatar: "🎙️" };
  const outlet = `${journalist.avatar} ${journalist.outlet}`;
  const ansMap = ivAnswers(ctx);

  if (iv.answered && !iv.followUpAnswered) {
    const tone = INTERVIEW_TONES.find(t => t.id === iv.answered);
    const quote = tone ? (ansMap[tone.id] || ansMap.confident) : null;
    const reaction = tone ? pressReactionText(tone.id) : null;
    const followQ = ivFollowQ(ctx, iv.answered);
    const headline = typeof generateNewspaperHeadline === "function" ? generateNewspaperHeadline(iv.answered, iv, player) : null;

    card.innerHTML = `
      <div class="pm-outlet-strap">
        <span>${outlet}</span>
        <span class="small-muted">${isEn() ? "Press room follow-up" : "Incalzo dalla sala stampa"}</span>
        <button type="button" class="btn btn-ghost btn-xs" id="btn-close-press-modal" style="margin-left:auto; padding:2px 8px;" title="${isEn() ? "Close" : "Chiudi"}">✕</button>
      </div>
      <div class="cm-body">
        <div class="pm-journalist-badge">
          <span class="pm-j-avatar">${journalist.avatar}</span>
          <div class="pm-j-info">
            <span class="pm-j-name">${journalist.name}</span>
            <span class="pm-j-outlet">${journalist.outlet} · <span class="badge">${journalist.tag}</span></span>
          </div>
        </div>

        ${headline ? `
          <div class="pm-newspaper-card">
            <div class="pm-newspaper-header">
              <span>📰 ${isEn() ? "Tomorrow's Front Page Headline" : "Titolo in Prima Pagina"}</span>
              <span class="badge ${iv.answered === "polemic" ? "red" : iv.answered === "ironic" ? "gold" : "blue"}">${tone ? tone.label : ""}</span>
            </div>
            <div class="pm-newspaper-headline">${headline}</div>
            ${iv.result ? `<div class="small-muted" style="margin-top:6px;font-size:12.5px;">⚡ ${iv.result}</div>` : ""}
          </div>` : ""}

        <div class="pm-question-box" style="border-left-color:var(--signal); background:rgba(255,90,31,0.06);">
          <div class="pm-q-label" style="color:var(--signal);">${isEn() ? "Reporter's follow-up question" : "Seconda domanda del cronista"}</div>
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
          <button type="button" class="btn btn-ghost btn-sm" data-pm-follow="none">${isEn() ? "👋 Wave and leave the podium" : "👋 Saluta e lascia il podio"}</button>
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
      <span>${outlet}</span>
      <span class="small-muted">${isEn() ? "Official Press Conference" : "Conferenza Stampa Ufficiale"}</span>
      <button type="button" class="btn btn-ghost btn-xs" id="btn-close-press-modal" style="margin-left:auto; padding:2px 8px;" title="${isEn() ? "Close" : "Chiudi"}">✕</button>
    </div>
    <div class="cm-body">
      <div class="pm-journalist-badge">
        <span class="pm-j-avatar">${journalist.avatar}</span>
        <div class="pm-j-info">
          <span class="pm-j-name">${journalist.name}</span>
          <span class="pm-j-outlet">${journalist.outlet} · <span class="badge">${journalist.tag}</span></span>
        </div>
      </div>

      <div class="pm-question-box">
        <div class="pm-q-label">${isEn() ? "Reporter's question" : "Domanda dei giornalisti"}</div>
        <div class="pm-q-text">“${ivQuestion(ctx)}”</div>
      </div>
      <div class="pm-tones-grid">
        ${INTERVIEW_TONES.map(t => `
          <button type="button" class="pm-tone-btn" data-pm-tone="${t.id}">
            <div class="pm-t-head">
              <span class="pm-t-title">${t.icon} ${t.label}</span>
              <span class="pm-t-tag">${t.tag}</span>
            </div>
            <div class="pm-t-quote">“${ansMap[t.id] || ansMap.confident}”</div>
          </button>`).join("")}
      </div>
      <div class="btn-row" style="margin-top:10px; justify-content:flex-end;">
        <button type="button" class="btn btn-ghost btn-sm" data-pm-tone="none">${isEn() ? "🤐 No comment" : "🤐 Nessun commento"}</button>
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
  const ansMap = ivAnswers(ctx);

  if (iv.answered) {
    const tone = INTERVIEW_TONES.find(t => t.id === iv.answered);
    const quote = tone ? (ansMap[tone.id] || ansMap.confident) : null;
    const followQ = ivFollowQ(ctx);
    const followOpt = iv.followUpAnswered && iv.followUpAnswered !== "none"
      ? INTERVIEW_FOLLOWUP_OPTIONS.find(o => o.id === iv.followUpAnswered)
      : null;

    if (tone && !iv.followUpAnswered) {
      return `
        <div class="ps-bracket active phase-current" style="border:1px solid var(--live); background:rgba(41,196,255,0.05); padding:16px; margin:14px 0; text-align:center;">
          <div style="font-family:var(--font-display); font-size:20px; font-weight:800; color:var(--live); text-transform:uppercase; margin-bottom:4px;">
            🎙️ ${outlet} · ${isEn() ? "Follow-up in progress" : "Incalzo in corso"}
          </div>
          <p class="small-muted" style="margin-bottom:12px;">“${followQ}”</p>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-reopen-press-modal" style="margin:0 auto;">
            ${isEn() ? "Answer reporters' follow-up" : "Rispondi all'incalzo dei giornalisti"}
          </button>
        </div>`;
    }

    return `
      <div class="interview-box done">
        <div class="iv-meta"><span class="badge">${outlet}</span> <span class="small-muted">· ${isEn() ? "Press conference ended" : "Conferenza conclusa"}</span></div>
        <div class="iv-q">🎤 “${ivQuestion(ctx)}”</div>
        <div class="iv-a">${tone ? `${tone.icon} “${quote}”` : (isEn() ? "🤐 No comment." : "🤐 Nessun commento.")}</div>
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
        🎙️ ${outlet} · ${isEn() ? "Press Room" : "Sala Stampa"}
      </div>
      <p class="small-muted" style="margin-bottom:12px;">${isEn() ? `The mics are live for you. Question: “${ivQuestion(ctx)}”` : `I microfoni sono accesi per te. Domanda: “${ivQuestion(ctx)}”`}</p>
      <button type="button" class="btn btn-primary" id="btn-open-press-modal" style="margin:0 auto;">
        ${isEn() ? "🎤 Answer the press conference" : "🎤 Rispondi alla conferenza stampa"}
      </button>
    </div>`;
}

function answerInterviewObj(iv, toneId) {
  if (!iv || iv.answered) return;
  iv.answered = toneId;
  iv.result = toneId === "none" ? null : applyInterviewTone(toneId, iv);
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
  if (player && player.isDaily) {
    if (typeof evaluateDailyPerformance === "function") {
      const dailyRes = evaluateDailyPerformance(player);
      recordDailyResult(dailyRes);
    }
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
  const poFallback = rec.playoffRounds ? (isEn() ? "playoffs" : "playoff") : (isEn() ? "missed playoffs" : "niente playoff");
  phases.push(`🏀 ${LEAGUES[rec.league].name}: ${rec.wins}-${rec.losses}${rec.rank ? (isEn() ? `, #${rec.rank} of ${rec.totalTeams}` : `, ${rec.rank}° su ${rec.totalTeams}`) : ""} · ${rec.playoffResult || poFallback}`);
  if (rec.nationalCup && rec.nationalCup.qualified !== false) {
    const cupName = typeof leagueCupName === "function" ? leagueCupName(rec.league) : rec.nationalCup.name;
    phases.push(`🏆 ${cupName}: ${rec.nationalCup.champion ? (isEn() ? "Champions!" : "Campioni!") : (isEn() ? `eliminated in ${rec.nationalCup.eliminatedAt ? rec.nationalCup.eliminatedAt.toLowerCase() : "quarterfinals"}` : `eliminati in ${rec.nationalCup.eliminatedAt ? rec.nationalCup.eliminatedAt.toLowerCase() : "quarti"}`)}`);
  }
  if (rec.continental) phases.push(`🏟️ ${rec.continental.competition}: ${rec.continental.result || (isEn() ? "eliminated in group stage" : "eliminati ai gironi")}`);
  if (rec.nationalComp) phases.push(`🌍 ${rec.nationalComp.name}: ${nationalCompOutcomeText(rec.nationalComp)}`);
  const offs = rec.offseason ? `${rec.offseason.tone === "positive" ? "🌟" : rec.offseason.tone === "negative" ? "⚠️" : "🌤️"} ${rec.offseason.title}` : null;
  const coverHtml = typeof seasonCoverHtml === "function" ? `
    <div class="recap-cover-wrap">
      ${seasonCoverHtml(rec, player)}
      <div class="recap-cover-actions">
        <button type="button" class="btn btn-secondary btn-sm" id="btn-share-cover">${isEn() ? "📸 Download Magazine Cover" : "📸 Scarica Copertina Rivista"}</button>
      </div>
    </div>` : "";

  extra.innerHTML = `
    <div class="recap-switcher-wrap">
      <div class="recap-switcher" role="tablist">
        <button type="button" class="recap-tab-btn active" data-recap-tab="cover">${isEn() ? "📸 Magazine Cover" : "📸 Copertina Rivista"}</button>
        <button type="button" class="recap-tab-btn" data-recap-tab="stats">${isEn() ? "📊 Stats Sheet" : "📊 Scheda Statistiche"}</button>
      </div>
    </div>

    <div class="recap-view-cover">
      ${coverHtml}
    </div>

    <div class="recap-view-stats hidden">
      <div class="recap-stage">
        <div class="recap-ovr ${rec.champion ? "champ" : ""}">
          <div class="recap-ovr__stripes" aria-hidden="true"></div>
          <span class="recap-ovr__k">${rec.champion ? (isEn() ? "Champions · End-of-season Overall" : "Campioni · overall a fine stagione") : (isEn() ? "End-of-season Overall" : "Overall a fine stagione")}</span>
          <span class="recap-ovr__num co-num">${rec.overall}</span>
          <span class="recap-ovr__d">${rec.ovrDelta > 0 ? "▲ +" : rec.ovrDelta < 0 ? "▼ −" : "= "}${Math.abs(rec.ovrDelta || 0)}</span>
        </div>
        <section class="card recap-box">
          <div class="recap-box__head">
            <span class="recap-team"><span class="co-dot" style="--team:${rec.team.colors ? rec.team.colors[0] : "var(--signal)"}"></span><span class="recap-team__name">${rec.team.name}</span></span>
            <span class="co-row"><span class="co-chip">${LEAGUES[rec.league].name}</span>${rec.teamRole ? `<span class="co-chip">${getTeamRole(rec.teamRole).label}</span>` : rec.roleLabel ? `<span class="co-chip">${rec.roleLabel}</span>` : ""}${rec.gp != null ? `<span class="co-chip">${rec.gp}/${rec.games} ${isEn() ? "games" : "partite"}</span>` : ""}<span class="co-chip">${rec.age} ${isEn() ? "yo" : "anni"}</span></span>
          </div>
          <div class="summary-grid recap-tiles">
            ${recapTile(rec.pts, isEn() ? "Points per game" : "Punti a partita")}${recapTile(rec.reb, isEn() ? "Rebounds" : "Rimbalzi")}${recapTile(rec.ast, isEn() ? "Assists" : "Assist")}
            ${recapTile(`${rec.fg}%`, isEn() ? "Field Goal" : "Dal campo")}
            ${recapTile(`${rec.ovrDelta > 0 ? "+" : rec.ovrDelta < 0 ? "−" : ""}${Math.abs(rec.ovrDelta || 0)}`, `Overall → ${rec.overall}`, rec.ovrDelta > 0 ? "up" : rec.ovrDelta < 0 ? "down" : "")}
            ${recapTile(`+${rec.goatPoints || 0}`, isEn() ? "GOAT Points" : "Punti GOAT", "gold")}
          </div>
        </section>
      </div>
    </div>
    <div class="recap-section"><div class="recap-h">${isEn() ? "Season Journey" : "Il cammino"}</div>${phases.map(x => `<div class="recap-row">${x}</div>`).join("")}</div>
    ${rec.goals && rec.goals.length ? `<div class="recap-section"><div class="recap-h">${isEn() ? "Club Goals" : "Obiettivi della società"}</div>${seasonGoalsListHtml(rec.goals, rec.goals)}</div>` : ""}
    ${rec.careerGoalDone ? `<div class="recap-section"><div class="recap-h">${isEn() ? "Your Dream" : "Il tuo sogno"}</div><div class="recap-row">🌠 ${getCareerGoal(rec.careerGoalDone).icon} ${getCareerGoal(rec.careerGoalDone).label}: ${isEn() ? `achieved! (+${CAREER_GOAL_REWARD.goat} GOAT pts)` : `realizzato! (+${CAREER_GOAL_REWARD.goat} punti GOAT)`}</div></div>` : ""}
    ${rec.newAchievements && rec.newAchievements.length ? `<div class="recap-section"><div class="recap-h">${isEn() ? "Unlocked Achievements" : "Traguardi sbloccati"}</div><div class="recap-badges">${rec.newAchievements.map(id => getAchievement(id)).filter(Boolean).map(a => `<span class="badge blue">${a.icon} ${a.title}</span>`).join("")}</div></div>` : ""}
    ${rec.awards && rec.awards.length ? `<div class="recap-section"><div class="recap-h">${isEn() ? "Awards" : "Premi"}</div><div class="recap-badges">${rec.awards.map(a => `<span class="badge gold">🏅 ${a}</span>`).join("")}</div></div>` : ""}
    <div class="recap-section"><div class="recap-h">${isEn() ? "Off the Court" : "Fuori dal campo"}</div>
      <div class="recap-row">💰 ${isEn() ? "Earnings" : "Guadagni"}: +${fmtMoney(rec.seasonEarnings || 0, cur)}${rec.contractBonus ? (isEn() ? ` (incl. ${fmtMoney(rec.contractBonus, cur)} bonus)` : ` (di cui bonus ${fmtMoney(rec.contractBonus, cur)})`) : ""}${rec.investmentIncome ? (isEn() ? ` · returns +${fmtMoney(rec.investmentIncome, cur)}` : ` · rendite +${fmtMoney(rec.investmentIncome, cur)}`) : ""} · ${isEn() ? "net worth" : "patrimonio"} ${fmtMoney(player.wealth, cur)}</div>
      ${(rec.investmentNotes || []).map(n => `<div class="recap-row">${n}</div>`).join("")}
      ${rec.reputation != null ? `<div class="recap-row">⭐ ${isEn() ? "Reputation" : "Reputazione"} ${rec.reputation} · ${reputationLabel(rec.reputation)}${rec.reputationNotes && rec.reputationNotes.length ? ` <span class="small-muted">(${rec.reputationNotes.join(", ")})</span>` : ""}</div>` : ""}
      ${rec.coachTrust != null ? `<div class="recap-row">🧑‍🏫 ${isEn() ? "Coach Trust" : "Fiducia del coach"}: ${rec.coachTrust}</div>` : ""}
      ${(rec.staffNotes || []).map(n => `<div class="recap-row">${n}</div>`).join("")}
      ${rec.injury ? `<div class="recap-row">${rec.injury.text}</div>` : ""}
      ${rec.seriousInjury ? `<div class="recap-row">🏥 ${typeof seriousInjuryLabel === "function" ? seriousInjuryLabel(rec.seriousInjury.label) : rec.seriousInjury.label}: ${rec.seriousInjury.choice === "surgery" ? (isEn() ? "surgery" : "operazione") : rec.seriousInjury.relapse ? (isEn() ? "conservative therapy & relapse" : "terapia conservativa e ricaduta") : (isEn() ? "conservative therapy, successful return" : "terapia conservativa, rientro riuscito")}</div>` : ""}
      ${(rec.keyGames || []).map(k => `<div class="recap-row">${KEY_GAME_KINDS[k.kind].icon} ${KEY_GAME_KINDS[k.kind].label || k.label} ${isEn() ? "vs" : "contro"} ${k.opponent}: ${k.success ? (isEn() ? "won on the final possession" : "vinta all'ultimo possesso") : (isEn() ? "lost on the final possession" : "persa all'ultimo possesso")}</div>`).join("")}
      ${(rec.leadershipNotes || []).map(n => `<div class="recap-row">${n}</div>`).join("")}
      ${rec.lifestyleUpkeep ? `<div class="recap-row">👨‍🍳 ${isEn() ? `Private chef: −${fmtMoney(rec.lifestyleUpkeep, cur)}, fragility −3` : `Chef privato: −${fmtMoney(rec.lifestyleUpkeep, cur)}, fragilità −3`}</div>` : ""}
      ${(rec.sponsorResults || []).map(r => `<div class="recap-row">${r.met ? "🤝" : "💔"} ${r.text}</div>`).join("")}
      ${rec.roleBattle ? `<div class="recap-row">⚔️ ${isEn() ? `Spot battle vs ${rec.roleBattle.rival.name}: ${rec.roleBattle.won ? (rec.roleBattle.regainedIn ? `spot reclaimed in ${rec.roleBattle.regainedIn}` : "won at training camp") : "lost, backup season"}` : `Sfida per il posto con ${rec.roleBattle.rival.name}: ${rec.roleBattle.won ? (rec.roleBattle.regainedIn ? `posto ripreso in ${rec.roleBattle.regainedIn}` : "vinta al training camp") : "persa, stagione da rincalzo"}`}</div>` : ""}
      ${rec.adaptation ? `<div class="recap-row">🧳 ${isEn() ? `Adaptation in ${typeof countryDisplayName === "function" ? countryDisplayName(rec.adaptation.country) : rec.adaptation.country}: ${rec.adaptation.level}/100` : `Ambientamento in ${rec.adaptation.country}: ${rec.adaptation.level}/100`}</div>` : ""}
      ${offs ? `<div class="recap-row">☀️ ${isEn() ? "Summer" : "Estate"}: ${offs}</div>` : ""}
    </div>
    ${d.interview ? `<div class="recap-section"><div class="recap-h">${isEn() ? "Press Conference" : "Conferenza stampa"}</div>${interviewHtml(d.interview, "data-recap-tone", "data-recap-follow")}</div>` : ""}
    <div class="btn-row" style="justify-content:center">
      <button class="btn btn-primary btn-lg" id="btn-recap-continue">${d.retireAfter ? (isEn() ? "End Career" : "Chiudi la carriera") : (isEn() ? "Continue to Summer" : "Continua verso l'estate")}${d.interview && !d.interview.answered ? (isEn() ? " without answering" : " senza rispondere") : ""}</button>
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
    { name: "Hoops Central", handle: "@HoopsCentral", badge: "📰 Media", badgeEn: "📰 Media", verified: true, avatar: "📰" },
    { name: "EuroBasket Insider", handle: "@EuroHoopsIn", badge: "📰 Insider", badgeEn: "📰 Insider", verified: true, avatar: "🏀" },
    { name: "La Gazzetta del Parquet", nameEn: "Hardwood Gazette", handle: "@GazzettaParquet", badge: "📰 Stampa", badgeEn: "📰 Press", verified: true, avatar: "🗞️" },
    { name: "CourtSide Report", handle: "@CourtSideRep", badge: "🎙️ TV", badgeEn: "🎙️ TV", verified: true, avatar: "🎙️" },
    { name: "Overtime Basket", handle: "@OvertimeBBall", badge: "📊 Analisi", badgeEn: "📊 Analytics", verified: true, avatar: "📊" },
  ],
  fan: [
    { name: "Sesto Uomo", nameEn: "Sixth Man Club", handle: "@SestoUomo_Official", badge: "📣 Tifoso", badgeEn: "📣 Fan", verified: false, avatar: "📣" },
    { name: "Curva Parquet", nameEn: "Hardwood Ultras", handle: "@CurvaParquet", badge: "🥁 Ultras", badgeEn: "🥁 Ultras", verified: false, avatar: "🔥" },
    { name: "Hoops Lover 99", handle: "@HoopsLover99", badge: "🏀 Fan", badgeEn: "🏀 Fan", verified: false, avatar: "🙌" },
    { name: "Basket Mania", handle: "@BasketMania_IT", badge: "📣 Fan Page", badgeEn: "📣 Fan Page", verified: false, avatar: "💛" },
    { name: "Febbre a 90° Basket", nameEn: "Hoops Fever", handle: "@FebbreBasket", badge: "📣 Tifoso", badgeEn: "📣 Fan", verified: false, avatar: "🏟️" },
  ],
  critic: [
    { name: "Hardwood Critic", handle: "@HardwoodCritic", badge: "🧐 Critico", badgeEn: "🧐 Critic", verified: false, avatar: "🧐" },
    { name: "Brick Watcher", handle: "@BrickWatcher_", badge: "🧌 Hater", badgeEn: "🧌 Hater", verified: false, avatar: "🧱" },
    { name: "Coach da Divano", nameEn: "Armchair Coach", handle: "@ArmchairCoach", badge: "📋 Opinionista", badgeEn: "📋 Pundit", verified: false, avatar: "🛋️" },
    { name: "Advanced Stats Nerd", handle: "@TrueShootingPct", badge: "📉 Analista", badgeEn: "📉 Analyst", verified: false, avatar: "🤓" },
    { name: "Hot Take Studio TV", handle: "@HotTakeStudioTV", badge: "🌶️ Hot Take TV", badgeEn: "🌶️ Hot Take TV", verified: true, avatar: "📺" },
    { name: "Ex-Leggenda '94", nameEn: "Old School Legend '94", handle: "@OldHeadLegend94", badge: "🦖 Ex-Leggenda", badgeEn: "🦖 Old Head", verified: true, avatar: "🦖" },
    { name: "Parquet Troll", handle: "@HoopsTroll_X", badge: "🤡 Troll", badgeEn: "🤡 Troll", verified: false, avatar: "🤡" },
  ],
  teammate: [
    { name: "Capitano Spogliatoio", nameEn: "Locker Room Captain", handle: "@TheCaptain_Real", badge: "🤝 Compagno", badgeEn: "🤝 Teammate", verified: true, avatar: "🫡" },
    { name: "Fratello di Parquet", nameEn: "Backcourt Bro", handle: "@BackcourtBro", badge: "🏀 Compagno", badgeEn: "🏀 Teammate", verified: true, avatar: "🤜" },
  ],
};
if (typeof i18nify === "function") i18nify(SOCIAL_ACCOUNTS);

/* Restituisce un account rivale (giocatore avversario o tifoseria rivale) del campionato attuale */
function pickRivalSocialAccount(p, seed) {
  const lg = p && p.league && typeof LEAGUES !== "undefined" ? LEAGUES[p.league] : null;
  const teams = lg && Array.isArray(lg.teams) ? lg.teams.filter(t => !p.team || t.name !== p.team.name) : [];
  const rivalTeam = teams.length ? socialPick(teams, seed + ":rt") : { name: "Rival Club", city: "City" };
  const clean = (rivalTeam.name || "Rival").replace(/[^a-zA-Z0-9]/g, "").slice(0, 11);
  const isPlayerRival = (socialHash(seed + ":kind") % 2) === 0;
  if (isPlayerRival) {
    const rivalNames = ["M. Vukovic", "D. Jackson", "L. Bellini", "K. Dorsey", "T. Kalaitzakis", "J. Montero", "A. Diallo", "R. Langford"];
    const rName = socialPick(rivalNames, seed + ":rn");
    return {
      teamName: rivalTeam.name,
      isPlayer: true,
      name: `${rName} (${rivalTeam.name})`,
      handle: `@${rName.replace(/[^a-zA-Z]/g, "")}_${clean.slice(0, 6)}`,
      badge: isEn() ? "⚔️ Rival Player" : "⚔️ Avversario",
      verified: true,
      avatar: "😤",
    };
  }
  return {
    teamName: rivalTeam.name,
    isPlayer: false,
    name: isEn() ? `${rivalTeam.name} Ultras` : `Curva ${rivalTeam.name}`,
    handle: `@Ultras_${clean}`,
    badge: isEn() ? "⚔️ Rival Fans" : "⚔️ Tifosi Rivali",
    verified: false,
    avatar: "⚔️",
  };
}

/* Azioni di pubblicazione del giocatore (1 per step stagionale) */
const SOCIAL_POST_ACTIONS = [
  {
    id: "grind",
    icon: "🏋️",
    label: "Grind in palestra", labelEn: "Gym Grind",
    sub: "Coach +3 · Rep +2 · Follower +", subEn: "Coach +3 · Rep +2 · Followers +",
    desc: "Mostra la sessione extra di tiro a luci spente nel palazzetto.",
    descEn: "Show off an extra late-night shooting session in the arena with the lights dimmed.",
    effects: { coachTrust: 3, reputation: 2, followerPct: 0.03 },
    buildText: p => isEn()
      ? `Lights out at the arena in ${p.team.city}, but the work never stops. Head down and another 500 makes for ${p.team.name}. 💪🏀 #Grind #NoDaysOff #F3NOM`
      : `Luci spente al palazzetto di ${p.team.city}, ma il lavoro non finisce mai. Testa bassa e altri 500 tiri a segno per ${p.team.name}. 💪🏀 #Grind #NoDaysOff #F3NOM`,
    comments: p => isEn() ? [
      { author: "Strength Coach", handle: "@CoachStaff", text: "Always the first to arrive and the last to leave. Winner's mentality! 👏🔥" },
      { author: `${p.team.name} Ultras`, handle: `@Ultras_${p.team.name.replace(/[^a-zA-Z]/g, "").slice(0, 10)}`, text: "That's why we love you! Sweat for the jersey! ❤️💪" },
    ] : [
      { author: "Preparatore Atletico", handle: "@CoachStaff", text: "Sempre il primo ad arrivare e l'ultimo ad andare via. Mentalità da vincente! 👏🔥" },
      { author: `Tifosi ${p.team.name}`, handle: `@Ultras_${p.team.name.replace(/[^a-zA-Z]/g, "").slice(0, 10)}`, text: "Ecco perché ti amiamo! Sudore e maglia! ❤️💪" },
    ],
  },
  {
    id: "team",
    icon: "🤝",
    label: "Spogliatoio & Squadra", labelEn: "Locker Room & Team",
    sub: "Chimica +4 · Stella +3 · Morale +2", subEn: "Chemistry +4 · Star +3 · Morale +2",
    desc: "Pubblica una foto di gruppo coi compagni per blindare lo spogliatoio.",
    descEn: "Post a group photo with your teammates to unite the locker room.",
    effects: { chemistry: 4, starRapport: 3, morale: 2, followerPct: 0.035 },
    buildText: p => isEn()
      ? `This group has something special. Going to battle until the final buzzer with my brothers at ${p.team.name}! 🤜🤛🔥 #Family #OneTeam`
      : `Questo gruppo ha qualcosa di speciale. In battaglia insieme fino all'ultimo secondo con i miei fratelli di ${p.team.name}! 🤜🤛🔥 #Famiglia #OneTeam`,
    comments: p => isEn() ? [
      { author: "Locker Room Leader", handle: "@StarTeammate", text: "All the way bro! This year we're taking everything 🐐🔥" },
      { author: "Sixth Man Club", handle: "@SestoUomo", text: "United locker room = guaranteed wins! Let's go boys 🙌" },
    ] : [
      { author: "Leader Spogliatoio", handle: "@StarTeammate", text: "Fino alla fine fratello! Quest'anno ci prendiamo tutto 🐐🔥" },
      { author: "Sesto Uomo", handle: "@SestoUomo", text: "Spogliatoio unito = vittorie assicurate! Grandi ragazzi 🙌" },
    ],
  },
  {
    id: "fans",
    icon: "📣",
    label: "Dedica ai Tifosi", labelEn: "Shoutout to the Fans",
    sub: "Popolarità +4 · Morale +3 · Follower ++", subEn: "Popularity +4 · Morale +3 · Followers ++",
    desc: "Ringrazia il pubblico e carica l'ambiente in vista delle prossime gare.",
    descEn: "Thank the crowd and hype up the city ahead of the upcoming games.",
    effects: { popularity: 4, morale: 3, followerPct: 0.055 },
    buildText: p => isEn()
      ? `The energy in ${p.team.city} when we step onto the court is unmatched. We play every possession for you: let's pack the arena! ❤️🏟️ #${p.team.name.replace(/\s+/g, "")}`
      : `L'energia di ${p.team.city} quando entriamo sul parquet non ha eguali. Giochiamo ogni possesso per voi: riempiamo il palazzetto! ❤️🏟️ #${p.team.name.replace(/\s+/g, "")}`,
    comments: p => isEn() ? [
      { author: `${p.team.city} Ultras`, handle: `@Curva_${p.team.city.replace(/[^a-zA-Z]/g, "").slice(0, 10)}`, text: "Saturday is going to be a madhouse! You bring the buckets, we bring the noise! 🔥📣" },
      { author: "Hoops Central", handle: "@HoopsCentral", text: `Total love affair between ${p.firstName} ${p.lastName} and the city of ${p.team.city}. ✨` },
    ] : [
      { author: `Curva ${p.team.city}`, handle: `@Curva_${p.team.city.replace(/[^a-zA-Z]/g, "").slice(0, 10)}`, text: "Sabato saremo una bolgia! Tu mettici i canestri, noi la voce! 🔥📣" },
      { author: "Hoops Central", handle: "@HoopsCentral", text: `Amore totale tra ${p.firstName} ${p.lastName} e la piazza di ${p.team.city}. ✨` },
    ],
  },
  {
    id: "flex",
    icon: "💎",
    label: "Lifestyle & Sponsor", labelEn: "Lifestyle & Sponsors",
    sub: "Incasso $$ · Popolarità +3 · Follower ++ · Coach −1", subEn: "Payout $$ · Popularity +3 · Followers ++ · Coach −1",
    desc: "Post patinato con sponsor e stile di vita fuori dal campo: monetizza i tuoi follower.",
    descEn: "Glossy post featuring sponsors and off-court lifestyle: monetize your following.",
    effects: { popularity: 3, coachTrust: -1, followerPct: 0.065, sponsorPayout: true },
    buildText: p => {
      const owned = (p.lifestyle || []);
      const lastEntry = owned.length ? owned[owned.length - 1] : null;
      const lastId = lastEntry && (lastEntry.id || lastEntry);
      const luxItem = lastId && typeof LIFESTYLE_ITEMS !== "undefined"
        ? LIFESTYLE_ITEMS.find(x => x.id === lastId)
        : null;
      const luxTitle = luxItem ? (luxItem.title || luxItem.name || "").toLowerCase() : "";
      if (isEn()) {
        const luxText = luxItem ? `Chill day enjoying my ${luxTitle} ${luxItem.icon}. ` : "Style on and off the hardwood. ";
        return `${luxText}Shoutout to the partners who believe in the journey. ✨💎 #Ad #Lifestyle #F3NOM #Blessed`;
      }
      const luxText = luxItem ? `Giornata di relax godendomi: ${luxTitle} ${luxItem.icon}. ` : "Stile dentro e fuori dal parquet. ";
      return `${luxText}Grazie ai partner che credono nel viaggio. ✨💎 #Ad #Lifestyle #F3NOM #Blessed`;
    },
    comments: p => isEn() ? [
      { author: "Sneaker & Drip", handle: "@HoopsDrip", text: "Unreal off-court drip 🥶💎 10/10!" },
      { author: "Armchair Coach", handle: "@ArmchairCoach", text: "Looks nice, let's just hope he remembers to play defense tomorrow night... 👀" },
    ] : [
      { author: "Sneaker & Drip", handle: "@HoopsDrip", text: "Drip clamoroso fuori dal campo 🥶💎 10/10!" },
      { author: "Coach da Divano", handle: "@ArmchairCoach", text: "Tutto bello, ma speriamo che pensi anche alla difesa domani sera... 👀" },
    ],
  },
  {
    id: "cryptic",
    icon: "🌶️",
    label: "Post Criptico / Provocazione", labelEn: "Cryptic Post / Provocation",
    sub: "Boom Virale +++ · Pop +5 · Morale +3 · Coach −3 · Rep −2", subEn: "Viral Boom +++ · Pop +5 · Morale +3 · Coach −3 · Rep −2",
    desc: "Lancia un messaggio enigmatico che fa impazzire tifosi e giornalisti di mercato.",
    descEn: "Drop an enigmatic message that sends fans and trade insiders into a frenzy.",
    effects: { popularity: 5, morale: 3, coachTrust: -3, reputation: -2, followerPct: 0.11 },
    buildText: () => isEn()
      ? `⏳👀 Some silences make more noise than a thousand words. Soon only the court will speak... if you know, you know. 🤫🔥 #StayTuned`
      : `⏳👀 Certi silenzi fanno più rumore di mille parole. Presto parlerà solo il parquet... chi sa, sa. 🤫🔥 #StayTuned`,
    comments: p => isEn() ? [
      { author: "EuroBasket Insider", handle: "@EuroHoopsIn", text: `👀 Coded message from ${p.lastName}? Rival clubs are monitoring the situation...` },
      { author: "Brick Watcher", handle: "@BrickWatcher_", text: "Fewer riddles on social media and more made threes, please! 🍿😂" },
    ] : [
      { author: "EuroBasket Insider", handle: "@EuroHoopsIn", text: `👀 Messaggio in codice di ${p.lastName}? Le rivali monitorano la situazione...` },
      { author: "Brick Watcher", handle: "@BrickWatcher_", text: "Meno enigmi sui social e più triple a bersaglio, grazie! 🍿😂" },
    ],
  },
];
if (typeof i18nify === "function") i18nify(SOCIAL_POST_ACTIONS);

/* Opzioni di risposta del giocatore ai post di giornalisti, tifosi e critici */
const SOCIAL_REPLY_OPTIONS = [
  {
    id: "classy",
    icon: "👏",
    label: "Con classe", labelEn: "Classy",
    tag: "Rep +1 · Chimica +1", tagEn: "Rep +1 · Chemistry +1",
    effects: { reputation: 1, chemistry: 1, followerPct: 0.015 },
    buildReply: p => isEn()
      ? `Appreciate the support and feedback: we're just focused on working every day for ${p.team.name}. 🙏🏀`
      : `Apprezzo il supporto e le osservazioni: pensiamo solo a lavorare ogni giorno per ${p.team.name}. 🙏🏀`,
  },
  {
    id: "hype",
    icon: "🔥",
    label: "Gasati", labelEn: "Get Hyped",
    tag: "Morale +2 · Pop +1", tagEn: "Morale +2 · Pop +1",
    effects: { morale: 2, popularity: 1, followerPct: 0.025 },
    buildReply: () => isEn()
      ? `And you haven't seen anything yet! The best is yet to come 🔥🚀`
      : `E non avete ancora visto niente! Il meglio deve ancora venire 🔥🚀`,
  },
  {
    id: "clapback",
    icon: "🍿",
    label: "Zittisci (Ratio)", labelEn: "Clapback (Ratio)",
    tag: "Pop +4 · Morale +3 · Rep ±", tagEn: "Pop +4 · Morale +3 · Rep ±",
    effects: { popularity: 4, morale: 3, followerPct: 0.05 },
    buildReply: p => isEn()
      ? `Keep talking from the couch, I answer with numbers on the court (${p.overall} OVR). See you at the arena! 🤫📈`
      : `Continuate pure a parlare dal divano, io rispondo coi numeri sul parquet (${p.overall} OVR). Ci vediamo al palazzetto! 🤫📈`,
  },
  {
    id: "team",
    icon: "🤝",
    label: "Merito al gruppo", labelEn: "Credit the Team",
    tag: "Chimica +2 · Coach +1", tagEn: "Chemistry +2 · Coach +1",
    effects: { chemistry: 2, coachTrust: 1, followerPct: 0.015 },
    buildReply: () => isEn()
      ? `All credit goes to my teammates and coaching staff: without them I wouldn't be anything. 🤜🤛`
      : `Merito dei miei compagni e dello staff tecnico: senza di loro non sarei nulla. 🤜🤛`,
  },
];
if (typeof i18nify === "function") i18nify(SOCIAL_REPLY_OPTIONS);

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
  if (pop >= 72 && rep >= 62) return { icon: "🔥", label: isEn() ? "Fan Favorite" : "Idolo della Curva", tone: "gold", desc: isEn() ? "Fans adore you and the media praises every play you make." : "I tifosi stravedono per te e i media esaltano ogni tua giocata." };
  if (pop >= 68 && rep < 46) return { icon: "⚡", label: isEn() ? "Polarizing Superstar" : "Superstar Divisiva", tone: "blue", desc: isEn() ? "You spark endless debate: half the crowd loves you, the other half attacks you." : "Fai discutere tantissimo: metà pubblico ti adora, l'altra metà ti attacca." };
  if (rep >= 70 && trust >= 65) return { icon: "🫡", label: isEn() ? "Model Professional" : "Professionista Esemplare", tone: "green", desc: isEn() ? "Insiders, coaches, and teammates hold you up as a role model." : "Addetti ai lavori, coach e compagni ti portano come modello." };
  if ((p.morale || 50) < 40 || rep < 38) return { icon: "🌧️", label: isEn() ? "Under Fire" : "Nel Mirino della Critica", tone: "red", desc: isEn() ? "High pressure on social media: you need to respond on the court." : "Pressione alta sui social: serve una risposta sul campo." };
  return { icon: "📈", label: isEn() ? "In the Spotlight" : "Sotto i Riflettori", tone: "blue", desc: isEn() ? "Your name is buzzing more and more among fans and insiders." : "Il tuo nome circola sempre di più tra appassionati e addetti ai lavori." };
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

function ensurePodcastState(p) {
  if (!p) return null;
  if (!p.podcast) {
    p.podcast = {
      active: false,
      name: "",
      episodes: 0,
      listeners: 0,
      totalEarnings: 0,
      lastEpisodeStepKey: null,
    };
  }
  return p.podcast;
}

const PODCAST_FORMATS = [
  {
    id: "tactical",
    icon: "📋",
    name: "Film Session & Tattica",
    nameEn: "Film Session & Tactics",
    desc: "Analisi tecnica delle ultime gare, schemi del coach e letture difensive dal campo.",
    descEn: "Deep film breakdown of recent games, coach's system and on-court defensive reads.",
    tags: ["Coach +3", "BBQ IQ +2", "Ascoltatori +"],
    tagsEn: ["Coach +3", "BBQ IQ +2", "Listeners +"],
    effects: { coachTrust: 3, chemistry: 1, playmaking: 1, listenerGain: 0.10 },
    buildPost: (p, showName) => isEn()
      ? `🎙️ NEW EPISODE OF "${showName}": “Film Session Breakdown — How we broke the 2-3 zone in the 4th quarter.” Available now on CourtX Audio! 🎧🏀 #BasketballIQ #HoopsPodcast`
      : `🎙️ NUOVO EPISODIO DI "${showName}": «Lavagna Tattica — Come abbiamo scardinato la difesa a zona nel 4° quarto.» Fuori ora su CourtX Audio! 🎧🏀 #BasketballIQ #HoopsPodcast`,
    comments: p => isEn() ? [
      { author: "Advanced Stats Nerd", handle: "@TrueShootingPct", text: "Finally an active player who talks real scheme and spacing, not just empty cliches! 👏📊" },
      { author: "Hardwood Gazette", handle: "@GazzettaParquet", text: "Terrific tactical maturity from the locker room. Essential listening." },
    ] : [
      { author: "Coach da Divano", handle: "@ArmchairCoach", text: "Finalmente un giocatore che spiega i veri schemi e le spaziature senza frasi fatte! 👏📊" },
      { author: "La Gazzetta del Parquet", handle: "@GazzettaParquet", text: "Grande maturità tattica espressa al microfono. Puntata da manuale." },
    ],
  },
  {
    id: "lockerRoom",
    icon: "🔒",
    name: "Dietro le Quinte dello Spogliatoio",
    nameEn: "Inside the Locker Room",
    desc: "Aneddoti inediti sui compagni, scherzi nei viaggi in trasferta e vita di squadra.",
    descEn: "Untold teammate stories, road trip banter and behind-the-scenes culture.",
    tags: ["Chimica +4", "Morale +3", "Ascoltatori ++"],
    tagsEn: ["Chemistry +4", "Morale +3", "Listeners ++"],
    effects: { chemistry: 4, morale: 3, popularity: 2, listenerGain: 0.18 },
    buildPost: (p, showName) => isEn()
      ? `🎙️ NEW EPISODE OF "${showName}": “Road Trip Secrets & Pranks — Who really runs the locker room aux cord? 😂🎧” Listen now! #LockerRoomChronicles`
      : `🎙️ NUOVO EPISODIO DI "${showName}": «Retroscena da Trasferta — Chi controlla la musica nello spogliatoio e gli scherzi in hotel! 😂🎧» Fuori ora! #SpogliatoioLife`,
    comments: p => isEn() ? [
      { author: "Backcourt Bro", handle: "@BackcourtBro", text: "BRO you swore you wouldn't tell the hotel room story on the mic!! Dead 💀😂😂" },
      { author: "Sixth Man Club", handle: "@SestoUomo_Official", text: "The chemistry in this squad is off the charts right now! Love this group 🔥" },
    ] : [
      { author: "Fratello di Parquet", handle: "@BackcourtBro", text: "FRATELLO avevi giurato che la storia dell'hotel restava tra noi!! Morto dal ridere comunque 💀😂😂" },
      { author: "Sesto Uomo", handle: "@SestoUomo_Official", text: "Che chimica pazzesca in questo gruppo, si vede che siete una vera famiglia! 🔥" },
    ],
  },
  {
    id: "legend",
    icon: "👑",
    name: "Ospite Speciale: Vecchia Gloria",
    nameEn: "Special Guest: Hoops Legend",
    desc: "Intervista approfondita con un ex-campione o figura storica della pallacanestro.",
    descEn: "In-depth interview with an iconic former champion or hoops legend.",
    tags: ["Popolarità +4", "Reputazione +3", "Ascoltatori +++"],
    tagsEn: ["Popularity +4", "Reputation +3", "Listeners +++"],
    effects: { popularity: 4, reputation: 3, morale: 2, listenerGain: 0.25 },
    buildPost: (p, showName) => isEn()
      ? `🎙️ SPECIAL EPISODE OF "${showName}": “Talking championship mindset, old-school trash talk and modern hoops with an all-time legend.” Legendary convo! 👑🔥`
      : `🎙️ PUNTATA SPECIALE DI "${showName}": «A tu per tu con una leggenda: mentalità vincente, trash talking d'altri tempi e l'evoluzione del basket.» Epico! 👑🔥`,
    comments: p => isEn() ? [
      { author: "CourtSide Report", handle: "@CourtSideRep", text: "Masterclass in interviewing. A must-listen for anyone who loves basketball history! 📻⭐" },
      { author: "Hoops Lover 99", handle: "@HoopsLover99", text: "Chills hearing those old Finals stories. Incredible work host! 🙌" },
    ] : [
      { author: "CourtSide Report", handle: "@CourtSideRep", text: "Una vera masterclass al microfono. Intervista che entra nella storia dei podcast sportivi! 📻⭐" },
      { author: "Hoops Lover 99", handle: "@HoopsLover99", text: "Pelle d'oca a sentire quei retroscena sulle finali scudetto. Grandissima puntata! 🙌" },
    ],
  },
  {
    id: "spicy",
    icon: "🌶️",
    name: "Hot Takes & Frecciate ai Rivali",
    nameEn: "Hot Takes & Rival Shots",
    desc: "Opinioni senza peli sulla lingua, arbitri, pronostici e stoccate ai rivali.",
    descEn: "Unfiltered takes, ref discussions, bold predictions and shots fired at rivals.",
    tags: ["Popolarità +6", "Coach −2", "Sponsor $$$", "Boom Virale 🔥"],
    tagsEn: ["Popularity +6", "Coach −2", "Audio Sponsor $$$", "Viral Surge 🔥"],
    effects: { popularity: 6, coachTrust: -2, chemistry: -1, listenerGain: 0.38, viral: true },
    buildPost: (p, showName) => isEn()
      ? `🌶️ UNFILTERED EPISODE OF "${showName}": “They called themselves title favorites? Let them come to our arena and prove it. Zero fear.” 💥👀 Mic dropped!`
      : `🌶️ PUNTATA SENZA FILTRI DI "${showName}": «Si sono autoproclamati favoriti per il titolo? Che vengano al nostro palazzetto a dimostrarlo. Zero paura.» 💥👀 Fuoco alle polveri!`,
    comments: (p, rival) => isEn() ? [
      { author: (rival && rival.name) || "Rival Star", handle: (rival && rival.handle) || "@RivalStar", text: "Keep talking on your little podcast. We'll answer on the scoreboard next game. 🤫🔒" },
      { author: "Hot Take Studio TV", handle: "@HotTakeStudioTV", text: "SHOTS FIRED! This rivalry just reached boiling point! 🌶️📺🍿" },
    ] : [
      { author: (rival && rival.name) || "Stella Rivale", handle: (rival && rival.handle) || "@StellaRivale", text: "Continua a parlare al microfono. Noi ti risponderemo sul tabellone la prossima volta. 🤫🔒" },
      { author: "Hot Take Studio TV", handle: "@HotTakeStudioTV", text: "DICHIARAZIONI PESANTISSIME! La rivalità è appena esplosa, preparate i popcorn! 🌶️📺🍿" },
    ],
  },
];

function podcastEpisodePayout(p) {
  if (!p || !p.podcast || !p.podcast.active) return 0.005;
  const listeners = p.podcast.listeners || 1500;
  const mult = p.league === "NBA" ? 1.4 : 1.0;
  const raw = Math.max(0.01, (listeners / 100000) * 0.05 * mult);
  return roundMoney(Math.min(0.35, raw));
}

function canRecordPodcastEpisode(p) {
  if (!p) return false;
  ensurePodcastState(p);
  return p.podcast.active && p.podcast.lastEpisodeStepKey !== socialCurrentStepKey(p);
}

function launchPlayerPodcast(customName) {
  if (!player) return;
  ensurePodcastState(player);
  const defName = player.lastName ? `The ${player.lastName} Show` : "CourtSide Uncut";
  player.podcast.active = true;
  player.podcast.name = (customName && customName.trim()) ? customName.trim() : defName;
  player.podcast.episodes = 0;
  const baseF = socialFollowersCount(player);
  player.podcast.listeners = Math.max(1200, Math.round(baseF * 0.12));
  player.podcast.totalEarnings = 0;
  player.podcast.lastEpisodeStepKey = null;

  createSocialPost(player, {
    kind: "player",
    when: isEn() ? `Launch · Season ${player.year}` : `Lancio · Stagione ${player.year}`,
    author: `${player.firstName} ${player.lastName}`,
    handle: playerSocialHandle(player),
    badge: isEn() ? "🎙️ Host" : "🎙️ Conduttore",
    verified: isPlayerSocialVerified(player),
    avatar: "🎙️",
    viral: true,
    text: isEn()
      ? `🎙️ EXCLUSIVE ANNOUNCEMENT: I'm officially launching my podcast, "${player.podcast.name}"! Unfiltered hoops, locker room life, and legendary guests. Subscribe on CourtX Audio! 🎧🏀 #NewPod #AthleteLed`
      : `🎙️ ANNUNCIO UFFICIALE: Lancio il mio podcast personale, "${player.podcast.name}"! Basket senza filtri, vita di spogliatoio e ospiti d'onore. Disponibile ora su CourtX Audio! 🎧🏀 #NuovoPodcast #F3NOM`,
    tag: isEn() ? "Podcast Launch" : "Lancio Podcast",
    comments: [
      { author: "CourtSide Report", handle: "@CourtSideRep", text: isEn() ? "Can't wait to see what kind of stories you drop on the mic!" : "Non vediamo l'ora di ascoltare i primi aneddoti dietro le quinte!" },
      { author: "Sixth Man Club", handle: "@SestoUomo_Official", text: isEn() ? "Subscribed instantly! Bring your teammates on ep 1! 🔥" : "Iscritto al volo! Porta subito i tuoi compagni di squadra nel primo episodio! 🔥" },
    ],
  });

  toast(isEn() ? `🎙️ Podcast "${player.podcast.name}" launched!` : `🎙️ Podcast "${player.podcast.name}" lanciato con successo!`);
  renderGameScreen();
}

function recordPodcastEpisode(formatId) {
  if (!player) return;
  ensurePodcastState(player);
  if (!canRecordPodcastEpisode(player)) {
    toast(isEn() ? "⏳ You already recorded an episode in this stretch of the season!" : "⏳ Hai già registrato un episodio in questo blocco di stagione!");
    return;
  }
  const fmt = PODCAST_FORMATS.find(f => f.id === formatId) || PODCAST_FORMATS[0];
  const e = fmt.effects || {};

  const curL = player.podcast.listeners || 1500;
  const popFactor = (player.popularity || 40) / 100;
  const gain = Math.max(800, Math.round(curL * (e.listenerGain || 0.12) + (popFactor * 2500)));
  player.podcast.listeners = curL + gain;
  player.podcast.episodes = (player.podcast.episodes || 0) + 1;

  player.social.bonusFollowers = (player.social.bonusFollowers || 0) + Math.round(gain * 0.35);

  let payout = podcastEpisodePayout(player);
  if (fmt.id === "spicy") payout = roundMoney(payout * 1.5);
  player.wealth = roundMoney((player.wealth || 0) + payout);
  player.podcast.totalEarnings = roundMoney((player.podcast.totalEarnings || 0) + payout);

  if (e.popularity) player.popularity = clamp((player.popularity || 50) + e.popularity, 0, 100);
  if (e.morale) player.morale = clamp((player.morale || 50) + e.morale, 0, 100);
  if (e.chemistry) player.chemistry = clamp((player.chemistry || 50) + e.chemistry, 0, 100);
  if (e.reputation && typeof changeReputation === "function") changeReputation(player, e.reputation);
  if (e.coachTrust && typeof changeCoachTrust === "function") changeCoachTrust(player, e.coachTrust);

  player.podcast.lastEpisodeStepKey = socialCurrentStepKey(player);

  const rivalAcc = pickRivalSocialAccount(player, `${player.year}:${player.podcast.episodes}:rival`);
  const commentsList = typeof fmt.comments === "function" ? fmt.comments(player, rivalAcc) : [];

  createSocialPost(player, {
    kind: "player",
    when: isEn() ? `Episode #${player.podcast.episodes} · ${player.year}` : `Puntata #${player.podcast.episodes} · ${player.year}`,
    author: `${player.firstName} ${player.lastName}`,
    handle: playerSocialHandle(player),
    badge: isEn() ? "🎙️ Podcast" : "🎙️ Podcast",
    verified: isPlayerSocialVerified(player),
    avatar: "🎙️",
    viral: !!e.viral,
    text: fmt.buildPost(player, player.podcast.name),
    tag: isEn() ? fmt.nameEn : fmt.name,
    comments: commentsList,
  });

  const cur = playerCurrency(player);
  toast(isEn()
    ? `🎙️ Episode #${player.podcast.episodes} published! (+${fmtFollowers(gain)} listeners · +${fmtMoney(payout, cur)} audio sponsor)`
    : `🎙️ Puntata #${player.podcast.episodes} pubblicata! (+${fmtFollowers(gain)} ascoltatori · +${fmtMoney(payout, cur)} sponsor audio)`);
  renderGameScreen();
}

function openLaunchPodcastModal() {
  if (!player) return;
  const def1 = player.lastName ? `The ${player.lastName} Show` : "The Fastbreak Show";
  const def2 = `Mic'd Up con ${player.firstName || "Player"}`;
  const def3 = `Parquet & Hard Talk`;
  const def4 = `${player.team && player.team.city ? player.team.city : "Hoops"} All-Access`;

  renderEventModal({
    tone: "live",
    tag: tr("CourtX Media Studio · Nuovo Progetto", "CourtX Media Studio · New Project"),
    meta: tr("Atleta-Podcaster", "Athlete-Podcaster"),
    icon: "🎙️",
    title: tr("Lancia il tuo Podcast Personale", "Launch Your Personal Podcast"),
    text: tr(
      `Crea il tuo show audio personale direttamente su CourtX! Conduci puntate esclusive una volta per blocco di stagione: analizza schemi del coach, racconta retroscena di spogliatoio, invita ex-leggende o lancia frecciate ai rivali per generare ascolti record e ricavi da sponsor audio.`,
      `Launch your personal audio show right inside CourtX! Host exclusive episodes once per season block: break down coach schemes, share locker room secrets, interview legends, or fire shots at rivals to generate record listeners and audio sponsor cash.`
    ),
    options: [
      { id: def1, icon: "⭐", label: def1, desc: tr("Format principale con il tuo nome da superstar.", "Flagship show carrying your superstar name."), primary: true },
      { id: def2, icon: "🎤", label: def2, desc: tr("Atmosfera rilassata, microfono aperto e conversazioni intime.", "Casual, open-mic intimate hoops talk.") },
      { id: def3, icon: "🏀", label: def3, desc: tr("Basket duro, opinioni forti e focus sul parquet.", "Hardcore hoops, bold takes and pure hardwood focus.") },
      { id: def4, icon: "🏟️", label: def4, desc: tr("Dietro le quinte e cultura cestistica cittadina.", "Behind the scenes and city hoops culture.") },
    ],
    footHtml: `
      <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--line);display:flex;gap:8px;align-items:center;">
        <input type="text" id="custom-podcast-name-input" class="probe-select" placeholder="${tr("Oppure inserisci un titolo personalizzato...", "Or enter custom title...")}" style="flex:1" maxlength="40">
        <button type="button" class="btn btn-primary" id="btn-confirm-custom-podcast">${tr("Crea", "Create")}</button>
      </div>`,
    onSelect: name => launchPlayerPodcast(name),
  });

  const customBtn = el("btn-confirm-custom-podcast");
  const customInp = el("custom-podcast-name-input");
  if (customBtn && customInp) {
    customBtn.addEventListener("click", () => {
      const val = customInp.value && customInp.value.trim();
      if (val) {
        hideEventModal();
        launchPlayerPodcast(val);
      }
    });
  }
}

function openRenamePodcastModal() {
  if (!player || !player.podcast) return;
  const current = player.podcast.name || "";
  renderEventModal({
    tone: "live",
    tag: tr("Studio Podcasting", "Podcasting Studio"),
    meta: tr("Gestione Show", "Show Management"),
    icon: "✏️",
    title: tr("Rinomina il tuo Podcast", "Rename Your Podcast"),
    text: tr(`Il nome attuale è «${current}». Inserisci il nuovo titolo dello show:`, `Current show title is "${current}". Enter the new name for your show:`),
    options: [],
    footHtml: `
      <div style="display:flex;gap:8px;align-items:center;margin-top:10px;">
        <input type="text" id="rename-podcast-input" class="probe-select" value="${current}" maxlength="40" style="flex:1">
        <button type="button" class="btn btn-primary" id="btn-save-podcast-name">${tr("Salva", "Save")}</button>
      </div>`,
    onSelect: () => {},
  });
  const saveBtn = el("btn-save-podcast-name");
  const inp = el("rename-podcast-input");
  if (saveBtn && inp) {
    saveBtn.addEventListener("click", () => {
      const val = inp.value && inp.value.trim();
      if (val) {
        player.podcast.name = val;
        hideEventModal();
        toast(tr(`✏️ Podcast rinominato in "${val}"!`, `✏️ Podcast renamed to "${val}"!`));
        renderGameScreen();
      }
    });
  }
}

function ensureSocialState(p) {
  if (!p) return null;
  ensurePodcastState(p);
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
    when: opts.when || (isEn() ? `Season ${p.year}` : `Stagione ${p.year}`),
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
  const rivalAcc = pickRivalSocialAccount(p, `${p.firstName}:initRival`);
  const criticAcc = socialPick(SOCIAL_ACCOUNTS.critic, `${p.lastName}:initCritic`);

  if (p.scenario && p.scenario.id === "mrIrrelevant") {
    createSocialPost(p, {
      kind: "critic",
      when: `Post-Draft ${p.year}`,
      author: "Draft Insider USA",
      handle: "@DraftInsiderUSA",
      badge: "📊 Mock Draft",
      verified: true,
      avatar: "🎙️",
      text: isEn()
        ? `With the 60th and final pick, the ${p.team.name} select ${p.firstName} ${p.lastName}. Classic roster-filler pick: will he even survive training camp before getting waived? 🤔`
        : `Con la 60ª e ultima chiamata i ${p.team.name} scelgono ${p.firstName} ${p.lastName}. Classica chiamata per riempire il tabellone: riuscirà a superare il training camp prima di essere tagliato? 🤔`,
    });
    createSocialPost(p, {
      kind: "fan",
      when: `Training Camp ${p.year}`,
      author: isEn() ? `${p.team.name} Ultras` : `Ultras ${p.team.name}`,
      handle: `@Tifosi_${p.team.name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10)}`,
      badge: isEn() ? "📣 Fans" : "📣 Tifosi",
      verified: false,
      avatar: "🏀",
      text: isEn()
        ? `Welcome ${p.firstName}! You'll have to earn jersey #${p.jerseyNumber != null ? p.jerseyNumber : 23} from minute one. Keep your head down and prove everyone wrong! 💪🔥`
        : `Benvenuto ${p.firstName}! La maglia #${p.jerseyNumber != null ? p.jerseyNumber : 23} dovrai sudarla dal primo minuto. Testa bassa e zittisci tutti! 💪🔥`,
    });
    p.social.unread = 2;
    return;
  }
  if (p.scenario && p.scenario.id === "oneClubMan") {
    createSocialPost(p, {
      kind: "fan",
      when: isEn() ? `Start of ${p.year}` : `Inizio ${p.year}`,
      author: isEn() ? `${p.team.name} Diehards` : `Fedelissimi ${p.team.name}`,
      handle: `@Cuore_${p.team.name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10)}`,
      badge: isEn() ? "🛡️ Diehards" : "🛡️ Fedelissimi",
      verified: false,
      avatar: "⭐",
      text: isEn()
        ? `Today ${p.firstName} ${p.lastName}'s story in our jersey begins. We want players who love these colors: become our franchise icon! 🛡️❤️`
        : `Oggi inizia la storia di ${p.firstName} ${p.lastName} con la nostra maglia. Vogliamo giocatori che amino questi colori: diventa la nostra bandiera! 🛡️❤️`,
    });
    createSocialPost(p, {
      kind: "rival",
      when: isEn() ? `Preseason ${p.year}` : `Pre-stagione ${p.year}`,
      author: rivalAcc.name,
      handle: rivalAcc.handle,
      badge: rivalAcc.badge,
      verified: rivalAcc.verified,
      avatar: rivalAcc.avatar,
      text: isEn()
        ? `All this talk about ${p.lastName} becoming a "club legend" at ${p.team.name} before playing a single minute 😂 Wait until you face ${rivalAcc.teamName}! 🥱📉`
        : `Tutti a parlare di ${p.lastName} come "futura bandiera" di ${p.team.name} prima ancora di scendere in campo 😂 Aspettate di incrociare ${rivalAcc.teamName}! 🥱📉`,
    });
    p.social.unread = 2;
    return;
  }
  if (isMinorItaLeague(p.league)) {
    createSocialPost(p, {
      kind: "fan",
      when: isEn() ? `Start of ${p.year}` : `Inizio ${p.year}`,
      author: isEn() ? `${p.team.city} Court Crew` : `Amici del Campetto ${p.team.city}`,
      handle: `@Campetto_${p.team.city.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10)}`,
      badge: isEn() ? "🍻 Sports Bar" : "🍻 Bar dello Sport",
      verified: false,
      avatar: "🏀",
      text: isEn()
        ? `Everyone to the gym tonight to cheer for ${p.firstName} and ${p.team.name} in ${lgName}! Drop 20 and drinks are on us in the town square! 🍺🔥`
        : `Stasera tutti in palestra a fare il tifo per ${p.firstName} e la ${p.team.name} in ${lgName}! Se ne metti 20 birra pagata in piazza! 🍺🔥`,
    });
    createSocialPost(p, {
      kind: "rival",
      when: isEn() ? `Preseason ${p.year}` : `Pre-stagione ${p.year}`,
      author: rivalAcc.name,
      handle: rivalAcc.handle,
      badge: rivalAcc.badge,
      verified: rivalAcc.verified,
      avatar: rivalAcc.avatar,
      text: isEn()
        ? `They say ${p.team.name} signed the young prospect ${p.lastName}... In our gym in ${lgName} the paint is no place for kids. See you at the derby! 😤🔒`
        : `Dicono che ${p.team.name} abbia preso il giovane ${p.lastName}... Nel nostro palazzetto in ${lgName} non si regala niente ai ragazzini. Ci vediamo al derby! 😤🔒`,
    });
    p.social.unread = 2;
    return;
  }
  const mediaAcc = socialPick(SOCIAL_ACCOUNTS.media, `${p.firstName}:init1`);
  const fanAcc = socialPick(SOCIAL_ACCOUNTS.fan, `${p.lastName}:init2`);
  createSocialPost(p, {
    kind: "critic",
    when: isEn() ? `Preseason ${p.year}` : `Pre-stagione ${p.year}`,
    author: criticAcc.name,
    handle: criticAcc.handle,
    badge: criticAcc.badge,
    verified: criticAcc.verified,
    avatar: criticAcc.avatar,
    text: isEn()
      ? `Way too much hype around ${p.firstName} ${p.lastName} (${p.overall} OVR) joining ${p.team.name}. Let's see how he handles real ${lgName} defenses when the lights come on... 🧐📉`
      : `Troppo hype intorno a ${p.firstName} ${p.lastName} (${p.overall} OVR) a ${p.team.name}. Vedremo come reggerà l'urto contro le vere difese di ${lgName} quando conterà davvero... 🧐📉`,
    comments: [
      { author: rivalAcc.name, handle: rivalAcc.handle, text: isEn() ? `Against ${rivalAcc.teamName} he won't even score 10 points! 🔒😂` : `Contro ${rivalAcc.teamName} non arriva nemmeno in doppia cifra! 🔒😂` },
    ],
  });
  createSocialPost(p, {
    kind: "fan",
    when: isEn() ? `Start of ${p.year}` : `Inizio ${p.year}`,
    author: isEn() ? `${p.team.name} Ultras` : `Curva ${p.team.name}`,
    handle: `@Tifosi_${p.team.name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12)}`,
    badge: isEn() ? "📣 Fans" : "📣 Tifosi",
    verified: false,
    avatar: fanAcc.avatar,
    text: isEn()
      ? `Can't wait to see what ${p.firstName} ${p.lastName} (#${p.jerseyNumber != null ? p.jerseyNumber : 23}) will do in a ${p.team.name} jersey in ${lgName}! Make us dream! 🔥🏀`
      : `Curiosi di vedere cosa combinerà ${p.firstName} ${p.lastName} (#${p.jerseyNumber != null ? p.jerseyNumber : 23}) con la maglia di ${p.team.name} in ${lgName}! Facci sognare! 🔥🏀`,
  });
  createSocialPost(p, {
    kind: "media",
    when: isEn() ? `Preseason ${p.year}` : `Pre-stagione ${p.year}`,
    author: mediaAcc.name,
    handle: mediaAcc.handle,
    badge: mediaAcc.badge,
    verified: true,
    avatar: mediaAcc.avatar,
    text: isEn()
      ? `👀 Eyes on ${p.firstName} ${p.lastName} (${p.age} yo, OVR ${p.overall}): the adventure with ${p.team.name} in ${lgName} begins. How far can he go?`
      : `👀 Occhi puntati su ${p.firstName} ${p.lastName} (${p.age} anni, OVR ${p.overall}): inizia l'avventura con ${p.team.name} in ${lgName}. Fin dove potrà arrivare?`,
  });
  p.social.unread = 3;
}

/* Hook automatici sugli eventi della carriera */
function onSeasonBlockSocial(p, block) {
  if (!p || !block) return;
  ensureSocialState(p);
  const seed = `${p.year}:${block.id}:${block.wins}:${block.losses}`;
  const st = block.stats || { pts: 0, reb: 0, ast: 0 };
  const mediaAcc = socialPick(SOCIAL_ACCOUNTS.media, seed + ":m");
  const criticAcc = socialPick(SOCIAL_ACCOUNTS.critic, seed + ":c");
  const rivalAcc = pickRivalSocialAccount(p, seed + ":r");
  const fanAcc = socialPick(SOCIAL_ACCOUNTS.fan, seed + ":f");
  const handle = playerSocialHandle(p);

  if (block.keyGame) {
    const kg = block.keyGame;
    const kgFan = socialPick(SOCIAL_ACCOUNTS.fan, seed + ":kg");
    createSocialPost(p, {
      kind: kg.success ? "fan" : "critic",
      when: `${block.name} · ${p.year}`,
      author: kg.success ? (isEn() ? `${p.team.name} Ultras` : `Ultras ${p.team.name}`) : "Hardwood Critic",
      handle: kg.success ? `@Curva_${p.team.name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10)}` : "@HardwoodCritic",
      badge: kg.success ? (isEn() ? "📣 Fans" : "📣 Tifosi") : (isEn() ? "🧐 Critic" : "🧐 Critico"),
      verified: false,
      avatar: kg.success ? "🎯" : "💔",
      viral: true,
      text: kg.success
        ? (isEn()
          ? `🚨 CLUTCH! ${p.firstName} ${p.lastName} wins it at the buzzer against ${kg.opponent} (${kg.label})! Ice in his veins! 🥶🎯`
          : `🚨 CLUTCH! ${p.firstName} ${p.lastName} la decide all'ultimo respiro contro ${kg.opponent} (${kg.label})! Ghiaccio nelle vene! 🥶🎯`)
        : (isEn()
          ? `Final possession against ${kg.opponent} wasted by ${p.lastName}... When the game is on the line, you need much better composure. 😬📉`
          : `Ultimo possesso contro ${kg.opponent} sprecato da ${p.lastName}... Nei momenti che contano serve ben altra freddezza. 😬📉`),
      comments: [
        { author: kgFan.name, handle: kgFan.handle, text: kg.success ? (isEn() ? "Build the statue outside the arena right now!! 🔥" : "Statua subito fuori dal palazzetto!! 🔥") : (isEn() ? "Hurts to lose it like that at the final buzzer." : "Fa male perderla così all'ultimo secondo.") },
        { author: rivalAcc.name, handle: rivalAcc.handle, text: kg.success ? (isEn() ? "Lucky bounce on the rim, won't happen again in the playoffs! 🙄" : "Tiro della domenica, ai playoff non vi andrà così bene! 🙄") : (isEn() ? "Choked under pressure as usual! 🥶🧱" : "Tremavano le mani sull'ultimo tiro eh? 🥶🧱") },
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
      text: isEn()
        ? `📊 Solid numbers for ${p.firstName} ${p.lastName} in "${block.name}" with ${p.team.name}: ${st.pts} PTS, ${st.reb} REB, ${st.ast} AST per game (stretch record: ${block.wins}-${block.losses}). 🔥`
        : `📊 Numeri solidi per ${p.firstName} ${p.lastName} in "${block.name}" con ${p.team.name}: ${st.pts} PTS, ${st.reb} REB, ${st.ast} AST di media (record tratto: ${block.wins}-${block.losses}). 🔥`,
    });

    // Anche quando le cose vanno bene, hater, media polemici o avversari attaccano o provocano!
    const variant = socialHash(seed + ":spicy") % 4;
    if (variant === 0) {
      createSocialPost(p, {
        kind: "critic",
        when: `${block.name} · ${p.year}`,
        author: "Brick Watcher",
        handle: "@BrickWatcher_",
        badge: isEn() ? "🧌 Hater" : "🧌 Hater",
        verified: false,
        avatar: "🧱",
        text: isEn()
          ? `Nice box score for ${p.lastName} (${st.pts} PPG), but how many of those points came in garbage time? Classic regular-season stat-padder. Wake me up in the playoffs! 🗑️🍿`
          : `Bel tabellino per ${p.lastName} (${st.pts} PTS), ma quanti di questi punti sono arrivati a partita già finita? Classiche statistiche gonfiate, svegliatemi ai playoff! 🗑️🍿`,
        comments: [
          { author: fanAcc.name, handle: fanAcc.handle, text: isEn() ? `We're ${block.wins}-${block.losses}, keep crying! 😂` : `Intanto siamo ${block.wins}-${block.losses} in questo tratto, rosica pure! 😂` },
        ],
      });
    } else if (variant === 1) {
      createSocialPost(p, {
        kind: "rival",
        when: `${block.name} · ${p.year}`,
        author: rivalAcc.name,
        handle: rivalAcc.handle,
        badge: rivalAcc.badge,
        verified: rivalAcc.verified,
        avatar: rivalAcc.avatar,
        text: rivalAcc.isPlayer
          ? (isEn()
            ? `Enjoy the headlines ${handle}. Next time you face ${rivalAcc.teamName}, I'm picking you up full-court from tip-off. Let's see if you still drop ${st.pts}. 🔒😤`
            : `Goditi i titoli sui giornali ${handle}. La prossima volta che incroci ${rivalAcc.teamName} ti marco io a tutto campo dal primo minuto: vediamo se fai ancora ${st.pts} punti. 🔒😤`)
          : (isEn()
            ? `Everyone hyping ${p.team.name} (${block.wins}-${block.losses}), but they haven't played a real contender yet. In ${rivalAcc.teamName}'s arena ${p.lastName} won't breathe! ⚔️🔥`
            : `Tutti a esaltare ${p.team.name} (${block.wins}-${block.losses}), ma con un calendario così facile sono bravi tutti. Nel palazzetto di ${rivalAcc.teamName} per ${p.lastName} sarà notte fonda! ⚔️🔥`),
      });
    } else if (variant === 2) {
      createSocialPost(p, {
        kind: "critic",
        when: `${block.name} · ${p.year}`,
        author: isEn() ? "Old School Legend '94" : "Ex-Leggenda '94",
        handle: "@OldHeadLegend94",
        badge: isEn() ? "🦖 Old Head" : "🦖 Ex-Leggenda",
        verified: true,
        avatar: "🦖",
        text: isEn()
          ? `Today anyone averaging ${st.pts} PTS gets called a superstar. Back in the '90s with our physical defense, ${p.lastName} wouldn't have survived a single quarter in the paint! 🦖🏀`
          : `Oggi basta viaggiare a ${st.pts} punti di media per essere chiamati fenomeni. Negli anni '90, con le nostre difese fisiche, ${p.lastName} non avrebbe toccato palla in area! 🦖🏀`,
      });
    } else {
      createSocialPost(p, {
        kind: "critic",
        when: `${block.name} · ${p.year}`,
        author: "Hot Take Studio TV",
        handle: "@HotTakeStudioTV",
        badge: "🌶️ Hot Take TV",
        verified: true,
        avatar: "📺",
        text: isEn()
          ? `🔥 DEBATE ON #HotTakeTV: "Is ${p.firstName} ${p.lastName} truly a winning leader for ${p.team.name}, or just a flashy soloist?" Studio is split! 👇`
          : `🔥 DIBATTITO A #HotTakeTV: "${p.firstName} ${p.lastName} è davvero un leader vincente per ${p.team.name} o solo un solista innamorato del pallone?" Studio diviso! 👇`,
      });
    }
  } else {
    // Tratto negativo o sottotono: pioggia di critiche da media/hater e sfottò dei rivali
    createSocialPost(p, {
      kind: "critic",
      when: `${block.name} · ${p.year}`,
      author: criticAcc.name,
      handle: criticAcc.handle,
      badge: criticAcc.badge,
      verified: criticAcc.verified,
      avatar: criticAcc.avatar,
      viral: true,
      text: isEn()
        ? `Alarm bells for ${p.team.name} (${block.wins}-${block.losses} in ${block.name}). ${p.firstName} ${p.lastName} (${st.pts} PPG) looks passive and out of rhythm when the team needs him most. 👀📉`
        : `Campanello d'allarme per ${p.team.name} (${block.wins}-${block.losses} in ${block.name}). ${p.firstName} ${p.lastName} (${st.pts} PTS di media) appare spento e fuori ritmo proprio quando servirebbe una scossa. 👀📉`,
      comments: [
        { author: "Parquet Troll", handle: "@HoopsTroll_X", text: isEn() ? "Overrated! Ghost mode activated 👻🧱" : "Sopravvalutato! Modalità fantasma attivata 👻🧱" },
      ],
    });
    createSocialPost(p, {
      kind: "rival",
      when: `${block.name} · ${p.year}`,
      author: rivalAcc.name,
      handle: rivalAcc.handle,
      badge: rivalAcc.badge,
      verified: rivalAcc.verified,
      avatar: rivalAcc.avatar,
      text: rivalAcc.isPlayer
        ? (isEn()
          ? `Tough week at the office, ${handle}? ${block.wins}-${block.losses} and ${st.pts} PPG... Keep that same energy when you play ${rivalAcc.teamName}! 🤫📉`
          : `Settimana difficile in ufficio, ${handle}? ${block.wins}-${block.losses} e ${st.pts} punti di media... Mi raccomando, continua così anche contro ${rivalAcc.teamName}! 🤫📉`)
        : (isEn()
          ? `Remember when ${p.team.name} fans said ${p.lastName} would dominate the league? ${block.wins}-${block.losses} in ${block.name}, mind the gap from ${rivalAcc.teamName}! 😂👋`
          : `Vi ricordate quando i tifosi di ${p.team.name} dicevano che ${p.lastName} avrebbe dominato il campionato? ${block.wins}-${block.losses} in ${block.name}, salutate ${rivalAcc.teamName}! 😂👋`),
    });
  }
}

/* Hook di fine stagione: sfottò dopo un'eliminazione ai playoff o veleno degli hater dopo un titolo */
function onSeasonEndSocial(p, rec) {
  if (!p || !rec) return;
  ensureSocialState(p);
  const seed = `${p.year}:seasonEnd:${rec.wins}:${rec.losses}`;
  const rivalAcc = pickRivalSocialAccount(p, seed);
  if (rec.champion) {
    createSocialPost(p, {
      kind: "critic",
      when: isEn() ? `Post-Finals · ${p.year}` : `Post-Finale · ${p.year}`,
      author: "Brick Watcher",
      handle: "@BrickWatcher_",
      badge: "🧌 Hater",
      verified: false,
      avatar: "🧂",
      viral: true,
      text: isEn()
        ? `Asterisk ring for ${p.lastName} and ${p.team.name} 🥱* Easiest bracket in years, bailed out by teammates and officiating. Do it again next season against healthy rivals if you can! 🧂📉`
        : `Titolo con l'asterisco per ${p.lastName} e ${p.team.name} 🥱* Tabellone spianato e salvato dai compagni nei momenti chiave. Ripetetevi l'anno prossimo senza aiuti se ci riuscite! 🧂📉`,
      comments: [
        { author: rivalAcc.name, handle: rivalAcc.handle, text: isEn() ? `Enjoy it while it lasts, next year ${rivalAcc.teamName} is coming for the throne! 😤` : `Godetevela finché dura, l'anno prossimo ${rivalAcc.teamName} si riprende tutto! 😤` },
      ],
    });
  } else {
    const poText = rec.playoffResult || (rec.playoffRounds ? (isEn() ? "playoffs" : "playoff") : (isEn() ? "missed playoffs" : "fuori dai playoff"));
    createSocialPost(p, {
      kind: "critic",
      when: isEn() ? `End of Season · ${p.year}` : `Fine Stagione · ${p.year}`,
      author: "Hot Take Studio TV",
      handle: "@HotTakeStudioTV",
      badge: "🌶️ Hot Take TV",
      verified: true,
      avatar: "🏖️",
      viral: true,
      text: isEn()
        ? `🏖️ "1, 2, 3... Cancun!" Season over for ${p.firstName} ${p.lastName} and ${p.team.name} (${rec.wins}-${rec.losses}, ${poText}). Another year without the ring: when the lights get bright, where is the superstar impact? 😬✈️`
        : `🏖️ "1, 2, 3... Vacanze!" Finisce qui la stagione di ${p.firstName} ${p.lastName} e ${p.team.name} (${rec.wins}-${rec.losses}, ${poText}). Altro giro a mani vuote: quando le partite contano davvero, dov'è il salto di qualità? 😬✈️`,
      comments: [
        { author: rivalAcc.name, handle: rivalAcc.handle, text: isEn() ? "Have a nice summer on the couch watching us! 😂🏖️" : "Buone vacanze sul divano a guardarci! 😂🏖️" },
      ],
    });
  }
}

/* Hook sugli acquisti di lusso: opinionisti e hater criticano le spese folli fuori dal campo */
function onLifestyleSocial(p, item) {
  if (!p || !item || item.price < 0.08) return;
  ensureSocialState(p);
  const cur = playerCurrency(p);
  createSocialPost(p, {
    kind: "critic",
    when: isEn() ? `Off-Court · ${p.year}` : `Extra-campo · ${p.year}`,
    author: isEn() ? "Armchair Coach" : "Coach da Divano",
    handle: "@ArmchairCoach",
    badge: isEn() ? "📋 Pundit" : "📋 Opinionista",
    verified: false,
    avatar: "🛋️",
    text: isEn()
      ? `💸 ${p.firstName} ${p.lastName} just splashed ${fmtMoney(item.price, cur)} on "${item.title}" ${item.icon}. Maybe spend less time flexing luxury toys and more time working on free throws in the gym? 👀🏀`
      : `💸 ${p.firstName} ${p.lastName} ha appena speso ${fmtMoney(item.price, cur)} per "${item.title}" ${item.icon}. Pensare un po' meno al lusso fuori dal campo e un po' di più a sudare in palestra no eh? 👀🏀`,
  });
}

function onInterviewSocial(iv, toneId) {
  if (!player || !iv) return;
  ensureSocialState(player);
  const p = player;
  const ctx = INTERVIEW_CONTEXTS[iv.context] || INTERVIEW_CONTEXTS.default;
  const tone = INTERVIEW_TONES.find(t => t.id === toneId);
  if (!tone) return;
  const ansMap = ivAnswers(ctx);
  const quote = ansMap[tone.id] || ansMap.confident;
  const journalist = typeof getInterviewJournalist === "function" ? getInterviewJournalist(iv) : { name: "Reporter", outlet: interviewOutlet(iv), avatar: "🎙️", tag: "🎙️ Sala Stampa" };
  const headline = typeof generateNewspaperHeadline === "function" ? generateNewspaperHeadline(toneId, iv, p) : "";
  const isSpicy = toneId === "polemic" || toneId === "ironic" || toneId === "confident";

  if (iv.fine) {
    createSocialPost(p, {
      kind: "critic",
      when: isEn() ? `Press Room · ${p.year}` : `Sala Stampa · ${p.year}`,
      author: isEn() ? "League Office Alert" : "Ufficio Indagini Lega",
      handle: "@LeagueOffice_PR",
      badge: isEn() ? "⚖️ Official Fine" : "⚖️ Sanzione Ufficiale",
      verified: true,
      avatar: "⚖️",
      viral: true,
      text: isEn()
        ? `⚖️ SANCTION: ${p.firstName} ${p.lastName} (${p.team.name}) has been fined ${fmtMoney(iv.fine, playerCurrency(p))} for disparaging remarks regarding game officials! 🚨`
        : `⚖️ SANZIONE: ${p.firstName} ${p.lastName} (${p.team.name}) è stato multato di ${fmtMoney(iv.fine, playerCurrency(p))} dalla Lega per dichiarazioni lesive verso gli arbitri! 🚨`,
      comments: [
        { author: "Hot Take Studio TV", handle: "@HotTakeTV", text: isEn() ? "Freedom of speech isn't cheap in this league! 😂🍿" : "La libertà di parola costa cara in questa lega! 😂🍿" },
        { author: isEn() ? `${p.team.name} Ultras` : `Curva ${p.team.name}`, handle: "@CurvaFedele", text: isEn() ? "He only spoke the truth! We stand with you! ✊" : "Ha detto solo la verità! Siamo tutti con te! ✊" },
      ],
    });
  } else if (iv.viralFollowers) {
    createSocialPost(p, {
      kind: "media",
      when: isEn() ? `Press Room · ${p.year}` : `Sala Stampa · ${p.year}`,
      author: isEn() ? "CourtX Viral Moments" : "Meme del Parquet",
      handle: "@CourtX_Trending",
      badge: "🔥 Trending #1",
      verified: true,
      avatar: "🍿",
      viral: true,
      text: isEn()
        ? `🔥 TRENDING #1: ${p.lastName}'s press room quote is everywhere right now! 😂 “${quote}” (+${fmtFollowers(iv.viralFollowers)} followers)`
        : `🔥 IN TENDENZA: Il siparietto di ${p.lastName} in conferenza stampa sta facendo il giro del web! 😂 “${quote}” (+${fmtFollowers(iv.viralFollowers)} follower)`,
      comments: [
        { author: "Parquet Troll", handle: "@ParquetTroll", text: isEn() ? "Give this man a stand-up special already! 💀" : "Dategli uno show comico in prima serata! 💀" },
        { author: "Court Insider", handle: "@CourtInsider", text: isEn() ? "Love seeing athletes show real charisma! 👏" : "Bello vedere giocatori con questo carisma e autoironia! 👏" },
      ],
    });
  } else {
    createSocialPost(p, {
      kind: isSpicy ? "critic" : "media",
      when: isEn() ? `Press Room · ${p.year}` : `Sala Stampa · ${p.year}`,
      author: `${journalist.name} (${journalist.outlet})`,
      handle: `@${journalist.name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12)}`,
      badge: isEn() ? "🎙️ Press Conf" : "🎙️ Conferenza",
      verified: true,
      avatar: journalist.avatar,
      viral: isSpicy,
      text: headline ? `📰 ${headline}\n\n“${quote}”` : `🎙️ ${p.firstName} ${p.lastName} in sala stampa: “${quote}”`,
      comments: [
        isSpicy
          ? { author: isEn() ? "Sixth Man Club" : "Sesto Uomo", handle: "@SestoUomo_Official", text: isEn() ? "Personality for days, finally someone not giving canned answers! 🔥🍿" : "Personalità da vendere, finalmente qualcuno che non dice frasi fatte! 🔥🍿" }
          : { author: isEn() ? "Hardwood Ultras" : "Curva Parquet", handle: "@CurvaParquet", text: isEn() ? "True leader's answer, onto the next game! 👏" : "Risposta da vero leader, testa alla prossima partita! 👏" },
      ],
    });
  }
}

function onInterviewFollowUpSocial(iv, followId) {
  if (!player || !iv) return;
  ensureSocialState(player);
  const opt = INTERVIEW_FOLLOWUP_OPTIONS.find(o => o.id === followId);
  if (!opt) return;
  const fanAcc = socialPick(SOCIAL_ACCOUNTS.fan, `${player.year}:${followId}`);
  createSocialPost(player, {
    kind: followId === "rivals" ? "critic" : "fan",
    when: isEn() ? `Post-Press · ${player.year}` : `Post-Conferenza · ${player.year}`,
    author: fanAcc.name,
    handle: fanAcc.handle,
    badge: fanAcc.badge,
    verified: false,
    avatar: opt.icon,
    text: isEn()
      ? `${player.lastName}'s parting words before leaving the podium: “${opt.quote}” ${followId === "rivals" ? "🔥 Challenge thrown down to rivals!" : "🙌"}`
      : `Le ultime parole di ${player.lastName} prima di lasciare il podio: “${opt.quote}” ${followId === "rivals" ? "🔥 Sfida lanciata agli avversari!" : "🙌"}`,
  });
}

function onFarewellTourAnnouncedSocial(p) {
  if (!p) return;
  ensureSocialState(p);
  const mediaAcc = socialPick(SOCIAL_ACCOUNTS.media, `${p.year}:farewell_m`);
  const fanAcc = socialPick(SOCIAL_ACCOUNTS.fan, `${p.year}:farewell_f`);
  const rivalAcc = pickRivalSocialAccount(p, `${p.year}:farewell_r`);

  // 1. Post del giocatore che annuncia l'ultima stagione
  createSocialPost(p, {
    kind: "player",
    when: isEn() ? `Announcement · Season ${p.year}` : `Annuncio · Stagione ${p.year}`,
    author: `${p.firstName} ${p.lastName}`,
    handle: playerSocialHandle(p),
    badge: isEn() ? "🏀 Legend" : "🏀 Bandiera",
    verified: isPlayerSocialVerified(p),
    avatar: "⭐",
    viral: true,
    text: isEn()
      ? `Dear basketball: the ${p.year + 1} season will be my last. Thank you to every fan, teammate, and coach along the way. Let's give everything for one last ride! 🏁🏀 #OneLastDance #FarewellTour`
      : `Cara pallacanestro: la stagione ${p.year + 1} sarà la mia ultima corsa sul parquet. Grazie a ogni tifoso, compagno e allenatore. Diamoci dentro fino all'ultima sirena! 🏁🏀 #UltimoBallo #FarewellTour`,
    tag: isEn() ? "Farewell Tour" : "Tour d'Addio",
    comments: [
      { author: fanAcc.name, handle: fanAcc.handle, text: isEn() ? "Not ready for this... standing ovation every single night! 😭👑" : "Non sono pronto a questo momento... ti applaudiranno in ogni palazzetto! 😭👑" },
      { author: rivalAcc.name, handle: rivalAcc.handle, text: isEn() ? "Fierce battles, endless respect. Enjoy every minute of your final year. 🤝🔥" : "Battaglie feroci da avversari, ma rispetto assoluto. Goditi ogni minuto dell'ultimo anno. 🤝🔥" },
    ],
  });

  // 2. Breaking News da parte dei media
  createSocialPost(p, {
    kind: "media",
    when: isEn() ? `Breaking News · ${p.year}` : `Ultime Notizie · ${p.year}`,
    author: mediaAcc.name,
    handle: mediaAcc.handle,
    badge: "🚨 Breaking",
    verified: true,
    avatar: "🗞️",
    viral: true,
    text: isEn()
      ? `🚨 BREAKING: ${p.firstName} ${p.lastName} announces that Season ${p.year + 1} will be the final chapter of a legendary career. Every arena will celebrate his legacy! 🏆👏`
      : `🚨 ULTIM'ORA: ${p.firstName} ${p.lastName} ha annunciato che la stagione ${p.year + 1} sarà l'ultima della sua straordinaria carriera. Si prepara un tour d'addio da brividi! 🏆👏`,
  });
}

function onRetirementSocial(p) {
  if (!p) return;
  ensureSocialState(p);
  const mediaAcc = socialPick(SOCIAL_ACCOUNTS.media, `${p.year}:retire_m`);
  const fanAcc = socialPick(SOCIAL_ACCOUNTS.fan, `${p.year}:retire_f`);
  const hof = typeof hallOfFameVerdict === "function" ? hallOfFameVerdict() : { elected: false };
  const totals = p.careerTotals || { pts: 0, gp: 0 };
  const rings = (p.trophies && p.trophies.rings) || 0;
  const titles = (p.trophies && p.trophies.titles) || (p.trophies && p.trophies.domesticTitles) || 0;

  // 1. Post del giocatore per il ritiro definitivo
  createSocialPost(p, {
    kind: "player",
    when: isEn() ? `Retirement · ${p.year}` : `Ritiro Ufficiale · ${p.year}`,
    author: `${p.firstName} ${p.lastName}`,
    handle: playerSocialHandle(p),
    badge: isEn() ? "👑 Legend" : "👑 Leggenda",
    verified: isPlayerSocialVerified(p),
    avatar: "🏁",
    viral: true,
    text: isEn()
      ? `Lacing them up for the last time. ${p.history ? p.history.length : "Many"} seasons, unforgettable battles, lifelong brothers. Thank you basketball, for giving me a dream. The chapter closes. ❤️👟`
      : `Scarpe appese al chiodo. ${p.history ? p.history.length : "Tante"} stagioni, battaglie indimenticabili, fratelli per la vita. Grazie basket per avermi regalato un sogno. Si chiude un capitolo. ❤️👟`,
    tag: isEn() ? "Retirement" : "Ritiro",
    comments: [
      { author: "Hoops Central", handle: "@HoopsCentral", text: isEn() ? "Generational icon. Enjoy retirement legend! 👏🔥" : "Icona generazionale. Buona pensione leggenda! 👏🔥" },
      { author: fanAcc.name, handle: fanAcc.handle, text: isEn() ? "Thank you for every bucket, every memory. You will never be forgotten! 💛" : "Grazie per ogni canestro e ogni emozione. Non ti dimenticheremo mai! 💛" },
    ],
  });

  // 2. Breaking News di tributo globale
  createSocialPost(p, {
    kind: "media",
    when: isEn() ? `Career Retrospective · ${p.year}` : `Tributo alla Carriera · ${p.year}`,
    author: "CourtSide Report",
    handle: "@CourtSideRep",
    badge: "🏆 Hall of Fame",
    verified: true,
    avatar: "🎙️",
    viral: true,
    text: isEn()
      ? `📰 THE END OF AN ERA: ${p.firstName} ${p.lastName} officially retires after ${p.history ? p.history.length : ""} seasons (${p.goatScore || 0} GOAT score${hof.elected ? ", Hall of Fame bound 🏛️" : ""}). An illustrious chapter in basketball history comes to an end.`
      : `📰 LA FINE DI UN'ERA: ${p.firstName} ${p.lastName} si ritira ufficialmente dopo ${p.history ? p.history.length : ""} stagioni (${p.goatScore || 0} punti GOAT${hof.elected ? ", destinazione Hall of Fame 🏛️" : ""}). Si chiude una delle pagine più belle della storia del basket.`,
  });
}

function onBuyoutSocial(p, oldTeam) {
  if (!p || !oldTeam) return;
  ensureSocialState(p);
  createSocialPost(p, {
    kind: "critic",
    when: isEn() ? `Market · ${p.year}` : `Mercato · ${p.year}`,
    author: isEn() ? `${oldTeam.name} Ultras` : `Curva ${oldTeam.name}`,
    handle: `@Ultras_${oldTeam.name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10)}`,
    badge: isEn() ? "😡 Former Fans" : "😡 Ex Tifosi",
    verified: false,
    avatar: "🐍",
    viral: true,
    text: isEn()
      ? `🚪 ${p.firstName} ${p.lastName} bought out his contract with ${oldTeam.name} to hit free agency! That's no way to treat the fans who always had your back! 😤💔`
      : `🚪 ${p.firstName} ${p.lastName} ha rescisso il contratto con ${oldTeam.name} tramite buyout per andare sul mercato! Non ci si comporta così con chi ti ha sempre sostenuto! 😤💔`,
    comments: [
      { author: "Hoops Central", handle: "@HoopsCentral", text: isEn() ? `🚨 BREAKING: ${p.lastName} is officially a free agent! Bidding war begins among clubs.` : `🚨 CLAMOROSO: ${p.lastName} è ufficialmente sul mercato! Asta aperta tra i club.` },
    ],
  });
}

function onNewsSocial(text) {
  if (!player || !text) return;
  ensureSocialState(player);
  // Filtra le notizie più importanti per non duplicare quelle già coperte da conferenza/buyout
  if (text.startsWith("🎤")) return;
  const isTrophy = /🏆|Campione|Trionfo|MVP|All-Star|Weekend delle stelle|Scadenza del mercato|Firma|Nuovo contratto|Champion|Triumph|All-Star Weekend|Trade Deadline|Signed|New contract/i.test(text);
  if (!isTrophy && (player.social.posts.length > 4 && socialHash(text) % 3 !== 0)) return;
  const mediaAcc = socialPick(SOCIAL_ACCOUNTS.media, text);
  createSocialPost(player, {
    kind: "media",
    when: isEn() ? `News · ${player.year}` : `Notizia · ${player.year}`,
    author: mediaAcc.name,
    handle: mediaAcc.handle,
    badge: "🚨 Breaking",
    verified: true,
    avatar: "🚨",
    viral: /🏆|MVP|Campione|Champion/i.test(text),
    text: text,
  });
}

/* Azioni interattive dell'utente nella tab Social */
function publishPlayerSocialPost(actionId) {
  if (!player) return;
  ensureSocialState(player);
  if (!canPostOnSocial(player)) {
    toast(isEn() ? "⏳ You already published a post in this step of the season!" : "⏳ Hai già pubblicato un post in questo step della stagione!");
    return;
  }
  const act = SOCIAL_POST_ACTIONS.find(a => a.id === actionId);
  if (!act) return;

  pApplySocialAction(player, act);
  player.social.lastPostStepKey = socialCurrentStepKey(player);

  const post = createSocialPost(player, {
    kind: "player",
    when: isEn() ? `Just now · ${player.year}` : `Adesso · ${player.year}`,
    author: `${player.firstName} ${player.lastName}`,
    handle: playerSocialHandle(player),
    badge: isEn() ? "🏀 Player" : "🏀 Giocatore",
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
  toast(isEn()
    ? `📱 Post published on CourtX! (+${fmtFollowers(gainedFollowers)} followers${moneyNote})`
    : `📱 Post pubblicato su CourtX! (+${fmtFollowers(gainedFollowers)} follower${moneyNote})`);
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

  let effectSummary = `${opt.tag} · +${fmtFollowers(gained)} ${isEn() ? "followers" : "follower"}`;
  if (replyId === "clapback") {
    const avgOvr = (LEAGUES[player.league] && LEAGUES[player.league].avgOverall) || 70;
    if (player.overall >= avgOvr) {
      changeReputation(player, 1);
      effectSummary = isEn()
        ? `🔥 RATIO SUCCESS! Pop +4 · Morale +3 · Rep +1 · +${fmtFollowers(gained)} followers`
        : `🔥 RATIO RIUSCITO! Pop +4 · Morale +3 · Rep +1 · +${fmtFollowers(gained)} follower`;
    } else {
      changeReputation(player, -2);
      effectSummary = isEn()
        ? `⚠️ Social backlash: Pop +4 · Rep −2 · +${fmtFollowers(gained)} followers`
        : `⚠️ Polemica social: Pop +4 · Rep −2 · +${fmtFollowers(gained)} follower`;
    }
  }

  post.replied = replyId;
  post.replyText = opt.buildReply(player);
  post.replyEffect = effectSummary;
  post.liked = true;
  post.likes = (post.likes || 0) + Math.max(5, Math.round(gained * 0.25));

  toast(isEn()
    ? `💬 Reply sent to ${post.handle}! (${effectSummary})`
    : `💬 Risposta inviata a ${post.handle}! (${effectSummary})`);
  renderGameScreen();
}

function renderPodcastCardHtml(p) {
  ensurePodcastState(p);
  const pod = p.podcast;
  const cur = playerCurrency(p);
  if (!pod.active) {
    return `
      <div class="card social-podcast-card">
        <div class="card-title">
          <h3>🎙️ ${isEn() ? "Athlete Podcast" : "Podcast Personale"}</h3>
          <span class="badge ${isPlayerSocialVerified(p) ? "gold" : ""}">${isEn() ? "CourtX Audio" : "CourtX Audio"}</span>
        </div>
        <p class="small-muted" style="margin-bottom:12px">
          ${isEn()
            ? "Launch your own player-led podcast (like Paul George or Draymond Green). Share locker room stories, break down film, host legends, and monetize with audio sponsors!"
            : "Lancia il tuo show personale stile Paul George o Draymond Green. Racconta retroscena di spogliatoio, analizza schemi, intervista leggende e guadagna con sponsor audio!"}
        </p>
        <button type="button" class="btn btn-primary" id="btn-launch-podcast" style="width:100%;font-weight:700">
          🎙️ ${isEn() ? "Launch Your Podcast" : "Crea il tuo Podcast Personale"}
        </button>
      </div>`;
  }

  const canRecord = canRecordPodcastEpisode(p);
  const payout = podcastEpisodePayout(p);

  return `
    <div class="card social-podcast-card is-active">
      <div class="card-title" style="margin-bottom:8px">
        <div style="display:flex;align-items:center;gap:6px;min-width:0">
          <span style="font-size:1.3rem">🎙️</span>
          <h3 style="margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${pod.name}">${pod.name}</h3>
          <button type="button" class="btn-clean" id="btn-rename-podcast" title="${isEn() ? "Rename Podcast" : "Rinomina Podcast"}" style="cursor:pointer;opacity:0.75">✏️</button>
        </div>
        <span class="badge ${canRecord ? "green" : ""}">${canRecord ? (isEn() ? "🔴 ON AIR" : "🔴 PRONTO") : (isEn() ? "⏳ Awaiting Next Block" : "⏳ Già registrato")}</span>
      </div>

      <div class="podcast-stats-row">
        <div class="p-stat">
          <span class="p-stat-val">${fmtFollowers(pod.listeners || 0)}</span>
          <span class="p-stat-lbl">${isEn() ? "Listeners" : "Ascoltatori"}</span>
        </div>
        <div class="p-stat">
          <span class="p-stat-val">${pod.episodes || 0}</span>
          <span class="p-stat-lbl">${isEn() ? "Episodes" : "Puntate"}</span>
        </div>
        <div class="p-stat">
          <span class="p-stat-val">+${fmtMoney(pod.totalEarnings || 0, cur)}</span>
          <span class="p-stat-lbl">${isEn() ? "Earnings" : "Incassi"}</span>
        </div>
      </div>

      <div class="podcast-recording-section">
        <div class="flex-between" style="margin:10px 0 6px">
          <span class="small-muted" style="font-weight:700;text-transform:uppercase;font-size:0.78rem">
            ${isEn() ? "Record Episode (1 per turn)" : "Registra Puntata (1 per blocco)"}
          </span>
          <span class="small-muted" style="font-size:0.78rem">
            ${isEn() ? `Audio Sponsor: ~${fmtMoney(payout, cur)}/ep` : `Sponsor Audio: ~${fmtMoney(payout, cur)}/ep`}
          </span>
        </div>

        <div class="podcast-formats-list">
          ${PODCAST_FORMATS.map(f => {
            const tags = isEn() ? f.tagsEn : f.tags;
            const tagsHtml = tags.map(t => `<span class="badge ${f.id === 'spicy' ? 'red' : f.id === 'legend' ? 'gold' : ''}">${t}</span>`).join("");
            return `
              <button type="button" class="option-card podcast-format-btn" data-podcast-format="${f.id}" ${canRecord ? "" : "disabled"}>
                <div class="sa-title">${f.icon} ${isEn() ? f.nameEn : f.name}</div>
                <div class="sa-desc">${isEn() ? f.descEn : f.desc}</div>
                <div class="sa-tags">${tagsHtml}</div>
              </button>`;
          }).join("")}
        </div>
      </div>
    </div>`;
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
    if (curFilter === "haters") return post.kind === "critic" || post.kind === "rival";
    if (curFilter === "media") return post.kind === "media" || post.kind === "critic" || post.kind === "rival";
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
                ${verified ? `<span class="sp-verified" title="${isEn() ? "Verified CourtX Account" : "Account Verificato CourtX"}">✔️</span>` : ""}
              </div>
              <div class="sp-handle">${handle}</div>
            </div>
          </div>
          <p class="sp-bio">
            🏀 ${bioRole} @ <strong>${player.team.name}</strong> (${lgName})
            ${player.trophies && player.trophies.titles ? ` · 🏆 ${player.trophies.titles}x ${isEn() ? "Champion" : "Campione"}` : ""}
            ${player.trophies && player.trophies.nationalCups ? ` · 🏆 ${player.trophies.nationalCups}x ${isEn() ? "Cup" : "Coppa"}` : ""}
            · #${player.jerseyNumber != null ? player.jerseyNumber : 23} · #F3NOM
          </p>
          <div class="sp-stats">
            <div class="sp-stat">
              <span class="sp-stat-val">${fmtFollowers(followers)}</span>
              <span class="sp-stat-lbl">${isEn() ? "Followers" : "Follower"}</span>
            </div>
            <div class="sp-stat">
              <span class="sp-stat-val">${player.popularity || 0}/100</span>
              <span class="sp-stat-lbl">${isEn() ? "Popularity" : "Popolarità"}</span>
            </div>
            <div class="sp-stat">
              <span class="sp-stat-val">${allPosts.filter(x => x.kind === "player" || x.replied).length}</span>
              <span class="sp-stat-lbl">${isEn() ? "Interactions" : "Interazioni"}</span>
            </div>
          </div>
          <div class="sp-sentiment">
            <div class="sp-sent-top">
              <span class="small-muted">${isEn() ? "Public Sentiment" : "Umore della piazza"}</span>
              <span class="badge ${sent.tone}">${sent.icon} ${sent.label}</span>
            </div>
            <p class="small-muted" style="margin:4px 0 0;font-size:0.82rem">${sent.desc}</p>
          </div>
        </div>

        <!-- PODCAST CARD -->
        ${renderPodcastCardHtml(player)}

        <div class="card social-compose-card">
          <div class="card-title">
            <h3>${isEn() ? "✍️ Publish a Post" : "✍️ Pubblica un Post"}</h3>
            <span class="badge ${canPost ? "blue" : ""}">${canPost ? (isEn() ? "1 available" : "1 disponibile") : (isEn() ? "Already posted" : "Già pubblicato")}</span>
          </div>
          <p class="small-muted" style="margin-bottom:10px">
            ${canPost
              ? (isEn() ? "Choose what to share with your followers during this step of the season:" : "Scegli cosa condividere con i tuoi follower in questo step della stagione:")
              : (isEn() ? "You already published a post this turn. Advance the season to post again!" : "Hai già pubblicato un post in questo turno. Avanza nella stagione per pubblicarne un altro!")}
          </p>
          <div class="social-compose-list">
            ${SOCIAL_POST_ACTIONS.map(a => {
              const extraSub = a.id === "flex" ? `${isEn() ? "Payout" : "Incasso"} +${fmtMoney(socialSponsorPayout(player), playerCurrency(player))} · Pop +3 · Coach −1` : a.sub;
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
            <h3 style="margin:0">${isEn() ? "🔥 Live CourtX Feed" : "🔥 Feed CourtX in tempo reale"}</h3>
            <div class="social-filters">
              <button type="button" class="league-pill ${curFilter === "all" ? "active" : ""}" data-social-filter="all">${isEn() ? "All" : "Tutti"} (${allPosts.length})</button>
              <button type="button" class="league-pill ${curFilter === "haters" ? "active" : ""}" data-social-filter="haters">${isEn() ? "🔥 Haters & Rivals" : "🔥 Hater & Rivali"}</button>
              <button type="button" class="league-pill ${curFilter === "media" ? "active" : ""}" data-social-filter="media">${isEn() ? "📰 Media & Critics" : "📰 Media & Critici"}</button>
              <button type="button" class="league-pill ${curFilter === "fans" ? "active" : ""}" data-social-filter="fans">${isEn() ? "📣 Fans & Team" : "📣 Tifosi & Squadra"}</button>
              <button type="button" class="league-pill ${curFilter === "mine" ? "active" : ""}" data-social-filter="mine">${isEn() ? "⭐ Your Posts" : "⭐ I tuoi post"}</button>
            </div>
          </div>

          <div class="social-feed-list">
            ${filteredPosts.length ? filteredPosts.map(post => socialPostCardHtml(post, player)).join("") : `<p class="small-muted" style="text-align:center;padding:24px 0">${isEn() ? "No posts in this category." : "Nessun post in questa categoria."}</p>`}
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

  const launchBtn = container.querySelector("#btn-launch-podcast");
  if (launchBtn) launchBtn.addEventListener("click", () => openLaunchPodcastModal());

  const renameBtn = container.querySelector("#btn-rename-podcast");
  if (renameBtn) renameBtn.addEventListener("click", () => openRenamePodcastModal());

  container.querySelectorAll("[data-podcast-format]").forEach(btn => {
    btn.addEventListener("click", () => recordPodcastEpisode(btn.dataset.podcastFormat));
  });
}

function socialPostCardHtml(post, p) {
  const isPlayer = post.kind === "player";
  const isCritic = post.kind === "critic" || post.kind === "rival";
  const canReply = !isPlayer && !post.replied;
  return `
    <article class="social-post ${isPlayer ? "is-player" : ""} ${isCritic ? "is-critic" : ""}">
      <div class="spost-top">
        <div class="spost-avatar">${post.avatar || "🏀"}</div>
        <div class="spost-meta">
          <div class="spost-author-row">
            <strong class="spost-author">${post.author}</strong>
            ${post.verified ? `<span class="sp-verified" title="${isEn() ? "Verified" : "Verificato"}">✔️</span>` : ""}
            <span class="spost-handle">${post.handle}</span>
            ${post.badge ? `<span class="badge ${isCritic ? "red" : isPlayer ? "gold" : ""}">${post.badge}</span>` : ""}
          </div>
          <div class="spost-when">${post.when || (isEn() ? `Season ${post.year}` : `Stagione ${post.year}`)}</div>
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
          <span class="small-muted" style="font-size:0.78rem">${isEn() ? "Reply:" : "Rispondi:"}</span>
          ${SOCIAL_REPLY_OPTIONS.map(o => `
            <button type="button" class="btn btn-ghost btn-sm spost-reply-chip" data-social-reply="${post.id}:${o.id}" title="${o.tag}">
              ${o.icon} ${o.label}
            </button>`).join("")}
        </div>` : ""}
    </article>
  `;
}

