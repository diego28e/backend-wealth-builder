import type { Request, Response } from 'express';
import * as authService from '../api/services/auth.service.js';
import { generateToken } from '../utils/jwt.js';
import { RegisterSchema, LoginSchema, UserResponseSchema } from '../api/models/auth.model.js';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const userData = RegisterSchema.parse(req.body);
    const user = await authService.registerUser(userData);
    
    // Generate JWT token
    const token = await generateToken({ userId: user.id!, email: user.email });
    
    res.status(201).json({ 
      user: UserResponseSchema.parse(user),
      token 
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
    const token = await generateToken({ userId: user.id!, email: user.email });
    
    // Return user without password_hash
    const userResponse = UserResponseSchema.parse(user);
    
    res.json({ 
      user: userResponse,
      token 
    });
  } catch (error) {
    res.status(401).json({ error: error instanceof Error ? error.message : 'Login failed' });
  }
};