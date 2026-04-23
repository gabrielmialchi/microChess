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
| 11 | server.js + auth.js + package.json + rank-ui.js | Alto | 🔴 |
| 12 | server.js + database.js + rank-ui.js | Médio | 🟡 |
| 13 | server.js | Baixo | 🟢 |

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

# SESSÃO 11: SEGURANÇA CRÍTICA

## Objetivo
Corrigir as vulnerabilidades de maior impacto: XSS persistente, ausência de rate limiting, secrets fracos em prod, race condition no duel, integridade transacional do banco e bypass de cor no game_join.

## Risco: 🔴 Alto — edições em server.js, auth.js, rank-ui.js

## Arquivos
```
server/server.js        ← game_join fix + duel_resolve fix + persistMatchResult transação + username validation
server/auth.js          ← dev secret enforcement
server/package.json     ← +express-rate-limit
html/rank-ui.js         ← escaping HTML + watchReplay data-attrs fix
```

## Vulnerabilidades Endereçadas

| # | Vuln | Severidade | Fix |
|---|------|-----------|-----|
| 1 | Sem rate limit em /auth/login e /auth/register | CRÍTICO | express-rate-limit 5 req/min |
| 2 | Username sem validação de conteúdo (XSS stored) | CRÍTICO | regex allowlist no register |
| 3 | innerHTML com username/opponentName sem escape | CRÍTICO | helper escapeHTML() em rank-ui.js |
| 4 | watchReplay injeta JSON em atributo onclick | CRÍTICO | substituir por data-match-id + addEventListener |
| 5 | JWT_SECRET / HMAC_SECRET com defaults de dev | ALTO | warn/throw em NODE_ENV=production |
| 6 | game_join aceita qualquer cor sem verificar | ALTO | validar socket.id === room.players[color].socketId |
| 7 | persistMatchResult sem transação DB | ALTO | db.transaction() |
| 8 | duel_resolve sem verificar d.resolveTime | ALTO | guard if (!d.resolveTime) return |

## Checklist

```
[ ] 1. npm install express-rate-limit em server/package.json
[ ] 2. Importar e aplicar limiter em /auth/register e /auth/login (5 req/min por IP)
[ ] 3. Adicionar validação de username no register: /^[a-zA-Z0-9_\-\.]{3,16}$/ com mensagem clara
[ ] 4. Adicionar alerta de startup em auth.js: se NODE_ENV==='production' e secret é o padrão, logar WARN crítico
[ ] 5. Em server.js, adicionar alerta de startup para HMAC_SECRET e AES_KEY também
[ ] 6. Corrigir game_join: verificar room.players[color]?.socketId === socket.id antes de aceitar
[ ] 7. Envolver persistMatchResult em db.transaction()(function() { ... })
[ ] 8. Em duel_resolve handler: adicionar guard const d = s?.duel; if (!d?.resolveTime) return;
[ ] 9. Adicionar escapeHTML helper em rank-ui.js (escapa <>&"')
[ ] 10. Aplicar escapeHTML em todos os ${p.username}, ${opponentName} do render do leaderboard e match history
[ ] 11. Substituir inline onclick com JSON em watchReplay por data-match-id + data-meta attrs + addEventListener após render
```

## Detalhes Técnicos

### 1. Rate limiting (server.js — inserir antes das rotas auth)
```javascript
const rateLimit = require('express-rate-limit');
const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas tentativas. Aguarde 1 minuto.' },
});
app.use('/auth', authLimiter);
```

### 2. Username validation (server.js — register endpoint)
```javascript
const uname = String(username).trim().slice(0, 16);
if (!/^[a-zA-Z0-9_\-\.]{3,16}$/.test(uname))
    return res.status(400).json({ error: 'Username deve ter 3-16 caracteres: letras, números, _ - .' });
```

### 3. Startup secret check (auth.js)
```javascript
if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'microchess-secret-dev-key') {
    console.error('[SECURITY] JWT_SECRET é o valor padrão de desenvolvimento. Defina JWT_SECRET no ambiente!');
}
```
Mesma verificação para HMAC_SECRET e AES_KEY em server.js.

### 4. game_join fix (server.js)
```javascript
socket.on('game_join', ({ roomId, color }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    if (room.players[color]?.socketId !== socket.id) return;  // ← ADD
    playerRoom  = roomId;
    playerColor = color;
    ...
});
```

### 5. persistMatchResult transação
```javascript
const _persist = db.transaction((room, winner, isWO) => {
    // todo o corpo atual de persistMatchResult aqui dentro
});
function persistMatchResult(room, winner, isWO) {
    _persist(room, winner, isWO);
    // emissões de socket FORA da transação (não-bloqueante)
}
```
Nota: Socket.io emits ficam fora da transação (callbacks são síncronos no better-sqlite3 mas emits não devem estar dentro de transação).

### 6. duel_resolve guard (server.js)
```javascript
socket.on('duel_resolve', () => {
    const room = getRoom();
    if (!room || room.resolving) return;
    const d = room.state?.duel;
    if (!d?.resolveTime) return;   // ← ADD: só resolve quando ambos rolaram
    room.resolving = true;
    finishDuel(room);
});
```

### 7. escapeHTML + render fix (rank-ui.js)
```javascript
function escapeHTML(str) {
    return String(str ?? '').replace(/[&<>"']/g, c =>
        ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
```
Aplicar em todas as interpolações de username, opponentName no innerHTML.

### 8. watchReplay — substituir onclick por data-attrs
```javascript
// Em render(), no botão de replay:
const replayBtn = m.replay_id
    ? `<button class="_replay-btn" data-match-id="${m.id}"
        data-meta="${escapeHTML(JSON.stringify({opponentName, date, lpDelta, result: label}))}"
        style="...">▶ REPLAY</button>`
    : '';
// Após container.innerHTML = ...:
container.querySelectorAll('._replay-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const meta = JSON.parse(btn.dataset.meta);
        window.watchReplay(btn.dataset.matchId, meta);
    });
});
```

---

# SESSÃO 12: INTEGRIDADE DE DADOS

## Objetivo
Corrigir inconsistências de dados (LP delta errado no histórico), melhorar segurança média (timing oracle, CORS, avatar) e estabilidade (JSON.parse sem try/catch).

## Risco: 🟡 Médio — migração DB + edições em server.js e rank-ui.js

## Arquivos
```
server/server.js        ← queue_join nickname, JSON.parse fix, CORS env var, avatar validation
server/db/database.js   ← migração: lp_change_white/black na tabela matches
```

## Vulnerabilidades Endereçadas

| # | Vuln | Severidade | Fix |
|---|------|-----------|-----|
| 9 | LP delta exibido no histórico é MMR delta (valor errado) | MÉDIO | colunas lp_change_white/black na tabela matches |
| 10 | Auth player pode enviar nickname falso em queue_join | MÉDIO | substituir por username do DB para auth players |
| 11 | JSON.parse sem try/catch no endpoint /match/:id/replay | MÉDIO | try/catch → 500 gracioso |
| 12 | Timing oracle: login revela se email existe por tempo de resposta | MÉDIO | dummy bcrypt.compare quando player não encontrado |
| 13 | Avatar não validado em queue_join | BAIXO | allowlist ['K','Q','R','B','N','P'] |
| 14 | CORS origin: '*' | BAIXO | env var ALLOWED_ORIGIN, default '*' em dev |

## Checklist

```
[ ] 1. database.js: migração ALTER TABLE matches ADD COLUMN lp_change_white INT DEFAULT 0 (try/catch para DBs existentes)
[ ] 2. database.js: migração ALTER TABLE matches ADD COLUMN lp_change_black INT DEFAULT 0
[ ] 3. server.js persistMatchResult: receber lpWhite e lpBlack, incluir nas colunas do INSERT de matches
[ ] 4. server.js persistMatchResult: calcular lpWhite/lpBlack com applyLPChange para ambos os lados (vencedor e perdedor)
[ ] 5. server.js /player/:id/matches: incluir lp_change_white e lp_change_black na query/resposta
[ ] 6. rank-ui.js: usar lp_change_white/black em vez de mmr_change_white/black para o lpDelta
[ ] 7. server.js queue_join: se token válido, sobrescrever nickname com username do banco (db.prepare SELECT username)
[ ] 8. server.js /match/:id/replay: envolver JSON.parse em try/catch, retornar 500 com mensagem se falhar
[ ] 9. server.js /auth/login: se player não encontrado, executar bcrypt.compare com hash falso para normalizar tempo
[ ] 10. server.js queue_join: validar avatar contra ['K','Q','R','B','N','P'], default 'K' se inválido
[ ] 11. server.js: substituir cors: { origin: '*' } por cors: { origin: process.env.ALLOWED_ORIGIN || '*' }
```

## Detalhes Técnicos

### 9. LP delta correto em persistMatchResult
A função `applyLPChange` já é chamada para o vencedor e perdedor. Os valores `lpDelta` resultantes devem ser salvos nas novas colunas:
```javascript
// Dentro de persistMatchResult, após applyLPChange para white e black:
db.prepare(`
    INSERT INTO matches (id, player_white_id, player_black_id, result,
        mmr_change_white, mmr_change_black,
        lp_change_white, lp_change_black,  -- ← colunas novas
        total_turns, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
`).run(matchId, whiteId, blackId, result,
    mmrDeltaWhite, mmrDeltaBlack,
    lpDeltaWhite, lpDeltaBlack,            // ← valores novos
    totalTurns);
```

### 10. Nickname from DB (server.js queue_join)
```javascript
if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
        const rec = db.prepare('SELECT mmr, ban_until, username FROM players WHERE id = ?').get(decoded.id);
        if (rec) {
            playerId   = decoded.id;
            playerMMR  = rec.mmr;
            // Override client-supplied nickname with DB username
            nickname   = rec.username;   // ← ADD
            ...
        }
    }
}
```

### 11. JSON.parse try/catch (server.js replay endpoint)
```javascript
app.get('/match/:id/replay', (req, res) => {
    const replay = db.prepare('SELECT * FROM replays WHERE match_id = ?').get(req.params.id);
    if (!replay) return res.status(404).json({ error: 'Replay não encontrado' });
    if (new Date(replay.expires_at) < new Date())
        return res.status(410).json({ error: 'Replay expirado' });
    try {
        res.json({ ...replay, turns: JSON.parse(replay.turns_json) });
    } catch {
        res.status(500).json({ error: 'Replay corrompido' });
    }
});
```

### 12. Timing oracle mitigation (server.js login)
```javascript
const DUMMY_HASH = '$2b$10$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
app.post('/auth/login', async (req, res) => {
    ...
    const player = db.prepare('SELECT ... WHERE email_hash = ?').get(email_hash);
    if (!player) {
        await checkPassword('dummy', DUMMY_HASH); // normaliza tempo de resposta
        return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    ...
});
```

---

# SESSÃO 13: MANUTENÇÃO E LIMPEZA

## Objetivo
Tarefas de manutenção de baixo risco: limpeza automática de replays expirados, remoção de pendingReconnects órfãos e melhoria do endpoint /health.

## Risco: 🟢 Baixo — apenas adições em server.js

## Arquivos
```
server/server.js        ← replay cleanup job + pendingReconnects cleanup + /health melhorado
```

## Checklist

```
[ ] 1. server.js: função cleanExpiredReplays() — DELETE FROM replays WHERE expires_at < datetime('now')
[ ] 2. server.js: chamar cleanExpiredReplays() na startup + setInterval(cleanExpiredReplays, 24 * 60 * 60 * 1000)
[ ] 3. server.js: no setTimeout de rooms.delete(roomId), também deletar entradas de pendingReconnects que apontam para aquela sala
[ ] 4. server.js: /health endpoint — adicionar contagem de rooms ativas, fila length e resultado de SELECT 1 FROM players LIMIT 1
```

## Detalhes Técnicos

### 1-2. Replay cleanup
```javascript
function cleanExpiredReplays() {
    const result = db.prepare("DELETE FROM replays WHERE expires_at < datetime('now')").run();
    if (result.changes > 0) console.log(`[CLEANUP] ${result.changes} replays expirados removidos.`);
}
cleanExpiredReplays(); // na startup
setInterval(cleanExpiredReplays, 24 * 60 * 60 * 1000);
```

### 3. pendingReconnects cleanup
Nos dois `setTimeout(() => rooms.delete(roomId), 60_000)` existentes, adicionar:
```javascript
setTimeout(() => {
    rooms.delete(roomId);
    // Limpar qualquer pendingReconnect órfão desta sala
    for (const [uid, entry] of pendingReconnects.entries()) {
        if (entry.roomId === roomId) pendingReconnects.delete(uid);
    }
}, 60_000);
```

### 4. /health melhorado
```javascript
app.get('/health', (_, res) => {
    try {
        db.prepare('SELECT 1 FROM players LIMIT 1').get();
        res.json({ ok: true, rooms: rooms.size, queue: queue.length, db: 'ok' });
    } catch {
        res.status(500).json({ ok: false, db: 'error' });
    }
});
```

---

*Ver CLAUDE.md para contexto completo do projeto.*
*Ver ACTIVITY_LOG.md para status atual de cada sessão.*
*Última atualização: 2026-04-18 (Sessões 14-16 planejadas)*

---

# SESSÃO 14: INTEGRIDADE COMPETITIVA + PERFIL

## Objetivo
Corrigir o vazamento de planejamento (maior bug de integridade do jogo), sincronizar nickname com o servidor, e implementar exclusão de conta (bloqueador da Play Store).

## Risco: 🟠 Médio-alto — edições em server.js e index.html

## Arquivos
```
server/server.js        ← broadcast() por-player + DELETE /auth/account + PATCH /auth/profile
html/index.html         ← saveProfile → PATCH /auth/profile; botão "EXCLUIR CONTA" no perfil
```

## Pontos Endereçados

| # | Ponto | Severidade | Fix |
|---|-------|-----------|-----|
| 1 | Planejamento do oponente visível via WebSocket antes da revelação | CRÍTICO | broadcast() envia view personalizada por cor |
| 2 | Nickname salvo só em localStorage — não sincroniza com DB | ALTO | PATCH /auth/profile + saveProfile faz fetch |
| 3 | Sem exclusão de conta in-app (bloqueador Play Store) | ALTO | DELETE /auth/account + botão no perfil com confirmação |

## Checklist

```
[ ] 1. server.js: refatorar broadcast() — criar stateView(state, color) que mascara planning do oponente
[ ] 2. server.js: stateView retorna state com planning[opponentColor] = null se !state.ready[opponentColor]
[ ] 3. server.js: PATCH /auth/profile (auth required) — atualiza username no DB; validar USERNAME_RE; checar UNIQUE
[ ] 4. server.js: DELETE /auth/account (auth required) — deleta player, matches e replays associados
[ ] 5. index.html: saveProfile — fazer fetch PATCH /auth/profile com token; mostrar erro se username já existe
[ ] 6. index.html: adicionar botão "EXCLUIR CONTA" no screen-profile com popup de confirmação dupla ("EXCLUIR DEFINITIVAMENTE?")
[ ] 7. index.html: handler de confirmação de exclusão — fetch DELETE /auth/account, limpar session, mostrar AuthUI
```

## Detalhes Técnicos

### 1-2. broadcast() por-player (server.js)
```javascript
function stateView(state, color) {
    const opp = color === 'white' ? 'black' : 'white';
    if (state.ready[opp]) return state; // oponente confirmou — mostrar planejamento
    return {
        ...state,
        planning: { ...state.planning, [opp]: null },
    };
}

function broadcast(room) {
    const { white, black } = room.players;
    io.to(white.socketId).emit('game_state', stateView(room.state, 'white'));
    io.to(black.socketId).emit('game_state', stateView(room.state, 'black'));
}
```
Nota: quando `state.ready[opp]` é `true`, o oponente já confirmou — revelar o plano é intencional (fase de resolução).

### 3. PATCH /auth/profile (server.js)
```javascript
app.patch('/auth/profile', async (req, res) => {
    const auth = req.headers.authorization?.split(' ')[1];
    const decoded = auth ? verifyToken(auth) : null;
    if (!decoded) return res.status(401).json({ error: 'Não autenticado' });
    const { username } = req.body || {};
    const uname = String(username || '').trim();
    if (!USERNAME_RE.test(uname))
        return res.status(400).json({ error: 'Username deve ter 3-16 caracteres: letras, números, _ - .' });
    try {
        db.prepare('UPDATE players SET username=? WHERE id=?').run(uname, decoded.id);
        const newToken = signToken({ id: decoded.id, username: uname });
        res.json({ token: newToken, username: uname });
    } catch (e) {
        if (e.message.includes('UNIQUE'))
            return res.status(409).json({ error: 'Username já em uso' });
        res.status(500).json({ error: 'Erro interno' });
    }
});
```

### 4. DELETE /auth/account (server.js)
```javascript
const _deleteAccount = db.transaction((playerId) => {
    db.prepare('DELETE FROM replays WHERE match_id IN (SELECT id FROM matches WHERE player_white_id=? OR player_black_id=?)').run(playerId, playerId);
    db.prepare('DELETE FROM matches WHERE player_white_id=? OR player_black_id=?').run(playerId, playerId);
    db.prepare('DELETE FROM players WHERE id=?').run(playerId);
});

app.delete('/auth/account', (req, res) => {
    const auth = req.headers.authorization?.split(' ')[1];
    const decoded = auth ? verifyToken(auth) : null;
    if (!decoded) return res.status(401).json({ error: 'Não autenticado' });
    try {
        _deleteAccount(decoded.id);
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: 'Erro interno' });
    }
});
```

### 5-7. saveProfile + exclusão (index.html)
Em `saveProfile`: substituir o `localStorage.setItem` por um `fetch PATCH /auth/profile` autenticado com o token da sessão. Ao receber o novo token, atualizar `Session.save()`.

Botão "EXCLUIR CONTA": popup com campo de confirmação manual (digitar "EXCLUIR") ou duplo clique de confirmação. Ao confirmar: `fetch DELETE /auth/account`, `Session.clear()`, `AuthUI.show()`.

---

# SESSÃO 15: PLAY STORE PRÉ-REQUISITOS

## Objetivo
Implementar os pré-requisitos técnicos e legais para submissão na Play Store via TWA: privacy policy, PWA manifest, service worker básico e security headers.

## Risco: 🟡 Médio — arquivos novos + pequenas inserções no server.js e index.html

## Arquivos
```
server/server.js            ← Helmet.js + rota /privacy-policy + rota /.well-known/assetlinks.json
server/package.json         ← +helmet
html/manifest.json          ← NOVO — PWA manifest
html/sw.js                  ← NOVO — Service Worker (cache shell)
html/index.html             ← <link rel="manifest"> + <meta theme-color> + SW registration
```

## Checklist

```
[ ] 1. npm install helmet em server/package.json
[ ] 2. server.js: const helmet = require('helmet'); app.use(helmet({ contentSecurityPolicy: false }))
[ ] 3. server.js: rota GET /privacy-policy — servir HTML estático inline com política de privacidade
[ ] 4. server.js: rota GET /.well-known/assetlinks.json — placeholder [] (preencher após gerar keystore)
[ ] 5. html/manifest.json: criar com name, short_name, start_url, display, theme_color, icons (placeholders)
[ ] 6. html/sw.js: criar service worker mínimo — cache do shell (index.html, CSS, JS) + fallback offline
[ ] 7. html/index.html: adicionar <link rel="manifest"> e <meta name="theme-color"> no <head>
[ ] 8. html/index.html: registrar service worker em <script> no final do body
[ ] 9. server.js: adicionar ALLOWED_ORIGIN ao CORS do Socket.io também para o servidor HTTP
```

## Detalhes Técnicos

### 2. Helmet (server.js)
```javascript
const helmet = require('helmet');
// CSP false: o jogo usa fontes externas (Google Fonts) e Socket.io inline
app.use(helmet({ contentSecurityPolicy: false }));
```
Helmet ativa automaticamente: `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`,
`Strict-Transport-Security` (HSTS), `Referrer-Policy`, `X-DNS-Prefetch-Control`.

### 5. manifest.json
```json
{
  "name": "microChess",
  "short_name": "microChess",
  "description": "Xadrez 4x4 para 2 jogadores online",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#080808",
  "theme_color": "#d4a832",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```
Nota: ícones precisam ser criados manualmente (fora do escopo do Claude Code — asset design).

### 6. Service Worker mínimo (sw.js)
```javascript
const CACHE = 'mc-v1';
const SHELL = ['/', '/auth-frontend.js', '/rank-ui.js', '/replay-ui.js', '/manifest.json'];

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))));
self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
```

### 3. Privacy Policy (server.js)
Texto da política deve cobrir: quais dados são coletados (email hash, username, histórico de partidas), como são usados, período de retenção, direitos do usuário (exclusão via botão in-app), contato. Deve estar em português (público alvo principal) e inglês.

---

# SESSÃO 16: QUALIDADE UX + PASSWORD CHANGE

## Objetivo
Fechar os gaps de qualidade que causariam avaliações negativas: troca de senha, loading states, feedback de desconexão e botão Sair funcional em WebView.

## Risco: 🟡 Médio — edições em server.js e index.html / auth-frontend.js

## Arquivos
```
server/server.js        ← PATCH /auth/password
html/index.html         ← loading states, quit fix, disconnect banner
html/auth-frontend.js   ← disconnect event handler
```

## Checklist

```
[ ] 1. server.js: PATCH /auth/password (auth required) — verifica senha atual, valida nova, salva hash
[ ] 2. index.html: screen-settings — adicionar botão "ALTERAR SENHA" → modal inline (senha atual + nova + confirmar)
[ ] 3. index.html: leaderboard e match-history — adicionar spinner de loading enquanto fetch estiver pendente
[ ] 4. index.html: botão SAIR — substituir window.close() por showScreen('menu') ou bloco de confirmação sem close()
[ ] 5. auth-frontend.js: socket.on('disconnect') → mostrar banner "Sem conexão com o servidor" (div fixo, vermelho)
[ ] 6. auth-frontend.js: socket.on('connect') → remover banner se existir
```

## Detalhes Técnicos

### 1. PATCH /auth/password (server.js)
```javascript
app.patch('/auth/password', async (req, res) => {
    const auth = req.headers.authorization?.split(' ')[1];
    const decoded = auth ? verifyToken(auth) : null;
    if (!decoded) return res.status(401).json({ error: 'Não autenticado' });
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword)
        return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
    if (newPassword.length < 6)
        return res.status(400).json({ error: 'Senha deve ter ao menos 6 caracteres' });
    const player = db.prepare('SELECT password_hash FROM players WHERE id=?').get(decoded.id);
    if (!player) return res.status(404).json({ error: 'Usuário não encontrado' });
    const ok = await checkPassword(currentPassword, player.password_hash);
    if (!ok) return res.status(401).json({ error: 'Senha atual incorreta' });
    const newHash = await hashPassword(newPassword);
    db.prepare('UPDATE players SET password_hash=? WHERE id=?').run(newHash, decoded.id);
    res.json({ ok: true });
});
```

### 4. Botão Sair fix (index.html)
```javascript
window.quitGame = function() {
    // Em WebView, window.close() não funciona. Fallback: voltar ao menu ou mostrar tela de agradecimento.
    if (typeof Android !== 'undefined' && Android.closeApp) {
        Android.closeApp(); // hook para TWA nativo opcional
    } else {
        showScreen('menu');
    }
};
```

### 5-6. Disconnect banner (auth-frontend.js)
```javascript
function showDisconnectBanner() {
    if (document.getElementById('_dc-banner')) return;
    const b = document.createElement('div');
    b.id = '_dc-banner';
    b.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#e74c3c;color:#fff;text-align:center;padding:8px;font-family:Cinzel,serif;font-size:12px;z-index:99999;letter-spacing:2px;';
    b.textContent = 'SEM CONEXÃO COM O SERVIDOR';
    document.body.prepend(b);
}
// No listenGameEvents:
socket.on('disconnect', showDisconnectBanner);
socket.on('connect',    () => document.getElementById('_dc-banner')?.remove());
```

---

# SESSÃO 18: HARDENING FINAL + P-07

## Objetivo
Fechar as 6 vulnerabilidades da Revisão 3 e adicionar o badge "PARTIDA NÃO RANQUEADA" para partidas Logado×Anônimo.

## Risco: 🟡 Médio — schema migration + edições em server.js, auth.js, database.js, index.html

## Arquivos
```
server/db/schema.sql     ← adicionar pw_version
server/db/database.js   ← migration ALTER TABLE + pw_version
server/auth.js          ← signToken inclui pv; verifyToken sem mudança (campo extra ignorado)
server/server.js        ← V-01..V-06 + startup warning ALLOWED_ORIGIN
html/index.html         ← P-07: badge "partida não ranqueada" na tela de matchmaking e game-over
```

## Checklist

```
[ ] 1. schema.sql: ADD COLUMN pw_version INTEGER DEFAULT 0
[ ] 2. database.js: migration ALTER TABLE players ADD COLUMN pw_version INTEGER DEFAULT 0
[ ] 3. auth.js: signToken inclui pv no payload
[ ] 4. server.js login: retornar pv no token; PATCH /auth/password: incrementar pw_version + novo token com pv atualizado
[ ] 5. server.js: verifyToken check — se decoded.pv !== player.pw_version → 401
[ ] 6. server.js: startup warning ALLOWED_ORIGIN (V-02)
[ ] 7. server.js: try/catch no ASSET_LINKS (V-03)
[ ] 8. server.js: authLimiter em PATCH /auth/password (V-04)
[ ] 9. server.js: /player/:id — remover ban_until/wo_count/elo_shield sem auth (V-05)
[ ] 10. server.js: INSERT players — gravar null na coluna email legada (V-06)
[ ] 11. index.html: badge "PARTIDA NÃO RANQUEADA" quando oponente for anônimo (P-07)
```

## Detalhes Técnicos

### V-01: pw_version no JWT

**schema.sql / migration:**
```sql
ALTER TABLE players ADD COLUMN pw_version INTEGER DEFAULT 0
```

**auth.js — signToken:**
```js
function signToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}
// payload passado sempre incluirá { id, username, pv }
```

**server.js — login:** incluir `pv` no token:
```js
const token = signToken({ id: player.id, username: player.username, pv: player.pw_version ?? 0 });
```

**server.js — PATCH /auth/password:** incrementar e retornar novo token:
```js
db.prepare('UPDATE players SET password_hash=?, pw_version=pw_version+1 WHERE id=?').run(newHash, decoded.id);
const updated = db.prepare('SELECT username, pw_version FROM players WHERE id=?').get(decoded.id);
const newToken = signToken({ id: decoded.id, username: updated.username, pv: updated.pw_version });
res.json({ ok: true, token: newToken });
```

**server.js — helper verifyAndCheck (onde auth é necessária):**
Criar função `requireAuth(req)` que verifica token E pw_version:
```js
function requireAuth(authHeader) {
    const token = (authHeader || '').split(' ')[1];
    const decoded = token ? verifyToken(token) : null;
    if (!decoded) return null;
    const player = db.prepare('SELECT pw_version FROM players WHERE id=?').get(decoded.id);
    if (!player || (decoded.pv ?? 0) !== (player.pw_version ?? 0)) return null;
    return decoded;
}
```
Usar `requireAuth` em: `PATCH /auth/profile`, `PATCH /auth/password`, `DELETE /auth/account`.
**Não usar** em: queue_join, private_room_create (já validam via verifyToken, e pw_version check seria overhead desnecessário no WebSocket — o token expira em 30d de qualquer forma).

### V-02: Startup warning ALLOWED_ORIGIN
```js
if (process.env.NODE_ENV === 'production') {
    if (!process.env.ALLOWED_ORIGIN) console.error('[SECURITY] AVISO: ALLOWED_ORIGIN não definido — Socket.IO aceitando qualquer origem.');
}
```

### V-03: try/catch ASSET_LINKS
```js
let links = [];
try { links = process.env.ASSET_LINKS ? JSON.parse(process.env.ASSET_LINKS) : []; }
catch { console.error('[CONFIG] ASSET_LINKS inválido — usando []'); }
res.json(links);
```

### V-05: /player/:id — campos sensíveis apenas com auth
```js
app.get('/player/:id', (req, res) => {
    const auth    = (req.headers.authorization || '').split(' ')[1];
    const decoded = auth ? verifyToken(auth) : null;
    const isSelf  = decoded?.id === req.params.id;
    const p = db.prepare('SELECT id, username, mmr, wins, losses, draws, wo_against, ban_until, wo_count, elo_rank, elo_lp, elo_shield FROM players WHERE id=?').get(req.params.id);
    if (!p) return res.status(404).json({ error: 'Não encontrado' });
    const elo = getEloDisplay(p.elo_rank ?? 0, p.elo_lp ?? 0);
    const pub = { id: p.id, username: p.username, mmr: p.mmr, wins: p.wins, losses: p.losses, draws: p.draws, wo_against: p.wo_against, ...getRank(p.mmr), elo };
    if (isSelf) {
        pub.wo_count   = p.wo_count;
        pub.elo_shield = p.elo_shield;
        pub.banned     = !!(p.ban_until && new Date(p.ban_until) > new Date());
        pub.banUntil   = p.ban_until;
    }
    res.json(pub);
});
```

### P-07: Badge "PARTIDA NÃO RANQUEADA"

Quando `oppProfile.uid` começa com `g_` (guest uid gerado no cliente) ou `match_found` vier sem `isRanked: true`, mostrar badge na tela de matchmaking e no game-over.

Server-side: incluir `isRanked` no `match_found` payload:
```js
// em queue_join e private_room_join, após criar o room:
const isRanked = !!(p1.uid && !p1.uid.startsWith('g_') && p2.uid && !p2.uid.startsWith('g_'));
io.to(p1.socketId).emit('match_found', { ..., isRanked });
io.to(p2.socketId).emit('match_found', { ..., isRanked });
```

Client-side: salvar `isRanked` em var + mostrar badge discreto na tela de matchmaking e game-over se `!isRanked`.

---

# SESSÃO P-A: LOCALIZAÇÃO COMPLETA

## Objetivo
Varredura de todos os textos hardcoded em PT fora do sistema `t()` adicionados nas sessões 7-17. Criar chaves EN para todos.

## Risco: 🟠 Médio-alto — muitas edições pontuais em index.html

## Checklist

```
[ ] 1. Varredura: listar todos os textos hardcoded fora de t() em telas criadas nas sessões 7-17
[ ] 2. Adicionar chaves ao objeto LANG.pt e LANG.en para cada texto encontrado
[ ] 3. Substituir textos hardcoded por chamadas t('chave')
[ ] 4. Testar troca de idioma: PT→EN em todas as telas novas
```

## Telas a Varrer
- screen-ranking (ranks em PT)
- screen-leaderboard (cabeçalhos)
- screen-match-history
- screen-replay
- screen-profile (botões novos: ALTERAR SENHA, EXCLUIR CONTA)
- screen-private-room (todos os textos)
- ban-overlay, reconnect-overlay
- change-password-modal, delete-account-confirm
- disconnect banner
- Toasts (MMR, promoção, rebaixamento)

---

# SESSÃO P-B: LINKS EXTERNOS

## Objetivo
Substituir todos os links placeholder (href="#") por URLs reais (P-03).

## Risco: 🟢 Baixo — edições pontuais em index.html

## Checklist

```
[ ] 1. P-03: substituir href="#" por URLs reais (privacy policy, portfólio, feedback)
[ ] 2. P-03: verificar todos os <a> e botões com links externos
```

---

# SESSÃO P-C: LOCALIZAÇÃO — 7 IDIOMAS RESTANTES

## Objetivo
Preencher as ~60 chaves de tradução adicionadas na Sessão P-A nos 7 idiomas que ainda não as têm: ES, DE, IT, RU, JA, KO, ZH.

## Risco: 🟡 Médio — trabalho repetitivo, risco de digitação incorreta em idiomas não-latinos

## Contexto
Na Sessão P-A, as novas chaves (telas de ranking, leaderboard, histórico, replay, sala privada, overlays) foram adicionadas apenas a `T.pt` e `T.en`. Usuários nos outros 7 idiomas veem fallback EN — funcional, mas não localizado.

## Checklist

```
[ ] 1. Exportar lista completa das chaves-alvo (apenas as novas da P-A — ~60 chaves)
[ ] 2. Traduzir para ES (espanhol)
[ ] 3. Traduzir para DE (alemão)
[ ] 4. Traduzir para IT (italiano)
[ ] 5. Traduzir para RU (russo)
[ ] 6. Traduzir para JA (japonês)
[ ] 7. Traduzir para KO (coreano)
[ ] 8. Traduzir para ZH (chinês simplificado)
[ ] 9. Inserir em cada T.xx object no index.html
[ ] 10. Teste rápido: trocar para cada idioma e verificar telas ranking + private-room
```

## Chaves a Traduzir (referência — valores PT → copiar de T.pt da P-A)
stats_label, change_password, sign_out, delete_account, match_history,
history_title, replay_title, ranking_title, leaderboard_title, leaderboard_global,
turn_label, replay_prev, replay_auto, replay_next,
how_it_works, ranking_desc, divisions, single_div, max_rank,
div_apprentice, div_hardworking, div_elite,
rank_pawn, rank_bishop, rank_knight, rank_rook, rank_queen, rank_king,
private_room_title, create_room, room_code_label, copy, copied,
room_expires, room_expired, room_code_invalid, or_divider, join_with_code,
room_code_placeholder, join, back_to_menu,
ban_title, ban_reason, ban_time_remaining, close,
logout_confirm_title, logout_confirm_desc, yes, no,
delete_confirm_title, delete_confirm_desc, delete_btn, cancel_action,
current_password_ph, new_password_ph, confirm_password_ph,
reconnect_waiting, reconnect_desc, reconnect_wo_auto,
no_connection, promotion_toast, demotion_toast,
no_players_yet, no_matches_yet, match_result_win, match_result_loss, match_result_wo,
unranked_match

---

# SESSÃO P-D: REPLAY — TABULEIRO + TURNO 0 + LABEL DE TURNO

## Objetivo
Corrigir distorção visual do tabuleiro no Replay e melhorar a navegação de turnos.

## Risco: 🟡 Médio — edições em rank-ui.js (ReplayViewer) e possivelmente em index.html

## Problemas a Resolver

### P-F-01: Tabuleiro com proporção fixa
O tabuleiro do Replay usa `display:grid;grid-template-columns:repeat(4,1fr)` sem altura fixa nas células — quando uma casa está vazia, ela colapsa; quando tem peça, expande. Resultado: casas de tamanhos diferentes.

**Solução**: usar o mesmo padrão do tabuleiro do jogo principal — células com tamanho fixo via `aspect-ratio:1` ou altura explícita. Peça posicionada com `position:absolute` ou `font-size` controlado dentro da célula de tamanho fixo.

### P-F-02: Turno 0 — Posicionamento inicial
Atualmente o Replay começa no Turno 1 (primeiro turno de ação). Adicionar Turno 0 que exibe o estado inicial do tabuleiro após o posicionamento (antes de qualquer movimento).

**Fonte dos dados**: `turns_json` já inclui `armyAfter` em cada turno — o estado "antes do turno 1" pode ser inferido a partir do `armyAfter` de um turno artificial, ou o servidor pode gravar o estado inicial separadamente.

Verificar se `replays` já grava o estado inicial (`initial_state` ou similar). Se não, usar o `armyAfter` do turno 0 sintético gerado a partir dos dados de posicionamento existentes.

### P-F-03: Label de turno formatado
Substituir o simples "Turno X / Y" por:

```
[0]: Posicionamento
[1]: Turno 1
[2]: Turno 2
...
```

Usar a chave `turn_label` existente para "Turno" e adicionar chave `turn_positioning` para "Posicionamento".

## Checklist

```
[ ] 1. P-F-01: Corrigir CSS do #replay-board — células com tamanho fixo, peças sem distorcer a grade
[ ] 2. P-F-01: Verificar que o tabuleiro do Replay usa o mesmo estilo visual do tabuleiro do jogo
[ ] 3. P-F-02: Verificar se server.js grava estado inicial no replay (initial_army ou turno 0)
[ ] 4. P-F-02: Se não gravado: adicionar gravação do estado de posicionamento ao criar o replay
[ ] 5. P-F-02: ReplayViewer.load(): inserir turno 0 sintético no início do array de turnos
[ ] 6. P-F-03: Atualizar label de turno: [0] = t('turn_positioning'), [N] = '[N]: ' + t('turn_label') + ' N'
[ ] 7. P-F-03: Adicionar chave turn_positioning a T.pt e T.en (e demais idiomas na P-C)
[ ] 8. Testar navegação: Turno 0 → 1 → 2 → ... sem quebrar lógica de prev/next/auto
```

> ⚠️ Esta sessão foi absorvida pela Sessão Design-J. Não implementar separado.

---

# ═══════════════════════════════════════════════════════
# REDESIGN VISUAL — SESSÕES DESIGN-A a DESIGN-L
# Handoff: design/HANDOFF.md  |  Arquivos: design/01–09 .html
# ═══════════════════════════════════════════════════════

---

# SESSÃO DESIGN-A: TOKENS CSS + COMPONENTES BASE

## Objetivo
Instalar a fundação visual do novo design: tokens CSS (light + dark), fontes Inter + JetBrains Mono, biblioteca flag-icons e classes de componente base.

## Ler antes de iniciar
`design/01 - Design System.html`

## Risco: 🟡 Médio — edições no `<head>` e novo bloco `<style>` em index.html

## Checklist

```
[ ] 1. Adicionar import de fontes Inter + JetBrains Mono no <head> (Google Fonts)
[ ] 2. Adicionar import de flag-icons CDN no <head>
[ ] 3. Copiar bloco :root (tokens light) para o TOPO do <style> existente — sem remover nada
[ ] 4. Copiar bloco [data-theme="dark"] logo abaixo do :root
[ ] 5. Criar novo bloco <style> no final do <head> com as classes base:
       .mc-btn, .mc-input, .mc-card, .mc-tag, .mc-avatar,
       .mc-board, .mc-die, .mc-tabbar, .mc-topbar
[ ] 6. Validar sintaxe (node --check não se aplica a HTML — testar no browser)
[ ] 7. Confirmar que dark mode toggle funciona: document.documentElement.setAttribute('data-theme','dark')
```

---

# SESSÃO DESIGN-B: MENU PRINCIPAL + HEADER + TAB BAR

## Objetivo
Redesenhar `#screen-menu` com novo header de jogador, hero do logo, 4 botões de nav e instalar a `#tab-bar` fixa no fundo.

## Ler antes de iniciar
`design/03 - Menu + Matchmaking.html` (cenas 01 e 02)

## Risco: 🟡 Médio — redesenho do #screen-menu e adição do #tab-bar global

## Checklist

```
[ ] 1. Redesenhar #screen-menu: header (avatar + nome + rank + W/L), hero (logo), 4 botões de nav
[ ] 2. Modo convidado: CTA "Criar conta" em laranja no lugar dos stats
[ ] 3. Adicionar #tab-bar fixo no fundo (4 abas: Início · Jogar · Ranking · Perfil)
[ ] 4. Não alterar showScreen() — apenas HTML/CSS
[ ] 5. Verificar que o jogo ainda funciona sem conta (guest retrocompat)
```

---

# SESSÃO DESIGN-F: AUTH OVERLAY (TELA CHEIA)

## Objetivo
Redesenhar `#auth-overlay` como tela cheia (não modal sobre escuro) com nova estrutura visual e tratamento de erros inline.

## Ler antes de iniciar
`design/04 - Login + Modais.html` (cenas 01–03)

## Risco: 🟡 Médio — redesenho do auth-overlay, mantendo todos os IDs existentes

## Checklist

```
[ ] 1. Redesenhar #auth-overlay como tela cheia: logo · eyebrow · título · campos · CTA · link · "Jogar sem conta"
[ ] 2. Erro: border vermelho no campo + hint abaixo (não alert/toast)
[ ] 3. Manter IDs: #login-email, #login-password, #reg-username, #reg-email, #reg-password, #auth-error
[ ] 4. Testar fluxo completo: login, registro, jogar sem conta
```

---

# SESSÃO DESIGN-C: MATCHMAKING + SALA PRIVADA

## Objetivo
Redesenhar `#screen-matchmaking` com radar animado e `#screen-private-room` com novo layout de código.

## Ler antes de iniciar
`design/03 - Menu + Matchmaking.html` (cenas 03–07)

## Risco: 🟡 Médio — redesenho de duas telas, IDs existentes mantidos

## Checklist

```
[ ] 1. Redesenhar #screen-matchmaking: radar animado, rank dos jogadores (nome, não número), countdown grande
[ ] 2. Redesenhar #screen-private-room: código em destaque, dot pulsando, divider "ou", input centralizado
[ ] 3. Manter IDs: #mm-lobby, #mm-found, #mm-countdown, #pr-code-value, demais existentes
[ ] 4. Testar criação e entrada em sala privada
```

---

# SESSÃO DESIGN-D: TELAS DE PARTIDA (DRAFT · POSIÇÃO · REVELAÇÃO · AÇÃO)

## Objetivo
Redesenhar `#game-area` com novo topbar de fase, remover barra de etapas, redesenhar draft e aplicar aura nas peças.

## Ler antes de iniciar
`design/02 - Telas de Partida.html` (cenas 04–10)
`design/_decisions/pieces-aura.md`

## Risco: 🔴 Alto — toca o core visual do jogo

## Checklist

```
[ ] 1. Redesenhar #game-area: novo topbar (oponente · phase pill · timer)
[ ] 2. Remover barra de etapas (DRAFT · POSIÇÃO · AÇÃO) — topbar já informa a fase
[ ] 3. Redesenhar inventário do Draft: label "Toque para devolver" + botão "Limpar ✕"
[ ] 4. Adicionar chaves de localização: draft_return_hint, draft_clear (PT e EN)
[ ] 5. Aplicar aura nas peças: text-shadow duplo (brancas → laranja rgba(245,98,0,0.8), pretas → azul rgba(69,56,255,0.8))
[ ] 6. Células de zona própria no POSITION: color-mix(in oklab, var(--mc-cell-light) 86%, var(--mc-accent) 14%)
[ ] 7. Testar fluxo completo de partida: draft → position → reveal → action
```

---

# SESSÃO DESIGN-E: DUELO + GAME OVER + ESTADO DE EMPATE

## Objetivo
Redesenhar `#duel-modal` com cards horizontais, `#game-over-screen` com peça grande + delta PdL, e adicionar estado de Empate.

## Ler antes de iniciar
`design/02 - Telas de Partida.html` (cenas 11–15)

## Risco: 🟠 Médio-alto — duel modal e game over são os momentos mais críticos do jogo

## Decisões fixadas (não questionar):
- Empate ocorre SOMENTE em Morte Súbita com resultado 0×0
- Game over de empate: dois Reis com suas auras + "= 0 PdL"
- Morte Súbita: phase pill pulsando vermelho, vai direto para duelo

## Checklist

```
[ ] 1. Redesenhar #duel-modal: dois cards lado a lado (horizontal), botão livre abaixo
[ ] 2. Redesenhar #game-over-screen: ícone de peça grande, resultado, delta PdL, botões
[ ] 3. Adicionar estado "Empate" no game over: dois Reis com aura, "= 0 PdL"
[ ] 4. Morte Súbita: phase pill pulsando vermelho. Adicionar lógica de ir direto ao duelo (sem aguardar jogada)
[ ] 5. Adicionar chaves de localização: draw, pdl_draw (PT e EN — outros idiomas depois)
[ ] 6. Testar: vitória, derrota, empate (Morte Súbita 0×0), WO
```

> Nota: O cálculo de PdL para empate (P-12) será implementado depois em server/mmr.js.

---

# SESSÃO DESIGN-G: MODAIS DE SISTEMA

## Objetivo
Redesenhar os overlays de sistema com padrão unificado: backdrop-filter blur + card branco centralizado.

## Ler antes de iniciar
`design/04 - Login + Modais.html` (cenas 04–08)

## Risco: 🟢 Baixo — visual only, IDs e onclick mantidos

## Checklist

```
[ ] 1. Redesenhar #ban-overlay
[ ] 2. Redesenhar #logout-confirm
[ ] 3. Redesenhar #delete-account-confirm
[ ] 4. Redesenhar #change-password-modal
[ ] 5. Redesenhar #reconnect-overlay
[ ] 6. Todos usam: backdrop-filter:blur(10px) + card branco centralizado
[ ] 7. Manter todos os IDs e onclick existentes
```

---

# SESSÃO DESIGN-H: PERFIL + EDITAR

## Objetivo
Redesenhar `#screen-profile` com hero, stats grid 2×2, winrate bar e `#avatar-grid` em duas fileiras (brancas/pretas).

## Ler antes de iniciar
`design/05 - Perfil + Personalizar.html`

## Risco: 🟡 Médio — redesenho de tela complexa com estados (logado vs guest)

## Checklist

```
[ ] 1. Redesenhar #screen-profile: hero (avatar + nome + rank + PdL) · stats grid 2×2 · winrate bar · ações de conta
[ ] 2. Adicionar stat "Empates" na grid (span 2 colunas)
[ ] 3. Redesenhar #avatar-grid: duas fileiras — "Brancas" (♔♕♖♗♘♙) + "Pretas" (♚♛♜♝♞♟)
[ ] 4. Botão "Salvar" no topbar direito (não no fundo)
[ ] 5. Convidado: card CTA "Criar conta" no lugar dos stats
[ ] 6. Adicionar chaves: avatar_white, avatar_black (PT e EN)
[ ] 7. ELO visível = apenas nome do rank (nunca o número MMR)
```

---

# SESSÃO DESIGN-I: RANKING + LEADERBOARD

## Objetivo
Redesenhar `#screen-ranking` com escada vertical dos 14 ranks e `#screen-leaderboard` com tabela compacta e podium por cor.

## Ler antes de iniciar
`design/06 - Ranking + Leaderboard.html`

## Risco: 🟡 Médio — redesenho de duas telas, lógica de renderização JS pode mudar

## Checklist

```
[ ] 1. Redesenhar #screen-ranking: escada vertical dos 14 ranks, posição atual destacada (borda laranja + barra PdL)
[ ] 2. Redesenhar #screen-leaderboard: linhas compactas (posição · avatar · nome · rank · W/L)
[ ] 3. Podium via cor do número (ouro/prata/bronze)
[ ] 4. Linha "você" fixada acima da tabbar
[ ] 5. ELO = nome do rank. Número MMR nunca aparece
[ ] 6. PdL: exibido só para o dono — oponentes/ranking veem apenas o rank
```

---

# SESSÃO DESIGN-J: HISTÓRICO + REPLAY

## Objetivo
Redesenhar `#screen-match-history` e `#screen-replay`. Absorve P-D (tabuleiro fixo + turno 0 + label formatado).

## Ler antes de iniciar
`design/07 - Histórico + Replay.html`

## Risco: 🟠 Médio-alto — redesenho + feature de turno 0 toca server.js (gravação de estado inicial)

## Checklist

```
[ ] 1. Redesenhar #screen-match-history: linhas V/D/WO/E coloridas · oponente + rank · duração · delta PdL · botão ▶
[ ] 2. Adicionar estado "E" (empate): badge muted, "= 0 PdL"
[ ] 3. Redesenhar #screen-replay: header fixo (resultado/oponente/turno) · tabuleiro · controles ⏮ AUTO ⏭
[ ] 4. Tabuleiro com células de tamanho fixo (casas vazias não colapsam)
[ ] 5. Turno 0: verificar se server.js grava estado inicial. Se não, adicionar gravação do posicionamento
[ ] 6. ReplayViewer.load(): inserir turno 0 sintético no início do array
[ ] 7. Label de turno: [0] = t('turn_positioning'), [N] = '[N]: Turno N'
[ ] 8. Banner de duelo abaixo do tabuleiro: "♘ Cavalo venceu ♛ Rainha" · "7 (5+2) × 6 (2+4)"
[ ] 9. Adicionar chave turn_positioning (PT e EN)
[ ] 10. Testar navegação: turno 0 → 1 → 2 → ... prev/next/auto sem quebrar
```

---

# SESSÃO DESIGN-K: CONFIGURAÇÕES + CONTEÚDO + LINKS EXTERNOS

## Objetivo
Redesenhar Settings (grid de idiomas com flags), Como Jogar (4 fases + tabela de bônus correta) e Créditos. Integra P-B (links reais).

## Ler antes de iniciar
`design/08 - Configurações + Conteúdo.html`

## Risco: 🟡 Médio — bônus das peças em Como Jogar diferem do texto atual

## Atenção — bônus corretos (confirmar com `design/_decisions/piece-bonus-rules.md`):
Rainha +5 · Torre +4 · Cavalo +3 · Bispo +2 · Peão +1 · Rei +4
Peão promovido (última fileira) +1 adicional → Peão+2

## Checklist

```
[ ] 1. Redesenhar #screen-settings: grid 3×3 de idiomas com flag-icons, toggle dark/light
[ ] 2. Troca de idioma: instantânea, sem botão Salvar
[ ] 3. Redesenhar #screen-how-to-play: 4 fases numeradas + tabela de bônus correta + mencionar empate
[ ] 4. Redesenhar #screen-credits: centrado, limpo
[ ] 5. Substituir todos href="#" por URLs reais (P-B): privacy policy, portfolio, redes sociais, feedback
[ ] 6. Confirmar URLs com o usuário antes de inserir (se ainda não fornecidas)
```

---

# SESSÃO DESIGN-L: ESTADOS DE EXCEÇÃO

## Objetivo
Implementar banners e overlays dos estados de exceção: desconexão, AFK, Morte Súbita, saída da partida, erro de sala privada, sem conexão, reconectando.

## Ler antes de iniciar
`design/09 - Estados de Exceção.html`

## Risco: 🟡 Médio — majoritariamente visual, mas Morte Súbita pode tocar lógica de jogo

## Checklist

```
[ ] 1. Banner de desconexão: tira horizontal abaixo do topbar (não modal), countdown visível
[ ] 2. Banner AFK warning: âmbar, timer pulsando, CTA urgente
[ ] 3. Morte Súbita: phase pill vermelho pulsando + banner informativo "vai direto para duelo"
[ ] 4. Overlay "sair da partida": aviso leve de WO
[ ] 5. Sala privada: erro de código (borda vermelha) + sala expirada (banner âmbar)
[ ] 6. Sem conexão: tela cheia simples com botão retry
[ ] 7. Reconectando: banner sutil no topo, UI desfocada no fundo
[ ] 8. Testar todos os estados manualmente
```

---

# SESSÃO P-12: BALANCEAMENTO MMR — EMPATE

## Objetivo
Implementar cálculo de PdL para resultado de empate em `server/mmr.js`.

## Implementar APÓS Design-E (estado de empate na UI) estar concluída.

## Risco: 🟡 Médio — edição em mmr.js, nenhuma alteração em server.js ou index.html

## Regras decididas
- Empate só ocorre em Morte Súbita com duelo 0×0
- Mínimo +1 PdL para ambos os jogadores
- Cálculo considera diferença de rank (estilo ELO):
  - Jogador mais fraco que empata contra mais forte → PdL proporcional à diferença (pode ser +2, +3, etc.)
  - Jogador mais forte que empata contra mais fraco → apenas o mínimo (+1)
  - Jogadores do mesmo rank → +1 para ambos

## Checklist

```
[ ] 1. Ler a lógica atual de cálculo de PdL em server/mmr.js
[ ] 2. Adicionar case 'draw' (ou equivalente) na função de cálculo
[ ] 3. Implementar fórmula: base +1, acrescido de bônus proporcional à diferença de rank (para o mais fraco)
[ ] 4. Garantir que partidas não-ranqueadas (guest) não alteram PdL mesmo em empate
[ ] 5. Após calcular resultado (vitória/derrota/empate), emitir evento socket `pdl_result` para ambos os jogadores com: `{ delta: number, now: number, rankName: string }` — o cliente usa isso para popular `#go-pdl-delta` e `#go-pdl-now` no game-over (Design-E)
[ ] 6. No cliente (index.html), adicionar listener `socket.on('pdl_result', ...)` que atualiza `#go-pdl-delta` e `#go-pdl-now` se a tela de game-over estiver visível
[ ] 7. Testar: empate entre ranks iguais, empate fraco-vs-forte, empate em partida não-ranqueada
```

# SESSÃO INFRA-A: RAILWAY VOLUME + PERSISTÊNCIA DO BANCO + MONITORAMENTO

## Objetivo
Garantir que o arquivo SQLite sobreviva a restarts e deploys no Railway, e configurar monitoramento de uptime antes do Open Test.

## Prioridade: 🔴 Alta — bloqueador para Open Test (sem isso, todos os dados dos testes são apagados a cada deploy)

## Ler antes de iniciar
`server/db/database.js`
`server/server.js` (linha 1 — início do arquivo, ponto de boot)

## Risco: 🟡 Médio — mudança de path do banco; testar que o arquivo é criado corretamente no volume antes de usar em produção

## Contexto
O Railway usa containers efêmeros: sem um Volume montado, o arquivo `microchess.db` é destruído a cada deploy ou restart por limite de cota. A solução é montar um Volume persistente e apontar o banco para ele via variável de ambiente.

## Checklist

```
[ ] 1. No painel do Railway: criar um Volume, montar em /data no serviço do microChess
[ ] 2. No painel do Railway: adicionar variável de ambiente DB_PATH=/data/microchess.db
[ ] 3. Em server/db/database.js: alterar o path do banco para usar process.env.DB_PATH como fallback:
       const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'microchess.db');
[ ] 4. Em server/server.js: ao iniciar o servidor (após DB conectar), gravar um registro na tabela server_starts:
       - Criar tabela: CREATE TABLE IF NOT EXISTS server_starts (id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER NOT NULL, node_version TEXT)
       - Inserir: INSERT INTO server_starts (ts, node_version) VALUES (Date.now(), process.version)
[ ] 5. Fazer deploy no Railway e verificar: (a) o arquivo /data/microchess.db existe, (b) dados sobrevivem a um restart manual
[ ] 6. Configurar UptimeRobot (uptimerobot.com — gratuito):
       - Criar monitor tipo HTTP(s) apontando para https://<url-railway>/health
       - Intervalo: 5 minutos
       - Ativar alertas por email
       - Exportar relatório de downtime ao final do Open Test para usar no planejamento de expansão
```

---

# SESSÃO PRE-OT-A: IDIOMA EN PADRÃO + PREFERÊNCIA POR USUÁRIO

## Objetivo
Tornar Inglês (EN) o idioma padrão da aplicação, implementar detecção de idioma do sistema, salvar preferência de idioma por usuário no banco, e reordenar o grid de idiomas no Settings para EN primeiro.

## Prioridade: 🔴 Alta

## Ler antes de iniciar
`html/index.html` (linhas 3540-3560 para default de idioma; 2168-2178 para grid de idiomas)
`server/db/schema.sql`
`server/db/database.js`
`server/server.js` (endpoint de profile/update)

## Risco: 🟡 Médio — migration de DB adiciona coluna; testar retrocompatibilidade com registros existentes

## Regras de prioridade de idioma (ordem de precedência)
1. Preferência salva pelo usuário autenticado (banco de dados) — máxima prioridade
2. Preferência salva em localStorage (não autenticado)
3. Idioma do sistema (`navigator.language`) — se houver tradução disponível
4. Inglês (EN) — fallback universal

## Checklist

```
[ ] 1. Alterar default de idioma: `|| 'pt'` → `|| 'en'` em html/index.html (linha ~3547)
[ ] 2. Adicionar coluna `lang VARCHAR(5) DEFAULT 'en'` à tabela `players` via migration em server/db/database.js
[ ] 3. No login/carregamento de perfil: receber `player.lang` do servidor e aplicar como idioma ativo antes de renderizar screen-menu
[ ] 4. No seletor de idioma (selectLanguage): se autenticado, enviar PATCH ao servidor para salvar `lang` na tabela players
[ ] 5. Detecção de idioma do sistema: ler `navigator.language` → mapear para idioma suportado (pt/es/en/de/it/ru/ja/ko/zh) → aplicar se não há preferência salva
[ ] 6. Preferência do usuário (autenticado ou localStorage) tem prioridade sobre detecção do sistema
[ ] 7. Reordenar grid de idiomas em screen-settings: EN primeiro, depois PT, ES, DE, IT, RU, JA, KO, ZH
[ ] 8. Garantir que após login o idioma salvo no servidor sobrescreve o idioma ativo antes do login
```

---

# SESSÃO PRE-OT-B: MODO CASUAL + NOVO FLUXO DE NOVO JOGO

## Objetivo
Criar o modo Casual (partidas sem XP/MMR), nova tela intermediária de seleção de modo entre NOVO JOGO e matchmaking, e garantir que Salas Privadas são sempre Casual.

## Prioridade: 🔴 Alta

## Ler antes de iniciar
`design/03 - Menu + Matchmaking.html` (Telas 03, 04 e 05)
`html/index.html` (screen-menu, screen-matchmaking, screen-private-room, join_queue socket emit)
`server/server.js` (evento join_queue, endMatch, _persistDB)

## Risco: 🔴 Alto — nova tela + bifurcação no matchmaking + lógica condicional no servidor

## Regras de negócio
- CASUAL: sem variação de XP, sem variação de MMR; resultado gravado em `matches` normalmente para analytics
- RANQUEADA: comportamento atual inalterado
- Salas Privadas: sempre Casual, sem exibir tela de seleção de modo
- Nova tela usa o mesmo sistema de temas (dark/light) e i18n existente

## Checklist

```
[ ] 1. Criar `#screen-game-mode` em html/index.html (nova tela após clicar NOVO JOGO):
       - Dois cards: CASUAL e RANQUEADA (referência visual: Telas 03/04/05 do design)
       - Card inativo: borda var(--mc-rule), fundo neutro
       - Card selecionado: borda 2px var(--mc-accent), fundo var(--mc-accent-soft), checkmark no canto superior direito
       - Botão ENCONTRAR PARTIDA: desativado (opacity 0.4, pointer-events:none) até seleção
       - Botão VOLTAR ao topo: padrão ← VOLTAR
[ ] 2. Navegar: screen-menu (NOVO JOGO) → screen-game-mode → screen-matchmaking (com mode passado)
[ ] 3. Passar `match_mode: 'casual'|'ranked'` no emit do evento `join_queue` via Socket.io
[ ] 4. Servidor (server.js): receber e armazenar `match_mode` por jogador na estrutura da fila
[ ] 5. Ao criar a partida (match start): propagar `match_mode` para o estado do jogo em memória
[ ] 6. Ao finalizar partida (endMatch/_persistDB): se `match_mode === 'casual'`, pular cálculo de XP e variação de MMR
[ ] 7. Adicionar coluna `match_mode TEXT DEFAULT 'ranked'` em `matches` (para analytics ANAL-B/C futuros)
[ ] 8. Tela screen-matchmaking: exibir o modo selecionado ("Casual" ou "Ranqueada") como label visível
[ ] 9. Salas Privadas: passar `match_mode: 'casual'` automaticamente, sem exibir screen-game-mode
[ ] 10. Adicionar strings i18n para "Casual", "Ranqueada", "Encontrar Partida", "Modo de Jogo" nos 9 idiomas
```

---

# SESSÃO PRE-OT-C: TERMINOLOGIA PdL→XP + TIMER VISÍVEL DESDE O INÍCIO

## Objetivo
Renomear globalmente "Pontos de Liga (PdL)" para "Pontos de Experiência (XP)" em todos os 9 idiomas, e tornar o timer de ação visível desde o início do turno (atualmente aparece só abaixo de 15s).

## Prioridade: 🟡 Média

## Ler antes de iniciar
`html/index.html` (objeto `strings` completo; elementos com "PdL"; lógica do timer de turno — buscar "timer", "action", "countdown", "15")

## Risco: 🟢 Baixo — mudanças de string e CSS. IMPORTANTE: manter nome interno `elo_lp` no DB e variáveis JS internas intactos.

## Checklist

```
[ ] 1. No objeto `strings` de todos os 9 idiomas: substituir "Pontos de Liga", "PdL", "LP" (contexto de pontos de liga) pela versão localizada de "XP" / "Pontos de Experiência"
[ ] 2. Em html/index.html: substituir todos os textos exibidos "PdL" → "XP" nos elementos HTML (header, screen-profile, game-over, screen-matchmaking, screen-leaderboard)
[ ] 3. Verificar se o backend envia algum campo com texto "PdL" para o cliente — atualizar se necessário
[ ] 4. Localizar o timer de ação no código do jogo (buscar "15", "timer", "action-timer", "countdown" na section game-area e lógica JS de fase ACTION)
[ ] 5. Remover/ajustar a condição que oculta o timer acima de 15s — torná-lo visível desde t=0 do turno
[ ] 6. Garantir que o estilo visual do timer segue o design pattern existente (sem criar novo componente)
```

---

# SESSÃO PRE-OT-D: BUG FIXES — TEMA CLARO, CRIAR CONTA NO HEADER, RANK INCORRETO

## Objetivo
Corrigir 3 bugs visuais/lógicos: (1) tema claro não sobrescreve tema escuro do sistema; (2) botão "Criar Conta" aparece no header após login; (3) tela Perfil carrega com rank "Cavaleiro" padrão em vez do rank real.

## Prioridade: 🔴 Alta — bugs visíveis no Open Test

## Ler antes de iniciar
`html/index.html` (CSS dark/light ~linhas 111-160; fluxo de login; populamento de menu-rank-badge; visibilidade de menu-guest-cta vs menu-logged-stats)
`html/auth-frontend.js`

## Risco: 🟡 Médio — bug de tema pode exigir auditoria de especificidade CSS

## Diagnóstico esperado por bug
- **Bug 8 (tema):** `prefers-color-scheme: dark` em media query provavelmente tem especificidade igual ou maior que `.theme-light` → sobrescreve variáveis CSS mesmo com classe manual aplicada
- **Bug 10 (criar conta):** `menu-guest-cta` não é ocultado no mesmo ciclo do login — estado de UI fica desatualizado até próxima navegação
- **Bug 11 (rank):** `menu-rank-badge` é populado com valor padrão hardcoded antes dos dados do servidor chegarem

## Checklist

```
[ ] 1. [Bug 8] Auditar o bloco CSS de temas: verificar se `@media (prefers-color-scheme: dark)` está sem classe pai (sobrescreve qualquer classe manual)
[ ] 2. [Bug 8] Refatorar: variáveis CSS de dark mode só aplicadas quando `.theme-dark` está no body — remover dependência de media query para variáveis de cor
[ ] 3. [Bug 8] Testar: forçar tema claro enquanto sistema está em dark mode — verificar telas Perfil e Configurações especificamente
[ ] 4. [Bug 10] Rastrear fluxo de login bem-sucedido em auth-frontend.js → identificar onde `menu-guest-cta` é ocultado
[ ] 5. [Bug 10] Garantir que ao receber token de login, header atualiza imediatamente: ocultar `menu-guest-cta`, exibir `menu-logged-stats`
[ ] 6. [Bug 11] Rastrear onde `menu-rank-badge` é populado → garantir que só é preenchido após receber dados reais do servidor (não com valor padrão hardcoded no HTML)
[ ] 7. [Bug 11] Verificar se o mesmo problema ocorre em screen-matchmaking (Cavaleiro incorreto na tela de fila)
```

---

# SESSÃO PRE-OT-E: DESIGN/UI — BOTÃO VOLTAR, CAIXA ALTA, NOVO HEADER

## Objetivo
Padronizar o botão Voltar em todas as telas, corrigir caixa alta no menu, e implementar o novo layout de 2 colunas do header do menu principal com estatísticas expandidas.

## Prioridade: 🟡 Média

## Ler antes de iniciar
`html/index.html` (todas as ocorrências de "VOLTAR" ou variações; header linhas 1911-1932; screen-menu botões)
`design/03 - Menu + Matchmaking.html`

## Risco: 🟡 Médio — botão Voltar afeta múltiplas telas; header é componente compartilhado

## Especificação do novo header (2 colunas independentes)
- **Coluna esquerda:** Avatar (elemento próprio, fora do fluxo) + apelido (bold) + nome do elo com ícone Unicode inline + tier em itálico
- **Coluna direita:** linha 1: `0W | 0L | 0D` · linha 2: saldo de XP (ex: "67 XP")
- As duas colunas devem ser elementos `display:flex` independentes para evitar conflitos de layout

## Mapeamento rank → Unicode
♙ Peão (todos os tiers) · ♘ Cavaleiro · ♗ Bispo · ♖ Torre · ♕ Rainha · ♔ Rei

## Checklist

```
[ ] 1. Auditar todas as telas: listar cada variação de botão Voltar existente (texto, estilo, posição)
[ ] 2. Padronizar para o padrão da tela PERFIL ("← VOLTAR") em todas as telas divergentes
[ ] 3. Corrigir caixa alta: botão CONFIGURAÇÕES no screen-menu → "Configurações" (title case)
[ ] 4. Implementar função JS auxiliar: elo_rank (0-13) → caractere Unicode (♙♘♗♖♕♔)
[ ] 5. Refatorar HTML do header (linhas 1911-1932) para layout de 2 colunas independentes:
       - Coluna esquerda: avatar + stack de textos (apelido, elo+ícone, tier)
       - Coluna direita: W|L|D separados por pipe + XP abaixo
[ ] 6. Atualizar a função que popula o header para preencher os novos elementos (W, L, D separados + XP + tier)
[ ] 7. Verificar que o novo header funciona em dark/light e nos breakpoints mobile
[ ] 8. Garantir que o header de guest (sem login) mantém o comportamento atual
```

---

# SESSÃO PRE-OT-F: AUDITORIA i18n 100% + PRIVACY POLICY COMO LINK EXTERNO

## Objetivo
Garantir cobertura completa de tradução em todos os 9 idiomas e converter a seção de Privacy Policy para um link externo (URL real fornecida via sessão P-B).

## Prioridade: 🟡 Média

## Ler antes de iniciar
`html/index.html` (objeto `strings` completo — todas as chaves de todos os idiomas; telas de Settings e Créditos)

## Risco: 🟡 Médio — auditoria pode revelar gaps significativos de tradução

## Regras
- PT é o idioma de referência — auditar os outros contra PT
- Privacy Policy não entra como texto no jogo — apenas link `<a href>` externo
- Placeholder da URL: `"#"` até P-B fornecer a URL real (P-B passa a incluir a Privacy Policy URL)
- O texto do link deve ser localizado em todos os 9 idiomas

## Checklist

```
[ ] 1. Extrair todas as chaves do objeto `strings['pt']` como referência
[ ] 2. Para cada um dos outros 8 idiomas: identificar chaves ausentes ou com valor vazio
[ ] 3. Adicionar todas as traduções ausentes com qualidade equivalente às já existentes
[ ] 4. Varrer o HTML em busca de strings hardcoded fora do objeto `strings` — mover para i18n
[ ] 5. Verificar telas com maior risco de gap: screen-profile, screen-settings, duel-modal, game-over-screen, mensagens de erro de auth
[ ] 6. Privacy Policy: remover texto inline se existir → inserir link externo `<a href="#" id="link-privacy-policy" target="_blank">` localizado
[ ] 7. Adicionar chave `privacy_policy` ao objeto `strings` em todos os 9 idiomas (texto do link âncora)
[ ] 8. Registrar no checklist da sessão P-B: URL da Privacy Policy deve ser inserida no href de #link-privacy-policy
```

---

# SESSÃO PRE-OT-G: PESQUISA — LEGISLAÇÃO DE PROTEÇÃO DE DADOS INTERNACIONAL

## Objetivo
Identificar obrigações legais de proteção de dados nos países-alvo do Open Test além de Brasil (LGPD) e Europa (GDPR), e documentar o que já está coberto vs. o que precisa de ajuste.

## Prioridade: 🟢 Baixa

## Agente: usar subagente `explorador` para pesquisa externa

## Ler antes de iniciar
`docs/DOSSIE_STAKEHOLDERS.md`

## Risco: 🟢 Nenhum técnico — resultado é documento para decisão do usuário

## Países/leis a pesquisar
- EUA/California: CCPA
- Canadá: PIPEDA
- Japão: APPI
- China: PIPL
- Singapura/Tailândia: PDPA

## Checklist

```
[ ] 1. Subagente explorador: pesquisar requisitos de cada lei para apps mobile/web de jogos online
[ ] 2. Para cada lei: identificar (a) consentimento explícito? (b) right to delete? (c) age verification? (d) data residency?
[ ] 3. Mapear o que o microChess já atende (delete account existe, consentimento no cadastro, etc.)
[ ] 4. Identificar gaps e recomendar ações simples
[ ] 5. Documentar resultado em docs/PRIVACIDADE_GLOBAL.md
[ ] 6. Resumir por jurisdição: "já atende" / "atende parcialmente" / "não atende"
```

---

# SESSÕES ANAL-A a ANAL-D: ANALYTICS — COLETA E EXTRAÇÃO DE DADOS PARA OPEN TEST

## Contexto
Sessões de instrumentação e extração de métricas para compor argumentos de venda após o Open Test.
ANAL-A e ANAL-B devem ser implementadas ANTES do Open Test começar (sem dados coletados, não há o que extrair).
ANAL-C e ANAL-D executam DURANTE ou logo APÓS o Open Test.

---

# SESSÃO ANAL-A: INSTRUMENTAÇÃO CORE DE MÉTRICAS

## Objetivo
Popular colunas já existentes na tabela `matches` que nunca foram preenchidas, e adicionar captura de métricas básicas sem nova tabela.

## Prioridade: 🔴 Alta (deve rodar antes do Open Test)

## Ler antes de iniciar
`server/server.js` (função _persistDB e endMatch; lógica de matchmaking/queue)
`server/db/schema.sql`

## Risco: 🟢 Baixo — sem nova tabela; apenas popular colunas existentes

## Checklist

```
[ ] 1. Popular `matches.duration_ms`: calcular (match_end_timestamp - match_start_timestamp) e salvar em _persistDB
[ ] 2. Popular `matches.total_turns`: contar snapshots em turns_json ao salvar o replay
[ ] 3. Salvar TTM (Time to Match): calcular delta entre timestamp de entrada na fila e match_start → salvar como `matches.ttm_ms` (adicionar coluna se não existir)
[ ] 4. Adicionar timestamp a cada snapshot gravado em turns_json pelo replay.js (campo `ts: Date.now()`)
[ ] 5. Persistir CCU: criar tabela `ccu_snapshots (ts INTEGER, count INTEGER)` e gravar snapshot a cada 5 minutos com o número de sockets conectados
[ ] 6. Log de reconexão: gravar evento em nova tabela `events (id, ts, type, user_id, metadata)` para tipos `reconnect_success` e `reconnect_fail`
```

---

# SESSÃO ANAL-B: TABELA DE EVENTOS — INSTRUMENTAÇÃO DE FLUXO

## Objetivo
Criar o arquivo `server/analytics.js` com a tabela `events` e instrumentar os pontos críticos de fluxo para capturar Draft Completion Rate, Churn por fase, e frequência de sessões.

## Prioridade: 🔴 Alta (deve rodar antes do Open Test)

## Ler antes de iniciar
`server/server.js` (eventos Socket.io de login, draft, disconnect, game phases)
`server/db/database.js`

## Risco: 🟡 Médio — novo arquivo + ~8 pontos de instrumentação no server.js

## Schema da tabela events
```sql
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  type TEXT NOT NULL,
  user_id INTEGER,
  match_id INTEGER,
  metadata TEXT
);
```

## Eventos a instrumentar
- `session_start` / `session_end` — login/logout por usuário autenticado
- `draft_start` / `draft_complete` — início e fim da fase de draft por partida
- `phase_enter` — entrada em cada fase (DRAFT, POSITION, ACTION, GAMEOVER)
- `disconnect_ingame` — desconexão durante partida ativa
- `reconnect_success` / `reconnect_fail` — resultado de tentativa de reconexão

## Checklist

```
[ ] 1. Criar server/analytics.js com: (a) criação da tabela events, (b) função logEvent(type, userId, matchId, metadata)
[ ] 2. Importar analytics.js em server.js
[ ] 3. Instrumentar: login bem-sucedido → logEvent('session_start', userId)
[ ] 4. Instrumentar: logout / disconnect sem partida ativa → logEvent('session_end', userId)
[ ] 5. Instrumentar: início da fase DRAFT → logEvent('draft_start', userId, matchId)
[ ] 6. Instrumentar: fim da fase DRAFT (todos prontos) → logEvent('draft_complete', userId, matchId)
[ ] 7. Instrumentar: entrada em cada fase de jogo → logEvent('phase_enter', userId, matchId, {phase})
[ ] 8. Instrumentar: disconnect durante partida ativa → logEvent('disconnect_ingame', userId, matchId, {phase})
[ ] 9. Instrumentar: resultado de reconexão → logEvent('reconnect_success'|'reconnect_fail', userId, matchId)
```

---

# SESSÃO ANAL-C: EXTRAÇÃO — QUERIES SQL E SCRIPT DE RELATÓRIO

## Objetivo
Criar script de extração que roda queries SQL no microchess.db e gera relatório com as 14 métricas definidas para o argumento de venda.

## Prioridade: 🟡 Média (executar durante ou após Open Test)

## Ler antes de iniciar
`server/db/schema.sql`
`docs/ACTIVITY_LOG.md` (referência às 14 métricas alvo)

## Risco: 🟢 Baixo — somente leitura do banco

## Checklist

```
[ ] 1. Criar script `tools/extract-metrics.js` (Node.js, standalone, não importa server.js)
[ ] 2. Implementar query: D1/D7/D30 (players com last_seen - created_at ≥ 1/7/30 dias)
[ ] 3. Implementar query: Frequência de sessões (events session_start por user_id por dia)
[ ] 4. Implementar query: ASL — média de matches.duration_ms por intervalo de tempo
[ ] 5. Implementar query: TTM — média de matches.ttm_ms
[ ] 6. Implementar query: Draft Completion Rate — events draft_complete / draft_start por match
[ ] 7. Implementar query: Churn por fase — events disconnect_ingame agrupados por fase (metadata)
[ ] 8. Implementar query: Delta de MMR — média de ABS(mmr_change_white - mmr_change_black)
[ ] 9. Implementar query: Win Rate — COUNT por matches.result
[ ] 10. Implementar query: Tempo médio por turno — via timestamps em turns_json (requires JSON parsing)
[ ] 11. Implementar query: CCU pico — MAX(count) em ccu_snapshots por janela de tempo
[ ] 12. Implementar query: Taxa de reconexão — reconnect_success / (reconnect_success + reconnect_fail)
[ ] 13. Implementar query: Funil completo — counts em cada fase do events.type
[ ] 14. Gerar output em formato legível (console.table ou JSON)
```

---

# SESSÃO ANAL-D: INTERPRETAÇÃO — ARGUMENTO DE VENDA

## Objetivo
Rodar o script de extração com dados reais do Open Test, interpretar os números e redigir o argumento de venda estruturado.

## Prioridade: 🟡 Média (executar após Open Test)

## Ler antes de iniciar
Output do script tools/extract-metrics.js
`docs/DOSSIE_STAKEHOLDERS.md`

## Risco: 🟢 Nenhum técnico

## Checklist

```
[ ] 1. Rodar `node tools/extract-metrics.js` contra o banco de produção (ou cópia)
[ ] 2. Identificar as métricas mais favoráveis para o pitch (retenção, engajamento, balanceamento)
[ ] 3. Identificar anomalias ou pontos de atenção que o argumento deve contornar
[ ] 4. Redigir argumento de venda em docs/ARGUMENTO_DE_VENDA.md com: métricas-chave, interpretação, contexto do Open Test
[ ] 5. Calcular LTV projetado baseado em frequência × recorrência × duração média
[ ] 6. Preparar formato para apresentação a stakeholders (tabela ou one-pager)
```
