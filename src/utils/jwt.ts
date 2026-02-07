import { SignJWT, jwtVerify } from 'jose';
import dotenv from 'dotenv';
dotenv.config();

export async function generateToken(payload: any) {
  const secret = process.env.JWT_SECRET;
  const audience = process.env.JWT_AUDIENCE;
  const issuer = process.env.JWT_ISSUER;

  if (!secret || !audience || !issuer) {
    throw new Error('Missing JWT environment variables');
  }

  const encodedSecret = new TextEncoder().encode(secret);
  const alg = "HS256";
  const token = await new SignJWT(payload)
    .setAudience(audience)
    .setIssuer(issuer)
    .setProtectedHeader({ alg })
    .setExpirationTime("2h")
    .setIssuedAt()
    .sign(encodedSecret);
  return token;
}

export async function generateRefreshToken(payload: any) {
  const secret = process.env.JWT_REFRESH_SECRET;
  const audience = process.env.JWT_AUDIENCE;
  const issuer = process.env.JWT_ISSUES;

  if (!secret || !audience || !issuer) {
    throw new Error('Missing JWT environment variables');
  }

  const encodedSecret = new TextEncoder().encode(secret);
  const alg = "HS256";
  const token = await new SignJWT(payload)
    .setAudience(audience)
    .setIssuer(issuer)
    .setProtectedHeader({ alg })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(encodedSecret);
  return token;
}

export async function verifyToken(token: string) {
  const secret = process.env.JWT_SECRET;
  const audience = process.env.JWT_AUDIENCE;
  const issuer = process.env.JWT_ISSUER;

  if (!secret || !audience || !issuer) {
    throw new Error('Missing JWT environment variables');
  }

  const encodedSecret = new TextEncoder().encode(secret);
  const { payload } = await jwtVerify(token, encodedSecret, {
    audience,
    issuer,
  });
  return payload;
}

export async function verifyRefreshToken(token: string) {
  const secret = process.env.JWT_REFRESH_SECRET;
  const audience = process.env.JWT_AUDIENCE;
  const issuer = process.env.JWT_ISSUER;

  if (!secret || !audience || !issuer) {
    throw new Error('Missing JWT refresh environment variables');
  }

  const encodedSecret = new TextEncoder().encode(secret);
  const { payload } = await jwtVerify(token, encodedSecret, {
    audience,
    issuer,
  })
  return payload;
}