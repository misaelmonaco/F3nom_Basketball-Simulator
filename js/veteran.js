"use strict";

/* ================================================================
   VETERANI E RITIRO SCELTO — dopo i 30 anni le offerte si accorciano e calano; la squadra
   della tua vita può richiamarti per l'ultimo ballo; e dai 32 anni puoi annunciare il tour
   d'addio: un'ultima stagione tra gli applausi, poi il ritiro con qualche onore in più.
   ================================================================ */
const FAREWELL_MIN_AGE = 32;

/* Contratti da veterano: ingaggio in calo di anno in anno, al massimo 2 anni (1 dai 34) */
function veteranContract(p, cp) {
  if (p.age < 31) return cp;
  if (cp.salary != null) cp.salary = roundMoney(Math.max(cp.salary * clamp(1 - (p.age - 30) * 0.07, 0.5, 1), 0.01));
  cp.years = Math.min(cp.years, p.age >= 34 ? 1 : 2);
  cp.veteran = true;
  return cp;
}

/* La squadra in cui hai giocato più stagioni (almeno 3), se non è quella attuale */
function homecomingTeam(p) {
  if (p.age < 31 || p.homecoming) return null;
  const byTeam = {};
  p.history.forEach(h => {
    const t = byTeam[h.team.name] = byTeam[h.team.name] || { team: h.team, seasons: 0, league: h.league };
    t.seasons++; t.league = h.league;
  });
  const best = Object.values(byTeam).filter(t => t.seasons >= 3 && t.team.name !== p.team.name).sort((a, b) => b.seasons - a.seasons)[0];
  if (!best) return null;
  return { team: best.team, league: leagueOfTeam(best.team) || best.league, seasons: best.seasons };
}
function homecomingOffer(p) {
  const home = homecomingTeam(p);
  if (!home || !rollChance(60)) return null;
  const cp = generateContractProposal(home.league, p, home.team);
  if (cp.salary != null) cp.salary = roundMoney(Math.max(LEAGUES[home.league].salaryFloor, cp.salary * 0.85));
  cp.years = Math.min(cp.years, 2);
  return {
    id: "homecoming", title: tr(`🏠 ${home.team.name} (Ritorno a casa)`, `🏠 ${home.team.name} (Homecoming)`),
    desc: tr(`Dopo ${home.seasons} stagioni insieme, ${home.team.name} ti rivuole per chiudere dove tutto è iniziato. Ingaggio più basso, ma tifosi e compagni ti aspettano.`, `After ${home.seasons} seasons together, ${home.team.name} wants you back to finish where it all began. Lower salary, but fans and teammates are waiting for you.`),
    team: home.team, targetLeague: home.league, contractProposal: cp,
  };
}
/* Firma del ritorno a casa: morale, popolarità e stima in su */
function onHomecomingSigned(p) {
  p.homecoming = { team: p.team.name, year: p.year };
  p.morale = clamp(p.morale + 10, 0, 100);
  p.popularity = clamp(p.popularity + 8, 0, 100);
  changeReputation(p, 2);
  pushNews(tr(`🏠 ${p.firstName} ${p.lastName} torna a ${p.team.name}: il palazzetto è già tutto esaurito.`, `🏠 ${p.firstName} ${p.lastName} returns to ${p.team.name}: the arena is already sold out.`));
}

/* ---------- tour d'addio ---------- */
function canAnnounceFarewell(p) {
  return !!p && p.age >= FAREWELL_MIN_AGE && !p.farewellTour && !p.retired && !p.pendingDecision;
}
function isFarewellSeason(p) { return !!p.farewellTour && p.farewellTour === p.year; }
function announceFarewell() {
  if (!canAnnounceFarewell(player)) return;
  player.farewellTour = player.year + 1;
  player.popularity = clamp(player.popularity + 10, 0, 100);
  player.morale = clamp(player.morale + 8, 0, 100);
  toast(tr(`👋 Annuncio ufficiale: la stagione ${player.farewellTour} sarà l'ultima. Ogni palazzetto ti aspetta per salutarti.`, `👋 Official announcement: the ${player.farewellTour} season will be your last. Every arena is waiting to salute you.`));
  renderGameScreen();
}
function onFarewellClick() {
  if (!canAnnounceFarewell(player)) return;
  if (confirm(tr(`Annunciare che la stagione ${player.year + 1} sarà la tua ultima? A fine stagione ti ritirerai tra gli applausi.`, `Announce that the ${player.year + 1} season will be your last? At the end of the season you will retire to a standing ovation.`))) announceFarewell();
}
