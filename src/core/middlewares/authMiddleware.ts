import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { generateResponse } from '../../lib/responseFormat';
import { RoleType } from '../../lib/types';
import config from '../config/config';
import catchAsync from '../../lib/catchAsync';
import prisma from '../config/prisma';



interface DecodedToken extends JwtPayload {
  id: string;
}


export const verifyToken = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return generateResponse(res, 401, false, 'No token, auth denied', null);
  }

  const decoded = jwt.verify(token, config.jwt.accessTokenSecret!) as DecodedToken;

  const user = await prisma.user.findUnique({
    where:  { id: decoded.id },
    select: {
      id:                    true,
      name:                  true,
      email:                 true,
      username:              true,
      role:                  true,
      gender:                true,
      bio:                   true,
      phone:                 true,
      profileImage:          true,
      multiProfileImage:     true,
      pdfFile:               true,
      language:              true,
      isVerified:            true,
      hasActiveSubscription: true,
      blockedUsers:          true,
      createdAt:             true,
      updatedAt:             true,
      // password, refreshToken, otp fields intentionally excluded
    },
  });

  if (!user) {
    return generateResponse(res, 401, false, 'User not found', null);
  }

  req.user = user as any;
  next();
});


export const userMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    generateResponse(res, 401, false, 'Unauthorized: User not found', null);
    return;
  }

  if (req.user.role !== RoleType.USER) {
    generateResponse(res, 403, false, 'User access only', null);
    return;
  }

  next();
};


export const adminMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    generateResponse(res, 401, false, 'Unauthorized: Admin not found', null);
    return;
  }

  if (req.user.role !== RoleType.ADMIN) {
    generateResponse(res, 403, false, 'Admin access only', null);
    return;
  }

  next();
};


export const userAdminMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const role = req.user?.role;

  if (!role || ![RoleType.USER, RoleType.ADMIN].includes(role as RoleType)) {
    generateResponse(res, 403, false, 'User or Admin access only', null);
    return;
  }

  next();
};