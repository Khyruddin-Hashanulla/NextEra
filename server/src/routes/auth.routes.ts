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
} from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { authRateLimiter } from '../middlewares/rateLimiter.middleware';
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

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), register);
router.post('/login', authRateLimiter, validate(loginSchema), login);
router.post('/google', authRateLimiter, validate(googleAuthSchema), googleAuth);
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${env.clientUrl}/login` }),
  (req, res) => {
    const result = req.user as any;
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: env.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.redirect(`${env.clientUrl}/auth/callback?accessToken=${result.accessToken}`);
  }
);
router.post('/send-otp', authRateLimiter, validate(sendOTPSchema), sendOTP);
router.post('/verify-email', authRateLimiter, validate(verifyEmailSchema), verifyEmail);
router.post('/refresh', refreshToken);
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), resetPassword);
router.post('/logout', authenticate, logout);

export default router;
