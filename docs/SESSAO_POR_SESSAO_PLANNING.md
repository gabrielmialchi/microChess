# microChess — Roadmap v1.2.x (Pós 1º Open Test)
## Revisado em 2026-06-18 — ciclo v1.2.x concluído; agora polimento

---

## Como ler este plano

Sessões **curtas e independentes** (sem dependência de implementação entre si — podem ser
feitas em qualquer ordem). **Prioridade:** 🅿0 crítico · 🅿1 importante · 🅿2 depois.
**Risco:** 🟢 baixo · 🟡 médio · 🔴 alto. **Arquivos:** `[F]` frontend · `[S]` servidor · `[DB]` banco · `[D]` design.

> Regras do projeto: **nunca reescrever** `server.js`/`index.html` por completo (só inserir
> blocos); lógica nova em arquivos separados; CSS novo inline; retrocompatibilidade com
> convidado.

---

## ✅ Concluído

**Ciclo v1.2.x (S01–S35 + fixes pós-teste)** arquivado em
[`_arquivo/docs/SESSAO_POR_SESSAO_PLANNING_concluido.md`](../_arquivo/docs/SESSAO_POR_SESSAO_PLANNING_concluido.md).
Detalhes por data em `docs/ACTIVITY_LOG.md`.

---

## Operacional (não é sessão de código)
- **OP-1 — Limpar base de usuários** `[DB]`: script one-shot para zerar contas, **só na
  véspera do próximo teste**, com `/api/admin/export` de backup antes.

---

## ⏳ Pendente de decisão

### S26 — Rebalance do draft / valor das peças `[S][D]` 🟡 🅿2 — fecha OT-06
- [ ] Revertido 2026-06-18: promoção volta a P→Q. Dado de 52,7% é especulativo; aguardar
      confirmação com playtest controlado antes de aplicar fix.

---

# POLIMENTO — sessões curtas independentes

## ✅ S36 — Botão Abandonar no canto superior direito `[F]` 🟢 🅿1
- [x] Quadrado vermelho (`--mc-danger`) com X branco no canto sup. dir. do `#top-bar` (agrupado com `#opp-pts`).
- [x] Removido o botão de texto sob o PRONTO; confirmação e fluxo WO/cancel/solo mantidos.
- [x] Fica atrás do game-over (stacking de `#game-area` z1) — some na partida encerrada.

## ✅ S37 — Tipo de duelo na tela de dados `[F]` 🟢 🅿1
- [x] `#duel-status` mostra o tipo (Disputa de Espaço / Desempate / Defesa do Rei / Captura do Rei / Morte Súbita).
- [x] Derivado de `state.duel` no cliente (`duelKindLabel`) — sem mudança no servidor. Keys nos 9 idiomas. Tutorial também rotula.

## 🟡 S38 — Auditoria de localização (i18n) `[F]` 🟢 🅿1 — PARCIAL
- [x] Reportados corrigidos: `#set-tutorial-label` (key `play_tutorial` 9 idiomas + `refreshSettingsScreen`); `#tut-skip-btn`/`#tut-skip-confirm` (`TUT_TXT` + `_tutApplyI18n`).
- [ ] **Sweep pendente — overlays in-game hardcoded** (precisam de keys nos 9 idiomas + entrar no `refreshOverlays`):
  - `#inactivity-self-popup` ("INATIVO POR MAIS DE 60 SEGUNDOS", VOLTAR, ABANDONAR)
  - `#inactivity-opp-popup` ("OPONENTE INATIVO", "AGUARDANDO AÇÃO", VOLTAR)
  - `#return-to-game-popup` ("RETORNAR AO JOGO?", sub, SIM/NÃO)
  - `#abandon-confirm-popup` ("ABANDONAR PARTIDA?", sub, SIM — ABANDONAR, CANCELAR)
  - `#game-cancelled-overlay` ("PARTIDA CANCELADA", sub)
  - `#exc-leave-overlay` ("Sair da partida?", aviso de W.O.)
- [ ] Conferir `screen-how-to-play` e outros textos estáticos com varredura `grep` de acentuação.

## ✅ S39 — Replay melhorado `[F]` 🟡 🅿2
- [x] Removido o botão AUTO; só PREV/NEXT.
- [x] Duelos viram **passos navegáveis** com sobreposição (dados + tipo). `buildDuelSnapshot` ganhou `duelType`.
- [x] Sequência: `[Posição] → [Turno 1] → [Duelo 1 · Tipo] → [Turno 2] → …`. Reusa os dados já gravados.

---

## Backlog (não comprometido — avaliar)
- [ ] OT-23 — Boss a cada 10 níveis no solo (conteúdo).
- [ ] Localização completa do tutorial (es/de/it/ru/ja/ko/zh) — `docs/TUTORIAL_L10N_PLAN.md`.

---

## Critério de conclusão por sessão
- [ ] Itens commitados (commits pequenos).
- [ ] `node --check server/server.js` passa; blocos `<script>` sem erro de sintaxe; sem regressão.
- [ ] Registrar no `ACTIVITY_LOG.md` e em `TESTES_PENDENTES.md`.
- [ ] Validação do Gabriel.
