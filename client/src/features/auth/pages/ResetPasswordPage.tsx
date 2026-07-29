import { ResetPasswordForm } from '../components/ResetPasswordForm';
import { AuthLayout } from '../components/AuthLayout';
import { PageTransition } from '@/components/common/PageTransition';

export function ResetPasswordPage() {
  return (
    <PageTransition>
      <AuthLayout>
        <ResetPasswordForm />
      </AuthLayout>
    </PageTransition>
  );
}
