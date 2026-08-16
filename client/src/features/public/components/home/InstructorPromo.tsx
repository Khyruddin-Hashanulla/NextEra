import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, CheckCircle2, GraduationCap, Users, Video, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/AuthProvider';
import { getDashboardRoute, ROUTES } from '@/lib/constants';

const BENEFITS = [
  'Share your knowledge with learners worldwide',
  'Earn revenue on every enrollment',
  'Build your personal brand as an expert',
];

const easeOut = [0.22, 1, 0.36, 1] as const;

export function InstructorPromo() {
  const { isAuthenticated, user } = useAuth();
  const reduceMotion = useReducedMotion();

  const isInstructor = isAuthenticated && user?.role === 'instructor';
  const isAdmin = isAuthenticated && user?.role === 'admin';

  const cta = isInstructor
    ? { label: 'Manage your courses', to: ROUTES.INSTRUCTOR_COURSES }
    : isAdmin
      ? { label: 'Go to admin dashboard', to: getDashboardRoute(user?.role) }
      : { label: 'Become an instructor', to: ROUTES.INSTRUCTOR_APPLY };

  return (
    <section id="become-instructor" className="pt-12 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: easeOut }}
          className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-primary to-violet-600 px-6 py-14 text-primary-foreground sm:px-12 sm:py-16 lg:px-16 lg:py-20"
        >
          {/* Layered background */}
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
                backgroundSize: '44px 44px',
              }}
            />
            <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full border border-white/20" />
            <div className="absolute -bottom-32 -right-16 h-72 w-72 rounded-full border border-white/15" />
          </div>

          <div className="relative z-10 grid items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
            {/* Copy */}
            <div>
              <motion.span
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium"
              >
                <GraduationCap className="h-4 w-4" aria-hidden="true" />
                Become an instructor
              </motion.span>

              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 }}
                className="mt-5 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem]"
              >
                Turn your knowledge into impact
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="mt-4 max-w-xl text-base leading-relaxed text-primary-foreground/85 sm:text-lg"
              >
                Teach what you know, reach students worldwide, and earn from every enrollment — all with
                structured course tools that make creating a course simple.
              </motion.p>

              <motion.ul
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.25 }}
                className="mt-6 space-y-3"
              >
                {BENEFITS.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3 text-primary-foreground/90">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-white" aria-hidden="true" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </motion.ul>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center"
              >
                <Button
                  asChild
                  size="lg"
                  className="h-12 w-full rounded-full bg-white px-8 text-base font-semibold text-primary shadow-lg hover:bg-white/90 sm:w-auto"
                >
                  <Link to={cta.to}>
                    {cta.label} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                <p className="text-sm text-primary-foreground/70">
                  {isInstructor
                    ? 'Back to your teaching workspace'
                    : isAdmin
                      ? 'Manage instructor approvals and courses'
                      : 'Free to apply · Approval within a few days'}
                </p>
              </motion.div>
            </div>

            {/* Instructor studio visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25, duration: 0.6, ease: easeOut }}
              className="relative mx-auto w-full max-w-sm lg:max-w-none"
              aria-hidden="true"
            >
              <div className="pointer-events-none absolute -inset-5">
                <div className="absolute inset-0 rounded-[2rem] bg-white/10 blur-2xl" />
              </div>

              <div className="relative rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl shadow-black/10 backdrop-blur-sm">
                {/* Instructor profile */}
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-white/30 to-white/5 text-white">
                    <GraduationCap className="h-7 w-7" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-primary-foreground/80">Your teaching profile</p>
                    <p className="truncate font-bold text-white">Instructor · NextEra</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/10 p-3.5">
                    <Users className="h-4 w-4 text-white/80" />
                    <p className="mt-2 text-lg font-bold leading-none text-white">40K+</p>
                    <p className="mt-1 text-[11px] leading-none text-primary-foreground/80">Students reached</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3.5">
                    <Wallet className="h-4 w-4 text-white/80" />
                    <p className="mt-2 text-lg font-bold leading-none text-white">Earn</p>
                    <p className="mt-1 text-[11px] leading-none text-primary-foreground/80">On every sale</p>
                  </div>
                </div>

                {/* Course creation progress */}
                <div className="mt-4 rounded-2xl bg-white/10 p-4">
                  <div className="flex items-center justify-between gap-2 text-xs text-primary-foreground/85">
                    <span className="truncate font-semibold text-white">New course · DSA with Java</span>
                    <span className="shrink-0">Draft</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white/15">
                    <div className="h-full w-2/3 rounded-full bg-white" />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-primary-foreground/75">
                    <span>Course setup</span>
                    <span>66% complete</span>
                  </div>
                </div>
              </div>

              {/* Floating chips */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.45 }}
                className="absolute -right-2 -top-4 sm:-right-4"
              >
                <motion.div
                  animate={reduceMotion ? undefined : { y: [0, -4, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-primary shadow-lg"
                >
                  <Video className="h-4 w-4" />
                  <span className="text-xs font-bold">Live class · Today</span>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.55 }}
                className="absolute -bottom-4 -left-2 sm:-left-4"
              >
                <motion.div
                  animate={reduceMotion ? undefined : { y: [0, 4, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                  className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-primary shadow-lg"
                >
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="text-xs font-bold">Course published</span>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
