'use strict';

const _REPLAY_ICONS = {
    white: { K:'♔', Q:'♕', R:'♖', B:'♗', N:'♘', P:'♙' },
    black: { K:'♚', Q:'♛', R:'♜', B:'♝', N:'♞', P:'♟' },
};

const ReplayViewer = {
    data:       null,
    turnIndex:  0,
    _autoTimer: null,
    _meta:      null,

    async load(matchId) {
        try {
            const res = await fetch(`/match/${matchId}/replay`);
            if (!res.ok) { alert('Replay não disponível.'); return; }
            this.open(await res.json());
        } catch { alert('Erro ao carregar replay.'); }
    },

    open(data) {
        if (this._autoTimer) { clearInterval(this._autoTimer); this._autoTimer = null; }
        this.data      = data;
        this.turnIndex = 0;
        showScreen('replay');

        // Preencher header de resumo
        const summaryEl = document.getElementById('replay-summary');
        if (summaryEl) {
            const m = this._meta;
            if (m) {
                const sign    = (m.lpDelta >= 0) ? '+' : '';
                const lpColor = m.lpDelta >= 0 ? '#2ecc71' : '#e74c3c';
                summaryEl.innerHTML =
                    `<span>vs <strong style="color:#f0ece4;">${m.opponentName || '?'}</strong></span>` +
                    `<span>${m.date || ''}</span>` +
                    `<span style="color:${lpColor};font-weight:700;">${sign}${m.lpDelta} PdL</span>`;
            } else {
                summaryEl.innerHTML = '';
            }
        }

        const actions = this._actions();
        const total   = document.getElementById('replay-total');
        if (total) total.textContent = actions.length;
        const playBtn = document.getElementById('btn-replay-play');
        if (playBtn) playBtn.textContent = '▶ AUTO';
        this.renderTurn(0);
    },

    _actions() {
        return (this.data?.turns || []).filter(t => t.type === 'action');
    },

    renderTurn(index) {
        const actions = this._actions();
        if (!actions.length) return;
        this.turnIndex = Math.max(0, Math.min(index, actions.length - 1));
        const turn     = actions[this.turnIndex];

        const cur = document.getElementById('replay-current');
        if (cur) cur.textContent = this.turnIndex + 1;

        // Board
        const board = document.getElementById('replay-board');
        if (board) {
            const grid = Array.from({ length: 4 }, () => Array(4).fill(null));
            (turn.armyAfter || []).forEach(p => {
                if (p.x >= 0 && p.x <= 3 && p.y >= 0 && p.y <= 3) grid[p.y][p.x] = p;
            });
            board.innerHTML = '';
            for (let y = 3; y >= 0; y--) {
                for (let x = 0; x < 4; x++) {
                    const cell  = document.createElement('div');
                    const dark  = (x + y) % 2 === 0;
                    cell.style.cssText = `display:flex;align-items:center;justify-content:center;
                        background:${dark ? '#141414' : '#272727'};font-size:clamp(24px,7vw,36px);`;
                    const p = grid[y][x];
                    if (p) {
                        cell.textContent = _REPLAY_ICONS[p.color]?.[p.type] || '?';
                        cell.style.filter = p.color === 'white'
                            ? 'drop-shadow(0 0 6px rgba(82,162,225,0.85))'
                            : 'drop-shadow(0 0 6px rgba(165,105,210,0.85))';
                    }
                    board.appendChild(cell);
                }
            }
        }

        // Duel info
        const allTurns   = this.data?.turns || [];
        const actionIdxs = allTurns.reduce((acc, t, i) => { if (t.type === 'action') acc.push(i); return acc; }, []);
        const thisActionGlobalIdx = actionIdxs[this.turnIndex] ?? -1;
        const prevActionGlobalIdx = actionIdxs[this.turnIndex - 1] ?? -1;
        const duels = allTurns.filter((t, i) => t.type === 'duel' && i > prevActionGlobalIdx && i < thisActionGlobalIdx);

        const duelInfo = document.getElementById('replay-duel-info');
        if (duelInfo) {
            duelInfo.innerHTML = duels.map(d => {
                const res = d.result === 'white_wins' ? '⬜ vence' : d.result === 'black_wins' ? '⬛ vence' : 'empate';
                return `<div style="font-size:11px;color:rgba(240,236,228,0.5);font-family:'IBM Plex Mono',monospace;text-align:center;">
                    Duelo: ⬜ ${d.rolls?.white}+${d.bonuses?.white} vs ⬛ ${d.rolls?.black}+${d.bonuses?.black} → ${res}
                </div>`;
            }).join('');
        }

        const prevBtn = document.getElementById('btn-replay-prev');
        const nextBtn = document.getElementById('btn-replay-next');
        if (prevBtn) prevBtn.disabled = this.turnIndex === 0;
        if (nextBtn) nextBtn.disabled = this.turnIndex === actions.length - 1;
    },

    prev() { this.renderTurn(this.turnIndex - 1); },
    next() { this.renderTurn(this.turnIndex + 1); },

    play() {
        const btn = document.getElementById('btn-replay-play');
        if (this._autoTimer) {
            clearInterval(this._autoTimer);
            this._autoTimer = null;
            if (btn) btn.textContent = '▶ AUTO';
            return;
        }
        if (btn) btn.textContent = '⏹ PARAR';
        this._autoTimer = setInterval(() => {
            const actions = this._actions();
            if (this.turnIndex >= actions.length - 1) {
                clearInterval(this._autoTimer);
                this._autoTimer = null;
                if (btn) btn.textContent = '▶ AUTO';
                return;
            }
            this.renderTurn(this.turnIndex + 1);
        }, 1_000);
    },

    close() {
        if (this._autoTimer) { clearInterval(this._autoTimer); this._autoTimer = null; }
        showScreen('match-history');
    },
};

window.watchReplay = (matchId, meta) => {
    ReplayViewer._meta = meta
        ? (typeof meta === 'string' ? JSON.parse(meta) : meta)
        : null;
    ReplayViewer.load(matchId);
};
