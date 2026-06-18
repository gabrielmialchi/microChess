'use strict';

/**
 * movegen.js — Validação de movimentos isolada do servidor.
 * Importada por server.js e pelos testes unitários.
 */

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
            // Peão não tem mais estado "buffed": ao chegar ao fundo promove a Rainha (ver promotePawns).
            const isEnemy = target && target.color !== p.color;
            const fwd     = p.color === 'white' ? 1 : -1;
            const diffY   = ty - p.y;
            if (isEnemy  && dx === 1 && diffY === fwd) ok = true;
            if (!isEnemy && dx === 0 && Math.abs(dy) === 1) ok = true;
            break;
        }
    }
    if (!ok) return false;
    if (['Q', 'R', 'B'].includes(p.type) && !isPathClear(p, tx, ty, army)) return false;
    return true;
}

/**
 * Promove peões que alcançaram o fundo oposto: viram Rainha (bônus 5).
 * Idempotente — chamar sempre que a posição do exército for finalizada.
 * @param {Array} army  lista de peças (mutada in-place)
 */
function promotePawns(army) {
    for (const p of army) {
        if (p.type === 'P' &&
            ((p.color === 'white' && p.y === 3) || (p.color === 'black' && p.y === 0))) {
            p.type  = 'N'; // Peão promove a Cavalo (não Rainha) — S26 rebalance OT-06
            p.bonus = 3;   // = CONFIG.N.bonus
            delete p.buffed;
        }
    }
}

module.exports = { isPathClear, isValidMove, promotePawns };
