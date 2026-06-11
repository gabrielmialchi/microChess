'use strict';

// Painel mínimo para os testes de carga: estatísticas em tempo real,
// exportação de dados coletados e janela de horário de teste.

function requireAdmin(req, res, next) {
    const token = process.env.ADMIN_TOKEN;
    if (!token) {
        return res.status(503).json({ error: 'ADMIN_TOKEN não configurado no servidor' });
    }
    const provided = req.query.key || req.headers['x-admin-key'];
    if (provided !== token) {
        return res.status(401).json({ error: 'não autorizado' });
    }
    next();
}

function getStats({ io, queue, rooms }) {
    let playersInMatches = 0;
    for (const room of rooms.values()) {
        playersInMatches += (room.players ? Object.keys(room.players).length : 2);
    }
    return {
        timestamp: new Date().toISOString(),
        connectedSockets: io.engine.clientsCount ?? 0,
        inQueue: queue.length,
        activeRooms: rooms.size,
        playersInMatches,
    };
}

function exportData(db) {
    return {
        exportedAt: new Date().toISOString(),
        players: db.prepare(`
            SELECT id, username, mmr, wins, losses, draws, wo_count, wo_against,
                   elo_rank, elo_lp, created_at, last_seen
            FROM players
        `).all(),
        matches: db.prepare(`
            SELECT id, player_white_id, player_black_id, result,
                   mmr_change_white, mmr_change_black, lp_change_white, lp_change_black,
                   match_mode, total_turns, duration_ms, ttm_ms, created_at
            FROM matches
        `).all(),
        events: db.prepare(`
            SELECT id, ts, type, user_id, match_id, metadata FROM events ORDER BY ts ASC
        `).all(),
        ccu_snapshots: db.prepare(`
            SELECT ts, count FROM ccu_snapshots ORDER BY ts ASC
        `).all(),
        singleplayer_progress: db.prepare(`
            SELECT player_id, max_level_completed, updated_at FROM singleplayer_progress
        `).all(),
    };
}

// Apaga todos os jogadores, partidas, replays e progresso singleplayer.
// Usado para zerar o leaderboard/banco antes de um novo período de testes.
function resetAllData(db) {
    const before = {
        players: db.prepare('SELECT COUNT(*) AS n FROM players').get().n,
        matches: db.prepare('SELECT COUNT(*) AS n FROM matches').get().n,
        replays: db.prepare('SELECT COUNT(*) AS n FROM replays').get().n,
    };
    db.transaction(() => {
        db.prepare('DELETE FROM replays').run();
        db.prepare('DELETE FROM matches').run();
        db.prepare('DELETE FROM singleplayer_progress').run();
        db.prepare('DELETE FROM players').run();
    })();
    return before;
}

// Janela de teste opcional: TEST_WINDOW_START e TEST_WINDOW_END (datas ISO completas).
// Se nenhuma das duas estiver definida, o servidor fica sempre aberto (comportamento atual).
function checkTestWindow() {
    const startRaw = process.env.TEST_WINDOW_START;
    const endRaw   = process.env.TEST_WINDOW_END;
    if (!startRaw && !endRaw) return { configured: false, open: true };

    const now   = Date.now();
    const start = startRaw ? Date.parse(startRaw) : null;
    const end   = endRaw   ? Date.parse(endRaw)   : null;

    let open = true;
    if (start !== null && !Number.isNaN(start) && now < start) open = false;
    if (end   !== null && !Number.isNaN(end)   && now > end)   open = false;

    return { configured: true, open, start: startRaw || null, end: endRaw || null };
}

module.exports = { requireAdmin, getStats, exportData, checkTestWindow };
