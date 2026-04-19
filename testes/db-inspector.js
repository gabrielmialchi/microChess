'use strict';

// Uso: node testes/db-inspector.js [--player <username>] [--matches [limit]]
// Mostra um resumo do banco de dados SQLite do microChess.

const path   = require('path');
const DB_PATH = path.join(__dirname, '../server/db/microchess.db');

let db;
try {
    const Database = require(path.join(__dirname, '../server/node_modules/better-sqlite3'));
    db = new Database(DB_PATH, { readonly: true });
} catch (e) {
    console.error(`\n✗ Não foi possível abrir o banco: ${e.message}`);
    console.error(`  Verifique se o arquivo existe em: ${DB_PATH}\n`);
    process.exit(1);
}

const args = process.argv.slice(2);
const flagIdx = name => args.indexOf(name);

// ── HELPERS ───────────────────────────────────────────────────────────────────
function header(title) {
    console.log(`\n${'─'.repeat(56)}`);
    console.log(`  ${title}`);
    console.log('─'.repeat(56));
}

function row(label, value) {
    console.log(`  ${label.padEnd(30)} ${value}`);
}

// ── RESUMO GLOBAL ─────────────────────────────────────────────────────────────
header('BANCO — RESUMO');
const totPlayers = db.prepare('SELECT COUNT(*) AS n FROM players').get().n;
const totMatches = db.prepare('SELECT COUNT(*) AS n FROM matches').get().n;
const totReplays = db.prepare('SELECT COUNT(*) AS n FROM replays').get().n;
const bannedNow  = db.prepare(`SELECT COUNT(*) AS n FROM players WHERE ban_until > datetime('now')`).get().n;
const expReplays = db.prepare(`SELECT COUNT(*) AS n FROM replays WHERE expires_at < datetime('now')`).get().n;
row('Jogadores cadastrados:', totPlayers);
row('Partidas registradas:', totMatches);
row('Replays armazenados:', totReplays);
row('Jogadores banidos agora:', bannedNow);
row('Replays expirados (não limpos):', expReplays);

// ── DISTRIBUIÇÃO DE RESULTADOS ────────────────────────────────────────────────
header('PARTIDAS — DISTRIBUIÇÃO DE RESULTADOS');
const results = db.prepare(`
    SELECT result, COUNT(*) AS n FROM matches GROUP BY result ORDER BY n DESC
`).all();
if (results.length) {
    results.forEach(r => row(r.result ?? '(null)', String(r.n)));
} else {
    console.log('  (nenhuma partida)');
}

// ── TOP 10 POR MMR ────────────────────────────────────────────────────────────
header('TOP 10 — POR MMR');
const top = db.prepare(`
    SELECT username, mmr, elo_rank, elo_lp, wins, losses, draws
    FROM players ORDER BY mmr DESC LIMIT 10
`).all();
if (top.length) {
    top.forEach((p, i) => {
        console.log(`  ${String(i+1).padStart(2)}. ${p.username.padEnd(20)} MMR:${p.mmr}  Rank:${p.elo_rank} (${p.elo_lp}PdL)  W:${p.wins} L:${p.losses} D:${p.draws}`);
    });
} else {
    console.log('  (nenhum jogador)');
}

// ── PARTIDAS RECENTES ─────────────────────────────────────────────────────────
const matchLimit = flagIdx('--matches') >= 0
    ? (parseInt(args[flagIdx('--matches') + 1]) || 10)
    : 5;
header(`PARTIDAS RECENTES (últimas ${matchLimit})`);
const recent = db.prepare(`
    SELECT m.id, pw.username AS white, pb.username AS black,
           m.result, m.total_turns, m.created_at,
           m.lp_change_white, m.lp_change_black
    FROM matches m
    JOIN players pw ON pw.id = m.player_white_id
    JOIN players pb ON pb.id = m.player_black_id
    ORDER BY m.created_at DESC LIMIT ?
`).all(matchLimit);
if (recent.length) {
    recent.forEach(m => {
        const lp = `Δ W:${m.lp_change_white??'?'} B:${m.lp_change_black??'?'}`;
        console.log(`  [${m.created_at?.slice(0,16)}] ${m.white} vs ${m.black}  → ${m.result}  T:${m.total_turns}  ${lp}`);
    });
} else {
    console.log('  (nenhuma partida)');
}

// ── DETALHE DE UM JOGADOR ─────────────────────────────────────────────────────
const pIdx = flagIdx('--player');
if (pIdx >= 0 && args[pIdx + 1]) {
    const uname = args[pIdx + 1];
    header(`JOGADOR: ${uname}`);
    const p = db.prepare('SELECT * FROM players WHERE username = ?').get(uname);
    if (!p) {
        console.log('  Jogador não encontrado.');
    } else {
        row('ID:', p.id);
        row('MMR:', String(p.mmr));
        row('Rank (id / lp / shield):', `${p.elo_rank} / ${p.elo_lp} / ${p.elo_shield}`);
        row('V / D / E:', `${p.wins} / ${p.losses} / ${p.draws}`);
        row('WOs causados / sofridos:', `${p.wo_count} / ${p.wo_against}`);
        row('Ban até:', p.ban_until ?? '(sem ban)');
        row('Cadastro:', p.created_at);
        row('Último acesso:', p.last_seen);

        const hist = db.prepare(`
            SELECT m.result, m.created_at,
                   CASE WHEN m.player_white_id = ? THEN pb.username ELSE pw.username END AS opp,
                   CASE WHEN m.player_white_id = ? THEN m.lp_change_white ELSE m.lp_change_black END AS lp
            FROM matches m
            JOIN players pw ON pw.id = m.player_white_id
            JOIN players pb ON pb.id = m.player_black_id
            WHERE m.player_white_id = ? OR m.player_black_id = ?
            ORDER BY m.created_at DESC LIMIT 10
        `).all(p.id, p.id, p.id, p.id);
        if (hist.length) {
            console.log('\n  Últimas 10 partidas:');
            hist.forEach(h => {
                console.log(`    [${h.created_at?.slice(0,16)}] vs ${h.opp}  → ${h.result}  Δ${h.lp??'?'}PdL`);
            });
        }
    }
}

console.log('\n' + '─'.repeat(56) + '\n');
db.close();
