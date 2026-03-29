import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { createHttpError } from '../utils/httpError.js';

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return next(
      createHttpError(401, 'Authorization token is missing.', {
        code: 'UNAUTHORIZED',
      }),
    );
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.userId).select('-passwordHash');

    if (!user) {
      return next(
        createHttpError(401, 'Invalid token user.', {
          code: 'INVALID_TOKEN_USER',
        }),
      );
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return next(
        createHttpError(401, 'Invalid or expired token.', {
          code: 'INVALID_TOKEN',
        }),
      );
    }

    return next(error);
  }
};
