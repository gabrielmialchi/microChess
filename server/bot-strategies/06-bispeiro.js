'use strict';
const {
    dirForward, legalMoves, manhattanDist, findKing,
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
        // Bispos nos cantos da fileira de trás (controlam diagonais opostas)
        targets = [{ x: 0, y: back }, { x: 3, y: back }];
    } else if (piece.type === 'K') {
        // King no centro
        targets = [{ x: 1, y: back }, { x: 2, y: back }];
    } else if (piece.type === 'P') {
        // Peão no centro da fileira de trás (espaço livre após bispos+king)
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
    const myBishops = state.army.filter(p => p.color === color && p.type === 'B');

    // entre os 2 bispos, escolhe o que pode chegar mais perto do oppKing após mover
    let bestMove = null, bestDist = Infinity;
    for (const bishop of myBishops) {
        for (const { tx, ty } of legalMoves(bishop, state)) {
            const dist = oppKing ? manhattanDist({ x: tx, y: ty }, oppKing) : 99;
            if (dist < bestDist) {
                bestDist = dist;
                bestMove = { piece: bishop, tx, ty };
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

    // fallback: avança o peão de suporte
    const dir = dirForward(color);
    const myPawn = state.army.find(p => p.color === color && p.type === 'P');
    if (myPawn) {
        const tx = myPawn.x;
        const ty = myPawn.y + dir;
        if (ty >= 0 && ty <= 3 && legalMoves(myPawn, state).some(m => m.tx === tx && m.ty === ty)) {
            return {
                event:   'action_plan',
                payload: { pieceId: myPawn.id, tx, ty },
                delayMs: 1500,
            };
        }
    }

    return { event: 'action_ready', delayMs: 1500 };
}

module.exports = {
    id:   6,
    name: 'bispeiro',
    chooseDraft,
    choosePosition,
    chooseAction,
};
