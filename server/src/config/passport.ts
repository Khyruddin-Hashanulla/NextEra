import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from './env';
import { authService } from '../services/auth.service';
import { logger } from '../utils/logger';
import { oauthStateStore } from './oauth-state.store';

if (env.googleClientId && env.googleClientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.googleClientId,
        clientSecret: env.googleClientSecret,
        callbackURL: env.googleCallbackUrl,
        scope: ['profile', 'email'],
        state: true,
        store: oauthStateStore,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const result = await authService.googleAuth(profile, { userAgent: 'Google OAuth', ip: '' });
          done(null, result);
        } catch (error) {
          logger.error('Google OAuth error:', error);
          done(error as Error);
        }
      }
    )
  );
} else {
  logger.warn('Google OAuth credentials not configured. Google login disabled.');
}

export default passport;
