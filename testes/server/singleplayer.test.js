'use strict';

// Testa as garantias de segurança de server/singleplayer.js exigidas em SP-9.3:
//   1. POST /sp/level-complete com level=15 sem ter completado 1..14 → rejeita
//      (provado via validateLevelProgress retornar false; o endpoint responde 400)
//   2. POST sem token → 401
//      (validado por análise estática em server.js:344-352 — requireAuth gate)
//   3. POST com token de outro user → impossível
//      (uid vem de decoded.id no JWT; endpoint nunca lê uid do body)

const assert = require('assert');
const path   = require('path');
const fs     = require('fs');
const os     = require('os');

// Usa DB temporária para não tocar a produção/local
const tempDb = path.join(os.tmpdir(), `mc-sp-test-${process.pid}-${Date.now()}.db`);
process.env.DB_PATH = tempDb;

const db = require('../../server/db/database');
const sp = require('../../server/singleplayer');

const TEST_UID = 'sp-test-uid-' + process.pid;
db.prepare(
    'INSERT OR IGNORE INTO players (id, username, email, password_hash) VALUES (?, ?, ?, ?)'
).run(TEST_UID, 'sptest' + process.pid, 'sptest' + process.pid + '@x.test', 'dummy');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); passed++; }
    catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); failed++; }
}

console.log('\n── singleplayer.js (SP-9.3 security) ──');

// ── Passo 1 do checklist: rejeita pulo de fase ──
test('validateLevelProgress: novato (max=0) pode jogar fase 1', () => {
    sp.resetProgress(TEST_UID);
    assert.strictEqual(sp.validateLevelProgress(TEST_UID, 1), true);
});
test('validateLevelProgress: novato (max=0) NÃO pode pular para fase 15', () => {
    sp.resetProgress(TEST_UID);
    assert.strictEqual(sp.validateLevelProgress(TEST_UID, 15), false);
});
test('validateLevelProgress: novato (max=0) NÃO pode pular para fase 2', () => {
    sp.resetProgress(TEST_UID);
    assert.strictEqual(sp.validateLevelProgress(TEST_UID, 2), false);
});
test('validateLevelProgress: após completar fase 5, pode jogar fase 6 mas não fase 8', () => {
    sp.resetProgress(TEST_UID);
    for (let n = 1; n <= 5; n++) sp.markLevelCompleted(TEST_UID, n);
    assert.strictEqual(sp.getProgress(TEST_UID), 5);
    assert.strictEqual(sp.validateLevelProgress(TEST_UID, 6), true);
    assert.strictEqual(sp.validateLevelProgress(TEST_UID, 8), false);
});

// ── Defesa contra payloads malformados ──
test('validateLevelProgress: nível 0 é rejeitado', () => {
    assert.strictEqual(sp.validateLevelProgress(TEST_UID, 0), false);
});
test('validateLevelProgress: nível 16 (acima do MAX=15) é rejeitado', () => {
    assert.strictEqual(sp.validateLevelProgress(TEST_UID, 16), false);
});
test('validateLevelProgress: nível negativo é rejeitado', () => {
    assert.strictEqual(sp.validateLevelProgress(TEST_UID, -1), false);
});
test('validateLevelProgress: nível string é rejeitado (type guard)', () => {
    assert.strictEqual(sp.validateLevelProgress(TEST_UID, '5'), false);
});
test('validateLevelProgress: nível float é rejeitado', () => {
    assert.strictEqual(sp.validateLevelProgress(TEST_UID, 5.5), false);
});
test('validateLevelProgress: nível undefined/null é rejeitado', () => {
    assert.strictEqual(sp.validateLevelProgress(TEST_UID, undefined), false);
    assert.strictEqual(sp.validateLevelProgress(TEST_UID, null), false);
});

// ── Guest (uid falsy): convidado só pode jogar fase 1, nunca grava no DB ──
test('validateLevelProgress: sem uid (guest) só passa para fase 1', () => {
    assert.strictEqual(sp.validateLevelProgress(null, 1), true);
    assert.strictEqual(sp.validateLevelProgress(null, 2), false);
    assert.strictEqual(sp.validateLevelProgress(undefined, 1), true);
    assert.strictEqual(sp.validateLevelProgress(undefined, 15), false);
});

// ── markLevelCompleted: defesa contra escrita sem uid ──
test('markLevelCompleted: sem uid retorna false (guest nunca grava)', () => {
    assert.strictEqual(sp.markLevelCompleted(null, 5), false);
    assert.strictEqual(sp.markLevelCompleted(undefined, 5), false);
});
test('markLevelCompleted: marca progresso para uid válido', () => {
    sp.resetProgress(TEST_UID);
    assert.strictEqual(sp.markLevelCompleted(TEST_UID, 1), true);
    assert.strictEqual(sp.getProgress(TEST_UID), 1);
});
test('markLevelCompleted: nunca regride (level <= current → false, DB inalterado)', () => {
    sp.resetProgress(TEST_UID);
    sp.markLevelCompleted(TEST_UID, 5);
    assert.strictEqual(sp.markLevelCompleted(TEST_UID, 3), false);
    assert.strictEqual(sp.getProgress(TEST_UID), 5);
});
test('markLevelCompleted: level inválido (16) rejeitado mesmo com uid', () => {
    sp.resetProgress(TEST_UID);
    assert.strictEqual(sp.markLevelCompleted(TEST_UID, 16), false);
    assert.strictEqual(sp.getProgress(TEST_UID), 0);
});

// Cleanup
try {
    db.prepare('DELETE FROM singleplayer_progress WHERE player_id = ?').run(TEST_UID);
    db.prepare('DELETE FROM players WHERE id = ?').run(TEST_UID);
    db.close();
} catch (_) {}
try { fs.unlinkSync(tempDb); } catch (_) {}
try { fs.unlinkSync(tempDb + '-wal'); } catch (_) {}
try { fs.unlinkSync(tempDb + '-shm'); } catch (_) {}

console.log(`\n  ${passed} passou · ${failed} falhou\n`);
if (failed > 0) process.exitCode = 1;
