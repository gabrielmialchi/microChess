'use strict';

// ── SESSION ───────────────────────────────────────────────────
const Session = (() => {
    const KEY = 'mc_session';
    return {
        save(data) { localStorage.setItem(KEY, JSON.stringify(data)); },
        get() {
            try { return JSON.parse(localStorage.getItem(KEY)) || null; }
            catch { return null; }
        },
        clear() { localStorage.removeItem(KEY); },
        isValid() { const s = this.get(); return !!(s && s.token && s.id); },
    };
})();

// ── MENU POPULATOR ────────────────────────────────────────────
const PIECE_MAP = { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙' };

const MenuPopulator = {
    async populate(session) {
        const el = id => document.getElementById(id);
        if (el('menu-player-name')) el('menu-player-name').textContent = session.username || 'Guerreiro';
        if (el('menu-avatar-icon')) el('menu-avatar-icon').textContent = PIECE_MAP[session.avatar || 'K'];
        if (el('nick-input'))       el('nick-input').value             = session.username || '';

        const rank = session.rank || { name: 'Cavaleiro', icon: '♞' };
        if (el('menu-rank-badge'))
            el('menu-rank-badge').textContent = `${rank.icon} ${rank.name} · ${session.mmr || 1500} MMR`;

        localStorage.setItem('mc_uid',      session.id || '');
        localStorage.setItem('mc_nickname', session.username || 'Guerreiro');

        try {
            const res = await fetch(`/player/${session.id}`);
            if (!res.ok) return;
            const p = await res.json();
            if (el('menu-stat-w'))  el('menu-stat-w').textContent  = p.wins || 0;
            if (el('menu-stat-l'))  el('menu-stat-l').textContent  = p.losses || 0;
            if (el('stat-wins'))    el('stat-wins').textContent    = p.wins || 0;
            if (el('stat-losses'))  el('stat-losses').textContent  = p.losses || 0;
            if (el('stat-wo-w'))    el('stat-wo-w').textContent    = p.wo_against || 0;
            if (el('stat-wo-l'))    el('stat-wo-l').textContent    = p.wo_count || 0;
            // ELO badge (uses visible Liga rank, not hidden MMR)
            if (p.elo && el('menu-rank-badge'))
                el('menu-rank-badge').textContent = `${p.elo.icon} ${p.elo.name} · ${p.elo.lp} PdL`;
            localStorage.setItem('mc_stats', JSON.stringify({
                wins: p.wins, losses: p.losses,
                wo_wins: p.wo_against, wo_losses: p.wo_count,
            }));
        } catch {}
    },
};

// ── AUTH UI ───────────────────────────────────────────────────
const AuthUI = {
    show() {
        const o = document.getElementById('auth-overlay');
        if (o) o.style.display = 'flex';
        this.toggle('login');
    },

    hide() {
        const o = document.getElementById('auth-overlay');
        if (o) o.style.display = 'none';
    },

    toggle(mode) {
        document.getElementById('auth-form-login').style.display    = mode === 'login'    ? 'flex' : 'none';
        document.getElementById('auth-form-register').style.display = mode === 'register' ? 'flex' : 'none';
        document.getElementById('auth-error').textContent = '';
    },

    async handleSubmit(mode) {
        const err = document.getElementById('auth-error');
        err.textContent = '';
        let url, body;

        if (mode === 'register') {
            const username = document.getElementById('reg-username').value.trim();
            const email    = document.getElementById('reg-email').value.trim();
            const password = document.getElementById('reg-password').value;
            if (!username || !email || !password) { err.textContent = 'Preencha todos os campos.'; return; }
            url  = '/auth/register';
            body = { username, email, password };
        } else {
            const email    = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;
            if (!email || !password) { err.textContent = 'Preencha todos os campos.'; return; }
            url  = '/auth/login';
            body = { email, password };
        }

        try {
            const res  = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) { err.textContent = data.error || 'Erro desconhecido.'; return; }

            const session = {
                token:    data.token,
                id:       data.id,
                username: data.username,
                mmr:      data.mmr || 1500,
                rank:     data.rank || { name: 'Cavaleiro', icon: '♞' },
                avatar:   localStorage.getItem('mc_avatar') || 'K',
            };
            Session.save(session);
            this.hide();
            await MenuPopulator.populate(session);
        } catch {
            err.textContent = 'Erro de conexão com o servidor.';
        }
    },

    playAsGuest() { this.hide(); },
};

// ── LOGOUT ────────────────────────────────────────────────────
window.confirmLogout = function () {
    const m = document.getElementById('logout-confirm');
    if (m) m.style.display = 'flex';
};

window.hideLogoutConfirm = function () {
    const m = document.getElementById('logout-confirm');
    if (m) m.style.display = 'none';
};

window.doLogout = function () {
    window.hideLogoutConfirm();
    Session.clear();
    localStorage.removeItem('mc_uid');
    localStorage.removeItem('mc_nickname');
    localStorage.removeItem('mc_stats');
    const badge = document.getElementById('menu-rank-badge');
    if (badge) badge.textContent = 'RANK —';
    const name = document.getElementById('menu-player-name');
    if (name) name.textContent = 'Guerreiro';
    const statW = document.getElementById('menu-stat-w');
    const statL = document.getElementById('menu-stat-l');
    if (statW) statW.textContent = '0';
    if (statL) statL.textContent = '0';
    AuthUI.show();
};

// ── ACCOUNT DELETION ─────────────────────────────────────────
window.confirmDeleteAccount = function () {
    const m = document.getElementById('delete-account-confirm');
    if (m) m.style.display = 'flex';
};

window.hideDeleteConfirm = function () {
    const m = document.getElementById('delete-account-confirm');
    if (m) m.style.display = 'none';
};

window.doDeleteAccount = async function () {
    const btn = document.getElementById('btn-delete-confirm');
    if (btn) { btn.textContent = '...'; btn.disabled = true; }
    const session = Session.get();
    if (!session?.token) { window.hideDeleteConfirm(); AuthUI.show(); return; }
    try {
        const res = await fetch('/auth/account', {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + session.token },
        });
        if (!res.ok) {
            if (btn) { btn.textContent = 'EXCLUIR'; btn.disabled = false; }
            return;
        }
    } catch {
        if (btn) { btn.textContent = 'EXCLUIR'; btn.disabled = false; }
        return;
    }
    window.hideDeleteConfirm();
    Session.clear();
    localStorage.removeItem('mc_uid');
    localStorage.removeItem('mc_nickname');
    localStorage.removeItem('mc_stats');
    AuthUI.show();
};

// ── CHANGE PASSWORD ───────────────────────────────────────────
window.showChangePassword = function () {
    const m = document.getElementById('change-password-modal');
    if (m) {
        m.style.display = 'flex';
        ['cp-current', 'cp-new', 'cp-confirm'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        const err = document.getElementById('cp-error');
        if (err) err.textContent = '';
    }
};

window.hideChangePassword = function () {
    const m = document.getElementById('change-password-modal');
    if (m) m.style.display = 'none';
};

window.doChangePassword = async function () {
    const err = document.getElementById('cp-error');
    if (err) err.textContent = '';
    const current  = document.getElementById('cp-current')?.value  || '';
    const newPwd   = document.getElementById('cp-new')?.value      || '';
    const confirm  = document.getElementById('cp-confirm')?.value  || '';
    if (!current || !newPwd || !confirm) {
        if (err) err.textContent = 'Preencha todos os campos.';
        return;
    }
    if (newPwd !== confirm) {
        if (err) err.textContent = 'As senhas não coincidem.';
        return;
    }
    const btn = document.getElementById('btn-cp-confirm');
    if (btn) { btn.textContent = '...'; btn.disabled = true; }
    const session = Session.get();
    if (!session?.token) { window.hideChangePassword(); AuthUI.show(); return; }
    try {
        const res = await fetch('/auth/password', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.token },
            body: JSON.stringify({ currentPassword: current, newPassword: newPwd }),
        });
        const data = await res.json();
        if (!res.ok) {
            if (err) err.textContent = data.error || 'Erro ao alterar senha.';
            if (btn) { btn.textContent = 'SALVAR'; btn.disabled = false; }
            return;
        }
        // Server invalidated old token — save new one so session stays valid
        if (data.token) {
            const session = Session.get();
            if (session) Session.save({ ...session, token: data.token });
        }
    } catch {
        if (err) err.textContent = 'Erro de conexão.';
        if (btn) { btn.textContent = 'SALVAR'; btn.disabled = false; }
        return;
    }
    window.hideChangePassword();
    if (btn) { btn.textContent = 'SALVAR'; btn.disabled = false; }
};

// ── BAN OVERLAY ───────────────────────────────────────────────
const BanOverlay = {
    _timer: null,

    show({ until, remainMs }) {
        const overlay = document.getElementById('ban-overlay');
        if (overlay) overlay.style.display = 'flex';
        const btn = document.getElementById('btn-novo-jogo');
        if (btn) btn.disabled = true;

        const countEl  = document.getElementById('ban-countdown');
        let remaining  = Math.max(0, remainMs);

        const tick = () => {
            const h = Math.floor(remaining / 3_600_000);
            const m = Math.floor((remaining % 3_600_000) / 60_000);
            const s = Math.floor((remaining % 60_000) / 1_000);
            if (countEl)
                countEl.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
            if (remaining <= 0) { clearInterval(this._timer); this.hide(); }
            remaining -= 1_000;
        };
        tick();
        this._timer = setInterval(tick, 1_000);
    },

    hide() {
        const overlay = document.getElementById('ban-overlay');
        if (overlay) overlay.style.display = 'none';
        const btn = document.getElementById('btn-novo-jogo');
        if (btn) btn.disabled = false;
        if (this._timer) { clearInterval(this._timer); this._timer = null; }
    },
};

// ── MMR / LP TOAST ────────────────────────────────────────────
function showMMRToast(delta, isWO, lpDelta, elo, promoted, demoted) {
    if (!document.getElementById('_mmr-toast-css')) {
        const st = document.createElement('style');
        st.id = '_mmr-toast-css';
        st.textContent = '@keyframes _mmrFade{0%{opacity:1;transform:translateX(-50%) translateY(0)}80%{opacity:1}100%{opacity:0;transform:translateX(-50%) translateY(-24px)}}';
        document.head.appendChild(st);
    }
    let text, positive;
    if (promoted) {
        text = `↑ PROMOÇÃO — ${elo?.icon || ''} ${elo?.name || ''}`;
        positive = true;
    } else if (demoted) {
        text = `↓ REBAIXAMENTO — ${elo?.icon || ''} ${elo?.name || ''}`;
        positive = false;
    } else if (elo && lpDelta != null) {
        const sign = lpDelta >= 0 ? '+' : '';
        text = isWO ? `W.O. — ${sign}${lpDelta} PdL` : `${sign}${lpDelta} PdL`;
        positive = lpDelta >= 0;
    } else {
        const sign = delta >= 0 ? '+' : '';
        text = isWO ? `W.O. — ${sign}${delta} MMR` : `${sign}${delta} MMR`;
        positive = delta >= 0;
    }
    const toast = document.createElement('div');
    toast.textContent = text;
    toast.style.cssText = [
        'position:fixed', 'bottom:80px', 'left:50%', 'transform:translateX(-50%)',
        `background:${positive ? '#2ecc71' : '#e74c3c'}`,
        'color:#fff', "font-family:'Cinzel',serif", 'font-size:14px', 'font-weight:700',
        'padding:10px 24px', 'border-radius:4px', 'z-index:9998',
        'box-shadow:0 4px 16px rgba(0,0,0,0.5)',
        'animation:_mmrFade 2.5s forwards',
    ].join(';');
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2_500);
}

// ── QUEUE PROFILE INJECTOR ────────────────────────────────────
function getQueueProfile(base) {
    const session = Session.get();
    if (session && session.token)
        return { ...base, token: session.token, mmr: session.mmr, uid: session.id };
    return base;
}

// ── RECONNECT ─────────────────────────────────────────────────
const ReconnectOverlay = {
    _timer: null,

    show(remainMs) {
        const overlay = document.getElementById('reconnect-overlay');
        if (overlay) overlay.style.display = 'flex';
        const countEl = document.getElementById('reconnect-countdown');
        let remaining = Math.max(0, remainMs);
        const tick = () => {
            const secs = Math.ceil(remaining / 1_000);
            if (countEl) countEl.textContent = secs;
            if (remaining <= 0) { clearInterval(this._timer); }
            remaining -= 1_000;
        };
        tick();
        this._timer = setInterval(tick, 1_000);
    },

    hide() {
        const overlay = document.getElementById('reconnect-overlay');
        if (overlay) overlay.style.display = 'none';
        if (this._timer) { clearInterval(this._timer); this._timer = null; }
    },
};

function tryRejoinIfPending(socket) {
    const session = Session.get();
    if (!session?.token) return;
    socket.emit('rejoin_game', { token: session.token });
}

// ── DISCONNECT BANNER ─────────────────────────────────────────
function showDisconnectBanner() {
    if (document.getElementById('_dc-banner')) return;
    const b = document.createElement('div');
    b.id = '_dc-banner';
    b.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#e74c3c;color:#fff;text-align:center;padding:8px;font-family:Cinzel,serif;font-size:12px;z-index:99999;letter-spacing:2px;';
    b.textContent = 'SEM CONEXÃO COM O SERVIDOR';
    document.body.prepend(b);
}

// ── SOCKET GAME EVENTS ────────────────────────────────────────
function listenGameEvents(socket) {
    socket.on('disconnect', showDisconnectBanner);
    socket.on('connect',    () => document.getElementById('_dc-banner')?.remove());

    socket.on('mmr_update', async ({ delta, newMMR, rank, isWO, lpDelta, elo, promoted, demoted }) => {
        const session = Session.get();
        if (!session) return;
        const updated = { ...session, mmr: newMMR, rank };
        Session.save(updated);
        showMMRToast(delta, isWO, lpDelta, elo, promoted, demoted);
        await MenuPopulator.populate(updated);
    });

    socket.on('banned', (data) => BanOverlay.show(data));

    socket.on('opponent_reconnecting', ({ remainMs }) => ReconnectOverlay.show(remainMs));
    socket.on('opponent_reconnected',  ()             => ReconnectOverlay.hide());

    socket.on('rejoin_success', ({ color }) => {
        ReconnectOverlay.hide();
        console.log(`[REJOIN] Reconectado como ${color}`);
    });
    socket.on('rejoin_failed', () => { /* ignora — segue fluxo normal */ });
}

// ── INIT ──────────────────────────────────────────────────────
(async function init() {
    if (window._mcSocket) {
        listenGameEvents(window._mcSocket);
        tryRejoinIfPending(window._mcSocket);
    }

    const session = Session.get();
    if (session && session.token) {
        await MenuPopulator.populate(session);
    } else {
        AuthUI.show();
    }
})();
