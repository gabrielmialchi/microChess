'use strict';
const { randomChoice, enemyAt, legalMoves, dirForward } = require('./_helpers');

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
        targets = [{ x: 1, y: back }, { x: 2, y: back }, { x: 0, y: back }, { x: 3, y: back }];
    } else if (piece.type === 'P') {
        // peões na fileira frontal primeiro; o 5º cai na fileira de trás
        targets = [];
        for (let x = 0; x < 4; x++) targets.push({ x, y: front });
        for (let x = 0; x < 4; x++) targets.push({ x, y: back });
    } else {
        // qualquer outra peça (não esperado para Aprendiz, mas defensivo)
        targets = [];
        for (let y of [back, front]) for (let x = 0; x < 4; x++) targets.push({ x, y });
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

    const myPawns = state.army.filter(p => p.color === color && p.type === 'P');
    const dir = dirForward(color);
    const candidates = [];
    for (const pawn of myPawns) {
        for (const { tx, ty } of legalMoves(pawn, state)) {
            // só avanço vertical para frente (não diagonal, não recuar)
            if (tx !== pawn.x) continue;
            if (ty - pawn.y !== dir) continue;
            // sem captura — casa deve estar vazia
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
