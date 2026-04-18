# microChess — Instruções Automáticas para Claude Code

## Ao abrir qualquer conversa neste projeto

Não leia nenhum arquivo automaticamente. Aguarde o comando do usuário.

## Quando o usuário disser "iniciar sessão"

Execute automaticamente estes passos, sem pedir confirmação adicional:

1. Leia `docs/PROJECT_CONTEXT.md` — arquitetura, telas, regras de negócio, stack
2. Leia `docs/ACTIVITY_LOG.md` e identifique a primeira sessão com status ⏳ Pendente
3. Leia a seção dessa sessão em `docs/SESSAO_POR_SESSAO_PLANNING.md`
4. Execute TUDO que a sessão pede, seguindo o checklist na ordem exata
5. Ao concluir, preencha o template correspondente em `docs/ACTIVITY_LOG.md`
6. Atualize a tabela de progresso em `docs/PROJECT_CONTEXT.md` (marcar sessão como ✅)

## Regras sobre testes automatizados durante implementação

- **NUNCA subir o servidor em background** durante testes internos (`node server.js &`) — isso deixa processos órfãos na porta 3000
- Para validar sintaxe, usar `node --check server.js` (não executa, só valida)
- Para testar endpoints sem subir servidor persistente, usar scripts isolados que fazem `require` do módulo específico (não do server.js inteiro)
- Se for necessário subir o servidor para testar, **sempre matar o processo** antes de encerrar o teste

## Regras que nunca devem ser violadas

- **NUNCA reescrever** `server/server.js` ou `html/index.html` — apenas inserir blocos novos
- **Toda lógica nova** vai em arquivos separados (auth.js, mmr.js, replay.js, auth-frontend.js, etc.)
- **CSS novo** sempre inline nos divs criados — nunca alterar o `<style>` existente
- **Retrocompatibilidade**: o jogo deve funcionar sem conta criada
- **Verificar** `docs/ACTIVITY_LOG.md` para saber o que JÁ foi feito antes de implementar

## Quando o usuário disser "status do projeto"

Leia `docs/ACTIVITY_LOG.md` e `docs/PROJECT_CONTEXT.md` e responda:
- Qual sessão está em andamento ou é a próxima
- Quais arquivos já existem
- Quais bugs ou bloqueios estão registrados

---

## Comunicação durante a implementação

**Não explicar o que está sendo feito.** Código fala por si mesmo.

Só produzir texto nas seguintes situações:

### 1. Ao iniciar a sessão — plano em uma linha por item
```
▶ SESSÃO X — [TEMA]
[x] item já feito (se retomando sessão interrompida)
[ ] item a fazer
[ ] item a fazer
```

### 2. Bloqueio — quando algo impede continuar
```
🚫 BLOQUEIO: [descrição em uma linha]
   Causa: [causa]
   Ação necessária: [o que o usuário precisa fazer manualmente]
   Continuando com: [próximo item não bloqueado, se houver]
```

### 3. Dependência — algo que Claude não pode resolver sozinho
```
⚠️ DEPENDÊNCIA: [descrição]
   Requer: [o que o usuário precisa fazer antes da próxima sessão]
```

### 4. Testes necessários — ao final da sessão ou de um bloco

Sempre que houver testes a realizar, produzir um bloco ToDo detalhado para que o usuário possa executar o protocolo completo sem ambiguidade. Incluir:
- Pré-requisito: o que deve estar rodando antes de testar
- Comando exato para cada plataforma (Windows CMD / PowerShell quando relevante)
- Resultado esperado em linguagem humana (não só código HTTP)
- O que fazer se o resultado for diferente do esperado

```
🧪 TESTAR:

PRÉ-REQUISITO: [ex: servidor rodando — `cd server && npm run dev`]

   1. [comando exato]
      → esperado: [resultado em linguagem humana]
      → se falhar: [diagnóstico ou ação]

   2. [comando exato]
      → esperado: [resultado em linguagem humana]
      → se falhar: [diagnóstico ou ação]
```

### 5. Conclusão da sessão
```
✅ SESSÃO X CONCLUÍDA
⚠️ DEPENDÊNCIAS: [lista ou "nenhuma"]
🧪 TESTAR: [bloco detalhado conforme regra 4 acima]
```

---

## Protocolo de encerramento antecipado (contexto longo)

Quando perceber que o contexto da conversa está ficando muito extenso e ainda há itens do checklist por fazer, encerrar proativamente seguindo estes passos:

1. **Garantir que o código atual não quebra nada:**
   - Qualquer arquivo aberto deve estar sintaticamente completo
   - Nenhuma função pela metade, nenhum `require` sem o arquivo existir
   - Se um arquivo foi parcialmente editado, reverter para o estado anterior ou completar o mínimo funcional

2. **Registrar no `docs/ACTIVITY_LOG.md`:**
```
## [DATA] Sessão X — [TEMA] — ENCERRAMENTO ANTECIPADO
**Status:** Interrompido — contexto extenso
**Branch:** sessao-X

### Feito
- [listar o que foi concluído]

### Pendente (retomar aqui na próxima sessão)
- [ ] [próximo item do checklist]
- [ ] [e os seguintes]

### Estado do código ao encerrar
- Último arquivo criado/editado: [arquivo]
- Código está funcional: Sim / Parcialmente (descrever)

### Como retomar
Cole "iniciar sessão" para continuar — o log acima será detectado automaticamente.
```

3. **Emitir ao usuário:**
```
⏸ ENCERRAMENTO ANTECIPADO — contexto extenso
   Feito: [N de M itens do checklist]
   Pendente: [itens restantes]
   Código está: [funcional / revertido para estado seguro]
   → Log atualizado em docs/ACTIVITY_LOG.md
   → Cole "iniciar sessão" para continuar na próxima janela
```
