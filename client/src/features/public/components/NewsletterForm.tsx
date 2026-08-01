import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Loader2, CheckCircle2, Mail } from 'lucide-react';

const newsletterSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type NewsletterFormData = z.infer<typeof newsletterSchema>;

interface NewsletterFormProps {
  className?: string;
}

export function NewsletterForm({ className }: NewsletterFormProps) {
  const [subscribed, setSubscribed] = useState(false);
  const { addToast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewsletterFormData>({
    resolver: zodResolver(newsletterSchema),
  });

  const onSubmit = async (_data: NewsletterFormData) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSubscribed(true);
    addToast({ title: 'Subscribed successfully!', variant: 'success' });
  };

  return (
    <div className={cn('bg-background rounded-2xl border border-border shadow-sm p-8 sm:p-10', className)}>
      <AnimatePresence mode="wait">
        {subscribed ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6"
          >
            <div className="flex items-center justify-center mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="h-7 w-7 text-success" aria-hidden="true" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">You're subscribed!</h3>
            <p className="text-sm text-muted-foreground">Thanks for joining. We'll send you the latest updates and learning resources.</p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Mail className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Stay Updated</h3>
            <p className="text-sm text-muted-foreground mb-6">Get the latest courses, resources, and learning tips delivered to your inbox.</p>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" noValidate>
              <div className="flex-1">
                <label htmlFor="newsletter-email" className="sr-only">Email address</label>
                <input
                  id="newsletter-email"
                  type="email"
                  placeholder="Enter your email"
                  {...register('email')}
                  className={cn(
                    'flex h-12 w-full rounded-full border bg-muted/50 px-5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                    errors.email ? 'border-destructive/50 focus:border-destructive' : 'border-border'
                  )}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'newsletter-error' : undefined}
                />
                {errors.email && <p id="newsletter-error" className="text-xs text-destructive mt-1 text-left" role="alert">{errors.email.message}</p>}
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 rounded-full bg-primary hover:bg-primary-700 text-white px-6 font-medium shadow-sm flex-shrink-0"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : 'Subscribe'}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground/70 mt-4">
              No spam. Unsubscribe anytime. Read our{' '}
              <a href="/privacy" className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded">Privacy Policy</a>.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
