import { motion } from 'framer-motion';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import type { BlogPost } from '@/types/blog';

interface BlogFeaturedImageProps {
  blog: BlogPost;
}

/** Premium 16:9 featured image card shown below the article header. Falls
 *  back to the shared blog.jpg asset when the post has no featured image. */
export function BlogFeaturedImage({ blog }: BlogFeaturedImageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/30 shadow-lg shadow-primary/5 backdrop-blur-md">
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
          <OptimizedImage
            src={blog.featuredImage?.url || '/images/blog.jpg'}
            alt={`${blog.title} featured image`}
            placeholderType="blog"
            fallbackSrc="/images/blog.jpg"
            containerClassName="h-full w-full"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </motion.div>
  );
}