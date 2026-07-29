import { motion } from 'framer-motion';
import { useState } from 'react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { ChevronDown, Search, ChevronLeft, ChevronRight, Mail, MessageCircle } from 'lucide-react';
import { Section, Container } from '@/components/common/Section';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const faqs = [
  {
    category: 'Getting Started',
    items: [
      {
        question: 'How do I create an account?',
        answer: 'Click "Sign Up" in the top right corner, enter your email and create a password. You can also sign up with Google. Once verified, you\'ll have instant access to browse courses.',
      },
      {
        question: 'Is there a free trial?',
        answer: 'Yes! Many of our courses offer free preview lessons. You can also filter for completely free courses. No credit card required for free content.',
      },
      {
        question: 'How do I enroll in a course?',
        answer: 'Navigate to any course page and click "Enroll Now" or "Enroll for Free". For paid courses, you\'ll be redirected to our secure payment gateway. Once payment is confirmed, you get immediate access.',
      },
      {
        question: 'Can I switch devices while learning?',
        answer: 'Absolutely! Your progress syncs automatically across all devices. Start on desktop, continue on mobile, finish on tablet.',
      },
    ],
  },
  {
    category: 'Billing & Payments',
    items: [
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards (Visa, Mastercard, American Express), debit cards, UPI, net banking, and digital wallets through our secure payment partners (Razorpay/Stripe).',
      },
      {
        question: 'Do you offer refunds?',
        answer: 'Yes, we offer a 30-day money-back guarantee on all individual course purchases. Request must be within 30 days of purchase, with less than 20% of course content consumed, and no certificate issued.',
      },
      {
        question: 'Can I get an invoice for my purchase?',
        answer: 'Absolutely. Invoices are automatically generated and emailed after each purchase. You can also download them from your Order History page in your account.',
      },
      {
        question: 'Are there any hidden fees?',
        answer: 'No hidden fees. The price you see is the price you pay. Taxes are included where applicable and shown at checkout.',
      },
      {
        question: 'How do subscriptions work?',
        answer: 'Subscription plans auto-renew at the end of each billing period. Cancel anytime from your account settings. Access continues until the end of the paid period. No partial refunds for unused time.',
      },
    ],
  },
  {
    category: 'Course Access & Learning',
    items: [
      {
        question: 'How long do I have access to a course?',
        answer: 'Lifetime access! Once enrolled, you can access the course content forever, including all future updates and additions.',
      },
      {
        question: 'Can I download course videos?',
        answer: 'Yes, our mobile app allows you to download lessons for offline viewing. On desktop, content is streamed for optimal quality.',
      },
      {
        question: 'Do courses have deadlines?',
        answer: 'No deadlines. Learn at your own pace. Some courses may have suggested timelines, but you can complete them whenever works for you.',
      },
      {
        question: 'How do certificates work?',
        answer: 'Complete all lectures and required assessments to earn a verified certificate. Certificates include a unique verification ID and QR code. Share on LinkedIn, resume, or portfolio.',
      },
      {
        question: 'Can I retake quizzes and assignments?',
        answer: 'Yes! Most quizzes allow multiple attempts. Check the specific course settings for retry limits and waiting periods between attempts.',
      },
    ],
  },
  {
    category: 'Technical Issues',
    items: [
      {
        question: 'Video won\'t play - what should I do?',
        answer: 'Try: 1) Refresh the page, 2) Clear browser cache, 3) Try a different browser, 4) Check internet connection, 5) Disable browser extensions. If issues persist, contact support.',
      },
      {
        question: 'How do I reset my password?',
        answer: 'Click "Forgot Password" on the login page, enter your email, and follow the reset link sent to your inbox. Link expires in 1 hour.',
      },
      {
        question: 'My progress isn\'t saving!',
        answer: 'Ensure you\'re logged in and have a stable connection. Progress auto-saves every 30 seconds. If issues persist, try logging out and back in.',
      },
      {
        question: 'The mobile app isn\'t syncing.',
        answer: 'Pull to refresh on the dashboard. Ensure you\'re on the latest app version. Log out and back in if needed. Contact support with device details if unresolved.',
      },
    ],
  },
  {
    category: 'Account & Privacy',
    items: [
      {
        question: 'How do I delete my account?',
        answer: 'Go to Settings > Account > Delete Account. This action is irreversible and will remove all your data, progress, and certificates within 30 days.',
      },
      {
        question: 'What data do you collect?',
        answer: 'We collect: account info (name, email), learning data (progress, quiz scores), payment info (processed by partners), and usage analytics. See our Privacy Policy for details.',
      },
      {
        question: 'Can I change my email address?',
        answer: 'Yes, go to Settings > Account > Email. You\'ll need to verify the new address before it becomes active.',
      },
      {
        question: 'Is my data shared with third parties?',
        answer: 'We only share data with: payment processors (for transactions), email service (for notifications), and analytics providers (anonymized). We never sell your data.',
      },
    ],
  },
];

export function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const filteredFAQs = faqs.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <Section size="lg" background="gradient" id="hero">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center space-y-6"
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary"
            >
              <Search className="h-4 w-4" />
              Frequently Asked Questions
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-display-xl font-display font-bold tracking-tight text-foreground text-balance"
            >
              Quick Answers to Common Questions
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-body-lg text-muted-foreground max-w-2xl mx-auto text-balance"
            >
              Can\'t find what you\'re looking for? Search below or{' '}
              <a href="/contact" className="text-primary hover:underline font-medium">
                contact our support team
              </a>
              .
            </motion.p>

            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="max-w-xl mx-auto"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-12 text-base"
                />
              </div>
            </motion.div>
          </motion.div>
        </Container>
      </Section>

      {/* FAQ Categories */}
      <Section size="lg" id="faqs">
        <Container>
          {searchQuery ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {filteredFAQs.flatMap(cat => cat.items).map((item, index) => (
                <Accordion key={item.question} type="single" collapsible className="w-full">
                  <AccordionItem value={item.question}>
                    <AccordionTrigger className="text-left py-4 text-lg">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {faqs.map((category, catIndex) => (
                <motion.div
                  key={category.category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: catIndex * 0.1 }}
                >
                  <div className="mb-4">
                    <h2 className="text-heading-md font-semibold text-foreground flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ChevronDown className="h-4 w-4 text-primary" />
                      </span>
                      {category.category}
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {category.items.map((item, itemIndex) => (
                      <Accordion key={item.question} type="single" collapsible className="w-full">
                        <AccordionItem value={item.question}>
                          <AccordionTrigger className="text-left py-3 text-body hover:bg-muted/50">
                            {item.question}
                          </AccordionTrigger>
                          <AccordionContent className="pt-2 pb-6 text-muted-foreground">
                            {item.answer}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Still need help? */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 text-center"
          >
            <h2 className="text-heading-md font-semibold mb-3">Still Need Help?</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Our support team is here to help. Response time is typically under 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="gap-2">
                <a href="/contact">
                  <MessageCircle className="h-4 w-4" />
                  Contact Support
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="mailto:support@nextera.io">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Us
                </a>
              </Button>
            </div>
          </motion.div>
        </Container>
      </Section>
    </div>
  );
}
