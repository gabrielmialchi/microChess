# Planejamento — sessões concluídas (ARQUIVO)

Movido de docs/SESSAO_POR_SESSAO_PLANNING.md (blocos ADJ-A..D e anteriores).

---

# SESSÃO ADJ-A — Quick Wins

## Objetivo
Três mudanças simples e independentes entregues numa única sessão.

## Risco: 🟢 Baixo — frontend simples + operação de banco

---

## BLOCO A — Ranked desabilitado para convidado

### Problema
O botão "Ranqueada" aparece habilitado para convidados. O servidor já ignora o modo ranked
quando algum dos jogadores é convidado (linha 1131 do server.js), mas o frontend não comunica
isso — o convidado entra na fila achando que está numa partida ranqueada.

### Implementação

**Arquivo:** `html/index.html`

1. **Ao exibir `screen-multiplayer-mode`**: checar `Session.get()?.token`.
   - Se não houver token (convidado): aplicar no `#mp-card-ranked`:
     ```
     pointer-events: none
     opacity: 0.45
     ```
     E adicionar um badge inline `"🔒 Conta necessária"` abaixo da descrição.
   - Se houver token: comportamento atual inalterado.

2. **Guard em `selectMultiplayerMode`** (linha ~4543):
   ```javascript
   if (mode === 'ranked' && !Session.get()?.token) return;
   ```

3. **Reset ao sair da tela**: ao navegar para fora de `screen-multiplayer-mode`, remover
   quaisquer estilos de lock adicionados dinamicamente (limpar ao reexibir).

**Nenhuma mudança no servidor necessária.**

---

## BLOCO B — Deletar todos os usuários cadastrados

### Operação
Comando direto no SQLite. Executar **com o servidor parado**.

Ordem obrigatória (foreign keys ativas):
```sql
DELETE FROM singleplayer_progress;
DELETE FROM replays;
DELETE FROM matches;
DELETE FROM players;
```

Via PowerShell:
```powershell
cd "e:\Projetos\o6\FAST IP\microChess"
sqlite3 server/db/microchess.db "DELETE FROM singleplayer_progress; DELETE FROM replays; DELETE FROM matches; DELETE FROM players;"
```

### Verificação
```powershell
sqlite3 server/db/microchess.db "SELECT COUNT(*) FROM players;"
# esperado: 0
```

---

## BLOCO F — Créditos

### Problema
Estrutura atual dos créditos mistura papéis e tem links desnecessários (Portfólio, Itch.io).

### Implementação

**Arquivo:** `html/index.html` — tela `#screen-credits` (linhas 2310–2338)

Substituir o conteúdo do `.dk-crd-body` para:

```
Desenvolvido por
O6 GAMES

Desenvolvimento de Projeto por
Gabriel Mialchi

[SITE]   [INSTAGRAM]

────────────────────

Obrigado por jogar.
Feedback é muito bem-vindo.
[Deixe seu feedback →]
```

Mudanças específicas:
- Remover links `#crd-portfolio` e `#crd-itch` (Portfólio e Itch.io)
- Manter `#crd-site` e `#crd-insta`
- Adicionar bloco "Desenvolvido por / O6 GAMES" antes do nome
- Trocar label abaixo do nome para "Desenvolvimento de Projeto"
- Manter regra separadora, "Obrigado por jogar" e botão de feedback

---

# SESSÃO ADJ-B — Sistema de Inatividade

## Objetivo
Substituir o sistema AFK atual (timers por fase do jogo) por um sistema baseado em
**atividade de clique do usuário**, com popups de confirmação antes do WO.

## Risco: 🔴 Alto — toca server.js e index.html em múltiplos pontos

---

## Arquitetura do novo sistema

```
Cliente detecta inatividade (sem clique por 50s)
  → mostra banner de aviso por 10s
  → ao completar 60s → emit 'player_inactive'

Servidor recebe 'player_inactive'
  → marca room.pending[color] = { type:'inactive', deadline: now+90s, timer }
  → emit 'inactivity_popup' para jogador inativo (deadline: +90s)
  → emit 'opponent_inactive' para jogador ativo

Jogador inativo clica VOLTAR
  → emit 'player_returned'
  → servidor limpa timer, apaga pending
  → emit 'opponent_returned' para jogador ativo (15s para fechar popup)

Jogador inativo clica ABANDONAR PARTIDA
  → emit 'player_abandoned'
  → servidor decreta WO contra ele

Timer de 90s expira sem resposta
  → servidor verifica se oponente também está pending
    → se sim: forçar DRAW (tratado no ADJ-D)
    → se não: WO contra quem expirou
```

---

## C.1 — Remover sistema AFK atual

**Arquivo:** `server/server.js`

Remover/comentar as constantes:
- `AFK_ACTION_MS = 45_000` (linha 363)
- `AFK_PREPARE_MS = 120_000` (linha 364)

Remover todas as chamadas `startAFKTimer(...)` para fases ACTION e PREPARE/DRAFT:
- Linhas 925, 926 (Action após draft completo)
- Linhas 954, 955 (Position após draft)
- Linhas 971 (Position reconexão)
- Linhas 987, 988 (Action após reveal)
- Linha 1003 (Bot action)
- Linhas 1128, 1129 (Draft inicial matchmaking)
- Linha 1187 (Training draft)
- Linha 1254 (Solo draft)
- Linhas 1359, 1360 (Private room draft)
- Linha 1401 (Custom draft jogador entrando)
- Linha 1413 (Custom draft bot)
- Linhas 1431, 1432 (Custom position)
- Linha 1452 (Custom position jogador entrando)
- Linha 1466 (Custom position bot)
- Linha 1510 (Action humano move)
- Linhas 1486, 1487 (Reconexão action)
- Linhas 1667, 1669 (Reconexão fase genérica)

Manter as funções `startAFKTimer` e `clearAFKTimer` — serão usadas como fallback de
emergência (30 min) para partidas completamente travadas.

Remover `afkDeadline` do broadcast de estado ao cliente.

---

## C.2 — Novo estado por sala

**Arquivo:** `server/server.js` — na criação do room (linha ~1128)

Adicionar ao objeto `room`:
```javascript
room.pending = { white: null, black: null };
// null | { type:'inactive'|'disconnected', timer: setTimeout, deadline: Number }
```

---

## C.3 — Novos handlers de socket no servidor

**Arquivo:** `server/server.js` — adicionar após o handler `rejoin_game`

### `player_inactive`
```
Valida: partida existe, não está em GAMEOVER, jogador pertence à sala
Ação:
  clearAFKTimer(room, color)  ← cancela qualquer timer legado
  room.pending[color] = { type:'inactive', deadline: Date.now()+90_000, timer: setTimeout(90s) }
  emit 'inactivity_popup' → jogador inativo  { deadline: room.pending[color].deadline }
  emit 'opponent_inactive' → jogador ativo   { remainMs: 90_000 }
```

### `player_returned`
```
Valida: partida existe, jogador tem pending ativo
Ação:
  clearTimeout(room.pending[color].timer)
  room.pending[color] = null
  emit 'opponent_returned' → jogador ativo  { dismissInMs: 15_000 }
```

### `player_abandoned`
```
Valida: partida existe
Ação:
  decretar WO contra color
  (mesma lógica de startAFKTimer ao expirar)
```

---

## C.4 — Detecção de inatividade no cliente

**Arquivo:** `html/index.html` — bloco `// ── AFK tracking` (linha ~5945)

Substituir completamente o bloco atual por:

```javascript
// ── Inactivity tracking — detecção por clique/touch ──────────
let _lastActivityAt  = Date.now();
let _inactiveEmitted = false;
let _inactivityInterval = null;

function _resetActivity() {
  _lastActivityAt  = Date.now();
  _inactiveEmitted = false;
  window.ExcBanners.hideAfk();
}

function _startInactivityTracking() {
  _resetActivity();
  if (_inactivityInterval) clearInterval(_inactivityInterval);
  _inactivityInterval = setInterval(() => {
    const phase = /* estado atual do jogo */;
    if (!phase || phase === 'GAMEOVER') return;
    if (_inactiveEmitted) return;
    const elapsed = Date.now() - _lastActivityAt;
    if (elapsed >= 60_000) {
      _inactiveEmitted = true;
      socket.emit('player_inactive');
      window.ExcBanners.hideAfk();
    } else if (elapsed >= 50_000) {
      const secsLeft = Math.max(0, Math.ceil((60_000 - elapsed) / 1000));
      window.ExcBanners.showAfk(secsLeft);
    } else {
      window.ExcBanners.hideAfk();
    }
  }, 500);
}

function _stopInactivityTracking() {
  if (_inactivityInterval) { clearInterval(_inactivityInterval); _inactivityInterval = null; }
  window.ExcBanners.hideAfk();
}

// Listeners globais — qualquer clique ou toque reseta o timer
document.addEventListener('click',      _resetActivity, true);
document.addEventListener('touchstart', _resetActivity, { passive: true, capture: true });

// Também resetar em qualquer ação de jogo confirmada
// (wrap nos emits de make_move, draft_buy, position_place, etc.)
```

Iniciar tracking em `game_state` quando fase muda de LOBBY para DRAFT/POSITION/ACTION.
Parar tracking em GAMEOVER e ao sair da tela de jogo.

---

## C.5 — Novos popups HTML

**Arquivo:** `html/index.html` — inserir após `#afk-banner` (linha 2926)

### Popup para jogador inativo (`#inactivity-self-popup`)
```html
<div id="inactivity-self-popup" style="display:none;position:fixed;inset:0;z-index:9100;
     background:rgba(0,0,0,0.82);display:flex;flex-direction:column;align-items:center;
     justify-content:center;gap:20px;padding:24px;">
  <div style="font-family:var(--mc-font-serif);font-size:18px;font-weight:700;
       color:var(--mc-ink);text-align:center;letter-spacing:1px;">
    INATIVO POR MAIS DE 60 SEGUNDOS
  </div>
  <button id="inactivity-return-btn" style="/* estilo primário */">
    VOLTAR (<span id="inactivity-return-timer">90</span>)
  </button>
  <button id="inactivity-abandon-btn" style="/* estilo secundário/perigo */">
    ABANDONAR PARTIDA
  </button>
</div>
```

### Popup para jogador ativo (`#inactivity-opp-popup`)
```html
<div id="inactivity-opp-popup" style="display:none;position:fixed;inset:0;z-index:9100;
     background:rgba(0,0,0,0.82);display:flex;flex-direction:column;align-items:center;
     justify-content:center;gap:16px;padding:24px;">
  <div style="font-family:var(--mc-font-serif);font-size:18px;font-weight:700;
       color:var(--mc-ink);text-align:center;letter-spacing:1px;">
    OPONENTE INATIVO
  </div>
  <div style="font-size:13px;color:var(--mc-muted);text-align:center;">
    AGUARDANDO AÇÃO
  </div>
  <button id="inactivity-opp-return-btn" disabled style="/* estilo primário, disabled */">
    VOLTAR
  </button>
</div>
```

Ambos começam com `display:none`. Serão mostrados/escondidos via JS.

---

## C.6 — Handlers de eventos do servidor no cliente

**Arquivo:** `html/index.html` — bloco de socket listeners

| Evento recebido | Ação no cliente |
|---|---|
| `inactivity_popup` | Mostrar `#inactivity-self-popup`, iniciar countdown de 90s em `#inactivity-return-timer`, parar inactivity tracking |
| `opponent_inactive` | Mostrar `#inactivity-opp-popup`, VOLTAR desabilitado |
| `opponent_returned` | Habilitar `#inactivity-opp-return-btn`, iniciar countdown de 15s; ao zerar ou ao clicar: fechar popup |
| Click em `#inactivity-return-btn` | `socket.emit('player_returned')`, fechar `#inactivity-self-popup`, reiniciar tracking |
| Click em `#inactivity-abandon-btn` | `socket.emit('player_abandoned')`, fechar popup |
| Click em `#inactivity-opp-return-btn` | Fechar `#inactivity-opp-popup`, retomar jogo |

---

# SESSÃO ADJ-C — Sistema de Desconexão

## Objetivo
Dar a todos os jogadores (incluindo convidados) uma janela de 90s para reconectar.
Reutilizar os popups de inatividade do ADJ-B para a UI do oponente.

## Pré-requisito: ADJ-B deve estar completo (popups já existem)

## Risco: 🟠 Médio

---

## D.1 — Token de reconexão para convidados

**Arquivo:** `server/server.js` — na criação do room

Ao criar uma sala com jogador guest (uid começa com `g_`), gerar um reconnect token:
```javascript
const guestToken = crypto.randomUUID();
room.players[color].reconnectToken = guestToken;
io.to(socketId).emit('game_reconnect_token', { token: guestToken });
```

**Arquivo:** `html/index.html`
```javascript
socket.on('game_reconnect_token', ({ token }) => {
  sessionStorage.setItem('mc_reconnect_token', token);
});
```

No handler `rejoin_game` (linha 1643 do server.js): aceitar também `{ reconnectToken }`:
```javascript
// Auth: verifica JWT token
// Guest: verifica reconnectToken contra room.players[*].reconnectToken
```

---

## D.2 — Unificar tratamento de desconexão

**Arquivo:** `server/server.js` — handler de disconnect (linhas 1610–1639)

Remover o branch `} else { // Guest: WO imediato }` (linhas 1630–1639).

Novo fluxo unificado para auth e guest:
```
1. clearAFKTimer para ambos os jogadores
2. room.pending[playerColor] = { type:'disconnected', deadline: now+90s, timer: setTimeout(90s) }
3. No callback do setTimeout:
     se room.pending[oppColor] também existe → forçar DRAW (ADJ-D)
     caso contrário → WO contra quem desconectou
4. emit 'opponent_inactive' ao oponente (reutiliza popup do ADJ-B)
   — mesma UI, mensagem idêntica: "OPONENTE INATIVO / AGUARDANDO AÇÃO"
```

No `rejoin_game` (linha 1643): ao reconectar com sucesso:
```
clearTimeout(room.pending[color].timer)
room.pending[color] = null
emit 'opponent_returned' ao oponente (15s para fechar popup)
```

**Aumentar RECONNECT_MS de 60_000 para 90_000** (linha 540).

---

# SESSÃO ADJ-D — Empate por Dupla Inatividade/Desconexão

## Objetivo
Tratar o cenário onde ambos os jogadores ficam inativos ou desconectados ao mesmo tempo.

## Pré-requisito: ADJ-B e ADJ-C completos

## Risco: 🟠 Médio

---

## E.1 — Verificação de draw no callback do timer

**Arquivo:** `server/server.js` — callbacks dos timers em `room.pending`

Em qualquer timer de 90s que expire, antes de decretar WO:
```javascript
const oppPending = room.pending[oppColor];
if (oppPending) {
  // Ambos pendentes → forçar empate
  clearTimeout(oppPending.timer);
  room.pending.white = null;
  room.pending.black = null;
  room.state.phase = 'GAMEOVER';
  room.state.draw  = true;
  room.state.wo    = false;
  persistMatchResult(room, null, false); // draw
  broadcast(room);
  scheduleRoomCleanup(room.id);
  return;
}
// caso contrário: WO normal
```

---

## E.2 — Popup "Retornar ao Jogo?" (cenário de retorno assimétrico)

**Cenário:** playerA estava desconectado, playerB estava inativo (ambos pending).
playerA reconecta. playerB deve decidir em 15s se retorna.

**Arquivo:** `html/index.html` — inserir terceiro popup

```html
<div id="return-to-game-popup" style="display:none;position:fixed;inset:0;z-index:9200;
     background:rgba(0,0,0,0.85);...">
  <div>RETORNAR AO JOGO?</div>
  <button id="rtg-yes-btn">SIM</button>
  <button id="rtg-no-btn">
    NÃO (<span id="rtg-timer">15</span>)
  </button>
</div>
```

**Arquivo:** `server/server.js`

Quando um jogador reconnecta/retorna e o oponente está pending:
```javascript
// Ao invés de emit 'opponent_returned', emitir 'return_to_game_prompt' ao pending
io.to(pendingPlayerSocket).emit('return_to_game_prompt', { seconds: 15 });
// Iniciar timer de 15s no servidor
const rtgTimer = setTimeout(() => {
  // Pending não respondeu → WO contra ele (retornado vence)
  decreteWO(room, pendingColor);
}, 15_000);
room.pending[pendingColor].rtgTimer = rtgTimer;
```

Novo evento de socket no servidor: `return_prompt_response`
```
{ answer: 'yes' } → game resumes, emit 'opponent_returned' ao retornado, limpar timers
{ answer: 'no'  } → WO contra quem respondeu NÃO
```

---

## E.3 — Handlers no cliente para ADJ-D

| Evento recebido | Ação no cliente |
|---|---|
| `return_to_game_prompt` | Mostrar `#return-to-game-popup`, countdown de 15s |
| Click SIM | `socket.emit('return_prompt_response', { answer:'yes' })`, fechar popup |
| Click NÃO ou timer zera | `socket.emit('return_prompt_response', { answer:'no' })`, fechar popup |

---

## Checklist de Testes por Sessão

### ADJ-A
- [ ] Convidado: botão Ranqueada visualmente bloqueado, clique não funciona
- [ ] Usuário logado: botão Ranqueada funciona normalmente
- [ ] `SELECT COUNT(*) FROM players` retorna 0 após BLOCO B
- [ ] Tela de créditos mostra nova estrutura, sem Portfólio e Itch.io

### ADJ-B
- [ ] 50s sem clicar → banner de aviso com countdown 10→0
- [ ] 60s sem clicar → popup "INATIVO POR MAIS DE 60 SEGUNDOS" com contador de 90s
- [ ] Oponente vê "OPONENTE INATIVO, AGUARDANDO AÇÃO"
- [ ] Clicar VOLTAR → jogo retoma, oponente vê VOLTAR habilitado por 15s
- [ ] Clicar ABANDONAR → WO imediato
- [ ] 90s sem clicar VOLTAR → WO automático
- [ ] Qualquer clique durante jogo normal reseta o timer (não deve disparar aviso)

### ADJ-C
- [ ] Convidado desconecta → oponente vê popup "OPONENTE INATIVO"
- [ ] Convidado reconecta em 90s → jogo retoma, oponente vê VOLTAR por 15s
- [ ] Convidado não reconecta em 90s → WO
- [ ] Auth desconecta → mesmo comportamento
- [ ] Aumentar RECONNECT_MS para 90_000 verificado

### ADJ-D
- [ ] Ambos inativos → DRAW forçado ao expirar o segundo timer
- [ ] playerA desconecta, playerB vai inativo → playerA reconecta → playerB vê "RETORNAR AO JOGO?"
- [ ] playerB clica SIM → jogo retoma
- [ ] playerB clica NÃO → WO para playerB (playerA vence)
- [ ] playerB não responde em 15s → WO para playerB

---
