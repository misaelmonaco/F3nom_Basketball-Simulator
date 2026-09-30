/* Test dell'interfaccia nel browser vero (Edge o Chrome senza interfaccia, vedi tools/browser.js).
   Controllano che i pulsanti delle schermate rispondano davvero al clic: un pulsante disegnato
   ma senza azione collegata (com'era successo alle clausole della trattativa) fa fallire il test.
   Uso: npm run test:ui (se non c'è un browser i test vengono saltati) */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { openGame, findBrowser } = require("./browser");

const harnessSrc = fs.readFileSync(path.join(__dirname, "harness.js"), "utf8");
const driverSource = vm.runInNewContext(harnessSrc + "\n;driverSource", { require, module: {}, exports: {}, __dirname, console });
const skip = findBrowser() ? false : "nessun Edge o Chrome installato";

async function newGame(opts) {
  const g = await openGame(opts);
  await g.evaluate(`localStorage.clear(); 1`);
  await g.reload();
  await g.evaluate(`(() => { const st = document.createElement("style"); st.textContent = "*{animation:none!important;transition:none!important}"; document.head.appendChild(st); return 1; })()`);
  await g.evaluate(driverSource({ manual: true }) + "; 1");
  return g;
}

/* Elementi cliccabili visibili e attivi che non hanno nessuna azione collegata. Si accettano
   i pulsanti gestiti per delega (suoni, tema, aiuto), le etichette dei campi e i link. */
async function deadButtons(g, rootSelector) {
  const list = await g.send("Runtime.evaluate", { expression: `(() => {
    const root = document.querySelector(${JSON.stringify(rootSelector)});
    if (!root) return [];
    return [...root.querySelectorAll('button, [role="button"]')].filter(el => {
      if (el.disabled || el.getAttribute("aria-disabled") === "true") return false;
      if (el.matches("[data-sound-toggle], [data-theme-toggle], [data-help], [data-goto]")) return false;
      const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && !el.closest(".hidden");
    });
  })()`, returnByValue: false });
  if (!list.result.objectId) return [];
  const props = await g.send("Runtime.getProperties", { objectId: list.result.objectId, ownProperties: true });
  const dead = [];
  for (const prop of props.result) {
    if (!/^\d+$/.test(prop.name) || !prop.value || !prop.value.objectId) continue;
    const own = await g.send("DOMDebugger.getEventListeners", { objectId: prop.value.objectId, depth: 0 });
    if (own.listeners.some(l => l.type === "click")) continue;
    // anche un antenato con un clic delegato va bene (per esempio i giorni del calendario)
    const label = await g.send("Runtime.callFunctionOn", { objectId: prop.value.objectId, returnByValue: true,
      functionDeclaration: "function () { return (this.id ? '#' + this.id + ' ' : '') + (this.className ? '.' + String(this.className).trim().split(/\\s+/).join('.') + ' ' : '') + '\"' + (this.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 40) + '\"'; }" });
    dead.push(label.result.value);
  }
  return dead;
}

test("creazione a passi: dal primo passo alla squadra, poi la carriera parte", { skip, timeout: 120000 }, async () => {
  const g = await newGame();
  try {
    assert.equal(await g.evaluate(`document.querySelectorAll("#save-slots .slot-card").length`), 3, "tre slot di salvataggio");
    assert.deepEqual(await deadButtons(g, "#screen-create"), [], "pulsanti della home senza azione");
    await g.evaluate(`(() => { const q = s => document.querySelector(s); q("#btn-wizard-next").click();
      q('.court-pos[data-role="SF"]').dispatchEvent(new MouseEvent("click", { bubbles: true })); q('[data-arch="SF_3D"]').click(); return 1; })()`);
    for (let i = 0; i < 3; i++) await g.evaluate(`document.querySelector("#btn-wizard-next").click(); 1`);
    assert.equal(await g.evaluate(`wizardStep`), 5, "si arriva al passo del percorso");
    await g.evaluate(`document.querySelector('[data-path="EU_YOUTH"]').click(); document.querySelector("#btn-wizard-next").click(); 1`);
    assert.ok(await g.evaluate(`!document.querySelector("#screen-onboarding").classList.contains("hidden")`), "schermata della squadra");
    assert.deepEqual(await deadButtons(g, "#screen-onboarding"), [], "pulsanti della scelta squadra senza azione");
    await g.evaluate(`document.querySelector("#grid-team-choice .option-card").click(); document.querySelector("#btn-confirm-onboarding").click(); 1`);
    assert.ok(await g.evaluate(`!!player && !document.querySelector("#screen-game").classList.contains("hidden")`), "la carriera è partita");
    assert.deepEqual(g.errors, [], "nessun errore JavaScript");
  } finally { await g.close(); }
});

test("ogni pulsante visibile ha un'azione, in tutte le schermate di una carriera", { skip, timeout: 600000 }, async () => {
  const g = await newGame();
  try {
    await g.evaluate(`balanceNewCareer(); document.querySelector("#screen-create").classList.add("hidden"); renderGameScreen(); 1`);
    const seen = new Set(), problems = [];
    let dashboardChecked = false;
    for (let step = 0; step < 2500; step++) {
      const st = await g.evaluate(`(() => { const d = player.pendingDecision; return { type: d ? (d.type === "draftCombine" ? "draftCombine_" + d.stage : d.type) : null, retired: player.retired, seasons: player.history.length }; })()`);
      if (st.retired) break;
      if (st.type && !seen.has(st.type)) {
        seen.add(st.type);
        await g.evaluate(`renderGameScreen(); 1`);
        (await deadButtons(g, "#screen-offseason")).forEach(b => problems.push(`${st.type}: ${b}`));
      }
      if (!st.type && !dashboardChecked && st.seasons >= 2) {
        dashboardChecked = true;
        for (const tab of ["panoramica", "carriera", "statistiche", "trofei", "traguardi", "profilo"]) {
          await g.evaluate(`switchGameTab("${tab}"); renderGameScreen(); 1`);
          (await deadButtons(g, "#screen-game")).forEach(b => problems.push(`dashboard/${tab}: ${b}`));
        }
      }
      await g.evaluate(`balanceStep(); 1`);
    }
    await g.evaluate(`popupQueue = []; popupActive = false; renderFinalScreen(); 1`);
    (await deadButtons(g, "#screen-final")).forEach(b => problems.push(`fine carriera: ${b}`));
    assert.ok(seen.size >= 10, `poche schermate viste: ${[...seen].join(", ")}`);
    assert.deepEqual(problems, [], "pulsanti senza azione");
    assert.deepEqual(g.errors, [], "nessun errore JavaScript");
  } finally { await g.close(); }
});

test("trattativa: ogni richiesta e ogni clausola risponde al clic", { skip, timeout: 120000 }, async () => {
  const g = await newGame();
  try {
    const r = await g.evaluate(`(async () => {
      balanceNewCareer();
      player.age = 25; player.overall = 88; player.reputation = 85; player.agentChosen = true;
      player.league = "ITA_LBA"; player.team = LEAGUES.ITA_LBA.teams[2]; player.inNBA = false;
      const m = createMarketDecision(player, { year: player.year });
      player.pendingDecision = m;
      document.querySelector("#screen-create").classList.add("hidden");
      renderGameScreen();
      selectOffer(m.offers[0], m);
      const out = [];
      const rows = [...document.querySelectorAll("#off-cards .co-ask")].map(b => b.id || b.dataset.clause);
      for (const key of rows) {
        const d = player.pendingDecision;
        if (d.type !== "negotiate") break;
        const offer = d.offer;
        offer.patience = 3; // senza pazienza la dirigenza non ascolta più: qui interessa solo che il clic arrivi
        const before = JSON.stringify(offer.attempts);
        const el = key.startsWith("btn-") ? document.getElementById(key) : document.querySelector('[data-clause="' + key + '"]');
        if (!el || el.disabled) continue;
        el.click();
        out.push([key, JSON.stringify(player.pendingDecision.offer ? player.pendingDecision.offer.attempts : null) !== before]);
      }
      return out;
    })()`);
    assert.ok(r.length >= 4, `righe della trattativa trovate: ${JSON.stringify(r)}`);
    r.forEach(([key, changed]) => assert.ok(changed, `il clic su "${key}" non ha fatto niente`));
  } finally { await g.close(); }
});

test("mercato: campionati, coppe europee e offerta lampo", { skip, timeout: 120000 }, async () => {
  const g = await newGame();
  try {
    const r = await g.evaluate(`(() => {
      balanceNewCareer();
      player.age = 25; player.overall = 84; player.reputation = 90; player.agentChosen = true;
      player.league = "ITA_LBA"; player.team = LEAGUES.ITA_LBA.teams[2]; player.inNBA = false;
      let m, tries = 0;
      do { m = createMarketDecision(player, { year: player.year }); } while ((!m.flash || !cupOffers(player, m, "EL").length) && tries++ < 60);
      const hadFlash = !!m.flash;
      player.pendingDecision = m;
      document.querySelector("#screen-create").classList.add("hidden");
      renderGameScreen();
      const flashShown = !!document.querySelector(".co-offer--flash");
      document.querySelector('.league-pill[data-league="ESP_ACB"]').click();
      const acb = player.pendingDecision.selectedLeague;
      const ticks = player.pendingDecision.flashTicks;
      document.querySelector('.league-pill[data-league="EL"]').click();
      const elOffers = player.pendingDecision.offers.filter(o => o.id !== "renew").every(o => o.team.euro === "EL");
      const expired = !player.pendingDecision.flash;
      document.querySelector("#off-cards .off-card").click();
      return { flash: hadFlash, flashShown, acb, ticks, elOffers, expired, opened: player.pendingDecision.type };
    })()`);
    assert.ok(r.flash && r.flashShown, `l'offerta lampo compare in testa: ${JSON.stringify(r)}`);
    assert.equal(r.acb, "ESP_ACB", "il clic sul campionato cambia le offerte");
    assert.equal(r.ticks, 1, "cambiare campionato consuma una mossa dell'offerta lampo");
    assert.ok(r.elOffers, "la scheda EuroLeague mostra solo squadre di EuroLeague");
    assert.ok(r.expired, "dopo due mosse l'offerta lampo scade");
    assert.equal(r.opened, "negotiate", "il clic su un'offerta apre la trattativa");
    assert.deepEqual(g.errors, [], "nessun errore JavaScript");
  } finally { await g.close(); }
});

test("dashboard: Panoramica per prima e menu Altro della barra d'azione", { skip, timeout: 120000 }, async () => {
  const g = await newGame();
  try {
    await g.evaluate(`balanceNewCareer(); document.querySelector("#screen-create").classList.add("hidden"); switchGameTab("panoramica"); renderGameScreen(); 1`);
    for (let i = 0; i < 400 && !(await g.evaluate(`!player.pendingDecision && player.history.length >= 2`)); i++) await g.evaluate(`balanceStep(); 1`);
    await g.evaluate(`renderGameScreen(); 1`);
    const r = await g.evaluate(`(() => {
      const q = s => document.querySelector(s);
      const panel = q('[data-tab-panel="panoramica"]');
      const out = { active: panel.classList.contains("active"), hero: !!q("#ov-hero .ov-ovr__val"), deltas: document.querySelectorAll("#attr-list .delta").length };
      out.menuHidden = q("#ab-menu").classList.contains("hidden");
      q("#ab-more-btn").click();
      out.menuOpen = !q("#ab-menu").classList.contains("hidden");
      return out;
    })()`);
    assert.ok(r.active && r.hero, `la Panoramica è la scheda aperta: ${JSON.stringify(r)}`);
    assert.equal(r.deltas, 6, "ogni attributo ha la sua variazione");
    assert.ok(r.menuHidden && r.menuOpen, "il menu Altro si apre al clic");
    assert.deepEqual(await deadButtons(g, "#ab-menu"), [], "voci del menu senza azione");
    const closed = await g.evaluate(`(() => { document.querySelector("#ov-hero").click(); return document.querySelector("#ab-menu").classList.contains("hidden"); })()`);
    assert.ok(closed, "un clic fuori chiude il menu");
    const tab = await g.evaluate(`(() => { document.querySelector('#ov-news [data-ov-tab]').click(); return document.querySelector('[data-tab-panel="carriera"]').classList.contains("active"); })()`);
    assert.ok(tab, "Tutte le notizie porta alla scheda Carriera");
    assert.deepEqual(g.errors, [], "nessun errore JavaScript");
  } finally { await g.close(); }
});

test("guida del primo allenatore: una volta per decisione, glossario e interruttore", { skip, timeout: 120000 }, async () => {
  const g = await newGame();
  try {
    const r = await g.evaluate(`(() => {
      balanceNewCareer(); document.querySelector("#screen-create").classList.add("hidden");
      advanceSeason(); // il sogno di carriera
      const first = !!document.querySelector("#off-guide .guide-card");
      renderGameScreen();
      const again = !!document.querySelector("#off-guide .guide-card");
      resetGuide(); renderGameScreen();
      document.querySelector("#guide-glossary").click();
      const glossary = document.querySelectorAll("#info-dialog-body .glossary dt").length;
      closeInfoDialog();
      resetGuide(); renderGameScreen();
      document.querySelector("#guide-off").click();
      const off = !guideOn();
      renderGameScreen();
      const hiddenWhenOff = !document.querySelector("#off-guide .guide-card");
      return { type: player.pendingDecision.type, first, again, glossary, off, hiddenWhenOff };
    })()`);
    assert.equal(r.type, "careerGoal");
    assert.ok(r.first && !r.again, `la scheda compare solo la prima volta: ${JSON.stringify(r)}`);
    assert.ok(r.glossary >= 20, "il glossario elenca le spiegazioni");
    assert.ok(r.off && r.hiddenWhenOff, "con la guida spenta la scheda non compare");
    assert.deepEqual(g.errors, [], "nessun errore JavaScript");
  } finally { await g.close(); }
});
