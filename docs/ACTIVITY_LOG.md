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

## [2026-06-09] ADJ-JUICE — Feedback/Juice de timing (PLANEJADO)
**Status:** ⏳ Planejado — plano detalhado em `SESSAO_POR_SESSAO_PLANNING.md`

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

> Histórico de sessões concluídas arquivado em [`_arquivo/docs/ACTIVITY_LOG_concluido.md`](../_arquivo/docs/ACTIVITY_LOG_concluido.md).
