"use strict";

/* ================================================================
   DATA TABLES
   ================================================================ */
const NATIONALITIES = ["USA","Italia","Spagna","Francia","Turchia","Serbia","Grecia","Lituania","Croazia","Slovenia","Germania","Polonia","Ucraina","Canada","Australia","Argentina","Brasile","Nigeria","Corea del Sud","Giappone","Cina"];
const EUROPEAN_NATIONALITIES = ["Italia","Spagna","Francia","Turchia","Serbia","Grecia","Lituania","Croazia","Slovenia","Germania","Polonia","Ucraina"];

/* Anno di partenza della carriera: il giocatore ha 16 anni nella stagione 2026 */
const CAREER_START_YEAR = 2026;

/* Competizioni con la Nazionale: Mondiale ed Europei, ogni 4 anni ciascuno,
   sfalsati di 2 anni l'uno dall'altro (come nel calendario FIBA reale) così da non
   coincidere mai nella stessa estate. */
const WORLD_CUP_BASE_YEAR = 2027;
const EUROBASKET_BASE_YEAR = 2025;
function isWorldCupYear(year) { return (year - WORLD_CUP_BASE_YEAR) % 4 === 0; }
function isEurobasketYear(year) { return (year - EUROBASKET_BASE_YEAR) % 4 === 0; }
function nationalTeamEligible(p) { return p.age >= 18 && p.overall >= 65; }

const NATIONAL_STAGES = ["Fase a Gironi", "Quarti", "Semifinale", "Finale", "Campione"];
const NATIONAL_ROUNDS = ["Fase a Gironi", "Quarti", "Semifinale", "Finale"];

/* Simula l'intero torneo estivo in un colpo solo: la forza della propria Nazionale è
   approssimata dall'overall del giocatore. Oltre all'oro, argento e bronzo sono possibili
   (con una finalina al 50% per chi perde in semifinale, come nei tornei FIBA reali). */
function simulateNationalTournament(p) {
  const strength = clamp(0.28 + (p.overall - 58) / 90, 0.12, 0.92);
  const winProb = clamp(0.32 + (strength - 0.5) * 0.85, 0.12, 0.88);
  const results = [];
  for (const round of NATIONAL_ROUNDS) {
    const won = rollChance(winProb * 100);
    results.push({ round, won });
    if (!won) break;
  }
  const champion = results.length === NATIONAL_ROUNDS.length && results.every(r => r.won);
  let medal = null;
  if (champion) medal = "oro";
  else {
    const last = results[results.length - 1].round;
    if (last === "Finale") medal = "argento";
    else if (last === "Semifinale") medal = rollChance(50) ? "bronzo" : null;
  }
  return { results, champion, medal };
}
function nationalStageIndex(comp) {
  if (!comp) return -1;
  if (comp.champion) return NATIONAL_STAGES.length - 1;
  const order = { "Fase a Gironi": 0, "Quarti": 1, "Semifinale": 2, "Finale 3° posto": 2, "Finale": 3 };
  const last = comp.results[comp.results.length - 1];
  return order[last.round] ?? 0;
}
function nationalCompOutcomeText(comp) {
  if (comp.champion) return `🥇 Campioni!`;
  if (comp.medal === "argento") return "🥈 Argento (Finale persa)";
  if (comp.medal === "bronzo") return "🥉 Bronzo (finalina vinta)";
  if (comp.results[comp.results.length - 1].round === "Finale 3° posto") return "4° posto (finalina persa)";
  const last = comp.results[comp.results.length - 1].round;
  return `Eliminati: ${last}`;
}

const ROLES = [
  { id:"PG", name:"Playmaker (PG)", icon:"🎯", desc:"Regia, assist, palleggio" },
  { id:"SG", name:"Guardia (SG)", icon:"🏹", desc:"Tiro, attacco al ferro" },
  { id:"SF", name:"Ala Piccola (SF)", icon:"🦅", desc:"Versatilità, atletismo" },
  { id:"PF", name:"Ala Grande (PF)", icon:"💪", desc:"Fisico, rimbalzi, tiro" },
  { id:"C",  name:"Centro (C)", icon:"🗼", desc:"Dominio sotto canestro" },
];

/* Coordinate (viewBox 360x400) dei marcatori di posizione sul campo di selezione ruolo */
const ROLE_COURT_POS = {
  PF: { x: 115, y: 95 },
  C:  { x: 245, y: 95 },
  SF: { x: 65,  y: 210 },
  SG: { x: 295, y: 210 },
  PG: { x: 180, y: 285 },
};

/* 8 archetipi per ruolo — una PG non può selezionare "Centro Dominante" e viceversa.
   Gli archetipi ibridi (hybrid) giocano anche nel ruolo accanto: statistiche a metà strada
   tra i due e qualche minuto in più, perché il coach trova sempre dove metterli. */
const ARCHETYPES_BY_ROLE = {
  PG: [
    { id:"PG_FLOOR_GENERAL", name:"Playmaker Puro", icon:"🧠", desc:"Visione di gioco, assist", bumps:{ playmaking:10, shooting:2 }, threeRate:0.32 },
    { id:"PG_COMBO", name:"Combo Guard", icon:"⚔️", desc:"Punteggio + regia equilibrati", bumps:{ shooting:6, playmaking:5, finishing:3 }, threeRate:0.38 },
    { id:"PG_SHARPSHOOTER", name:"Tiratore Puro", icon:"🎯", desc:"Percentuali da 3 elevate", bumps:{ shooting:10, playmaking:3 }, threeRate:0.55 },
    { id:"PG_LOCKDOWN", name:"Difensore Ermetico", icon:"🛡️", desc:"Palle rubate, pressione difensiva", bumps:{ defense:10, athleticism:4 }, threeRate:0.30 },
    { id:"PG_ATHLETIC", name:"Floor General Atletico", icon:"⚡", desc:"Atletismo, transizione veloce", bumps:{ athleticism:9, playmaking:4 }, threeRate:0.26 },
    { id:"PG_PNR", name:"Maestro del Pick and Roll", icon:"🔄", desc:"Legge ogni blocco e punisce ogni cambio", bumps:{ playmaking:6, shooting:4, finishing:2 }, threeRate:0.36 },
    { id:"PG_SCORING", name:"Playmaker Realizzatore", icon:"🔥", desc:"Prima il canestro, poi l'assist", bumps:{ shooting:6, finishing:6 }, threeRate:0.40 },
    { id:"PG_HYBRID", name:"Guardia Ibrida", icon:"🔀", desc:"Regia e punti: gioca da 1 e da 2", bumps:{ shooting:5, playmaking:4, athleticism:2 }, threeRate:0.40, hybrid:"SG" },
  ],
  SG: [
    { id:"SG_SHARPSHOOTER", name:"Tiratore Puro", icon:"🎯", desc:"Percentuali da 3 elevate", bumps:{ shooting:11 }, threeRate:0.58 },
    { id:"SG_SCORER", name:"Scorer Esplosivo", icon:"🔥", desc:"Volume offensivo elevato", bumps:{ shooting:6, finishing:7 }, threeRate:0.40 },
    { id:"SG_3D", name:"3&D", icon:"🛡️", desc:"Tiratore + difensore affidabile", bumps:{ shooting:6, defense:6 }, threeRate:0.50 },
    { id:"SG_SLASHER", name:"Slasher Atletico", icon:"⚡", desc:"Atletismo, attacco al ferro", bumps:{ athleticism:8, finishing:5 }, threeRate:0.22 },
    { id:"SG_PLAYMAKER", name:"Playmaking Guard", icon:"🧠", desc:"Seconda regia, gestione del pallone", bumps:{ playmaking:8, shooting:3 }, threeRate:0.34 },
    { id:"SG_OFF_SCREEN", name:"Uscite dai Blocchi", icon:"🏃", desc:"Sempre in movimento, tiro in corsa dai blocchi", bumps:{ shooting:8, athleticism:3 }, threeRate:0.52 },
    { id:"SG_MICROWAVE", name:"Microonde", icon:"♨️", desc:"Si accende in un attimo: punti a raffica", bumps:{ shooting:5, finishing:6 }, threeRate:0.42 },
    { id:"SG_HYBRID", name:"Swingman", icon:"🔀", desc:"Dal perimetro all'ala: gioca da 2 e da 3", bumps:{ shooting:4, athleticism:4, defense:3 }, threeRate:0.38, hybrid:"SF" },
  ],
  SF: [
    { id:"SF_3D", name:"3&D", icon:"🛡️", desc:"Tiratore + difensore affidabile", bumps:{ shooting:6, defense:6 }, threeRate:0.48 },
    { id:"SF_SLASHER", name:"Slasher Atletico", icon:"⚡", desc:"Atletismo, attacco al ferro", bumps:{ athleticism:9, finishing:5 }, threeRate:0.20 },
    { id:"SF_PLAYMAKER", name:"Playmaker Ibrido", icon:"🧠", desc:"Point-forward, crea per i compagni", bumps:{ playmaking:8, shooting:3 }, threeRate:0.30 },
    { id:"SF_DEFENDER", name:"Ala Difensiva", icon:"🧱", desc:"Stopper perimetrale", bumps:{ defense:10, rebounding:3 }, threeRate:0.28 },
    { id:"SF_SCORER", name:"Scorer Versatile", icon:"🔥", desc:"Punteggio da ogni posizione", bumps:{ shooting:5, finishing:5, athleticism:3 }, threeRate:0.34 },
    { id:"SF_GLUE", name:"Collante", icon:"🧩", desc:"Un po' di tutto: rimbalzi, difesa, extra pass", bumps:{ defense:4, rebounding:4, playmaking:3 }, threeRate:0.30 },
    { id:"SF_CORNER", name:"Tiratore d'Angolo", icon:"📐", desc:"Specialista del tiro dall'angolo", bumps:{ shooting:10, defense:1 }, threeRate:0.56 },
    { id:"SF_HYBRID", name:"Ala Tuttofare", icon:"🔀", desc:"Small ball: gioca da 3 e da 4", bumps:{ rebounding:5, athleticism:3, defense:3 }, threeRate:0.26, hybrid:"PF" },
  ],
  PF: [
    { id:"PF_STRETCH", name:"Stretch Four", icon:"🎯", desc:"Ala grande tiratrice", bumps:{ shooting:9, rebounding:3 }, threeRate:0.48 },
    { id:"PF_BRUISER", name:"Bruiser Fisico", icon:"💪", desc:"Fisico dominante, gioco spalle a canestro", bumps:{ finishing:8, rebounding:6 }, threeRate:0.06 },
    { id:"PF_RIM_PROTECTOR", name:"Difensore Intimidatore", icon:"🧱", desc:"Stoppate e protezione area", bumps:{ defense:10, rebounding:4 }, threeRate:0.08 },
    { id:"PF_PLAYMAKER", name:"Playmaking Forward", icon:"🧠", desc:"Point-forward, ottima visione", bumps:{ playmaking:9, shooting:3 }, threeRate:0.26 },
    { id:"PF_ATHLETIC", name:"Atletico Esplosivo", icon:"⚡", desc:"Atletismo puro, schiacciate", bumps:{ athleticism:9, finishing:5 }, threeRate:0.10 },
    { id:"PF_ENERGY", name:"Energia e Rimbalzi", icon:"🔋", desc:"Lotta su ogni pallone, rimbalzi offensivi", bumps:{ rebounding:9, athleticism:3 }, threeRate:0.05 },
    { id:"PF_SWITCH", name:"Difensore Universale", icon:"🔁", desc:"Cambia su tutti, dal playmaker al centro", bumps:{ defense:8, athleticism:4 }, threeRate:0.14 },
    { id:"PF_HYBRID", name:"Lungo Moderno", icon:"🔀", desc:"Tira da tre e protegge il ferro: gioca da 4 e da 5", bumps:{ shooting:5, defense:4, rebounding:2 }, threeRate:0.34, hybrid:"C" },
  ],
  C: [
    { id:"C_DOMINANT", name:"Centro Dominante", icon:"🏔️", desc:"Rimbalzi, fisico, gioco nel pitturato", bumps:{ rebounding:9, finishing:6 }, threeRate:0.03 },
    { id:"C_RIM_PROTECTOR", name:"Rim Protector", icon:"🧱", desc:"Stoppate, difesa dell'area", bumps:{ defense:10, rebounding:5 }, threeRate:0.04 },
    { id:"C_STRETCH", name:"Stretch Five", icon:"🎯", desc:"Centro tiratore, spaziatura", bumps:{ shooting:10, rebounding:3 }, threeRate:0.42 },
    { id:"C_PLAYMAKING", name:"Playmaking Big", icon:"🧠", desc:"Regia dall'area, passaggi smarcanti", bumps:{ playmaking:9, rebounding:4 }, threeRate:0.10 },
    { id:"C_ROLL_MAN", name:"Roll Man Atletico", icon:"⚡", desc:"Pick and roll esplosivo, alley-oop", bumps:{ athleticism:8, finishing:6 }, threeRate:0.05 },
    { id:"C_OLD_SCHOOL", name:"Centro Vecchia Scuola", icon:"🏛️", desc:"Gancio, piede perno e spalle a canestro", bumps:{ finishing:9, rebounding:4 }, threeRate:0.01 },
    { id:"C_REBOUNDER", name:"Re dei Rimbalzi", icon:"🧲", desc:"Ogni pallone vagante è suo", bumps:{ rebounding:11, defense:2 }, threeRate:0.02 },
    { id:"C_UNICORN", name:"Unicorno", icon:"🦄", desc:"Stoppate e tiro da tre: gioca da 5 e da 4", bumps:{ shooting:6, defense:5, athleticism:2 }, threeRate:0.36, hybrid:"PF" },
  ],
};

/* Focus stagionale: ogni tanto, prima dell'inizio di una stagione, si può scegliere su cosa
   concentrare il proprio lavoro — la scelta dà una spinta agli attributi coerenti e può,
   con una certa probabilità, far evolvere l'archetipo verso lo stile scelto. */
const SEASON_FOCUS_OPTIONS = [
  { id: "team", icon: "🤝", label: "Gioco di Squadra", attrs: ["playmaking"], desc: "Ti concentri su letture di gioco e assist, mettendo i compagni nelle condizioni migliori." },
  { id: "defense", icon: "🛡️", label: "Difesa", attrs: ["defense"], desc: "Studi gli avversari e alzi il livello di intensità e attenzione in fase difensiva." },
  { id: "scoring", icon: "🎯", label: "Tiro e Realizzazione", attrs: ["shooting", "finishing"], desc: "Ore extra al tiro e vicino a canestro per far crescere la tua produzione offensiva." },
  { id: "physical", icon: "💪", label: "Preparazione Fisica", attrs: ["athleticism", "rebounding"], desc: "Programma di potenziamento fisico per essere più esplosivo e presente a rimbalzo." },
];
/* Archetipo verso cui ci si può evolvere, per ruolo, se il focus scelto viene premiato dal dado */
const FOCUS_ARCHETYPE_MAP = {
  PG: { team: "PG_FLOOR_GENERAL", defense: "PG_LOCKDOWN", scoring: "PG_SHARPSHOOTER", physical: "PG_ATHLETIC" },
  SG: { team: "SG_PLAYMAKER", defense: "SG_3D", scoring: "SG_SHARPSHOOTER", physical: "SG_SLASHER" },
  SF: { team: "SF_PLAYMAKER", defense: "SF_DEFENDER", scoring: "SF_SCORER", physical: "SF_SLASHER" },
  PF: { team: "PF_PLAYMAKER", defense: "PF_RIM_PROTECTOR", scoring: "PF_STRETCH", physical: "PF_ATHLETIC" },
  C:  { team: "C_PLAYMAKING", defense: "C_RIM_PROTECTOR", scoring: "C_STRETCH", physical: "C_ROLL_MAN" },
};

/* Range di altezza (cm) e peso (kg) realistici per ruolo */
const BODY_RANGES = {
  PG: { hMin:178, hMax:195, wMin:75,  wMax:90  },
  SG: { hMin:188, hMax:201, wMin:82,  wMax:97  },
  SF: { hMin:196, hMax:206, wMin:90,  wMax:108 },
  PF: { hMin:203, hMax:211, wMin:100, wMax:118 },
  C:  { hMin:208, hMax:218, wMin:110, wMax:135 },
};

/* Percorsi di partenza: start(nazionalità) dà la lega del debutto, mods sposta overall,
   potenziale e popolarità iniziali (variance: il livello di partenza è una scommessa) */
const PATHS = [
  { id:"USA_HS", name:"USA High School", icon:"🎓", desc:"Porta a USA-College e USA-2", start: () => "NCAA", mods: {} },
  { id:"PREP_SCHOOL", name:"Prep School", icon:"🏫", desc:"Accademia privata americana: allenamenti durissimi e tanti scout. Potenziale +3, ma il livello di partenza è una scommessa.", start: () => "NCAA", mods: { potential: 3, variance: 3 } },
  { id:"GLEAGUE_PATH", name:"Programma USA-2", icon:"🏀", desc:"Salti il college e ti alleni con i professionisti: popolarità +5, pochi minuti garantiti.", start: () => "GLEAGUE", mods: { popularity: 5 } },
  { id:"EU_YOUTH", name:"Europa Youth Academy", icon:"🌍", desc:"Le giovanili di casa: ITA-2 (Italia), SPA-1 (Spagna), FRA-1 (Francia), TUR-1 (Turchia), GRE-1 (Grecia) o ADRIATIC-1 (Balcani)", start: n => pickHomeEuroLeague(n), mods: {} },
  { id:"ITA_CLUB", name:"ITA-3 e scuola in Italia", icon:"🏘️", desc:"Studi e giochi in un club di ITA-3: minuti veri da subito, poi la scalata verso ITA-2 e ITA-1. Morale +5.", start: () => italianThirdTier(), mods: { morale: 5 } },
  { id:"NBL_NEXT", name:"Oceania Next", icon:"🦘", desc:"Il programma australiano per i giovani talenti: una lega vera e un contratto da professionista già da ragazzo.", start: () => "NBL", mods: {} },
  { id:"STREET", name:"Streetball", icon:"🏙️", desc:"Cresciuto sui playground, senza allenatori: parti più indietro (−5 overall), ma con un talento grezzo enorme (+6 potenziale).",
    start: n => (n === "USA" || n === "Canada") ? "NCAA" : n === "Italia" ? italianThirdTier() : pickHomeEuroLeague(n), mods: { overall: -5, potential: 6 } },
];
function getPath(id) { return PATHS.find(x => x.id === id) || PATHS[0]; }


/* Ogni squadra: { name, city, colors:[primario, secondario], euro:'EL'|'EC'|null, conference:'Est'|'Ovest'|null }
   euro segna le squadre che partecipano anche a EUROPE-1 (EL) o EUROPE-2 (EC).
   conference è usata solo in USA-1 per dividere la classifica in Est/Ovest. */
function T(name, city, c1, c2, euro, conference) { return { name, city, colors: [c1, c2], euro: euro || null, conference: conference || null }; }

const LEAGUES = {
  NBA: {
    name: "USA-1", continent: "USA", country: "USA", games: 82,
    avgOverall: 78, strengthRange: [0.45, 0.97], salaryMult: 0.55, salaryFloor: 0.6,
    teams: [
      T("Georgia Aviators","Atlanta","#E03A3E","#26282A",null,"Est"), T("Boston Shamrocks","Boston","#007A33","#FFFFFF",null,"Est"),
      T("Empire State Hoops","Brooklyn","#000000","#FFFFFF",null,"Est"), T("Charlotte Swarm","Charlotte","#1D1160","#00788C",null,"Est"),
      T("Illinois Horns","Chicago","#CE1141","#000000",null,"Est"), T("Clev Knights","Cleveland","#860038","#FDBB30",null,"Est"),
      T("Texas Stallions","Dallas","#00538C","#002B5E",null,"Ovest"), T("Denver Miners","Denver","#0E2240","#FEC524",null,"Ovest"),
      T("Motor City Engines","Detroit","#C8102E","#1D42BA",null,"Est"), T("GS Fighters","San Francisco","#1D428A","#FFC72C",null,"Ovest"),
      T("Houston Astronauts","Houston","#CE1141","#000000",null,"Ovest"), T("Indianapolis Racers","Indianapolis","#002D62","#FDBB30",null,"Est"),
      T("LA Sailors","Los Angeles","#C8102E","#1D428A",null,"Ovest"), T("LA Stars","Los Angeles","#552583","#FDB927",null,"Ovest"),
      T("Tennessee Bears","Memphis","#5D76A9","#12173F",null,"Ovest"), T("South Beach Flames","Miami","#98002E","#F9A01B",null,"Est"),
      T("Milwaukee Antlers","Milwaukee","#00471B","#EEE1C6",null,"Est"), T("Minnie Snowdogs","Minneapolis","#0C2340","#236192",null,"Ovest"),
      T("NOLA Birds","New Orleans","#0C2340","#C8102E",null,"Ovest"), T("Manhattan Towers","New York","#006BB6","#F58426",null,"Est"),
      T("OK Storm","Oklahoma City","#007AC1","#EF3B24",null,"Ovest"), T("Florida Illusionists","Orlando","#0077C0","#C4CED4",null,"Est"),
      T("Philly Patriots","Philadelphia","#006BB6","#ED174C",null,"Est"), T("Arizona Desert Rays","Phoenix","#1D1160","#E56020",null,"Ovest"),
      T("Portland Pioneers","Portland","#E03A3E","#000000",null,"Ovest"), T("SAC Royals","Sacramento","#5A2D81","#63727A",null,"Ovest"),
      T("San Antonio Silver","San Antonio","#C4CED4","#000000",null,"Ovest"), T("Toronto Dinos","Toronto","#CE1141","#000000",null,"Est"),
      T("Salt Lake Melody","Salt Lake City","#002B5C","#00471B",null,"Ovest"), T("D.C. Sorcerers","Washington D.C.","#002B5C","#E31837",null,"Est"),
    ]
  },
  NCAA: {
    name: "USA-College", continent: "USA", country: "USA",
    avgOverall: 68, strengthRange: [0.35, 0.9], salaryMult: null, salaryFloor: null,
    teams: [
      T("Duke Royals","Durham","#003087","#FFFFFF"), T("Kentucky Pumas","Lexington","#0033A0","#FFFFFF"),
      T("Kansas Falcons","Lawrence","#0051BA","#E8000D"), T("UCLA Kodiaks","Los Angeles","#2D68C4","#F2A900"),
      T("Gonzaga Terriers","Spokane","#041E42","#C8102E"), T("Michigan Badgers","Ann Arbor","#00274C","#FFCB05"),
      T("Villanova Leopards","Villanova","#00205B","#13B5EA"), T("Arizona Coyotes","Tucson","#CC0033","#003366"),
      T("North Carolina Navigators","Chapel Hill","#7BAFD4","#FFFFFF"), T("Indiana Farmers","Bloomington","#990000","#FFFFFF"),
      T("Louisville Robins","Louisville","#AD0000","#000000"), T("Syracuse Citrus","Syracuse","#F76900","#000E54"),
      T("UConn Malamutes","Storrs","#000E2F","#FFFFFF"), T("Michigan State Gladiators","East Lansing","#18453B","#FFFFFF"),
      T("Florida Crocs","Gainesville","#0021A5","#FA4616"), T("Houston Lynxes","Houston","#C8102E","#76232F"),
      T("Purdue Engineers","West Lafayette","#CEB888","#000000"), T("Baylor Grizzlies","Waco","#154734","#FFB81C"),
      T("Auburn Jaguars","Auburn","#0C2340","#E87722"), T("Tennessee Rangers","Knoxville","#FF8200","#FFFFFF"),
    ]
  },
  GLEAGUE: {
    name: "USA-2", continent: "USA", country: "USA",
    avgOverall: 68, strengthRange: [0.25, 0.6], salaryMult: 0.012, salaryFloor: 0.03,
    teams: [
      T("Rip City Mashups","Portland","#E03A3E","#000000"), T("Long Island Hoops","Uniondale","#000000","#FFFFFF"),
      T("Motor City Voyage","Detroit","#C8102E","#1D42BA"), T("Delaware Red Jackets","Wilmington","#006BB6","#ED174C"),
      T("Sioux Falls Airpower","Sioux Falls","#552583","#FDB927"),
      T("South Bay Stars","El Segundo","#552583","#FDB927"), T("Austin Silver","Austin","#C4CED4","#000000"), T("Santa Cruz Fighters","Santa Cruz","#1D428A","#FFC72C"), T("Texas Myths","Frisco","#00538C","#B8C4CA"), T("Maine Shamrocks","Portland","#007A33","#FFFFFF"), T("Westchester Towers","White Plains","#006BB6","#F58426"), T("Mississauga Reptiles","Mississauga","#CE1141","#000000"), T("Rio Grande Valley Snakes","Edinburg","#00843D","#000000"), T("Capital City Dancers","Washington","#002B5C","#E31837"), T("Indiana Crazy Bugs","Fort Wayne","#002D62","#FDBB30"), T("Osceola Illusionists","Kissimmee","#0077C0","#C4CED4"), T("Memphis Grind","Southaven","#5D76A9","#12173F"), T("Stockton Royals","Stockton","#5A2D81","#63727A"), T("Iowa Snowdogs","Des Moines","#0C2340","#78BE20"), T("Oklahoma City Cyan","Oklahoma City","#007AC1","#EF3B24"),
    ]
  },
  ITA_LBA: {
    name: "ITA-1", continent: "Europa", country: "Italia", relegatesTo: "ITA_A2",
    avgOverall: 75, strengthRange: [0.42, 0.92], salaryMult: 0.10, salaryFloor: 0.05,
    teams: [
      T("Milano Rossi","Milano","#FFFFFF","#D0021B","EL"), T("V nera Bologna","Bologna","#FFFFFF","#000000","EL"),
      T("Tortona D","Tortona","#FFFFFF","#000000"), T("Cantù basket","Cantù","#FFFFFF","#003DA5"),
      T("Udine bk","Udine","#FFFFFF","#000000"), T("Trento Eagles","Trento","#FFFFFF","#000000","EC"),
      T("Pallacanestro Scafati","Scafati","#FFD100","#003DA5"), T("M Roma","Roma","#FFD100","#D0021B"),
      T("Roma Basket","Roma","#FFFFFF","#003DA5"), T("Napoli bk","Napoli","#3EA6E0","#FFFFFF"),
      T("Varese basket","Varese","#FFFFFF","#D0021B"), T("Reggio Basket","Reggio Emilia","#FFFFFF","#D0021B","EC"),
      T("Trieste V","Trieste","#FFFFFF","#D0021B"), T("Verona Scudi","Verona","#FFD100","#003DA5"),
      T("Venezia Lions","Venezia","#FFD700","#6D2932","EC"), T("Treviso UB","Treviso","#FFFFFF","#8ED8F8"),
    ]
  },
  ITA_A2: {
    name: "ITA-2", continent: "Europa", country: "Italia", promotesTo: "ITA_LBA", relegatesTo: ["ITA_B", "ITA_B2"],
    avgOverall: 63, strengthRange: [0.15, 0.50], salaryMult: 0.028, salaryFloor: 0.02,
    teams: [
      T("Forte Bologna","Bologna","#FFFFFF","#003DA5"), T("Stella Brindisi","Brindisi","#FFFFFF","#3EA6E0"),
      T("Caserta bk","Caserta","#FFFFFF","#000000"), T("Cento basket","Cento","#FFFFFF","#D0021B"),
      T("Friuli basket","Cividale","#FFD100","#003DA5"), T("Cremona Juve","Cremona","#FFD700","#8B1E3F"),
      T("Forlì F","Forlì","#FFFFFF","#D0021B"), T("Livorno bk","Livorno","#FFFFFF","#8B1E3F"),
      T("M Mestre","Mestre","#FFFFFF","#D0021B"), T("Wildcat Milano","Milano","#FFFFFF","#003DA5"),
      T("Montecatini bk","Montecatini Terme","#D0021B","#003DA5"), T("Pesaro basket","Pesaro","#FFFFFF","#D0021B"),
      T("Pistoia P","Pistoia","#FFFFFF","#D0021B"), T("Rieti bk","Rieti","#8B1E3F","#8ED8F8"),
      T("Rimini basket","Rimini","#FFFFFF","#D0021B"), T("Puglia bk","Ruvo di Puglia","#FFFFFF","#3EA6E0"),
      T("Torino T","Torino","#FFD100","#003DA5"), T("Basket Avellino","Avellino","#FFFFFF","#046A38"),
      T("Vigevano bk","Vigevano","#FFD100","#003DA5"), T("Sardegna D","Sassari","#003DA5","#FFFFFF"),
    ]
  },
  ESP_ACB: {
    name: "SPA-1", continent: "Europa", country: "Spagna", relegatesTo: "ESP_FEB",
    avgOverall: 76, strengthRange: [0.45, 0.95], salaryMult: 0.11, salaryFloor: 0.05,
    teams: [
      T("Madrid Royal","Madrid","#FFFFFF","#FEBE10","EL"), T("Taronja Valencia","Valencia","#F58220","#000000","EC"),
      T("Canarias Tenerife","Santa Cruz de Tenerife","#003DA5","#FFD100"), T("Costa del Sol Málaga","Málaga","#046A38","#FFFFFF","EC"),
      T("Catalunya Blaugrana","Barcelona","#004D98","#A50044","EL"), T("Badalona Verdinegros","Badalona","#00A651","#000000"),
      T("Las Palmas Amarillos","Las Palmas de Gran Canaria","#FFD100","#003DA5"), T("Vitoria Gasteiz","Vitoria-Gasteiz","#00A651","#000000","EL"),
      T("Murcia Universitaria","Murcia","#D0021B","#000000"), T("Bages Manresa","Manresa","#D0021B","#000000"),
      T("Pyrenees Andorra","Andorra la Vella","#FFD100","#003DA5"), T("Aragon Zaragoza","Zaragoza","#D0021B","#FFFFFF"),
      T("Lugo Celeste","Lugo","#046A38","#FFFFFF"), T("Girona Vermell","Girona","#D0021B","#000000"),
      T("Lleida Terra","Lleida","#003DA5","#D0021B"), T("Bizkaia Bilbao","Bilbao","#D0021B","#000000"),
      T("Burgos Castilla","Burgos","#D0021B","#000000"), T("Sevilla Verdiblancos","Sevilla","#046A38","#FFFFFF"),
    ]
  },
  ESP_FEB: {
    name: "SPA-2", continent: "Europa", country: "Spagna", promotesTo: "ESP_ACB",
    avgOverall: 64, strengthRange: [0.16, 0.52], salaryMult: 0.030, salaryFloor: 0.02,
    teams: [
      T("Madrid Collegiates", "Madrid", "#003399", "#87CEEB"), T("South Madrid", "Fuenlabrada", "#003399", "#FF6600"),
      T("Castilla Purples", "Palencia", "#4B0082", "#FFFFFF"), T("San Sebastian Donosti", "San Sebastián", "#003399", "#FFFFFF"),
      T("Ourense Rivers", "Ourense", "#003399", "#CC0000"), T("Asturias Oviedo", "Oviedo", "#003399", "#FFFFFF"),
      T("Costa Blanca Alicante", "Alicante", "#003399", "#FFFFFF"), T("Cantabria North", "Torrelavega", "#008000", "#FFFFFF"),
      T("Balearic Menorca", "Mahón", "#003399", "#FFFFFF"), T("Castellón Ceramics", "Castellón de la Plana", "#008000", "#FFFFFF"),
      T("Burgos Arlanzón", "Burgos", "#003399", "#CC0000"), T("Zamora Rivers", "Zamora", "#003399", "#FFFFFF"),
      T("Gipuzkoa Greens", "Azpeitia", "#008000", "#FFFFFF"), T("Rioja Logroño", "Logroño", "#800020", "#FFFFFF"),
      T("Palencia Maroons", "Palencia", "#800020", "#000000"), T("Valladolid Royals", "Valladolid", "#4B0082", "#FFFFFF"),
      T("Navarra Pamplona", "Pamplona", "#CC0000", "#FFFFFF"), T("Melilla North Africa", "Melilla", "#003399", "#FFFFFF"),
    ]
  },
  FRA_ELITE: {
    name: "FRA-1", continent: "Europa", country: "Francia", relegatesTo: "FRA_PROB",
    avgOverall: 74, strengthRange: [0.4, 0.88], salaryMult: 0.095, salaryFloor: 0.05,
    teams: [
      T("Hauts-de-Seine 92","Nanterre","#003DA5","#D0021B"), T("Paris Capitale","Paris","#000000","#D0021B","EC"),
      T("Aisne Picardie","Saint-Quentin","#003DA5","#FFFFFF"), T("Alsace Strasbourg","Strasbourg","#003DA5","#000000","EC"),
      T("Lorraine Nancy","Nancy","#D0021B","#FFFFFF"), T("Monte Carlo Roca","Monaco","#D0021B","#FFFFFF","EL"),
      T("Sarthe Le Mans","Le Mans","#003DA5","#FFFFFF"), T("Maine-et-Loire Cholet","Cholet","#F58220","#000000"),
      T("Ain Bourg","Bourg-en-Bresse","#F58220","#000000"), T("Bourgogne Dijon","Dijon","#D0021B","#FFFFFF"),
      T("Villeurbanne Lyon","Villeurbanne","#D0021B","#000000","EL"), T("Haute-Vienne Limoges","Limoges","#046A38","#FFFFFF"),
      T("Saône Chalon","Chalon-sur-Saône","#046A38","#FFFFFF"), T("Loire Roanne","Roanne","#D0021B","#FFFFFF"),
      T("Provence Sur Mer","Fos-sur-Mer","#003DA5","#FFFFFF"), T("Périgord Boulazac","Boulazac","#003DA5","#FFD100"),
    ]
  },
  FRA_PROB: {
    name: "FRA-2", continent: "Europa", country: "Francia", promotesTo: "FRA_ELITE",
    avgOverall: 63, strengthRange: [0.15, 0.50], salaryMult: 0.028, salaryFloor: 0.02,
    teams: [
      T("Béarn Pau", "Pau", "#008000", "#FFFFFF"), T("Riviera Antibes", "Antibes", "#003399", "#FFFFFF"),
      T("Normandy Rouen", "Rouen", "#00205B", "#FFFFFF"), T("Eure Evreux", "Évreux", "#FFCC00", "#003399"),
      T("Loire Atlantique Nantes", "Nantes", "#00205B", "#FFFFFF"), T("Allier Vichy", "Vichy", "#FFCC00", "#008000"),
      T("Nord Denain", "Denain", "#CC0000", "#FFFFFF"), T("Flandres Lille", "Lilla", "#CC0000", "#FFFFFF"),
      T("Vienne Poitiers", "Poitiers", "#003399", "#FFFFFF"), T("Savoie Aix", "Aix-les-Bains", "#CC0000", "#FFFFFF"),
      T("Loiret Orléans", "Orléans", "#FF6600", "#FFFFFF"), T("Champagne Châlons", "Reims", "#003399", "#FFFFFF"),
      T("Garonne Toulouse", "Tolosa", "#00205B", "#FF69B4"), T("Alsace Gries", "Gries", "#008000", "#FFFFFF"),
      T("Côte d'Azur Cannes", "Cannes", "#CC0000", "#FFFFFF"), T("Brittany Quimper", "Quimper", "#003399", "#FFFFFF"),
      T("Vosges Épinal", "Épinal", "#FFCC00", "#003399"), T("Savoie Chambéry", "Chambéry", "#000000", "#FFD700"),
    ]
  },
  TUR_BSL: {
    name: "TUR-1", continent: "Europa", country: "Turchia", relegatesTo: "TUR_TBL",
    avgOverall: 73, strengthRange: [0.4, 0.85], salaryMult: 0.09, salaryFloor: 0.05,
    teams: [
      T("Istanbul Blues","Istanbul","#002F6C","#FFFFFF","EL"), T("Bosphorus College","Istanbul","#003DA5","#FFFFFF","EC"),
      T("Istanbul Eagles","Istanbul","#000000","#FFFFFF"), T("Bursa Crocodiles","Bursa","#046A38","#FFFFFF"),
      T("Istanbul Canaries","Istanbul","#FFD100","#002F6C","EL"), T("Istanbul Lions","Istanbul","#D0021B","#FFD100","EC"),
      T("Aegean Manisa","Manisa","#003DA5","#FFFFFF"), T("Izmir KSK","Izmir","#D0021B","#FFFFFF"),
      T("Mediterranean Mersin","Mersin","#003DA5","#FFFFFF"), T("Marmara Büyükçekmece","Istanbul","#003DA5","#FFD100"),
      T("Aliaga Spor","Izmir","#003DA5","#FFFFFF"), T("Istanbul Erok","Istanbul","#FFD100","#046A38"),
      T("Bursa Auto","Bursa","#FFFFFF","#003DA5"), T("Black Sea Trabzon","Trabzon","#7A0019","#003DA5"),
      T("Ankara Telecom","Ankara","#003DA5","#FFFFFF"), T("Denizli Merkezefendi","Denizli","#D0021B","#000000"),
    ]
  },
  TUR_TBL: {
    name: "TUR-2", continent: "Europa", country: "Turchia", promotesTo: "TUR_BSL",
    avgOverall: 62, strengthRange: [0.15, 0.48], salaryMult: 0.027, salaryFloor: 0.02,
    teams: [
      T("Ankara Capital", "Ankara", "#00205B", "#CC0000"), T("Gaziantep Pistachios", "Gaziantep", "#CC0000", "#000000"),
      T("Konya Eagles", "Konya", "#008000", "#FFFFFF"), T("Forest Ankara", "Ankara", "#008000", "#FFFFFF"),
      T("Balikesir Marmara", "Balıkesir", "#003399", "#FFFFFF"), T("Yalova Green-Reds", "Yalova", "#008000", "#CC0000"),
      T("Kocaeli Gulf", "İzmit", "#008000", "#000000"), T("Bornova Izmir", "Smirne", "#008000", "#FFFFFF"),
      T("Cedi Osman Academy", "Istanbul", "#000000", "#FFD700"), T("Istanbul Sigorta", "Istanbul", "#003399", "#FF6600"),
      T("Mersin South", "Mersin", "#CC0000", "#003399"), T("Antalya Coast", "Antalya", "#CC0000", "#FFFFFF"),
      T("Harem Istanbul", "Istanbul", "#800020", "#FFD700"), T("Fenerbahçe B", "Istanbul", "#FFCC00", "#00205B"),
      T("Kapakli Tekirdağ", "Tekirdağ", "#FFCC00", "#003399"), T("Ankaragücü Yellow-Blues", "Ankara", "#FFCC00", "#00205B"),
      T("Cayirova Kocaeli", "Kocaeli", "#008000", "#FFFFFF"), T("Erokspor B", "Istanbul", "#FFCC00", "#008000"),
    ]
  },
  ITA_B: {
    name: "ITA-3A", continent: "Europa", country: "Italia", promotesTo: "ITA_A2",
    avgOverall: 56, strengthRange: [0.08, 0.38], salaryMult: 0.009, salaryFloor: 0.015,
    teams: [
      T("Agrigento bk","Agrigento","#FFFFFF","#3EA6E0"), T("Brescia basket","Brescia","#003DA5","#FFFFFF"),
      T("Capo d'Orlando bk","Capo d'Orlando","#F58220","#003DA5"), T("Desio bk","Desio","#D0021B","#FFFFFF"),
      T("Ferrara basket","Ferrara","#FFFFFF","#003DA5"), T("Fiorenzuola bk","Fiorenzuola d'Arda","#D0021B","#FFFFFF"),
      T("AC Imola","Imola","#FFFFFF","#D0021B"), T("Legnano bk","Legnano","#FFD100","#003DA5"),
      T("Lumezzane basket","Lumezzane","#D0021B","#FFFFFF"), T("Fulgor Omegna","Omegna","#D0021B","#000000"),
      T("Orzinuovi bk","Orzinuovi","#FFD100","#000000"), T("Piacenza A","Piacenza","#FFFFFF","#D0021B"),
      T("Piazza Armerina bk","Piazza Armerina","#046A38","#FFFFFF"), T("Viola RC","Reggio Calabria","#5A2D81","#FFFFFF"),
      T("Sangiorgese bk","San Giorgio su Legnano","#003DA5","#D0021B"), T("San Vendemiano bk","San Vendemiano","#F58220","#000000"),
      T("Treviglio bk","Treviglio","#D0021B","#003DA5"), T("Vicenza basket","Vicenza","#D0021B","#FFFFFF"),
    ]
  },
  ITA_B2: {
    name: "ITA-3B", continent: "Europa", country: "Italia", promotesTo: "ITA_A2",
    avgOverall: 56, strengthRange: [0.08, 0.38], salaryMult: 0.009, salaryFloor: 0.015,
    teams: [
      T("Lupi Avellino","Avellino","#046A38","#FFFFFF"), T("Chiusi basket","Chiusi","#FFFFFF","#F58220"),
      T("Fabriano bk","Fabriano","#FFFFFF","#003DA5"), T("Faenza bk","Faenza","#FFFFFF","#D0021B"),
      T("Latina basket","Latina","#003DA5","#000000"), T("PL Livorno","Livorno","#003DA5","#FFFFFF"),
      T("Lucca bk","Lucca","#FFFFFF","#D0021B"), T("Montecatini H","Montecatini Terme","#FFFFFF","#D0021B"),
      T("Napoli Est bk","Napoli","#3EA6E0","#000000"), T("L Pesaro","Pesaro","#D0021B","#FFFFFF"),
      T("Piombino bk","Piombino","#003DA5","#FFD100"), T("Quarrata bk","Quarrata","#FFD100","#D0021B"),
      T("Ravenna basket","Ravenna","#FFD100","#D0021B"), T("Roma L","Roma","#D0021B","#FFD100"),
      T("Vir Roma 60","Roma","#003DA5","#FFFFFF"), T("Roseto bk","Roseto degli Abruzzi","#FFFFFF","#003DA5"),
      T("MS Siena","Siena","#000000","#FFFFFF"), T("San Severo bk","San Severo","#FFD100","#000000"),
    ]
  },
  GRE_GBL: {
    name: "GRE-1", continent: "Europa", country: "Grecia", relegatesTo: "GRE_A2",
    avgOverall: 73, strengthRange: [0.35, 0.93], salaryMult: 0.085, salaryFloor: 0.04,
    teams: [
      T("Piraeus Reds","Pireo","#D0021B","#FFFFFF","EL"), T("Athens Greens","Atene","#046A38","#FFFFFF","EL"),
      T("Athens Yellows","Atene","#FFD100","#000000","EC"), T("Thessaloniki Blacks","Salonicco","#000000","#FFFFFF","EC"),
      T("Thessaloniki Gods","Salonicco","#FFD100","#000000"), T("West Athens Peristeri","Atene","#003DA5","#FFFFFF"),
      T("Patras Flames","Patrasso","#D0021B","#FFD100"), T("Rhodes Colossus","Rodi","#003DA5","#FFD100"),
      T("Attica Lavrio","Lavrio","#003DA5","#FFFFFF"), T("North Athens Maroussi","Atene","#D0021B","#FFFFFF"),
      T("Thessaly Karditsa","Karditsa","#046A38","#FFFFFF"), T("Nea Smyrni Panthers","Atene","#7A0019","#003DA5"),
    ]
  },
  GRE_A2: {
    name: "GRE-2", continent: "Europa", country: "Grecia", promotesTo: "GRE_GBL",
    avgOverall: 61, strengthRange: [0.14, 0.46], salaryMult: 0.025, salaryFloor: 0.02,
    teams: [
      T("Thessaloniki Demigods", "Salonicco", "#003399", "#FFFFFF"), T("Mykonos Islanders", "Mykonos", "#003399", "#FFFFFF"),
      T("Lefkada Ionian", "Lefkada", "#003399", "#FFFFFF"), T("Megara West", "Megara", "#CC0000", "#FFFFFF"),
      T("Amaliada Koroivos", "Amaliada", "#003399", "#FFFFFF"), T("Athens Generals", "Atene", "#003399", "#FFFFFF"),
      T("Ermis Schimatari", "Schimatari", "#003399", "#FFCC00"), T("Eleftheroupoli Kavala", "Eleftheroupoli", "#000000", "#FFFFFF"),
      T("Psychiko Athens", "Psychiko", "#003399", "#FFCC00"), T("Papagou Generals", "Papagou", "#003399", "#FFFFFF"),
      T("Panerythraikos Reds", "Nea Erythraia", "#CC0000", "#FFFFFF"), T("Charilaos Trikoupis", "Missolungi", "#FF6600", "#000000"),
      T("Kavalas North", "Kavala", "#003399", "#FFFFFF"), T("Agrinio Greens", "Agrinio", "#008000", "#FFFFFF"),
      T("Messolonghi Lagoon", "Missolungi", "#003399", "#FFFFFF"), T("Amyntas Athens", "Ymittos", "#FF6600", "#003399"),
    ]
  },
  ABA: {
    name: "ADRIATIC-1", continent: "Europa", country: "Serbia", homeNations: ["Serbia", "Croazia", "Slovenia"],
    avgOverall: 73, strengthRange: [0.38, 0.92], salaryMult: 0.085, salaryFloor: 0.04,
    teams: [
      T("Belgrade Black-Whites","Belgrado","#000000","#FFFFFF","EL"), T("Belgrade Red Stars","Belgrado","#D0021B","#FFFFFF","EL"),
      T("Emirates Dubai","Dubai","#000000","#C8A24A","EL"), T("Ljubljana Dragons","Lubiana","#046A38","#FFD100","EC"),
      T("Podgorica Blues","Podgorica","#003DA5","#FFFFFF","EC"), T("Zagreb Wolves","Zagabria","#003DA5","#FFFFFF"),
      T("Aleksandrovac","Aleksandrovac","#D0021B","#003DA5"), T("Belgrade Pink","Belgrado","#F58220","#000000"),
      T("Zeleznik Panthers","Belgrado","#003DA5","#FFFFFF"), T("Dalmatia Split","Spalato","#FFD100","#003DA5"),
      T("Dalmatia Zadar","Zara","#003DA5","#FFFFFF"), T("Morava Cacak","Čačak","#D0021B","#FFFFFF"),
      T("Novo Mesto","Novo Mesto","#046A38","#FFFFFF"), T("Podgorica Students","Podgorica","#003DA5","#D0021B"),
    ]
  },
  NBL: {
    name: "OCEA-1", continent: "Oceania", country: "Australia",
    avgOverall: 70, strengthRange: [0.4, 0.86], salaryMult: 0.06, salaryFloor: 0.05,
    teams: [
      T("Sydney Monarchs","Sydney","#5A2D81","#FFD100"), T("Melbourne Alliance","Melbourne","#002F6C","#FFFFFF"),
      T("Perth Felines","Perth","#D0021B","#FFFFFF"), T("Brisbane Projectiles","Brisbane","#7A0019","#FFD100"),
      T("Adelaide Pioneers","Adelaide","#D0021B","#000000"), T("Illawarra Falcons","Wollongong","#D0021B","#FFFFFF"),
      T("Tasmania Hoppers","Hobart","#046A38","#FFD100"), T("Auckland Surfers","Auckland","#000000","#FFFFFF"),
      T("Cairns Serpents","Cairns","#F58220","#000000"), T("SE Melbourne Firebirds","Melbourne","#D0021B","#F58220"),
    ]
  },
  CBA: {
    name: "CHN-1", continent: "Asia", country: "Cina",
    avgOverall: 70, strengthRange: [0.35, 0.86], salaryMult: 0.16, salaryFloor: 0.1,
    teams: [
      T("Canton Tigers","Dongguan","#D0021B","#FFD100"), T("Shenyang Leopards","Shenyang","#003DA5","#FFFFFF"),
      T("Hangzhou Lions","Hangzhou","#D0021B","#FFFFFF"), T("Capital Waterfowl","Pechino","#D0021B","#000000"),
      T("Shanghai Predators","Shanghai","#003DA5","#FFFFFF"), T("Shenzhen Panthers","Shenzhen","#000000","#F58220"),
      T("Urumqi Tigers","Urumqi","#003DA5","#FFD100"), T("Jinan Heroes","Jinan","#F58220","#FFFFFF"),
      T("Capital Warriors","Pechino","#5A2D81","#FFD100"), T("Canton Dragons","Canton","#046A38","#FFFFFF"),
      T("Qingdao Birds","Qingdao","#D0021B","#003DA5"), T("Nanjing Primates","Nanchino","#FFD100","#000000"),
      T("Fujian Fishes","Jinjiang","#003DA5","#D0021B"), T("Tianjin Trailblazers","Tianjin","#003DA5","#FFFFFF"),
    ]
  },
};

const EU_TOP_LEAGUES = ["ITA_LBA","ESP_ACB","FRA_ELITE","TUR_BSL"];

function pickTeam(leagueId) { return choice(LEAGUES[leagueId].teams); }

/* Da ITA-2 si retrocede nel girone della propria zona: nord in ITA-3A, centro-sud in ITA-3B */
const ITA_3A_CITIES = ["Bologna", "Cento", "Cividale", "Cremona", "Mestre", "Milano", "Torino", "Vigevano", "Udine"];
function relegationLeague(leagueId, team) {
  const r = LEAGUES[leagueId].relegatesTo;
  if (!Array.isArray(r)) return r || null;
  return ITA_3A_CITIES.includes(team.city) ? r[0] : r[1];
}
/* Si comincia in uno dei due gironi di ITA-3 */
function italianThirdTier() { return choice(["ITA_B", "ITA_B2"]); }

function pickHomeEuroLeague(nationality) {
  const map = { "Italia":"ITA_A2", "Spagna":"ESP_ACB", "Francia":"FRA_ELITE", "Turchia":"TUR_BSL", "Grecia":"GRE_GBL", "Serbia":"ABA", "Croazia":"ABA", "Slovenia":"ABA" };
  if (map[nationality]) return map[nationality];
  return choice(EU_TOP_LEAGUES);
}

/* Livelli di difficoltà: spostano le probabilità di vittoria (stagione, playoff, possessi
   decisivi), la crescita, il rischio d'infortunio e la forza nelle trattative. "Normale" è
   il riferimento su cui è tarato tutto il resto (vedi tools/balance.js --difficulty). */
const DIFFICULTIES = [
  { id: "easy", icon: "🌱", label: "Facile", desc: "Squadre più generose, crescita rapida e meno infortuni: per goderti la scalata.",
    win: 0.04, playoff: 0.04, clutch: 0.045, growth: 1.1, injury: 0.8, negotiation: 0.08, gradeMult: 0.85 },
  { id: "normal", icon: "⚖️", label: "Normale", desc: "L'esperienza pensata per il gioco: vincere un titolo è un'impresa, non una formalità.",
    win: 0, playoff: 0, clutch: 0, growth: 1, injury: 1, negotiation: 0, gradeMult: 1 },
  { id: "hard", icon: "🔥", label: "Difficile", desc: "Avversari più cinici, dirigenze più dure e un fisico che perdona meno.",
    win: -0.03, playoff: -0.035, clutch: -0.04, growth: 0.95, injury: 1.15, negotiation: -0.05, gradeMult: 1.1 },
  { id: "legend", icon: "👑", label: "Leggenda", desc: "Per chi vuole sudarsi ogni anello: solo una carriera perfetta arriva in cima.",
    win: -0.06, playoff: -0.07, clutch: -0.08, growth: 0.9, injury: 1.3, negotiation: -0.1, gradeMult: 1.2 },
];
