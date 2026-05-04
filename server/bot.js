'use strict';
const { getStrategy } = require('./bot-strategies');

function createBotPlayer(roomId) {
    return {
        uid:       'bot_' + roomId,
        nickname:  'Bot',
        avatar:    'N',
        socketId:  'bot_socket_' + roomId,
        timestamp: Date.now(),
        match_mode: 'casual',
    };
}

// Bot AI — decides next action and calls onAction(event, data)
// Uses _botBusy flag on room to prevent double-scheduling.
// Strategy is chosen via room._botStrategy (defaults to 0 = legacy heuristic).
function processBotTurn(room, botColor, onAction) {
    if (room._botBusy) return;
    const state = room.state;
    if (!state || state.phase === 'GAMEOVER') return;

    const strategy = getStrategy(room._botStrategy);
    function schedule(decision) {
        room._botBusy = true;
        setTimeout(() => {
            onAction(decision.event, decision.payload);
            room._botBusy = false;
        }, decision.delayMs ?? 1000);
    }

    // ── DUEL (shared across all strategies) ──────────────────────
    if (state.phase === 'ACTION' && state.duel.active) {
        if (!state.duel.pressed[botColor]) {
            schedule({ event: 'roll_dice', delayMs: 1300 });
        } else if (state.duel.resolveTime && !room.resolving) {
            schedule({ event: 'duel_resolve', delayMs: 800 });
        }
        return;
    }

    // ── DRAFT ────────────────────────────────────────────────────
    if (state.phase === 'DRAFT') {
        if (state.ready[botColor]) return;
        const decision = strategy.chooseDraft(state, botColor);
        if (decision) schedule(decision);
        return;
    }

    // ── POSITION ─────────────────────────────────────────────────
    if (state.phase === 'POSITION') {
        if (state.ready[botColor]) return;
        const decision = strategy.choosePosition(state, botColor);
        if (decision) schedule(decision);
        return;
    }

    // ── ACTION (no active duel) ──────────────────────────────────
    if (state.phase === 'ACTION') {
        if (state.ready[botColor]) return;
        const decision = strategy.chooseAction(state, botColor);
        if (decision) schedule(decision);
        return;
    }

    // ── SUDDEN DEATH (shared duel logic) ─────────────────────────
    if (state.phase === 'SUDDEN_DEATH') {
        if (!state.duel.active) return;
        if (!state.duel.pressed[botColor]) {
            schedule({ event: 'roll_dice', delayMs: 1300 });
        } else if (state.duel.resolveTime && !room.resolving) {
            schedule({ event: 'duel_resolve', delayMs: 800 });
        }
    }
}

module.exports = { createBotPlayer, processBotTurn };
