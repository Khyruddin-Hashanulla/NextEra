import { ForgotPasswordForm } from '../components/ForgotPasswordForm';
import { AuthLayout } from '../components/AuthLayout';
import { PageTransition } from '@/components/common/PageTransition';

export function ForgotPasswordPage() {
  return (
    <PageTransition>
      <AuthLayout>
        <ForgotPasswordForm />
      </AuthLayout>
    </PageTransition>
  );
}
