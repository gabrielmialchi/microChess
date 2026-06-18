'use strict';
const { randomChoice, legalMoves, manhattanDist, findKing } = require('./_helpers');

const COSTS = { Q: 5, R: 4, N: 3, B: 2, P: 1 };

// Level 3 — Defensor: gasta até 3pts (peças baratas aleatórias), move semi-aleatório.
// É o comportamento do antigo "Recruta" mas com budget reduzido.
function chooseDraft(state, color) {
    const budget = state.budget[color];
    const spent  = 5 - budget;
    if (spent >= 3) return { event: 'draft_ready', delayMs: 700 };

    const maxSpend  = 3 - spent;
    const affordable = Object.keys(COSTS).filter(t => COSTS[t] <= Math.min(budget, maxSpend));
    if (!affordable.length) return { event: 'draft_ready', delayMs: 700 };
    return { event: 'draft_buy', payload: randomChoice(affordable), delayMs: 1000 };
}

function choosePosition(state, color) {
    const inv = state.inventory[color];
    if (inv.length === 0) return { event: 'position_ready', delayMs: 900 };

    const piece    = inv[0];
    const occupied = new Set(state.army.map(p => `${p.x},${p.y}`));
    const rows     = color === 'black' ? [2, 3] : [0, 1];
    const slots    = [];
    for (const y of rows) {
        for (let x = 0; x < 4; x++) {
            if (!occupied.has(`${x},${y}`)) slots.push({ x, y });
        }
    }
    if (!slots.length) return null;
    const t = randomChoice(slots);
    return {
        event:   'position_place',
        payload: { pieceId: piece.id, x: t.x, y: t.y },
        delayMs: 1000,
    };
}

function chooseAction(state, color) {
    if (state.planning[color]) return { event: 'action_ready', delayMs: 500 };

    const myPieces = state.army.filter(p => p.color === color);
    const allMoves = [];
    for (const piece of myPieces) {
        for (const { tx, ty } of legalMoves(piece, state)) {
            allMoves.push({ piece, tx, ty });
        }
    }
    if (!allMoves.length) return { event: 'action_ready', delayMs: 1500 };

    // 45% avança não-Rei em direção ao Rei inimigo; 55% aleatório
    const oppKing = findKing(state, color === 'white' ? 'black' : 'white');
    let chosen = null;
    if (oppKing && Math.random() < 0.45) {
        const advancing = allMoves.filter(m => m.piece.type !== 'K');
        let best = Infinity;
        for (const m of advancing) {
            const d = manhattanDist({ x: m.tx, y: m.ty }, oppKing);
            if (d < best) { best = d; chosen = m; }
        }
    }
    if (!chosen) chosen = randomChoice(allMoves);

    return {
        event:   'action_plan',
        payload: { pieceId: chosen.piece.id, tx: chosen.tx, ty: chosen.ty },
        delayMs: 1500,
    };
}

module.exports = {
    id:   3,
    name: 'defensor',
    chooseDraft,
    choosePosition,
    chooseAction,
};
