'use strict';
const {
    legalMoves, manhattanDist, findKing,
} = require('./_helpers');

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
    const occupied = new Set(state.army.map(p => `${p.x},${p.y}`));

    let targets = [];
    if (piece.type === 'B') {
        targets = [{ x: 0, y: back }, { x: 3, y: back }];
    } else if (piece.type === 'K') {
        targets = [{ x: 1, y: back }, { x: 2, y: back }];
    } else if (piece.type === 'P') {
        targets = [{ x: 2, y: back }, { x: 1, y: back }];
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

    const oppColor = color === 'white' ? 'black' : 'white';
    const oppKing  = findKing(state, oppColor);
    const myPieces = state.army.filter(p => p.color === color && p.type !== 'K');

    // 1ª prioridade: movimentos para flancos (x=0 ou x=3)
    const flank = [];
    for (const piece of myPieces) {
        for (const { tx, ty } of legalMoves(piece, state)) {
            if (tx !== 0 && tx !== 3) continue;
            const dist = oppKing ? manhattanDist({ x: tx, y: ty }, oppKing) : 99;
            flank.push({ piece, tx, ty, dist });
        }
    }
    if (flank.length > 0) {
        flank.sort((a, b) => a.dist - b.dist);
        const f = flank[0];
        return {
            event:   'action_plan',
            payload: { pieceId: f.piece.id, tx: f.tx, ty: f.ty },
            delayMs: 1600,
        };
    }

    // 2ª prioridade: fallback Caçador
    let bestMove = null, bestDist = Infinity;
    for (const piece of myPieces) {
        for (const { tx, ty } of legalMoves(piece, state)) {
            const dist = oppKing ? manhattanDist({ x: tx, y: ty }, oppKing) : 99;
            if (dist < bestDist) {
                bestDist = dist;
                bestMove = { piece, tx, ty };
            }
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
    id:   11,
    name: 'cercador',
    chooseDraft,
    choosePosition,
    chooseAction,
};
