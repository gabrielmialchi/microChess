# SP_TERMS — Terminologia i18n do Single Player

> Output da sessão **SP-1.1**. Fonte de verdade para as chaves i18n usadas em SP-4.2, SP-5.3, SP-6.5, SP-7.4 e demais sessões SP.
>
> Inserir no `html/index.html` em **todos os 9 blocos `T.{pt,en,es,de,it,ru,ja,ko,zh}`** simultaneamente — nunca deixar idioma faltando.
>
> Os 15 nomes de fase (`sp_lvl1_name` ... `sp_lvl15_name`) são produzidos em **SP-7.4** e ficam fora deste arquivo.

---

## 1. Lista de chaves (categorizadas)

| Chave | Onde aparece | Tipo |
|---|---|---|
| `sp_solo` | Card SOLO em `#screen-game-mode` | Botão (≤8 chars) |
| `sp_online` | Card ONLINE em `#screen-game-mode` | Botão (≤8 chars) |
| `sp_solo_desc` | Subtítulo do card SOLO | Frase curta |
| `sp_online_desc` | Subtítulo do card ONLINE | Frase curta |
| `sp_continue` | Card CONTINUAR em `#screen-solo-hub` | Botão |
| `sp_new` | Card NOVO em `#screen-solo-hub` | Botão (≤6 chars) |
| `sp_continue_desc` | Subtítulo do card CONTINUAR | Frase curta |
| `sp_new_desc` | Subtítulo do card NOVO | Frase curta |
| `sp_phase` | Palavra "Fase" para concatenação ("Fase 7") | Substantivo |
| `sp_completed_all` | Hub Solo quando `max_level_completed === 15` | Frase |
| `sp_map_title` | Cabeçalho de `#screen-sp-map` | Título |
| `sp_locked` | Tooltip/aria de cards bloqueados | Estado |
| `sp_completed` | Tooltip/aria de cards concluídos | Estado |
| `sp_current` | Tooltip/aria do card atual | Estado |
| `sp_play` | Botão "JOGAR" no modal de iniciar fase | Botão |
| `sp_back_to_map` | Botão na game-over solo | Botão |
| `sp_victory` | Game over solo (vitória) | Título |
| `sp_defeat` | Game over solo (derrota) | Título |
| `sp_next_level` | Game over solo após vitória | Botão |
| `sp_retry` | Game over solo após derrota | Botão |
| `sp_phase_unlocked` | Toast pós-vitória; usa placeholder `{N}` | Frase com placeholder |
| `sp_new_confirm_logged` | Modal de confirmação NOVO (usuário logado) | Frase |
| `sp_new_confirm_guest` | Modal de confirmação NOVO (convidado) | Frase |

**Total:** 23 chaves. Os 15 nomes de fase entram em SP-7.4.

---

## 2. Traduções

### `sp_solo`
| pt | en | es | de | it | ru | ja | ko | zh |
|---|---|---|---|---|---|---|---|---|
| SOLO | SOLO | SOLO | SOLO | SOLO | СОЛО | ソロ | 솔로 | 单人 |

### `sp_online`
| pt | en | es | de | it | ru | ja | ko | zh |
|---|---|---|---|---|---|---|---|---|
| ONLINE | ONLINE | ONLINE | ONLINE | ONLINE | ОНЛАЙН | オンライン | 온라인 | 在线 |

### `sp_solo_desc`
| pt | en | es | de | it | ru | ja | ko | zh |
|---|---|---|---|---|---|---|---|---|
| 15 fases contra a CPU | 15 stages vs CPU | 15 fases contra la CPU | 15 Stufen gegen die CPU | 15 livelli contro la CPU | 15 уровней против ИИ | CPUと15ステージ | CPU와 15단계 | 15 关对战 CPU |

### `sp_online_desc`
| pt | en | es | de | it | ru | ja | ko | zh |
|---|---|---|---|---|---|---|---|---|
| Jogadores reais online | Real players online | Jugadores reales online | Echte Spieler online | Giocatori reali online | Игроки в реальном времени | オンライン対戦 | 실시간 온라인 대전 | 真人在线对战 |

### `sp_continue`
| pt | en | es | de | it | ru | ja | ko | zh |
|---|---|---|---|---|---|---|---|---|
| CONTINUAR | CONTINUE | CONTINUAR | WEITER | CONTINUA | ПРОДОЛЖИТЬ | 続ける | 계속하기 | 继续 |

### `sp_new`
| pt | en | es | de | it | ru | ja | ko | zh |
|---|---|---|---|---|---|---|---|---|
| NOVO | NEW | NUEVO | NEU | NUOVO | НОВОЕ | 新規 | 새로 | 新的 |

### `sp_continue_desc`
| pt | en | es | de | it | ru | ja | ko | zh |
|---|---|---|---|---|---|---|---|---|
| Retomar de onde parou | Resume where you left off | Reanudar donde lo dejaste | Da weitermachen, wo du aufgehört hast | Riprendi da dove eri rimasto | Продолжить с места остановки | 続きから再開 | 이어서 계속하기 | 从中断处继续 |

### `sp_new_desc`
| pt | en | es | de | it | ru | ja | ko | zh |
|---|---|---|---|---|---|---|---|---|
| Começar do início (Fase 1) | Start from scratch (Stage 1) | Empezar desde el principio (Fase 1) | Von vorne beginnen (Stufe 1) | Inizia da capo (Livello 1) | Начать с начала (Уровень 1) | 最初から始める (ステージ1) | 처음부터 시작 (1단계) | 从头开始（第 1 关） |

### `sp_phase`
| pt | en | es | de | it | ru | ja | ko | zh |
|---|---|---|---|---|---|---|---|---|
| Fase | Stage | Fase | Stufe | Livello | Уровень | ステージ | 단계 | 关 |

### `sp_completed_all`
| pt | en | es | de | it | ru | ja | ko | zh |
|---|---|---|---|---|---|---|---|---|
| Todas as fases completas | All stages complete | Todas las fases completas | Alle Stufen abgeschlossen | Tutti i livelli completati | Все уровни пройдены | 全ステージクリア | 모든 단계 완료 | 全部关卡完成 |

### `sp_map_title`
| pt | en | es | de | it | ru | ja | ko | zh |
|---|---|---|---|---|---|---|---|---|
| MAPA SOLO | SOLO MAP | MAPA SOLO | SOLO-KARTE | MAPPA SOLO | КАРТА СОЛО | ソロマップ | 솔로 지도 | 单人地图 |

### `sp_locked`
| pt | en | es | de | it | ru | ja | ko | zh |
|---|---|---|---|---|---|---|---|---|
| Bloqueada | Locked | Bloqueada | Gesperrt | Bloccato | Заблокировано | 未開放 | 잠김 | 锁定 |

### `sp_completed`
| pt | en | es | de | it | ru | ja | ko | zh |
|---|---|---|---|---|---|---|---|---|
| Concluída | Completed | Completada | Abgeschlossen | Completato | Пройдено | クリア済み | 완료 | 已完成 |

### `sp_current`
| pt | en | es | de | it | ru | ja | ko | zh |
|---|---|---|---|---|---|---|---|---|
| Atual | Current | Actual | Aktuell | Attuale | Текущее | 現在 | 현재 | 当前 |

### `sp_play`
| pt | en | es | de | it | ru | ja | ko | zh |
|---|---|---|---|---|---|---|---|---|
| JOGAR | PLAY | JUGAR | SPIELEN | GIOCA | ИГРАТЬ | プレイ | 플레이 | 开始 |

### `sp_back_to_map`
| pt | en | es | de | it | ru | ja | ko | zh |
|---|---|---|---|---|---|---|---|---|
| Voltar ao Mapa | Back to Map | Volver al Mapa | Zurück zur Karte | Torna alla Mappa | К карте | マップへ戻る | 지도로 돌아가기 | 返回地图 |

### `sp_victory`
| pt | en | es | de | it | ru | ja | ko | zh |
|---|---|---|---|---|---|---|---|---|
| VITÓRIA | VICTORY | VICTORIA | SIEG | VITTORIA | ПОБЕДА | 勝利 | 승리 | 胜利 |

### `sp_defeat`
| pt | en | es | de | it | ru | ja | ko | zh |
|---|---|---|---|---|---|---|---|---|
| DERROTA | DEFEAT | DERROTA | NIEDERLAGE | SCONFITTA | ПОРАЖЕНИЕ | 敗北 | 패배 | 失败 |

### `sp_next_level`
| pt | en | es | de | it | ru | ja | ko | zh |
|---|---|---|---|---|---|---|---|---|
| PRÓXIMA FASE | NEXT STAGE | PRÓXIMA FASE | NÄCHSTE STUFE | PROSSIMO LIVELLO | СЛЕДУЮЩИЙ УРОВЕНЬ | 次のステージ | 다음 단계 | 下一关 |

### `sp_retry`
| pt | en | es | de | it | ru | ja | ko | zh |
|---|---|---|---|---|---|---|---|---|
| TENTAR DE NOVO | TRY AGAIN | REINTENTAR | WIEDERHOLEN | RIPROVA | ЗАНОВО | 再挑戦 | 다시 시도 | 重试 |

### `sp_phase_unlocked` (usa `{N}` como placeholder do número da fase)
| pt | en | es | de | it | ru | ja | ko | zh |
|---|---|---|---|---|---|---|---|---|
| Fase {N} desbloqueada | Stage {N} unlocked | Fase {N} desbloqueada | Stufe {N} freigeschaltet | Livello {N} sbloccato | Уровень {N} открыт | ステージ{N}解放 | {N}단계 잠금 해제 | 第 {N} 关已解锁 |

### `sp_new_confirm_logged` (frase de modal)
| pt | en | es | de | it | ru | ja | ko | zh |
|---|---|---|---|---|---|---|---|---|
| Reiniciar zera seu progresso permanentemente. Confirmar? | Restarting will permanently reset your progress. Confirm? | Reiniciar borrará tu progreso permanentemente. ¿Confirmar? | Neustart setzt deinen Fortschritt dauerhaft zurück. Bestätigen? | Riavviare azzererà i tuoi progressi in modo permanente. Confermare? | Перезапуск навсегда сбросит ваш прогресс. Подтвердить? | リスタートすると進行状況が完全にリセットされます。続行しますか？ | 다시 시작하면 진행 상황이 영구적으로 초기화됩니다. 확인하시겠습니까? | 重新开始将永久重置你的进度。确认吗？ |

### `sp_new_confirm_guest` (frase de modal)
| pt | en | es | de | it | ru | ja | ko | zh |
|---|---|---|---|---|---|---|---|---|
| Começar nova jornada Solo a partir da Fase 1? | Start a new Solo journey from Stage 1? | ¿Comenzar una nueva travesía Solo desde la Fase 1? | Neue Solo-Reise ab Stufe 1 beginnen? | Iniziare un nuovo viaggio Solo dal Livello 1? | Начать новое одиночное путешествие с Уровня 1? | ステージ1からソロを始めますか？ | 1단계부터 솔로를 시작하시겠습니까? | 从第 1 关开始新的单人之旅？ |

---

## 3. Validação de comprimento (PT / EN — limites apertados)

| Chave | PT (chars) | EN (chars) | Limite | Status |
|---|---|---|---|---|
| `sp_solo` | SOLO (4) | SOLO (4) | 8 | ✅ |
| `sp_online` | ONLINE (6) | ONLINE (6) | 8 | ✅ |
| `sp_continue` | CONTINUAR (9) | CONTINUE (8) | 14 | ✅ |
| `sp_new` | NOVO (4) | NEW (3) | 6 | ✅ |
| `sp_play` | JOGAR (5) | PLAY (4) | 8 | ✅ |
| `sp_phase` | Fase (4) | Stage (5) | 12 | ✅ |
| `sp_victory` | VITÓRIA (7) | VICTORY (7) | 14 | ✅ |
| `sp_defeat` | DERROTA (7) | DEFEAT (6) | 14 | ✅ |
| `sp_next_level` | PRÓXIMA FASE (12) | NEXT STAGE (10) | 14 | ✅ |
| `sp_retry` | TENTAR DE NOVO (14) | TRY AGAIN (9) | 14 | ✅ |
| `sp_back_to_map` | Voltar ao Mapa (14) | Back to Map (11) | 14 | ✅ |
| `sp_map_title` | MAPA SOLO (9) | SOLO MAP (8) | 14 | ✅ |

Demais chaves são frases descritivas e não têm limite estrito (cabem em qualquer tela porque quebram em duas linhas).

---

## 4. Snippet pronto para inserir em SP-4.2 / SP-5.3 / SP-6.5 / SP-7.4

Bloco a copiar dentro de cada `T.{lang}` em `html/index.html` (~linha 2960+). Linguagem PT como referência:

```js
// Single Player keys (SP)
sp_solo:'SOLO', sp_online:'ONLINE',
sp_solo_desc:'15 fases contra a CPU', sp_online_desc:'Jogadores reais online',
sp_continue:'CONTINUAR', sp_new:'NOVO',
sp_continue_desc:'Retomar de onde parou', sp_new_desc:'Começar do início (Fase 1)',
sp_phase:'Fase', sp_completed_all:'Todas as fases completas',
sp_map_title:'MAPA SOLO',
sp_locked:'Bloqueada', sp_completed:'Concluída', sp_current:'Atual',
sp_play:'JOGAR', sp_back_to_map:'Voltar ao Mapa',
sp_victory:'VITÓRIA', sp_defeat:'DERROTA',
sp_next_level:'PRÓXIMA FASE', sp_retry:'TENTAR DE NOVO',
sp_phase_unlocked:'Fase {N} desbloqueada',
sp_new_confirm_logged:'Reiniciar zera seu progresso permanentemente. Confirmar?',
sp_new_confirm_guest:'Começar nova jornada Solo a partir da Fase 1?',
```

Cada bloco T.{lang} usa as traduções da tabela §2.

---

## 5. Notas para sessões dependentes

- **SP-4.2** usa: `sp_solo`, `sp_online`, `sp_solo_desc`, `sp_online_desc`
- **SP-5.3** **não cria chaves novas** — reaproveita `mode_casual`, `mode_ranked`, `mode_find_match` que já existem (PRE-OT-B)
- **SP-6.5** usa: `sp_continue`, `sp_new`, `sp_continue_desc`, `sp_new_desc`, `sp_phase`, `sp_completed_all`, `sp_new_confirm_logged`, `sp_new_confirm_guest`
- **SP-7.4** usa: `sp_map_title`, `sp_locked`, `sp_completed`, `sp_current`, `sp_play` + cria as 15 chaves `sp_lvlN_name`
- **SP-8.1** usa: `sp_victory`, `sp_defeat`, `sp_next_level`, `sp_retry`, `sp_back_to_map`
- **SP-7.5** usa: `sp_phase_unlocked` (substituir `{N}` no client antes de exibir)
