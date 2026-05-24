'use strict';

const { AiChatSession, AiChatMessage, Shop } = require('../models');

const aiUrl = () => process.env.AI_SERVICE_URL  || 'http://localhost:8000';
const aiKey = () => process.env.AI_INTERNAL_KEY || '';

async function createSession(userId, { scope, shop_id }) {
  return AiChatSession.create({
    user_id: userId,
    scope,
    shop_id: scope === 'shop' ? shop_id : null,
  });
}

async function listSessions(userId, { scope, page = 1, limit = 20 }) {
  const where = { user_id: userId };
  if (scope) where.scope = scope;

  const p = parseInt(page, 10);
  const l = parseInt(limit, 10);

  const { count, rows } = await AiChatSession.findAndCountAll({
    where,
    include: [{ model: Shop, attributes: ['id', 'name'] }],
    order: [['last_active_at', 'DESC']],
    limit: l,
    offset: (p - 1) * l,
  });

  return {
    data: rows,
    meta: { total: count, page: p, limit: l, totalPages: Math.ceil(count / l) },
  };
}

async function getSession(sessionId, userId) {
  const session = await AiChatSession.findOne({
    where: { id: sessionId, user_id: userId },
    include: [
      { model: Shop, attributes: ['id', 'name'] },
      { model: AiChatMessage, as: 'messages', separate: true, order: [['created_at', 'ASC']] },
    ],
  });
  if (!session) {
    const err = new Error('Sesi tidak ditemukan');
    err.status = 404;
    throw err;
  }
  return session;
}

async function deleteSession(sessionId, userId) {
  const session = await AiChatSession.findOne({ where: { id: sessionId, user_id: userId } });
  if (!session) {
    const err = new Error('Sesi tidak ditemukan');
    err.status = 404;
    throw err;
  }
  await session.destroy();
}

async function chat(sessionId, userId, question) {
  const session = await AiChatSession.findOne({ where: { id: sessionId, user_id: userId } });
  if (!session) {
    const err = new Error('Sesi tidak ditemukan');
    err.status = 404;
    throw err;
  }

  let res;
  try {
    res = await fetch(`${aiUrl()}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Key': aiKey(),
      },
      body: JSON.stringify({ message: question, session_id: sessionId }),
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    const err = new Error('AI service tidak dapat dihubungi');
    err.status = 502;
    throw err;
  }

  const body = await res.json().catch(() => ({ detail: 'AI service error' }));
  if (!res.ok) {
    const err = new Error(body.detail || 'AI service error');
    err.status = res.status === 422 ? 422 : 502;
    throw err;
  }

  return body;
}

module.exports = { createSession, listSessions, getSession, deleteSession, chat };
