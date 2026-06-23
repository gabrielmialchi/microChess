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

## 🟡 S38 — Auditoria de localização (i18n) `[F]` 🟢 🅿1 — reportados ✅
- [x] Reportados corrigidos: `#set-tutorial-label` (key `play_tutorial` 9 idiomas + `refreshSettingsScreen`); `#tut-skip-btn`/`#tut-skip-confirm` (`TUT_TXT` + `_tutApplyI18n`).
- [→] **Sweep dos overlays in-game** desmembrado nas sessões **S42 / S43 / S44** (abaixo).

## ✅ S39 — Replay melhorado `[F]` 🟡 🅿2
- [x] Removido o botão AUTO; só PREV/NEXT.
- [x] Duelos viram **passos navegáveis** com sobreposição (dados + tipo). `buildDuelSnapshot` ganhou `duelType`.
- [x] Sequência: `[Posição] → [Turno 1] → [Duelo 1 · Tipo] → [Turno 2] → …`. Reusa os dados já gravados.

---

# IDIOMAS — sessões curtas independentes

> **Regra de independência (i18n):** cada sessão que adiciona chaves novas ao objeto `T`
> deve adicioná-las a **todos os blocos de idioma que existirem naquele momento** (incluindo
> `fr`, se já criado). Assim as sessões podem ser feitas em **qualquer ordem** sem travar
> uma à outra. O `t()` cai para `en`→`pt` se faltar chave, então nada quebra no meio.

## ✅ S40 — Adicionar idioma Francês (fr) `[F][S]` 🟢 🅿1
- [x] Bloco `fr` completo no objeto `T` (226 chaves — verificado contra `pt`, nenhuma faltando).
- [x] Bandeira `.fi-fr` (CDN flag-icons).
- [x] `fr` em `_SUPPORTED_LANGS` (frontend) e `SUPPORTED` do `/auth/lang` (servidor).
- [x] Botão `data-lang="fr"` no seletor de Configurações.
- [~] `TUT_TXT.fr` não criado — tutorial cai para `pt` (aceitável; backlog).

## ✅ S41 — Seletor de idioma estilo emoji (expand inline) `[F]` 🟢 🅿1
- [x] Configurações: linha **"Idioma"** + botão `#lang-current-btn` com **bandeira + sigla** do idioma atual.
- [x] Clicar → expande inline o `#flag-grid` (lista de idiomas); escolher aplica `selectLanguage`, fecha e atualiza o botão.
- [x] Lista **gerada do array `_LANGS`** (1 entrada por idioma) — escalável; reusa `.dk-lang-btn`/`.dk-flag`/`.fi-*`.
- [x] Destaque do idioma atual mantido (`refreshSettingsScreen`); construção idempotente (`_built`).

---

# i18n OVERLAYS IN-GAME — sessões curtas independentes (sweep da S38)

> Cada uma: adicionar as chaves a **todos** os blocos de `T` + ligar no `refreshOverlays`
> (ou um `_refreshGameOverlays()` chamado também ao **abrir** cada popup, pois alguns não
> passam por `refreshOverlays`). Reusar chaves existentes onde fizer sentido (`yes`,`no`,`cancel`).

## ✅ S42 — i18n overlays de inatividade `[F]` 🟢 🅿1
- [x] `#inactivity-self-popup`: título + "VOLTAR (n)" (label separado do contador) + "ABANDONAR PARTIDA".
- [x] `#inactivity-opp-popup`: título + "AGUARDANDO AÇÃO" + "VOLTAR".
- [x] 5 chaves (`inactive_title`,`return_btn`,`abandon_match`,`opp_inactive_title`,`awaiting_action`) nos **10 idiomas**; aplicadas em `refreshOverlays` (init + `selectLanguage`).

## ✅ S43 — i18n overlays de abandono / cancelamento / sair `[F]` 🟢 🅿1
- [x] `#abandon-confirm-popup`: título + sub + "SIM — ABANDONAR" (CANCELAR reusa `cancel_action`).
- [x] `#game-cancelled-overlay`: título + sub.
- [x] `#exc-leave-overlay`: título + aviso de W.O./banimento + "Sair mesmo assim" / "Continuar jogando".
- [x] 9 chaves novas nos **10 idiomas**; aplicadas em `refreshOverlays`. Confirmado que os subtítulos não têm versão dinâmica (sem conflito).

## ✅ S44 — i18n popup retornar + varredura final `[F]` 🟢 🅿2
- [x] `#return-to-game-popup`: título + sub + "SIM (n)" (label/contador separados) + "NÃO" (reusa `yes`/`no`).
- [x] **Varredura:** corrigidos os gaps reais encontrados —
  - `#reconnect-overlay`: título (`reconnect_waiting`, faltava wiring) + eyebrow "Oponente desconectou".
  - 5 `.sysmodal-eyebrow` (ban/logout/excluir/senha/reconexão) — antes sem id/i18n.
  - Matchmaking: "Prepare sua estratégia" (`mm-prepare-sub`) nos 3 setters do countdown.
  - Créditos: `#crd-thanks-text` (wired em showScreen + selectLanguage).
- [x] 9 chaves novas (`rtg_title/_sub`, 5 `eyebrow_*`, `prepare_strategy`, `credits_thanks`) nos **10 idiomas**; aplicadas em `refreshOverlays`/setters.
- [~] Resíduos cosméticos restantes são apenas **valores iniciais** de HTML sobrescritos por `refresh*`/setters (ex: `#btn-pr-copy-text`) — sem gap funcional.

---

# TUTORIAL — localização dos idiomas faltantes (`TUT_TXT`)

> Plano detalhado (49 chaves, regras de tradução, processo) em `docs/TUTORIAL_L10N_PLAN.md`.
> `pt`+`en` prontos. Cada sessão adiciona blocos completos ao `TUT_TXT` (independentes,
> qualquer ordem; `_tt` cai para `pt` até o idioma existir). Reusam os rótulos de duelo de `T`.

## ✅ S45 — Tutorial: romanas (fr + es + it) `[F]` 🟢 🅿2
- [x] Blocos `fr`, `es`, `it` adicionados ao `TUT_TXT` (49 chaves cada; `fr` fecha a lacuna da S40).
- [x] Apóstrofos escapados (fr/it); tags `<b>`, `▸`, `→` preservadas.
- [x] Sintaxe OK; paridade de chaves com `en` verificada por script (0 faltando, 0 extra).

## ✅ S46 — Tutorial: de + ru `[F]` 🟢 🅿2
- [x] Blocos `de`, `ru` adicionados ao `TUT_TXT` (49 chaves cada).
- [x] Sintaxe OK; paridade de chaves com `en` (0 faltando/extra). `<b>`/`▸`/`→` preservados.
- [~] Comprimento (de/ru): conferir em mobile 360px no QA manual (T-S46-1).

## ✅ S47 — Tutorial: CJK (ja + ko + zh) `[F]` 🟡 🅿2
- [x] Blocos `ja`, `ko`, `zh` adicionados ao `TUT_TXT` (49 chaves cada). **TUT_TXT agora com 10 idiomas completos.**
- [x] Sintaxe OK; paridade de chaves com `en` (0 faltando/extra). `<b>`/`▸`/`→` preservados.
- [⚠] **Marcado para revisão humana** antes de teste público (termos de xadrez CJK variam por comunidade).

---

## Backlog (não comprometido — avaliar)
- [ ] OT-23 — Boss a cada 10 níveis no solo (conteúdo).

---

## Critério de conclusão por sessão
- [ ] Itens commitados (commits pequenos).
- [ ] `node --check server/server.js` passa; blocos `<script>` sem erro de sintaxe; sem regressão.
- [ ] Registrar no `ACTIVITY_LOG.md` e em `TESTES.md`.
- [ ] Validação do Gabriel.
