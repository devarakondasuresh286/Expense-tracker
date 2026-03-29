import * as analyticsService from '../services/analyticsService.js';
import { createHttpError } from '../utils/httpError.js';

export const getSummary = async (req, res) => {
  const result = await analyticsService.getSummary(req.user._id);
  return res.json(result);
};

export const getBalances = async (req, res) => {
  const result = await analyticsService.getBalances(req.user._id);
  return res.json(result);
};

export const settleUp = async (req, res) => {
  if (!req.body?.groupId || !req.body?.userId) {
    throw createHttpError(400, 'groupId and userId are required.');
  }

  const result = await analyticsService.settleUp({
    currentUserId: req.user._id,
    groupId: req.body.groupId,
    userId: req.body.userId,
  });

  return res.json(result);
};
