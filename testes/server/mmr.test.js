'use strict';

const assert = require('assert');
const { calculate, calculateDraw, getRank, getBanDuration } = require('../../server/mmr');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); passed++; }
    catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); failed++; }
}

console.log('\n── mmr.js ──');

// calculate
test('calculate: igual MMR → delta ~16/-16', () => {
    const { winnerDelta, loserDelta } = calculate(1500, 1500);
    assert.strictEqual(winnerDelta, 16);
    assert.strictEqual(loserDelta, -16);
});
test('calculate: favorito perde menos / ganha menos', () => {
    const fav = calculate(1800, 1200); // favorito vence
    const und = calculate(1200, 1800); // azarão vence
    assert.ok(fav.winnerDelta < und.winnerDelta, 'favorito ganha menos ao vencer');
    assert.ok(fav.loserDelta > und.loserDelta,   'favorito perde menos ao perder');
});
test('calculate: deltas são inteiros', () => {
    const { winnerDelta, loserDelta } = calculate(1550, 1430);
    assert.ok(Number.isInteger(winnerDelta));
    assert.ok(Number.isInteger(loserDelta));
});

// calculateDraw
test('calculateDraw: igual MMR → deltas perto de 0', () => {
    const { deltaA, deltaB } = calculateDraw(1500, 1500);
    assert.ok(Math.abs(deltaA) <= 1);
    assert.ok(Math.abs(deltaB) <= 1);
});
test('calculateDraw: jogador mais fraco recebe mínimo +1', () => {
    const { deltaA } = calculateDraw(1200, 1800); // A é fraco
    assert.ok(deltaA >= 1, `deltaA = ${deltaA}, esperado >= 1`);
});
test('calculateDraw: jogador mais forte não ultrapassa 0 em empate com fraco', () => {
    const { deltaB } = calculateDraw(1200, 1800); // B é forte
    assert.ok(deltaB <= 0, `deltaB = ${deltaB}, esperado <= 0`);
});

// getRank
test('getRank: MMR 1100 → Peão', () => {
    assert.strictEqual(getRank(1100).name, 'Peão');
});
test('getRank: MMR 1200 → Bispo (exato no limite)', () => {
    assert.strictEqual(getRank(1200).name, 'Bispo');
});
test('getRank: MMR 1600 → Torre', () => {
    assert.strictEqual(getRank(1600).name, 'Torre');
});
test('getRank: MMR 2000 → Rei', () => {
    assert.strictEqual(getRank(2000).name, 'Rei');
});
test('getRank: retorna threshold correto', () => {
    assert.strictEqual(getRank(1100).threshold, 1200);
    assert.strictEqual(getRank(2000).threshold, null);
});

// getBanDuration
test('getBanDuration: 2 WOs → 0 min', () => {
    assert.strictEqual(getBanDuration(2), 0);
});
test('getBanDuration: 3 WOs → 30 min', () => {
    assert.strictEqual(getBanDuration(3), 30);
});
test('getBanDuration: 5 WOs → 120 min', () => {
    assert.strictEqual(getBanDuration(5), 120);
});
test('getBanDuration: 7 WOs → 1440 min (24h)', () => {
    assert.strictEqual(getBanDuration(7), 24 * 60);
});
test('getBanDuration: 10 WOs → 1440 min (máximo)', () => {
    assert.strictEqual(getBanDuration(10), 24 * 60);
});

console.log(`\n  ${passed} passou · ${failed} falhou\n`);
if (failed > 0) process.exitCode = 1;
