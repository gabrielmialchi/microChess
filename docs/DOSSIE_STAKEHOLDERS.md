# microChess — Dossiê Técnico para Stakeholders
### Tradução de arquitetura em garantias de negócio

---

## 1. Infraestrutura do Servidor

**A versão curta:** o servidor é gerenciado por uma plataforma profissional, com camadas de segurança ativas e plano de escalabilidade claro.

### Como funciona
O backend do jogo roda na **Railway**, plataforma de hospedagem usada por startups e empresas de tecnologia globais. O servidor é responsável por toda a lógica do jogo — os dispositivos dos jogadores funcionam apenas como tela. Nenhuma decisão de jogo acontece no celular.

### Segurança ativa
- **Proteção contra sobrecarga:** limite automático de requisições por IP (rate limiting) — ataques de força bruta são bloqueados antes de atingir o sistema
- **Headers de segurança:** camada Helmet ativa, padrão da indústria para aplicações web seguras
- **Comunicação criptografada:** toda a transmissão de dados ocorre via HTTPS/WSS (protocolo criptografado), não há comunicação em texto aberto
- **Monitoramento de saúde:** endpoint `/health` permite alertas automáticos em caso de instabilidade

### Em caso de ataque
| Cenário | Resposta |
|---------|----------|
| Tentativa de força bruta em login | Bloqueio automático por rate limiting |
| DDoS leve (volume comum) | Absorvido pela infraestrutura da Railway |
| DDoS de alto volume | Protocolo de migração para Railway com proteção dedicada ou Cloudflare (1 hora de implementação) |
| Comprometimento de credenciais | Invalidação remota de todos os tokens ativos com um comando |

### Limitação honesta e plano
O banco de dados atual (SQLite) é ideal para a fase de lançamento e suporta confortavelmente até milhares de usuários simultâneos. Para escala acima de 10.000 usuários ativos, a migração para PostgreSQL está mapeada e pode ser executada sem downtime visível para o usuário.

---

## 2. Privacidade e Proteção de Dados dos Usuários

**A versão curta:** o jogo coleta o mínimo necessário, armazena tudo criptografado, e dá ao usuário controle total sobre seus dados.

### O que coletamos e como protegemos
| Dado | Armazenamento |
|------|--------------|
| Senha | Jamais armazenada — apenas um hash irreversível (bcrypt) |
| E-mail | Criptografado com AES-256 no banco de dados |
| Nome de usuário | Texto simples (dado público por natureza) |
| Histórico de partidas | Associado ao ID do usuário, sem dados pessoais |

- **Zero acesso de terceiros:** não há SDKs de análise, publicidade ou rastreamento de terceiros no código
- **Exclusão completa:** o jogador pode deletar a conta pelo próprio aplicativo — todos os dados são removidos permanentemente
- **Sem dados nos dispositivos:** os arquivos instalados no celular não contêm nenhuma senha, chave de banco de dados ou informação sensível

### Transição para Play Store / App Store
O jogo já é uma **PWA (Progressive Web App)** — tecnologia que permite distribuição tanto pela web quanto pelas lojas de aplicativos sem reescrever o código. A publicação na Play Store usa **Trusted Web Activity (TWA)**, método oficial do Google que mantém toda a segurança já implementada.

Antes da submissão às lojas:
- Obfuscação do código JavaScript (impede engenharia reversa)
- Política de Privacidade já redigida e disponível no aplicativo
- Conformidade com diretrizes de privacidade do Google Play e Apple App Store mapeada

### Posicionamento em due diligence
O sistema não coleta dados desnecessários, não revende informações, e está estruturado para conformidade com LGPD (Brasil) e GDPR (Europa) desde o design.

---

## 3. Sistema de Ranking e Engajamento

**A versão curta:** o sistema foi projetado para reter jogadores, não para forçar equilíbrio artificial — habilidade real é recompensada, e proteções contra frustração mantêm jogadores iniciantes no jogo.

### Como o ranking funciona
O microChess usa um sistema de **14 divisões** (de Peão Aprendiz a Rei), com pontos de liga (PdL) que sobem com vitórias e descem com derrotas. O cálculo segue a fórmula ELO — o mesmo usado em xadrez profissional e em jogos como League of Legends e Chess.com.

### Por que não é 50/50
O sistema ELO **não força** equilíbrio artificial de vitórias. O que acontece:
- Jogadores bons sobem de rank e enfrentam oponentes melhores — o WinRate naturaliza perto de 50% no nível correto de habilidade
- Jogadores iniciantes perdem mais no começo, mas o sistema aprende e os coloca contra oponentes equivalentes
- **Resultado:** cada vitória significa algo real, cada derrota é justa — isso cria engajamento genuíno

### Mecanismos de retenção
| Mecanismo | Efeito |
|-----------|--------|
| Escudo de promoção | Ao subir de grupo, o jogador ganha proteção temporária contra rebaixamento — reduz abandono por frustração |
| Empate com ganho mínimo | Empates nunca punem — ambos ganham pelo menos +1 PdL |
| Partidas curtas (~5min) | Alta frequência de sessões, ideal para mobile |
| Sala privada com código | Permite jogar com amigos — fator de aquisição orgânica |
| Replay de partidas | Jogadores revisam partidas, aprendem, voltam |

### Posicionamento competitivo
O design de ranking foi calibrado para **reter jogadores nos primeiros 30 dias** — período crítico de abandono em jogos mobile. Proteções contra rebaixamento, partidas rápidas e progressão visível são os três pilares comprovados de retenção em jogos competitivos.

---

## 4. Integridade Competitiva — Anti-Trapaça e Punições

**A versão curta:** o servidor é a única autoridade do jogo. O celular do jogador não tem poder de decisão — é apenas uma tela.

### Arquitetura autoritária (server-side)
Toda ação do jogo é **validada pelo servidor antes de ser aceita**:

| Fase | O que o servidor valida |
|------|------------------------|
| Recrutamento (Draft) | Orçamento de pontos, tipos de peças permitidos |
| Posicionamento | Limites de território, sobreposição de peças |
| Movimentos | Validade do movimento para cada tipo de peça, posse da peça |
| Duelos | Cálculo de dados e bônus realizado pelo servidor |

Isso significa: **mesmo que alguém modifique o aplicativo no celular, o servidor rejeita qualquer ação inválida**. Trapaças do lado cliente são tecnicamente impossíveis de afetar o resultado.

### Sistema de detecção
Tentativas repetidas de ações inválidas são registradas automaticamente. Padrões suspeitos (ex: 15+ tentativas de movimento inválido em uma partida) são sinalizados para revisão.

### Sistema de punição
| Infração | Punição |
|----------|---------|
| Abandonar partida (WO) 3x em 24h | Banimento temporário: 30 minutos |
| 5 abandonos em 24h | Banimento: 2 horas |
| 7+ abandonos em 24h | Banimento: 24 horas |
| Tentativa de burlar o sistema | Sinalização para revisão manual |

Os banimentos são aplicados automaticamente, sem intervenção humana necessária. O jogador vê a contagem regressiva no próprio app e não pode entrar em partidas ranqueadas durante o período.

### Garantia para investidores
Em jogos competitivos, a percepção de justiça é diretamente ligada à retenção. Um jogo onde trapaças são possíveis perde a comunidade rapidamente. A arquitetura atual garante que **o campo de jogo é tecnicamente nivelado para todos os jogadores**.

---

## 5. Custos Operacionais e Roadmap Comercial

### Custo atual (fase MVP / lançamento)
| Serviço | Custo | Função |
|---------|-------|--------|
| Railway (servidor) | ~US$ 5–20/mês | Backend, banco de dados, lógica do jogo |
| Netlify (frontend) | Gratuito | Hospedagem dos arquivos do app |
| Google Play (taxa única) | US$ 25 | Publicação na Play Store |
| Apple App Store | US$ 99/ano | Publicação na App Store (quando planejado) |

**Custo total de operação na fase de lançamento: menos de R$ 120/mês.**

### Escala de custos conforme crescimento
| Usuários ativos/mês | Custo estimado servidor |
|--------------------|------------------------|
| Até 1.000 | ~US$ 5/mês |
| 1.000 – 10.000 | ~US$ 20–50/mês |
| 10.000 – 100.000 | ~US$ 100–300/mês (migração para PostgreSQL) |
| 100.000+ | Negociação com Railway/AWS — modelo de receita já cobre |

### Modelo de monetização disponível para implementação
O jogo foi projetado para ser **free-to-play com monetização cosmética** — modelo comprovado que não prejudica a experiência competitiva:

- **Skins de peças:** temas visuais alternativos (ex: peças douradas, temáticas)
- **Avatares e perfis personalizados:** itens de expressão sem impacto no jogo
- **Battle Pass sazonal:** recompensas cosméticas por progressão
- **Sem pay-to-win:** o sistema de ranking garante que dinheiro não compra vantagem competitiva — posicionamento essencial para Play Store e para a comunidade

### Atualizações e manutenção
O sistema foi construído modularmente: novas funcionalidades, eventos sazonais e ajustes de balanceamento podem ser publicados **sem reescrever o código base** e **sem interrupção do serviço para os jogadores**.

---

## Resumo Executivo

| Pilar | Status | Posicionamento |
|-------|--------|---------------|
| Segurança do servidor | ✅ Ativo | Rate limiting, HTTPS, headers de segurança, tokens com expiração |
| Privacidade de dados | ✅ Ativo | AES-256, bcrypt, zero tracking, exclusão de conta |
| Conformidade com lojas | 🔄 Planejado | PWA pronta; obfuscação e submissão mapeadas |
| Integridade competitiva | ✅ Ativo | Servidor autoritário, anti-cheat, ban automático |
| Sistema de ranking | ✅ Ativo | ELO + 14 divisões + escudos de proteção |
| Custo de operação | ✅ Otimizado | < R$ 120/mês no lançamento |
| Escalabilidade | ✅ Mapeada | Migração para PostgreSQL documentada |
| Monetização | 🔄 Pronta para implementar | Cosmética, sem pay-to-win |

---

*Documento preparado para uso interno em rodadas de negócio e apresentações a investidores.*
*Versão técnica detalhada disponível mediante solicitação.*
