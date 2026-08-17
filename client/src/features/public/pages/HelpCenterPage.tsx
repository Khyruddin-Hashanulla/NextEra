import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Award,
  BookOpen,
  CreditCard,
  GraduationCap,
  LifeBuoy,
  Mail,
  MessageCircle,
  Rocket,
  Search,
  SearchX,
  ShieldCheck,
  Video,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Section, Container } from '@/components/common/Section';
import { PageBackground } from '@/components/layout/PageBackground';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FaqAccordion } from '@/features/public/components/faq/FaqAccordion';
import { useAuth } from '@/providers/AuthProvider';
import type { User } from '@/types/user';
import { SEO } from '@/components/seo/SEO';
import { StructuredData } from '@/components/seo/StructuredData';
import { webPageSchema, breadcrumbListSchema } from '@/lib/schema';

type Audience = 'student' | 'instructor' | 'admin';

interface HelpCategory {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  audiences: Audience[];
}

interface HelpArticle {
  id: string;
  categoryId: string;
  question: string;
  answer: string;
}

const helpCategories: HelpCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Account creation, login, email verification, and getting started.',
    icon: Rocket,
    audiences: ['student'],
  },
  {
    id: 'courses-learning',
    title: 'Courses & Learning',
    description: 'Enrollment, lectures, progress, quizzes, and assignments.',
    icon: BookOpen,
    audiences: ['student'],
  },
  {
    id: 'payments-billing',
    title: 'Payments & Billing',
    description: 'Checkout, refunds, subscriptions, and invoices.',
    icon: CreditCard,
    audiences: ['student'],
  },
  {
    id: 'certificates',
    title: 'Certificates',
    description: 'Completion, generation, download, and verification.',
    icon: Award,
    audiences: ['student'],
  },
  {
    id: 'live-classes',
    title: 'Live Classes',
    description: 'Joining meetings, scheduling, and session recordings.',
    icon: Video,
    audiences: ['student', 'instructor'],
  },
  {
    id: 'account-security',
    title: 'Account & Security',
    description: 'Profile settings, password, and account security.',
    icon: ShieldCheck,
    audiences: ['student', 'instructor', 'admin'],
  },
  {
    id: 'instructor',
    title: 'Instructor',
    description: 'Application, course creation, publishing, students, and revenue.',
    icon: GraduationCap,
    audiences: ['instructor'],
  },
  {
    id: 'technical-support',
    title: 'Technical Support',
    description: 'Browser issues, video playback, uploads, and connectivity.',
    icon: Wrench,
    audiences: ['student', 'instructor', 'admin'],
  },
];

const helpArticles: HelpArticle[] = [
  {
    id: 'create-account',
    categoryId: 'getting-started',
    question: 'How do I create an account?',
    answer:
      'Click Sign Up in the top-right corner and register with your email and password, or sign in instantly with Google. After registering, verify your email address using the link we send you, then start browsing courses right away.',
  },
  {
    id: 'reset-password',
    categoryId: 'getting-started',
    question: 'How do I reset my password?',
    answer:
      'On the login page, click Forgot Password, enter your email, and follow the reset link we send you. The link expires after one hour, so complete the reset promptly.',
  },
  {
    id: 'purchase-course',
    categoryId: 'courses-learning',
    question: 'How do I purchase and access a course?',
    answer:
      'Open any course and click Enroll Now. Complete the secure checkout (Razorpay/Stripe), and the course appears in your My Courses list instantly. Free courses can be enrolled in with one click.',
  },
  {
    id: 'track-progress',
    categoryId: 'courses-learning',
    question: 'How do I track my learning progress?',
    answer:
      'Your progress saves automatically as you complete lectures. Your dashboard shows completion for each course, and your quiz and assignment scores are kept in one place.',
  },
  {
    id: 'submit-quizzes-assignments',
    categoryId: 'courses-learning',
    question: 'How do I submit quizzes and assignments?',
    answer:
      'Open the relevant lecture and use the quiz or assignment panel. Most quizzes allow multiple attempts, and assignments let you attach files along with your text before submitting for review.',
  },
  {
    id: 'payment-failed',
    categoryId: 'payments-billing',
    question: 'What should I do if a payment fails?',
    answer:
      "Double-check your card details and internet connection, then try the checkout again once. Confirm you haven't been charged before retrying. If the issue continues, contact support with your order details.",
  },
  {
    id: 'refunds',
    categoryId: 'payments-billing',
    question: 'How do refunds work?',
    answer:
      'Individual course purchases are covered by a 14-day refund window, as described in our Terms of Service. Refunds are denied if more than 20% of the course has been accessed. Subscription and bundle purchases follow the terms shown at checkout.',
  },
  {
    id: 'subscriptions',
    categoryId: 'payments-billing',
    question: 'How do subscriptions work?',
    answer:
      'Subscription plans renew automatically at the end of each billing period. Cancel any time from your account settings, and your access continues until the end of the paid period.',
  },
  {
    id: 'earn-certificate',
    categoryId: 'certificates',
    question: 'How do I earn a certificate?',
    answer:
      'Finish all lectures and pass the required assessments in a course. Once complete, a verified certificate with a unique ID and QR code is generated in My Certificates for download.',
  },
  {
    id: 'verify-certificate',
    categoryId: 'certificates',
    question: 'How do I verify a certificate?',
    answer:
      'Each certificate has a unique verification identifier and QR code. Employers can verify it on the certificate verification page using the ID or by scanning the code.',
  },
  {
    id: 'join-live-class',
    categoryId: 'live-classes',
    question: 'How do I join a live class?',
    answer:
      'Open My Live Classes to see scheduled sessions. When a session starts, click the join link from the class page. Missed sessions can be watched later from the recordings library.',
  },
  {
    id: 'become-instructor',
    categoryId: 'instructor',
    question: 'How do I become an instructor?',
    answer:
      "Apply through the Become an Instructor page. After our team reviews your application and you're approved, you can create and publish courses from your instructor dashboard.",
  },
  {
    id: 'instructor-payouts',
    categoryId: 'instructor',
    question: 'How do instructor payouts work?',
    answer:
      'Your earnings appear in the instructor dashboard once students purchase your courses. Payouts are processed from your wallet on the schedule shown in the dashboard.',
  },
  {
    id: 'update-profile',
    categoryId: 'account-security',
    question: 'How do I update my profile?',
    answer:
      'Go to Settings in your account to update your name, avatar, bio, and contact details. Email changes require verification of the new address.',
  },
  {
    id: 'account-security',
    categoryId: 'account-security',
    question: 'How do I keep my account secure?',
    answer:
      'Use a strong, unique password, keep your email verified, and never share your login details. If you notice suspicious activity, contact support immediately.',
  },
  {
    id: 'video-not-playing',
    categoryId: 'technical-support',
    question: "Why won't my video play?",
    answer:
      'Try refreshing the page, clearing your browser cache, switching to a different browser, checking your internet connection, and disabling browser extensions. If the issue persists, contact support.',
  },
  {
    id: 'contact-support',
    categoryId: 'technical-support',
    question: 'How do I contact support?',
    answer:
      'Use the Contact page to send us a message, or email support@nextera.io. Our team typically responds within 24 hours.',
  },
];

function orderCategories(categories: HelpCategory[], role?: User['role']): HelpCategory[] {
  if (role !== 'instructor') return categories;
  return [...categories].sort((a, b) => {
    const aInstructor = a.audiences.includes('instructor') ? 0 : 1;
    const bInstructor = b.audiences.includes('instructor') ? 0 : 1;
    return aInstructor - bInstructor;
  });
}

function scrollToFaq() {
  const element = document.getElementById('faq');
  if (!element) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  element.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
}

function HelpCategoryCard({
  category,
  onSelect,
}: {
  category: HelpCategory;
  onSelect: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const Icon = category.icon;

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={shouldReduceMotion ? undefined : { y: -2 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/50 p-6 text-left backdrop-blur-sm transition-colors duration-300 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-20 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]"
        aria-hidden="true"
      />
      <span className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-border/60 bg-muted/50 text-primary transition-colors duration-300 group-hover:border-primary/40 group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <h2 className="relative mt-5 text-heading-md font-semibold text-foreground">{category.title}</h2>
      <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">{category.description}</p>
      <span className="relative mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary">
        Browse topics
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </motion.button>
  );
}

export function HelpCenterPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const hasQuery = query.trim().length > 0;
  const normalizedQuery = query.trim().toLowerCase();

  const orderedCategories = useMemo(() => orderCategories(helpCategories, user?.role), [user?.role]);

  const results = useMemo(() => {
    if (!hasQuery) return [];
    return helpArticles.filter((article) => {
      const category = helpCategories.find((c) => c.id === article.categoryId);
      return (
        article.question.toLowerCase().includes(normalizedQuery) ||
        article.answer.toLowerCase().includes(normalizedQuery) ||
        category?.title.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [hasQuery, normalizedQuery]);

  const groups = useMemo(
    () =>
      orderedCategories
        .filter((category) => !activeCategory || category.id === activeCategory)
        .map((category) => ({
          category,
          articles: helpArticles.filter((article) => article.categoryId === category.id),
        }))
        .filter((group) => group.articles.length > 0),
    [orderedCategories, activeCategory]
  );

  const selectedCategory = activeCategory
    ? helpCategories.find((category) => category.id === activeCategory)
    : null;

  const handleCategorySelect = (categoryId: string) => {
    setQuery('');
    setActiveCategory(categoryId);
    scrollToFaq();
  };

  return (
    <>
      <SEO
        title="Help Center"
        description="Get help with your NextEra account, courses, payments, certificates, and more."
        canonical="/help"
      />
      <StructuredData
        schemas={[
          webPageSchema({
            name: 'Help Center',
            description: 'Get help with your NextEra account, courses, payments, certificates, and more.',
            path: '/help',
          }),
          breadcrumbListSchema([
            { name: 'Home', path: '/' },
            { name: 'Help Center', path: '/help' },
          ]),
        ]}
      />
      <div className="min-h-screen overflow-x-clip">
        {/* Hero + Search */}
        <Section size="sm" id="hero" className="relative overflow-hidden">
          <PageBackground variant="hero" className="absolute inset-0" />
          <Container>
            <div className="relative z-10 mx-auto max-w-5xl">
              <div className="max-w-3xl">
                <motion.span
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary"
                >
                  <LifeBuoy className="h-3.5 w-3.5" aria-hidden="true" />
                  Help Center
                </motion.span>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.6 }}
                  className="mt-6 text-display-xl font-display font-bold tracking-tight text-foreground text-balance"
                >
                  How can we help you?
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="mt-6 max-w-2xl text-body-lg text-muted-foreground text-balance"
                >
                  Search our Help Center for answers, guides, and useful information.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="mt-9 max-w-xl"
                >
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      aria-label="Search the Help Center"
                      placeholder="Search questions, guides, and topics…"
                      className="h-12 rounded-full border-border/60 bg-background/70 pl-12 pr-12 text-base shadow-sm backdrop-blur-sm"
                    />
                    {hasQuery && (
                      <button
                        type="button"
                        onClick={() => setQuery('')}
                        aria-label="Clear search query"
                        className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </Container>
        </Section>

        {/* Search results or categories + FAQ */}
        <Section size="sm" id="content" className="pt-0 sm:pt-0 lg:pt-0">
          <Container>
            <div className="mx-auto max-w-5xl">
              {hasQuery ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h2 className="text-heading-md font-semibold text-foreground">Search Results</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {results.length} {results.length === 1 ? 'answer' : 'answers'} for &ldquo;{query}&rdquo;
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuery('')}
                      className="gap-1.5 rounded-full"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                      Clear search
                    </Button>
                  </div>

                  {results.length > 0 ? (
                    <div className="space-y-4">
                      {results.map((article) => (
                        <FaqAccordion key={article.id} question={article.question} answer={article.answer} />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-border/60 bg-card/40 p-10 text-center sm:p-12">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/60">
                        <SearchX className="h-8 w-8 text-muted-foreground/60" aria-hidden="true" />
                      </div>
                      <h3 className="text-heading-md font-semibold text-foreground">We couldn't find an answer for that</h3>
                      <p className="mx-auto mt-3 max-w-md text-body text-muted-foreground">
                        Try a different keyword, browse our topics below, or reach out to our support team.
                      </p>
                      <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <Button variant="outline" size="lg" className="rounded-full" onClick={() => setQuery('')}>
                          Browse categories
                        </Button>
                        <Button asChild size="lg" className="gap-2 rounded-full">
                          <Link to="/contact">
                            <MessageCircle className="h-4 w-4" aria-hidden="true" />
                            Contact support
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <>
                  {/* Categories */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Help topics">
                    {orderedCategories.map((category) => (
                      <HelpCategoryCard
                        key={category.id}
                        category={category}
                        onSelect={() => handleCategorySelect(category.id)}
                      />
                    ))}
                  </div>

                  {/* FAQ */}
                  <section id="faq" aria-labelledby="faq-heading" className="mt-20 scroll-mt-24">
                    <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <h2 id="faq-heading" className="text-heading-md font-semibold text-foreground">
                          Frequently Asked Questions
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {selectedCategory
                            ? `Showing answers for ${selectedCategory.title}.`
                            : 'Quick answers to the questions we hear most often.'}
                        </p>
                      </div>
                      {selectedCategory && (
                        <button
                          type="button"
                          onClick={() => setActiveCategory(null)}
                          aria-label={`Show all topics (currently viewing ${selectedCategory.title})`}
                          className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          {selectedCategory.title}
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-12">
                      {groups.map((group, index) => (
                        <section key={group.category.id} aria-labelledby={`help-${group.category.id}-heading`}>
                          <div className="mb-6 flex items-baseline gap-3 border-b border-border/40 pb-4">
                            <span className="text-sm font-semibold tabular-nums text-primary">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <h3 id={`help-${group.category.id}-heading`} className="text-heading-md font-semibold text-foreground">
                              {group.category.title}
                            </h3>
                          </div>
                          <div className="space-y-4">
                            {group.articles.map((article) => (
                              <FaqAccordion key={article.id} question={article.question} answer={article.answer} />
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>
                  </section>
                </>
              )}

              {/* Support CTA */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="relative mt-20 overflow-hidden rounded-3xl border border-border/60 bg-card/40 p-8 text-center sm:p-12"
              >
                <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-30" aria-hidden="true" />
                <div
                  className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
                  aria-hidden="true"
                />
                <div className="relative">
                  <h2 className="text-heading-md font-semibold text-foreground">Still need help?</h2>
                  <p className="mx-auto mt-3 max-w-xl text-body text-muted-foreground">
                    Our support team is here to help. Reach out and we&apos;ll get back to you quickly.
                  </p>
                  <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <Button asChild size="lg" className="gap-2 rounded-full">
                      <Link to="/contact">
                        <MessageCircle className="h-4 w-4" aria-hidden="true" />
                        Contact Support
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="gap-2 rounded-full">
                      <a href="mailto:support@nextera.io">
                        <Mail className="h-4 w-4" aria-hidden="true" />
                        Email Us
                      </a>
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </Container>
        </Section>
      </div>
    </>
  );
}