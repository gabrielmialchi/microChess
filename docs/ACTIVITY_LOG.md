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

## [2026-06-18] S27 — Tutorial scriptado (S27-A+B+C completo)
**Status:** ✅ Implementado — pendente playtest
**Área:** F — Retenção / onboarding

### Feito
- **Trigger automático**: 1ª partida solo de qualquer sessão → `localStorage.mc_tutorial_seen` ausente → `_tutorialPending = true` no `match_found`; limpo em `launchGame`.
- **Configurações**: botão "JOGAR TUTORIAL" em Configurações chama `window.launchTutorial()` → `_tutorialPending = true; spStartLevel(1)`.
- **Overlay engine** (`TUT`): backdrop dim + spotlight via `box-shadow 9999px` + card de dica. Steps 0-3 bloqueantes (aguardam emit do socket via patch em `_mcSocket`); step 4 livre (MutationObserver no `#duel-modal`); steps 5-9 info cards; step 10 tela de conclusão.
- **10 passos**: Bônus → Exército pronto → Território → Ação+arrastar → Duelo → Ordem → Vácuo → Rei → Promoção → Morte Súbita → Tela final "Você aprendeu!".
- **Drag hint**: classe `.tut-drag-pulse` (CSS `@keyframes`) em peças não-Rei do jogador no passo 3.
- **Pular**: botão sempre visível → confirmação → `TUT.done()`.
- **Bot**: jogo contra Level 1 (Recruta) — 1 peão, passa 70% dos turnos. Sem mudanças no servidor.
- **Arquivos**: `html/index.html` — 4 inserções pontuais + bloco `<div id="tut-overlay">` + `<div id="tut-end">` + `<style>` + `<script>` antes de `</body>`.

### Nota de implementação
Step 3→4 (ACTION→DUEL) usa MutationObserver em `#duel-modal` para detectar abertura. Se o jogador não atacar, step 4 fica com "Entendi ▸" (free). Info cards (5-9) não dependem de estado de jogo.

---

## [2026-06-18] S28+S32+S29 — Design: contorno de peças, coesão visual, tipografia
**Status:** ✅ Implementado — pendente playtest
**Área:** G — Identidade visual

### Feito
- **Revert S26**: promoção do Peão revertida para Rainha (Q, bônus 5). Decisão: dado de 52,7% é especulativo sem teste controlado; manter Queen até confirmação com dados.
- **S28/P1 — Contorno das peças** (`index.html` ~linha 622): `.piece.white` e `.piece.black` trocam `filter: var(--white/black-glow)` por `text-shadow` 8 direções (2 camadas 0.7px + 1.4px). Brancas: contorno `#14100a` + aura laranja. Pretas: contorno `#f4ead7` + aura índigo. Independente de tema e cor de casa.
- **S32/P2 — Coesão menu ↔ jogo** (`index.html`):
  - `:root` legado (tema dark do jogo): vars aquecidas — `--bg: #0b0907`, `--cell-light: #2a231a`, `--cell-dark: #4c3c28`, `--accent: #ff6a33`
  - `body`: `background` fixo em `radial-gradient(ellipse at 50% 32%, #16110b 0%, #0b0907 100%)`
  - JS init de tema: `else apply('light')` adicionado — nunca cai no fallback sem atributo
- **S29/P3 — Tipografia** (`index.html`): 5 fontes → 2. `<link>` Google Fonts: removidos Cinzel, Cinzel Decorative, IBM Plex Mono; mantidos Inter (adicionado peso 800) + JetBrains Mono. Find-replace completo em todas as ocorrências no arquivo.

### Decisão de design (P3)
Opção A aprovada (Sans unificado): Inter para texto/títulos, JetBrains Mono para números/labels. Cinzel removido para simplificar e melhorar leitura em mobile.

---

## [2026-06-17] S26 — Rebalance draft: promoção do Peão (REVERTIDO)
**Status:** ⏪ Revertido em 2026-06-18
**Área:** F — Retenção / balanceamento

### Feito
- **`server/movegen.js` `promotePawns`**: Peão promove para Cavalo (N, bônus 3) em vez de Rainha (Q, bônus 5).
  - Antes: 5 Peões → 5 Rainhas (bônus 5 cada) = estratégia dominante e fácil (funil OT-06: 52,7% dos drafts)
  - Depois: 5 Peões → 5 Cavalos (bônus 3 cada) — ainda forte, mas Rainha e Torre voltam a ser alternativas competitivas
  - Motivo de escolha: não alterar custo do Peão (quebraria checks `budget >= 1` em 8+ arquivos de estratégia do bot)
- **`html/index.html` linha 5913**: animação de promoção (J3) detecta `_prevType === 'P' && p.type !== 'P'` em vez de `p.type === 'Q'` — compatível com qualquer alvo futuro.

### Decisão de design
Investigado OT-06: domínio do Peão (52,7%) é estratégia ótima confirmada (não falta de clareza). 5 Peões promovendo a 5 Rainhas é win-condition trivial. Fix: reduzir o payoff da promoção sem remover a mecânica.

---

## [2026-06-17] S25 — Suavizar níveis 1–3 do solo
**Status:** ✅ Implementado — pendente playtest
**Área:** F — Retenção / solo

### Feito
- **L1 (01-recruta.js)**: compra 1 Peão (1pt, 4pts desperdiçados), posiciona na fileira de trás, passa 70% dos turnos.
  Resultado: jogador enfrenta Rei + 1 Peão. Vitória praticamente garantida para qualquer estratégia.
- **L2 (02-aprendiz.js)**: compra 2 Peões (2pts), posiciona nos cantos da fileira de frente, passa 50% dos turnos.
  Antes: 5 Peões formavam parede inteira (4pt de frente + 1 de trás). Agora: brecha de 2 colunas no meio.
- **L3 (03-defensor.js)**: compra peças baratas aleatórias até gastar 3pts (era 5pts com 2 Bispos).
  Movimento: 45% avança, 55% aleatório — igual ao antigo Recruta mas com menos peças.

### Progressão nova vs. antiga
| Nível | Antes | Depois |
|-------|-------|--------|
| L1    | peças aleatórias (até 5pts) + move 45%→Rei | 1 Peão, 70% passa |
| L2    | 5 Peões (parede completa), avança sempre | 2 Peões (cantos), 50% passa |
| L3    | 2 Bispos + 1 Peão (defensivo) | peças aleatórias ≤3pts, semi-aleatório |

### Notas para próxima sessão
- Sessões restantes 🅿2: S26 (draft rebalance), S27 (tutorial — requer design), S32 (coesão visual — requer design), S29 (tipografia — requer design), S28 (deixado por último)

---

## [2026-06-17] S20+S21 — Ranking verificado + correções do histórico/replay
**Status:** ✅ Implementado — pendente playtest
**Área:** E — Telas

### Feito
- **S20 — Verificado**: `screen-ranking` com grid de 14 ranks, explainer, botão LEADERBOARD GLOBAL e back do leaderboard → ranking já existia completamente. Marcado ✅ sem código novo.
- **S21-A — isDraw corrigido** (`rank-ui.js:127`): `m.result === 'draw'` não cobria `draw_rule` nem `draw_inactivity` (taxonomia do S02). Empates apareciam como "D" (Derrota) no histórico e no header do replay. Fix: `isDraw = m.result === 'draw' || m.result === 'draw_rule' || m.result === 'draw_inactivity'`.
- **S21-B — Date parsing** (`rank-ui.js:122`): `new Date(m.created_at)` retornava Invalid Date no Firefox (SQLite usa espaço em vez de T). Fix: `.replace(' ', 'T')`.
- **S21-C — Schema CHECK constraint** (`schema.sql`): `result TEXT CHECK(...)` só aceitava os 5 valores antigos; novos valores do S02 (`draw_rule`, `draw_inactivity`, `cancelled`) seriam rejeitados em bancos frescos. Constraint atualizada com todos os 8 valores.
- **S21-D — Turn label i18n** (`replay-ui.js:77`): turno de action usava `"Turno X"` hardcoded em PT. Trocado por `t('turn_label') + " " + turnIndex`.

### Notas para próxima sessão
- Sessões 🅿1/🅿2 restantes: S28 (contorno de peças — design), S25 (solo rebalance), S26 (draft rebalance), S27 (tutorial), S32 (coesão visual), S29 (tipografia)
- S28 requer handoff de design antes de implementar

---

## [2026-06-17] S14+S10+S18+S19+S22 — Undo draft + timer fase + deduplication de sessões
**Status:** ✅ Implementado — pendente playtest
**Área:** A, C, B, E

### Feito
- **Planning atualizado**: `SESSAO_POR_SESSAO_PLANNING.md` com ✅ em todas sessões entregues (S01, S02, S03, S04, S09, S11, S12, S13, S16, S17, S18, S19, S22, S30, S31, S31b, S31c, S33).
- **S14 — Undo granular no Draft**: click em peça do inventário durante DRAFT devolve a peça ao orçamento. Render otimista no front + `draft_undo` event no servidor. A label "toque para devolver" já existia em 9 idiomas — agora funciona. `server.js` ~linha 1572.
- **S18 — Dual AFK draw**: verificado — já implementado em S16. `decreeWOForInactivity` checa `pending[oppColor]` antes de decretar WO; se ambos pendentes → `draw_inactivity`. Marcado ✅.
- **S19 — Reorg menu**: verificado — já implementado em sessões anteriores. Menu, header, COMO JOGAR/CRÉDITOS em Settings e logout confirm todos presentes. Marcado ✅.
- **S22 — V/D/E só ranked**: `_persistDB` agora gatea wins/losses/draws em `!isCasual`. Jogos casuais não incrementam V/D/E. ELO/LP já era ranked-only. `server.js` ~linha 472.
- **S10 — Timer de fase visível**: elemento `#phase-time-left` adicionado ao lado de `#phase-title`. `_startInactivityTracking()` atualiza o contador a cada 500ms mostrando `60-elapsed` segundos. Vermelho nos últimos 10s (complementa J2). `index.html`.

### Notas para próxima sessão
- Sessões 🅿1 restantes: S28 (contorno de peças — design), S20 (tela ranking), S21 (histórico/replay)
- Sessões 🅿2: S25 (solo rebalance), S26 (draft rebalance), S27 (tutorial), S32 (coesão visual), S29 (tipografia)

---

## [2026-06-17] S11+S13+S33 — Nome oponente no HUD + SD-banner i18n + quick wins
**Status:** ✅ Implementado — pendente playtest
**Área:** D — HUD & feedback / E — Quick wins

### Feito
- **S11**: `launchGame()` popula `#opp-meta` com `opponentProfile.nickname` ao iniciar partida.
  Antes ficava "aguardando…" durante todo o jogo. Sem mudança de servidor (nickname já estava em `match_found`).
- **S13**: Chave `sd_banner` adicionada nos 9 idiomas (pt/en/es/de/it/ru/ja/ko/zh).
  `ExcBanners.showSuddenDeath()` agora atualiza o `<span>` do banner com `t('sudden_death') + t('sd_banner')`.
  Texto deixa de ser hardcoded PT.
- **S33-A (OT-14)**: Idioma padrão alterado para `'pt'` fixo quando não há `mc_lang` no localStorage.
  Remove a lógica de `navigator.language` que fazia usuários com sistema em inglês verem a UI em EN.
- **S09 e S12**: Verificados — já implementados (ícones/cores V/D/E e texto "✓ Aguardando..." no PRONTO). Sem mudanças.
- **S33 demais**: Créditos ✅ já corretos; Ranked lock p/ convidado ✅ já implementado; Botão ← VOLTAR ✅ já tem ícone.

### Nota
`colar senha no login (OT-22)`: Não há handlers `onpaste` bloqueando — o problema relatado provavelmente é
o iframe do itch.io interceptando o evento. Ação: testar direto em localhost; se funcionar, é itch-specific e
não tem fix de código aqui.

---

## [2026-06-17] S16 — Inatividade por fase + botão ABANDONAR persistente
**Status:** ✅ Implementado — pendente playtest
**Área:** C — Inatividade / reconexão

### Feito
- `server/server.js` nova função `decreeCancelled(room, abuserId)`:
  emite `game_cancelled` para AMBOS os jogadores; seta `state.cancelled=true`;
  chama `persistMatchResult(null, false, 'cancelled')`.
- `server/server.js` `_persistDB`: quando `result === 'cancelled'`, pula cálculo ELO
  (wDelta=bDelta=0, nenhum W/D/L incrementado). Registro na tabela `matches` ainda ocorre.
- `server/server.js` `decreeWOForInactivity` agora é phase-aware:
  DRAFT/POSITION → `decreeCancelled()` · ACTION+ → WO (comportamento anterior).
  Cobre tanto AFK timeout quanto clique em ABANDONAR.
- `html/index.html` `#btn-abandon`: botão pequeno abaixo do PRONTO, visível em toda partida PvP e Solo.
  Mostra popup de confirmação (SIM — ABANDONAR / CANCELAR) antes de agir.
  Solo: `abandonConfirmYes()` → `returnToMenu()` direto.
  PvP: emite `player_abandoned` → servidor aplica fase-aware.
- `html/index.html` `game_cancelled` handler: exibe overlay "PARTIDA CANCELADA" por 2,5s → `returnToMenu()`.
- `html/index.html` `returnToMenu()` limpa `#btn-abandon`, `#abandon-confirm-popup`, `#game-cancelled-overlay`.
- `html/index.html` `rejoin_success` mostra `#btn-abandon` ao reconectar.

### Nota
Penalidade anti-abuso para DRAFT/POSITION AFK (apontada no spec como "leve") **não implementada**
nesta sessão — requires tracking separado (`cancelled_count`) ou reutilizar `wo_count` com lógica específica.
Deixado para S18 ou patch quando houver dados de abuso real.

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
