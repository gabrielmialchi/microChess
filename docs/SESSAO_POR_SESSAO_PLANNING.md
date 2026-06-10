# microChess — Plano de Implementação: Ajustes Pós-Open Test
## Revisado em 2026-06-09

---

## Contexto

Bloco ADJ-DESIGN (5 ajustes de game design) + POLISH concluídos e mergeados na `main`.
Plano detalhado desses concluídos: `_arquivo/docs/SESSAO_POR_SESSAO_PLANNING_concluido.md`.

Este documento cobre o próximo ciclo: **ADJ-JUICE** (feedback/game feel de timing).
Leia `ACTIVITY_LOG.md` para o estado atual. `PROJECT_CONTEXT.md` para arquitetura.

---

## Resumo dos Blocos

| Sessão | Tema | Arquivos tocados | Risco |
|--------|------|-----------------|-------|
| ADJ-JUICE-A | Juice de combate: revelação por turno · impacto de captura · beat pós-duelo · rodadas SD | `index.html` (CSS+JS) | 🟠 Médio |
| ADJ-JUICE-B | Recompensa/fim: promoção→Rainha · sequência de fim de partida | `index.html` | 🟢 Baixo |
| ADJ-JUICE-C | Pressão/commit: urgência do timer · trava do PRONTO | `index.html` | 🟢 Baixo |
| ADJ-JUICE-D | Micro-polimento: compra no draft · chip de odds · hand-off plano→resolução | `index.html` | 🟢 Baixo |

> Blocos ADJ-A..D e ADJ-DESIGN (concluídos) arquivados em `_arquivo/docs/`.

Princípios: tudo em CSS `@keyframes` + toggle de classe (reusar vocabulário existente:
`piece-enter`, `piece-capture`, `reveal-flash`, `reveal-bloom`, `winner-radiate`, `result-pop`,
`phase-title-pop`). Sem sons. Sem libs. Branch dedicada + 1 commit por item.

---

# SESSÃO ADJ-JUICE-A — Juice de combate

## Objetivo
Dar peso e ritmo ao ciclo commit → revelação → resolução, onde mora o "prazer de timing".

## J1 — Revelação simultânea por turno (Tier 1)
- [ ] Hoje `reveal-flash`+`reveal-bloom` disparam só 1x (POSITION→ACTION). Disparar um
      micro-flash + freeze (~150-200ms) **a cada turno** quando ambos confirmam, antes das peças moverem.
- [ ] Reusar `triggerReveal()` / `reveal-flash` numa versão curta no início da resolução de ACTION.

## J5 — Impacto de captura (Tier 2)
- [ ] A vítima já some bem (`piece-capture`). Falta impacto no tabuleiro/vencedor.
- [ ] Micro-shake do `#main-board` (~120ms, translate pequeno) ou recoil-pulse na peça vencedora.

## J7 — Beat ao fim do duelo (apontado pelo Gabriel: "tela muda rápido demais")
- [ ] Após `finishDuel`/`advanceSD`, segurar o resultado um instante antes de transicionar
      (atraso curto no fechamento do modal / no próximo broadcast renderizado).
- [ ] Garantir que o resultado do dado fique legível (vencedor pulsando) antes do corte.

## J6 — Ritmo entre rodadas da Morte Súbita (NOVO de ADJ-DESIGN)
- [ ] Entre rodadas o modal esconde/reaparece de forma abrupta.
- [ ] Slam "RODADA 2/3" + placar (`sdWins`) pulsando ao atualizar.

---

# SESSÃO ADJ-JUICE-B — Recompensa e fim

## J3 — Promoção do Peão → Rainha (Tier 1, feature nova sem juice)
- [ ] Detectar `type` mudando de P→Q no `syncBoard` e aplicar burst na casa
      (reusar linguagem de `winner-radiate` + scale-pop). Pico emocional hoje mudo.

## J8 — Sequência de fim de partida (apontado pelo Gabriel)
- [ ] Revisar pacing do game over: resultado → stats → recompensa (MMR/LP/promoção) em
      sequência com build-up, em vez de aparecer tudo de uma vez / rápido demais.
- [ ] Reusar `go-in`, `go-result`, `ov-content-slam`, toast de MMR.

---

# SESSÃO ADJ-JUICE-C — Pressão e commit

## J2 — Urgência do timer (Tier 1)
- [ ] Não existe feedback de tempo acabando. Classe `.low-time` (cor→vermelho + pulso
      acelerando) abaixo de ~10s; banner de inatividade (50s) com "batimento".
- [ ] Confirmar onde o tempo é mostrado durante o turno (ver rework de inatividade ADJ-B).

## J4 — Trava do PRONTO (Tier 2)
- [ ] Apertar PRONTO só troca texto + desabilita. Adicionar snap de "travado"
      (✓/cadeado + glow). Pulso no meu lado quando o **oponente** confirma (anticipation).

---

# SESSÃO ADJ-JUICE-D — Micro-polimento

## J9 — Compra no Draft (Tier 3)
- [ ] Número do orçamento com tick-down ao comprar; botão da loja com press-pop.

## J10 — Chip de odds "🎯 X%" (Tier 3, feature nova)
- [ ] Entra estático; adicionar fade/pop ao abrir o duelo.

## J11 — Hand-off plano→resolução (Tier 3)
- [ ] Corte seco entre planejar e assistir; dim do tabuleiro + flash curto para separar as fases.

---

## Critério de conclusão (por sessão)
- [ ] Itens commitados (1 commit cada) na branch.
- [ ] Sem regressão de performance (animações GPU-friendly: transform/opacity).
- [ ] Playtest manual do "feel" de cada momento.
- [ ] Merge em `main` após validação do Gabriel.
