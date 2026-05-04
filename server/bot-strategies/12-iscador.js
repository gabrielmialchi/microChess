'use strict';
const {
    dirForward, legalMoves, manhattanDist, findKing, findPiece,
    isPieceUnderThreat, isCellThreatened,
} = require('./_helpers');

function chooseDraft(state, color) {
    const budget = state.budget[color];
    const inv    = state.inventory[color];
    const hasR   = inv.some(p => p.type === 'R');
    const pawns  = inv.filter(p => p.type === 'P').length;
    if (!hasR && budget >= 4) return { event: 'draft_buy', payload: 'R', delayMs: 1100 };
    if (pawns < 1 && budget >= 1) return { event: 'draft_buy', payload: 'P', delayMs: 900 };
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
    if (piece.type === 'P') {
        // Peão isca à frente
        targets = [{ x: 1, y: front }, { x: 2, y: front }];
    } else if (piece.type === 'R') {
        // Torre atrás do peão isca
        targets = [{ x: 1, y: back }, { x: 2, y: back }];
    } else if (piece.type === 'K') {
        // King no canto, longe do corredor de ataque
        targets = [{ x: 3, y: back }, { x: 0, y: back }];
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
    const dir      = dirForward(color);
    const myR      = findPiece(state, color, 'R');
    const myPawn   = state.army.find(p => p.color === color && p.type === 'P');

    // 1. R sob ameaça → recua para casa segura (proteger peça forte)
    if (myR && isPieceUnderThreat(myR, state)) {
        const safe = legalMoves(myR, state)
            .filter(m => !isCellThreatened(m.tx, m.ty, state, color));
        if (safe.length > 0) {
            const m = safe[0];
            return {
                event:   'action_plan',
                payload: { pieceId: myR.id, tx: m.tx, ty: m.ty },
                delayMs: 1700,
            };
        }
    }

    // 2. Peão isca ainda vivo → avança para abrir caminho (sacrifício planejado)
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

    // 3. Peão morreu/bloqueado → Torre avança rumo ao oppKing
    if (myR && oppKing) {
        const moves = legalMoves(myR, state)
            .map(m => ({ ...m, dist: manhattanDist({ x: m.tx, y: m.ty }, oppKing) }))
            .sort((a, b) => a.dist - b.dist);
        if (moves.length > 0) {
            const m = moves[0];
            return {
                event:   'action_plan',
                payload: { pieceId: myR.id, tx: m.tx, ty: m.ty },
                delayMs: 1600,
            };
        }
    }

    return { event: 'action_ready', delayMs: 1500 };
}

module.exports = {
    id:   12,
    name: 'iscador',
    chooseDraft,
    choosePosition,
    chooseAction,
};
