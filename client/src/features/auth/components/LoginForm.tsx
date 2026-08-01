import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AxiosError } from 'axios';
import { loginSchema, LoginFormData } from '@/lib/validators/authSchema';
import { useLoginMutation, useSendOTPMutation } from '../hooks/useAuthMutations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ROUTES } from '@/lib/constants';
import { GoogleOAuthButton } from './GoogleOAuthButton';
import { useToast } from '@/providers/ToastProvider';
import { Mail, Lock, Eye, EyeOff, AlertTriangle, Send } from 'lucide-react';
import { ApiError } from '@/types/api';

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

const EMAIL_NOT_VERIFIED_MESSAGE = 'Please verify your email before logging in.';
const ACCOUNT_LOCKED_MESSAGE = 'Your account is temporarily locked due to multiple failed login attempts. Please try again later.';

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [accountLocked, setAccountLocked] = useState(false);
  const loginMutation = useLoginMutation();
  const sendOTPMutation = useSendOTPMutation();
  const { addToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setUnverifiedEmail(null);
    setAccountLocked(false);
    try {
      await loginMutation.mutateAsync(data);
    } catch (error) {
      if (error instanceof AxiosError) {
        const message = (error.response?.data as ApiError)?.message;
        if (message === EMAIL_NOT_VERIFIED_MESSAGE) {
          setUnverifiedEmail(data.email);
          addToast({
            title: 'Email not verified',
            description: 'Please verify your email before logging in.',
            variant: 'warning',
          });
          return;
        }
        if (message === ACCOUNT_LOCKED_MESSAGE) {
          setAccountLocked(true);
          addToast({
            title: 'Account locked',
            description: ACCOUNT_LOCKED_MESSAGE,
            variant: 'error',
          });
        }
      }
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    try {
      await sendOTPMutation.mutateAsync(unverifiedEmail);
      addToast({
        title: 'Verification code sent',
        description: 'Check your email for the verification code.',
        variant: 'success',
      });
    } catch {
      // Toast handled by the mutation
    }
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to your NextEra account
        </p>
      </motion.div>

      {unverifiedEmail && (
        <motion.div
          variants={item}
          className="rounded-lg border border-warning/30 bg-warning/5 p-4"
        >
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <div className="space-y-2 text-sm">
              <p className="font-medium text-foreground">Email verification required</p>
              <p className="text-muted-foreground">
                Please verify your email address (<span className="font-medium text-foreground">{unverifiedEmail}</span>)
                before signing in. Check your inbox for the verification code.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResendVerification}
                loading={sendOTPMutation.isPending}
              >
                <Send className="mr-1.5 h-3.5 w-3.5" />
                Resend verification
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      <motion.form variants={item} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          id="email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          icon={<Mail className="h-4 w-4" />}
          iconPosition="left"
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <Link
              to={ROUTES.FORGOT_PASSWORD}
              className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground">
              <Lock className="h-4 w-4" />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 pl-10 pr-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors aria-[invalid=true]:border-destructive focus-visible:aria-[invalid=true]:ring-destructive"
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-destructive" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={loginMutation.isPending}
        >
          Sign in
        </Button>
      </motion.form>

      <motion.div variants={item}>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>
      </motion.div>

      <motion.div variants={item}>
        <GoogleOAuthButton />
      </motion.div>

      <motion.p variants={item} className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link to={ROUTES.REGISTER} className="font-medium text-primary transition-colors hover:text-primary/80">
          Sign up
        </Link>
      </motion.p>
    </motion.div>
  );
}
