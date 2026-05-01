import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';
import {
  BCRYPT_SALT_ROUNDS,
  JWT_ACCESS_EXPIRES_IN,
  JWT_ACCESS_SECRET,
} from '../config/index.js';
import { type UserRole } from '../db/schema.js';
import { AppError } from '../middlewares/error.js';
import type { AuthUser } from '../types/auth.js';
import type { LoginInput, RegisterInput } from '../validators/auth.validator.js';
import * as userRepository from '../repositories/user.repository.js';

function publicUser(user: userRepository.UserRecord) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    phone: user.phone,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function signAccessToken(payload: AuthUser): string {
  if (!JWT_ACCESS_SECRET.trim()) {
    throw new AppError(500, 'JWT_ACCESS_SECRET is not configured');
  }

  return jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

export async function register(input: RegisterInput) {
  const existingUser = await userRepository.findUserByEmail(input.email);
  if (existingUser) {
    throw new AppError(409, 'A user with this email already exists');
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);
  const user = await userRepository.createUser({
    fullName: input.fullName,
    email: input.email,
    passwordHash,
    phone: input.phone,
    role: input.role as UserRole,
  });

  const token = signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return { user: publicUser(user), token };
}

export async function login(input: LoginInput) {
  const user = await userRepository.findUserByEmail(input.email);
  if (!user) {
    throw new AppError(401, 'Invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw new AppError(401, 'Invalid email or password');
  }

  const token = signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return { user: publicUser(user), token };
}

export async function getCurrentUser(userId: string) {
  const user = await userRepository.findUserById(userId);
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  return publicUser(user);
}
