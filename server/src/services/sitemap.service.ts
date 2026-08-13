import { Request, Response } from 'express';
import { Course } from '../models/course.model';
import { Blog } from '../models/blog.model';
import { User } from '../models/user.model';
import { Category } from '../models/category.model';
import { env } from '../config/env';
import { logger } from '../utils/logger';

interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}

interface CacheEntry {
  xml: string;
  timestamp: number;
}

const urlCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_URLS = 50000;

function baseUrl(): string {
  return env.clientUrl.replace(/\/+$/, '');
}

function serverBaseUrl(): string {
  return (env.serverUrl || env.clientUrl).replace(/\/+$/, '');
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function fmtDate(d: Date | string | undefined | null): string {
  if (!d) return new Date().toISOString().split('T')[0];
  const date = typeof d === 'string' ? new Date(d) : d;
  try {
    return date.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

function urlXml(e: SitemapEntry): string {
  return `<url>
    <loc>${escapeXml(e.loc)}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`;
}

function sitemapXml(entries: SitemapEntry[]): string {
  const urls = entries.map(urlXml).join('\n  ');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls}
</urlset>`;
}

function sitemapIndexXml(sitemaps: { loc: string; lastmod: string }[]): string {
  const items = sitemaps
    .map(
      (s) => `<sitemap>
    <loc>${escapeXml(s.loc)}</loc>
    <lastmod>${s.lastmod}</lastmod>
  </sitemap>`
    )
    .join('\n  ');
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${items}
</sitemapindex>`;
}

function getCached(key: string): string | null {
  const entry = urlCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    urlCache.delete(key);
    return null;
  }
  return entry.xml;
}

function setCache(key: string, xml: string): void {
  urlCache.set(key, { xml, timestamp: Date.now() });
  if (urlCache.size > 20) {
    const oldest = urlCache.keys().next().value;
    if (oldest) urlCache.delete(oldest);
  }
}

function buildStaticPages(): SitemapEntry[] {
  const now = fmtDate(new Date());
  const b = baseUrl();
  return [
    { loc: `${b}/`, lastmod: now, changefreq: 'weekly', priority: '1.0' },
    { loc: `${b}/courses`, lastmod: now, changefreq: 'daily', priority: '0.9' },
    { loc: `${b}/blog`, lastmod: now, changefreq: 'daily', priority: '0.7' },
    { loc: `${b}/instructors`, lastmod: now, changefreq: 'weekly', priority: '0.7' },
    { loc: `${b}/about`, lastmod: now, changefreq: 'monthly', priority: '0.6' },
    { loc: `${b}/contact`, lastmod: now, changefreq: 'monthly', priority: '0.6' },
    { loc: `${b}/faq`, lastmod: now, changefreq: 'monthly', priority: '0.6' },
    { loc: `${b}/privacy`, lastmod: now, changefreq: 'monthly', priority: '0.6' },
    { loc: `${b}/terms`, lastmod: now, changefreq: 'monthly', priority: '0.6' },
  ];
}

async function buildCoursePages(): Promise<SitemapEntry[]> {
  const courses = await Course.find({ status: 'published' }).select('slug updatedAt publishedAt').lean();
  const b = baseUrl();
  return courses.map((c) => ({
    loc: `${b}/courses/${c.slug}`,
    lastmod: fmtDate(c.updatedAt || c.publishedAt),
    changefreq: 'weekly',
    priority: '0.8',
  }));
}

async function buildBlogPages(): Promise<SitemapEntry[]> {
  const blogs = await Blog.find({ status: 'published' }).select('slug updatedAt publishedAt').lean();
  const b = baseUrl();
  return blogs.map((blog) => ({
    loc: `${b}/blog/${blog.slug}`,
    lastmod: fmtDate(blog.updatedAt || blog.publishedAt),
    changefreq: 'monthly',
    priority: '0.7',
  }));
}

async function buildInstructorPages(): Promise<SitemapEntry[]> {
  const instructors = await User.find({
    role: 'instructor',
    isActive: true,
    isDeleted: false,
  })
    .select('_id updatedAt')
    .lean();
  const b = baseUrl();
  return instructors.map((u) => ({
    loc: `${b}/instructors/${u._id}`,
    lastmod: fmtDate(u.updatedAt),
    changefreq: 'monthly',
    priority: '0.6',
  }));
}

async function buildCategoryPages(): Promise<SitemapEntry[]> {
  const categories = await Category.find({ isActive: true }).select('slug updatedAt').lean();
  const b = baseUrl();
  return categories.map((c) => ({
    loc: `${b}/categories/${c.slug}`,
    lastmod: fmtDate(c.updatedAt),
    changefreq: 'weekly',
    priority: '0.6',
  }));
}

async function countTotalUrls(): Promise<number> {
  const [courseCount, blogCount, instructorCount, categoryCount] = await Promise.all([
    Course.countDocuments({ status: 'published' }),
    Blog.countDocuments({ status: 'published' }),
    User.countDocuments({ role: 'instructor', isActive: true, isDeleted: false }),
    Category.countDocuments({ isActive: true }),
  ]);
  return buildStaticPages().length + courseCount + blogCount + instructorCount + categoryCount;
}

export async function getSitemapXml(): Promise<string> {
  const cached = getCached('sitemap-index');
  if (cached) return cached;

  const total = await countTotalUrls();

  if (total <= MAX_URLS) {
    const xml = await generateSingleSitemap();
    setCache('sitemap-index', xml);
    return xml;
  }

  const now = fmtDate(new Date());
  const sb = serverBaseUrl();
  const types = ['static', 'courses', 'blogs', 'instructors', 'categories'];
  const sitemaps = types.map((t) => ({
    loc: `${sb}/sitemaps/${t}.xml`,
    lastmod: now,
  }));
  const xml = sitemapIndexXml(sitemaps);
  setCache('sitemap-index', xml);
  return xml;
}

async function generateSingleSitemap(): Promise<string> {
  const [staticPages, coursePages, blogPages, instructorPages, categoryPages] = await Promise.all([
    buildStaticPages(),
    buildCoursePages(),
    buildBlogPages(),
    buildInstructorPages(),
    buildCategoryPages(),
  ]);
  const all = [...staticPages, ...coursePages, ...blogPages, ...instructorPages, ...categoryPages];
  if (all.length > MAX_URLS) {
    logger.warn(`Sitemap exceeds ${MAX_URLS} URLs (${all.length}). Consider using sitemap index.`);
  }
  return sitemapXml(all);
}

export async function getTypeSitemapXml(type: string): Promise<string | null> {
  const cached = getCached(`sitemap-${type}`);
  if (cached) return cached;

  let entries: SitemapEntry[];
  switch (type) {
    case 'static':
      entries = buildStaticPages();
      break;
    case 'courses':
      entries = await buildCoursePages();
      break;
    case 'blogs':
      entries = await buildBlogPages();
      break;
    case 'instructors':
      entries = await buildInstructorPages();
      break;
    case 'categories':
      entries = await buildCategoryPages();
      break;
    default:
      return null;
  }

  const xml = sitemapXml(entries);
  setCache(`sitemap-${type}`, xml);
  return xml;
}

export function clearSitemapCache(): void {
  urlCache.clear();
  logger.info('Sitemap cache cleared');
}

export async function handleSitemap(_req: Request, res: Response): Promise<void> {
  try {
    const xml = await getSitemapXml();
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(xml);
  } catch (error) {
    logger.error('Failed to generate sitemap:', error);
    res.status(500).setHeader('Content-Type', 'application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`);
  }
}

export async function handleSitemapType(req: Request, res: Response): Promise<void> {
  try {
    const type = req.params.type;
    const xml = await getTypeSitemapXml(type);
    if (!xml) {
      res.status(404).setHeader('Content-Type', 'application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`);
      return;
    }
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(xml);
  } catch (error) {
    logger.error('Failed to generate sitemap type:', error);
    res.status(500).setHeader('Content-Type', 'application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`);
  }
}
