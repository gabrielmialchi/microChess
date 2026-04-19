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

---

## [2026-04-18] Sessão P-A — Localização: Varredura + Tradução EN

**Status:** Completo
**Branch:** main

### Feito
- ~60 chaves de tradução adicionadas a `T.pt` e `T.en` em `html/index.html`
- `window.t = t` exposto após definição da função `t()`
- IDs adicionados a todos os elementos traduzíveis:
  - ban-overlay: `ban-title`, `ban-reason`, `ban-time-label`, `ban-close-btn`
  - logout-confirm: `logout-title`, `logout-desc`, `logout-yes-btn`, `logout-no-btn`
  - delete-confirm: `delete-confirm-title`, `delete-confirm-desc`, `delete-cancel-btn`
  - change-password-modal: `cp-title`, `cp-cancel-btn`
  - reconnect-overlay: `reconnect-desc`, `reconnect-wo-auto`
  - screen-private-room: `pr-title`, `pr-code-label`, `btn-pr-copy-text`, `pr-expires`, `pr-or-divider`, `pr-join-label`, `btn-pr-join-text`, `pr-waiting-text`, `btn-pr-back`
  - screen-match-history: `mh-title`
  - screen-replay: `replay-title-el`, `replay-turn-label`
  - screen-ranking: `ranking-title`, `btn-leaderboard-global`, `ranking-how-title`, `ranking-desc-text`, `ranking-div-label`, `ranking-cards`
  - screen-leaderboard: `lb-title`
  - screen-profile: `btn-sign-out`, `btn-delete-account`, `btn-match-history`
- Ranking cards section substituída por `#ranking-cards` renderizado por JS
- Novas funções de refresh adicionadas: `refreshRankingScreen()`, `refreshOverlays()`, `refreshHistoryScreen()`, `refreshReplayScreen()`, `refreshPrivateRoomScreen()`
- `refreshProfileScreen()` atualizado com novos botões (alterar senha, sair, excluir, histórico, stats_label)
- `refreshSettingsScreen()` atualizado com botões COMO JOGAR, CRÉDITOS, VOLTAR
- `selectLanguage()` atualizado para chamar todos os refresh
- `showScreen()` atualizado para chamar refresh específico por tela + `refreshOverlays()` sempre
- `html/rank-ui.js`: strings hardcoded substituídas por `window.t` — `no_players_yet`, `no_matches_yet`, `match_result_win/loss/wo`
- `html/auth-frontend.js`: `no_connection`, `promotion_toast`, `demotion_toast` via `window.t`
- Strings hardcoded no IIFE privateRoom substituídas por chamadas `t()`
- Novas chaves: `room_expired`, `room_code_invalid`

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para próxima sessão
- Próxima sessão: P-C (Localização 7 idiomas restantes)

---

## [2026-04-19] Sessão P-C — Localização: 7 Idiomas Restantes

**Status:** Completo
**Branch:** main

### Feito
- ~60 chaves adicionadas a todos os 7 idiomas faltantes em `html/index.html`:
  - **ES** (espanhol) — tradução completa
  - **DE** (alemão) — tradução completa
  - **IT** (italiano) — tradução completa
  - **RU** (russo) — tradução completa
  - **JA** (japonês) — tradução completa
  - **KO** (coreano) — tradução completa
  - **ZH** (chinês simplificado) — tradução completa
- Chaves inseridas após `feedback` e antes de `htp_intro` em cada bloco `T.xx`
- Cobre: perfil, telas (history, replay, ranking, leaderboard), sala privada, ban, logout confirm, delete confirm, change password, reconnect overlay, dinâmicas (toasts, partida não ranqueada)
- Sintaxe JS validada (`new Function()` em todos os blocos `<script>`) — 0 erros

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para próxima sessão
- Próxima sessão: P-D (Replay: tabuleiro fixo + turno 0 + label de turno)
- P-B (links externos) suspensa até links reais serem definidos

---

## [2026-04-19] Sessão Design-A — Tokens CSS + Componentes Base

**Status:** Completo
**Branch:** main

### Feito
- Adicionado import de `Inter` + `JetBrains Mono` ao link Google Fonts existente (mesma tag, sem duplicar preconnect)
- Adicionado import de `flag-icons@7.0.0` via CDN jsdelivr
- Novo bloco `<style>` inserido antes do `<style>` existente contendo:
  - `:root` com ~70 tokens `--mc-*`: cores, tipografia, espaçamento, radius, sombras, motion, layout
  - `[data-theme="dark"]` com overrides completos para dark mode
  - Classes de componente: `.mc-screen`, `.mc-btn` (+ variantes: primary/accent/ghost/danger/sm/full/icon), `.mc-input`, `.mc-field`, `.mc-card`, `.mc-tag` (+ variantes), `.mc-dot`, `.mc-avatar` (+ variantes), `.mc-identity`, `.mc-stat`, `.mc-toast` (+ variantes), `.mc-modal-backdrop`, `.mc-modal`, `.mc-tabbar`, `.mc-topbar`, `.mc-board` (+ células e peças), `.mc-die`
- `<style>` existente intocado — zero variáveis removidas
- Sintaxe JS validada: 2 blocos OK, 0 falhas

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para próxima sessão
- Próxima sessão: Design-B (Menu principal + header + tab bar)

---

## [2026-04-18] Sessão Design-B — Menu Principal + Tab Bar

**Status:** Completo
**Branch:** main

### Feito
- `#screen-menu` redesenhado com tokens `--mc-*`:
  - Player row: `.mc-avatar` + nome + rank badge + W·L + botão logout (⏻)
  - Hero: `microChess.` com `<em>` laranja, subtítulo `id="menu-version-sub"`
  - Nav: 4 botões `.mc-btn` — Jogar ranqueada / Sala privada / Ranking / Configurações
  - Footer: link feedback estilizado com `var(--mc-faint)`
  - `btn-sair` mantido oculto (retrocompat)
- Modo convidado: `#menu-guest-cta` "Criar conta" em `var(--mc-accent)` (oculto quando logado)
- `#mc-tabbar` fixo (position:fixed) adicionado antes de `<script src="auth-frontend.js">`:
  - 4 abas: ⌂ Início · ▶ Jogar · ◆ Ranking · ○ Perfil
  - Usa classe `.mc-tabbar` + `.tab` do Design-A
- `refreshMenuScreen()` atualizado: detecta `Session.isValid()` e alterna entre `menu-logged-stats` e `menu-guest-cta`
- IDs preservados: `menu-avatar-icon`, `menu-player-name`, `menu-rank-badge`, `menu-stat-w`, `menu-stat-l`, `btn-logout-header`, `btn-novo-jogo`, `btn-sala-privada`, `btn-ranking`, `btn-configuracoes`, `btn-sair`, `footer-feedback`

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para próxima sessão
- Próxima sessão: Design-F (Auth overlay — tela cheia)

---

## [2026-04-19] Sessão Design-F — Auth Overlay (Tela Cheia)

**Status:** Completo
**Branch:** main

### Feito
- `html/index.html`: `#auth-overlay` redesenhado como tela cheia (não modal sobre escuro)
  - Fundo: `var(--mc-bg)` — consistente com Design-A/B
  - Logo: `micro<em>Chess</em>.` com accent color no "Chess"
  - Eyebrow mono + título bold 26px por modo (login/registro)
  - Campos com `<label>` visível + `<span id="*-hint">` para erro inline
  - CTA login: fundo `var(--mc-ink)` (escuro); CTA registro: fundo `var(--mc-accent)` (laranja)
  - Divider "ou" + botão ghost "Jogar sem conta" (apenas login)
  - `#auth-error` posicionado absolutamente no fundo do overlay (compartilhado entre modos)
  - Inputs com classe `.auth-fi` + novo `<style>` block para `:focus` e `.error` states
  - IDs preservados: `#login-email`, `#login-password`, `#reg-username`, `#reg-email`, `#reg-password`, `#auth-error`
- `html/auth-frontend.js`:
  - `AuthUI.show()` usa `display:block` (overlay é full-screen, não flex-centered)
  - `AuthUI.toggle()` chama `_clearErrors()` antes de trocar de modo
  - `AuthUI._clearErrors()` — limpa classes `.error` e hints de todos os campos + `#auth-error`
  - `AuthUI._fieldError(inputId, hintId, msg)` — aplica `.error` no input + mostra hint abaixo
  - `AuthUI.handleSubmit()` — validação client-side usa `_fieldError` por campo; erros de servidor vão para `#auth-error`

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para próxima sessão
- Próxima sessão: Design-C (Matchmaking + Sala privada)

---

## [2026-04-19] Sessão Design-C — Matchmaking + Sala Privada

**Status:** Completo
**Branch:** main

### Feito
- `html/index.html`: `#screen-matchmaking` redesenhado com tokens `--mc-*`:
  - Fundo `var(--mc-bg)`, layout flex column full-screen
  - Botão "← cancelar" com `.mm-back-bar` (CSS mantido, estilo atualizado via seletor novo)
  - Estado **Lobby**: radar animado (`.mc-mm-radar` + `::after` com `@keyframes mc-radar-ring`), ícone de peça em destaque accent, eyebrow mono, título "Na fila", nick/rank inline
  - Estado **Found**: label success "✓ PARTIDA ENCONTRADA", VS cards lado a lado com avatar/nick/rank de ambos os jogadores, tag "Ranqueada"
  - Estado **Countdown**: eyebrow + número grande `mm-countdown-num` com glow accent + sub texto
  - Adicionados `#mm-found-my-rank` e `#mm-found-opp-rank` nos VS cards
  - IDs mantidos: `btn-mm-cancel`, `mm-lobby`, `mm-found`, `mm-countdown`, `mm-my-avatar`, `mm-my-nick`, `mm-found-my-avatar`, `mm-found-my-nick`, `mm-found-opp-avatar`, `mm-found-opp-nick`, `mm-title-searching`, `mm-title-found`, `mm-countdown-sub`, `mm-count-num`, `mm-vs-label-you`, `mm-vs-label-opp`, `mm-vs-text`, `mm-searching-text`
- `html/index.html`: `#screen-private-room` redesenhado com tokens `--mc-*`:
  - Fundo `var(--mc-bg)`, header com botão ← e título "Sala Privada"
  - Seção CRIAR SALA: botão ghost → `pr-code-display` (código 40px mono accent + dot pulsante + expiração + COPIAR)
  - Divider "ou" com linhas
  - Seção ENTRAR COM CÓDIGO: input mono centralizado + botão accent ENTRAR + `pr-join-error`
  - IDs mantidos: `btn-pr-back`, `pr-title`, `pr-create-section`, `btn-pr-create`, `pr-code-display`, `pr-code-value`, `pr-code-label`, `btn-pr-copy`, `btn-pr-copy-text`, `pr-waiting`, `pr-waiting-text`, `pr-expires`, `pr-or-divider`, `pr-join-section`, `pr-join-label`, `pr-join-input`, `btn-pr-join`, `btn-pr-join-text`, `pr-join-error`
  - `@keyframes mc-dot-wait` para animação do dot de espera
- `html/index.html`: novo `<script>` que envolve `window.goMatchmaking` para popular `mm-found-my-rank` e `mm-my-nick` com rank do Session; MutationObserver em `mm-found-opp-nick` para popular `mm-found-opp-rank` ao detectar mudança

### Bugs / Bloqueios Conhecidos
- `opponentProfile.rank` vazio se o servidor não enviar campo `rank` no `oppProfile` — elemento `mm-found-opp-rank` ficará em branco (aceitável por ora)

### Notas para próxima sessão
- Próxima sessão: Design-D (Telas de partida: Draft · Posição · Revelação · Ação)

---

## [2026-04-19] Sessão Design-D — Telas de Partida (Draft · Posição · Revelação · Ação)

**Status:** Completo
**Branch:** main

### Feito
- [x] 1. Redesenhar `#game-area`: novo topbar grid(1fr auto 1fr), 52px, border-bottom
  - `.opp` com `#opp-dot` (dot 8px), `#opp-status`, `#opp-meta`
  - `#phase-title` como pill (mono, accent, rounded)
  - `#opp-pts` como timer (alinhado à direita)
- [x] 2. Barra de etapas (DRAFT · POSIÇÃO · AÇÃO) não existia no HTML — nenhuma remoção necessária
- [x] 3. Inventário do Draft redesenhado: `.inv-header` com label `#inv-label` + `#btn-reset-draft`
  - Label usa `t('draft_return_hint')` via `updateUI()`
  - Botão usa `t('draft_clear')` via `updateUI()`
- [x] 4. Chaves i18n adicionadas: `draft_return_hint`, `draft_clear` em PT e EN
- [x] 5. Aura das peças: override de `--white-glow` (laranja `rgba(245,98,0,0.8)`) e `--black-glow` (violeta `rgba(69,56,255,0.8)`) + override de `--mc-fx-glow-w` e `--mc-fx-glow-b` para `.mc-board .cell .p-w/.p-b`
- [x] 6. Células `own-zone` no POSITION: `color-mix` com `--cell-light`/`--cell-dark` + accent 18%; classe adicionada em `syncBoard()` quando `state.phase === 'POSITION' && logicalY < 2`
- [x] 7. Validação JS: 3 script blocks — 0 falhas

### Arquivos alterados
- `html/index.html`: novo `<style>` antes de `<!-- GAME AREA -->`, HTML de `#game-area` substituído, 2 linhas em `T.pt` e `T.en`, 4 linhas em `syncBoard()` e `updateUI()`

### Bugs / Bloqueios Conhecidos
- `opp-meta` (sub-texto do oponente) é atualizado apenas via `id` — o JS existente só usa `#opp-status`. O `#opp-meta` fica "aguardando…" a menos que futuras sessões adicionem atualização
- `opp-dot.thinking` requer que o JS chame `document.getElementById('opp-dot').classList.toggle('thinking', ...)` — não implementado nesta sessão

### Notas para próxima sessão
- Próxima sessão: Design-E (Duelo + Game Over + Empate)

---

## [2026-04-19] Sessão Design-E — Duelo + Game Over + Empate

**Status:** Completo
**Branch:** main

### Feito
- [x] 1. `#duel-modal` redesenhado com layout horizontal: dois `.duel-col` + `.duel-vs-sep` "VS" no meio
  - `#duel-status` → pill (mono, danger-soft bg, danger color)
  - `.duel-card` com tema claro (mc-surface, mc-rule border)
  - Badges de nome: laranja para brancas, azul-violeta para pretas
  - `.dice-interactive` com borda colorida por tema
  - `#close-duel` com `mc-accent` bg
  - Fundo `#duel-modal` → `mc-bg` (claro), sem fundo diagonal
- [x] 2. `#game-over-screen` redesenhado: `.gameover` com peça grande `#go-piece-icon`, `.verdict`, `#game-over-result`, `.go-mmr`, `.go-actions`
  - Fundo → `mc-bg` claro; sem linhas diagonais
  - Botões usam `.go-btn.ghost` e `.go-btn.accent`
  - Todos os IDs JS mantidos: `go-title`, `game-over-result`, `btn-go-menu`, `btn-go-again`
- [x] 3. Estado de Empate: `#go-piece-icon` mostra ♔ + ♚ lado a lado (ambas com aura); `#go-pdl-delta` exibe `t('pdl_draw')` = "= 0 PdL"
- [x] 4. Morte Súbita: `statusEl.classList.toggle('sudden-death')` ativa animação CSS de pulso vermelho; `statusEl.style.color` limpo (CSS cuida das cores)
- [x] 5. i18n: `pdl_draw` adicionado em PT ("= 0 PdL") e EN ("= 0 LP")
- [x] 6. Validação JS: 3 script blocks — 0 falhas

### Arquivos alterados
- `html/index.html`: novo `<style>` antes de `<!-- DUEL MODAL -->`, `#game-over-screen` HTML substituído, `#duel-modal` HTML atualizado, `renderDuelContent()` refatorado, bloco GAMEOVER em `updateUI()` expandido, 2 chaves i18n em T.pt/T.en

### Bugs / Bloqueios Conhecidos
- `#go-pdl-now` (rank do jogador após partida) populado via `Session.get()` — só funciona se usuário estiver logado
- `#go-pdl-delta` permanece vazio para vitória/derrota até que o servidor emita evento com delta PdL (P-12 / sessão futura)

### Notas para próxima sessão
- Próxima sessão: Design-G (Modais de sistema: ban, logout, delete, change-pw, reconnect)

---

## [2026-04-19] Sessão Design-G — Modais de Sistema

**Status:** Completo
**Branch:** main

### Feito
- [x] 1–5. Todos os 5 modais redesenhados com padrão unificado:
  - `#ban-overlay` → warn border, ⏸ icon, eyebrow "Acesso restrito", timer + botão FECHAR
  - `#logout-confirm` → simples, "Sair da conta?", row Cancelar / Sair (primary)
  - `#delete-account-confirm` → danger border, eyebrow "Ação permanente", row Cancelar / Excluir (danger)
  - `#change-password-modal` → eyebrow "Segurança", 3 campos `.mc-field`/`.mc-input`, `#cp-error`, row Cancelar / Salvar
  - `#reconnect-overlay` → `.sysmodal-ring` com spinner warn, timer grande, sub-texto W.O.
- [x] 6. Padrão: backdrop `rgba(245,243,238,0.88)` + `backdrop-filter:blur(10px)` + card `.sysmodal` centralizado
- [x] 7. Todos os IDs e onclick mantidos (verificado via script de check — 0 ausentes)
- [x] Validação JS: 3 script blocks — 0 falhas

### Arquivos alterados
- `html/index.html`: bloco `<style>` com sistema `.sysmodal-*`, HTML dos 5 modais substituído

### Bugs / Bloqueios Conhecidos
- `#ban-title` e `#ban-time-label` não mais usados separadamente (i18n via JS define `ban-title`; timer label integrado ao eyebrow). Se o JS atualizar `ban-title` via i18n, funciona; se não, mostra texto fixo PT.
- `backdrop-filter:blur()` não funciona em Safari < 15.4 sem `-webkit-backdrop-filter` — adicionado prefix.

### Notas para próxima sessão
- Próxima sessão: Design-H (Perfil + Editar avatar/apelido)

---

## [2026-04-19] Sessão Design-H — Perfil + Editar

**Status:** Completo
**Branch:** main

### Feito
- [x] 1. Redesenhado `#screen-profile`: topbar sticky (← · PERFIL · SALVAR), hero (avatar-xl + nome + rank + PdL), stats grid 2×2 + empates, winrate bar, avatar picker 2 fileiras, apelido input, ações
- [x] 2. Stat "Empates" (`#stat-draws`) adicionado na grid (span 2 colunas)
- [x] 3. `#avatar-grid` substituído por picker com 2 fileiras — Brancas (♔♕♖♗♘♙) e Pretas (♚♛♜♝♞♟), `data-piece` lowercase para pretas
- [x] 4. Botão SALVAR movido para topbar direito (`.ph-save-btn`), removido do fundo
- [x] 5. Convidado: card CTA "Criar conta" visível; `#ph-stats-section` oculto para guests
- [x] 6. Chaves i18n adicionadas em todos os 9 idiomas: `draws`, `avatar_white`, `avatar_black`, `create_account`, `create_account_cta`
- [x] 7. ELO visível = apenas nome do rank (`ph-elo-name`); nunca exibe número MMR bruto
- [x] `PIECE_ICONS` expandido: + `k q r b n p` (peças pretas)
- [x] `PIECE_MAP` em auth-frontend.js expandido: + peças pretas
- [x] `selectAvatar()` atualiza `#ph-avatar-display` (cor de fundo branco/preto + ícone)
- [x] `refreshProfileScreen()` reescrito: hero, winrate, guest/logged-in, draws, i18n completo
- [x] `MenuPopulator.populate()` atualiza `ph-elo-name`, `ph-pdl-val`, `stat-draws`
- [x] Validação JS: 3 script blocks — 0 falhas; todos 24 IDs presentes

### Arquivos alterados
- `html/index.html`: bloco `<style>` com 38 classes `.ph-*`, HTML de `#screen-profile` substituído, `PIECE_ICONS` expandido, `selectAvatar` e `refreshProfileScreen` atualizados, i18n 9 idiomas
- `html/auth-frontend.js`: `PIECE_MAP` expandido, `MenuPopulator.populate` atualizado com draws + hero

### Bugs / Bloqueios Conhecidos
- Servidor precisa retornar `p.draws` no endpoint `GET /player/:id` para o contador de empates funcionar corretamente (campo já existe se DB foi atualizado em sessões anteriores)

### Notas para próxima sessão
- Próxima sessão: Design-I (Ranking + Leaderboard)

---

## [2026-04-19] Sessão Design-I — Ranking + Leaderboard

**Status:** Completo
**Branch:** main

### Feito
- [x] 1. Redesenhado `#screen-ranking`: escada vertical dos 14 ranks (`.rk-group`/`.rk-row`/`.rk-piece`) com posição atual destacada (borda laranja + barra PdL + badge "Você · N PdL")
- [x] 2. Redesenhado `#screen-leaderboard`: linhas compactas (`.lb-r`) com posição · avatar · nome+rank · W/L
- [x] 3. Podium via classe CSS (`.rc-pos.gold/silver/bronze`) — ouro=#c18200, prata=#7a8a9a, bronze=#8a5a2a
- [x] 4. Linha "você" (`#lb-you-strip`) fixada abaixo da tabela scrollável; mostra posição e PdL do próprio jogador
- [x] 5. ELO = nome do rank apenas — `elo.name` sem MMR número
- [x] 6. PdL exibido só para o dono: no strip e na linha "you"; demais jogadores veem só o nome do rank
- [x] `_ELO_LADDER` array de 14 entradas definido no frontend, espelhando `server/elo.js RANKS`
- [x] `refreshRankingScreen()` reescrito: gera ladder HTML com grupos e divisões, destaca posição do jogador via `mc_elo_rank`/`mc_elo_lp` no localStorage
- [x] `Leaderboard.render()` em rank-ui.js reescrito: novo estilo light, podium, you-strip
- [x] `MenuPopulator.populate()` salva `mc_elo_rank` e `mc_elo_lp` no localStorage ao buscar `/player/:id`
- [x] Validação JS: 3 script blocks + rank-ui.js + auth-frontend.js — 0 falhas; 11 IDs presentes

### Arquivos alterados
- `html/index.html`: bloco `<style>` com 35 classes `.rk-*` e `.lb-*`, HTML de `#screen-ranking` e `#screen-leaderboard` substituídos, `_ELO_LADDER` e `refreshRankingScreen()` reescritos
- `html/rank-ui.js`: `Leaderboard.render()` reescrito com novo estilo e you-strip
- `html/auth-frontend.js`: `MenuPopulator.populate()` salva `mc_elo_rank`/`mc_elo_lp`

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para próxima sessão
- Próxima sessão: Design-J (Histórico + Replay)

## [2026-04-19] Sessão Design-J — Histórico + Replay

**Status:** Completo
**Branch:** main

### Feito
- `server/server.js`: adicionado `recordTurn(..., { type:'position' })` no handler `position_ready` — Turno 0 agora gravado no replay
- `html/index.html`: bloco CSS para `#screen-match-history` e `#screen-replay` (`.mh-*`, `.rp-*` classes com tokens `--mc-*`)
- `html/index.html`: nova tela `#screen-match-history` com topbar + lista `#match-history-list`
- `html/index.html`: nova tela `#screen-replay` com header de resumo, board 4×4, banner de duelo, controles
- `html/index.html`: i18n `turn_positioning` adicionado em todos os 9 idiomas
- `html/rank-ui.js`: `MatchHistory.render()` reescrito com classes light-theme (`.mh-result.win/lose/draw/wo`, `.mh-pdl.up/dn/eq`)
- `html/replay-ui.js`: `ReplayViewer` completamente reescrito:
  - `_displayTurns()`: inclui type='position' (turno 0) + type='action'
  - `open()`: popula `#rp-match-res`, `#rp-match-opp`, `#rp-match-pdl` a partir de `_meta`
  - `renderTurn()`: board com `.rp-cell`/`.rp-piece.pw/.pb`, labels `#rp-turn-label`/`#rp-turn-count`, banner de duelo `.rp-duel-banner.visible`
  - Formato duel: "♘ Cavalo venceu ♛ Rainha · 7 (5+2) × 6 (2+4)"
  - `play()`: toggle `.rp-ctrl.playing` no botão de auto-play

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para próxima sessão
- Próxima sessão: Design-K (Configurações + Como Jogar + Créditos + links externos P-B)

## [2026-04-19] Sessão Design-K — Configurações + Como Jogar + Créditos

**Status:** Completo (exceto URLs reais — pendente confirmação do usuário)
**Branch:** main

### Feito
- `html/index.html`: bloco CSS Design-K (`.dk-*` classes com tokens `--mc-*`)
- `html/index.html`: i18n — 4 novas chaves (`appearance`, `info`, `dark_theme`, `htp_bonus_title`) em todos os 9 idiomas
- `html/index.html`: `#screen-settings` completamente redesenhado:
  - `rk-topbar` com ← de volta ao menu
  - Grid 3×3 de idiomas com `fi fi-xx fis` (flag-icons CSS, sem emoji)
  - Toggle de tema escuro (`.dk-toggle`) com estado salvo em localStorage
  - Action-rows para Perfil / Como Jogar / Créditos
- `html/index.html`: `#screen-how-to-play` redesenhado:
  - `rk-topbar` com ← de volta a configurações
  - 4 cards numerados (1–4) usando fases existentes do i18n
  - Tabela de bônus com valores corretos do servidor (Q+5, R+4, N+3, B+2, P+1, K+5)
  - Nota de objetivo reutilizando `htp_intro`
- `html/index.html`: `#screen-credits` redesenhado:
  - `rk-topbar` com ← de volta a configurações
  - Layout centrado com logo, versão, nome, estúdio, links
  - Botão de feedback (mantém `href="#"` até URLs confirmadas)
- `html/index.html`: `refreshSettingsScreen()` atualizado para novos IDs + sync do toggle
- `html/index.html`: `renderHowToPlay()` reescrito com cards + tabela de bônus usando `CONFIG`
- `html/index.html`: `window.toggleDarkTheme()` implementado + init de tema ao carregar

### Bugs / Bloqueios Conhecidos
- URLs reais (portfolio, site, instagram, itch.io, feedback) ainda com `href="#"` — aguardando confirmação do usuário

### Notas para próxima sessão
- Próxima sessão: Design-L (Estados de exceção: disconnect, AFK, Morte Súbita, sem conexão)
- ⚠️ DEPENDÊNCIA P-B: confirmar URLs com o usuário antes de inserir

## [2026-04-19] Sessão Design-L — Estados de Exceção

**Status:** Completo
**Branch:** main

### O que foi feito

#### CSS + HTML (index.html)
- Bloco `<style>` com classes `.exc-banner`, `.exc-danger`, `.exc-warn`, `.exc-info`, `.exc-timer`, `.exc-pulse`, `.exc-blur-panel`
- `#phase-title.sd-phase` — pílula vermelha pulsando durante Morte Súbita
- `#pr-join-input.exc-err` — borda vermelha no input de código de sala privada
- `#exc-no-conn` — tela cheia "Sem conexão" com botão retry
- `#exc-leave-overlay` — sheet confirmação de W.O. ao sair durante partida
- `#exc-reconn-banner` — banner âmbar fixo no topo "Reconectando…"
- `#opp-dc-banner` (`.exc-danger`) — strip abaixo do topbar com countdown de reconexão do oponente
- `#afk-banner` (`.exc-warn`) — strip âmbar com timer pulsando para AFK warning
- `#sudden-death-banner` (`.exc-info`) — strip informativo durante Morte Súbita

#### JS (index.html — script block Design-L)
- `window.ExcBanners` — API centralizada: `showOppDc`, `hideOppDc`, `showAfk`, `hideAfk`, `showSuddenDeath`, `hideSuddenDeath`, `hideAll`
- `window.showLeaveConfirm` / `hideLeaveConfirm` / `confirmLeave`
- AFK tracker client-side: 45s countdown em ACTION phase; mostra banner quando ≤15s; para quando `ready[myColor]` = true
- `window.quitGame` atualizado: exibe `#exc-leave-overlay` se `#game-area` estiver visível
- `window.returnToMenu` atualizado: chama `ExcBanners.hideAll()`
- `renderDuelContent` atualizado: sync de `showSuddenDeath` / `hideSuddenDeath` com o modal

#### auth-frontend.js
- `showDisconnectBanner()` reescrita: usa `#exc-reconn-banner` + `#exc-no-conn` (se não inGame) + `.exc-blur-panel` (se inGame)
- `socket.on('connect')` atualizado: remove todos os novos elementos + remove blur
- `ReconnectOverlay.show()`: usa `window.ExcBanners.showOppDc(remainMs)` em vez do modal bloqueante; fallback mantido
- `ReconnectOverlay.hide()`: chama `ExcBanners.hideOppDc()` além do modal

#### Sala privada
- `_onError()`: adiciona `.exc-err` ao input + remove na próxima digitação via `{ once: true }`

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para próxima sessão
- Próximas sessões planejadas: **P-12** (balanceamento MMR empate) + **P-B** (URLs reais créditos)
- ⚠️ DEPENDÊNCIA P-B: URLs reais ainda ausentes nos links de créditos (`#crd-portfolio`, `#crd-site`, `#crd-insta`, `#crd-itch`, `#crd-feedback-btn`)
- **Sessões restantes: 2** (P-12 técnico + P-B rápido de URLs)

## [2026-04-19] Sessão P-12 — Balanceamento MMR Empate + Fix Morte Súbita

**Status:** Completo
**Branch:** main

### O que foi feito

#### Bug fix — Morte Súbita incorreta (server/server.js)
- Removido `suddenDeath: true` do Case f (linha ~554): duelo frontal entre duas peças de mesmo bônus que ambas atacam o Rei do oponente. **Morte Súbita não é essa situação** — é apenas quando os dois Reis são as últimas peças.
- O `suddenDeath: true` permanece correto nos casos `checkFinalDuel` (linhas 643–649, 747–752)

#### P-12 — Draw MMR (server/mmr.js + server/server.js)
- `mmr.js`: adicionada função `calculateDraw(mmrA, mmrB)` — ELO padrão com score=0.5: `delta = K × (0.5 − expected)`. Floor de +1 para o jogador mais fraco quando o arredondamento produziria 0.
- Exportada junto com `calculate` e `getRank`
- `server.js`: importado `calculateDraw`
- `_persistDB`: caso `draw` agora chama `calculateDraw` em vez de manter `wDelta=bDelta=0`
- `_persistDB`: queries UPDATE adicionam `draws=draws+?` (coluna já existia no schema, nunca havia sido incrementada)
- `finishDuel`: tie handling refatorado — King vs King tie agora dispara `persistMatchResult(room, 'draw', false)` + `phase = 'GAMEOVER'` em vez de eliminar o Rei preto por padrão

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para próxima sessão
- Próxima (e última) sessão planejada: **P-B** — inserir URLs reais nos links de créditos
- ⚠️ DEPENDÊNCIA P-B: confirmar URLs com usuário
- **Sessões restantes: 1** (P-B — rápido, só substituição de URLs)

---

## [2026-04-19] Sessão P-12B — PdL Empate + SD-1 Announce (Morte Súbita)

**Status:** Completo
**Branch:** main

### O que foi feito

#### P-12B — PdL em caso de empate (server/server.js)
- `_persistDB` draw case: MMR calculado por `calculateDraw` (padrão ELO) — sem mudança
- PdL calculado separadamente: jogador mais forte recebe 0 PdL, jogador mais fraco recebe `max(0, delta)` PdL
- Introduzidas variáveis `wLpInput` / `bLpInput` para separar lógica de PdL do MMR no draw

#### SD-1 — Fase SUDDEN_DEATH e overlay de anúncio (server.js + index.html)
**server/server.js:**
- `resolveAction` → `checkFinalDuel`: quando apenas dois Reis restam, define `phase = 'SUDDEN_DEATH'` e retorna cedo (sem criar duel imediatamente)
- `action_ready` handler: após `resolveAction`, detecta `phase === 'SUDDEN_DEATH'` e agenda `setTimeout(3000)` que cria o duel King vs King com `suddenDeath: true` e faz `broadcast`
- `finishDuel` → `checkFinalDuel`: mesmo padrão — fase SUDDEN_DEATH + broadcast + setTimeout 3s
- `finishDuel` tie (King vs King empate de dados): chama `persistMatchResult(room, 'draw', false)` + `phase = 'GAMEOVER'`

**html/index.html:**
- Adicionado `#sd-overlay` (div fullscreen, `z-index:2500`, fundo `rgba(0,0,0,0.97)`) com ícones ♔ VS ♚, título "MORTE SÚBITA" em vermelho pulsante, subtítulo i18n
- `PHASE_LABELS` atualizado: `SUDDEN_DEATH` incluído com label e sub
- `handlePhaseChange`: chama `triggerSuddenDeathOverlay()` quando phase === 'SUDDEN_DEATH'; oculta overlay em outras fases
- `triggerSuddenDeathOverlay()`: popula `#sd-sub` com texto i18n, exibe overlay, auto-oculta após 3s (sincronizado com servidor)
- `updateUI`: `SUDDEN_DEATH` mapeado no `phaseMap`; desabilita `#btn-ready` durante essa fase; oculta `#sd-overlay` quando `duel.active && duel.suddenDeath`
- `handleCellClick`: bloqueia input durante `SUDDEN_DEATH`
- `window.returnToMenu`: oculta `#sd-overlay` explicitamente ao voltar ao menu
- `renderDuelContent`: sincroniza ocultação do `#sudden-death-banner` ao entrar no duel de Morte Súbita
- Chave `sd_subtitle` adicionada a todos os 9 idiomas (PT/EN/ES/DE/IT/RU/JA/KO/ZH)

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para próxima sessão
- ⚠️ DEPENDÊNCIA P-B: confirmar URLs reais dos links de créditos com usuário
- **Sessões restantes: 1** (P-B — só substituição de URLs)

---

## [2026-04-19] Sessão OPT-A — Ganhos Rápidos (Twemoji + Fontes + GZIP)


**Status:** Completo
**Branch:** main

### O que foi feito

#### Removido Twemoji (~1.7MB)
- `html/index.html`: removida tag `<script src="twemoji@14.0.2...">` do `<head>`
- Confirmado antes: zero usos de `twemoji.*` em todo o código

#### Reduzidos pesos de fonte (Google Fonts URL)
- Cinzel: `400;600;700;900` → `400;700`
- Inter: `300;400;500;600;700;800` → `400;600`
- JetBrains Mono: `400;500;600;700` → `400;600`
- Cinzel Decorative, IBM Plex Mono: sem alteração (já mínimos)

#### Ativado GZIP no Express
- `server/server.js`: `require('compression')` + `app.use(compression())` antes do `helmet`
- `npm install compression` — adicionado ao `package.json`

### Impacto esperado
- Remoção Twemoji: ~1.7MB eliminados do carregamento inicial
- GZIP: `index.html` ~180kb → ~40kb; `auth-frontend.js` ~18kb → ~5kb

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para próxima sessão
- Próxima: **OPT-B** — animação de peças transform vs left/top (risco médio-alto)

---

## [2026-04-19] Sessão P-12 (items 5-6) — Game-Over PdL delta real

**Status:** Completo
**Branch:** main

### O que foi feito

- `html/auth-frontend.js`: adicionada função `_updateGameOverPdl(lpDelta, elo)` que, quando o evento `mmr_update` chega enquanto `#game-over-screen` está visível, popula:
  - `#go-pdl-delta` com `+N PdL` / `-N PdL` / `±0 PdL` e classes `.delta.up` / `.delta.dn` / `.delta.eq`
  - `#go-pdl-now` com `{icon} {name} · {lp} PdL` (estado pós-partida)
- `mmr_update` handler: chama `_updateGameOverPdl` imediatamente após `showMMRToast`
- `html/index.html` `launchGame()`: reseta `#go-pdl-delta` e `#go-pdl-now` ao iniciar nova partida (evita valores residuais)

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para próxima sessão
- ⚠️ DEPENDÊNCIA P-B: confirmar URLs reais dos links de créditos com usuário
- **Sessões restantes: 1** (P-B — só substituição de URLs)

---

## [2026-04-19] Correções de bugs pós-redesign

**Status:** Completo
**Branch:** main

### Feito

#### Bug crítico — Auth (server/server.js)
- `POST /auth/register` retornava 500: coluna `email TEXT NOT NULL` recebia `null` (regressão da Sessão 18 V-06)
- Fix: INSERT agora passa `email_enc` na coluna legada `email`

#### Bug crítico — Jogo voltava ao menu após GO (html/index.html)
- `#screen-menu` tinha `style="display:flex"` inline (Design-B) — sobrepõe `.screen { display:none }` via CSS
- Menu permanecia visível (z-index 4000) bloqueando o game-area (z-index 1)
- Fix: `display:flex` removido do inline; layout movido para regra CSS `#screen-menu`

#### Bug de UX — Tab bar sobrepunha o jogo (html/index.html)
- `#mc-tabbar` tem `z-index:90`, `#game-area` tem `z-index:1` — tabbar visível durante partida
- Fix: `launchGame()` esconde o tabbar; `returnToMenu()` restaura

#### Bug de ambiente — npm run dev não carregava .env (server/package.json)
- Script `dev` não passava `--env-file=.env`; `auth.js` faz `process.exit(1)` se JWT_SECRET ausente
- Fix: script atualizado para `node --env-file=.env --watch server.js`

### Gaps conhecidos (não bloqueadores)
- `#opp-dot.thinking` e `#opp-meta` não atualizados em tempo real (Design-D — low priority)
- URLs reais nos créditos ainda `href="#"` (P-B — requer confirmação do usuário)
- `p.draws` precisa ser retornado pelo servidor para o stat de empates no perfil
