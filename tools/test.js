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
  const { rate, seasons, grades } = titleRate(createGame({ seed: 42, manual: true }), 250, 90);
  assert.ok(seasons >= 50, `poche stagioni da 90+ per misurare: ${seasons}`);
  assert.ok(rate >= 0.12 && rate <= 0.35, `tasso di titoli ${(rate * 100).toFixed(1)}%`);
  const s = (grades.S || 0) / 250;
  assert.ok(s >= 0.02 && s <= 0.15, `carriere da S: ${(s * 100).toFixed(1)}%`);
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
