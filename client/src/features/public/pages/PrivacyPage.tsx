import { motion } from 'framer-motion';
import { Section, Container } from '@/components/common/Section';
import { PageTransition } from '@/components/common/PageTransition';

const sections: { title: string; content: string }[] = [
  {
    title: '1. Introduction',
    content:
      'This Privacy Policy describes how NextEra ("we," "our," or "us") collects, uses, discloses, and safeguards your personal information when you access our website, mobile application, and related services (collectively, the "Platform"). By creating an account, enrolling in a course, or otherwise using the Platform, you acknowledge that you have read and understood this policy. If you do not agree with any part of this policy, you must discontinue use of the Platform immediately. This policy applies to all users, including visitors, students, instructors, and contributors.',
  },
  {
    title: '2. Information We Collect',
    content:
      'We collect information you provide directly to us, including your full name, email address, billing address, and payment card details (processed by our PCI-compliant payment partners). We also automatically collect certain information when you interact with the Platform, such as cookies, log data, usage patterns, pages visited, device identifiers, browser type, operating system, IP address, and approximate geolocation. Course progress, quiz responses, discussion forum posts, and support communications are also recorded to facilitate your learning experience.',
  },
  {
    title: '3. How We Use Your Information',
    content:
      'Your information is used to deliver and improve the Platform, process transactions, authenticate your identity, communicate with you regarding account updates and promotional offers (subject to your preferences), personalize course recommendations, analyze usage trends to enhance our content offerings, detect and prevent fraudulent or unauthorized activity, and comply with applicable legal obligations. We do not use your personal data for automated decision-making that produces legal effects without your explicit consent.',
  },
  {
    title: '4. Information Sharing',
    content:
      'We do not sell your personal information to third parties. We may share your data with trusted service providers who perform functions on our behalf, including payment processors, cloud hosting providers, email delivery services, and analytics platforms. We may also disclose information when required by law, court order, or government regulation, or in connection with a merger, acquisition, or sale of all or a portion of our assets. Instructors receive limited information about enrolled students solely for the purpose of course delivery and assessment.',
  },
  {
    title: '5. Cookies and Tracking Technologies',
    content:
      'We use cookies, web beacons, pixel tags, and similar tracking technologies to enhance your browsing experience, remember your preferences, analyze platform performance, and deliver targeted advertising (where permitted by law). Essential cookies are necessary for authentication and security. Analytics cookies help us understand user behavior. You may manage your cookie preferences through your browser settings or our cookie consent manager. Disabling certain cookies may impair Platform functionality.',
  },
  {
    title: '6. Data Security',
    content:
      'We implement industry-standard administrative, technical, and physical safeguards to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These include encryption in transit (TLS 1.3) and at rest (AES-256), role-based access controls, regular security audits and penetration testing, employee confidentiality agreements, and incident response protocols. Despite these measures, no method of electronic storage or transmission is completely secure, and we cannot guarantee absolute protection.',
  },
  {
    title: '7. Your Rights',
    content:
      'Depending on your jurisdiction, you may have the right to access, correct, or delete your personal data; restrict or object to certain processing activities; request data portability in a machine-readable format; withdraw consent at any time without affecting the lawfulness of prior processing; and lodge a complaint with a data protection authority. To exercise these rights, submit a request via your account settings or contact us at privacy@nextera.com. We will respond within 30 days of verification of your identity.',
  },
  {
    title: '8. Data Retention',
    content:
      'We retain your personal information for as long as your account remains active or as necessary to provide you with the Platform. Following account closure, we will delete or anonymize your data within 90 days, except where retention is required for legal compliance (e.g., transaction records retained for seven years), dispute resolution, or enforcement of our Terms of Service. Aggregated, anonymized data that does not identify you may be retained indefinitely for analytical purposes.',
  },
  {
    title: "9. Children's Privacy",
    content:
      'The Platform is not directed toward individuals under the age of 13. We do not knowingly collect personal information from children. If we become aware that a child under 13 has provided us with personal data, we will take immediate steps to delete such information and terminate the associated account. Parents or guardians who believe their child has submitted personal information should contact us at privacy@nextera.com so that we can facilitate the removal.',
  },
  {
    title: '10. International Transfers',
    content:
      'Your information may be transferred to and processed in jurisdictions outside your country of residence, including the United States. When transferring data from the European Economic Area, the United Kingdom, or Switzerland, we rely on Standard Contractual Clauses approved by the European Commission or other recognized adequacy mechanisms to ensure an equivalent level of protection. By using the Platform, you consent to such cross-border transfers subject to the safeguards described herein.',
  },
  {
    title: '11. Changes to This Policy',
    content:
      'We reserve the right to update or modify this Privacy Policy at any time. Material changes will be communicated via a prominent notice on the Platform, email notification to the address associated with your account, or both. The "Last updated" date at the top of this page reflects the most recent revision. Your continued use of the Platform after the effective date of any modification constitutes your acceptance of the revised policy.',
  },
  {
    title: '12. Contact Us',
    content:
      'If you have questions, concerns, or requests regarding this Privacy Policy or our data handling practices, please contact our Privacy Team at privacy@nextera.com. You may also write to us at: NextEra, 123 Learning Avenue, San Francisco, CA 94102, Attention: Privacy Officer. Data subjects in the European Union may contact our EU representative at eu-rep@nextera.com.',
  },
];

export function PrivacyPage() {
  return (
    <PageTransition>
      <div className="min-h-screen">
        <section className="bg-gradient-to-br from-primary/10 via-background to-background py-16 sm:py-24 lg:py-32">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto text-center"
            >
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
                Privacy Policy
              </h1>
              <p className="mt-4 text-muted-foreground">
                Last updated: January 2024
              </p>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                At NextEra, we take your privacy seriously. This policy outlines
                how we collect, use, and protect your personal information when
                you use our learning platform. We are committed to transparency
                and safeguarding the data you entrust to us.
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
                      <h2 className="text-xl font-semibold text-foreground mb-3">
                        {section.title}
                      </h2>
                      <p className="text-muted-foreground leading-relaxed mb-6">
                        {section.content}
                      </p>
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
