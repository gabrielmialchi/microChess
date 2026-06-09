'use strict';

/**
 * duel.js — Lógica pura de resolução de duelo, isolada do server.js.
 * Importada por server.js e pelos testes unitários.
 */

/**
 * Bônus efetivo de uma peça num duelo específico.
 *
 * Peças comuns usam seu bônus fixo. O Rei tem bônus DINÂMICO por cenário:
 *   +5  Rei é o atacante (avança sobre peça inimiga, incl. outro Rei)
 *   +4  Rei em choque frontal (Rei e outra peça vão à mesma casa)
 *   +3  Rei parado sofrendo tentativa de captura (defensor)
 *   +0  Morte Súbita (Rei vs Rei, disputa limpa pelo dado)
 *
 * @param {object} piece  peça em duelo (tem .type e .bonus)
 * @param {'white'|'black'} color  cor do lado a que a peça pertence neste duelo
 * @param {object} duel   objeto de duelo (tem .type, .attackerColor, .suddenDeath)
 * @returns {number}
 */
function effectiveBonus(piece, color, duel) {
    if (!piece) return 0;
    if (piece.type !== 'K') return piece.bonus;
    if (duel.suddenDeath) return 0;
    if (duel.type === 'frontal') return 4;
    if (duel.type === 'attack')  return duel.attackerColor === color ? 5 : 3;
    return 5; // fallback (ex.: contested_king — Rei não é o mover aqui)
}

// ── MORTE SÚBITA — melhor de 3 rodadas (Variante A) ───────────
// Cada rodada: 1d6 vs 1d6, maior vence a rodada (empate = ninguém).
// Série: primeiro a 2 vitórias OU mais vitórias após 3 rodadas.
// Empate de vitórias após 3 rodadas → DRAW (equilíbrio real).

const SD_MAX_ROUNDS = 3;

/** Cria o objeto de duelo de Morte Súbita (Reis com bônus 0 via effectiveBonus). */
function createSDDuel(kW, kB) {
    return {
        active: true, resolveTime: false,
        suddenDeath: true, wPiece: kW, bPiece: kB,
        sdWins:    { white: 0, black: 0 },
        sdRound:   1,
        sdHistory: [],
        pressed:   { white: false, black: false },
        rolls:     { white: 0,     black: 0     },
    };
}

/** Vencedor de uma rodada a partir dos dois dados. */
function judgeSDRound(rollW, rollB) {
    if (rollW > rollB) return 'white';
    if (rollB > rollW) return 'black';
    return 'tie';
}

/** A série acabou? (alguém chegou a 2, ou já se jogaram 3 rodadas) */
function sdSeriesOver(sdWins, sdRound) {
    return sdWins.white >= 2 || sdWins.black >= 2 || sdRound >= SD_MAX_ROUNDS;
}

/** Vencedor da série: 'white' | 'black' | 'draw' (empate de vitórias). */
function sdWinner(sdWins) {
    if (sdWins.white > sdWins.black) return 'white';
    if (sdWins.black > sdWins.white) return 'black';
    return 'draw';
}

// ── PROBABILIDADE DE DUELO ────────────────────────────────────
// Dois d6: total = dado + bônus. Maior vence; empate é empate
// (semântica de quem morre fica a cargo de finishDuel).
// Retorna frações (0..1) da perspectiva do BRANCO.
function duelOdds(bonusW, bonusB) {
    let win = 0, tie = 0, lose = 0;
    for (let a = 1; a <= 6; a++) {
        for (let b = 1; b <= 6; b++) {
            const tw = a + bonusW, tb = b + bonusB;
            if (tw > tb) win++; else if (tb > tw) lose++; else tie++;
        }
    }
    return { win: win / 36, tie: tie / 36, lose: lose / 36 };
}

module.exports = {
    effectiveBonus, duelOdds,
    SD_MAX_ROUNDS,
    createSDDuel, judgeSDRound, sdSeriesOver, sdWinner,
};
