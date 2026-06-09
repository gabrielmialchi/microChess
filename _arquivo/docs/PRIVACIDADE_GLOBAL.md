# microChess — Privacidade Global: Análise de Conformidade Internacional

**Atualizado:** 2026-04-23
**Escopo:** Leis de proteção de dados fora do eixo Brasil (LGPD) e Europa (GDPR)

---

## Contexto do produto

- App web gratuito (não monetizado no Open Test)
- Dados coletados: e-mail (AES-256), username, histórico de partidas
- Sem SDKs de terceiros, publicidade ou rastreamento
- Função de exclusão de conta disponível no app
- Servidor: Railway (fora do Brasil e da China)
- Comunicação: HTTPS/WSS criptografado

---

## Análise por Jurisdição

### 🇺🇸 CCPA — Califórnia, EUA

| Critério | Status |
|---------|--------|
| Consentimento explícito | ⚠️ Parcial — opt-in obrigatório para menores de 16 |
| Right to delete | ✅ Implementado (excluir conta) |
| Verificação de idade | ❌ Ausente — necessário age gate para menores |
| Data residency | ✅ Não exigida |
| Limiar de aplicabilidade | ✅ Não atingido — app gratuito, sem venda de dados, menos de 100k usuários CA |

**Risco real:** Baixo enquanto pequeno e gratuito. Alto se tiver usuários menores sem age gate.
**Ação mínima:** Implementar age gate ("Confirme que você tem 13 anos ou mais") antes de criar conta.

---

### 🇨🇦 PIPEDA — Canadá

| Critério | Status |
|---------|--------|
| Consentimento explícito | ⚠️ Parcial — consentimento deve ser obtido antes de coletar e-mail |
| Right to delete | ✅ Implementado |
| Verificação de idade | ✅ Não exigida especificamente |
| Data residency | ✅ Não exigida |
| Limiar de aplicabilidade | ⚠️ Sem threshold — aplica-se a qualquer usuário canadense |

**Risco real:** Médio. Enforcement raro contra pequenos devs, mas qualquer usuário canadense ativa a lei.
**Ação mínima:** Privacy Policy em inglês (e francês para Québec) com consentimento claro antes do e-mail.

---

### 🇯🇵 APPI — Japão

| Critério | Status |
|---------|--------|
| Consentimento explícito | ⚠️ Obrigatório para transferência fora do Japão |
| Right to delete | ✅ Implementado |
| Verificação de idade | ✅ Não exigida especificamente |
| Data residency | ⚠️ Transferência fora do Japão exige consentimento explícito do usuário |
| Limiar de aplicabilidade | ⚠️ Sem threshold — aplica-se a qualquer usuário japonês |

**Risco real:** Baixo-médio. Enforcement moderado.
**Ação mínima:** No cadastro, adicionar checkbox: "Aceito que meus dados sejam processados em servidores fora do Japão."

---

### 🇨🇳 PIPL — China

| Critério | Status |
|---------|--------|
| Consentimento explícito | ❌ Rigoroso — opt-in obrigatório para tudo |
| Right to delete | ❌ Mecanismos fáceis obrigatórios (além do que já existe) |
| Verificação de idade | ❌ Controles parentais fortemente recomendados |
| Data residency | 🚨 **Crítico** — dados de cidadãos chineses devem permanecer na China |
| Limiar de aplicabilidade | ⚠️ Aplica-se a qualquer serviço com usuários chineses |

**Risco real:** 🔴 CRÍTICO. Penalidade de até 5% do faturamento global. Enforcement ativo desde 2026.
**Decisão recomendada:** **Bloquear acesso à China** até ter infraestrutura local ou parceiro chinês. Não é viável para um indie gratuito cumprir PIPL com servidor no exterior.

---

### 🇸🇬 PDPA — Singapura

| Critério | Status |
|---------|--------|
| Consentimento explícito | ⚠️ Opt-in obrigatório; consent parental para menores de 13 |
| Right to delete | ✅ Implementado |
| Verificação de idade | ⚠️ Age gate recomendado; não exige documentos |
| Data residency | ⚠️ Transferência internacional exige adequacy assessment |
| Limiar de aplicabilidade | ⚠️ Sem threshold |

**Risco real:** Médio. Enforcement crescente em 2024-2026, especialmente para dados de menores.
**Ação mínima:** Age gate simples (auto-declaração). Privacy Policy clara em inglês.

---

### 🇹🇭 PDPA — Tailândia

| Critério | Status |
|---------|--------|
| Consentimento explícito | ⚠️ Opt-in obrigatório |
| Right to delete | ✅ Implementado |
| Verificação de idade | ✅ Não exigida especificamente |
| Data residency | ⚠️ Transferência para países sem "adequacy" requer compliance individual |
| Limiar de aplicabilidade | ⚠️ Sem threshold |

**Risco real:** Baixo-médio. Enforcement começou em 2024-2025.
**Ação mínima:** Privacy Policy em inglês; função de exclusão (já existe).

---

## Resumo de Status

| Jurisdição | Aplica-se? | Risco Atual | Ação Necessária |
|------------|-----------|-------------|----------------|
| CCPA (EUA-CA) | Se tiver usuários CA | 🟡 Baixo (sem menores) | Age gate antes do cadastro |
| PIPEDA (Canadá) | Qualquer usuário CA | 🟡 Médio | Privacy Policy + consentimento no cadastro |
| APPI (Japão) | Qualquer usuário JP | 🟡 Baixo-médio | Checkbox de transferência de dados no cadastro |
| PIPL (China) | ⚠️ Evitar | 🔴 Crítico | **Bloquear China** |
| PDPA (Singapura) | Qualquer usuário SG | 🟡 Médio | Age gate + Privacy Policy |
| PDPA (Tailândia) | Qualquer usuário TH | 🟢 Baixo-médio | Privacy Policy (já em andamento) |

---

## O que o microChess já atende (em todas as jurisdições)

- ✅ **Right to delete:** exclusão de conta disponível no app
- ✅ **Dados mínimos:** apenas e-mail, username e histórico de partidas
- ✅ **E-mail criptografado:** AES-256 no banco de dados
- ✅ **Sem venda de dados:** zero SDKs de publicidade ou rastreamento
- ✅ **Comunicação segura:** HTTPS/WSS em todas as transmissões
- ✅ **Senha não armazenada:** apenas hash bcrypt irreversível

## Gaps a resolver antes do Open Test global

| Prioridade | Gap | Sessão |
|-----------|-----|--------|
| 🔴 Alta | Age gate no cadastro (13+ obrigatório) | MANUT-B (nova) |
| 🔴 Alta | Bloquear ou não promover para China | Decisão do produto |
| 🟡 Média | Checkbox de transferência de dados (para usuários JP) | MANUT-B (nova) |
| 🟡 Média | Privacy Policy URL publicada e linkada no app | Sessão P-B |
| 🟢 Baixa | Privacy Policy em francês (para Québec) | Pós Open Test |
| 🟢 Baixa | "Do Not Sell My Data" link (só se >100k usuários CA) | Pós crescimento |

---

*Pesquisa realizada com base em fontes oficiais (CPPA, PRIV.gc.ca, PPC Japan, CAC China, PDPC Singapore, PDPC Thailand) e guias de compliance atualizados em 2025-2026.*
