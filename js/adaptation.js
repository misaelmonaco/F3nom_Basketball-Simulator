"use strict";

/* ================================================================
   ADATTAMENTO A UN NUOVO PAESE — il primo periodo in un campionato straniero pesa su
   rendimento e morale finché non ci si ambienta (0-100). Si parte più indietro cambiando
   continente; ogni tratto di stagione si recupera un po', e a inizio avventura si può
   scegliere come affrontare la nostalgia di casa.
   ================================================================ */
function leagueCountry(leagueId) { return LEAGUES[leagueId] ? LEAGUES[leagueId].country : null; }
function leagueContinent(leagueId) { return LEAGUES[leagueId] ? LEAGUES[leagueId].continent : null; }

/* A inizio stagione: si è cambiato paese? Allora si riparte dall'ambientamento */
function updateAdaptationForSeason(p) {
  const country = leagueCountry(p.league);
  p.adaptedCountries = p.adaptedCountries || [];
  const home = country === p.nationality || (LEAGUES[p.league].homeNations || []).includes(p.nationality);
  if (!country || home || p.adaptedCountries.includes(country)) { p.adaptation = null; p.lastLeague = p.league; return; }
  if (p.adaptation && p.adaptation.country === country) { p.lastLeague = p.league; return; }
  const prevContinent = p.lastLeague ? leagueContinent(p.lastLeague) : (EUROPEAN_NATIONALITIES.includes(p.nationality) ? "Europa" : p.nationality === "USA" ? "USA" : null);
  // con la famiglia al seguito ci si ambienta prima
  const base = (p.age <= 18 ? 45 : prevContinent && prevContinent !== leagueContinent(p.league) ? 25 : 40) + (p.family && p.family.married ? 10 : 0) + (hasTrait(p, "globetrotter") ? 25 : 0);
  p.adaptation = { country, level: base, since: p.year, asked: false };
  pushNews(tr(`🧳 Nuovo paese, nuova vita: ${country}. Serve tempo per ambientarsi.`, `🧳 New country, new life: ${country}. It takes time to settle in.`));
  p.lastLeague = p.league;
}

/* Effetto sul rendimento: da −7% (appena arrivati) a nessun effetto (ambientati) */
function adaptationStatMult(p) {
  if (!p.adaptation) return 1;
  return 0.93 + 0.07 * clamp(p.adaptation.level, 0, 100) / 100;
}

/* Dopo ogni tratto: l'ambientamento cresce; sotto 50 la lontananza pesa sul morale */
function progressAdaptation(p, bonus) {
  const a = p.adaptation;
  if (!a) return null;
  if (a.level < 50) p.morale = clamp(p.morale - 2, 0, 100);
  a.level = clamp(a.level + randInt(8, 14) + (bonus || 0), 0, 100);
  if (a.level >= 100) {
    p.adaptedCountries = [...(p.adaptedCountries || []), a.country];
    p.adaptation = null;
    p.morale = clamp(p.morale + 4, 0, 100);
    toast(tr(`🏡 Ti senti a casa in ${a.country}: ambientamento completato.`, `🏡 You feel right at home in ${a.country}: fully adapted.`));
    return 100;
  }
  return a.level;
}

function familyMoveCost(p) { return roundMoney(Math.max(0.1, p.wealth * 0.04)); }

/* Situazione dei tratti: si presenta nel primo tratto dopo il trasferimento */
SEASON_SITUATIONS.push({
  id: "homesick", icon: "🧳", title: "Lontano da casa", titleEn: "Far From Home", conditional: true,
  desc: "Lingua nuova, abitudini diverse, famiglia lontana: le prime settimane nel nuovo paese sono dure.",
  descEn: "A new language, different habits, family far away: the first few weeks in a new country are tough.",
  options: [
    { id: "family", label: "Porta la famiglia con te", labelEn: "Bring Your Family Along", desc: "Casa più grande e voli per tutti (circa il 4% del patrimonio): ti ambienti molto più in fretta.", descEn: "A bigger house and flights for everyone (about 4% of your net worth): you settle in much faster.",
      available: p => p.wealth >= 0.5, unavailableText: "Serve almeno mezzo milione di patrimonio.", unavailableTextEn: "Requires at least half a million in net worth." },
    { id: "course", label: "Corso di lingua e cultura", labelEn: "Language & Culture Course", desc: "Lezioni dopo gli allenamenti: ti ambienti prima, ma arrivi un po' più stanco.", descEn: "Lessons after practice: you adapt faster, though it drains a bit of energy." },
    { id: "grit", label: "Stringi i denti", labelEn: "Grit Your Teeth", desc: "Nessun costo: ti ambienterai col tempo.", descEn: "No cost: you will adapt with time." },
  ],
  apply(p, optionId) {
    if (!p.adaptation) return tr("Ormai ti senti a casa.", "You already feel at home.");
    if (optionId === "family") {
      const cost = familyMoveCost(p);
      if (p.wealth >= 0.5 && p.wealth >= cost) {
        p.wealth = roundMoney(p.wealth - cost);
        p.adaptation.level = clamp(p.adaptation.level + 25, 0, 100);
        p.morale = clamp(p.morale + 5, 0, 100);
        return tr(`La tua famiglia ti ha raggiunto (${fmtMoney(cost, playerCurrency(p))}): ti senti meno solo.`, `Your family joined you (${fmtMoney(cost, playerCurrency(p))}): you feel much less alone.`);
      }
      optionId = "course"; // senza soldi a sufficienza ci si arrangia con il corso
    }
    if (optionId === "course") {
      p.adaptation.level = clamp(p.adaptation.level + 15, 0, 100);
      p.stamina = clamp(p.stamina - 4, 0, 100);
      return tr("Il corso di lingua ti aiuta a capire compagni e allenatore.", "The language course helps you communicate with teammates and your coach.");
    }
    return tr("Hai stretto i denti: l'ambientamento farà il suo corso.", "You gritted your teeth: adaptation will take its natural course.");
  },
});
if (typeof i18nify === "function") i18nify(SEASON_SITUATIONS);
