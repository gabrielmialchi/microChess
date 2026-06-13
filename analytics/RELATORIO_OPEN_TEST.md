# 📊 Relatório — 1º Open Test do microChess

**Data do teste:** noite de 11 → 12 de junho de 2026
**Janela real de atividade:** ~21h00 às 00h35 (UTC) — pouco mais de **3h30 de movimento concentrado**
**Fonte:** export do servidor (`microchess-export-1781226642033.json`)
**Base analisada:** 21 contas · 45 partidas PvP · 145 partidas solo · 2.440 eventos

> ⚠️ O log bruto contém eventos antigos de desenvolvimento (desde abril). Este relatório considera apenas o recorte do open test real.

---

## 🎯 Resumo Executivo

O primeiro open test validou que **o jogo aguenta uma entrada em massa e funciona de ponta a ponta** — cadastro, fila, draft, partida, ranking e campanha. Em poucas horas, **22 pessoas jogaram ao mesmo tempo no pico**, sem queda de servidor.

Os três aprendizados mais importantes:

1. **O modo solo (campanha) é o mais jogado — e onde mais se perde gente.** Foram 145 partidas solo contra 45 PvP, mas **quase metade dos jogadores abandona o nível antes de terminar** (52% de conclusão). O funil afunila rápido: 40 tentativas no nível 1, só 7 chegam ao nível 7.

2. **As partidas são muito rápidas e há atrito de abandono.** Uma partida PvP dura em média **2m38s e 7 turnos**. Porém **11% terminam em W.O. (abandono)** — um sinal de frustração ou de espera longa que precisa ser olhado.

3. **O balanceamento merece atenção.** As **pretas vencem mais que as brancas (42% × 36%)** e, no draft, **o Peão domina mais da metade das escolhas (53%)** enquanto a Torre é quase ignorada (5,5%). Pode indicar peças mal balanceadas ou mal compreendidas.

**Veredito:** infraestrutura aprovada. O foco da próxima iteração deve ser **retenção no solo** e **reduzir abandonos no PvP**.

---

## 1. 👥 Público

| Métrica | Valor |
|---|---|
| Contas registradas | **21** |
| Pico de jogadores simultâneos | **22** (às 23h37) |
| Entrada concentrada | **16 cadastros na mesma hora (23h UTC)** |
| Jogadores que cadastraram mas não jogaram PvP | 3 |

A maior parte do público chegou junto, provavelmente por um link divulgado de uma vez. O servidor absorveu o pico sem problemas.

---

## 2. ⚔️ Partidas PvP (jogador × jogador)

**Total: 45 partidas** — 60% ranqueadas, 40% casuais.

| Indicador | Valor |
|---|---|
| Duração média | **2m38s** |
| Turnos por partida | **7,0** |
| Tempo médio por jogada | 12s |
| Vitória das **pretas** | **42,2%** |
| Vitória das **brancas** | 35,6% |
| Empates | 11,1% |
| **Abandonos (W.O.)** | **11,1%** (5 partidas) |

**Pontos de atenção:**
- A vantagem das pretas é contraintuitiva (no xadrez tradicional, brancas têm vantagem). Vale verificar se a mecânica de posicionamento/segundo a jogar dá vantagem.
- 1 em cada 9 partidas termina em abandono. O jogador **"Joe" sozinho tomou 3 W.O. contra**.

---

## 3. 🤖 Modo Solo / Campanha

**O modo mais jogado do teste: 145 partidas.**

| Indicador | Valor |
|---|---|
| Partidas iniciadas | 145 |
| Concluídas (venceu o nível) | 76 |
| Abandonadas | 40 |
| **Taxa de conclusão** | **52,4%** |
| Jogadores distintos | 21 (4 convidados sem conta) |

**Funil de dificuldade — onde a campanha perde gente:**

| Nível | Tentativas |
|---|---|
| 1 | 40 |
| 2 | 25 |
| 3 | 17 |
| 4 | 14 |
| 5 | 10 |
| 6 | 12 |
| 7 | 7 |
| 8 | 9 |
| 9 | 2 |
| 10 | 6 |
| 11–13 | 1 cada |

**Quem foi mais longe:** Dryyana (nível 12), BigCat (6), Joe e Thomas (5).

> A queda do nível 1 (40) para o 3 (17) mostra que **mais da metade do público para nos primeiros desafios**. É o principal gargalo de retenção.

---

## 4. 🎲 Draft — peças escolhidas

265 exércitos montados (12 saíram vazios por timeout/desconexão no draft).

| Peça | Escolhas | % |
|---|---|---|
| ♙ Peão | 327 | **52,7%** |
| ♗ Bispo | 117 | 18,8% |
| ♘ Cavalo | 87 | 14,0% |
| ♕ Dama | 56 | 9,0% |
| ♖ Torre | 34 | 5,5% |

> O Peão dominar metade das escolhas e a Torre ser quase ignorada sugere desequilíbrio de valor percebido. Vale investigar se é estratégia ótima real ou falta de clareza sobre as peças.

---

## 5. 🔌 Confiabilidade técnica

| Evento | Qtde | Leitura |
|---|---|---|
| Desconexões em partida | 18 | Aconteceram, mas… |
| Reconexões com sucesso | 14 | …a maioria voltou ao jogo |
| "reconnect_fail" | 200 | Quase todos `no_pending` = recarregar página sem partida ativa (**ruído, não bug**) |
| Cancelamentos de fila | 11 | Espera média de **28s** antes de desistir (máx 1min) |

**Conclusão técnica:** nenhuma falha grave de servidor. As desconexões foram recuperadas na maioria dos casos. A espera na fila reflete poucos jogadores online ao mesmo tempo procurando oponente humano.

---

## 6. 🏆 Ranking final (por MMR)

| # | Jogador | MMR | V | D | E |
|---|---|---|---|---|---|
| 1 | BonecoSinforoso | 1572 | 8 | 1 | 1 |
| 2 | OmeleduFromage | 1572 | 5 | 0 | 0 |
| 3 | Omago | 1534 | 3 | 1 | 1 |
| 4 | OFernandoO | 1516 | 2 | 1 | 0 |
| 5 | BigCat | 1514 | 5 | 1 | 0 |
| … | *(11 jogadores em 1500, sem partidas ranqueadas decisivas)* | 1500 | | | |
| 19 | Joe | 1478 | 0 | 8 | 0 |
| 20 | Galotinha | 1474 | 2 | 4 | 1 |
| 21 | 420dash420 | 1409 | 4 | 8 | 1 |

Todos começaram em 1500 (MMR neutro). O sistema de pontuação reagiu de forma coerente — vencedores subiram, derrotados desceram.

---

## 7. ✅ Recomendações para a próxima iteração

| Prioridade | Ação | Por quê |
|---|---|---|
| 🔴 Alta | **Suavizar os primeiros níveis do solo** | Metade do público para entre os níveis 1 e 3 |
| 🔴 Alta | **Investigar abandonos no PvP (W.O. 11%)** | Frustração ou espera longa afastam jogadores |
| 🟡 Média | **Revisar balanceamento brancas × pretas** | Pretas vencem 42% × 36% |
| 🟡 Média | **Revisar valor da Torre e domínio do Peão** | Draft muito concentrado em uma peça |
| 🟢 Baixa | **Reduzir ruído de logs** (`reconnect_fail no_pending`) | Facilita futuras análises |

---

*Documento gerado a partir do export oficial do servidor. Script de análise reutilizável em `analytics/analisar.js`.*
