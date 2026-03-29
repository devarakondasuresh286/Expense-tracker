const VALID_HTTP_STATUS_MIN = 400;
const VALID_HTTP_STATUS_MAX = 599;

export const normalizeHttpStatus = (statusCode, fallbackStatusCode = 500) => {
  const normalizedStatus = Number(statusCode);

  if (
    Number.isInteger(normalizedStatus)
    && normalizedStatus >= VALID_HTTP_STATUS_MIN
    && normalizedStatus <= VALID_HTTP_STATUS_MAX
  ) {
    return normalizedStatus;
  }

  return fallbackStatusCode;
};

export const createHttpError = (statusCode, message, options = {}) => {
  const error = new Error(message);
  error.statusCode = normalizeHttpStatus(statusCode);

  if (options.code) {
    error.code = options.code;
  }

  if (options.details !== undefined) {
    error.details = options.details;
  }

  return error;
};
