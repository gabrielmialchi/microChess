# Análise — 1º Open Test microChess

Exportado em: 2026-06-12T01:10:42.034Z

## 1. Janela do teste

- Primeiro evento: 2026-04-24T18:05:46.107Z
- Último evento: 2026-06-12T00:35:23.229Z
- Duração da atividade principal: 69509m37s

## 2. Usuários

- Contas registradas (na tabela players): **21**
- Eventos register_success: **23**
- Convidados distintos que jogaram solo: ver seção solo

Registros por hora (UTC):

- 2026-06-08T23h: 2
- 2026-06-11T20h: 2
- 2026-06-11T21h: 2
- 2026-06-11T23h: 16
- 2026-06-12T00h: 1

## 3. Usuários simultâneos (CCU)

- **Pico de simultâneos: 22** em 2026-06-11T23:37:01.143Z
- Média quando havia >=1 online: 1.4
- Snapshots com alguém online: 641 de 8124

## 4. Partidas PvP registradas

Total de partidas: **45**

Por modo:
- casual: 18 (40.0%)
- ranked: 27 (60.0%)

Por resultado:
- white: 16 (35.6%)
- draw: 5 (11.1%)
- black: 19 (42.2%)
- wo_black: 3 (6.7%)
- wo_white: 2 (4.4%)

- Vitórias das brancas: 35.6% | pretas: 42.2%
- Walkovers (W.O. / abandono): **5** (11.1%)
- Empates: 5 (11.1%)
- Média de turnos/partida: 7.0
- Duração média (quando registrada): 2m38s [42 partidas]
- Tempo médio por jogada (ttm): 12s [42 partidas]

## 5. Eventos por tipo

- phase_enter: 806
- draft_complete: 456
- draft_army: 265
- reconnect_fail: 200
- queue_enter: 153
- solo_start: 145
- draft_start: 140
- session_end: 86
- solo_complete: 76
- solo_quit: 40
- register_success: 23
- disconnect_ingame: 18
- reconnect_success: 14
- queue_cancel: 11
- session_start: 7

## 6. Funil de fila/matchmaking (PvP)

- Entradas na fila (queue_enter): 153
- Cancelamentos de fila (queue_cancel): 11 (7.2% desistência)
- draft_start (pareamentos): 140

- Espera média antes de CANCELAR a fila: 28s (máx 1m)
  > Indica quanto tempo as pessoas aguentaram sem achar oponente.

## 7. Confiabilidade de conexão

- Desconexões durante partida (disconnect_ingame): 18
- Reconexões com sucesso: 14
- Reconexões falhas (reconnect_fail): 200
  > A maioria dos reconnect_fail tem motivo "no_pending" = tentou reconectar sem partida ativa (normal ao recarregar a página).

## 8. Modo solo (vs BOT / campanha)

- solo_start: 145
- solo_complete (venceu o nível): 76
- solo_quit (desistiu): 40
- Taxa de conclusão: 52.4%
- Jogadores distintos no solo: 21 (sendo 4 convidados sem conta)

- Desistências marcadas como W.O.: 2

Tentativas por nível (solo_start):
- Nível 1: 40 tentativas
- Nível 2: 25 tentativas
- Nível 3: 17 tentativas
- Nível 4: 14 tentativas
- Nível 5: 10 tentativas
- Nível 6: 12 tentativas
- Nível 7: 7 tentativas
- Nível 8: 9 tentativas
- Nível 9: 2 tentativas
- Nível 10: 6 tentativas
- Nível 11: 1 tentativas
- Nível 12: 1 tentativas
- Nível 13: 1 tentativas

Progresso máximo por jogador (singleplayer_progress):
- Dryyana: nível 12
- BigCat: nível 6
- Joe: nível 5
- Thomas: nível 5
- BonecoSinforoso: nível 3
- WolfSilver: nível 3
- Bizuka: nível 3
- OFernandoO: nível 3
- atmo: nível 2
- law: nível 2
- Omago: nível 2
- J_sparrow: nível 1
- Glauci: nível 0
- henriquemonteiro: nível 0

## 9. Draft — peças mais escolhidas

Exércitos montados: 265 (12 vazios = timeout/desconexão no draft)

- Peão: 327 (52.7%)
- Bispo: 117 (18.8%)
- Cavalo: 87 (14.0%)
- Dama: 56 (9.0%)
- Torre: 34 (5.5%)

## 10. Ranking de jogadores

Top por MMR:

| Jogador | MMR | V | D | E | WO+ | WO- | Rank ELO | LP |
|---|---|---|---|---|---|---|---|---|
| BonecoSinforoso | 1572 | 8 | 1 | 1 | 0 | 0 | 1 | 17 |
| OmeleduFromage | 1572 | 5 | 0 | 0 | 1 | 0 | 1 | 10 |
| Omago | 1534 | 3 | 1 | 1 | 1 | 0 | 0 | 71 |
| OFernandoO | 1516 | 2 | 1 | 0 | 1 | 0 | 0 | 24 |
| BigCat | 1514 | 5 | 1 | 0 | 0 | 0 | 0 | 22 |
| atmo | 1501 | 0 | 2 | 1 | 0 | 0 | 0 | 2 |
| law | 1500 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| henriquemonteiro | 1500 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| WolfSilver | 1500 | 2 | 0 | 1 | 0 | 0 | 0 | 0 |
| Bizuka | 1500 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| daniellaurindo_ | 1500 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Dryyana | 1500 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| Dimas | 1500 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| MukaChessMan | 1500 | 1 | 1 | 0 | 1 | 0 | 0 | 24 |
| Thomas | 1499 | 1 | 4 | 2 | 0 | 0 | 0 | 24 |
| J_sparrow | 1487 | 0 | 3 | 1 | 0 | 1 | 0 | 0 |
| ashy | 1486 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| Glauci | 1483 | 1 | 4 | 0 | 1 | 0 | 0 | 0 |
| Joe | 1478 | 0 | 8 | 0 | 0 | 3 | 0 | 12 |
| Galotinha | 1474 | 2 | 4 | 1 | 0 | 0 | 0 | 2 |
| 420dash420 | 1409 | 4 | 8 | 1 | 0 | 1 | 0 | 0 |

- Jogadores que registraram mas NÃO completaram nenhuma partida PvP: 3 de 21

## 11. Engajamento individual

| Jogador | Eventos | 1º registro | Última atividade |
|---|---|---|---|
| Glauci | 182 | 2026-06-11 23:01:05 | 2026-06-11 23:54:07 |
| Dryyana | 174 | 2026-06-11 23:17:42 | 2026-06-12 00:13:49 |
| Thomas | 122 | 2026-06-11 23:02:01 | 2026-06-12 00:08:41 |
| 420dash420 | 118 | 2026-06-11 23:16:15 | 2026-06-12 00:09:01 |
| BigCat | 107 | 2026-06-11 20:29:50 | 2026-06-11 23:25:54 |
| Joe | 104 | 2026-06-11 21:50:38 | 2026-06-12 00:18:36 |
| BonecoSinforoso | 80 | 2026-06-11 23:04:50 | 2026-06-11 23:50:06 |
| J_sparrow | 70 | 2026-06-11 23:03:06 | 2026-06-11 23:48:26 |
| WolfSilver | 67 | 2026-06-11 23:03:32 | 2026-06-11 23:39:43 |
| OFernandoO | 65 | 2026-06-11 23:00:05 | 2026-06-12 00:14:10 |
| Galotinha | 65 | 2026-06-11 23:24:21 | 2026-06-11 23:54:11 |
| atmo | 64 | 2026-06-11 20:11:02 | 2026-06-11 23:35:27 |
| law | 64 | 2026-06-11 21:29:24 | 2026-06-11 23:38:17 |
| Omago | 57 | 2026-06-11 23:47:06 | 2026-06-12 00:10:01 |
| OmeleduFromage | 54 | 2026-06-11 23:20:00 | 2026-06-11 23:47:07 |
| Bizuka | 42 | 2026-06-11 23:04:36 | 2026-06-11 23:04:36 |
| daniellaurindo_ | 33 | 2026-06-11 23:07:20 | 2026-06-11 23:07:20 |
| henriquemonteiro | 28 | 2026-06-11 23:03:18 | 2026-06-11 23:07:58 |
| MukaChessMan | 24 | 2026-06-12 00:00:25 | 2026-06-12 00:18:36 |
| ashy | 10 | 2026-06-11 23:40:21 | 2026-06-11 23:46:20 |
| Dimas | 6 | 2026-06-11 23:25:52 | 2026-06-11 23:25:52 |
