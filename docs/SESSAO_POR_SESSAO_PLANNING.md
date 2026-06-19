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

## ⏳ S40 — Adicionar idioma Francês (fr) `[F][S]` 🟢 🅿1
**Objetivo:** 10º idioma do jogo.
- [ ] Novo bloco `fr` completo no objeto `T` (`html/index.html`) — traduzir **todas** as chaves existentes (inclui as novas de S37: `duel_space/duel_tiebreak/duel_king_defense/duel_king_capture`; `play_tutorial`; e as de S42–S44 se já existirem).
- [ ] Bandeira: adicionar `.fi-fr` ao CSS de flag-icons (linha ~17–27) apontando para `fr.svg` do mesmo CDN.
- [ ] Registrar `fr` em `_SUPPORTED_LANGS` (frontend) e no `SUPPORTED` do endpoint `/auth/lang` (`server/server.js`).
- [ ] Adicionar o idioma ao seletor de Configurações (botão `data-lang="fr"` — ou ao novo seletor da S41, se já feito).
- [ ] (Opcional) `TUT_TXT.fr` no tutorial; sem ele, cai para `pt` — aceitável até completar.
- [ ] Conferir: trocar para FR cobre menu, perfil, ranking, partida e duelo.

## ⏳ S41 — Seletor de idioma estilo emoji (expand inline) `[F]` 🟢 🅿1
**Objetivo:** trocar a grade fixa de bandeiras por um seletor compacto e escalável (igual ao
picker de emoji do Perfil), permitindo crescer o número de idiomas sem estourar a tela.
- [ ] Em Configurações: linha **"Idioma"** (tag) + **botão** mostrando **sigla + bandeira** do idioma atual (ex: `🇧🇷 PT`).
- [ ] Clicar no botão → **expande inline** a lista de todos os idiomas (sigla + bandeira), como o `#emoji-picker-inline`.
- [ ] Escolher um idioma → aplica (`selectLanguage`), fecha a lista e atualiza o botão.
- [ ] Reusar o estilo `.dk-flag`/`.fi-*` existente; manter destaque do idioma atual.
- [ ] Escalável: a lista é gerada a partir de um array de idiomas (não hardcoded por botão) — adicionar idioma novo = 1 entrada no array.
- [ ] Substitui/oculta a `.flag-grid`/`.dk-lang-btn` atual sem quebrar `selectLanguage`.

---

# i18n OVERLAYS IN-GAME — sessões curtas independentes (sweep da S38)

> Cada uma: adicionar as chaves a **todos** os blocos de `T` + ligar no `refreshOverlays`
> (ou um `_refreshGameOverlays()` chamado também ao **abrir** cada popup, pois alguns não
> passam por `refreshOverlays`). Reusar chaves existentes onde fizer sentido (`yes`,`no`,`cancel`).

## ⏳ S42 — i18n overlays de inatividade `[F]` 🟢 🅿1
- [ ] `#inactivity-self-popup`: "INATIVO POR MAIS DE 60 SEGUNDOS", botão "VOLTAR (n)" (palavra + contador), "ABANDONAR PARTIDA".
- [ ] `#inactivity-opp-popup`: "OPONENTE INATIVO", "AGUARDANDO AÇÃO", botão "VOLTAR".
- [ ] Chaves novas nos blocos de `T`; aplicar ao mostrar os popups (e em `selectLanguage`).

## ⏳ S43 — i18n overlays de abandono / cancelamento / sair `[F]` 🟢 🅿1
- [ ] `#abandon-confirm-popup`: "ABANDONAR PARTIDA?", sub, "SIM — ABANDONAR", "CANCELAR".
- [ ] `#game-cancelled-overlay`: "PARTIDA CANCELADA", sub.
- [ ] `#exc-leave-overlay`: "Sair da partida?", aviso de W.O./banimento.
- [ ] Chaves novas + aplicação ao mostrar.

## ⏳ S44 — i18n popup retornar + varredura final `[F]` 🟢 🅿2
- [ ] `#return-to-game-popup`: "RETORNAR AO JOGO?", sub, "SIM (n)", "NÃO".
- [ ] Varredura final: `grep` por acentuação/strings PT em `html/index.html` e `*.js`; migrar resíduos para `t()`.
- [ ] Conferir `screen-how-to-play` e textos estáticos de telas que não passam por um `refresh*`.

---

## Backlog (não comprometido — avaliar)
- [ ] OT-23 — Boss a cada 10 níveis no solo (conteúdo).
- [ ] Localização completa do tutorial (`TUT_TXT`: es/de/it/ru/ja/ko/zh/**fr**) — `docs/TUTORIAL_L10N_PLAN.md`.

---

## Critério de conclusão por sessão
- [ ] Itens commitados (commits pequenos).
- [ ] `node --check server/server.js` passa; blocos `<script>` sem erro de sintaxe; sem regressão.
- [ ] Registrar no `ACTIVITY_LOG.md` e em `TESTES_PENDENTES.md`.
- [ ] Validação do Gabriel.
