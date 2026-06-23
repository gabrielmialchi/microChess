# Plano de Localização do Tutorial (TUT2)

## Objetivo
Tutorial encenado (`TUT2` em `html/index.html`) disponível nos **10 idiomas** do jogo:
`pt · en · es · de · it · ru · ja · ko · zh · fr`.

**Estado atual:** `pt` e `en` completos. **Faltam 8:** `es, de, it, ru, ja, ko, zh, fr`
(hoje caem para `pt` via fallback do `_tt`).

---

## Arquitetura de strings

1. **Rótulos do duelo** — JÁ localizados nos 10 idiomas via objeto global `T` / `window.t()`
   (`conflict`, `duel_space`, `duel_tiebreak`, `duel_king_defense`, `duel_king_capture`,
   `sudden_death`, `white_wins`, `black_wins`, `draw`, `you`, `opponent`, `resolve`,
   `tap_roll`, `pts`, `piece_*`). **Nada a fazer** — o duelo do tutorial já troca de idioma.

2. **Texto dos passos do tutorial** — tabela isolada `TUT_TXT` (em `html/index.html`, ver
   `var TUT_TXT = {`). Helper `_tt(key)` lê `localStorage.mc_lang`; cai para `pt` se faltar.
   **É só aqui que precisamos adicionar os 8 blocos de idioma.**

---

## Chaves a traduzir — **49 por idioma**

| Grupo | Chaves |
|-------|--------|
| HUD/fase (6) | `hud_draft`, `hud_position`, `hud_action`, `hud_duel`, `hud_promo`, `hud_sd` |
| HUD/pronto (3) | `opp_status`, `opp_meta`, `ready_btn` |
| Passo 0 — draft (3) | `s0_title`, `s0_body`, `s0_cta` |
| Passo 1 — pronto (3) | `s1_title`, `s1_body`, `s1_cta` |
| Passo 2 — posição (3) | `s2_title`, `s2_body`, `s2_cta` |
| Passo 3 — ação/colisão (3) | `s3_title`, `s3_body`, `s3_cta` |
| Passo 5 — ordem (2) | `s5_title`, `s5_body` |
| Passo 6 — vácuo (2) | `s6_title`, `s6_body` |
| Passo 7 — Rei (2) | `s7_title`, `s7_body` |
| Passo 8 — promoção (3) | `s8_title`, `s8_body`, `s8_cta` |
| Passo 9 — Rainha×Rei (3) | `s9_title`, `s9_body`, `s9_cta` |
| Passo 10 — Morte Súbita (2) | `s10_title`, `s10_body` |
| Tela final (3) | `end_title`, `end_sub`, `end_btn` |
| Chips resumo (6) | `chip1`…`chip6` |
| Pular (5) | `skip_btn`, `skip_title`, `skip_sub`, `skip_yes`, `skip_no` |

> Passos 4 e 11 não têm card (telas de duelo/Morte Súbita) — sem chaves próprias.

### Regras de tradução (NÃO quebrar)
- **Manter as tags `<b>…</b>`** dentro dos `*_body` (renderizadas como HTML).
- **Manter os símbolos** `▸` (CTAs), `→` (títulos de promoção), `🎲` se houver.
- **Escapar apóstrofos** com `\'` (relevante p/ `fr`/`it`: `l\'armée`, `dell\'inizio`).
- Os valores `<b>Torre (+4)</b>`, `<b>Peão (+1)</b>`, `<b>Rainha (+5)</b>` traduzem o nome da
  peça mas **mantêm o número do bônus**.
- Atenção ao **comprimento**: cards têm largura limitada (mobile 360px). `de`/`ru` tendem a
  estourar; CJK costuma caber. Encurtar se necessário sem perder o sentido.

---

## Processo de execução (por sessão)
1. Abrir `html/index.html`, localizar `var TUT_TXT = {` (logo após o bloco `en: { … },`).
2. Para cada idioma da sessão: **duplicar o bloco `en`** e traduzir os 49 valores,
   inserindo o novo bloco `xx: { … },` antes do `};` que fecha o `TUT_TXT`.
3. **Não** tocar nos rótulos do duelo (vêm de `T`) nem na lógica do `TUT2`.
4. Validar sintaxe: checker dos blocos `<script>` (0 erros) — apóstrofos não escapados
   quebram o objeto inteiro.
5. Conferir paridade de chaves contra `en` (script de diff de chaves).
6. Registrar no `ACTIVITY_LOG.md` + `TESTES_PENDENTES.md`.

---

# Sessões (curtas, independentes — qualquer ordem)

> Cada sessão adiciona blocos completos ao `TUT_TXT`. São independentes entre si e do resto
> do jogo (o `_tt` cai para `pt` enquanto um idioma não existir).

## ⏳ S45 — Tutorial: romanas (`fr` + `es` + `it`) `[F]` 🟢 🅿2
- [ ] `fr` (fecha a lacuna deixada pela S40), `es`, `it` — próximas do pt, baixo risco.
- [ ] Atenção a apóstrofos em `fr`/`it`.

## ⏳ S46 — Tutorial: `de` + `ru` `[F]` 🟢 🅿2
- [ ] Alemão e Russo. Conferir comprimento dos `*_body`/`*_title` no card (mais longos).

## ⏳ S47 — Tutorial: CJK (`ja` + `ko` + `zh`) `[F]` 🟡 🅿2
- [ ] Japonês, Coreano, Chinês. **Marcar para revisão humana** antes de teste público —
      termos de jogo (Duelo, Morte Súbita, Bônus, Promoção, Torre/Peão/Rainha/Rei) têm
      convenções de xadrez que variam por comunidade.

---

## Critério de aceite (por idioma)
- Configurações → trocar idioma → JOGAR TUTORIAL.
- Todos os cards, HUD, botão PRONTO, chips, tela final e PULAR/confirmação no idioma.
- Duelo/Morte Súbita já traduzidos (via `T`).
- Texto não estoura o card em mobile 360px.
- `node`/checker de `<script>`: 0 erros; paridade de chaves com `en`.

## Estimativa
- 49 strings × 8 idiomas = **392 traduções**.
- S45 (3 idiomas) e S47 (3 idiomas): ~1 sessão cada. S46 (2 idiomas): ~meia.
