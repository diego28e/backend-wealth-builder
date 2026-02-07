import type { Request, Response } from 'express';
import * as authService from '../api/services/auth.service.js';
import { generateRefreshToken, generateToken, verifyRefreshToken } from '../utils/jwt.js';
import { RegisterSchema, LoginSchema } from '../api/models/auth.model.js';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const userData = RegisterSchema.parse(req.body);
    const user = await authService.registerUser(userData);

    // Generate JWT token
    const accessToken = await generateToken({ userId: user.id!, email: user.email });
    const refreshToken = await generateRefreshToken({ userId: user.id!, email: user.email })

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 2 * 60 * 60 * 1000 //2 hours
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 //7 days
    });
    res.status(201).json({ user });
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      res.status(409).json({ error: error.message });
    } else {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid data' });
    }
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const loginData = LoginSchema.parse(req.body);
    const user = await authService.loginUser(loginData);

    // Generate JWT token
    const accessToken = await generateToken({ userId: user.id!, email: user.email });
    const refreshToken = await generateRefreshToken({ userId: user.id!, email: user.email });

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 2 * 60 * 60 * 1000 //2 hours
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 //7 days
    });
    // Return user without password_hash (already parsed by authService)
    const { password_hash, ...userResponse } = user;

    res.json({ user: userResponse });
  } catch (error) {
    res.status(401).json({ error: error instanceof Error ? error.message : 'Login failed' });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }

    const payload = await verifyRefreshToken(refreshToken);
    const newAccessToken = await generateToken({
      userId: payload.userId,
      email: payload.email
    })

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 2 * 60 * 60 * 1000 //2 hours
    })
    res.json({ message: 'Token refreshed successfully' })
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
}

export const logout = async (req: Request, res: Response): Promise<void> => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ message: 'Logout successful' });
}