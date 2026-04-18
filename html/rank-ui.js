'use strict';

function escapeHTML(str) {
    return String(str ?? '').replace(/[&<>"']/g, c =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ── LEADERBOARD ───────────────────────────────────────────────
const _spinner = '<div style="display:flex;justify-content:center;align-items:center;padding:48px 0;"><div style="width:28px;height:28px;border:3px solid rgba(212,168,50,0.2);border-top-color:#d4a832;border-radius:50%;animation:_spin 0.8s linear infinite;"></div></div><style>@keyframes _spin{to{transform:rotate(360deg)}}</style>';

const Leaderboard = {
    async load() {
        showScreen('leaderboard');
        const table = document.getElementById('leaderboard-table');
        if (table) table.innerHTML = _spinner;
        try {
            const res = await fetch('/leaderboard');
            if (!res.ok) { if (table) table.innerHTML = ''; return; }
            this.render(await res.json());
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
              <span style="font-size:20px;">${escapeHTML(p.elo?.icon || p.icon)}</span>
              <span style="flex:1;font-family:'Cinzel',serif;font-size:13px;">${escapeHTML(p.username)}</span>
              <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;opacity:0.75;">${escapeHTML(p.elo?.name || p.name)} · ${p.elo?.lp ?? 0} PdL</span>
              <span style="font-family:'IBM Plex Mono',monospace;font-size:11px;opacity:0.45;min-width:60px;text-align:right;">${p.wins}W ${p.losses}L</span>
            </div>`;
        }).join('') || '<div style="color:rgba(240,236,228,0.3);text-align:center;padding:32px;font-size:12px;">Nenhum jogador ainda.</div>';
    },
};

window.showLeaderboard = () => Leaderboard.load();

// ── MATCH HISTORY ─────────────────────────────────────────────
const MatchHistory = {
    open(playerId) {
        if (!playerId) return;
        showScreen('match-history');
        const container = document.getElementById('match-history-list');
        if (container) container.innerHTML = _spinner;
        this._load(playerId);
    },

    async _load(playerId) {
        const container = document.getElementById('match-history-list');
        try {
            const res = await fetch(`/player/${playerId}/matches`);
            if (!res.ok) { if (container) container.innerHTML = ''; return; }
            this.render(await res.json(), playerId);
        } catch { if (container) container.innerHTML = ''; }
    },

    render(matches, playerId) {
        const container = document.getElementById('match-history-list');
        if (!container) return;
        if (!matches.length) {
            container.innerHTML = '<div style="color:rgba(240,236,228,0.3);font-size:11px;text-align:center;padding:32px 0;">Nenhuma partida registrada.</div>';
            return;
        }
        container.innerHTML = matches.map(m => {
            const isWhite       = m.player_white_id === playerId;
            const lpDelta       = isWhite
                ? (m.lp_change_white ?? m.mmr_change_white)
                : (m.lp_change_black ?? m.mmr_change_black);
            const sign          = lpDelta >= 0 ? '+' : '';
            const opponentName  = isWhite ? (m.black_username || '?') : (m.white_username || '?');
            const resultMap = {
                white:    isWhite ? 'VITÓRIA'        : 'DERROTA',
                black:    isWhite ? 'DERROTA'        : 'VITÓRIA',
                draw:     'EMPATE',
                wo_white: isWhite ? 'DERROTA (W.O.)' : 'VITÓRIA (W.O.)',
                wo_black: isWhite ? 'VITÓRIA (W.O.)' : 'DERROTA (W.O.)',
            };
            const label  = resultMap[m.result] || m.result;
            const isWin  = label.startsWith('VITÓRIA');
            const date   = new Date(m.created_at).toLocaleDateString('pt-BR');
            const replayBtn = m.replay_id
                ? `<button class="_replay-btn"
                    data-match-id="${escapeHTML(String(m.id))}"
                    data-meta="${escapeHTML(JSON.stringify({ opponentName, date, lpDelta, result: label }))}"
                    style="background:rgba(212,168,50,0.12);color:#d4a832;border:1px solid rgba(212,168,50,0.25);
                    padding:4px 10px;border-radius:3px;font-family:'Cinzel',serif;font-size:10px;
                    letter-spacing:1px;cursor:pointer;white-space:nowrap;">▶ REPLAY</button>`
                : '';
            return `<div style="display:flex;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
              <div style="flex:1;min-width:0;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;">
                  <span style="color:${isWin ? '#2ecc71' : '#e74c3c'};font-family:'Cinzel',serif;font-size:11px;font-weight:700;">${label}</span>
                  <span style="color:${lpDelta >= 0 ? '#2ecc71' : '#e74c3c'};font-family:'IBM Plex Mono',monospace;font-size:11px;">${sign}${lpDelta} PdL</span>
                </div>
                <div style="color:rgba(240,236,228,0.4);font-family:'IBM Plex Mono',monospace;font-size:10px;">vs ${escapeHTML(opponentName)} · ${date}</div>
              </div>
              ${replayBtn}
            </div>`;
        }).join('');
        container.querySelectorAll('._replay-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                try { window.watchReplay(btn.dataset.matchId, JSON.parse(btn.dataset.meta)); } catch {}
            });
        });
    },
};
