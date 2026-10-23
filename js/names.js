"use strict";

/* ================================================================
   NOMI PER NAZIONALITÀ — giocatore, allenatori e stelle delle squadre prendono nomi
   coerenti con il loro paese (il nome del giocatore resta comunque modificabile).
   ================================================================ */
const NAMES_BY_NATIONALITY = {
  "USA": {
    first: ["Jaylen", "Marcus", "Tyrese", "DeAndre", "Malik", "Jordan", "Cameron", "Isaiah", "Darius", "Trey", "Brandon", "Jalen", "Kevin", "Anthony", "Devin", "Terrence", "Zion", "Caleb"],
    last: ["Johnson", "Williams", "Brown", "Davis", "Harris", "Jackson", "Thompson", "Walker", "Robinson", "Mitchell", "Carter", "Coleman", "Brooks", "Bryant", "Hayes", "Freeman", "Wallace", "Porter"],
  },
  "Italia": {
    first: ["Marco", "Luca", "Andrea", "Matteo", "Alessandro", "Simone", "Nicolò", "Davide", "Riccardo", "Stefano", "Gabriele", "Lorenzo", "Tommaso", "Federico", "Giacomo", "Paolo"],
    last: ["Rossi", "Bianchi", "Ferrari", "Esposito", "Romano", "Colombo", "Ricci", "Marino", "Greco", "Bruno", "Gallo", "Conti", "Mancini", "Moretti", "Fontana", "Barbieri"],
  },
  "Spagna": {
    first: ["Pablo", "Sergio", "Álvaro", "Javier", "Carlos", "Diego", "Rubén", "Alejandro", "Marc", "Jorge", "Daniel", "Víctor", "Hugo", "Adrián", "Iván"],
    last: ["García", "Fernández", "González", "Rodríguez", "López", "Martínez", "Sánchez", "Pérez", "Navarro", "Ruiz", "Díaz", "Moreno", "Jiménez", "Hernangómez", "Llull"],
  },
  "Francia": {
    first: ["Théo", "Lucas", "Hugo", "Nicolas", "Antoine", "Maxime", "Mathis", "Killian", "Evan", "Rudy", "Timothé", "Bilal", "Yanis", "Olivier", "Julien"],
    last: ["Martin", "Bernard", "Dubois", "Laurent", "Lefèvre", "Moreau", "Girard", "Fournier", "Mercier", "Blanc", "Garnier", "Faure", "Rousseau", "Diallo", "Traoré"],
  },
  "Turchia": {
    first: ["Emre", "Mehmet", "Cedi", "Furkan", "Ahmet", "Burak", "Kerem", "Alperen", "Onur", "Can", "Ömer", "Mert", "Yiğit", "Sertaç", "Ercan"],
    last: ["Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Yıldız", "Aydın", "Öztürk", "Arslan", "Doğan", "Korkmaz", "Koç", "Kurt", "Özdemir", "Polat"],
  },
  "Serbia": {
    first: ["Nikola", "Stefan", "Bogdan", "Vasilije", "Miloš", "Marko", "Aleksa", "Nemanja", "Filip", "Uroš", "Dušan", "Luka", "Vladimir", "Ognjen"],
    last: ["Jović", "Petrović", "Nikolić", "Marković", "Đorđević", "Stojanović", "Ilić", "Kovačević", "Pavlović", "Milutinov", "Bogdanović", "Micić", "Avramović", "Lazić"],
  },
  "Grecia": {
    first: ["Giorgos", "Nikos", "Kostas", "Dimitris", "Vasilis", "Ioannis", "Thanasis", "Kostis", "Panagiotis", "Michalis", "Stavros", "Alexandros", "Christos"],
    last: ["Papadopoulos", "Papanikolaou", "Georgiou", "Dimitriou", "Antetokounmpo", "Sloukas", "Kalaitzakis", "Printezis", "Papagiannis", "Mitoglou", "Larentzakis", "Kouzelis"],
  },
  "Lituania": {
    first: ["Jonas", "Domantas", "Mindaugas", "Rokas", "Arvydas", "Tomas", "Lukas", "Mantas", "Ignas", "Paulius", "Marius", "Deividas", "Gytis"],
    last: ["Valančiūnas", "Kazlauskas", "Jankūnas", "Grigonis", "Kuzminskas", "Motiejūnas", "Petrauskas", "Butkevičius", "Sirvydis", "Masiulis", "Juškevičius", "Lekavičius"],
  },
  "Croazia": {
    first: ["Dario", "Bojan", "Ivica", "Mario", "Roko", "Luka", "Ante", "Krunoslav", "Filip", "Ivan", "Matej", "Toni", "Domagoj"],
    last: ["Šarić", "Bogdanović", "Zubac", "Hezonja", "Prkačin", "Kovač", "Horvat", "Babić", "Marić", "Jurić", "Perić", "Tomić", "Knežević"],
  },
  "Slovenia": {
    first: ["Luka", "Goran", "Klemen", "Jaka", "Žiga", "Aleksej", "Edo", "Vlatko", "Gregor", "Rok", "Matic", "Blaž", "Mike"],
    last: ["Novak", "Horvat", "Kovačič", "Krajnc", "Zupan", "Prepelič", "Blažič", "Dimec", "Hrovat", "Tobey", "Rebec", "Murić", "Čančar"],
  },
  "Germania": {
    first: ["Dennis", "Franz", "Moritz", "Maximilian", "Johannes", "Daniel", "Andreas", "Isaac", "Niels", "Lukas", "Tim", "Jonas", "Leon", "David"],
    last: ["Schröder", "Wagner", "Müller", "Schmidt", "Fischer", "Weber", "Hartenstein", "Theis", "Obst", "Voigtmann", "Bonga", "Lo", "Becker", "Hoffmann"],
  },
  "Polonia": {
    first: ["Mateusz", "Jakub", "Michał", "Aleksander", "Kamil", "Łukasz", "Adam", "Tomasz", "Przemysław", "Marcin", "Jeremy", "Szymon"],
    last: ["Nowak", "Kowalski", "Wiśniewski", "Ponitka", "Balcerowski", "Sokołowski", "Waczyński", "Lewandowski", "Zieliński", "Szymański", "Woźniak", "Kamiński"],
  },
  "Ucraina": {
    first: ["Sviatoslav", "Oleksandr", "Artem", "Vyacheslav", "Illia", "Denys", "Maksym", "Bohdan", "Yurii", "Dmytro", "Andrii", "Volodymyr"],
    last: ["Mykhailiuk", "Len", "Pustovyi", "Bobrov", "Sydorov", "Lypovyy", "Herun", "Kovalenko", "Shevchenko", "Bondarenko", "Tkachenko", "Kravchenko"],
  },
  "Canada": {
    first: ["Shai", "Jamal", "RJ", "Andrew", "Dillon", "Kelly", "Tristan", "Cory", "Lu", "Dwight", "Nickeil", "Bennedict", "Zach"],
    last: ["Gilgeous-Alexander", "Murray", "Barrett", "Wiggins", "Brooks", "Olynyk", "Thompson", "Joseph", "Dort", "Powell", "Alexander-Walker", "Mathurin", "Edey"],
  },
  "Australia": {
    first: ["Josh", "Patty", "Joe", "Dante", "Matisse", "Jock", "Dyson", "Xavier", "Mitch", "Nick", "Chris", "Will", "Tyrese"],
    last: ["Giddey", "Mills", "Ingles", "Exum", "Thybulle", "Landale", "Daniels", "Cooks", "Creek", "Kay", "Goulding", "Magnay", "Proctor"],
  },
  "Argentina": {
    first: ["Facundo", "Luis", "Nicolás", "Gabriel", "Leandro", "Marcos", "Patricio", "Juan", "Tomás", "Agustín", "Franco", "José", "Manu"],
    last: ["Campazzo", "Scola", "Laprovíttola", "Deck", "Bolmaro", "Delía", "Garino", "Vildoza", "Brussino", "González", "Fernández", "Romero", "Ginóbili"],
  },
  "Brasile": {
    first: ["Bruno", "Raul", "Cristiano", "Anderson", "Leandro", "Marcelinho", "Yago", "Gui", "Lucas", "Didi", "Vitor", "Rafael", "Georginho"],
    last: ["Caboclo", "Neto", "Felício", "Varejão", "Barbosa", "Huertas", "Santos", "Mathias", "Silva", "Louzada", "Benite", "Oliveira", "Souza"],
  },
  "Nigeria": {
    first: ["Chimezie", "Josh", "Precious", "Ike", "Ekpe", "Obi", "Chuma", "Emeka", "Michael", "Jordan", "Stanley", "Oshae", "Chinedu"],
    last: ["Metu", "Okogie", "Achiuwa", "Diogu", "Udoh", "Toppin", "Okeke", "Nwora", "Eboigbe", "Okafor", "Brown", "Nnaji", "Uzoh"],
  },
  "Corea del Sud": {
    first: ["Ji-hoon", "Min-jun", "Seung-hyun", "Hyun-woo", "Jun-ho", "Dong-hyun", "Sung-min", "Ha-seung", "Jae-won", "Tae-yang", "Seo-jun", "Woo-jin"],
    last: ["Kim", "Lee", "Park", "Choi", "Jung", "Kang", "Cho", "Yoon", "Jang", "Lim", "Han", "Oh", "Seo", "Yeo"],
  },
  "Giappone": {
    first: ["Rui", "Yuta", "Yuki", "Makoto", "Kai", "Hiroto", "Kosuke", "Daiki", "Ren", "Yudai", "Takumi", "Shota", "Haruto"],
    last: ["Hachimura", "Watanabe", "Kawamura", "Tominaga", "Hiejima", "Baba", "Tanaka", "Suzuki", "Takahashi", "Sato", "Kobayashi", "Yoshida", "Nakamura"],
  },
  "Cina": {
    first: ["Wei", "Jun", "Hao", "Ming", "Lei", "Yi", "Zhou", "Kai", "Bo", "Qi", "Jian", "Tao", "Xin"],
    last: ["Wang", "Li", "Zhang", "Liu", "Chen", "Yang", "Zhao", "Huang", "Zhou", "Wu", "Hu", "Guo", "Sun"],
  },
};

/* Nome e cognome casuali per una nazionalità (se sconosciuta, da un paese qualunque) */
function randomNameFor(nationality) {
  const pool = NAMES_BY_NATIONALITY[nationality] || NAMES_BY_NATIONALITY[choice(Object.keys(NAMES_BY_NATIONALITY))];
  return { first: choice(pool.first), last: choice(pool.last) };
}
function randomFullName(nationality) {
  const n = randomNameFor(nationality);
  return `${n.first} ${n.last}`;
}

/* Nazionalità "tipica" di chi lavora in una lega: il paese della lega; negli USA e in Europa
   una parte dei protagonisti arriva comunque dall'estero */
function nationalityOfLeague(leagueId, foreignShare) {
  const league = LEAGUES[leagueId];
  const country = league ? (league.homeNations ? choice(league.homeNations) : league.country) : null;
  if (!country || !NAMES_BY_NATIONALITY[country] || rollChance(foreignShare == null ? 25 : foreignShare)) return choice(NATIONALITIES);
  return country;
}

/* ================================================================
   NOMI FEMMINILI PER NAZIONALITÀ — usati per relazioni, fidanzate/partner
   nella sezione "Vita Privata & Sentimenti" ed eventi di famiglia.
   ================================================================ */
const FEMALE_NAMES_BY_NATIONALITY = {
  "USA": [
    "Jessica", "Taylor", "Emma", "Olivia", "Chloe", "Madison", "Ashley", "Brianna",
    "Samantha", "Maya", "Aaliyah", "Harper", "Kayla", "Zoe", "Sydney", "Amber",
    "Hailey", "Kendall", "Jasmine", "Morgan", "Savannah", "Riley", "Alexis", "Brooke"
  ],
  "Italia": [
    "Giulia", "Chiara", "Sofia", "Martina", "Francesca", "Elena", "Sara", "Alice",
    "Valentina", "Giorgia", "Beatrice", "Camilla", "Alessia", "Federica", "Silvia",
    "Vittoria", "Ludovica", "Elisa", "Greta", "Marta", "Aurora", "Ginevra", "Noemi"
  ],
  "Spagna": [
    "Lucía", "Carmen", "Paula", "María", "Sara", "Alba", "Claudia", "Valeria",
    "Marta", "Carla", "Laura", "Inés", "Natalia", "Elena", "Irene", "Ainhoa",
    "Adriana", "Blanca", "Jimena"
  ],
  "Francia": [
    "Camille", "Léa", "Chloé", "Manon", "Emma", "Juliette", "Inès", "Louise",
    "Sarah", "Clara", "Mathilde", "Océane", "Margaux", "Anaïs", "Zoé", "Jade",
    "Ambre", "Alice", "Romane"
  ],
  "Turchia": [
    "Elif", "Zeynep", "Defne", "Ece", "Melis", "Selin", "Aslı", "Deniz",
    "Ceren", "Derya", "Işıl", "Ezgi", "Büşra", "Leyla", "Damla"
  ],
  "Serbia": [
    "Ana", "Milica", "Jelena", "Marija", "Jovana", "Teodora", "Sara", "Katarina",
    "Dunja", "Anja", "Milena", "Ivana", "Mina", "Tamara"
  ],
  "Grecia": [
    "Eleni", "Maria", "Katerina", "Sofia", "Dimitra", "Ioanna", "Anastasia",
    "Vasiliki", "Christina", "Despina", "Georgia", "Antonia", "Marina"
  ],
  "Lituania": [
    "Gabija", "Austėja", "Emilija", "Kamilė", "Urtė", "Viltė", "Ieva",
    "Rasa", "Greta", "Dovilė", "Viktorija", "Gintarė", "Eglė"
  ],
  "Croazia": [
    "Mia", "Lucija", "Petra", "Ema", "Sara", "Lana", "Nika", "Marta",
    "Iva", "Dora", "Anamarija", "Klara", "Tea"
  ],
  "Slovenia": [
    "Eva", "Sara", "Lara", "Nika", "Maja", "Zala", "Ana", "Nina",
    "Tia", "Kaja", "Pia", "Tina", "Neža", "Ajda"
  ],
  "Germania": [
    "Hannah", "Mia", "Sophia", "Emma", "Lea", "Lena", "Laura", "Anna",
    "Lara", "Julia", "Clara", "Nele", "Sophie", "Marie", "Charlotte"
  ],
  "Polonia": [
    "Zuzanna", "Julia", "Maja", "Zofia", "Hanna", "Aleksandra", "Natalia",
    "Wiktoria", "Oliwia", "Alicja", "Karolina", "Pola", "Maria"
  ],
  "Ucraina": [
    "Anastasiia", "Daryna", "Yuliia", "Anna", "Sofiya", "Kateryna",
    "Viktoriia", "Olha", "Polina", "Olena", "Valeriia", "Mariia"
  ],
  "Canada": [
    "Emily", "Olivia", "Maya", "Chloe", "Sarah", "Brooke", "Sierra",
    "Hannah", "Autumn", "Lauren", "Audrey", "Claire", "Abigail"
  ],
  "Australia": [
    "Isla", "Charlotte", "Amelia", "Ruby", "Grace", "Matilda", "Harper",
    "Sienna", "Phoebe", "Zara", "Mia", "Willow", "Chloe"
  ],
  "Argentina": [
    "Camila", "Valentina", "Martina", "Florencia", "Catalina", "Lucía",
    "Delfina", "Micaela", "Julieta", "Rocío", "Sofía", "Milagros"
  ],
  "Brasile": [
    "Beatriz", "Larissa", "Mariana", "Isabela", "Camila", "Bruna",
    "Juliana", "Fernanda", "Rafaela", "Gabriela", "Luana", "Giovanna"
  ],
  "Nigeria": [
    "Chioma", "Amina", "Ngozi", "Zainab", "Blessing", "Chiamaka",
    "Folashade", "Halima", "Adaeze", "Yetunde", "Amara", "Faith"
  ],
  "Corea del Sud": [
    "Ji-woo", "Seo-yeon", "Ha-eun", "Min-seo", "Soo-jin", "Ji-min",
    "Ye-eun", "Yuna", "Chae-won", "Eun-ji", "Da-eun", "Yu-jin"
  ],
  "Giappone": [
    "Yui", "Aoi", "Hina", "Sakura", "Rin", "Mio", "Nanami", "Mei",
    "Kanna", "Akari", "Misaki", "Yuna", "Koharu"
  ],
  "Cina": [
    "Ying", "Mei", "Jing", "Xiao", "Ting", "Ling", "Yan", "Hui",
    "Lan", "Fang", "Yu", "Qian", "Xue", "Jia"
  ],
};

function randomFemaleName(nationality) {
  const pool = FEMALE_NAMES_BY_NATIONALITY[nationality] || FEMALE_NAMES_BY_NATIONALITY[choice(Object.keys(FEMALE_NAMES_BY_NATIONALITY))];
  return choice(pool || FEMALE_NAMES_BY_NATIONALITY["Italia"]);
}

