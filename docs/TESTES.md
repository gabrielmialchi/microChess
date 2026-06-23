# microChess — Testes (roteiro único de execução)

> **Documento único de QA.** Reúne o roteiro priorizado (P0→P3) **com os passos detalhados
> embutidos** — não é preciso pular para outro arquivo. Faça os blocos **na ordem**: P0 primeiro.
>
> Substitui os antigos `QA_ROTEIRO.md` + `TESTES_PENDENTES.md` (arquivados em `_arquivo/docs/`).

---

## Como usar

- **Pré-requisito global:** servidor rodando — `cd server && npm run dev` → acessar `http://localhost:3000`.
- **2 abas** (A e B) para PvP/reconexão; **1 aba** para Solo.
- Testes marcados **🗄️** precisam de acesso ao SQLite (`server/db/microchess.db`).
- Forçar "1ª vez": aba anônima **ou** `localStorage.removeItem('mc_tutorial_seen')` no console.

### Convenção de anotação
`[x]` passou · `[!]` falhou (descreva o que viu) · `[~]` parcial/dúvida.

### Sugestão de 1 sessão (~60–90 min)
1. **P0 inteiro** (tutorial, emojis, duelo/abandono, rematch) — maior risco.
2. **P1** (abandono, reconexão, duelo/replay, HUD); se houver fôlego, P1-E (banco).
3. **P2** rápido (trocar 2–3 idiomas e varrer menu/partida/tutorial/overlays).
4. **P3** por último (olhar visual rápido).

> Ao terminar, reporte o que ficou `[!]`/`[~]` para priorizar correções.

---

# 🔴 P0 — CRÍTICO

> Mudanças grandes/recentes que nunca foram testadas e podem quebrar o jogo: motor de
> tutorial novo (TUT2), emojis e correções de regra/regressão.

## Bloco P0-A — Tutorial encenado (motor TUT2, 1 aba, sem rede)
Setup: aba anônima → Configurações ▸ JOGAR TUTORIAL (testar também o auto-trigger no Solo).

- [ ] **T-S35-1 — Fluxo completo**
  1. Aba anônima (sem `mc_tutorial_seen`). Configurações → JOGAR TUTORIAL
     → abre direto o tabuleiro do tutorial (não inicia partida real). Loja mostra só Torre(4) e Peão(1).
  2. Comprar Torre e Peão (a loja desabilita cada uma após comprada; orçamento 5→1→0)
     → avança sozinho para o passo PRONTO ao ter as duas.
  3. PRONTO → POSICIONAR: tocar peça do inventário → casa em destaque acende; tocar nela posiciona
     → só a casa em destaque aceita; PRONTO habilita quando as duas estão posicionadas.
  4. AÇÃO: tocar a Torre → casa do Peão preto acende; tocar nela
     → duelo determinístico "Torre vence", Peão preto capturado, Torre avança.
  5. Cards (ordem/vácuo/Rei): tocar "Entendi ▸" avança cada um.
  6. PROMOÇÃO: tocar o Peão → casa da última fileira acende; tocar nela
     → Peão vira Rainha (♙→♕) com animação.
  7. Card Morte Súbita → "Você aprendeu!" → Jogar agora
     → volta ao menu; `mc_tutorial_seen = '1'`.

- [ ] **T-S35-2 — Spotlight não trava interação**
  1. Em cada passo bloqueante (comprar/posicionar/atacar/promover): o elemento em destaque é
     clicável (a tela escurecida ao redor NÃO bloqueia o clique no alvo).
  2. PULAR (topo dir.) → "Pular o tutorial?" → "Sim, pular" → fecha, volta ao menu, `mc_tutorial_seen = '1'`.

- [ ] **T-S35-3 — Auto-trigger 1º Solo**
  1. Conta/convidado sem `mc_tutorial_seen`, ir ao Solo → iniciar Nível 1
     → tutorial encenado abre ANTES do jogo (não inicia a partida real).
  2. Concluir/pular → menu. Iniciar Nível 1 de novo → agora inicia a partida solo normal (tutorial não repete).

- [ ] **T-S35-4 — Colisão gera Duelo (não captura direta)**
  1. No passo de AÇÃO, mover a Torre para a casa em destaque (3,2)
     → o Peão preto se move para a MESMA casa (choque); abre a tela de Duelo (não captura automática sem duelo).

- [ ] **T-S35-5 — Tela de rolagem de dado (idêntica ao jogo)**
  1. Na tela de Duelo, tocar no dado branco (seu)
     → ambos os dados giram e param sempre nos MESMOS valores roteirizados (Torre 3, Peão 5);
     Torre vence (total 7 × 6), card da Torre pulsa, botão RESOLVER aparece.
  2. Tocar RESOLVER → Peão preto capturado, Torre avança, tutorial segue.

- [ ] **T-S35-6 — Rainha ataca o Rei → Rei vence**
  1. Após promover, mover a Rainha sobre o Rei preto (casa em destaque)
     → abre Duelo; ao rolar, empate de total (4+5 × 4+5 = 9×9); **Rei (preto) vence**.
  2. RESOLVER → Rainha capturada (usuário perde a Rainha); ambos os Reis seguem vivos.

- [ ] **T-S35-7 — Morte Súbita real ao fim**
  1. Após o card de Morte Súbita, tocar "Entendi ▸"
     → inicia a Morte Súbita real — fundo vermelho, status "MORTE SÚBITA · rodada/3 · placar", 0 de bônus.
  2. Rolar cada rodada (até 3, ou até alguém fazer 2)
     → rolagens ALEATÓRIAS (diferentes a cada tentativa); SEM tela de vitória/derrota/empate.
  3. Ao fim das rodadas → vai direto para a tela final "Você aprendeu!".

- [ ] **T-S35-8 ⚠️ REGRESSÃO CRÍTICA — i18n + não quebra o jogo real**
  1. Configurações → Inglês → JOGAR TUTORIAL → cards, HUD, PRONTO, chips, tela final em inglês; duelo já traduzido.
  2. Concluir o tutorial → iniciar uma partida real (solo ou PvP)
     → botão **PRONTO** e **RESOLVER JOGADA** funcionam normalmente (regressão do fix de `_cleanup`
     que antes anulava os handlers).

## Bloco P0-B — Emojis (2 abas PvP)
Setup: A e B logados, partida Casual.

- [ ] **T-S34-1 — Enviar emoji durante partida PvP**
  1. Duas abas, PvP, qualquer fase → botão de emoji (laranja, 😀, bottom-right) aparece em ambas.
  2. Clicar no botão → wheel com 4 emojis abre.
  3. Clicar num emoji (ex: 😤)
     → no clicante: wheel fecha; botão a 40% de opacidade por ~8s.
     → no oponente: emoji grande centralizado no board por ~2s (bounce + fade-out).
  4. Clicar de novo antes de 8s → nada (cooldown server-side + visual).
  5. Após 8s → botão volta opaco, wheel reabre.

- [ ] **T-S34-2 — Solo sem botão de emoji**
  1. Iniciar Solo (vs bot) → botão de emoji NÃO aparece durante toda a partida.

- [ ] **T-S34-3 — Config de emojis no Perfil**
  1. Perfil → "EMOJIS DA PARTIDA": 4 slots (😀 😎 😤 🔥 por padrão).
  2. Clicar no 1º slot → grid inline com 42 emojis abre; slot 1 destacado em laranja.
  3. Clicar em 🤯 → grid fecha; slot 1 mostra 🤯.
  4. Entrar em PvP → wheel mostra 🤯 como 1º emoji.

- [ ] **T-S34-4 🗄️/conta — Persistência (autenticado)**
  1. Configurar emojis no Perfil (ex: 🤯 😇 😴 🎉).
  2. Logout → relogar → slots no Perfil e wheel in-game mantêm os 4 emojis.

- [ ] **Extra** — emoji utilizável **durante** rolagem de dados, tela de resultado e tela final
  (win/lose) — deve aparecer na camada superior.

## Bloco P0-C — Regras de duelo & fim de partida (2 abas)

- [ ] **T-DUEL-1 ⚠️ REGRA — Defesa do Rei resolve antes (independente do bônus)**
  1. Montar: peça inimiga (ex: Torre Preta) ataca seu Rei E sua peça (ex: Cavalo Branco) ataca essa Torre no mesmo turno
     → **Duelo 1:** Cavalo Branco × Torre Preta (defesa), ANTES de qualquer duelo com o Rei.
  2. Se a Torre vencer o Duelo 1 → Cavalo capturado + **Duelo 2:** Torre Preta × Rei Branco.
  3. Se o Cavalo vencer o Duelo 1 → Torre capturada, NÃO há duelo com o Rei (Rei defendido).
  4. Repetir com atacante de bônus MAIOR que o defensor (ex: Rainha ataca o Rei, Peão defende)
     → mesmo assim a defesa (Peão × Rainha) resolve primeiro — independente do bônus.
  5. Conferir que o duelo-duplo normal não regrediu: duas peças atacam o Rei adversário no mesmo turno → maior bônus resolve primeiro.

- [ ] **T-S16-3 — Abandonar em ACTION → W.O.**
  1. Chegar à fase ACTION em PvP.
  2. Jogador A abandona (ABANDONAR → SIM)
     → B recebe VOCÊ GANHOU; A recebe VOCÊ PERDEU (W.O.). ⚠️ era o bug do vencedor errado.

- [ ] **T-S16-2 — Abandonar no pré-jogo (DRAFT/POSITION) → cancelamento**
  1. Duas abas, PvP, fase de DRAFT.
  2. A clica ABANDONAR → confirma SIM
     → para A: overlay "PARTIDA CANCELADA" por 2,5s → menu.
     → para B: mesmo overlay → menu. Nenhum recebe tela de W.O.

- [ ] **T-S16-5 — Abandonar no Solo**
  1. Iniciar Solo, clicar ABANDONAR → confirmar SIM → vai ao hub/menu (sem W.O., sem efeito em ranking).

## Bloco P0-D — Game over / rematch (2 abas)

- [ ] **JOGAR NOVAMENTE (PvP)** — ao fim de uma Casual, "JOGAR NOVAMENTE" entra direto na fila **Casual**; repetir em Ranked → fila **Ranked**.
- [ ] **MENU** — botão MENU continua indo ao menu.

---

# 🟠 P1 — FUNCIONAL (core de partida e telas)

## Bloco P1-A — Botão abandonar & inatividade (2 abas)

- [ ] **T-S36-1 — Botão abandonar (X vermelho, canto sup. dir.)**
  1. Iniciar partida (PvP ou Solo) → quadrado vermelho com X branco no canto sup. dir. (no top-bar, ao lado dos pontos).
  2. Clicar no X → confirmação abre; CANCELAR fecha; SIM segue o fluxo (WO/cancel/solo→hub).
  3. Na tela de fim → o X NÃO aparece sobre o game-over.

- [ ] **T-S16-1 — Botão ABANDONAR visível e funcional**
  1. Iniciar qualquer partida → "ABANDONAR PARTIDA" disponível durante toda a partida.
  2. Clicar ABANDONAR → popup de confirmação abre.
  3. Clicar CANCELAR → popup fecha, jogo continua normalmente.

- [ ] **T-S16-4 — AFK timeout no pré-jogo → cancelamento (não W.O.)**
  1. Iniciar PvP, não clicar nada por ~60s → popup de inatividade aparece.
  2. Não clicar VOLTAR por mais ~90s → partida cancelada (overlay), não W.O.

## Bloco P1-B — Reconexão (2 abas, F5/refresh)

- [ ] **T-S17-1 — Reconexão mid-game restaura partida**
  1. Duas abas logadas, PvP, chegar ao DRAFT ou POSITION.
  2. Aba de A: F5 (refresh)
     → para B: banner vermelho no topo com countdown de 90s.
     → para A: ao recarregar, game-area aparece direto com o tabuleiro no estado atual.
  3. Com o banner no B, aguardar ~5s e recarregar A de novo → banner some no B; ambos voltam a jogar.

- [ ] **T-S17-2 — WO por timeout de reconexão (90s)**
  1. A desconecta e **não** reconecta.
  2. Aguardar 90s → B recebe VOCÊ GANHOU (W.O.); ao recarregar, A vê menu ou tela de fim.

- [ ] **T-S17-3 — Reconexão de convidado (token de sessão)**
  1. Jogar sem conta (convidado), desconectar e reconectar dentro de 90s
     → volta à partida em andamento (igual a usuário logado).
     → se falhar: checar `sessionStorage` → Application → `mc_reconnect_token` no DevTools.

- [ ] **T-S44 (parte reconexão)** — desconexão do oponente → overlay de reconexão com eyebrow
  "Oponente desconectou" + título "AGUARDANDO RECONEXÃO" + countdown, no idioma escolhido.

## Bloco P1-C — Duelo & replay (2 abas)

- [ ] **T-S37-1 — Tipo de duelo na tela de dados**
  1. Provocar cada tipo e conferir o texto no topo da tela de dados:
     - Duas peças para a mesma casa → **DISPUTA DE ESPAÇO**
     - Bônus iguais disputando Reis → **DESEMPATE**
     - Defesa do Rei → **DEFESA DO REI**
     - Peça ataca o Rei → **CAPTURA DO REI**
     - Morte Súbita → **MORTE SÚBITA**
  2. Trocar idioma → tipos aparecem traduzidos.

- [ ] **T-S39-1 — Replay com duelos navegáveis**
  1. Abrir replay de partida com duelos → apenas ⏮ ANTERIOR e PRÓXIMO ⏭ (sem AUTO).
  2. Navegar com NEXT → sequência intercala turnos e duelos: `Posicionamento → Turno 1 → Duelo 1 · Tipo → Turno 2 → …`.
  3. Num passo de duelo → sobreposição com resultado dos dados (vencedor, totais) + tipo do duelo.
  4. Replays antigos (sem `duelType`) → funcionam; tipo cai para "CONFLITO" (sem quebrar).

- [ ] **T-S21-1 — Empate no histórico de partidas**
  1. Jogar Morte Súbita até empate (0×0 nos dados).
  2. Perfil → HISTÓRICO DE PARTIDAS → partida com badge **E** (cor muted/cinza), não "D".
  3. Se Ranked e o mais fraco ganhou LP, badge mostra `= 0 PdL` (display de empate é o comportamento atual esperado).

- [ ] **T-S21-2 — Replay viewer funcional**
  1. Histórico → clicar ▶ de uma partida com replay → tela de replay abre; header "vs NomeOponente" + badge V/D/E + delta PdL.
  2. Board: peças visíveis no posicionamento inicial.
  3. ▶ AUTO → peças movem a cada 1s; label de turno atualiza.
  4. ⏮ / ⏭ → navega sem erro; ⏮ desabilita no turno 0; ⏭ no último.
  5. ← VOLTAR → retorna ao histórico.

- [ ] **T-S21-3 — Data legível no histórico (Firefox)**
  1. Abrir histórico no **Firefox** → data legível (ex: "17 de jun"), não "Invalid Date".

## Bloco P1-D — HUD & draft (2 abas)

- [ ] **T-S11-1 — Nickname do oponente no HUD**
  1. PvP contra outro usuário → `#opp-meta` exibe o nickname dele durante toda a partida (antes ficava "aguardando…").

- [ ] **T-S10-1 — Timer de fase visível no HUD**
  1. PvP → DRAFT → abaixo do título da fase, contador "60s" diminuindo.
  2. Clicar em qualquer lugar → timer reseta para "60s".
  3. Aguardar ~50s sem clicar → contador fica vermelho nos últimos 10s (integra J2).

- [ ] **T-S14-1 — Undo granular no Draft**
  1. PvP → fase DRAFT.
  2. Comprar uma peça (ex: Peão 1pt) → aparece no inventário.
  3. Clicar na peça no inventário → some do inventário, 1pt volta ao orçamento (5→4→5).
  4. Comprar Rainha (5pt), clicar nela → 5pt voltam, orçamento volta a 5pt.
  5. PRONTO logo após desfazer (inventário vazio) → continua bloqueado (gate da S01).

- [ ] **T-S13-1 — Banner Morte Súbita traduzido**
  1. Chegar a Morte Súbita → banner laranja "⚔ MORTE SÚBITA! — próxima colisão vai direto ao duelo" (PT).
  2. Trocar para Inglês e repetir → "⚔ SUDDEN DEATH! — next collision goes straight to duel".

## Bloco P1-E — Resultado/ranked 🗄️ (2 abas + SQLite)

- [ ] **T-S03-1 — Ranked só pareia com Ranked**
  1. Aba A na fila **Casual**; Aba B **Ranked** → partida NÃO começa (filas separadas).
  2. Aba C entra **Ranked** → B e C se emparelham; A continua esperando.

- [ ] **T-S02-1 🗄️ — Taxonomia de resultado no banco**
  1. Terminar Ranked com vitória normal → `SELECT result FROM matches ORDER BY created_at DESC LIMIT 1` → `white` ou `black`.
  2. Morte Súbita até empate (0×0) → `result` = `draw_rule` (não `draw`).
  3. Ambos inativos em ACTION até timeout duplo → `result` = `draw_inactivity`.

- [ ] **T-S22-1 🗄️ — V/D/E só em ranked (casual não conta)**
  1. Vencer uma **Casual** → `SELECT wins FROM players WHERE username='seu_nick'` → wins **não** incrementou.
  2. Vencer uma **Ranked** → wins incrementou em 1.

- [ ] **T-S21-4 🗄️ — CHECK constraint no banco novo**
  1. Apagar `server/db/microchess.db`, reiniciar servidor.
  2. Jogar partida que termine em empate (Morte Súbita 0×0)
     → sem erro no log; match aparece no histórico (antes `draw_rule` era rejeitado pelo CHECK antigo).

---

# 🟡 P2 — LOCALIZAÇÃO (10 idiomas)

## Bloco P2-A — Seletor & idioma

- [ ] **T-S41-1 — Seletor de idioma compacto**
  1. Configurações → seção IDIOMA → linha "IDIOMA" + botão com bandeira/sigla atual (ex: 🇧🇷 PT); grade NÃO aberta.
  2. Clicar no botão → abre inline a lista de todos os idiomas; atual destacado.
  3. Escolher outro (ex: FR) → interface troca; lista fecha; botão passa a 🇫🇷 FR.
  4. Reabrir a lista → idioma atual continua destacado.
  5. Conferir persistência (conta logada → salva no servidor).

- [ ] **T-S40-1 — Idioma Francês**
  1. Configurações → 🇫🇷 FR → menu, perfil, ranking, configurações em francês; bandeira da França no botão.
  2. Entrar numa partida e provocar um duelo → fases (RECRUTEMENT/PLACEMENT/ACTION), HUD e tipos de duelo (DISPUTE DE CASE, DÉFENSE DU ROI, etc.) em francês.
  3. Conta logada: trocar para FR, recarregar → continua em FR (`/auth/lang`).
  4. Acentuação correta (É, È, Ç, À) sem caracteres quebrados.

- [ ] **T-S33-A — ptBR como idioma padrão**
  1. Abrir em aba anônima (sem localStorage) com sistema em inglês → interface em português.
  2. Trocar para inglês, fechar e reabrir → continua em inglês (preferência salva respeitada).

## Bloco P2-B — Overlays in-game traduzidos (trocar idioma + provocar cada overlay)

- [ ] **T-S42-1 — i18n popups de inatividade**
  1. Idioma EN. Em PvP, ficar inativo ~60s
     → inativo: popup com título, "RETURN (n)" com contador, e "ABANDON MATCH" — tudo no idioma.
  2. Lado do oponente → "OPPONENT INACTIVE" / "AWAITING ACTION" / "RETURN" no idioma.
  3. Contador do botão VOLTAR/RETURN decrementa normalmente.
  4. Repetir em FR/JA/RU (acentuação/caracteres).

- [ ] **T-S43-1 — i18n overlays de abandono/cancelamento/sair**
  1. Idioma EN. Clicar no X de abandonar → "ABANDON MATCH?" + sub + "YES — ABANDON" + "CANCEL" no idioma.
  2. Provocar cancelamento (dupla inatividade no pré-jogo) → "MATCH CANCELLED" + sub no idioma.
  3. Tela de sair (`exc-leave-overlay`) → "Leave the match?" + aviso de W.O. + "Leave anyway" / "Keep playing".
  4. Repetir em FR/DE/JA.

- [ ] **T-S44-1 — i18n retornar + reconexão + eyebrows + matchmaking/créditos**
  1. Idioma EN. Provocar prompt de retorno (reconexão dupla) → "RETURN TO GAME?" + sub + "YES (n)" + "NO".
  2. Desconexão do oponente → eyebrow "Opponent disconnected" + "AWAITING RECONNECTION".
  3. Modais de conta (logout, excluir, alterar senha, ban) → eyebrows (Account/Permanent action/Security/Restricted access) no idioma.
  4. Iniciar partida → countdown → "Prepare your strategy" no idioma.
  5. Configurações → Créditos → "Thanks for playing. / Feedback is very welcome." no idioma.
  6. Repetir em FR/RU/JA.

## Bloco P2-C — Tutorial nos idiomas (trocar idioma → JOGAR TUTORIAL)

- [ ] **T-S45-1 — Tutorial em fr / es / it**
  1. Configurações → Français → JOGAR TUTORIAL → cards, HUD, PRONTO (PRÊT), chips, tela final, PULAR em francês; acentuação (é, à, ç).
  2. Repetir em Español e Italiano → tutorial completo; nada caindo para português.
  3. Passos com `<b>`: nome da peça traduzido, bônus mantido (ex: <b>Tour (+4)</b> / <b>Torre (+4)</b>).
  4. Duelo (CONFLITO/tipos) e Morte Súbita já traduzidos (vêm de `T`).
  5. Mobile 360px: texto não estoura o card.

- [ ] **T-S46-1 — Tutorial em de / ru**
  1. Deutsch → JOGAR TUTORIAL → completo (cards, HUD, BEREIT, chips, tela final, ÜBERSPRINGEN); umlauts (ä/ö/ü/ß) corretos.
  2. Русский → completo (cirílico correto).
  3. **Mobile 360px (de/ru):** títulos/corpos longos NÃO estouram o card (especialmente s3, s9, s10).
  4. Duelo/Morte Súbita já traduzidos.

- [ ] **T-S47-1 — Tutorial em ja / ko / zh (CJK)**
  1. 日本語 / 한국어 / 中文 → JOGAR TUTORIAL → completo (cards, HUD, 准备好/준비/準備完了, chips, tela final, pular).
  2. Caracteres CJK renderizam corretamente (sem □/tofu).
  3. Mobile 360px: conferir s3/s10 (mais longos).
  4. ⚠️ **Revisão humana** dos termos de xadrez (車/兵/后/王 · 룩/폰/퀸/킹 · ルーク/ポーン/クイーン/キング) antes de teste público.

---

# 🟢 P3 — VISUAL / COSMÉTICO

- [ ] **T-S28-1 — Contorno das peças no tabuleiro**
  1. Solo em light mode → peças brancas com contorno escuro visível sobre casas claras; sem glow azul.
  2. Dark mode → peças pretas com contorno creme visível sobre casas escuras.
  3. Inventário: peças mantêm a aparência anterior (não alteradas).

- [ ] **T-S32-1 — Coesão visual dark mode**
  1. Aba anônima → carrega em light mode (creme/laranja, não preto).
  2. Dark mode → tela de jogo: fundo marrom-escuro quente (#0b0907), não preto puro; accent laranja, não dourado.
  3. Transitar menu ↔ jogo → paleta contínua (não parece 2 produtos).

- [ ] **T-S29-1 — Tipografia Inter unificada**
  1. Qualquer tela → tipografia sem serifa (Inter) em todo texto; zero Cinzel.
  2. Timer/counters (fase, PdL, orçamento) → JetBrains Mono.
  3. Mobile 360px → legível, sem quebra de layout.

---

# ⚠️ Obsoletos — não executar

Testavam o tutorial **antigo** (S27, overlay sobre o jogo real), **substituído** pelo TUT2 (S35).
Cobertos por T-S35-*: ~~T-S27-1~~ · ~~T-S27-2~~ · ~~T-S27-3~~.

---

# ✅ Já testados e aprovados

| Sessão | Descrição | Testado por |
|--------|-----------|-------------|
| S01 | Gates rígidos do PRONTO | Gabriel (confirmado em sessão) |
| S30+S31 | Render otimista no POSITION + juice (J1–J11) | Gabriel (feedback aplicado em S31b/S31c) |
| S31b | Freeze modal duelo 15s + freeze game over | Gabriel (feedback aplicado em S31c) |
| S31c | Dado girando + timer + bug sessão | Gabriel ("Dado e Timer — OK") |
