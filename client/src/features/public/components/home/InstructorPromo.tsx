import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Video, Wallet, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants';

const BENEFITS = [
  'Share your knowledge with learners worldwide',
  'Earn revenue on every enrollment',
  'Build your personal brand as an expert',
];

export function InstructorPromo() {
  return (
    <section id="become-instructor" className="py-16 sm:py-24 lg:py-28">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-primary to-violet-600 px-6 py-14 text-primary-foreground sm:px-12 sm:py-16 lg:px-16 lg:py-20"
        >
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
          </div>

          <div className="relative z-10 grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <motion.span
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium"
              >
                <Video className="h-4 w-4" aria-hidden="true" />
                Become an instructor
              </motion.span>

              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 }}
                className="mt-5 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem] font-display"
              >
                Share your expertise. Inspire thousands.
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="mt-4 max-w-xl text-base leading-relaxed text-primary-foreground/85 sm:text-lg"
              >
                Turn your skills into a thriving teaching business. Create a course once and earn
                revenue from every student who enrolls.
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
                className="mt-8"
              >
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-full bg-white px-8 text-base font-semibold text-primary shadow-lg hover:bg-white/90"
                >
                  <Link to={ROUTES.INSTRUCTOR_APPLY}>
                    Apply to teach <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </motion.div>
            </div>

            <div className="grid gap-4">
              {[
                { icon: Wallet, title: 'Earn on every sale', text: 'Get paid for each enrollment, minus a small platform share.' },
                { icon: Globe, title: 'Reach a global audience', text: 'Students from 120+ countries can discover your course.' },
                { icon: Video, title: 'Easy course creation', text: 'Structured tools to plan, record, and publish in days.' },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.35 + index * 0.1 }}
                  className="flex items-center gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur-sm"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{item.title}</p>
                    <p className="text-sm text-primary-foreground/80">{item.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
