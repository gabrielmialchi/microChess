# Guia de Testes — microChess

> **Para quem é este guia?**
> Para qualquer pessoa que queira rodar o jogo localmente ou testar online — mesmo sem experiência em desenvolvimento. Siga os passos na ordem e tudo vai funcionar.

---

## Índice rápido

| O que você quer fazer | Vai para |
|-----------------------|----------|
| Rodar o jogo no meu computador | [Seção 1 → Seção 2](#1-preparação-única) |
| Testar no celular ou outro PC da mesma rede Wi-Fi | [Seção 3](#3-teste-em-rede-local-celular-ou-outro-pc) |
| Colocar o jogo online (Railway + Netlify) | [Seção 4 → Seção 6](#4-colocar-o-servidor-online-railway) |
| Saber o que testar em cada tela | [Seção 7](#7-o-que-testar-em-cada-parte-do-jogo) |
| O servidor não está abrindo | [Seção 8](#8-algo-não-está-funcionando) |

---

## 1. Preparação única

> Faça isso **uma vez só**. Na próxima vez que quiser testar, pule direto para a [Seção 2](#2-rodando-o-jogo-no-seu-computador).

### Passo 1 — Instalar o Node.js

O servidor do jogo é feito em Node.js. Se você ainda não tem:

1. Acesse **https://nodejs.org**
2. Clique no botão verde **"LTS"** (versão recomendada)
3. Baixe e instale normalmente, como qualquer programa

Para confirmar que funcionou, abra o **Prompt de Comando (CMD)** e digite:
```
node --version
```
Deve aparecer algo como `v20.11.0`. Qualquer número ≥ 18 está ótimo.

---

### Passo 2 — Abrir o CMD na pasta certa

> ⚠️ **Atenção:** Use sempre o **CMD** (Prompt de Comando), não o PowerShell. No PowerShell, o `npm` pode travar por restrições de segurança do Windows.

**Como abrir o CMD direto na pasta do servidor:**

1. Abra o Explorador de Arquivos
2. Navegue até `E:\Projetos\o6\FAST IP\microChess\server`
3. Clique na **barra de endereço** no topo (onde aparece o caminho da pasta)
4. Digite `cmd` e aperte **Enter**

O CMD já abre na pasta certa. Alternativamente, cole isso no CMD:
```
cd "E:\Projetos\o6\FAST IP\microChess\server"
```

---

### Passo 3 — Instalar as dependências

Na pasta `server`, rode:
```
npm install
```

Vai aparecer bastante texto enquanto instala. Aguarde terminar. Você verá `added X packages` no final. Normal.

---

### Passo 4 — Criar o arquivo de configuração `.env`

O servidor precisa de um arquivo chamado `.env` para funcionar. **Sem ele, o servidor não abre.**

**Como criar:**

1. Navegue até a pasta `server`
2. Crie um arquivo de texto chamado `.env` (sem extensão `.txt`)
3. Cole o conteúdo abaixo e salve:

```
JWT_SECRET=minha-chave-secreta-local-123456
HMAC_SECRET=outra-chave-diferente-789012
AES_KEY=12345678901234567890123456789012
NODE_ENV=development
PORT=3000
```

> **Dicas:**
> - Para criar sem extensão `.txt`, no Bloco de Notas vá em **Salvar como** → no campo "Tipo" escolha **Todos os arquivos** → nomeie como `.env`
> - Os valores acima são para uso local apenas — não precisa ser seguro, só precisa existir
> - `AES_KEY` precisa ter **exatamente 32 caracteres** — conte se precisar
> - Nunca envie esse arquivo para o GitHub (já está no `.gitignore`)
> - O arquivo `.env` fica dentro da pasta `server`, no mesmo nível do `server.js`

---

### Passo 5 — Preparar o banco de dados

Ainda na pasta `server`, rode:
```
npm run db:setup
```

Deve aparecer:
```
✅ Tabela 'players' OK
✅ Tabela 'matches' OK
✅ Tabela 'replays' OK
```

Se aparecer isso, está tudo pronto. Se não aparecer, veja a [Seção 8](#8-algo-não-está-funcionando).

---

## 2. Rodando o jogo no seu computador

### Subir o servidor

Abra o CMD na pasta `server` e rode:
```
npm run dev
```

Deve aparecer:
```
microChess server running on port 3000
```

O servidor fica rodando nessa janela. **Não feche o CMD** enquanto estiver testando.

---

### Abrir o jogo nos navegadores

Para ter dois jogadores, você precisa de **dois navegadores diferentes**. Duas abas do mesmo navegador não funcionam.

| Jogador | Navegador | Endereço |
|---------|-----------|----------|
| Jogador 1 | Chrome | `http://localhost:3000` |
| Jogador 2 | Firefox (ou Edge) | `http://localhost:3000` |

> O Claude Code pode estar aberto no terminal ao mesmo tempo — não interfere.

---

### Criar as contas de teste

Em cada navegador:
1. A tela de login abre automaticamente
2. Clique em **"Criar conta"**
3. Preencha apelido, e-mail e senha (mínimo 6 caracteres)
4. Clique em **CRIAR CONTA**

> Emails de teste não precisam ser reais: use `teste1@x.com` e `teste2@x.com`.

Pronto — o jogo já está rodando. Siga o [Protocolo de testes na Seção 7](#7-o-que-testar-em-cada-parte-do-jogo).

---

## 3. Teste em rede local (celular ou outro PC)

Use isso quando quiser testar em dois dispositivos diferentes conectados ao **mesmo Wi-Fi**.

### Descobrir o IP do seu computador

No CMD:
```
ipconfig
```

Procure a linha **"Endereço IPv4"**. Vai ser algo como `192.168.1.42`.

### Acessar nos outros dispositivos

- **No computador com o servidor:** `http://localhost:3000`
- **No celular ou outro PC:** `http://192.168.1.42:3000` (use o IP que você encontrou)

> Se o outro dispositivo não conseguir acessar, o Firewall do Windows pode estar bloqueando.
> Para liberar: **Painel de Controle → Firewall do Windows Defender → Configurações avançadas → Regras de entrada → Nova regra → Porta → TCP → 3000 → Permitir**.

---

## 4. Colocar o servidor online (Railway)

O Railway hospeda o servidor Node.js na internet, de graça (com limite de horas por mês).

### Criar conta no Railway

1. Acesse **https://railway.app**
2. Crie uma conta (pode usar o GitHub)

### Subir o servidor pelo GitHub

1. Garanta que o código está no GitHub
2. No Railway: clique em **New Project → Deploy from GitHub repo**
3. Selecione o repositório do microChess
4. Em **Root Directory** (pasta raiz), coloque: `server`
5. O Railway detecta automaticamente o arquivo `Procfile` e sabe como iniciar

### Configurar as variáveis de ambiente no Railway

No painel do projeto → clique em **Variables** → adicione uma por vez:

| Nome | Valor |
|------|-------|
| `JWT_SECRET` | Uma string aleatória longa — veja como gerar abaixo |
| `HMAC_SECRET` | Outra string aleatória diferente |
| `AES_KEY` | Exatamente 32 caracteres |
| `NODE_ENV` | `production` |
| `ALLOWED_ORIGIN` | A URL do seu Netlify (ex: `https://seu-app.netlify.app`) |

**Como gerar strings seguras** (no CMD da sua máquina):
```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Rode isso 3 vezes para ter 3 valores diferentes.

### Verificar se o servidor está funcionando

Após o deploy, o Railway gera uma URL tipo `microchess-production.up.railway.app`.

Abra no navegador:
```
https://microchess-production.up.railway.app/health
```

Deve aparecer:
```json
{"ok":true,"rooms":0,"queue":0,"db":"ok"}
```

Se aparecer isso, o servidor está no ar.

---

## 5. Colocar o frontend online (Netlify)

O Netlify hospeda as telas do jogo (os arquivos da pasta `html/`).

### Criar conta no Netlify

1. Acesse **https://netlify.com**
2. Crie uma conta (pode usar o GitHub)

### Confirmar que o frontend aponta para o Railway certo

Antes de subir, verifique se a URL do servidor está certa no `index.html`. Procure pela linha que contém `railway.app` e confirme que o endereço bate com o que o Railway gerou para você.

Se precisar corrigir, edite o arquivo `html/index.html` e substitua `microchess-production.up.railway.app` pela sua URL.

### Opção A — Upload manual (mais simples)

1. Acesse **https://app.netlify.com**
2. Na página inicial, arraste a **pasta `html/`** para a área indicada ("drag and drop")
3. O Netlify faz o upload e gera uma URL — ex: `https://microchess-abc123.netlify.app`

### Opção B — Deploy automático pelo GitHub

1. No Netlify: **Add new site → Import an existing project**
2. Conecte ao GitHub → selecione o repositório
3. Preencha:
   - **Base directory**: `html`
   - **Publish directory**: `html`
   - **Build command**: *(deixar vazio)*
4. Clique em **Deploy site**

A partir de agora, cada `git push` atualiza o site automaticamente.

---

## 6. Teste online completo

Com Railway e Netlify no ar:

- **Jogador 1** — qualquer dispositivo, qualquer lugar: `https://seu-app.netlify.app`
- **Jogador 2** — outro dispositivo ou navegador: mesma URL

### Checklist antes de começar

- [ ] Railway responde `{"ok":true}` no `/health`
- [ ] Netlify abre sem erros (aperte **F12 → Console** — não deve ter erros em vermelho)
- [ ] Ao clicar em NOVO JOGO, o ícone de conexão aparece (não deve mostrar "SEM CONEXÃO")

> **Problema de CORS?** Aparece no console como `blocked` ou `CORS error`.
> Solução: no Railway → Variables → confirme que `ALLOWED_ORIGIN` tem a URL exata do Netlify, sem barra no final.

---

## 7. O que testar em cada parte do jogo

Use **dois navegadores diferentes**. Chame de Jogador A (Chrome) e Jogador B (Firefox).

### Login e conta

- [ ] Criar conta com e-mail e apelido — deve entrar logado automaticamente
- [ ] Fazer logout e logar de novo — deve restaurar o nome e rank
- [ ] Tentar criar conta com e-mail já usado — deve mostrar mensagem de erro
- [ ] Tentar logar com senha errada — deve mostrar erro no campo de senha
- [ ] Alterar senha (Perfil → Alterar senha) — deve funcionar e manter a sessão
- [ ] Jogar sem conta — deve entrar como convidado, sem MMR

### Matchmaking (encontrar partida)

- [ ] Ambos clicam NOVO JOGO → devem se encontrar na fila e aparecer na tela de "partida encontrada"
- [ ] Countdown 3…2…1 → jogo inicia
- [ ] Um cancela a fila antes de encontrar o outro → deve voltar ao menu

### Recrutamento (Draft)

- [ ] Comprar peças com os 5 pontos disponíveis (Rainha=5, Torre=4, Cavalo=3, Bispo=2, Peão=1)
- [ ] Tentar gastar mais de 5 pontos → deve bloquear
- [ ] Resetar o inventário → deve devolver os pontos
- [ ] Ambos confirmam → avança para Posicionamento

### Posicionamento

- [ ] Arrastar peças para o próprio território (branco: linhas de baixo, preto: linhas de cima)
- [ ] Tentar colocar peça no território inimigo → deve bloquear
- [ ] Devolver peça ao inventário
- [ ] Ambos confirmam → avança para Revelação/Ação

### Ação (movimentos simultâneos)

- [ ] Selecionar peça e escolher destino
- [ ] Ambos confirmam → movimentos executados ao mesmo tempo
- [ ] Peça que não tem movimento válido fica parada

### Duelo (quando duas peças colidem)

- [ ] Duas peças indo para a mesma casa → tela de duelo aparece
- [ ] Ambos rolam o dado (botão ROLAR)
- [ ] A peça com **dado + bônus** maior vence; a outra é eliminada
- [ ] Em caso de empate: ambas eliminadas (exceto o Rei, que sempre vence empates)
- [ ] Verificar se o bônus da peça está sendo somado corretamente:

| Peça | Bônus |
|------|-------|
| Rei (K) | +5 |
| Rainha (Q) | +4 |
| Torre (R) | +3 |
| Cavalo (N) | +2 |
| Bispo (B) | +1 |
| Peão (P) | +0 |

### Morte Súbita

- [ ] Eliminar todas as peças até restar apenas os dois Reis
- [ ] Banner "MORTE SÚBITA" aparece por alguns segundos
- [ ] Duelo automático Rei vs Rei inicia na sequência
- [ ] Resultado: vitória (se um dado for maior) ou empate (dados iguais)

### Fim de jogo

- [ ] Tela mostra VITÓRIA ou DERROTA para cada jogador
- [ ] PdL (pontos de liga) sobe para quem ganhou e desce para quem perdeu
- [ ] Badge de rank no menu atualiza após voltar
- [ ] Botão JOGAR NOVAMENTE leva de volta ao matchmaking
- [ ] Botão MENU volta ao início

### Desconexão e reconexão

- [ ] Fechar o navegador do Jogador B durante uma partida
- [ ] Jogador A deve ver mensagem "Aguardando reconexão" com contagem regressiva de 60 segundos
- [ ] Reabrir o navegador do B antes de zerar → partida deve continuar do ponto em que estava
- [ ] Deixar o tempo zerar → W.O. automático (Jogador A vence)

### Sala privada

- [ ] Jogador A clica em SALA PRIVADA → CRIAR SALA → recebe código de 4 letras
- [ ] Jogador B clica em SALA PRIVADA → digita o código → ambos entram juntos
- [ ] Testar código errado → deve mostrar mensagem de erro
- [ ] Sala expira após 5 minutos sem alguém entrar

### Ranking e histórico

- [ ] Jogar algumas partidas → verificar que o MMR sobe/desce conforme resultado
- [ ] Abrir Ranking → ver os grupos e divisões explicados
- [ ] Abrir Leaderboard → lista de jogadores com maior MMR
- [ ] Abrir Histórico (Perfil → Histórico de partidas) → ver partidas jogadas
- [ ] Clicar em uma partida → abre o Replay
- [ ] No Replay: navegar pelos turnos com os botões Anterior / Próximo / Auto

### Sistema de ban

- [ ] Desconectar de partidas 3 ou mais vezes em 24 horas → deve aparecer ban de 30 minutos
- [ ] Tentar entrar na fila enquanto banido → tela de ban com contagem regressiva

---

## 8. Algo não está funcionando?

### O servidor fecha com erro de JWT_SECRET

```
[SECURITY] CRÍTICO: JWT_SECRET não definido
```

**Causa:** O arquivo `.env` não existe ou está no lugar errado.

**Solução:** Crie o arquivo `.env` dentro da pasta `server` seguindo o [Passo 4 da Seção 1](#passo-4--criar-o-arquivo-de-configuração-env).

---

### O servidor fecha com outro erro

Abra o CMD na pasta `server` e rode:
```
npm install
node --check server.js
```

Se `node --check` mostrar erros de sintaxe, algo no código foi alterado incorretamente.

---

### O banco de dados deu problema

Se aparecer erro relacionado ao banco ou às tabelas, você pode recriar do zero (**atenção: isso apaga todos os dados de teste**):

1. Apague o arquivo `server/db/microchess.db`
2. Rode `npm run dev` — o banco é recriado automaticamente ao iniciar

---

### npm não abre no PowerShell

Se aparecer a mensagem sobre "execução de scripts desabilitada":

**Solução simples:** Use o **CMD** (Prompt de Comando) em vez do PowerShell.

**Solução definitiva** (no PowerShell, como administrador):
```
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

---

### O jogo abre mas não conecta (modo online)

Sintomas: ícone "SEM CONEXÃO" aparece, ou nenhum jogador encontra o outro.

1. Verifique se o Railway está rodando: abra `https://sua-url.railway.app/health` — deve mostrar `{"ok":true}`
2. Abra **F12 → Console** no navegador — veja se tem erros em vermelho mencionando "CORS" ou "blocked"
3. Se tiver erro de CORS: no Railway → Variables → confirme que `ALLOWED_ORIGIN` tem a URL exata do Netlify

---

### Token inválido depois de atualizar o servidor (Railway)

Se você mudou o `JWT_SECRET` no Railway, todos os logins antigos ficam inválidos. Os usuários precisam fazer logout e logar novamente. Isso é esperado.

---

### Ver os logs completos do servidor

**Local:**
```
cd "E:\Projetos\o6\FAST IP\microChess\server"
npm run dev
```
Todos os logs aparecem na janela do CMD enquanto o servidor está rodando.

**Railway (online):**
No painel do projeto → clique em **Deployments → View logs**
