/* ============================================================
   microChess · 02 - Telas de Partida  (v2)
   Correções: sem phasestrip, duelo compacto, ELO visível, minimalismo
   ============================================================ */

/* Board builder -------------------------------------------------- */
function buildBoard(config) {
  const cells = config.cells;
  let html = '<div class="board">';
  for (let i = 0; i < 16; i++) {
    const x = i % 4, y = Math.floor(i / 4);
    const isDk = (x + y) % 2 === 1;
    const c = cells[i] || {};
    const classes = ['cell', isDk && 'dk', ...(c.classes || [])].filter(Boolean).join(' ');
    let inner = '';
    if (c.piece) inner = `<span class="p ${c.color === 'b' ? 'p-b' : 'p-w'}">${c.piece}</span>`;
    if ((c.classes || []).includes('target')) inner += `<span class="target"></span>`;
    html += `<div class="${classes}">${inner}</div>`;
  }
  html += '</div>';
  return html;
}

/* Scene templates ---------------------------------------------- */
const scenes = [

  // ── MATCHMAKING ─────────────────────────────────────────────
  {
    tag:'mm', num:'01', title:'Matchmaking · buscando', sub:'Radar animado, ELO visível, cancelar',
    render: () => `
    <div class="phone"><div class="app">
      <div style="padding:14px 14px 0">
        <button class="cta ghost" style="margin:0;height:36px;font-size:11px;max-width:120px">← CANCELAR</button>
      </div>
      <div class="mm">
        <div class="radar"><span class="core">♞</span></div>
        <div>
          <div class="status">PROCURANDO OPONENTE</div>
          <h2 style="margin-top:10px">Na fila</h2>
          <div class="sub" style="margin-top:8px">Cavaleiro Aprendiz · ~18s</div>
        </div>
      </div>
    </div></div>`
  },

  {
    tag:'mm', num:'02', title:'Matchmaking · encontrado', sub:'ELO do oponente visível (rank, não número)',
    render: () => `
    <div class="phone"><div class="app">
      <div class="mm">
        <div class="status" style="color:var(--mc-success)">✓ PARTIDA ENCONTRADA</div>
        <div style="display:flex;align-items:center;gap:20px;margin-top:16px">
          <div style="text-align:center">
            <div style="font-size:44px;color:var(--mc-white);text-shadow:0 0 10px var(--mc-aura-w),0 0 20px var(--mc-aura-w)">♘</div>
            <div style="font:600 11px var(--mc-font-mono);letter-spacing:var(--mc-ls-wide);text-transform:uppercase;margin-top:6px">Você</div>
            <div style="font-size:12px;color:var(--mc-muted);margin-top:3px">Cavaleiro Aprendiz</div>
          </div>
          <div class="vs" style="font-size:20px">VS</div>
          <div style="text-align:center">
            <div style="font-size:44px;color:var(--mc-black-p);text-shadow:0 0 10px var(--mc-aura-b),0 0 20px var(--mc-aura-b)">♞</div>
            <div style="font:600 11px var(--mc-font-mono);letter-spacing:var(--mc-ls-wide);text-transform:uppercase;margin-top:6px">sentinela_07</div>
            <div style="font-size:12px;color:var(--mc-muted);margin-top:3px">Cavaleiro Elite</div>
          </div>
        </div>
        <div class="sub" style="margin-top:20px">Ranqueada</div>
      </div>
    </div></div>`
  },

  {
    tag:'mm', num:'03', title:'Matchmaking · countdown', sub:'Contagem final antes do draft',
    render: () => `
    <div class="phone"><div class="app">
      <div class="mm">
        <div class="status">A BATALHA COMEÇA EM</div>
        <div class="countdown">3</div>
        <div class="sub">Prepare sua estratégia</div>
      </div>
    </div></div>`
  },

  // ── DRAFT ────────────────────────────────────────────────────
  {
    tag:'draft', num:'04', title:'Draft · compra inicial', sub:'5 pts disponíveis — sem barra de etapas',
    render: () => `
    <div class="phone"><div class="app">
      <div class="topbar">
        <div class="opp"><span class="dot thinking"></span><div style="min-width:0"><div class="name">sentinela_07</div><div class="meta">montando exército</div></div></div>
        <div class="phase">DRAFT</div>
        <div class="timer">1:47</div>
      </div>
      <div class="stage" style="gap:16px">
        <div class="draft-hdr">
          <span style="font-size:14px;font-weight:600">Monte seu exército</span>
          <span class="budget"><strong>5</strong> pts</span>
        </div>
        <div class="shop">
          <button class="shop-btn"><span class="gl">♕</span><span class="cost">5 pts</span></button>
          <button class="shop-btn"><span class="gl">♖</span><span class="cost">4 pts</span></button>
          <button class="shop-btn"><span class="gl">♘</span><span class="cost">3 pts</span></button>
          <button class="shop-btn"><span class="gl">♗</span><span class="cost">2 pts</span></button>
          <button class="shop-btn"><span class="gl">♙</span><span class="cost">1 pt</span></button>
        </div>
        <!-- Inventário: toque na peça para devolvê-la e recuperar os pontos -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font:500 10px var(--mc-font-mono);letter-spacing:var(--mc-ls-wide);text-transform:uppercase;color:var(--mc-muted)">Inventário · toque para devolver</span>
            <button style="font:500 10px var(--mc-font-mono);letter-spacing:1px;text-transform:uppercase;color:var(--mc-muted);background:transparent;border:none;cursor:pointer;padding:4px 6px">Limpar ✕</button>
          </div>
          <div class="inv"><span class="slot wht">♔</span></div>
        </div>
      </div>
      <button class="cta" disabled>PRONTO</button>
    </div></div>`
  },

  {
    tag:'draft', num:'05', title:'Draft · exército completo', sub:'Toque numa peça do inventário para devolvê-la · Limpar zera tudo',
    render: () => `
    <div class="phone"><div class="app">
      <div class="topbar">
        <div class="opp"><span class="dot thinking"></span><div style="min-width:0"><div class="name">sentinela_07</div><div class="meta">montando exército</div></div></div>
        <div class="phase">DRAFT</div>
        <div class="timer">1:12</div>
      </div>
      <div class="stage" style="gap:16px">
        <div class="draft-hdr">
          <span class="tag success">✓ COMPLETO</span>
          <span class="budget"><strong>0</strong> pts</span>
        </div>
        <div class="shop">
          <button class="shop-btn" disabled><span class="gl">♕</span><span class="cost">5 pts</span></button>
          <button class="shop-btn" disabled><span class="gl">♖</span><span class="cost">4 pts</span></button>
          <button class="shop-btn" disabled><span class="gl">♘</span><span class="cost">3 pts</span></button>
          <button class="shop-btn" disabled><span class="gl">♗</span><span class="cost">2 pts</span></button>
          <button class="shop-btn" disabled><span class="gl">♙</span><span class="cost">1 pt</span></button>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font:500 10px var(--mc-font-mono);letter-spacing:var(--mc-ls-wide);text-transform:uppercase;color:var(--mc-muted)">Inventário · toque para devolver</span>
            <button style="font:500 10px var(--mc-font-mono);letter-spacing:1px;text-transform:uppercase;color:var(--mc-muted);background:transparent;border:none;cursor:pointer;padding:4px 6px">Limpar ✕</button>
          </div>
          <div class="inv"><span class="slot wht">♔</span><span class="slot wht">♘</span><span class="slot wht">♘</span><span class="slot wht">♙</span><span class="slot wht">♙</span><span class="slot wht">♙</span></div>
        </div>
      </div>
      <button class="cta">PRONTO</button>
    </div></div>`
  },

  // ── POSITION ────────────────────────────────────────────────
  {
    tag:'position', num:'06', title:'Posicionamento · arrastando', sub:'Tabuleiro cheio, inventário compacto abaixo',
    render: () => {
      const cells = Array(16).fill().map((_,i)=>{
        const y = Math.floor(i/4);
        return { classes: (y===2||y===3) ? ['own-zone'] : [] };
      });
      cells[12] = { piece:'♔', color:'w', classes:['own-zone'] };
      cells[13] = { piece:'♘', color:'w', classes:['own-zone','hl'] };
      cells[15] = { piece:'♘', color:'w', classes:['own-zone'] };
      cells[8]  = { piece:'♙', color:'w', classes:['own-zone'] };
      cells[10] = { classes:['own-zone','move'] };
      return `
      <div class="phone"><div class="app">
        <div class="topbar">
          <div class="opp"><span class="dot thinking"></span><div style="min-width:0"><div class="name">sentinela_07</div><div class="meta">posicionando</div></div></div>
          <div class="phase">POSIÇÃO</div>
          <div class="timer">1:03</div>
        </div>
        <div class="stage" style="gap:10px">
          ${buildBoard({ cells })}
          <div class="row">
            <div class="inv" style="flex:1;margin:0"><span class="slot wht">♘</span><span class="slot wht">♙</span><span class="slot wht">♙</span></div>
            <button style="flex-shrink:0;background:transparent;border:1px solid var(--mc-rule-strong);color:var(--mc-muted);font:500 10px var(--mc-font-mono);letter-spacing:var(--mc-ls-wide);text-transform:uppercase;padding:8px 10px;border-radius:var(--mc-r-pill);cursor:pointer;white-space:nowrap">↶</button>
          </div>
        </div>
        <button class="cta" disabled>PRONTO</button>
      </div></div>`
    }
  },

  {
    tag:'position', num:'07', title:'Posicionamento · aguardando', sub:'Formação pronta, oponente ainda posicionando',
    render: () => {
      const cells = Array(16).fill().map((_,i)=>{
        const y = Math.floor(i/4);
        return { classes: (y===2||y===3) ? ['own-zone'] : [] };
      });
      cells[12] = { piece:'♔', color:'w', classes:['own-zone'] };
      cells[13] = { piece:'♘', color:'w', classes:['own-zone'] };
      cells[15] = { piece:'♘', color:'w', classes:['own-zone'] };
      cells[8]  = { piece:'♙', color:'w', classes:['own-zone'] };
      cells[9]  = { piece:'♙', color:'w', classes:['own-zone'] };
      cells[11] = { piece:'♙', color:'w', classes:['own-zone'] };
      return `
      <div class="phone"><div class="app">
        <div class="topbar">
          <div class="opp"><span class="dot thinking"></span><div style="min-width:0"><div class="name">sentinela_07</div><div class="meta">ainda posicionando…</div></div></div>
          <div class="phase">POSIÇÃO</div>
          <div class="timer warn">0:24</div>
        </div>
        <div class="stage" style="gap:10px">
          ${buildBoard({ cells })}
        </div>
        <button class="cta waiting">AGUARDANDO</button>
      </div></div>`
    }
  },

  // ── REVEAL ────────────────────────────────────────────────────
  {
    tag:'reveal', num:'08', title:'Revelação · overlay', sub:'Tabuleiro unificado, overlay dramático',
    render: () => {
      const cells = Array(16).fill().map(()=>({}));
      cells[12] = { piece:'♔', color:'w' }; cells[13] = { piece:'♘', color:'w' };
      cells[15] = { piece:'♘', color:'w' }; cells[8]  = { piece:'♙', color:'w' };
      cells[9]  = { piece:'♙', color:'w' }; cells[11] = { piece:'♙', color:'w' };
      cells[0]  = { piece:'♚', color:'b' }; cells[2]  = { piece:'♛', color:'b' };
      cells[5]  = { piece:'♟', color:'b' }; cells[6]  = { piece:'♟', color:'b' };
      cells[7]  = { piece:'♟', color:'b' };
      return `
      <div class="phone"><div class="app">
        <div class="topbar">
          <div class="opp"><span class="dot ready"></span><div style="min-width:0"><div class="name">sentinela_07</div><div class="meta">6 peças</div></div></div>
          <div class="phase">REVEAL!</div>
          <div class="timer">—</div>
        </div>
        <div class="stage" style="gap:10px">
          ${buildBoard({ cells })}
        </div>
        <div class="overlay">
          <div class="label">O tabuleiro à mostra</div>
          <div class="big">REVELAÇÃO!</div>
          <div class="sub">As formações aparecem. A guerra começa.</div>
        </div>
      </div></div>`
    }
  },

  // ── ACTION ────────────────────────────────────────────────────
  {
    tag:'action', num:'09', title:'Ação · peça selecionada', sub:'Destinos válidos destacados no tabuleiro',
    render: () => {
      const cells = Array(16).fill().map(()=>({}));
      cells[12] = { piece:'♔', color:'w' }; cells[13] = { piece:'♘', color:'w', classes:['hl'] };
      cells[15] = { piece:'♘', color:'w' }; cells[8]  = { piece:'♙', color:'w' };
      cells[9]  = { piece:'♙', color:'w' }; cells[11] = { piece:'♙', color:'w' };
      cells[0]  = { piece:'♚', color:'b' };
      cells[2]  = { piece:'♛', color:'b', classes:['move'] };
      cells[5]  = { piece:'♟', color:'b' };
      cells[6]  = { piece:'♟', color:'b', classes:['move'] };
      cells[7]  = { piece:'♟', color:'b' };
      return `
      <div class="phone"><div class="app">
        <div class="topbar">
          <div class="opp"><span class="dot thinking"></span><div style="min-width:0"><div class="name">sentinela_07</div><div class="meta">pensando…</div></div></div>
          <div class="phase">AÇÃO · T3</div>
          <div class="timer">0:38</div>
        </div>
        <div class="stage" style="gap:10px">
          <div class="row"><span style="font-size:13px;font-weight:600">♘ Cavalo</span><span class="sp"></span><span class="tag accent">bônus +2</span></div>
          ${buildBoard({ cells })}
        </div>
        <button class="cta" disabled>SELECIONE UM DESTINO</button>
      </div></div>`
    }
  },

  {
    tag:'action', num:'10', title:'Ação · aguardando', sub:'Jogada selada, oponente ainda decide',
    render: () => {
      const cells = Array(16).fill().map(()=>({}));
      cells[12] = { piece:'♔', color:'w' }; cells[13] = { piece:'♘', color:'w' };
      cells[15] = { piece:'♘', color:'w' }; cells[8]  = { piece:'♙', color:'w' };
      cells[9]  = { piece:'♙', color:'w' }; cells[11] = { piece:'♙', color:'w' };
      cells[0]  = { piece:'♚', color:'b' };
      cells[2]  = { piece:'♛', color:'b', classes:['last'] };
      cells[5]  = { piece:'♟', color:'b' }; cells[6]  = { piece:'♟', color:'b' };
      cells[7]  = { piece:'♟', color:'b' };
      return `
      <div class="phone"><div class="app">
        <div class="topbar">
          <div class="opp"><span class="dot thinking"></span><div style="min-width:0"><div class="name">sentinela_07</div><div class="meta">pensando…</div></div></div>
          <div class="phase">AÇÃO · T3</div>
          <div class="timer warn">0:11</div>
        </div>
        <div class="stage" style="gap:10px">
          <div class="row">
            <span style="font-size:13px;font-weight:600">Jogada selada</span>
            <span class="sp"></span>
            <span class="tag accent">♘ → c1</span>
          </div>
          ${buildBoard({ cells })}
        </div>
        <button class="cta waiting">AGUARDANDO</button>
      </div></div>`
    }
  },

  // ── DUEL ────────────────────────────────────────────────────
  {
    tag:'duel', num:'11', title:'Duelo · role seu dado', sub:'Dois cards horizontais, botão abaixo livre',
    render: () => `
    <div class="phone"><div class="app">
      <div class="topbar">
        <div class="opp"><span class="dot ready"></span><div style="min-width:0"><div class="name">sentinela_07</div><div class="meta">aguardando</div></div></div>
        <div class="phase" style="background:var(--mc-danger-soft);color:var(--mc-danger)">⚔ DUELO</div>
        <div class="timer">—</div>
      </div>
      <div class="stage" style="justify-content:center;gap:16px">
        <div style="font:500 11px var(--mc-font-mono);letter-spacing:var(--mc-ls-wide);text-transform:uppercase;color:var(--mc-muted);text-align:center">Casa c1</div>
        <div style="display:flex;gap:10px;align-items:stretch">
          <div class="duel-face you" style="flex:1">
            <div class="who">Você</div>
            <div class="piece w">♘</div>
            <div class="bonus">bônus +2</div>
            <div class="roll tap" style="width:52px;height:52px;font-size:12px;font-family:var(--mc-font-mono);letter-spacing:0.05em">ROLAR</div>
          </div>
          <div style="display:flex;align-items:center;padding:0 4px">
            <span class="vs">VS</span>
          </div>
          <div class="duel-face" style="flex:1">
            <div class="who">Oponente</div>
            <div class="piece b">♛</div>
            <div class="bonus">bônus +4</div>
            <div class="roll" style="width:52px;height:52px"><span class="wait" style="font-size:10px">…</span></div>
          </div>
        </div>
      </div>
      <button class="cta" disabled>ROLE O DADO</button>
    </div></div>`
  },

  {
    tag:'duel', num:'12', title:'Duelo · resolvido', sub:'Resultado final — vencedor e perdedor',
    render: () => `
    <div class="phone"><div class="app">
      <div class="topbar">
        <div class="opp"><span class="dot ready"></span><div style="min-width:0"><div class="name">sentinela_07</div><div class="meta">resolvido</div></div></div>
        <div class="phase" style="background:var(--mc-success-soft);color:var(--mc-success)">✓ VOCÊ VENCE</div>
        <div class="timer">—</div>
      </div>
      <div class="stage" style="justify-content:center;gap:16px">
        <div style="font:500 11px var(--mc-font-mono);letter-spacing:var(--mc-ls-wide);text-transform:uppercase;color:var(--mc-muted);text-align:center">Resultado · Casa c1</div>
        <div style="display:flex;gap:10px;align-items:stretch">
          <div class="duel-face you winner" style="flex:1">
            <div class="who">Você</div>
            <div class="piece w">♘</div>
            <div class="bonus">dado 5 + bônus 2</div>
            <div class="total">= 7</div>
          </div>
          <div style="display:flex;align-items:center;padding:0 4px">
            <span class="vs">VS</span>
          </div>
          <div class="duel-face loser" style="flex:1">
            <div class="who">Oponente</div>
            <div class="piece b" style="opacity:0.45">♛</div>
            <div class="bonus">dado 2 + bônus 4</div>
            <div class="total">= 6</div>
          </div>
        </div>
      </div>
      <button class="cta">RESOLVER JOGADA</button>
    </div></div>`
  },

  // ── GAMEOVER ────────────────────────────────────────────────
  {
    tag:'over', num:'13', title:'Vitória', sub:'PdL ganho, ELO visível (rank, não número)',
    render: () => `
    <div class="phone"><div class="app">
      <div class="gameover">
        <div style="font-size:80px;color:var(--mc-white);text-shadow:0 0 24px var(--mc-aura-w),0 0 48px var(--mc-aura-w)">♔</div>
        <div>
          <div class="verdict">Fim de jogo</div>
          <h2 class="win">Você venceu!</h2>
        </div>
        <div class="mmr">
          <span class="delta up">+18 PdL</span>
          <span class="now">Cavaleiro Elite</span>
        </div>
        <div class="actions">
          <button class="cta ghost">MENU</button>
          <button class="cta">JOGAR NOVAMENTE</button>
        </div>
      </div>
    </div></div>`
  },

  {
    tag:'over', num:'14', title:'Derrota · escudo ativo', sub:'PdL protegido, rank mantido',
    render: () => `
    <div class="phone"><div class="app">
      <div class="gameover">
        <div style="font-size:80px;color:var(--mc-black-p);text-shadow:0 0 24px var(--mc-aura-b),0 0 48px var(--mc-aura-b);opacity:0.55">♚</div>
        <div>
          <div class="verdict">Fim de jogo</div>
          <h2 class="lose">Você perdeu</h2>
        </div>
        <div class="mmr" style="border-color:var(--mc-accent)">
          <span class="delta" style="color:var(--mc-accent)">🛡 ESCUDO ×2</span>
          <span class="now">Cavaleiro Aprendiz</span>
        </div>
        <div class="actions">
          <button class="cta ghost">MENU</button>
          <button class="cta">JOGAR NOVAMENTE</button>
        </div>
      </div>
    </div></div>`
  },

  {
    tag:'over', num:'15', title:'Empate · Morte Súbita', sub:'Duelo dos Reis resultou em 0 — ambos removidos',
    render: () => `
    <div class="phone"><div class="app">
      <div class="gameover">
        <div style="font-size:60px;display:flex;gap:8px;justify-content:center">
          <span style="color:var(--mc-white);text-shadow:0 0 20px var(--mc-aura-w)">♔</span>
          <span style="color:var(--mc-black-p);text-shadow:0 0 20px var(--mc-aura-b)">♚</span>
        </div>
        <div>
          <div class="verdict">Fim de jogo</div>
          <h2 style="font-size:36px;font-weight:800;letter-spacing:var(--mc-ls-tight)">Empate</h2>
        </div>
        <div style="font-size:12px;color:var(--mc-muted);max-width:220px;text-align:center;line-height:1.5">Morte Súbita · ambos os Reis foram eliminados no mesmo duelo.</div>
        <div class="mmr" style="border-color:var(--mc-rule-strong)">
          <span class="delta" style="color:var(--mc-muted)">= 0 PdL</span>
          <span class="now">Cavaleiro Aprendiz</span>
        </div>
        <div class="actions">
          <button class="cta ghost">MENU</button>
          <button class="cta">JOGAR NOVAMENTE</button>
        </div>
      </div>
    </div></div>`
  },
];

/* Render --------------------------------------------------------- */
const grid = document.getElementById('grid');
scenes.forEach(s => {
  const el = document.createElement('div');
  el.className = 'scene';
  el.dataset.tag = s.tag;
  el.innerHTML = `
    <div class="scene-head"><span class="num">${s.num}</span><h3>${s.title}</h3></div>
    <div class="scene-body">${s.render()}</div>
    <div class="scene-note">${s.sub}</div>
  `;
  grid.appendChild(el);
});
