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

**Status:** ✅ Implementado na branch `adj-juice` (J5·J6·J1·J7, 1 commit cada) — pendente playtest + merge.

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

**Status:** ✅ Implementado na branch `adj-juice` (J3·J8, 1 commit cada) — pendente playtest + merge.

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

---

# SESSÃO BUG-PRONTO — Confirmação de PRONTO incompleto

## Contexto / Bug reportado (Gabriel, 2026-06-10)
Na fase ACTION, o jogador pode clicar PRONTO sem ter planejado nenhum movimento
(ex.: selecionou uma peça mas não clicou num destino, ou nem selecionou peça
nenhuma). O servidor aceita `action_ready` mesmo com `state.planning[color] ===
null`, então o turno resolve sem que aquele jogador tenha movido peça alguma.
Mesma lógica vale para DRAFT (pontos não gastos) e POSITION (peças não
posicionadas).

## Decisão final de design (revisão 2026-06-10)
Em vez de desabilitar o PRONTO, o botão continua sempre clicável. Se houver
algo incompleto, o clique em PRONTO abre um popup IN-GAME (mesmo padrão visual
de `inactivity-self-popup`/`return-to-game-popup`) perguntando se o jogador
quer mesmo seguir assim:

- **DRAFT** — se `state.budget[myColor] > 0`: "Você ainda tem pontos para usar."
  / "Deseja seguir sem usar os pontos?"
- **POSITION** — se `state.inventory[myColor].length > 0`: "Você ainda tem
  peças não posicionadas." / "Deseja seguir sem posicionar todas as peças?"
- **ACTION** — se `!state.planning[myColor]`: "Você não realizou nenhuma
  jogada." / "Deseja passar o turno sem mover?"

Botões SIM / NÃO (i18n `t('yes')`/`t('no')`, já existentes):
- **SIM** → emite o evento normal (`draft_ready`/`position_ready`/`action_ready`)
  e fecha o popup — segue para a próxima fase normalmente.
- **NÃO** → apenas fecha o popup, nada é emitido — jogador pode corrigir.

Se a condição NÃO se aplica (sem pontos sobrando / sem peças no inventário /
plano já confirmado), PRONTO funciona exatamente como hoje, sem popup.

## J-PRONTO-1 — Popup de confirmação (HTML + CSS)
- [ ] Novo `<div id="confirm-incomplete-popup">` perto de `return-to-game-popup`
  (`html/index.html` ~3045), mesmo estilo visual: título (`#cip-title`),
  subtítulo (`#cip-sub`), botões SIM (`window.confirmIncompleteYes()`) /
  NÃO (`window.confirmIncompleteNo()`).

## J-PRONTO-2 — i18n
- [ ] 6 novas chaves × 9 idiomas (pt/en/es/de/it/ru/ja/ko/zh), perto da chave
  `ready:`/`yes:`/`no:` existente em cada bloco:
  `confirm_draft_pts`, `confirm_draft_sub`, `confirm_position_pieces`,
  `confirm_position_sub`, `confirm_action_move`, `confirm_action_sub`.

## J-PRONTO-3 — Lógica em `setReady()`
- [ ] `html/index.html`, `window.setReady()`: antes de emitir o evento de
  ready de cada fase, checar a condição correspondente; se incompleta, guardar
  a ação pendente (`_pendingReadyAction`), preencher título/subtítulo via `t()`
  e exibir o popup — sem emitir nada ainda.
- [ ] `confirmIncompleteYes()`: emite `_pendingReadyAction`, fecha popup, limpa
  variável.
- [ ] `confirmIncompleteNo()`: só fecha popup, limpa variável (nada emitido).

## Risco e compatibilidade
- 🟢 Front-end apenas (`html/index.html`) — nenhuma mudança em `server.js`,
  nenhuma mudança no fluxo padrão quando tudo está completo.
- 🟢 Sem risco de soft-lock — PRONTO nunca fica desabilitado; o jogador sempre
  pode confirmar SIM e seguir, mesmo sem mover/comprar/posicionar.
- Comportamento "passar a vez" continua existindo, mas agora é uma decisão
  consciente (popup de confirmação) em vez de acidental.

## Critério de conclusão
- [ ] DRAFT/POSITION/ACTION: clicar PRONTO com algo incompleto abre o popup com
  a mensagem certa.
- [ ] SIM segue normalmente; NÃO cancela e fecha o popup sem efeito.
- [ ] Sem popup quando tudo está completo (comportamento atual preservado).
- [ ] Textos traduzidos nos 9 idiomas.
- [ ] Playtest: partida completa do início ao fim sem regressão.
