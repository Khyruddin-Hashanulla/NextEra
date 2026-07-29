import { VerifyEmailForm } from '../components/VerifyEmailForm';
import { AuthLayout } from '../components/AuthLayout';
import { PageTransition } from '@/components/common/PageTransition';

export function VerifyEmailPage() {
  return (
    <PageTransition>
      <AuthLayout>
        <VerifyEmailForm />
      </AuthLayout>
    </PageTransition>
  );
}
