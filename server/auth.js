'use strict';

const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
    console.error('[SECURITY] CRÍTICO: JWT_SECRET não definido. Defina a variável de ambiente antes de iniciar o servidor.');
    process.exit(1);
}
const JWT_SECRET  = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;
const JWT_EXPIRES = '30d';

async function hashPassword(plain) {
    return bcrypt.hash(plain, SALT_ROUNDS);
}

async function checkPassword(plain, hash) {
    return bcrypt.compare(plain, hash);
}

function signToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}

module.exports = { hashPassword, checkPassword, signToken, verifyToken };
