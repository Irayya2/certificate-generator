import { randomUUID } from 'node:crypto';
import logger from '../utils/logger.js';

/**
 * Middleware to assign a unique request ID (X-Request-ID) to each incoming HTTP request
 * and attach a request-scoped logger child (`req.logger`) for contextual logging.
 */
export function requestIdMiddleware(req, res, next) {
  const existingId = req.header('X-Request-ID');
  const requestId = existingId || randomUUID().slice(0, 8);

  req.id = requestId;
  res.setHeader('X-Request-ID', requestId);

  // Attach a contextual child logger to req
  req.logger = logger.child({ requestId });

  next();
}

export default requestIdMiddleware;
