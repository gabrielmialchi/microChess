'use strict';

const assert = require('assert');
const { effectiveBonus } = require('../../server/duel');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); passed++; }
    catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); failed++; }
}

console.log('\n── duel.js ──');

const king = { type: 'K', bonus: 5 };
const rook = { type: 'R', bonus: 4 };

// effectiveBonus — peças comuns
test('effectiveBonus: peça comum usa bônus fixo', () => {
    assert.strictEqual(effectiveBonus(rook, 'white', { type: 'attack', attackerColor: 'white' }), 4);
});

// effectiveBonus — Rei dinâmico
test('effectiveBonus: Rei atacante → +5', () => {
    assert.strictEqual(effectiveBonus(king, 'white', { type: 'attack', attackerColor: 'white' }), 5);
});
test('effectiveBonus: Rei defensor parado → +3', () => {
    assert.strictEqual(effectiveBonus(king, 'black', { type: 'attack', attackerColor: 'white' }), 3);
});
test('effectiveBonus: Rei em choque frontal → +4', () => {
    assert.strictEqual(effectiveBonus(king, 'white', { type: 'frontal' }), 4);
});
test('effectiveBonus: Rei em Morte Súbita → +0', () => {
    assert.strictEqual(effectiveBonus(king, 'white', { suddenDeath: true }), 0);
});
test('effectiveBonus: ambos os Reis em ataque mútuo defendem a +3', () => {
    // case f: dois Reis se atacam → cada um é defensor no duelo do outro
    const d1 = { type: 'attack', attackerColor: 'white' };
    const d2 = { type: 'attack', attackerColor: 'black' };
    assert.strictEqual(effectiveBonus(king, 'black', d1), 3); // Rei preto defende do ataque branco
    assert.strictEqual(effectiveBonus(king, 'white', d2), 3); // Rei branco defende do ataque preto
});
test('effectiveBonus: peça ausente → 0', () => {
    assert.strictEqual(effectiveBonus(null, 'white', { type: 'attack' }), 0);
});

console.log(`\n  ${passed} passou · ${failed} falhou\n`);
if (failed > 0) process.exitCode = 1;
