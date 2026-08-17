import { motion } from 'framer-motion';
import { ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { Section, Container } from '@/components/common/Section';
import { PageBackground } from '@/components/layout/PageBackground';
import { SEO } from '@/components/seo/SEO';
import { StructuredData } from '@/components/seo/StructuredData';
import { webPageSchema, breadcrumbListSchema } from '@/lib/schema';

interface TermsSection {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  closing?: string[];
}

const sections: TermsSection[] = [
  {
    id: 'acceptance-of-terms',
    title: 'Acceptance of Terms',
    paragraphs: [
      'By accessing, browsing, or using the NextEra platform ("the Platform"), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms in their entirety, you must refrain from using the Platform. We reserve the right to modify these Terms at any time; material changes will be communicated via email or a conspicuous notice on the Platform, and your continued use after the effective date constitutes acceptance of the updated Terms.',
    ],
  },
  {
    id: 'eligibility',
    title: 'Eligibility',
    paragraphs: [
      'You must be at least 13 years of age to create an account and use the Platform. If you are between 13 and 18 years of age, you represent that a parent or legal guardian has reviewed and consented to these Terms on your behalf. Users in the European Union or United Kingdom must be at least 16 years old unless a parent or guardian provides consent. You further represent that you have not been previously suspended or removed from the Platform and that you are not located in a country subject to a U.S. government embargo. You are solely responsible for ensuring compliance with all applicable laws regarding your use of the Platform.',
    ],
  },
  {
    id: 'account-registration',
    title: 'Account Registration',
    paragraphs: [
      'When creating an account, you agree to provide accurate, current, and complete information and to promptly update such information as necessary. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized access or breach of security. We reserve the right to suspend or terminate accounts that violate these Terms or that we determine, in our sole discretion, pose a security or legal risk.',
    ],
  },
  {
    id: 'courses-and-content',
    title: 'Courses and Content',
    paragraphs: [
      'Upon enrollment, we grant you a limited, non-exclusive, non-transferable, revocable license to access and view the course content for personal, non-commercial educational purposes only. You may not download, reproduce, distribute, modify, publicly perform, sublicense, or create derivative works from any course content without the express written permission of NextEra or the respective instructor. All course materials, including videos, assessments, code samples, and supplementary documents, are protected by copyright and other intellectual property laws. Violation of these restrictions may result in immediate termination of your access without refund.',
    ],
  },
  {
    id: 'user-generated-content',
    title: 'User-Generated Content',
    paragraphs: [
      'You retain ownership of any content you submit to the Platform, including discussion posts, assignment submissions, reviews, and profile information. By submitting content, you grant NextEra a worldwide, royalty-free, perpetual, irrevocable, non-exclusive, transferable license to use, reproduce, modify, adapt, publish, translate, create derivative works from, and display such content in connection with the operation and promotion of the Platform. You represent that your content does not infringe any third-party intellectual property or privacy rights. We reserve the right to remove any user-generated content that violates these Terms or is otherwise objectionable.',
    ],
  },
  {
    id: 'payments-and-refunds',
    title: 'Payments and Refunds',
    paragraphs: [
      'All prices are displayed in the currency selected at checkout and include applicable taxes unless otherwise noted. Payments are processed by third-party providers (e.g., Stripe, Razorpay), and we do not store full payment card details. We offer a 14-day refund policy for individual course purchases. Refund requests must be submitted within 14 days of purchase, and we reserve the right to deny refunds if more than 20% of the course content has been accessed. Refunds are issued to the original payment method within five to ten business days. Subscription fees, bundled offers, and promotional purchases may be subject to different refund terms as disclosed at the time of purchase.',
    ],
  },
  {
    id: 'subscriptions',
    title: 'Subscriptions',
    paragraphs: [
      "Subscription plans auto-renew at the end of each billing period (monthly or annually) unless cancelled before the renewal date. You may cancel your subscription at any time through your account settings; cancellation takes effect at the end of the current billing period, and no partial refunds are provided for unused portions. We reserve the right to modify subscription pricing upon 30 days' prior notice. Continued use after a price change constitutes acceptance of the new pricing. Promotional or discounted introductory rates apply only to the initial billing period.",
    ],
  },
  {
    id: 'certificates',
    title: 'Certificates',
    paragraphs: [
      'Course completion certificates are awarded upon fulfilling all course requirements, including passing assessments and achieving a minimum score as specified by the instructor. Certificates include a unique verification identifier and QR code for third-party validation. Certificates do not confer academic credit, professional licensure, or certification from any accredited institution unless expressly stated. We reserve the right to revoke any certificate obtained through fraudulent means, including plagiarism, impersonation, or violation of academic integrity policies.',
    ],
  },
  {
    id: 'prohibited-conduct',
    title: 'Prohibited Conduct',
    paragraphs: [
      "You agree not to engage in any conduct that violates applicable laws or regulations, infringes upon the rights of others, or disrupts the Platform's operations. Prohibited conduct includes, but is not limited to:",
    ],
    bullets: [
      'Harassment, intimidation, or discrimination against any user or instructor',
      'Plagiarism or unauthorized distribution of course materials',
      'Uploading viruses, malware, or other harmful code',
      'Attempting to circumvent security measures or access restricted areas',
      'Using bots, scrapers, or automated tools without our prior written consent',
      'Impersonating another individual or entity',
      'Engaging in any commercial activity on the Platform without authorization',
    ],
  },
  {
    id: 'intellectual-property',
    title: 'Intellectual Property',
    paragraphs: [
      'The NextEra name, logo, design, interface, and all trademarks, service marks, and trade names displayed on the Platform are the exclusive property of NextEra or their respective owners. The Platform, including its underlying technology, software, algorithms, and infrastructure, is protected by copyright, trademark, patent, and trade secret laws. You may not copy, modify, reverse engineer, decompile, disassemble, or attempt to derive the source code of the Platform. Any unauthorized use of our intellectual property may result in legal action and immediate termination of your account.',
    ],
  },
  {
    id: 'disclaimers',
    title: 'Disclaimers',
    paragraphs: [
      'The Platform and all content, features, and functionality are provided on an "as is" and "as available" basis without warranties of any kind, either express or implied. To the fullest extent permitted by law, NextEra disclaims all warranties, including merchantability, fitness for a particular purpose, title, and non-infringement. We do not warrant that the Platform will be uninterrupted, error-free, secure, or free of viruses or other harmful components. Any course content is provided for informational and educational purposes only and does not constitute professional advice. Your use of the Platform is at your sole risk.',
    ],
  },
  {
    id: 'limitation-of-liability',
    title: 'Limitation of Liability',
    paragraphs: [
      'To the maximum extent permitted by applicable law, NextEra, its affiliates, officers, directors, employees, agents, and instructors shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, goodwill, or other intangible losses, arising out of or in connection with your access to or use of the Platform. Our aggregate liability to you for any claims arising from these Terms shall not exceed the total amount paid by you to NextEra during the twelve-month period preceding the event giving rise to the liability. This limitation of liability applies regardless of the theory of liability, whether in contract, tort, or otherwise.',
    ],
  },
  {
    id: 'indemnification',
    title: 'Indemnification',
    paragraphs: [
      "You agree to indemnify, defend, and hold harmless NextEra, its affiliates, and their respective officers, directors, employees, and agents from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or related to:",
    ],
    bullets: [
      'Your use of the Platform',
      'Your violation of these Terms',
      'Your violation of any third-party right, including intellectual property or privacy rights',
      'Any content you submit to the Platform',
    ],
    closing: [
      'We reserve the right to assume the exclusive defense and control of any matter subject to indemnification at your expense.',
    ],
  },
  {
    id: 'termination',
    title: 'Termination',
    paragraphs: [
      'We may, at our sole discretion, suspend or terminate your account and access to the Platform at any time without prior notice or liability for any reason, including if we believe you have violated these Terms. Upon termination, your right to access the Platform and any course content immediately ceases. No refunds will be issued for prepaid fees in the event of termination for cause. Sections of these Terms that by their nature should survive termination, including but not limited to intellectual property provisions, disclaimers, limitation of liability, and indemnification, shall survive such termination.',
    ],
  },
  {
    id: 'governing-law-and-disputes',
    title: 'Governing Law and Disputes',
    paragraphs: [
      "These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of laws principles. Any dispute, claim, or controversy arising out of or relating to these Terms or your use of the Platform shall be resolved exclusively through binding arbitration administered by the American Arbitration Association under its Commercial Arbitration Rules in San Francisco, California. You waive any right to participate in a class-action lawsuit or class-wide arbitration. The prevailing party in any dispute shall be entitled to recover reasonable attorneys' fees and costs.",
    ],
  },
  {
    id: 'general-provisions',
    title: 'General Provisions',
    paragraphs: [
      'These Terms, together with our Privacy Policy, constitute the entire agreement between you and NextEra regarding your use of the Platform. If any provision of these Terms is held to be invalid or unenforceable, the remaining provisions shall continue in full force and effect. Our failure to enforce any right or provision of these Terms shall not be deemed a waiver of such right or provision. You may not assign or transfer these Terms, in whole or in part, without our prior written consent. We may assign these Terms freely. No joint venture, partnership, employment, or agency relationship exists between you and NextEra as a result of these Terms.',
    ],
  },
  {
    id: 'contact-us',
    title: 'Contact Us',
    paragraphs: [
      'If you have any questions, concerns, or complaints regarding these Terms, please contact our Legal Department at legal@nextera.com. You may also send correspondence by mail to: NextEra, 123 Learning Avenue, San Francisco, CA 94102, Attention: Legal Department. We will respond to all inquiries within a reasonable timeframe. For users in the European Union, you may also contact our EU representative at eu-legal@nextera.com.',
    ],
  },
];

const tableOfContents = sections.map(({ id, title }) => ({ id, title }));

const EMAIL_PATTERN = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

function renderParagraph(text: string) {
  const parts = text.split(/([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i);
  return parts.map((part, index) =>
    EMAIL_PATTERN.test(part.trim()) ? (
      <a key={index} href={`mailto:${part.trim()}`} className="font-medium text-primary hover:underline">
        {part}
      </a>
    ) : (
      <span key={index}>{part}</span>
    )
  );
}

function TocList({ items }: { items: { id: string; title: string }[] }) {
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item.id}>
          <a
            href={`#${item.id}`}
            onClick={(event) => {
              const details = event.currentTarget.closest('details');
              if (details) details.open = false;
            }}
            className="group flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {item.title}
            <ChevronRight
              className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
              aria-hidden="true"
            />
          </a>
        </li>
      ))}
    </ul>
  );
}

export function TermsPage() {
  return (
    <>
      <SEO
        title="Terms of Service"
        description="Read the terms and conditions for using the NextEra learning platform."
        canonical="/terms"
        robots="index,follow"
      />
      <StructuredData
        schemas={[
          webPageSchema({
            name: 'Terms of Service',
            description: 'Read the terms and conditions for using the NextEra learning platform.',
            path: '/terms',
          }),
          breadcrumbListSchema([
            { name: 'Home', path: '/' },
            { name: 'Terms of Service', path: '/terms' },
          ]),
        ]}
      />
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
                  <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                  Terms of Service
                </motion.span>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.6 }}
                  className="mt-6 text-display-xl font-display font-bold tracking-tight text-foreground text-balance"
                >
                  Terms of Service
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="mt-6 max-w-2xl text-body-lg text-muted-foreground text-balance"
                >
                  Please read these terms carefully before using our platform.
                </motion.p>
              </div>
            </div>
          </Container>
        </Section>

        {/* Content */}
        <Section size="sm" id="content" className="pt-0 sm:pt-0 lg:pt-0">
          <Container>
            <div className="mx-auto max-w-5xl lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-12">
              {/* Mobile TOC */}
              <details className="group mb-10 rounded-2xl border border-border/60 bg-card/40 [&::-webkit-details-marker]:hidden lg:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <span>On this page</span>
                  <ChevronDown
                    className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <nav aria-label="Terms of service sections" className="border-t border-border/40 px-2 py-3">
                  <TocList items={tableOfContents} />
                </nav>
              </details>

              {/* Desktop TOC */}
              <aside className="hidden lg:block" aria-label="Terms of service table of contents">
                <div className="sticky top-24">
                  <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    On this page
                  </p>
                  <nav aria-label="Terms of service sections">
                    <TocList items={tableOfContents} />
                  </nav>
                </div>
              </aside>

              {/* Content */}
              <article className="max-w-2xl">
                <div className="space-y-12">
                  {sections.map((section, index) => (
                    <section
                      key={section.id}
                      id={section.id}
                      aria-labelledby={`${section.id}-heading`}
                      className="scroll-mt-28"
                    >
                      <div className="mb-5 flex items-baseline gap-3 border-b border-border/40 pb-4">
                        <span className="text-sm font-semibold tabular-nums text-primary">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <h2 id={`${section.id}-heading`} className="text-heading-md font-semibold text-foreground">
                          {section.title}
                        </h2>
                      </div>

                      <div className="space-y-4">
                        {section.paragraphs.map((paragraph) => (
                          <p key={paragraph} className="text-body leading-relaxed text-muted-foreground">
                            {renderParagraph(paragraph)}
                          </p>
                        ))}

                        {section.bullets && (
                          <ul className="space-y-3 pl-1">
                            {section.bullets.map((bullet) => (
                              <li
                                key={bullet}
                                className="relative pl-5 text-body leading-relaxed text-muted-foreground"
                              >
                                <span
                                  className="absolute left-0 top-[0.62em] h-1.5 w-1.5 rounded-full bg-primary/60"
                                  aria-hidden="true"
                                />
                                {renderParagraph(bullet)}
                              </li>
                            ))}
                          </ul>
                        )}

                        {section.closing?.map((paragraph) => (
                          <p key={paragraph} className="text-body leading-relaxed text-muted-foreground">
                            {renderParagraph(paragraph)}
                          </p>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </article>
            </div>
          </Container>
        </Section>
      </div>
    </>
  );
}