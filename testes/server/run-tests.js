'use strict';

// Roda todos os arquivos *.test.js nesta pasta sequencialmente.
// Uso: node testes/server/run-tests.js

const { execSync } = require('child_process');
const path = require('path');
const fs   = require('fs');

const dir   = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.test.js')).sort();

let totalFailed = 0;
files.forEach(f => {
    try {
        execSync(`node "${path.join(dir, f)}"`, { stdio: 'inherit' });
    } catch {
        totalFailed++;
    }
});

if (totalFailed > 0) {
    console.error(`\n✗ ${totalFailed} arquivo(s) com falhas\n`);
    process.exit(1);
} else {
    console.log('\n✓ Todos os testes passaram\n');
}
