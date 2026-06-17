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

## [2026-06-17] S04 — Investigação: peças sumindo sem dado (OT-01)
**Status:** ✅ Concluído — gap de clareza, sem bug de código
**Área:** A — Núcleo de partida

### Conclusão
- Código de `resolveAction` revisado (linhas 693–828): captura automática de não-Rei por não-Rei parado
  é **comportamento correto por design** (Case b). Documentado em `htp_capture` do Como Jogar.
- Relatos "3× peças sumindo sem dado" = jogadores não associam a regra à revelação simultânea.
- Não há caminho de código onde captura aconteça incorretamente sem dado.
- Ação de código: nenhuma. Routing: S27 (tutorial interativo) abordará a clareza com demo da regra.

---

## [2026-06-17] S02+S03 — Taxonomia de resultado + modo ranked correto
**Status:** ✅ Implementado — pendente playtest
**Área:** B — Resultado / ranqueada

### Feito
- `server/server.js` `_persistDB`: parâmetro `reason` adicionado à transação;
  catch-all `draw` substituído por `reason || 'draw_rule'` (ranked e casual).
  `isDraw` detecta `draw_rule | draw_inactivity | draw` (legado) — soma no contador de empates.
- Call sites atualizados:
  - `decreeWOForInactivity` dupla inativa → `draw_inactivity`
  - `finishSuddenDeath` empate → `draw_rule`
  - `finishDuel` Kings empatam → `draw_rule`
- `persistMatchResult` aceita `reason = null`; passa para `_persistDB`.
- `queue_join`: troca dequeue-first-two por busca de oponente com mesmo `match_mode`;
  ranked só pareia com ranked, casual só com casual.

### Causa-raiz do OT-18 (ranked não computando)
`roomMode = p1.match_mode` ignorava o modo do p2 — se um jogador entrava casual e outro
ranked, o jogo rodava como casual. Novo fluxo: só pareia quando ambos têm o mesmo modo.

---

## [2026-06-17] S17 — Reconexão mid-game (WO após 90s + banner de DC)
**Status:** ✅ Implementado — pendente playtest
**Área:** C — Inatividade / reconexão

### Feito
- `server/server.js` `rejoin_game`: ordem corrigida — `rejoin_success` enviado ANTES de `game_state`;
  `game_state` agora usa `stateView(room.state, pending.color)` (peças ocultas do oponente nunca
  chegam ao cliente que reconecta).
- `html/index.html` `rejoin_success`: handler restaura contexto completo de jogo:
  seta `inGame=true`, `myColor/oppColor`, `roomID`, reseta `_goShown/resultSaved/lastDuelKey`,
  exibe `#game-area`, esconde tabbar e telas — exatamente como `launchGame()`.
  O `game_state` que chega logo após é processado normalmente (inGame já é true).
- `html/index.html` `opponent_inactive`: substituído show de `inactivity-opp-popup` (AFK) por
  `ExcBanners.showOppDc(remainMs)` — banner correto para queda de conexão, com countdown de 90s.
- `html/index.html` `opponent_returned`: chama `ExcBanners.hideOppDc()` ao reconectar oponente
  (antes apenas habilitava botão que nunca faria sentido no contexto de DC).

### Causa-raiz do bug de reconexão
Servidor mandava `game_state` antes de `rejoin_success`. Cliente tinha `inGame=false` → state
descartado no guard `if (!inGame || !data) return`. Ao receber `rejoin_success`, `state=null`
→ `if (state) updateUI()` não executava. Jogador via menu vazio.

### WO após 90s (já existia no servidor)
`RECONNECT_MS = 90_000` + `pendingReconnects` + `decreeWOForInactivity` já implementados
em sessões anteriores. Esta sessão corrige apenas o retorno do cliente à partida.

---

## [2026-06-16] S31c — Correções do duel modal + bug crítico de sessão
**Status:** ✅ Implementado — pendente playtest
**Área:** A — Núcleo de partida / D — HUD

### Feito
- `html/index.html` resultado do duelo: `rollInterval` agora é limpo junto com `localSincInterval`
  quando `d.resolveTime` está setado — dado de quem rolou primeiro parava de "girar" mas ainda
  sobrescrevia o valor real a cada 90ms.
- `html/index.html` `finishDuel()`: removido o guard `!d.resolveTime` que impedia o modal de
  fechar quando o timer de 15s disparava mas o estado do servidor já tinha mudado. Agora
  sempre fecha o modal; só emite `duel_resolve` se o servidor ainda aguarda.
- `html/index.html` CSS `#close-duel`: botão RESOLVER maior (width 90%, padding 16px,
  font 15px bold) — era pequeno demais para ser o CTA principal.
- `server/server.js` `queue_join`: ao entrar na fila, nullifica `socketId` do jogador na
  sala antiga e reseta `playerRoom/playerColor`. Impede que broadcasts da sala antiga
  (AFK/WO/GAMEOVER) cheguem ao socket do novo jogo via `io.to(oldSocketId)`.
- `server/server.js` `broadcast`: guarda contra `socketId` nulo — `io.to(null)` seria no-op
  mas pode gerar warnings; agora é skip explícito.

### Causa-raiz do bug de sessão
Após refresh+rejoin+nova partida: o socket A2 ficava com `socketId` registrado em Room1
mesmo após entrar em Room2. Quando o AFK timer de Room1 disparava, `broadcast(Room1)`
mandava GAMEOVER via `io.to(A2.id)`. Como `inGame=true` (Room2 já ativa), o cliente
processava o GAMEOVER, mostrava YOU WIN, e o `inGame=false` do S31b fechava a porta para
novos `game_state` do Room2.

---

## [2026-06-16] S31b — Freeze no duelo (15s timer) + freeze no game over (OT-25)
**Status:** ✅ Implementado — pendente playtest
**Área:** A — Núcleo de partida / D — HUD/juice

### Feito
- `html/index.html` `handleDuelUI`: removido auto-close do modal de duelo; após resultado,
  RESOLVER JOGADA exibe countdown regressivo ("RESOLVER JOGADA (15)→(14)→..."); após 15s sem
  input → `finishDuel()` automático. Modal não fecha mais sozinho após 500ms.
- `html/index.html` `finishDuel()`: fecha o modal imediatamente ao clicar (sem esperar round-trip);
  limpa o timer do countdown; reseta flags para próxima rodada (Morte Súbita).
- `html/index.html` `handleDuelUI` duelo ativo: limpa `_duelAutoCloseTimer` ao iniciar novo
  duelo (garante que timer da rodada anterior não dispare na nova).
- `html/index.html` GAMEOVER: `inGame = false` antes de mostrar a tela de fim — impede que
  qualquer `game_state` subsequente do servidor desfaça a tela de WIN/LOSE/DRAW.

---

## [2026-06-16] S30+S31 — Responsividade de input + ajuste de juice (OT-25)
**Status:** ✅ Implementado — pendente playtest do Gabriel
**Área:** A — Núcleo de partida / D — HUD/juice

### Feito
- `html/index.html` `handleCellClick` POSITION: render otimista para `position_place` e
  `position_return` — peça aparece/desaparece do tabuleiro instantaneamente, sem esperar
  o round-trip do servidor. Corrige o "clique que não responde" em redes lentas (OT-25).
- `html/index.html` `handleDuelUI` J7: beat pós-duelo reduzido de 800ms → 500ms
  (elimina a percepção de "demora depois do dado" sem matar o efeito de timing).
- J8 (850ms antes da tela de fim) mantido — adequado para o encerramento de partida.
- J11 (hand-off plano→resolução) **descartado**: J4 já cobre o momento de commit;
  `triggerPhaseOverlay`/`triggerReveal` cobrem a transição ACTION→REVEAL.

### Notas
- render otimista: quando o servidor confirmar via `game_state`, `state = data` sobrescreve
  o estado local — sem divergência possível pois as guardas S01 garantem moves válidos.
- Chaves i18n `confirm_position_pieces/_sub` continuam órfãs (inofensivo, sem risco).

---

## [2026-06-15] S01 — Gates rígidos do PRONTO + guarda de servidor (OT-02)
**Status:** ✅ Implementado (main, working tree) — pendente playtest/validação do Gabriel
**Área:** A — Núcleo de partida

### Feito
- `html/index.html` `updateUI()`: gate do PRONTO — desabilitado em DRAFT com 0 peças e em
  POSITION com peças ainda no inventário (habilita só quando ≥1 comprada / todas posicionadas).
- `html/index.html` `setReady()`: removido o popup de POSITION do BUG-PRONTO; mantidos o popup
  de pontos (Draft) e "passar sem mover" (Action) + guardas defensivas.
- `server/server.js`: `draft_ready` rejeita inventário vazio; `position_ready` rejeita peças
  não posicionadas. `node --check server.js` OK.

### Notas
- Exército vazio não avança mais de fase → fecha OT-02 na raiz. O caso de AFK com exército
  vazio (hang) fica para S16 (cancelar partida + voltar ao lobby).
- Chaves i18n `confirm_position_pieces/_sub` ficam órfãs (inofensivo).
- Ainda não commitado — branch + commit após validação (regra do ciclo).

---

## [2026-06-15] 🚀 Início do ciclo v1.2.x — Ajustes Pós 1º Open Test
**Status:** 📋 Planejado — implementação iniciada (S01)

### Contexto
Análise cruzada do 1º Open Test (feedback + dados) consolidada em
`docs/POS_OPEN_TEST_1_DIRETRIZES.md` (itens OT-01..OT-24, tabela Hoje/Desejado/Ação,
investigação de código). Roadmap quebrado em sessões curtas (S01–S30 + backlog) em
`docs/SESSAO_POR_SESSAO_PLANNING.md`. Acompanhamento visual em `docs/CHECKLIST_v1.2.html`.

### Prioridade (v1.2.0 — pré-requisito do próximo teste)
- **S01** guarda servidor exército vazio (OT-02) · **S02** empate só por regra (OT-03)
  · **S03** modo casual/ranked correto (OT-18) · **S04** reproduzir captura múltipla (OT-01).

### Achados de código que viram tarefa direta
- OT-02: `draft_ready`/`position_ready` não validam exército vazio (server.js:1533/1581).
- OT-03: `_persistDB` faz catch-all `draw` com winnerColor null (server.js:445/453).
- OT-18: modo da sala usa só p1 (server.js:1222).

### Decisões de produto
- OT-14: manter 9 idiomas, ptBR como padrão. OT-04: tutorial = partida scriptada.

### Arquivado deste ponto
- ADJ-JUICE A–D, BUG-PRONTO (frontend), HTP-FIX, Painel de testes → entregues; detalhe
  resumido em `_arquivo/docs/SESSAO_POR_SESSAO_PLANNING_concluido.md`. Pendências que
  seguem no v1.2.x: J11 (S30) e guarda de servidor do BUG-PRONTO (S01).

---

## [2026-06-09] HTP-FIX — Como Jogar: bônus dinâmico do Rei
**Status:** ✅ Completo (main) · arquivado no ciclo v1.2.x

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
