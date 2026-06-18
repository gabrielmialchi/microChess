'use strict';

const { effectiveBonus } = require('./duel');

function createReplayBuffer() {
    return { turns: [], startTime: Date.now() };
}

function recordTurn(buffer, turnData) {
    buffer.turns.push({ turn: buffer.turns.length + 1, ts: Date.now(), ...turnData });
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
        wPiece:  duel.wPiece?.id,
        bPiece:  duel.bPiece?.id,
        wType:   duel.wPiece?.type,
        bType:   duel.bPiece?.type,
        duelType: duel.type,        // frontal | attack | contested_king (p/ rótulo de tipo no replay/S37)
        rolls:   { white: duel.rolls.white, black: duel.rolls.black },
        bonuses: { white: effectiveBonus(duel.wPiece, 'white', duel),
                   black: effectiveBonus(duel.bPiece, 'black', duel) },
        result,
    };
}

module.exports = { createReplayBuffer, recordTurn, buildTurnSnapshot, buildDuelSnapshot };
