"use strict";

/* ================================================================
   IMPREVISTI & PROBABILITÀ DI FINE STAGIONE (offseason)
   Alla fine di ogni stagione, prima delle scelte di mercato e della
   progressione annuale, viene estratto e applicato 1 evento estivo.
   Gli eventi con esito incerto tirano un dado virtuale internamente
   e mostrano direttamente il risultato finale.
   ================================================================ */
function rollChance(pct) { return Math.random() * 100 < pct; }
/* Gli importi sono in milioni: sotto il milione si arrotonda al migliaio e si mostra in migliaia
   (in ITA-3 uno stipendio vero è di qualche decina di migliaia di euro) */
function roundMoney(v) { return Math.abs(v) < 1 ? Math.round(v * 1000) / 1000 : round1(v); }
function fmtMoney(v, currency) {
  const cur = currency || "€";
  return Math.abs(v) < 1 && v !== 0 ? `${Math.round(v * 1000)}k${cur}` : `${round1(v)} M${cur}`;
}
function playerCurrency(p) { return (p.contract && p.contract.currency) || "€"; }

/* Mutatori che applicano l'effetto e registrano la conseguenza leggibile */
function chOverall(p, delta, out) {
  p.overall = clamp(p.overall + delta, 40, 99);
  progressAttributes(p, delta);
  out.consequences.push(`Overall ${delta >= 0 ? "+" : ""}${delta} → ${p.overall}`);
}
function chAttr(p, key, delta, out, label) {
  p.attrs[key] = clamp(p.attrs[key] + delta, 30, 99);
  out.consequences.push(`${label} ${delta >= 0 ? "+" : ""}${delta} → ${p.attrs[key]}`);
}
function chMeter(p, key, delta, out, label) {
  p[key] = clamp(p[key] + delta, 0, 100);
  out.consequences.push(`${label} ${delta >= 0 ? "+" : ""}${delta} → ${p[key]}`);
}
function chWealth(p, delta, out) {
  p.wealth = Math.max(0, roundMoney(p.wealth + delta));
  const cur = playerCurrency(p);
  out.consequences.push(`Patrimonio ${delta >= 0 ? "+" : "−"}${fmtMoney(Math.abs(delta), cur)} → ${fmtMoney(p.wealth, cur)}`);
}
function chSponsor(p, delta, out) {
  p.sponsorIncome = Math.max(0, roundMoney(p.sponsorIncome + delta));
  const cur = playerCurrency(p);
  out.consequences.push(`Sponsor ${delta >= 0 ? "+" : "−"}${fmtMoney(Math.abs(delta), cur)}/anno → ${fmtMoney(p.sponsorIncome, cur)}/anno`);
}
function benchNextSeason(p, out, reason) {
  p.seasonModifiers.benched = true;
  out.consequences.push(reason || "Prossima stagione al via dalla panchina");
}
function forceTransfer(p, out) {
  p.seasonModifiers.forcedTransfer = true;
  out.consequences.push("Inserito nella lista trasferimenti: nessun rinnovo possibile col club attuale");
}

const OFFSEASON_EVENTS = [
  /* ---------------- FISICO & PREPARAZIONE ---------------- */
  {
    category: "Fisico & Preparazione", title: "Workout intensivo e dieta estrema", weight: 12,
    chance: 60, goodLabel: "Trasformazione fisica", badLabel: "Affaticamento cronico",
    preview: "Estate chiusa in palestra con un preparatore atletico privato e una dieta durissima, per presentarsi al training camp trasformato.",
    run(p, out) {
      out.narrative = "Estate chiuso in palestra con un preparatore atletico privato e una dieta durissima, per presentarsi al training camp trasformato.";
      const ok = rollChance(60);
      out.rollText = `Preparazione estrema — 60% riuscita · esito: ${ok ? "SUCCESSO" : "FALLIMENTO"}`;
      if (ok) { out.tone = "positive"; chOverall(p, 3, out); chAttr(p, "athleticism", 2, out, "Atletismo"); chMeter(p, "morale", 5, out, "Morale"); }
      else { out.tone = "negative"; chOverall(p, -2, out); out.consequences.push("Affaticamento cronico: carichi ridotti in preseason"); chMeter(p, "morale", -5, out, "Morale"); }
    }
  },
  {
    category: "Fisico & Preparazione", title: "Intervento chirurgico e riabilitazione", weight: 8,
    when: p => p.age >= 27 || p.overall < 68,
    chance: 50, goodLabel: "Rinascita fisica", badLabel: "Complicazioni",
    preview: "Lo staff medico consiglia un intervento per risolvere un fastidio che si trascina da mesi.",
    run(p, out) {
      out.narrative = "Lo staff medico consiglia un intervento per risolvere un fastidio che si trascina da mesi. Il giocatore accetta di operarsi a inizio estate.";
      const ok = rollChance(50);
      out.rollText = `Esito operazione — 50% rinascita fisica · esito: ${ok ? "RIUSCITA PIENA" : "COMPLICAZIONI"}`;
      if (ok) { out.tone = "positive"; chOverall(p, 2, out); chAttr(p, "athleticism", 3, out, "Atletismo"); }
      else { out.tone = "negative"; chOverall(p, -4, out); benchNextSeason(p, out, "Stop prolungato: rientro a stagione iniziata, dalla panchina"); chMeter(p, "morale", -8, out, "Morale"); }
    }
  },
  {
    category: "Fisico & Preparazione", title: "Incidente domestico bizzarro", weight: 8,
    run(p, out) {
      const mishap = choice([
        "Scivola nella doccia di casa e rimedia una brutta distorsione al polso.",
        "Cade dal monopattino elettrico durante una vacanza e si procura una contusione seria.",
        "Si infortuna giocando a calcetto con gli amici del quartiere.",
        "Un incidente in cucina gli costa dei punti di sutura e due settimane di stop.",
      ]);
      out.narrative = mishap + " La società non la prende benissimo.";
      out.tone = "negative";
      out.rollText = null;
      chOverall(p, -2, out);
      benchNextSeason(p, out, "Salta il training camp: si parte dalla panchina");
    }
  },
  {
    category: "Fisico & Preparazione", title: "Lavoro tecnico mirato", weight: 10,
    chance: 70, goodLabel: "Salto di qualità", badLabel: "Progressi minimi",
    preview: "Estate dedicata a colmare una lacuna tecnica con sessioni quotidiane su un fondamentale a scelta.",
    run(p, out) {
      const focusMap = { shooting: "Tiro", finishing: "Finalizzazione", playmaking: "Playmaking", rebounding: "Rimbalzi", defense: "Difesa", athleticism: "Atletismo" };
      const key = choice(Object.keys(focusMap));
      out.narrative = `Estate dedicata a colmare una lacuna tecnica: sessioni quotidiane con l'assistant coach sul fondamentale "${focusMap[key]}".`;
      const ok = rollChance(70);
      out.rollText = `Lavoro tecnico — 70% riuscita · esito: ${ok ? "SUCCESSO" : "PROGRESSI MINIMI"}`;
      if (ok) { out.tone = "positive"; chAttr(p, key, randInt(4, 7), out, focusMap[key]); chOverall(p, 1, out); }
      else { out.tone = "neutral"; chAttr(p, key, 1, out, focusMap[key]); out.consequences.push("Nessun salto di qualità evidente"); }
    }
  },

  /* ---------------- SPOGLIATOIO & SOCIETÀ ---------------- */
  {
    category: "Spogliatoio & Società", title: "Lite con l'allenatore", weight: 9,
    chance: 55, goodLabel: "Tregua armata", badLabel: "Rottura definitiva",
    preview: "Un confronto acceso col capo allenatore sul proprio utilizzo rischia di degenerare e finire sui giornali.",
    run(p, out) {
      out.narrative = "Un confronto acceso col capo allenatore sul proprio utilizzo degenera e finisce sui giornali.";
      out.tone = "negative";
      chMeter(p, "chemistry", -15, out, "Chimica di squadra");
      chMeter(p, "morale", -8, out, "Morale");
      const severe = rollChance(45);
      out.rollText = `Reazione della società — 45% rottura definitiva · esito: ${severe ? "ROTTURA" : "TREGUA ARMATA"}`;
      if (severe) forceTransfer(p, out);
      else benchNextSeason(p, out, "Minutaggio tagliato: si parte dalla panchina");
    }
  },
  {
    category: "Spogliatoio & Società", title: "Scontro con la stella della squadra", weight: 8,
    when: p => p.overall < 90,
    chance: 60, goodLabel: "Caso rientrato", badLabel: "Cessione forzata",
    preview: "Attrito con il leader tecnico dello spogliatoio dopo un allenamento finito male.",
    run(p, out) {
      out.narrative = "Attrito con il leader tecnico dello spogliatoio: i due non si parlano più dopo un allenamento finito male.";
      out.tone = "negative";
      chMeter(p, "chemistry", -18, out, "Chimica di squadra");
      const trade = rollChance(40);
      out.rollText = `Gestione del caso — 40% cessione forzata · esito: ${trade ? "CESSIONE FORZATA" : "CASO RIENTRATO"}`;
      if (trade) forceTransfer(p, out);
      else { chMeter(p, "morale", -6, out, "Morale"); out.consequences.push("Clima teso: chimica di squadra compromessa per la prossima stagione"); }
    }
  },
  {
    category: "Spogliatoio & Società", title: "Nuovo allenatore e nuove gerarchie", weight: 11,
    chance: 50, goodLabel: "Gerarchie favorevoli", badLabel: "Fuori dai piani",
    preview: "La società cambia guida tecnica: il nuovo staff riscriverà le gerarchie del roster durante l'estate.",
    run(p, out) {
      out.narrative = "La società cambia guida tecnica: il nuovo staff riscrive le gerarchie del roster durante l'estate.";
      const favorable = rollChance(50);
      out.rollText = `Nuove gerarchie — 50% valutazione favorevole · esito: ${favorable ? "FAVOREVOLE" : "SFAVOREVOLE"}`;
      if (favorable) {
        out.tone = "positive";
        chMeter(p, "chemistry", 10, out, "Chimica di squadra");
        chMeter(p, "morale", 8, out, "Morale");
        p.seasonModifiers.minutesPenalty = -1; // bonus: sale di una fascia di rotazione
        out.consequences.push("Promosso nelle rotazioni: più spazio nella prossima stagione");
      } else {
        out.tone = "negative";
        chMeter(p, "morale", -6, out, "Morale");
        benchNextSeason(p, out, "Fuori dai piani del nuovo staff: si parte dalla panchina");
      }
    }
  },

  /* ---------------- EXTRA-CAMPO, FINANZE & MEDIA ---------------- */
  {
    category: "Extra-campo & Media", title: "Mentorship con una leggenda", weight: 9,
    run(p, out) {
      const legend = choice(["un ex MVP ritirato", "una leggenda della propria franchigia", "un Hall of Famer europeo", "un ex campione olimpico"]);
      out.narrative = `Un'estate di allenamenti privati con ${legend}: lavoro maniacale su letture di gioco e dettagli tecnici.`;
      out.tone = "positive";
      out.rollText = null;
      chOverall(p, randInt(3, 4), out);
      chAttr(p, "playmaking", 3, out, "Playmaking");
      chMeter(p, "morale", 10, out, "Morale");
    }
  },
  {
    category: "Extra-campo & Media", title: "Notte brava e scandalo mediatico", weight: 9,
    run(p, out) {
      out.narrative = "Immagini di una serata finita male diventano virali: la lega apre un fascicolo e la società interviene con una multa.";
      out.tone = "negative";
      out.rollText = null;
      const fine = roundMoney(Math.max(0.01, ((p.contract && p.contract.salaryPerYear) || 1) * 0.15));
      chWealth(p, -fine, out);
      chOverall(p, -1, out);
      chMeter(p, "morale", -10, out, "Morale");
      chMeter(p, "popularity", 6, out, "Popolarità");
      chSponsor(p, -Math.min(p.sponsorIncome, 0.3), out);
    }
  },
  {
    category: "Extra-campo & Media", title: "Investimento finanziario sbagliato", weight: 8,
    when: p => p.wealth > 0.5,
    chance: 30, goodLabel: "Rimborso parziale", badLabel: "Perdita totale",
    preview: "Un consulente poco raccomandabile propone un affare troppo bello per essere vero.",
    run(p, out) {
      out.narrative = "Un consulente poco raccomandabile convince il giocatore a investire in un affare troppo bello per essere vero.";
      const saved = rollChance(30);
      out.rollText = `Recupero fondi — 30% rimborso parziale · esito: ${saved ? "RIMBORSO PARZIALE" : "PERDITA TOTALE"}`;
      out.tone = "negative";
      const lossPct = saved ? 0.25 : 0.6;
      chWealth(p, -roundMoney(p.wealth * lossPct), out);
      chMeter(p, "morale", saved ? -5 : -12, out, "Morale");
    }
  },
  {
    category: "Extra-campo & Media", title: "Relazione VIP e boom social", weight: 9,
    chance: 60, goodLabel: "Concentrazione intatta", badLabel: "Distrazione in campo",
    preview: "Una relazione con un personaggio famoso finisce su tutte le copertine: follower e sponsor in arrivo, ma occhio alla testa.",
    run(p, out) {
      out.narrative = "Una relazione con un personaggio famoso finisce su tutte le copertine: i follower esplodono e arrivano nuovi sponsor.";
      out.tone = "positive";
      chMeter(p, "popularity", randInt(12, 20), out, "Popolarità");
      chSponsor(p, roundMoney(randFloat(0.2, 0.8, 2)), out);
      const distracted = rollChance(40);
      out.rollText = `Impatto sul campo — 40% rischio distrazione · esito: ${distracted ? "DISTRAZIONE" : "CONCENTRAZIONE INTATTA"}`;
      if (distracted) { chOverall(p, -1, out); out.consequences.push("Focus in campo calato per l'eccessiva esposizione"); }
      else chMeter(p, "morale", 6, out, "Morale");
    }
  },
  {
    category: "Extra-campo & Media", title: "Grande contratto di sponsorizzazione", weight: 8,
    when: p => p.overall >= 72,
    run(p, out) {
      const brand = choice(["un colosso dell'abbigliamento sportivo", "un brand di scarpe da basket", "una multinazionale di bevande energetiche", "una casa automobilistica"]);
      out.narrative = `Le prestazioni della scorsa stagione attirano ${brand}, che mette sul tavolo un accordo pluriennale.`;
      out.tone = "positive";
      out.rollText = null;
      chSponsor(p, roundMoney(randFloat(0.3, 1.2, 2)), out);
      chMeter(p, "popularity", randInt(8, 15), out, "Popolarità");
    }
  },
  {
    category: "Extra-campo & Media", title: "Impegno con la Nazionale", weight: 10,
    // niente convocazione "generica" negli anni di Mondiale/Europei: in quelle estati il
    // torneo vero e proprio (vedi simulateNationalTournament) sostituisce questo evento
    when: p => p.age >= 18 && p.overall >= 70 && !isWorldCupYear(p.year) && !isEurobasketYear(p.year),
    chance: p => clamp((p.overall - 60) * 1.5, 10, 55), goodLabel: "Medaglia conquistata", badLabel: "Eliminazione",
    preview: p => `Convocazione con la Nazionale ${p.nationality} per il torneo estivo: settimane di grande basket internazionale al posto delle vacanze.`,
    run(p, out) {
      out.narrative = `Convocazione con la Nazionale ${p.nationality} per il torneo estivo: settimane di grande basket internazionale al posto delle vacanze.`;
      const medal = rollChance(clamp((p.overall - 60) * 1.5, 10, 55));
      out.rollText = `Cammino della Nazionale — esito: ${medal ? "MEDAGLIA CONQUISTATA 🥇" : "ELIMINAZIONE"}`;
      if (medal) {
        out.tone = "positive";
        p.trophies.medals++;
        out.consequences.push("Medaglia con la Nazionale aggiunta al palmarès");
        chMeter(p, "popularity", 10, out, "Popolarità");
        chOverall(p, 1, out);
      } else {
        out.tone = "neutral";
        out.consequences.push("Nessuna medaglia, ma esperienza internazionale accumulata");
        chMeter(p, "morale", -3, out, "Morale");
      }
      out.consequences.push("Estate senza riposo: carico di lavoro elevato");
    }
  },
  /* ---------------- NUOVI IMPREVISTI (e catene: un evento può chiamarne un altro l'estate dopo) ---------------- */
  {
    category: "Fisico & Preparazione", title: "Camp estivo in altura", weight: 8,
    chance: 65, goodLabel: "Motore nuovo", badLabel: "Sovraccarico",
    preview: "Tre settimane di preparazione in altura con un gruppo di atleti olimpici: fiato e gambe nuove, se il corpo regge.",
    run(p, out) {
      out.narrative = "Tre settimane di preparazione in altura con un gruppo di atleti olimpici, tra salite e doppie sedute.";
      const ok = rollChance(65);
      out.rollText = `Preparazione in altura — 65% riuscita · esito: ${ok ? "MOTORE NUOVO" : "SOVRACCARICO"}`;
      if (ok) { out.tone = "positive"; chAttr(p, "athleticism", 3, out, "Atletismo"); chOverall(p, 1, out); }
      else { out.tone = "negative"; chMeter(p, "fragility", 6, out, "Fragilità"); chMeter(p, "morale", -3, out, "Morale"); }
    }
  },
  {
    category: "Fisico & Preparazione", title: "Estate di riposo totale", weight: 6,
    when: p => p.age >= 28,
    run(p, out) {
      out.narrative = "Dopo anni senza fermarsi, il corpo chiede tregua: un'estate intera lontano dal parquet, tra famiglia e mare.";
      out.tone = "neutral"; out.rollText = null;
      chMeter(p, "fragility", -10, out, "Fragilità");
      chMeter(p, "morale", 6, out, "Morale");
      chOverall(p, -1, out);
      out.consequences.push("Un po' di ruggine al rientro, ma il fisico ringrazia");
    }
  },
  {
    category: "Fisico & Preparazione", title: "Nuovo preparatore del tiro", weight: 8,
    chance: 60, goodLabel: "Mano calda", badLabel: "Meccanica rotta",
    preview: "Un celebre shooting coach si offre di rivedere da capo la tua meccanica di tiro. Cambiare fa paura, ma può valere una carriera.",
    run(p, out) {
      out.narrative = "Un celebre shooting coach smonta e rimonta la tua meccanica di tiro, un fotogramma alla volta.";
      const ok = rollChance(60);
      out.rollText = `Nuova meccanica — 60% riuscita · esito: ${ok ? "MANO CALDA" : "MECCANICA ROTTA"}`;
      if (ok) { out.tone = "positive"; chAttr(p, "shooting", 4, out, "Tiro"); chOverall(p, 1, out); }
      else {
        out.tone = "negative"; chAttr(p, "shooting", -2, out, "Tiro"); chMeter(p, "morale", -4, out, "Morale");
        p.eventChain = { id: "shotRebuild", year: p.year + 1 };
        out.consequences.push("La prossima estate si potrà provare a ricostruire il tiro");
      }
    }
  },
  {
    id: "shotRebuild", chainOnly: true,
    category: "Fisico & Preparazione", title: "Ricostruire il tiro", weight: 1,
    chance: 70, goodLabel: "Tiro ritrovato", badLabel: "Ancora a metà",
    preview: "Dopo un anno di tiri storti, lo staff propone di ripartire da zero con la meccanica di un tempo, rivista nei dettagli.",
    run(p, out) {
      out.narrative = "Un'estate intera a ripetere la vecchia meccanica, rivista nei dettagli: cento, mille, diecimila tiri.";
      const ok = rollChance(70);
      out.rollText = `Tiro da ricostruire — 70% riuscita · esito: ${ok ? "TIRO RITROVATO" : "ANCORA A METÀ"}`;
      if (ok) { out.tone = "positive"; chAttr(p, "shooting", 5, out, "Tiro"); chMeter(p, "morale", 6, out, "Morale"); }
      else { out.tone = "neutral"; chAttr(p, "shooting", 1, out, "Tiro"); out.consequences.push("Qualche progresso, ma la fiducia al tiro non è ancora tornata"); }
    }
  },
  {
    category: "Fisico & Preparazione", title: "Fastidio al ginocchio", weight: 6,
    when: p => p.age >= 24,
    run(p, out) {
      out.narrative = "Durante un allenamento estivo il ginocchio si gonfia. Gli esami non mostrano nulla di grave, per ora.";
      out.tone = "negative"; out.rollText = null;
      chMeter(p, "fragility", 8, out, "Fragilità");
      chOverall(p, -1, out);
      p.eventChain = { id: "kneeSurgery", year: p.year + 1 };
      out.consequences.push("Lo staff medico lo terrà d'occhio: se ne riparlerà la prossima estate");
    }
  },
  {
    id: "kneeSurgery", chainOnly: true,
    category: "Fisico & Preparazione", title: "Il ginocchio torna a farsi sentire", weight: 1,
    chance: 55, goodLabel: "Ginocchio nuovo", badLabel: "Rientro complicato",
    preview: "Il fastidio dell'anno scorso non è passato. I medici propongono un intervento in artroscopia: rischioso, ma può chiudere il problema.",
    run(p, out) {
      out.narrative = "Il giocatore sceglie l'artroscopia per chiudere il problema al ginocchio una volta per tutte.";
      const ok = rollChance(55);
      out.rollText = `Artroscopia — 55% ginocchio nuovo · esito: ${ok ? "GINOCCHIO NUOVO" : "RIENTRO COMPLICATO"}`;
      if (ok) { out.tone = "positive"; chMeter(p, "fragility", -15, out, "Fragilità"); chAttr(p, "athleticism", 1, out, "Atletismo"); }
      else { out.tone = "negative"; chOverall(p, -3, out); benchNextSeason(p, out, "Rientro a stagione iniziata: si parte dalla panchina"); }
    }
  },
  {
    category: "Spogliatoio & Società", title: "Il capitano ti prende sotto la sua ala", weight: 7,
    when: p => p.yearsPro <= 4 && !isCaptain(p),
    run(p, out) {
      out.narrative = "Il capitano della squadra ti invita ad allenarti con lui tutta l'estate: consigli, video, cene con il gruppo.";
      out.tone = "positive"; out.rollText = null;
      chMeter(p, "chemistry", 10, out, "Chimica di squadra");
      chOverall(p, 1, out);
    }
  },
  {
    category: "Spogliatoio & Società", title: "Chiedere un ruolo più importante", weight: 7,
    when: p => p.age >= 20,
    chance: p => clamp(35 + (p.overall - 70) * 2, 20, 75), goodLabel: "Più responsabilità", badLabel: "Porta chiusa",
    preview: "Ti senti pronto per un ruolo più grande e vuoi dirlo alla dirigenza. Se ti ascoltano giochi di più; se no, lo spogliatoio lo verrà a sapere.",
    run(p, out) {
      out.narrative = "Il giocatore chiede un incontro alla dirigenza per discutere del suo ruolo nella prossima stagione.";
      const ok = rollChance(clamp(35 + (p.overall - 70) * 2, 20, 75));
      out.rollText = `Risposta della dirigenza · esito: ${ok ? "PIÙ RESPONSABILITÀ" : "PORTA CHIUSA"}`;
      if (ok) { out.tone = "positive"; p.seasonModifiers.minutesPenalty = -1; chMeter(p, "morale", 5, out, "Morale"); out.consequences.push("Più spazio nelle rotazioni della prossima stagione"); }
      else { out.tone = "negative"; chMeter(p, "chemistry", -10, out, "Chimica di squadra"); chMeter(p, "morale", -5, out, "Morale"); }
    }
  },
  {
    category: "Spogliatoio & Società", title: "Un rookie in rampa di lancio nel tuo ruolo", weight: 7,
    when: p => p.age >= 27,
    chance: p => clamp(40 + (p.overall - 75) * 2, 25, 80), goodLabel: "Posto difeso", badLabel: "Sorpasso",
    preview: "La società ha scelto al Draft un talento nel tuo stesso ruolo. Puoi accettare la sfida al training camp, o lasciare che le gerarchie si decidano da sole.",
    run(p, out) {
      out.narrative = "Al training camp il confronto con il giovane talento è quotidiano, sotto gli occhi di tutti.";
      const ok = rollChance(clamp(40 + (p.overall - 75) * 2, 25, 80));
      out.rollText = `Sfida al training camp · esito: ${ok ? "POSTO DIFESO" : "SORPASSO"}`;
      if (ok) { out.tone = "positive"; chOverall(p, 1, out); chMeter(p, "morale", 4, out, "Morale"); }
      else { out.tone = "negative"; benchNextSeason(p, out, "Il rookie parte titolare: si comincia dalla panchina"); }
    }
  },
  {
    category: "Spogliatoio & Società", title: "Ritiro precampionato all'estero", weight: 7,
    run(p, out) {
      const place = choice(["in Slovenia", "in Giappone", "alle Canarie", "in Montenegro", "a Dubai"]);
      out.narrative = `La squadra organizza il ritiro precampionato ${place}: due settimane di allenamenti, amichevoli e serate tutti insieme.`;
      out.tone = "positive"; out.rollText = null;
      chMeter(p, "chemistry", 8, out, "Chimica di squadra");
      chMeter(p, "popularity", 3, out, "Popolarità");
    }
  },
  {
    category: "Spogliatoio & Società", title: "Il vecchio coach delle giovanili", weight: 5,
    when: p => p.age <= 23,
    run(p, out) {
      out.narrative = "Il tuo primo allenatore ti chiama per un'estate nella vecchia palestra: gli stessi esercizi di quando eri bambino, con occhi nuovi.";
      out.tone = "positive"; out.rollText = null;
      chMeter(p, "morale", 8, out, "Morale");
      chOverall(p, 1, out);
    }
  },
  {
    category: "Extra-campo & Media", title: "Un documentario sulla tua estate", weight: 7,
    when: p => p.popularity >= 45,
    chance: 60, goodLabel: "Successo di pubblico", badLabel: "Montaggio impietoso",
    preview: "Una piattaforma di streaming vuole seguirti tutta l'estate con le telecamere. Grande visibilità, ma non decidi tu il montaggio.",
    run(p, out) {
      out.narrative = "Per tutta l'estate una troupe ti segue ovunque: allenamenti, famiglia, serate con gli amici.";
      const ok = rollChance(60);
      out.rollText = `Uscita del documentario — 60% successo · esito: ${ok ? "SUCCESSO DI PUBBLICO" : "MONTAGGIO IMPIETOSO"}`;
      if (ok) { out.tone = "positive"; chMeter(p, "popularity", randInt(10, 15), out, "Popolarità"); chSponsor(p, roundMoney(randFloat(0.05, 0.4, 2)), out); }
      else { out.tone = "negative"; chMeter(p, "chemistry", -8, out, "Chimica di squadra"); chMeter(p, "morale", -6, out, "Morale"); out.consequences.push("Qualche frase fuori contesto fa arrabbiare lo spogliatoio"); }
    }
  },
  {
    category: "Extra-campo & Media", title: "Nasce la tua fondazione", weight: 6,
    when: p => p.wealth >= 1 && !p.foundation,
    run(p, out) {
      out.narrative = "Apri una fondazione per portare il basket nei quartieri difficili: campetti nuovi, borse di studio, allenatori volontari.";
      out.tone = "positive"; out.rollText = null;
      p.foundation = true;
      chWealth(p, -roundMoney(Math.max(0.05, p.wealth * 0.03)), out);
      chMeter(p, "popularity", 8, out, "Popolarità");
      chMeter(p, "morale", 6, out, "Morale");
      p.eventChain = { id: "foundationGrows", year: p.year + 1 };
    }
  },
  {
    id: "foundationGrows", chainOnly: true,
    category: "Extra-campo & Media", title: "La fondazione cresce", weight: 1,
    run(p, out) {
      out.narrative = "Un anno dopo, la tua fondazione ha aperto tre nuovi campetti: i ragazzi del primo torneo ti aspettano per la premiazione.";
      out.tone = "positive"; out.rollText = null;
      chMeter(p, "popularity", 6, out, "Popolarità");
      chMeter(p, "morale", 5, out, "Morale");
      changeReputation(p, 2, "fondazione");
      out.consequences.push("Reputazione +2: le società apprezzano l'uomo, oltre al giocatore");
    }
  },
  {
    category: "Extra-campo & Media", title: "Camp per ragazzi nella tua città", weight: 6,
    when: p => !!p.hometown && p.age >= 21,
    run(p, out) {
      out.narrative = `Organizzi un camp estivo per i ragazzi di ${p.hometown}: trecento iscritti, la palestra della tua infanzia piena ogni giorno.`;
      out.tone = "positive"; out.rollText = null;
      chMeter(p, "popularity", 6, out, "Popolarità");
      chMeter(p, "morale", 5, out, "Morale");
    }
  },
  {
    category: "Extra-campo & Media", title: "In copertina su un videogioco", weight: 5,
    when: p => p.overall >= 85,
    run(p, out) {
      out.narrative = "Una grande casa di videogiochi sportivi ti sceglie come volto della copertina della nuova edizione.";
      out.tone = "positive"; out.rollText = null;
      chMeter(p, "popularity", randInt(10, 15), out, "Popolarità");
      chSponsor(p, roundMoney(randFloat(0.4, 1.2, 2)), out);
    }
  },
  {
    category: "Extra-campo & Media", title: "Litigio social con un tifoso", weight: 7,
    chance: 45, goodLabel: "Risposta perfetta", badLabel: "Polemica infinita",
    preview: "Un tifoso ti attacca pesantemente sui social dopo una sconfitta. Puoi rispondergli a tono, o far finta di niente.",
    run(p, out) {
      out.narrative = "Il giocatore risponde al tifoso con un post che fa il giro del web in poche ore.";
      const ok = rollChance(45);
      out.rollText = `Reazione del web — 45% risposta perfetta · esito: ${ok ? "RISPOSTA PERFETTA" : "POLEMICA INFINITA"}`;
      if (ok) { out.tone = "positive"; chMeter(p, "popularity", 8, out, "Popolarità"); }
      else { out.tone = "negative"; chMeter(p, "popularity", -6, out, "Popolarità"); chMeter(p, "morale", -5, out, "Morale"); chSponsor(p, -Math.min(p.sponsorIncome, 0.1), out); }
    }
  },
  {
    category: "Extra-campo & Media", title: "Un affare immobiliare", weight: 6,
    when: p => p.wealth >= 2,
    chance: 55, goodLabel: "Affare d'oro", badLabel: "Cantiere fermo",
    preview: "Un ex compagno ti propone di entrare in un progetto immobiliare nella sua città. Può rendere bene, o bloccarsi per anni.",
    run(p, out) {
      out.narrative = "Il giocatore entra nel progetto immobiliare dell'ex compagno di squadra.";
      const ok = rollChance(55);
      out.rollText = `Esito del progetto — 55% affare d'oro · esito: ${ok ? "AFFARE D'ORO" : "CANTIERE FERMO"}`;
      if (ok) { out.tone = "positive"; chWealth(p, roundMoney(p.wealth * 0.12), out); }
      else { out.tone = "negative"; chWealth(p, -roundMoney(p.wealth * 0.1), out); chMeter(p, "morale", -4, out, "Morale"); }
    }
  },
  {
    category: "Extra-campo & Media", title: "Un reality show in TV", weight: 5,
    when: p => p.popularity >= 55,
    chance: 50, goodLabel: "Beniamino del pubblico", badLabel: "Estate buttata",
    preview: "Un grande programma televisivo estivo ti vuole come concorrente. Fama assicurata, ma addio agli allenamenti per un mese.",
    run(p, out) {
      out.narrative = "Il giocatore accetta di partecipare al reality show dell'estate, tra prove di coraggio e dirette serali.";
      const ok = rollChance(50);
      out.rollText = `Televoto — 50% beniamino del pubblico · esito: ${ok ? "BENIAMINO DEL PUBBLICO" : "ESTATE BUTTATA"}`;
      chMeter(p, "popularity", ok ? 12 : 5, out, "Popolarità");
      if (ok) { out.tone = "positive"; chSponsor(p, roundMoney(randFloat(0.1, 0.5, 2)), out); }
      else { out.tone = "negative"; chOverall(p, -1, out); chMeter(p, "chemistry", -5, out, "Chimica di squadra"); out.consequences.push("La società non ha gradito un mese senza allenamenti"); }
    }
  },
  {
    category: "Extra-campo & Media", title: "Un'estate difficile in famiglia", weight: 4,
    run(p, out) {
      out.narrative = "Un problema di salute in famiglia ti tiene lontano dal basket per buona parte dell'estate. I compagni ti stanno vicino.";
      out.tone = "negative"; out.rollText = null;
      chMeter(p, "morale", -10, out, "Morale");
      chMeter(p, "chemistry", 6, out, "Chimica di squadra");
    }
  },
];

/* Riequilibrio annuale dei valori extra-campo: senza nuovi imprevisti morale e chimica
   tendono a normalizzarsi, mentre la popolarità si consuma se non alimentata dai risultati. */
function driftOffCourtMeters(p, teamResult, performanceScore) {
  // la chimica si ricuce col tempo, più in fretta se la squadra vince
  const winPct = teamResult.wins / Math.max(1, teamResult.wins + teamResult.losses);
  p.chemistry = clamp(p.chemistry + randInt(4, 8) + (winPct > 0.55 ? 4 : 0), 0, 100);
  // il morale segue i risultati e tende verso il valore di equilibrio (60)
  const moralePull = Math.round((60 - p.morale) * 0.25);
  p.morale = clamp(p.morale + moralePull + (winPct > 0.55 ? 4 : -2) + Math.round(performanceScore * 6), 0, 100);
  // la popolarità decade se non sostenuta da rendimento e vittorie
  p.popularity = clamp(p.popularity - randInt(3, 7) + Math.round(performanceScore * 8) + (teamResult.champion ? 10 : 0) + getAgent(p).popularity, 0, 100);
  // gli sponsor seguono la popolarità: contratti che scadono se il giocatore esce dai radar
  if (p.popularity < 25 && p.sponsorIncome > 0) p.sponsorIncome = roundMoney(Math.max(0, p.sponsorIncome - 0.15));
  const agent = getAgent(p);
  if (agent.newSponsors && p.age >= 18) p.sponsorIncome = roundMoney(p.sponsorIncome + agent.newSponsors * p.popularity / 100);
  // la stamina si ricarica in estate, ma sempre meno efficacemente con l'avanzare dell'età:
  // un corpo più vecchio non recupera più come a 20 anni
  const recoveryCap = p.age >= 30 ? 88 - (p.age - 29) * 2 : 100;
  p.stamina = clamp(Math.min(p.stamina + randInt(24, 38), recoveryCap), 30, 100);
  // la fragilità accumulata dagli infortuni si attenua leggermente se ci si riposa bene
  p.fragility = clamp(p.fragility - randInt(1, 3), 0, 100);
}

/* Estrae (senza risolverlo) l'imprevisto della prossima estate, se ce n'è uno */
function pickOffseasonEvent(p) {
  // il seguito di un imprevisto dell'anno scorso arriva sempre (vedi p.eventChain)
  if (p.eventChain && p.eventChain.year <= p.year) {
    const next = OFFSEASON_EVENTS.find(e => e.id === p.eventChain.id);
    p.eventChain = null;
    if (next && (!next.when || next.when(p))) return next;
  }
  // non ogni estate porta un imprevisto: la maggior parte delle stagioni è tranquilla
  if (!rollChance(38)) return null;
  // l'imprevisto dell'estate scorsa non si ripete subito
  const lastTitle = (p.offseasonEvents || []).length ? p.offseasonEvents[p.offseasonEvents.length - 1].title : null;
  const pool = OFFSEASON_EVENTS.filter(e => !e.chainOnly && e.title !== lastTitle && (!e.when || e.when(p)));
  return weightedChoice(pool.map(e => [e, e.weight || 1]));
}
function offseasonEventChance(ev, p) { return typeof ev.chance === "function" ? ev.chance(p) : ev.chance; }
function offseasonEventPreview(ev, p) { return typeof ev.preview === "function" ? ev.preview(p) : ev.preview; }

/* Risolve un imprevisto senza scelta a rischio (effetto sempre applicato) */
function resolveDeterministicEvent(ev, p) {
  const out = { category: ev.category, title: ev.title, narrative: "", rollText: null, consequences: [], tone: "neutral" };
  ev.run(p, out);
  p.offseasonEvents.push({ age: p.age, title: out.title, tone: out.tone });
  return out;
}
/* Il giocatore ha scelto di rischiare: si tira il dado interno all'evento */
function takeOffseasonRisk(ev, p) {
  const out = { category: ev.category, title: ev.title, narrative: "", rollText: null, consequences: [], tone: "neutral" };
  ev.run(p, out);
  p.offseasonEvents.push({ age: p.age, title: out.title, tone: out.tone });
  return out;
}
/* Il giocatore ha scelto di non rischiare: nessun effetto, nessuna sorpresa */
function declineOffseasonRisk(ev, p) {
  const out = {
    category: ev.category, title: ev.title, tone: "neutral", rollText: null,
    narrative: `Il giocatore preferisce non rischiare: "${ev.title}" viene evitato con cautela.`,
    consequences: ["Nessun rischio corso: nessun effetto su overall, attributi o economia."],
  };
  p.offseasonEvents.push({ age: p.age, title: out.title, tone: out.tone });
  return out;
}

/* Curva d'invecchiamento per ruolo: le guardie maturano più a lungo e calano più lentamente
   (i fondamentali tecnici invecchiano bene), i lunghi raggiungono il picco fisico prima e
   iniziano il declino prima e più bruscamente — coerente con l'evoluzione reale delle carriere. */
const AGE_CURVE_BY_ROLE = {
  PG: { growthEnd: 28, primeEnd: 33, declineBase: 2.0 },
  SG: { growthEnd: 28, primeEnd: 33, declineBase: 2.2 },
  SF: { growthEnd: 27, primeEnd: 32, declineBase: 2.6 },
  PF: { growthEnd: 26, primeEnd: 32, declineBase: 3.0 },
  C:  { growthEnd: 26, primeEnd: 32, declineBase: 3.4 },
};
/* I campioni durano di più: da Stella della squadra il picco si allunga di 2 anni, da Leggenda
   (grande reputazione e almeno un MVP o 5 All-Star) di 4, fino a un massimo di 37 anni */
const PRIME_END_MAX = 37;
function isLegend(p) { return reputationOf(p) >= 80 && (p.trophies.mvp >= 1 || p.trophies.allstar >= 5); }
function primeEndFor(p) {
  const curve = AGE_CURVE_BY_ROLE[p.role] || AGE_CURVE_BY_ROLE.SF;
  const bonus = isLegend(p) ? 4 : p.currentTeamRole === "star" ? 2 : 0;
  return Math.min(PRIME_END_MAX, curve.primeEnd + bonus);
}

function progressOverall(p, performanceScore) {
  // performanceScore: 0..1 roughly how well the player did relative to potential
  // il morale (inciso dagli imprevisti estivi) accelera o frena la crescita: 0.75x .. 1.25x
  // la stamina scarsa in stagione si porta dietro un affaticamento che frena la crescita
  const moraleFactor = 0.75 + (p.morale / 100) * 0.5;
  const staminaFactor = 0.8 + (p.stamina / 100) * 0.2;
  const curve = AGE_CURVE_BY_ROLE[p.role] || AGE_CURVE_BY_ROLE.SF;
  let delta = 0;
  if (p.age <= curve.growthEnd) {
    const room = p.potential - p.overall;
    const base = randInt(1, 4); // margine di crescita massimo ridotto: la scalata al vertice è più lenta
    delta = room > 0 ? Math.round(base * clamp(room / 20, 0.2, 1) * (0.55 + performanceScore*0.75) * moraleFactor * staminaFactor * staffGrowthFactor(p) * getDifficulty(p).growth * teamRoleGrowthFactor(p)) : randInt(0,1);
    // rischio di "bust": prestazioni scarse in età di sviluppo bruciano parte del potenziale per sempre
    if (performanceScore < 0.3 && p.age >= 20 && rollChance(10)) {
      const lost = randInt(2, 5);
      p.potential = clamp(p.potential - lost, p.overall, 99);
    }
  } else if (p.age <= primeEndFor(p)) {
    delta = randInt(-1, 1); // plateau al proprio picco: ancora competitivo, senza perdere terreno
  } else {
    // il declino peggiora ulteriormente più si va avanti oltre il proprio picco di ruolo
    const yearsPastPrime = p.age - primeEndFor(p);
    const worsening = Math.floor(yearsPastPrime / 2);
    const lo = Math.round(curve.declineBase) + worsening;
    const hi = lo + 3;
    delta = -randInt(lo, hi);
  }
  p.overall = clamp(p.overall + delta, 40, 99);
  progressAttributes(p, delta);
  return delta;
}

/* Fa crescere/declinare i singoli attributi in modo coerente con la variazione di overall:
   in crescita ogni attributo migliora proporzionalmente; in declino gli attributi fisici
   (atletismo, rimbalzi, difesa) calano più velocemente di quelli tecnici (tiro, playmaking),
   con un'accentuazione ulteriore per i ruoli sotto canestro (i lunghi perdono esplosività ed
   elevazione prima e più bruscamente delle guardie, che mantengono i fondamentali più a lungo). */
const PHYSICAL_DECAY_BY_ROLE = {
  PG: { athleticism: 1.3, rebounding: 1.0, defense: 1.0, finishing: 0.9, shooting: 0.6, playmaking: 0.5 },
  SG: { athleticism: 1.4, rebounding: 1.0, defense: 1.0, finishing: 0.9, shooting: 0.6, playmaking: 0.6 },
  SF: { athleticism: 1.5, rebounding: 1.2, defense: 1.1, finishing: 1.0, shooting: 0.7, playmaking: 0.7 },
  PF: { athleticism: 1.7, rebounding: 1.3, defense: 1.1, finishing: 1.0, shooting: 0.7, playmaking: 0.8 },
  C:  { athleticism: 1.8, rebounding: 1.4, defense: 1.2, finishing: 1.0, shooting: 0.6, playmaking: 0.8 },
};
function progressAttributes(p, ovrDelta) {
  const keys = Object.keys(p.attrs);
  if (ovrDelta > 0) {
    keys.forEach(k => {
      const bump = Math.round(ovrDelta * randFloat(0.6, 1.3));
      p.attrs[k] = clamp(p.attrs[k] + bump, 30, 99);
    });
  } else if (ovrDelta < 0) {
    const physical = PHYSICAL_DECAY_BY_ROLE[p.role] || PHYSICAL_DECAY_BY_ROLE.SF;
    keys.forEach(k => {
      const drop = Math.round(Math.abs(ovrDelta) * physical[k] * randFloat(0.7, 1.3));
      p.attrs[k] = clamp(p.attrs[k] - drop, 30, 99);
    });
  }
}
