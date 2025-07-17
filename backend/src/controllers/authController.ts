import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { registerSchema, loginSchema } from '../utils/validation';
import { createError } from '../middleware/errorHandler';

export const register = async (req: Request, res: Response) => {
  const validatedData = registerSchema.parse(req.body);
  const { name, email, password } = validatedData;

  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw createError('User already exists with this email', 409);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      createdAt: true
    }
  });

  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    message: 'User registered successfully',
    user,
    accessToken,
    refreshToken
  });
};

export const login = async (req: Request, res: Response) => {
  const validatedData = loginSchema.parse(req.body);
  const { email, password } = validatedData;

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw createError('Invalid email or password', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw createError('Invalid email or password', 401);
  }

  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  );

  const userResponse = {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    createdAt: user.createdAt
  };

  res.json({
    message: 'Login successful',
    user: userResponse,
    accessToken,
    refreshToken
  });
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw createError('Refresh token is required', 401);
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as {
      userId: string;
      email: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true
      }
    });

    if (!user) {
      throw createError('User not found', 401);
    }

    const newAccessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    const newRefreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Token refreshed successfully',
      user,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw createError('Invalid refresh token', 401);
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw createError('Refresh token expired', 401);
    }
    throw error;
  }
};

export const getProfile = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  res.json({
    user
  });
};