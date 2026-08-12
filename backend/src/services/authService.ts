import { Role } from '@prisma/client';
import prisma from '../config/database';
import { AppError, excludePassword } from '../utils/helpers';
import { comparePassword, hashPassword } from '../utils/password';
import { signToken } from '../utils/jwt';

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const valid = await comparePassword(password, user.password);
  if (!valid) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = signToken({ userId: user.id, role: user.role });
  return { token, user: excludePassword(user) };
}

export async function register(name: string, email: string, password: string, role: Role) {
  if (role === 'ADMIN') {
    throw new AppError('Administrator accounts cannot be created through registration', 400);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, password: hashed, role },
  });

  return excludePassword(user);
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return excludePassword(user);
}

export async function listUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return users;
}
