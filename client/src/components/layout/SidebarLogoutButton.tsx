import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface SidebarLogoutButtonProps {
  collapsed?: boolean;
}

export function SidebarLogoutButton({ collapsed = false }: SidebarLogoutButtonProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      addToast({ title: 'Logged out successfully', variant: 'success' });
      navigate(ROUTES.HOME);
    } catch {
      addToast({ title: 'Sign out failed', description: 'Please try again.', variant: 'error' });
    } finally {
      setLoggingOut(false);
    }
  }, [loggingOut, logout, addToast, navigate]);

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loggingOut}
      aria-busy={loggingOut}
      aria-label={loggingOut ? 'Logging out' : 'Logout'}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors',
        'hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        loggingOut && 'cursor-wait opacity-70',
        collapsed ? 'mx-auto h-10 w-10 justify-center px-0' : 'w-full'
      )}
    >
      {loggingOut ? (
        <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden="true" />
      ) : (
        <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
      )}
      {!collapsed && <span>{loggingOut ? 'Signing out...' : 'Logout'}</span>}
    </button>
  );
}
