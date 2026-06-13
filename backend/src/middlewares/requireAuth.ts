import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'kharchwise-secret';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
  };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
    return;
  }
};
