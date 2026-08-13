import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomInt } from 'crypto';
import config from '../../core/config/config';
import sendEmail from '../../lib/sendEmail';
import verificationCodeTemplate from '../../lib/emailTemplates';
import AppError from '../../core/error/appError';
import SAFE_USER_SELECT from '../../core/constants/userSelect';
import prisma from '../../core/config/prisma';


// ─── DTO Types ────────────────────────────────────────────

interface RegisterUserInput {
  name:     string;
  email:    string;
  password: string;
}

interface LoginUserInput {
  email:    string;
  password: string;
}

interface OTPInput {
  email: string;
  otp:   string;
}

interface ResetPasswordInput {
  email:       string;
  newPassword: string;
}

interface ChangePasswordInput {
  userId:      string;
  oldPassword: string;
  newPassword: string;
}


// ─── Helpers ──────────────────────────────────────────────

const generateAccessToken = (payload: object): string =>
  jwt.sign(payload, config.jwt.accessTokenSecret!, {
    expiresIn: config.jwt.accessTokenExpires as any,
  });

const generateRefreshToken = (payload: object): string =>
  jwt.sign(payload, config.jwt.refreshTokenSecret!, {
    expiresIn: config.jwt.refreshTokenExpires as any,
  });


// ─── Register ─────────────────────────────────────────────

export const registerUserService = async ({
  name,
  email,
  password,
}: RegisterUserInput) => {

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    throw new AppError(400, 'User already registered');
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data:   { name, email, password: hashed },
    select: SAFE_USER_SELECT,
  });

  return user;
};


// ─── Login ────────────────────────────────────────────────

export const loginUserService = async ({ email, password }: LoginUserInput) => {

  if (!email || !password) {
    throw new AppError(400, 'Email and password are required');
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new AppError(400, 'Invalid password');
  }

  const payload      = { id: user.id, role: user.role };
  const refreshToken = generateRefreshToken(payload);
  const accessToken  = generateAccessToken(payload);

  await prisma.user.update({
    where: { id: user.id },
    data:  { refreshToken },
  });

  return {
    user: {
      id:           user.id,
      name:         user.name,
      email:        user.email,
      role:         user.role,
      profileImage: user.profileImage,
    },
    accessToken,
    refreshToken, // returned only so the controller can set it as an httpOnly cookie
  };
};


// ─── Refresh Access Token ─────────────────────────────────

export const refreshAccessTokenService = async (refreshToken: string) => {

  if (!refreshToken) {
    throw new AppError(400, 'No refresh token provided');
  }

  const user = await prisma.user.findFirst({ where: { refreshToken } });

  if (!user) {
    throw new AppError(401, 'Invalid refresh token');
  }

  const decoded: any = jwt.verify(refreshToken, config.jwt.refreshTokenSecret!);

  if (decoded.id !== user.id) {
    throw new AppError(401, 'Invalid refresh token');
  }

  const payload         = { id: user.id, role: user.role };
  const newRefreshToken = generateRefreshToken(payload);
  const accessToken     = generateAccessToken(payload);

  await prisma.user.update({
    where: { id: user.id },
    data:  { refreshToken: newRefreshToken },
  });

  return { accessToken, refreshToken: newRefreshToken };
};


// ─── Forget Password ──────────────────────────────────────

export const forgetPasswordService = async (email: string) => {

  if (!email) {
    throw new AppError(400, 'Email is required');
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AppError(404, 'Invalid email');
  }

  // randomInt(min, max) is cryptographically secure (CSPRNG).
  // Range is [100000, 1000000) — guaranteed 6-digit output, no padding needed.
  const otp       = randomInt(100000, 1000000).toString();
  const otpExpires = new Date(Date.now() + config.email.expires);

  await prisma.user.update({
    where: { id: user.id },
    data:  { otp, otpExpires, otpVerified: false, resetExpires: null },
  });

  await sendEmail({
    to:      email,
    subject: 'Password Reset OTP',
    html:    verificationCodeTemplate(otp),
  });
};


// ─── Verify OTP ───────────────────────────────────────────

export const verifyCodeService = async ({ email, otp }: OTPInput) => {

  if (!email || !otp) {
    throw new AppError(400, 'Email and OTP are required');
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.otp || !user.otpExpires) {
    throw new AppError(404, 'OTP not found');
  }

  if (user.otp !== otp || Date.now() > user.otpExpires.getTime()) {
    throw new AppError(403, 'Invalid or expired OTP');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      otp:          null,
      otpExpires:   null,
      otpVerified:  true,
      resetExpires: new Date(Date.now() + 15 * 60 * 1000),
    },
  });
};


// ─── Reset Password ───────────────────────────────────────

export const resetPasswordService = async ({
  email,
  newPassword,
}: ResetPasswordInput) => {

  if (!email || !newPassword) {
    throw new AppError(400, 'Email and new password are required');
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new AppError(404, 'Invalid email');

  if (!user.otpVerified || !user.resetExpires) {
    throw new AppError(403, 'OTP verification required');
  }

  if (Date.now() > user.resetExpires.getTime()) {
    throw new AppError(403, 'Reset session expired');
  }

  const hashed = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password:     hashed,
      otpVerified:  false,
      resetExpires: null,
    },
  });
};


// ─── Change Password ──────────────────────────────────────

export const changePasswordService = async ({
  userId,
  oldPassword,
  newPassword,
}: ChangePasswordInput) => {

  if (!userId || !oldPassword || !newPassword) {
    throw new AppError(400, 'All password fields are required');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) throw new AppError(404, 'User not found');

  const isMatch = await bcrypt.compare(oldPassword, user.password);

  if (!isMatch) {
    throw new AppError(400, 'Invalid old password');
  }

  const hashed = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data:  { password: hashed },
  });
};


// ─── Logout ───────────────────────────────────────────────

export const logoutUserService = async (userId: string): Promise<void> => {
  await prisma.user.update({
    where: { id: userId },
    data:  { refreshToken: null },
  });
};