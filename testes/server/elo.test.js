'use strict';

const assert = require('assert');
const { RANKS, getRankById, applyLPChange, getEloDisplay } = require('../../server/elo');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); passed++; }
    catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); failed++; }
}

console.log('\n── elo.js ──');

// RANKS
test('RANKS: 14 ranks no total (0-13)', () => {
    assert.strictEqual(RANKS.length, 14);
});
test('RANKS: rank 0 = Peão Aprendiz', () => {
    assert.strictEqual(RANKS[0].group, 'Peão');
    assert.strictEqual(RANKS[0].div, 'Aprendiz');
});
test('RANKS: rank 13 = Rei', () => {
    assert.strictEqual(RANKS[13].group, 'Rei');
    assert.strictEqual(RANKS[13].div, null);
});

// getRankById
test('getRankById: id válido retorna rank correto', () => {
    assert.strictEqual(getRankById(6).group, 'Cavalo');
    assert.strictEqual(getRankById(6).div, 'Aprendiz');
});
test('getRankById: id < 0 → clamp para rank 0', () => {
    assert.strictEqual(getRankById(-5).id, 0);
});
test('getRankById: id > 13 → clamp para rank 13', () => {
    assert.strictEqual(getRankById(99).id, 13);
});

// applyLPChange — vitória normal
test('applyLPChange: vitória aumenta LP', () => {
    const { elo_lp } = applyLPChange(0, 50, 0, 16);
    assert.ok(elo_lp > 50, `elo_lp = ${elo_lp}`);
});
test('applyLPChange: derrota diminui LP (sem rebaixamento)', () => {
    const { elo_lp, elo_rank } = applyLPChange(0, 80, 0, -16);
    assert.ok(elo_lp < 80);
    assert.strictEqual(elo_rank, 0);
});

// applyLPChange — promoção
test('applyLPChange: promoção intra-grupo ao ultrapassar 100', () => {
    const { elo_rank, promoted } = applyLPChange(0, 90, 0, 16); // 90 + 24 = 114 → promove para 1
    assert.strictEqual(elo_rank, 1);
    assert.strictEqual(promoted, true);
});
test('applyLPChange: promoção inter-grupo ganha 3 escudos', () => {
    // Rank 2 (Peão Elite) → rank 3 (Bispo Aprendiz) = cruza grupo
    const { elo_rank, elo_shield } = applyLPChange(2, 90, 0, 16);
    assert.strictEqual(elo_rank, 3);
    assert.strictEqual(elo_shield, 3);
});
test('applyLPChange: saldo de LP além de 100 é carregado', () => {
    const { elo_lp } = applyLPChange(0, 90, 0, 30); // 90 + 45 = 135 → promovido, lp = 35
    assert.ok(elo_lp > 0);
});

// applyLPChange — rebaixamento
test('applyLPChange: rebaixamento intra-grupo quando LP < 0', () => {
    // Rank 1 (Peão Esforçado) → rank 0 (Peão Aprendiz), mesmo grupo
    const { elo_rank, demoted } = applyLPChange(1, 5, 0, -16); // 5 - 24 = -19
    assert.strictEqual(elo_rank, 0);
    assert.strictEqual(demoted, true);
});
test('applyLPChange: escudo absorve rebaixamento inter-grupo', () => {
    // Rank 3 (Bispo Aprendiz), LP baixo, escudo alto → não rebaixa
    const { elo_rank, elo_lp, demoted } = applyLPChange(3, 5, 3, -16); // 5 - 19.2 ≈ -14
    assert.strictEqual(elo_rank, 3);
    assert.strictEqual(elo_lp, 0);
    assert.strictEqual(demoted, false);
});
test('applyLPChange: rebaixamento inter-grupo sem escudo → LP cai para 75', () => {
    const { elo_rank, elo_lp, demoted } = applyLPChange(3, 5, 0, -16);
    assert.strictEqual(elo_rank, 2);
    assert.strictEqual(elo_lp, 75);
    assert.strictEqual(demoted, true);
});

// applyLPChange — limites
test('applyLPChange: LP nunca vai abaixo de 0 (rank 0)', () => {
    const { elo_lp, elo_rank } = applyLPChange(0, 5, 0, -100);
    assert.strictEqual(elo_rank, 0);
    assert.strictEqual(elo_lp, 0);
});
test('applyLPChange: Rei (rank 13) LP cap 100', () => {
    const { elo_lp, elo_rank } = applyLPChange(13, 95, 0, 16);
    assert.strictEqual(elo_rank, 13);
    assert.ok(elo_lp <= 100);
});
test('applyLPChange: escudo consumido a cada partida', () => {
    const { elo_shield } = applyLPChange(5, 50, 3, 16);
    assert.strictEqual(elo_shield, 2); // consome 1 de 3
});

// getEloDisplay
test('getEloDisplay: rank com divisão formata "Grupo Divisão"', () => {
    const d = getEloDisplay(6, 40);
    assert.strictEqual(d.name, 'Cavalo Aprendiz');
    assert.strictEqual(d.lp, 40);
});
test('getEloDisplay: rank sem divisão (Rei) formata só grupo', () => {
    const d = getEloDisplay(13, 80);
    assert.strictEqual(d.name, 'Rei');
});
test('getEloDisplay: lp arredondado', () => {
    const d = getEloDisplay(0, 33.7);
    assert.strictEqual(d.lp, 34);
});

console.log(`\n  ${passed} passou · ${failed} falhou\n`);
if (failed > 0) process.exitCode = 1;
