# Checklist de Teste — Ajustes de "Juice" (ADJ-JUICE A/B/C/D parcial)

> Este guia é para você (Gabriel) testar os efeitos visuais/feedback adicionados nas
> sessões ADJ-JUICE. Precisa de **2 jogadores** (2 abas, 2 navegadores ou 1 PC + 1 celular)
> jogando uma partida ONLINE um contra o outro.

---

## Pré-requisito

- Versão mais recente publicada no Railway (após o push desta sessão).
- Abra o jogo nas duas pontas, faça login (ou como convidado) e entre numa partida ONLINE
  (Casual) até cair os dois no tabuleiro.

---

## ADJ-JUICE-A — Juice de combate

### J5 — Impacto de captura
1. Jogue até uma peça capturar outra (resultado de duelo com vencedor).
   - ✅ Esperado: o tabuleiro inteiro "treme" rapidamente (efeito de impacto) no momento
     em que a captura acontece.
   - ❌ Se falhar: tabuleiro fica parado, sem nenhum sacudido.

### J6 — Rodadas da Morte Súbita
1. Jogue até o jogo entrar em **Morte Súbita** (empate de Reis na fase normal).
2. Observe a troca de rodada (1/3 → 2/3 → 3/3) no texto de status do duelo.
   - ✅ Esperado: a cada nova rodada, o texto do status dá um "salto"/pop visível.
   - ❌ Se falhar: o número da rodada muda mas sem nenhuma animação.

### J1 — Revelação por turno
1. Na fase ACTION, planeje seu movimento e aperte PRONTO.
2. Aguarde o oponente também confirmar.
   - ✅ Esperado: quando os dois lados revelam o turno, as peças do tabuleiro dão um
     pulso de brilho rápido (flash) no momento da revelação.
   - ❌ Se falhar: as peças simplesmente mudam de posição sem nenhum brilho.

### J7 — Beat pós-duelo
1. Provoque um duelo (duas peças se encontram) e role os dados dos dois lados.
   - ✅ Esperado: depois do resultado do duelo aparecer (vencedor/total), a tela segura
     esse resultado por ~0.8s **antes** de fechar o modal e voltar ao tabuleiro — não
     fecha instantaneamente.
   - ❌ Se falhar: o modal fecha assim que o resultado aparece, sem pausa.

---

## ADJ-JUICE-B — Recompensa / fim de jogo

### J3 — Promoção a Rainha
1. Jogue até um Peão alcançar a última fileira do território adversário e virar Rainha.
   - ✅ Esperado: a peça pisca/brilha em dourado no momento da promoção.
   - ❌ Se falhar: o peão vira Rainha sem nenhum efeito visual diferente.

### J8 — Sequência de fim de partida
1. Jogue até o Rei de um dos lados ser eliminado (fim de jogo).
   - ✅ Esperado: o Rei eliminado "cai" com uma animação + tremor do tabuleiro, e a tela
     de fim de jogo demora ~0.85s para aparecer (não é instantâneo).
   - ❌ Se falhar: a tela de "Fim de Jogo" aparece imediatamente, sem nenhuma animação
     do Rei.

---

## ADJ-JUICE-C — Pressão / commit

### J2 — Urgência do timer (banner de inatividade)
1. Durante a fase ACTION (seu turno), **fique parado sem clicar/tocar na tela** por
   cerca de 50 segundos.
   - ✅ Esperado: aparece uma faixa âmbar "Inativo — clique para continuar!" com um
     contador regressivo piscando (10 → 9 → 8...).
2. Continue sem clicar até o contador chegar perto de **5, 4, 3, 2, 1**.
   - ✅ Esperado: nos últimos 5 segundos, a faixa fica **vermelha** e o piscar fica mais
     rápido/intenso.
   - ❌ Se falhar: a faixa continua âmbar e no mesmo ritmo até o fim.
3. Clique/toque em qualquer lugar da tela.
   - ✅ Esperado: a faixa desaparece imediatamente (vermelha ou âmbar) e o contador
     reseta.

> ⚠️ Não deixe passar de 60s sem querer — após isso abre o popup de "INATIVO POR MAIS DE
> 60 SEGUNDOS" (comportamento normal, não é parte deste teste).

### J4 — Trava do PRONTO
1. Em qualquer fase com botão PRONTO (DRAFT, POSITION ou ACTION), clique em **PRONTO**.
   - ✅ Esperado: o botão dá um pequeno "soco"/encolhe e volta (snap), fica esverdeado
     com um brilho ao redor, e o texto muda para "✓ Aguardando Oponente...".
   - ❌ Se falhar: o botão só muda o texto, sem nenhum efeito visual.
2. **Antes** de clicar PRONTO, peça para o outro jogador clicar PRONTO primeiro.
   - ✅ Esperado: o **seu** botão PRONTO (ainda não clicado) começa a pulsar com um halo
     laranja/dourado ao redor — chamando atenção para você confirmar.
   - ❌ Se falhar: nada muda no seu botão quando o oponente confirma.
3. Clique PRONTO no seu lado depois disso.
   - ✅ Esperado: o pulso para e o botão trava no estado "✓ Aguardando..." (verde/glow).

---

## ADJ-JUICE-D (parcial) — Micro-polimento

### J9 — Compra no Draft
1. Na fase DRAFT, compre qualquer peça na loja (clique num botão tipo "♕(5)").
   - ✅ Esperado:
     - O botão da loja encolhe rapidamente ao ser pressionado (efeito de "clique").
     - O número "Meus Pts: X" pisca/aumenta de tamanho e fica vermelho por uma fração
       de segundo antes de voltar ao normal.
   - ❌ Se falhar: o número do orçamento só muda de valor, sem nenhum efeito.

### J10 — Chip de odds "🎯 X%"
1. Provoque um duelo (duas peças se encontram).
2. No seu card de duelo (o seu, não o do oponente), observe o chip "🎯 XX%" abaixo do
   nome da peça.
   - ✅ Esperado: na primeira vez que o duelo abre, o chip aparece com um "pop" (cresce
     e assenta no lugar).
   - ❌ Se falhar: o chip aparece estático, sem nenhuma animação.
3. Se o duelo ficar esperando (ex: você ainda não rolou o dado) e a tela atualizar
   sozinha, o chip **não deve** repetir o pop a cada atualização — só na primeira vez.

> J11 (hand-off plano→resolução) ainda não foi implementado — pendente decisão.

---

## Resumo rápido

```
J5  - tabuleiro treme ao capturar
J6  - status pula a cada rodada da Morte Súbita
J1  - flash nas peças ao revelar o turno
J7  - resultado do duelo segura ~0.8s antes de fechar
J3  - flash dourado na promoção a Rainha
J8  - Rei cai + tremor antes da tela de fim de jogo
J2  - banner de inatividade fica vermelho/pulsa rápido nos últimos 5s
J4  - botão PRONTO trava com snap/glow; pulsa quando oponente confirma primeiro
J9  - orçamento faz tick-down; botão da loja encolhe ao clicar
J10 - chip de odds "🎯 X%" faz pop na abertura do duelo
```
