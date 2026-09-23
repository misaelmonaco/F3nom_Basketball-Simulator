"use strict";

/* ================================================================
   DATA TABLES
   ================================================================ */
const NATIONALITIES = ["USA","Italia","Spagna","Francia","Turchia","Serbia","Grecia","Lituania","Croazia","Canada","Australia","Germania","Argentina"];
const EUROPEAN_NATIONALITIES = ["Italia","Spagna","Francia","Turchia","Serbia","Grecia","Lituania","Croazia","Germania"];

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
  const order = { "Fase a Gironi": 0, "Quarti": 1, "Semifinale": 2, "Finale": 3 };
  const last = comp.results[comp.results.length - 1];
  return order[last.round] ?? 0;
}
function nationalCompOutcomeText(comp) {
  if (comp.champion) return `🥇 Campioni!`;
  if (comp.medal === "argento") return "🥈 Argento (Finale persa)";
  if (comp.medal === "bronzo") return "🥉 Bronzo (finalina vinta)";
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

/* 5 archetipi per ruolo — una PG non può selezionare "Centro Dominante" e viceversa */
const ARCHETYPES_BY_ROLE = {
  PG: [
    { id:"PG_FLOOR_GENERAL", name:"Playmaker Puro", icon:"🧠", desc:"Visione di gioco, assist", bumps:{ playmaking:10, shooting:2 }, threeRate:0.32 },
    { id:"PG_COMBO", name:"Combo Guard", icon:"⚔️", desc:"Punteggio + regia equilibrati", bumps:{ shooting:6, playmaking:5, finishing:3 }, threeRate:0.38 },
    { id:"PG_SHARPSHOOTER", name:"Tiratore Puro", icon:"🎯", desc:"Percentuali da 3 elevate", bumps:{ shooting:10, playmaking:3 }, threeRate:0.55 },
    { id:"PG_LOCKDOWN", name:"Difensore Ermetico", icon:"🛡️", desc:"Palle rubate, pressione difensiva", bumps:{ defense:10, athleticism:4 }, threeRate:0.30 },
    { id:"PG_ATHLETIC", name:"Floor General Atletico", icon:"⚡", desc:"Atletismo, transizione veloce", bumps:{ athleticism:9, playmaking:4 }, threeRate:0.26 },
  ],
  SG: [
    { id:"SG_SHARPSHOOTER", name:"Tiratore Puro", icon:"🎯", desc:"Percentuali da 3 elevate", bumps:{ shooting:11 }, threeRate:0.58 },
    { id:"SG_SCORER", name:"Scorer Esplosivo", icon:"🔥", desc:"Volume offensivo elevato", bumps:{ shooting:6, finishing:7 }, threeRate:0.40 },
    { id:"SG_3D", name:"3&D", icon:"🛡️", desc:"Tiratore + difensore affidabile", bumps:{ shooting:6, defense:6 }, threeRate:0.50 },
    { id:"SG_SLASHER", name:"Slasher Atletico", icon:"⚡", desc:"Atletismo, attacco al ferro", bumps:{ athleticism:8, finishing:5 }, threeRate:0.22 },
    { id:"SG_PLAYMAKER", name:"Playmaking Guard", icon:"🧠", desc:"Seconda regia, gestione del pallone", bumps:{ playmaking:8, shooting:3 }, threeRate:0.34 },
  ],
  SF: [
    { id:"SF_3D", name:"3&D", icon:"🛡️", desc:"Tiratore + difensore affidabile", bumps:{ shooting:6, defense:6 }, threeRate:0.48 },
    { id:"SF_SLASHER", name:"Slasher Atletico", icon:"⚡", desc:"Atletismo, attacco al ferro", bumps:{ athleticism:9, finishing:5 }, threeRate:0.20 },
    { id:"SF_PLAYMAKER", name:"Playmaker Ibrido", icon:"🧠", desc:"Point-forward, crea per i compagni", bumps:{ playmaking:8, shooting:3 }, threeRate:0.30 },
    { id:"SF_DEFENDER", name:"Ala Difensiva", icon:"🧱", desc:"Stopper perimetrale", bumps:{ defense:10, rebounding:3 }, threeRate:0.28 },
    { id:"SF_SCORER", name:"Scorer Versatile", icon:"🔥", desc:"Punteggio da ogni posizione", bumps:{ shooting:5, finishing:5, athleticism:3 }, threeRate:0.34 },
  ],
  PF: [
    { id:"PF_STRETCH", name:"Stretch Four", icon:"🎯", desc:"Ala grande tiratrice", bumps:{ shooting:9, rebounding:3 }, threeRate:0.48 },
    { id:"PF_BRUISER", name:"Bruiser Fisico", icon:"💪", desc:"Fisico dominante, gioco spalle a canestro", bumps:{ finishing:8, rebounding:6 }, threeRate:0.06 },
    { id:"PF_RIM_PROTECTOR", name:"Difensore Intimidatore", icon:"🧱", desc:"Stoppate e protezione area", bumps:{ defense:10, rebounding:4 }, threeRate:0.08 },
    { id:"PF_PLAYMAKER", name:"Playmaking Forward", icon:"🧠", desc:"Point-forward, ottima visione", bumps:{ playmaking:9, shooting:3 }, threeRate:0.26 },
    { id:"PF_ATHLETIC", name:"Atletico Esplosivo", icon:"⚡", desc:"Atletismo puro, schiacciate", bumps:{ athleticism:9, finishing:5 }, threeRate:0.10 },
  ],
  C: [
    { id:"C_DOMINANT", name:"Centro Dominante", icon:"🏔️", desc:"Rimbalzi, fisico, gioco nel pitturato", bumps:{ rebounding:9, finishing:6 }, threeRate:0.03 },
    { id:"C_RIM_PROTECTOR", name:"Rim Protector", icon:"🧱", desc:"Stoppate, difesa dell'area", bumps:{ defense:10, rebounding:5 }, threeRate:0.04 },
    { id:"C_STRETCH", name:"Stretch Five", icon:"🎯", desc:"Centro tiratore, spaziatura", bumps:{ shooting:10, rebounding:3 }, threeRate:0.42 },
    { id:"C_PLAYMAKING", name:"Playmaking Big", icon:"🧠", desc:"Regia dall'area, passaggi smarcanti", bumps:{ playmaking:9, rebounding:4 }, threeRate:0.10 },
    { id:"C_ROLL_MAN", name:"Roll Man Atletico", icon:"⚡", desc:"Pick and roll esplosivo, alley-oop", bumps:{ athleticism:8, finishing:6 }, threeRate:0.05 },
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

const PATHS = [
  { id:"USA_HS", name:"USA High School", icon:"🇺🇸", desc:"Porta a College NCAA Division I e G-League" },
  { id:"EU_YOUTH", name:"Europa Youth Academy", icon:"🇪🇺", desc:"Porta a LBA/Serie A2 (Italia), Liga ACB (Spagna), Betclic Élite (Francia), BSL (Turchia)" },
];

const RANDOM_FIRSTNAMES = ["Marco","Luca","Andrea","Nikola","Luka","Giannis","Pierre","Dimitri","Carlos","Miguel","Jayson","Michael","Kevin","Anthony","DeAndre","Jordan","Tyler","Stefan","Vasilis","Rudy"];
const RANDOM_LASTNAMES = ["Rossi","Bianchi","Ferrari","Doncic","Jokic","Antetokounmpo","Dubois","Petrovic","Garcia","Hernandez","Tatum","Johnson","Williams","Brown","Davis","Smith","Kostic","Papadopoulos","Novak","Gobert"];

/* Ogni squadra: { name, city, colors:[primario, secondario], euro:'EL'|'EC'|null, conference:'Est'|'Ovest'|null }
   euro segna le squadre che partecipano anche a EuroLeague (EL) o EuroCup (EC).
   conference è usata solo in NBA per dividere la classifica in Est/Ovest. */
function T(name, city, c1, c2, euro, conference) { return { name, city, colors: [c1, c2], euro: euro || null, conference: conference || null }; }

const LEAGUES = {
  NBA: {
    name: "NBA", continent: "USA", country: "USA", games: 82,
    avgOverall: 78, strengthRange: [0.45, 0.97], salaryMult: 0.55, salaryFloor: 0.6,
    teams: [
      T("Atlanta Hawks","Atlanta","#E03A3E","#26282A",null,"Est"), T("Boston Celtics","Boston","#007A33","#FFFFFF",null,"Est"),
      T("Brooklyn Nets","Brooklyn","#000000","#FFFFFF",null,"Est"), T("Charlotte Hornets","Charlotte","#1D1160","#00788C",null,"Est"),
      T("Chicago Bulls","Chicago","#CE1141","#000000",null,"Est"), T("Cleveland Cavaliers","Cleveland","#860038","#FDBB30",null,"Est"),
      T("Dallas Mavericks","Dallas","#00538C","#002B5E",null,"Ovest"), T("Denver Nuggets","Denver","#0E2240","#FEC524",null,"Ovest"),
      T("Detroit Pistons","Detroit","#C8102E","#1D42BA",null,"Est"), T("Golden State Warriors","San Francisco","#1D428A","#FFC72C",null,"Ovest"),
      T("Houston Rockets","Houston","#CE1141","#000000",null,"Ovest"), T("Indiana Pacers","Indianapolis","#002D62","#FDBB30",null,"Est"),
      T("LA Clippers","Los Angeles","#C8102E","#1D428A",null,"Ovest"), T("Los Angeles Lakers","Los Angeles","#552583","#FDB927",null,"Ovest"),
      T("Memphis Grizzlies","Memphis","#5D76A9","#12173F",null,"Ovest"), T("Miami Heat","Miami","#98002E","#F9A01B",null,"Est"),
      T("Milwaukee Bucks","Milwaukee","#00471B","#EEE1C6",null,"Est"), T("Minnesota Timberwolves","Minneapolis","#0C2340","#236192",null,"Ovest"),
      T("New Orleans Pelicans","New Orleans","#0C2340","#C8102E",null,"Ovest"), T("New York Knicks","New York","#006BB6","#F58426",null,"Est"),
      T("Oklahoma City Thunder","Oklahoma City","#007AC1","#EF3B24",null,"Ovest"), T("Orlando Magic","Orlando","#0077C0","#C4CED4",null,"Est"),
      T("Philadelphia 76ers","Philadelphia","#006BB6","#ED174C",null,"Est"), T("Phoenix Suns","Phoenix","#1D1160","#E56020",null,"Ovest"),
      T("Portland Trail Blazers","Portland","#E03A3E","#000000",null,"Ovest"), T("Sacramento Kings","Sacramento","#5A2D81","#63727A",null,"Ovest"),
      T("San Antonio Spurs","San Antonio","#C4CED4","#000000",null,"Ovest"), T("Toronto Raptors","Toronto","#CE1141","#000000",null,"Est"),
      T("Utah Jazz","Salt Lake City","#002B5C","#00471B",null,"Ovest"), T("Washington Wizards","Washington D.C.","#002B5C","#E31837",null,"Est"),
    ]
  },
  NCAA: {
    name: "NCAA Division I", continent: "USA", country: "USA",
    avgOverall: 68, strengthRange: [0.35, 0.9], salaryMult: null, salaryFloor: null,
    teams: [
      T("Duke Blue Devils","Durham","#003087","#FFFFFF"), T("Kentucky Wildcats","Lexington","#0033A0","#FFFFFF"),
      T("Kansas Jayhawks","Lawrence","#0051BA","#E8000D"), T("UCLA Bruins","Los Angeles","#2D68C4","#F2A900"),
      T("Gonzaga Bulldogs","Spokane","#041E42","#C8102E"), T("Michigan Wolverines","Ann Arbor","#00274C","#FFCB05"),
      T("Villanova Wildcats","Villanova","#00205B","#13B5EA"), T("Arizona Wildcats","Tucson","#CC0033","#003366"),
      T("North Carolina Tar Heels","Chapel Hill","#7BAFD4","#FFFFFF"), T("Indiana Hoosiers","Bloomington","#990000","#FFFFFF"),
      T("Louisville Cardinals","Louisville","#AD0000","#000000"), T("Syracuse Orange","Syracuse","#F76900","#000E54"),
      T("UConn Huskies","Storrs","#000E2F","#FFFFFF"), T("Michigan State Spartans","East Lansing","#18453B","#FFFFFF"),
      T("Florida Gators","Gainesville","#0021A5","#FA4616"), T("Houston Cougars","Houston","#C8102E","#76232F"),
      T("Purdue Boilermakers","West Lafayette","#CEB888","#000000"), T("Baylor Bears","Waco","#154734","#FFB81C"),
      T("Auburn Tigers","Auburn","#0C2340","#E87722"), T("Tennessee Volunteers","Knoxville","#FF8200","#FFFFFF"),
    ]
  },
  GLEAGUE: {
    name: "G-League", continent: "USA", country: "USA",
    avgOverall: 68, strengthRange: [0.25, 0.6], salaryMult: 0.012, salaryFloor: 0.03,
    teams: [
      T("Rip City Remix","Portland","#E03A3E","#000000"), T("Long Island Nets","Uniondale","#000000","#FFFFFF"),
      T("Motor City Cruise","Detroit","#C8102E","#1D42BA"), T("Delaware Blue Coats","Wilmington","#006BB6","#ED174C"),
      T("Sioux Falls Skyforce","Sioux Falls","#552583","#FDB927"),
    ]
  },
  ITA_LBA: {
    name: "LBA (Serie A1)", continent: "Europa", country: "Italia",
    avgOverall: 75, strengthRange: [0.42, 0.92], salaryMult: 0.10, salaryFloor: 0.05,
    teams: [
      T("Milano BiancoRosso","Milano","#FFFFFF","#D0021B","EL"), T("Bologna BiancoNero","Bologna","#FFFFFF","#000000","EL"),
      T("Tortona BiancoNero","Tortona","#FFFFFF","#000000"), T("Cantù BiancoBlu","Cantù","#FFFFFF","#003DA5"),
      T("Udine BiancoNero","Udine","#FFFFFF","#000000"), T("Trento BiancoNero","Trento","#FFFFFF","#000000","EC"),
      T("Scafati GialloBlu","Scafati","#FFD100","#003DA5"), T("Roma GialloRosso","Roma","#FFD100","#D0021B"),
      T("Roma BiancoBlu","Roma","#FFFFFF","#003DA5"), T("Napoli Azzurro","Napoli","#3EA6E0","#FFFFFF"),
      T("Varese BiancoRosso","Varese","#FFFFFF","#D0021B"), T("Reggio Emilia BiancoRosso","Reggio Emilia","#FFFFFF","#D0021B","EC"),
      T("Trieste BiancoRosso","Trieste","#FFFFFF","#D0021B"), T("Verona GialloBlu","Verona","#FFD100","#003DA5"),
      T("Venezia OroGranata","Venezia","#FFD700","#6D2932","EC"), T("Treviso BiancoCeleste","Treviso","#FFFFFF","#8ED8F8"),
    ]
  },
  ITA_A2: {
    name: "Serie A2", continent: "Europa", country: "Italia", promotesTo: "ITA_LBA",
    avgOverall: 63, strengthRange: [0.15, 0.50], salaryMult: 0.028, salaryFloor: 0.02,
    teams: [
      T("Bologna BiancoBlu","Bologna","#FFFFFF","#003DA5"), T("Brindisi BiancoAzzurro","Brindisi","#FFFFFF","#3EA6E0"),
      T("Caserta BiancoNero","Caserta","#FFFFFF","#000000"), T("Cento BiancoRosso","Cento","#FFFFFF","#D0021B"),
      T("Cividale GialloBlu","Cividale","#FFD100","#003DA5"), T("Cremona OroAmaranto","Cremona","#FFD700","#8B1E3F"),
      T("Forlì BiancoRosso","Forlì","#FFFFFF","#D0021B"), T("Livorno BiancoAmaranto","Livorno","#FFFFFF","#8B1E3F"),
      T("Mestre BiancoRosso","Mestre","#FFFFFF","#D0021B"), T("Milano BiancoBlu","Milano","#FFFFFF","#003DA5"),
      T("Montecatini Terme RossoBlu","Montecatini Terme","#D0021B","#003DA5"), T("Pesaro BiancoRosso","Pesaro","#FFFFFF","#D0021B"),
      T("Pistoia BiancoRosso","Pistoia","#FFFFFF","#D0021B"), T("Rieti AmarantoCeleste","Rieti","#8B1E3F","#8ED8F8"),
      T("Rimini BiancoRosso","Rimini","#FFFFFF","#D0021B"), T("Ruvo di Puglia BiancoAzzurro","Ruvo di Puglia","#FFFFFF","#3EA6E0"),
      T("Torino GialloBlu","Torino","#FFD100","#003DA5"), T("Avellino BiancoVerde","Avellino","#FFFFFF","#046A38"),
      T("Vigevano GialloBlu","Vigevano","#FFD100","#003DA5"), T("Udine BiancoNero","Udine","#FFFFFF","#000000"),
    ]
  },
  ESP_ACB: {
    name: "Liga ACB", continent: "Europa", country: "Spagna",
    avgOverall: 76, strengthRange: [0.45, 0.95], salaryMult: 0.11, salaryFloor: 0.05,
    teams: [
      T("Real Madrid","Madrid","#FFFFFF","#FEBE10","EL"), T("Valencia Basket","Valencia","#F58220","#000000","EC"),
      T("Lenovo Tenerife","Santa Cruz de Tenerife","#003DA5","#FFD100"), T("Unicaja Málaga","Málaga","#046A38","#FFFFFF","EC"),
      T("FC Barcelona","Barcelona","#004D98","#A50044","EL"), T("Joventut Badalona","Badalona","#00A651","#000000"),
      T("Gran Canaria","Las Palmas de Gran Canaria","#FFD100","#003DA5"), T("Baskonia","Vitoria-Gasteiz","#00A651","#000000","EL"),
      T("UCAM Murcia","Murcia","#D0021B","#000000"), T("Baxi Manresa","Manresa","#D0021B","#000000"),
      T("MoraBanc Andorra","Andorra la Vella","#FFD100","#003DA5"), T("Casademont Zaragoza","Zaragoza","#D0021B","#FFFFFF"),
      T("Breogán","Lugo","#046A38","#FFFFFF"), T("Girona","Girona","#D0021B","#000000"),
      T("Hiopos Lleida","Lleida","#003DA5","#D0021B"), T("Bilbao Basket","Bilbao","#D0021B","#000000"),
      T("San Pablo Burgos","Burgos","#D0021B","#000000"), T("Real Betis Baloncesto","Sevilla","#046A38","#FFFFFF"),
    ]
  },
  FRA_ELITE: {
    name: "Betclic Élite", continent: "Europa", country: "Francia",
    avgOverall: 74, strengthRange: [0.4, 0.88], salaryMult: 0.095, salaryFloor: 0.05,
    teams: [
      T("Nanterre 92","Nanterre","#003DA5","#D0021B"), T("Paris Basketball","Paris","#000000","#D0021B","EC"),
      T("Saint-Quentin BB","Saint-Quentin","#003DA5","#FFFFFF"), T("SIG Strasbourg","Strasbourg","#003DA5","#000000","EC"),
      T("SLUC Nancy","Nancy","#D0021B","#FFFFFF"), T("AS Monaco","Monaco","#D0021B","#FFFFFF","EL"),
      T("Le Mans Sarthe Basket","Le Mans","#003DA5","#FFFFFF"), T("Cholet Basket","Cholet","#F58220","#000000"),
      T("JL Bourg","Bourg-en-Bresse","#F58220","#000000"), T("JDA Dijon","Dijon","#D0021B","#FFFFFF"),
      T("LDLC ASVEL","Villeurbanne","#D0021B","#000000","EL"), T("Limoges CSP","Limoges","#046A38","#FFFFFF"),
      T("Élan Chalon","Chalon-sur-Saône","#046A38","#FFFFFF"), T("Chorale Roanne","Roanne","#D0021B","#FFFFFF"),
      T("Fos Provence Basket","Fos-sur-Mer","#003DA5","#FFFFFF"), T("Boulazac Basket Dordogne","Boulazac","#003DA5","#FFD100"),
    ]
  },
  TUR_BSL: {
    name: "Basketbol Süper Ligi", continent: "Europa", country: "Turchia",
    avgOverall: 73, strengthRange: [0.4, 0.85], salaryMult: 0.09, salaryFloor: 0.05,
    teams: [
      T("Anadolu Efes","Istanbul","#002F6C","#FFFFFF","EL"), T("Bahçeşehir Koleji","Istanbul","#003DA5","#FFFFFF","EC"),
      T("Beşiktaş GAIN","Istanbul","#000000","#FFFFFF"), T("Bursaspor","Bursa","#046A38","#FFFFFF"),
      T("Fenerbahçe Beko","Istanbul","#FFD100","#002F6C","EL"), T("Galatasaray MCT","Istanbul","#D0021B","#FFD100","EC"),
      T("Manisa Basket","Manisa","#003DA5","#FFFFFF"), T("Karşıyaka","Izmir","#D0021B","#FFFFFF"),
      T("Mersin MSK","Mersin","#003DA5","#FFFFFF"), T("Büyükçekmece Basketbol","Istanbul","#003DA5","#FFD100"),
      T("Petkim Spor","Izmir","#003DA5","#FFFFFF"), T("Esenler Erokspor","Istanbul","#FFD100","#046A38"),
      T("Tofaş","Bursa","#FFFFFF","#003DA5"), T("Trabzonspor","Trabzon","#7A0019","#003DA5"),
      T("Türk Telekom","Ankara","#003DA5","#FFFFFF"), T("Merkezefendi Belediyesi","Denizli","#D0021B","#000000"),
    ]
  },
};

const EU_TOP_LEAGUES = ["ITA_LBA","ESP_ACB","FRA_ELITE","TUR_BSL"];

function pickTeam(leagueId) { return choice(LEAGUES[leagueId].teams); }

function pickHomeEuroLeague(nationality) {
  const map = { "Italia":"ITA_A2", "Spagna":"ESP_ACB", "Francia":"FRA_ELITE", "Turchia":"TUR_BSL" };
  if (map[nationality]) return map[nationality];
  return choice(EU_TOP_LEAGUES);
}

/* ================================================================
   STATE
   ================================================================ */
let player = null; // main career object

function computeBodyModifiers(role, height, weight) {
  const r = BODY_RANGES[role];
  const hFactor = clamp((height - r.hMin) / (r.hMax - r.hMin), 0, 1) * 2 - 1; // -1..1
  const wFactor = clamp((weight - r.wMin) / (r.wMax - r.wMin), 0, 1) * 2 - 1; // -1..1
  const sizeFactor = (hFactor + wFactor) / 2; // -1 (agile/leggero) .. +1 (fisico/pesante)
  const proportion = 1 - Math.abs(hFactor - wFactor) / 2; // quanto altezza e peso sono coerenti tra loro
  return {
    attrBumps: {
      rebounding: Math.round(sizeFactor * 6),
      defense: Math.round(sizeFactor * 4),
      finishing: Math.round(sizeFactor * 3),
      athleticism: Math.round(-sizeFactor * 5 + (proportion - 0.5) * 4),
      playmaking: Math.round(-sizeFactor * 3),
      shooting: Math.round(-sizeFactor * 2),
    },
    overallBonus: Math.round((proportion - 0.5) * 4),
  };
}

function newPlayerState(opts) {
  const state = basePlayerState(opts);
  state.rival = createRival(state);
  return state;
}

function basePlayerState({ firstName, lastName, nationality, role, archetypeId, height, weight, path, leagueId, team, jerseyNumber, customOverall, customPotential }) {
  const body = computeBodyModifiers(role, height, weight);
  let overall, potential;
  if (customOverall != null && !isNaN(customOverall)) {
    // modalità personalizzata: si parte dai valori scelti liberamente, senza il tetto della generazione casuale
    overall = clamp(customOverall, 40, 99);
    potential = clamp((customPotential != null && !isNaN(customPotential)) ? customPotential : overall, overall, 99);
  } else {
    overall = randInt(58, 65);
    potential = randInt(72, 99);
    overall = clamp(overall + body.overallBonus, 55, 70);
  }
  return {
    firstName, lastName, nationality, role, archetypeId, pathId: path.id,
    height, weight, jerseyNumber,
    age: 16, year: CAREER_START_YEAR,
    overall, potential,
    attrs: generateInitialAttrs(role, archetypeId, overall, body),
    league: leagueId,
    team,
    contract: { yearsRemaining: 0, yearsTotal: 0 },
    retired: false,
    inNBA: false,
    clutch: { made: 0, attempts: 0 }, // ultimi possessi delle gare decisive di playoff giocati e vinti
    tradeRequestYear: null, // anno dell'ultima richiesta di trade (massimo una a stagione)
    draftEligible: false,
    draftDeclared: false, // ci si può dichiarare al draft una sola volta in carriera
    drafted: false,
    draftedYear: null,
    undraftedYears: 0,
    history: [], // per-season records
    trophies: { rings: 0, domesticTitles: 0, euroleague: 0, eurocup: 0, mvp: 0, dpoy: 0, roy: 0, allstar: 0, bestFive: 0, bestYoung: 0, medals: 0, finalsMvp: 0, worldCupTitles: 0, eurobasketTitles: 0 },
    goatScore: 0, // punteggio cumulativo: somma dei punti GOAT guadagnati stagione per stagione
    injuryStatus: null,
    pendingDecision: null, // {type, options}
    yearsPro: 0,
    careerTotals: { seasons: 0, gp: 0, pts:0, reb:0, ast:0, stl:0, blk:0, tov:0 },
    // stato extra-campo influenzato dagli imprevisti estivi
    morale: 70,        // 0-100, incide su rendimento e crescita
    chemistry: 70,     // 0-100, rapporto con spogliatoio e società
    popularity: 25,    // 0-100, visibilità mediatica e valore sponsor
    stamina: 100,      // 0-100, si consuma col minutaggio e con l'età, si ricarica in estate
    fragility: 0,      // 0-100, sale con gli infortuni subiti: aumenta il rischio dei futuri
    wealth: 0,         // patrimonio accumulato (M, valuta della lega in cui ha firmato)
    sponsorIncome: 0,  // entrate annue da sponsor
    // effetti temporanei applicati alla stagione successiva dagli imprevisti
    seasonModifiers: { benched: false, minutesPenalty: 0, forcedTransfer: false },
    offseasonEvents: [], // storico degli imprevisti estivi
    pendingSeason: null, // dati della stagione in corso, in attesa della chiusura dei playoff
    postseason: null,    // tabelloni playoff/europei giocati turno per turno
    pendingOffseasonEvent: null, // imprevisto estivo a rischio in attesa della scelta del giocatore
    pendingFinalizeCtx: null,    // stato della chiusura stagione, sospeso durante la scelta
    pendingOffseasonReveal: null, // esito già calcolato, in attesa di essere rivelato con l'animazione
    pendingNationalComp: null, // torneo con la Nazionale già simulato, mostrato dopo l'Off-Season
    pendingSeasonFocusResult: null, // esito del focus stagionale scelto, in attesa di essere archiviato nel record
  };
}

function getArchetype(role, archetypeId) {
  return ARCHETYPES_BY_ROLE[role].find(a => a.id === archetypeId);
}

function generateInitialAttrs(role, archetypeId, overall, body) {
  // base spread around overall, tuned by ruolo/archetipo/fisico
  const base = () => clamp(overall + randInt(-6, 6), 30, 99);
  let a = { shooting: base(), finishing: base(), playmaking: base(), rebounding: base(), defense: base(), athleticism: base() };
  const bump = (k, v) => a[k] = clamp(a[k] + v, 30, 99);

  const archetype = getArchetype(role, archetypeId);
  if (archetype) {
    Object.entries(archetype.bumps).forEach(([k, v]) => bump(k, v));
  }
  if (body) {
    Object.entries(body.attrBumps).forEach(([k, v]) => bump(k, v));
  }
  return a;
}

/* ================================================================
   UTILS
   ================================================================ */
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min, max, dec=1) { return parseFloat((Math.random() * (max - min) + min).toFixed(dec)); }
function choice(arr) { return arr[randInt(0, arr.length - 1)]; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function weightedChoice(pairs) { // [[item, weight], ...]
  const total = pairs.reduce((s,p)=>s+p[1],0);
  let r = Math.random() * total;
  for (const [item, w] of pairs) { if (r < w) return item; r -= w; }
  return pairs[pairs.length-1][0];
}

function toast(msg) {
  const wrap = document.getElementById("toast-wrap");
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

function el(id) { return document.getElementById(id); }

/* ================================================================
   SCREEN 1 — CREATION LOGIC
   ================================================================ */
let selRole = null, selArchetypeId = null, selPath = null;
let customMode = false; // modalità personalizzata: squadra libera + overall/potenziale a scelta
let pendingCreation = null; // dati raccolti nella creazione, in attesa di squadra/maglia

function renderArchetypeGrid(role) {
  const archGrid = el("grid-archetype");
  const hint = el("archetype-hint");
  if (!role) {
    archGrid.innerHTML = "";
    hint.classList.remove("hidden");
    return;
  }
  hint.classList.add("hidden");
  archGrid.innerHTML = ARCHETYPES_BY_ROLE[role].map(a => `
    <div class="archetype-row" data-arch="${a.id}" role="button" tabindex="0">
      <div class="ar-icon">${a.icon}</div>
      <div>
        <div class="ar-name">${a.name}</div>
        <div class="ar-desc">${a.desc}</div>
      </div>
    </div>`).join("");
  archGrid.querySelectorAll(".archetype-row").forEach(c => c.addEventListener("click", () => {
    selArchetypeId = c.dataset.arch;
    archGrid.querySelectorAll(".archetype-row").forEach(x => x.classList.remove("selected"));
    c.classList.add("selected");
  }));
}

function updateBodySliders(role) {
  const r = BODY_RANGES[role];
  const hInput = el("inp-height"), wInput = el("inp-weight");
  hInput.min = r.hMin; hInput.max = r.hMax; hInput.value = Math.round((r.hMin + r.hMax) / 2);
  wInput.min = r.wMin; wInput.max = r.wMax; wInput.value = Math.round((r.wMin + r.wMax) / 2);
  el("height-value").textContent = `${hInput.value} cm`;
  el("weight-value").textContent = `${wInput.value} kg`;
  el("body-hint").textContent = "Altezza e peso influenzano l'overall iniziale e gli attributi fisici.";
}

function initCreationScreen() {
  const natSel = el("inp-nationality");
  natSel.innerHTML = NATIONALITIES.map(n => `<option value="${n}">${n}</option>`).join("");

  const roleGrid = el("court-positions");
  roleGrid.innerHTML = ROLES.map(r => {
    const pos = ROLE_COURT_POS[r.id];
    return `<g class="court-pos" data-role="${r.id}" role="button" tabindex="0" aria-label="${r.name}" transform="translate(${pos.x},${pos.y})">
      <circle class="court-pos-circle" r="27"></circle>
      <text class="court-pos-label" text-anchor="middle" dy="6">${r.id}</text>
    </g>`;
  }).join("");
  roleGrid.querySelectorAll(".court-pos").forEach(c => c.addEventListener("click", () => {
    selRole = c.dataset.role;
    selArchetypeId = null;
    roleGrid.querySelectorAll(".court-pos").forEach(x => x.classList.remove("selected"));
    c.classList.add("selected");
    renderArchetypeGrid(selRole);
    updateBodySliders(selRole);
  }));

  renderArchetypeGrid(null);

  el("inp-height").addEventListener("input", () => { el("height-value").textContent = `${el("inp-height").value} cm`; });
  el("inp-weight").addEventListener("input", () => { el("weight-value").textContent = `${el("inp-weight").value} kg`; });

  const pathGrid = el("grid-path");
  pathGrid.innerHTML = PATHS.map(p => `
    <div class="choice-card" data-path="${p.id}" role="button" tabindex="0">
      <div class="cc-icon">${p.icon}</div>
      <div class="cc-title">${p.name}</div>
      <div class="cc-desc">${p.desc}</div>
    </div>`).join("");
  pathGrid.querySelectorAll(".choice-card").forEach(c => c.addEventListener("click", () => {
    selPath = PATHS.find(p => p.id === c.dataset.path);
    pathGrid.querySelectorAll(".choice-card").forEach(x => x.classList.remove("selected"));
    c.classList.add("selected");
  }));

  el("btn-random-name").addEventListener("click", () => {
    el("inp-firstname").value = choice(RANDOM_FIRSTNAMES);
    el("inp-lastname").value = choice(RANDOM_LASTNAMES);
  });

  el("inp-custom-mode").addEventListener("change", () => { customMode = el("inp-custom-mode").checked; });
  el("inp-custom-overall").addEventListener("input", () => {
    const ov = parseInt(el("inp-custom-overall").value);
    el("custom-overall-value").textContent = ov;
    const potInput = el("inp-custom-potential");
    potInput.min = ov;
    if (parseInt(potInput.value) < ov) { potInput.value = ov; el("custom-potential-value").textContent = ov; }
  });
  el("inp-custom-potential").addEventListener("input", () => {
    el("custom-potential-value").textContent = el("inp-custom-potential").value;
  });

  el("btn-start-career").addEventListener("click", onStartCareer);
  el("btn-onboarding-back").addEventListener("click", () => {
    el("screen-onboarding").classList.add("hidden");
    el("screen-create").classList.remove("hidden");
  });
  el("btn-confirm-onboarding").addEventListener("click", onConfirmOnboarding);
  el("inp-jersey-custom").addEventListener("input", () => {
    const v = parseInt(el("inp-jersey-custom").value);
    if (!isNaN(v)) {
      pendingCreation.jerseyNumber = clamp(v, 0, 99);
      el("jersey-quick-grid").querySelectorAll(".jersey-pick").forEach(x => x.classList.remove("selected"));
    }
  });
}

function pickThreeTeams(leagueId) {
  const pool = [...LEAGUES[leagueId].teams];
  const picks = [];
  for (let i = 0; i < 3 && pool.length; i++) {
    const idx = randInt(0, pool.length - 1);
    picks.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return picks;
}

function onStartCareer() {
  const firstName = el("inp-firstname").value.trim() || choice(RANDOM_FIRSTNAMES);
  const lastName = el("inp-lastname").value.trim() || choice(RANDOM_LASTNAMES);
  const nationality = el("inp-nationality").value;

  if (!selRole) { toast("⚠️ Seleziona un ruolo"); return; }
  if (!selArchetypeId) { toast("⚠️ Seleziona un archetipo"); return; }
  if (!selPath) { toast("⚠️ Seleziona un percorso di partenza"); return; }

  const height = parseInt(el("inp-height").value);
  const weight = parseInt(el("inp-weight").value);
  const leagueId = selPath.id === "USA_HS" ? "NCAA" : pickHomeEuroLeague(nationality);
  const teamOptions = customMode ? [...LEAGUES[leagueId].teams] : pickThreeTeams(leagueId);

  pendingCreation = {
    firstName, lastName, nationality, role: selRole, archetypeId: selArchetypeId,
    height, weight, path: selPath, leagueId, teamOptions,
    selectedTeamIdx: null, jerseyNumber: null,
  };

  el("screen-create").classList.add("hidden");
  el("screen-onboarding").classList.remove("hidden");
  renderOnboardingScreen();
}

function renderOnboardingScreen() {
  el("onboarding-league-label").textContent = `Lega di partenza: ${LEAGUES[pendingCreation.leagueId].name}`;

  const ratingsCard = el("card-custom-ratings");
  ratingsCard.classList.toggle("hidden", !customMode);
  if (customMode) {
    el("inp-custom-overall").value = 60;
    el("custom-overall-value").textContent = 60;
    el("inp-custom-potential").min = 60;
    el("inp-custom-potential").value = 85;
    el("custom-potential-value").textContent = 85;
  }

  const grid = el("grid-team-choice");
  grid.classList.toggle("scrollable", pendingCreation.teamOptions.length > 6);
  grid.innerHTML = pendingCreation.teamOptions.map((t, i) => `
    <div class="option-card team-pick-card" data-idx="${i}" role="button" tabindex="0">
      <div class="tp-dot" style="background:${t.colors[0]};border:2px solid ${t.colors[1]}"></div>
      <div><div class="tp-name">${t.name}</div><div class="tp-city">${t.city}</div></div>
    </div>`).join("");
  grid.querySelectorAll(".option-card").forEach(c => c.addEventListener("click", () => {
    pendingCreation.selectedTeamIdx = parseInt(c.dataset.idx);
    grid.querySelectorAll(".option-card").forEach(x => x.classList.remove("selected-team"));
    c.classList.add("selected-team");
  }));

  const commonNumbers = [0,1,2,3,4,5,6,7,8,9,10,11,13,15,20,21,23,24,30,32,33,34,35,42,50,55,99];
  const jGrid = el("jersey-quick-grid");
  jGrid.innerHTML = commonNumbers.map(n => `<div class="jersey-pick" data-num="${n}" role="button" tabindex="0" aria-label="Numero ${n}">${n}</div>`).join("");
  jGrid.querySelectorAll(".jersey-pick").forEach(c => c.addEventListener("click", () => {
    pendingCreation.jerseyNumber = parseInt(c.dataset.num);
    jGrid.querySelectorAll(".jersey-pick").forEach(x => x.classList.remove("selected"));
    c.classList.add("selected");
    el("inp-jersey-custom").value = c.dataset.num;
  }));
  el("inp-jersey-custom").value = "";
}

function onConfirmOnboarding() {
  if (pendingCreation.selectedTeamIdx === null) { toast("⚠️ Seleziona una squadra"); return; }
  const team = pendingCreation.teamOptions[pendingCreation.selectedTeamIdx];
  const jerseyNumber = pendingCreation.jerseyNumber !== null ? pendingCreation.jerseyNumber : randInt(0, 99);

  const customOverall = customMode ? parseInt(el("inp-custom-overall").value) : null;
  const customPotential = customMode ? parseInt(el("inp-custom-potential").value) : null;

  resetTeamStrengths();
  player = newPlayerState({
    firstName: pendingCreation.firstName, lastName: pendingCreation.lastName, nationality: pendingCreation.nationality,
    role: pendingCreation.role, archetypeId: pendingCreation.archetypeId,
    height: pendingCreation.height, weight: pendingCreation.weight,
    path: pendingCreation.path, leagueId: pendingCreation.leagueId, team, jerseyNumber,
    customOverall, customPotential,
  });

  el("screen-onboarding").classList.add("hidden");
  el("screen-game").classList.remove("hidden");
  switchGameTab("carriera");
  renderGameScreen();
}

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
  }
  tier = clamp(tier, 0, MINUTES_TIERS.length - 1);
  const t = MINUTES_TIERS[tier];
  return { label: t.label, mpg: randFloat(t.min, t.max) };
}

/* Quota di tentativi da tre e frequenza di tiri liberi di base per ruolo (i lunghi vivono
   più vicino a canestro, le guardie tirano più da fuori e vengono falliate meno spesso) */
const ROLE_SHOT_PROFILE = {
  PG: { ftRate: 0.20 }, SG: { ftRate: 0.22 }, SF: { ftRate: 0.24 }, PF: { ftRate: 0.30 }, C: { ftRate: 0.34 },
};

/* Punti medi segnati a partita dalle squadre in ciascuna lega (dato reale di riferimento):
   la NBA — il ritmo più alto — è il contesto base; le altre leghe, più lente, producono meno
   volume statistico a parità di qualità del giocatore, come accade davvero nel basket reale.
   Pesa il VOLUME (punti, rimbalzi, assist, palle rubate/perse, stoppate, tentativi) — il
   coefficiente di difficoltà qui sotto pesa invece l'EFFICIENZA. */
const LEAGUE_AVG_TEAM_PPG = {
  NBA: 115, GLEAGUE: 100, ESP_ACB: 83.4, TUR_BSL: 85,
  ITA_LBA: 80, FRA_ELITE: 79, ITA_A2: 77, NCAA: 73,
};
function leaguePaceFactor(leagueId) {
  const ppg = LEAGUE_AVG_TEAM_PPG[leagueId];
  return ppg ? ppg / LEAGUE_AVG_TEAM_PPG.NBA : 0.75;
}

/* Coefficiente di difficoltà (0-10) di ciascuna competizione, in base al livello reale della
   concorrenza — distinto dal ritmo: qui si pesa l'EFFICIENZA di tiro (difese più dure = percentuali
   più basse a parità di abilità) e il "peso" di ciò che si vince nel punteggio GOAT. Include anche
   EuroLeague ed EuroCup, usate nel bonus GOAT delle coppe europee anche se non sono leghe a sé. */
const LEAGUE_DIFFICULTY = {
  NBA: 10, EUROLEAGUE: 9.5, ESP_ACB: 8.5, TUR_BSL: 8.0, EUROCUP: 8.2,
  FRA_ELITE: 7.8, ITA_LBA: 7.5, GLEAGUE: 6.5, ITA_A2: 6.0, NCAA: 5.5,
};
function leagueDifficulty(leagueId) {
  return LEAGUE_DIFFICULTY[leagueId] != null ? LEAGUE_DIFFICULTY[leagueId] : 7;
}
/* Le difese sono più dure quanto più la lega è competitiva: le percentuali di tiro (non i
   liberi, mai contestati) calano leggermente nelle competizioni più dure e salgono in quelle
   più abbordabili, prendendo la NBA (difficoltà 10) come riferimento neutro. */
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
function simulateStatline(p, minutesInfo, leagueId) {
  const { attrs, role, overall } = p;
  const mins = minutesInfo.mpg;
  const usage = mins / 36;
  // la stamina residua condiziona il rendimento: si arriva alla stagione più o meno freschi
  // a seconda di quanto si è giocato (e invecchiato) negli anni precedenti
  const staminaFactor = clamp(0.82 + (p.stamina / 100) * 0.22, 0.82, 1.04);
  // il ritmo/pace reale della lega pesa il volume di tutte le statistiche (non le percentuali)
  const pace = leaguePaceFactor(leagueId);

  const roleFactors = {
    PG: { pts:0.85, reb:0.5, ast:1.6, stl:1.2, blk:0.3 },
    SG: { pts:1.1, reb:0.55, ast:0.9, stl:1.0, blk:0.3 },
    SF: { pts:1.0, reb:0.8, ast:0.8, stl:1.0, blk:0.5 },
    PF: { pts:0.95, reb:1.2, ast:0.6, stl:0.7, blk:0.8 },
    C:  { pts:0.9, reb:1.5, ast:0.4, stl:0.5, blk:1.3 },
  }[role];
  const shotProfile = ROLE_SHOT_PROFILE[role];

  const archetype = getArchetype(role, p.archetypeId);
  // la propensione al tiro da 3 dipende dall'archetipo, leggermente affinata dalla mano da tiro
  const threeRate = clamp((archetype && archetype.threeRate != null ? archetype.threeRate : 0.3) + (attrs.shooting - 70) / 400, 0.03, 0.68);

  const skillAvg = (attrs.shooting + attrs.finishing) / 2;
  const ovrFactor = overall / 80;

  const basePts = (skillAvg / 10) * roleFactors.pts * ovrFactor * usage * 3.1 * pace;
  const baseReb = (attrs.rebounding / 10) * roleFactors.reb * ovrFactor * usage * 1.6 * pace;
  const baseAst = (attrs.playmaking / 10) * roleFactors.ast * ovrFactor * usage * 1.5 * pace;
  const baseStl = (attrs.defense / 10) * roleFactors.stl * ovrFactor * usage * 0.55 * pace;
  const baseBlk = (attrs.defense / 10) * roleFactors.blk * ovrFactor * usage * 0.5 * pace;

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
    pts: round1(clamp((sum.pts / n) * staminaFactor, 0.5, 46)),
    reb: round1(clamp((sum.reb / n) * staminaFactor, 0.3, 18)),
    ast: round1(clamp((sum.ast / n) * staminaFactor, 0.2, 13)),
    stl: round1(clamp((sum.stl / n) * staminaFactor, 0.1, 3.5)),
    blk: round1(clamp((sum.blk / n) * staminaFactor, 0, 4)),
    tov: round1(clamp(sum.tov / n, 0.3, 6)),
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
  const ageFactor = p.age >= 30 ? 1 + (p.age - 29) * 0.12 : 1;
  return clamp(Math.round((mpg / 36) * 22 * ageFactor), 6, 42);
}
function round1(n){ return Math.round(n*10)/10; }

/* pct = quanto la squadra è forte rispetto alla propria fascia di lega (0..1), a prescindere
   dal fatto che sia NBA o Serie A2: ogni campionato ha così la stessa "aria" competitiva interna. */
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
  return clamp(0.22 + (overall - 60) * 0.009 + (pct - 0.5) * 0.3 + randFloat(-0.06,0.06), 0.08, 0.88);
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
   (82 in NBA, 34 altrove), con un win% legato alla propria forza persistente (getTeamStrength).
   La NBA viene divisa in Conference Est/Ovest, come nella realtà; le altre leghe restano un
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

/* Riga del giocatore e classifica di riferimento (la propria conference in NBA, l'intera lega altrove) */
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
  const { impact, defense } = seasonImpact(stats, leagueId);
  const isStarter = season.minutesLabel === "Titolare" || season.minutesLabel === "Franchigia";
  // i premi principali richiedono di aver giocato almeno il 65% delle partite, come in NBA
  const eligible = (season.gpShare == null ? 1 : season.gpShare) >= 0.65;

  // il peso della squadra: un MVP arriva quasi sempre da una squadra di vertice
  const rankShare = season.totalTeams ? season.rank / season.totalTeams : 0.5;
  const teamFactor = rankShare <= 0.12 ? 1.2 : rankShare <= 0.25 ? 1 : teamResult.madePlayoffs ? 0.65 : 0.25;

  const mvp = eligible && isStarter && rollChance(rampChance(impact, 72, 95, 55) * teamFactor);
  if (mvp) awards.push(`MVP ${leagueName}`);

  if (eligible && isStarter && p.attrs.defense >= 85 && rollChance(rampChance(defense + (p.attrs.defense - 85) * 0.4, 13, 21, 35))) awards.push("Difensore dell'Anno");

  const bestFive = mvp || (eligible && isStarter && rollChance(rampChance(impact, 58, 82, 80)));

  // All-Star Game: il college non lo prevede; la popolarità (voto dei tifosi) può spostare l'ago
  if (leagueId !== "NCAA" && (bestFive || eligible)) {
    const fanVote = (p.popularity - 50) * 0.3;
    const allStarChance = bestFive ? 95 : rampChance(impact, 46, 68, 90) + (impact >= 40 ? fanVote : 0);
    if (rollChance(allStarChance)) awards.push(`All-Star ${leagueName}`);
  }
  if (bestFive) awards.push(`Miglior Quintetto ${leagueName}`);

  if (p.age <= 22 && rollChance(rampChance(impact, 38, 60, 70))) awards.push(`Miglior Giovane ${leagueName}`);

  // Rookie dell'Anno: prima stagione in NBA
  const nbaSeasonsBefore = p.history.filter(h => h.league === "NBA").length;
  if (leagueId === "NBA" && nbaSeasonsBefore === 0 && rollChance(rampChance(impact, 32, 55, 85))) awards.push("Rookie dell'Anno");

  if (teamResult.champion && rollChance(rampChance(impact, 48, 78, 85))) awards.push("Finals MVP");
  return awards;
}

/* Punteggio GOAT della singola stagione: combina produzione statistica (pesata per il coefficiente
   di difficoltà della lega), successo di squadra, titoli individuali, titoli di club e torneo con
   la Nazionale. Si somma di anno in anno al punteggio GOAT cumulativo di carriera (player.goatScore). */
function computeSeasonGoatScore(record) {
  const weight = leagueGoatWeight(record.league);
  const statScore = record.pts * 0.75 + record.reb * 0.55 + record.ast * 0.85 + record.stl * 1.6 + record.blk * 1.5 - (record.tov || 0) * 0.9;
  const gpShare = record.games ? record.gp / record.games : 1;
  let score = statScore * weight * (0.4 + 0.6 * gpShare);

  const games = record.wins + record.losses;
  const winPct = games ? record.wins / games : 0.5;
  score += (winPct - 0.5) * 24;
  if (record.champion) score += 40 * weight;

  if (record.continental && record.continental.champion) {
    const contKey = record.continental.competition === "EuroLeague" ? "EUROLEAGUE" : "EUROCUP";
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

/* ================================================================
   IMPREVISTI & PROBABILITÀ DI FINE STAGIONE (offseason)
   Alla fine di ogni stagione, prima delle scelte di mercato e della
   progressione annuale, viene estratto e applicato 1 evento estivo.
   Gli eventi con esito incerto tirano un dado virtuale internamente
   e mostrano direttamente il risultato finale.
   ================================================================ */
function rollChance(pct) { return Math.random() * 100 < pct; }
function fmtMoney(v, currency) { return `${round1(v)} M${currency || "€"}`; }
function playerCurrency(p) { return (p.contract && p.contract.currency) || "€"; }

/* Mutatori che applicano l'effetto e registrano la conseguenza leggibile */
function chOverall(p, delta, out) {
  p.overall = clamp(p.overall + delta, 40, 99);
  progressAttributes(p, delta);
  out.consequences.push(`Overall ${delta >= 0 ? "+" : ""}${delta} → ${p.overall}`);
}
function chAttr(p, key, delta, out, label) {
  p.attrs[key] = clamp(p.attrs[key] + delta, 30, 99);
  out.consequences.push(`${label} ${delta >= 0 ? "+" : ""}${delta} → ${p.attrs[key]}`);
}
function chMeter(p, key, delta, out, label) {
  p[key] = clamp(p[key] + delta, 0, 100);
  out.consequences.push(`${label} ${delta >= 0 ? "+" : ""}${delta} → ${p[key]}`);
}
function chWealth(p, delta, out) {
  p.wealth = Math.max(0, round1(p.wealth + delta));
  const cur = playerCurrency(p);
  out.consequences.push(`Patrimonio ${delta >= 0 ? "+" : "−"}${fmtMoney(Math.abs(delta), cur)} → ${fmtMoney(p.wealth, cur)}`);
}
function chSponsor(p, delta, out) {
  p.sponsorIncome = Math.max(0, round1(p.sponsorIncome + delta));
  const cur = playerCurrency(p);
  out.consequences.push(`Sponsor ${delta >= 0 ? "+" : "−"}${fmtMoney(Math.abs(delta), cur)}/anno → ${fmtMoney(p.sponsorIncome, cur)}/anno`);
}
function benchNextSeason(p, out, reason) {
  p.seasonModifiers.benched = true;
  out.consequences.push(reason || "Prossima stagione al via dalla panchina");
}
function forceTransfer(p, out) {
  p.seasonModifiers.forcedTransfer = true;
  out.consequences.push("Inserito nella lista trasferimenti: nessun rinnovo possibile col club attuale");
}

const OFFSEASON_EVENTS = [
  /* ---------------- FISICO & PREPARAZIONE ---------------- */
  {
    category: "Fisico & Preparazione", title: "Workout intensivo e dieta estrema", weight: 12,
    chance: 60, goodLabel: "Trasformazione fisica", badLabel: "Affaticamento cronico",
    preview: "Estate chiusa in palestra con un preparatore atletico privato e una dieta durissima, per presentarsi al training camp trasformato.",
    run(p, out) {
      out.narrative = "Estate chiuso in palestra con un preparatore atletico privato e una dieta durissima, per presentarsi al training camp trasformato.";
      const ok = rollChance(60);
      out.rollText = `Preparazione estrema — 60% riuscita · esito: ${ok ? "SUCCESSO" : "FALLIMENTO"}`;
      if (ok) { out.tone = "positive"; chOverall(p, 3, out); chAttr(p, "athleticism", 2, out, "Atletismo"); chMeter(p, "morale", 5, out, "Morale"); }
      else { out.tone = "negative"; chOverall(p, -2, out); out.consequences.push("Affaticamento cronico: carichi ridotti in preseason"); chMeter(p, "morale", -5, out, "Morale"); }
    }
  },
  {
    category: "Fisico & Preparazione", title: "Intervento chirurgico e riabilitazione", weight: 8,
    when: p => p.age >= 27 || p.overall < 68,
    chance: 50, goodLabel: "Rinascita fisica", badLabel: "Complicazioni",
    preview: "Lo staff medico consiglia un intervento per risolvere un fastidio che si trascina da mesi.",
    run(p, out) {
      out.narrative = "Lo staff medico consiglia un intervento per risolvere un fastidio che si trascina da mesi. Il giocatore accetta di operarsi a inizio estate.";
      const ok = rollChance(50);
      out.rollText = `Esito operazione — 50% rinascita fisica · esito: ${ok ? "RIUSCITA PIENA" : "COMPLICAZIONI"}`;
      if (ok) { out.tone = "positive"; chOverall(p, 2, out); chAttr(p, "athleticism", 3, out, "Atletismo"); }
      else { out.tone = "negative"; chOverall(p, -4, out); benchNextSeason(p, out, "Stop prolungato: rientro a stagione iniziata, dalla panchina"); chMeter(p, "morale", -8, out, "Morale"); }
    }
  },
  {
    category: "Fisico & Preparazione", title: "Incidente domestico bizzarro", weight: 8,
    run(p, out) {
      const mishap = choice([
        "Scivola nella doccia di casa e rimedia una brutta distorsione al polso.",
        "Cade dal monopattino elettrico durante una vacanza e si procura una contusione seria.",
        "Si infortuna giocando a calcetto con gli amici del quartiere.",
        "Un incidente in cucina gli costa dei punti di sutura e due settimane di stop.",
      ]);
      out.narrative = mishap + " La società non la prende benissimo.";
      out.tone = "negative";
      out.rollText = null;
      chOverall(p, -2, out);
      benchNextSeason(p, out, "Salta il training camp: si parte dalla panchina");
    }
  },
  {
    category: "Fisico & Preparazione", title: "Lavoro tecnico mirato", weight: 10,
    chance: 70, goodLabel: "Salto di qualità", badLabel: "Progressi minimi",
    preview: "Estate dedicata a colmare una lacuna tecnica con sessioni quotidiane su un fondamentale a scelta.",
    run(p, out) {
      const focusMap = { shooting: "Tiro", finishing: "Finalizzazione", playmaking: "Playmaking", rebounding: "Rimbalzi", defense: "Difesa", athleticism: "Atletismo" };
      const key = choice(Object.keys(focusMap));
      out.narrative = `Estate dedicata a colmare una lacuna tecnica: sessioni quotidiane con l'assistant coach sul fondamentale "${focusMap[key]}".`;
      const ok = rollChance(70);
      out.rollText = `Lavoro tecnico — 70% riuscita · esito: ${ok ? "SUCCESSO" : "PROGRESSI MINIMI"}`;
      if (ok) { out.tone = "positive"; chAttr(p, key, randInt(4, 7), out, focusMap[key]); chOverall(p, 1, out); }
      else { out.tone = "neutral"; chAttr(p, key, 1, out, focusMap[key]); out.consequences.push("Nessun salto di qualità evidente"); }
    }
  },

  /* ---------------- SPOGLIATOIO & SOCIETÀ ---------------- */
  {
    category: "Spogliatoio & Società", title: "Lite con l'allenatore", weight: 9,
    chance: 55, goodLabel: "Tregua armata", badLabel: "Rottura definitiva",
    preview: "Un confronto acceso col capo allenatore sul proprio utilizzo rischia di degenerare e finire sui giornali.",
    run(p, out) {
      out.narrative = "Un confronto acceso col capo allenatore sul proprio utilizzo degenera e finisce sui giornali.";
      out.tone = "negative";
      chMeter(p, "chemistry", -15, out, "Chimica di squadra");
      chMeter(p, "morale", -8, out, "Morale");
      const severe = rollChance(45);
      out.rollText = `Reazione della società — 45% rottura definitiva · esito: ${severe ? "ROTTURA" : "TREGUA ARMATA"}`;
      if (severe) forceTransfer(p, out);
      else benchNextSeason(p, out, "Minutaggio tagliato: si parte dalla panchina");
    }
  },
  {
    category: "Spogliatoio & Società", title: "Scontro con la stella della squadra", weight: 8,
    when: p => p.overall < 90,
    chance: 60, goodLabel: "Caso rientrato", badLabel: "Cessione forzata",
    preview: "Attrito con il leader tecnico dello spogliatoio dopo un allenamento finito male.",
    run(p, out) {
      out.narrative = "Attrito con il leader tecnico dello spogliatoio: i due non si parlano più dopo un allenamento finito male.";
      out.tone = "negative";
      chMeter(p, "chemistry", -18, out, "Chimica di squadra");
      const trade = rollChance(40);
      out.rollText = `Gestione del caso — 40% cessione forzata · esito: ${trade ? "CESSIONE FORZATA" : "CASO RIENTRATO"}`;
      if (trade) forceTransfer(p, out);
      else { chMeter(p, "morale", -6, out, "Morale"); out.consequences.push("Clima teso: chimica di squadra compromessa per la prossima stagione"); }
    }
  },
  {
    category: "Spogliatoio & Società", title: "Nuovo allenatore e nuove gerarchie", weight: 11,
    chance: 50, goodLabel: "Gerarchie favorevoli", badLabel: "Fuori dai piani",
    preview: "La società cambia guida tecnica: il nuovo staff riscriverà le gerarchie del roster durante l'estate.",
    run(p, out) {
      out.narrative = "La società cambia guida tecnica: il nuovo staff riscrive le gerarchie del roster durante l'estate.";
      const favorable = rollChance(50);
      out.rollText = `Nuove gerarchie — 50% valutazione favorevole · esito: ${favorable ? "FAVOREVOLE" : "SFAVOREVOLE"}`;
      if (favorable) {
        out.tone = "positive";
        chMeter(p, "chemistry", 10, out, "Chimica di squadra");
        chMeter(p, "morale", 8, out, "Morale");
        p.seasonModifiers.minutesPenalty = -1; // bonus: sale di una fascia di rotazione
        out.consequences.push("Promosso nelle rotazioni: più spazio nella prossima stagione");
      } else {
        out.tone = "negative";
        chMeter(p, "morale", -6, out, "Morale");
        benchNextSeason(p, out, "Fuori dai piani del nuovo staff: si parte dalla panchina");
      }
    }
  },

  /* ---------------- EXTRA-CAMPO, FINANZE & MEDIA ---------------- */
  {
    category: "Extra-campo & Media", title: "Mentorship con una leggenda", weight: 9,
    run(p, out) {
      const legend = choice(["un ex MVP ritirato", "una leggenda della propria franchigia", "un Hall of Famer europeo", "un ex campione olimpico"]);
      out.narrative = `Un'estate di allenamenti privati con ${legend}: lavoro maniacale su letture di gioco e dettagli tecnici.`;
      out.tone = "positive";
      out.rollText = null;
      chOverall(p, randInt(3, 4), out);
      chAttr(p, "playmaking", 3, out, "Playmaking");
      chMeter(p, "morale", 10, out, "Morale");
    }
  },
  {
    category: "Extra-campo & Media", title: "Notte brava e scandalo mediatico", weight: 9,
    run(p, out) {
      out.narrative = "Immagini di una serata finita male diventano virali: la lega apre un fascicolo e la società interviene con una multa.";
      out.tone = "negative";
      out.rollText = null;
      const fine = round1(Math.max(0.1, ((p.contract && p.contract.salaryPerYear) || 1) * 0.15));
      chWealth(p, -fine, out);
      chOverall(p, -1, out);
      chMeter(p, "morale", -10, out, "Morale");
      chMeter(p, "popularity", 6, out, "Popolarità");
      chSponsor(p, -Math.min(p.sponsorIncome, 0.3), out);
    }
  },
  {
    category: "Extra-campo & Media", title: "Investimento finanziario sbagliato", weight: 8,
    when: p => p.wealth > 0.5,
    chance: 30, goodLabel: "Rimborso parziale", badLabel: "Perdita totale",
    preview: "Un consulente poco raccomandabile propone un affare troppo bello per essere vero.",
    run(p, out) {
      out.narrative = "Un consulente poco raccomandabile convince il giocatore a investire in un affare troppo bello per essere vero.";
      const saved = rollChance(30);
      out.rollText = `Recupero fondi — 30% rimborso parziale · esito: ${saved ? "RIMBORSO PARZIALE" : "PERDITA TOTALE"}`;
      out.tone = "negative";
      const lossPct = saved ? 0.25 : 0.6;
      chWealth(p, -round1(p.wealth * lossPct), out);
      chMeter(p, "morale", saved ? -5 : -12, out, "Morale");
    }
  },
  {
    category: "Extra-campo & Media", title: "Relazione VIP e boom social", weight: 9,
    chance: 60, goodLabel: "Concentrazione intatta", badLabel: "Distrazione in campo",
    preview: "Una relazione con un personaggio famoso finisce su tutte le copertine: follower e sponsor in arrivo, ma occhio alla testa.",
    run(p, out) {
      out.narrative = "Una relazione con un personaggio famoso finisce su tutte le copertine: i follower esplodono e arrivano nuovi sponsor.";
      out.tone = "positive";
      chMeter(p, "popularity", randInt(12, 20), out, "Popolarità");
      chSponsor(p, round1(randFloat(0.2, 0.8, 2)), out);
      const distracted = rollChance(40);
      out.rollText = `Impatto sul campo — 40% rischio distrazione · esito: ${distracted ? "DISTRAZIONE" : "CONCENTRAZIONE INTATTA"}`;
      if (distracted) { chOverall(p, -1, out); out.consequences.push("Focus in campo calato per l'eccessiva esposizione"); }
      else chMeter(p, "morale", 6, out, "Morale");
    }
  },
  {
    category: "Extra-campo & Media", title: "Grande contratto di sponsorizzazione", weight: 8,
    when: p => p.overall >= 72,
    run(p, out) {
      const brand = choice(["un colosso dell'abbigliamento sportivo", "un brand di scarpe da basket", "una multinazionale di bevande energetiche", "una casa automobilistica"]);
      out.narrative = `Le prestazioni della scorsa stagione attirano ${brand}, che mette sul tavolo un accordo pluriennale.`;
      out.tone = "positive";
      out.rollText = null;
      chSponsor(p, round1(randFloat(0.3, 1.2, 2)), out);
      chMeter(p, "popularity", randInt(8, 15), out, "Popolarità");
    }
  },
  {
    category: "Extra-campo & Media", title: "Impegno con la Nazionale", weight: 10,
    // niente convocazione "generica" negli anni di Mondiale/Europei: in quelle estati il
    // torneo vero e proprio (vedi simulateNationalTournament) sostituisce questo evento
    when: p => p.age >= 18 && p.overall >= 70 && !isWorldCupYear(p.year) && !isEurobasketYear(p.year),
    chance: p => clamp((p.overall - 60) * 1.5, 10, 55), goodLabel: "Medaglia conquistata", badLabel: "Eliminazione",
    preview: p => `Convocazione con la Nazionale ${p.nationality} per il torneo estivo: settimane di grande basket internazionale al posto delle vacanze.`,
    run(p, out) {
      out.narrative = `Convocazione con la Nazionale ${p.nationality} per il torneo estivo: settimane di grande basket internazionale al posto delle vacanze.`;
      const medal = rollChance(clamp((p.overall - 60) * 1.5, 10, 55));
      out.rollText = `Cammino della Nazionale — esito: ${medal ? "MEDAGLIA CONQUISTATA 🥇" : "ELIMINAZIONE"}`;
      if (medal) {
        out.tone = "positive";
        p.trophies.medals++;
        out.consequences.push("Medaglia con la Nazionale aggiunta al palmarès");
        chMeter(p, "popularity", 10, out, "Popolarità");
        chOverall(p, 1, out);
      } else {
        out.tone = "neutral";
        out.consequences.push("Nessuna medaglia, ma esperienza internazionale accumulata");
        chMeter(p, "morale", -3, out, "Morale");
      }
      out.consequences.push("Estate senza riposo: carico di lavoro elevato");
    }
  },
];

/* Riequilibrio annuale dei valori extra-campo: senza nuovi imprevisti morale e chimica
   tendono a normalizzarsi, mentre la popolarità si consuma se non alimentata dai risultati. */
function driftOffCourtMeters(p, teamResult, performanceScore) {
  // la chimica si ricuce col tempo, più in fretta se la squadra vince
  const winPct = teamResult.wins / Math.max(1, teamResult.wins + teamResult.losses);
  p.chemistry = clamp(p.chemistry + randInt(4, 8) + (winPct > 0.55 ? 4 : 0), 0, 100);
  // il morale segue i risultati e tende verso il valore di equilibrio (60)
  const moralePull = Math.round((60 - p.morale) * 0.25);
  p.morale = clamp(p.morale + moralePull + (winPct > 0.55 ? 4 : -2) + Math.round(performanceScore * 6), 0, 100);
  // la popolarità decade se non sostenuta da rendimento e vittorie
  p.popularity = clamp(p.popularity - randInt(3, 7) + Math.round(performanceScore * 8) + (teamResult.champion ? 10 : 0), 0, 100);
  // gli sponsor seguono la popolarità: contratti che scadono se il giocatore esce dai radar
  if (p.popularity < 25 && p.sponsorIncome > 0) p.sponsorIncome = round1(Math.max(0, p.sponsorIncome - 0.15));
  // la stamina si ricarica in estate, ma sempre meno efficacemente con l'avanzare dell'età:
  // un corpo più vecchio non recupera più come a 20 anni
  const recoveryCap = p.age >= 30 ? 88 - (p.age - 29) * 2 : 100;
  p.stamina = clamp(Math.min(p.stamina + randInt(24, 38), recoveryCap), 30, 100);
  // la fragilità accumulata dagli infortuni si attenua leggermente se ci si riposa bene
  p.fragility = clamp(p.fragility - randInt(1, 3), 0, 100);
}

/* Estrae (senza risolverlo) l'imprevisto della prossima estate, se ce n'è uno */
function pickOffseasonEvent(p) {
  // non ogni estate porta un imprevisto: la maggior parte delle stagioni è tranquilla
  if (!rollChance(38)) return null;
  const pool = OFFSEASON_EVENTS.filter(e => !e.when || e.when(p));
  return weightedChoice(pool.map(e => [e, e.weight || 1]));
}
function offseasonEventChance(ev, p) { return typeof ev.chance === "function" ? ev.chance(p) : ev.chance; }
function offseasonEventPreview(ev, p) { return typeof ev.preview === "function" ? ev.preview(p) : ev.preview; }

/* Risolve un imprevisto senza scelta a rischio (effetto sempre applicato) */
function resolveDeterministicEvent(ev, p) {
  const out = { category: ev.category, title: ev.title, narrative: "", rollText: null, consequences: [], tone: "neutral" };
  ev.run(p, out);
  p.offseasonEvents.push({ age: p.age, title: out.title, tone: out.tone });
  return out;
}
/* Il giocatore ha scelto di rischiare: si tira il dado interno all'evento */
function takeOffseasonRisk(ev, p) {
  const out = { category: ev.category, title: ev.title, narrative: "", rollText: null, consequences: [], tone: "neutral" };
  ev.run(p, out);
  p.offseasonEvents.push({ age: p.age, title: out.title, tone: out.tone });
  return out;
}
/* Il giocatore ha scelto di non rischiare: nessun effetto, nessuna sorpresa */
function declineOffseasonRisk(ev, p) {
  const out = {
    category: ev.category, title: ev.title, tone: "neutral", rollText: null,
    narrative: `Il giocatore preferisce non rischiare: "${ev.title}" viene evitato con cautela.`,
    consequences: ["Nessun rischio corso: nessun effetto su overall, attributi o economia."],
  };
  p.offseasonEvents.push({ age: p.age, title: out.title, tone: out.tone });
  return out;
}

/* Curva d'invecchiamento per ruolo: le guardie maturano più a lungo e calano più lentamente
   (i fondamentali tecnici invecchiano bene), i lunghi raggiungono il picco fisico prima e
   iniziano il declino prima e più bruscamente — coerente con l'evoluzione reale delle carriere. */
const AGE_CURVE_BY_ROLE = {
  PG: { growthEnd: 28, primeEnd: 32, declineBase: 2.0 },
  SG: { growthEnd: 28, primeEnd: 31, declineBase: 2.2 },
  SF: { growthEnd: 27, primeEnd: 30, declineBase: 2.6 },
  PF: { growthEnd: 26, primeEnd: 29, declineBase: 3.0 },
  C:  { growthEnd: 26, primeEnd: 28, declineBase: 3.4 },
};

function progressOverall(p, performanceScore) {
  // performanceScore: 0..1 roughly how well the player did relative to potential
  // il morale (inciso dagli imprevisti estivi) accelera o frena la crescita: 0.75x .. 1.25x
  // la stamina scarsa in stagione si porta dietro un affaticamento che frena la crescita
  const moraleFactor = 0.75 + (p.morale / 100) * 0.5;
  const staminaFactor = 0.8 + (p.stamina / 100) * 0.2;
  const curve = AGE_CURVE_BY_ROLE[p.role] || AGE_CURVE_BY_ROLE.SF;
  let delta = 0;
  if (p.age <= curve.growthEnd) {
    const room = p.potential - p.overall;
    const base = randInt(1, 4); // margine di crescita massimo ridotto: la scalata al vertice è più lenta
    delta = room > 0 ? Math.round(base * clamp(room / 20, 0.2, 1) * (0.55 + performanceScore*0.75) * moraleFactor * staminaFactor) : randInt(0,1);
    // rischio di "bust": prestazioni scarse in età di sviluppo bruciano parte del potenziale per sempre
    if (performanceScore < 0.3 && p.age >= 20 && rollChance(10)) {
      const lost = randInt(2, 5);
      p.potential = clamp(p.potential - lost, p.overall, 99);
    }
  } else if (p.age <= curve.primeEnd) {
    delta = randInt(-2, 1); // plateau vicino al proprio picco, ancora competitivo
  } else {
    // il declino peggiora ulteriormente più si va avanti oltre il proprio picco di ruolo
    const yearsPastPrime = p.age - curve.primeEnd;
    const worsening = Math.floor(yearsPastPrime / 2);
    const lo = Math.round(curve.declineBase) + worsening;
    const hi = lo + 3;
    delta = -randInt(lo, hi);
  }
  p.overall = clamp(p.overall + delta, 40, 99);
  progressAttributes(p, delta);
  return delta;
}

/* Fa crescere/declinare i singoli attributi in modo coerente con la variazione di overall:
   in crescita ogni attributo migliora proporzionalmente; in declino gli attributi fisici
   (atletismo, rimbalzi, difesa) calano più velocemente di quelli tecnici (tiro, playmaking),
   con un'accentuazione ulteriore per i ruoli sotto canestro (i lunghi perdono esplosività ed
   elevazione prima e più bruscamente delle guardie, che mantengono i fondamentali più a lungo). */
const PHYSICAL_DECAY_BY_ROLE = {
  PG: { athleticism: 1.3, rebounding: 1.0, defense: 1.0, finishing: 0.9, shooting: 0.6, playmaking: 0.5 },
  SG: { athleticism: 1.4, rebounding: 1.0, defense: 1.0, finishing: 0.9, shooting: 0.6, playmaking: 0.6 },
  SF: { athleticism: 1.5, rebounding: 1.2, defense: 1.1, finishing: 1.0, shooting: 0.7, playmaking: 0.7 },
  PF: { athleticism: 1.7, rebounding: 1.3, defense: 1.1, finishing: 1.0, shooting: 0.7, playmaking: 0.8 },
  C:  { athleticism: 1.8, rebounding: 1.4, defense: 1.2, finishing: 1.0, shooting: 0.6, playmaking: 0.8 },
};
function progressAttributes(p, ovrDelta) {
  const keys = Object.keys(p.attrs);
  if (ovrDelta > 0) {
    keys.forEach(k => {
      const bump = Math.round(ovrDelta * randFloat(0.6, 1.3));
      p.attrs[k] = clamp(p.attrs[k] + bump, 30, 99);
    });
  } else if (ovrDelta < 0) {
    const physical = PHYSICAL_DECAY_BY_ROLE[p.role] || PHYSICAL_DECAY_BY_ROLE.SF;
    keys.forEach(k => {
      const drop = Math.round(Math.abs(ovrDelta) * physical[k] * randFloat(0.7, 1.3));
      p.attrs[k] = clamp(p.attrs[k] - drop, 30, 99);
    });
  }
}

/* ================================================================
   MARKET / DRAFT LOGIC
   ================================================================ */
function checkDraftEligibility(p) {
  return p.age >= 19 && p.age <= 23 && !p.drafted && !p.inNBA && !p.draftDeclared && p.overall >= 74;
}

function simulateDraft(p) {
  const roll = p.overall + randInt(-7, 5);
  let result, team;
  if (roll >= 93) { result = "Top 5 assoluto! 🎉"; team = pickTeam("NBA"); }
  else if (roll >= 84) { result = "Primo Giro"; team = pickTeam("NBA"); }
  else if (roll >= 77) { result = "Secondo Giro"; team = pickTeam("NBA"); }
  else { result = "Undrafted"; team = null; }

  if (team) {
    p.drafted = true;
    p.draftedYear = p.age;
    p.inNBA = true;
    p.league = "NBA";
    p.team = team;
  } else {
    p.undraftedYears++;
  }
  return { result, team };
}

/* ================================================================
   SISTEMA ECONOMICO — proposte contrattuali delle squadre
   ================================================================ */
function currencyForLeague(leagueId) {
  if (leagueId === "NCAA") return null; // borsa di studio, nessun ingaggio
  if (leagueId === "NBA" || leagueId === "GLEAGUE") return "$";
  return "€";
}

function computeSalary(leagueId, overall, teamStrength) {
  const mult = LEAGUES[leagueId].salaryMult;
  if (mult == null) return null; // es. NCAA: nessun ingaggio, solo borsa di studio
  const base = clamp(overall - 55, 0, 45);
  return round1(Math.max(base * mult * (0.7 + teamStrength * 0.6), LEAGUES[leagueId].salaryFloor));
}

function proposeContractYears(age, overall) {
  if (age <= 19) return randInt(1, 2);
  if (overall >= 85) return randInt(3, 4);
  if (overall >= 75) return randInt(2, 4);
  if (age >= 32) return 1;
  return randInt(1, 3);
}

/* Il "valore" di una squadra (teamStrength, 0..1) è competitivo all'interno della propria lega,
   ma le fasce (strengthRange) variano da lega a lega: una big di Serie A2 non regge il confronto
   assoluto con una big di LBA, pur potendo essere la favorita nel proprio campionato. */
function titleChanceInfo(ts, leagueId) {
  const range = (LEAGUES[leagueId] && LEAGUES[leagueId].strengthRange) || [0.3, 0.95];
  const pct = clamp((ts - range[0]) / (range[1] - range[0]), 0, 1);
  if (pct >= 0.75) return { label: "Favorita al titolo", stars: "⭐⭐⭐⭐" };
  if (pct >= 0.5) return { label: "Contender", stars: "⭐⭐⭐" };
  if (pct >= 0.25) return { label: "Squadra da playoff", stars: "⭐⭐" };
  return { label: "Outsider / ricostruzione", stars: "⭐" };
}

/* ================================================================
   FORZA DELLE SQUADRE — persistente per nome squadra, coerente con la fascia della lega.
   Usata per generare proposte contrattuali, calcolare l'esito delle stagioni e gestire
   promozioni/retrocessioni (Serie A2 <-> LBA).
   ================================================================ */
const teamStrengthRegistry = {};

function getTeamStrength(team, leagueId) {
  const range = LEAGUES[leagueId].strengthRange;
  if (!(team.name in teamStrengthRegistry)) {
    teamStrengthRegistry[team.name] = randFloat(range[0], range[1], 2);
  } else {
    // sempre dentro la fascia della lega in cui la squadra gioca adesso
    teamStrengthRegistry[team.name] = clamp(teamStrengthRegistry[team.name], range[0], range[1]);
  }
  return teamStrengthRegistry[team.name];
}

/* Leggera variazione stagionale della forza di tutte le squadre già conosciute: applicata una
   sola volta a inizio stagione, così il valore resta stabile per tutte le letture dello stesso
   anno (simulazione, classifica, offerte) invece di cambiare a ogni chiamata. */
function driftTeamStrengths() {
  Object.keys(teamStrengthRegistry).forEach(name => {
    teamStrengthRegistry[name] = Math.round((teamStrengthRegistry[name] + randFloat(-0.04, 0.04, 2)) * 100) / 100;
  });
}
function resetTeamStrengths() {
  Object.keys(teamStrengthRegistry).forEach(name => { delete teamStrengthRegistry[name]; });
}

function promoteTeam(team, fromLeague, toLeague) {
  const current = getTeamStrength(team, fromLeague);
  const range = LEAGUES[toLeague].strengthRange;
  const recalculated = Math.round(current * randFloat(0.86, 0.95, 3) * 100) / 100;
  teamStrengthRegistry[team.name] = clamp(recalculated, range[0], range[1]);
}

function relegateTeam(team, fromLeague, toLeague) {
  const current = getTeamStrength(team, fromLeague);
  const range = LEAGUES[toLeague].strengthRange;
  const recalculated = Math.round(current * randFloat(1.05, 1.15, 3) * 100) / 100;
  teamStrengthRegistry[team.name] = clamp(recalculated, range[0], range[1]);
}

function generateContractProposal(leagueId, p, team) {
  const teamStrength = getTeamStrength(team, leagueId);
  const years = proposeContractYears(p.age, p.overall);
  const salary = computeSalary(leagueId, p.overall, teamStrength);
  const currency = currencyForLeague(leagueId);
  return { years, salary, teamStrength, currency };
}

function contractSummaryHtml(cp, leagueId) {
  const t = titleChanceInfo(cp.teamStrength, leagueId);
  const salaryText = cp.salary == null ? "Borsa di studio (nessun ingaggio)" : `${cp.salary} M${cp.currency}/anno`;
  return `${cp.years} ${cp.years===1?"anno":"anni"} · ${salaryText} · ${t.stars} ${t.label}`;
}

function teamOverallFromStrength(ts) {
  return clamp(Math.round(60 + ts * 39), 60, 99);
}

function offerLineText(o) {
  const cp = o.contractProposal;
  const salaryText = cp.salary == null ? "Borsa di studio" : `${cp.salary} M${cp.currency}`;
  const teamOvr = teamOverallFromStrength(cp.teamStrength);
  return `${o.team.name} (${cp.years} ${cp.years===1?'anno':'anni'} - ${salaryText}) - OVR Squadra ${teamOvr} (${LEAGUES[o.targetLeague].name})`;
}

function pickFillerLeague(p) {
  return p.inNBA ? "NBA" : p.league;
}

const LEAGUE_FLAG = { NBA:"🇺🇸", NCAA:"🇺🇸", GLEAGUE:"🇺🇸", ITA_LBA:"🇮🇹", ITA_A2:"🇮🇹", ESP_ACB:"🇪🇸", FRA_ELITE:"🇫🇷", TUR_BSL:"🇹🇷" };

/* Leghe/nazioni tra cui il giocatore può scegliere per valutare offerte a fine stagione.
   Un percorso High School -> College (NCAA) può scegliere di trasferirsi in Europa. */
function leagueSelectorOptions(p) {
  const euro = ["ITA_LBA", "ITA_A2", "ESP_ACB", "FRA_ELITE", "TUR_BSL"];
  if (p.inNBA) return ["NBA", ...euro];
  if (p.league === "NCAA") return ["NCAA", "GLEAGUE", ...euro];
  if (p.league === "GLEAGUE") return ["GLEAGUE", ...euro];
  return euro;
}

/* Occasioni contrattuali speciali legate al contesto narrativo del giocatore (draft, bridge NBA/Europa, promozioni) */
function buildSpecialOffers(p) {
  const specialOffers = [];

  if (!p.inNBA && p.age <= 23 && p.overall >= 76) {
    const team = pickTeam("NBA");
    specialOffers.push({
      id: "sign_nba_fa",
      title: `🇺🇸 ${team.name}`,
      desc: `Un club NBA ti offre un contratto.`,
      team, targetLeague: "NBA",
      contractProposal: generateContractProposal("NBA", p, team)
    });
  }

  if (p.inNBA && (determineMinutesRole(p.overall, LEAGUES["NBA"].avgOverall).label === "Panchina" || p.overall < 74)) {
    const targetLeague = choice(EU_TOP_LEAGUES);
    const team = pickTeam(targetLeague);
    specialOffers.push({
      id: "return_europe",
      title: `🇪🇺 ${team.name}`,
      desc: `${LEAGUES[targetLeague].name} ti offre un ruolo da titolare.`,
      team, targetLeague,
      contractProposal: generateContractProposal(targetLeague, p, team)
    });
  }

  if (p.league === "ITA_A2" && p.overall >= 74 && p.age >= 18) {
    const team = pickTeam("ITA_LBA");
    specialOffers.push({
      id: "promo_lba",
      title: `📈 ${team.name}`,
      desc: `Salto di qualità nel massimo campionato italiano.`,
      team, targetLeague: "ITA_LBA",
      contractProposal: generateContractProposal("ITA_LBA", p, team)
    });
  }

  return specialOffers;
}

/* Genera fino a 3 offerte esterne per la lega scelta: prima eventuali occasioni speciali già
   valide in quella lega, poi si completa con squadre rivali estratte dalla lega stessa. */
function buildExternalOffersForLeague(p, leagueId, specialOffers) {
  const usedNames = new Set([p.team.name]);
  const externalOffers = [];

  specialOffers.forEach(o => {
    if (externalOffers.length < 3 && !usedNames.has(o.team.name)) {
      externalOffers.push(o);
      usedNames.add(o.team.name);
    }
  });

  let guard = 0;
  while (externalOffers.length < 3 && guard < 25) {
    guard++;
    const team = pickTeam(leagueId);
    if (usedNames.has(team.name)) continue;
    usedNames.add(team.name);
    externalOffers.push({
      id: "rival_" + externalOffers.length + "_" + leagueId,
      title: `🤝 ${team.name}`,
      desc: `${team.name} (${team.city}) ti offre un posto in squadra per la prossima stagione.`,
      team, targetLeague: leagueId,
      contractProposal: generateContractProposal(leagueId, p, team)
    });
  }
  return externalOffers;
}

/* Applica il trasferimento previsto da un'offerta firmata. È guidata solo dai dati dell'offerta
   (squadra e lega di destinazione) e non da closure, così le offerte in sospeso restano valide
   anche dopo un salvataggio/caricamento della carriera. Il rinnovo lascia tutto com'è. */
function applyOffer(p, offer) {
  if (offer.id === "renew") return;
  p.league = offer.targetLeague;
  p.inNBA = offer.targetLeague === "NBA";
  p.team = offer.team;
}

function buildRenewOffer(p) {
  return {
    id: "renew",
    title: `✍️ ${p.team.name} (Rinnovo)`,
    desc: `Resta a ${p.team.name} (${p.team.city}) per un'altra stagione.`,
    team: p.team, targetLeague: p.league,
    contractProposal: generateContractProposal(p.league, p, p.team)
  };
}

/* Costruisce la decisione di mercato completa: occasioni speciali + selettore di lega + rinnovo.
   Se un imprevisto estivo ha portato a una rottura col club, il rinnovo non è disponibile. */
function createMarketDecision(p, record) {
  const specialOffers = buildSpecialOffers(p);
  const forced = p.seasonModifiers && p.seasonModifiers.forcedTransfer;
  const renewOffer = forced ? null : buildRenewOffer(p);
  const selectedLeague = pickFillerLeague(p);
  const externals = buildExternalOffersForLeague(p, selectedLeague, specialOffers);
  const offers = renewOffer ? externals.concat([renewOffer]) : externals;
  return { type: "market", specialOffers, renewOffer, selectedLeague, offers, record, forcedTransfer: !!forced };
}

/* ================================================================
   SEASON ADVANCE — CORE FLOW
   ================================================================ */
/* ================================================================
   POSTSEASON — bracket giocati turno per turno
   ================================================================ */
const DOMESTIC_ROUNDS = [
  { name: "Quarti di Finale", bestOf: 5 },
  { name: "Semifinale",       bestOf: 7 },
  { name: "Finale",           bestOf: 7 },
];
/* La NBA gioca un turno in più: i primi tre si disputano dentro la propria conference,
   le Finali NBA mettono di fronte le due squadre che hanno vinto la propria conference. */
const NBA_ROUNDS = [
  { name: "Primo Turno",             bestOf: 7 },
  { name: "Semifinale di Conference", bestOf: 7 },
  { name: "Finale di Conference",     bestOf: 7 },
  { name: "Finali NBA",               bestOf: 7 },
];
const CONTINENTAL_ROUNDS = [
  { name: "Playoff",     bestOf: 5 },
  { name: "Final Four",  bestOf: 1 },
  { name: "Finale",      bestOf: 1 },
];

function buildBracket(kind, competition, leagueId, teamStrength, seed, conference) {
  const rounds = kind !== "domestic" ? CONTINENTAL_ROUNDS : (leagueId === "NBA" ? NBA_ROUNDS : DOMESTIC_ROUNDS);
  return {
    kind, competition, leagueId, teamStrength, seed, conference,
    rounds, idx: 0, results: [], done: false, champion: false, eliminatedAt: null,
  };
}

/* Gioca le gare di una serie; con stopAtDecisive si ferma prima della gara decisiva
   (serie in parità a una vittoria dalla fine, oppure gara secca) senza giocarla */
function playSeriesGames(winProbPerGame, bestOf, stopAtDecisive) {
  const need = Math.ceil(bestOf / 2);
  let us = 0, them = 0;
  while (us < need && them < need) {
    if (stopAtDecisive && us === need - 1 && them === need - 1) return { us, them, decisive: true };
    if (Math.random() < winProbPerGame) us++; else them++;
  }
  return { us, them, decisive: false, won: us === need };
}

/* Momenti clutch: ultimo possesso della gara decisiva, sotto di un punto. Ogni opzione dipende
   da un attributo diverso; il morale conta un po', la forza della squadra è già nel win% di gara. */
const CLUTCH_OPTIONS = [
  { id: "iso", icon: "🎯", label: "Tiro io", desc: "Isolamento e tiro dalla media: tutto sulle tue mani.", attr: p => p.attrs.shooting },
  { id: "drive", icon: "⚡", label: "Attacco il ferro", desc: "Penetrazione e contatto: canestro o tiri liberi.", attr: p => (p.attrs.finishing + p.attrs.athleticism) / 2 },
  { id: "pass", icon: "🤝", label: "Scarico al compagno", desc: "Attiri il raddoppio e trovi l'uomo libero.", attr: p => p.attrs.playmaking },
];
function clutchChance(p, winProb, option) {
  return clamp(winProb + (option.attr(p) - 75) * 0.007 + (p.morale - 60) * 0.002, 0.2, 0.85);
}
function bestClutchOption(p, winProb) {
  return CLUTCH_OPTIONS.reduce((best, o) => (clutchChance(p, winProb, o) > clutchChance(p, winProb, best) ? o : best));
}

/* Squadre tra cui pescare l'avversario del turno corrente: in NBA i primi tre turni restano
   dentro la propria conference, le Finali NBA affrontano l'altra conference; nelle altre
   leghe l'avversario arriva semplicemente dal resto del campionato. */
function opponentPool(bracket, p) {
  const leagueId = bracket.leagueId;
  if (leagueId === "NBA" && bracket.kind === "domestic") {
    const isFinals = bracket.idx === bracket.rounds.length - 1;
    const wantConference = isFinals ? (bracket.conference === "Est" ? "Ovest" : "Est") : bracket.conference;
    const pool = LEAGUES.NBA.teams.filter(t => t.conference === wantConference && t.name !== p.team.name);
    if (pool.length) return pool;
  }
  return LEAGUES[leagueId].teams.filter(t => t.name !== p.team.name);
}

/* Gioca il turno corrente del bracket attivo: estrae l'avversario, calcola la probabilità
   partita per partita e gioca la serie. Con interactive, se la serie arriva alla gara decisiva
   si ferma sull'ultimo possesso (bracket.pendingClutch) e restituisce null: la scelta del
   giocatore la chiude con resolveClutch. */
function playPostseasonRound(bracket, p, interactive) {
  const round = bracket.rounds[bracket.idx];
  const leagueId = bracket.leagueId;

  // avversario: nei turni finali si affrontano squadre progressivamente più forti
  const opponent = choice(opponentPool(bracket, p));
  const oppStrength = getTeamStrength(opponent, leagueId);

  const ourPct = teamStrengthPercentile(bracket.teamStrength, leagueId);
  const oppPct = teamStrengthPercentile(oppStrength, leagueId) + bracket.idx * 0.08; // avversari via via più duri
  const starFactor = clamp((p.overall - LEAGUES[leagueId].avgOverall) / 40, -0.15, 0.2);
  // freschezza: chi arriva ai playoff con la stamina alta rende di più, chi è spremuto cala
  const freshness = (p.stamina - 55) * 0.0025;
  const winProb = clamp(0.5 + (ourPct - oppPct) * 0.55 + starFactor + freshness, 0.18, 0.86);

  const series = playSeriesGames(winProb, round.bestOf, !!interactive);
  if (series.decisive) {
    bracket.pendingClutch = { round: round.name, bestOf: round.bestOf, opponent, us: series.us, them: series.them, winProb };
    return null;
  }
  return completeRound(bracket, { round: round.name, bestOf: round.bestOf, opponent, us: series.us, them: series.them, won: series.won });
}

/* Archivia il risultato della serie e fa avanzare (o chiude) il tabellone */
function completeRound(bracket, entry) {
  bracket.results.push(entry);
  if (!entry.won) {
    bracket.done = true;
    bracket.eliminatedAt = entry.round;
  } else if (bracket.idx === bracket.rounds.length - 1) {
    bracket.done = true;
    bracket.champion = true;
  } else {
    bracket.idx++;
  }
  return entry;
}

/* Ultimo possesso della gara decisiva: l'opzione scelta decide gara e serie */
function playClutch(bracket, optionId) {
  const pc = bracket.pendingClutch;
  const option = CLUTCH_OPTIONS.find(o => o.id === optionId) || bestClutchOption(player, pc.winProb);
  const success = rollChance(clutchChance(player, pc.winProb, option) * 100);
  const isFinal = bracket.idx === bracket.rounds.length - 1;
  player.clutch = player.clutch || { made: 0, attempts: 0 };
  player.clutch.attempts++;
  if (success) {
    player.clutch.made++;
    player.popularity = clamp(player.popularity + (isFinal ? 8 : 4), 0, 100);
    player.morale = clamp(player.morale + 5, 0, 100);
  } else {
    player.morale = clamp(player.morale - 4, 0, 100);
  }
  bracket.pendingClutch = null;
  return completeRound(bracket, {
    round: pc.round, bestOf: pc.bestOf, opponent: pc.opponent,
    us: pc.us + (success ? 1 : 0), them: pc.them + (success ? 0 : 1), won: success,
    clutch: { option: option.id, label: option.label, success },
  });
}

function currentBracket() {
  const ps = player.postseason;
  if (!ps) return null;
  return ps.brackets[ps.idx] || null;
}

/* Avanza di un turno: se il bracket corrente si chiude, passa al successivo;
   quando tutti i tabelloni sono conclusi la stagione viene finalizzata. */
/* Animazione coppa: coriandoli generati a runtime + trofeo SVG animato via CSS */
let popupQueue = [];
let popupActive = false;
/* Accoda un popup (titolo/premio); se un altro è già a schermo, parte quando viene chiuso */
function queuePopup(titles, mode) {
  if (!titles || !titles.length) return;
  popupQueue.push({ titles, mode: mode || "champion" });
  if (!popupActive) advancePopupQueue();
}
function advancePopupQueue() {
  if (!popupQueue.length) { popupActive = false; return; }
  popupActive = true;
  const next = popupQueue.shift();
  showTrophyAnimation(next.titles, next.mode);
}
function showTrophyAnimation(titles, mode) {
  mode = mode || "champion";
  const isAward = mode === "award";
  const isSeason = mode === "season";
  const confetti = el("trophy-confetti");
  const colors = isAward
    ? ["#a06bff", "#3d8bfd", "#ffd447", "#35c47a"]
    : ["#ffd447", "#ff7a1a", "#3d8bfd", "#35c47a", "#a06bff", "#ef4b56"];
  confetti.innerHTML = isSeason ? "" : Array.from({ length: isAward ? 34 : 60 }, () => {
    const left = Math.random() * 100;
    const delay = Math.random() * 0.6;
    const duration = 2.2 + Math.random() * 1.6;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const rotate = Math.random() * 360;
    return `<span style="left:${left}%;background:${color};animation-delay:${delay}s;animation-duration:${duration}s;transform:rotate(${rotate}deg)"></span>`;
  }).join("");

  el("trophy-svg").style.display = (isAward || isSeason) ? "none" : "";
  el("award-medal").style.display = isAward ? "block" : "none";
  el("season-banner").style.display = isSeason ? "block" : "none";
  el("trophy-title").textContent = isAward ? "🏅 Premio vinto!" : isSeason ? "🏁 Stagione Conclusa" : "🏆 Campione!";
  el("trophy-subtitle").textContent = titles.join(" · ");
  el("trophy-overlay").classList.remove("hidden");
}
function hideTrophyAnimation() {
  el("trophy-overlay").classList.add("hidden");
  el("trophy-confetti").innerHTML = "";
  advancePopupQueue();
}

function advancePostseasonRound() {
  const ps = player.postseason;
  if (!ps) return;
  const bracket = currentBracket();
  if (!bracket) { finalizeSeason(); return; }
  if (bracket.pendingClutch) return; // prima va giocato l'ultimo possesso

  const entry = playPostseasonRound(bracket, player, true);
  if (!entry) { renderGameScreen(); return; } // gara decisiva: si attende la scelta del giocatore
  afterPostseasonRound(bracket, entry);
}

function resolveClutch(optionId) {
  const bracket = player.postseason && currentBracket();
  if (!bracket || !bracket.pendingClutch) return;
  const entry = playClutch(bracket, optionId);
  toast(entry.won ? `🎯 ${entry.clutch.label}: canestro decisivo! Serie vinta ${entry.us}-${entry.them}.` : `💔 ${entry.clutch.label}: niente da fare, serie persa ${entry.us}-${entry.them}.`);
  afterPostseasonRound(bracket, entry);
}

function afterPostseasonRound(bracket, entry) {
  const ps = player.postseason;
  if (entry.won) {
    toast(`✅ ${bracket.competition} — ${entry.round} vinta ${entry.us}-${entry.them} vs ${entry.opponent.name}`);
  } else {
    toast(`❌ ${bracket.competition} — eliminati ai ${entry.round} (${entry.us}-${entry.them}) da ${entry.opponent.name}`);
  }

  if (bracket.done) {
    if (bracket.champion) queuePopup([`${bracket.competition}: ${player.team.name} è Campione!`], "champion");
    ps.idx++;
    if (ps.idx >= ps.brackets.length) { finalizeSeason(); return; }
  }
  renderGameScreen();
}

/* Salta la simulazione turno per turno e risolve d'un colpo i tabelloni rimanenti; un ultimo
   possesso già in sospeso si gioca con l'opzione più probabile */
function simulateRestOfPostseason() {
  const ps = player.postseason;
  if (!ps) return;
  const wonTitles = [];
  let guard = 0;
  while (ps.idx < ps.brackets.length && guard < 20) {
    guard++;
    const bracket = currentBracket();
    if (!bracket) break;
    if (bracket.pendingClutch) playClutch(bracket, bestClutchOption(player, bracket.pendingClutch.winProb).id);
    else playPostseasonRound(bracket, player, false);
    if (bracket.done) {
      if (bracket.champion) wonTitles.push(`${bracket.competition}: ${player.team.name} è Campione!`);
      ps.idx++;
    }
  }
  finalizeSeason();
  if (wonTitles.length) queuePopup(wonTitles, "champion");
}

function bracketOutcomeLabel(bracket) {
  if (bracket.champion) return "Campione! 🏆";
  if (bracket.eliminatedAt === "Finale" || bracket.eliminatedAt === "Finali NBA") return "Finale persa";
  if (bracket.eliminatedAt) return `Eliminati: ${bracket.eliminatedAt}`;
  return null;
}

/* ================================================================
   SEASON ADVANCE — stagione regolare, poi eventuale postseason interattiva
   ================================================================ */
function advanceSeason() {
  if (player.retired) return;
  if (player.pendingDecision) { toast("⚠️ Devi prima risolvere la decisione in sospeso."); return; }

  player.age++;
  player.year++;
  if (player.league !== "NCAA" || player.age > 18) player.yearsPro++;

  // forced retirement check
  if (player.age >= 40 || (player.age >= 32 && player.overall < 60)) {
    forceRetireFlow();
    return;
  }

  // ogni tanto, prima della simulazione, si può scegliere su cosa concentrare la stagione:
  // la scelta stessa non è mai casuale (la fa il giocatore), ma la sua disponibilità sì
  if (player.age >= 17 && rollChance(28)) {
    player.pendingDecision = { type: "seasonFocus" };
    renderGameScreen();
    return;
  }

  advanceSeasonContinue();
}

/* Applica (se scelto) il focus stagionale — spinta agli attributi coerenti e possibile
   evoluzione dell'archetipo verso lo stile scelto — poi prosegue con la simulazione vera
   e propria della stagione, esattamente come se il focus non fosse mai stato proposto. */
function resolveSeasonFocus(focusId) {
  const opt = SEASON_FOCUS_OPTIONS.find(o => o.id === focusId);
  player.pendingDecision = null;
  if (!opt) { advanceSeasonContinue(); return; }

  const result = { focus: opt, archetypeChanged: false, newArchetypeName: null };
  opt.attrs.forEach(k => { player.attrs[k] = clamp(player.attrs[k] + randInt(1, 3), 30, 99); });

  // possibilità (non garantita) che il lavoro mirato faccia evolvere l'archetipo verso lo stile scelto
  const targetId = (FOCUS_ARCHETYPE_MAP[player.role] || {})[focusId];
  if (targetId && targetId !== player.archetypeId && rollChance(30)) {
    player.archetypeId = targetId;
    result.archetypeChanged = true;
    const arch = getArchetype(player.role, targetId);
    result.newArchetypeName = arch ? arch.name : null;
    toast(`🔄 Il tuo stile di gioco si evolve: ora sei ${result.newArchetypeName}!`);
  }

  player.pendingSeasonFocusResult = result;
  advanceSeasonContinue();
}

/* ================================================================
   STAGIONE REGOLARE A TRATTI — la stagione si gioca in 3 tratti. Prima di ognuno si sceglie
   il carico di lavoro e, a volte, si affronta una situazione con due opzioni. Statistiche,
   stamina, infortuni e vittorie vengono simulati tratto per tratto e poi aggregati: il resto
   della stagione (classifica, playoff, premi) parte dal risultato aggregato.
   ================================================================ */
const SEASON_BLOCKS = [
  { id: "early", name: "Inizio Stagione", icon: "🍂", share: 0.35 },
  { id: "mid", name: "Metà Stagione", icon: "⭐", share: 0.35, note: "Pausa per l'All-Star Game" },
  { id: "late", name: "Volata Finale", icon: "🏁", share: 0.30 },
];

/* Carico di lavoro scelto per un tratto: minuti in campo, consumo di stamina, rischio di
   infortunio, piccolo effetto sul rendimento della squadra (quando si è in campo) e usura
   del fisico (wear: punti di fragilità, che restano anche nelle stagioni successive) */
const WORKLOADS = [
  { id: "push", icon: "🔥", label: "Carico alto", desc: "Più minuti e responsabilità: più statistiche, ma il fisico si usura, la stamina cala e il rischio infortuni sale.", mpg: 3, drain: 1.6, injury: 1.6, win: 0.01, wear: 2 },
  { id: "normal", icon: "⚖️", label: "Carico normale", desc: "Segui le rotazioni del coach, senza strappi.", mpg: 0, drain: 1, injury: 1, win: 0, wear: 0 },
  { id: "rest", icon: "🧊", label: "Carico ridotto", desc: "Meno minuti, ma stamina preservata per i playoff, rischio infortuni più basso e fisico che recupera.", mpg: -3, drain: 0.6, injury: 0.6, win: -0.015, wear: -1 },
];
function getWorkload(id) { return WORKLOADS.find(w => w.id === id) || WORKLOADS[1]; }

/* Situazioni che possono capitare prima di un tratto. Lo stato salva solo id e opzione scelta;
   gli effetti stanno qui (apply), così i salvataggi restano dati puri. apply può modificare i
   parametri del tratto (b) e il giocatore, e restituisce una breve nota per il riepilogo.
   L'ultima opzione di ogni situazione è quella prudente, usata da "Simula il resto". */
const SEASON_SITUATIONS = [
  {
    id: "knee", icon: "🦵", title: "Fastidio al ginocchio",
    desc: "Da qualche giorno il ginocchio fa male dopo ogni allenamento. Lo staff medico lascia a te la scelta.",
    options: [
      { id: "play", label: "Gioca sul dolore", desc: "Non salti partite, ma il rischio di infortunio in questo tratto sale parecchio." },
      { id: "rest", label: "Fermati qualche partita", desc: "Salti circa un quarto delle partite del tratto, ma recuperi energie." },
    ],
    apply(p, optionId, b) {
      if (optionId === "play") { b.injuryMult *= 1.8; p.fragility = clamp(p.fragility + 2, 0, 100); return "Hai stretto i denti giocando sul dolore."; }
      b.missedFrac += 0.25; p.stamina = clamp(p.stamina + 8, 0, 100); return "Ti sei fermato qualche partita per recuperare.";
    },
  },
  {
    id: "slump", icon: "📉", title: "Striscia negativa",
    desc: "La squadra ha perso diverse partite di fila e nello spogliatoio c'è tensione.",
    options: [
      { id: "speak", label: "Parla alla squadra", desc: "Metti la faccia davanti a tutti: può ricompattare il gruppo, o ritorcersi contro." },
      { id: "quiet", label: "Lascia fare al coach", desc: "Nessun rischio: la situazione si risolve da sé, più lentamente." },
    ],
    apply(p, optionId, b) {
      if (optionId === "quiet") return "Hai lasciato che fosse il coach a gestire il momento.";
      if (rollChance(55 + (p.popularity - 50) * 0.3)) {
        p.chemistry = clamp(p.chemistry + 8, 0, 100); p.morale = clamp(p.morale + 5, 0, 100); b.winBonus += 0.05;
        return "Il tuo discorso ha ricompattato lo spogliatoio: la squadra ha reagito.";
      }
      p.chemistry = clamp(p.chemistry - 7, 0, 100); b.winBonus -= 0.02;
      return "Il discorso non è piaciuto a tutti: nello spogliatoio restano attriti.";
    },
  },
  {
    id: "spotlight", icon: "📺", title: "Partite in diretta nazionale",
    desc: "Nelle prossime settimane la tua squadra è sempre in prima serata: tutti gli occhi sono puntati su di te.",
    options: [
      { id: "star", label: "Prenditi la scena", desc: "Più tiri e più punti, qualche pallone perso in più. La popolarità sale." },
      { id: "team", label: "Gioca per la squadra", desc: "Più assist e più chimica con i compagni." },
    ],
    apply(p, optionId, b) {
      if (optionId === "star") { b.statMult.pts *= 1.1; b.statMult.tov *= 1.15; p.popularity = clamp(p.popularity + 6, 0, 100); return "Ti sei preso la scena in prima serata."; }
      b.statMult.ast *= 1.12; p.chemistry = clamp(p.chemistry + 4, 0, 100); return "Hai messo i compagni al centro della scena.";
    },
  },
];
function getSituation(id) { return SEASON_SITUATIONS.find(x => x.id === id) || null; }
function safeSituationOption(situation) { return situation.options[situation.options.length - 1].id; }

/* Rischio d'infortunio (%) per un intero tratto a carico normale: stamina bassa, età e fragilità */
function blockInjuryRisk(p) {
  const seasonRisk = clamp((100 - p.stamina) * 0.35 + Math.max(0, p.age - 30) * 1.5 + p.fragility * 0.3, 2, 55);
  return seasonRisk * 0.36;
}
function injuryRiskLabel(pct) {
  if (pct < 5) return { label: "Basso", tone: "green" };
  if (pct < 11) return { label: "Medio", tone: "gold" };
  return { label: "Alto", tone: "red" };
}

/* Somma i tratti già giocati in una statline stagionale pesata sulle partite giocate */
function aggregateSeasonBlocks(blocks) {
  const gp = blocks.reduce((t, b) => t + b.gp, 0);
  const games = blocks.reduce((t, b) => t + b.games, 0);
  const wins = blocks.reduce((t, b) => t + b.wins, 0);
  const losses = blocks.reduce((t, b) => t + b.losses, 0);
  const avg = k => (gp > 0 ? round1(blocks.reduce((t, b) => t + b.stats[k] * b.gp, 0) / gp) : 0);
  const stats = { gp, games };
  ["mpg", "pts", "reb", "ast", "stl", "blk", "tov", "fga", "fgm", "tpa", "tpm", "fta", "ftm"].forEach(k => { stats[k] = avg(k); });
  stats.fg = round1(stats.fga > 0 ? (stats.fgm / stats.fga) * 100 : 0);
  stats.tp = round1(stats.tpa > 0 ? (stats.tpm / stats.tpa) * 100 : 0);
  stats.ft = round1(stats.fta > 0 ? (stats.ftm / stats.fta) * 100 : 0);
  return { stats, wins, losses, gp, games };
}

/* Prepara la decisione per il prossimo tratto, con una situazione ogni tanto */
function nextSeasonBlockDecision() {
  const s = player.pendingSeason;
  const situation = rollChance(35) ? choice(SEASON_SITUATIONS).id : null;
  return { type: "seasonBlock", blockIdx: s.blocks.length, options: WORKLOADS.map(w => w.id), situation, situationChoice: null };
}

function advanceSeasonContinue() {
  const seasonFocusResult = player.pendingSeasonFocusResult || null;
  player.pendingSeasonFocusResult = null;

  driftTeamStrengths();
  const seasonLeague = player.league;
  const teamStrength = getTeamStrength(player.team, seasonLeague);
  // il minutaggio risente degli imprevisti della scorsa estate (panchina forzata / promozione)
  const minutesInfo = determineMinutesRole(player.overall, LEAGUES[seasonLeague].avgOverall, player.seasonModifiers);

  player.pendingSeason = {
    phase: "blocks", seasonLeague, teamStrength, minutesInfo, games: seasonLength(seasonLeague), blocks: [],
    seasonFocus: seasonFocusResult, team: player.team, age: player.age,
  };
  player.pendingDecision = nextSeasonBlockDecision();
  renderGameScreen();
}

/* La situazione del tratto (se c'è) va risolta prima di scegliere il carico di lavoro */
function chooseSeasonSituation(optionId) {
  const d = player.pendingDecision;
  if (!d || d.type !== "seasonBlock" || !d.situation) return;
  d.situationChoice = optionId;
  renderGameScreen();
}

/* Gioca il prossimo tratto; restituisce true se con questo si è chiusa la stagione regolare */
function playSeasonBlock(workloadId, situationOptionId) {
  const s = player.pendingSeason;
  const d = player.pendingDecision;
  const def = SEASON_BLOCKS[s.blocks.length];
  const workload = getWorkload(workloadId);

  // le partite del tratto: l'ultimo prende il resto, così la somma torna sempre al totale
  const isLast = s.blocks.length === SEASON_BLOCKS.length - 1;
  const played = s.blocks.reduce((t, b) => t + b.games, 0);
  const games = isLast ? s.games - played : Math.round(s.games * def.share);

  const b = { injuryMult: workload.injury, missedFrac: 0, winBonus: workload.win, statMult: { pts: 1, ast: 1, tov: 1 } };
  let situationNote = null;
  const situation = d && d.situation ? getSituation(d.situation) : null;
  if (situation) {
    const optionId = situationOptionId || safeSituationOption(situation);
    const option = situation.options.find(o => o.id === optionId);
    situationNote = { id: situation.id, title: situation.title, icon: situation.icon, optionLabel: option ? option.label : "", text: situation.apply(player, optionId, b) };
  }

  const mpg = clamp(s.minutesInfo.mpg + workload.mpg, 6, 40);
  const stats = simulateStatline(player, { mpg }, s.seasonLeague);
  Object.entries(b.statMult).forEach(([k, m]) => { stats[k] = round1(stats[k] * m); });

  // infortunio nel tratto: si saltano partite, le medie a partita restano quelle reali
  let injury = null;
  if (rollChance(blockInjuryRisk(player) * b.injuryMult)) {
    const frac = randFloat(0.3, 0.9, 2);
    b.missedFrac += frac;
    player.fragility = clamp(player.fragility + randInt(3, 8), 0, 100);
    injury = { missedFrac: frac };
  }
  const missed = clamp(b.missedFrac, 0, 0.95);
  const gp = Math.max(games > 0 ? 1 : 0, Math.round(games * (1 - missed)));

  player.fragility = clamp(player.fragility + workload.wear, 0, 100);
  const drain = staminaDrain(player, mpg) * def.share * workload.drain * (gp / Math.max(1, games)) + (injury ? randInt(5, 15) : 0);
  player.stamina = clamp(Math.round(player.stamina - drain), 0, 100);

  // vittorie: con il giocatore in campo conta il suo overall, senza di lui un sostituto qualunque
  const withPct = clamp(regularSeasonWinPct(player.overall, s.teamStrength, s.seasonLeague) + b.winBonus, 0.05, 0.92);
  const withoutPct = regularSeasonWinPct(60, s.teamStrength, s.seasonLeague);
  const wins = clamp(Math.round(gp * withPct + (games - gp) * withoutPct), 0, games);

  s.blocks.push({ id: def.id, name: def.name, icon: def.icon, games, gp, wins, losses: games - wins, stats, workload: workload.id, injury, situation: situationNote });
  if (injury) toast(`🩹 Infortunio in ${def.name}: salti ${games - gp} partite su ${games}.`);

  if (s.blocks.length < SEASON_BLOCKS.length) {
    player.pendingDecision = nextSeasonBlockDecision();
    return false;
  }
  closeRegularSeason();
  return true;
}

function resolveSeasonBlock(workloadId, situationOptionId) {
  const d = player.pendingDecision;
  if (!d || d.type !== "seasonBlock") return;
  const optionId = situationOptionId || d.situationChoice;
  if (d.situation && !optionId) { toast("⚠️ Prima scegli come affrontare la situazione."); return; }
  if (!playSeasonBlock(workloadId, optionId)) renderGameScreen();
}

/* Chiude i tratti rimanenti con carico normale e l'opzione prudente in ogni situazione */
function simulateRestOfSeason() {
  let guard = 0;
  while (player.pendingDecision && player.pendingDecision.type === "seasonBlock" && guard++ < SEASON_BLOCKS.length) {
    const d = player.pendingDecision;
    const situation = d.situation ? getSituation(d.situation) : null;
    const optionId = d.situationChoice || (situation ? safeSituationOption(situation) : null);
    if (playSeasonBlock("normal", optionId)) return;
  }
  renderGameScreen();
}

/* Fine della stagione regolare: aggregazione dei tratti, classifica e tabelloni della postseason.
   Da qui in poi pendingSeason ha la stessa forma di sempre (stats, regular, standings...). */
function closeRegularSeason() {
  const s = player.pendingSeason;
  const { seasonLeague, teamStrength, minutesInfo, seasonFocus } = s;
  const agg = aggregateSeasonBlocks(s.blocks);
  const stats = agg.stats;
  const gpShare = agg.games ? agg.gp / agg.games : 1;

  const injuryInfo = s.blocks.some(b => b.injury) ? {
    text: `🩹 Stagione condizionata dagli infortuni: ${agg.games - agg.gp} partite saltate su ${agg.games}.`,
    missedPct: round1(1 - gpShare),
  } : null;

  const regular = { wins: agg.wins, losses: agg.losses, winPct: agg.games ? agg.wins / agg.games : 0, playoffResult: null, champion: false };
  // il rendimento conta anche la presenza: saltare metà stagione frena la crescita
  const performanceScore = clamp((stats.pts/25 + stats.ast/8 + stats.reb/10)/2.2, 0, 1) * (0.5 + 0.5 * gpShare);
  const event = generateRandomEvent(player);

  // classifica completa della lega: da qui derivano playoff, seed e zone promozione/retrocessione.
  // In NBA la classifica è divisa in Conference Est/Ovest, come nella realtà.
  const standings = simulateLeagueStandings(seasonLeague, player.team, regular.wins, regular.losses);
  const playerRow = findPlayerStandingsRow(standings);
  const conference = seasonLeague === "NBA" ? player.team.conference : null;
  const confTable = playerConferenceTable(standings, conference);
  const playoffCutoff = Math.min(8, confTable.length);
  regular.conference = conference;
  regular.rank = playerRow.rank;
  regular.totalTeams = confTable.length;
  regular.playoffCutoff = playoffCutoff;
  regular.madePlayoffs = regular.rank <= playoffCutoff;
  regular.relegationZone = seasonLeague === "ITA_LBA" && regular.rank > confTable.length - 2;
  regular.promotionZone = seasonLeague === "ITA_A2" && regular.rank <= playoffCutoff;

  // dati della stagione in corso, congelati fino alla chiusura della postseason
  player.pendingSeason = {
    seasonLeague, teamStrength, minutesInfo: { label: minutesInfo.label, mpg: stats.mpg }, stats, regular, performanceScore, event, standings, injuryInfo,
    seasonFocus, team: s.team, age: s.age, blocks: s.blocks,
  };

  // si costruiscono i tabelloni da giocare: campionato (se qualificati) ed Europa (se iscritti)
  const brackets = [];
  if (regular.madePlayoffs) {
    brackets.push(buildBracket("domestic", LEAGUES[seasonLeague].name, seasonLeague, teamStrength, regular.rank, conference));
  }
  if (player.team.euro && LEAGUES[seasonLeague].continent === "Europa") {
    const comp = player.team.euro === "EL" ? "EuroLeague" : "EuroCup";
    brackets.push(buildBracket("continental", comp, seasonLeague, teamStrength, regular.rank));
  }

  if (brackets.length) {
    player.postseason = { brackets, idx: 0 };
    player.pendingDecision = { type: "postseason" };
    renderGameScreen();
    return;
  }

  player.pendingDecision = null;
  finalizeSeason();
}

/* Chiude la stagione: trofei, imprevisto estivo (interattivo), progressione, storico, mercato.
   Se estrae un imprevisto "a rischio" si ferma qui e attende la scelta del giocatore
   (vedi resolveOffseasonChoice); altrimenti prosegue subito con finalizeSeasonContinue. */
function finalizeSeason() {
  const s = player.pendingSeason;
  if (!s) return;
  const { seasonLeague, minutesInfo, stats, regular, performanceScore, event, standings, injuryInfo, seasonFocus } = s;

  const ps = player.postseason;
  const domestic = ps && ps.brackets.find(b => b.kind === "domestic");
  const continentalBracket = ps && ps.brackets.find(b => b.kind === "continental");

  const teamResult = {
    wins: regular.wins, losses: regular.losses,
    madePlayoffs: regular.madePlayoffs,
    playoffResult: domestic ? bracketOutcomeLabel(domestic) : null,
    champion: !!(domestic && domestic.champion),
  };

  let continental = null;
  if (continentalBracket) {
    continental = {
      competition: continentalBracket.competition,
      result: bracketOutcomeLabel(continentalBracket),
      champion: continentalBracket.champion,
      rounds: continentalBracket.results,
    };
    if (continentalBracket.champion) {
      if (continentalBracket.competition === "EuroLeague") player.trophies.euroleague++;
      else player.trophies.eurocup++;
    }
  }

  // i premi individuali dipendono anche dal cammino della squadra
  const awards = rollAwards(player, stats, teamResult, {
    leagueId: seasonLeague, rank: regular.rank, totalTeams: regular.totalTeams, minutesLabel: minutesInfo.label,
    gpShare: stats.games ? stats.gp / stats.games : 1,
  });

  // incassi della stagione (ingaggio + sponsor) prima degli imprevisti estivi
  const seasonEarnings = round1(((player.contract && player.contract.salaryPerYear) || 0) + player.sponsorIncome);
  player.wealth = round1(player.wealth + seasonEarnings);

  // OFFSEASON: si azzerano gli effetti della scorsa estate, poi si estrae il nuovo imprevisto
  player.seasonModifiers = { benched: false, minutesPenalty: 0, forcedTransfer: false };
  driftOffCourtMeters(player, teamResult, performanceScore);

  const ctx = {
    seasonLeague, minutesInfo, stats, regular, performanceScore, event, standings, teamResult, continental, awards,
    seasonEarnings, playoffRounds: domestic ? domestic.results : null, injuryInfo, seasonFocus,
  };
  const ev = pickOffseasonEvent(player);

  if (ev && ev.chance != null) {
    // imprevisto a rischio: si sospende la chiusura stagione in attesa della scelta del giocatore
    player.pendingOffseasonEvent = ev;
    player.pendingFinalizeCtx = ctx;
    player.pendingDecision = { type: "offseasonChoice", event: ev };
    renderGameScreen();
    return;
  }

  const offseason = ev ? resolveDeterministicEvent(ev, player) : null;
  finalizeSeasonContinue(offseason, ctx);
}

/* Risoluzione della scelta di rischio sull'imprevisto estivo: l'esito viene calcolato subito,
   ma mostrato solo dopo una breve animazione di rivelazione (vedi renderOffseasonRevealPanel) —
   la chiusura vera e propria della stagione riprende solo quando il giocatore preme "Continua". */
function resolveOffseasonChoice(takeRisk) {
  const ev = player.pendingOffseasonEvent;
  const ctx = player.pendingFinalizeCtx;
  if (!ev || !ctx) return;
  const offseason = takeRisk ? takeOffseasonRisk(ev, player) : declineOffseasonRisk(ev, player);
  player.pendingOffseasonEvent = null;
  player.pendingFinalizeCtx = null;
  player.pendingOffseasonReveal = { offseason, ctx, takeRisk };
  player.pendingDecision = { type: "offseasonReveal" };
  renderGameScreen();
}

/* Chiamata dal pulsante "Continua" del reveal: solo qui la stagione viene davvero chiusa */
function confirmOffseasonReveal() {
  const rv = player.pendingOffseasonReveal;
  if (!rv) return;
  player.pendingOffseasonReveal = null;
  player.pendingDecision = null;
  finalizeSeasonContinue(rv.offseason, rv.ctx);
}

function finalizeSeasonContinue(offseason, ctx) {
  const { seasonLeague, minutesInfo, stats, regular, performanceScore, event, standings, teamResult, continental, awards, seasonEarnings, playoffRounds, injuryInfo, seasonFocus } = ctx;

  const rivalNotes = simulateRivalSeason(player.rival, { league: seasonLeague, awards, stats, champion: teamResult.champion });

  // progressione annuale, dopo che l'imprevisto estivo ha già inciso su overall e attributi
  const ovrDelta = progressOverall(player, performanceScore);

  awards.forEach(a => {
    if (a.startsWith("MVP")) player.trophies.mvp++;
    else if (a === "Difensore dell'Anno") player.trophies.dpoy++;
    else if (a.startsWith("All-Star")) player.trophies.allstar++;
    else if (a.startsWith("Miglior Quintetto")) player.trophies.bestFive++;
    else if (a.startsWith("Miglior Giovane")) player.trophies.bestYoung++;
    else if (a === "Rookie dell'Anno") player.trophies.roy++;
    else if (a === "Finals MVP") player.trophies.finalsMvp++;
  });
  if (teamResult.champion) {
    if (player.league === "NBA") player.trophies.rings++;
    else if (LEAGUES[player.league].continent === "Europa") player.trophies.domesticTitles++;
  }

  // Mondiale/Europei: ogni 4 anni ciascuno, sfalsati di 2 anni, mai nella stessa estate
  let nationalComp = null;
  if (nationalTeamEligible(player)) {
    if (isWorldCupYear(player.year)) {
      nationalComp = { kind: "world", name: "Mondiale FIBA", ...simulateNationalTournament(player) };
    } else if (isEurobasketYear(player.year) && EUROPEAN_NATIONALITIES.includes(player.nationality)) {
      nationalComp = { kind: "euro", name: "EuroBasket", ...simulateNationalTournament(player) };
    }
    if (nationalComp) {
      if (nationalComp.champion) {
        player.trophies.medals++;
        if (nationalComp.kind === "world") player.trophies.worldCupTitles++;
        else player.trophies.eurobasketTitles++;
      } else if (nationalComp.medal) {
        player.trophies.medals++;
      }
    }
  }

  const record = {
    age: player.age, year: player.year, team: player.team, league: seasonLeague,
    pts: stats.pts, reb: stats.reb, ast: stats.ast, stl: stats.stl, blk: stats.blk, tov: stats.tov,
    fg: stats.fg, tp: stats.tp, ft: stats.ft, mpg: stats.mpg,
    gp: stats.gp != null ? stats.gp : teamResult.wins + teamResult.losses, games: stats.games != null ? stats.games : teamResult.wins + teamResult.losses,
    fga: stats.fga, fgm: stats.fgm, tpa: stats.tpa, tpm: stats.tpm, fta: stats.fta, ftm: stats.ftm,
    overall: player.overall, ovrDelta,
    wins: teamResult.wins, losses: teamResult.losses,
    playoffResult: teamResult.playoffResult, champion: teamResult.champion,
    playoffRounds,
    continental,
    awards, event, injury: injuryInfo, seasonFocus, roleLabel: minutesInfo.label,
    offseason, seasonEarnings, nationalComp, rivalNotes,
    rank: regular.rank, totalTeams: regular.totalTeams, playoffCutoff: regular.playoffCutoff,
    relegationZone: regular.relegationZone, promotionZone: regular.promotionZone, conference: regular.conference,
    standings,
  };
  // punteggio GOAT della stagione, cumulato nel totale di carriera
  record.goatPoints = computeSeasonGoatScore(record);
  player.goatScore = (player.goatScore || 0) + record.goatPoints;
  player.history.push(record);
  player.careerTotals.seasons++;
  player.careerTotals.gp = (player.careerTotals.gp || 0) + record.gp;
  player.careerTotals.pts += stats.pts;
  player.careerTotals.reb += stats.reb;
  player.careerTotals.ast += stats.ast;
  player.careerTotals.stl += stats.stl;
  player.careerTotals.blk += stats.blk;
  player.careerTotals.tov += stats.tov;

  // promozione/retrocessione Serie A2 <-> LBA, decise dalla classifica reale: la promozione
  // arriva vincendo il titolo di A2, la retrocessione se si chiude tra le ultime due di LBA.
  // Le squadre di EuroLeague/EuroCup, come nella realtà, hanno blasone e bilancio che le
  // mettono quasi al riparo dalla retrocessione anche quando finiscono in fondo alla classifica.
  let relegationChance = 100;
  if (player.team.euro === "EL") relegationChance = 15;
  else if (player.team.euro === "EC") relegationChance = 50;

  if (seasonLeague === "ITA_A2" && teamResult.champion) {
    promoteTeam(player.team, "ITA_A2", "ITA_LBA");
    player.league = "ITA_LBA";
    record.event = { text: `🎉 ${player.team.name} vince la Serie A2 ed è promossa in LBA!`, type: "milestone" };
    toast(`🎉 ${player.team.name} è stata promossa in LBA!`);
  } else if (seasonLeague === "ITA_LBA" && regular.relegationZone && rollChance(relegationChance)) {
    relegateTeam(player.team, "ITA_LBA", "ITA_A2");
    player.league = "ITA_A2";
    record.event = { text: `😔 ${player.team.name} retrocede in Serie A2 dopo aver chiuso ${regular.rank}° su ${regular.totalTeams}.`, type: "injury" };
    toast(`😔 ${player.team.name} è retrocessa in Serie A2.`);
  }

  player.pendingSeason = null;
  player.postseason = null;

  // il torneo con la Nazionale (se giocato quest'estate) non viene rivelato subito: si mostra
  // come schermata dedicata subito dopo l'Off-Season, prima dell'inizio della prossima regular season
  player.pendingNationalComp = nationalComp;

  // scadenza contratto: se ancora attivo, si prosegue comunque con una schermata di stato
  let contractExpired = true;
  if (player.contract && player.contract.yearsRemaining > 0) {
    player.contract.yearsRemaining--;
    contractExpired = player.contract.yearsRemaining <= 0;
  }

  // Off-Season: si mostra sempre, che il contratto sia scaduto o ancora in corso
  if (checkDraftEligibility(player)) {
    player.pendingDecision = { type: "draft", record };
  } else if (contractExpired) {
    player.pendingDecision = createMarketDecision(player, record);
  } else {
    player.pendingDecision = { type: "offseasonStatus", record };
  }

  renderGameScreen();
  // annuncio "fine stagione", per rendere il confine tra una stagione e la successiva
  // sempre ben visibile, prima dell'eventuale reveal dei premi individuali
  const seasonCloseText = `${record.age} anni · ${record.year} · ${record.team.name} — ${record.wins}-${record.losses}${record.champion ? " 🏆" : ""}`;
  queuePopup([seasonCloseText], "season");
  if (awards.length) queuePopup(awards.map(a => `🏅 ${a}`), "award");
}

/* Chiamata al termine dell'Off-Season (contratto firmato, oppure "Continua" se il contratto
   era già in corso): se quest'estate si è giocato un torneo con la Nazionale lo si rivela ora,
   altrimenti si è pronti per la prossima regular season. */
function advanceAfterOffseason() {
  if (player.pendingNationalComp) {
    player.pendingDecision = { type: "nationalReveal", comp: player.pendingNationalComp };
    player.pendingNationalComp = null;
  } else {
    player.pendingDecision = null;
  }
  renderGameScreen();
}
function confirmNationalReveal() {
  player.pendingDecision = null;
  renderGameScreen();
}

function forceRetireFlow() {
  player.retired = true;
  player.pendingDecision = null;
  renderFinalScreen();
}

function resolveDraftDecision(declare) {
  const record = player.pendingDecision.record;
  if (declare) {
    // ci si dichiara al draft una sola volta in carriera: che si venga scelti o meno, non si torna più eleggibili
    player.draftDeclared = true;
    const { result, team } = simulateDraft(player);
    record.draftResult = result;
    if (team) {
      player.history[player.history.length-1].team = team;
      player.history[player.history.length-1].league = "NBA";
      record.event = record.event || { text: `Selezionato al Draft NBA: ${result} da ${team.name}!`, type: "milestone" };
      toast(`🎉 Draft: ${result} — ${team.name}`);
      // scala salariale rookie legata alla posizione al draft
      let rookieYears = 2, salaryBoost = 1;
      if (result.startsWith("Top 5")) { rookieYears = 4; salaryBoost = 1.4; }
      else if (result === "Primo Giro") { rookieYears = 3; salaryBoost = 1.1; }
      else { rookieYears = 2; salaryBoost = 0.7; }
      const cp = generateContractProposal("NBA", player, team);
      cp.years = rookieYears;
      cp.salary = cp.salary == null ? null : round1(cp.salary * salaryBoost);
      const rookieOffer = {
        id: "rookie", title: `🏀 Contratto Rookie — ${team.name}`,
        desc: `${team.name} (${team.city}) ti propone il tuo primo contratto da professionista.`,
        team, targetLeague: "NBA", contractProposal: cp, attempts: { years: 0, salary: 0 },
      };
      player.pendingDecision = { type: "negotiate", offer: rookieOffer, marketDecision: null };
    } else {
      // Undrafted: resta comunque una possibilità concreta di firmare in NBA da free agent.
      // Se la possibilità non si concretizza non si mostra alcuna finestra NBA vuota: si passa
      // direttamente al normale mercato nella lega di provenienza.
      const nbaChance = clamp((player.overall - 60) * 3, 5, 65);
      if (rollChance(nbaChance)) {
        const team = pickTeam("NBA");
        const cp = generateContractProposal("NBA", player, team);
        cp.years = 1;
        cp.salary = cp.salary == null ? null : round1(cp.salary * 0.55);
        const undraftedOffer = {
          id: "undrafted_nba",
          title: `🆓 ${team.name} (Free Agent NBA)`,
          desc: `Non sei stato scelto al Draft, ma ${team.name} ti offre comunque un contratto da free agent per provare a ritagliarti un posto in NBA.`,
          team, targetLeague: "NBA", contractProposal: cp, attempts: { years: 0, salary: 0 },
        };
        toast(`🆓 Undrafted, ma ${team.name} ti offre un contratto NBA da free agent!`);
        player.pendingDecision = { type: "negotiate", offer: undraftedOffer, marketDecision: null };
      } else {
        toast(`Draft: Undrafted. Nessun club NBA si è fatto avanti: continua il tuo percorso.`);
        player.pendingDecision = createMarketDecision(player, record);
      }
    }
  } else {
    toast("Hai scelto di restare ancora un anno nel tuo percorso attuale.");
    player.pendingDecision = createMarketDecision(player, record);
  }
  renderGameScreen();
}

function selectOffer(offer, marketDecision) {
  if (!offer.attempts) offer.attempts = { years: 0, salary: 0 };
  player.pendingDecision = { type: "negotiate", offer, marketDecision };
  renderGameScreen();
}

function backToOffers() {
  const { offer, marketDecision } = player.pendingDecision;
  // dopo un caricamento l'offerta in trattativa è una copia distinta da quella nella lista:
  // la si rimette al suo posto, così condizioni e tentativi già spesi non vanno persi
  const sync = o => (o && o.id === offer.id ? offer : o);
  marketDecision.offers = marketDecision.offers.map(sync);
  marketDecision.specialOffers = marketDecision.specialOffers.map(sync);
  marketDecision.renewOffer = sync(marketDecision.renewOffer);
  player.pendingDecision = marketDecision;
  renderGameScreen();
}

function switchOfferLeague(leagueId) {
  const d = player.pendingDecision;
  d.selectedLeague = leagueId;
  const externals = buildExternalOffersForLeague(player, leagueId, d.specialOffers);
  d.offers = d.renewOffer ? externals.concat([d.renewOffer]) : externals;
  renderGameScreen();
}

function negotiateContract(kind) {
  const d = player.pendingDecision;
  const cp = d.offer.contractProposal;
  const leverage = clamp((player.overall - 65) / 40, 0.05, 0.9);
  if (kind === "years") {
    if (d.offer.attempts.years >= 2) { toast("La dirigenza non è disposta a discutere ancora sulla durata."); return; }
    d.offer.attempts.years++;
    if (Math.random() < 0.3 + leverage * 0.5) {
      cp.years = clamp(cp.years + 1, 1, 5);
      toast("✅ La squadra accetta di allungare il contratto!");
    } else {
      toast("❌ La squadra rifiuta di allungare il contratto.");
    }
  } else if (kind === "salary") {
    if (cp.salary == null) { toast("Questa lega non prevede un ingaggio negoziabile."); return; }
    if (d.offer.attempts.salary >= 2) { toast("La dirigenza non è disposta a discutere ancora sull'ingaggio."); return; }
    d.offer.attempts.salary++;
    if (Math.random() < 0.3 + leverage * 0.5) {
      cp.salary = round1(cp.salary * 1.15);
      toast("✅ La squadra accetta di aumentare l'ingaggio!");
    } else {
      toast("❌ La squadra rifiuta l'aumento di ingaggio.");
    }
  }
  renderGameScreen();
}

function finalizeContract() {
  const d = player.pendingDecision;
  const offer = d.offer;
  const previousTeamName = player.team.name;
  applyOffer(player, offer);
  // cambiare aria azzera i vecchi attriti: nuovo spogliatoio, chimica che riparte da una base neutra
  if (previousTeamName !== player.team.name) {
    player.chemistry = clamp(randInt(55, 70), 0, 100);
    player.morale = clamp(player.morale + 8, 0, 100);
  }
  player.contract = {
    yearsRemaining: offer.contractProposal.years,
    yearsTotal: offer.contractProposal.years,
    salaryPerYear: offer.contractProposal.salary,
    currency: offer.contractProposal.currency,
    teamStrength: offer.contractProposal.teamStrength,
  };
  toast(`✍️ Hai firmato con ${player.team.name}: ${contractSummaryHtml(offer.contractProposal, offer.targetLeague)}`);
  advanceAfterOffseason();
}

/* Richiesta di trade al front office: una sola per stagione. Ha effetto dalla prossima stagione
   (lo storico di quella appena giocata resta alla squadra con cui è stata disputata) e un
   rifiuto lascia qualche strascico nello spogliatoio. */
function requestTrade() {
  if (!player || player.league !== "NBA" || player.pendingDecision || player.retired) return;
  if (player.tradeRequestYear === player.year) { toast("⚠️ Hai già chiesto una trade in questa stagione."); return; }
  player.tradeRequestYear = player.year;
  const successChance = clamp(0.3 + (player.overall - 70) * 0.01, 0.15, 0.75);
  if (Math.random() < successChance) {
    let newTeam = pickTeam("NBA");
    let tries = 0;
    while (newTeam.name === player.team.name && tries < 5) { newTeam = pickTeam("NBA"); tries++; }
    player.team = newTeam;
    player.chemistry = clamp(randInt(55, 70), 0, 100);
    toast(`🔁 Trade completata! Dalla prossima stagione giocherai con i ${newTeam.name}.`);
  } else {
    player.chemistry = clamp(player.chemistry - randInt(4, 8), 0, 100);
    toast("❌ Richiesta di trade rifiutata dal front office: lo spogliatoio non ha gradito.");
  }
  renderGameScreen();
}

function teamDot(team) {
  return `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${team.colors[0]};border:1.5px solid ${team.colors[1]};margin-right:5px;vertical-align:middle;"></span>`;
}
function teamLabel(team) { return `${teamDot(team)}${team.name}`; }

function overallColor(ovr) {
  if (ovr >= 90) return "linear-gradient(135deg,#ffd447,#ff7a1a)";
  if (ovr >= 80) return "linear-gradient(135deg,#35c47a,#3d8bfd)";
  if (ovr >= 70) return "linear-gradient(135deg,#3d8bfd,#a06bff)";
  return "linear-gradient(135deg,#8b95a5,#5a6577)";
}

/* Seleziona un sottoinsieme leggibile della classifica: vertice, finestra intorno al
   giocatore e (per le leghe con retrocessione) le ultime due posizioni. */
function buildStandingsWindowRows(standings, playerRank, showBottom) {
  const total = standings.length;
  const included = new Set();
  const addRange = (from, to) => { for (let r = from; r <= to; r++) if (r >= 1 && r <= total) included.add(r); };
  addRange(1, 3);
  addRange(playerRank - 2, playerRank + 2);
  if (showBottom) addRange(total - 1, total);
  const ranks = [...included].sort((a, b) => a - b);
  const rows = [];
  let prev = 0;
  ranks.forEach(r => {
    if (prev && r - prev > 1) rows.push({ ellipsis: true });
    rows.push(standings[r - 1]);
    prev = r;
  });
  return rows;
}

// quale conference sta guardando l'utente nella card Classifica (solo rilevante per NBA)
let standingsViewConference = null;

function renderStandings() {
  const badge = el("standings-badge");
  const body = el("standings-body");
  let standings, leagueId, rank, totalTeams, playoffCutoff, relegationZone, promotionZone, ownConference;

  if (player.pendingSeason && player.pendingSeason.standings) {
    const s = player.pendingSeason;
    standings = s.standings; leagueId = s.seasonLeague;
    rank = s.regular.rank; totalTeams = s.regular.totalTeams; playoffCutoff = s.regular.playoffCutoff;
    relegationZone = s.regular.relegationZone; promotionZone = s.regular.promotionZone;
    ownConference = s.regular.conference;
  } else {
    const last = player.history[player.history.length - 1];
    if (!last || !last.standings) {
      badge.textContent = "--";
      body.innerHTML = `<p class="small-muted">La classifica apparirà dopo la prima stagione.</p>`;
      return;
    }
    standings = last.standings; leagueId = last.league;
    rank = last.rank; totalTeams = last.totalTeams; playoffCutoff = last.playoffCutoff;
    relegationZone = last.relegationZone; promotionZone = last.promotionZone;
    ownConference = last.conference;
  }

  const isNBA = standings.conferences;
  if (isNBA && !standingsViewConference) standingsViewConference = ownConference;
  const viewingOwn = !isNBA || standingsViewConference === ownConference;
  const table = isNBA ? (standingsViewConference === "Est" ? standings.east : standings.west) : standings.table;

  badge.textContent = viewingOwn ? `${rank}° / ${totalTeams}` : `Conference ${standingsViewConference}`;
  const showBottom = leagueId === "ITA_LBA";
  const windowRank = viewingOwn ? rank : Math.ceil(table.length / 2); // senza un giocatore in tabella si centra la finestra
  const rows = buildStandingsWindowRows(table, windowRank, showBottom);

  const confSwitcher = isNBA ? `
    <div class="league-selector" style="margin-bottom:10px">
      <button class="league-pill ${standingsViewConference==='Est'?'active':''}" data-conf="Est">Conference Est</button>
      <button class="league-pill ${standingsViewConference==='Ovest'?'active':''}" data-conf="Ovest">Conference Ovest</button>
    </div>` : "";

  const rowsHtml = rows.map(r => {
    if (r.ellipsis) return `<tr class="st-ellipsis"><td colspan="4">⋯</td></tr>`;
    const inPlayoff = r.rank <= playoffCutoff;
    const inRelegation = showBottom && r.rank > totalTeams - 2;
    const cls = [r.isPlayer ? "st-player" : "", inPlayoff ? "st-playoff" : "", inRelegation ? "st-relegation" : ""].filter(Boolean).join(" ");
    return `<tr class="${cls}">
      <td class="st-rank">${r.rank}</td>
      <td>${teamLabel(r.team)}</td>
      <td class="num">${r.wins}</td>
      <td class="num">${r.losses}</td>
    </tr>`;
  }).join("");

  body.innerHTML = `
    ${confSwitcher}
    <div class="standings-wrap">
      <table class="standings-table">
        <thead><tr><th>Pos</th><th>Squadra</th><th class="num">V</th><th class="num">S</th></tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
    <div class="standings-legend">
      <span><span class="dot" style="background:var(--green)"></span>Zona Playoff (Top ${playoffCutoff}${isNBA ? " di conference" : ""})</span>
      ${showBottom ? `<span><span class="dot" style="background:var(--red)"></span>Zona Retrocessione</span>` : ""}
      ${promotionZone ? `<span style="color:var(--green)">📈 In corsa per la promozione</span>` : ""}
      ${relegationZone ? `<span style="color:var(--red)">⚠️ In zona retrocessione</span>` : ""}
    </div>
  `;
  if (isNBA) {
    body.querySelectorAll("[data-conf]").forEach(b => {
      b.addEventListener("click", () => { standingsViewConference = b.dataset.conf; renderStandings(); });
    });
  }
}

function renderGameScreen() {
  el("g-avatar").textContent = (player.firstName[0]||"") + (player.lastName[0]||"");
  el("g-name").textContent = `${player.firstName} ${player.lastName}`;
  const contractLabel = player.contract && player.contract.yearsRemaining > 0
    ? `Contratto: ${player.contract.yearsRemaining}/${player.contract.yearsTotal} anni${player.contract.salaryPerYear!=null ? ` · ${player.contract.salaryPerYear} M${player.contract.currency}/anno` : ""}`
    : "Free Agent";
  const currentArchetype = getArchetype(player.role, player.archetypeId);
  const roleText = currentArchetype ? `${getRoleName(player.role)} (${currentArchetype.name})` : getRoleName(player.role);
  el("g-meta").innerHTML = `#${player.jerseyNumber} · ${player.age} anni · ${player.year} · ${roleText} · ${player.nationality} · <span class="badge">${teamLabel(player.team)}</span> <span class="badge blue">${LEAGUES[player.league].name}</span> <span class="badge green">${contractLabel}</span>`;

  const ring = el("g-ovr-ring");
  ring.style.background = overallColor(player.overall);
  el("g-ovr-val").textContent = player.overall;
  el("g-pot-val").textContent = player.potential;
  el("g-goat-val").textContent = player.goatScore || 0;

  const pills = el("g-pills");
  const last = player.history[player.history.length-1];
  pills.innerHTML = `
    <div class="pill"><div class="pv">${last ? last.pts : "-"}</div><div class="pl">PPG</div></div>
    <div class="pill"><div class="pv">${last ? last.reb : "-"}</div><div class="pl">RPG</div></div>
    <div class="pill"><div class="pv">${last ? last.ast : "-"}</div><div class="pl">APG</div></div>
  `;

  renderAttrs();
  renderOffCourt();
  renderRivalCard("rival-card", false);
  renderTrophyCase("trophy-grid");
  renderAwardHistory("award-history");
  renderSeasonSummary();
  renderStandings();
  renderDecisionPanel();
  renderLog();
  renderHistoryTable("history-tbody");
  renderCareerTotals("career-totals");
  renderCareerRecords("career-records");
  renderCareerChart("career-chart");

  el("btn-advance").disabled = !!player.pendingDecision;
  const tradeBtn = el("btn-trade");
  if (player.league === "NBA" && !player.pendingDecision) {
    tradeBtn.classList.remove("hidden");
    tradeBtn.disabled = player.tradeRequestYear === player.year;
  } else {
    tradeBtn.classList.add("hidden");
  }

  // Off-Season a tutto schermo: draft, mercato, trattativa, imprevisti estivi e torneo con
  // la Nazionale prendono il posto della dashboard di carriera finché non vengono risolti
  const isFullscreenOffseason = !!player.pendingDecision && FULLSCREEN_OFFSEASON_TYPES.includes(player.pendingDecision.type);
  el("screen-offseason").classList.toggle("hidden", !isFullscreenOffseason);
  el("screen-game").classList.toggle("hidden", isFullscreenOffseason);
  if (isFullscreenOffseason) renderOffseasonScreen();
  saveCareer();
}

function renderAttrs() {
  const labels = { shooting: "Tiro", finishing: "Finalizz.", playmaking: "Playmaking", rebounding: "Rimbalzi", defense: "Difesa", athleticism: "Atletismo" };
  const list = el("attr-list");
  list.innerHTML = Object.entries(player.attrs).map(([k,v]) => `
    <div class="attr-row">
      <div class="al">${labels[k]}</div>
      <div class="abar-wrap"><div class="abar" style="width:${v}%"></div></div>
      <div class="av">${v}</div>
    </div>
  `).join("");
}

/* Barre di stato extra-campo, influenzate dagli imprevisti estivi */
function renderOffCourt() {
  const cur = playerCurrency(player);
  const meters = [
    { label: "Morale", value: player.morale, color: "linear-gradient(90deg,#ef4b56,#35c47a)" },
    { label: "Chimica", value: player.chemistry, color: "linear-gradient(90deg,#ef4b56,#3d8bfd)" },
    { label: "Popolarità", value: player.popularity, color: "linear-gradient(90deg,#3d8bfd,#a06bff)" },
    { label: "Stamina", value: player.stamina, color: "linear-gradient(90deg,#ffb020,#35c47a)" },
    { label: "Fragilità", value: player.fragility, color: "linear-gradient(90deg,#35c47a,#ef4b56)" },
  ];
  el("offcourt-list").innerHTML = meters.map(m => `
    <div class="attr-row">
      <div class="al">${m.label}</div>
      <div class="abar-wrap"><div class="abar" style="width:${m.value}%;background:${m.color}"></div></div>
      <div class="av">${m.value}</div>
    </div>
  `).join("") + `
    <div class="attr-row" style="margin-top:4px">
      <div class="al">Patrimonio</div>
      <div style="flex:1;font-weight:800;color:var(--gold);font-size:.85rem">${fmtMoney(player.wealth, cur)}</div>
    </div>
    <div class="attr-row">
      <div class="al">Sponsor</div>
      <div style="flex:1;font-weight:700;color:var(--text-1);font-size:.82rem">${fmtMoney(player.sponsorIncome, cur)}/anno</div>
    </div>`;
}

function renderTrophyCase(targetId) {
  const t = player.trophies;
  const items = [
    { icon: "💍", count: t.rings, label: "Anelli NBA" },
    { icon: "🥇", count: t.domesticTitles, label: "Titoli Nazionali" },
    { icon: "🏆", count: t.euroleague, label: "EuroLeague" },
    { icon: "🏆", count: t.eurocup || 0, label: "EuroCup" },
    { icon: "⭐", count: t.mvp, label: "MVP" },
    { icon: "🛡️", count: t.dpoy, label: "DPOY" },
    { icon: "🌟", count: t.allstar, label: "All-Star" },
    { icon: "🧩", count: t.bestFive, label: "Miglior Quintetto" },
    { icon: "🚀", count: t.bestYoung, label: "Miglior Giovane" },
    { icon: "🎖️", count: t.roy, label: "Rookie OTY" },
    { icon: "🏅", count: t.finalsMvp, label: "Finals MVP" },
    { icon: "🌎", count: t.worldCupTitles, label: "Mondiali Vinti" },
    { icon: "🇪🇺", count: t.eurobasketTitles, label: "Europei Vinti" },
    { icon: "🌍", count: t.medals, label: "Medaglie Naz." },
  ];
  el(targetId).innerHTML = items.map(i => `
    <div class="trophy">
      <div class="t-icon">${i.icon}</div>
      <div class="t-count">${i.count}</div>
      <div class="t-label">${i.label}</div>
    </div>`).join("");
}

/* Ordine di visualizzazione delle categorie nella cronologia premi (stesso ordine del palmarès) */
const AWARD_HISTORY_ORDER = [
  "rings", "domesticTitles", "euroleague", "eurocup", "mvp", "dpoy", "allstar", "bestFive", "bestYoung", "roy",
  "finalsMvp", "worldCupTitles", "eurobasketTitles", "medals",
];
const AWARD_HISTORY_META = {
  rings: { icon: "💍", label: "Anelli NBA" },
  domesticTitles: { icon: "🥇", label: "Titoli Nazionali" },
  euroleague: { icon: "🏆", label: "EuroLeague" },
  eurocup: { icon: "🏆", label: "EuroCup" },
  mvp: { icon: "⭐", label: "MVP" },
  dpoy: { icon: "🛡️", label: "DPOY" },
  allstar: { icon: "🌟", label: "All-Star" },
  bestFive: { icon: "🧩", label: "Miglior Quintetto" },
  bestYoung: { icon: "🚀", label: "Miglior Giovane" },
  roy: { icon: "🎖️", label: "Rookie OTY" },
  finalsMvp: { icon: "🏅", label: "Finals MVP" },
  worldCupTitles: { icon: "🌎", label: "Mondiali Vinti" },
  eurobasketTitles: { icon: "🇪🇺", label: "Europei Vinti" },
  medals: { icon: "🌍", label: "Medaglie con la Nazionale" },
};

/* Ricostruisce, categoria per categoria, ogni premio vinto in carriera con anno, squadra e lega
   (o Nazionale per i tornei internazionali), scorrendo lo storico completo delle stagioni. */
function buildAwardHistory() {
  const cats = {};
  const push = (key, year, detail) => {
    if (!cats[key]) cats[key] = [];
    cats[key].push({ year, detail });
  };
  player.history.forEach(rec => {
    const clubDetail = `${rec.team.name} (${LEAGUES[rec.league].name})`;
    (rec.awards || []).forEach(a => {
      if (a.startsWith("MVP")) push("mvp", rec.year, clubDetail);
      else if (a === "Difensore dell'Anno") push("dpoy", rec.year, clubDetail);
      else if (a.startsWith("All-Star")) push("allstar", rec.year, clubDetail);
      else if (a.startsWith("Miglior Quintetto")) push("bestFive", rec.year, clubDetail);
      else if (a.startsWith("Miglior Giovane")) push("bestYoung", rec.year, clubDetail);
      else if (a === "Rookie dell'Anno") push("roy", rec.year, clubDetail);
      else if (a === "Finals MVP") push("finalsMvp", rec.year, clubDetail);
    });
    if (rec.champion) {
      if (rec.league === "NBA") push("rings", rec.year, clubDetail);
      else push("domesticTitles", rec.year, clubDetail);
    }
    if (rec.continental && rec.continental.champion) push(rec.continental.competition === "EuroLeague" ? "euroleague" : "eurocup", rec.year, clubDetail);
    if (rec.offseason && rec.offseason.title === "Impegno con la Nazionale" && rec.offseason.tone === "positive") {
      push("medals", rec.year, `Nazionale ${player.nationality} (torneo estivo)`);
    }
    if (rec.nationalComp) {
      const natDetail = `Nazionale ${player.nationality} (${rec.nationalComp.name})`;
      if (rec.nationalComp.champion) push(rec.nationalComp.kind === "world" ? "worldCupTitles" : "eurobasketTitles", rec.year, natDetail);
      if (rec.nationalComp.medal) push("medals", rec.year, `${natDetail} — ${rec.nationalComp.medal}`);
    }
  });
  return cats;
}

function renderAwardHistory(targetId) {
  const cats = buildAwardHistory();
  const catsHtml = AWARD_HISTORY_ORDER.filter(k => cats[k] && cats[k].length).map(k => {
    const meta = AWARD_HISTORY_META[k];
    const rows = [...cats[k]].reverse().map(it => `
      <div class="ahr-row"><span class="ahr-year">${it.year}</span><span class="ahr-detail">${it.detail}</span></div>`).join("");
    return `
      <div class="ahr-cat">
        <div class="ahr-head"><span class="ahr-icon">${meta.icon}</span><span class="ahr-label">${meta.label}</span><span class="ahr-count">${cats[k].length}</span></div>
        <div class="ahr-list">${rows}</div>
      </div>`;
  }).join("");
  el(targetId).innerHTML = catsHtml || `<p class="small-muted">Nessun premio vinto finora: la cronologia si popolerà stagione dopo stagione.</p>`;
}

const DOMESTIC_STAGES = ["Stagione Regolare", "Quarti", "Semifinale", "Finale", "Campione"];
const DOMESTIC_STAGES_NBA = ["Stagione Regolare", "Primo Turno", "Semifinale Conf.", "Finale Conf.", "Finali NBA", "Campione"];
const CONTINENTAL_STAGES = ["Fase a Gironi", "Playoff", "Final Four", "Finale", "Campione"];

function domesticStages(leagueId) { return leagueId === "NBA" ? DOMESTIC_STAGES_NBA : DOMESTIC_STAGES; }

/* Ricava lo stadio raggiunto dai turni effettivamente giocati nel tabellone */
function stageIndexFromRounds(rounds, champion, maxIdx) {
  if (champion) return maxIdx;
  if (!rounds || !rounds.length) return 0;
  const last = rounds[rounds.length - 1];
  const order = {
    "Quarti di Finale": 1, "Playoff": 1, "Primo Turno": 1,
    "Semifinale": 2, "Semifinale di Conference": 2, "Final Four": 2,
    "Finale di Conference": 3, "Finale": 3,
    "Finali NBA": 4,
  };
  const idx = order[last.round] || 0;
  // se ha vinto l'ultimo turno giocato è avanzato allo stadio successivo
  return clamp(last.won ? idx + 1 : idx, 0, maxIdx);
}

function domesticStageIndex(rec) {
  return stageIndexFromRounds(rec.playoffRounds, rec.champion, domesticStages(rec.league).length - 1);
}
function continentalStageIndex(rec) {
  if (!rec.continental) return -1;
  return stageIndexFromRounds(rec.continental.rounds, rec.continental.champion, CONTINENTAL_STAGES.length - 1);
}

function campaignTrackerHtml(stages, reachedIdx) {
  return `<div class="campaign-tracker">` + stages.map((s, i) => {
    const state = i < reachedIdx ? "ct-done" : (i === reachedIdx ? "ct-current" : "ct-future");
    const dot = i === reachedIdx ? (reachedIdx === stages.length - 1 ? "🏆" : "●") : "";
    const connector = i < stages.length - 1 ? `<div class="ct-line ${i < reachedIdx ? "ct-line-done" : ""}"></div>` : "";
    return `<div class="ct-step ${state}"><span class="ct-dot">${dot}</span><span class="ct-label">${s}</span></div>${connector}`;
  }).join("") + `</div>`;
}

function renderSeasonSummary() {
  const body = el("season-summary-body");
  const badge = el("season-badge");

  // durante la postseason la stagione non è ancora archiviata: si mostra quella in corso
  if (player.pendingSeason) { renderLiveSeasonSummary(body, badge); return; }

  const last = player.history[player.history.length-1];
  if (!last) {
    badge.className = "badge idle";
    badge.textContent = "In attesa";
    body.innerHTML = `<p class="small-muted">Premi "Avanza Stagione" per iniziare la tua carriera.</p>`;
    return;
  }
  badge.className = "badge done";
  badge.textContent = `✅ ${last.age} anni · ${last.year}`;
  const stateBar = `<div class="season-state-bar state-done"><span class="ssb-dot"></span> STAGIONE CONCLUSA — ${last.age} anni · ${last.year}</div>`;
  const awardsHtml = last.awards.length ? `<div style="margin-top:8px">${last.awards.map(a=>`<span class="badge gold">🏅 ${a}</span>`).join(" ")}</div>` : "";

  const domesticTracker = `
    <div class="campaign-block">
      <label>${LEAGUES[last.league].name} — ${last.wins}-${last.losses}</label>
      ${campaignTrackerHtml(domesticStages(last.league), domesticStageIndex(last))}
    </div>`;
  const continentalTracker = last.continental ? `
    <div class="campaign-block">
      <label>${last.continental.competition}</label>
      ${campaignTrackerHtml(CONTINENTAL_STAGES, continentalStageIndex(last))}
    </div>` : "";
  const nationalTracker = last.nationalComp ? `
    <div class="campaign-block">
      <label>${last.nationalComp.kind === "world" ? "🌎" : "🇪🇺"} ${last.nationalComp.name} ${last.year} — ${player.nationality}</label>
      ${campaignTrackerHtml(NATIONAL_STAGES, nationalStageIndex(last.nationalComp))}
      <p class="small-muted" style="margin-top:6px">${nationalCompOutcomeText(last.nationalComp)}</p>
    </div>` : "";

  body.innerHTML = `
    <div class="season-summary-fade">
    ${stateBar}
    <div class="row">
      <div class="field" style="flex:1"><label>Squadra / Lega</label><div>${teamLabel(last.team)} <span class="small-muted">(${last.team.city} · ${LEAGUES[last.league].name})</span></div></div>
      <div class="field" style="flex:1"><label>Ruolo Minutaggio</label><div>${last.roleLabel} · ${last.mpg} MPG</div></div>
    </div>
    ${domesticTracker}
    ${continentalTracker}
    ${nationalTracker}
    <div class="row" style="margin-top:14px">
      <div class="field" style="flex:1"><label>Progressione Annuale</label><div>${last.ovrDelta >= 0 ? "+" : ""}${last.ovrDelta} Overall → ${last.overall}</div></div>
      <div class="field" style="flex:1"><label>Percentuali</label><div>FG ${last.fg}% (${last.fgm}/${last.fga}) · 3PT ${last.tp}% (${last.tpm}/${last.tpa}) · TL ${last.ft}% (${last.ftm}/${last.fta})</div></div>
    </div>
    <div class="row">
      <div class="field" style="flex:1"><label>Statline</label><div>${last.pts} PTS · ${last.reb} REB · ${last.ast} AST · ${last.stl} STL · ${last.blk} BLK · ${last.tov} TOV</div></div>
      <div class="field" style="flex:1"><label>🐐 Punti GOAT</label><div>+${last.goatPoints || 0} → ${player.goatScore || 0} totali</div></div>
    </div>
    ${awardsHtml}
    ${last.rivalNotes ? `<div class="rival-notes">${last.rivalNotes.map(n => `<div>${n}</div>`).join("")}</div>` : ""}
    ${seasonFocusHtml(last)}
    ${offseasonEventHtml(last)}
    </div>
  `;
}

/* Riepilogo della stagione ancora in corso (postseason non conclusa) */
function renderLiveSeasonSummary(body, badge) {
  const s = player.pendingSeason;
  const ps = player.postseason;
  badge.className = "badge live";
  badge.textContent = `${s.age} anni · ${player.year}`;
  const stateBar = `<div class="season-state-bar state-live"><span class="ssb-dot"></span> STAGIONE IN CORSO — ${s.age} anni · ${player.year}</div>`;

  if (s.phase === "blocks") {
    const agg = aggregateSeasonBlocks(s.blocks);
    body.innerHTML = `
      <div class="season-summary-fade">
      ${stateBar}
      <div class="row">
        <div class="field" style="flex:1"><label>Squadra / Lega</label><div>${teamLabel(s.team)} <span class="small-muted">(${s.team.city} · ${LEAGUES[s.seasonLeague].name})</span></div></div>
        <div class="field" style="flex:1"><label>Ruolo Minutaggio</label><div>${s.minutesInfo.label} · ${s.minutesInfo.mpg} MPG</div></div>
      </div>
      <div class="row" style="margin-top:14px">
        <div class="field" style="flex:1"><label>Stagione Regolare</label><div>${s.blocks.length ? `${agg.wins}-${agg.losses} dopo ${s.blocks.length} ${s.blocks.length === 1 ? "tratto" : "tratti"} su ${SEASON_BLOCKS.length}` : "Non ancora iniziata"}</div></div>
        <div class="field" style="flex:1"><label>Statline parziale</label><div>${s.blocks.length ? `${agg.stats.pts} PTS · ${agg.stats.reb} REB · ${agg.stats.ast} AST · ${agg.gp} gare` : "—"}</div></div>
      </div>
      <p class="small-muted" style="margin-top:6px">Scegli il carico di lavoro nel riquadro qui sotto per giocare il prossimo tratto.</p>
      </div>`;
    return;
  }

  const domestic = ps && ps.brackets.find(b => b.kind === "domestic");
  const continental = ps && ps.brackets.find(b => b.kind === "continental");

  const domesticTracker = `
    <div class="campaign-block">
      <label>${LEAGUES[s.seasonLeague].name} — ${s.regular.wins}-${s.regular.losses}${s.regular.madePlayoffs ? " · Qualificati ai Playoff" : ""}</label>
      ${campaignTrackerHtml(domesticStages(s.seasonLeague), domestic ? stageIndexFromRounds(domestic.results, domestic.champion, domesticStages(s.seasonLeague).length - 1) : 0)}
    </div>`;
  const continentalTracker = continental ? `
    <div class="campaign-block">
      <label>${continental.competition}</label>
      ${campaignTrackerHtml(CONTINENTAL_STAGES, stageIndexFromRounds(continental.results, continental.champion, CONTINENTAL_STAGES.length - 1))}
    </div>` : "";

  body.innerHTML = `
    <div class="season-summary-fade">
    ${stateBar}
    <div class="row">
      <div class="field" style="flex:1"><label>Squadra / Lega</label><div>${teamLabel(s.team)} <span class="small-muted">(${s.team.city} · ${LEAGUES[s.seasonLeague].name})</span></div></div>
      <div class="field" style="flex:1"><label>Ruolo Minutaggio</label><div>${s.minutesInfo.label} · ${s.stats.mpg} MPG</div></div>
    </div>
    ${domesticTracker}
    ${continentalTracker}
    <div class="row" style="margin-top:14px">
      <div class="field" style="flex:1"><label>Statline</label><div>${s.stats.pts} PTS · ${s.stats.reb} REB · ${s.stats.ast} AST · ${s.stats.stl} STL · ${s.stats.blk} BLK · ${s.stats.tov} TOV</div></div>
      <div class="field" style="flex:1"><label>Percentuali</label><div>FG ${s.stats.fg}% · 3PT ${s.stats.tp}% · TL ${s.stats.ft}%</div></div>
    </div>
    <p class="small-muted" style="margin-top:6px">Premi individuali, progressione e imprevisto estivo verranno assegnati a fine postseason.</p>
    </div>
  `;
}

/* Riquadro "Imprevisto di Fine Stagione": evento, esito del dado e conseguenze concrete */
function offseasonEventHtml(rec) {
  const o = rec.offseason;
  if (!o) return "";
  return `
    <div class="offseason-box ${o.tone}">
      <div class="ob-head">
        <span class="ob-icon">${o.tone === "positive" ? "🌟" : o.tone === "negative" ? "⚠️" : "🌤️"}</span>
        <div>
          <div class="ob-title">Imprevisto di Fine Stagione — ${o.title}</div>
          <div class="ob-cat">${o.category}</div>
        </div>
      </div>
      <div class="ob-narrative">${o.narrative}</div>
      ${o.rollText ? `<div class="ob-roll">🎲 ${o.rollText}</div>` : ""}
      ${o.consequences.length ? `<ul class="ob-cons">${o.consequences.map(c => `<li>${c}</li>`).join("")}</ul>` : ""}
    </div>`;
}

/* Riquadro "Focus della Stagione": mostra la scelta fatta a inizio stagione e, se scattata,
   l'evoluzione dell'archetipo */
function seasonFocusHtml(rec) {
  const sf = rec.seasonFocus;
  if (!sf) return "";
  return `
    <div class="offseason-box neutral">
      <div class="ob-head">
        <span class="ob-icon">${sf.focus.icon}</span>
        <div>
          <div class="ob-title">Focus della Stagione — ${sf.focus.label}</div>
          <div class="ob-cat">${sf.focus.desc}</div>
        </div>
      </div>
      ${sf.archetypeChanged ? `<div class="ob-roll">🔄 Il tuo stile di gioco si è evoluto: ora sei ${sf.newArchetypeName}!</div>` : ""}
    </div>`;
}

/* Fasi che occupano l'intera schermata Off-Season invece della card inline in Carriera */
const FULLSCREEN_OFFSEASON_TYPES = ["draft", "market", "negotiate", "offseasonStatus", "offseasonChoice", "offseasonReveal", "nationalReveal", "seasonFocus"];
/* Le fasi che fanno parte del ciclo contrattuale mostrano sempre lo stato "sotto contratto"/"svincolato" */
const OFFSEASON_HUB_TYPES = ["draft", "market", "negotiate", "offseasonStatus"];

function contractStatusBannerHtml() {
  const hasActiveContract = player.contract && player.contract.yearsRemaining > 0;
  if (hasActiveContract) {
    const cur = playerCurrency(player);
    const salaryTxt = player.contract.salaryPerYear == null ? "Borsa di studio" : `${player.contract.salaryPerYear} M${cur}/anno`;
    const yearsTxt = player.contract.yearsRemaining === 1 ? "1 anno rimanente" : `${player.contract.yearsRemaining} anni rimanenti`;
    return `<div class="contract-status-banner locked">🔒 Sotto contratto — ${teamLabel(player.team)} · ${yearsTxt} · ${salaryTxt}</div>`;
  }
  return `<div class="contract-status-banner free">🆓 Svincolato — nessun contratto in essere</div>`;
}

/* Card di una scelta nella schermata Off-Season (stile "griglia di opzioni") */
function offCardHtml({ idx, icon, iconTone, title, subtitle, desc, tags, staticCard }) {
  const tagsHtml = (tags || []).map(t => `<span class="off-card-tag ${t.tone||''}">${t.text}</span>`).join("");
  return `
    <div class="off-card ${staticCard ? 'static' : ''}" ${idx != null ? `data-idx="${idx}"` : ''} ${!staticCard && idx != null ? 'role="button" tabindex="0"' : ''}>
      <div class="off-card-icon" style="${iconTone ? `background:${iconTone};color:#0a0e14;` : ''}">${icon}</div>
      <div class="off-card-title">${title}</div>
      ${subtitle ? `<div class="off-card-subtitle">${subtitle}</div>` : ""}
      ${desc ? `<div class="off-card-desc">${desc}</div>` : ""}
      ${tagsHtml ? `<div class="off-card-tags">${tagsHtml}</div>` : ""}
    </div>`;
}

/* Card della card-decision inline (usata solo per la postseason, che resta nel tab Carriera) */
function renderDecisionPanel() {
  const card = el("card-decision");
  const body = el("decision-body");
  const d = player.pendingDecision;
  if (!d || FULLSCREEN_OFFSEASON_TYPES.includes(d.type)) { card.classList.add("hidden"); body.innerHTML=""; return; }
  card.classList.remove("hidden");
  if (d.type === "postseason") { el("decision-title").textContent = "🏆 Postseason"; renderPostseasonPanel(body); }
  else if (d.type === "seasonBlock") { el("decision-title").textContent = "🏀 Stagione Regolare"; renderSeasonBlockPanel(body, d); }
}

/* Riga di un tratto già giocato: record, presenze e statline */
function seasonBlockRowHtml(b) {
  const w = getWorkload(b.workload);
  return `
    <div class="sb-row">
      <span class="sb-name">${b.icon} ${b.name}</span>
      <span class="sb-rec">${b.wins}-${b.losses}</span>
      <span class="sb-line">${b.stats.pts} PTS · ${b.stats.reb} REB · ${b.stats.ast} AST <span class="small-muted">· ${b.gp}/${b.games} gare · ${w.icon}</span></span>
      ${b.injury ? `<span class="sb-note bad">🩹 Infortunio: ${b.games - b.gp} partite saltate</span>` : ""}
      ${b.situation ? `<span class="sb-note">${b.situation.icon} ${b.situation.title} — ${b.situation.text}</span>` : ""}
    </div>`;
}

/* Tratto di stagione regolare: tratti già giocati, eventuale situazione da risolvere e scelta
   del carico di lavoro per il prossimo tratto */
function renderSeasonBlockPanel(body, d) {
  const s = player.pendingSeason;
  const def = SEASON_BLOCKS[s.blocks.length];
  const agg = aggregateSeasonBlocks(s.blocks);
  const situation = d.situation ? getSituation(d.situation) : null;
  const needsSituation = situation && !d.situationChoice;
  const risk = blockInjuryRisk(player);
  const riskInfo = injuryRiskLabel(risk);

  const progress = SEASON_BLOCKS.map((x, i) => `<span class="sb-step ${i < s.blocks.length ? "done" : i === s.blocks.length ? "current" : ""}">${x.icon} ${x.name}</span>`).join("");
  const playedHtml = s.blocks.length ? `
    <div class="sb-played">${s.blocks.map(seasonBlockRowHtml).join("")}</div>
    <p class="small-muted" style="margin:6px 0 0">Record parziale <strong>${agg.wins}-${agg.losses}</strong> · ${agg.stats.pts} PTS · ${agg.stats.reb} REB · ${agg.stats.ast} AST in ${agg.gp} gare</p>` : "";

  const situationHtml = situation ? `
    <div class="sb-situation">
      <p style="margin-bottom:4px"><strong>${situation.icon} ${situation.title}</strong></p>
      <p class="risk-narrative" style="margin:0 0 10px">${situation.desc}</p>
      <div class="sb-options">
        ${situation.options.map(o => `
          <button type="button" class="option-card sb-choice ${d.situationChoice === o.id ? "selected-team" : ""}" data-situation="${o.id}">
            <div class="oc-title">${o.label}</div>
            <div class="oc-desc">${o.desc}</div>
          </button>`).join("")}
      </div>
    </div>` : "";

  const workloadHtml = `
    <p style="margin:12px 0 6px"><strong>Carico di lavoro — ${def.name}</strong>${def.note ? ` <span class="small-muted">· ${def.note}</span>` : ""}</p>
    <p class="small-muted" style="margin-bottom:8px">Stamina <strong>${player.stamina}</strong> · rischio infortuni <span class="badge ${riskInfo.tone}">${riskInfo.label}</span></p>
    <div class="sb-options">
      ${WORKLOADS.map(w => `
        <button type="button" class="option-card sb-choice" data-workload="${w.id}" ${needsSituation ? "disabled" : ""}>
          <div class="oc-title">${w.icon} ${w.label}</div>
          <div class="oc-desc">${w.desc}</div>
        </button>`).join("")}
    </div>`;

  body.innerHTML = `
    <div class="sb-steps">${progress}</div>
    ${playedHtml}
    ${situationHtml}
    ${workloadHtml}
    <div class="btn-row">
      <button class="btn btn-secondary" id="btn-sim-season">⏩ Simula il resto della stagione</button>
    </div>
  `;
  body.querySelectorAll("[data-situation]").forEach(b => b.addEventListener("click", () => chooseSeasonSituation(b.dataset.situation)));
  body.querySelectorAll("[data-workload]").forEach(b => b.addEventListener("click", () => resolveSeasonBlock(b.dataset.workload)));
  el("btn-sim-season").addEventListener("click", simulateRestOfSeason);
}

/* Schermata Off-Season a tutto schermo: draft, mercato, trattativa, imprevisti estivi e
   torneo con la Nazionale condividono qui la stessa cornice (mini header giocatore, eyebrow
   "PRE-STAGIONE", titolo/sottotitolo contestuali e una griglia di card cliccabili). */
function renderOffseasonScreen() {
  const d = player.pendingDecision;
  el("off-avatar").textContent = (player.firstName[0]||"") + (player.lastName[0]||"");
  el("off-pname").textContent = `${player.firstName} ${player.lastName}`;
  el("off-pmeta").textContent = `${getRoleName(player.role)} · ${player.nationality}`;
  el("off-ovr-val").textContent = player.overall;
  el("off-eyebrow").textContent = `PRE-STAGIONE · GIUGNO ${player.year}`;
  el("off-status-banner").innerHTML = OFFSEASON_HUB_TYPES.includes(d.type) ? contractStatusBannerHtml() : "";

  const titleEl = el("off-title"), subEl = el("off-subtitle"), cards = el("off-cards"), extra = el("off-extra");
  cards.className = "off-cards";
  extra.innerHTML = "";

  if (d.type === "seasonFocus") {
    titleEl.textContent = "Su cosa ti concentri quest'anno?";
    subEl.textContent = "Scegli il focus del tuo lavoro per la stagione: darà una spinta agli attributi coerenti e potrebbe, con il tempo, far evolvere il tuo stile di gioco.";
    cards.innerHTML = SEASON_FOCUS_OPTIONS.map((o, i) => offCardHtml({
      idx: i, icon: o.icon, title: o.label, desc: o.desc,
    })).join("");
    cards.querySelectorAll(".off-card").forEach(c => {
      c.addEventListener("click", () => resolveSeasonFocus(SEASON_FOCUS_OPTIONS[parseInt(c.dataset.idx)].id));
    });
    return;
  }

  if (d.type === "draft") {
    titleEl.textContent = "Il Draft ti chiama";
    subEl.textContent = `Overall attuale: ${player.overall}. Puoi dichiararti al Draft NBA una sola volta in carriera: sei pronto per il grande salto?`;
    cards.innerHTML =
      offCardHtml({ idx: 0, icon: "🏀", iconTone: "var(--accent-2)", title: "Dichiarati al Draft", subtitle: "Un'occasione, una sola volta", desc: "Ti metti a disposizione delle squadre NBA. Se non vieni scelto, resta comunque una chance da free agent." }) +
      offCardHtml({ idx: 1, icon: "⏳", title: "Resta ancora un anno", subtitle: "Continua il tuo percorso", desc: "Rimani nella tua lega attuale per crescere ancora prima di tentare il salto." });
    cards.querySelector('[data-idx="0"]').addEventListener("click", () => resolveDraftDecision(true));
    cards.querySelector('[data-idx="1"]').addEventListener("click", () => resolveDraftDecision(false));
    return;
  }

  if (d.type === "offseasonStatus") {
    titleEl.textContent = "Verso la prossima stagione";
    subEl.textContent = "Il tuo contratto è ancora valido: la dirigenza non richiede alcuna decisione, ci si prepara direttamente alla prossima annata.";
    cards.className = "off-cards off-cards-single";
    cards.innerHTML = offCardHtml({ icon: "📋", staticCard: true, title: player.team.name, subtitle: LEAGUES[player.league].name, desc: "Nessuna trattativa in corso: la squadra si affida a te anche per la prossima stagione." });
    extra.innerHTML = `<div class="btn-row" style="justify-content:center;margin-top:10px"><button class="btn btn-primary btn-lg" id="btn-offseason-continue">▶️ Continua</button></div>`;
    el("btn-offseason-continue").addEventListener("click", advanceAfterOffseason);
    return;
  }

  if (d.type === "market") {
    titleEl.textContent = "Mercato Estivo";
    subEl.textContent = "Confronta le offerte: campionato, squadra e possibilità di competere per il titolo.";
    const leagueOptions = leagueSelectorOptions(player);
    const leagueSelectorHtml = leagueOptions.length > 1 ? `
      <div class="league-selector" style="justify-content:center;margin-bottom:16px">
        ${leagueOptions.map(id => `<button class="league-pill ${id===d.selectedLeague?'active':''}" data-league="${id}">${LEAGUE_FLAG[id]||''} ${LEAGUES[id].name}</button>`).join("")}
      </div>` : "";
    const forcedNotice = d.forcedTransfer
      ? `<p class="forced-notice" style="text-align:center;margin-bottom:14px">🚪 Rottura col club dopo i fatti dell'estate: il rinnovo non è più un'opzione, devi trovare una nuova squadra.</p>`
      : "";
    extra.innerHTML = leagueSelectorHtml + forcedNotice;
    cards.innerHTML = d.offers.map((o,i) => {
      const t = titleChanceInfo(o.contractProposal.teamStrength, o.targetLeague);
      return offCardHtml({
        idx: i, icon: (o.team.name[0]||'?').toUpperCase(), iconTone: o.team.colors ? o.team.colors[0] : null,
        title: o.team.name, subtitle: `${o.team.city} · ${LEAGUES[o.targetLeague].name}`,
        desc: offerLineText(o), tags: [{ text: `${t.stars} ${t.label}`, tone: "gold" }],
      });
    }).join("");
    cards.querySelectorAll(".off-card").forEach(c => {
      c.addEventListener("click", () => selectOffer(d.offers[parseInt(c.dataset.idx)], d));
    });
    extra.querySelectorAll(".league-pill").forEach(b => b.addEventListener("click", () => switchOfferLeague(b.dataset.league)));
    return;
  }

  if (d.type === "negotiate") {
    const cp = d.offer.contractProposal;
    const t = titleChanceInfo(cp.teamStrength, d.offer.targetLeague);
    const salaryText = cp.salary == null ? "Borsa di studio (nessun ingaggio)" : `${cp.salary} M${cp.currency}/anno`;
    titleEl.textContent = `Trattativa con ${d.offer.team.name}`;
    subEl.textContent = `${LEAGUES[d.offer.targetLeague].name} · ${d.offer.team.city}`;
    cards.className = "off-cards off-cards-single";
    cards.innerHTML = offCardHtml({
      icon: "✍️", staticCard: true, title: d.offer.team.name, subtitle: LEAGUES[d.offer.targetLeague].name,
      desc: d.offer.desc,
      tags: [
        { text: `📅 ${cp.years} ${cp.years===1?'anno':'anni'}` },
        { text: `💰 ${salaryText}`, tone: "green" },
        { text: `OVR ${teamOverallFromStrength(cp.teamStrength)}`, tone: "blue" },
        { text: `${t.stars} ${t.label}`, tone: "gold" },
      ],
    });
    extra.innerHTML = `
      <div class="btn-row" style="justify-content:center">
        <button class="btn btn-primary btn-lg" id="btn-sign-contract">✅ Firma alle condizioni proposte</button>
      </div>
      <div class="btn-row" style="justify-content:center">
        <button class="btn btn-secondary" id="btn-negotiate-years" ${d.offer.attempts.years>=2?'disabled':''}>💬 Chiedi più anni (${2-d.offer.attempts.years} tentativi)</button>
        <button class="btn btn-secondary" id="btn-negotiate-salary" ${(cp.salary==null||d.offer.attempts.salary>=2)?'disabled':''}>💰 Chiedi un aumento (${2-d.offer.attempts.salary} tentativi)</button>
      </div>
      ${d.marketDecision ? `<div class="btn-row" style="justify-content:center"><button class="btn btn-ghost" id="btn-back-offers">↩️ Valuta altre offerte</button></div>` : ""}
    `;
    el("btn-sign-contract").addEventListener("click", finalizeContract);
    el("btn-negotiate-years").addEventListener("click", () => negotiateContract("years"));
    el("btn-negotiate-salary").addEventListener("click", () => negotiateContract("salary"));
    if (d.marketDecision) el("btn-back-offers").addEventListener("click", backToOffers);
    return;
  }

  if (d.type === "offseasonChoice") {
    const ev = d.event;
    const chance = Math.round(offseasonEventChance(ev, player));
    titleEl.textContent = ev.title;
    subEl.textContent = `☀️ Imprevisto dell'estate — ${ev.category}. ${offseasonEventPreview(ev, player)}`;
    cards.innerHTML =
      offCardHtml({ idx: 0, icon: "🎲", iconTone: "var(--accent-2)", title: "Prendi il rischio", subtitle: ev.goodLabel, desc: `Possibilità di successo: ${chance}%`, tags: [{ text: `📈 ${chance}%`, tone: "green" }, { text: `📉 ${100-chance}%`, tone: "red" }] }) +
      offCardHtml({ idx: 1, icon: "🛡️", title: "Gioca sicuro", subtitle: "Nessun rischio", desc: "Nessun effetto: si evita completamente l'imprevisto." });
    cards.querySelector('[data-idx="0"]').addEventListener("click", () => resolveOffseasonChoice(true));
    cards.querySelector('[data-idx="1"]').addEventListener("click", () => resolveOffseasonChoice(false));
    return;
  }

  if (d.type === "offseasonReveal") {
    const rv = player.pendingOffseasonReveal;
    if (!rv) return;
    const out = rv.offseason;
    const toneClass = out.tone === "positive" ? "good" : out.tone === "negative" ? "bad" : "neutral";
    const resultIcon = !rv.takeRisk ? "🛡️" : out.tone === "positive" ? "✅" : out.tone === "negative" ? "❌" : "➖";
    const rollIcon = rv.takeRisk ? "🎲" : "🛡️";
    titleEl.textContent = "Il verdetto dell'estate";
    subEl.textContent = rv.takeRisk ? "Il rischio viene corso..." : "Si gioca sul sicuro...";
    cards.className = "off-cards off-cards-single";
    cards.innerHTML = `
      <div class="off-card static">
        <div class="reveal-wrap">
          <div class="reveal-roll" id="reveal-roll">
            <div class="reveal-dice">${rollIcon}</div>
            <p class="reveal-suspense">In corso...</p>
          </div>
          <div class="reveal-result hidden ${toneClass}" id="reveal-result">
            <div class="reveal-result-icon">${resultIcon}</div>
            <div class="reveal-result-title">${out.title}</div>
            ${out.rollText ? `<div class="reveal-rolltext">🎲 ${out.rollText}</div>` : ""}
            <p class="reveal-narrative">${out.narrative}</p>
            ${out.consequences.length ? `<ul class="reveal-consequences">${out.consequences.map(c => `<li>${c}</li>`).join("")}</ul>` : ""}
            <button class="btn btn-primary" id="btn-reveal-continue">Continua</button>
          </div>
        </div>
      </div>`;
    setTimeout(() => {
      if (!player || !player.pendingOffseasonReveal) return;
      const roll = document.getElementById("reveal-roll");
      const result = document.getElementById("reveal-result");
      if (!roll || !result) return;
      roll.classList.add("hidden");
      result.classList.remove("hidden");
      subEl.textContent = "L'estate ha fatto il suo corso.";
      el("btn-reveal-continue").addEventListener("click", confirmOffseasonReveal);
    }, 1300);
    return;
  }

  if (d.type === "nationalReveal") {
    const comp = d.comp;
    const flag = comp.kind === "world" ? "🌎" : "🇪🇺";
    const medalClass = comp.champion ? "champ" : comp.medal ? "medal" : "out";
    titleEl.textContent = `${flag} ${comp.name}`;
    subEl.textContent = `${player.nationality} — la tua Nazionale ha disputato il torneo estivo.`;
    cards.className = "off-cards off-cards-single";
    cards.innerHTML = `
      <div class="off-card static">
        ${campaignTrackerHtml(NATIONAL_STAGES, nationalStageIndex(comp))}
        <div class="ps-status ${medalClass}" style="margin-top:12px">${nationalCompOutcomeText(comp)}</div>
      </div>`;
    extra.innerHTML = `<div class="btn-row" style="justify-content:center;margin-top:10px"><button class="btn btn-primary btn-lg" id="btn-national-continue">▶️ Continua verso la Regular Season</button></div>`;
    el("btn-national-continue").addEventListener("click", confirmNationalReveal);
    return;
  }
}

/* Pannello playoff: mostra i tabelloni, le serie già giocate e il turno da disputare */
function renderPostseasonPanel(body) {
  const ps = player.postseason;
  if (!ps) { body.innerHTML = ""; return; }

  const bracketsHtml = ps.brackets.map((b, bi) => {
    const isActive = bi === ps.idx;
    const seriesHtml = b.results.map(r => `
      <div class="series-row ${r.won ? "won" : "lost"}">
        <span class="sr-round">${r.round}</span>
        <span class="sr-opp">${teamLabel(r.opponent)}</span>
        <span class="sr-score">${r.us}-${r.them}</span>
        <span class="sr-flag">${r.clutch ? `<span title="Ultimo possesso: ${r.clutch.label}">${r.clutch.success ? "🎯" : "💔"}</span> ` : ""}${r.won ? "✅" : "❌"}</span>
      </div>`).join("");

    let statusHtml = "";
    if (b.champion) statusHtml = `<div class="ps-status champ">🏆 ${b.competition}: TITOLO VINTO!</div>`;
    else if (b.done) statusHtml = `<div class="ps-status out">Eliminati ai ${b.eliminatedAt}</div>`;
    else if (isActive && b.pendingClutch) {
      statusHtml = `<div class="ps-status next">${b.pendingClutch.round}: serie sul ${b.pendingClutch.us}-${b.pendingClutch.them}, si decide tutto ora</div>`;
    }
    else if (isActive) {
      const nextRound = b.rounds[b.idx];
      statusHtml = `<div class="ps-status next">Prossimo turno: <strong>${nextRound.name}</strong> — serie al meglio di ${nextRound.bestOf}</div>`;
    } else {
      statusHtml = `<div class="ps-status wait">In attesa del proprio turno</div>`;
    }

    return `
      <div class="ps-bracket ${isActive && !b.done ? "active" : ""}">
        <div class="ps-bracket-title">${b.kind === "domestic" ? "🏀" : "🇪🇺"} ${b.competition}</div>
        ${seriesHtml}
        ${statusHtml}
      </div>`;
  }).join("");

  const active = currentBracket();
  if (active && active.pendingClutch) { body.innerHTML = `<div class="ps-wrap">${bracketsHtml}</div>` + clutchPanelHtml(active); wireClutchPanel(body); return; }
  const nextRound = active && !active.done ? active.rounds[active.idx] : null;

  body.innerHTML = `
    <p style="margin-bottom:8px"><strong>🏆 Postseason in corso</strong> — gioca un turno alla volta:</p>
    <div class="ps-wrap">${bracketsHtml}</div>
    <div class="btn-row">
      ${nextRound ? `<button class="btn btn-primary" id="btn-play-round">▶️ Gioca ${nextRound.name} (${active.competition})</button>` : ""}
      <button class="btn btn-secondary" id="btn-sim-postseason">⏩ Simula il resto</button>
    </div>
  `;
  if (nextRound) el("btn-play-round").addEventListener("click", advancePostseasonRound);
  el("btn-sim-postseason").addEventListener("click", simulateRestOfPostseason);
}

/* Ultimo possesso della gara decisiva: contesto e tre opzioni con la probabilità stimata */
function clutchPanelHtml(bracket) {
  const pc = bracket.pendingClutch;
  const game = pc.bestOf === 1 ? "Gara secca" : `Gara ${pc.us + pc.them + 1}`;
  return `
    <div class="clutch-box">
      <div class="clutch-head">🔥 ${bracket.competition} · ${pc.round} · ${game}</div>
      <p class="risk-narrative" style="margin:4px 0 12px">${pc.bestOf === 1 ? "" : `Serie in parità ${pc.us}-${pc.them} contro ${teamLabel(pc.opponent)}. `}Ultimi secondi, siete sotto di un punto e la palla è nelle tue mani. Cosa fai?</p>
      <div class="sb-options">
        ${CLUTCH_OPTIONS.map(o => `
          <button type="button" class="option-card sb-choice" data-clutch="${o.id}">
            <div class="oc-title">${o.icon} ${o.label} <span class="badge">${Math.round(clutchChance(player, pc.winProb, o) * 100)}%</span></div>
            <div class="oc-desc">${o.desc}</div>
          </button>`).join("")}
      </div>
    </div>`;
}
function wireClutchPanel(body) {
  body.querySelectorAll("[data-clutch]").forEach(b => b.addEventListener("click", () => resolveClutch(b.dataset.clutch)));
}

/* Pannello imprevisto estivo a rischio: mostra le due percentuali d'esito prima di scegliere
   se rischiare o restare sul sicuro (nessun effetto). */
function renderOffseasonChoicePanel(body, ev) {
  const chance = Math.round(offseasonEventChance(ev, player));
  const preview = offseasonEventPreview(ev, player);
  body.innerHTML = `
    <p style="margin-bottom:4px"><strong>☀️ Imprevisto dell'estate — ${ev.category}</strong></p>
    <p class="risk-narrative"><strong>${ev.title}</strong>. ${preview}</p>
    <div class="risk-options">
      <div class="risk-opt good">
        <span class="ro-icon">📈</span>
        <span class="ro-label">${ev.goodLabel}</span>
        <span class="ro-pct">${chance}%</span>
      </div>
      <div class="risk-opt bad">
        <span class="ro-icon">📉</span>
        <span class="ro-label">${ev.badLabel}</span>
        <span class="ro-pct">${100 - chance}%</span>
      </div>
    </div>
    <div class="btn-row">
      <button class="btn btn-primary" id="btn-risk-take">🎲 Prendi il rischio</button>
      <button class="btn btn-secondary" id="btn-risk-safe">🛡️ Gioca sicuro</button>
    </div>
  `;
  el("btn-risk-take").addEventListener("click", () => resolveOffseasonChoice(true));
  el("btn-risk-safe").addEventListener("click", () => resolveOffseasonChoice(false));
}

/* Animazione di rivelazione dell'imprevisto: prima una breve sospensione (dado che trema per
   il rischio, scudo che pulsa per la scelta sicura), poi l'esito reale viene svelato con un
   pop-in colorato in base al tono (positivo/negativo/neutro) e un pulsante per proseguire. */
function renderOffseasonRevealPanel(body) {
  const rv = player.pendingOffseasonReveal;
  if (!rv) return;
  const out = rv.offseason;
  const toneClass = out.tone === "positive" ? "good" : out.tone === "negative" ? "bad" : "neutral";
  const resultIcon = !rv.takeRisk ? "🛡️" : out.tone === "positive" ? "✅" : out.tone === "negative" ? "❌" : "➖";
  const rollIcon = rv.takeRisk ? "🎲" : "🛡️";
  const suspenseText = rv.takeRisk ? "Il rischio viene corso..." : "Si gioca sul sicuro...";

  body.innerHTML = `
    <div class="reveal-wrap">
      <div class="reveal-roll" id="reveal-roll">
        <div class="reveal-dice">${rollIcon}</div>
        <p class="reveal-suspense">${suspenseText}</p>
      </div>
      <div class="reveal-result hidden ${toneClass}" id="reveal-result">
        <div class="reveal-result-icon">${resultIcon}</div>
        <div class="reveal-result-title">${out.title}</div>
        ${out.rollText ? `<div class="reveal-rolltext">🎲 ${out.rollText}</div>` : ""}
        <p class="reveal-narrative">${out.narrative}</p>
        ${out.consequences.length ? `<ul class="reveal-consequences">${out.consequences.map(c => `<li>${c}</li>`).join("")}</ul>` : ""}
        <button class="btn btn-primary" id="btn-reveal-continue">Continua</button>
      </div>
    </div>
  `;

  setTimeout(() => {
    // se nel frattempo il pannello è stato smontato (es. nuova carriera) non si tocca nulla
    if (!player || !player.pendingOffseasonReveal) return;
    const roll = document.getElementById("reveal-roll");
    const result = document.getElementById("reveal-result");
    if (!roll || !result) return;
    roll.classList.add("hidden");
    result.classList.remove("hidden");
    el("btn-reveal-continue").addEventListener("click", confirmOffseasonReveal);
  }, 1300);
}

/* Pannello del torneo con la Nazionale: mostrato subito dopo l'Off-Season, prima che inizi
   la prossima regular season. Il torneo è già stato simulato per intero a fine stagione:
   qui se ne rivela semplicemente il cammino con lo stesso stile dei tracker di campionato. */
function renderNationalRevealPanel(body, comp) {
  const flag = comp.kind === "world" ? "🌎" : "🇪🇺";
  const medalClass = comp.champion ? "champ" : comp.medal ? "medal" : "out";
  body.innerHTML = `
    <p style="margin-bottom:4px"><strong>${flag} ${comp.name} — ${player.nationality}</strong></p>
    <p class="small-muted" style="margin-bottom:10px">La tua Nazionale ha disputato il torneo estivo. Ecco il cammino:</p>
    ${campaignTrackerHtml(NATIONAL_STAGES, nationalStageIndex(comp))}
    <div class="ps-status ${medalClass}" style="margin-top:12px">${nationalCompOutcomeText(comp)}</div>
    <div class="btn-row" style="margin-top:14px">
      <button class="btn btn-primary" id="btn-national-continue">▶️ Continua verso la Regular Season</button>
    </div>
  `;
  el("btn-national-continue").addEventListener("click", confirmNationalReveal);
}

function awardsAndNoteText(rec) {
  const parts = [];
  if (rec.draftResult) parts.push(`Draft: ${rec.draftResult}`);
  if (rec.champion) parts.push("🏆 Titolo");
  if (rec.continental) parts.push(`${rec.continental.competition}: ${rec.continental.result}`);
  if (rec.nationalComp) parts.push(`${rec.nationalComp.kind === "world" ? "🌎" : "🇪🇺"} ${rec.nationalComp.name}: ${nationalCompOutcomeText(rec.nationalComp)}`);
  if (rec.injury) parts.push(rec.injury.text);
  if (rec.seasonFocus && rec.seasonFocus.archetypeChanged) parts.push(`🔄 Evoluzione: ${rec.seasonFocus.newArchetypeName}`);
  if (rec.awards && rec.awards.length) parts.push(rec.awards.join(", "));
  (rec.rivalNotes || []).filter(n => n.startsWith("⚔️")).forEach(n => parts.push(n));
  if (rec.event) parts.push(rec.event.text);
  if (rec.offseason) {
    const icon = rec.offseason.tone === "positive" ? "🌟" : rec.offseason.tone === "negative" ? "⚠️" : "🌤️";
    parts.push(`${icon} Estate: ${rec.offseason.title}`);
  }
  return parts.join(" · ") || "-";
}

function renderLog() {
  const list = el("log-list");
  const entries = [...player.history].reverse().map(rec => {
    let cls = "";
    if (rec.champion) cls = "title";
    else if (rec.awards && rec.awards.length) cls = "award";
    else if (rec.injury) cls = "injury";
    else if (rec.event && rec.event.type === "injury") cls = "injury";
    else if (rec.event) cls = rec.event.type === "market" ? "market" : "milestone";
    return `<div class="log-entry ${cls}">
      <span class="le-year">${rec.age} anni · ${rec.year}</span>${teamLabel(rec.team)} (${LEAGUES[rec.league].name}) — ${rec.pts} PTS / ${rec.reb} REB / ${rec.ast} AST. ${awardsAndNoteText(rec)}
    </div>`;
  });
  list.innerHTML = entries.join("") || `<p class="small-muted">Nessun evento ancora registrato.</p>`;
}

function renderHistoryTable(tbodyId) {
  const tbody = el(tbodyId);
  tbody.innerHTML = player.history.map(rec => `
    <tr>
      <td>${rec.age}</td>
      <td>${rec.year}</td>
      <td>${teamLabel(rec.team)}<div class="small-muted">${rec.team.city}</div></td>
      <td>${LEAGUES[rec.league].name}</td>
      <td>${rec.gp != null ? `${rec.gp}/${rec.games}` : "-"}</td>
      <td>${rec.pts}</td>
      <td>${rec.reb}</td>
      <td>${rec.ast}</td>
      <td>${rec.tov ?? "-"}</td>
      <td>${rec.fg ?? "-"}%</td>
      <td>${rec.tp ?? "-"}%</td>
      <td>${rec.overall}</td>
      <td class="${rec.champion || (rec.awards&&rec.awards.length) ? 'trophy-cell' : ''}">${awardsAndNoteText(rec)}</td>
    </tr>
  `).join("");
}

/* ================================================================
   IL RIVALE — un talento della stessa generazione che fa il percorso opposto (vivaio europeo
   se tu parti dall'high school USA, e viceversa). Ogni stagione viene simulato con lo stesso
   motore statistico e la stessa curva di crescita del giocatore; nella stessa lega un solo MVP
   e un solo titolo sono possibili, e a vincere è chi ha avuto l'impatto maggiore.
   ================================================================ */
const RIVAL_HOME_LEAGUE = { Italia: "ITA_LBA", Spagna: "ESP_ACB", Francia: "FRA_ELITE", Turchia: "TUR_BSL" };

function createRival(p) {
  const fromEurope = p.pathId === "USA_HS";
  const nationality = fromEurope ? choice(EUROPEAN_NATIONALITIES) : choice(["USA", "USA", "Canada"]);
  const role = choice(ROLES).id;
  const archetype = choice(ARCHETYPES_BY_ROLE[role]);
  let firstName = choice(RANDOM_FIRSTNAMES), lastName = choice(RANDOM_LASTNAMES);
  if (lastName === p.lastName) lastName = choice(RANDOM_LASTNAMES.filter(n => n !== p.lastName));
  const league = fromEurope ? (RIVAL_HOME_LEAGUE[nationality] || choice(EU_TOP_LEAGUES)) : "NCAA";
  const overall = randInt(58, 65);
  const r = BODY_RANGES[role];
  return {
    firstName, lastName, nationality, role, archetypeId: archetype.id,
    age: p.age, overall, potential: randInt(72, 97),
    attrs: generateInitialAttrs(role, archetype.id, overall, computeBodyModifiers(role, randInt(r.hMin, r.hMax), randInt(r.wMin, r.wMax))),
    league, team: pickTeam(league), inNBA: false,
    morale: 65, stamina: 90, popularity: 30,
    goatScore: 0, retired: false, retiredAge: null,
    trophies: { rings: 0, domesticTitles: 0, mvp: 0, allstar: 0, finalsMvp: 0 },
    history: [],
  };
}

/* Carriera del rivale: passaggi NBA/Europa e cambi di squadra, con regole semplici */
function moveRival(rv) {
  if (!rv.inNBA && rv.age >= 19 && rv.overall >= 76) {
    rv.inNBA = true; rv.league = "NBA"; rv.team = pickTeam("NBA");
    return `${rv.firstName} ${rv.lastName} sbarca in NBA con i ${rv.team.name}`;
  }
  if (rv.league === "NCAA" && rv.age >= 22) {
    rv.league = choice(EU_TOP_LEAGUES); rv.team = pickTeam(rv.league);
    return `${rv.firstName} ${rv.lastName} lascia il college e firma in ${LEAGUES[rv.league].name}`;
  }
  if (rv.inNBA && rv.age >= 28 && rv.overall < 72) {
    rv.inNBA = false; rv.league = choice(EU_TOP_LEAGUES); rv.team = pickTeam(rv.league);
    return `${rv.firstName} ${rv.lastName} torna in Europa: ${rv.team.name}`;
  }
  if (rollChance(22)) {
    const old = rv.team.name;
    rv.team = choice(LEAGUES[rv.league].teams.filter(t => t.name !== old));
  }
  return null;
}

/* Simula la stagione del rivale e risolve i duelli con quella del giocatore (stessa lega:
   un solo MVP e un solo titolo). Può togliere l'MVP al giocatore modificando mine.awards.
   Restituisce le note da mostrare nel riepilogo, oppure null. */
function simulateRivalSeason(rv, mine) {
  if (!rv || rv.retired) return null;
  rv.age = player.age;
  const notes = [];
  if (rv.age >= 40 || (rv.age >= 32 && rv.overall < 62) || (rv.age >= 35 && rollChance(30))) {
    rv.retired = true; rv.retiredAge = rv.age;
    return [`👋 Il tuo rivale ${rv.firstName} ${rv.lastName} si ritira a ${rv.age} anni.`];
  }
  const league = rv.league;
  const minutesInfo = determineMinutesRole(rv.overall, LEAGUES[league].avgOverall);
  const stats = simulateStatline(rv, minutesInfo, league);
  const games = seasonLength(league);
  const gp = Math.round(games * (rollChance(18) ? randFloat(0.55, 0.9, 2) : 1));
  stats.gp = gp; stats.games = games;

  const teamStrength = getTeamStrength(rv.team, league);
  const winPct = regularSeasonWinPct(rv.overall, teamStrength, league);
  const wins = Math.round(games * winPct);
  const pct = teamStrengthPercentile(teamStrength, league);
  const sameLeague = league === mine.league;
  let champion = !(sameLeague && mine.champion) && rollChance(clamp(Math.pow(pct, 3) * 40 + (rv.overall - LEAGUES[league].avgOverall) * 0.8, 1, 45));
  // piazzamento stimato da forza della squadra e rendimento del rivale
  const teamsCount = LEAGUES[league].teams.length;
  const rank = clamp(Math.round((1 - clamp(pct * 0.6 + (winPct - 0.3) * 0.8, 0, 1)) * (teamsCount - 1)) + 1, 1, teamsCount);
  const awards = rollAwards(rv, stats, { champion, madePlayoffs: rank <= 8 }, {
    leagueId: league, rank, totalTeams: LEAGUES[league].teams.length, minutesLabel: minutesInfo.label, gpShare: gp / games,
  }).filter(a => a !== "Rookie dell'Anno" && !a.startsWith("Miglior Giovane") && a !== "Difensore dell'Anno");

  // duello per l'MVP nella stessa lega: vince chi ha avuto l'impatto maggiore
  const mvpName = `MVP ${LEAGUES[league].name}`;
  const rivalMvp = awards.indexOf(mvpName);
  const mineMvp = mine.awards.indexOf(mvpName);
  if (sameLeague && rivalMvp >= 0 && mineMvp >= 0) {
    const mineImpact = seasonImpact(mine.stats, league).impact;
    const rivalImpact = seasonImpact(stats, league).impact;
    if (rivalImpact > mineImpact) {
      mine.awards.splice(mineMvp, 1);
      notes.push(`⚔️ Duello per l'MVP: il premio va al tuo rivale ${rv.firstName} ${rv.lastName} (${stats.pts} PTS).`);
    } else {
      awards.splice(rivalMvp, 1);
      notes.push(`⚔️ Duello per l'MVP vinto contro ${rv.firstName} ${rv.lastName}!`);
    }
  } else if (rivalMvp >= 0) {
    notes.push(`⭐ Il tuo rivale ${rv.firstName} ${rv.lastName} è MVP ${LEAGUES[league].name}.`);
  }
  if (champion) notes.push(`🏆 Il tuo rivale ${rv.firstName} ${rv.lastName} vince il titolo con ${rv.team.name}.`);

  const record = {
    age: rv.age, year: player.year, team: rv.team, league,
    pts: stats.pts, reb: stats.reb, ast: stats.ast, stl: stats.stl, blk: stats.blk, tov: stats.tov,
    gp, games, wins, losses: games - wins, champion, continental: null, nationalComp: null, awards, overall: rv.overall,
  };
  record.goatPoints = computeSeasonGoatScore(record);
  rv.goatScore += record.goatPoints;
  awards.forEach(a => {
    if (a.startsWith("MVP")) rv.trophies.mvp++;
    else if (a.startsWith("All-Star")) rv.trophies.allstar++;
    else if (a === "Finals MVP") rv.trophies.finalsMvp++;
  });
  if (champion) { if (league === "NBA") rv.trophies.rings++; else rv.trophies.domesticTitles++; }
  rv.history.push({ age: rv.age, year: player.year, team: rv.team, league, overall: rv.overall, pts: stats.pts, reb: stats.reb, ast: stats.ast, goatPoints: record.goatPoints, champion, awards });

  // crescita con la stessa curva del giocatore, poi eventuale cambio di squadra o di lega
  progressOverall(rv, clamp((stats.pts/25 + stats.ast/8 + stats.reb/10)/2.2, 0, 1));
  const move = moveRival(rv);
  if (move) notes.push(`🔁 ${move}.`);
  return notes.length ? notes : null;
}

/* Confronto diretto: le voci principali, con evidenziato chi è avanti */
function rivalComparisonRows(rv) {
  const t = player.trophies;
  return [
    { label: "🐐 Punteggio GOAT", mine: player.goatScore || 0, theirs: rv.goatScore },
    { label: "📈 Picco di overall", mine: Math.max(player.overall, ...player.history.map(h => h.overall)), theirs: Math.max(rv.overall, ...rv.history.map(h => h.overall)) },
    { label: "💍 Titoli (NBA + nazionali)", mine: t.rings + t.domesticTitles, theirs: rv.trophies.rings + rv.trophies.domesticTitles },
    { label: "⭐ MVP", mine: t.mvp, theirs: rv.trophies.mvp },
    { label: "🌟 All-Star", mine: t.allstar, theirs: rv.trophies.allstar },
    { label: "🏅 Finals MVP", mine: t.finalsMvp, theirs: rv.trophies.finalsMvp },
  ];
}

function renderRivalCard(targetId, final) {
  const box = el(targetId);
  if (!box) return;
  const rv = player.rival;
  if (!rv) {
    box.innerHTML = `<p class="small-muted">Nessun rivale in questa carriera: la rivalità è arrivata con un aggiornamento successivo all'inizio della carriera.</p>`;
    return;
  }
  const arch = getArchetype(rv.role, rv.archetypeId);
  const status = rv.retired ? `Ritirato a ${rv.retiredAge} anni` : `${rv.age} anni · ${teamLabel(rv.team)} (${LEAGUES[rv.league].name}) · OVR ${rv.overall}`;
  const rows = rivalComparisonRows(rv);
  const lead = rows[0].mine === rows[0].theirs ? "pari" : rows[0].mine > rows[0].theirs ? "mine" : "theirs";
  const verdict = !rv.history.length ? "La rivalità deve ancora cominciare."
    : lead === "pari" ? "Rivalità in perfetto equilibrio."
    : final ? (lead === "mine" ? `🏆 Hai vinto la rivalità con ${rv.firstName} ${rv.lastName}.` : `😤 ${rv.firstName} ${rv.lastName} ha vinto la rivalità.`)
    : (lead === "mine" ? "Sei avanti nella rivalità." : "Il tuo rivale è avanti: tocca a te rispondere.");
  box.innerHTML = `
    <div class="rival-head">
      <div class="avatar rival-avatar">${(rv.firstName[0] || "") + (rv.lastName[0] || "")}</div>
      <div>
        <div class="rival-name"></div>
        <div class="small-muted">${getRoleName(rv.role)}${arch ? ` (${arch.name})` : ""} · ${rv.nationality}</div>
        <div class="small-muted">${status}</div>
      </div>
    </div>
    <table class="rival-table">
      <thead><tr><th></th><th>Tu</th><th>Rivale</th></tr></thead>
      <tbody>${rows.map(r => `
        <tr><td>${r.label}</td>
          <td class="${r.mine > r.theirs ? "rv-lead" : ""}">${r.mine}</td>
          <td class="${r.theirs > r.mine ? "rv-lead" : ""}">${r.theirs}</td></tr>`).join("")}
      </tbody>
    </table>
    <p class="rival-verdict">${verdict}</p>`;
  box.querySelector(".rival-name").textContent = `${rv.firstName} ${rv.lastName}`;
}

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
  { icon: "🐐", label: "Punti GOAT in una stagione", value: h => h.goatPoints || 0, fmt: v => String(v) },
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

/* ================================================================
   RETIREMENT / FINAL SCREEN
   ================================================================ */
function computeCareerGrade() {
  const t = player.trophies;
  const trophyScore = t.rings*25 + t.domesticTitles*12 + t.euroleague*18 + (t.eurocup || 0)*8 + t.mvp*20 + t.dpoy*10 + t.finalsMvp*15 + t.allstar*4
    + t.bestFive*5 + t.bestYoung*3 + t.roy*5 + t.medals*8 + t.worldCupTitles*10 + t.eurobasketTitles*6;
  const avgPts = computeCareerTotals(player.history).avg.pts;
  const peakOvr = Math.max(...player.history.map(h=>h.overall), player.overall);

  const score = trophyScore + avgPts * 2 + peakOvr * 1.5;

  let grade, verdict;
  if (score >= 325) { grade = "S"; verdict = "Leggenda — Hall of Fame"; }
  else if (score >= 220) { grade = "A"; verdict = "Superstar riconosciuta a livello globale"; }
  else if (score >= 130) { grade = "B"; verdict = "Ottimo giocatore, protagonista per anni"; }
  else if (score >= 80) { grade = "C"; verdict = "Onesto mestierante, carriera solida"; }
  else if (score >= 40) { grade = "D"; verdict = "Comprimario, carriera altalenante"; }
  else { grade = "F"; verdict = "Busto del Draft — potenziale inespresso"; }
  return { grade, verdict, score: Math.round(score) };
}

function retirePlayer() {
  if (!player || player.retired) return;
  player.retired = true;
  player.pendingDecision = null;
  renderFinalScreen();
}

function renderFinalScreen() {
  el("screen-game").classList.add("hidden");
  el("screen-offseason").classList.add("hidden");
  el("screen-final").classList.remove("hidden");

  const { grade, verdict } = computeCareerGrade();
  const archetype = getArchetype(player.role, player.archetypeId);
  el("final-name").textContent = `#${player.jerseyNumber} ${player.firstName} ${player.lastName}`;
  el("final-years").textContent = `${getRoleName(player.role)} (${archetype ? archetype.name : ""}) · ${player.nationality} · ${player.height}cm / ${player.weight}kg · Carriera dai 16 ai ${player.age} anni (${CAREER_START_YEAR}-${player.year} · ${player.careerTotals.seasons} stagioni)`;
  el("final-grade").textContent = grade;
  el("final-grade-ring").style.borderColor = grade === "S" ? "var(--gold)" : grade === "F" ? "var(--red)" : "var(--accent)";
  el("final-grade-ring").style.boxShadow = `0 0 40px ${grade === "S" ? "rgba(255,212,71,.4)" : "var(--accent-glow)"}`;
  el("final-verdict").textContent = verdict;

  const totals = computeCareerTotals(player.history);
  const stats = [
    { v: totals.avg.pts.toFixed(1), l: "PPG carriera" },
    { v: totals.avg.reb.toFixed(1), l: "RPG carriera" },
    { v: totals.avg.ast.toFixed(1), l: "APG carriera" },
    { v: totals.avg.stl.toFixed(1), l: "SPG carriera" },
    { v: totals.avg.blk.toFixed(1), l: "BPG carriera" },
    { v: totals.avg.tov.toFixed(1), l: "TOV carriera" },
    { v: Math.max(player.overall, ...player.history.map(h=>h.overall), 0), l: "Peak Overall" },
    { v: player.goatScore || 0, l: "🐐 Punteggio GOAT" },
    { v: player.careerTotals.seasons, l: "Stagioni Giocate" },
    { v: fmtMoney(player.wealth, playerCurrency(player)), l: "Patrimonio Finale" },
    { v: player.popularity, l: "Popolarità" },
  ];
  el("final-stats-grid").innerHTML = stats.map(x => `
    <div class="sg-item"><div class="sg-val">${x.v}</div><div class="sg-lbl">${x.l}</div></div>
  `).join("");

  renderTrophyCase("final-trophy-grid");
  renderAwardHistory("final-award-history");
  renderHistoryTable("final-history-tbody");
  renderCareerTotals("final-career-totals");
  renderCareerRecords("final-career-records");
  renderCareerChart("final-career-chart");
  renderRivalCard("final-rival-card", true);
  saveCareer();
}

/* ================================================================
   SALVATAGGIO — la carriera viene salvata nel browser (localStorage) a ogni
   aggiornamento della schermata, insieme al registro della forza delle squadre.
   Tutto lo stato è dato puro: l'unica eccezione sono gli imprevisti estivi in
   sospeso, che contengono funzioni e vengono ricostruiti dal titolo al caricamento.
   ================================================================ */
const SAVE_KEY = "chosenOne.career";
const SAVE_VERSION = 5;
/* Migrazioni dei salvataggi: SAVE_MIGRATIONS[n] aggiorna sul posto un salvataggio dalla versione n
   alla n+1. Quando si aggiungono o cambiano campi dello stato si alza SAVE_VERSION e si aggiunge
   qui il passo corrispondente, così le carriere salvate con le versioni precedenti restano giocabili. */
const SAVE_MIGRATIONS = {
  // v2: stagione a tratti e partite giocate. Le stagioni già archiviate ricevono gp/games
  // stimati dall'infortunio registrato; una stagione in corso salvata con il vecchio motore
  // (già simulata per intero) prosegue con i playoff come prima.
  1(data) {
    const p = data.player;
    p.history.forEach(h => {
      const games = h.wins + h.losses;
      h.games = games;
      h.gp = Math.round(games * (1 - ((h.injury && h.injury.missedPct) || 0)));
    });
    p.careerTotals.gp = p.history.reduce((t, h) => t + h.gp, 0);
    if (p.pendingSeason && p.pendingSeason.stats && p.pendingSeason.stats.gp == null) {
      const games = p.pendingSeason.regular.wins + p.pendingSeason.regular.losses;
      p.pendingSeason.stats.games = games;
      p.pendingSeason.stats.gp = games;
    }
  },
  // v3: EuroCup contata a parte (prima le vittorie di EuroCup non comparivano in bacheca)
  2(data) {
    const p = data.player;
    const wins = comp => p.history.filter(h => h.continental && h.continental.champion && h.continental.competition === comp).length;
    p.trophies.euroleague = wins("EuroLeague");
    p.trophies.eurocup = wins("EuroCup");
  },
  // v4: momenti clutch nei playoff
  3(data) {
    data.player.clutch = data.player.clutch || { made: 0, attempts: 0 };
  },
  // v5: il rivale nasce con la carriera; le carriere già iniziate restano senza
  4(data) {
    if (data.player.rival === undefined) data.player.rival = null;
  },
};

function migrateSave(data) {
  if (typeof data.version !== "number" || data.version > SAVE_VERSION) return null; // salvataggio di una versione più recente
  while (data.version < SAVE_VERSION) {
    const step = SAVE_MIGRATIONS[data.version];
    if (!step) return null;
    step(data);
    data.version++;
  }
  return data;
}

function saveCareer() {
  if (!player) return;
  try {
    const data = { version: SAVE_VERSION, savedAt: Date.now(), player, teamStrengthRegistry };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    // storage pieno o non disponibile (es. navigazione privata): si continua senza salvare
  }
}

function loadSavedCareer() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !data.player) return null;
    return migrateSave(data);
  } catch (e) {
    return null;
  }
}

function clearSavedCareer() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* nulla da cancellare */ }
}

function findOffseasonEvent(saved) {
  return (saved && OFFSEASON_EVENTS.find(e => e.title === saved.title)) || null;
}

function resumeCareer(data) {
  player = data.player;
  resetTeamStrengths();
  Object.assign(teamStrengthRegistry, data.teamStrengthRegistry || {});

  // l'imprevisto a rischio in attesa di scelta va ricollegato alla sua definizione (con le funzioni)
  if (player.pendingOffseasonEvent) {
    const ev = findOffseasonEvent(player.pendingOffseasonEvent);
    player.pendingOffseasonEvent = ev;
    if (player.pendingDecision && player.pendingDecision.type === "offseasonChoice") player.pendingDecision.event = ev;
    if (!ev && player.pendingFinalizeCtx) {
      // imprevisto non più esistente (salvataggio di una versione precedente): lo si chiude senza effetti
      player.pendingOffseasonEvent = { title: "Imprevisto estivo", category: "" };
      el("screen-create").classList.add("hidden");
      el("screen-game").classList.remove("hidden");
      resolveOffseasonChoice(false);
      return;
    }
  }

  el("screen-create").classList.add("hidden");
  el("screen-onboarding").classList.add("hidden");
  if (player.retired) { renderFinalScreen(); return; }
  el("screen-game").classList.remove("hidden");
  switchGameTab("carriera");
  renderGameScreen();
}

/* ---------- esporta / importa: il salvataggio come file JSON ---------- */
/* Scarica un salvataggio come file .json */
function downloadSave(data) {
  const p = data.player;
  const slug = `${p.firstName}-${p.lastName}`.toLowerCase().normalize("NFD").replace(/[^a-z0-9-]+/g, "");
  const url = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `chosen-one-${slug || "carriera"}-${p.year}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("💾 Carriera esportata.");
}
function exportCareer() {
  if (!player) return;
  saveCareer();
  downloadSave({ version: SAVE_VERSION, savedAt: Date.now(), player, teamStrengthRegistry });
}

/* Un file importato può arrivare da chiunque e parti dello stato finiscono in innerHTML:
   i testi del gioco non contengono mai < o >, quindi li si rimuove da ogni stringa. */
function sanitizeImported(value) {
  if (typeof value === "string") return value.replace(/[<>]/g, "");
  if (Array.isArray(value)) return value.map(sanitizeImported);
  if (value && typeof value === "object") {
    const out = {};
    Object.keys(value).forEach(k => { out[k] = sanitizeImported(value[k]); });
    return out;
  }
  return value;
}

function isPlausibleSave(data) {
  const p = data && data.player;
  return !!(p && Array.isArray(p.history) && p.team && typeof p.team.name === "string"
    && LEAGUES[p.league] && p.trophies && p.attrs && typeof p.overall === "number");
}

function importCareerFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    let data = null;
    try { data = migrateSave(sanitizeImported(JSON.parse(reader.result))); } catch (e) { data = null; }
    if (!data || !isPlausibleSave(data)) { toast("❌ File non valido: non è un salvataggio di Chosen One (o è di una versione più recente)."); return; }
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) { /* si gioca comunque, senza salvataggio */ }
    toast(`📂 Carriera di ${data.player.firstName} ${data.player.lastName} importata.`);
    resumeCareer(data);
  };
  reader.onerror = () => toast("❌ Impossibile leggere il file.");
  reader.readAsText(file);
}

function renderSavedCareerCard() {
  const card = el("card-saved-career");
  const data = loadSavedCareer();
  if (!data) { card.classList.add("hidden"); return; }
  const p = data.player;
  const status = p.retired ? "Carriera conclusa" : `${p.age} anni · ${p.year} · ${p.team.name} (${LEAGUES[p.league].name})`;
  el("saved-career-name").textContent = `#${p.jerseyNumber} ${p.firstName} ${p.lastName}`;
  el("saved-career-meta").textContent = `${status} · OVR ${p.overall} · 🐐 ${p.goatScore || 0} · ${p.history.length} stagioni`;
  el("btn-resume-career").textContent = p.retired ? "📜 Rivedi carriera" : "▶️ Continua carriera";
  card.classList.remove("hidden");
}

/* ================================================================
   EVENT WIRING
   ================================================================ */
function switchGameTab(tab) {
  document.querySelectorAll("#game-tabs .tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.toggle("active", p.dataset.tabPanel === tab));
}

/* Tastiera: le card cliccabili che non sono <button> (role="button") si attivano anche con
   Invio e Spazio, come un pulsante vero. */
document.addEventListener("keydown", evt => {
  if (evt.key !== "Enter" && evt.key !== " ") return;
  const target = evt.target;
  if (!(target instanceof Element) || target.getAttribute("role") !== "button" || target.tagName === "BUTTON") return;
  evt.preventDefault();
  target.dispatchEvent(new MouseEvent("click", { bubbles: true }));
});

document.addEventListener("DOMContentLoaded", () => {
  initCreationScreen();
  renderSavedCareerCard();
  el("btn-resume-career").addEventListener("click", () => {
    const data = loadSavedCareer();
    if (data) resumeCareer(data);
  });
  el("btn-export-save").addEventListener("click", () => {
    const data = loadSavedCareer();
    if (data) downloadSave(data);
  });
  el("btn-export-career").addEventListener("click", exportCareer);
  el("inp-import-save").addEventListener("change", evt => {
    importCareerFile(evt.target.files[0]);
    evt.target.value = "";
  });
  el("btn-delete-save").addEventListener("click", () => {
    if (!confirm("Eliminare definitivamente la carriera salvata?")) return;
    clearSavedCareer();
    renderSavedCareerCard();
  });
  document.querySelectorAll("#game-tabs .tab-btn").forEach(b => b.addEventListener("click", () => switchGameTab(b.dataset.tab)));
  el("btn-advance").addEventListener("click", advanceSeason);
  el("btn-trade").addEventListener("click", requestTrade);
  el("btn-trophy-close").addEventListener("click", hideTrophyAnimation);
  el("trophy-overlay").addEventListener("click", (e) => { if (e.target.id === "trophy-overlay") hideTrophyAnimation(); });
  el("btn-retire").addEventListener("click", () => {
    if (!player || player.history.length === 0) { toast("Gioca almeno una stagione prima di ritirarti."); return; }
    if (confirm("Sei sicuro di voler concludere la carriera ora?")) retirePlayer();
  });
  el("btn-new-career").addEventListener("click", () => {
    player = null;
    clearSavedCareer();
    resetTeamStrengths();
    pendingCreation = null;
    standingsViewConference = null;
    selRole = null; selArchetypeId = null; selPath = null;
    customMode = false; el("inp-custom-mode").checked = false; el("card-custom-ratings").classList.add("hidden");
    document.querySelectorAll(".choice-card.selected, .court-pos.selected").forEach(c=>c.classList.remove("selected"));
    el("inp-firstname").value = ""; el("inp-lastname").value = "";
    renderArchetypeGrid(null);
    popupQueue = []; popupActive = false;
    el("trophy-overlay").classList.add("hidden");
    el("trophy-confetti").innerHTML = "";
    el("screen-onboarding").classList.add("hidden");
    el("screen-final").classList.add("hidden");
    el("screen-offseason").classList.add("hidden");
    el("screen-create").classList.remove("hidden");
    renderSavedCareerCard();
  });
});
