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

## [2026-06-09] Sessão ADJ-DESIGN-POLISH — Pendências #5–#8 do bloco ADJ-DESIGN
**Status:** ✅ Completo (branch `ajustes-design`) — pendente playtest + merge junto com ADJ-DESIGN

### Itens (1 commit cada)
- [x] **#8** — Bots valorizando o Rei. `combatBonus(type, isAttacker)` em `_helpers.js` (Rei: +5 atq / +3 def); `_minimax.simulateMove` usa combatBonus na predição de duelo. `evaluate` mantém `pieceBonus` (Rei=0 material — correto). **Nova descoberta (fora de escopo):** o modelo de duelo do minimax trata captura de peça parada como duelo, mas no jogo real é auto-captura (atacante sempre vence) — bot evita capturas lucrativas de peças não-Rei. Anotado p/ futuro.
- [x] **#7** — Limpado código `buffed` morto no `index.html`: removido CSS `.piece.buffed`, `classList.add('buffed')` e o ramo buffed do isValidMove do cliente (agora espelha o `movegen.js`).
- [x] **#6** — Fix replay: `buildDuelSnapshot` grava `wPiece`/`bPiece` (id) + `wType`/`bType` explícitos + bônus EFETIVO (importa `effectiveBonus`); `replay-ui` lê `wType`/`bType`. Duelos não mais sempre "Rei vs Rei". Replays antigos: fallback 'K' (sem regressão).
- [x] **#5** — Replay da Morte Súbita: `finishSuddenDeath` grava `sdHistory`; `replay-ui` renderiza a série ("⚔️ Morte Súbita · ♔ 2×1 ♚ · R1 6×1 · R2 1×5 · R3 4×2 · ♔ venceu"). Removido override redundante de bonuses (effectiveBonus já dá 0 na SD).

---

## [2026-06-09] Sessão ADJ-DESIGN — Ajustes de Game Design (5 itens)
**Status:** ✅ Implementação completa (5/5) na branch `ajustes-design` — pendente playtest manual + merge em `main`
**Branch:** `ajustes-design` (dedicada; `main` permanece intocada para reversão segura)

### Origem
Estudo de game design (variância dado vs. perícia). 5 ajustes aprovados pelo Gabriel.
Plano detalhado em `SESSAO_POR_SESSAO_PLANNING.md` → seção "SESSÃO ADJ-DESIGN".

### Decisões travadas
- **Morte Súbita:** Variante **A** — 3 rodadas de 1d6 vs 1d6, vence quem ganhar mais rodadas; empate de rodadas → DRAW (preserva empate como "equilíbrio real"; ~17,8%).
- **Rei bônus dinâmico:** +5 atacante · +4 choque frontal · +3 defensor parado · +0 Morte Súbita.
- **Peão:** promoção ao fundo oposto → vira **Rainha** (bônus 5), não mais "buffed".
- **Estratégia de reversibilidade:** branch dedicada + **1 commit por item**. Erro em um item → `git revert` só daquele commit, sem afetar os demais nem a `main`.

### Itens (ordem de execução: 5 → 2 → 3 → 1 → 4)
- [x] **5** — Bot nível 1 (recruta) com intenção mínima (45% avança p/ Rei inimigo, 55% aleatório). Arquivo: `bot-strategies/01-recruta.js`. ✅ `node --check` OK · 15 testes verdes.
- [x] **2** — Rei bônus dinâmico. Novo módulo `server/duel.js` (`effectiveBonus`); 2 linhas em `finishDuel`. ✅ 7 testes novos em `duel.test.js` · suíte verde. Descoberta: King só entra em DUELO ao atacar outro Rei (case c) ou choque frontal — contra peça comum parada há auto-captura (sem dado).
- [x] **3** — Peão → Rainha. `promotePawns(army)` em `movegen.js`, chamado em `resolveAction` E `finishDuel` (2 pontos de finalização: exit-3 valid-duel + exit final). Bug latente corrigido. Regra morta do peão buffed removida (server). ✅ 8 testes em `movegen.test.js`. Pendência p/ item 4: card de duelo no `index.html` mostra bônus estático do Rei (sempre +5), não o efetivo — corrigir ao enviar odds.
- [x] **1** — Morte Súbita melhor-de-3 (Variante A). ✅ Abordagem simplificada: cada rodada reusa o fluxo de duelo (rolar→resolver); `duel_resolve` roteia p/ `advanceSD` (humano+bot). Novas funções puras em `duel.js` (createSDDuel/judgeSDRound/sdSeriesOver/sdWinner) + `advanceSD`/`finishSuddenDeath` no server. `roll_dice` e `finishDuel` NÃO precisaram mudar. Modal mostra bônus 0 + placar de rodadas. Fix: `lastDuelKey=null` p/ remodal reaparecer entre rodadas (Reis iguais). 6 testes novos. **Desvio:** `replay-ui.js` NÃO tocado — SD grava snapshot (bonuses 0 + sdWins) e o render genérico mostra só a rodada decisiva; refinar depois. Bug pré-existente em replay-ui: lê `wPiece`/`bPiece` mas snapshot grava `wPieceId`/`bPieceId` (todos os duelos aparecem como Rei vs Rei no replay) — fora de escopo.
- [x] **4** — Probabilidade do duelo na UI. ✅ `duelOdds(bW,bB)` no `duel.js`; servidor anexa `effBonus` + `odds` ao duelo ativo via `stateView` (fonte única, cliente só exibe). Modal mostra "🎯 X%" no card do jogador. Também fechou a descoberta #4: card usa bônus EFETIVO do Rei em duelos normais (não mais o estático +5). 4 testes novos (soma 100%, valores da tabela, simetria).

### Follow-up fora de escopo (anotado)
- `_minimax.js`/`_helpers.js` usam `BONUS.K = 0` → bots subestimam o Rei em combate. Não quebra (vitória por morte do Rei é avaliada à parte), mas bots fortes jogam abaixo do ideal em duelos de Rei. Ajustar depois.

### Testes previstos
- Novo `testes/server/duel.test.js`: `effectiveBonus` (4 cenários), `duelOdds` (soma 100%, simetria), série SD (decisão + empate).
- `movegen.test.js`: peão em y=3/y=0 vira Q com bônus 5 e move como Rainha.
- `node --check` a cada item.

---

> Histórico de sessões concluídas arquivado em [`_arquivo/docs/ACTIVITY_LOG_concluido.md`](../_arquivo/docs/ACTIVITY_LOG_concluido.md).
