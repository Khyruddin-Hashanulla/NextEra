import {
  createCourseSchema,
  updateCourseSchema,
  createSectionSchema,
  updateSectionSchema,
  createLectureSchema,
  updateLectureSchema,
  reorderSectionsSchema,
  reorderLecturesSchema,
} from '../../../src/validators/course.validator';

describe('createCourseSchema', () => {
  it('accepts a valid minimal course', () => {
    const out = createCourseSchema.parse({ title: 'Learn Node.js' });
    expect(out.title).toBe('Learn Node.js');
  });

  it('rejects a title shorter than 5 characters', () => {
    expect(() => createCourseSchema.parse({ title: 'Node' })).toThrow(
      /Title must be at least 5 characters/,
    );
  });

  it('rejects a negative price', () => {
    expect(() => createCourseSchema.parse({ title: 'Valid Title', price: -1 })).toThrow();
  });

  it('rejects unknown level values', () => {
    expect(() => createCourseSchema.parse({ title: 'Valid Title', level: 'expert' })).toThrow();
  });

  it('accepts known level values', () => {
    for (const level of ['beginner', 'intermediate', 'advanced', 'all']) {
      expect(createCourseSchema.parse({ title: 'Valid Title', level }).level).toBe(level);
    }
  });

  it('rejects unknown courseType values', () => {
    expect(() => createCourseSchema.parse({ title: 'Valid Title', courseType: 'monthly' })).toThrow();
  });

  it('rejects more than 20 tags', () => {
    const tags = Array.from({ length: 21 }, (_, i) => `tag${i}`);
    expect(() => createCourseSchema.parse({ title: 'Valid Title', tags })).toThrow();
  });

  it('rejects discount percent outside 0-100', () => {
    expect(() =>
      createCourseSchema.parse({ title: 'Valid Title', pricing: { discountPercent: 101 } }),
    ).toThrow();
    expect(() =>
      createCourseSchema.parse({ title: 'Valid Title', pricing: { discountPercent: -1 } }),
    ).toThrow();
  });

  it('rejects quiz scores outside 0-100', () => {
    expect(() =>
      createCourseSchema.parse({
        title: 'Valid Title',
        certificateSettings: { minimumQuizScore: 101 },
      }),
    ).toThrow();
  });
});

describe('updateCourseSchema', () => {
  it('allows partial updates with a valid thumbnail', () => {
    const out = updateCourseSchema.parse({
      title: 'Renamed',
      thumbnail: { url: 'https://x.com/a.png', publicId: 'a' },
    });
    expect(out.title).toBe('Renamed');
    expect(out.thumbnail).toEqual({ url: 'https://x.com/a.png', publicId: 'a' });
  });

  it('rejects an invalid thumbnail shape', () => {
    expect(() => updateCourseSchema.parse({ thumbnail: { url: 'https://x.com/a.png' } })).toThrow();
  });
});

describe('createSectionSchema', () => {
  it('accepts a valid section title', () => {
    expect(createSectionSchema.parse({ title: 'Intro' }).title).toBe('Intro');
  });

  it('rejects a one-character title', () => {
    expect(() => createSectionSchema.parse({ title: 'A' })).toThrow(
      /Section title must be at least 2 characters/,
    );
  });
});

describe('updateSectionSchema', () => {
  it('accepts a valid order and title', () => {
    const out = updateSectionSchema.parse({ title: 'Updated', order: 3 });
    expect(out.order).toBe(3);
  });

  it('rejects a negative order', () => {
    expect(() => updateSectionSchema.parse({ order: -1 })).toThrow();
  });
});

describe('createLectureSchema', () => {
  it('requires a lecture type', () => {
    expect(() => createLectureSchema.parse({ title: 'Lecture 1' })).toThrow();
    expect(createLectureSchema.parse({ title: 'Lecture 1', type: 'video' }).type).toBe('video');
  });

  it('rejects an invalid lecture type', () => {
    expect(() => createLectureSchema.parse({ title: 'Lecture 1', type: 'slides' })).toThrow();
  });

  it('rejects oversized attachments', () => {
    expect(() =>
      createLectureSchema.parse({
        title: 'Lecture 1',
        type: 'video',
        attachments: [{ url: 'x', publicId: 'y', name: 'n', type: 't', size: 201 * 1024 * 1024 }],
      }),
    ).toThrow();
  });

  it('accepts attachments exactly at the 200MB limit', () => {
    const out = createLectureSchema.parse({
      title: 'Lecture 1',
      type: 'video',
      attachments: [{ url: 'x', publicId: 'y', name: 'n', type: 't', size: 200 * 1024 * 1024 }],
    });
    expect(out.attachments![0].size).toBe(200 * 1024 * 1024);
  });

  it('rejects negative quiz time limits', () => {
    expect(() =>
      createLectureSchema.parse({ title: 'Lecture 1', type: 'quiz', quiz: { timeLimit: -1 } }),
    ).toThrow();
  });
});

describe('updateLectureSchema', () => {
  it('allows partial updates', () => {
    expect(updateLectureSchema.parse({ title: 'Renamed' }).title).toBe('Renamed');
    expect(updateLectureSchema.parse({}).title).toBeUndefined();
  });
});

describe('reorderSectionsSchema / reorderLecturesSchema', () => {
  it('accepts valid reorder payloads', () => {
    expect(
      reorderSectionsSchema.parse({ sectionOrder: [{ sectionId: 'a', order: 0 }] }).sectionOrder,
    ).toHaveLength(1);
    expect(
      reorderLecturesSchema.parse({ lectureOrder: [{ lectureId: 'b', order: 2 }] }).lectureOrder,
    ).toHaveLength(1);
  });

  it('rejects more than 100 section entries', () => {
    const sectionOrder = Array.from({ length: 101 }, (_, i) => ({ sectionId: String(i), order: i }));
    expect(() => reorderSectionsSchema.parse({ sectionOrder })).toThrow();
  });

  it('rejects negative order values', () => {
    expect(() => reorderSectionsSchema.parse({ sectionOrder: [{ sectionId: 'a', order: -1 }] })).toThrow();
  });
});
