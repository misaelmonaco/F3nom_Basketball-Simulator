"use strict";

/* ================================================================
   F3NOM DILEMMAS & NARRATIVE CHOICES
   50+ dilemmi morali e situazionali contemporanei divisi in 7 categorie:
   1. Social Media, Streaming & Creators
   2. Moda, Pop Culture & Tunnel Fits
   3. Biohacking, Salute & Load Management
   4. Spogliatoio Moderno & Generazione Z
   5. Etica, Scommesse & Regolamento
   6. Business, Contratti & Player Empowerment
   7. Famiglia, Amore & Solidarietà
   ================================================================ */

const MODERN_DILEMMAS = [
  // -------------------------------------------------------------
  // CATEGORIA 1: Social Media, Streaming & Creators
  // -------------------------------------------------------------
  {
    id: "burner_account",
    title: "Il «Burner Account» su X",
    icon: "🕵️‍♂️",
    tag: "Social & Media",
    text: "Un account anonimo su X (Twitter) che difendeva a spada tratta le tue prestazioni criticando apertamente le scelte del coach viene tracciato al tuo indirizzo IP da un detective del web. Lo scoop è su tutti i siti sportivi.",
    options: [
      {
        id: "confess_apologize", icon: "🙏", label: "Ammetti l'errore e ti scusi pubblicamente",
        desc: "«Ero frustrato e ho agito da immaturo». Il coach apprezza l'onestà, ma i media ci ricamano per giorni.",
        badge: "Coach +6 · Compagni −4 · Media +8 · Umiltà", badgeTone: "good",
        apply: p => {
          changeRelationship(p, "coachTrust", 6);
          changeRelationship(p, "chemistry", -4);
          changeRelationship(p, "mediaRapport", 8);
          p.morale = clamp(p.morale - 4, 0, 100);
        }
      },
      {
        id: "blame_friend", icon: "🤷‍♂️", label: "«Gestisce quell'account un mio amico d'infanzia»",
        desc: "Ti discolpi scaricando la responsabilità su una terza persona. Nessuno ci crede fino in fondo, ma plachi il polverone.",
        badge: "Tifosi perplessi · Media −6 · Coach −2", badgeTone: "mid",
        apply: p => {
          changeRelationship(p, "mediaRapport", -6);
          changeRelationship(p, "coachTrust", -2);
        }
      },
      {
        id: "shut_down", icon: "🔒", label: "Chiudi tutti i profili social e dichiari silenzio stampa",
        desc: "Nessuna dichiarazione: blackout social totale per concentrarti solo sul campo.",
        badge: "Focus basket · Coach +8 · Media −12", badgeTone: "up",
        apply: p => {
          changeRelationship(p, "coachTrust", 8);
          changeRelationship(p, "mediaRapport", -12);
          p.morale = clamp(p.morale + 4, 0, 100);
        }
      }
    ]
  },
  {
    id: "locker_room_podcast",
    title: "Il Podcast Scomodo",
    icon: "🎙️",
    tag: "Social & Media",
    text: "Conduci un podcast seguitissimo: centinaia di migliaia di follower nei commenti ti implorano di svelare cosa sia successo realmente durante la furiosa lite in spogliatoio tra due tuoi compagni dopo l'ultima sconfitta.",
    options: [
      {
        id: "spill_tea", icon: "🔥", label: "Sveli i retroscena nel podcast: puntata record",
        desc: "Milioni di ascolti e clip virali ovunque. I tuoi compagni però si sentono traditi nella loro intimità.",
        badge: "Popolarità +12 · Compagni −14 · Media +10", badgeTone: "gold",
        apply: p => {
          p.popularity = clamp(p.popularity + 12, 0, 100);
          changeRelationship(p, "chemistry", -14);
          changeRelationship(p, "mediaRapport", 10);
        }
      },
      {
        id: "protect_room", icon: "🛡️", label: "«Quello che succede nello spogliatoio resta lì»",
        desc: "Difendi il patto sacro del gruppo: i compagni ti eleggono a leader silenzioso e affidabile.",
        badge: "Compagni +12 · Coach +8 · Rispetto totale", badgeTone: "up",
        apply: p => {
          changeRelationship(p, "chemistry", 12);
          changeRelationship(p, "coachTrust", 8);
          p.morale = clamp(p.morale + 4, 0, 100);
        }
      },
      {
        id: "joke_it_off", icon: "😂", label: "La butti sul ridere minimizzando l'accaduto",
        desc: "Trasformi la lite in un aneddoto comico innocuo, allentando la tensione generale.",
        badge: "Tifosi +6 · Media +6 · Equilibrio", badgeTone: "good",
        apply: p => {
          changeRelationship(p, "fansRapport", 6);
          changeRelationship(p, "mediaRapport", 6);
        }
      }
    ]
  },
  {
    id: "late_night_stream",
    title: "La Maratona di Gaming fino all'Alba",
    icon: "🎮",
    tag: "Lifestyle & Gaming",
    text: "La sera prima di una partita pomeridiana ti colleghi su Twitch con streamer di fama mondiale. Tra una partita e l'altra si fanno le 4:00 del mattino e migliaia di spettatori in chat ti intimano: «Vai a dormire che domani giochi!».",
    options: [
      {
        id: "log_off", icon: "💤", label: "Stacchi subito la live e corri a dormire",
        desc: "Dimostri maturità e recuperi un minimo di riposo per essere lucido sul parquet.",
        badge: "Stamina preservata · Coach +4", badgeTone: "good",
        apply: p => {
          changeRelationship(p, "coachTrust", 4);
        }
      },
      {
        id: "stream_until_dawn", icon: "⚡", label: "«Domani ne metto 30 lo stesso»: resti online fino alle 6",
        desc: "Momento epico per la community gaming, ma arrivi al palazzetto con gli occhi rossi e le gambe pesanti.",
        badge: "Popolarità +10 · Stamina −15 · Fragilità +4", badgeTone: "bad",
        apply: p => {
          p.popularity = clamp(p.popularity + 10, 0, 100);
          p.stamina = Math.max(0, p.stamina - 15);
          p.fragility = clamp(p.fragility + 4, 0, 100);
        }
      }
    ]
  },
  {
    id: "tiktok_leak_plane",
    title: "Il TikTok sul Volo di Squadra",
    icon: "📱",
    tag: "Spogliatoio & Social",
    text: "Sul charter societario, la matricola della squadra registra un video comico per TikTok. Nel filmato sullo sfondo si nota chiaramente la lavagna tattica del coach con le marcature difensive per la partita di domani.",
    options: [
      {
        id: "delete_video", icon: "🛑", label: "Gli togli il telefono e cancelli il post all'istante",
        desc: "Intervento tempestivo da capitano: salvi la tattica prima che diventi virale sul web.",
        badge: "Coach +10 · Rookie istruito +6", badgeTone: "up",
        apply: p => {
          changeRelationship(p, "coachTrust", 10);
          changeRelationship(p, "chemistry", 6);
        }
      },
      {
        id: "ignore_leak", icon: "🙈", label: "Fai finta di nulla ridendo della gag",
        desc: "Il video finisce nei feed degli avversari che preparano contromisure tattiche perfette.",
        badge: "Spogliatoio leggero · Coach furioso −10", badgeTone: "down",
        apply: p => {
          changeRelationship(p, "coachTrust", -10);
          changeRelationship(p, "chemistry", 4);
        }
      }
    ]
  },
  {
    id: "ai_digital_clone",
    title: "Il Clone Digitale con Intelligenza Artificiale",
    icon: "🤖",
    tag: "Business & Tech",
    text: "Una tech company della Silicon Valley ti offre 400.000$ per acquisire i diritti del tuo volto e della tua voce tramite IA, per generare video pubblicitari automatici a favore di una piattaforma di scommesse estere.",
    options: [
      {
        id: "accept_ai_cash", icon: "💰", label: "Accetti l'assegno faraonico: «Soldi facili senza fatica»",
        desc: "Incassi una fortuna senza muovere un dito, ma i tifosi ti rimproverano di promuovere l'azzardo.",
        badge: "Guadagni ++ · Tifosi −8 · Media critici", badgeTone: "gold",
        apply: p => {
          p.wealth = roundMoney(p.wealth + Math.max(0.04, p.wealth * 0.05));
          changeRelationship(p, "fansRapport", -8);
          changeRelationship(p, "mediaRapport", -6);
        }
      },
      {
        id: "refuse_ai_ethics", icon: "🛑", label: "Rifiuti seccamente: «La mia immagine non promuove l'azzardo»",
        desc: "Scelta di altissimo profilo morale: associazioni benefiche ed educatori ti lodano pubblicamente.",
        badge: "Tifosi +12 · Media +10 · Popolarità etica", badgeTone: "up",
        apply: p => {
          changeRelationship(p, "fansRapport", 12);
          changeRelationship(p, "mediaRapport", 10);
          p.popularity = clamp(p.popularity + 6, 0, 100);
        }
      }
    ]
  },
  {
    id: "cyberbullying_trolls",
    title: "I Messaggi d'Odio dopo lo 0/8 al Tiro",
    icon: "🤬",
    tag: "Salute Mentale & Social",
    text: "Dopo una serata da zero canestri e tre palle perse sanguinose, la tua sezione commenti viene inondata da migliaia di insulti velenosi, minacce e meme umilianti sui tuoi fallimenti.",
    options: [
      {
        id: "call_out_trolls", icon: "📢", label: "Pubblichi gli screenshot denunciando la tossicità del web",
        desc: "Accendi un dibattito nazionale sull'odio online verso gli atleti professionisti.",
        badge: "Media +12 · Tifosi leali +8 · Solidarietà", badgeTone: "good",
        apply: p => {
          changeRelationship(p, "mediaRapport", 12);
          changeRelationship(p, "fansRapport", 8);
          p.morale = clamp(p.morale + 4, 0, 100);
        }
      },
      {
        id: "delete_apps", icon: "📵", label: "Disinstalli i social e ti chiudi in palestra a tirare",
        desc: "Blackout emotivo: metti 1.000 tiri a segno al buio per ritrovare la mira sul parquet.",
        badge: "Tiro perfezionato · Coach +8 · Morale +6", badgeTone: "up",
        apply: p => {
          changeRelationship(p, "coachTrust", 8);
          p.morale = clamp(p.morale + 6, 0, 100);
        }
      }
    ]
  },
  {
    id: "netflix_docuseries",
    title: "La Docuserie Netflix nello Spogliatoio",
    icon: "🎬",
    tag: "Media & Brand",
    text: "Netflix propone una docuserie a puntate sulla tua vita. Però i cameraman pretendono accesso illimitato alle riunioni tecniche, ai massaggi e ai momenti privati con i compagni.",
    options: [
      {
        id: "full_access", icon: "🌟", label: "Porte aperte: vuoi una serie memorabile in stile Hollywood",
        desc: "Diventi una star globale della televisione, ma la presenza delle telecamere crea gelosie nel gruppo.",
        badge: "Popolarità +16 · Guadagni + · Compagni −8", badgeTone: "gold",
        apply: p => {
          p.popularity = clamp(p.popularity + 16, 0, 100);
          p.wealth = roundMoney(p.wealth + Math.max(0.02, p.wealth * 0.03));
          changeRelationship(p, "chemistry", -8);
        }
      },
      {
        id: "strict_boundaries", icon: "⚖️", label: "Riprese solo fuori dagli impianti e senza riprendere la tattica",
        desc: "Un compromesso equilibrato: preservi la sacralità del campo e produci un ottimo documentario.",
        badge: "Popolarità +8 · Coach +6 · Compagni sereni", badgeTone: "good",
        apply: p => {
          p.popularity = clamp(p.popularity + 8, 0, 100);
          changeRelationship(p, "coachTrust", 6);
          changeRelationship(p, "chemistry", 4);
        }
      }
    ]
  },
  {
    id: "ball_hog_highlights",
    title: "Il Compagno che Cerca solo i Reel su Instagram",
    icon: "📹",
    tag: "Spogliatoio & Basket",
    text: "Un compagno di squadra giovane cerca costantemente crossover rischiosi e tiri da circo per finire nei reel di Instagram, gettando via possessi fondamentali e ignorando i tuoi tagli a canestro.",
    options: [
      {
        id: "confront_bench", icon: "🗣️", label: "Lo affronti duramente durante il timeout: «Gioca per la squadra!»",
        desc: "Scuoti la squadra dal torpore. Il coach ti sostiene e il ragazzo capisce la lezione.",
        badge: "Leadership +10 · Coach +8 · Vittoria di squadra", badgeTone: "up",
        apply: p => {
          changeRelationship(p, "coachTrust", 8);
          changeRelationship(p, "chemistry", 6);
          p.morale = clamp(p.morale + 4, 0, 100);
        }
      },
      {
        id: "pass_never", icon: "🏀", label: "Non gli passi più la palla e ti prendi ogni tiro da solo",
        desc: "Una guerra fredda sul parquet: la manovra offensiva si spezza in mille frammenti.",
        badge: "Compagni spaccati −10 · Coach deluso −6", badgeTone: "bad",
        apply: p => {
          changeRelationship(p, "chemistry", -10);
          changeRelationship(p, "coachTrust", -6);
        }
      }
    ]
  },

  // -------------------------------------------------------------
  // CATEGORIA 2: Moda, Hip-Hop & Tunnel Fits
  // -------------------------------------------------------------
  {
    id: "paris_fashion_week",
    title: "Il «Tunnel Fit» alla Fashion Week di Parigi",
    icon: "🧥",
    tag: "Moda & Immagine",
    text: "Un celebre stilista francese ti invita come ospite d'onore alla sfilata di Parigi. C'è solo un problema: la sfilata è giovedì sera e sabato hai una partita di cartello. Dovresti fare andata e ritorno con un jet privato.",
    options: [
      {
        id: "fly_paris", icon: "✈️", label: "Voli a Parigi: icona di stile sul red carpet mondiale",
        desc: "Finisci sulle copertine di Vogue e GQ. Arrivi però alla palla a due con il jet-lag nelle gambe.",
        badge: "Popolarità +14 · Stamina −12 · Coach perplesso −6", badgeTone: "gold",
        apply: p => {
          p.popularity = clamp(p.popularity + 14, 0, 100);
          p.stamina = Math.max(0, p.stamina - 12);
          changeRelationship(p, "coachTrust", -6);
        }
      },
      {
        id: "stay_home_prep", icon: "🏋️‍♂️", label: "Rifiuti l'invito: il tuo unico palco è il parquet",
        desc: "Grande professionalità: il coach ti cita come esempio di dedizione totale alla franchigia.",
        badge: "Coach +10 · Compagni +6 · Salute al 100%", badgeTone: "up",
        apply: p => {
          changeRelationship(p, "coachTrust", 10);
          changeRelationship(p, "chemistry", 6);
          p.morale = clamp(p.morale + 4, 0, 100);
        }
      }
    ]
  },
  {
    id: "rapper_video_cameo",
    title: "Il Cameo nel Video del Rapper Controversale",
    icon: "🎤",
    tag: "Musica & Gossip",
    text: "Il rapper più ascoltato dell'anno ti vuole come protagonista nel video del suo nuovo singolo. La canzone però contiene rime pesantissime contro le forze dell'ordine e riferimenti a sostanze illecite.",
    options: [
      {
        id: "star_in_video", icon: "🔥", label: "Accetti e compari nel video con la tua canotta da gara",
        desc: "Un inno street epocale: i giovani e la cultura hip-hop ti venerano, ma la franchigia si dissocia.",
        badge: "Popolarità +14 · Media scatenati · Società −10", badgeTone: "bad",
        apply: p => {
          p.popularity = clamp(p.popularity + 14, 0, 100);
          changeRelationship(p, "coachTrust", -8);
          changeRelationship(p, "fansRapport", 4);
        }
      },
      {
        id: "decline_diplomatically", icon: "🙅‍♂️", label: "Rifiuti con diplomazia spiegando gli obblighi contrattuali",
        desc: "Mantieni intatta la tua reputazione immacolata per gli sponsor internazionali.",
        badge: "Sponsor preservati · Coach sereno +6", badgeTone: "good",
        apply: p => {
          changeRelationship(p, "coachTrust", 6);
        }
      }
    ]
  },
  {
    id: "defective_signature_shoes",
    title: "Le Tue Nuove Scarpe Scivolano sul Parquet",
    icon: "👟",
    tag: "Brand & Attrezzatura",
    text: "Durante il riscaldamento della gara di lancio della tua prima signature shoe da 180$, ti accorgi che la suola perde trazione sul parquet appena lucidato. C'è rischio concreto di distorsione alla caviglia.",
    options: [
      {
        id: "tape_switch_shoes", icon: "🔄", label: "Ti cambi le scarpe all'ultimo oscurando il logo concorrente",
        desc: "Scelta coraggiosa per la tua caviglia. Il brand di scarpe va su tutte le furie e ti chiede penali.",
        badge: "Salute protetta · Coach +8 · Sponsor −12", badgeTone: "up",
        apply: p => {
          changeRelationship(p, "coachTrust", 8);
          p.wealth = roundMoney(Math.max(0, p.wealth - 0.02));
          p.fragility = Math.max(0, p.fragility - 4);
        }
      },
      {
        id: "play_through_slipping", icon: "⚠️", label: "Stringi i denti e giochi con le tue scarpe difettose",
        desc: "Onori il contratto commerciale rischiando a ogni cambio di direzione e scivolando più volte.",
        badge: "Sponsor soddisfatti · Fragilità +8 · Prestazione calata", badgeTone: "bad",
        apply: p => {
          p.fragility = clamp(p.fragility + 8, 0, 100);
          p.wealth = roundMoney(p.wealth + 0.015);
        }
      }
    ]
  },
  {
    id: "protest_tattoo",
    title: "Il Tatuaggio con Messaggio Politico",
    icon: "🖋️",
    tag: "Cultura & Società",
    text: "Vuoi farti tatuare sul braccio un simbolo legato a una protesta popolare in corso nella tua terra natale. La lega e l'ufficio marketing ti consigliano vivamente di non esporti politicamente.",
    options: [
      {
        id: "tattoo_freedom", icon: "✊", label: "Ti tatui il simbolo sul braccio in bella vista",
        desc: "«La mia gente viene prima di qualsiasi sponsor». Diventi un simbolo civile di coraggio.",
        badge: "Tifosi di casa +16 · Media divisi · Rispetto storico", badgeTone: "up",
        apply: p => {
          changeRelationship(p, "fansRapport", 16);
          p.popularity = clamp(p.popularity + 8, 0, 100);
        }
      },
      {
        id: "keep_it_hidden", icon: "👕", label: "Lo sposti sul torace, coperto dalla divisa",
        desc: "Un compromesso personale: il messaggio vive nel tuo cuore senza creare incidenti diplomatici.",
        badge: "Serenità personale +6 · Sponsor preservati", badgeTone: "good",
        apply: p => {
          p.morale = clamp(p.morale + 6, 0, 100);
        }
      }
    ]
  },

  // -------------------------------------------------------------
  // CATEGORIA 3: Biohacking, Salute & Load Management
  // -------------------------------------------------------------
  {
    id: "load_management_national_tv",
    title: "«Load Management» in Prima Serata TV",
    icon: "🛋️",
    tag: "Salute & Tifosi",
    text: "Lo staff medico ti segnala rischio sovraccarico e consiglia di riposare nel big match trasmesso in mondovisione. Fuori dal palazzetto ci sono bambini con cartelli: «Abbiamo guidato 8 ore per vederti giocare!».",
    options: [
      {
        id: "play_for_kids", icon: "🏀", label: "Rifiuti il riposo e scendi in campo per i tifosi",
        desc: "Metti il cuore oltre l'ostacolo. I tifosi impazziscono d'amore per te, anche se il fisico ne risente.",
        badge: "Tifosi +18 · Popolarità +10 · Fragilità +6 · Fatica", badgeTone: "gold",
        apply: p => {
          changeRelationship(p, "fansRapport", 18);
          p.popularity = clamp(p.popularity + 10, 0, 100);
          p.fragility = clamp(p.fragility + 6, 0, 100);
          p.stamina = Math.max(0, p.stamina - 10);
        }
      },
      {
        id: "sit_out_smart", icon: "🛡️", label: "Segui il piano medico: preservi il corpo per i playoff",
        desc: "Scelta razionale da atleta d'élite. I commentatori TV ti criticano duramente accusandoti di svogliatezza.",
        badge: "Salute al sicuro · Tifosi scontenti −10 · Media −8", badgeTone: "bad",
        apply: p => {
          p.fragility = Math.max(0, p.fragility - 4);
          changeRelationship(p, "fansRapport", -10);
          changeRelationship(p, "mediaRapport", -8);
        }
      },
      {
        id: "play_18_mins", icon: "⏱️", label: "Compromesso: giochi solo 18 minuti partendo in quintetto",
        desc: "Fai felici i presenti con qualche prodezza senza rischiare il tracollo muscolare.",
        badge: "Equilibrio perfetto · Tifosi +6 · Coach +6", badgeTone: "good",
        apply: p => {
          changeRelationship(p, "fansRapport", 6);
          changeRelationship(p, "coachTrust", 6);
        }
      }
    ]
  },
  {
    id: "mental_health_break",
    title: "Il Muro Emotivo (Mental Health Break)",
    icon: "🧠",
    tag: "Salute Mentale",
    text: "La pressione asfissiante, le critiche feroci e i problemi personali ti hanno svuotato del tutto: non riesci a chiudere occhio da giorni e sul parquet ti senti un fantasma senz'anima.",
    options: [
      {
        id: "take_leave", icon: "🧘‍♂️", label: "Chiedi tre giorni di permesso per recuperare la salute mentale",
        desc: "Rompi il tabù dello sport: molti atleti nel mondo ti ringraziano per aver normalizzato la cura di sé.",
        badge: "Salute mentale recuperata · Morale +14 · Rispetto", badgeTone: "up",
        apply: p => {
          p.morale = clamp(p.morale + 14, 0, 100);
          changeRelationship(p, "coachTrust", 4);
          changeRelationship(p, "mediaRapport", 8);
        }
      },
      {
        id: "bottle_it_up", icon: "🤐", label: "Tieni tutto dentro e scendi in campo fingendo che vada bene",
        desc: "Il peso interiore si trasforma in ansia sul parquet: tiri forzati e sguardi persi nel vuoto.",
        badge: "Morale a terra −12 · Fragilità +4", badgeTone: "down",
        apply: p => {
          p.morale = Math.max(0, p.morale - 12);
          p.fragility = clamp(p.fragility + 4, 0, 100);
        }
      }
    ]
  },
  {
    id: "guru_extreme_diet",
    title: "La Dieta Estrema del Guru Personale",
    icon: "🥩",
    tag: "Allenamento & Nutrizione",
    text: "Assumi un celebre nutrizionista delle star che ti impone una dieta estrema solo carne rossa e digiuno intermittente. I medici della franchigia sono furiosi: «Rischia infiammazioni ai tendini!».",
    options: [
      {
        id: "follow_guru", icon: "💪", label: "Segui il guru privato: ti senti una bestia d'energia",
        desc: "Fisico scolpito e forza esplosiva, ma lo staff tecnico del club si sente esautorato.",
        badge: "Esplosività + · Staff societario −8 · Tensione", badgeTone: "mid",
        apply: p => {
          changeRelationship(p, "coachTrust", -8);
          p.morale = clamp(p.morale + 6, 0, 100);
        }
      },
      {
        id: "trust_team_doctors", icon: "🥗", label: "Licenzi il guru e torni alla dieta equilibrata del club",
        desc: "Ritrovi sintonia totale con i medici e i preparatori atletici della franchigia.",
        badge: "Staff felice +10 · Salute stabile", badgeTone: "good",
        apply: p => {
          changeRelationship(p, "coachTrust", 10);
        }
      }
    ]
  },
  {
    id: "teammate_painkiller_addiction",
    title: "Il Compagno e gli Antidolorifici",
    icon: "💊",
    tag: "Etica & Spogliatoio",
    text: "Scopri che il miglior difensore della squadra fa abuso segreto di potenti oppioidi per non sentire il dolore al ginocchio e giocare ogni gara. Ha sbalzi d'umore continui e trema prima della palla a due.",
    options: [
      {
        id: "intervene_doctor", icon: "🏥", label: "Lo convinci ad andare insieme dal medico sociale per farsi aiutare",
        desc: "Gli salvi la carriera e forse la vita. Salterà qualche partita, ma te ne sarà grato per sempre.",
        badge: "Vera leadership · Compagno salvato +16 · Coach +8", badgeTone: "up",
        apply: p => {
          changeRelationship(p, "chemistry", 16);
          changeRelationship(p, "coachTrust", 8);
          p.morale = clamp(p.morale + 6, 0, 100);
        }
      },
      {
        id: "cover_him_quietly", icon: "🤫", label: "Lo copri per non fargli perdere il posto in quintetto",
        desc: "Il segreto resta nascosto, ma il ragazzo peggiora a vista d'occhio partita dopo partita.",
        badge: "Patto d'omertà · Rischio salute gravissimo", badgeTone: "bad",
        apply: p => {
          changeRelationship(p, "chemistry", 4);
          p.morale = Math.max(0, p.morale - 6);
        }
      }
    ]
  },
  {
    id: "hidden_injury_free_agency",
    title: "Il Menisco alla Vigilia del Maxi-Rinnovamento",
    icon: "🩹",
    tag: "Contratto & Salute",
    text: "Manca un mese alla fine della stagione e sul tavolo hai offerte da 120 milioni per la prossima estate. Una risonanza magnetica privata rivela una micro-lesione al menisco: fermarsi ora farebbe scendere il tuo valore di mercato.",
    options: [
      {
        id: "surgery_now", icon: "🏥", label: "Ti operi subito: la salute e la longevità prima di tutto",
        desc: "Perdi qualche milione sul nuovo contratto, ma eviti danni permanenti all'articolazione.",
        badge: "Carriera salvaguardata · Contratto ridimensionato", badgeTone: "good",
        apply: p => {
          p.fragility = Math.max(0, p.fragility - 6);
          changeRelationship(p, "coachTrust", 6);
        }
      },
      {
        id: "play_on_torn_knee", icon: "💉", label: "Fasciatura rigida e giochi sul dolore per blindare i soldi",
        desc: "Firmi il contratto della vita a cifre record, ma il tuo ginocchio non sarà mai più lo stesso.",
        badge: "Guadagni blindati ++ · Fragilità permanente +12", badgeTone: "bad",
        apply: p => {
          p.wealth = roundMoney(p.wealth + Math.max(0.05, p.wealth * 0.08));
          p.fragility = clamp(p.fragility + 12, 0, 100);
        }
      }
    ]
  },

  // -------------------------------------------------------------
  // CATEGORIA 4: Spogliatoio Moderno & Generazione Z
  // -------------------------------------------------------------
  {
    id: "coach_bans_phones",
    title: "Il Coach Vieta gli Smartphone",
    icon: "📵",
    tag: "Spogliatoio & Regole",
    text: "Dopo tre sconfitte consecutive, il coach ritira tutti gli smartphone durante i pasti e i viaggi in aereo per favorire la concentrazione. I compagni più giovani minacciano un ammutinamento.",
    options: [
      {
        id: "back_the_coach", icon: "🤝", label: "Sostieni il coach: «Basta distrazioni, dobbiamo vincere»",
        desc: "Fai un discorso autorevole: i giovani sbuffano ma accettano la disciplina.",
        badge: "Coach +14 · Leadership +10 · Compagni compatti", badgeTone: "up",
        apply: p => {
          changeRelationship(p, "coachTrust", 14);
          changeRelationship(p, "chemistry", 6);
        }
      },
      {
        id: "side_with_young", icon: "📱", label: "Prendi le difese dei compagni: «Siamo professionisti, non bambini»",
        desc: "Acquisisci popolarità tra i ragazzi, ma crei una spaccatura insanabile con lo staff tecnico.",
        badge: "Compagni +10 · Coach furioso −14", badgeTone: "bad",
        apply: p => {
          changeRelationship(p, "chemistry", 10);
          changeRelationship(p, "coachTrust", -14);
        }
      }
    ]
  },
  {
    id: "crypto_trading_meeting",
    title: "Crypto e Trading durante la Seduta Video",
    icon: "📈",
    tag: "Spogliatoio & Focus",
    text: "Mentre il vice-allenatore spiega come marcare i pick-and-roll dei campioni in carica, ti accorgi che il playmaker titolare sta comprando e vendendo meme-coin sul telefono sotto la sedia.",
    options: [
      {
        id: "snatch_phone", icon: "🛑", label: "Gli sfili il telefono e gli sibili di concentrarsi",
        desc: "Gesto brusco da leader: il playmaker capisce la gravità e si mette a prendere appunti.",
        badge: "Concentrazione difesa · Coach soddisfatto +8", badgeTone: "up",
        apply: p => {
          changeRelationship(p, "coachTrust", 8);
          changeRelationship(p, "chemistry", 4);
        }
      },
      {
        id: "ask_crypto_tips", icon: "🤑", label: "A fine riunione gli chiedi consigli su cosa comprare",
        desc: "Risate e complicità tra voi, ma in campo la difesa sui pick-and-roll sarà un disastro.",
        badge: "Intesa privata +6 · Prestazione difensiva calata", badgeTone: "mid",
        apply: p => {
          changeRelationship(p, "chemistry", 6);
          changeRelationship(p, "coachTrust", -4);
        }
      }
    ]
  },
  {
    id: "players_only_meeting",
    title: "La Riunione a Porte Chiuse («Players Only»)",
    icon: "🔒",
    tag: "Leadership",
    text: "La squadra è in crisi nera con 6 sconfitte di fila. Convochi una riunione straordinaria senza allenatori né dirigenti: è il momento di dirsi le cose in faccia senza filtri.",
    options: [
      {
        id: "brutal_honesty", icon: "💥", label: "Dici la cruda verità a tutti: chi non difende va in panchina",
        desc: "Momenti di altissima tensione e urla, ma il gruppo si compatta con orgoglio e ritrova l'anima.",
        badge: "Chimica rinata +16 · Morale +10 · Svolta stagionale", badgeTone: "up",
        apply: p => {
          changeRelationship(p, "chemistry", 16);
          p.morale = clamp(p.morale + 10, 0, 100);
          changeRelationship(p, "coachTrust", 6);
        }
      },
      {
        id: "diplomatic_speech", icon: "🕊️", label: "Discorso motivazionale morbido per non urtare le superstar",
        desc: "Parole di circostanza che lasciano i problemi irrisolti: la tensione sotterranea rimane.",
        badge: "Nessun litigio · Nessuna svolta", badgeTone: "",
        apply: () => {}
      }
    ]
  },
  {
    id: "benched_veteran_drama",
    title: "Il Veterano Simbolo Sconfitto dalla Panchina",
    icon: "🪑",
    tag: "Spogliatoio & Gerarchie",
    text: "Il coach decide di togliere dal quintetto titolare il veterano trentasettenne simbolo della città per promuovere te. Il veterano svuota l'armadietto furente e rilascia interviste velenose.",
    options: [
      {
        id: "public_praise", icon: "👑", label: "Dedichi a lui ogni tua vittoria: «È il mio mentore e il mio idolo»",
        desc: "Dimostri classe infinita: il veterano ritrova il sorriso e accetta il passaggio del testimone.",
        badge: "Tifosi commossi +16 · Chimica +14 · Media entusiasti", badgeTone: "up",
        apply: p => {
          changeRelationship(p, "fansRapport", 16);
          changeRelationship(p, "chemistry", 14);
          changeRelationship(p, "mediaRapport", 10);
        }
      },
      {
        id: "harsh_reality", icon: "🧊", label: "«Il tempo passa per tutti, ora la squadra è sulle mie spalle»",
        desc: "Dichiarazione da cannibale: ti prendi la leadership con la forza, ma spacchi i cuori dei tifosi storici.",
        badge: "Tifosi feriti −12 · Reputazione da duro +8", badgeTone: "bad",
        apply: p => {
          changeRelationship(p, "fansRapport", -12);
          p.popularity = clamp(p.popularity + 8, 0, 100);
        }
      }
    ]
  },
  {
    id: "front_office_tanking",
    title: "L'Ordine Silenzioso di «Tankare»",
    icon: "📉",
    tag: "Dirigenza & Etica",
    text: "A 15 gare dal termine, il General Manager ti convoca in ufficio: «La stagione è andata. Se perdiamo queste ultime partite abbiamo il 14% di prendere la prima scelta al Draft. Rallenta i ritmi».",
    options: [
      {
        id: "refuse_tanking", icon: "⚔️", label: "«Io gioco per vincere ogni singola palla a due. Mai!»",
        desc: "Scendi sul parquet come un leone affamato e guidi la squadra a vittorie inaspettate.",
        badge: "Orgoglio assoluto · Tifosi in estasi +16 · GM deluso −12", badgeTone: "up",
        apply: p => {
          changeRelationship(p, "fansRapport", 16);
          changeRelationship(p, "coachTrust", 8);
          p.morale = clamp(p.morale + 10, 0, 100);
        }
      },
      {
        id: "accept_tanking", icon: "📉", label: "Accetti il piano a malincuore per avere un fenomeno al Draft l'anno dopo",
        desc: "Giochi a mezzo servizio senza forzare: sconfitte amare che però regalano una stella al draft estivo.",
        badge: "Futuro roster rinforzato · Morale −12 · Orgoglio ferito", badgeTone: "bad",
        apply: p => {
          p.morale = Math.max(0, p.morale - 12);
          changeRelationship(p, "fansRapport", -8);
        }
      }
    ]
  },
  {
    id: "practice_fistfight",
    title: "La Rissa Furibonda in Partitella",
    icon: "🥊",
    tag: "Spogliatoio",
    text: "Durante una partitella ad altissima intensità, volano gomitate e due compagni si picchiano selvaggiamente a terra. Un assistente ha filmato l'intera scena sul cellulare.",
    options: [
      {
        id: "bury_video_reconcile", icon: "🤝", label: "Fai cancellare il filmato e costringi i due a fare pace sotto la doccia",
        desc: "Salvi la squadra dallo scandalo mediatico e trasformi la rabbia in cattiveria agonistica.",
        badge: "Spogliatoio blindato +12 · Coach grato +10", badgeTone: "up",
        apply: p => {
          changeRelationship(p, "chemistry", 12);
          changeRelationship(p, "coachTrust", 10);
        }
      },
      {
        id: "leak_to_media", icon: "📱", label: "Il video trapela su TMZ Sport: scandalo nazionale",
        desc: "Un terremoto mediatico sconvolge la franchigia: multe salatissime e sospensioni.",
        badge: "Caos mediatico · Chimica distrutta −16", badgeTone: "down",
        apply: p => {
          changeRelationship(p, "chemistry", -16);
          changeRelationship(p, "mediaRapport", -10);
        }
      }
    ]
  },
  {
    id: "owner_spoiled_son",
    title: "Il Figlio del Proprietario in Rotazione",
    icon: "👔",
    tag: "Dirigenza & Giustizia",
    text: "Il figlio ventiduenne di uno dei soci di maggioranza della franchigia viene inserito nelle rotazioni per volere della proprietà, togliendo minuti a chi si allena duramente ogni giorno.",
    options: [
      {
        id: "speak_truth_gm", icon: "🛡️", label: "Vai dal General Manager e difendi il merito del gruppo",
        desc: "Ti esponi in prima persona per i compagni: il ragazzo torna in panchina e la squadra ti adora.",
        badge: "Eroe dello spogliatoio +14 · Dirigenza fredda −8", badgeTone: "up",
        apply: p => {
          changeRelationship(p, "chemistry", 14);
          changeRelationship(p, "coachTrust", 6);
        }
      },
      {
        id: "stay_quiet_polite", icon: "🤐", label: "Non ti intrometti negli affari della proprietà",
        desc: "Eviti inimicizie ai piani alti, ma lo spogliatoio perde fiducia nella meritocrazia.",
        badge: "Zero rischi personali · Malcontento interno −8", badgeTone: "bad",
        apply: p => {
          changeRelationship(p, "chemistry", -8);
        }
      }
    ]
  },

  // -------------------------------------------------------------
  // CATEGORIA 5: Etica, Scommesse & Regolamento in Campo
  // -------------------------------------------------------------
  {
    id: "gambling_heckler_arena",
    title: "L'Insulto del Tifoso sulla Scommessa Persa",
    icon: "🎰",
    tag: "Tifosi & Scommesse",
    text: "Mentre esci dal tunnel verso gli spogliatoi dopo una grande vittoria, un tifoso a bordo campo ti urla insulti feroci: «Maledetto, dovevi prendere 8 rimbalzi e ne hai presi 7, mi hai fatto perdere 5.000 dollari!».",
    options: [
      {
        id: "lecture_bettor", icon: "🗣️", label: "Ti fermi e lo guardi negli occhi: «Noi giochiamo per vincere, non per le tue scommesse»",
        desc: "La tua risposta diventa virale su TikTok: la lega e i campioni del basket plaudono alla tua fermezza.",
        badge: "Popolarità +10 · Rispetto globale +12", badgeTone: "up",
        apply: p => {
          p.popularity = clamp(p.popularity + 10, 0, 100);
          changeRelationship(p, "mediaRapport", 12);
        }
      },
      {
        id: "lose_temper", icon: "🤬", label: "Perdi le staffe e gli lanci la bottiglietta d'acqua",
        desc: "Scena bruttissima ripresa dai cellulari: multa salata dalla lega e polemiche furiose in TV.",
        badge: "Multa pesante · Media all'attacco −12", badgeTone: "down",
        apply: p => {
          p.wealth = roundMoney(Math.max(0, p.wealth - 0.025));
          changeRelationship(p, "mediaRapport", -12);
          changeRelationship(p, "coachTrust", -6);
        }
      },
      {
        id: "walk_away_smile", icon: "😎", label: "Sorridi con compassione ed entri nello spogliatoio a festeggiare",
        desc: "Superiore a ogni provocazione: ti godi la vittoria con i compagni.",
        badge: "Autocontrollo +8 · Morale sereno", badgeTone: "good",
        apply: p => {
          p.morale = clamp(p.morale + 4, 0, 100);
        }
      }
    ]
  },
  {
    id: "flopping_buzzer_beater",
    title: "La Simulazione («Flopping») al Secondo Finale",
    icon: "🎭",
    tag: "Campo & Etica",
    text: "Sotto di un punto a 1 secondo dalla fine di una partita punto a punto: ricevi sul perimetro, un avversario ti sfiora leggermente con la mano. Se ti butti all'indietro gridando, l'arbitro fischierà fallo e tirerai tre liberi.",
    options: [
      {
        id: "take_the_flop", icon: "🤸‍♂️", label: "Accentui platealmente la caduta e ottieni tre tiri liberi",
        desc: "Segni i liberi e vinci la gara. Sui social però i meme contro di te si sprecano: «Attore da Oscar!».",
        badge: "Vittoria in tasca · Tifosi rivali furiosi · Reputazione intaccata", badgeTone: "gold",
        apply: p => {
          p.morale = clamp(p.morale + 6, 0, 100);
          changeRelationship(p, "mediaRapport", -6);
          changeRelationship(p, "fansRapport", 8);
        }
      },
      {
        id: "shoot_fairly", icon: "🏀", label: "Non simuli e rilasci il tiro pulito contro la difesa",
        desc: "Gesto da vero campione d'onore: il rispetto degli avversari e degli arbitri per te è totale.",
        badge: "Puro basket · Rispetto avversari +12 · Onore", badgeTone: "up",
        apply: p => {
          changeRelationship(p, "coachTrust", 8);
          changeRelationship(p, "mediaRapport", 8);
        }
      }
    ]
  },
  {
    id: "save_stats_heave",
    title: "Il Tiro da 25 Metri che Sporca le Statistiche",
    icon: "🎯",
    tag: "Statistiche & Spirito di Squadra",
    text: "Scade il terzo quarto: hai la palla nella tua metà campo a 25 metri dal ferro con 1 secondo sul tabellone. Molti giocatori moderni non tirano per non abbassare la percentuale al tiro da tre punti.",
    options: [
      {
        id: "heave_the_ball", icon: "🚀", label: "Scagli la palla verso il canestro con tutta la forza",
        desc: "Il pallone sfiora la retina: la panchina esulta per lo spirito di sacrificio e la voglia di provarci.",
        badge: "Vero uomo squadra · Coach entusiasta +6 · Compagni +6", badgeTone: "up",
        apply: p => {
          changeRelationship(p, "coachTrust", 6);
          changeRelationship(p, "chemistry", 6);
        }
      },
      {
        id: "hold_ball_buzzer", icon: "🛑", label: "Trattieni il pallone fino a dopo la sirena e poi tiri",
        desc: "Proteggi la tua percentuale del 42% da tre per le statistiche avanzate, ma il coach scuote la testa.",
        badge: "Statistiche intatte · Coach deluso −4", badgeTone: "bad",
        apply: p => {
          changeRelationship(p, "coachTrust", -4);
        }
      }
    ]
  },
  {
    id: "court_brawl_bench",
    title: "La Rissa sul Parquet: Alzarsi dalla Panchina?",
    icon: "⛔",
    tag: "Regolamento & Fedeltà",
    text: "Mentre sei a riposare in panchina, un avversario stende a tradimento il tuo compagno più caro: scoppia una rissa furibonda. Il regolamento dice che se metti un solo piede sul parquet scatta la squalifica automatica.",
    options: [
      {
        id: "rush_defend_brother", icon: "⚔️", label: "Scatti sul parquet e ti metti in mezzo per proteggere il tuo compagno",
        desc: "Prendi un turno di squalifica, ma lo spogliatoio ti acclama come un fratello disposto a tutto.",
        badge: "Fratellanza eterna +18 · Squalifica 1 gara", badgeTone: "up",
        apply: p => {
          changeRelationship(p, "chemistry", 18);
          changeRelationship(p, "coachTrust", -4);
        }
      },
      {
        id: "hold_benchmates", icon: "🛑", label: "Trattieni i compagni in panchina: «Rispettiamo le regole, serviamo in campo!»",
        desc: "Maturità da veterano navigato: eviti squalifiche pesanti alla squadra prima dei playoff.",
        badge: "Coach +12 · Lucidità tattica", badgeTone: "good",
        apply: p => {
          changeRelationship(p, "coachTrust", 12);
        }
      }
    ]
  },
  {
    id: "postgame_handshake_rivals",
    title: "La Stretta di Mano dopo Gara 7 al Velenoso",
    icon: "🤝",
    tag: "Sportività & Fair Play",
    text: "Hai appena perso Gara 7 di finale di Conference contro i tuoi acerrimi rivali storici dopo una serie piena di colpi proibiti, provocazioni e insulti alle famiglie.",
    options: [
      {
        id: "shake_hands_class", icon: "🤝", label: "Raggiungi il centro del campo e stringi la mano alla loro star",
        desc: "Dimostri la nobiltà di un vero campione nella sconfitta: rispetto unanime del mondo dello sport.",
        badge: "Media in piedi +14 · Rispetto leggendario", badgeTone: "up",
        apply: p => {
          changeRelationship(p, "mediaRapport", 14);
          changeRelationship(p, "fansRapport", 8);
          p.morale = clamp(p.morale + 4, 0, 100);
        }
      },
      {
        id: "walk_off_tunnel", icon: "🚶‍♂️", label: "Tiri dritto nel tunnel degli spogliatoi senza voltarti",
        desc: "I tuoi tifosi più caldi apprezzano l'odio viscerale verso i rivali, ma i media ti danno del pessimo perdente.",
        badge: "Tifosi ultras fedeli +8 · Media critici −10", badgeTone: "mid",
        apply: p => {
          changeRelationship(p, "fansRapport", 8);
          changeRelationship(p, "mediaRapport", -10);
        }
      }
    ]
  },

  // -------------------------------------------------------------
  // CATEGORIA 6: Business, Contratti & Player Empowerment
  // -------------------------------------------------------------
  {
    id: "childhood_friend_agent",
    title: "L'Amico d'Infanzia che Vuole Fare l'Agente",
    icon: "💼",
    tag: "Business & Amicizia",
    text: "Il tuo migliore amico d'infanzia ha preso il patentino da procuratore e ti supplica di licenziare la tua potente agenzia newyorkese per farti rappresentare da lui nel prossimo rinnovo contrattuale.",
    options: [
      {
        id: "hire_friend", icon: "❤️", label: "Affidi la procura all'amico: la lealtà prima dei soldi",
        desc: "Fai felice il tuo fratello di vita, ma le trattative coi proprietari saranno molto più ardue.",
        badge: "Amicizia blindata · Contratti più rischiosi", badgeTone: "mid",
        apply: p => {
          p.morale = clamp(p.morale + 8, 0, 100);
        }
      },
      {
        id: "hire_for_lifestyle", icon: "🤝", label: "Mantieni l'agenzia d'élite e assumi l'amico come manager personale",
        desc: "La soluzione perfetta: l'agenzia ti strappa il contratto massimo e l'amico ha uno stipendio d'oro al tuo fianco.",
        badge: "Massimo guadagno · Amicizia felice · Serenità", badgeTone: "up",
        apply: p => {
          p.wealth = roundMoney(p.wealth + Math.max(0.02, p.wealth * 0.03));
          p.morale = clamp(p.morale + 8, 0, 100);
        }
      }
    ]
  },
  {
    id: "pay_cut_for_star",
    title: "Il Taglio allo Stipendio per Firmare un Amico All-Star",
    icon: "💰",
    tag: "Mercato & Titolo",
    text: "La franchigia ha la possibilità di ingaggiare una seconda stella All-Star sul mercato, ma per rientrare sotto il salary cap ti chiedono di ridurti lo stipendio del 15% per le prossime due stagioni.",
    options: [
      {
        id: "take_pay_cut", icon: "💍", label: "Accetti il taglio: vuoi costruire uno squadrone da titolo",
        desc: "Sacrificio da vero condottiero: la star firma e la città sogna l'anello di campioni.",
        badge: "Compagni +16 · Tifosi in visibilio +18 · Spogliatoio stellare", badgeTone: "gold",
        apply: p => {
          changeRelationship(p, "fansRapport", 18);
          changeRelationship(p, "chemistry", 16);
          p.popularity = clamp(p.popularity + 8, 0, 100);
        }
      },
      {
        id: "demand_full_max", icon: "💵", label: "Pretendi ogni centesimo: «I campioni si pagano fino all'ultimo dollaro»",
        desc: "Incassi il massimo salariale assoluto, ma la seconda stella firma altrove con i tuoi rivali.",
        badge: "Patrimonio massimo ++ · Rosa non rinforzata", badgeTone: "good",
        apply: p => {
          p.wealth = roundMoney(p.wealth + Math.max(0.04, p.wealth * 0.06));
        }
      }
    ]
  },
  {
    id: "cryptic_hourglass_tweet",
    title: "Il Tweet con la Clessidra (Richiesta di Cessione)",
    icon: "⏳",
    tag: "Mercato & Social",
    text: "La dirigenza non fa acquisti e la squadra stagna a metà classifica. Il tuo agente ti propone di twittare una semplice clessidra: «⏳». Il mondo capirà che il tuo tempo lì è agli sgoccioli.",
    options: [
      {
        id: "post_hourglass", icon: "💣", label: "Pubblichi la clessidra: panico totale tra i tifosi e in dirigenza",
        desc: "I media impazziscono, il palazzetto mormora e la società corre ai ripari per accontentarti.",
        badge: "Pressione sui vertici · Tifosi feriti −10 · Media scatenati +12", badgeTone: "bad",
        apply: p => {
          changeRelationship(p, "fansRapport", -10);
          changeRelationship(p, "mediaRapport", 12);
          changeRelationship(p, "coachTrust", -8);
        }
      },
      {
        id: "talk_in_private", icon: "🚪", label: "Vai direttamente nell'ufficio del proprietario a parlare a quattr'occhi",
        desc: "Faccia a faccia da uomini: esponi le tue richieste senza umiliare pubblicamente il club.",
        badge: "Rispetto societario +10 · Silenzio stampa", badgeTone: "up",
        apply: p => {
          changeRelationship(p, "coachTrust", 10);
        }
      }
    ]
  },
  {
    id: "all_star_tampering",
    title: "Il Patto Segreto all'All-Star Game",
    icon: "🌟",
    tag: "Mercato & Superstar",
    text: "Durante una cena privata durante il weekend delle stelle, altre due superstar ti propongono un patto per unirvi tutti e tre nella stessa squadra a New York o Los Angeles la prossima estate.",
    options: [
      {
        id: "join_superteam", icon: "🤝", label: "Stringi il patto segreto: formerete una corazzata imbattibile",
        desc: "Nasce una super-squadra che dominerà la lega per i prossimi anni.",
        badge: "Futuro da titolo · Tradimento tifosi attuali", badgeTone: "gold",
        apply: p => {
          p.morale = clamp(p.morale + 8, 0, 100);
        }
      },
      {
        id: "stay_loyal_franchise", icon: "🛡️", label: "«Grazie, ma voglio vincere qui dove mi hanno cresciuto»",
        desc: "Rifiuti la scorciatoia: scegli la via dei campioni leggendari e fedeli alla loro terra.",
        badge: "Leggenda eterna · Tifosi fedeli +14", badgeTone: "up",
        apply: p => {
          changeRelationship(p, "fansRapport", 14);
          p.morale = clamp(p.morale + 6, 0, 100);
        }
      }
    ]
  },
  {
    id: "sovereign_wealth_tour",
    title: "Il Tour Promozionale nei Fondi Sovrani",
    icon: "🌍",
    tag: "Sponsor & Etica",
    text: "Un fondo sovrano mediorientale ti offre 2 milioni di dollari netti per disputare un'esibizione promozionale di due giorni a dicembre. Molti attivisti ti chiedono di boicottare l'evento per i diritti civili.",
    options: [
      {
        id: "take_millions", icon: "💰", label: "Accetti l'offerta: «Sono un atleta, non un politico»",
        desc: "Incassi una cifra spaventosa, ma subisci critiche feroci da parte dei giornali progressisti.",
        badge: "Patrimonio +++ · Media all'attacco −10", badgeTone: "gold",
        apply: p => {
          p.wealth = roundMoney(p.wealth + Math.max(0.06, p.wealth * 0.08));
          changeRelationship(p, "mediaRapport", -10);
        }
      },
      {
        id: "decline_civil_rights", icon: "🕊️", label: "Rifiuti apertamente difendendo i diritti universali",
        desc: "Rinunci a due milioni: la tua voce risuona come un faro di integrità ed etica.",
        badge: "Rispetto universale +16 · Tifosi fieri +12", badgeTone: "up",
        apply: p => {
          changeRelationship(p, "fansRapport", 12);
          changeRelationship(p, "mediaRapport", 14);
          p.popularity = clamp(p.popularity + 8, 0, 100);
        }
      }
    ]
  },

  // -------------------------------------------------------------
  // CATEGORIA 7: Famiglia, Amore & Solidarietà
  // -------------------------------------------------------------
  {
    id: "game_seven_childbirth",
    title: "Il Parto durante Gara 7 delle Finali",
    icon: "👶",
    tag: "Famiglia & Basket",
    requiresPartner: true,
    text: "La tua partner entra in travaglio per dare alla luce il vostro primogenito poche ore prima della decisiva Gara 7 di finale. Se prendi l'aereo per raggiungerla lascerai la squadra senza la sua stella.",
    options: [
      {
        id: "fly_to_birth", icon: "👨‍👩‍👦", label: "Prendi il primo volo e stai al suo fianco durante il parto",
        desc: "Vedi nascere tuo figlio tenendo la mano della tua compagna. La squadra perde la gara, ma la vita viene prima.",
        badge: "Partner al settimo cielo +25 · Tifosi divisi · Padre esemplare", badgeTone: "up",
        apply: p => {
          changeRelationship(p, "harmony", 25);
          p.morale = clamp(p.morale + 16, 0, 100);
          changeRelationship(p, "fansRapport", -6);
        }
      },
      {
        id: "play_game_seven", icon: "🏆", label: "Scendi in campo, giochi la partita della vita e voli da loro subito dopo",
        desc: "Trascini la squadra al titolo tra le lacrime e arrivi in ospedale con il trofeo in mano.",
        badge: "Campione epico +20 · Partner provata ma fiera", badgeTone: "gold",
        apply: p => {
          p.morale = clamp(p.morale + 12, 0, 100);
          changeRelationship(p, "fansRapport", 20);
          changeRelationship(p, "chemistry", 16);
        }
      }
    ]
  },
  {
    id: "greedy_relatives",
    title: "I Parenti che Chiedono Soldi per Debiti",
    icon: "💸",
    tag: "Famiglia & Patrimonio",
    text: "Parenti che non sentivi da dieci anni si presentano alla tua villa chiedendo 150.000$ per ripianare debiti di gioco e investimenti sballati, minacciando di raccontare falsità sui giornali.",
    options: [
      {
        id: "say_no_firmly", icon: "🛑", label: "Dici un no categorico e assumi guardie private",
        desc: "Proteggi il tuo patrimonio conquistato col sudore, recidendo i rami secchi tossici.",
        badge: "Patrimonio protetto · Serenità mentale ritrovata", badgeTone: "good",
        apply: p => {
          p.morale = clamp(p.morale + 4, 0, 100);
        }
      },
      {
        id: "pay_out_guilt", icon: "💵", label: "Paghi per non avere drammi e chiudere la questione",
        desc: "Compri la loro assenza a caro prezzo: i soldi spariscono e la voce di corridoio gira.",
        badge: "Perdita economica · Rischio ulteriori ricatti", badgeTone: "bad",
        apply: p => {
          p.wealth = roundMoney(Math.max(0, p.wealth - 0.02));
        }
      }
    ]
  },
  {
    id: "paparazzi_blackmail",
    title: "Il Ricatto del Paparazzo",
    icon: "📸",
    tag: "Gossip & Scandalo",
    text: "Un paparazzo ti ricatta: ha fotografie compromettenti di una tua notte brava e minaccia di venderle ai tabloid a meno che tu non versi 50.000$ entro 24 ore.",
    options: [
      {
        id: "call_police", icon: "🚔", label: "Denunci immediatamente l'estorsione alla polizia",
        desc: "Il paparazzo viene arrestato in flagranza di reato. La notizia esce, ma tu sei la vittima della vicenda.",
        badge: "Giustizia trionfa · Media +8 · Rispetto", badgeTone: "up",
        apply: p => {
          changeRelationship(p, "mediaRapport", 8);
          p.morale = clamp(p.morale + 6, 0, 100);
        }
      },
      {
        id: "pay_blackmail", icon: "🤫", label: "Paghi in segreto per distruggere i negativi",
        desc: "Le foto spariscono per sempre, ma resti con l'ansia che qualcun altro possa farti lo stesso giochetto.",
        badge: "Scandalo evitato · Perdita economica", badgeTone: "mid",
        apply: p => {
          p.wealth = roundMoney(Math.max(0, p.wealth - 0.015));
        }
      }
    ]
  },
  {
    id: "brother_supercar_arrest",
    title: "Tuo Fratello Minore con la Tua Supercar",
    icon: "🚔",
    tag: "Famiglia & Legge",
    text: "Tuo fratello minore viene fermato alle tre di notte alla guida della tua Lamborghini senza patente e in stato di ebbrezza. Sei chiamato d'urgenza in commissariato con i cronisti già appostati all'ingresso.",
    options: [
      {
        id: "protect_brother_public", icon: "🛡️", label: "Ti assumi la responsabilità: «Colpa mia che gli ho lasciato le chiavi»",
        desc: "Attiri su di te il fuoco mediatico per salvare il futuro di tuo fratello. Lui scoppia in lacrime.",
        badge: "Fratello salvato · Media all'attacco −10 · Coach deluso −4", badgeTone: "mid",
        apply: p => {
          changeRelationship(p, "mediaRapport", -10);
          changeRelationship(p, "coachTrust", -4);
        }
      },
      {
        id: "tough_love", icon: "⚖️", label: "Lasci che la legge faccia il suo corso: deve imparare a crescere",
        desc: "Lezione dura ma giusta: tuo fratello svolgerà lavori socialmente utili e capirà i suoi errori.",
        badge: "Maturità esemplare · Media comprensivi +8", badgeTone: "good",
        apply: p => {
          changeRelationship(p, "mediaRapport", 8);
        }
      }
    ]
  },
  {
    id: "anonymous_hospital_donation",
    title: "Il Reparto Ospedaliero: Donazione Anonima o Campagna PR?",
    icon: "🏥",
    tag: "Solidarietà & Etica",
    text: "Decidi di donare 500.000$ per rinnovare l'intero reparto pediatrico dell'ospedale cittadino. La tua agenzia ti spinge a convocare una conferenza stampa mondiale col logo del tuo sponsor.",
    options: [
      {
        id: "pure_anonymous", icon: "🕊️", label: "Donazione rigorosamente anonima: la bontà non si sbandiera",
        desc: "Gesto purissimo di cuore che ti riempie l'anima di gioia e pace interiore.",
        badge: "Pace interiore · Morale +14 · Karma al massimo", badgeTone: "up",
        apply: p => {
          p.wealth = roundMoney(Math.max(0, p.wealth - 0.03));
          p.morale = clamp(p.morale + 14, 0, 100);
        }
      },
      {
        id: "public_campaign", icon: "📢", label: "Grande evento mediatico per ispirare altri donatori a contribuire",
        desc: "Raddoppi i fondi raccolti grazie all'eco mediatica: diventi l'eroe civico della comunità.",
        badge: "Tifosi +16 · Popolarità +12 · Città in festa", badgeTone: "gold",
        apply: p => {
          p.wealth = roundMoney(Math.max(0, p.wealth - 0.03));
          changeRelationship(p, "fansRapport", 16);
          p.popularity = clamp(p.popularity + 12, 0, 100);
        }
      }
    ]
  },
  {
    id: "partner_hates_city",
    title: "La Tua Compagna Odia la Città",
    icon: "❄️",
    tag: "Coppia & Carriera",
    requiresPartner: true,
    text: "Giochi in una città fredda e nebbiosa. La tua partner soffre di forte depressione e isolamento sociale: piangendo ti supplica di chiedere una trade a Miami, Los Angeles o una metropoli calda.",
    options: [
      {
        id: "request_trade_for_love", icon: "💍", label: "Chiedi la cessione alla dirigenza: il suo sorriso vale più di ogni canestro",
        desc: "Mettere la persona che ami al primo posto: il vostro legame diventa indissolubile.",
        badge: "Amore eterno +20 · Tifosi traditi −14", badgeTone: "good",
        apply: p => {
          changeRelationship(p, "harmony", 20);
          changeRelationship(p, "fansRapport", -14);
        }
      },
      {
        id: "stay_buy_villa", icon: "☀️", label: "Le compri una seconda casa al caldo e le organizzi viaggi frequenti",
        desc: "Investimento economico per garantirle benessere senza interrompere la tua missione sportiva.",
        badge: "Compromesso di lusso · Spesa consistente", badgeTone: "mid",
        apply: p => {
          p.wealth = roundMoney(Math.max(0, p.wealth - 0.04));
          changeRelationship(p, "harmony", 10);
        }
      }
    ]
  },
  {
    id: "childhood_playground_demolition",
    title: "Il Campetto d'Infanzia che Sta per Essere Raso al Suolo",
    icon: "🏗️",
    tag: "Radici & Solidarietà",
    text: "Il campetto pubblico di periferia dove a dodici anni hai tirato i tuoi primi palloni sta per essere demolito da una multinazionale immobiliare per costruire un parcheggio a pagamento.",
    options: [
      {
        id: "buy_playground", icon: "🏀", label: "Compri il terreno a tue spese e ci costruisci un'arena pubblica gratuita",
        desc: "Regali un sogno a migliaia di ragazzini del quartiere: il campetto viene intitolato a tuo nome.",
        badge: "Eroe immortale della gente +20 · Popolarità +14", badgeTone: "gold",
        apply: p => {
          p.wealth = roundMoney(Math.max(0, p.wealth - 0.035));
          changeRelationship(p, "fansRapport", 20);
          p.popularity = clamp(p.popularity + 14, 0, 100);
          p.morale = clamp(p.morale + 10, 0, 100);
        }
      },
      {
        id: "social_petition", icon: "📱", label: "Lanci un appello social e una petizione al sindaco",
        desc: "Mobiliti l'opinione pubblica senza spendere una fortuna: la demolizione viene sospesa.",
        badge: "Tifosi +10 · Popolarità +6", badgeTone: "up",
        apply: p => {
          changeRelationship(p, "fansRapport", 10);
          p.popularity = clamp(p.popularity + 6, 0, 100);
        }
      }
    ]
  },
  {
    id: "rap_diss_track",
    title: "Il Dissing Rap della Stella Avversaria",
    icon: "🎧",
    tag: "Musica & Rivalità",
    text: "La stella della squadra rivale pubblica una canzone trap con rime velenose dedicate a te e al tuo stile di gioco: «Tira solo mattoni e piange con gli arbitri». Il brano è primo nelle classifiche Spotify.",
    options: [
      {
        id: "respond_on_court", icon: "🏀", label: "«Gli risponderò sul parquet venerdì sera»: zero parole, solo fatti",
        desc: "Carichi la partita di un'aura leggendaria. Metti a segno 35 punti dominando il duello.",
        badge: "Prestazione epica +12 · Rispetto supremo +16", badgeTone: "up",
        apply: p => {
          changeRelationship(p, "mediaRapport", 16);
          changeRelationship(p, "fansRapport", 14);
          p.morale = clamp(p.morale + 10, 0, 100);
        }
      },
      {
        id: "drop_counter_diss", icon: "🎤", label: "Entri in studio di registrazione e pubblichi un dissing di risposta",
        desc: "Sbalordisci tutti con un flow tagliente: il web impazzisce per il beef musicale dell'anno.",
        badge: "Viralità record · Popolarità +18 · Coach perplesso −6", badgeTone: "gold",
        apply: p => {
          p.popularity = clamp(p.popularity + 18, 0, 100);
          changeRelationship(p, "coachTrust", -6);
        }
      }
    ]
  },
  {
    id: "teammate_weapon_bus",
    title: "L'Oggetto Proibito sul Bus della Squadra",
    icon: "⚠️",
    tag: "Spogliatoio & Legalità",
    text: "Mentre siete sul bus societario, un compagno tira fuori dallo zaino un'arma da fuoco non registrata per fare il gradasso con i compagni più giovani.",
    options: [
      {
        id: "confiscate_call_out", icon: "🛑", label: "Lo affronti con furia: «O la metti via subito o ti sbatto fuori io»",
        desc: "Intervento duro da vero leader: eviti una tragedia e una catastrofe legale per la franchigia.",
        badge: "Tragedia evitata · Coach +14 · Chimica salva", badgeTone: "up",
        apply: p => {
          changeRelationship(p, "coachTrust", 14);
          changeRelationship(p, "chemistry", 8);
        }
      },
      {
        id: "tell_front_office", icon: "📞", label: "Avverti immediatamente il responsabile della sicurezza della squadra",
        desc: "La franchigia sospende il giocatore. Lo spogliatoio si divide sull'aver fatto la spia.",
        badge: "Sicurezza garantita · Compagni divisi −8", badgeTone: "mid",
        apply: p => {
          changeRelationship(p, "coachTrust", 12);
          changeRelationship(p, "chemistry", -8);
        }
      }
    ]
  },
  {
    id: "nft_crypto_collapse",
    title: "La Collezione NFT Crollata a Zero",
    icon: "📉",
    tag: "Finanza & Tifosi",
    text: "L'anno scorso hai promosso una collezione di figurine digitali (NFT) garantendo ai fan che avrebbero aumentato di valore. La piattaforma è fallita e centinaia di tuoi tifosi hanno perso i loro risparmi.",
    options: [
      {
        id: "refund_fans_pocket", icon: "💰", label: "Rimborsi i piccoli investitori di tasca tua (150.000$)",
        desc: "Gesto di un'onestà disarmante: perdi denaro ma salvi la tua anima e l'affetto della tua gente.",
        badge: "Integrità assoluta +20 · Tifosi commossi · Spesa", badgeTone: "up",
        apply: p => {
          p.wealth = roundMoney(Math.max(0, p.wealth - 0.03));
          changeRelationship(p, "fansRapport", 20);
          p.popularity = clamp(p.popularity + 10, 0, 100);
        }
      },
      {
        id: "corporate_statement", icon: "💼", label: "«Ero solo un testimonial, rivolgetevi ai tribunali»",
        desc: "Dichiarazione fredda redatta dagli avvocati: la legge ti tutela, ma i tifosi si sentono traditi.",
        badge: "Soldi intatti · Tifosi delusi −14", badgeTone: "bad",
        apply: p => {
          changeRelationship(p, "fansRapport", -14);
          changeRelationship(p, "mediaRapport", -8);
        }
      }
    ]
  },
  {
    id: "saudi_megadeal_offer",
    title: "L'Offerta Faraonica da 80 Milioni all'Anno",
    icon: "🇸🇦",
    tag: "Mercato & Carriera",
    text: "Un emissario di un club arabo ti presenta un contratto irripetibile: 80 milioni di dollari a stagione per lasciare il basket occidentale e diventare la stella del campionato locale.",
    options: [
      {
        id: "take_generational_bag", icon: "💰", label: "Accetti l'offerta: garantisci ricchezza a 5 generazioni",
        desc: "Diventi uno degli atleti più pagati al mondo, salutando per sempre il basket che conta.",
        badge: "Ricchezza generazionale +++ · Competizione abbandonata", badgeTone: "gold",
        apply: p => {
          p.wealth = roundMoney(p.wealth + Math.max(0.08, p.wealth * 0.12));
          p.morale = clamp(p.morale + 10, 0, 100);
        }
      },
      {
        id: "stay_for_glory", icon: "🏆", label: "«I sogni non si comprano»: vuoi il trofeo più prestigioso al mondo",
        desc: "Rifiuti la montagna d'oro per continuare a scrivere la storia dello sport.",
        badge: "Leggenda romantica dello sport +18 · Tifosi pazzi di gioia", badgeTone: "up",
        apply: p => {
          changeRelationship(p, "fansRapport", 18);
          changeRelationship(p, "mediaRapport", 14);
          p.morale = clamp(p.morale + 10, 0, 100);
        }
      }
    ]
  },
  {
    id: "coach_fine_solidarity",
    title: "La Maxi-Multa del Coach e la Solidarietà",
    icon: "🧑‍🏫",
    tag: "Coach & Squadra",
    text: "Dopo un arbitraggio scandaloso, il tuo allenatore ha difeso la squadra in conferenza stampa prendendosi 35.000$ di multa dalla lega. Lo stipendio del coach è modesto rispetto a quello dei giocatori.",
    options: [
      {
        id: "pay_coach_fine", icon: "🤝", label: "Paghi tu la multa a sorpresa: «Ha lottato per noi»",
        desc: "Il coach scoppia in lacrime per la gratitudine: per lui sarai sempre il suo capitano morale.",
        badge: "Fiducia Coach +20 · Stima spogliatoio +12", badgeTone: "up",
        apply: p => {
          p.wealth = roundMoney(Math.max(0, p.wealth - 0.008));
          changeRelationship(p, "coachTrust", 20);
          changeRelationship(p, "chemistry", 12);
        }
      },
      {
        id: "mind_own_business", icon: "🤐", label: "Non intervieni: ognuno risponde delle proprie parole",
        desc: "Mantieni i tuoi soldi, ma perdi l'occasione di compiere un gesto di leadership memorabile.",
        badge: "Nessun impatto", badgeTone: "",
        apply: () => {}
      }
    ]
  },
  {
    id: "rookie_heartbroken",
    title: "Il Rookie col Cuore Spezzato a Poche Ore dal Match",
    icon: "💔",
    tag: "Spogliatoio & Mentoring",
    text: "Trovi la matricola della squadra in lacrime nello spogliatoio: la fidanzata storica lo ha appena lasciato al telefono prima della sua prima partita da titolare in carriera.",
    options: [
      {
        id: "pep_talk_hug", icon: "🫂", label: "Lo abbracci, gli parli col cuore e lo carichi: «Stasera giochi per te stesso!»",
        desc: "Il ragazzo asciuga le lacrime e gioca la partita della vita: nasce un legame fraterno speciale.",
        badge: "Chimica +16 · Morale di squadra +10 · Fratellanza", badgeTone: "up",
        apply: p => {
          changeRelationship(p, "chemistry", 16);
          p.morale = clamp(p.morale + 8, 0, 100);
        }
      },
      {
        id: "tough_reprimand", icon: "🧊", label: "«Siamo professionisti, i problemi di cuore restano fuori»",
        desc: "Durezza militare: il ragazzo entra in campo bloccato dall'ansia e sbaglia tutto.",
        badge: "Rookie spento −10 · Spogliatoio freddo", badgeTone: "bad",
        apply: p => {
          changeRelationship(p, "chemistry", -10);
        }
      }
    ]
  },
  {
    id: "fan_skin_tattoo_signature",
    title: "L'Autografo sul Braccio del Super-Fan",
    icon: "🖋️",
    tag: "Tifosi & Passione",
    text: "Un giovane tifoso disabile ti aspetta per ore sotto la pioggia con un pennarello indelebile: «Firmami il braccio, vado dritto dal tatuatore per inciderlo sulla mia pelle per sempre!».",
    options: [
      {
        id: "sign_and_gift", icon: "❤️", label: "Gli firmi il braccio e gli regali anche la tua canotta da gara",
        desc: "Il ragazzo scoppia in un pianto di felicità incontenibile: il video commuove l'intero web.",
        badge: "Momento strappalacrime · Tifosi in adorazione +18 · Popolarità +10", badgeTone: "up",
        apply: p => {
          changeRelationship(p, "fansRapport", 18);
          p.popularity = clamp(p.popularity + 10, 0, 100);
          p.morale = clamp(p.morale + 6, 0, 100);
        }
      },
      {
        id: "sign_only_card", icon: "🎴", label: "«Non rovinarti la pelle: ti firmo il cappellino e la figurina»",
        desc: "Un consiglio protettivo da fratello maggiore: il fan apprezza la tua premura.",
        badge: "Tifosi +8 · Saggezza", badgeTone: "good",
        apply: p => {
          changeRelationship(p, "fansRapport", 8);
        }
      }
    ]
  },
  {
    id: "mascot_viral_prank",
    title: "Lo Scherzo Estremo alla Mascotte",
    icon: "🦁",
    tag: "Spogliatoio & Humor",
    text: "Durante il riscaldamento, per fare una gag virale per i social, fingi un placcaggio da football sulla mascotte della squadra. La mascotte cade goffamente e si fa male alla spalla.",
    options: [
      {
        id: "apologize_mascot", icon: "💐", label: "Vai in ospedale con fiori e paghi tutte le cure mediche",
        desc: "Ti prendi la colpa senza scuse: l'attore nella maschera ti perdona e diventate grandi amici.",
        badge: "Gaffe perdonata · Tifosi rassicurati +6", badgeTone: "good",
        apply: p => {
          p.wealth = roundMoney(Math.max(0, p.wealth - 0.005));
          changeRelationship(p, "fansRapport", 6);
        }
      },
      {
        id: "laugh_it_off", icon: "😆", label: "Condividi il video definendolo l'highlight più divertente dell'anno",
        desc: "Le associazioni a tutela dei lavoratori della franchigia protestano per il comportamento irrispettoso.",
        badge: "Critiche interne −8 · Media polemici", badgeTone: "bad",
        apply: p => {
          changeRelationship(p, "fansRapport", -8);
          changeRelationship(p, "coachTrust", -4);
        }
      }
    ]
  },
  {
    id: "rare_vintage_sneakers_bust",
    title: "Le Sneaker Vintage da Collezione Esplodono in Partita",
    icon: "👟",
    tag: "Sneakers & Curiosità",
    text: "Decidi di scendere in campo con un paio di costosissime sneaker vintage del 1998 comprate all'asta per 40.000$. Nel terzo quarto, su un cambio di direzione violento, la suola si scolla completamente.",
    options: [
      {
        id: "laugh_swap_bench", icon: "😂", label: "Ridi della figuraccia, baci la scarpa e ne metti un paio moderno",
        desc: "Autoironia da campione: la foto della scarpa rotta fa il giro del pianeta tra gli appassionati.",
        badge: "Popolarità virale +8 · Tifosi divertiti +6", badgeTone: "good",
        apply: p => {
          p.popularity = clamp(p.popularity + 8, 0, 100);
          changeRelationship(p, "fansRapport", 6);
        }
      },
      {
        id: "kick_shoe_anger", icon: "🤬", label: "Calci la scarpa verso la panchina furioso per la distrazione",
        desc: "Il coach ti richiama all'ordine: «Meno sfilate di moda e più testa sul piano gara».",
        badge: "Coach stizzito −6", badgeTone: "bad",
        apply: p => {
          changeRelationship(p, "coachTrust", -6);
        }
      }
    ]
  },
  {
    id: "unauthorized_energy_drink",
    title: "L'Energy Drink Fai-da-Te della Superstar",
    icon: "🧪",
    tag: "Salute & Squadra",
    text: "Il capitano della squadra produce un energy drink artigianale non certificato dalla lega e lo distribuisce ai compagni prima del quarto periodo: «Questo ti fa volare senza stancarti mai».",
    options: [
      {
        id: "refuse_substance", icon: "💧", label: "«Io bevo solo acqua e integratori approvati dal club»",
        desc: "Professionalità inattaccabile: eviti qualsiasi rischio di contaminazione da doping.",
        badge: "Zero rischi salute · Coach fiero +8", badgeTone: "up",
        apply: p => {
          changeRelationship(p, "coachTrust", 8);
        }
      },
      {
        id: "drink_with_captain", icon: "🥤", label: "Lo bevi per non sembrare il guastafeste del gruppo",
        desc: "Una carica di caffeina esagerata: giochi su di giri, ma il giorno dopo hai tachicardia.",
        badge: "Intesa capitano +6 · Fragilità +4", badgeTone: "mid",
        apply: p => {
          changeRelationship(p, "chemistry", 6);
          p.fragility = clamp(p.fragility + 4, 0, 100);
        }
      }
    ]
  },
  {
    id: "vegas_allstar_party",
    title: "La Notte Brava a Las Vegas durante la Sosta",
    icon: "🎰",
    tag: "Lifestyle & Notti",
    text: "Durante la sosta di quattro giorni della stagione, voli con alcuni compagni a Las Vegas. La festa si protrae fino all'alba tra champagne e tavoli da roulette a 48 ore dal rientro agli allenamenti.",
    options: [
      {
        id: "leave_early_flight", icon: "✈️", label: "Prendi un aereo anticipato e torni a dormire a casa",
        desc: "Ti godi la serata senza esagerare: arrivi al primo allenamento riposato e tonico.",
        badge: "Autocontrollo +6 · Stamina al top", badgeTone: "good",
        apply: p => {
          p.morale = clamp(p.morale + 4, 0, 100);
        }
      },
      {
        id: "double_down_vegas", icon: "🍾", label: "Resti fino all'ultimo secondo spendendo cifre folli",
        desc: "Momenti leggendari che cementano l'amicizia con i compagni, ma perdi soldi e arrivi distrutto.",
        badge: "Spogliatoio affiatato +10 · Stamina −12 · Spesa", badgeTone: "bad",
        apply: p => {
          p.wealth = roundMoney(Math.max(0, p.wealth - 0.02));
          changeRelationship(p, "chemistry", 10);
          p.stamina = Math.max(0, p.stamina - 12);
        }
      }
    ]
  }
];

/* Helper per ottenere la lista completa di tutti i dilemmi disponibili */
function getAllDilemmas() {
  const base = typeof MORAL_DILEMMAS !== "undefined" ? MORAL_DILEMMAS : [];
  return [...base, ...MODERN_DILEMMAS];
}
