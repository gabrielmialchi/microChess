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

## Sistemas Implementados

Todos os sistemas do plano original (sessões 1–18, Design-A..L, SP, PRE-OT-A..G, etc.) estão ✅ concluídos.

## Próximo Ciclo — Ajustes Pós-Open Test

Ver `docs/SESSAO_POR_SESSAO_PLANNING.md` para o plano detalhado de cada sessão.

### ⏳ ADJ-A — Quick wins (independente)
- **BLOCO A**: Ranked desabilitado para convidados — botão bloqueado visualmente no frontend
- **BLOCO B**: Deletar todos os usuários cadastrados (sqlite, one-shot)
- **BLOCO F**: Atualizar tela de Créditos — nova estrutura "Desenvolvido por / O6 GAMES · Desenvolvimento de Projeto por / Gabriel Mialchi", remover Portfólio e Itch.io

### ⏳ ADJ-B — Sistema de Inatividade (substituição completa)
Substitui o sistema AFK baseado em fase por detecção de clique do usuário:
- 50s sem clicar → banner de aviso com countdown 10s
- 60s sem clicar → `player_inactive` emitido; popup "INATIVO POR MAIS DE 60 SEGUNDOS" com VOLTAR(90s) e ABANDONAR
- Oponente vê: "OPONENTE INATIVO, AGUARDANDO AÇÃO"
- Ao retornar: oponente tem 15s para fechar popup
- Sem resposta em 90s → WO

### ⏳ ADJ-C — Sistema de Desconexão (rework)
- Janela de 90s para reconectar (era 60s; convidados tinham WO imediato — agora igual para todos)
- Convidados recebem `reconnectToken` ao entrar na partida (guardado em sessionStorage)
- Reutiliza popup "OPONENTE INATIVO" do ADJ-B

### ⏳ ADJ-D — Empate por dupla inatividade/desconexão
- Ambos inativos/desconectados → DRAW forçado
- Um retorna enquanto outro ainda está pending → popup "RETORNAR AO JOGO? SIM/NÃO" com 15s
- NÃO ou timer esgota → WO contra quem estava pending (retornado vence)

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
| P-B | Links externos reais | ⏸ Integrado na Design-K |
| P-C | Localização: 7 idiomas restantes (ES/DE/IT/RU/JA/KO/ZH) | ✅ Completo |
| P-D | Replay: tabuleiro fixo + Turno 0 + label [N] | ⏸ Absorvido pela Design-J |
| **Design-A** | **Tokens CSS + fontes + flag-icons — base de tudo** | ✅ Completo |
| Design-B | Menu principal + header de jogador + tab bar | ✅ Completo |
| Design-F | Auth overlay (tela cheia) | ✅ Completo |
| Design-C | Matchmaking + Sala privada | ✅ Completo |
| Design-D | Telas de partida: Draft · Posição · Revelação · Ação | ✅ Completo |
| Design-E | Duelo + Game Over + estado de Empate | ✅ Completo |
| Design-G | Modais de sistema: ban, logout, delete, change-pw, reconnect | ✅ Completo |
| Design-H | Perfil + Editar avatar/apelido | ✅ Completo |
| Design-I | Ranking + Leaderboard | ✅ Completo |
| Design-J | Histórico + Replay (absorve P-D: tabuleiro + turno 0) | ✅ Completo |
| Design-K | Configurações + Como Jogar + Créditos + links externos (P-B) | ✅ Completo |
| Design-L | Estados de exceção: disconnect, AFK, Morte Súbita, sem conexão | ✅ Completo |
| P-12 | Balanceamento MMR para empate + fix Morte Súbita | ✅ Completo |
| P-12B | PdL empate (só ganho) + SD-1 overlay Morte Súbita | ✅ Completo |
| OPT-A | GZIP + remover Twemoji + reduzir pesos de fonte | ✅ Completo |
| POL-Theme | Detecção automática prefers-color-scheme + matchMedia listener | ✅ Completo |
| OPT-B | Animação de peças: transform vs left/top | ✅ Completo |
| OPT-C | flag-icons inline + SW versioning + perMessageDeflate + CSS hints | ✅ Completo |
| TESTES-A | Unit tests + db-inspector | ✅ Completo |
| INFRA-A | Railway Volume + persistência do SQLite + monitoramento de uptime | ✅ Completo |
| MANUT-A | Limpeza de contas de teste antes do Open Test | ✅ Completo (ADJ-A/B) |
| PRE-OT-A | Idioma EN padrão + detecção de sistema + preferência por usuário | ✅ Completo |
| PRE-OT-B | Modo Casual + novo fluxo NOVO JOGO | ✅ Completo |
| PRE-OT-C | Renomear PdL→XP + timer visível desde início do turno | ✅ Completo |
| PRE-OT-D | Bug fixes: tema claro, botão Criar Conta, rank incorreto | ✅ Completo |
| PRE-OT-E | Design/UI: padronizar botão Voltar, caixa alta, novo header | ✅ Completo |
| PRE-OT-F | Auditoria i18n 100% + Privacy Policy como link externo | ✅ Completo |
| PRE-OT-G | Pesquisa legislação proteção de dados internacional | ✅ Completo |
| SEC-A | Bundling + minificação + obfuscação JS (pré-requisito Play Store) | ⏳ Pendente |
| P-B | Links externos reais nos créditos (inclui URL da Privacy Policy) | ⏸ Aguarda URLs do usuário |
| TESTES-B | Integration API + partida automatizada | ⏸ Futuro |
| TESTES-C | 6 ferramentas de navegador | ⏸ Futuro |
| TESTES-D | Cenários avançados + carga + replay validator | ⏸ Futuro |
| ANAL-A | Instrumentação core de métricas (pré Open Test) | ✅ Completo |
| ANAL-B | Tabela de eventos — instrumentação de fluxo (pré Open Test) | ✅ Completo |
| ANAL-C | Extração — queries SQL e script de relatório | ⏸ Aguarda Open Test |
| ANAL-D | Interpretação — argumento de venda | ⏸ Aguarda Open Test |
| **SP** | **Single Player: 15 fases com bots de estratégias diferentes** | ✅ Completo |
| **ADJ-A** | **Ranked lock + delete users + créditos** | ✅ Completo |
| **ADJ-B** | **Sistema de inatividade (substituição completa)** | ✅ Completo |
| **ADJ-C** | **Sistema de desconexão (rework + guests)** | ✅ Completo |
| **ADJ-D** | **Empate por dupla inatividade/desconexão** | ✅ Completo |
| **ADJ-DESIGN** | **Ajustes de design: bot nv1 · Rei dinâmico · Peão→Rainha · Morte Súbita bo3 · odds na UI** | 🔄 Branch `ajustes-design` (pendente playtest + merge) |

*(Atualizar este arquivo ao concluir cada sessão)*
