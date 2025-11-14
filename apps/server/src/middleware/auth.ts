import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { env } from '../env.js';

const refreshStore = new Map<string, { userId: string; expiresAt: number }>();

export function signAccessToken(userId: string) {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, {
    expiresIn: `${env.TOKEN_TTL_MINUTES}m`,
  });
}

export function signRefreshToken(userId: string) {
  const token = jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: `${env.REFRESH_TTL_HOURS}h`,
  });
  const expiresAt = Date.now() + env.REFRESH_TTL_HOURS * 60 * 60 * 1000;
  refreshStore.set(token, { userId, expiresAt });
  return token;
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing token' });
  const [, token] = authHeader.split(' ');
  if (!token) return res.status(401).json({ error: 'Invalid token' });
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub as string };
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();
  const [, token] = authHeader.split(' ');
  if (!token) return next();
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub as string };
  } catch {
    // ignore
  }
  return next();
}

export function rotateRefreshToken(oldToken: string) {
  const entry = refreshStore.get(oldToken);
  if (!entry) {
    throw new Error('Invalid refresh token');
  }
  if (entry.expiresAt < Date.now()) {
    refreshStore.delete(oldToken);
    throw new Error('Refresh token expired');
  }
  refreshStore.delete(oldToken);
  return {
    access: signAccessToken(entry.userId),
    refresh: signRefreshToken(entry.userId),
  };
}
