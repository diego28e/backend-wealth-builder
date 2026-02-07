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

    res.status(201).json({
      user,
      accessToken,
      refreshToken
    });
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

    // Return user without password_hash (already parsed by authService)
    const { password_hash, ...userResponse } = user;

    res.json({
      user: userResponse,
      accessToken,
      refreshToken
    });
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
    res.json({ accessToken: newAccessToken })
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
}

export const logout = async (req: Request, res: Response): Promise<void> => {
  res.json({ message: 'Logout successful' });
}