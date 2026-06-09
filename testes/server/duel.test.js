'use strict';

const assert = require('assert');
const { effectiveBonus, duelOdds, createSDDuel, judgeSDRound, sdSeriesOver, sdWinner } = require('../../server/duel');

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

// ── Morte Súbita (melhor de 3) ────────────────────────────────
test('createSDDuel: estado inicial correto', () => {
    const d = createSDDuel({ type: 'K', color: 'white' }, { type: 'K', color: 'black' });
    assert.strictEqual(d.suddenDeath, true);
    assert.strictEqual(d.sdRound, 1);
    assert.deepStrictEqual(d.sdWins, { white: 0, black: 0 });
    assert.deepStrictEqual(d.sdHistory, []);
});
test('judgeSDRound: maior dado vence', () => {
    assert.strictEqual(judgeSDRound(5, 3), 'white');
    assert.strictEqual(judgeSDRound(2, 6), 'black');
    assert.strictEqual(judgeSDRound(4, 4), 'tie');
});
test('sdSeriesOver: alguém com 2 vitórias encerra', () => {
    assert.strictEqual(sdSeriesOver({ white: 2, black: 0 }, 2), true);
    assert.strictEqual(sdSeriesOver({ white: 1, black: 0 }, 1), false);
});
test('sdSeriesOver: 3 rodadas sempre encerra', () => {
    assert.strictEqual(sdSeriesOver({ white: 1, black: 1 }, 3), true);
});
test('sdWinner: mais vitórias vence', () => {
    assert.strictEqual(sdWinner({ white: 2, black: 1 }), 'white');
    assert.strictEqual(sdWinner({ white: 0, black: 2 }), 'black');
});
test('sdWinner: empate de vitórias → draw', () => {
    assert.strictEqual(sdWinner({ white: 1, black: 1 }), 'draw');
    assert.strictEqual(sdWinner({ white: 0, black: 0 }), 'draw');
});

// ── duelOdds ──────────────────────────────────────────────────
test('duelOdds: soma sempre 100%', () => {
    for (const [a, b] of [[0, 0], [5, 1], [3, 4], [2, 2]]) {
        const o = duelOdds(a, b);
        assert.ok(Math.abs((o.win + o.tie + o.lose) - 1) < 1e-9, `${a},${b}`);
    }
});
test('duelOdds: bônus igual → 41,7% / 16,7% / 41,7%', () => {
    const o = duelOdds(0, 0);
    assert.ok(Math.abs(o.win - 15 / 36) < 1e-9);
    assert.ok(Math.abs(o.tie - 6 / 36) < 1e-9);
    assert.ok(Math.abs(o.lose - 15 / 36) < 1e-9);
});
test('duelOdds: +1 de vantagem → 58,3% vitória', () => {
    const o = duelOdds(1, 0);
    assert.ok(Math.abs(o.win - 21 / 36) < 1e-9);
    assert.ok(Math.abs(o.lose - 10 / 36) < 1e-9);
});
test('duelOdds: simetria — win(a,b) === lose(b,a)', () => {
    const o1 = duelOdds(5, 1);
    const o2 = duelOdds(1, 5);
    assert.ok(Math.abs(o1.win - o2.lose) < 1e-9);
    assert.ok(Math.abs(o1.tie - o2.tie) < 1e-9);
});

console.log(`\n  ${passed} passou · ${failed} falhou\n`);
if (failed > 0) process.exitCode = 1;
