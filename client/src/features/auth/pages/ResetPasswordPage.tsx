import { ResetPasswordForm } from '../components/ResetPasswordForm';
import { AuthLayout } from '../components/AuthLayout';
import { PageTransition } from '@/components/common/PageTransition';
import { SEO } from '@/components/seo/SEO';

export function ResetPasswordPage() {
  return (
    <PageTransition>
      <SEO title="Reset Password" description="Set a new password for your NextEra account." robots="noindex,nofollow" />
      <AuthLayout>
        <ResetPasswordForm />
      </AuthLayout>
    </PageTransition>
  );
}
