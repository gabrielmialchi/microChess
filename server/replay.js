'use strict';

function createReplayBuffer() {
    return { turns: [], startTime: Date.now() };
}

function recordTurn(buffer, turnData) {
    buffer.turns.push({ turn: buffer.turns.length + 1, ...turnData });
}

function buildTurnSnapshot(state) {
    return {
        armyAfter: state.army.map(p => ({
            id: p.id, type: p.type, color: p.color,
            x: p.x, y: p.y, bonus: p.bonus, buffed: p.buffed,
        })),
    };
}

function buildDuelSnapshot(duel, result) {
    return {
        wPieceId: duel.wPiece?.id,
        bPieceId: duel.bPiece?.id,
        rolls:    { white: duel.rolls.white, black: duel.rolls.black },
        bonuses:  { white: duel.wPiece?.bonus, black: duel.bPiece?.bonus },
        result,
    };
}

module.exports = { createReplayBuffer, recordTurn, buildTurnSnapshot, buildDuelSnapshot };
