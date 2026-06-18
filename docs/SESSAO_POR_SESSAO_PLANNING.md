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

## ⏳ S36 — Botão Abandonar no canto superior direito `[F]` 🟢 🅿1
**Objetivo:** tirar o "ABANDONAR PARTIDA" de baixo do PRONTO e encaixá-lo na UI como um
ícone de saída claro.
- [ ] Mover o gatilho de abandono para o **canto superior direito** da tela de partida.
- [ ] **Quadrado vermelho** (seguir paleta `--mc-danger`/design do jogo) com um **X branco** no centro.
- [ ] Manter a confirmação existente (`#abandon-confirm-popup`) e o fluxo de WO/cancel/solo.
- [ ] Remover/ocultar o antigo `#btn-abandon` de texto sob o PRONTO.
- [ ] Garantir que não conflite com o botão de emoji (também no canto) — posicionar lado a lado.

## ⏳ S37 — Tipo de duelo na tela de dados `[F][S]` 🟢 🅿1
**Objetivo:** o `#duel-status` mostra o **tipo do duelo** em vez de "CONFLITO!".
- [ ] Tipos (i18n nos 9 idiomas):
  - **Disputa de Espaço** — duas peças movem para a mesma casa (`frontal`).
  - **Desempate** — bônus iguais disputando Reis opostos (`contested_king`).
  - **Defesa do Rei** — peça defende o Rei atacado (duelo de defesa do par interceptação).
  - **Captura do Rei** — uma peça ataca o Rei diretamente (`attack` contra K).
  - **Morte Súbita** — `suddenDeath`.
  - *(Captura simples não abre tela de dados — é auto-captura; não precisa de rótulo.)*
- [ ] Servidor anexa um `duelKind` a cada item do `duelQueue`/`state.duel` (fonte única).
- [ ] Cliente mapeia `duelKind` → string traduzida no `#duel-status` (mantém "MORTE SÚBITA" para SD).

## ⏳ S38 — Auditoria de localização (i18n) `[F]` 🟢 🅿1
**Bug reportado:** ao trocar o idioma, "JOGAR TUTORIAL" (Config) e "PULAR" (tutorial +
confirmação) seguem em PT. Vários textos estão hardcoded.
- [ ] Corrigir os reportados: `#set-tutorial-label`, `#tut-skip-btn`, `#tut-skip-confirm`
      (título/sub/botões) — passar para `t()`/`TUT_TXT` e re-renderizar em `selectLanguage`.
- [ ] **Varredura profunda:** localizar todo texto hardcoded em `html/index.html` (e `*.js`)
      que deveria usar `t()`; listar e migrar.
- [ ] Garantir que `selectLanguage(lang)` re-renderiza os textos do tutorial e dos overlays
      que não passam por `updateUI()`.
- [ ] Tutorial: completar `TUT_TXT` se algum passo ainda cair em fallback indevido.

## ⏳ S39 — Replay melhorado `[F]` 🟡 🅿2
**Objetivo:** navegação turno a turno mais clara, com os duelos visíveis.
- [ ] **Remover o botão AUTO**; manter apenas **PREV** e **NEXT**.
- [ ] Inserir **passos de duelo** entre turnos: quando um turno teve duelo(s), exibir uma
      sobreposição com o **resultado dos dados** + o **tipo do duelo** (reusa S37).
- [ ] Linha de navegação conceitual:
      `[T0] → [T1] → [Duel1 : Tipo] → [T2] → [Duel2 : Tipo] → [T3] …`
- [ ] Usar os dados já gravados no replay (`type: 'duel'`, `buildDuelSnapshot`) — sem novo backend.

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
