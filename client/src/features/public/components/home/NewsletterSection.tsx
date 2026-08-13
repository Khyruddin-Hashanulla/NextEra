import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { NewsletterForm } from '../NewsletterForm';

export function NewsletterSection() {
  return (
    <section id="newsletter" className="py-16 sm:py-24">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-card via-card to-muted p-8 sm:p-12 lg:p-16"
        >
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -bottom-24 -right-16 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />
          </div>

          <div className="relative z-10 grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Send className="h-4 w-4" aria-hidden="true" />
                Weekly digest
              </span>
              <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl font-display">
                Get learning tips in your inbox
              </h2>
              <p className="mt-3 max-w-lg text-muted-foreground">
                Join thousands of students receiving hand-picked resources, career advice, and exclusive course
                discounts every week. Free, forever.
              </p>
            </div>

            <div>
              <NewsletterForm />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
