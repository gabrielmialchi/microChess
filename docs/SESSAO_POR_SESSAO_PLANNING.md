# microChess — Plano de Implementação: Ajustes Pós-Open Test
## Revisado em 2026-06-08

---

## Contexto

Todas as sessões originais (1–18, Design-A..L, SP, PRE-OT-A..G, etc.) estão concluídas.
Este documento cobre o próximo ciclo de ajustes, definido após análise do estado atual do jogo.

Leia `ACTIVITY_LOG.md` para ver o que já foi feito. Leia `PROJECT_CONTEXT.md` para arquitetura atual.

---

## Resumo dos Blocos

| Sessão | Bloco | Tema | Arquivos tocados | Risco |
|--------|-------|------|-----------------|-------|
| ADJ-DESIGN | 5·2·3·1·4 | Ajustes de game design: bot nv1 · Rei dinâmico · promoção · Morte Súbita bo3 · odds na UI | `duel.js`(novo) · `server.js` · `movegen.js` · `01-recruta.js` · `index.html` · `replay-ui.js` | 🟠 Médio |

> Blocos ADJ-A..D (concluídos) arquivados em `_arquivo/docs/SESSAO_POR_SESSAO_PLANNING_concluido.md`.
ADJ-DESIGN: item 2 cria `duel.js` (reusado por 1 e 4) → 2 antes de 1 e 4. Itens 3 e 5 independentes.

---

# SESSÃO ADJ-DESIGN — Ajustes de Game Design

## Objetivo
5 ajustes derivados do estudo de design. Objetivo central: **reduzir a sensação de "sorte pura"
no combate e melhorar a curva do single player**, sem descaracterizar o blefe simultâneo (o coração do jogo).

## Risco: 🟠 Médio — toca o núcleo de combate (`resolveAction`/`finishDuel`). Mitigado por:
- Branch dedicada `ajustes-design`; `main` intocada.
- **1 commit por item** → reversão granular via `git revert <hash>`.
- Toda lógica nova e pura em `server/duel.js` (testável isoladamente); `server.js` recebe só call-sites.
- `node --check` + testes a cada item.

## Decisões travadas (Gabriel, 2026-06-09)
- Morte Súbita: **Variante A** (3 rodadas, conta vitórias, empate de rodadas → DRAW).
- Rei: bônus **dinâmico** por cenário.
- Peão: promoção → **Rainha**.

## Ordem: 5 → 2 → 3 → 1 → 4

---

## ITEM 5 — Bot nível 1 com intenção mínima
**Arquivo:** `bot-strategies/01-recruta.js` (só `chooseAction`).
- [ ] Reunir todos os movimentos legais das peças próprias.
- [ ] ~45%: escolher movimento que minimiza `manhattanDist(destino, findKing(oppColor))` usando peça não-Rei.
- [ ] ~55%: `randomChoice(allMoves)` (mantém erros de iniciante).
- [ ] Sem desvio de ameaça e sem caça a capturas (preserva curva: nível ≥3 que faz isso).
- [ ] Sem movimentos → `action_ready`. Rei inimigo ausente → cai no aleatório.
- [ ] Validar que continua **mais fraco** que nível 2 (que empurra peões sem capturar).

## ITEM 2 — Rei com bônus dinâmico
**Novo:** `server/duel.js` · **Edição:** `server.js` `finishDuel` (linhas ~811-812).
- [ ] `duel.js`: `effectiveBonus(piece, color, duel)`:
      não-Rei → `piece.bonus`; SD → 0; `frontal` → 4; `attack` → (atacante? 5 : 3); fallback 5.
- [ ] `finishDuel`: trocar `d.wPiece.bonus`/`d.bPiece.bonus` por `effectiveBonus(...)`.
- [ ] **Não** mutar o campo `bonus` do Rei (segue 5 p/ ordenação da fila e exibição).
- [ ] Conferir mapeamento: atacante King caso c (730-732)=+5; defensor King (752, follow-up contested_king 868-884)=+3; frontal=+4; SD=+0.

## ITEM 3 — Promoção do Peão → Rainha
**Edição:** `movegen.js` (+`promotePawns`) · `server.js`.
- [ ] `movegen.js`: `promotePawns(army)` → P em fundo oposto vira `type:'Q'`, `bonus:5`, remove `buffed`.
- [ ] Chamar `promotePawns` em `resolveAction` (substitui bloco 765-771) **E** em `finishDuel` (após reposicionar vencedores 826/832) — corrige bug: promoção por captura/duelo nunca disparava.
- [ ] Remover regra morta do "peão buffed" em `movegen.js` (36-38).
- [ ] Replay grava `type:'Q'` corretamente.

## ITEM 1 — Morte Súbita melhor-de-3 (Variante A)
**Edição:** `duel.js` · `server.js` (`roll_dice` humano 1568 + bot 1070 + ramo SD `finishDuel`) · `index.html` (modal) · `replay-ui.js`.
- [ ] Estado SD do duelo: `d.sdWins={white,black}`, `d.round` (1..3), reset de `pressed`/`rolls` entre rodadas.
- [ ] `roll_dice` SD: ao ambos rolarem na rodada → apurar vencedor da rodada, incrementar `sdWins`, avançar rodada; após 3 rodadas → `resolveTime`.
- [ ] `finishDuel` SD: mais vitórias de rodada vence; empate de vitórias → DRAW (reusa 836-848).
- [ ] Bônus dos Reis = 0 (já garantido pelo item 2 via `suddenDeath`).
- [ ] Modal `index.html`: mostrar 3 slots de rodada por lado + placar de rodadas.
- [ ] `replay-ui.js`: exibir resultado da série.

## ITEM 4 — Probabilidade do duelo na UI
**Edição:** `duel.js` (`duelOdds`) · `server.js` (anexar `d.odds`) · `index.html` (modal).
- [ ] `duel.js`: `duelOdds(bA, bB)` → `{win, tie, lose}` pela distribuição `d6 - d6`.
- [ ] Ao montar duelo ativo: `d.odds = duelOdds(effectiveBonus(wPiece,'white',d), effectiveBonus(bPiece,'black',d))`.
- [ ] SD: odds da **série** (P de mais vitórias de rodada), não de 1 dado.
- [ ] `index.html`: renderizar "%" do lado do jogador no modal. Servidor é a única fonte (sem duplicar lógica no cliente).

## Testes (novo `testes/server/duel.test.js` + `movegen.test.js`)
- [ ] `effectiveBonus`: 4 cenários.
- [ ] `duelOdds`: soma 100%, simetria, bate com a tabela do estudo.
- [ ] Série SD: decisão correta + caso de empate.
- [ ] Promoção: peão→Q com bônus 5 e movimentos de Rainha.

## Critério de conclusão
- [ ] Todos os itens commitados (1 commit cada) na branch `ajustes-design`.
- [ ] `npm test` verde + `node --check server.js`.
- [ ] Playtest manual: duelo normal, choque frontal, ataque ao Rei, promoção, Morte Súbita, odds visíveis.
- [ ] Merge em `main` só após validação.
