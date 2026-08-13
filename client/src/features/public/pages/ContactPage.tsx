import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, MapPin, Phone, MessageCircle, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { Section, Container } from '@/components/common/Section';
import { SEO } from '@/components/seo/SEO';
import { StructuredData } from '@/components/seo/StructuredData';
import { webPageSchema, breadcrumbListSchema } from '@/lib/schema';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(20, 'Message must be at least 20 characters'),
});

type FormData = z.infer<typeof schema>;

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
      <div className="min-h-screen">
        <Section size="sm" background="gradient">
          <Container>
            <div className="max-w-3xl mx-auto text-center">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-heading-lg font-semibold text-foreground"
              >
                Get in Touch
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-3 text-body-lg text-muted-foreground"
              >
                Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
              </motion.p>
            </div>
          </Container>
        </Section>

        <Section size="lg">
          <Container>
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Contact Info */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-1 space-y-6"
              >
                <h2 className="text-heading-md font-semibold">Contact Information</h2>
                <p className="text-muted-foreground">
                  We're here to help! Whether you have a question about our courses, need technical support, or want to
                  partner with us, don't hesitate to reach out.
                </p>

                <div className="space-y-4">
                  {contactInfo.map((item) => (
                    <a
                      key={item.title}
                      href={item.href}
                      className="group flex items-start gap-4 p-4 rounded-xl bg-card border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.value}</p>
                      </div>
                    </a>
                  ))}
                </div>

                <div className="pt-6 border-t">
                  <h3 className="font-medium mb-3">Follow Us</h3>
                  <div className="flex gap-4">
                    {['Twitter', 'LinkedIn', 'GitHub', 'YouTube'].map((platform) => (
                      <a
                        key={platform}
                        href="#"
                        className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                        aria-label={platform}
                      >
                        <MessageCircle className="h-5 w-5" />
                      </a>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Contact Form */}
              <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2">
                <AnimatePresence mode="wait">
                  {!isSubmitted ? (
                    <motion.form
                      key="form"
                      onSubmit={handleSubmit(onSubmit)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-card border rounded-2xl p-6 md:p-8 space-y-6"
                    >
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="name" className="label-base">
                            Full Name
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
                            Email Address
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
                          Subject
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
                          Message
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

                      <Button type="submit" size="lg" className="w-full gap-2" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
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
                      className="bg-card border rounded-2xl p-8 md:p-12 text-center space-y-4"
                    >
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                        <CheckCircle2 className="h-8 w-8 text-success" />
                      </div>
                      <h2 className="text-heading-md font-semibold">Message Sent!</h2>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Thank you for reaching out. We've received your message and will get back to you within 24
                        hours.
                      </p>
                      <Button variant="outline" onClick={() => setIsSubmitted(false)}>
                        Send Another Message
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </Container>
        </Section>

        {/* FAQ Quick Links */}
        <Section size="lg" background="muted">
          <Container>
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-heading-lg font-semibold">Quick Answers</h2>
              <p className="mt-3 text-muted-foreground">Check out our FAQ for instant answers to common questions.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { title: 'Billing & Payments', href: '/faq#billing', icon: <MessageCircle className="h-5 w-5" /> },
                { title: 'Course Access', href: '/faq#access', icon: <MessageCircle className="h-5 w-5" /> },
                { title: 'Technical Issues', href: '/faq#technical', icon: <MessageCircle className="h-5 w-5" /> },
              ].map((item) => (
                <Link
                  key={item.title}
                  to={item.href}
                  className="group p-6 rounded-2xl bg-card border hover:border-primary/50 hover:shadow-lg transition-all"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">Find answers quickly</p>
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      </div>
    </>
  );
}
