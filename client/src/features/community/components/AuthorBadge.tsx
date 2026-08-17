import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, getInitials } from '@/lib/utils';
import type { ForumAuthor } from '@/types/community';

const ROLE_LABEL: Record<ForumAuthor['role'], string> = {
  student: 'Student',
  instructor: 'Instructor',
  admin: 'Admin',
};

const ROLE_CLASS: Record<ForumAuthor['role'], string> = {
  student: 'bg-muted/80 text-muted-foreground',
  instructor: 'bg-primary/10 text-primary',
  admin: 'bg-warning/10 text-warning',
};

export function AuthorBadge({
  author,
  size = 'sm',
  showRole = false,
  className,
}: {
  author?: ForumAuthor;
  size?: 'sm' | 'md';
  showRole?: boolean;
  className?: string;
}) {
  const fallback = getInitials(author?.name || 'Anonymous');
  const avatarClass = size === 'md' ? 'h-10 w-10' : 'h-8 w-8';
  const textClass = size === 'md' ? 'text-sm' : 'text-xs';

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Avatar className={cn(avatarClass, 'border border-border/60')}>
        {author?.avatar?.url ? (
          <AvatarImage src={author.avatar.url} alt={author?.name || 'Member'} />
        ) : null}
        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{fallback}</AvatarFallback>
      </Avatar>
      <span className="flex min-w-0 flex-col">
        <span className={cn('truncate font-medium text-foreground', textClass)}>{author?.name || 'Anonymous'}</span>
        {showRole && author && (
          <span
            className={cn(
              'inline-flex w-fit items-center rounded-full px-1.5 py-px text-[10px] font-medium leading-none',
              ROLE_CLASS[author.role] ?? ROLE_CLASS.student
            )}
          >
            {ROLE_LABEL[author.role] ?? 'Member'}
          </span>
        )}
      </span>
    </span>
  );
}