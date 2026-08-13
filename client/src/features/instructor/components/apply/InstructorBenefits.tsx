import {
  CircleDollarSign,
  Clock3,
  Users,
  BadgeCheck,
  FileText,
  ShieldCheck,
  Sparkles,
  Lock,
  Headphones,
  Star,
} from 'lucide-react';
import { PageBackground } from '@/components/layout/PageBackground';

const benefits = [
  {
    icon: CircleDollarSign,
    title: 'Earn on every sale',
    description: 'Get paid for every enrolled student, with transparent payouts.',
  },
  { icon: Clock3, title: 'Flexible schedule', description: 'Teach from anywhere, at your own pace, on your own time.' },
  {
    icon: Users,
    title: 'Global audience',
    description: 'Reach learners in 120+ countries ready to grow their skills.',
  },
  {
    icon: BadgeCheck,
    title: 'Grow your brand',
    description: 'Build a personal brand as a recognized industry expert.',
  },
];

const steps = [
  { icon: FileText, title: 'Submit your application', description: 'Tell us about your skills and experience.' },
  { icon: ShieldCheck, title: 'Review & verification', description: 'Our team verifies your credentials.' },
  { icon: Sparkles, title: 'Onboarding', description: 'Get set up with tools and best practices.' },
  { icon: CircleDollarSign, title: 'Publish & earn', description: 'Launch your course and start earning.' },
];

const stats = [
  { value: '50K+', label: 'Learners' },
  { value: '500+', label: 'Courses' },
  { value: '200+', label: 'Instructors' },
  { value: '120+', label: 'Countries' },
];

const trust = [
  { icon: Lock, label: 'Secure uploads' },
  { icon: Headphones, label: '24/7 creator support' },
  { icon: Star, label: '4.9/5 learner rating' },
];

export function InstructorBenefits() {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border bg-card p-6 shadow-sm sm:p-7">
        <PageBackground variant="hero" className="absolute inset-0 -z-10" />
        <div className="relative">
          <h2 className="text-heading-sm font-display font-semibold tracking-tight text-foreground">
            Share your knowledge. Get rewarded.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Join thousands of instructors turning their expertise into income.
          </p>
          <ul className="mt-6 space-y-4">
            {benefits.map((benefit) => (
              <li key={benefit.title} className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <benefit.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{benefit.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">How it works</h2>
        <ol className="mt-5 space-y-4">
          {steps.map((step, index) => (
            <li key={step.title} className="flex items-start gap-3">
              <div className="relative flex flex-col items-center">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-muted/40 text-foreground">
                  <step.icon className="h-4 w-4" aria-hidden="true" />
                </div>
                {index < steps.length - 1 && <span className="mt-1 h-full w-px bg-border" aria-hidden="true" />}
              </div>
              <div className="pb-1">
                <p className="text-sm font-semibold text-foreground">{step.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">NextEra at a glance</h2>
        <dl className="mt-5 grid grid-cols-2 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border bg-background p-4 text-center">
              <dd className="text-2xl font-bold tracking-tight text-foreground">{stat.value}</dd>
              <dt className="mt-1 text-xs text-muted-foreground">{stat.label}</dt>
            </div>
          ))}
        </dl>
        <div className="mt-5 flex flex-wrap gap-2">
          {trust.map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1.5 text-xs font-medium text-muted-foreground"
            >
              <item.icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
