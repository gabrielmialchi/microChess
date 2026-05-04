'use strict';
const { scoreMoves } = require('./_minimax');

function chooseDraft(state, color) {
    const budget = state.budget[color];
    const inv    = state.inventory[color];
    const hasN   = inv.some(p => p.type === 'N');
    const hasB   = inv.some(p => p.type === 'B');
    if (!hasN && budget >= 3) return { event: 'draft_buy', payload: 'N', delayMs: 1200 };
    if (!hasB && budget >= 2) return { event: 'draft_buy', payload: 'B', delayMs: 1100 };
    return { event: 'draft_ready', delayMs: 700 };
}

function choosePosition(state, color) {
    const inv = state.inventory[color];
    if (inv.length === 0) return { event: 'position_ready', delayMs: 900 };

    const piece    = inv[0];
    const back     = color === 'white' ? 0 : 3;
    const front    = color === 'white' ? 1 : 2;
    const occupied = new Set(state.army.map(p => `${p.x},${p.y}`));

    let targets = [];
    if (piece.type === 'N') {
        targets = [{ x: 1, y: front }, { x: 2, y: front }];
    } else if (piece.type === 'B') {
        targets = [{ x: 2, y: back }, { x: 1, y: back }];
    } else if (piece.type === 'K') {
        targets = [{ x: 0, y: back }, { x: 3, y: back }];
    }

    for (const t of targets) {
        if (!occupied.has(`${t.x},${t.y}`)) {
            return {
                event:   'position_place',
                payload: { pieceId: piece.id, x: t.x, y: t.y },
                delayMs: 1000,
            };
        }
    }
    return null;
}

function chooseAction(state, color) {
    if (state.planning[color]) return { event: 'action_ready', delayMs: 500 };

    const scored = scoreMoves(state, color);
    if (scored.length === 0) return { event: 'action_ready', delayMs: 1500 };

    const best = scored[0];
    return {
        event:   'action_plan',
        payload: { pieceId: best.move.piece.id, tx: best.move.tx, ty: best.move.ty },
        delayMs: 2200,
    };
}

module.exports = {
    id:   14,
    name: 'mestre',
    chooseDraft,
    choosePosition,
    chooseAction,
};
