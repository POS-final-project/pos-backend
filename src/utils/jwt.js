'use strict';

const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET environment variable is not set');
if (!process.env.JWT_REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET environment variable is not set');
if (!process.env.JWT_RESET_SECRET) throw new Error('JWT_RESET_SECRET environment variable is not set');

const ACCESS_SECRET  = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const RESET_SECRET   = process.env.JWT_RESET_SECRET;

exports.signAccess = (payload) =>
  jwt.sign(payload, ACCESS_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });

exports.signRefresh = (payload) =>
  jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });

exports.signReset = (payload) =>
  jwt.sign(payload, RESET_SECRET, { expiresIn: '15m' });

exports.verifyAccess  = (token) => jwt.verify(token, ACCESS_SECRET);
exports.verifyRefresh = (token) => jwt.verify(token, REFRESH_SECRET);
exports.verifyReset   = (token) => jwt.verify(token, RESET_SECRET);
