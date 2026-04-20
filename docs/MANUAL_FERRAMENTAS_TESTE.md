# Manual de Ferramentas de Teste — microChess

---

## Ferramentas disponíveis

### Testes unitários (`npm test`)

Roda a partir de `server/`:
```bash
cd server
npm test
```

Executa `testes/server/mmr.test.js` (16 casos) e `testes/server/elo.test.js` (20 casos).
Saída: `✓` por caso · resumo `N passou · M falhou` · exit code 1 se qualquer falha.

---

### Inspetor do banco (`testes/db-inspector.js`)

Roda a partir da raiz do projeto:
```bash
node testes/db-inspector.js
node testes/db-inspector.js --player <username>
node testes/db-inspector.js --matches 20
```

Exibe: resumo geral · distribuição de resultados · top 10 por MMR · partidas recentes.
Com `--player <username>`: detalhe completo + últimas 10 partidas daquele jogador.

---

## Ferramentas planejadas (TESTES-B/C/D — futuro)

As ferramentas abaixo estão especificadas mas não implementadas.
Implementar quando necessário — não bloqueiam a produção atual.

| Ferramenta | Categoria | Requer servidor |
|-----------|-----------|----------------|
| `integration-api.js` | Endpoints HTTP | Sim |
| `scenario-full-game.js` | Partida automatizada via socket | Sim |
| `scenario-reconnect.js` | Fluxo disconnect + rejoin | Sim |
| `scenario-afk.js` | Timeout AFK (~2min) | Sim |
| `scenario-ban.js` | Escalonamento de ban (~6min) | Sim |
| `load-matchmaking.js` | Carga: N pares simultâneos | Sim |
| `replay-validator.js` | Integridade dos replays no banco | Não |
| `board-preview.html` | Visualizar estado de board | Não |
| `duel-sim.html` | Simulador de duelos | Não |
| `mmr-calculator.html` | Calculadora ELO/PdL | Não |
| `socket-inspector.html` | Monitor de eventos em tempo real | Sim |
| `i18n-checker.html` | Verificador de traduções | Sim |
| `phase-stepper.html` | Simulador de fases com mock | Não |

**Para implementar:** Sessões TESTES-B, TESTES-C, TESTES-D no pipeline.
