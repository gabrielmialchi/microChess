# Decisões de design — pendentes / pós-MVP

## Doc03 · Confirmação antes de Ranqueada

**Reflexão registrada em:** 2025-04-19

Botão "Jogar Ranqueada" pode ser acionado por misclick. Opções:
- **A (preferida):** PopUp leve — "Encontrar partida? [Cancelar] [Jogar]" — 1 tap extra mas previne frustração
- **B:** Nenhuma confirmação — padrão da maioria dos jogos (Clash Royale, etc). Compensar com "Cancelar" fácil na tela de matchmaking (já existe)

**Decisão:** implementar opção B por ora (cancelar na fila é barato). Reavaliar após feedback de usuários reais.

---

## Doc04 · Login com outros métodos

**Pendente — pós-MVP**

O app vai para Play Store. Métodos alternativos a considerar:
- **Google Sign-In** (Play Games Services ou OAuth) — mais natural no Android
- **Login com Apple** (obrigatório na App Store se/quando expandir para iOS)
- **Conta Google Play Games** — integração nativa para leaderboard e conquistas

**Orientação de design:**
- Tela de Login deve ter seção separada "Ou entre com:" com botões padrão de cada provedor
- Fluxo novo: se usuário já tem conta Google, pular formulário direto para o jogo
- Manter login por email/senha como fallback para todos os casos

**Não implementar agora.** Registrar para planejamento da versão Play Store.

---

## Doc08 · Bandeiras de idioma — compatibilidade

**Problema:** emoji de bandeiras não renderizam no Windows (aparecem como códigos de texto: BR, ES, GB).

**Solução aplicada:** chips CSS com cor de fundo sólida + código de 2 letras. Universal em todos os sistemas.

**Manter em mente:** ao implementar no index.html, não usar emoji flags. Usar a mesma abordagem de chips CSS ou imagens SVG das bandeiras.

---

## Localização — estratégia de migração

**Situação:** index.html atual tem 9 idiomas completos com objeto `T` (chaves por tela/componente).

**O que mudou no novo design:**
- Novas telas: tabbar, avatar picker com duas fileiras, header de perfil simplificado
- Textos alterados: fases do jogo (sem barra de etapas), topbar compacto
- Textos novos: "Toque para devolver", "Limpar ✕", "Brancas / Pretas" (picker), "= 0 PdL" (empate), "Morte Súbita" (fase)

**Estratégia recomendada para Claude Code:**
1. Manter todas as chaves existentes em `T` — retrocompatível
2. Adicionar chaves novas ao final de cada idioma (começar em PT, propagar para os 8 restantes)
3. Chaves novas sugeridas:
   - `draft_return_hint`: "Toque para devolver" / "Tap to return"
   - `draft_clear`: "Limpar" / "Clear"
   - `avatar_white`: "Brancas" / "White"
   - `avatar_black`: "Pretas" / "Black"
   - `draw`: "Empate" / "Draw"
   - `sudden_death`: "Morte Súbita" / "Sudden Death"
   - `pdl_draw`: "= 0 PdL"
4. Textos de UI que não mudam de idioma (ex: códigos de sala, números) não precisam de chave

**Não é bloqueante para implementação** — pode começar em PT e adicionar traduções depois.
