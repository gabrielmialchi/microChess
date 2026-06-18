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
            const res = await fetch(`${window.API_BASE||''}/match/${matchId}/replay`);
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

        this.renderTurn(0);
    },

    // S39: passos = posição + ações + DUELOS (cada duelo é um passo navegável)
    _steps() {
        return (this.data?.turns || []).filter(t => t.type === 'position' || t.type === 'action' || t.type === 'duel');
    },

    // S37/S39: rótulo do tipo de duelo a partir do snapshot do replay
    _duelKind(d) {
        const _t = window.t || ((k) => k);
        if (d.sd) return _t('sudden_death');
        const ty = d.duelType;
        if (ty === 'frontal')        return _t('duel_space');
        if (ty === 'contested_king') return _t('duel_tiebreak');
        if (ty === 'attack') {
            const wK = (d.wType || '').toUpperCase() === 'K';
            const bK = (d.bType || '').toUpperCase() === 'K';
            return (wK || bK) ? _t('duel_king_capture') : _t('duel_king_defense');
        }
        return _t('conflict');
    },

    _duelHTML(d) {
        const kind = this._duelKind(d);
        if (d.sd) {
            const kw = _REPLAY_ICONS.white.K, kb = _REPLAY_ICONS.black.K;
            const w = d.sdWins?.white ?? 0, b = d.sdWins?.black ?? 0;
            const rounds = (d.sdHistory || []).map((r, i) => `R${i + 1} ${r.white}×${r.black}`).join(' · ');
            const outcome = d.result === 'white_wins' ? `${kw} ✓` : d.result === 'black_wins' ? `${kb} ✓` : '=';
            return `<b>${kind}</b> · ${kw} ${w}×${b} ${kb}${rounds ? ' · ' + rounds : ''} · ${outcome}`;
        }
        const wType = (d.wType || 'K').toUpperCase(), bType = (d.bType || 'K').toUpperCase();
        const wIcon = _REPLAY_ICONS.white[wType] || '?', bIcon = _REPLAY_ICONS.black[bType] || '?';
        const wRoll = d.rolls?.white || 0, bRoll = d.rolls?.black || 0;
        const wBonus = d.bonuses?.white || 0, bBonus = d.bonuses?.black || 0;
        const wTotal = wRoll + wBonus, bTotal = bRoll + bBonus;
        if (d.result === 'draw') {
            return `<b>${kind}</b> · ${wIcon} = ${bIcon} · ${wTotal} × ${bTotal}`;
        }
        const isW = d.result === 'white_wins';
        const winIcon = isW ? wIcon : bIcon, loseIcon = isW ? bIcon : wIcon;
        return `<b>${kind}</b> · ${winIcon} ✓ ${loseIcon} · ${wTotal} (${wRoll}+${wBonus}) × ${bTotal} (${bRoll}+${bBonus})`;
    },

    renderTurn(index) {
        const steps = this._steps();
        if (!steps.length) return;
        this.turnIndex = Math.max(0, Math.min(index, steps.length - 1));
        const step = steps[this.turnIndex];
        const _t = window.t || ((k) => k);
        const isDuel = step.type === 'duel';

        // Board: armyAfter deste passo, ou o último disponível antes (passos de duelo não têm board próprio)
        let army = step.armyAfter;
        if (!army) {
            for (let i = this.turnIndex; i >= 0; i--) {
                if (steps[i].armyAfter) { army = steps[i].armyAfter; break; }
            }
        }
        army = army || [];

        // Numeração de ações e duelos até o passo atual
        let actionNo = 0, duelNo = 0;
        for (let i = 0; i <= this.turnIndex; i++) {
            if (steps[i].type === 'action') actionNo++;
            if (steps[i].type === 'duel')   duelNo++;
        }

        // Rótulo + contador
        const labelEl = document.getElementById('rp-turn-label');
        const countEl = document.getElementById('rp-turn-count');
        if (labelEl) {
            if (step.type === 'position')   labelEl.textContent = _t('turn_positioning');
            else if (step.type === 'action') labelEl.textContent = `${_t('turn_label')} ${actionNo}`;
            else {
                const dw = _t('duel_label') !== 'duel_label' ? _t('duel_label') : 'Duelo';
                labelEl.textContent = `${dw} ${duelNo} · ${this._duelKind(step)}`;
            }
        }
        if (countEl) countEl.textContent = `${this.turnIndex + 1}/${steps.length}`;

        // Board render
        const board = document.getElementById('replay-board');
        if (board) {
            const grid = Array.from({ length: 4 }, () => Array(4).fill(null));
            army.forEach(p => { if (p.x >= 0 && p.x <= 3 && p.y >= 0 && p.y <= 3) grid[p.y][p.x] = p; });
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

        // Sobreposição do duelo: só nos passos de duelo
        const banner  = document.getElementById('replay-duel-info');
        const duelTxt = document.getElementById('rp-duel-text');
        if (banner && duelTxt) {
            if (isDuel) { duelTxt.innerHTML = this._duelHTML(step); banner.classList.add('visible'); }
            else        { banner.classList.remove('visible'); }
        }

        // Nav buttons
        const prevBtn = document.getElementById('btn-replay-prev');
        const nextBtn = document.getElementById('btn-replay-next');
        if (prevBtn) prevBtn.disabled = this.turnIndex === 0;
        if (nextBtn) nextBtn.disabled = this.turnIndex === steps.length - 1;
    },

    prev() { this.renderTurn(this.turnIndex - 1); },
    next() { this.renderTurn(this.turnIndex + 1); },

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
