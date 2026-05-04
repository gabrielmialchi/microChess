'use strict';
const {
    legalMoves, manhattanDist, findKing, findPiece,
    enemyAt, isCellThreatened,
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
    const myQ      = findPiece(state, color, 'Q');
    const myKing   = findKing(state, color);

    if (myQ) {
        const moves = legalMoves(myQ, state);
        if (moves.length > 0) {
            // score composto: menor é melhor
            const scored = moves.map(m => {
                const isOppKing = oppKing && m.tx === oppKing.x && m.ty === oppKing.y;
                const enemy     = enemyAt(m.tx, m.ty, state, color);
                const dist      = oppKing ? manhattanDist({ x: m.tx, y: m.ty }, oppKing) : 99;
                const threat    = isCellThreatened(m.tx, m.ty, state, color);
                let score = dist;
                if (isOppKing)         score -= 100; // capturar King = vitória
                else if (enemy)        score -= 3;   // capturar peça inimiga
                if (threat && !enemy)  score += 5;   // só penaliza se é casa exposta sem ganho
                return { ...m, score };
            }).sort((a, b) => a.score - b.score);

            const best = scored[0];
            return {
                event:   'action_plan',
                payload: { pieceId: myQ.id, tx: best.tx, ty: best.ty },
                delayMs: 1800,
            };
        }
    }

    // Q não pode mover (cercada ou morta) → mexe King
    if (myKing) {
        const kMoves = legalMoves(myKing, state);
        if (kMoves.length > 0) {
            return {
                event:   'action_plan',
                payload: { pieceId: myKing.id, tx: kMoves[0].tx, ty: kMoves[0].ty },
                delayMs: 1500,
            };
        }
    }

    return { event: 'action_ready', delayMs: 1500 };
}

module.exports = {
    id:   13,
    name: 'rainha',
    chooseDraft,
    choosePosition,
    chooseAction,
};
