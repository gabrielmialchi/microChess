# microChess — Contexto do Projeto para Claude Code
## Leia este arquivo no início de cada sessão antes de qualquer implementação.

---

## O que é o microChess

Jogo de xadrez simplificado **4x4** para 2 jogadores online. Mecânicas únicas:
- **Fase DRAFT**: cada jogador tem 5 pontos para comprar peças (Q=5, R=4, N=3, B=2, P=1)
- **Fase POSITION**: posicionar peças no próprio território (white: linhas 0-1, black: linhas 2-3)
- **Fase REVEAL/ACTION**: movimentos são planejados simultaneamente e revelados ao mesmo tempo
- **Duels**: quando peças se encontram, rolam dados (1-6) + bônus da peça; quem tiver maior total vence
- **GAMEOVER**: quando um King é eliminado

---

## Arquitetura Atual

```
microChess/
├── html/
│   └── index.html          ← Frontend completo (~1.200 linhas, monolítico)
├── server/
│   ├── server.js           ← Backend Node.js + Socket.io (~544 linhas)
│   ├── package.json        ← express + socket.io
│   └── node_modules/
└── docs/
    ├── PROJECT_CONTEXT.md  ← Este arquivo
    ├── SESSAO_POR_SESSAO_PLANNING.md
    └── ACTIVITY_LOG.md
```

### Arquivos que NÃO devem ser reescritos
- `server/server.js` — lógica de jogo completa e validada. Apenas ADICIONAR código.
- `html/index.html` — frontend funcional. Apenas inserir `<div>` e `<script>` em pontos específicos.

---

## Telas Existentes no index.html

| ID | Nome | Status | Propósito |
|----|------|--------|-----------|
| `screen-menu` | Menu Principal | ✅ Existe | Logo, botões NOVO JOGO / COMO JOGAR / CRÉDITOS / CONFIGS / SAIR |
| `screen-matchmaking` | Matchmaking | ✅ Existe | 3 sub-estados: procurando / encontrado / countdown |
| `screen-how-to-play` | Como Jogar | ✅ Existe | Regras do jogo |
| `screen-credits` | Créditos | ✅ Existe | Gabriel Mialchi / o6 games |
| `screen-settings` | Configurações | ✅ Existe | Idioma + botão PERFIL |
| `screen-profile` | Perfil | ✅ Existe | Avatar, apelido, estatísticas (W/L/WO-W/WO-L) |
| `game-over-screen` | Fim de Jogo | ✅ Existe | Resultado + botões MENU / JOGAR NOVAMENTE |
| `game-area` | Jogo | ✅ Existe | Board 4x4, painel, botão PRONTO |
| `duel-modal` | Duelo | ✅ Existe | Modal de dados durante conflitos |
| `auth-overlay` | Login/Registro | ❌ A criar | Porta de entrada, bloqueia tudo até autenticar |
| `ban-overlay` | Banimento | ❌ A criar | Mostra tempo restante de ban, bloqueia matchmaking |
| `screen-leaderboard` | Ranking | ❌ A criar | Top 50 jogadores por MMR |
| `screen-replay` | Replay Viewer | ❌ A criar | Reprodução turno a turno de uma partida |

### IDs importantes no HTML existente que devem ser populados com dados do backend
```
#menu-player-name   ← nome do jogador
#menu-rank-badge    ← ex: "♞ Cavaleiro · 1482 MMR"
#menu-stat-w        ← vitórias
#menu-stat-l        ← derrotas
#menu-avatar-icon   ← ícone unicode da peça
#stat-wins          ← na tela de perfil
#stat-losses        ← na tela de perfil
#stat-wo-w          ← WOs ganhos (oponente desconectou)
#stat-wo-l          ← WOs perdidos (você desconectou)
#nick-input         ← campo de apelido (sync com backend)
```

---

## Sistemas a Implementar

### ✅ Já implementado no server.js
- Matchmaking por fila (Socket.io, in-memory)
- Lógica completa do jogo (DRAFT → POSITION → REVEAL → ACTION → GAMEOVER)
- Validação de movimentos server-side (`isValidMove`)
- WO básico por disconnect (`room.state.wo = true`)

### ❌ A implementar (ordem das sessões)

#### Sessão 1 — Database (SQLite)
- Tabelas: `players`, `matches`, `replays`
- Campos críticos: `ban_until`, `wo_count`, `wo_against_count`

#### Sessão 2 — Autenticação (JWT)
- Endpoints: POST /auth/register, POST /auth/login
- `queue_join` retrocompatível com e sem token

#### Sessão 3 — MMR + WO/Ban + AFK
- Cálculo ELO ao fim de cada partida
- Sistema de ban: 3 WOs → ban 30min, escalável
- Timer AFK: inatividade em ACTION phase → WO automático
- Endpoint: GET /leaderboard, GET /player/:id

#### Sessão 4 — Replay Recording
- Gravar estado do board + movimentos + dados em cada turno
- Salvar no banco ao fim da partida
- Endpoint: GET /match/:id/replay

#### Sessão 5 — Frontend Auth + Ban
- `html/auth-frontend.js`: overlay de login/registro, Session manager, MMR badge
- Overlay de ban com countdown
- Integração com `queue_join` (injetar token + mmr)
- Popular IDs do menu/perfil com dados do backend

#### Sessão 6 — Frontend Leaderboard + Replay Viewer
- `html/rank-ui.js`: leaderboard, profile expandido
- `html/replay-ui.js`: reprodução turno a turno com controles

#### Sessão 7 — Reorganização de Navegação + Header + Logout
- Menu: apenas NOVO JOGO / RANKING / CONFIGURAÇÕES
- Header do menu: avatar + apelido + rank + W/L (esquerda) + btn SAIR (direita)
- Configurações: adicionar COMO JOGAR e CRÉDITOS
- Popup de confirmação de logout (Sim/Não)
- Logout também disponível na tela de Perfil

#### Sessão 8 — Tela RANKING Explicativa + Leaderboard
- Nova tela `screen-ranking`: grid visual dos 14 ranks + explicação do PdL
- Botão LEADERBOARD GLOBAL na tela ranking → screen-leaderboard
- Back do leaderboard → screen-ranking

#### Sessão 9 — Histórico de Partidas (tela própria) + Replay melhorado
- Nova tela `screen-match-history`: lista separada do perfil
- Perfil: botão HISTÓRICO → screen-match-history
- Replay: header com resumo (oponente, rank, data, PdL delta)
- Back do replay → screen-match-history

#### Sessão 10 — Reconexão com tolerância de 60s
- Disconnect durante partida: aguarda 60s antes de WO
- `rejoin_game` event: restaura sala e socketId ao reconectar
- Frontend: countdown "aguardando reconexão" para o oponente
- Convidados: WO imediato (sem token, sem reconexão)

---

## Definições de Regras de Negócio

### WO (Walk Over)
Evento registrado no banco como `result = 'wo'`. Ocorre quando:
1. Jogador desconecta durante partida ativa (já implementado)
2. Jogador não submete ação em 45 segundos durante ACTION phase (a implementar)
3. Jogador não coloca ready em 120 segundos durante POSITION/DRAFT (a implementar)

Consequências:
- Oponente recebe vitória + MMR normal
- Jogador que causou WO: `wo_count++`, sem perda de MMR (não deve incentivar WO como estratégia)
- 3+ WOs em 24h → ban temporário

### Ban
| WOs em 24h | Duração do ban |
|-----------|---------------|
| 3 | 30 minutos |
| 5 | 2 horas |
| 7+ | 24 horas |

- `ban_until` = timestamp UTC; se `ban_until > now()`, bloquear `queue_join`
- Frontend: exibir ban overlay com countdown ao tentar entrar na fila

### Anti-cheat (server-side)
O servidor já valida moves. Adicional:
- Contar tentativas de move inválido por socket; 10+ em uma partida → log de suspeita
- Não desconectar automaticamente (pode ser bug de cliente), apenas logar
- Validar que o `uid` no token JWT bate com o `uid` que está na sala

### AFK Timeout
- ACTION phase: timer de 45s por turno. Se um jogador não enviou `action_ready` → auto-WO
- DRAFT/POSITION: timer de 120s. Se não enviou `draft_ready`/`position_ready` → auto-WO
- Timer cancelado ao receber o evento de ready
- Implementação: `setTimeout` por sala, armazenado em `room.timeouts`

### Replay System
Gravar a cada turno (ACTION resolution):
```json
{
  "turn": 1,
  "planning": { "white": {"pieceId":"wk1","tx":2,"ty":1}, "black": {"pieceId":"bk1","tx":1,"ty":2} },
  "duels": [
    { "wPiece": "wk1", "bPiece": "bk1", "rolls": {"white":4,"black":2}, "result": "white_wins" }
  ],
  "armyAfter": [{"id":"wk1","type":"K","x":2,"y":1,"color":"white","bonus":5}]
}
```
Salvo como JSON em `replays.turns_json` ao fim da partida.

---

## Fluxo do Socket.io (server.js) — Eventos Existentes

```
queue_join      → entra na fila de matchmaking
queue_cancel    → sai da fila
game_join       → entra na sala após match_found
draft_buy       → compra peça no DRAFT
draft_reset     → resetar inventário
draft_ready     → confirmar draft
position_place  → colocar peça no board
position_return → devolver peça ao inventário
position_ready  → confirmar posicionamento
action_plan     → planejar movimento
action_ready    → confirmar ação (dispara resolução quando ambos prontos)
roll_dice       → rolar dado no duel
duel_resolve    → finalizar duel (quando ambos rolaram)
disconnect      → sair (remove da fila; WO se em partida)
```

Eventos que serão ADICIONADOS:
```
(nenhum novo evento por enquanto — tudo via HTTP REST)
```

---

## Stack Tecnológica

### Backend (existente + a adicionar)
- **Node.js** ≥ 18
- **Express** — HTTP server
- **Socket.io** 4.7.4 — real-time
- **better-sqlite3** — banco de dados (a adicionar)
- **bcrypt** — hash de senhas (a adicionar)
- **jsonwebtoken** — tokens JWT (a adicionar)

### Frontend
- **Vanilla JavaScript** — sem frameworks
- **Socket.io client** 4.7.4 — CDN
- **Fontes**: Cinzel, Cinzel Decorative, IBM Plex Mono (Google Fonts)
- **Paleta**: `--bg: #080808`, `--accent: #d4a832`, `--success: #2ecc71`, `--danger: #e74c3c`

### Banco de Dados
- **SQLite** via better-sqlite3 (arquivo: `server/db/microchess.db`)

---

## Regras de Implementação (para Claude Code)

1. **Nunca reescrever** `server.js` ou `index.html` por completo — apenas inserir blocos
2. **Toda nova lógica frontend** vai em arquivos `.js` separados (auth-frontend.js, rank-ui.js, replay-ui.js)
3. **Toda nova lógica backend** vai em módulos separados (auth.js, mmr.js, replay.js)
4. **CSS novo** usa sempre inline style nos `<div>` que criar — não alterar o `<style>` existente
5. **Retrocompatibilidade**: o jogo deve continuar funcionando sem conta criada (modo "convidado" sem MMR)
6. **Verificar ACTIVITY_LOG.md** para status atual antes de implementar qualquer coisa

---

## Como Verificar o Projeto Atual

```bash
# Ver estado dos arquivos principais
wc -l server/server.js          # deve ser ~544
ls server/db/                   # deve existir após Sessão 1
ls html/auth-frontend.js        # deve existir após Sessão 5

# Rodar servidor
cd server && npm run dev
# Acessar: http://localhost:3000

# Verificar saúde
curl http://localhost:3000/health
```

---

## Progresso das Sessões

| Sessão | Tema | Status |
|--------|------|--------|
| 0 | Planejamento e organização | ✅ Completo |
| 1 | Database SQLite | ✅ Completo |
| 2 | Autenticação JWT | ✅ Completo |
| 3 | MMR + WO/Ban + AFK | ✅ Completo |
| 4 | Replay Recording | ✅ Completo |
| 5 | Frontend Auth + Ban | ✅ Completo |
| 6 | Frontend Leaderboard + Replay | ✅ Completo |
| P | Polimento: ELO visível, email seguro, logout | ✅ Completo |
| 7 | Reorganização navegação + header + logout | ✅ Completo |
| 8 | Tela RANKING explicativa + Leaderboard | ✅ Completo |
| 9 | Histórico separado + Replay melhorado | ✅ Completo |
| 10 | Reconexão 60s | ✅ Completo |
| R | Revisão de segurança — análise e plano | ✅ Completo |
| 11 | Segurança crítica: rate limit, XSS, transação, game integrity | ✅ Completo |
| 12 | Integridade de dados: LP delta, nickname, timing oracle | ✅ Completo |
| 13 | Manutenção: replay cleanup, health endpoint | ✅ Completo |
| R2 | 2ª revisão: planning leak + viabilidade Play Store | ✅ Completo |
| 14 | Integridade competitiva + exclusão de conta + sync nickname | ✅ Completo |
| 15 | Play Store pré-requisitos: PWA, manifest, Helmet, Privacy Policy | ✅ Completo |
| 16 | Qualidade UX: troca de senha, loading states, disconnect banner | ✅ Completo |
| 17 | Sala privada com código 4 chars | ✅ Completo |
| 18 | Hardening Final (V-01..V-06) + P-07 badge não ranqueada | ✅ Completo |
| P-A | Localização: varredura + tradução EN | ✅ Completo |
| P-B | Juicy combat timing + dice redesign | ⏳ Pendente |
| P-C | Links + transições de tela | ⏳ Pendente |
| P-D | Localização: 7 idiomas restantes (ES/DE/IT/RU/JA/KO/ZH) | ⏳ Pendente |
| P-E | Redesign de fontes: revisão tipográfica completa | ⏳ Pendente |
| P-F | Replay: tabuleiro fixo + Turno 0 (posicionamento) + label [N] formatado | ⏳ Pendente |

*(Atualizar este arquivo ao concluir cada sessão)*
