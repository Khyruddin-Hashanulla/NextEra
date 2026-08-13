import { ApiError } from '../../../src/utils/ApiError';
import { CourseService } from '../../../src/services/course.service';
import { Course } from '../../../src/models/course.model';
import { Section } from '../../../src/models/section.model';
import { Lecture } from '../../../src/models/lecture.model';
import { User } from '../../../src/models/user.model';
import { Enrollment } from '../../../src/models/enrollment.model';
import { subscriptionPermissionService } from '../../../src/services/subscriptionPermission.service';
import { courseQuotaService } from '../../../src/services/courseQuota.service';
import { CourseCreationEvent } from '../../../src/models/courseCreationEvent.model';
import { cacheManager } from '../../../src/cache/cacheManager';
import { cascadeDeleteService } from '../../../src/services/cascadeDelete.service';
import { entitlementService } from '../../../src/services/entitlement.service';
import { uploadService } from '../../../src/services/upload.service';
import { buildCourseDoc } from '../../fixtures/courses';

vi.mock('../../../src/models/course.model', () => ({
  Course: {
    create: vi.fn(),
    findById: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

vi.mock('../../../src/models/section.model', () => ({
  Section: {
    create: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findOneAndDelete: vi.fn(),
    countDocuments: vi.fn(),
    aggregate: vi.fn(),
    bulkWrite: vi.fn(),
  },
}));

vi.mock('../../../src/models/lecture.model', () => ({
  Lecture: {
    create: vi.fn(),
    insertMany: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
    countDocuments: vi.fn(),
    aggregate: vi.fn(),
    bulkWrite: vi.fn(),
  },
}));

vi.mock('../../../src/models/user.model', () => ({
  User: { findByIdAndUpdate: vi.fn() },
}));

vi.mock('../../../src/models/enrollment.model', () => ({
  Enrollment: { findOne: vi.fn() },
}));

vi.mock('../../../src/utils/transaction', () => ({
  withTransaction: vi.fn(async (fn: (session: unknown) => Promise<unknown>) => fn({})),
}));

vi.mock('../../../src/cache/cache.service', () => ({
  cacheService: {
    remember: vi.fn(async (_key: unknown, _opts: unknown, factory: () => Promise<unknown>) => factory()),
  },
}));

vi.mock('../../../src/cache/cacheManager', () => ({
  cacheManager: { invalidateCourseCache: vi.fn(), invalidateStudentCourseList: vi.fn() },
}));

vi.mock('../../../src/services/subscriptionPermission.service', () => ({
  subscriptionPermissionService: {
    getInstructorPlanInfo: vi.fn(),
    requirePaidCoursePermission: vi.fn(),
    requirePublishPermission: vi.fn(),
  },
}));

vi.mock('../../../src/models/courseCreationEvent.model', () => ({
  CourseCreationEvent: { create: vi.fn(), updateMany: vi.fn(), countDocuments: vi.fn() },
}));

vi.mock('../../../src/services/courseQuota.service', () => ({
  courseQuotaService: {
    createCourseWithQuota: vi.fn(),
    detachEventOnCourseDelete: vi.fn(),
    getWindowUsage: vi.fn().mockResolvedValue(0),
    withQuotaLock: vi.fn(async (_instructorId: string, fn: () => Promise<unknown>) => fn()),
  },
}));

vi.mock('../../../src/services/entitlement.service', () => ({
  entitlementService: {
    getEntitlementView: vi.fn(),
    getActiveSubscriptionRecord: vi.fn(),
  },
}));

vi.mock('../../../src/models/instructorSubscriptionPlan.model', () => ({
  InstructorSubscriptionPlan: { findOne: vi.fn(), findById: vi.fn(), find: vi.fn() },
}));

vi.mock('../../../src/services/cascadeDelete.service', () => ({
  cascadeDeleteService: { deleteCourse: vi.fn(), deleteSection: vi.fn(), deleteLecture: vi.fn() },
}));

vi.mock('../../../src/services/upload.service', () => ({
  uploadService: { getVideoDuration: vi.fn() },
}));

const service = new CourseService();

function queryChain(value: unknown) {
  const q = Promise.resolve(value) as any;
  q.populate = vi.fn().mockReturnValue(q);
  q.select = vi.fn().mockReturnValue(q);
  q.sort = vi.fn().mockReturnValue(q);
  q.skip = vi.fn().mockReturnValue(q);
  q.limit = vi.fn().mockReturnValue(q);
  q.lean = vi.fn().mockReturnValue(value);
  q.exec = vi.fn().mockResolvedValue(value);
  return q;
}

function draftDoc() {
  return buildCourseDoc({ status: 'draft', isApproved: false, courseType: 'free', price: 0 });
}

function reviewDoc() {
  return buildCourseDoc({ status: 'review', isApproved: false });
}

describe('create', () => {
  afterEach(() => vi.clearAllMocks());

  it('enforces paid course permission for paid courses', async () => {
    vi.mocked(courseQuotaService.createCourseWithQuota).mockRejectedValue(ApiError.forbidden('Upgrade to Pro'));
    await expect(service.create('i1', { price: 500, title: 'Paid Course' })).rejects.toThrow('Upgrade to Pro');
    expect(Course.create).not.toHaveBeenCalled();
  });

  it('creates a free course through the quota service without paid permission', async () => {
    vi.mocked(courseQuotaService.createCourseWithQuota).mockResolvedValue(draftDoc() as never);
    const result = await service.create('i1', { price: 0, title: 'Free Course' });
    expect(courseQuotaService.createCourseWithQuota).toHaveBeenCalledWith('i1', {
      price: 0,
      title: 'Free Course',
    });
    expect(subscriptionPermissionService.requirePaidCoursePermission).not.toHaveBeenCalled();
    expect(cacheManager.invalidateCourseCache).toHaveBeenCalled();
    expect((result as any).title).toBe('Introduction to React');
  });
});

describe('update', () => {
  afterEach(() => vi.clearAllMocks());

  it('strips protected fields before updating', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(queryChain(buildCourseDoc({ price: 0, courseType: 'free' })));
    vi.mocked(Course.findByIdAndUpdate as never).mockReturnValue(queryChain(buildCourseDoc({ title: 'Renamed' })));

    const result = await service.update('c1', {
      title: 'Renamed',
      status: 'published',
      isApproved: true,
      isActive: true,
    });

    const callArg = (Course.findByIdAndUpdate as any).mock.calls[0][1] as any;
    expect(callArg.$set).not.toHaveProperty('status');
    expect(callArg.$set).not.toHaveProperty('isApproved');
    expect(callArg.$set).not.toHaveProperty('isActive');
    expect(callArg.$set.title).toBe('Renamed');
    expect(callArg.$set.lastActivity).toBeInstanceOf(Date);
    expect(result.title).toBe('Renamed');
  });

  it('enforces paid permission when converting a free course to paid', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(
      queryChain(buildCourseDoc({ price: 0, courseType: 'free', instructor: { toString: () => 'i1' } }))
    );
    vi.mocked(subscriptionPermissionService.requirePaidCoursePermission).mockRejectedValue(
      ApiError.forbidden('Upgrade to Pro')
    );

    await expect(service.update('c1', { price: 999 })).rejects.toThrow('Upgrade to Pro');
  });

  it('blocks re-pricing an existing paid course after the instructor lost paid access', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(
      queryChain(buildCourseDoc({ price: 999, courseType: 'paid', instructor: { toString: () => 'i1' } }))
    );
    vi.mocked(subscriptionPermissionService.requirePaidCoursePermission).mockRejectedValue(
      ApiError.forbidden('Upgrade to Pro')
    );

    await expect(service.update('c1', { price: 1500 })).rejects.toThrow('Upgrade to Pro');
  });

  it('blocks toggling courseType to paid when the instructor lacks paid access', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(
      queryChain(buildCourseDoc({ price: 0, courseType: 'free', instructor: { toString: () => 'i1' } }))
    );
    vi.mocked(subscriptionPermissionService.requirePaidCoursePermission).mockRejectedValue(
      ApiError.forbidden('Upgrade to Pro')
    );

    await expect(service.update('c1', { courseType: 'paid' })).rejects.toThrow('Upgrade to Pro');
  });

  it('allows a downgraded instructor to make a paid course free', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(
      queryChain(buildCourseDoc({ price: 999, courseType: 'paid', instructor: { toString: () => 'i1' } }))
    );
    vi.mocked(Course.findByIdAndUpdate as never).mockReturnValue(
      queryChain(buildCourseDoc({ price: 0, courseType: 'free' }))
    );

    await service.update('c1', { price: 0, courseType: 'free' });

    expect(subscriptionPermissionService.requirePaidCoursePermission).not.toHaveBeenCalled();
  });

  it('does not require paid permission for non-monetization edits to a paid course', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(
      queryChain(buildCourseDoc({ price: 999, courseType: 'paid', instructor: { toString: () => 'i1' } }))
    );
    vi.mocked(Course.findByIdAndUpdate as never).mockReturnValue(queryChain(buildCourseDoc({ title: 'Renamed' })));

    await service.update('c1', { title: 'Renamed' });

    expect(subscriptionPermissionService.requirePaidCoursePermission).not.toHaveBeenCalled();
  });

  it('throws when the course is missing', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(queryChain(null));
    await expect(service.update('c1', { title: 'x' })).rejects.toThrow('Course not found');
  });
});

describe('publishing workflow', () => {
  afterEach(() => vi.clearAllMocks());

  it('submitForReview rejects non-draft/rejected courses', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(queryChain(buildCourseDoc()));
    await expect(service.submitForReview('c1')).rejects.toThrow(
      'Only draft or rejected courses can be submitted for review'
    );
  });

  it('submitForReview requires at least one section', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(queryChain(draftDoc()));
    vi.mocked(Section.countDocuments as never).mockResolvedValue(0);
    await expect(service.submitForReview('c1')).rejects.toThrow('Course must have at least one section');
  });

  it('submitForReview requires a lecture and a video lecture', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(queryChain(draftDoc()));
    vi.mocked(Section.countDocuments as never).mockResolvedValue(1);
    vi.mocked(Lecture.countDocuments as never).mockResolvedValue(0);
    await expect(service.submitForReview('c1')).rejects.toThrow('Course must have at least one lecture');
  });

  it('submitForReview requires a video lecture', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(queryChain(draftDoc()));
    vi.mocked(Section.countDocuments as never).mockResolvedValue(1);
    vi.mocked(Lecture.countDocuments as never).mockResolvedValue(1);
    vi.mocked(Lecture.countDocuments as never)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0);
    await expect(service.submitForReview('c1')).rejects.toThrow('Course must have at least one video lecture');
  });

  it('submitForReview recalculates totals and moves to review', async () => {
    const draft = draftDoc();
    vi.mocked(Course.findById as never).mockReturnValue(queryChain(draft));
    vi.mocked(Section.countDocuments as never).mockResolvedValue(2);
    vi.mocked(Lecture.countDocuments as never).mockResolvedValue(3);
    vi.mocked(Lecture.find as never).mockResolvedValue([
      { duration: 10, resources: [] },
      { duration: 20, resources: [{}, {}] },
    ]);
    vi.mocked(Section.find as never).mockResolvedValue([{}, {}]);

    const result = await service.submitForReview('c1');

    expect(result.status).toBe('review');
    expect(draft.totalLectures).toBe(2);
    expect(draft.totalSections).toBe(2);
    expect(draft.totalDuration).toBe(30);
    expect(draft.totalResources).toBe(2);
    expect(draft.rejectionReason).toBe('');
    expect(draft.save).toHaveBeenCalled();
  });

  it('approve requires review status', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(queryChain(draftDoc()));
    await expect(service.approve('c1')).rejects.toThrow('Course must be in review status to approve');
  });

  it('approve moves a reviewed course to approved', async () => {
    const course = reviewDoc();
    vi.mocked(Course.findById as never).mockReturnValue(queryChain(course));
    const result = await service.approve('c1');
    expect(result.status).toBe('approved');
    expect(course.save).toHaveBeenCalled();
  });

  it('reject requires review status', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(queryChain(draftDoc()));
    await expect(service.reject('c1')).rejects.toThrow('Course must be in review status to reject');
  });

  it('reject records the reason', async () => {
    const course = reviewDoc();
    vi.mocked(Course.findById as never).mockReturnValue(queryChain(course));
    const result = await service.reject('c1', 'Bad content');
    expect(result.status).toBe('rejected');
    expect(result.rejectionReason).toBe('Bad content');
    expect(course.save).toHaveBeenCalled();
  });

  it('publish requires an approved course', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(queryChain(draftDoc()));
    await expect(service.publish('c1')).rejects.toThrow('Course must be approved before publishing');
  });

  it('publish requires sections and lectures', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(
      queryChain(buildCourseDoc({ status: 'approved', courseType: 'free', price: 0 }))
    );
    vi.mocked(subscriptionPermissionService.requirePublishPermission).mockResolvedValue(undefined);
    vi.mocked(Section.countDocuments as never).mockResolvedValue(0);
    await expect(service.publish('c1')).rejects.toThrow('Add at least one section before publishing');
  });

  it('publish sets the course type based on price', async () => {
    const approved = buildCourseDoc({ status: 'approved', price: 1999, courseType: 'draft' });
    vi.mocked(Course.findById as never).mockReturnValue(queryChain(approved));
    vi.mocked(subscriptionPermissionService.requirePublishPermission).mockResolvedValue(undefined);
    vi.mocked(Section.countDocuments as never).mockResolvedValue(1);
    vi.mocked(Lecture.countDocuments as never).mockResolvedValue(1);
    vi.mocked(Lecture.find as never).mockResolvedValue([]);
    vi.mocked(Section.find as never).mockResolvedValue([]);

    const result = await service.publish('c1');

    expect(result.status).toBe('published');
    expect(result.courseType).toBe('paid');
    expect(subscriptionPermissionService.requirePublishPermission).toHaveBeenCalled();
    expect(cacheManager.invalidateStudentCourseList).toHaveBeenCalled();
  });

  it('unpublish requires a published course', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(queryChain(draftDoc()));
    await expect(service.unpublish('c1')).rejects.toThrow('Only published courses can be unpublished');
  });

  it('unpublish moves to draft', async () => {
    const course = buildCourseDoc();
    vi.mocked(Course.findById as never).mockReturnValue(queryChain(course));
    const result = await service.unpublish('c1');
    expect(result.status).toBe('draft');
    expect(course.save).toHaveBeenCalled();
  });

  it('archive allows only published or approved', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(queryChain(draftDoc()));
    await expect(service.archive('c1')).rejects.toThrow('Only published or approved courses can be archived');
  });

  it('archive moves a published course to archived', async () => {
    const course = buildCourseDoc();
    vi.mocked(Course.findById as never).mockReturnValue(queryChain(course));
    const result = await service.archive('c1');
    expect(result.status).toBe('archived');
  });

  it('restore requires archived status', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(queryChain(draftDoc()));
    await expect(service.restore('c1')).rejects.toThrow('Only archived courses can be restored');
  });

  it('restore moves an archived course to draft', async () => {
    const course = buildCourseDoc({ status: 'archived' });
    vi.mocked(Course.findById as never).mockReturnValue(queryChain(course));
    const result = await service.restore('c1');
    expect(result.status).toBe('draft');
  });

  it('toggleFeatured flips the featured flag', async () => {
    const course = buildCourseDoc({ featured: false });
    vi.mocked(Course.findById as never).mockReturnValue(queryChain(course));
    const result = await service.toggleFeatured('c1');
    expect(result.featured).toBe(true);
    expect(course.save).toHaveBeenCalled();
  });
});

describe('getLecture', () => {
  afterEach(() => vi.clearAllMocks());

  it('blocks non-enrolled students from paid lectures', async () => {
    vi.mocked(Lecture.findOne as never).mockReturnValue(
      queryChain({ _id: 'l1', isFree: false, section: 's1', order: 1 })
    );
    vi.mocked(Enrollment.findOne as never).mockReturnValue(queryChain(null));
    await expect(service.getLecture('l1', 'c1', 'u1')).rejects.toThrow('Not enrolled in this course');
  });

  it('allows enrolled students and attaches navigation', async () => {
    vi.mocked(Lecture.findOne as never)
      .mockReturnValueOnce(queryChain({ _id: 'l1', isFree: false, section: 's1', order: 2 }))
      .mockReturnValueOnce(queryChain({ _id: 'l0', title: 'Prev' }))
      .mockReturnValueOnce(queryChain({ _id: 'l2', title: 'Next' }));
    vi.mocked(Enrollment.findOne as never).mockReturnValue(queryChain({ _id: 'e1' }));
    vi.mocked(Section.findById as never).mockReturnValue(queryChain({ _id: 's1', title: 'Intro' }));

    const result = await service.getLecture('l1', 'c1', 'u1');

    expect(result.section).toEqual({ _id: 's1', title: 'Intro' });
    expect(result.prevLecture).toEqual({ _id: 'l0', title: 'Prev' });
    expect(result.nextLecture).toEqual({ _id: 'l2', title: 'Next' });
  });

  it('allows free lectures without enrollment', async () => {
    vi.mocked(Lecture.findOne as never)
      .mockReturnValueOnce(queryChain({ _id: 'l1', isFree: true, section: 's1', order: 1 }))
      .mockReturnValueOnce(queryChain(null))
      .mockReturnValueOnce(queryChain(null));
    vi.mocked(Enrollment.findOne as never).mockReturnValue(queryChain(null));
    vi.mocked(Section.findById as never).mockReturnValue(queryChain(null));
    const result = await service.getLecture('l1', 'c1', 'u1');
    expect(result.section).toBeNull();
  });

  it('throws when the lecture is missing', async () => {
    vi.mocked(Lecture.findOne as never).mockReturnValue(queryChain(null));
    await expect(service.getLecture('l1', 'c1')).rejects.toThrow('Lecture not found');
  });

  it('blocks unauthenticated users from paid lectures', async () => {
    vi.mocked(Lecture.findOne as never).mockReturnValue(
      queryChain({ _id: 'l1', isFree: false, section: 's1', order: 1 })
    );
    await expect(service.getLecture('l1', 'c1')).rejects.toThrow('Not enrolled in this course');
  });

  it('strips answer keys from free lectures for unauthenticated users', async () => {
    vi.mocked(Lecture.findOne as never)
      .mockReturnValueOnce(
        queryChain({
          _id: 'l1',
          isFree: true,
          section: 's1',
          order: 1,
          title: 'Free Video',
          quiz: { questions: [{ question: 'Q1', correctAnswer: 'A', explanation: 'because' }] },
        })
      )
      .mockReturnValueOnce(queryChain(null))
      .mockReturnValueOnce(queryChain(null));
    vi.mocked(Section.findById as never).mockReturnValue(queryChain(null));

    const result = await service.getLecture('l1', 'c1');

    expect(result.quiz.questions[0]).not.toHaveProperty('correctAnswer');
    expect(result.quiz.questions[0]).not.toHaveProperty('explanation');
    expect(result.quiz.questions[0].question).toBe('Q1');
  });

  it('keeps answer keys for enrolled students', async () => {
    vi.mocked(Lecture.findOne as never)
      .mockReturnValueOnce(
        queryChain({
          _id: 'l1',
          isFree: false,
          section: 's1',
          order: 2,
          quiz: { questions: [{ question: 'Q1', correctAnswer: 'B', explanation: 'because' }] },
        })
      )
      .mockReturnValueOnce(queryChain({ _id: 'l0', title: 'Prev' }))
      .mockReturnValueOnce(queryChain(null));
    vi.mocked(Enrollment.findOne as never).mockReturnValue(queryChain({ _id: 'e1' }));
    vi.mocked(Section.findById as never).mockReturnValue(queryChain(null));

    const result = await service.getLecture('l1', 'c1', 'u1');

    expect(result.quiz.questions[0].correctAnswer).toBe('B');
  });
});

describe('reorderSections', () => {
  afterEach(() => vi.clearAllMocks());

  it('renumbers sections by array index via bulkWrite inside a transaction', async () => {
    const s1 = '507f1f77bcf86cd799439020';
    const s2 = '507f1f77bcf86cd799439021';
    vi.mocked(Section.find as never).mockReturnValue(queryChain([{ _id: s1 }, { _id: s2 }]));
    vi.mocked(Section.bulkWrite as never).mockResolvedValue({});
    vi.mocked(Course.findByIdAndUpdate as never).mockResolvedValue({});

    await service.reorderSections('c1', [
      { sectionId: s1, order: 9 },
      { sectionId: s2, order: 5 },
    ]);

    expect(Section.bulkWrite).toHaveBeenCalledWith(
      [
        {
          updateOne: {
            filter: { _id: expect.anything(), course: 'c1' },
            update: { $set: { order: 0 } },
          },
        },
        {
          updateOne: {
            filter: { _id: expect.anything(), course: 'c1' },
            update: { $set: { order: 1 } },
          },
        },
      ],
      { session: {} }
    );
    expect(Course.findByIdAndUpdate).toHaveBeenCalledWith('c1', { lastActivity: expect.any(Date) }, { session: {} });
    expect(cacheManager.invalidateCourseCache).toHaveBeenCalled();
  });

  it('rejects an empty reorder list', async () => {
    await expect(service.reorderSections('c1', [])).rejects.toThrow('Reorder list cannot be empty');
    expect(Section.bulkWrite).not.toHaveBeenCalled();
  });

  it('rejects duplicate sections in the list', async () => {
    vi.mocked(Section.find as never).mockReturnValue(queryChain([{ _id: 's1' }]));
    await expect(
      service.reorderSections('c1', [
        { sectionId: 's1', order: 0 },
        { sectionId: 's1', order: 1 },
      ])
    ).rejects.toThrow('Reorder list contains duplicate sections');
    expect(Section.bulkWrite).not.toHaveBeenCalled();
  });

  it('rejects sections that do not belong to the course', async () => {
    vi.mocked(Section.find as never).mockReturnValue(queryChain([{ _id: 's1' }]));
    await expect(
      service.reorderSections('c1', [
        { sectionId: 's1', order: 0 },
        { sectionId: 'foreign', order: 1 },
      ])
    ).rejects.toThrow('One or more sections do not belong to this course');
    expect(Section.bulkWrite).not.toHaveBeenCalled();
  });

  it('rejects the request when it does not include every section of the course', async () => {
    vi.mocked(Section.find as never).mockReturnValue(queryChain([{ _id: 's1' }, { _id: 's2' }]));
    await expect(service.reorderSections('c1', [{ sectionId: 's1', order: 0 }])).rejects.toThrow(
      'Reorder list must include every section of the course'
    );
    expect(Section.bulkWrite).not.toHaveBeenCalled();
  });
});

describe('reorderLectures', () => {
  afterEach(() => vi.clearAllMocks());

  it('renumbers lectures by array index via bulkWrite inside a transaction', async () => {
    const l1 = '507f1f77bcf86cd799439022';
    const l2 = '507f1f77bcf86cd799439023';
    vi.mocked(Section.findOne as never).mockReturnValue(queryChain({ _id: 's1' }));
    vi.mocked(Lecture.find as never).mockReturnValue(queryChain([{ _id: l1 }, { _id: l2 }]));
    vi.mocked(Lecture.bulkWrite as never).mockResolvedValue({});
    vi.mocked(Course.findByIdAndUpdate as never).mockResolvedValue({});

    await service.reorderLectures('s1', 'c1', [
      { lectureId: l1, order: 2 },
      { lectureId: l2, order: 1 },
    ]);

    expect(Lecture.bulkWrite).toHaveBeenCalledWith(
      [
        {
          updateOne: {
            filter: { _id: expect.anything(), section: 's1', course: 'c1' },
            update: { $set: { order: 0 } },
          },
        },
        {
          updateOne: {
            filter: { _id: expect.anything(), section: 's1', course: 'c1' },
            update: { $set: { order: 1 } },
          },
        },
      ],
      { session: {} }
    );
    expect(Course.findByIdAndUpdate).toHaveBeenCalledWith('c1', { lastActivity: expect.any(Date) }, { session: {} });
  });

  it('throws when the section is not part of the course', async () => {
    vi.mocked(Section.findOne as never).mockReturnValue(queryChain(null));
    await expect(service.reorderLectures('foreign-section', 'c1', [{ lectureId: 'l1', order: 1 }])).rejects.toThrow(
      'Section not found'
    );
  });

  it('rejects lectures that do not belong to the section', async () => {
    vi.mocked(Section.findOne as never).mockReturnValue(queryChain({ _id: 's1' }));
    vi.mocked(Lecture.find as never).mockReturnValue(queryChain([{ _id: 'l1' }]));
    await expect(
      service.reorderLectures('s1', 'c1', [
        { lectureId: 'l1', order: 0 },
        { lectureId: 'foreign', order: 1 },
      ])
    ).rejects.toThrow('One or more lectures do not belong to this section');
    expect(Lecture.bulkWrite).not.toHaveBeenCalled();
  });

  it('rejects duplicate lectures in the list', async () => {
    vi.mocked(Section.findOne as never).mockReturnValue(queryChain({ _id: 's1' }));
    vi.mocked(Lecture.find as never).mockReturnValue(queryChain([{ _id: 'l1' }]));
    await expect(
      service.reorderLectures('s1', 'c1', [
        { lectureId: 'l1', order: 0 },
        { lectureId: 'l1', order: 1 },
      ])
    ).rejects.toThrow('Reorder list contains duplicate lectures');
    expect(Lecture.bulkWrite).not.toHaveBeenCalled();
  });

  it('rejects the request when it does not include every lecture of the section', async () => {
    vi.mocked(Section.findOne as never).mockReturnValue(queryChain({ _id: 's1' }));
    vi.mocked(Lecture.find as never).mockReturnValue(queryChain([{ _id: 'l1' }, { _id: 'l2' }]));
    await expect(service.reorderLectures('s1', 'c1', [{ lectureId: 'l1', order: 0 }])).rejects.toThrow(
      'Reorder list must include every lecture of the section'
    );
    expect(Lecture.bulkWrite).not.toHaveBeenCalled();
  });
});

describe('getById / getBySlug / listAll', () => {
  afterEach(() => vi.clearAllMocks());

  it('getById throws when the course is missing', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(queryChain(null));
    await expect(service.getById('c1')).rejects.toThrow('Course not found');
  });

  it('getById returns the course through the cache', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(queryChain(buildCourseDoc()));
    const result = await service.getById('c1');
    expect(result.title).toBe('Introduction to React');
  });

  it('getBySlug returns the course', async () => {
    vi.mocked(Course.findOne as never).mockReturnValue(queryChain(buildCourseDoc()));
    const result = await service.getBySlug('intro-to-react');
    expect(result.title).toBe('Introduction to React');
  });

  it('listAll defaults to a published filter with pagination', async () => {
    vi.mocked(Course.find as never).mockReturnValue(queryChain([buildCourseDoc()]));
    vi.mocked(Course.countDocuments as never).mockResolvedValue(25);

    const result = await service.listAll({ page: 2, limit: 10 });

    expect(Course.find).toHaveBeenCalledWith({ status: 'published' });
    expect(result).toEqual({
      courses: [expect.objectContaining({ title: 'Introduction to React' })],
      total: 25,
      page: 2,
      limit: 10,
      totalPages: 3,
    });
  });

  it('listAll applies a search filter', async () => {
    vi.mocked(Course.find as never).mockReturnValue(queryChain([]));
    vi.mocked(Course.countDocuments as never).mockResolvedValue(0);
    await service.listAll({ search: 'react', limit: 10 });
    expect(Course.find).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.objectContaining({ $regex: 'react' }) })
    );
  });

  it('listAll applies category, level and featured filters', async () => {
    vi.mocked(Course.find as never).mockReturnValue(queryChain([]));
    vi.mocked(Course.countDocuments as never).mockResolvedValue(0);
    await service.listAll({ category: 'cat1', level: 'beginner', featured: true, limit: 10 });
    expect(Course.find).toHaveBeenCalledWith({
      category: 'cat1',
      level: 'beginner',
      status: 'published',
      featured: true,
    });
  });
});

describe('getCurriculum', () => {
  afterEach(() => vi.clearAllMocks());

  it('returns only free lectures with metadata, no answer keys, for public viewers', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(queryChain({ _id: 'c1', title: 'React' }));
    vi.mocked(Section.find as never).mockReturnValue(queryChain([{ _id: 's1', title: 'Intro' }]));
    vi.mocked(Lecture.find as never).mockReturnValue(
      queryChain([
        {
          _id: 'l1',
          title: 'Free Preview',
          type: 'video',
          duration: 5,
          isFree: true,
          order: 1,
          videoUrl: { url: 'preview.mp4' },
          quiz: { questions: [{ question: 'Q', correctAnswer: 'A' }] },
        },
        {
          _id: 'l2',
          title: 'Paid Video',
          type: 'video',
          duration: 20,
          isFree: false,
          order: 2,
          videoUrl: { url: 'paid.mp4' },
        },
      ])
    );

    const result = await service.getCurriculum('c1');

    const lectures = result[0].lectures;
    expect(lectures).toHaveLength(1);
    expect(lectures[0]._id).toBe('l1');
    expect(lectures[0]).not.toHaveProperty('quiz');
    expect(lectures[0].videoUrl).toBeDefined();
  });
});

describe('getOwnerCurriculum', () => {
  afterEach(() => vi.clearAllMocks());

  it('keeps full content and answer keys for the owner', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(queryChain({ _id: 'c1', title: 'React' }));
    vi.mocked(Section.find as never).mockReturnValue(queryChain([{ _id: 's1', title: 'Intro' }]));
    vi.mocked(Lecture.find as never).mockReturnValue(
      queryChain([
        {
          _id: 'l1',
          title: 'Video',
          type: 'video',
          duration: 10,
          isFree: false,
          order: 1,
          videoUrl: { url: 'paid.mp4' },
          quiz: { questions: [{ question: 'Q', correctAnswer: 'A' }] },
        },
      ])
    );

    const result = await service.getOwnerCurriculum('c1');

    const lecture = result[0].lectures[0];
    expect(lecture.videoUrl).toBeDefined();
    expect(lecture.quiz.questions[0].question).toBe('Q');
    expect(lecture.quiz.questions[0].correctAnswer).toBe('A');
  });
});

describe('createSection', () => {
  afterEach(() => vi.clearAllMocks());

  it('assigns the next order based on the last section', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(queryChain(buildCourseDoc()));
    vi.mocked(Section.findOne as never).mockReturnValue(queryChain({ order: 4 }));
    vi.mocked(Section.create as never).mockResolvedValue([{ _id: 'sec1', order: 5 }]);

    const result = await service.createSection('c1', { title: 'New Section' });

    expect(Section.create).toHaveBeenCalledWith([{ course: 'c1', title: 'New Section', order: 5 }], expect.any(Object));
    expect(Course.findByIdAndUpdate).toHaveBeenCalledWith(
      'c1',
      { $inc: { totalSections: 1 }, lastActivity: expect.any(Date) },
      expect.any(Object)
    );
    expect(result).toEqual({ _id: 'sec1', order: 5 });
  });

  it('throws when the course is missing', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(queryChain(null));
    await expect(service.createSection('c1', { title: 'New Section' })).rejects.toThrow('Course not found');
  });
});


describe('createLecture', () => {
  afterEach(() => vi.clearAllMocks());

  const sectionId = '507f1f77bcf86cd799439011';
  const publicId = 'pub123';

  function mockRecalculations() {
    vi.mocked(Lecture.aggregate as never).mockResolvedValue([]);
    vi.mocked(Section.aggregate as never).mockResolvedValue([]);
    vi.mocked(Course.findByIdAndUpdate as never).mockResolvedValue({});
  }

  it('overrides the client duration with the Cloudinary-derived value for direct uploads', async () => {
    vi.mocked(Section.findOne as never).mockReturnValue(queryChain({ _id: sectionId }));
    vi.mocked(Lecture.findOne as never).mockReturnValue(queryChain(null));
    vi.mocked(uploadService.getVideoDuration as never).mockResolvedValue(1122);
    vi.mocked(Lecture.create as never).mockResolvedValue({ _id: 'l1', duration: 1122 });
    mockRecalculations();

    await service.createLecture(sectionId, '507f1f77bcf86cd799439014', {
      title: 'Video',
      type: 'video',
      duration: 10,
      videoSource: { source: 'direct', videoId: publicId, url: 'https://cdn/v.mp4' },
      videoUrl: { url: 'https://cdn/v.mp4', publicId },
    });

    expect(uploadService.getVideoDuration).toHaveBeenCalledWith(publicId);
    expect(Lecture.create).toHaveBeenCalledWith(
      expect.objectContaining({ section: sectionId, course: '507f1f77bcf86cd799439014', duration: 1122, order: 0 })
    );
  });

  it('keeps the client duration when the Cloudinary lookup fails', async () => {
    vi.mocked(Section.findOne as never).mockReturnValue(queryChain({ _id: sectionId }));
    vi.mocked(Lecture.findOne as never).mockReturnValue(queryChain(null));
    vi.mocked(uploadService.getVideoDuration as never).mockResolvedValue(null);
    vi.mocked(Lecture.create as never).mockResolvedValue({ _id: 'l1', duration: 10 });
    mockRecalculations();

    await service.createLecture(sectionId, '507f1f77bcf86cd799439014', {
      title: 'Video',
      type: 'video',
      duration: 10,
      videoSource: { source: 'direct', videoId: publicId, url: 'https://cdn/v.mp4' },
    });

    expect(Lecture.create).toHaveBeenCalledWith(
      expect.objectContaining({ section: sectionId, course: '507f1f77bcf86cd799439014', duration: 10, order: 0 })
    );
  });

  it('does not query Cloudinary for non-direct sources', async () => {
    vi.mocked(Section.findOne as never).mockReturnValue(queryChain({ _id: sectionId }));
    vi.mocked(Lecture.findOne as never).mockReturnValue(queryChain(null));
    vi.mocked(Lecture.create as never).mockResolvedValue({ _id: 'l1', duration: 120 });
    mockRecalculations();

    await service.createLecture(sectionId, '507f1f77bcf86cd799439014', {
      title: 'Video',
      type: 'video',
      duration: 120,
      videoSource: { source: 'youtube', videoId: 'abc123', url: '' },
    });

    expect(uploadService.getVideoDuration).not.toHaveBeenCalled();
    expect(Lecture.create).toHaveBeenCalledWith(
      expect.objectContaining({ section: sectionId, course: '507f1f77bcf86cd799439014', duration: 120, order: 0 })
    );
  });

  it('does not query Cloudinary for non-video lectures', async () => {
    vi.mocked(Section.findOne as never).mockReturnValue(queryChain({ _id: sectionId }));
    vi.mocked(Lecture.findOne as never).mockReturnValue(queryChain(null));
    vi.mocked(Lecture.create as never).mockResolvedValue({ _id: 'l1', duration: 0 });
    mockRecalculations();

    await service.createLecture(sectionId, '507f1f77bcf86cd799439014', { title: 'Article', type: 'article', duration: 0 });

    expect(uploadService.getVideoDuration).not.toHaveBeenCalled();
    expect(Lecture.create).toHaveBeenCalledWith(
      expect.objectContaining({ section: sectionId, course: '507f1f77bcf86cd799439014', duration: 0, order: 0 })
    );
  });
});

describe('updateLecture', () => {
  afterEach(() => vi.clearAllMocks());

  const lectureId = '507f1f77bcf86cd799439013';
  const sectionId = '507f1f77bcf86cd799439011';

  it('derives the authoritative duration for an updated direct upload', async () => {
    vi.mocked(Lecture.findOne as never).mockReturnValue(
      queryChain({
        _id: lectureId,
        section: sectionId,
        course: '507f1f77bcf86cd799439014',
        type: 'video',
        duration: 10,
        videoSource: { source: 'direct', videoId: 'pub123', url: 'https://cdn/v.mp4' },
      })
    );
    vi.mocked(uploadService.getVideoDuration as never).mockResolvedValue(1180);
    vi.mocked(Lecture.findOneAndUpdate as never).mockReturnValue(
      queryChain({ _id: lectureId, section: sectionId, duration: 1180 })
    );
    vi.mocked(Lecture.aggregate as never).mockResolvedValue([]);
    vi.mocked(Section.aggregate as never).mockResolvedValue([]);
    vi.mocked(Course.findByIdAndUpdate as never).mockResolvedValue({});

    await service.updateLecture(lectureId, '507f1f77bcf86cd799439014', { title: 'Renamed', duration: 9999 });

    expect(uploadService.getVideoDuration).toHaveBeenCalledWith('pub123');
    expect(Lecture.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: lectureId, course: '507f1f77bcf86cd799439014' },
      { $set: expect.objectContaining({ title: 'Renamed', duration: 1180 }) },
      { new: true, runValidators: true }
    );
  });

  it('throws when the lecture is missing', async () => {
    vi.mocked(Lecture.findOne as never).mockReturnValue(queryChain(null));
    await expect(service.updateLecture(lectureId, '507f1f77bcf86cd799439014', { title: 'X' })).rejects.toThrow('Lecture not found');
  });
});

describe('delete', () => {
  afterEach(() => vi.clearAllMocks());

  it('deletes the course and cascades', async () => {
    const course = buildCourseDoc();
    vi.mocked(Course.findByIdAndDelete as never).mockResolvedValue(course);

    const result = await service.delete('c1');

    expect(cascadeDeleteService.deleteCourse).toHaveBeenCalledWith('c1', expect.anything());
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      course.instructor,
      { $inc: { totalCourses: -1 } },
      expect.any(Object)
    );
    expect(result).toEqual({ deleted: true });
  });

  it('throws when the course is missing', async () => {
    vi.mocked(Course.findByIdAndDelete as never).mockResolvedValue(null);
    await expect(service.delete('c1')).rejects.toThrow('Course not found');
  });
});

describe('duplicate', () => {
  afterEach(() => vi.clearAllMocks());

  const paidOriginal = buildCourseDoc({
    _id: 'c1',
    price: 999,
    courseType: 'paid',
    instructor: { toString: () => 'i1' },
  });

  const paidView = {
    entitlements: {
      courses: {
        canCreateFree: true,
        canCreatePaid: true,
        maxCreationCount: 2,
        creationWindowDays: 30,
        maxPublishedCourses: 2,
        unlimitedCreationMode: false,
        highCreationCap: 0,
      },
    },
  };

  it('runs the quota check + creation under the advisory lock', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(queryChain(paidOriginal));
    vi.mocked(entitlementService.getEntitlementView as never).mockResolvedValue(paidView);
    vi.mocked(courseQuotaService.getWindowUsage as never).mockResolvedValue(0);
    vi.mocked(Course.create as never).mockResolvedValue([{ _id: 'new1', title: 'X (Copy)' }]);
    vi.mocked(CourseCreationEvent.create as never).mockResolvedValue({});
    vi.mocked(User.findByIdAndUpdate as never).mockResolvedValue({});
    vi.mocked(Section.find as never).mockReturnValue(queryChain([]));

    await service.duplicate('c1', 'i1');

    expect(courseQuotaService.withQuotaLock).toHaveBeenCalledWith('i1', expect.any(Function));
    expect(courseQuotaService.getWindowUsage).toHaveBeenCalledWith('i1', 30);
    expect(Course.create).toHaveBeenCalled();
  });

  it('rejects when the rolling creation quota is exhausted', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(queryChain(paidOriginal));
    vi.mocked(entitlementService.getEntitlementView as never).mockResolvedValue(paidView);
    vi.mocked(courseQuotaService.getWindowUsage as never).mockResolvedValue(2);

    await expect(service.duplicate('c1', 'i1')).rejects.toThrow('You have reached the limit of 2 course creations');
    expect(Course.create).not.toHaveBeenCalled();
  });

  it('still enforces paid-course permission for paid originals', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(queryChain(paidOriginal));
    vi.mocked(entitlementService.getEntitlementView as never).mockResolvedValue({
      entitlements: {
        courses: { canCreateFree: true, canCreatePaid: false },
      },
    });

    await expect(service.duplicate('c1', 'i1')).rejects.toThrow('Paid course creation');
    expect(courseQuotaService.withQuotaLock).not.toHaveBeenCalled();
  });

  it('throws when the original course is missing', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(queryChain(null));
    await expect(service.duplicate('c1', 'i1')).rejects.toThrow('Course not found');
  });
});
