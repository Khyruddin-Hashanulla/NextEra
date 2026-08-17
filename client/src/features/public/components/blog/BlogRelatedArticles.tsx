import { motion } from 'framer-motion';
import { Section, Container } from '@/components/common/Section';
import { BlogCard } from '@/features/public/components/blog/BlogCard';
import type { BlogPost } from '@/types/blog';

interface BlogRelatedArticlesProps {
  posts: BlogPost[];
}

/** Related articles grid reusing the shared glass BlogCard. */
export function BlogRelatedArticles({ posts }: BlogRelatedArticlesProps) {
  if (posts.length === 0) return null;

  return (
    <Section size="md">
      <Container>
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="mb-8 text-2xl font-bold text-foreground">Related Articles</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.slice(0, 3).map((post, index) => (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className="h-full"
                >
                  <BlogCard blog={post} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </Container>
    </Section>
  );
}