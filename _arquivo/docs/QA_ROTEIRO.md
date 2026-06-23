> ⚠️ **ARQUIVADO.** Consolidado em `docs/TESTES.md` (roteiro único P0→P3 com passos embutidos).
> Mantido só como referência histórica.

# microChess — Roteiro de QA priorizado

> Execução do backlog de `docs/TESTES_PENDENTES.md` em ordem de risco. Cada item lista a
> **tag do teste** (passos detalhados estão em `TESTES_PENDENTES.md`). Marque `[x]` ao passar,
> `[!]` ao falhar (e anote o que viu). Faça os blocos **na ordem** — P0 primeiro.

## Pré-requisitos
- `cd server && npm run dev` → acessar `http://localhost:3000`.
- **2 abas** (A e B) para PvP/reconexão; **1 aba** para Solo.
- Alguns testes pedem **acesso ao SQLite** (`server/db/microchess.db`) — marcados com 🗄️.
- Para forçar 1ª vez: aba anônima **ou** `localStorage.removeItem('mc_tutorial_seen')` no console.

## Convenção de anotação
- `[x]` passou · `[!]` falhou (descreva) · `[~]` parcial/dúvida.

---

# 🔴 P0 — CRÍTICO (mudanças grandes/recentes nunca testadas; podem quebrar o jogo)

> Foco aqui primeiro: motor de tutorial novo, emojis, e correções de regra/regressão.

## Bloco P0-A — Tutorial encenado (motor TUT2, 1 aba, sem rede)
Setup: aba anônima → Configurações ▸ JOGAR TUTORIAL (e também testar o auto-trigger).
- [ ] **T-S35-1** — fluxo completo (comprar Torre+Peão → posicionar → atacar → duelo → cards → promoção → Morte Súbita → "Você aprendeu!")
- [ ] **T-S35-2** — spotlight NÃO trava o clique no elemento destacado; botão PULAR + confirmação
- [ ] **T-S35-3** — auto-trigger na 1ª vez no Solo nível 1 (abre tutorial antes do jogo)
- [ ] **T-S35-4** — colisão gera Duelo (Torre e Peão preto vão para a mesma casa) — não captura direta
- [ ] **T-S35-5** — tela de rolagem de dado idêntica ao jogo; resultado scriptado (Torre vence)
- [ ] **T-S35-6** — Rainha ataca o Rei → Rei vence o empate → Rainha capturada
- [ ] **T-S35-7** — Morte Súbita real ao fim (MD3 aleatório) → vai direto à tela final
- [ ] **T-S35-8** ⚠️ **REGRESSÃO CRÍTICA** — após concluir/pular o tutorial, iniciar **partida real** e confirmar que **PRONTO** e **RESOLVER JOGADA** ainda funcionam (o `_cleanup` restaura os handlers)

## Bloco P0-B — Emojis (2 abas PvP)
Setup: A e B logados, partida Casual.
- [ ] **T-S34-1** — clicar emoji em A → popup ~1s na tela de B; cooldown ~2s; spam liberado após 2s
- [ ] **T-S34-2** — em Solo o botão de emoji NÃO aparece
- [ ] **T-S34-3** — Perfil: configurar os 4 emojis (picker inline); refletem na wheel in-game
- [ ] **T-S34-4** 🗄️/conta — emojis persistem após logout/login (autenticado)
- [ ] **Extra** — emoji utilizável **durante** rolagem de dados, tela de resultado e tela final (win/lose) — camada superior

## Bloco P0-C — Regras de duelo & fim de partida (2 abas)
- [ ] **T-DUEL-1** ⚠️ **REGRA** — Defesa do Rei resolve **antes** do ataque ao Rei, independente do bônus (montar: Torre preta ataca seu Rei + seu Cavalo ataca a Torre). Conferir os 2 casos (Torre vence → duelo com Rei; Cavalo vence → Rei salvo). Repetir com atacante de bônus MAIOR.
- [ ] **T-S16-3** — abandonar em ACTION → quem abandona **perde** (W.O.), oponente vence ⚠️ (era o bug do vencedor errado)
- [ ] **T-S16-2** — abandonar no pré-jogo (DRAFT/POSITION) → **cancelamento** (ambos ao menu, sem W.O.)
- [ ] **T-S16-5** — abandonar no Solo → volta ao hub (sem W.O., sem ranking)

## Bloco P0-D — Game over / rematch (2 abas)
- [ ] **JOGAR NOVAMENTE (PvP)** — ao fim de uma Casual, "JOGAR NOVAMENTE" entra direto na fila **Casual**; repetir em Ranked → fila **Ranked**
- [ ] **MENU** — continua indo ao menu

---

# 🟠 P1 — FUNCIONAL (core de partida e telas)

## Bloco P1-A — Botão abandonar & inatividade (2 abas)
- [ ] **T-S36-1** — X vermelho no canto superior direito; confirmação; some na tela de fim
- [ ] **T-S16-1** — botão visível em PvP e Solo, com confirmação (CANCELAR mantém o jogo)
- [ ] **T-S16-4** — AFK timeout no pré-jogo → cancelamento (não W.O.)

## Bloco P1-B — Reconexão (2 abas, F5/refresh)
- [ ] **T-S17-1** — F5 mid-game restaura a partida; oponente vê banner com countdown
- [ ] **T-S17-2** — desconectar e não voltar em 90s → W.O. para o ativo
- [ ] **T-S17-3** — reconexão de convidado (token em sessionStorage)
- [ ] **T-S44 (parte reconexão)** — overlay de reconexão: eyebrow + título + countdown

## Bloco P1-C — Duelo & replay (2 abas)
- [ ] **T-S37-1** — `#duel-status` mostra o TIPO (Disputa de Espaço / Defesa do Rei / Captura do Rei / Desempate / Morte Súbita)
- [ ] **T-S39-1** — replay: só PREV/NEXT (sem AUTO); duelos como passos navegáveis com dados + tipo
- [ ] **T-S21-1** — empate aparece com badge **E** no histórico
- [ ] **T-S21-2** — replay viewer funcional (board, navegação)
- [ ] **T-S21-3** — data legível no histórico (testar no **Firefox**)

## Bloco P1-D — HUD & draft (2 abas)
- [ ] **T-S11-1** — nick do oponente no HUD
- [ ] **T-S10-1** — timer de fase visível (fica vermelho <10s)
- [ ] **T-S14-1** — undo granular no draft (devolver peça específica)
- [ ] **T-S13-1** — banner de Morte Súbita traduzido (PT e EN)

## Bloco P1-E — Resultado/ranked 🗄️ (2 abas + SQLite)
- [ ] **T-S03-1** — Ranked só pareia com Ranked; Casual com Casual
- [ ] **T-S02-1** 🗄️ — taxonomia de resultado no banco (white/black/draw_rule/draw_inactivity/cancelled)
- [ ] **T-S22-1** 🗄️ — V/D/E só conta em Ranked (Casual não incrementa)
- [ ] **T-S21-4** 🗄️ — CHECK constraint OK em banco novo (apagar `.db` e recriar)

---

# 🟡 P2 — LOCALIZAÇÃO (10 idiomas)

## Bloco P2-A — Seletor & idioma novo
- [ ] **T-S41-1** — seletor compacto (tag IDIOMA + botão bandeira/sigla; expande inline; destaque do atual)
- [ ] **T-S40-1** — Francês cobre menu/perfil/ranking/partida/duelo; persiste (conta logada)
- [ ] **T-S33-A** — ptBR é o padrão em aba anônima

## Bloco P2-B — Overlays in-game traduzidos (trocar idioma + provocar cada overlay)
- [ ] **T-S42-1** — popups de inatividade (próprio e oponente)
- [ ] **T-S43-1** — abandonar / partida cancelada / sair da partida
- [ ] **T-S44-1** — retornar ao jogo + reconexão + eyebrows dos modais (conta/ban/senha) + "Prepare sua estratégia" + créditos

## Bloco P2-C — Tutorial nos idiomas (trocar idioma → JOGAR TUTORIAL)
- [ ] **T-S45-1** — fr / es / it
- [ ] **T-S46-1** — de / ru (conferir comprimento no card, mobile 360px)
- [ ] **T-S47-1** — ja / ko / zh (CJK; renderização + **revisão humana** dos termos)

---

# 🟢 P3 — VISUAL / COSMÉTICO

- [ ] **T-S28-1** — contorno das peças (light e dark)
- [ ] **T-S32-1** — coesão visual dark mode (paleta quente)
- [ ] **T-S29-1** — tipografia Inter/JetBrains Mono unificada; zero Cinzel

---

# ⚠️ Obsoletos — remover do backlog
Estes testavam o tutorial **antigo** (S27, overlay sobre jogo real), **substituído** pelo TUT2 (S35).
Não executar — cobertos por T-S35-*:
- ~~T-S27-1~~ · ~~T-S27-2~~ · ~~T-S27-3~~

---

## Sugestão de execução em 1 sessão de teste (~60–90 min)
1. **P0 inteiro** (tutorial, emojis, duelo/abandono, rematch) — maior risco.
2. **P1-A/B/C/D** (abandono, reconexão, duelo/replay, HUD) — se tiver fôlego, P1-E (DB).
3. **P2** rápido (trocar 2–3 idiomas e varrer menu/partida/tutorial/overlays).
4. **P3** por último (olhar rápido).

> Ao terminar, me mande o que ficou `[!]`/`[~]` que eu priorizo as correções.
