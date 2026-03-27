export const notFoundHandler = (_req, res) => {
  return res.status(404).json({ message: 'Route not found' });
};

export const errorHandler = (error, _req, res, _next) => {
  const statusCode = error.statusCode || error.status || 500;
  const message = error.message || 'Internal server error';

  if (statusCode >= 500) {
    console.error(error);
  }

  return res.status(statusCode).json({ message });
};
