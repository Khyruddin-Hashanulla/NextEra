import { motion } from 'framer-motion';
import { Section, Container } from '@/components/common/Section';
import { PageTransition } from '@/components/common/PageTransition';
import { SEO } from '@/components/seo/SEO';
import { StructuredData } from '@/components/seo/StructuredData';
import { webPageSchema, breadcrumbListSchema } from '@/lib/schema';

const sections: { title: string; content: string }[] = [
  {
    title: '1. Acceptance of Terms',
    content:
      'By accessing, browsing, or using the NextEra platform ("the Platform"), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms in their entirety, you must refrain from using the Platform. We reserve the right to modify these Terms at any time; material changes will be communicated via email or a conspicuous notice on the Platform, and your continued use after the effective date constitutes acceptance of the updated Terms.',
  },
  {
    title: '2. Eligibility',
    content:
      'You must be at least 13 years of age to create an account and use the Platform. If you are between 13 and 18 years of age, you represent that a parent or legal guardian has reviewed and consented to these Terms on your behalf. Users in the European Union or United Kingdom must be at least 16 years old unless a parent or guardian provides consent. You further represent that you have not been previously suspended or removed from the Platform and that you are not located in a country subject to a U.S. government embargo. You are solely responsible for ensuring compliance with all applicable laws regarding your use of the Platform.',
  },
  {
    title: '3. Account Registration',
    content:
      'When creating an account, you agree to provide accurate, current, and complete information and to promptly update such information as necessary. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized access or breach of security. We reserve the right to suspend or terminate accounts that violate these Terms or that we determine, in our sole discretion, pose a security or legal risk.',
  },
  {
    title: '4. Courses and Content',
    content:
      'Upon enrollment, we grant you a limited, non-exclusive, non-transferable, revocable license to access and view the course content for personal, non-commercial educational purposes only. You may not download, reproduce, distribute, modify, publicly perform, sublicense, or create derivative works from any course content without the express written permission of NextEra or the respective instructor. All course materials, including videos, assessments, code samples, and supplementary documents, are protected by copyright and other intellectual property laws. Violation of these restrictions may result in immediate termination of your access without refund.',
  },
  {
    title: '5. User-Generated Content',
    content:
      'You retain ownership of any content you submit to the Platform, including discussion posts, assignment submissions, reviews, and profile information. By submitting content, you grant NextEra a worldwide, royalty-free, perpetual, irrevocable, non-exclusive, transferable license to use, reproduce, modify, adapt, publish, translate, create derivative works from, and display such content in connection with the operation and promotion of the Platform. You represent that your content does not infringe any third-party intellectual property or privacy rights. We reserve the right to remove any user-generated content that violates these Terms or is otherwise objectionable.',
  },
  {
    title: '6. Payments and Refunds',
    content:
      'All prices are displayed in the currency selected at checkout and include applicable taxes unless otherwise noted. Payments are processed by third-party providers (e.g., Stripe, Razorpay), and we do not store full payment card details. We offer a 14-day refund policy for individual course purchases. Refund requests must be submitted within 14 days of purchase, and we reserve the right to deny refunds if more than 20% of the course content has been accessed. Refunds are issued to the original payment method within five to ten business days. Subscription fees, bundled offers, and promotional purchases may be subject to different refund terms as disclosed at the time of purchase.',
  },
  {
    title: '7. Subscriptions',
    content:
      "Subscription plans auto-renew at the end of each billing period (monthly or annually) unless cancelled before the renewal date. You may cancel your subscription at any time through your account settings; cancellation takes effect at the end of the current billing period, and no partial refunds are provided for unused portions. We reserve the right to modify subscription pricing upon 30 days' prior notice. Continued use after a price change constitutes acceptance of the new pricing. Promotional or discounted introductory rates apply only to the initial billing period.",
  },
  {
    title: '8. Certificates',
    content:
      'Course completion certificates are awarded upon fulfilling all course requirements, including passing assessments and achieving a minimum score as specified by the instructor. Certificates include a unique verification identifier and QR code for third-party validation. Certificates do not confer academic credit, professional licensure, or certification from any accredited institution unless expressly stated. We reserve the right to revoke any certificate obtained through fraudulent means, including plagiarism, impersonation, or violation of academic integrity policies.',
  },
  {
    title: '9. Prohibited Conduct',
    content:
      "You agree not to engage in any conduct that violates applicable laws or regulations, infringes upon the rights of others, or disrupts the Platform's operations. Prohibited conduct includes, but is not limited to: harassment, intimidation, or discrimination against any user or instructor; plagiarism or unauthorized distribution of course materials; uploading viruses, malware, or other harmful code; attempting to circumvent security measures or access restricted areas; using bots, scrapers, or automated tools without our prior written consent; impersonating another individual or entity; and engaging in any commercial activity on the Platform without authorization.",
  },
  {
    title: '10. Intellectual Property',
    content:
      'The NextEra name, logo, design, interface, and all trademarks, service marks, and trade names displayed on the Platform are the exclusive property of NextEra or their respective owners. The Platform, including its underlying technology, software, algorithms, and infrastructure, is protected by copyright, trademark, patent, and trade secret laws. You may not copy, modify, reverse engineer, decompile, disassemble, or attempt to derive the source code of the Platform. Any unauthorized use of our intellectual property may result in legal action and immediate termination of your account.',
  },
  {
    title: '11. Disclaimers',
    content:
      'The Platform and all content, features, and functionality are provided on an "as is" and "as available" basis without warranties of any kind, either express or implied. To the fullest extent permitted by law, NextEra disclaims all warranties, including merchantability, fitness for a particular purpose, title, and non-infringement. We do not warrant that the Platform will be uninterrupted, error-free, secure, or free of viruses or other harmful components. Any course content is provided for informational and educational purposes only and does not constitute professional advice. Your use of the Platform is at your sole risk.',
  },
  {
    title: '12. Limitation of Liability',
    content:
      'To the maximum extent permitted by applicable law, NextEra, its affiliates, officers, directors, employees, agents, and instructors shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, goodwill, or other intangible losses, arising out of or in connection with your access to or use of the Platform. Our aggregate liability to you for any claims arising from these Terms shall not exceed the total amount paid by you to NextEra during the twelve-month period preceding the event giving rise to the liability. This limitation of liability applies regardless of the theory of liability, whether in contract, tort, or otherwise.',
  },
  {
    title: '13. Indemnification',
    content:
      "You agree to indemnify, defend, and hold harmless NextEra, its affiliates, and their respective officers, directors, employees, and agents from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or related to: (a) your use of the Platform; (b) your violation of these Terms; (c) your violation of any third-party right, including intellectual property or privacy rights; or (d) any content you submit to the Platform. We reserve the right to assume the exclusive defense and control of any matter subject to indemnification at your expense.",
  },
  {
    title: '14. Termination',
    content:
      'We may, at our sole discretion, suspend or terminate your account and access to the Platform at any time without prior notice or liability for any reason, including if we believe you have violated these Terms. Upon termination, your right to access the Platform and any course content immediately ceases. No refunds will be issued for prepaid fees in the event of termination for cause. Sections of these Terms that by their nature should survive termination, including but not limited to intellectual property provisions, disclaimers, limitation of liability, and indemnification, shall survive such termination.',
  },
  {
    title: '15. Governing Law and Disputes',
    content:
      "These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of laws principles. Any dispute, claim, or controversy arising out of or relating to these Terms or your use of the Platform shall be resolved exclusively through binding arbitration administered by the American Arbitration Association under its Commercial Arbitration Rules in San Francisco, California. You waive any right to participate in a class-action lawsuit or class-wide arbitration. The prevailing party in any dispute shall be entitled to recover reasonable attorneys' fees and costs.",
  },
  {
    title: '16. General Provisions',
    content:
      'These Terms, together with our Privacy Policy, constitute the entire agreement between you and NextEra regarding your use of the Platform. If any provision of these Terms is held to be invalid or unenforceable, the remaining provisions shall continue in full force and effect. Our failure to enforce any right or provision of these Terms shall not be deemed a waiver of such right or provision. You may not assign or transfer these Terms, in whole or in part, without our prior written consent. We may assign these Terms freely. No joint venture, partnership, employment, or agency relationship exists between you and NextEra as a result of these Terms.',
  },
  {
    title: '17. Contact Us',
    content:
      'If you have any questions, concerns, or complaints regarding these Terms, please contact our Legal Department at legal@nextera.com. You may also send correspondence by mail to: NextEra, 123 Learning Avenue, San Francisco, CA 94102, Attention: Legal Department. We will respond to all inquiries within a reasonable timeframe. For users in the European Union, you may also contact our EU representative at eu-legal@nextera.com.',
  },
];

export function TermsPage() {
  return (
    <PageTransition>
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
      <div className="min-h-screen">
        <section className="bg-gradient-to-br from-primary/10 via-background to-background py-16 sm:py-24 lg:py-32">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto text-center"
            >
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground">Terms of Service</h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Please read these terms carefully before using our platform.
              </p>
            </motion.div>
          </div>
        </section>

        <Section>
          <Container size="xl">
            <div className="max-w-4xl mx-auto">
              <div className="bg-background rounded-2xl border border-border shadow-sm p-8 sm:p-10">
                <div className="space-y-2">
                  {sections.map((section, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <h2 className="text-xl font-semibold text-foreground mb-3">{section.title}</h2>
                      <p className="text-muted-foreground leading-relaxed mb-6">{section.content}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </Container>
        </Section>
      </div>
    </PageTransition>
  );
}
