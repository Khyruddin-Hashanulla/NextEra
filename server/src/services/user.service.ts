import { User } from '../models/user.model';
import { ApiError } from '../utils/ApiError';
import { MESSAGES } from '../constants/messages';
import { IUserResponse } from '../interfaces/IUser';

export class UserService {
  private sanitizeUser(user: any): IUserResponse {
    return {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      socialLinks: user.socialLinks,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
    };
  }

  async getProfile(userId: string): Promise<IUserResponse> {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound(MESSAGES.ERROR.USER_NOT_FOUND);
    }
    return this.sanitizeUser(user);
  }

  async updateProfile(
    userId: string,
    updates: { name?: string; bio?: string; socialLinks?: Record<string, string>; avatar?: { url: string; publicId: string } }
  ): Promise<IUserResponse> {
    const user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true, runValidators: true });
    if (!user) {
      throw ApiError.notFound(MESSAGES.ERROR.USER_NOT_FOUND);
    }
    return this.sanitizeUser(user);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw ApiError.notFound(MESSAGES.ERROR.USER_NOT_FOUND);
    }

    if (!user.password) {
      throw ApiError.badRequest('Cannot change password for OAuth accounts');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw ApiError.unauthorized('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();
  }
}

export const userService = new UserService();
