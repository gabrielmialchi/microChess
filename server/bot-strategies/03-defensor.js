'use strict';
const { manhattanDist, findKing, legalMoves } = require('./_helpers');

function chooseDraft(state, color) {
    const budget  = state.budget[color];
    const inv     = state.inventory[color];
    const bishops = inv.filter(p => p.type === 'B').length;
    const pawns   = inv.filter(p => p.type === 'P').length;
    if (bishops < 2 && budget >= 2) return { event: 'draft_buy', payload: 'B', delayMs: 1000 };
    if (pawns   < 1 && budget >= 1) return { event: 'draft_buy', payload: 'P', delayMs: 900 };
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
    if (piece.type === 'K') {
        // King centralizado na fileira de trás
        targets = [{ x: 1, y: back }, { x: 2, y: back }];
    } else if (piece.type === 'B') {
        // Bispos nos cantos da fileira de trás
        targets = [{ x: 0, y: back }, { x: 3, y: back }];
    } else if (piece.type === 'P') {
        // Peão à frente do centro (defesa do King)
        targets = [{ x: 1, y: front }, { x: 2, y: front }];
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
    // fallback: qualquer slot vazio na própria metade
    for (const y of [back, front]) {
        for (let x = 0; x < 4; x++) {
            if (!occupied.has(`${x},${y}`)) {
                return {
                    event:   'position_place',
                    payload: { pieceId: piece.id, x, y },
                    delayMs: 1000,
                };
            }
        }
    }
    return null;
}

function chooseAction(state, color) {
    if (state.planning[color]) return { event: 'action_ready', delayMs: 500 };

    const myKing   = findKing(state, color);
    const myPieces = state.army.filter(p => p.color === color && p.type !== 'K');
    const inMyHalf = (y) => color === 'white' ? y <= 1 : y >= 2;

    let bestMove = null, bestScore = Infinity;
    for (const piece of myPieces) {
        for (const { tx, ty } of legalMoves(piece, state)) {
            if (!inMyHalf(ty)) continue;
            const dist = myKing ? manhattanDist({ x: tx, y: ty }, myKing) : 99;
            if (dist < bestScore) { bestScore = dist; bestMove = { piece, tx, ty }; }
        }
    }

    if (!bestMove) return { event: 'action_ready', delayMs: 1500 };
    return {
        event:   'action_plan',
        payload: { pieceId: bestMove.piece.id, tx: bestMove.tx, ty: bestMove.ty },
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
