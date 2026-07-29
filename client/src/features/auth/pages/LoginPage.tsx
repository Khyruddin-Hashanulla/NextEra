import { LoginForm } from '../components/LoginForm';
import { AuthLayout } from '../components/AuthLayout';
import { PageTransition } from '@/components/common/PageTransition';

export function LoginPage() {
  return (
    <PageTransition>
      <AuthLayout>
        <LoginForm />
      </AuthLayout>
    </PageTransition>
  );
}
