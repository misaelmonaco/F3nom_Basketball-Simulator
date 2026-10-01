"use strict";

/* ================================================================
   SEASON SIMULATION ENGINE
   ================================================================ */

function getRoleName(id) { return ROLES.find(r=>r.id===id)?.name.split(" (")[0] || id; }

const MINUTES_TIERS = [
  { label: "Panchina",   min: 6,  max: 17 },
  { label: "6° Uomo",    min: 18, max: 27 },
  { label: "Titolare",   min: 28, max: 34 },
  { label: "Franchigia", min: 34, max: 38 },
];

function determineMinutesRole(overall, leagueAvg, mods) {
  // il minutaggio dipende da quanto il giocatore è sopra/sotto la qualità media della sua lega:
  // lo stesso overall vale un ruolo da protagonista in una lega minore, e la panchina in una big
  const diff = overall - (leagueAvg == null ? 75 : leagueAvg);
  let tier;
  if (diff >= 14) tier = 3;
  else if (diff >= 4) tier = 2;
  else if (diff >= -6) tier = 1;
  else tier = 0;

  // effetti degli imprevisti estivi: panchina forzata o promozione nelle rotazioni
  if (mods) {
    if (mods.benched) tier -= 1;
    if (mods.minutesPenalty) tier -= mods.minutesPenalty; // valore negativo = bonus di rotazione
    if (mods.staffShift) tier += mods.staffShift; // fiducia del coach e stile di gioco
  }
  tier = clamp(tier, 0, MINUTES_TIERS.length - 1);
  if (mods && mods.starter) tier = Math.max(tier, 2); // clausola: titolare garantito
  const t = MINUTES_TIERS[tier];
  return { label: t.label, mpg: randFloat(t.min, t.max) };
}

/* Quota di tentativi da tre e frequenza di tiri liberi di base per ruolo (i lunghi vivono
   più vicino a canestro, le guardie tirano più da fuori e vengono falliate meno spesso) */
const ROLE_SHOT_PROFILE = {
  PG: { ftRate: 0.20 }, SG: { ftRate: 0.22 }, SF: { ftRate: 0.24 }, PF: { ftRate: 0.30 }, C: { ftRate: 0.34 },
};

/* Punti medi segnati a partita dalle squadre in ciascuna lega (dato reale di riferimento):
   la USA-1 — il ritmo più alto — è il contesto base; le altre leghe, più lente, producono meno
   volume statistico a parità di qualità del giocatore, come accade davvero nel basket reale.
   Pesa il VOLUME (punti, rimbalzi, assist, palle rubate/perse, stoppate, tentativi) — il
   coefficiente di difficoltà qui sotto pesa invece l'EFFICIENZA. */
const LEAGUE_AVG_TEAM_PPG = {
  NBA: 115, GLEAGUE: 100, ESP_ACB: 83.4, TUR_BSL: 85,
  ITA_LBA: 80, FRA_ELITE: 79, ITA_A2: 77, NCAA: 73,
  GRE_GBL: 80, ABA: 82, NBL: 88, CBA: 102, ITA_B: 74, ITA_B2: 74,
};
function leaguePaceFactor(leagueId) {
  const ppg = LEAGUE_AVG_TEAM_PPG[leagueId];
  return ppg ? ppg / LEAGUE_AVG_TEAM_PPG.NBA : 0.75;
}

/* Coefficiente di difficoltà (0-10) di ciascuna competizione, in base al livello reale della
   concorrenza — distinto dal ritmo: qui si pesa l'EFFICIENZA di tiro (difese più dure = percentuali
   più basse a parità di abilità) e il "peso" di ciò che si vince nel punteggio GOAT. Include anche
   EUROPE-1 ed EUROPE-2, usate nel bonus GOAT delle coppe europee anche se non sono leghe a sé. */
const LEAGUE_DIFFICULTY = {
  NBA: 10, EUROLEAGUE: 9.5, ESP_ACB: 8.5, TUR_BSL: 8.0, EUROCUP: 8.2,
  FRA_ELITE: 7.8, ITA_LBA: 7.5, GLEAGUE: 6.5, ITA_A2: 6.0, NCAA: 5.5,
  GRE_GBL: 8.0, ABA: 7.9, NBL: 7.0, CBA: 6.2, ITA_B: 4.5, ITA_B2: 4.5,
};
function leagueDifficulty(leagueId) {
  return LEAGUE_DIFFICULTY[leagueId] != null ? LEAGUE_DIFFICULTY[leagueId] : 7;
}
/* Le difese sono più dure quanto più la lega è competitiva: le percentuali di tiro (non i
   liberi, mai contestati) calano leggermente nelle competizioni più dure e salgono in quelle
   più abbordabili, prendendo la USA-1 (difficoltà 10) come riferimento neutro. */
function difficultyEfficiencyFactor(leagueId) {
  return clamp(1.30 - leagueDifficulty(leagueId) * 0.04, 0.90, 1.12);
}
/* Peso della lega/competizione nel punteggio GOAT, derivato direttamente dal coefficiente di
   difficoltà: lo stesso rendimento vale di più quanto più la concorrenza è forte. */
function leagueGoatWeight(leagueId) {
  return leagueDifficulty(leagueId) / 10 * 1.6;
}

/* Motore statistico: invece di un'unica formula diretta, si campionano alcune partite "tipo"
   (tentativi/percentuali/possessi con variabilità partita-per-partita) e se ne fa la media,
   così le voci di stat restano coerenti tra loro (più tentativi quando la sera è positiva,
   percentuali che derivano davvero da canestri/tentativi) invece di un rumore indipendente
   per ciascuna statistica. Include anche tiri da 2/3 separati, liberi e palle perse. */
const ROLE_FACTORS = {
  PG: { pts:0.85, reb:0.5, ast:1.6, stl:1.2, blk:0.3 },
  SG: { pts:1.1, reb:0.55, ast:0.9, stl:1.0, blk:0.3 },
  SF: { pts:1.0, reb:0.8, ast:0.8, stl:1.0, blk:0.5 },
  PF: { pts:0.95, reb:1.2, ast:0.6, stl:0.7, blk:0.8 },
  C:  { pts:0.9, reb:1.5, ast:0.4, stl:0.5, blk:1.3 },
};
/* Punti ogni 36 minuti al ritmo della USA-1 per livello del giocatore: un 80 è un buon titolare
   (~17 su 36 minuti), un 90 un candidato MVP (~27), sopra il 90 si cresce più piano. Così un
   fuoriclasse chiude sui 25-30 a partita, come i migliori marcatori veri, e non sui 40 */
function scoringPer36(overall) {
  if (overall <= 80) return Math.max(4, 17.4 - (80 - overall) * 0.55);
  if (overall <= 90) return 17.4 + (overall - 80) * 0.8;
  return 25.4 + (overall - 90) * 0.4;
}
/* Peso del livello su rimbalzi, assist, recuperi e stoppate: conta, ma molto meno dei numeri del ruolo */
function supportStatFactor(overall) { return clamp(0.85 + (overall - 80) * 0.012, 0.6, 1.08); }
/* Volume di rimbalzi, assist, recuperi e stoppate ogni 36 minuti, per punto di attributo */
const SUPPORT_STAT_K = { reb: 0.98, ast: 0.66, stl: 0.22, blk: 0.22 };
/* Crescita e premi sono tarati sulla statline di prima, più gonfia: la si ricava da quella nuova,
   così numeri più veri non cambiano quanto si cresce né quanti MVP e All-Star si vincono */
function legacyStatScale(stats, overall, attrs) {
  const ovr = clamp(overall, 40, 99), sup = supportStatFactor(ovr);
  // prima il tiro contava per intero, ora la mano conta entro un margine: la scala di prima lo ridà
  const skill = attrs ? (attrs.shooting + attrs.finishing) / 2 / ovr : 1;
  const skillBack = skill / clamp(skill, 0.92, 1.06);
  return { ...stats,
    pts: Math.min(46, stats.pts * skillBack * (ovr * ovr * 3.1 / 800) / scoringPer36(ovr)),
    reb: Math.min(18, stats.reb * (1.6 * ovr / 80) / (SUPPORT_STAT_K.reb * sup)),
    ast: Math.min(13, stats.ast * (1.5 * ovr / 80) / (SUPPORT_STAT_K.ast * sup)),
    stl: Math.min(3.5, stats.stl * (0.55 * ovr / 80) / (SUPPORT_STAT_K.stl * sup)),
    blk: Math.min(4, stats.blk * (0.5 * ovr / 80) / (SUPPORT_STAT_K.blk * sup)),
  };
}
/* Quanto pesano i punti di oggi rispetto alla scala di prima, a un certo livello (per riportare le soglie) */
function pointsScaleNow(overall) { const o = clamp(overall, 40, 99); return scoringPer36(o) / (o * o * 3.1 / 800); }
/* Punti a partita di una stagione sulla scala di prima: le stagioni giocate con la statline nuova
   (statScale 2) si riportano indietro, quelle dei salvataggi vecchi lo sono già */
function legacySeasonPts(h) { return h.statScale === 2 ? h.pts / pointsScaleNow(h.overall) : h.pts; }
/* Tetti delle medie stagionali: oltre, neanche le stagioni migliori della storia */
const STAT_CAPS = { pts: 36, reb: 16, ast: 12.5, stl: 3, blk: 3.8, tov: 6 };
function capStatline(stats) {
  Object.entries(STAT_CAPS).forEach(([k, max]) => { if (stats[k] > max) stats[k] = max; });
  return stats;
}

function simulateStatline(p, minutesInfo, leagueId) {
  const { attrs, role, overall } = p;
  const mins = minutesInfo.mpg;
  const usage = mins / 36;
  // la stamina residua condiziona il rendimento: si arriva alla stagione più o meno freschi
  // a seconda di quanto si è giocato (e invecchiato) negli anni precedenti
  const staminaFactor = clamp(0.82 + (p.stamina / 100) * 0.22, 0.82, 1.04);
  // il ritmo/pace reale della lega pesa il volume di tutte le statistiche (non le percentuali)
  const pace = leaguePaceFactor(leagueId);

  const roleFactors = { ...ROLE_FACTORS[role] };
  // gli ibridi hanno una statline a metà strada tra il ruolo principale e quello accanto
  const second = secondaryRoleOf(p);
  if (second && ROLE_FACTORS[second]) Object.keys(roleFactors).forEach(k => { roleFactors[k] = roleFactors[k] * 0.7 + ROLE_FACTORS[second][k] * 0.3; });
  const shotProfile = ROLE_SHOT_PROFILE[role];

  const archetype = getArchetype(role, p.archetypeId);
  // la propensione al tiro da 3 dipende dall'archetipo, leggermente affinata dalla mano da tiro
  const threeRate = clamp((archetype && archetype.threeRate != null ? archetype.threeRate : 0.3) + (attrs.shooting - 70) / 400, 0.03, 0.68);

  // chi tira e finalizza meglio del suo overall segna un po' di più, e viceversa
  const skillAvg = (attrs.shooting + attrs.finishing) / 2;
  const scoringSkill = clamp(skillAvg / Math.max(1, overall), 0.92, 1.06);
  const support = supportStatFactor(overall);

  const basePts = scoringPer36(overall) * scoringSkill * roleFactors.pts * usage * pace;
  const baseReb = (attrs.rebounding / 10) * roleFactors.reb * support * usage * SUPPORT_STAT_K.reb * pace;
  const baseAst = (attrs.playmaking / 10) * roleFactors.ast * support * usage * SUPPORT_STAT_K.ast * pace;
  const baseStl = (attrs.defense / 10) * roleFactors.stl * support * usage * SUPPORT_STAT_K.stl * pace;
  const baseBlk = (attrs.defense / 10) * roleFactors.blk * support * usage * SUPPORT_STAT_K.blk * pace;

  // percentuali "vere" del giocatore: usate come probabilità di canestro nella simulazione,
  // non come numeri estratti a parte — così emergono coerenti con i tentativi. Il coefficiente
  // di difficoltà della lega pesa la RESA contro difese più o meno dure (i liberi restano
  // fuori: nessuno li contesta, dipendono solo dalla mano del giocatore)
  const diffFactor = difficultyEfficiencyFactor(leagueId);
  const twoPct = clamp((0.42 + attrs.finishing * 0.0038) * diffFactor, 0.32, 0.70);
  const tpPct = clamp((0.24 + attrs.shooting * 0.0034) * diffFactor, 0.15, 0.50);
  const ftPct = clamp(0.55 + attrs.shooting * 0.0043, 0.45, 0.94);

  // i tentativi si ricavano dal volume di punti atteso, così un giocatore con percentuali
  // basse compensa con più tiri e uno con percentuali alte ne basta di meno per lo stesso score
  const pointsPerFga = (1 - threeRate) * twoPct * 2 + threeRate * tpPct * 3;
  const estFga = clamp(pointsPerFga > 0 ? basePts / (pointsPerFga * 1.16) : 0, 1, 30);
  const baseTpa = estFga * threeRate;
  const baseTwoPa = estFga * (1 - threeRate);
  const baseFta = clamp(estFga * shotProfile.ftRate * (0.7 + attrs.finishing / 200 + attrs.athleticism / 300), 0.2, 14);
  // le palle perse crescono con l'utilizzo offensivo e calano con un buon controllo palla
  const baseTov = clamp(usage * 2.6 * (1.15 - attrs.playmaking / 160) * pace, 0.4, 5.5);

  const SAMPLE_GAMES = 16; // partite campione simulate per ricavare medie stagionali più naturali
  const sum = { pts:0, reb:0, ast:0, stl:0, blk:0, tov:0, twoPa:0, twoPm:0, tpa:0, tpm:0, fta:0, ftm:0 };
  for (let g = 0; g < SAMPLE_GAMES; g++) {
    const hot = randFloat(0.72, 1.32, 3); // serata storta o in fiducia: incide sul volume, non sulle percentuali vere
    const twoPa = Math.max(0, baseTwoPa * hot * randFloat(0.85, 1.15, 3));
    const tpa = Math.max(0, baseTpa * hot * randFloat(0.85, 1.15, 3));
    const fta = Math.max(0, baseFta * hot * randFloat(0.8, 1.2, 3));
    const twoPm = twoPa * clamp(twoPct * randFloat(0.8, 1.2, 3), 0, 1);
    const tpm = tpa * clamp(tpPct * randFloat(0.75, 1.3, 3), 0, 1);
    const ftm = fta * clamp(ftPct * randFloat(0.85, 1.15, 3), 0, 1);
    sum.twoPa += twoPa; sum.twoPm += twoPm;
    sum.tpa += tpa; sum.tpm += tpm;
    sum.fta += fta; sum.ftm += ftm;
    sum.pts += twoPm * 2 + tpm * 3 + ftm;
    sum.reb += baseReb * hot * randFloat(0.85, 1.2, 3);
    sum.ast += baseAst * hot * randFloat(0.8, 1.25, 3);
    sum.stl += baseStl * randFloat(0.7, 1.3, 3);
    sum.blk += baseBlk * randFloat(0.7, 1.3, 3);
    sum.tov += baseTov * randFloat(0.75, 1.3, 3);
  }
  const n = SAMPLE_GAMES;
  const fga = (sum.twoPa + sum.tpa) / n;
  const fgm = (sum.twoPm + sum.tpm) / n;
  const tpa = sum.tpa / n, tpm = sum.tpm / n;
  const fta = sum.fta / n, ftm = sum.ftm / n;

  return {
    mpg: round1(mins),
    pts: round1(clamp((sum.pts / n) * staminaFactor, 0.5, STAT_CAPS.pts)),
    reb: round1(clamp((sum.reb / n) * staminaFactor, 0.3, STAT_CAPS.reb)),
    ast: round1(clamp((sum.ast / n) * staminaFactor, 0.2, STAT_CAPS.ast)),
    stl: round1(clamp((sum.stl / n) * staminaFactor, 0.1, STAT_CAPS.stl)),
    blk: round1(clamp((sum.blk / n) * staminaFactor, 0, STAT_CAPS.blk)),
    tov: round1(clamp(sum.tov / n, 0.3, STAT_CAPS.tov)),
    fga: round1(fga), fgm: round1(fgm),
    tpa: round1(tpa), tpm: round1(tpm),
    fta: round1(fta), ftm: round1(ftm),
    fg: round1(fga > 0 ? (fgm / fga) * 100 : 0),
    tp: round1(tpa > 0 ? (tpm / tpa) * 100 : 0),
    ft: round1(fta > 0 ? (ftm / fta) * 100 : 0),
  };
}

/* Quanta stamina consuma una stagione: dipende dal minutaggio e cresce con l'età */
function staminaDrain(p, mpg) {
  const ageFactor = p.age >= 32 ? 1 + (p.age - 31) * 0.12 : 1; // la fatica pesa dai 32 anni
  return clamp(Math.round((mpg / 36) * 22 * ageFactor * getBodyType(p).drain), 6, 42);
}
function round1(n){ return Math.round(n*10)/10; }

/* pct = quanto la squadra è forte rispetto alla propria fascia di lega (0..1), a prescindere
   dal fatto che sia USA-1 o Serie A2: ogni campionato ha così la stessa "aria" competitiva interna. */
function teamStrengthPercentile(teamStrength, leagueId) {
  const range = (leagueId && LEAGUES[leagueId] && LEAGUES[leagueId].strengthRange) || [0.3, 0.95];
  return clamp((teamStrength - range[0]) / (range[1] - range[0]), 0, 1);
}

/* Solo il record W-L della stagione regolare: qualificazione ai playoff, seed e promozione/
   retrocessione vengono decisi subito dopo in base alla classifica reale (simulateLeagueStandings). */
function seasonLength(leagueId) { return LEAGUES[leagueId].games || 34; }

/* Win% atteso della squadra con un certo overall in campo: usato tratto per tratto */
function regularSeasonWinPct(overall, teamStrength, leagueId) {
  const pct = teamStrengthPercentile(teamStrength == null ? 0.6 : teamStrength, leagueId);
  // un giocatore da solo non fa una squadra: il roster pesa più dell'overall del singolo
  return clamp(0.5 + (overall - LEAGUES[leagueId].avgOverall) * 0.006 + (pct - 0.5) * 0.45 + randFloat(-0.06, 0.06), 0.1, 0.85);
}

/* Classifica completa della lega: ogni squadra gioca lo stesso numero di partite del giocatore,
   con un win% legato alla propria forza persistente (getTeamStrength). Da qui derivano
   qualificazione ai playoff, seed del tabellone e zone di promozione/retrocessione. */
function sortStandingsRows(rows) {
  rows.sort((a, b) => b.wins - a.wins || a.team.name.localeCompare(b.team.name));
  rows.forEach((row, i) => { row.rank = i + 1; });
  return rows;
}

/* Classifica completa della lega: ogni squadra gioca lo stesso numero di partite del giocatore
   (82 in USA-1, 34 altrove), con un win% legato alla propria forza persistente (getTeamStrength).
   La USA-1 viene divisa in Conference Est/Ovest, come nella realtà; le altre leghe restano un
   girone unico. Da qui derivano qualificazione ai playoff, seed del tabellone e zone di
   promozione/retrocessione. */
function simulateLeagueStandings(leagueId, playerTeam, playerWins, playerLosses) {
  const teams = LEAGUES[leagueId].teams;
  const games = playerWins + playerLosses;
  // le altre squadre vengono lette dall'elenco canonico della lega; la squadra del giocatore
  // viene sempre aggiunta a parte, perché dopo una promozione/retrocessione può non comparire
  // ancora nell'elenco della nuova categoria pur giocandoci a tutti gli effetti
  const rows = teams
    .filter(team => team.name !== playerTeam.name)
    .map(team => {
      const strength = getTeamStrength(team, leagueId);
      const pct = teamStrengthPercentile(strength, leagueId);
      const winPct = clamp(0.15 + pct * 0.65 + randFloat(-0.08, 0.08), 0.05, 0.92);
      const wins = Math.round(games * winPct);
      return { team, wins, losses: games - wins, isPlayer: false };
    });
  rows.push({ team: playerTeam, wins: playerWins, losses: playerLosses, isPlayer: true });

  if (leagueId === "NBA") {
    const playerConf = playerTeam.conference || "Est";
    const confOf = r => r.team.conference || (r.isPlayer ? playerConf : null);
    const east = sortStandingsRows(rows.filter(r => confOf(r) === "Est"));
    const west = sortStandingsRows(rows.filter(r => confOf(r) === "Ovest"));
    return { conferences: true, east, west };
  }
  return { conferences: false, table: sortStandingsRows(rows) };
}

/* Riga del giocatore e classifica di riferimento (la propria conference in USA-1, l'intera lega altrove) */
function findPlayerStandingsRow(standings) {
  if (standings.conferences) return standings.east.find(r => r.isPlayer) || standings.west.find(r => r.isPlayer);
  return standings.table.find(r => r.isPlayer);
}
function playerConferenceTable(standings, conference) {
  if (!standings.conferences) return standings.table;
  return conference === "Est" ? standings.east : standings.west;
}

/* Impatto statistico della stagione, riportato al ritmo NBA: le leghe più lente producono meno
   volume a parità di qualità, quindi si divide per il fattore di ritmo della lega. Così lo stesso
   valore indica lo stesso "dominio" ovunque, e la differenza di livello tra le leghe emerge da
   sola (in una lega debole si gioca di più e con percentuali migliori, e l'impatto sale). */
function seasonImpact(stats, leagueId) {
  const pace = leaguePaceFactor(leagueId);
  const impact = stats.pts + 1.2 * stats.reb + 1.5 * stats.ast + 2 * stats.stl + 2 * stats.blk - (stats.tov || 0);
  return {
    impact: impact / pace,
    defense: (stats.stl + stats.blk) * 2 / pace,
  };
}
/* Probabilità (%) che cresce linearmente da 0 (valore <= from) a maxPct (valore >= to) */
function rampChance(value, from, to, maxPct) {
  return clamp((value - from) / (to - from), 0, 1) * maxPct;
}

/* Premi individuali: dipendono dall'impatto statistico della stagione (non più solo dall'overall),
   dal cammino della squadra e, per l'All-Star, anche dalla popolarità (il voto dei tifosi).
   I premi sono gerarchici come nella realtà: l'MVP entra sempre nel Miglior Quintetto, e chi è
   nel quintetto è quasi sempre anche All-Star. */
function rollAwards(p, stats, teamResult, season) {
  const awards = [];
  const leagueId = season.leagueId;
  const leagueName = LEAGUES[leagueId].name;
  const { impact, defense } = seasonImpact(legacyStatScale(stats, p.overall, p.attrs), leagueId);
  const isStarter = season.minutesLabel === "Titolare" || season.minutesLabel === "Franchigia";
  // i premi principali richiedono di aver giocato almeno il 65% delle partite, come in USA-1
  const eligible = (season.gpShare == null ? 1 : season.gpShare) >= 0.65;

  // il peso della squadra: un MVP arriva quasi sempre da una squadra di vertice
  const rankShare = season.totalTeams ? season.rank / season.totalTeams : 0.5;
  const teamFactor = rankShare <= 0.12 ? 1.2 : rankShare <= 0.25 ? 1 : teamResult.madePlayoffs ? 0.65 : 0.25;

  const mvp = eligible && isStarter && rollChance(rampChance(impact, 77, 99, 50) * teamFactor);
  if (mvp) awards.push(`MVP ${leagueName}`);

  if (eligible && isStarter && p.attrs.defense >= 85 && rollChance(rampChance(defense + (p.attrs.defense - 85) * 0.4, 13, 21, 35))) awards.push("Difensore dell'Anno");

  const bestFive = mvp || (eligible && isStarter && rollChance(rampChance(impact, 58, 82, 80)));

  // All-Star Game: il college non lo prevede; la popolarità (voto dei tifosi) può spostare l'ago
  if (leagueId !== "NCAA" && (bestFive || eligible)) {
    const fanVote = (p.popularity - 50) * 0.3;
    // nel tour d'addio i tifosi votano per salutarti un'ultima volta
    const farewellVote = p.farewellTour && p.farewellTour === p.year ? 20 : 0;
    const allStarChance = bestFive ? 95 : rampChance(impact, 50, 72, 88) + (impact >= 40 ? fanVote + farewellVote : 0);
    if (rollChance(allStarChance)) awards.push(`All-Star ${leagueName}`);
  }
  if (bestFive) awards.push(`Miglior Quintetto ${leagueName}`);

  // Rookie dell'Anno e Miglior Giovane NBA: solo alla prima stagione in USA-1, quindi una volta sola
  const nbaSeasonsBefore = p.history.filter(h => h.league === "NBA").length;
  const youngEligible = leagueId === "NBA" ? nbaSeasonsBefore === 0 : p.age <= 22;
  // in USA-1 la soglia è più alta: il premio va solo ai rookie che dominano davvero
  if (youngEligible && rollChance(leagueId === "NBA" ? rampChance(impact, 48, 70, 60) : rampChance(impact, 38, 60, 70))) awards.push(`Miglior Giovane ${leagueName}`);

  if (leagueId === "NBA" && nbaSeasonsBefore === 0 && rollChance(rampChance(impact, 42, 65, 70))) awards.push("Rookie dell'Anno");

  if (teamResult.champion && rollChance(rampChance(impact, 48, 78, 85))) awards.push("Finals MVP");
  return awards;
}

/* Punteggio GOAT della singola stagione: combina produzione statistica (pesata per il coefficiente
   di difficoltà della lega), successo di squadra, titoli individuali, titoli di club e torneo con
   la Nazionale. Si somma di anno in anno al punteggio GOAT cumulativo di carriera (player.goatScore). */
function computeSeasonGoatScore(record, attrs) {
  const weight = leagueGoatWeight(record.league);
  // la produzione si misura sulla scala di prima, così il punteggio GOAT resta confrontabile
  const st = legacyStatScale(record, record.overall, attrs);
  const statScore = st.pts * 0.75 + st.reb * 0.55 + st.ast * 0.85 + st.stl * 1.6 + st.blk * 1.5 - (record.tov || 0) * 0.9;
  const gpShare = record.games ? record.gp / record.games : 1;
  let score = statScore * weight * (0.4 + 0.6 * gpShare);

  const games = record.wins + record.losses;
  const winPct = games ? record.wins / games : 0.5;
  score += (winPct - 0.5) * 24;
  if (record.champion) score += 40 * weight;

  if (record.continental && record.continental.champion) {
    const contKey = record.continental.competition === "EUROPE-1" ? "EUROLEAGUE" : "EUROCUP";
    score += 30 * leagueGoatWeight(contKey);
  }

  (record.awards || []).forEach(a => {
    if (a.startsWith("MVP")) score += 35;
    else if (a === "Difensore dell'Anno") score += 20;
    else if (a.startsWith("All-Star")) score += 8;
    else if (a.startsWith("Miglior Quintetto")) score += 15;
    else if (a.startsWith("Miglior Giovane")) score += 10;
    else if (a === "Rookie dell'Anno") score += 12;
    else if (a === "Finals MVP") score += 25;
  });

  if (record.nationalComp) {
    if (record.nationalComp.champion) score += 30;
    else if (record.nationalComp.medal === "argento") score += 18;
    else if (record.nationalComp.medal === "bronzo") score += 12;
  }

  return Math.max(0, Math.round(score));
}

function generateRandomEvent(p) {
  const events = [
    { text: "Infortunio lieve alla caviglia, salta qualche settimana di allenamenti.", type: "injury", effect: () => { p.overall = clamp(p.overall - randInt(1,2), 40, 99); } },
    { text: "Convocazione nella Nazionale maggiore per le qualificazioni.", type: "milestone", effect: () => { p.trophies.medals += 0; } },
    { text: "Cambio di allenatore: nuovo sistema di gioco da imparare.", type: "market", effect: () => {} },
    { text: "Polemiche arbitrali dopo una sconfitta contestata.", type: "market", effect: () => {} },
    { text: "Intervista virale sui social dopo una prestazione dominante.", type: "milestone", effect: () => {} },
    { text: "Nuovo contratto di sponsorizzazione firmato con un brand sportivo.", type: "market", effect: () => {} },
    { text: "Piccolo infortunio muscolare gestito con cautela dallo staff medico.", type: "injury", effect: () => { p.overall = clamp(p.overall - randInt(0,1), 40, 99); } },
    { text: "Il coach elogia pubblicamente la sua crescita mentale.", type: "milestone", effect: () => {} },
    { text: "Tensioni nello spogliatoio dopo un periodo difficile di risultati.", type: "market", effect: () => {} },
    { text: "Premiato come miglior giocatore del mese nella propria conference.", type: "award", effect: () => {} },
  ];
  if (Math.random() < 0.55) {
    const e = choice(events);
    e.effect();
    return e;
  }
  return null;
}
