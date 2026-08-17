import { motion } from 'framer-motion';
import { CalendarDays, ChevronDown, ChevronRight, ShieldCheck } from 'lucide-react';
import { Section, Container } from '@/components/common/Section';
import { PageBackground } from '@/components/layout/PageBackground';
import { SEO } from '@/components/seo/SEO';
import { StructuredData } from '@/components/seo/StructuredData';
import { webPageSchema, breadcrumbListSchema } from '@/lib/schema';

interface PrivacySection {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

const sections: PrivacySection[] = [
  {
    id: 'introduction',
    title: 'Introduction',
    paragraphs: [
      'This Privacy Policy describes how NextEra ("we," "our," or "us") collects, uses, discloses, and safeguards your personal information when you access our website, mobile application, and related services (collectively, the "Platform"). By creating an account, enrolling in a course, or otherwise using the Platform, you acknowledge that you have read and understood this policy. If you do not agree with any part of this policy, you must discontinue use of the Platform immediately. This policy applies to all users, including visitors, students, instructors, and contributors.',
    ],
  },
  {
    id: 'information-we-collect',
    title: 'Information We Collect',
    paragraphs: [
      'We collect information you provide directly to us, including your full name, email address, billing address, and payment card details (processed by our PCI-compliant payment partners). We also automatically collect certain information when you interact with the Platform, including:',
    ],
    bullets: [
      'Cookies, log data, usage patterns, pages visited, device identifiers, browser type, operating system, IP address, and approximate geolocation',
      'Course progress, quiz responses, discussion forum posts, and support communications to facilitate your learning experience',
    ],
  },
  {
    id: 'how-we-use-your-information',
    title: 'How We Use Your Information',
    paragraphs: ['Your information is used to deliver and improve the Platform. In particular, we use your information to:'],
    bullets: [
      'Deliver and improve the Platform and process transactions',
      'Authenticate your identity',
      'Communicate with you regarding account updates and promotional offers (subject to your preferences)',
      'Personalize course recommendations',
      'Analyze usage trends to enhance our content offerings',
      'Detect and prevent fraudulent or unauthorized activity',
      'Comply with applicable legal obligations',
    ],
  },
  {
    id: 'information-sharing',
    title: 'Information Sharing',
    paragraphs: [
      'We do not sell your personal information to third parties. We may share your data with trusted service providers who perform functions on our behalf, including payment processors, cloud hosting providers, email delivery services, and analytics platforms. We may also disclose information:',
    ],
    bullets: [
      'When required by law, court order, or government regulation',
      'In connection with a merger, acquisition, or sale of all or a portion of our assets',
      'To instructors, who receive limited information about enrolled students solely for the purpose of course delivery and assessment',
    ],
  },
  {
    id: 'cookies-and-tracking',
    title: 'Cookies and Tracking Technologies',
    paragraphs: [
      'We use cookies, web beacons, pixel tags, and similar tracking technologies to enhance your browsing experience, remember your preferences, analyze platform performance, and deliver targeted advertising (where permitted by law). These include:',
    ],
    bullets: [
      'Essential cookies, which are necessary for authentication and security',
      'Analytics cookies, which help us understand user behavior',
    ],
  },
  {
    id: 'data-security',
    title: 'Data Security',
    paragraphs: [
      'We implement industry-standard administrative, technical, and physical safeguards to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These include:',
    ],
    bullets: [
      'Encryption in transit (TLS 1.3) and at rest (AES-256)',
      'Role-based access controls',
      'Regular security audits and penetration testing',
      'Employee confidentiality agreements',
      'Incident response protocols',
    ],
  },
  {
    id: 'your-rights',
    title: 'Your Rights',
    paragraphs: ['Depending on your jurisdiction, you may have the right to:'],
    bullets: [
      'Access, correct, or delete your personal data',
      'Restrict or object to certain processing activities',
      'Request data portability in a machine-readable format',
      'Withdraw consent at any time without affecting the lawfulness of prior processing',
      'Lodge a complaint with a data protection authority',
    ],
  },
  {
    id: 'data-retention',
    title: 'Data Retention',
    paragraphs: [
      'We retain your personal information for as long as your account remains active or as necessary to provide you with the Platform. Following account closure, we will delete or anonymize your data within 90 days, except where retention is required for legal compliance (e.g., transaction records retained for seven years), dispute resolution, or enforcement of our Terms of Service. Aggregated, anonymized data that does not identify you may be retained indefinitely for analytical purposes.',
    ],
  },
  {
    id: 'childrens-privacy',
    title: "Children's Privacy",
    paragraphs: [
      'The Platform is not directed toward individuals under the age of 13. We do not knowingly collect personal information from children. If we become aware that a child under 13 has provided us with personal data, we will take immediate steps to delete such information and terminate the associated account. Parents or guardians who believe their child has submitted personal information should contact us so that we can facilitate the removal.',
    ],
  },
  {
    id: 'international-transfers',
    title: 'International Transfers',
    paragraphs: [
      'Your information may be transferred to and processed in jurisdictions outside your country of residence, including the United States. When transferring data from the European Economic Area, the United Kingdom, or Switzerland, we rely on Standard Contractual Clauses approved by the European Commission or other recognized adequacy mechanisms to ensure an equivalent level of protection. By using the Platform, you consent to such cross-border transfers subject to the safeguards described herein.',
    ],
  },
  {
    id: 'changes-to-this-policy',
    title: 'Changes to This Policy',
    paragraphs: [
      'We reserve the right to update or modify this Privacy Policy at any time. Material changes will be communicated via a prominent notice on the Platform, email notification to the address associated with your account, or both. The "Last updated" date at the top of this page reflects the most recent revision. Your continued use of the Platform after the effective date of any modification constitutes your acceptance of the revised policy.',
    ],
  },
  {
    id: 'contact-us',
    title: 'Contact Us',
    paragraphs: [
      'If you have questions, concerns, or requests regarding this Privacy Policy or our data handling practices, please contact our Privacy Team at privacy@nextera.com. You may also write to us at: NextEra, 123 Learning Avenue, San Francisco, CA 94102, Attention: Privacy Officer. Data subjects in the European Union may contact our EU representative at eu-rep@nextera.com.',
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

export function PrivacyPage() {
  return (
    <>
      <SEO
        title="Privacy Policy"
        description="Read NextEra's privacy policy to understand how we collect, use, and protect your personal information."
        canonical="/privacy"
        robots="index,follow"
      />
      <StructuredData
        schemas={[
          webPageSchema({
            name: 'Privacy Policy',
            description:
              "Read NextEra's privacy policy to understand how we collect, use, and protect your personal information.",
            path: '/privacy',
          }),
          breadcrumbListSchema([
            { name: 'Home', path: '/' },
            { name: 'Privacy Policy', path: '/privacy' },
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
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Privacy Policy
                </motion.span>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.6 }}
                  className="mt-6 text-display-xl font-display font-bold tracking-tight text-foreground text-balance"
                >
                  Privacy Policy
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="mt-6 max-w-2xl text-body-lg text-muted-foreground text-balance"
                >
                  At NextEra, we take your privacy seriously. This policy outlines how we collect, use, and protect your
                  personal information when you use our learning platform.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="mt-8"
                >
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-4 py-1.5 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
                    Last updated: January 2024
                  </span>
                </motion.div>
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
                <nav aria-label="Privacy policy sections" className="border-t border-border/40 px-2 py-3">
                  <TocList items={tableOfContents} />
                </nav>
              </details>

              {/* Desktop TOC */}
              <aside className="hidden lg:block" aria-label="Privacy policy table of contents">
                <div className="sticky top-24">
                  <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    On this page
                  </p>
                  <nav aria-label="Privacy policy sections">
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