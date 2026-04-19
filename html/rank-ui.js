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
            const res = await fetch((window.API_BASE||'') + '/leaderboard');
            if (!res.ok) { if (table) table.innerHTML = ''; return; }
            this.render(await res.json());
        } catch { console.error('[Leaderboard] Erro ao carregar.'); }
    },

    render(players) {
        const session = (typeof Session !== 'undefined') ? Session.get() : null;
        const myId    = session?.id;
        const table   = document.getElementById('leaderboard-table');
        const strip   = document.getElementById('lb-you-strip');
        if (!table) return;

        const _t = window.t || ((k) => k);
        const p = getProfile ? getProfile() : {};

        let myEntry = null;
        table.innerHTML = players.map((pl, i) => {
            const isMe   = pl.id === myId;
            const pos    = i + 1;
            const isTop3 = pos <= 3;
            const posClass = pos===1?'gold':pos===2?'silver':pos===3?'bronze':'';
            const rankName = escapeHTML(pl.elo?.name || '');
            // PdL only for owner
            const eloText  = isMe && pl.elo?.lp != null
                ? `${rankName} · ${pl.elo.lp} PdL`
                : rankName;
            if (isMe) myEntry = { pos, pl };
            return `<div class="lb-r${isTop3?' top3':''}${isMe?' you':''}">
                <div class="rc-pos ${posClass}">${pos}</div>
                <div class="rc-av">${escapeHTML(pl.elo?.icon || '')}</div>
                <div class="rc-player">
                    <div class="rc-name">${escapeHTML(pl.username)}</div>
                    <div class="rc-elo">${eloText}</div>
                </div>
                <div class="rc-wl">${pl.wins}/${pl.losses}</div>
            </div>`;
        }).join('') || `<div style="color:var(--mc-muted,rgba(24,19,12,0.56));text-align:center;padding:32px;font-size:12px;">${_t('no_players_yet')}</div>`;

        // "You" strip — shown only when player has a session
        if (strip) {
            if (session && myId) {
                const avatar   = (p.avatar || 'K');
                const icon     = (typeof PIECE_ICONS !== 'undefined' ? PIECE_ICONS[avatar] : null) || '♔';
                const name     = session.username || p.nickname || '—';
                const rankDisp = myEntry
                    ? (myEntry.pl.elo?.lp != null ? `${myEntry.pl.elo?.name} · ${myEntry.pl.elo.lp} PdL` : (myEntry.pl.elo?.name || ''))
                    : (session.rank ? session.rank.name : '—');
                const posText  = myEntry ? String(myEntry.pos) : '—';
                const stats    = p.stats || {};
                strip.className = 'lb-you-strip';
                strip.style.display = 'flex';
                strip.innerHTML = `
                    <div class="ys-pos">${posText}</div>
                    <div class="ys-av">${escapeHTML(icon)}</div>
                    <div class="ys-info">
                        <div class="ys-name">${escapeHTML(name)}</div>
                        <div class="ys-elo">${escapeHTML(rankDisp)}</div>
                    </div>
                    <div class="ys-wl">${stats.wins||0}/${stats.losses||0}</div>`;
            } else {
                strip.style.display = 'none';
            }
        }
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
            const res = await fetch(`${window.API_BASE||''}/player/${playerId}/matches`);
            if (!res.ok) { if (container) container.innerHTML = ''; return; }
            this.render(await res.json(), playerId);
        } catch { if (container) container.innerHTML = ''; }
    },

    render(matches, playerId) {
        const container = document.getElementById('match-history-list');
        if (!container) return;
        const _t = window.t || ((k) => k);
        if (!matches.length) {
            container.innerHTML = `<div class="mh-empty">
                <div class="mh-empty-icon">♟</div>
                <div class="mh-empty-label">${_t('no_matches_yet')}</div>
            </div>`;
            return;
        }
        container.innerHTML = matches.map(m => {
            const isWhite      = m.player_white_id === playerId;
            const lpDelta      = isWhite
                ? (m.lp_change_white ?? m.mmr_change_white ?? 0)
                : (m.lp_change_black ?? m.mmr_change_black ?? 0);
            const opponentName = isWhite ? (m.black_username || '?') : (m.white_username || '?');
            const date         = new Date(m.created_at).toLocaleDateString(undefined, { day:'numeric', month:'short' });

            // result classification
            const isWin  = m.result === (isWhite ? 'white' : 'black') || (isWhite ? m.result === 'wo_black' : m.result === 'wo_white');
            const isLose = m.result === (isWhite ? 'black' : 'white') || (isWhite ? m.result === 'wo_white' : m.result === 'wo_black');
            const isDraw = m.result === 'draw';
            const isWO   = m.result === 'wo_white' || m.result === 'wo_black';

            let badgeClass, badgeLetter;
            if (isWO)       { badgeClass = 'wo';   badgeLetter = 'WO'; }
            else if (isWin) { badgeClass = 'win';  badgeLetter = 'V'; }
            else if (isDraw){ badgeClass = 'draw'; badgeLetter = 'E'; }
            else            { badgeClass = 'lose'; badgeLetter = 'D'; }

            // PdL display
            let pdlClass, pdlText;
            if (isDraw)          { pdlClass = 'eq';  pdlText = '= 0 PdL'; }
            else if (lpDelta > 0){ pdlClass = 'up';  pdlText = `+${lpDelta} PdL`; }
            else if (lpDelta < 0){ pdlClass = 'dn';  pdlText = `${lpDelta} PdL`; }
            else                 { pdlClass = 'eq';  pdlText = `0 PdL`; }

            const replayBtn = m.replay_id
                ? `<button class="mh-play _replay-btn"
                      data-match-id="${escapeHTML(String(m.id))}"
                      data-meta="${escapeHTML(JSON.stringify({ opponentName, date, lpDelta, result: badgeLetter, isWin, isDraw }))}"
                      >▶</button>`
                : '';

            return `<div class="mh-row">
                <div class="mh-result ${badgeClass}">${badgeLetter}</div>
                <div class="mh-info">
                    <div class="mh-opp">vs ${escapeHTML(opponentName)}</div>
                    <div class="mh-meta">${date}</div>
                </div>
                <div class="mh-pdl ${pdlClass}">${pdlText}</div>
                ${replayBtn}
            </div>`;
        }).join('');
        container.querySelectorAll('._replay-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                try { window.watchReplay(btn.dataset.matchId, JSON.parse(btn.dataset.meta)); } catch {}
            });
        });
    },
};
