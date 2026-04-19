'use strict';

const K = 32;

function expected(a, b) { return 1 / (1 + Math.pow(10, (b - a) / 400)); }

function calculate(winnerMMR, loserMMR) {
    return {
        winnerDelta: Math.round(K * (1 - expected(winnerMMR, loserMMR))),
        loserDelta:  Math.round(K * (0 - expected(loserMMR, winnerMMR))),
    };
}

// Standard ELO draw: score=0.5 for both.
// +1 floor ensures the weaker player always gains at least 1 MMR from a draw.
function calculateDraw(mmrA, mmrB) {
    let deltaA = Math.round(K * (0.5 - expected(mmrA, mmrB)));
    let deltaB = Math.round(K * (0.5 - expected(mmrB, mmrA)));
    if (mmrA < mmrB && deltaA < 1) deltaA = 1;
    if (mmrB < mmrA && deltaB < 1) deltaB = 1;
    return { deltaA, deltaB };
}

function getRank(mmr) {
    if (mmr < 1200) return { name: 'Peão',      icon: '♟', threshold: 1200 };
    if (mmr < 1400) return { name: 'Bispo',     icon: '♝', threshold: 1400 };
    if (mmr < 1600) return { name: 'Cavaleiro', icon: '♞', threshold: 1600 };
    if (mmr < 1800) return { name: 'Torre',     icon: '♜', threshold: 1800 };
    if (mmr < 2000) return { name: 'Rainha',    icon: '♛', threshold: 2000 };
    return                  { name: 'Rei',       icon: '♚', threshold: null };
}

function getBanDuration(woCount) {
    if (woCount >= 7) return 24 * 60;
    if (woCount >= 5) return 2 * 60;
    if (woCount >= 3) return 30;
    return 0;
}

module.exports = { calculate, calculateDraw, getRank, getBanDuration };
