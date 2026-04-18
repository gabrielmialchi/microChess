# microChess — Activity Log

Atualizar ao fim de cada sessão. Claude deve ler este arquivo no início de cada sessão
para entender o estado atual antes de implementar qualquer coisa.

---

## Formato de Entrada

```
## [DATA] Sessão X — [TEMA]
**Status:** Completo | Em andamento | Interrompido em [arquivo]
**Branch:** sessao-X

### Feito
- item

### Pendente (se Interrompido)
- item

### Bugs / Bloqueios Conhecidos
- item

### Notas para próxima sessão
- item
```

---

## [2026-04-17] Sessão 0 — Planejamento e Organização

**Status:** Completo
**Branch:** main

### O que foi feito
- Leitura completa de `server/server.js` (544 linhas) — lógica de jogo inteira mapeada
- Leitura parcial de `html/index.html` (~1.200 linhas) — todas as telas mapeadas
- Identificação de telas existentes vs. telas a criar (ver CLAUDE.md)
- Decisão: SQLite (sem PostgreSQL) — zero configuração adicional
- Decisão: não reescrever arquivos existentes — apenas inserir blocos
- Decisão: toda lógica nova vai em arquivos JS separados
- Reescrita completa de `SESSAO_POR_SESSAO_PLANNING.md` — 6 sessões
- Criação de `CLAUDE.md` — documento de contexto do projeto
- Criação deste `ACTIVITY_LOG.md`

### Sistemas mapeados e considerados
| Sistema | Planejado em |
|---------|-------------|
| Banco de dados SQLite | Sessão 1 |
| Autenticação JWT | Sessão 2 |
| MMR / ELO (K=32, 6 tiers) | Sessão 3 |
| WO + Ban progressivo (30min/2h/24h) | Sessão 3 |
| AFK Timeout (45s ACTION, 120s DRAFT/POSITION) | Sessão 3 |
| Replay recording (turno a turno) | Sessão 4 |
| Leaderboard endpoint | Sessão 4 |
| Anti-cheat básico (log de tentativas inválidas) | Sessão 4 |
| Frontend auth (login/registro overlay) | Sessão 5 |
| Frontend ban overlay com countdown | Sessão 5 |
| Frontend MMR badge + populate menu/profile | Sessão 5 |
| Frontend leaderboard screen | Sessão 6 |
| Frontend replay viewer (turno a turno) | Sessão 6 |

### Estado dos arquivos do projeto
| Arquivo | Linhas | Status |
|---------|--------|--------|
| `server/server.js` | 544 | ✅ Funcional — base intocável |
| `html/index.html` | ~1.200 | ✅ Funcional — base intocável |
| `server/package.json` | 17 | ✅ express + socket.io |
| `server/db/schema.sql` | — | ❌ Criar na Sessão 1 |
| `server/db/database.js` | — | ❌ Criar na Sessão 1 |
| `server/auth.js` | — | ❌ Criar na Sessão 2 |
| `server/mmr.js` | — | ❌ Criar na Sessão 3 |
| `server/replay.js` | — | ❌ Criar na Sessão 4 |
| `html/auth-frontend.js` | — | ❌ Criar na Sessão 5 |
| `html/rank-ui.js` | — | ❌ Criar na Sessão 6 |
| `html/replay-ui.js` | — | ❌ Criar na Sessão 6 |

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para Sessão 1
- Ler CLAUDE.md antes de qualquer coisa
- NÃO tocar em server.js nem index.html
- Instalar: `npm install better-sqlite3`
- Criar pasta `server/db/` com 3 arquivos

---

## [2026-04-18] Sessão 1 — Database SQLite

**Status:** Completo
**Branch:** main

### Feito
- `better-sqlite3` instalado via npm
- `server/db/schema.sql` criado — tabelas `players`, `matches`, `replays` + 4 índices
- `server/db/database.js` criado — singleton com WAL mode e foreign_keys ON
- `server/db/seed.js` criado — verifica 3 tabelas + índices, process.exit(0)
- `server/package.json` atualizado — script `db:setup` adicionado
- `npm run db:setup` executado com sucesso — todas tabelas e índices OK

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para Sessão 2
- Instalar: `npm install bcrypt jsonwebtoken`
- Criar `server/auth.js` com hashPassword, checkPassword, signToken, verifyToken
- Adicionar POST /auth/register e POST /auth/login ao server.js
- Modificar queue_join para aceitar token opcional

<!-- TEMPLATE — copiar e preencher ao fim de cada sessão -->

<!--
## [DATA] Sessão 1 — Database SQLite (template original)
-->

## [2026-04-18] Sessão 2 — Autenticação JWT

**Status:** Completo
**Branch:** main

### Feito
- `bcrypt` e `jsonwebtoken` instalados via npm
- `server/auth.js` criado — hashPassword, checkPassword, signToken, verifyToken
- `server.js`: requires adicionados (auth.js, db/database.js)
- `server.js`: `express.json()` middleware adicionado
- `server.js`: POST /auth/register — valida, hash, INSERT players, retorna token
- `server.js`: POST /auth/login — SELECT, bcrypt.compare, UPDATE last_seen, retorna token
- `server.js`: queue_join modificado — aceita token opcional; fallback sem token mantido
- Testado: register retorna JWT; login com credenciais corretas retorna JWT

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para Sessão 3
- Criar `server/mmr.js` (calculate, getRank, getBanDuration)
- Adicionar persistMatchResult, applyBan, startAFKTimer, clearAFKTimer ao server.js
- Chamar persistMatchResult nos 2 pontos de GAMEOVER (finishDuel + disconnect)
- Ban check no queue_join (já tem hook, só adicionar lógica)
- GET /leaderboard e GET /player/:id

## [2026-04-18] Sessão 3 — MMR + WO/Ban + AFK

**Status:** Completo
**Branch:** main

### Feito
- `server/mmr.js` criado — calculate (K=32), getRank (6 tiers), getBanDuration
- `server.js`: require mmr adicionado no topo
- `server.js`: GET /leaderboard (top 50 por MMR) e GET /player/:id
- `server.js`: constantes K_WO_BONUS=8, AFK_ACTION_MS=45s, AFK_PREPARE_MS=120s
- `server.js`: funções applyBan, persistMatchResult, clearAFKTimer, startAFKTimer
- `server.js`: timeouts:{} adicionado à criação da sala
- `server.js`: AFK timers iniciados ao criar sala (DRAFT 120s ambos)
- `server.js`: clearAFKTimer/startAFKTimer em draft_buy, draft_reset, draft_ready
- `server.js`: clearAFKTimer/startAFKTimer em position_place, position_return, position_ready
- `server.js`: AFK timers ACTION iniciados no callback REVEAL→ACTION
- `server.js`: clearAFKTimer em action_plan, action_ready
- `server.js`: AFK timers ACTION reiniciados em finishDuel ao retornar para ACTION
- `server.js`: persistMatchResult no GAMEOVER de finishDuel (vitória normal)
- `server.js`: persistMatchResult no disconnect (WO)
- `server.js`: ban check no queue_join — emite 'banned' se ban_until ativo
- Sintaxe verificada com node --check

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para Sessão 4
- Criar `server/replay.js` (createReplayBuffer, recordTurn, buildTurnSnapshot, buildDuelSnapshot)
- room._replay inicializado ao criar sala
- Gravar turnos em resolveAction e finishDuel
- Salvar replay no banco em persistMatchResult
- GET /match/:id/replay e GET /player/:id/matches

## [2026-04-18] Sessão 4 — Replay Recording + Anti-cheat

**Status:** Completo
**Branch:** main

### Feito
- `server/replay.js` criado — createReplayBuffer, recordTurn, buildTurnSnapshot, buildDuelSnapshot
- `server.js`: require replay adicionado no topo
- `server.js`: room._replay = createReplayBuffer() na criação da sala
- `server.js`: gravação de planning snapshot antes de resolveAction (em action_ready)
- `server.js`: gravação de duel snapshot em finishDuel (após calcular totW/totB)
- `server.js`: replay salvo no banco dentro de persistMatchResult (após INSERT matches)
- `server.js`: GET /match/:id/replay — retorna turns como array, verifica expiração
- `server.js`: GET /player/:id/matches — histórico com LEFT JOIN replays (replay_id)
- `server.js`: anti-cheat — invalidMoveCount por socket, log após 15 tentativas inválidas em action_plan
- Sintaxe verificada com node --check

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para Sessão 5
- Criar `html/auth-frontend.js` com Session, AuthUI, MenuPopulator, BanOverlay, showMMRToast, getQueueProfile, listenGameEvents
- Ler index.html em partes para localizar os 5 pontos de inserção
- CSS inline nos novos divs — não alterar <style>

## [2026-04-18] Sessão 5 — Frontend Auth + Ban

**Status:** Completo
**Branch:** main

### Feito
- `html/auth-frontend.js` criado — Session, MenuPopulator, AuthUI, BanOverlay, showMMRToast, getQueueProfile, listenGameEvents
- `html/index.html`: auth-overlay inserido após `<body>` — login/register toggle + "Jogar sem conta"
- `html/index.html`: ban-overlay inserido após auth-overlay — countdown em tempo real
- `html/index.html`: `listenGameEvents(socket)` chamado após `const socket = io(...)`
- `html/index.html`: `queue_join` usa `getQueueProfile()` — injeta token se autenticado
- `html/index.html`: `<script src="auth-frontend.js">` adicionado antes de `</body>`

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para Sessão 6
- Criar `html/rank-ui.js` — Leaderboard overlay + MatchHistory no screen-profile
- Criar `html/replay-ui.js` — ReplayViewer com board 4x4 e controles prev/next/play
- Adicionar telas screen-replay e screen-leaderboard ao index.html
- Adicionar botão RANKING no screen-menu

<!--
## [DATA] Sessão 5 — Frontend Auth + Ban (template original)
-->

### Feito
-

### Pendente
-

### Bugs / Bloqueios Conhecidos
-

### Notas para Sessão 6
-
-->

## [2026-04-18] Sessão 6 — Frontend Leaderboard + Replay

**Status:** Completo
**Branch:** main

### Feito
- `html/rank-ui.js` criado — Leaderboard (load/render/show), MatchHistory (load/render), hook em showScreen('profile')
- `html/replay-ui.js` criado — ReplayViewer (load, open, renderTurn, prev, next, play, close), window.watchReplay
- `html/index.html`: tela `screen-replay` inserida com board 4x4 + controles ⏮ ▶ ⏭
- `html/index.html`: tela `screen-leaderboard` inserida com tabela scrollável
- `html/index.html`: container `#profile-match-history` inserido no screen-profile
- `html/index.html`: botão RANKING adicionado ao screen-menu
- `html/index.html`: scripts rank-ui.js e replay-ui.js adicionados antes de </body>

### Status final do projeto
- Todas as 6 sessões de backend e frontend concluídas
- Backend: SQLite, Auth JWT, MMR/ELO, WO/Ban, AFK timers, Replay recording, Leaderboard, Anti-cheat
- Frontend: Auth overlay, Ban overlay com countdown, MMR toast, Leaderboard, Replay viewer, Histórico de partidas

---

## [2026-04-18] Polimento — ELO visível, Email seguro, Logout

**Status:** Completo
**Branch:** main

### Feito
- `server/elo.js` criado — 14 ranks (Peão/Bispo/Cavalo/Torre/Rainha/Rei), applyLPChange com escudo, getEloDisplay
- `server/db/schema.sql` atualizado — colunas elo_rank, elo_lp, elo_shield, email_hash, email_enc + índice UNIQUE em email_hash
- `server/db/database.js` atualizado — migrations automáticas de colunas + migração de emails existentes (HMAC-SHA256 hash + AES-256-GCM encrypt)
- `server/server.js`:
  - require('./elo') adicionado
  - Email crypto helpers (hashEmail, encryptEmail) com HMAC_SECRET + AES_KEY de env vars
  - POST /auth/register: validação de formato (regex), normalização (lowercase+trim), hash + encrypt; lookup por email_hash antes de INSERT
  - POST /auth/login: lookup por email_hash (email nunca exposto em resposta)
  - persistMatchResult: applyLPChange para ambos os jogadores; UPDATE inclui elo_rank/elo_lp/elo_shield; mmr_update emite lpDelta + elo + promoted/demoted
  - GET /leaderboard: ORDER BY elo_rank DESC, elo_lp DESC; inclui elo display
  - GET /player/:id: inclui elo display
- `html/auth-frontend.js`:
  - MenuPopulator.populate: badge usa p.elo.icon/name/lp (PdL) do /player/:id
  - showMMRToast: exibe LP delta, promoção ou rebaixamento com nome do rank
  - listenGameEvents: mmr_update desestrutura lpDelta, elo, promoted, demoted
  - window.doLogout: limpa Session + localStorage, exibe AuthUI
- `html/index.html`: botão "SAIR DA CONTA" adicionado ao screen-profile
- `html/rank-ui.js`: leaderboard usa elo.icon/name/lp ao invés de MMR raw
