CREATE TABLE IF NOT EXISTS players (
    id              TEXT PRIMARY KEY,
    username        TEXT UNIQUE NOT NULL,
    email           TEXT UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    mmr             INTEGER DEFAULT 1500,
    wins            INTEGER DEFAULT 0,
    losses          INTEGER DEFAULT 0,
    draws           INTEGER DEFAULT 0,
    wo_count        INTEGER DEFAULT 0,
    wo_against      INTEGER DEFAULT 0,
    ban_until       TEXT DEFAULT NULL,
    email_hash      TEXT,
    email_enc       TEXT,
    elo_rank        INTEGER DEFAULT 0,
    elo_lp          INTEGER DEFAULT 0,
    elo_shield      INTEGER DEFAULT 0,
    created_at      TEXT DEFAULT (datetime('now')),
    last_seen       TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS matches (
    id               TEXT PRIMARY KEY,
    player_white_id  TEXT NOT NULL,
    player_black_id  TEXT NOT NULL,
    result           TEXT CHECK(result IN ('white','black','draw','wo_white','wo_black')),
    mmr_change_white INTEGER DEFAULT 0,
    mmr_change_black INTEGER DEFAULT 0,
    total_turns      INTEGER DEFAULT 0,
    duration_ms      INTEGER DEFAULT 0,
    created_at       TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (player_white_id) REFERENCES players(id),
    FOREIGN KEY (player_black_id) REFERENCES players(id)
);

CREATE TABLE IF NOT EXISTS replays (
    id          TEXT PRIMARY KEY,
    match_id    TEXT NOT NULL,
    turns_json  TEXT NOT NULL,
    created_at  TEXT DEFAULT (datetime('now')),
    expires_at  TEXT DEFAULT (datetime('now', '+30 days')),
    FOREIGN KEY (match_id) REFERENCES matches(id)
);

CREATE INDEX IF NOT EXISTS idx_players_mmr        ON players(mmr DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_players_email_hash ON players(email_hash);
CREATE INDEX IF NOT EXISTS idx_players_ban      ON players(ban_until);
CREATE INDEX IF NOT EXISTS idx_matches_created  ON matches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_replays_match    ON replays(match_id);
