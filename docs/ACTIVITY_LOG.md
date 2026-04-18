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

### Status final do projeto (pré-polimento)
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

### Notas para Sessão 7
- Novo fluxo de UI definido (PDF aprovado pelo usuário)
- Menu: apenas NOVO JOGO / RANKING / CONFIGURAÇÕES
- Configurações: adicionar COMO JOGAR + CRÉDITOS
- Header do menu reestruturado: avatar+nick+rank+W/L (esq) + btn SAIR (dir)
- Popup de confirmação de logout
- SAIR DA CONTA no perfil deve abrir popup (não fazer logout direto)
- Sessões 7–10 planejadas em SESSAO_POR_SESSAO_PLANNING.md

---

## [2026-04-18] Sessão 7 — Reorganização Navegação + Header + Logout

**Status:** Completo
**Branch:** main

### Feito
- `html/index.html`: btn-como-jogar e btn-creditos removidos do screen-menu
- `html/index.html`: btn-ranking agora chama showScreen('ranking')
- `html/index.html`: header do menu reestruturado — stats-pill + botão ⏻ SAIR (logout) no lado direito
- `html/index.html`: Configurações — botões COMO JOGAR e CRÉDITOS adicionados
- `html/index.html`: SAIR DA CONTA no perfil agora chama confirmLogout() em vez de doLogout()
- `html/index.html`: popup #logout-confirm inserido — "TROCAR DE CONTA? SIM/NÃO"
- `html/index.html`: refreshMenuScreen limpo — removidas referências a btn-como-jogar e btn-creditos
- `html/auth-frontend.js`: window.confirmLogout, window.hideLogoutConfirm adicionados
- `html/auth-frontend.js`: window.doLogout atualizado — fecha popup + reseta campos do header

### Notas para Sessão 8
- Criar tela screen-ranking com grid dos 14 ranks e botão LEADERBOARD GLOBAL
- Back do leaderboard deve ir para screen-ranking
- showLeaderboard() continua funcionando para o botão dentro de screen-ranking

---

## [2026-04-18] Sessão 8 — Tela RANKING Explicativa + Leaderboard

**Status:** Completo
**Branch:** main

### Feito
- `html/index.html`: tela `screen-ranking` inserida antes de screen-leaderboard
  - Header: VOLTAR → menu, título RANKING
  - Botão LEADERBOARD GLOBAL em destaque → window.showLeaderboard()
  - Card "COMO FUNCIONA" com explicação de PdL, promoção e escudo
  - 6 cards de grupos: Peão/Bispo/Cavalo/Torre (3 divisões cada) + Rainha/Rei (divisão única)
- `html/index.html`: screen-leaderboard — back agora vai para screen-ranking (antes ia para menu)
- `html/index.html`: screen-leaderboard — título alterado de "RANKING" para "LEADERBOARD"

### Notas para Sessão 9
- Criar screen-match-history (tela dedicada de histórico)
- Perfil: remover histórico embutido (#profile-match-history), adicionar botão HISTÓRICO
- Replay: adicionar header com resumo da partida, back → screen-match-history
- GET /player/:id/matches precisa retornar usernames do oponente (verificar JOIN)

---

## [2026-04-18] Sessão 9 — Histórico de Partidas + Replay Melhorado

**Status:** Completo
**Branch:** main

### Feito
- `server/server.js`: GET /player/:id/matches — JOIN com players para retornar white_username e black_username
- `html/index.html`: screen-match-history inserida antes do screen-replay
- `html/index.html`: screen-profile — histórico embutido removido; botão HISTÓRICO DE PARTIDAS adicionado
- `html/index.html`: screen-replay — div #replay-summary inserido acima do board
- `html/rank-ui.js`: MatchHistory.open(playerId) → showScreen('match-history'); render usa white/black_username; watchReplay recebe meta (opponentName, date, lpDelta)
- `html/replay-ui.js`: _meta; open() popula #replay-summary; close() → screen-match-history; window.watchReplay aceita meta como 2º argumento

### Notas para Sessão 10
- pendingReconnects Map no server.js
- disconnect: inicia 60s timer antes do WO (autenticados); WO imediato para convidados
- Evento rejoin_game: restaura socketId na sala, cancela timer
- Overlay frontend: countdown "aguardando reconexão" para o oponente

---

## [2026-04-18] Sessão 10 — Reconexão com tolerância de 60s

**Status:** Completo
**Branch:** main

### Feito
- `server/server.js`: `pendingReconnects = new Map()` e `RECONNECT_MS = 60_000` adicionados
- `server/server.js`: disconnect handler refatorado — autenticados entram em pendingReconnects com timer 60s; convidados recebem WO imediato; oponente recebe `opponent_reconnecting` com remainMs
- `server/server.js`: evento `rejoin_game` — verifica token, cancela timer, restaura socketId, reinicia AFK timer da fase atual, emite `opponent_reconnected` ao oponente e `game_state` + `rejoin_success` ao reconectado
- `html/index.html`: overlay `#reconnect-overlay` com countdown e mensagem "AGUARDANDO RECONEXÃO"
- `html/auth-frontend.js`: `ReconnectOverlay` (show/hide com countdown), `tryRejoinIfPending(socket)`, listeners `opponent_reconnecting` / `opponent_reconnected` / `rejoin_success` / `rejoin_failed` adicionados ao `listenGameEvents`
- `html/auth-frontend.js`: init() chama `tryRejoinIfPending` ao conectar com sessão válida

### Status final do projeto — Sessões 7-10
- Navegação reestruturada conforme novo fluxo de UI
- Header do menu com logout
- Tela de ranks explicativa
- Histórico de partidas em tela dedicada
- Replay com resumo da partida
- Reconexão de 60s para jogadores autenticados

---

## [2026-04-18] Revisão de Segurança — Análise de Vulnerabilidades

**Status:** Completo (análise)
**Branch:** main

### O que foi feito
- Leitura completa de server.js (~915L), auth.js, rank-ui.js, replay-ui.js, auth-frontend.js e index.html (seletivo)
- Mapeamento de 14 vulnerabilidades por severidade
- Planejamento de Sessões 11, 12 e 13 em SESSAO_POR_SESSAO_PLANNING.md

### Vulnerabilidades Encontradas

| # | Descrição | Severidade | Sessão |
|---|-----------|-----------|--------|
| 1 | Sem rate limit em /auth/login e /auth/register | CRÍTICO | 11 |
| 2 | Username sem validação de conteúdo — XSS stored possível | CRÍTICO | 11 |
| 3 | innerHTML com username sem escaping em leaderboard/histórico | CRÍTICO | 11 |
| 4 | watchReplay injeta JSON em atributo onclick — XSS via username | CRÍTICO | 11 |
| 5 | JWT_SECRET / HMAC_SECRET com defaults de dev — sem aviso em prod | ALTO | 11 |
| 6 | game_join aceita qualquer cor — adversário pode sequestrar lado | ALTO | 11 |
| 7 | persistMatchResult sem transação — DB inconsistente em crash | ALTO | 11 |
| 8 | duel_resolve sem verificar d.resolveTime — resolve antes de ambos rolarem | ALTO | 11 |
| 9 | LP delta no histórico usa coluna mmr_change (valor errado) | MÉDIO | 12 |
| 10 | queue_join aceita nickname falso para jogadores autenticados | MÉDIO | 12 |
| 11 | JSON.parse sem try/catch no endpoint /match/:id/replay | MÉDIO | 12 |
| 12 | Timing oracle no login — revela existência de email | MÉDIO | 12 |
| 13 | Avatar não validado em queue_join | BAIXO | 12 |
| 14 | Replays expirados nunca deletados do banco | BAIXO | 13 |

### Notas
- CORS origin:'*' é baixo risco dado que JWT está em localStorage (não cookies)
- Sessão 11 é prioritária: contém os 4 vetores de XSS + 2 game integrity bugs
- Sessão 12 corrige valores errados visíveis ao usuário (LP delta) + segurança média
- Sessão 13 é puramente manutenção, pode ser adiada

---

## [2026-04-18] Sessão 11 — Segurança Crítica

**Status:** Completo
**Branch:** main

### Feito
- `server/package.json`: express-rate-limit ^7.5.1 adicionado + npm install executado
- `server/server.js`: `const rateLimit = require('express-rate-limit')` adicionado
- `server/server.js`: `authLimiter` — 5 req/min por IP, aplicado em POST /auth/register e POST /auth/login
- `server/server.js`: startup warnings para HMAC_SECRET e AES_KEY em NODE_ENV=production
- `server/server.js`: `USERNAME_RE = /^[a-zA-Z0-9_\-\.]{3,16}$/` — validação de username no register
- `server/auth.js`: startup warning para JWT_SECRET em NODE_ENV=production
- `server/server.js`: `game_join` — verifica `room.players[color]?.socketId === socket.id` antes de aceitar
- `server/server.js`: `persistMatchResult` — DB operations envolvidas em `db.transaction()`, socket emits fora
- `server/server.js`: `duel_resolve` — guard `if (!d?.resolveTime) return` adicionado
- `html/rank-ui.js`: helper `escapeHTML()` adicionado no topo
- `html/rank-ui.js`: leaderboard render — `escapeHTML()` aplicado em username, elo.icon, elo.name
- `html/rank-ui.js`: match history render — `escapeHTML()` em opponentName, onclick substituído por `data-match-id` + `data-meta` + `addEventListener`

### Notas para Sessão 12
- LP delta no histórico ainda usa mmr_change_white/black (valor errado) — Sessão 12 adiciona colunas lp_change_white/black
- queue_join ainda aceita nickname do cliente para auth players — Sessão 12 corrige
- Timing oracle no login ainda existe — Sessão 12 adiciona dummy bcrypt

---

## [2026-04-18] Sessão 12 — Integridade de Dados

**Status:** Completo
**Branch:** main

### Feito
- `server/db/database.js`: migração — `ALTER TABLE matches ADD COLUMN lp_change_white INTEGER DEFAULT 0` e `lp_change_black` (try/catch, seguro para DBs existentes)
- `server/server.js`: `_persistDB` — INSERT de matches agora inclui `lp_change_white` e `lp_change_black` (valores de `wLP.lpDelta` e `bLP.lpDelta`)
- `html/rank-ui.js`: `lpDelta` no match history usa `lp_change_white/black` com fallback para `mmr_change` (retrocompatível com partidas antigas)
- `server/server.js`: `queue_join` — query expandida para incluir `username`; nickname é sobrescrito com `rec.username` para auth players
- `server/server.js`: `queue_join` — avatar validado contra `Set(['K','Q','R','B','N','P'])`, default `'K'` se inválido
- `server/server.js`: `/match/:id/replay` — `JSON.parse(replay.turns_json)` envolvido em `try/catch`, retorna 500 gracioso
- `server/server.js`: `/auth/login` — dummy bcrypt (`_DUMMY_HASH`) executado quando email não encontrado para normalizar tempo de resposta
- `server/server.js`: CORS origin — `process.env.ALLOWED_ORIGIN || '*'` (configurável por env var)

### Notas para Sessão 13
- Replays expirados nunca deletados — Sessão 13 adiciona cleanup job
- `/health` endpoint pode ser melhorado com DB ping + room stats

---

## [2026-04-18] Sessão 13 — Manutenção e Limpeza

**Status:** Completo
**Branch:** main

### Feito
- `server/server.js`: `cleanExpiredReplays()` — DELETE FROM replays WHERE expires_at < datetime('now'), chamada na startup + setInterval 24h
- `server/server.js`: `scheduleRoomCleanup(roomId)` — substitui todos os 4 `setTimeout(() => rooms.delete(...), 60_000)` no código; além de deletar a sala, limpa entradas órfãs em `pendingReconnects` que apontam para aquela sala
- `server/server.js`: `/health` — expandido com DB ping (SELECT 1 FROM players) + `rooms.size` + `queue.length`; retorna 500 se DB falhar

---

## [2026-04-18] Sessão 14 — Integridade Competitiva + Perfil

**Status:** Completo
**Branch:** main

### Feito
- `server/server.js`: `stateView(state, color)` — mascara `planning[opponentColor]` enquanto oponente não confirmou; `broadcast()` agora envia view personalizada por cor
- `server/server.js`: `PATCH /auth/profile` — atualiza username no DB, valida USERNAME_RE, trata UNIQUE conflict, retorna novo token
- `server/server.js`: `DELETE /auth/account` — transação que deleta replays, matches e player; requer JWT válido
- `html/index.html`: `saveProfile` — reescrito para fazer `fetch PATCH /auth/profile` quando autenticado; atualiza Session + MenuPopulator; fallback para localStorage se guest
- `html/index.html`: botão "EXCLUIR CONTA" adicionado no screen-profile (visual discreto, abaixo de "SAIR DA CONTA")
- `html/index.html`: popup `#delete-account-confirm` com aviso de ação irreversível + botões EXCLUIR/CANCELAR
- `html/auth-frontend.js`: `window.confirmDeleteAccount`, `window.hideDeleteConfirm`, `window.doDeleteAccount` (fetch DELETE + Session.clear + AuthUI.show)

### Notas para Sessão 15
- PWA manifest.json + service worker + Helmet.js + Privacy Policy page

---

## [2026-04-18] Sessão 15 — Play Store Pré-Requisitos

**Status:** Completo
**Branch:** main

### Feito
- `server/package.json`: helmet instalado
- `server/server.js`: `require('helmet')` + `app.use(helmet({ contentSecurityPolicy: false }))` — ativa X-Frame-Options, HSTS, X-Content-Type-Options, Referrer-Policy automaticamente
- `server/server.js`: `GET /privacy-policy` — HTML inline com política de privacidade em PT completa
- `server/server.js`: `GET /.well-known/assetlinks.json` — retorna `[]` por padrão; preencher com env var `ASSET_LINKS` após gerar keystore do APK
- `html/manifest.json`: criado — name, short_name, start_url, display: standalone, orientation: portrait, theme_color: #d4a832, icons placeholders 192/512
- `html/sw.js`: criado — service worker com cache de shell + fallback offline; bypassa socket.io e endpoints de API
- `html/index.html`: `<meta name="theme-color">`, `<meta mobile-web-app-capable>`, `<link rel="manifest">` adicionados ao `<head>`
- `html/index.html`: registro do service worker (`navigator.serviceWorker.register('/sw.js')`) adicionado antes do `</body>`

### Dependências Manuais (fora do escopo do Claude Code)
- Criar ícones PNG: `html/icons/icon-192.png` e `html/icons/icon-512.png` (design do ícone do app)
- Após gerar keystore Android via Android Studio / bubblewrap: preencher `ASSET_LINKS` env var no Railway com o JSON do assetlinks
- Preencher Data Safety Form e IARC no Google Play Console
- Tirar screenshots do app para a Play Store listing

### Notas para Sessão 16
- Troca de senha (PATCH /auth/password)
- Loading states nas telas assíncronas
- Disconnect banner
- Fix botão Sair para WebView

---

## [2026-04-18] Sessão 16 — Qualidade UX + Password Change

**Status:** Completo
**Branch:** main

### Feito
- `server.js`: `PATCH /auth/password` — valida senha atual (bcrypt), exige mín. 6 chars, atualiza hash
- `index.html`: botão "ALTERAR SENHA" no screen-profile
- `index.html`: modal `#change-password-modal` (senha atual + nova + confirmar + erro inline)
- `index.html`: `window.quitGame()` — substituído `window.close()` por `showScreen('menu')` com hook Android.closeApp() para TWA
- `html/auth-frontend.js`: `showChangePassword`, `hideChangePassword`, `doChangePassword` (fetch PATCH /auth/password)
- `html/auth-frontend.js`: `showDisconnectBanner()` — banner vermelho fixo no topo
- `html/auth-frontend.js`: `socket.on('disconnect', showDisconnectBanner)` + `socket.on('connect', remove banner)`
- `html/rank-ui.js`: spinner dourado animado substituindo "Carregando..." em leaderboard e match-history
- `html/rank-ui.js`: `Leaderboard.load()` agora mostra a tela antes do fetch (com spinner imediato)

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para Sessão 17
- Sala privada com código de 4 caracteres (P-08)
- Novos eventos socket: `private_room_create`, `private_room_join`
- Nova tela `screen-private-room`

---

## [2026-04-18] Sessão 17 — Sala Privada com Código

**Status:** Completo
**Branch:** main

### Feito
- `server.js`: `privateRooms` Map + `PRIVATE_ROOM_MS = 5min`
- `server.js`: evento `private_room_create` — gera código 4 chars (charset sem ambíguos), timer expiry, valida ban, retorna `private_room_created`
- `server.js`: evento `private_room_join` — valida código, cria sala com cores aleatórias, emite `match_found` para ambos
- `server.js`: evento `private_room_cancel` — limpa sala do socket
- `server.js`: disconnect handler — limpa private rooms do socket desconectado
- `index.html`: tela `screen-private-room` — CRIAR SALA (mostra código + spinner aguardando) + ENTRAR COM CÓDIGO (input 4 chars) + VOLTAR
- `index.html`: botão "SALA PRIVADA" no menu principal (entre NOVO JOGO e RANKING)
- `index.html`: `window.privateRoom` — objeto com `open`, `cancel`, `create`, `join`, `copyCode`, `_onCreated`, `_onExpired`, `_onError`
- `index.html`: `socket.on('private_room_created/expired/error')` handlers
- `index.html`: `match_found` handler atualizado para popular e mostrar tela de matchmaking mesmo quando vindo da sala privada

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para próxima sessão
- Próximas sessões: polimentos P-A (localização), P-B (juicy combate), P-C (transições + UX info)
- P-07: badge "partida não ranqueada" quando Logado×Anônimo ainda pendente

---

## [2026-04-18] Sessão 18 — Hardening Final + P-07

**Status:** Completo
**Branch:** main

### Feito
- `server/db/schema.sql`: coluna `pw_version INTEGER DEFAULT 0` adicionada à tabela players
- `server/db/database.js`: migration `ALTER TABLE players ADD COLUMN pw_version INTEGER DEFAULT 0`
- `server/server.js`: helper `requireAuth()` — verifica token + pw_version (invalida tokens de antes da troca de senha)
- `server/server.js`: `PATCH /auth/profile` e `DELETE /auth/account` usam `requireAuth`
- `server/server.js`: login e register incluem `pv` no payload do JWT
- `server/server.js`: `PATCH /auth/password` — incrementa `pw_version`, retorna novo token com `pv` atualizado; rate limiter adicionado (V-04)
- `server/server.js`: startup warning `ALLOWED_ORIGIN` em produção (V-02)
- `server/server.js`: try/catch no `JSON.parse(ASSET_LINKS)` (V-03)
- `server/server.js`: `/player/:id` — campos sensíveis (`wo_count`, `elo_shield`, `ban_until`, `banned`) apenas quando `isSelf` (V-05)
- `server/server.js`: INSERT players grava `null` na coluna `email` legada em vez de `email_enc` (V-06)
- `server/server.js`: `match_found` inclui `isRanked` — false quando qualquer lado é guest (uid começa com `g_`)
- `html/auth-frontend.js`: `doChangePassword` salva novo token retornado pelo servidor
- `html/index.html`: badge "PARTIDA NÃO RANQUEADA" na tela de matchmaking (mm-found) e game-over quando `isRanked === false`

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para próxima sessão
- Iniciar polimentos: P-A (localização), P-B (juicy combate), P-C (transições + links)

---

## [REFERÊNCIA] Status final — Sessões 11, 12, 13 (Ciclo de Segurança)
Todas as 14 vulnerabilidades identificadas na revisão foram endereçadas:
- 8 críticas/altas: Sessão 11 ✅
- 6 médias/baixas: Sessões 12 e 13 ✅

---

## [2026-04-18] Segunda Revisão de Segurança + Avaliação Play Store

**Status:** Completo (análise e planejamento)
**Branch:** main

### Novos pontos encontrados

| # | Descrição | Severidade | Sessão |
|---|-----------|-----------|--------|
| 1 | `broadcast()` envia planning do oponente antes da revelação — vazamento competitivo via WebSocket | CRÍTICO | 14 |
| 2 | Nickname salvo apenas em localStorage — `saveProfile` não sincroniza com DB | ALTO | 14 |
| 3 | Sem exclusão de conta in-app — bloqueador obrigatório da Play Store | ALTO | 14 |
| 4 | JWT 30 dias sem revogação server-side — token roubado fica válido por 30 dias | ALTO | 15 |
| 5 | Sem security headers (Helmet.js) — X-Frame-Options, HSTS, CSP, X-Content-Type-Options | MÉDIO | 15 |
| 6 | Sem página de Privacy Policy — obrigatório para Play Store | MÉDIO | 15 |
| 7 | Sem PWA manifest — necessário para TWA (abordagem de publicação recomendada) | MÉDIO | 15 |
| 8 | `window.close()` não funciona em WebView Android | BAIXO | 16 |
| 9 | Sem loading states em telas assíncronas | BAIXO | 16 |
| 10 | Sem feedback visual de desconexão do servidor | BAIXO | 16 |
| 11 | Sem troca de senha | BAIXO | 16 |

### Bug Corrigido
- `server.js:658`: `const { uid, nickname, ... }` → `let { uid, nickname, ... }` — `nickname` era `const` e a Sessão 12 tentou reatribuí-la, derrubando o handler `queue_join` inteiro e impedindo qualquer partida de ser formada.

### Avaliação Play Store
- **Abordagem**: TWA (Trusted Web Activity) — mais econômica, sem reescrita nativa
- **Bloqueadores absolutos**: exclusão de conta (#3) e Privacy Policy (#6)
- **Bloqueadores técnicos**: manifest.json, assetlinks.json, ícones 192px e 512px
- **Distância estimada**: 3 sessões de implementação + criação manual de ícones e preenchimento de formulários no Play Console
- Sessões 14, 15 e 16 adicionadas ao SESSAO_POR_SESSAO_PLANNING.md
