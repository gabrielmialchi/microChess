'use strict';

const _REPLAY_ICONS = {
    white: { K:'♔', Q:'♕', R:'♖', B:'♗', N:'♘', P:'♙' },
    black: { K:'♚', Q:'♛', R:'♜', B:'♝', N:'♞', P:'♟' },
};

const _PIECE_NAMES = { K:'Rei', Q:'Rainha', R:'Torre', B:'Bispo', N:'Cavalo', P:'Peão' };

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

        const m = this._meta;

        // Result badge
        const resEl = document.getElementById('rp-match-res');
        if (resEl) {
            const letter = m?.result || '?';
            const cls = m?.isWin ? 'win' : m?.isDraw ? 'draw' : letter === 'WO' ? 'lose' : 'lose';
            resEl.className = 'rp-match-res ' + cls;
            resEl.textContent = letter;
        }

        // Opponent
        const oppEl = document.getElementById('rp-match-opp');
        if (oppEl) oppEl.textContent = m?.opponentName ? `vs ${m.opponentName}` : '—';

        // PdL
        const pdlEl = document.getElementById('rp-match-pdl');
        if (pdlEl) {
            const lp = m?.lpDelta ?? 0;
            if (m?.isDraw)   { pdlEl.className = 'rp-match-pdl eq'; pdlEl.textContent = '= 0 PdL'; }
            else if (lp > 0) { pdlEl.className = 'rp-match-pdl up'; pdlEl.textContent = `+${lp} PdL`; }
            else if (lp < 0) { pdlEl.className = 'rp-match-pdl dn'; pdlEl.textContent = `${lp} PdL`; }
            else             { pdlEl.className = 'rp-match-pdl eq'; pdlEl.textContent = '0 PdL'; }
        }

        // Play button reset
        const playBtn = document.getElementById('btn-replay-play');
        if (playBtn) { playBtn.classList.remove('playing'); playBtn.textContent = '▶ AUTO'; }

        this.renderTurn(0);
    },

    _displayTurns() {
        return (this.data?.turns || []).filter(t => t.type === 'position' || t.type === 'action');
    },

    renderTurn(index) {
        const turns = this._displayTurns();
        if (!turns.length) return;
        this.turnIndex = Math.max(0, Math.min(index, turns.length - 1));
        const turn = turns[this.turnIndex];
        const _t = window.t || ((k) => k);
        const isPos = turn.type === 'position';

        // Turn label + count
        const labelEl = document.getElementById('rp-turn-label');
        const countEl = document.getElementById('rp-turn-count');
        if (labelEl) labelEl.textContent = isPos ? _t('turn_positioning') : `Turno ${this.turnIndex}`;
        if (countEl) countEl.textContent = `T${this.turnIndex}/${turns.length - 1}`;

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
                    const cell = document.createElement('div');
                    cell.className = 'rp-cell' + ((x + y) % 2 === 0 ? ' dk' : '');
                    const p = grid[y][x];
                    if (p) {
                        const span = document.createElement('span');
                        span.className = 'rp-piece ' + (p.color === 'white' ? 'pw' : 'pb');
                        span.textContent = _REPLAY_ICONS[p.color]?.[p.type] || '?';
                        cell.appendChild(span);
                    }
                    board.appendChild(cell);
                }
            }
        }

        // Duel banner
        const banner  = document.getElementById('replay-duel-info');
        const duelTxt = document.getElementById('rp-duel-text');
        if (banner && duelTxt) {
            if (!isPos) {
                const allTurns = this.data?.turns || [];
                // build global-index map for display turns
                const dispGlobalIdxs = [];
                allTurns.forEach((t, i) => { if (t.type === 'position' || t.type === 'action') dispGlobalIdxs.push(i); });
                const curGlobal  = dispGlobalIdxs[this.turnIndex]     ?? -1;
                const prevGlobal = dispGlobalIdxs[this.turnIndex - 1] ?? -1;
                const duels = allTurns.filter((t, i) => t.type === 'duel' && i > prevGlobal && i < curGlobal);
                if (duels.length) {
                    duelTxt.innerHTML = duels.map(d => {
                        const wType  = (d.wPiece?.[1] || 'K').toUpperCase();
                        const bType  = (d.bPiece?.[1] || 'K').toUpperCase();
                        const wIcon  = _REPLAY_ICONS.white[wType] || '?';
                        const bIcon  = _REPLAY_ICONS.black[bType] || '?';
                        const wName  = _PIECE_NAMES[wType] || wType;
                        const bName  = _PIECE_NAMES[bType] || bType;
                        const wRoll  = d.rolls?.white  || 0;
                        const bRoll  = d.rolls?.black  || 0;
                        const wBonus = d.bonuses?.white || 0;
                        const bBonus = d.bonuses?.black || 0;
                        const wTotal = wRoll + wBonus;
                        const bTotal = bRoll + bBonus;
                        if (d.result === 'draw') {
                            return `<span>${wIcon} ${wName} = ${bIcon} ${bName} · ${wTotal} × ${bTotal}</span>`;
                        }
                        const isWWin = d.result === 'white_wins';
                        const winIcon  = isWWin ? wIcon  : bIcon;
                        const winName  = isWWin ? wName  : bName;
                        const loseIcon = isWWin ? bIcon  : wIcon;
                        const loseName = isWWin ? bName  : wName;
                        return `<span>${winIcon} ${winName} venceu ${loseIcon} ${loseName} · ${wTotal} (${wRoll}+${wBonus}) × ${bTotal} (${bRoll}+${bBonus})</span>`;
                    }).join('<br>');
                    banner.classList.add('visible');
                } else {
                    banner.classList.remove('visible');
                }
            } else {
                banner.classList.remove('visible');
            }
        }

        // Nav buttons
        const prevBtn = document.getElementById('btn-replay-prev');
        const nextBtn = document.getElementById('btn-replay-next');
        if (prevBtn) prevBtn.disabled = this.turnIndex === 0;
        if (nextBtn) nextBtn.disabled = this.turnIndex === turns.length - 1;
    },

    prev() { this.renderTurn(this.turnIndex - 1); },
    next() { this.renderTurn(this.turnIndex + 1); },

    play() {
        const btn = document.getElementById('btn-replay-play');
        if (this._autoTimer) {
            clearInterval(this._autoTimer);
            this._autoTimer = null;
            if (btn) { btn.classList.remove('playing'); btn.textContent = '▶ AUTO'; }
            return;
        }
        if (btn) { btn.classList.add('playing'); btn.textContent = '⏹ PARAR'; }
        this._autoTimer = setInterval(() => {
            const turns = this._displayTurns();
            if (this.turnIndex >= turns.length - 1) {
                clearInterval(this._autoTimer);
                this._autoTimer = null;
                if (btn) { btn.classList.remove('playing'); btn.textContent = '▶ AUTO'; }
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
