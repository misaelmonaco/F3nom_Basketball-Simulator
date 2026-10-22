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
  // i font del design system: Big Shoulders per titoli e numeri, Barlow Condensed per le etichette
  const font = (size, weight) => (weight || 700) >= 800
    ? `${weight} ${size}px "Big Shoulders Display", "Barlow Condensed", Impact, sans-serif`
    : `${weight || 700} ${size}px "Barlow Condensed", "Barlow", "Segoe UI", sans-serif`;
  const team = (player.history[player.history.length - 1] || {}).team || player.team;

  // sfondo: il colore dell'ultima squadra sfuma nel blu notte del gioco
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, team.colors[0]);
  bg.addColorStop(0.42, "#13161b");
  bg.addColorStop(1, "#0a0c0f");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(10,14,20,.55)";
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";
  ctx.fillStyle = "#ff5a1f";
  ctx.font = font(34, 900);
  ctx.fillText("F3NOM BBALL", W / 2, 90);
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
  ctx.fillStyle = "#f4f2ed";
  ctx.font = font(78, 900);
  ctx.fillText(`${player.firstName} ${player.lastName}`.toUpperCase().slice(0, 26), W / 2, 230);
  ctx.fillStyle = "#b3b9c2";
  ctx.font = font(34, 600);
  const arch = getArchetype(player.role, player.archetypeId);
  ctx.fillText(`${getRoleName(player.role)}${arch ? ` · ${arch.name}` : ""} · ${player.nationality}`, W / 2, 285);
  ctx.fillText(`${player.startYear || CAREER_START_YEAR}–${player.year} · ${tr(`${player.history.length} stagioni`, `${player.history.length} seasons`)} · ${getDifficulty(player).label}`, W / 2, 332);

  // il voto
  const { grade, verdict } = computeCareerGrade();
  ctx.beginPath();
  ctx.arc(W / 2, 470, 95, 0, Math.PI * 2);
  ctx.lineWidth = 12;
  ctx.strokeStyle = grade === "S" ? "#ffc629" : "#ff5a1f";
  ctx.stroke();
  ctx.fillStyle = "#f4f2ed";
  ctx.font = font(120, 900);
  ctx.fillText(grade, W / 2, 512);
  ctx.fillStyle = grade === "S" ? "#ffc629" : "#f4f2ed";
  ctx.font = font(36, 700);
  ctx.fillText(verdict, W / 2, 625);

  // numeri
  const totals = computeCareerTotals(player.history);
  const peak = Math.max(player.overall, ...player.history.map(h => h.overall));
  const loc = isEn() ? "en-US" : "it-IT";
  const stats = [
    [totals.avg.pts.toFixed(1), tr("PUNTI", "POINTS")], [totals.avg.reb.toFixed(1), tr("RIMBALZI", "REBOUNDS")], [totals.avg.ast.toFixed(1), tr("ASSIST", "ASSISTS")],
    [String(peak), tr("PICCO OVR", "PEAK OVR")], [String(player.goatScore || 0), "GOAT"], [totals.pts.toLocaleString(loc), tr("PUNTI TOTALI", "TOTAL PTS")],
  ];
  const colW = (W - 160) / 3;
  stats.forEach(([v, l], i) => {
    const x = 80 + colW * (i % 3) + colW / 2, y = 740 + Math.floor(i / 3) * 150;
    ctx.fillStyle = "rgba(255,255,255,.05)";
    ctx.fillRect(x - colW / 2 + 10, y - 70, colW - 20, 125);
    ctx.fillStyle = "#f4f2ed";
    ctx.font = font(58, 900);
    ctx.fillText(v, x, y);
    ctx.fillStyle = "#8a919c";
    ctx.font = font(24, 700);
    ctx.fillText(l, x, y + 40);
  });

  // trofei principali (solo quelli vinti)
  const t = player.trophies;
  const trophies = [["💍", t.rings, tr("Anelli", "Rings")], ["🏆", t.domesticTitles + t.euroleague + (t.eurocup || 0) + (t.nationalCups || 0), tr("Titoli", "Titles")], ["⭐", t.mvp, "MVP"],
    ["🌟", t.allstar, "All-Star"], ["🏅", t.finalsMvp, "Finals MVP"], ["🥇", t.worldCupTitles + t.eurobasketTitles, tr("Ori", "Golds")]].filter(x => x[1] > 0);
  ctx.font = font(44, 800);
  if (trophies.length) {
    const step = Math.min(170, (W - 120) / trophies.length);
    trophies.forEach(([icon, n, label], i) => {
      const x = W / 2 + (i - (trophies.length - 1) / 2) * step;
      ctx.fillStyle = "#ffc629";
      ctx.font = font(52, 800);
      ctx.fillText(String(n), x, 1075);
      ctx.fillStyle = "#8a919c";
      ctx.font = font(22, 700);
      ctx.fillText(label.toUpperCase(), x, 1110);
    });
  } else {
    ctx.fillStyle = "#8a919c";
    ctx.font = font(30, 600);
    ctx.fillText(tr("Una carriera senza trofei, ma tutta sudata.", "A trophy-less career, but earned with every drop of sweat."), W / 2, 1090);
  }

  // eredità
  const hof = hallOfFameVerdict();
  const jerseys = retiredJerseys().length;
  ctx.fillStyle = hof.elected ? "#ffc629" : "#b3b9c2";
  ctx.font = font(32, 700);
  ctx.fillText(tr(
    `${hof.elected ? "Hall of Fame" : "Fuori dalla Hall of Fame"} · ${hof.pct}% dei voti${jerseys ? ` · ${jerseys} ${jerseys === 1 ? "maglia ritirata" : "maglie ritirate"}` : ""}`,
    `${hof.elected ? "Hall of Fame" : "Outside the Hall of Fame"} · ${hof.pct}% of votes${jerseys ? ` · ${jerseys} ${jerseys === 1 ? "retired jersey" : "retired jerseys"}` : ""}`
  ), W / 2, 1195);
  ctx.fillStyle = "#8a919c";
  ctx.font = font(24, 600);
  ctx.fillText(tr(`Ultima squadra: ${team.name}`, `Last team: ${team.name}`), W / 2, 1250);
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
  // il canvas usa i font della pagina solo quando sono già caricati
  if (document.fonts && document.fonts.load) {
    try { await Promise.all(['900 80px "Big Shoulders Display"', '700 30px "Barlow Condensed"'].map(f => document.fonts.load(f))); } catch (e) { /* si usano i font di riserva */ }
  }
  const canvas = drawCareerCard(await loadAvatarImage());
  if (!canvas) { toast(tr("❌ Il browser non permette di creare l'immagine.", "❌ Your browser cannot generate the image.")); return; }
  const slug = `${player.firstName}-${player.lastName}`.toLowerCase().normalize("NFD").replace(/[^a-z0-9-]+/g, "") || "carriera";
  const fileName = `chosen-one-${slug}.png`;
  canvas.toBlob(async blob => {
    if (!blob) { toast(tr("❌ Impossibile creare l'immagine.", "❌ Could not generate the image.")); return; }
    const file = typeof File === "function" ? new File([blob], fileName, { type: "image/png" }) : null;
    // sul telefono si apre il menu di condivisione; altrove si scarica il file
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: `${player.firstName} ${player.lastName} — F3NOM bball` }); return; }
      catch (e) { if (e && e.name === "AbortError") return; }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = fileName;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(tr("📸 Immagine della carriera salvata.", "📸 Career card image saved."));
  }, "image/png");
}

/* ================================================================
   COPERTINA RIVISTA FINE STAGIONE ("HOOPS DIGEST")
   Un riassunto visivo della stagione in formato magazine, da
   ammirare nel resoconto e scaricare/condividere come immagine PNG.
   ================================================================ */
function seasonCoverStory(rec, p) {
  p = p || player;
  const awards = rec.awards || [];
  const hasMvp = awards.some(a => a.toLowerCase().includes("mvp"));
  const finalsMvp = awards.some(a => a.toLowerCase().includes("finals mvp"));
  let kicker = tr("COVER STORY · ESCLUSIVA DI FINE ANNO", "COVER STORY · YEAR-END EXCLUSIVE");
  let headline = tr("IL PILASTRO DEL PARQUET", "THE HARDWOOD PILLAR");
  let subtitle = tr(`${rec.team.name.toUpperCase()} · STAGIONE ${rec.year}`, `${rec.team.name.toUpperCase()} · ${rec.year} SEASON`);
  let tag = tr("PROTAGONISTA", "FEATURED");

  if (rec.champion) {
    headline = tr("«CAMPIONI!»", "«CHAMPIONS!»");
    subtitle = tr(`${rec.team.name.toUpperCase()} È SUL TETTO DI ${LEAGUES[rec.league].name.toUpperCase()}`, `${rec.team.name.toUpperCase()} ON TOP OF ${LEAGUES[rec.league].name.toUpperCase()}`);
    kicker = finalsMvp ? tr("FINALS MVP · LA NOTTE PIÙ GRANDE", "FINALS MVP · THE BIGGEST NIGHT") : tr("IL TRIONFO · STAGIONE DA LEGGENDA", "THE TRIUMPH · LEGENDARY SEASON");
    tag = tr("CAMPIONE", "CHAMPION");
  } else if (hasMvp) {
    headline = tr("«IL MIGLIORE DEL MONDO»", "«THE BEST IN THE WORLD»");
    subtitle = tr(`STAGIONE DA MVP: IL DOMINIO ASSOLUTO DI ${p.lastName.toUpperCase()}`, `MVP SEASON: ABSOLUTE DOMINANCE BY ${p.lastName.toUpperCase()}`);
    kicker = tr("PREMIO MVP · NUMERI DA FENOMENO", "MVP AWARD · PHENOMENAL NUMBERS");
    tag = "MVP";
  } else if (rec.playoffResult && (rec.playoffResult.includes("Final") || rec.playoffResult.includes("final"))) {
    headline = tr("«A UN PASSO DALLA GLORIA»", "«ONE STEP FROM GLORY»");
    subtitle = tr(`LE FINALI DISPUTATE CON I ${rec.team.name.toUpperCase()}`, `FINALS RUN WITH ${rec.team.name.toUpperCase()}`);
    kicker = tr("FINALI DI LEGA · GUERRIERO FINO ALL'ULTIMO", "LEAGUE FINALS · WARRIOR TO THE END");
    tag = tr("FINALISTA", "FINALIST");
  } else if (rec.pts >= 26) {
    headline = tr("«MACCHINA DA CANESTRI»", "«SCORING MACHINE»");
    subtitle = tr(`${rec.pts} PUNTI A PARTITA A SOLI ${rec.age} ANNI`, `${rec.pts} POINTS PER GAME AT AGE ${rec.age}`);
    kicker = tr("BOMBER INARRESTABILE · SHOW TIME", "UNSTOPPABLE SCORER · SHOW TIME");
    tag = "TOP SCORER";
  } else if (rec.ovrDelta >= 3) {
    headline = tr("«IL SALTO NELL'ÉLITE»", "«LEAP INTO THE ELITE»");
    subtitle = tr(`CRESCITA RECORD (+${rec.ovrDelta}) FINO A QUOTA ${rec.overall} OVR`, `BREAKOUT SURGE (+${rec.ovrDelta}) TO ${rec.overall} OVR`);
    kicker = tr("ESPLOSIONE TECNICA · FUTURO DELLA LEGA", "BREAKOUT STAR · FUTURE OF THE LEAGUE");
    tag = "MOST IMPROVED";
  } else if (rec.ovrDelta > 0) {
    headline = tr("«CONTINUA L'ASCESA»", "«THE RISE CONTINUES»");
    subtitle = tr(`SALTO DI QUALITÀ A QUOTA ${rec.overall} OVERALL`, `STEPPING UP TO ${rec.overall} OVERALL`);
    kicker = tr("CRESCITA COSTANTE", "STEADY GROWTH");
    tag = tr("CRESCITA", "RISING");
  }

  return { kicker, headline, subtitle, tag };
}

function seasonCoverHtml(rec, p) {
  p = p || player;
  const story = seasonCoverStory(rec, p);
  const cur = playerCurrency(p);
  const teamColor = (rec.team.colors && rec.team.colors[0]) || "#ff5a1f";
  const teamColor2 = (rec.team.colors && rec.team.colors[1]) || "#ffffff";
  const avatar = p.look ? avatarSvg(p.look, rec.team.colors, p.jerseyNumber) : "";
  const roleName = getRoleName(p.role);
  const arch = getArchetype(p.role, p.archetypeId);

  return `
    <div class="mag-cover" style="--team-cov:${teamColor};--team-cov-2:${teamColor2};">
      <div class="mag-bg-pattern" aria-hidden="true"></div>
      <div class="mag-jersey-watermark" aria-hidden="true">${p.jerseyNumber}</div>
      <div class="mag-header">
        <div class="mag-meta">
          <span>HOOPS DIGEST · ${tr(`ANNO ${rec.year}`, `YEAR ${rec.year}`)}</span>
          <span>VOL. ${Math.max(1, p.history.length)} · $4.99</span>
        </div>
        <div class="mag-masthead">HOOPS</div>
        <div class="mag-strap">${tr("BASKETBALL CAREER MONTHLY · L'ANNUALE DEI PROTAGONISTI", "BASKETBALL CAREER MONTHLY · THE CHAMPIONS ANNUAL")}</div>
      </div>
      <div class="mag-hero">
        <div class="mag-avatar-wrap">
          <div class="mag-avatar-glow" aria-hidden="true"></div>
          <div class="mag-avatar-frame">${avatar}</div>
          <span class="mag-ovr-badge">${rec.overall} <small>OVR</small></span>
        </div>
        <div class="mag-stickers">
          <span class="mag-pill ${rec.champion ? "champ" : ""}">${story.tag}</span>
          ${rec.ovrDelta ? `<span class="mag-pill delta">${rec.ovrDelta > 0 ? `+${rec.ovrDelta}` : rec.ovrDelta} OVR</span>` : ""}
          ${(rec.awards && rec.awards.length) ? `<span class="mag-pill award">🏅 ${rec.awards[0]}</span>` : ""}
        </div>
      </div>
      <div class="mag-headlines">
        <div class="mag-kicker">${story.kicker}</div>
        <h2 class="mag-title">${p.firstName.toUpperCase()} ${p.lastName.toUpperCase()}</h2>
        <div class="mag-subtitle">${story.headline}</div>
        <p class="mag-desc">${story.subtitle}</p>
      </div>
      <div class="mag-footer">
        <div class="mag-stat-pills">
          <div class="mag-stat"><strong>${rec.pts}</strong><span>PTS</span></div>
          <div class="mag-stat"><strong>${rec.reb}</strong><span>REB</span></div>
          <div class="mag-stat"><strong>${rec.ast}</strong><span>AST</span></div>
          <div class="mag-stat"><strong>${rec.fg}%</strong><span>FG</span></div>
          <div class="mag-stat"><strong>${rec.wins}-${rec.losses}</strong><span>REC</span></div>
        </div>
        <div class="mag-barcode-row">
          <span class="mag-club-label">${rec.team.name} · ${LEAGUES[rec.league].name}${rec.gp != null ? ` · ${rec.gp}/${rec.games} ${tr("GARE", "GP")}` : ""}${rec.goatPoints ? ` · +${rec.goatPoints} GOAT` : ""}</span>
          <div class="mag-barcode" aria-hidden="true">
            <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
          </div>
        </div>
      </div>
    </div>`;
}

function drawSeasonCover(rec, avatarImg) {
  const W = 1080, H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const font = (size, weight) => (weight || 700) >= 800
    ? `${weight} ${size}px "Big Shoulders Display", "Barlow Condensed", Impact, sans-serif`
    : `${weight || 700} ${size}px "Barlow Condensed", "Barlow", "Segoe UI", sans-serif`;

  const teamColor = (rec.team.colors && rec.team.colors[0]) || "#ff5a1f";
  const teamColor2 = (rec.team.colors && rec.team.colors[1]) || "#f4f2ed";
  const story = seasonCoverStory(rec, player);

  // sfondo drammatico: colore della squadra che sfuma nel nero antracite
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, teamColor);
  bg.addColorStop(0.35, "#14171d");
  bg.addColorStop(1, "#0a0c0f");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // filigrana con il numero di maglia
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.font = font(420, 900);
  ctx.fillText(String(player.jerseyNumber), W / 2, 700);

  // testata magazine in alto
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = font(26, 700);
  ctx.fillText(`HOOPS DIGEST · ${tr(`ANNO ${rec.year}`, `YEAR ${rec.year}`)} · VOL. ${player.history.length} · $4.99`, W / 2, 60);

  ctx.fillStyle = "#ffffff";
  ctx.font = font(160, 900);
  ctx.fillText("HOOPS", W / 2, 190);

  ctx.fillStyle = "#ff5a1f";
  ctx.font = font(28, 700);
  ctx.fillText(tr("BASKETBALL CAREER MONTHLY · L'ANNUALE DEI PROTAGONISTI", "BASKETBALL CAREER MONTHLY · THE CHAMPIONS ANNUAL"), W / 2, 230);

  // avatar al centro in un cerchio stilizzato
  if (avatarImg) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(W / 2, 470, 160, 0, Math.PI * 2);
    ctx.fillStyle = "#1b1f27";
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = teamColor;
    ctx.stroke();
    ctx.clip();
    ctx.drawImage(avatarImg, W / 2 - 160, 310, 320, 320);
    ctx.restore();
  }

  // badge OVR fluttuante a destra
  ctx.beginPath();
  ctx.arc(W / 2 + 150, 380, 50, 0, Math.PI * 2);
  ctx.fillStyle = "#ff5a1f";
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = font(48, 900);
  ctx.fillText(String(rec.overall), W / 2 + 150, 395);

  // titolo principale della copertina
  ctx.fillStyle = "#ff5a1f";
  ctx.font = font(32, 800);
  ctx.fillText(story.kicker, W / 2, 720);

  ctx.fillStyle = "#ffffff";
  ctx.font = font(92, 900);
  ctx.fillText(`${player.firstName} ${player.lastName}`.toUpperCase().slice(0, 24), W / 2, 810);

  ctx.fillStyle = rec.champion ? "#ffd447" : "#ff5a1f";
  ctx.font = font(56, 900);
  ctx.fillText(story.headline, W / 2, 880);

  ctx.fillStyle = "#b3b9c2";
  ctx.font = font(32, 600);
  ctx.fillText(story.subtitle, W / 2, 930);

  // griglia statistiche in basso
  const stats = [
    [String(rec.pts), tr("PUNTI", "POINTS")],
    [String(rec.reb), tr("RIMBALZI", "REBOUNDS")],
    [String(rec.ast), tr("ASSIST", "ASSISTS")],
    [`${rec.fg}%`, tr("DAL CAMPO", "FG%")],
    [`${rec.wins}-${rec.losses}`, "RECORD"],
  ];
  const colW = (W - 120) / stats.length;
  stats.forEach(([v, l], i) => {
    const x = 60 + colW * i + colW / 2, y = 1080;
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(x - colW / 2 + 6, y - 70, colW - 12, 115);
    ctx.fillStyle = "#ffffff";
    ctx.font = font(52, 900);
    ctx.fillText(v, x, y);
    ctx.fillStyle = "#8a919c";
    ctx.font = font(22, 700);
    ctx.fillText(l, x, y + 36);
  });

  // fascia finale con squadra e codice a barre
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = font(30, 800);
  ctx.fillText(`${rec.team.name.toUpperCase()} · ${LEAGUES[rec.league].name} · ${tr(`${rec.age} ANNI`, `AGE ${rec.age}`)}`, W / 2, 1220);

  ctx.fillStyle = "#8a919c";
  ctx.font = font(20, 600);
  ctx.fillText("F3NOM BBALL · BASKETBALL CAREER SIMULATOR", W / 2, 1270);

  return canvas;
}

async function shareSeasonCoverImage(rec) {
  if (!player || !rec) return;
  if (document.fonts && document.fonts.load) {
    try { await Promise.all(['900 80px "Big Shoulders Display"', '700 30px "Barlow Condensed"'].map(f => document.fonts.load(f))); } catch (e) {}
  }
  const canvas = drawSeasonCover(rec, await loadAvatarImage());
  if (!canvas) { toast(tr("❌ Il browser non permette di creare l'immagine.", "❌ Your browser cannot generate the image.")); return; }
  const slug = `${player.lastName}-${rec.year}`.toLowerCase().normalize("NFD").replace(/[^a-z0-9-]+/g, "") || "stagione";
  const fileName = `hoops-cover-${slug}.png`;
  canvas.toBlob(async blob => {
    if (!blob) { toast(tr("❌ Impossibile creare l'immagine.", "❌ Could not generate the image.")); return; }
    const file = typeof File === "function" ? new File([blob], fileName, { type: "image/png" }) : null;
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: `${tr("Copertina", "Cover")} ${rec.year} — ${player.firstName} ${player.lastName}` }); return; }
      catch (e) { if (e && e.name === "AbortError") return; }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = fileName;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(tr("📸 Copertina della stagione salvata!", "📸 Season cover saved!"));
  }, "image/png");
}
