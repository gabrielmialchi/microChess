'use strict';

// Ranks do mais baixo (0) ao mais alto (13)
const RANKS = [
    { id: 0,  group: 'Peão',   div: 'Aprendiz',  icon: '♟' },
    { id: 1,  group: 'Peão',   div: 'Esforçado', icon: '♟' },
    { id: 2,  group: 'Peão',   div: 'Elite',     icon: '♟' },
    { id: 3,  group: 'Bispo',  div: 'Aprendiz',  icon: '♝' },
    { id: 4,  group: 'Bispo',  div: 'Esforçado', icon: '♝' },
    { id: 5,  group: 'Bispo',  div: 'Elite',     icon: '♝' },
    { id: 6,  group: 'Cavalo', div: 'Aprendiz',  icon: '♞' },
    { id: 7,  group: 'Cavalo', div: 'Esforçado', icon: '♞' },
    { id: 8,  group: 'Cavalo', div: 'Elite',     icon: '♞' },
    { id: 9,  group: 'Torre',  div: 'Aprendiz',  icon: '♜' },
    { id: 10, group: 'Torre',  div: 'Esforçado', icon: '♜' },
    { id: 11, group: 'Torre',  div: 'Elite',     icon: '♜' },
    { id: 12, group: 'Rainha', div: null,        icon: '♛' },
    { id: 13, group: 'Rei',    div: null,        icon: '♚' },
];

// Fator de conversão MMR-delta → PdL por grupo
// Calibrado para ~4-8 vitórias por promoção em cada faixa
const K_LP = {
    'Peão':   1.5,
    'Bispo':  1.2,
    'Cavalo': 1.0,
    'Torre':  0.8,
    'Rainha': 0.7,
    'Rei':    0.6,
};

function getRankById(id) {
    return RANKS[Math.max(0, Math.min(id, RANKS.length - 1))];
}

/**
 * Aplica variação de PdL após uma partida.
 * @param {number} currentRank  - índice atual (0-13)
 * @param {number} currentLP    - PdL atual (0-100)
 * @param {number} currentShield - escudo restante (0-3)
 * @param {number} mmrDelta     - variação de MMR (positivo = vitória, negativo = derrota)
 * @returns {{ elo_rank, elo_lp, elo_shield, promoted, demoted }}
 */
function applyLPChange(currentRank, currentLP, currentShield, mmrDelta) {
    const rank   = RANKS[currentRank] || RANKS[0];
    const shield = Math.max(0, currentShield - 1); // consome 1 escudo por partida jogada

    const k       = K_LP[rank.group] || 1.0;
    const lpDelta = Math.round(mmrDelta * k);
    let newLP     = currentLP + lpDelta;
    let newRank   = currentRank;
    let promoted  = false;
    let demoted   = false;
    let newShield = shield;

    // ── PROMOÇÃO ─────────────────────────────────────────────────
    if (newLP >= 100 && newRank < RANKS.length - 1) {
        const nextGroup = RANKS[newRank + 1].group;
        newLP     = newLP - 100; // saldo positivo carregado
        newRank   = currentRank + 1;
        newShield = nextGroup !== rank.group ? 3 : shield; // escudo ao cruzar grupo
        promoted  = true;
    }

    // ── REBAIXAMENTO ──────────────────────────────────────────────
    if (newLP < 0 && newRank > 0) {
        const prevGroup    = RANKS[newRank - 1]?.group;
        const crossGroup   = prevGroup !== rank.group;

        if (crossGroup && newShield > 0) {
            // Escudo absorve rebaixamento inter-grupo
            newLP = 0;
        } else if (crossGroup) {
            // Rebaixamento inter-grupo sem escudo
            newRank   = currentRank - 1;
            newLP     = 75;
            newShield = 0;
            demoted   = true;
        } else {
            // Rebaixamento intra-grupo (direto)
            newRank = currentRank - 1;
            newLP   = Math.max(0, 100 + newLP); // carrega saldo negativo
            demoted = true;
        }
    }

    // ── LIMITES ───────────────────────────────────────────────────
    newLP   = Math.max(0, newLP);
    newRank = Math.max(0, Math.min(newRank, RANKS.length - 1));
    if (newRank === RANKS.length - 1) newLP = Math.min(100, newLP); // Rei: máximo 100

    return { elo_rank: newRank, elo_lp: Math.round(newLP), elo_shield: newShield, promoted, demoted, lpDelta };
}

function getEloDisplay(rankId, lp) {
    const r    = RANKS[Math.max(0, Math.min(rankId ?? 0, RANKS.length - 1))];
    const name = r.div ? `${r.group} ${r.div}` : r.group;
    return { name, icon: r.icon, lp: Math.round(lp ?? 0), group: r.group };
}

module.exports = { RANKS, getRankById, applyLPChange, getEloDisplay };
