'use strict';
const {
    legalMoves, manhattanDist, findKing, findPiece,
    pieceBonus, enemyAt, isPieceUnderThreat, isCellThreatened,
} = require('./_helpers');

function chooseDraft(state, color) {
    const budget = state.budget[color];
    const inv    = state.inventory[color];
    const hasQ   = inv.some(p => p.type === 'Q');
    if (!hasQ && budget >= 5) return { event: 'draft_buy', payload: 'Q', delayMs: 1300 };
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
    if (piece.type === 'Q') {
        targets = [{ x: 1, y: front }, { x: 2, y: front }];
    } else if (piece.type === 'K') {
        targets = [{ x: 0, y: back }, { x: 3, y: back }, { x: 1, y: back }, { x: 2, y: back }];
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
    const myPieces = state.army.filter(p => p.color === color);

    // 1. Duelos vencíveis ou empatados (>=)
    const wins = [];
    for (const piece of myPieces) {
        for (const { tx, ty } of legalMoves(piece, state)) {
            const enemy = enemyAt(tx, ty, state, color);
            if (enemy) {
                const myB = pieceBonus(piece.type);
                const opB = pieceBonus(enemy.type);
                if (myB >= opB) {
                    wins.push({ piece, tx, ty, gain: myB - opB });
                }
            }
        }
    }
    if (wins.length > 0) {
        wins.sort((a, b) => b.gain - a.gain);
        const w = wins[0];
        return {
            event:   'action_plan',
            payload: { pieceId: w.piece.id, tx: w.tx, ty: w.ty },
            delayMs: 1700,
        };
    }

    // 2. Queen sob ameaça? Recua para casa segura
    const myQ = findPiece(state, color, 'Q');
    if (myQ && isPieceUnderThreat(myQ, state)) {
        const safe = legalMoves(myQ, state)
            .filter(m => !isCellThreatened(m.tx, m.ty, state, color));
        if (safe.length > 0) {
            const m = safe[0];
            return {
                event:   'action_plan',
                payload: { pieceId: myQ.id, tx: m.tx, ty: m.ty },
                delayMs: 1700,
            };
        }
    }

    // 3. Avança Queen rumo ao oppKing
    if (myQ && oppKing) {
        const moves = legalMoves(myQ, state)
            .map(m => ({ ...m, dist: manhattanDist({ x: m.tx, y: m.ty }, oppKing) }))
            .sort((a, b) => a.dist - b.dist);
        if (moves.length > 0) {
            const m = moves[0];
            return {
                event:   'action_plan',
                payload: { pieceId: myQ.id, tx: m.tx, ty: m.ty },
                delayMs: 1500,
            };
        }
    }

    return { event: 'action_ready', delayMs: 1500 };
}

module.exports = {
    id:   10,
    name: 'duelista',
    chooseDraft,
    choosePosition,
    chooseAction,
};
