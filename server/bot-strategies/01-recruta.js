'use strict';
const { randomChoice, legalMoves } = require('./_helpers');

const COSTS = { Q: 5, R: 4, N: 3, B: 2, P: 1 };

function chooseDraft(state, color) {
    const budget = state.budget[color];
    const affordable = Object.keys(COSTS).filter(t => COSTS[t] <= budget);
    if (affordable.length === 0) {
        return { event: 'draft_ready', delayMs: 700 };
    }
    const choice = randomChoice(affordable);
    return { event: 'draft_buy', payload: choice, delayMs: 900 };
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
    if (slots.length === 0) return null;
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
    if (allMoves.length === 0) return { event: 'action_ready', delayMs: 1500 };
    const m = randomChoice(allMoves);
    return {
        event:   'action_plan',
        payload: { pieceId: m.piece.id, tx: m.tx, ty: m.ty },
        delayMs: 1500,
    };
}

module.exports = {
    id:   1,
    name: 'recruta',
    chooseDraft,
    choosePosition,
    chooseAction,
};
