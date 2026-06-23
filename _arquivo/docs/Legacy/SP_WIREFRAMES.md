# SP_WIREFRAMES — Layout das 4 Telas Novas

> Output da sessão **SP-1.3**. Fonte de verdade para SP-4.1, SP-5.1, SP-6.1, SP-7.1.
>
> Cada seção contém: ASCII layout, hierarquia HTML com IDs, classes CSS recomendadas, handlers JS, estados visuais, transições.
>
> Convenção do projeto: **CSS sempre inline** nos `style="..."` dos próprios `<div>`; usar `var(--mc-...)` (tokens já definidos em Design-A).

---

## 0. Convenções comuns às 4 telas

### Header padrão
Todas as 4 telas usam o mesmo padrão de header já presente em `#screen-game-mode` atual ([html/index.html:2013](../html/index.html#L2013)):

```
[← VOLTAR]                              ← linha 1: back-btn (esquerda)
       TÍTULO_SCREEN                    ← linha 2: título centralizado
```

- Botão back: classe `screen-back-btn` (já existe), label via `t('back')`
- Título: `font-family:var(--mc-font-serif); font-size:13px; letter-spacing:3px; font-weight:700`

### Card grande (padrão)
Mesmo formato visual usado em `#screen-game-mode` atual (`gm-card-casual` etc.):
- `padding:20px 16px`
- `border-radius:var(--mc-r-lg, 12px)`
- `border:1.5px solid var(--mc-rule)`
- `background:var(--mc-surface)`
- Estado selecionado/atual: `border-color:var(--mc-accent)`
- Conteúdo: label (15px font-serif, weight 700) + descrição (12px sans, color muted)

### Botão CTA primário (padrão FIND MATCH atual)
- `height:52px; border:none; border-radius:var(--mc-r-md)`
- `background:var(--mc-accent); color:var(--mc-accent-ink)`
- `font:700 13px var(--mc-font-serif); letter-spacing:1.5px`
- Disabled: `opacity:0.4; cursor:not-allowed`

### Modal padrão (usar pattern de `Design-G`)
Reaproveitar estrutura de modais existentes (`#modal-logout`, `#modal-delete`, etc.) — overlay escuro + caixa centralizada com título + body + 2 botões (cancelar/confirmar).

---

## 1. Tela 1 — `#screen-game-mode` (REFORMATADA)

> **Status atual:** tem 3 cards (Casual / Ranqueada / Tutorial) + botão FIND MATCH global ([html/index.html:2012-2037](../html/index.html#L2012)).
> **Status alvo:** 2 cards grandes (SOLO / ONLINE), sem botão FIND MATCH (cada card já navega).

### Layout ASCII
```
┌──────────────────────────────────────────┐
│ ← VOLTAR                                 │  ← back-btn ao menu
│                                          │
│            NOVO JOGO                     │  ← título
│                                          │
│   ┌────────────────────────────────┐     │
│   │                                │     │
│   │            SOLO                │     │  ← card grande 1
│   │   15 fases contra a CPU        │     │
│   │                                │     │
│   └────────────────────────────────┘     │
│                                          │
│   ┌────────────────────────────────┐     │
│   │                                │     │
│   │           ONLINE               │     │  ← card grande 2
│   │   Jogadores reais online       │     │
│   │                                │     │
│   └────────────────────────────────┘     │
│                                          │
└──────────────────────────────────────────┘
```

### Hierarquia HTML
```html
<div id="screen-game-mode" class="screen" style="background:var(--mc-bg);flex-direction:column;align-items:stretch;">
  <div style="padding:14px 20px;display:flex;align-items:center;">
    <button class="screen-back-btn" onclick="showScreen('menu')">← <span id="gm-back-label" class="back-label">VOLTAR</span></button>
  </div>
  <div style="padding:0 20px 20px;text-align:center;">
    <div id="gm-title" style="font-family:var(--mc-font-serif);font-size:13px;letter-spacing:3px;font-weight:700;color:var(--mc-ink);">NOVO JOGO</div>
  </div>
  <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 20px;gap:14px;max-width:400px;width:100%;margin:0 auto;box-sizing:border-box;">
    <button id="gm-card-solo"   onclick="window.openSoloHub()" style="<card-grande-style>">
      <div id="gm-solo-label"   style="<label-style>">SOLO</div>
      <div id="gm-solo-desc"    style="<desc-style>">15 fases contra a CPU</div>
    </button>
    <button id="gm-card-online" onclick="showScreen('multiplayer-mode')" style="<card-grande-style>">
      <div id="gm-online-label" style="<label-style>">ONLINE</div>
      <div id="gm-online-desc"  style="<desc-style>">Jogadores reais online</div>
    </button>
  </div>
</div>
```

### Inventário de IDs
| ID | Tipo | Propósito |
|---|---|---|
| `gm-back-label` | span | Texto "VOLTAR" — i18n key `back` |
| `gm-title` | div | "NOVO JOGO" — i18n key `new_game` (já existe) |
| `gm-card-solo` | button | Card SOLO |
| `gm-solo-label` | div | i18n `sp_solo` |
| `gm-solo-desc` | div | i18n `sp_solo_desc` |
| `gm-card-online` | button | Card ONLINE |
| `gm-online-label` | div | i18n `sp_online` |
| `gm-online-desc` | div | i18n `sp_online_desc` |

### Handlers JS
| Elemento | Evento | Ação |
|---|---|---|
| back-btn | onclick | `showScreen('menu')` |
| `gm-card-solo` | onclick | `window.openSoloHub()` (definida em SP-6.x) |
| `gm-card-online` | onclick | `showScreen('multiplayer-mode')` |

### Função `window.openSoloHub()` (especificada em SP-6.2)
Pseudocódigo:
```
loadSPProgress() (assíncrono se logado; síncrono em memória se convidado)
showScreen('solo-hub')
```

### Atualizar `applyLang()` para popular
- `gm-back-label` ← `t('back')`
- `gm-title` ← `t('new_game')`
- `gm-solo-label` ← `t('sp_solo')`
- `gm-solo-desc` ← `t('sp_solo_desc')`
- `gm-online-label` ← `t('sp_online')`
- `gm-online-desc` ← `t('sp_online_desc')`

### O que fazer com o HTML antigo
SP-4.1 deve **comentar** (não deletar) os blocos atuais `gm-card-casual`, `gm-card-ranked`, `gm-card-train`, `gm-find-btn` para rollback rápido. As funções `selectGameMode()` e `startMatchmakingWithMode()` permanecem por enquanto (SP-5.2 as renomeia/migra).

---

## 2. Tela 2 — `#screen-multiplayer-mode` (NOVA)

> Extração dos 2 cards Casual/Ranqueada + FIND MATCH da game-mode atual.

### Layout ASCII
```
┌──────────────────────────────────────────┐
│ ← VOLTAR                                 │  ← back-btn → game-mode
│                                          │
│            ONLINE                        │  ← título
│                                          │
│   ┌────────────────────────────────┐     │
│   │  Casual                       ✓│     │  ← card 1 (selecionado)
│   │  Jogue sem afetar seu XP       │     │
│   └────────────────────────────────┘     │
│   ┌────────────────────────────────┐     │
│   │  Ranqueada                     │     │  ← card 2
│   │  Compete por XP e suba no rank │     │
│   └────────────────────────────────┘     │
│                                          │
│   ┌────────────────────────────────┐     │
│   │         FIND MATCH             │     │  ← CTA primário
│   └────────────────────────────────┘     │
│                                          │
└──────────────────────────────────────────┘
```

### Estados
| Estado | Visual |
|---|---|
| Inicial (nenhum modo selecionado) | Cards sem border accent; FIND MATCH disabled |
| Casual selecionado | `mp-card-casual` border accent + checkmark visível; FIND MATCH habilitado |
| Ranqueada selecionada | `mp-card-ranked` border accent + checkmark visível; FIND MATCH habilitado |
| Após clicar FIND MATCH | Navega para `screen-matchmaking` (já existe) |

### Hierarquia HTML
```html
<div id="screen-multiplayer-mode" class="screen" style="background:var(--mc-bg);flex-direction:column;align-items:stretch;">
  <div style="padding:14px 20px;display:flex;align-items:center;">
    <button class="screen-back-btn" onclick="showScreen('game-mode')">← <span id="mp-back-label" class="back-label">VOLTAR</span></button>
  </div>
  <div style="padding:0 20px 20px;text-align:center;">
    <div id="mp-title" style="<title-style>">ONLINE</div>
  </div>
  <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 20px;gap:12px;max-width:400px;width:100%;margin:0 auto;box-sizing:border-box;">
    <button id="mp-card-casual" onclick="window.selectMultiplayerMode('casual')" style="<card-style>">
      <div id="mp-casual-label" style="<label-style>">Casual</div>
      <div id="mp-casual-desc"  style="<desc-style>">Jogue sem afetar seu XP</div>
      <div id="mp-check-casual" style="display:none;<check-style>"><svg .../></div>
    </button>
    <button id="mp-card-ranked" onclick="window.selectMultiplayerMode('ranked')" style="<card-style>">
      <div id="mp-ranked-label" style="<label-style>">Ranqueada</div>
      <div id="mp-ranked-desc"  style="<desc-style>">Compete por XP e suba no ranking</div>
      <div id="mp-check-ranked" style="display:none;<check-style>"><svg .../></div>
    </button>
    <button id="mp-find-btn" onclick="window.startMatchmakingMP()" disabled style="<cta-style>">
      <span id="mp-find-label">FIND MATCH</span>
    </button>
  </div>
</div>
```

### Inventário de IDs
| ID | i18n key (reaproveitar de PRE-OT-B) |
|---|---|
| `mp-back-label` | `back` |
| `mp-title` | `mode_title` |
| `mp-casual-label` | `mode_casual` |
| `mp-casual-desc` | `mode_casual_desc` |
| `mp-ranked-label` | `mode_ranked` |
| `mp-ranked-desc` | `mode_ranked_desc` |
| `mp-find-label` | `mode_find_match` |

> **Nota SP-5.3:** todas estas keys já existem (criadas em PRE-OT-B). Não criar duplicatas.

### Handlers JS
| Elemento | Evento | Ação |
|---|---|---|
| back-btn | onclick | `showScreen('game-mode')` |
| `mp-card-casual` | onclick | `window.selectMultiplayerMode('casual')` |
| `mp-card-ranked` | onclick | `window.selectMultiplayerMode('ranked')` |
| `mp-find-btn` | onclick | `window.startMatchmakingMP()` |

### Funções a expor (SP-5.2)
```
window.selectMultiplayerMode(mode):
  window._selectedMPMode = mode
  togglar border-color e check icon dos 2 cards
  habilitar mp-find-btn (remover disabled, opacity:1, cursor:pointer)

window.startMatchmakingMP():
  se !window._selectedMPMode → return
  socket.emit('queue_join', getQueueProfile({ ..., match_mode: window._selectedMPMode }))
  showScreen('matchmaking')
```

> **SP-5.2 deve preservar** as funções antigas `selectGameMode()` e `startMatchmakingWithMode()` (ainda referenciadas em código legado) — apenas adicionar as novas com sufixo MP.

---

## 3. Tela 3 — `#screen-solo-hub` (NOVA)

> Hub de entrada do modo Solo. CONTINUAR mostra a próxima fase a jogar; NOVO reinicia.

### Layout ASCII (estado normal: jogador com progresso 6 de 15)
```
┌──────────────────────────────────────────┐
│ ← VOLTAR                                 │  ← back-btn → game-mode
│                                          │
│             SOLO                         │  ← título
│                                          │
│   ┌────────────────────────────────┐     │
│   │  CONTINUAR — Fase 7            │     │  ← card 1 (label dinâmico)
│   │  Retomar de onde parou         │     │
│   └────────────────────────────────┘     │
│   ┌────────────────────────────────┐     │
│   │  NOVO                          │     │  ← card 2
│   │  Começar do início (Fase 1)    │     │
│   └────────────────────────────────┘     │
│                                          │
└──────────────────────────────────────────┘
```

### Estados especiais
| Estado | `sh-continue-label` | `sh-card-continue` |
|---|---|---|
| Loading (logado, fetch em curso) | "..." | disabled, opacity 0.6 |
| `max_level_completed = 0` (jogador novo OU convidado) | "CONTINUAR — Fase 1" | habilitado |
| `max_level_completed` ∈ 1..14 | "CONTINUAR — Fase X+1" | habilitado |
| `max_level_completed = 15` | "Todas as fases completas" (key `sp_completed_all`) | habilitado, ao clicar vai pro mapa |
| Erro de rede (fetch falhou) | "CONTINUAR — Fase 1" + assume 0 | habilitado (degrada gracefully) |

### Modal NOVO — confirmação
```
┌─────────────────────────────────┐
│  REINICIAR JORNADA?             │  ← título
│                                 │
│  [texto dinâmico]               │  ← sp_new_confirm_logged OU sp_new_confirm_guest
│                                 │
│       [CANCELAR]  [CONFIRMAR]   │  ← botões
└─────────────────────────────────┘
```

### Hierarquia HTML
```html
<div id="screen-solo-hub" class="screen" style="background:var(--mc-bg);flex-direction:column;align-items:stretch;">
  <div style="padding:14px 20px;display:flex;align-items:center;">
    <button class="screen-back-btn" onclick="showScreen('game-mode')">← <span id="sh-back-label" class="back-label">VOLTAR</span></button>
  </div>
  <div style="padding:0 20px 20px;text-align:center;">
    <div id="sh-title" style="<title-style>">SOLO</div>
  </div>
  <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 20px;gap:14px;max-width:400px;width:100%;margin:0 auto;box-sizing:border-box;">
    <button id="sh-card-continue" onclick="window.continueSolo()" style="<card-grande-style>">
      <div id="sh-continue-label" style="<label-style>">CONTINUAR — <span id="sh-continue-phase">Fase 1</span></div>
      <div id="sh-continue-desc"  style="<desc-style>">Retomar de onde parou</div>
    </button>
    <button id="sh-card-new" onclick="window.openNewSoloModal()" style="<card-grande-style>">
      <div id="sh-new-label" style="<label-style>">NOVO</div>
      <div id="sh-new-desc"  style="<desc-style>">Começar do início (Fase 1)</div>
    </button>
  </div>
</div>

<!-- Modal de confirmação NOVO -->
<div id="sh-new-confirm-modal" class="mc-modal-overlay" style="display:none;<overlay-style>">
  <div class="mc-modal-box" style="<box-style>">
    <div id="sh-new-confirm-title" style="<title-style>">REINICIAR?</div>
    <div id="sh-new-confirm-text"  style="<text-style>">[texto dinâmico]</div>
    <div style="display:flex;gap:10px;margin-top:16px;">
      <button id="sh-new-confirm-cancel" onclick="window.closeNewSoloModal()" style="<btn-secondary-style>">CANCELAR</button>
      <button id="sh-new-confirm-ok"     onclick="window.confirmNewSolo()"   style="<btn-primary-style>">CONFIRMAR</button>
    </div>
  </div>
</div>
```

### Inventário de IDs
| ID | Propósito | i18n |
|---|---|---|
| `sh-back-label` | "VOLTAR" | `back` |
| `sh-title` | "SOLO" | `sp_solo` |
| `sh-card-continue` | botão card | — |
| `sh-continue-label` | "CONTINUAR" + número | `sp_continue` (label) + dinâmico |
| `sh-continue-phase` | "Fase X" | `sp_phase` + número, ou `sp_completed_all` |
| `sh-continue-desc` | descrição | `sp_continue_desc` |
| `sh-card-new` | botão card | — |
| `sh-new-label` | "NOVO" | `sp_new` |
| `sh-new-desc` | descrição | `sp_new_desc` |
| `sh-new-confirm-modal` | overlay modal | — |
| `sh-new-confirm-title` | título modal | hardcoded ou key nova |
| `sh-new-confirm-text` | corpo modal | `sp_new_confirm_logged` OU `sp_new_confirm_guest` |
| `sh-new-confirm-cancel` | botão cancelar | `cancel` |
| `sh-new-confirm-ok` | botão confirmar | `confirm` |

### Handlers JS
| Elemento | Ação |
|---|---|
| back-btn | `showScreen('game-mode')` |
| `sh-card-continue` | `window.continueSolo()` |
| `sh-card-new` | `window.openNewSoloModal()` |
| `sh-new-confirm-cancel` | `window.closeNewSoloModal()` |
| `sh-new-confirm-ok` | `window.confirmNewSolo()` |

### Funções a expor (SP-6.2, SP-6.3, SP-6.4)
```
window.continueSolo():
  if (!window.spProgress) → loadSPProgress()
  if (max === 15) → showScreen('sp-map')   // todas completas; deixa explorar
  else            → window.startSPLevel(max + 1)  ← vai direto pra fase

window.openNewSoloModal():
  text = window.spProgress.isGuest ? t('sp_new_confirm_guest') : t('sp_new_confirm_logged')
  set sh-new-confirm-text = text
  show sh-new-confirm-modal

window.closeNewSoloModal():
  hide sh-new-confirm-modal

window.confirmNewSolo():
  if (!window.spProgress.isGuest):
    fetch POST /sp/reset (auth header)
  window.spProgress.max_level_completed = 0
  hide sh-new-confirm-modal
  window.startSPLevel(1)   // ou showScreen('sp-map')
```

### Quando atualizar tela
- Ao entrar em `solo-hub`: chamar `loadSPProgress()` + `refreshSoloHub()`
- Ao retornar de partida (game-over): `refreshSoloHub()` reflete o novo `max_level_completed`

```
refreshSoloHub():
  p = window.spProgress.max_level_completed
  if (p === 15):
    sh-continue-phase.textContent = t('sp_completed_all')
    sh-continue-label = "CONTINUAR" sem traço (mostra só sp_completed_all)
  else:
    next = p + 1
    sh-continue-phase.textContent = t('sp_phase') + ' ' + next   // "Fase 7"
```

---

## 4. Tela 4 — `#screen-sp-map` (NOVA)

> Grid de 15 cards para escolher fase. Estados: completed / current / locked.

### Layout ASCII (mobile, 3 colunas)
```
┌──────────────────────────────────────────┐
│ ← VOLTAR                                 │  ← back-btn → solo-hub
│                                          │
│           MAPA SOLO                      │  ← título
│                                          │
│   ┌────┐ ┌────┐ ┌────┐                   │
│   │ 1✓│ │ 2✓│ │ 3✓│                   │
│   │Recr│ │Apre│ │Defe│                   │
│   └────┘ └────┘ └────┘                   │
│   ┌────┐ ┌────┐ ┌────┐                   │
│   │ 4✓│ │ 5✓│ │ 6✓│                   │
│   │Atir│ │Cava│ │Bisp│                   │
│   └────┘ └────┘ └────┘                   │
│   ┌────┐ ┌────┐ ┌────┐                   │
│   │ 7▶│ │ 8🔒│ │ 9🔒│                   │
│   │Tanq│ │Caça│ │Estr│                   │
│   └────┘ └────┘ └────┘                   │
│   ┌────┐ ┌────┐ ┌────┐                   │
│   │10🔒│ │11🔒│ │12🔒│                   │
│   │Duel│ │Cerc│ │Isca│                   │
│   └────┘ └────┘ └────┘                   │
│   ┌────┐ ┌────┐ ┌────┐                   │
│   │13🔒│ │14🔒│ │15🔒│                   │
│   │Rain│ │Mest│ │Lend│                   │
│   └────┘ └────┘ └────┘                   │
└──────────────────────────────────────────┘
```

### Estados visuais por card
| Estado | Background | Border | Ícone | Cursor | Click |
|---|---|---|---|---|---|
| `completed` | `var(--mc-success-soft)` | 1.5px solid `var(--mc-success)` | ✓ verde | pointer | reabre fase (replay opcional) |
| `current` | `var(--mc-surface)` | 2px solid `var(--mc-accent)` + `box-shadow: 0 0 16px var(--mc-accent-glow)` | ▶ accent | pointer | abre modal de iniciar |
| `locked` | `var(--mc-surface)` | 1.5px solid `var(--mc-rule)` | 🔒 muted | not-allowed; opacity 0.4 | no-op |

### Modal de iniciar fase
```
┌─────────────────────────────────┐
│  Fase 7 — Tanque                │  ← título dinâmico
│                                 │
│  ★★★                            │  ← dificuldade visual
│                                 │
│       [CANCELAR]  [JOGAR]       │
└─────────────────────────────────┘
```

### Hierarquia HTML
```html
<div id="screen-sp-map" class="screen" style="background:var(--mc-bg);flex-direction:column;align-items:stretch;">
  <div style="padding:14px 20px;display:flex;align-items:center;">
    <button class="screen-back-btn" onclick="showScreen('solo-hub')">← <span id="sm-back-label" class="back-label">VOLTAR</span></button>
  </div>
  <div style="padding:0 20px 20px;text-align:center;">
    <div id="sm-title" style="<title-style>">MAPA SOLO</div>
  </div>
  <div id="sm-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:0 20px 80px;max-width:600px;width:100%;margin:0 auto;box-sizing:border-box;">
    <!-- 15 cards gerados dinamicamente OU repetidos manualmente -->
    <!-- Card N (template):  -->
    <button id="sm-card-1" data-level="1" data-state="locked" onclick="window.openSPLevel(1)" style="<card-base-style>">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span id="sm-card-1-num"   style="font:700 16px var(--mc-font-mono);color:var(--mc-ink);">1</span>
        <span id="sm-card-1-state" style="font-size:14px;">🔒</span>
      </div>
      <div id="sm-card-1-name" style="font-family:var(--mc-font-serif);font-size:11px;color:var(--mc-muted);margin-top:6px;text-align:left;">Recruta</div>
    </button>
    <!-- ... cards 2..15 idênticos com IDs sm-card-N -->
  </div>
</div>

<!-- Modal de iniciar fase -->
<div id="sm-start-modal" class="mc-modal-overlay" style="display:none;<overlay-style>">
  <div class="mc-modal-box" style="<box-style>">
    <div id="sm-start-title"      style="<title-style>">Fase X — Nome</div>
    <div id="sm-start-difficulty" style="<diff-style>">★★★</div>
    <div style="display:flex;gap:10px;margin-top:16px;">
      <button id="sm-start-cancel" onclick="window.closeSPStartModal()" style="<btn-secondary-style>">CANCELAR</button>
      <button id="sm-start-play"   onclick="window.confirmStartSPLevel()" style="<btn-primary-style>">JOGAR</button>
    </div>
  </div>
</div>
```

### Geração dinâmica (recomendada)
Para evitar 15 blocos repetidos no HTML, **SP-7.1 deve gerar via JS** ao entrar na tela:
```
function buildSPMap():
  grid = el('sm-grid')
  grid.innerHTML = ''
  for n in 1..15:
    card = createElement('button')
    card.id = 'sm-card-' + n
    card.dataset.level = n
    card.onclick = () => window.openSPLevel(n)
    card.innerHTML = '<inner template>'
    grid.appendChild(card)

function refreshSPMap():
  max = window.spProgress.max_level_completed
  for n in 1..15:
    state = (n <= max) ? 'completed' : (n === max + 1) ? 'current' : 'locked'
    applyCardState(el('sm-card-' + n), state)
```

### Inventário de IDs
| ID | Propósito | i18n |
|---|---|---|
| `sm-back-label` | "VOLTAR" | `back` |
| `sm-title` | "MAPA SOLO" | `sp_map_title` |
| `sm-grid` | container | — |
| `sm-card-N` (N=1..15) | botão de cada fase | — |
| `sm-card-N-num` | número da fase | hardcoded |
| `sm-card-N-name` | nome via i18n | `sp_lvlN_name` (criadas em SP-7.4) |
| `sm-card-N-state` | ícone ✓/▶/🔒 | hardcoded |
| `sm-start-modal` | overlay | — |
| `sm-start-title` | "Fase X — Nome" | dinâmico |
| `sm-start-difficulty` | estrelas | hardcoded por fase |
| `sm-start-cancel` | "CANCELAR" | `cancel` |
| `sm-start-play` | "JOGAR" | `sp_play` |

### Handlers JS
| Elemento | Ação |
|---|---|
| back-btn | `showScreen('solo-hub')` |
| `sm-card-N` | `window.openSPLevel(N)` |
| `sm-start-cancel` | `window.closeSPStartModal()` |
| `sm-start-play` | `window.confirmStartSPLevel()` |

### Funções a expor (SP-7.1, SP-7.3)
```
window.openSPLevel(n):
  state = el('sm-card-' + n).dataset.state
  if (state === 'locked') return   // ignora click

  pendingLevel = n
  el('sm-start-title')      .textContent = t('sp_phase') + ' ' + n + ' — ' + t('sp_lvl' + n + '_name')
  el('sm-start-difficulty') .textContent = repeat('★', getDifficulty(n))   // tabela hardcoded
  show sm-start-modal

window.closeSPStartModal():
  hide sm-start-modal
  pendingLevel = null

window.confirmStartSPLevel():
  level = pendingLevel
  hide sm-start-modal
  window.spActiveLevel = level   // usado em SP-8.1
  socket.emit('single_player_start', { level, token: getAuthToken()||null })
  // server cria room → match_found → entra no game-area normalmente
```

### Tabela de dificuldades (hardcoded em SP-7.1)
```js
const SP_DIFFICULTY = {
  1:1, 2:1, 3:1,
  4:2, 5:2, 6:2,
  7:3, 8:3, 9:3, 10:3,
  11:4, 12:4, 13:4,
  14:5, 15:5
};
```
(Bate com a coluna "Dificuldade" da tabela §5 do SP_PLANNING.md.)

### Animação de "fase desbloqueada" (SP-7.5)
Ao receber `socket.on('sp_level_completed', { level })`:
```
window.spProgress.max_level_completed = max(spProgress.max_level_completed, level)
queueUnlockAnimation(level + 1)   // armazena para tocar quando entrar na sp-map

// quando refreshSPMap roda:
if (queuedUnlock === n):
  card.style.animation = 'sp-unlock 600ms ease'
  // keyframes: scale 0.9 → 1.05 → 1.0; box-shadow flash com mc-accent-glow
```

Definir `@keyframes sp-unlock` em **CSS inline** dentro de um `<style>` na própria tela `#screen-sp-map` (regra do projeto: não tocar no `<style>` global existente).

---

## 5. Tabela de funções a expor no `window`

> Resumo para SP-4..SP-7 implementarem. Ordem é a sugerida de implementação.

| Função | Sessão que cria | Usa |
|---|---|---|
| `window.openSoloHub()` | SP-6.2 | game-mode → solo-hub |
| `window.selectMultiplayerMode(mode)` | SP-5.2 | multiplayer-mode |
| `window.startMatchmakingMP()` | SP-5.2 | multiplayer-mode |
| `window.loadSPProgress()` | SP-6.2 | solo-hub, sp-map |
| `window.refreshSoloHub()` | SP-6.3 | solo-hub |
| `window.continueSolo()` | SP-6.3 | botão CONTINUAR |
| `window.openNewSoloModal()` | SP-6.4 | botão NOVO |
| `window.closeNewSoloModal()` | SP-6.4 | modal NOVO |
| `window.confirmNewSolo()` | SP-6.4 | modal NOVO |
| `window.buildSPMap()` | SP-7.1 | sp-map (executa 1×) |
| `window.refreshSPMap()` | SP-7.1 | sp-map (toda entrada) |
| `window.openSPLevel(n)` | SP-7.3 | card do mapa |
| `window.closeSPStartModal()` | SP-7.3 | modal start |
| `window.confirmStartSPLevel()` | SP-7.3 | modal start |
| `window.startSPLevel(n)` | SP-6.3 / SP-7.3 | atalho do CONTINUAR |
| `window.spProgress` | SP-6.2 | objeto global `{ max_level_completed, isGuest }` |
| `window.spActiveLevel` | SP-7.3 | int — usado em SP-8.1 (game-over) |

---

## 6. Fluxos de navegação (resumo)

```
menu
  └─[NOVO JOGO]─▶ game-mode
                    ├─[SOLO]─▶ solo-hub
                    │           ├─[CONTINUAR]─▶ (direto pra fase) ─▶ matchmaking ─▶ game-area
                    │           │                            ou
                    │           │                       sp-map (se max=15)
                    │           └─[NOVO]──────▶ modal confirma ─▶ POST /sp/reset (se logado) ─▶ fase 1
                    │
                    └─[ONLINE]─▶ multiplayer-mode
                                  ├─[Casual]   (seleciona)
                                  ├─[Ranqueada](seleciona)
                                  └─[FIND MATCH]─▶ matchmaking ─▶ game-area
```

E o pós-partida (SP-8.1):
```
game-over (vitória, em fase N)
  ├─[PRÓXIMA FASE]─▶ window.startSPLevel(N+1)
  └─[VOLTAR AO MAPA]─▶ sp-map (com animação de unlock se houver)

game-over (derrota, em fase N)
  ├─[TENTAR DE NOVO]─▶ window.startSPLevel(N)
  └─[VOLTAR AO MAPA]─▶ sp-map
```

---

## 7. Notas de implementação

### Ordem recomendada para evitar bugs visuais
1. **SP-4.1** primeiro (game-mode reformatada) — simples, baixo risco
2. **SP-5.1+5.2+5.3** (multiplayer-mode) — reaproveita lógica existente
3. **SP-7.1+7.2** antes de SP-6 — assim o `continueSolo()` já tem para onde apontar
4. **SP-6** depois — pode então fazer fluxo completo solo-hub → sp-map
5. **SP-8** ao final — game-over depende de tudo estar pronto

### Feature flag `SP_ENABLED`
Enquanto `SP_ENABLED === false` (default até SP-8.4):
- `gm-card-solo` e `gm-card-online` **ainda aparecem** (usuário não vê diferença visual desde SP-4.1)
- MAS `gm-card-solo.onclick` redireciona para a fluxo antigo (legado) OU mostra mensagem "em breve"
- Decisão: como SP-4.1 já reformata a game-mode, a flag protege apenas o **fluxo Solo completo**. Em SP-4.1, deixar `gm-card-solo` com handler placeholder; substituir pelo `openSoloHub()` real só em SP-6.2.

### Acessibilidade
- Cards: usar `<button>` (não `<div>`) → tab navigation funciona
- Modais: `aria-modal="true"`, focus trap (já implementado em outros modais do projeto)
- Estados visuais não devem depender só de cor (✓/▶/🔒 são ícones distintos além da cor)

### Mobile
- `sm-grid`: 3 colunas em <600px; 5 colunas em ≥768px (`@media` ou JS-driven)
- Cards do mapa: min-height 80px; tap target ≥44px
