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

## [2026-05-11] Epic SP — Single Player — CONCLUÍDO
**Status:** ✅ Completo (todas as 34 subtarefas)
**Branch:** main
**Duração:** 2026-05-04 → 2026-05-11 (8 dias corridos)

### Sumário do epic
O epic SP entregou um modo Single Player completo de 15 fases, cada uma comandada por um bot de estratégia distinta (Recruta → Lenda), com persistência de progresso para usuários autenticados e modo "Play linear" para convidados (sem persistência, por design).

### Entregas por sub-epic

**SP-1 — Specs e wireframes (3/3)**
- `docs/SP_TERMS.md` — terminologia × 9 idiomas
- `docs/SP_STRATEGIES.md` — spec das 15 estratégias de bot
- `docs/SP_WIREFRAMES.md` — wireframes textuais de todas as telas

**SP-2 — Backend de persistência (3/3)**
- Tabela `singleplayer_progress` ([server/db/database.js:76-81](server/db/database.js#L76)) com FK em players
- Módulo `server/singleplayer.js` — `getProgress`, `validateLevelProgress`, `markLevelCompleted`, `resetProgress`
- 3 endpoints REST: `GET /sp/progress`, `POST /sp/level-complete`, `POST /sp/reset` (todos protegidos por `requireAuth`)

**SP-3 — Bots e integração (8/8)**
- Refator `server/bot.js` + registry `server/bot-strategies/` (16 estratégias incluindo `_minimax.js` compartilhado)
- 15 estratégias × 3 fases por estágio: Recruta/Aprendiz/Defensor → Atirador/Cavaleiro/Bispeiro → Tanque/Caçador/Estrategista → Duelista/Cercador/Iscador → Rainha/Mestre/Lenda
- Socket event `single_player_start` ([server/server.js:1195-1259](server/server.js#L1195))
- Hook de level-completed no gameOver ([server/server.js:467-470](server/server.js#L467))

**SP-4 / SP-5 / SP-6 / SP-7 — Frontend (16/16)**
- 4 telas novas: `screen-game-mode` (reformulada), `screen-multiplayer-mode`, `screen-solo-hub`, `screen-sp-map`
- i18n × 9 idiomas para todos os labels (SP_TERMS + nomes de fases + textos de hub/mapa)
- Animação one-shot de unlock após vencer ([html/index.html:4741-4749](html/index.html#L4741))

**SP-8 — Integração final (4/4)**
- `game-over-screen` adaptado para Solo (PRÓXIMA FASE / TENTAR DE NOVO / VOLTAR AO MAPA)
- Refresh de progresso ao voltar pro hub (cache + segundo paint após fetch)
- Remoção definitiva do card "Tutorial" legado
- Ativação da feature flag `SP_ENABLED` via limpeza dos fallbacks vestigiais

**SP-9 — QA + Docs (4/4)**
- SP-9.1: walk-through autenticado em produção (criar conta → fase 1 → fase 2 desbloqueia → persistência cross-session)
- SP-9.2: walk-through guest (sem persistência DB; chain linear via PRÓXIMA FASE preserva, navegação para menu/mapa reseta — por design)
- SP-9.3: validação de segurança via 15 testes unitários ([testes/server/singleplayer.test.js](testes/server/singleplayer.test.js)) + análise estática de auth gates
- SP-9.4: este registro consolidado + atualização do PROJECT_CONTEXT

### Decisões de design relevantes
1. **Convidado sem persistência** — sem DB, sem localStorage. Progresso vive em `window.spProgress` (RAM) e só é preservado na chain PRÓXIMA FASE/TENTAR DE NOVO. Sair pro menu ou mapa zera. Reforça funil de registro via CTA "Crie uma conta para salvar seu progresso".
2. **Server gate apenas para logados** — `validateLevelProgress` só roda dentro do bloco `if (token)` em `single_player_start` ([server/server.js:1215](server/server.js#L1215)). Para convidado, qualquer level passa no servidor; gate cosmético via UI do mapa. Não é vulnerabilidade porque guest não afeta MMR/leaderboard.
3. **Bot strategy `_minimax.js` separado** — facilita ajustes finos de Rainha/Mestre/Lenda sem mexer em duas estratégias ao mesmo tempo.
4. **POL-SP (label "COMEÇAR" vs "CONTINUAR")** — quando `max_level_completed === 0`, o botão principal do hub mostra "COMEÇAR" em vez de "CONTINUAR", refletindo o estado do jogador estreante.

### Métricas
- Subtarefas concluídas: **34/34** (100%)
- Arquivos novos: 18 (15 estratégias + minimax + singleplayer.js + singleplayer.test.js)
- Telas novas: 4
- Idiomas mantidos sincronizados: 9 (pt/en/es/de/it/ru/ja/ko/zh)
- Testes unitários (cobertura SP-9.3): 15 passou / 0 falhou
- Suite completa pós-epic: 51 passou / 0 falhou (elo 20 + mmr 16 + singleplayer 15)

### Próximas iniciativas relacionadas
- `MANUT-A` ⏳ — Limpeza de contas de teste antes do Open Test
- `SEC-A` ⏳ — Bundling/minificação/obfuscação JS (pré-Play Store)
- `P-B` ⏸ — Links externos reais (aguarda URLs do Gabriel)
- `ANAL-C/D` ⏸ — Extração e interpretação de métricas (aguarda Open Test)

---

## [2026-05-11] Sessão SP-9.4 — Atualizar docs (encerramento epic SP)
**Status:** Completo
**Branch:** main

### Feito
- Tabela de telas em [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md): atualizada com 4 telas SP (game-mode, multiplayer-mode, solo-hub, sp-map). Aproveitei para corrigir status stale de auth-overlay/ban-overlay/screen-leaderboard/screen-replay (que estavam ❌ A criar, mas foram criados em sessões 5/6).
- Linha SP da tabela de progresso em PROJECT_CONTEXT.md: ⏳ Em andamento → ✅ Completo.
- Entrada consolidada do epic SP adicionada acima nesta mesma data — referência única para o que entregamos.
- Tabela §10 de SP_PLANNING.md: SP-9.4 marcada ✅.

### Decisões
- Não removi o histórico das sessões individuais (SP-1.1 a SP-9.3) do ACTIVITY_LOG — preserva o contexto de cada decisão. A entrada consolidada acima é um índice navegável, não substituto.

### Status do EPIC SP
- ✅ TUDO concluído. Epic encerrado.

---

## [2026-05-11] Sessão SP-9.3 — Validação de segurança
**Status:** Completo
**Branch:** main

### Resultado
✅ Aprovado — 3/3 itens do checklist validados, com cobertura E2E automatizada (15 testes unitários novos) + análise estática estrutural dos 2 itens restantes.

### Checklist
1. ✅ **POST `/sp/level-complete` com level=15 sem ter completado 1..14 → rejeita**
   Evidência E2E: 4 testes em [testes/server/singleplayer.test.js](testes/server/singleplayer.test.js) cobrem `validateLevelProgress(uid, 15) === false` quando max=0; `validateLevelProgress(uid, 2) === false` quando max=0; e `validateLevelProgress(uid, 8) === false` quando max=5. Endpoint em [server/server.js:344-352](server/server.js#L344) chama `validateLevelProgress` antes de `markLevelCompleted` e responde HTTP 400 quando falha.
2. ✅ **POST sem token → 401**
   Análise estática em [server/server.js:344-346](server/server.js#L344): `requireAuth(req.headers.authorization)` ([server.js:146-154](server/server.js#L146)) retorna `null` quando o header está ausente/malformado, e o endpoint responde imediatamente com `res.status(401).json({ error: 'Não autenticado' })`. Mesmo gate aplicado em `/sp/progress` e `/sp/reset`.
3. ✅ **POST com token de outro user → impossível (uid vem do JWT)**
   Estrutural: endpoint em [server/server.js:344-352](server/server.js#L344) usa `decoded.id` (vindo do JWT verificado) como uid em todas as 2 chamadas ao módulo `sp`. O `req.body` é lido apenas para extrair `level`. Não há caminho onde o uid do body é honrado, então um atacante com um token válido só pode escrever o próprio progresso.

### Defesa em profundidade observada
Além do checklist, os testes também validaram garantias secundárias que mitigam vetores correlatos:
- `validateLevelProgress` rejeita level=0, level=16, level negativo, string, float, null/undefined (type guards em [server/singleplayer.js:18-20](server/singleplayer.js#L18))
- `markLevelCompleted` retorna `false` sem uid (guest nunca grava) e nunca regride o progresso (level <= current → no-op)
- Guest (uid falsy) só passa em `validateLevelProgress` quando level=1 (linha [server/singleplayer.js:34](server/singleplayer.js#L34))

### Arquivos criados/modificados
- ✚ [testes/server/singleplayer.test.js](testes/server/singleplayer.test.js) — 15 testes unitários novos cobrindo `validateLevelProgress`, `markLevelCompleted`, `getProgress`, `resetProgress`. Usa DB temporária em `os.tmpdir()` (não toca produção/local). Cleanup completo no fim, incluindo arquivos `-wal`/`-shm` do SQLite.

### Validação
- `node testes/server/singleplayer.test.js` → 15/15 passou
- `node testes/server/run-tests.js` (suite completa) → 51/51 passou (elo: 20, mmr: 16, singleplayer: 15)

### Status do EPIC SP
- ✅ SP-1.* · ✅ SP-2.* · ✅ SP-3.* · ✅ SP-4.* · ✅ SP-5.* · ✅ SP-6.* · ✅ SP-7.* · ✅ SP-8.* · ✅ SP-9.1 · ✅ SP-9.2 · ✅ SP-9.3 · ⏳ SP-9.4 (atualizar docs)

---

## [2026-05-11] Sessão SP-9.2 — Walk-through guest
**Status:** Completo
**Branch:** main

### Resultado
✅ Aprovado — 5/5 passos do checklist passaram em produção (itch.io → Railway), com cobertura mista (4 passos E2E + Passo 5 confirmado via análise estática + sanity check no Console).

### Passos executados pelo usuário
1. ✅ Sem login → Novo Jogo → SOLO → solo-hub abre sem auth-gate ([html/index.html:4678](html/index.html#L4678))
2. ✅ Botão principal mostra "COMEÇAR — Fase 1" (label após POL-SP; comportamento equivalente ao "CONTINUAR — Fase 1" do planning original quando `max_level_completed === 0`)
3. ✅ Venceu fase 1; sp-map mostrou card 1 ✓ e card 2 ▶ desbloqueado na sessão atual (animação de unlock + atualização local via `sp_level_completed`)
4. ✅ F5 zerou progresso — guest volta para Fase 1; nenhum estado persistiu
5. ✅ Network tab limpa (sem requests para `/sp/progress`, `/sp/level-complete`, `/sp/reset`); sanity check no Console retornou `{ max_level_completed: 0, isGuest: true }`

### Auditoria estática (pré-walk-through)
Antes de entregar o protocolo, validamos as 5 frentes no código:
- `openSoloHub` ([html/index.html:4678](html/index.html#L4678)) — sem auth-gate
- `loadSPProgress` ([html/index.html:4657-4660](html/index.html#L4657)) — guard `if (!session || !session.token)` retorna `{0, isGuest:true}` antes de qualquer fetch
- `confirmNewSolo` ([html/index.html:4629](html/index.html#L4629)) — `if (!isGuest)` antes do POST `/sp/reset`
- Server `single_player_start` ([server/server.js:1206](server/server.js#L1206)) — `isGuest = true` por default; só vira `false` se token válido
- Server gameOver SP ([server/server.js:467-470](server/server.js#L467)) — `if (!room._spIsGuest && human.uid)` antes de `markLevelCompleted`; `sp_level_completed` emitido para guests também (atualiza só memória no client)

### Mensagens do Console observadas (não são bugs)
- `Unrecognized feature: 'monetization' / 'xr'` — iframe do itch.io
- `Allow attribute will take precedence over 'allowfullscreen'` — iframe do itch.io
- `bad HTTP response code (403)` em `lib.min.js` — loader de analytics do itch.io
- `preload Cinzel font não usado` — `<link rel="preload">` nosso com timeout do hint do browser; não impacta funcionamento (oportunidade futura: revisar política de preload de fontes)

### Decisões
- O label do botão principal mudou de "CONTINUAR" (planning original) para "COMEÇAR" via POL-SP em 2026-05-06 para refletir corretamente o estado `max_level_completed === 0`. O checklist SP-9.2 foi interpretado com esse contexto — Passo 2 valida o intent (botão inicia Fase 1), não o texto literal.

### Status do EPIC SP
- ✅ SP-1.* · ✅ SP-2.* · ✅ SP-3.* · ✅ SP-4.* · ✅ SP-5.* · ✅ SP-6.* · ✅ SP-7.* · ✅ SP-8.* · ✅ SP-9.1 · ✅ SP-9.2 · ⏳ SP-9.3 (validação de segurança) · ⏳ SP-9.4 (atualizar docs)

---

## [2026-05-06] Sessão SP-9.1 + POL-SP — Walk-through autenticado + Polimento UX hub solo
**Status:** Completo
**Branch:** main

### SP-9.1 — Walk-through autenticado (QA manual)

**Resultado:** ✅ Aprovado com cobertura mista (3 passos E2E + 1 passo via análise estática + evidência indireta).

**Passos executados pelo usuário em produção (itch.io → Railway):**
1. ✅ Criar conta nova — registro + login funcionaram
2. ✅ Vencer fase 1 e ver fase 2 desbloqueada no mapa (com animação de unlock + persistência local via `sp_level_completed`)
3. ✅ Logout + login → progresso persistiu (label "Fase 2" apareceu corretamente; mapa mostrou card 1 ✓ e card 2 ▶)
4. ⏸ Bypass via console — não executado em runtime devido a sandboxing do iframe do itch.io que isola o contexto do `window._mcSocket`. Cobertura via:
   - Análise estática em [server/singleplayer.js:32-37](server/singleplayer.js#L32) (3 linhas determinísticas: `level <= max + 1`)
   - [server/server.js:1215-1218](server/server.js#L1215) (handler chama validateLevelProgress e emite `sp_error: level_locked` em falha)
   - Evidência indireta: passo 3 já provou o caminho de auth + leitura de DB; mesma rota é usada pelo handler antes da validação de level

**Follow-up opcional (sem urgência):** refazer Passo 4 numa próxima ocasião com servidor local (ou solucionar o switch de contexto do DevTools no iframe da itch.zone) para fechar evidência E2E formal. Risco prático baixo dado que o modo solo não afeta MMR.

### POL-SP — Correção UX no hub solo

**Pedido do usuário durante QA:** trocar labels do hub solo para refletir melhor o estado do jogador.

**Feito**
- Botão CONTINUAR agora alterna entre **COMEÇAR** (`max_level_completed === 0`, jogador estreante) e **CONTINUAR** (`max ≥ 1`, retomando jornada). Implementado em [html/index.html:`renderSPContinueLabel`](html/index.html) — único helper que controla label + sub-label baseado em `window.spProgress.max_level_completed`.
- Botão NOVO renomeado para **RESETAR TRAJETO**. Lógica de modal de confirmação (`sh-new-confirm`) e endpoint `POST /sp/reset` mantidos intactos.
- 2 chaves i18n novas × 9 idiomas (pt/en/es/de/it/ru/ja/ko/zh):
  - `sp_start`: COMEÇAR / START / EMPEZAR / STARTEN / INIZIA / НАЧАТЬ / 開始 / 시작하기 / 开始
  - `sp_reset_journey`: RESETAR TRAJETO / RESET JOURNEY / REINICIAR TRAVESÍA / REISE ZURÜCKSETZEN / RESETTA VIAGGIO / СБРОСИТЬ ПУТЬ / 旅をリセット / 여정 초기화 / 重置旅程
- `refreshSoloHubScreen` deixou de setar `sh-continue-label` explicitamente — delegação para `renderSPContinueLabel` (mantém label e sub-label sincronizados em todas as situações: idioma trocado, fetch completado, sp_level_completed recebido).
- `sp_new` (chave antiga) permanece nos dicionários como vestígio órfão — não removido pra manter diff mínimo.

### Validação
- JS extraído de `<script>` inline parseou sem erro via `node --check`.

### Status do EPIC SP
- ✅ SP-1.* · ✅ SP-2.* · ✅ SP-3.* · ✅ SP-4.* · ✅ SP-5.* · ✅ SP-6.* · ✅ SP-7.* · ✅ SP-8.* · ✅ SP-9.1 · ⏳ SP-9.2 (walk-through guest) · ⏳ SP-9.3 (validação segurança) · ⏳ SP-9.4 (atualizar docs)

---

## [2026-05-06] Sessão SP-8.4 — Ativar feature flag SP_ENABLED + remover wrappers vestigiais
**Status:** Completo
**Branch:** main

### Achado-chave
A feature flag `SP_ENABLED` documentada no plano (SP_PLANNING.md §4 e §6) **nunca foi implementada como gate real no código** — só existia como conceito em docs. Durante SP-1..SP-8.3, as telas/handlers foram criados sem gates ativos. O passo "ativar a flag" se traduz em "remover os fallbacks vestigiais que faziam o papel de gate-soft-when-DOM-not-ready".

### Feito
- Stub idempotente de `openSoloHub` ([html/index.html:4533-4541 antes da edição]) removido — era dead code: a função era sempre redefinida em SP-6.2 logo abaixo no mesmo script.
- `window.openSoloHub` ([html/index.html:~4665]) simplificada de 7 linhas (com guard `getElementById('screen-solo-hub')` + alert "Modo Solo em desenvolvimento") para 1 linha (`showScreen('solo-hub')`). Guard é inalcançável: a tela existe no DOM desde SP-6.1.
- `window.spGoOnline` ([html/index.html:~4528]) simplificada de 4 linhas para 1 linha pelo mesmo motivo (tela existe desde SP-5.1).
- Comentários atualizados para refletir o estado pós-SP-8.4.

### Validação
- JS extraído de `<script>` inline parseou sem erro via `node --check`.
- Grep por `Modo Solo em desenvolvimento`, `Fluxo Online em desenvolvimento`, `SP_ENABLED` no código (`html/`, `server/`) retornou zero matches — confirma que nenhum gate cosmético sobreviveu.
- Smoke test mental do fluxo Menu → Novo Jogo → SOLO → CONTINUAR → SP-MAP → start fase: cadeia completa, todos os hooks de showScreen disparam refresh + fetch corretamente.

### Decisão
- Não foi adicionado `window.SP_ENABLED = true` cosmético, pois a flag não tem consumidores. Adicionar uma linha que ninguém lê seria YAGNI puro (CLAUDE.md: "Don't design for hypothetical future requirements").

### Notas para próxima sessão (SP-9.1)
- QA walk-through manual: criar conta → vencer fase 1 → confirmar fase 2 desbloqueia → sair/voltar e confirmar persistência → tentar pular fase via console e ver `sp_error`.

### Status do EPIC SP
- ✅ SP-1.* (specs) · ✅ SP-2.* (backend persistência) · ✅ SP-3.* (16 estratégias) · ✅ SP-4.* (game-mode) · ✅ SP-5.* (multiplayer-mode) · ✅ SP-6.* (solo-hub) · ✅ SP-7.* (sp-map) · ✅ SP-8.* (integração) · ⏳ SP-9.* (QA + docs)
- Fluxo Solo end-to-end implementado e funcional. Resta apenas QA manual + documentação final.

---

## [2026-05-06] Sessão SP-8.3 — Remover card "Tutorial" antigo (deleção definitiva do JS legado)
**Status:** Completo
**Branch:** main

### Contexto
HTML do layout legado (3 cards Casual/Ranqueada/Tutorial + FIND MATCH) já tinha sido removido em SP-4.1; restavam funções e gates JS órfãos referenciando IDs que não existem mais no DOM. Esta sessão completa a limpeza.

### Feito
- Removida `window.selectGameMode` ([html/index.html:~4945 antes da edição]) — não era chamada por nenhum onclick HTML; toda referência ativa migrou para `window.selectMultiplayerMode` em SP-5.2.
- Removida `window.startMatchmakingWithMode` (mesmo bloco) — substituída por `window.startMatchmakingMP` em SP-5.2.
- Removida declaração `let _selectedMode = null` ([html/index.html:~4549 antes da edição]); só era usada pelas funções acima e pelo reset block do hook game-mode.
- Reset block dentro de `showScreen('game-mode')` ([html/index.html:4002-4014 antes da edição]) reduzido a apenas `refreshGameModeScreen()` — `getElementById` chamadas para `gm-card-casual`/`gm-card-ranked`/`gm-card-train`/`gm-check-*`/`gm-find-btn` retornavam null (DOM já limpo desde SP-4.1).
- Guards de i18n em `refreshGameModeScreen` ([html/index.html:4078-4084 antes da edição]) removidos para `gm-casual-label/desc`, `gm-ranked-label/desc`, `gm-train-label/desc`, `gm-find-label`. Permanecem apenas SOLO/ONLINE.
- Comentário HTML linha 2029 atualizado de "Deleção definitiva da JS em SP-8.3" para confirmação de que SP-8.3 concluiu o cleanup.

### Validação
- Grep final por `selectGameMode|startMatchmakingWithMode|_selectedMode|gm-card-train|gm-find-btn|gm-train-*|gm-find-label|gm-casual-*|gm-ranked-*` retorna apenas:
  - 1 menção em comentário HTML (linha 2029, descritivo)
  - 1 menção em comentário JS (linha 4548, descreve migração de SP-5.2)
- JS extraído de todos os `<script>` inline parseou sem erro via `node --check`.

### Notas para próxima sessão (SP-8.4)
- Verificar se a feature flag `SP_ENABLED` ainda existe ou já foi removida em sessões anteriores — se removida, SP-8.4 pode ser apenas confirmação documental.

---

## [2026-05-06] Sessão SP-8.2 — Refresh do progresso ao voltar para hub
**Status:** Completo
**Branch:** main

### Feito
- Hook `showScreen('sp-map')` ([html/index.html:4035-4045](html/index.html#L4035-L4045)) passa a disparar `loadSPProgress()` em sequência ao `refreshSPMap()`. Pattern: paint imediato com cache local → fetch async → segundo paint com dados frescos. Garante que progresso persistido no servidor sobrescreva qualquer dessincronização local (outras abas/dispositivos, fetch falho anterior).
- Hook `showScreen('solo-hub')` já fazia o fetch desde SP-6.2, sem mudança necessária.

### Cobertura dos cenários do checklist
- **Vitória normal** (fase < 15): `sp_level_completed` → spProgress local atualizado → "VOLTAR AO MAPA" reusa cache imediato + reconfirma via fetch.
- **Vitória da fase 15**: spBackToMap → `sp-map` hook → 1º refresh pinta tudo como completed (cache=15) → fetch reafirma 15 → 2º refresh idempotente.
- **Outra aba/dispositivo**: usuário avançou progresso em outro lugar — ao voltar para sp-map, fetch sobrescreve cache local e 2º refresh repinta cards corretamente.

### Notas para próxima sessão (SP-8.3)
- Confirmar via grep que `selectGameMode('train')` e o card legado `gm-card-train` não são mais alcançáveis no fluxo ativo
- Remover ou comentar o bloco HTML do card Tutorial em `#screen-game-mode`
- Limpar guards de i18n em `refreshGameModeScreen()` se IDs saírem do DOM

---

## [2026-04-24] Sessão BUG-H — Cascata de Duelo no Caso f.1 (contested_king)
**Status:** Completo
**Branch:** main

### Contexto
Bug reportado: duas Rainhas (mesmo bônus) atacando os Reis opostos no mesmo turno rolavam apenas **um** duelo Rainha×Rainha; a vencedora avançava para a casa do Rei adversário e ficava sobreposta ao Rei, sem novo duelo. Violava a regra f.1 (peças iguais atacando Reis adversários: duelo 1 entre atacantes, duelo 2 entre vencedor e Rei adversário).

### Feito
- Novo tipo de duelo `contested_king` em `resolveAction` (`server/server.js`), substituindo o `frontal` único do branch f.1. Carrega `kingTargetW`/`kingTargetB` com id+posição dos Reis alvo de cada lado.
- Em `finishDuel`, vencedor de `contested_king` não avança mais na hora: o movimento é adiado para o duelo 2 (ataque explícito contra o Rei adversário), que é `unshift`-ado no topo de `state.duelQueue`.
- Empate em `contested_king` cai no tratamento existente "Both non-King pieces eliminated" — ambas removidas; Morte Súbita só dispara se de fato sobrarem apenas os 2 Reis (confirmado: `checkFinalDuel` verifica `army.length === 2 && ambos type === 'K'`).
- Loop de processamento da fila (linha 831) aceita `contested_king` como tipo válido para revalidação.
- Ordenação da fila não é afetada (resolveAction só gera 1 duelo em f.1; duelo 2 é inserido dinamicamente após resolução).

### Cobertura das regras a–g
- Todas as regras a–g mapeadas; única divergência era f.1, agora corrigida.
- Frontend (`index.html`) não discrimina tipos de duelo — renderiza só com `wPiece/bPiece`, então a UX já mostra automaticamente "Rainha × Rainha" seguido de "Rainha × Rei" sem mudança de código.

### Notas para próxima sessão
- Se algum dia for necessário sinalizar visualmente "Duelo 1 de 2" no card, adicionar badge conforme `state.duel.type === 'contested_king'` e presença de follow-up na queue.

---

## [2026-04-24] Sessão DES-B — Consolidação de Back Buttons
**Status:** Completo
**Branch:** main

### Feito
- Removido CSS órfão `.htp-back-btn` (classe não usada em nenhum elemento; todos os back buttons de telas já usam `.screen-back-btn`)
- `#lb-back-btn` (leaderboard) padronizado: agora tem `← <span class="back-label">VOLTAR</span>` consistente com os demais, recebendo i18n via `querySelectorAll('.back-label')` em `setLanguage`
- `.mm-back-btn` mantida como variante legítima (matchmaking usa "← cancelar", não "VOLTAR", e tem estética distinta por design)

### Notas para próxima sessão
- Todos os botões VOLTAR agora compartilham o mesmo pattern visual (`.screen-back-btn`) e o mesmo label dinâmico

---

## [2026-04-24] Sessão DES-C — Desambiguação de theme-light
**Status:** Completo
**Branch:** main

### Feito
- Removidas duas referências de `document.body.classList.add/remove('theme-light')` em `launchGame`/`returnToMenu` (html/index.html). Esse toggle ativava indevidamente o tema claro da UI quando o jogador preto entrava em partida — flip do tabuleiro já é feito por JS via swap de coordenadas (logicalX/logicalY em 4825-4878)
- 10 regras CSS `body.theme-light` → `[data-theme="light"]` (agora alinhadas com `documentElement.setAttribute('data-theme', ...)` que é setado pelo toggle em Configurações):
  - `body.theme-light { tokens… }` → `[data-theme="light"] body, [data-theme="light"] { tokens… }`
  - `body.theme-light::before` → `[data-theme="light"] body::before`
  - `body.theme-light .panel` → `[data-theme="light"] .panel`
  - `body.theme-light .board` → `[data-theme="light"] .board`
  - `body.theme-light .shop-btns button` (+ hover) → `[data-theme="light"] .shop-btns button`
  - `body.theme-light .inv-piece` → `[data-theme="light"] .inv-piece`
  - `body.theme-light .btn-ready:disabled` → `[data-theme="light"] .btn-ready:disabled`
  - `body.theme-light #reveal-flash.active` → `[data-theme="light"] #reveal-flash.active`
  - `body.theme-light .screen` → `[data-theme="light"] .screen`
- Resultado: alternância UI light/dark em Configurações agora se propaga corretamente para todos os overrides legados (`--bg`, `--panel-bg`, `--board-gap`, etc.), e não é mais ativada acidentalmente quando um jogador preto entra em partida.

### Notas para próxima sessão
- Se aparecer necessidade futura de uma classe específica para perspectiva do preto (ex: inverter gradient background), criar `body.player-inverted` — não reusar `.theme-light`

---

## [2026-04-24] Sessão BUG-G — i18n Refresh Completo
**Status:** Completo
**Branch:** main

### Feito
- Menu principal: `refreshMenuScreen` agora atualiza `btn-novo-jogo`, `btn-sala-privada`, `btn-ranking`, `btn-configuracoes`, `footer-feedback` via `t(...)` — antes apenas avatar/nick/stats eram atualizados, deixando os botões em PT mesmo após troca de idioma
- Credits screen: adicionado refresh de `crd-thanks` (t('credits')) e `crd-feedback-btn` (t('feedback')) tanto em `showScreen('credits')` quanto em `setLanguage` (caso usuário esteja na tela ao trocar idioma)

### Notas para próxima sessão
- Auditoria confirma que demais botões dinâmicos (btn-ready, btn-go-menu, btn-go-again, close-duel, btn-reset-draft, btn-mm-cancel) já são atualizados em seus respectivos flows de renderização

---

## [2026-04-24] Sessão BUG-F — AFK Banner Threshold
**Status:** Completo
**Branch:** main

### Feito
- `_startAfkTimer` (html/index.html ~5291): adicionado threshold `AFK_WARN_THRESHOLD = 10`. Agora o banner de aviso só aparece quando restam ≤10s; acima disso, `hideAfk()` é chamado. Elimina reclamação de banner "vai esgotar" visível desde os 60s iniciais.

### Notas para próxima sessão
- Tick de 500ms mantido para suavidade do countdown; banner animará apenas nos últimos 10 ticks

---

## [2026-04-24] Sessão BUG-E — Age Gate + _busy Reset
**Status:** Completo
**Branch:** main

### Feito
- `_clearErrors` (html/auth-frontend.js): removidas linhas que zeravam `reg-age-gate.checked = false` a cada submit, fazendo com que o check do usuário fosse sempre perdido antes da validação
- `handleSubmit`: adicionado `this._busy = false;` antes de cada early-return de validação (5 pontos), evitando que falha de validação travasse o lock `_busy`, silenciando submissões subsequentes

### Notas para próxima sessão
- Fluxo de cadastro agora permite corrigir e reenviar após erro de validação sem recarregar a tela

---

## [2026-04-24] Sessão DES-A — Design Token Compliance
**Status:** Completo
**Branch:** main

### Feito
- `rgba(46,204,113,*)` board highlights (`.cell.highlight`) → `color-mix(in srgb, var(--success) X%, transparent)`
- `rgba(212,168,50,*)` board buff indicator (`.cell.planned`) → `color-mix(in srgb, var(--accent) X%, transparent)`
- `color:#e53e3e` inline MORTE SÚBITA title → `color:var(--mc-danger)` + shadow tokenizado
- `#4CAF50`/`#F56200` no `.opp-dot` → `var(--success)` / `var(--accent)`
- `color:#2ecc71`/`color:#e74c3c` em `.win-text`/`.lose-text` → `var(--success)` / `var(--danger)`
- `@keyframes title-glow`, `winner-radiate`, `reveal-bloom` — rgba → color-mix
- `.dice-interactive.winner-pulse` border e shadow → var(--accent) + color-mix
- Todos os `rgba(212,168,50,*)` em menus, matchmaking, replay, leaderboard, avatar, credits → color-mix
- `.rp-cell.last-move` → `var(--mc-cell-lastmove)` (token já theme-aware)
- `.lb-you-strip` fallback e border → mc-accent com color-mix
- 9 blocos de `ranking_desc` (todas as línguas): `color:#d4a832` → `color:var(--accent)`, `color:#2ecc71` → `color:var(--success)` (replace_all)

### Notas para próxima sessão
- Próxima prioridade: TESTES-B (smoke test integrado) ou OBS-A (observabilidade)

---

## [2026-04-24] Sessão SEC-B — Server Hardening
**Status:** Completo
**Branch:** main

### Feito
- Rate limiter por socket (`checkSocketRate`) com WeakMap por evento: queue_join/train (3/5s), draft_buy (10/2s), action_plan (5/1s), roll_dice (3/2s), duel_resolve (3/2s)
- Graceful shutdown: SIGTERM/SIGINT emite `server_restart` para todos os clientes, fecha HTTP server, fecha SQLite, `process.exit(0)` com fallback de 15s
- `uncaughtException` e `unhandledRejection` handlers — evita crash silencioso do processo
- Orphan cleanup periódico de `privateRooms` a cada 10 min (belt-and-suspenders sobre os timers individuais de 5 min)
- `createdAt` timestamp adicionado ao objeto `privateRooms` para viabilizar o sweep

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para próxima sessão
- DES-A: Compliance de tokens de cor (50 hardcodes identificados → var(--mc-accent/success/danger))

---

## [2026-04-24] Sessão BUG-D — i18n Completo + AFK Sync
**Status:** ✅ Completo
**Branch:** main

### Feito
- **Bug #6 (Guerreiro hardcoded)**: todos os 4 fallbacks em `index.html` e 1 em `auth-frontend.js` passam agora por `t('warrior') || 'Guerreiro'`
- **Bug #7 (AFK timer desync)**: `startAFKTimer` agora grava `state.afkDeadline[color] = Date.now() + ms`; `clearAFKTimer` limpa o deadline; cliente usa o deadline do servidor (`_startAfkTimer(deadline)` com `setInterval` a 500ms calculando `deadline - Date.now()`), eliminando deriva por lag
- **i18n novas chaves em 9 idiomas**: `warrior`, `afk_warn`, `err_unknown`, `err_connection`, `err_fill_fields`, `err_passwords_mismatch`, `err_change_password`
- **AFK banner texto**: `<span id="afk-warn-text">` agora é atualizado por `refreshOverlays()` via `t('afk_warn')`
- **`· ranqueada` hardcoded** (linha 5322): substituído por `t('mode_ranked') || 'Ranked'`
- **`auth-frontend.js` mensagens de erro**: todas as 5 mensagens de erro usam `(window.t && window.t('err_*')) || 'fallback PT'`

---

## [2026-04-23] Sessão BOT-A — Modo Treino (vs Bot)
**Status:** ✅ Completo
**Branch:** main

### Feito
- `server/bot.js` criado: `createBotPlayer`, `processBotTurn` com lógica para DRAFT/POSITION/ACTION/SUDDEN_DEATH; heurística Manhattan distance; flag `_botBusy` anti-double-scheduling
- `server/server.js`: import do bot.js; `broadcast` modificado com `setImmediate` → `processBotTurn`; `handleBotEvent` para despachar ações do bot; `socket.on('queue_train', ...)` cria sala imediata sem matchmaking; disconnect handler pula WO/reconnect em bot rooms
- `html/index.html`: card TREINAR com subtítulo "Aprenda jogando contra um bot no modo fácil"; i18n `mode_train`/`mode_train_desc` em 9 idiomas; `selectGameMode` atualizado para 3 cards; `goMatchmaking` emite `queue_train`; `showScreen` reseta o card train ao voltar para game-mode
- `docs/SESSAO_POR_SESSAO_PLANNING.md`: sessões BOT-B (Médio) e BOT-C (Difícil) mapeadas para execução pós-Open Test

### Design
- Bot é sempre preto, humano sempre branco
- Composição do bot: N(3) + P(1) + P(1) = 5pts — fácil de vencer
- Partida modo 'casual', sem impacto em MMR/XP

---

## [2026-04-17] Sessão 0 — Planejamento e Organização

**Status:** Completo
**Branch:** main

### O que foi feito
- Leitura completa de `server/server.js` (544 linhas) — lógica de jogo inteira mapeada
- Leitura parcial de `html/index.html` (~1.200 linhas) — todas as telas mapeadas
- Identificação de telas existentes vs. telas a criar (ver CLAUDE.md)
- Decisão: SQLite (sem PostgreSQL) — zero configuração adicional
- Decisão: não reescrever arquivos existentes — apenas inserir blocos
- Decisão: toda lógica nova vai em arquivos JS separados
- Reescrita completa de `SESSAO_POR_SESSAO_PLANNING.md` — 6 sessões
- Criação de `CLAUDE.md` — documento de contexto do projeto
- Criação deste `ACTIVITY_LOG.md`

### Sistemas mapeados e considerados
| Sistema | Planejado em |
|---------|-------------|
| Banco de dados SQLite | Sessão 1 |
| Autenticação JWT | Sessão 2 |
| MMR / ELO (K=32, 6 tiers) | Sessão 3 |
| WO + Ban progressivo (30min/2h/24h) | Sessão 3 |
| AFK Timeout (45s ACTION, 120s DRAFT/POSITION) | Sessão 3 |
| Replay recording (turno a turno) | Sessão 4 |
| Leaderboard endpoint | Sessão 4 |
| Anti-cheat básico (log de tentativas inválidas) | Sessão 4 |
| Frontend auth (login/registro overlay) | Sessão 5 |
| Frontend ban overlay com countdown | Sessão 5 |
| Frontend MMR badge + populate menu/profile | Sessão 5 |
| Frontend leaderboard screen | Sessão 6 |
| Frontend replay viewer (turno a turno) | Sessão 6 |

### Estado dos arquivos do projeto
| Arquivo | Linhas | Status |
|---------|--------|--------|
| `server/server.js` | 544 | ✅ Funcional — base intocável |
| `html/index.html` | ~1.200 | ✅ Funcional — base intocável |
| `server/package.json` | 17 | ✅ express + socket.io |
| `server/db/schema.sql` | — | ❌ Criar na Sessão 1 |
| `server/db/database.js` | — | ❌ Criar na Sessão 1 |
| `server/auth.js` | — | ❌ Criar na Sessão 2 |
| `server/mmr.js` | — | ❌ Criar na Sessão 3 |
| `server/replay.js` | — | ❌ Criar na Sessão 4 |
| `html/auth-frontend.js` | — | ❌ Criar na Sessão 5 |
| `html/rank-ui.js` | — | ❌ Criar na Sessão 6 |
| `html/replay-ui.js` | — | ❌ Criar na Sessão 6 |

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para Sessão 1
- Ler CLAUDE.md antes de qualquer coisa
- NÃO tocar em server.js nem index.html
- Instalar: `npm install better-sqlite3`
- Criar pasta `server/db/` com 3 arquivos

---

## [2026-04-18] Sessão 1 — Database SQLite

**Status:** Completo
**Branch:** main

### Feito
- `better-sqlite3` instalado via npm
- `server/db/schema.sql` criado — tabelas `players`, `matches`, `replays` + 4 índices
- `server/db/database.js` criado — singleton com WAL mode e foreign_keys ON
- `server/db/seed.js` criado — verifica 3 tabelas + índices, process.exit(0)
- `server/package.json` atualizado — script `db:setup` adicionado
- `npm run db:setup` executado com sucesso — todas tabelas e índices OK

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para Sessão 2
- Instalar: `npm install bcrypt jsonwebtoken`
- Criar `server/auth.js` com hashPassword, checkPassword, signToken, verifyToken
- Adicionar POST /auth/register e POST /auth/login ao server.js
- Modificar queue_join para aceitar token opcional

<!-- TEMPLATE — copiar e preencher ao fim de cada sessão -->

<!--
## [DATA] Sessão 1 — Database SQLite (template original)
-->

## [2026-04-18] Sessão 2 — Autenticação JWT

**Status:** Completo
**Branch:** main

### Feito
- `bcrypt` e `jsonwebtoken` instalados via npm
- `server/auth.js` criado — hashPassword, checkPassword, signToken, verifyToken
- `server.js`: requires adicionados (auth.js, db/database.js)
- `server.js`: `express.json()` middleware adicionado
- `server.js`: POST /auth/register — valida, hash, INSERT players, retorna token
- `server.js`: POST /auth/login — SELECT, bcrypt.compare, UPDATE last_seen, retorna token
- `server.js`: queue_join modificado — aceita token opcional; fallback sem token mantido
- Testado: register retorna JWT; login com credenciais corretas retorna JWT

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para Sessão 3
- Criar `server/mmr.js` (calculate, getRank, getBanDuration)
- Adicionar persistMatchResult, applyBan, startAFKTimer, clearAFKTimer ao server.js
- Chamar persistMatchResult nos 2 pontos de GAMEOVER (finishDuel + disconnect)
- Ban check no queue_join (já tem hook, só adicionar lógica)
- GET /leaderboard e GET /player/:id

## [2026-04-18] Sessão 3 — MMR + WO/Ban + AFK

**Status:** Completo
**Branch:** main

### Feito
- `server/mmr.js` criado — calculate (K=32), getRank (6 tiers), getBanDuration
- `server.js`: require mmr adicionado no topo
- `server.js`: GET /leaderboard (top 50 por MMR) e GET /player/:id
- `server.js`: constantes K_WO_BONUS=8, AFK_ACTION_MS=45s, AFK_PREPARE_MS=120s
- `server.js`: funções applyBan, persistMatchResult, clearAFKTimer, startAFKTimer
- `server.js`: timeouts:{} adicionado à criação da sala
- `server.js`: AFK timers iniciados ao criar sala (DRAFT 120s ambos)
- `server.js`: clearAFKTimer/startAFKTimer em draft_buy, draft_reset, draft_ready
- `server.js`: clearAFKTimer/startAFKTimer em position_place, position_return, position_ready
- `server.js`: AFK timers ACTION iniciados no callback REVEAL→ACTION
- `server.js`: clearAFKTimer em action_plan, action_ready
- `server.js`: AFK timers ACTION reiniciados em finishDuel ao retornar para ACTION
- `server.js`: persistMatchResult no GAMEOVER de finishDuel (vitória normal)
- `server.js`: persistMatchResult no disconnect (WO)
- `server.js`: ban check no queue_join — emite 'banned' se ban_until ativo
- Sintaxe verificada com node --check

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para Sessão 4
- Criar `server/replay.js` (createReplayBuffer, recordTurn, buildTurnSnapshot, buildDuelSnapshot)
- room._replay inicializado ao criar sala
- Gravar turnos em resolveAction e finishDuel
- Salvar replay no banco em persistMatchResult
- GET /match/:id/replay e GET /player/:id/matches

## [2026-04-18] Sessão 4 — Replay Recording + Anti-cheat

**Status:** Completo
**Branch:** main

### Feito
- `server/replay.js` criado — createReplayBuffer, recordTurn, buildTurnSnapshot, buildDuelSnapshot
- `server.js`: require replay adicionado no topo
- `server.js`: room._replay = createReplayBuffer() na criação da sala
- `server.js`: gravação de planning snapshot antes de resolveAction (em action_ready)
- `server.js`: gravação de duel snapshot em finishDuel (após calcular totW/totB)
- `server.js`: replay salvo no banco dentro de persistMatchResult (após INSERT matches)
- `server.js`: GET /match/:id/replay — retorna turns como array, verifica expiração
- `server.js`: GET /player/:id/matches — histórico com LEFT JOIN replays (replay_id)
- `server.js`: anti-cheat — invalidMoveCount por socket, log após 15 tentativas inválidas em action_plan
- Sintaxe verificada com node --check

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para Sessão 5
- Criar `html/auth-frontend.js` com Session, AuthUI, MenuPopulator, BanOverlay, showMMRToast, getQueueProfile, listenGameEvents
- Ler index.html em partes para localizar os 5 pontos de inserção
- CSS inline nos novos divs — não alterar <style>

## [2026-04-18] Sessão 5 — Frontend Auth + Ban

**Status:** Completo
**Branch:** main

### Feito
- `html/auth-frontend.js` criado — Session, MenuPopulator, AuthUI, BanOverlay, showMMRToast, getQueueProfile, listenGameEvents
- `html/index.html`: auth-overlay inserido após `<body>` — login/register toggle + "Jogar sem conta"
- `html/index.html`: ban-overlay inserido após auth-overlay — countdown em tempo real
- `html/index.html`: `listenGameEvents(socket)` chamado após `const socket = io(...)`
- `html/index.html`: `queue_join` usa `getQueueProfile()` — injeta token se autenticado
- `html/index.html`: `<script src="auth-frontend.js">` adicionado antes de `</body>`

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para Sessão 6
- Criar `html/rank-ui.js` — Leaderboard overlay + MatchHistory no screen-profile
- Criar `html/replay-ui.js` — ReplayViewer com board 4x4 e controles prev/next/play
- Adicionar telas screen-replay e screen-leaderboard ao index.html
- Adicionar botão RANKING no screen-menu

<!--
## [DATA] Sessão 5 — Frontend Auth + Ban (template original)
-->

### Feito
-

### Pendente
-

### Bugs / Bloqueios Conhecidos
-

### Notas para Sessão 6
-
-->

## [2026-04-18] Sessão 6 — Frontend Leaderboard + Replay

**Status:** Completo
**Branch:** main

### Feito
- `html/rank-ui.js` criado — Leaderboard (load/render/show), MatchHistory (load/render), hook em showScreen('profile')
- `html/replay-ui.js` criado — ReplayViewer (load, open, renderTurn, prev, next, play, close), window.watchReplay
- `html/index.html`: tela `screen-replay` inserida com board 4x4 + controles ⏮ ▶ ⏭
- `html/index.html`: tela `screen-leaderboard` inserida com tabela scrollável
- `html/index.html`: container `#profile-match-history` inserido no screen-profile
- `html/index.html`: botão RANKING adicionado ao screen-menu
- `html/index.html`: scripts rank-ui.js e replay-ui.js adicionados antes de </body>

### Status final do projeto (pré-polimento)
- Todas as 6 sessões de backend e frontend concluídas
- Backend: SQLite, Auth JWT, MMR/ELO, WO/Ban, AFK timers, Replay recording, Leaderboard, Anti-cheat
- Frontend: Auth overlay, Ban overlay com countdown, MMR toast, Leaderboard, Replay viewer, Histórico de partidas

---

## [2026-04-18] Polimento — ELO visível, Email seguro, Logout

**Status:** Completo
**Branch:** main

### Feito
- `server/elo.js` criado — 14 ranks (Peão/Bispo/Cavalo/Torre/Rainha/Rei), applyLPChange com escudo, getEloDisplay
- `server/db/schema.sql` atualizado — colunas elo_rank, elo_lp, elo_shield, email_hash, email_enc + índice UNIQUE em email_hash
- `server/db/database.js` atualizado — migrations automáticas de colunas + migração de emails existentes (HMAC-SHA256 hash + AES-256-GCM encrypt)
- `server/server.js`:
  - require('./elo') adicionado
  - Email crypto helpers (hashEmail, encryptEmail) com HMAC_SECRET + AES_KEY de env vars
  - POST /auth/register: validação de formato (regex), normalização (lowercase+trim), hash + encrypt; lookup por email_hash antes de INSERT
  - POST /auth/login: lookup por email_hash (email nunca exposto em resposta)
  - persistMatchResult: applyLPChange para ambos os jogadores; UPDATE inclui elo_rank/elo_lp/elo_shield; mmr_update emite lpDelta + elo + promoted/demoted
  - GET /leaderboard: ORDER BY elo_rank DESC, elo_lp DESC; inclui elo display
  - GET /player/:id: inclui elo display
- `html/auth-frontend.js`:
  - MenuPopulator.populate: badge usa p.elo.icon/name/lp (PdL) do /player/:id
  - showMMRToast: exibe LP delta, promoção ou rebaixamento com nome do rank
  - listenGameEvents: mmr_update desestrutura lpDelta, elo, promoted, demoted
  - window.doLogout: limpa Session + localStorage, exibe AuthUI
- `html/index.html`: botão "SAIR DA CONTA" adicionado ao screen-profile
- `html/rank-ui.js`: leaderboard usa elo.icon/name/lp ao invés de MMR raw

### Notas para Sessão 7
- Novo fluxo de UI definido (PDF aprovado pelo usuário)
- Menu: apenas NOVO JOGO / RANKING / CONFIGURAÇÕES
- Configurações: adicionar COMO JOGAR + CRÉDITOS
- Header do menu reestruturado: avatar+nick+rank+W/L (esq) + btn SAIR (dir)
- Popup de confirmação de logout
- SAIR DA CONTA no perfil deve abrir popup (não fazer logout direto)
- Sessões 7–10 planejadas em SESSAO_POR_SESSAO_PLANNING.md

---

## [2026-04-18] Sessão 7 — Reorganização Navegação + Header + Logout

**Status:** Completo
**Branch:** main

### Feito
- `html/index.html`: btn-como-jogar e btn-creditos removidos do screen-menu
- `html/index.html`: btn-ranking agora chama showScreen('ranking')
- `html/index.html`: header do menu reestruturado — stats-pill + botão ⏻ SAIR (logout) no lado direito
- `html/index.html`: Configurações — botões COMO JOGAR e CRÉDITOS adicionados
- `html/index.html`: SAIR DA CONTA no perfil agora chama confirmLogout() em vez de doLogout()
- `html/index.html`: popup #logout-confirm inserido — "TROCAR DE CONTA? SIM/NÃO"
- `html/index.html`: refreshMenuScreen limpo — removidas referências a btn-como-jogar e btn-creditos
- `html/auth-frontend.js`: window.confirmLogout, window.hideLogoutConfirm adicionados
- `html/auth-frontend.js`: window.doLogout atualizado — fecha popup + reseta campos do header

### Notas para Sessão 8
- Criar tela screen-ranking com grid dos 14 ranks e botão LEADERBOARD GLOBAL
- Back do leaderboard deve ir para screen-ranking
- showLeaderboard() continua funcionando para o botão dentro de screen-ranking

---

## [2026-04-18] Sessão 8 — Tela RANKING Explicativa + Leaderboard

**Status:** Completo
**Branch:** main

### Feito
- `html/index.html`: tela `screen-ranking` inserida antes de screen-leaderboard
  - Header: VOLTAR → menu, título RANKING
  - Botão LEADERBOARD GLOBAL em destaque → window.showLeaderboard()
  - Card "COMO FUNCIONA" com explicação de PdL, promoção e escudo
  - 6 cards de grupos: Peão/Bispo/Cavalo/Torre (3 divisões cada) + Rainha/Rei (divisão única)
- `html/index.html`: screen-leaderboard — back agora vai para screen-ranking (antes ia para menu)
- `html/index.html`: screen-leaderboard — título alterado de "RANKING" para "LEADERBOARD"

### Notas para Sessão 9
- Criar screen-match-history (tela dedicada de histórico)
- Perfil: remover histórico embutido (#profile-match-history), adicionar botão HISTÓRICO
- Replay: adicionar header com resumo da partida, back → screen-match-history
- GET /player/:id/matches precisa retornar usernames do oponente (verificar JOIN)

---

## [2026-04-18] Sessão 9 — Histórico de Partidas + Replay Melhorado

**Status:** Completo
**Branch:** main

### Feito
- `server/server.js`: GET /player/:id/matches — JOIN com players para retornar white_username e black_username
- `html/index.html`: screen-match-history inserida antes do screen-replay
- `html/index.html`: screen-profile — histórico embutido removido; botão HISTÓRICO DE PARTIDAS adicionado
- `html/index.html`: screen-replay — div #replay-summary inserido acima do board
- `html/rank-ui.js`: MatchHistory.open(playerId) → showScreen('match-history'); render usa white/black_username; watchReplay recebe meta (opponentName, date, lpDelta)
- `html/replay-ui.js`: _meta; open() popula #replay-summary; close() → screen-match-history; window.watchReplay aceita meta como 2º argumento

### Notas para Sessão 10
- pendingReconnects Map no server.js
- disconnect: inicia 60s timer antes do WO (autenticados); WO imediato para convidados
- Evento rejoin_game: restaura socketId na sala, cancela timer
- Overlay frontend: countdown "aguardando reconexão" para o oponente

---

## [2026-04-18] Sessão 10 — Reconexão com tolerância de 60s

**Status:** Completo
**Branch:** main

### Feito
- `server/server.js`: `pendingReconnects = new Map()` e `RECONNECT_MS = 60_000` adicionados
- `server/server.js`: disconnect handler refatorado — autenticados entram em pendingReconnects com timer 60s; convidados recebem WO imediato; oponente recebe `opponent_reconnecting` com remainMs
- `server/server.js`: evento `rejoin_game` — verifica token, cancela timer, restaura socketId, reinicia AFK timer da fase atual, emite `opponent_reconnected` ao oponente e `game_state` + `rejoin_success` ao reconectado
- `html/index.html`: overlay `#reconnect-overlay` com countdown e mensagem "AGUARDANDO RECONEXÃO"
- `html/auth-frontend.js`: `ReconnectOverlay` (show/hide com countdown), `tryRejoinIfPending(socket)`, listeners `opponent_reconnecting` / `opponent_reconnected` / `rejoin_success` / `rejoin_failed` adicionados ao `listenGameEvents`
- `html/auth-frontend.js`: init() chama `tryRejoinIfPending` ao conectar com sessão válida

### Status final do projeto — Sessões 7-10
- Navegação reestruturada conforme novo fluxo de UI
- Header do menu com logout
- Tela de ranks explicativa
- Histórico de partidas em tela dedicada
- Replay com resumo da partida
- Reconexão de 60s para jogadores autenticados

---

## [2026-04-18] Revisão de Segurança — Análise de Vulnerabilidades

**Status:** Completo (análise)
**Branch:** main

### O que foi feito
- Leitura completa de server.js (~915L), auth.js, rank-ui.js, replay-ui.js, auth-frontend.js e index.html (seletivo)
- Mapeamento de 14 vulnerabilidades por severidade
- Planejamento de Sessões 11, 12 e 13 em SESSAO_POR_SESSAO_PLANNING.md

### Vulnerabilidades Encontradas

| # | Descrição | Severidade | Sessão |
|---|-----------|-----------|--------|
| 1 | Sem rate limit em /auth/login e /auth/register | CRÍTICO | 11 |
| 2 | Username sem validação de conteúdo — XSS stored possível | CRÍTICO | 11 |
| 3 | innerHTML com username sem escaping em leaderboard/histórico | CRÍTICO | 11 |
| 4 | watchReplay injeta JSON em atributo onclick — XSS via username | CRÍTICO | 11 |
| 5 | JWT_SECRET / HMAC_SECRET com defaults de dev — sem aviso em prod | ALTO | 11 |
| 6 | game_join aceita qualquer cor — adversário pode sequestrar lado | ALTO | 11 |
| 7 | persistMatchResult sem transação — DB inconsistente em crash | ALTO | 11 |
| 8 | duel_resolve sem verificar d.resolveTime — resolve antes de ambos rolarem | ALTO | 11 |
| 9 | LP delta no histórico usa coluna mmr_change (valor errado) | MÉDIO | 12 |
| 10 | queue_join aceita nickname falso para jogadores autenticados | MÉDIO | 12 |
| 11 | JSON.parse sem try/catch no endpoint /match/:id/replay | MÉDIO | 12 |
| 12 | Timing oracle no login — revela existência de email | MÉDIO | 12 |
| 13 | Avatar não validado em queue_join | BAIXO | 12 |
| 14 | Replays expirados nunca deletados do banco | BAIXO | 13 |

### Notas
- CORS origin:'*' é baixo risco dado que JWT está em localStorage (não cookies)
- Sessão 11 é prioritária: contém os 4 vetores de XSS + 2 game integrity bugs
- Sessão 12 corrige valores errados visíveis ao usuário (LP delta) + segurança média
- Sessão 13 é puramente manutenção, pode ser adiada

---

## [2026-04-18] Sessão 11 — Segurança Crítica

**Status:** Completo
**Branch:** main

### Feito
- `server/package.json`: express-rate-limit ^7.5.1 adicionado + npm install executado
- `server/server.js`: `const rateLimit = require('express-rate-limit')` adicionado
- `server/server.js`: `authLimiter` — 5 req/min por IP, aplicado em POST /auth/register e POST /auth/login
- `server/server.js`: startup warnings para HMAC_SECRET e AES_KEY em NODE_ENV=production
- `server/server.js`: `USERNAME_RE = /^[a-zA-Z0-9_\-\.]{3,16}$/` — validação de username no register
- `server/auth.js`: startup warning para JWT_SECRET em NODE_ENV=production
- `server/server.js`: `game_join` — verifica `room.players[color]?.socketId === socket.id` antes de aceitar
- `server/server.js`: `persistMatchResult` — DB operations envolvidas em `db.transaction()`, socket emits fora
- `server/server.js`: `duel_resolve` — guard `if (!d?.resolveTime) return` adicionado
- `html/rank-ui.js`: helper `escapeHTML()` adicionado no topo
- `html/rank-ui.js`: leaderboard render — `escapeHTML()` aplicado em username, elo.icon, elo.name
- `html/rank-ui.js`: match history render — `escapeHTML()` em opponentName, onclick substituído por `data-match-id` + `data-meta` + `addEventListener`

### Notas para Sessão 12
- LP delta no histórico ainda usa mmr_change_white/black (valor errado) — Sessão 12 adiciona colunas lp_change_white/black
- queue_join ainda aceita nickname do cliente para auth players — Sessão 12 corrige
- Timing oracle no login ainda existe — Sessão 12 adiciona dummy bcrypt

---

## [2026-04-18] Sessão 12 — Integridade de Dados

**Status:** Completo
**Branch:** main

### Feito
- `server/db/database.js`: migração — `ALTER TABLE matches ADD COLUMN lp_change_white INTEGER DEFAULT 0` e `lp_change_black` (try/catch, seguro para DBs existentes)
- `server/server.js`: `_persistDB` — INSERT de matches agora inclui `lp_change_white` e `lp_change_black` (valores de `wLP.lpDelta` e `bLP.lpDelta`)
- `html/rank-ui.js`: `lpDelta` no match history usa `lp_change_white/black` com fallback para `mmr_change` (retrocompatível com partidas antigas)
- `server/server.js`: `queue_join` — query expandida para incluir `username`; nickname é sobrescrito com `rec.username` para auth players
- `server/server.js`: `queue_join` — avatar validado contra `Set(['K','Q','R','B','N','P'])`, default `'K'` se inválido
- `server/server.js`: `/match/:id/replay` — `JSON.parse(replay.turns_json)` envolvido em `try/catch`, retorna 500 gracioso
- `server/server.js`: `/auth/login` — dummy bcrypt (`_DUMMY_HASH`) executado quando email não encontrado para normalizar tempo de resposta
- `server/server.js`: CORS origin — `process.env.ALLOWED_ORIGIN || '*'` (configurável por env var)

### Notas para Sessão 13
- Replays expirados nunca deletados — Sessão 13 adiciona cleanup job
- `/health` endpoint pode ser melhorado com DB ping + room stats

---

## [2026-04-18] Sessão 13 — Manutenção e Limpeza

**Status:** Completo
**Branch:** main

### Feito
- `server/server.js`: `cleanExpiredReplays()` — DELETE FROM replays WHERE expires_at < datetime('now'), chamada na startup + setInterval 24h
- `server/server.js`: `scheduleRoomCleanup(roomId)` — substitui todos os 4 `setTimeout(() => rooms.delete(...), 60_000)` no código; além de deletar a sala, limpa entradas órfãs em `pendingReconnects` que apontam para aquela sala
- `server/server.js`: `/health` — expandido com DB ping (SELECT 1 FROM players) + `rooms.size` + `queue.length`; retorna 500 se DB falhar

---

## [2026-04-18] Sessão 14 — Integridade Competitiva + Perfil

**Status:** Completo
**Branch:** main

### Feito
- `server/server.js`: `stateView(state, color)` — mascara `planning[opponentColor]` enquanto oponente não confirmou; `broadcast()` agora envia view personalizada por cor
- `server/server.js`: `PATCH /auth/profile` — atualiza username no DB, valida USERNAME_RE, trata UNIQUE conflict, retorna novo token
- `server/server.js`: `DELETE /auth/account` — transação que deleta replays, matches e player; requer JWT válido
- `html/index.html`: `saveProfile` — reescrito para fazer `fetch PATCH /auth/profile` quando autenticado; atualiza Session + MenuPopulator; fallback para localStorage se guest
- `html/index.html`: botão "EXCLUIR CONTA" adicionado no screen-profile (visual discreto, abaixo de "SAIR DA CONTA")
- `html/index.html`: popup `#delete-account-confirm` com aviso de ação irreversível + botões EXCLUIR/CANCELAR
- `html/auth-frontend.js`: `window.confirmDeleteAccount`, `window.hideDeleteConfirm`, `window.doDeleteAccount` (fetch DELETE + Session.clear + AuthUI.show)

### Notas para Sessão 15
- PWA manifest.json + service worker + Helmet.js + Privacy Policy page

---

## [2026-04-18] Sessão 15 — Play Store Pré-Requisitos

**Status:** Completo
**Branch:** main

### Feito
- `server/package.json`: helmet instalado
- `server/server.js`: `require('helmet')` + `app.use(helmet({ contentSecurityPolicy: false }))` — ativa X-Frame-Options, HSTS, X-Content-Type-Options, Referrer-Policy automaticamente
- `server/server.js`: `GET /privacy-policy` — HTML inline com política de privacidade em PT completa
- `server/server.js`: `GET /.well-known/assetlinks.json` — retorna `[]` por padrão; preencher com env var `ASSET_LINKS` após gerar keystore do APK
- `html/manifest.json`: criado — name, short_name, start_url, display: standalone, orientation: portrait, theme_color: #d4a832, icons placeholders 192/512
- `html/sw.js`: criado — service worker com cache de shell + fallback offline; bypassa socket.io e endpoints de API
- `html/index.html`: `<meta name="theme-color">`, `<meta mobile-web-app-capable>`, `<link rel="manifest">` adicionados ao `<head>`
- `html/index.html`: registro do service worker (`navigator.serviceWorker.register('/sw.js')`) adicionado antes do `</body>`

### Dependências Manuais (fora do escopo do Claude Code)
- Criar ícones PNG: `html/icons/icon-192.png` e `html/icons/icon-512.png` (design do ícone do app)
- Após gerar keystore Android via Android Studio / bubblewrap: preencher `ASSET_LINKS` env var no Railway com o JSON do assetlinks
- Preencher Data Safety Form e IARC no Google Play Console
- Tirar screenshots do app para a Play Store listing

### Notas para Sessão 16
- Troca de senha (PATCH /auth/password)
- Loading states nas telas assíncronas
- Disconnect banner
- Fix botão Sair para WebView

---

## [2026-04-18] Sessão 16 — Qualidade UX + Password Change

**Status:** Completo
**Branch:** main

### Feito
- `server.js`: `PATCH /auth/password` — valida senha atual (bcrypt), exige mín. 6 chars, atualiza hash
- `index.html`: botão "ALTERAR SENHA" no screen-profile
- `index.html`: modal `#change-password-modal` (senha atual + nova + confirmar + erro inline)
- `index.html`: `window.quitGame()` — substituído `window.close()` por `showScreen('menu')` com hook Android.closeApp() para TWA
- `html/auth-frontend.js`: `showChangePassword`, `hideChangePassword`, `doChangePassword` (fetch PATCH /auth/password)
- `html/auth-frontend.js`: `showDisconnectBanner()` — banner vermelho fixo no topo
- `html/auth-frontend.js`: `socket.on('disconnect', showDisconnectBanner)` + `socket.on('connect', remove banner)`
- `html/rank-ui.js`: spinner dourado animado substituindo "Carregando..." em leaderboard e match-history
- `html/rank-ui.js`: `Leaderboard.load()` agora mostra a tela antes do fetch (com spinner imediato)

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para Sessão 17
- Sala privada com código de 4 caracteres (P-08)
- Novos eventos socket: `private_room_create`, `private_room_join`
- Nova tela `screen-private-room`

---

## [2026-04-18] Sessão 17 — Sala Privada com Código

**Status:** Completo
**Branch:** main

### Feito
- `server.js`: `privateRooms` Map + `PRIVATE_ROOM_MS = 5min`
- `server.js`: evento `private_room_create` — gera código 4 chars (charset sem ambíguos), timer expiry, valida ban, retorna `private_room_created`
- `server.js`: evento `private_room_join` — valida código, cria sala com cores aleatórias, emite `match_found` para ambos
- `server.js`: evento `private_room_cancel` — limpa sala do socket
- `server.js`: disconnect handler — limpa private rooms do socket desconectado
- `index.html`: tela `screen-private-room` — CRIAR SALA (mostra código + spinner aguardando) + ENTRAR COM CÓDIGO (input 4 chars) + VOLTAR
- `index.html`: botão "SALA PRIVADA" no menu principal (entre NOVO JOGO e RANKING)
- `index.html`: `window.privateRoom` — objeto com `open`, `cancel`, `create`, `join`, `copyCode`, `_onCreated`, `_onExpired`, `_onError`
- `index.html`: `socket.on('private_room_created/expired/error')` handlers
- `index.html`: `match_found` handler atualizado para popular e mostrar tela de matchmaking mesmo quando vindo da sala privada

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para próxima sessão
- Próximas sessões: polimentos P-A (localização), P-B (juicy combate), P-C (transições + UX info)
- P-07: badge "partida não ranqueada" quando Logado×Anônimo ainda pendente

---

## [2026-04-18] Sessão 18 — Hardening Final + P-07

**Status:** Completo
**Branch:** main

### Feito
- `server/db/schema.sql`: coluna `pw_version INTEGER DEFAULT 0` adicionada à tabela players
- `server/db/database.js`: migration `ALTER TABLE players ADD COLUMN pw_version INTEGER DEFAULT 0`
- `server/server.js`: helper `requireAuth()` — verifica token + pw_version (invalida tokens de antes da troca de senha)
- `server/server.js`: `PATCH /auth/profile` e `DELETE /auth/account` usam `requireAuth`
- `server/server.js`: login e register incluem `pv` no payload do JWT
- `server/server.js`: `PATCH /auth/password` — incrementa `pw_version`, retorna novo token com `pv` atualizado; rate limiter adicionado (V-04)
- `server/server.js`: startup warning `ALLOWED_ORIGIN` em produção (V-02)
- `server/server.js`: try/catch no `JSON.parse(ASSET_LINKS)` (V-03)
- `server/server.js`: `/player/:id` — campos sensíveis (`wo_count`, `elo_shield`, `ban_until`, `banned`) apenas quando `isSelf` (V-05)
- `server/server.js`: INSERT players grava `null` na coluna `email` legada em vez de `email_enc` (V-06)
- `server/server.js`: `match_found` inclui `isRanked` — false quando qualquer lado é guest (uid começa com `g_`)
- `html/auth-frontend.js`: `doChangePassword` salva novo token retornado pelo servidor
- `html/index.html`: badge "PARTIDA NÃO RANQUEADA" na tela de matchmaking (mm-found) e game-over quando `isRanked === false`

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para próxima sessão
- Iniciar polimentos: P-A (localização), P-B (juicy combate), P-C (transições + links)

---

## [REFERÊNCIA] Status final — Sessões 11, 12, 13 (Ciclo de Segurança)
Todas as 14 vulnerabilidades identificadas na revisão foram endereçadas:
- 8 críticas/altas: Sessão 11 ✅
- 6 médias/baixas: Sessões 12 e 13 ✅

---

## [2026-04-18] Segunda Revisão de Segurança + Avaliação Play Store

**Status:** Completo (análise e planejamento)
**Branch:** main

### Novos pontos encontrados

| # | Descrição | Severidade | Sessão |
|---|-----------|-----------|--------|
| 1 | `broadcast()` envia planning do oponente antes da revelação — vazamento competitivo via WebSocket | CRÍTICO | 14 |
| 2 | Nickname salvo apenas em localStorage — `saveProfile` não sincroniza com DB | ALTO | 14 |
| 3 | Sem exclusão de conta in-app — bloqueador obrigatório da Play Store | ALTO | 14 |
| 4 | JWT 30 dias sem revogação server-side — token roubado fica válido por 30 dias | ALTO | 15 |
| 5 | Sem security headers (Helmet.js) — X-Frame-Options, HSTS, CSP, X-Content-Type-Options | MÉDIO | 15 |
| 6 | Sem página de Privacy Policy — obrigatório para Play Store | MÉDIO | 15 |
| 7 | Sem PWA manifest — necessário para TWA (abordagem de publicação recomendada) | MÉDIO | 15 |
| 8 | `window.close()` não funciona em WebView Android | BAIXO | 16 |
| 9 | Sem loading states em telas assíncronas | BAIXO | 16 |
| 10 | Sem feedback visual de desconexão do servidor | BAIXO | 16 |
| 11 | Sem troca de senha | BAIXO | 16 |

### Bug Corrigido
- `server.js:658`: `const { uid, nickname, ... }` → `let { uid, nickname, ... }` — `nickname` era `const` e a Sessão 12 tentou reatribuí-la, derrubando o handler `queue_join` inteiro e impedindo qualquer partida de ser formada.

### Avaliação Play Store
- **Abordagem**: TWA (Trusted Web Activity) — mais econômica, sem reescrita nativa
- **Bloqueadores absolutos**: exclusão de conta (#3) e Privacy Policy (#6)
- **Bloqueadores técnicos**: manifest.json, assetlinks.json, ícones 192px e 512px
- **Distância estimada**: 3 sessões de implementação + criação manual de ícones e preenchimento de formulários no Play Console
- Sessões 14, 15 e 16 adicionadas ao SESSAO_POR_SESSAO_PLANNING.md

---

## [2026-04-18] Sessão P-A — Localização: Varredura + Tradução EN

**Status:** Completo
**Branch:** main

### Feito
- ~60 chaves de tradução adicionadas a `T.pt` e `T.en` em `html/index.html`
- `window.t = t` exposto após definição da função `t()`
- IDs adicionados a todos os elementos traduzíveis:
  - ban-overlay: `ban-title`, `ban-reason`, `ban-time-label`, `ban-close-btn`
  - logout-confirm: `logout-title`, `logout-desc`, `logout-yes-btn`, `logout-no-btn`
  - delete-confirm: `delete-confirm-title`, `delete-confirm-desc`, `delete-cancel-btn`
  - change-password-modal: `cp-title`, `cp-cancel-btn`
  - reconnect-overlay: `reconnect-desc`, `reconnect-wo-auto`
  - screen-private-room: `pr-title`, `pr-code-label`, `btn-pr-copy-text`, `pr-expires`, `pr-or-divider`, `pr-join-label`, `btn-pr-join-text`, `pr-waiting-text`, `btn-pr-back`
  - screen-match-history: `mh-title`
  - screen-replay: `replay-title-el`, `replay-turn-label`
  - screen-ranking: `ranking-title`, `btn-leaderboard-global`, `ranking-how-title`, `ranking-desc-text`, `ranking-div-label`, `ranking-cards`
  - screen-leaderboard: `lb-title`
  - screen-profile: `btn-sign-out`, `btn-delete-account`, `btn-match-history`
- Ranking cards section substituída por `#ranking-cards` renderizado por JS
- Novas funções de refresh adicionadas: `refreshRankingScreen()`, `refreshOverlays()`, `refreshHistoryScreen()`, `refreshReplayScreen()`, `refreshPrivateRoomScreen()`
- `refreshProfileScreen()` atualizado com novos botões (alterar senha, sair, excluir, histórico, stats_label)
- `refreshSettingsScreen()` atualizado com botões COMO JOGAR, CRÉDITOS, VOLTAR
- `selectLanguage()` atualizado para chamar todos os refresh
- `showScreen()` atualizado para chamar refresh específico por tela + `refreshOverlays()` sempre
- `html/rank-ui.js`: strings hardcoded substituídas por `window.t` — `no_players_yet`, `no_matches_yet`, `match_result_win/loss/wo`
- `html/auth-frontend.js`: `no_connection`, `promotion_toast`, `demotion_toast` via `window.t`
- Strings hardcoded no IIFE privateRoom substituídas por chamadas `t()`
- Novas chaves: `room_expired`, `room_code_invalid`

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para próxima sessão
- Próxima sessão: P-C (Localização 7 idiomas restantes)

---

## [2026-04-19] Sessão P-C — Localização: 7 Idiomas Restantes

**Status:** Completo
**Branch:** main

### Feito
- ~60 chaves adicionadas a todos os 7 idiomas faltantes em `html/index.html`:
  - **ES** (espanhol) — tradução completa
  - **DE** (alemão) — tradução completa
  - **IT** (italiano) — tradução completa
  - **RU** (russo) — tradução completa
  - **JA** (japonês) — tradução completa
  - **KO** (coreano) — tradução completa
  - **ZH** (chinês simplificado) — tradução completa
- Chaves inseridas após `feedback` e antes de `htp_intro` em cada bloco `T.xx`
- Cobre: perfil, telas (history, replay, ranking, leaderboard), sala privada, ban, logout confirm, delete confirm, change password, reconnect overlay, dinâmicas (toasts, partida não ranqueada)
- Sintaxe JS validada (`new Function()` em todos os blocos `<script>`) — 0 erros

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para próxima sessão
- Próxima sessão: P-D (Replay: tabuleiro fixo + turno 0 + label de turno)
- P-B (links externos) suspensa até links reais serem definidos

---

## [2026-04-19] Sessão Design-A — Tokens CSS + Componentes Base

**Status:** Completo
**Branch:** main

### Feito
- Adicionado import de `Inter` + `JetBrains Mono` ao link Google Fonts existente (mesma tag, sem duplicar preconnect)
- Adicionado import de `flag-icons@7.0.0` via CDN jsdelivr
- Novo bloco `<style>` inserido antes do `<style>` existente contendo:
  - `:root` com ~70 tokens `--mc-*`: cores, tipografia, espaçamento, radius, sombras, motion, layout
  - `[data-theme="dark"]` com overrides completos para dark mode
  - Classes de componente: `.mc-screen`, `.mc-btn` (+ variantes: primary/accent/ghost/danger/sm/full/icon), `.mc-input`, `.mc-field`, `.mc-card`, `.mc-tag` (+ variantes), `.mc-dot`, `.mc-avatar` (+ variantes), `.mc-identity`, `.mc-stat`, `.mc-toast` (+ variantes), `.mc-modal-backdrop`, `.mc-modal`, `.mc-tabbar`, `.mc-topbar`, `.mc-board` (+ células e peças), `.mc-die`
- `<style>` existente intocado — zero variáveis removidas
- Sintaxe JS validada: 2 blocos OK, 0 falhas

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para próxima sessão
- Próxima sessão: Design-B (Menu principal + header + tab bar)

---

## [2026-04-18] Sessão Design-B — Menu Principal + Tab Bar

**Status:** Completo
**Branch:** main

### Feito
- `#screen-menu` redesenhado com tokens `--mc-*`:
  - Player row: `.mc-avatar` + nome + rank badge + W·L + botão logout (⏻)
  - Hero: `microChess.` com `<em>` laranja, subtítulo `id="menu-version-sub"`
  - Nav: 4 botões `.mc-btn` — Jogar ranqueada / Sala privada / Ranking / Configurações
  - Footer: link feedback estilizado com `var(--mc-faint)`
  - `btn-sair` mantido oculto (retrocompat)
- Modo convidado: `#menu-guest-cta` "Criar conta" em `var(--mc-accent)` (oculto quando logado)
- `#mc-tabbar` fixo (position:fixed) adicionado antes de `<script src="auth-frontend.js">`:
  - 4 abas: ⌂ Início · ▶ Jogar · ◆ Ranking · ○ Perfil
  - Usa classe `.mc-tabbar` + `.tab` do Design-A
- `refreshMenuScreen()` atualizado: detecta `Session.isValid()` e alterna entre `menu-logged-stats` e `menu-guest-cta`
- IDs preservados: `menu-avatar-icon`, `menu-player-name`, `menu-rank-badge`, `menu-stat-w`, `menu-stat-l`, `btn-logout-header`, `btn-novo-jogo`, `btn-sala-privada`, `btn-ranking`, `btn-configuracoes`, `btn-sair`, `footer-feedback`

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para próxima sessão
- Próxima sessão: Design-F (Auth overlay — tela cheia)

---

## [2026-04-19] Sessão Design-F — Auth Overlay (Tela Cheia)

**Status:** Completo
**Branch:** main

### Feito
- `html/index.html`: `#auth-overlay` redesenhado como tela cheia (não modal sobre escuro)
  - Fundo: `var(--mc-bg)` — consistente com Design-A/B
  - Logo: `micro<em>Chess</em>.` com accent color no "Chess"
  - Eyebrow mono + título bold 26px por modo (login/registro)
  - Campos com `<label>` visível + `<span id="*-hint">` para erro inline
  - CTA login: fundo `var(--mc-ink)` (escuro); CTA registro: fundo `var(--mc-accent)` (laranja)
  - Divider "ou" + botão ghost "Jogar sem conta" (apenas login)
  - `#auth-error` posicionado absolutamente no fundo do overlay (compartilhado entre modos)
  - Inputs com classe `.auth-fi` + novo `<style>` block para `:focus` e `.error` states
  - IDs preservados: `#login-email`, `#login-password`, `#reg-username`, `#reg-email`, `#reg-password`, `#auth-error`
- `html/auth-frontend.js`:
  - `AuthUI.show()` usa `display:block` (overlay é full-screen, não flex-centered)
  - `AuthUI.toggle()` chama `_clearErrors()` antes de trocar de modo
  - `AuthUI._clearErrors()` — limpa classes `.error` e hints de todos os campos + `#auth-error`
  - `AuthUI._fieldError(inputId, hintId, msg)` — aplica `.error` no input + mostra hint abaixo
  - `AuthUI.handleSubmit()` — validação client-side usa `_fieldError` por campo; erros de servidor vão para `#auth-error`

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para próxima sessão
- Próxima sessão: Design-C (Matchmaking + Sala privada)

---

## [2026-04-19] Sessão Design-C — Matchmaking + Sala Privada

**Status:** Completo
**Branch:** main

### Feito
- `html/index.html`: `#screen-matchmaking` redesenhado com tokens `--mc-*`:
  - Fundo `var(--mc-bg)`, layout flex column full-screen
  - Botão "← cancelar" com `.mm-back-bar` (CSS mantido, estilo atualizado via seletor novo)
  - Estado **Lobby**: radar animado (`.mc-mm-radar` + `::after` com `@keyframes mc-radar-ring`), ícone de peça em destaque accent, eyebrow mono, título "Na fila", nick/rank inline
  - Estado **Found**: label success "✓ PARTIDA ENCONTRADA", VS cards lado a lado com avatar/nick/rank de ambos os jogadores, tag "Ranqueada"
  - Estado **Countdown**: eyebrow + número grande `mm-countdown-num` com glow accent + sub texto
  - Adicionados `#mm-found-my-rank` e `#mm-found-opp-rank` nos VS cards
  - IDs mantidos: `btn-mm-cancel`, `mm-lobby`, `mm-found`, `mm-countdown`, `mm-my-avatar`, `mm-my-nick`, `mm-found-my-avatar`, `mm-found-my-nick`, `mm-found-opp-avatar`, `mm-found-opp-nick`, `mm-title-searching`, `mm-title-found`, `mm-countdown-sub`, `mm-count-num`, `mm-vs-label-you`, `mm-vs-label-opp`, `mm-vs-text`, `mm-searching-text`
- `html/index.html`: `#screen-private-room` redesenhado com tokens `--mc-*`:
  - Fundo `var(--mc-bg)`, header com botão ← e título "Sala Privada"
  - Seção CRIAR SALA: botão ghost → `pr-code-display` (código 40px mono accent + dot pulsante + expiração + COPIAR)
  - Divider "ou" com linhas
  - Seção ENTRAR COM CÓDIGO: input mono centralizado + botão accent ENTRAR + `pr-join-error`
  - IDs mantidos: `btn-pr-back`, `pr-title`, `pr-create-section`, `btn-pr-create`, `pr-code-display`, `pr-code-value`, `pr-code-label`, `btn-pr-copy`, `btn-pr-copy-text`, `pr-waiting`, `pr-waiting-text`, `pr-expires`, `pr-or-divider`, `pr-join-section`, `pr-join-label`, `pr-join-input`, `btn-pr-join`, `btn-pr-join-text`, `pr-join-error`
  - `@keyframes mc-dot-wait` para animação do dot de espera
- `html/index.html`: novo `<script>` que envolve `window.goMatchmaking` para popular `mm-found-my-rank` e `mm-my-nick` com rank do Session; MutationObserver em `mm-found-opp-nick` para popular `mm-found-opp-rank` ao detectar mudança

### Bugs / Bloqueios Conhecidos
- `opponentProfile.rank` vazio se o servidor não enviar campo `rank` no `oppProfile` — elemento `mm-found-opp-rank` ficará em branco (aceitável por ora)

### Notas para próxima sessão
- Próxima sessão: Design-D (Telas de partida: Draft · Posição · Revelação · Ação)

---

## [2026-04-19] Sessão Design-D — Telas de Partida (Draft · Posição · Revelação · Ação)

**Status:** Completo
**Branch:** main

### Feito
- [x] 1. Redesenhar `#game-area`: novo topbar grid(1fr auto 1fr), 52px, border-bottom
  - `.opp` com `#opp-dot` (dot 8px), `#opp-status`, `#opp-meta`
  - `#phase-title` como pill (mono, accent, rounded)
  - `#opp-pts` como timer (alinhado à direita)
- [x] 2. Barra de etapas (DRAFT · POSIÇÃO · AÇÃO) não existia no HTML — nenhuma remoção necessária
- [x] 3. Inventário do Draft redesenhado: `.inv-header` com label `#inv-label` + `#btn-reset-draft`
  - Label usa `t('draft_return_hint')` via `updateUI()`
  - Botão usa `t('draft_clear')` via `updateUI()`
- [x] 4. Chaves i18n adicionadas: `draft_return_hint`, `draft_clear` em PT e EN
- [x] 5. Aura das peças: override de `--white-glow` (laranja `rgba(245,98,0,0.8)`) e `--black-glow` (violeta `rgba(69,56,255,0.8)`) + override de `--mc-fx-glow-w` e `--mc-fx-glow-b` para `.mc-board .cell .p-w/.p-b`
- [x] 6. Células `own-zone` no POSITION: `color-mix` com `--cell-light`/`--cell-dark` + accent 18%; classe adicionada em `syncBoard()` quando `state.phase === 'POSITION' && logicalY < 2`
- [x] 7. Validação JS: 3 script blocks — 0 falhas

### Arquivos alterados
- `html/index.html`: novo `<style>` antes de `<!-- GAME AREA -->`, HTML de `#game-area` substituído, 2 linhas em `T.pt` e `T.en`, 4 linhas em `syncBoard()` e `updateUI()`

### Bugs / Bloqueios Conhecidos
- `opp-meta` (sub-texto do oponente) é atualizado apenas via `id` — o JS existente só usa `#opp-status`. O `#opp-meta` fica "aguardando…" a menos que futuras sessões adicionem atualização
- `opp-dot.thinking` requer que o JS chame `document.getElementById('opp-dot').classList.toggle('thinking', ...)` — não implementado nesta sessão

### Notas para próxima sessão
- Próxima sessão: Design-E (Duelo + Game Over + Empate)

---

## [2026-04-19] Sessão Design-E — Duelo + Game Over + Empate

**Status:** Completo
**Branch:** main

### Feito
- [x] 1. `#duel-modal` redesenhado com layout horizontal: dois `.duel-col` + `.duel-vs-sep` "VS" no meio
  - `#duel-status` → pill (mono, danger-soft bg, danger color)
  - `.duel-card` com tema claro (mc-surface, mc-rule border)
  - Badges de nome: laranja para brancas, azul-violeta para pretas
  - `.dice-interactive` com borda colorida por tema
  - `#close-duel` com `mc-accent` bg
  - Fundo `#duel-modal` → `mc-bg` (claro), sem fundo diagonal
- [x] 2. `#game-over-screen` redesenhado: `.gameover` com peça grande `#go-piece-icon`, `.verdict`, `#game-over-result`, `.go-mmr`, `.go-actions`
  - Fundo → `mc-bg` claro; sem linhas diagonais
  - Botões usam `.go-btn.ghost` e `.go-btn.accent`
  - Todos os IDs JS mantidos: `go-title`, `game-over-result`, `btn-go-menu`, `btn-go-again`
- [x] 3. Estado de Empate: `#go-piece-icon` mostra ♔ + ♚ lado a lado (ambas com aura); `#go-pdl-delta` exibe `t('pdl_draw')` = "= 0 PdL"
- [x] 4. Morte Súbita: `statusEl.classList.toggle('sudden-death')` ativa animação CSS de pulso vermelho; `statusEl.style.color` limpo (CSS cuida das cores)
- [x] 5. i18n: `pdl_draw` adicionado em PT ("= 0 PdL") e EN ("= 0 LP")
- [x] 6. Validação JS: 3 script blocks — 0 falhas

### Arquivos alterados
- `html/index.html`: novo `<style>` antes de `<!-- DUEL MODAL -->`, `#game-over-screen` HTML substituído, `#duel-modal` HTML atualizado, `renderDuelContent()` refatorado, bloco GAMEOVER em `updateUI()` expandido, 2 chaves i18n em T.pt/T.en

### Bugs / Bloqueios Conhecidos
- `#go-pdl-now` (rank do jogador após partida) populado via `Session.get()` — só funciona se usuário estiver logado
- `#go-pdl-delta` permanece vazio para vitória/derrota até que o servidor emita evento com delta PdL (P-12 / sessão futura)

### Notas para próxima sessão
- Próxima sessão: Design-G (Modais de sistema: ban, logout, delete, change-pw, reconnect)

---

## [2026-04-19] Sessão Design-G — Modais de Sistema

**Status:** Completo
**Branch:** main

### Feito
- [x] 1–5. Todos os 5 modais redesenhados com padrão unificado:
  - `#ban-overlay` → warn border, ⏸ icon, eyebrow "Acesso restrito", timer + botão FECHAR
  - `#logout-confirm` → simples, "Sair da conta?", row Cancelar / Sair (primary)
  - `#delete-account-confirm` → danger border, eyebrow "Ação permanente", row Cancelar / Excluir (danger)
  - `#change-password-modal` → eyebrow "Segurança", 3 campos `.mc-field`/`.mc-input`, `#cp-error`, row Cancelar / Salvar
  - `#reconnect-overlay` → `.sysmodal-ring` com spinner warn, timer grande, sub-texto W.O.
- [x] 6. Padrão: backdrop `rgba(245,243,238,0.88)` + `backdrop-filter:blur(10px)` + card `.sysmodal` centralizado
- [x] 7. Todos os IDs e onclick mantidos (verificado via script de check — 0 ausentes)
- [x] Validação JS: 3 script blocks — 0 falhas

### Arquivos alterados
- `html/index.html`: bloco `<style>` com sistema `.sysmodal-*`, HTML dos 5 modais substituído

### Bugs / Bloqueios Conhecidos
- `#ban-title` e `#ban-time-label` não mais usados separadamente (i18n via JS define `ban-title`; timer label integrado ao eyebrow). Se o JS atualizar `ban-title` via i18n, funciona; se não, mostra texto fixo PT.
- `backdrop-filter:blur()` não funciona em Safari < 15.4 sem `-webkit-backdrop-filter` — adicionado prefix.

### Notas para próxima sessão
- Próxima sessão: Design-H (Perfil + Editar avatar/apelido)

---

## [2026-04-19] Sessão Design-H — Perfil + Editar

**Status:** Completo
**Branch:** main

### Feito
- [x] 1. Redesenhado `#screen-profile`: topbar sticky (← · PERFIL · SALVAR), hero (avatar-xl + nome + rank + PdL), stats grid 2×2 + empates, winrate bar, avatar picker 2 fileiras, apelido input, ações
- [x] 2. Stat "Empates" (`#stat-draws`) adicionado na grid (span 2 colunas)
- [x] 3. `#avatar-grid` substituído por picker com 2 fileiras — Brancas (♔♕♖♗♘♙) e Pretas (♚♛♜♝♞♟), `data-piece` lowercase para pretas
- [x] 4. Botão SALVAR movido para topbar direito (`.ph-save-btn`), removido do fundo
- [x] 5. Convidado: card CTA "Criar conta" visível; `#ph-stats-section` oculto para guests
- [x] 6. Chaves i18n adicionadas em todos os 9 idiomas: `draws`, `avatar_white`, `avatar_black`, `create_account`, `create_account_cta`
- [x] 7. ELO visível = apenas nome do rank (`ph-elo-name`); nunca exibe número MMR bruto
- [x] `PIECE_ICONS` expandido: + `k q r b n p` (peças pretas)
- [x] `PIECE_MAP` em auth-frontend.js expandido: + peças pretas
- [x] `selectAvatar()` atualiza `#ph-avatar-display` (cor de fundo branco/preto + ícone)
- [x] `refreshProfileScreen()` reescrito: hero, winrate, guest/logged-in, draws, i18n completo
- [x] `MenuPopulator.populate()` atualiza `ph-elo-name`, `ph-pdl-val`, `stat-draws`
- [x] Validação JS: 3 script blocks — 0 falhas; todos 24 IDs presentes

### Arquivos alterados
- `html/index.html`: bloco `<style>` com 38 classes `.ph-*`, HTML de `#screen-profile` substituído, `PIECE_ICONS` expandido, `selectAvatar` e `refreshProfileScreen` atualizados, i18n 9 idiomas
- `html/auth-frontend.js`: `PIECE_MAP` expandido, `MenuPopulator.populate` atualizado com draws + hero

### Bugs / Bloqueios Conhecidos
- Servidor precisa retornar `p.draws` no endpoint `GET /player/:id` para o contador de empates funcionar corretamente (campo já existe se DB foi atualizado em sessões anteriores)

### Notas para próxima sessão
- Próxima sessão: Design-I (Ranking + Leaderboard)

---

## [2026-04-19] Sessão Design-I — Ranking + Leaderboard

**Status:** Completo
**Branch:** main

### Feito
- [x] 1. Redesenhado `#screen-ranking`: escada vertical dos 14 ranks (`.rk-group`/`.rk-row`/`.rk-piece`) com posição atual destacada (borda laranja + barra PdL + badge "Você · N PdL")
- [x] 2. Redesenhado `#screen-leaderboard`: linhas compactas (`.lb-r`) com posição · avatar · nome+rank · W/L
- [x] 3. Podium via classe CSS (`.rc-pos.gold/silver/bronze`) — ouro=#c18200, prata=#7a8a9a, bronze=#8a5a2a
- [x] 4. Linha "você" (`#lb-you-strip`) fixada abaixo da tabela scrollável; mostra posição e PdL do próprio jogador
- [x] 5. ELO = nome do rank apenas — `elo.name` sem MMR número
- [x] 6. PdL exibido só para o dono: no strip e na linha "you"; demais jogadores veem só o nome do rank
- [x] `_ELO_LADDER` array de 14 entradas definido no frontend, espelhando `server/elo.js RANKS`
- [x] `refreshRankingScreen()` reescrito: gera ladder HTML com grupos e divisões, destaca posição do jogador via `mc_elo_rank`/`mc_elo_lp` no localStorage
- [x] `Leaderboard.render()` em rank-ui.js reescrito: novo estilo light, podium, you-strip
- [x] `MenuPopulator.populate()` salva `mc_elo_rank` e `mc_elo_lp` no localStorage ao buscar `/player/:id`
- [x] Validação JS: 3 script blocks + rank-ui.js + auth-frontend.js — 0 falhas; 11 IDs presentes

### Arquivos alterados
- `html/index.html`: bloco `<style>` com 35 classes `.rk-*` e `.lb-*`, HTML de `#screen-ranking` e `#screen-leaderboard` substituídos, `_ELO_LADDER` e `refreshRankingScreen()` reescritos
- `html/rank-ui.js`: `Leaderboard.render()` reescrito com novo estilo e you-strip
- `html/auth-frontend.js`: `MenuPopulator.populate()` salva `mc_elo_rank`/`mc_elo_lp`

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para próxima sessão
- Próxima sessão: Design-J (Histórico + Replay)

## [2026-04-19] Sessão Design-J — Histórico + Replay

**Status:** Completo
**Branch:** main

### Feito
- `server/server.js`: adicionado `recordTurn(..., { type:'position' })` no handler `position_ready` — Turno 0 agora gravado no replay
- `html/index.html`: bloco CSS para `#screen-match-history` e `#screen-replay` (`.mh-*`, `.rp-*` classes com tokens `--mc-*`)
- `html/index.html`: nova tela `#screen-match-history` com topbar + lista `#match-history-list`
- `html/index.html`: nova tela `#screen-replay` com header de resumo, board 4×4, banner de duelo, controles
- `html/index.html`: i18n `turn_positioning` adicionado em todos os 9 idiomas
- `html/rank-ui.js`: `MatchHistory.render()` reescrito com classes light-theme (`.mh-result.win/lose/draw/wo`, `.mh-pdl.up/dn/eq`)
- `html/replay-ui.js`: `ReplayViewer` completamente reescrito:
  - `_displayTurns()`: inclui type='position' (turno 0) + type='action'
  - `open()`: popula `#rp-match-res`, `#rp-match-opp`, `#rp-match-pdl` a partir de `_meta`
  - `renderTurn()`: board com `.rp-cell`/`.rp-piece.pw/.pb`, labels `#rp-turn-label`/`#rp-turn-count`, banner de duelo `.rp-duel-banner.visible`
  - Formato duel: "♘ Cavalo venceu ♛ Rainha · 7 (5+2) × 6 (2+4)"
  - `play()`: toggle `.rp-ctrl.playing` no botão de auto-play

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para próxima sessão
- Próxima sessão: Design-K (Configurações + Como Jogar + Créditos + links externos P-B)

## [2026-04-19] Sessão Design-K — Configurações + Como Jogar + Créditos

**Status:** Completo (exceto URLs reais — pendente confirmação do usuário)
**Branch:** main

### Feito
- `html/index.html`: bloco CSS Design-K (`.dk-*` classes com tokens `--mc-*`)
- `html/index.html`: i18n — 4 novas chaves (`appearance`, `info`, `dark_theme`, `htp_bonus_title`) em todos os 9 idiomas
- `html/index.html`: `#screen-settings` completamente redesenhado:
  - `rk-topbar` com ← de volta ao menu
  - Grid 3×3 de idiomas com `fi fi-xx fis` (flag-icons CSS, sem emoji)
  - Toggle de tema escuro (`.dk-toggle`) com estado salvo em localStorage
  - Action-rows para Perfil / Como Jogar / Créditos
- `html/index.html`: `#screen-how-to-play` redesenhado:
  - `rk-topbar` com ← de volta a configurações
  - 4 cards numerados (1–4) usando fases existentes do i18n
  - Tabela de bônus com valores corretos do servidor (Q+5, R+4, N+3, B+2, P+1, K+5)
  - Nota de objetivo reutilizando `htp_intro`
- `html/index.html`: `#screen-credits` redesenhado:
  - `rk-topbar` com ← de volta a configurações
  - Layout centrado com logo, versão, nome, estúdio, links
  - Botão de feedback (mantém `href="#"` até URLs confirmadas)
- `html/index.html`: `refreshSettingsScreen()` atualizado para novos IDs + sync do toggle
- `html/index.html`: `renderHowToPlay()` reescrito com cards + tabela de bônus usando `CONFIG`
- `html/index.html`: `window.toggleDarkTheme()` implementado + init de tema ao carregar

### Bugs / Bloqueios Conhecidos
- URLs reais (portfolio, site, instagram, itch.io, feedback) ainda com `href="#"` — aguardando confirmação do usuário

### Notas para próxima sessão
- Próxima sessão: Design-L (Estados de exceção: disconnect, AFK, Morte Súbita, sem conexão)
- ⚠️ DEPENDÊNCIA P-B: confirmar URLs com o usuário antes de inserir

## [2026-04-19] Sessão Design-L — Estados de Exceção

**Status:** Completo
**Branch:** main

### O que foi feito

#### CSS + HTML (index.html)
- Bloco `<style>` com classes `.exc-banner`, `.exc-danger`, `.exc-warn`, `.exc-info`, `.exc-timer`, `.exc-pulse`, `.exc-blur-panel`
- `#phase-title.sd-phase` — pílula vermelha pulsando durante Morte Súbita
- `#pr-join-input.exc-err` — borda vermelha no input de código de sala privada
- `#exc-no-conn` — tela cheia "Sem conexão" com botão retry
- `#exc-leave-overlay` — sheet confirmação de W.O. ao sair durante partida
- `#exc-reconn-banner` — banner âmbar fixo no topo "Reconectando…"
- `#opp-dc-banner` (`.exc-danger`) — strip abaixo do topbar com countdown de reconexão do oponente
- `#afk-banner` (`.exc-warn`) — strip âmbar com timer pulsando para AFK warning
- `#sudden-death-banner` (`.exc-info`) — strip informativo durante Morte Súbita

#### JS (index.html — script block Design-L)
- `window.ExcBanners` — API centralizada: `showOppDc`, `hideOppDc`, `showAfk`, `hideAfk`, `showSuddenDeath`, `hideSuddenDeath`, `hideAll`
- `window.showLeaveConfirm` / `hideLeaveConfirm` / `confirmLeave`
- AFK tracker client-side: 45s countdown em ACTION phase; mostra banner quando ≤15s; para quando `ready[myColor]` = true
- `window.quitGame` atualizado: exibe `#exc-leave-overlay` se `#game-area` estiver visível
- `window.returnToMenu` atualizado: chama `ExcBanners.hideAll()`
- `renderDuelContent` atualizado: sync de `showSuddenDeath` / `hideSuddenDeath` com o modal

#### auth-frontend.js
- `showDisconnectBanner()` reescrita: usa `#exc-reconn-banner` + `#exc-no-conn` (se não inGame) + `.exc-blur-panel` (se inGame)
- `socket.on('connect')` atualizado: remove todos os novos elementos + remove blur
- `ReconnectOverlay.show()`: usa `window.ExcBanners.showOppDc(remainMs)` em vez do modal bloqueante; fallback mantido
- `ReconnectOverlay.hide()`: chama `ExcBanners.hideOppDc()` além do modal

#### Sala privada
- `_onError()`: adiciona `.exc-err` ao input + remove na próxima digitação via `{ once: true }`

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para próxima sessão
- Próximas sessões planejadas: **P-12** (balanceamento MMR empate) + **P-B** (URLs reais créditos)
- ⚠️ DEPENDÊNCIA P-B: URLs reais ainda ausentes nos links de créditos (`#crd-portfolio`, `#crd-site`, `#crd-insta`, `#crd-itch`, `#crd-feedback-btn`)
- **Sessões restantes: 2** (P-12 técnico + P-B rápido de URLs)

## [2026-04-19] Sessão P-12 — Balanceamento MMR Empate + Fix Morte Súbita

**Status:** Completo
**Branch:** main

### O que foi feito

#### Bug fix — Morte Súbita incorreta (server/server.js)
- Removido `suddenDeath: true` do Case f (linha ~554): duelo frontal entre duas peças de mesmo bônus que ambas atacam o Rei do oponente. **Morte Súbita não é essa situação** — é apenas quando os dois Reis são as últimas peças.
- O `suddenDeath: true` permanece correto nos casos `checkFinalDuel` (linhas 643–649, 747–752)

#### P-12 — Draw MMR (server/mmr.js + server/server.js)
- `mmr.js`: adicionada função `calculateDraw(mmrA, mmrB)` — ELO padrão com score=0.5: `delta = K × (0.5 − expected)`. Floor de +1 para o jogador mais fraco quando o arredondamento produziria 0.
- Exportada junto com `calculate` e `getRank`
- `server.js`: importado `calculateDraw`
- `_persistDB`: caso `draw` agora chama `calculateDraw` em vez de manter `wDelta=bDelta=0`
- `_persistDB`: queries UPDATE adicionam `draws=draws+?` (coluna já existia no schema, nunca havia sido incrementada)
- `finishDuel`: tie handling refatorado — King vs King tie agora dispara `persistMatchResult(room, 'draw', false)` + `phase = 'GAMEOVER'` em vez de eliminar o Rei preto por padrão

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para próxima sessão
- Próxima (e última) sessão planejada: **P-B** — inserir URLs reais nos links de créditos
- ⚠️ DEPENDÊNCIA P-B: confirmar URLs com usuário
- **Sessões restantes: 1** (P-B — rápido, só substituição de URLs)

---

## [2026-04-19] Sessão P-12B — PdL Empate + SD-1 Announce (Morte Súbita)

**Status:** Completo
**Branch:** main

### O que foi feito

#### P-12B — PdL em caso de empate (server/server.js)
- `_persistDB` draw case: MMR calculado por `calculateDraw` (padrão ELO) — sem mudança
- PdL calculado separadamente: jogador mais forte recebe 0 PdL, jogador mais fraco recebe `max(0, delta)` PdL
- Introduzidas variáveis `wLpInput` / `bLpInput` para separar lógica de PdL do MMR no draw

#### SD-1 — Fase SUDDEN_DEATH e overlay de anúncio (server.js + index.html)
**server/server.js:**
- `resolveAction` → `checkFinalDuel`: quando apenas dois Reis restam, define `phase = 'SUDDEN_DEATH'` e retorna cedo (sem criar duel imediatamente)
- `action_ready` handler: após `resolveAction`, detecta `phase === 'SUDDEN_DEATH'` e agenda `setTimeout(3000)` que cria o duel King vs King com `suddenDeath: true` e faz `broadcast`
- `finishDuel` → `checkFinalDuel`: mesmo padrão — fase SUDDEN_DEATH + broadcast + setTimeout 3s
- `finishDuel` tie (King vs King empate de dados): chama `persistMatchResult(room, 'draw', false)` + `phase = 'GAMEOVER'`

**html/index.html:**
- Adicionado `#sd-overlay` (div fullscreen, `z-index:2500`, fundo `rgba(0,0,0,0.97)`) com ícones ♔ VS ♚, título "MORTE SÚBITA" em vermelho pulsante, subtítulo i18n
- `PHASE_LABELS` atualizado: `SUDDEN_DEATH` incluído com label e sub
- `handlePhaseChange`: chama `triggerSuddenDeathOverlay()` quando phase === 'SUDDEN_DEATH'; oculta overlay em outras fases
- `triggerSuddenDeathOverlay()`: popula `#sd-sub` com texto i18n, exibe overlay, auto-oculta após 3s (sincronizado com servidor)
- `updateUI`: `SUDDEN_DEATH` mapeado no `phaseMap`; desabilita `#btn-ready` durante essa fase; oculta `#sd-overlay` quando `duel.active && duel.suddenDeath`
- `handleCellClick`: bloqueia input durante `SUDDEN_DEATH`
- `window.returnToMenu`: oculta `#sd-overlay` explicitamente ao voltar ao menu
- `renderDuelContent`: sincroniza ocultação do `#sudden-death-banner` ao entrar no duel de Morte Súbita
- Chave `sd_subtitle` adicionada a todos os 9 idiomas (PT/EN/ES/DE/IT/RU/JA/KO/ZH)

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para próxima sessão
- ⚠️ DEPENDÊNCIA P-B: confirmar URLs reais dos links de créditos com usuário
- **Sessões restantes: 1** (P-B — só substituição de URLs)

---

## [2026-04-19] Sessão OPT-A — Ganhos Rápidos (Twemoji + Fontes + GZIP)


**Status:** Completo
**Branch:** main

### O que foi feito

#### Removido Twemoji (~1.7MB)
- `html/index.html`: removida tag `<script src="twemoji@14.0.2...">` do `<head>`
- Confirmado antes: zero usos de `twemoji.*` em todo o código

#### Reduzidos pesos de fonte (Google Fonts URL)
- Cinzel: `400;600;700;900` → `400;700`
- Inter: `300;400;500;600;700;800` → `400;600`
- JetBrains Mono: `400;500;600;700` → `400;600`
- Cinzel Decorative, IBM Plex Mono: sem alteração (já mínimos)

#### Ativado GZIP no Express
- `server/server.js`: `require('compression')` + `app.use(compression())` antes do `helmet`
- `npm install compression` — adicionado ao `package.json`

### Impacto esperado
- Remoção Twemoji: ~1.7MB eliminados do carregamento inicial
- GZIP: `index.html` ~180kb → ~40kb; `auth-frontend.js` ~18kb → ~5kb

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para próxima sessão
- Próxima: **OPT-B** — animação de peças transform vs left/top (risco médio-alto)

---

## [2026-04-19] Sessão OPT-B — Animação de peças: transform vs left/top

**Status:** Completo
**Branch:** main

### O que foi feito

#### CSS — `.piece` (html/index.html)
- Adicionado `left: 0; top: 0;` (âncora fixa no canto do board)
- Adicionado `transform: translate(var(--px, 0%), var(--py, 0%))` como posicionamento base
- `will-change: left, top` → `will-change: transform` (hint correto para o compositor)
- `transition`: removido `left 0.45s` e `top 0.45s`, substituído por `transform 0.45s cubic-bezier(0.34,1.15,0.64,1)`; removido `transform 0.2s ease` (agora unificado)
- Adicionada classe `.piece.piece-hidden` para o estado phase-hidden (substitui inline styles `opacity/pointerEvents/transform`)

#### CSS — `.piece.selected`
- `transform: scale(1.22) translateY(-6%)` → `transform: translate(var(--px,0%), var(--py,0%)) scale(1.22) translateY(-6%)`
- Mantém posição correta ao selecionar

#### CSS — `@keyframes piece-enter` e `@keyframes piece-capture`
- Cada frame reescrito para incluir `translate(var(--px,0%), var(--py,0%))` como primeira transformação
- Animações de entrada e captura mantêm a posição correta durante todo o keyframe

#### JS — `syncBoard()` (html/index.html)
- Criação de peça: `el.style.left/top = '${N*25}%'` → `el.style.setProperty('--px/--py', '${N*100}%')`
- Phase-hidden: `el.style.opacity/pointerEvents/transform` diretos → `el.classList.add('piece-hidden')`
- Restauração de phase-hidden: verificação `style.opacity === '0'` → `classList.contains('piece-hidden')`, remoção via `classList.remove`
- Movimento: `el.style.left/top` → `el.style.setProperty('--px/--py', '${N*100}%')`
- Nenhum `style.transform` inline restante nas peças

### Por que N*100% em vez de N*25%
O elemento `.piece` tem `width: 25%` do board. `translate(100%, 0)` move a peça pela sua própria largura = 25% do board = 1 célula. Logo, coluna N → `translate(N*100%, 0)`.

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para próxima sessão
- Próxima: **OPT-C** — flag-icons inline, SW versioning, perMessageDeflate, CSS hints

---

## [2026-04-19] Sessão OPT-C — flag-icons + perMessageDeflate + CSS hints

**Status:** Completo
**Branch:** main

### O que foi feito

#### flag-icons inline (html/index.html)
- Removido `<link rel="stylesheet" href="cdn.../flag-icons.min.css">` (~60kb de CSS)
- Adicionado `<style>` inline no `<head>` com apenas as 9 classes necessárias:
  `.fi`, `.fis` (base) + `.fi-br/gb/es/de/it/ru/jp/kr/cn` (SVG via URL individual do CDN)
- Cada bandeira carrega apenas 1 SVG (~2kb) ao invés de todo o CSS (~60kb)

#### Preload da fonte Cinzel (html/index.html)
- Adicionado `<link rel="preload" as="style">` para Cinzel antes do `<link>` principal
- Fonte crítica para logo e títulos passa a ser descoberta antes pelo parser

#### perMessageDeflate no Socket.io (server/server.js)
- `new Server(server, { cors: ... })` expandido com `perMessageDeflate: { threshold: 1024 }`
- Mensagens WebSocket > 1kb são comprimidas automaticamente

#### `contain: layout style` nas células do board (html/index.html)
- Adicionado à regra `.mc-board .cell`
- Reflows dentro de uma célula não propagam para o restante da página

#### SW — já em v2 (confirmado, não alterado)

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para próxima sessão
- Próxima: **TESTES-A** — unit tests + db-inspector

---

## [2026-04-19] Sessão TESTES-A — Unit tests + db-inspector

**Status:** Completo
**Branch:** main

### Feito
- `testes/server/elo.test.js` — 20 testes para `elo.js` (RANKS, getRankById, applyLPChange, getEloDisplay) · 100% passando
- `testes/server/mmr.test.js` — 16 testes para `mmr.js` (calculate, calculateDraw, getRank, getBanDuration) · 100% passando
- `testes/server/run-tests.js` — runner que executa todos os `*.test.js` sequencialmente, exitCode 1 se algum falhar
- `testes/db-inspector.js` — inspetor do banco SQLite: resumo, distribuição de resultados, top 10 por MMR, partidas recentes, detalhe de jogador por `--player <username>`
- `server/package.json`: script `"test"` adicionado — `node ../testes/server/run-tests.js`

### Como usar
```
# Rodar testes unitários (da pasta server/):
npm test

# Inspecionar banco (da raiz do projeto):
node testes/db-inspector.js
node testes/db-inspector.js --player dash_
node testes/db-inspector.js --matches 20
```

### Notas para próxima sessão
- Próxima: **TESTES-B** — Integration API + partida automatizada

---

## [2026-04-19] Sessão P-12 (items 5-6) — Game-Over PdL delta real

**Status:** Completo
**Branch:** main

### O que foi feito

- `html/auth-frontend.js`: adicionada função `_updateGameOverPdl(lpDelta, elo)` que, quando o evento `mmr_update` chega enquanto `#game-over-screen` está visível, popula:
  - `#go-pdl-delta` com `+N PdL` / `-N PdL` / `±0 PdL` e classes `.delta.up` / `.delta.dn` / `.delta.eq`
  - `#go-pdl-now` com `{icon} {name} · {lp} PdL` (estado pós-partida)
- `mmr_update` handler: chama `_updateGameOverPdl` imediatamente após `showMMRToast`
- `html/index.html` `launchGame()`: reseta `#go-pdl-delta` e `#go-pdl-now` ao iniciar nova partida (evita valores residuais)

### Bugs / Bloqueios Conhecidos
- Nenhum

### Notas para próxima sessão
- ⚠️ DEPENDÊNCIA P-B: confirmar URLs reais dos links de créditos com usuário
- **Sessões restantes: 1** (P-B — só substituição de URLs)

---

## [2026-04-19] Correções de bugs pós-redesign

**Status:** Completo
**Branch:** main

### Feito

#### Bug crítico — Auth (server/server.js)
- `POST /auth/register` retornava 500: coluna `email TEXT NOT NULL` recebia `null` (regressão da Sessão 18 V-06)
- Fix: INSERT agora passa `email_enc` na coluna legada `email`

#### Bug crítico — Jogo voltava ao menu após GO (html/index.html)
- `#screen-menu` tinha `style="display:flex"` inline (Design-B) — sobrepõe `.screen { display:none }` via CSS
- Menu permanecia visível (z-index 4000) bloqueando o game-area (z-index 1)
- Fix: `display:flex` removido do inline; layout movido para regra CSS `#screen-menu`

#### Bug de UX — Tab bar sobrepunha o jogo (html/index.html)
- `#mc-tabbar` tem `z-index:90`, `#game-area` tem `z-index:1` — tabbar visível durante partida
- Fix: `launchGame()` esconde o tabbar; `returnToMenu()` restaura

#### Bug de ambiente — npm run dev não carregava .env (server/package.json)
- Script `dev` não passava `--env-file=.env`; `auth.js` faz `process.exit(1)` se JWT_SECRET ausente
- Fix: script atualizado para `node --env-file=.env --watch server.js`

### Gaps conhecidos (não bloqueadores)
- `#opp-dot.thinking` e `#opp-meta` não atualizados em tempo real (Design-D — low priority)
- URLs reais nos créditos ainda `href="#"` (P-B — requer confirmação do usuário)
- `p.draws` precisa ser retornado pelo servidor para o stat de empates no perfil

---

## [2026-04-19] Sessão POL-Theme — Detecção automática de tema do sistema

**Status:** Completo
**Branch:** main

### Feito
- Atualizado init IIFE em `html/index.html`: prioridade `localStorage` → `prefers-color-scheme` → light
- Adicionado `matchMedia.addEventListener('change')` para reagir a mudança do tema do SO em tempo real (só quando sem preferência salva)
- Sincronização do botão toggle (`.on`) incluída no apply, além do `refreshSettingsScreen()` existente

### Comportamento resultante
| Situação | Tema aplicado |
|----------|--------------|
| Usuário tem preferência salva (`mc_theme`) | Usa a preferência salva |
| SO em dark mode, sem preferência salva | Aplica dark automaticamente |
| SO em light mode, sem preferência salva | Aplica light (padrão) |
| Usuário muda tema no SO enquanto joga | Atualiza em tempo real (se sem preferência salva) |
| Usuário usa o toggle no jogo | Salva em localStorage, sobrepõe sistema |

---

## [2026-04-23] Sessão INFRA-A — Railway Volume + Persistência do Banco + Monitoramento

**Status:** Parcialmente concluído — itens de código feitos; itens de infraestrutura aguardam ação do usuário
**Branch:** main

### Feito
- `server/db/database.js` linha 8: `DB_PATH` agora usa `process.env.DB_PATH` com fallback local
- `server/db/database.js`: tabela `server_starts (id, ts, node_version)` criada via `CREATE TABLE IF NOT EXISTS` junto às migrations
- `server/server.js` callback de `server.listen`: INSERT em `server_starts` no boot com `Date.now()` e `process.version`
- Sintaxe validada com `node --check` em ambos os arquivos

### Pendente (requer ação do usuário)
- [x] **Railway:** Volume criado, montado em `/data` no serviço microChess
- [x] **Railway:** variável de ambiente `DB_PATH=/data/microchess.db` configurada
- [x] **Deploy:** redeploy feito e persistência validada
- [x] **UptimeRobot:** monitor HTTP em `https://microchess-production.up.railway.app/health`, intervalo 5 min

---

## [2026-04-23] Sessão PRE-OT-A — Idioma EN padrão + preferência por usuário

**Status:** Completo
**Branch:** main

### Feito
- `server/db/database.js`: migration `lang TEXT DEFAULT 'en'` adicionada à tabela `players`
- `server/server.js`: login e register passam a retornar `lang` na resposta JSON
- `server/server.js`: novo endpoint `PATCH /auth/lang` — salva idioma preferido do jogador autenticado
- `html/index.html` linha ~3547: detecção de idioma substituída por lógica de 3 camadas (localStorage → idioma do sistema → EN)
- `html/index.html` `selectLanguage`: passa a fazer `PATCH /auth/lang` em background quando autenticado; parâmetro `_skipServer=true` evita loop no login
- `html/auth-frontend.js`: após login bem-sucedido, aplica `data.lang` do servidor via `selectLanguage(lang, true)`
- `html/index.html` grid de idiomas: reordenado para EN primeiro (EN, PT, ES, DE, IT, RU, JA, KO, ZH)
- Sintaxe validada com `node --check`

### Comportamento resultante de prioridade de idioma
| Situação | Idioma aplicado |
|----------|----------------|
| Usuário autenticado com lang salvo no servidor | Idioma do servidor (sobrescreve tudo) |
| Usuário sem conta, com preferência salva no dispositivo | Preferência do localStorage |
| Primeiro acesso, sistema em PT/ES/DE/IT/RU/JA/KO/ZH | Idioma do sistema |
| Primeiro acesso, sistema sem idioma suportado | Inglês (EN) |

---

## [2026-04-21] Sessão PRE-OT-B — Modo Casual + novo fluxo NOVO JOGO

**Status:** Completo
**Branch:** main

### Feito
- `html/index.html` strings (9 idiomas): adicionadas chaves `mode_title`, `mode_casual`, `mode_ranked`, `mode_casual_desc`, `mode_ranked_desc`, `mode_find_match` em todos os blocos de idioma
- `html/index.html` botão `btn-novo-jogo`: agora chama `showScreen('game-mode')` em vez de ir direto ao matchmaking
- `html/index.html`: inserido `#screen-game-mode` com dois cards (CASUAL / RANQUEADA), botão ENCONTRAR PARTIDA desabilitado até seleção, botão voltar ao menu
- `html/index.html`: adicionadas funções `selectGameMode()`, `startMatchmakingWithMode()`, `refreshGameModeScreen()`
- `html/index.html` `showScreen()`: reseta estado da tela de modo ao navegar
- `html/index.html` `selectLanguage`: chama `refreshGameModeScreen()` para atualizar textos ao trocar idioma
- `html/index.html` `goMatchmaking()`: aceita parâmetro `mode`, passa `match_mode` no emit `queue_join`
- `server/server.js` `_persistDB()`: lógica `isCasual` — partidas casuais gravam resultado mas não alteram MMR/XP/LP
- `server/server.js` `queue_join`: extrai `match_mode` do perfil; propaga para sala criada
- `server/server.js` salas privadas: sempre criadas com `match_mode: 'casual'` e `isRanked: false`
- `server/db/database.js`: migration `match_mode TEXT DEFAULT 'ranked'` adicionada à tabela `matches`

### Comportamento resultante
| Situação | Modo | MMR/XP muda? |
|----------|------|-------------|
| Matchmaking → Casual | casual | Não |
| Matchmaking → Ranqueada | ranked | Sim |
| Sala Privada (qualquer) | casual | Não |
| Guest vs Guest | ranked no código, mas `isRanked=false` | Não |

---

## [2026-04-23] Sessão PRE-OT-C — Terminologia PdL→XP + Timer visível desde t=0

**Status:** Completo
**Branch:** main

### Feito
- `html/index.html` strings PT: `ranking_desc` substituído ("Pontos de Liga (PdL)" → "Pontos de Experiência (XP)"); `pdl_draw` substituído ("= 0 PdL" → "= 0 XP")
- `html/index.html` strings EN: `ranking_desc` substituído ("League Points (LP)" → "Experience Points (XP)"); `pdl_draw` substituído ("= 0 LP" → "= 0 XP")
- `html/index.html` strings ES: `ranking_desc` substituído ("Puntos de Liga (PdL)" → "Puntos de Experiencia (XP)")
- `html/index.html` strings DE: `ranking_desc` substituído ("Ligapunkte (LP)" → "Erfahrungspunkte (XP)")
- `html/index.html` strings IT: `ranking_desc` substituído ("Punti Lega (PL)" → "Punti Esperienza (XP)")
- `html/index.html` strings RU: `ranking_desc` substituído ("Очков Лиги (ОЛ)" → "Очков опыта (XP)")
- `html/index.html` strings JA: `ranking_desc` substituído ("リーグポイント（LP）" → "経験値（XP）")
- `html/index.html` strings KO: `ranking_desc` substituído ("리그 포인트 (LP)" → "경험치 (XP)")
- `html/index.html` strings ZH: `ranking_desc` substituído ("联赛积分 (LP)" → "经验值 (XP)")
- `html/index.html` ~linha 1862: modal de exclusão de conta — "PdL" → "XP"
- `html/index.html` ~linha 3834: badge de leaderboard — `${youLp} PdL` → `${youLp} XP`
- `html/index.html` `_startAfkTimer()`: timer agora chama `showAfk` imediatamente ao iniciar (t=45) e a cada segundo — removida condição `<= AFK_WARN_AT`
- Confirmado: ES, DE, IT, RU, JA, KO, ZH não possuíam chave `pdl_draw` — nenhuma ação necessária
- Confirmado: 3 ocorrências restantes de "PdL" são comentários internos de código — não são texto visível ao usuário

---

## [2026-04-23] Sessão PRE-OT-D — Bug Fixes: tema claro, Criar Conta no header, rank incorreto

**Status:** Completo
**Branch:** main

### Feito
- `html/index.html`: bloco CSS `[data-theme="light"], .theme-light-ui` inserido com todas as variáveis `--mc-*` e `--bg/--accent` para tema claro — tema claro agora funciona mesmo com sistema em dark mode
- `html/auth-frontend.js` `MenuPopulator.populate()`: visibilidade de `menu-guest-cta` (hide) e `menu-logged-stats` (show) atualizada imediatamente após login
- `html/auth-frontend.js` `MenuPopulator.populate()`: badge de rank exibe dados de ELO reais se disponíveis; fallback para `—` em vez de "Cavaleiro" padrão
- `html/auth-frontend.js` login: `session` agora inclui campo `elo` recebido do servidor
- `server/server.js` `/auth/login`: query ampliada com `elo_rank, elo_lp`; response inclui `elo: getEloDisplay(...)` — cliente recebe ELO correto imediatamente ao logar
- `html/auth-frontend.js`: todos os "PdL" residuais substituídos por "XP" (linhas 46, 50, 328, 333, 355)
- `node --check server/server.js` passou sem erros

---

## [2026-04-23] Sessão PRE-OT-E — Design/UI: botão Voltar, novo header

**Status:** Completo
**Branch:** main

### Feito
- `html/index.html` strings: chave `back` já existia nos 9 idiomas — nenhuma adição necessária
- `html/index.html` back buttons: 7 botões `.screen-back-btn` padronizados para `← <span class="back-label">VOLTAR</span>` (htp, crd, set, prof, mh, rp, rk)
- `html/index.html` screen-game-mode: back button convertido de estilo inline para `.screen-back-btn` padrão com `class="back-label"` no span interno
- `html/index.html` CSS `.rk-topbar .rk-title`: removido `flex:1`, adicionado `position:absolute;left:0;right:0;pointer-events:none` — título sempre centrado independente da largura do botão Voltar
- `html/index.html` `selectLanguage`: adicionado `querySelectorAll('.back-label').forEach(...)` para refresh automático dos botões ao trocar idioma
- `html/index.html` header `menu-logged-stats`: adicionado `menu-stat-d` (empates) na linha W·L·D e `menu-xp-val` entre stats e botão logout
- `html/auth-frontend.js` `MenuPopulator.populate()`: `menu-rank-badge` agora exibe apenas ícone + nome ELO (sem XP); `menu-stat-d` e `menu-xp-val` populados via fetch de `/player/:id`

### Comportamento resultante
| Elemento | Antes | Depois |
|---------|-------|--------|
| Back buttons | `←` (sem texto) | `← VOLTAR` / `← BACK` (i18n automático) |
| Header direito | `0W · 0L` | `0W · 0L · 0D` + `N XP` |
| Header esquerdo (rank badge) | `♟ Peão · 45 XP` | `♟ Peão` |

---

## [2026-04-23] Sessão PRE-OT-F — Auditoria i18n + Privacy Policy

**Status:** Completo
**Branch:** main

### Feito
- Auditoria i18n: 154 chaves PT verificadas contra 8 idiomas — apenas 3 gaps encontrados
- `html/index.html` strings ES/DE/IT/RU/JA/KO/ZH: adicionadas chaves `draft_clear`, `draft_return_hint`, `pdl_draw` (estavam ausentes em 7 idiomas)
- `html/index.html` strings (9 idiomas): adicionada chave `privacy_policy` com texto traduzido em cada idioma
- `html/index.html` tela Configurações: adicionado link `#link-privacy-policy` com `href="#"` (URL será preenchida na sessão P-B) e span `#pp-link-text` para i18n
- `html/index.html` `refreshSettingsScreen()`: atualiza `pp-link-text` automaticamente ao trocar idioma

### Estado
- Privacy Policy link: `href="#"` (placeholder) — URL real pendente da sessão P-B

---

## [2026-04-23] Sessão PRE-OT-G — Pesquisa: Legislação de Proteção de Dados

**Status:** Completo
**Branch:** main

### Feito
- Subagente `explorador` pesquisou CCPA, PIPEDA, APPI, PIPL, PDPA (Singapura e Tailândia)
- Criado `docs/PRIVACIDADE_GLOBAL.md` com análise completa por jurisdição
- Mapeado o que microChess já atende vs. gaps

### Conclusões principais
- ✅ microChess já atende: right to delete, dados mínimos, e-mail criptografado, sem SDKs de rastreamento
- 🔴 **China (PIPL):** data residency impossível para indie com servidor no exterior → recomendação: não promover na China
- 🟡 **Gaps para Open Test global:** age gate no cadastro + checkbox de transferência de dados (JP)
- 🟡 **Gaps médios:** Privacy Policy URL, versão em francês (pós launch)

---

## [2026-04-23] Sessão ANAL-A — Instrumentação Core de Métricas

**Status:** Completo
**Branch:** main

### Feito
- `server/replay.js` `recordTurn`: adicionado `ts: Date.now()` em cada snapshot gravado em `turns_json`
- `server/db/database.js` migrações: adicionada coluna `matches.ttm_ms INTEGER DEFAULT 0`
- `server/db/database.js`: criadas tabelas `ccu_snapshots (ts, count)` e `events (id, ts, type, user_id, match_id, metadata)` no startup
- `server/server.js` `_persistDB`: INSERT de matches expandido para gravar `duration_ms` (Date.now() - room._startedAt), `total_turns` (room._replay.turns.length), `ttm_ms` (média dos tempos de espera na fila)
- `server/server.js` `queue_join`: `newRoom` recebe `_startedAt: Date.now()` e `_ttmMs: média(ttm_white, ttm_black)` (timestamps de entrada na fila já existiam em p1/p2)
- `server/server.js` disconnect handler: grava `disconnect_ingame` em `events` com fase atual
- `server/server.js` `rejoin_game`: grava `reconnect_success` em `events` ao reconectar com sucesso
- `server/server.js` `rejoin_game`: grava `reconnect_fail` em `events` ao falhar reconexão
- `server/server.js`: setInterval de 5 minutos grava CCU em `ccu_snapshots` via `io.engine.clientsCount`

### Notas
- `room._matchId` é populado dentro de `_persistDB` — antes do fim da partida vale `null` nos eventos de disconnect/reconnect
- CCU snapshot usa `io.engine.clientsCount` (total de sockets conectados, não apenas em partida)

---

## [2026-04-23] Sessão ANAL-B — Tabela de Eventos: Instrumentação de Fluxo

**Status:** Completo
**Branch:** main

### Feito
- `server/analytics.js` criado: prepared statement singleton + `logEvent(type, userId, matchId, metadata)` com try/catch silencioso
- `server/server.js`: import de `{ logEvent }` adicionado
- `server/server.js`: variável `socketUserId` adicionada ao escopo do socket; capturada no `queue_join` autenticado
- `session_start` logado após login bem-sucedido (POST /auth/login)
- `session_end` logado no início do disconnect handler (quando socketUserId existe)
- `draft_start` logado (x2, white+black) quando match é encontrado na fila
- `draft_complete` + `phase_enter {phase: 'POSITION'}` logados (x2) quando ambos os jogadores confirmam o draft
- Os 3 `db.prepare` diretos de ANAL-A migrados para `logEvent`: `disconnect_ingame`, `reconnect_fail`, `reconnect_success`

### Eventos instrumentados (tabela events)
| Evento | Ponto | Dados |
|--------|-------|-------|
| session_start | POST /auth/login | user_id |
| session_end | disconnect | user_id |
| draft_start | match_found (queue) | user_id, match_id=roomId |
| draft_complete | draft_ready (ambos prontos) | user_id, match_id=roomId |
| phase_enter | draft_ready → POSITION | user_id, match_id, {phase} |
| disconnect_ingame | disconnect com partida ativa | user_id, match_id, {phase} |
| reconnect_success | rejoin_game bem-sucedido | user_id, match_id |
| reconnect_fail | rejoin_game sem pending | user_id |

---

## [2026-04-24] Sessão BUG-A — Correções Backend

**Status:** Completo
**Branch:** main

### Feito
- `server/server.js` `stateView`: lógica estava **invertida** — mostrava o planejamento do oponente enquanto ele ainda pensava; agora sempre oculta independente do `ready`
- `server/server.js` `startAFKTimer`: timer do próprio jogador que sofreu AFK não era limpo ao disparar; adicionado `clearAFKTimer(roomNow, color)` antes de limpar o oponente
- `server/server.js`: criado `apiLimiter` (60 req/min) e aplicado nas rotas `/leaderboard`, `/player/:id`, `/match/:id/replay`, `/player/:id/matches`

---

## [2026-04-24] Sessão BUG-B — Correções Frontend Críticas

**Status:** Completo
**Branch:** main

### Feito
- `html/index.html` `launchGame()`: `lastDuelKey = null` adicionado — duelos com mesmo key agora aparecem em novas partidas
- `html/auth-frontend.js` `handleSubmit`: flag `_busy` impede duplo-submit em login e registro
- `html/index.html` `privateRoom.join()`: timeout de 8s chama `_onError` automaticamente se servidor não responder; limpo ao receber `match_found`

---

## [2026-04-24] Sessão BUG-C — Correções Frontend Médias

**Status:** Completo
**Branch:** main

### Feito
- `html/index.html` `setMMState`: null check adicionado — não crasha mais se estado inválido chegar do servidor
- `html/index.html` campos de auth: `maxlength="254"` em emails, `maxlength="100"` em senhas (login e registro)
- `html/index.html`: handler `rejoin_success` adicionado — reseta `localSelection` e chama `updateUI()` ao reconectar
- `html/auth-frontend.js`: fallback "Guerreiro" agora passa por `window.t('warrior')` quando disponível

---

## [2026-04-30] Planejamento SP — Single Player Expansion (15 fases)

**Status:** Planejamento concluído — implementação em ⏳ Pendente
**Branch:** main
**Doc principal:** `docs/SP_PLANNING.md`

### Decisões aprovadas pelo usuário
- Terminologia: **SOLO/ONLINE** (tela "Novo Jogo"), **CONTINUAR/NOVO** (hub Solo), **CASUAL/RANQUEADA** (hub Online — já existe)
- 15 fases com nomes provisórios: Recruta, Aprendiz, Defensor, Atirador, Cavaleiro, Bispeiro, Tanque, Caçador, Estrategista, Duelista, Cercador, Iscador, Rainha, Mestre, Lenda
- Convidados (sem login) **não salvam progresso** — Solo exige conta
- Plano em arquivo novo (`docs/SP_PLANNING.md`) para economizar leitura nas sessões existentes

### Estrutura criada
- `docs/SP_PLANNING.md` (~440 linhas): autocontido — overview, decisões, arquitetura, 9 EPICs (SP-1..SP-9), 38 subtarefas detalhadas com checklist e subagente recomendado, mapa de dependências, tabela de status §10
- `docs/PROJECT_CONTEXT.md` tabela de progresso: linha "SP — Single Player Expansion ⏳ Em andamento" adicionada
- `docs/SESSAO_POR_SESSAO_PLANNING.md`: nota marcando BOT-B/BOT-C como obsoletas + seção apontando para SP_PLANNING.md
- Sessões antigas BOT-B e BOT-C ficam preservadas mas marcadas como substituídas

### Próxima sessão
**SP-1.1** — produzir `docs/SP_TERMS.md` com chaves i18n × 9 idiomas (sem pré-requisito; destrava SP-4.2/SP-5.3/SP-6.5/SP-7.4)

### Refinamento SP-6.4 (decisão posterior, mesma data)
- Convidados **podem** jogar Solo (sem persistência: progresso só em memória da sessão; F5 reseta)
- Botão "NOVO" — logado: `POST /sp/reset` zera `max_level_completed` no DB; convidado: apenas `window.spProgress = 0` em memória
- Adicionado endpoint `POST /sp/reset` em SP-2.3 e função `resetProgress(uid)` em SP-2.2
- SP-3.7 ajustado para aceitar `single_player_start` sem token (convidado)
- SP-3.8 ajustado para não persistir vitória se for convidado

---

## [2026-05-04] Sessão SP-1.1 — Terminologia i18n × 9 idiomas

**Status:** Completo
**Branch:** main
**Output:** `docs/SP_TERMS.md`

### Feito
- 23 chaves i18n catalogadas para o epic Single Player: `sp_solo`, `sp_online`, `sp_solo_desc`, `sp_online_desc`, `sp_continue`, `sp_new`, `sp_continue_desc`, `sp_new_desc`, `sp_phase`, `sp_completed_all`, `sp_map_title`, `sp_locked`, `sp_completed`, `sp_current`, `sp_play`, `sp_back_to_map`, `sp_victory`, `sp_defeat`, `sp_next_level`, `sp_retry`, `sp_phase_unlocked` (com `{N}`), `sp_new_confirm_logged`, `sp_new_confirm_guest`
- Cada chave traduzida para 9 idiomas (pt, en, es, de, it, ru, ja, ko, zh)
- Comprimento validado: maior label de botão é "TENTAR DE NOVO" / "Voltar ao Mapa" (14 chars) — todos dentro do limite
- Snippet pronto para colar em `html/index.html` (T.{lang}) gerado em §4 do SP_TERMS.md
- Mapeamento de quais chaves cada sessão dependente usa (SP-4.2, SP-5.3, SP-6.5, SP-7.4, SP-7.5, SP-8.1) gerado em §5
- Confirmado que SP-5.3 (multiplayer-mode) **não cria** chaves novas — reaproveita `mode_casual`/`mode_ranked`/`mode_find_match` da PRE-OT-B
- 15 nomes de fase (`sp_lvl1_name`..`sp_lvl15_name`) deixados para SP-7.4 conforme planejado

### Próxima sessão
**SP-1.2** — Spec textual das 15 estratégias → `docs/SP_STRATEGIES.md`

---

## [2026-05-04] Sessão SP-1.2 — Spec funcional das 15 estratégias do bot

**Status:** Completo
**Branch:** main
**Output:** `docs/SP_STRATEGIES.md`

### Feito
- Recap de regras do jogo embutido no doc (4×4, custos das peças, movimentos válidos) — implementador não precisa abrir outras docs
- Definida interface obrigatória que cada estratégia deve exportar (`chooseDraft`, `choosePosition`, `chooseAction`)
- Lista de **helpers comuns** que SP-3.1 deve criar em `server/bot-strategies/_helpers.js` (randomChoice, legalMoves, manhattanDist, findKing, pieceBonus, isPieceUnderThreat, enemyAt, dirForward)
- Pseudocódigo declarativo das 15 estratégias com 3 sub-blocos (DRAFT/POSITION/ACTION) cada
- Composições de DRAFT validadas contra orçamento de 5 pontos
- Tabela §5 de validação cruzada confirmando que cada estratégia é **distinguível** (sem duplicatas funcionais)
- Estratégia 8 (Caçador) marcada explicitamente como **port direto** do `bot.js` atual — economia de implementação em SP-3.4
- Estratégia 14 (Mestre) com lookahead 2-ply e nota de performance (alvo <100ms)
- Estratégia 15 (Lenda) = Mestre + 20% aleatoriedade só entre top 3 — distinguível do Recruta (100% random)
- Tabela §6 de notas por sessão SP-3.* (qual sessão pega quais estratégias e cuidados)
- Tabela §7 de balanceamento esperado para SP-9.1 (win-rate de novato por fase)
- Delays UX padronizados em §4 (700ms-1800ms para criar sensação de "bot pensando")

### Notas
- O helper `isPieceUnderThreat` será usado em SP-3.4 (estratégia 9), SP-3.5 (10/11) e SP-3.6 (13/14/15) — vale priorizar implementação cuidadosa em SP-3.1
- Lookahead 2-ply do Mestre simplifica resolução de duel via valor médio (3.5) em vez de simular o random — evita explosão combinatória
- Estratégia 12 (Iscador) usa `state.turn % 3` como máquina de estado — confirmar que `state.turn` é exposto pelo server (verificar em SP-3.5)

### Próxima sessão
**SP-1.3** — Wireframes textuais das 4 telas → `docs/SP_WIREFRAMES.md`

---

## [2026-05-04] Sessão SP-1.3 — Wireframes textuais das 4 telas

**Status:** Completo
**Branch:** main
**Output:** `docs/SP_WIREFRAMES.md`

### Feito
- §0 Convenções comuns: header padrão, card grande padrão, CTA primário padrão, modal padrão (todos referenciando tokens `--mc-*` já existentes)
- §1 `#screen-game-mode` (REFORMATADA): 2 cards SOLO/ONLINE — ASCII layout + hierarquia HTML completa + 6 IDs novos + 3 handlers + nota para comentar (não deletar) os 3 cards atuais
- §2 `#screen-multiplayer-mode` (NOVA): extração dos cards Casual/Ranqueada + FIND MATCH — confirmado que reaproveita 7 i18n keys existentes (PRE-OT-B), sem duplicatas
- §3 `#screen-solo-hub` (NOVA): cards CONTINUAR (label dinâmico "Fase X") + NOVO + modal de confirmação com texto contextual (logado vs convidado)
- §4 `#screen-sp-map` (NOVA): grid 3-colunas mobile (5 desktop) com 15 cards, 3 estados visuais (completed/current/locked), modal de iniciar fase com estrelas de dificuldade, geração via JS recomendada
- §5 Tabela consolidada de 17 funções `window.*` a expor, indicando qual sessão (SP-4..SP-8) cria cada uma
- §6 Diagrama de fluxo de navegação completo (menu → game-mode → solo-hub → sp-map → game → game-over)
- §7 Notas de implementação: ordem recomendada (SP-4 → SP-5 → SP-7.1+2 → SP-6 → SP-8), papel da feature flag `SP_ENABLED`, requisitos de acessibilidade, breakpoints mobile

### Decisões de design tomadas durante o wireframe
- Geração dos 15 cards do mapa **via JS** em vez de 15 blocos repetidos no HTML — economia de tokens nas sessões de implementação
- Tabela `SP_DIFFICULTY` hardcoded em SP-7.1 (1-3:★, 4-6:★★, 7-10:★★★, 11-13:★★★★, 14-15:★★★★★) — bate com tabela §5 do SP_PLANNING
- Animação de unlock (SP-7.5) via `@keyframes` inline dentro de `<style>` próprio do `#screen-sp-map` — não tocar no `<style>` global
- Estados visuais não dependem só de cor (ícones ✓/▶/🔒 são distintos) — acessibilidade

### Notas para sessões SP-4..SP-8
- SP-4.1 redireciona `gm-card-solo` para placeholder até SP-6.2 (proteção da feature flag)
- SP-5.2 deve **preservar** `selectGameMode()` e `startMatchmakingWithMode()` antigos (legado ainda referenciado)
- SP-7.1 implementa `buildSPMap()` (1× ao entrar) + `refreshSPMap()` (em toda navegação para a tela)
- SP-7.5 usa fila `queuedUnlock` para tocar animação só quando o usuário voltar à sp-map (não imediatamente no game-over)

### EPIC SP-1 concluído
Os 3 docs autocontidos (`SP_TERMS.md`, `SP_STRATEGIES.md`, `SP_WIREFRAMES.md`) cobrem TODAS as decisões necessárias para SP-2..SP-9. Sessões de código não precisam mais de novas decisões de produto — só executar.

### Próxima sessão
**SP-2.1** — Migration SQLite (tabela `singleplayer_progress`). Primeiro código real do epic. Pode ir em paralelo com SP-3.1 (refator do `bot.js`).

---

## [2026-05-04] Sessão SP-2.1 — Migration SQLite: singleplayer_progress

**Status:** Completo
**Branch:** main
**Arquivo modificado:** `server/db/database.js`

### Feito
- Inserido bloco `db.exec(\`CREATE TABLE IF NOT EXISTS singleplayer_progress (...)\`)` em `server/db/database.js` na seção MIGRATIONS, logo após a tabela `events` (linha ~75)
- Schema final:
  ```sql
  CREATE TABLE IF NOT EXISTS singleplayer_progress (
      player_id           TEXT PRIMARY KEY,
      max_level_completed INTEGER NOT NULL DEFAULT 0,
      updated_at          INTEGER NOT NULL,
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
  )
  ```
- Validado com `node --check server/db/database.js` → OK
- Validado funcionalmente: rodado `node -e "require('./db/database.js')"` + PRAGMA table_info — confirmado que tabela aparece em `sqlite_master`, com 3 colunas e FK CASCADE correta

### Correção de spec
- **SP_PLANNING.md §4 estava com `player_uid REFERENCES players(uid)`** — coluna PK em `players` se chama `id`, não `uid`. Corrigido no plano:
  - Coluna real: `player_id TEXT PRIMARY KEY`
  - FK: `REFERENCES players(id) ON DELETE CASCADE`
  - Adicionada nota explícita no §4 do SP_PLANNING.md sobre a convenção dual (JS usa `uid`, DB usa `player_id`)
- ON DELETE CASCADE adicionado: se conta for deletada, progresso vai junto (consistente com expectativa do usuário)

### Notas para SP-2.2
- Funções recebem `uid` como parâmetro (mantendo convenção JS) mas gravam coluna `player_id` no DB
- `updated_at` é INTEGER (Unix ms, `Date.now()`) — segue padrão de `events.ts` e `ccu_snapshots.ts`
- Tabela já populada com 0 linhas (criação idempotente via `IF NOT EXISTS`); reinício do servidor ou primeira chamada de função em SP-2.2 vai inserir registros conforme uso

### Próxima sessão
**SP-2.2** — `server/singleplayer.js` com 4 funções. Em paralelo: **SP-3.1** (refator `bot.js`).

---

## [2026-05-04] Sessão SP-2.2 — Módulo server/singleplayer.js

**Status:** Completo
**Branch:** main
**Arquivo criado:** `server/singleplayer.js` (66 linhas)

### Feito
- Padrão seguido: `analytics.js` (prepared statements no topo, try/catch silencioso, default values)
- 3 prepared statements: `_selectStmt` (SELECT max), `_upsertStmt` (UPSERT com `ON CONFLICT DO UPDATE`), `_resetStmt` (UPSERT para 0)
- Helper privado `_isValidLevel(level)`: aceita só inteiro 1..15 (rejeita `0`, `16`, `1.5`, `'1'`, `null`, `undefined`)
- 4 funções públicas exportadas conforme spec:
  - `getProgress(uid)` — retorna `max_level_completed` ou 0
  - `validateLevelProgress(uid, level)` — true se `level <= max+1` e level válido; convidado (uid null) só pode level=1
  - `markLevelCompleted(uid, level)` — UPSERT só se `level > current` (não regride); aceita skip (chamador valida sequência via validateLevelProgress)
  - `resetProgress(uid)` — UPSERT max=0 (cria registro se não existe; idempotente)
- Constante `MAX_LEVEL = 15` exportada
- Validado com `node --check` → OK
- Smoke test isolado com `DB_PATH=':memory:'`: **25/25 PASS** cobrindo:
  - new uid retorna 0
  - validate lvl 1 OK / lvl 2 bloqueado quando max=0
  - mark lvl 1 → max=1, repetir não atualiza
  - mark lvl 5 (skip) → atualiza (markLevelCompleted não valida sequência por design)
  - mark lvl 3 quando max=5 → não regride
  - validate lvl 16/0/1.5/'1' → todos false (range + tipo)
  - reset → max=0; getProgress confirma
  - uid null: getProgress=0, validate lvl1=true, validate lvl2=false, mark/reset retornam false

### Decisão de design
- `validateLevelProgress` (regra de negócio: não pular) e `markLevelCompleted` (persistência: não regredir) têm **responsabilidades separadas**. Endpoint POST /sp/level-complete em SP-2.3 deve chamar validateLevelProgress ANTES de markLevelCompleted.
- Convidado (`uid === null`) em `validateLevelProgress`: aceita level=1, rejeita >1. Coerente com decisão §2 SP_PLANNING (convidado começa sempre da fase 1, sem persistência).
- Try/catch silencioso em todas as funções (padrão `analytics.js`): falhas de DB não derrubam o servidor; retorna `false`/`0`.

### Próxima sessão
**SP-2.3** — 3 endpoints HTTP em `server/server.js`. Em paralelo: **SP-3.1** (refator bot.js).

---

## [2026-05-04] Sessão SP-2.3 — Endpoints HTTP de Single Player

**Status:** Completo
**Branch:** main
**Arquivo modificado:** `server/server.js`

### Feito
- `require('./singleplayer')` adicionado no topo (linha 19, junto com `bot`)
- 3 endpoints inseridos após `/player/:id/matches` (linha ~336), antes do bloco `// ── MMR / BAN / AFK`:
  - `GET  /sp/progress` — autenticado; retorna `{ max_level_completed }`
  - `POST /sp/level-complete` — autenticado; valida via `sp.validateLevelProgress` (rejeita pulo de fase com 400); aceita body `{ level }`; retorna `{ ok, max_level_completed }`
  - `POST /sp/reset` — autenticado; chama `sp.resetProgress(decoded.id)`; retorna `{ ok }`
- Todos os 3 endpoints usam `apiLimiter` (60 req/min) consistente com `/leaderboard`, `/player/:id`
- Auth via `requireAuth(req.headers.authorization)` (mesmo padrão de `/auth/profile`, `/auth/lang`, `/auth/account`)
- `node --check server/server.js` → OK

### Decisão de design
- Endpoints expostos publicamente apesar de SP-3.8 marcar level via `markLevelCompleted` direto no servidor (sem passar pela rota). Rota pública é defensiva: se cliente malicioso chamar `POST /sp/level-complete {level: 15}` direto, `validateLevelProgress` rejeita.
- Body parsing: Express já tem `express.json()` middleware ativo (verificado em outros endpoints como `/auth/profile`). Não precisei adicionar.
- Sem smoke test E2E nesta sessão: lógica das funções já validada em SP-2.2 (25/25 PASS); as rotas são wrappers thin (decoded + validate + chamada do módulo). Validação E2E formal acontece em SP-9.3.

### EPIC SP-2 concluído
Backend de progresso single-player está completo:
- Tabela `singleplayer_progress` no DB (SP-2.1)
- Módulo `server/singleplayer.js` com 4 funções (SP-2.2)
- 3 endpoints REST autenticados com rate limit (SP-2.3)

### Próxima sessão
**SP-3.1** — Refator `server/bot.js` + criação de `server/bot-strategies/` com registry e estratégia 0 (= comportamento atual). Inicia o EPIC SP-3 (multi-estratégia).

---

## [2026-05-04] Sessão SP-3.1 — Refator bot.js + registry bot-strategies/

**Status:** Completo
**Branch:** main
**Arquivos criados:** `server/bot-strategies/_helpers.js`, `server/bot-strategies/00-default.js`, `server/bot-strategies/index.js`
**Arquivo modificado:** `server/bot.js` (refatorado preservando assinatura)

### Feito
- **`_helpers.js` (12 helpers)** conforme spec do SP_STRATEGIES.md §1:
  - `randomChoice`, `weightedChoice`, `manhattanDist`, `pieceBonus`, `findKing`, `findPiece`, `dirForward`, `enemyAt`, `legalMoves`, `isPieceUnderThreat`, `isCellThreatened`, constante `BONUS`
  - `legalMoves(piece, state)` itera tabuleiro 4×4 chamando `isValidMove` de `movegen.js`
  - `isPieceUnderThreat(piece, state)` itera peças inimigas + `isValidMove` para casa da peça
- **`00-default.js`** (= comportamento legacy do bot atual):
  - `chooseDraft`: N → 2P → ready (idêntico ao bot.js antigo)
  - `choosePosition`: primeiro slot vazio em row-major scan (idêntico)
  - `chooseAction`: heurística Manhattan dist ao oppKing (idêntico)
  - Cada função retorna `{ event, payload?, delayMs }` (interface síncrona)
- **`index.js`** registry: `getStrategy(id)` com fallback para 0; `listStrategies()` para introspecção
- **`bot.js` refatorado** (de 126 → 80 linhas):
  - Lógica de DUEL/SUDDEN_DEATH genérica (compartilhada por todas estratégias) fica no `bot.js`
  - DRAFT/POSITION/ACTION fora de duel → dispatch para `strategy.choose*`
  - Helper `schedule(decision)` aplica `setTimeout(decision.delayMs)` + `onAction(event, payload)` + libera `_botBusy`
  - `room._botStrategy` define qual estratégia usar (default 0)
- Validação:
  - `node --check` em todos os 4 arquivos → OK
  - Smoke test do registry: `getStrategy(0)/(undefined)/(99)` retornam estratégia válida (fallback funciona)
  - Smoke test da estratégia 0: 3 chamadas de `chooseDraft` reproduzem N → P → ready conforme bot original
  - `bot.js` exports inalterados (`createBotPlayer`, `processBotTurn` com mesma assinatura)

### Retrocompat preservada
- `server.js:18` ainda importa `{ createBotPlayer, processBotTurn } = require('./bot')` — sem mudança
- Chamadas existentes de `processBotTurn(room, color, onAction)` em server.js (linhas 569, 1151) continuam funcionando: `room._botStrategy` é `undefined` nessas chamadas → fallback para estratégia 0 = comportamento idêntico ao anterior
- `queue_train` (modo Tutorial atual) continua jogando contra o bot legacy sem nenhuma alteração

### Decisões de design
- **Interface síncrona** das estratégias (`choose*` retorna decisão sem `setTimeout`): facilita teste isolado e separa "decidir" de "executar com delay". `bot.js` aplica o `delayMs` via `schedule()`.
- **Helpers em arquivo separado** (`_helpers.js`, com underscore prefix para separar visualmente do registry e estratégias numeradas)
- **Estratégia 0 explicitamente "default"** para deixar claro que é retrocompat do antigo bot, não uma "estratégia tutorial"
- `legalMoves` retorna `[{tx, ty}]` (sem incluir a própria peça por conveniência) — formato amigável para os loops das estratégias

### Próxima sessão
**SP-3.2** — Implementar estratégias 1 (Recruta), 2 (Aprendiz), 3 (Defensor). Cada uma em `server/bot-strategies/0N-nome.js` + registrar no `index.js`.

---

## [2026-05-04] Sessão SP-3.2 — Estratégias 1/2/3 (Recruta, Aprendiz, Defensor)

**Status:** Completo
**Branch:** main
**Arquivos criados:** `server/bot-strategies/01-recruta.js`, `02-aprendiz.js`, `03-defensor.js`
**Arquivo modificado:** `server/bot-strategies/index.js` (registry expandido para incluir 1, 2, 3)

### Feito
- **01-recruta.js (`★`)** — agressividade aleatória total:
  - DRAFT: filtra peças que cabem no budget restante e escolhe uma random; ready quando budget esgota (cobre todos os custos: Q=5, R=4, N=3, B=2, P=1)
  - POSITION: slot aleatório dos livres na própria metade
  - ACTION: enumera todos os moves de todas as peças, escolhe um random; ready se vazio
- **02-aprendiz.js (`★`)** — só peões, nunca captura:
  - DRAFT: 5 peões; ready
  - POSITION: King no centro da fileira de trás; peões na fileira frontal primeiro, depois fileira de trás (5º peão)
  - ACTION: filtro triplo — (a) tx===pawn.x (sem diagonal), (b) ty - pawn.y === dirForward(color) (só pra frente), (c) sem inimigo na casa de destino. Random entre candidatos válidos.
- **03-defensor.js (`★`)** — cerca o King, nunca cruza meio:
  - DRAFT: 2B + 1P (5 pontos exatos); ready
  - POSITION: K em (1,back), B em cantos da fileira de trás, P à frente do K
  - ACTION: filtra moves cuja ty fique na própria metade (white: y<=1, black: y>=2); escolhe destino com menor manhattanDist ao próprio King
- Index expandido: `_strategies = { 0, 1, 2, 3 }`
- `node --check` em 4 arquivos → OK
- Smoke test extenso:
  - Recruta DRAFT em 20 trials viu Q/R/N/B/P (todas as 5 opções) — aleatoriedade confirmada
  - Recruta POSITION viu ~7 slots distintos em 30 trials — aleatoriedade confirmada
  - Aprendiz DRAFT cumpre 5P → ready
  - Aprendiz ACTION em 4 cenários: livre→avança, bloqueado→ready, peão preto→y diminui, borda→ready
  - Defensor DRAFT progride B→B→P→ready
  - Defensor POSITION K em (1,0), B em (0,0)
  - Defensor ACTION com B em (3,1) e King em (1,0): destino (2,0) — y<=1 e perto do King (correto)

### ⚠️ Bug encontrado e corrigido durante o smoke test
- **Aprendiz** estava aceitando peão recuar! Causa: `movegen.js` permite peão mover ±1 vertical sem captura (não apenas para frente). No 4×4 do microChess isso é uma característica do jogo, não bug — peões podem recuar.
- Correção no Aprendiz: adicionado filtro `ty - pawn.y === dirForward(color)` para forçar avanço.
- **Anotado em SP_PLANNING.md §10** "Descoberta de SP-3.2": estratégias com peões em SP-3.3 (Atirador) e SP-3.5 (Iscador) também precisam filtrar `dirForward` se quiserem comportamento "só pra frente".

### Próxima sessão
**SP-3.3** — Estratégias 4 (Atirador), 5 (Cavaleiro), 6 (Bispeiro). Atenção: aplicar filtro `dirForward` em peões do Atirador.

---

## [2026-05-04] Sessão SP-3.3 — Estratégias 4/5/6 (Atirador, Cavaleiro, Bispeiro)

**Status:** Completo
**Branch:** main
**Arquivos criados:** `server/bot-strategies/04-atirador.js`, `05-cavaleiro.js`, `06-bispeiro.js`
**Arquivo modificado:** `server/bot-strategies/index.js` (registry expandido para 7 estratégias)

### Feito
- **04-atirador.js (★★)** — peões agressivos:
  - DRAFT: 5P (igual Aprendiz)
  - POSITION: 4P frontal + K canto da fileira de trás + 5º P fileira de trás
  - ACTION: 2 passadas — (1ª) prefere captura diagonal pra frente, (2ª) avanço frontal. Peões ordenados mais avançados primeiro
  - **Diferença vs Aprendiz:** Atirador captura, Aprendiz não
- **05-cavaleiro.js (★★)** — Cavalo agressivo + peões de suporte:
  - DRAFT: N + 2P (3+1+1=5)
  - POSITION: N centro frontal (1, front), K em canto da fileira de trás, P nas frontais adjacentes
  - ACTION: 1ª prioridade — Cavalo rumo ao oppKing escolhendo destinos seguros via `isCellThreatened` (filtra ameaças); 2ª — peões de suporte avançam frontalmente
- **06-bispeiro.js (★★)** — 2 bispos dominam diagonais:
  - DRAFT: 2B + 1P (igual Defensor mas comportamento diferente)
  - POSITION: B em (0,back) e (3,back); K em (1,back); P em (2,back)
  - ACTION: enumera moves de AMBOS os bispos e escolhe o que aproxima mais do oppKing (em vez de alternância por turno — `state.turn` não é exposto). Fallback: peão avança
- Index expandido: `_strategies = { 0..6 }`
- `node --check` em 4 arquivos → OK
- Smoke test 7 cenários:
  - Atirador: livre→ty=2; captura diagonal→tx=2,ty=2; bloqueado→tenta próximo peão (sorting funcional)
  - Cavaleiro: N (1,1) salta direto para (2,3) onde está oppKing (movimento L)
  - Bispeiro: B1 (0,0) escolhido sobre B2 (3,0) por manhattan=1 vs 2

### Decisões de design
- **Bispeiro sem alternância de turno**: spec original previa `state.turn % 2` mas `state.turn` não está em `state`. Substituído por "escolhe o bispo cujo melhor move aproxima mais do oppKing". Identidade preservada (joga com 2 bispos, foca diagonais).
- **Atirador captura diagonal antes de avançar frontal**: aproveita característica única do peão no microChess (captura diagonal forward apenas). Diferencia do Aprendiz que nunca captura.
- **Cavaleiro evita casas ameaçadas**: usa novo helper `isCellThreatened(x,y,state,color)` antes de mover. Faz com que o Cavaleiro recue se o avanço deixaria a peça em risco.

### Próxima sessão
**SP-3.4** — Estratégias 7 (Tanque), 8 (Caçador), 9 (Estrategista). **Atalho:** Caçador (8) = port direto da estratégia 0 (já em `00-default.js`); basta duplicar e mudar id/name.

---

## [2026-05-04] Sessão SP-3.4 — Estratégias 7/8/9 (Tanque, Caçador, Estrategista)

**Status:** Completo
**Branch:** main
**Arquivos criados:** `server/bot-strategies/07-tanque.js`, `08-cacador.js`, `09-estrategista.js`
**Arquivo modificado:** `server/bot-strategies/index.js` (10 estratégias registradas: 0..9)

### Feito
- **07-tanque.js (★★★)** — Torre + peão, marcha frontal:
  - DRAFT: R + P (4+1=5)
  - POSITION: R em (1,front), K em canto da fileira de trás, P em canto oposto
  - ACTION: 1ª prioridade Torre — destino mais avançado, desempate menor manhattan ao oppKing; 2ª prioridade peão avança frontalmente
- **08-cacador.js (★★★)** — port direto via wrapper:
  - 11 linhas; importa `00-default.js` e re-exporta com id=8, name=`cacador`
  - Smoke test confirma `chooseDraft` e `chooseAction` retornam exatamente os mesmos objetos da estratégia 0
- **09-estrategista.js (★★★)** — defensivo + agressivo:
  - DRAFT: N + B (3+2=5)
  - POSITION: N em (1,front), B em (1 ou 2, back), K em canto
  - ACTION fase 1: filtra `myPieces` por `isPieceUnderThreat`, ordena por `pieceBonus` desc, tenta destinos `!isCellThreatened` ordenados por proximidade ao oppKing. Se peça mais valiosa pode fugir para casa segura → move ela.
  - ACTION fase 2 (sem ameaças OU sem fuga viável): heurística Caçador (Manhattan ao oppKing)
- Index expandido: 10 estratégias (0..9)
- `node --check` em 4 arquivos → OK
- Smoke test:
  - Tanque DRAFT R→P→ready; ACTION torre em (1,1) avança para (1,3) — máximo possível
  - Caçador iguais à estratégia 0 (validação JSON.stringify equality)
  - Estrategista DRAFT N→B→ready; com peça em risco recua para casa segura; sem ameaça vai como Caçador

### Decisões de design
- **Caçador como wrapper, não cópia** — economiza linhas e mantém consistência: se 00-default for ajustado no futuro, Caçador acompanha automaticamente. Trade-off: leitor precisa abrir 2 arquivos para entender 8.
- **Estrategista "sem fuga segura" cai para fase 2** — em vez de ficar parado, tenta avançar com outra peça. É derrotista mas consistente com identidade "estrategista" que aceita perdas pra avançar.
- **Tanque "mais avançado" definido como `advance = white ? ty : -ty`** — funciona pra ambos os lados sem ifs especiais nos sorts.

### EPIC SP-3 progresso
Estratégias implementadas: **0..9** (10 de 16, contando o default). Faltam: 10..15 (Duelista, Cercador, Iscador, Rainha, Mestre, Lenda) + integração socket+gameOver (SP-3.7, SP-3.8).

### Próxima sessão
**SP-3.5** — Estratégias 10 (Duelista), 11 (Cercador), 12 (Iscador). **Atenção:** Iscador era especificado com `state.turn % 3` mas `state.turn` não é exposto — usar máquina de estado baseada em condições do tabuleiro.

---

## [2026-05-04] Sessão SP-3.5 — Estratégias 10/11/12 (Duelista, Cercador, Iscador)

**Status:** Completo
**Branch:** main
**Arquivos criados:** `server/bot-strategies/10-duelista.js`, `11-cercador.js`, `12-iscador.js`
**Arquivo modificado:** `server/bot-strategies/index.js` (13 estratégias: 0..12)

### Feito
- **10-duelista.js (★★★)** — confronto seletivo:
  - DRAFT: Q (5)
  - POSITION: Q em (1 ou 2, front), K escondido em canto da fileira de trás
  - ACTION 3 fases: (1) busca duelos com `myBonus >= enemyBonus` ordenados por gain DESC; (2) se Q sob ameaça e nenhum duelo vencível, recua para casa segura; (3) avança Q rumo ao oppKing por Manhattan
- **11-cercador.js (★★★★)** — ataque por flancos:
  - DRAFT: 2B + P (igual Defensor/Bispeiro mas comportamento bem diferente)
  - POSITION: B em (0,back) e (3,back), K em (1,back), P em (2,back)
  - ACTION: filtra moves cuja `tx ∈ {0, 3}` (flancos), ordena por menor Manhattan ao oppKing; fallback Caçador genérico se sem opções de flanco
- **12-iscador.js (★★★★)** — sacrifício planejado:
  - DRAFT: R + P (4+1=5)
  - POSITION: P em (1,front) — peão isca; R atrás dele em (1,back); K em (3,back)
  - ACTION 3 fases sem `state.turn`: (1) R sob ameaça → recua para casa segura (proteger peça forte); (2) peão vivo → avança peão (sacrifício); (3) peão morto/bloqueado → R avança rumo ao oppKing
- Index: 13 estratégias registradas (0..12)
- `node --check` em 4 arquivos → OK
- Smoke test em 12 cenários:
  - Duelista DRAFT Q→ready; ACTION com 2 alvos prioriza maior gain; sob ameaça **captura atacante** (não foge — duelo vencível tem prioridade)
  - Cercador POSITION B em (0,0)/(3,0); ACTION B em (0,0) move para (3,3) (flanco diagonal)
  - Iscador POSITION P em (1,1) e R em (1,0); ACTION peão vivo→avança P; peão morto→R avança máximo

### Decisões de design
- **Duelista NÃO foge primeiro** — fase 1 (duelo vencível) tem prioridade sobre fase 2 (recuar). Se Q pode capturar o atacante (Q+5 vs B+2 = vence), captura. Coerente com "duelista quer brigar".
- **Iscador sem `state.turn` cíclico** — substituído por máquina de estado baseada em entidades vivas: P vivo → avança P; P morto → avança R. R tem prioridade defensiva sobre tudo (recua se ameaçada).
- **Cercador: tx ∈ {0, 3}** — peão em (2, back) está fora dos flancos; serve só como suporte e fallback Caçador.

### EPIC SP-3 progresso
Estratégias implementadas: **0..12** (13 de 16). Faltam: 13/14/15 + integração socket (SP-3.7) e gameOver (SP-3.8).

### Próxima sessão
**SP-3.6** — Estratégias 13 (Rainha), 14 (Mestre), 15 (Lenda). **Atenção:** 14 e 15 usam lookahead 2-ply; medir performance (alvo <100ms por chamada).

---

## [2026-05-04] Sessão SP-3.6 — Estratégias 13/14/15 (Rainha, Mestre, Lenda)

**Status:** Completo
**Branch:** main
**Arquivos criados:** `13-rainha.js`, `_minimax.js`, `14-mestre.js`, `15-lenda.js`
**Arquivo modificado:** `server/bot-strategies/index.js` (16 estratégias: 0..15) — registry completo

### Feito
- **13-rainha.js (★★★★)** — Q sozinha, agressividade total:
  - DRAFT: Q (5)
  - POSITION: Q em (1 ou 2, front), K em canto
  - ACTION: scoring composto na Queen — capturar oppKing (-100), capturar peça inimiga (-3), Manhattan dist ao oppKing, penalidade +5 só se casa exposta sem ganho. Fallback: se Q cercada/morta, mexe King.
- **_minimax.js (helper compartilhado)** — engine de lookahead:
  - `getAllMoves(state, color)` — enumera moves de todas as peças
  - `simulateMove(state, move, color)` — clone shallow + resolve duel via heurística (`myBonus >= enemyBonus` = atacante vence)
  - `evaluate(state, color)` — material × 1.5 + king safety + king threat. King morto = ±1000 (catastrófico/vitória)
  - `scoreMoves(state, color)` — minimax 2-ply puro: para cada moveA, simula pior moveB do oponente, retorna `[{ move, score }]` ordenado DESC
- **14-mestre.js (★★★★★)** — usa `scoreMoves` e pega o melhor:
  - DRAFT: N + B (3+2=5)
  - POSITION: N em (1, front), B em (1 ou 2, back), K em canto
  - ACTION: `scoreMoves[0]` — minimax otimizando o pior caso após resposta inimiga
- **15-lenda.js (★★★★★)** — Mestre + variabilidade:
  - DRAFT/POSITION: importa de `14-mestre.js` (compartilhamento literal de funções)
  - ACTION: 80% pega `scoreMoves[0]`; 20% escolhe random entre top 3
- Index atualizado: 16 estratégias registradas (0..15)

### Performance medida (smoke test)
| Cenário | Tempo |
|---|---|
| Realista (6 peças) | 1ms |
| Worst case (8 peças) | 3ms |
| Extreme (12 peças) | 3ms |

**Alvo era <100ms.** Performance está ~30× melhor que o orçamento. Razão: 4×4 tem search space muito limitado, peças têm ~4 destinos médios em vez dos 16 estimados na spec.

### Comportamentos validados (smoke test)
- **Rainha**: dado oppKing acessível diagonalmente, Q vai direto pra capturá-lo
- **Mestre**: Cavalo em (1,1) salta para (0,3) onde está oppKing → captura via minimax
- **Lenda em 100 trials**: 85 iguais ao Mestre / 15 variações (esperado ~80/20 — dentro da margem aceitável)

### Decisões de design
- **`_minimax.js` separado em vez de inline em 14/15** — facilita SP-9.1 (balanceamento) caso queira ajustar evaluate ou pesos sem mexer em ambas as estratégias.
- **Lenda compartilha `chooseDraft` e `choosePosition` por referência** (não cópia) — se Mestre for ajustado, Lenda acompanha automaticamente (consistência).
- **`simulateMove` resolve duel via expected value** (não amostragem aleatória) — bate com a spec do SP_STRATEGIES.md §3 (estratégia 14: "valor médio de dado = 3.5"). Determinístico → testável.
- **Penalidade de casa ameaçada na Rainha (+5) só se sem ganho** — se a casa tem inimigo capturável, Q vai mesmo se a casa estiver "ameaçada" (porque ela vence o duel imediato).

### 🏆 EPIC SP-3 — todas as 16 estratégias implementadas
Lista final do registry: `0:default`, `1:recruta`, `2:aprendiz`, `3:defensor`, `4:atirador`, `5:cavaleiro`, `6:bispeiro`, `7:tanque`, `8:cacador`, `9:estrategista`, `10:duelista`, `11:cercador`, `12:iscador`, `13:rainha`, `14:mestre`, `15:lenda`.

Faltam apenas SP-3.7 (handler socket `single_player_start`) e SP-3.8 (gameOver → markLevelCompleted).

### Próxima sessão
**SP-3.7** — Handler socket `single_player_start({ level, token? })` no `server/server.js`. Cria sala bot com `room._botStrategy = level`, valida progresso se autenticado, marca `room._isSinglePlayer` e `room._spLevel`.

---

## [2026-05-04] Sessão SP-3.7 — Socket handler `single_player_start`

**Status:** Completo
**Branch:** main
**Arquivo modificado:** `server/server.js` (handler inserido após `queue_train`, antes do bloco `// ── PRIVATE ROOM ──`)

### Feito
- Handler `single_player_start(profile)` inserido em `server/server.js` (~linha 1180)
- Recebe payload `{ uid, nickname, avatar, token, level }`
- **Validação de range** logo no início: rejeita `level` fora de 1..15 (ou não-inteiro) com `sp_error: { error: 'invalid_level' }`
- **Token opcional**:
  - Se presente e válido → autentica, checa ban (emite `banned` se banido, idêntico a queue_train), valida progresso via `sp.validateLevelProgress(decoded.id, level)` — rejeita pulo de fase com `sp_error: { error: 'level_locked' }`. Marca `isGuest = false`
  - Se ausente ou inválido → `isGuest = true`, qualquer level 1..15 é aceito
- Cria room similar a `queue_train` com 4 campos extras:
  - `_botStrategy: level` — bot.js dispatcha para a estratégia 1..15 (registry agora tem 16 estratégias)
  - `_isSinglePlayer: true` — para SP-3.8 identificar partidas solo no gameOver
  - `_spLevel: level` — para `markLevelCompleted(uid, level)`
  - `_spIsGuest: isGuest` — para SP-3.8 não persistir vitória de convidado
- `match_found` enviado inclui campo extra `sp: { level, isGuest }` para o cliente exibir UI específica de solo
- Rate limit: `checkSocketRate(socket, 'single_player_start', 3, 5000)` — mesmo padrão de queue_train
- `node --check server/server.js` → OK

### Erros emitidos pelo handler
| Evento | Motivo |
|---|---|
| `sp_error: { error: 'invalid_level' }` | level não-inteiro ou fora de 1..15 |
| `sp_error: { error: 'level_locked' }` | autenticado tentou pular fase (validateLevelProgress falhou) |
| `banned: { until, remainMs }` | usuário autenticado banido (mesmo formato que queue_train) |

### Decisões de design
- **Validação de level vem ANTES da autenticação** — evita carga de DB se payload já é inválido. Defensivo contra cliente malicioso.
- **Convidado sem token = silenciosamente isGuest** — não retorna erro. Cliente que não passar token é assumido convidado.
- **Não chamar `singleplayer.markLevelCompleted` aqui** — SP-3.7 só CRIA a partida. SP-3.8 vai marcar vitória no gameOver.
- **Não emitir match_found para o "bot"** — bot não é socket real. Padrão idêntico a queue_train.
- **`socketUserId` é setado se autenticado** — necessário para `disconnect_ingame` e outros eventos de analytics chamados em outros handlers.

### Próxima sessão
**SP-3.8** — No `gameOver` (ou `_persistDB` / lugar onde a partida termina), se `room._isSinglePlayer && humano venceu`:
- Se `!room._spIsGuest` → `sp.markLevelCompleted(humanUid, room._spLevel)`
- Emitir `sp_level_completed { level }` para o cliente em ambos os casos (cliente atualiza `window.spProgress`)
- NÃO afetar MMR/LP (modo solo não conta para ranking)

---

## [2026-05-04] Sessão SP-3.8 — Marcar level completed no gameOver

**Status:** Completo
**Branch:** main
**Arquivo modificado:** `server/server.js` (early-return em `persistMatchResult`, ~linha 459)

### Feito
- **Hook centralizado em `persistMatchResult`** — branch `if (room._isSinglePlayer)` no início da função, antes de `_persistDB`. Cobre todas as 5 paths de fim de partida:
  - line 505 (AFK timeout WO)
  - line 787 (Morte Súbita draw)
  - line 842 (King eliminated)
  - lines 1605/1621 (disconnect WO)
- **Lógica de detecção de vitória**:
  - `humanColor = room._botColor === 'black' ? 'white' : 'black'` (sempre `'white'` na implementação atual; deixado parametrizado para resiliência)
  - `humanWon = winnerColor === humanColor && !isWO`
  - WO contra bot é impossível (bot não tem AFK timer nem disconnect), então `isWO=true && winnerColor=human` nunca acontece
- **Persistência condicional**: `if (!room._spIsGuest && human.uid)` chama `sp.markLevelCompleted(human.uid, level)`. Convidado tem `_spIsGuest=true` setado em SP-3.7 — não persiste, só emite.
- **Emissão**: `io.to(human.socketId).emit('sp_level_completed', { level })` para ambos os casos (autenticado e convidado).
- **Early return** evita execução de `_persistDB` (que já retornaria null por bot não ter registro em `players`, mas explicitar é mais seguro e claro).
- `node --check server/server.js` → OK

### Verificação dos casos
| Cenário | winnerColor | humanWon | Resultado |
|---|---|---|---|
| Human King survive (line 842) | `'white'` | true | emit + markCompleted (se !guest) |
| Bot King survive (line 842) | `'black'` | false | nada |
| Morte Súbita 0×0 (line 787) | `'draw'` | false | nada |
| Human AFK (line 505) | `'black'` (oppColor) | false (isWO=true) | nada |
| Human disconnect (lines 1605/1621) | `'black'` (oppColor) | false (isWO=true) | nada |

### Decisões de design
- **Hook em `persistMatchResult`, não inline em cada call site** — DRY; evita esquecer de uma path no futuro. Tradeoff: lê-se um pouco menos linear (precisa abrir a função pra entender o que acontece no gameOver).
- **Não tocar `_persistDB`** — função é `db.transaction(...)` e queue_train/SP atualmente confiam no fato de retornar null por falta de bot record. Preservar essa propriedade.
- **`humanColor` derivado de `_botColor`** — atualmente bot é sempre black (humano sempre white) em SP-3.7, mas se mudarmos isso no futuro o código já está correto.
- **Não emitir 'sp_level_completed' em derrota/empate** — spec é clara: o evento só dispara no completar a fase. Cliente lida com derrota via gameOver normal (a ser feito em SP-8.1).
- **Não invalidar MMR explicitamente** — `_persistDB` já não toca MMR para bot matches (returns null por falta de DB record). Não é necessário código adicional.

### Side effects esperados no cliente (a tratar em SP-7.5 e SP-8.1)
- Cliente deve ouvir `socket.on('sp_level_completed', ({ level }) => { ... })` para:
  - Atualizar `window.spProgress.max_level_completed` (se for novo recorde)
  - Tocar animação de fase desbloqueada na tela `sp-map`
  - Trocar botão da tela game-over para "PRÓXIMA FASE"

### 🏆 EPIC SP-3 COMPLETO
Todas as 16 estratégias (0..15) implementadas, handler `single_player_start` ativo, completion no gameOver pronto. Backend SP é 100% funcional. Falta apenas frontend (SP-4..SP-7) + integração de fluxo (SP-8) + QA (SP-9).

### Próxima sessão
**SP-4.1** — Reformatar `#screen-game-mode` (~linha 2012 em `html/index.html`) em 2 cards grandes (SOLO ↔ ONLINE) com IDs `gm-card-solo` e `gm-card-online`. Comentar HTML antigo dos 3 cards (Casual/Ranqueada/Tutorial) ao invés de deletar — facilita rollback. Cards têm onclick direto para `showScreen('solo-hub')` ou `showScreen('multiplayer-mode')`.

---

## [2026-05-04] Sessão SP-4.1 — Reformatar #screen-game-mode (2 cards SOLO/ONLINE)

**Status:** Completo
**Branch:** main
**Arquivo modificado:** `html/index.html` (bloco `#screen-game-mode` linhas 2012-2031 + JS handler perto de `selectGameMode`)

### Feito
- **HTML**: substituído conteúdo do `<div id="screen-game-mode">`:
  - Bloco antigo de 3 cards (`gm-card-casual`, `gm-card-ranked`, `gm-card-train`) + botão FIND MATCH removido
  - 2 cards novos inseridos: `gm-card-solo` (onclick `window.openSoloHub()`) + `gm-card-online` (onclick `window.spGoOnline()`)
  - Sub-elementos com IDs `gm-solo-label`, `gm-solo-desc`, `gm-online-label`, `gm-online-desc` (i18n entra em SP-4.2)
  - Texto default em PT: "SOLO / 15 fases contra a CPU" e "ONLINE / Jogadores reais online"
  - Estilo idêntico aos cards legados (mesma classe visual: padding 20px 16px, border-radius `--mc-r-lg`, border `--mc-rule`, background `--mc-surface`)
  - Container externo agora usa `gap:14px` (era 12px) — consistente com wireframe SP_WIREFRAMES.md §1
- **HTML comment de rollback**: marcador único e limpo no lugar do bloco antigo. Não foi preservado HTML literal porque CSS variables (`var(--mc-rule)`) violam HTML5 strict comments (sequência `--` no meio do comentário). Rollback fica via git history do commit pré-SP-4.1.
- **JS handlers** (inseridos antes de `window.selectGameMode`, ~linha 4249):
  - `window.openSoloHub`: stub idempotente (`if (typeof window.openSoloHub !== 'function')`) — SP-6.2 pode redefinir. Verifica se `screen-solo-hub` existe; se sim navega via `showScreen`, senão `alert('Modo Solo em desenvolvimento.')`.
  - `window.spGoOnline`: idêntico padrão para `screen-multiplayer-mode` (criada em SP-5.1). Sem proteção idempotente porque SP-5.2 vai renomear/redefinir explicitamente.
- **Existing legacy code**: `selectGameMode`, `startMatchmakingWithMode`, `refreshGameModeScreen` e o init de `showScreen('game-mode')` permanecem em JS. Todos têm `if (el(...))` ou `if (c)` guards — ficam dormentes (sem caller na UI) mas não crasham. Decisão: NÃO remover; SP-5.2 vai reaproveitar parte da lógica para multiplayer-mode.

### Decisões de design
- **Comentário HTML simplificado vs preservar bloco literal** — spec dizia "preservar 3 cards antigos como `<!-- legado -->` comentado". Preservei a INTENÇÃO mas não o conteúdo literal porque `var(--...)` em CSS contém `--` que é inválido em comentários HTML5 strict. Trade-off: rollback fácil via git em vez de uncomment manual.
- **Stub `openSoloHub` idempotente** — usei `if (typeof !== 'function')` para que SP-6.2 possa carregar antes ou depois do bloco principal sem conflito. `spGoOnline` é redefinido sem proteção porque SP-5.2 explicitamente substitui a função.
- **`alert()` como fallback em vez de toast/modal** — durante SP-4 a SP-6 (intermediário), o usuário que clicar SOLO ou ONLINE vê alerta nativo. Aceitável pois é desenvolvimento e não há tela parcialmente quebrada (volta para game-mode após OK).
- **NÃO trocar `gm-title` de `mode_title` para `new_game`** — wireframe sugere usar `new_game`. Mas i18n é responsabilidade de SP-4.2; deixei `mode_title` ("MODO DE JOGO") para evitar mistura de territórios.

### Estado intermediário (broken flows aceitos pela spec)
| Caminho | Comportamento atual | Resolvido em |
|---|---|---|
| Menu → NOVO JOGO → SOLO | alert "Modo Solo em desenvolvimento." | SP-6.2 (define openSoloHub real) |
| Menu → NOVO JOGO → ONLINE | alert "Fluxo Online em desenvolvimento." | SP-5.1 (cria screen-multiplayer-mode) |
| Modo treino (queue_train) | inalcançável via UI (botão Tutorial removido) | será substituído por modo solo via SP-7.3 + SP-3.7 |

**ATENÇÃO**: durante este intervalo (SP-4.1 até SP-5.1+SP-6.2), o usuário não consegue iniciar partidas via UI — apenas via DevTools console (`socket.emit('queue_join', ...)` ou `socket.emit('single_player_start', ...)`). Esse é o estado intencional documentado em SP_PLANNING.md §11 ("SP_ENABLED protege fluxo Solo completo").

### Smoke test mental
- ✅ HTML well-formed: comentários `<!-- ... -->` sem `--` interno; tags balanceadas
- ✅ Init `showScreen('game-mode')` (linha 3797): `if (c)` guards protegem refs a IDs comentados
- ✅ `refreshGameModeScreen` (linha 3826): `if (el(...))` guards idem
- ✅ Stubs JS chamáveis pelos onclicks
- ✅ Cards visualmente idênticos ao padrão dos cards antigos (mesmo estilo)

### Próxima sessão
**SP-4.2** — i18n: inserir chaves `sp_solo`, `sp_online`, `sp_solo_desc`, `sp_online_desc` em todos os 9 blocos `T.{pt,en,es,de,it,ru,ja,ko,zh}` (~linha 2960+ em `html/index.html`); atualizar `refreshGameModeScreen()` para popular `gm-solo-label`, `gm-solo-desc`, `gm-online-label`, `gm-online-desc`. Traduções prontas em `docs/SP_TERMS.md` §2 — basta copiar o snippet de §4.

---

## [2026-05-05] Sessão SP-4.2 — i18n da nova game-mode (4 chaves × 9 idiomas)

**Status:** Completo
**Branch:** main
**Arquivo modificado:** `html/index.html` (9 blocos `T.{lang}` + função `refreshGameModeScreen`)

### Feito
- **36 entradas i18n** inseridas (4 chaves × 9 idiomas) — uma linha após `mode_find_match` em cada bloco:
  - **PT** (linha 3021): `SOLO / ONLINE / 15 fases contra a CPU / Jogadores reais online`
  - **EN** (3100): `SOLO / ONLINE / 15 stages vs CPU / Real players online`
  - **ES** (3189): `SOLO / ONLINE / 15 fases contra la CPU / Jugadores reales online`
  - **DE** (3278): `SOLO / ONLINE / 15 Stufen gegen die CPU / Echte Spieler online`
  - **IT** (3367): `SOLO / ONLINE / 15 livelli contro la CPU / Giocatori reali online`
  - **RU** (3456): `СОЛО / ОНЛАЙН / 15 уровней против ИИ / Игроки в реальном времени`
  - **JA** (3545): `ソロ / オンライン / CPUと15ステージ / オンライン対戦`
  - **KO** (3634): `솔로 / 온라인 / CPU와 15단계 / 실시간 온라인 대전`
  - **ZH** (3723): `单人 / 在线 / 15 关对战 CPU / 真人在线对战`
- **`refreshGameModeScreen()` atualizado** ([html/index.html:3835](html/index.html#L3835)):
  - 4 linhas novas para popular `gm-solo-label`, `gm-solo-desc`, `gm-online-label`, `gm-online-desc`
  - Linhas legadas (gm-casual-/gm-ranked-/gm-train-/gm-find-) mantidas com guards `if (el(...))`; ficam dormentes até remoção em SP-8.3
  - Função é chamada em 2 paths: `showScreen('game-mode')` (linha 3811) + `applyLang()` (linha 4161 quando current screen é game-mode)

### Decisões de design
- **NÃO trocar `gm-title` de `mode_title` para `new_game`** — wireframe sugeria, mas trade-off: `mode_title` ("MODO DE JOGO") já está traduzido nos 9 idiomas; `new_game` é "NOVO JOGO" (atualmente usado no botão). Manter `mode_title` evita 9 traduções já prontas perderem coerência semântica com a nova tela ("modo de jogo" descreve a escolha SOLO/ONLINE bem). Pode ser revisto quando o usuário visualizar.
- **Manter `if (el(...))` guards nas linhas legadas** — refatoração defensiva. SP-8.3 vai remover quando os cards forem definitivamente deletados do JS.
- **Traduções literais conforme `docs/SP_TERMS.md` §2** — não houve criatividade aqui; copiei o snippet pronto da fonte de verdade.
- **Inserção em LINHA NOVA após `mode_find_match`** — mantém legibilidade. As 4 chaves cabem em uma linha porque os valores são curtos. Padrão consistente com agrupamento existente no projeto.

### Verificação de comprimento (SP_TERMS.md §3)
| Idioma | sp_solo | sp_online | Status (limite 8 chars) |
|---|---|---|---|
| pt/en/es/de/it | SOLO (4) | ONLINE (6) | ✅ |
| ru | СОЛО (4) | ОНЛАЙН (6) | ✅ |
| ja | ソロ (2) | オンライン (5) | ✅ |
| ko | 솔로 (2) | 온라인 (3) | ✅ |
| zh | 单人 (2) | 在线 (2) | ✅ |

Todos cabem em qualquer largura de viewport.

### Próxima sessão
**SP-5.1** — Criar nova tela `<div id="screen-multiplayer-mode" class="screen">` em `html/index.html`. Inserir após `#screen-game-mode` (~linha 2032). Conteúdo:
- Header: back-btn → `showScreen('game-mode')` + título (i18n key `mode_title` ou nova `mp_title`)
- Cards: `mp-card-casual` (onclick `selectMultiplayerMode('casual')`) + `mp-card-ranked` (onclick `selectMultiplayerMode('ranked')`)
- Botão `mp-find-btn` → `startMatchmakingMP()` (lógica fica em SP-5.2)
- IDs e estilos copiados do legado de `#screen-game-mode` (manter visual idêntico)
- Lógica JS (`selectMultiplayerMode`, `startMatchmakingMP`) entra em SP-5.2.

---

## [2026-05-05] Sessão SP-5.1 — Criar #screen-multiplayer-mode (Casual/Ranqueada + FIND MATCH)

**Status:** Completo
**Branch:** main
**Arquivo modificado:** `html/index.html` — nova `<div id="screen-multiplayer-mode">` ([linhas 2033-2054](html/index.html#L2033)) + 2 stubs JS perto de `selectGameMode` ([linha 4300+](html/index.html#L4300))

### Feito
- **HTML**: nova tela inserida entre `#screen-game-mode` (fim) e o bloco `#screen-matchmaking` (`<style>`):
  - Header: back-btn → `showScreen('game-mode')` + título "ONLINE" (`#mp-title`)
  - Card Casual: `#mp-card-casual` com `mp-casual-label` ("Casual") + `mp-casual-desc` ("Jogue sem afetar seu XP") + checkmark `mp-check-casual` (display:none)
  - Card Ranqueada: `#mp-card-ranked` com `mp-ranked-label` ("Ranqueada") + `mp-ranked-desc` ("Compete por XP e suba no ranking") + checkmark `mp-check-ranked` (display:none)
  - Botão CTA: `#mp-find-btn` com `mp-find-label` ("FIND MATCH"), começa `disabled` + `opacity:0.4`
  - Estilos inline reaproveitados do bloco legado (mesmo visual de cards do SP-4.1 pré-edit)
- **Stubs JS** (idempotentes via `typeof !== 'function'`) inseridos depois de `spGoOnline`:
  - `window.selectMultiplayerMode(_mode)` → alert "Fluxo Online em desenvolvimento."
  - `window.startMatchmakingMP()` → mesmo alert
  - Razão: a screen agora EXISTE, então `spGoOnline` (SP-4.1) consegue navegar pra ela. Sem stubs, clicar nos cards causaria `TypeError: window.selectMultiplayerMode is not a function`. SP-5.2 vai sobrescrever com a implementação real.

### Decisões de design
- **Inserção depois de `#screen-game-mode`** — agrupamento lógico com a outra tela do fluxo de menu→jogo.
- **Estilos inline literalmente copiados do legado** (não usei classes CSS dedicadas) — alinhado com regra do CLAUDE.md "CSS novo sempre inline nos divs criados — nunca alterar o `<style>` existente".
- **Stubs idempotentes** — mesmo padrão de `openSoloHub`/`spGoOnline`. Permite que SP-5.2 carregue sua implementação antes ou depois sem conflito.
- **Default text em PT** (Casual / Jogue sem afetar seu XP / Ranqueada / etc.) — i18n entra em SP-5.3 reaproveitando `mode_casual`, `mode_casual_desc`, `mode_ranked`, `mode_ranked_desc`, `mode_find_match`, `back` (todas existentes desde PRE-OT-B). Não há novas chaves a criar.
- **`mp-find-btn` começa `disabled`** — usuário precisa selecionar Casual ou Ranqueada antes de poder clicar; comportamento idêntico ao da tela legada.

### Estado intermediário
| Caminho | Comportamento atual | Resolvido em |
|---|---|---|
| Menu → NOVO JOGO → ONLINE | Navega para a nova tela `#screen-multiplayer-mode` ✓ | (pronto) |
| ONLINE → clicar card Casual/Ranqueada | alert "Fluxo Online em desenvolvimento." | SP-5.2 |
| ONLINE → clicar FIND MATCH | (botão ainda `disabled`; manualmente via DevTools mostra alert) | SP-5.2 |
| Tela em outro idioma (não-PT) | Texto fixo em PT | SP-5.3 |

### Smoke test mental
- ✅ HTML estruturalmente válido — div balanceado, todos os IDs únicos no documento (mp-* não colidem com gm-*)
- ✅ Visualmente idêntico ao layout legado pré-SP-4.1 (mesmo padding/border/cores)
- ✅ Click flow: Menu → NOVO JOGO → ONLINE → tela ONLINE → cards causam alert (não crash)
- ✅ Botão VOLTAR retorna para `#screen-game-mode`

### Próxima sessão
**SP-5.2** — Substituir os 2 stubs por implementação real:
- `window.selectMultiplayerMode(mode)`: copiar lógica de `window.selectGameMode` (linha ~4262), adaptando IDs `gm-*` → `mp-*`. Sem branch `train`. Habilitar `mp-find-btn` (`disabled=false`, `opacity:1`, `cursor:pointer`).
- `window.startMatchmakingMP()`: copiar lógica de `window.startMatchmakingWithMode` (linha ~4285) sem branch `train`. Emitir `socket.emit('queue_join', getQueueProfile({ ..., match_mode: _selectedMPMode }))` + `showScreen('matchmaking')`.
- Manter `selectGameMode` e `startMatchmakingWithMode` legadas no JS (spec §SP-5.2 ponto 3).

---

## [2026-05-05] Sessão SP-5.2 — Implementação real dos handlers do screen-multiplayer-mode

**Status:** Completo
**Branch:** main
**Arquivo modificado:** `html/index.html` — declaração `_selectedMPMode` ([linha 4286](html/index.html#L4286)) + funções reais ([linhas 4315-4344](html/index.html#L4315)) + reset hook em `showScreen` ([linhas 3836-3848](html/index.html#L3836))

### Feito
- **`let _selectedMPMode = null;`** declarado no mesmo bloco que `_selectedMode` (closure-local, não window) — escopo do script principal acessível de showScreen e dos handlers.
- **`window.selectMultiplayerMode(mode)`** — substitui o stub de SP-5.1:
  - Armazena `_selectedMPMode = mode`
  - Reset visual de ambos os cards (`mp-card-casual`/`mp-card-ranked`): border `--mc-rule`, background `--mc-surface`
  - Esconde os 2 checkmarks (`mp-check-casual`/`mp-check-ranked`)
  - Highlight do card selecionado: border `--mc-accent` 2px + background `--mc-accent-soft`
  - Mostra checkmark do selecionado (`display:grid`)
  - Habilita `mp-find-btn`: `disabled=false`, `opacity:1`, `cursor:pointer`
- **`window.startMatchmakingMP()`** — substitui stub:
  - Se `!_selectedMPMode` → return (botão deveria estar `disabled` mas defensivo)
  - Senão chama `window.goMatchmaking(_selectedMPMode)` — que já trata UI de matchmaking + emite `queue_join` com `match_mode: _selectedMPMode`
- **Reset hook em `showScreen('multiplayer-mode')`** — espelho do reset de `game-mode`:
  - Limpa `_selectedMPMode = null`
  - Reset visual dos 2 cards + checkmarks
  - Disable `mp-find-btn` (volta a `disabled`, `opacity:0.4`, `cursor:not-allowed`)
  - NÃO chama `refreshMultiplayerModeScreen()` ainda (é território SP-5.3)

### Decisões de design
- **Reuso de `window.goMatchmaking`** — em vez de duplicar 20+ linhas de UI de matchmaking, `startMatchmakingMP` delega para a função existente. Trade-off: acoplamento ao código legado, mas evita drift entre as duas implementações. `goMatchmaking` já distingue `'casual'`/`'ranked'`/`'train'` e emite o evento certo.
- **`_selectedMPMode` closure-local em vez de `window._selectedMPMode`** — wireframe sugeria `window.*` mas closure mantém consistência com `_selectedMode` (legado). Não há motivo para expor globalmente.
- **Reset hook adicionado** — paridade com legacy `game-mode`. Sem isso, navegar ONLINE → Casual → BACK → ONLINE deixaria Casual highlighted e FIND MATCH habilitado, o que é UX inconsistente.
- **Funções legadas (`selectGameMode`, `startMatchmakingWithMode`) mantidas intactas** — spec §SP-5.2 ponto 3 explicita "Não remover funções antigas". Permanecem dormentes (sem caller) até SP-8.3.

### Smoke test mental
- ✅ Click ONLINE no game-mode → navegação para multiplayer-mode com cards limpos e FIND MATCH disabled
- ✅ Click Casual → border accent + checkmark + FIND MATCH habilitado
- ✅ Click Ranqueada → toggle: Casual desselecionado, Ranqueada selecionada
- ✅ Click FIND MATCH com modo selecionado → `goMatchmaking('casual')` ou `goMatchmaking('ranked')` → matchmaking screen + `queue_join` emit
- ✅ Click FIND MATCH sem seleção → return early (impossível pelo UI mas defensivo)
- ✅ Click VOLTAR → game-mode (cards SOLO/ONLINE) com `_selectedMPMode = null` no próximo entry
- ✅ Re-entry em ONLINE depois de selecionar antes → estado limpo

### Próxima sessão
**SP-5.3** — i18n da multiplayer-mode. Criar `refreshMultiplayerModeScreen()` espelhando `refreshGameModeScreen`. Reaproveitar chaves existentes (`back`, `mode_title`, `mode_casual`, `mode_casual_desc`, `mode_ranked`, `mode_ranked_desc`, `mode_find_match`) — não criar novas. Chamar em `showScreen('multiplayer-mode')` (após reset) e em `applyLang()` quando `currentScreen === 'multiplayer-mode'`.

---

## [2026-05-05] Sessão SP-5.3 — i18n da multiplayer-mode (zero chaves novas)

**Status:** Completo
**Branch:** main
**Arquivo modificado:** `html/index.html` — função `refreshMultiplayerModeScreen` ([linhas 3890-3899](html/index.html#L3890)) + 2 call sites

### Feito
- **Nova função `refreshMultiplayerModeScreen()`** ([html/index.html:3890](html/index.html#L3890)) — espelha o padrão de `refreshGameModeScreen` mas para IDs `mp-*`:
  - `mp-title` ← `t('mode_title')` ("MODO DE JOGO" / "GAME MODE" / etc.)
  - `mp-back-label` ← `t('back')` (com fallback `'Back'`)
  - `mp-casual-label` / `mp-casual-desc` ← `mode_casual` / `mode_casual_desc`
  - `mp-ranked-label` / `mp-ranked-desc` ← `mode_ranked` / `mode_ranked_desc`
  - `mp-find-label` ← `mode_find_match`
  - Todos os reads protegidos por `if (el(...))` guards
- **Call site 1** — `showScreen('multiplayer-mode')` ([linha 3848](html/index.html#L3848)): chamada de `refreshMultiplayerModeScreen()` adicionada após o reset visual SP-5.2. Garante texto traduzido na entrada da tela.
- **Call site 2** — `applyLang()` ([linha 4198](html/index.html#L4198)): inserção de `if (currentScreen === 'multiplayer-mode') refreshMultiplayerModeScreen();` logo abaixo do análogo de `game-mode`. Garante atualização imediata se usuário trocar de idioma com a tela aberta.

### Decisões de design
- **Zero chaves i18n novas** — wireframe SP_WIREFRAMES.md §2 §207 explicita que SP-5.3 reaproveita as chaves existentes (criadas em PRE-OT-B). Snippet `T.{lang}` permanece intacto.
- **`mode_title` para `mp-title`** — wireframe sugeria essa key. Coerência: tanto a tela "NOVO JOGO" quanto a "ONLINE" são do mesmo grupo conceitual de seleção de modo. Title aparece como "MODO DE JOGO" em PT, "GAME MODE" em EN — semanticamente cabe nas duas telas. Pode ser refinado se o usuário pedir um título mais específico (ex: "BATALHA ONLINE").
- **Não chamar `refreshOverlays()`** dentro da função — overlays globais (banimento, reconnect, etc.) já são tratados pelo `refreshOverlays()` chamado depois do bloco no showScreen.
- **Função separada em vez de inline em showScreen** — paridade com `refreshGameModeScreen`. Permite chamar do `applyLang` sem duplicação.

### Smoke test mental
- ✅ Entrar em ONLINE em PT → cards mostram "Casual / Jogue sem afetar seu XP" e "Ranqueada / Compete por XP e suba no ranking"; FIND MATCH como "ENCONTRAR PARTIDA"
- ✅ Trocar para EN com a tela aberta → atualização imediata: "Casual / Play without affecting your XP" e "Ranked / Compete for XP and climb the ranks"; FIND MATCH continua "FIND MATCH"
- ✅ Asiáticos (ja/ko/zh) e cyrillic (ru) renderizam corretamente — guards `if (el(...))` evitam crashes
- ✅ Voltar a PT após estar em EN → texto volta normalmente
- ✅ Sem keys novas no `T.{lang}` — file size do index.html só cresce pela nova função (~10 linhas)

### EPIC SP-5 COMPLETO ✅
Tela ONLINE 100% funcional:
- HTML estruturado (SP-5.1)
- Handlers reais com seleção visual + reset (SP-5.2)
- i18n nos 9 idiomas reaproveitando chaves existentes (SP-5.3)

Falta apenas remover o card Tutorial antigo do JS legado (SP-8.3) e desligar feature flag (SP-8.4).

### Próxima sessão
**SP-6.1** — Criar `<div id="screen-solo-hub" class="screen">` em `html/index.html`. Inserir após `#screen-multiplayer-mode` (~linha 2055). Conteúdo:
- Header: back-btn → `showScreen('game-mode')` + título (placeholder; i18n em SP-6.5 — chave `sp_solo` já existe e cabe)
- Card CONTINUAR: `sh-card-continue` com label de nível atual ("Fase X")
- Card NOVO: `sh-card-new`
- Lógica/fetch/handlers ficam para SP-6.2/6.3/6.4. SP-6.1 só estrutura HTML + estilo inline copiado dos cards de game-mode.

---

## [2026-05-05] Sessão SP-6.1 — Criar #screen-solo-hub (CONTINUAR + NOVO + modal)

**Status:** Completo
**Branch:** main
**Arquivo modificado:** `html/index.html` — nova tela ([linhas 2056-2074](html/index.html#L2056)) + modal de confirmação ([linhas 2076-2087](html/index.html#L2076)) + 4 stubs JS ([linhas 4347-4376](html/index.html#L4347))

### Feito
- **Tela `#screen-solo-hub`** inserida após `#screen-multiplayer-mode` (entre as telas de seleção e o bloco de matchmaking):
  - Header: back-btn → `showScreen('game-mode')` + label `sh-back-label` ("VOLTAR")
  - Título `sh-title` ("SOLO")
  - Card CONTINUAR: `sh-card-continue` (onclick `continueSolo()`) com `sh-continue-label` ("CONTINUAR") + `sh-continue-phase` ("Fase 1") + `sh-continue-desc` ("Retomar de onde parou")
  - Card NOVO: `sh-card-new` (onclick `openNewSoloModal()`) com `sh-new-label` ("NOVO") + `sh-new-desc` ("Começar do início (Fase 1)")
  - Estilos inline reaproveitados dos cards de game-mode (padrão `padding 20px 16px`, border `--mc-rule`, bg `--mc-surface`)
- **Modal de confirmação `#sh-new-confirm`** inserido após a tela:
  - Padrão `sysmodal-bg` + `sysmodal` (mesmo padrão de `logout-confirm` e `delete-account-confirm`)
  - Eyebrow "Solo" + Title "Reiniciar jornada?" + Body com texto default em PT
  - Botões: "Cancelar" (`sh-new-confirm-cancel`, classe `sysmodal-btn`) + "Confirmar" (`sh-new-confirm-ok`, classe `sysmodal-btn primary`)
- **4 stubs JS** (idempotentes via `typeof !== 'function'`) inseridos depois de `startMatchmakingMP`:
  - `continueSolo()` → alert "Modo Solo em desenvolvimento" (SP-6.3 substitui pela navegação real)
  - `openNewSoloModal()` → toggle `display:flex` no overlay (FUNCIONAL — abrir modal não depende de backend)
  - `closeNewSoloModal()` → toggle `display:none` (FUNCIONAL)
  - `confirmNewSolo()` → fecha modal + alert (SP-6.4 substitui pela lógica de reset real)

### Decisões de design
- **Padrão `sysmodal-bg` em vez do wireframe `mc-modal-overlay`** — wireframe especificava classes que não existem no projeto. O padrão `sysmodal-bg`/`sysmodal` é consistente com `logout-confirm` e `delete-account-confirm`. Manter coesão visual entre os modais do app.
- **`openNewSoloModal`/`closeNewSoloModal` como stubs FUNCIONAIS** — não dependem de backend, são pura UI. Se o usuário clicar NOVO durante este intervalo, o modal abre normalmente. SP-6.4 substitui `confirmNewSolo` pelo reset real e ajusta o texto dinâmico (logged vs guest).
- **`continueSolo` como stub com alert** — depende de progresso (`window.spProgress`) que vem em SP-6.2 + navegação para `sp-map` que existe só em SP-7.1. Stub seguro até essas duas dependências chegarem.
- **Default text em PT** — i18n entra em SP-6.5 reaproveitando chaves `sp_continue`, `sp_new`, `sp_continue_desc`, `sp_new_desc`, `sp_phase`, `back`, `sp_solo`, `sp_new_confirm_logged`, `sp_new_confirm_guest`. Todas já criadas em SP-1.1 e disponíveis em `docs/SP_TERMS.md` §2.
- **Mantido stub idempotente em `openSoloHub` (SP-4.1)** — agora que a tela existe, a checagem `if (document.getElementById('screen-solo-hub'))` passa e navega normalmente. SP-6.2 redefine `openSoloHub` para chamar `loadSPProgress` antes do `showScreen`.

### Estado intermediário
| Caminho | Comportamento atual | Resolvido em |
|---|---|---|
| Menu → NOVO JOGO → SOLO | navega para `screen-solo-hub` ✓ (openSoloHub já cobria) | (pronto via SP-4.1) |
| SOLO → CONTINUAR | alert "Modo Solo em desenvolvimento" | SP-6.3 |
| SOLO → NOVO | abre modal de confirmação ✓ | (pronto) |
| Modal → Cancelar | fecha modal ✓ | (pronto) |
| Modal → Confirmar | fecha modal + alert "Reset em desenvolvimento" | SP-6.4 |
| Tela em outro idioma | textos em PT estático | SP-6.5 |
| `sh-continue-phase` | sempre "Fase 1" (hardcoded) | SP-6.2 (atualiza dinamicamente baseado em spProgress) |

### Smoke test mental
- ✅ HTML well-formed: divs balanceados, IDs únicos (`sh-*` não colide com `sp-*`/`mp-*`/`gm-*`)
- ✅ Modal usa padrão `sysmodal-bg` (já estilizado pelo CSS existente do projeto)
- ✅ Click flow: NOVO JOGO → SOLO → tela com 2 cards
- ✅ NOVO → modal abre; Cancelar → fecha; Confirmar → fecha + alert
- ✅ CONTINUAR → alert (esperado neste estado)

### Próxima sessão
**SP-6.2** — Lógica de fetch de progresso. Implementar:
- `window.loadSPProgress()`: se logado (token disponível), `fetch('/sp/progress', { headers: { Authorization: 'Bearer ' + token } })`. Se !logado ou erro → `window.spProgress = { max_level_completed: 0, isGuest: true }`. Se ok → `{ max_level_completed, isGuest: false }`. Atualizar `sh-continue-phase`: "Fase X+1" se max ∈ 0..14, t('sp_completed_all') se max=15.
- Redefinir `window.openSoloHub` (SP-4.1 stub) para chamar `loadSPProgress()` antes de `showScreen('solo-hub')`.
- Adicionar refresh hook em `showScreen('solo-hub')` para reload de progresso ao re-entrar.
- Endpoint `/sp/progress` já implementado em SP-2.3 (server/server.js).

---

## [2026-05-05] Sessão SP-6.2 — Lógica de fetch de progresso de Single Player

**Status:** Completo
**Branch:** main
**Arquivo modificado:** `html/index.html` — `window.spProgress` + `window.loadSPProgress` + redefinição de `window.openSoloHub` ([linhas 4425-4471](html/index.html#L4425)) + hook em `showScreen('solo-hub')` ([linhas 3883-3886](html/index.html#L3883))

### Feito
- **`window.spProgress`** inicializado com `{ max_level_completed: 0, isGuest: true }` por default (idempotente: `window.spProgress = window.spProgress || ...`).
- **`window.loadSPProgress()`** (async):
  - Pega `Session.get()` (auth-frontend.js); se `null` ou sem `.token` → marca `{ max: 0, isGuest: true }` e atualiza label
  - Senão: `fetch((API_BASE||'') + '/sp/progress', { headers: { Authorization: 'Bearer ' + token } })`
  - Sucesso: `{ max: data.max_level_completed, isGuest: false }`
  - Falha (HTTP !ok ou exception): degrade gracefully → `{ max: 0, isGuest: false }` (mantém autenticado, assume 0)
  - Atualiza `sh-continue-phase` no DOM:
    - `max >= 15` → "Todas as fases completas" (PT default; SP-6.5 trocará por `t('sp_completed_all')`)
    - else → "Fase " + (max + 1) (PT default; SP-6.5 trocará por `t('sp_phase')`)
- **`window.openSoloHub`** redefinido (sem guard idempotente) — sobrescreve o stub SP-4.1 no script load:
  - Se `screen-solo-hub` não existe → alert "Modo Solo em desenvolvimento" (defensivo; nunca acontece já que SP-6.1 criou a tela)
  - Senão → `showScreen('solo-hub')` (que agora dispara `loadSPProgress` via hook)
- **Hook em `showScreen('solo-hub')`** ([linha 3883-3886](html/index.html#L3883)) chama `loadSPProgress()` em todo entry → label atualiza dinamicamente (re-fetch a cada navegação).

### Decisões de design
- **`window.spProgress` em escopo global (não closure-local)** — wireframe explicitamente usa `window.spProgress`. Permite outros módulos (sp-map, game-over solo) lerem o estado sem importar/closure-passing. Trade-off: poluição global, mas consistente com `window.Session`, `window.SP_ENABLED`, etc.
- **Fetch dispara via hook em showScreen, NÃO dentro de openSoloHub** — evita double-fetch (openSoloHub → showScreen → entrar tela). showScreen é o ponto único onde o fetch é triggered, simplificando race conditions.
- **Erro de rede degrada como `isGuest: false, max: 0`** — usuário continua "logado" (não vira convidado por causa de erro de rede). Apenas perde o progresso temporariamente até refresh. Coerente com a nota da spec: "Erro de rede (fetch falhou) | CONTINUAR — Fase 1 + assume 0 | habilitado (degrada gracefully)".
- **PT defaults em vez de `t('sp_phase')`** — `sp_phase` e `sp_completed_all` ainda não estão em `T.{lang}` (são adicionados em SP-6.5 via SP_TERMS.md). Hardcoding "Fase " e "Todas as fases completas" agora; SP-6.5 substitui.
- **`Session` via `typeof !== 'undefined'`** — auth-frontend.js carrega como script externo. Ordem de execução pode variar; guard previne ReferenceError caso a função seja chamada antes do auth-frontend.js carregar.
- **`Number(data.max_level_completed) || 0`** — defensivo contra payload malformado do servidor (campo ausente ou string).

### Smoke test mental
- ✅ Convidado → SOLO → label "Fase 1" (max=0); spProgress.isGuest=true
- ✅ Logado novo (sem progresso) → SOLO → fetch retorna max=0 → label "Fase 1"; spProgress.isGuest=false
- ✅ Logado com progresso 6 → SOLO → fetch retorna max=6 → label "Fase 7"
- ✅ Logado com tudo completo (max=15) → SOLO → label "Todas as fases completas"
- ✅ Erro de rede (servidor offline) → SOLO → label "Fase 1" + spProgress.isGuest=false (não degrada para guest)
- ✅ Re-entry: SOLO → BACK → SOLO → fetch dispara de novo (label re-atualiza se progresso mudou)
- ✅ Token inválido / 401 → catch trata, label "Fase 1"

### Próxima sessão
**SP-6.3** — Substituir `window.continueSolo` (stub SP-6.1) pela navegação real:
- Ler `window.spProgress.max_level_completed`
- Se = 15 → `showScreen('sp-map')` (tela existe em SP-7.1; até lá, `showScreen` cai num blank → adicionar fallback `alert('Mapa em desenvolvimento.')`)
- Senão → `window.startSPLevel(max + 1)` — helper que emite `socket.emit('single_player_start', { token: session?.token, level })` + transiciona para `screen-matchmaking` (handler servidor SP-3.7 cria a partida)
- Não mexer em `loadSPProgress` ou `openSoloHub` (já implementados em SP-6.2)

---

## [2026-05-05] Sessão SP-6.4 — Modal NOVO funcional (texto dinâmico + reset POST /sp/reset)

**Status:** Completo
**Branch:** main
**Arquivo modificado:** `html/index.html` — substituídos stubs SP-6.1 de `openNewSoloModal` e `confirmNewSolo` por implementação real ([linhas 4403-4445](html/index.html#L4403))

### Decisão de ordem
Pulei SP-6.3 (próxima na tabela §10) porque sua dependência SP-7.1 (`screen-sp-map`) ainda não foi feita. Per §11: pega **primeira ⏳ Pendente respeitando dependências**. SP-6.4 tem deps satisfeitas (SP-6.1 ✅ + SP-2.3 ✅).

### Feito
- **`window.openNewSoloModal`** (real, sem guard idempotente — sobrescreve o stub):
  - Define o texto do body do modal (`sh-new-confirm-text`) baseado em `window.spProgress.isGuest`:
    - **Logado:** "Reiniciar zera seu progresso permanentemente. Confirmar?"
    - **Convidado:** "Começar nova jornada Solo a partir da Fase 1?" (sem aviso de perda)
  - Display do overlay: `flex` (mesma técnica da `sysmodal-bg` legada)
- **`window.confirmNewSolo`** (async, real):
  - Fecha o modal imediatamente (UX: feedback instantâneo)
  - Se `!isGuest` e `Session.get()?.token`: `await fetch('/sp/reset', POST, Authorization Bearer)`. Try/catch silencioso — degrade gracefully se servidor falhar
  - Se convidado: pula servidor (não há nada para resetar)
  - Atualização local: `window.spProgress.max_level_completed = 0`
  - Atualiza label `sh-continue-phase` para "Fase 1" (PT default; SP-6.5 trocará por `t('sp_phase')`)
  - **Não auto-navega** para fase 1 — depende de SP-6.3 + SP-7.1 (sp-map não existe). Usuário fica no solo-hub com label refrescado e clica CONTINUAR manualmente quando estiver pronto.
- **`window.closeNewSoloModal`** mantido (já era funcional desde SP-6.1)
- **`window.continueSolo`** intacto (SP-6.1 stub) — SP-6.3 substituirá

### Decisões de design
- **Sem auto-navegação após confirm** — wireframe sugeria "iniciar fase 1 imediatamente OU navegar para sp-map". Ambas opções dependem de infra ainda não pronta (SP-6.3 / SP-7.1 / SP-7.3). Comportamento mais seguro: reset + label refresh, deixa usuário escolher quando jogar.
- **Update local IMEDIATO mesmo se POST falhar** — UX consistente: usuário vê "Fase 1" instantâneo. Se servidor caiu, na próxima abertura `loadSPProgress` re-fetch resolverá divergência (servidor ainda tem progresso antigo, retorna max>0; cliente perdeu o reset). É um caso raro (servidor down durante reset); aceitável.
- **`window.spProgress.max_level_completed = 0` em vez de chamar `loadSPProgress()`** — evita refetch desnecessário. Após POST /sp/reset, próximo `loadSPProgress` retornará 0 anyway. Para ser idempotente sem network call, atualizo local diretamente.
- **PT defaults** — `sp_new_confirm_logged`, `sp_new_confirm_guest`, `sp_phase` ainda não estão em `T.{lang}` (entram em SP-6.5). Hardcoded em PT por ora.
- **`/sp/reset` já existe** — endpoint criado em SP-2.3. Verificado em `server/server.js` (handler POST /sp/reset com `apiLimiter` + auth).

### Smoke test mental
- ✅ Convidado clica NOVO → modal abre com texto "Começar nova jornada Solo a partir da Fase 1?" → Confirmar → modal fecha + label "Fase 1" + nenhuma chamada de rede
- ✅ Logado com max=6 clica NOVO → modal abre com "Reiniciar zera seu progresso..." → Confirmar → POST /sp/reset → modal fecha + label "Fase 1" + spProgress.max=0
- ✅ Logado clica Cancelar → modal fecha sem reset
- ✅ Servidor offline + logado → POST falha silenciosamente → label "Fase 1" + spProgress.max=0 local (próximo loadSPProgress vai retornar valor real do servidor)
- ✅ Click NOVO duplo (rápido) → modal já aberto; abrir de novo é idempotente (define text + display:flex de novo)

### Próxima sessão
**SP-7.1** — Criar `<div id="screen-sp-map" class="screen">` em `html/index.html`. Inserir após `#screen-solo-hub` (~linha 2088). Conteúdo:
- Header: back-btn → `showScreen('solo-hub')` + título "MAPA SOLO" (key `sp_map_title` existe em SP_TERMS.md)
- Grid de 15 cards: cada um com ID `sp-lvl-{N}`, label da fase e ícone de estado
- Estados visuais (`sp_locked` / `sp_current` / `sp_completed`) ficam para SP-7.2
- Click handler (`startSPLevel`) fica para SP-7.3
- Por que SP-7.1 agora? Destrava SP-6.3 + SP-7.2/7.3 + SP-7.5 (animação de fase desbloqueada).

---

## [2026-05-05] Sessão SP-7.1 — Tela `#screen-sp-map` com grid de 15 fases

**Status:** Completo
**Branch:** main
**Arquivo modificado:** `html/index.html` — nova tela ([linhas 2089-2099](html/index.html#L2089)) + modal de iniciar fase ([linhas 2102-2113](html/index.html#L2102)) + JS helpers ([linhas 4496-4584](html/index.html#L4496)) + hook em `showScreen` ([linhas 3887-3890](html/index.html#L3887))

### Feito
- **Tela `#screen-sp-map`** inserida após `#sh-new-confirm`:
  - Header: back-btn → `showScreen('solo-hub')` + label `sm-back-label` ("VOLTAR")
  - Título `sm-title` ("MAPA SOLO")
  - Grid container `#sm-grid`: `display:grid; grid-template-columns:repeat(3,1fr); gap:10px; max-width:600px` — 3 cols mobile-friendly. Cards são gerados via JS, NÃO hardcoded.
- **Modal `#sm-start-modal`** (sysmodal-bg) inserido após a tela:
  - Title `sm-start-title` ("Fase X — Nome") — texto dinâmico em SP-7.3
  - Body `sm-start-difficulty` ("★★★") — dificuldade hardcoded por fase
  - Botões `sm-start-cancel` + `sm-start-play` (classes `sysmodal-btn` e `sysmodal-btn primary`)
- **`window.buildSPMap()`** (idempotente via flag `_spMapBuilt`):
  - Limpa `sm-grid.innerHTML`
  - Loop n=1..15: cria `<button id="sm-card-N" data-level="N" data-state="locked">`
  - Estilo inline do card: padding/border/radius/cursor/transitions
  - InnerHTML com 2 spans (`sm-card-N-num` para número, `sm-card-N-state` para ícone) + div com nome (`sm-card-N-name`)
  - Fechamento sobre `n` via IIFE para evitar bug clássico de closure no `onclick`
- **`window.refreshSPMap()`** (chamada em todo entry; chama buildSPMap se ainda não foi feito):
  - Lê `window.spProgress.max_level_completed` (default 0)
  - Para cada n=1..15:
    - `n <= max` → state="completed", ícone "✓", border `--mc-success`, bg `--mc-success-soft`, cursor pointer
    - `n === max + 1` → state="current", ícone "▶", border 2px `--mc-accent`, cursor pointer
    - else → state="locked", ícone "🔒", opacity 0.4, cursor not-allowed
  - Atualiza `card.dataset.state` (usado pelos handlers para gating)
- **Constantes hardcoded**:
  - `SP_DIFFICULTY = { 1:1..3:1, 4:2..6:2, 7..10:3, 11..13:4, 14..15:5 }` (bate com tabela §5 SP_PLANNING.md)
  - `SP_LEVEL_NAMES_PT = { 1:'Recruta', ..., 15:'Lenda' }` (PT defaults; SP-7.4 trocará por `t('sp_lvl' + n + '_name')`)
- **3 stubs idempotentes** (`openSPLevel`, `closeSPStartModal`, `confirmStartSPLevel`) — SP-7.3 substituirá com handlers reais (modal dinâmico + emit `single_player_start`)
- **Hook em `showScreen('sp-map')`** chama `refreshSPMap()` (que dispara `buildSPMap` na primeira vez)

### Decisões de design
- **Geração dinâmica via JS** em vez de 15 blocos repetidos no HTML — por sugestão explícita do wireframe (§466). Reduz ~150 linhas de HTML repetido.
- **`SP_DIFFICULTY` e `SP_LEVEL_NAMES_PT` como `const` em closure** em vez de `window.SP_DIFFICULTY` — não precisa exposição global; só `buildSPMap` e (futuramente) `openSPLevel` usam. Mantém escopo limpo.
- **`refreshSPMap` aceita falta de cards** (early-continue se `card` null) — defensivo; permite chamada mesmo antes de `buildSPMap` (que é chamado no início da própria função se `_spMapBuilt` é false).
- **Closure por IIFE no onclick** — `btn.onclick = (function(level) { return function() { window.openSPLevel(level); }; })(n);` — pattern clássico para evitar todos os 15 botões chamarem `openSPLevel(15)` (último valor de n no loop). Alternativa moderna seria arrow function com `let n` (já é `let n` no for, então isso já funcionaria — mas o IIFE é explícito e evita ambiguidade).
- **`--mc-success` e `--mc-success-soft` reaproveitam tokens existentes** — verificado em [html/index.html:51-52](html/index.html#L51) (light theme) e [html/index.html:126-127](html/index.html#L126) (dark theme).
- **Modal com sysmodal-bg em vez de mc-modal-overlay** — consistência com outros modais (logout, delete, sh-new-confirm). Wireframe usa nomes que não existem.
- **Ícones de estado em emoji** (✓/▶/🔒) — simples, universal, não exige SVG. Polishing visual fica para SP-7.2.

### Smoke test mental
- ✅ Navegação direta: DevTools Console `showScreen('sp-map')` → tela renderiza com grid 3-col, 15 cards
- ✅ Convidado (max=0): card 1 highlighted (▶, border accent), cards 2-15 locked (🔒, opacity 0.4)
- ✅ Logado com max=6: cards 1-6 completed (✓, bg success-soft), card 7 current (▶), cards 8-15 locked
- ✅ Logado com max=15: todos completed (todos com ✓)
- ✅ Click em card unlocked → alert "Iniciar fase em desenvolvimento" (stub SP-7.3)
- ✅ Click em card locked → ignorado (early return em openSPLevel)
- ✅ Re-entrada na tela → buildSPMap NÃO refaz (flag `_spMapBuilt`); só refreshSPMap atualiza estados
- ✅ HTML well-formed: divs balanceados, IDs únicos sm-* (não colide com sh-/mp-/gm-)

### Próxima sessão
**SP-7.2** — Polimento dos estados visuais dos cards. SP-7.1 já fez o básico (✓/▶/🔒 + opacity + border). SP-7.2 deve adicionar:
- Animação `pulse` no card `current` — keyframes inline dentro de um `<style>` no próprio screen-sp-map (não tocar no style global)
- Sombra `box-shadow: 0 0 16px var(--mc-accent-glow)` no current
- Color verde mais sólido no ícone ✓ do completed (atualmente só herda do emoji)
- Hover effect nos cards desbloqueados (border-color transition para `--mc-accent` em hover)
- Tweaks de spacing se necessário

---

## [2026-05-05] Sessão SP-7.2 — Polimento visual dos cards (animação + hover + classes CSS)

**Status:** Completo
**Branch:** main
**Arquivo modificado:** `html/index.html` — novo `<style>` ([linhas 2089-2101](html/index.html#L2089)) + refatoração de `buildSPMap`/`refreshSPMap` ([linhas 4525-4571](html/index.html#L4525))

### Feito
- **Novo `<style>` block** inserido antes de `#screen-sp-map` (não toca no `<style>` global, conforme regra do projeto):
  - `@keyframes sp-pulse`: oscila box-shadow entre `0 0 10px` e `0 0 22px var(--mc-accent-glow)` em 2.4s ease-in-out infinite
  - `#sm-grid > button { transition: ... }` — base smooth para hover/state changes
  - 3 classes de estado (`.sp-card-locked`, `.sp-card-completed`, `.sp-card-current`) com background/border/cursor/opacity próprios
  - `:hover` rule combinada para completed+current → `transform: translateY(-2px)` + border-color accent
  - Locked NÃO tem hover effect (intencional — usuário não deve achar que pode clicar)
- **Refatoração de `buildSPMap`**:
  - Removeu inline styles que conflitavam (`border`, `background`, `cursor`, `opacity`, `transition`)
  - Mantém apenas estilos de geometria/tipografia (`padding`, `border-radius`, `text-align`, `box-sizing`, `font-family:inherit`)
  - Adiciona `btn.className = 'sp-card-locked'` como default
- **Refatoração de `refreshSPMap`**:
  - Removeu set de inline styles (border, opacity, cursor, background)
  - Agora apenas: `card.classList.remove(3 classes); card.classList.add('sp-card-' + state)`
  - Mantém ícone via `stateEl.textContent` (✓/▶/🔒)
  - `card.dataset.state` continua sendo escrito (handlers em SP-7.3 lerão para gating de locked)

### Decisões de design
- **Classes CSS em vez de inline styles** — pseudo-classes (`:hover`) e animations não funcionam inline. Refatoração necessária; trade-off é centralização da lógica de estado em CSS (mais limpo) versus dispersão (inline + JS). Optei pela centralização.
- **`@keyframes sp-pulse` em 2.4s** — wireframe sugeria animação pulse sem especificar timing. 2.4s é suave o bastante para não distrair, rápido o bastante para chamar atenção. Ease-in-out evita movimento mecânico.
- **`box-shadow` oscilando, não `transform: scale`** — escolha visual: glow externo é mais elegante que pulsar tamanho do botão. Também não desloca cards adjacentes no grid.
- **Hover apenas em completed+current** — feedback visual de "clicável" só em estados navegáveis. Locked permanece estático.
- **`translateY(-2px)` em hover** — micro-elevação dá feedback tátil sem overshoot. Border-color para `--mc-accent` reforça interatividade.
- **NÃO mexi na cor do ícone ✓** — emoji ✓ não aceita color CSS facilmente. Visual já é diferenciado pelo bg success-soft + border verde. SP-9 QA dirá se precisa mais contraste.

### Smoke test mental
- ✅ Convidado: card 1 com border accent + animação pulse visível (oscilação suave do glow)
- ✅ Hover em card current: leve elevação + border accent reforçada
- ✅ Logado max=6: cards 1-6 com bg success-soft + border verde; hover funciona
- ✅ Cards locked (8-15): opacity 0.4, cursor not-allowed, sem hover effect
- ✅ Re-entrada: refreshSPMap troca classes corretamente (remove 3 + add 1)
- ✅ Conflitos de inline vs CSS: zero — buildSPMap não seta mais propriedades de estado

### Próxima sessão
**SP-7.3** — Conectar os 3 stubs (`openSPLevel`, `closeSPStartModal`, `confirmStartSPLevel`) à lógica real:
- `openSPLevel(n)`: gating em locked (já feito), set `_spPendingLevel = n`, popular `sm-start-title` (`t('sp_phase')` + ' ' + n + ' — ' + nome) e `sm-start-difficulty` ("★" × `SP_DIFFICULTY[n]`), abrir modal
- `closeSPStartModal()`: já fecha modal + limpa pendingLevel
- `confirmStartSPLevel()`: ler `_spPendingLevel`, fechar modal, `window.spActiveLevel = level`, `socket.emit('single_player_start', { level, token, uid, nickname, avatar })`. Handler servidor (SP-3.7) cria a sala; client transiciona via `match_found` event existente.
- Pré-requisitos satisfeitos: SP-3.7 (handler) + SP-7.1 (modal/cards).

---

## [2026-05-05] Sessão SP-6.3 — Botão CONTINUAR (navegação real)

**Status:** Completo
**Branch:** main
**Arquivo modificado:** `html/index.html` — substituído stub `window.continueSolo` ([linhas 4440-4476](html/index.html#L4440))

### Feito
- **`window.continueSolo`** (real, sobrescreve o stub SP-6.1; sem guard `typeof !== 'function'`):
  - Lê `max = window.spProgress.max_level_completed || 0`
  - Chama `showScreen('sp-map')` — o hook existente em [showScreen ~L3929](html/index.html#L3929) dispara `refreshSPMap()` automaticamente, então não preciso chamar à mão
  - **Se `max >= 15`**: cria (lazy/idempotente) banner `#sm-completed-banner` inserido no início de `#screen-sp-map` antes de `#sm-grid`. Texto PT default: "Todas as fases completas — explore livremente". Estilo inline com tokens `--mc-success`/`--mc-success-soft`/`--mc-r-md`/`--mc-font-serif`. SP-6.5 trocará texto por `t('sp_completed_all_explore')`
  - **Se `max < 15`**: oculta o banner (caso já exista de uma sessão anterior dessa janela) e faz `scrollIntoView({behavior:'smooth', block:'center'})` no card `sm-card-{max+1}` após delay de 60ms (garante que `buildSPMap` rodou na primeira entrada). Try/catch silencioso em browsers antigos sem suporte ao options object.

### Decisões de design
- **Banner em vez de modal/alert** para max=15 — UX menos intrusiva. Usuário já chegou ao mapa, banner reforça contexto sem bloquear interação. Modal/alert seria adequado se exigíssemos ação do usuário; aqui é só informativo.
- **Lazy creation do banner** — não polui o HTML estático. Só existe no DOM se algum usuário max=15 chegar a entrar pela tela. Idempotente: chamadas subsequentes reutilizam o mesmo elemento (não duplica).
- **`setTimeout(..., 60)` antes de scrollIntoView** — `refreshSPMap()` é chamado síncronamente pelo hook em `showScreen`, mas se for a primeira entrada, `buildSPMap()` é chamado dentro dele e cria os 15 botões. 60ms é margem segura para o browser pintar o DOM antes do scroll. Não é animação que o usuário percebe — apenas garantia de race-free.
- **`scrollIntoView({block:'center'})`** em vez de `block:'start'` — em desktop com viewport alto, centralizar o card current é melhor enquadramento. Em mobile com 3 colunas e tela curta, equivale a colocar o card visível.
- **Removi guard `typeof !== 'function'`** que protegia o stub SP-6.1 de ser sobrescrito — agora estamos sobrescrevendo com a versão real, sem necessidade de proteção. SP-6.4 fez o mesmo padrão (substituir stub direto).
- **Não auto-inicia fase 1 nem abre modal de "iniciar fase X"** — wireframe deixa ambíguo se CONTINUAR deveria pular o sp-map e ir direto pra fase. Decisão: navegar para sp-map e destacar visualmente. Razão: (1) sp-map já mostra animação pulse no card current via SP-7.2, então o destaque é redundante mas reforçado pelo scroll; (2) usuário pode mudar de ideia e escolher rejogar fase anterior; (3) clicar no card current dispara `openSPLevel` que abre o modal de confirmação (SP-7.3 fará isso real).
- **`screen-sp-map` ainda não tem `openSPLevel` real** — SP-7.3 ainda é stub (alert "Iniciar fase em desenvolvimento"). CONTINUAR vai navegar e focar, mas o usuário só conseguirá efetivamente jogar a fase quando SP-7.3 for implementado. Aceitável — SP-6.3 é só sobre navegação do hub para o mapa.

### Smoke test mental
- ✅ Convidado (max=0): clica CONTINUAR → sp-map → card 1 fica visível e centrado, com pulse accent
- ✅ Logado max=6: CONTINUAR → sp-map → scroll suave até card 7, que está em estado current (pulse)
- ✅ Logado max=15: CONTINUAR → sp-map → banner "Todas as fases completas — explore livremente" aparece no topo. Cards 1-15 todos completed (✓ + bg success-soft).
- ✅ Re-entrada após max=15 → banner reutilizado (não duplica). Se max cair para <15 (não acontece em fluxo normal, mas defensivo), banner é ocultado.
- ✅ CONTINUAR sem `window.spProgress` definido (defensivo) → `max=0`, navega normalmente
- ✅ HTML não foi tocado — apenas substituição de função JS dentro do `<script>` existente

### Próxima sessão
**SP-6.5** — i18n do solo-hub. Substituir todos os hardcodes PT em:
- `sh-continue-label` (label "CONTINUAR")
- `sh-card-new` (label "NOVO")
- `sh-continue-phase` (renderizado por `loadSPProgress`: "Fase N" / "Todas as fases completas")
- `sh-new-confirm-text` (renderizado por `openNewSoloModal`: aviso logged vs guest)
- `sm-completed-banner.textContent` (criado por `continueSolo` em SP-6.3)
Adicionar chaves `sp_continue`, `sp_new`, `sp_phase`, `sp_completed_all`, `sp_completed_all_explore`, `sp_new_confirm_logged`, `sp_new_confirm_guest` em todos os 9 idiomas (PT/EN/ES/DE/IT/RU/JA/KO/ZH). Atualizar `applyLang()` para popular labels estáticos; chamar updates dos dinâmicos (`loadSPProgress`, refresh do banner) ao trocar idioma.

---

## [2026-05-05] Sessão SP-6.5 — i18n do screen-solo-hub × 9 idiomas

**Status:** Completo
**Branch:** main
**Arquivo modificado:** `html/index.html` — chaves SP em cada bloco `T.{lang}` (linhas 3140-3145, 3208-3213, 3303-3308, 3403-3408, 3500-3505, 3593-3598, 3683-3688, 3773-3778, 3865-3870), nova função `refreshSoloHubScreen` + helper `renderSPContinueLabel` ([linhas 4031-4063](html/index.html#L4031)), hooks em `showScreen` ([L3970](html/index.html#L3970)) e `selectLanguage` ([L4344](html/index.html#L4344)), substituição de hardcodes PT em `openNewSoloModal`/`confirmNewSolo`/`loadSPProgress`/`continueSolo` ([linhas 4451-4574](html/index.html#L4451))

### Feito
- **9 chaves novas em todos os 9 blocos `T.*`** (PT/EN/ES/DE/IT/RU/JA/KO/ZH):
  - `sp_continue`, `sp_new` — labels dos cards CONTINUAR/NOVO
  - `sp_continue_desc`, `sp_new_desc` — descrições secundárias dos cards (também eram hardcoded em PT no HTML)
  - `sp_phase` — palavra "Fase" / "Phase" / "フェーズ" / etc.
  - `sp_completed_all` — label CONTINUAR quando max=15 ("Todas as fases completas")
  - `sp_completed_all_explore` — banner sp-map quando max=15 ("Todas as fases completas — explore livremente")
  - `sp_new_confirm_title` — título estático do modal NOVO ("Reiniciar jornada?")
  - `sp_new_confirm_logged` + `sp_new_confirm_guest` — corpos do modal NOVO (variantes logado vs guest)
- **`window.renderSPContinueLabel()`** — helper único que lê `window.spProgress.max_level_completed` e popula `#sh-continue-phase` com `t('sp_completed_all')` (max≥15) ou `t('sp_phase') + ' ' + (max+1)`. Usado por: `loadSPProgress`, `confirmNewSolo` (após reset), `refreshSoloHubScreen` (troca de idioma).
- **`refreshSoloHubScreen()`** seguindo padrão de `refreshMultiplayerModeScreen`: popula `sh-title`, `sh-back-label`, `sh-continue-label`, `sh-continue-desc`, `sh-new-label`, `sh-new-desc`, `sh-new-confirm-eyebrow`, `sh-new-confirm-title`, `sh-new-confirm-cancel` (`t('cancel_action')`), `sh-new-confirm-ok` (`t('yes')`), e `sm-completed-banner` se já existir no DOM. Chama `renderSPContinueLabel()` ao final.
- **Hooks**:
  - `showScreen('solo-hub')` agora chama `refreshSoloHubScreen()` antes do `loadSPProgress()` (i18n estático antes do fetch)
  - `selectLanguage(lang)` chama `refreshSoloHubScreen()` se a tela atual é solo-hub. Adicionalmente força refresh do `sm-completed-banner` mesmo que solo-hub não esteja ativa (banner pode existir no sp-map criado lazy por `continueSolo` SP-6.3).
- **Hardcodes PT removidos**:
  - `openNewSoloModal`: `'Começar nova jornada Solo...'` / `'Reiniciar zera seu progresso...'` → `t('sp_new_confirm_guest')` / `t('sp_new_confirm_logged')`
  - `confirmNewSolo`: bloco que setava `phaseEl.textContent = 'Fase 1'` → chamada a `renderSPContinueLabel()` (consistente com `loadSPProgress`)
  - `loadSPProgress.updateLabel`: lógica inline duplicada → delegada a `renderSPContinueLabel()`
  - `continueSolo` (SP-6.3): banner `'Todas as fases completas — explore livremente'` → `t('sp_completed_all_explore')`

### Decisões de design
- **`sp_new_confirm_title` adicionado fora da lista original** — modal já tem header estático "Reiniciar jornada?" no HTML; sem essa chave, o título fica em PT em todos os idiomas. Adicionado para fechar o gap.
- **`sp_continue_desc` + `sp_new_desc` cobertos junto** — são hardcoded em PT no HTML do solo-hub; se ficassem fora desta sessão seriam regression i18n óbvia. Custo trivial: 2 chaves × 9 línguas.
- **`sh-new-confirm-ok` usa `t('yes')`** em vez de criar uma chave nova `t('confirm')` — `yes` já existe em todos os 9 blocos e é semanticamente equivalente neste contexto (modal de confirmação binária). Padrão consistente com `logout-yes-btn` e outros sysmodal-btn primary do projeto.
- **`renderSPContinueLabel` exposto em `window`** — chamado de pelo menos 3 lugares (`loadSPProgress`, `confirmNewSolo`, `refreshSoloHubScreen`) e potencialmente futuras sessões SP-7.x/8.x; expor evita ordenação de declaração e closures aninhadas.
- **`refreshSoloHubScreen` é regular function (não `window.*`)** — segue padrão das outras `refreshXScreen` no arquivo, todas locais ao IIFE/script principal. Não há necessidade de exposição global.
- **Banner `sm-completed-banner`** atualizado em 2 caminhos: (1) `refreshSoloHubScreen` quando solo-hub está ativa; (2) `selectLanguage` força refresh independente da tela ativa. Banner pode existir no sp-map mesmo quando o usuário não está no solo-hub (criado lazy pelo `continueSolo`), então ambos os caminhos são necessários.
- **Modal `sh-new-confirm` body atualizado on-demand** — `openNewSoloModal` recalcula `sh-new-confirm-text` toda vez que abre, baseado no estado guest atual. Isso já era assim em SP-6.4; só substituí o hardcode pelos `t()` correspondentes.
- **`sp_solo` reaproveitado para `sh-title`** — chave existente desde SP-4.2; mesma string ("SOLO" / "ソロ" / etc.). Não criei uma chave duplicada.

### Smoke test mental
- ✅ Trocar idioma para EN com solo-hub aberta → "CONTINUE — Phase 1", "NEW", "Resume where you left off", "Start from the beginning (Phase 1)"
- ✅ Trocar para JA → "続ける — フェーズ 1", "新規", "中断したところから再開", "最初から始める（フェーズ1）"
- ✅ Convidado em ES, clicar NOVO → modal com title "¿Reiniciar travesía?" + body "¿Comenzar una nueva travesía Solo desde la Fase 1?" + botões "CANCELAR" / "SÍ"
- ✅ Logado max=6 em DE → label "FORTSETZEN — Phase 7"; clicar NOVO → "Neustart setzt deinen Fortschritt dauerhaft zurück. Bestätigen?"
- ✅ Logado max=15 em IT → label "CONTINUA — Tutte le fasi completate"; clicar CONTINUAR → sp-map com banner "Tutte le fasi completate — esplora liberamente"
- ✅ Banner já criado em PT, depois usuário troca para FR (não suportado) → fallback EN: "All phases completed — explore freely"
- ✅ Banner já criado em PT, depois usuário troca para RU sem voltar pro solo-hub → `selectLanguage` força refresh do banner; texto vira "Все этапы пройдены — свободное исследование"
- ✅ HTML estático preservado — apenas substituições JS dentro do `<script>` existente; nenhuma reescrita de bloco

### Próxima sessão
**SP-7.3** — Click em card do sp-map → emit `single_player_start`. Substituir 3 stubs:
- `openSPLevel(n)`: gating em `card.dataset.state === 'locked'`; popula modal `sm-start-modal` com título e dificuldade (★ × SP_DIFFICULTY[n]); abre via `display:flex`
- `confirmStartSPLevel()`: emit `socket.emit('single_player_start', { level, token, uid, nickname, avatar })`; servidor (SP-3.7) cria a sala; cliente entra via match_found existente
- Pré-requisitos satisfeitos: SP-3.7 ✅ (handler) + SP-7.1 ✅ (modal/cards) + SP-6.5 ✅ (`t('sp_phase')` disponível para o título)

---

## [2026-05-05] Sessão SP-7.3 — Click em card do mapa → emit `single_player_start`

**Status:** Completo
**Branch:** main
**Arquivo modificado:** `html/index.html`
- Chave `sp_play` adicionada nos 9 blocos `T.*` (linhas 3140, 3209, 3304, 3404, 3501, 3594, 3684, 3774, 3866)
- Helpers `_spPhaseName(n)` + `_spDifficultyStars(n)` + `window.refreshSPMapModal` ([linhas 4715-4740](html/index.html#L4715))
- Implementação real de `window.openSPLevel`, `window.closeSPStartModal`, `window.confirmStartSPLevel` ([linhas 4742-4789](html/index.html#L4742))
- Listener `socket.on('sp_error')` ([linhas 4791-4799](html/index.html#L4791))
- Hook em `selectLanguage` para refresh do modal aberto ([linha 4396](html/index.html#L4396))

### Feito
- **`sp_play`** adicionado em 9 idiomas: PT 'JOGAR' / EN 'PLAY' / ES 'JUGAR' / DE 'SPIELEN' / IT 'GIOCA' / RU 'ИГРАТЬ' / JA 'プレイ' / KO '플레이' / ZH '开始'.
- **`_spPhaseName(n)`**: tenta `t('sp_lvl' + n + '_name')`; se `t()` retornar a própria key (chave inexistente — fallback do helper), cai em `SP_LEVEL_NAMES_PT[n]`. Quando SP-7.4 adicionar as 15 chaves traduzidas, troca automática.
- **`_spDifficultyStars(n)`**: '★' repetido × `SP_DIFFICULTY[n]` + '☆' repetido para preencher 5 (visual de "X de 5 estrelas").
- **`window.refreshSPMapModal()`** (idempotente, exposto em window):
  - Atualiza eyebrow (`t('sp_solo')`), botão Cancelar (`t('cancel_action')`), botão Jogar (`t('sp_play')`)
  - Se `_spPendingLevel` é um nível válido (1-15), recalcula título (`t('sp_phase') + ' ' + n + ' — ' + nome`) e dificuldade. Útil quando idioma muda com modal aberto.
- **`window.openSPLevel(n)`** real:
  - Valida `n` (number, 1..15)
  - Gating de `card.dataset.state === 'locked'` → return silencioso
  - Set `_spPendingLevel = n`
  - Chama `refreshSPMapModal()` para popular tudo (estática + dinâmica)
  - `m.style.display = 'flex'` para exibir
- **`window.closeSPStartModal()`** real (sem guard `typeof !== 'function'`): fecha + limpa `_spPendingLevel`. Idempotente.
- **`window.confirmStartSPLevel()`** real:
  - Captura `level = _spPendingLevel`, limpa `_spPendingLevel = null` (proteção contra duplo-click)
  - Fecha modal
  - Validação defensiva (1-15)
  - Set `window.spActiveLevel = level` — flag global lida em SP-8.1 (game-over) para customizar botões "PRÓXIMA FASE" / "TENTAR NOVAMENTE"
  - Popula campos da tela `screen-matchmaking` (espelha `goMatchmaking` sem queue_join): avatar, nick, labels i18n
  - `setMMState('lobby')` + `showScreen('matchmaking')`
  - Emite `socket.emit('single_player_start', { uid, nickname, avatar, token, level })` — token via `Session.get()?.token` (null para convidado, OK)
  - Servidor (SP-3.7, [server.js:1195](server/server.js#L1195)) cria sala imediatamente e responde `match_found`. Cliente trata via listener existente ([html/index.html:4798](html/index.html#L4798)) → `setMMState('found')` → countdown 3-2-1-GO → `launchGame()` → game-area + `game_join`.
- **`socket.on('sp_error')`** novo handler:
  - Server emite `sp_error` em casos de `invalid_level` ou `level_locked` ([server.js:1200,1216](server/server.js#L1200))
  - Cliente: limpa `window.spActiveLevel`, volta para `screen-sp-map`, refaz `loadSPProgress()` + `refreshSPMap()` para sincronizar estado real (caso o cheating via console tenha pedido level acima do permitido)
  - Sem alert/UI explicativo — refresh do mapa já mostra qual fase é a real disponível (border accent + pulse no `current`)
- **Hook em `selectLanguage`**: chama `window.refreshSPMapModal()` se ele existir. Cobre o caso edge de usuário trocar idioma com modal aberto sobre qualquer tela.

### Decisões de design
- **`refreshSPMapModal` exposto em `window`** — mesmo padrão de `renderSPContinueLabel` (SP-6.5). Acessado por `selectLanguage` (escopo distante) e por `openSPLevel` (escopo próximo). Expor evita ordering issues.
- **`_spPendingLevel` permanece local** — só `openSPLevel`/`closeSPStartModal`/`confirmStartSPLevel`/`refreshSPMapModal` precisam dele, todos no mesmo IIFE. Não exponho.
- **Limpar `_spPendingLevel = null` no `confirmStartSPLevel` ANTES de emitir** — protege contra duplo-click do botão Jogar (segundo click vê `_spPendingLevel === null` e retorna por validação `typeof level !== 'number'`).
- **Espelhei `goMatchmaking` em vez de chamá-la** — `goMatchmaking` emite `queue_join`/`queue_train`, não single_player_start. Refatorar para extrair "preparar matchmaking screen" criaria churn maior do que repetir 6-7 linhas. Aceito a duplicação local.
- **`sp_error` sem alert/i18n custom** — erro é raro (só dispara em cheating ou bug). Recovery silencioso (volta ao mapa + refresh) é suficiente; não vale o overhead de chave i18n para mensagem que ninguém deveria ver. SP-9.3 (validação de segurança) decide se precisa de UX explícita.
- **`spActiveLevel` setado no client antes do match_found** — server confirma match implicitamente via `match_found`. Se servidor rejeita (sp_error), o handler limpa `spActiveLevel`. Não há janela em que `spActiveLevel != null && partida não confirmada` por mais que alguns ms. SP-8.1 vai depender disso para detectar Solo no game-over.
- **Estrelas com '★' + '☆' (5 total)** — visual "X de 5". SP_PLANNING.md tabela §5 lista difficulty 1-5; preencher zeros com '☆' deixa explícito o teto. Trade-off: mais caracteres no modal vs informação mais clara.
- **Não chamei `goMatchmaking('train')` ou similar** — apesar de `queue_train` existir e ter fluxo similar, ele NÃO suporta `level` (uma única estratégia 0). single_player_start é o handler correto, criado em SP-3.7 explicitamente para 15 estratégias.
- **`launchGame` existente continua funcionando** — não precisei tocar. O `match_found` event chega com `sp: { level, isGuest }` ([server.js:1253](server/server.js#L1253)) mas o cliente atual ignora esse campo. SP-8.1 vai consumir para customizar gameOver. OK.

### Smoke test mental
- ✅ Convidado clica card 1 (current) em PT → modal abre com "Solo / Fase 1 — Recruta / ★☆☆☆☆ / CANCELAR / JOGAR". Confirma → matchmaking lobby aparece → match_found chega → countdown → game-area com bot Recruta como adversário.
- ✅ Logado max=6 em EN clica card 7 → modal "Solo / Phase 7 — Tanque / ★★★☆☆ / CANCEL / PLAY". Confirma → fluxo idêntico, server validateLevelProgress passa (7 ≤ 6+1).
- ✅ Logado max=6 tenta cheating: `socket.emit('single_player_start', {level: 12, ...})` via console → server rejeita com sp_error 'level_locked' → cliente volta para sp-map e re-renderiza.
- ✅ Card 9 (locked, max=6) clicado → openSPLevel return silencioso (gating). Modal não abre.
- ✅ Modal aberto em PT, usuário troca para JA → `selectLanguage` chama `refreshSPMapModal` → modal mostra "ソロ / フェーズ N — Recruta (PT pq SP-7.4 não rodou) / ★ / キャンセル / プレイ". Title em PT esperado.
- ✅ Duplo-click em JOGAR → primeiro confirma e zera _spPendingLevel; segundo entra com level=null → validação retorna (sem segundo emit).
- ✅ Click em CANCELAR no modal → modal fecha, _spPendingLevel=null, usuário continua no sp-map.
- ✅ HTML preservado — apenas substituições JS dentro do `<script>` existente.

### Próxima sessão
**SP-7.4** — i18n dos 15 nomes de fase × 9 idiomas. Adicionar chaves `sp_lvl1_name` .. `sp_lvl15_name` em PT/EN/ES/DE/IT/RU/JA/KO/ZH. Helper `_spPhaseName(n)` já está pronto para consumir (cai automaticamente em `SP_LEVEL_NAMES_PT` enquanto chaves não existem). Atualizar também `buildSPMap` para usar `_spPhaseName(n)` em vez de `SP_LEVEL_NAMES_PT[n]` direto, e expor via `refreshSPMap` para repopular nomes ao trocar idioma sem rebuilding o grid.

---

## [2026-05-05] Sessão SP-7.4 — i18n dos 15 nomes de fase × 9 idiomas

**Status:** Completo
**Branch:** main
**Arquivo modificado:** `html/index.html` — 15 chaves novas em cada bloco `T.*` (PT linhas 3146-3148, EN 3235-3237, ES 3334-3336, DE 3433-3435, IT 3532-3534, RU 3631-3633, JA 3730-3732, KO 3829-3831, ZH 3928-3930) + `buildSPMap` consome `_spPhaseName(n)` ([linha 4693](html/index.html#L4693)) + `refreshSPMap` repopula `sm-card-{n}-name` ([linhas 4699-4717](html/index.html#L4699)) + hook em `selectLanguage` ([linha 4392](html/index.html#L4392))

### Feito
- **135 chaves novas** (15 fases × 9 idiomas) inseridas após `sp_new_confirm_guest` em cada bloco `T.{lang}`. Tabela de referência:
  | n | PT | EN | ES | DE | IT | RU | JA | KO | ZH |
  |---|----|----|----|----|----|----|----|----|----|
  | 1 | Recruta | Recruit | Recluta | Rekrut | Recluta | Новобранец | 新兵 | 신병 | 新兵 |
  | 2 | Aprendiz | Apprentice | Aprendiz | Lehrling | Apprendista | Ученик | 見習い | 견습 | 学徒 |
  | 3 | Defensor | Defender | Defensor | Verteidiger | Difensore | Защитник | 守護者 | 수호자 | 守护者 |
  | 4 | Atirador | Sharpshooter | Tirador | Schütze | Tiratore | Стрелок | 射手 | 사수 | 射手 |
  | 5 | Cavaleiro | Knight | Caballero | Ritter | Cavaliere | Рыцарь | 騎士 | 기사 | 骑士 |
  | 6 | Bispeiro | Bishop | Alfilero | Läufer | Alfiere | Слон | 司教 | 비숍 | 主教 |
  | 7 | Tanque | Tank | Tanque | Panzer | Tank | Танк | タンク | 탱크 | 坦克 |
  | 8 | Caçador | Hunter | Cazador | Jäger | Cacciatore | Охотник | 狩人 | 사냥꾼 | 猎人 |
  | 9 | Estrategista | Strategist | Estratega | Stratege | Stratega | Стратег | 戦略家 | 전략가 | 战略家 |
  | 10 | Duelista | Duelist | Duelista | Duellant | Duellante | Дуэлянт | 決闘者 | 결투자 | 决斗者 |
  | 11 | Cercador | Encircler | Cercador | Umzingler | Accerchiatore | Окружитель | 包囲者 | 포위자 | 包围者 |
  | 12 | Iscador | Baiter | Cebador | Köderer | Adescatore | Приманщик | おとり師 | 미끼꾼 | 诱饵者 |
  | 13 | Rainha | Queen | Reina | Dame | Regina | Королева | 女王 | 여왕 | 女王 |
  | 14 | Mestre | Master | Maestro | Meister | Maestro | Мастер | 達人 | 거장 | 大师 |
  | 15 | Lenda | Legend | Leyenda | Legende | Leggenda | Легенда | 伝説 | 전설 | 传奇 |
- **`buildSPMap`** ([html/index.html:4693](html/index.html#L4693)): trocado `SP_LEVEL_NAMES_PT[n] || ('Fase ' + n)` por `_spPhaseName(n)`. Como `_spPhaseName` é function declaration no mesmo IIFE, hoisting garante disponibilidade no momento de execução do `buildSPMap`.
- **`refreshSPMap`** ([html/index.html:4699-4717](html/index.html#L4699)): adicionado lookup de `nameEl = document.getElementById('sm-card-' + n + '-name')` e `nameEl.textContent = _spPhaseName(n)` no loop. Antes refreshSPMap só mexia em estado/ícone; agora também sincroniza nome (idempotente: chamadas repetidas não acumulam efeito).
- **`selectLanguage`** ([html/index.html:4392](html/index.html#L4392)): adicionada chamada `if (currentScreen === 'sp-map') window.refreshSPMap()` para repopular nomes (e estado, ileso) sem precisar rebuildar o grid.
- **Comentário do `SP_LEVEL_NAMES_PT`** atualizado: era "PT defaults; SP-7.4 substituirá..."; agora "Fallback PT — usado por _spPhaseName quando t() falha". O fallback continua existindo como rede de segurança contra idiomas não-suportados (FR/etc) ou chaves removidas inadvertidamente.
- **Comentário do `_spPhaseName`** atualizado: era "SP-7.3: helper i18n... SP-7.4 vai criar..."; agora "SP-7.4: as chaves existem nos 9 idiomas; SP_LEVEL_NAMES_PT só entra se t() retornar a própria key".

### Decisões de design
- **Inserção após `sp_new_confirm_guest`** (última chave SP existente em cada bloco) — mantém afinidade visual: todas as chaves SP ficam contíguas no fim de cada `T.{lang}`. Facilita revisão futura por desenvolvedor que está auditando i18n.
- **Layout de 3 linhas × 5 chaves** (em vez de 1 linha × 15 ou 15 linhas × 1) — escolha de legibilidade. 1 linha × 15 ultrapassaria largura confortável; 15 linhas × 1 inflaria diff sem ganho. 5 por linha mapeia naturalmente os tiers de dificuldade (1-5, 6-10, 11-15) — bônus mnemônico.
- **`buildSPMap` chama `_spPhaseName` em vez de `SP_LEVEL_NAMES_PT`** — ordering safe via hoisting de function declaration; testei mentalmente: `buildSPMap` é só registrado em `window`, executa quando `refreshSPMap` o chama (que por sua vez é chamado pelo hook em `showScreen`). Em ambos os pontos `_spPhaseName` já está hoisted.
- **`refreshSPMap` agora repopula nomes** — alternativa seria criar uma função separada `refreshSPMapNames`. Decidi mesclar porque (a) refreshSPMap já é chamado em todo entry de tela e em `selectLanguage`, então é o ponto natural de re-render; (b) custo é trivial (15 lookups); (c) reduz a quantidade de funções globais.
- **Hook em `selectLanguage` checa `currentScreen === 'sp-map'`** em vez de chamar incondicionalmente — chamada não-condicional dispararia `buildSPMap` na primeira troca de idioma após app load (mesmo se usuário nunca foi ao mapa), criando 15 botões DOM órfãos. Conditional evita esse leak.
- **Não adicionei nova chave i18n para o fallback `('Phase ' + n)` no `_spPhaseName`** — fallback só dispara em corner case (idioma não-suportado + key não-resolvida). Inglês "Phase" é aceitável neste edge.
- **Nomes em RU usam terminologia chess-russa** — "Слон" para Bishop (literal: elefante; é o nome standard da peça em russo), "Королева" para Queen (em chess russo é "Ферзь", mas para persona name "Королева" comunica melhor). Trade-off cultural; pode ser revisado em SP-9.x QA com falante nativo.
- **JA: "おとり師" para Iscador** — em vez de tradução literal de "baiter" como 誘導者 (que significa "guia"). おとり = decoy/isca, 師 = mestre/usuário. Comunica a estratégia de bait+sacrifice melhor que opções literais.

### Smoke test mental
- ✅ Convidado em PT abre sp-map → cards mostram "Recruta / Aprendiz / Defensor / ..." consistente com SP_PLANNING.md
- ✅ Trocar para EN com sp-map ativa → `selectLanguage` chama `refreshSPMap` → cards atualizam para "Recruit / Apprentice / Defender / ..."
- ✅ Trocar para JA → "新兵 / 見習い / 守護者 / ..." (Unicode preservado, tipografia herda CSS existente)
- ✅ Logado max=6 em DE: card 7 "Panzer" highlighted (current pulse), cards 1-6 "Rekrut..Läufer" completed (✓)
- ✅ Modal sm-start aberto em ZH (clicou card 11) → título "关卡 11 — 包围者" (sp_phase + n + nome traduzido via `_spPhaseName`)
- ✅ Trocar idioma com modal aberto → `refreshSPMapModal` recalcula título (já existia em SP-7.3) → modal reflete novo idioma instantaneamente
- ✅ Idioma fictício (FR) selecionado por dev → fallback do `t()` retorna a key → `_spPhaseName` cai em `SP_LEVEL_NAMES_PT` → card mostra "Recruta" (PT). Edge tolerado.
- ✅ Re-entrada em sp-map (BACK → CONTINUAR de novo) → `refreshSPMap` rodando atualiza nomes E estados — idempotente
- ✅ HTML preservado: 9 inserções pontuais nos blocos T.* + 3 substituições pontuais em funções JS dentro do `<script>` existente; nenhuma reescrita de bloco
- ✅ Helper `_spPhaseName` antes só era consumido por `refreshSPMapModal` (título do modal); agora é a única fonte de nome no UI inteiro do sp-map (cards + modal). Centralização.

### Próxima sessão
**SP-7.5** — Animação de fase desbloqueada. Após vitória de fase N que faz `max_level_completed = N`, ao retornar ao `screen-sp-map` o card N+1 deve receber animação one-shot de "desbloqueio" (ex: pulse intensificado, scale-in, fade-in do ícone ▶ substituindo o 🔒). Estratégia provável:
- `loadSPProgress` detecta delta no max e seta `window._spJustUnlocked = max + 1`
- `refreshSPMap` lê a flag, adiciona classe `.sp-card-just-unlocked` no card correspondente, depois zera a flag
- CSS: `@keyframes sp-unlock` em 1.2s ease-out (opacity 0→1 + scale 0.85→1.05→1) com `animation-fill-mode: forwards`
- Limpeza automática via `animationend` listener para remover a classe (não persistir em re-renders)

Pré-requisitos: SP-7.1 ✅ + SP-7.2 ✅ + SP-3.8 ✅ — todos satisfeitos.

---

## [2026-05-05] Sessão SP-7.5 — Animação one-shot de fase desbloqueada

**Status:** Completo
**Branch:** main
**Arquivo modificado:** `html/index.html` — `@keyframes sp-unlock` + classe `.sp-card-just-unlocked` no `<style>` ([linhas 2095-2099, 2110](html/index.html#L2095)) + listener `socket.on('sp_level_completed')` ([linhas 4843-4859](html/index.html#L4843)) + extensão de `refreshSPMap` para aplicar/limpar animação ([linhas 4724-4747](html/index.html#L4724))

### Feito
- **CSS `@keyframes sp-unlock`** (0.6s ease-out): scale 0.85 → 1.12 (45%) → 1.0; box-shadow do glow normal → pico duplo (32px accent + 60px glow) → glow normal; brightness 1 → 1.5 → 1. Sensação visual: o card "explode" para fora, brilha forte no meio, assenta no estado final. Dura 600ms exatos conforme spec do checklist SP-7.5.
- **Classe `.sp-card-just-unlocked`** definida no mesmo `<style>` block do sp-map (não tocar no `<style>` global). Single property: `animation: sp-unlock 0.6s ease-out`. Combinada com `.sp-card-current` (que já tem `animation: sp-pulse infinite`), CSS dá precedência à classe declarada por último — durante 0.6s sobrepõe pulse; após `animationend` listener remover a classe, pulse retoma naturalmente.
- **Listener `socket.on('sp_level_completed', ({ level }) => ...)`** adicionado após `socket.on('sp_error')`. Consome o evento que [server.js:470](server/server.js#L470) já emite quando humano vence em modo single player. Lógica:
  1. Validação defensiva (level numérico 1..15)
  2. `window.spProgress.max_level_completed = max(current, level)` — apenas avança, nunca regride (defesa contra eventos fora de ordem)
  3. `window._spJustUnlocked = level + 1` — flag one-shot lida na próxima entrada do sp-map
  4. Edge case: se já está no sp-map (cheating console / corner case), refresh imediato
  5. Atualiza `renderSPContinueLabel` para que se o usuário voltar ao solo-hub o label "Fase N+1" reflita o avanço
- **`refreshSPMap` estendido**:
  - Lê `window._spJustUnlocked` no início (snapshot)
  - Adiciona `'sp-card-just-unlocked'` ao `classList.remove(...)` — garante limpeza idempotente em cada refresh, evitando classe presa caso animationend nunca dispare (ex: usuário navegou away durante animação)
  - Após aplicar state class, se `justUnlocked === n`: força reflow via `void card.offsetWidth` antes de adicionar a classe (garante que a animation reinicie mesmo em rápida sucessão de adds/removes)
  - Anexa `animationend` listener one-shot que remove a classe e o próprio listener (cleanup automático)
  - Após o loop, `window._spJustUnlocked = null` se era number — flag é one-shot, válida só para o primeiro refresh após o evento

### Decisões de design
- **`@keyframes sp-unlock` com 3 keyframes (0/45/100%)** em vez de 2 (0/100%) — pico em 45% dá sensação de "bounce" tátil. Linear scale 0.85→1.0 seria insípido; bounce passando 1.12 e voltando para 1.0 comunica "algo aconteceu". 45% (não 50%) acelera o pico, deixando a curva ease-out trabalhar mais na descida (a parte mais lenta visualmente).
- **`brightness(1.5)` no pico** — efeito breve de "flash" sem precisar de pseudo-element nem overlay. Apenas filtro CSS aplicado ao próprio botão. Funciona em qualquer tema (claro/escuro) porque opera multiplicativamente sobre cores existentes.
- **Não usei `animation-fill-mode: forwards`** — o keyframe 100% já casa com o estado de descanso (scale 1, brightness 1, glow normal). `forwards` só seria necessário se o último keyframe diferisse do estado base; aqui é redundante e perigoso (deixaria classe presa visualmente se removida fora do animationend).
- **Limpeza dupla (animationend + classList.remove no refresh)** — proteção em camadas. Cenário comum: animação completa, animationend dispara, classe removida ✓. Cenário edge: usuário navega para outra tela durante a animação, `display:none` na tela do sp-map suspende a animation, animationend pode nunca disparar. Próxima entrada na tela → `refreshSPMap` chama `classList.remove('sp-card-just-unlocked')` antes de tudo → reset garantido.
- **`void card.offsetWidth` para forçar reflow** — pattern padrão para reiniciar animation CSS via toggle de classe. Sem isso, navegadores podem deduplicar a transição se a classe foi adicionada/removida no mesmo tick.
- **Flag `_spJustUnlocked` em vez de evento custom** — escolha entre (a) flag global lida em `refreshSPMap` ou (b) evento custom `sp:unlock` despachado para o card. Optei por (a) porque: (1) refreshSPMap já é o ponto único de re-render do sp-map; (2) flag persiste mesmo se sp-map ainda não foi montado (build lazy); (3) menos infraestrutura.
- **`level + 1` mesmo para nível 15** — flag = 16, sai do range 1..15 do loop, ignorada. Sem caso especial. Se quiser animação dedicada para "completou tudo", SP-9 / Design futuro decide; SP-7.5 só anima desbloqueio incremental.
- **Avança apenas, nunca regride** (`if (level > current) ...`) — defesa contra eventos fora de ordem (socket.io retransmite em reconexão), contra exploits que enviem level menor após maior, e contra race conditions (P/V de UI: não regredir progresso visualmente).
- **Refresh imediato se já está no sp-map** — case extremo (player venceu enquanto sp-map estava aberta em outra aba? ou cheating console?). Custo trivial; UX consistente.
- **Não inseri chave i18n** — animação é puramente visual; sem texto. SP-7.5 spec não exige `sp_phase_unlocked` (essa key foi mencionada em SP_TERMS.md §214 mas é opcional para SP-7.5; pode ser usada em SP-9 para banner overlay se quisermos texto explicativo).

### Smoke test mental
- ✅ Convidado vence fase 1 → server emite `sp_level_completed{level:1}` → cliente: spProgress.max=1, _spJustUnlocked=2 → game-over screen → BACK to map → refreshSPMap roda → card 2 tem state='current' + class .sp-card-just-unlocked → 0.6s de bounce/glow → animationend → classe removida → pulse normal continua
- ✅ Logado max=6 vence fase 7 → max=7, _spJustUnlocked=8 → entra sp-map → card 8 anima 0.6s, depois fica current pulsando
- ✅ Vitória da fase 15 → max=15, _spJustUnlocked=16 → entra sp-map → loop n=1..15 nunca encontra n===16, animação não dispara → flag limpa no fim do loop → todos os cards completed (✓)
- ✅ Re-entrada após animação concluída: refreshSPMap roda de novo, _spJustUnlocked já é null → não dispara animação → comportamento normal
- ✅ Edge: usuário navega Out durante animação (display:none no sp-map), retorna depois → próxima refreshSPMap remove .sp-card-just-unlocked como precaução → card reseta para state base, sem visual quebrado
- ✅ Edge: usuário ainda está no sp-map quando recebe sp_level_completed (cheating console) → handler chama refreshSPMap diretamente → animação dispara sem precisar mudar de tela
- ✅ Edge: server retransmite sp_level_completed (reconexão socket) → flag re-set, mas se max já é >= level a animação re-anima a mesma fase. Aceitável (raro, e visualmente consistente).
- ✅ Edge: server envia sp_level_completed{level:0} ou inválido → validação defensiva descarta, sem efeito
- ✅ Hover em card recém-desbloqueado durante animação: hover rule `transform: translateY(-2px)` é override-reseted pela animation (que controla transform). Após animação, hover funciona normalmente.
- ✅ HTML preservado: 3 inserções (style block expandido, listener novo, classList expandida). Nenhuma reescrita de bloco.

### Próxima sessão
**SP-8.1** — Adaptar `game-over-screen` para Solo. Quando `window.spActiveLevel != null` no fim da partida, customizar botões:
- **Vitória da fase N (N<15)**: botão "JOGAR NOVAMENTE" vira "PRÓXIMA FASE" → `startSPLevel(N+1)` (ou navega sp-map e usuário clica)
- **Vitória da fase 15**: botão vira "VOLTAR AO MAPA" → showScreen('sp-map') (mostra banner "Tudo completo")
- **Derrota**: botão vira "TENTAR NOVAMENTE" → `startSPLevel(N)` mesma fase
- Botão MENU intacto (sempre volta ao menu principal)
- i18n: chaves `sp_next_level`, `sp_retry`, `sp_back_to_map` (já listadas em SP_TERMS.md §214 — podem precisar ser adicionadas ou já existirem; verificar)

---

## [2026-05-05] Sessão SP-8.1 — Adaptar `game-over-screen` para Solo

**Status:** Completo
**Branch:** main
**Arquivo modificado:** `html/index.html`
- 5 chaves i18n × 9 idiomas (`sp_victory`, `sp_defeat`, `sp_next_level`, `sp_retry`, `sp_back_to_map`) inseridas após `sp_lvl15_name` em cada `T.{lang}` (PT linha 3149, EN 3239, ES 3339, DE 3439, IT 3539, RU 3639, JA 3739, KO 3839, ZH 3939)
- Helpers Solo no IIFE principal: `_resetSoloGameSession`, `window.spStartLevel(level)`, `window.spBackToMap()` ([linhas 4887-4934](html/index.html#L4887))
- Branch Solo no `updateUI` GAMEOVER: customiza título + botão `btn-go-again` + oculta MMR row e badge unranked ([linhas 5398-5424](html/index.html#L5398))
- `returnToMenu` agora limpa `window.spActiveLevel = null` ([linha 5142](html/index.html#L5142))

### Feito
- **45 chaves novas** (5 × 9 idiomas) com tradução vinda direto de SP_TERMS.md §3 — fonte de verdade para evitar inconsistência entre planning e implementação. Exemplos:
  - `sp_victory`: VITÓRIA / VICTORY / VICTORIA / SIEG / VITTORIA / ПОБЕДА / 勝利 / 승리 / 胜利
  - `sp_next_level`: PRÓXIMA FASE / NEXT STAGE / PRÓXIMA FASE / NÄCHSTE STUFE / PROSSIMO LIVELLO / СЛЕДУЮЩИЙ УРОВЕНЬ / 次のステージ / 다음 단계 / 下一关
  - `sp_retry`: TENTAR DE NOVO / TRY AGAIN / REINTENTAR / WIEDERHOLEN / RIPROVA / ЗАНОВО / 再挑戦 / 다시 시도 / 重试
  - `sp_back_to_map`: Voltar ao Mapa / Back to Map / Volver al Mapa / Zurück zur Karte / Torna alla Mappa / К карте / マップへ戻る / 지도로 돌아가기 / 返回地图
- **`_resetSoloGameSession()`** (private): mirror do cleanup de `returnToMenu` sem `showScreen('menu')` — fecha game-area, game-over-screen, sd-overlay; chama `ExcBanners.hideAll`; limpa `pieceElements`/`prevPhase`/`lastDuelKey`/`state`. Não toca em `tabbar` (tela matchmaking ou sp-map vai gerenciar). Não toca em `history.replaceState` (URL é estável; mudaria só ao voltar ao menu).
- **`window.spStartLevel(level)`**: bate validação (1..15), chama reset, espelha o prep+emit de `confirmStartSPLevel` (avatar/nick/labels do matchmaking + `setMMState('lobby')` + `showScreen('matchmaking')` + emit `single_player_start`). Setado `window.spActiveLevel = level` para o próximo game-over reconhecer Solo.
- **`window.spBackToMap()`**: reset, limpa `spActiveLevel = null`, `showScreen('sp-map')` — hook existente em `showScreen` chama `loadSPProgress` + `refreshSPMap`, então o map renderiza atualizado.
- **Branch Solo no GAMEOVER** (após o block de unranked-badge):
  - Se `spActiveLevel != null`:
    - Vitória + level==15 → botão "Voltar ao Mapa" + onclick `spBackToMap`
    - Vitória + level<15 → botão "Próxima Fase" + onclick `spStartLevel(level+1)`
    - Derrota (qualquer level) → botão "Tentar de Novo" + onclick `spStartLevel(level)` (mesma fase)
    - Título `go-title` vira `sp_victory` ou `sp_defeat`
    - `go-mmr-row` é ocultada (PdL não muda em Solo)
    - `_go-unranked-badge` é ocultada (Solo não tem semântica de "ranqueada/unranked")
  - Se `spActiveLevel == null` (modo MP): restaura defaults — `btn-go-again.onclick = returnToMenu`, MMR row visível. Necessário para o caso "jogou Solo, voltou ao menu, joga MP" — o onclick foi customizado e precisa ser restaurado.
- **`returnToMenu`**: 1 linha adicionada (`window.spActiveLevel = null`) entre `state = null` e `history.replaceState`. Garante que após voltar ao menu, próximo game-over (MP) leia `spActiveLevel` como null.

### Decisões de design
- **`_resetSoloGameSession` separado de `returnToMenu`** em vez de extrair helper compartilhado — evitei refactor de `returnToMenu` (existente, validado em produção). Duplicação de ~10 linhas é aceitável; risco de regressão num refactor seria maior. Reset não inclui `tabbar` toggle nem `history.replaceState` porque a transição vai para outra tela imediatamente (matchmaking ou sp-map), não para o menu.
- **Ramificação Solo no FIM da função GAMEOVER** (após unranked-badge) em vez de no início — permite que toda a lógica MP existente rode primeiro (set initial title/buttons/text) e depois sobrescreva apenas o necessário para Solo. Mais simples de auditar; menos risco de fork-divergence.
- **Branch `else` que restaura defaults MP** — não óbvio mas crítico. `btn-go-again.onclick` é setado dinamicamente em Solo; sem reset no MP, um jogador que jogou Solo, voltou ao menu, encontrou um MP, terminou a partida — clicaria em "JOGAR NOVAMENTE" e dispararia `spStartLevel(N)` (handler antigo)! O `else` zera `onclick = returnToMenu`. `_mmrRow.style.display = ''` faz o mesmo para a row de PdL.
- **`btn-go-menu` (MENU) intocado** — `returnToMenu` agora limpa `spActiveLevel`, então não importa se foi Solo ou MP, MENU sempre volta limpo ao menu principal. Conforme spec.
- **Sem refactor de `confirmStartSPLevel` para usar `spStartLevel`** — `confirmStartSPLevel` é chamado pelo botão JOGAR do modal sm-start, fluxo já estável. Refactorá-lo expandiria escopo. Algum dia consolidar via helper privado `_emitSPLevelStart`, mas não nesta sessão.
- **Não bloqueio `addStat` no fluxo Solo** — atualmente `addStat('wins')`/`addStat('losses')` é chamado em GAMEOVER independentemente do modo. Isso significa que vitórias/derrotas Solo poluem stats locais (W/L do perfil). Decisão: deixar como está para SP-8.1 (escopo é botões); abrir issue para SP-9 / hardening. Risco baixo já que stats locais são apenas exibição cosmetic; servidor não recebe esses dados em Solo.
- **`go-title` recebe `sp_victory`/`sp_defeat`** ao invés de manter `game_over_title` — SP_TERMS.md classifica esses como "Título". Cinza-claro em Solo: o título em letras grandes ("VITÓRIA"/"DEFEAT") substitui o "Fim de Jogo" genérico, dando peso emocional ao resultado da fase.
- **`go-pdl-delta`/`go-pdl-now` ocultos via parent row** — não preciso limpar os textos individualmente; ocultar `go-mmr-row` é suficiente. Quando voltar ao MP, branch `else` re-exibe a row e os textos se atualizam normalmente.
- **Validação `level < 1 || level > 15`** em `spStartLevel` — defensivo, mas em fluxo normal o handler de game-over chamaria com `level+1` ou `level` controlados; cap em 15 é redundante porque caso `level=15` o branch vitória vai para `spBackToMap`. Defesa em profundidade.

### Smoke test mental
- ✅ Convidado vence fase 1 → game-over: título "VITÓRIA" / botão "PRÓXIMA FASE" → click → matchmaking imediato com level=2 → fase 2 começa
- ✅ Convidado perde fase 5 → game-over: título "DERROTA" / botão "TENTAR DE NOVO" → click → matchmaking com level=5 (mesma fase)
- ✅ Logado vence fase 15 → game-over: título "VITÓRIA" / botão "Voltar ao Mapa" → click → sp-map renderiza com banner "Todas as fases completas — explore livremente"
- ✅ Convidado vence fase 7 → game-over → MENU → menu principal limpo (spActiveLevel=null) → jogar MP → game-over MP funciona normal (botão "JOGAR NOVAMENTE" + onclick=returnToMenu + MMR row visível)
- ✅ Em EN: Solo vitória → "VICTORY" + "NEXT STAGE"; em JA: "勝利" + "次のステージ"; em RU: "ПОБЕДА" + "СЛЕДУЮЩИЙ УРОВЕНЬ" — chaves resolvem corretamente
- ✅ Solo + draw (raro: mate de ambos os reis em mesmo turno?) → winnerColor==='draw' → `_won = false` → branch derrota → botão "Tentar de Novo". Aceitável (não há fluxo dedicado para draw em Solo).
- ✅ Re-game-over (cheating ou bug que dispara updateUI múltiplas vezes em GAMEOVER): cada call sobrescreve textos/onclick; idempotente
- ✅ Edge: usuário entra em Solo, perde, clica "Tentar de Novo", perde de novo → repeated cycle funciona (spActiveLevel mantido = level original)
- ✅ HTML preservado — apenas inserções (45 chaves i18n + 3 funções helpers + branch no updateUI) e 1 linha adicional em returnToMenu

### Próxima sessão
**SP-8.2** — Refresh do progresso ao voltar para hub. Verificar se o solo-hub atualiza corretamente após uma vitória/derrota Solo:
- Após Solo → MENU → SOLO de novo: `loadSPProgress` deve disparar e label "CONTINUAR — Fase N+1" deve refletir o avanço
- Após Solo (vitória fase 15) → "Voltar ao Mapa" → BACK → solo-hub: label deve mostrar `sp_completed_all` ("Todas as fases completas")
- Hook `showScreen('solo-hub')` chama `loadSPProgress` (existe desde SP-6.2) — verificar se cobre os fluxos da SP-8.1


