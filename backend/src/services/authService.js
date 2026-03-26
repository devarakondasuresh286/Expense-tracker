import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { createHttpError } from '../utils/httpError.js';

const toUserPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
});

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

export const register = async ({ name, email, password }) => {
  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });

  if (existing) {
    throw createHttpError(409, 'Email already registered.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    friends: [],
  });

  return {
    token: signToken(user._id),
    user: toUserPayload(user),
  };
};

export const login = async ({ email, password }) => {
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw createHttpError(401, 'Invalid credentials.');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw createHttpError(401, 'Invalid credentials.');
  }

  return {
    token: signToken(user._id),
    user: toUserPayload(user),
  };
};

export const getMe = async (user) => ({ user: toUserPayload(user) });
