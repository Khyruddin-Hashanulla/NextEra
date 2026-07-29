import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { verifyEmailSchema, VerifyEmailFormData } from '@/lib/validators/authSchema';
import { useVerifyEmailMutation, useSendOTPMutation } from '../hooks/useAuthMutations';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { Mail, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

export function VerifyEmailForm() {
  const { user } = useAuth();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [verified, setVerified] = useState(false);
  const verifyEmailMutation = useVerifyEmailMutation();
  const sendOTPMutation = useSendOTPMutation();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
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
    setVerified(true);
  };

  if (verified) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex flex-col items-center text-center"
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-7 w-7 text-success" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">Email verified!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your email has been verified successfully. You can now sign in.
        </p>
        <Button asChild className="mt-6">
          <Link to={ROUTES.LOGIN}>Sign in</Link>
        </Button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        variants={stagger}
        initial="hidden"
        animate="show"
        exit={{ opacity: 0, y: -10 }}
        className="space-y-6"
      >
        <motion.div variants={item} className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Verify your email</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {step === 'email'
              ? 'Enter your email to receive a verification code'
              : `Enter the 6-digit code sent to ${email}`}
          </p>
        </motion.div>

        <motion.form variants={item} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            id="email"
            type="email"
            label="Email"
            placeholder="you@example.com"
            icon={<Mail className="h-4 w-4" />}
            iconPosition="left"
            disabled={step === 'otp'}
            error={errors.email?.message}
            {...register('email')}
          />

          {step === 'otp' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <Input
                id="otp"
                type="text"
                label="Verification Code"
                placeholder="000000"
                maxLength={6}
                icon={<KeyRound className="h-4 w-4" />}
                iconPosition="left"
                className="text-center text-lg tracking-[0.5em]"
                error={errors.otp?.message}
                {...register('otp')}
              />
            </motion.div>
          )}

          {step === 'email' ? (
            <Button
              type="button"
              fullWidth
              size="lg"
              onClick={handleSendOTP}
              loading={sendOTPMutation.isPending}
            >
              Send OTP
            </Button>
          ) : (
            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={verifyEmailMutation.isPending}
            >
              Verify email
            </Button>
          )}
        </motion.form>

        {step === 'otp' && (
          <motion.div variants={item}>
            <button
              type="button"
              onClick={handleSendOTP}
              className="w-full text-center text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              Resend code
            </button>
          </motion.div>
        )}

        <motion.p variants={item} className="text-center text-sm text-muted-foreground">
          <Link to={ROUTES.LOGIN} className="font-medium text-primary transition-colors hover:text-primary/80">
            <ArrowLeft className="mr-1 inline h-4 w-4" />
            Back to login
          </Link>
        </motion.p>
      </motion.div>
    </AnimatePresence>
  );
}
