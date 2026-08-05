import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SEO } from '@/components/seo/SEO';
import { StructuredData } from '@/components/seo/StructuredData';
import { SEO_DEFAULTS } from '@/lib/seo';
import { organizationSchema, websiteSchema } from '@/lib/schema';
import { PageContainer } from '@/components/layout/PageContainer';

const defaultSEO = {
  title: SEO_DEFAULTS.DEFAULT_TITLE,
  description: SEO_DEFAULTS.DEFAULT_DESCRIPTION,
  image: SEO_DEFAULTS.DEFAULT_IMAGE,
};

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <SEO {...defaultSEO} />
      <StructuredData schemas={[organizationSchema(), websiteSchema()]} />
      <Navbar />
      <main className="flex-1">
        <PageContainer variant="subtle">
          <Outlet />
        </PageContainer>
      </main>
      <Footer />
    </div>
  );
}
