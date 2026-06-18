# Plano de Localização do Tutorial (TUT2) — S35

## Objetivo
Tutorial encenado (`TUT2` em `html/index.html`) disponível nos **9 idiomas** do jogo:
`pt · en · es · de · it · ru · ja · ko · zh`.

---

## Arquitetura de strings (já implementada)

1. **Rótulos do duelo** — JÁ localizados nos 9 idiomas, reusam o objeto global `T` via `window.t()`:
   - `conflict`, `sudden_death`, `white_wins`, `black_wins`, `draw`, `you`, `opponent`,
     `resolve`, `tap_roll`, `pts`, `my_pts`, `piece_Q/R/N/B/P/K`.
   - **Nada a fazer** — quando o jogador troca o idioma, o duelo já aparece traduzido.

2. **Texto dos passos do tutorial** — tabela isolada `TUT_TXT` no bloco do `TUT2`:
   - Helper `_tt(key)` lê `localStorage.mc_lang` e cai para `pt` se o idioma não existir.
   - **Estado atual:** `pt` e `en` completos. Faltam: `es, de, it, ru, ja, ko, zh`
     (hoje caem para `pt` via fallback).

---

## Chaves a traduzir (33 por idioma)

| Grupo | Chaves |
|-------|--------|
| HUD/fase | `hud_draft`, `hud_position`, `hud_action`, `hud_duel`, `hud_promo`, `hud_sd` |
| HUD oponente | `opp_status`, `opp_meta`, `ready_btn` |
| Passo 0 (draft) | `s0_title`, `s0_body`, `s0_cta` |
| Passo 1 (pronto) | `s1_title`, `s1_body`, `s1_cta` |
| Passo 2 (posição) | `s2_title`, `s2_body`, `s2_cta` |
| Passo 3 (ação/colisão) | `s3_title`, `s3_body`, `s3_cta` |
| Passo 5 (ordem) | `s5_title`, `s5_body` |
| Passo 6 (vácuo) | `s6_title`, `s6_body` |
| Passo 7 (Rei) | `s7_title`, `s7_body` |
| Passo 8 (promoção) | `s8_title`, `s8_body`, `s8_cta` |
| Passo 9 (Rainha×Rei) | `s9_title`, `s9_body`, `s9_cta` |
| Passo 10 (Morte Súbita) | `s10_title`, `s10_body` |
| Tela final | `end_title`, `end_sub`, `end_btn` |
| Chips resumo | `chip1`, `chip2`, `chip3`, `chip4`, `chip5`, `chip6` |

> Os passos 4 e 11 não têm card (são telas de duelo/Morte Súbita) — sem chaves de texto próprias.
> Tags `<b>…</b>` nos `*_body` devem ser **mantidas** na tradução (são renderizadas como HTML).

---

## Processo de execução

1. **Localizar o bloco `TUT_TXT`** em `html/index.html` (procurar `var TUT_TXT = {`).
2. Para cada idioma pendente, **duplicar o objeto `en`** e traduzir os 33 valores,
   preservando as chaves e as tags `<b>`.
3. Ordem sugerida por proximidade/risco:
   - **Fase 1 (latinas):** `es`, `it` — baixo risco, próximas do pt.
   - **Fase 2:** `de`.
   - **Fase 3 (CJK + ru):** `ru`, `ja`, `ko`, `zh` — revisar comprimento (cabe no card?) e quebra de linha.
4. **Não** mexer nos rótulos do duelo (já vêm de `T`).
5. Validar sintaxe: rodar o checker de blocos `<script>` (0 erros).

## Critério de aceite (por idioma)
- Trocar idioma em Configurações → JOGAR TUTORIAL.
- Todos os cards, HUD, botão PRONTO, chips e tela final no idioma escolhido.
- Duelo/Morte Súbita já traduzidos (via `T`).
- Texto não estoura o card em mobile 360px (atenção a `de`/`ru` mais longos).

## Estimativa
- ~33 strings × 7 idiomas = **231 traduções**.
- Fase 1 (es+it): ~1 sessão curta. Fase 2 (de): ~meia. Fase 3 (ru/ja/ko/zh): ~1 sessão
  (idealmente com revisão nativa para CJK).

## Observação de qualidade
Traduções `ru/ja/ko/zh` geradas por IA devem ser marcadas para **revisão humana** antes de
um teste público — termos de jogo (Duelo, Morte Súbita, Bônus, Promoção) têm convenções
que variam por comunidade.
