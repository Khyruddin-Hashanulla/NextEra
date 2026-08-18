import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { registerSchema, RegisterFormData } from '@/lib/validators/authSchema';
import { useRegisterMutation } from '../hooks/useAuthMutations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ROUTES } from '@/lib/constants';
import { GoogleOAuthButton } from './GoogleOAuthButton';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react';

const easeOut = [0.22, 1, 0.36, 1] as const;

export function RegisterForm() {
  const reduceMotion = useReducedMotion();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const registerMutation = useRegisterMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    await registerMutation.mutateAsync({
      name: data.name,
      email: data.email,
      password: data.password,
    });
  };

  const fadeUp = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.35, ease: easeOut },
      };

  return (
    <div className="space-y-6">
      <motion.div {...fadeUp}>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Create an account</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Join NextEra and start your learning journey
        </p>
      </motion.div>

      <motion.form {...fadeUp} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          id="name"
          type="text"
          label="Full Name"
          placeholder="John Doe"
          icon={<User className="h-4 w-4" />}
          iconPosition="left"
          error={errors.name?.message}
          {...register('name')}
        />

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
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground">
              <Lock className="h-4 w-4" />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a strong password"
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

        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
            Confirm Password
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground">
              <Lock className="h-4 w-4" />
            </div>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 pl-10 pr-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors aria-[invalid=true]:border-destructive focus-visible:aria-[invalid=true]:ring-destructive"
              aria-invalid={!!errors.confirmPassword}
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-destructive" role="alert">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button type="submit" fullWidth size="lg" loading={registerMutation.isPending}>
          Create account
        </Button>
      </motion.form>

      <motion.div {...fadeUp}>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>
      </motion.div>

      <motion.div {...fadeUp}>
        <GoogleOAuthButton />
      </motion.div>

      <motion.p {...fadeUp} className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to={ROUTES.LOGIN} className="font-medium text-primary transition-colors hover:text-primary/80">
          Sign in
        </Link>
      </motion.p>
    </div>
  );
}