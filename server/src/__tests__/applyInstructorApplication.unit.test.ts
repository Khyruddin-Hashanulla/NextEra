import { mergeInstructorApplicationIntoUser } from '../utils/applyInstructorApplication';

describe('mergeInstructorApplicationIntoUser', () => {
  it('copies submitted application profile fields onto the user', () => {
    const user: any = {
      name: 'Old Name',
      bio: '',
      avatar: { url: '/old.png', publicId: 'old' },
      socialLinks: { youtube: '', twitter: '', linkedin: '', github: '', portfolio: '', website: '' },
    };
    const application: any = {
      fullName: 'Jane Doe',
      phone: '+15550000000',
      address: 'San Francisco, USA',
      photo: { url: '/new.png', publicId: 'new' },
      bio: 'I love teaching',
      linkedin: 'https://linkedin.com/in/jane',
      qualification: 'B.Tech in Computer Science',
      experience: 'Five years of industry and teaching experience',
      teachingCategories: ['60b9c1f2a1b2c3d4e5f60708'],
      resume: { url: '/resume.pdf', publicId: 'resume-1' },
      identityProof: { url: '/id.png', publicId: 'id-1' },
      demoVideo: { url: '/demo.mp4', publicId: 'demo-1' },
      bankDetails: { accountHolderName: 'Jane Doe', accountNumber: '1234567890' },
      taxDetails: { pan: 'ABCDE1234F', gst: 'GSTIN1234' },
    };

    mergeInstructorApplicationIntoUser(user, application);

    expect(user.name).toBe('Jane Doe');
    expect(user.phone).toBe('+15550000000');
    expect(user.address).toBe('San Francisco, USA');
    expect(user.avatar).toEqual({ url: '/new.png', publicId: 'new' });
    expect(user.bio).toBe('I love teaching');
    expect(user.socialLinks.linkedin).toBe('https://linkedin.com/in/jane');
    expect(user.instructorProfile).toMatchObject({
      qualification: 'B.Tech in Computer Science',
      experience: 'Five years of industry and teaching experience',
      teachingCategories: ['60b9c1f2a1b2c3d4e5f60708'],
      resume: { url: '/resume.pdf', publicId: 'resume-1' },
      identityProof: { url: '/id.png', publicId: 'id-1' },
      demoVideo: { url: '/demo.mp4', publicId: 'demo-1' },
      bankDetails: { accountHolderName: 'Jane Doe' },
      taxDetails: { pan: 'ABCDE1234F' },
    });
  });

  it('keeps existing user values when the application does not provide them', () => {
    const user: any = {
      name: 'Keep Name',
      bio: 'Keep bio',
      phone: '+1999',
      socialLinks: { youtube: '', twitter: '', linkedin: 'old-linkedin', github: '', portfolio: '', website: '' },
      instructorProfile: {
        qualification: 'Old degree',
        expertise: ['React', 'TypeScript'],
        completedCourses: 2,
        totalStudents: 120,
        teachingCategories: ['Development'],
        subscriptionStatus: 'basic',
      },
    };

    mergeInstructorApplicationIntoUser(user, {});

    expect(user.name).toBe('Keep Name');
    expect(user.bio).toBe('Keep bio');
    expect(user.phone).toBe('+1999');
    expect(user.socialLinks.linkedin).toBe('old-linkedin');
    expect(user.instructorProfile.qualification).toBe('Old degree');
    expect(user.instructorProfile.expertise).toEqual(['React', 'TypeScript']);
    expect(user.instructorProfile.completedCourses).toBe(2);
    expect(user.instructorProfile.totalStudents).toBe(120);
    expect(user.instructorProfile.teachingCategories).toEqual(['Development']);
    expect(user.instructorProfile.subscriptionStatus).toBe('basic');
  });
});
