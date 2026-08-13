import { describe, expect, it } from 'vitest';
import {
  organizationSchema,
  websiteSchema,
  webPageSchema,
  breadcrumbListSchema,
  courseSchema,
  articleSchema,
  personSchema,
  faqPageSchema,
} from '@/lib/schema';

describe('schema builders', () => {
  it('builds an organization schema', () => {
    const schema = organizationSchema();
    expect(schema['@type']).toBe('Organization');
    expect(schema.name).toBe('NextEra');
    expect(schema.sameAs).toHaveLength(4);
  });

  it('builds a website schema with search action', () => {
    const schema = websiteSchema();
    expect(schema['@type']).toBe('WebSite');
    expect(((schema.potentialAction as any).target as any).urlTemplate).toContain('/courses?q=');
  });

  it('builds a webpage schema using the canonical url', () => {
    const schema = webPageSchema({ name: 'About', path: '/about' });
    expect(schema['@type']).toBe('WebPage');
    expect(schema.url).toContain('/about');
  });

  it('builds breadcrumb items with positions', () => {
    const schema = breadcrumbListSchema([
      { name: 'Home', path: '/' },
      { name: 'Courses', path: '/courses' },
    ]);
    const items = schema.itemListElement as Array<Record<string, unknown>>;
    expect(items).toHaveLength(2);
    expect(items[0].position).toBe(1);
    expect(items[0].name).toBe('Home');
  });

  it('keeps absolute breadcrumb paths unchanged', () => {
    const schema = breadcrumbListSchema([{ name: 'External', path: 'https://example.com/x' }]);
    expect((schema.itemListElement as Array<Record<string, unknown>>)[0].item).toBe('https://example.com/x');
  });
});

describe('courseSchema', () => {
  const base = {
    title: 'React Course',
    description: 'Learn React',
    slug: 'react-course',
  };

  it('builds the core course schema', () => {
    const schema = courseSchema(base);
    expect(schema['@type']).toBe('Course');
    expect(schema.name).toBe('React Course');
    expect(schema.url).toContain('/courses/react-course');
  });

  it('adds optional fields when present', () => {
    const schema = courseSchema({
      ...base,
      thumbnail: { url: 'https://img.example/x.jpg' },
      instructor: { name: 'Jane' },
      category: { name: 'Frontend' },
      level: 'intermediate',
      language: 'English',
      price: 499,
      averageRating: 4.5,
      totalReviews: 12,
      whatYouWillLearn: ['Hooks'],
      prerequisites: 'JS basics',
    });
    expect(schema.image).toBe('https://img.example/x.jpg');
    expect((schema.instructor as any).name).toBe('Jane');
    expect(schema.courseCode).toBe('Frontend');
    expect(schema.educationalLevel).toBe('intermediate');
    expect(schema.inLanguage).toBe('English');
    expect((schema.offers as any).price).toBe('499');
    expect((schema.aggregateRating as any).ratingValue).toBe('4.5');
    expect(schema.teaches).toEqual(['Hooks']);
    expect(schema.coursePrerequisites).toBe('JS basics');
  });

  it('handles string categories and free pricing', () => {
    const schema = courseSchema({ ...base, category: 'Programming', price: 0 });
    expect(schema.courseCode).toBe('Programming');
    expect((schema.offers as any).category).toBe('Free');
  });

  it('omits aggregate rating when averageRating is absent', () => {
    const schema = courseSchema({ ...base, averageRating: 0 });
    expect(schema.aggregateRating).toBeUndefined();
  });
});

describe('articleSchema', () => {
  it('builds an article schema', () => {
    const schema = articleSchema({
      title: 'My Post',
      slug: 'my-post',
      excerpt: 'excerpt',
      author: { name: 'Jane' },
      tags: ['react'],
      publishedAt: '2026-01-01',
      updatedAt: '2026-02-01',
      featuredImage: { url: 'https://img.example/post.jpg' },
    });
    expect(schema['@type']).toBe('Article');
    expect(schema.headline).toBe('My Post');
    expect(schema.url).toContain('/blog/my-post');
    expect(schema.image).toBe('https://img.example/post.jpg');
    expect(schema.datePublished).toBe('2026-01-01');
    expect(schema.dateModified).toBe('2026-02-01');
    expect((schema.author as any).name).toBe('Jane');
    expect(schema.keywords).toBe('react');
  });

  it('falls back to publishedAt as dateModified', () => {
    const schema = articleSchema({ title: 't', slug: 's', publishedAt: '2026-01-01' });
    expect(schema.dateModified).toBe('2026-01-01');
  });

  it('supports seo canonical overrides', () => {
    const schema = articleSchema({ title: 't', slug: 's', seo: { canonicalUrl: '/custom' } });
    expect(schema.url).toContain('/custom');
  });
});

describe('personSchema', () => {
  it('builds a person schema with optional fields', () => {
    const schema = personSchema({
      name: 'Jane',
      image: 'https://img.example/j.jpg',
      bio: 'bio',
      jobTitle: 'Engineer',
      url: 'https://example.com/j',
      sameAs: ['https://twitter.com/jane', ''],
    });
    expect(schema['@type']).toBe('Person');
    expect(schema.image).toBe('https://img.example/j.jpg');
    expect(schema.description).toBe('bio');
    expect(schema.jobTitle).toBe('Engineer');
    expect(schema.url).toBe('https://example.com/j');
    expect(schema.sameAs as string[]).toEqual(['https://twitter.com/jane']);
  });

  it('builds a minimal person schema', () => {
    expect(personSchema({ name: 'Jane' })).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Jane',
    });
  });
});

describe('faqPageSchema', () => {
  it('maps questions to accepted answers', () => {
    const schema = faqPageSchema([{ question: 'Q?', answer: 'A.' }]);
    expect(schema['@type']).toBe('FAQPage');
    const mainEntity = schema.mainEntity as Array<Record<string, unknown>>;
    expect((mainEntity[0].acceptedAnswer as Record<string, unknown>).text).toBe('A.');
  });
});
