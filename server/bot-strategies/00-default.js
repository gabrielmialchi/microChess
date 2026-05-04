'use strict';
const { legalMoves, manhattanDist, findKing } = require('./_helpers');

function chooseDraft(state, color) {
    const budget = state.budget[color];
    const inv    = state.inventory[color];
    const hasN   = inv.some(p => p.type === 'N');
    const pawns  = inv.filter(p => p.type === 'P').length;

    if (!hasN && budget >= 3)
        return { event: 'draft_buy', payload: 'N', delayMs: 1400 };
    if (pawns < 2 && budget >= 1)
        return { event: 'draft_buy', payload: 'P', delayMs: 900 };
    return { event: 'draft_ready', delayMs: 700 };
}

function choosePosition(state, color) {
    const inv = state.inventory[color];
    if (inv.length === 0)
        return { event: 'position_ready', delayMs: 900 };

    const piece    = inv[0];
    const occupied = new Set(state.army.map(p => `${p.x},${p.y}`));
    const rows     = color === 'black' ? [2, 3] : [0, 1];
    for (const y of rows) {
        for (let x = 0; x < 4; x++) {
            if (!occupied.has(`${x},${y}`)) {
                return { event: 'position_place', payload: { pieceId: piece.id, x, y }, delayMs: 1000 };
            }
        }
    }
    return null;
}

function chooseAction(state, color) {
    if (state.ready[color]) return null;
    if (state.planning[color])
        return { event: 'action_ready', delayMs: 500 };

    const oppColor = color === 'white' ? 'black' : 'white';
    const oppKing  = findKing(state, oppColor);
    const myPieces = state.army.filter(p => p.color === color);

    let bestMove = null, bestScore = Infinity;
    for (const piece of myPieces) {
        for (const { tx, ty } of legalMoves(piece, state)) {
            const dist = oppKing ? manhattanDist({ x: tx, y: ty }, oppKing) : 99;
            if (dist < bestScore) { bestScore = dist; bestMove = { piece, tx, ty }; }
        }
    }

    if (bestMove) {
        return {
            event:   'action_plan',
            payload: { pieceId: bestMove.piece.id, tx: bestMove.tx, ty: bestMove.ty },
            delayMs: 1500,
        };
    }
    return { event: 'action_ready', delayMs: 1500 };
}

module.exports = {
    id:   0,
    name: 'default',
    chooseDraft,
    choosePosition,
    chooseAction,
};
