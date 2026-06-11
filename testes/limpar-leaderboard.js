'use strict';

// Uso: node testes/limpar-leaderboard.js --confirmar
// Apaga TODOS os jogadores, partidas, replays e progresso singleplayer do banco.
// O banco de dados volta a ficar vazio (zero contas cadastradas).

const path = require('path');
const DB_PATH = path.join(__dirname, '../server/db/microchess.db');

if (process.argv.indexOf('--confirmar') === -1) {
    console.log('\nIsso vai apagar TODOS os jogadores, partidas, replays e progresso singleplayer.');
    console.log('Esta ação não pode ser desfeita.\n');
    console.log('Para confirmar, rode novamente com:');
    console.log('  node testes/limpar-leaderboard.js --confirmar\n');
    process.exit(0);
}

const Database = require(path.join(__dirname, '../server/node_modules/better-sqlite3'));
const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

const before = {
    players: db.prepare('SELECT COUNT(*) AS n FROM players').get().n,
    matches: db.prepare('SELECT COUNT(*) AS n FROM matches').get().n,
    replays: db.prepare('SELECT COUNT(*) AS n FROM replays').get().n,
};

db.transaction(() => {
    db.prepare('DELETE FROM replays').run();
    db.prepare('DELETE FROM matches').run();
    db.prepare('DELETE FROM singleplayer_progress').run();
    db.prepare('DELETE FROM players').run();
})();

console.log('\nBanco limpo com sucesso:');
console.log(`  Jogadores removidos: ${before.players}`);
console.log(`  Partidas removidas:  ${before.matches}`);
console.log(`  Replays removidos:   ${before.replays}\n`);

db.close();
