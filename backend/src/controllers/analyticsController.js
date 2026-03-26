import * as analyticsService from '../services/analyticsService.js';

export const getSummary = async (req, res) => {
  const result = await analyticsService.getSummary(req.user._id);
  return res.json(result);
};

export const getBalances = async (req, res) => {
  const result = await analyticsService.getBalances(req.user._id);
  return res.json(result);
};
