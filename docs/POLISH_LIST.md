# microChess — Lista de Polimentos e Game Feel

Este documento é a fila de polimentos do projeto. Não tem prioridade fixa — os itens são trabalhados
em sessões dedicadas após o sistema do jogo estar completo e operante.

**Como usar:** Quando encontrar um polimento necessário mas fora do momento oportuno, peça
"adiciona polimento: [descrição]" e ele será encaixado aqui. Quando for a hora de trabalhar
a lista, criaremos um plano de ação por sessão.

---

## Formato de Entrada

```
### P-XX — [NOME]
**Categoria:** Localização | Juicy | UI | Audio | Performance | Legal
**Esforço:** Baixo | Médio | Alto
**Impacto:** Baixo | Médio | Alto
**Descrição:** [o que deve ser feito]
**Contexto:** [onde no jogo, por que importa]
```

---

## Fila de Polimentos

### P-01 — Localização: Textos Não Localizados
**Categoria:** Localização
**Esforço:** Médio
**Impacto:** Alto
**Descrição:** Varredura completa de todas as telas para identificar textos hardcoded em apenas um idioma. Candidatos conhecidos: tela de RANKING (14 ranks com nomes em português), tela de LEADERBOARD, tela de HISTÓRICO DE PARTIDAS, overlays de ban/reconexão, tooltips e labels do board.
**Contexto:** O jogo tem suporte a PT/EN, mas diversas telas adicionadas nas sessões 7-13 receberam texto fixo em português sem passar pelo sistema `t()`.

---

### P-02 — Localização: Tradução EN dos Textos Novos
**Categoria:** Localização
**Esforço:** Médio
**Impacto:** Alto
**Descrição:** Após P-01 identificar todos os textos não localizados, criar as chaves de tradução no objeto `LANG` para EN e PT. Traduzir todos os textos novos adicionados nas sessões 7-16.
**Contexto:** Depende de P-01 estar completo.

---

### P-03 — Links e Referências Externas
**Categoria:** Legal / UI
**Esforço:** Baixo
**Impacto:** Médio
**Descrição:** Identificar todos os pontos do app com links placeholder ou campos de texto que referenciam URLs externas (política de privacidade, termos de uso, suporte, redes sociais da o6 games, feedback). Substituir por URLs reais quando disponíveis.
**Contexto:** Sessão 15 criará a Privacy Policy page. Outros links (Instagram, Discord, etc.) dependem de decisão de negócio.

---

### P-04 — Juicy: Transições de Tela
**Categoria:** Juicy
**Esforço:** Médio
**Impacto:** Alto
**Descrição:** Adicionar animações de transição entre telas (fade, slide, scale) ao trocar via `showScreen()`. Duração sugerida: 150-200ms. Telas que entram: slide-up ou fade-in. Telas que saem: fade-out simultâneo.
**Contexto:** Atualmente as telas trocam instantaneamente (display:none/flex), o que parece abrupto especialmente em mobile.

---

### P-05 — Juicy: Fluxo de Resolução de Combate
**Categoria:** Juicy
**Esforço:** Alto
**Impacto:** Alto
**Descrição:** Adicionar timing dramático ao fluxo pós-duelo:
1. **Entra Combate** — modal de dados abre com animação
2. **Rola Dados** — animação de rolagem (já existe)
3. **Resultado** — exibir vencedor/perdedor por **2 segundos** antes de fechar
4. **Volta ao Tabuleiro** — modal fecha, **aguardar 1 segundo**
5. **Executa Movimento** — peças se movem/desaparecem com animação
6. **Novo Turno** — transição para próxima fase

Atualmente: modal fecha já com a resolução aplicada instantaneamente, sem staging temporal.
**Contexto:** Este é o momento mais tenso do jogo — precisa de peso dramático.

---

### P-06 — Juicy: Ajustes na Tela de Rolagem de Dados
**Categoria:** Juicy / UI
**Esforço:** Médio
**Impacto:** Alto
**Descrição:** Revisar a tela do modal de duelo:
- Layout e proporções dos dados
- Feedback visual de quem venceu (mais claro, mais animado)
- Exibição do bônus da peça (bonus + roll = total) com hierarquia visual clara
- Animação do dado vencedor (pulse, glow dourado)
- Animação do dado perdedor (fade, shake)
- Som do impacto (se áudio for implementado)
**Contexto:** É a tela mais interativa do jogo e atualmente a mais carente de polish.

---

## Sessões de Polimento (A Definir)

Quando a lista estiver madura o suficiente e o sistema estiver estável, as sessões serão planejadas assim:

| Sessão | Grupo | Itens |
|--------|-------|-------|
| P-A | Localização completa | P-01 + P-02 |
| P-B | Juicy: combate | P-05 + P-06 |
| P-C | Juicy: navegação + links | P-03 + P-04 |
| P-D | [itens futuros] | — |

---

*Última atualização: 2026-04-18*
*Adicionar itens conforme forem identificados durante desenvolvimento.*
