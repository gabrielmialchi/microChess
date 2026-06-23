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
│   ├── index.html          ← Frontend completo (~6.000 linhas, monolítico)
│   ├── auth-frontend.js    ← Autenticação JWT frontend
│   ├── rank-ui.js          ← Perfil, histórico de partidas, leaderboard
│   └── replay-ui.js        ← Viewer de replay turno a turno
├── server/
│   ├── server.js           ← Backend Node.js + Socket.io
│   ├── movegen.js          ← Validação de movimentos (importado por server.js)
│   ├── auth.js             ← Lógica JWT e autenticação
│   ├── mmr.js              ← Cálculo de MMR/PdL
│   ├── replay.js           ← Gravação e recuperação de replays
│   ├── bot-strategies/     ← Estratégias dos bots por nível (NN-name.js + index.js)
│   ├── db/
│   │   ├── schema.sql      ← Schema do banco (com CHECK constraints)
│   │   └── microchess.db   ← SQLite (gerado em runtime)
│   ├── package.json        ← express + socket.io + better-sqlite3 + bcrypt + jsonwebtoken
│   └── node_modules/
└── docs/
    ├── PROJECT_CONTEXT.md  ← Este arquivo
    ├── SESSAO_POR_SESSAO_PLANNING.md
    ├── ACTIVITY_LOG.md
    ├── BACKLOG_SUGESTOES.md  ← pendências não-operacionais (OT-06, OT-23)
    └── TESTES.md           ← roteiro único de QA (P0→P3, passos embutidos)
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
| `auth-overlay` | Login/Registro | ✅ Existe | Porta de entrada, bloqueia tudo até autenticar |
| `ban-overlay` | Banimento | ✅ Existe | Mostra tempo restante de ban, bloqueia matchmaking |
| `screen-leaderboard` | Ranking | ✅ Existe | Top 50 jogadores por MMR |
| `screen-replay` | Replay Viewer | ✅ Existe | Reprodução turno a turno de uma partida |
| `screen-game-mode` | Modo de Jogo | ✅ Existe | 2 cards (SOLO / ONLINE) — entry point do NOVO JOGO. Reformulada em SP-4.1 |
| `screen-multiplayer-mode` | Modo Multiplayer | ✅ Existe | Sub-modos online (Casual / Ranqueada / Sala Privada) — extraída em SP-5.1 |
| `screen-solo-hub` | Hub Solo | ✅ Existe | Hub do Single Player: botão COMEÇAR/CONTINUAR + RESETAR TRAJETO + CTA convidado — SP-6.1 |
| `screen-sp-map` | Mapa SP | ✅ Existe | Mapa de 15 fases com estados (concluída/atual/trancada) + animação de unlock — SP-7.1 |

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

## Sistemas Implementados (v1.2.x — ciclo pós 1º Open Test)

Ver `docs/SESSAO_POR_SESSAO_PLANNING.md` para detalhes por sessão. Resumo:

| Sessão | Área | Status | O que entregou |
|--------|------|--------|----------------|
| S01 | Núcleo | ✅ | Gates rígidos do PRONTO (draft + position) |
| S31 | Núcleo | ✅ | Responsividade de input — render otimista no POSITION + juice |
| S04 | Núcleo | ✅ | Regra de captura esclarecida (não era bug, roteado para S27) |
| S14 | Núcleo | ✅ | Undo granular no Draft (devolver peça específica) |
| S02 | Resultado | ✅ | Taxonomia de resultado: win/draw_rule/draw_inactivity/cancelled |
| S03 | Resultado | ✅ | Pareamento ranked×ranked, casual×casual correto |
| S22 | Resultado | ✅ | V/D/E só em ranked; casual não afeta stats |
| S16 | Inatividade | ✅ | Detecção por clique (50s/60s), ABANDONAR manual, cancelamento pré-jogo |
| S10 | Inatividade | ✅ | Timer de fase visível no HUD com alerta <10s |
| S17 | Reconexão | ✅ | Janela 90s, reconnectToken em sessionStorage (inclusive convidados) |
| S18 | Reconexão | ✅ | Empate por dupla inatividade; cancelamento por dupla AFK no pré-jogo |
| S11 | HUD | ✅ | Nome do oponente no HUD durante toda a partida |
| S12 | HUD | ✅ | Feedback "PRONTO / aguardando oponente" |
| S13 | HUD | ✅ | Aviso Morte Súbita + tradução ptBR/EN |
| S09 | HUD | ✅ | Ícones V/D/E coloridos (game over, perfil, histórico) |
| S30 | HUD | ✅ | Juices J1–J11 finalizados |
| S19 | Telas | ✅ | Reorg menu + header + logout |
| S21 | Telas | ✅ | Histórico de partidas + replay viewer corrigido |
| S20 | Telas | ✅ | Tela ranking explicativa |
| S33 | Telas | ✅ | Quick wins: créditos, ranked-bloqueado p/ convidado, ptBR default |
| S25 | Retenção | ✅ | Bots L1–L3 suavizados |
| S26 | Retenção | ⏳ | Rebalance draft — REVERTIDO, aguardar playtest controlado |
| S27 | Retenção | ✅ | Tutorial scriptado completo (10 passos, overlay/spotlight, TUT engine) |
| S28 | Design | ✅ | Contorno das peças (text-shadow 8-direções) light+dark |
| S32 | Design | ✅ | Coesão visual menu↔partida (paleta quente unificada) |
| S29 | Design | ✅ | Tipografia: Inter + JetBrains Mono (Cinzel/IBM removidos) |

## Próximo — Backlog

- **OP-1**: Limpar banco de usuários (one-shot, só na véspera do próximo teste)
- **Sugestões não-operacionais** (OT-06 domínio do Peão, OT-23 boss no solo): ver `docs/BACKLOG_SUGESTOES.md`

> Ciclo pós-1º Open Test concluído: 24 dos 26 itens (OT-01..OT-26) implementados.
> Análise/alinhamento arquivado em `_arquivo/docs/POS_OPEN_TEST_1_DIRETRIZES.md`.

---

## Definições de Regras de Negócio

### WO (Walk Over)
Evento registrado no banco como `result = 'wo'`. Ocorre quando:
1. Jogador desconecta durante partida ativa (já implementado)
2. Jogador fica AFK na fase ACTION e não retorna (checagem silenciosa de reconexão → WO)

> ⚠️ **Revisado v1.2.x (15/06):** AFK em DRAFT/POSITION **não gera mais WO** — a partida é
> **cancelada** (`result = 'cancelled'`), ambos voltam ao lobby, com penalidade leve
> anti-abuso para quem ficou AFK. Spec em `_arquivo/docs/POS_OPEN_TEST_1_DIRETRIZES.md` §7 / sessão S16.

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

### AFK Timeout (revisado v1.2.x — ver `_arquivo/docs/POS_OPEN_TEST_1_DIRETRIZES.md` §7)
- ACTION phase: AFK + não retorna → WO para o ativo (após checagem silenciosa de reconexão)
- DRAFT/POSITION: ~50s sem clique → banner + countdown; não retornou → **partida `cancelled`**
  (ambos ao lobby; penalidade leve anti-abuso para quem ficou AFK). **Não é WO.**
- Gate rígido: PRONTO desabilitado no Draft (0 peças) e no Positioning (peças não posicionadas)
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

Eventos a ADICIONAR (ADJ-B / ADJ-C / ADJ-D):
```
player_inactive         → cliente informa 60s sem clique
player_returned         → jogador inativo voltou (clicou VOLTAR)
player_abandoned        → jogador inativo abandonou
return_prompt_response  → resposta ao prompt "RETORNAR AO JOGO?" (answer:'yes'|'no')
game_reconnect_token    → servidor envia token de reconexão para convidados
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
- **Fontes**: Inter (texto/títulos, pesos 400-800) + JetBrains Mono (números/labels) — Google Fonts
- **Paleta dark**: `--bg: #0b0907`, `--bg2: #16110b`, `--accent: #ff6a33`, cells marrons (`#2a231a`/`#4c3c28`)
- **Paleta light**: creme/laranja (design system `--mc-*` vars)

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

---

## Progresso das Sessões

Histórico completo arquivado em [`_arquivo/docs/PROJECT_CONTEXT_progresso.md`](../_arquivo/docs/PROJECT_CONTEXT_progresso.md).

**Concluído e mergeado:** ADJ-DESIGN (5 ajustes de game design) + POLISH + HTP-FIX (Como Jogar: bônus dinâmico do Rei).
**Em andamento / próximo:** ADJ-JUICE — feedback/juice de timing (planejado; ver `SESSAO_POR_SESSAO_PLANNING.md`).
