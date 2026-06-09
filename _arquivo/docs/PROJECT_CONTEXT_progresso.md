# Progresso das Sessões (ARQUIVO)

Movido de docs/PROJECT_CONTEXT.md — tabela histórica de sessões concluídas.

---

## Progresso das Sessões

| Sessão | Tema | Status |
|--------|------|--------|
| 0 | Planejamento e organização | ✅ Completo |
| 1 | Database SQLite | ✅ Completo |
| 2 | Autenticação JWT | ✅ Completo |
| 3 | MMR + WO/Ban + AFK | ✅ Completo |
| 4 | Replay Recording | ✅ Completo |
| 5 | Frontend Auth + Ban | ✅ Completo |
| 6 | Frontend Leaderboard + Replay | ✅ Completo |
| P | Polimento: ELO visível, email seguro, logout | ✅ Completo |
| 7 | Reorganização navegação + header + logout | ✅ Completo |
| 8 | Tela RANKING explicativa + Leaderboard | ✅ Completo |
| 9 | Histórico separado + Replay melhorado | ✅ Completo |
| 10 | Reconexão 60s | ✅ Completo |
| R | Revisão de segurança — análise e plano | ✅ Completo |
| 11 | Segurança crítica: rate limit, XSS, transação, game integrity | ✅ Completo |
| 12 | Integridade de dados: LP delta, nickname, timing oracle | ✅ Completo |
| 13 | Manutenção: replay cleanup, health endpoint | ✅ Completo |
| R2 | 2ª revisão: planning leak + viabilidade Play Store | ✅ Completo |
| 14 | Integridade competitiva + exclusão de conta + sync nickname | ✅ Completo |
| 15 | Play Store pré-requisitos: PWA, manifest, Helmet, Privacy Policy | ✅ Completo |
| 16 | Qualidade UX: troca de senha, loading states, disconnect banner | ✅ Completo |
| 17 | Sala privada com código 4 chars | ✅ Completo |
| 18 | Hardening Final (V-01..V-06) + P-07 badge não ranqueada | ✅ Completo |
| P-A | Localização: varredura + tradução EN | ✅ Completo |
| P-B | Links externos reais | ⏸ Integrado na Design-K |
| P-C | Localização: 7 idiomas restantes (ES/DE/IT/RU/JA/KO/ZH) | ✅ Completo |
| P-D | Replay: tabuleiro fixo + Turno 0 + label [N] | ⏸ Absorvido pela Design-J |
| **Design-A** | **Tokens CSS + fontes + flag-icons — base de tudo** | ✅ Completo |
| Design-B | Menu principal + header de jogador + tab bar | ✅ Completo |
| Design-F | Auth overlay (tela cheia) | ✅ Completo |
| Design-C | Matchmaking + Sala privada | ✅ Completo |
| Design-D | Telas de partida: Draft · Posição · Revelação · Ação | ✅ Completo |
| Design-E | Duelo + Game Over + estado de Empate | ✅ Completo |
| Design-G | Modais de sistema: ban, logout, delete, change-pw, reconnect | ✅ Completo |
| Design-H | Perfil + Editar avatar/apelido | ✅ Completo |
| Design-I | Ranking + Leaderboard | ✅ Completo |
| Design-J | Histórico + Replay (absorve P-D: tabuleiro + turno 0) | ✅ Completo |
| Design-K | Configurações + Como Jogar + Créditos + links externos (P-B) | ✅ Completo |
| Design-L | Estados de exceção: disconnect, AFK, Morte Súbita, sem conexão | ✅ Completo |
| P-12 | Balanceamento MMR para empate + fix Morte Súbita | ✅ Completo |
| P-12B | PdL empate (só ganho) + SD-1 overlay Morte Súbita | ✅ Completo |
| OPT-A | GZIP + remover Twemoji + reduzir pesos de fonte | ✅ Completo |
| POL-Theme | Detecção automática prefers-color-scheme + matchMedia listener | ✅ Completo |
| OPT-B | Animação de peças: transform vs left/top | ✅ Completo |
| OPT-C | flag-icons inline + SW versioning + perMessageDeflate + CSS hints | ✅ Completo |
| TESTES-A | Unit tests + db-inspector | ✅ Completo |
| INFRA-A | Railway Volume + persistência do SQLite + monitoramento de uptime | ✅ Completo |
| MANUT-A | Limpeza de contas de teste antes do Open Test | ✅ Completo (ADJ-A/B) |
| PRE-OT-A | Idioma EN padrão + detecção de sistema + preferência por usuário | ✅ Completo |
| PRE-OT-B | Modo Casual + novo fluxo NOVO JOGO | ✅ Completo |
| PRE-OT-C | Renomear PdL→XP + timer visível desde início do turno | ✅ Completo |
| PRE-OT-D | Bug fixes: tema claro, botão Criar Conta, rank incorreto | ✅ Completo |
| PRE-OT-E | Design/UI: padronizar botão Voltar, caixa alta, novo header | ✅ Completo |
| PRE-OT-F | Auditoria i18n 100% + Privacy Policy como link externo | ✅ Completo |
| PRE-OT-G | Pesquisa legislação proteção de dados internacional | ✅ Completo |
| SEC-A | Bundling + minificação + obfuscação JS (pré-requisito Play Store) | ⏳ Pendente |
| P-B | Links externos reais nos créditos (inclui URL da Privacy Policy) | ⏸ Aguarda URLs do usuário |
| TESTES-B | Integration API + partida automatizada | ⏸ Futuro |
| TESTES-C | 6 ferramentas de navegador | ⏸ Futuro |
| TESTES-D | Cenários avançados + carga + replay validator | ⏸ Futuro |
| ANAL-A | Instrumentação core de métricas (pré Open Test) | ✅ Completo |
| ANAL-B | Tabela de eventos — instrumentação de fluxo (pré Open Test) | ✅ Completo |
| ANAL-C | Extração — queries SQL e script de relatório | ⏸ Aguarda Open Test |
| ANAL-D | Interpretação — argumento de venda | ⏸ Aguarda Open Test |
| **SP** | **Single Player: 15 fases com bots de estratégias diferentes** | ✅ Completo |
| **ADJ-A** | **Ranked lock + delete users + créditos** | ✅ Completo |
| **ADJ-B** | **Sistema de inatividade (substituição completa)** | ✅ Completo |
| **ADJ-C** | **Sistema de desconexão (rework + guests)** | ✅ Completo |
| **ADJ-D** | **Empate por dupla inatividade/desconexão** | ✅ Completo |
| **ADJ-DESIGN** | **Ajustes de design: bot nv1 · Rei dinâmico · Peão→Rainha · Morte Súbita bo3 · odds na UI** | 🔄 Branch `ajustes-design` (pendente playtest + merge) |

*(Atualizar este arquivo ao concluir cada sessão)*
