import logger from '../utils/logger.js';

/**
 * Global error handler middleware.
 * Catches errors thrown by controllers and returns a consistent JSON response.
 *
 * Usage: app.use(errorHandler) — must be the LAST middleware registered.
 */
export function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  const reqLogger = req.logger || logger;

  reqLogger.error(`HTTP Error ${statusCode} on ${req.method} ${req.path}: ${err.message}`, {
    statusCode,
    path: req.path,
    method: req.method,
    stack: err.stack,
  });

  res.status(statusCode).json({
    success: false,
    message: err.message || 'An internal server error occurred.',
    // Only expose stack trace in development
    ...(isProduction ? {} : { stack: err.stack }),
  });
}

