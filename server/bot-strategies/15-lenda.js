'use strict';
const mestre = require('./14-mestre');
const { scoreMoves } = require('./_minimax');

function chooseAction(state, color) {
    if (state.planning[color]) return { event: 'action_ready', delayMs: 500 };

    const scored = scoreMoves(state, color);
    if (scored.length === 0) return { event: 'action_ready', delayMs: 1500 };

    let chosen;
    if (Math.random() < 0.20 && scored.length > 1) {
        // 20% — escolhe random entre top 3 (ou o que tiver)
        const top = scored.slice(0, Math.min(3, scored.length));
        chosen = top[Math.floor(Math.random() * top.length)];
    } else {
        // 80% — melhor jogada
        chosen = scored[0];
    }

    return {
        event:   'action_plan',
        payload: { pieceId: chosen.move.piece.id, tx: chosen.move.tx, ty: chosen.move.ty },
        delayMs: 2200,
    };
}

module.exports = {
    id:             15,
    name:           'lenda',
    chooseDraft:    mestre.chooseDraft,
    choosePosition: mestre.choosePosition,
    chooseAction,
};
