'use strict';

const aiChatService = require('../services/aiChat.service');
const { success, paginated, error } = require('../utils/response');

exports.createSession = async (req, res) => {
  try {
    const { scope, shop_id } = req.body;
    if (!scope || !['global', 'shop'].includes(scope)) {
      return error(res, "scope harus 'global' atau 'shop'", 400);
    }
    if (scope === 'shop' && !shop_id) {
      return error(res, "shop_id wajib diisi untuk scope 'shop'", 400);
    }
    const data = await aiChatService.createSession(req.user.id, { scope, shop_id });
    return success(res, data, 'Sesi berhasil dibuat', 201);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.listSessions = async (req, res) => {
  try {
    const { data, meta } = await aiChatService.listSessions(req.user.id, req.query);
    return paginated(res, data, meta, 'Daftar sesi berhasil diambil');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.getSession = async (req, res) => {
  try {
    const data = await aiChatService.getSession(req.params.sessionId, req.user.id);
    return success(res, data, 'Detail sesi berhasil diambil');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.deleteSession = async (req, res) => {
  try {
    await aiChatService.deleteSession(req.params.sessionId, req.user.id);
    return success(res, null, 'Sesi berhasil dihapus');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.chat = async (req, res) => {
  try {
    const { message: question } = req.body;
    if (!question?.trim()) {
      return error(res, 'message tidak boleh kosong', 400);
    }
    const data = await aiChatService.chat(req.params.sessionId, req.user.id, question.trim());
    return success(res, data, 'Query berhasil diproses');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};
