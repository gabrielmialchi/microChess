'use strict';
const { legalMoves, manhattanDist, pieceBonus, findKing } = require('./_helpers');

function getAllMoves(state, color) {
    const moves = [];
    for (const piece of state.army) {
        if (piece.color !== color) continue;
        for (const m of legalMoves(piece, state)) {
            moves.push({ piece, tx: m.tx, ty: m.ty });
        }
    }
    return moves;
}

// Aplica move + resolve duel via heurística (maior bonus vence; >= = atacante vence em empate)
function simulateMove(state, move, color) {
    const newArmy = state.army.map(p => ({ ...p }));
    const myIdx   = newArmy.findIndex(p => p.id === move.piece.id);
    if (myIdx < 0) return state; // peça morreu antes? sem mudança

    const enemyIdx = newArmy.findIndex(p =>
        p.x === move.tx && p.y === move.ty && p.color !== color
    );

    if (enemyIdx >= 0) {
        const myBonus = pieceBonus(newArmy[myIdx].type);
        const enBonus = pieceBonus(newArmy[enemyIdx].type);
        if (myBonus >= enBonus) {
            // atacante vence — remove enemy + move atacante
            newArmy.splice(enemyIdx, 1);
            const newMyIdx = newArmy.findIndex(p => p.id === move.piece.id);
            newArmy[newMyIdx].x = move.tx;
            newArmy[newMyIdx].y = move.ty;
        } else {
            // atacante perde — remove atacante
            newArmy.splice(myIdx, 1);
        }
    } else {
        newArmy[myIdx].x = move.tx;
        newArmy[myIdx].y = move.ty;
    }

    return { ...state, army: newArmy };
}

function evaluate(simState, myColor) {
    const oppColor = myColor === 'white' ? 'black' : 'white';

    let myMaterial = 0, oppMaterial = 0;
    for (const p of simState.army) {
        const b = pieceBonus(p.type);
        if (p.color === myColor) myMaterial += b; else oppMaterial += b;
    }

    const myKing  = findKing(simState, myColor);
    const oppKing = findKing(simState, oppColor);

    if (!myKing)  return -1000;  // meu King morto = catastrófico
    if (!oppKing) return  1000;  // opp King morto = vitória

    let minEnemyDistToMyKing = 99;
    let minMyDistToOppKing   = 99;
    for (const p of simState.army) {
        if (p.color === oppColor) {
            const d = manhattanDist(p, myKing);
            if (d < minEnemyDistToMyKing) minEnemyDistToMyKing = d;
        } else if (p.color === myColor && p.type !== 'K') {
            const d = manhattanDist(p, oppKing);
            if (d < minMyDistToOppKing) minMyDistToOppKing = d;
        }
    }

    const myKingSafe   = minEnemyDistToMyKing >= 2 ? 2 : 0;
    const oppKingThreat = minMyDistToOppKing   <= 1 ? 3 : 0;

    return (myMaterial - oppMaterial) * 1.5 + myKingSafe + oppKingThreat;
}

// Retorna lista de { move, score } ordenada DESC (maior score = melhor para mim)
// score = pior cenário após resposta do oponente (minimax 2-ply)
function scoreMoves(state, color) {
    const oppColor = color === 'white' ? 'black' : 'white';
    const myMoves  = getAllMoves(state, color);

    return myMoves.map(moveA => {
        const state1   = simulateMove(state, moveA, color);
        const oppMoves = getAllMoves(state1, oppColor);

        let worstForMe;
        if (oppMoves.length === 0) {
            worstForMe = evaluate(state1, color);
        } else {
            worstForMe = +Infinity;
            for (const moveB of oppMoves) {
                const state2 = simulateMove(state1, moveB, oppColor);
                const s = evaluate(state2, color);
                if (s < worstForMe) worstForMe = s;
            }
        }
        return { move: moveA, score: worstForMe };
    }).sort((a, b) => b.score - a.score);
}

module.exports = { getAllMoves, simulateMove, evaluate, scoreMoves };
