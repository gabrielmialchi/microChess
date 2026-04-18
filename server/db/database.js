'use strict';

const path = require('path');
const Database = require('better-sqlite3');
const crypto = require('crypto');
const fs = require('fs');

const DB_PATH    = path.join(__dirname, 'microchess.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
db.exec(schema);

// ── EMAIL CRYPTO (same defaults as server.js) ─────────────────
const HMAC_SECRET = process.env.HMAC_SECRET || 'mc-hmac-dev-secret-key';
const _AES_KEY    = Buffer.from(
    (process.env.AES_KEY || 'mc-aes-key-dev-000000000000000').padEnd(32, '0').slice(0, 32)
);

function _hashEmail(email) {
    return crypto.createHmac('sha256', HMAC_SECRET).update(email).digest('hex');
}
function _encryptEmail(email) {
    const iv     = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', _AES_KEY, iv);
    const enc    = Buffer.concat([cipher.update(email, 'utf8'), cipher.final()]);
    const tag    = cipher.getAuthTag();
    return `${iv.toString('hex')}:${enc.toString('hex')}:${tag.toString('hex')}`;
}

// ── MIGRATIONS ────────────────────────────────────────────────
const newCols = [
    'ALTER TABLE players ADD COLUMN email_hash TEXT',
    'ALTER TABLE players ADD COLUMN email_enc  TEXT',
    'ALTER TABLE players ADD COLUMN elo_rank   INTEGER DEFAULT 0',
    'ALTER TABLE players ADD COLUMN elo_lp     INTEGER DEFAULT 0',
    'ALTER TABLE players ADD COLUMN elo_shield INTEGER DEFAULT 0',
];
for (const sql of newCols) {
    try { db.exec(sql); } catch (_) {}
}
try {
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_players_email_hash ON players(email_hash)');
} catch (_) {}

// Migrate existing users: hash + encrypt plaintext emails
const pending = db.prepare('SELECT id, email FROM players WHERE email_hash IS NULL').all();
if (pending.length > 0) {
    const stmt = db.prepare('UPDATE players SET email_hash=?, email_enc=?, email=? WHERE id=?');
    db.transaction(() => {
        for (const u of pending) {
            if (!u.email || u.email.split(':').length === 3) continue; // already encrypted
            const norm = u.email.toLowerCase().trim();
            const hash = _hashEmail(norm);
            const enc  = _encryptEmail(norm);
            stmt.run(hash, enc, enc, u.id);
        }
    })();
}

module.exports = db;
