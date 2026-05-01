# Single Player — Plano de Expansão (SP-1..SP-9)

> Documento autocontido. Cada sessão SP-X.Y lê **apenas este arquivo** + os arquivos que sua subtarefa toca. Não precisa abrir os planejamentos antigos.

---

## 1. Objetivo do Epic completo

Transformar a opção "Tutorial" da tela Novo Jogo em um modo **SOLO** robusto, com 15 fases progressivas, cada uma contra um bot de estratégia diferente, com progresso salvo no servidor para usuários autenticados.

---

## 2. Decisões aprovadas pelo usuário (não revisitar)

| Tópico | Decisão |
|---|---|
| Botões da tela "Novo Jogo" | **SOLO** ↔ **ONLINE** |
| Botões do hub Solo | **CONTINUAR** ↔ **NOVO** |
| Botões do hub Online | **CASUAL** ↔ **RANQUEADA** (já existem; reaproveitar) |
| Lista das 15 fases | Recruta → Lenda (ver tabela §5) |
| Convidados (sem login) | **NÃO salvam progresso**. Ao tentar Solo sem login, redireciona para auth. |
| Onde salva o doc do plano | `docs/SP_PLANNING.md` (este arquivo) |

---

## 3. Estado atual do código (mapeado em 2026-04-30)

- `#screen-game-mode` ([html/index.html:2012-2037](../html/index.html#L2012)) tem 3 cards: Casual / Ranqueada / Tutorial
- `server/bot.js` (126 linhas) — **uma única** estratégia: compra Knight+Peões, vai sempre rumo ao Rei
- `server/server.js`:
  - linha ~1129: `queue_train` cria sala bot
  - linha ~569: `processBotTurn` chamado dentro do `broadcast`
  - linha ~1031: `queue_join` recebe `match_mode` (`casual` / `ranked`)
- Não há tabela de progresso single-player no banco.
- i18n: 9 idiomas em `T = { pt, en, es, de, it, ru, ja, ko, zh }` ([html/index.html:2960](../html/index.html#L2960))

---

## 4. Arquitetura proposta

### Backend
```
server/
├── bot.js                       ← refatorar: dispatch via strategyId
├── bot-strategies/              ← NOVO diretório
│   ├── index.js                 ← registry { id → module }
│   ├── 01-recruta.js
│   ├── 02-aprendiz.js
│   ├── ...
│   └── 15-lenda.js
├── singleplayer.js              ← NOVO: progresso (DB + endpoints)
└── db/database.js               ← migração: tabela singleplayer_progress
```

Cada estratégia exporta:
```js
module.exports = {
  id: 1,
  name: 'recruta',
  chooseDraft(state, color)    { /* retorna {action, payload} */ },
  choosePosition(state, color) { /* idem */ },
  chooseAction(state, color)   { /* idem */ }
};
```

### Frontend
- `#screen-game-mode` — reformatado (2 cards: SOLO / ONLINE)
- `#screen-multiplayer-mode` — NOVA (Casual + Ranqueada + FIND MATCH)
- `#screen-solo-hub` — NOVA (CONTINUAR + NOVO)
- `#screen-sp-map` — NOVA (grid 15 fases)

**Feature flag**: `window.SP_ENABLED = false` (default) até SP-8.4. Telas novas existem mas ficam ocultas.

### Banco
```sql
CREATE TABLE singleplayer_progress (
  player_uid TEXT PRIMARY KEY REFERENCES players(uid),
  max_level_completed INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);
```

### Endpoints REST
```
GET  /sp/progress                  → { max_level_completed: 0..15 }
POST /sp/level-complete  { level } → { ok: true } ou erro 400 se pular
```

---

## 5. As 15 fases (tabela mestre)

| # | Nome | Identidade do bot | Dificuldade |
|---|---|---|---|
| 1 | Recruta | Movimentos aleatórios; compra peças aleatórias | ★ |
| 2 | Aprendiz | Só peões; avança 1 casa por vez sem captura | ★ |
| 3 | Defensor | Não cruza meio do tabuleiro; protege Rei | ★ |
| 4 | Atirador | 4 peões em linha; pressão frontal | ★★ |
| 5 | Cavaleiro | Cavalo + 2 peões; agressivo; foca o Rei | ★★ |
| 6 | Bispeiro | 2 Bispos; controla diagonais | ★★ |
| 7 | Tanque | Torre + peões; pressão lenta e direta | ★★★ |
| 8 | Caçador | Heurística atual: Manhattan dist. ao Rei | ★★★ |
| 9 | Estrategista | Avalia ameaça antes de mover (recua se peça em risco) | ★★★ |
| 10 | Duelista | Prioriza duelos com bônus alto (Q/R/N) | ★★★ |
| 11 | Cercador | Move por flancos (x=0 e x=3) | ★★★★ |
| 12 | Iscador | Sacrifica peão pra abrir caminho de peça forte | ★★★★ |
| 13 | Rainha | Compra Q + 0 peões; muito agressivo | ★★★★ |
| 14 | Mestre | Pondera ofensa/defesa; lookahead 2-ply | ★★★★★ |
| 15 | Lenda | Mestre + 20% de aleatoriedade (imprevisível) | ★★★★★ |

> Nomes em PT como referência. Tradução para os 8 idiomas restantes acontece em SP-7.4.

---

## 6. Convenções para evitar retrabalho

1. **Não reescrever** `server.js` ou `index.html` — só inserir blocos
2. **CSS novo** sempre inline em `style="..."`
3. **1 estratégia = 1 arquivo** em `server/bot-strategies/NN-nome.js`
4. **Feature flag** `SP_ENABLED` desligada até SP-8.4
5. **i18n**: novas chaves em todos os 9 blocos `T.{pt,en,...}` simultaneamente — nunca deixar idioma faltando
6. **Subagentes**: usar `pesquisador` (haiku) para localizar pontos de inserção; `programador` (sonnet) para escrever código; `designer` (sonnet) para HTML/CSS de telas novas

---

## 7. EPICs e subtarefas

### EPIC SP-1 — Especificação (sem código de produção)

#### SP-1.1 — Terminologia × 9 idiomas
- **Pré-requisito:** nenhum
- **Subagente:** nenhum (trabalho direto)
- **Output:** `docs/SP_TERMS.md`
- **Conteúdo:** tabela com chaves `sp_solo`, `sp_online`, `sp_continue`, `sp_new`, `sp_locked`, `sp_completed`, `sp_current`, `sp_play`, `sp_back_to_map`, `sp_victory`, `sp_defeat`, `sp_next_level`, `sp_retry` × 9 idiomas (pt, en, es, de, it, ru, ja, ko, zh)
- **Checklist:**
  ```
  [ ] 1. Listar todas as chaves i18n necessárias para Single Player
  [ ] 2. Traduzir cada chave para os 9 idiomas (referência: blocos T.pt/T.en em html/index.html)
  [ ] 3. Validar comprimento — nenhuma label > 14 caracteres em PT/EN
  [ ] 4. Salvar em docs/SP_TERMS.md
  ```

#### SP-1.2 — Spec textual das 15 estratégias
- **Pré-requisito:** nenhum
- **Subagente:** nenhum
- **Output:** `docs/SP_STRATEGIES.md`
- **Conteúdo:** para cada estratégia 1-15 — descrição em pseudocódigo de:
  - DRAFT: que peças comprar e em que ordem
  - POSITION: onde posicionar cada peça
  - ACTION: heurística de escolha de movimento (incluindo taxa de erro)
- **Checklist:**
  ```
  [ ] 1. Para cada estratégia 1..15, escrever seção com 3 sub-blocos (DRAFT/POSITION/ACTION)
  [ ] 2. Especificar parâmetros numéricos (ex: taxa de erro 30%, lookahead 2-ply)
  [ ] 3. Garantir que cada estratégia é distinguível das outras (sem duplicatas funcionais)
  [ ] 4. Salvar em docs/SP_STRATEGIES.md
  ```

#### SP-1.3 — Wireframes textuais das 4 telas
- **Pré-requisito:** SP-1.1
- **Subagente:** `designer` para wireframe ASCII opcional
- **Output:** `docs/SP_WIREFRAMES.md`
- **Conteúdo:** layout textual de:
  - `#screen-game-mode` reformatado (2 cards grandes)
  - `#screen-multiplayer-mode` (extração da tela atual)
  - `#screen-solo-hub` (2 cards Continuar/Novo)
  - `#screen-sp-map` (grid 15 fases — estados visual)
- **Checklist:**
  ```
  [ ] 1. ASCII art / descrição estrutural de cada tela
  [ ] 2. Listar todos os IDs HTML necessários
  [ ] 3. Listar handlers JS (onclick) por elemento
  [ ] 4. Salvar em docs/SP_WIREFRAMES.md
  ```

---

### EPIC SP-2 — Backend: progresso persistente

#### SP-2.1 — Migration SQLite
- **Pré-requisito:** nenhum
- **Subagente:** `pesquisador` (localizar `server/db/database.js` migrations) → `programador` (inserir migration)
- **Arquivos:** `server/db/database.js`
- **Checklist:**
  ```
  [ ] 1. Localizar bloco de migrations existente em server/db/database.js
  [ ] 2. Adicionar CREATE TABLE IF NOT EXISTS singleplayer_progress (...)
  [ ] 3. Validar com `node --check server/db/database.js`
  [ ] 4. Reiniciar servidor mentalmente e confirmar que a tabela seria criada (sem subir o servidor)
  ```

#### SP-2.2 — Módulo `server/singleplayer.js`
- **Pré-requisito:** SP-2.1
- **Subagente:** `programador`
- **Arquivos:** criar `server/singleplayer.js`
- **Checklist:**
  ```
  [ ] 1. Criar server/singleplayer.js com 3 funções: getProgress(uid), markLevelCompleted(uid, level), validateLevelProgress(uid, level)
  [ ] 2. validateLevelProgress: rejeita se level > max+1 (não pode pular)
  [ ] 3. markLevelCompleted: só atualiza se level > max atual
  [ ] 4. Exportar todas as 3 funções
  [ ] 5. Validar sintaxe: node --check server/singleplayer.js
  ```

#### SP-2.3 — Endpoints HTTP
- **Pré-requisito:** SP-2.2
- **Subagente:** `pesquisador` (encontrar local certo no server.js para inserir rotas) → `programador`
- **Arquivos:** `server/server.js` (apenas inserir 2 rotas + require)
- **Checklist:**
  ```
  [ ] 1. require server/singleplayer.js no topo do server.js
  [ ] 2. Inserir GET /sp/progress (autenticado via middleware existente)
  [ ] 3. Inserir POST /sp/level-complete (autenticado)
  [ ] 4. Aplicar apiLimiter (60 req/min) em ambas
  [ ] 5. Validar sintaxe: node --check server/server.js
  ```

---

### EPIC SP-3 — Backend: bot multi-estratégia

#### SP-3.1 — Refatoração `bot.js` + registry
- **Pré-requisito:** nenhum (mas SP-1.2 ajuda)
- **Subagente:** `programador`
- **Arquivos:** `server/bot.js` (refatorar mantendo retrocompat) + criar `server/bot-strategies/index.js`
- **Estratégia 0** = comportamento atual de `bot.js` (preserva retrocompat para `queue_train`)
- **Checklist:**
  ```
  [ ] 1. Criar server/bot-strategies/index.js exportando { 0: <atual> }
  [ ] 2. Refatorar bot.js para receber strategyId em room._botStrategy (default 0)
  [ ] 3. processBotTurn faz dispatch para a estratégia
  [ ] 4. Garantir que queue_train continua funcionando (testar via grep que nada quebra)
  [ ] 5. Validar sintaxe: node --check server/bot.js
  ```

#### SP-3.2 — Estratégias 1, 2, 3 (Recruta, Aprendiz, Defensor)
- **Pré-requisito:** SP-3.1, SP-1.2
- **Subagente:** `programador`
- **Arquivos:** `server/bot-strategies/01-recruta.js`, `02-aprendiz.js`, `03-defensor.js`
- **Checklist:**
  ```
  [ ] 1. Implementar 01-recruta.js conforme SP_STRATEGIES.md §1
  [ ] 2. Implementar 02-aprendiz.js conforme §2
  [ ] 3. Implementar 03-defensor.js conforme §3
  [ ] 4. Registrar as 3 em bot-strategies/index.js
  [ ] 5. Validar sintaxe dos 3 arquivos
  ```

#### SP-3.3 — Estratégias 4, 5, 6 (Atirador, Cavaleiro, Bispeiro)
- Mesma estrutura de SP-3.2 para fases 4-6.

#### SP-3.4 — Estratégias 7, 8, 9 (Tanque, Caçador, Estrategista)
- Mesma estrutura. **Caçador** = portar lógica atual de `bot.js`.

#### SP-3.5 — Estratégias 10, 11, 12 (Duelista, Cercador, Iscador)
- Mesma estrutura.

#### SP-3.6 — Estratégias 13, 14, 15 (Rainha, Mestre, Lenda)
- Mestre exige lookahead 2-ply; alocar mais tempo para esta sessão.

#### SP-3.7 — Socket evento `single_player_start`
- **Pré-requisito:** SP-3.1
- **Subagente:** `pesquisador` (localizar handler `queue_train`) → `programador`
- **Arquivos:** `server/server.js`
- **Checklist:**
  ```
  [ ] 1. Adicionar handler socket.on('single_player_start', ({level, ...}))
  [ ] 2. Validar level via singleplayer.validateLevelProgress(uid, level)
  [ ] 3. Criar room similar a queue_train, mas com room._botStrategy = level
  [ ] 4. Marcar room._isSinglePlayer = true para identificar no gameOver
  ```

#### SP-3.8 — Marcar level completed no gameOver
- **Pré-requisito:** SP-3.7, SP-2.2
- **Subagente:** `pesquisador` (localizar `_persistDB` ou onde gameOver é finalizado) → `programador`
- **Arquivos:** `server/server.js`
- **Checklist:**
  ```
  [ ] 1. No fim de partida, se room._isSinglePlayer && human venceu → markLevelCompleted(uid, level)
  [ ] 2. Emitir evento socket 'sp_level_completed' { level } para o cliente
  [ ] 3. NÃO afetar MMR/LP (modo solo não conta para ranking)
  ```

---

### EPIC SP-4 — Frontend: tela "Novo Jogo" (2 botões)

#### SP-4.1 — Reformatar `#screen-game-mode`
- **Pré-requisito:** SP-1.3
- **Subagente:** `designer`
- **Arquivos:** `html/index.html` (apenas substituir bloco `#screen-game-mode`; preservar 3 cards antigos como `<!-- legado -->` comentado para rollback fácil)
- **Checklist:**
  ```
  [ ] 1. Localizar #screen-game-mode (~linha 2012)
  [ ] 2. Comentar HTML antigo (não deletar)
  [ ] 3. Inserir nova versão com 2 cards grandes (SOLO / ONLINE) usando IDs gm-card-solo, gm-card-online
  [ ] 4. Cada card é onclick direto → showScreen('solo-hub') ou showScreen('multiplayer-mode')
  [ ] 5. Não há botão FIND MATCH nesta tela (foi para multiplayer-mode)
  ```

#### SP-4.2 — i18n da nova game-mode
- **Pré-requisito:** SP-4.1, SP-1.1
- **Subagente:** `programador`
- **Arquivos:** `html/index.html` (blocos T.pt..T.zh)
- **Checklist:**
  ```
  [ ] 1. Adicionar chaves sp_solo, sp_online em todos os 9 idiomas
  [ ] 2. Atualizar applyLang() para popular gm-card-solo e gm-card-online
  ```

---

### EPIC SP-5 — Frontend: tela Multiplayer

#### SP-5.1 — Criar `#screen-multiplayer-mode`
- **Pré-requisito:** SP-1.3
- **Subagente:** `designer`
- **Arquivos:** `html/index.html` (inserir nova `<div id="screen-multiplayer-mode">` antes/depois de `#screen-game-mode`)
- **Conteúdo:** copiar os cards Casual/Ranqueada + botão FIND MATCH da game-mode atual
- **Checklist:**
  ```
  [ ] 1. Inserir bloco <div id="screen-multiplayer-mode" class="screen">
  [ ] 2. Copiar cards Casual e Ranqueada com novos IDs (mp-card-casual, mp-card-ranked)
  [ ] 3. Botão "FIND MATCH" id mp-find-btn
  [ ] 4. Botão "VOLTAR" → showScreen('game-mode')
  ```

#### SP-5.2 — Migrar lógica de matchmaking
- **Pré-requisito:** SP-5.1
- **Subagente:** `programador`
- **Arquivos:** `html/index.html` (bloco JS)
- **Checklist:**
  ```
  [ ] 1. Renomear/duplicar selectGameMode(mode) para selectMultiplayerMode(mode)
  [ ] 2. Renomear startMatchmakingWithMode para startMatchmakingMP
  [ ] 3. Não remover funções antigas (ainda em uso em #screen-game-mode legado)
  ```

#### SP-5.3 — i18n da multiplayer-mode
- **Pré-requisito:** SP-5.1, SP-1.1
- **Arquivos:** `html/index.html`
- **Checklist:** atualizar applyLang() para mp-card-* labels.

---

### EPIC SP-6 — Frontend: hub Solo

#### SP-6.1 — Criar `#screen-solo-hub`
- **Pré-requisito:** SP-1.3
- **Subagente:** `designer`
- **Arquivos:** `html/index.html`
- **Checklist:**
  ```
  [ ] 1. Inserir <div id="screen-solo-hub" class="screen">
  [ ] 2. Card CONTINUAR (id sh-card-continue) com label do nível atual
  [ ] 3. Card NOVO (id sh-card-new)
  [ ] 4. Botão VOLTAR → showScreen('game-mode')
  ```

#### SP-6.2 — Lógica de fetch de progresso
- **Pré-requisito:** SP-6.1, SP-2.3
- **Subagente:** `programador`
- **Arquivos:** `html/index.html` (bloco JS)
- **Checklist:**
  ```
  [ ] 1. Função loadSPProgress() faz fetch('/sp/progress') com auth header
  [ ] 2. Se !logado → mostrar overlay/redirect para auth
  [ ] 3. Salva resultado em window.spProgress = { max_level_completed }
  [ ] 4. Atualiza label "CONTINUAR — Fase X" baseado em spProgress
  ```

#### SP-6.3 — Botão CONTINUAR
- **Pré-requisito:** SP-6.2, SP-7.1
- **Subagente:** `programador`
- **Checklist:**
  ```
  [ ] 1. onclick CONTINUAR → showScreen('sp-map'), foca card da próxima fase
  [ ] 2. Se max_level_completed === 15 → mostra "Todas as fases completas — explore livremente"
  ```

#### SP-6.4 — Botão NOVO + confirmação
- **Pré-requisito:** SP-6.1
- **Subagente:** `programador`
- **Checklist:**
  ```
  [ ] 1. onclick NOVO → modal de confirmação ("Reiniciar perderá progresso")
  [ ] 2. Se confirmar → POST /sp/reset (NOTA: este endpoint não existe ainda; confirmar comportamento — ou simplesmente jogar fase 1 novamente sem resetar)
  [ ] 3. Decisão de UX: "NOVO" significa reset total OU significa "começar da fase 1"? Confirmar com usuário antes de implementar.
  ```

#### SP-6.5 — i18n
- **Arquivos:** chaves sp_continue, sp_new, sp_continue_label_format etc.

---

### EPIC SP-7 — Frontend: mapa de 15 fases

#### SP-7.1 — Criar `#screen-sp-map`
- **Pré-requisito:** SP-1.3
- **Subagente:** `designer`
- **Arquivos:** `html/index.html`
- **Checklist:**
  ```
  [ ] 1. Inserir <div id="screen-sp-map" class="screen">
  [ ] 2. Grid responsivo de 15 cards (3 colunas em mobile, 5 em desktop)
  [ ] 3. Cada card: número da fase, nome, ícone de estado (✓ / ▶ / 🔒)
  [ ] 4. Botão VOLTAR → showScreen('solo-hub')
  ```

#### SP-7.2 — Estados visuais (CSS inline)
- **Pré-requisito:** SP-7.1
- **Subagente:** `designer`
- **Checklist:**
  ```
  [ ] 1. State "completed": fundo --mc-success-soft, ícone ✓
  [ ] 2. State "current": border --mc-accent, animação pulse
  [ ] 3. State "locked": opacity 0.4, cursor not-allowed
  [ ] 4. classes CSS via inline style ou helper JS toggleClass
  ```

#### SP-7.3 — Click → start fase
- **Pré-requisito:** SP-7.1, SP-3.7
- **Subagente:** `programador`
- **Checklist:**
  ```
  [ ] 1. onclick em card desbloqueado → modal "Iniciar Fase N — Nome"
  [ ] 2. Confirmar → socket.emit('single_player_start', { level: N })
  [ ] 3. Aguardar match_found → entrar em game-area normalmente
  ```

#### SP-7.4 — i18n dos 15 nomes × 9 idiomas
- **Pré-requisito:** SP-1.1
- **Subagente:** `programador`
- **Arquivos:** `html/index.html` (blocos T.*)
- **Checklist:**
  ```
  [ ] 1. Chaves sp_lvl1_name..sp_lvl15_name × 9 idiomas
  [ ] 2. Função getSPLevelName(N) → t('sp_lvl'+N+'_name')
  ```

#### SP-7.5 — Animação fase desbloqueada
- **Pré-requisito:** SP-7.1, SP-7.2, SP-3.8
- **Subagente:** `designer`
- **Checklist:**
  ```
  [ ] 1. Listener socket.on('sp_level_completed', ...) → atualiza window.spProgress
  [ ] 2. Ao reentrar em sp-map, animação CSS de "destravamento" no card N+1
  [ ] 3. Animação de 600ms; usar @keyframes inline ou transition
  ```

---

### EPIC SP-8 — Integração de fluxo

#### SP-8.1 — Adaptar `game-over-screen` para Solo
- **Pré-requisito:** SP-3.8
- **Subagente:** `programador`
- **Checklist:**
  ```
  [ ] 1. No gameOver, se window.spActiveLevel != null → trocar botão "JOGAR NOVAMENTE"
  [ ] 2. Vitória → "PRÓXIMA FASE" (vai para fase N+1) ou "VOLTAR AO MAPA" se foi a 15
  [ ] 3. Derrota → "TENTAR NOVAMENTE" (mesma fase) ou "VOLTAR AO MAPA"
  ```

#### SP-8.2 — Refresh do progresso ao voltar para hub
- **Pré-requisito:** SP-6.2
- **Checklist:** chamar loadSPProgress() ao entrar em solo-hub e sp-map.

#### SP-8.3 — Remover card "Tutorial" antigo
- **Pré-requisito:** SP-4.1, SP-7 completo
- **Checklist:**
  ```
  [ ] 1. Confirmar que SOLO substituiu a função do antigo Tutorial
  [ ] 2. Remover bloco HTML do card Tutorial (ou manter comentado)
  [ ] 3. Verificar que `selectGameMode('train')` não é mais chamável
  ```

#### SP-8.4 — Ativar feature flag
- **Pré-requisito:** TODAS as anteriores
- **Checklist:**
  ```
  [ ] 1. window.SP_ENABLED = true
  [ ] 2. Remover qualquer wrapper que escondia telas SP
  [ ] 3. Smoke test: navegar Menu → Novo Jogo → SOLO → CONTINUAR
  ```

---

### EPIC SP-9 — QA + Docs

#### SP-9.1 — Walk-through autenticado
- **Subagente:** nenhum (manual)
- **Checklist:**
  ```
  [ ] 1. Criar conta nova
  [ ] 2. Solo → NOVO → fase 1 → vencer → confirmar fase 2 desbloqueia
  [ ] 3. Sair, voltar — confirmar progresso persiste
  [ ] 4. Tentar pular fase via console (socket.emit('single_player_start', {level: 5})) → backend rejeita
  ```

#### SP-9.2 — Walk-through guest
- **Checklist:**
  ```
  [ ] 1. Sem login, tentar Novo Jogo → SOLO
  [ ] 2. Confirmar redirect/overlay para auth
  [ ] 3. (Conforme decisão §2: convidados não jogam Solo)
  ```

#### SP-9.3 — Validação de segurança
- **Checklist:**
  ```
  [ ] 1. Tentar POST /sp/level-complete com level=15 sem ter completado 1..14 → rejeita
  [ ] 2. Tentar POST sem token → 401
  [ ] 3. Tentar POST com token de outro user → impossível (uid vem do JWT)
  ```

#### SP-9.4 — Atualizar docs
- **Arquivos:** `docs/PROJECT_CONTEXT.md`, `docs/ACTIVITY_LOG.md`
- **Checklist:**
  ```
  [ ] 1. Tabela de telas em PROJECT_CONTEXT.md: adicionar 4 telas novas
  [ ] 2. Tabela de progresso em PROJECT_CONTEXT.md: marcar SP-* como ✅
  [ ] 3. ACTIVITY_LOG.md: entrada final consolidada do epic SP
  ```

---

## 8. Mapa de dependências (críticas)

```
SP-1.1 ──┐
SP-1.2 ──┼─→ docs (input para SP-3 e SP-7)
SP-1.3 ──┘

SP-2.1 → SP-2.2 → SP-2.3 ──→ SP-6.2, SP-3.8

SP-3.1 ──→ SP-3.2..SP-3.6 (estratégias podem ir em paralelo entre si)
SP-3.1 ──→ SP-3.7 ──→ SP-7.3
SP-3.7 + SP-2.2 ──→ SP-3.8

SP-4, SP-5, SP-6, SP-7 ──→ podem rodar em qualquer ordem entre si (SP_ENABLED=false protege)

TUDO ──→ SP-8.4 (flag ON) ──→ SP-9
```

---

## 9. Como retomar uma sessão SP-X.Y

1. **Trigger "iniciar sessão"** lê `ACTIVITY_LOG.md` e identifica primeira SP-* com status ⏳ Pendente
2. Trigger lê seção SP-X.Y em `SESSAO_POR_SESSAO_PLANNING.md` — que aponta para este documento
3. Executor lê **apenas a seção SP-X.Y deste documento** + arquivos listados em "Arquivos"
4. Ao concluir: registrar entrada em `ACTIVITY_LOG.md` no formato existente, marcar SP-X.Y como ✅, atualizar tabela em `PROJECT_CONTEXT.md`

---

## 10. Tabela de status das subtarefas

> **Esta é a fonte de verdade do progresso do epic SP.** O trigger "iniciar sessão" deve ler esta tabela e pegar a primeira ⏳ Pendente (varrendo na ordem listada).
>
> Ao concluir uma subtarefa: marcar ✅ aqui + adicionar entrada em `ACTIVITY_LOG.md`.

| ID | Subtarefa | Pré-req | Status |
|---|---|---|---|
| SP-1.1 | Terminologia × 9 idiomas → `docs/SP_TERMS.md` | — | ⏳ Pendente |
| SP-1.2 | Spec das 15 estratégias → `docs/SP_STRATEGIES.md` | — | ⏳ Pendente |
| SP-1.3 | Wireframes textuais → `docs/SP_WIREFRAMES.md` | SP-1.1 | ⏳ Pendente |
| SP-2.1 | Migration tabela `singleplayer_progress` | — | ⏳ Pendente |
| SP-2.2 | Módulo `server/singleplayer.js` | SP-2.1 | ⏳ Pendente |
| SP-2.3 | Endpoints `/sp/progress` + `/sp/level-complete` | SP-2.2 | ⏳ Pendente |
| SP-3.1 | Refator `bot.js` + registry `bot-strategies/` | — | ⏳ Pendente |
| SP-3.2 | Estratégias 1, 2, 3 (Recruta/Aprendiz/Defensor) | SP-3.1, SP-1.2 | ⏳ Pendente |
| SP-3.3 | Estratégias 4, 5, 6 (Atirador/Cavaleiro/Bispeiro) | SP-3.1, SP-1.2 | ⏳ Pendente |
| SP-3.4 | Estratégias 7, 8, 9 (Tanque/Caçador/Estrategista) | SP-3.1, SP-1.2 | ⏳ Pendente |
| SP-3.5 | Estratégias 10, 11, 12 (Duelista/Cercador/Iscador) | SP-3.1, SP-1.2 | ⏳ Pendente |
| SP-3.6 | Estratégias 13, 14, 15 (Rainha/Mestre/Lenda) | SP-3.1, SP-1.2 | ⏳ Pendente |
| SP-3.7 | Socket evento `single_player_start` | SP-3.1 | ⏳ Pendente |
| SP-3.8 | Marcar level completed no gameOver | SP-3.7, SP-2.2 | ⏳ Pendente |
| SP-4.1 | Reformatar `#screen-game-mode` (2 cards) | SP-1.3 | ⏳ Pendente |
| SP-4.2 | i18n da nova game-mode | SP-4.1, SP-1.1 | ⏳ Pendente |
| SP-5.1 | Criar `#screen-multiplayer-mode` | SP-1.3 | ⏳ Pendente |
| SP-5.2 | Migrar lógica de matchmaking | SP-5.1 | ⏳ Pendente |
| SP-5.3 | i18n da multiplayer-mode | SP-5.1, SP-1.1 | ⏳ Pendente |
| SP-6.1 | Criar `#screen-solo-hub` | SP-1.3 | ⏳ Pendente |
| SP-6.2 | Lógica fetch de progresso | SP-6.1, SP-2.3 | ⏳ Pendente |
| SP-6.3 | Botão CONTINUAR | SP-6.2, SP-7.1 | ⏳ Pendente |
| SP-6.4 | Botão NOVO + confirmação | SP-6.1 | ⏳ Pendente |
| SP-6.5 | i18n do solo-hub | SP-6.1, SP-1.1 | ⏳ Pendente |
| SP-7.1 | Criar `#screen-sp-map` | SP-1.3 | ⏳ Pendente |
| SP-7.2 | Estados visuais dos cards | SP-7.1 | ⏳ Pendente |
| SP-7.3 | Click em card → start fase | SP-7.1, SP-3.7 | ⏳ Pendente |
| SP-7.4 | i18n dos 15 nomes × 9 idiomas | SP-1.1 | ⏳ Pendente |
| SP-7.5 | Animação de fase desbloqueada | SP-7.1, SP-7.2, SP-3.8 | ⏳ Pendente |
| SP-8.1 | Adaptar `game-over-screen` para Solo | SP-3.8 | ⏳ Pendente |
| SP-8.2 | Refresh do progresso ao voltar | SP-6.2 | ⏳ Pendente |
| SP-8.3 | Remover card "Tutorial" antigo | SP-4.1, SP-7.* | ⏳ Pendente |
| SP-8.4 | Ativar feature flag `SP_ENABLED` | TODOS anteriores | ⏳ Pendente |
| SP-9.1 | Walk-through autenticado | SP-8.4 | ⏳ Pendente |
| SP-9.2 | Walk-through guest | SP-8.4 | ⏳ Pendente |
| SP-9.3 | Validação de segurança | SP-8.4 | ⏳ Pendente |
| SP-9.4 | Atualizar PROJECT_CONTEXT + ACTIVITY_LOG | SP-9.1..3 | ⏳ Pendente |

### Próxima sessão sugerida
**SP-1.1** — Terminologia × 9 idiomas. É a sessão com **menor pré-requisito** e produz output (`docs/SP_TERMS.md`) que destrava SP-4.2, SP-5.3, SP-6.5, SP-7.4.

---

## 11. Como o trigger "iniciar sessão" se comporta nesta epic

1. Trigger lê `PROJECT_CONTEXT.md` e vê linha `SP — Single Player Expansion ⏳ Em andamento — ver docs/SP_PLANNING.md`
2. Trigger lê este arquivo, seção §10 (tabela de status), pega a **primeira linha com ⏳ Pendente** respeitando dependências
3. Trigger lê a seção dessa subtarefa em §7 deste arquivo (objetivo, arquivos, checklist, subagente)
4. Executor segue o checklist; se a subtarefa pede subagente, spawna conforme `pesquisador` / `programador` / `designer`
5. Ao concluir:
   - Marca ✅ na tabela §10 deste arquivo
   - Adiciona entrada em `ACTIVITY_LOG.md`
   - Se foi a última subtarefa do epic, atualiza linha em `PROJECT_CONTEXT.md` para ✅ Completo
