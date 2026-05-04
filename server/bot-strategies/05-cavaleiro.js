'use strict';
const {
    dirForward, legalMoves, manhattanDist, findKing,
    findPiece, isCellThreatened,
} = require('./_helpers');

function chooseDraft(state, color) {
    const budget = state.budget[color];
    const inv    = state.inventory[color];
    const hasN   = inv.some(p => p.type === 'N');
    const pawns  = inv.filter(p => p.type === 'P').length;
    if (!hasN && budget >= 3) return { event: 'draft_buy', payload: 'N', delayMs: 1200 };
    if (pawns < 2 && budget >= 1) return { event: 'draft_buy', payload: 'P', delayMs: 900 };
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
        // Cavalo no centro da fileira frontal
        targets = [{ x: 1, y: front }, { x: 2, y: front }];
    } else if (piece.type === 'K') {
        // King na fileira de trás, no canto oposto ao N (heurística simples: canto x=0 ou x=3)
        targets = [{ x: 0, y: back }, { x: 3, y: back }, { x: 1, y: back }, { x: 2, y: back }];
    } else if (piece.type === 'P') {
        // Peões nas colunas adjacentes ao Cavalo (frontal); fallback: linha de trás
        targets = [
            { x: 0, y: front }, { x: 3, y: front }, { x: 1, y: front }, { x: 2, y: front },
            { x: 1, y: back },  { x: 2, y: back },  { x: 0, y: back },  { x: 3, y: back },
        ];
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
    const myKnight = findPiece(state, color, 'N');

    // 1ª prioridade: mover Cavalo rumo ao oppKing, escolhendo destino seguro
    if (myKnight && oppKing) {
        const moves = legalMoves(myKnight, state)
            .map(m => ({
                ...m,
                dist:       manhattanDist({ x: m.tx, y: m.ty }, oppKing),
                threatened: isCellThreatened(m.tx, m.ty, state, color),
            }))
            .sort((a, b) => {
                if (a.threatened !== b.threatened) return a.threatened ? 1 : -1; // seguro primeiro
                return a.dist - b.dist;
            });
        if (moves.length > 0) {
            const best = moves[0];
            return {
                event:   'action_plan',
                payload: { pieceId: myKnight.id, tx: best.tx, ty: best.ty },
                delayMs: 1500,
            };
        }
    }

    // 2ª prioridade: avançar peões para frente (sem captura diagonal — é peão de suporte)
    const dir = dirForward(color);
    const myPawns = state.army.filter(p => p.color === color && p.type === 'P');
    for (const pawn of myPawns) {
        const tx = pawn.x;
        const ty = pawn.y + dir;
        if (ty < 0 || ty > 3) continue;
        if (legalMoves(pawn, state).some(m => m.tx === tx && m.ty === ty)) {
            return {
                event:   'action_plan',
                payload: { pieceId: pawn.id, tx, ty },
                delayMs: 1500,
            };
        }
    }

    return { event: 'action_ready', delayMs: 1500 };
}

module.exports = {
    id:   5,
    name: 'cavaleiro',
    chooseDraft,
    choosePosition,
    chooseAction,
};
