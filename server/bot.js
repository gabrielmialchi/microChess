'use strict';
const { isValidMove } = require('./movegen');

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
// Uses _botBusy flag on room to prevent double-scheduling
function processBotTurn(room, botColor, onAction) {
    if (room._botBusy) return;
    const state = room.state;
    if (!state || state.phase === 'GAMEOVER') return;

    function done() { room._botBusy = false; }

    // ── DRAFT ────────────────────────────────────────────────────
    if (state.phase === 'DRAFT') {
        if (state.ready[botColor]) return;
        const budget = state.budget[botColor];
        const inv    = state.inventory[botColor];
        const hasN   = inv.some(p => p.type === 'N');
        const pawns  = inv.filter(p => p.type === 'P').length;
        room._botBusy = true;
        if (!hasN && budget >= 3)          setTimeout(() => { onAction('draft_buy', 'N'); done(); }, 1400);
        else if (pawns < 2 && budget >= 1) setTimeout(() => { onAction('draft_buy', 'P'); done(); }, 900);
        else                               setTimeout(() => { onAction('draft_ready');    done(); }, 700);
        return;
    }

    // ── POSITION ─────────────────────────────────────────────────
    if (state.phase === 'POSITION') {
        if (state.ready[botColor]) return;
        const inv = state.inventory[botColor];
        if (inv.length === 0) {
            room._botBusy = true;
            setTimeout(() => { onAction('position_ready'); done(); }, 900);
            return;
        }
        const piece    = inv[0];
        const occupied = new Set(state.army.map(p => `${p.x},${p.y}`));
        const rows     = botColor === 'black' ? [2, 3] : [0, 1];
        const slots    = [];
        for (const y of rows) for (let x = 0; x < 4; x++) slots.push({ x, y });
        const pos = slots.find(p => !occupied.has(`${p.x},${p.y}`));
        if (pos) {
            room._botBusy = true;
            setTimeout(() => { onAction('position_place', { pieceId: piece.id, x: pos.x, y: pos.y }); done(); }, 1000);
        }
        return;
    }

    // ── ACTION ───────────────────────────────────────────────────
    if (state.phase === 'ACTION') {
        if (state.duel.active) {
            if (!state.duel.pressed[botColor]) {
                room._botBusy = true;
                setTimeout(() => { onAction('roll_dice'); done(); }, 1300);
            } else if (state.duel.resolveTime && !room.resolving) {
                room._botBusy = true;
                setTimeout(() => { onAction('duel_resolve'); done(); }, 800);
            }
            return;
        }
        if (state.ready[botColor]) return;

        // Already planned — just confirm
        if (state.planning[botColor]) {
            room._botBusy = true;
            setTimeout(() => { onAction('action_ready'); done(); }, 500);
            return;
        }

        // Pick move: prefer pieces closest to opponent king
        const oppColor = botColor === 'white' ? 'black' : 'white';
        const oppKing  = state.army.find(p => p.type === 'K' && p.color === oppColor);
        const myPieces = state.army.filter(p => p.color === botColor);
        let bestMove = null, bestScore = Infinity;

        for (const piece of myPieces) {
            for (let tx = 0; tx < 4; tx++) {
                for (let ty = 0; ty < 4; ty++) {
                    if (tx === piece.x && ty === piece.y) continue;
                    if (!isValidMove(piece, tx, ty, state.army)) continue;
                    const dist = oppKing
                        ? Math.abs(tx - oppKing.x) + Math.abs(ty - oppKing.y) : 99;
                    if (dist < bestScore) { bestScore = dist; bestMove = { piece, tx, ty }; }
                }
            }
        }

        room._botBusy = true;
        if (bestMove) {
            setTimeout(() => {
                onAction('action_plan', { pieceId: bestMove.piece.id, tx: bestMove.tx, ty: bestMove.ty });
                done();
                // next processBotTurn call will see planning[botColor] set and call action_ready
            }, 1500);
        } else {
            setTimeout(() => { onAction('action_ready'); done(); }, 1500);
        }
        return;
    }

    // ── SUDDEN DEATH ─────────────────────────────────────────────
    if (state.phase === 'SUDDEN_DEATH') {
        if (!state.duel.active) return;
        if (!state.duel.pressed[botColor]) {
            room._botBusy = true;
            setTimeout(() => { onAction('roll_dice'); done(); }, 1300);
        } else if (state.duel.resolveTime && !room.resolving) {
            room._botBusy = true;
            setTimeout(() => { onAction('duel_resolve'); done(); }, 800);
        }
    }
}

module.exports = { createBotPlayer, processBotTurn };
