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

module.exports = { effectiveBonus };
