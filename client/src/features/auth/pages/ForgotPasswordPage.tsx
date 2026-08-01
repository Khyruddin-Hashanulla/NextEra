import { ForgotPasswordForm } from '../components/ForgotPasswordForm';
import { AuthLayout } from '../components/AuthLayout';
import { PageTransition } from '@/components/common/PageTransition';
import { SEO } from '@/components/seo/SEO';

export function ForgotPasswordPage() {
  return (
    <PageTransition>
      <SEO title="Forgot Password" description="Reset your NextEra account password." robots="noindex,nofollow" />
      <AuthLayout>
        <ForgotPasswordForm />
      </AuthLayout>
    </PageTransition>
  );
}
