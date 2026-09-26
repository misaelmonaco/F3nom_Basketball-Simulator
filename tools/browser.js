/* Il gioco in un browser vero, senza dipendenze: un server statico sulla cartella del progetto
   e Edge (o Chrome) senza interfaccia, pilotato con il DevTools Protocol. Lo usano i test
   dell'interfaccia (tools/ui-test.js) e le foto delle schermate (tools/screens.js). */
"use strict";
const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml", ".woff2": "font/woff2", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg" };

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/microsoft-edge",
  ].filter(Boolean);
  return candidates.find(p => { try { return fs.statSync(p).isFile(); } catch (e) { return false; } }) || null;
}

/* Server statico sulla cartella del progetto, su una porta libera */
function startServer(root = ROOT) {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split("?")[0]);
    const file = path.join(root, url === "/" ? "index.html" : url);
    if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
      res.end(data);
    });
  });
  return new Promise(resolve => server.listen(0, "127.0.0.1", () => resolve({ server, url: `http://127.0.0.1:${server.address().port}/` })));
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* Apre il browser sulla pagina del gioco e restituisce i comandi per pilotarlo */
async function openGame({ width = 1280, height = 820, theme = "dark", seed = 20260925 } = {}) {
  const exe = findBrowser();
  if (!exe) throw new Error("Nessun Edge o Chrome trovato: imposta CHROME_PATH.");
  const { server, url } = await startServer();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "chosen-one-"));
  const port = 9300 + Math.floor(Math.random() * 500);
  const proc = spawn(exe, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--no-first-run",
    "--no-default-browser-check", "--hide-scrollbars", `--window-size=${width},${height}`, "about:blank"], { stdio: "ignore" });
  let target;
  for (let i = 0; i < 80 && !target; i++) {
    await sleep(150);
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === "page"); } catch (e) { /* non ancora pronto */ }
  }
  if (!target) { proc.kill(); server.close(); throw new Error("Il browser non risponde."); }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener("open", resolve); ws.addEventListener("error", reject); });
  let seq = 0;
  const pending = new Map();
  const errors = []; // errori JavaScript della pagina
  ws.addEventListener("message", ev => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id); pending.delete(msg.id);
      msg.error ? p.reject(new Error(`${p.method}: ${msg.error.message}`)) : p.resolve(msg.result);
    } else if (msg.method === "Runtime.exceptionThrown") {
      errors.push(msg.params.exceptionDetails.exception ? msg.params.exceptionDetails.exception.description : msg.params.exceptionDetails.text);
    }
  });
  const send = (method, params = {}) => {
    const id = ++seq;
    ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => pending.set(id, { resolve, reject, method }));
  };
  const evaluate = async expr => {
    const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(`${expr.slice(0, 100)} → ${r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text}`);
    return r.result.value;
  };
  let mobile = false;
  const setViewport = async (w, h, isMobile = mobile) => { mobile = isMobile; await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: isMobile }); };
  await send("Page.enable");
  await send("Runtime.enable");
  await setViewport(width, height, false);
  // tema e casualità fissati prima che la pagina parta: la stessa carriera a ogni esecuzione
  await send("Page.addScriptToEvaluateOnNewDocument", { source: `
    try { localStorage.setItem("chosenOne.theme", ${JSON.stringify(theme)}); } catch (e) {}
    (() => { let s = ${seed}; Math.random = () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })();` });
  const load = async () => {
    await send("Page.navigate", { url });
    for (let i = 0; i < 100; i++) { await sleep(100); if (await evaluate(`document.readyState === "complete" && typeof player !== "undefined"`).catch(() => false)) break; }
    await evaluate(`document.fonts ? document.fonts.ready.then(() => 1) : 1`);
  };
  await load();
  const close = async () => { try { ws.close(); } catch (e) {} proc.kill(); server.close(); await sleep(200); try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {} };
  return { send, evaluate, setViewport, reload: load, close, errors, url, isMobile: () => mobile };
}

module.exports = { ROOT, findBrowser, startServer, openGame, sleep };
