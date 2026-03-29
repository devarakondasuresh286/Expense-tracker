import { createHttpError, normalizeHttpStatus } from '../utils/httpError.js';

const DEFAULT_MESSAGES = {
  400: 'Bad request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not found',
  500: 'Internal server error',
};

const DEFAULT_CODES = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  500: 'INTERNAL_SERVER_ERROR',
};

const isProduction = process.env.NODE_ENV === 'production';

const normalizeError = (error) => {
  if (!error) {
    return createHttpError(500, DEFAULT_MESSAGES[500], { code: DEFAULT_CODES[500] });
  }

  if (error.type === 'entity.parse.failed') {
    return createHttpError(400, 'Invalid JSON payload.', {
      code: 'INVALID_JSON',
      details: error.message,
    });
  }

  if (error.name === 'CastError') {
    return createHttpError(400, 'Invalid identifier format.', {
      code: 'INVALID_ID',
      details: {
        path: error.path,
        value: error.value,
      },
    });
  }

  if (error.name === 'ValidationError') {
    return createHttpError(400, error.message || DEFAULT_MESSAGES[400], {
      code: 'VALIDATION_ERROR',
      details: error.errors,
    });
  }

  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    return createHttpError(401, 'Invalid or expired token.', {
      code: 'INVALID_TOKEN',
    });
  }

  return error;
};

export const notFoundHandler = (req, _res, next) => {
  return next(
    createHttpError(404, `Route not found: ${req.method} ${req.originalUrl}`, {
      code: 'NOT_FOUND',
    }),
  );
};

export const errorHandler = (incomingError, req, res, _next) => {
  const error = normalizeError(incomingError);
  const statusCode = normalizeHttpStatus(error.statusCode || error.status, 500);
  const resolvedStatus = DEFAULT_MESSAGES[statusCode] ? statusCode : 500;
  const message = resolvedStatus >= 500 && isProduction
    ? 'Something went wrong'
    : (error.message || DEFAULT_MESSAGES[resolvedStatus]);
  const code = error.code || DEFAULT_CODES[resolvedStatus];

  if (resolvedStatus >= 500 || !isProduction) {
    console.error({
      status: resolvedStatus,
      code,
      method: req.method,
      path: req.originalUrl,
      name: error.name,
      message: error.message,
      details: error.details,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }

  const responsePayload = {
    success: false,
    message,
    error: {
      status: resolvedStatus,
      code,
    },
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  };

  if (!isProduction && error.details !== undefined) {
    responsePayload.error.details = error.details;
  }

  if (!isProduction && error.stack) {
    responsePayload.error.stack = error.stack;
  }

  return res.status(resolvedStatus).json(responsePayload);
};
