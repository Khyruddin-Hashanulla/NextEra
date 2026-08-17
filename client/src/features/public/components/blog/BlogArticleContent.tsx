import { motion } from 'framer-motion';

interface BlogArticleContentProps {
  content: string;
}

/** Renders the article body as editorial paragraphs. Blog content is stored as
 *  plain text, so each newline-separated block becomes a paragraph. */
export function BlogArticleContent({ content }: BlogArticleContentProps) {
  const paragraphs = content.split('\n').filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      {paragraphs.map((paragraph, idx) => (
        <p key={idx} className="mb-6 text-base leading-relaxed text-foreground/80 sm:text-lg sm:leading-8">
          {paragraph}
        </p>
      ))}
    </motion.div>
  );
}