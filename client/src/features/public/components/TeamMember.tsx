import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Avatar } from '@/components/ui/avatar';
import { Linkedin, Twitter } from 'lucide-react';
import { OptimizedImage } from '@/components/common/OptimizedImage';

interface TeamMemberProps {
  name: string;
  role: string;
  bio?: string;
  avatar?: string;
  twitter?: string;
  linkedin?: string;
  className?: string;
}

export function TeamMember({ name, role, bio, avatar, twitter, linkedin, className }: TeamMemberProps) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={cn('group rounded-2xl bg-background border border-border shadow-sm hover:shadow-md p-6 text-center transition-all duration-300', className)}
    >
      <div className="mx-auto h-20 w-20 mb-4">
        <Avatar className="w-full h-full rounded-full">
          {avatar ? (
            <OptimizedImage src={avatar} alt={`Profile photo of ${name}`} placeholderType="avatar" className="object-cover" />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-primary/10 text-lg font-bold text-primary">
              {initials}
            </div>
          )}
        </Avatar>
      </div>
      <h3 className="font-semibold text-foreground">{name}</h3>
      <p className="text-sm font-medium text-primary mt-0.5">{role}</p>
      {bio && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{bio}</p>}
      {(twitter || linkedin) && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {twitter && (
            <a href={twitter} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/50 text-muted-foreground/70 hover:bg-primary/10 hover:text-primary transition-all">
              <Twitter className="h-4 w-4" />
            </a>
          )}
          {linkedin && (
            <a href={linkedin} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/50 text-muted-foreground/70 hover:bg-primary/10 hover:text-primary transition-all">
              <Linkedin className="h-4 w-4" />
            </a>
          )}
        </div>
      )}
    </motion.div>
  );
}
