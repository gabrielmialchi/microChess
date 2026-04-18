# microChess — Sistema de MMR + Autenticação + Leaderboard
## Planejamento Revisado — Baseado no Projeto Atual
### Atualizado em: 2026-04-17

---

## ⚠️ LEIA ANTES DE COMEÇAR

### Sobre Tokens: A Resposta Honesta

**Não existe garantia matemática** de que uma sessão nunca esgota os tokens. O limite de uso do Claude Code a cada 5h depende de:
- Quantidade de código gerado (output)
- Tamanho dos arquivos lidos (context)
- Histórico acumulado da conversa

O que este plano faz para **minimizar o risco**:

1. **Cada sessão tem UMA responsabilidade.** Nunca misturar backend com frontend.
2. **Sessões 1-3 são de baixo risco** — trabalham só com arquivos novos ou com `server.js` (544 linhas).
3. **Sessões 4-5 são de risco médio** — tocam no `index.html` (~1.200 linhas). A estratégia é criar arquivos JS separados e adicionar apenas uma linha `<script>` ao HTML, evitando reescrever o arquivo enorme.
4. **Se uma sessão parecer longa, salve e commite antes de continuar.** O activity log registra o status exato para retomar sem perda.

### Regra de Ouro
```
Antes de cada sessão:
  git checkout -b sessao-X
  git add . && git commit -m "Checkpoint antes da Sessão X"

Se acabar os tokens no meio:
  git add . && git commit -m "WIP Sessão X — ver ACTIVITY_LOG.md"
  → Retome na próxima janela de 5h a partir deste commit
```

---

## Estado Atual do Projeto

### O que já existe e FUNCIONA (não reescrever):

| Arquivo | Conteúdo | Tocar? |
|---------|----------|--------|
| `server/server.js` | Matchmaking, Socket.io, lógica de jogo completa (544 linhas) | Só adicionar — nunca substituir |
| `html/index.html` | Frontend completo, 4x4, animações, fases do jogo (~1.200 linhas) | Adicionar `<script>` tags apenas |
| `server/package.json` | express + socket.io | Adicionar dependências |

### O que FALTA e será construído:

| Feature | Arquivos novos | Sessão |
|---------|---------------|--------|
| Banco de dados SQLite | `server/db/database.js`, `server/db/schema.sql` | 1 |
| Autenticação JWT | `server/auth.js`, endpoints no `server.js` | 2 |
| MMR / ELO | `server/mmr.js`, integração no `server.js` | 3 |
| Frontend auth | `html/auth-frontend.js` | 4 |
| Leaderboard + Rank UI | `html/rank-ui.js` | 5 |

### Por que SQLite e não PostgreSQL?
- Não precisa de servidor separado — arquivo local
- Zero configuração (sem `DATABASE_URL`, sem containers)
- Suficiente para centenas de jogadores simultâneos
- Migrável para PostgreSQL depois se necessário

---

## Índice de Sessões

| Sessão | Tema | Risco de Token | Arquivos Tocados |
|--------|------|----------------|-----------------|
| 1 | Database SQLite | 🟢 BAIXO | Só arquivos novos |
| 2 | Autenticação | 🟡 MÉDIO | `server.js` + arquivos novos |
| 3 | MMR + Persistência | 🟡 MÉDIO | `server.js` + arquivos novos |
| 4 | Frontend Auth | 🟠 MÉDIO-ALTO | `index.html` (só pontos específicos) + novo JS |
| 5 | Leaderboard + Polish | 🟡 MÉDIO | `index.html` (só pontos específicos) + novo JS |

---

# SESSÃO 1: DATABASE SQLITE

## Objetivo
Criar a camada de banco de dados com SQLite — sem tocar em nenhum arquivo existente.

## Risco de Token: 🟢 BAIXO
Motivo: apenas arquivos novos, `server.js` não é lido nem alterado.

## Arquivos Criados
```
server/
  db/
    database.js      ← pool + helpers SQLite
    schema.sql       ← tabelas players + matches
    seed.js          ← script de setup e verificação
```

## O que fazer (ordem exata)

### 1. Instalar dependência
```bash
cd server
npm install better-sqlite3
```

### 2. Criar `server/db/schema.sql`
```sql
CREATE TABLE IF NOT EXISTS players (
    id          TEXT PRIMARY KEY,
    username    TEXT UNIQUE NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    mmr         INTEGER DEFAULT 1500,
    wins        INTEGER DEFAULT 0,
    losses      INTEGER DEFAULT 0,
    draws       INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now')),
    last_seen   TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS matches (
    id          TEXT PRIMARY KEY,
    player_white_id TEXT NOT NULL,
    player_black_id TEXT NOT NULL,
    result      TEXT CHECK(result IN ('white','black','draw')),
    mmr_change_white INTEGER DEFAULT 0,
    mmr_change_black INTEGER DEFAULT 0,
    duration_ms INTEGER,
    created_at  TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (player_white_id) REFERENCES players(id),
    FOREIGN KEY (player_black_id) REFERENCES players(id)
);

CREATE INDEX IF NOT EXISTS idx_players_mmr ON players(mmr DESC);
CREATE INDEX IF NOT EXISTS idx_matches_created ON matches(created_at DESC);
```

### 3. Criar `server/db/database.js`
```javascript
'use strict';
const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

const DB_PATH  = path.join(__dirname, 'microchess.db');
const db       = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

module.exports = db;
```

### 4. Criar `server/db/seed.js` (script de verificação)
```javascript
'use strict';
const db = require('./database');

console.log('Database inicializado:', db.name);

const info  = db.pragma('table_info(players)');
console.log('Tabela players OK:', info.length > 0);

const info2 = db.pragma('table_info(matches)');
console.log('Tabela matches OK:', info2.length > 0);

console.log('✅ Setup concluído!');
process.exit(0);
```

### 5. Adicionar script ao `package.json`
```json
"scripts": {
  "start": "node server.js",
  "dev": "node --watch server.js",
  "db:setup": "node db/seed.js"
}
```

## Validação
```bash
cd server
npm install better-sqlite3
npm run db:setup

# Deve imprimir:
# Database inicializado: .../microchess.db
# Tabela players OK: true
# Tabela matches OK: true
# ✅ Setup concluído!
```

## Checklist Final
```
✅ better-sqlite3 instalado
✅ schema.sql com tabelas players + matches + índices
✅ database.js exportando instância única
✅ seed.js rodando sem erros
✅ Nenhum arquivo existente alterado
```

## Prompt para esta Sessão
```
Contexto: microChess é um jogo 4x4 com servidor Node.js existente em
server/server.js (Socket.io, matchmaking, lógica completa, 544 linhas).
O server.js NÃO deve ser alterado nesta sessão.

Tarefa: Adicionar banco de dados SQLite ao projeto.

Crie:
1. server/db/schema.sql — tabelas players e matches com índices
2. server/db/database.js — inicializa better-sqlite3, roda schema na startup, exporta instância
3. server/db/seed.js — script de verificação (imprime OK e sai)
4. Atualize server/package.json adicionando better-sqlite3 e script db:setup

Restrições:
- NÃO toque em server.js nem em html/index.html
- Use better-sqlite3 (API síncrona, sem callbacks)
- SQLite com WAL mode + foreign_keys ON

Entregue os arquivos completos + como testar.
```

---

# SESSÃO 2: AUTENTICAÇÃO JWT

## Objetivo
Adicionar registro e login com JWT. Integrar ao matchmaking existente para que a fila passe o token do jogador autenticado.

## Risco de Token: 🟡 MÉDIO
Motivo: lê `server.js` (544 linhas) e adiciona endpoints. Não reescreve — apenas insere blocos novos.

## Pré-requisito
Sessão 1 completa. `server/db/microchess.db` existe.

## Arquivos Criados/Alterados
```
server/
  auth.js              ← NOVO: helpers JWT + bcrypt
  server.js            ← ALTERADO: +30 linhas (endpoints register/login)
```

## O que fazer (ordem exata)

### 1. Instalar dependências
```bash
cd server
npm install bcrypt jsonwebtoken
```

### 2. Criar `server/auth.js`
```javascript
'use strict';
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET  = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const SALT_ROUNDS = 10;

function hashPassword(plain)        { return bcrypt.hash(plain, SALT_ROUNDS); }
function checkPassword(plain, hash) { return bcrypt.compare(plain, hash); }
function signToken(payload)         { return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' }); }
function verifyToken(token) {
    try { return jwt.verify(token, JWT_SECRET); }
    catch { return null; }
}

module.exports = { hashPassword, checkPassword, signToken, verifyToken };
```

### 3. Adicionar ao `server.js` — após os `require` existentes
```javascript
const { hashPassword, checkPassword, signToken, verifyToken } = require('./auth');
const db = require('./db/database');
```

### 4. Adicionar endpoints HTTP — após `app.get('/health', ...)`

**POST /auth/register**
```javascript
app.post('/auth/register', express.json(), async (req, res) => {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password)
        return res.status(400).json({ error: 'username, email e password obrigatórios' });
    if (password.length < 6)
        return res.status(400).json({ error: 'Senha mínimo 6 caracteres' });
    try {
        const hash = await hashPassword(password);
        const id   = crypto.randomUUID();
        db.prepare('INSERT INTO players (id, username, email, password_hash) VALUES (?, ?, ?, ?)')
          .run(id, username.slice(0, 16), email.toLowerCase(), hash);
        const token = signToken({ id, username });
        res.json({ token, id, username, mmr: 1500 });
    } catch (e) {
        if (e.message.includes('UNIQUE'))
            return res.status(409).json({ error: 'Username ou email já em uso' });
        res.status(500).json({ error: 'Erro interno' });
    }
});
```

**POST /auth/login**
```javascript
app.post('/auth/login', express.json(), async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password)
        return res.status(400).json({ error: 'email e password obrigatórios' });
    const player = db.prepare('SELECT * FROM players WHERE email = ?').get(email.toLowerCase());
    if (!player) return res.status(401).json({ error: 'Credenciais inválidas' });
    const ok = await checkPassword(password, player.password_hash);
    if (!ok)  return res.status(401).json({ error: 'Credenciais inválidas' });
    db.prepare("UPDATE players SET last_seen = datetime('now') WHERE id = ?").run(player.id);
    const token = signToken({ id: player.id, username: player.username });
    res.json({ token, id: player.id, username: player.username, mmr: player.mmr });
});
```

### 5. Atualizar `queue_join` para aceitar token (retrocompatível)
No handler existente `socket.on('queue_join', (profile) => {`, no início do bloco:
```javascript
// Validar token se fornecido — retrocompatível com clientes sem auth
const { uid, nickname, avatar, token, mmr: clientMMR } = profile || {};
let playerId = uid;
if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
        playerId = decoded.id;
        db.prepare("UPDATE players SET last_seen = datetime('now') WHERE id = ?").run(decoded.id);
    }
}
if (!playerId) return;
```

## Validação
```bash
npm run dev

curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"Testador","email":"test@test.com","password":"senha123"}'
# Deve retornar: { "token": "...", "id": "...", "mmr": 1500 }

curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"senha123"}'
# Deve retornar: { "token": "...", "username": "Testador", "mmr": 1500 }
```

## Checklist Final
```
✅ auth.js com hash + JWT sign/verify
✅ POST /auth/register funcionando
✅ POST /auth/login funcionando
✅ queue_join aceita token opcional (não quebra o jogo atual)
✅ Jogo sem login ainda funciona (retrocompatível)
```

## Prompt para esta Sessão
```
Contexto: microChess com server.js existente (Socket.io + matchmaking, 544 linhas).
Sessão 1 adicionou SQLite: server/db/database.js e server/db/schema.sql.

Tarefa: Adicionar autenticação JWT ao servidor.

Crie:
1. server/auth.js — bcrypt hash + JWT sign/verify
2. Adicione ao server.js (NÃO reescreva, apenas insira):
   - require de auth.js e db/database.js
   - POST /auth/register após o endpoint /health
   - POST /auth/login após o register
   - No queue_join: aceitar campo 'token' opcional e validar com verifyToken

Restrições:
- queue_join deve continuar funcionando sem token (retrocompatível)
- NÃO toque em index.html
- Mostre exatamente quais linhas do server.js são alteradas/inseridas

Entregue os arquivos + comandos curl para testar.
```

---

# SESSÃO 3: MMR + PERSISTÊNCIA DE PARTIDAS

## Objetivo
Calcular MMR (ELO) ao fim de cada partida, salvar no banco, tornar matchmaking MMR-aware, e expor endpoints de perfil/leaderboard.

## Risco de Token: 🟡 MÉDIO
Motivo: lê `server.js` novamente (~574 linhas), adiciona ~60 linhas. Cria `mmr.js` do zero.

## Pré-requisito
Sessões 1 e 2 completas.

## Arquivos Criados/Alterados
```
server/
  mmr.js               ← NOVO: cálculo ELO + mapa de ranks
  server.js            ← ALTERADO: +60 linhas
```

## O que fazer (ordem exata)

### 1. Criar `server/mmr.js`
```javascript
'use strict';

const K = 32;

function expected(mmrA, mmrB) {
    return 1 / (1 + Math.pow(10, (mmrB - mmrA) / 400));
}

function calculate(mmrWinner, mmrLoser) {
    const expW = expected(mmrWinner, mmrLoser);
    const expL = expected(mmrLoser,  mmrWinner);
    return {
        winnerDelta: Math.round(K * (1 - expW)),
        loserDelta:  Math.round(K * (0 - expL)),
    };
}

function getRank(mmr) {
    if (mmr < 1200) return { name: 'Peão',      icon: '♟' };
    if (mmr < 1400) return { name: 'Bispo',     icon: '♝' };
    if (mmr < 1600) return { name: 'Cavaleiro', icon: '♞' };
    if (mmr < 1800) return { name: 'Torre',     icon: '♜' };
    if (mmr < 2000) return { name: 'Rainha',    icon: '♛' };
    return                  { name: 'Rei',       icon: '♚' };
}

module.exports = { calculate, getRank };
```

### 2. Adicionar require no `server.js`
```javascript
const { calculate: calcMMR, getRank } = require('./mmr');
```

### 3. Função `persistMatchResult` — adicionar ao `server.js`
```javascript
function persistMatchResult(room, winnerColor) {
    try {
        const wp = room.players.white;
        const bp = room.players.black;
        if (!wp?.uid || !bp?.uid) return;

        const wRec = db.prepare('SELECT mmr FROM players WHERE id = ?').get(wp.uid);
        const bRec = db.prepare('SELECT mmr FROM players WHERE id = ?').get(bp.uid);
        if (!wRec || !bRec) return;

        let wDelta, bDelta, result;
        if (winnerColor === 'white') {
            ({ winnerDelta: wDelta, loserDelta: bDelta } = calcMMR(wRec.mmr, bRec.mmr));
            result = 'white';
        } else if (winnerColor === 'black') {
            ({ winnerDelta: bDelta, loserDelta: wDelta } = calcMMR(bRec.mmr, wRec.mmr));
            result = 'black';
        } else {
            wDelta = bDelta = 0; result = 'draw';
        }

        db.prepare('UPDATE players SET mmr=mmr+?, wins=wins+?, losses=losses+? WHERE id=?')
          .run(wDelta, result==='white'?1:0, result==='black'?1:0, wp.uid);
        db.prepare('UPDATE players SET mmr=mmr+?, wins=wins+?, losses=losses+? WHERE id=?')
          .run(bDelta, result==='black'?1:0, result==='white'?1:0, bp.uid);

        db.prepare('INSERT INTO matches (id,player_white_id,player_black_id,result,mmr_change_white,mmr_change_black) VALUES (?,?,?,?,?,?)')
          .run(crypto.randomUUID(), wp.uid, bp.uid, result, wDelta, bDelta);

        const wNew = wRec.mmr + wDelta;
        const bNew = bRec.mmr + bDelta;
        io.to(wp.socketId).emit('mmr_update', { delta: wDelta, newMMR: wNew, rank: getRank(wNew) });
        io.to(bp.socketId).emit('mmr_update', { delta: bDelta, newMMR: bNew, rank: getRank(bNew) });
    } catch (e) {
        console.error('[MMR] Erro:', e.message);
    }
}
```

### 4. Chamar `persistMatchResult` no GAMEOVER
No `server.js`, localizar os dois pontos onde `state.phase = 'GAMEOVER'` é setado:

**a) Em `finishDuel` (linha ~276):**
```javascript
state.phase = 'GAMEOVER';
persistMatchResult(room, !wk ? 'black' : 'white');  // ← adicionar esta linha
```

**b) Em `disconnect` (linha ~529):**
```javascript
room.state.phase = 'GAMEOVER';
room.state.wo    = true;
persistMatchResult(room, oppColor);  // ← adicionar esta linha
```

### 5. Endpoints de perfil e leaderboard
```javascript
app.get('/leaderboard', (req, res) => {
    const rows = db.prepare(
        'SELECT id, username, mmr, wins, losses, draws FROM players ORDER BY mmr DESC LIMIT 50'
    ).all();
    res.json(rows.map((p, i) => ({ rank: i + 1, ...p, ...getRank(p.mmr) })));
});

app.get('/player/:id', (req, res) => {
    const p = db.prepare(
        'SELECT id, username, mmr, wins, losses, draws FROM players WHERE id = ?'
    ).get(req.params.id);
    if (!p) return res.status(404).json({ error: 'Não encontrado' });
    res.json({ ...p, ...getRank(p.mmr) });
});
```

### 6. Matchmaking MMR-aware (atualização no `queue_join`)
```javascript
if (queue.length >= 2) {
    // Encontrar o par com menor diferença de MMR
    let bestI = 0, bestJ = 1, minDiff = Infinity;
    for (let i = 0; i < queue.length - 1; i++) {
        for (let j = i + 1; j < queue.length; j++) {
            const diff = Math.abs((queue[i].mmr || 1500) - (queue[j].mmr || 1500));
            if (diff < minDiff) { minDiff = diff; bestI = i; bestJ = j; }
        }
    }
    const [hi, lo] = [Math.max(bestI, bestJ), Math.min(bestI, bestJ)];
    const p1 = queue.splice(hi, 1)[0];
    const p2 = queue.splice(lo, 1)[0];
    // ... criar sala (igual ao código atual)
}
```

## Validação
```bash
# Após uma partida completa com dois usuários autenticados:
curl http://localhost:3000/leaderboard
# Deve retornar os dois jogadores com MMR atualizado

curl http://localhost:3000/player/<id>
# Deve retornar dados + rank
```

## Checklist Final
```
✅ mmr.js com cálculo ELO + 6 faixas de rank
✅ persistMatchResult chamado nos dois pontos de GAMEOVER
✅ Evento mmr_update emitido via Socket.io ao fim de partida
✅ GET /leaderboard retornando top 50
✅ GET /player/:id retornando perfil
✅ Matchmaking ordena por proximidade de MMR
```

## Prompt para esta Sessão
```
Contexto: microChess com server.js existente + SQLite + auth JWT prontos.
O jogo tem fases: DRAFT, POSITION, REVEAL, ACTION, GAMEOVER.
GAMEOVER ocorre em dois pontos no server.js:
  1. Em finishDuel() quando um King é eliminado (~linha 276)
  2. No handler disconnect (~linha 529)

Tarefa: Adicionar MMR/ELO e persistência.

Crie:
1. server/mmr.js — calculate(mmrWinner, mmrLoser) + getRank(mmr) com 6 faixas
2. Adicione ao server.js:
   - require('./mmr')
   - Função persistMatchResult(room, winnerColor) chamada nos dois pontos de GAMEOVER
   - GET /leaderboard (top 50, com rank)
   - GET /player/:id
   - Matchmaking MMR-aware no queue_join

Restrições:
- persistMatchResult silencioso se jogadores não têm conta
- NÃO toque em index.html
- Mostre exatamente as linhas do server.js que serão alteradas

Entregue os arquivos + como testar.
```

---

# SESSÃO 4: FRONTEND — AUTENTICAÇÃO

## Objetivo
Adicionar tela de login/registro ao jogo. Exibir MMR e rank do jogador durante e após as partidas.

## Risco de Token: 🟠 MÉDIO-ALTO
Motivo: precisa ler trechos do `index.html` para encontrar onde inserir elementos e integrar com o socket.

### Estratégia de Mitigação
- Criar `html/auth-frontend.js` com TODA a lógica (novo arquivo = zero custo de leitura prévia)
- Adicionar apenas 2-4 pontos ao `index.html`: `<div>` do overlay, `<script>` tag, e integração com socket
- Usar `read` com `offset` para ler só os trechos relevantes do `index.html`

## Pré-requisito
Sessões 1-3 completas. `POST /auth/register` e `POST /auth/login` funcionando.

## Arquivos Criados/Alterados
```
html/
  auth-frontend.js     ← NOVO: toda lógica de auth + MMR badge
  index.html           ← ALTERADO: 4 pontos específicos
```

## O que fazer (ordem exata)

### 1. Criar `html/auth-frontend.js`
```javascript
'use strict';

const API = 'http://localhost:3000';

const Session = {
    save(data) { localStorage.setItem('mc_session', JSON.stringify(data)); },
    get()      { try { return JSON.parse(localStorage.getItem('mc_session')); } catch { return null; } },
    clear()    { localStorage.removeItem('mc_session'); },
    isValid()  { const s = this.get(); return !!(s && s.token && s.id); }
};

const AuthUI = {
    show() { document.getElementById('auth-overlay').style.display = 'flex'; },
    hide() { document.getElementById('auth-overlay').style.display = 'none'; },
    setError(msg) {
        const el = document.getElementById('auth-error');
        el.textContent = msg;
        el.style.display = msg ? 'block' : 'none';
    },
    setLoading(on) {
        const btn = document.getElementById('auth-submit');
        btn.disabled    = on;
        btn.textContent = on ? 'Aguarde...' : currentMode === 'login' ? 'Entrar' : 'Criar conta';
    },
    async handleSubmit(mode) {
        const email    = document.getElementById('auth-email').value.trim();
        const password = document.getElementById('auth-password').value;
        const username = document.getElementById('auth-username').value.trim();
        if (!email || !password) { this.setError('Preencha todos os campos'); return; }
        this.setLoading(true); this.setError('');
        try {
            const body = mode === 'register'
                ? { email, password, username: username || email.split('@')[0] }
                : { email, password };
            const res  = await fetch(`${API}/auth/${mode}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (!res.ok) { this.setError(data.error || 'Erro ao autenticar'); return; }
            Session.save(data);
            this.hide();
            MMRBadge.update(data);
        } catch { this.setError('Servidor offline. Tente novamente.'); }
        finally  { this.setLoading(false); }
    }
};

const MMRBadge = {
    update(data) {
        const badge = document.getElementById('mmr-badge');
        if (!badge || !data) return;
        badge.textContent = `${data.rank?.icon || '♟'} ${data.mmr ?? 1500}`;
        badge.title       = data.rank?.name || 'Peão';
        badge.style.display = 'block';
    },
    refresh() {
        const s = Session.get();
        if (!s) return;
        fetch(`${API}/player/${s.id}`)
            .then(r => r.json())
            .then(d => { Session.save({ ...s, ...d }); this.update(d); })
            .catch(() => {});
    }
};

// Chamado pelo index.html após definir o socket
function listenMMRUpdate(socket) {
    socket.on('mmr_update', (data) => {
        const s = Session.get();
        if (s) Session.save({ ...s, mmr: data.newMMR, rank: data.rank });
        MMRBadge.update({ mmr: data.newMMR, rank: data.rank });
        showMMRToast((data.delta >= 0 ? '+' : '') + data.delta + ' MMR');
    });
}

function showMMRToast(msg) {
    const t = document.createElement('div');
    t.textContent = msg;
    Object.assign(t.style, {
        position: 'fixed', top: '20px', right: '20px', zIndex: '9999',
        background: '#1a1a1a', color: '#d4a832',
        padding: '10px 18px', borderRadius: '8px',
        fontFamily: "'Cinzel',serif", fontSize: '0.85rem',
        fontWeight: '700', letterSpacing: '2px',
        border: '1px solid #d4a832', transition: 'opacity 0.5s'
    });
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 500); }, 2500);
}

// Retorna o perfil para queue_join com token injetado
function getQueueProfile(baseProfile) {
    const s = Session.get();
    if (!s) return baseProfile;
    return { ...baseProfile, uid: s.id, nickname: s.username, token: s.token, mmr: s.mmr };
}

let currentMode = 'login';

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('auth-toggle')?.addEventListener('click', () => {
        currentMode = currentMode === 'login' ? 'register' : 'login';
        const isReg = currentMode === 'register';
        document.getElementById('auth-username-row').style.display = isReg ? 'block' : 'none';
        document.getElementById('auth-toggle').textContent  = isReg ? 'Já tenho conta' : 'Criar conta';
        document.getElementById('auth-submit').textContent  = isReg ? 'Criar conta' : 'Entrar';
    });

    document.getElementById('auth-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await AuthUI.handleSubmit(currentMode);
    });

    if (Session.isValid()) { AuthUI.hide(); MMRBadge.refresh(); }
    else                   { AuthUI.show(); }
});
```

### 2. Adicionar ao `index.html` — 4 pontos

**Ponto A:** Logo após `<body` (primeira div), adicionar overlay:
```html
<div id="auth-overlay" style="position:fixed;inset:0;z-index:8000;background:rgba(8,8,8,0.96);display:flex;flex-direction:column;align-items:center;justify-content:center">
  <p style="color:#d4a832;font-family:'Cinzel',serif;letter-spacing:6px;font-size:1.1rem;margin-bottom:24px">microChess</p>
  <form id="auth-form" style="display:flex;flex-direction:column;gap:10px;width:260px">
    <div id="auth-username-row" style="display:none">
      <input id="auth-username" type="text" placeholder="Nome de usuário"
        style="width:100%;padding:10px;background:#111;border:1px solid #2a2a2a;color:#f0ece4;border-radius:6px;font-family:'Cinzel',serif;font-size:0.8rem">
    </div>
    <input id="auth-email" type="email" placeholder="E-mail"
      style="padding:10px;background:#111;border:1px solid #2a2a2a;color:#f0ece4;border-radius:6px;font-family:'Cinzel',serif;font-size:0.8rem">
    <input id="auth-password" type="password" placeholder="Senha"
      style="padding:10px;background:#111;border:1px solid #2a2a2a;color:#f0ece4;border-radius:6px;font-family:'Cinzel',serif;font-size:0.8rem">
    <p id="auth-error" style="color:#e74c3c;font-size:0.7rem;display:none;font-family:'IBM Plex Mono',monospace"></p>
    <button id="auth-submit" type="submit"
      style="padding:11px;background:#d4a832;color:#000;border:none;border-radius:6px;font-family:'Cinzel',serif;font-weight:700;letter-spacing:3px;cursor:pointer;font-size:0.8rem">Entrar</button>
    <button id="auth-toggle" type="button"
      style="background:none;border:none;color:#555;font-family:'Cinzel',serif;font-size:0.7rem;cursor:pointer;letter-spacing:1px">Criar conta</button>
  </form>
</div>
```

**Ponto B:** Dentro do `#top-bar`, adicionar badge de MMR:
```html
<span id="mmr-badge" style="font-family:'IBM Plex Mono',monospace;font-size:0.7rem;color:#d4a832;display:none"></span>
```

**Ponto C:** Onde o socket é criado (após `const socket = io(...)`), adicionar:
```javascript
listenMMRUpdate(socket);
```

**Ponto D:** Onde `socket.emit('queue_join', ...)` é chamado, substituir por:
```javascript
socket.emit('queue_join', getQueueProfile({ uid, nickname, avatar }));
```

**Ponto E:** Antes de `</body>`:
```html
<script src="auth-frontend.js"></script>
```

## Validação
1. Abra `html/index.html` no browser
2. Overlay de login deve aparecer
3. Registre uma conta
4. Overlay fecha — badge MMR aparece no top-bar
5. Jogue uma partida — ao fim deve aparecer toast `+/-X MMR`
6. Badge atualiza com novo MMR

## Checklist Final
```
✅ Overlay de login aparece ao abrir o jogo
✅ Registro e login funcionando sem recarregar
✅ Sessão salva em localStorage persiste entre recargas
✅ Badge de MMR visível no top-bar durante o jogo
✅ Toast aparece ao fim da partida com delta de MMR
✅ index.html alterado em exatamente 5 pontos
```

## Prompt para esta Sessão
```
Contexto: microChess tem server.js com auth JWT (/auth/register, /auth/login),
evento Socket.io 'mmr_update' emitido ao fim de cada partida,
e index.html de ~1.200 linhas com toda a lógica do jogo frontend.

Tarefa: Adicionar autenticação ao frontend com impacto mínimo no index.html.

1. Crie html/auth-frontend.js (arquivo novo) com:
   - Session manager (localStorage)
   - AuthUI (overlay de login/registro)
   - MMRBadge (exibir MMR no top-bar)
   - listenMMRUpdate(socket) para ouvir mmr_update
   - getQueueProfile(base) para injetar token no queue_join
   - showMMRToast(msg)

2. Leia o index.html em partes (use offset/limit) para encontrar:
   - A tag <body> ou primeiro <div> — inserir o div#auth-overlay
   - O elemento #top-bar — inserir span#mmr-badge
   - Onde o socket é criado — adicionar listenMMRUpdate(socket)
   - Onde queue_join é emitido — usar getQueueProfile()
   - O </body> — adicionar <script src="auth-frontend.js">

Restrições:
- Toda lógica nova em auth-frontend.js
- index.html: máximo 5 pontos de alteração, nunca reescrever blocos grandes
- CSS inline no overlay (não alterar os styles existentes)
```

---

# SESSÃO 5: LEADERBOARD + POLISH

## Objetivo
Adicionar tela de leaderboard acessível pelo jogo, polir a integração, e testar o fluxo completo.

## Risco de Token: 🟡 MÉDIO
Motivo: cria novo arquivo JS pequeno, altera index.html minimamente.

## Pré-requisito
Sessões 1-4 completas.

## Arquivos Criados/Alterados
```
html/
  rank-ui.js           ← NOVO: leaderboard overlay
  index.html           ← ALTERADO: 3 pontos (overlay + script + botão)
```

## O que fazer (ordem exata)

### 1. Criar `html/rank-ui.js`
```javascript
'use strict';

const API_BASE = 'http://localhost:3000';

const Leaderboard = {
    async load() {
        document.getElementById('lb-body').innerHTML =
            '<tr><td colspan="4" style="text-align:center;padding:20px;opacity:0.5">Carregando...</td></tr>';
        try {
            const res  = await fetch(`${API_BASE}/leaderboard`);
            const data = await res.json();
            this.render(data);
        } catch {
            document.getElementById('lb-body').innerHTML =
                '<tr><td colspan="4" style="text-align:center;padding:20px;color:#e74c3c">Servidor offline</td></tr>';
        }
    },

    render(players) {
        const tbody = document.getElementById('lb-body');
        if (!players.length) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;opacity:0.5">Sem jogadores ainda</td></tr>';
            return;
        }
        tbody.innerHTML = players.map(p => `
            <tr style="${p.rank <= 3 ? 'color:#d4a832' : 'color:#f0ece4'}">
                <td style="padding:8px 12px;text-align:center;opacity:0.6">#${p.rank}</td>
                <td style="padding:8px 12px">${p.icon || '♟'} ${p.username}</td>
                <td style="padding:8px 12px;text-align:right;font-family:'IBM Plex Mono',monospace">${p.mmr}</td>
                <td style="padding:8px 12px;text-align:right;opacity:0.5;font-family:'IBM Plex Mono',monospace;font-size:0.72rem">${p.wins}W ${p.losses}L</td>
            </tr>
        `).join('');
    },

    show() {
        document.getElementById('lb-overlay').style.display = 'flex';
        this.load();
    },

    hide() {
        document.getElementById('lb-overlay').style.display = 'none';
    }
};

document.getElementById('lb-close')?.addEventListener('click', () => Leaderboard.hide());
window.showLeaderboard = () => Leaderboard.show();
```

### 2. Adicionar ao `index.html` — 3 pontos

**Ponto A:** Overlay do leaderboard (após o auth-overlay existente):
```html
<div id="lb-overlay" style="position:fixed;inset:0;z-index:7000;background:rgba(8,8,8,0.93);display:none;flex-direction:column;align-items:center;justify-content:flex-start;padding:40px 20px;overflow-y:auto">
  <h2 style="color:#d4a832;letter-spacing:6px;font-family:'Cinzel',serif;margin-bottom:24px;font-size:1rem">RANKING</h2>
  <table style="width:min(480px,90vw);border-collapse:collapse;font-family:'Cinzel',serif;font-size:0.78rem">
    <thead>
      <tr style="border-bottom:1px solid #222;color:#555">
        <th style="padding:8px 12px">#</th>
        <th style="padding:8px 12px;text-align:left">Jogador</th>
        <th style="padding:8px 12px;text-align:right">MMR</th>
        <th style="padding:8px 12px;text-align:right">Partidas</th>
      </tr>
    </thead>
    <tbody id="lb-body"></tbody>
  </table>
  <button id="lb-close" style="margin-top:28px;padding:10px 28px;background:transparent;border:1px solid #333;color:#666;font-family:'Cinzel',serif;letter-spacing:3px;border-radius:6px;cursor:pointer;font-size:0.72rem">FECHAR</button>
</div>
```

**Ponto B:** Botão de ranking (próximo ao botão "Como Jogar" existente):
```html
<button onclick="showLeaderboard()" style="/* mesmo estilo do botão como-jogar */">RANKING</button>
```

**Ponto C:** Script antes de `</body>`:
```html
<script src="rank-ui.js"></script>
```

### 3. Teste integrado — fluxo completo

```bash
# Terminal 1: backend
cd server && npm run dev

# Browser 1 e 2: abrir index.html
# Fluxo:
# 1. B1: Registrar usuario1@test.com
# 2. B2: Registrar usuario2@test.com
# 3. B1: Clicar JOGAR → entrar na fila
# 4. B2: Clicar JOGAR → match deve ser encontrado
# 5. Jogar até o fim (alguém ganhar)
# 6. Verificar toast de MMR nos dois browsers
# 7. Clicar RANKING → ver ambos no leaderboard com MMR diferente de 1500
```

## Checklist Final
```
✅ Leaderboard abre ao clicar no botão
✅ Top 3 destacado em dourado
✅ Tabela mostra MMR + W/L corretos
✅ Overlay fecha com botão FECHAR
✅ Fluxo completo testado com 2 browsers
✅ ACTIVITY_LOG.md atualizado com status final
```

## Prompt para esta Sessão
```
Contexto: microChess com auth + MMR + badges funcionando.
Frontend tem auth-frontend.js. Servidor tem GET /leaderboard (top 50 com rank).

Tarefa: Adicionar leaderboard ao frontend + teste completo.

1. Crie html/rank-ui.js:
   - Leaderboard.load() fetch /leaderboard
   - Leaderboard.render() constrói tabela
   - Leaderboard.show() / hide()
   - window.showLeaderboard = () => Leaderboard.show()

2. Adicione ao index.html (3 pontos apenas):
   - div#lb-overlay com tabela (HTML+CSS inline, dark theme, accent #d4a832)
   - Botão "RANKING" próximo ao botão como-jogar existente
   - <script src="rank-ui.js"> antes de </body>

3. Após implementar: execute o teste integrado com 2 browsers e documente o resultado.

Restrições:
- Toda lógica em rank-ui.js
- index.html: máximo 3 alterações
- Design consistente: dark #080808, accent #d4a832, fonte Cinzel
```

---

## Resumo de Riscos por Sessão

| Sessão | Arquivos lidos | Custo | Arquivos criados/editados | Risco |
|--------|---------------|-------|--------------------------|-------|
| 1 | Nenhum existente | Mínimo | 3 novos | 🟢 Muito baixo |
| 2 | server.js (544L) | Baixo | auth.js novo + server.js +30L | 🟡 Baixo |
| 3 | server.js (~574L) | Baixo | mmr.js novo + server.js +60L | 🟡 Médio |
| 4 | index.html (parcial, com offset) | Médio | auth-frontend.js novo + index.html 5 pontos | 🟠 Médio-alto |
| 5 | index.html (parcial, com offset) | Baixo | rank-ui.js novo + index.html 3 pontos | 🟡 Médio |

**Nenhuma sessão reescreve um arquivo grande do zero.**
**Nenhuma sessão mistura backend com frontend.**

---

## Protocolo de Retomada (tokens esgotados no meio)

```bash
# 1. Salvar imediatamente
git add .
git commit -m "WIP Sessão X — parou em: [arquivo que estava sendo editado]"

# 2. Registrar no ACTIVITY_LOG.md o que foi feito e onde parou

# 3. Na próxima janela de 5h, colar no Claude Code:
"Retomando Sessão X do SESSAO_POR_SESSAO_PLANNING.md.
Ver ACTIVITY_LOG.md para status. Continuar de: [último arquivo criado].
O que ainda falta: [itens não concluídos do checklist]."
```

---

*Log de atividades: `docs/ACTIVITY_LOG.md`*
*Última atualização: 2026-04-17*
