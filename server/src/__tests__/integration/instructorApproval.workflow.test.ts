import request from 'supertest';
import { createApp } from '../../app';
import { connectTestDb, disconnectTestDb, clearDb } from '../../test/helpers/db.helper';
import { TestRequest } from '../../test/helpers/request.helper';
import { createUser, createAdmin } from '../../test/factories/user.factory';
import { User } from '../../models/user.model';
import { InstructorApplication } from '../../models/instructorApplication.model';
import { Notification } from '../../models/notification.model';
import { ROLES } from '../../constants/roles';

describe('Instructor Approval Workflow', () => {
  const app = createApp();
  let studentToken: string;
  let adminToken: string;

  beforeAll(async () => {
    await connectTestDb();
    await clearDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  const login = async (email: string, password: string): Promise<string> => {
    const api = new TestRequest(app);
    await api.fetchCsrfToken();
    const res = await api.post('/api/v1/auth/login').send({ email, password });
    expect(res.status).toBe(200);
    return res.body.data.accessToken;
  };

  const submitApplication = async (token: string, email: string) => {
    const api = new TestRequest(app);
    await api.fetchCsrfToken();
    const res = await api
      .post('/api/v1/instructor/apply', token)
      .field('fullName', 'Jane Doe')
      .field('email', email)
      .field('phone', '+15550000000')
      .field('address', 'San Francisco, USA')
      .field('qualification', 'B.Tech in Computer Science')
      .field('experience', 'Five years of industry and teaching experience')
      .field('teachingCategories', JSON.stringify(['60b9c1f2a1b2c3d4e5f60708']))
      .field(
        'bankDetails',
        JSON.stringify({
          accountHolderName: 'Jane Doe',
          accountNumber: '1234567890',
          ifscCode: 'HDFC0000000',
          bankName: 'HDFC Bank',
        })
      );
    expect(res.status).toBe(201);
    return res.body.data;
  };

  const createPendingApplication = async (user: any, overrides: Record<string, unknown> = {}) =>
    InstructorApplication.create({
      user: user._id,
      fullName: 'Jane Doe',
      email: user.email,
      phone: '+15550000000',
      address: 'San Francisco, USA',
      qualification: 'B.Tech in Computer Science',
      experience: 'Five years of industry and teaching experience',
      teachingCategories: ['60b9c1f2a1b2c3d4e5f60708'],
      bankDetails: {
        accountHolderName: 'Jane Doe',
        accountNumber: '1234567890',
        ifscCode: 'HDFC0000000',
        bankName: 'HDFC Bank',
      },
      ...overrides,
    });

  it('student applies, admin sees and approves, student becomes instructor', async () => {
    const student = await createUser({ name: 'Jane Doe', email: 'jane.applicant@example.com' });
    const admin = await createAdmin({ name: 'Admin One', email: 'admin.one@example.com' });

    studentToken = await login('jane.applicant@example.com', 'Test@1234');
    adminToken = await login('admin.one@example.com', 'Test@1234');

    // 1. Student submits application
    await submitApplication(studentToken, 'jane.applicant@example.com');

    // 2. Application is persisted with status pending
    const stored = await InstructorApplication.findOne({ user: student._id }).lean();
    expect(stored).toBeTruthy();
    expect(stored!.status).toBe('pending');
    expect(stored!.fullName).toBe('Jane Doe');

    // 3. Admin sees the pending application
    const pendingApi = new TestRequest(app);
    await pendingApi.fetchCsrfToken();
    const pendingRes = await pendingApi.get('/api/v1/admin/instructors/pending', adminToken);
    expect(pendingRes.status).toBe(200);
    const apps = pendingRes.body.data as any[];
    expect(apps.some((a) => a.email === 'jane.applicant@example.com' && a.status === 'pending')).toBe(true);
    const pendingApp = apps.find((a) => a.email === 'jane.applicant@example.com')!;
    expect(pendingApp.userId).toBe(student._id.toString());
    expect(pendingApp.name).toBe('Jane Doe');

    // 4. Admin approves using the application id returned by the listing
    const approveApi = new TestRequest(app);
    await approveApi.fetchCsrfToken();
    const approveRes = await approveApi.put(
      `/api/v1/admin/instructors/${pendingApp._id}/approve`,
      adminToken
    );
    expect(approveRes.status).toBe(200);

    // 5. Application marked approved and user promoted to instructor
    const updatedApp = await InstructorApplication.findById(pendingApp._id).lean();
    expect(updatedApp!.status).toBe('approved');
    expect(updatedApp!.reviewedBy?.toString()).toBe(admin._id.toString());
    const promoted = await User.findById(student._id).lean();
    expect(promoted!.role).toBe(ROLES.INSTRUCTOR);
    expect(promoted!.isActive).toBe(true);

    // Application profile data is merged onto the live User so the public
    // Instructor Details page (which reads the User) shows the full profile.
    expect(promoted!.name).toBe('Jane Doe');
    expect(promoted!.phone).toBe('+15550000000');
    expect(promoted!.address).toBe('San Francisco, USA');
    expect(promoted!.instructorProfile?.qualification).toBe('B.Tech in Computer Science');
    expect(promoted!.instructorProfile?.experience).toBe('Five years of industry and teaching experience');
    expect(promoted!.instructorProfile?.teachingCategories).toContain('60b9c1f2a1b2c3d4e5f60708');
    expect(promoted!.instructorProfile?.bankDetails?.accountHolderName).toBe('Jane Doe');

    // 6. Applicant receives an approval notification
    const notification = await Notification.findOne({ user: student._id }).lean();
    expect(notification).toBeTruthy();
    expect(notification!.type).toBe('approval');
    expect(notification!.title).toContain('approved');

    // 7. Student status endpoint reflects approved
    const statusApi = new TestRequest(app);
    await statusApi.fetchCsrfToken();
    const statusRes = await statusApi.get('/api/v1/instructor/application-status', studentToken);
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.data.applied).toBe(true);
    expect(statusRes.body.data.status).toBe('approved');

    // 8. Old token (issued before approval, role=student) is rejected on instructor routes
    const staleApi = new TestRequest(app);
    await staleApi.fetchCsrfToken();
    const staleRes = await staleApi.get('/api/v1/instructor/dashboard', studentToken);
    expect(staleRes.status).toBe(403);

    // 9. Fresh token carries the instructor role and unlocks the dashboard
    const freshToken = await login('jane.applicant@example.com', 'Test@1234');
    const freshApi = new TestRequest(app);
    await freshApi.fetchCsrfToken();
    const freshRes = await freshApi.get('/api/v1/instructor/dashboard', freshToken);
    expect(freshRes.status).toBe(200);

    // 10. Approved application no longer appears in pending list
    const pendingAfter = new TestRequest(app);
    await pendingAfter.fetchCsrfToken();
    const pendingAfterRes = await pendingAfter.get('/api/v1/admin/instructors/pending', adminToken);
    const remaining = pendingAfterRes.body.data as any[];
    expect(remaining.some((a) => a._id === pendingApp._id)).toBe(false);
  });

  it('rejecting an application does not delete the student account', async () => {
    const student = await createUser({ name: 'Bob Reject', email: 'bob.reject@example.com' });

    const bobToken = await login('bob.reject@example.com', 'Test@1234');
    await submitApplication(bobToken, 'bob.reject@example.com');

    const pendingApi = new TestRequest(app);
    await pendingApi.fetchCsrfToken();
    const pendingRes = await pendingApi.get('/api/v1/admin/instructors/pending', adminToken);
    const pendingItem = (pendingRes.body.data as any[]).find((a) => a.email === 'bob.reject@example.com')!;
    expect(pendingItem).toBeTruthy();

    const rejectApi = new TestRequest(app);
    await rejectApi.fetchCsrfToken();
    const rejectRes = await rejectApi
      .delete(`/api/v1/admin/instructors/${pendingItem._id}`, adminToken)
      .send({ rejectionReason: 'Insufficient teaching experience' });
    expect(rejectRes.status).toBe(200);

    const rejected = await InstructorApplication.findById(pendingItem._id).lean();
    expect(rejected!.status).toBe('rejected');
    expect(rejected!.rejectionReason).toBe('Insufficient teaching experience');

    const notification = await Notification.findOne({ user: student._id }).lean();
    expect(notification).toBeTruthy();
    expect(notification!.type).toBe('approval');
    expect(notification!.title).toContain('rejected');

    const user = await User.findById(student._id).lean();
    expect(user).toBeTruthy();
    expect(user!.isDeleted).toBe(false);
    expect(user!.role).toBe(ROLES.STUDENT);

    const pendingAfter = new TestRequest(app);
    await pendingAfter.fetchCsrfToken();
    const pendingAfterRes = await pendingAfter.get('/api/v1/admin/instructors/pending', adminToken);
    expect((pendingAfterRes.body.data as any[]).some((a) => a._id === pendingItem._id)).toBe(false);
  });

  it('admin can fetch the full application detail before deciding', async () => {
    const student = await createUser({ name: 'Carol Detail', email: 'carol.detail@example.com' });
    const application = await createPendingApplication(student);

    const pendingApi = new TestRequest(app);
    await pendingApi.fetchCsrfToken();
    const pendingRes = await pendingApi.get('/api/v1/admin/instructors/pending', adminToken);
    expect((pendingRes.body.data as any[]).some((a) => a._id === application._id.toString())).toBe(true);

    const detailApi = new TestRequest(app);
    await detailApi.fetchCsrfToken();
    const detailRes = await detailApi.get(`/api/v1/admin/instructors/${application._id}`, adminToken);
    expect(detailRes.status).toBe(200);

    const detail = detailRes.body.data as any;
    expect(detail.fullName).toBe('Jane Doe');
    expect(detail.qualification).toBe('B.Tech in Computer Science');
    expect(detail.experience).toContain('Five years');
    expect(detail.teachingCategories).toContain('60b9c1f2a1b2c3d4e5f60708');
    expect(detail.bankDetails.accountHolderName).toBe('Jane Doe');
    expect(detail.user.name).toBe('Carol Detail');
    expect(detail.status).toBe('pending');
  });

  it('rejecting an application without a reason is rejected with 400', async () => {
    const student = await createUser({ name: 'Dan Reason', email: 'dan.reason@example.com' });
    const application = await createPendingApplication(student);

    const rejectApi = new TestRequest(app);
    await rejectApi.fetchCsrfToken();
    const noReasonRes = await rejectApi.delete(`/api/v1/admin/instructors/${application._id}`, adminToken);
    expect(noReasonRes.status).toBe(400);

    const stillPending = await InstructorApplication.findById(application._id).lean();
    expect(stillPending!.status).toBe('pending');
  });

  it('approve stores an optional admin note', async () => {
    const student = await createUser({ name: 'Eve Note', email: 'eve.note@example.com' });
    const application = await createPendingApplication(student);

    const approveApi = new TestRequest(app);
    await approveApi.fetchCsrfToken();
    const approveRes = await approveApi
      .put(`/api/v1/admin/instructors/${application._id}/approve`, adminToken)
      .send({ adminNote: 'Verified documents and experience' });
    expect(approveRes.status).toBe(200);

    const approved = await InstructorApplication.findById(application._id).lean();
    expect(approved!.status).toBe('approved');
    expect(approved!.adminNote).toBe('Verified documents and experience');
  });
});
