import { SEO_DEFAULTS, buildCanonical } from './seo';

const SITE_URL = SEO_DEFAULTS.SITE_URL.replace(/\/+$/, '');
const LOGO_URL = `${SITE_URL}/favicon.svg`;

interface BreadcrumbItem {
  name: string;
  path: string;
}

export function organizationSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SEO_DEFAULTS.SITE_NAME,
    url: SITE_URL,
    logo: LOGO_URL,
    description: SEO_DEFAULTS.DEFAULT_DESCRIPTION,
    email: 'contact@nextera.com',
    sameAs: [
      'https://facebook.com/nextera',
      'https://twitter.com/nextera',
      'https://linkedin.com/company/nextera',
      'https://youtube.com/@nextera',
    ],
  };
}

export function websiteSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SEO_DEFAULTS.SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/courses?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function webPageSchema(params: {
  name: string;
  description?: string;
  path: string;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: params.name,
    description: params.description || SEO_DEFAULTS.DEFAULT_DESCRIPTION,
    url: buildCanonical(params.path),
  };
}

export function breadcrumbListSchema(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.path.startsWith('http') ? item.path : buildCanonical(item.path),
    })),
  };
}

export function courseSchema(course: {
  title: string;
  description: string;
  slug: string;
  thumbnail?: { url: string };
  instructor?: { _id?: string; name: string };
  category?: { _id?: string; name?: string } | string | null;
  level?: string;
  price?: number;
  averageRating?: number;
  totalReviews?: number;
  language?: string;
  whatYouWillLearn?: string[];
  prerequisites?: string;
  updatedAt?: string;
}): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description,
    url: buildCanonical(`/courses/${course.slug}`),
    provider: {
      '@type': 'Organization',
      name: SEO_DEFAULTS.SITE_NAME,
      sameAs: SITE_URL,
    },
  };

  if (course.thumbnail?.url) {
    schema.image = course.thumbnail.url;
  }

  if (course.instructor?.name) {
    schema.instructor = {
      '@type': 'Person',
      name: course.instructor.name,
    };
  }

  if (course.category) {
    schema.courseCode = typeof course.category === 'object'
      ? course.category.name
      : course.category;
  }

  if (course.level) {
    schema.educationalLevel = course.level;
  }

  if (course.language) {
    schema.inLanguage = course.language;
  }

  if (typeof course.price === 'number') {
    schema.offers = {
      '@type': 'Offer',
      category: course.price === 0 ? 'Free' : 'Paid',
      price: course.price.toString(),
      priceCurrency: 'USD',
    };
  }

  if (course.averageRating && course.averageRating > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: course.averageRating.toFixed(1),
      reviewCount: course.totalReviews || 0,
      bestRating: '5',
    };
  }

  if (course.whatYouWillLearn?.length) {
    schema.teaches = course.whatYouWillLearn;
  }

  if (course.prerequisites) {
    schema.coursePrerequisites = course.prerequisites;
  }

  return schema;
}

export function articleSchema(blog: {
  title: string;
  slug: string;
  excerpt?: string;
  featuredImage?: { url: string };
  author?: { _id?: string; name: string; avatar?: { url: string } };
  tags?: string[];
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  seo?: { metaTitle?: string; metaDescription?: string; canonicalUrl?: string; ogImage?: string };
}): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: blog.title,
    description: blog.seo?.metaDescription || blog.excerpt || '',
    url: buildCanonical(blog.seo?.canonicalUrl || `/blog/${blog.slug}`),
    publisher: {
      '@type': 'Organization',
      name: SEO_DEFAULTS.SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: LOGO_URL,
      },
    },
  };

  const imageUrl = blog.seo?.ogImage || blog.featuredImage?.url;
  if (imageUrl) {
    schema.image = imageUrl;
  }

  if (blog.publishedAt) {
    schema.datePublished = blog.publishedAt;
  }

  if (blog.updatedAt) {
    schema.dateModified = blog.updatedAt;
  } else if (blog.publishedAt) {
    schema.dateModified = blog.publishedAt;
  }

  if (blog.author?.name) {
    schema.author = {
      '@type': 'Person',
      name: blog.author.name,
    };
  }

  if (blog.tags?.length) {
    schema.keywords = blog.tags.join(', ');
  }

  return schema;
}

export function personSchema(person: {
  name: string;
  image?: string;
  bio?: string;
  jobTitle?: string;
  url?: string;
  sameAs?: string[];
}): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
  };

  if (person.image) {
    schema.image = person.image;
  }

  if (person.bio) {
    schema.description = person.bio;
  }

  if (person.jobTitle) {
    schema.jobTitle = person.jobTitle;
  }

  if (person.url) {
    schema.url = person.url;
  }

  const sameAs = person.sameAs?.filter(Boolean);
  if (sameAs?.length) {
    schema.sameAs = sameAs;
  }

  return schema;
}

interface FAQItem {
  question: string;
  answer: string;
}

export function faqPageSchema(faqs: FAQItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
