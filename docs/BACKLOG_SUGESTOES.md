# microChess — Backlog de Sugestões (testar quando for conveniente)

> Itens **não-operacionais** herdados do ciclo pós-1º Open Test. Não bloqueiam o jogo e
> não estão comprometidos para nenhuma sessão. Ficam aqui como sugestões a validar via
> playtest quando fizer sentido.
>
> Contexto completo (análise cruzada feedback + dados, IDs OT-01..OT-26) arquivado em
> `_arquivo/docs/POS_OPEN_TEST_1_DIRETRIZES.md` — os outros 24 itens já foram implementados
> (ver `docs/ACTIVITY_LOG.md`).

---

## OT-06 — Domínio do Peão no draft

**Origem:** dados do 1º Open Test — no draft, Peão escolhido **52,7%** vs Torre **5,5%**
(concentração extrema).

**Situação atual:** tentativa de rebalance (sessão **S26**) foi **revertida em 2026-06-18**.
A promoção voltou a `P→Q`. O número de 52,7% foi considerado **especulativo** (amostra pequena,
jogadores sem tutorial na época, peças pouco legíveis no fundo escuro).

**Hipótese a esclarecer:** o Peão domina porque é **estratégia ótima real** ou porque era
**a opção mais barata/segura/legível** num contexto sem onboarding? Desde então já entraram
melhorias que podem ter mudado isso sozinhas:
- OT-15 (contorno das peças) ✅ — peças mais legíveis no draft.
- OT-04 (tutorial encenado) ✅ — jogador entende o valor de cada peça antes de comprar.

**Sugestão de teste (playtest controlado):**
1. Rodar um teste **com jogadores que já passaram pelo tutorial** e medir a distribuição
   de compras no draft (evento `draft_army` já é logado no servidor).
2. Comparar com os 52,7% originais.
3. **Critério de decisão:** se, mesmo com jogadores informados e peças legíveis, o Peão
   continuar > ~50%, então é desequilíbrio real → aplicar rebalance (ajuste de custo/bônus
   e/ou revisão da regra de promoção). Caso contrário, **fechar como falso positivo**.

**Mecânicas que um rebalance tocaria:** custo/bônus das peças, UI do draft, regra de promoção.

---

## OT-23 — Boss a cada 10 níveis no solo

**Origem:** sugestão no Forms do 1º Open Test (backlog de conteúdo solo).

**Situação atual:** não comprometido. Modo solo tem 15 fases lineares com bots de estilos
diferentes.

**Sugestão:** a cada 10 níveis (ex.: fase 10), uma **partida-boss** — encontro especial com
regra/composição distinta (ex.: exército fixo mais forte, ou modificador de regra) para criar
um marco de progressão.

**Sugestão de teste / avaliação:**
1. Tratar como **expansão de conteúdo**, depois do core estável — não antes.
2. Prototipar 1 boss (fase 10) e medir engajamento/retenção ao redor dela nos dados de solo.
3. Avaliar se justifica estender o padrão para as demais fases-marco.

**Mecânicas impactadas:** design de nível solo, IA do bot, possivelmente progressão/mapa SP.

---

## Como usar este documento
- Nada aqui exige ação imediata.
- Ao decidir testar um item, mova-o para o `SESSAO_POR_SESSAO_PLANNING.md` como sessão.
- Ao concluir/descartar, registre em `docs/ACTIVITY_LOG.md` e remova daqui.
