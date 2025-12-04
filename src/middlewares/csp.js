import { config } from '../config/index.js';

export function cspMiddleware(req, res, next) {
  // In development, allow localhost connections
  const connectSrc = config.nodeEnv === 'development'
    ? "'self' http://localhost:* http://127.0.0.1:*"
    : "'self'";

  res.setHeader(
    'Content-Security-Policy',
    `default-src 'self'; ` +
    `script-src 'self' 'unsafe-inline'; ` +
    `style-src 'self' 'unsafe-inline'; ` +
    `img-src 'self' data: https:; ` +
    `font-src 'self'; ` +
    `connect-src ${connectSrc}; ` +
    `frame-ancestors 'none';`
  );

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
}