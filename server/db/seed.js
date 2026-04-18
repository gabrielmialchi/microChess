'use strict';

const db = require('./database');

const tables = ['players', 'matches', 'replays'];

for (const table of tables) {
    const row = db.prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name=?`
    ).get(table);
    if (row) {
        console.log(`✅ Tabela '${table}' OK`);
    } else {
        console.error(`❌ Tabela '${table}' NÃO encontrada`);
        process.exit(1);
    }
}

const indexes = db.prepare(
    `SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'`
).all();
console.log(`✅ Índices: ${indexes.map(i => i.name).join(', ')}`);

console.log('\n✅ Database OK — microchess.db pronto para uso.');
process.exit(0);
