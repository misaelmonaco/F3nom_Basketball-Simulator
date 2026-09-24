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
  if (!country || country === p.nationality || p.adaptedCountries.includes(country)) { p.adaptation = null; p.lastLeague = p.league; return; }
  if (p.adaptation && p.adaptation.country === country) { p.lastLeague = p.league; return; }
  const prevContinent = p.lastLeague ? leagueContinent(p.lastLeague) : (EUROPEAN_NATIONALITIES.includes(p.nationality) ? "Europa" : p.nationality === "USA" ? "USA" : null);
  const base = p.age <= 18 ? 45 : prevContinent && prevContinent !== leagueContinent(p.league) ? 25 : 40;
  p.adaptation = { country, level: base, since: p.year, asked: false };
  pushNews(`🧳 Nuovo paese, nuova vita: ${country}. Serve tempo per ambientarsi.`);
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
    toast(`🏡 Ti senti a casa in ${a.country}: ambientamento completato.`);
    return 100;
  }
  return a.level;
}

function familyMoveCost(p) { return round1(Math.max(0.1, p.wealth * 0.04)); }

/* Situazione dei tratti: si presenta nel primo tratto dopo il trasferimento */
SEASON_SITUATIONS.push({
  id: "homesick", icon: "🧳", title: "Lontano da casa", conditional: true,
  desc: "Lingua nuova, abitudini diverse, famiglia lontana: le prime settimane nel nuovo paese sono dure.",
  options: [
    { id: "family", label: "Porta la famiglia con te", desc: "Casa più grande e voli per tutti (circa il 4% del patrimonio): ti ambienti molto più in fretta.",
      available: p => p.wealth >= 0.5, unavailableText: "Serve almeno mezzo milione di patrimonio." },
    { id: "course", label: "Corso di lingua e cultura", desc: "Lezioni dopo gli allenamenti: ti ambienti prima, ma arrivi un po' più stanco." },
    { id: "grit", label: "Stringi i denti", desc: "Nessun costo: ti ambienterai col tempo." },
  ],
  apply(p, optionId) {
    if (!p.adaptation) return "Ormai ti senti a casa.";
    if (optionId === "family") {
      const cost = familyMoveCost(p);
      if (p.wealth >= 0.5 && p.wealth >= cost) {
        p.wealth = round1(p.wealth - cost);
        p.adaptation.level = clamp(p.adaptation.level + 25, 0, 100);
        p.morale = clamp(p.morale + 5, 0, 100);
        return `La tua famiglia ti ha raggiunto (${fmtMoney(cost, playerCurrency(p))}): ti senti meno solo.`;
      }
      optionId = "course"; // senza soldi a sufficienza ci si arrangia con il corso
    }
    if (optionId === "course") {
      p.adaptation.level = clamp(p.adaptation.level + 15, 0, 100);
      p.stamina = clamp(p.stamina - 4, 0, 100);
      return "Il corso di lingua ti aiuta a capire compagni e allenatore.";
    }
    return "Hai stretto i denti: l'ambientamento farà il suo corso.";
  },
});
