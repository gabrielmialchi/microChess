# Planejamento de Sessões — Otimizações e Ferramentas de Teste
> Documento de referência para as próximas sessões de implementação.
> Leia GUIA_DE_OTIMIZACAO.md e FERRAMENTAS_DE_TESTE.md antes de iniciar cada sessão.

---

# PARTE 1 — OTIMIZAÇÕES DE PERFORMANCE

## Visão geral

| Sessão | Tema | Esforço | Impacto | Risco |
|--------|------|---------|---------|-------|
| OPT-A | Twemoji + Fontes + GZIP | ~45min | Alto | 🟢 Baixo |
| OPT-B | Animação: transform vs left/top | ~1.5h | Alto (mobile) | 🟠 Médio-alto |
| OPT-C | flag-icons + SW + Socket + CSS hints | ~1h | Médio | 🟡 Médio |

---

# SESSÃO OPT-A: GANHOS RÁPIDOS

## Objetivo
Remover peso morto e ativar compressão — máximo impacto com mínimo esforço.
Redução esperada: ~60% no tamanho do carregamento inicial.

## Risco: 🟢 Baixo

## Ler antes de iniciar
- `docs/GUIA_DE_OTIMIZACAO.md` itens 2, 3, 4

## Checklist

```
[ ] 1. Remover tag Twemoji de index.html (linha ~1698)
       PRÉ: grep -n "twemoji\." html/index.html → deve retornar vazio (zero usos)
       AÇÃO: remover <script src="twemoji...">

[ ] 2. Reduzir pesos de fonte no Google Fonts URL (index.html linha 14)
       Cinzel:         400;600;700;900  →  400;700
       Inter:          300;400;500;600;700;800  →  400;600
       JetBrains Mono: 400;500;600;700  →  400;600
       Cinzel Decorative: 700 → manter
       IBM Plex Mono:  400;600 → manter

[ ] 3. Instalar e ativar middleware compression no servidor
       TERMINAL: cd server && npm install compression
       server.js — após os requires:
         const compression = require('compression');
       server.js — antes do primeiro app.use():
         app.use(compression());

[ ] 4. node --check server/server.js → OK

[ ] 5. Testar: DevTools → Network → index.html → Headers
       → Content-Encoding: gzip deve aparecer
       → Script twemoji não deve aparecer em nenhuma requisição
```

## Critério de sucesso
- `Content-Encoding: gzip` nos headers de resposta
- Script Twemoji ausente
- Google Fonts URL sem pesos 300/500/800/900

---

# SESSÃO OPT-B: ANIMAÇÃO DE PEÇAS (transform vs left/top)

## Objetivo
Mover o posicionamento de peças de `left/top` (layout recalc a cada frame) para
`transform: translate()` via CSS custom properties (compositor GPU — sem reflow).

## Risco: 🟠 Médio-alto — toca renderização central das peças e animações existentes

## Ler antes de iniciar
- `html/index.html` linhas 520–600 (CSS .piece, keyframes piece-enter, piece-capture)
- `html/index.html` linhas 4520–4560 (syncBoard — onde left/top são definidos)

## Conceito-chave
Usar CSS custom properties `--px` e `--py` para separar posição de efeitos de animação:
```css
.piece { transform: translate(var(--px, 0%), var(--py, 0%)); }
```
Os keyframes de animação composem com a posição incluindo o translate base em cada frame.
As porcentagens em `translate()` são relativas ao próprio elemento (que tem width/height=25%
do board), portanto `translate(100%, 0%)` = move 1 célula para a direita.

## Checklist

```
[ ] 1. CSS .piece — alterar posicionamento base:
       Adicionar:  left: 0; top: 0;
       Adicionar:  transform: translate(var(--px, 0%), var(--py, 0%));
       Substituir: will-change: left, top  →  will-change: transform;
       Substituir: transition: left 0.45s ..., top 0.45s ...
               →  transition: transform 0.45s cubic-bezier(0.34,1.15,0.64,1),
                              opacity 0.25s ease, filter 0.25s ease;
       (remover "transform 0.2s ease" da transition — transform já está no topo)

[ ] 2. Reescrever @keyframes piece-enter para incluir translate base em cada frame:
         0%   { transform: translate(var(--px,0%),var(--py,0%)) scale(0.25) translateY(-15%); opacity:0; filter:brightness(4); }
         55%  { transform: translate(var(--px,0%),var(--py,0%)) scale(1.12) translateY(-2%); opacity:1; }
         80%  { transform: translate(var(--px,0%),var(--py,0%)) scale(0.97) translateY(0); }
         100% { transform: translate(var(--px,0%),var(--py,0%)) scale(1) translateY(0); }

[ ] 3. Reescrever @keyframes piece-capture analogamente:
       Cada frame: translate(var(--px,0%),var(--py,0%)) + escala/rotação existente

[ ] 4. syncBoard() — substituir el.style.left / el.style.top por custom properties:
       Ocorrência 1 (criação — linha ~4530):
         el.style.left = `${visualX * 25}%`;  →  el.style.setProperty('--px', `${visualX * 100}%`);
         el.style.top  = `${visualY * 25}%`;  →  el.style.setProperty('--py', `${visualY * 100}%`);
       Ocorrência 2 (movimento — linha ~4552):
         el.style.left = `${visualX * 25}%`;  →  el.style.setProperty('--px', `${visualX * 100}%`);
         el.style.top  = `${visualY * 25}%`;  →  el.style.setProperty('--py', `${visualY * 100}%`);

[ ] 5. Verificar reset de transform na restauração de peça (linha ~4547):
       el.style.transform = '';
       → Substituir por: el.style.removeProperty('transform'); (não interferir com o translate base)
       OU remover completamente se o custom property já define a posição correta

[ ] 6. Teste visual — partida completa:
       [ ] Peças aparecem nas posições corretas (branco em baixo, preto em cima)
       [ ] Animação de entrada (piece-entering) funciona ao posicionar
       [ ] Movimento de peça tem spring animation suave
       [ ] Captura tem animação correta

[ ] 7. DevTools Performance — gravar movimento de peça:
       → Deve mostrar apenas "Composite" (verde) — sem "Layout" ou "Paint" amarelo/vermelho
```

## Critério de sucesso
- Zero "Layout" triggered durante animação de peça no Chrome DevTools Performance
- Animações de entrada e captura preservadas visualmente

---

# SESSÃO OPT-C: MELHORIAS MÉDIAS

## Objetivo
Flag-icons inline (eliminar 60kb de CSS), versionar Service Worker, compressão
Socket.io, hints de renderização CSS.

## Risco: 🟡 Médio

## Checklist

```
[ ] 1. flag-icons inline — substituir CDN por CSS mínimo
       Bandeiras necessárias: fi-br, fi-gb, fi-es, fi-de, fi-it, fi-ru, fi-jp, fi-kr, fi-cn
       Remover: <link rel="stylesheet" href=".../flag-icons.min.css">
       Adicionar no <style> do head as classes base .fi, .fis e as 9 bandeiras
       Cada bandeira: background-image com URL CDN individual do flag-icons
       (ex: https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/br.svg)
       Verificar visualmente: botões de idioma na tela de Configurações

[ ] 2. Service Worker — versionar cache
       html/sw.js linha 3:
         const CACHE_NAME = 'microchess-v1';
       →
         const CACHE_NAME = 'microchess-20260419';
       Atualizar data a cada deploy com mudanças significativas

[ ] 3. Socket.io — ativar perMessageDeflate
       server/server.js:
         const io = new Server(server, {
             cors: { origin: process.env.ALLOWED_ORIGIN || '*' },
             perMessageDeflate: { threshold: 1024 },
         });

[ ] 4. CSS — contain nas células
       Regra .mc-board .cell (linha ~221):
       Adicionar: contain: layout style;

[ ] 5. Preload da fonte Cinzel
       No <head>, após as tags <link rel="preconnect">:
       <link rel="preload" as="style"
             href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap">

[ ] 6. node --check server/server.js → OK
[ ] 7. Testar flags visíveis, jogo funcional, SW versão nova no DevTools → Application → Cache
```

---

# PARTE 2 — FERRAMENTAS DE TESTE

## Visão geral

| Sessão | Tema | Esforço | Requer Servidor |
|--------|------|---------|-----------------|
| TESTES-A | Unit tests + db-inspector | ~2h | Não |
| TESTES-B | Integration API + partida automatizada | ~3h | Sim |
| TESTES-C | 6 ferramentas de navegador | ~3h | Parcialmente |
| TESTES-D | Cenários avançados + carga + replay validator | ~4h | Sim |

---

# SESSÃO TESTES-A: UNIT TESTS + DB INSPECTOR

## Objetivo
Criar `testes/server/` com 4 testes unitários e o inspetor de banco.

## Risco: 🟢 Baixo

## Nota sobre movegen.js
`isValidMove` não é exportada por `server.js`. Extrair para `server/movegen.js`,
fazer `server.js` fazer `require('./movegen')`. Isso não quebra nada — extração pura.

## Checklist

```
[ ] 1. Criar server/movegen.js — extrair isValidMove + isPathClear de server.js
       server.js passa a fazer: const { isValidMove, isPathClear } = require('./movegen');

[ ] 2. testes/server/unit-movegen.js
       Importar de ../../server/movegen
       Cobrir todos os tipos (K,Q,R,B,N,P normal e buffed)
       Casos: fora do tabuleiro, mesmo lugar, peça amiga no destino,
              bloqueio de caminho (Q/R/B), Cavalo pula peças

[ ] 3. testes/server/unit-mmr.js
       Importar de ../../server/mmr
       Casos: vitória simétrica delta≈16, vitória fraco-vs-forte delta maior,
              empate igual delta=0, empate fraco ganha ≥1, todos os 6 ranks,
              getBanDuration para 0/2/3/5/7

[ ] 4. testes/server/unit-elo.js
       Importar de ../../server/elo
       Casos: promoção (LP≥100), rebaixamento com escudo (não rebaixa, consome shield),
              rebaixamento sem escudo (rebaixa), rank máximo sem promoção além,
              getEloDisplay retorna name/icon/lp

[ ] 5. testes/server/unit-auth.js
       process.env.JWT_SECRET = 'test-secret-apenas-testes';
       Importar server/auth
       Casos: sign → verify round-trip (payload preservado), token adulterado → erro,
              campo uid preservado

[ ] 6. testes/server/db-inspector.js
       Importar server/db/database.js
       Exibir: top 10 jogadores por MMR, 5 partidas recentes, count de replays,
               lista de jogadores banidos, lista com wo_count >= 3
       Saída formatada e legível no terminal

[ ] 7. Rodar todos: node testes/server/unit-movegen.js (deve mostrar só ✅)
       node testes/server/unit-mmr.js
       node testes/server/unit-elo.js
       node testes/server/unit-auth.js
       node testes/server/db-inspector.js (requer db existente)
```

---

# SESSÃO TESTES-B: INTEGRATION + SCENARIO FULL GAME

## Objetivo
Testes que requerem servidor ativo: endpoints HTTP e partida completa via socket.

## Risco: 🟡 Médio

## Pré-requisito
```
mkdir testes && cd testes && npm init -y && npm install socket.io-client
```

## Checklist

```
[ ] 1. testes/package.json — inicializar com socket.io-client

[ ] 2. testes/server/integration-api.js
       PRÉ-REQUISITO: servidor em http://localhost:3000
       Fluxo completo:
         health check → register → login → login errado (espera 401) →
         leaderboard (espera array) → GET /player/me (autenticado) →
         change-password → delete account (cleanup)
       Cada assert: ✅ ou ❌ com valor recebido vs esperado
       Resumo final: N/M testes passaram
       Usar email com timestamp único para evitar conflito em múltiplas execuções

[ ] 3. testes/server/scenario-full-game.js
       Dois sockets (BOT_A branco, BOT_B preto) criados via socket.io-client
       BOT_A: queue_join → match_found → game_join → draft_buy P → draft_ready
              → position_place(0,0) → position_ready
              → loop ACTION: encontrar peça com move válido → action_plan → action_ready
              → duel se houver: roll_dice
       BOT_B: espelho, cor preta (position em y=3)
       Critério: phase=GAMEOVER em < 120s
       Timeout de segurança com mensagem de deadlock
       Logar cada fase + duração

[ ] 4. Rodar: node testes/server/integration-api.js
              node testes/server/scenario-full-game.js
       Ambos com servidor rodando em paralelo
```

---

# SESSÃO TESTES-C: FERRAMENTAS DE NAVEGADOR

## Objetivo
6 páginas HTML standalone para debug visual e análise em tempo real.

## Risco: 🟢 Baixo

## Checklist

```
[ ] 1. testes/browser/board-preview.html
       Textarea: cole JSON de army
       Board 4x4 renderizado com Unicode (independente do CSS do jogo)
       Botões: exemplo "Início", "Morte Súbita", "Apenas Reis"
       Legenda: qual peça é de qual cor
       Funciona offline

[ ] 2. testes/browser/duel-sim.html
       Dropdowns: tipo peça branca / preta (K/Q/R/B/N/P)
       Bônus auto-preenchido conforme tipo
       Inputs numéricos: dado branco (1–6), dado preto (1–6)
       Botão SIMULAR: exibe resultado com lógica exata (total = dado + bônus, empate = ambos eliminados)
       Botão 1000 SIMULAÇÕES: distribuição de vitórias por combinação
       Funciona offline

[ ] 3. testes/browser/mmr-calculator.html
       Inputs: MMR A, MMR B, elo_rank A (0–13), PdL A, Shield A; mesmos para B
       Resultado para 3 cenários: Vitória A / Vitória B / Empate
       Para cada: Δ MMR, Δ PdL, novo rank, promoção/rebaixamento com/sem escudo
       Lógica ELO implementada localmente (sem fetch)
       Funciona offline

[ ] 4. testes/browser/socket-inspector.html
       Campos: URL servidor + JWT token (opcional)
       Botão CONECTAR / DESCONECTAR
       Log em tempo real: timestamp | ← ou → | nome evento | payload formatado
       Campo emitir evento: nome + JSON payload + botão ENVIAR
       Filtro por nome de evento (input de texto)
       Botões: LIMPAR LOG / COPIAR JSON
       Requer servidor rodando

[ ] 5. testes/browser/i18n-checker.html
       Faz fetch('/') para obter index.html, extrai objeto T via regex
       Tabela: linhas = chaves PT, colunas = 9 idiomas
       Verde = traduzido, vermelho = ausente
       Contador por idioma: "EN: 142/142", "ZH: 127/142"
       Botão exportar CSV
       Requer servidor rodando

[ ] 6. testes/browser/phase-stepper.html
       Dropdowns: fase atual, cor local, número de peças
       Pré-sets: "Início DRAFT", "Posicionamento", "Meio de jogo", "Morte Súbita"
       Renderiza board-preview embutido com estado mock
       Painel lateral: ações disponíveis na fase selecionada
       Funciona offline
```

---

# SESSÃO TESTES-D: CENÁRIOS AVANÇADOS + CARGA + REPLAY VALIDATOR

## Objetivo
Cenários de fluxo completo (reconexão, AFK, ban) e testes de carga.

## Risco: 🟡 Médio — scenario-afk demora 2min; load-matchmaking pode stressar o OS

## Checklist

```
[ ] 1. testes/server/scenario-reconnect.js
       BOT_A e BOT_B → partida via socket
       Aguardar phase=ACTION (ouvir game_state)
       BOT_B: socket.disconnect()
       Verificar BOT_A recebe 'opponent_reconnecting'
       Após 3s: BOT_B reconecta + emite rejoin_game com token
       Verificar BOT_A recebe 'opponent_reconnected'
       Verificar next game_state mantém a partida (não GAMEOVER)

[ ] 2. testes/server/scenario-afk.js
       BOT_A joga normalmente; BOT_B entra na fila mas nunca emite draft_ready
       Aguardar 125s (timeout DRAFT = 120s + 5s margem)
       Verificar BOT_A recebe GAMEOVER com vitória por WO
       Verificar banco: wo_count de BOT_B incrementou
       AVISO no início do script: "Este teste demora ~2 minutos"

[ ] 3. testes/server/scenario-ban.js
       Criar conta de teste (email único com timestamp)
       Executar scenario-afk 3x com essa conta como BOT_B
       Tentar queue_join → verificar evento 'banned' recebido
       Calcular duração do ban: ban_until - now ≈ 30min (±2min aceitável)
       Cleanup: delete account ao final

[ ] 4. testes/server/load-matchmaking.js
       Parâmetro via argv: N_PAIRS (padrão 10)
       node testes/server/load-matchmaking.js --pairs 10
       Criar N_PAIRS*2 sockets, todos queue_join simultâneo
       Medir tempo até match_found em cada par
       Relatório: média, mediana, p95, máximo, erros
       AVISO: não usar N_PAIRS > 20 sem ajustar ulimit

[ ] 5. testes/server/replay-validator.js
       Importar server/db/database.js
       SELECT todos os replays com JOIN em matches
       Para cada: JSON.parse → validar array de turnos → cada turno tem turn/planning/armyAfter
       Cruzar length do array com matches.total_turns
       Verificar: sem IDs de peça duplicados em armyAfter
       Relatório final: N válidos, M com problema
       Exit code 1 se qualquer replay inválido
```

---

# PARTE 3 — MANUAL DE USUÁRIO

Ver: `docs/MANUAL_FERRAMENTAS_TESTE.md`
