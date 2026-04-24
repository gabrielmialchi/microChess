'use strict';
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const crypto     = require('crypto');
const path       = require('path');
const rateLimit     = require('express-rate-limit');
const helmet        = require('helmet');
const compression   = require('compression');

const { hashPassword, checkPassword, signToken, verifyToken } = require('./auth');
const db = require('./db/database');
const { calculate: calcMMR, calculateDraw, getRank, getBanDuration } = require('./mmr');
const { createReplayBuffer, recordTurn, buildTurnSnapshot, buildDuelSnapshot } = require('./replay');
const { applyLPChange, getEloDisplay } = require('./elo');
const { logEvent } = require('./analytics');
const { isPathClear, isValidMove }     = require('./movegen');
const { createBotPlayer, processBotTurn } = require('./bot');

const app    = express();
const server = http.createServer(app);
// CORS — suporta lista separada por vírgula em ALLOWED_ORIGIN
const _rawOrigins = process.env.ALLOWED_ORIGIN || '*';
const _originList = _rawOrigins === '*' ? '*' : _rawOrigins.split(',').map(s => s.trim());
const _checkOrigin = (origin) => {
    if (_originList === '*' || !origin) return true;
    return _originList.some(o => o === origin || (o.startsWith('*.') && origin.endsWith(o.slice(1))));
};

const io     = new Server(server, {
    cors: {
        origin: _originList === '*' ? '*' : (origin, cb) =>
            _checkOrigin(origin) ? cb(null, true) : cb(new Error('CORS')),
    },
    perMessageDeflate: { threshold: 1024 },
});
const PORT   = process.env.PORT || 3000;

app.use(compression());
app.use(helmet({ contentSecurityPolicy: false })); // CSP off: Google Fonts CDN + Socket.io inline

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (_originList === '*') {
        res.setHeader('Access-Control-Allow-Origin', '*');
    } else if (origin && _checkOrigin(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, '../html')));
app.get('/health', (_, res) => {
    try {
        db.prepare('SELECT 1 FROM players LIMIT 1').get();
        res.json({ ok: true, rooms: rooms?.size ?? 0, queue: queue?.length ?? 0, db: 'ok' });
    } catch {
        res.status(500).json({ ok: false, db: 'error' });
    }
});

app.get('/privacy-policy', (_, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html><html lang="pt-br"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>microChess — Política de Privacidade</title>
<style>body{font-family:system-ui,sans-serif;max-width:720px;margin:40px auto;padding:0 20px;color:#222;line-height:1.7}h1{color:#8b6914}h2{color:#555;font-size:1rem;margin-top:2em}a{color:#8b6914}</style>
</head><body>
<h1>microChess — Política de Privacidade</h1>
<p><em>Última atualização: ${new Date().toLocaleDateString('pt-BR')}</em></p>
<h2>1. Dados Coletados</h2>
<p>Ao criar uma conta, coletamos: <strong>endereço de e-mail</strong> (armazenado de forma criptografada), <strong>nome de usuário</strong> e dados de partidas jogadas (resultados, ranking, histórico de replays).</p>
<h2>2. Uso dos Dados</h2>
<p>Os dados são utilizados exclusivamente para: autenticação na plataforma, exibição de ranking e histórico de partidas, e prevenção de abusos (sistema de ban temporário).</p>
<h2>3. Compartilhamento</h2>
<p>Não compartilhamos dados pessoais com terceiros. O nome de usuário e estatísticas de jogo são públicos no leaderboard.</p>
<h2>4. Retenção</h2>
<p>Os dados da conta são mantidos enquanto a conta estiver ativa. Replays de partidas são excluídos automaticamente após 30 dias. Você pode excluir sua conta a qualquer momento pelo menu <em>Perfil → Excluir Conta</em>.</p>
<h2>5. Direitos do Usuário</h2>
<p>Você tem o direito de acessar, corrigir ou excluir seus dados. Para exercer esses direitos, use a opção <em>Excluir Conta</em> no aplicativo ou entre em contato pelo e-mail abaixo.</p>
<h2>6. Segurança</h2>
<p>Senhas são armazenadas com hash bcrypt. E-mails são criptografados com AES-256-GCM em repouso.</p>
<h2>7. Contato</h2>
<p>Dúvidas: <a href="mailto:contato@o6games.com">contato@o6games.com</a></p>
<p>Desenvolvido por <strong>o6 games</strong> — Gabriel Mialchi</p>
</body></html>`);
});

app.get('/.well-known/assetlinks.json', (_, res) => {
    let links = [];
    try { links = process.env.ASSET_LINKS ? JSON.parse(process.env.ASSET_LINKS) : []; }
    catch { console.error('[CONFIG] ASSET_LINKS inválido — usando []'); }
    res.json(links);
});

// ── STARTUP SECURITY CHECKS ───────────────────────────────────
if (process.env.NODE_ENV === 'production') {
    if (!process.env.HMAC_SECRET)     console.error('[SECURITY] CRÍTICO: HMAC_SECRET não definido. Emails não estão protegidos!');
    if (!process.env.AES_KEY)         console.error('[SECURITY] CRÍTICO: AES_KEY não definida. Emails não estão criptografados corretamente!');
    if (!process.env.ALLOWED_ORIGIN)  console.error('[SECURITY] AVISO: ALLOWED_ORIGIN não definido — Socket.IO aceitando conexões de qualquer origem.');
}

// ── RATE LIMITING ─────────────────────────────────────────────
const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas tentativas. Aguarde 1 minuto.' },
});
const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas requisições. Aguarde 1 minuto.' },
});

// ── EMAIL CRYPTO ──────────────────────────────────────────────
const HMAC_SECRET = process.env.HMAC_SECRET || 'mc-hmac-dev-secret-key';
const _AES_KEY    = Buffer.from(
    (process.env.AES_KEY || 'mc-aes-key-dev-000000000000000').padEnd(32, '0').slice(0, 32)
);
function hashEmail(email) {
    return crypto.createHmac('sha256', HMAC_SECRET).update(email).digest('hex');
}
function encryptEmail(email) {
    const iv     = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', _AES_KEY, iv);
    const enc    = Buffer.concat([cipher.update(email, 'utf8'), cipher.final()]);
    const tag    = cipher.getAuthTag();
    return `${iv.toString('hex')}:${enc.toString('hex')}:${tag.toString('hex')}`;
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ── AUTH HELPERS ─────────────────────────────────────────────
const USERNAME_RE = /^[a-zA-Z0-9_\-\.]{3,16}$/;

// Verifies token AND checks pw_version — invalidates tokens issued before last password change
function requireAuth(authHeader) {
    const token   = (authHeader || '').split(' ')[1];
    const decoded = token ? verifyToken(token) : null;
    if (!decoded) return null;
    const player = db.prepare('SELECT pw_version FROM players WHERE id=?').get(decoded.id);
    if (!player) return null;
    if ((decoded.pv ?? 0) !== (player.pw_version ?? 0)) return null;
    return decoded;
}

// ── AUTH ENDPOINTS ────────────────────────────────────────────

app.post('/auth/register', authLimiter, async (req, res) => {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password)
        return res.status(400).json({ error: 'username, email e password são obrigatórios' });
    const uname = String(username).trim();
    if (!USERNAME_RE.test(uname))
        return res.status(400).json({ error: 'Username deve ter 3-16 caracteres: letras, números, _ - .' });
    if (password.length < 6)
        return res.status(400).json({ error: 'Senha deve ter ao menos 6 caracteres' });
    const emailNorm = String(email).toLowerCase().trim();
    if (!EMAIL_RE.test(emailNorm))
        return res.status(400).json({ error: 'Formato de email inválido' });
    try {
        const id            = crypto.randomUUID();
        const password_hash = await hashPassword(password);
        const email_hash    = hashEmail(emailNorm);
        const email_enc     = encryptEmail(emailNorm);
        if (db.prepare('SELECT id FROM players WHERE email_hash = ?').get(email_hash))
            return res.status(409).json({ error: 'Email já cadastrado' });
        db.prepare(
            'INSERT INTO players (id, username, email, email_hash, email_enc, password_hash) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(id, uname, email_enc, email_hash, email_enc, password_hash);
        const token = signToken({ id, username: uname, pv: 0 });
        res.json({ token, id, username: uname, mmr: 1500, lang: 'en' });
    } catch (e) {
        if (e.message.includes('UNIQUE'))
            return res.status(409).json({ error: 'Username já cadastrado' });
        res.status(500).json({ error: 'Erro interno' });
    }
});

// Dummy hash prevents timing oracle: same ~100ms response whether email exists or not
const _DUMMY_HASH = '$2b$10$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

app.post('/auth/login', authLimiter, async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password)
        return res.status(400).json({ error: 'email e password são obrigatórios' });
    const emailNorm  = String(email).toLowerCase().trim();
    const email_hash = hashEmail(emailNorm);
    const player = db.prepare(
        'SELECT id, username, password_hash, mmr, pw_version, lang, elo_rank, elo_lp FROM players WHERE email_hash = ?'
    ).get(email_hash);
    if (!player) {
        await checkPassword(password, _DUMMY_HASH);
        return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    const ok = await checkPassword(password, player.password_hash);
    if (!ok) return res.status(401).json({ error: 'Credenciais inválidas' });
    db.prepare("UPDATE players SET last_seen = datetime('now') WHERE id = ?").run(player.id);
    const token = signToken({ id: player.id, username: player.username, pv: player.pw_version ?? 0 });
    res.json({ token, id: player.id, username: player.username, mmr: player.mmr, lang: player.lang || 'en', elo: getEloDisplay(player.elo_rank ?? 0, player.elo_lp ?? 0) });
    logEvent('session_start', player.id, null, null);
});

// ── PROFILE / ACCOUNT ENDPOINTS ──────────────────────────────
app.patch('/auth/profile', async (req, res) => {
    const decoded = requireAuth(req.headers.authorization);
    if (!decoded) return res.status(401).json({ error: 'Não autenticado' });
    const uname = String(req.body?.username || '').trim();
    if (!USERNAME_RE.test(uname))
        return res.status(400).json({ error: 'Username deve ter 3-16 caracteres: letras, números, _ - .' });
    try {
        db.prepare('UPDATE players SET username=? WHERE id=?').run(uname, decoded.id);
        const pv = decoded.pv ?? 0;
        const newToken = signToken({ id: decoded.id, username: uname, pv });
        res.json({ token: newToken, username: uname });
    } catch (e) {
        if (e.message.includes('UNIQUE'))
            return res.status(409).json({ error: 'Username já em uso' });
        res.status(500).json({ error: 'Erro interno' });
    }
});

app.patch('/auth/lang', (req, res) => {
    const decoded = requireAuth(req.headers.authorization);
    if (!decoded) return res.status(401).json({ error: 'Não autenticado' });
    const SUPPORTED = ['pt','es','en','de','it','ru','ja','ko','zh'];
    const lang = req.body?.lang;
    if (!lang || !SUPPORTED.includes(lang)) return res.status(400).json({ error: 'Idioma inválido' });
    db.prepare('UPDATE players SET lang=? WHERE id=?').run(lang, decoded.id);
    res.json({ ok: true });
});

app.patch('/auth/password', authLimiter, async (req, res) => {
    const decoded = requireAuth(req.headers.authorization);
    if (!decoded) return res.status(401).json({ error: 'Não autenticado' });
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword)
        return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
    if (newPassword.length < 6)
        return res.status(400).json({ error: 'Senha deve ter ao menos 6 caracteres' });
    const player = db.prepare('SELECT password_hash FROM players WHERE id=?').get(decoded.id);
    if (!player) return res.status(404).json({ error: 'Usuário não encontrado' });
    const ok = await checkPassword(currentPassword, player.password_hash);
    if (!ok) return res.status(401).json({ error: 'Senha atual incorreta' });
    const newHash = await hashPassword(newPassword);
    db.prepare('UPDATE players SET password_hash=?, pw_version=pw_version+1 WHERE id=?').run(newHash, decoded.id);
    const updated  = db.prepare('SELECT username, pw_version FROM players WHERE id=?').get(decoded.id);
    const newToken = signToken({ id: decoded.id, username: updated.username, pv: updated.pw_version });
    res.json({ ok: true, token: newToken });
});

const _deleteAccount = db.transaction((playerId) => {
    db.prepare('DELETE FROM replays WHERE match_id IN (SELECT id FROM matches WHERE player_white_id=? OR player_black_id=?)').run(playerId, playerId);
    db.prepare('DELETE FROM matches WHERE player_white_id=? OR player_black_id=?').run(playerId, playerId);
    db.prepare('DELETE FROM players WHERE id=?').run(playerId);
});

app.delete('/auth/account', (req, res) => {
    const decoded = requireAuth(req.headers.authorization);
    if (!decoded) return res.status(401).json({ error: 'Não autenticado' });
    try {
        _deleteAccount(decoded.id);
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: 'Erro interno' });
    }
});

// ── LEADERBOARD / PLAYER ENDPOINTS ───────────────────────────
app.get('/leaderboard', apiLimiter, (_, res) => {
    const rows = db.prepare(
        'SELECT id, username, mmr, wins, losses, draws, wo_count, elo_rank, elo_lp FROM players ORDER BY elo_rank DESC, elo_lp DESC LIMIT 50'
    ).all();
    res.json(rows.map((p, i) => ({
        rank: i + 1, ...p,
        ...getRank(p.mmr),
        elo: getEloDisplay(p.elo_rank ?? 0, p.elo_lp ?? 0),
    })));
});

app.get('/player/:id', apiLimiter, (req, res) => {
    const auth    = (req.headers.authorization || '').split(' ')[1];
    const decoded = auth ? verifyToken(auth) : null;
    const isSelf  = decoded?.id === req.params.id;
    const p = db.prepare(
        'SELECT id, username, mmr, wins, losses, draws, wo_count, wo_against, ban_until, elo_rank, elo_lp, elo_shield FROM players WHERE id=?'
    ).get(req.params.id);
    if (!p) return res.status(404).json({ error: 'Não encontrado' });
    const elo = getEloDisplay(p.elo_rank ?? 0, p.elo_lp ?? 0);
    const pub = { id: p.id, username: p.username, mmr: p.mmr, wins: p.wins, losses: p.losses, draws: p.draws, wo_against: p.wo_against, elo_rank: p.elo_rank, elo_lp: p.elo_lp, ...getRank(p.mmr), elo };
    if (isSelf) {
        pub.wo_count   = p.wo_count;
        pub.elo_shield = p.elo_shield;
        pub.banned     = !!(p.ban_until && new Date(p.ban_until) > new Date());
        pub.banUntil   = p.ban_until;
    }
    res.json(pub);
});

app.get('/match/:id/replay', apiLimiter, (req, res) => {
    const replay = db.prepare('SELECT * FROM replays WHERE match_id = ?').get(req.params.id);
    if (!replay) return res.status(404).json({ error: 'Replay não encontrado' });
    if (new Date(replay.expires_at) < new Date())
        return res.status(410).json({ error: 'Replay expirado' });
    try {
        res.json({ ...replay, turns: JSON.parse(replay.turns_json) });
    } catch {
        res.status(500).json({ error: 'Replay corrompido' });
    }
});

app.get('/player/:id/matches', apiLimiter, (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const matches = db.prepare(`
        SELECT m.*, r.id as replay_id,
            pw.username as white_username,
            pb.username as black_username
        FROM matches m
        LEFT JOIN replays r ON r.match_id = m.id
        LEFT JOIN players pw ON pw.id = m.player_white_id
        LEFT JOIN players pb ON pb.id = m.player_black_id
        WHERE m.player_white_id = ? OR m.player_black_id = ?
        ORDER BY m.created_at DESC LIMIT ?
    `).all(req.params.id, req.params.id, limit);
    res.json(matches);
});

// ── MMR / BAN / AFK ───────────────────────────────────────────
const K_WO_BONUS     = 8;
const AFK_ACTION_MS  = 45_000;
const AFK_PREPARE_MS = 120_000;

function applyBan(playerId, newWoCount) {
    const minutes = getBanDuration(newWoCount);
    if (minutes > 0) {
        const banUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();
        db.prepare('UPDATE players SET ban_until=? WHERE id=?').run(banUntil, playerId);
        console.log(`[BAN] ${playerId} banido por ${minutes} minutos.`);
    }
}

const _persistDB = db.transaction((room, winnerColor, isWO) => {
    const wp = room.players.white;
    const bp = room.players.black;
    if (!wp?.uid || !bp?.uid) return null;

    const isCasual = room.match_mode === 'casual';

    const wRec = db.prepare('SELECT mmr, wo_count, elo_rank, elo_lp, elo_shield FROM players WHERE id=?').get(wp.uid);
    const bRec = db.prepare('SELECT mmr, wo_count, elo_rank, elo_lp, elo_shield FROM players WHERE id=?').get(bp.uid);
    if (!wRec || !bRec) return null;

    let wDelta = 0, bDelta = 0, result;

    if (isWO) {
        if (winnerColor === 'white') {
            result = 'wo_black';
            if (!isCasual) wDelta = K_WO_BONUS;
            db.prepare('UPDATE players SET wo_count=wo_count+1 WHERE id=?').run(bp.uid);
            db.prepare('UPDATE players SET wo_against=wo_against+1 WHERE id=?').run(wp.uid);
            applyBan(bp.uid, bRec.wo_count + 1);
        } else {
            result = 'wo_white';
            if (!isCasual) bDelta = K_WO_BONUS;
            db.prepare('UPDATE players SET wo_count=wo_count+1 WHERE id=?').run(wp.uid);
            db.prepare('UPDATE players SET wo_against=wo_against+1 WHERE id=?').run(bp.uid);
            applyBan(wp.uid, wRec.wo_count + 1);
        }
    } else if (!isCasual) {
        if (winnerColor === 'white') {
            ({ winnerDelta: wDelta, loserDelta: bDelta } = calcMMR(wRec.mmr, bRec.mmr));
            result = 'white';
        } else if (winnerColor === 'black') {
            ({ winnerDelta: bDelta, loserDelta: wDelta } = calcMMR(bRec.mmr, wRec.mmr));
            result = 'black';
        } else {
            result = 'draw';
            // Standard ELO draw: score=0.5. Weaker player always gains ≥1 MMR.
            ({ deltaA: wDelta, deltaB: bDelta } = calculateDraw(wRec.mmr, bRec.mmr));
        }
    } else {
        // casual: record result without MMR movement
        if (winnerColor === 'white')      result = 'white';
        else if (winnerColor === 'black') result = 'black';
        else                              result = 'draw';
    }

    const isDraw = result === 'draw';

    // LP/ELO: only update in ranked mode
    let wLP = { elo_rank: wRec.elo_rank ?? 0, elo_lp: wRec.elo_lp ?? 0, elo_shield: wRec.elo_shield ?? 0, lpDelta: 0 };
    let bLP = { elo_rank: bRec.elo_rank ?? 0, elo_lp: bRec.elo_lp ?? 0, elo_shield: bRec.elo_shield ?? 0, lpDelta: 0 };
    if (!isCasual) {
        // Draw: MMR changes by ELO formula, but LP only rises (no loss).
        const wLpInput = isDraw ? (wRec.mmr <= bRec.mmr ? Math.max(0, wDelta) : 0) : wDelta;
        const bLpInput = isDraw ? (bRec.mmr <= wRec.mmr ? Math.max(0, bDelta) : 0) : bDelta;
        wLP = applyLPChange(wRec.elo_rank ?? 0, wRec.elo_lp ?? 0, wRec.elo_shield ?? 0, wLpInput);
        bLP = applyLPChange(bRec.elo_rank ?? 0, bRec.elo_lp ?? 0, bRec.elo_shield ?? 0, bLpInput);
    }

    db.prepare('UPDATE players SET mmr=mmr+?, wins=wins+?, losses=losses+?, draws=draws+?, elo_rank=?, elo_lp=?, elo_shield=? WHERE id=?')
      .run(wDelta, result === 'white' ? 1 : 0, result === 'black' || result === 'wo_black' ? 1 : 0,
           isDraw ? 1 : 0, wLP.elo_rank, wLP.elo_lp, wLP.elo_shield, wp.uid);
    db.prepare('UPDATE players SET mmr=mmr+?, wins=wins+?, losses=losses+?, draws=draws+?, elo_rank=?, elo_lp=?, elo_shield=? WHERE id=?')
      .run(bDelta, result === 'black' ? 1 : 0, result === 'white' || result === 'wo_white' ? 1 : 0,
           isDraw ? 1 : 0, bLP.elo_rank, bLP.elo_lp, bLP.elo_shield, bp.uid);

    const matchId = crypto.randomUUID();
    room._matchId = matchId;
    const durationMs = room._startedAt ? Date.now() - room._startedAt : 0;
    const totalTurns = room._replay?.turns?.length ?? 0;
    db.prepare('INSERT INTO matches (id,player_white_id,player_black_id,result,mmr_change_white,mmr_change_black,lp_change_white,lp_change_black,match_mode,duration_ms,total_turns,ttm_ms) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
      .run(matchId, wp.uid, bp.uid, result, wDelta, bDelta, wLP.lpDelta ?? 0, bLP.lpDelta ?? 0, room.match_mode || 'ranked', durationMs, totalTurns, room._ttmMs ?? 0);

    if (room._replay) {
        const replayId = crypto.randomUUID();
        db.prepare('INSERT INTO replays (id, match_id, turns_json) VALUES (?, ?, ?)')
          .run(replayId, matchId, JSON.stringify(room._replay.turns));
    }

    db.prepare("UPDATE players SET last_seen=datetime('now') WHERE id IN (?,?)").run(wp.uid, bp.uid);

    return { wp, bp, wDelta, bDelta, wRec, bRec, wLP, bLP };
});

function persistMatchResult(room, winnerColor, isWO = false) {
    let data;
    try {
        data = _persistDB(room, winnerColor, isWO);
    } catch (e) {
        console.error('[MMR] Erro ao persistir:', e.message);
        return;
    }
    if (!data) return;
    const { wp, bp, wDelta, bDelta, wRec, bRec, wLP, bLP } = data;
    const wNew = wRec.mmr + wDelta;
    const bNew = bRec.mmr + bDelta;
    io.to(wp.socketId).emit('mmr_update', {
        delta: wDelta, newMMR: wNew, rank: getRank(wNew), isWO,
        lpDelta: wLP.lpDelta, elo: getEloDisplay(wLP.elo_rank, wLP.elo_lp),
        promoted: wLP.promoted, demoted: wLP.demoted,
    });
    io.to(bp.socketId).emit('mmr_update', {
        delta: bDelta, newMMR: bNew, rank: getRank(bNew), isWO,
        lpDelta: bLP.lpDelta, elo: getEloDisplay(bLP.elo_rank, bLP.elo_lp),
        promoted: bLP.promoted, demoted: bLP.demoted,
    });
}

function clearAFKTimer(room, color) {
    if (room.timeouts?.[color]) {
        clearTimeout(room.timeouts[color]);
        room.timeouts[color] = null;
    }
    if (room.state?.afkDeadline) room.state.afkDeadline[color] = null;
}

function startAFKTimer(room, color, ms, reason) {
    clearAFKTimer(room, color);
    if (!room.state.afkDeadline) room.state.afkDeadline = {};
    room.state.afkDeadline[color] = Date.now() + ms;
    room.timeouts[color] = setTimeout(() => {
        const roomNow = rooms.get(room.id);
        if (!roomNow || roomNow.state.phase === 'GAMEOVER') return;
        console.log(`[AFK] ${color} inativo (${reason}). WO decretado.`);
        const oppColor = color === 'white' ? 'black' : 'white';
        clearAFKTimer(roomNow, color);
        clearAFKTimer(roomNow, color === 'white' ? 'black' : 'white');
        roomNow.state.phase = 'GAMEOVER';
        roomNow.state.wo    = true;
        roomNow.state.afk   = color;
        persistMatchResult(roomNow, oppColor, true);
        broadcast(roomNow);
        scheduleRoomCleanup(room.id);
    }, ms);
}

// ── GAME CONFIG (mirrors client) ──────────────────────────────
const CONFIG = {
    Q: { cost: 5, bonus: 5 },
    R: { cost: 4, bonus: 4 },
    N: { cost: 3, bonus: 3 },
    B: { cost: 2, bonus: 2 },
    P: { cost: 1, bonus: 1 },
    K: { cost: 0, bonus: 5 },
};

// ── IN-MEMORY STATE ───────────────────────────────────────────
const queue            = [];         // { uid, nickname, avatar, timestamp, socketId }
const rooms            = new Map();  // roomId → { id, players, state, resolving }
const pendingReconnects = new Map(); // uid → { roomId, color, timer }
const privateRooms     = new Map();  // code → { profile, socketId, timer, createdAt }
const RECONNECT_MS     = 60_000;
const PRIVATE_ROOM_MS  = 5 * 60_000; // 5 minutes expiry

// ── SOCKET RATE LIMITER ───────────────────────────────────────
// Per-socket sliding-window counter. Returns true if within limit.
const _socketRateLimits = new WeakMap();
function checkSocketRate(socket, event, maxPerWindow, windowMs) {
    let limits = _socketRateLimits.get(socket);
    if (!limits) { limits = {}; _socketRateLimits.set(socket, limits); }
    const now = Date.now();
    const entry = limits[event] || { count: 0, windowStart: now };
    if (now - entry.windowStart > windowMs) { entry.count = 0; entry.windowStart = now; }
    entry.count++;
    limits[event] = entry;
    return entry.count <= maxPerWindow;
}

// ── MAINTENANCE ───────────────────────────────────────────────
function cleanExpiredReplays() {
    const result = db.prepare("DELETE FROM replays WHERE expires_at < datetime('now')").run();
    if (result.changes > 0) console.log(`[CLEANUP] ${result.changes} replay(s) expirado(s) removido(s).`);
}
cleanExpiredReplays();
setInterval(cleanExpiredReplays, 24 * 60 * 60 * 1000);

function scheduleRoomCleanup(roomId) {
    setTimeout(() => {
        rooms.delete(roomId);
        for (const [uid, entry] of pendingReconnects.entries()) {
            if (entry.roomId === roomId) pendingReconnects.delete(uid);
        }
    }, 60_000);
}

function createState() {
    return {
        phase:     'DRAFT',
        budget:    { white: 5, black: 5 },
        army: [
            { id: 'wk1', type: 'K', x: 1, y: 0, color: 'white', bonus: 5, buffed: false },
            { id: 'bk1', type: 'K', x: 2, y: 3, color: 'black', bonus: 5, buffed: false },
        ],
        inventory: { white: [], black: [] },
        ready:     { white: false, black: false },
        planning:  { white: null, black: null },
        duel: {
            active: false, resolveTime: false, suddenDeath: false,
            pressed: { white: false, black: false },
            rolls:   { white: 0,     black: 0     },
            wPiece: null, bPiece: null,
        },
        duelQueue: [],
    };
}

function stateView(state, color) {
    const opp = color === 'white' ? 'black' : 'white';
    // Always hide opponent's planning to prevent WebSocket snooping
    return { ...state, planning: { ...state.planning, [opp]: null } };
}

function broadcast(room) {
    const { white, black } = room.players;
    io.to(white.socketId).emit('game_state', stateView(room.state, 'white'));
    io.to(black.socketId).emit('game_state', stateView(room.state, 'black'));
    if (room._botColor && room.state.phase !== 'GAMEOVER') {
        setImmediate(() => {
            const r = rooms.get(room.id);
            if (r && r.state.phase !== 'GAMEOVER') processBotTurn(r, r._botColor, (ev, data) => handleBotEvent(r, ev, data));
        });
    }
}

// ── GAME LOGIC ────────────────────────────────────────────────
function checkFinalDuel(army) {
    return army.length === 2 && army[0].type === 'K' && army[1].type === 'K';
}

function resolveAction(state) {
    const pW = state.planning.white;
    const pB = state.planning.black;
    let army      = JSON.parse(JSON.stringify(state.army));
    let duelQueue = [];

    const pieceW = pW ? army.find(p => p.id === pW.pieceId) : null;
    const pieceB = pB ? army.find(p => p.id === pB.pieceId) : null;

    const movingIds = new Set([pieceW?.id, pieceB?.id].filter(Boolean));
    const isMoving  = id => movingIds.has(id);

    const kingW = army.find(p => p.type === 'K' && p.color === 'white');
    const kingB = army.find(p => p.type === 'K' && p.color === 'black');

    const wAttacksKingB = pW && pieceW && kingB && pW.tx === kingB.x && pW.ty === kingB.y && !isMoving(kingB.id);
    const bAttacksKingW = pB && pieceB && kingW && pB.tx === kingW.x && pB.ty === kingW.y && !isMoving(kingW.id);

    if (wAttacksKingB && bAttacksKingW) {
        // Case f: both attack each other's King
        if (pieceW.bonus > pieceB.bonus) {
            duelQueue.push({ type: 'attack', attackerColor: 'white', wPiece: pieceW, bPiece: kingB, txW: pW.tx, tyW: pW.ty, txB: kingB.x, tyB: kingB.y, priority: pieceW.bonus });
            duelQueue.push({ type: 'attack', attackerColor: 'black', wPiece: kingW, bPiece: pieceB, txW: kingW.x, tyW: kingW.y, txB: pB.tx, tyB: pB.ty, priority: pieceB.bonus });
        } else if (pieceB.bonus > pieceW.bonus) {
            duelQueue.push({ type: 'attack', attackerColor: 'black', wPiece: kingW, bPiece: pieceB, txW: kingW.x, tyW: kingW.y, txB: pB.tx, tyB: pB.ty, priority: pieceB.bonus });
            duelQueue.push({ type: 'attack', attackerColor: 'white', wPiece: pieceW, bPiece: kingB, txW: pW.tx, tyW: pW.ty, txB: kingB.x, tyB: kingB.y, priority: pieceW.bonus });
        } else {
            // Equal-bonus frontal — regular duel (not Morte Súbita; that only applies to King vs King final)
            duelQueue.push({ type: 'frontal', wPiece: pieceW, bPiece: pieceB, txW: pW.tx, tyW: pW.ty, txB: pB.tx, tyB: pB.ty, priority: pieceW.bonus });
        }
    } else if (pW && pB && pieceW && pieceB && pW.tx === pB.tx && pW.ty === pB.ty) {
        // Case d: frontal clash (same destination)
        duelQueue.push({ type: 'frontal', wPiece: pieceW, bPiece: pieceB, txW: pW.tx, tyW: pW.ty, txB: pB.tx, tyB: pB.ty, priority: Math.max(pieceW.bonus, pieceB.bonus) });
    } else {
        // Case e: counter-attack / King defense
        const wGoesToKingB = wAttacksKingB;
        const bInterceptsW = pB && pieceB && pieceW && pB.tx === pieceW.x && pB.ty === pieceW.y;
        const bGoesToKingW = bAttacksKingW;
        const wInterceptsB = pW && pieceW && pieceB && pW.tx === pieceB.x && pW.ty === pieceB.y;

        let handledW = false, handledB = false;

        if (wGoesToKingB && bInterceptsW) {
            duelQueue.push({ type: 'attack', attackerColor: 'black', wPiece: pieceW, bPiece: pieceB, txW: pieceW.x, tyW: pieceW.y, txB: pB.tx, tyB: pB.ty, priority: pieceB.bonus });
            duelQueue.push({ type: 'attack', attackerColor: 'white', wPiece: pieceW, bPiece: kingB, txW: pW.tx, tyW: pW.ty, txB: kingB.x, tyB: kingB.y, priority: pieceW.bonus });
            handledW = true; handledB = true;
        } else if (bGoesToKingW && wInterceptsB) {
            duelQueue.push({ type: 'attack', attackerColor: 'white', wPiece: pieceW, bPiece: pieceB, txW: pW.tx, tyW: pW.ty, txB: pieceB.x, tyB: pieceB.y, priority: pieceW.bonus });
            duelQueue.push({ type: 'attack', attackerColor: 'black', wPiece: kingW, bPiece: pieceB, txW: kingW.x, tyW: kingW.y, txB: pB.tx, tyB: pB.ty, priority: pieceB.bonus });
            handledW = true; handledB = true;
        }

        // Process White's move if not in case e
        if (!handledW && pW && pieceW) {
            const target = army.find(p => p.x === pW.tx && p.y === pW.ty && p.color === 'black');
            if (!target) {
                pieceW.x = pW.tx; pieceW.y = pW.ty;
            } else if (isMoving(target.id)) {
                // Case a: escape
                pieceW.x = pW.tx; pieceW.y = pW.ty;
            } else if (target.type === 'K') {
                // Case c: attack stationary King → duel
                duelQueue.push({ type: 'attack', attackerColor: 'white', wPiece: pieceW, bPiece: target, txW: pW.tx, tyW: pW.ty, txB: target.x, tyB: target.y, priority: pieceW.bonus });
            } else {
                // Case b: auto-capture stationary non-King
                army.splice(army.findIndex(a => a.id === target.id), 1);
                pieceW.x = pW.tx; pieceW.y = pW.ty;
            }
        }

        // Process Black's move if not in case e
        if (!handledB && pB && pieceB) {
            const pbCurrent = army.find(p => p.id === pB.pieceId);
            if (pbCurrent) {
                const target = army.find(p => p.x === pB.tx && p.y === pB.ty && p.color === 'white');
                if (!target) {
                    pbCurrent.x = pB.tx; pbCurrent.y = pB.ty;
                } else if (isMoving(target.id)) {
                    // Case a: escape
                    pbCurrent.x = pB.tx; pbCurrent.y = pB.ty;
                } else if (target.type === 'K') {
                    // Case c: attack stationary King → duel
                    duelQueue.push({ type: 'attack', attackerColor: 'black', wPiece: target, bPiece: pbCurrent, txW: target.x, tyW: target.y, txB: pB.tx, tyB: pB.ty, priority: pbCurrent.bonus });
                } else {
                    // Case b: auto-capture stationary non-King
                    army.splice(army.findIndex(a => a.id === target.id), 1);
                    pbCurrent.x = pB.tx; pbCurrent.y = pB.ty;
                }
            }
        }
    }

    duelQueue.sort((a, b) => b.priority - a.priority);

    // Buff pawns that reached the opposite end
    army.forEach(p => {
        if (p.type === 'P' && !p.buffed) {
            if ((p.color === 'white' && p.y === 3) || (p.color === 'black' && p.y === 0)) {
                p.buffed = true; p.bonus = 2;
            }
        }
    });

    const emptyDuel = { active: false, resolveTime: false, suddenDeath: false,
                        pressed: { white: false, black: false }, rolls: { white: 0, black: 0 },
                        wPiece: null, bPiece: null };

    let currentDuel    = emptyDuel;
    let remainingQueue = [];

    if (duelQueue.length > 0) {
        const next = duelQueue[0];
        currentDuel = { ...next, active: true, resolveTime: false,
                        suddenDeath: next.suddenDeath || false,
                        pressed: { white: false, black: false },
                        rolls:   { white: 0,     black: 0     } };
        remainingQueue = duelQueue.slice(1);
    } else if (checkFinalDuel(army)) {
        // Morte Súbita: show announcement phase first; caller schedules duel after 3s
        state.army      = army;
        state.planning  = { white: null, black: null };
        state.ready     = { white: false, black: false };
        state.duel      = emptyDuel;
        state.duelQueue = [];
        state.phase     = 'SUDDEN_DEATH';
        return;
    }

    state.army      = army;
    state.planning  = { white: null, black: null };
    state.ready     = { white: false, black: false };
    state.duel      = currentDuel;
    state.duelQueue = remainingQueue;
}

function finishDuel(room) {
    const state = room.state;
    const d     = state.duel;
    if (!d || !d.resolveTime) { room.resolving = false; return; }

    let army = JSON.parse(JSON.stringify(state.army));
    const totW = d.rolls.white + d.wPiece.bonus;
    const totB = d.rolls.black + d.bPiece.bonus;
    const idxW = army.findIndex(a => a.id === d.wPiece.id);
    const idxB = army.findIndex(a => a.id === d.bPiece.id);

    if (room._replay) {
        const duelResult = totW > totB ? 'white_wins' : totB > totW ? 'black_wins' : 'tie';
        recordTurn(room._replay, { type: 'duel', ...buildDuelSnapshot(d, duelResult) });
    }

    if (totW > totB) {
        if (idxB > -1) army.splice(idxB, 1);
        const wAlive = army.find(a => a.id === d.wPiece.id);
        if (wAlive && (d.type === 'frontal' || d.attackerColor === 'white')) {
            wAlive.x = d.txW; wAlive.y = d.tyW;
        }
    } else if (totB > totW) {
        if (idxW > -1) army.splice(idxW, 1);
        const bAlive = army.find(a => a.id === d.bPiece.id);
        if (bAlive && (d.type === 'frontal' || d.attackerColor === 'black')) {
            bAlive.x = d.txB; bAlive.y = d.tyB;
        }
    } else {
        // Tie resolution
        if (d.wPiece.type === 'K' && d.bPiece.type === 'K') {
            // Morte Súbita draw: both Kings tied — game ends in draw
            state.army      = army;
            state.duel      = { active: false };
            state.duelQueue = [];
            state.phase     = 'GAMEOVER';
            room.resolving  = false;
            clearAFKTimer(room, 'white');
            clearAFKTimer(room, 'black');
            persistMatchResult(room, 'draw', false);
            broadcast(room);
            scheduleRoomCleanup(room.id);
            return;
        } else if (d.wPiece.type === 'K') {
            // Attacker loses to stationary King
            army = army.filter(a => a.id !== d.bPiece.id);
        } else if (d.bPiece.type === 'K') {
            // Attacker loses to stationary King
            army = army.filter(a => a.id !== d.wPiece.id);
        } else {
            // Both non-King pieces eliminated
            army = army.filter(a => a.id !== d.wPiece.id && a.id !== d.bPiece.id);
        }
    }

    const wk = army.find(p => p.type === 'K' && p.color === 'white');
    const bk = army.find(p => p.type === 'K' && p.color === 'black');
    if (!wk || !bk) {
        state.army      = army;
        state.duel      = { active: false };
        state.duelQueue = [];
        state.phase     = 'GAMEOVER';
        room.resolving  = false;
        clearAFKTimer(room, 'white');
        clearAFKTimer(room, 'black');
        persistMatchResult(room, !wk ? 'black' : 'white', false);
        broadcast(room);
        scheduleRoomCleanup(room.id);
        return;
    }

    // Process next duel in queue
    let nextQueue = JSON.parse(JSON.stringify(state.duelQueue || []));
    while (nextQueue.length > 0) {
        const nd      = nextQueue.shift();
        const stillW  = army.find(a => a.id === nd.wPiece.id);
        const stillB  = army.find(a => a.id === nd.bPiece.id);
        let   valid   = false;

        if (stillW && stillB) {
            if (nd.type === 'frontal') valid = true;
            else if (nd.type === 'attack') {
                if (nd.attackerColor === 'white' && stillB.x === nd.txB && stillB.y === nd.tyB) valid = true;
                if (nd.attackerColor === 'black' && stillW.x === nd.txW && stillW.y === nd.tyW) valid = true;
            }
        }

        if (valid) {
            state.army      = army;
            state.duel      = { ...nd, active: true, resolveTime: false,
                                wPiece: stillW, bPiece: stillB,
                                pressed: { white: false, black: false },
                                rolls:   { white: 0,     black: 0     } };
            state.duelQueue = nextQueue;
            room.resolving  = false;
            broadcast(room);
            return;
        } else {
            // Position attacker at target if duel skipped
            if (stillW && nd.type === 'attack' && nd.attackerColor === 'white') { stillW.x = nd.txW; stillW.y = nd.tyW; }
            if (stillB && nd.type === 'attack' && nd.attackerColor === 'black') { stillB.x = nd.txB; stillB.y = nd.tyB; }
        }
    }

    if (checkFinalDuel(army)) {
        // Morte Súbita: announce phase first, duel after 3s
        state.army      = army;
        state.duel      = { active: false };
        state.duelQueue = [];
        state.phase     = 'SUDDEN_DEATH';
        room.resolving  = false;
        broadcast(room);
        setTimeout(() => {
            const r = rooms.get(room.id);
            if (!r || r.state.phase !== 'SUDDEN_DEATH') return;
            const kW = r.state.army.find(k => k.color === 'white');
            const kB = r.state.army.find(k => k.color === 'black');
            if (!kW || !kB) return;
            r.state.duel = {
                active: true, resolveTime: false, wPiece: kW, bPiece: kB,
                suddenDeath: true,
                pressed: { white: false, black: false },
                rolls:   { white: 0,     black: 0     },
            };
            broadcast(r);
        }, 3_000);
        return;
    }

    state.army      = army;
    state.duel      = { active: false };
    state.duelQueue = [];
    state.phase     = 'ACTION';
    room.resolving  = false;
    startAFKTimer(room, 'white', AFK_ACTION_MS, 'action');
    startAFKTimer(room, 'black', AFK_ACTION_MS, 'action');
    broadcast(room);
}

// ── BOT EVENT HANDLER ─────────────────────────────────────────
function handleBotEvent(room, event, data) {
    const botColor = room._botColor;
    const s = room.state;
    if (!s || s.phase === 'GAMEOVER') return;

    if (event === 'draft_buy') {
        const type = data;
        const cfg = CONFIG[type];
        if (!cfg || !cfg.cost || s.ready[botColor] || s.budget[botColor] < cfg.cost) return;
        clearAFKTimer(room, botColor);
        s.budget[botColor] -= cfg.cost;
        s.inventory[botColor].push({ type, color: botColor, id: `p_${Date.now()}_${crypto.randomBytes(2).toString('hex')}` });
        startAFKTimer(room, botColor, AFK_PREPARE_MS, 'draft');
        broadcast(room);
        return;
    }
    if (event === 'draft_ready') {
        if (s.phase !== 'DRAFT' || s.ready[botColor]) return;
        clearAFKTimer(room, botColor);
        s.ready[botColor] = true;
        if (s.ready.white && s.ready.black) {
            s.phase = 'POSITION';
            s.ready = { white: false, black: false };
            startAFKTimer(room, 'white', AFK_PREPARE_MS, 'position');
            startAFKTimer(room, 'black', AFK_PREPARE_MS, 'position');
        }
        broadcast(room);
        return;
    }
    if (event === 'position_place') {
        const { pieceId, x, y } = data;
        if (s.phase !== 'POSITION' || s.ready[botColor]) return;
        if (botColor === 'black' && y <= 1) return;
        if (x < 0 || x > 3 || y < 0 || y > 3) return;
        if (s.army.some(p => p.x === x && p.y === y)) return;
        const invIdx = s.inventory[botColor].findIndex(p => p.id === pieceId);
        if (invIdx === -1) return;
        clearAFKTimer(room, botColor);
        const piece = s.inventory[botColor].splice(invIdx, 1)[0];
        s.army.push({ id: piece.id, type: piece.type, color: botColor, x, y, bonus: CONFIG[piece.type].bonus, buffed: false });
        startAFKTimer(room, botColor, AFK_PREPARE_MS, 'position');
        broadcast(room);
        return;
    }
    if (event === 'position_ready') {
        if (s.phase !== 'POSITION' || s.ready[botColor]) return;
        clearAFKTimer(room, botColor);
        s.ready[botColor] = true;
        if (s.ready.white && s.ready.black) {
            recordTurn(room._replay, { type: 'position', ...buildTurnSnapshot(s) });
            s.phase = 'REVEAL';
            s.ready = { white: false, black: false };
            setTimeout(() => {
                const r = rooms.get(room.id);
                if (r && r.state.phase === 'REVEAL') {
                    r.state.phase = 'ACTION';
                    startAFKTimer(r, 'white', AFK_ACTION_MS, 'action');
                    startAFKTimer(r, 'black', AFK_ACTION_MS, 'action');
                    broadcast(r);
                }
            }, 3000);
        }
        broadcast(room);
        return;
    }
    if (event === 'action_plan') {
        const { pieceId, tx, ty } = data;
        if (s.phase !== 'ACTION' || s.ready[botColor] || s.duel.active) return;
        const piece = s.army.find(p => p.id === pieceId && p.color === botColor);
        if (!piece || !isValidMove(piece, tx, ty, s.army)) return;
        clearAFKTimer(room, botColor);
        s.planning[botColor] = { pieceId, tx, ty };
        startAFKTimer(room, botColor, AFK_ACTION_MS, 'action');
        broadcast(room);
        return;
    }
    if (event === 'action_ready') {
        if (s.phase !== 'ACTION' || s.ready[botColor] || s.duel.active) return;
        clearAFKTimer(room, botColor);
        s.ready[botColor] = true;
        if (s.ready.white && s.ready.black) {
            clearAFKTimer(room, 'white');
            clearAFKTimer(room, 'black');
            const planningSnap = {
                white: s.planning.white ? { ...s.planning.white } : null,
                black: s.planning.black ? { ...s.planning.black } : null,
            };
            resolveAction(s);
            if (room._replay) recordTurn(room._replay, { type: 'action', planning: planningSnap, ...buildTurnSnapshot(s) });
            if (s.phase === 'SUDDEN_DEATH') {
                setTimeout(() => {
                    const r = rooms.get(room.id);
                    if (!r || r.state.phase !== 'SUDDEN_DEATH') return;
                    const kW = r.state.army.find(k => k.color === 'white');
                    const kB = r.state.army.find(k => k.color === 'black');
                    if (!kW || !kB) return;
                    r.state.duel = {
                        active: true, resolveTime: false, wPiece: kW, bPiece: kB,
                        suddenDeath: true,
                        pressed: { white: false, black: false },
                        rolls:   { white: 0,     black: 0     },
                    };
                    broadcast(r);
                }, 3_000);
            }
        }
        broadcast(room);
        return;
    }
    if (event === 'roll_dice') {
        const d = s.duel;
        if (!d.active || d.resolveTime || d.pressed[botColor]) return;
        d.rolls[botColor]   = crypto.randomInt(1, 7);
        d.pressed[botColor] = true;
        if (d.pressed.white && d.pressed.black) d.resolveTime = true;
        broadcast(room);
        return;
    }
    if (event === 'duel_resolve') {
        if (room.resolving) return;
        const d = s.duel;
        if (!d?.resolveTime) return;
        room.resolving = true;
        finishDuel(room);
    }
}

// ── SOCKET.IO ─────────────────────────────────────────────────
io.on('connection', (socket) => {
    let playerRoom       = null;
    let playerColor      = null;
    let socketUserId     = null;
    let invalidMoveCount = 0;

    const getRoom = () => playerRoom ? rooms.get(playerRoom) : null;

    // ── MATCHMAKING ──────────────────────────────────────────────
    socket.on('queue_join', (profile) => {
        if (!checkSocketRate(socket, 'queue_join', 3, 5000)) return; // max 3 per 5s
        let { uid, nickname, avatar, token, mmr: clientMMR, match_mode } = profile || {};
        const queueMode = match_mode === 'casual' ? 'casual' : 'ranked';
        let playerId  = uid;
        let playerMMR = clientMMR || 1500;

        if (token) {
            const decoded = verifyToken(token);
            if (decoded) {
                const rec = db.prepare('SELECT mmr, ban_until, username FROM players WHERE id = ?').get(decoded.id);
                if (rec) {
                    playerId     = decoded.id;
                    playerMMR    = rec.mmr;
                    nickname     = rec.username; // always use DB username for authenticated players
                    socketUserId = decoded.id;
                    if (rec.ban_until) {
                        const banDate = new Date(rec.ban_until);
                        if (banDate > new Date()) {
                            socket.emit('banned', { until: rec.ban_until, remainMs: banDate - Date.now() });
                            return;
                        } else {
                            db.prepare('UPDATE players SET ban_until=NULL WHERE id=?').run(decoded.id);
                        }
                    }
                }
            }
        }

        if (!playerId) return;

        const VALID_AVATARS = new Set(['K', 'Q', 'R', 'B', 'N', 'P']);
        const safeAvatar    = VALID_AVATARS.has(avatar) ? avatar : 'K';

        // Remove duplicate entry
        const existing = queue.findIndex(p => p.uid === playerId);
        if (existing > -1) queue.splice(existing, 1);

        queue.push({ uid: playerId, nickname: String(nickname || 'Guerreiro').slice(0, 16), avatar: safeAvatar, timestamp: Date.now(), socketId: socket.id, match_mode: queueMode });

        if (queue.length >= 2) {
            const p1 = queue.shift();
            const p2 = queue.shift();
            const roomId = crypto.randomBytes(3).toString('hex');
            // Use p1's mode preference; both should agree since mode is chosen before queuing
            const roomMode = p1.match_mode || 'ranked';

            const _matchStartTs = Date.now();
            const newRoom = {
                id:         roomId,
                players:    { white: p1, black: p2 },
                state:      createState(),
                resolving:  false,
                timeouts:   {},
                _replay:    createReplayBuffer(),
                match_mode: roomMode,
                _startedAt: _matchStartTs,
                _ttmMs:     Math.round(((p1.timestamp ? _matchStartTs - p1.timestamp : 0) + (p2.timestamp ? _matchStartTs - p2.timestamp : 0)) / 2),
            };
            rooms.set(roomId, newRoom);
            startAFKTimer(newRoom, 'white', AFK_PREPARE_MS, 'draft');
            startAFKTimer(newRoom, 'black', AFK_PREPARE_MS, 'draft');

            const isRanked = !p1.uid.startsWith('g_') && !p2.uid.startsWith('g_') && roomMode !== 'casual';
            io.to(p1.socketId).emit('match_found', { myColor: 'white', oppProfile: { nickname: p2.nickname, avatar: p2.avatar }, roomId, isRanked });
            io.to(p2.socketId).emit('match_found', { myColor: 'black', oppProfile: { nickname: p1.nickname, avatar: p1.avatar }, roomId, isRanked });
            logEvent('draft_start', p1.uid, roomId, null);
            logEvent('draft_start', p2.uid, roomId, null);
        }
    });

    socket.on('queue_cancel', () => {
        const idx = queue.findIndex(p => p.socketId === socket.id);
        if (idx > -1) queue.splice(idx, 1);
    });

    // ── TRAINING MODE (vs Bot) ────────────────────────────────────
    socket.on('queue_train', (profile) => {
        if (!checkSocketRate(socket, 'queue_train', 3, 5000)) return;
        let { uid, nickname, avatar, token } = profile || {};
        let playerId = uid;
        if (token) {
            const decoded = verifyToken(token);
            if (decoded) {
                const rec = db.prepare('SELECT ban_until, username FROM players WHERE id=?').get(decoded.id);
                if (rec) {
                    if (rec.ban_until && new Date(rec.ban_until) > new Date()) {
                        socket.emit('banned', { until: rec.ban_until, remainMs: new Date(rec.ban_until) - Date.now() });
                        return;
                    }
                    playerId = decoded.id;
                    nickname = rec.username;
                    socketUserId = decoded.id;
                }
            }
        }
        if (!playerId) return;
        const VALID_AVATARS = new Set(['K', 'Q', 'R', 'B', 'N', 'P']);
        const safeAvatar    = VALID_AVATARS.has(avatar) ? avatar : 'K';
        const roomId  = crypto.randomBytes(3).toString('hex');
        const bot     = createBotPlayer(roomId);
        const human   = { uid: playerId, nickname: String(nickname || 'Guerreiro').slice(0, 16), avatar: safeAvatar, socketId: socket.id, timestamp: Date.now(), match_mode: 'casual' };
        const newRoom = {
            id:         roomId,
            players:    { white: human, black: bot },
            state:      createState(),
            resolving:  false,
            timeouts:   {},
            _replay:    createReplayBuffer(),
            match_mode: 'casual',
            _startedAt: Date.now(),
            _ttmMs:     0,
            _botColor:  'black',
        };
        rooms.set(roomId, newRoom);
        playerRoom  = roomId;
        playerColor = 'white';
        socket.join(roomId);
        socket.emit('match_found', { myColor: 'white', oppProfile: { nickname: bot.nickname, avatar: bot.avatar }, roomId, isRanked: false });
        startAFKTimer(newRoom, 'white', AFK_PREPARE_MS, 'draft');
        setImmediate(() => {
            const r = rooms.get(roomId);
            if (r) processBotTurn(r, 'black', (ev, data) => handleBotEvent(r, ev, data));
        });
    });

    // ── PRIVATE ROOM ─────────────────────────────────────────────
    socket.on('private_room_create', (profile) => {
        // Cancel any existing room created by this socket
        for (const [code, entry] of privateRooms.entries()) {
            if (entry.socketId === socket.id) {
                clearTimeout(entry.timer);
                privateRooms.delete(code);
            }
        }

        let { uid, nickname, avatar, token, mmr: clientMMR } = profile || {};
        let playerId = uid, playerMMR = clientMMR || 1500;
        if (token) {
            const decoded = verifyToken(token);
            if (decoded) {
                const rec = db.prepare('SELECT mmr, ban_until, username FROM players WHERE id=?').get(decoded.id);
                if (rec) {
                    if (rec.ban_until && new Date(rec.ban_until) > new Date()) {
                        socket.emit('banned', { until: rec.ban_until, remainMs: new Date(rec.ban_until) - Date.now() });
                        return;
                    }
                    playerId = decoded.id;
                    playerMMR = rec.mmr;
                    nickname  = rec.username;
                }
            }
        }
        if (!playerId) return;

        const VALID_AVATARS = new Set(['K', 'Q', 'R', 'B', 'N', 'P']);
        const safeAvatar    = VALID_AVATARS.has(avatar) ? avatar : 'K';

        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code;
        do { code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join(''); }
        while (privateRooms.has(code));

        const timer = setTimeout(() => {
            if (privateRooms.has(code)) {
                privateRooms.delete(code);
                socket.emit('private_room_expired', { code });
            }
        }, PRIVATE_ROOM_MS);

        privateRooms.set(code, {
            profile: { uid: playerId, nickname: String(nickname || 'Guerreiro').slice(0, 16), avatar: safeAvatar, mmr: playerMMR },
            socketId: socket.id,
            timer,
            createdAt: Date.now(),
        });
        socket.emit('private_room_created', { code });
    });

    socket.on('private_room_join', ({ code, profile } = {}) => {
        const entry = privateRooms.get((code || '').toUpperCase());
        if (!entry) { socket.emit('private_room_error', { error: 'Código inválido ou expirado.' }); return; }
        if (entry.socketId === socket.id) { socket.emit('private_room_error', { error: 'Você não pode entrar na sua própria sala.' }); return; }

        let { uid, nickname, avatar, token, mmr: clientMMR } = profile || {};
        let playerId = uid, playerMMR = clientMMR || 1500;
        if (token) {
            const decoded = verifyToken(token);
            if (decoded) {
                const rec = db.prepare('SELECT mmr, ban_until, username FROM players WHERE id=?').get(decoded.id);
                if (rec) {
                    if (rec.ban_until && new Date(rec.ban_until) > new Date()) {
                        socket.emit('banned', { until: rec.ban_until, remainMs: new Date(rec.ban_until) - Date.now() });
                        return;
                    }
                    playerId = decoded.id;
                    playerMMR = rec.mmr;
                    nickname  = rec.username;
                }
            }
        }
        if (!playerId) return;

        clearTimeout(entry.timer);
        privateRooms.delete(code.toUpperCase());

        const VALID_AVATARS = new Set(['K', 'Q', 'R', 'B', 'N', 'P']);
        const safeAvatar    = VALID_AVATARS.has(avatar) ? avatar : 'K';

        const p1 = { ...entry.profile, socketId: entry.socketId };
        const p2 = { uid: playerId, nickname: String(nickname || 'Guerreiro').slice(0, 16), avatar: safeAvatar, mmr: playerMMR, socketId: socket.id };
        const [white, black] = Math.random() < 0.5 ? [p1, p2] : [p2, p1];

        const roomId  = crypto.randomBytes(3).toString('hex');
        const newRoom = {
            id:         roomId,
            players:    { white, black },
            state:      createState(),
            resolving:  false,
            timeouts:   {},
            _replay:    createReplayBuffer(),
            match_mode: 'casual', // private rooms are always casual
        };
        rooms.set(roomId, newRoom);
        startAFKTimer(newRoom, 'white', AFK_PREPARE_MS, 'draft');
        startAFKTimer(newRoom, 'black', AFK_PREPARE_MS, 'draft');

        const isRanked = false; // private rooms never ranked
        io.to(white.socketId).emit('match_found', { myColor: 'white', oppProfile: { nickname: black.nickname, avatar: black.avatar }, roomId, isRanked });
        io.to(black.socketId).emit('match_found', { myColor: 'black', oppProfile: { nickname: white.nickname, avatar: white.avatar }, roomId, isRanked });
    });

    socket.on('private_room_cancel', () => {
        for (const [code, entry] of privateRooms.entries()) {
            if (entry.socketId === socket.id) {
                clearTimeout(entry.timer);
                privateRooms.delete(code);
            }
        }
    });

    socket.on('game_join', ({ roomId, color }) => {
        const room = rooms.get(roomId);
        if (!room) return;
        // Only accept if this socket was the one matched into this color
        if (room.players[color]?.socketId !== socket.id) return;
        playerRoom  = roomId;
        playerColor = color;
        socket.join(roomId);
        broadcast(room);
    });

    // ── DRAFT ────────────────────────────────────────────────────
    socket.on('draft_buy', (type) => {
        if (!checkSocketRate(socket, 'draft_buy', 10, 2000)) return; // max 10 per 2s
        const room = getRoom();
        if (!room || room.state.phase !== 'DRAFT' || !playerColor) return;
        const s   = room.state;
        const cfg = CONFIG[type];
        if (!cfg || !cfg.cost || s.ready[playerColor] || s.budget[playerColor] < cfg.cost) return;
        clearAFKTimer(room, playerColor);
        s.budget[playerColor] -= cfg.cost;
        s.inventory[playerColor].push({
            type, color: playerColor,
            id: `p_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
        });
        startAFKTimer(room, playerColor, AFK_PREPARE_MS, 'draft');
        broadcast(room);
    });

    socket.on('draft_reset', () => {
        const room = getRoom();
        if (!room || room.state.phase !== 'DRAFT' || !playerColor) return;
        const s = room.state;
        if (s.ready[playerColor]) return;
        clearAFKTimer(room, playerColor);
        s.budget[playerColor]    = 5;
        s.inventory[playerColor] = [];
        startAFKTimer(room, playerColor, AFK_PREPARE_MS, 'draft');
        broadcast(room);
    });

    socket.on('draft_ready', () => {
        const room = getRoom();
        if (!room || room.state.phase !== 'DRAFT' || !playerColor) return;
        const s = room.state;
        if (s.ready[playerColor]) return;
        clearAFKTimer(room, playerColor);
        s.ready[playerColor] = true;
        if (s.ready.white && s.ready.black) {
            logEvent('draft_complete', room.players.white?.uid, room.id, null);
            logEvent('draft_complete', room.players.black?.uid, room.id, null);
            s.phase = 'POSITION';
            s.ready = { white: false, black: false };
            logEvent('phase_enter', room.players.white?.uid, room.id, { phase: 'POSITION' });
            logEvent('phase_enter', room.players.black?.uid, room.id, { phase: 'POSITION' });
            startAFKTimer(room, 'white', AFK_PREPARE_MS, 'position');
            startAFKTimer(room, 'black', AFK_PREPARE_MS, 'position');
        }
        broadcast(room);
    });

    // ── POSITION ─────────────────────────────────────────────────
    socket.on('position_place', ({ pieceId, x, y }) => {
        const room = getRoom();
        if (!room || room.state.phase !== 'POSITION' || !playerColor) return;
        const s = room.state;
        if (s.ready[playerColor]) return;
        if (playerColor === 'white' && y >= 2) return;
        if (playerColor === 'black' && y <= 1) return;
        if (x < 0 || x > 3 || y < 0 || y > 3) return;
        if (s.army.some(p => p.x === x && p.y === y)) return;
        const invIdx = s.inventory[playerColor].findIndex(p => p.id === pieceId);
        if (invIdx === -1) return;
        clearAFKTimer(room, playerColor);
        const piece = s.inventory[playerColor].splice(invIdx, 1)[0];
        s.army.push({ id: piece.id, type: piece.type, color: playerColor, x, y, bonus: CONFIG[piece.type].bonus, buffed: false });
        startAFKTimer(room, playerColor, AFK_PREPARE_MS, 'position');
        broadcast(room);
    });

    socket.on('position_return', (pieceId) => {
        const room = getRoom();
        if (!room || room.state.phase !== 'POSITION' || !playerColor) return;
        const s   = room.state;
        if (s.ready[playerColor]) return;
        const idx = s.army.findIndex(p => p.id === pieceId && p.color === playerColor && p.type !== 'K');
        if (idx === -1) return;
        clearAFKTimer(room, playerColor);
        const piece = s.army.splice(idx, 1)[0];
        s.inventory[playerColor].push({ type: piece.type, color: playerColor, id: piece.id });
        startAFKTimer(room, playerColor, AFK_PREPARE_MS, 'position');
        broadcast(room);
    });

    socket.on('position_ready', () => {
        const room = getRoom();
        if (!room || room.state.phase !== 'POSITION' || !playerColor) return;
        const s = room.state;
        if (s.ready[playerColor]) return;
        clearAFKTimer(room, playerColor);
        s.ready[playerColor] = true;
        if (s.ready.white && s.ready.black) {
            // Turno 0: snapshot do posicionamento para replay
            recordTurn(room._replay, { type: 'position', ...buildTurnSnapshot(s) });
            s.phase = 'REVEAL';
            s.ready = { white: false, black: false };
            setTimeout(() => {
                const r = rooms.get(room.id);
                if (r && r.state.phase === 'REVEAL') {
                    r.state.phase = 'ACTION';
                    startAFKTimer(r, 'white', AFK_ACTION_MS, 'action');
                    startAFKTimer(r, 'black', AFK_ACTION_MS, 'action');
                    broadcast(r);
                }
            }, 3000);
        }
        broadcast(room);
    });

    // ── ACTION ───────────────────────────────────────────────────
    socket.on('action_plan', ({ pieceId, tx, ty }) => {
        if (!checkSocketRate(socket, 'action_plan', 5, 1000)) return; // max 5 per 1s
        const room = getRoom();
        if (!room || room.state.phase !== 'ACTION' || !playerColor) return;
        const s = room.state;
        if (s.ready[playerColor] || s.duel.active) return;
        const piece = s.army.find(p => p.id === pieceId && p.color === playerColor);
        if (!piece || !isValidMove(piece, tx, ty, s.army)) {
            invalidMoveCount++;
            if (invalidMoveCount > 15) console.warn(`[ANTICHEAT] Socket ${socket.id} — ${invalidMoveCount} tentativas inválidas.`);
            return;
        }
        clearAFKTimer(room, playerColor);
        s.planning[playerColor] = { pieceId, tx, ty };
        startAFKTimer(room, playerColor, AFK_ACTION_MS, 'action');
        broadcast(room);
    });

    socket.on('action_ready', () => {
        const room = getRoom();
        if (!room || room.state.phase !== 'ACTION' || !playerColor) return;
        const s = room.state;
        if (s.ready[playerColor] || s.duel.active) return;
        clearAFKTimer(room, playerColor);
        s.ready[playerColor] = true;
        if (s.ready.white && s.ready.black) {
            clearAFKTimer(room, 'white');
            clearAFKTimer(room, 'black');
            const planningSnap = {
                white: s.planning.white ? { ...s.planning.white } : null,
                black: s.planning.black ? { ...s.planning.black } : null,
            };
            resolveAction(s);
            if (room._replay) {
                recordTurn(room._replay, { type: 'action', planning: planningSnap, ...buildTurnSnapshot(s) });
            }
            // Morte Súbita: schedule King vs King duel after 3s announce phase
            if (s.phase === 'SUDDEN_DEATH') {
                setTimeout(() => {
                    const r = rooms.get(room.id);
                    if (!r || r.state.phase !== 'SUDDEN_DEATH') return;
                    const kW = r.state.army.find(k => k.color === 'white');
                    const kB = r.state.army.find(k => k.color === 'black');
                    if (!kW || !kB) return;
                    r.state.duel = {
                        active: true, resolveTime: false, wPiece: kW, bPiece: kB,
                        suddenDeath: true,
                        pressed: { white: false, black: false },
                        rolls:   { white: 0,     black: 0     },
                    };
                    broadcast(r);
                }, 3_000);
            }
        }
        broadcast(room);
    });

    // ── DUEL ─────────────────────────────────────────────────────
    socket.on('roll_dice', () => {
        if (!checkSocketRate(socket, 'roll_dice', 3, 2000)) return; // max 3 per 2s
        const room = getRoom();
        if (!room || !playerColor) return;
        const s = room.state;
        const d = s.duel;
        if (!d.active || d.resolveTime || d.pressed[playerColor]) return;
        d.rolls[playerColor]   = crypto.randomInt(1, 7);
        d.pressed[playerColor] = true;
        if (d.pressed.white && d.pressed.black) d.resolveTime = true;
        broadcast(room);
    });

    socket.on('duel_resolve', () => {
        if (!checkSocketRate(socket, 'duel_resolve', 3, 2000)) return;
        const room = getRoom();
        if (!room || room.resolving) return;
        const d = room.state?.duel;
        if (!d?.resolveTime) return;
        room.resolving = true;
        finishDuel(room);
    });

    // ── DISCONNECT ───────────────────────────────────────────────
    socket.on('disconnect', () => {
        if (socketUserId) logEvent('session_end', socketUserId, null, null);
        const qi = queue.findIndex(p => p.socketId === socket.id);
        if (qi > -1) queue.splice(qi, 1);

        for (const [code, entry] of privateRooms.entries()) {
            if (entry.socketId === socket.id) {
                clearTimeout(entry.timer);
                privateRooms.delete(code);
            }
        }

        if (!playerRoom || !playerColor) return;
        const room = rooms.get(playerRoom);
        if (!room || room.state.phase === 'GAMEOVER') return;

        // Bot room: just end silently, no WO or reconnect
        if (room._botColor) {
            clearAFKTimer(room, 'white');
            clearAFKTimer(room, 'black');
            room.state.phase = 'GAMEOVER';
            scheduleRoomCleanup(playerRoom);
            return;
        }

        const oppColor  = playerColor === 'white' ? 'black' : 'white';
        const playerUid = room.players[playerColor]?.uid;
        const isAuth    = !!(playerUid && db.prepare('SELECT id FROM players WHERE id=?').get(playerUid));

        clearAFKTimer(room, 'white');
        clearAFKTimer(room, 'black');

        if (isAuth) {
            // Authenticated: 60s reconnection window
            const reconnectTimer = setTimeout(() => {
                pendingReconnects.delete(playerUid);
                const roomNow = rooms.get(playerRoom);
                if (!roomNow || roomNow.state.phase === 'GAMEOVER') return;
                roomNow.state.phase = 'GAMEOVER';
                roomNow.state.wo    = true;
                roomNow.state.army  = roomNow.state.army.filter(p => !(p.type === 'K' && p.color === playerColor));
                persistMatchResult(roomNow, oppColor, true);
                const opp = roomNow.players[oppColor];
                if (opp) io.to(opp.socketId).emit('game_state', roomNow.state);
                scheduleRoomCleanup(playerRoom);
            }, RECONNECT_MS);

            pendingReconnects.set(playerUid, { roomId: playerRoom, color: playerColor, timer: reconnectTimer });
            logEvent('disconnect_ingame', playerUid, room._matchId || room.id, { phase: room.state.phase });
            const opp = room.players[oppColor];
            if (opp) io.to(opp.socketId).emit('opponent_reconnecting', { remainMs: RECONNECT_MS });
            console.log(`[RECONNECT] ${playerUid} desconectou — aguardando 60s`);
        } else {
            // Guest: WO imediato
            room.state.phase = 'GAMEOVER';
            room.state.wo    = true;
            room.state.army  = room.state.army.filter(p => !(p.type === 'K' && p.color === playerColor));
            persistMatchResult(room, oppColor, true);
            const opp = room.players[oppColor];
            if (opp) io.to(opp.socketId).emit('game_state', room.state);
            scheduleRoomCleanup(playerRoom);
        }
    });

    // ── REJOIN ───────────────────────────────────────────────────
    socket.on('rejoin_game', ({ token } = {}) => {
        if (!token) return;
        const decoded = verifyToken(token);
        if (!decoded) return;

        const pending = pendingReconnects.get(decoded.id);
        if (!pending) { logEvent('reconnect_fail', decoded.id, null, { reason: 'no_pending' }); socket.emit('rejoin_failed', { reason: 'no_pending' }); return; }

        clearTimeout(pending.timer);
        pendingReconnects.delete(decoded.id);

        const room = rooms.get(pending.roomId);
        if (!room || room.state.phase === 'GAMEOVER') {
            socket.emit('rejoin_failed', { reason: 'game_over' }); return;
        }

        room.players[pending.color].socketId = socket.id;
        playerRoom  = pending.roomId;
        playerColor = pending.color;
        socket.join(pending.roomId);

        // Restaurar AFK timer da fase atual
        const phase = room.state.phase;
        if (phase === 'DRAFT' || phase === 'POSITION') {
            startAFKTimer(room, pending.color, AFK_PREPARE_MS, phase.toLowerCase());
        } else if (phase === 'ACTION') {
            startAFKTimer(room, pending.color, AFK_ACTION_MS, 'action');
        }

        const oppColor = pending.color === 'white' ? 'black' : 'white';
        const opp = room.players[oppColor];
        if (opp) io.to(opp.socketId).emit('opponent_reconnected');

        socket.emit('game_state', room.state);
        socket.emit('rejoin_success', { roomId: pending.roomId, color: pending.color });
        logEvent('reconnect_success', decoded.id, room._matchId || pending.roomId, { roomId: pending.roomId });
        console.log(`[RECONNECT] ${decoded.id} reconectado à sala ${pending.roomId}`);
    });
});

setInterval(() => {
    db.prepare('INSERT INTO ccu_snapshots (ts, count) VALUES (?, ?)').run(Date.now(), io.engine.clientsCount ?? 0);
}, 5 * 60 * 1000);

// ── ORPHAN CLEANUP: privateRooms ──────────────────────────────
// Belt-and-suspenders sweep; individual entries already have 5-min timers.
setInterval(() => {
    const stale = Date.now() - PRIVATE_ROOM_MS - 60_000;
    for (const [code, entry] of privateRooms.entries()) {
        if ((entry.createdAt || 0) < stale) {
            clearTimeout(entry.timer);
            privateRooms.delete(code);
        }
    }
}, 10 * 60_000);

// ── GRACEFUL SHUTDOWN ─────────────────────────────────────────
function gracefulShutdown(signal) {
    console.log(`[SHUTDOWN] ${signal} recebido — encerrando graciosamente`);
    io.emit('server_restart', { message: 'Servidor reiniciando. Reconecte em instantes.' });
    server.close(() => {
        try { db.close(); } catch (_) {}
        process.exit(0);
    });
    setTimeout(() => process.exit(1), 15_000).unref();
}
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

// ── EXCEPTION GUARDS ──────────────────────────────────────────
process.on('uncaughtException', (err) => {
    console.error('[CRASH] uncaughtException:', err);
});
process.on('unhandledRejection', (reason) => {
    console.error('[CRASH] unhandledRejection:', reason);
});

server.listen(PORT, () => {
    console.log(`microChess server running on port ${PORT}`);
    db.prepare('INSERT INTO server_starts (ts, node_version) VALUES (?, ?)').run(Date.now(), process.version);
});
