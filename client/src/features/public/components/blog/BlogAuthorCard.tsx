import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import type { BlogPost } from '@/types/blog';

interface BlogAuthorCardProps {
  author: BlogPost['author'];
}

/** Author card surfacing the author's avatar, name and bio when available. */
export function BlogAuthorCard({ author }: BlogAuthorCardProps) {
  const authorName = author?.name || 'NextEra';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col gap-4 rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-md sm:flex-row sm:items-start sm:gap-5">
        <Avatar className="h-16 w-16 shrink-0 border border-border/50">
          <AvatarImage src={author?.avatar?.url} alt={`Profile photo of ${authorName}`} />
          <AvatarFallback className="bg-muted text-lg font-semibold text-primary">
            {getInitials(authorName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Written by</p>
          <h2 className="mt-1 text-xl font-semibold text-foreground">{authorName}</h2>
          {author?.bio && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{author.bio}</p>}
        </div>
      </div>
    </motion.div>
  );
}