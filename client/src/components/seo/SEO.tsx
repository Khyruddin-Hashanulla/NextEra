import { Helmet } from 'react-helmet-async';
import { SEO_DEFAULTS, buildCanonical, formatPageTitle } from '@/lib/seo';

interface SEOProps {
  title: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  canonical?: string;
  robots?: string;
  publishedTime?: string;
  author?: string;
}

export function SEO({
  title,
  description = SEO_DEFAULTS.DEFAULT_DESCRIPTION,
  keywords,
  image = SEO_DEFAULTS.DEFAULT_IMAGE,
  url,
  type = 'website',
  canonical,
  robots = 'index,follow',
  publishedTime,
  author,
}: SEOProps) {
  const pageTitle = formatPageTitle(title);
  const pageUrl = url
    ? (url.startsWith('http') ? url : buildCanonical(url))
    : buildCanonical(canonical || '/');
  const pageCanonical = canonical
    ? (canonical.startsWith('http') ? canonical : buildCanonical(canonical))
    : pageUrl;
  const pageImage = image.startsWith('http')
    ? image
    : `${SEO_DEFAULTS.SITE_URL.replace(/\/+$/, '')}${image}`;

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={robots} />
      <link rel="canonical" href={pageCanonical} />

      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={pageImage} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SEO_DEFAULTS.SITE_NAME} />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {author && <meta property="article:author" content={author} />}

      <meta name="twitter:card" content={image === SEO_DEFAULTS.DEFAULT_IMAGE ? 'summary' : 'summary_large_image'} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={pageImage} />
      <meta name="twitter:site" content={SEO_DEFAULTS.TWITTER_HANDLE} />
    </Helmet>
  );
}
