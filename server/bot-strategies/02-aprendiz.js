'use strict';
const { randomChoice, enemyAt, legalMoves, dirForward } = require('./_helpers');

// Level 2 — Aprendiz: 2 Peões, avança devagar. Mais fácil que o Recruta original.
function chooseDraft(state, color) {
    const inv = state.inventory[color];
    if (inv.length < 2 && state.budget[color] >= 1) {
        return { event: 'draft_buy', payload: 'P', delayMs: 1000 };
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

    // coloca peões nos cantos da fileira de frente (menos obstruente que o centro)
    const targets = piece.type === 'K'
        ? [{ x: 1, y: back }, { x: 2, y: back }, { x: 0, y: back }, { x: 3, y: back }]
        : [{ x: 0, y: front }, { x: 3, y: front }, { x: 1, y: front }, { x: 2, y: front },
           { x: 0, y: back  }, { x: 3, y: back  }];

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
    // 50% passa — aprendiz ainda hesita
    if (Math.random() < 0.50) return { event: 'action_ready', delayMs: 1600 };

    const dir = dirForward(color);
    const myPawns = state.army.filter(p => p.color === color && p.type === 'P');
    const candidates = [];
    for (const pawn of myPawns) {
        for (const { tx, ty } of legalMoves(pawn, state)) {
            if (tx !== pawn.x) continue;
            if (ty - pawn.y !== dir) continue;
            if (enemyAt(tx, ty, state, color)) continue;
            candidates.push({ piece: pawn, tx, ty });
        }
    }
    if (candidates.length === 0) return { event: 'action_ready', delayMs: 1500 };
    const m = randomChoice(candidates);
    return {
        event:   'action_plan',
        payload: { pieceId: m.piece.id, tx: m.tx, ty: m.ty },
        delayMs: 1500,
    };
}

module.exports = {
    id:   2,
    name: 'aprendiz',
    chooseDraft,
    choosePosition,
    chooseAction,
};
