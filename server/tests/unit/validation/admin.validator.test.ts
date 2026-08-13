import {
  updateUserRoleSchema,
  updateUserStatusSchema,
  createCategorySchema,
  updateCategorySchema,
  createBlogSchema,
  updateBlogSchema,
  createCouponSchema,
  updateCouponSchema,
  createNotificationSchema,
  sendBulkNotificationSchema,
  updateSettingsSchema,
  rejectCourseSchema,
  moderateReviewSchema,
  createSubscriptionPlanSchema,
  updateSubscriptionPlanSchema,
  createBannerSchema,
  updateBannerSchema,
  processRefundSchema,
  issueRefundSchema,
  updateTicketStatusSchema,
  addTicketMessageSchema,
  createFaqSchema,
  updateFaqSchema,
  createEmailTemplateSchema,
  updateEmailTemplateSchema,
  createCmsPageSchema,
  updateCmsPageSchema,
  createRolePermissionSchema,
  updateRolePermissionSchema,
} from '../../../src/validators/admin.validator';

describe('admin.validator', () => {
  it('validates user role and status updates', () => {
    expect(updateUserRoleSchema.parse({ role: 'admin' }).role).toBe('admin');
    expect(() => updateUserRoleSchema.parse({ role: 'superadmin' })).toThrow();
    expect(updateUserStatusSchema.parse({ isActive: true })).toEqual({ isActive: true });
    expect(() => updateUserStatusSchema.parse({ isActive: 'yes' })).toThrow();
  });

  it('validates category creation and updates', () => {
    expect(createCategorySchema.parse({ name: 'Web Dev', description: 'd', icon: 'i' })).toMatchObject({
      name: 'Web Dev',
    });
    expect(() => createCategorySchema.parse({ name: 'x' })).toThrow();
    expect(updateCategorySchema.parse({ name: 'Dev', isActive: false }).isActive).toBe(false);
    expect(() => updateCategorySchema.parse({ name: 'x' })).toThrow();
  });

  it('validates blog creation and updates', () => {
    const valid = {
      title: 'My Blog Post',
      content: 'A much longer body',
      excerpt: 'short',
      tags: ['tag1'],
      featuredImage: { url: 'u', publicId: 'p' },
      status: 'published',
    };
    expect(createBlogSchema.parse(valid).title).toBe('My Blog Post');
    expect(() => createBlogSchema.parse({ title: 'short', content: 'x' })).toThrow();
    expect(updateBlogSchema.parse({ title: 'Updated Title', status: 'draft' }).status).toBe('draft');
    expect(() => updateBlogSchema.parse({ title: 'no' })).toThrow();
  });

  it('validates coupon creation and updates', () => {
    const valid = { code: 'save10', discountType: 'percentage', discountValue: 10, expiresAt: '2026-01-01' };
    expect(createCouponSchema.parse(valid).code).toBe('SAVE10');
    expect(() =>
      createCouponSchema.parse({ code: 'x', discountType: 'fixed', discountValue: 0, expiresAt: '' })
    ).toThrow();
    expect(updateCouponSchema.parse({ isActive: false, discountValue: 25 }).discountValue).toBe(25);
  });

  it('validates notifications', () => {
    expect(
      createNotificationSchema.parse({
        user: '6a6c5515bf5829ee772c2ce1',
        title: 'Hi',
        message: 'msg',
        type: 'system',
        link: 'l',
      }).type
    ).toBe('system');
    expect(() => createNotificationSchema.parse({ user: '', title: '', message: '' })).toThrow();
    expect(() => createNotificationSchema.parse({ user: 'not-an-objectid', title: 'Hi', message: 'msg' })).toThrow();
    expect(sendBulkNotificationSchema.parse({ title: 'Hi', message: 'msg' }).message).toBe('msg');
    expect(() => sendBulkNotificationSchema.parse({ title: '', message: '' })).toThrow();
  });

  it('validates settings updates', () => {
    const valid = {
      platformName: 'NextEra',
      platformEmail: 'hello@nextera.io',
      logo: { url: 'u', publicId: 'p' },
      favicon: { url: 'u', publicId: 'p' },
      metaDescription: 'desc',
      maintenanceMode: true,
      allowRegistration: false,
      defaultUserRole: 'student',
      currency: 'USD',
      commissionPercentage: 10,
      gstPercentage: 5,
      minimumPayoutAmount: 100,
      supportEmail: 'support@nextera.io',
      timezone: 'UTC',
      defaultInstructorPlan: 'pro',
      refundWindowDays: 7,
      socialLinks: { youtube: 'y', twitter: 't', linkedin: 'l', instagram: 'i' },
    };
    expect(updateSettingsSchema.parse(valid).platformName).toBe('NextEra');
    expect(() => updateSettingsSchema.parse({ platformEmail: 'not-an-email' })).toThrow();
    expect(() => updateSettingsSchema.parse({ commissionPercentage: 101 })).toThrow();
  });

  it('validates course review moderation and refunds', () => {
    expect(rejectCourseSchema.parse({ reason: 'spam' }).reason).toBe('spam');
    expect(rejectCourseSchema.parse({}).reason).toBeUndefined();
    expect(moderateReviewSchema.parse({ status: 'approved', adminNote: 'ok' }).status).toBe('approved');
    expect(() => moderateReviewSchema.parse({ status: 'spam' })).toThrow();
    expect(processRefundSchema.parse({ adminNote: 'note' }).adminNote).toBe('note');
  });

  it('validates refund issuance', () => {
    const valid = { body: { amount: 50, reason: 'student_request', refundType: 'partial', adminNote: 'n' } };
    expect(issueRefundSchema.parse(valid).body.refundType).toBe('partial');
    expect(() => issueRefundSchema.parse({ body: { amount: -1, reason: 'bad' } })).toThrow();
    expect(issueRefundSchema.parse({ body: { amount: 10, reason: 'fraud' } }).body.refundType).toBe('full');
  });

  it('validates subscription plans', () => {
    const valid = {
      name: 'Pro',
      price: 100,
      discountedPrice: 80,
      durationDays: 30,
      features: ['f1'],
      level: 'premium',
      status: 'active',
    };
    expect(createSubscriptionPlanSchema.parse(valid).level).toBe('premium');
    expect(() =>
      createSubscriptionPlanSchema.parse({ name: '', price: -1, durationDays: 0, features: [], level: 'x' })
    ).toThrow();
    expect(updateSubscriptionPlanSchema.parse({ price: 120, level: 'standard' }).price).toBe(120);
  });

  it('validates banners', () => {
    const valid = {
      title: 'Banner',
      subtitle: 'sub',
      image: { url: 'u', publicId: 'p' },
      link: 'l',
      position: 'hero',
      order: 1,
    };
    expect(createBannerSchema.parse(valid).position).toBe('hero');
    expect(() =>
      createBannerSchema.parse({ title: '', image: { url: 'u', publicId: 'p' }, position: 'hero' })
    ).toThrow();
    expect(
      updateBannerSchema.parse({ title: 'New', position: 'promo', isActive: true, startDate: 'd', endDate: 'e' })
        .isActive
    ).toBe(true);
  });

  it('validates ticket messages and status', () => {
    expect(updateTicketStatusSchema.parse({ status: 'resolved' }).status).toBe('resolved');
    expect(() => updateTicketStatusSchema.parse({ status: 'nope' })).toThrow();
    expect(addTicketMessageSchema.parse({ message: 'hello' }).message).toBe('hello');
    expect(() => addTicketMessageSchema.parse({ message: '' })).toThrow();
  });

  it('validates FAQ entries', () => {
    const valid = { question: 'How?', answer: 'Like this', category: 'general', order: 2 };
    expect(createFaqSchema.parse(valid).order).toBe(2);
    expect(() => createFaqSchema.parse({ question: '', answer: '' })).toThrow();
    expect(updateFaqSchema.parse({ answer: 'Updated', isActive: false }).isActive).toBe(false);
  });

  it('validates email templates', () => {
    const valid = {
      name: 'Welcome',
      slug: 'welcome',
      subject: 'Welcome!',
      body: 'Welcome to the platform',
      variables: ['name'],
      category: 'auth',
    };
    expect(createEmailTemplateSchema.parse(valid).slug).toBe('welcome');
    expect(() => createEmailTemplateSchema.parse({ name: '', slug: '', subject: '', body: '' })).toThrow();
    expect(updateEmailTemplateSchema.parse({ subject: 'New', isActive: true }).subject).toBe('New');
  });

  it('validates CMS pages', () => {
    const valid = {
      title: 'About',
      slug: 'about',
      content: 'Some page content',
      metaTitle: 'About Us',
      metaDescription: 'desc',
      layout: 'default',
    };
    expect(createCmsPageSchema.parse(valid).layout).toBe('default');
    expect(() => createCmsPageSchema.parse({ title: '', slug: '', content: '' })).toThrow();
    expect(updateCmsPageSchema.parse({ content: 'New', published: true }).published).toBe(true);
  });

  it('validates role permissions', () => {
    const valid = {
      role: 'admin',
      permissions: [{ module: 'courses', actions: ['create', 'read', 'update', 'delete'] }],
      description: 'd',
      isDefault: true,
    };
    expect(createRolePermissionSchema.parse(valid).role).toBe('admin');
    expect(() => createRolePermissionSchema.parse({ role: 'root', permissions: [] })).toThrow();
    expect(updateRolePermissionSchema.parse({ description: 'x', isDefault: false }).isDefault).toBe(false);
  });
});
