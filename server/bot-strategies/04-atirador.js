'use strict';
const { dirForward, legalMoves } = require('./_helpers');

function chooseDraft(state, color) {
    const budget = state.budget[color];
    const inv    = state.inventory[color];
    const pawns  = inv.filter(p => p.type === 'P').length;
    if (pawns < 5 && budget >= 1) {
        return { event: 'draft_buy', payload: 'P', delayMs: 900 };
    }
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
        // King no canto da fileira de trás (longe da linha de fogo)
        targets = [{ x: 0, y: back }, { x: 3, y: back }, { x: 1, y: back }, { x: 2, y: back }];
    } else if (piece.type === 'P') {
        // 4 peões na fileira frontal primeiro; 5º vai para o centro da fileira de trás
        targets = [];
        for (let x = 0; x < 4; x++) targets.push({ x, y: front });
        targets.push({ x: 1, y: back });
        targets.push({ x: 2, y: back });
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

    const dir = dirForward(color);
    const myPawns = state.army.filter(p => p.color === color && p.type === 'P');
    // ordem: mais avançado primeiro, tiebreak por x crescente
    myPawns.sort((a, b) => {
        if (color === 'white') {
            if (b.y !== a.y) return b.y - a.y;
        } else {
            if (a.y !== b.y) return a.y - b.y;
        }
        return a.x - b.x;
    });

    // 1ª passada: prefere captura diagonal (move agressivo)
    for (const pawn of myPawns) {
        const captures = legalMoves(pawn, state).filter(m => {
            return Math.abs(m.tx - pawn.x) === 1 && (m.ty - pawn.y) === dir;
        });
        if (captures.length > 0) {
            const c = captures[0];
            return {
                event:   'action_plan',
                payload: { pieceId: pawn.id, tx: c.tx, ty: c.ty },
                delayMs: 1500,
            };
        }
    }

    // 2ª passada: avanço frontal
    for (const pawn of myPawns) {
        const tx = pawn.x;
        const ty = pawn.y + dir;
        if (ty < 0 || ty > 3) continue;
        const ok = legalMoves(pawn, state).some(m => m.tx === tx && m.ty === ty);
        if (ok) {
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
    id:   4,
    name: 'atirador',
    chooseDraft,
    choosePosition,
    chooseAction,
};
