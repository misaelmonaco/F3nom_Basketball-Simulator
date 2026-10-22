"use strict";

/* ================================================================
   SCENARI — carriere con un punto di partenza fissato e un obiettivo preciso al posto del
   sogno. Si sbloccano in sequenza: completato uno, si apre il successivo. Se l'obiettivo
   sfuma la carriera finisce e lo scenario si può riprovare; se si realizza si sceglie se
   chiudere lì o continuare fino al ritiro. I progressi restano nel browser, per tutte le
   carriere (come i traguardi).
   ================================================================ */
const SCENARIO_STORAGE_KEY = "chosenOne.scenarios";
const EU_EL_LEAGUES = ["ITA_LBA", "ESP_ACB", "FRA_ELITE", "TUR_BSL", "GRE_GBL", "ABA"];

let selScenario = null;   // scenario scelto nella creazione (id), null = carriera libera
let scenarioSetup = null; // estrazioni dello scenario fatte una volta sola (livello, palmarès del padre)

function scenarioSeasons(p) { return p.history.length; }
function seasonsLeftText(p, total) {
  const left = Math.max(0, total - scenarioSeasons(p));
  return left === 1
    ? tr("Ti resta 1 stagione", "1 season remaining")
    : tr(`Ti restano ${left} stagioni`, `${left} seasons remaining`);
}
/* Il livello della lega nella sua piramide: 0 è la massima serie, ogni promozione un gradino */
function leagueTier(id) { let t = 0; for (let l = id; LEAGUES[l].promotesTo; l = LEAGUES[l].promotesTo) t++; return t; }
function topLeagueOf(id) { let l = id; while (LEAGUES[l].promotesTo) l = LEAGUES[l].promotesTo; return l; }

/* Ritorno a casa: la squadra della città natale nella categoria più alta (college e USA-2 esclusi,
   da lì non si sale in USA-1) */
function homecomingTeam(city) {
  let best = null;
  Object.keys(LEAGUES).forEach(id => {
    if (id === "NCAA" || id === "GLEAGUE" || LEAGUES[id].minorIta) return;
    LEAGUES[id].teams.forEach(t => {
      if (t.city !== city) return;
      if (!best || leagueTier(id) < best.tier) best = { team: t, leagueId: id, tier: leagueTier(id) };
    });
  });
  return best;
}
function homecomingCities(nationality) { return hometownCities(nationality).filter(c => homecomingTeam(c)); }

function nbaTitleWon(p) { return p.history.some(h => h.league === "NBA" && h.champion); }
function heirCounts(p) { return { rings: p.trophies.rings, mvp: p.trophies.mvp, allstar: p.trophies.allstar }; }
function heirBeaten(p) {
  const f = p.scenario.father, mine = heirCounts(p);
  return ["rings", "mvp", "allstar"].filter(k => mine[k] > f[k]).length;
}
function globetrotterLeagues(p) { return [...new Set(p.history.map(h => h.league).filter(l => l !== "NCAA"))]; }
function globetrotterTitle(p) { return p.history.some(h => h.champion || (h.continental && h.continental.champion)); }

/* evaluate(p, fase): "done", "failed" o null. Le fasi: "recap" (dopo il resoconto della
   stagione), "start" (prima della stagione nuova, dopo il mercato) e "retire" (al ritiro). */
const SCENARIOS = [
  { id: "redemption", icon: "pulse", title: "Il riscatto", titleEn: "Redemption", age: 28, fixedStart: true,
    story: "Avevi un posto in USA-1, poi un grave infortunio al ginocchio ti ha rimandato in Europa. Il ginocchio ha retto, la fame anche: è ora di tornare.",
    storyEn: "You had a spot in USA-1, until a devastating knee injury sent you back to Europe. Your knee held up, and so did your hunger: it's time to get back.",
    startText: "28 anni, in una squadra di EUROPE-1, reduce da un grave infortunio",
    startTextEn: "Age 28, on a EUROPE-1 club, coming off a major injury",
    goal: "Firma un contratto in USA-1 entro 4 stagioni",
    goalEn: "Sign a contract in USA-1 within 4 seasons",
    failText: "Dopo la quarta stagione non sei ancora in USA-1",
    failTextEn: "After the fourth season you are still not in USA-1",
    roll: () => ({ ovr: randInt(80, 82), pot: 86 }),
    start: () => {
      const pool = EU_EL_LEAGUES.flatMap(id => LEAGUES[id].teams.filter(t => t.euro === "EL").map(t => ({ t, id })));
      const picks = [];
      while (picks.length < 3 && pool.length) picks.push(pool.splice(randInt(0, pool.length - 1), 1)[0]);
      return { leagueOf: Object.fromEntries(picks.map(x => [x.t.name, x.id])), teams: picks.map(x => x.t) };
    },
    apply(p) {
      Object.assign(p, { drafted: true, draftDeclared: true, formerNBA: true, yearsPro: 9 });
      p.fragility = 35; p.morale = clamp(p.morale - 5, 0, 100);
      p.reputation = 52; p.popularity = 40;
      return { years: 1, clauses: { nbaExit: true } };
    },
    evaluate(p, phase) {
      if (p.league === "NBA") return "done";
      if (phase === "retire" || (phase === "start" && scenarioSeasons(p) >= 4)) return "failed";
      return null;
    },
    progress: p => tr(
      `${seasonsLeftText(p, 4)} per firmare in USA-1. La USA-1 guarda chi gioca EUROPE-1 da 81 di overall in su.`,
      `${seasonsLeftText(p, 4)} to sign in USA-1. USA-1 scouts EUROPE-1 players rated 81 OVR or higher.`
    ) },

  { id: "heir", icon: "crown", title: "Figlio d'arte", titleEn: "Legacy Heir", age: 16, fixedStart: false,
    story: "Tuo padre è una leggenda: la sua maglia è appesa al soffitto e il suo cognome è anche il tuo. Tutti si aspettano che tu sia come lui. Tu vuoi essere di più.",
    storyEn: "Your father is a legend: his jersey hangs in the rafters and his last name is yours. Everyone expects you to be like him. You want to be greater.",
    startText: "16 anni, con il percorso che scegli tu e il cognome più pesante del basket",
    startTextEn: "Age 16, with the starting path of your choice and the heaviest surname in basketball",
    goal: "Supera il palmarès di tuo padre in almeno 2 voci su 3: anelli USA-1, MVP, convocazioni all'All-Star Game",
    goalEn: "Surpass your father's trophy cabinet in at least 2 of 3 categories: USA-1 rings, MVPs, All-Star selections",
    failText: "Ti ritiri senza averlo superato",
    failTextEn: "You retire without surpassing him",
    roll: () => ({ father: { rings: 1, mvp: randInt(0, 1), allstar: randInt(3, 6), jersey: randInt(0, 99), goat: randInt(800, 1100) } }),
    apply() { return null; },
    evaluate(p, phase) {
      if (heirBeaten(p) >= 2) return "done";
      return phase === "retire" ? "failed" : null;
    },
    progress: p => {
      const f = p.scenario.father, m = heirCounts(p);
      return tr(
        `Anelli ${m.rings}/${f.rings + 1} · MVP ${m.mvp}/${f.mvp + 1} · All-Star ${m.allstar}/${f.allstar + 1}: ne bastano 2 su 3.`,
        `Rings ${m.rings}/${f.rings + 1} · MVP ${m.mvp}/${f.mvp + 1} · All-Star ${m.allstar}/${f.allstar + 1}: beat 2 out of 3.`
      );
    } },

  { id: "lastCall", icon: "clipboard", title: "Ultima chiamata", titleEn: "Last Call", age: 23, fixedStart: true,
    story: "La notte del Draft il tuo nome non è mai uscito. Ti resta un contratto in USA-2 e poco tempo per convincere qualcuno che si sono sbagliati tutti.",
    storyEn: "On Draft night your name was never called. All you have is a USA-2 contract and precious little time to prove every scout wrong.",
    startText: "23 anni, non scelto al Draft, in una squadra di USA-2",
    startTextEn: "Age 23, undrafted, on a USA-2 roster",
    goal: "Firma un contratto in USA-1 entro 2 stagioni",
    goalEn: "Sign a contract in USA-1 within 2 seasons",
    failText: "Dopo la seconda stagione sei ancora fuori dalla USA-1",
    failTextEn: "After your second season you are still outside USA-1",
    roll: () => ({ ovr: randInt(75, 77), pot: randInt(84, 87) }),
    start: () => {
      const pool = [...LEAGUES.GLEAGUE.teams], picks = [];
      while (picks.length < 3) picks.push(pool.splice(randInt(0, pool.length - 1), 1)[0]);
      return { leagueId: "GLEAGUE", teams: picks };
    },
    apply(p) {
      Object.assign(p, { drafted: false, draftDeclared: true, undraftedYears: 1, yearsPro: 1 });
      p.morale = clamp(p.morale - 5, 0, 100);
      return { years: 1 };
    },
    evaluate(p, phase) {
      if (p.league === "NBA") return "done";
      if (phase === "retire" || (phase === "start" && scenarioSeasons(p) >= 2)) return "failed";
      return null;
    },
    progress: p => tr(
      `${seasonsLeftText(p, 2)} per firmare in USA-1. Dalla USA-2 bastano 77 di overall per farsi notare.`,
      `${seasonsLeftText(p, 2)} to sign in USA-1. From USA-2, 77 OVR is enough to get noticed.`
    ) },

  { id: "homecoming", icon: "stadium", title: "Ritorno a casa", titleEn: "Homecoming", age: 30, fixedStart: true, needsHometown: true,
    story: "Hai girato il mondo, ora torni dove hai iniziato. La squadra della tua città ti offre un contratto lungo e una promessa da mantenere.",
    storyEn: "You've traveled the world; now you return to where it all began. Your hometown club offers a long-term deal and a promise to keep.",
    startText: "30 anni, nella squadra della tua città natale (quella della categoria più alta, se ce n'è più di una)",
    startTextEn: "Age 30, on your hometown club (in its highest-tier league)",
    goal: "Porta la squadra della tua città nella massima serie e vinci il titolo, entro 5 stagioni",
    goalEn: "Lead your hometown club to the top flight and win the championship within 5 seasons",
    failText: "Dopo la quinta stagione il titolo non è arrivato",
    failTextEn: "After the fifth season, the championship hasn't arrived",
    roll: () => ({ ovrBonus: randInt(8, 10) }),
    start: pc => {
      const home = homecomingTeam(pc.hometown);
      return { leagueId: home.leagueId, teams: [home.team] };
    },
    ratings(p, setup, leagueId) {
      const ovr = clamp(LEAGUES[topLeagueOf(leagueId)].avgOverall + setup.ovrBonus, 60, 90);
      return { ovr, pot: ovr };
    },
    apply(p) {
      Object.assign(p, { drafted: true, draftDeclared: true, yearsPro: 12 });
      p.reputation = 62; p.popularity = 50;
      return { years: 5 };
    },
    evaluate(p, phase) {
      const team = p.scenario.homeTeam;
      if (p.history.some(h => h.team.name === team && h.champion && !LEAGUES[h.league].promotesTo)) return "done";
      if (phase === "retire" || (phase === "recap" && scenarioSeasons(p) >= 5)) return "failed";
      return null;
    },
    progress: p => {
      const s = p.scenario, inTop = p.team.name === s.homeTeam && !LEAGUES[p.league].promotesTo;
      return tr(
        `${seasonsLeftText(p, 5)}. ${p.team.name === s.homeTeam ? (inTop ? `${s.homeTeam} è in ${LEAGUES[p.league].name}: manca il titolo.` : `${s.homeTeam} gioca in ${LEAGUES[p.league].name}: prima va portata su.`) : `Per riuscirci devi giocare con ${s.homeTeam}.`}`,
        `${seasonsLeftText(p, 5)}. ${p.team.name === s.homeTeam ? (inTop ? `${s.homeTeam} is in ${LEAGUES[p.league].name}: now win the title.` : `${s.homeTeam} is in ${LEAGUES[p.league].name}: earn promotion first.`) : `You must play for ${s.homeTeam} to complete this goal.`}`
      );
    } },

  { id: "rawTalent", icon: "trend", title: "Il talento grezzo", titleEn: "Raw Prospect", age: 17, fixedStart: false,
    story: "Sai fare poco, ma quel poco lo fai come nessuno. Gli scout dicono che il tuo potenziale è il più alto della generazione. Gli scout sbagliano spesso.",
    storyEn: "Your skillset is raw, but what you do well, nobody else can match. Scouts say your ceiling is the highest of your generation. Scouts are often wrong.",
    startText: "17 anni, overall basso e potenziale altissimo, con il percorso che scegli tu",
    startTextEn: "Age 17, low starting overall and sky-high potential, with the path of your choice",
    goal: "Arriva a 90 di overall entro i 28 anni",
    goalEn: "Reach 90 overall rating by age 28",
    failText: "Finisci la stagione dei 28 anni sotto 90",
    failTextEn: "Finish your age-28 season below 90 overall",
    roll: () => ({ ovr: randInt(57, 60), pot: randInt(98, 99) }),
    apply() { return null; },
    evaluate(p, phase) {
      if (p.overall >= 90) return "done";
      if (phase === "retire" || (phase === "recap" && p.age >= 28)) return "failed";
      return null;
    },
    progress: p => tr(
      `Overall ${p.overall}/90 · ${Math.max(0, 28 - p.age)} ${28 - p.age === 1 ? "anno" : "anni"} al limite dei 28.`,
      `Overall ${p.overall}/90 · ${Math.max(0, 28 - p.age)} ${28 - p.age === 1 ? "year" : "years"} left until age 28.`
    ) },

  { id: "globetrotter", icon: "globe", title: "Giramondo", titleEn: "Globetrotter", age: 19, fixedStart: false,
    story: "Una valigia sempre pronta e un passaporto pieno di timbri. Vuoi vedere tutto, e vincere almeno una volta da qualche parte.",
    storyEn: "A packed suitcase and a passport full of stamps. You want to experience basketball everywhere and win at least one title along the way.",
    startText: "19 anni, con il percorso che scegli tu",
    startTextEn: "Age 19, with the starting path of your choice",
    goal: "Gioca in 5 campionati diversi (il college non conta) e vinci almeno un titolo, entro 8 stagioni",
    goalEn: "Play in 5 different pro leagues (college doesn't count) and win at least one title within 8 seasons",
    failText: "Dopo l'ottava stagione ti manca ancora qualcosa",
    failTextEn: "After your eighth season, you are still missing a requirement",
    roll: () => ({ ovrBonus: randInt(-4, -2) }),
    ratings(p, setup) { return { ovr: clamp(p.overall + setup.ovrBonus, 50, 76), pot: p.potential }; },
    apply() { return null; },
    evaluate(p, phase) {
      if (globetrotterLeagues(p).length >= 5 && globetrotterTitle(p)) return "done";
      if (phase === "retire" || (phase === "recap" && scenarioSeasons(p) >= 8)) return "failed";
      return null;
    },
    progress: p => tr(
      `Campionati ${Math.min(5, globetrotterLeagues(p).length)}/5 · titolo ${globetrotterTitle(p) ? "vinto" : "da vincere"} · ${seasonsLeftText(p, 8)}.`,
      `Leagues ${Math.min(5, globetrotterLeagues(p).length)}/5 · title ${globetrotterTitle(p) ? "won" : "needed"} · ${seasonsLeftText(p, 8)}.`
    ) },

  { id: "lastDance", icon: "trophy", title: "L'ultimo ballo", titleEn: "The Last Dance", age: 34, fixedStart: true,
    story: "Hai vinto tutto, tranne quello che conta di più. Il fisico ti concede ancora due stagioni, una squadra da titolo ti vuole. È l'ultima occasione.",
    storyEn: "You've won almost everything except the ultimate prize. Your body has two seasons left in the tank, and a contender wants you. This is your last shot.",
    startText: "34 anni, veterano in una delle squadre più forti della USA-1",
    startTextEn: "Age 34, veteran on one of the strongest teams in USA-1",
    goal: "Vinci l'anello USA-1 nelle ultime 2 stagioni della carriera",
    goalEn: "Win the USA-1 championship ring within your final 2 seasons",
    failText: "Dopo la seconda stagione l'anello non è arrivato: ti ritiri",
    failTextEn: "After two seasons the ring hasn't come: you retire",
    roll: () => ({ ovr: randInt(87, 89) }),
    start: () => {
      const strong = [...LEAGUES.NBA.teams].sort((a, b) => getTeamStrength(b, "NBA") - getTeamStrength(a, "NBA")).slice(0, 6);
      const picks = [];
      while (picks.length < 3) picks.push(strong.splice(randInt(0, strong.length - 1), 1)[0]);
      return { leagueId: "NBA", teams: picks };
    },
    ratings(p, setup) { return { ovr: setup.ovr, pot: setup.ovr }; },
    apply(p) {
      Object.assign(p, { drafted: true, draftDeclared: true, inNBA: true, formerNBA: true, yearsPro: 16, agentChosen: false });
      p.reputation = 75; p.popularity = 65;
      return { years: 2 };
    },
    evaluate(p, phase) {
      if (nbaTitleWon(p)) return "done";
      if (phase === "retire" || (phase === "recap" && scenarioSeasons(p) >= 2)) return "failed";
      return null;
    },
    progress: p => tr(`${seasonsLeftText(p, 2)} per vincere l'anello.`, `${seasonsLeftText(p, 2)} to win the ring.`) },

  { id: "finalClimb", icon: "trend", title: "Scalata finale", titleEn: "The Final Climb", age: 16, fixedStart: true, needsHometown: true, italyOnly: true,
    story: "Dai campetti di periferia alla palestra della tua città: si parte dalla Divisione Regionale 2 (DR2). Sette gradini di una piramide spietata per conquistare la Serie A e il tricolore.",
    storyEn: "From neighborhood blacktops to your hometown gym: starting at the very bottom in Regional Division 2 (DR2). Climb seven rungs of a ruthless pyramid to reach Serie A and win the Scudetto.",
    startText: "16 anni, in DR2 con la polisportiva della tua città natale italiana",
    startTextEn: "Age 16, in DR2 with your Italian hometown club",
    goal: "Raggiungi la Serie A (ITA-1) entro i 28 anni e vinci lo Scudetto entro i 32 anni",
    goalEn: "Reach Serie A (ITA-1) by age 28 and win the Scudetto by age 32",
    failText: "Non raggiungi la Serie A entro i 28 anni o non vinci lo Scudetto entro i 32 anni",
    failTextEn: "Fail to reach Serie A by age 28 or fail to win the Scudetto by age 32",
    roll: () => ({ ovr: randInt(42, 45), pot: randInt(54, 56), maxPot: randInt(84, 88) }),
    start: pc => {
      const city = pc.hometown || "Comunale";
      const prefixes = ["Polisportiva", "Virtus", "Basket", "Robur", "Sporting", "Libertas"];
      const prefix = choice(prefixes);
      const team = T(`${prefix} ${city}`, city, "#003DA5", "#FFD100");
      return { leagueId: "ITA_DR2", teams: [team] };
    },
    ratings(p, setup) {
      return { ovr: setup.ovr, pot: setup.pot };
    },
    apply(p, setup) {
      p.drafted = false; p.draftDeclared = false;
      p.reputation = 20; p.popularity = 15;
      p.scenario = {
        id: "finalClimb", status: "active", startYear: p.year, startAge: 16,
        unlockedTiers: ["ITA_DR2"], maxPot: (setup && setup.maxPot) || 86,
      };
      return null;
    },
    evaluate(p, phase) {
      const wonScudetto = p.history.some(h => h.league === "ITA_LBA" && h.champion) || (p.league === "ITA_LBA" && p.pendingSeason && p.pendingSeason.regular && p.pendingSeason.regular.champion);
      if (wonScudetto) return "done";
      if (phase === "retire") return "failed";
      const reachedLBA = p.league === "ITA_LBA" || p.history.some(h => h.league === "ITA_LBA");
      if (p.age >= 28 && !reachedLBA) return "failed";
      if (p.age >= 32 && !wonScudetto && phase === "recap") return "failed";
      return null;
    },
    progress: p => {
      const reachedLBA = p.league === "ITA_LBA" || p.history.some(h => h.league === "ITA_LBA");
      const wonScudetto = p.history.some(h => h.league === "ITA_LBA" && h.champion);
      if (wonScudetto) return tr("Scudetto vinto!", "Scudetto won!");
      if (!reachedLBA) {
        return tr(
          `Attuale: ${LEAGUES[p.league] ? LEAGUES[p.league].name : p.league}. Raggiungi ITA-1 entro i 28 anni (${Math.max(0, 28 - p.age)} ${28 - p.age === 1 ? "anno" : "anni"} rimasti).`,
          `Current: ${LEAGUES[p.league] ? LEAGUES[p.league].name : p.league}. Reach ITA-1 by age 28 (${Math.max(0, 28 - p.age)} ${28 - p.age === 1 ? "year" : "years"} left).`
        );
      }
      return tr(
        `Sei in Serie A! Vinci lo Scudetto entro i 32 anni (${Math.max(0, 32 - p.age)} ${32 - p.age === 1 ? "anno" : "anni"} rimasti).`,
        `You made Serie A! Win the Scudetto by age 32 (${Math.max(0, 32 - p.age)} ${32 - p.age === 1 ? "year" : "years"} left).`
      );
    } },

  { id: "mrIrrelevant", icon: "dice", title: "Mr. Irrilevante", titleEn: "Mr. Irrelevant", age: 19, fixedStart: true,
    story: "Chiamato con la 60ª e ultima scelta del Draft USA-1. Contratto al minimo, riflettori spenti e la sensazione generale di essere una comparsa destinata al taglio. Dimostra a tutti che il talento vero non si misura coi mock draft.",
    storyEn: "Selected with the 60th and final pick of the USA-1 Draft. A minimum contract, no spotlight, and everyone expecting you to be waived. Prove that true talent isn't measured by mock drafts.",
    startText: "19 anni, 60ª scelta al Draft in USA-1, contratto di 2 anni e minuti da conquistare",
    startTextEn: "Age 19, 60th pick in USA-1, 2-year deal, fighting for every minute",
    goal: "Sii convocato all'All-Star Game o entra nel Miglior Quintetto prima dei 30 anni",
    goalEn: "Make the All-Star Game or All-League First Team before age 30",
    failText: "Compi 30 anni senza convocazioni All-Star né Miglior Quintetto, oppure lasci la USA-1 prima di farcela",
    failTextEn: "Turn 30 without an All-Star or First Team selection, or leave USA-1 before achieving it",
    roll: () => ({ ovr: randInt(65, 68), pot: randInt(87, 90) }),
    start: () => {
      // 3 franchigie USA-1 di metà o bassa classifica tra cui iniziare
      const pool = [...LEAGUES.NBA.teams].sort((a, b) => getTeamStrength(a, "NBA") - getTeamStrength(b, "NBA"));
      const bottomPool = pool.slice(0, 16);
      const picks = [];
      while (picks.length < 3 && bottomPool.length) {
        picks.push(bottomPool.splice(randInt(0, bottomPool.length - 1), 1)[0]);
      }
      return { leagueId: "NBA", teams: picks };
    },
    ratings(p, setup) {
      return { ovr: setup.ovr, pot: setup.pot };
    },
    apply(p) {
      p.drafted = true; p.draftDeclared = true; p.inNBA = true;
      p.reputation = 35; p.popularity = 25; p.coachTrust = 40;
      p.scenario = { id: "mrIrrelevant", status: "active", startYear: p.year, startAge: 19 };
      return { years: 2 };
    },
    evaluate(p, phase) {
      const hasAllStar = (p.trophies && p.trophies.allstar > 0);
      const hasBestFive = (p.trophies && p.trophies.bestFive > 0);
      if (hasAllStar || hasBestFive) return "done";
      if (phase === "retire") return "failed";
      // deve rimanere in USA-1 finché non raggiunge l'obiettivo
      if (p.league !== "NBA") return "failed";
      if (p.age >= 30 && phase === "recap") return "failed";
      return null;
    },
    progress: p => {
      const allstar = (p.trophies && p.trophies.allstar) || 0;
      const bestFive = (p.trophies && p.trophies.bestFive) || 0;
      if (allstar > 0 || bestFive > 0) return tr("Obiettivo raggiunto!", "Goal achieved!");
      const left = Math.max(0, 30 - p.age);
      return tr(
        `Nessun All-Star o Quintetto ancora. Ti restano ${left} ${left === 1 ? "anno" : "anni"} (fino a 30 anni) per arrivarci da giocatore USA-1.`,
        `No All-Star or First Team yet. ${left} ${left === 1 ? "year" : "years"} left (until age 30) to achieve it in USA-1.`
      );
    } },

  { id: "oneClubMan", icon: "shield", title: "La Bandiera", titleEn: "One-Club Man", age: 19, fixedStart: false,
    story: "In un'epoca di superteam e mercenari, tu scegli la strada più romantica: legare per sempre il tuo destino a una sola maglia. Nessun tradimento, nessun cambio di casacca: capitano e leggenda del tuo club fino all'ultimo giorno.",
    storyEn: "In an era of superteams and mercenaries, you choose loyalty: binding your fate to a single jersey forever. No trades, no free-agency departures: captain and legend of your club until the final buzzer.",
    startText: "19 anni, squadra iniziale libera: sarà la tua maglia per tutta la carriera",
    startTextEn: "Age 19, starting club of your choice: it will be your jersey for your entire career",
    goal: "Gioca almeno 12 stagioni consecutive con la stessa squadra e vinci almeno 1 Titolo",
    goalEn: "Play at least 12 consecutive seasons with the same team and win at least 1 Championship",
    failText: "Cambi squadra (cessione o addio a parametro zero), oppure ti ritiri prima di 12 stagioni o senza titoli",
    failTextEn: "Change teams (trade or free agency), or retire before 12 seasons or without a championship",
    roll: () => ({ ovr: randInt(70, 73), pot: randInt(88, 92) }),
    ratings(p, setup) {
      return { ovr: setup.ovr, pot: setup.pot };
    },
    apply(p) {
      p.reputation = 55; p.popularity = 45; p.chemistry = 80;
      p.scenario = {
        id: "oneClubMan", status: "active", startYear: p.year, startAge: p.age,
        clubTeam: p.team.name, clubLeague: p.league,
      };
      return { years: 3 };
    },
    evaluate(p, phase) {
      const s = p.scenario;
      if (!s || !s.clubTeam) return null;
      // se hai cambiato squadra in qualsiasi momento: fallito
      if (p.team.name !== s.clubTeam) return "failed";
      const seasonsWithClub = p.history.filter(h => h.team && h.team.name === s.clubTeam).length + (phase === "start" ? 0 : 0);
      const totalSeasons = p.history.length;
      const hasTitle = p.history.some(h => h.team && h.team.name === s.clubTeam && (h.champion || (h.continental && h.continental.champion)));
      if (seasonsWithClub >= 12 && hasTitle) return "done";
      if (phase === "retire") return "failed";
      return null;
    },
    progress: p => {
      const s = p.scenario;
      const club = s.clubTeam || p.team.name;
      const seasons = p.history.filter(h => h.team && h.team.name === club).length;
      const titles = p.history.filter(h => h.team && h.team.name === club && (h.champion || (h.continental && h.continental.champion))).length;
      return tr(
        `Maglia: ${club} · ${seasons}/12 stagioni giocate · ${titles}/1 titoli vinti. Vietato cambiare squadra!`,
        `Club: ${club} · ${seasons}/12 seasons played · ${titles}/1 titles won. Never change teams!`
      );
    } },
];
if (typeof i18nify === "function") i18nify(SCENARIOS);

function finalClimbUnlockPotential(p, newLeague) {
  if (!p || !p.scenario || p.scenario.id !== "finalClimb" || p.scenario.status !== "active") return;
  p.scenario.unlockedTiers = p.scenario.unlockedTiers || ["ITA_DR2"];
  if (!p.scenario.unlockedTiers.includes(newLeague)) {
    p.scenario.unlockedTiers.push(newLeague);
    const maxPot = p.scenario.maxPot || 86;
    const oldPot = p.potential;
    p.potential = clamp(Math.min(maxPot, p.potential + randInt(4, 6)), p.overall, 99);
    if (p.potential > oldPot) {
      pushNews(tr(
        `📈 Scalando in ${LEAGUES[newLeague] ? LEAGUES[newLeague].name : newLeague}, ritmi e strutture superiori sbloccano il tuo talento: Potenziale → ${p.potential}!`,
        `📈 Climbing to ${LEAGUES[newLeague] ? LEAGUES[newLeague].name : newLeague}, higher pace and better facilities unlock your ceiling: Potential → ${p.potential}!`
      ));
      toast(tr(`📈 Talento sbloccato: Potenziale salito a ${p.potential}!`, `📈 Ceiling unlocked: Potential rose to ${p.potential}!`));
    }
  }
}
function getScenario(id) { return SCENARIOS.find(s => s.id === id) || null; }
function scenarioIndex(id) { return SCENARIOS.findIndex(s => s.id === id); }

/* ---------- progressi, salvati nel browser ---------- */
function scenarioProgress() {
  try {
    const v = JSON.parse(localStorage.getItem(SCENARIO_STORAGE_KEY));
    return v && v.done ? v : { done: {} };
  } catch (e) { return { done: {} }; }
}
function markScenarioCompleted(id) {
  const v = scenarioProgress();
  if (v.done[id]) return;
  v.done[id] = new Date().toISOString().slice(0, 10);
  try { localStorage.setItem(SCENARIO_STORAGE_KEY, JSON.stringify(v)); } catch (e) { /* senza storage resta solo in questa partita */ }
}
function scenarioCompleted(id) { return !!scenarioProgress().done[id]; }
function scenarioUnlocked(id) {
  const i = scenarioIndex(id);
  return i === 0 || (i > 0 && scenarioCompleted(SCENARIOS[i - 1].id));
}
function completedScenarioCount() { return SCENARIOS.filter(s => scenarioCompleted(s.id)).length; }
function nextScenarioId(id) { const n = SCENARIOS[scenarioIndex(id) + 1]; return n ? n.id : null; }

/* ---------- creazione del giocatore dello scenario ---------- */
/* L'inizio dello scenario: lega e squadre tra cui scegliere (quelle libere seguono il percorso) */
function scenarioStart(id, pc) {
  const def = getScenario(id);
  return def && def.start ? def.start(pc) : null;
}
/* Il palmarès del padre, come una generazione della dinastia (vedi legacy.js) */
function heirLegacy(setup, nationality, lastName, fatherFirst) {
  const f = setup.father;
  return {
    generation: 2, lastName, nationality, jersey: f.jersey, startYear: CAREER_START_YEAR, childName: null,
    parents: [{ name: `${fatherFirst} ${lastName}`, jersey: f.jersey, grade: "S", goat: f.goat, rings: f.rings, mvp: f.mvp, allstar: f.allstar,
      hof: true, from: CAREER_START_YEAR - 30, to: CAREER_START_YEAR - 14 }],
  };
}
/* Applica lo scenario a un giocatore appena creato: età, livello, situazione e contratto */
function applyScenario(p, id, setup, leagueId) {
  const def = getScenario(id);
  p.age = def.age;
  p.startAge = def.age;
  const r = def.ratings ? def.ratings(p, setup, leagueId) : { ovr: setup.ovr != null ? setup.ovr : p.overall, pot: setup.pot != null ? setup.pot : p.potential };
  const shift = r.ovr - p.overall;
  ATTR_KEYS.forEach(k => { p.attrs[k] = clamp(p.attrs[k] + shift, 30, 99); });
  p.overall = r.ovr;
  p.potential = clamp(Math.max(r.pot, p.legacy ? p.potential : 0), r.ovr, 99);
  const contract = def.apply(p, setup);
  p.careerGoal = { id: null, status: "none" }; // l'obiettivo dello scenario prende il posto del sogno
  p.scenario = { id, status: "active", startYear: p.year, startAge: def.age, ...(p.scenario || {}) };
  if (id === "heir") p.scenario.father = { ...setup.father, name: p.legacy ? legacyParent(p.legacy).name : "" };
  if (id === "homecoming") { p.scenario.homeTeam = p.team.name; homecomingInvest(p, leagueId); }
  if (id === "finalClimb") { p.scenario.unlockedTiers = ["ITA_DR2"]; p.scenario.maxPot = (setup && setup.maxPot) || 86; }
  if (contract) {
    const cp = generateContractProposal(p.league, p, p.team);
    p.contract = {
      yearsRemaining: contract.years, yearsTotal: contract.years, salaryPerYear: cp.salary, currency: cp.currency,
      teamStrength: cp.teamStrength, clauses: { ...(contract.clauses || {}) }, supermax: false, teamRole: null,
    };
  }
  return p;
}

/* Ritorno a casa: la città investe sul tuo ritorno e dopo ogni promozione rinforza la squadra */
function homecomingInvest(p, leagueId) {
  const s = p.scenario;
  if (!s || s.id !== "homecoming" || s.status !== "active" || p.team.name !== s.homeTeam) return false;
  const r = LEAGUES[leagueId].strengthRange;
  const floor = Math.round((r[0] + (r[1] - r[0]) * 0.65) * 100) / 100;
  teamStrengthRegistry[p.team.name] = Math.max(getTeamStrength(p.team, leagueId), floor);
  return true;
}

/* ---------- durante la carriera ---------- */
function scenarioCheckpoint(p, phase) {
  const s = p && p.scenario;
  if (!s || s.status !== "active") return null;
  const r = getScenario(s.id).evaluate(p, phase);
  if (!r) return null;
  s.status = r; s.year = p.year; s.seasons = scenarioSeasons(p);
  if (r === "done") { markScenarioCompleted(s.id); checkAchievements(p); }
  return r;
}
/* Dopo il resoconto e prima di ogni stagione: true se lo scenario si è preso la scena */
function scenarioInterrupt(phase, next) {
  const r = scenarioCheckpoint(player, phase);
  if (r === "failed") {
    toast(tr(`Scenario fallito: ${getScenario(player.scenario.id).title}.`, `Scenario failed: ${getScenario(player.scenario.id).title}.`));
    player.retired = true;
    player.pendingDecision = null;
    renderFinalScreen();
    return true;
  }
  if (r === "done") {
    player.pendingDecision = { type: "scenarioDone", phase, next: next || null };
    renderGameScreen();
    return true;
  }
  return false;
}
function resolveScenarioDone(keepPlaying) {
  const d = player.pendingDecision;
  if (!d || d.type !== "scenarioDone") return;
  if (!keepPlaying) { player.scenario.ended = true; retirePlayer(); return; }
  player.scenario.continued = true;
  pushNews(tr(`Scenario completato: ${getScenario(player.scenario.id).title}. La carriera continua.`, `Scenario completed: ${getScenario(player.scenario.id).title}. Your career continues.`));
  player.pendingDecision = d.next;
  if (d.phase === "start") advanceSeason();
  else renderGameScreen();
}
/* USA-2 → USA-1: nell'Ultima chiamata le squadre guardano anche chi non è un fenomeno */
function scenarioNbaBar(p) {
  return p.scenario && p.scenario.id === "lastCall" && p.scenario.status === "active" && p.league === "GLEAGUE" ? 77 : null;
}

/* ---------- interfaccia ---------- */
function scenarioStatusBadge(s) {
  return s.status === "done" ? `<span class="badge green">${tr(`Completato${s.continued ? ", carriera in corso" : ""}`, `Completed${s.continued ? ", career ongoing" : ""}`)}</span>`
    : s.status === "failed" ? `<span class="badge red">${tr("Fallito", "Failed")}</span>` : `<span class="badge blue">${tr("In corso", "In progress")}</span>`;
}
/* La card dell'obiettivo nella Panoramica e nella scheda carriera, al posto del sogno */
function scenarioCardHtml(p) {
  const s = p.scenario, def = getScenario(s.id);
  return `
    <div class="dream-card scenario-card ${s.status}">
      <div class="dream-icon">${ico(def.icon)}</div>
      <div class="dream-body">
        <div class="dream-title">${tr("Scenario", "Scenario")}: ${def.title} ${scenarioStatusBadge(s)}</div>
        <div class="small-muted">${def.goal}.</div>
        ${s.status === "active" ? `<div class="scn-progress">${def.progress(p)}</div>` : ""}
        ${s.father ? fatherPalmaresHtml(s.father) : ""}
      </div>
    </div>`;
}
function fatherPalmaresHtml(f) {
  return `<div class="scn-father">
    <div class="scn-father__h">${tr("Il palmarès di tuo padre", "Your Father's Trophy Cabinet")}${f.name ? ` <span class="scn-father__name"></span>` : ""}</div>
    <div class="scn-father__grid">
      <div><strong>${f.rings}</strong><span>${tr(`${f.rings === 1 ? "anello" : "anelli"} USA-1`, `USA-1 ${f.rings === 1 ? "ring" : "rings"}`)}</span></div>
      <div><strong>${f.mvp}</strong><span>MVP</span></div>
      <div><strong>${f.allstar}</strong><span>All-Star</span></div>
    </div>
    <div class="small-muted">${tr(
      `Per superarlo: almeno ${f.rings + 1} anelli, ${f.mvp + 1} MVP o ${f.allstar + 1} All-Star, in 2 voci su 3.`,
      `To surpass him: reach at least ${f.rings + 1} rings, ${f.mvp + 1} MVPs, or ${f.allstar + 1} All-Stars in 2 of 3 categories.`
    )}</div>
  </div>`;
}
function fillFatherName(box, f) {
  box.querySelectorAll(".scn-father__name").forEach(n => { n.textContent = `(${f.name})`; });
}

/* Schermata degli scenari, dalla home */
function openScenariosScreen() {
  renderScenariosScreen();
  el("screen-create").classList.add("hidden");
  el("screen-scenarios").classList.remove("hidden");
  window.scrollTo(0, 0);
}
function closeScenariosScreen() {
  el("screen-scenarios").classList.add("hidden");
  el("screen-create").classList.remove("hidden");
}
function renderScenariosScreen() {
  el("scenarios-count").textContent = tr(`${completedScenarioCount()}/${SCENARIOS.length} completati`, `${completedScenarioCount()}/${SCENARIOS.length} completed`);
  el("scenarios-list").innerHTML = SCENARIOS.map((s, i) => {
    const open = scenarioUnlocked(s.id), done = scenarioCompleted(s.id);
    const prev = SCENARIOS[i - 1];
    return `
      <article class="scn-item ${open ? "" : "locked"} ${done ? "done" : ""}">
        <div class="scn-num">${i + 1}</div>
        <div class="scn-icon">${ico(open ? s.icon : "lock")}</div>
        <div class="scn-body">
          <div class="scn-title">${s.title} ${done ? `<span class="badge green">${ico("check")} ${tr("Completato", "Completed")}</span>` : open ? "" : `<span class="badge idle">${tr("Bloccato", "Locked")}</span>`}</div>
          ${open ? `<p class="scn-story">${s.story}</p>
          <dl class="scn-facts">
            <div><dt>${tr("Partenza", "Start")}</dt><dd>${s.startText}</dd></div>
            <div><dt>${tr("Obiettivo", "Goal")}</dt><dd>${s.goal}</dd></div>
            <div><dt>${tr("Si fallisce se", "Fails if")}</dt><dd>${s.failText}</dd></div>
          </dl>` : `<p class="scn-story small-muted">${tr(`Completa <strong>${prev.title}</strong> per sbloccarlo.`, `Complete <strong>${prev.title}</strong> to unlock.`)}</p>`}
        </div>
        ${open ? `<button type="button" class="btn ${done ? "btn-secondary" : "btn-primary"} scn-play" data-scenario="${s.id}">${done ? tr("Gioca di nuovo", "Play Again") : tr("Gioca", "Play")}</button>` : ""}
      </article>`;
  }).join("");
  el("scenarios-list").querySelectorAll("[data-scenario]").forEach(b => b.addEventListener("click", () => {
    selectScenario(b.dataset.scenario);
    closeScenariosScreen();
    window.scrollTo(0, 0);
  }));
  const btnUnlockAll = el("btn-unlock-all-scenarios");
  if (btnUnlockAll && !btnUnlockAll._bound) {
    btnUnlockAll._bound = true;
    btnUnlockAll.addEventListener("click", () => {
      const state = scenarioProgress();
      SCENARIOS.forEach(sc => { state.done[sc.id] = new Date().toISOString(); });
      try { localStorage.setItem(SCENARIO_STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
      renderScenariosScreen();
      el("btn-open-scenarios-count").textContent = `${completedScenarioCount()}/${SCENARIOS.length}`;
    });
  }
}

/* Sceglie lo scenario per la carriera che si sta creando (null: carriera libera) */
function selectScenario(id) {
  if (id && !scenarioUnlocked(id)) return;
  selScenario = id || null;
  scenarioSetup = id ? getScenario(id).roll() : null;
  pendingLegacy = null;
  if (selScenario) {
    customMode = false;
    el("inp-custom-mode").checked = false;
    if (getScenario(id).fixedStart) selPath = null;
    createWizardOpen = true;
  } else {
    el("inp-nationality").disabled = false;
  }
  hometownNationality = null; // le città possibili cambiano con lo scenario
  wizardStep = 1;
  renderWizard();
}
function renderScenarioBanner() {
  const box = el("scenario-banner");
  const def = selScenario && getScenario(selScenario);
  el("card-custom-mode").classList.toggle("hidden", !!def);
  el("btn-open-scenarios-count").textContent = `${completedScenarioCount()}/${SCENARIOS.length}`;
  // la presentazione in alto racconta lo scenario al posto dei "sedici anni" della carriera libera
  const strap = document.querySelector("#screen-create .co-strap");
  if (strap) {
    strap.querySelector(".co-strap__tag").textContent = def ? `Scenario · ${def.title}` : tr("Nuova carriera", "New Career");
    strap.querySelector(".co-strap__sub").textContent = def ? def.story : tr("Sedici anni, un pallone e una città alle spalle. Sei passi per decidere chi sarà.", "Sixteen years old, a basketball, and a hometown behind you. Six steps to decide who you will become.");
  }
  if (!def) { box.innerHTML = ""; return; }
  box.innerHTML = `
    <div class="scenario-banner">
      <div class="scenario-banner__head">
        <span class="scenario-banner__icon">${ico(def.icon)}</span>
        <div><div class="scenario-banner__tag">${tr(`Scenario ${scenarioIndex(def.id) + 1} di ${SCENARIOS.length}`, `Scenario ${scenarioIndex(def.id) + 1} of ${SCENARIOS.length}`)}</div><div class="scenario-banner__title">${def.title}</div></div>
        <button type="button" class="btn btn-ghost btn-sm" id="btn-leave-scenario">${tr("Torna alla carriera libera", "Back to Free Career")}</button>
      </div>
      <dl class="scn-facts">
        <div><dt>${tr("Partenza", "Start")}</dt><dd>${def.startText}</dd></div>
        <div><dt>${tr("Obiettivo", "Goal")}</dt><dd>${def.goal}</dd></div>
        <div><dt>${tr("Si fallisce se", "Fails if")}</dt><dd>${def.failText}</dd></div>
      </dl>
      ${def.id === "heir" ? fatherPalmaresHtml(scenarioSetup.father) : ""}
      ${def.needsHometown ? `<p class="small-muted">${tr("Scegli nazionalità e città natale: la squadra la decide la città.", "Choose nationality and hometown: your hometown determines the club.")}</p>` : ""}
    </div>`;
  el("btn-leave-scenario").addEventListener("click", () => selectScenario(null));
}

/* Il momento dell'obiettivo raggiunto: chiudere qui o continuare la carriera */
function renderScenarioDone(d, titleEl, subEl, cards) {
  const def = getScenario(player.scenario.id);
  const next = nextScenarioId(def.id);
  el("off-eyebrow").textContent = tr("SCENARIO COMPLETATO", "SCENARIO COMPLETED");
  titleEl.textContent = tr(`${def.title}: obiettivo raggiunto`, `${def.title}: Goal Achieved`);
  subEl.textContent = tr(
    `${def.goal}: fatto.${next ? ` Hai sbloccato «${getScenario(next).title}».` : " Hai completato tutti gli scenari."} Vuoi continuare la carriera o terminare lo scenario?`,
    `${def.goal}: accomplished.${next ? ` You unlocked "${getScenario(next).title}".` : " You have completed all scenarios."} Would you like to continue this career or finish the scenario here?`
  );
  cards.innerHTML =
    offCardHtml({ idx: 0, icon: ico("play"), iconTone: "var(--accent-2)", title: tr("Continua la carriera", "Continue Career"), subtitle: tr("Fino al ritiro, senza più scadenze", "Until retirement, with no more deadlines"), desc: tr("Lo scenario resta completato: da qui in avanti è una carriera come le altre.", "The scenario remains completed: from here on it plays like a standard career.") }) +
    offCardHtml({ idx: 1, icon: ico("flag"), title: tr("Termina lo scenario", "End Scenario"), subtitle: tr("La carriera si chiude qui", "Your career ends here"), desc: tr("Vai alla schermata finale con il voto e il riepilogo.", "Go to the final summary screen with your career grade.") });
  cards.querySelector('[data-idx="0"]').addEventListener("click", () => resolveScenarioDone(true));
  cards.querySelector('[data-idx="1"]').addEventListener("click", () => resolveScenarioDone(false));
}

/* Schermata finale: com'è andato lo scenario, con "Riprova" e il prossimo sbloccato */
function renderFinalScenario() {
  const box = el("final-scenario");
  const s = player.scenario;
  if (!s) { box.innerHTML = ""; box.classList.add("hidden"); return; }
  const def = getScenario(s.id), next = nextScenarioId(s.id);
  box.classList.remove("hidden");
  box.innerHTML = `
    <div class="final-scenario ${s.status}">
      <div class="final-scenario__tag">${s.status === "done" ? tr("Scenario completato", "Scenario Completed") : tr("Scenario fallito", "Scenario Failed")}</div>
      <div class="final-scenario__title">${ico(def.icon)} ${def.title}</div>
      <p>${s.status === "done"
        ? tr(`${def.goal}: obiettivo raggiunto${s.year ? ` nel ${s.year}` : ""}.`, `${def.goal}: goal achieved${s.year ? ` in ${s.year}` : ""}.`)
        : tr(`${def.failText}. L'obiettivo era: ${def.goal.charAt(0).toLowerCase() + def.goal.slice(1)}.`, `${def.failText}. The goal was: ${def.goal.charAt(0).toLowerCase() + def.goal.slice(1)}.`)}</p>
      ${s.father ? fatherPalmaresHtml(s.father) : ""}
      <div class="btn-row">
        <button type="button" class="btn ${s.status === "done" ? "btn-secondary" : "btn-primary"}" id="btn-retry-scenario">${tr("Riprova lo scenario", "Retry Scenario")}</button>
        ${s.status === "done" && next ? `<button type="button" class="btn btn-primary" id="btn-next-scenario">${tr(`Prossimo scenario: ${getScenario(next).title}`, `Next Scenario: ${getScenario(next).title}`)}</button>` : ""}
      </div>
    </div>`;
  if (s.father) fillFatherName(box, s.father);
  el("btn-retry-scenario").addEventListener("click", () => startScenarioFromFinal(s.id));
  if (el("btn-next-scenario")) el("btn-next-scenario").addEventListener("click", () => startScenarioFromFinal(next));
}
function startScenarioFromFinal(id) {
  resetToCreation();
  selectScenario(id);
  renderSavedCareerCard();
  window.scrollTo(0, 0);
}
