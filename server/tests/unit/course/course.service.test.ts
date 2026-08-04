import { ApiError } from '../../../src/utils/ApiError';
import { CourseService } from '../../../src/services/course.service';
import { Course } from '../../../src/models/course.model';
import { Section } from '../../../src/models/section.model';
import { Lecture } from '../../../src/models/lecture.model';
import { User } from '../../../src/models/user.model';
import { Enrollment } from '../../../src/models/enrollment.model';
import { subscriptionPermissionService } from '../../../src/services/subscriptionPermission.service';
import { cacheManager } from '../../../src/cache/cacheManager';
import { cascadeDeleteService } from '../../../src/services/cascadeDelete.service';
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
    remember: vi.fn(async (_key: unknown, _opts: unknown, factory: () => Promise<unknown>) =>
      factory(),
    ),
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

vi.mock('../../../src/services/cascadeDelete.service', () => ({
  cascadeDeleteService: { deleteCourse: vi.fn(), deleteSection: vi.fn(), deleteLecture: vi.fn() },
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
    vi.mocked(subscriptionPermissionService.getInstructorPlanInfo).mockResolvedValue({ status: 'active' } as never);
    vi.mocked(subscriptionPermissionService.requirePaidCoursePermission).mockRejectedValue(
      ApiError.forbidden('Upgrade to Pro'),
    );
    await expect(service.create('i1', { price: 500, title: 'Paid Course' })).rejects.toThrow(
      'Upgrade to Pro',
    );
    expect(Course.create).not.toHaveBeenCalled();
  });

  it('creates a free course without the paid permission', async () => {
    vi.mocked(Course.create as never).mockResolvedValue([draftDoc()]);
    const result = await service.create('i1', { price: 0, title: 'Free Course' });
    expect(subscriptionPermissionService.requirePaidCoursePermission).not.toHaveBeenCalled();
    expect(Course.create).toHaveBeenCalledWith(
      [{ price: 0, title: 'Free Course', instructor: 'i1' }],
      expect.any(Object),
    );
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith('i1', { $inc: { totalCourses: 1 } }, expect.any(Object));
    expect(cacheManager.invalidateCourseCache).toHaveBeenCalled();
    expect(result.title).toBe('Introduction to React');
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
      queryChain(buildCourseDoc({ price: 0, courseType: 'free', instructor: { toString: () => 'i1' } })),
    );
    vi.mocked(subscriptionPermissionService.requirePaidCoursePermission).mockRejectedValue(
      ApiError.forbidden('Upgrade to Pro'),
    );

    await expect(service.update('c1', { price: 999 })).rejects.toThrow('Upgrade to Pro');
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
      'Only draft or rejected courses can be submitted for review',
    );
  });

  it('submitForReview requires at least one section', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(queryChain(draftDoc()));
    vi.mocked(Section.countDocuments as never).mockResolvedValue(0);
    await expect(service.submitForReview('c1')).rejects.toThrow(
      'Course must have at least one section',
    );
  });

  it('submitForReview requires a lecture and a video lecture', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(queryChain(draftDoc()));
    vi.mocked(Section.countDocuments as never).mockResolvedValue(1);
    vi.mocked(Lecture.countDocuments as never).mockResolvedValue(0);
    await expect(service.submitForReview('c1')).rejects.toThrow(
      'Course must have at least one lecture',
    );
  });

  it('submitForReview requires a video lecture', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(queryChain(draftDoc()));
    vi.mocked(Section.countDocuments as never).mockResolvedValue(1);
    vi.mocked(Lecture.countDocuments as never).mockResolvedValue(1);
    vi.mocked(Lecture.countDocuments as never)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0);
    await expect(service.submitForReview('c1')).rejects.toThrow(
      'Course must have at least one video lecture',
    );
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
    await expect(service.approve('c1')).rejects.toThrow(
      'Course must be in review status to approve',
    );
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
    await expect(service.publish('c1')).rejects.toThrow(
      'Course must be approved before publishing',
    );
  });

  it('publish requires sections and lectures', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(
      queryChain(buildCourseDoc({ status: 'approved', courseType: 'free', price: 0 })),
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
    await expect(service.archive('c1')).rejects.toThrow(
      'Only published or approved courses can be archived',
    );
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
      queryChain({ _id: 'l1', isFree: false, section: 's1', order: 1 }),
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
    vi.mocked(Section.findById as never).mockReturnValue(
      queryChain({ _id: 's1', title: 'Intro' }),
    );

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
      expect.objectContaining({ title: expect.objectContaining({ $regex: 'react' }) }),
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

describe('createSection', () => {
  afterEach(() => vi.clearAllMocks());

  it('assigns the next order based on the last section', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(queryChain(buildCourseDoc()));
    vi.mocked(Section.findOne as never).mockReturnValue(queryChain({ order: 4 }));
    vi.mocked(Section.create as never).mockResolvedValue([{ _id: 'sec1', order: 5 }]);

    const result = await service.createSection('c1', { title: 'New Section' });

    expect(Section.create).toHaveBeenCalledWith(
      [{ course: 'c1', title: 'New Section', order: 5 }],
      expect.any(Object),
    );
    expect(Course.findByIdAndUpdate).toHaveBeenCalledWith(
      'c1',
      { $inc: { totalSections: 1 }, lastActivity: expect.any(Date) },
      expect.any(Object),
    );
    expect(result).toEqual({ _id: 'sec1', order: 5 });
  });

  it('throws when the course is missing', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(queryChain(null));
    await expect(service.createSection('c1', { title: 'New Section' })).rejects.toThrow(
      'Course not found',
    );
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
      expect.any(Object),
    );
    expect(result).toEqual({ deleted: true });
  });

  it('throws when the course is missing', async () => {
    vi.mocked(Course.findByIdAndDelete as never).mockResolvedValue(null);
    await expect(service.delete('c1')).rejects.toThrow('Course not found');
  });
});
