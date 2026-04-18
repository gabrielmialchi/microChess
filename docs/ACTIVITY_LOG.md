# microChess — Activity Log

Log de atividades do desenvolvimento do sistema de MMR + Autenticação + Leaderboard.
Atualizar ao início e fim de cada sessão. Usado para retomada após interrupção de tokens.

---

## Formato de Entrada

```
## [DATA] Sessão X — [TEMA]
**Status:** Em andamento / Completo / Interrompido
**Branch:** sessao-X

### Feito
- Item 1
- Item 2

### Pendente
- Item ainda não feito

### Bugs / Bloqueios
- (vazio se nenhum)

### Próxima sessão começa em
- Arquivo: X | Ponto: Y
```

---

## [2026-04-17] Planejamento — Revisão do MD

**Status:** Completo
**Branch:** main

### Feito
- Leitura completa do server.js existente (544 linhas, Socket.io funcional)
- Leitura parcial do index.html (~1.200 linhas, frontend funcional)
- Identificação do que já existe: matchmaking, lógica 4x4, fases DRAFT→GAMEOVER
- Identificação do que falta: auth, MMR, persistência, leaderboard
- Reescrita completa do SESSAO_POR_SESSAO_PLANNING.md (de 8 sessões genéricas para 5 focadas no projeto real)
- Criação deste ACTIVITY_LOG.md
- Decisão: SQLite (não PostgreSQL) — zero configuração, suficiente para o projeto

### Arquivos do Projeto (estado atual)
| Arquivo | Linhas | Status |
|---------|--------|--------|
| `server/server.js` | 544 | ✅ Funcional — não alterar sem necessidade |
| `html/index.html` | ~1.200 | ✅ Funcional — alterar só em pontos específicos |
| `server/package.json` | 17 | ✅ express + socket.io |
| `server/db/` | — | ❌ Não existe ainda (Sessão 1) |
| `server/auth.js` | — | ❌ Não existe ainda (Sessão 2) |
| `server/mmr.js` | — | ❌ Não existe ainda (Sessão 3) |
| `html/auth-frontend.js` | — | ❌ Não existe ainda (Sessão 4) |
| `html/rank-ui.js` | — | ❌ Não existe ainda (Sessão 5) |

### Pendente
- Executar as 5 sessões de implementação

### Bugs / Bloqueios
- Nenhum

---

<!-- TEMPLATE PARA PRÓXIMAS SESSÕES — copiar e preencher -->

<!--
## [DATA] Sessão 1 — Database SQLite
**Status:** [ Em andamento / Completo / Interrompido ]
**Branch:** sessao-1

### Feito
-

### Pendente
-

### Bugs / Bloqueios
-

### Próxima sessão começa em
- Arquivo: | Ponto:
-->

<!--
## [DATA] Sessão 2 — Autenticação JWT
**Status:** [ Em andamento / Completo / Interrompido ]
**Branch:** sessao-2

### Feito
-

### Pendente
-

### Bugs / Bloqueios
-

### Próxima sessão começa em
- Arquivo: | Ponto:
-->

<!--
## [DATA] Sessão 3 — MMR + Persistência
**Status:** [ Em andamento / Completo / Interrompido ]
**Branch:** sessao-3

### Feito
-

### Pendente
-

### Bugs / Bloqueios
-

### Próxima sessão começa em
- Arquivo: | Ponto:
-->

<!--
## [DATA] Sessão 4 — Frontend Auth
**Status:** [ Em andamento / Completo / Interrompido ]
**Branch:** sessao-4

### Feito
-

### Pendente
-

### Bugs / Bloqueios
-

### Próxima sessão começa em
- Arquivo: | Ponto:
-->

<!--
## [DATA] Sessão 5 — Leaderboard + Polish
**Status:** [ Em andamento / Completo / Interrompido ]
**Branch:** sessao-5

### Feito
-

### Pendente
-

### Bugs / Bloqueios
-

### Sistema completo em:
-
-->
