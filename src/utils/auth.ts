import argon2 from "argon2";
import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "./jwt.js";

export const hashPassword = async (password: string) => {
    const hashedPassword = await argon2.hash(password);
    return hashedPassword;
}

export const verifyPassword = async (hashedPassword: string, password: string) => {
    return await argon2.verify(hashedPassword, password)
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies.accessToken;

        if (!token) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const payload = await verifyToken(token);
        req.user = payload;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};