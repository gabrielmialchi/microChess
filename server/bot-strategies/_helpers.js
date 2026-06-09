'use strict';
const { isValidMove } = require('../movegen');

const BONUS = { Q: 5, R: 4, N: 3, B: 2, P: 1, K: 0 };

function randomChoice(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
}

function weightedChoice(items, weights) {
    if (!items || items.length === 0) return null;
    const total = weights.reduce((a, b) => a + b, 0);
    if (total <= 0) return randomChoice(items);
    let r = Math.random() * total;
    for (let i = 0; i < items.length; i++) {
        r -= weights[i];
        if (r <= 0) return items[i];
    }
    return items[items.length - 1];
}

function manhattanDist(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function pieceBonus(type) {
    return BONUS[type] ?? 0;
}

// Bônus de COMBATE (diferente do material): o Rei luta forte.
// +5 quando ataca, +3 quando defende parado (espelha effectiveBonus do jogo).
// Demais peças usam o bônus normal. Usado só na predição de duelo do minimax.
function combatBonus(type, isAttacker) {
    if (type === 'K') return isAttacker ? 5 : 3;
    return BONUS[type] ?? 0;
}

function findKing(state, color) {
    return state.army.find(p => p.type === 'K' && p.color === color);
}

function findPiece(state, color, type) {
    return state.army.find(p => p.type === type && p.color === color);
}

function dirForward(color) {
    return color === 'white' ? 1 : -1;
}

function enemyAt(x, y, state, myColor) {
    return state.army.find(p => p.x === x && p.y === y && p.color !== myColor) || null;
}

function legalMoves(piece, state) {
    const out = [];
    for (let tx = 0; tx < 4; tx++) {
        for (let ty = 0; ty < 4; ty++) {
            if (tx === piece.x && ty === piece.y) continue;
            if (isValidMove(piece, tx, ty, state.army)) out.push({ tx, ty });
        }
    }
    return out;
}

function isPieceUnderThreat(piece, state) {
    const enemies = state.army.filter(p => p.color !== piece.color);
    for (const e of enemies) {
        if (isValidMove(e, piece.x, piece.y, state.army)) return true;
    }
    return false;
}

function isCellThreatened(x, y, state, myColor) {
    const enemies = state.army.filter(p => p.color !== myColor);
    for (const e of enemies) {
        if (isValidMove(e, x, y, state.army)) return true;
    }
    return false;
}

module.exports = {
    BONUS,
    randomChoice,
    weightedChoice,
    manhattanDist,
    pieceBonus,
    combatBonus,
    findKing,
    findPiece,
    dirForward,
    enemyAt,
    legalMoves,
    isPieceUnderThreat,
    isCellThreatened,
};
