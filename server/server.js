'use strict';
const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const crypto  = require('crypto');
const path    = require('path');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });
const PORT   = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '../html')));
app.get('/health', (_, res) => res.json({ ok: true }));

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
const queue = [];      // { uid, nickname, avatar, timestamp, socketId }
const rooms = new Map(); // roomId → { id, players, state, resolving }

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

function broadcast(room) {
    const { white, black } = room.players;
    io.to(white.socketId).emit('game_state', room.state);
    io.to(black.socketId).emit('game_state', room.state);
}

// ── MOVE VALIDATION (server-side) ─────────────────────────────
function isPathClear(p, tx, ty, army) {
    const dx = Math.sign(tx - p.x), dy = Math.sign(ty - p.y);
    let cx = p.x + dx, cy = p.y + dy, limit = 0;
    while ((cx !== tx || cy !== ty) && limit < 10) {
        if (army.some(a => a.x === cx && a.y === cy)) return false;
        cx += dx; cy += dy; limit++;
    }
    return true;
}

function isValidMove(p, tx, ty, army) {
    const dx = Math.abs(tx - p.x), dy = Math.abs(ty - p.y);
    if (dx === 0 && dy === 0) return false;
    if (tx < 0 || tx > 3 || ty < 0 || ty > 3) return false;
    const target = army.find(a => a.x === tx && a.y === ty);
    if (target && target.color === p.color) return false;

    let ok = false;
    switch (p.type) {
        case 'K': ok = (dx <= 1 && dy <= 1); break;
        case 'Q': ok = (dx === dy || dx === 0 || dy === 0); break;
        case 'R': ok = (dx === 0 || dy === 0); break;
        case 'B': ok = (dx === dy); break;
        case 'N': ok = ((dx === 1 && dy === 2) || (dx === 2 && dy === 1)); break;
        case 'P': {
            const isEnemy = target && target.color !== p.color;
            const fwd     = p.color === 'white' ? 1 : -1;
            const diffY   = ty - p.y;
            if (p.buffed) {
                if (isEnemy  && dx === 1 && Math.abs(dy) === 1) ok = true;
                if (!isEnemy && ((dx === 0 && Math.abs(dy) === 1) || (dx === 1 && dy === 0))) ok = true;
            } else {
                if (isEnemy  && dx === 1 && diffY === fwd) ok = true;
                if (!isEnemy && dx === 0 && Math.abs(dy) === 1) ok = true;
            }
            break;
        }
    }
    if (!ok) return false;
    if (['Q', 'R', 'B'].includes(p.type) && !isPathClear(p, tx, ty, army)) return false;
    return true;
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
            duelQueue.push({ type: 'frontal', wPiece: pieceW, bPiece: pieceB, txW: pW.tx, tyW: pW.ty, txB: pB.tx, tyB: pB.ty, priority: pieceW.bonus, suddenDeath: true });
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
        const kW = army.find(k => k.color === 'white');
        const kB = army.find(k => k.color === 'black');
        currentDuel = { active: true, resolveTime: false, wPiece: kW, bPiece: kB,
                        suddenDeath: true,
                        pressed: { white: false, black: false },
                        rolls:   { white: 0,     black: 0     } };
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
        // Tie: King always survives
        if (d.wPiece.type === 'K') {
            army = army.filter(a => a.id !== d.bPiece.id);
        } else if (d.bPiece.type === 'K') {
            army = army.filter(a => a.id !== d.wPiece.id);
        } else {
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
        broadcast(room);
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
        const kW = army.find(k => k.color === 'white');
        const kB = army.find(k => k.color === 'black');
        state.army      = army;
        state.duel      = { active: true, resolveTime: false, wPiece: kW, bPiece: kB,
                            suddenDeath: true,
                            pressed: { white: false, black: false },
                            rolls:   { white: 0,     black: 0     } };
        state.duelQueue = [];
        room.resolving  = false;
        broadcast(room);
        return;
    }

    state.army      = army;
    state.duel      = { active: false };
    state.duelQueue = [];
    state.phase     = 'ACTION';
    room.resolving  = false;
    broadcast(room);
}

// ── SOCKET.IO ─────────────────────────────────────────────────
io.on('connection', (socket) => {
    let playerRoom  = null;
    let playerColor = null;

    const getRoom = () => playerRoom ? rooms.get(playerRoom) : null;

    // ── MATCHMAKING ──────────────────────────────────────────────
    socket.on('queue_join', (profile) => {
        const { uid, nickname, avatar } = profile || {};
        if (!uid) return;

        // Remove duplicate entry
        const existing = queue.findIndex(p => p.uid === uid);
        if (existing > -1) queue.splice(existing, 1);

        queue.push({ uid, nickname: String(nickname || 'Guerreiro').slice(0, 16), avatar: avatar || 'K', timestamp: Date.now(), socketId: socket.id });

        if (queue.length >= 2) {
            const p1 = queue.shift();
            const p2 = queue.shift();
            const roomId = crypto.randomBytes(3).toString('hex');

            rooms.set(roomId, {
                id:        roomId,
                players:   { white: p1, black: p2 },
                state:     createState(),
                resolving: false,
            });

            io.to(p1.socketId).emit('match_found', { myColor: 'white', oppProfile: { nickname: p2.nickname, avatar: p2.avatar }, roomId });
            io.to(p2.socketId).emit('match_found', { myColor: 'black', oppProfile: { nickname: p1.nickname, avatar: p1.avatar }, roomId });
        }
    });

    socket.on('queue_cancel', () => {
        const idx = queue.findIndex(p => p.socketId === socket.id);
        if (idx > -1) queue.splice(idx, 1);
    });

    socket.on('game_join', ({ roomId, color }) => {
        playerRoom  = roomId;
        playerColor = color;
        socket.join(roomId);
        const room = rooms.get(roomId);
        if (room) {
            // Update socket id in players (handle reconnect)
            if (room.players[color]) room.players[color].socketId = socket.id;
            broadcast(room);
        }
    });

    // ── DRAFT ────────────────────────────────────────────────────
    socket.on('draft_buy', (type) => {
        const room = getRoom();
        if (!room || room.state.phase !== 'DRAFT' || !playerColor) return;
        const s   = room.state;
        const cfg = CONFIG[type];
        if (!cfg || !cfg.cost || s.ready[playerColor] || s.budget[playerColor] < cfg.cost) return;
        s.budget[playerColor] -= cfg.cost;
        s.inventory[playerColor].push({
            type, color: playerColor,
            id: `p_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
        });
        broadcast(room);
    });

    socket.on('draft_reset', () => {
        const room = getRoom();
        if (!room || room.state.phase !== 'DRAFT' || !playerColor) return;
        const s = room.state;
        if (s.ready[playerColor]) return;
        s.budget[playerColor]    = 5;
        s.inventory[playerColor] = [];
        broadcast(room);
    });

    socket.on('draft_ready', () => {
        const room = getRoom();
        if (!room || room.state.phase !== 'DRAFT' || !playerColor) return;
        const s = room.state;
        if (s.ready[playerColor]) return;
        s.ready[playerColor] = true;
        if (s.ready.white && s.ready.black) {
            s.phase = 'POSITION';
            s.ready = { white: false, black: false };
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
        const piece = s.inventory[playerColor].splice(invIdx, 1)[0];
        s.army.push({ id: piece.id, type: piece.type, color: playerColor, x, y, bonus: CONFIG[piece.type].bonus, buffed: false });
        broadcast(room);
    });

    socket.on('position_return', (pieceId) => {
        const room = getRoom();
        if (!room || room.state.phase !== 'POSITION' || !playerColor) return;
        const s   = room.state;
        if (s.ready[playerColor]) return;
        const idx = s.army.findIndex(p => p.id === pieceId && p.color === playerColor && p.type !== 'K');
        if (idx === -1) return;
        const piece = s.army.splice(idx, 1)[0];
        s.inventory[playerColor].push({ type: piece.type, color: playerColor, id: piece.id });
        broadcast(room);
    });

    socket.on('position_ready', () => {
        const room = getRoom();
        if (!room || room.state.phase !== 'POSITION' || !playerColor) return;
        const s = room.state;
        if (s.ready[playerColor]) return;
        s.ready[playerColor] = true;
        if (s.ready.white && s.ready.black) {
            s.phase = 'REVEAL';
            s.ready = { white: false, black: false };
            setTimeout(() => {
                const r = rooms.get(room.id);
                if (r && r.state.phase === 'REVEAL') {
                    r.state.phase = 'ACTION';
                    broadcast(r);
                }
            }, 3000);
        }
        broadcast(room);
    });

    // ── ACTION ───────────────────────────────────────────────────
    socket.on('action_plan', ({ pieceId, tx, ty }) => {
        const room = getRoom();
        if (!room || room.state.phase !== 'ACTION' || !playerColor) return;
        const s = room.state;
        if (s.ready[playerColor] || s.duel.active) return;
        const piece = s.army.find(p => p.id === pieceId && p.color === playerColor);
        if (!piece || !isValidMove(piece, tx, ty, s.army)) return;
        s.planning[playerColor] = { pieceId, tx, ty };
        broadcast(room);
    });

    socket.on('action_ready', () => {
        const room = getRoom();
        if (!room || room.state.phase !== 'ACTION' || !playerColor) return;
        const s = room.state;
        if (s.ready[playerColor] || s.duel.active) return;
        s.ready[playerColor] = true;
        if (s.ready.white && s.ready.black) {
            resolveAction(s);
        }
        broadcast(room);
    });

    // ── DUEL ─────────────────────────────────────────────────────
    socket.on('roll_dice', () => {
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
        const room = getRoom();
        if (!room || room.resolving) return;
        room.resolving = true;
        finishDuel(room);
    });

    // ── DISCONNECT ───────────────────────────────────────────────
    socket.on('disconnect', () => {
        const qi = queue.findIndex(p => p.socketId === socket.id);
        if (qi > -1) queue.splice(qi, 1);

        if (playerRoom && playerColor) {
            const room = rooms.get(playerRoom);
            if (room && room.state.phase !== 'GAMEOVER') {
                const oppColor = playerColor === 'white' ? 'black' : 'white';
                room.state.phase = 'GAMEOVER';
                room.state.wo    = true;
                room.state.army  = room.state.army.filter(p => !(p.type === 'K' && p.color === playerColor));
                const opp = room.players[oppColor];
                if (opp) io.to(opp.socketId).emit('game_state', room.state);
                // Clean up room after delay
                setTimeout(() => rooms.delete(playerRoom), 60000);
            }
        }
    });
});

server.listen(PORT, () => console.log(`microChess server running on port ${PORT}`));
