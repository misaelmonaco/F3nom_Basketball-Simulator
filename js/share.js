"use strict";

/* ================================================================
   CONDIVISIONE — un'immagine riassuntiva della carriera (PNG 1080×1350) disegnata su un
   canvas: voto, numeri principali, trofei ed eredità. Si condivide dove il browser lo
   permette (telefono), altrimenti si scarica.
   ================================================================ */
function drawCareerCard(avatarImg) {
  const W = 1080, H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const font = (size, weight) => `${weight || 700} ${size}px "Segoe UI", system-ui, -apple-system, Roboto, Arial, sans-serif`;
  const team = (player.history[player.history.length - 1] || {}).team || player.team;

  // sfondo: il colore dell'ultima squadra sfuma nel blu notte del gioco
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, team.colors[0]);
  bg.addColorStop(0.42, "#10151d");
  bg.addColorStop(1, "#0a0e14");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(10,14,20,.55)";
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";
  ctx.fillStyle = "#ff7a1a";
  ctx.font = font(34, 900);
  ctx.fillText("🏀 CHOSEN ONE", W / 2, 90);
  if (avatarImg) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(W - 130, 110, 80, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatarImg, W - 210, 30, 160, 160);
    ctx.restore();
  }

  // numero di maglia sullo sfondo, nome e dati
  ctx.fillStyle = "rgba(255,255,255,.07)";
  ctx.font = font(420, 900);
  ctx.fillText(String(player.jerseyNumber), W / 2, 520);
  ctx.fillStyle = "#f2f4f7";
  ctx.font = font(78, 900);
  ctx.fillText(`${player.firstName} ${player.lastName}`.slice(0, 26), W / 2, 230);
  ctx.fillStyle = "#c4cbd6";
  ctx.font = font(34, 600);
  const arch = getArchetype(player.role, player.archetypeId);
  ctx.fillText(`${getRoleName(player.role)}${arch ? ` · ${arch.name}` : ""} · ${player.nationality}`, W / 2, 285);
  ctx.fillText(`${player.startYear || CAREER_START_YEAR}–${player.year} · ${player.history.length} stagioni · ${getDifficulty(player).label}`, W / 2, 332);

  // il voto
  const { grade, verdict } = computeCareerGrade();
  ctx.beginPath();
  ctx.arc(W / 2, 470, 95, 0, Math.PI * 2);
  ctx.lineWidth = 12;
  ctx.strokeStyle = grade === "S" ? "#ffd447" : "#ff7a1a";
  ctx.stroke();
  ctx.fillStyle = "#f2f4f7";
  ctx.font = font(120, 900);
  ctx.fillText(grade, W / 2, 512);
  ctx.fillStyle = grade === "S" ? "#ffd447" : "#f2f4f7";
  ctx.font = font(36, 700);
  ctx.fillText(verdict, W / 2, 625);

  // numeri
  const totals = computeCareerTotals(player.history);
  const peak = Math.max(player.overall, ...player.history.map(h => h.overall));
  const stats = [
    [totals.avg.pts.toFixed(1), "PUNTI"], [totals.avg.reb.toFixed(1), "RIMBALZI"], [totals.avg.ast.toFixed(1), "ASSIST"],
    [String(peak), "PICCO OVR"], [String(player.goatScore || 0), "GOAT"], [totals.pts.toLocaleString("it-IT"), "PUNTI TOTALI"],
  ];
  const colW = (W - 160) / 3;
  stats.forEach(([v, l], i) => {
    const x = 80 + colW * (i % 3) + colW / 2, y = 740 + Math.floor(i / 3) * 150;
    ctx.fillStyle = "rgba(255,255,255,.05)";
    ctx.fillRect(x - colW / 2 + 10, y - 70, colW - 20, 125);
    ctx.fillStyle = "#f2f4f7";
    ctx.font = font(58, 900);
    ctx.fillText(v, x, y);
    ctx.fillStyle = "#8b95a5";
    ctx.font = font(24, 700);
    ctx.fillText(l, x, y + 40);
  });

  // trofei principali (solo quelli vinti)
  const t = player.trophies;
  const trophies = [["💍", t.rings, "Anelli"], ["🏆", t.domesticTitles + t.euroleague + (t.eurocup || 0), "Titoli"], ["⭐", t.mvp, "MVP"],
    ["🌟", t.allstar, "All-Star"], ["🏅", t.finalsMvp, "Finals MVP"], ["🥇", t.worldCupTitles + t.eurobasketTitles, "Ori"]].filter(x => x[1] > 0);
  ctx.font = font(44, 800);
  if (trophies.length) {
    const step = Math.min(170, (W - 120) / trophies.length);
    trophies.forEach(([icon, n, label], i) => {
      const x = W / 2 + (i - (trophies.length - 1) / 2) * step;
      ctx.fillStyle = "#ffd447";
      ctx.font = font(52, 800);
      ctx.fillText(`${icon} ${n}`, x, 1075);
      ctx.fillStyle = "#8b95a5";
      ctx.font = font(22, 700);
      ctx.fillText(label.toUpperCase(), x, 1110);
    });
  } else {
    ctx.fillStyle = "#8b95a5";
    ctx.font = font(30, 600);
    ctx.fillText("Una carriera senza trofei, ma tutta sudata.", W / 2, 1090);
  }

  // eredità
  const hof = hallOfFameVerdict();
  const jerseys = retiredJerseys().length;
  ctx.fillStyle = hof.elected ? "#ffd447" : "#c4cbd6";
  ctx.font = font(32, 700);
  ctx.fillText(`${hof.elected ? "🏛️ Hall of Fame" : "Fuori dalla Hall of Fame"} · ${hof.pct}% dei voti${jerseys ? ` · 👕 ${jerseys} ${jerseys === 1 ? "maglia ritirata" : "maglie ritirate"}` : ""}`, W / 2, 1195);
  ctx.fillStyle = "#8b95a5";
  ctx.font = font(24, 600);
  ctx.fillText(`Ultima squadra: ${team.name}`, W / 2, 1250);
  return canvas;
}

/* L'avatar SVG va caricato come immagine prima di disegnarlo sul canvas */
function loadAvatarImage() {
  return new Promise(resolve => {
    if (!player.look || typeof Image !== "function") { resolve(null); return; }
    const team = (player.history[player.history.length - 1] || {}).team || player.team;
    const svg = avatarSvg(player.look, team.colors, player.jerseyNumber).replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" ');
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  });
}

async function shareCareerImage() {
  if (!player) return;
  const canvas = drawCareerCard(await loadAvatarImage());
  if (!canvas) { toast("❌ Il browser non permette di creare l'immagine."); return; }
  const slug = `${player.firstName}-${player.lastName}`.toLowerCase().normalize("NFD").replace(/[^a-z0-9-]+/g, "") || "carriera";
  const fileName = `chosen-one-${slug}.png`;
  canvas.toBlob(async blob => {
    if (!blob) { toast("❌ Impossibile creare l'immagine."); return; }
    const file = typeof File === "function" ? new File([blob], fileName, { type: "image/png" }) : null;
    // sul telefono si apre il menu di condivisione; altrove si scarica il file
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: `${player.firstName} ${player.lastName} — CHOSEN ONE` }); return; }
      catch (e) { if (e && e.name === "AbortError") return; }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = fileName;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("📸 Immagine della carriera salvata.");
  }, "image/png");
}
