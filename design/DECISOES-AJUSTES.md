# microChess — Decisões dos Ajustes (P1–P4)

Registro das specs aprovadas para transporte ao `html/index.html`.
Regra do projeto: **não reescrever** o arquivo — só inserir/editar blocos pontuais; CSS novo inline ou em bloco `<style>` próprio.

---

## ✅ P1 / S28 — Contorno das peças  · APROVADO

Contorno via `text-shadow` 8-direções, 2 camadas (1.4px) + aura. Brancas com contorno escuro, pretas com contorno creme. Independente de tema/casa.

**Aplicar:** substitui `.piece.white` / `.piece.black` (~linha 622). Trocar `filter:var(--white-glow)` pelo `text-shadow`. As vars `--white-glow/--black-glow` continuam usadas por inventário/seleção — não remover, só deixar de aplicar no glyph do tabuleiro.

```css
.piece.white {
  color: #f8f4ee;
  filter: none;
  text-shadow:
    0.7px 0 0 #14100a, -0.7px 0 0 #14100a, 0 0.7px 0 #14100a, 0 -0.7px 0 #14100a,
    0.7px 0.7px 0 #14100a, 0.7px -0.7px 0 #14100a, -0.7px 0.7px 0 #14100a, -0.7px -0.7px 0 #14100a,
    1.4px 0 0 #14100a, -1.4px 0 0 #14100a, 0 1.4px 0 #14100a, 0 -1.4px 0 #14100a,
    1.4px 1.4px 0 #14100a, 1.4px -1.4px 0 #14100a, -1.4px 1.4px 0 #14100a, -1.4px -1.4px 0 #14100a,
    0 0 8px rgba(245,98,0,0.9), 0 0 16px rgba(245,98,0,0.9);
}
.piece.black {
  color: #15110b;
  filter: none;
  text-shadow:
    0.7px 0 0 #f4ead7, -0.7px 0 0 #f4ead7, 0 0.7px 0 #f4ead7, 0 -0.7px 0 #f4ead7,
    0.7px 0.7px 0 #f4ead7, 0.7px -0.7px 0 #f4ead7, -0.7px 0.7px 0 #f4ead7, -0.7px -0.7px 0 #f4ead7,
    1.4px 0 0 #f4ead7, -1.4px 0 0 #f4ead7, 0 1.4px 0 #f4ead7, 0 -1.4px 0 #f4ead7,
    1.4px 1.4px 0 #f4ead7, 1.4px -1.4px 0 #f4ead7, -1.4px 1.4px 0 #f4ead7, -1.4px -1.4px 0 #f4ead7,
    0 0 8px rgba(69,56,255,0.9), 0 0 16px rgba(69,56,255,0.9);
}
```
> Aplicar a mesma lógica de contorno nas peças de inventário/replay/avatar se quiser consistência total (opcional).

---

## ✅ P2 / S32 — Coesão menu ↔ jogo · APROVADO

Causa: dois sistemas de tema desencontrados. Correção em 3 partes (ajuste fino).

```css
/* 1 · Aquecer a paleta dark do JOGO (vars legadas, bloco :root sem atributo, ~linha 312) */
:root {
  --bg: #0b0907;            /* era #080808 */
  --bg2: #16110b;
  --board-gap: #1a1510;     /* era #1e1e1e */
  --cell-light: #2a231a;    /* era #272727 (cinza frio) */
  --cell-dark:  #4c3c28;    /* era #141414 */
  --topbar-bg:  #18140e;
  --accent:     #ff6a33;    /* era #d4a832 (dourado) */
  --accent-glow: rgba(255,106,51,.40);
  --accent-dim:  rgba(255,106,51,.15);
}

/* 2 · Fundo do game-area: radial quente no lugar do preto puro (body, ~linha 360 / body::before ~374) */
body { background: radial-gradient(ellipse at 50% 32%, #16110b 0%, #0b0907 100%); }
```
```js
/* 3 · Init de tema (~linha 4581): nunca cair no fallback sem atributo */
//  …else if (mq && mq.matches) apply('dark');
    else apply('light');   // garante paleta coesa sempre
```
> Tema **light** já é coeso (creme + marrom/laranja). Opcional: alinhar o accent light do jogo de `#b06a10` para o laranja do menu `#ff5a1f`.

---

## ✅ P3 / S29 — Tipografia · APROVADO (Opção A — Sans unificado)

De 5 fontes para **2**: **Inter** (texto/títulos) + **JetBrains Mono** (números/labels). Remove Cinzel, Cinzel Decorative e IBM Plex Mono.

| Papel | Fonte | Peso | Tamanho | Tracking |
|---|---|---|---|---|
| Logo | Inter | 800 | 40px | -1.5px |
| Título de tela | Inter | 700 | 13px | .18em · UPPERCASE |
| H1 / seção | Inter | 800 | 27px | -.02em |
| Subtítulo | Inter | 500 | 13px | — (muted) |
| Corpo | Inter | 400 | 15px | 1.6 lh |
| Label / eyebrow | JetBrains Mono | 500 | 11px | .16em · UPPERCASE |
| Número / timer / código | JetBrains Mono | 600 | — | tabular-nums |

**Aplicar:**
- `<head>`: remover `Cinzel`, `Cinzel+Decorative`, `IBM+Plex+Mono` do `<link>` do Google Fonts; manter `Inter` + `JetBrains+Mono` (adicionar peso 800 ao Inter).
- Find-replace nas fontes legadas: `'Cinzel Decorative'` → Inter (título de tela), `'Cinzel'` → `'Inter'`, `'IBM Plex Mono'` → `'JetBrains Mono'`. Inclui `body{font-family:'Cinzel'}` (~linha 361).
- Conferir TODAS as telas após troca (back labels, botões, fases, HUD) — corpo em Inter, números em JetBrains.

---

## ✅ P4 / S27 — Tutorial · SPEC DEFINIDA

Entregável de UX (código depois). Tutorial **totalmente roteirizado**: o jogador vive o loop das 3 fases uma vez; nuances entram como mini-situações preparadas na mesma sessão. Ver `P4 - Tutorial Spec.dc.html`.

**Decisões:**
- **Gatilho:** automático na 1ª partida pós-conta + acessível depois em Configurações ▸ Como Jogar.
- **Dica:** overlay com backdrop escurecido + spotlight no elemento + card de dica na base. Pular sempre no topo direito; pontos de progresso.
- **Trava:** mista — passos-chave (comprar, posicionar, arrastar, promover) bloqueiam até a ação certa; demonstrações (duelos, vácuo, morte súbita) são livres.
- **Bot:** totalmente roteirizado (movimentos e dados fixos).
- **Arrastar:** glow pulsante na peça + trilha pontilhada animada até a casa-alvo + ring laranja pulsante + rótulo "arraste ▸". Toque sem arrastar → trilha repete 1×.
- **Pular:** sempre visível → confirma "Pular tutorial?" → menu.
- **Fim:** tela "Você aprendeu!" com chips das regras + CTA "Jogar ranqueada".

**10 passos (regras nas 3 fases):**
1. DRAFT — Bônus (Q+5·R+4·N+3·B+2·P+1·Rei+4) · *bloqueia*
2. POSITION — Seu território (2 fileiras) · *bloqueia*
3. ACTION — Simultâneo + arrastar · *bloqueia*
4. ACTION — Duelo: 1d6 + bônus · *livre*
5. ACTION — Ordem dos duelos: maior bônus 1º; **bônus iguais → rolagem de desempate decide a ordem** · *livre*
6. ACTION — Empate = vácuo (ambas saem) · *livre*
7. ACTION — Rei vence empates · *livre*
8. ACTION — **Promoção: Peão na última fileira vira RAINHA (+5)** · *bloqueia*
9. MORTE SÚBITA — Rei×Rei, 3 rodadas de 1d6 SEM bônus; mais vitórias vence; empate nas 3 = DRAW · *livre*
10. FIM — "Você aprendeu!" + CTA · —

> Correções do Gabriel ao doc de regras: peão promovido vira **Rainha** (não Peão+2); empate de prioridade na ordem de duelos usa **rolagem de desempate**.

**⚠ Rei (ajuste):** custo **0** e **bônus dinâmico** conforme entra em combate (ataca · colide · é atacado sem se mover). No passo 1 (apresentação de bônus), o valor do Rei deve ser **renderizado a partir do código** — não fixar "+4" — para ser corrigido/ajustado lá.

**Padrão visual (resposta à dúvida):** o tabuleiro **nunca some**. O backdrop escurece só o redor e abre um *spotlight* (recorte claro) sobre o elemento em foco, que continua **interativo**. Modais legítimos (loja, duelo, conclusão) entram à frente com o tabuleiro escurecido atrás. **Como avança:** o jogador executa a ação real no elemento em foco (comprar / arrastar / promover) e isso libera o passo — **sem botão "próximo"** nos passos bloqueantes; passos livres (duelos, vácuo, morte súbita) avançam ao tocar/rolar.
