import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Users, BookOpen, Award, Clock, ChevronDown } from 'lucide-react';

interface HeroProps {
  className?: string;
}

export function Hero({ className }: HeroProps) {
  return (
    <section className={cn('relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background', className)}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <svg className="absolute left-0 bottom-0 w-full h-auto opacity-5" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="hsl(var(--primary))" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,218.7C672,235,768,245,864,234.7C960,224,1056,192,1152,170.7C1248,149,1344,139,1392,133.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
        </svg>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 py-16 lg:py-24">
          <motion.div
            className="flex-1 text-center lg:text-left"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              New: AI-Powered Learning Assistant Now Available
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
              Master In-Demand Skills with{' '}
              <span className="text-primary">NextEra</span>{' '}
              Learning
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl lg:mx-0 mx-auto leading-relaxed">
              Learn from industry experts, build real-world projects, and earn verified certificates.
              Join over 50,000 learners already upgrading their careers.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 mt-8 justify-center lg:justify-start">
              <Button asChild size="lg" className="rounded-full bg-primary hover:bg-primary-700 text-white px-8 h-12 text-base font-semibold shadow-md shadow-primary/30">
                <Link to={ROUTES.COURSES}>
                  Explore Courses <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-8 h-12 text-base border-2 border-border hover:border-foreground/20 text-foreground/80">
                <Link to={ROUTES.REGISTER}>
                  Start Free Trial
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-6 mt-10 justify-center lg:justify-start">
              {[
                { icon: BookOpen, label: '500+ Courses' },
                { icon: Users, label: '50K+ Students' },
                { icon: Award, label: 'Certificates' },
                { icon: Clock, label: 'Lifetime Access' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <item.icon className="h-4 w-4 text-primary" />
                  <span className="font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="flex-1 relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="relative mx-auto w-full max-w-lg">
              <div className="aspect-square rounded-full border-2 border-primary/30 p-4">
                <div className="w-full h-full rounded-full border-2 border-primary/20 p-4 overflow-hidden bg-muted/50">
                  <img
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=600&fit=crop"
                    alt="Students learning together"
                    className="w-full h-full object-cover rounded-full"
                    loading="eager"
                  />
                </div>
              </div>

              <motion.div
                className="absolute top-8 right-0 bg-background rounded-xl shadow-lg border border-border p-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">5K+</p>
                    <p className="text-xs text-muted-foreground">Online Courses</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute bottom-12 -left-4 bg-background rounded-xl shadow-lg border border-border p-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-50">
                    <Users className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">50K+</p>
                    <p className="text-xs text-muted-foreground">Active Students</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute bottom-4 right-8 bg-background rounded-xl shadow-lg border border-border p-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, duration: 0.5 }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map((star) => (
                      <svg key={star} className="w-3 h-3 fill-yellow-400 text-yellow-400" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                    ))}
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">4.9/5 Rating</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="flex flex-col items-center pb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          <span className="text-sm text-muted-foreground/70 mb-2">Trusted by learners at</span>
          <div className="flex items-center gap-8 sm:gap-12 opacity-40">
            {['Google', 'Microsoft', 'Amazon', 'Meta', 'Netflix'].map((company) => (
              <span key={company} className="text-lg sm:text-xl font-bold text-muted-foreground/70 tracking-tight">{company}</span>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="flex justify-center pb-8">
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="h-6 w-6 text-muted-foreground/50" />
        </motion.div>
      </div>
    </section>
  );
}
