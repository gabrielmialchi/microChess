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

module.exports = { isPathClear, isValidMove };
