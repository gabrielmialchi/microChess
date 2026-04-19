# Ferramentas de Teste — microChess
> Ferramentas modulares e externas ao código do jogo. Todas vivem em `testes/` e nunca importam de `server.js` ou `index.html` diretamente.

---

## Estrutura proposta

```
testes/
├── server/                    ← scripts Node.js rodados via CLI
│   ├── unit-movegen.js        ← valida isValidMove para todas as peças
│   ├── unit-mmr.js            ← valida cálculo ELO e getRank
│   ├── unit-elo.js            ← valida applyLPChange e escudos
│   ├── unit-auth.js           ← assina/verifica JWT isoladamente
│   ├── integration-api.js     ← testa todos os endpoints HTTP
│   ├── scenario-full-game.js  ← jogo completo automatizado via socket
│   ├── scenario-reconnect.js  ← fluxo de disconnect + rejoin
│   ├── scenario-afk.js        ← timeout AFK em DRAFT/ACTION
│   ├── scenario-ban.js        ← escalonamento de ban (3/5/7 WOs)
│   ├── load-matchmaking.js    ← N clientes na fila ao mesmo tempo
│   ├── db-inspector.js        ← relatório do banco em texto
│   └── replay-validator.js    ← valida estrutura JSON de todos os replays
└── browser/                   ← páginas HTML abertas no navegador
    ├── board-preview.html      ← renderiza qualquer estado de board
    ├── i18n-checker.html       ← compara chaves entre os 9 idiomas
    ├── duel-sim.html           ← simula duelos com dados controlados
    ├── mmr-calculator.html     ← calculadora ELO/PdL interativa
    ├── socket-inspector.html   ← loga todos os eventos socket em tempo real
    └── phase-stepper.html      ← avança fases com estado mock
```

---

## Ferramentas do servidor (`testes/server/`)

### 1. `unit-movegen.js` — Validação de movimentos

**O que testa:** A função `isValidMove` exportada de `server.js` (ou extraída para módulo próprio).

**Como funciona:**
```js
// Importa só a função, não o servidor inteiro
const { isValidMove } = require('../../server/server'); // ou módulo separado

const army = [
    { id: 'wq1', type: 'Q', x: 0, y: 0, color: 'white' },
    { id: 'bk1', type: 'K', x: 3, y: 3, color: 'black' },
];

const cases = [
    { piece: army[0], tx: 3, ty: 3, expected: true,  label: 'Q diagonal longa' },
    { piece: army[0], tx: 0, ty: 0, expected: false, label: 'Q mesmo lugar' },
    { piece: army[0], tx: 2, ty: 1, expected: false, label: 'Q movimento inválido' },
    // ... todos os tipos de peça
];

cases.forEach(({ piece, tx, ty, expected, label }) => {
    const result = isValidMove(piece, tx, ty, army);
    console.log(result === expected ? `✅ ${label}` : `❌ ${label} (esperado ${expected}, obteve ${result})`);
});
```

**Casos a cobrir por peça:**
| Peça | Casos |
|------|-------|
| K | mover 1 casa em todas as 8 direções; tentar mover 2 casas |
| Q | diagonal, horizontal, vertical longa; L-shape (deve falhar) |
| R | horizontal/vertical; diagonal (deve falhar); bloqueio de caminho |
| B | diagonal livre; diagonal bloqueada; horizontal (deve falhar) |
| N | salto em L válido; salto bloqueado pelo caminho (deve passar — N pula) |
| P | frente livre; captura diagonal; sem captura em frente; modo buffed |

**Rodar:**
```
node testes/server/unit-movegen.js
```

---

### 2. `unit-mmr.js` — Cálculo ELO

**O que testa:** `calculate`, `calculateDraw`, `getRank`, `getBanDuration` de `server/mmr.js`.

**Casos críticos:**
```js
const { calculate, calculateDraw, getRank, getBanDuration } = require('../../server/mmr');

// Vitória de igual contra igual → delta ~16
const r1 = calculate(1500, 1500);
assert(r1.winnerDelta > 0 && r1.loserDelta < 0, 'vitória simétrica');

// Empate entre iguais → ambos 0
const r2 = calculateDraw(1500, 1500);
assert(r2.deltaA === 0 && r2.deltaB === 0, 'empate simétrico = sem ganho');

// Empate: fraco vs forte → fraco ganha pelo menos 1
const r3 = calculateDraw(1200, 1800);
assert(r3.deltaA >= 1, 'fraco ganha em empate');
assert(r3.deltaB <= 0, 'forte não ganha em empate');

// Floor de +1 no arredondamento
const r4 = calculateDraw(1499, 1500); // diferença mínima
assert(r4.deltaA >= 1 || r4.deltaA === 0, 'floor funciona');

// Ranks
assert(getRank(1199).name === 'Peão');
assert(getRank(1200).name === 'Bispo');
assert(getRank(2000).name === 'Rei');

// Ban
assert(getBanDuration(2) === 0);
assert(getBanDuration(3) === 30);
assert(getBanDuration(5) === 120);
assert(getBanDuration(7) === 1440);
```

---

### 3. `unit-elo.js` — Sistema de ligas (PdL)

**O que testa:** `applyLPChange` e `getEloDisplay` de `server/elo.js`.

**Casos críticos:**
```js
// Promoção: 100 PdL no rank 0 → promove para rank 1
const r1 = applyLPChange(0, 95, 0, 10);
assert(r1.promoted === true && r1.elo_rank === 1);

// Rebaixamento com escudo: rank 1, 0 PdL, shield=1, perde → não rebaixa
const r2 = applyLPChange(1, 5, 1, -20);
assert(r2.demoted === false && r2.elo_shield === 0);

// Rebaixamento sem escudo: rank 1, 0 PdL, shield=0, perde → rebaixa
const r3 = applyLPChange(1, 5, 0, -20);
assert(r3.demoted === true && r3.elo_rank === 0);

// Rei (rank máximo) não promove além do limite
// PdL no Rei só acumula mas não promove
```

---

### 4. `unit-auth.js` — JWT isolado

**O que testa:** Geração e verificação de tokens sem subir o servidor.

```js
// Seta JWT_SECRET manualmente para o teste
process.env.JWT_SECRET = 'test-secret-key-unittest';
const auth = require('../../server/auth');

// Criar jogador fake, gerar token, verificar
const payload = { uid: 'test-uid-123', username: 'Teste' };
const token = auth.signToken(payload);
const decoded = auth.verifyToken(token);
assert(decoded.uid === 'test-uid-123');

// Token expirado (se auth.js suportar expiração customizada)
// Token adulterado → deve lançar erro
try {
    auth.verifyToken(token + 'adulterado');
    assert(false, 'deveria ter lançado');
} catch (e) {
    console.log('✅ Token adulterado rejeitado');
}
```

---

### 5. `integration-api.js` — Endpoints HTTP

**O que testa:** Todos os endpoints REST com o servidor **já rodando** em paralelo.

**Pré-requisito:** `cd server && npm run dev` em outro terminal.

```js
const BASE = 'http://localhost:3000';
const uid1 = `test_${Date.now()}`;

async function run() {
    // Health
    let r = await fetch(`${BASE}/health`).then(r => r.json());
    assert(r.ok === true, 'health ok');

    // Register
    r = await fetch(`${BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: uid1, email: `${uid1}@x.com`, password: 'senha123' })
    }).then(r => r.json());
    assert(r.token, 'registro retorna token');
    const token = r.token;

    // Login
    r = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: `${uid1}@x.com`, password: 'senha123' })
    }).then(r => r.json());
    assert(r.token, 'login retorna token');

    // Login com senha errada → 401
    const status = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: `${uid1}@x.com`, password: 'errada' })
    }).then(r => r.status);
    assert(status === 401, 'senha errada → 401');

    // Leaderboard
    r = await fetch(`${BASE}/leaderboard`).then(r => r.json());
    assert(Array.isArray(r), 'leaderboard é array');

    // Player profile
    r = await fetch(`${BASE}/player/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json());
    assert(r.username === uid1, 'perfil correto');

    // Delete account (cleanup)
    await fetch(`${BASE}/auth/delete`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`,
                   'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'senha123' })
    });

    console.log('✅ Todos os endpoints OK');
}
run().catch(console.error);
```

---

### 6. `scenario-full-game.js` — Partida automatizada

**O que testa:** Fluxo completo de jogo via socket — dois bots que jogam sozinhos.

**Estratégia:** Cada bot ouve `game_state` e responde automaticamente com a jogada mais simples possível em cada fase.

```
BOT_A ──────────────────────────────────────────────────────►
  queue_join → draft_buy(P) → draft_ready
  → position_place(0,0) → position_ready
  → action_plan(wk1,1,0) → action_ready
  → roll_dice → duel_resolve (se duelo)

BOT_B ──────────────────────────────────────────────────────►
  (mesmo fluxo, cor preta)

Critério de sucesso: fase GAMEOVER atingida sem crash
```

**Output esperado:**
```
[0ms]  BOT_A: queue_join
[12ms] BOT_B: queue_join
[15ms] match_found → roomId: ABCD
[20ms] DRAFT iniciado
[22ms] BOT_A: draft_buy P, draft_ready
[23ms] BOT_B: draft_buy P, draft_ready
[30ms] POSITION iniciado
...
[800ms] GAMEOVER — vencedor: white
✅ Partida completa em 800ms, 4 turnos
```

---

### 7. `scenario-reconnect.js` — Reconexão

**O que testa:** Jogador desconecta durante ACTION e reconecta dentro dos 60s.

```
1. BOT_A e BOT_B entram em partida
2. Aguarda fase ACTION
3. BOT_B desconecta (socket.disconnect())
4. Verifica: BOT_A recebe 'opponent_reconnecting'
5. Aguarda 5s, BOT_B reconecta com mesmo token
6. BOT_B emite 'rejoin_game'
7. Verifica: BOT_A recebe 'opponent_reconnected'
8. Partida continua normalmente
```

---

### 8. `scenario-afk.js` — Timeout AFK

**O que testa:** Jogador não responde em DRAFT/ACTION → WO automático.

```
1. BOT_A entra na fila e joga normalmente
2. BOT_B entra na fila mas nunca emite draft_ready
3. Aguarda 121s (timeout DRAFT = 120s)
4. Verifica: BOT_A recebe game_state com phase=GAMEOVER e resultado WO
5. Verifica: BOT_B teve wo_count incrementado no banco
```

> Dica: usar `--test-timeout` ou mockar `Date.now` para acelerar o teste.

---

### 9. `scenario-ban.js` — Escalonamento de ban

**O que testa:** 3 WOs em 24h → ban 30min; 5 → 2h; 7 → 24h.

```
1. Criar conta de teste
2. Forçar 3 WOs via disconnect (usando scenario-afk como sub-rotina)
3. Tentar queue_join → verificar resposta com ban_until
4. Verificar duração ≈ 30 minutos
5. Simular 2 WOs adicionais → verificar ban ≈ 2h
```

---

### 10. `load-matchmaking.js` — Teste de carga

**O que testa:** N pares de clientes conectando simultaneamente — mede latência de match_found e estabilidade.

```js
const N_PAIRS = 20; // 40 clientes simultâneos

async function runPair(id) {
    const t0 = Date.now();
    // conecta dois sockets, ambos queue_join
    // aguarda match_found em ambos
    // registra latência
    return Date.now() - t0;
}

const results = await Promise.all(
    Array.from({ length: N_PAIRS }, (_, i) => runPair(i))
);

console.log(`Média: ${avg(results)}ms | Máx: ${Math.max(...results)}ms | Erros: ${errors}`);
```

**Critério de sucesso:** Todos os 20 pares fizeram match em < 2s, zero crashes no servidor.

---

### 11. `db-inspector.js` — Relatório do banco

**O que faz:** Imprime um snapshot legível do banco de dados atual.

```
📊 BANCO DE DADOS — microChess
═══════════════════════════════════════

👥 JOGADORES (5 total)
  #1 GabrielM     MMR: 1542  W:8  L:3  D:1  WO:0  Rank: Cavaleiro I · 68 PdL
  #2 Teste1       MMR: 1480  W:2  L:5  D:0  WO:2  Rank: Peão III · 12 PdL  ⚠️ 2 WOs
  ...

🎮 PARTIDAS (23 total)
  Últimas 5:
  [2026-04-19 14:23] GabrielM vs Teste1 → white   Δ: +14/-14  Turnos: 6
  [2026-04-19 14:11] GabrielM vs Teste2 → draw     Δ: -3/+3   Turnos: 12
  ...

🎬 REPLAYS (18 válidos, 2 expirados)
  Tamanho médio: 4.2kb | Máximo: 11.1kb
```

**Rodar:**
```
node testes/server/db-inspector.js
```

---

### 12. `replay-validator.js` — Validação de replays

**O que faz:** Lê todos os replays do banco e verifica:
- JSON parseável
- Cada turno tem: `turn`, `planning`, `armyAfter`
- `armyAfter` não contém peças duplicadas
- Quantidade de turnos é consistente com `matches.total_turns`

```
✅ Replay match-abc123: 7 turnos, estrutura OK
✅ Replay match-def456: 4 turnos, estrutura OK
❌ Replay match-ghi789: JSON inválido (SyntaxError: Unexpected token)
⚠️ Replay match-jkl012: total_turns=5 mas replay tem 3 turnos (divergência)

Resultado: 17/19 válidos, 2 problemas
```

---

## Ferramentas do navegador (`testes/browser/`)

Páginas HTML standalone — abrir diretamente no browser, sem servidor necessário para as visuais; com servidor para as que usam socket.

---

### 1. `board-preview.html` — Visualizador de board

**Para que serve:** Renderizar qualquer configuração de tabuleiro 4×4 sem precisar de uma partida real. Útil para debugar renderização de peças, highlights, e states visuais.

**Interface:**
```
[ Cole estado JSON aqui ]       [RENDERIZAR]

┌─┬─┬─┬─┐
│♔│ │ │ │   ← board renderizado
│ │ │ │ │
│ │ │ │♚│
│ │ │ │ │
└─┴─┴─┴─┘

Estado: 2 peças | Fase: ACTION
```

**Input (JSON):**
```json
{
  "army": [
    {"id":"wk1","type":"K","x":0,"y":0,"color":"white","bonus":2},
    {"id":"bk1","type":"K","x":3,"y":2,"color":"black","bonus":2}
  ],
  "phase": "ACTION",
  "planning": { "white": null, "black": null }
}
```

---

### 2. `i18n-checker.html` — Verificador de traduções

**Para que serve:** Detectar chaves faltando entre os 9 idiomas (PT/EN/ES/DE/IT/RU/JA/KO/ZH).

**Como funciona:** Faz `fetch('/')` para obter o `index.html`, extrai o objeto `T` via regex, e compara as chaves de cada idioma contra PT (idioma base).

**Output:**
```
PT: 142 chaves (base)

EN: 142/142 ✅
ES: 139/142 ⚠️  Faltam: sd_subtitle, pdl_draw, unranked_match
DE: 135/142 ⚠️  Faltam: sd_subtitle, pdl_draw, ...
IT: 137/142 ⚠️  ...
RU: 130/142 ❌  Faltam: 12 chaves
JA: 128/142 ❌  ...
KO: 127/142 ❌  ...
ZH: 127/142 ❌  ...
```

> Requer servidor rodando para o `fetch('/')`.

---

### 3. `duel-sim.html` — Simulador de duelos

**Para que serve:** Testar a lógica de duelos com dados controlados — verificar bonuses, empates, resultados.

**Interface:**
```
PEÇA BRANCA          PEÇA PRETA
Tipo: [Q ▾]          Tipo: [K ▾]
Bônus: 5             Bônus: 2

Dado Branco: [4]     Dado Preto: [3]
Total: 4+5 = 9       Total: 3+2 = 5

[ SIMULAR ]

Resultado: ♕ BRANCA VENCE (9 > 5)
```

**Casos especiais testáveis:**
- Empate exato (mesmo total) → ambos eliminados
- Rei vs Rainha (bonus 2 vs 5) → Rainha provavelmente ganha
- 1000 simulações aleatórias → distribuição esperada por tipo

---

### 4. `mmr-calculator.html` — Calculadora ELO/PdL

**Para que serve:** Simular ganhos/perdas de MMR e PdL para qualquer cenário.

**Interface:**
```
JOGADOR A                  JOGADOR B
MMR: [1500]               MMR: [1800]
Rank: Cavaleiro II        Rank: Torre I
PdL: [45]                 PdL: [80]
Shield: [0]               Shield: [1]

Resultado: [Vitória A ▾]  [CALCULAR]

─────────────────────────────────────
RESULTADO
Jogador A: +22 MMR | +18 PdL → Cavaleiro II · 63 PdL
Jogador B: -22 MMR | -15 PdL → Torre I · 65 PdL (shield consumido)

Em caso de EMPATE:
Jogador A (fraco): +3 MMR | +3 PdL → 48 PdL
Jogador B (forte):  -3 MMR |  0 PdL → 80 PdL (sem perda)
```

---

### 5. `socket-inspector.html` — Monitor de eventos

**Para que serve:** Conectar ao servidor e exibir todos os eventos socket em tempo real — essencial para debugar sequências de fase, broadcasts inesperados, e payload de eventos.

**Interface:**
```
URL: [http://localhost:3000]  Token: [___________]  [CONECTAR]

STATUS: ● Conectado  |  Socket ID: abc123

┌─────────────────────────────────────────────────────┐
│ ← game_state  { phase: "DRAFT", army: [...] }       │
│ → draft_buy   { type: "Q" }                         │
│ ← game_state  { phase: "DRAFT", army: [...] }       │
│ ← match_found { roomId: "ABCD", color: "white" }    │
└─────────────────────────────────────────────────────┘

[LIMPAR]  [COPIAR JSON]  [FILTRAR: _______]
```

**Funcionalidades:**
- Filtrar eventos por nome
- Emitir eventos manualmente (campo de texto + botão ENVIAR)
- Exportar log como `.json`
- Destacar eventos de erro em vermelho

---

### 6. `phase-stepper.html` — Simulador de fases

**Para que serve:** Avançar manualmente pelo fluxo de fases com um estado mockado — sem precisar de dois jogadores. Útil para testar a renderização de cada fase isoladamente.

**Interface:**
```
Fase atual: [DRAFT ▾]   Cor local: [white ▾]   [APLICAR ESTADO]

Board renderizado com o estado atual

Ações disponíveis:
  [Simular draft_buy Q]  [Simular draft_ready]
  [Avançar para POSITION]

Log de eventos disparados:
  game_state recebido: phase=DRAFT
  draft_buy emitido: {type:"Q"}
```

---

## Como priorizar a implementação

| Ferramenta | Valor | Esforço | Prioridade |
|-----------|-------|---------|-----------|
| `unit-movegen.js` | Alto — cobre a regra mais crítica do jogo | Baixo | **1ª** |
| `unit-mmr.js` | Alto — MMR/ELO tem edge cases sutis | Baixo | **1ª** |
| `integration-api.js` | Alto — testa o contrato da API | Médio | **2ª** |
| `db-inspector.js` | Alto — útil no dia a dia | Baixo | **2ª** |
| `socket-inspector.html` | Alto — debug em tempo real | Médio | **2ª** |
| `i18n-checker.html` | Médio — boa para pré-release | Baixo | **3ª** |
| `duel-sim.html` | Médio — visual e educativo | Baixo | **3ª** |
| `scenario-full-game.js` | Alto — regressão automática | Alto | **3ª** |
| `load-matchmaking.js` | Médio — só importa pré-produção | Alto | **4ª** |
| `scenario-reconnect.js` | Médio | Médio | **4ª** |
| `scenario-ban.js` | Baixo — fluxo lento de testar | Alto | **5ª** |
| `replay-validator.js` | Médio — pós-produção | Baixo | **4ª** |
| `mmr-calculator.html` | Médio — visual | Baixo | **3ª** |
| `board-preview.html` | Médio | Baixo | **3ª** |
| `phase-stepper.html` | Médio | Médio | **4ª** |
| `scenario-afk.js` | Baixo — lento (120s) | Alto | **5ª** |

---

## Convenção de saída dos scripts

Todos os scripts Node devem retornar:
- **exit code 0** — todos os testes passaram
- **exit code 1** — pelo menos um teste falhou

Isso permite integrar em CI futuramente:
```bash
node testes/server/unit-movegen.js && echo "OK" || echo "FALHOU"
```
