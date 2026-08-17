import {
  BookOpen,
  Briefcase,
  Code2,
  Coffee,
  FileQuestion,
  FolderGit2,
  Globe,
  GraduationCap,
  Layers,
  Megaphone,
  MessageSquare,
  Server,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ForumCategorySlug } from '@/types/community';

export interface ForumCategoryMeta {
  slug: ForumCategorySlug;
  name: string;
  icon: LucideIcon;
  badgeClass: string;
}

export const FORUM_CATEGORY_META: Record<ForumCategorySlug, ForumCategoryMeta> = {
  general: { slug: 'general', name: 'General Discussion', icon: MessageSquare, badgeClass: 'bg-muted/80 text-muted-foreground' },
  programming: { slug: 'programming', name: 'Programming', icon: Code2, badgeClass: 'bg-primary/10 text-primary' },
  dsa: { slug: 'dsa', name: 'Data Structures & Algorithms', icon: Layers, badgeClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' },
  'web-development': { slug: 'web-development', name: 'Web Development', icon: Globe, badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  mern: { slug: 'mern', name: 'MERN Stack', icon: Server, badgeClass: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
  java: { slug: 'java', name: 'Java', icon: Coffee, badgeClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
  career: { slug: 'career', name: 'Career & Jobs', icon: Briefcase, badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  interviews: { slug: 'interviews', name: 'Interview Preparation', icon: FileQuestion, badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
  projects: { slug: 'projects', name: 'Projects', icon: FolderGit2, badgeClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400' },
  courses: { slug: 'courses', name: 'Courses', icon: GraduationCap, badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
  resources: { slug: 'resources', name: 'Learning Resources', icon: BookOpen, badgeClass: 'bg-lime-600/10 text-lime-700 dark:text-lime-400' },
  announcements: { slug: 'announcements', name: 'Announcements', icon: Megaphone, badgeClass: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400' },
};

export function ForumCategoryBadge({
  category,
  className,
}: {
  category: ForumCategorySlug;
  className?: string;
}) {
  const meta = FORUM_CATEGORY_META[category];
  const Icon = meta?.icon ?? MessageSquare;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        meta?.badgeClass ?? 'bg-muted/80 text-muted-foreground',
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {meta?.name ?? category}
    </span>
  );
}