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

## [2026-06-09] HTP-FIX — Como Jogar: bônus dinâmico do Rei
**Status:** ✅ Completo (main)

### Feito
- Tela Como Jogar mostrava o Rei com `+5` fixo (desatualizado após ADJ-DESIGN item 2).
- Rei agora em bloco próprio (`dk-king-block`) com sub-linhas de condição (≤1 linha cada):
  Rei ataca `+5` · Rei encontra adversário `+4` · Rei é atacado `+3`.
- 3 chaves i18n (`htp_king_atk`/`htp_king_clash`/`htp_king_def`) × 9 idiomas + CSS.
- `renderHowToPlay`: tabela Q/R/N/B/P normal; Rei separado abaixo.

---

## [2026-06-10] ADJ-JUICE — Feedback/Juice de timing
**Status:** 🔄 Em andamento — A, B, C ✅; D parcial (J9/J10 ✅, J11 pendente decisão) (main, sem commit ainda)

### Feito — ADJ-JUICE-A (juice de combate, branch `adj-juice`)
- **J5** impacto de captura: `board-shake` no `.board-container` ao capturar.
- **J6** Morte Súbita: `sd-round-pop` no status ao trocar de rodada.
- **J1** revelação por turno: `reveal-snap` (pulso de brilho) em `#pieces-layer` ao resolver Ação.
- **J7** beat pós-duelo: segura o resultado ~800ms antes de revelar o tabuleiro (queixa do Gabriel).

### Feito — ADJ-JUICE-B (recompensa/fim, branch `adj-juice`)
- **J3** promoção→Rainha: flash dourado (`piece-promote`) ao detectar P→Q no syncBoard.
- **J8** fim de partida: `syncBoard()` anima o rei caindo (+shake) e segura ~850ms antes da tela de fim.

### Feito — ADJ-JUICE-C (pressão/commit, main)
- **J2** urgência do timer: classe `.exc-banner.low-time` — banner de inatividade fica
  vermelho + pulso acelerado (0.45s) nos últimos 5s antes do popup de 60s.
- **J4** trava do PRONTO: snap de "travado" (`ready-lock-snap` + glow `ready-locked`) ao
  confirmar; texto vira "✓ Aguardando Oponente..."; pulso de antecipação (`opp-ready-pulse`)
  no meu botão quando o oponente confirma e eu ainda não.

### Feito — ADJ-JUICE-D parcial (main)
- **J9** compra no Draft: `#my-budget` faz tick-down (`budget-tick`) ao gastar pontos;
  botões da loja com press-pop (`:active` scale).
- **J10** chip de odds "🎯 X%": pop (`duel-odds-pop`) na primeira renderização de cada duelo.
- **J11** hand-off plano→resolução: PENDENTE — avaliar junto com Gabriel se não é redundante
  com `triggerPhaseOverlay`/`triggerReveal` já existentes (overlay de fase + flash + bloom
  no ACTION→REVEAL já cobrem boa parte do "corte seco").

### Origem
Avaliação de game feel: o juice é forte em eventos discretos (entrada/captura/duelo)
mas fraco no tecido conectivo (commit → revelação → resolução) — onde mora o prazer de timing.
Inclui 2 itens apontados pelo Gabriel: beat ao fim do duelo (tela muda rápido demais) e
juice de fim de partida.

### Sessões previstas (CSS + vanilla-JS, cabem na arquitetura atual)
- **ADJ-JUICE-A** (combate): revelação simultânea por turno · impacto de captura · beat pós-duelo · rodadas da Morte Súbita
- **ADJ-JUICE-B** (recompensa/fim): promoção→Rainha · sequência de fim de partida
- **ADJ-JUICE-C** (pressão/commit): urgência do timer · trava do PRONTO
- **ADJ-JUICE-D** (micro-polimento): compra no draft · chip de odds · hand-off plano→resolução

### Notas para próxima sessão
- Confirmar com Gabriel a ordem/prioridade das sessões A–D antes de implementar.
- Manter padrão: branch + 1 commit por item, reversível.

---

## [2026-06-10] BUG-PRONTO — Confirmação de PRONTO incompleto
**Status:** ✅ Implementado (main, sem commit ainda) — aguardando teste/aprovação

### Bug reportado (Gabriel)
Na fase ACTION, dá pra clicar PRONTO sem ter planejado nenhum movimento (peça
selecionada e não movida, ou nada selecionado). Mesma falta de aviso valia para
DRAFT (pontos não gastos) e POSITION (peças não posicionadas).

### Decisão final (revisão): popup de confirmação em vez de travar o botão
PRONTO continua sempre clicável. Se faltar algo, abre popup in-game (mesmo
estilo de `inactivity-self-popup`):
- DRAFT: "Você ainda tem pontos para usar." / "Deseja seguir sem usar os pontos?"
- POSITION: "Você ainda tem peças não posicionadas." / "Deseja seguir sem
  posicionar todas as peças?"
- ACTION: "Você não realizou nenhuma jogada." / "Deseja passar o turno sem mover?"

SIM → emite o ready normal e segue. NÃO → fecha popup, nada é emitido, jogador
corrige.

### Feito
- `#confirm-incomplete-popup` (HTML, perto de `return-to-game-popup`).
- 6 chaves i18n × 9 idiomas: `confirm_draft_pts/_sub`,
  `confirm_position_pieces/_sub`, `confirm_action_move/_sub`.
- `setReady()`: checa `state.budget`/`state.inventory`/`state.planning` antes
  de emitir; `confirmIncompleteYes/No` controlam o popup.
- Sem mudanças em `server.js`. Sem risco de soft-lock (PRONTO nunca desabilita).

---

## [2026-06-10] Painel de testes (stats/export/janela) — preparação para teste de carga

### Feito
- `server/admin.js` (novo): `/api/admin/stats` (CCU, fila, salas ativas — protegido por `ADMIN_TOKEN`),
  `/api/admin/export` (dump JSON de players/matches/events/ccu_snapshots/singleplayer_progress),
  `checkTestWindow()` (janela de teste opcional via `TEST_WINDOW_START`/`TEST_WINDOW_END`).
- `server/server.js`: rotas acima inseridas + checagem da janela em `queue_join`.
- `html/auth-frontend.js`: aviso ao jogador (`socket.on('maintenance')`) quando fora da janela de teste.

### ⚠️ TODO — retomar: Volumes no Railway
- `server/db/microchess.db` é gitignored e **não há volume persistente confirmado** no Railway.
- Sem volume, qualquer redeploy (push/Remove+Redeploy) **zera o banco** (players, matches, events, ccu_snapshots).
- Decisão adiada: configurar volume (Settings → Volumes, mount path `/app/server/db`) quando o projeto
  for além de testes pontuais — avaliar implicações de retenção de dados de usuários antes de ativar.
- Até lá: usar `/api/admin/export` como backup manual antes de qualquer redeploy.

---

> Histórico de sessões concluídas arquivado em [`_arquivo/docs/ACTIVITY_LOG_concluido.md`](../_arquivo/docs/ACTIVITY_LOG_concluido.md).
