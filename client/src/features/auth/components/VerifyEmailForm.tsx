import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { verifyEmailSchema, VerifyEmailFormData } from '@/lib/validators/authSchema';
import { useVerifyEmailMutation, useSendOTPMutation } from '../hooks/useAuthMutations';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';

export function VerifyEmailForm() {
  const { user } = useAuth();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const verifyEmailMutation = useVerifyEmailMutation();
  const sendOTPMutation = useSendOTPMutation();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VerifyEmailFormData>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      email: user?.email || '',
    },
  });

  const email = watch('email');

  const handleSendOTP = async () => {
    if (email) {
      await sendOTPMutation.mutateAsync(email).then(() => setStep('otp'));
    }
  };

  const onSubmit = async (data: VerifyEmailFormData) => {
    await verifyEmailMutation.mutateAsync(data);
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Verify your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {step === 'email'
            ? 'Enter your email to receive a verification code'
            : `Enter the 6-digit code sent to ${email}`}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            disabled={step === 'otp'}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        {step === 'otp' && (
          <div className="space-y-2">
            <Label htmlFor="otp">Verification Code</Label>
            <Input
              id="otp"
              type="text"
              placeholder="000000"
              maxLength={6}
              className="text-center text-lg tracking-widest"
              {...register('otp')}
            />
            {errors.otp && (
              <p className="text-sm text-destructive">{errors.otp.message}</p>
            )}
          </div>
        )}

        {step === 'email' ? (
          <Button type="button" className="w-full" onClick={handleSendOTP} disabled={sendOTPMutation.isPending}>
            {sendOTPMutation.isPending ? 'Sending...' : 'Send OTP'}
          </Button>
        ) : (
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Verifying...' : 'Verify email'}
          </Button>
        )}
      </form>

      {step === 'otp' && (
        <button
          onClick={handleSendOTP}
          className="w-full text-center text-sm text-primary hover:underline"
        >
          Resend code
        </button>
      )}

      <p className="text-center text-sm text-muted-foreground">
        <Link to={ROUTES.LOGIN} className="text-primary hover:underline font-medium">
          Back to login
        </Link>
      </p>
    </div>
  );
}
