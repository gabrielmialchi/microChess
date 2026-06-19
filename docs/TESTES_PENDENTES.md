# microChess — Testes Pendentes

> **Como usar este documento**
> - 🟢 **Não-bloqueante** → acumula aqui; testa tudo de uma vez na rodada de QA.
> - 🔴 **Bloqueante** → Claude sinalizará no chat antes de continuar; precisa de confirmação.
>
> **PRÉ-REQUISITO GLOBAL:** servidor rodando em `npm run dev` (pasta `server/`), acesso via `localhost:3000`.

---

## 🔴 Bloqueantes (sinalizado no chat antes de prosseguir)

*Nenhum no momento.*

---

## 🟢 Não-bloqueantes (testar todos de uma vez)

### T-S03-1 — Ranked só pareia com Ranked
**Sessão:** S03 | **Arquivo:** `server/server.js`

1. Aba A entra na fila como **Casual**; Aba B entra como **Ranked**
   → **Esperado:** partida NÃO começa (ficam em fila separada)
2. Aba C entra como **Ranked**
   → **Esperado:** B e C se emparelham; A continua esperando

---

### T-S17-1 — Reconexão mid-game restaura partida
**Sessão:** S17 | **Arquivo:** `html/index.html`, `server/server.js`

1. Duas abas logadas, iniciar PvP, chegar ao DRAFT ou POSITION
2. Aba do Jogador A: `F5` (refresh)
   → **Esperado para B:** banner vermelho no topo com countdown de 90s
   → **Esperado para A:** ao recarregar, game-area aparece diretamente com o tabuleiro no estado atual
3. Com o banner visível no B, aguardar ~5s e recarregar A novamente
   → **Esperado:** banner some no B; ambos voltam a jogar

---

### T-S17-2 — WO por timeout de reconexão
**Sessão:** S17 | **Arquivo:** `server/server.js`

1. Jogador A desconecta e **não** reconecta
2. Aguardar 90s
   → **Esperado:** Jogador B recebe tela de VOCÊ GANHOU (W.O.); ao recarregar A vê menu ou tela de fim

---

### T-S17-3 — Reconexão de convidado (token de sessão)
**Sessão:** S17

1. Jogar sem conta (convidado), desconectar e reconectar dentro de 90s
   → **Esperado:** volta à partida em andamento (mesmo comportamento de usuário logado)
   → Se falhar: checar `sessionStorage` → Application → `mc_reconnect_token` no DevTools

---

### T-S02-1 — Taxonomia de resultado no banco
**Sessão:** S02 | **Arquivo:** `server/server.js`

*(Requer acesso ao banco SQLite — `server/db/microchess.db`)*

1. Terminar uma partida ranked com vitória normal
   → `SELECT result FROM matches ORDER BY created_at DESC LIMIT 1` → deve ser `white` ou `black`
2. Jogar Morte Súbita até empate (0×0 nos dados)
   → `result` deve ser `draw_rule` (não `draw`)
3. Ambos inativos em ACTION até timeout duplo
   → `result` deve ser `draw_inactivity`

---

### T-S16-1 — Botão ABANDONAR visível e funcional
**Sessão:** S16 | **Arquivo:** `html/index.html`

1. Iniciar qualquer partida (PvP ou Solo)
   → **Esperado:** "ABANDONAR PARTIDA" aparece abaixo do botão PRONTO durante toda a partida
2. Clicar ABANDONAR → popup de confirmação abre
3. Clicar CANCELAR → popup fecha, jogo continua normalmente

---

### T-S16-2 — Abandonar no pré-jogo (DRAFT/POSITION) → cancelamento
**Sessão:** S16 | **Arquivo:** `html/index.html`, `server/server.js`

1. Duas abas, PvP, fase de DRAFT
2. Jogador A clica ABANDONAR → confirma SIM
   → **Esperado para A:** overlay "PARTIDA CANCELADA" por 2,5s → menu
   → **Esperado para B:** mesmo overlay → menu
   → Nenhum recebe tela de W.O.

---

### T-S16-3 — Abandonar em ACTION → W.O.
**Sessão:** S16

1. Chegar à fase ACTION em PvP
2. Jogador A abandona (ABANDONAR → SIM)
   → **Esperado:** B recebe VOCÊ GANHOU; A recebe VOCÊ PERDEU (W.O.)

---

### T-S16-4 — AFK timeout no pré-jogo → cancelamento (não W.O.)
**Sessão:** S16

1. Iniciar PvP, não clicar nada por ~60s → popup de inatividade aparece
2. Não clicar VOLTAR por mais ~90s
   → **Esperado:** partida cancelada (overlay), não W.O.

---

### T-S16-5 — ABANDONAR no Solo
**Sessão:** S16

1. Iniciar modo Solo, clicar ABANDONAR → confirmar SIM
   → **Esperado:** vai direto para menu (sem tela de W.O., sem efeito em ranking)

---

### T-S11-1 — Nickname do oponente no HUD
**Sessão:** S11

1. Iniciar PvP contra outro usuário
   → **Esperado:** `#opp-meta` (abaixo do status do oponente) exibe o nickname dele durante toda a partida
   → Antes mostrava "aguardando…" permanentemente

---

### T-S13-1 — Banner Morte Súbita traduzido
**Sessão:** S13

1. Chegar a uma partida com Morte Súbita ativa
   → **Esperado:** banner laranja no topo lê "⚔ MORTE SÚBITA! — próxima colisão vai direto ao duelo" em PT
2. Trocar o idioma para Inglês (Configurações) e repetir
   → **Esperado:** banner lê "⚔ SUDDEN DEATH! — next collision goes straight to duel"

---

### T-S33-A — ptBR como idioma padrão
**Sessão:** S33

1. Abrir o jogo em aba anônima (sem localStorage) com sistema em inglês
   → **Esperado:** interface em português (não em inglês)
2. Trocar para inglês, fechar e reabrir
   → **Esperado:** continua em inglês (preferência salva respeita)

---

---

### T-S14-1 — Undo granular no Draft
**Sessão:** S14 | **Arquivo:** `html/index.html`, `server/server.js`

1. Iniciar PvP, entrar na fase DRAFT
2. Comprar uma peça (ex: Peão 1pt)
   → **Esperado:** peça aparece no inventário
3. Clicar na peça no inventário
   → **Esperado:** peça some do inventário, 1pt volta ao orçamento (ex: 5pt → 4pt → 5pt)
4. Comprar Rainha (5pt), clicar nela no inventário
   → **Esperado:** 5pt voltam, orçamento volta a 5pt
5. Apertar PRONTO logo depois de desfazer (inventário vazio)
   → **Esperado:** PRONTO continua bloqueado (gate da S01)

---

### T-S22-1 — V/D/E só em ranked (casual não conta)
**Sessão:** S22 | **Arquivo:** `server/server.js`

*(Requer acesso ao banco SQLite — `server/db/microchess.db`)*

1. Jogar e vencer uma partida **Casual**
   → Consultar: `SELECT wins FROM players WHERE username='seu_nick'`
   → **Esperado:** wins **não** incrementou
2. Jogar e vencer uma partida **Ranked**
   → **Esperado:** wins incrementou em 1

---

### T-S10-1 — Timer de fase visível no HUD
**Sessão:** S10 | **Arquivo:** `html/index.html`

1. Iniciar PvP, entrar no DRAFT
   → **Esperado:** abaixo do título da fase (DRAFT), aparece um contador "60s" que vai diminuindo
2. Clicar em qualquer lugar (ex: comprar peça)
   → **Esperado:** timer reseta para "60s"
3. Aguardar sem clicar por ~50s
   → **Esperado:** contador fica vermelho nos últimos 10s (integra J2)

---

### T-S21-1 — Empate no histórico de partidas
**Sessão:** S21 | **Arquivo:** `html/rank-ui.js`

1. Jogar Morte Súbita até empate (0×0 nos dados)
2. Abrir perfil → HISTÓRICO DE PARTIDAS
   → **Esperado:** partida aparece com badge **E** (cor muted/cinza), não "D"
3. Se o match foi Ranked e o jogador mais fraco ganhou LP, badge PdL mostra `= 0 PdL` (display de empate)
   → se `lpDelta > 0` na DB mas UI mostra `= 0 PdL`, é comportamento atual esperado

---

### T-S21-2 — Replay viewer funcional
**Sessão:** S21 | **Arquivo:** `html/replay-ui.js`

1. Na tela de histórico, clicar no ▶ de uma partida com replay disponível
   → **Esperado:** tela de replay abre; header mostra "vs NomeOponente" + badge V/D/E + delta PdL
2. Verificar o board: peças visíveis no posicionamento inicial
3. Clicar ▶ AUTO para avançar automaticamente
   → **Esperado:** peças movem a cada 1s; label de turno atualiza ("Turno 1", "Turno 2"…)
4. Clicar ⏮ / ⏭ para navegar manualmente
   → **Esperado:** navega sem erro; ⏮ desabilita no turno 0; ⏭ desabilita no último
5. Clicar ← VOLTAR → retorna ao histórico

---

### T-S21-3 — Date legível no histórico (Firefox)
**Sessão:** S21 | **Arquivo:** `html/rank-ui.js`

1. Abrir o histórico no **Firefox**
   → **Esperado:** data da partida aparece legível (ex: "17 de jun") não "Invalid Date"
   → *(Antes: `new Date("2026-06-17 15:30:00")` retornava Invalid Date no Firefox)*

---

### T-S21-4 — CHECK constraint no banco novo
**Sessão:** S21 | **Arquivo:** `server/db/schema.sql`

*(Só necessário se criar um banco do zero — ex: apagar `microchess.db` e reiniciar)*

1. Apagar `server/db/microchess.db`, reiniciar servidor
2. Jogar uma partida que termine em empate (Morte Súbita 0×0)
   → **Esperado:** sem erro no log do servidor; match aparece no histórico
   → *(Antes: `draw_rule` seria rejeitado pelo CHECK constraint antigo)*

---

---

### T-S28-1 — Contorno das peças no tabuleiro
**Sessão:** S28 | **Arquivo:** `html/index.html`

1. Iniciar partida solo (light mode)
   → **Esperado:** peças brancas têm contorno escuro visível sobre casas claras; sem glow azul
2. Ativar dark mode, repetir
   → **Esperado:** peças pretas têm contorno creme visível sobre casas escuras
3. Verificar inventário: peças no inventário mantêm a aparência anterior (não foram alteradas)

---

### T-S32-1 — Coesão visual dark mode
**Sessão:** S32 | **Arquivo:** `html/index.html`

1. Abrir aba anônima → jogo carrega em light mode
   → **Esperado:** interface em creme/laranja (não preta)
2. Ativar dark mode → ir para tela de jogo
   → **Esperado:** fundo marrom-escuro quente (#0b0907), não preto puro; accent laranja, não dourado
3. Transitar entre menu e tela de jogo
   → **Esperado:** paleta contínua (não parece 2 produtos diferentes)

---

### T-S29-1 — Tipografia Inter unificada
**Sessão:** S29 | **Arquivo:** `html/index.html`

1. Abrir qualquer tela (menu, perfil, configurações, jogo)
   → **Esperado:** tipografia sem serifa (Inter) em todo o texto; zero ocorrências de Cinzel
2. Verificar timer/counters (fase, PdL, orçamento)
   → **Esperado:** JetBrains Mono para números e labels mono
3. Verificar em mobile 360px
   → **Esperado:** legível; sem quebra de layout

---

### T-S27-1 — Tutorial automático (1ª partida solo)
**Sessão:** S27 | **Arquivo:** `html/index.html`

1. Abrir aba anônima (sem `mc_tutorial_seen` no localStorage)
2. Criar conta ou jogar como convidado → ir para Solo → escolher qualquer nível
   → **Esperado:** tutorial inicia automaticamente após o countdown; overlay aparece com "Bônus de combate"
3. Seguir o fluxo: comprar peça → PRONTO → posicionar → PRONTO → arrastar para atacar → observar duelo
   → **Esperado:** overlay avança a cada ação; spotlight cobre o elemento certo
4. Nos passos 5-9 (cards de informação): tocar "Entendi ▸"
   → **Esperado:** avança para o próximo card sem interação de jogo
5. Tela "Você aprendeu!" aparece com chips das 6 regras
   → Tocar "Jogar agora ▸" → vai para menu; `mc_tutorial_seen = '1'` no localStorage

---

### T-S27-2 — Tutorial via Configurações
**Sessão:** S27 | **Arquivo:** `html/index.html`

1. Com `mc_tutorial_seen = '1'` já no localStorage (tutorial já visto)
2. Ir para Configurações → clicar "JOGAR TUTORIAL"
   → **Esperado:** vai para tela de matchmaking e inicia partida Level 1 com overlay do tutorial

---

### T-S27-3 — Botão Pular do tutorial
**Sessão:** S27

1. Com tutorial ativo, tocar "PULAR" no canto superior direito
   → **Esperado:** modal de confirmação aparece "Pular o tutorial?"
2. Tocar "Continuar tutorial"
   → **Esperado:** modal fecha, tutorial continua no mesmo passo
3. Tocar "PULAR" novamente → "Sim, pular"
   → **Esperado:** overlay fecha, vai para menu; `mc_tutorial_seen = '1'` no localStorage

---

---

### T-S34-1 — Enviar emoji durante partida PvP
**Sessão:** S34

1. Duas abas, iniciar PvP, chegar a qualquer fase (DRAFT/POSITION/ACTION)
   → **Esperado:** botão de emoji (laranja, 😀, bottom-right) aparece em ambas as abas
2. Clicar no botão → wheel com 4 emojis abre
3. Clicar num emoji (ex: 😤)
   → **Esperado para o clicante:** wheel fecha; botão fica em 40% opacidade por ~8s
   → **Esperado para o oponente:** emoji 😤 grande aparece centralizado no board por ~2s com animação bounce + fade-out
4. Clicar novamente antes de 8s → nada acontece (cooldown server-side e visual)
5. Após 8s → botão volta opaco, wheel reabre normalmente

---

### T-S34-2 — Solo sem botão de emoji
**Sessão:** S34

1. Iniciar modo Solo (vs bot)
   → **Esperado:** botão de emoji NÃO aparece durante toda a partida

---

### T-S34-3 — Config de emojis no Perfil
**Sessão:** S34

1. Ir para Perfil → seção "EMOJIS DA PARTIDA": 4 slots (😀 😎 😤 🔥 por padrão)
2. Clicar no 1º slot (😀)
   → **Esperado:** grid inline com 42 emojis abre abaixo dos slots; slot 1 destacado em laranja
3. Clicar em 🤯
   → **Esperado:** grid fecha; slot 1 agora mostra 🤯
4. Entrar numa partida PvP → clicar o botão → wheel mostra 🤯 como 1º emoji

---

### T-S34-4 — Persistência (autenticado)
**Sessão:** S34

*(Requer conta cadastrada)*

1. Configurar emojis no Perfil (ex: 🤯 😇 😴 🎉)
2. Fazer logout → relogar
   → **Esperado:** slots no Perfil e wheel in-game mantêm os 4 emojis configurados

---

### T-S35-1 — Tutorial encenado: fluxo completo
**Sessão:** S35 | **Arquivo:** `html/index.html`

1. Aba anônima (sem `mc_tutorial_seen`). Configurações → JOGAR TUTORIAL
   → **Esperado:** abre direto o tabuleiro do tutorial (não inicia partida real). Loja mostra só Torre(4) e Peão(1).
2. Comprar Torre e Peão (a loja desabilita cada uma após comprada; orçamento 5→1→0)
   → **Esperado:** avança sozinho para o passo PRONTO ao ter as duas
3. PRONTO → POSICIONAR: tocar peça do inventário → casa em destaque acende; tocar nela posiciona
   → **Esperado:** só a casa em destaque aceita; PRONTO habilita quando as duas estão posicionadas
4. AÇÃO: tocar a Torre → casa do Peão preto acende; tocar nela
   → **Esperado:** duelo determinístico "Torre vence", Peão preto é capturado, Torre avança
5. Cards (ordem/vácuo/Rei): tocar "Entendi ▸" avança cada um
6. PROMOÇÃO: tocar o Peão → casa da última fileira acende; tocar nela
   → **Esperado:** Peão vira Rainha (♙→♕) com animação
7. Card Morte Súbita → "Você aprendeu!" → Jogar agora
   → **Esperado:** volta ao menu; `mc_tutorial_seen = '1'`

---

### T-S35-2 — Spotlight não trava interação
**Sessão:** S35

1. Em cada passo bloqueante (comprar/posicionar/atacar/promover)
   → **Esperado:** o elemento em destaque é clicável (a tela escurecida ao redor NÃO bloqueia o clique no alvo)
2. Botão PULAR (topo direito) → "Pular o tutorial?" → "Sim, pular"
   → **Esperado:** fecha, volta ao menu, `mc_tutorial_seen = '1'`

---

### T-S35-3 — Auto-trigger 1º solo
**Sessão:** S35

1. Conta/convidado sem `mc_tutorial_seen`, ir ao Solo → iniciar Nível 1
   → **Esperado:** tutorial encenado abre ANTES do jogo (não inicia a partida real)
2. Concluir/pular tutorial → menu. Iniciar Nível 1 de novo
   → **Esperado:** agora inicia a partida solo normal (tutorial não repete)

---

### T-S35-4 — Colisão gera Duelo (não captura direta)
**Sessão:** S35.1

1. No passo de AÇÃO, mover a Torre para a casa em destaque (3,2)
   → **Esperado:** o Peão preto se move para a MESMA casa (choque); abre a tela de Duelo
   → *(não deve ser captura automática sem duelo)*

---

### T-S35-5 — Tela de rolagem de dado (idêntica ao jogo)
**Sessão:** S35.1

1. Na tela de Duelo, tocar no dado branco (seu)
   → **Esperado:** ambos os dados giram (animação) e param sempre nos MESMOS valores roteirizados (Torre 3, Peão 5)
   → **Esperado:** Torre vence (total 7 × 6), card da Torre pulsa, botão RESOLVER aparece
2. Tocar RESOLVER
   → **Esperado:** Peão preto é capturado, Torre avança, tutorial segue

---

### T-S35-6 — Rainha ataca o Rei → Rei vence
**Sessão:** S35.1

1. Após promover a Rainha, mover a Rainha sobre o Rei preto (casa em destaque)
   → **Esperado:** abre Duelo; ao rolar, empate de total (4+5 × 4+5 = 9×9); **Rei (preto) vence**
2. RESOLVER
   → **Esperado:** Rainha é capturada (usuário perde a Rainha); ambos os Reis seguem vivos

---

### T-S35-7 — Morte Súbita real ao fim
**Sessão:** S35.1

1. Após o card de Morte Súbita, tocar "Entendi ▸"
   → **Esperado:** inicia a Morte Súbita real — fundo vermelho, status "MORTE SÚBITA · rodada/3 · placar", 0 de bônus
2. Rolar cada rodada (até 3, ou até alguém fazer 2)
   → **Esperado:** rolagens ALEATÓRIAS (diferentes a cada tentativa); SEM tela de vitória/derrota/empate
3. Ao fim das rodadas
   → **Esperado:** vai direto para a tela final "Você aprendeu!"

---

### T-S35-8 — i18n do tutorial (pt/en) + não quebra o jogo real
**Sessão:** S35.1

1. Configurações → Inglês → JOGAR TUTORIAL
   → **Esperado:** cards, HUD, PRONTO, chips e tela final em inglês; duelo já traduzido
2. Concluir o tutorial → iniciar uma partida real (solo ou PvP)
   → **Esperado:** botão PRONTO e RESOLVER JOGADA do duelo funcionam normalmente
   → *(regressão do fix de `_cleanup` que antes anulava os handlers)*

---

### T-DUEL-1 — Defesa do Rei resolve antes (independente do bônus)
**Arquivo:** `server/server.js`

1. Montar a situação: peça inimiga (ex: Torre Preta) ataca seu Rei E sua peça (ex: Cavalo Branco) ataca essa Torre no mesmo turno
   → **Esperado — Duelo 1:** Cavalo Branco × Torre Preta (defesa), ANTES de qualquer duelo com o Rei
2. Se a Torre vencer o Duelo 1
   → **Esperado:** Cavalo capturado + **Duelo 2:** Torre Preta × Rei Branco
3. Se o Cavalo vencer o Duelo 1
   → **Esperado:** Torre capturada, NÃO há duelo com o Rei (Rei defendido com sucesso)
4. Repetir com bônus do atacante MAIOR que o do defensor (ex: Rainha ataca o Rei, Peão defende)
   → **Esperado:** mesmo assim a defesa (Peão × Rainha) resolve primeiro — independente do bônus
5. Conferir que o duelo-duplo normal não regrediu: duas peças atacam o Rei adversário no mesmo turno → maior bônus resolve primeiro

---

### T-S36-1 — Botão abandonar (X vermelho, canto sup. dir.)
**Sessão:** S36 | **Arquivo:** `html/index.html`

1. Iniciar partida (PvP ou Solo)
   → **Esperado:** quadrado vermelho com X branco no canto superior direito (no top-bar, ao lado dos pontos)
2. Clicar no X → confirmação de abandono abre; CANCELAR fecha; SIM segue o fluxo (WO/cancel/solo→hub)
3. Ao terminar a partida (tela de fim)
   → **Esperado:** o X não aparece sobre a tela de game-over

---

### T-S37-1 — Tipo de duelo na tela de dados
**Sessão:** S37

1. Provocar cada tipo e conferir o texto no topo da tela de dados:
   - Duas peças para a mesma casa → **DISPUTA DE ESPAÇO**
   - Bônus iguais disputando Reis → **DESEMPATE**
   - Defesa do Rei (peça defende o Rei atacado) → **DEFESA DO REI**
   - Peça ataca o Rei → **CAPTURA DO REI**
   - Morte Súbita → **MORTE SÚBITA**
2. Trocar idioma (ex: inglês) → os tipos aparecem traduzidos

---

### T-S39-1 — Replay com duelos navegáveis
**Sessão:** S39 | **Arquivo:** `html/replay-ui.js`

1. Abrir um replay de partida que teve duelos
   → **Esperado:** apenas botões ⏮ ANTERIOR e PRÓXIMO ⏭ (sem AUTO)
2. Navegar com NEXT
   → **Esperado:** sequência intercala turnos e duelos: `Posicionamento → Turno 1 → Duelo 1 · Tipo → Turno 2 → …`
3. Num passo de duelo
   → **Esperado:** sobreposição com o resultado dos dados (vencedor, totais) + o tipo do duelo
4. Replays antigos (gravados antes do `duelType`)
   → **Esperado:** funcionam; tipo do duelo cai para "CONFLITO" (sem quebrar)

---

### T-S40-1 — Idioma Francês
**Sessão:** S40 | **Arquivo:** `html/index.html`, `server/server.js`

1. Configurações → seletor de idioma → escolher **🇫🇷 FR**
   → **Esperado:** menu, perfil, ranking, configurações em francês; bandeira da França no botão
2. Entrar numa partida e provocar um duelo
   → **Esperado:** fases (RECRUTEMENT/PLACEMENT/ACTION), HUD e tipos de duelo (DISPUTE DE CASE, DÉFENSE DU ROI, etc.) em francês
3. Conta logada: trocar para FR, recarregar a página
   → **Esperado:** continua em FR (preferência salva no servidor via `/auth/lang`)
4. Verificar acentuação correta (É, È, Ç, À) sem caracteres quebrados

---

### T-S41-1 — Seletor de idioma compacto
**Sessão:** S41 | **Arquivo:** `html/index.html`

1. Configurações → seção IDIOMA
   → **Esperado:** uma linha "IDIOMA" + um botão com a bandeira e a sigla do idioma atual (ex: 🇧🇷 PT); a grade de bandeiras NÃO aparece aberta
2. Clicar no botão
   → **Esperado:** abre inline a lista de todos os idiomas (bandeira + sigla), com o atual destacado
3. Escolher outro idioma (ex: FR)
   → **Esperado:** interface troca para o idioma; a lista fecha; o botão passa a mostrar 🇫🇷 FR
4. Reabrir a lista
   → **Esperado:** o idioma atual continua destacado
5. Conferir que a troca persiste (conta logada → salva no servidor)

---

### T-S42-1 — i18n dos popups de inatividade
**Sessão:** S42 | **Arquivo:** `html/index.html`

1. Trocar idioma para EN (ou outro). Numa partida PvP, ficar inativo ~60s
   → **Esperado (jogador inativo):** popup com título, botão "RETURN (n)" com contador funcionando, e "ABANDON MATCH" — tudo no idioma escolhido
2. Do lado do oponente
   → **Esperado:** "OPPONENT INACTIVE" / "AWAITING ACTION" / "RETURN" no idioma escolhido
3. Conferir o contador do botão VOLTAR/RETURN decrementa normalmente (não quebrou)
4. Repetir em FR/JA/RU para checar acentuação/caracteres

---

### T-S43-1 — i18n dos overlays de abandono/cancelamento/sair
**Sessão:** S43 | **Arquivo:** `html/index.html`

1. Trocar idioma para EN (ou outro). Numa partida, clicar no X de abandonar
   → **Esperado:** popup "ABANDON MATCH?" + sub + "YES — ABANDON" + "CANCEL" no idioma escolhido
2. Provocar cancelamento de partida (dupla inatividade no pré-jogo)
   → **Esperado:** overlay "MATCH CANCELLED" + sub no idioma
3. Tela de sair (`exc-leave-overlay`, ao tentar deixar a partida)
   → **Esperado:** "Leave the match?" + aviso de W.O. + "Leave anyway" / "Keep playing" no idioma
4. Repetir em FR/DE/JA conferindo acentuação/caracteres

---

### T-S44-1 — i18n popup retornar + reconexão + eyebrows + matchmaking/créditos
**Sessão:** S44 | **Arquivo:** `html/index.html`

1. Trocar idioma para EN. Provocar o prompt de retorno (reconexão dupla)
   → **Esperado:** "RETURN TO GAME?" + sub + "YES (n)" com contador + "NO" em EN
2. Desconexão do oponente → overlay de reconexão
   → **Esperado:** eyebrow "Opponent disconnected" + título "AWAITING RECONNECTION" no idioma
3. Abrir modais de conta (logout, excluir conta, alterar senha, ban)
   → **Esperado:** os eyebrows (Account/Permanent action/Security/Restricted access) no idioma
4. Iniciar uma partida → tela de contagem regressiva
   → **Esperado:** "Prepare your strategy" no idioma escolhido
5. Configurações → Créditos
   → **Esperado:** "Thanks for playing. / Feedback is very welcome." no idioma
6. Repetir em FR/RU/JA conferindo acentuação/caracteres

---

## ✅ Já testados e aprovados

| Sessão | Descrição | Testado por |
|--------|-----------|-------------|
| S01 | Gates rígidos do PRONTO | Gabriel (confirmado em sessão) |
| S30+S31 | Render otimista no POSITION + juice | Gabriel (feedback aplicado em S31b/S31c) |
| S31b | Freeze modal duelo 15s + freeze game over | Gabriel (feedback aplicado em S31c) |
| S31c | Dado girando + timer + bug sessão | Gabriel ("Dado e Timer - OK") |

---

## 📋 Resumo — pendentes por área

| # | Sessão | Teste | Área |
|---|--------|-------|------|
| 1 | S03 | T-S03-1 — Ranked só pareia com Ranked | Servidor |
| 2 | S17 | T-S17-1 — Reconexão mid-game restaura partida | Servidor |
| 3 | S17 | T-S17-2 — WO por timeout de reconexão (90s) | Servidor |
| 4 | S17 | T-S17-3 — Reconexão de convidado (token) | Servidor |
| 5 | S02 | T-S02-1 — Taxonomia de resultado no banco | Banco |
| 6 | S16 | T-S16-1 — Botão ABANDONAR visível | Frontend |
| 7 | S16 | T-S16-2 — Abandonar no pré-jogo → cancelamento | Frontend |
| 8 | S16 | T-S16-3 — Abandonar em ACTION → W.O. | Frontend |
| 9 | S16 | T-S16-4 — AFK timeout pré-jogo → cancelamento | Frontend |
| 10 | S16 | T-S16-5 — ABANDONAR no Solo | Frontend |
| 11 | S11 | T-S11-1 — Nickname do oponente no HUD | Frontend |
| 12 | S13 | T-S13-1 — Banner Morte Súbita traduzido | Frontend |
| 13 | S33 | T-S33-A — ptBR como idioma padrão | Frontend |
| 14 | S14 | T-S14-1 — Undo granular no Draft | Frontend |
| 15 | S22 | T-S22-1 — V/D/E só em ranked | Banco |
| 16 | S10 | T-S10-1 — Timer de fase visível no HUD | Frontend |
| 17 | S21 | T-S21-1 — Empate no histórico | Frontend |
| 18 | S21 | T-S21-2 — Replay viewer funcional | Frontend |
| 19 | S21 | T-S21-3 — Date legível no Firefox | Frontend |
| 20 | S21 | T-S21-4 — CHECK constraint no banco novo | Banco |
| 21 | S28 | T-S28-1 — Contorno das peças | Visual |
| 22 | S32 | T-S32-1 — Coesão visual dark mode | Visual |
| 23 | S29 | T-S29-1 — Tipografia Inter unificada | Visual |
| 24 | S27 | T-S27-1 — Tutorial automático (1ª partida) | Frontend |
| 25 | S27 | T-S27-2 — Tutorial via Configurações | Frontend |
| 26 | S27 | T-S27-3 — Botão Pular do tutorial | Frontend |
