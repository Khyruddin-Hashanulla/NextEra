export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  avatar: {
    url: string;
    publicId: string;
  };
  bio: string;
  socialLinks: {
    youtube: string;
    twitter: string;
    linkedin: string;
    github: string;
  };
  isEmailVerified: boolean;
  createdAt: string;
}

export interface UpdateProfileRequest {
  name?: string;
  bio?: string;
  socialLinks?: {
    youtube?: string;
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
  avatar?: {
    url: string;
    publicId: string;
  };
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
