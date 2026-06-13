// Análise do 1º Open Test do microChess
// Uso: node analytics/analisar.js
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'microchess-export-1781226642033.json');
const d = JSON.parse(fs.readFileSync(file, 'utf8'));

const { players, matches, events, ccu_snapshots, singleplayer_progress } = d;

// ---- helpers ----
const fmtMs = (ms) => {
  if (!ms || ms < 0) return '0s';
  const s = Math.round(ms / 1000);
  if (s < 60) return s + 's';
  const m = Math.floor(s / 60);
  const rs = s % 60;
  return m + 'm' + (rs ? rs + 's' : '');
};
const pct = (n, total) => total ? (100 * n / total).toFixed(1) + '%' : '0%';
const byId = Object.fromEntries(players.map(p => [p.id, p]));
const name = (id) => byId[id]?.username || (id?.startsWith('bot_') ? 'BOT' : '(convidado)');
const out = [];
const L = (s = '') => out.push(s);

// ============================================================
// 1. JANELA DO TESTE
// ============================================================
const evTs = events.map(e => e.ts);
const tMin = Math.min(...evTs), tMax = Math.max(...evTs);
const realCCU = ccu_snapshots.filter(c => c.count > 0);
const dur = tMax - tMin;

L('# Análise — 1º Open Test microChess');
L('');
L(`Exportado em: ${d.exportedAt}`);
L('');
L('## 1. Janela do teste');
L('');
L(`- Primeiro evento: ${new Date(tMin).toISOString()}`);
L(`- Último evento: ${new Date(tMax).toISOString()}`);
L(`- Duração da atividade principal: ${fmtMs(dur)}`);
L('');

// ============================================================
// 2. AQUISIÇÃO DE USUÁRIOS
// ============================================================
const registros = events.filter(e => e.type === 'register_success');
const sessionsStart = events.filter(e => e.type === 'session_start');
L('## 2. Usuários');
L('');
L(`- Contas registradas (na tabela players): **${players.length}**`);
L(`- Eventos register_success: **${registros.length}**`);
L(`- Convidados distintos que jogaram solo: ver seção solo`);
L('');
// registros por hora
const regHora = {};
registros.forEach(e => {
  const h = new Date(e.ts).toISOString().slice(0, 13) + 'h';
  regHora[h] = (regHora[h] || 0) + 1;
});
L('Registros por hora (UTC):');
L('');
Object.entries(regHora).sort().forEach(([h, n]) => L(`- ${h}: ${n}`));
L('');

// ============================================================
// 3. PICO DE SIMULTÂNEOS (CCU)
// ============================================================
let peak = 0, peakTs = 0;
ccu_snapshots.forEach(c => { if (c.count > peak) { peak = c.count; peakTs = c.ts; } });
const activeCCU = realCCU.map(c => c.count);
const avgActive = activeCCU.reduce((a, b) => a + b, 0) / (activeCCU.length || 1);
L('## 3. Usuários simultâneos (CCU)');
L('');
L(`- **Pico de simultâneos: ${peak}** em ${new Date(peakTs).toISOString()}`);
L(`- Média quando havia >=1 online: ${avgActive.toFixed(1)}`);
L(`- Snapshots com alguém online: ${realCCU.length} de ${ccu_snapshots.length}`);
L('');

// ============================================================
// 4. PARTIDAS PvP (tabela matches)
// ============================================================
L('## 4. Partidas PvP registradas');
L('');
L(`Total de partidas: **${matches.length}**`);
L('');
const porModo = {};
const porResultado = {};
let somaTurns = 0, somaDur = 0, durCount = 0, somaTtm = 0, ttmCount = 0;
let woCount = 0;
matches.forEach(m => {
  porModo[m.match_mode] = (porModo[m.match_mode] || 0) + 1;
  porResultado[m.result] = (porResultado[m.result] || 0) + 1;
  somaTurns += m.total_turns || 0;
  if (m.duration_ms > 0) { somaDur += m.duration_ms; durCount++; }
  if (m.ttm_ms > 0) { somaTtm += m.ttm_ms; ttmCount++; }
  if (String(m.result).startsWith('wo')) woCount++;
});
L('Por modo:');
Object.entries(porModo).forEach(([k, v]) => L(`- ${k}: ${v} (${pct(v, matches.length)})`));
L('');
L('Por resultado:');
Object.entries(porResultado).forEach(([k, v]) => L(`- ${k}: ${v} (${pct(v, matches.length)})`));
L('');
L(`- Vitórias das brancas: ${pct((porResultado.white||0), matches.length)} | pretas: ${pct((porResultado.black||0), matches.length)}`);
L(`- Walkovers (W.O. / abandono): **${woCount}** (${pct(woCount, matches.length)})`);
L(`- Empates: ${(porResultado.draw||0)} (${pct((porResultado.draw||0), matches.length)})`);
L(`- Média de turnos/partida: ${(somaTurns / matches.length).toFixed(1)}`);
L(`- Duração média (quando registrada): ${fmtMs(somaDur / (durCount||1))} [${durCount} partidas]`);
L(`- Tempo médio por jogada (ttm): ${fmtMs(somaTtm / (ttmCount||1))} [${ttmCount} partidas]`);
L('');

// ============================================================
// 5. EVENTOS — FUNIL E TIPOS
// ============================================================
const tipos = {};
events.forEach(e => tipos[e.type] = (tipos[e.type] || 0) + 1);
L('## 5. Eventos por tipo');
L('');
Object.entries(tipos).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => L(`- ${k}: ${v}`));
L('');

// Funil PvP via eventos
const queueEnter = events.filter(e => e.type === 'queue_enter').length;
const queueCancel = events.filter(e => e.type === 'queue_cancel').length;
const draftStart = events.filter(e => e.type === 'draft_start').length;
// draft_complete inclui jogador + bot/oponente, conta pares
const draftComplete = events.filter(e => e.type === 'draft_complete').length;
L('## 6. Funil de fila/matchmaking (PvP)');
L('');
L(`- Entradas na fila (queue_enter): ${queueEnter}`);
L(`- Cancelamentos de fila (queue_cancel): ${queueCancel} (${pct(queueCancel, queueEnter)} desistência)`);
L(`- draft_start (pareamentos): ${draftStart}`);
L('');
// tempo de espera na fila (queue_cancel metadata wait_ms)
const waits = events.filter(e => e.type === 'queue_cancel' && e.metadata)
  .map(e => { try { return JSON.parse(e.metadata).wait_ms; } catch { return null; } })
  .filter(x => x != null);
if (waits.length) {
  const avgWait = waits.reduce((a, b) => a + b, 0) / waits.length;
  L(`- Espera média antes de CANCELAR a fila: ${fmtMs(avgWait)} (máx ${fmtMs(Math.max(...waits))})`);
  L('  > Indica quanto tempo as pessoas aguentaram sem achar oponente.');
}
L('');

// ============================================================
// 7. CONFIABILIDADE — DESCONEXÕES
// ============================================================
const discon = events.filter(e => e.type === 'disconnect_ingame').length;
const reconOk = events.filter(e => e.type === 'reconnect_success').length;
const reconFail = events.filter(e => e.type === 'reconnect_fail').length;
L('## 7. Confiabilidade de conexão');
L('');
L(`- Desconexões durante partida (disconnect_ingame): ${discon}`);
L(`- Reconexões com sucesso: ${reconOk}`);
L(`- Reconexões falhas (reconnect_fail): ${reconFail}`);
L('  > A maioria dos reconnect_fail tem motivo "no_pending" = tentou reconectar sem partida ativa (normal ao recarregar a página).');
L('');

// ============================================================
// 8. SINGLE-PLAYER (SOLO vs BOT)
// ============================================================
const soloStart = events.filter(e => e.type === 'solo_start');
const soloComplete = events.filter(e => e.type === 'solo_complete');
const soloQuit = events.filter(e => e.type === 'solo_quit');
const soloUsers = new Set(soloStart.map(e => e.user_id));
const guestSolo = [...soloUsers].filter(u => !byId[u]);
L('## 8. Modo solo (vs BOT / campanha)');
L('');
L(`- solo_start: ${soloStart.length}`);
L(`- solo_complete (venceu o nível): ${soloComplete.length}`);
L(`- solo_quit (desistiu): ${soloQuit.length}`);
L(`- Taxa de conclusão: ${pct(soloComplete.length, soloStart.length)}`);
L(`- Jogadores distintos no solo: ${soloUsers.size} (sendo ${guestSolo.length} convidados sem conta)`);
L('');
// WO no solo
const soloWO = soloQuit.filter(e => { try { return JSON.parse(e.metadata).isWO; } catch { return false; } }).length;
L(`- Desistências marcadas como W.O.: ${soloWO}`);
L('');
// nivel mais alcançado
const lvlReach = {};
soloStart.forEach(e => { try { const lv = JSON.parse(e.metadata).level; lvlReach[lv] = (lvlReach[lv]||0)+1; } catch {} });
L('Tentativas por nível (solo_start):');
Object.entries(lvlReach).sort((a,b)=>+a[0]-+b[0]).forEach(([lv,n]) => L(`- Nível ${lv}: ${n} tentativas`));
L('');
L('Progresso máximo por jogador (singleplayer_progress):');
singleplayer_progress.sort((a,b)=>b.max_level_completed-a.max_level_completed)
  .forEach(sp => L(`- ${name(sp.player_id)}: nível ${sp.max_level_completed}`));
L('');

// ============================================================
// 9. DRAFT — POPULARIDADE DAS PEÇAS
// ============================================================
const pieceCount = {};
let emptyArmies = 0, totalArmies = 0;
events.filter(e => e.type === 'draft_army').forEach(e => {
  try {
    const army = JSON.parse(e.metadata).army;
    totalArmies++;
    if (!army.length) { emptyArmies++; return; }
    army.forEach(p => pieceCount[p] = (pieceCount[p]||0)+1);
  } catch {}
});
const pieceName = { P:'Peão', N:'Cavalo', B:'Bispo', R:'Torre', Q:'Dama' };
L('## 9. Draft — peças mais escolhidas');
L('');
L(`Exércitos montados: ${totalArmies} (${emptyArmies} vazios = timeout/desconexão no draft)`);
L('');
const totalPieces = Object.values(pieceCount).reduce((a,b)=>a+b,0);
Object.entries(pieceCount).sort((a,b)=>b[1]-a[1]).forEach(([p,n]) =>
  L(`- ${pieceName[p]||p}: ${n} (${pct(n, totalPieces)})`));
L('');

// ============================================================
// 10. LEADERBOARD / DISTRIBUIÇÃO MMR
// ============================================================
L('## 10. Ranking de jogadores');
L('');
L('Top por MMR:');
L('');
L('| Jogador | MMR | V | D | E | WO+ | WO- | Rank ELO | LP |');
L('|---|---|---|---|---|---|---|---|---|');
players.slice().sort((a,b)=>b.mmr-a.mmr).forEach(p =>
  L(`| ${p.username} | ${p.mmr} | ${p.wins} | ${p.losses} | ${p.draws} | ${p.wo_count} | ${p.wo_against} | ${p.elo_rank} | ${p.elo_lp} |`));
L('');
const totGames = players.reduce((a,p)=>a+p.wins+p.losses+p.draws,0);
const semJogo = players.filter(p=>p.wins+p.losses+p.draws===0).length;
L(`- Jogadores que registraram mas NÃO completaram nenhuma partida PvP: ${semJogo} de ${players.length}`);
L('');

// ============================================================
// 11. ENGAJAMENTO POR JOGADOR (sessões + atividade)
// ============================================================
L('## 11. Engajamento individual');
L('');
const actByUser = {};
events.forEach(e => { if (byId[e.user_id]) actByUser[e.user_id] = (actByUser[e.user_id]||0)+1; });
L('| Jogador | Eventos | 1º registro | Última atividade |');
L('|---|---|---|---|');
players.slice().sort((a,b)=>(actByUser[b.id]||0)-(actByUser[a.id]||0)).forEach(p =>
  L(`| ${p.username} | ${actByUser[p.id]||0} | ${p.created_at} | ${p.last_seen} |`));
L('');

// ============================================================
fs.writeFileSync(path.join(__dirname, 'ANALISE.md'), out.join('\n'));
console.log(out.join('\n'));
console.log('\n\n>>> Relatório salvo em analytics/ANALISE.md');
