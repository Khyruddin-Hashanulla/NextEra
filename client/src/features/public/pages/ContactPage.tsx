import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Mail,
  MapPin,
  Phone,
  Send,
  Loader2,
  CheckCircle2,
  Twitter,
  Linkedin,
  Github,
  Youtube,
  CreditCard,
  BookOpen,
  Wrench,
} from 'lucide-react';
import { Section, Container } from '@/components/common/Section';
import { PageBackground } from '@/components/layout/PageBackground';
import { SEO } from '@/components/seo/SEO';
import { StructuredData } from '@/components/seo/StructuredData';
import { webPageSchema, breadcrumbListSchema } from '@/lib/schema';
import { cn } from '@/lib/utils';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(20, 'Message must be at least 20 characters'),
});

type FormData = z.infer<typeof schema>;

const contactInfo = [
  { icon: Mail, title: 'Email Us', value: 'hello@nextera.io', href: 'mailto:hello@nextera.io' },
  {
    icon: MapPin,
    title: 'Visit Us',
    value: '123 Learning Ave, San Francisco, CA 94102',
    href: 'https://maps.google.com',
  },
  { icon: Phone, title: 'Call Us', value: '+1 (555) 123-4567', href: 'tel:+15551234567' },
];

const socialLinks = [
  { label: 'Twitter', icon: Twitter },
  { label: 'LinkedIn', icon: Linkedin },
  { label: 'GitHub', icon: Github },
  { label: 'YouTube', icon: Youtube },
];

const quickLinks = [
  { title: 'Billing & Payments', href: '/faq#billing', icon: CreditCard },
  { title: 'Course Access', href: '/faq#access', icon: BookOpen },
  { title: 'Technical Issues', href: '/faq#technical', icon: Wrench },
];

export function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (_data: FormData) => {
    setIsSubmitting(true);
    try {
      // Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsSubmitted(true);
      reset();
      toast.success("Message sent successfully! We'll get back to you within 24 hours.");
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEO
        title="Contact Us"
        description="Get in touch with the NextEra team. We're here to help with any questions about our courses and platform."
        canonical="/contact"
      />
      <StructuredData
        schemas={[
          webPageSchema({ name: 'Contact Us', description: 'Get in touch with the NextEra team.', path: '/contact' }),
          breadcrumbListSchema([
            { name: 'Home', path: '/' },
            { name: 'Contact', path: '/contact' },
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
                  Contact Us
                </motion.span>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.6 }}
                  className="mt-6 text-display-xl font-display font-bold tracking-tight text-foreground text-balance"
                >
                  Get in Touch
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="mt-6 max-w-2xl text-body-lg text-muted-foreground text-balance"
                >
                  Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                </motion.p>
              </div>
            </div>
          </Container>
        </Section>

        {/* Contact info + form */}
        <Section size="sm" id="contact" className="pt-0 sm:pt-0 lg:pt-0">
          <Container>
            <div className="mx-auto max-w-5xl">
              <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-12">
                {/* Contact info */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-heading-md font-semibold text-foreground">Contact Information</h2>
                    <p className="mt-2 text-body text-muted-foreground">
                      We're here to help! Whether you have a question about our courses, need technical support, or want
                      to partner with us, don't hesitate to reach out.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {contactInfo.map((item) => (
                      <a
                        key={item.title}
                        href={item.href}
                        className="group flex items-start gap-4 rounded-2xl border border-border/60 bg-card/50 p-5 backdrop-blur-sm transition-all hover:border-primary/40 hover:shadow-md"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                          <item.icon className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground">{item.title}</h3>
                          <p className="mt-0.5 break-words text-sm text-muted-foreground">{item.value}</p>
                        </div>
                      </a>
                    ))}
                  </div>

                  <div className="border-t border-border/60 pt-6">
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Follow Us
                    </h3>
                    <div className="flex gap-3">
                      {socialLinks.map((platform) => (
                        <a
                          key={platform.label}
                          href="#"
                          aria-label={platform.label}
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-card/50 text-muted-foreground transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          <platform.icon className="h-4 w-4" aria-hidden="true" />
                        </a>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Contact form */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <AnimatePresence mode="wait">
                    {!isSubmitted ? (
                      <motion.form
                        key="form"
                        onSubmit={handleSubmit(onSubmit)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6 rounded-2xl border border-border/60 bg-card/50 p-6 shadow-sm backdrop-blur-sm sm:p-8"
                      >
                        <div>
                          <h2 className="text-heading-md font-semibold text-foreground">Send us a message</h2>
                          <p className="mt-1 text-sm text-muted-foreground">We'll get back to you within 24 hours.</p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                          <div>
                            <label htmlFor="name" className="label-base">
                              Full Name <span className="text-destructive" aria-hidden="true">*</span>
                            </label>
                            <Input
                              id="name"
                              {...register('name')}
                              placeholder="John Doe"
                              className={cn(errors.name && 'border-destructive focus-visible:ring-destructive')}
                              disabled={isSubmitting}
                              aria-invalid={errors.name ? 'true' : 'false'}
                            />
                            {errors.name && (
                              <p className="mt-1.5 text-sm text-destructive" role="alert">
                                {errors.name.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <label htmlFor="email" className="label-base">
                              Email Address <span className="text-destructive" aria-hidden="true">*</span>
                            </label>
                            <Input
                              id="email"
                              type="email"
                              {...register('email')}
                              placeholder="john@example.com"
                              className={cn(errors.email && 'border-destructive focus-visible:ring-destructive')}
                              disabled={isSubmitting}
                              aria-invalid={errors.email ? 'true' : 'false'}
                            />
                            {errors.email && (
                              <p className="mt-1.5 text-sm text-destructive" role="alert">
                                {errors.email.message}
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label htmlFor="subject" className="label-base">
                            Subject <span className="text-destructive" aria-hidden="true">*</span>
                          </label>
                          <Input
                            id="subject"
                            {...register('subject')}
                            placeholder="How can we help you?"
                            className={cn(errors.subject && 'border-destructive focus-visible:ring-destructive')}
                            disabled={isSubmitting}
                            aria-invalid={errors.subject ? 'true' : 'false'}
                          />
                          {errors.subject && (
                            <p className="mt-1.5 text-sm text-destructive" role="alert">
                              {errors.subject.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="message" className="label-base">
                            Message <span className="text-destructive" aria-hidden="true">*</span>
                          </label>
                          <Textarea
                            id="message"
                            {...register('message')}
                            placeholder="Tell us more about your inquiry..."
                            rows={5}
                            className={cn(errors.message && 'border-destructive focus-visible:ring-destructive')}
                            disabled={isSubmitting}
                            aria-invalid={errors.message ? 'true' : 'false'}
                          />
                          {errors.message && (
                            <p className="mt-1.5 text-sm text-destructive" role="alert">
                              {errors.message.message}
                            </p>
                          )}
                        </div>

                        <Button type="submit" size="lg" className="w-full gap-2 rounded-full" disabled={isSubmitting}>
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" aria-hidden="true" />
                              Send Message
                            </>
                          )}
                        </Button>
                      </motion.form>
                    ) : (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-2xl border border-border/60 bg-card/50 p-8 text-center shadow-sm backdrop-blur-sm md:p-12"
                      >
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                          <CheckCircle2 className="h-8 w-8 text-success" aria-hidden="true" />
                        </div>
                        <h2 className="mt-5 text-heading-md font-semibold text-foreground">Message Sent!</h2>
                        <p className="mx-auto mt-2 max-w-md text-body text-muted-foreground">
                          Thank you for reaching out. We've received your message and will get back to you within 24
                          hours.
                        </p>
                        <Button variant="outline" className="mt-8 rounded-full" onClick={() => setIsSubmitted(false)}>
                          Send Another Message
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            </div>
          </Container>
        </Section>

        {/* FAQ Quick Links */}
        <Section size="sm" id="faq-links" className="pt-0 sm:pt-0 lg:pt-0">
          <Container>
            <div className="mx-auto max-w-5xl">
              <div className="mb-8 text-center">
                <h2 className="text-heading-lg font-semibold text-foreground">Quick Answers</h2>
                <p className="mt-2 text-body text-muted-foreground">
                  Check out our FAQ for instant answers to common questions.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {quickLinks.map((item) => (
                  <Link
                    key={item.title}
                    to={item.href}
                    className="group rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm transition-all hover:border-primary/40 hover:shadow-md"
                  >
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <item.icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Find answers quickly</p>
                  </Link>
                ))}
              </div>
            </div>
          </Container>
        </Section>
      </div>
    </>
  );
}