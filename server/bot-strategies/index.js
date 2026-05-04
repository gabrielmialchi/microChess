'use strict';

const _strategies = {
    0: require('./00-default'),
    1: require('./01-recruta'),
    2: require('./02-aprendiz'),
    3: require('./03-defensor'),
    4: require('./04-atirador'),
    5: require('./05-cavaleiro'),
    6: require('./06-bispeiro'),
    7:  require('./07-tanque'),
    8:  require('./08-cacador'),
    9:  require('./09-estrategista'),
    10: require('./10-duelista'),
    11: require('./11-cercador'),
    12: require('./12-iscador'),
    13: require('./13-rainha'),
    14: require('./14-mestre'),
    15: require('./15-lenda'),
};

function getStrategy(strategyId) {
    const id = Number.isInteger(strategyId) ? strategyId : 0;
    return _strategies[id] || _strategies[0];
}

function listStrategies() {
    return Object.keys(_strategies).map(k => ({
        id:   _strategies[k].id,
        name: _strategies[k].name,
    }));
}

module.exports = { getStrategy, listStrategies };
