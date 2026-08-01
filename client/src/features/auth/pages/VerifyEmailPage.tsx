import { VerifyEmailForm } from '../components/VerifyEmailForm';
import { AuthLayout } from '../components/AuthLayout';
import { PageTransition } from '@/components/common/PageTransition';
import { SEO } from '@/components/seo/SEO';

export function VerifyEmailPage() {
  return (
    <PageTransition>
      <SEO title="Verify Email" description="Verify your email address to activate your NextEra account." robots="noindex,nofollow" />
      <AuthLayout>
        <VerifyEmailForm />
      </AuthLayout>
    </PageTransition>
  );
}
