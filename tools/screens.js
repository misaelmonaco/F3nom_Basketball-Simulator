/* Foto delle schermate principali: gioca una carriera (sempre la stessa, casualità fissata) e
   fotografa ogni tipo di schermata la prima volta che compare, più dashboard, fine carriera e
   telefono. Servono a controllare il design e a confrontare due versioni pixel per pixel.
   Uso: node tools/screens.js [--theme=light] [--out=cartella] [--pdf=file.pdf] [--quick]
   (--quick: solo creazione, una stagione, mercato, trattativa e dashboard) */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { spawnSync } = require("child_process");
const { openGame, findBrowser, sleep, ROOT } = require("./browser");

const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, "").split("="); return [k, v == null ? true : v]; }));
const THEME = args.theme === "light" ? "light" : "dark";
const OUT = path.resolve(args.out || path.join(ROOT, "tools", "screens", THEME));
const W = 1280, VH = 820, SLICE = 1800;

// il driver che gioca da solo ogni decisione, preso da tools/harness.js
const harnessSrc = fs.readFileSync(path.join(__dirname, "harness.js"), "utf8");
const driverSource = vm.runInNewContext(harnessSrc + "\n;driverSource", { require, module: {}, exports: {}, __dirname, console });

async function main() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const game = await openGame({ width: W, height: VH, theme: THEME });
  const { evaluate, send, setViewport } = game;
  const shots = [];
  const quiet = `(() => { const st = document.createElement("style"); st.textContent = "#toast-wrap,#trophy-overlay,.overlay{display:none!important} *{animation:none!important;transition:none!important}"; document.head.appendChild(st); return 1; })()`;
  await evaluate(`localStorage.clear(); localStorage.setItem("chosenOne.theme", ${JSON.stringify(THEME)}); 1`);
  await game.reload();
  await evaluate(quiet);
  await evaluate(driverSource({ manual: true }) + "; 1");

  async function capture(title, section, note, opts = {}) {
    const mobile = game.isMobile();
    const width = mobile ? 390 : W, vh = mobile ? 844 : VH;
    await sleep(opts.wait || 250);
    const full = await evaluate(`Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)`);
    const h = opts.viewportOnly ? vh : Math.min(full, opts.maxH || (mobile ? 2600 : 4200));
    await setViewport(width, Math.max(h, vh));
    await evaluate(`window.scrollTo(0,0); 1`);
    await sleep(200);
    const files = [];
    const slice = mobile ? 1400 : SLICE;
    for (let y = 0, i = 0; y < h; y += slice, i++) {
      const sh = Math.min(slice, h - y);
      if (i > 0 && sh < 160) break;
      const r = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y, width, height: sh, scale: 1 }, captureBeyondViewport: true });
      const file = path.join(OUT, `${String(shots.length + 1).padStart(2, "0")}_${i}.png`);
      fs.writeFileSync(file, Buffer.from(r.data, "base64"));
      files.push(file);
    }
    await setViewport(width, vh);
    shots.push({ title, section, note: note || "", files, mobile });
    console.log(`  ${String(shots.length).padStart(2, "0")} ${section} · ${title}`);
  }

  /* ---------- creazione ---------- */
  await capture("Home e creazione · Identità", "Creazione del giocatore", "Slot delle carriere, identità, aspetto, nazionalità e città natale, difficoltà.");
  await evaluate(`(() => {
    const q = s => document.querySelector(s);
    q("#inp-firstname").value = "Marco"; q("#inp-lastname").value = "Rinaldi";
    q("#inp-nationality").value = "Italia"; q("#inp-nationality").dispatchEvent(new Event("change"));
    q("#inp-hometown").value = "Milano";
    selLook = sanitizeLook({ skin: 1, hair: "curly", hairColor: 1, beard: "stubble", headband: true }); renderLookEditor();
    renderWizardPreview(); return 1; })()`);
  await capture("Identità compilata", "Creazione del giocatore");
  await evaluate(`(() => { const q = s => document.querySelector(s); q("#btn-wizard-next").click();
    q('.court-pos[data-role="PG"]').dispatchEvent(new MouseEvent("click", { bubbles: true })); q('[data-arch="PG_PNR"]').click(); return 1; })()`);
  await capture("Ruolo e archetipo", "Creazione del giocatore");
  await evaluate(`(() => { const q = s => document.querySelector(s); q("#btn-wizard-next").click();
    q('#grid-hand [data-id="left"]').click(); q('#grid-bodytype [data-id="explosive"]').click(); return 1; })()`);
  await capture("Fisico", "Creazione del giocatore");
  await evaluate(`(() => { const q = s => document.querySelector(s); q("#btn-wizard-next").click();
    q('[data-trait="leader"]').click(); q('[data-trait="ice"]').click(); return 1; })()`);
  await capture("Talento", "Creazione del giocatore");
  await evaluate(`(() => { const q = s => document.querySelector(s); q("#btn-wizard-next").click(); q('[data-path="EU_YOUTH"]').click(); return 1; })()`);
  await capture("Percorso di partenza", "Creazione del giocatore");
  await evaluate(`(() => { const q = s => document.querySelector(s); q("#btn-wizard-next").click(); q("#grid-team-choice .option-card").click(); q('.jersey-pick[data-num="7"]').click(); return 1; })()`);
  await capture("Squadra, maglia e rapporto degli scout", "Creazione del giocatore");
  await evaluate(`(() => { document.querySelector("#btn-confirm-onboarding").click(); return 1; })()`);

  /* ---------- carriera giocata dal driver ---------- */
  const LABELS = {
    careerGoal: ["Il sogno di carriera", "Decisioni"], seasonFocus: ["Focus della stagione", "Decisioni"], roleBattle: ["Sfida per il posto", "Decisioni"],
    seasonBlock: ["Stagione regolare a tratti", "Stagione"], postseason: ["Playoff", "Stagione"], seasonRecap: ["Resoconto della stagione", "Stagione"],
    injuryChoice: ["Infortunio grave", "Stagione"], training: ["Allenamento estivo a punti", "Estate"], sponsorOffer: ["Proposta di sponsor", "Estate"],
    lifeEvent: ["Vita privata", "Estate"], mentorOffer: ["Un giovane da far crescere", "Estate"], summerSpending: ["Spese e investimenti estivi", "Estate"],
    offseasonChoice: ["Imprevisto estivo", "Estate"], offseasonReveal: ["Esito dell'imprevisto", "Estate"], nationalReveal: ["Torneo con la Nazionale", "Estate"],
    draft: ["Il Draft ti chiama", "Draft NBA"], agentChoice: ["Scelta dell'agente", "Mercato e contratti"], market: ["Mercato estivo", "Mercato e contratti"],
    negotiate: ["Trattativa", "Mercato e contratti"], offseasonStatus: ["Sotto contratto", "Mercato e contratti"], playerOption: ["Player option", "Mercato e contratti"],
    duoRequest: ["Una seconda stella", "Mercato e contratti"],
  };
  const done = new Set();
  let dashboardDone = false;
  for (let guard = 0; guard < 3000; guard++) {
    const st = await evaluate(`(() => { const d = player.pendingDecision; return { type: d ? d.type : null, stage: d && d.stage, retired: player.retired, seasons: player.history.length, age: player.age }; })()`);
    if (st.retired) break;
    const key = st.type === "draftCombine" ? `draftCombine_${st.stage}` : st.type;
    if (key && !done.has(key) && !(st.type === "seasonBlock" && st.seasons >= 3)) {
      done.add(key);
      const lab = st.type === "draftCombine" ? [{ combine: "Draft Combine", workout: "Provino privato", night: "La notte del Draft" }[st.stage], "Draft NBA"] : LABELS[st.type];
      if (lab) { await evaluate(`renderGameScreen(); 1`); await capture(lab[0], lab[1], "", { wait: st.type === "offseasonReveal" ? 1600 : 300 }); }
    }
    if (!st.type && !dashboardDone && st.seasons >= (args.quick ? 2 : 7)) {
      dashboardDone = true;
      for (const [tab, name] of [["panoramica", "Panoramica"], ["carriera", "Carriera"], ["statistiche", "Statistiche"], ["trofei", "Trofei"], ["traguardi", "Traguardi"], ["profilo", "Scheda"]]) {
        await evaluate(`switchGameTab(${JSON.stringify(tab)}); renderGameScreen(); 1`);
        await capture(`Dashboard · ${name}`, "Dashboard", `Dopo ${st.seasons} stagioni, a ${st.age} anni.`);
      }
      await evaluate(`switchGameTab("panoramica"); renderGameScreen(); 1`);
      await setViewport(390, 844, true);
      await capture("Dashboard su telefono", "Telefono", "", { viewportOnly: true });
      await setViewport(W, VH, false);
      if (args.quick) break;
    }
    await evaluate(`balanceStep(); 1`);
  }

  if (!args.quick) {
    await evaluate(`popupQueue = []; popupActive = false; renderFinalScreen(); 1`);
    await capture("Schermata finale", "Fine carriera", "Voto, eredità, biografia, sala dei trofei, dopo il ritiro, traguardi.", { maxH: 9000, wait: 600 });
  }
  await game.reload();
  await evaluate(quiet);
  await capture("Home con una carriera salvata", "Creazione del giocatore", "", { viewportOnly: true });
  await evaluate(`document.querySelector("#btn-open-achievements").click(); 1`);
  await capture("Traguardi e albo d'oro", "Fine carriera");
  await setViewport(390, 844, true);
  await game.reload();
  await evaluate(quiet);
  await capture("Creazione su telefono", "Telefono", "", { viewportOnly: true });

  if (game.errors.length) console.log("Errori JavaScript nella pagina:\n  " + game.errors.join("\n  "));
  await game.close();
  fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(shots.map(s => ({ ...s, files: s.files.map(f => path.basename(f)) })), null, 1));
  console.log(`${shots.length} schermate in ${OUT}`);
  if (args.pdf) buildPdf(shots, path.resolve(args.pdf));
}

/* PDF: copertina con i colori del tema, poi una schermata per pagina */
function buildPdf(shots, pdfPath) {
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const url = f => "file:///" + f.replace(/\\/g, "/");
  const tokens = fs.readFileSync(path.join(ROOT, "tokens.css"), "utf8");
  const block = tokens.slice(tokens.indexOf(":root {"), tokens.indexOf("}", tokens.indexOf(":root {")));
  const colors = [...block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\));/g)].map(m => [m[1], m[2]]);
  const pages = shots.flatMap((s, i) => s.files.map((f, j) => `<section class="shot"><div class="sec">${esc(s.section)}</div><h2>${i + 1}. ${esc(s.title)}${s.files.length > 1 ? ` <small>(${j + 1}/${s.files.length})</small>` : ""}</h2>${s.note && !j ? `<p>${esc(s.note)}</p>` : ""}<div class="frame"><img src="${url(f)}"></div></section>`)).join("");
  const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"><style>
    @page { size: A4; margin: 12mm; } * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: "Segoe UI", Arial, sans-serif; color: #1a1f27; margin: 0; }
    .cover { page-break-after: always; } .cover h1 { font-size: 34pt; margin: 20mm 0 4mm; } .cover h1 span { color: #ff5a1f; }
    .sw { display: inline-block; width: 42mm; margin: 0 2mm 3mm 0; border: 1px solid #ddd; border-radius: 2mm; overflow: hidden; font-size: 8pt; } .sw i { display: block; height: 12mm; } .sw div { padding: 1.5mm 2mm; }
    .shot { page-break-after: always; height: 270mm; display: flex; flex-direction: column; } .sec { font-size: 8pt; text-transform: uppercase; letter-spacing: .1em; color: #ff5a1f; font-weight: 700; }
    h2 { font-size: 14pt; margin: 1mm 0; } p { font-size: 9pt; color: #555; margin: 0; }
    .frame { flex: 1; min-height: 0; display: flex; justify-content: center; } .frame img { max-width: 100%; max-height: 100%; object-fit: contain; border: 1px solid #ccc; }
  </style></head><body><div class="cover"><h1>CHOSEN <span>ONE</span></h1><p>Le schermate principali · tema ${THEME === "light" ? "Day" : "Arena"} · ${new Date().toLocaleDateString("it-IT")}</p><h3>Colori</h3>${colors.map(([k, v]) => `<span class="sw"><i style="background:${v}"></i><div><b>--${k}</b><br>${v}</div></span>`).join("")}</div>${pages}</body></html>`;
  const htmlPath = path.join(OUT, "schermate.html");
  fs.writeFileSync(htmlPath, html);
  const r = spawnSync(findBrowser(), ["--headless=new", "--disable-gpu", "--no-pdf-header-footer", "--allow-file-access-from-files", `--print-to-pdf=${pdfPath}`, url(htmlPath)], { encoding: "utf8" });
  console.log(r.status === 0 ? `PDF: ${pdfPath}` : `PDF non creato: ${r.stderr}`);
}

main().catch(e => { console.error(e); process.exit(1); });
