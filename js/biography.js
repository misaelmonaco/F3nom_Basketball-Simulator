"use strict";

/* ================================================================
   BIOGRAFIA — il racconto della carriera, generato dai dati: origini, esplosione, Draft,
   trasferimenti, titoli, infortuni, eredità e vita dopo il ritiro. Si legge a fine
   carriera e si può copiare per condividerla.
   ================================================================ */
function bioTeams(p) {
  const seq = [];
  p.history.forEach(h => { const last = seq[seq.length - 1]; if (!last || last.team !== h.team.name) seq.push({ team: h.team.name, league: h.league, from: h.year, to: h.year, seasons: 1 }); else { last.to = h.year; last.seasons++; } });
  return seq;
}

function generateBiography(p) {
  const H = p.history;
  if (!H.length) return [];
  const paras = [];
  const first = H[0];
  const path = PATHS.find(x => x.id === p.pathId);
  const arch = getArchetype(p.role, p.archetypeId);
  const parent = p.legacy && p.legacy.parents.length ? p.legacy.parents[p.legacy.parents.length - 1] : null;
  const loc = isEn() ? "en-US" : "it-IT";

  if (isEn()) {
    const originsEn = {
      USA_HS: "through US high school and college basketball",
      PREP_SCHOOL: "at an American prep school",
      GLEAGUE_PATH: "in the USA-2 youth development program",
      EU_YOUTH: "in European youth academies",
      ITA_CLUB: "between school and ITA-3",
      NBL_NEXT: "in the Oceania Next program",
      STREET: "on streetball playgrounds, far from elite academies"
    };
    paras.push(
      `${p.firstName} ${p.lastName} (${p.nationality}, ${p.height} cm) was ${arch ? `a${p.hand === "left" ? " left-handed" : ""} ${arch.name.toLowerCase()}` : "a basketball player"} at the ${getRoleName(p.role).toLowerCase()} position. ` +
      `${p.hometown ? `Raised in ${p.hometown}, ` : ""}${parent ? `${p.hometown ? "following" : "Following"} in the footsteps of parent ${parent.name}, he` : p.hometown ? "he" : "He"} took his first steps ${originsEn[path && path.id] || "in youth basketball"}, making his debut at age ${first.age} with ${first.team.name} (${LEAGUES[first.league].name}).`
    );

    const breakout = H.find(h => (h.awards || []).some(a => a.startsWith("All-Star") || a.startsWith("Miglior Quintetto") || a.startsWith("All-League") || a.startsWith("MVP")));
    const best = H.reduce((a, h) => ((h.goatPoints || 0) > (a.goatPoints || 0) ? h : a));
    const peakOvr = Math.max(p.overall, ...H.map(h => h.overall));
    let s2 = breakout
      ? `His breakout came in ${breakout.year}, at age ${breakout.age}, with ${breakout.team.name}: ${breakout.awards.join(", ")}. `
      : "He was never a flashy superstar, but he was a true professional every night. ";
    s2 += `His finest season was ${best.year}, averaging ${best.pts} points, ${best.reb} rebounds, and ${best.ast} assists per game; his peak overall rating reached ${peakOvr}.`;
    const draft = H.find(h => h.draftResult);
    if (draft) s2 += ` At the NBA Draft: ${draft.draftResult}.`;
    paras.push(s2);

    const teams = bioTeams(p);
    if (teams.length > 1) {
      const longest = [...teams].sort((a, b) => b.seasons - a.seasons)[0];
      paras.push(
        `Over his career he wore ${new Set(teams.map(t => t.team)).size} different jerseys, including ${teams.slice(0, 4).map(t => t.team).join(", ")}${teams.length > 4 ? " and others" : ""}. ` +
        `His longest tenure was with ${longest.team}: ${longest.seasons} ${longest.seasons === 1 ? "season" : "seasons"} (${longest.from}-${longest.to}).${p.homecoming ? ` He closed his career by returning home to ${p.homecoming.team}.` : ""}${p.captainCount ? " He also served as team captain." : ""}`
      );
    } else {
      paras.push(`One jersey for his entire career: ${first.team.name}, a true franchise icon.`);
    }

    const t = p.trophies;
    const wins = [];
    if (t.rings) wins.push(`${t.rings} ${t.rings === 1 ? "USA-1 ring" : "USA-1 rings"}`);
    if (t.domesticTitles) wins.push(`${t.domesticTitles} ${t.domesticTitles === 1 ? "domestic title" : "domestic titles"}`);
    if (t.nationalCups) wins.push(`${t.nationalCups} ${t.nationalCups === 1 ? "national cup" : "national cups"}`);
    if (t.euroleague) wins.push(`${t.euroleague} EUROPE-1`);
    if (t.mvp) wins.push(`${t.mvp} MVP`);
    if (t.allstar) wins.push(`${t.allstar} All-Star selections`);
    if (t.worldCupTitles + t.eurobasketTitles) wins.push(`${t.worldCupTitles + t.eurobasketTitles} National Team golds`);
    const totals = computeCareerTotals(H);
    paras.push(
      `${wins.length ? `Trophy cabinet: ${wins.join(", ")}. ` : "No major trophies in the cabinet. "}Across ${H.length} seasons he scored ${totals.pts.toLocaleString(loc)} points (${totals.avg.pts.toFixed(1)} PPG).` +
      `${p.clutch && p.clutch.made ? ` In the playoffs he hit ${p.clutch.made} game-winning clutch shots.` : ""}`
    );

    const serious = H.filter(h => h.seriousInjury);
    const extra = [];
    if (serious.length) extra.push(`He overcame ${serious.length === 1 ? "a major injury" : `${serious.length} major injuries`} (${serious.map(h => `${(typeof seriousInjuryLabel === "function" ? seriousInjuryLabel(h.seriousInjury.label) : h.seriousInjury.label).toLowerCase()} in ${h.year}`).join(", ")}).`);
    if (p.mentee && p.mentee.star) extra.push(`He mentored ${p.mentee.name}, who went on to become a star.`);
    if ((p.duos || []).length) extra.push(`As a franchise star he recruited ${p.duos.map(x => `${x.name} (${x.team}, ${x.year})`).join(" and ")} to form a star duo.`);
    const fam = typeof familyText === "function" ? familyText(p) : "";
    if (fam) extra.push(`Off the court: ${fam.toLowerCase()}.`);
    if (extra.length) paras.push(extra.join(" "));

    const hof = hallOfFameVerdict();
    const jerseys = retiredJerseys();
    let s6 = hof.elected ? "He was inducted into the Hall of Fame. " : "He was not inducted into the Hall of Fame. ";
    if (jerseys.length) s6 += `${jerseys.map(j => j.team.name).join(" and ")} retired his #${p.jerseyNumber} jersey. `;
    if (p.farewellTour) s6 += `He retired in ${p.farewellTour} after a celebrated farewell tour. `;
    else s6 += `He retired in ${p.year} at age ${p.age}. `;
    if (p.careerGoal && p.careerGoal.status === "done") s6 += `He fulfilled his career dream: ${getCareerGoal(p.careerGoal.id).label.toLowerCase()}.`;
    paras.push(s6.trim());

    if (p.afterCareer) paras.push(`After retirement: ${p.afterCareer.lines.join(" ")}`);
    return paras;
  }

  // origini
  const origins = { USA_HS: "tra high school e college americano", PREP_SCHOOL: "in una prep school americana", GLEAGUE_PATH: "nel programma giovanile della USA-2",
    EU_YOUTH: "nelle giovanili europee", ITA_CLUB: "tra la scuola e la ITA-3", NBL_NEXT: "nel programma Oceania Next", STREET: "sui playground, lontano dalle accademie" };
  paras.push(`${p.firstName} ${p.lastName} (${p.nationality}, ${p.height} cm) è stato ${arch ? `un ${arch.name.toLowerCase()}${p.hand === "left" ? " mancino" : ""}` : "un giocatore"} nel ruolo di ${getRoleName(p.role).toLowerCase()}. ` +
    `${p.hometown ? `Cresciuto a ${p.hometown}, ` : ""}${parent ? `${p.hometown ? "figlio" : "Figlio"} d'arte di ${parent.name}, ha` : p.hometown ? "ha" : "Ha"} mosso i primi passi ${origins[path && path.id] || "nelle giovanili"}, debuttando a ${first.age} anni con ${first.team.name} (${LEAGUES[first.league].name}).`);

  // esplosione e picco
  const breakout = H.find(h => (h.awards || []).some(a => a.startsWith("All-Star") || a.startsWith("Miglior Quintetto") || a.startsWith("All-League") || a.startsWith("MVP")));
  const best = H.reduce((a, h) => ((h.goatPoints || 0) > (a.goatPoints || 0) ? h : a));
  const peakOvr = Math.max(p.overall, ...H.map(h => h.overall));
  let s2 = breakout ? `L'esplosione arriva nel ${breakout.year}, a ${breakout.age} anni, con ${breakout.team.name}: ${breakout.awards.join(", ")}. ` : "Non è mai stato una superstar, ma è stato un professionista vero. ";
  s2 += `La sua stagione migliore è quella del ${best.year}, chiusa a ${best.pts} punti, ${best.reb} rimbalzi e ${best.ast} assist di media; il suo picco di overall è stato ${peakOvr}.`;
  const draft = H.find(h => h.draftResult);
  if (draft) s2 += ` Al Draft NBA: ${draft.draftResult}.`;
  paras.push(s2);

  // squadre e trasferimenti
  const teams = bioTeams(p);
  if (teams.length > 1) {
    const longest = [...teams].sort((a, b) => b.seasons - a.seasons)[0];
    paras.push(`In carriera ha vestito ${new Set(teams.map(t => t.team)).size} maglie diverse, tra cui ${teams.slice(0, 4).map(t => t.team).join(", ")}${teams.length > 4 ? " e altre" : ""}. ` +
      `La casa più lunga è stata ${longest.team}: ${longest.seasons} ${longest.seasons === 1 ? "stagione" : "stagioni"} (${longest.from}-${longest.to}).${p.homecoming ? ` Ha chiuso tornando a ${p.homecoming.team}.` : ""}${p.captainCount ? " Ne è stato anche capitano." : ""}`);
  } else paras.push(`Una sola maglia in tutta la carriera: ${first.team.name}, una bandiera.`);

  // titoli e premi
  const t = p.trophies;
  const wins = [];
  if (t.rings) wins.push(`${t.rings} ${t.rings === 1 ? "anello USA-1" : "anelli USA-1"}`);
  if (t.domesticTitles) wins.push(`${t.domesticTitles} ${t.domesticTitles === 1 ? "titolo nazionale" : "titoli nazionali"}`);
  if (t.nationalCups) wins.push(`${t.nationalCups} ${t.nationalCups === 1 ? "coppa nazionale" : "coppe nazionali"}`);
  if (t.euroleague) wins.push(`${t.euroleague} EUROPE-1`);
  if (t.mvp) wins.push(`${t.mvp} ${t.mvp === 1 ? "MVP" : "MVP"}`);
  if (t.allstar) wins.push(`${t.allstar} convocazioni all'All-Star Game`);
  if (t.worldCupTitles + t.eurobasketTitles) wins.push(`${t.worldCupTitles + t.eurobasketTitles} ori con la Nazionale`);
  const totals = computeCareerTotals(H);
  paras.push(`${wins.length ? `Nel palmarès: ${wins.join(", ")}. ` : "Nessun grande trofeo in bacheca. "}In ${H.length} stagioni ha segnato ${totals.pts.toLocaleString("it-IT")} punti (${totals.avg.pts.toFixed(1)} a partita).` +
    `${p.clutch && p.clutch.made ? ` Ai playoff ha deciso ${p.clutch.made} possessi finali.` : ""}`);

  // momenti difficili e vita privata
  const serious = H.filter(h => h.seriousInjury);
  const extra = [];
  if (serious.length) extra.push(`Ha dovuto superare ${serious.length === 1 ? "un grave infortunio" : `${serious.length} gravi infortuni`} (${serious.map(h => `${h.seriousInjury.label.toLowerCase()} nel ${h.year}`).join(", ")}).`);
  if (p.mentee && p.mentee.star) extra.push(`Ha fatto da mentore a ${p.mentee.name}, diventato poi una stella.`);
  if ((p.duos || []).length) extra.push(`Da stella ha voluto accanto a sé ${p.duos.map(x => `${x.name} (${x.team}, ${x.year})`).join(" e ")}, formando una coppia di stelle.`);
  const fam = typeof familyText === "function" ? familyText(p) : "";
  if (fam) extra.push(`Fuori dal campo: ${fam.toLowerCase()}.`);
  if (extra.length) paras.push(extra.join(" "));

  // eredità
  const hof = hallOfFameVerdict();
  const jerseys = retiredJerseys();
  let s6 = hof.elected ? "È entrato nella Hall of Fame. " : "Non è entrato nella Hall of Fame. ";
  if (jerseys.length) s6 += `${jerseys.map(j => j.team.name).join(" e ")} ${jerseys.length === 1 ? "ha ritirato" : "hanno ritirato"} la sua maglia numero ${p.jerseyNumber}. `;
  if (p.farewellTour) s6 += `Si è ritirato nel ${p.farewellTour} dopo un tour d'addio tra gli applausi. `;
  else s6 += `Si è ritirato nel ${p.year}, a ${p.age} anni. `;
  if (p.careerGoal && p.careerGoal.status === "done") s6 += `Ha realizzato il suo sogno: ${getCareerGoal(p.careerGoal.id).label.toLowerCase()}.`;
  paras.push(s6.trim());

  if (p.afterCareer) paras.push(`Dopo il ritiro: ${p.afterCareer.lines.join(" ")}`);
  return paras;
}

function renderBiography(targetId) {
  const box = el(targetId);
  if (!box) return;
  const paras = generateBiography(player);
  box.innerHTML = `<div class="bio">${paras.map(() => "<p></p>").join("")}</div>
    <div class="btn-row" style="justify-content:flex-end"><button class="btn btn-ghost btn-sm" id="btn-copy-bio">📋 ${tr("Copia la biografia", "Copy Biography")}</button></div>`;
  box.querySelectorAll(".bio p").forEach((node, i) => { node.textContent = paras[i]; });
  el("btn-copy-bio").addEventListener("click", () => {
    const text = `${player.firstName} ${player.lastName}\n\n${paras.join("\n\n")}`;
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast(tr("📋 Biografia copiata.", "📋 Biography copied.")), () => toast(tr("❌ Copia non riuscita.", "❌ Copy failed.")));
  });
}
