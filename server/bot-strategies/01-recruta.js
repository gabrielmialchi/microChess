'use strict';
const { randomChoice, legalMoves } = require('./_helpers');

// Level 1 — Recruta: 1 Peão, mal se move. Ideal para primeira vez.
function chooseDraft(state, color) {
    const inv = state.inventory[color];
    if (inv.length === 0 && state.budget[color] >= 1) {
        return { event: 'draft_buy', payload: 'P', delayMs: 1400 };
    }
    return { event: 'draft_ready', delayMs: 800 };
}

function choosePosition(state, color) {
    const inv = state.inventory[color];
    if (inv.length === 0) return { event: 'position_ready', delayMs: 900 };

    const piece    = inv[0];
    const back     = color === 'white' ? 0 : 3;
    const occupied = new Set(state.army.map(p => `${p.x},${p.y}`));
    for (let x = 0; x < 4; x++) {
        if (!occupied.has(`${x},${back}`)) {
            return {
                event:   'position_place',
                payload: { pieceId: piece.id, x, y: back },
                delayMs: 1200,
            };
        }
    }
    return null;
}

function chooseAction(state, color) {
    if (state.planning[color]) return { event: 'action_ready', delayMs: 500 };
    // 70% passa sem mover — o recruta hesita muito
    if (Math.random() < 0.70) return { event: 'action_ready', delayMs: 1800 };

    const myPieces = state.army.filter(p => p.color === color && p.type !== 'K');
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
        delayMs: 1600,
    };
}

module.exports = {
    id:   1,
    name: 'recruta',
    chooseDraft,
    choosePosition,
    chooseAction,
};
