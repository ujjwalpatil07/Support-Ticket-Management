import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  ensureCsrfCookie,
  getCookieOptions,
  rotateCsrfCookie,
} from '../middleware/csrf.js';
import * as authService from '../services/auth.service.js';

const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function setAuthCookie(res, token) {
  res.cookie(
    env.cookieName,
    token,
    getCookieOptions({
      httpOnly: true,
      maxAge: AUTH_COOKIE_MAX_AGE,
    })
  );
}

export const getCsrfToken = asyncHandler(async (req, res) => {
  const csrfToken = ensureCsrfCookie(req, res);
  res.status(200).json({
    success: true,
    data: { csrfToken },
  });
});

export const register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.registerUser(req.body);
  setAuthCookie(res, token);
  const csrfToken = rotateCsrfCookie(res);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: { user, csrfToken },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.loginUser(req.body);
  setAuthCookie(res, token);
  const csrfToken = rotateCsrfCookie(res);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: { user, csrfToken },
  });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie(env.cookieName, getCookieOptions({ httpOnly: true }));
  res.clearCookie(env.csrfCookieName, getCookieOptions({ httpOnly: true }));

  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user._id);
  const csrfToken = ensureCsrfCookie(req, res);

  res.status(200).json({
    success: true,
    data: { user, csrfToken },
  });
});
