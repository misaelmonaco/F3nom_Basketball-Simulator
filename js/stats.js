"use strict";

/* ================================================================
   TOTALI, RECORD E GRAFICO DELLA CARRIERA
   ================================================================ */
/* Totali assoluti (media a partita × partite giocate) e medie di carriera pesate sulle partite:
   una stagione da 20 gare conta meno di una da 82, a differenza della semplice media delle medie. */
function computeCareerTotals(history) {
  const keys = ["pts", "reb", "ast", "stl", "blk", "tov"];
  const t = { seasons: history.length, gp: 0 };
  keys.forEach(k => { t[k] = 0; });
  history.forEach(h => {
    const gp = h.gp != null ? h.gp : h.wins + h.losses;
    t.gp += gp;
    keys.forEach(k => { t[k] += (h[k] || 0) * gp; });
  });
  keys.forEach(k => { t[k] = Math.round(t[k]); });
  t.avg = Object.fromEntries(keys.map(k => [k, t.gp ? round1(t[k] / t.gp) : 0]));
  return t;
}

/* Migliori stagioni per ciascuna voce, con anno e squadra */
const CAREER_RECORDS = [
  { icon: "🎯", label: "Punti a partita", value: h => h.pts, fmt: v => v.toFixed(1) },
  { icon: "🧲", label: "Rimbalzi a partita", value: h => h.reb, fmt: v => v.toFixed(1) },
  { icon: "🧠", label: "Assist a partita", value: h => h.ast, fmt: v => v.toFixed(1) },
  { icon: "🛡️", label: "Rubate + stoppate", value: h => h.stl + h.blk, fmt: v => v.toFixed(1) },
  { icon: "📈", label: "Overall", value: h => h.overall, fmt: v => String(v) },
  { icon: "👑", label: "Punti GOAT in una stagione", value: h => h.goatPoints || 0, fmt: v => String(v) },
  { icon: "🏟️", label: "Miglior record di squadra", value: h => (h.wins + h.losses ? h.wins / (h.wins + h.losses) : 0), fmt: (v, h) => `${h.wins}-${h.losses}` },
];

function renderCareerTotals(targetId) {
  const box = el(targetId);
  if (!player.history.length) { box.innerHTML = `<p class="small-muted">I totali appariranno dopo la prima stagione.</p>`; return; }
  const t = computeCareerTotals(player.history);
  const fmt = v => v.toLocaleString("it-IT");
  const items = [
    { v: fmt(t.gp), l: "Partite giocate" },
    { v: fmt(t.pts), l: `Punti · ${t.avg.pts.toFixed(1)} a partita` },
    { v: fmt(t.reb), l: `Rimbalzi · ${t.avg.reb.toFixed(1)} a partita` },
    { v: fmt(t.ast), l: `Assist · ${t.avg.ast.toFixed(1)} a partita` },
    { v: fmt(t.stl), l: `Rubate · ${t.avg.stl.toFixed(1)} a partita` },
    { v: fmt(t.blk), l: `Stoppate · ${t.avg.blk.toFixed(1)} a partita` },
  ];
  const clutch = player.clutch || { made: 0, attempts: 0 };
  if (clutch.attempts) items.push({ v: `${clutch.made}/${clutch.attempts}`, l: "Possessi decisivi vinti nei playoff" });
  box.innerHTML = `<div class="summary-grid">${items.map(x => `
    <div class="sg-item"><div class="sg-val">${x.v}</div><div class="sg-lbl">${x.l}</div></div>`).join("")}</div>`;
}

function renderCareerRecords(targetId) {
  const box = el(targetId);
  if (!player.history.length) { box.innerHTML = `<p class="small-muted">I record appariranno dopo la prima stagione.</p>`; return; }
  box.innerHTML = `<div class="records-list">${CAREER_RECORDS.map(r => {
    const best = player.history.reduce((a, h) => (r.value(h) > r.value(a) ? h : a));
    return `
      <div class="record-row">
        <span class="rr-icon">${r.icon}</span>
        <span class="rr-label">${r.label}</span>
        <span class="rr-value">${r.fmt(r.value(best), best)}</span>
        <span class="rr-when">${best.year} · ${best.age} anni · ${best.team.name}</span>
      </div>`;
  }).join("")}</div>`;
}

const CAREER_CHART_METRICS = [
  { id: "overall", label: "Overall", value: h => h.overall, fmt: v => String(Math.round(v)), fromZero: false },
  { id: "pts", label: "Punti a partita", value: h => h.pts, fmt: v => v.toFixed(1), fromZero: true },
  { id: "goat", label: "Punti GOAT", value: h => h.goatPoints || 0, fmt: v => String(Math.round(v)), fromZero: true },
];
const careerChartMetric = {}; // metrica scelta per ciascun grafico (carriera in corso / schermata finale)

/* Tacche "pulite" dell'asse Y (multipli di 1, 2, 5 × 10^n) che coprono [min, max] */
function niceTicks(min, max, count) {
  const span = Math.max(1, max - min);
  const raw = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 5, 10].map(m => m * mag).find(s => s >= raw);
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v * 100) / 100);
  return ticks;
}

/* Grafico a linea (una sola serie) dell'andamento stagione per stagione. Il controllo sopra
   il grafico sceglie la metrica; passando col mouse (o con le frecce, a grafico selezionato)
   un mirino evidenzia la stagione più vicina con i suoi dettagli. La tabella dello storico
   resta la vista testuale degli stessi dati. */
function renderCareerChart(targetId) {
  const box = el(targetId);
  const history = player.history;
  const metric = CAREER_CHART_METRICS.find(m => m.id === careerChartMetric[targetId]) || CAREER_CHART_METRICS[0];

  const controls = `<div class="chart-controls" role="group" aria-label="Metrica del grafico">${CAREER_CHART_METRICS.map(m => `
    <button type="button" class="chart-seg ${m.id === metric.id ? "active" : ""}" data-metric="${m.id}" aria-pressed="${m.id === metric.id}">${m.label}</button>`).join("")}</div>`;

  if (history.length < 2) {
    box.innerHTML = controls + `<p class="small-muted" style="margin-top:10px">Il grafico apparirà dopo almeno due stagioni.</p>`;
    wireChartControls(box, targetId);
    return;
  }

  const W = 640, H = 230, m = { l: 40, r: 44, t: 18, b: 30 };
  const values = history.map(metric.value);
  const vMin = metric.fromZero ? 0 : Math.min(...values) - 2;
  const vMax = Math.max(...values) + (metric.fromZero ? 0 : 2);
  const ticks = niceTicks(vMin, vMax, 4);
  const yLo = ticks[0], yHi = ticks[ticks.length - 1];
  const x = i => m.l + (i / (history.length - 1)) * (W - m.l - m.r);
  const y = v => m.t + (1 - (v - yLo) / (yHi - yLo || 1)) * (H - m.t - m.b);

  const linePts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  const areaPath = `M${x(0).toFixed(1)},${y(yLo).toFixed(1)} L${linePts.join(" L")} L${x(history.length - 1).toFixed(1)},${y(yLo).toFixed(1)} Z`;
  const grid = ticks.map(t => `
    <line class="cc-grid" x1="${m.l}" x2="${W - m.r}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}"></line>
    <text class="cc-axis" x="${m.l - 8}" y="${(y(t) + 4).toFixed(1)}" text-anchor="end">${t}</text>`).join("");
  // etichette dell'asse X: età, una ogni tanto per non affollare
  const every = Math.ceil(history.length / 8);
  const xLabels = history.map((h, i) => (i % every === 0 || i === history.length - 1)
    ? `<text class="cc-axis" x="${x(i).toFixed(1)}" y="${H - 8}" text-anchor="middle">${h.age}</text>` : "").join("");
  const last = history.length - 1;

  box.innerHTML = controls + `
    <div class="cc-wrap">
      <svg class="cc-svg" viewBox="0 0 ${W} ${H}" tabindex="0" role="img" aria-label="${metric.label} per età, dai ${history[0].age} ai ${history[last].age} anni">
        ${grid}
        <text class="cc-axis" x="${m.l - 8}" y="${H - 8}" text-anchor="end">età</text>
        ${xLabels}
        <path class="cc-area" d="${areaPath}"></path>
        <polyline class="cc-line" points="${linePts.join(" ")}"></polyline>
        <circle class="cc-dot" cx="${x(last).toFixed(1)}" cy="${y(values[last]).toFixed(1)}" r="4.5"></circle>
        <text class="cc-end" x="${(x(last) + 9).toFixed(1)}" y="${(y(values[last]) + 4).toFixed(1)}">${metric.fmt(values[last])}</text>
        <line class="cc-cross hidden" y1="${m.t}" y2="${H - m.b}"></line>
        <circle class="cc-dot cc-hover hidden" r="5"></circle>
        <rect class="cc-hit" x="${m.l - 10}" y="0" width="${W - m.l - m.r + 20}" height="${H}"></rect>
      </svg>
      <div class="cc-tip hidden"><div class="cc-tip-val"></div><div class="cc-tip-meta"></div></div>
    </div>`;
  wireChartControls(box, targetId);

  const svg = box.querySelector(".cc-svg");
  const cross = box.querySelector(".cc-cross");
  const hoverDot = box.querySelector(".cc-hover");
  const tip = box.querySelector(".cc-tip");
  let current = null;
  const show = i => {
    current = i;
    const h = history[i];
    cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i));
    hoverDot.setAttribute("cx", x(i)); hoverDot.setAttribute("cy", y(values[i]));
    [cross, hoverDot, tip].forEach(n => n.classList.remove("hidden"));
    tip.querySelector(".cc-tip-val").textContent = `${metric.fmt(values[i])} ${metric.label.toLowerCase()}`;
    tip.querySelector(".cc-tip-meta").textContent = `${h.age} anni · ${h.year} · ${h.team.name} (${LEAGUES[h.league].name})${h.champion ? " · 🏆" : ""}`;
    // il tooltip resta dentro il grafico: a sinistra del punto nella metà destra
    const rect = svg.getBoundingClientRect();
    const px = (x(i) / W) * rect.width;
    const py = (y(values[i]) / H) * rect.height;
    tip.style.left = `${px}px`;
    tip.style.top = `${py}px`;
    tip.classList.toggle("flip", px > rect.width / 2);
  };
  const hide = () => { current = null; [cross, hoverDot, tip].forEach(n => n.classList.add("hidden")); };
  const nearest = evt => {
    const rect = svg.getBoundingClientRect();
    const sx = ((evt.clientX - rect.left) / rect.width) * W;
    return clamp(Math.round(((sx - m.l) / (W - m.l - m.r)) * (history.length - 1)), 0, history.length - 1);
  };
  svg.addEventListener("pointermove", evt => show(nearest(evt)));
  svg.addEventListener("pointerleave", hide);
  svg.addEventListener("blur", hide);
  svg.addEventListener("keydown", evt => {
    if (evt.key !== "ArrowLeft" && evt.key !== "ArrowRight") return;
    evt.preventDefault();
    const next = current == null ? last : current + (evt.key === "ArrowRight" ? 1 : -1);
    show(clamp(next, 0, last));
  });
}

function wireChartControls(box, targetId) {
  box.querySelectorAll("[data-metric]").forEach(b => b.addEventListener("click", () => {
    careerChartMetric[targetId] = b.dataset.metric;
    renderCareerChart(targetId);
  }));
}
