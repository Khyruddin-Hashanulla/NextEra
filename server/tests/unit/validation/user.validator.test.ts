import { updateProfileSchema, changePasswordSchema } from '../../../src/validators/user.validator';

describe('user.validator', () => {
  it('validates profile updates', () => {
    const valid = {
      name: 'Jane Doe',
      bio: 'bio',
      socialLinks: {
        youtube: 'https://y.com',
        twitter: 'https://x.com',
        linkedin: 'https://in.com',
        github: 'https://gh.com',
      },
      avatar: { url: 'u', publicId: 'p' },
    };
    expect(updateProfileSchema.parse(valid).name).toBe('Jane Doe');
    expect(updateProfileSchema.parse({ socialLinks: { youtube: '' } }).socialLinks.youtube).toBe('');
    expect(() => updateProfileSchema.parse({ socialLinks: { youtube: 'not-a-url' } })).toThrow();
    expect(() => updateProfileSchema.parse({ name: 'J' })).toThrow();
  });

  it('validates password changes', () => {
    const valid = { currentPassword: 'OldPass1', newPassword: 'NewPass1' };
    expect(changePasswordSchema.parse(valid).newPassword).toBe('NewPass1');
    expect(() => changePasswordSchema.parse({ currentPassword: '', newPassword: 'weak' })).toThrow();
    expect(() => changePasswordSchema.parse({ currentPassword: 'x', newPassword: 'alllowercase1' })).toThrow();
  });
});
