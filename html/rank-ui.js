'use strict';

// ── LEADERBOARD ───────────────────────────────────────────────
const Leaderboard = {
    async load() {
        try {
            const res = await fetch('/leaderboard');
            if (!res.ok) return;
            this.render(await res.json());
            showScreen('leaderboard');
        } catch { console.error('[Leaderboard] Erro ao carregar.'); }
    },

    render(players) {
        const session = (typeof Session !== 'undefined') ? Session.get() : null;
        const myId    = session?.id;
        const table   = document.getElementById('leaderboard-table');
        if (!table) return;

        table.innerHTML = players.map((p, i) => {
            const isMe   = p.id === myId;
            const isTop3 = i < 3;
            const col    = isTop3 ? '#d4a832' : isMe ? 'rgba(212,168,50,0.7)' : 'rgba(240,236,228,0.85)';
            return `<div style="display:flex;align-items:center;gap:12px;padding:10px 16px;
                border-bottom:1px solid rgba(255,255,255,0.06);
                background:${isMe ? 'rgba(212,168,50,0.06)' : 'transparent'};color:${col};">
              <span style="width:28px;text-align:right;opacity:0.5;font-family:'IBM Plex Mono',monospace;font-size:12px;">${p.rank}</span>
              <span style="font-size:20px;">${p.elo?.icon || p.icon}</span>
              <span style="flex:1;font-family:'Cinzel',serif;font-size:13px;">${p.username}</span>
              <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;opacity:0.75;">${p.elo?.name || p.name} · ${p.elo?.lp ?? 0} PdL</span>
              <span style="font-family:'IBM Plex Mono',monospace;font-size:11px;opacity:0.45;min-width:60px;text-align:right;">${p.wins}W ${p.losses}L</span>
            </div>`;
        }).join('') || '<div style="color:rgba(240,236,228,0.3);text-align:center;padding:32px;font-size:12px;">Nenhum jogador ainda.</div>';
    },
};

window.showLeaderboard = () => Leaderboard.load();

// ── MATCH HISTORY ─────────────────────────────────────────────
const MatchHistory = {
    async load(playerId) {
        const container = document.getElementById('profile-match-history');
        if (!container) return;
        container.innerHTML = '<div style="color:rgba(240,236,228,0.3);font-size:11px;padding:8px 0;">Carregando...</div>';
        try {
            const res = await fetch(`/player/${playerId}/matches`);
            if (!res.ok) { container.innerHTML = ''; return; }
            this.render(await res.json(), playerId);
        } catch { container.innerHTML = ''; }
    },

    render(matches, playerId) {
        const container = document.getElementById('profile-match-history');
        if (!container) return;
        if (!matches.length) {
            container.innerHTML = '<div style="color:rgba(240,236,228,0.3);font-size:11px;text-align:center;padding:12px 0;">Nenhuma partida registrada.</div>';
            return;
        }
        container.innerHTML = matches.map(m => {
            const isWhite = m.player_white_id === playerId;
            const delta   = isWhite ? m.mmr_change_white : m.mmr_change_black;
            const sign    = delta >= 0 ? '+' : '';
            const resultMap = {
                white:    isWhite ? 'VITÓRIA'       : 'DERROTA',
                black:    isWhite ? 'DERROTA'       : 'VITÓRIA',
                draw:     'EMPATE',
                wo_white: isWhite ? 'DERROTA (W.O.)': 'VITÓRIA (W.O.)',
                wo_black: isWhite ? 'VITÓRIA (W.O.)': 'DERROTA (W.O.)',
            };
            const label  = resultMap[m.result] || m.result;
            const isWin  = label.startsWith('VITÓRIA');
            const date   = new Date(m.created_at).toLocaleDateString('pt-BR');
            const replayBtn = m.replay_id
                ? `<button onclick="window.watchReplay('${m.id}')" style="background:rgba(212,168,50,0.12);color:#d4a832;border:1px solid rgba(212,168,50,0.25);padding:3px 10px;border-radius:3px;font-family:'Cinzel',serif;font-size:10px;letter-spacing:1px;cursor:pointer;">REPLAY</button>`
                : '';
            return `<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
              <span style="color:${isWin ? '#2ecc71' : '#e74c3c'};font-family:'Cinzel',serif;font-size:11px;min-width:120px;">${label}</span>
              <span style="color:${delta >= 0 ? '#2ecc71' : '#e74c3c'};font-family:'IBM Plex Mono',monospace;font-size:11px;min-width:56px;">${sign}${delta} MMR</span>
              <span style="color:rgba(240,236,228,0.3);font-family:'IBM Plex Mono',monospace;font-size:10px;flex:1;">${date}</span>
              ${replayBtn}
            </div>`;
        }).join('');
    },
};

// Intercepta showScreen para carregar histórico ao abrir perfil
(function hookProfile() {
    const orig = window.showScreen;
    if (!orig) return;
    window.showScreen = function(id) {
        orig(id);
        if (id === 'profile') {
            const session = (typeof Session !== 'undefined') ? Session.get() : null;
            if (session?.id) MatchHistory.load(session.id);
        }
    };
})();
