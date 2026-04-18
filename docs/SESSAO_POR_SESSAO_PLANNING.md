# microChess — Plano de Implementação: MMR + Auth + Sistemas Completos
## Revisado na Sessão 0 — 2026-04-17
## Leia CLAUDE.md antes de iniciar qualquer sessão.

---

## ⚠️ Sobre Tokens: Resposta Honesta

**Não existe garantia de que uma sessão não esgote os tokens.** O risco depende de:
- Tamanho dos arquivos lidos no contexto
- Volume de código gerado

**O que este plano faz para minimizar o risco:**
1. Cada sessão tem uma responsabilidade única
2. `server.js` (544L) e `index.html` (~1.200L) nunca são reescritos — apenas recebem inserções
3. Toda lógica nova vai em arquivos novos (custo zero de leitura prévia)
4. Sessões 1-4 não tocam em `index.html`

**Protocolo se os tokens acabarem no meio:**
```bash
git add . && git commit -m "WIP Sessão X — parou em [arquivo]"
# Registrar no ACTIVITY_LOG.md
# Próxima janela de 5h: retomar do commit + colar contexto
```

---

## Sistemas Considerados

| Sistema | Sessão | Tipo |
|---------|--------|------|
| Banco de dados (SQLite) | 1 | Backend |
| Autenticação JWT | 2 | Backend |
| MMR / ELO | 3 | Backend |
| Sistema de WO + Ban | 3 | Backend |
| Timer AFK / Timeout | 3 | Backend |
| Replay Recording (servidor) | 4 | Backend |
| Leaderboard endpoint | 4 | Backend |
| Anti-cheat básico | 4 | Backend |
| Login screen + Ban overlay | 5 | Frontend |
| MMR badge + Menu populate | 5 | Frontend |
| Leaderboard + Replay viewer | 6 | Frontend |

---

## Índice de Sessões

| Sessão | Tema | Risco | Arquivos tocados |
|--------|------|-------|-----------------|
| 1 | Database SQLite | 🟢 Muito baixo | Só arquivos novos |
| 2 | Auth JWT | 🟡 Baixo | `server.js` +35L + auth.js novo |
| 3 | MMR + WO/Ban + AFK | 🟡 Médio | `server.js` +80L + mmr.js novo |
| 4 | Replay + Leaderboard + Anti-cheat | 🟡 Médio | `server.js` +60L + replay.js novo |
| 5 | Frontend Auth + Ban | 🟠 Médio-alto | `index.html` 5 pontos + auth-frontend.js novo |
| 6 | Frontend Leaderboard + Replay | 🟠 Médio-alto | `index.html` 4 pontos + rank-ui.js + replay-ui.js novos |

---

# SESSÃO 1: DATABASE SQLITE

## Objetivo
Criar banco de dados com TODOS os campos necessários para os sistemas planejados.

## Risco: 🟢 Muito baixo — apenas arquivos novos

## Arquivos
```
server/db/schema.sql     ← NOVO
server/db/database.js    ← NOVO
server/db/seed.js        ← NOVO (verificação)
server/package.json      ← +dependência better-sqlite3 e script db:setup
```

## Schema Completo

### Tabela `players`
```sql
CREATE TABLE IF NOT EXISTS players (
    id              TEXT PRIMARY KEY,
    username        TEXT UNIQUE NOT NULL,
    email           TEXT UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    mmr             INTEGER DEFAULT 1500,
    wins            INTEGER DEFAULT 0,
    losses          INTEGER DEFAULT 0,
    draws           INTEGER DEFAULT 0,
    wo_count        INTEGER DEFAULT 0,   -- WOs causados (você desconectou/AFKou)
    wo_against      INTEGER DEFAULT 0,   -- WOs sofridos (oponente desconectou)
    ban_until       TEXT DEFAULT NULL,   -- ISO timestamp UTC; NULL = sem ban
    created_at      TEXT DEFAULT (datetime('now')),
    last_seen       TEXT DEFAULT (datetime('now'))
);
```

### Tabela `matches`
```sql
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
```

### Tabela `replays`
```sql
CREATE TABLE IF NOT EXISTS replays (
    id          TEXT PRIMARY KEY,
    match_id    TEXT NOT NULL,
    turns_json  TEXT NOT NULL,           -- JSON array de turnos (ver CLAUDE.md)
    created_at  TEXT DEFAULT (datetime('now')),
    expires_at  TEXT DEFAULT (datetime('now', '+30 days')),
    FOREIGN KEY (match_id) REFERENCES matches(id)
);
```

### Índices
```sql
CREATE INDEX IF NOT EXISTS idx_players_mmr      ON players(mmr DESC);
CREATE INDEX IF NOT EXISTS idx_players_ban      ON players(ban_until);
CREATE INDEX IF NOT EXISTS idx_matches_created  ON matches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_replays_match    ON replays(match_id);
```

## Checklist Final
```
✅ better-sqlite3 instalado
✅ schema.sql com 3 tabelas + índices
✅ players tem: ban_until, wo_count, wo_against
✅ matches tem: result com tipos wo_white/wo_black
✅ replays tem: turns_json + expires_at (30 dias)
✅ database.js exporta instância singleton com WAL + FK
✅ seed.js verifica tabelas e imprime OK
✅ Nenhum arquivo existente alterado
```

## Prompt para esta Sessão
```
Contexto: microChess — jogo de xadrez 4x4 online. Servidor Node.js em
server/server.js (544 linhas, Socket.io). NÃO tocar em server.js nesta sessão.

Tarefa: Criar banco de dados SQLite com schema completo para todos os sistemas
do projeto (auth, MMR, WO/ban, replays).

Crie:
1. server/db/schema.sql
   - Tabela players: id, username, email, password_hash, mmr(1500), wins,
     losses, draws, wo_count, wo_against, ban_until(NULL), created_at, last_seen
   - Tabela matches: id, player_white_id, player_black_id,
     result('white'|'black'|'draw'|'wo_white'|'wo_black'), mmr_change_white,
     mmr_change_black, total_turns, duration_ms, created_at
   - Tabela replays: id, match_id, turns_json(TEXT), created_at, expires_at(+30 dias)
   - Índices em mmr DESC, ban_until, created_at DESC, match_id
   
2. server/db/database.js
   - Inicializa better-sqlite3 com WAL mode e foreign_keys ON
   - Roda schema na startup
   - Exporta instância singleton
   
3. server/db/seed.js
   - Verifica as 3 tabelas e imprime status
   - process.exit(0) ao final

4. Adicione ao server/package.json:
   - better-sqlite3 nas dependências
   - "db:setup": "node db/seed.js" nos scripts

Restrições: NÃO tocar em server.js nem index.html.
Entregar arquivos completos + como testar.
```

---

# SESSÃO 2: AUTENTICAÇÃO JWT

## Objetivo
Login e registro. Integrar token ao matchmaking de forma retrocompatível.

## Risco: 🟡 Baixo — lê server.js (544L), adiciona ~35 linhas

## Arquivos
```
server/auth.js      ← NOVO
server/server.js    ← +3 requires + 2 endpoints + modificação em queue_join
```

## O que fazer

### 1. `server/auth.js`
- `hashPassword(plain)` — bcrypt hash
- `checkPassword(plain, hash)` — bcrypt compare
- `signToken(payload)` — JWT 30 dias
- `verifyToken(token)` — retorna payload ou null

### 2. Adicionar ao `server.js` (3 requires, logo após os existentes)
```javascript
const { hashPassword, checkPassword, signToken, verifyToken } = require('./auth');
const db = require('./db/database');
```

### 3. `POST /auth/register` (após /health)
- Input: `{ username, email, password }`
- Valida: senha ≥ 6 chars
- Hash + INSERT players
- Retorna: `{ token, id, username, mmr: 1500 }`
- Erro 409 se email/username duplicado

### 4. `POST /auth/login`
- Input: `{ email, password }`
- SELECT + bcrypt.compare
- UPDATE last_seen
- Retorna: `{ token, id, username, mmr, rank: {name, icon} }`

### 5. Modificação em `queue_join` — início do handler, retrocompatível
```javascript
const { uid, nickname, avatar, token, mmr: clientMMR } = profile || {};
let playerId = uid;
let playerMMR = clientMMR || 1500;
if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
        playerId = decoded.id;
        const rec = db.prepare('SELECT mmr, ban_until FROM players WHERE id = ?').get(decoded.id);
        if (rec) {
            playerMMR = rec.mmr;
            // Verificação de ban (implementada completamente na Sessão 3)
        }
    }
}
if (!playerId) return;
// Substituir uid por playerId no restante
```

## Checklist Final
```
✅ bcrypt + jsonwebtoken instalados
✅ auth.js com 4 funções
✅ POST /auth/register funcional (curl)
✅ POST /auth/login funcional (curl)
✅ queue_join aceita token opcional — não quebra clientes sem auth
✅ server.js: nenhum bloco existente foi removido
```

## Prompt para esta Sessão
```
Contexto: microChess, server.js existente (544L). Sessão 1 criou SQLite com
tabelas players, matches, replays em server/db/database.js.

Tarefa: Adicionar autenticação JWT.

Crie server/auth.js com: hashPassword, checkPassword, signToken, verifyToken.

Adicione ao server.js (APENAS inserção, não substituição):
- require('./auth') e require('./db/database')
- POST /auth/register (após /health)
- POST /auth/login
- No início do handler queue_join: extrair e validar token opcional,
  usar playerId e playerMMR do banco se autenticado

npm install: bcrypt jsonwebtoken

Restrições:
- queue_join retrocompatível (sem token ainda funciona)
- Mostrar exatamente onde cada inserção ocorre no server.js
- NÃO tocar em index.html

Entregar arquivos + comandos curl para testar register e login.
```

---

# SESSÃO 3: MMR + WO/BAN + AFK TIMEOUT

## Objetivo
Calcular e persistir MMR; implementar sistema de ban por WO; detectar AFK e decretar WO automático.

## Risco: 🟡 Médio — lê server.js (~580L), adiciona ~80 linhas

## Arquivos
```
server/mmr.js       ← NOVO
server/server.js    ← +1 require + persistMatchResult + banCheck + afkTimers
```

## O que fazer

### 1. `server/mmr.js`
```javascript
const K = 32;

function expected(a, b) { return 1 / (1 + Math.pow(10, (b - a) / 400)); }

function calculate(winnerMMR, loserMMR) {
    return {
        winnerDelta: Math.round(K * (1 - expected(winnerMMR, loserMMR))),
        loserDelta:  Math.round(K * (0 - expected(loserMMR, winnerMMR))),
    };
}

function getRank(mmr) {
    if (mmr < 1200) return { name: 'Peão',      icon: '♟', threshold: 1200 };
    if (mmr < 1400) return { name: 'Bispo',     icon: '♝', threshold: 1400 };
    if (mmr < 1600) return { name: 'Cavaleiro', icon: '♞', threshold: 1600 };
    if (mmr < 1800) return { name: 'Torre',     icon: '♜', threshold: 1800 };
    if (mmr < 2000) return { name: 'Rainha',    icon: '♛', threshold: 2000 };
    return                  { name: 'Rei',       icon: '♚', threshold: null };
}

// Duração do ban em minutos baseado em wo_count
function getBanDuration(woCount) {
    if (woCount >= 7) return 24 * 60;   // 24h
    if (woCount >= 5) return 2 * 60;    // 2h
    if (woCount >= 3) return 30;        // 30min
    return 0;                            // sem ban
}

module.exports = { calculate, getRank, getBanDuration };
```

### 2. `persistMatchResult(room, winnerColor, isWO)` — adicionar ao server.js
```javascript
function persistMatchResult(room, winnerColor, isWO = false) {
    try {
        const wp = room.players.white;
        const bp = room.players.black;
        if (!wp?.uid || !bp?.uid) return;

        const wRec = db.prepare('SELECT mmr, wo_count FROM players WHERE id = ?').get(wp.uid);
        const bRec = db.prepare('SELECT mmr, wo_count FROM players WHERE id = ?').get(bp.uid);
        if (!wRec || !bRec) return;

        let wDelta = 0, bDelta = 0, result;

        if (isWO) {
            // WO: sem perda de MMR para quem causou; oponente ganha normalmente
            if (winnerColor === 'white') {
                result = 'wo_black';
                wDelta = Math.round(K_WO_BONUS); // pequeno bônus para quem sofreu WO
                db.prepare('UPDATE players SET wo_count=wo_count+1, wo_against=wo_against+1 WHERE id=?').run(bp.uid);
                db.prepare('UPDATE players SET wo_against=wo_against+1 WHERE id=?').run(wp.uid);
                applyBan(bp.uid, bRec.wo_count + 1);
            } else {
                result = 'wo_white';
                bDelta = Math.round(K_WO_BONUS);
                db.prepare('UPDATE players SET wo_count=wo_count+1, wo_against=wo_against+1 WHERE id=?').run(wp.uid);
                db.prepare('UPDATE players SET wo_against=wo_against+1 WHERE id=?').run(bp.uid);
                applyBan(wp.uid, wRec.wo_count + 1);
            }
        } else {
            const { calculate: calcMMR } = require('./mmr');
            if (winnerColor === 'white') {
                ({ winnerDelta: wDelta, loserDelta: bDelta } = calcMMR(wRec.mmr, bRec.mmr));
                result = 'white';
            } else if (winnerColor === 'black') {
                ({ winnerDelta: bDelta, loserDelta: wDelta } = calcMMR(bRec.mmr, wRec.mmr));
                result = 'black';
            } else {
                result = 'draw';
            }
        }

        // Atualizar stats
        db.prepare('UPDATE players SET mmr=mmr+?, wins=wins+?, losses=losses+? WHERE id=?')
          .run(wDelta, result==='white'?1:0, result==='black'||result==='wo_black'?1:0, wp.uid);
        db.prepare('UPDATE players SET mmr=mmr+?, wins=wins+?, losses=losses+? WHERE id=?')
          .run(bDelta, result==='black'?1:0, result==='white'||result==='wo_white'?1:0, bp.uid);

        // Salvar partida
        const matchId = crypto.randomUUID();
        room._matchId = matchId;  // para o replay (Sessão 4)
        db.prepare('INSERT INTO matches (id,player_white_id,player_black_id,result,mmr_change_white,mmr_change_black) VALUES (?,?,?,?,?,?)')
          .run(matchId, wp.uid, bp.uid, result, wDelta, bDelta);

        // Atualizar last_seen
        db.prepare("UPDATE players SET last_seen=datetime('now') WHERE id IN (?,?)").run(wp.uid, bp.uid);

        // Emitir update de MMR para cada jogador
        const wNew = wRec.mmr + wDelta;
        const bNew = bRec.mmr + bDelta;
        const { getRank } = require('./mmr');
        io.to(wp.socketId).emit('mmr_update', { delta: wDelta, newMMR: wNew, rank: getRank(wNew), isWO });
        io.to(bp.socketId).emit('mmr_update', { delta: bDelta, newMMR: bNew, rank: getRank(bNew), isWO });
    } catch (e) {
        console.error('[MMR] Erro ao persistir:', e.message);
    }
}

const K_WO_BONUS = 8;  // MMR ganho por sofrer WO

function applyBan(playerId, newWoCount) {
    const { getBanDuration } = require('./mmr');
    const minutes = getBanDuration(newWoCount);
    if (minutes > 0) {
        const banUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();
        db.prepare('UPDATE players SET ban_until=? WHERE id=?').run(banUntil, playerId);
        console.log(`[BAN] ${playerId} banido por ${minutes} minutos.`);
    }
}
```

### 3. AFK Timeout — adicionar ao server.js
Adicionar `timeouts: {}` ao criar cada sala (`rooms.set`), e:

```javascript
const AFK_ACTION_MS  = 45_000;  // 45s na ACTION phase
const AFK_PREPARE_MS = 120_000; // 120s no DRAFT/POSITION phase

function startAFKTimer(room, color, ms, reason) {
    clearAFKTimer(room, color);
    room.timeouts[color] = setTimeout(() => {
        const roomNow = rooms.get(room.id);
        if (!roomNow || roomNow.state.phase === 'GAMEOVER') return;
        console.log(`[AFK] ${color} inativo (${reason}). WO decretado.`);
        const oppColor = color === 'white' ? 'black' : 'white';
        roomNow.state.phase = 'GAMEOVER';
        roomNow.state.wo    = true;
        roomNow.state.afk   = color;
        persistMatchResult(roomNow, oppColor, true);
        broadcast(roomNow);
        setTimeout(() => rooms.delete(room.id), 60_000);
    }, ms);
}

function clearAFKTimer(room, color) {
    if (room.timeouts?.[color]) {
        clearTimeout(room.timeouts[color]);
        room.timeouts[color] = null;
    }
}
```

Inserir chamadas:
- Em `draft_buy` / `draft_reset` → `clearAFKTimer(room, playerColor)`; chamar `startAFKTimer` quando fase começa
- Em `position_place` / `position_return` → `clearAFKTimer`
- Em `action_plan` → `clearAFKTimer`
- Em `draft_ready` / `position_ready` / `action_ready` → `clearAFKTimer`

### 4. Ban check no `queue_join`
```javascript
if (rec && rec.ban_until) {
    const banDate = new Date(rec.ban_until);
    if (banDate > new Date()) {
        const remainMs = banDate - Date.now();
        socket.emit('banned', { until: rec.ban_until, remainMs });
        return;
    } else {
        // Ban expirou, limpar
        db.prepare('UPDATE players SET ban_until=NULL WHERE id=?').run(decoded.id);
    }
}
```

### 5. Endpoints GET /leaderboard e GET /player/:id
```javascript
app.get('/leaderboard', (req, res) => {
    const { getRank } = require('./mmr');
    const rows = db.prepare(
        'SELECT id, username, mmr, wins, losses, draws, wo_count FROM players ORDER BY mmr DESC LIMIT 50'
    ).all();
    res.json(rows.map((p, i) => ({ rank: i + 1, ...p, ...getRank(p.mmr) })));
});

app.get('/player/:id', (req, res) => {
    const { getRank } = require('./mmr');
    const p = db.prepare(
        'SELECT id, username, mmr, wins, losses, draws, wo_count, wo_against, ban_until FROM players WHERE id=?'
    ).get(req.params.id);
    if (!p) return res.status(404).json({ error: 'Não encontrado' });
    const banned = p.ban_until && new Date(p.ban_until) > new Date();
    res.json({ ...p, ...getRank(p.mmr), banned, banUntil: p.ban_until });
});
```

### 6. Chamar `persistMatchResult` nos pontos de GAMEOVER
Em `finishDuel()` (~linha 276): `persistMatchResult(room, !wk ? 'black' : 'white', false);`
Em `disconnect` (~linha 529): `persistMatchResult(room, oppColor, true);`

## Checklist Final
```
✅ mmr.js: calculate + getRank (6 tiers) + getBanDuration
✅ persistMatchResult chamado nos 2 pontos de GAMEOVER
✅ WO registra result como 'wo_white' ou 'wo_black'
✅ applyBan aplica ban_until progressivo
✅ AFK timer 45s para ACTION, 120s para DRAFT/POSITION
✅ Ban check no queue_join emite evento 'banned'
✅ GET /leaderboard (top 50)
✅ GET /player/:id
✅ Evento mmr_update emitido com { delta, newMMR, rank, isWO }
```

## Prompt para esta Sessão
```
Contexto: microChess, server.js existente (~580L após Sessão 2).
Sessões 1-2 completas: SQLite com players/matches/replays, auth JWT.
O jogo tem 2 pontos de GAMEOVER:
  1. finishDuel() — quando um King é eliminado
  2. handler disconnect — WO por desconexão

Tarefa: Implementar MMR, sistema de WO/Ban, e AFK timeout.

Crie server/mmr.js:
- calculate(winnerMMR, loserMMR) → { winnerDelta, loserDelta } (K=32)
- getRank(mmr) → { name, icon, threshold } para 6 tiers (Peão/Bispo/Cavaleiro/Torre/Rainha/Rei)
- getBanDuration(woCount) → minutos (3WO=30min, 5WO=2h, 7WO=24h)

Adicione ao server.js:
1. require('./mmr') e require('./db/database')
2. Constante K_WO_BONUS = 8
3. Funções: persistMatchResult(room, winnerColor, isWO)
            applyBan(playerId, newWoCount)
            startAFKTimer(room, color, ms, reason)
            clearAFKTimer(room, color)
4. Em room creation: adicionar campo timeouts: {}
5. Chamar persistMatchResult nos 2 pontos de GAMEOVER
6. Chamar startAFKTimer ao início de cada fase (DRAFT, POSITION, ACTION)
7. Chamar clearAFKTimer quando jogador submete ação de cada fase
8. Ban check no queue_join: emitir 'banned' se ban_until > agora
9. GET /leaderboard e GET /player/:id

Restrições:
- NÃO quebrar nenhum handler existente — apenas inserir código
- AFK timer deve ser cancelado ao receber o evento de ready
- NÃO tocar em index.html
- Mostrar exatamente as linhas modificadas
```

---

# SESSÃO 4: REPLAY RECORDING + ANTI-CHEAT

## Objetivo
Gravar cada turno da partida para reprodução futura. Adicionar anti-cheat básico.

## Risco: 🟡 Médio — lê server.js (~660L), adiciona ~60 linhas

## Arquivos
```
server/replay.js    ← NOVO
server/server.js    ← +1 require + gravação de turno + endpoint
```

## O que fazer

### 1. `server/replay.js`
```javascript
'use strict';

function createReplayBuffer() {
    return { turns: [], startTime: Date.now() };
}

function recordTurn(buffer, turnData) {
    buffer.turns.push({ turn: buffer.turns.length + 1, ...turnData });
}

function buildTurnSnapshot(state) {
    return {
        phase:     state.phase,
        planning:  state.planning,         // { white: {pieceId, tx, ty}, black: ... }
        armyAfter: state.army.map(p => ({  // posição de todas as peças após resolução
            id: p.id, type: p.type, color: p.color, x: p.x, y: p.y, bonus: p.bonus, buffed: p.buffed
        })),
    };
}

function buildDuelSnapshot(duel, result) {
    return {
        type:     duel.type,
        wPieceId: duel.wPiece?.id,
        bPieceId: duel.bPiece?.id,
        rolls:    { white: duel.rolls.white, black: duel.rolls.black },
        bonuses:  { white: duel.wPiece?.bonus, black: duel.bPiece?.bonus },
        result,
    };
}

module.exports = { createReplayBuffer, recordTurn, buildTurnSnapshot, buildDuelSnapshot };
```

### 2. Integrar gravação no server.js

**Em `resolveAction`:** após definir `state.planning` e `state.army`, chamar:
```javascript
// Após o final de resolveAction, antes de retornar
if (room._replay) {
    const { buildTurnSnapshot, recordTurn } = require('./replay');
    recordTurn(room._replay, {
        type: 'action',
        ...buildTurnSnapshot(state),
    });
}
```

**Em `finishDuel`:** ao resolver um duel, registrar o resultado:
```javascript
const duelResult = totW > totB ? 'white_wins' : totB > totW ? 'black_wins' : 'tie';
if (room._replay) {
    const { buildDuelSnapshot, recordTurn } = require('./replay');
    recordTurn(room._replay, {
        type: 'duel',
        ...buildDuelSnapshot(d, duelResult),
    });
}
```

**Ao criar a sala** (após `rooms.set(...)`):
```javascript
const { createReplayBuffer } = require('./replay');
room._replay = createReplayBuffer();
```

**Em `persistMatchResult`:** salvar replay no banco:
```javascript
if (room._replay && room._matchId) {
    const replayId = crypto.randomUUID();
    db.prepare('INSERT INTO replays (id, match_id, turns_json) VALUES (?, ?, ?)')
      .run(replayId, room._matchId, JSON.stringify(room._replay.turns));
}
```

### 3. Endpoint `GET /match/:id/replay`
```javascript
app.get('/match/:id/replay', (req, res) => {
    const replay = db.prepare('SELECT * FROM replays WHERE match_id = ?').get(req.params.id);
    if (!replay) return res.status(404).json({ error: 'Replay não encontrado' });
    if (new Date(replay.expires_at) < new Date())
        return res.status(410).json({ error: 'Replay expirado' });
    res.json({ ...replay, turns: JSON.parse(replay.turns_json) });
});
```

### 4. Endpoint `GET /player/:id/matches` (histórico)
```javascript
app.get('/player/:id/matches', (req, res) => {
    const { getRank } = require('./mmr');
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const matches = db.prepare(`
        SELECT m.*, r.id as replay_id
        FROM matches m
        LEFT JOIN replays r ON r.match_id = m.id
        WHERE m.player_white_id = ? OR m.player_black_id = ?
        ORDER BY m.created_at DESC LIMIT ?
    `).all(req.params.id, req.params.id, limit);
    res.json(matches);
});
```

### 5. Anti-cheat básico

Adicionar ao `server.js` um contador de tentativas inválidas por socket:

```javascript
// No início do handler 'connection':
let invalidMoveCount = 0;

// Nos handlers action_plan, draft_buy, position_place:
// Antes do 'return' quando a condição é inválida, adicionar:
invalidMoveCount++;
if (invalidMoveCount > 15) {
    console.warn(`[ANTICHEAT] Socket ${socket.id} — ${invalidMoveCount} tentativas inválidas.`);
    // Logar; não desconectar (pode ser bug de cliente legítimo)
}
```

## Checklist Final
```
✅ replay.js com createReplayBuffer, recordTurn, buildTurnSnapshot, buildDuelSnapshot
✅ room._replay inicializado ao criar sala
✅ Turnos gravados em resolveAction e finishDuel
✅ Replay salvo no banco ao GAMEOVER
✅ GET /match/:id/replay funcional
✅ GET /player/:id/matches funcional (com replay_id)
✅ Anti-cheat: log de tentativas inválidas por socket
```

## Prompt para esta Sessão
```
Contexto: microChess, server.js existente (~660L após Sessão 3).
Sessões 1-3 completas: SQLite, auth, MMR, WO/ban, AFK timers.

Tarefa: Implementar gravação de replays e anti-cheat.

Crie server/replay.js:
- createReplayBuffer() → { turns: [], startTime }
- recordTurn(buffer, data) → push no array
- buildTurnSnapshot(state) → snapshot do army + planning
- buildDuelSnapshot(duel, result) → snapshot do duel com rolls e bonuses

Adicione ao server.js:
1. require('./replay')
2. Em room creation: room._replay = createReplayBuffer()
3. Em resolveAction (após modificar state.army): recordTurn com buildTurnSnapshot
4. Em finishDuel (após calcular totW/totB): recordTurn com buildDuelSnapshot
5. Em persistMatchResult: salvar replay no banco (INSERT INTO replays)
6. GET /match/:id/replay — retorna turns como array
7. GET /player/:id/matches — histórico com replay_id
8. Anti-cheat: contador de tentativas inválidas por socket (log, não kick)

Restrições:
- _replay e _matchId são campos internos da sala (in-memory, não vão ao cliente)
- NÃO tocar em index.html
- Mostrar onde exatamente cada inserção ocorre no server.js
```

---

# SESSÃO 5: FRONTEND — AUTH + BAN

## Objetivo
Adicionar tela de login/registro; overlay de ban com countdown; popular o menu/perfil com dados do backend.

## Risco: 🟠 Médio-alto — toca em `index.html` em 5 pontos específicos

### Estratégia de Mitigação
- Toda lógica em `html/auth-frontend.js` (arquivo novo)
- Ler `index.html` em partes com offset/limit para localizar os 5 pontos
- CSS inline nos novos `<div>` — não alterar `<style>` existente

## Arquivos
```
html/auth-frontend.js   ← NOVO (toda lógica)
html/index.html         ← 5 inserções pontuais
```

## O que criar em `auth-frontend.js`

### Session Manager
- `Session.save(data)`, `Session.get()`, `Session.clear()`, `Session.isValid()`
- Dados: `{ token, id, username, mmr, rank, avatar }`

### AuthUI
- Overlay de login/registro (modo toggle)
- `handleSubmit(mode)` — fetch /auth/register ou /auth/login
- Após autenticação: fechar overlay, popular menu, iniciar badge

### MenuPopulator
- `populate(session)` — preenche IDs no DOM:
  - `#menu-player-name` ← session.username
  - `#menu-rank-badge` ← `${rank.icon} ${rank.name} · ${session.mmr} MMR`
  - `#menu-stat-w` ← wins (via GET /player/:id)
  - `#menu-stat-l` ← losses
  - `#menu-avatar-icon` ← unicode da peça avatar
  - `#nick-input` ← session.username (tela de perfil)
  - `#stat-wins`, `#stat-losses`, `#stat-wo-w`, `#stat-wo-l` ← dados do banco

### BanOverlay
- Escuta evento Socket.io `'banned'`
- Mostra overlay com: "Você está banido. Motivo: X WOs em 24h."
- Countdown em tempo real (horas:minutos:segundos até ban_until)
- Botão FECHAR (volta ao menu mas bloqueia NOVO JOGO)

### MMR Toast
- `showMMRToast(delta, isWO)` — toast discreto após partida

### QueueProfile Injector
- `getQueueProfile(base)` — retorna base + `{ token, mmr, uid: id }`

### listenGameEvents(socket)
- `mmr_update` → Session.save + MenuPopulator.populate + toast
- `banned` → BanOverlay.show

## 5 Pontos de Inserção no index.html

**Ponto 1:** Logo após `<body>` — overlay de auth (HTML+CSS inline)
**Ponto 2:** Após overlay de auth — overlay de ban (HTML+CSS inline)
**Ponto 3:** Onde socket é criado — chamar `listenGameEvents(socket)`
**Ponto 4:** Onde `queue_join` é emitido — substituir por `socket.emit('queue_join', getQueueProfile(base))`
**Ponto 5:** Antes de `</body>` — `<script src="auth-frontend.js">`

## Checklist Final
```
✅ Auth overlay abre ao carregar sem sessão
✅ Auth overlay fecha após login/registro bem-sucedido
✅ Menu populado com nome, rank, W/L após login
✅ Profile screen mostra stats reais do banco
✅ Ban overlay aparece ao receber evento 'banned'
✅ Ban countdown em tempo real
✅ MMR toast aparecer após fim de partida
✅ token injetado no queue_join
✅ index.html alterado em exatamente 5 pontos
```

## Prompt para esta Sessão
```
Contexto: microChess com server.js completo (auth, MMR, ban, replay).
index.html tem ~1.200 linhas. Telas existentes relevantes:
- screen-menu: #menu-player-name, #menu-rank-badge, #menu-stat-w, #menu-stat-l, #menu-avatar-icon
- screen-profile: #nick-input, #stat-wins, #stat-losses, #stat-wo-w, #stat-wo-l
- Socket emite eventos: 'mmr_update' e 'banned'
- Socket queue_join emitido em algum lugar do script

Tarefa: Adicionar auth frontend e ban overlay com impacto mínimo no index.html.

Crie html/auth-frontend.js com:
1. Session (localStorage manager)
2. AuthUI (overlay login/registro toggle, fetch /auth/register e /auth/login)
3. MenuPopulator (preenche #menu-player-name, #menu-rank-badge, #menu-stat-w/l,
   #menu-avatar-icon, #nick-input, #stat-wins/losses/wo-w/wo-l via GET /player/:id)
4. BanOverlay (ouve 'banned', countdown até ban_until, bloqueia NOVO JOGO)
5. showMMRToast(delta, isWO)
6. getQueueProfile(base) → injeta token + mmr + uid
7. listenGameEvents(socket) → ouve 'mmr_update' e 'banned'

Leia index.html em partes (use offset/limit) para encontrar:
- A tag <body> → inserir auth-overlay + ban-overlay
- Onde socket é criado → chamar listenGameEvents(socket)
- Onde queue_join é emitido → usar getQueueProfile
- O </body> → adicionar <script src="auth-frontend.js">

Restrições:
- Toda lógica em auth-frontend.js
- CSS inline nos novos divs (não alterar <style>)
- index.html: máximo 5 alterações
- Paleta: bg #080808, accent #d4a832, danger #e74c3c, fonte Cinzel
```

---

# SESSÃO 6: FRONTEND — LEADERBOARD + REPLAY VIEWER

## Objetivo
Tela de leaderboard (ranking global) e viewer de replay turno a turno.

## Risco: 🟠 Médio-alto — cria 2 arquivos novos, toca index.html em 4 pontos

## Arquivos
```
html/rank-ui.js     ← NOVO (leaderboard)
html/replay-ui.js   ← NOVO (replay viewer)
html/index.html     ← 4 inserções pontuais
```

## O que criar em `rank-ui.js`

### Leaderboard
- `Leaderboard.load()` — GET /leaderboard
- `Leaderboard.render(players)` — tabela com #rank, ícone + nome, MMR, W/L
- `Leaderboard.show()` / `hide()` — overlay
- Top 3 em dourado
- Linha do jogador atual destacada
- `window.showLeaderboard = () => Leaderboard.show()`

### Histórico de Partidas (no profile)
- `MatchHistory.load(playerId)` — GET /player/:id/matches
- `MatchHistory.render(matches)` — lista com resultado, MMR delta, botão REPLAY
- Integrar com `screen-profile` (adicionar seção de histórico)

## O que criar em `replay-ui.js`

### ReplayViewer
- `ReplayViewer.load(matchId)` — GET /match/:id/replay
- `ReplayViewer.open(replayData)` — inicializa viewer
- `ReplayViewer.renderTurn(turnIndex)` — mostra board com peças do turno selecionado
- `ReplayViewer.prev()` / `next()` / `play()` — navegação
- `window.watchReplay = (matchId) => ReplayViewer.load(matchId)`

### Renderização do board no replay
- Criar grid 4x4 (igual ao board existente mas em modo read-only)
- Mapear army após cada turno para posições no grid
- Destacar a peça que se moveu naquele turno

### Tela de Replay
Nova tela `screen-replay` a inserir no HTML:
- Board 4x4 de replay (read-only)
- Painel lateral: turno atual / total, informações do duelo se houver
- Controles: ⏮ ANTERIOR | ▶ AUTO | ⏭ PRÓXIMO
- Botão VOLTAR

## 4 Pontos de Inserção no index.html

**Ponto 1:** Nova tela `screen-replay` (inserir após game-over-screen)
**Ponto 2:** Nova tela `screen-leaderboard` (inserir após screen-replay)
**Ponto 3:** Botão RANKING no `screen-menu` (após btn-como-jogar)
**Ponto 4:** Antes de `</body>` — scripts rank-ui.js e replay-ui.js

## Checklist Final
```
✅ Leaderboard abre ao clicar RANKING no menu
✅ Top 3 destacado em dourado
✅ Linha do jogador atual destacada
✅ Histórico de partidas no screen-profile com botão REPLAY
✅ Replay viewer abre ao clicar REPLAY
✅ Board exibe peças corretamente por turno
✅ Controles ⏮ ▶ ⏭ funcionam
✅ Auto-play avança 1 turno por segundo
✅ Tela volta para histórico ao fechar replay
✅ ACTIVITY_LOG.md atualizado com status final do projeto
```

## Prompt para esta Sessão
```
Contexto: microChess — frontend com auth, ban, MMR badge prontos.
Servidor tem:
  - GET /leaderboard → [ { rank, username, mmr, wins, losses, icon, name } ]
  - GET /player/:id/matches → [ { id, result, mmr_change_white, mmr_change_black, replay_id, created_at } ]
  - GET /match/:id/replay → { turns: [ {type, planning, armyAfter, ...} ] }
Turnos do replay têm: type='action' com armyAfter (array de peças com x,y,type,color,bonus),
ou type='duel' com rolls e bonuses.

Tarefa: Implementar leaderboard e replay viewer.

Crie html/rank-ui.js:
- Leaderboard overlay com load/render/show/hide
- MatchHistory em screen-profile: load(playerId) + render com botão watchReplay
- window.showLeaderboard e window.watchReplay

Crie html/replay-ui.js:
- ReplayViewer com load(matchId), open(data), renderTurn(index)
- Board 4x4 de replay (leia como o board existente é feito no index.html)
- Controles prev/next/play (1 turno por segundo no auto)
- Tela screen-replay completa

Adicione ao index.html (4 pontos):
1. Tela screen-replay (após game-over-screen, estilo screen.active)
2. Tela screen-leaderboard
3. Botão RANKING no screen-menu (após btn-como-jogar)
4. Scripts rank-ui.js e replay-ui.js antes de </body>

Após implementar: teste completo (registro → partida → ver replay → leaderboard).
Atualizar ACTIVITY_LOG.md com status final.
```

---

---

# SESSÃO 7: REORGANIZAÇÃO DE NAVEGAÇÃO + HEADER + LOGOUT

## Objetivo
Reestruturar o menu principal conforme novo fluxo de UI: remover botões do lugar errado, reorganizar header do menu com dados do jogador e botão de logout, adicionar COMO JOGAR e CRÉDITOS ao Configurações, popup de confirmação de logout.

## Risco: 🟡 Médio — index.html em ~6 pontos, auth-frontend.js

## Arquivos
```
html/index.html         ← ~6 pontos de edição
html/auth-frontend.js   ← atualizar doLogout + MenuPopulator
```

## O que fazer

### 1. Menu Principal — reorganizar botões
- **Remover**: btn-como-jogar e btn-creditos do screen-menu
- **Manter**: btn-novo-jogo
- **Alterar**: btn-ranking agora chama `showScreen('ranking')` (não mais `showLeaderboard()`)
- **Manter**: btn-configuracoes

### 2. Menu Principal — novo header com dados do jogador
Substituir o header atual por layout de duas colunas:
```
[ avatar | apelido | rank | W/L ]      [ SAIR ↯ ]
```
IDs necessários no header:
- `#menu-avatar-icon` — ícone unicode da peça
- `#menu-player-name` — apelido
- `#menu-rank-badge` — "♟ Peão Aprendiz · 0 PdL"
- `#menu-stat-w` / `#menu-stat-l` — vitórias / derrotas
- `#btn-logout` — botão pequeno SAIR, chama `window.confirmLogout()`

### 3. Configurações — adicionar COMO JOGAR e CRÉDITOS
Inserir 2 botões com o mesmo estilo dos botões existentes, após o botão PERFIL:
- COMO JOGAR → `showScreen('how-to-play')`
- CRÉDITOS → `showScreen('credits')`

### 4. Popup de confirmação de logout
Inserir div modal oculto (display:none) no index.html:
```html
<div id="logout-confirm" style="...overlay fixo, fundo escuro...">
  <div style="...card central...">
    <p>Tem certeza que quer trocar de conta?</p>
    <button onclick="window.doLogout()">SIM</button>
    <button onclick="window.hideLogoutConfirm()">NÃO</button>
  </div>
</div>
```
`window.confirmLogout()` — exibe o popup
`window.hideLogoutConfirm()` — fecha o popup

### 5. auth-frontend.js — atualizar doLogout e helpers
```javascript
window.confirmLogout = function () {
    const m = document.getElementById('logout-confirm');
    if (m) m.style.display = 'flex';
};
window.hideLogoutConfirm = function () {
    const m = document.getElementById('logout-confirm');
    if (m) m.style.display = 'none';
};
// window.doLogout — já existe, apenas garantir que fecha o popup antes de redirecionar
```

MenuPopulator.populate: garantir que preenche `#menu-stat-w` e `#menu-stat-l` no header além dos existentes.

### 6. Perfil — manter SAIR DA CONTA
O botão "SAIR DA CONTA" já existe no screen-profile (adicionado no polimento). Deve chamar `window.confirmLogout()` em vez de `window.doLogout()` diretamente.

## Checklist
```
[ ] btn-como-jogar e btn-creditos removidos do screen-menu
[ ] btn-ranking chama showScreen('ranking')
[ ] Header do menu: avatar + apelido + rank + W/L + btn logout
[ ] Configurações: botões COMO JOGAR e CRÉDITOS adicionados
[ ] Popup de logout com Sim/Não funcional
[ ] SAIR DA CONTA no perfil abre popup (não logout direto)
[ ] auth-frontend.js: confirmLogout / hideLogoutConfirm / doLogout atualizado
[ ] node --check server.js → OK (sem alteração no backend)
```

---

# SESSÃO 8: TELA RANKING EXPLICATIVA + LEADERBOARD

## Objetivo
Criar a tela `screen-ranking` que explica visualmente o sistema de 14 ranks e PdL, com botão para o Leaderboard global. Corrigir o back do Leaderboard para voltar a essa tela.

## Risco: 🟡 Médio — index.html em 2 pontos, rank-ui.js

## Arquivos
```
html/index.html     ← 2 pontos: nova tela + back do leaderboard
html/rank-ui.js     ← adicionar renderRankScreen()
```

## O que fazer

### 1. Nova tela `screen-ranking` no index.html
Inserir após screen-leaderboard. Conteúdo:
- Título "RANKING"
- Botão "LEADERBOARD GLOBAL" em destaque no topo → chama `showLeaderboard()` (que carrega e vai para screen-leaderboard)
- Botão VOLTAR → `showScreen('menu')`
- Grid visual dos 14 ranks agrupados por tier:
  ```
  ♟ Peão:   Aprendiz | Esforçado | Elite
  ♝ Bispo:  Aprendiz | Esforçado | Elite
  ♞ Cavalo: Aprendiz | Esforçado | Elite
  ♜ Torre:  Aprendiz | Esforçado | Elite
  ♛ Rainha
  ♚ Rei
  ```
- Breve explicação do sistema PdL (0–100 por divisão, promoção ao atingir 100, escudo ao subir de grupo)

### 2. Leaderboard — corrigir back button
Alterar o back button do screen-leaderboard para `showScreen('ranking')` em vez de qualquer tela que esteja hoje.

### 3. rank-ui.js — renderizar screen-ranking
```javascript
function renderRankScreen() {
    // popula o grid de ranks dinamicamente a partir do array RANKS (importado via window ou hardcoded)
    // cada grupo tem 3 cards (ou 1 para Rainha/Rei)
    // card: ícone grande + nome da divisão + barra de PdL decorativa
}
// Chamar renderRankScreen() quando showScreen('ranking') for ativado
// Ou renderizar diretamente no HTML estático (preferível para economizar tokens)
```

### 4. window.showLeaderboard
Já existe. Garantir que continua funcionando (load + showScreen('leaderboard')).

## Checklist
```
[ ] screen-ranking criada com grid de 14 ranks
[ ] Botão LEADERBOARD GLOBAL no topo da tela ranking
[ ] Back em screen-ranking → menu
[ ] Back em screen-leaderboard → screen-ranking
[ ] RANKING no menu → showScreen('ranking')
[ ] Texto explicativo do sistema PdL na tela ranking
[ ] rank-ui.js atualizado se necessário
```

---

# SESSÃO 9: HISTÓRICO DE PARTIDAS (TELA PRÓPRIA) + REPLAY MELHORADO

## Objetivo
Mover o histórico de partidas do perfil para uma tela dedicada. Melhorar o Replay com header de resumo da partida.

## Risco: 🟠 Médio-alto — index.html 3 pontos, rank-ui.js, replay-ui.js

## Arquivos
```
html/index.html     ← 3 pontos: nova tela + botão no perfil + back no replay
html/rank-ui.js     ← MatchHistory agora controla screen-match-history
html/replay-ui.js   ← adicionar header de resumo, corrigir back
```

## O que fazer

### 1. Nova tela `screen-match-history` no index.html
```html
<div id="screen-match-history" class="screen">
  <div>
    <button onclick="showScreen('profile')">VOLTAR</button>
    <span>HISTÓRICO</span>
  </div>
  <div id="match-history-list" style="overflow-y:auto;width:100%;max-width:480px;">
    <!-- populado por MatchHistory.render() -->
  </div>
</div>
```

### 2. Perfil — substituir histórico embutido por botão
- Remover `<div id="profile-match-history">` do screen-profile
- Adicionar botão "HISTÓRICO DE PARTIDAS" → `MatchHistory.open(session.id)`

### 3. rank-ui.js — MatchHistory passa a controlar screen-match-history
```javascript
MatchHistory = {
    open(playerId) {
        showScreen('match-history');
        this.load(playerId);
    },
    async load(playerId) { /* fetch /player/:id/matches */ },
    render(matches, playerId) {
        // popula #match-history-list
        // cada item: resultado, PdL delta, data, botão REPLAY
        // ao clicar REPLAY: ReplayViewer.loadWithContext(matchId, matchMeta)
    },
};
```
Remover o hook de showScreen('profile') que carregava o histórico automaticamente.

### 4. replay-ui.js — header de resumo + back correto
Adicionar ao `open(data, meta)`:
```javascript
// meta = { opponentName, opponentElo, date, lpDelta, result }
// Preencher header no screen-replay:
// "vs [opponentName] · [opponentElo.name] · [date] · [+/-lpDelta] PdL"
```
Back button do replay → `showScreen('match-history')` em vez de `showScreen('menu')`.

`window.watchReplay` atualizar para aceitar meta opcionalmente:
```javascript
window.watchReplay = (matchId, meta) => ReplayViewer.loadWithContext(matchId, meta);
```

### 5. Passar contexto da partida ao abrir replay
No MatchHistory.render, ao criar o botão REPLAY:
```javascript
const meta = {
    opponentName: isWhite ? m.player_black_name : m.player_white_name, // endpoint precisa retornar nomes
    date: new Date(m.created_at).toLocaleDateString('pt-BR'),
    lpDelta: isWhite ? m.mmr_change_white : m.mmr_change_black,
    result: label,
};
// <button onclick="window.watchReplay('${m.id}', ${JSON.stringify(meta)})">
```

**Nota:** GET /player/:id/matches precisa retornar os usernames do oponente. Verificar se o JOIN atual retorna isso; se não, adicionar JOIN com players.

## Checklist
```
[ ] screen-match-history criada com layout scrollável
[ ] Botão HISTÓRICO no perfil → screen-match-history
[ ] Histórico embutido removido do perfil
[ ] MatchHistory.render popula #match-history-list
[ ] Back do histórico → perfil
[ ] Replay header mostra: oponente + data + PdL delta
[ ] Back do replay → screen-match-history
[ ] GET /player/:id/matches retorna nomes dos jogadores (verificar/corrigir)
```

---

# SESSÃO 10: RECONEXÃO COM TOLERÂNCIA DE 60 SEGUNDOS

## Objetivo
Quando um jogador desconecta durante uma partida, dar 60 segundos para reconexão antes de decretar WO. O oponente vê countdown. O jogador que perdeu conexão, ao reconectar, retoma a partida de onde parou.

## Risco: 🟠 Médio-alto — server.js (lógica de reconexão), index.html, auth-frontend.js

## Arquivos
```
server/server.js        ← timer de reconexão + rejoin_game handler
html/index.html         ← overlay de "aguardando reconexão"
html/auth-frontend.js   ← lógica de rejoin ao reconectar
```

## O que fazer

### 1. server.js — Map de reconexões pendentes
```javascript
const pendingReconnects = new Map(); // uid → { roomId, color, timer }
```

### 2. server.js — Modificar handler disconnect
Ao detectar disconnect durante partida ativa, em vez de WO imediato:
```javascript
// Se o jogador tem uid (autenticado), aguardar 60s
const RECONNECT_MS = 60_000;
const reconnectTimer = setTimeout(() => {
    pendingReconnects.delete(playerUid);
    const roomNow = rooms.get(roomId);
    if (!roomNow || roomNow.state.phase === 'GAMEOVER') return;
    // WO normal
    persistMatchResult(roomNow, oppColor, true);
    roomNow.state.phase = 'GAMEOVER';
    roomNow.state.wo = true;
    broadcast(roomNow);
    setTimeout(() => rooms.delete(roomId), 60_000);
}, RECONNECT_MS);

pendingReconnects.set(playerUid, { roomId, color: playerColor, timer: reconnectTimer });

// Notificar oponente
io.to(oppSocket.socketId).emit('opponent_reconnecting', { remainMs: RECONNECT_MS });
```

### 3. server.js — Novo evento `rejoin_game`
```javascript
socket.on('rejoin_game', ({ token }) => {
    const decoded = verifyToken(token);
    if (!decoded) return;
    const pending = pendingReconnects.get(decoded.id);
    if (!pending) return socket.emit('rejoin_failed', { reason: 'Partida não encontrada ou expirada' });

    clearTimeout(pending.timer);
    pendingReconnects.delete(decoded.id);

    const room = rooms.get(pending.roomId);
    if (!room || room.state.phase === 'GAMEOVER') return socket.emit('rejoin_failed', { reason: 'Partida encerrada' });

    // Atualizar socketId do jogador na sala
    room.players[pending.color].socketId = socket.id;
    socket.join(room.id);

    // Notificar oponente que jogador voltou
    const oppColor = pending.color === 'white' ? 'black' : 'white';
    io.to(room.players[oppColor].socketId).emit('opponent_reconnected');

    // Enviar estado atual ao jogador reconectado
    socket.emit('game_state', room.state);
    socket.emit('rejoin_success', { roomId: room.id, color: pending.color });
});
```

### 4. index.html — overlay de reconexão
```html
<div id="reconnect-overlay" style="display:none; ...overlay fixo...">
  <div>
    <p id="reconnect-msg">Aguardando reconexão do oponente...</p>
    <p id="reconnect-countdown">60</p>
  </div>
</div>
```

### 5. auth-frontend.js — lógica de rejoin
```javascript
// Ao inicializar socket: verificar se há partida pendente de reconexão
function tryRejoinIfPending(socket) {
    const session = Session.get();
    if (!session?.token) return;
    socket.emit('rejoin_game', { token: session.token });
}

// Ouvir eventos de reconexão
socket.on('opponent_reconnecting', ({ remainMs }) => { /* mostrar countdown */ });
socket.on('opponent_reconnected', () => { /* esconder overlay */ });
socket.on('rejoin_success', ({ roomId, color }) => { /* restaurar tela de jogo */ });
socket.on('rejoin_failed', () => { /* apenas ignorar, seguir fluxo normal */ });
```

### Tolerância de 60s (padrão de mercado)
- Jogos browser competitive: 30–90s
- Escolhemos 60s como equilíbrio entre UX e penalidade justa

## Checklist
```
[ ] pendingReconnects Map no server.js
[ ] disconnect: inicia 60s timer em vez de WO imediato (para jogadores autenticados)
[ ] opponent_reconnecting emitido com remainMs
[ ] rejoin_game handler: cancela timer, restaura socketId, emite game_state
[ ] opponent_reconnected emitido ao oponente
[ ] Overlay de countdown no frontend
[ ] tryRejoinIfPending chamado no init do socket
[ ] node --check server.js → OK
[ ] Convidados (sem token) ainda recebem WO imediato no disconnect
```

---

## Riscos Consolidados

| Sessão | Arquivo mais pesado lido | Custo estimado | Risco |
|--------|------------------------|----------------|-------|
| 1 | Nenhum | Mínimo | 🟢 |
| 2 | server.js 544L | Baixo | 🟡 |
| 3 | server.js ~580L | Baixo-médio | 🟡 |
| 4 | server.js ~660L | Médio | 🟡 |
| 5 | index.html (parcial) | Médio-alto | 🟠 |
| 6 | index.html (parcial) | Médio-alto | 🟠 |
| 7 | index.html (parcial) | Médio | 🟡 |
| 8 | index.html (parcial) | Médio | 🟡 |
| 9 | index.html + rank-ui.js + replay-ui.js | Médio-alto | 🟠 |
| 10 | server.js ~800L | Médio-alto | 🟠 |

---

## Protocolo de Retomada

```bash
# Se tokens acabarem:
git add . && git commit -m "WIP Sessão X — [arquivo que estava editando]"

# Próxima janela — colar no Claude Code:
"Retomando Sessão X. Ler CLAUDE.md e ACTIVITY_LOG.md para contexto.
Último arquivo criado/editado: [X]. Checklist pendente: [Y, Z]."
```

---

*Ver CLAUDE.md para contexto completo do projeto.*
*Ver ACTIVITY_LOG.md para status atual de cada sessão.*
*Última atualização: 2026-04-17 (Sessão 0)*
