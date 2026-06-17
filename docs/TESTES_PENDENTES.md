# microChess — Testes Pendentes

> **Como usar este documento**
> - 🟢 **Não-bloqueante** → acumula aqui; testa tudo de uma vez na rodada de QA.
> - 🔴 **Bloqueante** → Claude sinalizará no chat antes de continuar; precisa de confirmação.
>
> **PRÉ-REQUISITO GLOBAL:** servidor rodando em `npm run dev` (pasta `server/`), acesso via `localhost:3000`.

---

## 🔴 Bloqueantes (sinalizado no chat antes de prosseguir)

*Nenhum no momento.*

---

## 🟢 Não-bloqueantes (testar todos de uma vez)

### T-S03-1 — Ranked só pareia com Ranked
**Sessão:** S03 | **Arquivo:** `server/server.js`

1. Aba A entra na fila como **Casual**; Aba B entra como **Ranked**
   → **Esperado:** partida NÃO começa (ficam em fila separada)
2. Aba C entra como **Ranked**
   → **Esperado:** B e C se emparelham; A continua esperando

---

### T-S17-1 — Reconexão mid-game restaura partida
**Sessão:** S17 | **Arquivo:** `html/index.html`, `server/server.js`

1. Duas abas logadas, iniciar PvP, chegar ao DRAFT ou POSITION
2. Aba do Jogador A: `F5` (refresh)
   → **Esperado para B:** banner vermelho no topo com countdown de 90s
   → **Esperado para A:** ao recarregar, game-area aparece diretamente com o tabuleiro no estado atual
3. Com o banner visível no B, aguardar ~5s e recarregar A novamente
   → **Esperado:** banner some no B; ambos voltam a jogar

---

### T-S17-2 — WO por timeout de reconexão
**Sessão:** S17 | **Arquivo:** `server/server.js`

1. Jogador A desconecta e **não** reconecta
2. Aguardar 90s
   → **Esperado:** Jogador B recebe tela de VOCÊ GANHOU (W.O.); ao recarregar A vê menu ou tela de fim

---

### T-S17-3 — Reconexão de convidado (token de sessão)
**Sessão:** S17

1. Jogar sem conta (convidado), desconectar e reconectar dentro de 90s
   → **Esperado:** volta à partida em andamento (mesmo comportamento de usuário logado)
   → Se falhar: checar `sessionStorage` → Application → `mc_reconnect_token` no DevTools

---

### T-S02-1 — Taxonomia de resultado no banco
**Sessão:** S02 | **Arquivo:** `server/server.js`

*(Requer acesso ao banco SQLite — `server/db/microchess.db`)*

1. Terminar uma partida ranked com vitória normal
   → `SELECT result FROM matches ORDER BY created_at DESC LIMIT 1` → deve ser `white` ou `black`
2. Jogar Morte Súbita até empate (0×0 nos dados)
   → `result` deve ser `draw_rule` (não `draw`)
3. Ambos inativos em ACTION até timeout duplo
   → `result` deve ser `draw_inactivity`

---

### T-S16-1 — Botão ABANDONAR visível e funcional
**Sessão:** S16 | **Arquivo:** `html/index.html`

1. Iniciar qualquer partida (PvP ou Solo)
   → **Esperado:** "ABANDONAR PARTIDA" aparece abaixo do botão PRONTO durante toda a partida
2. Clicar ABANDONAR → popup de confirmação abre
3. Clicar CANCELAR → popup fecha, jogo continua normalmente

---

### T-S16-2 — Abandonar no pré-jogo (DRAFT/POSITION) → cancelamento
**Sessão:** S16 | **Arquivo:** `html/index.html`, `server/server.js`

1. Duas abas, PvP, fase de DRAFT
2. Jogador A clica ABANDONAR → confirma SIM
   → **Esperado para A:** overlay "PARTIDA CANCELADA" por 2,5s → menu
   → **Esperado para B:** mesmo overlay → menu
   → Nenhum recebe tela de W.O.

---

### T-S16-3 — Abandonar em ACTION → W.O.
**Sessão:** S16

1. Chegar à fase ACTION em PvP
2. Jogador A abandona (ABANDONAR → SIM)
   → **Esperado:** B recebe VOCÊ GANHOU; A recebe VOCÊ PERDEU (W.O.)

---

### T-S16-4 — AFK timeout no pré-jogo → cancelamento (não W.O.)
**Sessão:** S16

1. Iniciar PvP, não clicar nada por ~60s → popup de inatividade aparece
2. Não clicar VOLTAR por mais ~90s
   → **Esperado:** partida cancelada (overlay), não W.O.

---

### T-S16-5 — ABANDONAR no Solo
**Sessão:** S16

1. Iniciar modo Solo, clicar ABANDONAR → confirmar SIM
   → **Esperado:** vai direto para menu (sem tela de W.O., sem efeito em ranking)

---

### T-S11-1 — Nickname do oponente no HUD
**Sessão:** S11

1. Iniciar PvP contra outro usuário
   → **Esperado:** `#opp-meta` (abaixo do status do oponente) exibe o nickname dele durante toda a partida
   → Antes mostrava "aguardando…" permanentemente

---

### T-S13-1 — Banner Morte Súbita traduzido
**Sessão:** S13

1. Chegar a uma partida com Morte Súbita ativa
   → **Esperado:** banner laranja no topo lê "⚔ MORTE SÚBITA! — próxima colisão vai direto ao duelo" em PT
2. Trocar o idioma para Inglês (Configurações) e repetir
   → **Esperado:** banner lê "⚔ SUDDEN DEATH! — next collision goes straight to duel"

---

### T-S33-A — ptBR como idioma padrão
**Sessão:** S33

1. Abrir o jogo em aba anônima (sem localStorage) com sistema em inglês
   → **Esperado:** interface em português (não em inglês)
2. Trocar para inglês, fechar e reabrir
   → **Esperado:** continua em inglês (preferência salva respeita)

---

---

### T-S14-1 — Undo granular no Draft
**Sessão:** S14 | **Arquivo:** `html/index.html`, `server/server.js`

1. Iniciar PvP, entrar na fase DRAFT
2. Comprar uma peça (ex: Peão 1pt)
   → **Esperado:** peça aparece no inventário
3. Clicar na peça no inventário
   → **Esperado:** peça some do inventário, 1pt volta ao orçamento (ex: 5pt → 4pt → 5pt)
4. Comprar Rainha (5pt), clicar nela no inventário
   → **Esperado:** 5pt voltam, orçamento volta a 5pt
5. Apertar PRONTO logo depois de desfazer (inventário vazio)
   → **Esperado:** PRONTO continua bloqueado (gate da S01)

---

### T-S22-1 — V/D/E só em ranked (casual não conta)
**Sessão:** S22 | **Arquivo:** `server/server.js`

*(Requer acesso ao banco SQLite — `server/db/microchess.db`)*

1. Jogar e vencer uma partida **Casual**
   → Consultar: `SELECT wins FROM players WHERE username='seu_nick'`
   → **Esperado:** wins **não** incrementou
2. Jogar e vencer uma partida **Ranked**
   → **Esperado:** wins incrementou em 1

---

### T-S10-1 — Timer de fase visível no HUD
**Sessão:** S10 | **Arquivo:** `html/index.html`

1. Iniciar PvP, entrar no DRAFT
   → **Esperado:** abaixo do título da fase (DRAFT), aparece um contador "60s" que vai diminuindo
2. Clicar em qualquer lugar (ex: comprar peça)
   → **Esperado:** timer reseta para "60s"
3. Aguardar sem clicar por ~50s
   → **Esperado:** contador fica vermelho nos últimos 10s (integra J2)

---

## ✅ Já testados e aprovados

| Sessão | Descrição | Testado por |
|--------|-----------|-------------|
| S01 | Gates rígidos do PRONTO | Gabriel (confirmado em sessão) |
| S30+S31 | Render otimista no POSITION + juice | Gabriel (feedback aplicado em S31b/S31c) |
| S31b | Freeze modal duelo 15s + freeze game over | Gabriel (feedback aplicado em S31c) |
| S31c | Dado girando + timer + bug sessão | Gabriel ("Dado e Timer - OK") |
