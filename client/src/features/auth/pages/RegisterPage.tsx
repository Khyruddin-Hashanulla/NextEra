import { RegisterForm } from '../components/RegisterForm';
import { AuthLayout } from '../components/AuthLayout';
import { PageTransition } from '@/components/common/PageTransition';

export function RegisterPage() {
  return (
    <PageTransition>
      <AuthLayout>
        <RegisterForm />
      </AuthLayout>
    </PageTransition>
  );
}
