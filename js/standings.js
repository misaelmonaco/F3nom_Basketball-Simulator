"use strict";

/* Classifica e piccoli helper di presentazione delle squadre. */

function teamDot(team) {
  return `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${team.colors[0]};border:1.5px solid ${team.colors[1]};margin-right:5px;vertical-align:middle;"></span>`;
}
function teamLabel(team) { return `${teamDot(team)}${team.name}`; }
function teamLabelText(team) { return team.name; }

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
