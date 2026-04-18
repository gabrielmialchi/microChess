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
**Status:** Pendente | ✅ Completo
**Descrição:** [o que deve ser feito]
**Contexto:** [onde no jogo, por que importa]
```

---

## Fila de Polimentos

### P-01 — Localização: Textos Não Localizados (PT)
**Categoria:** Localização
**Esforço:** Médio
**Impacto:** Alto
**Status:** ✅ Completo (Sessão P-A)
**Descrição:** Varredura completa de todas as telas para identificar textos hardcoded em apenas um idioma. ~60 chaves adicionadas ao sistema `t()`.
**Contexto:** Telas das sessões 7-18 (ranking, leaderboard, histórico, replay, sala privada, overlays) estavam com texto fixo em português.

---

### P-02 — Localização: Tradução EN
**Categoria:** Localização
**Esforço:** Médio
**Impacto:** Alto
**Status:** ✅ Completo (Sessão P-A)
**Descrição:** Todas as ~60 chaves novas da P-01 traduzidas para EN e inseridas em `T.en`.
**Contexto:** Depende de P-01. Concluído junto com P-01 na mesma sessão.

---

### P-03 — Links e Referências Externas
**Categoria:** Legal / UI
**Esforço:** Baixo
**Impacto:** Médio
**Status:** Pendente (Sessão P-C)
**Descrição:** Identificar todos os pontos do app com links placeholder (href="#") e substituir por URLs reais: política de privacidade, portfolio, redes sociais da o6 games, feedback.
**Contexto:** Sessão 15 criou a Privacy Policy. Outros links dependem de decisão de negócio.

---

### P-04 — Juicy: Transições de Tela
**Categoria:** Juicy
**Esforço:** Médio
**Impacto:** Alto
**Status:** Pendente (Sessão P-C)
**Descrição:** Adicionar animações de transição entre telas (fade 150-200ms) ao trocar via `showScreen()`. Telas que entram: fade-in. Telas que saem: fade-out simultâneo.
**Contexto:** Atualmente as telas trocam instantaneamente (display:none/flex), o que parece abrupto especialmente em mobile.

---

### P-05 — Juicy: Fluxo de Resolução de Combate
**Categoria:** Juicy
**Esforço:** Alto
**Impacto:** Alto
**Status:** Pendente (Sessão P-B)
**Descrição:** Adicionar timing dramático ao fluxo pós-duelo:
1. Modal de dados abre com animação
2. Animação de rolagem (já existe)
3. Resultado — exibir vencedor/perdedor por 2 segundos antes de fechar
4. Modal fecha → aguardar 1 segundo
5. Peças se movem/desaparecem com animação
6. Transição para próxima fase

**Contexto:** Momento mais tenso do jogo — precisa de peso dramático. Atualmente o modal fecha com a resolução aplicada instantaneamente.

---

### P-06 — Juicy: Ajustes na Tela de Rolagem de Dados
**Categoria:** Juicy / UI
**Esforço:** Médio
**Impacto:** Alto
**Status:** Pendente (Sessão P-B)
**Descrição:** Revisar o modal de duelo:
- Hierarquia visual: bonus + roll = total com tamanhos diferentes
- Dado vencedor: pulse + glow dourado
- Dado perdedor: fade + shake
- Cor de fundo sutil reforça vencedor (verde/vermelho)

**Contexto:** Tela mais interativa do jogo e atualmente a mais carente de polish.

---

### P-07 — Badge: Partida Não Ranqueada
**Categoria:** UI
**Esforço:** Baixo
**Impacto:** Médio
**Status:** ✅ Completo (Sessão 18)
**Descrição:** Badge discreta "PARTIDA NÃO RANQUEADA" exibida na tela de matchmaking e no game-over quando um dos jogadores é anônimo (guest).
**Contexto:** Sem aviso, jogador logado poderia achar que o sistema de PdL estava quebrado.

---

### P-08 — Feature: Sala Privada com Código
**Categoria:** Feature
**Esforço:** Alto
**Impacto:** Alto
**Status:** ✅ Completo (Sessão 17)
**Descrição:** Sala privada com código de 4 chars (ex: K3R7). Jogador A cria, Jogador B entra com o código. Sala expira em 5 minutos.
**Contexto:** Permite jogar com amigos sem depender de matchmaking aleatório.

---

### P-09 — Localização: 7 Idiomas Restantes
**Categoria:** Localização
**Esforço:** Médio
**Impacto:** Alto
**Status:** Pendente (Sessão P-D)
**Descrição:** Preencher as ~60 chaves adicionadas na P-A nos 7 idiomas que ainda não as têm: ES, DE, IT, RU, JA, KO, ZH. Atualmente esses idiomas fazem fallback para EN nessas telas.
**Contexto:** Usuários em idiomas não-latinos (JA, KO, ZH) veem as novas telas em inglês — experiência incompleta.

---

### P-10 — Redesign de Fontes
**Categoria:** UI
**Esforço:** Médio
**Impacto:** Alto
**Status:** Pendente (Sessão P-E)
**Descrição:** Revisar as fontes usadas em todo o jogo: Cinzel (botões/labels), Cinzel Decorative (títulos de tela), IBM Plex Mono (valores numéricos). Avaliar consistência de uso, legibilidade em mobile (360px) e identidade visual. Propor e implementar ajustes tipográficos.
**Contexto:** Cinzel pode parecer pesada em tamanhos pequenos (11-12px). Inconsistências de uso identificadas entre telas antigas e novas.

---

### P-11 — Replay: Tabuleiro Fixo + Turno 0 + Label Formatado
**Categoria:** UI / Feature
**Esforço:** Médio
**Impacto:** Alto
**Status:** Pendente (Sessão P-F)
**Descrição:** Três melhorias no Replay Viewer:
1. **Tabuleiro fixo**: células de tamanho igual independente de conteúdo — casas vazias não colapsam, casas com peça não expandem. Usar o mesmo padrão visual do tabuleiro do jogo.
2. **Turno 0**: novo turno inicial mostrando o posicionamento das peças antes do primeiro movimento.
3. **Label formatado**: `[0]: Posicionamento`, `[1]: Turno 1`, `[2]: Turno 2`, etc.

**Contexto:** O tabuleiro atual distorce visualmente quando casas estão vazias. O Replay começar no Turno 1 pula o contexto de onde as peças foram posicionadas.

---

## Sessões de Polimento

| Sessão | Itens | Status |
|--------|-------|--------|
| P-A | P-01 + P-02 — Localização PT+EN | ✅ Completo |
| P-B | P-05 + P-06 — Juicy: combate + dados | ⏳ Pendente |
| P-C | P-03 + P-04 — Links + transições de tela | ⏳ Pendente |
| P-D | P-09 — Localização 7 idiomas restantes | ⏳ Pendente |
| P-E | P-10 — Redesign de fontes | ⏳ Pendente |
| P-F | P-11 — Replay: tabuleiro + turno 0 + label | ⏳ Pendente |

---

*Última atualização: 2026-04-18*
*Adicionar itens conforme forem identificados durante desenvolvimento.*
