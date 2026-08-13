import { motion } from 'framer-motion';
import { GraduationCap, Infinity as InfinityIcon, Award, Users2, type LucideIcon } from 'lucide-react';
import { SectionHeading } from './SectionHeading';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: string;
}

const FEATURES: Feature[] = [
  {
    icon: GraduationCap,
    title: 'Expert instructors',
    description: 'Learn directly from industry professionals who have shipped real products and mentor full teams.',
    accent: 'bg-primary/10 text-primary',
  },
  {
    icon: InfinityIcon,
    title: 'Lifetime access',
    description: 'Buy once and keep forever. Revisit lessons anytime and stay current with free course updates.',
    accent: 'bg-sky-500/10 text-sky-500',
  },
  {
    icon: Award,
    title: 'Recognized certificates',
    description: 'Earn shareable certificates on completion that showcase your verified skills to employers.',
    accent: 'bg-amber-500/10 text-amber-500',
  },
  {
    icon: Users2,
    title: 'Community learning',
    description: 'Join a thriving community of learners, collaborate on projects, and grow your network.',
    accent: 'bg-violet-500/10 text-violet-500',
  },
];

export function WhyChooseUs() {
  return (
    <section id="why-us" className="py-16 sm:py-24 lg:py-28">
      <div className="container-custom">
        <SectionHeading
          eyebrow="Why NextEra"
          title="Everything you need to succeed"
          subtitle="A complete learning experience designed around your goals — not just video lessons."
        />

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {FEATURES.map((feature) => (
            <motion.div
              key={feature.title}
              variants={{
                hidden: { opacity: 0, y: 24 },
                show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
              }}
              className="group rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
            >
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${feature.accent} transition-transform duration-300 group-hover:scale-110`}
              >
                <feature.icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
