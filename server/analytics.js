'use strict';
const db = require('./db/database');

const _stmt = db.prepare('INSERT INTO events (ts, type, user_id, match_id, metadata) VALUES (?, ?, ?, ?, ?)');

function logEvent(type, userId, matchId, metadata) {
    try {
        _stmt.run(Date.now(), type, userId || null, matchId || null, metadata != null ? JSON.stringify(metadata) : null);
    } catch (_) {}
}

module.exports = { logEvent };
