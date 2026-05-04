# SP_STRATEGIES — Spec Funcional das 15 Estratégias do Bot

> Output da sessão **SP-1.2**. Fonte de verdade para a implementação em SP-3.2..SP-3.6.
>
> Cada estratégia é descrita em **pseudocódigo declarativo** — não código real. O `programador` nas sessões SP-3.* converte para JS isolado em `server/bot-strategies/NN-nome.js`.

---

## 1. Recap das regras do jogo (lembrete para implementadores)

- Tabuleiro **4×4** (x ∈ 0..3, y ∈ 0..3).
- White: linhas 0-1; Black: linhas 2-3.
- **DRAFT:** 5 pontos. Custos: **Q=5, R=4, N=3, B=2, P=1**. King é **grátis e obrigatório**.
- **POSITION:** posicionar cada peça do inventário em casa vazia da própria metade.
- **ACTION:** planejamento simultâneo; um movimento por turno.
- **DUEL:** se duas peças tentam ocupar a mesma casa OU uma captura outra, ambos rolam d6 + bônus da peça (Q+5, R+4, N+3, B+2, P+1, K+0). Maior total vence; empate → repete.
- **GAMEOVER:** King eliminado.

### Movimentos válidos (referência: `server/movegen.js → isValidMove`)
- **King:** 1 casa em qualquer direção
- **Queen:** linha/coluna/diagonal qualquer distância (sem pular)
- **Rook:** linha/coluna qualquer distância
- **Bishop:** diagonal qualquer distância
- **Knight:** L (2+1)
- **Pawn:** 1 casa para frente (sem captura diagonal — adaptado ao 4×4)

### Interface obrigatória que cada estratégia exporta
```js
module.exports = {
  id: <int>,                       // 1..15
  name: '<slug>',                  // 'recruta', 'aprendiz', ...
  chooseDraft(state, color)    => { action: 'draft_buy'|'draft_ready', payload: '<piece_type>'|undefined },
  choosePosition(state, color) => { action: 'position_place'|'position_ready', payload: {pieceId, x, y}|undefined },
  chooseAction(state, color)   => { action: 'action_plan'|'action_ready', payload: {pieceId, tx, ty}|undefined }
};
```

Para duelos (roll_dice / duel_resolve) **todas** as estratégias usam a mesma lógica genérica do `bot.js` atual — não precisa repetir aqui.

### Helpers comuns (esperados em `bot-strategies/_helpers.js`)
- `randomChoice(arr)` — pega item aleatório
- `weightedChoice(arr, weights)` — escolha com pesos
- `legalMoves(piece, state)` — todos os destinos válidos de uma peça
- `manhattanDist(a, b)` — `|a.x-b.x| + |a.y-b.y|`
- `findPiece(state, color, type)` — primeira peça do tipo
- `pieceBonus(type)` — Q:5, R:4, N:3, B:2, P:1, K:0
- `isPieceUnderThreat(piece, state)` — true se alguma peça inimiga consegue alcançar a casa em 1 movimento

---

## 2. Princípio de distinguibilidade

Cada estratégia tem **pelo menos 1 traço único**:

| # | Traço único |
|---|---|
| 1 | Aleatoriedade total |
| 2 | Só peões; nunca captura |
| 3 | Nunca cruza meio do tabuleiro |
| 4 | 5 peões, ataque frontal em linha |
| 5 | Cavalo agressivo + suporte de peões |
| 6 | 2 bispos, jogo diagonal |
| 7 | Torre + peões, marcha frontal lenta |
| 8 | Heurística Manhattan (= bot atual) |
| 9 | Recua peças ameaçadas |
| 10 | Prioriza confronto com peças de bônus alto |
| 11 | Move só pelos flancos (x=0 e x=3) |
| 12 | Usa peão como isca para abrir caminho |
| 13 | Rainha sozinha + King; agressividade total |
| 14 | Lookahead 2-ply (avalia melhor das próprias jogadas + pior resposta) |
| 15 | Lookahead 2-ply + 20% aleatoriedade |

---

## 3. Especificação por estratégia

### Estratégia 1 — Recruta (★)
> "Joga sem pensar."

**DRAFT**
```
enquanto budget > 0:
  options = peças que cabem no budget restante (Q se>=5, R se>=4, N se>=3, B se>=2, P se>=1)
  buy(randomChoice(options))
ready
```

**POSITION**
```
para cada peça em inventory:
  slot = randomChoice(slots vazios da própria metade)
  place(peça, slot)
ready
```

**ACTION**
```
moves = todos os legalMoves de todas as próprias peças
se moves vazia → action_ready (passa)
escolhe = randomChoice(moves)
plan(escolha)
ready
```

**Parâmetros:** taxa de erro = 100% (não há "erro" porque tudo é aleatório).

---

### Estratégia 2 — Aprendiz (★)
> "Só sabe usar peões; nunca ataca."

**DRAFT**
```
enquanto budget >= 1:
  buy('P')
ready
```
Resultado: 5 peões + King.

**POSITION**
```
peões nas 4 casas da fileira 1 (white) ou 2 (black).
King na fileira 0 (white) ou 3 (black), x=1 ou 2 (centro).
5º peão (se houver) na fileira 0 ou 3, em x livre.
Para black: usar fileira 3 e 2.
ready
```

**ACTION**
```
para cada peão (em ordem aleatória):
  alvo = (peao.x, peao.y + (color=='white' ? 1 : -1))
  se alvo está vazio E é casa válida:
    plan(peão, alvo)
    break  ← move só 1 peça por turno
se nenhum peão pode avançar → action_ready (passa)
```
**Nunca** tenta capturar (mesmo que uma peça inimiga esteja na frente — apenas trava).

**Parâmetros:** comportamento determinístico.

---

### Estratégia 3 — Defensor (★)
> "Cerca o Rei e nunca cruza o meio."

**DRAFT**
```
buy('B')   // 2
buy('B')   // 4
buy('P')   // 5
ready
```
Resultado: 2 Bispos + 1 Peão + King.

**POSITION**
```
King centralizado: white→(1,0) ou (2,0); black→(1,3) ou (2,3)
2 Bispos flanqueando: posições (0, fileira_back) e (3, fileira_back)
Peão à frente do King: (King.x, fileira_front)
ready
```

**ACTION**
```
fronteira = 1.5 (linha imaginária)  
para cada peça candidata:
  destinos = legalMoves(peça) FILTRADOS para nunca cruzar a fronteira:
    white: ty <= 1
    black: ty >= 2
escolhe destino com menor manhattanDist(destino, MeuKing)  ← se afasta do King, descarta
se nenhum movimento defensivo viável → action_ready
```

**Parâmetros:** Defensor literalmente nunca ataca. Vence só por sobrevivência (oponente erra e perde peças até o jogador esmagar).

---

### Estratégia 4 — Atirador (★★)
> "Marcha de peões em linha, frontal."

**DRAFT**
```
buy('P') × 5
ready
```

**POSITION**
```
4 peões na fileira frontal (y=1 white / y=2 black) — todas as colunas
King na fileira de trás, x=0 ou 3 (canto)
5º peão na fileira de trás, x=1 ou 2
ready
```

**ACTION**
```
para cada peão na ordem (esquerda→direita, mais avançado primeiro):
  destino = (peão.x, peão.y + dir)
  se destino é válido (vazio ou contém peça inimiga):
    plan(peão, destino) → break
se nenhum peão avança:
  tenta mover peão da fileira de trás
  se nada → action_ready
```
**Diferença do Aprendiz:** o Atirador **aceita** mover para casa com peça inimiga (entra em duel).

**Parâmetros:** determinístico; sem recuo.

---

### Estratégia 5 — Cavaleiro (★★)
> "Cavalo agressivo, peões dão suporte."

**DRAFT**
```
buy('N')   // 3
buy('P')   // 4
buy('P')   // 5
ready
```
Resultado: King + N + 2P.

**POSITION**
```
N: na fileira frontal, x=1 ou 2 (centro)
King: fileira de trás, x oposto à coluna do N
2 peões: fileira frontal nas colunas adjacentes ao N
ready
```

**ACTION**
```
prioridade alta: mover N em direção ao oppKing
  destinos_N = legalMoves(N)
  ordena por manhattanDist(destino, oppKing) crescente
  pega o mais perto que NÃO esteja sob ameaça
prioridade baixa: se N não pode ou está parado, avança peões
plan(escolha) → action_ready
```

**Parâmetros:** taxa de erro = 0%; foco no Cavalo.

---

### Estratégia 6 — Bispeiro (★★)
> "Domina diagonais; não usa colunas/linhas."

**DRAFT**
```
buy('B') × 2  // 4
buy('P')      // 5
ready
```
Resultado: King + 2B + 1P.

**POSITION**
```
B1: (0, fileira_back)  ← canto esquerdo
B2: (3, fileira_back)  ← canto direito
King: (1, fileira_back)
P:    (2, fileira_back)
ready
```

**ACTION**
```
turno %2 == 0 → mover B1; %2 == 1 → mover B2 (alterna bispos)
  destinos = legalMoves(B) (já são diagonais por definição)
  escolhe destino com menor manhattanDist(destino, oppKing)
se nenhum bispo pode mover, move o peão para frente
se nada → action_ready
```

**Parâmetros:** alternância determinística entre bispos.

---

### Estratégia 7 — Tanque (★★★)
> "Torre + peões; pressão linear lenta."

**DRAFT**
```
buy('R')   // 4
buy('P')   // 5
ready
```
Resultado: King + R + 1P.

**POSITION**
```
R: fileira frontal, x=1 ou 2
King: fileira de trás, x=0 ou 3 (canto, longe da R)
P: fileira de trás, x oposto ao King
ready
```

**ACTION**
```
move SEMPRE a Torre se houver alvo válido:
  destinos = legalMoves(R) (linha/coluna)
  escolhe o mais avançado (maior y para white / menor y para black)
  desempate: menor manhattanDist ao oppKing
se Torre não pode mover:
  avança peão se possível
  senão → action_ready
```

**Parâmetros:** sempre Torre primeiro; captura ativa.

---

### Estratégia 8 — Caçador (★★★)
> "Heurística atual do bot: vai sempre para o Rei."

> **Esta estratégia replica o comportamento de `server/bot.js` ANTES da refatoração.** Em SP-3.4, basta mover o código existente para `08-cacador.js`.

**DRAFT**
```
se !hasN && budget >= 3 → buy('N')
senão se pawns < 2 && budget >= 1 → buy('P')
senão → ready
```

**POSITION**
```
para cada peça em inventory (na ordem):
  slot = primeiro slot vazio da própria metade (varredura row-major)
  place(peça, slot)
ready
```

**ACTION**
```
oppKing = encontrar King inimigo
melhorMovimento = null; melhorScore = +∞
para cada peça própria:
  para cada (tx, ty) em legalMoves(peça):
    score = manhattanDist((tx,ty), oppKing)
    se score < melhorScore:
      melhorScore = score
      melhorMovimento = (peça, tx, ty)
se melhorMovimento → plan(melhorMovimento)
ready
```

**Parâmetros:** sem avaliação de ameaça; taxa de erro = 0% mas é cego para riscos.

---

### Estratégia 9 — Estrategista (★★★)
> "Avalia ameaça antes de mover; recua se necessário."

**DRAFT**
```
buy('N')  // 3
buy('B')  // 5
ready
```
Resultado: King + N + B.

**POSITION**
```
N: (1, fileira_frontal)
B: (2, fileira_back)
King: (0 ou 3, fileira_back)
ready
```

**ACTION**
```
oppKing = encontrar King inimigo

// Fase 1: alguma peça própria está sob ameaça?
peçasAmeaçadas = filter(myPieces, p => isPieceUnderThreat(p, state))
se peçasAmeaçadas.length > 0:
  alvo = peçasAmeaçadas[0]  ← prioriza peça mais valiosa (pieceBonus desc)
  destinos = legalMoves(alvo) onde NÃO esteja sob ameaça
  se destinos não vazia:
    plan(alvo → destinos[0])  ← recua
    return

// Fase 2: nenhuma ameaça → avança como Caçador
... mesma lógica do Caçador (8) ...
```

**Parâmetros:** lookahead 1-ply de ameaça.

---

### Estratégia 10 — Duelista (★★★)
> "Quer brigar, mas só duelos vencíveis."

**DRAFT**
```
buy('Q')   // 5
ready
```
Resultado: King + Q.

**POSITION**
```
Q: (1 ou 2, fileira_frontal)
King: (0, fileira_back) — escondido em canto
ready
```

**ACTION**
```
duelosVencíveis = []
para cada peça própria:
  para cada destino em legalMoves(peça):
    se destino contém peça inimiga:
      meuBônus = pieceBonus(peça.type)
      bônusInimigo = pieceBonus(peçaNoDestino.type)
      se meuBônus >= bônusInimigo:    ← duelo favorável (>= porque empate continua até alguém vencer)
        duelosVencíveis.push((peça, destino, meuBônus - bônusInimigo))

se duelosVencíveis.length > 0:
  ordena por (meuBônus - bônusInimigo) DESC  ← escolhe duelo mais vantajoso
  plan(top)
senão:
  avança Queen rumo ao oppKing (heurística Manhattan)
  se Queen sob ameaça → recua (ver Estrategista)
ready
```

**Parâmetros:** sempre busca confronto.

---

### Estratégia 11 — Cercador (★★★★)
> "Move pelos flancos; ataque pelos lados."

**DRAFT**
```
buy('B')  // 2
buy('B')  // 4
buy('P')  // 5
ready
```

**POSITION**
```
B1: (0, fileira_back)   ← flanco esquerdo
B2: (3, fileira_back)   ← flanco direito
King: (1, fileira_back)
P:    (2, fileira_back)
ready
```

**ACTION**
```
flancos = {x: 0, x: 3}

// preferir movimentos que MANTENHAM ou COLOQUEM peça em flanco
candidatos = []
para cada peça (exceto King):
  para cada destino em legalMoves(peça):
    se destino.x ∈ flancos:
      score = manhattanDist(destino, oppKing)
      candidatos.push((peça, destino, score))

se candidatos não vazia:
  ordena por score ASC
  plan(top)
senão:
  // fallback: heurística Caçador
  ... lógica do Caçador ...
ready
```

**Parâmetros:** prefere flancos; só usa centro se obrigado.

---

### Estratégia 12 — Iscador (★★★★)
> "Sacrifica peão para abrir caminho à peça forte."

**DRAFT**
```
buy('R')   // 4
buy('P')   // 5
ready
```
Resultado: King + R + 1P.

**POSITION**
```
P: (1, fileira_frontal)   ← peão isca
R: (1, fileira_back)      ← Torre atrás do peão
King: (3, fileira_back)
ready
```

**ACTION**
```
estado = state.turn % 3   ← ciclo de 3 turnos

se estado == 0:    // turno 1: empurra peão
  plan(P, P.x, P.y + dir)
se estado == 1:    // turno 2: peão segue (fica como isca exposta)
  se P alive: plan(P, P.x, P.y + dir)
  senão: plan(R seguindo o caminho aberto pelo peão)
se estado == 2:    // turno 3: Torre avança pelo corredor
  plan(R, P.x ou último corredor, máxima distância)

fallbacks:
  - se peão morrer cedo (duel perdido) → R toma o corredor imediatamente
  - se R sob ameaça → recua (Estrategista)
ready
```

**Parâmetros:** comportamento cíclico baseado em `state.turn`.

---

### Estratégia 13 — Rainha (★★★★)
> "King + Queen, sem peões; agressividade máxima."

**DRAFT**
```
buy('Q')   // 5
ready
```

**POSITION**
```
Q: (1 ou 2, fileira_frontal)
King: (0 ou 3, fileira_back)
ready
```

**ACTION**
```
// Q tem range altíssimo no 4×4. Pode atravessar quase sempre.
oppKing = encontrar oppKing

destinos = legalMoves(Q)
melhor = null
para cada d em destinos:
  score = -10 * (d == oppKing.coord ? 1 : 0)         // se pode capturar King: prioridade absoluta
        + manhattanDist(d, oppKing)                  // perto do oppKing é bom
        + (peçaInimigaEm(d) ? -3 : 0)                // bônus por capturar
        + (isUnderThreatAt(d, state) ? +5 : 0)       // penalidade por casa ameaçada
  se score < melhorScore: melhor = d, melhorScore = score

plan(Q, melhor)

se Q não pode mover (cercada): mover King 1 casa em qualquer direção válida
ready
```

**Parâmetros:** agressividade total, mas evita casas onde será morta no mesmo turno.

---

### Estratégia 14 — Mestre (★★★★★)
> "Lookahead 2-ply. Avalia minha melhor jogada × pior resposta do humano."

**DRAFT**
```
// composição balanceada: ataque + defesa
buy('N')   // 3
buy('B')   // 5
ready
```
Resultado: King + N + B.

**POSITION**
```
N: (1, fileira_frontal)   ← ataque
B: (2, fileira_back)      ← defesa diagonal
King: (0, fileira_back)
ready
```

**ACTION**
```
função evaluate(state, color):
  // heurística material + posicional
  myMaterial  = sum(pieceBonus(p.type)) for p in army where p.color == color
  oppMaterial = sum(pieceBonus(p.type)) for p in army where p.color == opp(color)
  myKingSafe  = dist(myKing, qualquer peça inimiga) ≥ 2 ? +2 : 0
  oppKingThreat = dist(qualquerPeça minha, oppKing) ≤ 1 ? +3 : 0
  return (myMaterial - oppMaterial) * 1.5 + myKingSafe + oppKingThreat

função simulate(state, move, color):
  return novo estado com `move` aplicado
  (simplificação: dado em duel = média 3.5; vence quem tem maior bonus+3.5)

bestScore = -∞
bestMove = null
para cada moveA em legalMoves(myColor):
  state1 = simulate(state, moveA, myColor)
  // pior resposta do oponente
  worstScoreForMe = +∞
  para cada moveB em legalMoves(state1, oppColor):
    state2 = simulate(state1, moveB, oppColor)
    s = evaluate(state2, myColor)
    se s < worstScoreForMe: worstScoreForMe = s
  // minha jogada que MAXIMIZA a pior resposta (minimax)
  se worstScoreForMe > bestScore: bestScore = worstScoreForMe; bestMove = moveA

plan(bestMove)
ready
```

**Parâmetros:**
- Lookahead **2-ply** (eu → oponente)
- Avaliação probabilística do duel: assume tirada média = 3.5; vencedor = quem tem maior `bonus+3.5`
- Profundidade fixa; não expande ramos sub-árvore. **Custo CPU:** O(n²) onde n ≈ 16 movimentos médios → ~256 simulações por turno. Aceitável (< 50ms).

---

### Estratégia 15 — Lenda (★★★★★)
> "Mestre, mas com 20% de chance de fazer outra coisa."

**DRAFT** — igual Mestre.

**POSITION** — igual Mestre.

**ACTION**
```
roll = Math.random()
se roll < 0.20:
  // 20% — escolhe entre 3 melhores jogadas do Mestre, aleatoriamente
  top3 = top 3 movimentos por score (Mestre)
  plan(randomChoice(top3))
senão:
  // 80% — mesmo movimento do Mestre
  plan(MestreEscolhe(state, color))
ready
```

**Parâmetros:**
- 20% aleatoriedade ponderada (só entre top 3)
- Garante que o oponente não consegue antecipar 100% das jogadas
- Diferente do Recruta (1) que é 100% aleatório: aqui a aleatoriedade é **entre boas opções**

---

## 4. Comportamento comum a todas as estratégias

### Duels (roll_dice / duel_resolve)
Todas as estratégias usam o comportamento atual de `bot.js`:
```
se !state.duel.pressed[botColor] → roll_dice (delay 1300ms)
senão se state.duel.resolveTime && !room.resolving → duel_resolve (delay 800ms)
```

### Sudden Death
Idem — todas as estratégias delegam para a lógica genérica.

### Delays (UX para humano sentir o bot "pensando")
| Fase | Delay padrão |
|---|---|
| draft_buy | 700-1400 ms |
| draft_ready | 700 ms |
| position_place | 800-1200 ms |
| position_ready | 900 ms |
| action_plan | 1000-1800 ms |
| action_ready | 500 ms |
| roll_dice | 1300 ms |
| duel_resolve | 800 ms |

Estratégias 14 e 15 podem usar delay maior em `action_plan` (até 2500ms) para passar a sensação de "pensando profundamente".

---

## 5. Tabela de validação cruzada

> Cada linha confere que estratégias **distintas** não convergem para o mesmo comportamento.

| # vs # | Diferença observável |
|---|---|
| 1 vs 8 | 1 é 100% random; 8 é determinístico Manhattan |
| 2 vs 4 | 2 nunca captura; 4 captura no avanço |
| 3 vs 9 | 3 nunca cruza meio; 9 cruza mas recua se ameaçado |
| 5 vs 13 | 5 usa N+P (defesa); 13 usa Q sozinha (sem suporte) |
| 6 vs 11 | 6 alterna bispos no centro/diagonais; 11 obriga peças aos flancos |
| 7 vs 10 | 7 ataca em linha (R); 10 só ataca quando vence o duel |
| 8 vs 14 | 8 não simula resposta; 14 simula resposta (minimax 2-ply) |
| 14 vs 15 | 14 sempre escolhe ótimo; 15 tem 20% de variabilidade |
| 12 vs todos | só 12 usa peão como sacrifício planejado |

---

## 6. Notas para SP-3.* (implementação)

- **SP-3.2 (1, 2, 3):** estratégias mais simples; ~50 linhas cada arquivo. Foco em edge cases (peão preso, todas peças bloqueadas).
- **SP-3.3 (4, 5, 6):** ainda determinísticas; testar que composição comprada bate com spec.
- **SP-3.4 (7, 8, 9):** estratégia 8 = port direto do `bot.js` atual. 9 introduz `isPieceUnderThreat` (helper).
- **SP-3.5 (10, 11, 12):** 10 introduz avaliação de duel; 12 é a mais complexa deste bloco (estado cíclico).
- **SP-3.6 (13, 14, 15):** 14 é a mais cara em CPU. **Medir tempo de execução** — se >100ms reduzir branches ou cachear.

### Helpers a criar em SP-3.1 (junto da refatoração)
Listar em `server/bot-strategies/_helpers.js`:
- `randomChoice(arr)`
- `weightedChoice(arr, weights)`
- `legalMoves(piece, state)` — wrapper sobre `isValidMove` que retorna lista de destinos válidos
- `manhattanDist(a, b)`
- `findPiece(state, color, type)` — primeira peça do tipo
- `findKing(state, color)` — atalho para `findPiece(state, color, 'K')`
- `pieceBonus(type)` — Q:5, R:4, N:3, B:2, P:1, K:0
- `isPieceUnderThreat(piece, state)` — itera peças inimigas e checa se alguma alcança a casa de `piece`
- `enemyAt(x, y, state, color)` — peça inimiga na casa, ou null
- `dirForward(color)` — `+1` para white, `-1` para black

---

## 7. Estratégia para balanceamento

Quando SP-9.1 testar a progressão, esperar (rough):

| Fase | Win-rate esperado de jogador novato |
|---|---|
| 1-3 | 80-95% (deve passar fácil) |
| 4-6 | 60-75% |
| 7-9 | 45-60% |
| 10-12 | 30-45% (precisa pensar) |
| 13-15 | 15-30% (desafio real) |

Se desvios grandes → ajustar parâmetros (taxa de erro, lookahead, composição) — **sem mexer na arquitetura**.
