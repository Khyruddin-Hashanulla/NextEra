import { Router } from 'express';
import passport from 'passport';
import {
  register,
  login,
  googleAuth,
  sendOTP,
  verifyEmail,
  refreshToken,
  forgotPassword,
  resetPassword,
  logout,
  logoutAllDevices,
} from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  verifyEmailLimiter,
  resendOTPLimiter,
  refreshTokenLimiter,
  googleLoginLimiter,
} from '../middlewares/rateLimiter.middleware';
import {
  registerSchema,
  loginSchema,
  sendOTPSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleAuthSchema,
} from '../validators/auth.validator';
import { env } from '../config/env';
import { setRefreshTokenCookie } from '../config/cookies';

const router = Router();

router.post('/register', registerLimiter, validate(registerSchema), register);
router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/google', googleLoginLimiter, validate(googleAuthSchema), googleAuth);
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${env.clientUrl}/login` }),
  (req, res) => {
    const result = req.user as any;
    const oauthState = (req as any).oauthState;
    const redirectTarget =
      oauthState && typeof oauthState.redirect === 'string' ? oauthState.redirect : `${env.clientUrl}/auth/callback`;
    setRefreshTokenCookie(res, result.refreshToken);
    res.redirect(`${redirectTarget}?accessToken=${result.accessToken}`);
  }
);
router.post('/send-otp', resendOTPLimiter, validate(sendOTPSchema), sendOTP);
router.post('/verify-email', verifyEmailLimiter, validate(verifyEmailSchema), verifyEmail);
router.post('/refresh', refreshTokenLimiter, refreshToken);
router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', resetPasswordLimiter, validate(resetPasswordSchema), resetPassword);
router.post('/logout', authenticate, logout);
router.post('/logout-all', authenticate, logoutAllDevices);

export default router;
