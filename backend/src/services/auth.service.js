import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { ROLES } from '../utils/constants.js';

export function signAuthToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn,
    }
  );
}

export function sanitizeUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function registerUser({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });

  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  // Public registration always creates a standard 'user' role
  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    role: ROLES.USER,
    isActive: true,
  });

  const token = signAuthToken(user);

  return {
    user: sanitizeUser(user),
    token,
  };
}

export async function loginUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Account is deactivated. Please contact an administrator.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = signAuthToken(user);

  return {
    user: sanitizeUser(user),
    token,
  };
}

export async function getCurrentUser(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return sanitizeUser(user);
}

export async function bootstrapAdminIfEnabled() {
  if (!env.enableAdminBootstrap) {
    return null;
  }

  if (!env.adminSeedEmail || !env.adminSeedPassword) {
    throw new Error(
      'ENABLE_ADMIN_BOOTSTRAP is true, but ADMIN_SEED_EMAIL or ADMIN_SEED_PASSWORD is missing.'
    );
  }

  if (env.adminSeedPassword.length < 8) {
    throw new Error('ADMIN_SEED_PASSWORD must be at least 8 characters long.');
  }

  const normalizedEmail = env.adminSeedEmail.trim().toLowerCase();
  const existingAdmin = await User.findOne({ email: normalizedEmail });

  if (existingAdmin) {
    return null;
  }

  const admin = await User.create({
    name: env.adminSeedName,
    email: normalizedEmail,
    password: env.adminSeedPassword,
    role: ROLES.ADMIN,
    isActive: true,
  });

  return sanitizeUser(admin);
}
