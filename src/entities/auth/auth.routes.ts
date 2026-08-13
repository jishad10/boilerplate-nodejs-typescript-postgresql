import express, { Router } from 'express';
import { verifyToken } from '../../core/middlewares/authMiddleware';
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  forgetPassword,
  verifyCode,
  resetPassword,
  changePassword,
  logoutUser,
} from './auth.controller';
import { emailVerificationLimiter } from '../../lib/limit';


const router: Router = express.Router();


router.post('/register',             registerUser);
router.post('/login',                loginUser);
router.post('/refresh-access-token', refreshAccessToken);
router.post('/forget-password',      emailVerificationLimiter, forgetPassword);
router.post('/verify-code',          emailVerificationLimiter, verifyCode);
router.post('/reset-password',       resetPassword);
router.post('/change-password',      verifyToken, changePassword);
router.post('/logout',               verifyToken, logoutUser);


export default router;