# Guia do Testador — microChess

> Olá! Obrigado por aceitar testar o microChess.
> Este guia foi pensado pra você jogar, se divertir e nos ajudar a deixar o jogo melhor.
> Não precisa entender nada de programação. É só seguir os passos abaixo.

---

## O que é o microChess?

Um xadrez "de bolso" em tabuleiro **4×4**, com partidas rápidas e algumas reviravoltas:
- Você **monta seu próprio exército** antes da partida (Draft).
- Você **escolhe onde colocar suas peças** (Posicionamento).
- Os movimentos dos dois jogadores acontecem **ao mesmo tempo** (Revelação).
- Quando duas peças se encontram, rola **um duelo de dados** — quem tirar o maior número (somado com o bônus da peça) vence.
- O jogo acaba quando um dos Reis é eliminado.

Cada partida dura cerca de **5 a 10 minutos**.

---

## Como acessar

1. Abra este link no seu navegador (Chrome, Firefox, Edge ou Safari — todos funcionam):

   **https://o6games.itch.io/microchess**

2. A página é privada. Digite a **senha** que enviamos junto com o convite.

3. Quando o jogo carregar na página, clique no botão grande **"Run Game"** (ou "Executar Jogo").

4. O microChess abre direto na página. Não precisa baixar nada, não precisa instalar nada.

> **Dica:** funciona melhor em tela de computador. Em celular dá pra jogar, mas algumas telas ficam mais confortáveis em monitor.

---

## O que pedimos de você

**Tempo de teste sugerido: ~2 horas no total.**
//Pode ser de uma só vez ou dividir em duas sessões de 1 hora — o que for melhor pra você.

Durante esse tempo, queremos que você **experimente o jogo de verdade**: jogue, explore as telas, tente entender, perca, ganhe, reclame, ria. O que importa é o feedback honesto.

No fim do guia tem um **checklist** para você ir marcando o que foi testando, e uma seção de **bugs já conhecidos** — assim você sabe o que NÃO precisa reportar (já estamos cientes).

---

## Roteiro sugerido de 2 horas

Você não precisa seguir essa ordem à risca, mas se quiser uma sugestão:

| Bloco | Tempo | O que fazer |
|-------|-------|-------------|
| 1. Primeiros passos | 10 min | Criar conta, dar uma olhada no menu, ler "Como Jogar" |
| 2. Modo Solo | 30 min | Jogar contra os bots, tentar passar das primeiras 3 ou 4 fases |
| 3. Casual Online | 25 min | Jogar 2 a 3 partidas casuais contra outros testadores |
| 4. Ranqueada | 20 min | Jogar 1 ou 2 partidas valendo rank, observar o XP subir/descer |
| 5. Sala Privada | 15 min | Combinar com outro testador e jogar usando código de sala |
| 6. Perfil / Histórico / Replay | 10 min | Olhar suas estatísticas, abrir um replay de partida sua |
| 7. Idiomas e Configurações | 5 min | Trocar pra outro idioma e voltar |
| 8. Logout e voltar | 5 min | Fechar, abrir de novo, conferir se tudo continua igual |

---

## Checklist do testador

Vai marcando o que conseguiu fazer. Se algo der errado ou estranho, **anote** para nos contar depois.

### Bloco 1 — Primeiros passos

- [ ] A página do itch.io carregou e o jogo abriu ao clicar em **Run Game**
- [ ] A tela de login apareceu
- [ ] Criei uma conta nova (apelido, e-mail e senha)
- [ ] Cliquei em **CRIAR CONTA** e fui direto pro menu principal
- [ ] No menu apareceu meu apelido e meu rank (deve começar como "Sem Rank" ou similar)
- [ ] Cliquei em **COMO JOGAR** e li as regras
- [ ] Cliquei em **CRÉDITOS** só pra ver
- [ ] Voltei pro menu sem problema

### Bloco 2 — Modo Solo (contra bots)

> Aqui você joga sozinho contra a CPU. São **15 fases**, cada uma com um bot de estilo diferente. Não precisa terminar tudo — só queremos saber como é a experiência.

- [ ] Cliquei em **NOVO JOGO → SOLO**
- [ ] Entrei na tela "Hub Solo"
- [ ] Cliquei em **COMEÇAR** e fui pro mapa de fases
- [ ] Cliquei na **Fase 1** e a partida começou
- [ ] Joguei a Fase 1 até o fim (ganhei ou perdi)
- [ ] Depois da vitória, vi a Fase 2 desbloqueando no mapa
- [ ] Joguei pelo menos até a **Fase 3** ou **Fase 4**
- [ ] Senti que os bots foram ficando mais difíceis
- [ ] Em alguma fase, usei o botão **TENTAR DE NOVO** após perder
- [ ] Usei o botão **VOLTAR AO MAPA** depois de uma partida

> **Observação:** se você jogar Solo **sem criar conta** (como visitante), o progresso não fica salvo. É de propósito — é só pra incentivar criar conta.

### Bloco 3 — Casual Online (contra outros jogadores)

> Aqui você joga contra outro testador que também esteja online. Não afeta o ranking.

- [ ] Cliquei em **NOVO JOGO → ONLINE → CASUAL**
- [ ] Esperei na fila e fui pareado com outro jogador
- [ ] Vi a tela "Partida Encontrada" com o nome do oponente
- [ ] A contagem 3…2…1 apareceu e o jogo começou
- [ ] Fase de **Draft**: comprei minhas peças com os 5 pontos
- [ ] Fase de **Posicionamento**: arrastei as peças pro meu lado do tabuleiro
- [ ] Fase de **Ação**: escolhi pra onde mover e cliquei em **PRONTO**
- [ ] Quando duas peças bateram, o **duelo de dados** apareceu
- [ ] Cliquei em **ROLAR** e vi o resultado
- [ ] Joguei pelo menos **2 partidas casuais até o fim**
- [ ] Quando uma partida acabou, vi a tela de **VITÓRIA** ou **DERROTA**
- [ ] Cliquei em **JOGAR NOVAMENTE** e fui pra outra fila

### Bloco 4 — Ranqueada

> Aqui sua pontuação de **XP** (Pontos de Liga) sobe se você vence e desce se perde. É o modo "sério".

- [ ] Cliquei em **NOVO JOGO → ONLINE → RANQUEADA**
- [ ] Joguei uma partida ranqueada até o fim
- [ ] Vi quanto **XP** ganhei (ou perdi) na tela de fim de jogo
- [ ] Voltei pro menu e meu rank no canto mostrou o novo XP
- [ ] Joguei uma segunda partida ranqueada
- [ ] Se eu sentir que algum oponente é forte/fraco demais pro meu nível, anotei pra reportar

### Bloco 5 — Sala Privada

> Aqui dá pra jogar **contra um amigo específico**. Combine com outro testador antes.

- [ ] Cliquei em **NOVO JOGO → ONLINE → SALA PRIVADA**
- [ ] Cliquei em **CRIAR SALA** e recebi um código de 4 letras
- [ ] Mandei o código pro outro testador (WhatsApp, mensagem, voz, qualquer canal)
- [ ] O outro testador clicou em **ENTRAR EM SALA**, digitou o código e entramos juntos
- [ ] Jogamos a partida até o fim
- [ ] Também testei o caminho contrário (eu entrei na sala de outro testador)
- [ ] Tentei digitar um código errado pra ver o que acontece

### Bloco 6 — Perfil, Histórico e Replay

- [ ] Abri o **Perfil** (a partir do menu)
- [ ] Vi minhas estatísticas: vitórias, derrotas, WO (desistências)
- [ ] Cliquei em **Histórico de Partidas** e vi as partidas que joguei
- [ ] Cliquei numa partida do histórico → abriu o **Replay**
- [ ] No replay, usei os botões **Anterior / Próximo** para navegar pelos turnos
- [ ] Testei o botão **Auto** (passa sozinho)
- [ ] Tentei trocar meu apelido / avatar (se for o caso)

### Bloco 7 — Ranking e Leaderboard

- [ ] Abri a tela **RANKING** no menu
- [ ] Li a explicação dos ranks (Madeira → Diamante etc.)
- [ ] Cliquei em **LEADERBOARD** ou similar e vi a lista dos jogadores no topo
- [ ] Encontrei meu apelido na lista (se eu já tiver jogado partidas ranqueadas)

### Bloco 8 — Configurações e Idiomas

- [ ] Abri **CONFIGURAÇÕES**
- [ ] Troquei o idioma para outro (ex: inglês, espanhol, japonês)
- [ ] Olhei as telas no novo idioma — está tudo traduzido?
- [ ] Voltei para português (ou pro idioma que prefere)
- [ ] Troquei o tema (claro / escuro), se disponível
- [ ] Testei o botão **ALTERAR SENHA** no Perfil (não precisa trocar de verdade, só ver se funciona)

### Bloco 9 — Logout e voltar

- [ ] Cliquei em **SAIR** (botão de logout)
- [ ] Confirmei que queria sair
- [ ] A tela de login apareceu de novo
- [ ] Fiz login com a mesma conta
- [ ] Tudo voltou no lugar: meu rank, histórico, estatísticas

### Bloco extra — coisas pra tentar "quebrar" 😈

Se sobrar tempo e curiosidade, experimente:

- [ ] Fechar a aba **durante uma partida** e ver o que acontece
- [ ] Reabrir o jogo logo em seguida — consegui voltar pra partida em andamento?
- [ ] Clicar muito rápido em botões pra ver se trava algo
- [ ] Tentar criar uma segunda conta com o **mesmo e-mail** — bloqueia direito?
- [ ] Tentar fazer login com **senha errada** — mensagem clara?
- [ ] Em uma partida ranqueada, ficar sem fazer nada na sua vez — o que aparece?

---

## Como reportar problemas

Quando achar algo estranho, anote:

1. **O que estava fazendo?** (ex: "estava na Fase 3 do Solo, ia mover meu Cavalo")
2. **O que aconteceu?** (ex: "a peça sumiu do tabuleiro")
3. **O que você esperava?** (ex: "esperava que ela andasse pro lado")
4. **Captura de tela**, se possível — qualquer print já ajuda muito

Mande tudo pelo canal que combinamos com você (WhatsApp / e-mail / Discord — o que tiver sido acordado).

---

## Bugs já conhecidos (não precisa reportar)

Antes de reportar, dá uma olhada se o que você viu já está na lista abaixo. **Essas coisas a gente já sabe** — então pode pular elas e focar em achar o que ainda não conhecemos.

### Mensagens estranhas no Console do navegador

Se você apertar **F12** e abrir o **Console**, vai ver algumas mensagens em vermelho ou amarelo. **Nenhuma delas é problema do microChess** — vêm do próprio sistema do itch.io que hospeda o jogo:
- `Unrecognized feature: 'monetization'` ou `'xr'`
- `Allow attribute will take precedence over 'allowfullscreen'`
- `bad HTTP response code (403)` em `lib.min.js`
- `preload Cinzel font não usado`

Não impacta o jogo. Pode ignorar.

### Comportamentos por design (não são bugs)

- **Jogando Solo sem criar conta**, o progresso não fica salvo. Se sair do mapa pro menu, volta pra Fase 1. Isso é de propósito — incentiva criar conta. Dentro de uma sequência "PRÓXIMA FASE" / "TENTAR DE NOVO" o progresso é mantido na memória.
- **Empate só acontece na Morte Súbita** (quando sobram só os dois Reis). Antes disso, é sempre vitória ou derrota.
- **Em ranqueada, o jogador com rank mais baixo ganha XP a mais** ao vencer um adversário mais forte — e perde menos ao perder. É o sistema ELO funcionando.
- **Convidados (sem conta) jogam online, mas não acumulam ranking**. O rank só vale com conta criada.
- **Texto "aguardando…" do oponente** no painel lateral pode ficar fixo em algumas telas — é só decoração, não afeta nada.

### Limitações conhecidas

- **Em celular**, algumas telas (especialmente o tabuleiro durante a fase de Ação) ficam apertadas. Funciona, mas a experiência é melhor em tela maior.
- **Trocar de idioma com uma partida em andamento** pode deixar alguns textos só no idioma anterior até o próximo refresh de tela. Voltando pro menu, tudo sincroniza.
- **Reconexão após cair**: você tem **60 segundos** pra voltar pra partida. Depois disso, conta como WO (Walk Over) e o oponente ganha automaticamente.
- **Sistema de Ban anti-WO**: se você desistir de 3 partidas em 24 horas, leva um ban de 30 minutos. Não é bug, é por design — pra desencorajar quem desiste no meio.

---

## O que estamos medindo automaticamente

Pra você ter ideia do que olhamos sem precisar perguntar: o servidor registra automaticamente algumas coisas que ajudam a cruzar com o seu feedback. Você **não precisa fazer nada** sobre isso — é só pra você saber.

| O que medimos | Pra quê |
|---------------|---------|
| Quando você entra e sai do jogo | Ver quanto tempo cada testador ficou jogando |
| Quantas partidas você começou | Ver se o matchmaking está funcionando |
| Quantas partidas você terminou | Ver onde as pessoas desistem (Draft? Meio? Fim?) |
| Quantos turnos cada partida durou | Calibrar a duração média |
| Tempo na fila até encontrar partida | Saber se a fila demora demais |
| Desconexões durante partida | Cruzar com relatos de "caiu sozinho" |
| Tentativas de reconexão | Ver se o sistema dos 60 segundos funciona na prática |
| Quantos jogadores estavam online ao mesmo tempo | Avaliar pico de carga do servidor |

**Importante:** essas medições são **anônimas no agregado** — não pegamos nada que você digite, nem o conteúdo das suas partidas. É só "quantos", "quando" e "por quanto tempo".

Por isso o **seu feedback escrito é insubstituível**: nós sabemos que 30% desistiram no Draft, mas só você pode nos contar **se foi porque a tela é confusa ou porque ficou chato**.

---

## Obrigado! 🙏

Sério: testadores valem ouro. Cada bug que você achar agora é um bug que outras pessoas não vão sofrer depois. Cada feedback honesto ajuda a gente a tomar decisões melhores.

Se tiver dúvida durante o teste, **manda mensagem**. A gente prefere responder uma pergunta sua do que receber um relatório com "não entendi".

Boa partida!
