import {
  applySchema,
  createCouponSchema,
  updateCouponSchema,
  replyToReviewSchema,
  createAnnouncementSchema,
  updateProfileSchema,
  issueCertificateSchema,
} from '../../../src/validators/instructor.validator';

describe('instructor.validator', () => {
  it('validates instructor applications', () => {
    const valid = {
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      phone: '1234567890',
      address: '123 Main St',
      photo: { url: 'u', publicId: 'p' },
      resume: { url: 'u', publicId: 'p' },
      qualification: 'B.Sc Computer Science',
      experience: 'Five years teaching full stack development to high school students',
      linkedin: 'l',
      github: 'g',
      portfolio: 'p',
      website: 'w',
      bio: 'bio',
      teachingCategories: ['programming'],
      demoVideo: { url: 'u', publicId: 'p' },
      identityProof: { url: 'u', publicId: 'p' },
      taxDetails: { pan: 'P', gst: 'G' },
      bankDetails: {
        accountHolderName: 'Jane',
        accountNumber: '123',
        ifscCode: 'IFSC',
        bankName: 'Bank',
        branch: 'B',
        upiId: 'upi',
      },
    };
    expect(applySchema.parse(valid).email).toBe('jane@example.com');
    expect(() => applySchema.parse({ fullName: 'J', email: 'bad', phone: '1', address: 'a', qualification: 'q', experience: 'e', teachingCategories: [] })).toThrow();
  });

  it('validates instructor coupons', () => {
    expect(createCouponSchema.parse({ code: 'save20', discountType: 'fixed', discountValue: 20, expiresAt: 'd', course: 'c', isActive: true }).code).toBe('SAVE20');
    expect(() => createCouponSchema.parse({ code: 'x', discountType: 'percentage', discountValue: 0, expiresAt: '' })).toThrow();
    expect(updateCouponSchema.parse({ discountValue: 15, isActive: false }).discountValue).toBe(15);
  });

  it('validates review replies and announcements', () => {
    expect(replyToReviewSchema.parse({ reply: 'thanks' }).reply).toBe('thanks');
    expect(() => replyToReviewSchema.parse({ reply: '' })).toThrow();
    const valid = {
      course: 'c1',
      title: 'Reminder',
      message: 'Class tomorrow',
      attachments: [{ url: 'u', publicId: 'p', name: 'n' }],
      sendEmail: true,
    };
    expect(createAnnouncementSchema.parse(valid).title).toBe('Reminder');
    expect(() => createAnnouncementSchema.parse({ course: '', title: '', message: '' })).toThrow();
  });

  it('validates instructor profile updates', () => {
    const valid = {
      name: 'Jane Doe',
      bio: 'bio',
      phone: '123',
      address: 'addr',
      avatar: { url: 'u', publicId: 'p' },
      socialLinks: { youtube: 'y', twitter: 't', linkedin: 'l', github: 'g', portfolio: 'p', website: 'w' },
      instructorProfile: {
        qualification: 'q',
        experience: 'e',
        expertise: ['web'],
        resume: { url: 'u', publicId: 'p' },
        identityProof: { url: 'u', publicId: 'p' },
        demoVideo: { url: 'u', publicId: 'p' },
        taxDetails: { pan: 'p', gst: 'g' },
        bankDetails: { accountHolderName: 'n', accountNumber: '1', ifscCode: 'i', bankName: 'b', branch: 'br', upiId: 'u' },
        teachingCategories: ['web'],
      },
    };
    expect(updateProfileSchema.parse(valid).name).toBe('Jane Doe');
    expect(() => updateProfileSchema.parse({ name: 'J' })).toThrow();
  });

  it('validates certificate issuance', () => {
    expect(issueCertificateSchema.parse({ user: 'u1', course: 'c1' }).course).toBe('c1');
    expect(() => issueCertificateSchema.parse({ user: '', course: '' })).toThrow();
  });
});
