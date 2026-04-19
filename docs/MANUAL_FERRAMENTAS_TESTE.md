# Manual de Usuário — Ferramentas de Teste microChess
> Para testadores, desenvolvedores e QA. Não é necessário conhecer o código-fonte do jogo.

---

## Índice

1. [Preparação do ambiente](#1-preparação-do-ambiente)
2. [Scripts de linha de comando](#2-scripts-de-linha-de-comando)
   - 2.1 [unit-movegen.js — Teste de movimentos](#21-unit-movegenjs)
   - 2.2 [unit-mmr.js — Teste de MMR/ELO](#22-unit-mmrjs)
   - 2.3 [unit-elo.js — Teste de ligas e PdL](#23-unit-elojs)
   - 2.4 [unit-auth.js — Teste de autenticação](#24-unit-authjs)
   - 2.5 [db-inspector.js — Relatório do banco](#25-db-inspectorjs)
   - 2.6 [integration-api.js — Teste de endpoints](#26-integration-apijs)
   - 2.7 [scenario-full-game.js — Partida automatizada](#27-scenario-full-gamejs)
   - 2.8 [scenario-reconnect.js — Teste de reconexão](#28-scenario-reconnectjs)
   - 2.9 [scenario-afk.js — Timeout de inatividade](#29-scenario-afkjs)
   - 2.10 [scenario-ban.js — Sistema de ban](#210-scenario-banjs)
   - 2.11 [load-matchmaking.js — Teste de carga](#211-load-matchmakingjs)
   - 2.12 [replay-validator.js — Validação de replays](#212-replay-validatorjs)
3. [Ferramentas de navegador](#3-ferramentas-de-navegador)
   - 3.1 [board-preview.html — Visualizador de tabuleiro](#31-board-previewhtml)
   - 3.2 [duel-sim.html — Simulador de duelos](#32-duel-simhtml)
   - 3.3 [mmr-calculator.html — Calculadora ELO/PdL](#33-mmr-calculatorhtml)
   - 3.4 [socket-inspector.html — Monitor de eventos](#34-socket-inspectorhtml)
   - 3.5 [i18n-checker.html — Verificador de traduções](#35-i18n-checkerhtml)
   - 3.6 [phase-stepper.html — Simulador de fases](#36-phase-stepperhtml)
4. [Interpretando resultados](#4-interpretando-resultados)
5. [Fluxos de teste recomendados](#5-fluxos-de-teste-recomendados)
6. [Solução de problemas comuns](#6-solução-de-problemas-comuns)

---

## 1. Preparação do ambiente

### Requisitos
- **Node.js ≥ 18** — verificar com `node --version`
- **Navegador moderno** — Chrome, Firefox ou Edge (para as ferramentas HTML)
- **Servidor microChess** — necessário para os testes de integração e cenários

### Instalar dependências das ferramentas

```bash
# Navegar até a pasta de testes
cd "E:\Projetos\o6\FAST IP\microChess\testes"

# Instalar dependências (apenas socket.io-client — para os cenários)
npm install

# Verificar instalação
node -e "require('socket.io-client'); console.log('OK')"
```

### Iniciar o servidor (quando necessário)

```bash
# Em um terminal separado — manter rodando durante os testes
cd "E:\Projetos\o6\FAST IP\microChess\server"
npm run dev

# Confirmação esperada:
# microChess server running on port 3000
```

### Verificar saúde do servidor antes de testar

```bash
# Windows PowerShell:
Invoke-WebRequest http://localhost:3000/health | Select-Object -ExpandProperty Content

# Saída esperada:
# {"ok":true,"rooms":0,"queue":0,"db":"ok"}
```

---

## 2. Scripts de linha de comando

Todos os scripts ficam em `testes/server/`.
Rodar a partir da raiz do projeto: `node testes/server/nome-do-script.js`

---

### 2.1 `unit-movegen.js`

**O que faz:** Valida que as regras de movimento de cada peça estão corretas.
Não requer servidor.

**Quando usar:**
- Após qualquer alteração na lógica de movimentos
- Como verificação de regressão antes de um deploy

**Como rodar:**
```bash
node testes/server/unit-movegen.js
```

**Saída esperada (tudo OK):**
```
== unit-movegen ==
✅ Rei: mover 1 casa (diagonal)
✅ Rei: mover 1 casa (horizontal)
✅ Rei: BLOQUEADO mover 2 casas
✅ Rainha: diagonal longa
✅ Rainha: horizontal longa
✅ Rainha: vertical longa
✅ Rainha: BLOQUEADO caminho obstruído
... (mais casos)
✅ Peão: captura diagonal (inimigo)
✅ Peão: BLOQUEADO captura diagonal (vazio)
✅ Peão buffed: move lateral
==========================
Resultado: 32/32 ✅
```

**Saída com falha:**
```
❌ Rainha: diagonal longa
   Esperado: true
   Obtido:   false
```

**O que fazer se falhar:** O movimento de alguma peça está quebrando. Reportar qual caso falhou e qual peça está envolvida.

---

### 2.2 `unit-mmr.js`

**O que faz:** Valida os cálculos de MMR (sistema ELO) e regras de ban.
Não requer servidor.

**Como rodar:**
```bash
node testes/server/unit-mmr.js
```

**Saída esperada:**
```
== unit-mmr ==
✅ Vitória: igual vs igual → deltaVencedor=16, deltaVencido=-16
✅ Vitória: fraco (1200) vs forte (1800) → delta maior por ser surpresa
✅ Empate: iguais → deltaA=0, deltaB=0
✅ Empate: fraco vs forte → fraco ganha ≥1 PdL
✅ Rank 1199 → Peão
✅ Rank 1200 → Bispo
✅ Rank 2000 → Rei
✅ Ban: 2 WOs → 0 min
✅ Ban: 3 WOs → 30 min
✅ Ban: 5 WOs → 120 min
✅ Ban: 7 WOs → 1440 min
==========================
Resultado: 11/11 ✅
```

---

### 2.3 `unit-elo.js`

**O que faz:** Valida o sistema de ligas (PdL, promoções, rebaixamentos, escudo).
Não requer servidor.

**Como rodar:**
```bash
node testes/server/unit-elo.js
```

**Saída esperada:**
```
== unit-elo ==
✅ Promoção: 95 PdL + ganho de 10 → promove para rank seguinte
✅ Escudo: rebaixamento com shield=1 → não rebaixa, shield consumido
✅ Sem escudo: rebaixamento sem shield → rebaixa para rank anterior
✅ Rank máximo: sem promoção além do limite
✅ getEloDisplay retorna name, icon e lp corretos
==========================
Resultado: 5/5 ✅
```

---

### 2.4 `unit-auth.js`

**O que faz:** Valida geração e verificação de tokens JWT.
Não requer servidor.

**Como rodar:**
```bash
node testes/server/unit-auth.js
```

**Saída esperada:**
```
== unit-auth ==
✅ Sign + Verify: token gerado e verificado com sucesso
✅ Payload preservado: uid e username corretos após verify
✅ Token adulterado: rejeitado com erro de assinatura
==========================
Resultado: 3/3 ✅
```

---

### 2.5 `db-inspector.js`

**O que faz:** Exibe um relatório legível do banco de dados atual.
Não requer servidor, mas requer `server/db/microchess.db`.

**Como rodar:**
```bash
node testes/server/db-inspector.js
```

**Saída esperada:**
```
📊 BANCO DE DADOS — microChess
Data: 19/04/2026 14:30:00
══════════════════════════════════════

👥 JOGADORES (3 registrados)
  #1  GabrielM      MMR: 1542  W:8  L:3  D:1  WO:0  Rank: Cavaleiro I · 68 PdL
  #2  Teste1        MMR: 1480  W:2  L:5  D:0  WO:2  Rank: Peão III · 12 PdL
  #3  Bot_Alpha     MMR: 1200  W:0  L:1  D:0  WO:1  Rank: Bispo I · 0 PdL

⚠️  ALERTAS
  Jogadores com 2+ WOs: Teste1 (2), Bot_Alpha (1)
  Jogadores banidos agora: nenhum

🎮 PARTIDAS (11 total)
  [19/04 14:22] GabrielM vs Teste1 → white   +14 MMR / -14 MMR   Turnos: 6
  [19/04 14:11] GabrielM vs Teste1 → draw     -3 MMR /  +3 MMR   Turnos: 12
  [19/04 13:58] Teste1 vs Bot_Alpha → wo_white  0 MMR / +12 MMR   (W.O.)

🎬 REPLAYS (8 armazenados)
  Válidos: 8 | Expirados: 0 | Tamanho médio: 3.8kb
```

**Quando usar:**
- Antes de começar os testes (entender o estado atual do banco)
- Após executar cenários (verificar se dados foram gravados corretamente)
- Para diagnosticar problemas de MMR ou ban

---

### 2.6 `integration-api.js`

**O que faz:** Testa todos os endpoints HTTP do servidor automaticamente.
**Requer servidor rodando.**

**Como rodar:**
```bash
# Com servidor ativo em outro terminal:
node testes/server/integration-api.js
```

**Saída esperada:**
```
== integration-api ==
PRÉ-REQUISITO: servidor em http://localhost:3000

[1/8] GET /health ....................................................... ✅
[2/8] POST /auth/register .............................................. ✅
[3/8] POST /auth/login (credenciais corretas) .......................... ✅
[4/8] POST /auth/login (senha errada → espera 401) ..................... ✅
[5/8] GET /leaderboard ................................................. ✅
[6/8] GET /player/me (autenticado) ..................................... ✅
[7/8] POST /auth/change-password ....................................... ✅
[8/8] DELETE /auth/delete (cleanup) .................................... ✅

==========================
Resultado: 8/8 ✅
Conta de teste criada e removida com sucesso.
```

**Saída com falha:**
```
[4/8] POST /auth/login (senha errada → espera 401)
      Esperado: status 401
      Obtido:   status 200
      ❌
```

---

### 2.7 `scenario-full-game.js`

**O que faz:** Simula uma partida completa com dois bots automatizados.
**Requer servidor rodando.**

**Como rodar:**
```bash
node testes/server/scenario-full-game.js
```

**Duração esperada:** 5–30 segundos (dependendo de quantos turnos a partida tem).

**Saída esperada:**
```
== scenario-full-game ==
[0ms]    BOT_A: conectado
[12ms]   BOT_B: conectado
[25ms]   BOT_A: queue_join
[26ms]   BOT_B: queue_join
[180ms]  match_found → roomId: XKQP, BOT_A=white, BOT_B=black
[200ms]  BOT_A + BOT_B: game_join
[210ms]  Fase: DRAFT
[215ms]  BOT_A: draft_buy P → draft_ready
[220ms]  BOT_B: draft_buy P → draft_ready
[230ms]  Fase: POSITION
[235ms]  BOT_A: position_place(0,0) → position_ready
[240ms]  BOT_B: position_place(3,3) → position_ready
[250ms]  Fase: ACTION (Turno 1)
...
[4.2s]   Fase: GAMEOVER — vencedor: white
==========================
✅ Partida completa em 4.2s | 7 turnos | Sem erros
```

**Saída com problema:**
```
⚠️  DEADLOCK detectado após 120s — fase travada em: ACTION (Turno 3)
    BOT_A ready: true | BOT_B ready: false
    Possível causa: BOT_B não encontrou movimento válido
```

---

### 2.8 `scenario-reconnect.js`

**O que faz:** Testa o fluxo de desconexão e reconexão durante uma partida.
**Requer servidor rodando.**

**Como rodar:**
```bash
node testes/server/scenario-reconnect.js
```

**Duração esperada:** 15–30 segundos.

**Saída esperada:**
```
== scenario-reconnect ==
[0s]     BOT_A e BOT_B entram em partida
[3s]     Aguardando fase ACTION...
[8s]     BOT_B desconecta
[8.1s]   BOT_A recebeu: opponent_reconnecting (remainMs: 59800) ✅
[11s]    BOT_B reconecta com token
[11.2s]  BOT_A recebeu: opponent_reconnected ✅
[11.5s]  Partida continua — fase ACTION ativo ✅
==========================
✅ Reconexão funcionou corretamente
```

---

### 2.9 `scenario-afk.js`

**O que faz:** Verifica que o sistema de timeout AFK funciona — jogador que não age é WO automático.
**Requer servidor rodando.**

> ⏱️ **ATENÇÃO: Este teste demora aproximadamente 2 minutos por design.**
> O timeout de DRAFT é 120 segundos — o teste aguarda esse tempo passar.

**Como rodar:**
```bash
node testes/server/scenario-afk.js
```

**Saída esperada:**
```
== scenario-afk ==
⚠️  Este teste demora ~2 minutos (aguarda timeout de 120s)

[0s]     BOT_A: conectado e na fila
[1s]     BOT_B: conectado e na fila (não vai responder ao DRAFT)
[3s]     match_found — fase DRAFT iniciada
[3s]     BOT_A: draft_ready enviado
         BOT_B: silêncio intencional...
[125s]   BOT_A recebeu GAMEOVER: vitória por W.O. ✅
[125s]   Banco verificado: wo_count de BOT_B = 1 ✅
==========================
✅ Timeout AFK funcionou — W.O. decretado após 122s
```

---

### 2.10 `scenario-ban.js`

**O que faz:** Verifica o sistema de ban progressivo (3 WOs em 24h → ban 30min).
**Requer servidor rodando.**

> ⏱️ **ATENÇÃO: Este teste demora aproximadamente 6 minutos** (3 execuções de AFK × 2min cada).

**Como rodar:**
```bash
node testes/server/scenario-ban.js
```

**Saída esperada:**
```
== scenario-ban ==
⚠️  Este teste demora ~6 minutos

Conta de teste criada: ban_test_1713534000@x.com

[WO 1/3] Aguardando timeout AFK...
[2:05]   WO registrado. wo_count: 1
[WO 2/3] Aguardando timeout AFK...
[4:10]   WO registrado. wo_count: 2
[WO 3/3] Aguardando timeout AFK...
[6:15]   WO registrado. wo_count: 3

Tentando entrar na fila como jogador banido...
[6:16]   Evento 'banned' recebido ✅
         ban_until: 2026-04-19T18:16:00.000Z
         Duração calculada: ~30 minutos ✅

Limpeza: conta de teste removida.
==========================
✅ Sistema de ban funcionou corretamente
```

---

### 2.11 `load-matchmaking.js`

**O que faz:** Stres test — múltiplos pares de jogadores entrando na fila simultaneamente.
**Requer servidor rodando.**

**Como rodar:**
```bash
# Padrão: 10 pares (20 clientes simultâneos)
node testes/server/load-matchmaking.js

# Customizar o número de pares:
node testes/server/load-matchmaking.js --pairs 5
node testes/server/load-matchmaking.js --pairs 20
```

> ⚠️ Não usar `--pairs` acima de 20 sem ter certeza do limite de descritores de arquivo do seu OS.

**Saída esperada:**
```
== load-matchmaking ==
Iniciando 10 pares (20 clientes) simultâneos...

Par  1: matched em 145ms ✅
Par  2: matched em 148ms ✅
Par  3: matched em 152ms ✅
...
Par 10: matched em 301ms ✅

══════════════════════════
Resultados (10/10 matched):
  Média:    198ms
  Mediana:  189ms
  P95:      287ms
  Máximo:   301ms
  Erros:    0

✅ Todos os pares conectados. Servidor estável.
```

**Saída com problema:**
```
Par  7: ERRO — timeout após 5s ❌
         Possível causa: limite de conexões simultâneas atingido

Erros: 1/10
⚠️  Checar logs do servidor para detalhes
```

---

### 2.12 `replay-validator.js`

**O que faz:** Verifica a integridade estrutural de todos os replays gravados no banco.
Não requer servidor, mas requer `server/db/microchess.db`.

**Como rodar:**
```bash
node testes/server/replay-validator.js
```

**Saída esperada:**
```
== replay-validator ==
Verificando 8 replays...

✅ match-abc123 — 7 turnos, estrutura OK
✅ match-def456 — 4 turnos, estrutura OK
✅ match-ghi789 — 11 turnos, estrutura OK
... (mais replays)

══════════════════════════
Resultado: 8/8 válidos ✅
```

**Saída com problema:**
```
❌ match-jkl012 — JSON inválido (SyntaxError na posição 1402)
⚠️  match-mno345 — total_turns=7 no banco, mas replay tem 5 turnos (divergência)
❌ match-pqr678 — turno 3 sem campo 'armyAfter'

Resultado: 5/8 válidos — 3 problemas encontrados
Exit code: 1
```

---

## 3. Ferramentas de navegador

As ferramentas de navegador ficam em `testes/browser/`.
Abrir diretamente no browser — não requerem instalação.

---

### 3.1 `board-preview.html`

**O que faz:** Renderiza qualquer configuração do tabuleiro 4×4 a partir de um JSON.

**Quando abrir:** Sempre que quiser visualizar um estado de jogo sem precisar de uma partida real.

**Como usar:**

1. Abrir `testes/browser/board-preview.html` no navegador
2. No campo de texto, colar o JSON do estado desejado:

```json
{
  "army": [
    {"id": "wk1", "type": "K", "x": 0, "y": 0, "color": "white", "bonus": 2},
    {"id": "wr1", "type": "R", "x": 2, "y": 1, "color": "white", "bonus": 4},
    {"id": "bk1", "type": "K", "x": 3, "y": 3, "color": "black", "bonus": 2},
    {"id": "bq1", "type": "Q", "x": 1, "y": 2, "color": "black", "bonus": 5}
  ],
  "myColor": "white"
}
```

3. Clicar em **RENDERIZAR**

**Botões de exemplo rápido:**
- **Posição Inicial** — 5 peças de cada lado, arranjo padrão
- **Morte Súbita** — apenas os dois Reis
- **Peão Buffed** — peão com bônus ativo

**Coordenadas do tabuleiro:**
```
Perspectiva WHITE (y=0 é o lado do branco):
  x: 0=esquerda, 3=direita
  y: 0=baixo (branco), 3=cima (preto)

(0,0) (1,0) (2,0) (3,0)  ← linha do branco
(0,1) (1,1) (2,1) (3,1)
(0,2) (1,2) (2,2) (3,2)
(0,3) (1,3) (2,3) (3,3)  ← linha do preto
```

---

### 3.2 `duel-sim.html`

**O que faz:** Simula o resultado de duelos entre peças, com dados controlados ou aleatórios.

**Quando usar:**
- Verificar se a lógica de duelo está correta
- Calcular probabilidades por combinação de peças
- Entender o impacto do bônus de cada peça

**Como usar:**

1. Abrir `testes/browser/duel-sim.html`
2. Selecionar os tipos de peça (branca e preta)
   - Os bônus são preenchidos automaticamente: Q=5, R=4, N=3, B=2, K=2, P=1
3. Inserir os valores dos dados (1–6) ou usar o botão **ALEATÓRIO**
4. Clicar em **SIMULAR**

**Como ler o resultado:**
```
BRANCA: Torre (R)    PRETA: Rainha (Q)
Dado:    4           Dado:    3
Bônus:  +4           Bônus:  +5
Total:   8    vs      8   ← empate

Resultado: EMPATE — ambas as peças são eliminadas
```

**Botão 1000 SIMULAÇÕES:**
Gera 1000 duelos com dados aleatórios e exibe:
```
Torre (R) vs Rainha (Q) — 1000 simulações:
  Branca vence: 312 (31.2%)
  Empate:       156 (15.6%)
  Preta vence:  532 (53.2%)
```

---

### 3.3 `mmr-calculator.html`

**O que faz:** Calcula o impacto de uma partida no MMR e PdL de dois jogadores.

**Quando usar:**
- Verificar se o cálculo de MMR está correto após uma partida específica
- Planejar testes de progressão de rank
- Entender como o escudo protege do rebaixamento

**Como usar:**

1. Abrir `testes/browser/mmr-calculator.html`
2. Preencher os dados do **Jogador A**:
   - **MMR atual** (ex: 1500)
   - **Rank (elo_rank)**: número de 0–13 (ver tabela abaixo)
   - **PdL atual** (ex: 45)
   - **Escudo**: 0 (sem escudo) ou 1 (com escudo)
3. Preencher os mesmos dados para o **Jogador B**
4. Clicar em **CALCULAR**

**Tabela de ranks (elo_rank → nome):**
| elo_rank | Nome |
|----------|------|
| 0 | Peão IV |
| 1 | Peão III |
| 2 | Peão II |
| 3 | Peão I |
| 4 | Bispo III |
| ... | ... |
| 13 | Rei |

**Como ler o resultado:**
```
RESULTADO — Vitória do Jogador A:
  Jogador A: +22 MMR | +18 PdL → Cavaleiro II · 63 PdL [sem promoção]
  Jogador B: -22 MMR | -15 PdL → Torre I · 65 PdL [escudo consumido, sem rebaixamento]

RESULTADO — Empate:
  Jogador A (mais fraco): +3 MMR | +3 PdL → 48 PdL
  Jogador B (mais forte): -3 MMR |  0 PdL → 80 PdL (sem perda de PdL em empate)
```

---

### 3.4 `socket-inspector.html`

**O que faz:** Conecta ao servidor e exibe todos os eventos Socket.io em tempo real.

**Quando usar:**
- Debugar a sequência de eventos entre cliente e servidor
- Verificar o conteúdo exato dos payloads emitidos
- Testar eventos manualmente sem precisar de uma interface de jogo

**Requer:** Servidor rodando

**Como usar:**

1. Abrir `testes/browser/socket-inspector.html`
2. No campo **URL do Servidor**, inserir: `http://localhost:3000`
   - Para Railway: `https://microchess-production.up.railway.app`
3. (Opcional) No campo **Token JWT**, colar o token de um usuário autenticado
   - Obter o token após login via `integration-api.js` ou pelo console do browser no jogo
4. Clicar em **CONECTAR**
5. O log começa a exibir eventos:

```
14:23:01.142  ←  connect              { id: "abc123xyz" }
14:23:05.891  →  queue_join           { token: "eyJ..." }
14:23:05.912  ←  match_found          { roomId: "XKQP", color: "white" }
14:23:06.001  →  game_join            { roomId: "XKQP", color: "white" }
14:23:06.045  ←  game_state           { phase: "DRAFT", army: [...] }
```

**Emitir evento manualmente:**
1. No campo **Nome do evento**, digitar: `queue_join`
2. No campo **Payload JSON**, inserir: `{}`
3. Clicar em **ENVIAR**

**Filtrar eventos:**
- Digitar no campo **Filtrar** para mostrar apenas eventos com esse nome
- Ex: `game_state` mostrará apenas as atualizações de estado de jogo

**Exportar log:**
- Clicar em **COPIAR JSON** para copiar o log completo no formato JSON
- Útil para anexar em relatórios de bug

---

### 3.5 `i18n-checker.html`

**O que faz:** Compara as chaves de tradução entre os 9 idiomas e identifica o que está faltando.

**Quando usar:**
- Antes de um release, para garantir que nenhum idioma tem texto em branco
- Após adicionar novas funcionalidades com texto (verificar se foram traduzidas)

**Requer:** Servidor rodando (faz fetch do index.html)

**Como usar:**

1. Abrir `testes/browser/i18n-checker.html`
2. Clicar em **ANALISAR TRADUÇÕES**
3. A tabela é gerada automaticamente:

```
CHAVE                  PT   EN   ES   DE   IT   RU   JA   KO   ZH
─────────────────────────────────────────────────────────────────────
new_game               ✅   ✅   ✅   ✅   ✅   ✅   ✅   ✅   ✅
sudden_death           ✅   ✅   ✅   ✅   ✅   ✅   ✅   ✅   ✅
sd_subtitle            ✅   ✅   ❌   ❌   ❌   ❌   ❌   ❌   ❌
pdl_draw               ✅   ✅   ❌   ❌   ❌   ❌   ❌   ❌   ❌
...

RESUMO:
  PT: 142/142 ✅ (base)
  EN: 142/142 ✅
  ES: 139/142 ⚠️
  DE: 135/142 ⚠️
  RU: 127/142 ❌
```

**Exportar CSV:**
- Clicar em **EXPORTAR CSV** para baixar a tabela completa
- Útil para passar para tradutores

---

### 3.6 `phase-stepper.html`

**O que faz:** Simula a interface do jogo em qualquer fase, sem precisar de uma partida real.

**Quando usar:**
- Testar visualmente como o jogo aparece em diferentes fases
- Verificar se elementos da UI aparecem/desaparecem corretamente por fase
- Debug de renderização de peças em estados específicos

**Como usar:**

1. Abrir `testes/browser/phase-stepper.html`
2. Selecionar a **Fase** no dropdown:
   - DRAFT, POSITION, REVEAL, ACTION, SUDDEN_DEATH, GAMEOVER
3. Selecionar a **Cor local** (white = branco embaixo / black = preto embaixo)
4. Selecionar um **Preset de exército**:
   - Início: 5 peças de cada lado
   - Meio de jogo: 3 peças de cada lado
   - Morte Súbita: apenas os dois Reis
5. Clicar em **APLICAR ESTADO**

O board é renderizado com o estado mock e o painel lateral mostra
quais ações estariam disponíveis nessa fase.

---

## 4. Interpretando resultados

### Exit codes dos scripts

| Código | Significado |
|--------|-------------|
| `0` | Todos os testes passaram |
| `1` | Pelo menos um teste falhou |

### Ícones de status

| Ícone | Significado |
|-------|-------------|
| ✅ | Passou / OK |
| ❌ | Falhou / Erro crítico |
| ⚠️ | Aviso / Problema não-crítico |

### Quando um teste falha

**Scripts unitários (unit-*):**
- O erro é da lógica do jogo, não do ambiente
- Reportar: qual caso falhou, valor esperado, valor obtido
- Não fazer deploy até corrigir

**Scripts de integração (integration-api, scenario-*):**
- Verificar primeiro se o servidor está rodando: `curl http://localhost:3000/health`
- Verificar se o banco existe: `ls server/db/microchess.db`
- Se o servidor estiver OK: reportar o passo que falhou e o status HTTP ou evento recebido

**Ferramentas de navegador:**
- Abrir **F12 → Console** para ver erros JavaScript
- Verificar se o servidor está rodando (para as que precisam de servidor)

---

## 5. Fluxos de teste recomendados

### Antes de um commit importante

```bash
# 1. Testes unitários (sem servidor — rápido)
node testes/server/unit-movegen.js
node testes/server/unit-mmr.js
node testes/server/unit-elo.js
node testes/server/unit-auth.js

# 2. Estado do banco
node testes/server/db-inspector.js
```

### Antes de um deploy para Railway/Netlify

```bash
# Com servidor rodando em outro terminal:

# 1. Endpoints funcionando
node testes/server/integration-api.js

# 2. Jogo completo funciona
node testes/server/scenario-full-game.js

# 3. Replays íntegros
node testes/server/replay-validator.js
```

### Testes completos (QA release)

```bash
# Unitários
node testes/server/unit-movegen.js
node testes/server/unit-mmr.js
node testes/server/unit-elo.js
node testes/server/unit-auth.js

# Integração (servidor rodando)
node testes/server/integration-api.js
node testes/server/scenario-full-game.js
node testes/server/scenario-reconnect.js

# Banco
node testes/server/db-inspector.js
node testes/server/replay-validator.js

# Ferramentas visuais (abrir no browser):
# - i18n-checker.html → verificar 100% de traduções em todos os idiomas
# - socket-inspector.html → verificar fluxo de uma partida manual

# Carga (opcional — demorado)
node testes/server/load-matchmaking.js --pairs 10
```

### Investigar um bug específico

1. **Bug de movimento inválido sendo aceito:**
   → `unit-movegen.js` + `socket-inspector.html` (observar eventos de `action_plan`)

2. **MMR calculado errado:**
   → `unit-mmr.js` + `mmr-calculator.html` (simular o cenário manualmente)

3. **Texto em branco em algum idioma:**
   → `i18n-checker.html`

4. **Jogo trava em alguma fase:**
   → `socket-inspector.html` + `phase-stepper.html` (reproduzir o estado)

5. **Replay não abre:**
   → `replay-validator.js` (verificar se o JSON está íntegro)

---

## 6. Solução de problemas comuns

### "Cannot find module '../../server/movegen'"
O módulo `server/movegen.js` ainda não foi criado (criado na sessão TESTES-A).
Verificar se a sessão foi concluída: `ls server/movegen.js`

### "ECONNREFUSED http://localhost:3000"
O servidor não está rodando. Iniciar em outro terminal:
```bash
cd server && npm run dev
```

### "database.js: no such file or directory"
O banco não foi inicializado. Rodar o servidor pelo menos uma vez:
```bash
cd server && npm run dev
# Ctrl+C após ver "microChess server running on port 3000"
```

### Script AFK/ban não termina
Esses scripts têm timers longos intencionais. Aguardar os ~2min (AFK) ou ~6min (ban).
Se travar por mais de 10min: Ctrl+C e verificar se o servidor está responsivo.

### socket-inspector.html não conecta
1. Verificar URL do servidor (sem barra no final)
2. Verificar CORS: o servidor aceita `*` por padrão em dev
3. Abrir F12 → Console para ver o erro exato

### load-matchmaking: erro "EMFILE too many open files"
Reduzir o número de pares: `--pairs 5`
Ou aumentar o limite do OS temporariamente (Windows):
Isso geralmente não é necessário com menos de 20 pares.
