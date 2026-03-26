import { createHttpError } from '../utils/httpError.js';

export const validateRegisterInput = ({ name, email, password }) => {
  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    throw createHttpError(400, 'Name, email, and password are required.');
  }

  if (String(password).length < 6) {
    throw createHttpError(400, 'Password must be at least 6 characters.');
  }
};

export const validateLoginInput = ({ email, password }) => {
  if (!email?.trim() || !password?.trim()) {
    throw createHttpError(400, 'Email and password are required.');
  }
};
