# Checklist do Operador — Teste de Carga microChess

> Este guia é para você (Gabriel) acompanhar o servidor durante o teste.
> Não precisa entender de programação — é só seguir os passos na ordem.

---

## 0. Configurar as Variáveis no Railway (fazer uma vez, antes do teste)

No Railway: abra o projeto → clique no serviço do servidor → aba **Variables** → adicione:

| Variável | Valor de exemplo | Para quê serve |
|---|---|---|
| `ADMIN_TOKEN` | `teste-amanha-2026` (escolha sua própria senha) | libera acesso às páginas de estatísticas e exportação |
| `TEST_WINDOW_START` | `2026-06-11T20:00:00-03:00` | horário de início do teste (20h, horário de Brasília) |
| `TEST_WINDOW_END` | `2026-06-11T22:00:00-03:00` | horário de fim do teste (22h, horário de Brasília) |

> Depois de salvar, o Railway faz **redeploy automático** (~1-2 min). Isso é esperado e deve
> acontecer **antes** do início do teste, nunca depois.

**O que essas variáveis fazem:**
- `ADMIN_TOKEN`: é a "senha" que você cola no final dos links das seções 2 e 4 abaixo.
- `TEST_WINDOW_START`/`END`: fora desse intervalo, jogadores que tentarem entrar numa partida
  recebem um aviso de "fora do horário de testes". Login, menu e modo solo continuam
  funcionando normalmente fora da janela.
- Se **não quiser** limitar horário, simplesmente não preencha essas duas — o servidor fica
  sempre liberado.

---

## 1. Antes do teste começar

1. No Railway, confira se o serviço está **"Active"** (bolinha verde).
   - Se não estiver: aba "Deployments" → 3 pontinhos no último deployment → **Redeploy**

2. Abra a aba **Metrics** do serviço e deixe aberta durante todo o teste.
   - Mostra gráficos de CPU, Memória e Rede em tempo real.

3. Abra a aba **Logs** do serviço em outra aba e deixe aberta também.
   - Erros aparecem em vermelho aqui.

4. No navegador, acesse:
   ```
   https://seu-app.up.railway.app/health
   ```
   - ✅ Esperado: `{"ok":true,"rooms":0,"queue":0,"db":"ok"}`
   - ❌ Se der erro ou não carregar: o servidor não está no ar — volte ao passo 1.

---

## 2. Durante o teste — acompanhar usuários simultâneos

1. Acesse (troque `SUASENHA` pelo valor que você colocou em `ADMIN_TOKEN`):
   ```
   https://seu-app.up.railway.app/api/admin/stats?key=SUASENHA
   ```

2. Aperte **F5** de tempos em tempos para atualizar os números:

   | Campo | O que significa |
   |---|---|
   | `connectedSockets` | total de pessoas conectadas agora |
   | `inQueue` | pessoas esperando para entrar numa partida |
   | `activeRooms` | número de partidas em andamento |
   | `playersInMatches` | pessoas jogando agora |

   - ✅ Esperado: os números sobem quando as pessoas entram e descem quando saem.
   - ⚠️ Se `connectedSockets` for alto mas `activeRooms` ficar zerado: pode haver
     problema no matchmaking (pessoas não estão sendo pareadas).

3. Olhe também a aba **Metrics** do Railway:
   - ⚠️ CPU acima de ~80-90% por muito tempo, ou Memória subindo sem parar = sinal de
     sobrecarga. Se acontecer, vá para a seção 3.

---

## 3. Se algo der errado durante o teste

### 3a. Servidor travou / precisa reiniciar (SEM perder os dados coletados)

1. No Railway: aba "Deployments" → no deployment ativo → 3 pontinhos (⋮) → **Restart**
   - ✅ Isso reinicia o servidor **sem apagar o banco de dados** — os dados continuam lá.
   - ⏳ Leva alguns segundos; jogadores conectados serão desconectados e precisam recarregar a página.

### 3b. Precisa parar o teste completamente

1. Aba "Deployments" → 3 pontinhos no deployment ativo → **Remove**
   - O site sai do ar para todo mundo.
   - ⚠️ **Antes de fazer isso, exporte os dados (seção 4)** — "Remove" + religar depois
     também apaga o banco (sem volume configurado).

---

## 4. ⚠️ Regra de ouro durante o teste

**A partir do momento em que o teste começar, NÃO faça:**
- ❌ Push de código para a branch `main`
- ❌ "Redeploy" manual
- ❌ "Remove" seguido de religar

Qualquer uma dessas ações **apaga o banco de dados** (partidas, jogadores, eventos coletados),
porque o servidor ainda não tem um "Volume" persistente configurado (isso ficou anotado em
`docs/ACTIVITY_LOG.md` para resolvermos depois).

✅ Se precisar reiniciar o servidor por qualquer motivo durante o teste, use **Restart**
(seção 3a) — esse é seguro e não apaga nada.

---

## 5. Depois do teste — extrair os dados coletados

1. Acesse:
   ```
   https://seu-app.up.railway.app/api/admin/export?key=SUASENHA
   ```

2. O navegador deve baixar um arquivo `.json` automaticamente (ex:
   `microchess-export-1234567890.json`).
   - Se em vez de baixar ele só mostrar texto na tela: clique com o botão direito →
     "Salvar como..." → salvar como `.json`.

3. O arquivo contém:
   - **`players`**: jogadores e estatísticas (MMR, vitórias, derrotas, etc.)
   - **`matches`**: todas as partidas jogadas (resultado, duração, mudança de MMR)
   - **`events`**: log de eventos (entrada na fila, início/fim de partida, etc.)
   - **`ccu_snapshots`**: histórico de quantas pessoas estavam conectadas, registrado
     automaticamente a cada 5 minutos
   - **`singleplayer_progress`**: progresso no modo solo

4. Guarde esse arquivo em local seguro. Depois, me envie e eu ajudo a transformar em
   planilha/gráfico.

---

## Resumo rápido (cole isso num bloco de notas para consulta rápida)

```
ANTES:    checar /health, abrir Metrics + Logs do Railway
DURANTE:  /api/admin/stats?key=SUASENHA  (F5 para atualizar)
PROBLEMA: Restart (NÃO Remove, NÃO Redeploy) — preserva os dados
DEPOIS:   /api/admin/export?key=SUASENHA  (baixa o arquivo .json)

REGRA DE OURO: nada de redeploy/push durante o teste — apaga o banco.
```
