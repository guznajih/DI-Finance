import { NextFunction, Request, Response } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { getOrCreateUser, getUserByUid, getUserById } from '../db/users.ts';

export interface AppUser {
  id: number;
  uid: string;
  email: string;
  displayName: string | null;
  roleId: number | null;
  unitId: number | null;
  roleName: string | null;
  roleDesc: string | null;
  unitName: string | null;
  isActive: boolean;
}

export interface AuthRequest extends Request {
  user?: AppUser;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const devUserIdHeader = req.headers['x-dev-user-id'];

  // Support demo / dev user simulation if no Bearer token is provided
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (devUserIdHeader && typeof devUserIdHeader === 'string') {
      const parsedId = parseInt(devUserIdHeader, 10);
      if (!isNaN(parsedId)) {
        const simUser = await getUserById(parsedId);
        if (simUser) {
          req.user = simUser;
          return next();
        }
      }
    }
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    let appUser = await getUserByUid(decodedToken.uid);

    if (!appUser) {
      await getOrCreateUser(
        decodedToken.uid,
        decodedToken.email || `${decodedToken.uid}@darulistiqomah.ac.id`,
        decodedToken.name || ''
      );
      appUser = await getUserByUid(decodedToken.uid);
    }

    if (!appUser || !appUser.isActive) {
      return res.status(403).json({ error: 'Pengguna nonaktif atau tidak memiliki izin' });
    }

    // Allow Super Admin to test as another role if requested
    if (appUser.roleName === 'SUPER_ADMIN' && devUserIdHeader && typeof devUserIdHeader === 'string') {
      const parsedId = parseInt(devUserIdHeader, 10);
      if (!isNaN(parsedId)) {
        const targetUser = await getUserById(parsedId);
        if (targetUser) {
          req.user = targetUser;
          return next();
        }
      }
    }

    req.user = appUser;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Token tidak valid' });
  }
};
