# microChess — Roadmap v1.2.x (Pós 1º Open Test)
## Revisado em 2026-06-15 — organizado por ÁREA DE ATUAÇÃO

---

## Como ler este plano

Sessões **curtas** agrupadas por **área de atuação** (mesma parte do código/sistema juntas,
para reduzir troca de contexto e conflito de merge). Cada sessão fecha itens `OT-NN` das
diretrizes (`docs/POS_OPEN_TEST_1_DIRETRIZES.md`). Acompanhamento visual:
`docs/CHECKLIST_v1.2.html`.

**Prioridade** (define a ordem, atravessa as áreas):
🅿0 crítico — antes do próximo teste · 🅿1 importante · 🅿2 depois.
**Risco:** 🟢 baixo · 🟡 médio · 🔴 alto. **Arquivos:** `[F]` frontend · `[S]` servidor · `[DB]` banco · `[D]` design.

**Concluído antes deste ciclo** (HTP-FIX, ADJ-JUICE A–D, BUG-PRONTO frontend, Painel de
testes) → arquivado em `_arquivo/docs/SESSAO_POR_SESSAO_PLANNING_concluido.md`.

> Regras do projeto: **nunca reescrever** `server.js`/`index.html` por completo (só inserir
> blocos); lógica nova em arquivos separados; CSS novo inline; retrocompatibilidade com
> convidado; 1 branch por sessão.

---

## ⭐ Ordem de execução recomendada

Atravessa as áreas respeitando a prioridade. O **bloco crítico (v1.2.0)** vem primeiro:

1. **S01 + S31** (juntas — ambas mexem no fluxo de POSITION/input) → gates rígidos + responsividade.
2. **S04** — esclarecer regra de captura (decide bug × clareza).
3. **S02 + S03** (juntas — ambas mexem em resultado/MMR) → empate correto + modo ranked.
   → *Aqui o jogo já pode ir a um novo teste com segurança.*
4. **Área C** (inatividade/reconexão) — usa a taxonomia de resultado da S02.
5. **Área D + S33** (HUD e quick wins de telas) — polimento visível.
6. **Áreas F e G** (retenção, balanceamento, design/handoff).

---

## Operacional (não é sessão de código)
- **OP-1 — Limpar base de usuários** `[DB]`: script one-shot para zerar contas, **só na
  véspera do próximo teste**, com `/api/admin/export` de backup antes.

---

# ÁREA A — Núcleo de partida: fluxo Draft/Position/Action + responsividade
`[S][F]` — toca a engine de partida (DRAFT/POSITION/ACTION) e o render do tabuleiro.

## ✅ S01 — Gates rígidos do PRONTO + guarda de servidor `[F][S]` 🔴 🅿0 — fecha OT-02
**Spec: `POS_OPEN_TEST_1_DIRETRIZES.md` §7. Substitui parte do BUG-PRONTO no pré-jogo.**
- [x] **Draft:** [PRONTO] desabilitado com 0 peças; habilita com ≥1 (front) + servidor rejeita
      `draft_ready` com 0 peças (`server.js:1533`).
- [x] Manter o popup de pontos não gastos no Draft (soft, já feito no BUG-PRONTO).
- [x] **Positioning:** [PRONTO] desabilitado até TODAS as peças posicionadas (front) + servidor
      rejeita `position_ready` incompleto (`server.js:1581`).
- [x] **Remover o popup POSITION do BUG-PRONTO** ("seguir sem posicionar") — agora é gate rígido.
- [x] **Action:** manter popup "passar sem mover?" (inalterado).
- [x] Garantir que exército vazio nunca dispare GAMEOVER relâmpago.

## ✅ S31 — Lentidão / responsividade de input `[F][S]` 🔴 🅿0 — fecha OT-25
**2 fontes (Vivi + Forms): cliques demoram/não respondem ao posicionar. Pode bloquear o jogo.**
- [x] **Investigar primeiro** no loop local: medir latência clique→render em POSITION/ACTION.
- [x] Diagnosticar: falta de UI otimista (espera round-trip), re-render do tabuleiro inteiro,
      ou latência do Railway. Comparar local (sem rede) × itch (com rede) para isolar.
- [x] Separar a "demora após o dado" entre latência real e o **beat proposital J7/J8** (ver S30).
- [x] Correção provável: render otimista no posicionamento (coloca local na hora, confirma com servidor).

## ✅ S04 — Esclarecer regra de captura / peças sumindo `[S]` 🔴 🅿0 — investiga OT-01
**3 relatos (Muka, Dash, Vivi) de "peças sumindo sem dado" → gap de clareza confirmado, não bug.**
- [x] **Reproduzir** no loop local (2 janelas). Confirmar a regra: **quando rola dado (Rei) ×
      quando captura direto (não-Rei)** e se >1 peça pode sumir por jogada.
- [x] Se bug real: corrigir na resolução de ACTION/duelos (`server.js:753-826`, `987-1018`).
- [x] Se clareza (provável): rotear para tutorial (S27), juice de captura (J5), contorno (S28)
      e deixar a regra explícita no Como Jogar. ✓ Roteado para S27.

## ✅ S14 — Desfazer compra no draft `[F]` 🟡 🅿1 — fecha OT-07
- [x] Undo granular (devolver a última peça / peça específica) sem zerar o exército todo.
      Pode reduzir o medo de errar que empurra todos pro Peão (encosta OT-06/S26).

---

# ÁREA B — Resultado, ranqueada & estatísticas
`[S][DB]` — toca a resolução final, persistência do resultado e MMR/estatísticas.

## ✅ S02 — Resultado correto: empate só por regra + `cancelled` + motivos `[S]` 🔴 🅿0 — fecha OT-03
**Define a TAXONOMIA de resultado usada também por S16/S18.**
- [x] `_persistDB` (`server.js:445/453`): remover o catch-all que vira `winnerColor` null em `draw`.
- [x] Taxonomia de motivos: `win`/`loss` · `draw_rule` (Morte Súbita 0×0) · `draw_inactivity` ·
      `cancelled` (AFK pré-jogo — ver §7). Auditar `:916-928`, `:853-880`, `:570-580`.
- [x] Garantir que cada fim de partida grave o motivo certo (nunca `draw` por descuido).

## ✅ S03 — Modo casual/ranked correto no pareamento `[S]` 🔴 🅿0 — fecha OT-18
- [x] `roomMode = p1.match_mode` (`server.js:1222`): usar o modo de **ambos** os jogadores
      (regra explícita — só pareia ranked com ranked, casual com casual).
- [x] Ranqueada sempre computa MMR; nunca cair em casual por descuido de flag.

## ✅ S22 — V/D/E só de ranqueadas válidas `[F][S]` 🟡 🅿1 — fecha OT-19 (depende S03)
- [x] Home, perfil e leaderboard exibem só estatísticas de ranqueadas válidas.

---

# ÁREA C — Inatividade, abandono, desconexão & reconexão
`[S][F]` — sistema de presença/timers/reconexão. Usa a taxonomia de resultado da S02.

## ✅ S16 — Inatividade por fase + abandono manual `[F][S]` 🟡 🅿1 — fecha OT-08 (merge do antigo S15)
**Spec: §7. AFK depende da fase; abandono é o gatilho manual do mesmo fluxo.**
- [x] Detecção por clique: ~50s sem clicar → banner de aviso + countdown.
- [x] **DRAFT/POSITION:** AFK → **CANCELAR partida** (`cancelled`), ambos ao lobby + penalidade
      leve anti-abuso para quem ficou AFK.
- [x] **ACTION+:** AFK → **checagem silenciosa de reconexão** → WO para o ativo (sem popup).
- [x] **Botão ABANDONAR** visível em PvP e Solo (com confirmação): PvP → mesmo fluxo de WO/cancel;
      Solo → volta ao hub. Reusa o plumbing de fim de partida.
- [x] Oponente vê estado adequado ("OPONENTE INATIVO" / aguardando).

## ✅ S10 — Timer de fase visível `[F][S]` 🟡 🅿1 — fecha OT-09 (compartilha countdown; integra J2)
- [x] Mostrar tempo restante em DRAFT/POSITION/ACTION. J2 (urgência <10s) já existe — falta a
      **existência** do contador. Reusa a infra de countdown da S16. Confirmar a fonte do tempo no servidor.
  *(Fonte: timer client-side de inatividade (60s). `#phase-time-left` renderiza o countdown ao lado do `#phase-title`. Fica vermelho nos últimos 10s.)*

## ✅ S17 — Reconexão 90s + token + ciclo mobile `[F][S]` 🟡 🅿1 — fecha OT-21
- [x] Janela de 90s para reconectar (igual para todos); `reconnectToken` em sessionStorage.
- [x] Tratar background do itch no mobile (sair do app/tela apaga → volta sem WO indevido).

## ✅ S18 — Empate por dupla inatividade / cancelamento pré-jogo `[S]` 🟡 🅿1 — usa taxonomia da S02
- [x] **Só no Action+:** ambos inativos → DRAW `draw_inactivity`. **No pré-jogo, dupla AFK = `cancelled`.**
- [x] Um retorna enquanto o outro está pending → resolução conforme S16 (checagem silenciosa).
  *(Implementado como parte de S16 — `decreeWOForInactivity` verifica `pending[oppColor]` antes de decretar WO.)*

---

# ÁREA D — HUD & feedback em partida
`[F]` — elementos visíveis e feedback durante a partida (sem mexer na engine).

## ✅ S11 — Nome do oponente no HUD `[F][S]` 🟡 🅿1 — fecha OT-12
- [x] Enviar nick (e rank, se possível) do oponente nos dados de sala; exibir no HUD da partida.

## ✅ S12 — Feedback "PRONTO / aguardando oponente" `[F]` 🟢 🅿1 — fecha OT-10
- [x] Estado claro: "Você: PRONTO — aguardando oponente" (já implementado via ADJ-JUICE J4).

## ✅ S13 — Aviso de Morte Súbita + tradução `[F]` 🟢 🅿1 — fecha OT-11 (integra J6)
- [x] Aviso/transição antes de entrar na Morte Súbita; traduzir o texto "Sudden Death".

## ✅ S09 — Ícones coloridos de resultado V/D/E `[F]` 🟢 🅿1 — fecha OT-17
- [x] Ícones/cores distintos para vitória, derrota e empate (game over, perfil, histórico).

## ✅ S30 — Finalizar juices `[F]` 🟢 🅿1 — ADJ-JUICE
- [x] Commit + playtest + merge da branch `adj-juice` (A–D já implementados).
- [x] **Decidir J11** (hand-off plano→resolução): implementar ou descartar como redundante.
- [x] **Revisar timing de J7/J8 junto com S31:** Vivi achou lento "depois do dado". Confirmado como
      latência percebida, não o beat em si (OT-25).

---

# ÁREA E — Telas, navegação & menu
`[F]` — telas fora da partida (menu, perfil, ranking, replay, login, config).

## ✅ S19 — Reorg menu + header + logout `[F]` 🟢 🅿1 (Sessão 7)
- [x] Menu: NOVO JOGO / RANKING / CONFIGURAÇÕES. Header: avatar+apelido+rank+W/L (esq) + SAIR (dir).
- [x] COMO JOGAR e CRÉDITOS movidos para Configurações. Popup de confirmação de logout.
  *(Verificado: tudo já implementado em sessões anteriores — sem código novo necessário.)*

## ✅ S21 — Histórico de partidas + viewer de replay `[F]` 🟡 🅿2 — fecha OT-20 (merge do antigo S23, Sessão 9)
- [x] `screen-match-history` (lista separada do perfil); header do replay com resumo (oponente, rank, data, PdL). — já existia.
- [x] **Corrigir o viewer `screen-replay`**: `isDraw` corrigido (draw_rule/draw_inactivity), date parsing Firefox, schema CHECK constraint, turn label i18n.

## ✅ S20 — Tela ranking explicativa `[F]` 🟢 🅿2 (Sessão 8)
- [x] `screen-ranking`: grid dos 14 ranks + explicação do PdL; botão LEADERBOARD GLOBAL. — já existia, verificado.

## ✅ S33 — Quick wins de telas/config `[F]` 🟢 🅿1 (merge S05+S06+S07+S08+S24)
- [x] **Créditos** (OT—/ADJ-A F): "Desenvolvido por / O6 GAMES · Gabriel Mialchi"; remover Portfólio e Itch.
- [x] **Ranked bloqueada p/ convidado** no front (OT-18/ADJ-A A): `#mp-card-ranked` desabilitado.
- [x] **Botão voltar com ícone** (OT-13).
- [x] **ptBR como idioma padrão** (OT-14): manter 9 idiomas, só default inicial.
- [x] **Colar senha no login** (OT-22): verificado — bloqueio é iframe do itch.io, fora do controle do JS.

---

# ÁREA F — Retenção, clareza & balanceamento
`[S][D]` — solo, dificuldade, draft e onboarding. Maior escopo; depois dos bugs.

## ✅ S25 — Suavizar níveis 1–3 do solo `[S]` 🟡 🅿2 — fecha OT-05
- [x] L1 recruta: 1 Peão (1pt), 70% passa. L2 aprendiz: 2 Peões nos cantos, 50% passa. L3 defensor: aleatório ≤3pts.

## ⏳ S26 — Rebalance do draft / valor das peças `[S][D]` 🟡 🅿2 — fecha OT-06
- [ ] Revertido 2026-06-18: promoção volta a P→Q. Dado de 52,7% é especulativo; aguardar confirmação com playtest controlado antes de aplicar fix.

## ✅ S27 — Tutorial scriptado pós-login `[F][S]` 🔴 🅿2 — fecha OT-04
- [x] Trigger automático (1ª partida solo) + botão Configurações ▸ JOGAR TUTORIAL.
- [x] Overlay: backdrop + spotlight box-shadow + card base. Pular sempre visível.
- [x] 10 passos: bônus · território · arrastar · duelo · ordem · vácuo · Rei · promoção · SD · "Você aprendeu!".
- [x] Drag hint: `.tut-drag-pulse` em peças não-Rei do jogador.
- [x] Bot: Level 1 (Recruta), sem mudanças no servidor.
- [x] Bloqueio via patch `_mcSocket.emit`; duel via MutationObserver.

---

# ÁREA G — Identidade visual & design (handoff Claude Design — [[project_design_handoff]])
`[F][D]` — um briefing de design único cobre as três sessões abaixo.

## ✅ S28 — Contorno das peças dark/light `[F][D]` 🟡 🅿1 — fecha OT-15
- [x] `text-shadow` 8-direções (0.7px + 1.4px): brancas contorno `#14100a` + aura laranja; pretas contorno `#f4ead7` + aura índigo. Independente de tema. (`index.html` ~linha 622)

## ✅ S32 — Coesão visual menu ↔ partida `[F][D]` 🟡 🅿2 — fecha OT-26
- [x] `:root` legado aquecido: `--bg #0b0907`, cells marrons, `--accent #ff6a33`. `body` com radial-gradient quente. JS init sempre aplica tema (sem fallback vazio).

## ✅ S29 — Tipografia sem serifa `[F][D]` 🟢 🅿2 — fecha OT-16
- [x] 5 fontes → 2: Inter (texto/títulos, pesos 400-800) + JetBrains Mono (números/labels). Cinzel, Cinzel Decorative e IBM Plex Mono removidos do `<link>` e find-replaced em todo o arquivo.

---

## Backlog (não comprometido — avaliar)
- [ ] OT-23 — Boss a cada 10 níveis no solo (conteúdo).
- [ ] OT-24 — Emojis para provocar amigos (social).

---

## Critério de conclusão por sessão
- [ ] Itens commitados (1 branch/sessão, commits pequenos).
- [ ] `node --check server/server.js` passa; sem regressão.
- [ ] Playtest no loop local (`docs/POS_OPEN_TEST_1_DIRETRIZES.md` §5) antes de subir ao itch.
- [ ] Registrar no `ACTIVITY_LOG.md`; marcar no `CHECKLIST_v1.2.html`.
- [ ] Merge em `main` após validação do Gabriel.
