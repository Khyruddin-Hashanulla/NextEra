import { LoginForm } from '../components/LoginForm';
import { AuthLayout } from '../components/AuthLayout';
import { PageTransition } from '@/components/common/PageTransition';
import { SEO } from '@/components/seo/SEO';

export function LoginPage() {
  return (
    <PageTransition>
      <SEO title="Sign In" description="Sign in to your NextEra account to access your courses and learning materials." robots="noindex,nofollow" />
      <AuthLayout>
        <LoginForm />
      </AuthLayout>
    </PageTransition>
  );
}
