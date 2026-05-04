'use strict';
const {
    legalMoves, manhattanDist, findKing,
    pieceBonus, isPieceUnderThreat, isCellThreatened,
} = require('./_helpers');

function chooseDraft(state, color) {
    const budget = state.budget[color];
    const inv    = state.inventory[color];
    const hasN   = inv.some(p => p.type === 'N');
    const hasB   = inv.some(p => p.type === 'B');
    if (!hasN && budget >= 3) return { event: 'draft_buy', payload: 'N', delayMs: 1100 };
    if (!hasB && budget >= 2) return { event: 'draft_buy', payload: 'B', delayMs: 1000 };
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
        targets = [{ x: 1, y: back }, { x: 2, y: back }];
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

    const oppColor  = color === 'white' ? 'black' : 'white';
    const oppKing   = findKing(state, oppColor);
    const myPieces  = state.army.filter(p => p.color === color);

    // ── Fase 1: alguma peça própria sob ameaça? ──────────────
    const threatened = myPieces
        .filter(p => p.type !== 'K')
        .filter(p => isPieceUnderThreat(p, state))
        .sort((a, b) => pieceBonus(b.type) - pieceBonus(a.type));

    if (threatened.length > 0) {
        const target    = threatened[0];
        const safeMoves = legalMoves(target, state)
            .filter(m => !isCellThreatened(m.tx, m.ty, state, color))
            .sort((a, b) => {
                const da = oppKing ? manhattanDist({ x: a.tx, y: a.ty }, oppKing) : 99;
                const db = oppKing ? manhattanDist({ x: b.tx, y: b.ty }, oppKing) : 99;
                return da - db;
            });
        if (safeMoves.length > 0) {
            const m = safeMoves[0];
            return {
                event:   'action_plan',
                payload: { pieceId: target.id, tx: m.tx, ty: m.ty },
                delayMs: 1700,
            };
        }
        // se nenhuma fuga segura, segue para fase 2 (vai morrer mas tenta avançar com outra peça)
    }

    // ── Fase 2: heurística Caçador (mira oppKing) ────────────
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
            delayMs: 1700,
        };
    }
    return { event: 'action_ready', delayMs: 1500 };
}

module.exports = {
    id:   9,
    name: 'estrategista',
    chooseDraft,
    choosePosition,
    chooseAction,
};
