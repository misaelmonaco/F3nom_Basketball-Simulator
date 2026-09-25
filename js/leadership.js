"use strict";

/* ================================================================
   LEADERSHIP — da veterano la società può affidarti un giovane da far crescere (qualche
   minuto in meno per te, stima e fiducia in più; anni dopo magari diventa una stella che
   ti cita come modello), e dopo qualche stagione nello stesso club arriva la fascia di
   capitano, con le crisi di spogliatoio da gestire in prima persona.
   ================================================================ */
const MENTOR_MIN_AGE = 29;
const MENTOR_MINUTES = 1.5; // minuti a partita ceduti all'allievo
const MENTOR_SEASONS = 4;

/* ---------- mentore e allievo ---------- */
function maybeMentorOffer(p, next) {
  if (p.age < MENTOR_MIN_AGE || p.mentee || !rollChance(25)) return next;
  const nationality = nationalityOfLeague(p.league, 40);
  const mentee = { name: randomFullName(nationality), role: choice(ROLES).id, overall: randInt(58, 64), potential: randInt(78, 96), team: p.team.name, since: p.year, seasons: 0, star: false };
  return { type: "mentorOffer", mentee, next };
}
function resolveMentorOffer(accept) {
  const d = player.pendingDecision;
  if (!d || d.type !== "mentorOffer") return;
  if (accept) {
    player.mentee = { ...d.mentee, active: true };
    pushNews(`🎓 ${player.team.name} ti affida ${d.mentee.name}, ${getRoleName(d.mentee.role)} di belle speranze.`);
  }
  player.pendingDecision = d.next;
  renderGameScreen();
}
function menteeActive(p) { return !!(p.mentee && p.mentee.active && p.mentee.team === p.team.name); }

/* Fine stagione: l'allievo cresce; la mentorship dura qualche stagione o finché resti nel club */
function menteeSeasonUpdate(p) {
  const m = p.mentee;
  if (!m || m.star) return null;
  const grow = () => { m.overall = clamp(m.overall + Math.round(randInt(3, 7) * clamp((m.potential - m.overall) / 15, 0.3, 1)), 40, m.potential); };
  let note = null;
  if (m.active && m.team !== p.team.name) {
    m.active = false;
    note = `🎓 Lasciando ${m.team} saluti anche ${m.name}.`;
  } else if (m.active) {
    m.seasons++;
    grow();
    changeReputation(p, 1);
    changeCoachTrust(p, 2);
    note = `🎓 ${m.name} cresce al tuo fianco: ora ha ${m.overall} di overall.`;
    if (m.seasons >= MENTOR_SEASONS) { m.active = false; note += " È pronto a volare da solo."; }
  } else if (m.overall < m.potential && p.year - m.since <= 10) {
    grow(); // anche senza di te continua a crescere, e la lega si ricorda chi l'ha lanciato
  }
  if (m.overall >= 80) {
    m.star = true;
    changeReputation(p, 3);
    note = `🌟 ${m.name} è diventato una stella (OVR ${m.overall}): "Devo tutto a ${p.firstName} ${p.lastName}".`;
  }
  if (note) pushNews(note);
  return note;
}

function renderMentorOffer(d, titleEl, subEl, cards) {
  const m = d.mentee;
  titleEl.textContent = "Un giovane da far crescere";
  subEl.textContent = `La società vuole affidarti ${m.name}, ${getRoleName(m.role)} di ${m.overall} di overall con un grande potenziale. Ti costa ${MENTOR_MINUTES} minuti a partita, ma la lega apprezza chi fa crescere i giovani.`;
  cards.innerHTML =
    offCardHtml({ idx: 0, icon: "🎓", iconTone: "var(--accent-2)", title: "Fagli da mentore", subtitle: `Per ${MENTOR_SEASONS} stagioni`,
      desc: `Reputazione +1 e fiducia del coach +2 a ogni stagione, −${MENTOR_MINUTES} minuti a partita. Se diventa una stella, la stima per te sale ancora.` }) +
    offCardHtml({ idx: 1, icon: "🙅", title: "Preferisco pensare a me", subtitle: "Nessun impegno", desc: "Tieni tutti i tuoi minuti." });
  cards.querySelector('[data-idx="0"]').addEventListener("click", () => resolveMentorOffer(true));
  cards.querySelector('[data-idx="1"]').addEventListener("click", () => resolveMentorOffer(false));
}

/* ---------- capitano ---------- */
function consecutiveSeasonsWithTeam(p) {
  let n = 0;
  for (let i = p.history.length - 1; i >= 0 && p.history[i].team.name === p.team.name; i--) n++;
  return n;
}
function isCaptain(p) { return !!(p.captain && p.captain.team === p.team.name); }

/* Fine stagione: la fascia arriva a chi è da anni nel club ed è stimato; cambiando squadra la si perde */
function updateCaptaincy(p) {
  if (p.captain && p.captain.team !== p.team.name) p.captain = null;
  if (isCaptain(p)) {
    p.chemistry = clamp(p.chemistry + 3, 0, 100);
    changeReputation(p, 1);
    return null;
  }
  if (p.age >= 23 && consecutiveSeasonsWithTeam(p) >= 4 && p.chemistry >= 60 && coachTrustOf(p) >= 55 && rollChance(20)) {
    p.captain = { team: p.team.name, since: p.year + 1 };
    p.captainCount = (p.captainCount || 0) + 1;
    changeReputation(p, 2);
    toast(`🎖️ ${p.team.name} ti nomina capitano!`);
    return `🎖️ Nominato capitano di ${p.team.name}.`;
  }
  return null;
}

/* Crisi di spogliatoio: solo per il capitano */
SEASON_SITUATIONS.push({
  id: "lockerRoom", icon: "🎖️", title: "Crisi di spogliatoio", conditional: true,
  desc: "Due compagni sono arrivati alle mani dopo l'allenamento e metà squadra non parla più con l'altra metà. Da capitano, tocca a te.",
  options: [
    { id: "meeting", label: "Riunione di squadra", desc: "Chiudi tutti nello spogliatoio finché non si chiarisce: può ricompattare il gruppo o spaccarlo del tutto." },
    { id: "side", label: "Difendi il più giovane", desc: "Ti schieri apertamente: il ragazzo te ne sarà grato, i veterani meno." },
    { id: "coach", label: "Lascia fare al coach", desc: "Nessun rischio, ma la fascia pesa meno." },
  ],
  apply(p, optionId, b) {
    if (optionId === "coach") { p.chemistry = clamp(p.chemistry - 3, 0, 100); return "Hai lasciato che se ne occupasse il coach: qualcuno si aspettava di più dal capitano."; }
    if (optionId === "side") {
      p.chemistry = clamp(p.chemistry - 2, 0, 100); changeCoachTrust(p, 3); b.winBonus += 0.01;
      return "Il ragazzo si è sentito protetto e gioca meglio; qualche veterano mugugna.";
    }
    if (rollChance(50 + (reputationOf(p) - 50) * 0.6 + (p.chemistry - 50) * 0.3)) {
      p.chemistry = clamp(p.chemistry + 10, 0, 100); changeReputation(p, 2); b.winBonus += 0.05;
      return "La riunione ha funzionato: la squadra esce dallo spogliatoio più unita di prima.";
    }
    p.chemistry = clamp(p.chemistry - 8, 0, 100); b.winBonus -= 0.03;
    return "La riunione è degenerata: lo spogliatoio resta spaccato.";
  },
});
