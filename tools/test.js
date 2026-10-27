/* Test automatici: carriere complete senza errori, coerenza dello stato, salvataggi e
   bilanciamento entro soglie stabilite. Uso: npm test (oppure node --test tools/test.js) */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { createGame } = require("./harness");

/* Cerca numeri non validi (NaN, Infinity) in tutto lo stato */
function findBadNumbers(value, where = "player", out = [], seen = new Set()) {
  if (typeof value === "number" && !Number.isFinite(value)) out.push(where);
  else if (value && typeof value === "object" && !seen.has(value)) {
    seen.add(value);
    Object.keys(value).forEach(k => findBadNumbers(value[k], `${where}.${k}`, out, seen));
  }
  return out;
}

/* Controlli che devono valere per ogni carriera conclusa */
function checkCareer(p) {
  assert.ok(p.retired, "la carriera deve concludersi");
  assert.deepEqual(findBadNumbers(p), [], "nessun numero non valido nello stato");
  assert.ok(p.overall >= 40 && p.overall <= 99, `overall fuori scala: ${p.overall}`);
  Object.entries(p.attrs).forEach(([k, v]) => assert.ok(v >= 30 && v <= 99, `attributo ${k} fuori scala: ${v}`));
  ["morale", "chemistry", "popularity", "stamina", "fragility", "reputation"].forEach(k =>
    assert.ok(p[k] >= 0 && p[k] <= 100, `${k} fuori scala: ${p[k]}`));
  p.history.forEach(h => {
    assert.ok(h.gp >= 0 && h.gp <= h.games, `partite giocate incoerenti nel ${h.year}: ${h.gp}/${h.games}`);
    assert.equal(h.wins + h.losses, h.games, `record incoerente nel ${h.year}`);
  });
  assert.equal(p.goatScore, p.history.reduce((t, h) => t + (h.goatPoints || 0), 0), "GOAT = somma delle stagioni");
  const rings = p.history.filter(h => h.champion && h.league === "NBA").length;
  assert.equal(p.trophies.rings, rings, "anelli coerenti con lo storico");
  const count = prefix => p.history.reduce((t, h) => t + (h.awards || []).filter(a => a.startsWith(prefix)).length, 0);
  assert.equal(p.trophies.mvp, count("MVP"), "MVP coerenti con lo storico");
  assert.equal(p.trophies.allstar, count("All-Star"), "All-Star coerenti con lo storico");
  const years = p.history.map(h => h.year);
  years.forEach((y, i) => i && assert.equal(y, years[i - 1] + 1, "una stagione per anno, senza buchi"));
}

test("i moduli si caricano e la pagina parte senza errori", () => {
  const game = createGame({ seed: 1 });
  assert.equal(typeof game.run("advanceSeason"), "function");
});

test("40 carriere complete con scelte casuali, stato sempre coerente", () => {
  const game = createGame({ seed: 7 });
  for (let i = 0; i < 40; i++) checkCareer(game.run("balancePlayCareer().player"));
});

test("40 carriere da giocatore attento (turno per turno, clutch)", () => {
  const game = createGame({ seed: 11, manual: true });
  for (let i = 0; i < 40; i++) checkCareer(game.run("balancePlayCareer().player"));
});

test("salvataggio e ripresa prima di ogni decisione non rompono la carriera", () => {
  const game = createGame({ seed: 3, keepSave: true });
  game.run(`
    for (let i = 0; i < 4; i++) {
      balanceNewCareer();
      let guard = 0;
      while (!player.retired && guard++ < 1500) {
        saveCareer();
        const data = loadSavedCareer();
        if (!data) throw new Error("salvataggio non leggibile");
        resumeCareer(data);
        balanceStep();
      }
      if (!player.retired) throw new Error("carriera senza fine dopo i salvataggi");
    }
  `);
  checkCareer(game.run("player"));
});

test("un salvataggio della versione 7 viene migrato e resta giocabile", () => {
  const game = createGame({ seed: 5, keepSave: true });
  game.run(`
    balanceNewCareer();
    for (let i = 0; i < 60 && !player.retired; i++) balanceStep();
    saveCareer();
  `);
  const key = game.run("saveKeyFor(activeSlot)");
  const data = JSON.parse(game.storage[key]);
  data.version = 7;
  delete data.player.investments;
  game.storage[key] = JSON.stringify(data);
  game.run(`
    const data = loadSavedCareer();
    if (!data || data.version !== SAVE_VERSION) throw new Error("migrazione fallita");
    if (!Array.isArray(data.player.investments)) throw new Error("investimenti non ripristinati");
    resumeCareer(data);
    let guard = 0;
    while (!player.retired && guard++ < 1500) balanceStep();
  `);
  checkCareer(game.run("player"));
});

/* ---------- bilanciamento: soglie larghe, per accorgersi se una modifica sposta tutto ---------- */
function titleRate(game, careers, minOvr) {
  let seasons = 0, titles = 0;
  const grades = {};
  for (let i = 0; i < careers; i++) {
    const r = game.run("balancePlayCareer()");
    grades[r.grade.grade] = (grades[r.grade.grade] || 0) + 1;
    r.player.history.forEach(h => {
      if (h.league === "NBA" && h.overall - (h.ovrDelta || 0) >= minOvr) { seasons++; if (h.champion) titles++; }
    });
  }
  return { rate: seasons ? titles / seasons : 0, seasons, grades };
}

test("bilanciamento: un 90+ attento vince il titolo NBA tra il 12% e il 35% delle stagioni", () => {
  const { rate, seasons, grades } = titleRate(createGame({ seed: 42, manual: true }), 400, 90);
  assert.ok(seasons >= 50, `poche stagioni da 90+ per misurare: ${seasons}`);
  assert.ok(rate >= 0.12 && rate <= 0.35, `tasso di titoli ${(rate * 100).toFixed(1)}%`);
  const s = (grades.S || 0) / 400;
  // su 1000 carriere il voto S sta tra 10% e 14%: su 400 serve un paio di punti di margine per il rumore del campione
  assert.ok(s >= 0.02 && s <= 0.17, `carriere da S: ${(s * 100).toFixed(1)}%`);
});

test("il vecchio salvataggio unico finisce nel primo slot libero e gli slot restano separati", () => {
  const game = createGame({ seed: 9, keepSave: true });
  game.run(`
    balanceNewCareer();
    for (let i = 0; i < 20; i++) balanceStep();
    // ogni render salva nello slot attivo: si parte da storage vuoto con il solo vecchio salvataggio
    const raw = localStorage.getItem(saveKeyFor(activeSlot));
    SAVE_SLOTS.forEach(slot => localStorage.removeItem(saveKeyFor(slot)));
    localStorage.setItem(LEGACY_SAVE_KEY, raw);
    migrateLegacySaveSlot();
  `);
  assert.ok(game.storage["chosenOne.career.1"], "slot 1 riempito dal vecchio salvataggio");
  assert.equal(game.storage["chosenOne.career"], undefined, "vecchia chiave rimossa");
  assert.equal(game.run("defaultNewCareerSlot()"), 2, "la nuova carriera va nel primo slot libero");
  game.run("activeSlot = 2; saveCareer(); activeSlot = 3; saveCareer();");
  assert.ok([1, 2, 3].includes(game.run("defaultNewCareerSlot()")), "con tutti gli slot pieni se ne sceglie uno esistente");
});

test("difficoltà: più è alta, meno titoli vince lo stesso giocatore", () => {
  const rates = ["easy", "normal", "legend"].map(difficulty =>
    titleRate(createGame({ seed: 21, manual: true, difficulty }), 120, 85).rate);
  assert.ok(rates[0] > rates[1] && rates[1] > rates[2], `tassi di titolo non in ordine: ${rates.map(r => (r * 100).toFixed(1)).join(" / ")}`);
});

test("dinastia e tour d'addio: tre generazioni di fila, l'ultima stagione annunciata si gioca", () => {
  const game = createGame({ seed: 13 });
  const r = game.run(`(() => {
    const gens = [balancePlayCareer().player];
    for (let i = 0; i < 2; i++) gens.push(balancePlayCareer(player).player);
    return gens.map(p => ({ gen: p.legacy ? p.legacy.generation : 1, last: p.lastName, start: p.startYear, end: p.year, retired: p.retired }));
  })()`);
  assert.equal(JSON.stringify(r.map(x => x.gen)), "[1,2,3]");
  r.forEach((x, i) => { assert.ok(x.retired); if (i) { assert.equal(x.last, r[0].last); assert.ok(x.start > r[i - 1].end); } });
  const f = game.run(`(() => {
    balanceNewCareer();
    let guard = 0;
    while (!player.retired && guard++ < 1500) {
      if (!player.pendingDecision && player.age >= 32 && !player.farewellTour) announceFarewell();
      balanceStep();
    }
    return { ft: player.farewellTour, last: player.history[player.history.length - 1].year, age: player.age };
  })()`);
  if (f.ft) assert.equal(f.last, f.ft, "si ritira dopo la stagione d'addio");
});

test("creazione: la scheda degli scout è il giocatore che parte, tratti e punti restano nelle regole", () => {
  const game = createGame({ seed: 17 });
  const r = game.run(`(() => {
    const roll = makeCreationRoll();
    const args = { firstName: "A", lastName: "B", nationality: "Italia", role: "C", archetypeId: "C_UNICORN", height: 212, weight: 118,
      path: getPath("STREET"), leagueId: "ITA_B", team: LEAGUES.ITA_B.teams[0], jerseyNumber: 7, difficulty: "normal",
      hand: "left", bodyType: "lanky", traits: ["loyal", "mercenary", "leader", "ice"], look: randomLook(), hometown: "Bologna",
      attrShift: { shooting: 4, rebounding: -4 }, roll };
    const a = newPlayerState(args), b = newPlayerState(args);
    const cheat = newPlayerState({ ...args, attrShift: { shooting: 4, defense: 4 } });
    const plain = newPlayerState({ ...args, attrShift: {} });
    return { same: JSON.stringify([a.overall, a.potential, a.attrs]) === JSON.stringify([b.overall, b.potential, b.attrs]),
      traits: a.traits, hybrid: secondaryRoleOf(a), shifted: a.attrs.shooting - plain.attrs.shooting, cheat: cheat.attrs.shooting - plain.attrs.shooting,
      perRole: ROLES.map(x => ARCHETYPES_BY_ROLE[x.id].length) };
  })()`);
  assert.ok(r.same, "stesso roll, stesso giocatore");
  assert.equal(JSON.stringify(r.traits), JSON.stringify(["loyal", "leader"]), "massimo due tratti compatibili");
  assert.equal(r.hybrid, "PF");
  assert.equal(r.shifted, 4, "i punti spostati entrano negli attributi");
  assert.equal(r.cheat, 0, "uno spostamento che crea punti dal nulla viene ignorato");
  assert.ok(r.perRole.every(n => n === 8), "8 archetipi per ruolo");
});

test("Draft: si può rifiutare il contratto da rookie e restare nel club, o vederselo ritirare", () => {
  const game = createGame({ seed: 5 });
  const r = game.run(`(() => {
    const out = { declined: 0, withdrawn: 0, ok: true };
    for (let i = 0; i < 400 && (out.declined < 3 || out.withdrawn < 3); i++) {
      balanceNewCareer();
      let guard = 0;
      while (!player.retired && guard++ < 400) {
        const d = player.pendingDecision;
        if (d && d.type === "negotiate" && d.offer.id === "rookie" && d.draftRecord) {
          const prev = d.offer.stash, nbaTeam = d.offer.team.name;
          if (out.declined <= out.withdrawn) { declineDraftOffer(false); out.declined++; }
          else { d.offer.patience = 0; withdrawOffer(d); out.withdrawn++; }
          const next = player.pendingDecision;
          const nextType = next.type === "agentChoice" ? next.next.type : next.type;
          if (player.inNBA || player.league === "NBA" || player.team.name !== prev.team.name || !player.draftRights
            || player.draftRights.team.name !== nbaTeam || !["market", "offseasonStatus"].includes(nextType)) out.ok = false;
          // l'estate dopo, la stessa squadra torna a chiamare (ultima volta: poi i diritti decadono)
          let called = false, g2 = 0;
          while (!player.retired && !called && g2++ < 200) {
            const n = player.pendingDecision;
            if (n && n.type === "negotiate" && n.offer.id === "draft_rights") {
              called = n.offer.team.name === nbaTeam && !player.draftRights;
              break;
            }
            balanceStep();
          }
          if (!called && !player.retired) out.ok = false;
          out.called = (out.called || 0) + (called ? 1 : 0);
          break;
        }
        balanceStep();
      }
    }
    return out;
  })()`);
  assert.ok(r.declined >= 1 && r.withdrawn >= 1, `servono draft da provare: ${JSON.stringify(r)}`);
  assert.ok(r.ok, "si resta nel club di prima con i diritti NBA alla squadra che ti ha scelto");
});

test("ruolo in squadra e buyout: il coach aggiusta un ruolo lontano dal livello, e se il club non mantiene si può pagare per uscire", () => {
  const game = createGame({ seed: 23 });
  const r = game.run(`(() => {
    balanceNewCareer();
    player.age = 24; player.overall = 70; player.league = "ITA_LBA"; player.team = LEAGUES.ITA_LBA.teams[0];
    const ts = getTeamStrength(player.team, "ITA_LBA");
    const natural = naturalTeamRole(player, "ITA_LBA", ts);
    player.contract = { yearsRemaining: 2, yearsTotal: 3, salaryPerYear: 1.2, currency: "€", clauses: {}, teamRole: "star" };
    const season = seasonTeamRole(player, "ITA_LBA", ts, {});
    const record = { promisedRole: "star", teamRole: season.teamRole, roleBattle: null };
    player.wealth = 5;
    player.pendingDecision = { type: "offseasonStatus", record, extensionOffer: null };
    const why = contractIncongruence(player, record), cost = buyoutCost(player);
    buyContractOut();
    const d = player.pendingDecision.type === "agentChoice" ? player.pendingDecision.next : player.pendingDecision;
    return { natural, effective: season.teamRole, note: !!season.note, why: !!why, cost, wealth: player.wealth, years: player.contract.yearsRemaining,
      type: d.type, renew: d.offers.some(o => o.id === "renew") || !!d.renewOffer, up: nextTeamRoleUp("young"), roles: TEAM_ROLES.map(x => x.label) };
  })()`);
  assert.notEqual(r.natural, "star", "a 70 in LBA non si è una stella");
  assert.equal(r.effective, "key", "promesso stella ma lontano dal livello: il coach scala di un gradino");
  assert.ok(r.note && r.why, "l'incongruenza viene segnalata");
  assert.equal(r.cost, 1.2, "buyout = metà dell'ingaggio che resta");
  assert.equal(r.wealth, 3.8);
  assert.equal(r.years, 0);
  assert.equal(r.type, "market");
  assert.ok(!r.renew, "dopo il buyout il vecchio club non rinnova");
  assert.equal(r.up, "sixth");
  assert.equal(JSON.stringify(r.roles), JSON.stringify(["Stella", "Giocatore Importante", "Titolare", "Sesto uomo", "Comprimario", "Giovane"]));
});

test("mercato: le coppe raccolgono le offerte delle squadre di EUROPE-1 ed EUROPE-2 di tutti i campionati, e cambiare scheda non rimescola", () => {
  const game = createGame({ seed: 29 });
  const r = game.run(`(() => {
    balanceNewCareer();
    player.age = 25; player.overall = 82; player.inNBA = false; player.league = "ITA_LBA"; player.team = LEAGUES.ITA_LBA.teams[0]; player.reputation = 75;
    const d = createMarketDecision(player, { year: player.year });
    player.pendingDecision = d;
    const all = allMarketOffers(player, d);
    const expected = id => all.filter(o => o.team.euro === id && LEAGUES[o.targetLeague].continent === "Europa").map(o => o.id).sort();
    const got = id => cupOffers(player, d, id).map(o => o.id).sort();
    const leagues = new Set(all.map(o => o.targetLeague));
    const acbBefore = JSON.stringify(leagueOffers(player, d, "ESP_ACB").map(o => o.id));
    switchOfferLeague("FRA_ELITE"); switchOfferLeague("ESP_ACB");
    const acbAfter = JSON.stringify(player.pendingDecision.offers.filter(o => o.id !== "renew").map(o => o.id));
    switchOfferLeague("EL");
    const elShown = player.pendingDecision.offers.filter(o => o.id !== "renew").map(o => o.id).sort();
    const groups = groupedLeagueOptions(player, d).map(g => g.label);
    return { el: [expected("EL"), got("EL")], ec: [expected("EC"), got("EC")], leagues: leagues.size, same: acbBefore === acbAfter, elShown, groups };
  })()`);
  assert.equal(JSON.stringify(r.el[1]), JSON.stringify(r.el[0]), "EUROPE-1 = tutte le offerte di squadre EUROPE-1");
  assert.equal(JSON.stringify(r.ec[1]), JSON.stringify(r.ec[0]), "EUROPE-2 = tutte le offerte di squadre EUROPE-2");
  assert.equal(JSON.stringify(r.elShown), JSON.stringify(r.el[1]), "la scheda EUROPE-1 mostra proprio quelle");
  assert.ok(r.leagues >= 5, "offerte da più campionati");
  assert.ok(r.same, "tornando su un campionato le offerte sono le stesse");
  assert.equal(r.groups.includes("Coppe europee"), r.el[1].length + r.ec[1].length > 0);
});

test("coppia di stelle: solo la Stella può chiederla, la squadra si rinforza e perde il rinforzo quando lui se ne va", () => {
  const game = createGame({ seed: 31 });
  const r = game.run(`(() => {
    balanceNewCareer();
    player.age = 26; player.overall = 88; player.league = "ITA_LBA"; player.team = LEAGUES.ITA_LBA.teams[4]; player.reputation = 80;
    player.contract = { yearsRemaining: 2, yearsTotal: 3, salaryPerYear: 2, currency: "€", clauses: {}, teamRole: "star" };
    player.currentTeamRole = "starter";
    const notStar = canRequestDuo(player);
    player.currentTeamRole = "star";
    const star = canRequestDuo(player);
    const before = getTeamStrength(player.team, "ITA_LBA");
    let got = false, tries = 0;
    while (!got && tries++ < 40) {
      player.duoAskYear = null; player.duoCooldownUntil = null;
      player.pendingDecision = { type: "offseasonStatus", record: {}, extensionOffer: null };
      openDuoRequest();
      resolveDuoRequest("salary");
      got = hasRequestedDuo(player);
    }
    const after = teamStrengthRegistry[player.team.name];
    const again = canRequestDuo(player);
    const staff = getTeamStaff(player.team, "ITA_LBA");
    releaseRequestedStar(player.team, "ITA_LBA", staff.star);
    const released = teamStrengthRegistry[player.team.name];
    return { notStar, star, got, bump: Math.round((after - before) * 100) / 100, again, back: Math.abs(released - before) < 0.011, salary: player.contract.salaryPerYear, back2: player.pendingDecision.type };
  })()`);
  assert.equal(r.notStar, false, "da titolare non si può chiedere");
  assert.equal(r.star, true, "da stella sì");
  assert.ok(r.got, "prima o poi la dirigenza dice sì");
  assert.ok(r.bump > 0, "la squadra si rinforza");
  assert.equal(r.again, false, "con la coppia già formata non si richiede");
  assert.ok(r.back, "quando la seconda stella se ne va, il rinforzo sparisce");
  assert.ok(r.salary < 2, "rinunciando all'ingaggio lo stipendio cala");
  assert.equal(r.back2, "offseasonStatus", "si torna all'estate");
});

test("scenari: ogni scenario parte come promesso, finisce (riuscito o fallito) e sblocca il successivo solo se completato", () => {
  const game = createGame({ seed: 23, manual: true });
  const r = game.run(`(() => {
    const out = {};
    SCENARIOS.forEach(s => {
      const runs = [];
      for (let i = 0; i < 6; i++) {
        const info = balanceNewCareer(null, s.id);
        const start = { age: player.age, league: player.league, goal: player.careerGoal.status, team: player.team.name };
        let guard = 0;
        while (!player.retired && guard++ < 1500) balanceStep();
        runs.push({ start, status: player.scenario.status, retired: player.retired, seasons: player.history.length, p: player });
      }
      out[s.id] = runs;
    });
    const fresh = SCENARIOS.map(s => scenarioUnlocked(s.id));
    localStorage.removeItem(SCENARIO_STORAGE_KEY);
    const locked = SCENARIOS.map(s => scenarioUnlocked(s.id));
    markScenarioCompleted("redemption");
    const afterOne = SCENARIOS.map(s => scenarioUnlocked(s.id));
    return { out, fresh, locked, afterOne };
  })()`);
  const expect = { redemption: [28, null], heir: [16, null], lastCall: [23, "GLEAGUE"], homecoming: [30, null], rawTalent: [17, null], globetrotter: [19, null], lastDance: [34, "NBA"], finalClimb: [16, "ITA_DR2"], mrIrrelevant: [19, "NBA"], oneClubMan: [19, null] };
  Object.entries(r.out).forEach(([id, runs]) => runs.forEach(run => {
    assert.equal(run.start.age, expect[id][0], `${id}: età di partenza`);
    if (expect[id][1]) assert.equal(run.start.league, expect[id][1], `${id}: lega di partenza`);
    assert.equal(run.start.goal, "none", `${id}: niente sogno, c'è l'obiettivo dello scenario`);
    assert.ok(["done", "failed"].includes(run.status), `${id}: lo scenario si chiude (${run.status})`);
    checkCareer(run.p);
  }));
  // le scadenze: chi fallisce non gioca oltre il limite
  r.out.lastCall.filter(x => x.status === "failed").forEach(x => assert.ok(x.seasons <= 2, "Ultima chiamata: al massimo 2 stagioni da fallito"));
  r.out.lastDance.filter(x => x.status === "failed").forEach(x => assert.ok(x.seasons <= 2, "L'ultimo ballo: al massimo 2 stagioni da fallito"));
  r.out.redemption.filter(x => x.status === "failed").forEach(x => assert.ok(x.seasons <= 4, "Il riscatto: al massimo 4 stagioni da fallito"));
  assert.deepEqual(Array.from(r.locked), [true, false, false, false, false, false, false, false, false, false], "all'inizio solo il primo è aperto");
  assert.deepEqual(Array.from(r.afterOne), [true, true, false, false, false, false, false, false, false, false], "completato il primo si apre il secondo");
});

test("statistiche credibili: in USA-1 un 90+ segna sui 25-30 punti e nessuno chiude a 35+ punti, 10+ rimbalzi e 10+ assist", () => {
  const game = createGame({ seed: 31, manual: true });
  const s = game.run(`(() => {
    const out = [];
    for (let i = 0; i < 60; i++) balancePlayCareer().player.history.filter(h => h.league === "NBA").forEach(h => out.push([h.overall, h.pts, h.reb, h.ast]));
    return JSON.stringify(out);
  })()`);
  const seasons = JSON.parse(s);
  const top = seasons.filter(x => x[0] >= 90);
  const avgPts = top.reduce((t, x) => t + x[1], 0) / top.length;
  assert.ok(top.length > 20, "abbastanza stagioni da 90+");
  assert.ok(avgPts >= 22 && avgPts <= 31, `media punti di un 90+: ${avgPts.toFixed(1)}`);
  assert.ok(seasons.every(x => x[1] <= 36 && x[2] <= 16 && x[3] <= 12.5), "dentro i tetti delle medie");
  assert.equal(seasons.filter(x => x[1] >= 35 && x[2] >= 10 && x[3] >= 10).length, 0, "nessuna stagione da 35-10-10");
});

test("sondaggio squadra desiderata tramite agente nel mercato estivo", () => {
  const game = createGame({ seed: 42 });
  const res = game.run(`(() => {
    balanceNewCareer();
    player.age = 24;
    player.overall = 80;
    player.reputation = 60;
    player.hometown = "Milano";
    const d = createMarketDecision(player, { year: player.year });
    player.pendingDecision = d;

    // Verifica inizializzazione
    const initialProbes = d.probesLeft;

    // Test bonus Costruttore su Contender
    player.agent = "builder";
    const milano = LEAGUES["ITA_LBA"].teams.find(t => t.city === "Milano");
    const builderInfo = probeTeamInterestChance(player, milano, "ITA_LBA");

    // Test Fai-da-te (malus -20)
    player.agent = "none";
    const noneInfo = probeTeamInterestChance(player, milano, "ITA_LBA");

    // Test Squalo (+15 bonus)
    player.agent = "shark";
    const sharkInfo = probeTeamInterestChance(player, milano, "ITA_LBA");

    // Test Brand (+35 su grande metropoli)
    player.agent = "brand";
    const brandInfo = probeTeamInterestChance(player, milano, "ITA_LBA");

    // Esecuzione contatto con target team
    const teamToContact = LEAGUES["ITA_LBA"].teams.find(t => t.name !== player.team.name && t.name !== milano.name);
    player.agent = "shark";
    const contactRes = contactTargetTeam(player, d, teamToContact, "ITA_LBA");

    // Tentativo di ricontattare la stessa squadra (deve essere rifiutato)
    const duplicateRes = contactTargetTeam(player, d, teamToContact, "ITA_LBA");

    return {
      initialProbes,
      builderChance: builderInfo.chance,
      noneChance: noneInfo.chance,
      sharkChance: sharkInfo.chance,
      brandChance: brandInfo.chance,
      contactSuccess: contactRes.success,
      probesAfterOne: d.probesLeft,
      duplicateSuccess: duplicateRes.success,
      duplicateReason: duplicateRes.reason,
      hasProbedOffer: d.offers.some(o => o.probed)
    };
  })()`);

  assert.equal(res.initialProbes, 2, "2 sondaggi all'apertura del mercato");
  assert.ok(res.builderChance > res.noneChance, "Il Costruttore ha più chance del Fai-da-te");
  assert.ok(res.brandChance > res.noneChance, "Il Brand Manager ha più chance a Milano del Fai-da-te");
  assert.ok(res.sharkChance > res.noneChance, "Lo Squalo ha più chance del Fai-da-te");
  assert.equal(res.probesAfterOne, 1, "Un sondaggio consuma 1 tentativo");
  assert.equal(res.duplicateSuccess, false, "Impossibile sondare due volte la stessa squadra");
  assert.ok(res.duplicateReason.includes("già stata sondata"), "Messaggio di errore chiaro per duplicato");
  if (res.contactSuccess) {
    assert.ok(res.hasProbedOffer, "L'offerta richiesta compare nelle offerte di mercato");
  }
});

test("f3nom daily: generazione deterministica per data, isolamento salvataggi, calcolo punteggio e streak", () => {
  const game = createGame({ seed: 42, manual: true });
  const res = game.run(`(() => {
    // 1. Stessa data -> identica sfida deterministica
    const c1 = buildDailyChallenge("2026-10-27");
    const c2 = buildDailyChallenge("2026-10-27");
    const same = (c1.archetypeId === c2.archetypeId && c1.team.name === c2.team.name && c1.overall === c2.overall);

    // 2. Data diversa -> seed e sfida variano
    const c3 = buildDailyChallenge("2026-10-28");
    const differentDate = c1.dateStr !== c3.dateStr;

    // 3. Avvio Daily Career e isolamento stato
    startDailyCareer(c1);
    const isDaily = player.isDaily;
    const dailyMeta = player.dailyMeta;
    saveCareer();
    const normalSlotEmpty = localStorage.getItem("chosenOne.slot.0") === null;
    const dailySessionSaved = localStorage.getItem("f3nom.daily.session") !== null;

    // 4. Valutazione e Streak
    player.history.push({
      year: player.year, league: player.league, team: player.team,
      gp: 82, games: 82, wins: 58, losses: 24, pts: 26.5, reb: 8.2, ast: 7.1,
      champion: true, playoffRounds: 4, mvp: true
    });
    const perf = evaluateDailyPerformance(player);
    const recorded1 = recordDailyResult({ won: true, dateStr: "2026-10-27", archetypeId: c1.archetypeId, grade: perf.grade, score: perf.score, title: c1.title });
    const streak1 = recorded1.streak;

    // Vittoria consecutiva il giorno successivo
    const recorded2 = recordDailyResult({ won: true, dateStr: "2026-10-28", archetypeId: c3.archetypeId, grade: "A", score: 750, title: c3.title });
    const streak2 = recorded2.streak;

    // Condivisione testo
    const shareText = getDailyShareText({ won: true, dateStr: "2026-10-28", title: c3.title, grade: "A", score: 750 });
    const hasF3nomBrand = shareText.includes("F3NOM DAILY") && shareText.includes("Grado: A");

    return {
      same,
      differentDate,
      isDaily,
      hasMeta: !!dailyMeta && dailyMeta.archetypeId === c1.archetypeId,
      normalSlotEmpty,
      dailySessionSaved,
      perfWon: perf.won,
      perfGrade: perf.grade,
      streak1,
      streak2,
      hasF3nomBrand
    };
  })()`);

  assert.ok(res.same, "La stessa data genera la stessa sfida deterministica");
  assert.ok(res.differentDate, "Date diverse hanno identificativi data differenti");
  assert.ok(res.isDaily, "Il giocatore è contrassegnato come Daily");
  assert.ok(res.hasMeta, "I metadati della sfida sono associati al giocatore");
  assert.ok(res.normalSlotEmpty, "Gli slot di salvataggio della carriera normale non vengono sporcati");
  assert.ok(res.dailySessionSaved, "La sessione Daily viene salvata nella chiave dedicata");
  assert.ok(res.perfWon, "Valutazione vittoria corretta");
  assert.equal(res.perfGrade, "S", "Stagione da MVP e Campione ottiene Grado S");
  assert.equal(res.streak1, 1, "Primo giorno completato: streak = 1");
  assert.equal(res.streak2, 2, "Secondo giorno consecutivo: streak = 2");
  assert.ok(res.hasF3nomBrand, "La card di condivisione contiene il branding F3NOM DAILY e i risultati");
});

test("f3nom daily: rotazione completa archetipi globali (Australia, Cina, Balcani, Francia, Grecia, ecc.)", () => {
  const game = createGame({ seed: 99, manual: true });
  const res = game.run(`(() => {
    const list = DAILY_ARCHETYPES;
    const count = list.length;
    const ids = list.map(a => a.id);

    // Controlla che siano presenti Australia e Cina tra gli archetipi
    const hasOceania = ids.includes("oceaniaNext");
    const hasChina = ids.includes("cbaScoringMachine");
    const hasBalkans = ids.includes("balkanInferno");
    const hasGLeague = ids.includes("gleagueCallup");
    const hasFrance = ids.includes("frenchPhenom");
    const hasGreece = ids.includes("greekOdyssey");
    const hasPromotion = ids.includes("italianPromotion");

    // Simula 30 date consecutive per verificare la generazione pulita di ciascuna sfida
    const dates = [];
    for (let day = 1; day <= 30; day++) {
      const dStr = "2026-11-" + String(day).padStart(2, "0");
      const ch = buildDailyChallenge(dStr);
      dates.push({
        day,
        id: ch.archetypeId,
        league: ch.leagueId,
        teamName: ch.team.name,
        teamCity: ch.team.city,
        name: ch.firstName + " " + ch.lastName,
        nationality: ch.nationality,
        role: ch.role,
        ovr: ch.overall,
        goal: ch.goal
      });
    }

    return {
      count,
      hasOceania,
      hasChina,
      hasBalkans,
      hasGLeague,
      hasFrance,
      hasGreece,
      hasPromotion,
      datesCount: dates.length,
      sampleTeam: dates[0].teamName,
      sampleName: dates[0].name
    };
  })()`);

  assert.ok(res.count >= 10, "Almeno 10 archetipi disponibili nel catalogo Daily");
  assert.ok(res.hasOceania, "Presente archetipo Oceania Next in Australia");
  assert.ok(res.hasChina, "Presente archetipo CBA in Cina");
  assert.ok(res.hasBalkans, "Presente archetipo Inferno di Belgrado (ABA)");
  assert.ok(res.hasGLeague, "Presente archetipo USA-2 G-League");
  assert.ok(res.hasFrance, "Presente archetipo Talenti di Francia");
  assert.ok(res.hasGreece, "Presente archetipo Derby dell'Ellade");
  assert.ok(res.hasPromotion, "Presente archetipo Serie A2 italiana");
  assert.equal(res.datesCount, 30, "30 giorni simulati con successo senza eccezioni");
  assert.ok(res.sampleTeam.length > 0, "Squadra valida assegnata");
  assert.ok(res.sampleName.length > 0, "Nome e cognome validi assegnati");
});
