'use strict';
const db = require('./db/database');

const MAX_LEVEL = 15;

const _selectStmt = db.prepare(
    'SELECT max_level_completed FROM singleplayer_progress WHERE player_id = ?'
);
const _upsertStmt = db.prepare(
    'INSERT INTO singleplayer_progress (player_id, max_level_completed, updated_at) VALUES (?, ?, ?) ' +
    'ON CONFLICT(player_id) DO UPDATE SET max_level_completed = excluded.max_level_completed, updated_at = excluded.updated_at'
);
const _resetStmt = db.prepare(
    'INSERT INTO singleplayer_progress (player_id, max_level_completed, updated_at) VALUES (?, 0, ?) ' +
    'ON CONFLICT(player_id) DO UPDATE SET max_level_completed = 0, updated_at = excluded.updated_at'
);

function _isValidLevel(level) {
    return typeof level === 'number' && Number.isInteger(level) && level >= 1 && level <= MAX_LEVEL;
}

function getProgress(uid) {
    if (!uid) return 0;
    try {
        const row = _selectStmt.get(uid);
        return row ? row.max_level_completed : 0;
    } catch (_) {
        return 0;
    }
}

function validateLevelProgress(uid, level) {
    if (!_isValidLevel(level)) return false;
    if (!uid) return level === 1;
    const max = getProgress(uid);
    return level <= max + 1;
}

function markLevelCompleted(uid, level) {
    if (!uid || !_isValidLevel(level)) return false;
    const current = getProgress(uid);
    if (level <= current) return false;
    try {
        _upsertStmt.run(uid, level, Date.now());
        return true;
    } catch (_) {
        return false;
    }
}

function resetProgress(uid) {
    if (!uid) return false;
    try {
        _resetStmt.run(uid, Date.now());
        return true;
    } catch (_) {
        return false;
    }
}

module.exports = {
    MAX_LEVEL,
    getProgress,
    validateLevelProgress,
    markLevelCompleted,
    resetProgress,
};
