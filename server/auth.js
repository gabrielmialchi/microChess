'use strict';

const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');

const JWT_SECRET  = process.env.JWT_SECRET || 'microchess-secret-dev-key';
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
