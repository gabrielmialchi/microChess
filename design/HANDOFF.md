# microChess — Design Handoff para Claude Code

> **Leia antes de iniciar qualquer sessão.**
> Este documento mapeia os arquivos de design para as sessões de implementação.
> Não implemente tudo de uma vez — siga a ordem e valide antes de avançar.

---

## O que está neste pacote

```
design/
├── 01 - Design System.html          ← tokens CSS + componentes base
├── 02 - Telas de Partida.html       ← fluxo completo de uma partida
├── 03 - Menu + Matchmaking.html     ← menu principal, matchmaking, sala privada
├── 04 - Login + Modais.html         ← auth, ban, logout, reconexão, etc.
├── 05 - Perfil + Personalizar.html  ← perfil, stats, editar avatar/apelido
├── 06 - Ranking + Leaderboard.html  ← 14 ranks + leaderboard global
├── 07 - Histórico + Replay.html     ← lista de partidas + replay turno a turno
├── 08 - Configurações + Conteúdo.html ← settings, idioma, como jogar, créditos
├── 09 - Estados de Exceção.html     ← disconnect, AFK, morte súbita, sem conexão
└── _decisions/
    ├── pieces-aura.md               ← aura das peças (decisão fixada)
    ├── piece-bonus-rules.md         ← bônus por peça (regras corretas)
    └── pending-and-post-mvp.md      ← login social, confirmação de fila, localização
```

---

## Princípios do novo design (ler antes de implementar)

- **Tema:** "Editorial Claro" — fundo creme `#f5f3ee`, tinta `#18130c`, acento laranja `#ff5a1f`
- **Dark mode:** toggle via `document.documentElement.setAttribute('data-theme','dark')`
- **Fontes:** Inter (corpo) + JetBrains Mono (números/códigos) — Google Fonts
- **Peças:** Unicode com aura (text-shadow duplo). Brancas → `rgba(245,98,0,0.8)`. Pretas → `rgba(69,56,255,0.8)`. Sem outline, sem sombra.
- **ELO visível:** apenas nome do rank (ex: "Cavaleiro Aprendiz"). Número MMR nunca aparece para o jogador.
- **PdL:** valor pessoal — exibido só para o dono. Oponentes/ranking veem apenas o rank.
- **Navegação:** tab bar inferior (4 abas: Início · Jogar · Ranking · Perfil)
- **Empate:** estado válido quando Reis duelam e resultado é 0×0. Aparece em: Game Over, Histórico, stats de Perfil. Não aparece em W/L do header nem Leaderboard.
- **Bandeiras de idioma:** usar biblioteca `flag-icons` (CDN) — não usar emoji flags (não funcionam no Windows).

---

## Sessões de implementação sugeridas

> Cada sessão lê **apenas** os arquivos indicados. Não é necessário ler o pacote inteiro de uma vez.

### Sessão Design-A — Tokens CSS + componentes base
**Ler:** `01 - Design System.html`

**O que fazer:**
1. Copiar o bloco `:root` completo (tokens light) para o topo do `<style>` existente em `index.html` — sem remover nenhuma variável existente ainda.
2. Copiar o bloco `[data-theme="dark"]` logo abaixo.
3. Adicionar o import das fontes Inter + JetBrains Mono no `<head>`.
4. Adicionar o import da biblioteca `flag-icons` no `<head>`:
   ```html
   <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.0.0/css/flag-icons.min.css">
   ```
5. Copiar as classes `.mc-btn`, `.mc-input`, `.mc-card`, `.mc-tag`, `.mc-avatar`, `.mc-board`, `.mc-die`, `.mc-tabbar`, `.mc-topbar` para um novo bloco `<style>` no final do `<head>` (não alterar o style existente).

---

### Sessão Design-B — Menu principal + Header de jogador
**Ler:** `03 - Menu + Matchmaking.html` (cenas 01 e 02)

**O que fazer:**
1. Redesenhar `#screen-menu` com a nova estrutura:
   - Header: avatar + nome + rank (ELO) + W/L
   - Hero: logo `micro<em>Chess</em>.` + subtítulo
   - Nav: 4 botões (Jogar ranqueada · Sala privada · Ranking · Configurações)
2. Adicionar `#tab-bar` fixo no fundo da tela (4 abas).
3. Modo convidado: mostrar CTA "Criar conta" em laranja no lugar dos stats.
4. **Não alterar** lógica de `showScreen()` — apenas HTML/CSS.

---

### Sessão Design-C — Matchmaking + Sala privada
**Ler:** `03 - Menu + Matchmaking.html` (cenas 03–07)

**O que fazer:**
1. Redesenhar `#screen-matchmaking` com radar animado, ELO dos jogadores (rank, não número), countdown grande.
2. Redesenhar `#screen-private-room` com código em destaque, dot pulsando, divider "ou", input centralizado.
3. IDs existentes (`#mm-lobby`, `#mm-found`, `#mm-countdown`, `#pr-code-value`, etc.) devem ser mantidos — apenas CSS/estrutura HTML muda.

---

### Sessão Design-D — Telas de partida (DRAFT + POSITION + ACTION + REVEAL)
**Ler:** `02 - Telas de Partida.html` (cenas 04–10)
**Ler também:** `_decisions/pieces-aura.md`

**O que fazer:**
1. Redesenhar `#game-area` com novo topbar (oponente · phase pill · timer).
2. **Remover** barra de etapas (DRAFT · POSIÇÃO · AÇÃO) — o topbar já informa a fase.
3. Redesenhar inventário do Draft:
   - Label "Toque para devolver" acima dos slots
   - Botão "Limpar ✕" no canto direito do header do inventário
4. Aplicar aura nas peças: `text-shadow: 0 0 10px <cor>, 0 0 20px <cor>` (ver `_decisions/pieces-aura.md`).
5. Células de zona própria no POSITION: `background: color-mix(in oklab, var(--mc-cell-light) 86%, var(--mc-accent) 14%)`.

---

### Sessão Design-E — Duelo + Game Over
**Ler:** `02 - Telas de Partida.html` (cenas 11–15)

**O que fazer:**
1. Redesenhar `#duel-modal` com dois cards lado a lado (horizontal), botão livre abaixo.
2. Adicionar estado "Empate" no game over (cena 15): dois Reis com suas auras, "= 0 PdL".
3. Redesenhar `#game-over-screen` com ícone de peça grande, resultado, delta PdL, botões.
4. Estado Morte Súbita: phase pill pulsando vermelho (`--mc-danger`). Ao entrar nesse estado, ir direto para o duelo — sem aguardar jogada.

---

### Sessão Design-F — Auth (Login + Registro)
**Ler:** `04 - Login + Modais.html` (cenas 01–03)

**O que fazer:**
1. Redesenhar `#auth-overlay` como **tela cheia** (não modal sobre escuro).
2. Estrutura: logo no topo · eyebrow · título · campos · CTA · link alternativo · "Jogar sem conta".
3. Estado de erro: border vermelho no campo + hint abaixo (não alert/toast).
4. Manter IDs existentes: `#login-email`, `#login-password`, `#reg-username`, `#reg-email`, `#reg-password`, `#auth-error`.

---

### Sessão Design-G — Modais de sistema
**Ler:** `04 - Login + Modais.html` (cenas 04–08)

**O que fazer:**
1. Redesenhar `#ban-overlay`, `#logout-confirm`, `#delete-account-confirm`, `#change-password-modal`, `#reconnect-overlay`.
2. Todos usam o mesmo padrão: `backdrop-filter:blur(10px)` + card branco centralizado.
3. Manter todos os IDs e `onclick` existentes — apenas visual.

---

### Sessão Design-H — Perfil + Editar
**Ler:** `05 - Perfil + Personalizar.html`

**O que fazer:**
1. Redesenhar `#screen-profile`: hero com avatar + nome + rank + PdL · stats grid 2×2 · winrate bar · ações de conta.
2. Adicionar stat "Empates" na grid (span 2 colunas).
3. Redesenhar `#avatar-grid`: duas fileiras — "Brancas" (♔♕♖♗♘♙) + "Pretas" (♚♛♜♝♞♟).
4. Botão "Salvar" deve ficar no topbar direito (não no fundo da tela).
5. Convidado: exibir card de CTA "Criar conta" no lugar dos stats.

---

### Sessão Design-I — Ranking + Leaderboard
**Ler:** `06 - Ranking + Leaderboard.html`

**O que fazer:**
1. Redesenhar `#screen-ranking`: escada vertical dos 14 ranks com posição atual do jogador destacada (borda laranja + barra PdL).
2. Redesenhar `#screen-leaderboard`: linhas compactas com posição · avatar · nome · rank · W/L. Podium via cor do número (#, prata, bronze). Linha "você" fixada acima da tabbar.
3. ELO = nome do rank. Número MMR nunca aparece.

---

### Sessão Design-J — Histórico + Replay
**Ler:** `07 - Histórico + Replay.html`

**O que fazer:**
1. Redesenhar `#screen-match-history`: linhas compactas V/D/WO/E coloridas · oponente + rank · duração · delta PdL pessoal · botão ▶.
2. Adicionar estado "E" (empate) na lista — badge muted, "= 0 PdL".
3. Redesenhar `#screen-replay`: header fixo com resultado/oponente/turno · tabuleiro · controles ⏮ AUTO ⏭.
4. Turno 0 = posicionamento (mostrar formação inicial).
5. Banner de duelo (abaixo do tabuleiro): L1 "♘ Cavalo venceu ♛ Rainha" · L2 mono "7 (5+2) × 6 (2+4)".

---

### Sessão Design-K — Configurações + Conteúdo
**Ler:** `08 - Configurações + Conteúdo.html`

**O que fazer:**
1. Redesenhar `#screen-settings`: grid 3×3 de idiomas com `flag-icons` (já importado na Sessão A) · toggle dark/light · links.
2. Troca de idioma: instantânea, sem botão Salvar.
3. Redesenhar `#screen-how-to-play`: 4 fases numeradas + tabela de bônus correta:
   - Rainha +5 · Torre +4 · Cavalo +3 · Bispo +2 · Peão +1 · Rei +4
   - Peão promovido (última fileira) ganha +1 adicional → Peão+2
   - Mencionar empate (Morte Súbita com resultado 0×0)
4. Redesenhar `#screen-credits`: centrado, limpo.

---

### Sessão Design-L — Estados de exceção
**Ler:** `09 - Estados de Exceção.html`

**O que fazer:**
1. Banner in-game de desconexão: tira horizontal abaixo do topbar (não modal). Countdown visível.
2. Banner AFK warning: âmbar, timer pulsando, CTA urgente.
3. Morte Súbita: phase pill vermelho pulsando. Banner informativo "vai direto para duelo". Sem botão de mover.
4. Sair da partida: overlay leve com aviso de WO.
5. Sala privada: erro de código (borda vermelha) e sala expirada (banner âmbar).
6. Sem conexão: tela cheia simples com botão retry.
7. Reconectando: banner sutil no topo, UI desfocada em background.

---

## Chaves de localização novas a adicionar ao objeto `T`

Adicionar ao final de cada idioma em `index.html`:

```js
draft_return_hint: 'Toque para devolver',  // EN: 'Tap to return'
draft_clear:       'Limpar',               // EN: 'Clear'
avatar_white:      'Brancas',              // EN: 'White'
avatar_black:      'Pretas',               // EN: 'Black'
draw:              'Empate',               // EN: 'Draw'
sudden_death:      'Morte Súbita',         // EN: 'Sudden Death'
pdl_draw:          '= 0 PdL',             // igual em todos os idiomas
```

> Começar em PT e EN. Os outros 7 idiomas podem ser adicionados depois — não bloqueante.

---

## Regras de implementação (não mudam)

- **NUNCA reescrever** `server.js` ou `index.html` — apenas inserir blocos novos
- **CSS novo** em bloco `<style>` separado ou inline nos divs criados. Não alterar o `<style>` existente.
- **Retrocompatibilidade:** jogo deve funcionar sem conta (convidado)
- **IDs existentes** devem ser mantidos — apenas o HTML/CSS ao redor muda
- **Verificar `docs/ACTIVITY_LOG.md`** antes de cada sessão

---

## Como usar este pacote

1. Copie a pasta `design/` para dentro do seu projeto microChess
2. No Claude Code, cite o arquivo relevante por sessão: *"Leia `design/03 - Menu + Matchmaking.html` e implemente conforme as instruções da Sessão Design-B em `design/HANDOFF.md`"*
3. Valide visualmente cada sessão antes de avançar
4. As sessões são independentes — se uma falhar, não quebra as outras
