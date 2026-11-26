import crypto from 'crypto';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CSRF_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export function getCookieOptions({ httpOnly = true, maxAge } = {}) {
  const options = {
    httpOnly,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'none' : 'lax',
    path: '/',
  };

  if (typeof maxAge === 'number') {
    options.maxAge = maxAge;
  }

  return options;
}

export function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function setCsrfCookie(res, token) {
  res.cookie(
    env.csrfCookieName,
    token,
    getCookieOptions({
      httpOnly: true,
      maxAge: CSRF_COOKIE_MAX_AGE,
    })
  );
  return token;
}

export function rotateCsrfCookie(res) {
  return setCsrfCookie(res, generateCsrfToken());
}

export function ensureCsrfCookie(req, res) {
  const existing = req.cookies?.[env.csrfCookieName];
  if (typeof existing === 'string' && existing.length === 64) {
    return existing;
  }
  return rotateCsrfCookie(res);
}

function timingSafeMatch(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || !b) {
    return false;
  }
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export function csrfProtection(req, res, next) {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  const isPublicAuth =
    req.path === '/auth/login' || req.path === '/auth/register';
  if (isPublicAuth) {
    return next();
  }

  const hasAuthCookie = Boolean(req.cookies?.[env.cookieName]);
  const isLogout = req.path === '/auth/logout';

  // Enforce CSRF token validation for all cookie-authenticated state-changing requests
  if (!hasAuthCookie && !isLogout) {
    return next();
  }

  const cookieToken = req.cookies?.[env.csrfCookieName];
  const headerToken = req.get('x-csrf-token');

  if (!timingSafeMatch(cookieToken, headerToken)) {
    return next(new ApiError(403, 'Invalid or missing CSRF token'));
  }

  return next();
}
