import { Request, Response, CookieOptions } from 'express';
import catchAsync from '../../lib/catchAsync';
import config from '../../core/config/config';
import {
  registerUserService,
  loginUserService,
  refreshAccessTokenService,
  forgetPasswordService,
  verifyCodeService,
  resetPasswordService,
  changePasswordService,
  logoutUserService,
} from './auth.service';
import { generateResponse } from '../../lib/responseFormat';


// ─── Refresh-token cookie config ──────────────────────────
// httpOnly   → JS (XSS) cannot read the cookie
// secure     → HTTPS only in production
// sameSite   → 'strict' blocks CSRF cross-origin sends
// maxAge     → mirrors REFRESH_TOKEN_EXPIRES (default 10d)

const REFRESH_COOKIE_NAME = 'refreshToken';

const refreshCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure:   config.env === 'production',
  sameSite: 'strict',
  maxAge:   10 * 24 * 60 * 60 * 1000, // 10 days in ms
});


export const registerUser = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const data = await registerUserService({ name, email, password });

  return generateResponse(res, 201, true, 'Registered user successfully!', data);
});


export const loginUser = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const { user, accessToken, refreshToken } = await loginUserService({ email, password });

  // Store refresh token in an httpOnly cookie — never exposed to JS
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());

  return generateResponse(res, 200, true, 'Login successful', { user, accessToken });
});


export const refreshAccessToken = catchAsync(async (req: Request, res: Response) => {
  // Read from cookie, NOT from request body
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;

  if (!refreshToken) {
    return generateResponse(res, 401, false, 'No refresh token provided', null);
  }

  const tokens = await refreshAccessTokenService(refreshToken);

  // Rotate the cookie with the newly issued refresh token
  res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, refreshCookieOptions());

  return generateResponse(res, 200, true, 'Token refreshed', { accessToken: tokens.accessToken });
});


export const forgetPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;

  await forgetPasswordService(email);

  return generateResponse(res, 200, true, 'Verification code sent to your email', null);
});


export const verifyCode = catchAsync(async (req: Request, res: Response) => {
  const { otp, email } = req.body;

  await verifyCodeService({ otp, email });

  return generateResponse(res, 200, true, 'Verification successful', null);
});


export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { email, newPassword } = req.body;

  await resetPasswordService({ email, newPassword });

  return generateResponse(res, 200, true, 'Password reset successfully', null);
});


export const changePassword = catchAsync(async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return generateResponse(res, 401, false, 'Unauthorized', null);
  }

  await changePasswordService({ userId, oldPassword, newPassword });

  return generateResponse(res, 200, true, 'Password changed successfully', null);
});


export const logoutUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return generateResponse(res, 401, false, 'Unauthorized', null);
  }

  await logoutUserService(userId);

  // Clear the httpOnly cookie on the client
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure:   config.env === 'production',
    sameSite: 'strict',
  });

  return generateResponse(res, 200, true, 'Logged out successfully', null);
});