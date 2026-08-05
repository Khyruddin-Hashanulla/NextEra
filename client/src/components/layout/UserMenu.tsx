import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, LayoutDashboard, Loader2, LogOut, Settings, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import {
  getDashboardRoute,
  getMyCoursesRoute,
  getProfileRoute,
  getSettingsRoute,
  ROUTES,
} from '@/lib/constants';

export function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      addToast({ title: 'Logged out successfully', variant: 'success' });
      navigate(ROUTES.LOGIN);
    } catch {
      addToast({ title: 'Sign out failed', description: 'Please try again.', variant: 'error' });
    } finally {
      setLoggingOut(false);
    }
  }, [loggingOut, logout, addToast, navigate]);

  if (!user) return null;

  const role = user.role;
  const menuItems = [
    { label: 'Profile', icon: User, to: getProfileRoute(role) },
    { label: 'Dashboard', icon: LayoutDashboard, to: getDashboardRoute(role) },
    { label: 'My Courses', icon: BookOpen, to: getMyCoursesRoute(role) },
    { label: 'Settings', icon: Settings, to: getSettingsRoute(role) },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={`Account menu for ${user.name}`}
        >
          <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground text-xs font-semibold">
            {user.avatar?.url ? (
              <img src={user.avatar.url} alt="" className="h-full w-full object-cover" />
            ) : (
              user.name?.charAt(0).toUpperCase()
            )}
          </div>
          <span className="hidden lg:inline">{user.name}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {menuItems.map((item) => (
          <DropdownMenuItem key={item.label} asChild>
            <Link to={item.to} className="gap-2">
              <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {item.label}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2 text-destructive focus:text-destructive"
          disabled={loggingOut}
          onSelect={(event) => {
            event.preventDefault();
            handleLogout();
          }}
        >
          {loggingOut ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
          ) : (
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          {loggingOut ? 'Signing out...' : 'Logout'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
