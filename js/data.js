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
  { id:"USA_HS", name:"USA High School", icon:"🎓", desc:"Porta a College NCAA Division I e G-League" },
  { id:"EU_YOUTH", name:"Europa Youth Academy", icon:"🌍", desc:"Porta a LBA/Serie A2 (Italia), Liga ACB (Spagna), Betclic Élite (Francia), BSL (Turchia)" },
];


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
    name: "LBA (Serie A1)", continent: "Europa", country: "Italia", relegatesTo: "ITA_A2",
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
    name: "Serie A2", continent: "Europa", country: "Italia", promotesTo: "ITA_LBA", relegatesTo: "ITA_B",
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
  ITA_B: {
    name: "Serie B Nazionale", continent: "Europa", country: "Italia", promotesTo: "ITA_A2",
    avgOverall: 56, strengthRange: [0.08, 0.38], salaryMult: 0.01, salaryFloor: 0.008,
    teams: [
      T("Agrigento BiancoAzzurro","Agrigento","#FFFFFF","#3EA6E0"), T("Casale Monferrato RossoBlu","Casale Monferrato","#D0021B","#003DA5"),
      T("Chiusi BiancoArancio","Chiusi","#FFFFFF","#F58220"), T("Fabriano BiancoBlu","Fabriano","#FFFFFF","#003DA5"),
      T("Faenza BiancoRosso","Faenza","#FFFFFF","#D0021B"), T("Firenze BiancoViola","Firenze","#FFFFFF","#5A2D81"),
      T("Imola BiancoRosso","Imola","#FFFFFF","#D0021B"), T("Jesi BiancoAzzurro","Jesi","#FFFFFF","#3EA6E0"),
      T("Legnano GialloBlu","Legnano","#FFD100","#003DA5"), T("Lucca BiancoRosso","Lucca","#FFFFFF","#D0021B"),
      T("Omegna RossoNero","Omegna","#D0021B","#000000"), T("Piacenza BiancoRosso","Piacenza","#FFFFFF","#D0021B"),
      T("Ravenna GialloRosso","Ravenna","#FFD100","#D0021B"), T("Roseto BiancoBlu","Roseto degli Abruzzi","#FFFFFF","#003DA5"),
      T("Salerno GranataBianco","Salerno","#6D2932","#FFFFFF"), T("San Severo GialloNero","San Severo","#FFD100","#000000"),
    ]
  },
  GRE_GBL: {
    name: "Greek Basket League", continent: "Europa", country: "Grecia",
    avgOverall: 73, strengthRange: [0.35, 0.93], salaryMult: 0.085, salaryFloor: 0.04,
    teams: [
      T("Olympiacos","Pireo","#D0021B","#FFFFFF","EL"), T("Panathinaikos","Atene","#046A38","#FFFFFF","EL"),
      T("AEK Atene","Atene","#FFD100","#000000","EC"), T("PAOK","Salonicco","#000000","#FFFFFF","EC"),
      T("Aris","Salonicco","#FFD100","#000000"), T("Peristeri","Atene","#003DA5","#FFFFFF"),
      T("Promitheas Patrasso","Patrasso","#D0021B","#FFD100"), T("Kolossos Rodi","Rodi","#003DA5","#FFD100"),
      T("Lavrio","Lavrio","#003DA5","#FFFFFF"), T("Maroussi","Atene","#D0021B","#FFFFFF"),
      T("Karditsa","Karditsa","#046A38","#FFFFFF"), T("Panionios","Atene","#7A0019","#003DA5"),
    ]
  },
  ABA: {
    name: "Lega Adriatica (ABA)", continent: "Europa", country: "Serbia", homeNations: ["Serbia", "Croazia", "Slovenia"],
    avgOverall: 73, strengthRange: [0.38, 0.92], salaryMult: 0.085, salaryFloor: 0.04,
    teams: [
      T("Partizan","Belgrado","#000000","#FFFFFF","EL"), T("Crvena zvezda","Belgrado","#D0021B","#FFFFFF","EL"),
      T("Dubai Basketball","Dubai","#000000","#C8A24A","EL"), T("Cedevita Olimpija","Lubiana","#046A38","#FFD100","EC"),
      T("Budućnost","Podgorica","#003DA5","#FFFFFF","EC"), T("Cibona","Zagabria","#003DA5","#FFFFFF"),
      T("Igokea","Aleksandrovac","#D0021B","#003DA5"), T("Mega Basket","Belgrado","#F58220","#000000"),
      T("FMP","Belgrado","#003DA5","#FFFFFF"), T("Split","Spalato","#FFD100","#003DA5"),
      T("Zadar","Zara","#003DA5","#FFFFFF"), T("Borac Čačak","Čačak","#D0021B","#FFFFFF"),
      T("Krka","Novo Mesto","#046A38","#FFFFFF"), T("SC Derby","Podgorica","#003DA5","#D0021B"),
    ]
  },
  NBL: {
    name: "NBL (Australia)", continent: "Oceania", country: "Australia",
    avgOverall: 70, strengthRange: [0.4, 0.86], salaryMult: 0.06, salaryFloor: 0.05,
    teams: [
      T("Sydney Kings","Sydney","#5A2D81","#FFD100"), T("Melbourne United","Melbourne","#002F6C","#FFFFFF"),
      T("Perth Wildcats","Perth","#D0021B","#FFFFFF"), T("Brisbane Bullets","Brisbane","#7A0019","#FFD100"),
      T("Adelaide 36ers","Adelaide","#D0021B","#000000"), T("Illawarra Hawks","Wollongong","#D0021B","#FFFFFF"),
      T("Tasmania JackJumpers","Hobart","#046A38","#FFD100"), T("New Zealand Breakers","Auckland","#000000","#FFFFFF"),
      T("Cairns Taipans","Cairns","#F58220","#000000"), T("South East Melbourne Phoenix","Melbourne","#D0021B","#F58220"),
    ]
  },
  CBA: {
    name: "CBA (Cina)", continent: "Asia", country: "Cina",
    avgOverall: 70, strengthRange: [0.35, 0.86], salaryMult: 0.16, salaryFloor: 0.1,
    teams: [
      T("Guangdong Southern Tigers","Dongguan","#D0021B","#FFD100"), T("Liaoning Flying Leopards","Shenyang","#003DA5","#FFFFFF"),
      T("Zhejiang Lions","Hangzhou","#D0021B","#FFFFFF"), T("Beijing Ducks","Pechino","#D0021B","#000000"),
      T("Shanghai Sharks","Shanghai","#003DA5","#FFFFFF"), T("Shenzhen Leopards","Shenzhen","#000000","#F58220"),
      T("Xinjiang Flying Tigers","Urumqi","#003DA5","#FFD100"), T("Shandong Heroes","Jinan","#F58220","#FFFFFF"),
      T("Beijing Royal Fighters","Pechino","#5A2D81","#FFD100"), T("Guangzhou Loong Lions","Canton","#046A38","#FFFFFF"),
      T("Qingdao Eagles","Qingdao","#D0021B","#003DA5"), T("Nanjing Monkey Kings","Nanchino","#FFD100","#000000"),
      T("Fujian Sturgeons","Jinjiang","#003DA5","#D0021B"), T("Tianjin Pioneers","Tianjin","#003DA5","#FFFFFF"),
    ]
  },
};

const EU_TOP_LEAGUES = ["ITA_LBA","ESP_ACB","FRA_ELITE","TUR_BSL"];

function pickTeam(leagueId) { return choice(LEAGUES[leagueId].teams); }

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
    win: 0.05, playoff: 0.06, clutch: 0.06, growth: 1.12, injury: 0.75, negotiation: 0.08 },
  { id: "normal", icon: "⚖️", label: "Normale", desc: "L'esperienza pensata per il gioco: vincere un titolo è un'impresa, non una formalità.",
    win: 0, playoff: 0, clutch: 0, growth: 1, injury: 1, negotiation: 0 },
  { id: "hard", icon: "🔥", label: "Difficile", desc: "Avversari più cinici, dirigenze più dure e un fisico che perdona meno.",
    win: -0.03, playoff: -0.035, clutch: -0.04, growth: 0.95, injury: 1.15, negotiation: -0.05 },
  { id: "legend", icon: "👑", label: "Leggenda", desc: "Per chi vuole sudarsi ogni anello: solo una carriera perfetta arriva in cima.",
    win: -0.06, playoff: -0.07, clutch: -0.08, growth: 0.9, injury: 1.3, negotiation: -0.1 },
];
