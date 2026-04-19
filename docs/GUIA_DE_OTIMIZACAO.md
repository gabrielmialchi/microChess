# Guia de Otimização — microChess
> Garantir que o jogo rode bem em qualquer dispositivo: celular antigo, PC com RAM limitada, rede lenta ou instável.

---

## Diagnóstico atual (o que já está bom)

| Item | Status | Detalhe |
|------|--------|---------|
| Peças são Unicode | ✅ | Zero imagens — sem HTTP requests para assets visuais |
| Viewport mobile correto | ✅ | `maximum-scale=1.0, user-scalable=no` |
| PWA + Service Worker | ✅ | Shell cacheado; funciona offline parcialmente |
| Font preconnect | ✅ | `<link rel="preconnect">` para Google Fonts |
| `font-display=swap` | ✅ | No URL do Google Fonts — texto visível enquanto fonte carrega |
| SQLite WAL mode | ✅ | `microchess.db-wal` presente — escritas não bloqueiam leituras |
| Índices no banco | ✅ | `idx_players_mmr`, `idx_matches_created`, etc. |
| Scripts ao final do body | ✅ | `auth-frontend.js`, `rank-ui.js`, `replay-ui.js` antes de `</body>` |
| Sem frameworks JS | ✅ | Vanilla JS — sem overhead de React/Vue/Angular |
| clamp() no tamanho das peças | ✅ | `font-size: clamp(32px, 11vw, 56px)` — adapta ao viewport |

---

## Problemas identificados e soluções

### 🔴 CRÍTICO

#### 1. Animação de peças usa `left/top` em vez de `transform`

**Localização:** `index.html` linha ~536
```css
/* Atual — causa layout recalculation a cada frame */
.piece {
    position: absolute;
    will-change: left, top;   /* ← errado */
    transition: left 0.25s, top 0.25s;
}
```

**Problema:** `left` e `top` disparam o pipeline completo de renderização (Layout → Paint → Composite) a cada frame da animação. Em celulares de entrada, isso causa travamentos visíveis.

**Solução:**
```css
.piece {
    position: absolute;
    will-change: transform;   /* ← correto */
    transition: transform 0.25s var(--mc-ease-out);
    /* Posicionar via transform: translate(Xpx, Ypx) no JS */
}
```

No JS, ao mover peça:
```js
// Atual:
el.style.left = `${x * cellSize}px`;
el.style.top  = `${y * cellSize}px`;

// Melhorado:
el.style.transform = `translate(${x * cellSize}px, ${y * cellSize}px)`;
```

**Impacto:** Animações passam para o compositor (GPU) — sem layout recalculation. Melhora significativa em dispositivos de entrada.

---

#### 2. Twemoji carregado mas de uso limitado

**Localização:** `index.html` linha 1698
```html
<script src="https://cdn.jsdelivr.net/npm/twemoji@14.0.2/dist/twemoji.min.js"></script>
```

**Problema:** A biblioteca Twemoji pesa ~1.7MB minificada e substitui emojis por imagens SVG. No microChess, as peças são caracteres Unicode de xadrez (♔♚♛♜♝♞♟) — não emojis coloridos. Verificar se o Twemoji está sendo acionado na prática.

**Como verificar:**
```js
// No console do browser (F12):
twemoji.parse(document.body);  // se não mudar nada visualmente, não está sendo usado
```

**Se não estiver sendo usado:** Remover o `<script>` reduz ~1.7MB no carregamento inicial.

**Se estiver sendo usado (flags ou outros emojis):** Carregar de forma lazy:
```js
// Carregar apenas quando necessário
function loadTwemoji(callback) {
    if (window.twemoji) { callback(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/twemoji@14.0.2/dist/twemoji.min.js';
    s.onload = callback;
    document.head.appendChild(s);
}
```

---

### 🟡 IMPORTANTE

#### 3. Fontes em excesso

**Localização:** `index.html` linha 14
```html
<link href="https://fonts.googleapis.com/css2?
  family=Cinzel:wght@400;600;700;900
  &family=Cinzel+Decorative:wght@700
  &family=IBM+Plex+Mono:wght@400;600
  &family=Inter:wght@300;400;500;600;700;800
  &family=JetBrains+Mono:wght@400;500;600;700
  &display=swap" rel="stylesheet">
```

**Problema:** 5 famílias com múltiplos pesos = potencialmente 15–20 arquivos de fonte. Em redes lentas (3G), isso adiciona 2–5s no primeiro carregamento.

**Auditoria — verificar quais pesos são realmente usados:**
```bash
# No terminal, buscar usos de cada fonte no código:
grep -o "font-weight:[0-9]*\|wght@[0-9;]*" html/index.html | sort | uniq
```

**Solução — carregar apenas os pesos usados:**
```html
<!-- Exemplo: se Inter só usa 400 e 600 -->
family=Inter:wght@400;600
<!-- Em vez de: wght@300;400;500;600;700;800 -->
```

**Solução adicional — `font-display: optional`** para fontes não-críticas:
- `Cinzel` e `IBM Plex Mono`: críticas para a identidade visual → `swap` (ok)
- `Inter` e `JetBrains Mono`: se forem apenas para elementos secundários → `optional` (não bloqueia renderização)

```html
family=Inter:ital,wght@0,400;0,600&display=optional
```

---

#### 4. Sem compressão GZIP no servidor Express

**Localização:** `server/server.js` — ausente

**Problema:** O `index.html` tem ~5035 linhas (~180kb não comprimido). Sem GZIP, cada novo usuário baixa os 180kb inteiros.

**Solução:** Adicionar o middleware `compression` ao servidor:
```bash
cd server && npm install compression
```

```js
// server.js — logo após os requires, antes de qualquer app.use():
const compression = require('compression');
app.use(compression());
```

**Impacto estimado:**
| Arquivo | Sem GZIP | Com GZIP | Redução |
|---------|----------|----------|---------|
| index.html | ~180kb | ~35–45kb | ~75% |
| auth-frontend.js | ~18kb | ~5kb | ~72% |
| socket.io.min.js | ~84kb | ~26kb | ~69% |

**Total estimado:** de ~300kb para ~80kb no primeiro carregamento.

---

#### 5. Socket.io sem compressão de payload

**Localização:** `server/server.js` linha 18

**Estado atual:**
```js
const io = new Server(server, { cors: { origin: process.env.ALLOWED_ORIGIN || '*' } });
```

**Problema:** O `game_state` broadcast carrega o exército completo a cada turno — em JSON puro, sem compressão.

**Solução:** Ativar `perMessageDeflate` (compressão WebSocket):
```js
const io = new Server(server, {
    cors: { origin: process.env.ALLOWED_ORIGIN || '*' },
    perMessageDeflate: {
        threshold: 1024,   // comprimir mensagens > 1kb
    },
});
```

**Solução complementar — broadcast apenas o diff:**
Em vez de enviar o estado completo a cada turno, enviar apenas o que mudou:
```js
// Ao invés de broadcast(room) enviar tudo:
// Comparar com estado anterior e enviar só as diferenças
// Ex: { pieceMoved: 'wq1', from: {x:0,y:0}, to: {x:2,y:2}, eliminated: ['bk1'] }
```
> Isso é uma refatoração maior — avaliar custo/benefício. Para partidas de 4×4 com no máximo 5 peças, o payload já é pequeno (~500 bytes).

---

#### 6. `flag-icons` CSS completo carregado

**Localização:** `index.html` linha 15
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.0.0/css/flag-icons.min.css">
```

**Problema:** O CSS de flag-icons contém ~250 bandeiras. O microChess usa 9 (PT, EN, ES, DE, IT, RU, JA, KO, ZH). O arquivo completo pesa ~60kb.

**Solução:** Extrair apenas os 9 seletores necessários e colocar inline:
```css
/* Apenas as bandeiras usadas */
.fi { background-size: contain; background-position: 50%; background-repeat: no-repeat; display: inline-block; ... }
.fi-br { background-image: url("https://...br.svg"); }
.fi-us { background-image: url("https://...us.svg"); }
/* ... 7 mais */
```
> Reduz de ~60kb para ~2kb.

---

### 🟢 MELHORIAS MENORES

#### 7. Service Worker — versionar o cache

**Estado atual:** `CACHE_NAME = 'microchess-v1'` (hardcoded)

**Problema:** Após deploy de nova versão, usuários que têm o SW instalado podem servir arquivos antigos do cache.

**Solução:** Incluir hash do build ou timestamp no nome do cache:
```js
const CACHE_NAME = 'microchess-2026042001'; // data do build como versão
```

Ou, melhor ainda: adicionar um endpoint `/version` no servidor que retorna a versão atual, e o SW compara na ativação.

---

#### 8. Preload das fontes críticas

**Estado atual:** Apenas `<link rel="preconnect">` — o download da fonte só começa quando o CSS é processado.

**Melhoria:** Adicionar `preload` para as fontes mais críticas (Cinzel, usada no logo e títulos):
```html
<link rel="preload" as="font" type="font/woff2" crossorigin
      href="https://fonts.gstatic.com/s/cinzel/v23/8vIU7ww63mVu7gtR-kwKxNvkNOjw-tbnTYrvDE5ZdqU.woff2">
```
> A URL exata pode ser obtida inspecionando a aba Network do DevTools com a fonte carregando.

---

#### 9. `contain: layout` no board

**Melhoria:** Adicionar `contain` nas células do board para isolar o escopo de reflow:
```css
.mc-board .cell {
    contain: layout style;   /* reflows dentro da célula não afetam o resto da página */
}
```

---

#### 10. Lazy load de telas não críticas

**Estado atual:** Todo o HTML de todas as telas (leaderboard, replay, histórico, perfil) está carregado no DOM desde o início, apenas oculto.

**Impacto:** O DOM inicial tem ~5000 nós — mais do que o necessário para a primeira tela (menu).

**Solução parcial — renderizar telas dinamicamente:**
```js
// Em vez de ter o HTML do leaderboard no DOM:
// Gerar o HTML da tela no momento em que o usuário a solicita
function showLeaderboard() {
    const screen = document.getElementById('screen-leaderboard');
    if (!screen.dataset.initialized) {
        screen.innerHTML = buildLeaderboardHTML();
        screen.dataset.initialized = 'true';
    }
    // ...
}
```
> Refatoração de impacto médio — avaliar se o ganho compensa a complexidade.

---

## Checklist por tipo de dispositivo

### Celular de entrada (< 2GB RAM, CPU quad-core 2016–2018)
- [ ] Animações fluidas → fix do `transform` vs `left/top` (item 1)
- [ ] Carregamento < 5s em 3G → GZIP (item 4) + reduzir fontes (item 3)
- [ ] Sem crash por excesso de DOM → avaliar lazy load (item 10)
- [ ] Touch responsivo → viewport já configurado ✅

### Celular médio (2–4GB RAM, 2019–2021)
- [ ] Todos os itens acima
- [ ] Animações com 60fps → `will-change: transform` (item 1)

### PC com conexão lenta (3G/rural)
- [ ] GZIP obrigatório (item 4)
- [ ] Twemoji lazy ou removido (item 2)
- [ ] flag-icons inline (item 6)
- [ ] Service Worker carrega shell do cache na segunda visita ✅

### PC moderno / fibra
- [ ] Sem impacto perceptível na ausência das otimizações
- [ ] Foco na latência do Socket.io (item 5)

---

## Como medir antes e depois

### Lighthouse (Chrome DevTools)
```
1. Abrir http://localhost:3000 no Chrome
2. F12 → aba "Lighthouse"
3. Selecionar: Performance + Best Practices + PWA
4. "Analyze page load"
5. Anotar scores antes de qualquer mudança
6. Aplicar otimizações e comparar
```

**Metas:**
| Métrica | Antes (estimado) | Meta |
|---------|-----------------|------|
| FCP (First Contentful Paint) | ~2.5s (sem GZIP) | < 1.5s |
| LCP (Largest Contentful Paint) | ~3s | < 2.5s |
| TBT (Total Blocking Time) | ~200ms | < 100ms |
| CLS (Layout Shift) | baixo (sem imagens) | < 0.1 |
| Performance Score | ~65–75 | > 85 |

### WebPageTest
- `webpagetest.org` → testar com "Mobile 3G Slow" para simular o pior caso
- Comparar waterfall antes/depois do GZIP e remoção do Twemoji

### Chrome DevTools — Performance tab
```
1. F12 → aba "Performance"
2. Gravar enquanto arrasta uma peça no tabuleiro
3. Verificar: frames a 60fps? Há "Layout" (vermelho) a cada frame? → problema do left/top
4. Após fix do transform: "Composite" apenas (verde) → correto
```

---

## Ordem de implementação recomendada

| # | Ação | Arquivo | Esforço | Impacto |
|---|------|---------|---------|---------|
| 1 | Adicionar `compression` ao Express | `server/server.js` | 10min | Alto |
| 2 | Verificar e remover Twemoji se não usado | `html/index.html` | 5min | Alto |
| 3 | Reduzir pesos de fonte desnecessários | `html/index.html` | 15min | Médio |
| 4 | Fix animação: `transform` em vez de `left/top` | `html/index.html` | 30min | Alto (mobile) |
| 5 | Inline das 9 flag-icons | `html/index.html` | 20min | Médio |
| 6 | Versionar cache do Service Worker | `html/sw.js` | 10min | Médio |
| 7 | Ativar `perMessageDeflate` no Socket.io | `server/server.js` | 5min | Baixo-Médio |
| 8 | Preload da fonte Cinzel | `html/index.html` | 10min | Baixo |
| 9 | `contain: layout style` nas células | `html/index.html` | 5min | Baixo |
| 10 | Lazy load de telas não críticas | `html/index.html` | 2–4h | Médio |

**Prioridade imediata (menos de 1 hora de trabalho, maior impacto):**
Itens 1, 2 e 3 juntos provavelmente reduzem o tempo de carregamento em 50–70% para usuários em redes lentas.
