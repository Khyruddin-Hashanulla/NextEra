import { User } from '../models/user.model';
import { TokenPayload } from '../interfaces/IUser';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/generateToken';
import { ApiError } from '../utils/ApiError';
import { MESSAGES } from '../constants/messages';

export class TokenService {
  async generateTokens(userId: string, email: string, role: string): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: TokenPayload = { userId, email, role: role as TokenPayload['role'] };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await User.findByIdAndUpdate(userId, { refreshToken });
    return { accessToken, refreshToken };
  }

  async refreshAccessToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.userId).select('+refreshToken');

    if (!user || !user.isActive) {
      throw ApiError.unauthorized(MESSAGES.ERROR.UNAUTHORIZED);
    }

    if (user.refreshToken !== token) {
      throw ApiError.unauthorized(MESSAGES.ERROR.INVALID_REFRESH_TOKEN);
    }

    return this.generateTokens(user._id.toString(), user.email, user.role);
  }

  async removeRefreshToken(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  }
}

export const tokenService = new TokenService();
