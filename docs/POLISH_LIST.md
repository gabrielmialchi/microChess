# microChess — Lista de Polimentos

Este documento é a fila de polimentos do projeto. Não tem prioridade fixa — os itens são trabalhados
em sessões dedicadas após o sistema do jogo estar completo e operante.

> **Nota (2026-04-18):** Polimentos visuais, juicy e UX foram removidos desta lista e entregues ao
> Claude Design. O redesign completo será implementado nas sessões Design-A a Design-L.
> Esta lista foca em: mecânica de jogo, servidor, balanceamento e localização.

**Como usar:** Quando encontrar um polimento necessário mas fora do momento oportuno, peça
"adiciona polimento: [descrição]" e ele será encaixado aqui.

---

## Formato de Entrada

```
### P-XX — [NOME]
**Categoria:** Localização | Mecânica | Servidor | Balanceamento | Legal
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
**Categoria:** Legal
**Esforço:** Baixo
**Impacto:** Médio
**Status:** Pendente (Sessão Design-K)
**Descrição:** Substituir links placeholder (href="#") por URLs reais: política de privacidade, portfolio, redes sociais da o6 games, feedback. Será integrado durante o redesign da tela de créditos e configurações.
**Contexto:** URLs a serem fornecidas pelo usuário antes ou durante a Sessão Design-K.

---

### P-07 — Badge: Partida Não Ranqueada
**Categoria:** Mecânica
**Esforço:** Baixo
**Impacto:** Médio
**Status:** ✅ Completo (Sessão 18)
**Descrição:** Badge discreta "PARTIDA NÃO RANQUEADA" exibida na tela de matchmaking e no game-over quando um dos jogadores é anônimo (guest).
**Contexto:** Sem aviso, jogador logado poderia achar que o sistema de PdL estava quebrado.

---

### P-08 — Feature: Sala Privada com Código
**Categoria:** Mecânica
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
**Status:** ✅ Completo (Sessão P-C)
**Descrição:** ~60 chaves adicionadas a ES, DE, IT, RU, JA, KO, ZH em `html/index.html`.
**Contexto:** Telas de ranking, leaderboard, histórico, replay, sala privada e overlays agora localizadas em todos os idiomas.

---

### P-11 — Replay: Tabuleiro Fixo + Turno 0 + Label Formatado
**Categoria:** Mecânica
**Esforço:** Médio
**Impacto:** Alto
**Status:** Absorvido pela Sessão Design-J
**Descrição:** Tabuleiro com células de tamanho fixo, Turno 0 (posicionamento inicial) e label `[0]: Posicionamento / [N]: Turno N`. Será resolvido durante o redesign completo do Histórico + Replay.
**Contexto:** O redesign da Sessão Design-J reconstrói o tabuleiro do Replay do zero — os três itens ficam naturalmente incluídos.

---

### P-12 — Balanceamento: MMR para Resultado de Empate
**Categoria:** Balanceamento
**Esforço:** Médio
**Impacto:** Médio
**Status:** Pendente (pós Design-E)
**Descrição:** Definir e implementar o cálculo de PdL para empate. Regras decididas:
- Empate ocorre **somente em Morte Súbita** quando o duelo resulta em 0×0.
- Mínimo de **+1 PdL** para ambos os jogadores em qualquer empate.
- O cálculo deve usar diferença de rank (estilo ELO): jogador mais fraco que empata contra mais forte recebe PdL extra proporcional à diferença. Exemplo: Peão Aprendiz empatando com Torre Elite recebe mais do que +1 PdL.
- Jogador mais forte que empata contra mais fraco recebe apenas o mínimo (+1).

**Contexto:** O estado de empate existe no design (Design-E Game Over + Design-J Histórico). A lógica de cálculo fica em `server/mmr.js`. Implementar após o redesign visual incluir os estados de empate na UI.

---

## Sessões de Polimento

| Sessão | Itens | Status |
|--------|-------|--------|
| P-A | P-01 + P-02 — Localização PT+EN | ✅ Completo |
| P-B | P-03 — Links externos reais | ⏸ Suspenso → integrado na Design-K |
| P-C | P-09 — Localização 7 idiomas restantes | ✅ Completo |
| P-D | P-11 — Replay: tabuleiro + turno 0 + label | ⏸ Absorvido pela Design-J |

---

*Última atualização: 2026-04-19*
*Redesign visual: sessões Design-A a Design-L em andamento.*
