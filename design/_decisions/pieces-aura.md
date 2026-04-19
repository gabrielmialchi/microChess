# Decisão de estilo · Peças (aura)

**Status:** fixado em 2025 · aplicar em todas as telas 02+ e em todas as skins futuras.

## Regra

Peças do tabuleiro não têm outline nem sombra. Têm **aura (glow)** em cor complementar oposta à cor da peça.

- **Brancas (♙♖♘♗♕♔)** · aura laranja quente · `#F56200`
- **Pretas (♟♜♞♝♛♚)** · aura azul/violeta · `#4538FF`
- Raio: 10px · Intensidade: 80%
- Sem outline · Sem sombra

## CSS base

```css
:root {
  --mc-piece-aura-w: #F56200;   /* glow das brancas */
  --mc-piece-aura-b: #4538FF;   /* glow das pretas */
  --mc-fx-glow-w: 0 0 10px rgba(245,98,0,0.8), 0 0 20px rgba(245,98,0,0.8);
  --mc-fx-glow-b: 0 0 10px rgba(69,56,255,0.8), 0 0 20px rgba(69,56,255,0.8);
}

.mc-board .cell .p-w {
  color: #ffffff;
  -webkit-text-stroke: 0 transparent;
  text-shadow: var(--mc-fx-glow-w);
}
.mc-board .cell .p-b {
  color: #18130c;
  -webkit-text-stroke: 0 transparent;
  text-shadow: var(--mc-fx-glow-b);
}
```

## Variações por skin

Skins futuras podem trocar as duas cores da aura, mas mantêm:
- Sempre **par complementar** (quente vs. frio / saturadas)
- Sempre **mesma intensidade e raio** nas duas (simetria visual)
- Sempre **sem outline e sem sombra** (aura é o único efeito)

### Exemplos de pares para skins
| Skin           | Aura brancas | Aura pretas  |
|----------------|--------------|--------------|
| **Signature**  | `#F56200`    | `#4538FF`    |
| Solar/Lunar    | `#FFC84A`    | `#3A6BFF`    |
| Magma/Ice      | `#FF3B2F`    | `#19C8FF`    |
| Sunset/Teal    | `#FF6A33`    | `#00B2A9`    |

## Notas para handoff

- A aura é feita com **duas camadas** de `text-shadow` com mesmo blur/cor (uma em `10px`, outra em `20px`). Isso dá densidade sem apagar o desenho da peça.
- Em tabuleiros pequenos (<32px de casa), reduzir raio proporcionalmente (manter ~1/3 do tamanho da casa).
- Em estado `check` ou `last-move`, a aura continua normal; o destaque vem da **casa**, não da peça.
