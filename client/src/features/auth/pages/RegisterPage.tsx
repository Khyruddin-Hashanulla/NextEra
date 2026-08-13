import { RegisterForm } from '../components/RegisterForm';
import { AuthLayout } from '../components/AuthLayout';
import { PageTransition } from '@/components/common/PageTransition';
import { SEO } from '@/components/seo/SEO';

export function RegisterPage() {
  return (
    <PageTransition>
      <SEO
        title="Create Account"
        description="Create your NextEra account and start learning web development and programming."
        robots="noindex,nofollow"
      />
      <AuthLayout>
        <RegisterForm />
      </AuthLayout>
    </PageTransition>
  );
}
