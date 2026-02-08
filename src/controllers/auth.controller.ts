import type { Request, Response } from 'express';
import * as authService from '../api/services/auth.service.js';
import { generateRefreshToken, generateToken, verifyRefreshToken } from '../utils/jwt.js';
import { RegisterSchema, LoginSchema } from '../api/models/auth.model.js';
import { setAuthCookies, setAccessTokenCookie, clearAuthCookies } from '../utils/cookies.js';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const userData = RegisterSchema.parse(req.body);
    const user = await authService.registerUser(userData);

    // Generate JWT token
    const accessToken = await generateToken({ userId: user.id!, email: user.email });
    const refreshToken = await generateRefreshToken({ userId: user.id!, email: user.email })

    setAuthCookies(res, accessToken, refreshToken);
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

    setAuthCookies(res, accessToken, refreshToken);
    // Return user without password_hash (already parsed by authService)
    const { password_hash, ...userResponse } = user;

    res.json({ user: userResponse });
  } catch (error) {
    res.status(401).json({ error: error instanceof Error ? error.message : 'Login failed' });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      res.status(401).json({ error: 'Refresh token not found' });
      return;
    }

    const payload = await verifyRefreshToken(refreshToken);
    const newAccessToken = await generateToken({
      userId: payload.userId,
      email: payload.email
    });

    setAccessTokenCookie(res, newAccessToken);
    res.json({ message: 'Token refreshed successfully' });
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  clearAuthCookies(res);
  res.json({ message: 'Logout successful' });
};

export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await authService.getUserById(userId);
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};