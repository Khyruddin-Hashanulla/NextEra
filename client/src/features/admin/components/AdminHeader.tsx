import { useAuth } from '@/providers/AuthProvider';

interface AdminHeaderProps {
  title: string;
  description?: string;
}

export function AdminHeader({ title, description }: AdminHeaderProps) {
  const { user } = useAuth();

  return (
    <div className="flex items-center justify-between border-b pb-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <span className="hidden sm:inline">{user?.name}</span>
        </div>
      </div>
    </div>
  );
}
