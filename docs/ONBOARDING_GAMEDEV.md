# Onboarding — Game Dev em HTML/JS com Claude Code + Claude Design

Documento template extraído do projeto microChess (primeiro ciclo completo: dev → polish → manutenção). Aplicável a qualquer jogo web em vanilla HTML/JS com backend Node.js.

Use este documento como base ao iniciar um novo projeto: copie a estrutura, adapte os nomes, mantenha as convenções.

---

## 1. Propósito

Manter um workflow onde:
- O usuário (Gerente do Produto) dá inputs curtos e direcionados em linguagem natural
- Claude Code (Gerente Técnico) orquestra a execução, spawna subagentes quando necessário, e mantém os documentos vivos
- Subagentes (haiku/sonnet) executam tarefas focadas com mínimo overhead de contexto
- Cada sessão produz código funcional + documentação do que foi feito

Resultado esperado: código clean, modular, seguro, testável manualmente; consumo de tokens proporcional ao tamanho da entrega; zero retrabalho por desalinhamento.

---

## 2. Estrutura de Pastas

```
projeto/
├── CLAUDE.md                       # Instruções automáticas de comportamento (carregado em toda conversa)
├── .claude/
│   └── agents/                     # Definições dos subagentes (.md files)
├── docs/
│   ├── PROJECT_CONTEXT.md          # Arquitetura, telas, regras de negócio, stack
│   ├── ACTIVITY_LOG.md             # Histórico cronológico de sessões (Claude lê no início)
│   ├── SESSAO_POR_SESSAO_PLANNING.md  # Planejamento sessão a sessão (P-1, P-2, ...)
│   └── ONBOARDING_GAMEDEV.md       # Este documento
├── html/                           # Frontend (index.html + módulos JS auxiliares)
│   ├── index.html                  # Pivot — não reescrever, só inserir blocos novos
│   ├── auth-frontend.js            # Módulos isolados (auth, mmr, replay, etc)
│   └── ...
└── server/                         # Backend
    ├── server.js                   # Pivot — não reescrever, só inserir blocos novos
    ├── auth.js, mmr.js, replay.js  # Módulos isolados
    └── ...
```

**Regra de ouro:** dois arquivos pivot (frontend e backend) recebem apenas inserções; toda lógica nova vai em arquivos separados que são `require`-d (ou `<script>`-d) a partir do pivot.

---

## 3. Documentos Centrais (Source of Truth)

### 3.1 CLAUDE.md
Instruções automáticas para Claude Code. Carregado em toda conversa via `claudeMd`. Deve conter:
- Trigger "iniciar sessão" e o que fazer (ler PROJECT_CONTEXT, achar próxima sessão pendente em ACTIVITY_LOG, executar, atualizar logs)
- Trigger "status do projeto"
- Lista de subagentes disponíveis (tabela)
- Regras invioláveis (nunca reescrever pivots, retrocompatibilidade, etc)
- Formato de comunicação (▶ plano, 🚫 bloqueio, ⚠️ dependência, 🧪 testes, ✅ conclusão, ⏸ encerramento antecipado)
- Protocolo de encerramento por contexto extenso

### 3.2 PROJECT_CONTEXT.md
Visão geral viva do projeto. Atualizada ao final de cada sessão. Contém:
- Stack (Node, lib X, lib Y, ...)
- Arquitetura em alto nível (diagrama mental textual)
- Lista de telas/screens com IDs
- Regras de negócio do jogo (mecânicas, fórmulas, edge cases)
- Tabela de progresso (sessões ✅ / ⏳ / ⏸)

### 3.3 ACTIVITY_LOG.md
Histórico cronológico. Cada sessão produz uma entrada com:
```
## [DATA] Sessão X — [TEMA]
**Status:** Completo | Em andamento | Interrompido
**Branch:** sessao-X

### Feito
- itens concretos com paths/linhas

### Pendente (se Interrompido)
- [ ] item

### Bugs / Bloqueios Conhecidos
- item

### Notas para próxima sessão
- item
```
Claude **lê este arquivo no início de cada conversa** quando o usuário diz "iniciar sessão".

### 3.4 SESSAO_POR_SESSAO_PLANNING.md
Backlog de sessões com checklist detalhado. Cada sessão tem:
- Objetivo em 1 linha
- Pré-requisitos
- Checklist de itens (granular o suficiente para Claude executar sem ambiguidade)
- Critérios de pronto

---

## 4. Sistema de Subagentes

| Agente | Modelo | Responsabilidade | Quando spawnar |
|--------|--------|------------------|----------------|
| `pesquisador` | haiku | Leitura/busca interna no projeto | Antes de planejar — reúne contexto sem queimar tokens do Gerente |
| `explorador` | haiku | Pesquisa externa (docs, lib, padrões de mercado) | Quando precisa de conhecimento fora do código |
| `programador` | sonnet | Implementação de código | Após contexto reunido, tarefa de execução clara |
| `designer` | sonnet | UI/UX, tokens CSS, componentes visuais | Tarefa de design ou interface |

### Regras dos subagentes
- **Apenas o Gerente spawna subagentes.** Subagentes não spawnam outros.
- **Pesquisador antes de programador.** Reunir contexto via haiku (barato) antes de delegar execução em sonnet (caro).
- **Brief autocontido.** Subagente não vê o histórico — o prompt deve incluir o "porquê", o que foi tentado, paths exatos.
- **Resposta curta.** Sempre pedir relatório com limite de palavras quando for pesquisa.
- **Trust but verify.** Após o subagente reportar mudança, o Gerente deve ler os arquivos modificados antes de declarar concluído.

---

## 5. Triggers do Usuário (comandos)

Comandos curtos em PT que o usuário digita; Claude reconhece e executa fluxo automático.

| Trigger | Ação automática |
|---------|----------------|
| `iniciar sessão` | Lê PROJECT_CONTEXT + ACTIVITY_LOG, identifica próxima sessão ⏳, lê o checklist em SESSAO_POR_SESSAO_PLANNING, executa, atualiza logs |
| `iniciar [CÓDIGO]` (ex: `iniciar BUG-H`) | Mesmo fluxo, mas pula direto para sessão nomeada |
| `status do projeto` | Reporta sessão atual/próxima, arquivos existentes, bugs/bloqueios |
| `forget X` / `lembre X` | Manipula memória persistente (ver seção Memória) |

---

## 6. Regras Invioláveis de Modificação

1. **Nunca reescrever** os arquivos pivot (`server.js`, `index.html`). Apenas inserir blocos novos via `Edit` cirúrgico.
2. **Lógica nova em módulo separado.** Cria-se `feature.js`, requer-se do pivot, mantém-se o pivot magro.
3. **CSS novo inline nos divs criados.** Nunca mexer no `<style>` global existente — evita regressão visual.
4. **Retrocompatibilidade.** Se o jogo funciona sem conta logada hoje, qualquer feature nova deve preservar isso.
5. **Verificar ACTIVITY_LOG antes de implementar.** Confirmar que o item ainda está pendente; alguém (Claude anterior) pode ter feito parcialmente.
6. **Não introduzir backwards-compat hacks** desnecessários. Se algo é certo que está sem uso, deletar de vez.
7. **Não adicionar comentários WHAT.** Só comentários WHY (constraint oculta, invariante sutil, workaround específico).

---

## 7. Comunicação Durante Implementação

Texto outside tool calls é caro e ruidoso. Padrão:

### 7.1 Início de sessão
```
▶ SESSÃO X — [TEMA]
[ ] item 1
[ ] item 2
[x] item já feito (se retomando)
```

### 7.2 Bloqueio
```
🚫 BLOQUEIO: [descrição em uma linha]
   Causa: [causa]
   Ação necessária: [o que o usuário precisa fazer manualmente]
   Continuando com: [próximo item não bloqueado, se houver]
```

### 7.3 Dependência externa
```
⚠️ DEPENDÊNCIA: [descrição]
   Requer: [o que o usuário precisa fazer antes da próxima sessão]
```

### 7.4 Testes (final de sessão ou bloco)
Sempre que houver testes, produzir bloco detalhado:
```
🧪 TESTAR:

PRÉ-REQUISITO: [ex: servidor rodando — `cd server && npm run dev`]

   1. [comando exato]
      → esperado: [resultado em linguagem humana]
      → se falhar: [diagnóstico ou ação]
```

### 7.5 Conclusão
```
✅ SESSÃO X CONCLUÍDA
⚠️ DEPENDÊNCIAS: [lista ou "nenhuma"]
🧪 TESTAR: [bloco detalhado]
```

### 7.6 Encerramento antecipado por contexto extenso
Quando o contexto começa a ficar pesado e ainda há itens pendentes:
1. Garantir que código atual não está quebrado (sem função pela metade, sem `require` órfão)
2. Registrar em ACTIVITY_LOG: feito + pendente + estado do código + como retomar
3. Emitir bloco `⏸ ENCERRAMENTO ANTECIPADO`

---

## 8. Economia de Tokens

| Prática | Por quê |
|---------|---------|
| Não ler arquivos automaticamente no boot | Toda conversa começa frio; só leia quando o trigger pedir |
| `Read` com `offset` + `limit` | Arquivos grandes (>1000 linhas) explodem o contexto |
| `Grep` antes de `Read` | Localizar a região exata; só então abrir o trecho |
| Pesquisador haiku para coleta | Subagente fica com o ruído da busca; gerente recebe síntese |
| Subagente com prompt autocontido + limite de palavras | Sem isso, retorna 5x mais texto que o necessário |
| Não delegar a entendimento ("based on findings, fix") | Push de síntese pro subagente = retrabalho |
| Edit em vez de Write | Diff vai pela rede; rewrite manda o arquivo inteiro |
| `node --check` em vez de subir servidor | Validação sintática sem orphan process + sem stream de logs |
| TodoWrite para tarefas multi-step | Tracking visível pro usuário sem narração no chat |
| Plan mode antes de mudanças grandes | Alinhar antes de produzir; evita refatorar duas vezes |

**Sinais de desperdício:** Read full em arquivos pivot, narração de "estou fazendo X" antes de cada tool call, dump de árvore inteira do projeto, repetir contexto que já está no CLAUDE.md.

---

## 9. Padrões de Código

### 9.1 Design Tokens (CSS)
- Definir variáveis em `:root` e em `[data-theme="light"]`/`[data-theme="dark"]`
- Cores nunca hardcoded em rgba/hex inline — usar `var(--token)` ou `color-mix(in srgb, var(--token) X%, transparent)`
- Tema da UI controlado SOMENTE por `[data-theme]` no `<html>`. Nunca reusar a classe para outras semânticas (ex: perspectiva de jogador) — colisão garantida.

### 9.2 i18n
- Tabela de traduções por idioma como objeto JS
- Função `t(key)` que retorna string do idioma corrente
- Toda string visível ao usuário passa por `t()`. Strings hardcoded são bug.
- Em troca de idioma: chamar `refresh{Screen}()` para a tela atual + `querySelectorAll('.back-label').forEach` para elementos repetidos
- Em troca de tela: chamar `refresh{Screen}()` da tela destino, garantindo que i18n recém-trocada propague

### 9.3 Testes manuais
- **Nunca subir servidor em background** durante validação interna (`node server.js &`) — deixa orphan na porta
- Para validar sintaxe: `node --check server.js`
- Para testar endpoint isolado: script que dá `require` no módulo específico, não no `server.js` inteiro
- Se subir servidor para teste manual, **matar o processo antes de encerrar**

### 9.4 Segurança / robustez
- Rate limit por socket em todos os event handlers que mutam estado
- Graceful shutdown: SIGTERM/SIGINT → emit `server_restart` aos clientes → close HTTP → close DB → exit(0) com fallback de 15s
- `uncaughtException` e `unhandledRejection` handlers — evita crash silencioso
- Cleanup periódico de estruturas em memória (rooms expiradas, sessions órfãs)
- Validar input em todo socket event antes de tocar estado

### 9.5 Estado de jogo
- Servidor é a fonte de verdade; cliente renderiza
- Decisões críticas (resolução de duelos, validação de movimento, MMR) **só no servidor**
- Estado timing-sensitive (AFK timer): servidor envia `deadline` absoluto; cliente computa `remain = deadline - Date.now()` em `setInterval` curto

---

## 10. Mapeamento do Fluxo (template para PROJECT_CONTEXT)

Cada projeto deve ter, em `PROJECT_CONTEXT.md`:

### 10.1 Diagrama de telas
```
splash → menu → game-mode → matchmaking → game-area → game-over
                  ↓
           how-to-play, credits, settings, profile, ranking, replay, ...
```
Lista de IDs (`#screen-X`) com função de cada tela.

### 10.2 Fluxo de dados cliente↔servidor
Tabela de eventos socket:
| Evento | Direção | Payload | Efeito no estado |
|--------|---------|---------|------------------|
| `queue_join` | C→S | `{mode}` | Entra na fila MMR |
| `room_state` | S→C | `state` | Re-renderiza tudo |
| ... | | | |

### 10.3 Regras de negócio por mecânica
Para cada regra do jogo (movimento, captura, duelo, MMR, etc):
- Texto da regra em PT
- Onde está implementado (path:linha)
- Casos a-z cobertos (ex: a-g do microChess)
- Edge cases conhecidos

### 10.4 Tabela de sessões
| Sessão | Tema | Status | Notas |
|--------|------|--------|-------|
| P-1 | Setup base | ✅ | |
| P-2 | Auth | ✅ | |
| BUG-H | Cascata duelo | ✅ | |
| ... | | | |

---

## 11. Prevenção de Retrabalho

### 11.1 Checklist antes de implementar
- [ ] Li ACTIVITY_LOG e confirmei que o item está pendente
- [ ] Li a seção da sessão em SESSAO_POR_SESSAO_PLANNING
- [ ] Identifiquei os arquivos a tocar (sem reescrever pivot)
- [ ] Verifiquei que a feature respeita as regras invioláveis (seção 6)
- [ ] Para mudanças de regra de jogo: confirmei interpretação com o usuário antes de codar

### 11.2 Checklist após implementar
- [ ] `node --check` passou em arquivos JS modificados
- [ ] Atualizei ACTIVITY_LOG com paths/linhas das mudanças
- [ ] Atualizei PROJECT_CONTEXT se a arquitetura mudou
- [ ] Produzi bloco 🧪 TESTAR detalhado para o usuário validar
- [ ] Marquei sessão como ✅ na tabela de progresso

### 11.3 Anti-padrões observados (evitar)
- Reescrever pivot inteiro "pra organizar" — quebra retrocompatibilidade silenciosamente
- Adicionar feature flag pra "preservar comportamento antigo" sem o usuário pedir — código morto
- Mockar DB em testes de integração — quando migration quebra em prod, mock passa
- Hardcoded strings na UI — bug de i18n garantido
- Reusar uma classe CSS pra duas semânticas (UI theme + perspectiva) — colisão garantida
- Testar feature visual com `npm run` em background sem matar — orphan process trava porta
- Spawnar subagente para tarefa de 30s — overhead maior que ganho
- Pesquisador retornar dump completo do arquivo — desperdiça contexto do gerente

---

## 12. Memória Persistente

Claude tem memória própria (`~/.claude/projects/<projeto>/memory/`). Use para:
- Perfil do usuário (não-dev, dev sênior, área de expertise)
- Feedback validado (rules confirmadas após sucesso, não só correções)
- Estado de iniciativas externas (handoffs pendentes, deadlines)
- Pointers para sistemas externos (Linear, Grafana, Slack)

**Não use memória para:** convenções de código (já no CLAUDE.md), git history (use git), estado efêmero da conversa atual.

---

## 13. Contexto de Onboarding por Estado do Projeto

Este onboarding aplica-se em **3 cenários distintos**. A primeira coisa que Claude deve fazer ao entrar num projeto é identificar em qual cenário está — o caminho de execução muda significativamente. Em caso de dúvida, perguntar ao usuário.

### A. Projeto do zero (greenfield)
**Sinais:** repositório vazio ou só com `README` placeholder; nenhum dos 4 docs centrais existe; nenhuma pasta `html/` ou `server/` populada.

**Caminho de execução:**
1. **Antes de codar qualquer coisa**, alinhar com o usuário em conversa curta:
   - Tema/mecânica do jogo (1-2 frases)
   - Stack (default: Node + Socket.io + vanilla HTML/JS; perguntar se diferente)
   - Escopo do MVP (quais features no primeiro release)
   - Telas previstas (lista textual)
2. Criar artefatos na ordem:
   - Copiar este `ONBOARDING_GAMEDEV.md` para `docs/`
   - `CLAUDE.md` na raiz adaptando triggers e regras invioláveis ao escopo
   - `docs/PROJECT_CONTEXT.md` com stack + arquitetura + telas previstas
   - `docs/SESSAO_POR_SESSAO_PLANNING.md` com primeira leva (P-1 setup, P-2 primeira mecânica, ...)
   - `docs/ACTIVITY_LOG.md` vazio (template no topo)
   - `.claude/agents/` com os 4 subagentes
3. Aguardar usuário digitar `iniciar sessão` para começar P-1.

**Anti-padrão:** começar a codar a primeira feature antes dos docs existirem. Sem ACTIVITY_LOG, a próxima conversa começa cega.

### B. Projeto em andamento (workflow ainda não estabelecido)
**Sinais:** já existe código rodando (`server.js`, `index.html`, possivelmente módulos); ausência de um ou mais dos 4 docs centrais OU docs existentes mas desatualizados; convenções de código heterogêneas (mistura de hardcodes e tokens, i18n parcial, etc).

**Caminho de execução:**
1. **Não reescrever** nada do que já funciona — esse é o erro mais caro nesta fase.
2. Audit inicial em uma sessão dedicada (ex: `P-AUDIT-INICIAL`):
   - `pesquisador` mapeia: arquivos existentes, telas, eventos socket, regras de negócio identificáveis no código
   - `pesquisador` lista: hardcodes (cores, strings, valores mágicos), inconsistências de naming, duplicações
3. Construir os docs centrais a partir do estado atual:
   - `PROJECT_CONTEXT.md` retroengenheirado do código
   - `ACTIVITY_LOG.md` com primeira entrada `[DATA] Pré-onboarding — Estado herdado` listando o que existe como "✅ pré-existente"
   - `SESSAO_POR_SESSAO_PLANNING.md` com backlog dividido em: BUG-* (correções), DES-* (compliance de design), SEC-* (hardening), FEAT-* (features novas)
4. Apresentar ao usuário o plano de transição em ordem de prioridade (não fazer tudo de uma vez).
5. Aguardar `iniciar sessão` para a primeira sessão do plano.

**Anti-padrão:** "big bang refactor" pra alinhar tudo de uma vez. Em vez disso: alinhamento gradual, uma área por sessão (tokens primeiro, depois i18n, depois segurança, etc).

### C. Projeto pronto para revisão / manutenção contínua
**Sinais:** MVP entregue ou em open test; os 4 docs existem e estão atualizados; ACTIVITY_LOG mostra histórico de sessões; ritmo de mudanças mudou de "entregar mecânica X" para "polir mecânica X" ou "monetizar".

**Caminho de execução:**
1. Ler ACTIVITY_LOG e PROJECT_CONTEXT para confirmar estado atual.
2. Em vez de novas sessões P-N (planejadas), o backlog vira fluxo reativo:
   - **BUG-*** quando usuário reporta defeito em testes
   - **POLISH-*** para melhorias de UX/visual sem mudança de regra
   - **EXPAND-*** para features comerciais (skins, modos, monetização, social)
   - **OBS-*** para observabilidade (telemetria, logs estruturados, dashboards)
3. Cada bug/sugestão do usuário vira nova entrada no `ACTIVITY_LOG.md` ao ser resolvida — não há mais "sessão planejada N+1", há "próxima dor reportada".
4. Periodicamente (a cada 5-10 sessões), revisar `PROJECT_CONTEXT.md` para garantir que arquitetura documentada bate com o código.

**Anti-padrão:** continuar tratando como greenfield, criando sessões P-N planejadas com escopo amplo. Nesta fase, escopo pequeno e reativo é mais saudável.

### Como Claude identifica o estado ao entrar
Ao abrir uma nova conversa em projeto desconhecido:
1. Listar raiz do projeto + `docs/` (Glob)
2. Conferir presença e tamanho de: `CLAUDE.md`, `docs/PROJECT_CONTEXT.md`, `docs/ACTIVITY_LOG.md`, `docs/SESSAO_POR_SESSAO_PLANNING.md`
3. Aplicar heurística:
   - Nenhum dos 4 + nenhum código → **A (greenfield)**
   - Algum código + 0-2 dos 4 docs → **B (em andamento)**
   - Todos os 4 docs + ACTIVITY_LOG com sessões marcadas como completas → **C (manutenção)**
4. Reportar estado identificado em uma linha e aguardar próxima instrução do usuário.

A partir do cenário identificado, o ciclo passa a ser autossustentável: usuário valida ou dá próximo input, Claude executa conforme o caminho do cenário, logs atualizam.

---

## 14. Quando este onboarding é insuficiente

Se o projeto envolver:
- Multiplayer com sincronização determinística complexa → precisa doc específico de protocolo
- Persistência crítica (compras, ranking público) → precisa doc de schema + migrations
- Integrações externas (pagamento, OAuth) → precisa doc de credenciais + sandboxes
- Mobile/PWA → precisa doc de build/deploy específico

Crie docs auxiliares em `docs/` com prefixos claros (`PROTO_`, `SCHEMA_`, `INT_`, `BUILD_`).
