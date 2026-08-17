import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageCircle, Search, X } from 'lucide-react';
import { Section, Container } from '@/components/common/Section';
import { PageBackground } from '@/components/layout/PageBackground';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SEO } from '@/components/seo/SEO';
import { StructuredData } from '@/components/seo/StructuredData';
import { faqPageSchema } from '@/lib/schema';
import { FaqAccordion } from '../components/faq/FaqAccordion';

const faqs = [
  {
    category: 'Getting Started',
    items: [
      {
        question: 'How do I create an account?',
        answer:
          'Click "Sign Up" in the top right corner, enter your email and create a password. You can also sign up with Google. Once verified, you\'ll have instant access to browse courses.',
      },
      {
        question: 'Is there a free trial?',
        answer:
          'Yes! Many of our courses offer free preview lessons. You can also filter for completely free courses. No credit card required for free content.',
      },
      {
        question: 'How do I enroll in a course?',
        answer:
          'Navigate to any course page and click "Enroll Now" or "Enroll for Free". For paid courses, you\'ll be redirected to our secure payment gateway. Once payment is confirmed, you get immediate access.',
      },
      {
        question: 'Can I switch devices while learning?',
        answer:
          'Absolutely! Your progress syncs automatically across all devices. Start on desktop, continue on mobile, finish on tablet.',
      },
    ],
  },
  {
    category: 'Billing & Payments',
    items: [
      {
        question: 'What payment methods do you accept?',
        answer:
          'We accept all major credit cards (Visa, Mastercard, American Express), debit cards, UPI, net banking, and digital wallets through our secure payment partners (Razorpay/Stripe).',
      },
      {
        question: 'Do you offer refunds?',
        answer:
          'Yes, we offer a 30-day money-back guarantee on all individual course purchases. Request must be within 30 days of purchase, with less than 20% of course content consumed, and no certificate issued.',
      },
      {
        question: 'Can I get an invoice for my purchase?',
        answer:
          'Absolutely. Invoices are automatically generated and emailed after each purchase. You can also download them from your Order History page in your account.',
      },
      {
        question: 'Are there any hidden fees?',
        answer:
          'No hidden fees. The price you see is the price you pay. Taxes are included where applicable and shown at checkout.',
      },
      {
        question: 'How do subscriptions work?',
        answer:
          'Subscription plans auto-renew at the end of each billing period. Cancel anytime from your account settings. Access continues until the end of the paid period. No partial refunds for unused time.',
      },
    ],
  },
  {
    category: 'Course Access & Learning',
    items: [
      {
        question: 'How long do I have access to a course?',
        answer:
          'Lifetime access! Once enrolled, you can access the course content forever, including all future updates and additions.',
      },
      {
        question: 'Can I download course videos?',
        answer:
          'Yes, our mobile app allows you to download lessons for offline viewing. On desktop, content is streamed for optimal quality.',
      },
      {
        question: 'Do courses have deadlines?',
        answer:
          'No deadlines. Learn at your own pace. Some courses may have suggested timelines, but you can complete them whenever works for you.',
      },
      {
        question: 'How do certificates work?',
        answer:
          'Complete all lectures and required assessments to earn a verified certificate. Certificates include a unique verification ID and QR code. Share on LinkedIn, resume, or portfolio.',
      },
      {
        question: 'Can I retake quizzes and assignments?',
        answer:
          'Yes! Most quizzes allow multiple attempts. Check the specific course settings for retry limits and waiting periods between attempts.',
      },
    ],
  },
  {
    category: 'Technical Issues',
    items: [
      {
        question: "Video won't play - what should I do?",
        answer:
          'Try: 1) Refresh the page, 2) Clear browser cache, 3) Try a different browser, 4) Check internet connection, 5) Disable browser extensions. If issues persist, contact support.',
      },
      {
        question: 'How do I reset my password?',
        answer:
          'Click "Forgot Password" on the login page, enter your email, and follow the reset link sent to your inbox. Link expires in 1 hour.',
      },
      {
        question: "My progress isn't saving!",
        answer:
          "Ensure you're logged in and have a stable connection. Progress auto-saves every 30 seconds. If issues persist, try logging out and back in.",
      },
      {
        question: "The mobile app isn't syncing.",
        answer:
          "Pull to refresh on the dashboard. Ensure you're on the latest app version. Log out and back in if needed. Contact support with device details if unresolved.",
      },
    ],
  },
  {
    category: 'Account & Privacy',
    items: [
      {
        question: 'How do I delete my account?',
        answer:
          'Go to Settings > Account > Delete Account. This action is irreversible and will remove all your data, progress, and certificates within 30 days.',
      },
      {
        question: 'What data do you collect?',
        answer:
          'We collect: account info (name, email), learning data (progress, quiz scores), payment info (processed by partners), and usage analytics. See our Privacy Policy for details.',
      },
      {
        question: 'Can I change my email address?',
        answer:
          "Yes, go to Settings > Account > Email. You'll need to verify the new address before it becomes active.",
      },
      {
        question: 'Is my data shared with third parties?',
        answer:
          'We only share data with: payment processors (for transactions), email service (for notifications), and analytics providers (anonymized). We never sell your data.',
      },
    ],
  },
];

export function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const hasQuery = searchQuery.trim().length > 0;
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredFAQs = useMemo(
    () =>
      faqs
        .map((cat) => ({
          ...cat,
          items: cat.items.filter(
            (item) =>
              item.question.toLowerCase().includes(normalizedQuery) ||
              item.answer.toLowerCase().includes(normalizedQuery)
          ),
        }))
        .filter((cat) => cat.items.length > 0),
    [normalizedQuery]
  );

  const totalResults = filteredFAQs.reduce((acc, cat) => acc + cat.items.length, 0);

  return (
    <>
      <SEO
        title="FAQ"
        description="Find answers to commonly asked questions about NextEra courses, pricing, enrollment, and more."
        canonical="/faq"
      />
      <StructuredData schemas={[faqPageSchema(faqs.flatMap((c) => c.items))]} />
      <div className="min-h-screen overflow-x-clip">
        {/* Hero */}
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
                  FAQ
                </motion.span>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.6 }}
                  className="mt-6 text-display-xl font-display font-bold tracking-tight text-foreground text-balance"
                >
                  Quick Answers to Common Questions
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="mt-6 max-w-2xl text-body-lg text-muted-foreground text-balance"
                >
                  Can't find what you're looking for? Search below or{' '}
                  <a href="/contact" className="font-medium text-primary hover:underline">
                    contact our support team
                  </a>
                  .
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
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      aria-label="Search questions"
                      placeholder="Search questions…"
                      className="h-12 rounded-full border-border/60 bg-background/70 pl-12 pr-12 text-base shadow-sm backdrop-blur-sm"
                    />
                    {hasQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        aria-label="Clear search"
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

        {/* FAQ Accordions */}
        <Section size="sm" id="faqs" className="pt-0 sm:pt-0 lg:pt-0">
          <Container>
            <div className="mx-auto max-w-5xl">
              {hasQuery ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h2 className="text-heading-md font-semibold text-foreground">Search Results</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {totalResults} {totalResults === 1 ? 'question' : 'questions'} match your search
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchQuery('')}
                      className="gap-1.5 rounded-full"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                      Clear search
                    </Button>
                  </div>

                  {totalResults > 0 ? (
                    <div className="space-y-4">
                      {filteredFAQs.flatMap((cat) => cat.items).map((item) => (
                        <FaqAccordion key={item.question} question={item.question} answer={item.answer} />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-border/60 bg-card/40 p-10 text-center sm:p-12">
                      <h3 className="text-heading-md font-semibold text-foreground">No questions found</h3>
                      <p className="mx-auto mt-3 max-w-md text-body text-muted-foreground">
                        We couldn't find anything matching &ldquo;{searchQuery}&rdquo;. Try a different keyword or browse
                        all categories below.
                      </p>
                      <Button variant="outline" size="lg" className="mt-7 rounded-full" onClick={() => setSearchQuery('')}>
                        View all questions
                      </Button>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="space-y-16">
                  {faqs.map((category, catIndex) => (
                    <motion.section
                      key={category.category}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-40px' }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    >
                      <div className="mb-6 flex items-baseline gap-3 border-b border-border/40 pb-4">
                        <span className="text-sm font-semibold tabular-nums text-primary">0{catIndex + 1}</span>
                        <h2 className="text-heading-md font-semibold text-foreground">{category.category}</h2>
                      </div>
                      <div className="space-y-4">
                        {category.items.map((item) => (
                          <FaqAccordion key={item.question} question={item.question} answer={item.answer} />
                        ))}
                      </div>
                    </motion.section>
                  ))}
                </div>
              )}

              {/* Still need help? */}
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
                  <h2 className="text-heading-md font-semibold text-foreground">Still Need Help?</h2>
                  <p className="mx-auto mt-3 max-w-xl text-body text-muted-foreground">
                    Our support team is here to help. Response time is typically under 24 hours.
                  </p>
                  <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <Button asChild size="lg" className="gap-2 rounded-full">
                      <a href="/contact">
                        <MessageCircle className="h-4 w-4" aria-hidden="true" />
                        Contact Support
                      </a>
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