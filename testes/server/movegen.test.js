'use strict';

const assert = require('assert');
const { isValidMove, promotePawns } = require('../../server/movegen');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); passed++; }
    catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); failed++; }
}

console.log('\n── movegen.js ──');

// ── promotePawns ──────────────────────────────────────────────
test('promotePawns: peão branco em y=3 vira Rainha (bônus 5)', () => {
    const army = [{ id: 'wp', type: 'P', color: 'white', x: 1, y: 3, bonus: 1 }];
    promotePawns(army);
    assert.strictEqual(army[0].type, 'Q');
    assert.strictEqual(army[0].bonus, 5);
});
test('promotePawns: peão preto em y=0 vira Rainha (bônus 5)', () => {
    const army = [{ id: 'bp', type: 'P', color: 'black', x: 2, y: 0, bonus: 1 }];
    promotePawns(army);
    assert.strictEqual(army[0].type, 'Q');
    assert.strictEqual(army[0].bonus, 5);
});
test('promotePawns: remove flag buffed ao promover', () => {
    const army = [{ id: 'wp', type: 'P', color: 'white', x: 0, y: 3, bonus: 2, buffed: true }];
    promotePawns(army);
    assert.strictEqual(army[0].buffed, undefined);
});
test('promotePawns: peão fora do fundo não muda', () => {
    const army = [{ id: 'wp', type: 'P', color: 'white', x: 1, y: 2, bonus: 1 }];
    promotePawns(army);
    assert.strictEqual(army[0].type, 'P');
    assert.strictEqual(army[0].bonus, 1);
});
test('promotePawns: peça não-peão no fundo não muda', () => {
    const army = [{ id: 'wr', type: 'R', color: 'white', x: 1, y: 3, bonus: 4 }];
    promotePawns(army);
    assert.strictEqual(army[0].type, 'R');
});

// ── peão promovido move como Rainha ───────────────────────────
test('Rainha promovida move na diagonal e na reta', () => {
    const q = { id: 'q', type: 'Q', color: 'white', x: 0, y: 0, bonus: 5 };
    const army = [q];
    assert.ok(isValidMove(q, 3, 3, army), 'diagonal');
    assert.ok(isValidMove(q, 0, 3, army), 'vertical');
    assert.ok(isValidMove(q, 3, 0, army), 'horizontal');
    assert.ok(!isValidMove(q, 1, 2, army), 'movimento de cavalo é inválido');
});

// ── sanidade peão comum ───────────────────────────────────────
test('peão avança 1 casa vertical para vazio', () => {
    const p = { id: 'p', type: 'P', color: 'white', x: 1, y: 1, bonus: 1 };
    assert.ok(isValidMove(p, 1, 2, [p]));
});
test('peão captura na diagonal para frente', () => {
    const p = { id: 'p', type: 'P', color: 'white', x: 1, y: 1, bonus: 1 };
    const e = { id: 'e', type: 'P', color: 'black', x: 2, y: 2, bonus: 1 };
    assert.ok(isValidMove(p, 2, 2, [p, e]));
});

console.log(`\n  ${passed} passou · ${failed} falhou\n`);
if (failed > 0) process.exitCode = 1;
