import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
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
    toast.success('Subscribed successfully!');
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
                <CheckCircle2 className="h-7 w-7 text-success" />
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
                <Mail className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Stay Updated</h3>
            <p className="text-sm text-muted-foreground mb-6">Get the latest courses, resources, and learning tips delivered to your inbox.</p>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  {...register('email')}
                  className={cn(
                    'h-12 rounded-full border-border bg-muted/50 px-5 text-sm',
                    errors.email && 'border-destructive/50 focus:border-destructive'
                  )}
                />
                {errors.email && <p className="text-xs text-destructive mt-1 text-left">{errors.email.message}</p>}
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 rounded-full bg-primary hover:bg-primary-700 text-white px-6 font-medium shadow-sm flex-shrink-0"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Subscribe'}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground/70 mt-4">
              No spam. Unsubscribe anytime. Read our{' '}
              <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
