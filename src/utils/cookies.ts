import type { Response, CookieOptions } from 'express';

const baseOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
};

export const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
    res.cookie('accessToken', accessToken, {
        ...baseOptions,
        maxAge: 2 * 60 * 60 * 1000 //2 hours
    });

    res.cookie('refreshToken', refreshToken, {
        ...baseOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000 //7 days
    });
};

export const setAccessTokenCookie = (res: Response, accessToken: string) => {
    res.cookie('accessToken', accessToken, {
        ...baseOptions,
        maxAge: 2 * 60 * 60 * 1000
    });
};

export const clearAuthCookies = (res: Response) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
};