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

## [2026-06-09] ADJ-JUICE — Feedback/Juice de timing
**Status:** 🔄 Em andamento — ADJ-JUICE-A, B ✅ (branch `adj-juice`); C/D pendentes

### Feito — ADJ-JUICE-A (juice de combate, branch `adj-juice`)
- **J5** impacto de captura: `board-shake` no `.board-container` ao capturar.
- **J6** Morte Súbita: `sd-round-pop` no status ao trocar de rodada.
- **J1** revelação por turno: `reveal-snap` (pulso de brilho) em `#pieces-layer` ao resolver Ação.
- **J7** beat pós-duelo: segura o resultado ~800ms antes de revelar o tabuleiro (queixa do Gabriel).

### Feito — ADJ-JUICE-B (recompensa/fim, branch `adj-juice`)
- **J3** promoção→Rainha: flash dourado (`piece-promote`) ao detectar P→Q no syncBoard.
- **J8** fim de partida: `syncBoard()` anima o rei caindo (+shake) e segura ~850ms antes da tela de fim.

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
