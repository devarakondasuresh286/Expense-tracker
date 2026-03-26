import { validateLoginInput, validateRegisterInput } from '../validations/authValidation.js';
import * as authService from '../services/authService.js';

export const register = async (req, res) => {
  validateRegisterInput(req.body || {});
  const result = await authService.register(req.body);
  return res.status(201).json(result);
};

export const login = async (req, res) => {
  validateLoginInput(req.body || {});
  const result = await authService.login(req.body);
  return res.json(result);
};

export const me = async (req, res) => {
  const result = await authService.getMe(req.user);
  return res.json(result);
};
