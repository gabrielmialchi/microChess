# microChess — Diretrizes Pós 1º Open Test
## Análise cruzada (feedback + dados) → alinhamento de expectativas antes de implementar
### Criado em 2026-06-15

---

## Como usar este documento

Este é o **documento de alinhamento** do ciclo pós-open-test. Antes de tocar em código,
cada ajuste é descrito em três colunas:

- **Hoje** — o comportamento atual e o problema que ele gera para o jogador.
- **Desejado** — como deve se comportar e qual dor do usuário isso resolve.
- **Ação + mecânicas impactadas** — o que precisa ser revisado e o que esse ajuste toca.

Legenda de origem do "Hoje":
- ✔️ confirmado no código / dados
- ❓ inferido — **precisa verificação no código antes de implementar** (ver §4)

Cada item tem um ID `OT-NN` para rastreio. A reconciliação com o planejamento já
existente (`SESSAO_POR_SESSAO_PLANNING.md`) está na §3 — **vários itens já estão
parcial ou totalmente planejados; não duplicar.**

---

## 1. Fonte dos insights

Cruzamento de duas fontes do 1º Open Test (noite de 11→12/06/2026, ~3h30, 21 contas,
45 PvP, 145 solo, 2.440 eventos):

- **Qualitativo:** `Feedbacks First Tests.pdf` (Google Forms + relatos de Muka e Dash).
- **Quantitativo:** `analytics/RELATORIO_OPEN_TEST.md` e `analytics/ANALISE.md`.

> **Parcimônia com quedas/W.O.:** os testadores foram instruídos a ficar AFK de
> propósito e o Dash derrubou o servidor intencionalmente. Os 11% de W.O. e as 18
> desconexões **não** são tratados como frustração orgânica. Infra = aprovada.

---

## 2. Tabela Hoje / Desejado / Ação

### 🔴 A — Bugs de regra (prioridade máxima — quebram a confiança no jogo)

| ID | Hoje | Desejado | Ação + mecânicas impactadas |
|----|------|----------|------------------------------|
| **OT-01** Captura / peças sumindo | ❓ **3 relatos** (Muka: "comeu 2 peças em 1 jogada"; Dash: "+1 peça por turno"; **Vivi: "peças sumindo, parecem se comer sem jogar dados"**). | Regra de captura clara: deixar explícito **quando rola dado (Rei) vs quando captura direto** (não-Rei auto-captura). Nunca remover >1 peça por jogada indevidamente. | **Reframe:** 3 relatos do mesmo fenômeno sugerem **falta de clareza** da auto-captura sem dado, não necessariamente bug. S04 decide: bug × gap de comunicação. Se for clareza → roteia para tutorial (OT-04) + juice de captura (J5) + OT-15. Impacta: **resolução de ACTION, duelo, comunicação da regra**. |
| **OT-02** Vitória sem posicionar | ❓ Muka: "Ganhei assim que dei início" + "permitir jogar sem posicionar peça não deveria". Dado: **12 exércitos saíram vazios** (timeout/desconexão no draft) → encaixa com vitória relâmpago quando um lado entra sem peças. | Não é possível ficar PRONTO sem posicionamento mínimo. Exército vazio = estado inválido (re-draft/auto-posiciona), nunca vitória instantânea do oponente. | Revisar gatilho de GAMEOVER por "sem peças" + travas de PRONTO. Impacta: **POSITION, condição de fim de jogo, draft com timeout**. Liga ao BUG-PRONTO já planejado. |
| **OT-03** Empate inesperado | ❓ Muka: "fiz uma jogada e deu empate do nada". Dado: **11,1% de empates** — alto demais para regra que só permite empate em Morte Súbita 0×0 ([[project_draw_mechanic]]). Parte é queda de servidor (parcimônia), mas o relato do Muka é dentro de jogada normal. | Empate só pelo design (Morte Súbita 0×0). Empate por queda/timeout é registrado com **motivo distinto** e não confundido com empate de regra. | Revisar gatilho de `draw` na resolução. Separar no log `draw_rule` vs `draw_disconnect`. Impacta: **resolução de ACTION, Morte Súbita, ADJ-D (empate por dupla inatividade)**. |

### 🟠 B — Retenção (onde os dados gritam mais alto)

| ID | Hoje | Desejado | Ação + mecânicas impactadas |
|----|------|----------|------------------------------|
| **OT-04** Tutorial pós-login | ✔️ Não há tutorial. Funil solo cai de **40 (nível 1) → 17 (nível 3)**; conclusão 52%. Dash pediu tutorial; **Vivi: "início confuso — compra de peças, posicionamento"**. | **DECIDIDO:** partida-tutorial **scriptada** — 1ª partida guiada contra bot fraco com passos roteirizados (draft → posicionar → revelar → duelo). Incluir **dica "arraste a peça"** no posicionamento. | **Feature nova, escopo grande.** Impacta: **onboarding, primeira sessão, todas as fases, bot scriptado**. Ver §3 — não está no plano atual; merece sessão dedicada de design. |
| **OT-05** Curva dos níveis 1–3 | ✔️ Metade do público trava nos 3 primeiros níveis solo. | Níveis 1–3 mais suaves / introdutórios, alinhados ao tutorial. | Rebalancear dificuldade do BOT / composição inimiga nos primeiros níveis. Impacta: **design de nível solo, IA do bot**. |
| **OT-06** Domínio do Peão | ✔️ Draft: Peão **52,7%**, Torre **5,5%**. Concentração extrema. | Distribuição mais equilibrada; cada peça com valor percebido claro. | Investigar se é estratégia ótima real ou falta de clareza. Impacta: **balanceamento de custo/bônus de peças, UI do draft, OT-15 (legibilidade)**. |
| **OT-07** Desfazer compra no draft | ❓ Muka: "se clicar na peça que não desejava comprar, não tem como voltar atrás". Existe `draft_reset` (zera tudo), mas talvez não um "desfazer 1". | Desfazer a última compra / devolver peça específica sem zerar o exército todo. | Expor undo granular no draft. Impacta: **fase DRAFT, UI da loja, OT-06 (pode reduzir o medo de errar que empurra pro Peão)**. |

### 🟡 C — UX em partida (barato, alto impacto percebido)

| ID | Hoje | Desejado | Ação + mecânicas impactadas |
|----|------|----------|------------------------------|
| **OT-08** Abandonar partida | ✔️ Sem botão de abandono explícito (citado 2× no Forms, esp. vs robôs). | Botão de abandonar visível em PvP e Solo, com confirmação. PvP → WO; Solo → volta ao hub. | Impacta: **HUD da partida, fluxo WO (PvP), retorno do solo, ADJ-B (inatividade)**. |
| **OT-09** Timer de posicionamento | ✔️ Muka: "não tem como saber o tempo pra posicionar". | Tempo restante visível em DRAFT/POSITION/ACTION. | Impacta: **HUD, timers de fase, ADJ-JUICE-C J2 (urgência do timer)**. |
| **OT-10** Feedback "Ready" | ✔️ Muka: mensagem de "ready" confunde quando o oponente ainda está posicionando. | Estado claro: "Você: PRONTO — aguardando oponente". | Impacta: **HUD, sincronização de fases**. |
| **OT-11** "Sudden Death" abrupto | ✔️ Muka: texto aparece de repente; pediu mudar. | Transição/aviso antes da Morte Súbita; texto traduzido (não "Sudden Death"). | Impacta: **Morte Súbita, i18n, ADJ-JUICE-A J6 (ritmo entre rodadas SD)**. |
| **OT-12** Nome do oponente | ✔️ Dash + Forms + **Vivi**: querem ver nome/perfil do adversário na partida ("por vingança"). | Nick (e talvez rank) do oponente no HUD durante a partida. | Impacta: **HUD, dados de sala enviados pelo servidor**. |
| **OT-13** Botão voltar sem ícone | ✔️ Muka: "back sem ícone" (no iPhone o back nativo salvou). | Ícone explícito de voltar nas telas. | Impacta: **navegação, design das telas**. |
| **OT-14** Idioma | ✔️ Muka pediu travar em ptBR. Hoje há 9 idiomas. | **DECIDIDO:** manter os 9 idiomas; só garantir **ptBR como padrão inicial**. | Impacta: **i18n, configurações** (apenas idioma default). |

### 🟢 D — Visual / Design (alimenta o handoff do Claude Design — [[project_design_handoff]])

| ID | Hoje | Desejado | Ação + mecânicas impactadas |
|----|------|----------|------------------------------|
| **OT-15** Contorno das peças | ✔️ Reclamação repetida: ícone escuro em fundo escuro fica ilegível. | Contorno preto em peças brancas, contorno branco em pretas; outline reforçado no dark mode. | Impacta: **legibilidade, OT-06 (clareza de peças no draft)**. Levar ao briefing de design. |
| **OT-16** Tipografia | ✔️ Fontes serifadas (Cinzel) cansam no digital; pediram sem serifa. | Avaliar fonte sem serifa para corpo de texto (manter serifada só em títulos?). | Impacta: **identidade visual, legibilidade**. Decisão de design. |
| **OT-17** Ícones de resultado | ✔️ Forms: querem ícones coloridos para V/D/E. | Ícones/cores distintos para vitória, derrota e empate. | Impacta: **game over, perfil, histórico**. |

### ⚙️ E — Sistemas e dados (média prioridade — investigar)

| ID | Hoje | Desejado | Ação + mecânicas impactadas |
|----|------|----------|------------------------------|
| **OT-18** Ranqueada não computa | ❓ Dash: vitórias ranqueadas apareceram como "Partida Não Ranqueada"; suspeita de matchmaking misturando casual e ranked. Dado: muitos no ranking em 1500 com 0 partidas. | Partida ranqueada sempre computa MMR/XP; matchmaking nunca mistura modos. | Auditar marcação de modo no pareamento e na gravação do resultado. Impacta: **matchmaking, MMR, gravação de partida, OT-19**. |
| **OT-19** Display V/D/E | ✔️ Dash: V/D/E deve contar só ranqueadas válidas (home, perfil, leaderboard). | Estatísticas exibidas só de ranqueadas válidas. | Impacta: **queries de perfil/leaderboard/home**. Liga a OT-18. |
| **OT-20** Replays quebrados | ❓ Dash: replays não funcionavam no cliente dele. | Replay reproduz a partida turno a turno corretamente. | Verificar gravação (`replays.turns_json`) e o viewer `screen-replay`. Impacta: **replay system, gravação por turno**. |
| **OT-21** Mobile: tela apaga / troca de app | ❓ Dash: tela do celular apaga → itch minimiza → volta perdido em WO ou cai no menu. **Vivi: "sai do app e abre outro → conexão perdida".** Parcialmente AFK proposital, mas há problema real de ciclo de vida mobile (2 relatos). | App tolera background curto / reconecta ao voltar (liga ao ADJ-C 90s). | Impacta: **reconexão (ADJ-C/S17), ciclo de vida mobile/itch, sessionStorage de token**. |
| **OT-22** Copiar/colar senha | ❓ Muka: copiar/colar senha não funciona (talvez limitação do itch). | Colar senha funciona no campo de login. | Verificar campo de senha (paste handlers / itch iframe). Impacta: **auth, login**. Baixa. |
| **OT-25** Lentidão / cliques 🔴 | ❓ **Vivi: "demora ao clicar na peça ou no quadradinho para posicionar"** + "demora pra aparecer o próximo passo depois do dado". Reforça Forms ("cliques simplesmente não funcionavam ao posicionar"). **2 fontes — possivelmente bloqueia o jogo.** | Input responsivo: clicar/arrastar peça e casa respondem imediatamente, sem esperar round-trip perceptível. | **Investigar primeiro.** Causas prováveis: ausência de UI otimista (cada clique espera o servidor), re-render do tabuleiro inteiro, ou latência do Railway. Separar latência real do **beat proposital J7/J8** após o dado. Impacta: **render do tabuleiro, fluxo de eventos socket, POSITION/ACTION, juice**. |
| **OT-26** Coesão visual menu↔jogo | ❓ **Vivi: "tela do jogo preta não tem relação com a identidade bege/laranja do início".** | Tabuleiro/HUD coerentes com a identidade visual do menu. | Decisão de design (handoff). Impacta: **identidade visual, tela de jogo, [[project_design_handoff]]**. |

### 💡 F — Conteúdo / backlog (sugestões para avaliar — não comprometido)

| ID | Sugestão | Origem |
|----|----------|--------|
| **OT-23** Boss a cada 10 níveis no solo | Forms | Backlog de conteúdo solo |
| **OT-24** Emojis para provocar amigos | Forms | Backlog social |

---

## 3. Reconciliação com o planejamento existente

**Muito do feedback já tem casa no plano.** Antes de criar sessões novas, mapear:

| Item novo | Situação no plano atual | Decisão |
|-----------|--------------------------|---------|
| OT-02 (jogar sem posicionar) | **BUG-PRONTO** já cobre POSITION/DRAFT/ACTION incompleto (popup SIM/NÃO) | Validar se BUG-PRONTO também elimina a *vitória relâmpago* por exército vazio; senão, estender |
| OT-03 (empate) | **ADJ-D** cobre empate por dupla inatividade/desconexão | Adicionar a separação `draw_rule` vs `draw_disconnect`; investigar empate mid-jogada (não coberto) |
| OT-08 (abandonar) | **ADJ-B** trata inatividade/WO; abandono explícito não está claro | Adicionar botão de abandono explícito (PvP+Solo) sobre a base do ADJ-B |
| OT-09 (timer) | **ADJ-JUICE-C J2** (urgência do timer) | J2 dá o *feel*; falta a **existência** do timer visível — unir os dois |
| OT-11 (Sudden Death) | **ADJ-JUICE-A J6** (ritmo entre rodadas SD) | J6 cobre ritmo; falta o aviso de entrada + tradução do texto |
| OT-07 (desfazer draft) | **ADJ-JUICE-D J9** (juice da compra) | J9 é só polimento visual; o *undo funcional* é novo |
| OT-21 (mobile/background) | **ADJ-C** (reconexão 90s) | Validar se ADJ-C cobre o caso de background do itch |
| OT-01, 04, 05, 06, 12, 13, 15–20, 22 | **Sem cobertura no plano** | Itens novos a planejar |

**Conflito de contexto a resolver:** o `SESSAO_POR_SESSAO_PLANNING.md` está focado em
**ADJ-JUICE** (game feel) e **BUG-PRONTO**, com ADJ-B/C/D descritos no
`PROJECT_CONTEXT.md`. O ciclo pós-open-test precisa ser repriorizado: os **bugs de
regra (OT-01/02/03)** e a **retenção (OT-04/05)** passam à frente do juice. Proposta de
reordenação na §5.

---

## 4. Resultados da investigação no código (pesquisador, read-only — 15/06)

| Item | Veredito | Achado |
|------|----------|--------|
| **OT-02** Exército vazio | ✅ **BUG CONFIRMADO** | `draft_ready` (`server.js:1533-1550`) e `position_ready` (`server.js:1581-1603`) **não validam exército vazio**. Dá para ficar PRONTO com 0 peças → na ACTION o Rei sozinho é capturado → derrota relâmpago. **BUG-PRONTO (frontend) não basta: precisa de guarda no servidor.** |
| **OT-03** Empate fantasma | ✅ **CAUSA-RAIZ PROVÁVEL** | Em `_persistDB` (`server.js:445` e `:453`), **qualquer fim de partida sem vencedor claro (`winnerColor` null/falsy) cai em `result = 'draw'`** — é um catch-all. É o caminho mais provável do "empate do nada" do Muka. Empates de regra (Morte Súbita 0×0) estão em `:916-928` e `:853-880`; empate por dupla inatividade em `:570-580`. **Todos colapsam no mesmo `'draw'` sem motivo distinto.** |
| **OT-18** Ranked não computa | ⚠️ **FRAGILIDADE CONFIRMADA** | O modo da sala usa **só o jogador 1**: `roomMode = p1.match_mode \|\| 'ranked'` (`server.js:1222`). Se os dois entraram em modos diferentes, o modo do p2 é ignorado → uma ranqueada pode virar casual e não computar MMR (`_persistDB:437-448`). Explica o relato do Dash. |
| **OT-01** Captura múltipla | ❓ **NÃO REPRODUZIDO — MANTER ABERTO** | A leitura do código indica que **cada lado captura no máx. 1 peça não-Rei por turno** e os duelos são sequenciais (`server.js:753-789`, `801-826`, `987-1018`) → sem caminho óbvio de bug. **Mas isso contradiz 2 relatos independentes.** Hipóteses: (a) na revelação simultânea, cada lado captura 1 → parece "2 num turno"; (b) múltiplos duelos no mesmo turno; (c) edge case não coberto pela leitura estática. **Precisa reprodução em teste local, não fechar como "sem bug".** |
| **OT-20** Replays | ✅ **FUNCIONAL no servidor** | Gravação (`replay.js:5-35`, `server.js:483-487`) e leitura (`/match/:id/replay`, `server.js:346-356`) estão corretas. Risco baixo (replay incompleto só em crash no meio). O problema do Dash é provavelmente client-side/partida específica → **prioridade rebaixada**; verificar o viewer `screen-replay` no frontend, não a gravação. |

**Reclassificação após investigação:**
- OT-02 e OT-03 sobem para 🔴 com **causa-raiz localizada** — viram tarefa direta.
- OT-18 vira tarefa de correção pontual (usar modo de ambos / regra explícita de pareamento).
- OT-01 continua 🔴 mas **muda de "corrigir" para "reproduzir primeiro"** (usar o loop local da §5 com 2 janelas).
- OT-20 desce para 🟢 e muda de escopo (frontend, não servidor).

---

## 5. Solução para o gargalo de testes (loop rápido sem itch)

**A boa notícia: o teste local rápido já está pronto no código.** Zipar pro itch só é
necessário para a build pública — não para iterar.

Por que já funciona:
- `server/server.js:75` → `app.use(express.static('../html'))`: o servidor **já serve o
  `html/index.html`**.
- `html/index.html:4701-4703` → o frontend detecta `localhost`/`192.168.*`/`10.*`/`172.*`
  e conecta o Socket.io ao **servidor local** (`SERVER_URL = ''`); só usa a URL do
  Railway fora disso.

### Loop de desenvolvimento recomendado

1. **Subir o servidor local uma vez:**
   ```
   cd server
   npm run dev
   ```
   (usa nodemon — reinicia sozinho ao editar `server.js`)

2. **Abrir no navegador:** `http://localhost:3000`
   - Editou o `index.html`? Só **atualizar a página (F5)** — sem zip, sem deploy.
   - O banco é o `server/db/microchess.db` **local** — não toca a produção.

3. **Testar PvP sozinho (dois jogadores na mesma máquina):**
   - Abrir `localhost:3000` em uma janela normal **e** uma janela anônima (ou dois
     perfis do navegador). Cada uma é um cliente; entram na fila e pareiam entre si.

4. **Testar no celular (sem itch):**
   - Celular na **mesma rede Wi-Fi** → acessar `http://SEU_IP_LOCAL:3000`
     (ex.: `192.168.0.10:3000`). A detecção de `192.168.*` já aponta o socket pro local.
   - Descobrir o IP: `ipconfig` (Windows) → "Endereço IPv4".

5. **Validar sintaxe sem subir nada** (regra do projeto):
   ```
   node --check server/server.js
   ```

**Quando ainda assim usar o itch:** só para validar o empacotamento final / comportamento
específico do iframe do itch (ex.: OT-22 copiar senha, OT-21 background no mobile).

> Possível melhoria futura (opcional): atalhos de "dev mode" (pular fila, sembar partida
> de teste, contas seed) para não refazer draft+posição a cada teste. Avaliar só se o loop
> acima ainda for lento na prática.

---

## 6. Próximos passos sugeridos

1. **Confirmar** os 5 itens da §4 no código (pesquisador, read-only).
2. **Repriorizar** o `SESSAO_POR_SESSAO_PLANNING.md`: bugs de regra (OT-01/02/03) →
   retenção (OT-04/05) → UX em partida → sistemas → juice → design.
3. ~~Decidir produto~~ **DECIDIDO (15/06):** OT-14 → manter 9 idiomas, ptBR como padrão; OT-04 → partida-tutorial scriptada.
4. Só então abrir as branches de implementação.

---

## 7. Especificação — fluxo Draft / Positioning / Action + AFK (definido 15/06)

Refinamento do Gabriel sobre o botão PRONTO e o AFK por fase.
**Substitui parcialmente o BUG-PRONTO nas fases pré-jogo.**

### Draft
- **[PRONTO] desabilitado** enquanto o roster tiver **0 peças**.
- **≥1 peça** comprada → **[PRONTO] habilitado**.
- Pontos de compra > 0 ao confirmar → aviso "ainda há pontos" (popup *soft* já feito no BUG-PRONTO; não bloqueia).

### Positioning
- **[PRONTO] desabilitado** até **TODAS as peças compradas** estarem posicionadas — **gate rígido**, sem popup de "seguir sem posicionar".

### Action (e fases seguintes)
- **[PRONTO]** mantém o comportamento atual + popup "passar o turno sem mover?" (BUG-PRONTO, decisão consciente — **inalterado**).
- **AFK e não retorna** → vitória do jogador ativo (WO), após **checagem silenciosa de reconexão/atividade** (sem popup "voltar ao jogo").

### AFK no pré-jogo (Draft/Positioning)
- Detecção reusa o ADJ-B: **~50s sem clique → banner de aviso + countdown**; não retornou → **partida CANCELADA, ambos voltam ao lobby**.
- **Sem WO, sem empate, sem MMR.** Resultado persistido como **`cancelled`** (motivo distinto — nunca `draw`).
- **Penalidade leve anti-abuso** para quem causou o cancelamento (ex.: contador de cancelamentos / cooldown leve na fila — métrica a definir na implementação).

### Por que resolve
- **OT-02** na raiz: impossível entrar no Action com exército vazio (gate rígido de Positioning).
- **OT-03** em parte: os "12 exércitos vazios" e timeouts de pré-jogo viram **`cancelled`**, não empate fantasma.
- Substitui a regra antiga (DRAFT/POSITION 120s → WO) por **cancelamento avisado**.

### Mecânicas impactadas
DRAFT, POSITION, ACTION, sistema de inatividade (S16/ADJ-B), persistência (novo resultado `cancelled`), reconexão (S17), anti-abuso.

### Decisões registradas (15/06)
1. AFK pré-jogo: avisar com countdown, depois cancelar. ✔️
2. Cancelamento gera **penalidade leve anti-abuso** para quem ficou AFK. ✔️
3. Action: **checagem silenciosa** de reconexão (sem popup). ✔️

> Tarefas afetadas: **S01** (gates rígidos + guarda de servidor), **S16** (inatividade
> por fase), **S18** (empate só em Action; pré-jogo é `cancelled`). Ver planning.
